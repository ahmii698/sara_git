<?php
// app/Models/Installment.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Installment extends Model
{
    use HasFactory;

    protected $table = 'installments';
    protected $primaryKey = 'id';
    public $timestamps = true;

    // ✅ FIX: 'due_date' ab yahan add ki hai taake Installment::create([...])
    // se seedha due_date mass-assign ho sake (AccountController::store() mein
    // ab yeh field bheji ja rahi hai).
    protected $fillable = [
        'account_id', 'month', 'due_date', 'due_amount', 'paid_amount', 'slip_no',
        'balance', 'status', 'payment_date', 'description', 'remarks'
    ];

    // ============================================
    // ❌ REMOVED: 'due_date' accessor + $appends
    // ============================================
    // Pehle yahan ye tha:
    //
    //   protected $appends = ['due_date'];
    //
    //   public function getDueDateAttribute()
    //   {
    //       ... account->created_at ke "din" se due_date calculate karta tha ...
    //   }
    //
    // Ye accessor DB ke real 'due_date' column ko HAMESHA override kar raha
    // tha — chahe DB mein sahi date save ho (jaisa CustomerController::store()
    // se banti hai), Eloquent isay kabhi read hi nahi karta tha, balkay har
    // baar naye sire se account->created_at ke din se calculate kar deta tha.
    // Isi wajah se UI mein galat due_date/status (jaise "Aging (1m)") dikh
    // raha tha jab ke phpMyAdmin mein DB ki value bilkul sahi thi.
    //
    // Ab ye accessor hata diya gaya hai, is liye 'due_date' seedha DB column
    // se aayega — jo already sahi save ho raha hai (CustomerController) aur
    // ab AccountController::store() mein bhi sahi save ho raha hai.
    // ============================================

    // ============================================
    // ✅ RELATIONS
    // ============================================

    public function account()
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    // ✅ Get customer through account
    public function getCustomerAttribute()
    {
        return $this->account ? $this->account->customer : null;
    }

    // ✅ Get branch through account
    public function getBranchAttribute()
    {
        return $this->account ? $this->account->branch : null;
    }

    // ============================================
    // ✅ SCOPES
    // ============================================

    public function scopeUnpaid($query)
    {
        return $query->where('status', 'unpaid');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'overdue');
    }

    public function scopePartial($query)
    {
        return $query->where('status', 'partial');
    }

    public function scopeByAccount($query, $accountId)
    {
        return $query->where('account_id', $accountId);
    }

    public function scopeByMonth($query, $month)
    {
        return $query->where('month', $month);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // ============================================
    // ✅ HELPER METHODS
    // ============================================

    public function isPaid()
    {
        return $this->status === 'paid';
    }

    public function isOverdue()
    {
        return $this->status === 'overdue';
    }

    public function getBalance()
    {
        return $this->due_amount - $this->paid_amount;
    }

    public function getProgressPercentage()
    {
        if ($this->due_amount > 0) {
            return round(($this->paid_amount / $this->due_amount) * 100, 2);
        }
        return 0;
    }

    public function getFormattedMonth()
    {
        return date('F Y', strtotime($this->month . '-01'));
    }

    public function getFormattedDueAmount()
    {
        return number_format($this->due_amount, 2);
    }

    public function getFormattedPaidAmount()
    {
        return number_format($this->paid_amount, 2);
    }

    public function getFormattedBalance()
    {
        return number_format($this->getBalance(), 2);
    }

    // ============================================
    // ✅ ACCESSORS / MUTATORS
    // ============================================

    public function getStatusBadgeAttribute()
    {
        $badges = [
            'paid' => '<span class="badge badge-success">Paid</span>',
            'unpaid' => '<span class="badge badge-warning">Unpaid</span>',
            'overdue' => '<span class="badge badge-danger">Overdue</span>',
            'partial' => '<span class="badge badge-info">Partial</span>',
        ];
        return $badges[$this->status] ?? '<span class="badge badge-secondary">' . $this->status . '</span>';
    }

    // ============================================
    // ✅ NEW: Get formatted slip_no (for display)
    // ============================================
    public function getFormattedSlipNoAttribute()
    {
        return $this->slip_no ?? '-';
    }

    // ============================================
    // ✅ NEW: Check if slip_no exists
    // ============================================
    public function hasSlipNo()
    {
        return !empty($this->slip_no);
    }

    // ============================================
    // ✅ NEW: Get payment summary with slip_no
    // ============================================
    public function getPaymentSummaryAttribute()
    {
        return [
            'month' => $this->getFormattedMonth(),
            'due_amount' => $this->getFormattedDueAmount(),
            'paid_amount' => $this->getFormattedPaidAmount(),
            'balance' => $this->getFormattedBalance(),
            'slip_no' => $this->getFormattedSlipNoAttribute(),
            'status' => $this->status,
            'payment_date' => $this->payment_date ? date('d-M-Y', strtotime($this->payment_date)) : null,
        ];
    }
}