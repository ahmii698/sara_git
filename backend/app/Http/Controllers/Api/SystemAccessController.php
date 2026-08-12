<?php
// app/Http/Controllers/Api/SystemAccessController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemAccessController extends Controller
{
    /**
     * Get all users grouped by role (admin, manager, employee)
     * ✅ Branch-wise filtering - har koi sirf apni branch ke users dekhega
     */
    public function index(Request $request)
    {
        try {
            // ✅ Branch ID from request (sent from frontend)
            $branchId = $request->get('branch_id');

            $query = User::query();

            // ✅ Agar branch_id di hai toh sirf us branch ke users
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $users = $query->orderBy('role', 'asc')
                ->orderBy('name', 'asc')
                ->get();

            // Group by role
            $grouped = [
                'admin' => [],
                'manager' => [],
                'employee' => [],
            ];

            foreach ($users as $user) {
                $role = $user->role ?? 'employee';
                if (!isset($grouped[$role])) {
                    $grouped[$role] = [];
                }
                
                $branchName = null;
                if ($user->branch_id) {
                    $branch = Branch::find($user->branch_id);
                    $branchName = $branch ? $branch->name : 'Branch ' . $user->branch_id;
                }

                $grouped[$role][] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'cnic' => $user->cnic,
                    'address' => $user->address,
                    'role' => $user->role,
                    'branch_id' => $user->branch_id,
                    'branch_name' => $branchName,
                    'salary' => $user->salary,
                    'is_active' => $user->is_active == 1,
                    'cnic_front' => $user->cnic_front ? asset('storage/' . $user->cnic_front) : null,
                    'cnic_back' => $user->cnic_back ? asset('storage/' . $user->cnic_back) : null,
                    'agreement_form' => $user->agreement_form ? asset('storage/' . $user->agreement_form) : null,
                    'voice_consent' => $user->voice_consent ? asset('storage/' . $user->voice_consent) : null,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            }

            // Counts
            $summary = [
                'total_admin' => count($grouped['admin']),
                'total_manager' => count($grouped['manager']),
                'total_employee' => count($grouped['employee']),
                'total_users' => count($users),
            ];

            return response()->json([
                'success' => true,
                'data' => $grouped,
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single user details
     */
    public function show($id)
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $branchName = null;
            if ($user->branch_id) {
                $branch = Branch::find($user->branch_id);
                $branchName = $branch ? $branch->name : 'Branch ' . $user->branch_id;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'cnic' => $user->cnic,
                    'address' => $user->address,
                    'role' => $user->role,
                    'branch_id' => $user->branch_id,
                    'branch_name' => $branchName,
                    'salary' => $user->salary,
                    'is_active' => $user->is_active == 1,
                    'cnic_front' => $user->cnic_front ? asset('storage/' . $user->cnic_front) : null,
                    'cnic_back' => $user->cnic_back ? asset('storage/' . $user->cnic_back) : null,
                    'agreement_form' => $user->agreement_form ? asset('storage/' . $user->agreement_form) : null,
                    'voice_consent' => $user->voice_consent ? asset('storage/' . $user->voice_consent) : null,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user status (active/inactive)
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $user = User::find($id);
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $user->is_active = $user->is_active == 1 ? 0 : 1;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'data' => [
                    'id' => $user->id,
                    'is_active' => $user->is_active == 1
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}