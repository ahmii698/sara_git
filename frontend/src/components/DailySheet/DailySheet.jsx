// src/components/DailySheet/DailySheet.jsx
// ✅ DYNAMIC VERSION — ab Laravel backend (/api/daily-sheet) se connected hai.
// Data local state mein nahi, database se aata hai.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Calendar, RefreshCw, AlertCircle, CheckCircle,
  Edit2, Trash2, Plus, X, ChevronDown, ChevronRight,
  Building, Wallet, FileSpreadsheet
} from 'lucide-react';
import './DailySheet.css';
import ExportButton from '../common/ExportButton';
import { API_URL } from '../../../config';

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
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ============================================
// ✅ CONFIRMATION MODAL (used for Delete)
// ============================================
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', cancelText = 'Cancel', loading = false }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100000, padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', maxWidth: '420px', width: '100%',
        padding: '28px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'modalSlideUp 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
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
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: '1.5px solid #d1d5db',
              background: 'transparent', color: '#6b7280', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: loading ? 0.5 : 1
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 24px', borderRadius: '8px', border: 'none',
              background: loading ? '#93c5fd' : '#dc2626', color: '#fff', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '6px', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <span className="spinning" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Processing...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ============================================
// ✅ COLUMNS - EXACT ORDER FROM THE PHYSICAL SHEET
// ============================================
const SHEET_COLUMNS = [
  { key: 'date',            label: 'Date',           type: 'date' },
  { key: 'wallet_opening',  label: 'Wallet Opening', type: 'text' },
  { key: 'installment',     label: 'Installment',    type: 'text' },
  { key: 'dp_fi',           label: 'DP & FI',         type: 'text' },
  { key: 'total',           label: 'Total',           type: 'text' },
  { key: 'challan',         label: 'Challan',         type: 'text' },
  { key: 'rs',              label: 'RS/=',            type: 'text' },
  { key: 'salary_ac',       label: 'Salary A/C',      type: 'text' },
  { key: 'kp_dot',          label: 'KP DOT',          type: 'text' },
  { key: 'expenses',        label: 'Expenses',        type: 'text' },
  { key: 'others',          label: 'Others',          type: 'text' },
  { key: 'cash_to_kp',      label: 'Cash to Kp',      type: 'text' },
  { key: 'wallet_closing',  label: 'Wallet Closing',  type: 'text' },
];

const EMPTY_FORM = SHEET_COLUMNS.reduce((acc, col) => {
  acc[col.key] = '';
  return acc;
}, {});

