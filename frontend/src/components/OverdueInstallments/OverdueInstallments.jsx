// src/components/OverdueInstallments/OverdueInstallments.jsx

import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Save, X, DollarSign, Calendar, User, Building, AlertTriangle, AlertCircle, CheckCircle, Clock, RefreshCw, FileText, Users } from 'lucide-react';
import './OverdueInstallments.css';
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
      />
    </a>
    <p style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', padding: '6px', margin: 0, color: '#374151' }}>
      {label}
    </p>
  </div>
);

// ============================================
// ✅ ROUND OFF FUNCTION
// ============================================
const roundToTwo = (num) => {
  if (isNaN(num) || num === 0) return 0;
  return Math.round(num * 100) / 100;
};

// ============================================
// ✅ date-only string ko LOCAL time se parse karo (UTC se nahi)
// ============================================
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00');
};

const OverdueInstallments = () => {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [editingData, setEditingData] = useState({
    installmentId: null,
    paidAmount: '',
    slipNo: '',
    remarks: '',
    maxPayable: 0,
  });
  const [saving, setSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [overdueAccounts, setOverdueAccounts] = useState([]);

  // ============================================
  // ✅ TOASTER STATE
  // ============================================
  const [toaster, setToaster] = useState({ message: '', type: 'info', show: false });

  const showToaster = (message, type = 'info') => {
    setToaster({ message, type, show: true });
  };

  const hideToaster = () => {
    setToaster({ message: '', type: 'info', show: false });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    let branch = null;
    let role = null;

    if (user) {
      role = user.role;
      branch = user.branch;
      setUserRole(role);
      setUserBranch(branch);
    }

    fetchOverdueAccounts(branch, role);
  }, []);

  // ============================================
  // ✅ FIXED: fetchOverdueAccounts
  // ============================================
  const fetchOverdueAccounts = async (branch, role) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      let url = `${API_URL}/installments?status=all`;

      if (branch && role !== 'admin') {
        url += `&branch_id=${branch}`;
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

        const grouped = new Map();
        installmentsData.forEach(inst => {
          const accId = inst.account_id || inst.account?.id;
          if (!accId) return;
          if (!grouped.has(accId)) grouped.set(accId, []);
          grouped.get(accId).push(inst);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueList = [];

        for (const [accId, list] of grouped) {
          const sample = list[0];
          const account = sample.account || {};

          const sortedInstallments = [...list].sort((a, b) => (a.month || '').localeCompare(b.month || ''));

          const overdueUnpaid = sortedInstallments
            .filter(i =>
              parseFloat(i.balance || 0) > 0 &&
              i.due_date &&
              parseLocalDate(i.due_date) <= today
            )
            .sort((a, b) => parseLocalDate(a.due_date) - parseLocalDate(b.due_date));

          if (overdueUnpaid.length === 0) continue;

          const customer = account.customer || {};

          let guarantors = [];

          if (customer.guarantors && Array.isArray(customer.guarantors)) {
            guarantors = customer.guarantors;
          }
          else if (account.guarantors && Array.isArray(account.guarantors)) {
            guarantors = account.guarantors;
          }
          else if (sample.guarantors && Array.isArray(sample.guarantors)) {
            guarantors = sample.guarantors;
          }
          else if (customer.guarantor && Array.isArray(customer.guarantor)) {
            guarantors = customer.guarantor;
          }
          else if (account.guarantor && Array.isArray(account.guarantor)) {
            guarantors = account.guarantor;
          }

          if (guarantors.length === 0 && accId) {
            try {
              const detailResponse = await fetch(`${API_URL}/installments/account-details/${accId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
              const detailData = await detailResponse.json();
              if (detailData.success && detailData.data) {
                const accDetail = detailData.data;
                const cust = accDetail.customer || {};
                if (cust.guarantors && Array.isArray(cust.guarantors)) {
                  guarantors = cust.guarantors;
                } else if (accDetail.guarantors && Array.isArray(accDetail.guarantors)) {
                  guarantors = accDetail.guarantors;
                }
              }
            } catch (err) {
              console.error('Error fetching account details for guarantors:', err);
            }
          }

          overdueUnpaid.forEach(inst => {
            const overdueDays = Math.floor((today - parseLocalDate(inst.due_date)) / (1000 * 60 * 60 * 24));
            const instOverdueMonths = Math.floor(overdueDays / 30) + 1;

            if (overdueDays > 90) return;

            overdueList.push({
              accountId: accId,
              installmentId: inst.id,
              rowKey: `${accId}-${inst.id}`,

              caseNo: account.case_no || 'N/A',
              customerName: customer.name || 'N/A',
              customerCnic: customer.cnic || 'N/A',
              branch: account.branch_id,

              nextDueMonth: inst.month || null,

              monthlyInstallment: parseFloat(account.monthly_installment || 0),
              paidAmount: parseFloat(account.paid_amount || 0),
              balance: parseFloat(account.balance || 0),
              advanceAmount: parseFloat(account.advance_amount || 0),

              totalOverdue: parseFloat(inst.balance || 0),

              overdueMonths: instOverdueMonths,
              nextPayableInstallment: inst,
              installments: sortedInstallments,

              remarks: inst.remarks || '',

              customer: customer,
              account: account,
              guarantors: guarantors,
            });
          });
        }

        overdueList.sort((a, b) => b.totalOverdue - a.totalOverdue);
        setOverdueAccounts(overdueList);
      }
    } catch (error) {
      console.error('Error fetching overdue accounts:', error);
      setOverdueAccounts([]);
      showToaster('Failed to load aging accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = userRole === 'admin' || userRole === 'manager';

  const filtered = overdueAccounts.filter(item => {
    const searchMatch = item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.caseNo.toLowerCase().includes(search.toLowerCase());

    let monthMatch = true;
    if (monthFilter !== 'all') {
      monthMatch = item.overdueMonths === parseInt(monthFilter);
    }

    return searchMatch && monthMatch;
  });

  const uniqueAccountBalanceMap = new Map();
  filtered.forEach(item => {
    if (!uniqueAccountBalanceMap.has(item.accountId)) {
      uniqueAccountBalanceMap.set(item.accountId, item.balance);
    }
  });
  const totalBalance = Array.from(uniqueAccountBalanceMap.values()).reduce((sum, b) => sum + b, 0);
  const totalOverdueSum = filtered.reduce((sum, item) => sum + item.totalOverdue, 0);
  const totalAccounts = filtered.length;

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const formatMonth = (month) => {
    if (!month) return '-';
    return new Date(month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getAgingLabel = (months) => {
    if (!months || months <= 0) return 'Aging';
    return months === 1 ? 'Aging - 1 Month' : `Aging - ${months} Months`;
  };

  const getInstallmentRowStatus = (inst) => {
    const paid = parseFloat(inst.paid_amount || 0);
    const balance = parseFloat(inst.balance || 0);
    if (paid > 0 && balance <= 0) return 'paid';
    if (paid > 0 && balance > 0) return 'partial';
    return 'unpaid';
  };

  // ============================================
  // ✅ 3 STATS CARDS
  // ============================================
  const statCards = [
    {
      label: 'Total Accounts',
      value: totalAccounts,
      icon: Users,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'oi-accounts-card'
    },
    {
      label: 'Total Aging',
      value: `PKR ${totalOverdueSum.toLocaleString()}`,
      icon: Clock,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'oi-overdue-card'
    },
    {
      label: 'Total Balance',
      value: `PKR ${totalBalance.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'oi-balance-card'
    },
  ];

  const openEditModal = (record) => {
    setSelectedRecord(record);
    const nextInst = record.nextPayableInstallment;
    setEditingData({
      installmentId: nextInst?.id || null,
      paidAmount: '',
      slipNo: '',
      remarks: record.remarks || '',
      maxPayable: nextInst ? parseFloat(nextInst.balance || 0) : 0,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!canEdit) return;

    if (!editingData.installmentId) {
      showToaster('No payable installment found for this account.', 'warning');
      return;
    }

    const amount = parseFloat(editingData.paidAmount) || 0;
    const hasRemarks = (editingData.remarks || '').trim().length > 0;

    if (amount <= 0 && !hasRemarks) {
      showToaster('Please enter a payment amount or add remarks', 'warning');
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
        setShowEditModal(false);
        setSelectedRecord(null);
        const user = JSON.parse(localStorage.getItem('user'));
        fetchOverdueAccounts(user?.branch || null, user?.role || null);
      } else {
        showToaster('Failed to save: ' + (data.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      showToaster('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportData = filtered.map(item => ({
    customerName: item.customerName,
    caseNo: item.caseNo,
    customerCnic: item.customerCnic,
    openingDate: formatDate(item.account?.created_at),
    monthlyInstallment: item.monthlyInstallment,
    balance: item.balance,
    totalAging: item.totalOverdue,
    status: getAgingLabel(item.overdueMonths),
    remarks: item.remarks || ''
  }));

  const exportColumns = [
    { header: 'Customer', key: 'customerName' },
    { header: 'Case No', key: 'caseNo' },
    { header: 'CNIC', key: 'customerCnic' },
    { header: 'Opening Date', key: 'openingDate' },
    { header: 'Monthly', key: 'monthlyInstallment' },
    { header: 'Balance', key: 'balance' },
    { header: 'Total Aging', key: 'totalAging' },
    { header: 'Status', key: 'status' },
    { header: 'Remarks', key: 'remarks' },
  ];

  return (
    <div className="oi-container">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="oi-header">
        <div className="oi-header-left">
          <div className="oi-header-title-group">
            <h2>Aging Accounts</h2>
            <span className="oi-live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="oi-subtitle">
            Installments that are individually 1-3 months aging
            {userBranch && <span style={{ fontWeight: 600, marginLeft: '8px', color: '#4b5563' }}>• Branch {userBranch}</span>}
          </p>
        </div>
        <ExportButton
          data={exportData}
          columns={exportColumns}
          filename="aging-accounts"
          title="Aging Accounts Report"
        />
      </div>

      {/* ============================================ */}
      {/* ✅ 3 STATS CARDS */}
      {/* ============================================ */}
      <div className="oi-stats-grid-3">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className={`oi-stat-card ${card.className}`}
            style={{ 
              borderLeft: `5px solid ${card.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div className="oi-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="oi-stat-info">
              <span className="oi-stat-label" style={{ fontWeight: 700 }}>{card.label}</span>
              <span className="oi-stat-value" style={{ fontWeight: 800, color: card.color, fontSize: '1.3rem' }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="oi-controls">
        <div className="oi-search-wrapper">
          <Search size={18} className="oi-search-icon" />
          <input
            type="text"
            placeholder="Search by customer or case..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontWeight: 500 }}
          />
        </div>

        <div className="oi-branch-filters">
          <button
            className={`oi-filter-btn ${monthFilter === 'all' ? 'active' : ''}`}
            onClick={() => setMonthFilter('all')}
            style={{ fontWeight: 600 }}
          >
            All Aging
          </button>
          <button
            className={`oi-filter-btn ${monthFilter === '1' ? 'active' : ''}`}
            onClick={() => setMonthFilter('1')}
            style={{ fontWeight: 600 }}
          >
            1 Month
          </button>
          <button
            className={`oi-filter-btn ${monthFilter === '2' ? 'active' : ''}`}
            onClick={() => setMonthFilter('2')}
            style={{ fontWeight: 600 }}
          >
            2 Months
          </button>
          <button
            className={`oi-filter-btn ${monthFilter === '3' ? 'active' : ''}`}
            onClick={() => setMonthFilter('3')}
            style={{ fontWeight: 600 }}
          >
            3 Months
          </button>
        </div>
      </div>

      <div className="oi-table-container">
        <div className="oi-table-scroll">
          <table className="oi-table">
            <thead>
              <tr style={{ background: '#1E1B4B' }}>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>ID</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Customer</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Case #</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Opening Date</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Installments</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Aging</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance (PKR)</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remarks</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="oi-no-data">Loading aging accounts...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" className="oi-no-data">No aging records found for {branchLabel}</td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr key={item.rowKey} className={`oi-row ${index % 2 === 0 ? 'oi-even-row' : 'oi-odd-row'}`}>
                    <td className="oi-serial">{index + 1}</td>
                    <td>
                      <div className="oi-customer-info">
                        <div className="oi-customer-avatar" style={{ 
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          {item.customerName.charAt(0)}
                        </div>
                        {item.customerName}
                      </div>
                    </td>
                    <td className="oi-case-number">{item.caseNo}</td>
                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                      {formatDate(item.account?.created_at)}
                    </td>
                    <td className="oi-amount" style={{ fontWeight: 600 }}>PKR {item.monthlyInstallment.toLocaleString()}</td>
                    <td className="oi-overdue-amount" style={{ fontWeight: 700, color: '#dc2626' }}>
                      PKR {item.totalOverdue.toLocaleString()}
                    </td>
                    <td className={item.balance > 0 ? 'oi-balance-amount' : 'oi-paid-amount'} style={{ fontWeight: 700 }}>
                      PKR {item.balance.toLocaleString()}
                    </td>
                    <td className="oi-remarks-cell" style={{ fontSize: '0.85rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.remarks || ''}>
                      {item.remarks || '-'}
                    </td>
                    <td>
                      <span className="oi-status-badge oi-overdue-badge" style={{ fontWeight: 700 }}>
                        {getAgingLabel(item.overdueMonths)}
                      </span>
                    </td>
                    <td>
                      <div className="oi-action-group">
                        <button 
                          className={`oi-btn-action ${canEdit ? 'oi-btn-edit' : 'oi-btn-view'}`}
                          onClick={() => openEditModal(item)}
                          title={canEdit ? "Edit Record" : "View Record"}
                          style={{ fontWeight: 700 }}
                        >
                          {canEdit ? <Edit size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="oi-pagination">
          <button style={{ fontWeight: 600 }} disabled>Previous</button>
          <span style={{ fontWeight: 600 }}>Page 1 of 1</span>
          <button style={{ fontWeight: 600 }} disabled>Next</button>
        </div>
      )}

      {showEditModal && selectedRecord && (
        <div className="oi-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="oi-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="oi-modal-header">
              <div className="oi-modal-header-left">
                {canEdit ? <Edit size={20} className="oi-modal-icon" /> : <Eye size={20} className="oi-modal-icon" />}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{canEdit ? 'Edit' : 'View'} Record - {selectedRecord.caseNo}</h3>
              </div>
              <button className="oi-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="oi-modal-body">
              <div className="oi-employee-detail-header">
                <div className="oi-emp-detail-avatar" style={{ background: '#991b1b', fontSize: '1.1rem', fontWeight: 800 }}>
                  {selectedRecord.customerName.charAt(0)}
                </div>
                <div className="oi-emp-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedRecord.customerName}</h4>
                  <span className="oi-emp-detail-branch" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Case: {selectedRecord.caseNo}</span>
                </div>
              </div>

              {/* ============================================ */}
              {/* ✅ ACCOUNT SUMMARY WITH ADVANCE AMOUNT */}
              {/* ============================================ */}
              <div className="oi-detail-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div className="oi-detail-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Case Number</span>
                  <strong className="oi-case-number" style={{ fontWeight: 700, display: 'block' }}>{selectedRecord.caseNo}</strong>
                </div>
                <div className="oi-detail-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Customer</span>
                  <strong style={{ fontWeight: 700, display: 'block' }}>{selectedRecord.customerName}</strong>
                </div>
                <div className="oi-detail-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>CNIC</span>
                  <strong style={{ fontWeight: 700, display: 'block' }}>{selectedRecord.customerCnic || 'N/A'}</strong>
                </div>
                <div className="oi-detail-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Next Due Month</span>
                  <strong style={{ fontWeight: 600, display: 'block' }}>{formatMonth(selectedRecord.nextDueMonth)}</strong>
                </div>
                <div className="oi-detail-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Monthly Installment</span>
                  <strong style={{ fontWeight: 700, display: 'block' }}>PKR {selectedRecord.monthlyInstallment.toLocaleString()}</strong>
                </div>
                <div className="oi-detail-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Total Aging</span>
                  <strong className="oi-overdue-amount" style={{ fontWeight: 800, color: '#dc2626', display: 'block' }}>
                    PKR {selectedRecord.totalOverdue.toLocaleString()}
                  </strong>
                </div>
                <div className="oi-detail-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Aging Since</span>
                  <strong style={{ fontWeight: 700, color: '#dc2626', display: 'block' }}>
                    {getAgingLabel(selectedRecord.overdueMonths)}
                  </strong>
                </div>
                <div className="oi-detail-item" style={{ background: '#f8f9fc', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#6b7280' }}>Account Opening</span>
                  <strong style={{ fontWeight: 600, display: 'block' }}>
                    {formatDate(selectedRecord.account?.created_at)}
                  </strong>
                </div>
                <div className="oi-detail-item" style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#92400e' }}>Advance Amount</span>
                  <strong style={{ fontWeight: 700, color: '#92400e', display: 'block' }}>
                    PKR {(selectedRecord.advanceAmount || 0).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Documents Section */}
              <div className="oi-documents-section" style={{ marginTop: '20px', borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
                <div className="oi-section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={20} style={{ color: '#374151' }} />
                  <h4 style={{ fontWeight: 700, fontSize: '16px', margin: 0, color: '#1f2937' }}>Original Form Documents</h4>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Customer CNIC
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedRecord.customer?.cnic_front && (
                      <DocImage label="CNIC Front" src={getFileUrl(selectedRecord.customer.cnic_front)} />
                    )}
                    {selectedRecord.customer?.cnic_back && (
                      <DocImage label="CNIC Back" src={getFileUrl(selectedRecord.customer.cnic_back)} />
                    )}
                    {!selectedRecord.customer?.cnic_front && !selectedRecord.customer?.cnic_back && (
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No customer CNIC images found</p>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Form
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedRecord.customer?.additional_image_1 && (
                      <DocImage label="Additional Image 1" src={getFileUrl(selectedRecord.customer.additional_image_1)} />
                    )}
                    {selectedRecord.customer?.additional_image_2 && (
                      <DocImage label="Additional Image 2" src={getFileUrl(selectedRecord.customer.additional_image_2)} />
                    )}
                    {!selectedRecord.customer?.additional_image_1 && !selectedRecord.customer?.additional_image_2 && (
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No form images found</p>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Chalan
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedRecord.account?.chalan_front && (
                      <DocImage label="Chalan Front" src={getFileUrl(selectedRecord.account.chalan_front)} />
                    )}
                    {selectedRecord.account?.chalan_back && (
                      <DocImage label="Chalan Back" src={getFileUrl(selectedRecord.account.chalan_back)} />
                    )}
                    {!selectedRecord.account?.chalan_front && !selectedRecord.account?.chalan_back && (
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No chalan images found</p>
                    )}
                  </div>
                </div>

                {selectedRecord.customer?.voice_consent && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                      Voice Consent (Raza Mandi)
                    </h5>
                    <audio controls style={{ width: '100%' }}>
                      <source src={getFileUrl(selectedRecord.customer.voice_consent)} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                <div>
                  <h5 style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px', color: '#374151' }}>
                    Guarantors' CNIC Images
                  </h5>
                  {selectedRecord.guarantors && selectedRecord.guarantors.length > 0 ? (
                    selectedRecord.guarantors.map((g, idx) => (
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
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No guarantor documents found</p>
                  )}
                </div>
              </div>

              {/* ===== INSTALLMENT HISTORY WITH SLIP NO ===== */}
              <div className="oi-installment-history" style={{ marginTop: '20px' }}>
                <div className="oi-history-header">
                  <h4 style={{ fontWeight: 700 }}>Installment History</h4>
                  <span className="oi-history-badge" style={{ fontWeight: 600 }}>{selectedRecord.installments.length} Months</span>
                </div>
                <div className="oi-history-scroll">
                  <table className="oi-history-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>Month</th>
                        <th style={{ fontWeight: 800 }}>Due (PKR)</th>
                        <th style={{ fontWeight: 800 }}>Slip No</th>
                        <th style={{ fontWeight: 800 }}>Paid (PKR)</th>
                        <th style={{ fontWeight: 800 }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.installments.map((inst, index) => {
                        const rowStatus = getInstallmentRowStatus(inst);
                        return (
                          <tr key={inst.id || index} className={`${rowStatus === 'unpaid' ? 'oi-row-overdue' : ''} ${index % 2 === 0 ? 'oi-even-row' : 'oi-odd-row'}`}>
                            <td className="oi-month-cell" style={{ fontWeight: 600 }}>{formatMonth(inst.month)}</td>
                            <td style={{ fontWeight: 600 }}>PKR {parseFloat(inst.due_amount || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: '600', color: '#2563eb' }}>{inst.slip_no || '-'}</td>
                            <td className="oi-paid-amount" style={{ fontWeight: 700 }}>PKR {parseFloat(inst.paid_amount || 0).toLocaleString()}</td>
                            <td className="oi-overdue-amount" style={{ fontWeight: 700, color: '#dc2626' }}>PKR {parseFloat(inst.balance || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ===== EDIT FIELDS WITH SLIP NO ===== */}
              <div className="oi-edit-fields">
                {canEdit ? (
                  <>
                    <div className="oi-form-group">
                      <label style={{ fontWeight: 700 }}>
                        Pay Installment — {formatMonth(selectedRecord.nextPayableInstallment?.month)}
                      </label>
                      <input
                        type="number"
                        className="oi-form-input"
                        value={editingData.paidAmount}
                        onChange={(e) => setEditingData({ ...editingData, paidAmount: e.target.value })}
                        min="0"
                        max={editingData.maxPayable}
                        placeholder="Enter amount to pay (leave empty to just save remarks)..."
                        style={{ fontWeight: 600 }}
                        disabled={!selectedRecord.nextPayableInstallment}
                      />
                      <small className="oi-field-hint" style={{ fontWeight: 600 }}>
                        {selectedRecord.nextPayableInstallment
                          ? `Max payable: PKR ${editingData.maxPayable.toLocaleString()} — amount is optional if you're only adding remarks`
                          : 'No payable installment found for this account'}
                      </small>
                    </div>

                    <div className="oi-form-group">
                      <label style={{ fontWeight: 700 }}>Slip No</label>
                      <input
                        type="text"
                        className="oi-form-input"
                        value={editingData.slipNo}
                        onChange={(e) => setEditingData({ ...editingData, slipNo: e.target.value })}
                        placeholder="Enter unique slip number..."
                        style={{ fontWeight: 600 }}
                        disabled={!selectedRecord.nextPayableInstallment}
                      />
                      <small className="oi-field-hint" style={{ fontWeight: 600 }}>
                        Required if you're making a payment
                      </small>
                    </div>

                    <div className="oi-form-group">
                      <label style={{ fontWeight: 700 }}>Remarks</label>
                      <textarea
                        className="oi-form-input oi-form-textarea"
                        value={editingData.remarks}
                        onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                        placeholder="Add remarks or notes..."
                        rows="3"
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="oi-view-only">
                    <div className="oi-view-item">
                      <span style={{ fontWeight: 700 }}>Paid Amount</span>
                      <strong style={{ fontWeight: 700 }}>PKR {selectedRecord.paidAmount.toLocaleString()}</strong>
                    </div>
                    <div className="oi-view-item">
                      <span style={{ fontWeight: 700 }}>Balance</span>
                      <strong className={selectedRecord.balance > 0 ? 'oi-balance-amount' : 'oi-paid-amount'} style={{ fontWeight: 700 }}>
                        PKR {selectedRecord.balance.toLocaleString()}
                      </strong>
                    </div>
                    <div className="oi-view-item">
                      <span style={{ fontWeight: 700 }}>Remarks</span>
                      <strong style={{ fontWeight: 600 }}>{selectedRecord.remarks || 'No remarks'}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="oi-modal-footer">
              <button className="oi-btn-cancel" onClick={() => setShowEditModal(false)} style={{ fontWeight: 700 }}>
                {canEdit ? 'Cancel' : 'Close'}
              </button>
              {canEdit && (
                <button className="oi-btn-save" onClick={handleSaveEdit} style={{ fontWeight: 700 }} disabled={saving || !selectedRecord.nextPayableInstallment}>
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="oi-spinning" />
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueInstallments;