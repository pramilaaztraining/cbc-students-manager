import React from 'react';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../utils/api';

export default function BulkUploadScreen({ onUploadSuccess }) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      // data is now an array of objects matching your excel columns (e.g., first_name, last_name, etc.)
      try {
        const res = await apiFetch('/api/students/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: data })
        });

        if (res.ok) {
          alert('Excel file uploaded and students saved successfully!');
          if (onUploadSuccess) onUploadSuccess();
        } else {
          alert('Failed to import students.');
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <h3>📁 Bulk Upload Students via Excel</h3>
      <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Upload an .xlsx file with columns matching: <code>first_name</code>, <code>last_name</code>, <code>district</code>, <code>phone</code>, <code>email</code>, <code>course</code>, <code>batch</code>.
      </p>
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileUpload} 
        style={{ marginTop: '10px' }}
      />
    </div>
  );
}