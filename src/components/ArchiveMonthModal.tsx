import React, { useState } from 'react';

interface ArchiveMonthModalProps {
  expenseCount: number;
  onConfirm: (month: string) => void;
  onCancel: () => void;
}

/**
 * Modal for selecting month to archive expenses
 */
export const ArchiveMonthModal: React.FC<ArchiveMonthModalProps> = ({
  expenseCount,
  onConfirm,
  onCancel,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleConfirm = () => {
    const month = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
    onConfirm(month);
  };

  const selectedMonthName = monthNames[selectedMonth - 1];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="archive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📦 Archive Expenses</h2>
          <button className="modal-close" onClick={onCancel} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Select the month to archive your <strong>{expenseCount} expenses</strong>:
          </p>

          <div className="month-year-selectors">
            <div className="selector-group">
              <label htmlFor="archive-month">Month:</label>
              <select
                id="archive-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="month-dropdown"
              >
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-group">
              <label htmlFor="archive-year">Year:</label>
              <select
                id="archive-year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="year-dropdown"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="archive-preview">
            <strong>Archiving to:</strong> {selectedMonthName} {selectedYear}
          </div>

          <div className="archive-info">
            <p><strong>This will:</strong></p>
            <ul>
              <li>✓ Save all current expenses to history</li>
              <li>✓ Save category spending snapshots</li>
              <li>✓ Clear current expenses list</li>
              <li>✓ Reset category spending to $0</li>
            </ul>
            <p className="info-note">
              💡 If {selectedMonthName} {selectedYear} already has archived expenses, 
              they will be combined together.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={handleConfirm}>
            Archive {selectedMonthName} {selectedYear}
          </button>
        </div>
      </div>
    </div>
  );
};

