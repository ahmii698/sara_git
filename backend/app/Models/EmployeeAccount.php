<?php
// app/Models/EmployeeAccount.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeAccount extends Model
{
    use HasFactory;

    protected $table = 'employee_accounts';
    
    protected $fillable = [
        'employee_id', 
        'customer_id', 
        'branch_id', 
        'account_opened_date', 
        'month', 
        'year', 
        'status',
        'created_by',
        'created_at', // ✅ FIX: Old Record ke liye manual account opening date save karne ke
                       // liye add ki hai — pehle mass-assignment protection ki wajah se
                       // silently ignore ho rahi thi aur Eloquent khud-ba-khud "abhi" ki
                       // date set kar deta tha, chahe CustomerController::store() mein
                       // 'created_at' => $accountDate bheja bhi ja raha ho.
    ];

    protected $casts = [
        'account_opened_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relations
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function account()
    {
        return $this->hasOne(Account::class, 'employee_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeCurrentMonth($query)
    {
        return $query->where('month', now()->format('Y-m'));
    }

    public function scopeForMonth($query, $month)
    {
        return $query->where('month', $month);
    }

    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}