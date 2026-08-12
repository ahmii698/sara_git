<?php
// app/Models/EmployeeLeave.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeLeave extends Model
{
    use HasFactory;

    protected $table = 'employee_leaves';

    // ✅ Form only sends user_id, leave_date, reason.
    // month/year are auto-filled by the controller from leave_date —
    // kept in the table because Employee Report's monthly breakdown
    // groups leaves by `month`.
    protected $fillable = [
        'user_id',
        'leave_date',
        'month',
        'year',
        'reason',
        'status',
    ];

    protected $casts = [
        'leave_date' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}