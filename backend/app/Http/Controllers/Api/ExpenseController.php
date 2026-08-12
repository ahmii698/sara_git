<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FixedExpense;
use App\Models\ExtraExpense;
use Illuminate\Http\Request;
use Carbon\Carbon; // ✅ Add this

class ExpenseController extends Controller
{
    // ===== FIXED EXPENSES =====
    public function fixedExpenses(Request $request)
    {
        $query = FixedExpense::with('branch');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        // ✅ FIX: Sirf unpaid expenses dikhao (dashboard ke liye)
        if ($request->has('paid')) {
            $query->where('paid', $request->paid);
        } else {
            // ✅ Default: sirf unpaid expenses (dashboard ke liye)
            $query->where('paid', false);
        }

        return $this->sendResponse($query->get(), 'Fixed expenses retrieved');
    }

    // ✅ Helper: current cycle ki due date nikalo (day-of-month / ordinal / specific date)
    private function resolveCurrentDueDate($dueDate, Carbon $today)
    {
        if (preg_match('/^\d{1,2}$/', $dueDate)) {
            $day = intval($dueDate);
            return Carbon::create($today->year, $today->month, $day, 0, 0, 0);
        }

        if (preg_match('/^(\d{1,2})(st|nd|rd|th)?$/', $dueDate, $matches)) {
            $day = intval($matches[1]);
            return Carbon::create($today->year, $today->month, $day, 0, 0, 0);
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dueDate)) {
            return Carbon::parse($dueDate)->startOfDay();
        }

        return null;
    }

    // ✅ FIXED: Sabhi fixed expenses (paid + unpaid) - Monthly recurring logic
    public function allFixedExpenses(Request $request)
    {
        $query = FixedExpense::with('branch');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $expenses = $query->get();
        $today = Carbon::now();

        // ✅ Process each expense - check if due date has passed for new month
        $processedExpenses = $expenses->map(function ($expense) use ($today) {
            $currentDueDate = $this->resolveCurrentDueDate($expense->due_date, $today);

            if ($currentDueDate && $expense->paid) {
                $lastPaid = $expense->last_paid ? Carbon::parse($expense->last_paid) : null;

                // ✅ FIXED: Sirf tab reset karo jab payment PICHLE cycle ki thi
                // (last_paid current due date se pehle ka hai). Agar aaj hi,
                // isi due date ke baad pay kiya hai, to reset MAT karo.
                $wasPaidForOlderCycle = !$lastPaid || $lastPaid->lt($currentDueDate);

                if ($currentDueDate->isPast() && $wasPaidForOlderCycle) {
                    $expense->paid = false;
                    $expense->last_paid = null;
                    $expense->save();
                }
            }

            return $expense;
        });

        return $this->sendResponse($processedExpenses, 'All fixed expenses retrieved');
    }

    // ✅ NEW: Monthly auto-pay check - Manual trigger for testing
    public function checkMonthlyExpenses(Request $request)
    {
        $branchId = $request->branch_id;
        
        $query = FixedExpense::query();
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        
        $expenses = $query->get();
        $updated = 0;
        $today = Carbon::now();
        
        foreach ($expenses as $expense) {
            $currentDueDate = $this->resolveCurrentDueDate($expense->due_date, $today);
            $shouldUpdate = false;

            if ($currentDueDate && $expense->paid) {
                $lastPaid = $expense->last_paid ? Carbon::parse($expense->last_paid) : null;

                // ✅ FIXED: same-cycle payment ko reset mat karo
                $wasPaidForOlderCycle = !$lastPaid || $lastPaid->lt($currentDueDate);

                if ($currentDueDate->isPast() && $wasPaidForOlderCycle) {
                    $shouldUpdate = true;
                }
            }
            
            if ($shouldUpdate) {
                $expense->paid = false;
                $expense->last_paid = null;
                $expense->save();
                $updated++;
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => "{$updated} expense(s) reset for new month",
            'updated_count' => $updated,
            'branch_id' => $branchId
        ]);
    }

    public function storeFixed(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
            'due_date' => 'nullable|string|max:50',
            'paid' => 'nullable|boolean'
        ]);

        $data = $request->all();
        // ✅ New expense default unpaid
        $data['paid'] = $request->has('paid') ? $request->paid : false;
        
        $expense = FixedExpense::create($data);
        return $this->sendResponse($expense, 'Fixed expense created', 201);
    }

    public function updateFixed(Request $request, $id)
    {
        $expense = FixedExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $expense->update($request->all());
        return $this->sendResponse($expense, 'Fixed expense updated');
    }

    public function payFixed(Request $request, $id)
    {
        $expense = FixedExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $updateData = [
            'paid' => true,
            'last_paid' => Carbon::now()->format('Y-m-d H:i:s')
        ];

        if ($request->has('amount') && $request->amount !== null) {
            $updateData['amount'] = $request->amount;
        }

        $expense->update($updateData);

        return $this->sendResponse($expense, 'Fixed expense paid');
    }

    public function deleteFixed($id)
    {
        $expense = FixedExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $expense->delete();
        return $this->sendResponse(null, 'Fixed expense deleted');
    }

    // ===== EXTRA EXPENSES =====
    public function extraExpenses(Request $request)
    {
        $query = ExtraExpense::with('branch');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->month) {
            $query->whereRaw('DATE_FORMAT(date, "%Y-%m") = ?', [$request->month]);
        }

        return $this->sendResponse($query->orderBy('date', 'desc')->get(), 'Extra expenses retrieved');
    }

    public function storeExtra(Request $request)
    {
        $request->validate([
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
            'date' => 'nullable|date'
        ]);

        $data = $request->all();
        $data['date'] = $request->date ?? date('Y-m-d');

        $expense = ExtraExpense::create($data);
        return $this->sendResponse($expense, 'Extra expense created', 201);
    }

    public function updateExtra(Request $request, $id)
    {
        $expense = ExtraExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $request->validate([
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
            'date' => 'nullable|date'
        ]);

        $expense->update($request->all());
        return $this->sendResponse($expense, 'Extra expense updated');
    }

    public function deleteExtra($id)
    {
        $expense = ExtraExpense::find($id);
        if (!$expense) {
            return $this->sendError('Expense not found', 404);
        }

        $expense->delete();
        return $this->sendResponse(null, 'Extra expense deleted');
    }

    // ===== HELPER METHODS =====
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