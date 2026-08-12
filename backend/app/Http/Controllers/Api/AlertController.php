<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function index(Request $request)
    {
        $query = Alert::with(['creator', 'branch'])->orderBy('id', 'desc');

        if ($request->type && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('customer_name', 'LIKE', "%{$request->search}%")
                  ->orWhere('customer_cnic', 'LIKE', "%{$request->search}%")
                  ->orWhere('case_no', 'LIKE', "%{$request->search}%")
                  ->orWhere('message', 'LIKE', "%{$request->search}%");
            });
        }

        $alerts = $query->paginate(30);

        return response()->json([
            'success' => true,
            'message' => 'Alerts retrieved successfully',
            'data' => $alerts,
        ]);
    }

    public function counts()
    {
        $counts = Alert::selectRaw('type, COUNT(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        return response()->json([
            'success' => true,
            'data' => [
                'cnic' => $counts['cnic'] ?? 0,
                'limit' => $counts['limit'] ?? 0,
                'account' => $counts['account'] ?? 0,
                'guarantor' => $counts['guarantor'] ?? 0,
                'total' => array_sum($counts->toArray()),
            ],
        ]);
    }

    public function destroy($id)
    {
        $alert = Alert::find($id);
        if (!$alert) {
            return response()->json(['success' => false, 'message' => 'Alert not found'], 404);
        }
        $alert->delete();

        return response()->json(['success' => true, 'message' => 'Alert deleted']);
    }
}