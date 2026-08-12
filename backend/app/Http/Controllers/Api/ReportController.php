<?php
// app/Http/Controllers/Api/ReportController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Customer;
use App\Models\Account;
use App\Models\Installment;
use App\Models\EmployeeAccount;
use App\Models\Recovery;
use App\Models\Branch;
use App\Models\EmployeeLeave;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ReportController extends Controller
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
    // ✅ TEST METHOD - NO AUTH REQUIRED
    // ============================================
    public function test()
    {
        return response()->json([
            'success' => true,
            'message' => 'API is working!',
            'timestamp' => now()->toDateTimeString()
        ]);
    }

    // ============================================
    // ✅ LOAN SUMMARY - NOW MONTH-AWARE (optional ?month=YYYY-MM)
    // ============================================
    public function getLoanSummary(Request $request)
    {
        try {
            $branchId = $request->get('branch_id');
            $user = auth()->user();

            if ($user && $user->role !== 'admin' && $user->branch_id) {
                $branchId = $user->branch_id;
            }

            $isAdmin = $user && $user->role === 'admin';

            // ✅ NEW: optional month filter (?month=YYYY-MM)
            $filterMonth = null;
            $filterYear = null;
            if ($request->filled('month')) {
                $c = \Carbon\Carbon::createFromFormat('Y-m-d', $request->get('month') . '-01');
                $filterMonth = $c->month;
                $filterYear = $c->year;
            }

            // ✅ Total loan given (sum of all loan amounts)
            $loanQuery = DB::table('loans');
            if ($branchId && !$isAdmin) {
                $loanQuery->whereHas('user', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }
            if ($filterMonth && $filterYear) {
                $loanQuery->whereMonth('created_at', $filterMonth)->whereYear('created_at', $filterYear);
            }
            $totalLoansGiven = $loanQuery->sum('amount') ?? 0;

            // ✅ Total loan recovered (sum of all paid amounts)
            $paidQuery = DB::table('loan_payments');
            if ($branchId && !$isAdmin) {
                $paidQuery->whereHas('loan.user', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }
            if ($filterMonth && $filterYear) {
                $paidQuery->whereMonth('created_at', $filterMonth)->whereYear('created_at', $filterYear);
            }
            $totalLoansRecovered = $paidQuery->sum('amount') ?? 0;

            // ✅ Total pending loans
            $pendingQuery = DB::table('loans');
            if ($branchId && !$isAdmin) {
                $pendingQuery->whereHas('user', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                });
            }
            if ($filterMonth && $filterYear) {
                $pendingQuery->whereMonth('created_at', $filterMonth)->whereYear('created_at', $filterYear);
            }
            $totalPending = $pendingQuery->sum(DB::raw('amount - paid_amount')) ?? 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_loans_given' => floatval($totalLoansGiven),
                    'total_loans_recovered' => floatval($totalLoansRecovered),
                    'total_loans_pending' => floatval($totalPending),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ DASHBOARD - DYNAMIC DATA (with month filters)
    // ============================================
    public function dashboard(Request $request)
    {
        try {
            $user = auth()->user();
            $branchId = $request->get('branch_id');

            if ($user && $user->role !== 'admin' && $user->branch_id) {
                $branchId = $user->branch_id;
            }

            $isAdmin = $user && $user->role === 'admin';

            // ============================================
            // ✅ NEW: Figure out which single month the STAT CARDS
            // (new accounts, monthly recovery, top performers, revenue,
            // branch overview) should reflect.
            //
            // - If ?month=YYYY-MM is present → use that month
            // - Otherwise (last6 / custom range / no filter at all) →
            //   fall back to the current month, exactly like before.
            // ============================================
            $statsMonth = now()->month;
            $statsYear  = now()->year;

            if ($request->filled('month')) {
                $statsCarbon = \Carbon\Carbon::createFromFormat('Y-m-d', $request->get('month') . '-01');
                $statsMonth = $statsCarbon->month;
                $statsYear  = $statsCarbon->year;
            }
            $statsMonthStr = sprintf('%04d-%02d', $statsYear, $statsMonth); // e.g. "2026-07" for salary.month column

            $totalCustomers = Customer::when($branchId && !$isAdmin, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })->count();

            // ✅ NOW month-filtered (was hardcoded to now()->month before)
            $newAccounts = Account::when($branchId && !$isAdmin, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })->whereMonth('created_at', $statsMonth)
              ->whereYear('created_at', $statsYear)
              ->count();

            $totalSales = Account::when($branchId && !$isAdmin, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })->sum('total_amount');

            // ✅ NOW month-filtered (was hardcoded to now()->month before)
            $monthlyRecovery = Installment::whereMonth('payment_date', $statsMonth)
                ->whereYear('payment_date', $statsYear)
                ->when($branchId && !$isAdmin, function($q) use ($branchId) {
                    return $q->whereHas('account', function($sub) use ($branchId) {
                        $sub->where('branch_id', $branchId);
                    });
                })
                ->sum('paid_amount');

            // ============================================
            // ✅ Build list of months / weeks for the CHART
            // Priority: single "month" param > "start"+"end" range > default last 6 months
            //
            // ✅ FIXED: Carbon date-overflow bug removed.
            // Previously createFromFormat('Y-m', ...) let Carbon fill in the
            // missing "day" with TODAY's day-of-month (e.g. 30). For short
            // months like February that overflowed into March before
            // startOfMonth() could trim it, causing duplicate/missing months.
            // Fix: always pin day=1 explicitly via 'Y-m-d' + '-01', and for
            // the rolling 6-month default, lock to startOfMonth() BEFORE
            // subtracting months (not after).
            //
            // ✅ Weekly breakdown: Jab single "month" filter use ho
            // (Single Month mode), tw ab performance_data month-wise nahi,
            // balke Week 1 / Week 2 / Week 3 / Week 4 ke hisaab se aata hai —
            // har week ki apni New Accounts, Sales, aur Recovery ke sath.
            // Last6/Custom range mode bilkul pehle jaisa hi (month-wise) rahega.
            // ============================================
            $monthsToShow = [];
            $isWeeklyMode = false;
            $selectedMonth = null;

            if ($request->filled('month')) {
                // Single month mode e.g. ?month=2026-03 → weekly breakdown
                $isWeeklyMode = true;
                $selectedMonth = \Carbon\Carbon::createFromFormat('Y-m-d', $request->get('month') . '-01')->startOfDay();
            } elseif ($request->filled('start') && $request->filled('end')) {
                // Custom range mode e.g. ?start=2022-01&end=2022-06
                $start = \Carbon\Carbon::createFromFormat('Y-m-d', $request->get('start') . '-01')->startOfDay();
                $end = \Carbon\Carbon::createFromFormat('Y-m-d', $request->get('end') . '-01')->startOfDay();

                // Safety: agar start end se bada ho tw swap kardo
                if ($start->greaterThan($end)) {
                    [$start, $end] = [$end, $start];
                }

                $cursor = $start->copy();
                while ($cursor->lessThanOrEqualTo($end)) {
                    $monthsToShow[] = $cursor->copy();
                    $cursor->addMonth();
                }
            } else {
                // Default: last 6 months including current month
                $base = now()->copy()->startOfMonth();
                for ($i = 5; $i >= 0; $i--) {
                    $monthsToShow[] = $base->copy()->subMonths($i);
                }
            }

            $performanceData = [];

            if ($isWeeklyMode) {
                // ✅ Single month → Week 1, Week 2, Week 3, Week 4 breakdown
                $monthStart = $selectedMonth->copy()->startOfMonth();
                $monthEnd = $selectedMonth->copy()->endOfMonth();
                $daysInMonth = (int) $monthEnd->day;

                // Week ranges: 1-7, 8-14, 15-21, 22-end (last week absorbs leftover days)
                $weekRanges = [
                    ['start' => 1, 'end' => 7],
                    ['start' => 8, 'end' => 14],
                    ['start' => 15, 'end' => 21],
                    ['start' => 22, 'end' => $daysInMonth],
                ];

                foreach ($weekRanges as $index => $range) {
                    $weekStart = $monthStart->copy()->addDays($range['start'] - 1)->startOfDay();
                    $weekEnd = $monthStart->copy()->addDays($range['end'] - 1)->endOfDay();

                    $weekAccounts = Account::when($branchId && !$isAdmin, function($q) use ($branchId) {
                        return $q->where('branch_id', $branchId);
                    })->whereBetween('created_at', [$weekStart, $weekEnd])
                      ->count();

                    $weekSales = Account::when($branchId && !$isAdmin, function($q) use ($branchId) {
                        return $q->where('branch_id', $branchId);
                    })->whereBetween('created_at', [$weekStart, $weekEnd])
                      ->sum('total_amount');

                    $weekRecovery = Installment::whereBetween('payment_date', [$weekStart, $weekEnd])
                        ->when($branchId && !$isAdmin, function($q) use ($branchId) {
                            return $q->whereHas('account', function($sub) use ($branchId) {
                                $sub->where('branch_id', $branchId);
                            });
                        })
                        ->sum('paid_amount');

                    $performanceData[] = [
                        'month' => 'Week ' . ($index + 1),
                        'accounts' => $weekAccounts,
                        'sales' => $weekSales,
                        'recovery' => $weekRecovery,
                    ];
                }
            } else {
                // Existing month-wise / range-wise logic (unchanged)
                foreach ($monthsToShow as $month) {
                    $monthLabel = $month->format('M y'); // e.g. "Jul 26" - unique across years

                    $monthAccounts = Account::when($branchId && !$isAdmin, function($q) use ($branchId) {
                        return $q->where('branch_id', $branchId);
                    })->whereMonth('created_at', $month->month)
                      ->whereYear('created_at', $month->year)
                      ->count();

                    $monthSales = Account::when($branchId && !$isAdmin, function($q) use ($branchId) {
                        return $q->where('branch_id', $branchId);
                    })->whereMonth('created_at', $month->month)
                      ->whereYear('created_at', $month->year)
                      ->sum('total_amount');

                    $monthRecovery = Installment::whereMonth('payment_date', $month->month)
                        ->whereYear('payment_date', $month->year)
                        ->when($branchId && !$isAdmin, function($q) use ($branchId) {
                            return $q->whereHas('account', function($sub) use ($branchId) {
                                $sub->where('branch_id', $branchId);
                            });
                        })
                        ->sum('paid_amount');

                    $performanceData[] = [
                        'month' => $monthLabel,
                        'accounts' => $monthAccounts,
                        'sales' => $monthSales,
                        'recovery' => $monthRecovery,
                    ];
                }
            }

            // ✅ NOW month-filtered (was hardcoded to now()->month before)
            $topPerformers = DB::table('employee_accounts')
                ->join('users', 'employee_accounts.employee_id', '=', 'users.id')
                ->select(
                    'users.id as user_id',
                    'users.name as name',
                    DB::raw('COUNT(employee_accounts.id) as total_accounts')
                )
                ->whereMonth('employee_accounts.account_opened_date', $statsMonth)
                ->whereYear('employee_accounts.account_opened_date', $statsYear)
                ->when($branchId && !$isAdmin, function($q) use ($branchId) {
                    return $q->where('employee_accounts.branch_id', $branchId);
                })
                ->groupBy('users.id', 'users.name')
                ->orderBy('total_accounts', 'desc')
                ->limit(3)
                ->get()
                ->map(function($item) {
                    return [
                        'name' => $item->name,
                        'accounts' => $item->total_accounts,
                        'branch' => null,
                    ];
                });

            // ✅ NOW month-filtered (fixed/extra expenses by created_at, salary by 'month' column)
            $branchOverview = $this->getBranchOverview($branchId, $isAdmin, $statsMonth, $statsYear, $statsMonthStr);

            // ✅ NOW month-filtered (was lifetime sum before)
            $totalRevenue = Account::when($branchId && !$isAdmin, function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })->whereMonth('created_at', $statsMonth)
              ->whereYear('created_at', $statsYear)
              ->sum('total_amount');

            $branchName = 'All Branches';
            if ($branchId) {
                $branch = Branch::find($branchId);
                $branchName = $branch ? $branch->name : "Branch $branchId";
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_customers' => $totalCustomers,
                    'new_accounts' => $newAccounts,
                    'total_sales' => $totalSales,
                    'monthly_sales' => $totalRevenue, // ✅ NEW — same underlying figure as total_revenue, exposed separately for the Monthly Sales stat card
                    'monthly_recovery' => $monthlyRecovery,
                    'performance_data' => $performanceData,
                    'top_performers' => $topPerformers,
                    'branch_overview' => $branchOverview,
                    'total_revenue' => $totalRevenue,
                    'branch_name' => $branchName,
                    // ✅ NEW: tells the frontend which month the stat cards belong to
                    'stats_month' => $statsMonthStr,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    // ============================================
    // ✅ PRIVATE: GET BRANCH OVERVIEW (now month-aware)
    // ============================================
    private function getBranchOverview($branchId, $isAdmin, $month = null, $year = null, $monthStr = null)
    {
        $fixedQuery = DB::table('fixed_expenses');
        if ($branchId && !$isAdmin) {
            $fixedQuery->where('branch_id', $branchId);
        }
        if ($month && $year) {
            $fixedQuery->whereMonth('created_at', $month)->whereYear('created_at', $year);
        }
        $totalFixed = $fixedQuery->sum('amount');

        $extraQuery = DB::table('extra_expenses');
        if ($branchId && !$isAdmin) {
            $extraQuery->where('branch_id', $branchId);
        }
        if ($month && $year) {
            $extraQuery->whereMonth('created_at', $month)->whereYear('created_at', $year);
        }
        $totalExtra = $extraQuery->sum('amount');

        $salaryQuery = DB::table('salary');
        if ($branchId && !$isAdmin) {
            $salaryQuery->join('users', 'salary.user_id', '=', 'users.id')
                        ->where('users.branch_id', $branchId);
        }
        if ($monthStr) {
            $salaryQuery->where('salary.month', $monthStr);
        }
        $totalSalaries = $salaryQuery->sum('salary_amount');

        $totalExpenses = $totalFixed + $totalExtra + $totalSalaries;

        $totalRevenue = Account::when($branchId && !$isAdmin, function($q) use ($branchId) {
            return $q->where('branch_id', $branchId);
        })->when($month && $year, function($q) use ($month, $year) {
            return $q->whereMonth('created_at', $month)->whereYear('created_at', $year);
        })->sum('total_amount');

        $profit = $totalRevenue - $totalExpenses;

        return [
            'fixed_expenses' => floatval($totalFixed),
            'extra_expenses' => floatval($totalExtra),
            'salaries' => floatval($totalSalaries),
            'total_expenses' => floatval($totalExpenses),
            'profit' => floatval($profit > 0 ? $profit : 0),
            'total_revenue' => floatval($totalRevenue),
        ];
    }

    // ============================================
    // ✅ EMPLOYEE REPORT PUBLIC - WITH OVERDUE FIXED
    // ============================================
    public function getEmployeeReportPublic(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $branchId = $request->get('branch_id');

            $query = User::whereIn('role', ['employee', 'manager']);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $employees = $query->get();

            if ($employees->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'data' => [],
                        'summary' => [
                            'total_employees' => 0,
                            'total_accounts' => 0,
                            'total_recovery' => 0,
                            'total_commission' => 0,
                            'total_overdue' => 0,
                            'month' => $month
                        ]
                    ]
                ]);
            }

            $result = [];
            $summaryTotalOverdue = 0;

            foreach ($employees as $employee) {
                $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();
                $currentMonthAccounts = EmployeeAccount::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->count();

                $accountIds = EmployeeAccount::where('employee_id', $employee->id)
                    ->pluck('customer_id')
                    ->toArray();

                $accountRecords = Account::whereIn('customer_id', $accountIds)
                    ->pluck('id')
                    ->toArray();

                $totalRecovery = Installment::whereIn('account_id', $accountRecords)
                    ->sum('paid_amount');

                $totalCommission = DB::table('salary')
                    ->where('user_id', $employee->id)
                    ->sum('commission');

                $totalLeaves = EmployeeLeave::where('user_id', $employee->id)
                    ->where('status', 'approved')
                    ->count();

                // ✅ FIXED: Total Overdue - use month + account created_at day
                $today = now()->format('Y-m-d');

                $totalOverdue = 0;
                $installments = Installment::with('account')
                    ->whereIn('account_id', $accountRecords)
                    ->whereIn('status', ['unpaid', 'partial'])
                    ->where('balance', '>', 0)
                    ->get();

                foreach ($installments as $inst) {
                    if (!$inst->account || !$inst->account->created_at) {
                        continue;
                    }
                    $openingDay = (int) $inst->account->created_at->format('j');
                    [$year, $monthNum] = array_map('intval', explode('-', $inst->month));
                    $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $monthNum, $year);
                    $day = min($openingDay, $daysInMonth);
                    $dueDate = sprintf('%04d-%02d-%02d', $year, $monthNum, $day);
                    
                    if ($dueDate <= $today) {
                        $totalOverdue += floatval($inst->balance);
                    }
                }

                $summaryTotalOverdue += $totalOverdue;

                $monthlyData = $this->getEmployeeMonthlyData($employee->id);

                $result[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'branch_id' => $employee->branch_id,
                    'role' => $employee->role,
                    'salary' => floatval($employee->salary ?? 0),
                    'totalAccounts' => $totalAccounts,
                    'totalRecovery' => floatval($totalRecovery),
                    'totalCommission' => floatval($totalCommission),
                    'totalLeaves' => $totalLeaves,
                    'totalOverdue' => floatval($totalOverdue),
                    'monthlyData' => $monthlyData,
                    'created_at' => $employee->created_at,
                ];
            }

            $summary = [
                'total_employees' => count($result),
                'total_accounts' => collect($result)->sum('totalAccounts'),
                'total_recovery' => collect($result)->sum('totalRecovery'),
                'total_commission' => collect($result)->sum('totalCommission'),
                'total_leaves' => collect($result)->sum('totalLeaves'),
                'total_overdue' => floatval($summaryTotalOverdue),
                'month' => $month,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $result,
                    'summary' => $summary
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    // ============================================
    // ✅ EMPLOYEE REPORT - AUTH REQUIRED
    // ============================================
    public function getEmployeeReport(Request $request)
    {
        return $this->getEmployeeReportPublic($request);
    }

    // ============================================
    // ✅ PRIVATE: GET EMPLOYEE MONTHLY DATA - WITH OVERDUE
    // ============================================
    private function getEmployeeMonthlyData($employeeId)
    {
        $months = [];
        $currentMonth = now()->format('Y-m');
        $today = now()->format('Y-m-d');

        $accounts = EmployeeAccount::where('employee_id', $employeeId)
            ->select('month', DB::raw('count(*) as total'))
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        foreach ($accounts as $account) {
            $monthKey = $account->month;
            $months[$monthKey] = [
                'accountsOpened' => $account->total,
                'recoveryAmount' => 0,
                'commission' => 0,
                'leaves' => 0,
                'salary' => 0,
                'advances' => 0,
                'overdue' => 0,
                'status' => 'active'
            ];
        }

        $accountIds = EmployeeAccount::where('employee_id', $employeeId)
            ->pluck('customer_id')
            ->toArray();

        $accountRecords = Account::whereIn('customer_id', $accountIds)
            ->pluck('id')
            ->toArray();

        $recoveries = Installment::whereIn('account_id', $accountRecords)
            ->select('month', DB::raw('sum(paid_amount) as total'))
            ->groupBy('month')
            ->get();

        foreach ($recoveries as $recovery) {
            $monthKey = $recovery->month;
            if (!isset($months[$monthKey])) {
                $months[$monthKey] = [
                    'accountsOpened' => 0,
                    'recoveryAmount' => 0,
                    'commission' => 0,
                    'leaves' => 0,
                    'salary' => 0,
                    'advances' => 0,
                    'overdue' => 0,
                    'status' => 'active'
                ];
            }
            $months[$monthKey]['recoveryAmount'] = floatval($recovery->total);
        }

        // ✅ FIXED: Overdue by month - calculate using month + account created_at day
        $overdueInstallments = Installment::with('account')
            ->whereIn('account_id', $accountRecords)
            ->whereIn('status', ['unpaid', 'partial'])
            ->where('balance', '>', 0)
            ->get();

        foreach ($overdueInstallments as $overdue) {
            if (!$overdue->account || !$overdue->account->created_at) {
                continue;
            }
            $openingDay = (int) $overdue->account->created_at->format('j');
            [$year, $monthNum] = array_map('intval', explode('-', $overdue->month));
            $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $monthNum, $year);
            $day = min($openingDay, $daysInMonth);
            $dueDate = sprintf('%04d-%02d-%02d', $year, $monthNum, $day);
            
            if ($dueDate <= $today) {
                $monthKey = $overdue->month;
                if (!isset($months[$monthKey])) {
                    $months[$monthKey] = [
                        'accountsOpened' => 0,
                        'recoveryAmount' => 0,
                        'commission' => 0,
                        'leaves' => 0,
                        'salary' => 0,
                        'advances' => 0,
                        'overdue' => 0,
                        'status' => 'active'
                    ];
                }
                $months[$monthKey]['overdue'] += floatval($overdue->balance);
            }
        }

        $salaryRows = DB::table('salary')
            ->where('user_id', $employeeId)
            ->select('month', DB::raw('sum(commission) as total'))
            ->groupBy('month')
            ->get();

        foreach ($salaryRows as $row) {
            $monthKey = $row->month;
            if (!isset($months[$monthKey])) {
                $months[$monthKey] = [
                    'accountsOpened' => 0,
                    'recoveryAmount' => 0,
                    'commission' => 0,
                    'leaves' => 0,
                    'salary' => 0,
                    'advances' => 0,
                    'overdue' => 0,
                    'status' => 'active'
                ];
            }
            $months[$monthKey]['commission'] = floatval($row->total);
        }

        $leaves = EmployeeLeave::where('user_id', $employeeId)
            ->where('status', 'approved')
            ->select('month', DB::raw('count(*) as total'))
            ->groupBy('month')
            ->get();

        foreach ($leaves as $leave) {
            $monthKey = $leave->month;
            if (!isset($months[$monthKey])) {
                $months[$monthKey] = [
                    'accountsOpened' => 0,
                    'recoveryAmount' => 0,
                    'commission' => 0,
                    'leaves' => 0,
                    'salary' => 0,
                    'advances' => 0,
                    'overdue' => 0,
                    'status' => 'active'
                ];
            }
            $months[$monthKey]['leaves'] = $leave->total;
        }

        if (!isset($months[$currentMonth])) {
            $months[$currentMonth] = [
                'accountsOpened' => 0,
                'recoveryAmount' => 0,
                'commission' => 0,
                'leaves' => 0,
                'salary' => 0,
                'advances' => 0,
                'overdue' => 0,
                'status' => 'active'
            ];
        }

        return $months;
    }

    // ============================================
    // ✅ OTHER EXISTING METHODS
    // ============================================

    public function branchWiseRecovery(Request $request)
    {
        try {
            $data = Branch::withCount(['recoveries' => function($q) {
                $q->where('status', 'paid');
            }])->withSum('recoveries', 'amount')->get();

            return $this->sendResponse($data, 'Branch wise recovery retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function monthlyInstallmentStatus(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));

            $data = Installment::where('month', $month)
                ->select('status', DB::raw('count(*) as total'), DB::raw('sum(due_amount) as total_due'))
                ->groupBy('status')
                ->get();

            return $this->sendResponse($data, 'Monthly installment status retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function topPerformers(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $limit = $request->get('limit', 10);

            $data = EmployeeAccount::where('month', $month)
                ->select('employee_id', DB::raw('count(*) as total_accounts'))
                ->groupBy('employee_id')
                ->orderBy('total_accounts', 'desc')
                ->limit($limit)
                ->get()
                ->map(function($item) {
                    $user = User::find($item->employee_id);
                    return [
                        'employee_id' => $item->employee_id,
                        'name' => $user->name ?? 'Unknown',
                        'total_accounts' => $item->total_accounts,
                        'branch' => $user->branch->name ?? 'N/A',
                    ];
                });

            return $this->sendResponse($data, 'Top performers retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function employeePerformance(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $branchId = $request->get('branch_id');

            $query = User::whereIn('role', ['employee', 'manager']);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $employees = $query->get();
            $data = [];

            foreach ($employees as $employee) {
                $accounts = EmployeeAccount::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->count();

                $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();

                $data[] = [
                    'employee_id' => $employee->id,
                    'name' => $employee->name,
                    'current_month_accounts' => $accounts,
                    'total_accounts' => $totalAccounts,
                    'branch' => $employee->branch->name ?? 'N/A',
                ];
            }

            return $this->sendResponse($data, 'Employee performance retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function accountStatusSummary(Request $request)
    {
        try {
            $branchId = $request->get('branch_id');

            $query = Account::query();

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $data = [
                'total' => $query->count(),
                'active' => (clone $query)->where('status', 'active')->count(),
                'hold' => (clone $query)->where('status', 'hold')->count(),
                'paid' => (clone $query)->where('status', 'paid')->count(),
                'closed' => (clone $query)->where('status', 'closed')->count(),
            ];

            return $this->sendResponse($data, 'Account status summary retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function getEmployeeStats(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $branchId = $request->get('branch_id');
            $employeeId = $request->get('employee_id');

            $query = User::whereIn('role', ['employee', 'manager']);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            if ($employeeId) {
                $query->where('id', $employeeId);
            }

            $employees = $query->get();
            $data = [];

            foreach ($employees as $employee) {
                $accountsOpened = EmployeeAccount::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->count();

                $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();

                $accountIds = EmployeeAccount::where('employee_id', $employee->id)
                    ->pluck('customer_id')
                    ->toArray();

                $accountRecords = Account::whereIn('customer_id', $accountIds)->pluck('id')->toArray();

                $monthlyRecovery = Installment::whereIn('account_id', $accountRecords)
                    ->where('month', $month)
                    ->sum('paid_amount');

                $totalRecovery = Installment::whereIn('account_id', $accountRecords)
                    ->sum('paid_amount');

                $commissionRate = 0.05;
                $monthlyCommission = $monthlyRecovery * $commissionRate;
                $totalCommission = $totalRecovery * $commissionRate;

                $monthlyLeaves = EmployeeLeave::where('user_id', $employee->id)
                    ->where('month', $month)
                    ->where('status', 'approved')
                    ->count();

                $totalLeaves = EmployeeLeave::where('user_id', $employee->id)
                    ->where('status', 'approved')
                    ->count();

                $monthlyData = $this->getEmployeeMonthlyData($employee->id);

                $data[] = [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'branch_id' => $employee->branch_id,
                    'role' => $employee->role,
                    'salary' => $employee->salary ?? 0,
                    'joining_date' => $employee->created_at ? $employee->created_at->format('Y-m-d') : null,
                    'accounts_opened' => $accountsOpened,
                    'total_accounts' => $totalAccounts,
                    'monthly_recovery' => $monthlyRecovery,
                    'total_recovery' => $totalRecovery,
                    'monthly_commission' => $monthlyCommission,
                    'total_commission' => $totalCommission,
                    'monthly_leaves' => $monthlyLeaves,
                    'total_leaves' => $totalLeaves,
                    'monthly_data' => $monthlyData,
                ];
            }

            $summary = [
                'total_employees' => count($data),
                'total_accounts' => array_sum(array_column($data, 'total_accounts')),
                'total_recovery' => array_sum(array_column($data, 'total_recovery')),
                'total_commission' => array_sum(array_column($data, 'total_commission')),
                'total_leaves' => array_sum(array_column($data, 'total_leaves')),
                'month' => $month,
            ];

            return $this->sendResponse([
                'data' => $data,
                'summary' => $summary
            ], 'Employee stats retrieved successfully');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    public function getEmployeeDetail(Request $request, $id)
    {
        try {
            $employee = User::with(['branch'])->whereIn('role', ['employee', 'manager'])->find($id);

            if (!$employee) {
                return $this->sendError('Employee not found', 404);
            }

            $month = $request->get('month', now()->format('Y-m'));

            $accountsOpened = EmployeeAccount::where('employee_id', $employee->id)
                ->where('month', $month)
                ->count();

            $totalAccounts = EmployeeAccount::where('employee_id', $employee->id)->count();

            $accountIds = EmployeeAccount::where('employee_id', $employee->id)
                ->pluck('customer_id')
                ->toArray();

            $accountRecords = Account::whereIn('customer_id', $accountIds)->pluck('id')->toArray();

            $monthlyRecovery = Installment::whereIn('account_id', $accountRecords)
                ->where('month', $month)
                ->sum('paid_amount');

            $totalRecovery = Installment::whereIn('account_id', $accountRecords)
                ->sum('paid_amount');

            $commissionRate = 0.05;
            $monthlyCommission = $monthlyRecovery * $commissionRate;
            $totalCommission = $totalRecovery * $commissionRate;

            $monthlyLeaves = EmployeeLeave::where('user_id', $employee->id)
                ->where('month', $month)
                ->where('status', 'approved')
                ->count();

            $totalLeaves = EmployeeLeave::where('user_id', $employee->id)
                ->where('status', 'approved')
                ->count();

            $monthlyData = $this->getEmployeeMonthlyData($employee->id);

            $accounts = EmployeeAccount::with(['customer'])
                ->where('employee_id', $employee->id)
                ->orderBy('account_opened_date', 'desc')
                ->get();

            return $this->sendResponse([
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'branch' => $employee->branch->name ?? 'N/A',
                    'salary' => $employee->salary,
                    'total_accounts' => $totalAccounts,
                    'current_month_accounts' => $accountsOpened,
                ],
                'stats' => [
                    'monthly_recovery' => $monthlyRecovery,
                    'total_recovery' => $totalRecovery,
                    'monthly_commission' => $monthlyCommission,
                    'total_commission' => $totalCommission,
                    'monthly_leaves' => $monthlyLeaves,
                    'total_leaves' => $totalLeaves,
                ],
                'accounts_list' => $accounts->map(function($account) {
                    return [
                        'id' => $account->id,
                        'customer_name' => $account->customer->name ?? 'N/A',
                        'account_opened_date' => $account->account_opened_date->format('Y-m-d'),
                        'month' => $account->month,
                        'status' => $account->status,
                    ];
                }),
                'monthly_data' => $monthlyData,
            ], 'Employee details retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function getBranchPerformance(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));

            $branches = Branch::all();
            $data = [];

            foreach ($branches as $branch) {
                $employeeIds = User::where('branch_id', $branch->id)
                    ->whereIn('role', ['employee', 'manager'])
                    ->pluck('id')
                    ->toArray();

                $accountsOpened = EmployeeAccount::whereIn('employee_id', $employeeIds)
                    ->where('month', $month)
                    ->count();

                $totalAccounts = EmployeeAccount::whereIn('employee_id', $employeeIds)->count();

                $accountIds = EmployeeAccount::whereIn('employee_id', $employeeIds)
                    ->pluck('customer_id')
                    ->toArray();

                $accountRecords = Account::whereIn('customer_id', $accountIds)->pluck('id')->toArray();

                $recovery = Installment::whereIn('account_id', $accountRecords)
                    ->where('month', $month)
                    ->sum('paid_amount');

                $totalRecovery = Installment::whereIn('account_id', $accountRecords)
                    ->sum('paid_amount');

                $topPerformer = EmployeeAccount::whereIn('employee_id', $employeeIds)
                    ->where('month', $month)
                    ->select('employee_id', DB::raw('count(*) as total'))
                    ->groupBy('employee_id')
                    ->orderBy('total', 'desc')
                    ->first();

                $topPerformerName = null;
                if ($topPerformer) {
                    $user = User::find($topPerformer->employee_id);
                    $topPerformerName = $user ? $user->name : null;
                }

                $data[] = [
                    'branch_id' => $branch->id,
                    'branch_name' => $branch->name,
                    'employees' => count($employeeIds),
                    'accounts_opened' => $accountsOpened,
                    'total_accounts' => $totalAccounts,
                    'monthly_recovery' => $recovery,
                    'total_recovery' => $totalRecovery,
                    'top_performer' => $topPerformerName,
                    'top_performer_count' => $topPerformer->total ?? 0,
                ];
            }

            return $this->sendResponse($data, 'Branch performance retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    public function getMonthlyReport(Request $request)
    {
        try {
            $month = $request->get('month', now()->format('Y-m'));
            $branchId = $request->get('branch_id');

            $query = User::whereIn('role', ['employee', 'manager']);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $employees = $query->get();
            $data = [];

            foreach ($employees as $employee) {
                $accountsOpened = EmployeeAccount::where('employee_id', $employee->id)
                    ->where('month', $month)
                    ->count();

                $accountIds = EmployeeAccount::where('employee_id', $employee->id)
                    ->pluck('customer_id')
                    ->toArray();

                $accountRecords = Account::whereIn('customer_id', $accountIds)->pluck('id')->toArray();

                $recovery = Installment::whereIn('account_id', $accountRecords)
                    ->where('month', $month)
                    ->sum('paid_amount');

                $commission = $recovery * 0.05;

                $leaves = EmployeeLeave::where('user_id', $employee->id)
                    ->where('month', $month)
                    ->where('status', 'approved')
                    ->count();

                $data[] = [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->name,
                    'branch_id' => $employee->branch_id,
                    'accounts_opened' => $accountsOpened,
                    'recovery' => $recovery,
                    'commission' => $commission,
                    'leaves' => $leaves,
                ];
            }

            $summary = [
                'total_employees' => count($data),
                'total_accounts' => array_sum(array_column($data, 'accounts_opened')),
                'total_recovery' => array_sum(array_column($data, 'recovery')),
                'total_commission' => array_sum(array_column($data, 'commission')),
                'total_leaves' => array_sum(array_column($data, 'leaves')),
                'month' => $month,
            ];

            return $this->sendResponse([
                'data' => $data,
                'summary' => $summary
            ], 'Monthly report retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ PRIVATE: CALCULATE PERFORMANCE
    // ============================================
    private function calculatePerformance($employeeId, $month)
    {
        $thisMonth = EmployeeAccount::where('employee_id', $employeeId)
            ->where('month', $month)
            ->count();

        $avg = EmployeeAccount::where('month', $month)
            ->select('employee_id', DB::raw('count(*) as total'))
            ->groupBy('employee_id')
            ->get()
            ->avg('total') ?? 1;

        if ($avg > 0) {
            $score = ($thisMonth / $avg) * 100;
        } else {
            $score = 0;
        }

        return round(min($score, 100), 2);
    }
}