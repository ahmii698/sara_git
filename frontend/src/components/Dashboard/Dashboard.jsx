// src/components/Dashboard/Dashboard.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, DollarSign, TrendingUp, BarChart, 
  LineChart, PieChart, Activity, Award, AlertTriangle, 
  Calendar, ChevronDown, ChevronUp, RefreshCw, Sparkles,
  CheckCircle, Clock, AlertCircle, Building, Filter, ChevronRight,
  Landmark
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as ReLineChart, Line,
  AreaChart as ReAreaChart, Area,
  PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import './Dashboard.css';
import { API_URL } from '../../../config';
import ExportButton from '../common/ExportButton';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const getCurrentDueDate = (dueDateStr) => {
  if (!dueDateStr) return null;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  if (/^\d{1,2}$/.test(dueDateStr.trim())) {
    const day = parseInt(dueDateStr.trim());
    return new Date(currentYear, currentMonth, day);
  }
  else if (/^(\d{1,2})(st|nd|rd|th)?$/.test(dueDateStr.trim())) {
    const day = parseInt(dueDateStr.trim());
    return new Date(currentYear, currentMonth, day);
  }
  else if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr.trim())) {
    return new Date(dueDateStr.trim());
  }
  return null;
};

const getDismissKey = (expenseId) => {
  const today = new Date();
  return `${expenseId}_${today.getFullYear()}-${today.getMonth() + 1}`;
};

