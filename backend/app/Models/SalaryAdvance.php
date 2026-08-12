<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryAdvance extends Model
{
    use HasFactory;

    protected $table = 'salary_advances';
    protected $primaryKey = 'id';
    
    // ✅ DISABLE TIMESTAMPS
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'amount', 'reason', 'date', 'deducted'
    ];

    protected $casts = [
        'deducted' => 'boolean',
        'date' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}