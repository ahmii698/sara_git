// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/Login/Login';
import Inventory from './components/Inventory/Inventory';
import Salary from './components/Finance/Salary';
import FixedExpense from './components/Finance/FixedExpense';
import ExtraExpense from './components/Finance/ExtraExpense';
import AddAccount from './components/Accounts/AddAccount';
import Recovery from './components/Recovery/Recovery';
import AddEmployee from './components/Employees/AddEmployee';
import EmployeeExpenses from './components/Employees/EmployeeExpenses';
import EmployeeReport from './components/Employees/EmployeeReport';
import OverdueInstallments from './components/OverdueInstallments/OverdueInstallments';
import AgingReport from './components/Reports/AgingReport';
import EmployeePerformanceReport from './components/Reports/EmployeePerformanceReport';
import UsersManagement from './components/Users/Users';
import Installments from './components/Installments/Installments';
import SelectedRecovery from './components/Installments/SelectedRecovery';
import Leaveapplication from './components/leave/Leaveapplication';
import SystemAccess from './components/SystemAccess/SystemAccess';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import './App.css';

// ✅ Import components for new pages
import Alert from './components/Alert/Alert';
import AccountTarget from './components/AccountTarget/AccountTarget';

// ✅ NEW: Cash Flow & Daily Sheet
import CashFlow from './components/CashFlow/CashFlow';
import DailySheet from './components/DailySheet/DailySheet';

// ❌ EmployeeTarget REMOVED - file delete kar di hai

// ✅ Employee sirf inhi paths pe ja sakta hai
const EMPLOYEE_ALLOWED_PATHS = ['/employee-performance', '/apply-leave', '/selected-recovery'];

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Employee - sirf allowed paths (Performance + Apply Leave + Selected Recovery)
  if (user.role === 'employee') {
    if (EMPLOYEE_ALLOWED_PATHS.includes(location.pathname)) {
      return children;
    }
    return <Navigate to="/employee-performance" />;
  }

  // Manager - dashboard par nahi ja sakta
  if (user.role === 'manager' && location.pathname === '/') {
    return <Navigate to="/add-account" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/add-account" />;
  }

  return children;
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <BrowserRouter>
      {isLoggedIn ? (
        <div className="app-container">
          <Sidebar />
          <div className="main-content">
            <Header />
            <div className="page-content">
              <Routes>
                {/* ============================================ */}
                {/* DASHBOARD - Admin only */}
                {/* ============================================ */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Home />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* CASH FLOW - Admin & Manager */}
                {/* ============================================ */}
                <Route 
                  path="/cash-flow" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <CashFlow />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* DAILY SHEET - Admin & Manager */}
                {/* ============================================ */}
                <Route 
                  path="/daily-sheet" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <DailySheet />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* INVENTORY - All roles? */}
                {/* ============================================ */}
                <Route path="/inventory" element={<Inventory />} />

                {/* ============================================ */}
                {/* ✅ FINANCE ROUTES - Admin & Manager */}
                {/* ============================================ */}
                <Route 
                  path="/finance/salary" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <Salary />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/finance/fixed" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <FixedExpense />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* ✅ EXTRA EXPENSES - Admin & Manager */}
                {/* ============================================ */}
                <Route 
                  path="/extra-expenses" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <ExtraExpense />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* ❌ EMPLOYEE TARGET REMOVED - Route bhi hatao */}
                {/* ============================================ */}

                {/* ============================================ */}
                {/* COMMON ROUTES - Admin & Manager */}
                {/* ============================================ */}
                <Route 
                  path="/add-account" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <AddAccount />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/recovery" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <Recovery />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employees/add" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <AddEmployee />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employee-expenses" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <EmployeeExpenses />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employee-report" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <EmployeeReport />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/overdue-installments" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <OverdueInstallments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/aging-report" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <AgingReport />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/users" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <UsersManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/installments" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <Installments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/alert" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <Alert />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/account-target" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']}>
                      <AccountTarget />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* EMPLOYEE PERFORMANCE - Admin, Manager, Employee */}
                {/* ============================================ */}
                <Route 
                  path="/employee-performance" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                      <EmployeePerformanceReport />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* APPLY LEAVE - Admin, Manager, Employee */}
                {/* ============================================ */}
                <Route 
                  path="/apply-leave" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                      <Leaveapplication />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* SELECTED RECOVERY - Admin, Manager, Employee */}
                {/* ============================================ */}
                <Route 
                  path="/selected-recovery" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                      <SelectedRecovery />
                    </ProtectedRoute>
                  } 
                />

                {/* ============================================ */}
                {/* SYSTEM ACCESS - Admin only */}
                {/* ============================================ */}
                <Route 
                  path="/system-access" 
                  element={
                    <ProtectedRoute allowedRoles={['admin','manager']}>
                      <SystemAccess />
                    </ProtectedRoute>
                  } 
                />

                <Route path="/login" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;