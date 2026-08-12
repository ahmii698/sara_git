<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashFlowEntry extends Model
{
    protected $table = 'cashflow_entries';

    // Frontend string id (uid()) use ho raha hai, isliye auto-increment band
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'date',
        'note',
        'inflows',
        'outflows',
        'branch',
        'created_by',
    ];

    // JSON columns ko automatically array <-> json convert karega
    protected $casts = [
        'inflows' => 'array',
        'outflows' => 'array',
        'date' => 'date:Y-m-d',
    ];
}