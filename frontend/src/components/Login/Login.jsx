import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import logo from '../../assets/logo.jpeg';
import { API_URL } from '../../../config';

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    branch: '',
    role: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  // ===== FORGOT PASSWORD STATES =====
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotData, setForgotData] = useState({
    role: '',
    email: '',
    otp: '',
    generatedOtp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // ===== HANDLE BRANCH SELECTION =====
  const handleBranchSelect = (branch) => {
    setLoginData({ ...loginData, branch: branch });
    setError('');
    setStep(2);
  };

  // ===== GO BACK TO BRANCH SELECTION =====
  const handleBackToBranch = () => {
    setStep(1);
    setLoginData({ ...loginData, role: '', email: '', password: '' });
    setError('');
  };

  // ===== HANDLE LOGIN WITH DATABASE =====
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      if (data.success && data.data) {
        const user = data.data.user;
        const token = data.data.token;

        const selectedRole = loginData.role;
        
        if (user.role !== selectedRole) {
          setError('Invalid credentials');
          setLoading(false);
          return;
        }

        // ✅ Manager/Employee: unka branch_id database mein fix hai,
        // login ke waqt select ki gayi branch se match hona chahiye.
        if (user.role === 'manager' || user.role === 'employee') {
          if (user.branch_id !== parseInt(loginData.branch)) {
            setError('Invalid credentials');
            setLoading(false);
            return;
          }
        }
        // Admin role check yahan intentionally koi branch-match nahi karta —
        // Admin ka database branch_id null hota hai, isliye Admin login screen
        // par jo branch SELECT karta hai wahi uski is-session ki active branch
        // banegi (neeche userData.branch mein). Yeh ensure karta hai ke Admin
        // bhi Branch 1 se login karke sirf Branch 1 ka data dekhe, Branch 2 se
        // login karke sirf Branch 2 ka — dono kabhi mix nahi honge.

        const selectedBranchId = parseInt(loginData.branch);

        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          // ✅ Har role ke liye login-time selected branch hi session branch hai.
          // Manager/Employee ke liye yeh already user.branch_id ke barabar hai
          // (upar check ho chuka), Admin ke liye yeh login selection se aati hai.
          branch: selectedBranchId,
          branchName: user.branch?.name || `Branch ${selectedBranchId}`,
          employeeId: user.id,
        };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        setIsLoggedIn(true);

        if (user.role === 'employee') {
          navigate('/employee-performance');
        } else {
          navigate('/');
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Invalid credentials');
    }

    setLoading(false);
  };

  // ============================================
  // ✅ GENERATE OTP (FALLBACK)
  // ============================================
  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // ============================================
  // ✅ FORGOT PASSWORD - SEND OTP (BACKEND API)
  // ============================================
  const handleSendOtp = async () => {
    setForgotError('');
    setForgotSuccess('');
    
    if (!forgotData.role) {
      setForgotError('Please select your role');
      return;
    }
    if (!forgotData.email) {
      setForgotError('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotData.email,
          role: forgotData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ✅ FALLBACK: Generate OTP locally if API fails
        const fallbackOtp = generateOtp();
        setForgotData({ 
          ...forgotData, 
          generatedOtp: fallbackOtp 
        });
        alert(
          `⚠️ Email sending failed. Please use this OTP:\n\n` +
          `📧 OTP: ${fallbackOtp}`
        );
        setForgotSuccess('OTP generated locally. Please use the OTP shown in alert.');
        setForgotStep(2);
        setLoading(false);
        return;
      }

      if (data.success) {
        setForgotData({ 
          ...forgotData, 
          generatedOtp: data.otp 
        });
        
        setForgotSuccess('✅ OTP sent successfully! Please check your email.');
        setForgotStep(2);
        
        alert(`✅ OTP sent to your email!\n\n📧 OTP: ${data.otp}\n\nPlease check your inbox.`);
      } else {
        // ✅ FALLBACK
        const fallbackOtp = generateOtp();
        setForgotData({ 
          ...forgotData, 
          generatedOtp: fallbackOtp 
        });
        alert(
          `⚠️ Failed to send email. Please use this OTP:\n\n` +
          `📧 OTP: ${fallbackOtp}`
        );
        setForgotSuccess('OTP generated locally. Please use the OTP shown in alert.');
        setForgotStep(2);
      }
    } catch (error) {
      console.error('Error:', error);
      // ✅ FALLBACK: Generate OTP locally
      const fallbackOtp = generateOtp();
      setForgotData({ 
        ...forgotData, 
        generatedOtp: fallbackOtp 
      });
      alert(
        `⚠️ Network error. Please use this OTP:\n\n` +
        `📧 OTP: ${fallbackOtp}`
      );
      setForgotSuccess('OTP generated locally. Please use the OTP shown in alert.');
      setForgotStep(2);
    }
    
    setLoading(false);
  };

  // ============================================
  // ✅ FORGOT PASSWORD - VERIFY OTP
  // ============================================
  const handleVerifyOtp = async () => {
    setForgotError('');
    
    if (!forgotData.otp) {
      setForgotError('Please enter the OTP');
      return;
    }

    if (forgotData.otp.length !== 6) {
      setForgotError('OTP must be exactly 6 digits');
      return;
    }

    setLoading(true);

    try {
      // ✅ First try backend verification
      const response = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotData.email,
          otp: forgotData.otp,
        }),
      });

      const data = await response.json();

      // ✅ If backend verification fails, check locally
      if (!response.ok || !data.success) {
        // Check against local generated OTP
        if (forgotData.otp === forgotData.generatedOtp) {
          setForgotSuccess('✅ OTP verified successfully (local verification)!');
          setForgotStep(3);
          setLoading(false);
          return;
        }
        setForgotError(data.message || 'Invalid OTP');
        setLoading(false);
        return;
      }

      if (data.success) {
        setForgotSuccess('✅ OTP verified successfully!');
        setForgotStep(3);
      } else {
        // ✅ Check locally as fallback
        if (forgotData.otp === forgotData.generatedOtp) {
          setForgotSuccess('✅ OTP verified successfully (local verification)!');
          setForgotStep(3);
        } else {
          setForgotError(data.message || 'Invalid OTP');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      // ✅ Local verification as fallback
      if (forgotData.otp === forgotData.generatedOtp) {
        setForgotSuccess('✅ OTP verified successfully (local verification)!');
        setForgotStep(3);
      } else {
        setForgotError('Invalid OTP. Please try again.');
      }
    }
    
    setLoading(false);
  };

  // ============================================
  // ✅ FORGOT PASSWORD - RESET PASSWORD
  // ============================================
  const handleResetPassword = async () => {
    setForgotError('');
    
    if (!forgotData.newPassword || forgotData.newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }
    
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/users/update-password-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotData.email,
          password: forgotData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Password changed successfully! Please login with your new password.');
        
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotData({
          role: '',
          email: '',
          otp: '',
          generatedOtp: '',
          newPassword: '',
          confirmPassword: '',
        });
        setForgotSuccess('');
        setLoginData({ ...loginData, password: '' });
      } else {
        setForgotError(data.message || 'Failed to update password. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setForgotError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  // ============================================
  // ✅ RESET FORGOT PASSWORD STATE
  // ============================================
  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotData({
      role: '',
      email: '',
      otp: '',
      generatedOtp: '',
      newPassword: '',
      confirmPassword: '',
    });
    setForgotError('');
    setForgotSuccess('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* ===== LOGO SECTION ===== */}
        <div className="login-logo">
          <img src={logo} alt="SARA Electronics" className="login-logo-img" />
          <h1 className="brand-title">SARA <span>Electronics</span></h1>
          <p className="logo-subtitle">Admin Panel Login</p>
        </div>

        {/* ===== STEP 1: BRANCH SELECTION ===== */}
        {step === 1 && (
          <div className="step-branch">
            <h3 className="step-title">Select Branch</h3>
            <p className="step-hint">Please select a branch to continue</p>
            <div className="branch-grid">
              <div 
                className={`branch-card ${loginData.branch === '1' ? 'selected' : ''}`}
                onClick={() => handleBranchSelect('1')}
              >
                <div className="branch-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <h4>Branch 1</h4>
                <p>Main Branch</p>
              </div>
              <div 
                className={`branch-card ${loginData.branch === '2' ? 'selected' : ''}`}
                onClick={() => handleBranchSelect('2')}
              >
                <div className="branch-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <h4>Branch 2</h4>
                <p>Secondary Branch</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: LOGIN FORM ===== */}
        {step === 2 && (
          <form onSubmit={handleLogin}>
            <div className="selected-branch-info">
              <span className="branch-badge">
                Branch {loginData.branch}
              </span>
              <button type="button" className="change-branch-btn" onClick={handleBackToBranch}>
                Change
              </button>
            </div>

            <div className="form-group">
              <label>Select Role *</label>
              <select
                className="login-input"
                value={loginData.role}
                onChange={(e) => {
                  setLoginData({ ...loginData, role: e.target.value });
                  setError('');
                }}
                required
              >
                <option value="">Select Role...</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="login-input"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={(e) => {
                  setLoginData({ ...loginData, email: e.target.value });
                  setError('');
                }}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="login-input"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => {
                  setLoginData({ ...loginData, password: e.target.value });
                  setError('');
                }}
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Login'}
            </button>

            {/* ===== FORGOT PASSWORD LINK ===== */}
            <div className="forgot-password-link">
              <button 
                type="button" 
                className="forgot-password-btn"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </div>

            {/* ===== DEMO CREDENTIALS ===== */}
           
          </form>
        )}

        <p className="login-footer">© 2026 FUSIX TECH. All rights reserved.</p>
      </div>

      {/* ===== FORGOT PASSWORD MODAL ===== */}
      {showForgotPassword && (
        <div className="forgot-password-overlay" onClick={resetForgotPassword}>
          <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forgot-password-header">
              <h3>Reset Password</h3>
              <button className="forgot-password-close" onClick={resetForgotPassword}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="forgot-password-body">
              {forgotError && <div className="forgot-error">{forgotError}</div>}
              {forgotSuccess && <div className="forgot-success">{forgotSuccess}</div>}

              {/* STEP 1: Role + Email */}
              {forgotStep === 1 && (
                <>
                  <p className="forgot-hint">Enter your role and email to receive OTP</p>
                  
                  <div className="form-group">
                    <label>Select Role *</label>
                    <select
                      className="login-input"
                      value={forgotData.role}
                      onChange={(e) => setForgotData({ ...forgotData, role: e.target.value })}
                    >
                      <option value="">Select Role...</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="login-input"
                      placeholder="Enter your email"
                      value={forgotData.email}
                      onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                    />
                  </div>

                  <button 
                    className="login-btn" 
                    onClick={handleSendOtp} 
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              )}

              {/* STEP 2: OTP Verification */}
              {forgotStep === 2 && (
                <>
                  <p className="forgot-hint">Enter the OTP sent to your email</p>
                  
                  <div className="form-group">
                    <label>Enter OTP *</label>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="Enter 6-digit OTP"
                      value={forgotData.otp}
                      onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value })}
                      maxLength="6"
                    />
                    <small className="field-hint">OTP sent to {forgotData.email}</small>
                  </div>

                  <div className="forgot-actions">
                    <button 
                      className="login-btn" 
                      onClick={handleVerifyOtp}
                    >
                      Verify OTP
                    </button>
                    <button 
                      className="forgot-resend-btn" 
                      onClick={handleSendOtp}
                    >
                      Resend OTP
                    </button>
                  </div>
                </>
              )}

              {/* STEP 3: New Password */}
              {forgotStep === 3 && (
                <>
                  <p className="forgot-hint">Set your new password</p>
                  
                  <div className="form-group">
                    <label>New Password *</label>
                    <input
                      type="password"
                      className="login-input"
                      placeholder="Enter new password (min 6 chars)"
                      value={forgotData.newPassword}
                      onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      className="login-input"
                      placeholder="Confirm new password"
                      value={forgotData.confirmPassword}
                      onChange={(e) => setForgotData({ ...forgotData, confirmPassword: e.target.value })}
                    />
                  </div>

                  <button 
                    className="login-btn" 
                    onClick={handleResetPassword} 
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;