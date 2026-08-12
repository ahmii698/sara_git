<?php
// app/Http/Controllers/Api/LeaveController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeLeave;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class LeaveController extends Controller
{
    public function sendResponse($data, $message = 'Success', $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $code);
    }

    public function sendError($message, $code = 400, $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $code);
    }

    // ============================================
    // GET /api/leaves
    // List leave records (admin view / branch view)
    // Optional filters: ?user_id=5  ?branch_id=1
    // ============================================
    public function index(Request $request)
    {
        try {
            $query = EmployeeLeave::with('employee:id,name,branch_id,role')
                ->orderBy('leave_date', 'desc');

            if ($request->filled('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->filled('branch_id')) {
                $query->whereHas('employee', function ($q) use ($request) {
                    $q->where('branch_id', $request->branch_id);
                });
            }

            $leaves = $query->get();

            return $this->sendResponse($leaves, 'Leaves retrieved successfully');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // POST /api/leaves
    // Record a leave directly - NO pending/approval workflow.
    // Form only sends: user_id, leave_date, reason.
    // month/year are filled in automatically here, and the
    // record is saved as final (status = 'approved') immediately.
    // ============================================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id'    => 'required|exists:users,id',
            'leave_date' => 'required|date',
            'reason'     => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->sendError('Validation error', 422, $validator->errors());
        }

        try {
            $date = Carbon::parse($request->leave_date);

            $leave = EmployeeLeave::create([
                'user_id'    => $request->user_id,
                'leave_date' => $date->format('Y-m-d'),
                'month'      => $date->format('Y-m'),   // ✅ auto-derived
                'year'       => $date->format('Y'),       // ✅ auto-derived
                'reason'     => $request->reason,
                'status'     => 'approved', // ✅ direct final entry, no pending review step
            ]);

            return $this->sendResponse($leave, 'Leave recorded successfully', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }

    // ============================================
    // DELETE /api/leaves/{id}
    // (Kept in case you need to remove a mistakenly-entered record)
    // ============================================
    public function destroy($id)
    {
        $leave = EmployeeLeave::find($id);
        if (!$leave) {
            return $this->sendError('Leave record not found', 404);
        }

        $leave->delete();

        return $this->sendResponse(null, 'Leave record deleted successfully');
    }
}