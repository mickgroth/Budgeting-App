import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface ImportBudgetExcelProps {
  onImport: (categories: Array<{ name: string; allocated: number }>) => void;
}

/**
 * Component for importing budget categories from Excel files
 * Expected Excel format:
 * Column A: Category Name
 * Column B: Allocated Amount
 */
export const ImportBudgetExcel: React.FC<ImportBudgetExcelProps> = ({ onImport }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pastedData, setPastedData] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCategoriesFromData = (data: any[][]): Array<{ name: string; allocated: number }> => {
    const categories: Array<{ name: string; allocated: number }> = [];
    let startRow = 0;

    // Check if first row is header
    const firstRow = data[0];
    if (firstRow && 
        typeof firstRow[0] === 'string' && 
        (firstRow[0].toLowerCase().includes('category') || 
         firstRow[0].toLowerCase().includes('name'))) {
      startRow = 1; // Skip header
    }

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      
      if (!row || row.length < 2) continue;

      const categoryName = row[0];
      const allocatedAmount = row[1];

      // Validate row data
      if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
        continue; // Skip empty rows
      }

      const allocated = parseFloat(allocatedAmount);
      if (isNaN(allocated) || allocated < 0) {
        throw new Error(`Invalid amount for category "${categoryName}". Please ensure all amounts are valid numbers.`);
      }

      categories.push({
        name: categoryName.trim(),
        allocated: allocated,
      });
    }

    if (categories.length === 0) {
      throw new Error('No valid categories found. Please check the format.');
    }

    return categories;
  };

  const handlePasteImport = () => {
    if (!pastedData.trim()) {
      setError('Please paste some data first');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      // Parse pasted data (tab-separated or comma-separated)
      const lines = pastedData.trim().split('\n');
      const data: any[][] = lines.map(line => {
        // Try tab-separated first (Google Sheets default)
        if (line.includes('\t')) {
          return line.split('\t').map(cell => cell.trim());
        }
        // Fall back to comma-separated
        return line.split(',').map(cell => cell.trim());
      });

      const categories = parseCategoriesFromData(data);
      
      // Call the import callback
      onImport(categories);
      setSuccess(`Successfully imported ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}!`);
      setPastedData('');
      setShowPasteArea(false);

    } catch (err) {
      console.error('Paste parsing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse pasted data.';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];
    
    if (!validTypes.includes(file.type) && 
        !file.name.endsWith('.xlsx') && 
        !file.name.endsWith('.xls') && 
        !file.name.endsWith('.csv')) {
      setError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length === 0) {
        setError('The Excel file is empty');
        setIsUploading(false);
        return;
      }

      // Parse categories
      const categories = parseCategoriesFromData(jsonData);

      // Call the import callback
      onImport(categories);
      setSuccess(`Successfully imported ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}!`);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Excel parsing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse Excel file. Please check the file format and try again.';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="import-excel-section">
      <h3>📊 Import Categories from Excel or Google Sheets</h3>
      <p className="import-description">
        Upload an Excel file or paste data from Google Sheets to automatically create budget categories.
        <br />
        <small>
          <strong>Format:</strong> Column A = Category Name, Column B = Allocated Amount
        </small>
      </p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="import-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={isUploading}
          style={{ display: 'none' }}
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className={`btn-upload-excel ${isUploading ? 'disabled' : ''}`}>
          {isUploading ? '⏳ Processing...' : '📁 Choose Excel File'}
        </label>
        
        <span className="import-separator">or</span>
        
        <button
          className="btn-paste-sheets"
          onClick={() => setShowPasteArea(!showPasteArea)}
          disabled={isUploading}
        >
          📋 Paste from Google Sheets
        </button>
      </div>

      {showPasteArea && (
        <div className="paste-area-container">
          <p className="paste-instructions">
            <strong>How to copy from Google Sheets:</strong>
            <br />
            1. Select cells in Google Sheets (including headers if any)
            <br />
            2. Copy (Ctrl+C or Cmd+C)
            <br />
            3. Paste below (Ctrl+V or Cmd+V)
          </p>
          <textarea
            className="paste-textarea"
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder="Paste your Google Sheets data here...&#10;&#10;Example:&#10;Category Name    Allocated Amount&#10;Groceries        500&#10;Transportation   300&#10;Entertainment    150"
            rows={8}
          />
          <div className="paste-actions">
            <button
              className="btn-import-paste"
              onClick={handlePasteImport}
              disabled={isUploading || !pastedData.trim()}
            >
              Import Data
            </button>
            <button
              className="btn-cancel-paste"
              onClick={() => {
                setShowPasteArea(false);
                setPastedData('');
                setError('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="import-example">
        <details>
          <summary>📝 Example Format (Excel/Google Sheets)</summary>
          <table className="example-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Allocated Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Groceries</td>
                <td>500</td>
              </tr>
              <tr>
                <td>Transportation</td>
                <td>300</td>
              </tr>
              <tr>
                <td>Entertainment</td>
                <td>150</td>
              </tr>
              <tr>
                <td>Utilities</td>
                <td>200</td>
              </tr>
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
};

