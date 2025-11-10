import React, { useState } from 'react';
import { MonthlyArchive } from '../types/budget';
import { formatCurrency } from '../utils/budgetHelpers';

interface HistoricExpensesProps {
  archives: MonthlyArchive[];
  onDeleteArchive: (archiveId: string) => void;
  onBack: () => void;
}

/**
 * Component for viewing historic expense data by month
 */
export const HistoricExpenses: React.FC<HistoricExpensesProps> = ({
  archives,
  onDeleteArchive,
  onBack,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    archives.length > 0 ? archives[0].month : ''
  );

  const formatMonthDisplay = (month: string): string => {
    // month is in format YYYY-MM (e.g., "2025-10" for October 2025)
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(monthNum) - 1; // Convert 01-12 to 0-11
    return `${monthNames[monthIndex]} ${year}`;
  };

  const selectedArchive = archives.find(archive => archive.month === selectedMonth);

  const handleDeleteArchive = (archiveId: string, month: string) => {
    if (window.confirm(`Delete all data for ${formatMonthDisplay(month)}?`)) {
      onDeleteArchive(archiveId);
      // Select next available month
      const remainingArchives = archives.filter(a => a.id !== archiveId);
      if (remainingArchives.length > 0) {
        setSelectedMonth(remainingArchives[0].month);
      }
    }
  };

  if (archives.length === 0) {
    return (
      <div className="historic-expenses">
        <div className="screen-header">
          <button className="btn-back" onClick={onBack}>
            ← Back to Budget
          </button>
          <h1>Historic Expenses</h1>
        </div>
        <div className="empty-state">
          <p>📊 No archived months yet</p>
          <p>
            Use the "End of Month" button on the Budget screen to archive your current
            expenses and start fresh for a new month.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="historic-expenses">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Budget
        </button>
        <h1>Historic Expenses</h1>
      </div>

      {/* Month Selector */}
      <div className="month-selector">
        <label htmlFor="month-select">View Month:</label>
        <select
          id="month-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="month-select"
        >
          {archives.map((archive) => (
            <option key={archive.id} value={archive.month}>
              {formatMonthDisplay(archive.month)}
            </option>
          ))}
        </select>
      </div>

      {selectedArchive && (
        <div className="archive-content">
          {/* Summary Card */}
          <div className="archive-summary-card">
            <h2>{formatMonthDisplay(selectedArchive.month)}</h2>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Total Budget:</span>
                <span className="stat-value">{formatCurrency(selectedArchive.totalBudget)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Spent:</span>
                <span className={`stat-value ${selectedArchive.totalSpent > selectedArchive.totalBudget ? 'over-budget' : ''}`}>
                  {formatCurrency(selectedArchive.totalSpent)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Remaining:</span>
                <span className={`stat-value ${selectedArchive.totalBudget - selectedArchive.totalSpent < 0 ? 'negative' : 'positive'}`}>
                  {formatCurrency(selectedArchive.totalBudget - selectedArchive.totalSpent)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Expenses:</span>
                <span className="stat-value">{selectedArchive.expenses.length}</span>
              </div>
            </div>
            <button
              className="btn-delete-archive"
              onClick={() => handleDeleteArchive(selectedArchive.id, selectedArchive.month)}
              title="Delete this month's archive"
            >
              🗑️ Delete Archive
            </button>
          </div>

          {/* Category Breakdown */}
          <div className="category-breakdown">
            <h3>Category Breakdown</h3>
            <div className="categories-grid">
              {selectedArchive.categorySnapshots.map((category) => {
                const percentage = category.allocated > 0 
                  ? (category.spent / category.allocated) * 100 
                  : 0;
                const isOverBudget = category.spent > category.allocated;

                return (
                  <div key={category.id} className="category-card-archive">
                    <div className="category-header">
                      <div className="category-name-row">
                        <span
                          className="category-color-dot"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="category-name">{category.name}</span>
                      </div>
                      <div className="category-amounts">
                        <span className={`spent-amount ${isOverBudget ? 'over-budget' : ''}`}>
                          {formatCurrency(category.spent)}
                        </span>
                        <span className="allocated-amount">
                          / {formatCurrency(category.allocated)}
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${isOverBudget ? 'over-budget' : ''}`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isOverBudget ? '#EF4444' : category.color,
                        }}
                      />
                    </div>
                    {isOverBudget && (
                      <div className="over-budget-indicator">
                        ⚠️ Over by {formatCurrency(category.spent - category.allocated)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expense List */}
          <div className="expenses-section">
            <h3>All Expenses ({selectedArchive.expenses.length})</h3>
            {selectedArchive.expenses.length === 0 ? (
              <div className="empty-state">
                <p>No expenses recorded for this month</p>
              </div>
            ) : (
              <div className="expenses-table">
                {selectedArchive.expenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => {
                    const category = selectedArchive.categorySnapshots.find(
                      (cat) => cat.id === expense.categoryId
                    );
                    return (
                      <div
                        key={expense.id}
                        className="expense-row-archive"
                        style={{ borderLeftColor: category?.color || '#6B7280' }}
                      >
                        <div className="expense-main">
                          <div className="expense-info">
                            <div className="expense-description">
                              {expense.description}
                              {expense.receiptImage && (
                                <span className="receipt-indicator" title="Has receipt">
                                  📄
                                </span>
                              )}
                            </div>
                            <div className="expense-meta">
                              <span
                                className="expense-category"
                                style={{ color: category?.color || '#6B7280' }}
                              >
                                {category?.name || 'Unknown'}
                              </span>
                              <span className="expense-date">
                                {new Date(expense.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Comparison Chart */}
          <div className="comparison-section">
            <h3>Budget vs Spending</h3>
            <div className="comparison-chart">
              <div className="chart-bars">
                <div className="chart-bar budget-bar">
                  <div className="bar-label">Budget</div>
                  <div className="bar-fill budget" style={{ width: '100%' }}>
                    {formatCurrency(selectedArchive.totalBudget)}
                  </div>
                </div>
                <div className="chart-bar spent-bar">
                  <div className="bar-label">Spent</div>
                  <div
                    className={`bar-fill spent ${
                      selectedArchive.totalSpent > selectedArchive.totalBudget ? 'over' : ''
                    }`}
                    style={{
                      width: `${Math.min((selectedArchive.totalSpent / selectedArchive.totalBudget) * 100, 100)}%`,
                    }}
                  >
                    {formatCurrency(selectedArchive.totalSpent)}
                  </div>
                </div>
              </div>
              <div className="chart-summary">
                {selectedArchive.totalSpent > selectedArchive.totalBudget ? (
                  <div className="over-budget-message">
                    ⚠️ Over budget by {formatCurrency(selectedArchive.totalSpent - selectedArchive.totalBudget)}
                  </div>
                ) : (
                  <div className="under-budget-message">
                    ✅ Under budget by {formatCurrency(selectedArchive.totalBudget - selectedArchive.totalSpent)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

