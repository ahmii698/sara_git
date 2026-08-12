<?php
// app/Models/RecoveryAssignment.php
// ✅ FIXED MODEL — is mahine ki recovery duty (kis account ki kis employee ko di gayi)

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecoveryAssignment extends Model
{
    use HasFactory;

    protected $table = 'recovery_assignments';

    protected $fillable = [
        'account_id',
        'assigned_to',
        'assigned_by',
        'branch_id',
        'month',
        'assigned_at',
        'status', // ✅ ADDED
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ============================================
    // ✅ RELATIONS
    // ============================================

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    // Employee jise duty di gayi
    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // Admin/Manager jisne assign kiya
    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    // ============================================
    // ✅ SCOPES
    // ============================================

    // ✅ Sirf woh assignments jo abhi "active/locked" hain (30 din se andar)
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('assigned_at', '>=', now()->subDays(30));
    }

    // ✅ Sirf woh assignments jo expire ho chuki hain (30 din se zyada purani ya status expired)
    public function scopeExpired($query)
    {
        return $query->where(function($q) {
            $q->where('status', 'expired')
              ->orWhere('assigned_at', '<', now()->subDays(30));
        });
    }

    // ✅ Sirf woh assignments jo completed hain
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    // ✅ Sirf is mahine ki assignments
    public function scopeCurrentMonth($query)
    {
        return $query->where('month', date('Y-m'));
    }

    // ✅ Sirf specific branch ki assignments
    public function scopeBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    // ✅ Sirf specific employee ki assignments
    public function scopeAssignedTo($query, $employeeId)
    {
        return $query->where('assigned_to', $employeeId);
    }
}