const ALERT_TYPE_META = {
  cnic:       { label: 'CNIC',      icon: AlertCircle, color: '#dc2626', bg: '#fee2e2' },
  limit:      { label: 'LIMIT',     icon: DollarSign,  color: '#d97706', bg: '#fef3c7' },
  account:    { label: 'ACCOUNT',   icon: Building,    color: '#2563eb', bg: '#dbeafe' },
  guarantor:  { label: 'GUARANTOR', icon: Users,       color: '#7c3aed', bg: '#ede9fe' },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loanData, setLoanData] = useState({
    total_loans_given: 0,
    total_loans_recovered: 0,
    total_loans_pending: 0
  });
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [selectedChart, setSelectedChart] = useState('bar');
  const [showBranchOverview, setShowBranchOverview] = useState(false);
  const [upcomingExpenses, setUpcomingExpenses] = useState([]);
  
  const [dismissedReminders, setDismissedReminders] = useState([]);

  // ✅ single global filter — 'current' (this month, default) or 'single' (any chosen month/year)
  const [filterMode, setFilterMode] = useState('current');
  const [singleMonth, setSingleMonth] = useState(new Date().getMonth() + 1);
  const [singleYear, setSingleYear] = useState(CURRENT_YEAR);
  const [appliedFilter, setAppliedFilter] = useState({ mode: 'current' });

  const [recentAlerts, setRecentAlerts] = useState([]);
  const [alertsTotal, setAlertsTotal] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);

  // which expense row currently has its actions (Paid/OK) expanded
  const [openExpenseActions, setOpenExpenseActions] = useState(null);

  const toggleExpenseActions = (id) => {
    setOpenExpenseActions(prev => (prev === id ? null : id));
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch_id || user.branch);
    }
    
    const savedDismissed = localStorage.getItem('dismissedReminders');
    if (savedDismissed) {
      setDismissedReminders(JSON.parse(savedDismissed));
    }

    const savedDismissedAlerts = localStorage.getItem('dismissedAlertIds');
    if (savedDismissedAlerts) {
      setDismissedAlertIds(JSON.parse(savedDismissedAlerts));
    }
    
    fetchAllData();
    fetchLoanData();
    fetchRecentAlerts();
  }, []);

  useEffect(() => {
    fetchAllData();
    fetchLoanData();
  }, [appliedFilter]);

  // ✅ single shared helper — builds ?branch_id=&month=YYYY-MM for BOTH
  // /reports/dashboard and /reports/loan-summary, so both endpoints always
  // agree on which month is being viewed.
  const buildFilterParams = useCallback((user) => {
    const params = new URLSearchParams();

    if (user && user.branch_id && user.role !== 'admin') {
      params.set('branch_id', user.branch_id);
    }

    if (appliedFilter.mode === 'single') {
      params.set('month', `${appliedFilter.year}-${String(appliedFilter.month).padStart(2, '0')}`);
    }
    // mode === 'current' → no month param, backend defaults to current month

    return params.toString();
  }, [appliedFilter]);

  const fetchLoanData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      const query = buildFilterParams(user);
      const url = `${API_URL}/reports/loan-summary${query ? `?${query}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setLoanData(data.data);
      }
    } catch (error) {
      console.error('Error fetching loan data:', error);
    }
  }, [buildFilterParams]);

  const fetchRecentAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const json = await response.json();

      const list = Array.isArray(json.data?.data)
        ? json.data.data
        : (Array.isArray(json.data) ? json.data : []);

      setRecentAlerts(list.slice(0, 5));
      setAlertsTotal(json.data?.total ?? list.length);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setRecentAlerts([]);
      setAlertsTotal(0);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const query = buildFilterParams(user);

      const [dashboardRes, expensesRes] = await Promise.all([
        fetch(`${API_URL}/reports/dashboard${query ? `?${query}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        }),
        fetch(`${API_URL}/expenses/fixed/all${userBranch ? `?branch_id=${userBranch}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        })
      ]);

      const [dashboardJson, expensesData] = await Promise.all([
        dashboardRes.json(),
        expensesRes.json()
      ]);

      if (dashboardJson.success) {
        setDashboardData(dashboardJson.data);
      } else {
        setError(dashboardJson.message || 'Failed to load dashboard');
      }

      if (expensesData.success) {
        const expenses = (expensesData.data || [])
          .filter(exp => !exp.paid && exp.due_date)
          .map(exp => ({
            id: exp.id,
            name: exp.name,
            amount: parseFloat(exp.amount) || 0,
            branch: exp.branch_id,
            dueDate: exp.due_date || '',
            paid: !!exp.paid,
            lastPaid: exp.last_paid || 'Never'
          }));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = expenses.map(e => {
          let dueDate = getCurrentDueDate(e.dueDate);
          if (!dueDate || isNaN(dueDate.getTime())) {
            dueDate = new Date(today);
          }
          dueDate.setHours(0, 0, 0, 0);
          const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          return { ...e, dueDateObj: dueDate, daysLeft };
        });

        const filtered = upcoming.filter(e => e.daysLeft <= 1);
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        
        setUpcomingExpenses(filtered);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userBranch, buildFilterParams]);

  const handleRefresh = useCallback(() => {
    fetchAllData();
    fetchLoanData();
    fetchRecentAlerts();
  }, [fetchAllData, fetchLoanData, fetchRecentAlerts]);

  const handleDismissReminder = (expenseId) => {
    const key = getDismissKey(expenseId);
    if (dismissedReminders.includes(key)) return;
    const updatedDismissed = [...dismissedReminders, key];
    setDismissedReminders(updatedDismissed);
    localStorage.setItem('dismissedReminders', JSON.stringify(updatedDismissed));
  };

  const handleDismissAlert = (alertId) => {
    if (dismissedAlertIds.includes(alertId)) return;
    const updated = [...dismissedAlertIds, alertId];
    setDismissedAlertIds(updated);
    localStorage.setItem('dismissedAlertIds', JSON.stringify(updated));
  };

  const handleMarkAsPaid = async (expenseId) => {
    try {
      const token = localStorage.getItem('token');
      const expense = upcomingExpenses.find(e => e.id === expenseId);
      if (!expense) return;

      const response = await fetch(`${API_URL}/expenses/fixed/${expenseId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: expense.amount }),
      });

      const data = await response.json();
      if (data.success) {
        setUpcomingExpenses(prev => prev.filter(e => e.id !== expenseId));
        handleDismissReminder(expenseId);
        alert('✅ Expense marked as paid!');
        handleRefresh();
      } else {
        alert('❌ Failed to mark as paid: ' + data.message);
      }
    } catch (error) {
      console.error('Error paying expense:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleRedirectToFixedExpenses = () => {
    navigate('/finance/fixed');
  };

  const handleRedirectToAlerts = () => {
    navigate('/alert');
  };

  const visibleUpcomingExpenses = upcomingExpenses.filter(
    expense => !dismissedReminders.includes(getDismissKey(expense.id))
  );

  const visibleRecentAlerts = recentAlerts.filter(
    a => !dismissedAlertIds.includes(a.id)
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency', currency: 'PKR', minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatCompactCurrency = (amount) => {
    const value = amount || 0;
    if (value >= 1000000) return `Rs ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `Rs ${(value / 1000).toFixed(0)}K`;
    return `Rs ${value}`;
  };

  const formatAlertTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-PK', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  };

  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: BarChart },
    { id: 'line', label: 'Line Chart', icon: LineChart },
    { id: 'pie', label: 'Pie Chart', icon: PieChart },
    { id: 'area', label: 'Area Chart', icon: Activity },
  ];

  const tooltipFormatter = (value, name) => {
    if (name === 'Monthly Sales' || name === 'Monthly Recovery') {
      return [formatCurrency(value), name];
    }
    return [value, name];
  };

  const tooltipStyle = {
    borderRadius: 12, border: '1px solid #eef0f4',
    boxShadow: '0 10px 24px rgba(10, 22, 40, 0.14)',
    fontSize: '0.85rem', fontWeight: 600,
  };

  const axisTick = { fontSize: 12, fill: '#6b7280', fontWeight: 600 };

  const ChartLegend = () => (
    <div className="chart-legend-horizontal">
      <span><span className="legend-dot accounts"></span> New Accounts</span>
      <span><span className="legend-dot sales"></span> Monthly Sales</span>
      <span><span className="legend-dot recovery"></span> Monthly Recovery</span>
    </div>
  );

  const chartData = useMemo(() => {
    return dashboardData?.performance_data || [];
  }, [dashboardData]);

  const chartTitle = useMemo(() => {
    if (appliedFilter.mode === 'single') {
      return `Performance Overview (${MONTH_NAMES[appliedFilter.month - 1]} ${appliedFilter.year} - Weekly)`;
    }
    return `Performance Overview (${MONTH_NAMES[new Date().getMonth()]} ${CURRENT_YEAR} - Weekly)`;
  }, [appliedFilter]);

  const applyCurrent = () => { setFilterMode('current'); setAppliedFilter({ mode: 'current' }); };
  const applySingle = () => { setAppliedFilter({ mode: 'single', month: singleMonth, year: singleYear }); };

  const renderChart = () => {
    if (!dashboardData) return null;
    const data = chartData;
    if (data.length === 0) {
      return <div className="chart-empty">No performance data available</div>;
    }

    if (selectedChart === 'bar') {
      return (
        <div className="chart-bar-container-multi">
          <ChartLegend />
          <ResponsiveContainer width="100%" height={320}>
            <ReAreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="accountsSmoothGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4338ca" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salesSmoothGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recoverySmoothGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="sales" tick={axisTick} axisLine={false} tickLine={false}
                tickFormatter={formatCompactCurrency} domain={[0, 'dataMax']} width={70} />
              <YAxis yAxisId="accounts" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="recovery" hide domain={[0, 'dataMax']} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Area yAxisId="accounts" type="monotone" dataKey="accounts" name="New Accounts"
                stroke="#4338ca" strokeWidth={3.5} fill="url(#accountsSmoothGrad)" dot={false} activeDot={{ r: 6 }} />
              <Area yAxisId="sales" type="monotone" dataKey="sales" name="Monthly Sales"
                stroke="#C9A84C" strokeWidth={3.5} fill="url(#salesSmoothGrad)" dot={false} activeDot={{ r: 6 }} />
              <Area yAxisId="recovery" type="monotone" dataKey="recovery" name="Monthly Recovery"
                stroke="#22c55e" strokeWidth={3.5} fill="url(#recoverySmoothGrad)" dot={false} activeDot={{ r: 6 }} />
            </ReAreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (selectedChart === 'line') {
      return (
        <div className="chart-line-container">
          <ChartLegend />
          <ResponsiveContainer width="100%" height={300}>
            <ReLineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="accounts" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="sales" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="recovery" hide domain={[0, 'dataMax']} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Line yAxisId="accounts" type="monotone" dataKey="accounts" name="New Accounts" stroke="#1E1B4B" strokeWidth={3} dot={{ r: 4, fill: '#1E1B4B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line yAxisId="sales" type="monotone" dataKey="sales" name="Monthly Sales" stroke="#C9A84C" strokeWidth={3} strokeDasharray="8 4" dot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              <Line yAxisId="recovery" type="monotone" dataKey="recovery" name="Monthly Recovery" stroke="#22c55e" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (selectedChart === 'pie') {
      const total = data.reduce((sum, d) => sum + (d.accounts || 0), 0);
      const colors = ['#1E1B4B', '#C9A84C', '#4A3520', '#8B7355', '#6B5B8B', '#2563eb'];
      return (
        <div className="chart-pie-container">
          <div className="pie-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={data} dataKey="accounts" nameKey="month" innerRadius="62%" outerRadius="95%" paddingAngle={3} stroke="none">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} Accounts`, '']} contentStyle={tooltipStyle} />
              </RePieChart>
            </ResponsiveContainer>
            <div className="pie-center-label">
              <span className="pie-center-total">Total</span>
              <span className="pie-center-count">{total} Accounts</span>
            </div>
          </div>
          <div className="chart-legend pie-legend">
            {data.map((item, index) => (
              <span key={index}>
                <span className="legend-dot" style={{ background: colors[index % colors.length] }}></span>
                {item.month}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (selectedChart === 'area') {
      return (
        <div className="chart-area-container">
          <ChartLegend />
          <ResponsiveContainer width="100%" height={300}>
            <ReAreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="accountsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E1B4B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1E1B4B" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="recoveryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis yAxisId="accounts" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="sales" hide domain={[0, 'dataMax']} />
              <YAxis yAxisId="recovery" hide domain={[0, 'dataMax']} />
              <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} />
              <Area yAxisId="accounts" type="monotone" dataKey="accounts" name="New Accounts" stroke="#1E1B4B" strokeWidth={2} fill="url(#accountsAreaGrad)" />
              <Area yAxisId="sales" type="monotone" dataKey="sales" name="Monthly Sales" stroke="#C9A84C" strokeWidth={2} fill="url(#salesAreaGrad)" />
              <Area yAxisId="recovery" type="monotone" dataKey="recovery" name="Monthly Recovery" stroke="#22c55e" strokeWidth={2} fill="url(#recoveryAreaGrad)" />
            </ReAreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  const getStatusPill = () => {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          borderRadius: '999px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#b45309',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.3)'
        }}
      >
        Unpaid
      </span>
    );
  };

  const getExportData = useCallback(() => {
    if (!dashboardData) return [];
    
    return [
      {
        metric: 'Total Customers',
        value: dashboardData.total_customers || 0,
        branch: getBranchDisplayName()
      },
      {
        metric: 'New Accounts',
        value: dashboardData.new_accounts || 0,
        branch: getBranchDisplayName()
      },
      {
        metric: 'Total Sales',
        value: dashboardData.total_sales || 0,
        branch: getBranchDisplayName()
      },
      {
        metric: 'Monthly Sales',
        value: dashboardData.monthly_sales || 0,
        branch: getBranchDisplayName()
      },
      {
        metric: 'Monthly Recovery',
        value: dashboardData.monthly_recovery || 0,
        branch: getBranchDisplayName()
      },
      {
        metric: 'Total Revenue',
        value: dashboardData.total_revenue || 0,
        branch: getBranchDisplayName()
      },
      {
        metric: 'Total Loans Pending',
        value: loanData.total_loans_pending || 0,
        branch: getBranchDisplayName()
      }
    ];
  }, [dashboardData, loanData]);

  const exportColumns = [
    { header: 'Metric', key: 'metric' },
    { header: 'Value', key: 'value' },
    { header: 'Branch', key: 'branch' },
  ];

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <RefreshCw size={40} className="spinning" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <AlertTriangle size={40} />
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={handleRefresh}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="empty-state"><p>No data available</p></div>
      </div>
    );
  }

  const data = dashboardData;

  const getBranchDisplayName = () => {
    if (userBranch) return `Branch ${userBranch}`;
    return data.branch_name || 'All Branches';
  };

  // ✅ dynamic labels that reflect the selected filter month
  const statsMonthLabel = appliedFilter.mode === 'single'
    ? `${MONTH_NAMES[appliedFilter.month - 1]} ${appliedFilter.year}`
    : `${MONTH_NAMES[new Date().getMonth()]} ${CURRENT_YEAR} (This month)`;

  // ✅ NEW: when viewing a specific past month, "Total Customers" and
  // "Total Sales" are lifetime/cumulative metrics — they don't belong to
  // any single month, so they're hidden in that view (only shown for
  // "Current Month").
  const isSpecificMonth = appliedFilter.mode === 'single';

  const allStats = [
    { key: 'customers', label: 'Total Customers', value: data.total_customers?.toLocaleString() || '0', icon: Users, subtitle: getBranchDisplayName() },
    { key: 'accounts', label: 'New Accounts', value: data.new_accounts || 0, icon: Calendar, subtitle: statsMonthLabel },
    { key: 'sales', label: 'Total Sales', value: formatCurrency(data.total_sales || 0), icon: DollarSign, subtitle: 'Lifetime revenue' },
    { key: 'monthlySales', label: 'Monthly Sales', value: formatCurrency(data.monthly_sales || 0), icon: TrendingUp, subtitle: statsMonthLabel },
    { key: 'recovery', label: 'Monthly Recovery', value: formatCurrency(data.monthly_recovery || 0), icon: TrendingUp, subtitle: statsMonthLabel },
    { 
      key: 'loan',
      label: 'Loan Pending', 
      value: formatCurrency(loanData.total_loans_pending || 0), 
      icon: Landmark, 
      subtitle: isSpecificMonth ? statsMonthLabel : 'Total loans pending'
    },
  ];

  const stats = isSpecificMonth
    ? allStats.filter(s => s.key !== 'customers' && s.key !== 'sales')
    : allStats;

  // stat-card color/icon styling is index-based (5th card = loan/purple) —
  // find the loan card's position in whichever list is actually rendered
  const loanCardIndex = stats.findIndex(s => s.key === 'loan');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-left">
          <h2>Dashboard</h2>
          {userBranch && <span className="branch-indicator">{getBranchDisplayName()}</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ExportButton
            data={getExportData()}
            columns={exportColumns}
            filename="dashboard-report"
            title="Dashboard Report"
          />
          <button className="btn-refresh" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* ✅ GLOBAL DASHBOARD MONTH/YEAR FILTER          */}
      {/* Drives stats cards, chart, top performers,    */}
      {/* revenue comparison, branch overview AND loan  */}
      {/* pending — all sections below react to this.   */}
      {/* ============================================ */}
      <div className="chart-section" style={{ padding: '1.1rem 1.5rem' }}>
        <div className="chart-filter-bar" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
          <div className="filter-mode-selector">
            <button className={`filter-mode-btn ${filterMode === 'current' ? 'active' : ''}`}
              onClick={applyCurrent}>
              <Filter size={14} /> Current Month
            </button>
            <button className={`filter-mode-btn ${filterMode === 'single' ? 'active' : ''}`}
              onClick={() => setFilterMode('single')}>
              Specific Month
            </button>
          </div>

          {filterMode === 'single' && (
            <div className="filter-controls">
              <select value={singleMonth} onChange={(e) => setSingleMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select value={singleYear} onChange={(e) => setSingleYear(Number(e.target.value))}>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="btn-apply-filter" onClick={applySingle}>Apply</button>
            </div>
          )}
        </div>
        {appliedFilter.mode === 'single' && (
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.8rem', fontWeight: 600, color: '#6b7280' }}>
            Showing dashboard for {MONTH_NAMES[appliedFilter.month - 1]} {appliedFilter.year}
          </p>
        )}
      </div>

      {/* ✅ Stats grid is now fixed at 3 columns so cards always wrap into
          rows of 3 (3 on top, 3 on bottom for 6 cards / 3 on top, 2 below
          for 5 cards) instead of squeezing every card into one row. This
          gives each card enough width for its full value to show without
          being cut off. */}
      <div className="stats-grid-5">
        {stats.map((stat, index) => (
          <div key={stat.key} className={`stat-card-5 stat-key-${stat.key} ${index === loanCardIndex ? 'loan-card' : ''}`}>
            <div className="stat-card-5-top">
              <div className="stat-card-5-icon" style={{ 
                background: index === loanCardIndex ? 'rgba(139, 92, 246, 0.12)' : undefined,
                color: index === loanCardIndex ? '#7c3aed' : undefined
              }}>
                <stat.icon size={18} />
              </div>
              <span className="stat-card-5-label">{stat.label}</span>
            </div>
            <span className="stat-card-5-value">{stat.value}</span>
            {stat.subtitle && (
              <span className="stat-card-5-sub" style={{
                color: index === loanCardIndex ? '#7c3aed' : undefined,
                background: index === loanCardIndex ? 'rgba(139, 92, 246, 0.08)' : undefined
              }}>
                {stat.subtitle}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>
            <Sparkles size={18} className="chart-header-icon" />
            {chartTitle}
          </h3>
          <div className="chart-type-selector">
            {chartTypes.map((type) => (
              <button
                key={type.id}
                className={`chart-type-btn ${selectedChart === type.id ? 'active' : ''}`}
                onClick={() => setSelectedChart(type.id)}
              >
                <type.icon size={16} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-container">
          {renderChart()}
        </div>
      </div>

      <div className="performers-revenue-grid">
        <div className="performers-section fixed-height">
          <h3><Award size={20} /> Top Performers - {statsMonthLabel}</h3>
          <div className="performer-card">
            <h4>{getBranchDisplayName()}</h4>
            <table className="performer-table">
              <thead>
                <tr><th>Rank</th><th>Employee</th><th>Accounts</th></tr>
              </thead>
              <tbody>
                {data.top_performers && data.top_performers.length > 0 ? (
                  data.top_performers.map((emp, index) => (
                    <tr key={index}>
                      <td className="rank-col">
                        <span className={`rank-badge ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>{emp.name}</td>
                      <td className="count-col">{emp.accounts}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="no-data">No performers this month</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="revenue-section">
          <div className="revenue-header" onClick={() => setShowBranchOverview(!showBranchOverview)}>
            <h3><DollarSign size={20} /> Revenue Comparison - {statsMonthLabel}</h3>
            <button className="expand-btn">
              {showBranchOverview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <div className="revenue-bars">
            <div className="branch-row">
              <span>{getBranchDisplayName()}</span>
              <div className="bar-track"><div className="bar-fill dark" style={{ width: '100%' }}></div></div>
              <span>{formatCurrency(data.total_revenue || 0)}</span>
            </div>
          </div>

          {showBranchOverview && data.branch_overview && (
            <div className="branch-overview-expanded">
              <div className="branch-overview-header"><h4>Branch Overview</h4></div>
              <div className="branch-overview-details">
                <div className="overview-item">
                  <span className="overview-label">Total Revenue</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.total_revenue || 0)}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Fixed Expenses</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.fixed_expenses || 0)}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Extra Expenses</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.extra_expenses || 0)}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Salaries</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.salaries || 0)}</span>
                </div>
                <div className="overview-item profit">
                  <span className="overview-label">Total Expenses</span>
                  <span className="overview-value">{formatCurrency(data.branch_overview.total_expenses || 0)}</span>
                </div>
                <div className="overview-item profit">
                  <span className="overview-label">Net Profit</span>
                  <span className="overview-value profit">{formatCurrency(data.branch_overview.profit || 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* Recent Alerts + Fixed Expense Pending         */}
      {/* ============================================ */}
      <div className="performers-revenue-grid">
        <div className="upcoming-expenses-section">
          <div className="upcoming-expenses-header">
            <div className="header-left">
              <h3>Recent Alerts</h3>
            </div>
            <button className="btn-view-all" onClick={handleRedirectToAlerts}>
              View All Alerts
              <ChevronRight size={16} />
            </button>
          </div>

          {isSpecificMonth ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>
              Alerts are only shown for the current month
            </div>
          ) : alertsLoading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>
              Loading alerts...
            </div>
          ) : visibleRecentAlerts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>
              No alerts found - All clear
            </div>
          ) : (
            <div className="upcoming-expenses-table-wrap">
              <table className="upcoming-expenses-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecentAlerts.map((a) => {
                    const meta = ALERT_TYPE_META[a.type] || { label: a.type?.toUpperCase() || 'ALERT', icon: AlertCircle, color: '#6b7280', bg: '#f3f4f6' };
                    const Icon = meta.icon;
                    return (
                      <tr key={a.id}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: meta.color,
                              background: meta.bg
                            }}
                          >
                            <Icon size={13} /> {meta.label}
                          </span>
                        </td>
                        <td className="expense-name-cell" style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.message}>
                          {a.message}
                        </td>
                        <td>
                          <div className="table-action-group">
                            <button
                              className="btn-ok-reminder"
                              onClick={() => handleDismissAlert(a.id)}
                              title="Dismiss Alert"
                            >
                              OK
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="upcoming-expenses-section">
          <div className="upcoming-expenses-header">
            <div className="header-left">
              <h3>Fixed Expense Pending</h3>
            </div>
            <button className="btn-view-all" onClick={handleRedirectToFixedExpenses}>
              View All Expenses
              <ChevronRight size={16} />
            </button>
          </div>

          {isSpecificMonth ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>
              Pending expenses are only shown for the current month
            </div>
          ) : visibleUpcomingExpenses.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>
              No fixed expenses pending
            </div>
          ) : (
            <div className="upcoming-expenses-table-wrap">
              <table className="upcoming-expenses-table">
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUpcomingExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="expense-name-cell">{expense.name}</td>
                      <td className="expense-amount-cell">{formatCurrency(expense.amount)}</td>
                      <td className="expense-duedate-cell">
                        {expense.dueDateObj.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        {getStatusPill()}
                      </td>
                      <td>
                        {openExpenseActions === expense.id ? (
                          <div className="table-action-group">
                            <button
                              className="btn-mark-paid"
                              onClick={() => handleMarkAsPaid(expense.id)}
                              title="Mark as Paid"
                            >
                              <CheckCircle size={15} /> Paid
                            </button>
                            <button
                              className="btn-ok-reminder"
                              onClick={() => handleDismissReminder(expense.id)}
                              title="Dismiss Reminder"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-action-dot"
                            onClick={() => toggleExpenseActions(expense.id)}
                            title="Show actions"
                          >
                            ⋮
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;