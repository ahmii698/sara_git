// src/components/EmployeePerformanceReport/EmployeePerformanceReport.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, User, DollarSign, Users, Calendar, Clock, AlertTriangle, 
  FileText, Eye, X, TrendingUp, ChevronDown, Download, Printer, Target
} from 'lucide-react';
import './EmployeePerformanceReport.css';
import { API_URL, STORAGE_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

// ============================================
// ✅ Storage URL helper
// ============================================
const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path}`;
};

// ============================================
// ✅ DocImage component
// ============================================
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

const EmployeePerformanceReport = () => {
  const [search, setSearch] = useState('');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [guarantorsLoading, setGuarantorsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('total');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [agingFilter, setAgingFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [employeesList, setEmployeesList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [targetsMap, setTargetsMap] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch_id || user.branch);
      setUserId(user.id);
      if (user.role === 'employee') {
        setSelectedEmployeeId(user.id);
      }
    }
    fetchEmployees();
    fetchAccounts();
    fetchTargets(getCurrentMonthStr());
  }, []);

  const isEmployee = userRole === 'employee';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canEditRemarks = isAdmin || isManager;

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
        let list = Array.isArray(data.data) ? data.data
          : (data.data?.data && Array.isArray(data.data.data)) ? data.data.data
          : [];
        list = list.filter(u => u.role === 'employee' || u.role === 'manager');
        setEmployeesList(list);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTargets = async (monthKey) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/target-performance?month=${monthKey}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      setTargetsMap(data.success ? (data.data || {}) : {});
    } catch (error) {
      console.error('Error fetching targets:', error);
      setTargetsMap({});
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
      }
      return [];
    } catch (error) {
      console.error('Error fetching guarantors:', error);
      return [];
    }
  };

  const fetchAccounts = async () => {
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
        const raw = data.data.data || data.data || [];
        
        const mapped = raw.map((acc) => {
          const employeeAccount = acc.employee_account || {};
          const employee = employeeAccount.employee || {};
          
          const customer = acc.customer || {};
          
          let guarantors = [];
          if (customer.guarantors && Array.isArray(customer.guarantors) && customer.guarantors.length > 0) {
            guarantors = customer.guarantors;
          } else if (acc.guarantors && Array.isArray(acc.guarantors) && acc.guarantors.length > 0) {
            guarantors = acc.guarantors;
          } else if (customer.guarantor && Array.isArray(customer.guarantor) && customer.guarantor.length > 0) {
            guarantors = customer.guarantor;
          }
          
          const currentMonthStr = getCurrentMonthStr();
          const installments = acc.installments || [];
          const currentMonthInstallment = installments.find(p => p.month === currentMonthStr);
          const mirrorAmount = currentMonthInstallment ? parseFloat(currentMonthInstallment.balance || 0) : 0;
          
          const sortedInstallments = [...installments].sort((a, b) => (a.month || '').localeCompare(b.month || ''));
          const firstUnpaid = sortedInstallments.find(p => parseFloat(p.balance || 0) > 0);
          
          let dueDate = null;
          if (firstUnpaid) {
            dueDate = firstUnpaid.due_date || firstUnpaid.month || null;
          } else if (sortedInstallments.length > 0) {
            dueDate = sortedInstallments[0].due_date || sortedInstallments[0].month || null;
          }
          
          let openedByName = 'N/A';

          if (employee.name) {
            openedByName = employee.name;
          } else if (acc.creator && acc.creator.name) {
            openedByName = acc.creator.name;
          } else if (acc.created_by) {
            const emp = employeesList.find(e => e.id === acc.created_by);
            if (emp) {
              openedByName = emp.name;
            }
          }
          
          return {
            id: acc.id,
            caseNo: acc.case_no || 'N/A',
            customer: customer.name || 'N/A',
            cnic: customer.cnic || '',
            phone: customer.phone || '',
            address: customer.address || '',
            product: acc.product_name || 'N/A',
            amount: parseFloat(acc.total_amount) || 0,
            paid: parseFloat(acc.paid_amount) || 0,
            balance: parseFloat(acc.balance) || 0,
            monthly: parseFloat(acc.monthly_installment) || 0,
            openingDate: acc.created_at ? acc.created_at : null,
            dueDate: dueDate,
            branch: acc.branch_id || 1,
            employeeId: employee.id || acc.created_by || null,
            employeeName: employee.name || 'N/A',
            openedBy: openedByName,
            guarantors: guarantors,
            guarantorsFetched: guarantors.length > 0,
            installments: acc.installments || [],
            mirror: mirrorAmount,
            customerObj: customer,
            accountObj: acc,
            cnic_front: customer.cnic_front || null,
            cnic_back: customer.cnic_back || null,
            additional_image_1: customer.additional_image_1 || null,
            additional_image_2: customer.additional_image_2 || null,
            voice_consent: customer.voice_consent || null,
            chalan_front: acc.chalan_front || null,
            chalan_back: acc.chalan_back || null,
            remarks: acc.remarks || '',
          };
        });
        
        setAccounts(mapped);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
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

  const getInstallmentDueDate = (account, installmentMonth) => {
    if (!installmentMonth) return null;
    const [y, m] = installmentMonth.split('-').map(Number);
    if (!y || !m) return null;

    let day = 1;
    if (account?.openingDate) {
      day = new Date(account.openingDate).getDate();
    }
    return new Date(y, m - 1, day);
  };

  const isAccountOverdue = (account) => {
    const list = Array.isArray(account.installments) ? account.installments : [];
    if (list.length === 0) return account.balance > 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueUnpaid = list.filter(p => {
      if (parseFloat(p.balance || 0) <= 0 || !p.month) return false;

      const dueDate = p.due_date ? new Date(p.due_date) : getInstallmentDueDate(account, p.month);
      if (!dueDate) return false;
      dueDate.setHours(0, 0, 0, 0);

      return dueDate <= today;
    });

    return dueUnpaid.length > 0;
  };

  const getOverdueAmount = (account) => {
    const list = Array.isArray(account.installments) ? account.installments : [];
    if (list.length === 0) return account.balance > 0 ? account.balance : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueUnpaid = list.filter(p => {
      if (parseFloat(p.balance || 0) <= 0 || !p.month) return false;

      const dueDate = p.due_date ? new Date(p.due_date) : getInstallmentDueDate(account, p.month);
      if (!dueDate) return false;
      dueDate.setHours(0, 0, 0, 0);

      return dueDate <= today;
    });

    return dueUnpaid.reduce((sum, p) => sum + parseFloat(p.balance || 0), 0);
  };

  const getThisMonthDue = (account) => {
    const list = Array.isArray(account.installments) ? account.installments : [];
    const currentMonthStr = getCurrentMonthStr();
    const thisMonthRecord = list.find(p => p.month === currentMonthStr);
    if (thisMonthRecord) {
      return parseFloat(thisMonthRecord.balance || 0);
    }
    return 0;
  };

  const getOverdueMonthsCount = (account) => {
    const list = Array.isArray(account.installments) ? account.installments : [];
    const currentMonthStr = getCurrentMonthStr();

    const dueUnpaidMonths = list
      .filter(p =>
        parseFloat(p.balance || 0) > 0 &&
        p.month &&
        monthsBetween(p.month, currentMonthStr) >= 0
      )
      .map(p => p.month)
      .sort();

    if (dueUnpaidMonths.length === 0) return 0;

    const oldestDueMonth = dueUnpaidMonths[0];
    return monthsBetween(oldestDueMonth, currentMonthStr) + 1;
  };

  const applyAgingFilter = (list) => {
    if (agingFilter === 'all') return list;
    if (agingFilter === '4+') return list.filter(acc => getOverdueMonthsCount(acc) >= 4);
    return list.filter(acc => getOverdueMonthsCount(acc) === agingFilter);
  };

  const filteredEmployees = useMemo(() => {
    if (userBranch) {
      return employeesList.filter(emp => parseInt(emp.branch_id || emp.branch) === parseInt(userBranch));
    }
    return employeesList;
  }, [employeesList, userBranch]);

  const branchScopedAccounts = useMemo(() => {
    if (userBranch) {
      return accounts.filter(acc => parseInt(acc.branch) === parseInt(userBranch));
    }
    return accounts;
  }, [accounts, userBranch]);

  const getEmployeeAccounts = useCallback((employeeId) => {
    if (!employeeId) return branchScopedAccounts;
    return branchScopedAccounts.filter(acc => parseInt(acc.employeeId) === parseInt(employeeId));
  }, [branchScopedAccounts]);

  const selectedEmployeeData = useMemo(() => {
    const empAccounts = getEmployeeAccounts(selectedEmployeeId);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalAccounts = empAccounts.length;

    const newAccounts = empAccounts.filter(acc => {
      if (!acc.openingDate) return false;
      const accDate = new Date(acc.openingDate);
      return accDate.getMonth() === currentMonth && accDate.getFullYear() === currentYear;
    });

    const recoveryDue = empAccounts.reduce((sum, acc) => sum + getThisMonthDue(acc), 0);
    const overdueAccounts = empAccounts.filter(acc => isAccountOverdue(acc));

    return {
      totalAccounts,
      newAccountsList: newAccounts,
      recoveryDue,
      overdueList: overdueAccounts,
      accounts: empAccounts
    };
  }, [getEmployeeAccounts, selectedEmployeeId]);

  const selectedEmployee = useMemo(
    () => employeesList.find(emp => emp.id === selectedEmployeeId),
    [employeesList, selectedEmployeeId]
  );

  const targetInfo = useMemo(() => {
    if (!selectedEmployeeId) return null;
    const t = targetsMap[selectedEmployeeId];
    const targetVal = t ? parseInt(t.target) || 0 : 0;
    const achieved = selectedEmployeeData.newAccountsList.length;
    return {
      target: targetVal,
      achieved,
      progress: targetVal > 0 ? Math.round((achieved / targetVal) * 100) : 0
    };
  }, [targetsMap, selectedEmployeeId, selectedEmployeeData]);

  const filteredAccounts = useMemo(() => {
    return selectedEmployeeData.accounts.filter(item => {
      if (!isEmployee && search) {
        return item.customer.toLowerCase().includes(search.toLowerCase()) ||
          item.caseNo.toLowerCase().includes(search.toLowerCase()) ||
          item.product.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [selectedEmployeeData.accounts, isEmployee, search]);

  const openAccountModal = async (account) => {
    setSelectedAccount(account);
    setShowAccountModal(true);

    if (!account.guarantorsFetched) {
      setGuarantorsLoading(true);
      const guarantors = await fetchGuarantorsForAccount(account.id);
      const updatedAccount = { ...account, guarantors, guarantorsFetched: true };

      setSelectedAccount(updatedAccount);
      setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
      setGuarantorsLoading(false);
    }
  };

  const getEmployeeName = (id) => {
    const emp = employeesList.find(e => e.id === id);
    return emp ? emp.name : 'All Employees';
  };

  const formatFullDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return '-';
    
    if (dueDate.includes('-') && dueDate.split('-').length === 3) {
      return new Date(dueDate).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    if (dueDate.includes('-') && dueDate.split('-').length === 2) {
      const date = new Date(dueDate + '-01');
      return date.toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    return '-';
  };

  const formatMonth = (month) => {
    if (!month) return '-';
    return new Date(month + '-01').toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
  };

  const formatCurrencyForExport = (amount) => {
    return amount || 0;
  };

  const getExportData = useCallback(() => {
    const accountsToExport = activeTab === 'total' ? filteredAccounts :
                            activeTab === 'new' ? selectedEmployeeData.newAccountsList :
                            activeTab === 'recovery' ? selectedEmployeeData.accounts.filter(acc => getThisMonthDue(acc) > 0) :
                            activeTab === 'overdue' ? applyAgingFilter(selectedEmployeeData.overdueList) :
                            filteredAccounts;

    return accountsToExport.map(acc => {
      const status = acc.balance <= 0 ? 'Paid' : 
                     isAccountOverdue(acc) ? 'Overdue' : 'Active';
      
      return {
        caseNo: acc.caseNo || 'N/A',
        customer: acc.customer || 'N/A',
        cnic: acc.cnic || 'N/A',
        phone: acc.phone || 'N/A',
        address: acc.address || 'N/A',
        product: acc.product || 'N/A',
        amount: formatCurrencyForExport(acc.amount),
        paid: formatCurrencyForExport(acc.paid),
        balance: formatCurrencyForExport(acc.balance),
        monthlyInstallment: formatCurrencyForExport(acc.monthly),
        mirror: formatCurrencyForExport(acc.mirror),
        openingDate: formatFullDate(acc.openingDate),
        dueDate: formatDueDate(acc.dueDate),
        status: status,
        employee: acc.employeeName || 'N/A',
        openedBy: acc.openedBy || 'N/A',
        branch: acc.branch === 1 ? 'Branch 1' : 'Branch 2',
        remarks: acc.remarks || ''
      };
    });
  }, [activeTab, filteredAccounts, selectedEmployeeData, agingFilter]);

  const exportColumns = useMemo(() => [
    { header: 'Customer', key: 'customer' },
    { header: 'Case No', key: 'caseNo' },
    { header: 'Due Date', key: 'dueDate' },
    { header: 'Installment', key: 'monthlyInstallment' },
    { header: 'Balance', key: 'balance' },
    { header: 'Mirror', key: 'mirror' },
    { header: 'Remarks', key: 'remarks' },
    { header: 'Status', key: 'status' },
    { header: 'Employee', key: 'employee' },
    { header: 'Account Opened By', key: 'openedBy' },
    { header: 'Branch', key: 'branch' },
  ], []);

  const getExportFilename = () => {
    const employeeName = selectedEmployee ? selectedEmployee.name : 'All-Employees';
    const tabMap = {
      'total': 'all-accounts',
      'new': 'new-accounts',
      'recovery': 'recovery-due',
      'overdue': 'overdue-accounts'
    };
    return `employee-performance-${tabMap[activeTab] || 'report'}-${employeeName}`;
  };

  const getExportTitle = () => {
    const tabMap = {
      'total': 'All Accounts',
      'new': 'New Accounts (This Month)',
      'recovery': 'Recovery Due (This Month)',
      'overdue': 'Overdue Accounts'
    };
    const employeeName = selectedEmployee ? selectedEmployee.name : 'All Employees';
    return `Employee Performance - ${tabMap[activeTab] || 'Report'} - ${employeeName}`;
  };

  const cards = isEmployee ? [
    {
      key: 'target',
      label: 'Target (This Month)',
      value: targetInfo && targetInfo.target > 0
        ? `${targetInfo.achieved} / ${targetInfo.target} (${targetInfo.progress}%)`
        : 'Not set',
      icon: Target,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'epr-target-card'
    },
    {
      key: 'new',
      label: 'Current Month Accounts',
      value: selectedEmployeeData.newAccountsList.length,
      icon: TrendingUp,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'epr-new-accounts-card'
    },
    {
      key: 'recovery',
      label: 'Recovery Due (This Month)',
      value: `PKR ${selectedEmployeeData.recoveryDue.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'epr-recovery-card'
    },
    {
      key: 'overdue',
      label: 'Aging',
      value: selectedEmployeeData.overdueList.length,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'epr-overdue-card-main'
    },
  ] : [
    {
      key: 'total',
      label: 'Total Accounts',
      value: selectedEmployeeData.totalAccounts,
      icon: Users,
      color: '#1E1B4B',
      bg: 'rgba(30, 27, 75, 0.08)',
      className: 'epr-total-accounts-card'
    },
    {
      key: 'new',
      label: 'Current Month Accounts',
      value: selectedEmployeeData.newAccountsList.length,
      icon: TrendingUp,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.12)',
      className: 'epr-new-accounts-card'
    },
    {
      key: 'target',
      label: 'Target (This Month)',
      value: !selectedEmployeeId
        ? 'Select Employee'
        : targetInfo && targetInfo.target > 0
          ? `${targetInfo.achieved} / ${targetInfo.target} (${targetInfo.progress}%)`
          : 'Not set',
      icon: Target,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'epr-target-card'
    },
    {
      key: 'recovery',
      label: 'Recovery Due (This Month)',
      value: `PKR ${selectedEmployeeData.recoveryDue.toLocaleString()}`,
      icon: DollarSign,
      color: '#C9A84C',
      bg: 'rgba(201, 168, 76, 0.15)',
      className: 'epr-recovery-card'
    },
    {
      key: 'overdue',
      label: 'Aging',
      value: selectedEmployeeData.overdueList.length,
      icon: AlertTriangle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.12)',
      className: 'epr-overdue-card-main'
    },
  ];

  const getStatusForAccount = (account) => {
    if (account.balance <= 0) return 'paid';
    if (isAccountOverdue(account)) return 'overdue';
    return 'paid';
  };

  const getAccountBadgeInfo = (account) => {
    if (account.balance <= 0) return { key: 'paid', label: 'Paid' };

    const overdueMonths = getOverdueMonthsCount(account);

    if (overdueMonths >= 4) return { key: 'overdue', label: 'Overdue' };
    if (overdueMonths >= 1) return { key: 'aging', label: `Aging (${overdueMonths}m)` };

    return { key: 'paid', label: 'Paid' };
  };

  // ✅ RENDER TABLE - WITH PURPLE HEADER
  const renderTable = () => {
    if (activeTab === 'total' && !isEmployee) {
      return (
        <div className="epr-table-container">
          <div className="epr-table-header">
            <div className="epr-table-header-left">
              <FileText size={18} style={{ color: '#1E1B4B' }} />
              <h3>All Accounts</h3>
              <span className="epr-record-count">{filteredAccounts.length} accounts</span>
            </div>
            <div className="epr-table-header-right">
              <ExportButton
                data={getExportData()}
                columns={exportColumns}
                filename={getExportFilename()}
                title={getExportTitle()}
              />
            </div>
          </div>
          <div className="epr-table-scroll">
            <table className="epr-accounts-table">
              <thead>
              <tr style={{ background: '#1E1B4B' }}>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Customer</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Case #</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Due Date</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Installment</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Mirror</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remarks</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Account Opened By</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr><td colSpan="10" className="epr-no-data">No accounts found</td></tr>
                ) : (
                  filteredAccounts.map((item, index) => {
                    const badge = getAccountBadgeInfo(item);
                    return (
                      <tr key={item.id} className={`${badge.key === 'overdue' || badge.key === 'aging' ? 'epr-overdue-row' : ''} ${index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}`}>
                        <td>
                          <div className="epr-customer-info">
                            <div className="epr-customer-avatar" style={{ background: badge.key === 'paid' ? '#d1fae5' : badge.key === 'overdue' ? '#fee2e2' : '#fef3c7', color: badge.key === 'paid' ? '#065f46' : badge.key === 'overdue' ? '#991b1b' : '#92400e' }}>
                              {item.customer.charAt(0)}
                            </div>
                            {item.customer}
                          </div>
                        </td>
                        <td className="epr-case-number">{item.caseNo}</td>
                        <td>
                          <div className="epr-date-info" style={{ color: '#7c3aed', fontWeight: 500 }}>
                            <Calendar size={12} />
                            {formatDueDate(item.dueDate)}
                          </div>
                        </td>
                        <td className="epr-amount">PKR {item.monthly.toLocaleString()}</td>
                        <td className={item.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>
                          PKR {item.balance.toLocaleString()}
                        </td>
                        <td className={item.mirror > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>
                          PKR {item.mirror.toLocaleString()}
                        </td>
                        <td>
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>—</span>
                        </td>
                        <td>
                          <span className={`epr-status-badge epr-${badge.key}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td>
                          <div className="epr-opened-by-cell">
                            <span className="epr-opened-by-name">{item.openedBy}</span>
                          </div>
                        </td>
                        <td>
                          <div className="epr-action-group">
                            <button className="epr-btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'new') {
      const list = selectedEmployeeData.newAccountsList;
      return (
        <div className="epr-table-container">
          <div className="epr-table-header">
            <div className="epr-table-header-left">
              <FileText size={18} style={{ color: '#2563eb' }} />
              <h3>New Accounts (This Month)</h3>
              <span className="epr-record-count">{list.length} accounts</span>
            </div>
            <div className="epr-table-header-right">
              <ExportButton
                data={getExportData()}
                columns={exportColumns}
                filename={getExportFilename()}
                title={getExportTitle()}
              />
            </div>
          </div>
          <div className="epr-table-scroll">
            <table className="epr-accounts-table">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)' }}>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Customer</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Case #</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Due Date</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Installment</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Mirror</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remarks</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Account Opened By</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="10" className="epr-no-data">No new accounts this month</td></tr>
                ) : (
                  list.map((item, index) => {
                    const badge = getAccountBadgeInfo(item);
                    return (
                      <tr key={item.id} className={index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}>
                        <td>
                          <div className="epr-customer-info">
                            <div className="epr-customer-avatar">{item.customer.charAt(0)}</div>
                            {item.customer}
                          </div>
                        </td>
                        <td className="epr-case-number">{item.caseNo}</td>
                        <td>
                          <div className="epr-date-info" style={{ color: '#7c3aed', fontWeight: 500 }}>
                            <Calendar size={12} />
                            {formatDueDate(item.dueDate)}
                          </div>
                        </td>
                        <td className="epr-amount">PKR {item.monthly.toLocaleString()}</td>
                        <td className={item.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>
                          PKR {item.balance.toLocaleString()}
                        </td>
                        <td className={item.mirror > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>
                          PKR {item.mirror.toLocaleString()}
                        </td>
                        <td>
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>—</span>
                        </td>
                        <td>
                          <span className={`epr-status-badge epr-${badge.key}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td>
                          <div className="epr-opened-by-cell">
                            <span className="epr-opened-by-name">{item.openedBy}</span>
                          </div>
                        </td>
                        <td>
                          <div className="epr-action-group">
                            <button className="epr-btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'recovery') {
      const list = selectedEmployeeData.accounts.filter(acc => getThisMonthDue(acc) > 0);
      return (
        <div className="epr-table-container">
          <div className="epr-table-header">
            <div className="epr-table-header-left">
              <FileText size={18} style={{ color: '#C9A84C' }} />
              <h3>Recovery Due (This Month)</h3>
              <span className="epr-record-count">{list.length} customers</span>
            </div>
            <div className="epr-table-header-right">
              <ExportButton
                data={getExportData()}
                columns={exportColumns}
                filename={getExportFilename()}
                title={getExportTitle()}
              />
            </div>
          </div>
          <div className="epr-table-scroll">
            <table className="epr-accounts-table">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)' }}>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Customer</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Case #</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Due Date</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Installment</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Mirror</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remarks</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Account Opened By</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="9" className="epr-no-data">No recovery due this month</td></tr>
                ) : (
                  list.map((item, index) => (
                    <tr key={item.id} className={`epr-overdue-row ${index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}`}>
                      <td>
                        <div className="epr-customer-info">
                          <div className="epr-customer-avatar">{item.customer.charAt(0)}</div>
                          {item.customer}
                        </div>
                      </td>
                      <td className="epr-case-number">{item.caseNo}</td>
                      <td>
                        <div className="epr-date-info" style={{ color: '#7c3aed', fontWeight: 500 }}>
                          <Calendar size={12} />
                          {formatDueDate(item.dueDate)}
                        </div>
                      </td>
                      <td className="epr-amount">PKR {item.monthly.toLocaleString()}</td>
                      <td className={item.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>PKR {item.balance.toLocaleString()}</td>
                      <td className="epr-balance-amount">PKR {getThisMonthDue(item).toLocaleString()}</td>
                      <td>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>—</span>
                      </td>
                      <td>
                        <div className="epr-opened-by-cell">
                          <span className="epr-opened-by-name">{item.openedBy}</span>
                        </div>
                      </td>
                      <td>
                        <div className="epr-action-group">
                          <button className="epr-btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
                            <Eye size={15} />
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
      );
    }

    if (activeTab === 'overdue') {
      const list = applyAgingFilter(selectedEmployeeData.overdueList);
      return (
        <div className="epr-table-container">
          <div className="epr-table-header">
            <div className="epr-table-header-left">
              <FileText size={18} style={{ color: '#dc2626' }} />
              <h3>Aging Accounts</h3>
              <span className="epr-record-count">{list.length} customers</span>
            </div>
            <div className="epr-table-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 1, 2, 3].map(f => (
                  <button
                    key={f}
                    onClick={() => setAgingFilter(f)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: agingFilter === f ? '1px solid #dc2626' : '1px solid #e5e7eb',
                      background: agingFilter === f ? '#fee2e2' : '#fff',
                      color: agingFilter === f ? '#991b1b' : '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {f === 'all' ? 'All' : f === '4+' ? 'Overdue' : `Aging ${f}m`}
                  </button>
                ))}
              </div>
              <ExportButton
                data={getExportData()}
                columns={exportColumns}
                filename={getExportFilename()}
                title={getExportTitle()}
              />
            </div>
          </div>
          <div className="epr-table-scroll">
            <table className="epr-accounts-table">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)' }}>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Customer</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Case #</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Due Date</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Installment</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Balance</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Mirror</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Remarks</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Account Opened By</th>
                  <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="10" className="epr-no-data">No accounts in this aging bucket</td></tr>
                ) : (
                  list.map((item, index) => {
                    const badge = getAccountBadgeInfo(item);
                    return (
                      <tr key={item.id} className={`epr-overdue-row ${index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}`}>
                        <td>
                          <div className="epr-customer-info">
                            <div className="epr-customer-avatar">{item.customer.charAt(0)}</div>
                            {item.customer}
                          </div>
                        </td>
                        <td className="epr-case-number">{item.caseNo}</td>
                        <td>
                          <div className="epr-date-info" style={{ color: '#7c3aed', fontWeight: 500 }}>
                            <Calendar size={12} />
                            {formatDueDate(item.dueDate)}
                          </div>
                        </td>
                        <td className="epr-amount">PKR {item.monthly.toLocaleString()}</td>
                        <td className={item.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'}>PKR {item.balance.toLocaleString()}</td>
                        <td className="epr-balance-amount">PKR {getOverdueAmount(item).toLocaleString()}</td>
                        <td>
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>—</span>
                        </td>
                        <td>
                          <span className={`epr-status-badge epr-${badge.key}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td>
                          <div className="epr-opened-by-cell">
                            <span className="epr-opened-by-name">{item.openedBy}</span>
                          </div>
                        </td>
                        <td>
                          <div className="epr-action-group">
                            <button className="epr-btn-view-account" onClick={() => openAccountModal(item)} title="View Account Details">
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    if (isEmployee) {
      setActiveTab('recovery');
    } else {
      setActiveTab('total');
    }
  }, [isEmployee, selectedEmployeeId]);

  useEffect(() => {
    setAgingFilter('all');
  }, [activeTab, selectedEmployeeId]);

  if (loading) {
    return (
      <div className="epr-container">
        <div className="epr-loading-state">
          <div className="epr-spinner"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="epr-container">
      {/* HEADER */}
      <div className="epr-header">
        <div className="epr-header-left">
          <div className="epr-header-title-group">
            <h2>{isEmployee ? 'My Performance' : 'Employee Performance'}</h2>
            <span className="epr-live-badge">
              <Clock size={12} /> Live
            </span>
          </div>
          <p className="epr-subtitle">
            {isEmployee ? 'Your performance overview' : 'Employee performance overview'}
          </p>
        </div>

        {!isEmployee && (
          <div className="epr-header-actions">
            <div className="epr-employee-dropdown-wrapper">
              <div
                className={`epr-employee-dropdown-toggle ${showEmployeeDropdown ? 'epr-open' : ''}`}
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              >
                <span>{selectedEmployee ? selectedEmployee.name : 'All Employees'}</span>
                <ChevronDown size={18} className="epr-chevron" />
              </div>
              {showEmployeeDropdown && (
                <div className="epr-employee-dropdown-list">
                  <div
                    className={`epr-dropdown-item ${!selectedEmployeeId ? 'epr-active' : ''}`}
                    onClick={() => {
                      setSelectedEmployeeId(null);
                      setShowEmployeeDropdown(false);
                      setActiveTab('total');
                    }}
                  >
                    All Employees
                  </div>
                  {filteredEmployees.map(emp => (
                    <div
                      key={emp.id}
                      className={`epr-dropdown-item ${selectedEmployeeId === emp.id ? 'epr-active' : ''}`}
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setShowEmployeeDropdown(false);
                        setActiveTab('total');
                      }}
                    >
                      {emp.name}
                      <span className="epr-dropdown-role">{emp.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="epr-search-wrapper">
              <Search size={18} className="epr-search-icon" />
              <input
                type="text"
                placeholder="Search by customer, case or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {!isEmployee && selectedEmployee && (
        <div className="epr-selected-employee-info">
          <div className="epr-selected-employee-avatar">{selectedEmployee.name.charAt(0)}</div>
          <div className="epr-selected-employee-details">
            <span className="epr-selected-employee-name">{selectedEmployee.name}</span>
            <span className="epr-selected-employee-role">{selectedEmployee.role} • Branch {selectedEmployee.branch_id || selectedEmployee.branch}</span>
          </div>
        </div>
      )}

      <div className={`epr-stats-grid-4 ${isEmployee ? 'epr-employee-stats' : ''}`}>
        {cards.map((card) => (
          <div
            key={card.key}
            className={`epr-stat-card ${card.className} ${activeTab === card.key ? 'epr-active' : ''}`}
            onClick={() => { if (card.key !== 'target') setActiveTab(card.key); }}
            style={card.key === 'target' ? { cursor: 'default' } : undefined}
          >
            <div className="epr-stat-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="epr-stat-info">
              <span className="epr-stat-label">{card.label}</span>
              <span className="epr-stat-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {renderTable()}

      {/* ===== ACCOUNT DETAIL MODAL ===== */}
      {showAccountModal && selectedAccount && (
        <div className="epr-modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="epr-modal-content epr-modal-account" onClick={(e) => e.stopPropagation()}>
            <div className="epr-modal-header">
              <div className="epr-modal-header-left">
                <User size={20} className="epr-modal-icon" />
                <h3>Account Details - {selectedAccount.caseNo}</h3>
              </div>
              <button className="epr-modal-close" onClick={() => setShowAccountModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="epr-modal-body">
              <div className="epr-account-detail-header">
                <div className="epr-account-detail-avatar" style={{ background: '#1E1B4B' }}>
                  {selectedAccount.customer.charAt(0)}
                </div>
                <div className="epr-account-detail-info">
                  <h4 style={{ fontWeight: 700 }}>{selectedAccount.customer}</h4>
                  <span className="epr-account-detail-case" style={{ fontWeight: 600 }}>Case: {selectedAccount.caseNo}</span>
                  <span className="epr-account-detail-product" style={{ fontWeight: 500 }}>Product: {selectedAccount.product}</span>
                </div>
                <div className="epr-account-detail-status">
                  <span className={`epr-status-badge epr-${getAccountBadgeInfo(selectedAccount).key}`}>
                    {getAccountBadgeInfo(selectedAccount).label}
                  </span>
                </div>
              </div>

              <div className="epr-account-detail-grid">
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>CNIC</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.cnic}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Phone</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.phone}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Address</span>
                  <strong style={{ fontWeight: 700 }}>{selectedAccount.address}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Total Amount</span>
                  <strong style={{ fontWeight: 800, color: '#1E1B4B' }}>PKR {selectedAccount.amount.toLocaleString()}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Paid Amount</span>
                  <strong className="epr-paid-amount" style={{ fontWeight: 800 }}>PKR {selectedAccount.paid.toLocaleString()}</strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Balance</span>
                  <strong className={selectedAccount.balance > 0 ? 'epr-balance-amount' : 'epr-paid-amount'} style={{ fontWeight: 800 }}>
                    PKR {selectedAccount.balance.toLocaleString()}
                  </strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Account Opening</span>
                  <strong style={{ fontWeight: 600, color: '#2563eb' }}>
                    {formatFullDate(selectedAccount.openingDate)}
                  </strong>
                </div>
                <div className="epr-account-detail-item">
                  <span style={{ fontWeight: 700 }}>Due Date</span>
                  <strong style={{ fontWeight: 600, color: '#7c3aed' }}>
                    {formatDueDate(selectedAccount.dueDate)}
                  </strong>
                </div>
              </div>

              {/* ============================================ */}
              {/* ✅ ACCOUNT MANAGEMENT - Opened By Section */}
              {/* ============================================ */}
              <div className="epr-documents-section" style={{ marginTop: '20px', borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
                <div className="epr-section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <User size={20} style={{ color: '#374151' }} />
                  <h4 style={{ fontWeight: 700, fontSize: '15px', margin: 0, color: '#1f2937' }}>Account Management</h4>
                </div>

                <div className="epr-account-management-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="epr-management-item" style={{ background: '#e0e7ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #818cf8' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#3730a3' }}>Account Opened By</span>
                    <strong style={{ fontWeight: 700, fontSize: '15px', color: '#1e1b4b', display: 'block', marginTop: '4px' }}>
                      {selectedAccount.openedBy || 'N/A'}
                    </strong>
                  </div>
                  <div className="epr-management-item" style={{ background: '#dcfce7', padding: '12px 16px', borderRadius: '8px', border: '1px solid #86efac' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#166534' }}>Employee Who Opened</span>
                    <strong style={{ fontWeight: 700, fontSize: '15px', color: '#065f46', display: 'block', marginTop: '4px' }}>
                      {selectedAccount.employeeName || 'N/A'}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#22c55e' }}>Assigned Employee</span>
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* ✅ DOCUMENTS SECTION */}
              {/* ============================================ */}
              <div className="epr-documents-section" style={{ marginTop: '20px', borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
                <div className="epr-section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText size={20} style={{ color: '#374151' }} />
                  <h4 style={{ fontWeight: 700, fontSize: '15px', margin: 0, color: '#1f2937' }}>Original Form Documents</h4>
                </div>

                {/* Customer CNIC Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Customer CNIC
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedAccount.cnic_front && (
                      <DocImage label="CNIC Front" src={getFileUrl(selectedAccount.cnic_front)} />
                    )}
                    {selectedAccount.cnic_back && (
                      <DocImage label="CNIC Back" src={getFileUrl(selectedAccount.cnic_back)} />
                    )}
                    {!selectedAccount.cnic_front && !selectedAccount.cnic_back && (
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No customer CNIC images found</p>
                    )}
                  </div>
                </div>

                {/* Additional Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Additional Documents
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedAccount.additional_image_1 && (
                      <DocImage label="Additional Image 1" src={getFileUrl(selectedAccount.additional_image_1)} />
                    )}
                    {selectedAccount.additional_image_2 && (
                      <DocImage label="Additional Image 2" src={getFileUrl(selectedAccount.additional_image_2)} />
                    )}
                    {!selectedAccount.additional_image_1 && !selectedAccount.additional_image_2 && (
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No additional documents found</p>
                    )}
                  </div>
                </div>

                {/* Chalan Images */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Chalan
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                    {selectedAccount.chalan_front && (
                      <DocImage label="Chalan Front" src={getFileUrl(selectedAccount.chalan_front)} />
                    )}
                    {selectedAccount.chalan_back && (
                      <DocImage label="Chalan Back" src={getFileUrl(selectedAccount.chalan_back)} />
                    )}
                    {!selectedAccount.chalan_front && !selectedAccount.chalan_back && (
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>No chalan images found</p>
                    )}
                  </div>
                </div>

                {/* Voice Consent */}
                {selectedAccount.voice_consent && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                      Voice Consent (Raza Mandi)
                    </h5>
                    <audio controls preload="none" style={{ width: '100%' }}>
                      <source src={getFileUrl(selectedAccount.voice_consent)} />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {/* Guarantors' CNIC Images */}
                <div>
                  <h5 style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#374151' }}>
                    Guarantors' CNIC Images
                  </h5>
                  {guarantorsLoading ? (
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>Loading guarantors...</p>
                  ) : selectedAccount.guarantors && selectedAccount.guarantors.length > 0 ? (
                    selectedAccount.guarantors.map((g, idx) => (
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

              {/* ===== Guarantors Section (Text Info) ===== */}
              {selectedAccount.guarantors && selectedAccount.guarantors.length > 0 && (
                <div className="epr-guarantors-section" style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  <h4 style={{ fontWeight: 700 }}>Guarantors Information</h4>
                  {selectedAccount.guarantors.map((g, index) => (
                    <div key={index} className="epr-guarantor-item">
                      <div className="epr-guarantor-info">
                        <span style={{ fontWeight: 600 }}>Name: {g.name || g.guarantor_name || 'N/A'}</span>
                        <span style={{ fontWeight: 600 }}>CNIC: {g.cnic || g.guarantor_cnic || 'N/A'}</span>
                        <span style={{ fontWeight: 600 }}>Phone: {g.phone || g.guarantor_phone || 'N/A'}</span>
                        <span style={{ fontWeight: 600 }}>Address: {g.address || g.guarantor_address || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="epr-installment-details-section" style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <div className="epr-section-header">
                  <h4 style={{ fontWeight: 700 }}>Installment Payment History</h4>
                </div>

                <div className="epr-table-scroll">
                  <table className="epr-installment-history-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>#</th>
                        <th style={{ fontWeight: 800 }}>Month</th>
                        <th style={{ fontWeight: 800 }}>Due Amount</th>
                        <th style={{ fontWeight: 800 }}>Paid</th>
                        <th style={{ fontWeight: 800 }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAccount.installments && selectedAccount.installments.length > 0 ? (
                        selectedAccount.installments.map((inst, index) => {
                          const dueAmount = parseFloat(inst.due_amount || 0);
                          const paidAmount = parseFloat(inst.paid_amount || 0);
                          const balanceAmount = parseFloat(inst.balance || 0);
                          return (
                            <tr key={inst.id} className={`${balanceAmount > 0 ? 'epr-overdue-row' : ''} ${index % 2 === 0 ? 'epr-even-row' : 'epr-odd-row'}`}>
                              <td style={{ fontWeight: 700 }}>{index + 1}</td>
                              <td style={{ fontWeight: 600 }}>{formatMonth(inst.month)}</td>
                              <td style={{ fontWeight: 600 }}>PKR {dueAmount.toLocaleString()}</td>
                              <td className="epr-paid-amount" style={{ fontWeight: 700 }}>PKR {paidAmount.toLocaleString()}</td>
                              <td className={balanceAmount > 0 ? 'epr-balance-amount' : 'epr-paid-amount'} style={{ fontWeight: 700 }}>
                                PKR {balanceAmount.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="5" className="epr-no-data">No installment records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="epr-modal-footer">
              <button className="epr-btn-cancel" onClick={() => setShowAccountModal(false)} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePerformanceReport;