// src/components/Alert/Alert.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, Shield, CreditCard, Users, DollarSign, RefreshCw,
  Trash2, Search, Filter, X, Clock, Building, CheckCircle
} from 'lucide-react';
import './Alert.css';
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
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Delete', cancelText = 'Cancel' }) => {
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0A1628', margin: 0 }}>{title || 'Confirm Delete'}</h3>
        </div>
        
        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#4b5563', marginBottom: '24px', lineHeight: 1.6 }}>
          {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
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
              background: '#dc2626',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.background = '#dc2626'}
          >
            <Trash2 size={16} />
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

const TYPE_META = {
  cnic:       { label: 'CNIC',       icon: CreditCard, color: '#dc2626', bg: '#fee2e2' },
  limit:      { label: 'LIMIT',      icon: DollarSign,  color: '#d97706', bg: '#fef3c7' },
  account:    { label: 'ACCOUNT',    icon: Shield,       color: '#2563eb', bg: '#dbeafe' },
  guarantor:  { label: 'GUARANTOR',  icon: Users,        color: '#7c3aed', bg: '#ede9fe' },
};

const Alert = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actioningId, setActioningId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const [toaster, setToaster] = useState({ message: '', type: 'info', show: false });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    alertId: null,
    title: 'Delete Alert',
    message: 'Are you sure you want to delete this alert? This action cannot be undone.'
  });

  const showToaster = (message, type = 'info') => {
    setToaster({ message, type, show: true });
  };

  const hideToaster = () => {
    setToaster({ message: '', type: 'info', show: false });
  };

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load alerts');

      const list = Array.isArray(json.data?.data)
        ? json.data.data
        : (Array.isArray(json.data) ? json.data : []);

      setAlerts(list);
      setTotalCount(json.data?.total ?? list.length);
    } catch (err) {
      console.error('Alerts fetch error:', err);
      setError(err.message || 'Network error while loading alerts');
      showToaster('Failed to load alerts', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleDeleteClick = (id) => {
    setConfirmModal({
      isOpen: true,
      alertId: id,
      title: 'Delete Alert',
      message: 'Are you sure you want to delete this alert? This action cannot be undone.'
    });
  };

  const handleConfirmDelete = async () => {
    const id = confirmModal.alertId;
    if (!id) return;

    setConfirmModal({ isOpen: false, alertId: null, title: '', message: '' });
    setActioningId(id);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/alerts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Failed to delete alert');

      setAlerts(prev => prev.filter(a => a.id !== id));
      setTotalCount(prev => Math.max(0, prev - 1));
      showToaster('Alert deleted successfully.', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToaster(`Failed to delete: ${err.message}`, 'error');
    }
    setActioningId(null);
  };

  const handleCancelDelete = () => {
    setConfirmModal({ isOpen: false, alertId: null, title: '', message: '' });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-PK', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const haystack = `${a.message || ''} ${a.customer_name || ''} ${a.customer_cnic || ''} ${a.case_no || ''}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const counts = alerts.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="alert-page-container">
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <div className="alert-page-header">
        <div className="alert-header-title">
          <AlertCircle size={24} />
          <h2>Alerts</h2>
          {totalCount > 0 && (
            <span className="alert-total-badge">{totalCount} total</span>
          )}
        </div>
        <button className="alert-refresh-btn" onClick={fetchAlerts} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="alert-filter-bar">
        <div className="alert-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, CNIC, case no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="alert-type-chips">
          <button
            className={`alert-chip ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <Filter size={13} /> All
          </button>
          {Object.entries(TYPE_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <button
                key={key}
                className={`alert-chip ${filterType === key ? 'active' : ''}`}
                style={filterType === key ? { background: meta.bg, color: meta.color, borderColor: meta.color } : {}}
                onClick={() => setFilterType(key)}
              >
                <Icon size={13} /> {meta.label}
                {counts[key] ? <span className="chip-count">{counts[key]}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="alert-state-box">
          <RefreshCw size={28} className="spin" />
          <p>Loading alerts...</p>
        </div>
      )}

      {!loading && error && (
        <div className="alert-state-box error">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button className="alert-retry-btn" onClick={fetchAlerts}>Try Again</button>
        </div>
      )}

      {!loading && !error && filteredAlerts.length === 0 && (
        <div className="alert-state-box empty">
          <CheckCircle size={28} />
          <p>No alerts found — All clear</p>
        </div>
      )}

      {!loading && !error && filteredAlerts.length > 0 && (
        <div className="alert-list">
          {filteredAlerts.map((a) => {
            const meta = TYPE_META[a.type] || { label: a.type?.toUpperCase() || 'ALERT', icon: AlertCircle, color: '#6b7280', bg: '#f3f4f6' };
            const Icon = meta.icon;
            return (
              <div key={a.id} className="alert-card">
                <div className="alert-card-icon" style={{ background: meta.bg, color: meta.color }}>
                  <Icon size={20} />
                </div>
                <div className="alert-card-body">
                  <div className="alert-card-top">
                    <span className="alert-type-tag" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="alert-card-time"><Clock size={12} /> {formatDate(a.created_at)}</span>
                  </div>
                  <p className="alert-card-message">{a.message}</p>
                  <div className="alert-card-meta">
                    {a.customer_name && <span><strong>Customer:</strong> {a.customer_name}</span>}
                    {a.customer_cnic && <span><strong>CNIC:</strong> {a.customer_cnic}</span>}
                    {a.case_no && <span><strong>Case:</strong> {a.case_no}</span>}
                    {/* ✅ BRANCH REMOVED - yahan se branch hata di gayi */}
                  </div>
                </div>
                <div className="alert-card-actions">
                  <button
                    className="alert-btn-delete"
                    onClick={() => handleDeleteClick(a.id)}
                    disabled={actioningId === a.id}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alert;