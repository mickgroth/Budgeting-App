import React, { useState } from 'react';
import { MonthData, BudgetCategory, Expense, Reimbursement, AdditionalIncome } from '../types/budget';
import { CategoryCard } from './CategoryCard';
import { AddCategoryForm } from './AddCategoryForm';
import { ImportBudgetExcel } from './ImportBudgetExcel';
import { formatCurrency, getTotalAllocated, getTotalSpent } from '../utils/budgetHelpers';

interface MonthViewProps {
  monthData: MonthData;
  isCurrentMonth: boolean;
  onUpdateCategory: (categoryId: string, updates: Partial<BudgetCategory>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategory: (categoryId: string, direction: 'up' | 'down') => void;
  onAddCategory: (name: string, allocated: number, color: string) => void;
  onAddExpense: () => void;
  onAddReimbursement: () => void;
  onAddIncome: () => void;
  onViewExpensesList: () => void;
  onViewSavings?: () => void;
  onViewComparison?: () => void;
  onImportExcel?: (file: File) => void;
  currentMonthSavingsGoal?: number;
}

export const MonthView: React.FC<MonthViewProps> = ({
  monthData,
  isCurrentMonth,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategory,
  onAddCategory,
  onAddExpense,
  onAddReimbursement,
  onAddIncome,
  onViewExpensesList,
  onViewSavings,
  onViewComparison,
  onImportExcel,
  currentMonthSavingsGoal = 0,
}) => {
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Calculate totals
  const totalAdditionalIncome = monthData.additionalIncome.reduce((sum, inc) => sum + inc.amount, 0);
  const totalBudget = monthData.salaryIncome + totalAdditionalIncome;
  const categoryAllocated = getTotalAllocated(monthData.categories);
  const totalAllocated = categoryAllocated + (isCurrentMonth ? currentMonthSavingsGoal : 0);
  const totalSpent = getTotalSpent(monthData.categories);
  const availableToSpend = totalBudget - totalSpent - (isCurrentMonth ? currentMonthSavingsGoal : 0);
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const allocatedPercentage = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;

  // Format month display
  const [year, monthNum] = monthData.month.split('-');
  const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1);
  const monthName = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Sort categories by order
  const sortedCategories = [...monthData.categories].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="month-view">
      {/* Month Header */}
      <div className="month-header">
        <h2>{monthName}</h2>
        {isCurrentMonth && <span className="current-month-badge">Current Month</span>}
      </div>

      {/* Budget Summary for this month */}
      <div className="month-summary">
        <div className="month-summary-grid">
          {/* Income Cards */}
          <div className="summary-card">
            <div className="summary-label">💰 Salary Income</div>
            <div className="summary-value">{formatCurrency(monthData.salaryIncome)}</div>
          </div>

          <div className="summary-card" onClick={onAddIncome} style={{ cursor: 'pointer' }}>
            <div className="summary-label">➕ Additional Income</div>
            <div className="summary-value" style={{ color: '#10B981' }}>
              {formatCurrency(totalAdditionalIncome)}
            </div>
            <div className="summary-note">{monthData.additionalIncome.length} entries</div>
          </div>

          <div className="summary-card highlight">
            <div className="summary-label">📊 Total Budget</div>
            <div className="summary-value">{formatCurrency(totalBudget)}</div>
          </div>

          {/* Spending Cards */}
          <div className="summary-card">
            <div className="summary-label">Allocated</div>
            <div className="summary-value">{formatCurrency(totalAllocated)}</div>
            <div className="summary-percentage">{allocatedPercentage.toFixed(1)}%</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Total Spent</div>
            <div className="summary-value spent">{formatCurrency(totalSpent)}</div>
            <div className="summary-percentage">{spentPercentage.toFixed(1)}%</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Available</div>
            <div className={`summary-value ${availableToSpend < 0 ? 'negative' : 'positive'}`}>
              {formatCurrency(availableToSpend)}
            </div>
          </div>
        </div>

        {/* Budget Progress Bar */}
        {totalBudget > 0 && (
          <div className="month-progress-bar">
            <div className="progress-header">
              <span>Budget Consumption</span>
              <span>
                {formatCurrency(totalSpent)} of {formatCurrency(totalBudget)} spent ({spentPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${spentPercentage >= 90 ? 'warning' : ''} ${spentPercentage >= 100 ? 'danger' : ''}`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="month-actions">
        <button className="btn-primary" onClick={onAddExpense}>
          💳 Add Expense
        </button>
        <button className="btn-secondary" onClick={onAddReimbursement}>
          💰 Add Reimbursement
        </button>
        <button className="btn-secondary" onClick={onViewExpensesList}>
          📋 View All Transactions ({monthData.expenses.length + monthData.reimbursements.length})
        </button>
        {onViewSavings && (
          <button className="btn-secondary" onClick={onViewSavings}>
            💰 Savings Tracker
          </button>
        )}
        {onViewComparison && (
          <button className="btn-secondary" onClick={onViewComparison}>
            📊 Monthly Comparison
          </button>
        )}
      </div>

      {/* Categories Section */}
      <div className="categories-section">
        <div className="section-header">
          <h3>Expense Categories</h3>
          <button className="btn-add" onClick={() => setShowAddCategory(!showAddCategory)}>
            {showAddCategory ? '✕ Cancel' : '+ Add Category'}
          </button>
        </div>

        {showAddCategory && (
          <AddCategoryForm
            onAdd={(name, allocated, color) => {
              onAddCategory(name, allocated, color);
              setShowAddCategory(false);
            }}
            onCancel={() => setShowAddCategory(false)}
          />
        )}

        <div className="categories-grid">
          {sortedCategories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              onUpdate={(id, updates) => onUpdateCategory(id, updates)}
              onDelete={(id) => onDeleteCategory(id)}
              onReorder={(id, direction) => onReorderCategory(id, direction)}
              isFirst={index === 0}
              isLast={index === sortedCategories.length - 1}
            />
          ))}
        </div>

        {sortedCategories.length === 0 && (
          <div className="empty-state">
            <p>No categories yet. Add one to start tracking your expenses!</p>
          </div>
        )}

        {/* Import Excel - at bottom of categories */}
        {onImportExcel && (
          <div style={{ marginTop: '1.5rem' }}>
            <ImportBudgetExcel onImport={onImportExcel} />
          </div>
        )}
      </div>
    </div>
  );
};

