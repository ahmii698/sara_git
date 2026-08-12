<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DailySheet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class DailySheetController extends Controller
{
    /**
     * GET /api/daily-sheet
     * Query params: period (daily|weekly|monthly), date, week (YYYY-Www), month (YYYY-MM),
     *               branch_id, is_admin (1/0), search
     *
     * Frontend jo bhi "period" bheje, usi hisaab se filter hota hai.
     * Branch: agar admin nahi hai to sirf apni branch ka data milega.
     */
    public function index(Request $request)
    {
        $query = DailySheet::query();

        $period = $request->get('period', 'daily');

        if ($period === 'daily') {
            $date = $request->get('date') ?: now()->toDateString();
            $query->whereDate('date', $date);
        } elseif ($period === 'weekly') {
            $week = $request->get('week'); // format: 2026-W32
            if ($week) {
                [$year, $weekNo] = $this->parseWeek($week);
                if ($year && $weekNo) {
                    $start = Carbon::now()->setISODate($year, $weekNo)->startOfWeek();
                    $end = (clone $start)->endOfWeek();
                    $query->whereBetween('date', [$start->toDateString(), $end->toDateString()]);
                }
            }
        } elseif ($period === 'monthly') {
            $month = $request->get('month'); // format: 2026-08
            if ($month) {
                [$year, $mon] = explode('-', $month);
                $query->whereYear('date', $year)->whereMonth('date', $mon);
            }
        }

        // Branch restriction — admin sab dekh sakta hai, baqi sirf apni branch
        $isAdmin = $request->boolean('is_admin');
        $branchId = $request->get('branch_id');
        if (!$isAdmin && $branchId) {
            $query->where('branch_id', $branchId);
        }

        // Search: date, salary_ac, challan
        $search = $request->get('search');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('salary_ac', 'like', "%{$search}%")
                  ->orWhere('challan', 'like', "%{$search}%")
                  ->orWhereDate('date', 'like', "%{$search}%");
            });
        }

        $entries = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $entries,
        ]);
    }

    /**
     * POST /api/daily-sheet
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date'           => 'required|date',
            'wallet_opening' => 'nullable|string|max:255',
            'installment'    => 'nullable|string|max:255',
            'dp_fi'          => 'nullable|string|max:255',
            'total'          => 'nullable|string|max:255',
            'challan'        => 'nullable|string|max:255',
            'rs'             => 'nullable|string|max:255',
            'salary_ac'      => 'nullable|string|max:255',
            'kp_dot'         => 'nullable|string|max:255',
            'expenses'       => 'nullable|string|max:255',
            'others'         => 'nullable|string|max:255',
            'cash_to_kp'     => 'nullable|string|max:255',
            'wallet_closing' => 'nullable|string|max:255',
            'branch_id'      => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $entry = DailySheet::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Entry added successfully.',
            'data' => $entry,
        ], 201);
    }

    /**
     * PUT /api/daily-sheet/{id}
     */
    public function update(Request $request, $id)
    {
        $entry = DailySheet::find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Entry not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'date'           => 'sometimes|required|date',
            'wallet_opening' => 'nullable|string|max:255',
            'installment'    => 'nullable|string|max:255',
            'dp_fi'          => 'nullable|string|max:255',
            'total'          => 'nullable|string|max:255',
            'challan'        => 'nullable|string|max:255',
            'rs'             => 'nullable|string|max:255',
            'salary_ac'      => 'nullable|string|max:255',
            'kp_dot'         => 'nullable|string|max:255',
            'expenses'       => 'nullable|string|max:255',
            'others'         => 'nullable|string|max:255',
            'cash_to_kp'     => 'nullable|string|max:255',
            'wallet_closing' => 'nullable|string|max:255',
            'branch_id'      => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $entry->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Entry updated successfully.',
            'data' => $entry,
        ]);
    }

    /**
     * DELETE /api/daily-sheet/{id}
     */
    public function destroy($id)
    {
        $entry = DailySheet::find($id);

        if (!$entry) {
            return response()->json([
                'success' => false,
                'message' => 'Entry not found.',
            ], 404);
        }

        $entry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Entry deleted successfully.',
        ]);
    }

    /**
     * "2026-W32" ko [year, weekNo] mein todta hai
     */
    private function parseWeek($week)
    {
        if (preg_match('/^(\d{4})-W(\d{1,2})$/', $week, $matches)) {
            return [(int) $matches[1], (int) $matches[2]];
        }
        return [null, null];
    }
}