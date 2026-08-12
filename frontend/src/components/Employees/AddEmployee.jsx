// src/components/AddEmployee/AddEmployee.jsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  UserPlus, Mail, Phone, MapPin, Briefcase, DollarSign, Lock, User, 
  Building, Upload, X, CreditCard, FileText, CheckCircle, AlertCircle, 
  Calendar, Mic, Play, Trash2, FileAudio, Shield
} from 'lucide-react';
import './AddEmployee.css';
import { API_URL } from '../../../config';

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

const AddEmployee = () => {
  const [employee, setEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    branch: 1,
    role: 'employee',
    password: '',
    confirmPassword: '',
    address: '',
    salary: '',
    hasSystemAccess: true,
    cnicFront: null,
    cnicBack: null,
    cnicFrontPreview: '',
    cnicBackPreview: '',
    agreement: null,
    agreementPreview: '',
    agreementName: '',
    voiceFile: null,
    voiceFilePreview: '',
    voiceFileName: '',
  });

  const [errors, setErrors] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);

  const cnicFrontRef = useRef(null);
  const cnicBackRef = useRef(null);
  const agreementRef = useRef(null);
  const voiceFileRef = useRef(null);

  // ============================================
  // ✅ TOASTER STATE
  // ============================================
  const [toaster, setToaster] = useState({ message: '', type: 'info', show: false });

  const showToaster = (message, type = 'info') => {
    setToaster({ message, type, show: true });
  };

  const hideToaster = () => {
    setToaster({ message: '', type: 'info', show: false });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
      if (user.branch) {
        setEmployee(prev => ({ 
          ...prev, 
          branch: parseInt(user.branch),
          email: '',
          password: '',
          confirmPassword: ''
        }));
      }
    }
  }, []);

  const handleCnicUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') {
        setEmployee({ ...employee, cnicFront: file, cnicFrontPreview: reader.result });
      } else if (type === 'back') {
        setEmployee({ ...employee, cnicBack: file, cnicBackPreview: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAgreementUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEmployee({
        ...employee,
        agreement: file,
        agreementPreview: reader.result,
        agreementName: file.name,
      });
    };
    reader.readAsDataURL(file);
    if (agreementRef.current) agreementRef.current.value = '';
  };

  const handleVoiceFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      showToaster('Please select an audio file (mp3, wav, etc.)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEmployee({
        ...employee,
        voiceFile: file,
        voiceFilePreview: reader.result,
        voiceFileName: file.name,
      });
      showToaster('Voice file uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
    if (voiceFileRef.current) voiceFileRef.current.value = '';
  };

  const removeCnicFile = (type) => {
    if (type === 'front') {
      setEmployee({ ...employee, cnicFront: null, cnicFrontPreview: '' });
      if (cnicFrontRef.current) cnicFrontRef.current.value = '';
    } else if (type === 'back') {
      setEmployee({ ...employee, cnicBack: null, cnicBackPreview: '' });
      if (cnicBackRef.current) cnicBackRef.current.value = '';
    }
  };

  const removeAgreement = () => {
    setEmployee({ ...employee, agreement: null, agreementPreview: '', agreementName: '' });
    if (agreementRef.current) agreementRef.current.value = '';
  };

  const removeVoiceFile = () => {
    setEmployee({ ...employee, voiceFile: null, voiceFilePreview: '', voiceFileName: '' });
    if (voiceFileRef.current) voiceFileRef.current.value = '';
    showToaster('Voice file removed', 'info');
  };

  const playVoice = () => {
    if (!employee.voiceFilePreview) return;
    const audio = new Audio(employee.voiceFilePreview);
    audio.play();
    setPlayingIndex(0);
    audio.onended = () => {
      setPlayingIndex(null);
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'branch' && userBranch) return;
    setEmployee({ ...employee, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // ✅ Salary field par click/focus hote hi poora text select ho jayega
  const handleSalaryFocus = (e) => {
    e.target.select();
  };

  const clearForm = () => {
    setEmployee({
      name: '',
      email: '',
      phone: '',
      branch: userBranch ? parseInt(userBranch) : 1,
      role: 'employee',
      password: '',
      confirmPassword: '',
      address: '',
      salary: '',
      hasSystemAccess: true,
      cnicFront: null,
      cnicBack: null,
      cnicFrontPreview: '',
      cnicBackPreview: '',
      agreement: null,
      agreementPreview: '',
      agreementName: '',
      voiceFile: null,
      voiceFilePreview: '',
      voiceFileName: '',
    });
    setErrors({});
    setFormSubmitted(false);
    
    if (cnicFrontRef.current) cnicFrontRef.current.value = '';
    if (cnicBackRef.current) cnicBackRef.current.value = '';
    if (agreementRef.current) agreementRef.current.value = '';
    if (voiceFileRef.current) voiceFileRef.current.value = '';
    
    showToaster('Form cleared', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!employee.name) newErrors.name = 'Name is required';
    if (!employee.email) newErrors.email = 'Email is required';
    if (!employee.phone) newErrors.phone = 'Phone is required';
    if (!employee.password) newErrors.password = 'Password is required';
    if (employee.password !== employee.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!employee.cnicFront) newErrors.cnicFront = 'CNIC Front image is required';
    if (!employee.cnicBack) newErrors.cnicBack = 'CNIC Back image is required';
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setLoading(true);
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      showToaster('Please fix all errors before submitting', 'warning');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('name', employee.name);
      formData.append('email', employee.email);
      formData.append('phone', employee.phone);
      formData.append('branch_id', employee.branch);
      formData.append('role', employee.role);
      formData.append('password', employee.password);
      formData.append('address', employee.address || '');
      formData.append('salary', employee.salary || 0);
      formData.append('has_system_access', employee.hasSystemAccess ? 1 : 0);
      
      if (employee.cnicFront) {
        formData.append('cnic_front', employee.cnicFront);
      }
      if (employee.cnicBack) {
        formData.append('cnic_back', employee.cnicBack);
      }
      if (employee.agreement) {
        formData.append('agreement_form', employee.agreement);
      }
      if (employee.voiceFile) {
        formData.append('voice_consent', employee.voiceFile);
      }

      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const apiErrors = {};
          Object.keys(data.errors).forEach(key => {
            apiErrors[key] = data.errors[key][0];
          });
          setErrors(apiErrors);
          showToaster('Please fix the errors and try again', 'error');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setErrors({ form: data.message || 'Failed to create employee' });
          showToaster(data.message || 'Failed to create employee', 'error');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setLoading(false);
        return;
      }

      if (data.success) {
        showToaster('✅ Employee created successfully!', 'success');
        setTimeout(() => {
          clearForm();
        }, 500);
      } else {
        setErrors({ form: data.message || 'Failed to create employee' });
        showToaster(data.message || 'Failed to create employee', 'error');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setErrors({ form: 'Network error. Please try again.' });
      showToaster('Network error. Please try again.', 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setLoading(false);
  };

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';
  
  // ✅ Admin ya Manager ke hisaab se Role options
  const getRoleOptions = () => {
    if (userRole === 'admin') {
      // Admin ko sab options dikhenge
      return [
        { value: 'employee', label: 'Employee' },
        { value: 'manager', label: 'Manager' },
        { value: 'admin', label: 'Admin' }
      ];
    } else if (userRole === 'manager') {
      // Manager ko sirf Employee aur Manager dikhega, Admin nahi
      return [
        { value: 'employee', label: 'Employee' },
        { value: 'manager', label: 'Manager' }
      ];
    }
    // Default (agar koi role na ho)
    return [
      { value: 'employee', label: 'Employee' },
      { value: 'manager', label: 'Manager' }
    ];
  };

  const roleOptions = getRoleOptions();

  return (
    <div className="employee-form-container">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="page-header">
        <div className="header-title-group">
          <div className="icon-wrapper">
            <UserPlus size={24} className="icon-primary" />
          </div>
          <h2>Add New Employee</h2>
          <span className="live-badge">
            <Calendar size={12} /> New
          </span>
        </div>
        {userBranch && (
          <div className="branch-badge-header" style={{ fontWeight: 700 }}>
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        )}
      </div>

      {errors.form && (
        <div className="error-message" style={{ fontWeight: 600, color: '#dc2626', padding: '0.75rem 1rem', background: '#fee2e2', borderRadius: '0.75rem', marginBottom: '1rem' }}>
          <AlertCircle size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Full Name *</label>
            <div className="input-with-icon">
              <User size={18} />
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter employee name"
                value={employee.name}
                onChange={handleChange}
                autoComplete="off"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.name && <span className="error-text" style={{ fontWeight: 600 }}>{errors.name}</span>}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Email Address *</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="employee@company.com"
                value={employee.email}
                onChange={handleChange}
                autoComplete="off"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.email && <span className="error-text" style={{ fontWeight: 600 }}>{errors.email}</span>}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Phone Number *</label>
            <div className="input-with-icon">
              <Phone size={18} />
              <input
                type="tel"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="03XX-XXXXXXX"
                value={employee.phone}
                onChange={handleChange}
                autoComplete="off"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.phone && <span className="error-text" style={{ fontWeight: 600 }}>{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Branch *</label>
            <div className="input-with-icon">
              <Building size={18} />
              <select
                name="branch"
                className="form-input"
                value={employee.branch}
                onChange={handleChange}
                disabled={!!userBranch}
                style={userBranch ? { opacity: 0.7, cursor: 'not-allowed', fontWeight: 500 } : { fontWeight: 500 }}
              >
                <option value={1}>Branch 1</option>
                <option value={2}>Branch 2</option>
              </select>
            </div>
            {userBranch && (
              <small className="field-hint" style={{ fontWeight: 500 }}>Branch locked to {branchLabel}</small>
            )}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Role *</label>
            <div className="input-with-icon">
              <Briefcase size={18} />
              <select
                name="role"
                className="form-input"
                value={employee.role}
                onChange={handleChange}
                style={{ fontWeight: 500 }}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {userRole === 'manager' && (
              <small className="field-hint" style={{ fontWeight: 500, color: '#2563eb' }}>
                
              </small>
            )}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>System Access</label>
            <div className="checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hasSystemAccess"
                  value="1"
                  checked={employee.hasSystemAccess === true}
                  onChange={() => setEmployee({ ...employee, hasSystemAccess: true })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 500 }}>Yes - Give System Access</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="hasSystemAccess"
                  value="0"
                  checked={employee.hasSystemAccess === false}
                  onChange={() => setEmployee({ ...employee, hasSystemAccess: false })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 500 }}>No - No System Access</span>
              </label>
            </div>
            <small className="field-hint" style={{ fontWeight: 500 }}>
              If "No", employee will still be counted in employees but won't appear in system access list
            </small>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Salary (PKR)</label>
            <div className="input-with-icon">
              <DollarSign size={18} style={{ color: '#C9A84C' }} />
              <input
                type="number"
                name="salary"
                className="form-input"
                placeholder="0"
                value={employee.salary}
                onChange={handleChange}
                onFocus={handleSalaryFocus}
                autoComplete="off"
                style={{ fontWeight: 500 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Password *</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter password"
                value={employee.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.password && <span className="error-text" style={{ fontWeight: 600 }}>{errors.password}</span>}
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700 }}>Confirm Password *</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm password"
                value={employee.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
                style={{ fontWeight: 500 }}
              />
            </div>
            {errors.confirmPassword && <span className="error-text" style={{ fontWeight: 600 }}>{errors.confirmPassword}</span>}
          </div>
        </div>

        {/* ===== CNIC IMAGES SECTION ===== */}
        <div className="cnic-image-section" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
          <div className="section-header">
            <CreditCard size={18} style={{ color: '#2563eb' }} />
            <h4 style={{ fontWeight: 700 }}>CNIC Images</h4>
            <span className="required-badge" style={{ fontWeight: 700 }}>Required</span>
          </div>
          <div className="cnic-image-grid">
            <div className="image-upload-box">
              <label style={{ fontWeight: 600 }}>CNIC Front</label>
              <div className="upload-area" onClick={() => cnicFrontRef.current?.click()}>
                {employee.cnicFrontPreview ? (
                  <div className="preview-container">
                    <img src={employee.cnicFrontPreview} alt="CNIC Front" />
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeCnicFile('front'); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 500 }}>Click to upload</span>
                    <span className="file-hint" style={{ fontWeight: 500 }}>JPG, PNG</span>
                  </>
                )}
              </div>
              <input type="file" ref={cnicFrontRef} accept="image/*" onChange={(e) => handleCnicUpload(e, 'front')} style={{ display: 'none' }} />
              {errors.cnicFront && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnicFront}</span>}
            </div>

            <div className="image-upload-box">
              <label style={{ fontWeight: 600 }}>CNIC Back</label>
              <div className="upload-area" onClick={() => cnicBackRef.current?.click()}>
                {employee.cnicBackPreview ? (
                  <div className="preview-container">
                    <img src={employee.cnicBackPreview} alt="CNIC Back" />
                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeCnicFile('back'); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={32} style={{ color: '#2563eb' }} />
                    <span style={{ fontWeight: 500 }}>Click to upload</span>
                    <span className="file-hint" style={{ fontWeight: 500 }}>JPG, PNG</span>
                  </>
                )}
              </div>
              <input type="file" ref={cnicBackRef} accept="image/*" onChange={(e) => handleCnicUpload(e, 'back')} style={{ display: 'none' }} />
              {errors.cnicBack && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnicBack}</span>}
            </div>
          </div>
        </div>

        {/* ===== VOICE CONSENT SECTION — OPTIONAL ===== */}
        <div className="voice-section" style={{ 
          border: employee.voiceFile ? '1px solid #86efac' : '1px solid #e5e7eb', 
          background: employee.voiceFile ? '#f0fdf4' : '#fafafa' 
        }}>
          <div className="section-header">
            <Mic size={18} style={{ color: employee.voiceFile ? '#065f46' : '#6b7280' }} />
            <h4 style={{ fontWeight: 700 }}>Voice Consent / Raza Mandi</h4>
            <span className="optional-badge" style={{ 
              fontWeight: 600, 
              color: employee.voiceFile ? '#065f46' : '#6b7280', 
              background: employee.voiceFile ? '#d1fae5' : '#f3f4f6', 
              padding: '2px 10px', 
              borderRadius: '12px', 
              fontSize: '12px' 
            }}>
              {employee.voiceFile ? '✅ Uploaded' : 'Optional'}
            </span>
          </div>
          <p className="voice-hint" style={{ 
            fontWeight: 500, 
            color: employee.voiceFile ? '#6b7280' : '#6b7280' 
          }}>
            {employee.voiceFile 
              ? 'Employee consent voice file uploaded' 
              : 'Upload employee consent voice file (Optional)'}
          </p>
          
          <div className="voice-upload">
            <div className="upload-area voice-upload-area" onClick={() => voiceFileRef.current?.click()} style={{ 
              borderColor: employee.voiceFile ? '#86efac' : '#d1d5db',
              background: employee.voiceFile ? '#f0fdf4' : 'white'
            }}>
              {employee.voiceFilePreview ? (
                <div className="voice-preview">
                  <FileAudio size={32} style={{ color: '#065f46' }} />
                  <span className="voice-file-name" style={{ fontWeight: 600 }}>{employee.voiceFileName}</span>
                  <div className="voice-actions">
                    <button 
                      className={`btn-play-voice ${playingIndex === 0 ? 'playing' : ''}`} 
                      onClick={(e) => { e.stopPropagation(); playVoice(); }}
                      style={{ fontWeight: 600 }}
                    >
                      {playingIndex === 0 ? '⏹' : '▶'} Play
                    </button>
                    <button 
                      className="remove-voice-btn" 
                      onClick={(e) => { e.stopPropagation(); removeVoiceFile(); }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <FileAudio size={32} style={{ color: '#6b7280' }} />
                  <span style={{ fontWeight: 600, color: '#4b5563' }}>Click to upload voice file (Optional)</span>
                  <span className="file-hint" style={{ fontWeight: 500 }}>MP3, WAV, M4A (Max 10MB)</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={voiceFileRef} 
              accept="audio/*" 
              onChange={handleVoiceFileUpload} 
              style={{ display: 'none' }} 
            />
          </div>

          {errors.voiceConsent && (
            <span className="error-text" style={{ fontWeight: 600, display: 'block', marginTop: '8px' }}>
              {errors.voiceConsent}
            </span>
          )}
        </div>

        {/* ===== AGREEMENT SECTION ===== */}
        <div className="agreement-section" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
          <div className="section-header">
            <FileText size={18} style={{ color: '#92400e' }} />
            <h4 style={{ fontWeight: 700 }}>Agreement Form</h4>
            <span className="optional-badge" style={{ fontWeight: 600 }}>Optional</span>
          </div>
          <p className="agreement-hint" style={{ fontWeight: 500 }}>Upload signed agreement form</p>
          
          <div className="agreement-upload">
            <div className="upload-area agreement-upload-area" onClick={() => agreementRef.current?.click()} style={{ borderColor: '#fde68a' }}>
              {employee.agreementPreview ? (
                <div className="agreement-preview">
                  <FileText size={32} className="agreement-icon" style={{ color: '#92400e' }} />
                  <span className="agreement-file-name" style={{ fontWeight: 600 }}>{employee.agreementName}</span>
                  <button 
                    className="remove-agreement-btn" 
                    onClick={(e) => { e.stopPropagation(); removeAgreement(); }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <FileText size={32} style={{ color: '#92400e' }} />
                  <span style={{ fontWeight: 500 }}>Click to upload agreement</span>
                  <span className="file-hint" style={{ fontWeight: 500 }}>PDF, JPG, PNG, DOC</span>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={agreementRef} 
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
              onChange={handleAgreementUpload} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label style={{ fontWeight: 700 }}>Address</label>
          <div className="input-with-icon">
            <MapPin size={18} />
            <textarea
              name="address"
              className="form-input form-textarea"
              placeholder="Enter employee address"
              value={employee.address}
              onChange={handleChange}
              autoComplete="off"
              style={{ fontWeight: 500 }}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" style={{ fontWeight: 700 }} disabled={loading}>
            <CheckCircle size={18} />
            {loading ? 'Creating...' : 'Create Employee Account'}
          </button>
          <button type="button" className="btn-reset" onClick={clearForm} style={{ fontWeight: 700 }}>
            <X size={18} />
            Clear
          </button>
        </div>

        <p className="form-footer" style={{ fontWeight: 500 }}>
          <AlertCircle size={14} />
          All fields with * are required. Branch assignment is permanent for login access.
        </p>
      </form>
    </div>
  );
};

export default AddEmployee;