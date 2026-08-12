// src/components/AccountTarget/AccountTarget.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Target, TrendingUp, TrendingDown, Calendar, 
  Building, CheckCircle, AlertCircle, RefreshCw,
  Search, Eye, DollarSign, Award, Briefcase, X
} from 'lucide-react';
import './AccountTarget.css';
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

const AccountTarget = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [editingTarget, setEditingTarget] = useState({});
  const [savingTarget, setSavingTarget] = useState({});

  // ✅ Target History modal state
  const [targetHistoryEmp, setTargetHistoryEmp] = useState(null);
  const [targetHistoryData, setTargetHistoryData] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ============================================
  // ✅ TOASTER STATE
  // ============================================
  const [toaster, setToaster] = useState({ message: '', type: 'success', show: false });

  const showToaster = (message, type = 'success') => {
    setToaster({ message, type, show: true });
  };

  const hideToaster = () => {
    setToaster({ message: '', type: 'success', show: false });
  };

  // ✅ Get current month
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    setSelectedMonth(getCurrentMonth());
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, userBranch]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      let reportUrl = `${API_URL}/employee-report`;
      if (userBranch) {
        reportUrl += `?branch_id=${userBranch}`;
      }

      let targetsUrl = `${API_URL}/target-performance?month=${selectedMonth}`;
      if (userBranch) {
        targetsUrl += `&branch_id=${userBranch}`;
      }

      const [reportRes, targetsRes] = await Promise.all([
        fetch(reportUrl, { headers }),
        fetch(targetsUrl, { headers })
      ]);

      const [reportData, targetsData] = await Promise.all([
        reportRes.json(),
        targetsRes.json()
      ]);

      let targetsMap = {};
      if (targetsData.success) {
        targetsMap = targetsData.data || {};
      }

      if (reportData.success) {
        const employeesList = (reportData.data && reportData.data.data) || [];

        const employeesWithCounts = employeesList
          .filter(emp => emp.role === 'employee')
          .map(emp => {
            const monthlyData = emp.monthlyData || {};
            const currentMonthAccounts = monthlyData[selectedMonth]?.accountsOpened || 0;
            const totalAccounts = emp.totalAccounts || 0;
            const target = targetsMap[emp.id] ? parseInt(targetsMap[emp.id].target) : 0;

            return {
              id: emp.id,
              name: emp.name || 'Unknown',
              email: emp.email || '',
              phone: emp.phone || '',
              branch: emp.branch_id,
              salary: emp.salary || 0,
              monthlyData,
              currentMonthAccounts,
              totalAccounts,
              target,
              remaining: Math.max(target - currentMonthAccounts, 0),
              progress: target > 0 ? Math.round((currentMonthAccounts / target) * 100) : 0
            };
          });

        setEmployees(employeesWithCounts);
      } else {
        console.error('Employee report API error:', reportData.message);
        showToaster('Failed to load employee data', 'error');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setLoading(false);
  }, [userBranch, selectedMonth]);

  const handleTargetChange = (employeeId, value) => {
    setEditingTarget(prev => ({
      ...prev,
      [employeeId]: value
    }));
  };

  const saveTarget = async (employeeId) => {
    const value = editingTarget[employeeId];
    if (!value || parseInt(value) <= 0) {
      showToaster('Please enter a valid target', 'error');
      return;
    }

    setSavingTarget(prev => ({ ...prev, [employeeId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/target-performance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          employee_id: employeeId,
          month: selectedMonth,
          target: parseInt(value)
        })
      });

      const data = await response.json();

      if (data.success) {
        setEmployees(prev => prev.map(emp => {
          if (emp.id === employeeId) {
            const target = parseInt(value);
            const currentMonthAccounts = emp.currentMonthAccounts;
            return {
              ...emp,
              target: target,
              remaining: Math.max(target - currentMonthAccounts, 0),
              progress: target > 0 ? Math.round((currentMonthAccounts / target) * 100) : 0
            };
          }
          return emp;
        }));

        setEditingTarget(prev => ({ ...prev, [employeeId]: '' }));
        showToaster('Target saved successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to save target', 'error');
      }
    } catch (error) {
      console.error('Error saving target:', error);
      showToaster('Network error. Please try again.', 'error');
    }

    setSavingTarget(prev => ({ ...prev, [employeeId]: false }));
  };

  const handleRefresh = () => {
    fetchData();
    showToaster('Data refreshed successfully', 'success');
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const getMonthName = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  };

  const openTargetHistory = async (emp) => {
    setTargetHistoryEmp(emp);
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/target-performance/employee/${emp.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTargetHistoryData(data.success ? data.data : {});
    } catch (err) {
      console.error('Error fetching target history:', err);
      setTargetHistoryData({});
      showToaster('Failed to load target history', 'error');
    }
    setLoadingHistory(false);
  };

  const closeTargetHistory = () => {
    setTargetHistoryEmp(null);
    setTargetHistoryData({});
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalEmployees = filteredEmployees.length;
  const totalTargets = filteredEmployees.reduce((sum, emp) => sum + emp.target, 0);
  const totalAchieved = filteredEmployees.reduce((sum, emp) => sum + emp.currentMonthAccounts, 0);
  const totalRemaining = filteredEmployees.reduce((sum, emp) => sum + emp.remaining, 0);
  const overallProgress = totalTargets > 0 ? Math.round((totalAchieved / totalTargets) * 100) : 0;

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const statCards = [
    {
      label: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: '#4338ca',
      bg: 'rgba(67, 56, 202, 0.1)'
    },
    {
      label: 'Total Targets',
      value: totalTargets,
      icon: Target,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.12)'
    },
    {
      label: 'Accounts Achieved',
      value: totalAchieved,
      icon: TrendingUp,
      color: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.1)'
    },
    {
      label: 'Remaining',
      value: totalRemaining,
      icon: TrendingDown,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.1)'
    },
    {
      label: 'Overall Progress',
      value: `${overallProgress}%`,
      icon: Award,
      color: '#8B5CF6',
      bg: 'rgba(139, 92, 246, 0.1)'
    }
  ];

  if (loading && employees.length === 0) {
    return (
      <div className="account-target-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading account targets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account-target-container">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="target-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Account Target</h2>
            <span className="live-badge">
              <Target size={12} /> Active
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="month-selector">
            <Calendar size={16} />
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="month-select"
            >
              {getAvailableMonths().map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-refresh-small" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="target-stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="target-stat-card">
            <div className="target-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="target-stat-info">
              <span className="target-stat-label">{card.label}</span>
              <span className="target-stat-value" style={{ color: card.color }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== SEARCH ===== */}
      <div className="target-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="target-summary">
          <span>Showing {filteredEmployees.length} employees</span>
          <span className="target-month">• {getMonthName(selectedMonth)}</span>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="target-table-wrap">
        <table className="target-table">
          <thead>
            <tr style={{ background: '#1E1B4B' }}>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>#</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Employee</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Accounts (Current Month)</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Target</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Achieved</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remaining</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Progress</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>History</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  <AlertCircle size={24} />
                  <p>No employees found for {branchLabel}</p>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, index) => (
                <tr key={emp.id} className={emp.progress >= 100 ? 'achieved-row' : ''}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="employee-name-cell">
                      <div className="emp-avatar" style={{ background: '#ede9fe', color: '#1E1B4B' }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-details">
                          <span className="emp-branch">Branch {emp.branch}</span>
                          <span className="emp-salary">PKR {emp.salary?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="account-count achieved">
                      {emp.currentMonthAccounts}
                    </span>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="target-input"
                      placeholder="Set target"
                      value={editingTarget[emp.id] !== undefined ? editingTarget[emp.id] : (emp.target || '')}
                      onChange={(e) => handleTargetChange(emp.id, e.target.value)}
                      min="0"
                    />
                  </td>
                  <td>
                    <span className="achieved-count">
                      {emp.currentMonthAccounts}
                    </span>
                  </td>
                  <td>
                    <span className="remaining-count" style={{ 
                      color: emp.remaining > 0 ? '#dc2626' : '#22c55e'
                    }}>
                      {emp.remaining}
                    </span>
                  </td>
                  <td>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-track">
                        <div 
                          className={`progress-bar-fill ${emp.progress >= 100 ? 'complete' : ''}`}
                          style={{ width: `${Math.min(emp.progress, 100)}%` }}
                        />
                      </div>
                      <span className="progress-text">{emp.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="btn-save-target"
                      onClick={() => saveTarget(emp.id)}
                      disabled={!editingTarget[emp.id] || parseInt(editingTarget[emp.id]) <= 0 || savingTarget[emp.id]}
                    >
                      <CheckCircle size={14} />
                      {savingTarget[emp.id] ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-view-detail"
                      onClick={() => openTargetHistory(emp)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PROGRESS SUMMARY ===== */}
      {filteredEmployees.length > 0 && (
        <div className="target-footer">
          <div className="footer-left">
            <span>Total Target: <strong>{totalTargets}</strong></span>
            <span>• Achieved: <strong style={{ color: '#22c55e' }}>{totalAchieved}</strong></span>
            <span>• Remaining: <strong style={{ color: '#dc2626' }}>{totalRemaining}</strong></span>
          </div>
          <div className="footer-right">
            <div className="overall-progress">
              <span>Overall Progress</span>
              <div className="progress-bar-track">
                <div 
                  className={`progress-bar-fill ${overallProgress >= 100 ? 'complete' : ''}`}
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                />
              </div>
              <span className="overall-progress-text">{overallProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== TARGET HISTORY MODAL ===== */}
      {targetHistoryEmp && (
        <div
          className="target-modal-overlay"
          onClick={closeTargetHistory}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '12px', width: '600px', maxWidth: '90%',
              maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {targetHistoryEmp.name} — Target History
              </h3>
              <button
                onClick={closeTargetHistory}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '1rem 1.5rem', overflowY: 'auto' }}>
              {loadingHistory ? (
                <p>Loading...</p>
              ) : (
                <table className="target-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)' }}>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Month</th>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Target</th>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Accounts Opened</th>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remaining</th>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys({ ...targetHistoryEmp.monthlyData, ...targetHistoryData })
                      .sort()
                      .reverse()
                      .map(month => {
                        const target = parseInt(targetHistoryData[month] || 0);
                        const achieved = targetHistoryEmp.monthlyData?.[month]?.accountsOpened || 0;
                        const remaining = Math.max(target - achieved, 0);
                        const progress = target > 0 ? Math.round((achieved / target) * 100) : 0;
                        return (
                          <tr key={month}>
                            <td>{getMonthName(month)}</td>
                            <td>{target || '—'}</td>
                            <td>{achieved}</td>
                            <td style={{ color: remaining > 0 ? '#dc2626' : '#22c55e', fontWeight: 700 }}>
                              {target > 0 ? remaining : '—'}
                            </td>
                            <td>{target > 0 ? `${progress}%` : '—'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountTarget;