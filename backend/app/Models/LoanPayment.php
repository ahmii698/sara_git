<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoanPayment extends Model
{
    use HasFactory;

    protected $table = 'loan_payments';
    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'loan_id', 'user_id', 'amount', 'date', 'applied'
    ];

    protected $casts = [
        'date' => 'datetime',
        'amount' => 'decimal:2',
        'applied' => 'boolean',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class, 'loan_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}