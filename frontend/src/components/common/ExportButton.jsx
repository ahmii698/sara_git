// src/components/common/ExportButton.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

// Usage: <ExportButton data={flatData} columns={columns} filename="aging-report" title="Aging Report" />
const ExportButton = ({ data, columns, filename = 'export', title = 'Report' }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (type) => {
    if (!data || data.length === 0) {
      alert('No data available to export.');
      setOpen(false);
      return;
    }
    if (type === 'excel') {
      exportToExcel(data, columns, filename);
    } else {
      exportToPDF(data, columns, filename, title);
    }
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '0.6rem 1.25rem',
          borderRadius: '0.75rem',
          background: '#1E1B4B',
          color: 'white',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem'
        }}
      >
        <Download size={18} />
        Export Report
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          zIndex: 50,
          minWidth: '180px'
        }}>
          <button
            onClick={() => handleExport('pdf')}
            style={{
              width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'white',
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', color: '#1f2937', textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <FileText size={16} color="#dc2626" />
            Export as PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            style={{
              width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'white',
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', color: '#1f2937', textAlign: 'left',
              borderTop: '1px solid #f3f4f6'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <FileSpreadsheet size={16} color="#16a34a" />
            Export as Excel
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;