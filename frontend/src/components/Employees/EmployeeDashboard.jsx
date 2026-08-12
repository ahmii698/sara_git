import React, { useState, useEffect } from 'react';
import { DollarSign, Award, Calendar, TrendingUp, Eye, FileText, BarChart3, Building, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [employeeData, setEmployeeData] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'employee') {
      setEmployeeData(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleFullReport = () => {
    setActiveTab('report');
  };

  // ===== DUMMY EMPLOYEE DATA =====
  const empDetails = {
    1: {
      name: 'Employee B1',
      branch: 1,
      salary: 45000,
      commission: 24000,
      totalAccounts: 45,
      leaves: 4,
      joiningDate: '2025-06-01',
      totalRecovery: 1125000,
      avgAccounts: 8,
      monthlyData: {
        'Jan': { accounts: 12, recovery: 45000, commission: 24000, leaves: 2 },
        'Feb': { accounts: 15, recovery: 52000, commission: 30000, leaves: 1 },
        'Mar': { accounts: 10, recovery: 38000, commission: 20000, leaves: 3 },
        'Apr': { accounts: 8, recovery: 32000, commission: 16000, leaves: 1 },
        'May': { accounts: 11, recovery: 42000, commission: 22000, leaves: 2 },
        'Jun': { accounts: 14, recovery: 50000, commission: 28000, leaves: 0 },
      }
    },
    2: {
      name: 'Employee B2',
      branch: 2,
      salary: 41000,
      commission: 22000,
      totalAccounts: 38,
      leaves: 5,
      joiningDate: '2025-08-01',
      totalRecovery: 950000,
      avgAccounts: 6,
      monthlyData: {
        'Jan': { accounts: 8, recovery: 32000, commission: 16000, leaves: 2 },
        'Feb': { accounts: 10, recovery: 40000, commission: 20000, leaves: 1 },
        'Mar': { accounts: 12, recovery: 45000, commission: 24000, leaves: 0 },
        'Apr': { accounts: 8, recovery: 30000, commission: 15000, leaves: 2 },
        'May': { accounts: 9, recovery: 35000, commission: 18000, leaves: 1 },
        'Jun': { accounts: 11, recovery: 42000, commission: 22000, leaves: 0 },
      }
    }
  };

  const empId = employeeData?.employeeId || 1;
  const data = empDetails[empId] || empDetails[1];

  // ===== STATS =====
  const stats = [
    { 
      label: 'Monthly Salary', 
      value: `PKR ${data.salary.toLocaleString()}`, 
      icon: DollarSign, 
      className: 'salary' 
    },
    { 
      label: 'Commission', 
      value: `PKR ${data.commission.toLocaleString()}`, 
      icon: Award, 
      className: 'commission' 
    },
    { 
      label: 'Total Accounts', 
      value: data.totalAccounts, 
      icon: BarChart3, 
      className: 'accounts' 
    },
    { 
      label: 'Leaves Taken', 
      value: data.leaves, 
      icon: Calendar, 
      className: 'leaves' 
    },
  ];

  const quickStats = [
    { label: 'Joining Date', value: data.joiningDate, icon: Calendar },
    { label: 'Current Branch', value: `Branch ${data.branch}`, icon: Building },
    { label: 'Total Recovery', value: `PKR ${data.totalRecovery.toLocaleString()}`, icon: DollarSign },
    { label: 'Average Accounts/Month', value: data.avgAccounts, icon: TrendingUp },
  ];

  const maxValue = Math.max(
    ...Object.values(data.monthlyData).map(m => Math.max(m.accounts, m.recovery / 1000))
  );

  return (
    <div className="employee-dashboard">
      {/* ===== WELCOME HEADER ===== */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <div className="welcome-title-group">
            <h2>Employee Dashboard</h2>
            <span className="live-badge">
              <TrendingUp size={12} /> Active
            </span>
          </div>
          <p className="welcome-text">Welcome back, {data.name}!</p>
        </div>
        <div className="welcome-badge">
          <Building size={16} />
          Branch {data.branch}
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.className}`}>
            <div className={`stat-icon ${stat.className}-icon`}>
              <stat.icon size={20} />
            </div>
            <div className="stat-info">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== PERFORMANCE CHART ===== */}
      <div className="performance-section">
        <div className="section-header">
          <div className="section-header-left">
            <BarChart3 size={20} />
            <h3>Monthly Performance</h3>
          </div>
          <button className="view-report-btn" onClick={handleFullReport}>
            <Eye size={16} />
            Full Report
          </button>
        </div>

        <div className="chart-container">
          <div className="chart-bars">
            {Object.entries(data.monthlyData).map(([month, item]) => (
              <div key={month} className="chart-bar-group">
                <div className="chart-bar-wrapper">
                  <div 
                    className="chart-bar accounts-bar" 
                    style={{ height: `${(item.accounts / maxValue) * 120}px` }}
                  >
                    <span className="bar-value">{item.accounts}</span>
                  </div>
                  <div 
                    className="chart-bar recovery-bar" 
                    style={{ height: `${((item.recovery / 1000) / maxValue) * 120}px` }}
                  >
                    <span className="bar-value">{(item.recovery / 1000).toFixed(1)}k</span>
                  </div>
                </div>
                <span className="bar-label">{month}</span>
                <div className="bar-sub-label">
                  <span>{item.accounts} acc</span>
                  <span>PKR {(item.recovery/1000).toFixed(1)}k</span>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot accounts-dot"></span> Accounts</span>
            <span><span className="legend-dot recovery-dot"></span> Recovery (PKR'000)</span>
          </div>
        </div>
      </div>

      {/* ===== QUICK STATS ===== */}
      <div className="quick-stats-section">
        <h3>Quick Stats</h3>
        <div className="quick-stats-grid">
          {quickStats.map((stat, index) => (
            <div key={index} className="quick-stat-card">
              <div className="quick-stat-icon">
                <stat.icon size={18} />
              </div>
              <div className="quick-stat-info">
                <p className="quick-stat-label">{stat.label}</p>
                <p className="quick-stat-value">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FULL REPORT (Conditional) ===== */}
      {activeTab === 'report' && (
        <div className="full-report-section">
          <div className="report-header">
            <h3>Complete Employee Report</h3>
            <button className="close-report-btn" onClick={() => setActiveTab('overview')}>
              ✕
            </button>
          </div>
          <div className="report-grid">
            <div className="report-item">
              <span>Employee Name</span>
              <strong>{data.name}</strong>
            </div>
            <div className="report-item">
              <span>Branch</span>
              <strong>Branch {data.branch}</strong>
            </div>
            <div className="report-item">
              <span>Joining Date</span>
              <strong>{data.joiningDate}</strong>
            </div>
            <div className="report-item">
              <span>Total Accounts</span>
              <strong>{data.totalAccounts}</strong>
            </div>
            <div className="report-item">
              <span>Total Recovery</span>
              <strong>PKR {data.totalRecovery.toLocaleString()}</strong>
            </div>
            <div className="report-item">
              <span>Total Commission</span>
              <strong>PKR {data.commission.toLocaleString()}</strong>
            </div>
            <div className="report-item">
              <span>Leaves Taken</span>
              <strong>{data.leaves}</strong>
            </div>
            <div className="report-item">
              <span>Monthly Salary</span>
              <strong>PKR {data.salary.toLocaleString()}</strong>
            </div>
          </div>

          <div className="monthly-breakdown">
            <h4>Monthly Breakdown</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Accounts</th>
                  <th>Recovery (PKR)</th>
                  <th>Commission (PKR)</th>
                  <th>Leaves</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.monthlyData).map(([month, item]) => (
                  <tr key={month}>
                    <td>{month}</td>
                    <td>{item.accounts}</td>
                    <td>PKR {item.recovery.toLocaleString()}</td>
                    <td>PKR {item.commission.toLocaleString()}</td>
                    <td>{item.leaves}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;