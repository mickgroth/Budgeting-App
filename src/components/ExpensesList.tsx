import React, { useState } from 'react';
import { Expense, BudgetCategory } from '../types/budget';
import { formatCurrency } from '../utils/budgetHelpers';

interface ExpensesListProps {
  expenses: Expense[];
  categories: BudgetCategory[];
  onUpdateExpense: (expenseId: string, updates: Partial<Omit<Expense, 'id'>>) => void;
  onDeleteExpense: (expenseId: string) => void;
}

/**
 * Component displaying a list of all expenses with category filtering
 */
export const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  categories,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [viewingReceipt, setViewingReceipt] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.color || '#6B7280';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditDescription(expense.description);
    setEditCategoryId(expense.categoryId);
    setEditIsRecurring(expense.isRecurring || false);
  };

  const handleSaveEdit = () => {
    if (!editingExpense) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (!editDescription.trim()) {
      alert('Please enter a description');
      return;
    }

    onUpdateExpense(editingExpense.id, {
      amount,
      description: editDescription.trim(),
      categoryId: editCategoryId,
      isRecurring: editIsRecurring,
    });

    setEditingExpense(null);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  const handleDelete = (expenseId: string, description: string) => {
    if (window.confirm(`Delete expense "${description}"?`)) {
      onDeleteExpense(expenseId);
    }
  };

  // Filter expenses by selected category
  const filteredExpenses = selectedCategoryFilter === 'all'
    ? expenses
    : expenses.filter((expense) => expense.categoryId === selectedCategoryFilter);

  // Sort expenses by date (most recent first)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate total for filtered expenses
  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (expenses.length === 0) {
    return (
      <div className="expenses-list-empty">
        <p>No expenses logged yet. Add your first expense to get started!</p>
      </div>
    );
  }

  return (
    <div className="expenses-list">
      <div className="expenses-header">
        <h3>Recent Expenses ({filteredExpenses.length})</h3>
        {filteredExpenses.length > 0 && (
          <div className="expenses-total">
            Total: {formatCurrency(totalFilteredAmount)}
          </div>
        )}
      </div>

      <div className="expenses-filter">
        <label htmlFor="category-filter">Filter by category:</label>
        <select
          id="category-filter"
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories ({expenses.length})</option>
          {categories.map((category) => {
            const count = expenses.filter((exp) => exp.categoryId === category.id).length;
            return (
              <option key={category.id} value={category.id}>
                {category.name} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {sortedExpenses.length === 0 ? (
        <div className="expenses-list-empty">
          <p>No expenses in this category.</p>
        </div>
      ) : (
        <div className="expenses-table">
          {sortedExpenses.map((expense) => {
            const isEditing = editingExpense?.id === expense.id;

            if (isEditing) {
              // Edit mode
              return (
                <div
                  key={expense.id}
                  className="expense-row-archive expense-row-editing"
                  style={{ borderLeftColor: getCategoryColor(expense.categoryId) }}
                >
                  <div className="expense-edit-form">
                    <div className="edit-row">
                      <div className="edit-field">
                        <label>Amount</label>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          step="0.01"
                          min="0"
                          className="edit-input"
                        />
                      </div>
                      <div className="edit-field">
                        <label>Category</label>
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="edit-select"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="edit-row">
                      <div className="edit-field edit-field-full">
                        <label>Description</label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="edit-input"
                        />
                      </div>
                    </div>
                    <div className="edit-row">
                      <div className="edit-field edit-field-full">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editIsRecurring}
                            onChange={(e) => setEditIsRecurring(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>Recurring expense</span>
                        </label>
                        <small style={{ display: 'block', marginTop: '0.25rem', color: '#6B7280', fontSize: '0.85rem' }}>
                          Will be automatically added to new months
                        </small>
                      </div>
                    </div>
                    <div className="edit-actions">
                      <button className="btn-save-edit" onClick={handleSaveEdit}>
                        ✓ Save
                      </button>
                      <button className="btn-cancel-edit" onClick={handleCancelEdit}>
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // View mode
            return (
              <div
                key={expense.id}
                className="expense-row-archive"
                style={{ borderLeftColor: getCategoryColor(expense.categoryId) }}
              >
                <div className="expense-main">
                  <div className="expense-info">
                    <div className="expense-description">
                      {expense.description}
                      {expense.isRecurring && (
                        <span className="recurring-indicator" title="Recurring expense">
                          🔄
                        </span>
                      )}
                      {expense.receiptImage && (
                        <button
                          className="receipt-indicator-btn"
                          title="View receipt"
                          onClick={() => setViewingReceipt(expense)}
                        >
                          📄
                        </button>
                      )}
                    </div>
                    <div className="expense-meta">
                      <span
                        className="expense-category"
                        style={{ color: getCategoryColor(expense.categoryId) }}
                      >
                        {getCategoryName(expense.categoryId)}
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
                <div className="expense-actions">
                  <button
                    className="btn-edit-expense"
                    onClick={() => handleEdit(expense)}
                    title="Edit expense"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete-expense"
                    onClick={() => handleDelete(expense.id, expense.description)}
                    title="Delete expense"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div className="receipt-modal-overlay" onClick={() => setViewingReceipt(null)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <h3>Receipt: {viewingReceipt.description}</h3>
              <button
                className="btn-close-modal"
                onClick={() => setViewingReceipt(null)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="receipt-modal-body">
              <img
                src={viewingReceipt.receiptImage}
                alt={`Receipt for ${viewingReceipt.description}`}
                className="receipt-image-large"
              />
              <div className="receipt-details">
                <div className="receipt-detail-row">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{getCategoryName(viewingReceipt.categoryId)}</span>
                </div>
                <div className="receipt-detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">{formatCurrency(viewingReceipt.amount)}</span>
                </div>
                <div className="receipt-detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(viewingReceipt.date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

