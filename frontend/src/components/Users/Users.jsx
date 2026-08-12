// src/components/UsersManagement/UsersManagement.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Users as UsersIcon, UserPlus, User, Building, Calendar, 
  CheckCircle, Clock, Edit, Trash2, Eye, 
  Award, Briefcase,
  DollarSign, AlertCircle, AlertTriangle, X, FileText, Save, RefreshCw,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import './Users.css';
import { API_URL, STORAGE_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

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
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
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
          flexShrink: 0
        }}>
          <Icon size={20} />
        </div>
        <div style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 600,
          color: style.text,
          lineHeight: 1.4
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
            flexShrink: 0
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

const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path}`;
};

const DocImage = React.memo(({ label, src }) => (
  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
    <a href={src} target="_blank" rel="noopener noreferrer">
      <img 
        src={src} 
        alt={label} 
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: 'zoom-in' }} 
      />
    </a>
    <p style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', padding: '6px', margin: 0, color: '#374151' }}>
      {label}
    </p>
  </div>
));

const EditableDocImage = ({ label, src, fieldName, isEditing, previewUrl, onFileSelect }) => {
  const inputRef = React.useRef(null);
  const displaySrc = previewUrl || src;

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff', position: 'relative' }}>
      {displaySrc ? (
        <a
          href={displaySrc}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (isEditing) e.preventDefault(); }}
          style={{ display: 'block' }}
        >
          <img
            src={displaySrc}
            alt={label}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '120px', objectFit: 'cover', cursor: isEditing ? 'default' : 'zoom-in' }}
          />
        </a>
      ) : (
        <div style={{
          width: '100%',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3f4f6',
          color: '#9ca3af',
          fontSize: '12px',
          fontWeight: 600
        }}>
          No Image
        </div>
      )}
      <p style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', padding: '6px', margin: 0, color: '#374151' }}>
        {label}
        {previewUrl && (
          <span style={{ display: 'block', color: '#166534', fontSize: '10px', fontWeight: 700 }}>New file selected</span>
        )}
      </p>
      {isEditing && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: '#1E1B4B',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Edit size={12} /> Change
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onFileSelect(fieldName, e.target.files[0]);
              }
              e.target.value = '';
            }}
          />
        </>
      )}
    </div>
  );
};

const EditPaymentModal = ({
  showEditModal,
  setShowEditModal,
  editPaymentData,
  setEditPaymentData,
  availableInstallments,
  paymentDate,
  editLoading,
  handlePartialPaymentSubmit,
  formatCurrency,
  formatMonth
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
    <div className="users-modal-overlay" onClick={() => setShowEditModal(false)}>
      <div className="users-modal-content edit-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="users-modal-header">
          <div className="users-modal-header-left">
            <Edit size={20} className="users-modal-icon" />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Edit Payment</h3>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>Case: {editPaymentData.case_no}</p>
            </div>
          </div>
          <button className="users-modal-close" onClick={() => setShowEditModal(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="users-modal-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            background: '#f8f9fc',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '20px'
          }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Customer</span>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e', margin: 0 }}>
                {editPaymentData.customer_name}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Monthly Installment</span>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B', margin: 0 }}>
                {formatCurrency(editPaymentData.due_amount)}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>Already Paid (this month)</span>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#10b981', margin: 0 }}>
                {formatCurrency(editPaymentData.current_paid)}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>This Month's Balance</span>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#ef4444', margin: 0 }}>
                {formatCurrency(maxPayable)}
              </p>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Select Month *</label>
            <select
              value={editPaymentData.installment_id || ''}
              onChange={handleMonthChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontWeight: 600,
                fontSize: '14px',
                background: '#fff'
              }}
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
            <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontWeight: 600 }}>
              Sirf sabse purana unpaid month select ho sakta hai — baaki months isi ke baad khud unlock ho jayenge.
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Payment Amount (PKR)</label>
            <input
              type="number"
              value={editPaymentData.paid_amount}
              onChange={(e) => setEditPaymentData({
                ...editPaymentData,
                paid_amount: e.target.value
              })}
              placeholder="Enter amount to pay (optional)"
              min="0"
              max={maxPayable}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontWeight: 600,
                fontSize: '14px'
              }}
            />
            <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontWeight: 600 }}>
              Max payable (isi month ki): {formatCurrency(maxPayable)} — is se aik rupya bhi zyada nahi. Amount is optional if you're only adding remarks.
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Slip No</label>
            <input
              type="text"
              value={editPaymentData.slip_no || ''}
              onChange={(e) => setEditPaymentData({
                ...editPaymentData,
                slip_no: e.target.value
              })}
              placeholder="Enter unique slip number..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontWeight: 600,
                fontSize: '14px'
              }}
            />
            <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontWeight: 600 }}>
              Optional: Enter the slip/reference number for this payment
            </small>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Remarks</label>
            <textarea
              value={editPaymentData.remarks || ''}
              onChange={(e) => setEditPaymentData({
                ...editPaymentData,
                remarks: e.target.value
              })}
              placeholder="Add remarks or notes..."
              rows="3"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontWeight: 500,
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontWeight: 600 }}>
              Optional: Add any notes about this payment
            </small>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontWeight: 600,
                fontSize: '14px',
                background: '#f3f4f6'
              }}
            />
            <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontWeight: 600 }}>
              Payment will be recorded with today's date
            </small>
          </div>
        </div>

        <div className="users-modal-footer">
          <button
            className="users-btn-cancel"
            onClick={() => setShowEditModal(false)}
            style={{ fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            className="users-btn-save"
            onClick={handlePartialPaymentSubmit}
            disabled={editLoading}
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
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
  );
};

// ============================================
// ✅ Helper functions
// ============================================
const monthsBetweenStr = (fromMonth, toMonth) => {
  if (!fromMonth || !toMonth) return 0;
  const [fy, fm] = fromMonth.split('-').map(Number);
  const [ty, tm] = toMonth.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
};

const getCurrentMonthString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// ✅ date-only string ko LOCAL time se parse karo (UTC se nahi)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00');
};

// ✅ FIXED: formatDate — timezone bug fix
const formatDate = (date) => {
  if (!date) return '-';
  const d = date.includes('T') || date.includes(' ') ? new Date(date) : new Date(date + 'T00:00:00');
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ✅ FIXED: formatMonth — timezone bug fix
const formatMonth = (month) => {
  if (!month) return '-';
  return new Date(month + '-01T00:00:00').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
};

// ✅ FIXED: findPrimaryInstallment — sab se pehli installment return karo (chahe paid ho ya unpaid)
const findPrimaryInstallment = (installments) => {
  const list = Array.isArray(installments) ? installments : [];
  
  if (list.length === 0) return null;
  
  // ✅ Sab se pehli installment due_date ke hisaab se return karo
  const sorted = [...list].sort((a, b) => {
    const dateA = a.due_date ? new Date(a.due_date + 'T00:00:00') : new Date(a.month + '-01T00:00:00');
    const dateB = b.due_date ? new Date(b.due_date + 'T00:00:00') : new Date(b.month + '-01T00:00:00');
    return dateA - dateB;
  });
  
  return sorted[0];
};

const CUSTOMER_IMAGE_FIELDS = ['cnic_front', 'cnic_back', 'additional_image_1', 'additional_image_2', 'bill_image_1', 'bill_image_2', 'voice_consent'];
const ACCOUNT_IMAGE_FIELDS = ['chalan_front', 'chalan_back'];

const UsersManagement = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('active');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [guarantorsLoading, setGuarantorsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [editingData, setEditingData] = useState({
    installmentId: null,
    paidAmount: '',
    slipNo: '',
    remarks: '',
    maxPayable: 0,
  });
  const [saving, setSaving] = useState(false);

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

  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: '',
    phone: '',
    cnic: '',
    address: '',
    product_name: '',
  });
  const [editImageFiles, setEditImageFiles] = useState({});
  const [editImagePreviews, setEditImagePreviews] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [toaster, setToaster] = useState({ message: '', type: 'success', show: false });

  const showToaster = (message, type = 'success') => {
    setToaster({ message, type, show: true });
  };

  const hideToaster = () => {
    setToaster({ message: '', type: 'success', show: false });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    setPaymentDate(new Date().toISOString().split('T')[0]);
    fetchClients();
    fetchEmployees();
  }, []);

  // ✅ FILTER CHANGE PAR PAGE RESET
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, dateFilter]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToaster('Failed to load employees', 'error');
    }
  };

  const fetchGuarantorsForAccount = async (accountId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/installments/account-details/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const accountData = data.data;
        const customer = accountData.customer || {};
        if (customer.guarantors && Array.isArray(customer.guarantors)) {
          return customer.guarantors;
        }
        if (accountData.guarantors && Array.isArray(accountData.guarantors)) {
          return accountData.guarantors;
        }
        if (customer.guarantor && Array.isArray(customer.guarantor)) {
          return customer.guarantor;
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching guarantors for account:', error);
      return [];
    }
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
            ? new Date(inst.month + '-01T00:00:00').toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
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

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        const accounts = data.data.data || data.data || [];
        
        const clientsData = accounts.map((account) => {
          const installments = account.installments || [];
          const currentMonthStr = getCurrentMonthString();
          const currentMonthInstallment = installments.find(p => p.month === currentMonthStr);
          const mirrorAmount = currentMonthInstallment ? parseFloat(currentMonthInstallment.balance || 0) : 0;
          
          const customer = account.customer || {};
          
          let guarantors = [];
          if (customer.guarantors && Array.isArray(customer.guarantors) && customer.guarantors.length > 0) {
            guarantors = customer.guarantors;
          } else if (account.guarantors && Array.isArray(account.guarantors) && account.guarantors.length > 0) {
            guarantors = account.guarantors;
          } else if (customer.guarantor && Array.isArray(customer.guarantor) && customer.guarantor.length > 0) {
            guarantors = customer.guarantor;
          }

          const primaryInstallment = findPrimaryInstallment(installments);

          return {
            id: account.id,
            name: customer.name || 'N/A',
            phone: customer.phone || '',
            cnic: customer.cnic || '',
            address: customer.address || '',
            branch: account.branch_id || 1,
            accountStatus: account.status || 'active',
            totalAmount: parseFloat(account.total_amount) || 0,
            paidAmount: parseFloat(account.paid_amount) || 0,
            balance: parseFloat(account.balance) || 0,
            advanceAmount: parseFloat(account.advance_amount) || 0,
            monthlyInstallment: parseFloat(account.monthly_installment) || 0,
            installmentsPaid: account.installments_paid || 0,
            totalInstallments: account.total_installments || 0,
            nextDueDate: account.next_due_date || account.due_date || 'N/A',
            joiningDate: account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A',
            joiningDateRaw: account.created_at || null,
            lastPaymentDate: account.last_payment_date || 'N/A',
            product: account.product_name || 'N/A',
            caseNo: account.case_no || 'N/A',
            employeeId: account.created_by || null,
            creator: account.creator || null,
            employeeAccount: account.employee_account || null,
            employeeName: account.employee_account?.employee?.name || null,
            creatorName: account.creator?.name || null,
            creatorRole: account.creator?.role || null,
            installments: account.installments || [],
            mirror: mirrorAmount,
            customer: customer,
            account: account,
            remarks: primaryInstallment?.remarks || '',
            primaryInstallmentId: primaryInstallment?.id || null,
            primaryInstallmentBalance: primaryInstallment ? parseFloat(primaryInstallment.balance || 0) : 0,
            primaryInstallmentMonth: primaryInstallment?.month || null,
            primaryInstallmentDueDate: primaryInstallment?.due_date || null,
            guarantors: guarantors,
            guarantorsFetched: guarantors.length > 0,
            cnic_front: customer.cnic_front || null,
            cnic_back: customer.cnic_back || null,
            additional_image_1: customer.additional_image_1 || null,
            additional_image_2: customer.additional_image_2 || null,
            voice_consent: customer.voice_consent || null,
            chalan_front: account.chalan_front || null,
            chalan_back: account.chalan_back || null,
            bill_image_1: customer.bill_image_1 || null,
            bill_image_2: customer.bill_image_2 || null,
            createdAt: account.created_at || null,
          };
        });
        
        clientsData.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        
        setClients(clientsData);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      showToaster('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const monthsBetween = (fromMonth, toMonth) => {
    if (!fromMonth || !toMonth) return 0;
    const [fy, fm] = fromMonth.split('-').map(Number);
    const [ty, tm] = toMonth.split('-').map(Number);
    return (ty - fy) * 12 + (tm - fm);
  };

  const getCurrentMonthStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getClientCategoryInfo = useCallback((client) => {
    const list = Array.isArray(client.installments) ? client.installments : [];
    const totalInstallments = client.totalInstallments || list.length;
    const fullyPaidCount = list.filter(p => parseFloat(p.balance || 0) <= 0).length;

    if (list.length === 0) {
      if (client.balance <= 0) return { category: 'clear', months: 0 };
      return { category: 'unpaid', months: 0 };
    }

    if (totalInstallments > 0 && fullyPaidCount >= totalInstallments) {
      return { category: 'clear', months: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonthStr = getCurrentMonthString();
    const currentMonthInstallment = list.find(p => p.month === currentMonthStr);
    if (currentMonthInstallment && parseFloat(currentMonthInstallment.balance || 0) <= 0) {
      const futureUnpaid = list.filter(p => 
        parseFloat(p.balance || 0) > 0 && 
        p.due_date && 
        parseLocalDate(p.due_date) > today
      );
      if (futureUnpaid.length > 0) {
        return { category: 'paid', months: 0 };
      }
      if (client.balance <= 0) {
        return { category: 'clear', months: 0 };
      }
    }

    const dueUnpaid = list
      .filter(p =>
        parseFloat(p.balance || 0) > 0 &&
        p.due_date &&
        parseLocalDate(p.due_date) > today
      )
      .sort((a, b) => parseLocalDate(a.due_date) - parseLocalDate(b.due_date));

    if (dueUnpaid.length > 0) {
      const overdueExist = list.some(p =>
        parseFloat(p.balance || 0) > 0 &&
        p.due_date &&
        parseLocalDate(p.due_date) <= today
      );
      if (!overdueExist) {
        return { category: 'unpaid', months: 0 };
      }
    }

    const overdueUnpaid = list
      .filter(p =>
        parseFloat(p.balance || 0) > 0 &&
        p.due_date &&
        parseLocalDate(p.due_date) <= today
      )
      .sort((a, b) => parseLocalDate(a.due_date) - parseLocalDate(b.due_date));

    if (overdueUnpaid.length === 0) {
      return { category: 'unpaid', months: 0 };
    }

    const oldestDue = overdueUnpaid[0];
    const overdueDays = Math.floor((today - parseLocalDate(oldestDue.due_date)) / (1000 * 60 * 60 * 24));
   const overdueMonthsApprox = Math.ceil(overdueDays / 30) || 1;

    if (overdueDays > 90) {
      return { category: 'overdue', months: overdueMonthsApprox };
    }

    return { category: 'aging', months: overdueMonthsApprox };
  }, []);

  const getRowColorClass = (client) => {
    const { category } = getClientCategoryInfo(client);
    switch (category) {
      case 'clear': return 'row-clear';
      case 'paid': return 'row-paid';
      case 'unpaid': return 'row-unpaid';
      case 'overdue': return 'row-overdue';
      case 'aging': return 'row-aging';
      default: return '';
    }
  };

  const getCategoryBadge = (client) => {
    const { category, months } = getClientCategoryInfo(client);
    switch (category) {
      case 'overdue':
        return <span className="client-badge overdue" style={{ fontWeight: 700 }}><AlertTriangle size={12} /> Overdue ({months}m)</span>;
      case 'aging':
        return <span className="client-badge aging" style={{ fontWeight: 700 }}><AlertCircle size={12} /> Aging ({months}m)</span>;
      case 'unpaid':
        return <span className="client-badge unpaid" style={{ fontWeight: 700 }}><Clock size={12} /> Unpaid</span>;
      case 'paid':
        return <span className="client-badge paid" style={{ fontWeight: 700 }}><CheckCircle size={12} /> Paid</span>;
      case 'clear':
        return <span className="client-badge clear" style={{ fontWeight: 700 }}><CheckCircle size={12} /> Clear Account</span>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (client) => {
    const { category } = getClientCategoryInfo(client);
    switch (category) {
      case 'overdue': return 'Overdue';
      case 'aging': return 'Aging';
      case 'unpaid': return 'Unpaid';
      case 'paid': return 'Paid';
      case 'clear': return 'Clear Account';
      default: return '-';
    }
  };

  // ✅ FIXED: Active filter - Clear Account ke ilawa sab
  const filteredData = useMemo(() => {
    let filtered = clients;

    if (userBranch) {
      filtered = filtered.filter(item => item.branch === parseInt(userBranch));
    }

    if (search) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.cnic && item.cnic.includes(search)) ||
        (item.caseNo && item.caseNo.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'active') {
        // ✅ Active = Clear Account ke ilawa sab (Paid + Unpaid + Aging + Overdue)
        filtered = filtered.filter(item => getClientCategoryInfo(item).category !== 'clear');
      } else {
        filtered = filtered.filter(item => getClientCategoryInfo(item).category === categoryFilter);
      }
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(item => {
        if (!item.joiningDateRaw) return false;
        const joinDate = new Date(item.joiningDateRaw);
        if (isNaN(joinDate.getTime())) return false;

        switch(dateFilter) {
          case 'daily':
            return joinDate >= new Date(today.getTime() - 24 * 60 * 60 * 1000);
          case 'weekly':
            return joinDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'monthly':
            return joinDate.getMonth() === today.getMonth() && 
                   joinDate.getFullYear() === today.getFullYear();
          case 'yearly':
            return joinDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [clients, userBranch, search, categoryFilter, dateFilter, getClientCategoryInfo]);

  const categorizedClients = useMemo(() => {
    return filteredData.map(c => ({ client: c, category: getClientCategoryInfo(c).category }));
  }, [filteredData, getClientCategoryInfo]);

  const { totalClients, totalAging, totalOverdue, totalPaid, totalUnpaid, totalClear, totalBalance } = useMemo(() => {
    let aging = 0, overdue = 0, paid = 0, unpaid = 0, clear = 0, balance = 0;
    for (const { client, category } of categorizedClients) {
      if (category === 'aging') aging++;
      else if (category === 'overdue') overdue++;
      else if (category === 'paid') paid++;
      else if (category === 'unpaid') unpaid++;
      else if (category === 'clear') clear++;
      balance += client.balance;
    }
    return {
      totalClients: categorizedClients.length,
      totalAging: aging,
      totalOverdue: overdue,
      totalPaid: paid,
      totalUnpaid: unpaid,
      totalClear: clear,
      totalBalance: balance
    };
  }, [categorizedClients]);

  const formatCurrency = (amount) => {
    return amount.toLocaleString();
  };

  const getBranchName = (branchId) => {
    return branchId === 1 ? 'Branch 1' : 'Branch 2';
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canEdit = isAdmin || isManager;

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const openEditPaymentModal = async (client) => {
    const accountId = client.id;
    const customerName = client.name || 'N/A';
    const caseNo = client.caseNo || 'N/A';

    const list = await fetchAccountInstallmentsList(accountId);
    
    if (list.length === 0) {
      showToaster('No installments found for this account', 'error');
      return;
    }

    setAvailableInstallments(list);

    const earliestUnpaid = list.find(i => i.balance > 0);
    const selected = earliestUnpaid || list[0];

    setEditPaymentData({
      paid_amount: '',
      month: selected.month || '',
      month_label: selected.label || '',
      installment_id: selected.id || null,
      due_amount: selected.due_amount || 0,
      current_paid: selected.paid_amount || 0,
      balance: selected.balance || 0,
      customer_name: customerName,
      customer_cnic: client.cnic || '',
      case_no: caseNo,
      account_id: accountId,
      total_installments: client.totalInstallments || 0,
      remarks: '',
      slip_no: '',
    });

    setShowEditModal(true);
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
        fetchClients();
        if (showDetailModal) {
          setShowDetailModal(false);
          setSelectedUser(null);
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

  const viewDetail = async (item) => {
    setSelectedUser(item);
    setShowDetailModal(true);
    setIsEditingUser(false);
    setEditImageFiles({});
    setEditImagePreviews({});

    setEditingData({
      installmentId: item.primaryInstallmentId || null,
      paidAmount: '',
      slipNo: '',
      remarks: item.remarks || '',
      maxPayable: item.primaryInstallmentBalance || 0,
    });

    if (!item.guarantorsFetched) {
      setGuarantorsLoading(true);
      const guarantors = await fetchGuarantorsForAccount(item.id);
      const updatedItem = { ...item, guarantors, guarantorsFetched: true };

      setSelectedUser(updatedItem);
      setClients(prev => prev.map(c => c.id === item.id ? updatedItem : c));
      setGuarantorsLoading(false);
    }
  };

  const closeDetailModal = () => {
    Object.values(editImagePreviews).forEach(url => URL.revokeObjectURL(url));
    setShowDetailModal(false);
    setSelectedUser(null);
    setIsEditingUser(false);
    setEditImageFiles({});
    setEditImagePreviews({});
  };

  const handleSaveEdit = async () => {
    if (!canEdit || !selectedUser) return;

    if (!editingData.installmentId) {
      showToaster('No installment record found for this account.', 'error');
      return;
    }

    const amount = parseFloat(editingData.paidAmount) || 0;
    const hasRemarks = (editingData.remarks || '').trim().length > 0;

    if (amount <= 0 && !hasRemarks) {
      showToaster('Please enter a payment amount or add remarks', 'error');
      return;
    }

    if (amount > 0 && !editingData.slipNo.trim()) {
      showToaster('Please enter a Slip No for this payment', 'error');
      return;
    }

    if (amount > 0 && amount > editingData.maxPayable) {
      showToaster(`Amount cannot exceed the remaining balance of PKR ${editingData.maxPayable.toLocaleString()}`, 'error');
      return;
    }

    setSaving(true);
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
          installment_id: editingData.installmentId,
          paid_amount: amount,
          slip_no: editingData.slipNo || null,
          remarks: editingData.remarks || ''
        })
      });

      const data = await response.json();
      if (data.success) {
        showToaster(amount > 0 ? 'Payment recorded successfully!' : 'Remarks saved successfully!', 'success');
        setShowDetailModal(false);
        setSelectedUser(null);
        fetchClients();
      } else {
        const errMsg = data.errors?.slip_no?.[0] || data.message || 'Unknown error';
        showToaster('Failed to save: ' + errMsg, 'error');
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      showToaster('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    if (!selectedUser) return;
    setEditUserData({
      name: selectedUser.name || '',
      phone: selectedUser.phone || '',
      cnic: selectedUser.cnic || '',
      address: selectedUser.address || '',
      product_name: selectedUser.product || '',
    });
    setEditImageFiles({});
    setEditImagePreviews({});
    setIsEditingUser(true);
  };

  const cancelEdit = () => {
    Object.values(editImagePreviews).forEach(url => URL.revokeObjectURL(url));
    setIsEditingUser(false);
    setEditImageFiles({});
    setEditImagePreviews({});
  };

  const handleEditImageChange = (fieldName, file) => {
    setEditImageFiles(prev => ({ ...prev, [fieldName]: file }));
    setEditImagePreviews(prev => {
      if (prev[fieldName]) URL.revokeObjectURL(prev[fieldName]);
      return { ...prev, [fieldName]: URL.createObjectURL(file) };
    });
  };

  const handleSaveUserEdit = async () => {
    if (!canEdit || !selectedUser) return;

    if (!editUserData.name.trim()) {
      showToaster('Name is required', 'error');
      return;
    }
    if (!editUserData.phone.trim()) {
      showToaster('Phone is required', 'error');
      return;
    }

    setSavingEdit(true);
    try {
      const token = localStorage.getItem('token');
      const customerId = selectedUser.customer?.id;

      if (customerId) {
        const fd = new FormData();
        fd.append('_method', 'PUT');
        fd.append('name', editUserData.name);
        fd.append('phone', editUserData.phone);
        fd.append('cnic', editUserData.cnic);
        fd.append('address', editUserData.address);

        CUSTOMER_IMAGE_FIELDS.forEach(f => {
          if (editImageFiles[f]) fd.append(f, editImageFiles[f]);
        });

        const res = await fetch(`${API_URL}/customers/${customerId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: fd
        });
        const data = await res.json();
        if (!data.success) {
          showToaster('Update failed: ' + (data.message || 'Unknown error'), 'error');
          setSavingEdit(false);
          return;
        }
      }

      const hasChalanChange = ACCOUNT_IMAGE_FIELDS.some(f => editImageFiles[f]);
      const productChanged = editUserData.product_name !== (selectedUser.product || '');

      if (hasChalanChange || productChanged) {
        const fd2 = new FormData();
        fd2.append('_method', 'PUT');
        if (productChanged) {
          fd2.append('product_name', editUserData.product_name);
        }
        ACCOUNT_IMAGE_FIELDS.forEach(f => {
          if (editImageFiles[f]) fd2.append(f, editImageFiles[f]);
        });

        const res2 = await fetch(`${API_URL}/accounts/${selectedUser.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: fd2
        });
        const data2 = await res2.json();
        if (!data2.success) {
          showToaster('Chalan/account update failed: ' + (data2.message || 'Unknown error'), 'error');
          setSavingEdit(false);
          return;
        }
      }

      showToaster('Client details updated successfully!', 'success');
      Object.values(editImagePreviews).forEach(url => URL.revokeObjectURL(url));
      setIsEditingUser(false);
      setEditImageFiles({});
      setEditImagePreviews({});
      setShowDetailModal(false);
      setSelectedUser(null);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      showToaster('Network error. Please try again.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/accounts/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        if (data.success) {
          showToaster('Client deleted successfully!', 'success');
          fetchClients();
        } else {
          showToaster('Failed to delete client: ' + data.message, 'error');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        showToaster('Network error. Please try again.', 'error');
      }
    }
  };

  const getExportData = useCallback(() => {
    return filteredData.map(client => {
      const categoryInfo = getClientCategoryInfo(client);
      return {
        name: client.name || 'N/A',
        phone: client.phone || 'N/A',
        cnic: client.cnic || 'N/A',
        address: client.address || 'N/A',
        caseNo: client.caseNo || 'N/A',
        product: client.product || 'N/A',
        branch: getBranchName(client.branch),
        totalAmount: client.totalAmount || 0,
        paidAmount: client.paidAmount || 0,
        balance: client.balance || 0,
        monthlyInstallment: client.monthlyInstallment || 0,
        mirror: client.mirror || 0,
        remarks: client.remarks || '',
        installmentsPaid: client.installmentsPaid || 0,
        totalInstallments: client.totalInstallments || 0,
        nextDueDate: client.nextDueDate || 'N/A',
        joiningDate: client.joiningDate || 'N/A',
        lastPaymentDate: client.lastPaymentDate || 'N/A',
        status: categoryInfo.category.charAt(0).toUpperCase() + categoryInfo.category.slice(1),
        createdBy: client.creatorName || 'N/A',
        employee: client.employeeName || 'N/A'
      };
    });
  }, [filteredData, getClientCategoryInfo]);

  const exportColumns = useMemo(() => [
    { header: 'Name', key: 'name' },
    { header: 'Phone', key: 'phone' },
    { header: 'CNIC', key: 'cnic' },
    { header: 'Address', key: 'address' },
    { header: 'Case No', key: 'caseNo' },
    { header: 'Product', key: 'product' },
    { header: 'Branch', key: 'branch' },
    { header: 'Total Amount', key: 'totalAmount' },
    { header: 'Paid Amount', key: 'paidAmount' },
    { header: 'Balance', key: 'balance' },
    { header: 'Monthly Installment', key: 'monthlyInstallment' },
    { header: 'Mirror', key: 'mirror' },
    { header: 'Remarks', key: 'remarks' },
    { header: 'Installments Paid', key: 'installmentsPaid' },
    { header: 'Total Installments', key: 'totalInstallments' },
    { header: 'Next Due Date', key: 'nextDueDate' },
    { header: 'Joining Date', key: 'joiningDate' },
    { header: 'Last Payment', key: 'lastPaymentDate' },
    { header: 'Status', key: 'status' },
    { header: 'Created By', key: 'createdBy' },
    { header: 'Employee', key: 'employee' }
  ], []);

  const getClientDetailExportData = useCallback(() => {
    if (!selectedUser) return [];

    const remarks = selectedUser.remarks || '';
    const installments = selectedUser.installments && selectedUser.installments.length > 0
      ? selectedUser.installments
      : [null];

    return installments.map((p) => ({
      name: selectedUser.name || 'N/A',
      phone: selectedUser.phone || 'N/A',
      cnic: selectedUser.cnic || 'N/A',
      address: selectedUser.address || 'N/A',
      caseNo: selectedUser.caseNo || 'N/A',
      product: selectedUser.product || 'N/A',
      branch: getBranchName(selectedUser.branch),
      status: getCategoryLabel(selectedUser),
      totalAmount: selectedUser.totalAmount || 0,
      paidAmount: selectedUser.paidAmount || 0,
      balance: selectedUser.balance || 0,
      monthlyInstallment: selectedUser.monthlyInstallment || 0,
      installmentsPaid: selectedUser.installmentsPaid || 0,
      totalInstallments: selectedUser.totalInstallments || 0,
      nextDueDate: selectedUser.nextDueDate || 'N/A',
      joiningDate: selectedUser.joiningDate || 'N/A',
      lastPaymentDate: selectedUser.lastPaymentDate || 'N/A',
      remarks: remarks,
      createdBy: selectedUser.creatorName || 'N/A',
      employee: selectedUser.employeeName || selectedUser.employeeAccount?.employee?.name || 'N/A',
      month: p && p.month ? new Date(p.month + '-01T00:00:00').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '-',
      installmentDue: p ? formatCurrency(parseFloat(p.due_amount || 0)) : 0,
      installmentPaid: p ? formatCurrency(parseFloat(p.paid_amount || 0)) : 0,
      installmentBalance: p ? formatCurrency(parseFloat(p.balance || 0)) : 0,
    }));
  }, [selectedUser]);

  const clientDetailExportColumns = useMemo(() => [
    { header: 'Name', key: 'name' },
    { header: 'Phone', key: 'phone' },
    { header: 'CNIC', key: 'cnic' },
    { header: 'Address', key: 'address' },
    { header: 'Case No', key: 'caseNo' },
    { header: 'Product', key: 'product' },
    { header: 'Branch', key: 'branch' },
    { header: 'Status', key: 'status' },
    { header: 'Total Amount', key: 'totalAmount' },
    { header: 'Paid Amount', key: 'paidAmount' },
    { header: 'Balance', key: 'balance' },
    { header: 'Monthly Installment', key: 'monthlyInstallment' },
    { header: 'Installments Paid', key: 'installmentsPaid' },
    { header: 'Total Installments', key: 'totalInstallments' },
    { header: 'Next Due Date', key: 'nextDueDate' },
    { header: 'Joining Date', key: 'joiningDate' },
    { header: 'Last Payment', key: 'lastPaymentDate' },
    { header: 'Remarks', key: 'remarks' },
    { header: 'Created By', key: 'createdBy' },
    { header: 'Employee', key: 'employee' },
    { header: 'Installment Month', key: 'month' },
    { header: 'Installment Due', key: 'installmentDue' },
    { header: 'Installment Paid', key: 'installmentPaid' },
    { header: 'Installment Balance', key: 'installmentBalance' },
  ], []);

  // ✅ CHANGE: Active stat card add kiya
  const statCards = [
    { 
      label: 'Total Clients', 
      value: totalClients, 
      icon: UsersIcon, 
      color: '#1E1B4B', 
      bg: 'rgba(30,27,75,0.08)',
      className: 'total'
    },
    { 
      label: 'Active',  // ✅ NEW - Clear Account ke ilawa sab
      value: totalClients - totalClear,  // ✅ Clear account ko chhod kar baqi sab
      icon: UsersIcon, 
      color: '#2563eb', 
      bg: 'rgba(37,99,235,0.12)',
      className: 'active'
    },
    { 
      label: 'Clear Account', 
      value: totalClear, 
      icon: CheckCircle, 
      color: '#eab308', 
      bg: 'rgba(234,179,8,0.12)',
      className: 'clear'
    },
    { 
      label: 'Paid', 
      value: totalPaid, 
      icon: CheckCircle, 
      color: '#22c55e', 
      bg: 'rgba(34,197,94,0.12)',
      className: 'paid'
    },
    { 
      label: 'Unpaid', 
      value: totalUnpaid, 
      icon: Clock, 
      color: '#f59e0b', 
      bg: 'rgba(245,158,11,0.12)',
      className: 'unpaid'
    },
    { 
      label: 'Aging', 
      value: totalAging, 
      icon: Clock, 
      color: '#3b82f6', 
      bg: 'rgba(59,130,246,0.12)',
      className: 'aging'
    },
    { 
      label: 'Overdue', 
      value: totalOverdue, 
      icon: AlertTriangle, 
      color: '#ef4444', 
      bg: 'rgba(239,68,68,0.12)',
      className: 'overdue'
    },
    ...(isAdmin ? [{
      label: 'Total Balance', 
      value: `PKR ${formatCurrency(totalBalance)}`, 
      icon: DollarSign, 
      color: '#C9A84C', 
      bg: 'rgba(201,168,76,0.12)',
      className: 'balance'
    }] : []),
  ];

  const renderClientsTable = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="spinner"></div>
          <p style={{ fontWeight: 600 }}>Loading clients...</p>
        </div>
      );
    }

    const data = currentItems;
    return (
      <>
        <table className="users-table clients-table">
          <thead>
          <tr style={{ background: '#1E1B4B' }}>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>#</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Client</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Case #</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Product</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Total</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Paid</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Installment</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none'}}>Mirror</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none'}}>Remarks</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="12" className="no-data">
                  <div className="no-data-content">
                    <UsersIcon size={32} />
                    <p style={{ fontWeight: 600 }}>No clients found</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((client, index) => {
                const actualIndex = indexOfFirstItem + index + 1;
                return (
                  <tr key={client.id} className={getRowColorClass(client)}>
                    <td className="text-gray" style={{ fontWeight: 600 }}>{actualIndex}</td>
                    <td>
                      <div className="user-name-cell">
                        <div className="user-avatar" style={{ fontWeight: 700 }}>{client.name.charAt(0)}</div>
                        <div>
                          <span className="user-name" style={{ fontWeight: 700 }}>{client.name}</span>
                          <span className="client-branch" style={{ fontWeight: 500 }}>
                            <Building size={12} />
                            {getBranchName(client.branch)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="case-number" style={{ fontWeight: 700 }}>{client.caseNo}</td>
                    <td style={{ fontWeight: 500 }}>{client.product}</td>
                    <td className="amount" style={{ fontWeight: 600 }}>{formatCurrency(client.totalAmount)}</td>
                    <td className="paid-amount" style={{ fontWeight: 700 }}>{formatCurrency(client.paidAmount)}</td>
                    <td className={client.balance > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 700 }}>
                      {formatCurrency(client.balance)}
                    </td>
                    <td className="amount" style={{ fontWeight: 600 }}>{formatCurrency(client.monthlyInstallment)}</td>
                    <td className={client.mirror > 0 ? 'balance-amount' : 'paid-amount'} style={{ fontWeight: 700 }}>
                      {formatCurrency(client.mirror)}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#4b5563', maxWidth: '150px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={client.remarks || ''}>
                        {client.remarks || '-'}
                      </span>
                    </td>
                    <td>
                      {getCategoryBadge(client)}
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="btn-view"
                          onClick={() => viewDetail(client)}
                          title="View Details"
                          style={{ fontWeight: 700 }}
                        >
                          <Eye size={15} />
                        </button>
                        {isAdmin && (
                          <button className="btn-delete" onClick={() => deleteUser(client.id)} title="Delete Client" style={{ fontWeight: 700 }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            className="btn-edit"
                            onClick={() => openEditPaymentModal(client)}
                            title="Edit Payment"
                            style={{ fontWeight: 700 }}
                          >
                            <Edit size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="users-pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="users-container">
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="users-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Account Holders</h2>
            <span className="live-badge">
              <UsersIcon size={12} /> Live
            </span>
          </div>
          <p className="subtitle" style={{ fontWeight: 600 }}>Manage all customers with accounts</p>
        </div>
        <div className="header-actions">
          <ExportButton
            data={getExportData()}
            columns={exportColumns}
            filename="account-holders-report"
            title="Account Holders Report"
          />
        </div>
      </div>

      <div className="users-stats-grid clients-stats">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`users-stat-card ${card.className}`}
            style={{ 
              borderTop: `4px solid ${card.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div className="users-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="users-stat-info">
              <span className="users-stat-label" style={{ fontWeight: 700 }}>{card.label}</span>
              <span className="users-stat-value" style={{ fontWeight: 800, color: card.color }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="users-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, CNIC or case no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontWeight: 500 }}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ fontWeight: 500 }}>
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="clear">Clear Account</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="aging">Aging</option>
            <option value="overdue">Overdue</option>
          </select>
          <select className="filter-select date-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ fontWeight: 500 }}>
            <option value="all">All Time</option>
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
        </div>
      </div>

      <div className="users-table-wrap">
        <div className="table-header-bar">
          <div className="table-header-left">
            <span style={{ fontWeight: 700 }}>All Clients</span>
            <span className="record-count" style={{ fontWeight: 600 }}>{filteredData.length} records</span>
          </div>
        </div>
        <div className="table-scroll">
          {renderClientsTable()}
        </div>
      </div>

      {showDetailModal && selectedUser && (
        <div className="users-modal-overlay" onClick={closeDetailModal}>
          <div className="users-modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <div className="users-modal-header-left">
                <User size={20} className="users-modal-icon" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Client Details</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {canEdit && !isEditingUser && (
                  <button
                    className="users-btn-cancel"
                    onClick={startEdit}
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit size={16} /> Edit
                  </button>
                )}
                <ExportButton
                  data={getClientDetailExportData()}
                  columns={clientDetailExportColumns}
                  filename={`client-${selectedUser.caseNo}-details`}
                  title={`Client Details - ${selectedUser.name} (${selectedUser.caseNo})`}
                />
                <button className="users-modal-close" onClick={closeDetailModal}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="users-modal-body">
              <div className="user-detail-header">
                <div className="user-detail-avatar" style={{ fontWeight: 800 }}>{selectedUser.name.charAt(0)}</div>
                <div className="user-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedUser.name}</h4>
                  <div className="detail-badges">
                    {getCategoryBadge(selectedUser)}
                    <span className="user-detail-branch" style={{ fontWeight: 500 }}>
                      <Building size={14} />
                      {getBranchName(selectedUser.branch)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h5 style={{ fontWeight: 700 }}>Personal Information</h5>
                {isEditingUser && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#374151' }}>Name</span>
                    <input
                      type="text"
                      value={editUserData.name}
                      onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, marginTop: '4px' }}
                    />
                  </div>
                )}
                <div className="user-detail-grid two-col">
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Phone</span>
                    {isEditingUser ? (
                      <input
                        type="text"
                        value={editUserData.phone}
                        onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600 }}
                      />
                    ) : (
                      <strong style={{ fontWeight: 600 }}>{selectedUser.phone}</strong>
                    )}
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>CNIC</span>
                    {isEditingUser ? (
                      <input
                        type="text"
                        value={editUserData.cnic}
                        onChange={(e) => setEditUserData({ ...editUserData, cnic: e.target.value })}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600 }}
                      />
                    ) : (
                      <strong style={{ fontWeight: 600 }}>{selectedUser.cnic}</strong>
                    )}
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Case No</span>
                    <strong style={{ fontWeight: 700 }}>{selectedUser.caseNo}</strong>
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Product</span>
                    {isEditingUser ? (
                      <input
                        type="text"
                        value={editUserData.product_name}
                        onChange={(e) => setEditUserData({ ...editUserData, product_name: e.target.value })}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600 }}
                      />
                    ) : (
                      <strong style={{ fontWeight: 600 }}>{selectedUser.product}</strong>
                    )}
                  </div>
                  <div className="user-detail-item">
                    <span style={{ fontWeight: 700 }}>Address</span>
                    {isEditingUser ? (
                      <input
                        type="text"
                        value={editUserData.address}
                        onChange={(e) => setEditUserData({ ...editUserData, address: e.target.value })}
                        style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600 }}
                      />
                    ) : (
                      <strong style={{ fontWeight: 600 }}>{selectedUser.address}</strong>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h5 style={{ fontWeight: 700 }}>Account Summary</h5>
                <div className="account-summary-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '12px'
                }}>
                  <div className="summary-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Total Amount</span>
                    <strong style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B', display: 'block' }}>
                      {formatCurrency(selectedUser.totalAmount)}
                    </strong>
                  </div>
                  <div className="summary-item success" style={{ background: '#dcfce7', padding: '12px', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#166534' }}>Paid Amount</span>
                    <strong style={{ fontWeight: 700, fontSize: '15px', color: '#065f46', display: 'block' }}>
                      {formatCurrency(selectedUser.paidAmount)}
                    </strong>
                  </div>
                  <div className="summary-item warning" style={{ background: '#fef3c7', padding: '12px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#92400e' }}>Balance</span>
                    <strong style={{ fontWeight: 700, fontSize: '15px', color: '#92400e', display: 'block' }}>
                      {formatCurrency(selectedUser.balance)}
                    </strong>
                  </div>
                  <div className="summary-item" style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#92400e' }}>Advance Amount</span>
                    <strong style={{ fontWeight: 700, fontSize: '15px', color: '#92400e', display: 'block' }}>
                      {formatCurrency(selectedUser.advanceAmount || 0)}
                    </strong>
                  </div>
                  <div className="summary-item info" style={{ background: '#dbeafe', padding: '12px', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#1e40af' }}>Monthly Installment</span>
                    <strong style={{ fontWeight: 700, fontSize: '15px', color: '#1e40af', display: 'block' }}>
                      {formatCurrency(selectedUser.monthlyInstallment)}
                    </strong>
                  </div>
                  <div className="summary-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Installments</span>
                    <strong style={{ fontWeight: 700, fontSize: '15px', color: '#1E1B4B', display: 'block' }}>
                      {selectedUser.installmentsPaid} / {selectedUser.totalInstallments}
                    </strong>
                  </div>
                  <div className="summary-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Next Due Date</span>
                    <strong style={{ fontWeight: 600, fontSize: '14px', color: '#4b5563', display: 'block' }}>
                      {selectedUser.primaryInstallmentDueDate 
                        ? parseLocalDate(selectedUser.primaryInstallmentDueDate).toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : selectedUser.nextDueDate || 'N/A'}
                    </strong>
                  </div>
                  <div className="summary-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Joining Date</span>
                    <strong style={{ fontWeight: 600, fontSize: '14px', color: '#4b5563', display: 'block' }}>
                      {selectedUser.joiningDate}
                    </strong>
                  </div>
                  <div className="summary-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Last Payment</span>
                    <strong style={{ fontWeight: 600, fontSize: '14px', color: '#4b5563', display: 'block' }}>
                      {selectedUser.lastPaymentDate}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h5 style={{ fontWeight: 700 }}>Account Management</h5>
                <div className="user-detail-grid two-col">
                  <div className="user-detail-item" style={{ background: '#e0e7ff', borderColor: '#818cf8' }}>
                    <span style={{ fontWeight: 700 }}>Account Created By</span>
                    <strong style={{ fontWeight: 600, color: '#3730a3' }}>
                      {selectedUser.creatorName || 'N/A'}
                      {selectedUser.creatorRole && (
                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px', fontWeight: '400' }}>
                          ({selectedUser.creatorRole})
                        </span>
                      )}
                    </strong>
                  </div>
                  <div className="user-detail-item" style={{ background: '#dcfce7', borderColor: '#86efac' }}>
                    <span style={{ fontWeight: 700 }}>Employee Who Opened</span>
                    <strong style={{ fontWeight: 600, color: '#166534' }}>
                      {selectedUser.employeeName || selectedUser.employeeAccount?.employee?.name || 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="detail-section" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px', marginTop: '10px' }}>
                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={20} style={{ color: '#374151' }} />
                  <h5 style={{ fontWeight: 700, fontSize: '15px', margin: 0, color: '#1f2937' }}>Original Form Documents</h5>
                  {isEditingUser && (
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                      (Click "Change" on any image to replace it)
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Customer CNIC
                  </h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {isEditingUser ? (
                      <>
                        <EditableDocImage
                          label="CNIC Front"
                          src={getFileUrl(selectedUser.cnic_front)}
                          fieldName="cnic_front"
                          isEditing={isEditingUser}
                          previewUrl={editImagePreviews.cnic_front}
                          onFileSelect={handleEditImageChange}
                        />
                        <EditableDocImage
                          label="CNIC Back"
                          src={getFileUrl(selectedUser.cnic_back)}
                          fieldName="cnic_back"
                          isEditing={isEditingUser}
                          previewUrl={editImagePreviews.cnic_back}
                          onFileSelect={handleEditImageChange}
                        />
                      </>
                    ) : (
                      <>
                        {selectedUser.cnic_front && (
                          <DocImage label="CNIC Front" src={getFileUrl(selectedUser.cnic_front)} />
                        )}
                        {selectedUser.cnic_back && (
                          <DocImage label="CNIC Back" src={getFileUrl(selectedUser.cnic_back)} />
                        )}
                        {!selectedUser.cnic_front && !selectedUser.cnic_back && (
                          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No customer CNIC images found</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Form
                  </h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {isEditingUser ? (
                      <>
                        <EditableDocImage
                          label="Additional Image 1"
                          src={getFileUrl(selectedUser.additional_image_1)}
                          fieldName="additional_image_1"
                          isEditing={isEditingUser}
                          previewUrl={editImagePreviews.additional_image_1}
                          onFileSelect={handleEditImageChange}
                        />
                        <EditableDocImage
                          label="Additional Image 2"
                          src={getFileUrl(selectedUser.additional_image_2)}
                          fieldName="additional_image_2"
                          isEditing={isEditingUser}
                          previewUrl={editImagePreviews.additional_image_2}
                          onFileSelect={handleEditImageChange}
                        />
                      </>
                    ) : (
                      <>
                        {selectedUser.additional_image_1 && (
                          <DocImage label="Additional Image 1" src={getFileUrl(selectedUser.additional_image_1)} />
                        )}
                        {selectedUser.additional_image_2 && (
                          <DocImage label="Additional Image 2" src={getFileUrl(selectedUser.additional_image_2)} />
                        )}
                        {!selectedUser.additional_image_1 && !selectedUser.additional_image_2 && (
                          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No additional documents found</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Chalan
                  </h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {isEditingUser ? (
                      <>
                        <EditableDocImage
                          label="Chalan Front"
                          src={getFileUrl(selectedUser.chalan_front)}
                          fieldName="chalan_front"
                          isEditing={isEditingUser}
                          previewUrl={editImagePreviews.chalan_front}
                          onFileSelect={handleEditImageChange}
                        />
                        <EditableDocImage
                          label="Chalan Back"
                          src={getFileUrl(selectedUser.chalan_back)}
                          fieldName="chalan_back"
                          isEditing={isEditingUser}
                          previewUrl={editImagePreviews.chalan_back}
                          onFileSelect={handleEditImageChange}
                        />
                      </>
                    ) : (
                      <>
                        {selectedUser.chalan_front && (
                          <DocImage label="Chalan Front" src={getFileUrl(selectedUser.chalan_front)} />
                        )}
                        {selectedUser.chalan_back && (
                          <DocImage label="Chalan Back" src={getFileUrl(selectedUser.chalan_back)} />
                        )}
                        {!selectedUser.chalan_front && !selectedUser.chalan_back && (
                          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No chalan images found</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Bill
                  </h6>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {isEditingUser ? (
                      <>
                        <EditableDocImage
                          label="Bill Image 1"
                          src={getFileUrl(selectedUser.bill_image_1)}
                          fieldName="bill_image_1"
                          isEditing={isEditingUser}
                          previewUrl={editImagePreviews.bill_image_1}
                          onFileSelect={handleEditImageChange}
                        />
                        <EditableDocImage
                          label="Bill Image 2"
                          src={getFileUrl(selectedUser.bill_image_2)}
                          fieldName="bill_image_2"
                          isEditing={isEditingUser}
                          previewUrl={editImagePreviews.bill_image_2}
                          onFileSelect={handleEditImageChange}
                        />
                      </>
                    ) : (
                      <>
                        {selectedUser.bill_image_1 && (
                          <DocImage label="Bill Image 1" src={getFileUrl(selectedUser.bill_image_1)} />
                        )}
                        {selectedUser.bill_image_2 && (
                          <DocImage label="Bill Image 2" src={getFileUrl(selectedUser.bill_image_2)} />
                        )}
                        {!selectedUser.bill_image_1 && !selectedUser.bill_image_2 && (
                          <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No bill images found</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {(selectedUser.voice_consent || isEditingUser) && (
                  <div style={{ marginBottom: '20px' }}>
                    <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                      Voice Consent (Raza Mandi)
                    </h6>
                    {isEditingUser ? (
                      <div>
                        {editImageFiles.voice_consent ? (
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#166534', marginBottom: '8px' }}>
                            New file selected: {editImageFiles.voice_consent.name}
                          </p>
                        ) : selectedUser.voice_consent ? (
                          <audio controls preload="none" style={{ width: '100%', marginBottom: '8px' }}>
                            <source src={getFileUrl(selectedUser.voice_consent)} />
                          </audio>
                        ) : (
                          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>No voice consent uploaded</p>
                        )}
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => e.target.files?.[0] && handleEditImageChange('voice_consent', e.target.files[0])}
                          style={{ fontSize: '13px' }}
                        />
                      </div>
                    ) : (
                      <audio controls preload="none" style={{ width: '100%' }}>
                        <source src={getFileUrl(selectedUser.voice_consent)} />
                        Your browser does not support audio playback.
                      </audio>
                    )}
                  </div>
                )}

                <div>
                  <h6 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Guarantors' CNIC Images
                  </h6>
                  {guarantorsLoading ? (
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Loading guarantors...</p>
                  ) : selectedUser.guarantors && selectedUser.guarantors.length > 0 ? (
                    selectedUser.guarantors.map((g, idx) => (
                      <div key={idx} style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '13px' }}>
                          {g.name || g.guarantor_name || 'N/A'} — {g.cnic || g.guarantor_cnic || 'N/A'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                          {g.cnic_front && <DocImage label="CNIC Front" src={getFileUrl(g.cnic_front)} />}
                          {g.cnic_back && <DocImage label="CNIC Back" src={getFileUrl(g.cnic_back)} />}
                          {!g.cnic_front && !g.cnic_back && (
                            <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No CNIC images for this guarantor</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No guarantor documents found</p>
                  )}
                </div>
              </div>

              {selectedUser.installments && selectedUser.installments.length > 0 && (
                <div className="detail-section">
                  <h5 style={{ fontWeight: 700 }}>Payment History</h5>
                  <div className="history-table-container">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th style={{ fontWeight: 700 }}>#</th>
                          <th style={{ fontWeight: 700 }}>Month</th>
                          <th style={{ fontWeight: 700 }}>Due Amount</th>
                          <th style={{ fontWeight: 700 }}>Slip No</th>
                          <th style={{ fontWeight: 700 }}>Paid</th>
                          <th style={{ fontWeight: 700 }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.installments.slice(0, 10).map((p, idx) => (
                          <tr key={p.id} className={p.balance <= 0 ? 'history-paid' : ''}>
                            <td>{idx + 1}</td>
                            <td>{p.month ? new Date(p.month + '-01T00:00:00').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' }) : '-'}</td>
                            <td>{formatCurrency(p.due_amount)}</td>
                            <td>{p.slip_no || '-'}</td>
                            <td>{formatCurrency(p.paid_amount)}</td>
                            <td>{formatCurrency(p.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!isEditingUser && (
                <div className="detail-section" style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
                  {canEdit ? (
                    <>
                      <h5 style={{ fontWeight: 700, marginBottom: '12px' }}>
                        Pay Installment
                        {selectedUser.primaryInstallmentDueDate 
                          ? ` — ${parseLocalDate(selectedUser.primaryInstallmentDueDate).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}`
                          : selectedUser.primaryInstallmentMonth ? ` — ${formatMonth(selectedUser.primaryInstallmentMonth)}` : ''}
                      </h5>
                      <div style={{ marginBottom: '16px' }}>
                        <input
                          type="number"
                          value={editingData.paidAmount}
                          onChange={(e) => setEditingData({ ...editingData, paidAmount: e.target.value })}
                          min="0"
                          max={editingData.maxPayable}
                          placeholder="Enter amount to pay (leave empty to just save remarks)..."
                          disabled={!editingData.installmentId}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}
                        />
                        <small style={{ display: 'block', marginTop: '6px', color: '#6b7280', fontWeight: 600 }}>
                          {editingData.installmentId
                            ? `Max payable: PKR ${editingData.maxPayable.toLocaleString()} — amount is optional if you're only adding remarks`
                            : 'No installment record found for this account'}
                        </small>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Slip No</label>
                        <input
                          type="text"
                          value={editingData.slipNo}
                          onChange={(e) => setEditingData({ ...editingData, slipNo: e.target.value })}
                          placeholder="Enter unique slip number..."
                          disabled={!editingData.installmentId}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontWeight: 600,
                            fontSize: '14px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontWeight: 700, display: 'block', marginBottom: '8px' }}>Remarks</label>
                        <textarea
                          value={editingData.remarks}
                          onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                          placeholder="Add remarks or notes..."
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontWeight: 500,
                            fontSize: '14px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="user-detail-item">
                      <span style={{ fontWeight: 700 }}>Remarks</span>
                      <strong style={{ fontWeight: 600 }}>{selectedUser.remarks || 'No remarks'}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="users-modal-footer">
              {isEditingUser ? (
                <>
                  <button className="users-btn-cancel" onClick={cancelEdit} style={{ fontWeight: 700 }} disabled={savingEdit}>
                    Cancel Edit
                  </button>
                  <button
                    className="users-btn-save"
                    onClick={handleSaveUserEdit}
                    disabled={savingEdit}
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {savingEdit ? (
                      <>
                        <RefreshCw size={16} className="spinning" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Details
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button className="users-btn-cancel" onClick={closeDetailModal} style={{ fontWeight: 700 }}>
                    {canEdit ? 'Cancel' : 'Close'}
                  </button>
                  {canEdit && (
                    <button
                      className="users-btn-save"
                      onClick={handleSaveEdit}
                      style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                      disabled={saving || !editingData.installmentId}
                    >
                      {saving ? (
                        <>
                          <RefreshCw size={16} className="spinning" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
        formatMonth={formatMonth}
      />

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UsersManagement;