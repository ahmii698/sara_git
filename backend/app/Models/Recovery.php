<?php
// app/Models/Recovery.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recovery extends Model
{
    use HasFactory;

    protected $table = 'recovery';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'account_id', 
        'customer_id', 
        'employee_id',  // ✅ ADD THIS
        'recovery_date', 
        'amount',
        'payment_type', 
        'month', 
        'description', 
        'created_by'
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}