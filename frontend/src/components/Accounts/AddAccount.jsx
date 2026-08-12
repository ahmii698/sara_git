// src/components/AddAccount/AddAccount.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, User, Phone, CreditCard, MapPin, Briefcase, Users, Package, DollarSign, Calendar, Upload, X, UserPlus, Mic, Play, Trash2, FileAudio, Building, CheckCircle, AlertCircle, Clock, Bell, Shield, PauseCircle, PlayCircle, UserCheck, FileImage, Wallet, Percent, Banknote, History, Plus
} from 'lucide-react';
import './AddAccount.css';
import { API_URL } from '../../../config';

// ============================================
// ✅ TOASTER COMPONENT - Right Side Bottom
// ============================================
const Toaster = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const colors = {
    success: { bg: '#d1fae5', border: '#22c55e', text: '#065f46', icon: CheckCircle },
    error: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', icon: AlertCircle },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: AlertCircle },
    info: { bg: '#dbeafe', border: '#2563eb', text: '#1e40af', icon: Bell },
  };

  const style = colors[type] || colors.info;
  const Icon = style.icon;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 99999,
      maxWidth: '450px',
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
          lineHeight: 1.5,
          whiteSpace: 'pre-line'
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

const MAX_ACCOUNTS_PER_CNIC = 2;
const MAX_PRODUCT_PRICE = 100000;
const OLD_RECORD_CASE_NO_LIMIT = 10000;

// ============================================
// ✅ NEW: Max limits for repeatable fields
// ============================================
const MAX_PHONE_NUMBERS = 4;
const MAX_VOICE_FILES = 10;

const AddAccount = () => {
  const [step, setStep] = useState(1);
  const [searchCNIC, setSearchCNIC] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [voiceFiles, setVoiceFiles] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(null);

  const isSubmittingRef = useRef(false);

  const [existingAccountData, setExistingAccountData] = useState(null);
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);
  const [cnicCheckLoading, setCnicCheckLoading] = useState(false);

  const [isOldRecord, setIsOldRecord] = useState(false);
  const [manualCaseNo, setManualCaseNo] = useState('');
  const [accountDate, setAccountDate] = useState('');

  const [showFirstInstallmentModal, setShowFirstInstallmentModal] = useState(false);
  const [firstInstallmentPayAmount, setFirstInstallmentPayAmount] = useState('');
  const [firstInstallmentSlipNo, setFirstInstallmentSlipNo] = useState('');

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

  const [formData, setFormData] = useState({
    name: '',
    cnic: '',
    phones: [''],
    address: '',
    work: '',
    employeeId: '',
    cnicFront: null,
    cnicBack: null,
    cnicFrontPreview: '',
    cnicBackPreview: '',
    additionalImage1: null,
    additionalImage2: null,
    additionalImage1Preview: '',
    additionalImage2Preview: '',
    billImage1: null,
    billImage2: null,
    billImage1Preview: '',
    billImage2Preview: '',
    guarantors: [
      { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
      { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
      { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
    ],
    productType: 'new',
    productName: '',
    productPrice: '',
    profitPercent: '',
    advanceAmount: '',
    invoicePrice: '',
    noOfInstallments: '',
    dueDate: '',
    installmentAmount: '',
    paymentType: 'cash',
    chalanFront: null,
    chalanBack: null,
    chalanFrontPreview: '',
    chalanBackPreview: '',
    accountType: 'regular',
    branch: 1,
    status: 'active',
    created_by: null,
  });

  const [errors, setErrors] = useState({});

  const cnicFrontRef = useRef(null);
  const cnicBackRef = useRef(null);
  const chalanFrontRef = useRef(null);
  const chalanBackRef = useRef(null);
  const voiceFileRef = useRef(null);
  const additionalImage1Ref = useRef(null);
  const additionalImage2Ref = useRef(null);
  const billImage1Ref = useRef(null);
  const billImage2Ref = useRef(null);
  const guarantorRefs = useRef([]);
  
  const containerRef = useRef(null);

  // ============================================
  // ✅ SCROLL TO TOP FUNCTION
  // ============================================
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    } else {
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    }
  }, []);

  // ============================================
  // ✅ AUTO SCROLL WHEN STEP CHANGES
  // ============================================
  useEffect(() => {
    scrollToTop();
  }, [step, scrollToTop]);

  // ============================================
  // ✅ FETCH EMPLOYEES FROM API
  // ============================================
  const fetchEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users?role=employee`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        let employeesList = [];
        if (Array.isArray(data.data)) {
          employeesList = data.data;
        } else if (data.data && Array.isArray(data.data.data)) {
          employeesList = data.data.data;
        }

        const filteredEmployees = employeesList.filter(user => user.role === 'employee');
        setEmployees(filteredEmployees);
      } else {
        showToaster('Failed to load employees', 'error');
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      showToaster('Network error loading employees', 'error');
      setEmployees([]);
    }
    setEmployeesLoading(false);
  }, []);

  // ✅ AUTO-DETECT LOGGED-IN USER
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      console.log('🔍 Logged-in User:', user);
      
      setUserRole(user.role);
      setUserBranch(user.branch);
      setUserId(user.id);
      setUserName(user.name);
      setUserEmail(user.email);
      
      if (user.branch) {
        setFormData(prev => ({ 
          ...prev, 
          branch: parseInt(user.branch)
        }));
      }
      
      if (user.role === 'employee') {
        setFormData(prev => ({ 
          ...prev, 
          employeeId: parseInt(user.id) 
        }));
      }
    }
    
    fetchEmployees();
  }, [fetchEmployees]);

  const getEmployeesByBranch = (branch) => {
    return employees.filter(emp => {
      const empBranch = parseInt(emp.branch_id || emp.branch);
      return empBranch === branch;
    });
  };

  const getAvailableEmployees = () => {
    if (userBranch) {
      return getEmployeesByBranch(parseInt(userBranch));
    }
    return getEmployeesByBranch(formData.branch);
  };

  const handleVoiceFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (voiceFiles.length >= MAX_VOICE_FILES) {
      showToaster(`Maximum ${MAX_VOICE_FILES} voice files allowed`, 'warning');
      if (voiceFileRef.current) voiceFileRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('audio/')) {
      showToaster('Please select an audio file (mp3, wav, etc.)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newVoice = {
        id: Date.now(),
        name: file.name,
        size: (file.size / 1024).toFixed(2),
        url: reader.result,
        file: file,
        timestamp: new Date().toLocaleString(),
      };
      setVoiceFiles(prev => [...prev, newVoice]);
      showToaster('Voice file uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
    if (voiceFileRef.current) voiceFileRef.current.value = '';
  };

  const playVoice = (index) => {
    const voice = voiceFiles[index];
    if (!voice) return;

    // Agar already playing hai toh stop karo
    if (playingIndex === index) {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      setPlayingIndex(null);
      return;
    }

    const audio = new Audio(voice.url);
    audio.play();
    setPlayingIndex(index);
    audio.onended = () => {
      setPlayingIndex(null);
    };
    audio.onerror = () => {
      setPlayingIndex(null);
    };
  };

  const deleteVoice = (index) => {
    if (window.confirm('Delete this voice file?')) {
      if (playingIndex === index) {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
          if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
        });
        setPlayingIndex(null);
      }
      const newVoices = voiceFiles.filter((_, i) => i !== index);
      setVoiceFiles(newVoices);
      showToaster('Voice file deleted', 'info');
    }
  };

  const handleCNICSearch = async () => {
    if (searchCNIC.length < 5) {
      showToaster('Please enter at least 5 characters of CNIC', 'warning');
      return;
    }

    setCnicCheckLoading(true);
    const token = localStorage.getItem('token');

    try {
      const custRes = await fetch(`${API_URL}/customers/check-cnic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cnic: searchCNIC })
      });
      const custJson = await custRes.json();
      const custData = custJson.data;

      if (custData && custData.exists_as_customer) {
        setExistingAccountData(custData);
        setShowExistingAccountModal(true);
      } else {
        setExistingAccountData(null);
        showToaster(`No account found for CNIC: ${searchCNIC}`, 'info');
      }
    } catch (err) {
      console.error('CNIC search error:', err);
      showToaster('Search failed — network error.', 'error');
    }

    setCnicCheckLoading(false);
  };

  const handleCnicBlur = async () => {
    if (!formData.cnic || formData.cnic.length < 5) return;

    setCnicCheckLoading(true);
    const token = localStorage.getItem('token');

    try {
      const custRes = await fetch(`${API_URL}/customers/check-cnic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cnic: formData.cnic })
      });
      const custJson = await custRes.json();
      const custData = custJson.data;

      if (custData && custData.exists_as_customer) {
        setExistingAccountData(custData);
        setShowExistingAccountModal(true);

        if (!custData.can_open_more) {
          showToaster(
            `${custData.customer.name} already has ${custData.accounts_count} account(s) — limit exceeded. Account can still be created but will trigger an alert.`,
            'warning'
          );
        } else {
          showToaster(
            `${custData.customer.name} already has an account! Remaining limit: PKR ${Number(custData.remaining_limit).toLocaleString()}`,
            'warning'
          );
        }
      } else {
        setExistingAccountData(null);
      }

      if (custData && custData.exists_as_guarantor && custData.guarantor_records?.length > 0) {
        const details = custData.guarantor_records.map(g =>
          `• Guarantor for: ${g.customer_name} (${g.customer_cnic})`
        ).join('\n');
        showToaster(
          `This person (${formData.cnic}) is already a guarantor for ${custData.guarantor_records.length} customer(s)!`,
          'info'
        );
      }
    } catch (err) {
      console.error('CNIC check error:', err);
    }
    setCnicCheckLoading(false);
  };

  const handleGuarantorCnicBlur = async (index) => {
    const cnic = formData.guarantors[index].cnic;
    if (!cnic || cnic.length < 5) return;

    const token = localStorage.getItem('token');

    try {
      const custRes = await fetch(`${API_URL}/customers/check-cnic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cnic })
      });
      const custJson = await custRes.json();
      const custData = custJson.data;

      if (custData && custData.exists_as_customer) {
        showToaster(
          `Guarantor CNIC (${cnic}) belongs to existing customer: ${custData.customer.name}`,
          'info'
        );
        return;
      }

      const gRes = await fetch(`${API_URL}/guarantors/check-cnic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cnic })
      });
      const gJson = await gRes.json();
      const gData = gJson.data;

      if (gData && gData.exists_as_guarantor && gData.guarantor_records?.length > 0) {
        const details = gData.guarantor_records.map(r => {
          const caseInfo = r.case_no_display ? ` — Case #${r.case_no_display}` : '';
          return `• ${r.customer_name} (${r.customer_cnic})${caseInfo}`;
        }).join('\n');

        showToaster(
          `⚠️ This CNIC (${cnic}) is already a guarantor for ${gData.guarantor_records.length} customer(s):\n${details}`,
          'warning'
        );
      }
    } catch (err) {
      console.error('Guarantor CNIC check error:', err);
    }
  };

  const loadExistingAccount = (account) => {
    setFormData({
      ...formData,
      name: account.name,
      cnic: account.cnic,
      phones: account.phone ? [account.phone] : [''],
      address: account.address,
      work: account.work
    });
    setShowExisting(false);
    setSearchCNIC('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'branch' && userBranch) return;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhoneChange = (index, value) => {
    const updatedPhones = [...formData.phones];
    updatedPhones[index] = value;
    setFormData({ ...formData, phones: updatedPhones });
  };

  const addPhoneField = () => {
    if (formData.phones.length >= MAX_PHONE_NUMBERS) {
      showToaster(`Maximum ${MAX_PHONE_NUMBERS} phone numbers allowed`, 'warning');
      return;
    }
    setFormData({ ...formData, phones: [...formData.phones, ''] });
  };

  const removePhoneField = (index) => {
    const updatedPhones = formData.phones.filter((_, i) => i !== index);
    setFormData({ ...formData, phones: updatedPhones.length > 0 ? updatedPhones : [''] });
  };

  const handleProductPriceBlur = () => {
    const price = parseFloat(formData.productPrice) || 0;
    if (!isOldRecord && price > MAX_PRODUCT_PRICE) {
      showToaster(
        `⚠️ Product Price PKR ${price.toLocaleString()} exceeds the normal limit of PKR ${MAX_PRODUCT_PRICE.toLocaleString()}. Account can still be created but will trigger an alert.`,
        'warning'
      );
    }
  };

  const calculateInvoicePrice = () => {
    const price = parseFloat(formData.productPrice) || 0;
    const percent = parseFloat(formData.profitPercent) || 0;

    const invoice = price + (price * percent / 100);
    const roundedInvoice = Math.round(invoice);

    setFormData(prev => ({
      ...prev,
      invoicePrice: roundedInvoice > 0 ? String(roundedInvoice) : ''
    }));
  };

  useEffect(() => {
    calculateInvoicePrice();
  }, [formData.productPrice, formData.profitPercent]);

  const calculateInstallment = () => {
    const invoice = parseFloat(formData.invoicePrice) || 0;
    const advance = parseFloat(formData.advanceAmount) || 0;
    const installments = parseInt(formData.noOfInstallments) || 0;
    
    const remaining = invoice - advance;
    
    let perInstallment = 0;
    if (installments > 0 && remaining > 0) {
      perInstallment = remaining / installments;
    }
    
    const roundedInstallment = Math.round(perInstallment);
    
    setFormData(prev => ({
      ...prev,
      installmentAmount: roundedInstallment > 0 ? String(roundedInstallment) : ''
    }));
  };

  useEffect(() => {
    calculateInstallment();
  }, [formData.invoicePrice, formData.advanceAmount, formData.noOfInstallments]);

  const handleGuarantorChange = (index, field, value) => {
    const updated = [...formData.guarantors];
    updated[index][field] = value;
    setFormData({ ...formData, guarantors: updated });
  };

  const handleGuarantorFileUpload = (e, index, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...formData.guarantors];
      if (type === 'cnicFront') {
        updated[index].cnicFront = file;
        updated[index].cnicFrontPreview = reader.result;
      } else if (type === 'cnicBack') {
        updated[index].cnicBack = file;
        updated[index].cnicBackPreview = reader.result;
      }
      setFormData({ ...formData, guarantors: updated });
    };
    reader.readAsDataURL(file);
  };

  const removeGuarantorFile = (index, type) => {
    const updated = [...formData.guarantors];
    if (type === 'cnicFront') {
      updated[index].cnicFront = null;
      updated[index].cnicFrontPreview = '';
    } else if (type === 'cnicBack') {
      updated[index].cnicBack = null;
      updated[index].cnicBackPreview = '';
    }
    setFormData({ ...formData, guarantors: updated });
  };

  const handleBillImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'bill1') {
      setFormData({ ...formData, billImage1: file, billImage1Preview: previewUrl });
    } else if (type === 'bill2') {
      setFormData({ ...formData, billImage2: file, billImage2Preview: previewUrl });
    }
  };

  const removeBillImage = (type) => {
    if (type === 'bill1') {
      setFormData({ ...formData, billImage1: null, billImage1Preview: '' });
      if (billImage1Ref.current) billImage1Ref.current.value = '';
    } else if (type === 'bill2') {
      setFormData({ ...formData, billImage2: null, billImage2Preview: '' });
      if (billImage2Ref.current) billImage2Ref.current.value = '';
    }
  };

  const handleAdditionalImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'additionalImage1') {
      setFormData({ ...formData, additionalImage1: file, additionalImage1Preview: previewUrl });
    } else if (type === 'additionalImage2') {
      setFormData({ ...formData, additionalImage2: file, additionalImage2Preview: previewUrl });
    }
  };

  const removeAdditionalImage = (type) => {
    if (type === 'additionalImage1') {
      setFormData({ ...formData, additionalImage1: null, additionalImage1Preview: '' });
      if (additionalImage1Ref.current) additionalImage1Ref.current.value = '';
    } else if (type === 'additionalImage2') {
      setFormData({ ...formData, additionalImage2: null, additionalImage2Preview: '' });
      if (additionalImage2Ref.current) additionalImage2Ref.current.value = '';
    }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    
    if (type === 'cnicFront') {
      setFormData({ ...formData, cnicFront: file, cnicFrontPreview: previewUrl });
    } else if (type === 'cnicBack') {
      setFormData({ ...formData, cnicBack: file, cnicBackPreview: previewUrl });
    } else if (type === 'chalanFront') {
      setFormData({ ...formData, chalanFront: file, chalanFrontPreview: previewUrl });
    } else if (type === 'chalanBack') {
      setFormData({ ...formData, chalanBack: file, chalanBackPreview: previewUrl });
    }
  };

  const removeFile = (type) => {
    if (type === 'cnicFront') { 
      setFormData({ ...formData, cnicFront: null, cnicFrontPreview: '' }); 
      if (cnicFrontRef.current) cnicFrontRef.current.value = ''; 
    } else if (type === 'cnicBack') { 
      setFormData({ ...formData, cnicBack: null, cnicBackPreview: '' }); 
      if (cnicBackRef.current) cnicBackRef.current.value = ''; 
    } else if (type === 'chalanFront') { 
      setFormData({ ...formData, chalanFront: null, chalanFrontPreview: '' }); 
      if (chalanFrontRef.current) chalanFrontRef.current.value = ''; 
    } else if (type === 'chalanBack') { 
      setFormData({ ...formData, chalanBack: null, chalanBackPreview: '' }); 
      if (chalanBackRef.current) chalanBackRef.current.value = ''; 
    }
  };

  const checkDuplicateGuarantorCnic = () => {
    const cnics = formData.guarantors
      .filter(g => g.cnic && g.cnic.trim())
      .map(g => g.cnic.trim());
    
    const uniqueCnics = new Set(cnics);
    return cnics.length !== uniqueCnics.size;
  };

  const findPartiallyFilledGuarantorIndex = () => {
    for (let i = 0; i < formData.guarantors.length; i++) {
      const g = formData.guarantors[i];

      const isTouched =
        (g.name && g.name.trim()) ||
        (g.cnic && g.cnic.trim()) ||
        (g.phone && g.phone.trim()) ||
        (g.address && g.address.trim()) ||
        g.cnicFront ||
        g.cnicBack;

      if (!isTouched) continue;

      const isComplete =
        g.name && g.name.trim() &&
        g.cnic && g.cnic.trim() &&
        g.phone && g.phone.trim() &&
        g.address && g.address.trim() &&
        g.cnicFront &&
        g.cnicBack;

      if (!isComplete) return i;
    }
    return -1;
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.cnic) newErrors.cnic = 'CNIC is required';
    if (!formData.phones[0] || !formData.phones[0].trim()) {
      newErrors.phones = 'At least one phone number is required';
    }
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.work) newErrors.work = 'Work is required';
    if (!formData.employeeId) newErrors.employeeId = 'Please select an employee';
    if (!formData.cnicFront) newErrors.cnicFront = 'CNIC Front image is required';
    if (!formData.cnicBack) newErrors.cnicBack = 'CNIC Back image is required';
    
    if (!formData.additionalImage1) {
      newErrors.additionalImage1 = 'Additional Image 1 is required';
    }
    if (!formData.additionalImage2) {
      newErrors.additionalImage2 = 'Additional Image 2 is required';
    }

    if (isOldRecord) {
      const hasAtLeastOneGuarantorCnic = formData.guarantors.some(g => g.cnic && g.cnic.trim());
      if (!hasAtLeastOneGuarantorCnic) {
        newErrors.guarantors = 'Old Record: At least 1 guarantor CNIC is required.';
      }

      if (!manualCaseNo || !manualCaseNo.trim()) {
        newErrors.caseNo = 'Old Record: Case number is required.';
      } else {
        const trimmedCaseNo = manualCaseNo.trim();
        if (!/^\d+$/.test(trimmedCaseNo)) {
          newErrors.caseNo = 'Case number must contain only digits.';
        } else {
          const numericCaseNo = parseInt(trimmedCaseNo, 10);
          if (numericCaseNo <= 0) {
            newErrors.caseNo = 'Case number must be valid (greater than 0).';
          } else if (numericCaseNo >= OLD_RECORD_CASE_NO_LIMIT) {
            newErrors.caseNo = `Old Record: Case number must be less than ${OLD_RECORD_CASE_NO_LIMIT} (only for old records). New records are auto-generated above ${OLD_RECORD_CASE_NO_LIMIT}.`;
          }
        }
      }
    } else {
      if (checkDuplicateGuarantorCnic()) {
        newErrors.guarantors = 'Duplicate CNIC found in guarantors. Each guarantor must have a unique CNIC.';
      }

      if (!newErrors.guarantors) {
        const partialIndex = findPartiallyFilledGuarantorIndex();
        if (partialIndex !== -1) {
          newErrors.guarantors = `Guarantor ${partialIndex + 1} is incomplete. Either fill all its fields (Name, CNIC, Phone, Address, CNIC Front & Back) or leave it completely empty.`;
        }
      }

      const completeGuarantors = formData.guarantors.filter(g => g.name.trim() && g.cnic.trim() && g.phone.trim() && g.address.trim() && g.cnicFront !== null && g.cnicBack !== null);
      if (completeGuarantors.length < 1 && !newErrors.guarantors) {
        newErrors.guarantors = 'Minimum 1 complete guarantor required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.productName) newErrors.productName = 'Product name is required';
    if (!formData.productPrice) newErrors.productPrice = 'Product price is required';
    if (!formData.profitPercent && formData.profitPercent !== 0) newErrors.profitPercent = 'Profit percentage is required';
    if (!formData.invoicePrice) newErrors.invoicePrice = 'Invoice price could not be calculated';
    if (!formData.noOfInstallments) newErrors.noOfInstallments = 'Number of installments is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    
    // ✅ Account Date validation moved to Step 2
    if (!accountDate) {
      newErrors.accountDate = 'Account opening date is required.';
    }
    
    if (!formData.chalanFront) {
      newErrors.chalanFront = 'Chalan Front image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      scrollToTop();
    }
  };
  
  const handlePrev = () => {
    setStep(1);
    scrollToTop();
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (validateStep2()) {
      setFirstInstallmentPayAmount(formData.installmentAmount || '0');
      setFirstInstallmentSlipNo('');
      setShowFirstInstallmentModal(true);
    }
  };

  const handleConfirmWithPayment = () => {
    const amount = parseFloat(firstInstallmentPayAmount) || 0;
    const maxAmount = parseFloat(formData.installmentAmount) || 0;

    if (amount > 0 && !firstInstallmentSlipNo.trim()) {
      showToaster('Please enter a Slip No for this payment', 'warning');
      return;
    }

    if (amount < 0) {
      showToaster('Amount cannot be negative.', 'warning');
      return;
    }
    if (maxAmount > 0 && amount > maxAmount) {
      showToaster(`Amount cannot exceed the installment amount (PKR ${maxAmount.toLocaleString()}).`, 'warning');
      return;
    }

    setShowFirstInstallmentModal(false);
    confirmAccountCreation(amount);
  };

  const handleSkipPayment = () => {
    setShowFirstInstallmentModal(false);
    confirmAccountCreation(0);
  };

  const confirmAccountCreation = async (firstInstallmentPayment = 0) => {
    if (isSubmittingRef.current) {
      console.warn('⚠️ Submission already in progress, ignoring duplicate call');
      return;
    }
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const loggedInUserId = user?.id || 1;
      const loggedInUserRole = user?.role || 'admin';
      const loggedInUserName = user?.name || 'Admin';
      
      let employeeId = formData.employeeId;
      if (!employeeId) {
        employeeId = loggedInUserId;
      }
      
      console.log('👤 Admin/Manager (Creating):', loggedInUserId, loggedInUserName);
      console.log('👤 Employee (Opening):', employeeId);
      
      const validPhones = formData.phones.map(p => p.trim()).filter(p => p);

      const customerFormData = new FormData();
      customerFormData.append('name', formData.name);
      customerFormData.append('cnic', formData.cnic);
      customerFormData.append('phone', validPhones[0] || '');
      if (validPhones[1]) customerFormData.append('phone_2', validPhones[1]);
      if (validPhones[2]) customerFormData.append('phone_3', validPhones[2]);
      if (validPhones[3]) customerFormData.append('phone_4', validPhones[3]);
      customerFormData.append('address', formData.address);
      customerFormData.append('work', formData.work);
      customerFormData.append('branch_id', formData.branch);
      customerFormData.append('status', 'active');

      customerFormData.append('created_by', parseInt(loggedInUserId));
      customerFormData.append('employee_id', parseInt(employeeId));

      customerFormData.append('product_name', formData.productName);
      customerFormData.append('invoice_price', Math.round(parseFloat(formData.invoicePrice) || 0));
      
      customerFormData.append('number_of_installments', parseInt(formData.noOfInstallments) || 0);
      customerFormData.append('due_date', formData.dueDate);
      customerFormData.append('advance_payment', Math.round(parseFloat(formData.advanceAmount) || 0));
      customerFormData.append('payment_type', formData.paymentType || 'cash');

      customerFormData.append('first_installment_payment', Math.round(firstInstallmentPayment || 0));
      
      if (firstInstallmentPayment > 0 && firstInstallmentSlipNo.trim()) {
        customerFormData.append('first_installment_slip_no', firstInstallmentSlipNo.trim());
        customerFormData.append('slip_no', firstInstallmentSlipNo.trim());
      }

      customerFormData.append('is_old_record', isOldRecord ? 1 : 0);
      if (isOldRecord && manualCaseNo.trim()) {
        customerFormData.append('case_no', manualCaseNo.trim());
      }
      
      // ✅ Account Date - send manual date
      if (accountDate) {
        customerFormData.append('account_date', accountDate);
      }
      
      if (formData.cnicFront) {
        customerFormData.append('cnic_front', formData.cnicFront);
      }
      if (formData.cnicBack) {
        customerFormData.append('cnic_back', formData.cnicBack);
      }
      
      if (formData.additionalImage1) {
        customerFormData.append('additional_image_1', formData.additionalImage1);
      }
      if (formData.additionalImage2) {
        customerFormData.append('additional_image_2', formData.additionalImage2);
      }
      
      if (formData.billImage1) {
        customerFormData.append('bill_image_1', formData.billImage1);
      }
      if (formData.billImage2) {
        customerFormData.append('bill_image_2', formData.billImage2);
      }
      
      if (voiceFiles.length > 0) {
        voiceFiles.forEach((voice, idx) => {
          const fieldName = idx === 0 ? 'voice_consent' : `voice_consent_${idx + 1}`;
          customerFormData.append(fieldName, voice.file);
        });
      }
      
      if (formData.chalanFront) {
        customerFormData.append('chalan_front', formData.chalanFront);
      }
      if (formData.chalanBack) {
        customerFormData.append('chalan_back', formData.chalanBack);
      }

      const validGuarantors = formData.guarantors
        .map((g, originalIndex) => ({ ...g, originalIndex }))
        .filter(g => g.name.trim() && g.cnic.trim() && g.phone.trim());

      customerFormData.append('guarantors', JSON.stringify(
        validGuarantors.map(g => ({
          name: g.name.trim(),
          cnic: g.cnic.trim(),
          phone: g.phone.trim(),
          address: g.address?.trim() || ''
        }))
      ));

      const remainingAmount = (parseFloat(formData.invoicePrice) || 0) - (parseFloat(formData.advanceAmount) || 0);
      const totalInstallments = parseInt(formData.noOfInstallments) || 0;
      const monthlyInstallment = totalInstallments > 0 && remainingAmount > 0 
        ? Math.round(remainingAmount / totalInstallments) 
        : 0;

      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: customerFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const apiErrors = {};
          Object.keys(data.errors).forEach(key => {
            apiErrors[key] = data.errors[key][0];
          });
          setErrors(apiErrors);
          const firstMessage = Object.values(apiErrors)[0];
          showToaster(`Failed: ${firstMessage}`, 'error');
        } else {
          setErrors({ form: data.message || 'Failed to create customer' });
          showToaster(`Failed: ${data.message || 'Failed to create customer'}`, 'error');
        }
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      if (data.success) {
        const customerId = data.data.id;
        const employeeAccountId = data.data.employee_account_id || data.employee_account_id;
        const createdAccount = Array.isArray(data.data.accounts) && data.data.accounts.length > 0
          ? data.data.accounts[0]
          : null;
        
        console.log('✅ Customer created with ID:', customerId);
        console.log('✅ Employee Account ID:', employeeAccountId);
        console.log('✅ Account created (from customer response):', createdAccount);

        if (validGuarantors.length > 0) {
          for (let i = 0; i < validGuarantors.length; i++) {
            const guarantor = validGuarantors[i];
            try {
              const cleanCnic = guarantor.cnic.trim().replace(/[^0-9]/g, '');
              
              const guarantorFormData = new FormData();
              guarantorFormData.append('customer_id', customerId);
              guarantorFormData.append('name', guarantor.name.trim());
              guarantorFormData.append('cnic', cleanCnic);
              guarantorFormData.append('phone', guarantor.phone.trim());
              guarantorFormData.append('address', guarantor.address?.trim() || '');
              guarantorFormData.append('created_by', parseInt(employeeId));
              guarantorFormData.append('is_old_record', isOldRecord ? 1 : 0);
              
              const originalGuarantor = formData.guarantors[guarantor.originalIndex];
              
              if (originalGuarantor && originalGuarantor.cnicFront) {
                guarantorFormData.append('cnic_front', originalGuarantor.cnicFront);
              }
              if (originalGuarantor && originalGuarantor.cnicBack) {
                guarantorFormData.append('cnic_back', originalGuarantor.cnicBack);
              }
              
              const guarantorResponse = await fetch(`${API_URL}/guarantors`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
                body: guarantorFormData,
              });
              
              const guarantorResult = await guarantorResponse.json();
              
              if (!guarantorResponse.ok) {
                console.warn(`⚠️ Guarantor "${guarantor.name}" not created:`, guarantorResult);
                continue;
              }
              console.log(`✅ Guarantor ${i+1} created:`, guarantorResult);
            } catch (gError) {
              console.warn('⚠️ Error creating guarantor:', gError.message);
            }
          }
        }
        
        const empName = getSelectedEmployeeName() || user?.name || 'N/A';

        const paidNote = firstInstallmentPayment > 0
          ? `\nFirst Installment Paid: PKR ${Math.round(firstInstallmentPayment).toLocaleString()}${firstInstallmentSlipNo.trim() ? ` (Slip: ${firstInstallmentSlipNo.trim()})` : ''}`
          : `\nFirst Installment: Not paid yet (Will appear in Aging)`;

        let alertsNote = '';
        if (Array.isArray(data.alerts) && data.alerts.length > 0) {
          const typeLabels = { cnic: 'CNIC', limit: 'LIMIT', account: 'ACCOUNT', guarantor: 'GUARANTOR' };
          const alertLines = data.alerts.map(a => `• [${typeLabels[a.type] || a.type.toUpperCase()}] ${a.message}`).join('\n');
          alertsNote = `\n\n⚠️ ${data.alerts.length} ALERT(S) RECORDED:\n${alertLines}\n\n👉 These will also appear on the Alerts page.`;
        }
        
        showToaster(
          `Account created successfully!\n\nCustomer: ${formData.name}\nProduct: ${formData.productName}\nCase: ${createdAccount?.case_no || data.case_no || 'N/A'}\nStatus: ACTIVE\nGuarantors: ${validGuarantors.length} added\nMonthly Installment: PKR ${monthlyInstallment.toLocaleString()}${paidNote}${alertsNote}`,
          'success'
        );
        
        setFormData({
          name: '',
          cnic: '',
          phones: [''],
          address: '',
          work: '',
          employeeId: (user?.role === 'admin' || user?.role === 'manager') ? '' : user?.id || '',
          cnicFront: null,
          cnicBack: null,
          cnicFrontPreview: '',
          cnicBackPreview: '',
          additionalImage1: null,
          additionalImage2: null,
          additionalImage1Preview: '',
          additionalImage2Preview: '',
          billImage1: null,
          billImage2: null,
          billImage1Preview: '',
          billImage2Preview: '',
          guarantors: [
            { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
            { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
            { name: '', cnic: '', phone: '', address: '', cnicFront: null, cnicBack: null, cnicFrontPreview: '', cnicBackPreview: '' },
          ],
          productType: 'new',
          productName: '',
          productPrice: '',
          profitPercent: '',
          advanceAmount: '',
          invoicePrice: '',
          noOfInstallments: '',
          dueDate: '',
          installmentAmount: '',
          paymentType: 'cash',
          chalanFront: null,
          chalanBack: null,
          chalanFrontPreview: '',
          chalanBackPreview: '',
          accountType: 'regular',
          branch: userBranch || 1,
          status: 'active',
          created_by: null,
        });
        setVoiceFiles([]);
        setExistingAccountData(null);
        setIsOldRecord(false);
        setManualCaseNo('');
        setAccountDate('');
        setFirstInstallmentPayAmount('');
        setFirstInstallmentSlipNo('');
        setStep(1);
        
        setTimeout(() => {
          scrollToTop();
        }, 100);
        
      } else {
        setErrors({ form: data.message || 'Failed to create customer' });
        showToaster(`Failed: ${data.message || 'Failed to create customer'}`, 'error');
      }
    } catch (err) {
      console.error('Error:', err);
      setErrors({ form: 'Network error. Please try again.' });
      showToaster('Network error. Please check your connection.', 'error');
    }
    
    setLoading(false);
    isSubmittingRef.current = false;
  };

  const getGuarantorCount = () => {
    return formData.guarantors.filter(g => g.name && g.cnic && g.phone && g.address && g.cnicFront !== null && g.cnicBack !== null).length;
  };

  const getSelectedEmployeeName = () => {
    if ((userRole === 'admin' || userRole === 'manager') && formData.employeeId) {
      const emp = employees.find(e => e.id === parseInt(formData.employeeId));
      return emp ? emp.name : '';
    }
    return userName || '';
  };

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isEmployee = userRole === 'employee';

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  const getUserRoleDisplay = () => {
    if (userRole === 'admin') return 'Admin';
    if (userRole === 'manager') return 'Manager';
    if (userRole === 'employee') return 'Employee';
    return 'User';
  };

  const formatCurrency = (amount) => {
    const rounded = Math.round(parseFloat(amount) || 0);
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rounded);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getInvoicePriceDisplayValue = () => {
    const invoice = parseFloat(formData.invoicePrice) || 0;
    const advance = parseFloat(formData.advanceAmount) || 0;
    if (!formData.invoicePrice) return 'Auto-calculated from Product Price + Profit %';
    const displayAmount = Math.round(invoice - advance);
    return `PKR ${displayAmount.toLocaleString()}`;
  };

  return (
    <div className="add-account-container" ref={containerRef}>
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      <div className="user-info-bar" style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312e81 100%)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '10px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserCheck size={20} style={{ color: '#c4b5fd' }} />
          <span style={{ fontWeight: 600 }}>Account created by:</span>
          <span style={{ fontWeight: 700 }}>{userName || 'N/A'}</span>
          <span style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '2px 12px', 
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600
          }}>
            {getUserRoleDisplay()}
          </span>
          {userEmail && (
            <span style={{ fontSize: '13px', opacity: 0.8 }}>({userEmail})</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={16} style={{ color: '#c4b5fd' }} />
          <span style={{ fontWeight: 500 }}>{branchLabel}</span>
        </div>
      </div>

      {showExistingAccountModal && existingAccountData && (
        <div className="status-modal-overlay" onClick={() => setShowExistingAccountModal(false)}>
          <div className="status-modal" style={{ maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="status-modal-header">
              <AlertCircle size={24} className="status-modal-icon" style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Existing Customer Found</h3>
              <button className="status-modal-close" onClick={() => setShowExistingAccountModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="status-modal-body">
              <div style={{
                padding: '14px',
                background: existingAccountData.can_open_more ? '#fef3c7' : '#fee2e2',
                borderRadius: '10px',
                marginBottom: '16px',
                fontWeight: 700
              }}>
                {existingAccountData.can_open_more
                  ? `⚠️ ${existingAccountData.accounts_count} account already exists. Combined amount so far: ${formatCurrency(existingAccountData.total_combined_amount)}. Remaining limit: ${formatCurrency(existingAccountData.remaining_limit)}`
                  : `🚫 This CNIC already has ${existingAccountData.accounts_count} account(s) — limit exceeded. Combined amount: ${formatCurrency(existingAccountData.total_combined_amount)}. Account can still be created but will trigger an alert.`}
              </div>

              <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>Customer Info</h4>
              <div className="form-grid" style={{ marginBottom: '16px' }}>
                <div><strong>Name:</strong> {existingAccountData.customer.name}</div>
                <div><strong>CNIC:</strong> {existingAccountData.customer.cnic}</div>
                <div><strong>Phone:</strong> {existingAccountData.customer.phone}</div>
                <div><strong>Address:</strong> {existingAccountData.customer.address}</div>
                <div><strong>Work:</strong> {existingAccountData.customer.work}</div>
                <div><strong>Branch:</strong> Branch {existingAccountData.customer.branch_id}</div>
              </div>

              <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>
                Existing Account(s) ({existingAccountData.accounts.length})
              </h4>
              {existingAccountData.accounts.map(acc => (
                <div key={acc.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '8px' }}>
                    <span>Case: {acc.case_no}</span>
                    <span>{acc.product_name}</span>
                  </div>
                  <div className="form-grid" style={{ fontSize: '13px' }}>
                    <div>Total: {formatCurrency(acc.total_amount)}</div>
                    <div>Paid: {formatCurrency(acc.paid_amount)}</div>
                    <div>Balance: {formatCurrency(acc.balance)}</div>
                    <div>Installments: {acc.installments_paid}/{acc.total_installments}</div>
                    <div>Created By: {acc.creator_name}</div>
                    <div>Employee: {acc.employee_name}</div>
                    <div>Opened: {formatDate(acc.created_at)}</div>
                  </div>
                </div>
              ))}

              {existingAccountData.guarantor_records && existingAccountData.guarantor_records.length > 0 && (
                <>
                  <h4 style={{ fontWeight: 700, marginBottom: '8px', marginTop: '12px' }}>This CNIC Is Also a Guarantor For</h4>
                  {existingAccountData.guarantor_records.map((g, idx) => (
                    <div key={idx} style={{ fontSize: '13px', padding: '6px 0' }}>
                      • {g.customer_name} ({g.customer_cnic})
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="status-modal-footer">
              <button className="status-btn-cancel" onClick={() => setShowExistingAccountModal(false)} style={{ fontWeight: 700 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showFirstInstallmentModal && (
        <div className="status-modal-overlay" onClick={() => setShowFirstInstallmentModal(false)}>
          <div className="status-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="status-modal-header">
              <Banknote size={24} className="status-modal-icon" style={{ color: '#166534' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>First Installment Payment</h3>
              <button className="status-modal-close" onClick={() => setShowFirstInstallmentModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="status-modal-body">
              <div style={{
                padding: '12px 16px',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '10px',
                marginBottom: '16px',
                fontWeight: 600,
                fontSize: '14px'
              }}>
                First installment amount: <strong>PKR {formData.installmentAmount ? Math.round(parseFloat(formData.installmentAmount)).toLocaleString() : 0}</strong>
              </div>

              <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>How much are you paying now?</label>
              <div className="input-with-icon">
                <DollarSign size={18} style={{ color: '#166534' }} />
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={firstInstallmentPayAmount}
                  onChange={(e) => setFirstInstallmentPayAmount(e.target.value)}
                  style={{ fontWeight: 500 }}
                  max={formData.installmentAmount || undefined}
                  min="0"
                />
              </div>

              {parseFloat(firstInstallmentPayAmount) > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Slip No *</label>
                  <div className="input-with-icon">
                    <CreditCard size={18} style={{ color: '#2563eb' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter slip number..."
                      value={firstInstallmentSlipNo}
                      onChange={(e) => setFirstInstallmentSlipNo(e.target.value)}
                      style={{ fontWeight: 500 }}
                    />
                  </div>
                  <small className="field-hint" style={{ fontWeight: 500 }}>
                    Required when making a payment
                  </small>
                </div>
              )}

              <small className="field-hint" style={{ fontWeight: 500, marginTop: '12px', display: 'block' }}>
                Paying the full amount will mark this installment as "Paid" immediately and it won't appear in Aging. Partial or no payment will keep it in Aging/Overdue.
              </small>
            </div>
            <div className="status-modal-footer" style={{ gap: '10px' }}>
              <button className="status-btn-cancel" onClick={handleSkipPayment} style={{ fontWeight: 700 }} disabled={loading}>
                Skip & Create Account
              </button>
              <button className="btn-submit" onClick={handleConfirmWithPayment} style={{ fontWeight: 700 }} disabled={loading}>
                <CheckCircle size={16} />
                {loading ? 'Creating...' : 'Pay & Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="header-title-group">
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create New Account</h3>
          <span className="live-badge" style={{ fontWeight: 700 }}><Clock size={12} /> New</span>
        </div>
        {userBranch && (
          <div className="branch-badge-header" style={{ fontWeight: 700 }}>
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
        )}
      </div>

      {/* ============================================
          OLD RECORD TOGGLE
          ============================================ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: isOldRecord ? '2px solid #2563eb' : '1px solid #e5e7eb',
          background: isOldRecord ? '#eff6ff' : '#f9fafb',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={20} style={{ color: isOldRecord ? '#2563eb' : '#9ca3af' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Old Record (Purana Record)</div>
            <div style={{ fontWeight: 500, fontSize: '12px', color: '#6b7280' }}>
              {isOldRecord
                ? `ON — No restrictions (price, CNIC limit, duplicate account) apply. Case number must be entered manually (under ${OLD_RECORD_CASE_NO_LIMIT}).`
                : 'Turn ON to add old database records — no restrictions will apply, but you must enter a case number manually and provide at least 1 guarantor CNIC.'}
            </div>
          </div>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isOldRecord}
            onChange={(e) => setIsOldRecord(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: isOldRecord ? '#2563eb' : '#d1d5db',
              borderRadius: '999px',
              transition: '0.2s'
            }}
          />
          <span
            style={{
              position: 'absolute',
              height: '20px',
              width: '20px',
              left: isOldRecord ? '23px' : '3px',
              bottom: '3px',
              background: 'white',
              borderRadius: '50%',
              transition: '0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }}
          />
        </label>
      </div>

      {/* ============================================
          OLD RECORD FIELDS: Case Number (only for Old Record)
          ============================================ */}
      {isOldRecord && (
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: 700 }}>Case Number (Manual) *</label>
          <div className="input-with-icon">
            <CreditCard size={18} style={{ color: '#2563eb' }} />
            <input
              type="text"
              className="form-input"
              placeholder={`e.g. 9001 (must be under ${OLD_RECORD_CASE_NO_LIMIT})`}
              value={manualCaseNo}
              onChange={(e) => setManualCaseNo(e.target.value)}
              style={{ fontWeight: 500 }}
            />
          </div>
          <small className="field-hint" style={{ fontWeight: 500 }}>
            ⚠️ Only old case numbers (below {OLD_RECORD_CASE_NO_LIMIT}) are allowed. New case numbers are auto-generated from {OLD_RECORD_CASE_NO_LIMIT} onwards — no manual entry needed for those.
          </small>
          {errors.caseNo && <span className="error-text" style={{ fontWeight: 600 }}>{errors.caseNo}</span>}
        </div>
      )}

      <div className="cnic-search-section">
        <div className="cnic-search">
          <div className="input-with-icon">
            <Search size={18} />
            <input type="text" className="form-input" placeholder="Search by CNIC..." value={searchCNIC} onChange={(e) => setSearchCNIC(e.target.value)} style={{ fontWeight: 500 }} />
          </div>
          <button className="btn-search" onClick={handleCNICSearch} style={{ fontWeight: 700 }} disabled={cnicCheckLoading}>
            <Search size={16} />
            {cnicCheckLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <form onSubmit={handleFinalSubmit}>
        {step === 1 && (
          <div className="step-content">
            <div className="step-header" style={{ borderLeft: '5px solid #1E1B4B' }}>
              <div className="step-number" style={{ fontWeight: 800 }}>1</div>
              <div className="step-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Personal Information</div>
              <span className="step-badge" style={{ fontWeight: 600 }}>Required</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Full Name *</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input type="text" name="name" className="form-input" placeholder="Enter customer full name" value={formData.name} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.name && <span className="error-text" style={{ fontWeight: 600 }}>{errors.name}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>CNIC *</label>
                <div className="input-with-icon">
                  <CreditCard size={18} />
                  <input type="text" name="cnic" className="form-input" placeholder="XXXXX-XXXXXXX-X" value={formData.cnic} onChange={handleChange} onBlur={handleCnicBlur} style={{ fontWeight: 500 }} />
                </div>
                {errors.cnic && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnic}</span>}
                <small className="field-hint" style={{ fontWeight: 500 }}>
                  {cnicCheckLoading ? 'Checking CNIC...' : 'System will check if this CNIC already exists or is a guarantor'}
                </small>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Phone Number *</label>
                {formData.phones.map((phone, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: index < formData.phones.length - 1 ? '8px' : '0' }}>
                    <div className="input-with-icon" style={{ flex: 1 }}>
                      <Phone size={18} />
                      <input
                        type="tel"
                        className="form-input"
                        placeholder={index === 0 ? '03XX-XXXXXXX' : `Phone ${index + 1} (Optional)`}
                        value={phone}
                        onChange={(e) => handlePhoneChange(index, e.target.value)}
                        style={{ fontWeight: 500 }}
                      />
                    </div>
                    {formData.phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhoneField(index)}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '8px',
                          width: '38px',
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#dc2626',
                          flexShrink: 0
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {formData.phones.length < MAX_PHONE_NUMBERS && (
                  <button
                    type="button"
                    onClick={addPhoneField}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '6px 0',
                      marginTop: '6px'
                    }}
                  >
                    <Plus size={14} /> Add another number
                  </button>
                )}
                {errors.phones && <span className="error-text" style={{ fontWeight: 600 }}>{errors.phones}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Branch *</label>
                <select name="branch" className="form-input" value={formData.branch} onChange={handleChange} disabled={!!userBranch} style={userBranch ? { opacity: 0.7, cursor: 'not-allowed', fontWeight: 500 } : { fontWeight: 500 }}>
                  <option value={1}>Branch 1</option>
                  <option value={2}>Branch 2</option>
                </select>
                {userBranch && <small className="field-hint" style={{ fontWeight: 500 }}>Branch locked to {branchLabel}</small>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Address *</label>
                <div className="input-with-icon">
                  <MapPin size={18} />
                  <input type="text" name="address" className="form-input" placeholder="Enter complete address" value={formData.address} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.address && <span className="error-text" style={{ fontWeight: 600 }}>{errors.address}</span>}
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Work / Occupation *</label>
                <div className="input-with-icon">
                  <Briefcase size={18} />
                  <input type="text" name="work" className="form-input" placeholder="Enter work/occupation" value={formData.work} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.work && <span className="error-text" style={{ fontWeight: 600 }}>{errors.work}</span>}
              </div>
            </div>

            <div className="employee-section" style={{ border: '1px solid #c4b5fd', background: '#faf8ff' }}>
              <div className="section-header">
                <UserPlus size={18} style={{ color: '#1E1B4B' }} />
                <h4 style={{ fontWeight: 700 }}>{(isAdmin || isManager) ? 'Select Employee *' : 'Account Opened By *'}</h4>
                {!(isAdmin || isManager) && (
                  <span className="auto-badge" style={{ background: '#dcfce7', color: '#166534', padding: '2px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    Auto-detected
                  </span>
                )}
              </div>
              
              {(isAdmin || isManager) ? (
                <div className="employee-dropdown-wrapper">
                  <select 
                    name="employeeId" 
                    className="form-input employee-select" 
                    value={formData.employeeId} 
                    onChange={handleChange} 
                    style={{ fontWeight: 500 }}
                    disabled={employeesLoading}
                  >
                    <option value="">{employeesLoading ? 'Loading employees...' : 'Select Employee...'}</option>
                    {getAvailableEmployees().map(emp => {
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      );
                    })}
                  </select>
                  {formData.employeeId && (
                    <div className="selected-employee-info">
                      <span className="employee-badge" style={{ fontWeight: 600 }}>
                        <CheckCircle size={12} />
                        {getSelectedEmployeeName()} - {branchLabel}
                      </span>
                    </div>
                  )}
                  {errors.employeeId && <span className="error-text" style={{ fontWeight: 600 }}>{errors.employeeId}</span>}
                  {getAvailableEmployees().length === 0 && !employeesLoading && (
                    <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', fontWeight: 500 }}>
                      ⚠️ No employees found in {branchLabel}. Please add employees first.
                    </p>
                  )}
                </div>
              ) : (
                <div className="employee-auto-info" style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <UserCheck size={20} style={{ color: '#166534' }} />
                  <div>
                    <span style={{ fontWeight: 700, color: '#166534' }}>{userName || 'N/A'}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280', marginLeft: '8px' }}>
                      ({getUserRoleDisplay()}) - {branchLabel}
                    </span>
                  </div>
                  <input type="hidden" name="employeeId" value={userId || ''} />
                </div>
              )}
              {userBranch && <p className="employee-hint" style={{ fontWeight: 500 }}>Only employees from {branchLabel} are available</p>}
            </div>

            <div className="image-section" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
              <div className="section-header">
                <Upload size={18} style={{ color: '#92400e' }} />
                <h4 style={{ fontWeight: 700 }}>Forms</h4>
                <span className="required-badge" style={{ fontWeight: 600, color: '#92400e', background: '#fde68a', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Both Required</span>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500, color: '#6b7280' }}>Please upload 2 additional required documents</p>
              
              <div className="image-grid">
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Additional Image 1 *</label>
                  <div className="upload-area" onClick={() => additionalImage1Ref.current?.click()} style={{ borderColor: errors.additionalImage1 ? '#ef4444' : '#fde68a' }}>
                    {formData.additionalImage1Preview ? (
                      <div className="preview-container">
                        <img src={formData.additionalImage1Preview} alt="Additional Image 1" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeAdditionalImage('additionalImage1'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#92400e' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={additionalImage1Ref} accept="image/*" onChange={(e) => handleAdditionalImageUpload(e, 'additionalImage1')} style={{ display: 'none' }} />
                  {errors.additionalImage1 && <span className="error-text" style={{ fontWeight: 600 }}>{errors.additionalImage1}</span>}
                </div>
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Additional Image 2 *</label>
                  <div className="upload-area" onClick={() => additionalImage2Ref.current?.click()} style={{ borderColor: errors.additionalImage2 ? '#ef4444' : '#fde68a' }}>
                    {formData.additionalImage2Preview ? (
                      <div className="preview-container">
                        <img src={formData.additionalImage2Preview} alt="Additional Image 2" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeAdditionalImage('additionalImage2'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#92400e' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={additionalImage2Ref} accept="image/*" onChange={(e) => handleAdditionalImageUpload(e, 'additionalImage2')} style={{ display: 'none' }} />
                  {errors.additionalImage2 && <span className="error-text" style={{ fontWeight: 600 }}>{errors.additionalImage2}</span>}
                </div>
              </div>
            </div>

            <div className="voice-section" style={{ 
              border: voiceFiles.length === 0 ? '1px solid #e5e7eb' : '1px solid #86efac', 
              background: voiceFiles.length === 0 ? '#fafafa' : '#f0fdf4' 
            }}>
              <div className="section-header">
                <Mic size={18} style={{ color: voiceFiles.length === 0 ? '#6b7280' : '#065f46' }} />
                <h4 style={{ fontWeight: 700 }}>Voice Consent / Raza Mandi</h4>
                <span className="optional-badge" style={{ 
                  fontWeight: 600, 
                  color: voiceFiles.length === 0 ? '#6b7280' : '#065f46', 
                  background: voiceFiles.length === 0 ? '#f3f4f6' : '#d1fae5', 
                  padding: '2px 10px', 
                  borderRadius: '12px', 
                  fontSize: '12px' 
                }}>
                  {voiceFiles.length === 0 ? 'Optional' : `✅ ${voiceFiles.length}/${MAX_VOICE_FILES} Uploaded`}
                </span>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500, color: '#6b7280' }}>
                {voiceFiles.length === 0 
                  ? `Upload customer's consent voice file (Optional, max ${MAX_VOICE_FILES})` 
                  : `Customer's consent voice file(s) uploaded successfully (${voiceFiles.length}/${MAX_VOICE_FILES})`}
              </p>
              
              {voiceFiles.length < MAX_VOICE_FILES && (
                <div className="voice-upload">
                  <div className="upload-area voice-upload-area" onClick={() => voiceFileRef.current?.click()} style={{ 
                    borderColor: voiceFiles.length === 0 ? '#d1d5db' : '#86efac',
                    background: voiceFiles.length === 0 ? 'white' : '#f0fdf4'
                  }}>
                    <FileAudio size={32} style={{ color: voiceFiles.length === 0 ? '#6b7280' : '#065f46' }} />
                    <span style={{ fontWeight: 600 }}>{voiceFiles.length === 0 ? 'Click to upload voice file (Optional)' : 'Click to upload another voice file'}</span>
                    <span className="file-hint" style={{ fontWeight: 500 }}>MP3, WAV, M4A (Max 10MB) — {voiceFiles.length}/{MAX_VOICE_FILES} used</span>
                  </div>
                  <input type="file" ref={voiceFileRef} accept="audio/*" onChange={handleVoiceFileUpload} style={{ display: 'none' }} />
                </div>
              )}
              {voiceFiles.length >= MAX_VOICE_FILES && (
                <p style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600, marginTop: '4px' }}>
                  ⚠️ Maximum {MAX_VOICE_FILES} voice files reached. Delete one below to add another.
                </p>
              )}

              {errors.voiceConsent && (
                <span className="error-text" style={{ fontWeight: 600, display: 'block', marginTop: '8px' }}>
                  {errors.voiceConsent}
                </span>
              )}

              {voiceFiles.length > 0 && (
                <div className="voice-files-list">
                  <p className="voice-files-title" style={{ fontWeight: 700 }}>Uploaded Files ({voiceFiles.length}/{MAX_VOICE_FILES})</p>
                  {voiceFiles.map((voice, index) => (
                    <div key={voice.id} className="voice-file-item">
                      <div className="voice-file-info">
                        <Mic size={16} style={{ color: '#065f46' }} />
                        <span className="voice-file-name" style={{ fontWeight: 600 }}>{voice.name}</span>
                        <span className="voice-file-size" style={{ fontWeight: 500 }}>{voice.size} KB</span>
                        <span className="voice-file-time" style={{ fontWeight: 500 }}>{voice.timestamp}</span>
                      </div>
                      <div className="voice-file-actions">
                        <button 
                          className={`btn-play ${playingIndex === index ? 'playing' : ''}`} 
                          onClick={() => playVoice(index)} 
                          style={{ 
                            fontWeight: 600,
                            background: playingIndex === index ? '#ef4444' : '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {playingIndex === index ? (
                            <>
                              <PauseCircle size={14} /> Stop
                            </>
                          ) : (
                            <>
                              <Play size={14} /> Play
                            </>
                          )}
                        </button>
                        <button className="btn-delete-voice" onClick={() => deleteVoice(index)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="image-section" style={{ border: '1px solid #bfdbfe', background: '#eff6ff' }}>
              <div className="section-header">
                <Upload size={18} style={{ color: '#2563eb' }} />
                <h4 style={{ fontWeight: 700 }}>CNIC Images *</h4>
              </div>
              <div className="image-grid">
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>CNIC Front</label>
                  <div className="upload-area" onClick={() => cnicFrontRef.current?.click()}>
                    {formData.cnicFrontPreview ? (
                      <div className="preview-container">
                        <img src={formData.cnicFrontPreview} alt="CNIC Front" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('cnicFront'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#2563eb' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={cnicFrontRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'cnicFront')} style={{ display: 'none' }} />
                  {errors.cnicFront && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnicFront}</span>}
                </div>
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>CNIC Back</label>
                  <div className="upload-area" onClick={() => cnicBackRef.current?.click()}>
                    {formData.cnicBackPreview ? (
                      <div className="preview-container">
                        <img src={formData.cnicBackPreview} alt="CNIC Back" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('cnicBack'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#2563eb' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={cnicBackRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'cnicBack')} style={{ display: 'none' }} />
                  {errors.cnicBack && <span className="error-text" style={{ fontWeight: 600 }}>{errors.cnicBack}</span>}
                </div>
              </div>
            </div>

            <div className="guarantors-section" style={{ border: '1px solid #fde68a', background: '#fffbeb' }}>
              <div className="section-header">
                <Users size={18} style={{ color: '#92400e' }} />
                <h4 style={{ fontWeight: 700 }}>Guarantors</h4>
                <span className="required-badge" style={{ fontWeight: 700 }}>
                  {isOldRecord ? 'Old Record: Only 1 CNIC Required' : 'Minimum 1 Required'}
                </span>
              </div>
              <p className="guarantor-count" style={{ fontWeight: 600 }}>Complete: {getGuarantorCount()}/3</p>
              {formData.guarantors.map((g, index) => {
                const isTouched =
                  (g.name && g.name.trim()) ||
                  (g.cnic && g.cnic.trim()) ||
                  (g.phone && g.phone.trim()) ||
                  (g.address && g.address.trim()) ||
                  g.cnicFront ||
                  g.cnicBack;
                const isComplete = g.name.trim() && g.cnic.trim() && g.phone.trim() && g.address.trim() && g.cnicFront && g.cnicBack;
                const isPartial = isTouched && !isComplete;

                return (
                <div key={index} className="guarantor-card" style={{ border: isPartial ? '2px solid #dc2626' : '1px solid #fde68a' }}>
                  <div className="guarantor-header" style={{ fontWeight: 700 }}>
                    <Users size={16} style={{ color: '#92400e' }} />
                    <span>Guarantor {index + 1}</span>
                    {isComplete && (
                      <span className="filled-badge" style={{ fontWeight: 600 }}><CheckCircle size={12} /> Complete</span>
                    )}
                    {isPartial && (
                      <span className="filled-badge" style={{ fontWeight: 600, background: '#fee2e2', color: '#991b1b' }}>
                        <AlertCircle size={12} /> Incomplete — finish or clear this
                      </span>
                    )}
                  </div>
                  <div className="guarantor-grid">
                    <input type="text" className="form-input" placeholder="Full Name" value={g.name} onChange={(e) => handleGuarantorChange(index, 'name', e.target.value)} style={{ fontWeight: 500 }} />
                    <input type="text" className="form-input" placeholder="CNIC" value={g.cnic} onChange={(e) => handleGuarantorChange(index, 'cnic', e.target.value)} onBlur={() => handleGuarantorCnicBlur(index)} style={{ fontWeight: 500 }} />
                    <input type="tel" className="form-input" placeholder="Phone" value={g.phone} onChange={(e) => handleGuarantorChange(index, 'phone', e.target.value)} style={{ fontWeight: 500 }} />
                    <input type="text" className="form-input" placeholder="Address" value={g.address} onChange={(e) => handleGuarantorChange(index, 'address', e.target.value)} style={{ fontWeight: 500 }} />
                  </div>
                  <div className="guarantor-images">
                    <div className="guarantor-image-box">
                      <label style={{ fontWeight: 600 }}>CNIC Front</label>
                      <div className="upload-area small" onClick={() => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].front?.click(); }}>
                        {g.cnicFrontPreview ? (
                          <div className="preview-container">
                            <img src={g.cnicFrontPreview} alt="Guarantor CNIC Front" />
                            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeGuarantorFile(index, 'cnicFront'); }}><X size={14} /></button>
                          </div>
                        ) : ( <><Upload size={20} style={{ color: '#92400e' }} /><span style={{ fontWeight: 500 }}>Upload Front</span></> )}
                      </div>
                      <input type="file" ref={(el) => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].front = el; }} accept="image/*" onChange={(e) => handleGuarantorFileUpload(e, index, 'cnicFront')} style={{ display: 'none' }} />
                    </div>
                    <div className="guarantor-image-box">
                      <label style={{ fontWeight: 600 }}>CNIC Back</label>
                      <div className="upload-area small" onClick={() => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].back?.click(); }}>
                        {g.cnicBackPreview ? (
                          <div className="preview-container">
                            <img src={g.cnicBackPreview} alt="Guarantor CNIC Back" />
                            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeGuarantorFile(index, 'cnicBack'); }}><X size={14} /></button>
                          </div>
                        ) : ( <><Upload size={20} style={{ color: '#92400e' }} /><span style={{ fontWeight: 500 }}>Upload Back</span></> )}
                      </div>
                      <input type="file" ref={(el) => { if (!guarantorRefs.current[index]) guarantorRefs.current[index] = {}; guarantorRefs.current[index].back = el; }} accept="image/*" onChange={(e) => handleGuarantorFileUpload(e, index, 'cnicBack')} style={{ display: 'none' }} />
                    </div>
                  </div>
                  <small className="field-hint" style={{ fontWeight: 500 }}>
                    {isOldRecord
                      ? 'Old Record mode: Only CNIC is required — other fields and images are optional'
                      : 'System will check if this CNIC is already a customer or guarantor'}
                  </small>
                </div>
                );
              })}
              {errors.guarantors && <span className="error-text" style={{ fontWeight: 600, color: '#dc2626' }}>{errors.guarantors}</span>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <div className="step-header" style={{ borderLeft: '5px solid #C9A84C' }}>
              <div className="step-number" style={{ fontWeight: 800 }}>2</div>
              <div className="step-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Product & Installment Details</div>
              <span className="step-badge" style={{ fontWeight: 600 }}>Required</span>
            </div>

            {isOldRecord && (
              <div style={{
                padding: '12px 16px',
                background: '#eff6ff',
                border: '1px solid #2563eb',
                borderRadius: '10px',
                marginBottom: '16px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <History size={16} style={{ color: '#2563eb' }} />
                Old Record mode ON — No price or account limits apply. Case Number: {manualCaseNo || 'N/A'}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Product Type *</label>
                <select name="productType" className="form-input" value={formData.productType} onChange={handleChange} style={{ fontWeight: 500 }}>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Product Name / Purpose *</label>
                <div className="input-with-icon">
                  <Package size={18} style={{ color: '#C9A84C' }} />
                  <input type="text" name="productName" className="form-input" placeholder="e.g., Mobile, Delivery, Education fees, etc." value={formData.productName} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>What is this account for? (Product name, purpose, description)</small>
                {errors.productName && <span className="error-text" style={{ fontWeight: 600 }}>{errors.productName}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Product Price (PKR) *</label>
                <div className="input-with-icon">
                  <DollarSign size={18} style={{ color: '#C9A84C' }} />
                  <input
                    type="number"
                    name="productPrice"
                    className="form-input"
                    placeholder="Enter product price"
                    value={formData.productPrice}
                    onChange={handleChange}
                    onBlur={handleProductPriceBlur}
                    style={{ fontWeight: 500 }}
                  />
                </div>
                {!isOldRecord && parseFloat(formData.productPrice) > MAX_PRODUCT_PRICE && (
                  <small className="field-hint" style={{ fontWeight: 600, color: '#dc2626' }}>
                    ⚠️ This amount exceeds the normal limit of PKR {MAX_PRODUCT_PRICE.toLocaleString()} — account can still be created but will trigger an alert.
                  </small>
                )}
                {errors.productPrice && <span className="error-text" style={{ fontWeight: 600 }}>{errors.productPrice}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Profit / Markup (%) *</label>
                <div className="input-with-icon">
                  <Percent size={18} style={{ color: '#C9A84C' }} />
                  <input
                    type="number"
                    name="profitPercent"
                    className="form-input"
                    placeholder="e.g., 30"
                    value={formData.profitPercent}
                    onChange={handleChange}
                    style={{ fontWeight: 500 }}
                  />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>Invoice Price = Product Price + (Product Price × Profit %). No limit on this.</small>
                {errors.profitPercent && <span className="error-text" style={{ fontWeight: 600 }}>{errors.profitPercent}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Invoice Price (PKR)</label>
                <div className="input-with-icon">
                  <DollarSign size={18} style={{ color: '#C9A84C' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={getInvoicePriceDisplayValue()}
                    readOnly
                    style={{ background: '#f8f9fa', fontWeight: 600 }}
                  />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>Product Price + Profit % minus Advance is shown here</small>
                {errors.invoicePrice && <span className="error-text" style={{ fontWeight: 600 }}>{errors.invoicePrice}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Advance</label>
                <div className="input-with-icon">
                  <DollarSign size={18} style={{ color: '#C9A84C' }} />
                  <input type="number" name="advanceAmount" className="form-input" placeholder="Enter advance amount" value={formData.advanceAmount} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Number of Installments *</label>
                <div className="input-with-icon">
                  <Calendar size={18} style={{ color: '#C9A84C' }} />
                  <input type="number" name="noOfInstallments" className="form-input" placeholder="e.g., 6, 12, 24" value={formData.noOfInstallments} onChange={handleChange} style={{ fontWeight: 500 }} />
                </div>
                {errors.noOfInstallments && <span className="error-text" style={{ fontWeight: 600 }}>{errors.noOfInstallments}</span>}
              </div>
              
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Due Date *</label>
                <input type="date" name="dueDate" className="form-input" value={formData.dueDate} onChange={handleChange} style={{ fontWeight: 500 }} />
                {errors.dueDate && <span className="error-text" style={{ fontWeight: 600 }}>{errors.dueDate}</span>}
              </div>

              {/* ✅ ACCOUNT OPENING DATE - NOW IN STEP 2, UNDER DUE DATE */}
              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Account Opening Date *</label>
                <div className="input-with-icon">
                  <Calendar size={18} style={{ color: '#2563eb' }} />
                  <input
                    type="date"
                    className="form-input"
                    value={accountDate}
                    onChange={(e) => setAccountDate(e.target.value)}
                    style={{ fontWeight: 500 }}
                  />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>
                  {isOldRecord 
                    ? 'Purane record ki asal account opening date daalo — installments isi date se calculate hongi.'
                    : 'Naye account ki opening date daalo — installments isi date se calculate hongi.'}
                </small>
                {errors.accountDate && <span className="error-text" style={{ fontWeight: 600 }}>{errors.accountDate}</span>}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700 }}>Installment Amount</label>
                <div className="input-with-icon">
                  <DollarSign size={18} style={{ color: '#C9A84C' }} />
                  <input type="text" className="form-input" value={formData.installmentAmount ? `PKR ${Math.round(parseFloat(formData.installmentAmount)).toLocaleString()}` : 'Calculate from invoice - advance / installments'} readOnly style={{ background: '#f8f9fa', fontWeight: 600 }} />
                </div>
                <small className="field-hint" style={{ fontWeight: 500 }}>Calculation: (Invoice - Advance) / Number of Installments</small>
              </div>
            </div>

            <div className="image-section" style={{ border: '1px solid #d1fae5', background: '#f0fdf4' }}>
              <div className="section-header">
                <Upload size={18} style={{ color: '#065f46' }} />
                <h4 style={{ fontWeight: 700 }}>Chalan Images</h4>
                <span className="required-badge" style={{ fontWeight: 600, color: '#065f46', background: '#d1fae5', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>Front Required</span>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500, color: '#6b7280' }}>Chalan Front is required. Chalan Back is optional.</p>
              <div className="image-grid">
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Chalan Front *</label>
                  <div className="upload-area" onClick={() => chalanFrontRef.current?.click()} style={{ borderColor: errors.chalanFront ? '#ef4444' : '#d1fae5' }}>
                    {formData.chalanFrontPreview ? (
                      <div className="preview-container">
                        <img src={formData.chalanFrontPreview} alt="Chalan Front" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('chalanFront'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#065f46' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={chalanFrontRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'chalanFront')} style={{ display: 'none' }} />
                  {errors.chalanFront && <span className="error-text" style={{ fontWeight: 600 }}>{errors.chalanFront}</span>}
                </div>
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Chalan Back (Optional)</label>
                  <div className="upload-area" onClick={() => chalanBackRef.current?.click()} style={{ borderColor: '#d1fae5' }}>
                    {formData.chalanBackPreview ? (
                      <div className="preview-container">
                        <img src={formData.chalanBackPreview} alt="Chalan Back" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile('chalanBack'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#065f46' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={chalanBackRef} accept="image/*" onChange={(e) => handleFileUpload(e, 'chalanBack')} style={{ display: 'none' }} />
                  {errors.chalanBack && <span className="error-text" style={{ fontWeight: 600 }}>{errors.chalanBack}</span>}
                </div>
              </div>
            </div>

            <div className="image-section" style={{ border: '1px solid #d1d5db', background: '#fafafa', marginTop: '16px' }}>
              <div className="section-header">
                <FileImage size={18} style={{ color: '#6b7280' }} />
                <h4 style={{ fontWeight: 700 }}>Bill Images</h4>
                <span className="optional-badge" style={{ fontWeight: 600, color: '#6b7280', background: '#f3f4f6', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
                  Optional
                </span>
              </div>
              <p className="voice-hint" style={{ fontWeight: 500, color: '#6b7280' }}>Upload bill images (Optional)</p>
              
              <div className="image-grid">
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Bill Image 1</label>
                  <div className="upload-area" onClick={() => billImage1Ref.current?.click()} style={{ borderColor: '#d1d5db' }}>
                    {formData.billImage1Preview ? (
                      <div className="preview-container">
                        <img src={formData.billImage1Preview} alt="Bill Image 1" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeBillImage('bill1'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#6b7280' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={billImage1Ref} accept="image/*" onChange={(e) => handleBillImageUpload(e, 'bill1')} style={{ display: 'none' }} />
                </div>
                <div className="image-upload-box">
                  <label style={{ fontWeight: 600 }}>Bill Image 2</label>
                  <div className="upload-area" onClick={() => billImage2Ref.current?.click()} style={{ borderColor: '#d1d5db' }}>
                    {formData.billImage2Preview ? (
                      <div className="preview-container">
                        <img src={formData.billImage2Preview} alt="Bill Image 2" />
                        <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeBillImage('bill2'); }}><X size={16} /></button>
                      </div>
                    ) : ( <><Upload size={32} style={{ color: '#6b7280' }} /><span style={{ fontWeight: 500 }}>Click to upload</span></> )}
                  </div>
                  <input type="file" ref={billImage2Ref} accept="image/*" onChange={(e) => handleBillImageUpload(e, 'bill2')} style={{ display: 'none' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          {step === 2 && <button type="button" className="btn-prev" onClick={handlePrev} style={{ fontWeight: 700 }}>Previous</button>}
          {step === 1 ? (
            <button type="button" className="btn-next" onClick={handleNext} style={{ fontWeight: 700 }}>Next →</button>
          ) : (
            <button type="submit" className="btn-submit" style={{ fontWeight: 700 }} disabled={loading}>
              <CheckCircle size={18} />
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          )}
        </div>

        <div className="step-indicator" style={{ fontWeight: 600 }}>
          <span className={step === 1 ? 'active' : 'done'}>1. Personal Info</span>
          <span className="step-line"></span>
          <span className={step === 2 ? 'active' : ''}>2. Product & Installments</span>
        </div>
      </form>
    </div>
  );
};

export default AddAccount;