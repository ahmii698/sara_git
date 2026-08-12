<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TargetPerformance extends Model
{
    protected $table = 'target_performance';

    protected $fillable = ['employee_id', 'month', 'target', 'set_by'];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }
}