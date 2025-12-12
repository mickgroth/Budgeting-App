import React, { useState, useRef, useEffect } from 'react';
import { Budget } from '../types/budget';
import {
  formatCurrency,
  getTotalAllocated,
  getTotalSpent,
  getRemainingBudget,
  getAllocatedPercentage,
  getCalculatedTotalBudget,
} from '../utils/budgetHelpers';

interface BudgetSummaryProps {
  budget: Budget;
  onTotalBudgetChange: (amount: number) => void;
  onSalaryIncomeChange: (amount: number) => void;
  onAddIncome: () => void;
  currentMonthSavingsGoal?: number;
}

/**
 * Component displaying overall budget summary and statistics
 */
export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  budget,
  onTotalBudgetChange,
  onSalaryIncomeChange,
  onAddIncome,
  currentMonthSavingsGoal = 0,
}) => {
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [editSalaryValue, setEditSalaryValue] = useState(budget.salaryIncome.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate total budget (salary + additional income)
  const totalBudget = getCalculatedTotalBudget(budget);
  const totalAdditionalIncome = budget.additionalIncome.reduce((sum, inc) => sum + inc.amount, 0);

  const categoryAllocated = getTotalAllocated(budget.categories);
  const totalAllocated = categoryAllocated + currentMonthSavingsGoal; // Include savings in allocation
  const totalSpent = getTotalSpent(budget.categories);
  const allocatedPercentage = totalBudget > 0 
    ? (totalAllocated / totalBudget) * 100 
    : 0;
  
  // Available to Spend = Budget - Spent - Savings Set Aside
  const availableToSpend = totalBudget - totalSpent - currentMonthSavingsGoal;
  const availablePercentage = totalBudget > 0 
    ? (availableToSpend / totalBudget) * 100 
    : 0;
  
  // Calculate percentages for spent
  const spentPercentage = totalBudget > 0 
    ? (totalSpent / totalBudget) * 100 
    : 0;

  // Get current month name
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingSalary && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingSalary]);

  const handleDoubleClick = () => {
    setIsEditingSalary(true);
    setEditSalaryValue(budget.salaryIncome.toString());
  };

  const handleSalarySave = () => {
    const value = parseFloat(editSalaryValue) || 0;
    onSalaryIncomeChange(Math.max(0, value));
    setIsEditingSalary(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSalarySave();
    } else if (e.key === 'Escape') {
      setIsEditingSalary(false);
      setEditSalaryValue(budget.salaryIncome.toString());
    }
  };

  return (
    <div className="budget-summary">
      <h1>Budget Tracker</h1>

      {/* Monthly Budget Progress Bar */}
      {totalBudget > 0 && (
        <div className="overall-progress-section">
            <div className="overall-progress-header">
              <span className="overall-progress-label">
                {currentMonth} Budget Consumption
              </span>
              <span className="overall-progress-amounts">
                {formatCurrency(totalSpent)} of {formatCurrency(currentMonthSavingsGoal > 0 ? (totalBudget - currentMonthSavingsGoal) : totalBudget)} spent
                <strong className={spentPercentage > 100 ? 'over-budget' : ''}>
                  {' '}({spentPercentage.toFixed(1)}%)
                </strong>
              </span>
            </div>
            <div className="overall-progress-bar">
              <div
                className={`overall-progress-fill ${spentPercentage >= 90 ? 'warning' : ''} ${spentPercentage >= 100 ? 'danger' : ''}`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              >
                <div className="overall-progress-shine"></div>
              </div>
            </div>
          </div>
      )}

      <div className="budget-stats">
        {/* Salary Income */}
        <div 
          className={`stat-card editable ${isEditingSalary ? 'editing' : ''}`}
          onDoubleClick={handleDoubleClick}
          title="Double-click to edit"
        >
          <div className="stat-label-wrapper">
            <div className="stat-label">💰 Salary Income</div>
            {!isEditingSalary && <span className="edit-hint">✏️ Double-click to edit</span>}
          </div>
          {isEditingSalary ? (
            <input
              ref={inputRef}
              type="number"
              className="stat-value-input"
              value={editSalaryValue}
              onChange={(e) => setEditSalaryValue(e.target.value)}
              onBlur={handleSalarySave}
              onKeyDown={handleKeyDown}
              min="0"
              step="0.01"
            />
          ) : (
            <div className="stat-value">{formatCurrency(budget.salaryIncome)}</div>
          )}
          <div className="stat-note" style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
            Fixed monthly salary
          </div>
        </div>

        {/* Additional Income */}
        <div className="stat-card income-stat" style={{ cursor: 'pointer' }} onClick={onAddIncome} title="Click to add income">
          <div className="stat-label-wrapper">
            <div className="stat-label">➕ Additional Income</div>
            <span className="edit-hint" style={{ fontSize: '0.75rem' }}>Click to add</span>
          </div>
          <div className="stat-value" style={{ color: '#10B981' }}>
            {formatCurrency(totalAdditionalIncome)}
          </div>
          <div className="stat-note" style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
            {budget.additionalIncome.length} entr{budget.additionalIncome.length === 1 ? 'y' : 'ies'} this month
          </div>
        </div>

        {/* Total Budget */}
        <div className="stat-card" style={{ border: '2px solid #3B82F6' }}>
          <div className="stat-label">📊 Total Budget</div>
          <div className="stat-value" style={{ color: '#3B82F6', fontWeight: 'bold' }}>
            {formatCurrency(totalBudget)}
          </div>
          <div className="stat-note" style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
            Salary + Additional
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Allocated</div>
          <div className="stat-value allocated">{formatCurrency(totalAllocated)}</div>
          <div className="stat-percentage">{allocatedPercentage.toFixed(1)}% of budget</div>
        </div>

        {currentMonthSavingsGoal > 0 && (
          <div className="stat-card savings-stat">
            <div className="stat-label">Set Aside for Savings</div>
            <div className="stat-value savings-value">{formatCurrency(currentMonthSavingsGoal)}</div>
            <div className="stat-percentage">{totalBudget > 0 ? ((currentMonthSavingsGoal / totalBudget) * 100).toFixed(1) : 0}% of budget</div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value spent">{formatCurrency(totalSpent)}</div>
          <div className="stat-percentage">{spentPercentage.toFixed(1)}% of budget</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Available to Spend</div>
          <div className={`stat-value ${availableToSpend < 0 ? 'negative' : 'positive'}`}>
            {formatCurrency(availableToSpend)}
          </div>
          <div className="stat-percentage">{availablePercentage.toFixed(1)}% of budget</div>
        </div>
      </div>

      {availableToSpend < 0 && (
        <div className="warning-message">
          ⚠️ Warning: You have overspent by {formatCurrency(Math.abs(availableToSpend))}
        </div>
      )}
    </div>
  );
};

