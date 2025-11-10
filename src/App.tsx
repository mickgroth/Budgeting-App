import React, { useState, useEffect } from 'react';
import { useBudget } from './hooks/useBudget';
import { BudgetSummary } from './components/BudgetSummary';
import { CategoryCard } from './components/CategoryCard';
import { AddCategoryForm } from './components/AddCategoryForm';
import { AddExpenseScreen } from './components/AddExpenseScreen';
import { ExpensesList } from './components/ExpensesList';
import { ImportBudgetExcel } from './components/ImportBudgetExcel';
import { SavingsTracker } from './components/SavingsTracker';
import { HistoricExpenses } from './components/HistoricExpenses';
import { MonthlyComparison } from './components/MonthlyComparison';
import { ArchiveMonthModal } from './components/ArchiveMonthModal';
import { AuthScreen } from './components/AuthScreen';
import { UserProfile } from './components/UserProfile';
import { AuthService } from './services/authService';
import './App.css';

type View = 'budget' | 'add-expense' | 'savings' | 'historic' | 'comparison';

/**
 * Main application component for the Budget Tracker
 */
function App() {
  const [currentUser, setCurrentUser] = useState<{ uid: string; displayName: string | null; email: string | null } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('budget');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Handle hash-based navigation for comparison view
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#comparison') {
        setCurrentView('comparison');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
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
    setTotalBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addExpense,
    updateExpense,
    deleteExpense,
    importCategories,
    setSavingsGoal,
    calculateActualSavings,
    deleteSavings,
    getCurrentMonthSavingsGoal,
    addLongTermGoal,
    updateLongTermGoal,
    deleteLongTermGoal,
    reorderLongTermGoal,
    updateLongTermGoalProgress,
    archiveCurrentMonth,
    deleteArchive,
    updateArchivedExpense,
    deleteArchivedExpense,
    resetBudget,
  } = useBudget(currentUser?.uid || null);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Recalculate current month's actual savings when expenses change
  useEffect(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentSavings = budget.savings.find(s => s.month === currentMonth);
    if (currentSavings && currentSavings.goal > 0) {
      calculateActualSavings(currentMonth);
    }
  }, [budget.expenses.length]); // Trigger when expenses are added/removed

  const handleReset = () => {
    if (
      window.confirm(
        'Are you sure you want to reset all budget data? This action cannot be undone.'
      )
    ) {
      resetBudget();
    }
  };

  // Handle adding expense with success feedback
  const handleAddExpense = (categoryId: string, amount: number, description: string, receiptImage?: string) => {
    addExpense(categoryId, amount, description, receiptImage);
    setShowSuccessMessage(true);
  };

  const handleAddExpenseView = () => {
    setCurrentView('add-expense');
  };

  const handleOpenSavings = () => {
    setCurrentView('savings');
  };

  const handleBackToBudget = () => {
    setCurrentView('budget');
    setShowSuccessMessage(true);
  };

  const getMonthlyExpenses = (month: string): number => {
    const monthExpenses = budget.expenses.filter((exp) => {
      const expenseMonth = exp.date.substring(0, 7); // YYYY-MM
      return expenseMonth === month;
    });
    return monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Render Savings Tracker Screen
  if (currentView === 'savings') {
    return (
      <div className="app">
        <div className="container">
          <SavingsTracker
            savings={budget.savings}
            longTermGoals={budget.longTermGoals}
            totalBudget={budget.totalBudget}
            onSetSavingsGoal={setSavingsGoal}
            onCalculateActualSavings={calculateActualSavings}
            onDeleteSavings={deleteSavings}
            onAddLongTermGoal={addLongTermGoal}
            onUpdateLongTermGoal={updateLongTermGoal}
            onDeleteLongTermGoal={deleteLongTermGoal}
            onReorderLongTermGoal={reorderLongTermGoal}
            onUpdateLongTermGoalProgress={updateLongTermGoalProgress}
            onBack={() => setCurrentView('budget')}
            getMonthlyExpenses={getMonthlyExpenses}
          />
        </div>
      </div>
    );
  }

  // Render Add Expense Screen
  if (currentView === 'add-expense') {
    return (
      <div className="app">
        <div className="container">
          <AddExpenseScreen
            userId={currentUser.uid}
            categories={budget.categories}
            onAddExpense={handleAddExpense}
            onBack={handleBackToBudget}
          />
        </div>
      </div>
    );
  }

  // Render Historic Expenses Screen
  if (currentView === 'historic') {
    return (
      <div className="app">
        <div className="container">
          <HistoricExpenses
            archives={budget.monthlyArchives}
            onDeleteArchive={deleteArchive}
            onUpdateArchivedExpense={updateArchivedExpense}
            onDeleteArchivedExpense={deleteArchivedExpense}
            onBack={() => setCurrentView('budget')}
          />
        </div>
      </div>
    );
  }

  // Render Monthly Comparison Screen
  if (currentView === 'comparison') {
    return (
      <div className="app">
        <div className="container">
          <MonthlyComparison
            archives={budget.monthlyArchives}
            onBack={() => {
              window.location.hash = '';
              setCurrentView('historic');
            }}
          />
        </div>
      </div>
    );
  }

  // Show authentication loading state
  if (isAuthLoading) {
    return (
      <div className="app">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show authentication screen if not logged in
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="app">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading budget data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render Main Budget Screen
  return (
    <div className="app">
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          position: 'relative'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>💰 Budget Tracker</h1>
          <UserProfile userName={currentUser.displayName} userEmail={currentUser.email} />
        </div>

        {error && (
          <div className="error-banner" style={{ 
            backgroundColor: '#fee', 
            color: '#c33', 
            padding: '1rem', 
            marginBottom: '1rem', 
            borderRadius: '4px',
            border: '1px solid #fcc'
          }}>
            ⚠️ {error}
          </div>
        )}
        {showSuccessMessage && (
          <div className="success-banner">
            ✅ Expense added successfully!
          </div>
        )}
          <BudgetSummary 
            budget={budget} 
            onTotalBudgetChange={setTotalBudget}
            currentMonthSavingsGoal={getCurrentMonthSavingsGoal()}
          />
          
          <div className="main-actions">
            <button 
              className="btn-savings"
              onClick={handleOpenSavings}
            >
              💰 Savings Tracker
            </button>
            <button 
              className="btn-historic"
              onClick={() => setCurrentView('historic')}
            >
              📊 Historic Data
            </button>
            <button 
              className="btn-archive"
              onClick={() => {
                if (budget.expenses.length === 0) {
                  alert('No expenses to archive for this month.');
                  return;
                }
                setShowArchiveModal(true);
              }}
              disabled={budget.expenses.length === 0}
            >
              📦 End of Month
            </button>
          </div>

        <div className="categories-section">
          <div className="section-header">
            <h2>Budget Categories</h2>
            {budget.categories.length > 0 && (
              <button className="btn-reset" onClick={handleReset}>
                Reset All
              </button>
            )}
          </div>

          <div className="categories-grid">
            {budget.categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
              />
            ))}
          </div>

          <AddCategoryForm onAdd={addCategory} />

          <ImportBudgetExcel onImport={importCategories} />

          {budget.categories.length === 0 && (
            <div className="empty-state">
              <p>No categories yet. Add your first category to get started!</p>
            </div>
          )}
        </div>

        {budget.categories.length > 0 && (
          <div className="expenses-section">
            <div className="expenses-section-header">
              <h2>Expenses</h2>
              <button 
                className="btn-add-expense"
                onClick={handleAddExpenseView}
              >
                + Add Expense
              </button>
            </div>
            
            {budget.expenses.length > 0 ? (
              <ExpensesList
                expenses={budget.expenses}
                categories={budget.categories}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
              />
            ) : (
              <div className="empty-state">
                <p>No expenses logged yet. Click "Add Expense" to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Archive Month Modal */}
        {showArchiveModal && (
          <ArchiveMonthModal
            expenseCount={budget.expenses.length}
            currentBudget={budget.totalBudget}
            existingArchives={budget.monthlyArchives}
            onConfirm={(month, updateBudget) => {
              setShowArchiveModal(false);
              archiveCurrentMonth(month, updateBudget);
              
              // Format month for display (month is in YYYY-MM format)
              const [year, monthNum] = month.split('-');
              const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ];
              const monthIndex = parseInt(monthNum) - 1; // Convert 01-12 to 0-11
              const displayMonth = `${monthNames[monthIndex]} ${year}`;
              
              alert(`✅ ${displayMonth} archived successfully!\n\nYou can now start fresh for the new month.`);
            }}
            onCancel={() => setShowArchiveModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;

