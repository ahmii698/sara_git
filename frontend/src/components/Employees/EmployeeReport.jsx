// src/components/EmployeeReport/EmployeeReport.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Users, DollarSign, Calendar, Clock, TrendingUp, TrendingDown, 
  Filter, Download, Eye, Building, Award, Fuel, Briefcase, User, 
  BarChart, LineChart, PieChart, X, Activity, CheckCircle, AlertCircle, 
  AreaChart, ChevronDown, CalendarIcon, BookOpen, AlertTriangle, RefreshCw,
  Wallet, Sparkles, Landmark, Minus, ClipboardList, Target
} from 'lucide-react';
import './EmployeeReport.css';
import { API_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

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

const EmployeeReport = () => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [modalChartType, setModalChartType] = useState('bar');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);

  // ✅ CHART FILTER STATE - Simplified: Year + Month only
  const [chartYearFilter, setChartYearFilter] = useState('all');
  const [chartMonthFilter, setChartMonthFilter] = useState('all');

  // ✅ Year & Month Filters (for table)
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // ✅ Salary + Advances + Loans data
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [advanceRecords, setAdvanceRecords] = useState([]);
  const [loanRecords, setLoanRecords] = useState([]);
  const [monthDetail, setMonthDetail] = useState(null);
  const [deductAmounts, setDeductAmounts] = useState({});
  const [loanActionLoading, setLoanActionLoading] = useState(false);

  // ✅ NEW — Target ka data (Account Target page jaisa hi)
  const [targetHistory, setTargetHistory] = useState({}); // { "2026-08": 90, "2026-07": 50, ... } — selected employee ki poori history
  const [loadingTargetHistory, setLoadingTargetHistory] = useState(false);

  // ✅ NEW — Table filter (Year/Month) ke liye specific-month target map: { employeeId: { target } }
  const [periodTargetsMap, setPeriodTargetsMap] = useState({});

  // ✅ Get current month key ("YYYY-MM")
  const getCurrentMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // ✅ Get user data and fetch immediately
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
    fetchData();
  }, []);

  // ✅ Loan record ko normalize karo — remaining = amount - paid_amount
  // aur payments ko applied/unapplied mein split karo (Salary.jsx jaisa hi)
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

  // ✅ useCallback - function memoize
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const currentMonthKey = getCurrentMonthKey();

      const [reportRes, salRes, advRes, loanRes, targetRes] = await Promise.all([
        fetch(`${API_URL}/employee-report`, { headers }),
        fetch(`${API_URL}/salary`, { headers }),
        fetch(`${API_URL}/salary/advances`, { headers }),
        fetch(`${API_URL}/loans`, { headers }),
        fetch(`${API_URL}/target-performance?month=${currentMonthKey}`, { headers }) // ✅ NEW
      ]);

      const [data, salData, advData, loanData, targetData] = await Promise.all([
        reportRes.json(),
        salRes.json(),
        advRes.json(),
        loanRes.json(),
        targetRes.json() // ✅ NEW
      ]);

      console.log('Employee Report Data:', data);
      
      if (data.success) {
        const reportData = data.data;
        const employeesList = reportData.data || [];
        const summaryData = reportData.summary || {};

        // ✅ NEW — current month ke targets ka map: { employeeId: target }
        const targetsMap = targetData.success ? (targetData.data || {}) : {};
        
        setSummary(summaryData);
        setSalaryRecords(salData.success ? salData.data : []);
        setAdvanceRecords(advData.success ? advData.data : []);
        setLoanRecords(loanData.success ? loanData.data : []);
        
        const processedEmployees = employeesList.map(emp => {
          const monthlyData = emp.monthlyData || {};

          // ✅ Loans belonging to this employee
          const empLoans = (loanData.success ? loanData.data : [])
            .filter(l => l.user_id === emp.id)
            .map(mapLoan);
          const totalLoanGiven = empLoans.reduce((sum, l) => sum + l.amount, 0);
          const totalLoanRemaining = empLoans.reduce((sum, l) => sum + l.remaining, 0);
          const totalLoanPaid = empLoans.reduce((sum, l) => sum + l.paidAmount, 0);
          const pendingLoanDeduction = empLoans.reduce((sum, l) => sum + l.pendingApplication, 0);

          // ✅ NEW — is employee ka current month target
          const currentTarget = targetsMap[emp.id] ? parseInt(targetsMap[emp.id].target) : 0;
          const currentAccounts = monthlyData[currentMonthKey]?.accountsOpened || 0;
          
          return {
            id: emp.id,
            name: emp.name || 'Unknown',
            email: emp.email || '',
            phone: emp.phone || '',
            branch: emp.branch_id || 1,
            role: emp.role || 'employee',
            joiningDate: emp.created_at ? new Date(emp.created_at).toISOString().split('T')[0] : 'N/A',
            salary: parseFloat(emp.salary || 0),
            monthlyData: monthlyData,
            totalAccounts: emp.totalAccounts || 0,
            totalRecovery: emp.totalRecovery || 0,
            totalCommission: emp.totalCommission || 0,
            totalOverdue: emp.totalOverdue || 0,
            loans: empLoans,
            totalLoanGiven,
            totalLoanRemaining,
            totalLoanPaid,
            pendingLoanDeduction,
            currentTarget,      // ✅ NEW
            currentAccounts,    // ✅ NEW
            targetProgress: currentTarget > 0 ? Math.round((currentAccounts / currentTarget) * 100) : 0, // ✅ NEW
          };
        });
        
        setEmployees(processedEmployees);
      } else {
        console.error('API Error:', data.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  }, []);

  // ✅ Refresh function
  const handleRefresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const currentMonthKey = getCurrentMonthKey();

      const [reportRes, salRes, advRes, loanRes, targetRes] = await Promise.all([
        fetch(`${API_URL}/employee-report`, { headers }),
        fetch(`${API_URL}/salary`, { headers }),
        fetch(`${API_URL}/salary/advances`, { headers }),
        fetch(`${API_URL}/loans`, { headers }),
        fetch(`${API_URL}/target-performance?month=${currentMonthKey}`, { headers }) // ✅ NEW
      ]);

      const [data, salData, advData, loanData, targetData] = await Promise.all([
        reportRes.json(),
        salRes.json(),
        advRes.json(),
        loanRes.json(),
        targetRes.json() // ✅ NEW
      ]);
      
      if (data.success) {
        const reportData = data.data;
        const employeesList = reportData.data || [];
        const summaryData = reportData.summary || {};

        const targetsMap = targetData.success ? (targetData.data || {}) : {}; // ✅ NEW
        
        setSummary(summaryData);
        setSalaryRecords(salData.success ? salData.data : []);
        setAdvanceRecords(advData.success ? advData.data : []);
        setLoanRecords(loanData.success ? loanData.data : []);
        
        const processedEmployees = employeesList.map(emp => {
          const monthlyData = emp.monthlyData || {};

          const empLoans = (loanData.success ? loanData.data : [])
            .filter(l => l.user_id === emp.id)
            .map(mapLoan);
          const totalLoanGiven = empLoans.reduce((sum, l) => sum + l.amount, 0);
          const totalLoanRemaining = empLoans.reduce((sum, l) => sum + l.remaining, 0);
          const totalLoanPaid = empLoans.reduce((sum, l) => sum + l.paidAmount, 0);
          const pendingLoanDeduction = empLoans.reduce((sum, l) => sum + l.pendingApplication, 0);

          const currentTarget = targetsMap[emp.id] ? parseInt(targetsMap[emp.id].target) : 0; // ✅ NEW
          const currentAccounts = monthlyData[currentMonthKey]?.accountsOpened || 0; // ✅ NEW
          
          return {
            id: emp.id,
            name: emp.name || 'Unknown',
            email: emp.email || '',
            phone: emp.phone || '',
            branch: emp.branch_id || 1,
            role: emp.role || 'employee',
            joiningDate: emp.created_at ? new Date(emp.created_at).toISOString().split('T')[0] : 'N/A',
            salary: parseFloat(emp.salary || 0),
            monthlyData: monthlyData,
            totalAccounts: emp.totalAccounts || 0,
            totalRecovery: emp.totalRecovery || 0,
            totalCommission: emp.totalCommission || 0,
            totalOverdue: emp.totalOverdue || 0,
            loans: empLoans,
            totalLoanGiven,
            totalLoanRemaining,
            totalLoanPaid,
            pendingLoanDeduction,
            currentTarget,      // ✅ NEW
            currentAccounts,    // ✅ NEW
            targetProgress: currentTarget > 0 ? Math.round((currentAccounts / currentTarget) * 100) : 0, // ✅ NEW
          };
        });
        
        setEmployees(processedEmployees);

        // ✅ Agar loan modal khula hai to selectedEmployee ko bhi fresh data se sync karo
        setSelectedEmployee(prev => {
          if (!prev) return prev;
          const fresh = processedEmployees.find(e => e.id === prev.id);
          return fresh || prev;
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  // ============================================
  // ✅ NEW — Selected employee ki POORI target history fetch karo
  // (har month ka target — Monthly Breakdown table mein dikhane ke liye)
  // ============================================
  const fetchTargetHistory = async (employeeId) => {
    setLoadingTargetHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/target-performance/employee/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTargetHistory(data.success ? data.data : {});
    } catch (err) {
      console.error('Error fetching target history:', err);
      setTargetHistory({});
    }
    setLoadingTargetHistory(false);
  };

  // ============================================
  // ✅ MANUALLY DEDUCT A CUSTOM AMOUNT FROM A SPECIFIC LOAN
  // (same behaviour as Salary.jsx — usable directly from this report)
  // ============================================
  const handleDeductLoanInline = async (loan) => {
    const rawAmount = deductAmounts[loan.id];
    const amount = parseFloat(rawAmount);

    if (!rawAmount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > loan.remaining) {
      alert(`Amount exceeds remaining loan balance: PKR ${loan.remaining.toLocaleString()}`);
      return;
    }

    setLoanActionLoading(true);
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
        await handleRefresh();
        setDeductAmounts(prev => ({ ...prev, [loan.id]: '' }));
        alert('✅ Loan amount deducted successfully!');
      } else {
        alert(data.message || 'Failed to deduct loan');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
    setLoanActionLoading(false);
  };

  // ✅ ALL YEARS - 2020 se current year tak
  const getAllYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
      years.push(String(year));
    }
    return years;
  };

  // ✅ ALL MONTHS - January to December
  const getAllMonths = () => {
    return ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  };

  // ✅ MOVED UP — Year/Month filters ke helper functions (getMonthKeysForFilter waghera)
  // inhe use karte hain, isliye inko unse pehle define hona zaroori hai
  const allYears = getAllYears();
  const allMonths = getAllMonths();

  const getMonthName = (monthStr) => {
    if (monthStr === 'all') return 'All Months';
    const date = new Date(2000, parseInt(monthStr) - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  const getMonthNameFromKey = (monthStr) => {
    if (monthStr === 'all') return 'All Months';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long' });
  };

  const currentMonth = getCurrentMonth();

  // ✅ Adds `delta` months to a "YYYY-MM" key (delta can be negative)
  const addMonthsToKey = (monthKey, delta) => {
    const [y, m] = monthKey.split('-').map(Number);
    const date = new Date(y, (m - 1) + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getFilteredEmployees = () => {
    let filtered = employees;
    if (userBranch) {
      filtered = filtered.filter(emp => emp.branch === parseInt(userBranch));
    }
    if (branchFilter !== 'all' && !userBranch) {
      filtered = filtered.filter(emp => emp.branch === parseInt(branchFilter));
    }
    if (search) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  };

  const filteredEmployees = getFilteredEmployees();

  const getSelectedEmployeeData = () => {
    if (selectedEmployeeId) {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      return emp || null;
    }
    return null;
  };

  const selectedEmployeeData = getSelectedEmployeeData();
  const displayEmployees = selectedEmployeeData ? [selectedEmployeeData] : filteredEmployees;

  // ============================================
  // ✅ NEW — Year/Month TABLE filter ke hisab se konse monthKeys use karne hain
  // null return matlab: koi filter nahi laga, lifetime totals dikhao
  // ============================================
  const getMonthKeysForFilter = () => {
    if (yearFilter === 'all' && monthFilter === 'all') return null; // lifetime totals
    if (yearFilter !== 'all' && monthFilter !== 'all') return [`${yearFilter}-${monthFilter}`];
    if (yearFilter !== 'all' && monthFilter === 'all') return allMonths.map(m => `${yearFilter}-${m}`);
    return allYears.map(y => `${y}-${monthFilter}`); // yearFilter all, month specific
  };

  // ============================================
  // ✅ NEW — Ek employee ka data selected Year/Month period ke hisab se nikalna
  // (Accounts, Recovery, Commission, Overdue, Target — sab filter-aware)
  // ============================================
  const getEmployeePeriodStats = (emp) => {
    const monthKeys = getMonthKeysForFilter();

    if (!monthKeys) {
      // ✅ Koi filter nahi laga — purana (lifetime + current month) behaviour
      const currOverdue = getCurrentMonthOverdue(emp);
      return {
        accounts: emp.totalAccounts || 0,
        recovery: emp.totalRecovery || 0,
        commission: emp.totalCommission || 0,
        overdue: currOverdue,
        target: emp.currentTarget || 0,
        progress: emp.targetProgress || 0,
        targetsAvailable: true,
      };
    }

    let accounts = 0, recovery = 0, commission = 0, overdue = 0;
    monthKeys.forEach(mk => {
      const d = emp.monthlyData[mk];
      if (d) {
        accounts += d.accountsOpened || 0;
        recovery += d.recoveryAmount || 0;
        commission += d.commission || 0;
        overdue += d.overdue || 0;
      }
    });

    // ✅ Target sirf tab meaningful hai jab EXACT ek month select ho (year+month dono)
    let target = 0;
    const singleMonth = monthKeys.length === 1;
    if (singleMonth) {
      target = periodTargetsMap[emp.id] ? parseInt(periodTargetsMap[emp.id].target) : 0;
    }
    const progress = target > 0 ? Math.round((accounts / target) * 100) : 0;

    return { accounts, recovery, commission, overdue, target, progress, targetsAvailable: singleMonth };
  };

  // ✅ NEW — Filter ke hisab se label (table headers / cards mein dikhane ke liye)
  const getPeriodLabel = () => {
    if (yearFilter === 'all' && monthFilter === 'all') return currentMonth;
    if (yearFilter !== 'all' && monthFilter !== 'all') return getMonthNameFromKey(`${yearFilter}-${monthFilter}`);
    if (yearFilter !== 'all') return yearFilter;
    return getMonthName(monthFilter);
  };

  // ✅ GET FILTERED CHART DATA - hamesha 6 months, sahi anchor point ke sath
  const getFilteredChartData = (emp) => {
    let monthKeys = [];

    if (chartMonthFilter !== 'all') {
      const anchorYear = chartYearFilter !== 'all' ? chartYearFilter : String(new Date().getFullYear());
      const anchorMonthKey = `${anchorYear}-${chartMonthFilter}`;
      monthKeys = Array.from({ length: 6 }, (_, i) => addMonthsToKey(anchorMonthKey, i));
    } else if (chartYearFilter !== 'all') {
      const now = new Date();
      const isCurrentYear = parseInt(chartYearFilter) === now.getFullYear();
      const endMonthKey = isCurrentYear
        ? `${chartYearFilter}-${String(now.getMonth() + 1).padStart(2, '0')}`
        : `${chartYearFilter}-12`;
      monthKeys = Array.from({ length: 6 }, (_, i) => addMonthsToKey(endMonthKey, -i)).reverse();
    } else {
      const currentKey = getCurrentMonthKey();
      monthKeys = Array.from({ length: 6 }, (_, i) => addMonthsToKey(currentKey, -i)).reverse();
    }

    return {
      labels: monthKeys.map(m => getMonthNameFromKey(m)),
      accounts: monthKeys.map(m => emp.monthlyData[m]?.accountsOpened || 0),
      recovery: monthKeys.map(m => emp.monthlyData[m]?.recoveryAmount || 0),
      commission: monthKeys.map(m => emp.monthlyData[m]?.commission || 0),
      overdue: monthKeys.map(m => emp.monthlyData[m]?.overdue || 0),
    };
  };

  // ✅ Kisi employee ke kisi specific month ka pura salary detail
  // + us mahine loan se kitna kata (payments jo us month mein "applied" hue)
  const getMonthSalaryDetail = (emp, monthKey) => {
    const salaryRec = salaryRecords.find(s => s.user_id === emp.id && s.month === monthKey);
    const isPaidCycle = !!(salaryRec && salaryRec.status === 'paid');

    const baseSalary = emp.salary || 0;
    const commission = salaryRec ? parseFloat(salaryRec.commission || 0) : (emp.monthlyData[monthKey]?.commission || 0);
    const totalPaid = salaryRec ? parseFloat(salaryRec.total_paid || 0) : 0;

    let advances = [];
    let totalAdvances = 0;
    let loanPayments = [];
    let totalLoanDeductedThisMonth = 0;

    if (isPaidCycle) {
      totalAdvances = parseFloat(salaryRec.advances || 0);
      advances = totalAdvances > 0
        ? [{ date: salaryRec.paid_date, amount: totalAdvances, reason: 'Deducted for this cycle' }]
        : [];

      const paidRecordsSorted = salaryRecords
        .filter(s => s.user_id === emp.id && s.status === 'paid' && s.paid_date)
        .sort((a, b) => new Date(a.paid_date) - new Date(b.paid_date) || a.id - b.id);
      const idx = paidRecordsSorted.findIndex(s => s.id === salaryRec.id);
      const prevPaidDate = idx > 0 ? paidRecordsSorted[idx - 1].paid_date : null;
      const thisPaidDate = salaryRec.paid_date;

      const toDay = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
      const thisDay = toDay(thisPaidDate);
      const prevDay = toDay(prevPaidDate);

      const empLoans = emp.loans || [];
      loanPayments = empLoans.flatMap(l =>
        (l.payments || [])
          .filter(p => p.applied && p.date && thisDay &&
            toDay(p.date) <= thisDay &&
            (!prevDay || toDay(p.date) > prevDay))
          .map(p => ({ ...p, loanReason: l.reason, loanId: l.id }))
      );
      totalLoanDeductedThisMonth = loanPayments.reduce((sum, p) => sum + p.amount, 0);
    } else {
      advances = advanceRecords.filter(a => a.user_id === emp.id && !a.deducted);
      totalAdvances = advances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);

      const empLoans = emp.loans || [];
      loanPayments = empLoans.flatMap(l =>
        (l.payments || [])
          .filter(p => !p.applied)
          .map(p => ({ ...p, loanReason: l.reason, loanId: l.id }))
      );
      totalLoanDeductedThisMonth = loanPayments.reduce((sum, p) => sum + p.amount, 0);
    }

    return {
      baseSalary,
      commission,
      status: salaryRec ? salaryRec.status : 'pending',
      paidDate: salaryRec ? salaryRec.paid_date : null,
      totalPaid,
      advances,
      totalAdvances,
      loanPayments,
      totalLoanDeductedThisMonth,
      isPaidCycle,
    };
  };

  // ✅ EXPORT DATA - Employee Report ke liye
  const getExportData = useCallback(() => {
    return displayEmployees.map(emp => {
      const stats = getEmployeePeriodStats(emp);
      return {
        name: emp.name || 'N/A',
        email: emp.email || 'N/A',
        phone: emp.phone || 'N/A',
        branch: emp.branch === 1 ? 'Branch 1' : 'Branch 2',
        role: emp.role || 'employee',
        joiningDate: emp.joiningDate || 'N/A',
        salary: emp.salary || 0,
        accounts: stats.accounts || 0,
        recovery: stats.recovery || 0,
        commission: stats.commission || 0,
        overdue: stats.overdue || 0,
        target: stats.target || 0,
        loanGiven: emp.totalLoanGiven || 0,
        loanPaid: emp.totalLoanPaid || 0,
        loanRemaining: emp.totalLoanRemaining || 0,
        period: getPeriodLabel()
      };
    });
  }, [displayEmployees, yearFilter, monthFilter, periodTargetsMap]);

  const exportColumns = useMemo(() => [
    { header: 'Employee Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Branch', key: 'branch' },
    { header: 'Role', key: 'role' },
    { header: 'Joining Date', key: 'joiningDate' },
    { header: 'Salary', key: 'salary' },
    { header: 'Accounts', key: 'accounts' },
    { header: 'Recovery', key: 'recovery' },
    { header: 'Commission', key: 'commission' },
    { header: 'Overdue', key: 'overdue' },
    { header: 'Target', key: 'target' },
    { header: 'Loan Given (PKR)', key: 'loanGiven' },
    { header: 'Loan Recovered (PKR)', key: 'loanPaid' },
    { header: 'Loan Remaining (PKR)', key: 'loanRemaining' },
    { header: 'Period', key: 'period' },
  ], []);

  // ✅ Modal Export Data - Current selected employee KE SUMMARY CARDS + monthly chart data
  const getModalExportData = useCallback(() => {
    if (!selectedEmployee) return [];

    const empData = getFilteredChartData(selectedEmployee);
    const currentAccounts = selectedEmployee.monthlyData[getCurrentMonthKey()]?.accountsOpened || 0;
    const currentOverdue = getCurrentMonthOverdue(selectedEmployee);
    const monthlyRecovery = selectedEmployee.monthlyData[getCurrentMonthKey()]?.recoveryAmount || 0;

    return empData.labels.map((label, index) => ({
      employeeName: selectedEmployee.name,
      branch: selectedEmployee.branch === 1 ? 'Branch 1' : 'Branch 2',
      role: selectedEmployee.role,
      joiningDate: selectedEmployee.joiningDate || 'N/A',
      totalAccounts: selectedEmployee.totalAccounts || 0,
      newAccountsCurrentMonth: currentAccounts,
      monthlyRecovery: monthlyRecovery,
      overdueCurrentMonth: currentOverdue,
      totalOverdue: selectedEmployee.totalOverdue || 0,
      salary: selectedEmployee.salary || 0,
      totalCommission: selectedEmployee.totalCommission || 0,
      target: selectedEmployee.currentTarget || 0, // ✅ NEW
      loanGiven: selectedEmployee.totalLoanGiven || 0,
      loanRemaining: selectedEmployee.totalLoanRemaining || 0,
      month: label,
      accounts: empData.accounts[index] || 0,
      recovery: empData.recovery[index] || 0,
      commission: empData.commission[index] || 0,
      overdue: empData.overdue[index] || 0,
    }));
  }, [selectedEmployee, chartYearFilter, chartMonthFilter]);

  const modalExportColumns = useMemo(() => [
    { header: 'Employee Name', key: 'employeeName' },
    { header: 'Branch', key: 'branch' },
    { header: 'Role', key: 'role' },
    { header: 'Joining Date', key: 'joiningDate' },
    { header: 'Total Accounts', key: 'totalAccounts' },
    { header: `New Accounts (${currentMonth})`, key: 'newAccountsCurrentMonth' },
    { header: 'Monthly Recovery (PKR)', key: 'monthlyRecovery' },
    { header: `Overdue (${currentMonth}) (PKR)`, key: 'overdueCurrentMonth' },
    { header: 'Total Overdue (PKR)', key: 'totalOverdue' },
    { header: 'Salary (PKR)', key: 'salary' },
    { header: 'Total Commission (PKR)', key: 'totalCommission' },
    { header: 'Target (Current Month)', key: 'target' }, // ✅ NEW
    { header: 'Loan Given (PKR)', key: 'loanGiven' },
    { header: 'Loan Remaining (PKR)', key: 'loanRemaining' },
    { header: 'Month', key: 'month' },
    { header: 'Accounts', key: 'accounts' },
    { header: 'Recovery (PKR)', key: 'recovery' },
    { header: 'Commission (PKR)', key: 'commission' },
    { header: 'Overdue (PKR)', key: 'overdue' },
  ], [currentMonth]);

  const chartTypes = [
    { id: 'bar', label: 'Bar', icon: BarChart },
    { id: 'line', label: 'Line', icon: LineChart },
    { id: 'pie', label: 'Pie', icon: PieChart },
    { id: 'area', label: 'Area', icon: Activity },
    { id: 'stacked', label: 'Stacked', icon: BarChart },
  ];

  // ✅ Chart width/height constants + safe X calculator (padding se labels edges par clip nahi hongi)
  const CHART_W = 800;
  const CHART_H = 300;
  const CHART_PAD_L = 30;
  const CHART_PAD_R = 30;
  const getChartX = (i, len) => {
    const usableWidth = CHART_W - CHART_PAD_L - CHART_PAD_R;
    return CHART_PAD_L + (i / (len - 1 || 1)) * usableWidth;
  };
  // ✅ Label ke liye text-anchor: pehla label left-align, aakhri label right-align, beech wale center
  const getLabelAnchor = (i, len) => {
    if (i === 0) return 'start';
    if (i === len - 1) return 'end';
    return 'middle';
  };

  // ✅ FIXED: BARA CHART - Height increased
  const renderEmployeeChart = () => {
    if (!selectedEmployee) return null;
    
    const empData = getFilteredChartData(selectedEmployee);
    
    if (empData.labels.length === 0) {
      return <div className="chart-empty">No performance data available</div>;
    }
    
    const maxAccounts = Math.max(...empData.accounts, 1);
    const maxRecovery = Math.max(...empData.recovery.map(v => v/1000), 1);
    const maxOverdue = Math.max(...empData.overdue.map(v => v/1000), 1);

    const getAccountsHeight = (val) => (val / maxAccounts) * 250;
    const getRecoveryHeight = (val) => ((val/1000) / maxRecovery) * 250;
    const getOverdueHeight = (val) => ((val/1000) / maxOverdue) * 250;

    if (modalChartType === 'bar') {
      return (
        <div className="modal-chart-container">
          <div className="chart-bar-container-4" style={{ minHeight: '350px' }}>
            {empData.labels.map((label, index) => (
              <div key={index} className="chart-bar-group-4">
                <div className="chart-bars-4" style={{ height: '300px' }}>
                  <div className="chart-bar-wrapper-4">
                    <div 
                      className="chart-bar-4 bar-accounts" 
                      style={{ height: `${getAccountsHeight(empData.accounts[index])}px` }}
                    >
                      <span className="bar-value-4" style={{ fontSize: '11px' }}>{empData.accounts[index]}</span>
                    </div>
                    <span className="bar-label-4" style={{ fontSize: '11px' }}>Acc</span>
                  </div>
                  <div className="chart-bar-wrapper-4">
                    <div 
                      className="chart-bar-4 bar-recovery" 
                      style={{ height: `${getRecoveryHeight(empData.recovery[index])}px` }}
                    >
                      <span className="bar-value-4" style={{ fontSize: '11px' }}>{(empData.recovery[index]/1000).toFixed(1)}k</span>
                    </div>
                    <span className="bar-label-4" style={{ fontSize: '11px' }}>Rec</span>
                  </div>
                  <div className="chart-bar-wrapper-4">
                    <div 
                      className="chart-bar-4 bar-overdue" 
                      style={{ height: `${getOverdueHeight(empData.overdue[index])}px` }}
                    >
                      <span className="bar-value-4" style={{ fontSize: '11px' }}>{(empData.overdue[index]/1000).toFixed(1)}k</span>
                    </div>
                    <span className="bar-label-4" style={{ fontSize: '11px' }}>Agi</span>
                  </div>
                </div>
                <div className="chart-bar-labels-4">
                  <span className="chart-label-4" style={{ fontSize: '12px' }}>{label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend-4">
            <span><span className="legend-dot-4 gold"></span> Accounts (max: {maxAccounts})</span>
            <span><span className="legend-dot-4 dark"></span> Recovery (max: {maxRecovery.toFixed(1)}k)</span>
            <span><span className="legend-dot-4 red"></span> Aging (max: {maxOverdue.toFixed(1)}k)</span>
          </div>
        </div>
      );
    }

    if (modalChartType === 'line') {
      return (
        <div className="modal-chart-container">
          <div className="chart-line-container" style={{ minHeight: '350px' }}>
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg">
              {[0, 50, 100, 150, 200, 250].map((y) => (
                <line key={y} x1="0" y1={300 - y} x2={CHART_W} y2={300 - y} stroke="#e5e7eb" strokeWidth="1" />
              ))}
              <polyline
                points={empData.accounts.map((val, i) => 
                  `${getChartX(i, empData.accounts.length)},${300 - (val / maxAccounts) * 270}`
                ).join(' ')}
                fill="none"
                stroke="#C9A84C"
                strokeWidth="3.5"
              />
              <polyline
                points={empData.recovery.map((val, i) => 
                  `${getChartX(i, empData.recovery.length)},${300 - ((val/1000) / maxRecovery) * 270}`
                ).join(' ')}
                fill="none"
                stroke="#1A2A4A"
                strokeWidth="3.5"
                strokeDasharray="5,5"
              />
              <polyline
                points={empData.overdue.map((val, i) => 
                  `${getChartX(i, empData.overdue.length)},${300 - ((val/1000) / maxOverdue) * 270}`
                ).join(' ')}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3.5"
                strokeDasharray="2,4"
              />
              {empData.labels.map((label, i) => (
                <text
                  key={i}
                  x={getChartX(i, empData.labels.length)}
                  y="295"
                  fontSize="12"
                  fill="#6b7280"
                  textAnchor={getLabelAnchor(i, empData.labels.length)}
                  fontWeight="600"
                >{label}</text>
              ))}
            </svg>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts</span>
              <span><span className="legend-dot-4 dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot-4 red"></span> Aging (PKR'000)</span>
            </div>
          </div>
        </div>
      );
    }

    if (modalChartType === 'pie') {
      const totalAccounts = empData.accounts.reduce((a, b) => a + b, 0);
      const totalRecovery = empData.recovery.reduce((a, b) => a + b, 0);
      const totalOverdue = empData.overdue.reduce((a, b) => a + b, 0);
      const pieData = [
        { label: 'Total Accounts', value: totalAccounts || 1, color: '#C9A84C' },
        { label: 'Total Recovery', value: (totalRecovery / 1000) || 1, color: '#1A2A4A' },
        { label: 'Total Overdue', value: (totalOverdue / 1000) || 1, color: '#dc2626' },
      ];
      const total = pieData.reduce((a, b) => a + b.value, 0);
      let cumulative = 0;

      return (
        <div className="modal-chart-container">
          <div className="chart-pie-container" style={{ minHeight: '350px' }}>
            <div className="pie-chart" style={{ width: '280px', height: '280px' }}>
              <svg viewBox="0 0 280 280">
                {pieData.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const dashArray = (percentage / 100) * 678.58;
                  const offset = cumulative;
                  cumulative += dashArray;
                  return (
                    <circle
                      key={index}
                      cx="140" cy="140" r="108"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="50"
                      strokeDasharray={`${dashArray} 678.58`}
                      strokeDashoffset={`-${offset}`}
                      transform="rotate(-90 140 140)"
                    />
                  );
                })}
                <text x="140" y="125" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#0A1628">
                  Total
                </text>
                <text x="140" y="148" textAnchor="middle" fontSize="13" fill="#6b7280" fontWeight="600">
                  {totalAccounts} Acc
                </text>
                <text x="140" y="165" textAnchor="middle" fontSize="13" fill="#6b7280" fontWeight="600">
                  {(totalRecovery/1000).toFixed(1)}k Rec
                </text>
                <text x="140" y="182" textAnchor="middle" fontSize="13" fill="#dc2626" fontWeight="600">
                  {(totalOverdue/1000).toFixed(1)}k Aging
                </text>
              </svg>
            </div>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts ({totalAccounts})</span>
              <span><span className="legend-dot-4 dark"></span> Recovery ({(totalRecovery/1000).toFixed(1)}k)</span>
              <span><span className="legend-dot-4 red"></span> Aging ({(totalOverdue/1000).toFixed(1)}k)</span>
            </div>
          </div>
        </div>
      );
    }

    if (modalChartType === 'area') {
      return (
        <div className="modal-chart-container">
          <div className="chart-area-container-custom" style={{ minHeight: '350px' }}>
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="chart-svg">
              <polygon
                points={`${getChartX(0, empData.accounts.length)},300 ${empData.accounts.map((val, i) => 
                  `${getChartX(i, empData.accounts.length)},${300 - (val / maxAccounts) * 270}`
                ).join(' ')} ${getChartX(empData.accounts.length - 1, empData.accounts.length)},300`}
                fill="rgba(201, 168, 76, 0.3)"
                stroke="#C9A84C"
                strokeWidth="2.5"
              />
              <polygon
                points={`${getChartX(0, empData.recovery.length)},300 ${empData.recovery.map((val, i) => 
                  `${getChartX(i, empData.recovery.length)},${300 - ((val/1000) / maxRecovery) * 270}`
                ).join(' ')} ${getChartX(empData.recovery.length - 1, empData.recovery.length)},300`}
                fill="rgba(26, 42, 74, 0.3)"
                stroke="#1A2A4A"
                strokeWidth="2.5"
              />
              <polygon
                points={`${getChartX(0, empData.overdue.length)},300 ${empData.overdue.map((val, i) => 
                  `${getChartX(i, empData.overdue.length)},${300 - ((val/1000) / maxOverdue) * 270}`
                ).join(' ')} ${getChartX(empData.overdue.length - 1, empData.overdue.length)},300`}
                fill="rgba(220, 38, 38, 0.25)"
                stroke="#dc2626"
                strokeWidth="2.5"
              />
              {empData.labels.map((label, i) => (
                <text
                  key={i}
                  x={getChartX(i, empData.labels.length)}
                  y="295"
                  fontSize="12"
                  fill="#6b7280"
                  textAnchor={getLabelAnchor(i, empData.labels.length)}
                  fontWeight="600"
                >{label}</text>
              ))}
            </svg>
            <div className="chart-legend-4">
              <span><span className="legend-dot-4 gold"></span> Accounts</span>
              <span><span className="legend-dot-4 dark"></span> Recovery (PKR'000)</span>
              <span><span className="legend-dot-4 red"></span> Aging (PKR'000)</span>
            </div>
          </div>
        </div>
      );
    }

    if (modalChartType === 'stacked') {
      return (
        <div className="modal-chart-container">
          <div className="chart-stacked-container-4" style={{ minHeight: '350px' }}>
            {empData.labels.map((label, index) => {
              const accH = getAccountsHeight(empData.accounts[index]);
              const recH = getRecoveryHeight(empData.recovery[index]);
              const odH = getOverdueHeight(empData.overdue[index]);
              return (
                <div key={index} className="stacked-bar-group-4">
                  <div className="stacked-bar-wrapper-4" style={{ height: '300px' }}>
                    <div 
                      className="stacked-bar-4 rec-bar-4" 
                      style={{ height: `${recH}px` }}
                    >
                      <span className="stacked-value-4" style={{ fontSize: '10px' }}>{(empData.recovery[index]/1000).toFixed(1)}k</span>
                    </div>
                    <div 
                      className="stacked-bar-4 overdue-bar-4" 
                      style={{ height: `${odH}px` }}
                    >
                      <span className="stacked-value-4" style={{ fontSize: '10px' }}>{(empData.overdue[index]/1000).toFixed(1)}k</span>
                    </div>
                    <div 
                      className="stacked-bar-4 acc-bar-4" 
                      style={{ height: `${accH}px` }}
                    >
                      <span className="stacked-value-4" style={{ fontSize: '10px' }}>{empData.accounts[index]}</span>
                    </div>
                  </div>
                  <span className="stacked-label-4" style={{ fontSize: '11px' }}>{label}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend-4">
            <span><span className="legend-dot-4 gold"></span> Accounts</span>
            <span><span className="legend-dot-4 dark"></span> Recovery (PKR'000)</span>
            <span><span className="legend-dot-4 red"></span> Aging (PKR'000)</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // ✅ Modal khulte hi hamesha 'all'/'all' se start hoga
  // ✅ NEW — modal khulte hi is employee ki target history bhi fetch hogi
  const openDetailModal = (emp) => {
    setSelectedEmployee(emp);
    setChartYearFilter('all');
    setChartMonthFilter('all');
    setModalChartType('bar');
    setShowDetailModal(true);
    fetchTargetHistory(emp.id); // ✅ NEW
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedEmployee(null);
    setTargetHistory({}); // ✅ NEW
  };

  // ✅ GET CURRENT MONTH OVERDUE FOR EMPLOYEE
  const getCurrentMonthOverdue = (emp) => {
    const key = getCurrentMonthKey();
    return emp.monthlyData[key]?.overdue || 0;
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

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  // ✅ UPDATED — ab summary cards selected Year/Month period ke hisab se calculate hote hain
  const totalRecovery = displayEmployees.reduce((sum, e) => sum + getEmployeePeriodStats(e).recovery, 0);
  const totalCommission = displayEmployees.reduce((sum, e) => sum + getEmployeePeriodStats(e).commission, 0);
  const totalAccounts = displayEmployees.reduce((sum, e) => sum + getEmployeePeriodStats(e).accounts, 0);
  const totalOverdue = displayEmployees.reduce((sum, e) => sum + getEmployeePeriodStats(e).overdue, 0);
  const totalLoanRemaining = displayEmployees.reduce((sum, e) => sum + (e.totalLoanRemaining || 0), 0);
  const totalEmployees = displayEmployees.length;

  const canManageSalary = () => {
    return userRole === 'admin' || userRole === 'manager';
  };

  const getEmployeeStats = (emp) => {
    const currentAccounts = emp.monthlyData[getCurrentMonthKey()]?.accountsOpened || 0;
    const currentOverdue = getCurrentMonthOverdue(emp);
    const monthlyRecovery = emp.monthlyData[getCurrentMonthKey()]?.recoveryAmount || 0;
    const totalOverdueVal = emp.totalOverdue || 0;

    return [
      { label: 'Total Accounts', value: emp.totalAccounts || 0, color: '#1E1B4B' },
      { label: `New Accounts (${currentMonth})`, value: currentAccounts || 0, color: '#2563eb' },
      { label: `Target (${currentMonth})`, value: emp.currentTarget > 0 ? emp.currentTarget : '—', color: '#C9A84C' }, // ✅ NEW
      { label: 'Monthly Recovery', value: `PKR ${(monthlyRecovery || 0).toLocaleString()}`, color: '#C9A84C' },
      { label: `Aging (${currentMonth})`, value: `PKR ${(currentOverdue || 0).toLocaleString()}`, color: '#dc2626' },
      { label: 'Total Aging', value: `PKR ${(totalOverdueVal || 0).toLocaleString()}`, color: '#ef4444' },
      { label: 'Salary', value: `PKR ${(emp.salary || 0).toLocaleString()}`, color: '#065f46' },
      { label: 'Total Commission', value: `PKR ${(emp.totalCommission || 0).toLocaleString()}`, color: '#8B5CF6' },
      { label: 'Loan Given', value: `PKR ${(emp.totalLoanGiven || 0).toLocaleString()}`, color: '#991b1b' },
      { label: 'Loan Remaining', value: `PKR ${(emp.totalLoanRemaining || 0).toLocaleString()}`, color: '#dc2626' },
    ];
  };

  const isEmployee = userRole === 'employee';

  const summaryCards = isEmployee ? [
    { label: 'Total Accounts', value: totalAccounts || 0, icon: Briefcase, color: '#1E1B4B', bg: 'rgba(30,27,75,0.08)', className: 'accounts' },
    { label: 'Recovery Due', value: `PKR ${(totalRecovery || 0).toLocaleString()}`, icon: DollarSign, color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', className: 'recovery' },
    { label: 'Total Overdue', value: `PKR ${(totalOverdue || 0).toLocaleString()}`, icon: AlertTriangle, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', className: 'overdue' },
    { label: 'Loan Remaining', value: `PKR ${(totalLoanRemaining || 0).toLocaleString()}`, icon: Landmark, color: '#991b1b', bg: 'rgba(153,27,27,0.1)', className: 'loans' },
  ] : [
    { label: 'Total Employees', value: totalEmployees || 0, icon: Users, color: '#1E1B4B', bg: 'rgba(30,27,75,0.08)', className: 'users' },
    { label: 'Monthly Recovery', value: `PKR ${(totalRecovery || 0).toLocaleString()}`, icon: DollarSign, color: '#C9A84C', bg: 'rgba(201,168,76,0.12)', className: 'recovery' },
    { label: 'Monthly Accounts', value: totalAccounts || 0, icon: Briefcase, color: '#2563eb', bg: 'rgba(37,99,235,0.1)', className: 'accounts' },
    { label: 'Monthly Aging', value: `PKR ${(totalOverdue || 0).toLocaleString()}`, icon: AlertTriangle, color: '#dc2626', bg: 'rgba(220,38,38,0.1)', className: 'overdue' },
    { label: 'Monthly Commission', value: `PKR ${(totalCommission || 0).toLocaleString()}`, icon: Award, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', className: 'commission' },
    { label: 'Loans Pending', value: `PKR ${(totalLoanRemaining || 0).toLocaleString()}`, icon: Landmark, color: '#991b1b', bg: 'rgba(153,27,27,0.1)', className: 'loans' },
  ];

  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : 'Select Employee';
  };

  // ============================================
  // ✅ NEW — Jab Year+Month dono specific select hon to us exact month ke
  // targets fetch karo (table filter ke liye) — Account Target page jaisa hi API
  // ============================================
  useEffect(() => {
    const fetchPeriodTargets = async (monthKey) => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/target-performance?month=${monthKey}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setPeriodTargetsMap(data.success ? (data.data || {}) : {});
      } catch (err) {
        console.error('Error fetching period targets:', err);
        setPeriodTargetsMap({});
      }
    };

    if (yearFilter !== 'all' && monthFilter !== 'all') {
      fetchPeriodTargets(`${yearFilter}-${monthFilter}`);
    } else {
      setPeriodTargetsMap({});
    }
  }, [yearFilter, monthFilter]);

  // ✅ FAST LOADING - Sirf pehli baar show karega
  if (loading && employees.length === 0) {
    return (
      <div className="employee-report-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading employee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-report-container">
      <div className="report-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Employee Report</h2>
            <span className="live-badge">
              <Activity size={12} /> Live
            </span>
          </div>
          {userBranch && (
            <div className="branch-label">
              <Building size={14} />
              <span>{branchLabel}</span>
            </div>
          )}
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ExportButton
            data={getExportData()}
            columns={exportColumns}
            filename="employee-report"
            title="Employee Report"
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
            fontWeight: 600          }}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ✅ YEAR & MONTH FILTERS */}
      <div className="report-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="search-wrapper" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="filter-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Year:</span>
            <select
              className="filter-select"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              style={{ padding: '0.35rem 0.7rem', border: '1.5px solid #e5e7eb', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, background: 'white', cursor: 'pointer' }}
            >
              <option value="all">All Years</option>
              {allYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="filter-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Month:</span>
            <select
              className="filter-select"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ padding: '0.35rem 0.7rem', border: '1.5px solid #e5e7eb', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 600, background: 'white', cursor: 'pointer' }}
            >
              <option value="all">All Months</option>
              {allMonths.map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>

          {(yearFilter !== 'all' || monthFilter !== 'all') && (
            <button 
              className="btn-clear-filters"
              onClick={() => { setYearFilter('all'); setMonthFilter('all'); }}
              style={{ padding: '0.3rem 0.8rem', background: '#dbeafe', color: '#1e40af', border: 'none', borderRadius: '0.3rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}
            >
              Clear
            </button>
          )}
        </div>

        {!userBranch && (
          <div className="branch-filters" style={{ display: 'flex', gap: '0.3rem' }}>
            <button className={`filter-btn ${branchFilter === 'all' ? 'active' : ''}`} onClick={() => setBranchFilter('all')}>All</button>
            <button className={`filter-btn branch-1 ${branchFilter === '1' ? 'active' : ''}`} onClick={() => setBranchFilter('1')}>Branch 1</button>
            <button className={`filter-btn branch-2 ${branchFilter === '2' ? 'active' : ''}`} onClick={() => setBranchFilter('2')}>Branch 2</button>
          </div>
        )}
      </div>

      {!isEmployee && (
        <div className="employee-dropdown-wrapper">
          <div 
            className="employee-dropdown-toggle"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span>{selectedEmployeeId ? getEmployeeName(selectedEmployeeId) : 'Select Employee...'}</span>
            <ChevronDown size={18} />
          </div>
          {showDropdown && (
            <div className="employee-dropdown-list">
              <div 
                className={`dropdown-item ${!selectedEmployeeId ? 'active' : ''}`}
                onClick={() => {
                  setSelectedEmployeeId(null);
                  setShowDropdown(false);
                }}
              >
                All Employees
              </div>
              {filteredEmployees.map(emp => (
                <div 
                  key={emp.id}
                  className={`dropdown-item ${selectedEmployeeId === emp.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setShowDropdown(false);
                  }}
                >
                  <div className="dropdown-emp-info">
                    <div className="dropdown-emp-avatar">{emp.name.charAt(0)}</div>
                    <span>{emp.name}</span>
                  </div>
                  <span className="dropdown-role">{emp.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isEmployee && selectedEmployeeId && (
        <div className="selected-employee-info">
          <div className="selected-employee-avatar">
            {employees.find(e => e.id === selectedEmployeeId)?.name.charAt(0)}
          </div>
          <div className="selected-employee-details">
            <span className="selected-employee-name">
              {employees.find(e => e.id === selectedEmployeeId)?.name}
            </span>
            <span className="selected-employee-role">
              {employees.find(e => e.id === selectedEmployeeId)?.role} • Branch {employees.find(e => e.id === selectedEmployeeId)?.branch}
            </span>
          </div>
        </div>
      )}

      <div className={`summary-cards ${isEmployee ? 'employee-cards' : ''}`}>
        {summaryCards.map((card, index) => (
          <div 
            key={index} 
            className="summary-card" 
            style={{ 
              borderTop: `4px solid ${card.color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div className={`summary-icon ${card.className}`} style={{ background: card.bg, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div className="summary-info">
              <span className="summary-label" style={{ fontWeight: 700 }}>{card.label}</span>
              <span className="summary-value" style={{ fontWeight: 800, fontSize: '1.2rem' }}>{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="employee-table-wrap">
        <div className="table-header-bar">
          <div className="table-header-left">
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Employee Performance</span>
            <span className="record-count" style={{ fontWeight: 600 }}>{displayEmployees.length} records</span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="employee-report-table">
            <thead>
             <tr style={{ background: '#1E1B4B' }}>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>#</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Employee</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Accounts ({getPeriodLabel()})</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Target ({getPeriodLabel()})</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Recovery ({getPeriodLabel()})</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Commission ({getPeriodLabel()})</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Aging ({getPeriodLabel()})</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Loan (Remaining)</th>
                <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayEmployees.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    <div className="no-data-content">
                      <AlertCircle size={24} />
                      <p>No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayEmployees.map((emp, index) => {
                  const stats = getEmployeePeriodStats(emp);
                  return (
                    <tr key={emp.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                      <td className="text-gray" style={{ fontWeight: 600 }}>{index + 1}</td>
                      <td>
                        <div className="emp-name-cell">
                          <div className="emp-avatar" style={{ background: '#ede9fe', color: '#1E1B4B', fontWeight: 700 }}>
                            {emp.name.charAt(0)}
                          </div>
                          {emp.name}
                        </div>
                      </td>
                      <td className="highlight-number" style={{ fontWeight: 800, color: '#1E1B4B' }}>{stats.accounts || 0}</td>
                      <td>
                        {stats.targetsAvailable && stats.target > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 800, color: '#C9A84C' }}>
                              {stats.accounts} / {stats.target}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: stats.progress >= 100 ? '#22c55e' : '#6b7280' }}>
                              {stats.progress}%
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontWeight: 600 }}>Not set</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>PKR {(stats.recovery || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>PKR {(stats.commission || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 600, color: stats.overdue > 0 ? '#dc2626' : '#1a1a2e' }}>PKR {(stats.overdue || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: (emp.totalLoanRemaining || 0) > 0 ? '#dc2626' : '#94a3b8' }}>
                        {(emp.totalLoanRemaining || 0) > 0 ? `PKR ${emp.totalLoanRemaining.toLocaleString()}` : '—'}
                      </td>
                      <td>
                        <button className="btn-view-detail" onClick={() => openDetailModal(emp)} style={{ fontWeight: 700 }}>
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedEmployee && (
        <div className="empreport-modal-overlay" onClick={closeModal}>
          <div className="empreport-modal-content empreport-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="empreport-modal-header">
              <div className="empreport-modal-header-left">
                <User size={20} className="empreport-modal-icon" />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Employee Report - {selectedEmployee.name}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ExportButton
                  data={getModalExportData()}
                  columns={modalExportColumns}
                  filename={`${selectedEmployee.name}-performance-report`}
                  title={`${selectedEmployee.name} - Performance Report`}
                />
                <button className="empreport-modal-close" onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="empreport-modal-body">
              <div className="employee-detail-header">
                <div className="emp-detail-avatar" style={{ background: '#1E1B4B', fontSize: '1.5rem', fontWeight: 800 }}>
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div className="emp-detail-info">
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{selectedEmployee.name}</h4>
                  <span className="emp-detail-branch" style={{ fontSize: '0.95rem', fontWeight: 600 }}>Branch {selectedEmployee.branch} • {selectedEmployee.role}</span>
                  <span className="emp-detail-joining" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Joined: {selectedEmployee.joiningDate}</span>
                </div>
              </div>

              {/* ✅ STATS - ab Target bhi shamil hai */}
              <div className="detail-summary-7">
                {getEmployeeStats(selectedEmployee).map((stat, index) => (
                  <div 
                    key={index} 
                    className="detail-summary-item" 
                    style={{ 
                      borderTop: `4px solid ${stat.color}`,
                      background: stat.color + '08'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6b7280' }}>{stat.label}</span>
                    <strong style={{ fontSize: '1rem', fontWeight: 800, color: stat.color }}>{stat.value}</strong>
                  </div>
                ))}
              </div>

              {/* ✅ LOAN SECTION — kitna liya, kitna kata (paid), kitna baaki + payment log */}
              {selectedEmployee.loans && selectedEmployee.loans.length > 0 && (
                <div className="advances-section" style={{ marginTop: '1rem' }}>
                  <div className="advances-header">
                    <Landmark size={16} style={{ color: '#991b1b' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#991b1b' }}>Loans</h4>
                    <span className="advances-total" style={{ fontWeight: 700 }}>
                      Pending: PKR {selectedEmployee.totalLoanRemaining.toLocaleString()}
                    </span>
                  </div>
                  <div className="advances-table-wrap">
                    <table className="advances-table">
                      <thead>
                        <tr>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Date</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Loan Amount</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Recovered</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Remaining</th>
                          <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Reason</th>
                          {canManageSalary() && <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Deduct</th>}
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
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <input
                                      type="number"
                                      placeholder="Amount"
                                      value={deductAmounts[item.id] || ''}
                                      onChange={(e) => setDeductAmounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                      min="1"
                                      max={item.remaining}
                                      style={{ width: '90px', padding: '6px 8px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #fca5a5', borderRadius: '6px' }}
                                    />
                                    <button
                                      style={deductBtnStyle}
                                      onClick={() => handleDeductLoanInline(item)}
                                      disabled={loanActionLoading}
                                    >
                                      <Minus size={12} />
                                    </button>
                                  </div>
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
                        Loan Recovery Log (Salary se kitna kaata gaya)
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
                                    <span style={{ fontWeight: 700, fontSize: '0.75rem', color: p.applied ? '#22c55e' : '#f59e0b' }}>
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

              {/* ✅ CHART SECTION - BARA CHART */}
              <div className="modal-chart-section">
                <div className="modal-chart-header">
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    <Sparkles size={18} style={{ color: '#C9A84C', marginRight: '6px' }} />
                    Performance Trend (Last 6 Months)
                  </h4>
                  <div className="modal-chart-type-selector">
                    {chartTypes.map((type) => (
                      <button
                        key={type.id}
                        className={`modal-chart-type-btn ${modalChartType === type.id ? 'active' : ''}`}
                        onClick={() => setModalChartType(type.id)}
                        style={{ fontWeight: 600 }}
                      >
                        <type.icon size={14} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedEmployee && Object.keys(selectedEmployee.monthlyData).length > 0 && (
                  <div className="chart-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.5rem 0', marginBottom: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
                    <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="filter-label" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Year:</span>
                      <select 
                        className="filter-select"
                        value={chartYearFilter}
                        onChange={(e) => setChartYearFilter(e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', border: '1.5px solid #e5e7eb', borderRadius: '0.3rem', fontSize: '0.75rem', fontWeight: 600, background: 'white', cursor: 'pointer', minWidth: '70px' }}
                      >
                        <option value="all">All Years</option>
                        {allYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="filter-label" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>Month:</span>
                      <select 
                        className="filter-select"
                        value={chartMonthFilter}
                        onChange={(e) => setChartMonthFilter(e.target.value)}
                        style={{ padding: '0.25rem 0.5rem', border: '1.5px solid #e5e7eb', borderRadius: '0.3rem', fontSize: '0.75rem', fontWeight: 600, background: 'white', cursor: 'pointer', minWidth: '80px' }}
                      >
                        <option value="all">All Months</option>
                        {allMonths.map(month => (
                          <option key={month} value={month}>{getMonthName(month)}</option>
                        ))}
                      </select>
                    </div>
                    <span className="chart-range-info" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', marginLeft: 'auto' }}>
                      Showing {getFilteredChartData(selectedEmployee).labels.length} months
                    </span>
                  </div>
                )}

                <div className="modal-chart-container">
                  {renderEmployeeChart()}
                </div>
              </div>

              {/* ✅ MONTHLY BREAKDOWN — ab har month ka Target bhi dikhega */}
              <div className="monthly-breakdown">
                <div className="monthly-header">
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Monthly Breakdown</h4>
                  <span className="monthly-count" style={{ fontWeight: 600 }}>{Object.keys(selectedEmployee.monthlyData).length} months</span>
                </div>
                <div className="monthly-scroll">
                  <table className="monthly-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: 800 }}>Month</th>
                        <th style={{ fontWeight: 800 }}>Accounts</th>
                        <th style={{ fontWeight: 800 }}>Target</th>
                        <th style={{ fontWeight: 800 }}>Recovery</th>
                        <th style={{ fontWeight: 800 }}>Overdue</th>
                        <th style={{ fontWeight: 800 }}>Commission</th>
                        <th style={{ fontWeight: 800 }}>Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedEmployee.monthlyData).map(([month, data]) => {
                        const monthTarget = parseInt(targetHistory[month] || 0); // ✅ NEW
                        return (
                          <tr key={month}>
                            <td className="month-name" style={{ fontWeight: 600 }}>{getMonthNameFromKey(month)}</td>
                            <td className="month-accounts" style={{ fontWeight: 700, color: '#1E1B4B' }}>{data.accountsOpened || 0}</td>
                            <td style={{ fontWeight: 700, color: '#C9A84C' }}>
                              {loadingTargetHistory ? '...' : (monthTarget > 0 ? monthTarget : '—')}
                            </td>
                            <td style={{ fontWeight: 600 }}>PKR {(data.recoveryAmount || 0).toLocaleString()}</td>
                            <td style={{ fontWeight: 600, color: (data.overdue || 0) > 0 ? '#dc2626' : '#1a1a2e' }}>
                              PKR {(data.overdue || 0).toLocaleString()}
                            </td>
                            <td style={{ fontWeight: 600 }}>PKR {(data.commission || 0).toLocaleString()}</td>
                            <td>
                              <button 
                                className="btn-view-detail" 
                                onClick={() => setMonthDetail({ emp: selectedEmployee, month })}
                                style={{ fontWeight: 700, padding: '4px 10px' }}
                              >
                                <Eye size={14} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="empreport-modal-footer">
              <button className="empreport-btn-cancel" onClick={closeModal} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Month-wise Salary Detail Modal — ab loan deduction bhi dikhata hai */}
      {monthDetail && (
        <div className="empreport-modal-overlay" onClick={() => setMonthDetail(null)} style={{ zIndex: 1100 }}>
          <div className="empreport-modal-content empreport-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="empreport-modal-header">
              <div className="empreport-modal-header-left">
                <DollarSign size={20} className="empreport-modal-icon" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  {getMonthNameFromKey(monthDetail.month)} — Salary Detail
                </h3>
              </div>
              <button className="empreport-modal-close" onClick={() => setMonthDetail(null)}>
                <X size={22} />
              </button>
            </div>

            <div className="empreport-modal-body">
              {(() => {
                const d = getMonthSalaryDetail(monthDetail.emp, monthDetail.month);
                return (
                  <>
                    <div className="employee-detail-header small" style={{ marginBottom: '1rem' }}>
                      <div className="emp-detail-avatar small" style={{ background: '#1E1B4B' }}>
                        {monthDetail.emp.name.charAt(0)}
                      </div>
                      <div className="emp-detail-info">
                        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{monthDetail.emp.name}</h4>
                        <span className="emp-detail-branch" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          Branch {monthDetail.emp.branch}
                        </span>
                      </div>
                    </div>

                    <div className="history-summary">
                      <div className="summary-item" style={{ background: 'rgba(30,27,75,0.06)', borderRadius: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Salary</span>
                        <strong style={{ fontSize: '1.05rem', color: '#1E1B4B' }}>PKR {d.baseSalary.toLocaleString()}</strong>
                      </div>
                      <div className="summary-item" style={{ background: 'rgba(139,92,246,0.08)', borderRadius: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Commission</span>
                        <strong style={{ fontSize: '1.05rem', color: '#8B5CF6' }}>PKR {d.commission.toLocaleString()}</strong>
                      </div>
                      <div className="summary-item" style={{ background: 'rgba(34,197,94,0.08)', borderRadius: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Total Paid</span>
                        <strong style={{ fontSize: '1.05rem', color: '#22c55e' }}>PKR {d.totalPaid.toLocaleString()}</strong>
                      </div>
                    </div>

                    {d.advances.length > 0 ? (
                      <div className="advances-section" style={{ marginTop: '1rem' }}>
                        <div className="advances-header">
                          <Wallet size={16} style={{ color: '#92400e' }} />
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>Advances Taken</h4>
                          <span className="advances-total" style={{ fontWeight: 700 }}>
                            Total: PKR {d.totalAdvances.toLocaleString()}
                          </span>
                        </div>
                        <table className="advances-table">
                          <thead>
                            <tr>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Date</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Amount</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.advances.map((a, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{(a.date || '').split(/[T ]/)[0]}</td>
                                <td style={{ color: '#dc2626', fontWeight: 700 }}>-PKR {parseFloat(a.amount || 0).toLocaleString()}</td>
                                <td style={{ fontWeight: 500 }}>{a.reason || 'No reason provided'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                        {d.isPaidCycle ? 'Is cycle mein koi advance deduct nahi hui.' : 'Abhi koi advance pending nahi hai.'}
                      </p>
                    )}

                    {d.loanPayments.length > 0 ? (
                      <div className="advances-section" style={{ marginTop: '1rem' }}>
                        <div className="advances-header">
                          <Landmark size={16} style={{ color: '#991b1b' }} />
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#991b1b' }}>Loan Deduction This Month</h4>
                          <span className="advances-total" style={{ fontWeight: 700 }}>
                            Total: PKR {d.totalLoanDeductedThisMonth.toLocaleString()}
                          </span>
                        </div>
                        <table className="advances-table">
                          <thead>
                            <tr>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Date</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Amount</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Loan Reason</th>
                              <th style={{ fontSize: '0.7rem', fontWeight: 700 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.loanPayments.map((p, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{getDateOnly(p.date)}</td>
                                <td style={{ color: '#dc2626', fontWeight: 700 }}>-PKR {p.amount.toLocaleString()}</td>
                                <td style={{ fontWeight: 500 }}>{p.loanReason}</td>
                                <td>
                                  <span style={{ fontWeight: 700, fontSize: '0.75rem', color: p.applied ? '#22c55e' : '#f59e0b' }}>
                                    {p.applied ? 'Applied' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                        {d.isPaidCycle ? 'Is cycle mein koi loan deduction apply nahi hui.' : 'Abhi koi loan deduction pending nahi hai.'}
                      </p>
                    )}
                    {!d.isPaidCycle && (d.totalAdvances > 0 || d.totalLoanDeductedThisMonth > 0) && (
                      <p style={{ marginTop: '0.5rem', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
                        ⏳ Ye is cycle ki current pending amounts hain — jab tak "Pay" nahi hoga, tab tak deduct nahi hongi.
                      </p>
                    )}

                    <div style={{ marginTop: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>
                      Status:{' '}
                      <span style={{ color: d.status === 'paid' ? '#22c55e' : '#f59e0b' }}>
                        {d.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                      {d.paidDate && <span style={{ color: '#6b7280', marginLeft: 8 }}>• Paid on {d.paidDate}</span>}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="empreport-modal-footer">
              <button className="empreport-btn-cancel" onClick={() => setMonthDetail(null)} style={{ fontWeight: 700 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeReport;