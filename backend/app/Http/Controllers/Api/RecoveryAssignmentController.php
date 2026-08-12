<?php
// app/Http/Controllers/Api/RecoveryAssignmentController.php
// ✅ COMPLETE FIXED CONTROLLER — "is mahine ki recovery duty" assign/fetch karne ke liye.

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecoveryAssignment;
use App\Models\Account;
use App\Models\Installment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class RecoveryAssignmentController extends Controller
{
    // ✅ FIX: private -> public (parent Controller class mein ye methods public hain,
    // PHP mein child class overriding method ka access level parent se zyada restrictive
    // nahi ho sakta — isi wajah se Fatal Error aa raha tha aur CORS header kabhi attach
    // nahi ho pa raha tha)
    public function sendResponse($data, $message = 'Success', $code = 200)
    {
        return response()->json(['success' => true, 'message' => $message, 'data' => $data], $code);
    }

    public function sendError($message, $code = 400, $errors = null)
    {
        $response = ['success' => false, 'message' => $message];
        if ($errors) {
            $response['errors'] = $errors;
        }
        return response()->json($response, $code);
    }

    // ============================================
    // ✅ GET /recovery-assignments/employees?branch_id=
    // Sirf usi branch ke active employees (jo assign kiye ja sakte hain)
    // ============================================
    public function employees(Request $request)
    {
        try {
            $query = User::where('is_active', 1)->where('role', 'employee');

            if ($request->branch_id) {
                $query->where('branch_id', $request->branch_id);
            }

            $employees = $query->orderBy('name', 'asc')->get(['id', 'name', 'email', 'branch_id']);

            return $this->sendResponse($employees, 'Employees retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch employees: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ GET /recovery-assignments/locked?branch_id=
    // Kaunse accounts abhi 30-din lock mein hain (isliye reselect nahi ho sakte)
    // ============================================
    public function lockedAccounts(Request $request)
    {
        try {
            $query = RecoveryAssignment::where('status', 'active')
                ->where('assigned_at', '>=', Carbon::now()->subDays(30));

            if ($request->branch_id) {
                $query->where('branch_id', $request->branch_id);
            }

            $locked = $query->with('assignedTo:id,name')->get()->map(function ($a) {
                return [
                    'account_id' => $a->account_id,
                    'assigned_to' => $a->assigned_to,
                    'assigned_to_name' => optional($a->assignedTo)->name ?? 'N/A',
                    'assigned_at' => $a->assigned_at,
                    'unlock_date' => Carbon::parse($a->assigned_at)->addDays(30)->toDateString(),
                ];
            })->values();

            return $this->sendResponse($locked, 'Locked accounts retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch locked accounts: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ POST /recovery-assignments
    // body: { account_ids: [1,2,3], assigned_to: employeeId }
    // Selected accounts ko is mahine ke liye employee ko assign karta hai.
    // Jo account already (30 din se andar) locked hai, wo skip ho jata hai.
    // ============================================
    public function store(Request $request)
    {
        try {
            $request->validate([
                'account_ids' => 'required|array|min:1',
                'account_ids.*' => 'exists:accounts,id',
                'assigned_to' => 'required|exists:users,id',
            ]);

            $user = $request->user();
            
            // ✅ Check if user is authorized (admin or manager)
            if (!in_array($user->role, ['admin', 'manager'])) {
                return $this->sendError('You are not authorized to assign recovery', 403);
            }

            $currentMonth = date('Y-m');

            DB::beginTransaction();
            
            $created = [];
            $skipped = [];
            $failed = [];

            foreach ($request->account_ids as $accountId) {
                try {
                    // Check if already locked (assigned within last 30 days)
                    $isLocked = RecoveryAssignment::where('account_id', $accountId)
                        ->where('status', 'active')
                        ->where('assigned_at', '>=', Carbon::now()->subDays(30))
                        ->exists();

                    if ($isLocked) {
                        $skipped[] = $accountId;
                        continue;
                    }

                    $account = Account::find($accountId);
                    
                    if (!$account) {
                        $failed[] = $accountId;
                        continue;
                    }

                    // ✅ Deactivate old assignments for this account
                    RecoveryAssignment::where('account_id', $accountId)
                        ->where('status', 'active')
                        ->update(['status' => 'expired']);

                    $assignment = RecoveryAssignment::create([
                        'account_id' => $accountId,
                        'assigned_to' => $request->assigned_to,
                        'assigned_by' => $user->id,
                        'branch_id' => $account->branch_id,
                        'month' => $currentMonth,
                        'assigned_at' => now(),
                        'status' => 'active'
                    ]);

                    $created[] = $assignment;
                    
                } catch (\Exception $e) {
                    $failed[] = $accountId;
                }
            }

            DB::commit();

            $message = count($created) . ' account(s) assigned successfully';
            if (count($skipped) > 0) {
                $message .= ', ' . count($skipped) . ' skipped (already locked)';
            }
            if (count($failed) > 0) {
                $message .= ', ' . count($failed) . ' failed';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'created_count' => count($created),
                'skipped_count' => count($skipped),
                'failed_count' => count($failed),
                'skipped_account_ids' => $skipped,
                'failed_account_ids' => $failed,
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->sendError('Validation failed', 422, $e->errors());
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError('Assignment failed: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ GET /recovery-assignments/my
    // Employee → sirf uske apne active-assigned accounts.
    // Admin/Manager → apni branch ke saare active-assigned accounts.
    // Same shape jese InstallmentController::index deta hai, +assignment_info field.
    // ============================================
    public function myAssignments(Request $request)
    {
        try {
            $user = $request->user();

            $assignmentQuery = RecoveryAssignment::where('status', 'active')
                ->where('assigned_at', '>=', Carbon::now()->subDays(30));

            if ($user->role === 'employee') {
                $assignmentQuery->where('assigned_to', $user->id);
            } elseif ($request->branch_id) {
                $assignmentQuery->where('branch_id', $request->branch_id);
            } elseif ($user->branch_id) {
                $assignmentQuery->where('branch_id', $user->branch_id);
            }

            $assignments = $assignmentQuery->get()->keyBy('account_id');
            $accountIds = $assignments->keys();

            if ($accountIds->isEmpty()) {
                return $this->sendResponse([], 'No assigned accounts found');
            }

            $installments = Installment::with([
                'account.customer',
                'account.branch',
                'account.creator',
                'account.employeeAccount',
                'account.employeeAccount.employee'
            ])
            ->whereIn('account_id', $accountIds)
            ->orderBy('month', 'desc')
            ->orderBy('id', 'desc')
            ->get();

            $assignedToNames = User::whereIn('id', $assignments->pluck('assigned_to')->unique())
                ->pluck('name', 'id');

            $installments->each(function ($item) use ($assignments, $assignedToNames) {
                $assignment = $assignments->get($item->account_id);
                if ($assignment) {
                    $item->assignment_info = [
                        'assigned_to' => $assignment->assigned_to,
                        'assigned_to_name' => $assignedToNames->get($assignment->assigned_to, 'N/A'),
                        'assigned_at' => $assignment->assigned_at,
                        'month' => $assignment->month,
                        'unlock_date' => Carbon::parse($assignment->assigned_at)->addDays(30)->toDateString(),
                    ];
                }
            });

            return $this->sendResponse($installments, 'Assigned accounts retrieved successfully');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch assignments: ' . $e->getMessage(), 500);
        }
    }

    // ============================================
    // ✅ GET /recovery-assignments/account/{accountId}
    // Kisi specific account ki assignment status check karne ke liye
    // ============================================
    public function getAccountAssignment($accountId)
    {
        try {
            $assignment = RecoveryAssignment::where('account_id', $accountId)
                ->where('status', 'active')
                ->where('assigned_at', '>=', Carbon::now()->subDays(30))
                ->with('assignedTo:id,name')
                ->first();

            if (!$assignment) {
                return $this->sendResponse(null, 'No active assignment found for this account');
            }

            return $this->sendResponse([
                'account_id' => $assignment->account_id,
                'assigned_to' => $assignment->assigned_to,
                'assigned_to_name' => optional($assignment->assignedTo)->name ?? 'N/A',
                'assigned_at' => $assignment->assigned_at,
                'unlock_date' => Carbon::parse($assignment->assigned_at)->addDays(30)->toDateString(),
                'month' => $assignment->month,
                'status' => $assignment->status,
            ], 'Assignment found');
            
        } catch (\Exception $e) {
            return $this->sendError('Failed to fetch assignment: ' . $e->getMessage(), 500);
        }
    }
}