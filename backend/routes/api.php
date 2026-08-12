<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\InstallmentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\GuarantorController;
use App\Http\Controllers\Api\SalaryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\RecoveryController;
use App\Http\Controllers\Api\RecoveryAssignmentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\TargetPerformanceController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\DailySheetController;
use App\Http\Controllers\Api\CashFlowController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ============================================
// ✅ PUBLIC ROUTES (NO TOKEN REQUIRED)
// ============================================
Route::post('/auth/login', [AuthController::class, 'login']);

// Forgot Password - Public Routes
Route::get('/users/check', [UserController::class, 'checkUser']);
Route::post('/users/update-password-public', [UserController::class, 'updatePasswordPublic']);

// OTP Routes (Public)
Route::post('/otp/send', [OtpController::class, 'sendOtp']);
Route::post('/otp/verify', [OtpController::class, 'verifyOtp']);

// ✅ TEST ROUTE - NO AUTH REQUIRED
Route::get('/test', function() {
    return response()->json([
        'success' => true,
        'message' => 'API is working!',
        'timestamp' => now()->toDateTimeString()
    ]);
});

// ✅ EMPLOYEE REPORT PUBLIC - NO AUTH REQUIRED (TEST KE LIYE)
Route::get('/employee-report-public', [ReportController::class, 'getEmployeeReport']);

