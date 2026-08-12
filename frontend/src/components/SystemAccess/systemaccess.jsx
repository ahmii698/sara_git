// src/components/SystemAccess/SystemAccess.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, Users, User, Shield, Briefcase, Mail, Phone, 
  CreditCard, MapPin, Building, CheckCircle, XCircle,
  Eye, RefreshCw, AlertCircle, UserCheck, UserX,
  Download, Printer, ChevronDown, ChevronRight, X,
  Key, Lock, Unlock, UserCog
} from 'lucide-react';
import './SystemAccess.css';
import { API_URL, STORAGE_URL } from '../../../config';
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
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: AlertCircle },
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
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 18px',
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
          flexShrink: 0,
          marginTop: '2px'
        }}>
          <Icon size={18} />
        </div>
        <div style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: 600,
          color: style.text,
          lineHeight: 1.5
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
            flexShrink: 0,
            marginTop: '2px'
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

// ============================================
// ✅ CONFIRMATION MODAL
// ============================================
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', cancelText = 'Cancel', loading = false }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        maxWidth: '420px',
        width: '100%',
        padding: '28px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'modalSlideUp 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertCircle size={20} style={{ color: '#dc2626' }} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0A1628', margin: 0 }}>{title || 'Confirm Action'}</h3>
        </div>
        
        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#4b5563', marginBottom: '24px', lineHeight: 1.6 }}>
          {message || 'Are you sure you want to perform this action?'}
        </p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              background: 'transparent',
              color: '#6b7280',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = 'transparent'; }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#93c5fd' : '#2563eb',
              color: '#fff',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = '#2563eb'; }}
          >
            {loading ? (
              <>
                <span className="spinning" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path}`;
};

const SystemAccess = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [users, setUsers] = useState({
    admin: [],
    manager: [],
    employee: [],
    systemAccess: []
  });
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    admin: true,
    manager: true,
    employee: true,
    systemAccess: true
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // ============================================
  // ✅ TOASTER STATE
  // ============================================
  const [toaster, setToaster] = useState({ message: '', type: 'info', show: false });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    onConfirm: null,
    onCancel: null,
    title: 'Confirm Action',
    message: 'Are you sure you want to perform this action?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    loading: false
  });

  const showToaster = (message, type = 'info') => {
    setToaster({ message, type, show: true });
  };

  const hideToaster = () => {
    setToaster({ message: '', type: 'info', show: false });
  };

  const showConfirm = (title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm) => {
    setConfirmModal({
      isOpen: true,
      onConfirm,
      onCancel: hideConfirm,
      title,
      message,
      confirmText,
      cancelText,
      loading: false
    });
  };

  const hideConfirm = () => {
    setConfirmModal({
      isOpen: false,
      onConfirm: null,
      onCancel: null,
      title: 'Confirm Action',
      message: 'Are you sure you want to perform this action?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      loading: false
    });
  };

  const setConfirmLoading = (loading) => {
    setConfirmModal(prev => ({ ...prev, loading }));
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserBranch(user.branch);
      setUserRole(user.role);
    }
    fetchUsers(1);
  }, []);

  const handleToggleAccess = useCallback(async (userItem) => {
    const grantingAccess = !userItem.has_system_access;
    
    showConfirm(
      grantingAccess ? 'Grant System Access' : 'Revoke System Access',
      grantingAccess 
        ? `Are you sure you want to grant system access to ${userItem.name}?`
        : `Are you sure you want to revoke system access from ${userItem.name}?`,
      'Confirm',
      'Cancel',
      async () => {
        setConfirmLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/system-access/${userItem.id}/toggle`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ has_system_access: grantingAccess })
          });

          const data = await response.json();

          if (data.success) {
            setUsers(prev => {
              const updatedEmployees = prev.employee.map(e =>
                e.id === userItem.id ? { ...e, has_system_access: grantingAccess } : e
              );
              return {
                ...prev,
                employee: updatedEmployees,
                systemAccess: updatedEmployees.filter(e => !!e.has_system_access)
              };
            });

            showToaster(
              grantingAccess
                ? `${userItem.name} has been granted system access.`
                : `${userItem.name}'s system access has been revoked.`,
              'success'
            );
            hideConfirm();
          } else {
            showToaster(data.message || 'Failed to update access.', 'error');
            setConfirmLoading(false);
          }
        } catch (err) {
          console.error('Toggle access error:', err);
          showToaster('Network error. Please try again.', 'error');
          setConfirmLoading(false);
        }
      }
    );
  }, []);

  const fetchUsers = useCallback(async (page = 1, append = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/system-access`;
      
      if (userRole !== 'admin' && userBranch) {
        url += `?branch_id=${userBranch}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      console.log('System Access Data:', data);

      if (data.success) {
        const groupedData = data.data || {};
        
        const admins = (groupedData.admin || []).filter(u => u !== null);
        const managers = (groupedData.manager || []).filter(u => u !== null);
        const employees = (groupedData.employee || []).filter(u => u !== null);
        
        const systemAccessUsers = employees.filter(u => u?.has_system_access === true);
        
        console.log('Admins:', admins.length, 'Managers:', managers.length, 'Employees:', employees.length);
        console.log('System Access Users:', systemAccessUsers.length);
        
        setUsers({
          admin: admins,
          manager: managers,
          employee: employees,
          systemAccess: systemAccessUsers
        });
        
        const total = admins.length + managers.length + employees.length;
        setTotalUsers(total);
        setTotalPages(1);
        setCurrentPage(1);
        
      } else {
        setError(data.message || 'Failed to fetch users');
        showToaster(data.message || 'Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please try again.');
      showToaster('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userBranch, userRole]);

  const filterUsers = useMemo(() => {
    return (usersList, applyBranchFilter = true) => {
      if (!usersList || !Array.isArray(usersList)) return [];
      
      let filtered = usersList;

      if (applyBranchFilter) {
        if (userBranch) {
          filtered = filtered.filter(user => String(user?.branch_id) === String(userBranch));
        } else if (branchFilter !== 'all') {
          filtered = filtered.filter(user => String(user?.branch_id) === String(branchFilter));
        }
      }

      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(user =>
          user?.name?.toLowerCase().includes(searchLower) ||
          user?.email?.toLowerCase().includes(searchLower) ||
          user?.cnic?.toLowerCase().includes(searchLower) ||
          user?.phone?.toLowerCase().includes(searchLower)
        );
      }

      return filtered;
    };
  }, [userBranch, branchFilter, search]);

  const filteredData = useMemo(() => {
    const admins = filterUsers(users.admin, false);
    const managers = filterUsers(users.manager, true);
    const employees = filterUsers(users.employee, true);
    const systemAccess = filterUsers(users.systemAccess, true);
    
    return {
      admins,
      managers,
      employees,
      systemAccess: systemAccess.filter(u => u && u.has_system_access === true),
      total: admins.length + managers.length + employees.length
    };
  }, [users, filterUsers]);

  const getCreatedByText = (user) => {
    const creator = user?.created_by;
    if (!creator || typeof creator !== 'object') return 'System / N/A';
    const roleLabel = creator.role
      ? creator.role.charAt(0).toUpperCase() + creator.role.slice(1)
      : '';
    const branchLabel = creator.branch_id ? ` - Branch ${creator.branch_id}` : '';
    return `${creator.name || ''}${roleLabel ? ` (${roleLabel}${branchLabel})` : ''}`.trim();
  };

  const exportData = useMemo(() => {
    const allUsers = [
      ...filteredData.admins.map(u => ({
        name: u?.name || 'N/A',
        email: u?.email || 'N/A',
        phone: u?.phone || 'N/A',
        role: 'Admin',
        branch: 'N/A',
        systemAccess: '-',
        status: u?.is_active ? 'Active' : 'Inactive',
        createdBy: getCreatedByText(u)
      })),
      ...filteredData.managers.map(u => ({
        name: u?.name || 'N/A',
        email: u?.email || 'N/A',
        phone: u?.phone || 'N/A',
        role: 'Manager',
        branch: u?.branch_name || (u?.branch_id ? `Branch ${u.branch_id}` : 'N/A'),
        systemAccess: '-',
        status: u?.is_active ? 'Active' : 'Inactive',
        createdBy: getCreatedByText(u)
      })),
      ...filteredData.employees.map(u => ({
        name: u?.name || 'N/A',
        email: u?.email || 'N/A',
        phone: u?.phone || 'N/A',
        role: 'Employee',
        branch: u?.branch_name || (u?.branch_id ? `Branch ${u.branch_id}` : 'N/A'),
        systemAccess: u?.has_system_access ? 'Granted' : 'No Access',
        status: u?.is_active ? 'Active' : 'Inactive',
        createdBy: getCreatedByText(u)
      }))
    ];
    return allUsers;
  }, [filteredData]);

  const exportColumns = [
    { header: 'Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Role', key: 'role' },
    { header: 'Branch', key: 'branch' },
    { header: 'System Access', key: 'systemAccess' },
    { header: 'Status', key: 'status' },
    { header: 'Created By', key: 'createdBy' },
  ];

  const toggleSectionExpand = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="status-badge active">
        <CheckCircle size={12} /> Active
      </span>
    ) : (
      <span className="status-badge inactive">
        <XCircle size={12} /> Inactive
      </span>
    );
  };

  const getAccessBadge = (hasAccess) => {
    return hasAccess ? (
      <span className="status-badge active" style={{ background: '#dbeafe', color: '#1e40af' }}>
        <Key size={12} /> Access Granted
      </span>
    ) : (
      <span className="status-badge inactive" style={{ background: '#fef3c7', color: '#92400e' }}>
        <Lock size={12} /> No Access
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: { bg: '#dbeafe', color: '#1e40af' },
      manager: { bg: '#fef3c7', color: '#92400e' },
      employee: { bg: '#d1fae5', color: '#065f46' }
    };
    const config = colors[role] || colors.employee;
    return (
      <span className="role-badge" style={{ background: config.bg, color: config.color }}>
        {role?.toUpperCase()}
      </span>
    );
  };

  const getCreatedByDisplay = (user) => {
    const creator = user?.created_by;
    if (!creator || typeof creator !== 'object') {
      return <span className="document-na">System / N/A</span>;
    }
    const roleLabel = creator.role
      ? creator.role.charAt(0).toUpperCase() + creator.role.slice(1)
      : '';
    const branchLabel = creator.branch_id ? ` - Branch ${creator.branch_id}` : '';
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '2px' }}>
        <span className="branch-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <UserCog size={12} />
          {creator.name} {roleLabel && `(${roleLabel}${branchLabel})`}
        </span>
        {creator.email && (
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {creator.email}
          </span>
        )}
      </span>
    );
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCNIC = (cnic) => {
    if (!cnic) return '-';
    const clean = cnic.replace(/[^0-9]/g, '');
    if (clean.length === 13) {
      return `${clean.slice(0, 5)}-${clean.slice(5, 12)}-${clean.slice(12)}`;
    }
    return cnic;
  };

  const renderUserTable = (section, title, usersList, Icon, showAccess = false, showBranch = true, applyBranchFilter = true, showAccessAction = false, showCreatedBy = false) => {
    const filtered = filterUsers(usersList, applyBranchFilter);
    const isExpanded = expandedSections[section];
    const count = filtered.length;

    if (count === 0 && !search) {
      return null;
    }

    if (section === 'systemAccess') {
      const accessUsers = filtered.filter(u => u && u.has_system_access === true);
      if (accessUsers.length === 0 && !search) return null;
    }

    return (
      <div className="role-section">
        <div className="role-header" onClick={() => toggleSectionExpand(section)}>
          <div className="role-header-left">
            <Icon size={20} className="role-icon" />
            <h3 className="role-title">{title}</h3>
            <span className="role-count">{count}</span>
          </div>
          <div className="role-header-right">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="role-content">
            {filtered.length === 0 ? (
              <div className="no-users-message">
                <AlertCircle size={20} />
                <span>No {title?.toLowerCase()} found matching your search</span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="user-table">
                  <thead>
              <tr style={{ background: '#1E1B4B' }}>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>#</th>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Name</th>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Email</th>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Phone</th>
                      {showBranch && section !== 'admin' && <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Branch</th>}
                      {showAccess && <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>System Access</th>}
                      {showCreatedBy && <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Created By</th>}
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Status</th>
                      <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Actions</th>
                      {showAccessAction && <th style={{ fontWeight: 800, color: '#fff', padding: '14px 16px', textAlign: 'left', borderBottom: 'none' }}>Access Control</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((user, index) => {
                      if (section === 'systemAccess' && !user?.has_system_access) {
                        return null;
                      }
                      return (
                        <tr key={user?.id || index} onClick={() => openUserModal(user)}>
                          <td className="text-center">{index + 1}</td>
                          <td>
                            <div className="user-name-cell">
                              <div className="user-avatar-small" style={{
                                background: user?.role === 'admin' ? '#dbeafe' : 
                                          user?.role === 'manager' ? '#fef3c7' : '#d1fae5',
                                color: user?.role === 'admin' ? '#1e40af' : 
                                       user?.role === 'manager' ? '#92400e' : '#065f46'
                              }}>
                                {user?.name?.charAt(0) || 'U'}
                              </div>
                              <span className="user-name-text">{user?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="user-email-text">{user?.email || 'N/A'}</td>
                          <td>{user?.phone || 'N/A'}</td>
                          {showBranch && section !== 'admin' && (
                            <td>
                              <span className="branch-tag">
                                <Building size={12} />
                                {user?.branch_name || `Branch ${user?.branch_id}` || 'N/A'}
                              </span>
                            </td>
                          )}
                          {showAccess && (
                            <td>{getAccessBadge(user?.has_system_access)}</td>
                          )}
                          {showCreatedBy && (
                            <td>{getCreatedByDisplay(user)}</td>
                          )}
                          <td>{getStatusBadge(user?.is_active)}</td>
                          <td>
                            <button className="btn-view-detail" onClick={(e) => {
                              e.stopPropagation();
                              openUserModal(user);
                            }}>
                              <Eye size={16} />
                              View
                            </button>
                          </td>
                          {showAccessAction && (
                            <td>
                              <button
                                className="btn-view-detail"
                                style={
                                  user?.has_system_access
                                    ? { background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' }
                                    : { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleAccess(user);
                                }}
                              >
                                {user?.has_system_access ? (
                                  <>
                                    <Lock size={16} />
                                    Revoke Access
                                  </>
                                ) : (
                                  <>
                                    <Unlock size={16} />
                                    Grant Access
                                  </>
                                )}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const UserDetailModal = () => {
    if (!selectedUser) return null;
    const user = selectedUser;

    return (
      <div className="modal-overlay" onClick={closeUserModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-header-left">
              <User size={24} className="modal-icon" />
              <div>
                <h3 className="modal-title">User Details</h3>
                <p className="modal-subtitle">{user?.name || 'N/A'}</p>
              </div>
            </div>
            <button className="modal-close" onClick={closeUserModal}>
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            <div className="profile-summary">
              <div className="profile-avatar" style={{
                background: user?.role === 'admin' ? '#dbeafe' : 
                          user?.role === 'manager' ? '#fef3c7' : '#d1fae5',
                color: user?.role === 'admin' ? '#1e40af' : 
                       user?.role === 'manager' ? '#92400e' : '#065f46'
              }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.name || 'N/A'}</div>
                <div className="profile-role">{getRoleBadge(user?.role)}</div>
                <div className="profile-status">{getStatusBadge(user?.is_active)}</div>
                {user?.role === 'employee' && (
                  <div className="profile-access">{getAccessBadge(user?.has_system_access)}</div>
                )}
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item-full">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{user?.name || 'N/A'}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user?.email || 'N/A'}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{user?.phone || 'N/A'}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">CNIC</span>
                <span className="detail-value">{formatCNIC(user?.cnic)}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Address</span>
                <span className="detail-value">{user?.address || 'N/A'}</span>
              </div>
              {user?.role !== 'admin' && (
                <div className="detail-item-full">
                  <span className="detail-label">Branch</span>
                  <span className="detail-value">{user?.branch_name || `Branch ${user?.branch_id}` || 'N/A'}</span>
                </div>
              )}
              {user?.role !== 'admin' && (
                <div className="detail-item-full">
                  <span className="detail-label">Salary</span>
                  <span className="detail-value">PKR {user?.salary?.toLocaleString() || '0'}</span>
                </div>
              )}
              {user?.role === 'employee' && (
                <div className="detail-item-full">
                  <span className="detail-label">System Access</span>
                  <span className="detail-value">
                    {user?.has_system_access ? 'Granted' : 'Not Granted'}
                  </span>
                </div>
              )}
              <div className="detail-item-full">
                <span className="detail-label">Created By</span>
                <span className="detail-value">{getCreatedByDisplay(user)}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Joined Date</span>
                <span className="detail-value">{formatDate(user?.created_at)}</span>
              </div>
              <div className="detail-item-full">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">{formatDate(user?.updated_at)}</span>
              </div>
            </div>

            <div className="documents-section">
              <h4 className="documents-title">Documents</h4>
              <div className="documents-grid">
                <div className="document-item">
                  <span className="document-label">CNIC Front</span>
                  {user?.cnic_front ? (
                    <a href={getFileUrl(user.cnic_front)} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">CNIC Back</span>
                  {user?.cnic_back ? (
                    <a href={getFileUrl(user.cnic_back)} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">Agreement Form</span>
                  {user?.agreement_form ? (
                    <a href={getFileUrl(user.agreement_form)} target="_blank" rel="noopener noreferrer" className="document-link">
                      View Document
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
                <div className="document-item">
                  <span className="document-label">Voice Consent</span>
                  {user?.voice_consent ? (
                    <a href={getFileUrl(user.voice_consent)} target="_blank" rel="noopener noreferrer" className="document-link">
                      Play Audio
                    </a>
                  ) : (
                    <span className="document-na">Not Uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-close-modal" onClick={closeUserModal}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="system-access-container">
        <div className="loading-state">
          <RefreshCw size={40} className="spinning" />
          <p>Loading system access data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-access-container">
        <div className="error-state">
          <AlertCircle size={40} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => fetchUsers(1)}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';
  const isAdminUser = userRole === 'admin';
  const isManagerUser = userRole === 'manager';

  return (
    <div className="system-access-container">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      {/* ===== CONFIRM MODAL ===== */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onConfirm={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
        }}
        onCancel={() => {
          if (confirmModal.onCancel) confirmModal.onCancel();
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        loading={confirmModal.loading}
      />

      {showUserModal && <UserDetailModal />}

      <div className="system-access-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>System Access</h2>
            <span className="live-badge">
              <Users size={12} /> Live
            </span>
          </div>
          <p className="header-subtitle">
            {userBranch 
              ? `Showing users for ${branchLabel}` 
              : 'Manage and view all system users'}
            <span className="user-count-badge" style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
              ({totalUsers} total users)
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ExportButton
            data={exportData}
            columns={exportColumns}
            filename="system-access-report"
            title="System Access Report"
          />
          <button className="btn-refresh" onClick={() => fetchUsers(1)}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="summary-cards">
        {/* ✅ Admins Card - Sirf Admin ko dikhega */}
        {isAdminUser && (
          <div className="summary-card admin-card">
            <div className="summary-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
              <Shield size={22} />
            </div>
            <div className="summary-info">
              <span className="summary-label">Total Admins</span>
              <span className="summary-value">{filteredData.admins.length}</span>
            </div>
          </div>
        )}
        <div className="summary-card manager-card">
          <div className="summary-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
            <Briefcase size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Managers</span>
            <span className="summary-value">{filteredData.managers.length}</span>
          </div>
        </div>
        <div className="summary-card employee-card">
          <div className="summary-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
            <User size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">Total Employees</span>
            <span className="summary-value">{filteredData.employees.length}</span>
          </div>
        </div>
        <div className="summary-card system-access-card">
          <div className="summary-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <Key size={22} />
          </div>
          <div className="summary-info">
            <span className="summary-label">System Access</span>
            <span className="summary-value">{filteredData.systemAccess.length}</span>
          </div>
        </div>
      </div>

      <div className="system-controls">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, CNIC or phone..."
            value={search}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        {!userBranch && (
          <div className="branch-filters">
            <button 
              className={`filter-btn ${branchFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBranchFilter('all')}
            >
              All Branches
            </button>
            <button 
              className={`filter-btn ${branchFilter === '1' ? 'active' : ''}`}
              onClick={() => setBranchFilter('1')}
            >
              Branch 1
            </button>
            <button 
              className={`filter-btn ${branchFilter === '2' ? 'active' : ''}`}
              onClick={() => setBranchFilter('2')}
            >
              Branch 2
            </button>
          </div>
        )}
        
        {userBranch && (
          <div className="branch-info-badge">
            <Building size={14} />
            <span>Branch {userBranch} (Your Current Branch)</span>
          </div>
        )}
      </div>

      <div className="roles-container">
        {/* ✅ Admin Table - Sirf Admin ko dikhega */}
        {isAdminUser && renderUserTable('admin', 'Admins', users.admin, Shield, false, false, false, false, false)}
        
        {/* ✅ Manager Table - Admin aur Manager dono ko */}
        {renderUserTable('manager', 'Managers', users.manager, Briefcase, false, true, true, false, true)}
        
        {/* ✅ Employees Table - Sabko */}
        {renderUserTable('employee', 'All Employees', users.employee, User, true, true, true, true, true)}
        
        {/* ✅ System Access List - Sabko */}
        {renderUserTable('systemAccess', 'System Access List', users.systemAccess, Key, true, true, true, true, true)}
      </div>

      <div className="system-footer">
        <span className="total-record-text">
          Showing {filteredData.total} users | {filteredData.systemAccess.length} with system access
        </span>
      </div>
    </div>
  );
};

export default SystemAccess;