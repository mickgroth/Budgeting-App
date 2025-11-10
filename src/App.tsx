import React, { useState, useEffect } from 'react';
import { useBudget } from './hooks/useBudget';
import { BudgetSummary } from './components/BudgetSummary';
import { CategoryCard } from './components/CategoryCard';
import { AddCategoryForm } from './components/AddCategoryForm';
import { AddExpenseScreen } from './components/AddExpenseScreen';
import { ExpensesList } from './components/ExpensesList';
import { ImportBudgetExcel } from './components/ImportBudgetExcel';
import { SavingsTracker } from './components/SavingsTracker';
import './App.css';

type View = 'budget' | 'add-expense' | 'savings';

/**
 * Main application component for the Budget Tracker
 */
function App() {
  const [currentView, setCurrentView] = useState<View>('budget');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const {
    budget,
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
    resetBudget,
  } = useBudget();

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
            categories={budget.categories}
            onAddExpense={handleAddExpense}
            onBack={handleBackToBudget}
          />
        </div>
      </div>
    );
  }

  // Render Main Budget Screen
  return (
    <div className="app">
      <div className="container">
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
      </div>
    </div>
  );
}

export default App;

