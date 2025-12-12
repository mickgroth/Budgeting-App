import React, { useState } from 'react';
import { BudgetCategory } from '../types/budget';
import { formatCurrency } from '../utils/budgetHelpers';

interface AddToArchiveModalProps {
  archiveMonth: string; // Format: YYYY-MM
  categories: BudgetCategory[];
  type: 'expense' | 'reimbursement';
  onAdd: (categoryId: string, amount: number, description: string) => void;
  onCancel: () => void;
}

/**
 * Modal for adding expenses or reimbursements to archived months
 */
export const AddToArchiveModal: React.FC<AddToArchiveModalProps> = ({
  archiveMonth,
  categories,
  type,
  onAdd,
  onCancel,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');

  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);

  // Format month for display
  const formatMonthDisplay = (month: string): string => {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(monthNum) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);

    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    onAdd(selectedCategoryId, amountNum, description.trim());
  };

  return (
    <div className="modal-overlay" onClick={onCancel} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
        maxWidth: '500px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <div className="modal-header">
          <h2>Add {type === 'expense' ? 'Expense' : 'Reimbursement'} to {formatMonthDisplay(archiveMonth)}</h2>
          <button className="btn-close-modal" onClick={onCancel} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {type === 'reimbursement' && (
            <div className="info-banner" style={{ 
              background: '#F0F9FF', 
              border: '1px solid #BAE6FD', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '20px',
              color: '#0C4A6E'
            }}>
              <strong>💡 Reimbursement</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                This will reduce the spending for this category in {formatMonthDisplay(archiveMonth)}.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                required
              >
                <option value="">Select a category...</option>
                {[...categories]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>

            {selectedCategory && (
              <div className="category-info" style={{ marginBottom: '1rem' }}>
                <div className="info-item">
                  <span className="info-label">Current in {formatMonthDisplay(archiveMonth)}:</span>
                  <span className="info-value">{formatCurrency(selectedCategory.spent)}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'expense' ? 'e.g., Forgot to log dinner' : 'e.g., Friend paid me back'}
                required
              />
            </div>

            <div className="modal-actions">
              <button type="submit" className="btn-primary">
                Add {type === 'expense' ? 'Expense' : 'Reimbursement'}
              </button>
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

