import React, { useState, useEffect } from 'react';
import { User, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  // ===== EMPLOYEE HEADER =====
  if (user?.role === 'employee') {
    return (
      <header className="header employee-header">
        <div className="employee-header-left">
          <div className="employee-brand">
            <span className="brand-panel">EMPLOYEE PANEL</span>
          </div>
        </div>
        <div className="employee-header-right">
          <div className="header-user">
            <div className="user-avatar">
              {user?.email?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.email}</p>
              <p className="user-role">Employee</p>
            </div>
          </div>
          <button className="logout-btn-header" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>
    );
  }

  // ===== ADMIN/MANAGER HEADER - LEFT SIDE FIXED =====
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <span className="brand-name">SARA <span>Electronics</span></span>
          <span className="brand-panel">{user?.role === 'admin' ? 'ADMIN PANEL' : 'MANAGER PANEL'}</span>
        </div>
      </div>
      <div className="header-right">
        <div className="header-user">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.email}</p>
            <p className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Manager'}</p>
          </div>
        </div>
        <button className="logout-btn-header" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;