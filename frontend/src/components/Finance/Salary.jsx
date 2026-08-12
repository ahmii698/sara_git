// src/components/Salary/Salary.jsx

import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, DollarSign, RefreshCw, X, Wallet, Users, Calendar, Clock, Award, Building, CheckCircle, AlertCircle, TrendingUp, Landmark, Minus, ClipboardList } from 'lucide-react';
import './Salary.css';
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

// ✅ Reusable styled buttons
const deductBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '6px 12px',
  fontSize: '0.75rem',
  fontWeight: 700,
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const loanSummaryBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '30px',
  height: '30px',
  background: '#fee2e2',
  color: '#991b1b',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const Salary = () => {
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showLoanSummaryModal, setShowLoanSummaryModal] = useState(false);
  const [deductAmounts, setDeductAmounts] = useState({});
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceReason, setAdvanceReason] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanReason, setLoanReason] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [advanceData, setAdvanceData] = useState([]);
  const [loanData, setLoanData] = useState([]);

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
    }
    fetchAllData();
  }, []);

  const mapLoan = (l) => {
    const amount = parseFloat(l.amount) || 0;
    const paidAmount = parseFloat(l.paid_amount) || 0;
    const remaining = Math.max(amount - paidAmount, 0);
    const payments = (l.payments || []).map(p => ({
      date: p.date,
      amount: parseFloat(p.amount) || 0,
      applied: !!p.applied
    }));
    return {
      id: l.id,
      date: l.date,
      amount: amount,
      paidAmount: paidAmount,
      remaining: remaining,
      reason: l.reason,
      deducted: l.deducted,
      payments: payments,
      pendingApplication: payments.filter(p => !p.applied).reduce((s, p) => s + p.amount, 0)
    };
  };

  const buildEmployeesFromResponses = (employeesList, salData, advData, loanRespData) => {
    return employeesList.map((emp) => {
      const accountCount = emp.accounts_count || 0;

      const salary = salData.success ? salData.data.find(s => s.user_id === emp.id) : null;
      const advances = advData.success ? advData.data.filter(a => a.user_id === emp.id) : [];
      const loans = loanRespData.success
        ? loanRespData.data.filter(l => l.user_id === emp.id).map(mapLoan)
        : [];

      const totalAdvances = advances
        .filter(a => !a.deducted)
        .reduce((sum, a) => sum + parseFloat(a.amount), 0);

      const deductedAdvances = advances
        .filter(a => a.deducted)
        .reduce((sum, a) => sum + parseFloat(a.amount), 0);

      const totalLoans = loans.reduce((sum, l) => sum + l.remaining, 0);
      const totalLoanGiven = loans.reduce((sum, l) => sum + l.amount, 0);
      const pendingLoanDeduction = loans.reduce((sum, l) => sum + l.pendingApplication, 0);

      return {
        id: emp.id,
        name: emp.name,
        branch: emp.branch_id,
        salary: parseFloat(emp.salary) || 0,
        commission: salary ? parseFloat(salary.commission) || 0 : 0,
        paid: salary ? salary.status === 'paid' : false,
        lastPaid: salary ? salary.paid_date : 'Never',
        totalAdvances: totalAdvances,
        deductedAdvances: deductedAdvances,
        totalLoans: totalLoans,
        totalLoanGiven: totalLoanGiven,
        pendingLoanDeduction: pendingLoanDeduction,
        accountCount: accountCount,
        history: salary ? [{
          date: salary.paid_date || '2026-06-01',
          amount: salary.total_paid || 0,
          status: 'Paid',
          type: 'salary'
        }] : [],
        advances: advances.map(a => ({
          date: a.date,
          amount: a.amount,
          reason: a.reason,
          deducted: a.deducted
        })),
        loans: loans,
        salaryRecord: salary,
        currentMonth: new Date().toISOString().slice(0, 7)
      };
    });
  };

  // ✅ FIXED: loadSalaryData - loanRespData ka error fix
  const loadSalaryData = async () => {
    const token = localStorage.getItem('token');

    const [empRes, salRes, advRes, loanRes] = await Promise.all([
      fetch(`${API_URL}/users?role=employee&paginate=false`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/salary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/salary/advances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/loans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    // ✅ Sahi variable name - loanDataResponse, loanRespData.json() ki jagah loanRes.json()
    const [empData, salData, advData, loanDataResponse] = await Promise.all([
      empRes.json(),
      salRes.json(),
      advRes.json(),
      loanRes.json()
    ]);

    if (!empData.success) return;

    const employeesList = Array.isArray(empData.data) ? empData.data : (empData.data.data || []);

    // ✅ loanDataResponse use karo
    const employeesWithCounts = buildEmployeesFromResponses(employeesList, salData, advData, loanDataResponse);

    setEmployees(employeesWithCounts);
    setSalaryData(salData.success ? salData.data : []);
    setAdvanceData(advData.success ? advData.data : []);
    setLoanData(loanDataResponse.success ? loanDataResponse.data : []);

    setSelectedEmployee(prev => {
      if (!prev) return prev;
      const fresh = employeesWithCounts.find(e => e.id === prev.id);
      return fresh || prev;
    });
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await loadSalaryData();
    } catch (error) {
      console.error('Error fetching data:', error);
      showToaster('Failed to load salary data', 'error');
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    try {
      await loadSalaryData();
      showToaster('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToaster('Failed to refresh data', 'error');
    }
  };

  const canManageSalary = () => {
    return userRole === 'admin' || userRole === 'manager';
  };

  // ✅ Sirf Admin loan de sakta hai
  const canGiveLoan = () => {
    return userRole === 'admin';
  };

  // ✅ Manager bhi loan deduct kar sakta hai (canManageSalary hi kaafi hai)
  // canManageSalary() already true for manager

  const filtered = employees.filter(e => {
    const searchMatch = e.name.toLowerCase().includes(search.toLowerCase());
    let branchMatch = true;
    if (userBranch) {
      branchMatch = e.branch === parseInt(userBranch);
    }
    return searchMatch && branchMatch;
  });

  const getCurrentDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  };

  const formatLastPaid = (dateStr) => {
    if (!dateStr) return 'Never';
    if (dateStr === 'Never') return 'Never';
    const parts = dateStr.split('T');
    if (parts.length > 1) {
      return parts[0];
    }
    return dateStr;
  };

  const getExportData = () => {
    return filtered.map(emp => ({
      name: emp.name,
      branch: emp.branch === 1 ? 'Branch 1' : 'Branch 2',
      salary: emp.salary,
      commission: emp.commission,
      accounts: emp.accountCount || 0,
      advances: emp.totalAdvances,
      loans: emp.totalLoans,
      pendingLoanDeduction: emp.pendingLoanDeduction,
      status: emp.paid ? 'Paid' : 'Pending'
    }));
  };

  const exportColumns = [
    { header: 'Employee Name', key: 'name' },
    { header: 'Branch', key: 'branch' },
    { header: 'Salary (PKR)', key: 'salary' },
    { header: 'Commission (PKR)', key: 'commission' },
    { header: 'Accounts', key: 'accounts' },
    { header: 'Advances (PKR)', key: 'advances' },
    { header: 'Loans (PKR)', key: 'loans' },
    { header: 'Pending Loan Deduction (PKR)', key: 'pendingLoanDeduction' },
    { header: 'Status', key: 'status' },
  ];

  const handlePayNow = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const emp = employees.find(e => e.id === id);
      
      let salaryRecord = salaryData.find(s => s.user_id === id);
      
      let response;
      if (salaryRecord) {
        response = await fetch(`${API_URL}/salary/${salaryRecord.id}/pay`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        const month = new Date().toISOString().slice(0, 7);
        const finalSalary = emp.salary - emp.totalAdvances;
        const totalPaid = finalSalary + emp.commission;
        
        response = await fetch(`${API_URL}/salary`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: id,
            month: month,
            salary_amount: emp.salary,
            commission: emp.commission,
            advances: emp.totalAdvances,
            total_paid: totalPaid,
            status: 'paid',
            paid_date: new Date().toISOString().slice(0, 10)
          })
        });
      }

      const data = await response.json();
      
      if (data.success) {
        const advancesToDeduct = advanceData.filter(a => a.user_id === id && !a.deducted);
        await Promise.all(advancesToDeduct.map(adv =>
          fetch(`${API_URL}/salary/advances/${adv.id}/deduct`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ));

        await loadSalaryData();

        if (salaryRecord && data.loan_deducted > 0) {
          showToaster(`Salary paid successfully! PKR ${Number(data.loan_deducted).toLocaleString()} loan deduction applied.`, 'success');
        } else {
          showToaster('Salary paid successfully!', 'success');
        }
      } else {
        showToaster(data.message || 'Failed to pay salary', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleAddAdvance = async (id) => {
    if (!advanceAmount || parseInt(advanceAmount) <= 0) {
      showToaster('Please enter a valid amount', 'error');
      return;
    }

    const amount = parseInt(advanceAmount);
    const reason = advanceReason.trim() || 'No reason provided';
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/salary/advances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: id,
          amount: amount,
          reason: reason,
          date: new Date().toISOString().slice(0, 19).replace('T', ' ')
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadSalaryData();
        setAdvanceAmount('');
        setAdvanceReason('');
        setShowAdvanceModal(false);
        showToaster('Advance added successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to add advance', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleAddLoan = async (id) => {
    if (!loanAmount || parseInt(loanAmount) <= 0) {
      showToaster('Please enter a valid amount', 'error');
      return;
    }

    const amount = parseInt(loanAmount);
    const reason = loanReason.trim() || 'No reason provided';
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: id,
          amount: amount,
          reason: reason,
          date: new Date().toISOString().slice(0, 19).replace('T', ' ')
        })
      });

      const data = await response.json();
      
      if (data.success) {
        await loadSalaryData();
        setLoanAmount('');
        setLoanReason('');
        setShowLoanModal(false);
        showToaster('Loan added successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to add loan', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleDeductLoanInline = async (loan) => {
    const rawAmount = deductAmounts[loan.id];
    const amount = parseFloat(rawAmount);

    if (!rawAmount || isNaN(amount) || amount <= 0) {
      showToaster('Please enter a valid amount', 'error');
      return;
    }

    if (amount > loan.remaining) {
      showToaster(`Amount exceeds remaining loan balance: PKR ${loan.remaining.toLocaleString()}`, 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/loans/${loan.id}/deduct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (data.success) {
        await loadSalaryData();
        setDeductAmounts(prev => ({ ...prev, [loan.id]: '' }));
        showToaster('Loan amount deducted successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to deduct loan', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleReset = async (id) => {
    if (!window.confirm('Reset this employee\'s salary for the current month?\n\nThis will:\n• Mark as Pending\n• Remove Paid Date\n• Reset Commission to 0\n• Reset Total Paid to 0\n• Close out (finalize) any pending advance/loan deductions so they don\'t carry into the next cycle')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const salaryRecord = salaryData.find(s => s.user_id === id);
      
      if (salaryRecord) {
        const response = await fetch(`${API_URL}/salary/${salaryRecord.id}/reset`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        if (data.success) {
          await loadSalaryData();
          showToaster('Salary reset successfully! Employee is now pending for the new month.', 'success');
        } else {
          showToaster(data.message || 'Failed to reset salary', 'error');
        }
      } else {
        showToaster('No salary record found for this employee.', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleEditSalary = async (id, newSalary) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          salary: newSalary
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadSalaryData();
        showToaster('Salary updated successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to update salary', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setLoading(false);
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  const handleEditCommission = async (id, newCommission) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let salaryRecord = salaryData.find(s => s.user_id === id);
      
      let response;
      if (salaryRecord) {
        response = await fetch(`${API_URL}/salary/${salaryRecord.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            commission: newCommission
          })
        });
      } else {
        const month = new Date().toISOString().slice(0, 7);
        const emp = employees.find(e => e.id === id);
        response = await fetch(`${API_URL}/salary`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: id,
            month: month,
            salary_amount: emp.salary,
            commission: newCommission,
            advances: 0,
            total_paid: 0,
            status: 'pending'
          })
        });
      }

      const data = await response.json();
      if (data.success) {
        await loadSalaryData();
        showToaster('Commission updated successfully!', 'success');
      } else {
        showToaster(data.message || 'Failed to update commission', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToaster('Network error. Please try again.', 'error');
    }
    setLoading(false);
    setShowEditModal(false);
    setEditingEmployee(null);
  };

  const handleViewHistory = (emp) => {
    setSelectedEmployee(emp);
    setShowHistoryModal(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setShowEditModal(true);
  };

  const openAdvanceModal = (emp) => {
    setSelectedEmployee(emp);
    setAdvanceAmount('');
    setAdvanceReason('');
    setShowAdvanceModal(true);
  };

  const openLoanModal = (emp) => {
    setSelectedEmployee(emp);
    setLoanAmount('');
    setLoanReason('');
    setShowLoanModal(true);
  };

  const openLoanSummaryModal = (emp) => {
    setSelectedEmployee(emp);
    setShowLoanSummaryModal(true);
  };

  const getDateOnly = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split(' ')[0];
  };

  const getTimeOnly = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split(' ');
    return parts.slice(1).join(' ');
  };

  const getMonthName = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.split(' ')[0]);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const totalSalary = filtered.reduce((sum, e) => sum + e.salary, 0);
  const totalCommission = filtered.reduce((sum, e) => sum + e.commission, 0);
  const totalPaid = filtered.filter(e => e.paid).length;
  const totalPending = filtered.filter(e => !e.paid).length;
  const totalEmployees = filtered.length;

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const statChips = [
    {
      value: totalEmployees,
      label: 'Employees',
      icon: Users,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'stat-employees'
    },
    {
      value: totalPaid,
      label: 'Paid',
      icon: CheckCircle,
      color: '#16a34a',
      bg: 'rgba(22, 163, 74, 0.12)',
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
      value: `PKR ${totalSalary.toLocaleString()}`,
      label: 'Total Salary',
      icon: DollarSign,
      color: '#1E1B4B',
      bg: 'rgba(30, 27, 75, 0.10)',
      className: 'stat-salary'
    },
    {
      value: `PKR ${totalCommission.toLocaleString()}`,
      label: 'Commission',
      icon: Award,
      color: '#7C3AED',
      bg: 'rgba(124, 58, 237, 0.12)',
      className: 'stat-commission'
    },
  ];

  if (loading && employees.length === 0) {
    return (
      <div className="salary-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading salary data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="salary-container">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="salary-header">
        <div className="header-left">
          <div className="header-title-group">
            <h3>Employee Salary Management</h3>
            <span className="live-badge">
              <TrendingUp size={12} /> Active
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportButton
            data={getExportData()}
            columns={exportColumns}
            filename="salary-report"
            title="Salary Report"
          />
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
      </div>

      <div className="salary-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="salary-table-wrap">
        <table className="salary-table">
          <thead>
              <tr style={{ background: '#1E1B4B' }}>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Employee</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Salary</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Commission</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Accounts</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Advances</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Loans</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance (PKR)</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
              <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No employees found for {branchLabel}</td>
              </tr>
            ) : (
              filtered.map(emp => {
                let balance;
                if (emp.paid) {
                  balance = 0;
                } else {
                  balance = emp.salary + emp.commission - emp.totalAdvances - emp.pendingLoanDeduction;
                }
                
                return (
                  <tr key={emp.id} className={emp.paid ? 'paid-row' : 'pending-row'}>
                    <td>
                      <div className="employee-name-cell">
                        <div className="emp-avatar" style={{ background: emp.paid ? '#d1fae5' : '#fef3c7', color: emp.paid ? '#065f46' : '#92400e' }}>
                          {emp.name.charAt(0)}
                        </div>
                        {emp.name}
                      </div>
                    </td>
                    <td className="salary-amount" style={{ color: '#1E1B4B', fontWeight: 800 }}>
                      PKR {emp.salary.toLocaleString()}
                    </td>
                    <td>
                      {emp.commission > 0 ? (
                        <span className="commission-badge" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
                          PKR {emp.commission.toLocaleString()}
                        </span>
                      ) : (
                        <span className="no-value">—</span>
                      )}
                    </td>
                    <td>
                      <span className="account-badge" style={{ background: '#f3e8ff', color: '#6b21a8', fontWeight: 700 }}>
                        {emp.accountCount || 0}
                      </span>
                    </td>
                    <td>
                      {emp.totalAdvances > 0 ? (
                        <span className="advance-badge" style={{ background: '#eef2ff', color: '#4338ca', fontWeight: 700 }}>
                          PKR {emp.totalAdvances.toLocaleString()}
                        </span>
                      ) : (
                        <span className="no-value">—</span>
                      )}
                    </td>
                    <td>
                      {emp.totalLoans > 0 ? (
                        <span className="loan-badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 700 }}>
                          PKR {emp.totalLoans.toLocaleString()}
                        </span>
                      ) : (
                        <span className="no-value">—</span>
                      )}
                    </td>
                    <td className="balance-amount" style={{ 
                      fontWeight: 800, 
                      color: balance === 0 ? '#22c55e' : (balance > 0 ? '#1E1B4B' : '#dc2626')
                    }}>
                      PKR {balance.toLocaleString()}
                    </td>
                    <td>
                      <span className={emp.paid ? 'badge-active' : 'badge-pending'} style={{ fontWeight: 700 }}>
                        {emp.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button className="btn-view" onClick={() => handleViewHistory(emp)} title="View History">
                          <Eye size={15} />
                        </button>
                        {canManageSalary() && (
                          <>
                            <button className="btn-edit" onClick={() => openEditModal(emp)} title="Edit Salary">
                              <Edit size={15} />
                            </button>
                            <button className="btn-advance" onClick={() => openAdvanceModal(emp)} title="Give Advance">
                              <Wallet size={15} />
                            </button>
                            {/* ✅ Loan button - SIRF ADMIN KO DIKHEGA */}
                            {canGiveLoan() && (
                              <button className="btn-loan" onClick={() => openLoanModal(emp)} title="Give Loan">
                                <Landmark size={15} />
                              </button>
                            )}
                            {emp.totalLoans > 0 && (
                              <button
                                style={loanSummaryBtnStyle}
                                onClick={() => openLoanSummaryModal(emp)}
                                title="Loan Summary / Deduct"
                              >
                                <ClipboardList size={15} />
                              </button>
                            )}
                            {emp.paid ? (
                              <button className="btn-reset" onClick={() => handleReset(emp.id)} title="Reset">
                                <RefreshCw size={15} />
                              </button>
                            ) : (
                              <button className="btn-pay" onClick={() => handlePayNow(emp.id)} title="Pay Now" disabled={loading}>
                                <DollarSign size={15} />
                                Pay
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== LOAN SUMMARY MODAL ===== */}
      {showLoanSummaryModal && selectedEmployee && (
        <div className="salary-modal-overlay" onClick={() => setShowLoanSummaryModal(false)}>
          <div className="salary-modal-content salary-modal-advance" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <div className="salary-modal-header-left">
                <ClipboardList size={20} className="salary-modal-icon" />
                <h3 style={{ fontSize: '1.3rem' }}>Loan Summary</h3>
              </div>
              <button className="salary-modal-close" onClick={() => setShowLoanSummaryModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="salary-modal-body">
              <div className="employee-detail-header small">
                <div className="emp-detail-avatar small" style={{ background: '#1E1B4B' }}>
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Branch {selectedEmployee.branch}</span>
                </div>
              </div>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Salary</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#1E1B4B', textAlign: 'right' }}>
                        PKR {selectedEmployee.salary.toLocaleString()}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Commission</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#8B5CF6', textAlign: 'right' }}>
                        PKR {selectedEmployee.commission.toLocaleString()}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Advance Taken</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#4338ca', textAlign: 'right' }}>
                        PKR {selectedEmployee.totalAdvances.toLocaleString()}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Loan Amount (Total Given)</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#1E1B4B', textAlign: 'right' }}>
                        PKR {selectedEmployee.totalLoanGiven.toLocaleString()}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>Pending Loan</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#dc2626', textAlign: 'right' }}>
                        PKR {selectedEmployee.totalLoans.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>Pending Salary</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#22c55e', textAlign: 'right', fontSize: '1rem' }}>
                        PKR {(selectedEmployee.paid ? 0 : selectedEmployee.salary + selectedEmployee.commission - selectedEmployee.totalAdvances - selectedEmployee.pendingLoanDeduction).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E1B4B', marginBottom: '0.5rem' }}>Active Loans</h4>
              {selectedEmployee.loans.filter(l => l.remaining > 0).length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No pending loans.</p>
              ) : (
                selectedEmployee.loans.filter(l => l.remaining > 0).map((loan) => (
                  <div
                    key={loan.id}
                    style={{
                      border: '1px solid #fecaca',
                      background: '#fef2f2',
                      borderRadius: '0.65rem',
                      padding: '0.75rem',
                      marginBottom: '0.6rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#7f1d1d' }}>
                        {loan.reason} • {getDateOnly(loan.date)}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>
                        Remaining: PKR {loan.remaining.toLocaleString()}
                      </span>
                    </div>
                    {/* ✅ Manager bhi loan deduct kar sakta hai - canManageSalary() true hai */}
                    {canManageSalary() && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="number"
                          placeholder="Amount to deduct"
                          value={deductAmounts[loan.id] || ''}
                          onChange={(e) => setDeductAmounts(prev => ({ ...prev, [loan.id]: e.target.value }))}
                          min="1"
                          max={loan.remaining}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: '1px solid #fca5a5',
                            borderRadius: '6px'
                          }}
                        />
                        <button
                          style={deductBtnStyle}
                          onClick={() => handleDeductLoanInline(loan)}
                          disabled={loading}
                        >
                          <Minus size={13} /> Deduct
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="salary-modal-footer">
              <button className="btn-cancel" onClick={() => setShowLoanSummaryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== HISTORY MODAL ===== */}
      {showHistoryModal && selectedEmployee && (
        <div className="salary-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="salary-modal-content salary-modal-history" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <div className="salary-modal-header-left">
                <Clock size={20} className="salary-modal-icon" />
                <h3 style={{ fontSize: '1.3rem' }}>Salary History</h3>
              </div>
              <button className="salary-modal-close" onClick={() => setShowHistoryModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="salary-modal-body">
              <div className="employee-detail-header">
                <div className="emp-detail-avatar" style={{ background: '#1E1B4B', fontSize: '1.1rem' }}>
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Branch {selectedEmployee.branch} • {selectedEmployee.accountCount} Accounts
                  </span>
                </div>
              </div>

              <div className="history-summary">
                <div className="summary-item" style={{ background: 'rgba(30, 27, 75, 0.06)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Salary</span>
                  <strong style={{ fontSize: '1.1rem', color: '#1E1B4B' }}>PKR {selectedEmployee.salary.toLocaleString()}</strong>
                </div>
                <div className="summary-item" style={{ background: 'rgba(139, 92, 246, 0.08)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Commission</span>
                  <strong style={{ fontSize: '1.1rem', color: '#8B5CF6' }}>PKR {selectedEmployee.commission.toLocaleString()}</strong>
                </div>
                <div className="summary-item" style={{ background: 'rgba(34, 197, 94, 0.08)', borderRadius: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534' }}>Remaining Salary</span>
                  <strong style={{ fontSize: '1.1rem', color: '#22c55e' }}>
                    PKR {(
                      selectedEmployee.salary + 
                      selectedEmployee.commission - 
                      selectedEmployee.totalAdvances -
                      selectedEmployee.pendingLoanDeduction
                    ).toLocaleString()}
                  </strong>
                </div>
              </div>

              {selectedEmployee.advances.filter(a => !a.deducted).length > 0 && (
                <div className="advances-section">
                  <div className="advances-header">
                    <Wallet size={16} style={{ color: '#4338ca' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4338ca' }}>Salary Advances</h4>
                    <span className="advances-total" style={{ fontWeight: 700 }}>
                      Total: PKR {selectedEmployee.totalAdvances.toLocaleString()}
                    </span>
                  </div>
                  <div className="advances-table-wrap">
                    <table className="advances-table">
                      <thead>
                        <tr>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Date & Time</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Amount</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmployee.advances.filter(a => !a.deducted).map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="advance-date-time">
                                <span className="adv-date" style={{ fontWeight: 600 }}>{getDateOnly(item.date)}</span>
                                <span className="adv-time" style={{ fontSize: '0.6rem' }}>{getTimeOnly(item.date)}</span>
                              </div>
                            </td>
                            <td className="advance-amount-cell" style={{ color: '#dc2626', fontWeight: 700 }}>
                              -PKR {item.amount.toLocaleString()}
                            </td>
                            <td className="advance-reason-cell" style={{ fontWeight: 500 }}>{item.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="remaining-salary" style={{ fontWeight: 700 }}>
                    <span style={{ fontSize: '0.9rem' }}>Remaining Salary </span>
                    <strong style={{ fontSize: '1.1rem', color: '#1E1B4B' }}>
                      PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances).toLocaleString()}
                    </strong>
                  </div>
                </div>
              )}

              {selectedEmployee.loans.length > 0 && (
                <div className="advances-section">
                  <div className="advances-header">
                    <Landmark size={16} style={{ color: '#991b1b' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b' }}>Loans</h4>
                    <span className="advances-total" style={{ fontWeight: 700 }}>
                      Pending: PKR {selectedEmployee.totalLoans.toLocaleString()}
                    </span>
                  </div>
                  <div className="advances-table-wrap">
                    <table className="advances-table">
                      <thead>
                        <tr>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Date</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Loan Amount</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Paid</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Remaining</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Reason</th>
                          {canManageSalary() && <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEmployee.loans.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="advance-date-time">
                                <span className="adv-date" style={{ fontWeight: 600 }}>{getDateOnly(item.date)}</span>
                                <span className="adv-time" style={{ fontSize: '0.6rem' }}>{getTimeOnly(item.date)}</span>
                              </div>
                            </td>
                            <td style={{ fontWeight: 700 }}>PKR {item.amount.toLocaleString()}</td>
                            <td style={{ color: '#22c55e', fontWeight: 700 }}>PKR {item.paidAmount.toLocaleString()}</td>
                            <td style={{ color: item.remaining > 0 ? '#dc2626' : '#22c55e', fontWeight: 700 }}>
                              PKR {item.remaining.toLocaleString()}
                            </td>
                            <td className="advance-reason-cell" style={{ fontWeight: 500 }}>{item.reason}</td>
                            {canManageSalary() && (
                              <td>
                                {item.remaining > 0 ? (
                                  <button
                                    style={deductBtnStyle}
                                    onClick={() => {
                                      setShowHistoryModal(false);
                                      openLoanSummaryModal(selectedEmployee);
                                    }}
                                  >
                                    <Minus size={12} /> Deduct
                                  </button>
                                ) : (
                                  <span className="no-value">Paid off</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selectedEmployee.loans.some(l => l.payments.length > 0) && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E1B4B', marginBottom: '0.4rem' }}>
                        Loan Payment Log
                      </h4>
                      <div className="advances-table-wrap">
                        <table className="advances-table">
                          <thead>
                            <tr>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Date</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Amount Deducted</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEmployee.loans
                              .flatMap(l => l.payments)
                              .sort((a, b) => new Date(b.date) - new Date(a.date))
                              .map((p, index) => (
                                <tr key={index}>
                                  <td>
                                    <div className="advance-date-time">
                                      <span className="adv-date" style={{ fontWeight: 600 }}>{getDateOnly(p.date)}</span>
                                      <span className="adv-time" style={{ fontSize: '0.6rem' }}>{getTimeOnly(p.date)}</span>
                                    </div>
                                  </td>
                                  <td style={{ color: '#22c55e', fontWeight: 700 }}>
                                    -PKR {p.amount.toLocaleString()}
                                  </td>
                                  <td>
                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: p.applied ? '#22c55e' : '#dc2626' }}>
                                      {p.applied ? 'Applied to salary' : 'Pending next Pay'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="history-list">
                <div className="history-list-header">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Payment History</h4>
                  <span className="history-count" style={{ fontWeight: 600 }}>{selectedEmployee.history.length} entries</span>
                </div>
                {selectedEmployee.history.length === 0 ? (
                  <p className="no-history">No payment history found</p>
                ) : (
                  selectedEmployee.history.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-left">
                        <span className="history-date" style={{ fontWeight: 700 }}>{getMonthName(item.date)}</span>
                        <span className="history-date-full">{getDateOnly(item.date)} • {getTimeOnly(item.date)}</span>
                      </div>
                      <div className="history-center">
                        <span className="history-amount" style={{ fontWeight: 800, fontSize: '1rem' }}>
                          PKR {item.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="history-right">
                        <span className={`history-status ${item.type === 'commission' ? 'commission' : 'paid'}`} style={{ fontWeight: 700 }}>
                          {item.type === 'commission' ? 'Commission' : 'Paid'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="salary-modal-footer">
              <button className="btn-cancel" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADVANCE MODAL ===== */}
      {showAdvanceModal && selectedEmployee && (
        <div className="salary-modal-overlay" onClick={() => setShowAdvanceModal(false)}>
          <div className="salary-modal-content salary-modal-advance" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <div className="salary-modal-header-left">
                <Wallet size={20} className="salary-modal-icon" />
                <h3 style={{ fontSize: '1.3rem' }}>Give Advance</h3>
              </div>
              <button className="salary-modal-close" onClick={() => setShowAdvanceModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="salary-modal-body">
              <div className="employee-detail-header small">
                <div className="emp-detail-avatar small" style={{ background: '#1E1B4B' }}>
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Branch {selectedEmployee.branch}</span>
                </div>
              </div>

              <div className="advance-info-box">
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Salary</span>
                  <strong style={{ color: '#1E1B4B' }}>PKR {selectedEmployee.salary.toLocaleString()}</strong>
                </div>
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Commission</span>
                  <strong className="commission-highlight" style={{ color: '#8B5CF6' }}>
                    PKR {selectedEmployee.commission.toLocaleString()}
                  </strong>
                </div>
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Advances Taken</span>
                  <strong className="advance-taken" style={{ color: '#dc2626' }}>
                    PKR {selectedEmployee.totalAdvances.toLocaleString()}
                  </strong>
                </div>
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Loan Deduction (this cycle)</span>
                  <strong className="advance-taken" style={{ color: '#dc2626' }}>
                    PKR {selectedEmployee.pendingLoanDeduction.toLocaleString()}
                  </strong>
                </div>
                <div className="advance-info-row highlight" style={{ fontWeight: 700, borderTop: '2px solid #1E1B4B', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>Remaining</span>
                  <strong className="remaining-amount" style={{ fontSize: '1.2rem', color: '#1E1B4B' }}>
                    PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances - selectedEmployee.pendingLoanDeduction).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Advance Amount (PKR) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  min="1"
                  max={selectedEmployee.salary - selectedEmployee.totalAdvances - selectedEmployee.pendingLoanDeduction}
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
                <small className="field-hint" style={{ fontWeight: 600 }}>
                  Max: PKR {(selectedEmployee.salary - selectedEmployee.totalAdvances - selectedEmployee.pendingLoanDeduction).toLocaleString()}
                </small>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Reason</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter reason..."
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  style={{ fontSize: '1rem', fontWeight: 500 }}
                />
                <small className="field-hint" style={{ fontWeight: 600 }}>e.g., Emergency, Medical, Home Repair</small>
              </div>

              <div className="advance-note-box">
                <Clock size={16} className="advance-icon" />
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>This amount will be deducted from next salary payment</p>
              </div>
            </div>

            <div className="salary-modal-footer">
              <button className="btn-cancel" onClick={() => setShowAdvanceModal(false)}>Cancel</button>
              <button className="btn-advance-save" onClick={() => handleAddAdvance(selectedEmployee.id)} disabled={loading}>
                {loading ? 'Saving...' : 'Give Advance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOAN MODAL - SIRF ADMIN KO DIKHEGA ===== */}
      {showLoanModal && selectedEmployee && canGiveLoan() && (
        <div className="salary-modal-overlay" onClick={() => setShowLoanModal(false)}>
          <div className="salary-modal-content salary-modal-advance" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <div className="salary-modal-header-left">
                <Landmark size={20} className="salary-modal-icon" />
                <h3 style={{ fontSize: '1.3rem' }}>Give Loan</h3>
              </div>
              <button className="salary-modal-close" onClick={() => setShowLoanModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="salary-modal-body">
              <div className="employee-detail-header small">
                <div className="emp-detail-avatar small" style={{ background: '#1E1B4B' }}>
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Branch {selectedEmployee.branch}</span>
                </div>
              </div>

              <div className="advance-info-box">
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Salary</span>
                  <strong style={{ color: '#1E1B4B' }}>PKR {selectedEmployee.salary.toLocaleString()}</strong>
                </div>
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Commission</span>
                  <strong className="commission-highlight" style={{ color: '#8B5CF6' }}>
                    PKR {selectedEmployee.commission.toLocaleString()}
                  </strong>
                </div>
                <div className="advance-info-row" style={{ fontWeight: 600 }}>
                  <span>Loans Pending (already)</span>
                  <strong className="advance-taken" style={{ color: '#dc2626' }}>
                    PKR {selectedEmployee.totalLoans.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Loan Amount (PKR) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter amount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  min="1"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
                <small className="field-hint" style={{ fontWeight: 600 }}>
                  No limit — you can give any amount
                </small>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Reason</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter reason..."
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  style={{ fontSize: '1rem', fontWeight: 500 }}
                />
                <small className="field-hint" style={{ fontWeight: 600 }}>e.g., Personal Loan, Emergency</small>
              </div>

              <div className="advance-note-box">
                <Clock size={16} className="advance-icon" />
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  This will never be auto-deducted — you can manually deduct any amount from "Loan Summary"
                </p>
              </div>
            </div>

            <div className="salary-modal-footer">
              <button className="btn-cancel" onClick={() => setShowLoanModal(false)}>Cancel</button>
              <button className="btn-advance-save" onClick={() => handleAddLoan(selectedEmployee.id)} disabled={loading}>
                {loading ? 'Saving...' : 'Give Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && editingEmployee && (
        <div className="salary-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="salary-modal-content salary-modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <div className="salary-modal-header-left">
                <Edit size={20} className="salary-modal-icon" />
                <h3 style={{ fontSize: '1.3rem' }}>Edit Salary</h3>
              </div>
              <button className="salary-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="salary-modal-body">
              <div className="employee-detail-header small">
                <div className="emp-detail-avatar small" style={{ background: '#1E1B4B' }}>
                  {editingEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{editingEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Branch {editingEmployee.branch}</span>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Salary (PKR)</label>
                <input
                  type="number"
                  className="form-input"
                  defaultValue={editingEmployee.salary}
                  id="editSalaryInput"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.9rem', fontWeight: 700 }}>Commission (PKR)</label>
                <input
                  type="number"
                  className="form-input"
                  defaultValue={editingEmployee.commission}
                  id="editCommissionInput"
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
                <small className="field-hint" style={{ fontWeight: 600 }}>
                  {editingEmployee.accountCount} accounts × 2,000 = {editingEmployee.accountCount * 2000}
                </small>
              </div>
            </div>

            <div className="salary-modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button 
                className="btn-save" 
                onClick={() => {
                  const salaryInput = document.getElementById('editSalaryInput');
                  const commissionInput = document.getElementById('editCommissionInput');
                  const newSalary = salaryInput.value;
                  const newCommission = commissionInput.value;
                  
                  if (newSalary && parseInt(newSalary) > 0) {
                    handleEditSalary(editingEmployee.id, newSalary);
                  }
                  if (newCommission && parseInt(newCommission) >= 0) {
                    handleEditCommission(editingEmployee.id, newCommission);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;