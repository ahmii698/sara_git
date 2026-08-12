<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'name', 
        'email', 
        'password', 
        'phone', 
        'cnic', 
        'address',
        'role', 
        'branch_id', 
        'salary', 
        'is_active',
        'has_system_access',
        'cnic_front', 
        'cnic_back', 
        'agreement_form',
        'voice_consent',
        'created_by'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'has_system_access' => 'boolean',
        'salary' => 'decimal:2',
    ];

    // ============================================
    // RELATIONS
    // ============================================
    
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'created_by');
    }

    public function accounts()
    {
        return $this->hasMany(Account::class, 'created_by');
    }

    public function salaries()
    {
        return $this->hasMany(Salary::class, 'user_id');
    }

    public function salaryAdvances()
    {
        return $this->hasMany(SalaryAdvance::class, 'user_id');
    }

    public function recoveries()
    {
        return $this->hasMany(Recovery::class, 'created_by');
    }

    public function employeeAccounts()
    {
        return $this->hasMany(EmployeeAccount::class, 'employee_id');
    }

    public function leaves()
    {
        return $this->hasMany(EmployeeLeave::class, 'user_id');
    }

    // ✅ NEW: Jis admin/manager ne yeh account banaya
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ============================================
    // ✅ ACCESSORS FOR DOCUMENT URLS
    // ============================================
    
    public function getVoiceConsentUrlAttribute()
    {
        if ($this->voice_consent && Storage::disk('public')->exists($this->voice_consent)) {
            return asset('storage/' . $this->voice_consent);
        }
        return null;
    }

    public function getCnicFrontUrlAttribute()
    {
        if ($this->cnic_front && Storage::disk('public')->exists($this->cnic_front)) {
            return asset('storage/' . $this->cnic_front);
        }
        return null;
    }

    public function getCnicBackUrlAttribute()
    {
        if ($this->cnic_back && Storage::disk('public')->exists($this->cnic_back)) {
            return asset('storage/' . $this->cnic_back);
        }
        return null;
    }

    public function getAgreementFormUrlAttribute()
    {
        if ($this->agreement_form && Storage::disk('public')->exists($this->agreement_form)) {
            return asset('storage/' . $this->agreement_form);
        }
        return null;
    }

    // ============================================
    // ✅ CNIC FORMATTING
    // ============================================
    
    public function getFormattedCnicAttribute()
    {
        $cnic = $this->cnic;
        if (strlen($cnic) == 13) {
            return substr($cnic, 0, 5) . '-' . substr($cnic, 5, 7) . '-' . substr($cnic, 12, 1);
        }
        return $cnic;
    }

    public function setCnicAttribute($value)
    {
        $this->attributes['cnic'] = preg_replace('/[^0-9]/', '', $value);
    }

    // ============================================
    // ✅ ROLE CHECK HELPERS
    // ============================================
    
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isManager()
    {
        return $this->role === 'manager';
    }

    public function isEmployee()
    {
        return $this->role === 'employee';
    }

    // ✅ NEW: System Access Helper
    public function hasSystemAccess()
    {
        return $this->has_system_access == 1;
    }

    // ✅ NEW: Scope for System Access
    public function scopeWithSystemAccess($query)
    {
        return $query->where('has_system_access', 1);
    }

    public function scopeWithoutSystemAccess($query)
    {
        return $query->where('has_system_access', 0);
    }

    // ============================================
    // ✅ ACCOUNT STATS
    // ============================================
    
    public function getTotalAccountsAttribute()
    {
        return $this->employeeAccounts()->count();
    }

    public function getCurrentMonthAccountsAttribute()
    {
        return $this->employeeAccounts()
            ->where('month', now()->format('Y-m'))
            ->count();
    }

    public function getAccountsByMonth($month = null)
    {
        $month = $month ?? now()->format('Y-m');
        return $this->employeeAccounts()
            ->where('month', $month)
            ->count();
    }

    // ============================================
    // ✅ SCOPES
    // ============================================
    
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByRole($query, $role)
    {
        return $query->where('role', $role);
    }

    public function scopeEmployees($query)
    {
        return $query->whereIn('role', ['employee', 'manager']);
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    public function scopeManagers($query)
    {
        return $query->where('role', 'manager');
    }
}