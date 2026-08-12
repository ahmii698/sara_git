import React, { useState, useEffect } from 'react';
import { Search, Eye, Wallet, Calendar, DollarSign, User, Home, LogOut, Receipt, BarChart3 } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import './EmployeeRecovery.css';
import logo from '../../assets/logo.jpeg';

const EmployeeRecovery = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'employee') {
      setEmployeeData(user);
      // Get employee details
      const empDetails = {
        1: { name: 'Employee B1', branch: 1 },
        2: { name: 'Employee B2', branch: 2 },
      };
      setEmployeeDetails(empDetails[user.employeeId] || empDetails[1]);
    } else {
      navigate('/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  // ===== DUMMY RECOVERY DATA =====
  const recoveryData = [
    { 
      id: 1, 
      customer: 'Ahmed Khan', 
      caseNo: 'SR-001', 
      amount: 60000, 
      paid: 25000, 
      due: 35000, 
      monthly: 5000,
      installments: [
        { month: 'Jan 2026', due: 5000, paid: 5000, status: 'Paid' },
        { month: 'Feb 2026', due: 5000, paid: 5000, status: 'Paid' },
        { month: 'Mar 2026', due: 5000, paid: 3000, status: 'Partial' },
        { month: 'Apr 2026', due: 5000, paid: 0, status: 'Unpaid' },
      ]
    },
    { 
      id: 2, 
      customer: 'Sara Ali', 
      caseNo: 'SR-002', 
      amount: 80000, 
      paid: 40000, 
      due: 40000, 
      monthly: 6000,
      installments: [
        { month: 'Jan 2026', due: 6000, paid: 6000, status: 'Paid' },
        { month: 'Feb 2026', due: 6000, paid: 6000, status: 'Paid' },
        { month: 'Mar 2026', due: 6000, paid: 6000, status: 'Paid' },
        { month: 'Apr 2026', due: 6000, paid: 0, status: 'Unpaid' },
      ]
    },
    { 
      id: 3, 
      customer: 'Usman Malik', 
      caseNo: 'SR-003', 
      amount: 50000, 
      paid: 50000, 
      due: 0, 
      monthly: 0,
      installments: [
        { month: 'Jan 2026', due: 5000, paid: 5000, status: 'Paid' },
        { month: 'Feb 2026', due: 5000, paid: 5000, status: 'Paid' },
        { month: 'Mar 2026', due: 5000, paid: 5000, status: 'Paid' },
        { month: 'Apr 2026', due: 5000, paid: 5000, status: 'Paid' },
      ]
    },
  ];

  const filtered = recoveryData.filter(r => 
    r.customer.toLowerCase().includes(search.toLowerCase()) ||
    r.caseNo.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0);
  const totalPaid = filtered.reduce((sum, r) => sum + r.paid, 0);
  const totalDue = filtered.reduce((sum, r) => sum + r.due, 0);

  // ===== NAV ITEMS =====
  const navItems = [
    { path: '/employee-dashboard', icon: Home, label: 'Dashboard' },
    { path: '/employee-recovery', icon: Wallet, label: 'Recovery' },
  ];

  return (
    <div className="employee-app-layout">
      {/* ===== SIDEBAR ===== */}
      <div className="employee-sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="SARA Electronics" className="logo-image" />
          <h1 className="brand-title">SARA <span>Electronics</span></h1>
          <p className="brand-subtitle">EMPLOYEE PANEL</p>
          {employeeDetails && (
            <p className="brand-branch">Branch {employeeDetails.branch}</p>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="employee-main-content">
        {/* ===== HEADER ===== */}
        <header className="employee-header">
          <div className="header-left">
            <h2>My Recovery Records</h2>
            <p className="welcome-text">Accounts opened by you</p>
          </div>
          <div className="header-right">
            {employeeDetails && (
              <span className="header-branch">Branch {employeeDetails.branch}</span>
            )}
          </div>
        </header>

        {/* ===== PAGE CONTENT ===== */}
        <div className="employee-page-content">
          {/* ===== STATS ===== */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total-icon"><DollarSign size={20} /></div>
              <div className="stat-info">
                <span className="stat-label">Total Amount</span>
                <span className="stat-value">PKR {totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon paid-icon"><Wallet size={20} /></div>
              <div className="stat-info">
                <span className="stat-label">Total Paid</span>
                <span className="stat-value">PKR {totalPaid.toLocaleString()}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon due-icon"><Calendar size={20} /></div>
              <div className="stat-info">
                <span className="stat-label">Total Due</span>
                <span className="stat-value">PKR {totalDue.toLocaleString()}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon count-icon"><User size={20} /></div>
              <div className="stat-info">
                <span className="stat-label">Total Customers</span>
                <span className="stat-value">{filtered.length}</span>
              </div>
            </div>
          </div>

          {/* ===== SEARCH ===== */}
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer or case..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ===== TABLE ===== */}
          <div className="table-container">
            <table className="recovery-table">
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Customer</th>
                  <th>Total (PKR)</th>
                  <th>Paid (PKR)</th>
                  <th>Due (PKR)</th>
                  <th>Monthly</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No recovery records found</td></tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id}>
                      <td className="case-number">{item.caseNo}</td>
                      <td>{item.customer}</td>
                      <td>PKR {item.amount.toLocaleString()}</td>
                      <td className="paid-amount">PKR {item.paid.toLocaleString()}</td>
                      <td className={item.due > 0 ? 'due-amount' : 'paid-amount'}>
                        PKR {item.due.toLocaleString()}
                      </td>
                      <td>{item.monthly > 0 ? `PKR ${item.monthly.toLocaleString()}` : '---'}</td>
                      <td>
                        <span className={item.due === 0 ? 'badge-paid' : 'badge-pending'}>
                          {item.due === 0 ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-view" title="View Installments">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRecovery;