<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExtraExpense extends Model
{
    use HasFactory;

    protected $table = 'extra_expenses';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'description', 'amount', 'branch_id', 'date'
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}