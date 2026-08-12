// src/components/FixedExpense/FixedExpense.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, DollarSign, X, Calendar, Clock, Building, CreditCard, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import './FixedExpense.css';
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

const FixedExpense = () => {
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
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
  }, []);

  const getCurrentDueDate = (dueDateStr) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    if (dueDateStr && /^\d{1,2}$/.test(dueDateStr.trim())) {
      const day = parseInt(dueDateStr.trim());
      return new Date(currentYear, currentMonth, day);
    }
    else if (dueDateStr && /^(\d{1,2})(st|nd|rd|th)?$/.test(dueDateStr.trim())) {
      const day = parseInt(dueDateStr.trim());
      return new Date(currentYear, currentMonth, day);
    }
    else if (dueDateStr && /^\d{4}-\d{2}-\d{2}$/.test(dueDateStr.trim())) {
      return new Date(dueDateStr.trim());
    }
    return null;
  };

  const formatDueDate = (dueDateStr) => {
    const date = getCurrentDueDate(dueDateStr);
    if (date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('en-PK', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    }
    return dueDateStr || 'N/A';
  };

  const fetchExpenses = useCallback(async (branch) => {
    setFetching(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/expenses/fixed/all`;
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
          name: exp.name,
          amount: parseFloat(exp.amount) || 0,
          branch: exp.branch_id,
          dueDate: exp.due_date || '',
          paid: !!exp.paid,
          lastPaid: exp.last_paid || 'Never',
          history: exp.last_paid && exp.paid
            ? [{ date: exp.last_paid, amount: parseFloat(exp.amount) || 0, status: 'Paid' }]
            : []
        }));
        setExpenses(mapped);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching fixed expenses:', error);
      setExpenses([]);
      showToaster('Failed to load fixed expenses', 'error');
    }
    setFetching(false);
  }, [userBranch]);

  const handleRefresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/expenses/fixed/all`;
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
          name: exp.name,
          amount: parseFloat(exp.amount) || 0,
          branch: exp.branch_id,
          dueDate: exp.due_date || '',
          paid: !!exp.paid,
          lastPaid: exp.last_paid || 'Never',
          history: exp.last_paid && exp.paid
            ? [{ date: exp.last_paid, amount: parseFloat(exp.amount) || 0, status: 'Paid' }]
            : []
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
    name: '',
    amount: '',
    branch: 1,
    dueDate: '',
  });

  const [payAmount, setPayAmount] = useState('');

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

  const getExpenseMonthYear = (expense) => {
    if (expense.dueDate) {
      const dateMatch = expense.dueDate.match(/(\d{4})-(\d{2})/);
      if (dateMatch) {
        return { year: dateMatch[1], month: dateMatch[2] };
      }
    }
    
    if (expense.lastPaid && expense.lastPaid !== 'Never') {
      const dateMatch = expense.lastPaid.match(/(\d{4})-(\d{2})/);
      if (dateMatch) {
        return { year: dateMatch[1], month: dateMatch[2] };
      }
    }
    
    return null;
  };

  const filtered = expenses.filter(e => {
    const searchMatch = e.name.toLowerCase().includes(search.toLowerCase());
    
    let branchMatch = true;
    if (userBranch) {
      branchMatch = e.branch === parseInt(userBranch);
    }

    const expMonthYear = getExpenseMonthYear(e);
    
    let monthMatch = true;
    let yearMatch = true;
    
    if (expMonthYear) {
      if (monthFilter !== 'all') {
        monthMatch = expMonthYear.month === monthFilter;
      }
      if (yearFilter !== 'all') {
        yearMatch = expMonthYear.year === yearFilter;
      }
    } else {
      monthMatch = monthFilter === 'all';
      yearMatch = yearFilter === 'all';
    }
    
    return searchMatch && branchMatch && monthMatch && yearMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const canManageExpenses = () => {
    return userRole === 'admin' || userRole === 'manager';
  };

  // ✅ Sirf Admin delete kar sakta hai
  const canDeleteExpense = () => {
    return userRole === 'admin';
  };

  const handleAddExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !newExpense.dueDate) {
      showToaster('Please fill all fields', 'error');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/fixed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newExpense.name,
          amount: parseInt(newExpense.amount),
          branch_id: branch,
          due_date: newExpense.dueDate,
          paid: false,
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
        setNewExpense({ name: '', amount: '', branch: 1, dueDate: '' });
        setShowModal(false);
        showToaster('Fixed expense added successfully!', 'success');
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
    if (!newExpense.name || !newExpense.amount || !newExpense.dueDate) {
      showToaster('Please fill all fields', 'error');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newExpense.branch);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/fixed/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newExpense.name,
          amount: parseInt(newExpense.amount),
          branch_id: branch,
          due_date: newExpense.dueDate,
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
        setNewExpense({ name: '', amount: '', branch: 1, dueDate: '' });
        setShowModal(false);
        setEditingExpense(null);
        showToaster('Fixed expense updated successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to update expense', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }

    setLoading(false);
  };

  const handlePayExpense = async () => {
    if (!payAmount || parseInt(payAmount) <= 0) {
      showToaster('Please enter valid amount', 'error');
      return;
    }

    const amount = parseInt(payAmount);
    
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/expenses/fixed/${selectedExpense.id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToaster(data.message || 'Failed to pay expense', 'error');
        setLoading(false);
        return;
      }

      if (data.success) {
        await handleRefresh();
        setPayAmount('');
        setShowPayModal(false);
        setSelectedExpense(null);
        showToaster('Payment recorded successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to pay expense', 'error');
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
      
      const response = await fetch(`${API_URL}/expenses/fixed/${id}`, {
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
        showToaster('Fixed expense deleted successfully!', 'success');
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
    if (!canManageExpenses()) {
      showToaster('Only managers and admins can add expenses', 'error');
      return;
    }

    setEditingExpense(null);
    setNewExpense({ 
      name: '', 
      amount: '', 
      branch: userBranch ? parseInt(userBranch) : 1, 
      dueDate: '' 
    });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    if (!canManageExpenses()) {
      showToaster('Only managers and admins can edit expenses', 'error');
      return;
    }

    setEditingExpense(expense);
    setNewExpense({
      name: expense.name,
      amount: expense.amount.toString(),
      branch: expense.branch,
      dueDate: expense.dueDate,
    });
    setShowModal(true);
  };

  const openPayModal = (expense) => {
    if (!canManageExpenses()) {
      showToaster('Only managers and admins can pay expenses', 'error');
      return;
    }

    setSelectedExpense(expense);
    setPayAmount(expense.amount.toString());
    setShowPayModal(true);
  };

  const openHistoryModal = (expense) => {
    setSelectedExpense(expense);
    setShowHistoryModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setNewExpense({ name: '', amount: '', branch: 1, dueDate: '' });
  };

  const getMonthNameFromDate = (dateStr) => {
    const date = new Date(dateStr.split(' ')[0]);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDateOnly = (dateStr) => {
    return dateStr.split(' ')[0];
  };

  const getTimeOnly = (dateStr) => {
    const parts = dateStr.split(' ');
    return parts.slice(1).join(' ');
  };

  const totalExpenses = filtered.length;
  const totalPaid = filtered.filter(e => e.paid).length;
  const totalPending = filtered.filter(e => !e.paid).length;
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const allYears = getAllYears();
  const allMonths = getAllMonths();

  const getAvailableYears = () => {
    const years = new Set();
    const filteredExpenses = userBranch ? expenses.filter(e => e.branch === parseInt(userBranch)) : expenses;
    filteredExpenses.forEach(exp => {
      const info = getExpenseMonthYear(exp);
      if (info) {
        years.add(info.year);
      }
    });
    return Array.from(years).sort();
  };

  const getAvailableMonths = () => {
    const months = new Set();
    const filteredExpenses = userBranch ? expenses.filter(e => e.branch === parseInt(userBranch)) : expenses;
    filteredExpenses.forEach(exp => {
      const info = getExpenseMonthYear(exp);
      if (info) {
        months.add(info.month);
      }
    });
    return Array.from(months).sort();
  };

  const availableYears = getAvailableYears();
  const availableMonths = getAvailableMonths();

  const getExportData = useCallback(() => {
    return filtered.map(exp => ({
      name: exp.name || 'N/A',
      amount: exp.amount || 0,
      branch: exp.branch === 1 ? 'Branch 1' : 'Branch 2',
      dueDate: formatDueDate(exp.dueDate),
      status: exp.paid ? 'Paid' : 'Pending',
      lastPaid: exp.lastPaid || 'Never',
    }));
  }, [filtered]);

  const exportColumns = useMemo(() => [
    { header: 'Expense Name', key: 'name' },
    { header: 'Amount (PKR)', key: 'amount' },
    { header: 'Branch', key: 'branch' },
    { header: 'Due Date', key: 'dueDate' },
    { header: 'Status', key: 'status' },
    { header: 'Last Paid', key: 'lastPaid' },
  ], []);

  const getHistoryExportData = useCallback(() => {
    if (!selectedExpense) return [];

    const rows = selectedExpense.history && selectedExpense.history.length > 0
      ? selectedExpense.history
      : [null];

    return rows.map((h) => ({
      expenseName: selectedExpense.name || 'N/A',
      branch: selectedExpense.branch === 1 ? 'Branch 1' : 'Branch 2',
      originalAmount: selectedExpense.amount || 0,
      dueDate: formatDueDate(selectedExpense.dueDate),
      status: selectedExpense.paid ? 'Paid' : 'Pending',
      paymentDate: h ? getDateOnly(h.date) : '-',
      paymentTime: h ? getTimeOnly(h.date) : '-',
      paymentAmount: h ? h.amount : 0,
      paymentStatus: h ? h.status : '-',
    }));
  }, [selectedExpense]);

  const historyExportColumns = useMemo(() => [
    { header: 'Expense Name', key: 'expenseName' },
    { header: 'Branch', key: 'branch' },
    { header: 'Original Amount (PKR)', key: 'originalAmount' },
    { header: 'Due Date', key: 'dueDate' },
    { header: 'Current Status', key: 'status' },
    { header: 'Payment Date', key: 'paymentDate' },
    { header: 'Payment Time', key: 'paymentTime' },
    { header: 'Payment Amount (PKR)', key: 'paymentAmount' },
    { header: 'Payment Status', key: 'paymentStatus' },
  ], []);

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
      value: totalPaid,
      label: 'Paid',
      icon: CheckCircle,
      color: '#15803d',
      bg: 'rgba(34, 197, 94, 0.12)',
      className: 'stat-paid'
    },
    {
      value: totalPending,
      label: 'Pending',
      icon: AlertCircle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'stat-pending'
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

  if (fetching && expenses.length === 0) {
    return (
      <div className="fixed-expense-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading fixed expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed-expense-container">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="expense-header">
        <div className="header-left">
          <div className="header-title-group">
            <h3>Fixed Expenses</h3>
            <span className="live-badge">
              <Clock size={12} /> Active
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        </div>

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
            filename="fixed-expenses-report"
            title="Fixed Expenses Report"
          />
          {canManageExpenses() && (
            <button className="btn-accent" onClick={openAddModal}>
              <Plus size={18} />
              Add Fixed Expense
            </button>
          )}
          <button className="btn-refresh-small" onClick={handleRefresh} title="Refresh" style={{
            padding: '8px 12px',
            background: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#4b5563',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600
          }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="expense-controls">
        <div className="expense-search">
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

        <div className="filter-group" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="filter-label" style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Year:</span>
            <select
              className="filter-select"
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: 'white', cursor: 'pointer', minWidth: '100px', fontWeight: 500 }}
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

          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="filter-label" style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Month:</span>
            <select
              className="filter-select"
              value={monthFilter}
              onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: 'white', cursor: 'pointer', minWidth: '100px', fontWeight: 500 }}
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
        <div className="filter-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#eff6ff', borderRadius: '8px', marginBottom: '12px', border: '1px solid #bfdbfe' }}>
          <span style={{ fontWeight: 600 }}>
            Showing: 
            {yearFilter !== 'all' && ` Year ${yearFilter}`}
            {monthFilter !== 'all' && ` • ${getMonthName(monthFilter)}`}
            {yearFilter === 'all' && monthFilter === 'all' && ' All Expenses'}
          </span>
          <button 
            className="btn-clear-filters"
            onClick={() => { setMonthFilter('all'); setYearFilter('all'); setCurrentPage(1); }}
            style={{ padding: '4px 14px', background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="expense-table-wrap">
        <table className="expense-table">
          <thead>
            <tr style={{ background: '#1E1B4B' }}>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>#</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Expense Name</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Amount (PKR)</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Due Date</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Last Paid</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  {monthFilter !== 'all' || yearFilter !== 'all' 
                    ? `No expenses found for ${yearFilter !== 'all' ? yearFilter : ''} ${monthFilter !== 'all' ? getMonthName(monthFilter) : ''}`
                    : `No expenses found for ${branchLabel}`}
                </td>
              </tr>
            ) : (
              currentItems.map((exp, index) => (
                <tr key={exp.id} className={exp.paid ? 'paid-row' : 'pending-row'}>
                  <td className="text-gray">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="expense-name">{exp.name}</td>
                  <td className="amount-cell">PKR {exp.amount.toLocaleString()}</td>
                  <td>
                    <span className="due-date-badge">
                      <Calendar size={12} />
                      {formatDueDate(exp.dueDate)}
                    </span>
                  </td>
                  <td>
                    <span className={exp.paid ? 'badge-active' : 'badge-pending'}>
                      {exp.paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="last-paid">{exp.lastPaid || 'Never'}</td>
                  <td>
                    <div className="action-group">
                      <button 
                        className="btn-view" 
                        onClick={() => openHistoryModal(exp)}
                        title="View History"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        className="btn-edit" 
                        onClick={() => openEditModal(exp)}
                        title="Edit"
                        disabled={!canManageExpenses()}
                        style={!canManageExpenses() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <Edit size={15} />
                      </button>
                      {!exp.paid && (
                        <button 
                          className="btn-pay" 
                          onClick={() => openPayModal(exp)}
                          title="Pay Now"
                          disabled={!canManageExpenses()}
                          style={!canManageExpenses() ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          <DollarSign size={15} />
                        </button>
                      )}
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
                <CreditCard size={20} className="modal-icon" />
                <h3>{editingExpense ? 'Edit Fixed Expense' : 'Add Fixed Expense'}</h3>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Expense Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter expense name"
                  value={newExpense.name}
                  onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
                />
              </div>

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

              <div className="form-row">
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
                    <small className="field-hint" style={{ fontWeight: 500 }}>Branch locked to {branchLabel}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 1st of every month or 2026-07-01"
                    value={newExpense.dueDate}
                    onChange={(e) => setNewExpense({ ...newExpense, dueDate: e.target.value })}
                  />
                  <small className="field-hint" style={{ fontWeight: 500 }}>
                    Format: "1st of every month" OR "YYYY-MM-DD" (e.g., 2026-07-01)
                  </small>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal} style={{ fontWeight: 700 }}>
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={editingExpense ? handleEditExpense : handleAddExpense}
                style={{ fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingExpense ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PAY MODAL ===== */}
      {showPayModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal-content pay-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <DollarSign size={20} className="modal-icon" />
                <h3>Pay - {selectedExpense.name}</h3>
              </div>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="pay-info">
                <div className="pay-info-row">
                  <span>Expense</span>
                  <strong>{selectedExpense.name}</strong>
                </div>
                <div className="pay-info-row">
                  <span>Original Amount</span>
                  <strong>PKR {selectedExpense.amount.toLocaleString()}</strong>
                </div>
                <div className="pay-info-row">
                  <span>Due Date</span>
                  <strong>{formatDueDate(selectedExpense.dueDate)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Pay Amount (PKR) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className="pay-note">
                <Clock size={16} className="pay-icon" />
                <p>This payment will be recorded with current date & time</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowPayModal(false)} style={{ fontWeight: 700 }}>
                Cancel
              </button>
              <button 
                className="btn-pay-save" 
                onClick={handlePayExpense}
                style={{ fontWeight: 700 }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HISTORY MODAL ===== */}
      {showHistoryModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <Clock size={20} className="modal-icon" />
                <h3>Payment History - {selectedExpense.name}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ExportButton
                  data={getHistoryExportData()}
                  columns={historyExportColumns}
                  filename={`${selectedExpense.name}-payment-history`}
                  title={`Payment History - ${selectedExpense.name}`}
                />
                <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              <div className="history-summary">
                <div className="summary-item" style={{ background: 'rgba(30, 27, 75, 0.06)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Total Paid</span>
                  <strong style={{ fontSize: '1.1rem', color: '#1E1B4B' }}>
                    PKR {selectedExpense.history.reduce((sum, h) => sum + h.amount, 0).toLocaleString()}
                  </strong>
                </div>
                <div className="summary-item" style={{ background: 'rgba(37, 99, 235, 0.08)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Total Payments</span>
                  <strong style={{ fontSize: '1.1rem', color: '#2563eb' }}>{selectedExpense.history.length}</strong>
                </div>
                <div className="summary-item" style={{ background: selectedExpense.paid ? 'rgba(34, 197, 94, 0.08)' : 'rgba(220, 38, 38, 0.08)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Status</span>
                  <strong className={selectedExpense.paid ? 'text-green' : 'text-yellow'} style={{ fontSize: '1.1rem' }}>
                    {selectedExpense.paid ? 'Paid' : 'Pending'}
                  </strong>
                </div>
              </div>

              <div className="history-list">
                <div className="history-list-header">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Payment History</h4>
                  <span className="history-count" style={{ fontWeight: 600 }}>{selectedExpense.history.length} entries</span>
                </div>
                {selectedExpense.history.length === 0 ? (
                  <p className="no-history">No payment history found</p>
                ) : (
                  selectedExpense.history.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-left">
                        <span className="history-date" style={{ fontWeight: 700 }}>{getMonthNameFromDate(item.date)}</span>
                        <span className="history-date-full">
                          {getDateOnly(item.date)} • {getTimeOnly(item.date)}
                        </span>
                      </div>
                      <div className="history-center">
                        <span className="history-amount" style={{ fontWeight: 800, fontSize: '1rem' }}>
                          PKR {item.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="history-right">
                        <span className="history-status paid" style={{ fontWeight: 700 }}>
                          <CheckCircle size={12} />
                          Paid
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowHistoryModal(false)} style={{ fontWeight: 700 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedExpense;