<?php
// app/Http/Controllers/Api/AccountController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Installment;
use App\Models\EmployeeAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        // ✅ FIX: 'installments' relation add ki — pehle ye missing thi, isliye
        // /api/accounts list call pe har account ki installments khaali aati thi
        // aur frontend (UsersManagement.jsx) mein overdue/aging status ki jagah
        // hamesha "Active" dikhta tha (empty-list fallback chal jata tha).
        $query = Account::with(['customer', 'branch', 'creator', 'employeeAccount', 'employeeAccount.employee', 'installments']);

        if ($request->search) {
            $query->where('case_no', 'LIKE', "%{$request->search}%")
                  ->orWhere('product_name', 'LIKE', "%{$request->search}%")
                  ->orWhereHas('customer', function($q) use ($request) {
                      $q->where('name', 'LIKE', "%{$request->search}%")
                        ->orWhere('cnic', 'LIKE', "%{$request->search}%");
                  });
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->payment_type) {
            $query->where('payment_type', $request->payment_type);
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        // ✅ FIX: employee_id filter missing tha — isi wajah se Salary.jsx ka
        // fallback fetch (jab accounts_count === 0 hota tha) har employee ke
        // liye TOTAL system accounts return kar raha tha, uske apne accounts
        // nahi. Ab sirf us employee ke accounts hi filter ho kar aayenge.
        if ($request->employee_id) {
            $employeeId = $request->employee_id;
            $query->whereHas('employeeAccount', function ($q) use ($employeeId) {
                $q->where('employee_id', $employeeId);
            });
        }

        $accounts = $query->orderBy('id', 'desc')->paginate(20);
        return $this->sendResponse($accounts, 'Accounts retrieved successfully');
    }

    public function show($id)
    {
        $account = Account::with([
            'customer', 
            'branch', 
            'creator',
            'employeeAccount',
            'employeeAccount.employee',
            'installments' => function($q) {
                $q->orderBy('month', 'desc');
            },
            'recoveries'
        ])->find($id);

        if (!$account) {
            return $this->sendError('Account not found', 404);
        }

        return $this->sendResponse($account, 'Account details retrieved');
    }

    // ✅ FIXED: Store - Case number generated sequentially
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'required|exists:customers,id',
            'product_name' => 'nullable|string|max:255',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'balance' => 'nullable|numeric|min:0',
            'monthly_installment' => 'required|numeric|min:0',
            'invoice_price' => 'nullable|numeric|min:0',
            'advance_amount' => 'nullable|numeric|min:0',
            'total_installments' => 'required|integer|min:1',
            'installments_paid' => 'nullable|integer|min:0',
            'due_date' => 'required|date',
            'next_due_date' => 'nullable|date',
            'payment_type' => 'nullable|in:installment,cash',
            'status' => 'nullable|in:active,hold,paid,closed',
            'branch_id' => 'required|exists:branches,id',
            'created_by' => 'required|exists:users,id',
            'employee_account_id' => 'nullable|exists:employee_accounts,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            // ============================================
            // ✅ FIX: Chalan images ab seedha public_path('storage/...')
            // mein move hoti hain (jaisa CustomerController::store() mein
            // CNIC/Bill/Additional images ke liye hota hai), Storage disk
            // facade ke bajaye. Pehle yahan Storage::disk('public') use
            // hota tha jo storage/app/public mein file save karta hai —
            // wo sirf tab public URL se accessible hoti hai jab
            // `php artisan storage:link` symlink already bana ho. Agar
            // symlink missing/broken ho to chalan images "no image"
            // dikhti thi jabke DB mein path sahi save ho raha tha.
            // Ab dono jagah (store aur update) same tareeqa use ho raha
            // hai — koi symlink dependency nahi rahi.
            // ============================================

            // Handle Chalan Front Upload
            $chalanFrontPath = null;
            if ($request->hasFile('chalan_front')) {
                $file = $request->file('chalan_front');
                $destinationPath = public_path('storage/accounts/chalan_front');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_chalan_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $chalanFrontPath = 'accounts/chalan_front/' . $filename;
            } elseif ($request->chalan_front && $request->chalan_front !== 'null') {
                $chalanFrontPath = $request->chalan_front;
            }

            // Handle Chalan Back Upload
            $chalanBackPath = null;
            if ($request->hasFile('chalan_back')) {
                $file = $request->file('chalan_back');
                $destinationPath = public_path('storage/accounts/chalan_back');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_chalan_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $chalanBackPath = 'accounts/chalan_back/' . $filename;
            } elseif ($request->chalan_back && $request->chalan_back !== 'null') {
                $chalanBackPath = $request->chalan_back;
            }

            $paidAmount = $request->paid_amount ?? 0;
            $balance = $request->total_amount - $paidAmount;
            $installmentsPaid = $request->installments_paid ?? 0;

            // ✅ Get or create employee_account_id
            $employeeAccountId = $request->employee_account_id;
            
            if (!$employeeAccountId) {
                $employeeAccount = EmployeeAccount::where('customer_id', $request->customer_id)
                    ->where('branch_id', $request->branch_id)
                    ->first();
                
                if ($employeeAccount) {
                    $employeeAccountId = $employeeAccount->id;
                } else {
                    $newEmployeeAccount = EmployeeAccount::create([
                        'employee_id' => $request->employee_id ?? $request->created_by,
                        'customer_id' => $request->customer_id,
                        'branch_id' => $request->branch_id,
                        'account_opened_date' => now(),
                        'month' => now()->format('Y-m'),
                        'year' => now()->format('Y'),
                        'status' => 'active',
                        'created_by' => $request->created_by,
                    ]);
                    $employeeAccountId = $newEmployeeAccount->id;
                }
            }

            // ✅ GENERATE SEQUENTIAL CASE NUMBER
            $lastAccount = Account::orderBy('id', 'desc')->first();
            $lastNumber = 0;
            
            if ($lastAccount && $lastAccount->case_no) {
                $parts = explode('-', $lastAccount->case_no);
                if (isset($parts[1])) {
                    $lastNumber = intval($parts[1]);
                }
            }
            
            $newNumber = str_pad($lastNumber + 1, 6, '0', STR_PAD_LEFT);
            $caseNo = 'SR-' . $newNumber;

            // ✅ Create Account with generated case number
            $account = Account::create([
                'customer_id' => $request->customer_id,
                'product_name' => $request->product_name,
                'chalan_front' => $chalanFrontPath,
                'chalan_back' => $chalanBackPath,
                'case_no' => $caseNo,
                'total_amount' => $request->total_amount,
                'paid_amount' => $paidAmount,
                'balance' => $balance,
                'monthly_installment' => $request->monthly_installment,
                'invoice_price' => $request->invoice_price ?? $request->total_amount,
                'advance_amount' => $request->advance_amount ?? 0,
                'total_installments' => $request->total_installments,
                'installments_paid' => $installmentsPaid,
                'due_date' => $request->due_date,
                'next_due_date' => $request->next_due_date ?? $request->due_date,
                'payment_type' => $request->payment_type ?? 'installment',
                'status' => $request->status ?? 'active',
                'branch_id' => $request->branch_id,
                'created_by' => $request->created_by,
                'employee_account_id' => $employeeAccountId,
            ]);

            // ✅ FIXED: Generate Installments - Due date se start (1 month aage nahi)
            $monthly = $request->monthly_installment;
            $totalMonths = $request->total_installments;
            $startDate = date('Y-m', strtotime($request->due_date));

            // ✅ FIX: $i + 0 months (due date wala month hi pehla installment)
            for ($i = 0; $i < $totalMonths; $i++) {
                $month = date('Y-m', strtotime('+' . $i . ' months', strtotime($startDate . '-01')));
                $due = $monthly;

                // ✅ FIX: 'due_date' pehle is create() call mein missing thi,
                // isliye har naye account (isi store() route se bane) ki
                // saari installments due_date = NULL ke sath ban rahi thin.
                // Ab exact due date save hogi — account ke original due_date
                // wala "din" (day-of-month) preserve karte hue, har agle
                // mahine ke liye +$i months add kar ke.
                $exactDueDate = new \DateTime($request->due_date);
                $exactDueDate->modify('+' . $i . ' months');

                Installment::create([
                    'account_id' => $account->id,
                    'month' => $month,
                    'due_date' => $exactDueDate->format('Y-m-d'), // ✅ ADDED
                    'due_amount' => $due,
                    'paid_amount' => 0,
                    'balance' => $due,
                    'status' => 'unpaid',
                    'payment_date' => null,
                    'description' => "Installment " . ($i + 1) . " - " . date('F Y', strtotime($month . '-01'))
                ]);
            }

            DB::commit();
            
            return $this->sendResponse(
                $account->load(['customer', 'branch', 'creator', 'employeeAccount', 'employeeAccount.employee', 'installments']), 
                'Account created successfully', 
                201
            );
            
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to create account: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ UPDATED: Account update — ab text fields ke sath
    // chalan_front / chalan_back images bhi replace ho sakti hain.
    // Purani image file (agar mojood hai) delete karke nayi
    // upload hoti hai aur naya path DB mein save hota hai.
    //
    // Frontend se yeh call POST + FormData ke sath karni hai
    // (aur FormData mein '_method' => 'PUT' bhejna hai), kyunke
    // multipart/form-data files ke sath direct PUT request
    // Laravel mein reliably parse nahi hoti.
    //
    // ✅ FIX: Pehle yahan Storage::disk('public') facade use hota
    // tha (storeAs/exists/delete), jo storage/app/public folder
    // mein file save karta hai. Wo path sirf tab public URL se
    // accessible hota hai jab `php artisan storage:link` symlink
    // pehle se bana ho. Agar symlink missing/broken ho (jaisa is
    // server pe tha) to naye/edit-shuda chalan images "No Image"
    // dikhti thin — chahe DB mein path bilkul sahi save ho raha ho.
    //
    // Ab yahan bhi wahi tareeqa use ho raha hai jo CustomerController
    // aur AccountController::store() mein CNIC/Bill/Chalan images ke
    // liye already istemal ho raha hai: seedha public_path('storage/...')
    // mein move() karna. Isse edit ke baad bhi chalan images turant
    // aur reliably show hongi, symlink ki zaroorat khatam.
    // ============================================
    public function update(Request $request, $id)
    {
        $account = Account::find($id);
        if (!$account) {
            return $this->sendError('Account not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:active,hold,paid,closed',
            'paid_amount' => 'nullable|numeric|min:0',
            'installments_paid' => 'nullable|integer|min:0',
            'balance' => 'nullable|numeric|min:0',
            'due_date' => 'nullable|date',
            'product_name' => 'nullable|string|max:255',
            'employee_account_id' => 'nullable|exists:employee_accounts,id',
            'chalan_front' => 'nullable|file|image|max:10240',
            'chalan_back' => 'nullable|file|image|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        if ($request->has('paid_amount')) {
            $balance = $account->total_amount - $request->paid_amount;
            $request->merge(['balance' => $balance]);
        }

        // ✅ Sirf allowed text/numeric fields fill karo (files alag se handle honge)
        $account->fill($request->only([
            'status',
            'paid_amount',
            'installments_paid',
            'balance',
            'due_date',
            'product_name',
            'employee_account_id',
        ]));

        // ============================================
        // ✅ FIX: Helper — purani chalan image delete karke nayi
        // save karo, ab public_path() pattern se (Storage disk
        // facade ke bajaye) — store() aur CustomerController jaisa
        // consistent tareeqa, symlink pe depend nahi karta.
        // ============================================
        $replaceChalanFile = function ($fieldName, $folder, $prefix) use ($request, $account) {
            if ($request->hasFile($fieldName)) {
                // Purani file (agar mojood hai) delete karo
                if ($account->{$fieldName} && file_exists(public_path('storage/' . $account->{$fieldName}))) {
                    @unlink(public_path('storage/' . $account->{$fieldName}));
                }

                $file = $request->file($fieldName);
                $destinationPath = public_path('storage/' . $folder);
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_' . $prefix . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $account->{$fieldName} = $folder . '/' . $filename;
            }
        };

        $replaceChalanFile('chalan_front', 'accounts/chalan_front', 'chalan_front');
        $replaceChalanFile('chalan_back', 'accounts/chalan_back', 'chalan_back');

        $account->save();

        if ($account->balance <= 0) {
            $account->update(['status' => 'paid']);
        }

        return $this->sendResponse(
            $account->load(['customer', 'branch', 'creator', 'employeeAccount', 'employeeAccount.employee']), 
            'Account updated successfully'
        );
    }

    public function destroy($id)
    {
        $account = Account::find($id);
        if (!$account) {
            return $this->sendError('Account not found', 404);
        }

        if ($account->installments()->where('paid_amount', '>', 0)->exists()) {
            return $this->sendError('Cannot delete account with paid installments', 422);
        }

        $account->delete();
        return $this->sendResponse(null, 'Account deleted successfully');
    }

    public function getCustomerAccounts($customerId)
    {
        $customer = \App\Models\Customer::find($customerId);
        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        $accounts = Account::with(['branch', 'creator', 'employeeAccount', 'employeeAccount.employee', 'installments'])
            ->where('customer_id', $customerId)
            ->orderBy('id', 'desc')
            ->get();

        return $this->sendResponse($accounts, 'Customer accounts retrieved');
    }

    public function getStats(Request $request)
    {
        $query = Account::query();

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $stats = [
            'total_accounts' => $query->count(),
            'active_accounts' => (clone $query)->where('status', 'active')->count(),
            'hold_accounts' => (clone $query)->where('status', 'hold')->count(),
            'paid_accounts' => (clone $query)->where('status', 'paid')->count(),
            'closed_accounts' => (clone $query)->where('status', 'closed')->count(),
            'total_receivable' => (clone $query)->sum('balance'),
            'total_paid' => (clone $query)->sum('paid_amount'),
            'total_installments' => (clone $query)->sum('total_installments'),
            'installments_paid' => (clone $query)->sum('installments_paid'),
        ];

        return $this->sendResponse($stats, 'Account statistics retrieved');
    }

    public function sendResponse($data, $message = 'Success', $statusCode = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    public function sendError($message, $statusCode = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $statusCode);
    }
}