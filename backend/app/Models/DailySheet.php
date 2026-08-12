<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailySheet extends Model
{
    // Table pehle se raw SQL se ban chuki hai, is liye migration ki zaroorat nahi
    protected $table = 'daily_sheets';

    protected $fillable = [
        'date',
        'wallet_opening',
        'installment',
        'dp_fi',
        'total',
        'challan',
        'rs',
        'salary_ac',
        'kp_dot',
        'expenses',
        'others',
        'cash_to_kp',
        'wallet_closing',
        'branch_id',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}