// src/components/Installments/Installments.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, DollarSign, User, CreditCard, Search, 
  Filter, Download, Eye, Clock, CheckCircle, 
  AlertCircle, Building, Phone, MapPin, X,
  FileText, Users, Package, Briefcase, Home,
  Calendar as CalendarIcon, CreditCard as CreditCardIcon,
  TrendingUp, TrendingDown, PieChart, List,
  ChevronLeft, ChevronRight, Printer, Edit2,
  Save, Trash2, RefreshCw, AlertTriangle, CheckSquare,
  Lock, UserCheck
} from 'lucide-react';
import './Installments.css';
import { API_URL, STORAGE_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

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
// ✅ VIEW MODAL WITH SLIP NO + ADVANCE AMOUNT
// ============================================
const ViewModal = ({ 
  selectedInstallment, 
  showModal, 
  setShowModal, 
  modalLoading, 
  paymentHistory, 
  formatDate, 
  formatCurrency, 
  getStatusBadge, 
  getAccountCardStatus, 
  getEmployeeAccount,
  handleEditPayment,
  handlePayInstallment
}) => {
  if (!showModal || !selectedInstallment) return null;

  const item = selectedInstallment;
  const account = item.account || {};
  const customer = account.customer || item.customer || {};
  const guarantors = item.guarantors || customer.guarantors || [];
  const paidCount = paymentHistory.filter(p => p.balance <= 0).length;
  const totalCount = paymentHistory.length;
  const totalPaid = paymentHistory.reduce((sum, p) => sum + parseFloat(p.paid_amount || 0), 0);
  const totalDue = paymentHistory.reduce((sum, p) => sum + parseFloat(p.due_amount || 0), 0);

  const accountOpeningDate = account.created_at || customer.created_at || item.created_at || null;

  const creator = account.creator || {};
  const employeeAccount = getEmployeeAccount(account);
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
                  <span className="info-value">{getAccountCardStatus(paymentHistory, account)}</span>
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
                {/* ✅ Advance Amount - Sirf yahan */}
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

            {/* ===== PAYMENT HISTORY WITH SLIP NO ===== */}
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

            {/* Documents Section */}
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
                  Form
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {customer.additional_image_1 && (
                    <DocImage label="Additional Image 1" src={getFileUrl(customer.additional_image_1)} />
                  )}
                  {customer.additional_image_2 && (
                    <DocImage label="Additional Image 2" src={getFileUrl(customer.additional_image_2)} />
                  )}
                  {!customer.additional_image_1 && !customer.additional_image_2 && (
                    <p className="no-data">No form images found</p>
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

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                  Bill
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {customer.bill_image_1 && (
                    <DocImage label="Bill Image 1" src={getFileUrl(customer.bill_image_1)} />
                  )}
                  {customer.bill_image_2 && (
                    <DocImage label="Bill Image 2" src={getFileUrl(customer.bill_image_2)} />
                  )}
                  {!customer.bill_image_1 && !customer.bill_image_2 && (
                    <p className="no-data">No bill images found</p>
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
              <button
                className="btn-edit-modal"
                onClick={() => {
                  setShowModal(false);
                  handleEditPayment(selectedInstallment);
                }}
              >
                <Edit2 size={18} />
                Edit Payment
              </button>
              <button className="btn-print" onClick={() => window.print()}>
                <Printer size={18} />
                Print
              </button>
              {selectedInstallment.balance > 0 && (
                <button
                  className="btn-pay-modal"
                  onClick={() => handlePayInstallment(selectedInstallment.id)}
                >
                  <CheckCircle size={18} />
                  Pay Full
                </button>
              )}
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
// ✅ EDIT PAYMENT MODAL WITH SLIP NO
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

            {/* ✅ NEW: Slip No field */}
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
// ✅ STATUS FILTER (multi-select)
// ============================================
const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'aging', label: 'Aging' },
  { value: 'overdue', label: 'Overdue' }
];

const StatusMultiFilter = ({ filterStatus, setFilterStatus }) => {
  const [open, setOpen] = useState(false);

  const toggleStatus = (value) => {
    setFilterStatus(prev => {
      if (value === 'all') return ['all'];
      let next = prev.includes('all') ? [] : [...prev];
      next = next.includes(value)
        ? next.filter(s => s !== value)
        : [...next, value];
      return next.length === 0 ? ['all'] : next;
    });
  };

  const displayLabel = filterStatus.includes('all')
    ? 'All'
    : STATUS_OPTIONS.filter(o => filterStatus.includes(o.value)).map(o => o.label).join(', ');

  return (
    <div className="filter-group" style={{ position: 'relative' }}>
      <label>Status:</label>
      <button
        type="button"
        className="filter-select"
        onClick={() => setOpen(v => !v)}
        style={{ textAlign: 'left', cursor: 'pointer', minWidth: '170px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {displayLabel}
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 20,
              minWidth: '190px',
              padding: '8px'
            }}
          >
            {STATUS_OPTIONS.map(opt => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={filterStatus.includes(opt.value)}
                  onChange={() => toggleStatus(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// ✅ ASSIGN PANEL - Select mode ke liye
// ============================================
const AssignPanel = ({
  selectedCount,
  employees,
  employeesLoading,
  assignLoading,
  onAssign,
  onCancel
}) => {
  const [chosenEmployee, setChosenEmployee] = useState('');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '320px',
        maxWidth: '90vw',
        background: '#fff',
        borderLeft: '1px solid #e5e7eb',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
        zIndex: 100,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCheck size={20} color="#2563eb" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>Assign Recovery</h3>
        </div>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '13px',
        color: '#1e40af',
        fontWeight: 600
      }}>
        {selectedCount} account{selectedCount !== 1 ? 's' : ''} selected
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
          Select Employee
        </label>
        {employeesLoading ? (
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Loading employees...</p>
        ) : employees.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#ef4444' }}>
            No employees found for this branch. Please add employees first.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
            {employees.map(emp => (
              <label
                key={emp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  border: `1px solid ${chosenEmployee === String(emp.id) ? '#2563eb' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: chosenEmployee === String(emp.id) ? '#eff6ff' : '#fff'
                }}
              >
                <input
                  type="radio"
                  name="assign-employee"
                  value={emp.id}
                  checked={chosenEmployee === String(emp.id)}
                  onChange={(e) => setChosenEmployee(e.target.value)}
                />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a2e' }}>{emp.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => chosenEmployee && onAssign(chosenEmployee)}
          disabled={!chosenEmployee || assignLoading || selectedCount === 0 || employees.length === 0}
          style={{
            background: (!chosenEmployee || selectedCount === 0 || employees.length === 0) ? '#93c5fd' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontWeight: 600,
            fontSize: '14px',
            cursor: (!chosenEmployee || selectedCount === 0 || employees.length === 0) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {assignLoading ? (
            <>
              <RefreshCw size={16} className="spinning" />
              Assigning...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Assign Recovery
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          style={{
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px',
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ============================================
// ✅ MAIN COMPONENT - ALL FEATURES COMBINED
// ============================================
const Installments = () => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [branchReady, setBranchReady] = useState(false);
  const [totalData, setTotalData] = useState({
    total_installments: 0,
    total_due: 0,
    total_paid: 0,
    aging_count: 0
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
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
  // ✅ SELECT / ASSIGN RECOVERY STATE
  // ============================================
  const [selectMode, setSelectMode] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState(new Set());
  const [lockedAccounts, setLockedAccounts] = useState({});
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

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

  // ============================================
  // ✅ HOOKS
  // ============================================
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setBranchReady(true);
  }, []);

  useEffect(() => {
    if (!branchReady) return;
    fetchInstallments();
    fetchLockedAccounts();
  }, [branchReady, userBranch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ============================================
  // ✅ HELPER FUNCTIONS
  // ============================================
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

  // ✅ Month-based aging calculation
  const getMonthsOverdue = useCallback((item) => {
    const dueDateStr = item.due_date;
    if (!dueDateStr) return -1;
    
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Agar due date future mein hai
    if (due > today) return -1;
    
    // Months calculate karo
    const years = today.getFullYear() - due.getFullYear();
    const months = today.getMonth() - due.getMonth();
    let totalMonths = years * 12 + months;
    
    // Agar due date ka din today se bara hai toh 1 month kam
    if (today.getDate() < due.getDate()) {
      totalMonths -= 1;
    }
    
    // Agar due date today hai toh 0 return karo (Aging 1m show hogi)
    return Math.max(0, totalMonths);
  }, []);

  // ✅ Month-based due check
  const isAlreadyDue = useCallback((item) => {
    if (!item.due_date) return true;
    return getMonthsOverdue(item) >= 0;
  }, [getMonthsOverdue]);

  // ✅ Month-based filter
  const matchesStatusFilter = useCallback((item, statuses) => {
    const accountBalance = parseFloat(item.account?.balance ?? item.balance ?? 0);
    if (accountBalance <= 0) return false;

    if (!statuses || statuses.length === 0 || statuses.includes('all')) return true;

    const itemBalance = parseFloat(item.balance || 0);
    const monthsOverdue = getMonthsOverdue(item);

    return statuses.some(status => {
      if (status === 'paid') return itemBalance <= 0;
      if (status === 'unpaid') return itemBalance > 0 && monthsOverdue < 0;
      if (status === 'aging') return itemBalance > 0 && monthsOverdue >= 0 && monthsOverdue < 4;
      if (status === 'overdue') return itemBalance > 0 && monthsOverdue >= 4;
      return false;
    });
  }, [getMonthsOverdue]);

  // ============================================
  // ✅ FETCH FUNCTIONS
  // ============================================
  const fetchInstallments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/installments?status=all`;
      if (userBranch) {
        url += `&branch_id=${userBranch}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        let installmentsData = data.data;
        if (data.data && data.data.data) {
          installmentsData = data.data.data;
        } else if (Array.isArray(data.data)) {
          installmentsData = data.data;
        } else {
          installmentsData = [];
        }

        const uniqueMap = new Map();
        const currentMonthStr = getCurrentMonthStr();

        installmentsData.forEach(item => {
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

          const isItemCurrentMonth = itemMonth === currentMonthStr;
          const isExistingCurrentMonth = existingMonth === currentMonthStr;

          if (isItemCurrentMonth) {
            uniqueMap.set(accountId, item);
            return;
          }
          if (isExistingCurrentMonth) {
            return;
          }

          const itemUnpaid = parseFloat(item.balance || 0) > 0;
          const existingUnpaid = parseFloat(existing.balance || 0) > 0;

          if (itemUnpaid && existingUnpaid) {
            if (itemMonth < existingMonth) {
              uniqueMap.set(accountId, item);
            }
          } else if (itemUnpaid && !existingUnpaid) {
            uniqueMap.set(accountId, item);
          } else if (!itemUnpaid && !existingUnpaid) {
            if (itemMonth > existingMonth) {
              uniqueMap.set(accountId, item);
            }
          }
        });

        setInstallments(Array.from(uniqueMap.values()));
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
      showToaster('Failed to load installments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLockedAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      let url = `${API_URL}/recovery-assignments/locked`;
      if (user?.branch) {
        url += `?branch_id=${user.branch}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        const map = {};
        (data.data || []).forEach(a => {
          map[a.account_id] = a;
        });
        setLockedAccounts(map);
      }
    } catch (error) {
      console.error('Error fetching locked accounts:', error);
    }
  };

  // ============================================
  // ✅ FETCH EMPLOYEES
  // ============================================
  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      let url = `${API_URL}/recovery-assignments/employees`;
      if (user?.branch) {
        url += `?branch_id=${user.branch}`;
      }

      let response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      let data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setEmployees(data.data);
        setEmployeesLoading(false);
        return;
      }

      console.log('Primary endpoint returned no employees, trying fallback...');
      
      let fallbackUrl = `${API_URL}/users?role=employee`;
      if (user?.branch) {
        fallbackUrl += `&branch_id=${user.branch}`;
      }

      response = await fetch(fallbackUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      data = await response.json();
      
      if (data.success && data.data) {
        const users = Array.isArray(data.data) ? data.data : 
                      (data.data.data ? data.data.data : []);
        
        const mappedEmployees = users.map(u => ({
          id: u.id,
          name: u.name || u.username || 'Unknown',
          email: u.email,
          branch_id: u.branch_id
        }));
        
        setEmployees(mappedEmployees);
      } else {
        console.log('Fallback /users failed, trying /employees...');
        
        let finalUrl = `${API_URL}/employees`;
        if (user?.branch) {
          finalUrl += `?branch_id=${user.branch}`;
        }

        response = await fetch(finalUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        data = await response.json();
        
        if (data.success && data.data) {
          const emps = Array.isArray(data.data) ? data.data : 
                       (data.data.data ? data.data.data : []);
          setEmployees(emps);
        } else {
          console.warn('All employee endpoints failed.');
          setEmployees([]);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  // ============================================
  // ✅ SELECT / ASSIGN FUNCTIONS
  // ============================================
  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectMode(false);
      setSelectedAccountIds(new Set());
    } else {
      setSelectMode(true);
      fetchEmployees();
    }
  };

  const toggleAccountSelection = (accountId) => {
    if (!accountId || lockedAccounts[accountId]) return;
    setSelectedAccountIds(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const handleAssignRecovery = async (employeeId) => {
    if (selectedAccountIds.size === 0) return;

    setAssignLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recovery-assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          account_ids: Array.from(selectedAccountIds),
          assigned_to: employeeId
        })
      });

      const data = await response.json();
      if (data.success) {
        showToaster(`✅ ${data.message}`, 'success');
        setSelectMode(false);
        setSelectedAccountIds(new Set());
        fetchLockedAccounts();
      } else {
        showToaster(`❌ Failed to assign: ${data.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error assigning recovery:', error);
      showToaster('Network error. Please try again.', 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  // ============================================
  // ✅ STATUS BADGE FUNCTIONS — Month-based
  // ============================================
  const getStatusBadge = (item) => {
    const balance = parseFloat(item.balance || 0);

    if (balance <= 0) {
      return <span className="badge badge-paid"><CheckCircle size={14} /> Paid</span>;
    }

    if (!item.due_date) {
      return <span className="badge badge-unpaid"><Clock size={14} /> Unpaid</span>;
    }

    const monthsOverdue = getMonthsOverdue(item);

    // Future due date = Unpaid
    if (monthsOverdue < 0) {
      return <span className="badge badge-unpaid"><Clock size={14} /> Unpaid</span>;
    }

    // 4+ months = Overdue
    if (monthsOverdue >= 4) {
      return (
        <span className="badge badge-overdue">
          <AlertCircle size={14} /> Overdue
        </span>
      );
    }

    // 0-3 months = Aging
    const displayMonths = monthsOverdue === 0 ? 1 : monthsOverdue;
    return (
      <span className="badge badge-aging">
        <AlertTriangle size={14} /> Aging ({displayMonths}m)
      </span>
    );
  };

  const getAccountCardStatus = (payments, account) => {
    const list = Array.isArray(payments) ? payments : [];
    const totalInstallments = account?.total_installments || list.length;

    const fullyPaidCount = list.filter(p => parseFloat(p.balance || 0) <= 0).length;

    if (totalInstallments > 0 && fullyPaidCount >= totalInstallments) {
      return <span className="badge badge-paid"><CheckCircle size={14} /> Paid</span>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueUnpaid = list
      .filter(p => parseFloat(p.balance || 0) > 0 && p.due_date)
      .map(p => {
        const due = new Date(p.due_date);
        due.setHours(0, 0, 0, 0);
        
        // Months calculate karo
        if (due > today) return { ...p, monthsOverdue: -1 };
        
        const years = today.getFullYear() - due.getFullYear();
        const months = today.getMonth() - due.getMonth();
        let totalMonths = years * 12 + months;
        if (today.getDate() < due.getDate()) {
          totalMonths -= 1;
        }
        return { ...p, monthsOverdue: Math.max(0, totalMonths) };
      })
      .sort((a, b) => b.monthsOverdue - a.monthsOverdue);

    // Agar koi future due hai -> Paid show karo
    const hasFutureDue = dueUnpaid.some(p => p.monthsOverdue < 0);
    if (dueUnpaid.length === 0 || (hasFutureDue && !dueUnpaid.some(p => p.monthsOverdue >= 0))) {
      return <span className="badge badge-paid"><CheckCircle size={14} /> Paid</span>;
    }

    // Sirf wo jo due hain ya overdue hain
    const overdueItems = dueUnpaid.filter(p => p.monthsOverdue >= 0);
    if (overdueItems.length === 0) {
      return <span className="badge badge-paid"><CheckCircle size={14} /> Paid</span>;
    }

    const maxMonthsOverdue = overdueItems[0].monthsOverdue;

    if (maxMonthsOverdue >= 4) {
      return (
        <span className="badge badge-overdue">
          <AlertCircle size={14} /> Overdue
        </span>
      );
    }

    const displayMonths = maxMonthsOverdue === 0 ? 1 : maxMonthsOverdue;
    return (
      <span className="badge badge-aging">
        <AlertTriangle size={14} /> Aging ({displayMonths}m)
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    const rounded = Math.round(parseFloat(amount) || 0);
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rounded);
  };

  const getEmployeeAccount = (account) => {
    if (!account) return {};
    return account.employeeAccount || account.employee_account || {};
  };

  // ============================================
  // ✅ HANDLERS
  // ============================================
  const handleViewDetails = async (item) => {
    setModalLoading(true);
    setSelectedInstallment(item);
    setShowModal(true);

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
        setSelectedInstallment({
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
            fetchInstallments();
            if (showModal) {
              handleViewDetails(selectedInstallment);
            }
          } else {
            showToaster(`❌ Failed: ${data.message}`, 'error');
          }
        } catch (error) {
          console.error('Error paying installment:', error);
          showToaster('Network error. Please try again.', 'error');
        }
      }
    );
  };

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

  const handleEditPayment = async (installment) => {
    const customerName = installment.customer?.name ||
                        installment.customer_name ||
                        installment.account?.customer?.name ||
                        'N/A';

    const customerCnic = installment.customer?.cnic ||
                        installment.cnic ||
                        installment.account?.customer?.cnic ||
                        '';

    const caseNo = installment.account?.case_no ||
                  installment.case_no ||
                  'N/A';

    const accountId = installment.account_id || installment.account?.id;
    const existingRemarks = installment.remarks || '';

    const monthLabel = installment.month
      ? new Date(installment.month + '-01').toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
      : 'N/A';

    setEditPaymentData({
      paid_amount: '',
      month: installment.month || '',
      month_label: monthLabel,
      installment_id: installment.id,
      due_amount: installment.due_amount || 0,
      current_paid: installment.paid_amount || 0,
      balance: installment.balance || 0,
      customer_name: customerName,
      customer_cnic: customerCnic,
      case_no: caseNo,
      account_id: accountId,
      total_installments: installment.account?.total_installments || 0,
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
        remarks: selected.id === installment.id ? existingRemarks : '',
        slip_no: ''
      }));
    }
  };

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
        fetchInstallments();
        if (showModal) {
          handleViewDetails(selectedInstallment);
        }
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
  // ✅ MEMOIZED DATA
  // ============================================
  const statusFilteredInstallments = useMemo(() => {
    return installments.filter(item => matchesStatusFilter(item, filterStatus));
  }, [installments, filterStatus, matchesStatusFilter]);

  useEffect(() => {
    let totalDue = 0;
    let totalPaid = 0;
    let agingCount = 0;

    statusFilteredInstallments.forEach(item => {
      totalDue += parseFloat(item.due_amount || 0);
      totalPaid += parseFloat(item.paid_amount || 0);

      const balance = parseFloat(item.balance || 0);
      const isAging = balance > 0 && isAlreadyDue(item);

      if (isAging) {
        agingCount++;
      }
    });

    setTotalData({
      total_installments: statusFilteredInstallments.length,
      total_due: totalDue,
      total_paid: totalPaid,
      aging_count: agingCount
    });

    setCurrentPage(1);
  }, [statusFilteredInstallments, isAlreadyDue]);

  const filteredInstallments = useMemo(() => {
    const search = debouncedSearch.toLowerCase().trim();
    if (!search) return statusFilteredInstallments;

    return statusFilteredInstallments.filter(item => {
      const customer = item.customer || item.account?.customer || {};
      const customerName = (customer.name || item.customer_name || '').toLowerCase();
      const customerCnic = (customer.cnic || item.cnic || '').toLowerCase();
      const customerPhone = (customer.phone || item.phone || '').toLowerCase();
      const customerAddress = (customer.address || '').toLowerCase();

      const caseNo = (item.account?.case_no || item.case_no || '').toLowerCase();
      const productName = (item.account?.product_name || '').toLowerCase();

      const creatorName = (item.account?.creator?.name || '').toLowerCase();
      const employeeName = (item.account?.employeeAccount?.employee?.name || '').toLowerCase();

      return customerName.includes(search) ||
             customerCnic.includes(search) ||
             customerPhone.includes(search) ||
             customerAddress.includes(search) ||
             caseNo.includes(search) ||
             productName.includes(search) ||
             creatorName.includes(search) ||
             employeeName.includes(search);
    });
  }, [statusFilteredInstallments, debouncedSearch]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(
    () => filteredInstallments.slice(indexOfFirstItem, indexOfLastItem),
    [filteredInstallments, indexOfFirstItem, indexOfLastItem]
  );
  const totalPages = Math.ceil(filteredInstallments.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ============================================
  // ✅ EXPORT DATA — Month-based
  // ============================================
  const exportData = useMemo(() => {
    return filteredInstallments.map(item => {
      const customer = item.customer || item.account?.customer || {};
      const account = item.account || {};
      const creator = account.creator || {};
      const employeeAccount = getEmployeeAccount(account);
      const employee = employeeAccount.employee || {};

      const itemBalance = parseFloat(item.balance || 0);
      const accountBalance = parseFloat(account.balance ?? item.balance ?? 0);

      let statusLabel;
      if (itemBalance <= 0) {
        statusLabel = 'Paid';
      } else {
        const monthsOverdue = getMonthsOverdue(item);
        if (monthsOverdue < 0) {
          statusLabel = 'Unpaid';
        } else if (monthsOverdue >= 4) {
          statusLabel = 'Overdue';
        } else {
          statusLabel = 'Aging';
        }
      }

      return {
        name: customer.name || item.customer_name || 'N/A',
        cnic: customer.cnic || item.cnic || 'N/A',
        phone: customer.phone || item.phone || 'N/A',
        caseNo: account.case_no || item.case_no || 'N/A',
        productName: account.product_name || 'N/A',
        dueAmount: Math.round(parseFloat(item.due_amount || 0)),
        paidAmount: Math.round(parseFloat(item.paid_amount || 0)),
        balance: Math.round(parseFloat(item.balance || 0)),
        totalBalance: Math.round(parseFloat(account.balance || 0)),
        month: item.month ? new Date(item.month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : 'N/A',
        dueDate: item.due_date ? formatDate(item.due_date) : 'N/A',
        status: statusLabel,
        createdBy: creator.name || 'N/A',
        employee: employee.name || account.employee_name || 'N/A',
        branch: `Branch ${account.branch_id || item.branch_id || 'N/A'}`,
        remarks: item.remarks || ''
      };
    });
  }, [filteredInstallments]);

  const exportColumns = [
    { header: 'Customer Name', key: 'name' },
    { header: 'CNIC', key: 'cnic' },
    { header: 'Phone', key: 'phone' },
    { header: 'Case No', key: 'caseNo' },
    { header: 'Product', key: 'productName' },
    { header: 'Due Amount', key: 'dueAmount' },
    { header: 'Paid Amount', key: 'paidAmount' },
    { header: 'Installment Balance', key: 'balance' },
    { header: 'Account Balance', key: 'totalBalance' },
    { header: 'Month', key: 'month' },
    { header: 'Due Date', key: 'dueDate' },
    { header: 'Status', key: 'status' },
    { header: 'Created By', key: 'createdBy' },
    { header: 'Employee', key: 'employee' },
    { header: 'Branch', key: 'branch' },
    { header: 'Remarks', key: 'remarks' }
  ];

  // ============================================
  // ✅ RENDER
  // ============================================
  return (
    <div className="installments-page" style={{ marginRight: selectMode ? '320px' : 0, transition: 'margin 0.2s' }}>
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

      <ViewModal 
        selectedInstallment={selectedInstallment}
        showModal={showModal}
        setShowModal={setShowModal}
        modalLoading={modalLoading}
        paymentHistory={paymentHistory}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getStatusBadge={getStatusBadge}
        getAccountCardStatus={getAccountCardStatus}
        getEmployeeAccount={getEmployeeAccount}
        handleEditPayment={handleEditPayment}
        handlePayInstallment={handlePayInstallment}
      />

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

      {selectMode && (
        <AssignPanel
          selectedCount={selectedAccountIds.size}
          employees={employees}
          employeesLoading={employeesLoading}
          assignLoading={assignLoading}
          onAssign={handleAssignRecovery}
          onCancel={() => {
            setSelectMode(false);
            setSelectedAccountIds(new Set());
          }}
        />
      )}

      <div className="page-header">
        <div className="header-title-group">
          <h2 className="page-title">Recovery</h2>
          <span className="live-badge">
            <Clock size={12} /> Live
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={toggleSelectMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: selectMode ? '1px solid #2563eb' : '1px solid #e5e7eb',
              background: selectMode ? '#eff6ff' : '#fff',
              color: selectMode ? '#2563eb' : '#374151',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <CheckSquare size={16} />
            {selectMode ? 'Cancel Select' : 'Select'}
          </button>
          <ExportButton
            data={exportData}
            columns={exportColumns}
            filename="recovery-report"
            title="Recovery Report"
          />
          {userBranch && (
            <div className="branch-badge">
              <Building size={14} />
              <span>Branch {userBranch}</span>
            </div>
          )}
        </div>
      </div>

      <div className="stats-grid-4">
        <div className="stat-card-4">
          <div className="stat-card-4-icon total">
            <DollarSign size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Accounts</span>
            <span className="stat-card-4-value">{totalData.total_installments}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon due">
            <AlertCircle size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Total Amounts</span>
            <span className="stat-card-4-value">{formatCurrency(totalData.total_due - totalData.total_paid)}</span>
          </div>
        </div>
        <div className="stat-card-4">
          <div className="stat-card-4-icon aging">
            <Clock size={22} />
          </div>
          <div className="stat-card-4-info">
            <span className="stat-card-4-label">Aging</span>
            <span className="stat-card-4-value">{totalData.aging_count}</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-left">
          <StatusMultiFilter filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
        </div>

        <div className="filter-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, CNIC, phone, address, case no..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading installments...</p>
          </div>
        ) : filteredInstallments.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No installments found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <table className="installments-table">
              <thead>
               <tr style={{ background: '#1E1B4B' }}>
                  {selectMode && <th style={{ width: '36px', fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}></th>}
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>#</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Customer</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Case No</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Due Date</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Installments</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Mirror</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remarks</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Employee</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => {
                  const actualIndex = indexOfFirstItem + index + 1;

                  const customerName = item.customer?.name ||
                                      item.customer_name ||
                                      item.account?.customer?.name ||
                                      'N/A';

                  const customerCnic = item.customer?.cnic ||
                                      item.cnic ||
                                      item.account?.customer?.cnic ||
                                      '';

                  const caseNo = item.account?.case_no ||
                                item.case_no ||
                                'N/A';

                  const accountData = item.account || {};
                  const employeeAccount = getEmployeeAccount(accountData);
                  const employee = employeeAccount.employee || {};
                  const employeeName = employee.name || accountData.employee_name || 'N/A';

                  const accountTotalBalance = accountData.balance || item.balance || 0;
                  const remarks = item.remarks || '';

                  const rowAccountId = item.account_id || item.account?.id;
                  const lockInfo = rowAccountId ? lockedAccounts[rowAccountId] : null;
                  const isChecked = rowAccountId ? selectedAccountIds.has(rowAccountId) : false;

                  return (
                    <tr key={item.id} className="installment-row">
                      {selectMode && (
                        <td className="text-center">
                          {lockInfo ? (
                            <span title={`Locked — assigned to ${lockInfo.assigned_to_name} till ${lockInfo.unlock_date}`}>
                              <Lock size={16} color="#9ca3af" />
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAccountSelection(rowAccountId)}
                            />
                          )}
                        </td>
                      )}
                      <td className="text-center">{actualIndex}</td>
                      <td>
                        <div className="customer-info">
                          <strong style={{color: '#1a1a2e'}}>
                            {customerName}
                          </strong>
                          {customerCnic && (
                            <span className="customer-cnic">{customerCnic}</span>
                          )}
                          {lockInfo && (
                            <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                              <Lock size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                              With {lockInfo.assigned_to_name} till {lockInfo.unlock_date}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="case-no">{caseNo}</span>
                      </td>
                      <td>
                        <span className="month-text" style={{fontWeight: '500', color: '#7c3aed'}}>
                          {item.due_date ? formatDate(item.due_date) : (item.month ? new Date(item.month + '-01').toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : '-')}
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
                        <span style={{fontWeight: '600', color: '#166534', fontSize: '12px'}}>
                          {employeeName}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => handleViewDetails(item)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditPayment(item)}
                            title="Edit Payment"
                          >
                            <Edit2 size={14} />
                          </button>
                          {item.balance > 0 && (
                            <button
                              className="btn-pay"
                              onClick={() => handlePayInstallment(item.id)}
                              title="Pay Full"
                            >
                              <CheckCircle size={14} />
                              Pay
                            </button>
                          )}
                          {item.balance <= 0 && (
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
                  <button
                    className="pagination-btn"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                    Previous
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

                  <button
                    className="pagination-btn"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {filteredInstallments.length > 0 && (
        <div className="table-footer">
          <span>Showing {filteredInstallments.length} of {installments.length} installments</span>
        </div>
      )}
    </div>
  );
};

export default Installments;