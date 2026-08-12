<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recovery;
use App\Models\EmployeeAccount;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RecoveryController extends Controller
{
    /**
     * Send success response
     */
    private function sendResponse($data, $message = 'Success', $code = 200)
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
    private function sendError($message, $code = 400)
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], $code);
    }

    /**
     * Display a listing of recovery records
     */
    public function index(Request $request)
    {
        $query = Recovery::with(['account', 'customer', 'employee', 'creator']);

        if ($request->account_id) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->employee_id) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->from_date) {
            $query->where('recovery_date', '>=', $request->from_date);
        }

        if ($request->to_date) {
            $query->where('recovery_date', '<=', $request->to_date);
        }

        if ($request->month) {
            $query->where('month', $request->month);
        }

        return $this->sendResponse(
            $query->orderBy('recovery_date', 'desc')->get(),
            'Recovery records retrieved successfully'
        );
    }

    /**
     * Store a newly created recovery record
     */
    public function store(Request $request)
    {
        $request->validate([
            'account_id' => 'required|exists:employee_accounts,id',
            'customer_id' => 'required|exists:customers,id',
            'recovery_date' => 'nullable|date',
            'amount' => 'required|numeric|min:1',
            'payment_type' => 'nullable|in:cash,bank,cheque,installment',
            'month' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
            'created_by' => 'required|exists:users,id'
        ]);

        try {
            DB::beginTransaction();

            // ✅ Get the account to find employee_id
            $account = EmployeeAccount::find($request->account_id);
            
            if (!$account) {
                return $this->sendError('Account not found', 404);
            }

            // ✅ Auto-add employee_id from the account
            $data = $request->all();
            $data['employee_id'] = $account->employee_id;
            $data['recovery_date'] = $request->recovery_date ?? date('Y-m-d');
            
            // If month not provided, extract from recovery_date
            if (empty($data['month'])) {
                $data['month'] = date('Y-m', strtotime($data['recovery_date']));
            }

            $recovery = Recovery::create($data);

            // ✅ Update installment status if applicable
            if ($request->payment_type === 'installment' || $request->installment_id) {
                $this->updateInstallmentStatus($recovery);
            }

            DB::commit();

            return $this->sendResponse(
                $recovery->load(['account', 'customer', 'employee', 'creator']),
                'Recovery recorded successfully',
                201
            );

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to record recovery: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update installment status when recovery is made
     */
    private function updateInstallmentStatus($recovery)
    {
        try {
            // Find the installment for this account and month
            $installment = \App\Models\Installment::where('account_id', $recovery->account_id)
                ->where('month', $recovery->month)
                ->first();

            if ($installment) {
                // Update paid amount
                $installment->paid_amount = ($installment->paid_amount ?? 0) + $recovery->amount;
                
                // Check if fully paid
                if ($installment->paid_amount >= $installment->due_amount) {
                    $installment->status = 'paid';
                } else {
                    $installment->status = 'partial';
                }
                
                $installment->save();
            }
        } catch (\Exception $e) {
            // Log error but don't stop the process
            \Log::error('Failed to update installment status: ' . $e->getMessage());
        }
    }

    /**
     * Get recovery summary for an employee
     */
    public function getEmployeeRecoverySummary(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:users,id',
            'month' => 'nullable|date_format:Y-m',
        ]);

        $month = $request->month ?? date('Y-m');

        $totalRecovery = Recovery::where('employee_id', $request->employee_id)
            ->where('month', $month)
            ->sum('amount');

        $recoveryCount = Recovery::where('employee_id', $request->employee_id)
            ->where('month', $month)
            ->count();

        $recoveries = Recovery::with(['account', 'customer'])
            ->where('employee_id', $request->employee_id)
            ->where('month', $month)
            ->orderBy('recovery_date', 'desc')
            ->get();

        return $this->sendResponse([
            'employee_id' => $request->employee_id,
            'month' => $month,
            'total_recovery' => $totalRecovery,
            'recovery_count' => $recoveryCount,
            'recoveries' => $recoveries,
            'commission' => $totalRecovery * 0.05, // 5% commission
        ], 'Employee recovery summary retrieved successfully');
    }

    /**
     * Get recovery report by month
     */
    public function getMonthlyRecoveryReport(Request $request)
    {
        $request->validate([
            'month' => 'nullable|date_format:Y-m',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $month = $request->month ?? date('Y-m');
        $branchId = $request->branch_id;

        $query = Recovery::with(['account', 'customer', 'employee', 'creator'])
            ->where('month', $month);

        if ($branchId) {
            $query->whereHas('account', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }

        $recoveries = $query->orderBy('recovery_date', 'desc')->get();

        // Summary
        $summary = [
            'total_amount' => $recoveries->sum('amount'),
            'total_count' => $recoveries->count(),
            'unique_customers' => $recoveries->pluck('customer_id')->unique()->count(),
            'unique_employees' => $recoveries->pluck('employee_id')->unique()->count(),
            'by_payment_type' => $recoveries->groupBy('payment_type')->map(function ($group) {
                return [
                    'count' => $group->count(),
                    'amount' => $group->sum('amount'),
                ];
            }),
            'by_employee' => $recoveries->groupBy('employee_id')->map(function ($group) {
                $employee = $group->first()->employee;
                return [
                    'employee_name' => $employee ? $employee->name : 'Unknown',
                    'count' => $group->count(),
                    'amount' => $group->sum('amount'),
                    'commission' => $group->sum('amount') * 0.05,
                ];
            }),
        ];

        return $this->sendResponse([
            'month' => $month,
            'summary' => $summary,
            'recoveries' => $recoveries,
        ], 'Monthly recovery report retrieved successfully');
    }

    /**
     * Get branch-wise recovery
     */
    public function getBranchWiseRecovery(Request $request)
    {
        $request->validate([
            'month' => 'nullable|date_format:Y-m',
            'from_date' => 'nullable|date',
            'to_date' => 'nullable|date|after_or_equal:from_date',
        ]);

        $month = $request->month ?? date('Y-m');

        $branchRecovery = DB::table('recovery as r')
            ->join('employee_accounts as ea', 'r.account_id', '=', 'ea.id')
            ->join('branches as b', 'ea.branch_id', '=', 'b.id')
            ->where('r.month', $month)
            ->select(
                'b.id as branch_id',
                'b.name as branch_name',
                DB::raw('COUNT(r.id) as total_recoveries'),
                DB::raw('SUM(r.amount) as total_amount'),
                DB::raw('SUM(r.amount) * 0.05 as total_commission')
            )
            ->groupBy('b.id', 'b.name')
            ->get();

        return $this->sendResponse($branchRecovery, 'Branch-wise recovery retrieved successfully');
    }

    /**
     * Delete a recovery record
     */
    public function destroy($id)
    {
        $recovery = Recovery::find($id);
        
        if (!$recovery) {
            return $this->sendError('Recovery record not found', 404);
        }

        try {
            DB::beginTransaction();

            // ✅ Reverse installment status if applicable
            $installment = \App\Models\Installment::where('account_id', $recovery->account_id)
                ->where('month', $recovery->month)
                ->first();

            if ($installment) {
                $installment->paid_amount = max(0, ($installment->paid_amount ?? 0) - $recovery->amount);
                
                if ($installment->paid_amount <= 0) {
                    $installment->status = 'unpaid';
                } elseif ($installment->paid_amount < $installment->due_amount) {
                    $installment->status = 'partial';
                } else {
                    $installment->status = 'paid';
                }
                
                $installment->save();
            }

            $recovery->delete();
            DB::commit();

            return $this->sendResponse(null, 'Recovery record deleted successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Failed to delete recovery: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get recovery statistics
     */
    public function getStats(Request $request)
    {
        $month = $request->month ?? date('Y-m');

        $stats = [
            'total_recovery_today' => Recovery::whereDate('recovery_date', date('Y-m-d'))->sum('amount'),
            'total_recovery_this_month' => Recovery::where('month', $month)->sum('amount'),
            'total_recovery_all_time' => Recovery::sum('amount'),
            'total_recoveries_today' => Recovery::whereDate('recovery_date', date('Y-m-d'))->count(),
            'total_recoveries_this_month' => Recovery::where('month', $month)->count(),
            'total_recoveries_all_time' => Recovery::count(),
            'avg_recovery_amount' => Recovery::avg('amount') ?? 0,
            'max_recovery_amount' => Recovery::max('amount') ?? 0,
            'month' => $month,
        ];

        return $this->sendResponse($stats, 'Recovery statistics retrieved successfully');
    }
}