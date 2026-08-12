<?php
// app/Http/Controllers/Api/CustomerController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Guarantor;
use App\Models\EmployeeAccount;
use App\Models\Account;
use App\Models\Installment;
use App\Models\User;
use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class CustomerController extends Controller
{
    const MAX_ACCOUNTS_PER_CNIC = 2;
    const MAX_COMBINED_AMOUNT = 100000;
    const CASE_NO_START = 10000; // ✅ case number yahan se start hoga (naye records ke liye)

    public function index(Request $request)
    {
        $query = Customer::with(['branch', 'creator', 'accounts', 'employeeAccount', 'employeeAccount.employee']);

        if ($request->search) {
            $query->where('name', 'LIKE', "%{$request->search}%")
                  ->orWhere('cnic', 'LIKE', "%{$request->search}%")
                  ->orWhere('phone', 'LIKE', "%{$request->search}%")
                  ->orWhere('phone_2', 'LIKE', "%{$request->search}%")
                  ->orWhere('phone_3', 'LIKE', "%{$request->search}%")
                  ->orWhere('phone_4', 'LIKE', "%{$request->search}%")
                  ->orWhere('product_name', 'LIKE', "%{$request->search}%");
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $customers = $query->orderBy('id', 'desc')->paginate(20);
        return $this->sendResponse($customers, 'Customers retrieved successfully');
    }

    public function show($id)
    {
        $customer = Customer::with([
            'branch', 'creator', 'guarantors', 'employeeAccount.employee',
            'accounts' => function($q) {
                $q->with(['product', 'installments']);
            }
        ])->find($id);

        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        return $this->sendResponse($customer, 'Customer details retrieved');
    }

    public function checkCnic(Request $request)
    {
        $request->validate(['cnic' => 'required|string']);

        $cnic = $request->cnic;
        $cleanCnic = preg_replace('/[^0-9]/', '', $cnic);

        $customers = Customer::where('cnic', $cnic)
            ->orWhere('cnic', $cleanCnic)
            ->with([
                'accounts' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
                'accounts.installments',
                'accounts.creator',
                'accounts.employeeAccount.employee',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        $guarantorRecords = Guarantor::where('cnic', $cnic)
            ->orWhere('cnic', $cleanCnic)
            ->with('customer')
            ->get();

        $existsAsCustomer = $customers->isNotEmpty();
        $existsAsGuarantor = $guarantorRecords->isNotEmpty();

        $isUnlimited = Customer::where('cnic', $cnic)
            ->orWhere('cnic', $cleanCnic)
            ->where('is_unlimited', true)
            ->exists();

        $allAccounts = collect();
        foreach ($customers as $cust) {
            foreach ($cust->accounts as $acc) {
                $allAccounts->push($acc);
            }
        }

        $openAccounts = $allAccounts->where('balance', '>', 0);
        $accountsCount = $openAccounts->count();
        $totalCombinedAmount = (float) $openAccounts->sum('total_amount');

        $canOpenMore = true;
        $remainingLimit = self::MAX_COMBINED_AMOUNT;

        if ($isUnlimited) {
            $canOpenMore = true;
            $remainingLimit = null;
        } else {
            $canOpenMore = $accountsCount < self::MAX_ACCOUNTS_PER_CNIC
                && $totalCombinedAmount < self::MAX_COMBINED_AMOUNT;
            $remainingLimit = max(0, self::MAX_COMBINED_AMOUNT - $totalCombinedAmount);
        }

        $accountsData = $allAccounts->sortByDesc('created_at')->values()->map(function ($acc) {
            return [
                'id' => $acc->id,
                'customer_id' => $acc->customer_id,
                'case_no' => $acc->case_no,
                'product_name' => $acc->product_name,
                'total_amount' => (float) $acc->total_amount,
                'paid_amount' => (float) $acc->paid_amount,
                'balance' => (float) $acc->balance,
                'monthly_installment' => (float) $acc->monthly_installment,
                'total_installments' => $acc->total_installments,
                'installments_paid' => $acc->installments_paid,
                'status' => $acc->status,
                'branch_id' => $acc->branch_id,
                'created_at' => $acc->created_at,
                'creator_name' => $acc->creator->name ?? 'N/A',
                'employee_name' => $acc->employeeAccount->employee->name ?? 'N/A',
                'installments' => $acc->installments->map(function ($i) {
                    return [
                        'month' => $i->month,
                        'due_amount' => (float) $i->due_amount,
                        'paid_amount' => (float) $i->paid_amount,
                        'balance' => (float) $i->balance,
                        'status' => $i->status,
                    ];
                }),
            ];
        });

        $primaryCustomer = $customers->first();

        return $this->sendResponse([
            'cnic' => $cnic,
            'exists_as_customer' => $existsAsCustomer,
            'exists_as_guarantor' => $existsAsGuarantor,
            'is_available' => !($existsAsCustomer || $existsAsGuarantor),
            'customer' => $primaryCustomer ? [
                'id' => $primaryCustomer->id,
                'name' => $primaryCustomer->name,
                'cnic' => $primaryCustomer->cnic,
                'phone' => $primaryCustomer->phone,
                'phone_2' => $primaryCustomer->phone_2,
                'phone_3' => $primaryCustomer->phone_3,
                'phone_4' => $primaryCustomer->phone_4,
                'address' => $primaryCustomer->address,
                'work' => $primaryCustomer->work,
                'branch_id' => $primaryCustomer->branch_id,
                'created_at' => $primaryCustomer->created_at,
            ] : null,
            'accounts' => $accountsData,
            'accounts_count' => $accountsCount,
            'total_combined_amount' => $totalCombinedAmount,
            'can_open_more' => $canOpenMore,
            'remaining_limit' => $remainingLimit,
            'is_unlimited' => $isUnlimited,
            'guarantor_records' => $guarantorRecords->map(function ($g) {
                return [
                    'guarantor_name' => $g->name,
                    'guarantor_cnic' => $g->cnic,
                    'customer_name' => $g->customer->name ?? 'N/A',
                    'customer_cnic' => $g->customer->cnic ?? 'N/A',
                    'customer_id' => $g->customer_id,
                ];
            }),
            'message' => $existsAsCustomer ? 'This CNIC already exists as a customer' :
                        ($existsAsGuarantor ? 'This CNIC already exists as a guarantor' :
                        'CNIC is available')
        ], 'CNIC check completed');
    }

    public function store(Request $request)
    {
        try {
            Log::info('========== CUSTOMER STORE REQUEST ==========');
            Log::info('created_by (logged-in admin/manager):', [$request->created_by]);
            Log::info('employee_id (selected employee):', [$request->input('employee_id')]);
            Log::info('product_name:', [$request->product_name]);

            $isOldRecord = filter_var($request->input('is_old_record', false), FILTER_VALIDATE_BOOLEAN);
            $manualCaseNo = trim((string) $request->input('case_no', ''));
            Log::info('is_old_record:', [$isOldRecord]);
            Log::info('manual case_no:', [$manualCaseNo]);

            // ✅ Get slip_no from request
            $slipNo = $request->input('slip_no') ?? $request->input('first_installment_slip_no');
            Log::info('slip_no:', [$slipNo]);

            $cleanCnic = preg_replace('/[^0-9]/', '', $request->cnic ?? '');

            $existingCustomer = Customer::where('cnic', $request->cnic)
                ->orWhere('cnic', $cleanCnic)
                ->with('accounts')
                ->first();

            $isUnlimitedCnic = Customer::where('cnic', $request->cnic)
                ->orWhere('cnic', $cleanCnic)
                ->where('is_unlimited', true)
                ->exists();

            $pendingAlerts = [];

            if (!$isOldRecord) {
                if ($existingCustomer) {
                    $pendingAlerts[] = [
                        'type' => 'cnic',
                        'message' => "CNIC {$request->cnic} pehle se customer ke tor pe register hai ({$existingCustomer->name}). Isi CNIC ke liye naya account open kiya gaya hai.",
                    ];

                    $openAccounts = Account::whereHas('customer', function ($q) use ($request, $cleanCnic) {
                        $q->where('cnic', $request->cnic)->orWhere('cnic', $cleanCnic);
                    })->where('balance', '>', 0)->get();

                    $existingAccountsCount = $openAccounts->count();
                    $existingTotal = (float) $openAccounts->sum('total_amount');
                    $newAccountAmount = (float) $request->input('invoice_price', 0);

                    if (!$isUnlimitedCnic && $existingAccountsCount >= self::MAX_ACCOUNTS_PER_CNIC) {
                        $pendingAlerts[] = [
                            'type' => 'account',
                            'message' => "Is CNIC ke pehle se {$existingAccountsCount} account(s) hain (limit " . self::MAX_ACCOUNTS_PER_CNIC . "). Yeh account #" . ($existingAccountsCount + 1) . " bana hai isi CNIC ke liye.",
                        ];
                    }

                    if (!$isUnlimitedCnic && ($existingTotal + $newAccountAmount) > self::MAX_COMBINED_AMOUNT) {
                        $pendingAlerts[] = [
                            'type' => 'limit',
                            'message' => "Is CNIC ka combined amount PKR " . number_format($existingTotal + $newAccountAmount) . " ban gaya hai, jo PKR " . number_format(self::MAX_COMBINED_AMOUNT) . " ki limit se zyada hai.",
                        ];
                    }
                } else {
                    $newAccountAmount = (float) $request->input('invoice_price', 0);
                    if (!$isUnlimitedCnic && $newAccountAmount > self::MAX_COMBINED_AMOUNT) {
                        $pendingAlerts[] = [
                            'type' => 'limit',
                            'message' => "Account amount PKR " . number_format($newAccountAmount) . " limit PKR " . number_format(self::MAX_COMBINED_AMOUNT) . " se zyada hai.",
                        ];
                    }
                }
            } else {
                Log::info('✅ Old Record mode — koi limit check ya alert nahi banega', ['cnic' => $request->cnic]);
            }

            // Get guarantors from request
            $guarantors = [];

            if ($request->has('guarantors')) {
                $input = $request->input('guarantors');

                if (is_string($input)) {
                    $decoded = json_decode($input, true);
                    if (is_array($decoded)) {
                        $guarantors = $decoded;
                    }
                }
                elseif (is_array($input)) {
                    $guarantors = $input;
                }
            }

            if (empty($guarantors)) {
                $temp = [];
                $index = 0;
                while ($request->has("guarantors.{$index}.name")) {
                    $temp[] = [
                        'name' => $request->input("guarantors.{$index}.name"),
                        'cnic' => $request->input("guarantors.{$index}.cnic"),
                        'phone' => $request->input("guarantors.{$index}.phone"),
                        'address' => $request->input("guarantors.{$index}.address", ''),
                    ];
                    $index++;
                }
                if (!empty($temp)) {
                    $guarantors = $temp;
                }
            }

            if (empty($guarantors)) {
                $all = $request->all();
                if (isset($all['guarantors']) && is_array($all['guarantors'])) {
                    $guarantors = $all['guarantors'];
                }
            }

            Log::info('Guarantors extracted:', ['count' => count($guarantors)]);

            $validGuarantors = [];
            foreach ($guarantors as $g) {
                if (!empty($g['name']) && !empty($g['cnic']) && !empty($g['phone'])) {
                    $validGuarantors[] = [
                        'name' => trim($g['name']),
                        'cnic' => trim($g['cnic']),
                        'phone' => trim($g['phone']),
                        'address' => isset($g['address']) ? trim($g['address']) : '',
                    ];
                }
            }

            Log::info('Valid Guarantors count:', ['count' => count($validGuarantors)]);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'cnic' => 'required|string',
                'phone' => 'required|string|max:20',
                'phone_2' => 'nullable|string|max:20',
                'phone_3' => 'nullable|string|max:20',
                'phone_4' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'work' => 'nullable|string|max:100',
                'product_name' => 'nullable|string|max:255',
                'branch_id' => 'required|exists:branches,id',
                'status' => 'nullable|in:active,hold,closed',
                'created_by' => 'required|exists:users,id',
                'employee_id' => 'nullable|exists:users,id',
                'invoice_price' => 'required|numeric|min:0',
                'advance_payment' => 'nullable|numeric|min:0',
                'number_of_installments' => 'required|integer|min:1',
                'due_date' => 'required|date',
                'first_installment_payment' => 'nullable|numeric|min:0',
                'is_old_record' => 'nullable|boolean',
                'account_date' => 'nullable|date',   // ✅ NEW: Old Record ke liye manual date
                'case_no' => 'nullable|string|max:50',
                'slip_no' => 'nullable|string|max:255', // ✅ NEW
                'voice_consent' => 'nullable|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
                'voice_consent_2' => 'nullable|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
                'voice_consent_3' => 'nullable|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
                'voice_consent_4' => 'nullable|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }

            $loggedInUserId = $request->created_by;
            $employeeId = $request->input('employee_id', $loggedInUserId);

            Log::info('✅ Logged-in user (creator):', ['id' => $loggedInUserId]);
            Log::info('✅ Employee ID (opened by):', ['id' => $employeeId]);

            if (count($validGuarantors) < 1) {
                return response()->json([
                    'success' => false,
                    'errors' => [
                        'guarantors' => ['Minimum 1 guarantor is required. Found: ' . count($validGuarantors)]
                    ]
                ], 422);
            }

            if (count($validGuarantors) > 3) {
                return response()->json([
                    'success' => false,
                    'errors' => [
                        'guarantors' => ['Maximum 3 guarantors are allowed. Found: ' . count($validGuarantors)]
                    ]
                ], 422);
            }

            if (!$isOldRecord) {
                foreach ($validGuarantors as $g) {
                    $gCleanCnic = preg_replace('/[^0-9]/', '', $g['cnic']);

                    $gAsCustomer = Customer::where('cnic', $g['cnic'])
                        ->orWhere('cnic', $gCleanCnic)
                        ->first();
                    if ($gAsCustomer) {
                        $pendingAlerts[] = [
                            'type' => 'guarantor',
                            'message' => "Guarantor \"{$g['name']}\" (CNIC {$g['cnic']}) pehle se customer hai: {$gAsCustomer->name}.",
                        ];
                    }

                    $gExistingRecords = Guarantor::where('cnic', $g['cnic'])
                        ->orWhere('cnic', $gCleanCnic)
                        ->with('customer')
                        ->get();
                    if ($gExistingRecords->isNotEmpty()) {
                        $names = $gExistingRecords->map(function ($r) {
                            return $r->customer->name ?? 'N/A';
                        })->implode(', ');
                        $pendingAlerts[] = [
                            'type' => 'guarantor',
                            'message' => "Guarantor \"{$g['name']}\" (CNIC {$g['cnic']}) pehle se guarantor hai: {$names}.",
                        ];
                    }
                }
            } else {
                Log::info('✅ Old Record mode — skipping guarantor CNIC checks (no alerts either)');
            }

            if ($isOldRecord) {
                if ($manualCaseNo === '') {
                    return response()->json([
                        'success' => false,
                        'errors' => [
                            'case_no' => ['Old Record mode: Case number manually likhna zaroori hai.']
                        ]
                    ], 422);
                }

                if (!ctype_digit($manualCaseNo)) {
                    return response()->json([
                        'success' => false,
                        'errors' => [
                            'case_no' => ['Case number sirf numbers mein hona chahiye.']
                        ]
                    ], 422);
                }

                $numericCaseNo = (int) $manualCaseNo;

                if ($numericCaseNo >= self::CASE_NO_START) {
                    return response()->json([
                        'success' => false,
                        'errors' => [
                            'case_no' => ['Old Record: Case number ' . self::CASE_NO_START . ' se kam hona chahiye (sirf purane records ke liye). Naye records khud-ba-khud ' . self::CASE_NO_START . ' se generate hote hain.']
                        ]
                    ], 422);
                }

                if ($numericCaseNo <= 0) {
                    return response()->json([
                        'success' => false,
                        'errors' => [
                            'case_no' => ['Case number valid hona chahiye (0 se zyada).']
                        ]
                    ], 422);
                }
            }

            // ✅ NEW: Old Record ke liye manual account_date use karo, warna now()
            $accountDate = $request->filled('account_date')
                ? \Carbon\Carbon::parse($request->input('account_date'))
                : now();

            Log::info('✅ Account date decided:', ['account_date' => $accountDate->toDateTimeString(), 'is_old_record' => $isOldRecord]);

            $employee = User::find($employeeId);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found with ID: ' . $employeeId
                ], 422);
            }

            $allowedRoles = ['employee', 'admin', 'manager'];
            if (!in_array($employee->role, $allowedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected user is not authorized. Role: ' . $employee->role
                ], 422);
            }

            Log::info('✅ Employee verified:', ['id' => $employeeId, 'name' => $employee->name, 'role' => $employee->role]);

            // ============================================
            // ✅ Handle all file uploads
            // ============================================

            // CNIC Images
            $cnicFrontPath = null;
            if ($request->hasFile('cnic_front')) {
                $file = $request->file('cnic_front');
                $destinationPath = public_path('storage/customers/cnic_front');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $cnicFrontPath = 'customers/cnic_front/' . $filename;
            }

            $cnicBackPath = null;
            if ($request->hasFile('cnic_back')) {
                $file = $request->file('cnic_back');
                $destinationPath = public_path('storage/customers/cnic_back');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $cnicBackPath = 'customers/cnic_back/' . $filename;
            }

            // ✅ Voice Consent — ab 4 tak, loop se handle
            $voiceConsentPaths = [
                'voice_consent' => null,
                'voice_consent_2' => null,
                'voice_consent_3' => null,
                'voice_consent_4' => null,
            ];

            foreach (array_keys($voiceConsentPaths) as $voiceField) {
                if ($request->hasFile($voiceField)) {
                    $file = $request->file($voiceField);
                    $destinationPath = public_path('storage/customers/voice');
                    if (!file_exists($destinationPath)) {
                        mkdir($destinationPath, 0777, true);
                    }
                    $filename = time() . '_' . $voiceField . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $file->move($destinationPath, $filename);
                    $voiceConsentPaths[$voiceField] = 'customers/voice/' . $filename;
                }
            }

            // Additional Images
            $additionalImage1Path = null;
            if ($request->hasFile('additional_image_1')) {
                $file = $request->file('additional_image_1');
                $destinationPath = public_path('storage/customers/additional_images');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_add1_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $additionalImage1Path = 'customers/additional_images/' . $filename;
            }

            $additionalImage2Path = null;
            if ($request->hasFile('additional_image_2')) {
                $file = $request->file('additional_image_2');
                $destinationPath = public_path('storage/customers/additional_images');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_add2_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $additionalImage2Path = 'customers/additional_images/' . $filename;
            }

            // ============================================
            // ✅ Bill Images Upload
            // ============================================
            $billImage1Path = null;
            if ($request->hasFile('bill_image_1')) {
                $file = $request->file('bill_image_1');
                $destinationPath = public_path('storage/customers/bill_images');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_bill1_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $billImage1Path = 'customers/bill_images/' . $filename;
            }

            $billImage2Path = null;
            if ($request->hasFile('bill_image_2')) {
                $file = $request->file('bill_image_2');
                $destinationPath = public_path('storage/customers/bill_images');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_bill2_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $billImage2Path = 'customers/bill_images/' . $filename;
            }

            // ============================================
            // ✅ Chalan Images Upload
            // ============================================
            $chalanFrontPath = null;
            if ($request->hasFile('chalan_front')) {
                $file = $request->file('chalan_front');
                $destinationPath = public_path('storage/accounts/chalan_front');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_chalan_front_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $chalanFrontPath = 'accounts/chalan_front/' . $filename;
            }

            $chalanBackPath = null;
            if ($request->hasFile('chalan_back')) {
                $file = $request->file('chalan_back');
                $destinationPath = public_path('storage/accounts/chalan_back');
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_chalan_back_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $chalanBackPath = 'accounts/chalan_back/' . $filename;
            }

            DB::beginTransaction();

            try {
                // ✅ 1. Create Customer
                $customer = Customer::create([
                    'name' => $request->name,
                    'cnic' => $request->cnic,
                    'phone' => $request->phone,
                    'phone_2' => $request->phone_2,
                    'phone_3' => $request->phone_3,
                    'phone_4' => $request->phone_4,
                    'address' => $request->address ?? '',
                    'work' => $request->work ?? '',
                    'product_name' => $request->product_name ?? '',
                    'branch_id' => $request->branch_id,
                    'status' => $request->status ?? 'active',
                    'created_by' => $loggedInUserId,
                    'cnic_front' => $cnicFrontPath,
                    'cnic_back' => $cnicBackPath,
                    'voice_consent' => $voiceConsentPaths['voice_consent'],
                    'voice_consent_2' => $voiceConsentPaths['voice_consent_2'],
                    'voice_consent_3' => $voiceConsentPaths['voice_consent_3'],
                    'voice_consent_4' => $voiceConsentPaths['voice_consent_4'],
                    'additional_image_1' => $additionalImage1Path,
                    'additional_image_2' => $additionalImage2Path,
                    'bill_image_1' => $billImage1Path,
                    'bill_image_2' => $billImage2Path,
                    'created_at' => $accountDate,   // ✅ FIX
                    'updated_at' => now(),
                ]);

                Log::info('✅ Customer created:', ['id' => $customer->id, 'created_by' => $loggedInUserId]);

                // ✅ 2. Create Employee Account
                $employeeAccount = EmployeeAccount::create([
                    'employee_id' => $employeeId,
                    'customer_id' => $customer->id,
                    'branch_id' => $request->branch_id,
                    'account_opened_date' => $accountDate,   // ✅ FIX (was now())
                    'month' => $accountDate->format('Y-m'),  // ✅ FIX
                    'year' => $accountDate->year,            // ✅ FIX
                    'status' => 'active',
                    'created_by' => $loggedInUserId,
                    'created_at' => $accountDate,            // ✅ FIX
                    'updated_at' => now(),
                ]);

                Log::info('✅ EmployeeAccount created:', ['id' => $employeeAccount->id, 'employee_id' => $employeeId, 'created_by' => $loggedInUserId]);

                // ✅ 3. Create Account
                $invoicePrice = (float) $request->invoice_price;
                $advancePayment = (float) ($request->advance_payment ?? 0);
                $numberOfInstallments = (int) $request->number_of_installments;
                $dueDate = $request->due_date;

                $remainingAmount = $invoicePrice - $advancePayment;
                $monthlyInstallment = $numberOfInstallments > 0 ? round($remainingAmount / $numberOfInstallments, 0) : 0;

                if ($isOldRecord && $manualCaseNo !== '') {
                    $caseNo = $manualCaseNo;
                    Log::info('✅ Using manual case_no (Old Record mode):', ['case_no' => $caseNo]);
                } else {
                    $lastCaseNo = Account::whereRaw("case_no REGEXP '^[0-9]+$'")
                        ->selectRaw('MAX(CAST(case_no AS UNSIGNED)) as max_no')
                        ->value('max_no');

                    $nextNo = ($lastCaseNo && $lastCaseNo >= self::CASE_NO_START)
                        ? ((int) $lastCaseNo + 1)
                        : self::CASE_NO_START;

                    $caseNo = (string) $nextNo;
                    Log::info('✅ Auto-generated case_no:', ['case_no' => $caseNo]);
                }

                // ✅ Create Account with chalan images
                // 🔧 FIX: 'invoice_price' aur 'advance_amount' columns yahan pehle
                // MISSING thay, isliye database mein hamesha invoice_price = NULL
                // aur advance_amount = 0 save ho raha tha. Ab dono add kar diye hain.
                $account = Account::create([
                    'customer_id' => $customer->id,
                    'employee_account_id' => $employeeAccount->id,
                    'branch_id' => $request->branch_id,
                    'case_no' => $caseNo,
                    'product_name' => $request->product_name ?? '',
                    'chalan_front' => $chalanFrontPath,
                    'chalan_back' => $chalanBackPath,
                    'total_amount' => $invoicePrice,
                    'invoice_price' => $invoicePrice,      // ✅ FIX: ab yeh column bhi set hoga
                    'advance_amount' => $advancePayment,   // ✅ FIX: ab yeh column bhi set hoga
                    'paid_amount' => $advancePayment,
                    'balance' => $invoicePrice - $advancePayment,
                    'monthly_installment' => $monthlyInstallment,
                    'total_installments' => $numberOfInstallments,
                    'installments_paid' => 0,
                    'due_date' => $dueDate,
                    'next_due_date' => date('Y-m-d', strtotime('+1 month', strtotime($dueDate))),
                    'status' => 'active',
                    'created_by' => $loggedInUserId,
                    'created_at' => $accountDate,   // ✅ FIX (was now())
                    'updated_at' => now(),
                ]);

                Log::info('✅ Account created:', [
                    'id' => $account->id,
                    'case_no' => $caseNo,
                    'total_amount' => $invoicePrice,
                    'invoice_price' => $invoicePrice,
                    'advance_amount' => $advancePayment,
                    'paid_amount' => $advancePayment,
                    'balance' => $invoicePrice - $advancePayment,
                    'due_date' => $dueDate,
                    'created_by' => $loggedInUserId,
                    'chalan_front' => $chalanFrontPath,
                    'chalan_back' => $chalanBackPath,
                ]);

                foreach ($pendingAlerts as $pa) {
                    Alert::create([
                        'type' => $pa['type'],
                        'customer_id' => $customer->id,
                        'account_id' => $account->id,
                        'customer_name' => $customer->name,
                        'customer_cnic' => $customer->cnic,
                        'case_no' => $caseNo,
                        'message' => $pa['message'],
                        'branch_id' => $request->branch_id,
                        'created_by' => $loggedInUserId,
                    ]);
                }
                Log::info('✅ Alerts saved:', ['count' => count($pendingAlerts)]);

                // ============================================
                // ✅ 4. Create Installments (WITH slip_no field, exact due_date)
                // ============================================
                $installments = [];
                $firstDueDate = $dueDate;

                for ($i = 0; $i < $numberOfInstallments; $i++) {
                    $exactDueDate = new \DateTime($firstDueDate);
                    $exactDueDate->modify("+{$i} months");   // ✅ exact din preserve, sirf month add
                    $month = $exactDueDate->format('Y-m');

                    $installments[] = [
                        'account_id' => $account->id,
                        'month' => $month,
                        'due_date' => $exactDueDate->format('Y-m-d'), // ✅ FIX: exact date save
                        'due_amount' => $monthlyInstallment,
                        'paid_amount' => 0,
                        'balance' => $monthlyInstallment,
                        'slip_no' => null, // ✅ ADDED
                        'status' => 'unpaid',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                Installment::insert($installments);
                Log::info('✅ Installments created:', ['count' => count($installments)]);

                // ============================================
                // ✅ First Installment ka payment (WITH slip_no)
                // ============================================
                $firstInstallmentPayment = (float) ($request->first_installment_payment ?? 0);

                if ($firstInstallmentPayment > 0) {
                    $firstInstallment = Installment::where('account_id', $account->id)
                        ->orderBy('month', 'asc')
                        ->first();

                    if ($firstInstallment) {
                        $payAmount = min($firstInstallmentPayment, $firstInstallment->due_amount);

                        $newPaidAmount = $payAmount;
                        $newBalance = $firstInstallment->due_amount - $newPaidAmount;

                        if ($newBalance <= 0) {
                            $installmentStatus = 'paid';
                        } elseif ($newPaidAmount > 0) {
                            $installmentStatus = 'partial';
                        } else {
                            $installmentStatus = 'unpaid';
                        }

                        // ✅ Get slip_no from request
                        $slipNoValue = $request->input('slip_no') ?? $request->input('first_installment_slip_no');

                        $firstInstallment->update([
                            'paid_amount' => $newPaidAmount,
                            'balance' => $newBalance,
                            'status' => $installmentStatus,
                            'payment_date' => now(),
                            'slip_no' => $slipNoValue, // ✅ ADDED
                        ]);

                        Log::info('✅ First installment payment recorded with slip_no:', [
                            'installment_id' => $firstInstallment->id,
                            'paid' => $payAmount,
                            'slip_no' => $slipNoValue,
                            'status' => $installmentStatus,
                        ]);

                        $account->paid_amount = $account->paid_amount + $payAmount;
                        $account->balance = $account->total_amount - $account->paid_amount;
                        $account->installments_paid = Installment::where('account_id', $account->id)
                            ->where('paid_amount', '>', 0)->count();
                        $account->last_payment_date = now();
                        if ($account->balance <= 0) {
                            $account->status = 'paid';
                        }
                        $account->save();
                    }
                }

                // ✅ 5. Update account installments_paid
                $account->update([
                    'installments_paid' => $account->installments_paid ?? 0
                ]);

                DB::commit();

                $customer->load(['guarantors', 'employeeAccount', 'employeeAccount.employee', 'branch', 'creator', 'accounts']);

                return response()->json([
                    'success' => true,
                    'message' => 'Customer and Account created successfully',
                    'data' => $customer,
                    'employee_account_id' => $employeeAccount->id,
                    'employee_id' => $employeeId,
                    'created_by' => $loggedInUserId,
                    'account_id' => $account->id,
                    'case_no' => $caseNo,
                    'alerts' => $pendingAlerts,
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('❌ Failed to create customer:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('❌ Customer store error:', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    // ============================================
    // ✅ UPDATED: Customer update — ab 4 phones (phone, phone_2-4)
    // aur 4 voice consent files (voice_consent, voice_consent_2-4)
    // sath tamam images bhi replace ho sakte hain.
    //
    // Frontend se yeh call POST + FormData ke sath karni hai
    // (FormData mein '_method' => 'PUT' bhejna hai).
    // ============================================
    public function update(Request $request, $id)
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:100',
            'cnic' => 'sometimes|string|max:20',
            'phone' => 'sometimes|string|max:20',
            'phone_2' => 'nullable|string|max:20',
            'phone_3' => 'nullable|string|max:20',
            'phone_4' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'work' => 'nullable|string|max:100',
            'product_name' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,hold,closed',
            'is_unlimited' => 'sometimes|boolean',
            'cnic_front' => 'nullable|file|image|max:10240',
            'cnic_back' => 'nullable|file|image|max:10240',
            'additional_image_1' => 'nullable|file|image|max:10240',
            'additional_image_2' => 'nullable|file|image|max:10240',
            'bill_image_1' => 'nullable|file|image|max:10240',
            'bill_image_2' => 'nullable|file|image|max:10240',
            'voice_consent' => 'nullable|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
            'voice_consent_2' => 'nullable|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
            'voice_consent_3' => 'nullable|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
            'voice_consent_4' => 'nullable|file|mimes:mp3,wav,m4a,ogg,webm|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // ✅ Sirf allowed text/boolean fields fill karo (files alag se handle honge)
        $customer->fill($request->only([
            'name', 'cnic', 'phone', 'phone_2', 'phone_3', 'phone_4',
            'address', 'work', 'product_name', 'status', 'is_unlimited'
        ]));

        // ============================================
        // ✅ Helper: purani file delete karke nayi save karo
        // ============================================
        $replaceFile = function ($fieldName, $folder, $prefix) use ($request, $customer) {
            if ($request->hasFile($fieldName)) {
                if ($customer->{$fieldName} && file_exists(public_path('storage/' . $customer->{$fieldName}))) {
                    @unlink(public_path('storage/' . $customer->{$fieldName}));
                }

                $file = $request->file($fieldName);
                $destinationPath = public_path('storage/' . $folder);
                if (!file_exists($destinationPath)) {
                    mkdir($destinationPath, 0777, true);
                }
                $filename = time() . '_' . $prefix . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $file->move($destinationPath, $filename);
                $customer->{$fieldName} = $folder . '/' . $filename;
            }
        };

        $replaceFile('cnic_front', 'customers/cnic_front', 'front');
        $replaceFile('cnic_back', 'customers/cnic_back', 'back');
        $replaceFile('voice_consent', 'customers/voice', 'voice_consent');
        $replaceFile('voice_consent_2', 'customers/voice', 'voice_consent_2');
        $replaceFile('voice_consent_3', 'customers/voice', 'voice_consent_3');
        $replaceFile('voice_consent_4', 'customers/voice', 'voice_consent_4');
        $replaceFile('additional_image_1', 'customers/additional_images', 'add1');
        $replaceFile('additional_image_2', 'customers/additional_images', 'add2');
        $replaceFile('bill_image_1', 'customers/bill_images', 'bill1');
        $replaceFile('bill_image_2', 'customers/bill_images', 'bill2');

        $customer->save();

        return $this->sendResponse($customer, 'Customer updated successfully');
    }

    public function destroy($id)
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        if ($customer->employeeAccount) {
            $customer->employeeAccount()->delete();
        }
        $customer->delete();

        return $this->sendResponse(null, 'Customer deleted successfully');
    }

    public function searchByCNIC(Request $request)
    {
        $request->validate(['cnic' => 'required|string']);

        $customer = Customer::with(['guarantors', 'employeeAccount', 'employeeAccount.employee'])
            ->where('cnic', 'LIKE', "%{$request->cnic}%")
            ->first();

        if (!$customer) {
            return $this->sendError('Customer not found', 404);
        }

        return $this->sendResponse($customer, 'Customer found');
    }

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