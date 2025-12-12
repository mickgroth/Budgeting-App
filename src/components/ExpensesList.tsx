import React, { useState } from 'react';
import { Expense, Reimbursement, BudgetCategory } from '../types/budget';
import { formatCurrency } from '../utils/budgetHelpers';

interface ExpensesListProps {
  expenses: Expense[];
  reimbursements: Reimbursement[];
  categories: BudgetCategory[];
  onUpdateExpense: (expenseId: string, updates: Partial<Omit<Expense, 'id'>>) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateReimbursement: (reimbursementId: string, updates: Partial<Omit<Reimbursement, 'id'>>) => void;
  onDeleteReimbursement: (reimbursementId: string) => void;
}

type TransactionType = 'expense' | 'reimbursement';
type Transaction = (Expense | Reimbursement) & { transactionType: TransactionType };

/**
 * Component displaying a list of all expenses and reimbursements with category filtering
 */
export const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  reimbursements,
  categories,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateReimbursement,
  onDeleteReimbursement,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all'); // 'all', 'expenses', 'reimbursements'
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date'); // Sort by date or category
  const [viewingReceipt, setViewingReceipt] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    setEditCategoryId(transaction.categoryId);
    setEditIsRecurring('isRecurring' in transaction ? transaction.isRecurring || false : false);
  };

  const handleSaveEdit = () => {
    if (!editingTransaction) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (!editDescription.trim()) {
      alert('Please enter a description');
      return;
    }

    if (editingTransaction.transactionType === 'expense') {
      onUpdateExpense(editingTransaction.id, {
        amount,
        description: editDescription.trim(),
        categoryId: editCategoryId,
        isRecurring: editIsRecurring,
      });
    } else {
      onUpdateReimbursement(editingTransaction.id, {
        amount,
        description: editDescription.trim(),
        categoryId: editCategoryId,
      });
    }

    setEditingTransaction(null);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleDelete = (transaction: Transaction) => {
    const itemType = transaction.transactionType === 'expense' ? 'expense' : 'reimbursement';
    if (window.confirm(`Delete ${itemType} "${transaction.description}"?`)) {
      if (transaction.transactionType === 'expense') {
        onDeleteExpense(transaction.id);
      } else {
        onDeleteReimbursement(transaction.id);
      }
    }
  };

  // Combine expenses and reimbursements into transactions
  const allTransactions: Transaction[] = [
    ...expenses.map(exp => ({ ...exp, transactionType: 'expense' as TransactionType })),
    ...reimbursements.map(reimb => ({ ...reimb, transactionType: 'reimbursement' as TransactionType }))
  ];

  // Filter by type (expenses, reimbursements, or all)
  let filteredByType = allTransactions;
  if (selectedTypeFilter === 'expenses') {
    filteredByType = allTransactions.filter(t => t.transactionType === 'expense');
  } else if (selectedTypeFilter === 'reimbursements') {
    filteredByType = allTransactions.filter(t => t.transactionType === 'reimbursement');
  }

  // Filter by selected category
  const filteredTransactions = selectedCategoryFilter === 'all'
    ? filteredByType
    : filteredByType.filter((transaction) => transaction.categoryId === selectedCategoryFilter);

  // Sort transactions by selected method
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'category') {
      // Sort by category name, then by date within category
      const catA = categories.find(c => c.id === a.categoryId);
      const catB = categories.find(c => c.id === b.categoryId);
      const nameA = catA?.name || '';
      const nameB = catB?.name || '';
      
      if (nameA !== nameB) {
        return nameA.localeCompare(nameB);
      }
      // Within same category, sort by date (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else {
      // Sort by date (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  // Calculate net total for filtered transactions (expenses - reimbursements)
  const expensesTotal = filteredTransactions
    .filter(t => t.transactionType === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const reimbursementsTotal = filteredTransactions
    .filter(t => t.transactionType === 'reimbursement')
    .reduce((sum, t) => sum + t.amount, 0);
  const netTotal = expensesTotal - reimbursementsTotal;

  if (allTransactions.length === 0) {
    return (
      <div className="expenses-list-empty">
        <p>No expenses or reimbursements logged yet. Add your first transaction to get started!</p>
      </div>
    );
  }

  return (
    <div className="expenses-list">
      <div className="expenses-header">
        <h3>Recent Transactions ({filteredTransactions.length})</h3>
        {filteredTransactions.length > 0 && (
          <div className="expenses-total">
            <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '4px' }}>
              Expenses: {formatCurrency(expensesTotal)} | Reimbursements: -{formatCurrency(reimbursementsTotal)}
            </div>
            <div style={{ fontWeight: 600 }}>
              Net: {formatCurrency(netTotal)}
            </div>
          </div>
        )}
      </div>

      <div className="expenses-filter" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label htmlFor="type-filter">Filter by type:</label>
          <select
            id="type-filter"
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Transactions ({allTransactions.length})</option>
            <option value="expenses">Expenses Only ({expenses.length})</option>
            <option value="reimbursements">Reimbursements Only ({reimbursements.length})</option>
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label htmlFor="category-filter">Filter by category:</label>
          <select
            id="category-filter"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories ({allTransactions.length})</option>
            {[...categories]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((category) => {
                const count = allTransactions.filter((t) => t.categoryId === category.id).length;
                return (
                  <option key={category.id} value={category.id}>
                    {category.name} ({count})
                  </option>
                );
              })}
          </select>
        </div>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label htmlFor="sort-by">Sort by:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'category')}
            className="filter-select"
          >
            <option value="date">Date & Time (Newest First)</option>
            <option value="category">Category (A-Z)</option>
          </select>
        </div>
      </div>

      {sortedTransactions.length === 0 ? (
        <div className="expenses-list-empty">
          <p>No transactions match the selected filters.</p>
        </div>
      ) : (
        <div className="expenses-table">
          {sortedTransactions.map((transaction) => {
            const isEditing = editingTransaction?.id === transaction.id;
            const isReimbursement = transaction.transactionType === 'reimbursement';

            if (isEditing) {
              // Edit mode
              return (
                <div
                  key={transaction.id}
                  className="expense-row-archive expense-row-editing"
                  style={{ borderLeftColor: getCategoryColor(transaction.categoryId) }}
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
                          {[...categories]
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((cat) => (
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
                    {transaction.transactionType === 'expense' && (
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
                    )}
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
                key={transaction.id}
                className="expense-row-archive"
                style={{ 
                  borderLeftColor: getCategoryColor(transaction.categoryId),
                  ...(isReimbursement ? { background: '#F0FDF4' } : {})
                }}
              >
                <div className="expense-main">
                  <div className="expense-info">
                    <div className="expense-description">
                      {isReimbursement && (
                        <span className="reimbursement-indicator" title="Reimbursement (reduces spending)" style={{ 
                          marginRight: '6px', 
                          fontSize: '1rem',
                          color: '#10B981'
                        }}>
                          💰
                        </span>
                      )}
                      {transaction.description}
                      {'isRecurring' in transaction && transaction.isRecurring && (
                        <span className="recurring-indicator" title="Recurring expense">
                          🔄
                        </span>
                      )}
                      {transaction.receiptImage && (
                        <button
                          className="receipt-indicator-btn"
                          title="View receipt"
                          onClick={() => setViewingReceipt(transaction)}
                        >
                          📄
                        </button>
                      )}
                    </div>
                    <div className="expense-meta">
                      <span
                        className="expense-category"
                        style={{ color: getCategoryColor(transaction.categoryId) }}
                      >
                        {getCategoryName(transaction.categoryId)}
                      </span>
                      <span className="expense-date">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="expense-amount" style={isReimbursement ? { color: '#10B981' } : {}}>
                    {isReimbursement ? '-' : ''}{formatCurrency(transaction.amount)}
                  </div>
                </div>
                <div className="expense-actions">
                  <button
                    className="btn-edit-expense"
                    onClick={() => handleEdit(transaction)}
                    title={`Edit ${isReimbursement ? 'reimbursement' : 'expense'}`}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete-expense"
                    onClick={() => handleDelete(transaction)}
                    title={`Delete ${isReimbursement ? 'reimbursement' : 'expense'}`}
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