// ============================================
// ✅ ENTRY FORM MODAL (Add / Edit)
// ============================================
const EntryFormModal = ({ isOpen, mode, formData, onChange, onSubmit, onClose, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <FileSpreadsheet size={24} className="modal-icon" />
            <div>
              <h3 className="modal-title">{mode === 'edit' ? 'Edit Entry' : 'Add New Entry'}</h3>
              <p className="modal-subtitle">Daily Cash Sheet</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {SHEET_COLUMNS.map((col) => (
              <div className="form-item" key={col.key}>
                <label className="form-label">{col.label}</label>
                <input
                  type={col.type}
                  className="form-input"
                  value={formData[col.key] ?? ''}
                  onChange={(e) => onChange(col.key, e.target.value)}
                  placeholder={col.type === 'text' ? 'e.g. NIL' : ''}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-close-modal" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-save-modal" onClick={onSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="spinning" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {mode === 'edit' ? 'Save Changes' : 'Add Entry'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const DailySheet = () => {
  const [loading, setLoading] = useState(true);
  const [allEntries, setAllEntries] = useState([]); // ✅ ab backend se aata hai
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const isAdmin = userRole === 'admin';

  // ===== Daily / Weekly / Monthly view =====
  const [period, setPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // ===== Toaster / Confirm / Form modal state =====
  const [toaster, setToaster] = useState({ message: '', type: 'info', show: false });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, onConfirm: null, title: '', message: '', confirmText: 'Delete', cancelText: 'Cancel', loading: false
  });
  const [formModal, setFormModal] = useState({ isOpen: false, mode: 'add', data: EMPTY_FORM, editingId: null, loading: false });

  const showToaster = (message, type = 'info') => setToaster({ message, type, show: true });
  const hideToaster = () => setToaster({ message: '', type: 'info', show: false });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, onConfirm, title, message, confirmText: 'Delete', cancelText: 'Cancel', loading: false });
  };
  const hideConfirm = () => {
    setConfirmModal({ isOpen: false, onConfirm: null, title: '', message: '', confirmText: 'Delete', cancelText: 'Cancel', loading: false });
  };
  const setConfirmLoading = (loading) => setConfirmModal(prev => ({ ...prev, loading }));

  // ✅ Login/session info localStorage se (jaisa pehle tha)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
  }, []);

  // ============================================
  // ✅ FETCH ENTRIES FROM BACKEND (GET /api/daily-sheet)
  // period/date/week/month/branch/search sab query params ke through backend ko jate hain
  // ============================================
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      const query = new URLSearchParams({ period });
      if (period === 'daily') query.set('date', selectedDate);
      if (period === 'weekly') query.set('week', selectedWeek);
      if (period === 'monthly') query.set('month', selectedMonth);
      if (userBranch) query.set('branch_id', userBranch);
      query.set('is_admin', isAdmin ? 1 : 0);
      if (search) query.set('search', search);

      const res = await fetch(`${API_URL}/daily-sheet?${query.toString()}`, { headers });
      const data = await res.json();

      if (data.success) {
        setAllEntries(data.data || []);
      } else {
        setError(data.message || 'Daily cash sheet load nahi ho saka.');
      }
    } catch (err) {
      console.error('Error fetching daily sheet:', err);
      setError('Daily cash sheet load nahi ho saka. Dobara try karein.');
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedDate, selectedWeek, selectedMonth, userBranch, userRole, search]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // ============================================
  // ✅ ADD / EDIT FORM HANDLERS
  // ============================================
  const openAddModal = () => {
    setFormModal({ isOpen: true, mode: 'add', data: { ...EMPTY_FORM, date: selectedDate }, editingId: null, loading: false });
  };

  const openEditModal = (entry) => {
    const data = SHEET_COLUMNS.reduce((acc, col) => {
      acc[col.key] = entry?.[col.key] ?? '';
      return acc;
    }, {});
    setFormModal({ isOpen: true, mode: 'edit', data, editingId: entry?.id, loading: false });
  };

  const closeFormModal = () => {
    setFormModal({ isOpen: false, mode: 'add', data: EMPTY_FORM, editingId: null, loading: false });
  };

  const handleFormChange = (key, value) => {
    setFormModal(prev => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  // ✅ ADD/EDIT ab real backend call karta hai (POST ya PUT)
  const handleFormSubmit = async () => {
    setFormModal(prev => ({ ...prev, loading: true }));

    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      const isEdit = formModal.mode === 'edit';
      const payload = { ...formModal.data, branch_id: userBranch || formModal.data.branch_id };

      const url = isEdit
        ? `${API_URL}/daily-sheet/${formModal.editingId}`
        : `${API_URL}/daily-sheet`;

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToaster(isEdit ? 'Entry updated successfully.' : 'Entry added successfully.', 'success');
        closeFormModal();
        fetchEntries();
      } else {
        showToaster(data.message || 'Entry save nahi ho saki. Dobara try karein.', 'error');
        setFormModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Error saving entry:', err);
      showToaster('Entry save nahi ho saki. Dobara try karein.', 'error');
      setFormModal(prev => ({ ...prev, loading: false }));
    }
  };

  // ============================================
  // ✅ DELETE HANDLER — real backend call (DELETE /api/daily-sheet/{id})
  // ============================================
  const handleDeleteEntry = useCallback((entry) => {
    showConfirm(
      'Delete Entry',
      `Are you sure you want to delete the entry dated ${entry?.date}? This action cannot be undone.`,
      async () => {
        setConfirmLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_URL}/daily-sheet/${entry.id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          });
          const data = await res.json();

          if (data.success) {
            showToaster('Entry deleted successfully.', 'success');
            hideConfirm();
            fetchEntries();
          } else {
            showToaster(data.message || 'Entry delete nahi ho saki.', 'error');
            setConfirmLoading(false);
          }
        } catch (err) {
          console.error('Error deleting entry:', err);
          showToaster('Entry delete nahi ho saki. Dobara try karein.', 'error');
          setConfirmLoading(false);
        }
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEntries]);

  const formatDateDisplay = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const exportColumns = SHEET_COLUMNS.map(col => ({ header: col.label, key: col.key }));
  const exportData = allEntries.map(e => {
    const row = {};
    SHEET_COLUMNS.forEach(col => { row[col.key] = e?.[col.key] ?? '-'; });
    return row;
  });

  if (loading) {
    return (
      <div className="daily-sheet-container">
        <div className="loading-state">
          <RefreshCw size={40} className="spinning" />
          <p>Loading daily cash sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily-sheet-container">
        <div className="error-state">
          <AlertCircle size={40} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchEntries}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-sheet-container">
      {toaster.show && <Toaster message={toaster.message} type={toaster.type} onClose={hideToaster} />}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onConfirm={() => { if (confirmModal.onConfirm) confirmModal.onConfirm(); }}
        onCancel={hideConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        loading={confirmModal.loading}
      />

      <EntryFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        formData={formModal.data}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        onClose={closeFormModal}
        loading={formModal.loading}
      />

      <div className="daily-sheet-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Daily Cash Sheet</h2>
            <span className="live-badge">
              <Wallet size={12} /> Live
            </span>
          </div>
          <p className="header-subtitle">
            {userBranch ? `Showing sheet for Branch ${userBranch}` : 'Manage daily, weekly & monthly cash records'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ExportButton
            data={exportData}
            columns={exportColumns}
            filename="daily-cash-sheet-report"
            title="Daily Cash Sheet Report"
          />
          {isAdmin && (
            <button className="btn-add-entry" onClick={openAddModal}>
              <Plus size={18} />
              Add Entry
            </button>
          )}
          <button className="btn-refresh" onClick={fetchEntries}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* ===== DAILY / WEEKLY / MONTHLY TABS ===== */}
      <div className="period-controls">
        <div className="period-tabs">
          <button className={`period-tab ${period === 'daily' ? 'active' : ''}`} onClick={() => setPeriod('daily')}>
            Daily
          </button>
          <button className={`period-tab ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>
            Weekly
          </button>
          <button className={`period-tab ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>
            Monthly
          </button>
        </div>

        <div className="period-date-picker">
          <Calendar size={16} className="period-date-icon" />
          {period === 'daily' && (
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="period-date-input" />
          )}
          {period === 'weekly' && (
            <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="period-date-input" />
          )}
          {period === 'monthly' && (
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="period-date-input" />
          )}
        </div>

        {userBranch && (
          <div className="branch-info-badge">
            <Building size={14} />
            <span>Branch {userBranch} (Your Current Branch)</span>
          </div>
        )}
      </div>

      <div className="system-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by date, salary A/C or challan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="sheet-table">
          <thead>
            <tr>
              <th>#</th>
              {SHEET_COLUMNS.map(col => <th key={col.key}>{col.label}</th>)}
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {allEntries.length === 0 ? (
              <tr>
                <td colSpan={SHEET_COLUMNS.length + (isAdmin ? 2 : 1)}>
                  <div className="no-users-message">
                    <AlertCircle size={20} />
                    <span>No entries found for this {period} view</span>
                  </div>
                </td>
              </tr>
            ) : (
              allEntries.map((entry, index) => (
                <tr key={entry?.id || index}>
                  <td className="text-center">{index + 1}</td>
                  {SHEET_COLUMNS.map(col => (
                    <td key={col.key}>
                      {col.key === 'date' ? formatDateDisplay(entry?.[col.key]) : (entry?.[col.key] ?? '-')}
                    </td>
                  ))}
                  {isAdmin && (
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon-edit" onClick={() => openEditModal(entry)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon-delete" onClick={() => handleDeleteEntry(entry)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="system-footer">
        <span className="total-record-text">
          Showing {allEntries.length} {period} entr{allEntries.length === 1 ? 'y' : 'ies'}
        </span>
      </div>
    </div>
  );
};

export default DailySheet;