// ============================================
// ✅ PROTECTED ROUTES (TOKEN REQUIRED)
// ============================================
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Branches
    Route::get('/branches', [BranchController::class, 'index']);
    Route::get('/branches/{id}', [BranchController::class, 'show']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
    Route::post('/customers/search-cnic', [CustomerController::class, 'searchByCNIC']);
    Route::post('/customers/check-cnic', [CustomerController::class, 'checkCnic']);

    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Accounts
    Route::get('/accounts', [AccountController::class, 'index']);
    Route::get('/accounts/{id}', [AccountController::class, 'show']);
    Route::post('/accounts', [AccountController::class, 'store']);
    Route::put('/accounts/{id}', [AccountController::class, 'update']);
    Route::delete('/accounts/{id}', [AccountController::class, 'destroy']);

    // ============================================
    // ✅ INSTALLMENTS ROUTES
    // ============================================
    Route::get('/installments', [InstallmentController::class, 'index']);
    Route::get('/installments/{id}', [InstallmentController::class, 'show']);
    Route::post('/installments/pay', [InstallmentController::class, 'payInstallment']);
    Route::post('/installments/partial-pay', [InstallmentController::class, 'partialPay']);
    Route::get('/installments/overdue', [InstallmentController::class, 'overdue']);
    Route::get('/installments/aging-report', [InstallmentController::class, 'agingReport']);
    Route::get('/installments/by-account/{accountId}', [InstallmentController::class, 'getByAccount']);
    Route::get('/installments/account-details/{accountId}', [InstallmentController::class, 'getAccountDetails']);
    Route::get('/installments/stats', [InstallmentController::class, 'getStats']);

    // Guarantors
    Route::get('/guarantors', [GuarantorController::class, 'index']);
    Route::get('/guarantors/{id}', [GuarantorController::class, 'show']);
    Route::post('/guarantors', [GuarantorController::class, 'store']);
    Route::put('/guarantors/{id}', [GuarantorController::class, 'update']);
    Route::delete('/guarantors/{id}', [GuarantorController::class, 'destroy']);
    Route::post('/guarantors/check-cnic', [GuarantorController::class, 'checkCnic']);

    // ============================================
    // ✅ EXPENSES ROUTES - UPDATED
    // ============================================
    
    // ✅ Fixed Expenses - Sirf unpaid (dashboard ke liye)
    Route::get('/expenses/fixed', [ExpenseController::class, 'fixedExpenses']);
    
    // ✅ NEW: Fixed Expenses - All (paid + unpaid) - FixedExpense page ke liye
    Route::get('/expenses/fixed/all', [ExpenseController::class, 'allFixedExpenses']);
    
    // ✅ NEW: Monthly expenses check - Manual trigger for testing
    Route::post('/expenses/fixed/check-monthly', [ExpenseController::class, 'checkMonthlyExpenses']);
    
    Route::post('/expenses/fixed', [ExpenseController::class, 'storeFixed']);
    Route::put('/expenses/fixed/{id}', [ExpenseController::class, 'updateFixed']);
    Route::post('/expenses/fixed/{id}/pay', [ExpenseController::class, 'payFixed']);
    Route::delete('/expenses/fixed/{id}', [ExpenseController::class, 'deleteFixed']);

    // Extra Expenses
    Route::get('/expenses/extra', [ExpenseController::class, 'extraExpenses']);
    Route::post('/expenses/extra', [ExpenseController::class, 'storeExtra']);
    Route::put('/expenses/extra/{id}', [ExpenseController::class, 'updateExtra']);
    Route::delete('/expenses/extra/{id}', [ExpenseController::class, 'deleteExtra']);

    // ============================================
    // ✅ SALARY ROUTES - UPDATED
    // ============================================
    Route::get('/salary', [SalaryController::class, 'index']);
    Route::post('/salary', [SalaryController::class, 'store']);
    Route::put('/salary/{id}', [SalaryController::class, 'update']);
    Route::post('/salary/{id}/pay', [SalaryController::class, 'paySalary']);
    Route::post('/salary/{id}/reset', [SalaryController::class, 'resetSalary']);

    Route::get('/salary/advances', [SalaryController::class, 'advances']);
    Route::post('/salary/advances', [SalaryController::class, 'storeAdvance']);
    Route::post('/salary/advances/{id}/deduct', [SalaryController::class, 'deductAdvance']);
    Route::delete('/salary/advances/{id}', [SalaryController::class, 'deleteAdvance']);

    // ✅ Loan Routes
    Route::get('/loans', [SalaryController::class, 'loans']);
    Route::post('/loans', [SalaryController::class, 'storeLoan']);
    Route::post('/loans/{id}/deduct', [SalaryController::class, 'deductLoan']);
    Route::delete('/loans/{id}', [SalaryController::class, 'deleteLoan']);

    // ✅ Employee Leaves Routes
    Route::get('/employee-leaves', [SalaryController::class, 'getLeaves']);
    Route::post('/employee-leaves', [SalaryController::class, 'storeLeave']);
    Route::put('/employee-leaves/{id}', [SalaryController::class, 'updateLeave']);
    Route::delete('/employee-leaves/{id}', [SalaryController::class, 'deleteLeave']);

    // ✅ Monthly Salary Summary
    Route::get('/salary/monthly-summary', [SalaryController::class, 'getMonthlySummary']);

    // Recovery
    Route::get('/recovery', [RecoveryController::class, 'index']);
    Route::post('/recovery', [RecoveryController::class, 'store']);
    Route::delete('/recovery/{id}', [RecoveryController::class, 'destroy']);

    // ============================================
    // ✅ RECOVERY ASSIGNMENTS (is mahine ki recovery duty assign karna)
    // ============================================
    Route::get('/recovery-assignments/employees', [RecoveryAssignmentController::class, 'employees']);
    Route::get('/recovery-assignments/locked', [RecoveryAssignmentController::class, 'lockedAccounts']);
    Route::get('/recovery-assignments/my', [RecoveryAssignmentController::class, 'myAssignments']);
    Route::get('/recovery-assignments/account/{accountId}', [RecoveryAssignmentController::class, 'getAccountAssignment']); // ✅ NEW
    Route::post('/recovery-assignments', [RecoveryAssignmentController::class, 'store']);

    // ============================================
    // ✅ REPORTS
    // ============================================
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/loan-summary', [ReportController::class, 'getLoanSummary']);
    Route::get('/reports/branch-recovery', [ReportController::class, 'branchWiseRecovery']);
    Route::get('/reports/monthly-installments', [ReportController::class, 'monthlyInstallmentStatus']);
    Route::get('/reports/top-performers', [ReportController::class, 'topPerformers']);
    Route::get('/reports/employee-performance', [ReportController::class, 'employeePerformance']);
    Route::get('/reports/account-status', [ReportController::class, 'accountStatusSummary']);

    // Employee Account Report Routes
    Route::get('/reports/employee-stats', [ReportController::class, 'getEmployeeStats']);
    Route::get('/reports/employee-detail/{id}', [ReportController::class, 'getEmployeeDetail']);
    Route::get('/reports/branch-performance', [ReportController::class, 'getBranchPerformance']);
    Route::get('/reports/monthly-report', [ReportController::class, 'getMonthlyReport']);

    // ============================================
    // ✅ Employee Report for React Component (AUTH REQUIRED)
    // ============================================
    Route::get('/employee-report', [ReportController::class, 'getEmployeeReport']);

    // ============================================
    // ✅ Leave Application Routes
    // ============================================
    Route::get('/leaves', [LeaveController::class, 'index']);
    Route::post('/leaves', [LeaveController::class, 'store']);
    Route::patch('/leaves/{id}/status', [LeaveController::class, 'updateStatus']);
    Route::delete('/leaves/{id}', [LeaveController::class, 'destroy']);

    // ============================================
    // ✅ SYSTEM ACCESS ROUTES - UserController mein
    // ============================================
    Route::get('/system-access', [UserController::class, 'systemAccess']);
    Route::put('/system-access/{id}/toggle', [UserController::class, 'toggleSystemAccess']);

    // ============================================
    // ✅ TARGET PERFORMANCE ROUTES (Account Target page)
    // ============================================
    Route::get('/accounts/employee-count', [TargetPerformanceController::class, 'getEmployeeCount']);
    Route::get('/target-performance', [TargetPerformanceController::class, 'getTargets']);
    Route::post('/target-performance', [TargetPerformanceController::class, 'saveTarget']);
    Route::get('/target-performance/employee/{id}', [TargetPerformanceController::class, 'getEmployeeTargetHistory']); // ✅ NEW - Target history for one employee (all months)

    // ============================================
    // ✅ ALERTS ROUTES
    // ============================================
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::get('/alerts/counts', [AlertController::class, 'counts']);
    Route::delete('/alerts/{id}', [AlertController::class, 'destroy']);

    // ============================================
    // ✅ DAILY CASH SHEET ROUTES
    // ============================================
    Route::get('/daily-sheet', [DailySheetController::class, 'index']);
    Route::post('/daily-sheet', [DailySheetController::class, 'store']);
    Route::put('/daily-sheet/{id}', [DailySheetController::class, 'update']);
    Route::delete('/daily-sheet/{id}', [DailySheetController::class, 'destroy']);

    // ============================================
    // ✅ CASH FLOW ROUTES
    // ============================================
    Route::get('/cashflow', [CashFlowController::class, 'index']);
    Route::get('/cashflow/{id}', [CashFlowController::class, 'show']);
    Route::post('/cashflow', [CashFlowController::class, 'store']);
    Route::put('/cashflow/{id}', [CashFlowController::class, 'update']);
    Route::delete('/cashflow/{id}', [CashFlowController::class, 'destroy']);
});