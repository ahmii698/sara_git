<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashFlowEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;

class CashFlowController extends Controller
{
    /**
     * GET /api/cashflow
     * Optional query params: year, month, branch
     */
    public function index(Request $request)
    {
        $query = CashFlowEntry::query();

        if ($request->filled('year')) {
            $query->whereYear('date', $request->year);
        }

        if ($request->filled('month') && $request->month !== 'all') {
            $query->whereMonth('date', (int) $request->month + 1); // frontend month 0-indexed hai
        }

        if ($request->filled('branch')) {
            $query->where('branch', $request->branch);
        }

        $entries = $query->orderBy('date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $entries,
        ]);
    }

    /**
     * GET /api/cashflow/{id}
     */
    public function show($id)
    {
        $entry = CashFlowEntry::find($id);

        if (!$entry) {
            return response()->json(['success' => false, 'message' => 'Entry not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $entry]);
    }

    /**
     * POST /api/cashflow
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id' => 'nullable|string|max:40',
            'date' => 'required|date',
            'note' => 'nullable|string|max:255',
            'inflows' => 'required|array',
            'inflows.*.label' => 'required|string',
            'inflows.*.amount' => 'nullable',
            'outflows' => 'required|array',
            'outflows.*.label' => 'required|string',
            'outflows.*.amount' => 'nullable',
            'branch' => 'nullable|integer',
            'created_by' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $entry = CashFlowEntry::create([
            'id' => $request->id ?? (string) Str::uuid(),
            'date' => $request->date,
            'note' => $request->note,
            'inflows' => $request->inflows,
            'outflows' => $request->outflows,
            'branch' => $request->branch,
            'created_by' => $request->created_by,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entry added successfully!',
            'data' => $entry,
        ], 201);
    }

    /**
     * PUT /api/cashflow/{id}
     */
    public function update(Request $request, $id)
    {
        $entry = CashFlowEntry::find($id);

        if (!$entry) {
            return response()->json(['success' => false, 'message' => 'Entry not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'date' => 'required|date',
            'note' => 'nullable|string|max:255',
            'inflows' => 'required|array',
            'outflows' => 'required|array',
            'branch' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $entry->update([
            'date' => $request->date,
            'note' => $request->note,
            'inflows' => $request->inflows,
            'outflows' => $request->outflows,
            'branch' => $request->branch ?? $entry->branch,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entry updated successfully!',
            'data' => $entry,
        ]);
    }

    /**
     * DELETE /api/cashflow/{id}
     */
    public function destroy($id)
    {
        $entry = CashFlowEntry::find($id);

        if (!$entry) {
            return response()->json(['success' => false, 'message' => 'Entry not found'], 404);
        }

        $entry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Entry deleted successfully!',
        ]);
    }
}