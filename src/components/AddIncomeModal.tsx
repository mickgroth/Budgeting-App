import React, { useState } from 'react';
import { formatCurrency } from '../utils/budgetHelpers';
import { AdditionalIncome } from '../types/budget';

interface AddIncomeModalProps {
  existingIncome: AdditionalIncome[];
  onAddIncome: (amount: number, description: string) => void;
  onUpdateIncome: (id: string, amount: number, description: string) => void;
  onDeleteIncome: (id: string) => void;
  onClose: () => void;
}

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({
  existingIncome,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onClose,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (editingId) {
      onUpdateIncome(editingId, parsedAmount, description);
      setEditingId(null);
    } else {
      onAddIncome(parsedAmount, description);
    }

    setAmount('');
    setDescription('');
  };

  const handleEdit = (income: AdditionalIncome) => {
    setEditingId(income.id);
    setAmount(income.amount.toString());
    setDescription(income.description);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setDescription('');
  };

  const totalAdditional = existingIncome.reduce((sum, inc) => sum + inc.amount, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>💰 Additional Income This Month</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p style={{ color: '#6B7280', marginBottom: '1rem' }}>
            Track extra income from side hustles, dog-sitting, freelancing, gifts, etc. 
            This resets each month.
          </p>

          {/* Add/Edit Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="income-amount" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Amount ($)
              </label>
              <input
                id="income-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="income-description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Description
              </label>
              <input
                id="income-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Dog-sitting for John"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: '8px', 
                  border: '1px solid #D1D5DB',
                  fontSize: '1rem'
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {editingId ? '✓ Update Income' : '+ Add Income'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Income List */}
          {existingIncome.length > 0 && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #E5E7EB'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Income Entries</h3>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#10B981' }}>
                  Total: {formatCurrency(totalAdditional)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {existingIncome
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((income) => (
                    <div
                      key={income.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        border: editingId === income.id ? '2px solid #10B981' : '1px solid #E5E7EB',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {income.description}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                          {new Date(income.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#10B981', fontSize: '1.1rem' }}>
                          {formatCurrency(income.amount)}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(income)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: '#3B82F6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this income entry?')) {
                                onDeleteIncome(income.id);
                                if (editingId === income.id) {
                                  handleCancelEdit();
                                }
                              }
                            }}
                            style={{
                              padding: '0.5rem 0.75rem',
                              background: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {existingIncome.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#9CA3AF',
              background: '#F9FAFB',
              borderRadius: '8px',
              border: '1px dashed #D1D5DB'
            }}>
              No additional income entries yet. Add one above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

