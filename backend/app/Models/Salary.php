<?php
// app/Models/Salary.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salary extends Model
{
    use HasFactory;

    protected $table = 'salary';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'user_id', 
        'month', 
        'salary_amount', 
        'commission',
        'advances', 
        'leave_count',  // ✅ ADD THIS - Total leaves in this month
        'total_paid', 
        'status', 
        'paid_date'
    ];

    protected $casts = [
        'salary_amount' => 'decimal:2',
        'commission' => 'decimal:2',
        'advances' => 'decimal:2',
        'leave_count' => 'integer',
        'total_paid' => 'decimal:2',
        'paid_date' => 'date',
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ✅ Get leaves for this month
    public function leaves()
    {
        return $this->hasMany(EmployeeLeave::class, 'user_id', 'user_id')
            ->where('month', $this->month);
    }

    // Scopes
    public function scopeForMonth($query, $month)
    {
        return $query->where('month', $month);
    }

    public function scopeForEmployee($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // ✅ Accessor for formatted salary
    public function getFormattedSalaryAttribute()
    {
        return number_format($this->salary_amount, 0);
    }

    public function getFormattedCommissionAttribute()
    {
        return number_format($this->commission, 0);
    }

    public function getFormattedTotalPaidAttribute()
    {
        return number_format($this->total_paid, 0);
    }
}