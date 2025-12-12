import React, { useState } from 'react';
import { MonthlyArchive, Expense, BudgetCategory } from '../types/budget';
import { formatCurrency } from '../utils/budgetHelpers';
import { CategoryCard } from './CategoryCard';
import { AddCategoryForm } from './AddCategoryForm';
import { AddToArchiveModal } from './AddToArchiveModal';

interface HistoricExpensesProps {
  archives: MonthlyArchive[];
  categories: BudgetCategory[];
  onDeleteArchive: (archiveId: string) => void;
  onUpdateArchivedExpense: (
    archiveId: string,
    expenseId: string,
    updates: Partial<Omit<Expense, 'id'>>
  ) => void;
  onDeleteArchivedExpense: (archiveId: string, expenseId: string) => void;
  onUpdateArchivedReimbursement: (
    archiveId: string,
    reimbursementId: string,
    updates: Partial<Omit<Expense, 'id'>>
  ) => void;
  onDeleteArchivedReimbursement: (archiveId: string, reimbursementId: string) => void;
  onAddExpenseToArchive: (archiveId: string, categoryId: string, amount: number, description: string) => void;
  onAddReimbursementToArchive: (archiveId: string, categoryId: string, amount: number, description: string) => void;
  onMarkExpenseAsRecurring: (archiveId: string, expenseId: string) => void;
  onUpdateCategory: (id: string, updates: Partial<Omit<BudgetCategory, 'id'>>) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategory: (id: string, direction: 'up' | 'down') => void;
  onAddCategory: (name: string, allocated: number) => void;
  onBack: () => void;
}

/**
 * Component for viewing historic expense data by month
 */
