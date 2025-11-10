import React, { useState, useEffect } from 'react';
import { MonthlySavings, LongTermSavingsGoal } from '../types/budget';

interface SavingsTrackerProps {
  savings: MonthlySavings[];
  longTermGoals: LongTermSavingsGoal[];
  totalBudget: number;
  onSetSavingsGoal: (month: string, goal: number, notes?: string) => void;
  onDeleteSavings: (month: string) => void;
  onAddLongTermGoal: (name: string, targetAmount: number, notes?: string) => void;
  onUpdateLongTermGoal: (goalId: string, updates: Partial<Omit<LongTermSavingsGoal, 'id' | 'createdDate'>>) => void;
  onDeleteLongTermGoal: (goalId: string) => void;
  onReorderLongTermGoal: (goalId: string, direction: 'up' | 'down') => void;
  onUpdateLongTermGoalProgress: () => void;
  onBack: () => void;
  getMonthlyExpenses: (month: string) => number;
}

/**
 * Component for managing savings goals and tracking actual savings
 */
export const SavingsTracker: React.FC<SavingsTrackerProps> = ({
  savings,
  longTermGoals,
  totalBudget,
  onSetSavingsGoal,
  onDeleteSavings,
  onAddLongTermGoal,
  onUpdateLongTermGoal,
  onDeleteLongTermGoal,
  onReorderLongTermGoal,
  onUpdateLongTermGoalProgress,
  onBack,
  getMonthlyExpenses,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Long-term goal form state
  const [showLongTermForm, setShowLongTermForm] = useState(false);
  const [editingLongTermGoal, setEditingLongTermGoal] = useState<LongTermSavingsGoal | null>(null);
  const [longTermName, setLongTermName] = useState('');
  const [longTermTarget, setLongTermTarget] = useState('');
  const [longTermNotes, setLongTermNotes] = useState('');

  // Generate array of months: all saved past months, current month, and 6 future months
  const getMonthsToDisplay = (): string[] => {
    const months = new Set<string>();
    const today = new Date();
    const currentMonth = today.toISOString().substring(0, 7);
    
    // Add all past months from saved savings data
    savings.forEach(s => {
      if (s.month <= currentMonth) {
        months.add(s.month);
      }
    });
    
    // Add current month
    months.add(currentMonth);
    
    // Add 6 future months for planning
    for (let i = 1; i <= 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.add(date.toISOString().substring(0, 7));
    }
    
    // Convert to array and sort chronologically
    return Array.from(months).sort();
  };

  const monthsToDisplay = getMonthsToDisplay();
  const currentMonth = new Date().toISOString().substring(0, 7);

  const formatMonthName = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSavingsForMonth = (month: string): MonthlySavings | undefined => {
    return savings.find((s) => s.month === month);
  };

  const isPastMonth = (month: string): boolean => {
    return month < currentMonth;
  };

  const isCurrentMonth = (month: string): boolean => {
    return month === currentMonth;
  };

  const handleAddGoal = (month: string) => {
    const existingSavings = getSavingsForMonth(month);
    setSelectedMonth(month);
    setGoalAmount(existingSavings?.goal.toString() || '');
    setNotes(existingSavings?.notes || '');
    setShowForm(true);
  };

  const handleSaveGoal = () => {
    if (!selectedMonth || !goalAmount) return;

    const goal = parseFloat(goalAmount);
    if (isNaN(goal) || goal < 0) {
      alert('Please enter a valid goal amount');
      return;
    }

    if (goal > totalBudget) {
      alert(`Savings goal cannot exceed your monthly budget of ${formatCurrency(totalBudget)}`);
      return;
    }

    onSetSavingsGoal(selectedMonth, goal, notes.trim() || undefined);

    setShowForm(false);
    setSelectedMonth('');
    setGoalAmount('');
    setNotes('');
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedMonth('');
    setGoalAmount('');
    setNotes('');
  };

  const handleDeleteSavings = (month: string) => {
    if (confirm(`Delete savings goal for ${formatMonthName(month)}?`)) {
      onDeleteSavings(month);
    }
  };

  // Helper function to calculate actual savings for any month
  const calculateActualSavings = (month: string): number => {
    const monthlyExpenses = getMonthlyExpenses(month);
    return Math.max(0, totalBudget - monthlyExpenses);
  };

  const calculateAvailableBudget = (month: string): number => {
    const savingsEntry = getSavingsForMonth(month);
    const savingsGoal = savingsEntry?.goal || 0;
    return totalBudget - savingsGoal;
  };

  const getSavingsStatus = (actual: number, goal: number): 'success' | 'warning' | 'danger' => {
    if (actual >= goal) return 'success';
    if (actual >= goal * 0.9) return 'warning';
    return 'danger';
  };

  // Long-term goal handlers
  const handleAddLongTermGoal = () => {
    setEditingLongTermGoal(null);
    setLongTermName('');
    setLongTermTarget('');
    setLongTermNotes('');
    setShowLongTermForm(true);
  };

  const handleEditLongTermGoal = (goal: LongTermSavingsGoal) => {
    setEditingLongTermGoal(goal);
    setLongTermName(goal.name);
    setLongTermTarget(goal.targetAmount.toString());
    setLongTermNotes(goal.notes || '');
    setShowLongTermForm(true);
  };

  const handleSaveLongTermGoal = () => {
    if (!longTermName.trim() || !longTermTarget) return;

    const target = parseFloat(longTermTarget);
    if (isNaN(target) || target <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    if (editingLongTermGoal) {
      onUpdateLongTermGoal(editingLongTermGoal.id, {
        name: longTermName,
        targetAmount: target,
        notes: longTermNotes.trim() || undefined,
      });
    } else {
      onAddLongTermGoal(longTermName, target, longTermNotes.trim() || undefined);
    }

    setShowLongTermForm(false);
    setEditingLongTermGoal(null);
    setLongTermName('');
    setLongTermTarget('');
    setLongTermNotes('');
  };

  const handleCancelLongTermForm = () => {
    setShowLongTermForm(false);
    setEditingLongTermGoal(null);
    setLongTermName('');
    setLongTermTarget('');
    setLongTermNotes('');
  };

  const handleDeleteLongTermGoal = (goalId: string, goalName: string) => {
    if (confirm(`Delete long-term goal "${goalName}"?`)) {
      onDeleteLongTermGoal(goalId);
    }
  };

  const handleManualProgressUpdate = (goalId: string, newAmount: string) => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) return;
    
    onUpdateLongTermGoal(goalId, { currentAmount: amount });
  };

  // Calculate average monthly savings (from past months only - current month doesn't count yet)
  const calculateAverageMonthlyStrings = (): number => {
    // Get all past months that have expense data
    const pastMonths = monthsToDisplay.filter(m => m < currentMonth);
    const monthsWithExpenses = pastMonths.filter(m => getMonthlyExpenses(m) > 0);
    
    if (monthsWithExpenses.length === 0) {
      // If no actual savings from past months yet, use the average of set goals as estimate
      const goalsSet = savings.filter(s => s.goal > 0);
      if (goalsSet.length === 0) return 0;
      const totalGoals = goalsSet.reduce((sum, s) => sum + s.goal, 0);
      return totalGoals / goalsSet.length;
    }
    
    // Calculate actual savings for each past month with expenses
    const total = monthsWithExpenses.reduce((sum, month) => {
      return sum + calculateActualSavings(month);
    }, 0);
    
    return total / monthsWithExpenses.length;
  };

  // Forecast when a long-term goal will be achieved
  const forecastGoalCompletion = (goal: LongTermSavingsGoal): string => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 'Goal achieved!';

    const avgMonthlySavings = calculateAverageMonthlyStrings();
    if (avgMonthlySavings <= 0) return 'Set monthly savings goals to see forecast';

    const monthsNeeded = Math.ceil(remaining / avgMonthlySavings);
    const today = new Date();
    const completionDate = new Date(today.getFullYear(), today.getMonth() + monthsNeeded, 1);
    
    const monthName = completionDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `Estimated: ${monthName} (${monthsNeeded} months)`;
  };

  // Update all long-term goal progress when component loads or savings change
  useEffect(() => {
    if (longTermGoals.length > 0) {
      onUpdateLongTermGoalProgress();
    }
  }, [longTermGoals.length, savings.length]);

  return (
    <div className="savings-tracker">
      <div className="savings-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Budget
        </button>
        <h1>💰 Savings Tracker</h1>
        <p className="savings-description">
          Set monthly savings goals and track your actual savings. Your savings goal is subtracted from your available budget for expenses.
        </p>
      </div>

      {showForm && (
        <div className="savings-form-overlay">
          <div className="savings-form-modal">
            <h3>Set Savings Goal for {formatMonthName(selectedMonth)}</h3>
            
            <div className="form-group">
              <label>Savings Goal Amount:</label>
              <input
                type="number"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                autoFocus
              />
              <small>Monthly Budget: {formatCurrency(totalBudget)}</small>
            </div>

            {goalAmount && parseFloat(goalAmount) > 0 && (
              <div className="budget-preview">
                <p>
                  <strong>Available for Expenses:</strong> {formatCurrency(calculateAvailableBudget(selectedMonth))}
                </p>
                <small>
                  (Budget {formatCurrency(totalBudget)} - Savings Goal {formatCurrency(parseFloat(goalAmount))})
                </small>
              </div>
            )}

            <div className="form-group">
              <label>Notes (optional):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Vacation fund, Emergency fund..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button className="btn-save" onClick={handleSaveGoal}>
                Save Goal
              </button>
              <button className="btn-cancel" onClick={handleCancelForm}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="savings-grid">
        {monthsToDisplay.map((month) => {
          const savingsEntry = getSavingsForMonth(month);
          const isPast = isPastMonth(month);
          const isCurrent = isCurrentMonth(month);
          const monthlyExpenses = getMonthlyExpenses(month);
          const availableBudget = calculateAvailableBudget(month);
          // Always calculate actual savings from expenses
          const actualSavings = calculateActualSavings(month);
          // Default goal to 0 if no savings entry exists
          const savingsGoal = savingsEntry?.goal || 0;
          const savingsStatus = getSavingsStatus(actualSavings, savingsGoal);
          // Only show savings info if there are expenses for this month or it's current/past
          const hasData = monthlyExpenses > 0 || isPast || isCurrent;

          return (
            <div
              key={month}
              className={`savings-card ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}
            >
              <div className="savings-card-header">
                <h3>{formatMonthName(month)}</h3>
                {isCurrent && <span className="current-badge">Current</span>}
                {isPast && <span className="past-badge">Past</span>}
              </div>

              {hasData ? (
                <>
                  <div className="savings-goal">
                    <span className="label">Goal:</span>
                    <span className="amount">{formatCurrency(savingsGoal)}</span>
                  </div>

                  {savingsEntry?.notes && (
                    <div className="savings-notes">
                      <small>📝 {savingsEntry.notes}</small>
                    </div>
                  )}

                  {hasData && (
                    <>
                      <div className="savings-actual">
                        <span className="label">Actual Savings:</span>
                        <span className={`amount ${savingsStatus}`}>
                          {formatCurrency(actualSavings)}
                        </span>
                      </div>

                      {isCurrent ? (
                        // Current month - show "on track" message
                        actualSavings >= savingsGoal ? (
                          <div className="savings-status success">
                            ✅ Great! You're on track to meet your goal
                          </div>
                        ) : (
                          <div className="savings-status warning">
                            ⚠️ Short by {formatCurrency(savingsGoal - actualSavings)}
                          </div>
                        )
                      ) : (
                        // Past month - show achievement/shortfall
                        actualSavings >= savingsGoal ? (
                          <div className="savings-status success">
                            ✅ Goal achieved! Saved {formatCurrency(actualSavings - savingsGoal)} extra
                          </div>
                        ) : (
                          <div className="savings-status warning">
                            ⚠️ Short by {formatCurrency(savingsGoal - actualSavings)}
                          </div>
                        )
                      )}

                      <div className="savings-details">
                        <div className="detail-row">
                          <span>Monthly Budget:</span>
                          <span>{formatCurrency(totalBudget)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Spent:</span>
                          <span>{formatCurrency(monthlyExpenses)}</span>
                        </div>
                        <div className="detail-row">
                          <span>Available Budget:</span>
                          <span>{formatCurrency(availableBudget)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {!isPast && !isCurrent && (
                    <div className="savings-future-info">
                      <p>
                        <strong>Available for Expenses:</strong><br />
                        {formatCurrency(availableBudget)}
                      </p>
                    </div>
                  )}

                  <div className="savings-card-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleAddGoal(month)}
                      title="Edit savings goal"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteSavings(month)}
                      title="Delete savings goal"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-goal">
                  <p>No savings goal set</p>
                  <button
                    className="btn-add-goal"
                    onClick={() => handleAddGoal(month)}
                  >
                    + Set Goal
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Long-Term Savings Goals Section */}
      <div className="longterm-goals-section">
        <div className="longterm-header">
          <h2>🎯 Long-Term Savings Goals</h2>
          <button className="btn-add-longterm" onClick={handleAddLongTermGoal}>
            + Add Long-Term Goal
          </button>
        </div>

        {longTermGoals.length === 0 ? (
          <div className="empty-longterm">
            <p>No long-term savings goals yet. Create one to start tracking your progress!</p>
            <small>Examples: Emergency Fund, House Down Payment, Vacation Fund</small>
          </div>
        ) : (
          <div className="longterm-goals-grid">
            {longTermGoals
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((goal, index) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const isComplete = goal.currentAmount >= goal.targetAmount;
              const isActive = goal.currentAmount > 0 && !isComplete;
              const isWaiting = goal.currentAmount === 0;
              const forecast = forecastGoalCompletion(goal);
              const canMoveUp = index > 0;
              const canMoveDown = index < longTermGoals.length - 1;

              return (
                <div key={goal.id} className={`longterm-goal-card ${isComplete ? 'completed' : isActive ? 'active' : 'waiting'}`}>
                  <div className="longterm-goal-header">
                    <div className="goal-title-row">
                      <span className="goal-order-badge">#{index + 1}</span>
                      <h3>{goal.name}</h3>
                    </div>
                    {isComplete && <span className="status-badge completed-badge">✅ Completed</span>}
                    {isActive && <span className="status-badge active-badge">🎯 Active</span>}
                    {isWaiting && <span className="status-badge waiting-badge">⏳ Waiting</span>}
                  </div>

                  {goal.notes && (
                    <div className="longterm-notes">
                      <small>📝 {goal.notes}</small>
                    </div>
                  )}

                  <div className="longterm-amounts">
                    <div className="amount-row">
                      <span>Current Progress:</span>
                      <span className="current-amount">{formatCurrency(goal.currentAmount)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Target Amount:</span>
                      <span className="target-amount">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="amount-row remaining-amount">
                      <span>Remaining:</span>
                      <span>{formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}</span>
                    </div>
                  </div>

                  <div className="longterm-progress-bar">
                    <div
                      className={`longterm-progress-fill ${progress >= 100 ? 'complete' : progress >= 75 ? 'high' : progress >= 50 ? 'medium' : 'low'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="longterm-progress-text">
                    {progress.toFixed(1)}% Complete
                  </div>

                  <div className="longterm-forecast">
                    <div className="forecast-icon">📅</div>
                    <div className="forecast-text">{forecast}</div>
                  </div>

                  {!isComplete && (
                    <div className="average-savings-info">
                      <small>
                        Based on average monthly savings of {formatCurrency(calculateAverageMonthlyStrings())}
                      </small>
                    </div>
                  )}

                  <div className="longterm-actions">
                    <div className="reorder-buttons">
                      <button
                        className="btn-reorder"
                        onClick={() => onReorderLongTermGoal(goal.id, 'up')}
                        disabled={!canMoveUp}
                        title="Move up in priority"
                      >
                        ⬆️
                      </button>
                      <button
                        className="btn-reorder"
                        onClick={() => onReorderLongTermGoal(goal.id, 'down')}
                        disabled={!canMoveDown}
                        title="Move down in priority"
                      >
                        ⬇️
                      </button>
                    </div>
                    <button
                      className="btn-edit-longterm"
                      onClick={() => handleEditLongTermGoal(goal)}
                      title="Edit goal"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-delete-longterm"
                      onClick={() => handleDeleteLongTermGoal(goal.id, goal.name)}
                      title="Delete goal"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Long-Term Goal Form Modal */}
        {showLongTermForm && (
          <div className="savings-form-overlay">
            <div className="savings-form-modal">
              <h3>{editingLongTermGoal ? 'Edit' : 'Add'} Long-Term Savings Goal</h3>
              
              <div className="form-group">
                <label>Goal Name:</label>
                <input
                  type="text"
                  value={longTermName}
                  onChange={(e) => setLongTermName(e.target.value)}
                  placeholder="e.g., Emergency Fund, House Down Payment"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Target Amount:</label>
                <input
                  type="number"
                  value={longTermTarget}
                  onChange={(e) => setLongTermTarget(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Notes (optional):</label>
                <textarea
                  value={longTermNotes}
                  onChange={(e) => setLongTermNotes(e.target.value)}
                  placeholder="Purpose or additional details..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button className="btn-save" onClick={handleSaveLongTermGoal}>
                  {editingLongTermGoal ? 'Update' : 'Create'} Goal
                </button>
                <button className="btn-cancel" onClick={handleCancelLongTermForm}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

