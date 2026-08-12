<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FixedExpense extends Model
{
    use HasFactory;

    protected $table = 'fixed_expenses';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'name', 'amount', 'branch_id', 'due_date', 'paid', 'last_paid'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}