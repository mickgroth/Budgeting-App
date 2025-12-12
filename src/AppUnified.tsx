import React, { useState, useEffect } from 'react';
import { useBudgetUnified } from './hooks/useBudgetUnified';
import { MonthView } from './components/MonthView';
import { MonthTabs } from './components/MonthTabs';
import { AddExpenseScreen } from './components/AddExpenseScreen';
import { AddReimbursementScreen } from './components/AddReimbursementScreen';
import { ExpensesList } from './components/ExpensesList';
import { AddIncomeModal } from './components/AddIncomeModal';
import { ImportBudgetExcel } from './components/ImportBudgetExcel';
import { SavingsTracker } from './components/SavingsTracker';
import { MonthlyComparison } from './components/MonthlyComparison';
import { AuthScreen } from './components/AuthScreen';
import { UserProfile } from './components/UserProfile';
import { AuthService } from './services/authService';
import './App.css';

type View = 'month' | 'add-expense' | 'add-reimbursement' | 'expenses-list' | 'savings' | 'comparison';

/**
 * Unified Budget Tracker - All months use the same UI
 */
function AppUnified() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; displayName: string | null; email: string | null } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState<'expense' | 'reimbursement'>('expense');
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showSalaryEdit, setShowSalaryEdit] = useState(false);
  const [editSalaryValue, setEditSalaryValue] = useState('');

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        });
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const {
    budget,
    isLoading,
    error,
    getCurrentMonthString,
    getMonth,
    getCurrentMonth,
    setSalaryIncome,
    addCategoryToMonth,
    updateCategoryInMonth,
    deleteCategoryFromMonth,
    reorderCategoryInMonth,
    addExpenseToMonth,
    updateExpenseInMonth,
    deleteExpenseFromMonth,
    addReimbursementToMonth,
    updateReimbursementInMonth,
    deleteReimbursementFromMonth,
    addAdditionalIncomeToMonth,
    updateAdditionalIncomeInMonth,
    deleteAdditionalIncomeFromMonth,
    importCategoriesToMonth,
    setSavingsGoal,
    getCurrentMonthSavingsGoal,
    calculateActualSavings,
    addLongTermGoal,
    updateLongTermGoal,
    deleteLongTermGoal,
  } = useBudgetUnified(currentUser?.uid || null);

  // Set selected month to current month on load
  useEffect(() => {
    if (!isLoading && budget.months.length > 0 && !selectedMonth) {
      setSelectedMonth(getCurrentMonthString());
    }
  }, [isLoading, budget.months, selectedMonth, getCurrentMonthString]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Handle hash-based navigation for comparison view
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#comparison') {
        setCurrentView('comparison');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Show auth screen if not logged in
  if (isAuthLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="app">
        <div className="container">
          <div className="loading">Loading your budget...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="app">
        <div className="container">
          <div className="error-message">
            ⚠️ {error}
            <button onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      </div>
    );
  }

  const currentMonthStr = getCurrentMonthString();
  const monthData = getMonth(selectedMonth);
  const isCurrentMonth = selectedMonth === currentMonthStr;

  // No month data - shouldn't happen but handle it
  if (!monthData) {
    return (
      <div className="app">
        <div className="container">
          <div className="error-message">
            ⚠️ Month data not found
            <button onClick={() => setSelectedMonth(currentMonthStr)}>Go to Current Month</button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * RENDER DIFFERENT VIEWS
   */

  // Add Expense View
  if (currentView === 'add-expense') {
    return (
      <div className="app">
        <div className="container">
          <AddExpenseScreen
            categories={monthData.categories}
            onAddExpense={(categoryId, amount, description, receiptImage, isRecurring) => {
              addExpenseToMonth(selectedMonth, categoryId, amount, description, receiptImage, isRecurring);
              setSuccessMessageType('expense');
              setShowSuccessMessage(true);
              setCurrentView('month');
            }}
            onCancel={() => setCurrentView('month')}
          />
        </div>
      </div>
    );
  }

  // Add Reimbursement View
  if (currentView === 'add-reimbursement') {
    return (
      <div className="app">
        <div className="container">
          <AddReimbursementScreen
            categories={monthData.categories}
            onAddReimbursement={(categoryId, amount, description, receiptImage) => {
              addReimbursementToMonth(selectedMonth, categoryId, amount, description, receiptImage);
              setSuccessMessageType('reimbursement');
              setShowSuccessMessage(true);
              setCurrentView('month');
            }}
            onCancel={() => setCurrentView('month')}
          />
        </div>
      </div>
    );
  }

  // Expenses List View
  if (currentView === 'expenses-list') {
    return (
      <div className="app">
        <div className="container">
          <ExpensesList
            expenses={monthData.expenses}
            reimbursements={monthData.reimbursements}
            categories={monthData.categories}
            onUpdateExpense={(expenseId, updates) => updateExpenseInMonth(selectedMonth, expenseId, updates)}
            onDeleteExpense={(expenseId) => deleteExpenseFromMonth(selectedMonth, expenseId)}
            onUpdateReimbursement={(reimbId, updates) => updateReimbursementInMonth(selectedMonth, reimbId, updates)}
            onDeleteReimbursement={(reimbId) => deleteReimbursementFromMonth(selectedMonth, reimbId)}
            onBack={() => setCurrentView('month')}
          />
        </div>
      </div>
    );
  }

  // Savings Tracker View
  if (currentView === 'savings') {
    return (
      <div className="app">
        <div className="container">
          <SavingsTracker
            savings={budget.savings}
            longTermGoals={budget.longTermGoals}
            onSetSavingsGoal={setSavingsGoal}
            onCalculateActualSavings={calculateActualSavings}
            onDeleteSavings={(savingsId) => {
              // Delete logic
            }}
            onAddLongTermGoal={addLongTermGoal}
            onUpdateLongTermGoal={updateLongTermGoal}
            onDeleteLongTermGoal={deleteLongTermGoal}
            onReorderLongTermGoal={(goalId, direction) => {
              // Reorder logic
            }}
            onUpdateLongTermGoalProgress={(goalId, amount) => {
              const goal = budget.longTermGoals.find(g => g.id === goalId);
              if (goal) {
                updateLongTermGoal(goalId, { currentAmount: goal.currentAmount + amount });
              }
            }}
            onBack={() => setCurrentView('month')}
          />
        </div>
      </div>
    );
  }

  // Monthly Comparison View
  if (currentView === 'comparison') {
    return (
      <div className="app">
        <div className="container">
          <MonthlyComparison
            monthlyArchives={budget.months.map(m => ({
              id: m.id,
              month: m.month,
              expenses: m.expenses,
              reimbursements: m.reimbursements,
              additionalIncome: m.additionalIncome,
              categorySnapshots: m.categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                allocated: cat.allocated,
                spent: cat.spent,
                color: cat.color,
              })),
              salaryIncome: m.salaryIncome,
              totalBudget: m.salaryIncome + m.additionalIncome.reduce((sum, inc) => sum + inc.amount, 0),
              totalSpent: m.categories.reduce((sum, cat) => sum + cat.spent, 0),
              archivedDate: m.createdDate,
            }))}
            onBack={() => setCurrentView('month')}
          />
        </div>
      </div>
    );
  }

  /**
   * MAIN MONTH VIEW
   */
  return (
    <div className="app">
      <div className="container">
        {/* Header with User Profile */}
        <div className="app-header">
          <h1>Budget Tracker</h1>
          <UserProfile user={currentUser} onSignOut={handleSignOut} />
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-banner">
            ✅ {successMessageType === 'expense' ? 'Expense' : 'Reimbursement'} added successfully!
          </div>
        )}

        {/* Global Salary Income (editable) */}
        <div className="global-settings">
          <div className="setting-card">
            <label>💰 Monthly Salary Income (applies to all months):</label>
            {showSalaryEdit ? (
              <div className="inline-edit">
                <input
                  type="number"
                  value={editSalaryValue}
                  onChange={(e) => setEditSalaryValue(e.target.value)}
                  onBlur={() => {
                    const value = parseFloat(editSalaryValue) || 0;
                    setSalaryIncome(value);
                    setShowSalaryEdit(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = parseFloat(editSalaryValue) || 0;
                      setSalaryIncome(value);
                      setShowSalaryEdit(false);
                    } else if (e.key === 'Escape') {
                      setShowSalaryEdit(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="salary-display" onClick={() => {
                setEditSalaryValue(budget.salaryIncome.toString());
                setShowSalaryEdit(true);
              }}>
                ${budget.salaryIncome.toFixed(2)} <span className="edit-hint">✏️ Click to edit</span>
              </div>
            )}
          </div>
        </div>

        {/* Month Tabs */}
        <MonthTabs
          months={budget.months}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          currentMonth={currentMonthStr}
        />

        {/* Month View */}
        <MonthView
          monthData={monthData}
          isCurrentMonth={isCurrentMonth}
          onUpdateCategory={(categoryId, updates) => updateCategoryInMonth(selectedMonth, categoryId, updates)}
          onDeleteCategory={(categoryId) => deleteCategoryFromMonth(selectedMonth, categoryId)}
          onReorderCategory={(categoryId, direction) => reorderCategoryInMonth(selectedMonth, categoryId, direction)}
          onAddCategory={(name, allocated, color) => addCategoryToMonth(selectedMonth, name, allocated, color)}
          onAddExpense={() => setCurrentView('add-expense')}
          onAddReimbursement={() => setCurrentView('add-reimbursement')}
          onAddIncome={() => setShowIncomeModal(true)}
          onViewExpensesList={() => setCurrentView('expenses-list')}
          currentMonthSavingsGoal={isCurrentMonth ? getCurrentMonthSavingsGoal() : 0}
        />

        {/* Navigation Buttons */}
        <div className="main-actions">
          <button className="btn-action savings-btn" onClick={() => setCurrentView('savings')}>
            💰 Savings Tracker
          </button>
          <button className="btn-action comparison-btn" onClick={() => setCurrentView('comparison')}>
            📊 Monthly Comparison
          </button>
          <ImportBudgetExcel
            onImport={(file) => importCategoriesToMonth(selectedMonth, file)}
          />
        </div>

        {/* Income Modal */}
        {showIncomeModal && (
          <AddIncomeModal
            existingIncome={monthData.additionalIncome}
            onAddIncome={(amount, description) => {
              addAdditionalIncomeToMonth(selectedMonth, amount, description);
            }}
            onUpdateIncome={(id, amount, description) => {
              updateAdditionalIncomeInMonth(selectedMonth, id, { amount, description });
            }}
            onDeleteIncome={(id) => {
              deleteAdditionalIncomeFromMonth(selectedMonth, id);
            }}
            onClose={() => setShowIncomeModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default AppUnified;

