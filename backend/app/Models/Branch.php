<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $table = 'branches';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'name', 'location', 'phone', 'email'
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'branch_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'branch_id');
    }

    public function accounts()
    {
        return $this->hasMany(Account::class, 'branch_id');
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'branch_id');
    }

    public function fixedExpenses()
    {
        return $this->hasMany(FixedExpense::class, 'branch_id');
    }

    public function extraExpenses()
    {
        return $this->hasMany(ExtraExpense::class, 'branch_id');
    }
}