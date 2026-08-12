<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Guarantor extends Model
{
    use HasFactory;

    protected $table = 'guarantors';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'customer_id', 'name', 'cnic', 'phone', 'address',
        'cnic_front', 'cnic_back'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function getFormattedCnicAttribute()
    {
        $cnic = $this->cnic;
        if (strlen($cnic) == 13) {
            return substr($cnic, 0, 5) . '-' . substr($cnic, 5, 7) . '-' . substr($cnic, 12, 1);
        }
        return $cnic;
    }

    public function setCnicAttribute($value)
    {
        $this->attributes['cnic'] = preg_replace('/[^0-9]/', '', $value);
    }

    public function getCnicFrontUrlAttribute()
    {
        if ($this->cnic_front && Storage::disk('public')->exists($this->cnic_front)) {
            return asset('storage/' . $this->cnic_front);
        }
        return null;
    }

    public function getCnicBackUrlAttribute()
    {
        if ($this->cnic_back && Storage::disk('public')->exists($this->cnic_back)) {
            return asset('storage/' . $this->cnic_back);
        }
        return null;
    }
}