// src/components/Installments/SelectedRecovery.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Clock, CheckCircle, AlertCircle, Building, X,
  Eye, Edit2, ChevronLeft, ChevronRight, AlertTriangle,
  RefreshCw, Save, UserCheck, Lock, Filter, DollarSign,
  Calendar, CreditCard, FileText, Users, UserPlus, User
} from 'lucide-react';
import './Installments.css';
import { API_URL, STORAGE_URL } from '../../../config';

// ============================================
// ✅ TOASTER COMPONENT - Right Side Bottom
// ============================================
const Toaster = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const colors = {
    success: { bg: '#d1fae5', border: '#22c55e', text: '#065f46', icon: CheckCircle },
    error: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', icon: AlertCircle },
    info: { bg: '#dbeafe', border: '#2563eb', text: '#1e40af', icon: CheckCircle },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: AlertCircle },
  };

  const style = colors[type] || colors.success;
  const Icon = style.icon;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 99999,
      maxWidth: '420px',
      width: '100%',
      animation: 'toasterSlideIn 0.4s ease'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 18px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)',
        borderLeft: `5px solid ${style.border}`,
        border: `1px solid ${style.border}`,
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: style.bg,
          color: style.text,
          flexShrink: 0,
          marginTop: '2px'
        }}>
          <Icon size={18} />
        </div>
        <div style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: 600,
          color: style.text,
          lineHeight: 1.5
        }}>
          {message}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px'
          }}
        >
          <X size={18} />
        </button>
      </div>
      <style>{`
        @keyframes toasterSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes toasterSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================
// ✅ CONFIRMATION MODAL
// ============================================
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        maxWidth: '420px',
        width: '100%',
        padding: '28px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'modalSlideUp 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertCircle size={20} style={{ color: '#dc2626' }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0A1628', margin: 0 }}>{title || 'Confirm Action'}</h3>
        </div>
        
        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#4b5563', marginBottom: '24px', lineHeight: 1.6 }}>
          {message || 'Are you sure you want to perform this action?'}
        </p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              background: 'transparent',
              color: '#6b7280',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.background = '#2563eb'}
          >
            <CheckCircle size={16} />
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================
// ✅ Storage URL helper
// ============================================
const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path}`;
};

// ============================================
// ✅ DocImage
// ============================================
const DocImage = ({ label, src }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
    <a href={src} target="_blank" rel="noopener noreferrer">
      <img 
        src={src} 
        alt={label} 
        style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: 'zoom-in' }} 
        loading="lazy"
      />
    </a>
    <p style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', padding: '6px', margin: 0, color: '#374151' }}>
      {label}
    </p>
  </div>
);

