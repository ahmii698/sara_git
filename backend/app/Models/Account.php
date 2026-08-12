<?php
// app/Models/Account.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Account extends Model
{
    use HasFactory;

    protected $table = 'accounts';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'customer_id',
        'product_name',
        'chalan_front',
        'chalan_back',
        'case_no',
        'total_amount',
        'paid_amount',
        'balance',
        'monthly_installment',
        'invoice_price',
        'advance_amount',
        'total_installments',
        'installments_paid',
        'due_date',
        'next_due_date',
        'last_payment_date',
        'payment_type',
        'status',
        'branch_id',
        'created_by',
        'employee_account_id',
        'created_at', // ✅ FIX: Old Record ke liye manual account opening date save karne ke
                       // liye add ki hai — pehle mass-assignment protection ki wajah se
                       // silently ignore ho rahi thi aur Eloquent khud-ba-khud "abhi" ki
                       // date set kar deta tha, chahe CustomerController::store() mein
                       // 'created_at' => $accountDate bheja bhi ja raha ho.
    ];

    // ============================================
    // ✅ RELATIONS
    // ============================================
    
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    // ✅ Who created the account (Admin/Manager)
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ============================================
    // ✅ FIXED: Employee Account relation
    // ============================================
    // Previously this matched via `employee_account_id` on the accounts
    // table, which is unreliable — it's only set correctly for some rows.
    // The employee_accounts table itself is keyed by `customer_id`, so we
    // match directly on that instead. This is guaranteed to work for
    // every account, since both tables always have customer_id populated.
    public function employeeAccount()
    {
        return $this->hasOne(EmployeeAccount::class, 'customer_id', 'customer_id');
    }

    // ✅ Employee details through employee_account (also fixed to match on customer_id)
    public function employee()
    {
        return $this->hasOneThrough(
            User::class,
            EmployeeAccount::class,
            'customer_id',   // Foreign key on employee_accounts table
            'id',             // Foreign key on users table
            'customer_id',    // Local key on accounts table
            'employee_id'     // Local key on employee_accounts table
        );
    }

    public function installments()
    {
        return $this->hasMany(Installment::class, 'account_id');
    }

    public function recoveries()
    {
        return $this->hasMany(Recovery::class, 'account_id');
    }

    // ============================================
    // ✅ IMAGE URL ACCESSORS
    // ============================================
    
    public function getChalanFrontUrlAttribute()
    {
        if ($this->chalan_front && Storage::disk('public')->exists($this->chalan_front)) {
            return asset('storage/' . $this->chalan_front);
        }
        return null;
    }

    public function getChalanBackUrlAttribute()
    {
        if ($this->chalan_back && Storage::disk('public')->exists($this->chalan_back)) {
            return asset('storage/' . $this->chalan_back);
        }
        return null;
    }

    // ============================================
    // ✅ HELPER METHODS
    // ============================================
    
    public function getRemainingBalance()
    {
        return $this->balance - $this->paid_amount;
    }

    public function getNextDueDate()
    {
        if ($this->installments_paid < $this->total_installments) {
            return $this->next_due_date;
        }
        return null;
    }

    public function isFullyPaid()
    {
        return $this->balance <= 0 || $this->installments_paid >= $this->total_installments;
    }

    public function getProgressPercentage()
    {
        if ($this->total_installments > 0) {
            return round(($this->installments_paid / $this->total_installments) * 100, 2);
        }
        return 0;
    }

    public function getFormattedTotalAmount()
    {
        return number_format($this->total_amount, 2);
    }

    public function getFormattedPaidAmount()
    {
        return number_format($this->paid_amount, 2);
    }

    public function getFormattedBalance()
    {
        return number_format($this->balance, 2);
    }

    public function getFormattedMonthlyInstallment()
    {
        return number_format($this->monthly_installment, 2);
    }

    // ============================================
    // ✅ SCOPES
    // ============================================
    
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeHold($query)
    {
        return $query->where('status', 'hold');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeByCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPaymentType($query, $type)
    {
        return $query->where('payment_type', $type);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where('case_no', 'LIKE', "%{$search}%")
            ->orWhere('product_name', 'LIKE', "%{$search}%")
            ->orWhereHas('customer', function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('cnic', 'LIKE', "%{$search}%")
                  ->orWhere('phone', 'LIKE', "%{$search}%");
            });
    }

    // ============================================
    // ✅ ATTRIBUTES / ACCESSORS
    // ============================================
    
    public function getStatusBadgeAttribute()
    {
        $badges = [
            'active' => '<span class="badge badge-success">Active</span>',
            'hold' => '<span class="badge badge-warning">Hold</span>',
            'paid' => '<span class="badge badge-info">Paid</span>',
            'closed' => '<span class="badge badge-danger">Closed</span>',
        ];
        return $badges[$this->status] ?? '<span class="badge badge-secondary">Unknown</span>';
    }

    public function getPaymentTypeBadgeAttribute()
    {
        $badges = [
            'cash' => '<span class="badge badge-primary">Cash</span>',
            'installment' => '<span class="badge badge-info">Installment</span>',
        ];
        return $badges[$this->payment_type] ?? '<span class="badge badge-secondary">Unknown</span>';
    }
}