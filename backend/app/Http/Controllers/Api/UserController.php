<?php
// app/Http/Controllers/Api/UserController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        // ✅ UPDATED: added 'createdBy' relation so System Access page knows who created each account
        // ✅ NEW: withCount('employeeAccounts as accounts_count') so Salary page shows real account count per employee
        $query = User::with(['branch', 'createdBy'])
            ->withCount('employeeAccounts as accounts_count');

        if ($request->email) {
            $query->where('email', $request->email);
        }

        if ($request->role) {
            $query->where('role', $request->role);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('has_system_access')) {
            $query->where('has_system_access', $request->boolean('has_system_access') ? 1 : 0);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
        }

        $query->orderBy('id', 'desc');

        if ($request->boolean('paginate', true) === false) {
            $users = $query->get();
        } else {
            $users = $query->paginate(20);
        }

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function show($id)
    {
        $user = User::with(['branch', 'customers', 'accounts', 'employeeAccounts', 'createdBy'])->find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    // ============================================
    // ✅ SYSTEM ACCESS - Get users with system access
    // ============================================
    public function systemAccess(Request $request)
    {
        // ✅ UPDATED: added 'createdBy' relation so we know who created each account
        $query = User::with(['branch', 'createdBy'])
            ->where('is_active', 1)
            ->where(function($q) {
                $q->where('role', 'admin')
                  ->orWhere('role', 'manager')
                  ->orWhere('role', 'employee'); // ✅ FIX: ab saare active employees query mein aayenge
                  // (pehle sirf has_system_access=1 wale employees hi query mein aate the,
                  // isliye "All Employees" table se baaki employees gayab ho jate the)
            });

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        $users = $query->orderBy('role', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        // Group by role
        $grouped = [
            'admin' => $users->where('role', 'admin')->values(),
            'manager' => $users->where('role', 'manager')->values(),
            // ✅ FIX: 'employee' ab SAARE employees return karega (access ho ya na ho).
            // "System Access List" wali filtered list frontend khud alag se bana leta
            // hai: employees.filter(u => u.has_system_access === true)
            'employee' => $users->where('role', 'employee')->values(),
        ];

        $summary = [
            'total_admin' => $grouped['admin']->count(),
            'total_manager' => $grouped['manager']->count(),
            'total_employee' => $grouped['employee']->count(),
            'total_users' => $users->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $grouped,
            'summary' => $summary
        ]);
    }

    // ============================================
    // ✅ TOGGLE SYSTEM ACCESS
    // ============================================
    public function toggleSystemAccess(Request $request, $id)
    {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'has_system_access' => 'required|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user->has_system_access = $request->boolean('has_system_access') ? 1 : 0;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => $user->has_system_access ? 'System access granted' : 'System access revoked',
            'data' => $user
        ]);
    }

    // ============================================
    // ✅ PUBLIC - CHECK USER BY EMAIL
    // ============================================
    public function checkUser(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'role' => 'nullable|string'
            ]);

            $query = User::where('email', $request->email);

            if ($request->role) {
                $query->where('role', $request->role);
            }

            $user = $query->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ PUBLIC - UPDATE PASSWORD
    // ============================================
    public function updatePasswordPublic(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|min:6',
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Password updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ STORE - WITH VOICE CONSENT & SYSTEM ACCESS
    // ============================================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|in:admin,manager,employee',
            'branch_id' => 'nullable|exists:branches,id',
            'salary' => 'nullable|numeric|min:0',
            'has_system_access' => 'nullable|boolean',
            'cnic_front' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'cnic_back' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'agreement_form' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120',
            // ✅ FIX: mimes list widen kiya (m4a/wav/mp3 tak limited tha, ab
            // aac/ogg/webm/3gp/flac/wma bhi allow — mobile recorders aksar
            // in formats mein save karte hain). max bhi 10MB se 20MB kiya.
            'voice_consent' => 'nullable|file|mimes:mp3,wav,m4a,aac,ogg,oga,webm,3gp,flac,wma|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->all();
        $data['password'] = Hash::make($request->password);
        $data['has_system_access'] = $request->has('has_system_access') ? $request->has_system_access : 0;
        $data['created_by'] = $request->user()->id; // ✅ NEW: track who created this account

        // Upload CNIC Front
        if ($request->hasFile('cnic_front')) {
            $file = $request->file('cnic_front');
            $filename = time() . '_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/cnic/front', $filename, 'public');
            $data['cnic_front'] = $path;
        }

        // Upload CNIC Back
        if ($request->hasFile('cnic_back')) {
            $file = $request->file('cnic_back');
            $filename = time() . '_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/cnic/back', $filename, 'public');
            $data['cnic_back'] = $path;
        }

        // Upload Agreement
        if ($request->hasFile('agreement_form')) {
            $file = $request->file('agreement_form');
            $filename = time() . '_agreement_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/agreement', $filename, 'public');
            $data['agreement_form'] = $path;
        }

        // Upload Voice Consent
        if ($request->hasFile('voice_consent')) {
            $file = $request->file('voice_consent');
            $filename = time() . '_voice_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/voice', $filename, 'public');
            $data['voice_consent'] = $path;
        }

        $user = User::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully',
            'data' => $user
        ], 201);
    }

    // ============================================
    // ✅ UPDATE - WITH VOICE CONSENT & SYSTEM ACCESS
    // ============================================
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|in:admin,manager,employee',
            'branch_id' => 'nullable|exists:branches,id',
            'salary' => 'nullable|numeric|min:0',
            'is_active' => 'nullable|boolean',
            'has_system_access' => 'nullable|boolean',
            'password' => 'nullable|min:6',
            'cnic_front' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'cnic_back' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'agreement_form' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120',
            // ✅ FIX: same widen as store() above
            'voice_consent' => 'nullable|file|mimes:mp3,wav,m4a,aac,ogg,oga,webm,3gp,flac,wma|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except(['password', 'cnic_front', 'cnic_back', 'agreement_form', 'voice_consent']);

        if ($request->has('has_system_access')) {
            $data['has_system_access'] = $request->boolean('has_system_access') ? 1 : 0;
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        // Upload CNIC Front
        if ($request->hasFile('cnic_front')) {
            if ($user->cnic_front && Storage::disk('public')->exists($user->cnic_front)) {
                Storage::disk('public')->delete($user->cnic_front);
            }
            $file = $request->file('cnic_front');
            $filename = time() . '_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/cnic/front', $filename, 'public');
            $data['cnic_front'] = $path;
        }

        // Upload CNIC Back
        if ($request->hasFile('cnic_back')) {
            if ($user->cnic_back && Storage::disk('public')->exists($user->cnic_back)) {
                Storage::disk('public')->delete($user->cnic_back);
            }
            $file = $request->file('cnic_back');
            $filename = time() . '_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/cnic/back', $filename, 'public');
            $data['cnic_back'] = $path;
        }

        // Upload Agreement
        if ($request->hasFile('agreement_form')) {
            if ($user->agreement_form && Storage::disk('public')->exists($user->agreement_form)) {
                Storage::disk('public')->delete($user->agreement_form);
            }
            $file = $request->file('agreement_form');
            $filename = time() . '_agreement_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/agreement', $filename, 'public');
            $data['agreement_form'] = $path;
        }

        // Upload Voice Consent
        if ($request->hasFile('voice_consent')) {
            if ($user->voice_consent && Storage::disk('public')->exists($user->voice_consent)) {
                Storage::disk('public')->delete($user->voice_consent);
            }
            $file = $request->file('voice_consent');
            $filename = time() . '_voice_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('employees/voice', $filename, 'public');
            $data['voice_consent'] = $path;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    // ============================================
    // ✅ DESTROY - WITH VOICE CONSENT
    // ============================================
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Delete files from storage
        $files = [
            $user->cnic_front,
            $user->cnic_back,
            $user->agreement_form,
            $user->voice_consent
        ];

        foreach ($files as $file) {
            if ($file && Storage::disk('public')->exists($file)) {
                Storage::disk('public')->delete($file);
            }
        }

        $user->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    // ============================================
    // ✅ HELPER METHODS
    // ============================================
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