// src/utils/exportUtils.js
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ✅ columns = [{ header: 'Customer', key: 'customerName' }, ...]
// ✅ data = array of plain objects (already flattened — no nested React elements)

export const exportToExcel = (data, columns, filename = 'export') => {
  const rows = data.map(row =>
    columns.reduce((acc, col) => {
      acc[col.header] = row[col.key] ?? '';
      return acc;
    }, {})
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (data, columns, filename = 'export', title = 'Report') => {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString('en-PK')}`, 14, 21);

  const head = [columns.map(col => col.header)];
  const body = data.map(row => columns.map(col => String(row[col.key] ?? '')));

  autoTable(doc, {
    head,
    body,
    startY: 26,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 27, 75], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  });

  doc.save(`${filename}.pdf`);
};