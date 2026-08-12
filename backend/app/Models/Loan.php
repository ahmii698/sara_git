<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    use HasFactory;

    protected $table = 'loans';
    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'user_id', 'amount', 'paid_amount', 'reason', 'date', 'deducted'
    ];

    protected $casts = [
        'deducted' => 'boolean',
        'date' => 'datetime',
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ✅ Har partial deduction ka log
    public function payments()
    {
        return $this->hasMany(LoanPayment::class);
    }
}