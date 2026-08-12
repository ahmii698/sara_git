// src/components/LeaveApplication/LeaveApplication.jsx

import React, { useState, useEffect } from 'react';
import {
  Calendar, User, FileText, Send, CheckCircle,
  AlertCircle, Building, X
} from 'lucide-react';
import './LeaveApplication.css';
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

const LeaveApplication = () => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [userBranch, setUserBranch] = useState(null);

  const [formData, setFormData] = useState({
    user_id: '',
    leave_date: '',
    reason: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

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
    if (user) {
      setUserBranch(user.branch);
    }
    fetchEmployees();
    fetchRecentLeaves();
  }, []);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users?paginate=0`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        let list = [];
        if (Array.isArray(data.data)) {
          list = data.data;
        } else if (data.data && Array.isArray(data.data.data)) {
          list = data.data.data;
        } else if (Array.isArray(data)) {
          list = data;
        }

        const filtered = list.filter(u => u.role === 'employee' || u.role === 'manager');
        setEmployees(filtered.length > 0 ? filtered : list);
      } else {
        setEmployees([]);
        showToaster('Failed to load employees', 'error');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
      showToaster('Network error loading employees', 'error');
    }
    setLoadingEmployees(false);
  };

  const fetchRecentLeaves = async () => {
    setLoadingRecent(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/leaves`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setRecentLeaves(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
    setLoadingRecent(false);
  };

  const getBranchScopedEmployees = () => {
    if (userBranch) {
      return employees.filter(emp => parseInt(emp.branch_id) === parseInt(userBranch));
    }
    return employees;
  };

  const getBranchScopedRecentLeaves = () => {
    let list = recentLeaves;
    if (userBranch) {
      list = list.filter(leave => parseInt(leave.employee?.branch_id) === parseInt(userBranch));
    }
    return list.slice(0, 4);
  };

  const filteredEmployees = getBranchScopedEmployees();
  const filteredRecentLeaves = getBranchScopedRecentLeaves();

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.user_id || !formData.leave_date || !formData.reason.trim()) {
      showToaster('Please select employee, date and enter reason.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/leaves`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showToaster('Leave recorded successfully!', 'success');
        setFormData({ user_id: '', leave_date: '', reason: '' });
        fetchRecentLeaves();
      } else {
        showToaster(data.message || 'Failed to record leave.', 'error');
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setSubmitting(false);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="leaveapp-page">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="leaveapp-page-header">
        <h2>Record Leave</h2>
        <p>Record a leave day for an employee</p>
      </div>

      <div className="leaveapp-content-grid">
        {/* ===== FORM CARD ===== */}
        <div className="leaveapp-form-card">
          <form onSubmit={handleSubmit}>
            <div className="leaveapp-form-group">
              <label>
                <User size={16} /> Employee
              </label>
              <select
                value={formData.user_id}
                onChange={(e) => handleChange('user_id', e.target.value)}
                className="leaveapp-form-input"
                disabled={loadingEmployees}
              >
                <option value="">
                  {loadingEmployees ? 'Loading employees...' : 'Select employee...'}
                </option>
                {filteredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} {emp.branch_id ? `(Branch ${emp.branch_id})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="leaveapp-form-group">
              <label>
                <Calendar size={16} /> Leave Date
              </label>
              <input
                type="date"
                value={formData.leave_date}
                onChange={(e) => handleChange('leave_date', e.target.value)}
                className="leaveapp-form-input"
              />
            </div>

            <div className="leaveapp-form-group">
              <label>
                <FileText size={16} /> Reason
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                className="leaveapp-form-input leaveapp-form-textarea"
                placeholder="e.g. Medical leave, Family emergency, Personal work..."
                rows={4}
              />
            </div>

            <button type="submit" className="leaveapp-submit-btn" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Recording...' : 'Record Leave'}
            </button>
          </form>
        </div>

        {/* ===== RECENT LEAVE RECORDS ===== */}
        <div className="leaveapp-recent-card">
          <h3>Recent Leave Records</h3>
          {loadingRecent ? (
            <div className="leaveapp-loading">
              <div className="leaveapp-spinner"></div>
            </div>
          ) : filteredRecentLeaves.length === 0 ? (
            <div className="leaveapp-empty">
              <AlertCircle size={22} />
              <p>No leave records yet</p>
            </div>
          ) : (
            <div className="leaveapp-recent-list">
              {filteredRecentLeaves.map(leave => (
                <div key={leave.id} className="leaveapp-recent-item">
                  <div className="leaveapp-recent-top">
                    <div className="leaveapp-recent-name">
                      {leave.employee?.name || 'Unknown'}
                      {leave.employee?.branch_id && (
                        <span className="leaveapp-recent-branch">
                          <Building size={11} /> Branch {leave.employee.branch_id}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="leaveapp-recent-date">{formatDate(leave.leave_date)}</div>
                  <div className="leaveapp-recent-reason">{leave.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveApplication;