// src/components/CashFlow/CashFlow.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, RefreshCw, X, Wallet, Coffee, Droplets, Snowflake, 
  Wrench, Wifi, Zap, Users, Briefcase, Search, Filter,
  CheckCircle, AlertCircle, Clock, Loader2
} from 'lucide-react';
import './CashFlow.css';
import { API_URL } from '../../../config';
import ExportButton from '../common/ExportButton';  // ✅ NEW: ExportButton import

// ============================================
// ✅ TOASTER COMPONENT
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
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
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
// ✅ CATEGORY CONFIG - Used for form fields AND table columns
// ============================================
const CATEGORIES = [
  { id: 'total_cash_collection', label: 'Total Cash Collection' },
  { id: 'wallet_opening', label: 'Wallet Opening' },
  { id: 'sub_total', label: 'Sub Total' },
  { id: 'kp_dot', label: 'KP DOT' },
  { id: 'cash_to_kp', label: 'Cash To KP' },
  { id: 'salary', label: 'Salary A/C' },
  { id: 'advances', label: 'Advances' },
  { id: 'ke_bill', label: 'KE Bill Expense' },
  { id: 'water_bill', label: 'Water Bill Expense' },
  { id: 'internet_bill', label: 'Internet Bill Expense' },
  { id: 'maintenance', label: 'Maintenance Expense' },
  { id: 'water_ice', label: 'Water/Ice Expense' },
  { id: 'tea', label: 'Tea Expense' },
  { id: 'others', label: 'Others' },
  { id: 'wallet_closing', label: 'Wallet Closing' },
];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);
const formatMoney = (n) => "Rs " + Math.round(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });
const formatDateLabel = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const sumLines = (lines) => lines.reduce((s, l) => s + num(l.amount), 0);

const emptyForm = () => ({
  id: null,
  date: todayISO(),
  inflows: [{ id: uid(), label: "Inflow", amount: "" }],
  outflows: CATEGORIES.map(c => ({ id: uid(), label: c.label, amount: "" })),
  note: "",
});

// ============================================
// ✅ API HELPERS
// ============================================
const getToken = () => localStorage.getItem('token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const CashFlow = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userRole, setUserRole] = useState(null);
  const [userBranch, setUserBranch] = useState(null);

  // ============================================
  // ✅ FILTER STATE
  // ============================================
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState("all");
  const [viewMode, setViewMode] = useState("monthly");

  // ============================================
  // ✅ FORM STATE
  // ============================================
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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

  // ============================================
  // ✅ LOAD USER INFO
  // ============================================
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'manager';

  // ============================================
  // ✅ FETCH ENTRIES FROM BACKEND
  // ============================================
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cashflow`, {
        method: 'GET',
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error('Failed to fetch entries');

      const json = await res.json();
      setEntries(json.data || []);
    } catch (err) {
      showToaster('Failed to load entries', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // ✅ FORM HANDLERS
  // ============================================
  const openAddForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (entry) => {
    setForm(JSON.parse(JSON.stringify(entry)));
    setEditingId(entry.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const updateBase = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const updateLine = (section, id, key, value) =>
    setForm(f => ({
      ...f,
      [section]: f[section].map(l => (l.id === id ? { ...l, [key]: value } : l)),
    }));

  const addLine = (section) =>
    setForm(f => ({
      ...f,
      [section]: [...f[section], { id: uid(), label: "", amount: "" }],
    }));

  const removeLine = (section, id) =>
    setForm(f => ({ ...f, [section]: f[section].filter(l => l.id !== id) }));

  // ============================================
  // ✅ SUBMIT (CREATE / UPDATE) - BACKEND CALL
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanLines = (lines) =>
      lines
        .filter(l => l.label.trim() !== "" || l.amount !== "")
        .map(l => ({ ...l, label: l.label.trim() || "Untitled" }));

    const payload = {
      id: editingId || uid(),
      date: form.date,
      note: form.note,
      inflows: cleanLines(form.inflows),
      outflows: cleanLines(form.outflows),
      branch: userBranch,
      created_by: userRole,
    };

    setSaving(true);
    try {
      const url = editingId
        ? `${API_URL}/cashflow/${editingId}`
        : `${API_URL}/cashflow`;

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        console.log('VALIDATION ERRORS:', json.errors);
        const firstError = json.errors
          ? Object.values(json.errors)[0][0]
          : json.message;
        throw new Error(firstError || 'Something went wrong');
      }

      showToaster(editingId ? 'Entry updated successfully!' : 'Entry added successfully!', 'success');
      closeForm();
      fetchEntries();
    } catch (err) {
      showToaster(err.message || 'Failed to save entry', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // ✅ DELETE - BACKEND CALL
  // ============================================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/cashflow/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete entry');
      }

      showToaster('Entry deleted successfully!', 'success');
      fetchEntries();
    } catch (err) {
      showToaster(err.message || 'Failed to delete entry', 'error');
    }
  };

  const handleRefresh = () => {
    fetchEntries();
    showToaster('Data refreshed successfully!', 'success');
  };

  // ============================================
  // ✅ FILTER LOGIC
  // ============================================
  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => {
        const d = new Date(e.date);
        if (d.getFullYear() !== filterYear) return false;
        if (viewMode !== "monthly" && filterMonth !== "all" && d.getMonth() !== Number(filterMonth)) return false;
        return true;
      })
      .sort((a, b) => a.date < b.date ? 1 : -1);
  }, [entries, filterYear, filterMonth, viewMode]);

  const getTotals = (list) =>
    list.reduce((acc, e) => {
      const inTotal = sumLines(e.inflows);
      const outTotal = sumLines(e.outflows);
      acc.inflow += inTotal;
      acc.outflow += outTotal;
      acc.net += (inTotal - outTotal);
      return acc;
    }, { inflow: 0, outflow: 0, net: 0 });

  const totals = useMemo(() => getTotals(filteredEntries), [filteredEntries]);

  // ============================================
  // ✅ EXPORT DATA - CashFlow ke liye
  // ============================================
  const getExportData = useCallback(() => {
    return filteredEntries.map((entry) => {
      const inTotal = sumLines(entry.inflows);
      const row = {
        date: formatDateLabel(entry.date),
        note: entry.note || '-',
        inflow: inTotal > 0 ? formatMoney(inTotal) : '-',
      };
      
      // Har category ka amount add karo
      CATEGORIES.forEach(cat => {
        const line = entry.outflows.find(l => l.label === cat.label);
        const amt = line ? num(line.amount) : 0;
        row[cat.label] = amt > 0 ? formatMoney(amt) : '-';
      });
      
      return row;
    });
  }, [filteredEntries]);

  const exportColumns = useMemo(() => {
    const cols = [
      { header: 'Date', key: 'date' },
      { header: 'Note', key: 'note' },
      { header: 'Inflow', key: 'inflow' },
    ];
    
    CATEGORIES.forEach(cat => {
      cols.push({ header: cat.label, key: cat.label });
    });
    
    return cols;
  }, []);

  // ============================================
  // ✅ RENDER FUNCTIONS
  // ============================================
  const availableYears = useMemo(() => {
    const years = new Set(entries.map(e => new Date(e.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [entries, currentYear]);

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="cashflow-app">
      {/* ===== TOASTER ===== */}
      {toaster.show && (
        <Toaster
          message={toaster.message}
          type={toaster.type}
          onClose={hideToaster}
        />
      )}

      {/* ===== HEADER ===== */}
      <header className="cashflow-header">
        <div className="cashflow-header-top">
          <div className="cashflow-brand">
            <span className="cashflow-brand-mark">Rs</span>
            <div>
              <h1>Cash Flow</h1>
              <span className="cashflow-subtitle">Monthly Register</span>
            </div>
          </div>
          <div className="cashflow-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* ✅ NEW: Export Button */}
            <ExportButton
              data={getExportData()}
              columns={exportColumns}
              filename="cash-flow-report"
              title="Cash Flow Report"
            />
            {isAdmin && (
              <button className="cashflow-btn cashflow-btn-primary" onClick={openAddForm}>
                <span className="cashflow-plus">+</span> Add Entry
              </button>
            )}
          </div>
        </div>

        <div className="cashflow-filters">
          <div className="cashflow-filter-group">
            <label>Year</label>
            <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {viewMode !== "monthly" && (
            <div className="cashflow-filter-group">
              <label>Month</label>
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                <option value="all">All months</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <div className="cashflow-filter-group cashflow-view-toggle">
            <label>View</label>
            <div className="cashflow-segmented">
              {["daily", "weekly", "monthly"].map(v => (
                <button
                  key={v}
                  className={viewMode === v ? "active" : ""}
                  onClick={() => setViewMode(v)}
                  type="button"
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button className="cashflow-btn cashflow-btn-ghost" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'cashflow-spin' : ''} />
          </button>
        </div>
      </header>

      {/* ===== SUMMARY CARDS (Only 3 cards) ===== */}
      <section className="cashflow-summary">
        <div className="cashflow-summary-card cashflow-in">
          <span className="cashflow-summary-label">Total Inflow</span>
          <span className="cashflow-summary-value">{formatMoney(totals.inflow)}</span>
        </div>
        <div className="cashflow-summary-card cashflow-out">
          <span className="cashflow-summary-label">Total Outflow</span>
          <span className="cashflow-summary-value">{formatMoney(totals.outflow)}</span>
        </div>
        <div className="cashflow-summary-card cashflow-net">
          <span className="cashflow-summary-label">Net Balance</span>
          <span className="cashflow-summary-value" style={{ color: totals.net >= 0 ? '#2f6f4e' : '#a3392f' }}>
            {formatMoney(totals.net)}
          </span>
        </div>
      </section>

      {/* ============================================ */}
      {/* ✅ ENTRIES LIST - CATEGORY-WISE TABLE */}
      {/* ============================================ */}
      <main className="cashflow-list">
        {loading ? (
          <div className="cashflow-empty">
            <Loader2 size={28} className="cashflow-spin" />
            <p className="cashflow-empty-title">Loading entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="cashflow-empty">
            <p className="cashflow-empty-title">No entries for this period</p>
            <p className="cashflow-empty-body">Add a cash flow entry to start the register.</p>
            {isAdmin && (
              <button className="cashflow-btn cashflow-btn-primary" onClick={openAddForm}>
                <span className="cashflow-plus">+</span> Add Entry
              </button>
            )}
          </div>
        ) : (
          <div className="cashflow-table-wrapper">
            <table className="cashflow-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Note</th>
                  <th>Inflow</th>
                  {CATEGORIES.map(cat => (
                    <th key={cat.id}>{cat.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const inTotal = sumLines(entry.inflows);

                  // Get amount for a specific category label from this entry's outflows
                  const getCategoryAmount = (label) => {
                    const line = entry.outflows.find(l => l.label === label);
                    const amt = line ? num(line.amount) : 0;
                    return amt > 0 ? formatMoney(amt) : '-';
                  };

                  return (
                    <tr key={entry.id}>
                      <td>{formatDateLabel(entry.date)}</td>
                      <td>{entry.note || '-'}</td>
                      <td className="cashflow-in-value">{inTotal > 0 ? formatMoney(inTotal) : '-'}</td>
                      {CATEGORIES.map(cat => (
                        <td key={cat.id} className="cashflow-out-value">
                          {getCategoryAmount(cat.label)}
                        </td>
                      ))}
                      <td>
                        <div className="cashflow-table-actions">
                          {isAdmin && (
                            <>
                              <button 
                                className="cashflow-btn-small cashflow-btn-edit"
                                onClick={() => openEditForm(entry)}
                                title="Edit"
                              >
                                ✎
                              </button>
                              <button 
                                className="cashflow-btn-small cashflow-btn-delete"
                                onClick={() => handleDelete(entry.id)}
                                title="Delete"
                              >
                                ×
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ============================================ */}
      {/* ✅ ADD/EDIT MODAL */}
      {/* ============================================ */}
      {showForm && (
        <div className="cashflow-overlay" onClick={closeForm}>
          <div className="cashflow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cashflow-modal-head">
              <h2>{editingId ? "Edit Entry" : "Add Entry"}</h2>
              <button className="cashflow-icon-btn" onClick={closeForm} aria-label="Close">×</button>
            </div>

            <form onSubmit={handleSubmit} className="cashflow-form">
              <div className="cashflow-form-row">
                <div className="cashflow-field">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => updateBase("date", e.target.value)}
                  />
                </div>
                <div className="cashflow-field">
                  <label>Note (optional)</label>
                  <input
                    type="text"
                    placeholder="Any remarks"
                    value={form.note}
                    onChange={(e) => updateBase("note", e.target.value)}
                  />
                </div>
              </div>

              <div className="cashflow-line-section cashflow-in">
                <div className="cashflow-line-section-head">
                  <div>
                    <h3>Inflow</h3>
                    <span className="cashflow-hint">Cash coming in</span>
                  </div>
                  <button type="button" className="cashflow-btn cashflow-btn-ghost" onClick={() => addLine("inflows")}>
                    <span className="cashflow-plus">+</span> Add field
                  </button>
                </div>

                {form.inflows.map((line) => (
                  <div className="cashflow-line-row" key={line.id}>
                    <input
                      type="text"
                      placeholder="Label"
                      value={line.label}
                      onChange={(e) => updateLine("inflows", line.id, "label", e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={line.amount}
                      onChange={(e) => updateLine("inflows", line.id, "amount", e.target.value)}
                    />
                    <button
                      type="button"
                      className="cashflow-icon-btn cashflow-remove"
                      onClick={() => removeLine("inflows", line.id)}
                      aria-label="Remove field"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="cashflow-line-section cashflow-out">
                <div className="cashflow-line-section-head">
                  <div>
                    <h3>Outflow</h3>
                    <span className="cashflow-hint">Cash going out</span>
                  </div>
                  <button type="button" className="cashflow-btn cashflow-btn-ghost" onClick={() => addLine("outflows")}>
                    <span className="cashflow-plus">+</span> Add field
                  </button>
                </div>

                {form.outflows.map((line) => (
                  <div className="cashflow-line-row" key={line.id}>
                    <input
                      type="text"
                      placeholder="Label"
                      value={line.label}
                      onChange={(e) => updateLine("outflows", line.id, "label", e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={line.amount}
                      onChange={(e) => updateLine("outflows", line.id, "amount", e.target.value)}
                    />
                    <button
                      type="button"
                      className="cashflow-icon-btn cashflow-remove"
                      onClick={() => removeLine("outflows", line.id)}
                      aria-label="Remove field"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="cashflow-form-actions">
                <button type="button" className="cashflow-btn" onClick={closeForm} disabled={saving}>Cancel</button>
                <button type="submit" className="cashflow-btn cashflow-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : (editingId ? "Save changes" : "Save entry")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;