// ============================================
// ✅ EDIT PAYMENT MODAL WITH SLIP NO & MONTH SELECT
// ============================================
const EditPaymentModal = ({
  showEditModal,
  setShowEditModal,
  editPaymentData,
  setEditPaymentData,
  availableInstallments,
  paymentDate,
  editLoading,
  handlePartialPaymentSubmit,
  formatCurrency
}) => {
  if (!showEditModal) return null;

  const maxPayable = editPaymentData.balance ?? 0;
  const earliestUnpaidId = availableInstallments.find(i => parseFloat(i.balance) > 0)?.id ?? null;

  const handleMonthChange = (e) => {
    const selectedId = e.target.value;
    const selected = availableInstallments.find(i => String(i.id) === String(selectedId));
    if (!selected) return;

    setEditPaymentData({
      ...editPaymentData,
      installment_id: selected.id,
      month: selected.month,
      month_label: selected.label,
      due_amount: selected.due_amount,
      current_paid: selected.paid_amount,
      balance: selected.balance,
      paid_amount: ''
    });
  };

  return (
    <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
      <div className="modal-container edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <Edit2 size={24} className="modal-header-icon" />
            <div>
              <h2 className="modal-title">Edit Payment</h2>
              <p className="modal-subtitle">Case: {editPaymentData.case_no}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body edit-modal-body">
          <div className="edit-summary">
            <div className="edit-summary-item">
              <span className="label">Customer</span>
              <span className="value" style={{fontWeight: '600', color: '#1a1a2e'}}>
                {editPaymentData.customer_name}
              </span>
            </div>
            <div className="edit-summary-item">
              <span className="label">Monthly Installment</span>
              <span className="value">{formatCurrency(editPaymentData.due_amount)}</span>
            </div>
            <div className="edit-summary-item">
              <span className="label">Already Paid (this month)</span>
              <span className="value" style={{color: '#10b981'}}>{formatCurrency(editPaymentData.current_paid)}</span>
            </div>
            <div className="edit-summary-item">
              <span className="label">This Month's Balance</span>
              <span className="value" style={{color: '#ef4444', fontWeight: 'bold'}}>{formatCurrency(maxPayable)}</span>
            </div>
          </div>

          <div className="edit-form">
            <div className="form-group">
              <label>Select Month *</label>
              <select
                value={editPaymentData.installment_id || ''}
                onChange={handleMonthChange}
                className="form-input"
              >
                {availableInstallments.map((inst) => {
                  const isPaid = parseFloat(inst.balance) <= 0;
                  const isEnabled = !isPaid && inst.id === earliestUnpaidId;
                  return (
                    <option key={inst.id} value={inst.id} disabled={!isEnabled}>
                      {inst.label}
                      {isPaid ? ' — Paid' : (!isEnabled ? ' — Locked (clear earlier month first)' : '')}
                    </option>
                  );
                })}
              </select>
              <small className="form-hint">
                Sirf sabse purana unpaid month select ho sakta hai — baaki months isi ke baad khud unlock ho jayenge.
              </small>
            </div>

            <div className="form-group">
              <label>Payment Amount (PKR)</label>
              <input
                type="number"
                value={editPaymentData.paid_amount}
                onChange={(e) => setEditPaymentData({
                  ...editPaymentData,
                  paid_amount: e.target.value
                })}
                placeholder="Enter amount to pay (optional)"
                className="form-input"
                min="0"
                max={maxPayable}
                autoFocus
              />
              <small className="form-hint">
                Max payable (isi month ki): {formatCurrency(maxPayable)} — is se aik rupya bhi zyada nahi. Amount is optional if you're only adding remarks.
              </small>
            </div>

            <div className="form-group">
              <label>Slip No</label>
              <input
                type="text"
                value={editPaymentData.slip_no || ''}
                onChange={(e) => setEditPaymentData({
                  ...editPaymentData,
                  slip_no: e.target.value
                })}
                placeholder="Enter unique slip number..."
                className="form-input"
              />
              <small className="form-hint">
                Optional: Enter the slip/reference number for this payment
              </small>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                value={editPaymentData.remarks || ''}
                onChange={(e) => setEditPaymentData({
                  ...editPaymentData,
                  remarks: e.target.value
                })}
                placeholder="Add remarks or notes..."
                className="form-input"
                rows="3"
                style={{ resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
              />
              <small className="form-hint">
                Optional: Add any notes about this payment
              </small>
            </div>

            <div className="form-group">
              <label>Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                className="form-input"
                disabled
              />
              <small className="form-hint">
                Payment will be recorded with today's date
              </small>
            </div>
          </div>

          <div className="edit-modal-footer">
            <button
              className="btn-cancel"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn-save-payment"
              onClick={handlePartialPaymentSubmit}
              disabled={editLoading}
            >
              {editLoading ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  Processing...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Record Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ✅ VIEW DETAIL MODAL WITH ADVANCE AMOUNT
// ============================================
const ViewModal = ({ 
  selectedItem, 
  showModal, 
  setShowModal, 
  modalLoading, 
  paymentHistory, 
  formatDate, 
  formatCurrency, 
  getStatusBadge,
  getAgingMonths,
  getItemStatusKey
}) => {
  if (!showModal || !selectedItem) return null;

  const item = selectedItem;
  const account = item.account || {};
  const customer = account.customer || item.customer || {};
  const guarantors = item.guarantors || customer.guarantors || [];
  const paidCount = paymentHistory.filter(p => p.balance <= 0).length;
  const totalCount = paymentHistory.length;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  const totalDue = paymentHistory.reduce((sum, p) => sum + parseFloat(p.due_amount || 0), 0);

  const accountOpeningDate = account.created_at || customer.created_at || item.created_at || null;
  const creator = account.creator || {};
  const employeeAccount = account.employeeAccount || account.employee_account || {};
  const employee = employeeAccount.employee || {};
  const creatorName = creator.name || 'N/A';
  const creatorRole = creator.role || '';
  const employeeName = employee.name || account.employee_name || 'N/A';

  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <FileText size={24} className="modal-header-icon" />
            <div>
              <h2 className="modal-title">Account Details</h2>
              <p className="modal-subtitle">Case: {account.case_no || item.case_no || 'N/A'}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={() => setShowModal(false)}>
            <X size={24} />
          </button>
        </div>

        {modalLoading ? (
          <div className="modal-loading">
            <div className="spinner"></div>
            <p>Loading details...</p>
          </div>
        ) : (
          <div className="modal-body">
            <div className="modal-section">
              <div className="section-header">
                <User size={20} />
                <h3>Customer Information</h3>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value" style={{fontWeight: '600', color: '#1a1a2e'}}>
                    {customer.name || item.customer_name || account.customer?.name || 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">CNIC</span>
                  <span className="info-value">{customer.cnic || item.cnic || account.customer?.cnic || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{customer.phone || item.phone || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value">{customer.address || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Work / Occupation</span>
                  <span className="info-value">{customer.work || customer.occupation || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Product / Purpose</span>
                  <span className="info-value">{customer.product_name || account.product_name || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Branch</span>
                  <span className="info-value">Branch {account.branch_id || customer.branch_id || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Status</span>
                  <span className="info-value">{getStatusBadge(item)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Opening Date</span>
                  <span className="info-value" style={{fontWeight: '600', color: '#2563eb'}}>
                    {formatDate(accountOpeningDate)}
                  </span>
                </div>
                <div className="info-item" style={{background: '#e0e7ff', borderColor: '#818cf8'}}>
                  <span className="info-label">Account Created By</span>
                  <span className="info-value" style={{fontWeight: '600', color: '#3730a3'}}>
                    {creatorName}
                    {creatorRole && (
                      <span style={{fontSize: '11px', color: '#6b7280', marginLeft: '8px', fontWeight: '400'}}>
                        ({creatorRole})
                      </span>
                    )}
                  </span>
                </div>
                <div className="info-item" style={{background: '#dcfce7', borderColor: '#86efac'}}>
                  <span className="info-label">Employee Who Opened</span>
                  <span className="info-value" style={{fontWeight: '600', color: '#166534'}}>
                    {employeeName}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== ACCOUNT SUMMARY WITH ADVANCE AMOUNT ===== */}
            <div className="modal-section">
              <div className="section-header">
                <DollarSign size={20} />
                <h3>Account Summary</h3>
              </div>
              <div className="acct-summary-grid">
                <div className="acct-summary-card">
                  <span className="acct-summary-label">Total Amount</span>
                  <span className="acct-summary-value">{formatCurrency(account.total_amount || 0)}</span>
                </div>
                <div className="acct-summary-card success">
                  <span className="acct-summary-label">Total Paid</span>
                  <span className="acct-summary-value">{formatCurrency(account.paid_amount || 0)}</span>
                </div>
                <div className="acct-summary-card warning">
                  <span className="acct-summary-label">Remaining Balance</span>
                  <span className="acct-summary-value">{formatCurrency(account.balance || 0)}</span>
                </div>
                {/* ✅ NEW: Advance Amount - Sirf yahan */}
                <div className="acct-summary-card" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                  <span className="acct-summary-label" style={{ color: '#92400e' }}>Advance Amount</span>
                  <span className="acct-summary-value" style={{ color: '#92400e', fontWeight: 'bold' }}>
                    {formatCurrency(account.advance_amount || 0)}
                  </span>
                </div>
                <div className="acct-summary-card info">
                  <span className="acct-summary-label">Monthly Installment</span>
                  <span className="acct-summary-value">{formatCurrency(account.monthly_installment || 0)}</span>
                </div>
                <div className="acct-summary-card">
                  <span className="acct-summary-label">Total Installments</span>
                  <span className="acct-summary-value">{account.total_installments || 0}</span>
                </div>
                <div className="acct-summary-card success">
                  <span className="acct-summary-label">Installments Paid</span>
                  <span className="acct-summary-value">{account.installments_paid || 0}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <div className="section-header">
                <Clock size={20} />
                <h3>Payment History</h3>
                <span className="payment-stats">
                  {paidCount} / {totalCount} Paid
                </span>
              </div>
              {paymentHistory.length === 0 ? (
                <div className="empty-history">
                  <p>No payment history found</p>
                </div>
              ) : (
                <div className="history-table-container">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Month</th>
                        <th>Due Date</th>
                        <th>Due Amount</th>
                        <th>Slip No</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Payment Date</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((p, idx) => (
                        <tr key={p.id} className={p.balance <= 0 ? 'history-paid' : ''}>
                          <td>{idx + 1}</td>
                          <td>{p.month ? new Date(p.month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '-'}</td>
                          <td>{p.due_date ? formatDate(p.due_date) : '-'}</td>
                          <td>{formatCurrency(p.due_amount)}</td>
                          <td style={{fontWeight: '600', color: '#2563eb'}}>{p.slip_no || '-'}</td>
                          <td>{formatCurrency(p.paid_amount)}</td>
                          <td>{formatCurrency(p.balance)}</td>
                          <td>{getStatusBadge(p)}</td>
                          <td>{p.payment_date ? formatDate(p.payment_date) : '-'}</td>
                          <td>{p.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3"><strong>Total</strong></td>
                        <td><strong>{formatCurrency(totalDue)}</strong></td>
                        <td><strong>-</strong></td>
                        <td><strong>{formatCurrency(totalPaid)}</strong></td>
                        <td><strong>{formatCurrency(totalDue - totalPaid)}</strong></td>
                        <td colSpan="3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-section">
              <div className="section-header">
                <Users size={20} />
                <h3>Guarantors</h3>
                <span className="guarantor-count">
                  {guarantors.length || 0} found
                </span>
              </div>
              {guarantors && guarantors.length > 0 ? (
                <div className="guarantors-grid">
                  {guarantors.map((g, idx) => (
                    <div key={idx} className="guarantor-card">
                      <div className="guarantor-name">{g.name || g.guarantor_name || 'N/A'}</div>
                      <div className="guarantor-detail">CNIC: {g.cnic || g.guarantor_cnic || 'N/A'}</div>
                      <div className="guarantor-detail">Phone: {g.phone || g.guarantor_phone || 'N/A'}</div>
                      <div className="guarantor-detail">Address: {g.address || g.guarantor_address || 'N/A'}</div>
                      {g.relationship && (
                        <div className="guarantor-detail">Relationship: {g.relationship}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No guarantors found</p>
              )}
            </div>

            <div className="modal-section">
              <div className="section-header">
                <FileText size={20} />
                <h3>Original Form Documents</h3>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                  Customer CNIC
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {customer.cnic_front && (
                    <DocImage label="CNIC Front" src={getFileUrl(customer.cnic_front)} />
                  )}
                  {customer.cnic_back && (
                    <DocImage label="CNIC Back" src={getFileUrl(customer.cnic_back)} />
                  )}
                  {!customer.cnic_front && !customer.cnic_back && (
                    <p className="no-data">No customer CNIC images found</p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                  Additional Documents
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {customer.additional_image_1 && (
                    <DocImage label="Additional Image 1" src={getFileUrl(customer.additional_image_1)} />
                  )}
                  {customer.additional_image_2 && (
                    <DocImage label="Additional Image 2" src={getFileUrl(customer.additional_image_2)} />
                  )}
                  {!customer.additional_image_1 && !customer.additional_image_2 && (
                    <p className="no-data">No additional documents found</p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                  Chalan
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {account.chalan_front && (
                    <DocImage label="Chalan Front" src={getFileUrl(account.chalan_front)} />
                  )}
                  {account.chalan_back && (
                    <DocImage label="Chalan Back" src={getFileUrl(account.chalan_back)} />
                  )}
                  {!account.chalan_front && !account.chalan_back && (
                    <p className="no-data">No chalan images found</p>
                  )}
                </div>
              </div>

              {customer.voice_consent && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Voice Consent (Raza Mandi)
                  </h4>
                  <audio controls style={{ width: '100%' }}>
                    <source src={getFileUrl(customer.voice_consent)} />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              <div>
                <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                  Guarantors' CNIC Images
                </h4>
                {guarantors && guarantors.length > 0 ? (
                  guarantors.map((g, idx) => (
                    <div key={idx} style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>
                        {g.name} — {g.cnic}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                        {g.cnic_front && <DocImage label="CNIC Front" src={getFileUrl(g.cnic_front)} />}
                        {g.cnic_back && <DocImage label="CNIC Back" src={getFileUrl(g.cnic_back)} />}
                        {!g.cnic_front && !g.cnic_back && (
                          <p className="no-data">No CNIC images for this guarantor</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No guarantor documents found</p>
                )}
              </div>
            </div>

            <div className="modal-footer-actions">
              <button className="btn-close-modal" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ✅ MAIN COMPONENT
// ============================================
const SelectedRecovery = () => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const [editPaymentData, setEditPaymentData] = useState({
    paid_amount: '',
    month: '',
    month_label: '',
    installment_id: null,
    due_amount: 0,
    current_paid: 0,
    balance: 0,
    customer_name: '',
    customer_cnic: '',
    case_no: '',
    account_id: null,
    total_installments: 0,
    remarks: '',
    slip_no: '',
  });
  const [availableInstallments, setAvailableInstallments] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');

  // ============================================
  // ✅ TOASTER STATE
  // ============================================
  const [toaster, setToaster] = useState({ message: '', type: 'info', show: false });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    onConfirm: null,
    title: 'Confirm Action',
    message: 'Are you sure you want to perform this action?'
  });

  const showToaster = (message, type = 'info') => {
    setToaster({ message, type, show: true });
  };

  const hideToaster = () => {
    setToaster({ message: '', type: 'info', show: false });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      onConfirm,
      title,
      message
    });
  };

  const hideConfirm = () => {
    setConfirmModal({
      isOpen: false,
      onConfirm: null,
      title: 'Confirm Action',
      message: 'Are you sure you want to perform this action?'
    });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    fetchMyAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ============================================
  // ✅ Helper: current month string "YYYY-MM"
  // ============================================
  const getCurrentMonthStrGlobal = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // ============================================
  // ✅ FETCH - with FIXED dedup logic
  // ============================================
  const fetchMyAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recovery-assignments/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        const rawData = data.data || [];
        const currentMonthStr = getCurrentMonthStrGlobal();

        const uniqueMap = new Map();

        // ✅ FIXED: Future unpaid ko priority nahi milegi
        rawData.forEach(item => {
          const accountId = item.account_id || item.account?.id;
          if (!accountId) {
            if (!uniqueMap.has(item.id)) uniqueMap.set(item.id, item);
            return;
          }

          const existing = uniqueMap.get(accountId);
          if (!existing) {
            uniqueMap.set(accountId, item);
            return;
          }

          const itemMonth = item.month || '';
          const existingMonth = existing.month || '';

          const itemBalance = parseFloat(item.balance || 0);
          const existingBalance = parseFloat(existing.balance || 0);

          // ✅ future month ka unpaid ab "actionable unpaid" nahi maana jayega
          const itemIsFuture = itemMonth > currentMonthStr;
          const existingIsFuture = existingMonth > currentMonthStr;

          const itemUnpaid = itemBalance > 0 && !itemIsFuture;
          const existingUnpaid = existingBalance > 0 && !existingIsFuture;

          if (itemUnpaid && existingUnpaid) {
            // dono actionable unpaid (aging/overdue) hain -> sab se purana rakho
            if (itemMonth < existingMonth) {
              uniqueMap.set(accountId, item);
            }
          } else if (itemUnpaid && !existingUnpaid) {
            // sirf item actionable unpaid hai -> ye hi asal status hai
            uniqueMap.set(accountId, item);
          } else if (!itemUnpaid && existingUnpaid) {
            // existing hi actionable hai -> usi ko rehne do
            // kuch mat karo
          } else {
            // dono mein se koi bhi "actionable unpaid" nahi (ya to paid hain ya future unpaid)
            const itemIsCurrentOrPast = itemMonth <= currentMonthStr;
            const existingIsCurrentOrPast = existingMonth <= currentMonthStr;

            if (itemIsCurrentOrPast && !existingIsCurrentOrPast) {
              // item current/past (paid) hai, existing future hai -> current month ko priority do
              uniqueMap.set(accountId, item);
            } else if (!itemIsCurrentOrPast && existingIsCurrentOrPast) {
              // existing already current/past (paid) -> usi ko rakho
              // kuch mat karo
            } else if (itemIsCurrentOrPast && existingIsCurrentOrPast) {
              // dono paid/past hain -> sab se recent month dikhao
              if (itemMonth > existingMonth) {
                uniqueMap.set(accountId, item);
              }
            } else {
              // dono future hain (koi current/past record hi nahi) -> sab se qareeb wala future dikhao
              if (itemMonth < existingMonth) {
                uniqueMap.set(accountId, item);
              }
            }
          }
        });

        setInstallments(Array.from(uniqueMap.values()));
      }
    } catch (error) {
      console.error('Error fetching assigned recovery:', error);
      showToaster('Failed to load assigned recovery', 'error');
    } finally {
      setLoading(false);
    }
  };

  const monthsBetween = useCallback((fromMonth, toMonth) => {
    if (!fromMonth || !toMonth) return 0;
    const [fy, fm] = fromMonth.split('-').map(Number);
    const [ty, tm] = toMonth.split('-').map(Number);
    return (ty - fy) * 12 + (tm - fm);
  }, []);

  const getCurrentMonthStr = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // ✅ FIXED: due_date based aging calculation - Future due date = -1
  const getAgingMonths = useCallback((item) => {
    if (!item.due_date) return 0;
    const due = new Date(item.due_date);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ✅ Agar due date future mein hai -> -1 return karo
    if (due > today) return -1;
    
    const years = today.getFullYear() - due.getFullYear();
    const months = today.getMonth() - due.getMonth();
    let totalMonths = years * 12 + months;
    if (today.getDate() < due.getDate()) {
      totalMonths -= 1;
    }
    return Math.max(0, totalMonths);
  }, []);

  // ✅ FIXED: due_date based status - Future due date = Unpaid
  const getItemStatusKey = useCallback((item) => {
    const balance = parseFloat(item.balance || 0);

    if (balance <= 0) return 'paid';
    if (!item.due_date) return 'unpaid';

    const monthsOverdue = getAgingMonths(item);
    
    // ✅ Future due date = Unpaid
    if (monthsOverdue < 0) return 'unpaid';
    if (monthsOverdue >= 3) return 'overdue';
    return 'aging';
  }, [getAgingMonths]);

  // ✅ FIXED: due_date based status badge - Future due date = Unpaid
  const getStatusBadge = (item) => {
    const statusKey = getItemStatusKey(item);
    const monthsOverdue = getAgingMonths(item);

    switch (statusKey) {
      case 'paid':
        return <span className="badge badge-paid"><CheckCircle size={14} /> Paid</span>;
      case 'unpaid':
        return <span className="badge badge-unpaid"><Clock size={14} /> Unpaid</span>;
      case 'overdue':
        return <span className="badge badge-overdue"><AlertCircle size={14} /> Overdue</span>;
      case 'aging':
      default:
        const displayMonths = monthsOverdue + 1;
        return <span className="badge badge-aging"><AlertTriangle size={14} /> Aging ({displayMonths}m)</span>;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const getEmployeeAccount = (account) => {
    if (!account) return {};
    return account.employeeAccount || account.employee_account || {};
  };

  // ============================================
  // ✅ FETCH ACCOUNT INSTALLMENTS FOR EDIT MODAL
  // ============================================
  const fetchAccountInstallmentsList = async (accountId) => {
    if (!accountId) return [];
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/installments/by-account/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(inst => ({
          id: inst.id,
          month: inst.month,
          label: inst.month
            ? new Date(inst.month + '-01').toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
            : 'N/A',
          due_amount: parseFloat(inst.due_amount || 0),
          paid_amount: parseFloat(inst.paid_amount || 0),
          balance: parseFloat(inst.balance || 0)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching account installments:', error);
      return [];
    }
  };

  // ============================================
  // ✅ OPEN EDIT MODAL (same as Installments page)
  // ============================================
  const openEditModal = async (item) => {
    const customer = item.customer || item.account?.customer || {};
    const customerName = customer.name || item.customer_name || 'N/A';
    const customerCnic = customer.cnic || item.cnic || '';
    const caseNo = item.account?.case_no || item.case_no || 'N/A';
    const accountId = item.account_id || item.account?.id;
    const existingRemarks = item.remarks || '';

    const monthLabel = item.month
      ? new Date(item.month + '-01').toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
      : 'N/A';

    setEditPaymentData({
      paid_amount: '',
      month: item.month || '',
      month_label: monthLabel,
      installment_id: item.id,
      due_amount: item.due_amount || 0,
      current_paid: item.paid_amount || 0,
      balance: item.balance || 0,
      customer_name: customerName,
      customer_cnic: customerCnic,
      case_no: caseNo,
      account_id: accountId,
      total_installments: item.account?.total_installments || 0,
      remarks: existingRemarks,
      slip_no: ''
    });
    setAvailableInstallments([]);
    setShowEditModal(true);

    const list = await fetchAccountInstallmentsList(accountId);
    if (list.length > 0) {
      setAvailableInstallments(list);

      const earliestUnpaid = list.find(i => i.balance > 0);
      const selected = earliestUnpaid || list[0];

      setEditPaymentData(prev => ({
        ...prev,
        installment_id: selected.id,
        month: selected.month,
        month_label: selected.label,
        due_amount: selected.due_amount,
        current_paid: selected.paid_amount,
        balance: selected.balance,
        remarks: selected.id === item.id ? existingRemarks : '',
        slip_no: ''
      }));
    }
  };

  // ============================================
  // ✅ HANDLE PARTIAL PAYMENT SUBMIT
  // ============================================
  const handlePartialPaymentSubmit = async () => {
    const amount = parseFloat(editPaymentData.paid_amount) || 0;
    const hasRemarks = (editPaymentData.remarks || '').trim().length > 0;

    if (amount <= 0 && !hasRemarks) {
      showToaster('Please enter a payment amount or add remarks', 'warning');
      return;
    }

    const maxPayable = parseFloat(editPaymentData.balance) || 0;

    if (amount > 0 && amount > maxPayable) {
      showToaster(`Amount cannot exceed this month's balance of ${formatCurrency(maxPayable)}`, 'error');
      return;
    }

    // ✅ Slip No validation when amount > 0
    if (amount > 0 && !editPaymentData.slip_no.trim()) {
      showToaster('Please enter a Slip No for this payment', 'error');
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/installments/partial-pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          installment_id: editPaymentData.installment_id,
          paid_amount: amount,
          payment_date: new Date().toISOString().split('T')[0],
          slip_no: editPaymentData.slip_no || null,
          remarks: editPaymentData.remarks || ''
        })
      });

      const data = await response.json();
      if (data.success) {
        if (amount > 0) {
          showToaster(`✅ Payment of ${formatCurrency(amount)} recorded for ${editPaymentData.month_label}!`, 'success');
        } else {
          showToaster('✅ Remarks saved successfully!', 'success');
        }
        setShowEditModal(false);
        fetchMyAssignments();
      } else {
        showToaster(`❌ ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showToaster('Network error. Please try again.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // ============================================
  // ✅ OPEN VIEW DETAIL MODAL
  // ============================================
  const openViewModal = async (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
    setModalLoading(true);

    try {
      const token = localStorage.getItem('token');
      const accountId = item.account_id || item.account?.id;

      if (!accountId) {
        setModalLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/installments/account-details/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const accountData = data.data;
        setSelectedItem({
          ...item,
          account: accountData,
          customer: accountData.customer || item.customer,
          guarantors: accountData.customer?.guarantors || [],
          fullAccount: accountData
        });
        setPaymentHistory(accountData.installments || []);
      }
    } catch (error) {
      console.error('Error fetching account details:', error);
      showToaster('Failed to load account details', 'error');
    }
    setModalLoading(false);
  };

  // ============================================
  // ✅ PAY FULL INSTALLMENT
  // ============================================
  const handlePayInstallment = async (installmentId) => {
    showConfirm(
      'Confirm Payment',
      'Are you sure you want to mark this installment as paid?',
      async () => {
        hideConfirm();
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/installments/pay`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ 
              installment_id: installmentId, 
              payment_date: new Date().toISOString().split('T')[0] 
            })
          });
          const data = await response.json();
          if (data.success) {
            showToaster('✅ Installment marked as paid!', 'success');
            fetchMyAssignments();
          } else {
            showToaster('❌ Failed: ' + data.message, 'error');
          }
        } catch (error) {
          console.error(error);
          showToaster('Network error. Please try again.', 'error');
        }
      }
    );
  };

  const employeeList = useMemo(() => {
    const map = new Map();
    installments.forEach(item => {
      const info = item.assignment_info;
      if (info && info.assigned_to_name) {
        const key = String(info.assigned_to_id ?? info.assigned_to_name);
        if (!map.has(key)) {
          map.set(key, { id: key, name: info.assigned_to_name });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [installments]);

  // ✅ FIXED: due_date based filter
  const filteredInstallments = useMemo(() => {
    const search = debouncedSearch.toLowerCase().trim();

    return installments.filter(item => {
      if (search) {
        const customer = item.customer || item.account?.customer || {};
        const customerName = (customer.name || item.customer_name || '').toLowerCase();
        const customerCnic = (customer.cnic || item.cnic || '').toLowerCase();
        const caseNo = (item.account?.case_no || item.case_no || '').toLowerCase();
        const matchesSearch = customerName.includes(search) || customerCnic.includes(search) || caseNo.includes(search);
        if (!matchesSearch) return false;
      }

      if (employeeFilter !== 'all') {
        const info = item.assignment_info;
        const key = info ? String(info.assigned_to_id ?? info.assigned_to_name) : null;
        if (key !== employeeFilter) return false;
      }

      if (statusFilter !== 'all') {
        if (getItemStatusKey(item) !== statusFilter) return false;
      }

      return true;
    });
  }, [installments, debouncedSearch, employeeFilter, statusFilter, getItemStatusKey]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(
    () => filteredInstallments.slice(indexOfFirstItem, indexOfLastItem),
    [filteredInstallments, indexOfFirstItem, indexOfLastItem]
  );
  const totalPages = Math.ceil(filteredInstallments.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totals = useMemo(() => {
    let totalDue = 0, totalPaid = 0, totalBalance = 0;
    filteredInstallments.forEach(item => {
      totalDue += parseFloat(item.due_amount || 0);
      totalPaid += parseFloat(item.paid_amount || 0);
      totalBalance += parseFloat(item.balance || 0);
    });
    return { totalDue, totalPaid, totalBalance, count: filteredInstallments.length };
  }, [filteredInstallments]);

  // ✅ Check if user is admin or manager (can see all actions)
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canManage = isAdmin || isManager;

  return (
    <div className="installments-page">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      {/* ===== CONFIRM MODAL ===== */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onConfirm={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
        }}
        onCancel={hideConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        cancelText="Cancel"
      />

      {/* ===== VIEW MODAL ===== */}
      <ViewModal
        selectedItem={selectedItem}
        showModal={showViewModal}
        setShowModal={setShowViewModal}
        modalLoading={modalLoading}
        paymentHistory={paymentHistory}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getStatusBadge={getStatusBadge}
        getAgingMonths={getAgingMonths}
        getItemStatusKey={getItemStatusKey}
      />

      {/* ===== EDIT MODAL ===== */}
      <EditPaymentModal
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editPaymentData={editPaymentData}
        setEditPaymentData={setEditPaymentData}
        availableInstallments={availableInstallments}
        paymentDate={paymentDate}
        editLoading={editLoading}
        handlePartialPaymentSubmit={handlePartialPaymentSubmit}
        formatCurrency={formatCurrency}
      />

      <div className="page-header">
        <div className="header-title-group">
          <h2 className="page-title">Selected Recovery</h2>
          <span className="live-badge">
            <UserCheck size={12} /> This Month
          </span>
        </div>
        {userBranch && (
          <div className="branch-badge">
            <Building size={14} />
            <span>Branch {userBranch}</span>
          </div>
        )}
      </div>

      <div className="stats-grid-4">
        <div className="stat-card-4">
          <div className="stat-card-4-icon total">
            <UserCheck size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Assigned Accounts</span>
            <span className="stat-card-4-value">{totals.count}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon due">
            <AlertCircle size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Balance</span>
            <span className="stat-card-4-value">{formatCurrency(totals.totalBalance)}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon paid">
            <CheckCircle size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Paid</span>
            <span className="stat-card-4-value">{formatCurrency(totals.totalPaid)}</span>
          </div>
        </div>
      </div>

      {/* ✅ FILTERS SECTION */}
      <div className="filters-section" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="filter-search" style={{ flex: '1 1 260px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, CNIC, case no..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="search-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={16} style={{ color: '#6b7280' }} />
          <select
            value={employeeFilter}
            onChange={(e) => { setEmployeeFilter(e.target.value); setCurrentPage(1); }}
            className="form-input"
            style={{ minWidth: '180px' }}
          >
            <option value="all">All Employees</option>
            {employeeList.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={16} style={{ color: '#6b7280' }} />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="form-input"
            style={{ minWidth: '160px' }}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="aging">Aging</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading assigned recovery...</p>
          </div>
        ) : filteredInstallments.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={48} />
            <h3>No accounts assigned to you yet</h3>
            <p>When admin/manager assigns you recovery, it will appear here</p>
          </div>
        ) : (
          <>
            <table className="installments-table">
              <thead>
              <tr style={{ background: '#1E1B4B' }}>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>#</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Customer</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Case No</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Due Date</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Installment</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Mirror</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remarks</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Collected By</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => {
                  const actualIndex = indexOfFirstItem + index + 1;
                  const customer = item.customer || item.account?.customer || {};
                  const customerName = customer.name || item.customer_name || 'N/A';
                  const customerCnic = customer.cnic || item.cnic || '';
                  const caseNo = item.account?.case_no || item.case_no || 'N/A';
                  const assignmentInfo = item.assignment_info || null;

                  const accountData = item.account || {};
                  const accountTotalBalance = accountData.balance || item.balance || 0;
                  const remarks = item.remarks || '';

                  return (
                    <tr key={item.id} className="installment-row">
                      <td className="text-center">{actualIndex}</td>
                      <td>
                        <div className="customer-info">
                          <strong style={{color: '#1a1a2e'}}>{customerName}</strong>
                          {customerCnic && <span className="customer-cnic">{customerCnic}</span>}
                        </div>
                      </td>
                      <td><span className="case-no">{caseNo}</span></td>
                      <td>
                        <span className="month-text" style={{fontWeight: '500', color: '#7c3aed'}}>
                          {item.due_date ? formatDate(item.due_date) : (item.month ? new Date(item.month + '-01').toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')}
                        </span>
                      </td>
                      <td className="text-right">{formatCurrency(item.due_amount)}</td>
                      <td className="text-right" style={{fontWeight: 'bold', color: '#dc2626', fontSize: '14px'}}>
                        {formatCurrency(accountTotalBalance)}
                      </td>
                      <td className="text-right" style={{color: item.balance > 0 ? '#ef4444' : '#10b981'}}>
                        {formatCurrency(item.balance)}
                      </td>
                      <td>
                        <span style={{fontSize: '12px', color: '#4b5563', maxWidth: '150px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={remarks || ''}>
                          {remarks || '-'}
                        </span>
                      </td>
                      <td>{getStatusBadge(item)}</td>
                      <td>
                        {assignmentInfo ? (
                          <div style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <UserCheck size={12} /> {assignmentInfo.assigned_to_name}
                            </div>
                            <div style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Lock size={10} /> till {assignmentInfo.unlock_date}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* ✅ View Details - sab ko dikhega */}
                          <button 
                            className="btn-view" 
                            onClick={() => openViewModal(item)} 
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          
                          {/* ✅ Edit Payment - sirf Admin aur Manager ko dikhega */}
                          {canManage && (
                            <button className="btn-edit" onClick={() => openEditModal(item)} title="Edit Payment">
                              <Edit2 size={14} />
                            </button>
                          )}
                          
                          {item.balance > 0 ? (
                            <button className="btn-pay" onClick={() => handlePayInstallment(item.id)} title="Pay Full">
                              <CheckCircle size={14} /> Pay
                            </button>
                          ) : (
                            <span className="paid-text">✓ Paid</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInstallments.length)} of {filteredInstallments.length} entries
                </div>
                <div className="pagination-buttons">
                  <button className="pagination-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft size={16} /> Previous
                  </button>
                  {[...Array(totalPages).keys()].map(number => (
                    <button
                      key={number + 1}
                      className={`pagination-btn ${currentPage === number + 1 ? 'active' : ''}`}
                      onClick={() => paginate(number + 1)}
                    >
                      {number + 1}
                    </button>
                  ))}
                  <button className="pagination-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SelectedRecovery;