export const HistoricExpenses: React.FC<HistoricExpensesProps> = ({
  archives,
  categories,
  onDeleteArchive,
  onUpdateArchivedExpense,
  onDeleteArchivedExpense,
  onUpdateArchivedReimbursement,
  onDeleteArchivedReimbursement,
  onAddExpenseToArchive,
  onAddReimbursementToArchive,
  onMarkExpenseAsRecurring,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategory,
  onAddCategory,
  onBack,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    archives.length > 0 ? archives[0].month : ''
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all'); // 'all', 'expenses', 'reimbursements'
  const [sortBy, setSortBy] = useState<'date' | 'category'>('date'); // Sort by date or category
  const [viewingReceipt, setViewingReceipt] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingTransactionType, setEditingTransactionType] = useState<'expense' | 'reimbursement' | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [showAddModal, setShowAddModal] = useState<'expense' | 'reimbursement' | null>(null);

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

  const handleEdit = (transaction: any, transactionType: 'expense' | 'reimbursement') => {
    setEditingExpense(transaction);
    setEditingTransactionType(transactionType);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
    // If the transaction's category doesn't exist in current categories, use the first category as default
    const categoryExists = categories.some(cat => cat.id === transaction.categoryId);
    setEditCategoryId(categoryExists ? transaction.categoryId : (categories.length > 0 ? categories[0].id : ''));
    setEditIsRecurring('isRecurring' in transaction ? transaction.isRecurring || false : false);
  };

  const handleSaveEdit = () => {
    if (!editingExpense || !selectedArchive || !editingTransactionType) return;

    if (!editCategoryId) {
      alert('Please select a category');
      return;
    }

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (!editDescription.trim()) {
      alert('Please enter a description');
      return;
    }

    if (editingTransactionType === 'expense') {
      onUpdateArchivedExpense(selectedArchive.id, editingExpense.id, {
        amount,
        description: editDescription.trim(),
        categoryId: editCategoryId,
        isRecurring: editIsRecurring,
      });
    } else {
      onUpdateArchivedReimbursement(selectedArchive.id, editingExpense.id, {
        amount,
        description: editDescription.trim(),
        categoryId: editCategoryId,
      });
    }

    setEditingExpense(null);
    setEditingTransactionType(null);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setEditingTransactionType(null);
  };

  const handleDeleteExpense = (transactionId: string, description: string, isReimbursement: boolean) => {
    if (!selectedArchive) return;
    
    const itemType = isReimbursement ? 'reimbursement' : 'expense';
    if (window.confirm(`Delete ${itemType} "${description}"?`)) {
      if (isReimbursement) {
        onDeleteArchivedReimbursement(selectedArchive.id, transactionId);
      } else {
        onDeleteArchivedExpense(selectedArchive.id, transactionId);
      }
    }
  };

  const handleMarkAsRecurring = (expenseId: string, description: string) => {
    if (!selectedArchive) return;
    
    if (window.confirm(
      `Mark "${description}" as recurring?\n\n` +
      `This will:\n` +
      `• Mark this expense as recurring in ${formatMonthDisplay(selectedArchive.month)}\n` +
      `• Add this expense to all consecutive months from ${formatMonthDisplay(selectedArchive.month)} to the current month\n` +
      `• Add this expense to the current month if not already present`
    )) {
      onMarkExpenseAsRecurring(selectedArchive.id, expenseId);
    }
  };

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

      {archives.length > 1 && (
        <div className="comparison-banner">
          <p>📊 Compare spending across multiple months</p>
          <button
            className="btn-comparison"
            onClick={() => window.location.hash = 'comparison'}
          >
            View Monthly Comparison
          </button>
        </div>
      )}

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

          {/* Current Categories Section - Editable */}
          <div className="categories-section">
            <div className="section-header">
              <h3>Budget Categories</h3>
            </div>
            <div className="categories-grid">
              {[...categories]
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((category, index, sortedCategories) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onUpdate={onUpdateCategory}
                    onDelete={onDeleteCategory}
                    onReorder={onReorderCategory}
                    isFirst={index === 0}
                    isLast={index === sortedCategories.length - 1}
                  />
                ))}
            </div>
            <AddCategoryForm onAdd={onAddCategory} />
            {categories.length === 0 && (
              <div className="empty-state">
                <p>No categories yet. Add your first category to get started!</p>
              </div>
            )}
          </div>

          {/* Category Breakdown - Archived Month Snapshot */}
          <div className="category-breakdown">
            <h3>Category Breakdown for {formatMonthDisplay(selectedArchive.month)}</h3>
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
            <div className="expenses-section-header">
              <h3>Expenses & Reimbursements ({selectedArchive.expenses.length + selectedArchive.reimbursements.length})</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-add-expense"
                  onClick={() => setShowAddModal('expense')}
                  style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  + Add Expense
                </button>
                <button 
                  className="btn-add-expense"
                  onClick={() => setShowAddModal('reimbursement')}
                  style={{ background: '#10B981', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                >
                  💰 Add Reimbursement
                </button>
              </div>
            </div>

            {/* Filters and Sort */}
            <div className="expenses-filter" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label htmlFor="type-filter-historic">Filter by type:</label>
                <select
                  id="type-filter-historic"
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Transactions ({selectedArchive.expenses.length + selectedArchive.reimbursements.length})</option>
                  <option value="expenses">Expenses Only ({selectedArchive.expenses.length})</option>
                  <option value="reimbursements">Reimbursements Only ({selectedArchive.reimbursements.length})</option>
                </select>
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label htmlFor="category-filter-historic">Filter by category:</label>
                <select
                  id="category-filter-historic"
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  {selectedArchive.categorySnapshots
                    .sort((a, b) => {
                      const catA = categories.find(c => c.id === a.id);
                      const catB = categories.find(c => c.id === b.id);
                      return (catA?.order || 0) - (catB?.order || 0);
                    })
                    .map((category) => {
                      const allTransactions = [
                        ...selectedArchive.expenses.map(e => ({ ...e, type: 'expense' })),
                        ...selectedArchive.reimbursements.map(r => ({ ...r, type: 'reimbursement' }))
                      ];
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
                <label htmlFor="sort-by-historic">Sort by:</label>
                <select
                  id="sort-by-historic"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'category')}
                  className="filter-select"
                >
                  <option value="date">Date & Time (Newest First)</option>
                  <option value="category">Category (A-Z)</option>
                </select>
              </div>
            </div>
            {selectedArchive.expenses.length === 0 && selectedArchive.reimbursements.length === 0 ? (
              <div className="empty-state">
                <p>No expenses or reimbursements recorded for this month</p>
                <p style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.5rem' }}>
                  Click "Add Expense" or "Add Reimbursement" above to add one
                </p>
              </div>
            ) : (
              <div className="expenses-table">
                {/* Combine expenses and reimbursements */}
                {(() => {
                  // Combine all transactions
                  const allTransactions = [
                    ...selectedArchive.expenses.map(exp => ({ ...exp, transactionType: 'expense' as const })),
                    ...selectedArchive.reimbursements.map(reimb => ({ ...reimb, transactionType: 'reimbursement' as const }))
                  ];

                  // Filter by type
                  let filteredByType = allTransactions;
                  if (selectedTypeFilter === 'expenses') {
                    filteredByType = allTransactions.filter(t => t.transactionType === 'expense');
                  } else if (selectedTypeFilter === 'reimbursements') {
                    filteredByType = allTransactions.filter(t => t.transactionType === 'reimbursement');
                  }

                  // Filter by category
                  const filteredTransactions = selectedCategoryFilter === 'all'
                    ? filteredByType
                    : filteredByType.filter((transaction) => transaction.categoryId === selectedCategoryFilter);

                  // Sort transactions by selected method
                  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
                    if (sortBy === 'category') {
                      // Sort by category name, then by date within category
                      const catA = selectedArchive.categorySnapshots.find(c => c.id === a.categoryId);
                      const catB = selectedArchive.categorySnapshots.find(c => c.id === b.categoryId);
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

                  return sortedTransactions.map((transaction) => {
                    const isReimbursement = transaction.transactionType === 'reimbursement';
                    const category = selectedArchive.categorySnapshots.find(
                      (cat) => cat.id === transaction.categoryId
                    );
                    const isEditing = editingExpense?.id === transaction.id;

                    if (isEditing) {
                      // Edit mode
                      return (
                        <div
                          key={transaction.id}
                          className="expense-row-archive expense-row-editing"
                          style={{ borderLeftColor: category?.color || '#6B7280' }}
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
                                  required
                                >
                                  {categories.length === 0 ? (
                                    <option value="">No categories available</option>
                                  ) : (
                                    [...categories]
                                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                                      .map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.name}
                                        </option>
                                      ))
                                  )}
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
                            {editingTransactionType === 'expense' && (
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
                          borderLeftColor: category?.color || '#6B7280',
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
                                  onClick={() => setViewingReceipt(transaction as any)}
                                >
                                  📄
                                </button>
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
                          {!isReimbursement && !('isRecurring' in transaction && transaction.isRecurring) && (
                            <button
                              className="btn-recurring-expense"
                              onClick={() => handleMarkAsRecurring(transaction.id, transaction.description)}
                              title="Mark as recurring"
                            >
                              🔄
                            </button>
                          )}
                          <button
                            className="btn-edit-expense"
                            onClick={() => handleEdit(transaction as any, isReimbursement ? 'reimbursement' : 'expense')}
                            title={`Edit ${isReimbursement ? 'reimbursement' : 'expense'}`}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-delete-expense"
                            onClick={() => handleDeleteExpense(transaction.id, transaction.description, isReimbursement)}
                            title={`Delete ${isReimbursement ? 'reimbursement' : 'expense'}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
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

      {/* Receipt Viewing Modal */}
      {viewingReceipt && (
        <div className="modal-overlay" onClick={() => setViewingReceipt(null)}>
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
                  <span className="detail-value">
                    {selectedArchive?.categorySnapshots.find(
                      (cat) => cat.id === viewingReceipt.categoryId
                    )?.name || 'Unknown'}
                  </span>
                </div>
                <div className="receipt-detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">{formatCurrency(viewingReceipt.amount)}</span>
                </div>
                <div className="receipt-detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {new Date(viewingReceipt.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add To Archive Modal */}
      {showAddModal && selectedArchive && (
        <AddToArchiveModal
          archiveMonth={selectedArchive.month}
          categories={categories}
          type={showAddModal}
          onAdd={(categoryId, amount, description) => {
            if (showAddModal === 'expense') {
              onAddExpenseToArchive(selectedArchive.id, categoryId, amount, description);
            } else {
              onAddReimbursementToArchive(selectedArchive.id, categoryId, amount, description);
            }
            setShowAddModal(null);
          }}
          onCancel={() => setShowAddModal(null)}
        />
      )}
    </div>
  );
};

