import React, { useState } from 'react';
import { BudgetCategory } from '../types/budget';
import { formatCurrency, getCategorySpentPercentage, capitalizeWords } from '../utils/budgetHelpers';

interface CategoryCardProps {
  category: BudgetCategory;
  onUpdate: (id: string, updates: Partial<Omit<BudgetCategory, 'id'>>) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Component displaying an individual budget category with editing capabilities
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onUpdate,
  onDelete,
  onReorder,
  isFirst,
  isLast,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editAllocated, setEditAllocated] = useState(category.allocated.toString());

  const spentPercentage = getCategorySpentPercentage(category);
  const isOverBudget = category.spent > category.allocated;

  const handleSave = () => {
    const allocated = parseFloat(editAllocated) || 0;

    if (editName.trim()) {
      onUpdate(category.id, {
        name: editName.trim(),
        allocated: Math.max(0, allocated),
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(category.name);
    setEditAllocated(category.allocated.toString());
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      onDelete(category.id);
    }
  };

  if (isEditing) {
    return (
      <div className="category-card editing" style={{ borderLeftColor: category.color }}>
        <div className="category-form">
          <div className="form-group">
            <label>Category Name:</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Category name"
            />
          </div>

          <div className="form-group">
            <label>Allocated:</label>
            <input
              type="number"
              value={editAllocated}
              onChange={(e) => setEditAllocated(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-note">
            Note: Spent amount is automatically calculated from logged expenses.
          </div>

          <div className="form-actions">
            <button className="btn-save" onClick={handleSave}>
              Save
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-card" style={{ borderLeftColor: category.color }}>
      <div className="category-header">
        <h3 className="category-name">{capitalizeWords(category.name)}</h3>
        <div className="category-actions">
          <button
            className="btn-icon"
            onClick={() => onReorder(category.id, 'up')}
            disabled={isFirst}
            title="Move up"
            style={{ opacity: isFirst ? 0.3 : 1, cursor: isFirst ? 'not-allowed' : 'pointer' }}
          >
            ⬆️
          </button>
          <button
            className="btn-icon"
            onClick={() => onReorder(category.id, 'down')}
            disabled={isLast}
            title="Move down"
            style={{ opacity: isLast ? 0.3 : 1, cursor: isLast ? 'not-allowed' : 'pointer' }}
          >
            ⬇️
          </button>
          <button
            className="btn-icon"
            onClick={() => setIsEditing(true)}
            title="Edit category"
          >
            ✏️
          </button>
          <button
            className="btn-icon"
            onClick={handleDelete}
            title="Delete category"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="category-amounts">
        <div className="amount-row">
          <span className="amount-label">Allocated:</span>
          <span className="amount-value">{formatCurrency(category.allocated)}</span>
        </div>
        <div className="amount-row">
          <span className="amount-label">Spent:</span>
          <span className={`amount-value ${isOverBudget ? 'over-budget' : ''}`}>
            {formatCurrency(category.spent)}
          </span>
        </div>
        <div className="amount-row">
          <span className="amount-label">Remaining:</span>
          <span className={`amount-value ${isOverBudget ? 'negative' : 'positive'}`}>
            {formatCurrency(category.allocated - category.spent)}
          </span>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className={`progress-fill ${isOverBudget ? 'over-budget' : ''}`}
          style={{
            width: `${Math.min(spentPercentage, 100)}%`,
            backgroundColor: category.color,
          }}
        />
      </div>
      <div className="progress-text">
        {spentPercentage.toFixed(1)}% spent
      </div>

      {isOverBudget && (
        <div className="over-budget-warning">
          ⚠️ Over budget by {formatCurrency(category.spent - category.allocated)}
        </div>
      )}
    </div>
  );
};

