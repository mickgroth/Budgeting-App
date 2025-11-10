import { useState, useEffect } from 'react';
import { Budget, BudgetCategory, Expense, MonthlySavings, LongTermSavingsGoal, CATEGORY_COLORS } from '../types/budget';
import { generateId } from '../utils/budgetHelpers';

const STORAGE_KEY = 'budget-app-data';

/**
 * Custom hook for managing budget state with localStorage persistence
 */
export const useBudget = () => {
  const [budget, setBudget] = useState<Budget>(() => {
    // Load from localStorage on initial render
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Migration: add expenses, savings, and longTermGoals arrays if they don't exist
        let longTermGoals = parsed.longTermGoals || [];
        
        // Migration: add order field to existing longTermGoals that don't have it
        longTermGoals = longTermGoals.map((goal: any, index: number) => ({
          ...goal,
          order: goal.order !== undefined ? goal.order : index,
        }));
        
        return {
          ...parsed,
          expenses: parsed.expenses || [],
          savings: parsed.savings || [],
          longTermGoals,
        };
      } catch (error) {
        console.error('Failed to parse stored budget:', error);
      }
    }
    // Default initial state
    return {
      totalBudget: 0,
      categories: [],
      expenses: [],
      savings: [],
      longTermGoals: [],
    };
  });

  // Save to localStorage whenever budget changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
  }, [budget]);

  /**
   * Update the total budget amount
   */
  const setTotalBudget = (amount: number) => {
    setBudget((prev) => ({
      ...prev,
      totalBudget: Math.max(0, amount),
    }));
  };

  /**
   * Add a new budget category
   */
  const addCategory = (name: string, allocated: number) => {
    const colorIndex = budget.categories.length % CATEGORY_COLORS.length;
    const newCategory: BudgetCategory = {
      id: generateId(),
      name: name.trim(),
      allocated: Math.max(0, allocated),
      spent: 0,
      color: CATEGORY_COLORS[colorIndex],
    };

    setBudget((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
  };

  /**
   * Update an existing category
   */
  const updateCategory = (
    id: string,
    updates: Partial<Omit<BudgetCategory, 'id'>>
  ) => {
    setBudget((prev) => ({
      ...prev,
      categories: prev.categories.map((category) =>
        category.id === id ? { ...category, ...updates } : category
      ),
    }));
  };

  /**
   * Delete a category
   */
  const deleteCategory = (id: string) => {
    setBudget((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== id),
    }));
  };

  /**
   * Update spending for a category
   */
  const updateSpending = (id: string, amount: number) => {
    updateCategory(id, { spent: Math.max(0, amount) });
  };

  /**
   * Add a new expense and update category spending
   */
  const addExpense = (categoryId: string, amount: number, description: string, receiptImage?: string) => {
    const newExpense: Expense = {
      id: generateId(),
      categoryId,
      amount: Math.max(0, amount),
      description: description.trim(),
      date: new Date().toISOString(),
      receiptImage,
    };

    setBudget((prev) => {
      // Calculate new spent amount for the category
      const categoryExpenses = [...prev.expenses, newExpense].filter(
        (exp) => exp.categoryId === categoryId
      );
      const newSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      return {
        ...prev,
        expenses: [...prev.expenses, newExpense],
        categories: prev.categories.map((cat) =>
          cat.id === categoryId ? { ...cat, spent: newSpent } : cat
        ),
      };
    });
  };

  /**
   * Update an existing expense and recalculate category spending
   */
  const updateExpense = (expenseId: string, updates: Partial<Omit<Expense, 'id'>>) => {
    setBudget((prev) => {
      const expenseToUpdate = prev.expenses.find((exp) => exp.id === expenseId);
      if (!expenseToUpdate) return prev;

      const updatedExpense = { ...expenseToUpdate, ...updates };
      const updatedExpenses = prev.expenses.map((exp) =>
        exp.id === expenseId ? updatedExpense : exp
      );

      // Recalculate spent for both old and new categories (if category changed)
      const affectedCategoryIds = new Set([
        expenseToUpdate.categoryId,
        updatedExpense.categoryId,
      ]);

      const updatedCategories = prev.categories.map((cat) => {
        if (affectedCategoryIds.has(cat.id)) {
          const categoryExpenses = updatedExpenses.filter(
            (exp) => exp.categoryId === cat.id
          );
          const newSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          return { ...cat, spent: newSpent };
        }
        return cat;
      });

      return {
        ...prev,
        expenses: updatedExpenses,
        categories: updatedCategories,
      };
    });
  };

  /**
   * Delete an expense and recalculate category spending
   */
  const deleteExpense = (expenseId: string) => {
    setBudget((prev) => {
      const expenseToDelete = prev.expenses.find((exp) => exp.id === expenseId);
      if (!expenseToDelete) return prev;

      const newExpenses = prev.expenses.filter((exp) => exp.id !== expenseId);
      
      // Recalculate spent for the affected category
      const categoryExpenses = newExpenses.filter(
        (exp) => exp.categoryId === expenseToDelete.categoryId
      );
      const newSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      return {
        ...prev,
        expenses: newExpenses,
        categories: prev.categories.map((cat) =>
          cat.id === expenseToDelete.categoryId ? { ...cat, spent: newSpent } : cat
        ),
      };
    });
  };

  /**
   * Import categories from Excel file
   */
  const importCategories = (categories: Array<{ name: string; allocated: number }>) => {
    setBudget((prev) => {
      const newCategories = categories.map((cat) => ({
        id: generateId(),
        name: cat.name,
        allocated: cat.allocated,
        spent: 0,
        color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      }));

      return {
        ...prev,
        categories: [...prev.categories, ...newCategories],
      };
    });
  };

  /**
   * Add or update savings goal for a specific month
   */
  const setSavingsGoal = (month: string, goal: number, notes?: string) => {
    setBudget((prev) => {
      const existingIndex = prev.savings.findIndex((s) => s.month === month);
      
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev.savings];
        updated[existingIndex] = {
          ...updated[existingIndex],
          goal: Math.max(0, goal),
          notes: notes,
        };
        return { ...prev, savings: updated };
      } else {
        // Create new
        const newSavings: MonthlySavings = {
          id: generateId(),
          month,
          goal: Math.max(0, goal),
          actual: 0,
          notes,
        };
        return {
          ...prev,
          savings: [...prev.savings, newSavings].sort((a, b) => a.month.localeCompare(b.month)),
        };
      }
    });
  };

  /**
   * Calculate and update actual savings for a specific month
   */
  const calculateActualSavings = (month: string) => {
    setBudget((prev) => {
      const savingsEntry = prev.savings.find((s) => s.month === month);
      if (!savingsEntry) return prev;

      // Get expenses for this month
      const monthExpenses = prev.expenses.filter((exp) => {
        const expenseMonth = exp.date.substring(0, 7); // YYYY-MM
        return expenseMonth === month;
      });

      const totalSpent = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const actualSavings = Math.max(0, prev.totalBudget - savingsEntry.goal - totalSpent);

      const updatedSavings = prev.savings.map((s) =>
        s.month === month ? { ...s, actual: actualSavings } : s
      );

      return { ...prev, savings: updatedSavings };
    });
  };

  /**
   * Delete a savings entry
   */
  const deleteSavings = (month: string) => {
    setBudget((prev) => ({
      ...prev,
      savings: prev.savings.filter((s) => s.month !== month),
    }));
  };

  /**
   * Get current month's savings goal (used for budget calculations)
   */
  const getCurrentMonthSavingsGoal = (): number => {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const savingsEntry = budget.savings.find((s) => s.month === currentMonth);
    return savingsEntry?.goal || 0;
  };

  /**
   * Add a long-term savings goal
   */
  const addLongTermGoal = (name: string, targetAmount: number, notes?: string) => {
    setBudget((prev) => {
      // Find the maximum order value and add 1, or use 0 if no goals exist
      const maxOrder = prev.longTermGoals.length > 0
        ? Math.max(...prev.longTermGoals.map(g => g.order || 0))
        : -1;
      
      const newGoal: LongTermSavingsGoal = {
        id: generateId(),
        name: name.trim(),
        targetAmount: Math.max(0, targetAmount),
        currentAmount: 0,
        createdDate: new Date().toISOString(),
        order: maxOrder + 1,
        notes: notes?.trim(),
      };

      return {
        ...prev,
        longTermGoals: [...prev.longTermGoals, newGoal],
      };
    });
  };

  /**
   * Update a long-term savings goal
   */
  const updateLongTermGoal = (goalId: string, updates: Partial<Omit<LongTermSavingsGoal, 'id' | 'createdDate'>>) => {
    setBudget((prev) => ({
      ...prev,
      longTermGoals: prev.longTermGoals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              ...updates,
              name: updates.name?.trim() || goal.name,
              targetAmount: updates.targetAmount !== undefined ? Math.max(0, updates.targetAmount) : goal.targetAmount,
              currentAmount: updates.currentAmount !== undefined ? Math.max(0, updates.currentAmount) : goal.currentAmount,
            }
          : goal
      ),
    }));
  };

  /**
   * Delete a long-term savings goal and reorder remaining goals
   */
  const deleteLongTermGoal = (goalId: string) => {
    setBudget((prev) => {
      const remaining = prev.longTermGoals
        .filter((goal) => goal.id !== goalId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((goal, index) => ({ ...goal, order: index }));
      
      return {
        ...prev,
        longTermGoals: remaining,
      };
    });
  };

  /**
   * Reorder a long-term savings goal (move up or down)
   */
  const reorderLongTermGoal = (goalId: string, direction: 'up' | 'down') => {
    setBudget((prev) => {
      const sorted = [...prev.longTermGoals].sort((a, b) => (a.order || 0) - (b.order || 0));
      const currentIndex = sorted.findIndex(g => g.id === goalId);
      
      if (currentIndex === -1) return prev;
      if (direction === 'up' && currentIndex === 0) return prev;
      if (direction === 'down' && currentIndex === sorted.length - 1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Swap the goals
      [sorted[currentIndex], sorted[newIndex]] = [sorted[newIndex], sorted[currentIndex]];
      
      // Reassign order values
      const reordered = sorted.map((goal, index) => ({ ...goal, order: index }));
      
      return {
        ...prev,
        longTermGoals: reordered,
      };
    });
  };

  /**
   * Update long-term goal progress based on actual monthly savings with stacking
   * Goals are funded sequentially - only the first incomplete goal receives savings
   */
  const updateLongTermGoalProgress = (goalId?: string) => {
    setBudget((prev) => {
      // Sort goals by order
      const sortedGoals = [...prev.longTermGoals].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Calculate total available savings (sum of all actual monthly savings)
      const totalAvailableSavings = prev.savings
        .filter((s) => s.actual > 0)
        .reduce((sum, s) => sum + s.actual, 0);
      
      let remainingSavings = totalAvailableSavings;
      
      // Allocate savings sequentially to goals
      const updatedGoals = sortedGoals.map((goal) => {
        if (remainingSavings <= 0) {
          // No savings left for this goal
          return { ...goal, currentAmount: 0 };
        }
        
        if (remainingSavings >= goal.targetAmount) {
          // This goal is fully funded
          remainingSavings -= goal.targetAmount;
          return { ...goal, currentAmount: goal.targetAmount };
        } else {
          // This goal is partially funded (active goal)
          const allocated = remainingSavings;
          remainingSavings = 0;
          return { ...goal, currentAmount: allocated };
        }
      });
      
      return {
        ...prev,
        longTermGoals: updatedGoals,
      };
    });
  };

  /**
   * Reset all data
   */
  const resetBudget = () => {
    setBudget({
      totalBudget: 0,
      categories: [],
      expenses: [],
      savings: [],
      longTermGoals: [],
    });
  };

  return {
    budget,
    setTotalBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSpending,
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
  };
};

