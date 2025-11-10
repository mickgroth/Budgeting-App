import React, { useState, useRef, useEffect } from 'react';
import { Budget } from '../types/budget';
import {
  formatCurrency,
  getTotalAllocated,
  getTotalSpent,
  getRemainingBudget,
  getAllocatedPercentage,
} from '../utils/budgetHelpers';

interface BudgetSummaryProps {
  budget: Budget;
  onTotalBudgetChange: (amount: number) => void;
  currentMonthSavingsGoal?: number;
}

/**
 * Component displaying overall budget summary and statistics
 */
export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  budget,
  onTotalBudgetChange,
  currentMonthSavingsGoal = 0,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetValue, setEditBudgetValue] = useState(budget.totalBudget.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const categoryAllocated = getTotalAllocated(budget.categories);
  const totalAllocated = categoryAllocated + currentMonthSavingsGoal; // Include savings in allocation
  const totalSpent = getTotalSpent(budget.categories);
  const allocatedPercentage = budget.totalBudget > 0 
    ? (totalAllocated / budget.totalBudget) * 100 
    : 0;
  
  // Available to Spend = Budget - Spent - Savings Set Aside
  const availableToSpend = budget.totalBudget - totalSpent - currentMonthSavingsGoal;
  const availablePercentage = budget.totalBudget > 0 
    ? (availableToSpend / budget.totalBudget) * 100 
    : 0;
  
  // Calculate percentages for spent
  const spentPercentage = budget.totalBudget > 0 
    ? (totalSpent / budget.totalBudget) * 100 
    : 0;

  // Get current month name
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingBudget && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingBudget]);

  const handleDoubleClick = () => {
    setIsEditingBudget(true);
    setEditBudgetValue(budget.totalBudget.toString());
  };

  const handleBudgetSave = () => {
    const value = parseFloat(editBudgetValue) || 0;
    onTotalBudgetChange(Math.max(0, value));
    setIsEditingBudget(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBudgetSave();
    } else if (e.key === 'Escape') {
      setIsEditingBudget(false);
      setEditBudgetValue(budget.totalBudget.toString());
    }
  };

  return (
    <div className="budget-summary">
      <h1>Budget Tracker</h1>

      {/* Monthly Budget Progress Bar */}
      {budget.totalBudget > 0 && (
        <div className="overall-progress-section">
            <div className="overall-progress-header">
              <span className="overall-progress-label">
                {currentMonth} Budget Consumption
              </span>
              <span className="overall-progress-amounts">
                {formatCurrency(totalSpent)} of {formatCurrency(currentMonthSavingsGoal > 0 ? (budget.totalBudget - currentMonthSavingsGoal) : budget.totalBudget)} spent
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
        <div 
          className={`stat-card editable ${isEditingBudget ? 'editing' : ''}`}
          onDoubleClick={handleDoubleClick}
          title="Double-click to edit"
        >
          <div className="stat-label-wrapper">
            <div className="stat-label">Monthly Budget</div>
            {!isEditingBudget && <span className="edit-hint">✏️ Double-click to edit</span>}
          </div>
          {isEditingBudget ? (
            <input
              ref={inputRef}
              type="number"
              className="stat-value-input"
              value={editBudgetValue}
              onChange={(e) => setEditBudgetValue(e.target.value)}
              onBlur={handleBudgetSave}
              onKeyDown={handleKeyDown}
              min="0"
              step="0.01"
            />
          ) : (
            <div className="stat-value">{formatCurrency(budget.totalBudget)}</div>
          )}
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
            <div className="stat-percentage">{budget.totalBudget > 0 ? ((currentMonthSavingsGoal / budget.totalBudget) * 100).toFixed(1) : 0}% of budget</div>
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

