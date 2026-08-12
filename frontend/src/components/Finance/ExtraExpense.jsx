// src/components/ExtraExpense/ExtraExpense.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Calendar, DollarSign, 
  Building, Filter, RefreshCw, ChevronDown, CheckCircle, AlertCircle 
} from 'lucide-react';
import './ExtraExpense.css';
import { API_URL } from '../../../config';
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

const ExtraExpense = () => {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const itemsPerPage = 10;

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      fetchExpenses(user.branch);
    } else {
      fetchExpenses(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExpenses = useCallback(async (branch) => {
    setFetching(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/expenses/extra`;
      const effectiveBranch = branch || userBranch;
      if (effectiveBranch) {
        url += `?branch_id=${effectiveBranch}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const mapped = (data.data || []).map(exp => ({
          id: exp.id,
          description: exp.description,
          amount: parseFloat(exp.amount) || 0,
          branch: exp.branch_id,
          date: exp.date
        }));
        setExpenses(mapped);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching extra expenses:', error);
      setExpenses([]);
      showToaster('Failed to load extra expenses', 'error');
    }
    setFetching(false);
  }, [userBranch]);

  const handleRefresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/expenses/extra`;
      if (userBranch) {
        url += `?branch_id=${userBranch}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const mapped = (data.data || []).map(exp => ({
          id: exp.id,
          description: exp.description,
          amount: parseFloat(exp.amount) || 0,
          branch: exp.branch_id,
          date: exp.date
        }));
        setExpenses(mapped);
        showToaster('Data refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Error refreshing expenses:', error);
      showToaster('Failed to refresh data', 'error');
    }
  }, [userBranch]);

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    branch: 1,
    date: '',
  });

  const getAllYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
      years.push(String(year));
    }
    return years;
  };

  const getAllMonths = () => {
    return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  };

  const getMonthName = (monthStr) => {
    if (monthStr === 'all') return 'All Months';
    const date = new Date(2000, parseInt(monthStr) - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getAvailableYears = () => {
    const years = new Set();
    const filteredExpenses = userBranch ? expenses.filter(e => e.branch === parseInt(userBranch)) : expenses;
    filteredExpenses.forEach(exp => {
      const year = exp.date.substring(0, 4);
      years.add(year);
    });
    return Array.from(years).sort();
  };

  const getAvailableMonths = () => {
    const months = new Set();
    const filteredExpenses = userBranch ? expenses.filter(e => e.branch === parseInt(userBranch)) : expenses;
    filteredExpenses.forEach(exp => {
      const month = exp.date.substring(5, 7);
      months.add(month);
    });
    return Array.from(months).sort();
  };

  const filtered = expenses.filter(e => {
    const searchMatch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.amount.toString().includes(search);
    
    let branchMatch = true;
    if (userBranch) {
      branchMatch = e.branch === parseInt(userBranch);
    }
    
    let monthMatch = true;
    if (monthFilter !== 'all') {
      const expMonth = e.date.substring(5, 7);
      monthMatch = expMonth === monthFilter;
    }
    
    let yearMatch = true;
    if (yearFilter !== 'all') {
      const expYear = e.date.substring(0, 4);
      yearMatch = expYear === yearFilter;
    }
    
    return searchMatch && branchMatch && monthMatch && yearMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const canAddExpense = () => {
    return userRole === 'admin' || userRole === 'manager';
  };

  // ✅ Sirf Admin delete kar sakta hai
  const canDeleteExpense = () => {
    return userRole === 'admin';
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      showToaster('Please fill all required fields', 'error');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    const date = newExpense.date || getCurrentDate();
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/extra`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newExpense.description,
          amount: parseInt(newExpense.amount),
          branch_id: branch,
          date: date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToaster(data.message || 'Failed to add expense', 'error');
        setLoading(false);
        return;
      }

      if (data.success) {
        await handleRefresh();
        setNewExpense({ description: '', amount: '', branch: 1, date: '' });
        setShowModal(false);
        showToaster('Expense added successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to add expense', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }

    setLoading(false);
  };

  const handleEditExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      showToaster('Please fill all required fields', 'error');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/extra/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: newExpense.description,
          amount: parseInt(newExpense.amount),
          branch_id: branch,
          date: newExpense.date || editingExpense.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToaster(data.message || 'Failed to update expense', 'error');
        setLoading(false);
        return;
      }

      if (data.success) {
        await handleRefresh();
        setNewExpense({ description: '', amount: '', branch: 1, date: '' });
        setShowModal(false);
        setEditingExpense(null);
        showToaster('Expense updated successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to update expense', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }

    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/extra/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        showToaster(data.message || 'Failed to delete expense', 'error');
        setLoading(false);
        return;
      }

      if (data.success) {
        await handleRefresh();
        showToaster('Expense deleted successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to delete expense', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }

    setLoading(false);
  };

  const openAddModal = () => {
    if (!canAddExpense()) {
      showToaster('Only managers and admins can add expenses', 'error');
      return;
    }

    setEditingExpense(null);
    setNewExpense({ 
      description: '', 
      amount: '', 
      branch: userBranch ? parseInt(userBranch) : 1, 
      date: getCurrentDate() 
    });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    if (!canAddExpense()) {
      showToaster('Only managers and admins can edit expenses', 'error');
      return;
    }

    setEditingExpense(expense);
    setNewExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      branch: expense.branch,
      date: expense.date,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setNewExpense({ description: '', amount: '', branch: 1, date: '' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getBranchTotal = (branch) => {
    return filtered
      .filter(e => e.branch === branch)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const allYears = getAllYears();
  const allMonths = getAllMonths();
  const availableYears = getAvailableYears();
  const availableMonths = getAvailableMonths();

  const totalExpenses = filtered.length;
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const branch1Total = getBranchTotal(1);
  const branch2Total = getBranchTotal(2);

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  // ============================================
  // ✅ STAT CARDS
  // ============================================
  const statChips = [
    {
      value: totalExpenses,
      label: 'Expenses',
      icon: Building,
      color: '#1d4ed8',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'stat-expenses'
    },
    {
      value: `PKR ${totalAmount.toLocaleString()}`,
      label: 'Total Amount',
      icon: DollarSign,
      color: '#1E1B4B',
      bg: 'rgba(30, 27, 75, 0.10)',
      className: 'stat-total'
    },
  ];

  const getExportData = useCallback(() => {
    return filtered.map(exp => ({
      description: exp.description,
      amount: exp.amount,
      date: formatDate(exp.date),
      branch: exp.branch === 1 ? 'Branch 1' : 'Branch 2'
    }));
  }, [filtered]);

  const exportColumns = [
    { header: 'Description', key: 'description' },
    { header: 'Amount (PKR)', key: 'amount' },
    { header: 'Date', key: 'date' },
    { header: 'Branch', key: 'branch' },
  ];

  if (fetching && expenses.length === 0) {
    return (
      <div className="extra-expense-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading extra expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="extra-expense-container">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="extra-header">
        <div className="header-left">
          <div className="header-title-group">
            <h3>Extra Expenses</h3>
            <span className="live-badge">
              <Calendar size={12} /> Active
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        </div>

        {/* ===== VIP STAT CARDS ===== */}
        <div className="header-stats">
          {statChips.map((chip, index) => (
            <div
              key={index}
              className={`stat-card ${chip.className}`}
              style={{ borderColor: chip.color + '2a' }}
            >
              <div className="stat-card-icon" style={{ background: chip.bg, color: chip.color }}>
                <chip.icon size={20} />
              </div>
              <div className="stat-card-text">
                <span className="stat-card-value" style={{ color: chip.color }}>{chip.value}</span>
                <span className="stat-card-label">{chip.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportButton
            data={getExportData()}
            columns={exportColumns}
            filename="extra-expenses-report"
            title="Extra Expenses Report"
          />
          {canAddExpense() && (
            <button className="btn-accent" onClick={openAddModal}>
              <Plus size={18} />
              Add Expense
            </button>
          )}
          <button className="btn-refresh-small" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ===== BRANCH TOTALS CARDS ===== */}
      {userRole === 'admin' && !userBranch && (
        <div className="branch-totals">
          <div className="branch-total-card branch-1-card">
            <div className="branch-card-header">
              <Building size={16} style={{ color: '#1E1B4B' }} />
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Branch 1</h4>
            </div>
            <div className="branch-total-row">
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1E1B4B' }}>
                PKR {branch1Total.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="branch-total-card branch-2-card">
            <div className="branch-card-header">
              <Building size={16} style={{ color: '#C9A84C' }} />
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Branch 2</h4>
            </div>
            <div className="branch-total-row">
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#C9A84C' }}>
                PKR {branch2Total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="extra-controls">
        <div className="extra-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <span className="filter-label">Year:</span>
            <select
              className="filter-select"
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Years</option>
              {allYears.map(year => {
                const hasData = availableYears.includes(year);
                return (
                  <option key={year} value={year}>
                    {year} {hasData ? '✓' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="filter-item">
            <span className="filter-label">Month:</span>
            <select
              className="filter-select"
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Months</option>
              {allMonths.map(month => {
                const hasData = availableMonths.includes(month);
                return (
                  <option key={month} value={month}>
                    {getMonthName(month)} {hasData ? '✓' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {(monthFilter !== 'all' || yearFilter !== 'all') && (
        <div className="filter-summary">
          <span style={{ fontWeight: 600 }}>
            Showing: 
            {yearFilter !== 'all' && ` Year ${yearFilter}`}
            {monthFilter !== 'all' && ` • ${getMonthName(monthFilter)}`}
            {yearFilter === 'all' && monthFilter === 'all' && ' All Expenses'}
          </span>
          <button 
            className="btn-clear-filters"
            onClick={() => { setMonthFilter('all'); setYearFilter('all'); setCurrentPage(1); }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="totals-container">
        <div className="total-box total-all">
          <span>Total {branchLabel}</span>
          <strong>PKR {totalAmount.toLocaleString()}</strong>
        </div>
        {userRole === 'admin' && !userBranch && (
          <>
            <div className="total-box total-branch-1">
              <span>Branch 1</span>
              <strong>PKR {branch1Total.toLocaleString()}</strong>
            </div>
            <div className="total-box total-branch-2">
              <span>Branch 2</span>
              <strong>PKR {branch2Total.toLocaleString()}</strong>
            </div>
          </>
        )}
      </div>

      <div className="extra-table-wrap">
        <table className="extra-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Amount (PKR)</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  {monthFilter !== 'all' || yearFilter !== 'all' 
                    ? `No expenses found for ${yearFilter !== 'all' ? yearFilter : ''} ${monthFilter !== 'all' ? getMonthName(monthFilter) : ''}`
                    : `No expenses found for ${branchLabel}`}
                </td>
              </tr>
            ) : (
              currentItems.map((exp, index) => (
                <tr key={exp.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                  <td className="text-gray">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="expense-desc">{exp.description}</td>
                  <td className="amount-cell">PKR {exp.amount.toLocaleString()}</td>
                  <td>
                    <span className="date-badge">
                      <Calendar size={12} />
                      {formatDate(exp.date)}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      {/* ✅ Edit - Admin aur Manager dono kar sakte hain */}
                      <button 
                        className="btn-edit" 
                        onClick={() => openEditModal(exp)}
                        title="Edit"
                        disabled={!canAddExpense()}
                        style={!canAddExpense() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <Edit size={15} />
                      </button>
                      {/* ✅ Delete - SIRF ADMIN kar sakta hai */}
                      {canDeleteExpense() && (
                        <button 
                          className="btn-delete" 
                          onClick={() => handleDelete(exp.id)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages || 1}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>

      {/* ===== ADD/EDIT MODAL ===== */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <Filter size={20} className="modal-icon" />
                <h3>{editingExpense ? 'Edit Extra Expense' : 'Add Extra Expense'}</h3>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter expense description"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (PKR) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter amount"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Branch *</label>
                  <select
                    className="form-input"
                    value={newExpense.branch}
                    onChange={(e) => setNewExpense({ ...newExpense, branch: parseInt(e.target.value) })}
                    disabled={!!userBranch}
                    style={userBranch ? { opacity: 0.7, cursor: 'not-allowed', fontWeight: 500 } : { fontWeight: 500 }}
                  >
                    <option value={1}>Branch 1</option>
                    <option value={2}>Branch 2</option>
                  </select>
                  {userBranch && (
                    <small className="field-hint">Branch locked to {branchLabel}</small>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
                <small className="field-hint">Leave empty to use today's date</small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={editingExpense ? handleEditExpense : handleAddExpense}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingExpense ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtraExpense;