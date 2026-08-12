<?php
// app/Http/Controllers/Api/InstallmentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class InstallmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Installment::with([
            'account.customer', 
            'account.branch',
            'account.creator',
            'account.employeeAccount',
            'account.employeeAccount.employee'
        ]);

        if ($request->account_id) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->month) {
            $query->where('month', $request->month);
        }

        if ($request->branch_id) {
            $query->whereHas('account', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        if ($request->employee_id) {
            $query->whereHas('account', function($q) use ($request) {
                $q->where('employee_account_id', $request->employee_id);
            });
        }

        if ($request->search) {
            $search = $request->search;
            $query->whereHas('account.customer', function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('cnic', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            })->orWhereHas('account', function($q) use ($search) {
                $q->where('case_no', 'LIKE', "%{$search}%")
                  ->orWhere('product_name', 'LIKE', "%{$search}%");
            });
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $installments = $query->orderBy('month', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $installments
        ]);
    }

    public function show($id)
    {
        $installment = Installment::with([
            'account.customer', 
            'account.branch', 
            'account.creator', 
            'account.employeeAccount', 
            'account.employeeAccount.employee'
        ])->find($id);

        if (!$installment) {
            return response()->json([
                'success' => false,
                'message' => 'Installment not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $installment
        ]);
    }

    public function payInstallment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'installment_id' => 'required|exists:installments,id',
            'amount' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'slip_no' => 'nullable|string|max:255|unique:installments,slip_no', // ✅ ADDED
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $installment = Installment::find($request->installment_id);

            if ($installment->status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'This installment is already paid'
                ], 422);
            }

            $amount = $request->amount ?? $installment->balance;

            if ($amount > $installment->balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Amount cannot exceed balance'
                ], 422);
            }

            $newPaidAmount = $installment->paid_amount + $amount;
            $newBalance = $installment->due_amount - $newPaidAmount;
            
            if ($newBalance <= 0) {
                $status = 'paid';
            } elseif ($newPaidAmount > 0) {
                $status = 'partial';
            } else {
                $status = 'unpaid';
            }

            $paymentDate = $request->payment_date ?? date('Y-m-d');

            $installment->update([
                'paid_amount' => $newPaidAmount,
                'balance' => $newBalance,
                'status' => $status,
                'payment_date' => $paymentDate,
                'remarks' => $request->remarks ?? $installment->remarks,
                'slip_no' => $request->slip_no ?? $installment->slip_no, // ✅ ADDED
            ]);

            $account = Account::find($installment->account_id);
            if ($account) {
                $newAccountPaid = $account->paid_amount + $amount;
                $newAccountBalance = $account->total_amount - $newAccountPaid;

                $account->update([
                    'paid_amount' => $newAccountPaid,
                    'balance' => $newAccountBalance,
                    'installments_paid' => Installment::where('account_id', $account->id)
                        ->where('paid_amount', '>', 0)->count(),
                    'last_payment_date' => $paymentDate,
                    'status' => $newAccountBalance <= 0 ? 'paid' : 'active'
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Installment paid successfully',
                'data' => $installment->load([
                    'account.customer', 
                    'account.branch', 
                    'account.creator', 
                    'account.employeeAccount', 
                    'account.employeeAccount.employee'
                ])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Payment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ SINGLE-MONTH PAYMENT — STRICT AMOUNT + SEQUENCE LOCK + UNIQUE SLIP NO
    // ============================================
    public function partialPay(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'installment_id' => 'required|exists:installments,id',
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'slip_no' => 'nullable|string|max:255|unique:installments,slip_no',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
                'message' => $validator->errors()->first()
            ], 422);
        }

        DB::beginTransaction();

        try {
            $installment = Installment::find($request->installment_id);

            if (!$installment) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Installment not found'
                ], 404);
            }

            $amount = (float) ($request->paid_amount ?? 0);

            // ============================================
            // ✅ REMARKS-ONLY UPDATE (amount 0 ya khaali)
            // ============================================
            if ($amount <= 0) {
                $installment->update([
                    'remarks' => $request->remarks ?? $installment->remarks,
                    'slip_no' => $request->slip_no ?? $installment->slip_no,
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Remarks updated successfully',
                    'data' => $installment->load([
                        'account.customer',
                        'account.branch',
                        'account.creator',
                        'account.employeeAccount',
                        'account.employeeAccount.employee'
                    ]),
                    'amount_paid' => 0,
                    'new_balance' => $installment->balance,
                    'status' => $installment->status
                ]);
            }

            if ($installment->status === 'paid') {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'This installment is already paid'
                ], 422);
            }

            // ✅ SEQUENCE LOCK
            $earliestUnpaid = Installment::where('account_id', $installment->account_id)
                ->where('balance', '>', 0)
                ->orderBy('month', 'asc')
                ->orderBy('id', 'asc')
                ->first();

            if ($earliestUnpaid && $earliestUnpaid->id !== $installment->id) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Installments must be paid in order. Please clear the earlier due month first: ' . $earliestUnpaid->month,
                    'oldest_unpaid_month' => $earliestUnpaid->month
                ], 422);
            }

            // ✅ AMOUNT LOCK
            if ($amount > $installment->balance) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Amount cannot exceed this month\'s remaining balance',
                    'max_payable' => $installment->balance
                ], 422);
            }

            $newPaidAmount = $installment->paid_amount + $amount;
            $newBalance = $installment->due_amount - $newPaidAmount;

            if ($newBalance <= 0) {
                $status = 'paid';
            } elseif ($newPaidAmount > 0) {
                $status = 'partial';
            } else {
                $status = 'unpaid';
            }

            $paymentDate = $request->payment_date ?? date('Y-m-d');

            $installment->update([
                'paid_amount' => $newPaidAmount,
                'balance' => $newBalance,
                'status' => $status,
                'payment_date' => $paymentDate,
                'remarks' => $request->remarks ?? $installment->remarks,
                'slip_no' => $request->slip_no ?? $installment->slip_no,
            ]);

            $account = Account::find($installment->account_id);
            if ($account) {
                $newAccountPaid = $account->paid_amount + $amount;
                $newAccountBalance = $account->total_amount - $newAccountPaid;

                $account->update([
                    'paid_amount' => $newAccountPaid,
                    'balance' => $newAccountBalance,
                    'installments_paid' => Installment::where('account_id', $account->id)
                        ->where('paid_amount', '>', 0)->count(),
                    'last_payment_date' => $paymentDate,
                    'status' => $newAccountBalance <= 0 ? 'paid' : 'active'
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully',
                'data' => $installment->load([
                    'account.customer', 
                    'account.branch', 
                    'account.creator', 
                    'account.employeeAccount', 
                    'account.employeeAccount.employee'
                ]),
                'amount_paid' => $amount,
                'new_balance' => $newBalance,
                'status' => $status
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Payment failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ UPDATED — due_date-based overdue check
    // 🔧 FIX: '<' ko '<=' kar diya hai. Pehle due_date ke din khud
    // (jaise agar due_date 11 hai to 11 tarikh ko) installment
    // overdue list mein NAHI aati thi — sirf 12 tarikh se aati thi.
    // Ab due_date wala din shuru hote hi (agar us din 1 rupiya bhi
    // pay nahi hua), installment turant overdue/aging mein aayegi.
    // ============================================
    public function overdue(Request $request)
    {
        $today = Carbon::today();

        $query = Installment::with([
            'account.customer', 
            'account.branch', 
            'account.creator', 
            'account.employeeAccount', 
            'account.employeeAccount.employee'
        ])
        ->whereIn('status', ['unpaid', 'partial'])
        ->whereNotNull('due_date')
        ->whereDate('due_date', '<=', $today); // ✅ FIX: '<' se '<=' kar diya

        if ($request->branch_id) {
            $query->whereHas('account', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        $overdue = $query->orderBy('due_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $overdue,
            'count' => $overdue->count()
        ]);
    }

    // ============================================
    // ✅ UPDATED — due_date-based aging with 1M/2M/3M/Overdue buckets
    // 🔧 FIX: '<' ko '<=' kar diya hai (overdue() jaisa hi fix) —
    // taake due_date wale din hi (agar payment na ho) installment
    // aging report mein aa jaye, 1 din late na ho.
    // ============================================
    public function agingReport(Request $request)
    {
        $branchId = $request->branch_id;
        $today = Carbon::today();

        $query = Installment::with([
            'account.customer', 
            'account.branch', 
            'account.creator', 
            'account.employeeAccount', 
            'account.employeeAccount.employee'
        ])
        ->whereIn('status', ['unpaid', 'partial'])
        ->whereNotNull('due_date')
        ->whereDate('due_date', '<=', $today); // ✅ FIX: '<' se '<=' kar diya

        if ($branchId) {
            $query->whereHas('account', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $installments = $query->get();

        $data = $installments->map(function($item) use ($today) {
            $dueDate = Carbon::parse($item->due_date);
            $overdueDays = $dueDate->diffInDays($today);

            // Bucket by number of months overdue (1M / 2M / 3M / Overdue)
            if ($overdueDays <= 30) {
                $level = '1M';
                $color = '#eab308'; // yellow
            } elseif ($overdueDays <= 60) {
                $level = '2M';
                $color = '#f97316'; // orange
            } elseif ($overdueDays <= 90) {
                $level = '3M';
                $color = '#ef4444'; // red
            } else {
                $level = 'Overdue';
                $color = '#7f1d1d'; // dark red
            }

            return [
                'id' => $item->id,
                'customer_name' => $item->account->customer->name ?? 'N/A',
                'customer_cnic' => $item->account->customer->cnic ?? 'N/A',
                'customer_phone' => $item->account->customer->phone ?? 'N/A',
                'case_no' => $item->account->case_no ?? 'N/A',
                'month' => $item->month,
                'due_date' => $item->due_date,
                'due_amount' => (float) $item->due_amount,
                'paid_amount' => (float) $item->paid_amount,
                'balance' => (float) $item->balance,
                'slip_no' => $item->slip_no,
                'overdue_days' => $overdueDays,
                'level' => $level,
                'color' => $color,
                'status' => $item->status,
                'account' => [
                    'id' => $item->account->id,
                    'total_amount' => $item->account->total_amount,
                    'paid_amount' => $item->account->paid_amount,
                    'balance' => $item->account->balance,
                    'product_name' => $item->account->product_name,
                ]
            ];
        });

        $summary = [
            'total_installments' => $data->count(),
            'total_due' => $data->sum('due_amount'),
            'total_paid' => $data->sum('paid_amount'),
            'total_balance' => $data->sum('balance'),
            'bucket_1m' => $data->where('level', '1M')->count(),
            'bucket_2m' => $data->where('level', '2M')->count(),
            'bucket_3m' => $data->where('level', '3M')->count(),
            'bucket_overdue' => $data->where('level', 'Overdue')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
            'summary' => $summary
        ]);
    }

    public function getByAccount($accountId)
    {
        $installments = Installment::with([
            'account.customer', 
            'account.branch', 
            'account.creator', 
            'account.employeeAccount', 
            'account.employeeAccount.employee'
        ])
        ->where('account_id', $accountId)
        ->orderBy('month', 'asc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $installments
        ]);
    }

    public function getAccountDetails($accountId)
    {
        $account = Account::with([
            'customer.guarantors',
            'customer.creator',
            'branch',
            'installments',
            'creator',
            'employeeAccount',
            'employeeAccount.employee'
        ])->find($accountId);

        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Account not found'
            ], 404);
        }

        $response = $account->toArray();
        
        if ($account->employeeAccount && $account->employeeAccount->employee) {
            $response['employee_name'] = $account->employeeAccount->employee->name;
            $response['employee_id'] = $account->employeeAccount->employee_id;
            $response['employee_account_id'] = $account->employeeAccount->id;
        } else {
            $response['employee_name'] = 'N/A';
            $response['employee_id'] = null;
            $response['employee_account_id'] = null;
        }
        
        if ($account->creator) {
            $response['creator_name'] = $account->creator->name;
            $response['creator_role'] = $account->creator->role;
            $response['creator_id'] = $account->creator->id;
        } else {
            $response['creator_name'] = 'N/A';
            $response['creator_role'] = '';
            $response['creator_id'] = null;
        }

        return response()->json([
            'success' => true,
            'data' => $response
        ]);
    }

    public function getStats(Request $request)
    {
        $query = Installment::query();

        if ($request->branch_id) {
            $query->whereHas('account', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        $stats = [
            'total' => $query->count(),
            'paid' => (clone $query)->where('status', 'paid')->count(),
            'unpaid' => (clone $query)->where('status', 'unpaid')->count(),
            'overdue' => (clone $query)->where('status', 'overdue')->count(),
            'partial' => (clone $query)->where('status', 'partial')->count(),
            'total_due' => (clone $query)->sum('due_amount'),
            'total_paid' => (clone $query)->sum('paid_amount'),
            'total_balance' => (clone $query)->sum('balance'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}