<?php
// app/Http/Controllers/Api/AccountController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Customer;
use App\Models\Installment;
use App\Models\EmployeeAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AccountController extends Controller
{
    /**
     * Send success response
     */
    public function sendResponse($data, $message = 'Success', $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    /**
     * Send error response
     */
    public function sendError($message, $code = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $code);
    }

    // ============================================
    // ✅ INDEX - Get all accounts with filters
    // ============================================
    public function index(Request $request)
    {
        try {
            $query = Account::with([
                'customer',
                'creator',
                'employeeAccount.employee',
                'installments'
            ]);

            // Filter by branch
            if ($request->branch_id) {
                $query->where('branch_id', $request->branch_id);
            }

            // Filter by employee (created_by)
            if ($request->employee_id) {
                $query->where('created_by', $request->employee_id);
            }

            // Filter by status
            if ($request->status) {
                $query->where('status', $request->status);
            }

            // Filter by date range
            if ($request->start_date) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            // Search
            if ($request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('case_no', 'LIKE', "%{$search}%")
                      ->orWhere('product_name', 'LIKE', "%{$search}%")
                      ->orWhereHas('customer', function($sub) use ($search) {
                          $sub->where('name', 'LIKE', "%{$search}%")
                              ->orWhere('cnic', 'LIKE', "%{$search}%")
                              ->orWhere('phone', 'LIKE', "%{$search}%");
                      });
                });
            }

            // Pagination
            $perPage = $request->per_page ?? 20;
            $accounts = $query->orderBy('id', 'desc')->paginate($perPage);

            // Calculate additional fields
            $accounts->getCollection()->transform(function ($account) {
                $account->installments_paid = $account->installments->where('balance', '<=', 0)->count();
                $account->installments_total = $account->installments->count();
                return $account;
            });

            return $this->sendResponse($accounts, 'Accounts retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ GET EMPLOYEE COUNT - For Account Target
    // ============================================
    public function getEmployeeCount(Request $request)
    {
        try {
            $employeeId = $request->get('employee_id');
            $month = $request->get('month', date('Y-m'));
            
            if (!$employeeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee ID is required'
                ], 400);
            }
            
            // Current month accounts
            $currentMonth = Account::where('created_by', $employeeId)
                ->whereMonth('created_at', substr($month, 5, 2))
                ->whereYear('created_at', substr($month, 0, 4))
                ->count();
                
            // Total accounts all time
            $total = Account::where('created_by', $employeeId)->count();
                    
            return response()->json([
                'success' => true,
                'current_month' => $currentMonth,
                'total' => $total
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ SHOW - Get single account
    // ============================================
    public function show($id)
    {
        try {
            $account = Account::with([
                'customer',
                'creator',
                'employeeAccount.employee',
                'installments'
            ])->find($id);

            if (!$account) {
                return $this->sendError('Account not found', 404);
            }

            // Calculate installments stats
            $account->installments_paid = $account->installments->where('balance', '<=', 0)->count();
            $account->installments_total = $account->installments->count();

            return $this->sendResponse($account, 'Account retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ STORE - Create new account
    // ============================================
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'customer_id' => 'required|exists:customers,id',
                'branch_id' => 'required|exists:branches,id',
                'product_name' => 'required|string|max:255',
                'total_amount' => 'required|numeric|min:0',
                'monthly_installment' => 'required|numeric|min:0',
                'total_installments' => 'required|integer|min:1',
                'down_payment' => 'nullable|numeric|min:0',
                'case_no' => 'nullable|string|max:50',
                'remarks' => 'nullable|string',
                'chalan_front' => 'nullable|image|mimes:jpg,jpeg,png,pdf|max:5120',
                'chalan_back' => 'nullable|image|mimes:jpg,jpeg,png,pdf|max:5120',
            ]);

            if ($validator->fails()) {
                return $this->sendError($validator->errors()->first(), 422);
            }

            $user = auth()->user();
            
            // Generate case number if not provided
            $caseNo = $request->case_no ?? $this->generateCaseNumber();

            // Calculate paid amount and balance
            $downPayment = $request->down_payment ?? 0;
            $totalAmount = $request->total_amount;
            $paidAmount = $downPayment;
            $balance = $totalAmount - $paidAmount;

            // Create account
            $account = Account::create([
                'customer_id' => $request->customer_id,
                'branch_id' => $request->branch_id,
                'product_name' => $request->product_name,
                'total_amount' => $totalAmount,
                'monthly_installment' => $request->monthly_installment,
                'total_installments' => $request->total_installments,
                'down_payment' => $downPayment,
                'paid_amount' => $paidAmount,
                'balance' => $balance,
                'case_no' => $caseNo,
                'remarks' => $request->remarks,
                'status' => 'active',
                'created_by' => $user->id,
            ]);

            // Upload chalan images
            if ($request->hasFile('chalan_front')) {
                $path = $request->file('chalan_front')->store('accounts/chalan', 'public');
                $account->chalan_front = $path;
            }
            if ($request->hasFile('chalan_back')) {
                $path = $request->file('chalan_back')->store('accounts/chalan', 'public');
                $account->chalan_back = $path;
            }
            $account->save();

            // Create employee account entry
            EmployeeAccount::create([
                'employee_id' => $user->id,
                'customer_id' => $request->customer_id,
                'account_id' => $account->id,
                'branch_id' => $request->branch_id,
                'month' => date('Y-m'),
                'account_opened_date' => now(),
                'status' => 'active',
            ]);

            // Create installments
            $this->createInstallments($account);

            return $this->sendResponse($account, 'Account created successfully', 201);

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ UPDATE - Update account
    // ============================================
    public function update(Request $request, $id)
    {
        try {
            $account = Account::find($id);
            if (!$account) {
                return $this->sendError('Account not found', 404);
            }

            $validator = Validator::make($request->all(), [
                'product_name' => 'sometimes|string|max:255',
                'total_amount' => 'sometimes|numeric|min:0',
                'monthly_installment' => 'sometimes|numeric|min:0',
                'total_installments' => 'sometimes|integer|min:1',
                'remarks' => 'nullable|string',
                'status' => 'nullable|in:active,hold,paid,closed',
                'chalan_front' => 'nullable|image|mimes:jpg,jpeg,png,pdf|max:5120',
                'chalan_back' => 'nullable|image|mimes:jpg,jpeg,png,pdf|max:5120',
            ]);

            if ($validator->fails()) {
                return $this->sendError($validator->errors()->first(), 422);
            }

            // Update account
            $account->update($request->except(['chalan_front', 'chalan_back']));

            // Upload chalan images
            if ($request->hasFile('chalan_front')) {
                if ($account->chalan_front && \Storage::disk('public')->exists($account->chalan_front)) {
                    \Storage::disk('public')->delete($account->chalan_front);
                }
                $path = $request->file('chalan_front')->store('accounts/chalan', 'public');
                $account->chalan_front = $path;
            }
            if ($request->hasFile('chalan_back')) {
                if ($account->chalan_back && \Storage::disk('public')->exists($account->chalan_back)) {
                    \Storage::disk('public')->delete($account->chalan_back);
                }
                $path = $request->file('chalan_back')->store('accounts/chalan', 'public');
                $account->chalan_back = $path;
            }
            $account->save();

            return $this->sendResponse($account, 'Account updated successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ DESTROY - Delete account
    // ============================================
    public function destroy($id)
    {
        try {
            $account = Account::find($id);
            if (!$account) {
                return $this->sendError('Account not found', 404);
            }

            // Delete chalan images
            if ($account->chalan_front && \Storage::disk('public')->exists($account->chalan_front)) {
                \Storage::disk('public')->delete($account->chalan_front);
            }
            if ($account->chalan_back && \Storage::disk('public')->exists($account->chalan_back)) {
                \Storage::disk('public')->delete($account->chalan_back);
            }

            // Delete installments
            Installment::where('account_id', $account->id)->delete();

            // Delete employee account
            EmployeeAccount::where('account_id', $account->id)->delete();

            $account->delete();

            return $this->sendResponse(null, 'Account deleted successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ PRIVATE: Generate case number
    // ============================================
    private function generateCaseNumber()
    {
        $last = Account::orderBy('id', 'desc')->first();
        $number = $last ? intval(substr($last->case_no, 3)) + 1 : 1;
        return 'SR-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    // ============================================
    // ✅ PRIVATE: Create installments
    // ============================================
    private function createInstallments($account)
    {
        $installments = [];
        $monthlyAmount = $account->monthly_installment;
        $totalAmount = $account->total_amount - ($account->down_payment ?? 0);
        $totalInstallments = $account->total_installments;

        // Calculate remaining amount after down payment
        $remainingAmount = $totalAmount;
        $lastInstallmentAmount = 0;

        for ($i = 1; $i <= $totalInstallments; $i++) {
            if ($i == $totalInstallments) {
                // Last installment - adjust for rounding
                $amount = $remainingAmount;
            } else {
                $amount = $monthlyAmount;
                $remainingAmount -= $monthlyAmount;
            }

            $dueDate = now()->addMonths($i - 1)->format('Y-m-d');
            $month = now()->addMonths($i - 1)->format('Y-m');

            $installments[] = [
                'account_id' => $account->id,
                'month' => $month,
                'due_date' => $dueDate,
                'due_amount' => $amount,
                'paid_amount' => 0,
                'balance' => $amount,
                'status' => 'unpaid',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Installment::insert($installments);
    }
}