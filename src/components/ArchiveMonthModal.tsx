import React, { useState, useEffect } from 'react';
import { MonthlyArchive } from '../types/budget';
import { formatCurrency } from '../utils/budgetHelpers';

interface ArchiveMonthModalProps {
  expenseCount: number;
  currentBudget: number;
  existingArchives: MonthlyArchive[];
  onConfirm: (month: string, updateBudget: boolean) => void;
  onCancel: () => void;
}

/**
 * Modal for selecting month to archive expenses
 */
export const ArchiveMonthModal: React.FC<ArchiveMonthModalProps> = ({
  expenseCount,
  currentBudget,
  existingArchives,
  onConfirm,
  onCancel,
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [updateBudget, setUpdateBudget] = useState(true); // Default to updating budget

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedMonthName = monthNames[selectedMonth - 1];
  const selectedMonthKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;

  // Check if this month already exists in archives
  const existingArchive = existingArchives.find(archive => archive.month === selectedMonthKey);
  const hasExistingArchive = !!existingArchive;
  const existingBudget = existingArchive?.totalBudget;
  const budgetChanged = hasExistingArchive && existingBudget !== currentBudget;

  // Reset updateBudget to true when month/year changes
  useEffect(() => {
    setUpdateBudget(true);
  }, [selectedMonth, selectedYear]);

  const handleConfirm = () => {
    onConfirm(selectedMonthKey, updateBudget);
  };

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
            
            {hasExistingArchive && (
              <div className="existing-archive-warning">
                <p className="warning-header">⚠️ {selectedMonthName} {selectedYear} already has archived expenses!</p>
                <p className="warning-subtext">New expenses will be merged with existing ones.</p>
              </div>
            )}

            {budgetChanged && (
              <div className="budget-conflict-section">
                <p className="conflict-header">💰 Budget Difference Detected:</p>
                <div className="budget-comparison">
                  <div className="budget-item">
                    <span className="budget-label">Existing Budget:</span>
                    <span className="budget-value old">{formatCurrency(existingBudget!)}</span>
                  </div>
                  <div className="budget-item">
                    <span className="budget-label">Current Budget:</span>
                    <span className="budget-value new">{formatCurrency(currentBudget)}</span>
                  </div>
                </div>
                
                <div className="budget-choice">
                  <p className="choice-question"><strong>Which budget should be saved?</strong></p>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="budget-choice"
                      checked={updateBudget}
                      onChange={() => setUpdateBudget(true)}
                    />
                    <span className="radio-label">
                      <strong>Update to current budget</strong> ({formatCurrency(currentBudget)})
                      <small>Use this if your income changed during {selectedMonthName}</small>
                    </span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="budget-choice"
                      checked={!updateBudget}
                      onChange={() => setUpdateBudget(false)}
                    />
                    <span className="radio-label">
                      <strong>Keep existing budget</strong> ({formatCurrency(existingBudget!)})
                      <small>Use this to preserve historical accuracy</small>
                    </span>
                  </label>
                </div>
              </div>
            )}
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

