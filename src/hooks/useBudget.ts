import { useState, useEffect, useRef } from 'react';
import { Budget, BudgetCategory, Expense, MonthlySavings, LongTermSavingsGoal, MonthlyArchive, CATEGORY_COLORS } from '../types/budget';
import { generateId } from '../utils/budgetHelpers';
import { FirebaseService } from '../services/firebaseService';
import { StorageService } from '../services/storageService';

// Default initial state
const defaultBudget: Budget = {
  totalBudget: 0,
  categories: [],
  expenses: [],
  savings: [],
  longTermGoals: [],
  monthlyArchives: [],
};

/**
 * Custom hook for managing budget state with Firebase Firestore persistence
 */
export const useBudget = (userId: string | null) => {
  const [budget, setBudget] = useState<Budget>(defaultBudget);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const isSaving = useRef(false);

  // Initialize Firebase connection and load data
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    if (isInitialized.current) return;
    isInitialized.current = true;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const firebaseBudget = await FirebaseService.getBudget(userId);
        
        if (firebaseBudget) {
          // Migration: ensure all required fields exist
          let longTermGoals = firebaseBudget.longTermGoals || [];
          longTermGoals = longTermGoals.map((goal: any, index: number) => ({
            ...goal,
            order: goal.order !== undefined ? goal.order : index,
          }));
          
          setBudget({
            totalBudget: firebaseBudget.totalBudget || 0,
            categories: firebaseBudget.categories || [],
            expenses: firebaseBudget.expenses || [],
            savings: firebaseBudget.savings || [],
            longTermGoals,
            monthlyArchives: firebaseBudget.monthlyArchives || [], // Add for backward compatibility
          });
        } else {
          // No data in Firebase, initialize with default
          await FirebaseService.saveBudget(userId, defaultBudget);
          setBudget(defaultBudget);
        }
      } catch (err) {
        console.error('Error loading budget from Firebase:', err);
        setError('Failed to load budget data. Please refresh the page.');
        // Fallback to default budget
        setBudget(defaultBudget);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();

    // Subscribe to real-time updates
    const unsubscribe = FirebaseService.subscribeToBudget(
      userId,
      (updatedBudget) => {
        if (updatedBudget && !isSaving.current) {
          // Migration: ensure all required fields exist
          let longTermGoals = updatedBudget.longTermGoals || [];
          longTermGoals = longTermGoals.map((goal: any, index: number) => ({
            ...goal,
            order: goal.order !== undefined ? goal.order : index,
          }));
          
          setBudget({
            totalBudget: updatedBudget.totalBudget || 0,
            categories: updatedBudget.categories || [],
            expenses: updatedBudget.expenses || [],
            savings: updatedBudget.savings || [],
            longTermGoals,
            monthlyArchives: updatedBudget.monthlyArchives || [], // Add for backward compatibility
          });
        }
      },
      (err) => {
        console.error('Error in Firebase subscription:', err);
        setError('Connection error. Changes may not sync.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Save to Firebase whenever budget changes (debounced)
  useEffect(() => {
    if (!userId || !isInitialized.current || isLoading) return;

    const saveToFirebase = async () => {
      try {
        isSaving.current = true;
        await FirebaseService.saveBudget(userId, budget);
        setError(null);
      } catch (err) {
        console.error('Error saving budget to Firebase:', err);
        setError('Failed to save changes. Please try again.');
      } finally {
        isSaving.current = false;
      }
    };

    // Debounce saves to avoid too many writes
    const timeoutId = setTimeout(saveToFirebase, 500);
    return () => clearTimeout(timeoutId);
  }, [budget, isLoading, userId]);

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
  const addExpense = (categoryId: string, amount: number, description: string, receiptImage?: string, isRecurring?: boolean) => {
    const newExpense: Expense = {
      id: generateId(),
      categoryId,
      amount: Math.max(0, amount),
      description: description.trim(),
      date: new Date().toISOString(),
      receiptImage,
      isRecurring: isRecurring || false,
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
   * If changing from recurring to non-recurring, removes it from all consecutive months
   */
  const updateExpense = (expenseId: string, updates: Partial<Omit<Expense, 'id'>>) => {
    setBudget((prev) => {
      const expenseToUpdate = prev.expenses.find((exp) => exp.id === expenseId);
      if (!expenseToUpdate) return prev;

      // Check if changing from recurring to non-recurring, or marking as recurring
      const wasRecurring = expenseToUpdate.isRecurring === true;
      const willBeRecurring = updates.isRecurring === true;
      const isUnmarkingRecurring = wasRecurring && !willBeRecurring;
      const isMarkingRecurring = !wasRecurring && willBeRecurring;

      // Get current month
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      // If unmarking recurring, we need to find which archive month this expense originated from
      // We'll look for the earliest archive month that has this recurring expense
      let archiveMonth: string | null = null;
      if (isUnmarkingRecurring) {
        const sortedArchives = [...(prev.monthlyArchives || [])].sort((a, b) => 
          a.month.localeCompare(b.month)
        );
        
        for (const archive of sortedArchives) {
          const matchingExpense = archive.expenses.find(exp =>
            exp.isRecurring === true &&
            exp.description === expenseToUpdate.description &&
            exp.categoryId === expenseToUpdate.categoryId &&
            exp.amount === expenseToUpdate.amount
          );
          
          if (matchingExpense) {
            archiveMonth = archive.month;
            break;
          }
        }
      }
      
      // If marking as recurring, find which archive month this expense came from (if any)
      // Otherwise, treat current month as the source
      let sourceMonthForRecurring: string | null = null;
      if (isMarkingRecurring) {
        const sortedArchives = [...(prev.monthlyArchives || [])].sort((a, b) => 
          a.month.localeCompare(b.month)
        );
        
        // Look for the earliest archive month that has this expense (even if not recurring)
        for (const archive of sortedArchives) {
          const matchingExpense = archive.expenses.find(exp =>
            exp.description === expenseToUpdate.description &&
            exp.categoryId === expenseToUpdate.categoryId &&
            exp.amount === expenseToUpdate.amount
          );
          
          if (matchingExpense) {
            sourceMonthForRecurring = archive.month;
            break;
          }
        }
        
        // If not found in archives, use current month as source
        if (!sourceMonthForRecurring) {
          sourceMonthForRecurring = currentMonthStr;
        }
      }

      // Generate FOLLOWING months to remove from if unmarking recurring
      // Note: We exclude the archive month itself - we only affect FOLLOWING months
      const monthsToRemoveFrom: string[] = [];
      if (isUnmarkingRecurring && archiveMonth) {
        const [archiveYear, archiveMonthNum] = archiveMonth.split('-').map(Number);
        // Start from the month AFTER the archive month
        let year = archiveYear;
        let month = archiveMonthNum + 1;
        if (month > 12) {
          month = 1;
          year++;
        }
        
        // Generate all months from archive+1 to current month (inclusive)
        while (true) {
          const monthStr = `${year}-${String(month).padStart(2, '0')}`;
          monthsToRemoveFrom.push(monthStr);
          
          // Stop if we've reached the current month
          if (monthStr === currentMonthStr) break;
          
          // Move to next month
          month++;
          if (month > 12) {
            month = 1;
            year++;
          }
        }
      }

      const updatedExpense = { ...expenseToUpdate, ...updates };
      const updatedExpenses = prev.expenses.map((exp) =>
        exp.id === expenseId ? updatedExpense : exp
      );

      // If unmarking recurring, remove matching expenses from FOLLOWING months in archives
      let updatedArchives = prev.monthlyArchives || [];
      if (isUnmarkingRecurring && archiveMonth) {
        updatedArchives = updatedArchives.map((archive) => {
          // Remove matching recurring expenses from FOLLOWING months only (not the archive month itself)
          if (monthsToRemoveFrom.includes(archive.month)) {
            const expensesToKeep = archive.expenses.filter(exp => 
              !(exp.isRecurring === true &&
                exp.description === expenseToUpdate.description &&
                exp.categoryId === expenseToUpdate.categoryId &&
                exp.amount === expenseToUpdate.amount)
            );
            
            // Recalculate category spending
            const categoryMap = new Map<string, number>();
            expensesToKeep.forEach((exp) => {
              const currentSpent = categoryMap.get(exp.categoryId) || 0;
              categoryMap.set(exp.categoryId, currentSpent + exp.amount);
            });

            // Update category snapshots with new spending
            const updatedCategorySnapshots = archive.categorySnapshots.map((cat) => ({
              ...cat,
              spent: categoryMap.get(cat.id) || 0,
            }));

            // Recalculate total spent
            const totalSpent = expensesToKeep.reduce((sum, exp) => sum + exp.amount, 0);

            return {
              ...archive,
              expenses: expensesToKeep,
              categorySnapshots: updatedCategorySnapshots,
              totalSpent,
            };
          }
          return archive;
        });
      }

      // If marking as recurring, populate for all months from source month to current month
      let finalArchives = updatedArchives;
      let finalExpenses = updatedExpenses;
      let finalCategories = prev.categories;
      
      if (isMarkingRecurring && sourceMonthForRecurring) {
        const [sourceYear, sourceMonthNum] = sourceMonthForRecurring.split('-').map(Number);
        
        // Generate all months from source month to current month (inclusive)
        // This includes the source month itself, but we'll exclude it when populating
        const monthsToPopulate: string[] = [];
        let year = sourceYear;
        let month = sourceMonthNum;
        
        while (true) {
          const monthStr = `${year}-${String(month).padStart(2, '0')}`;
          monthsToPopulate.push(monthStr);
          
          // Stop if we've reached the current month
          if (monthStr === currentMonthStr) break;
          
          // Move to next month
          month++;
          if (month > 12) {
            month = 1;
            year++;
          }
        }
        
        // If source month is current month, we don't need to populate for other months
        // (it will populate when archived via archiveCurrentMonth)
        // But we still need to continue with the rest of the logic to update categories
        const shouldPopulateOtherMonths = sourceMonthForRecurring !== currentMonthStr;
        
        // Populate for archived FOLLOWING months (excluding the source month)
        // monthsToPopulate includes the source month, so we need to exclude it
        if (shouldPopulateOtherMonths) {
          finalArchives = updatedArchives.map(archive => {
            // Skip if not in range or is the source month
            if (!monthsToPopulate.includes(archive.month) || archive.month === sourceMonthForRecurring) {
              return archive;
            }
            
            // Check if expense already exists in this archive
            const expenseExists = archive.expenses.some(exp => 
              exp.description === updatedExpense.description && 
              exp.categoryId === updatedExpense.categoryId &&
              exp.amount === updatedExpense.amount
            );
            
            if (expenseExists) return archive; // Don't duplicate
            
            // Add the recurring expense to this archive
            const [year, month] = archive.month.split('-').map(Number);
            const archiveDate = new Date(year, month - 1, 1);
            
            const newExpense: Expense = {
              ...updatedExpense,
              id: generateId(),
              date: archiveDate.toISOString(),
              receiptImage: undefined,
              isRecurring: true,
            };
            
            // Recalculate category spending
            const categoryMap = new Map<string, number>();
            [...archive.expenses, newExpense].forEach(exp => {
              const current = categoryMap.get(exp.categoryId) || 0;
              categoryMap.set(exp.categoryId, current + exp.amount);
            });
            
            const updatedCategorySnapshots = archive.categorySnapshots.map(cat => ({
              ...cat,
              spent: categoryMap.get(cat.id) || cat.spent,
            }));
            
            const newTotalSpent = [...archive.expenses, newExpense].reduce((sum, exp) => sum + exp.amount, 0);
            
            return {
              ...archive,
              expenses: [...archive.expenses, newExpense],
              categorySnapshots: updatedCategorySnapshots,
              totalSpent: newTotalSpent,
            };
          });
        }
        
        // Populate for current month if source month is before current month
        if (shouldPopulateOtherMonths && sourceMonthForRecurring < currentMonthStr) {
          // Check if expense already exists in current expenses
          const expenseExists = finalExpenses.some(exp => 
            exp.description === updatedExpense.description && 
            exp.categoryId === updatedExpense.categoryId &&
            exp.amount === updatedExpense.amount
          );
          
          if (!expenseExists) {
            // Add to current month expenses
            const newExpense: Expense = {
              ...updatedExpense,
              id: generateId(),
              date: new Date().toISOString(),
              receiptImage: undefined,
              isRecurring: true,
            };
            
            finalExpenses = [...finalExpenses, newExpense];
            
            // Update category spending
            const categorySpending = new Map<string, number>();
            finalExpenses.forEach(exp => {
              const current = categorySpending.get(exp.categoryId) || 0;
              categorySpending.set(exp.categoryId, current + exp.amount);
            });
            
            finalCategories = prev.categories.map(cat => {
              const spent = categorySpending.get(cat.id) || 0;
              return { ...cat, spent };
            });
          }
        }
      }

      // Recalculate spent for both old and new categories (if category changed)
      const affectedCategoryIds = new Set([
        expenseToUpdate.categoryId,
        updatedExpense.categoryId,
      ]);

      const updatedCategories = finalCategories.map((cat) => {
        if (affectedCategoryIds.has(cat.id)) {
          const categoryExpenses = finalExpenses.filter(
            (exp) => exp.categoryId === cat.id
          );
          const newSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          return { ...cat, spent: newSpent };
        }
        return cat;
      });

      return {
        ...prev,
        expenses: finalExpenses,
        categories: updatedCategories,
        monthlyArchives: finalArchives,
      };
    });
  };

  /**
   * Delete an expense and recalculate category spending
   */
  const deleteExpense = async (expenseId: string) => {
    // First, delete the receipt image from Storage if it exists
    const expenseToDelete = budget.expenses.find((exp) => exp.id === expenseId);
    if (expenseToDelete?.receiptImage && StorageService.isStorageURL(expenseToDelete.receiptImage)) {
      try {
        await StorageService.deleteReceiptImage(expenseToDelete.receiptImage);
      } catch (error) {
        console.error('Error deleting receipt image:', error);
        // Continue with expense deletion even if image deletion fails
      }
    }

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
      // Actual savings = Budget - Spent (regardless of savings goal)
      const actualSavings = Math.max(0, prev.totalBudget - totalSpent);

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
   * Automatically re-attributes saved money based on new order
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
      
      // Re-calculate and re-attribute saved money based on new order
      // Only use PAST months (exclude current and future)
      const currentMonth = new Date().toISOString().substring(0, 7);
      const archivedSavings = (prev.monthlyArchives || [])
        .filter(archive => archive.month < currentMonth) // Only past months
        .reduce((sum, archive) => {
          const monthSavings = Math.max(0, archive.totalBudget - archive.totalSpent);
          return sum + monthSavings;
        }, 0);
      
      const totalAvailableSavings = archivedSavings;
      
      let remainingSavings = totalAvailableSavings;
      
      // Allocate savings sequentially to goals in their new order
      const reorderedWithNewAmounts = reordered.map((goal) => {
        if (remainingSavings <= 0) {
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
        longTermGoals: reorderedWithNewAmounts,
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
      
      // Calculate total available savings from PAST months only (exclude current and future)
      // Only use archived expenses from completed months
      const currentMonth = new Date().toISOString().substring(0, 7);
      const archivedSavings = (prev.monthlyArchives || [])
        .filter(archive => archive.month < currentMonth) // Only past months
        .reduce((sum, archive) => {
          const monthSavings = Math.max(0, archive.totalBudget - archive.totalSpent);
          return sum + monthSavings;
        }, 0);
      
      const totalAvailableSavings = archivedSavings;
      
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
   * Archive current month's expenses and reset for new month
   * Creates a snapshot of categories and expenses before clearing
   * If month already exists, merges expenses and updates snapshots
   */
  const archiveCurrentMonth = (monthToArchive?: string, updateBudget: boolean = true) => {
    setBudget((prev) => {
      // Use provided month or current month
      const month = monthToArchive || new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Ensure monthlyArchives exists (for backward compatibility with existing data)
      const existingArchives = prev.monthlyArchives || [];
      
      // Check if this month is already archived
      const existingArchiveIndex = existingArchives.findIndex(archive => archive.month === month);
      const existingArchive = existingArchiveIndex >= 0 ? existingArchives[existingArchiveIndex] : null;
      
      if (existingArchive) {
        console.log(`Merging expenses into existing archive for ${month}`);
        
        // Merge expenses from existing archive with new expenses
        const mergedExpenses = [...existingArchive.expenses, ...prev.expenses];
        
        // Create updated category snapshots by merging spending
        const categoryMap = new Map();
        
        // Start with existing snapshots
        existingArchive.categorySnapshots.forEach(cat => {
          categoryMap.set(cat.id, { ...cat });
        });
        
        // Merge with current categories
        prev.categories.forEach(cat => {
          if (categoryMap.has(cat.id)) {
            // Add current spending to existing
            const existing = categoryMap.get(cat.id);
            categoryMap.set(cat.id, {
              ...existing,
              spent: existing.spent + cat.spent,
              allocated: cat.allocated, // Use current allocation
            });
          } else {
            // New category, add it
            categoryMap.set(cat.id, {
              id: cat.id,
              name: cat.name,
              allocated: cat.allocated,
              spent: cat.spent,
              color: cat.color,
            });
          }
        });
        
        const mergedCategorySnapshots = Array.from(categoryMap.values());
        const mergedTotalSpent = mergedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // Update existing archive
        const updatedArchive: MonthlyArchive = {
          ...existingArchive,
          expenses: mergedExpenses,
          categorySnapshots: mergedCategorySnapshots,
          totalBudget: updateBudget ? prev.totalBudget : existingArchive.totalBudget, // Respect user's choice
          totalSpent: mergedTotalSpent,
          archivedDate: new Date().toISOString(), // Update archive date
        };
        
        // Replace existing archive
        const updatedArchives = [...existingArchives];
        updatedArchives[existingArchiveIndex] = updatedArchive;
        
        // Find recurring expenses from the archived month
        const recurringExpenses = prev.expenses.filter(exp => exp.isRecurring);
        
        // Create new expense entries for recurring expenses in the new month
        const newRecurringExpenses: Expense[] = recurringExpenses.map(exp => ({
          ...exp,
          id: generateId(), // New ID for the new month
          date: new Date().toISOString(), // Current date
          receiptImage: undefined, // Don't copy receipt images
        }));

        // Calculate category spending for recurring expenses
        const recurringCategorySpending = new Map<string, number>();
        newRecurringExpenses.forEach(exp => {
          const current = recurringCategorySpending.get(exp.categoryId) || 0;
          recurringCategorySpending.set(exp.categoryId, current + exp.amount);
        });

        // Update categories with recurring expense spending
        const updatedCategories = prev.categories.map(cat => {
          const recurringSpent = recurringCategorySpending.get(cat.id) || 0;
          return { ...cat, spent: recurringSpent };
        });
        
        return {
          ...prev,
          expenses: newRecurringExpenses, // Populate recurring expenses
          categories: updatedCategories,
          monthlyArchives: updatedArchives.sort((a, b) => 
            b.month.localeCompare(a.month) // Sort newest first
          ),
        };
      } else {
        // Create new archive
        const categorySnapshots = prev.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          allocated: cat.allocated,
          spent: cat.spent,
          color: cat.color,
        }));
        
        const totalSpent = prev.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        const archive: MonthlyArchive = {
          id: generateId(),
          month,
          expenses: [...prev.expenses], // Clone current expenses
          categorySnapshots,
          totalBudget: prev.totalBudget,
          totalSpent,
          archivedDate: new Date().toISOString(),
        };
        
        // Find recurring expenses from the archived month
        const recurringExpenses = prev.expenses.filter(exp => exp.isRecurring);
        
        // Create new expense entries for recurring expenses in the new month
        const newRecurringExpenses: Expense[] = recurringExpenses.map(exp => ({
          ...exp,
          id: generateId(), // New ID for the new month
          date: new Date().toISOString(), // Current date
          receiptImage: undefined, // Don't copy receipt images
        }));

        // Calculate category spending for recurring expenses
        const recurringCategorySpending = new Map<string, number>();
        newRecurringExpenses.forEach(exp => {
          const current = recurringCategorySpending.get(exp.categoryId) || 0;
          recurringCategorySpending.set(exp.categoryId, current + exp.amount);
        });

        // Update categories with recurring expense spending
        const updatedCategories = prev.categories.map(cat => {
          const recurringSpent = recurringCategorySpending.get(cat.id) || 0;
          return { ...cat, spent: recurringSpent };
        });

        // Add archive and populate recurring expenses for new month
        return {
          ...prev,
          expenses: newRecurringExpenses, // Populate recurring expenses
          categories: updatedCategories,
          monthlyArchives: [...existingArchives, archive].sort((a, b) => 
            b.month.localeCompare(a.month) // Sort newest first
          ),
        };
      }
    });
  };

  /**
   * Delete a monthly archive
   */
  const deleteArchive = (archiveId: string) => {
    setBudget((prev) => ({
      ...prev,
      monthlyArchives: (prev.monthlyArchives || []).filter(archive => archive.id !== archiveId),
    }));
  };

  /**
   * Update an expense within a specific archived month
   * If changing from recurring to non-recurring, removes it from all consecutive months
   */
  const updateArchivedExpense = (
    archiveId: string,
    expenseId: string,
    updates: Partial<Omit<Expense, 'id'>>
  ) => {
    setBudget((prev) => {
      // Find the original archive and expense
      const originalArchive = (prev.monthlyArchives || []).find(a => a.id === archiveId);
      if (!originalArchive) return prev;
      
      const originalExpense = originalArchive.expenses.find(exp => exp.id === expenseId);
      if (!originalExpense) return prev;
      
      // Check if changing from recurring to non-recurring, or marking as recurring
      const wasRecurring = originalExpense.isRecurring === true;
      const willBeRecurring = updates.isRecurring === true;
      const isUnmarkingRecurring = wasRecurring && !willBeRecurring;
      const isMarkingRecurring = !wasRecurring && willBeRecurring;

      // Get the month of the archive (format: YYYY-MM)
      const archiveMonth = originalArchive.month;
      const [archiveYear, archiveMonthNum] = archiveMonth.split('-').map(Number);
      
      // Get current month
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      // Generate all FOLLOWING months from archive month to current month (inclusive)
      // Note: We exclude the archive month itself - we only affect FOLLOWING months
      const monthsToRemoveFrom: string[] = [];
      if (isUnmarkingRecurring) {
        // Start from the month AFTER the archive month
        let year = archiveYear;
        let month = archiveMonthNum + 1;
        if (month > 12) {
          month = 1;
          year++;
        }
        
        // Generate all months from archive+1 to current month (inclusive)
        while (true) {
          const monthStr = `${year}-${String(month).padStart(2, '0')}`;
          monthsToRemoveFrom.push(monthStr);
          
          // Stop if we've reached the current month
          if (monthStr === currentMonthStr) break;
          
          // Move to next month
          month++;
          if (month > 12) {
            month = 1;
            year++;
          }
        }
      }
      
      // Generate FOLLOWING months to populate if marking as recurring
      // Note: We exclude the archive month itself - we only populate FOLLOWING months
      const monthsToPopulate: string[] = [];
      if (isMarkingRecurring) {
        // Start from the month AFTER the archive month
        let year = archiveYear;
        let month = archiveMonthNum + 1;
        if (month > 12) {
          month = 1;
          year++;
        }
        
        // Generate all months from archive+1 to current month (inclusive)
        while (true) {
          const monthStr = `${year}-${String(month).padStart(2, '0')}`;
          monthsToPopulate.push(monthStr);
          
          // Stop if we've reached the current month
          if (monthStr === currentMonthStr) break;
          
          // Move to next month
          month++;
          if (month > 12) {
            month = 1;
            year++;
          }
        }
      }

      // Update the expense in the original archive
      const updatedArchives = (prev.monthlyArchives || []).map((archive) => {
        if (archive.id !== archiveId) {
          // For other archives, remove recurring expenses if unmarking
          // Only remove from FOLLOWING months (not the archive month itself)
          if (isUnmarkingRecurring && monthsToRemoveFrom.includes(archive.month)) {
            // Remove matching recurring expenses (same description, category, amount)
            const expensesToKeep = archive.expenses.filter(exp => 
              !(exp.isRecurring === true &&
                exp.description === originalExpense.description &&
                exp.categoryId === originalExpense.categoryId &&
                exp.amount === originalExpense.amount)
            );
            
            // Recalculate category spending
            const categoryMap = new Map<string, number>();
            expensesToKeep.forEach((exp) => {
              const currentSpent = categoryMap.get(exp.categoryId) || 0;
              categoryMap.set(exp.categoryId, currentSpent + exp.amount);
            });

            // Update category snapshots with new spending
            const updatedCategorySnapshots = archive.categorySnapshots.map((cat) => ({
              ...cat,
              spent: categoryMap.get(cat.id) || 0,
            }));

            // Recalculate total spent
            const totalSpent = expensesToKeep.reduce((sum, exp) => sum + exp.amount, 0);

            return {
              ...archive,
              expenses: expensesToKeep,
              categorySnapshots: updatedCategorySnapshots,
              totalSpent,
            };
          }
          return archive;
        }

        // Update the expense in the original archive
        const updatedExpenses = archive.expenses.map((exp) =>
          exp.id === expenseId ? { ...exp, ...updates } : exp
        );

        // Recalculate category spending
        const categoryMap = new Map<string, number>();
        updatedExpenses.forEach((exp) => {
          const currentSpent = categoryMap.get(exp.categoryId) || 0;
          categoryMap.set(exp.categoryId, currentSpent + exp.amount);
        });

        // Update category snapshots with new spending
        const updatedCategorySnapshots = archive.categorySnapshots.map((cat) => ({
          ...cat,
          spent: categoryMap.get(cat.id) || 0,
        }));

        // Recalculate total spent
        const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        return {
          ...archive,
          expenses: updatedExpenses,
          categorySnapshots: updatedCategorySnapshots,
          totalSpent,
        };
      });

      // Remove from current month expenses if unmarking recurring
      // Only remove if current month is in the following months (not the archive month itself)
      let newCurrentExpenses = [...prev.expenses];
      let updatedCurrentCategories = [...prev.categories];
      
      if (isUnmarkingRecurring && monthsToRemoveFrom.includes(currentMonthStr)) {
        // Remove matching recurring expenses from current month
        // Match by description, category, and amount (regardless of isRecurring flag)
        newCurrentExpenses = prev.expenses.filter(exp => 
          !(exp.description === originalExpense.description &&
            exp.categoryId === originalExpense.categoryId &&
            exp.amount === originalExpense.amount &&
            exp.isRecurring === true) // Only remove if it's marked as recurring
        );
        
        // Recalculate category spending for current month
        const categorySpending = new Map<string, number>();
        newCurrentExpenses.forEach(exp => {
          const current = categorySpending.get(exp.categoryId) || 0;
          categorySpending.set(exp.categoryId, current + exp.amount);
        });
        
        updatedCurrentCategories = prev.categories.map(cat => {
          const spent = categorySpending.get(cat.id) || 0;
          return { ...cat, spent };
        });
      }
      
      // If marking as recurring, populate for all months from archive month to current month
      let finalArchives = updatedArchives;
      let finalExpenses = newCurrentExpenses;
      let finalCategories = updatedCurrentCategories;
      
      if (isMarkingRecurring && monthsToPopulate.length > 0) {
        // Get the updated expense from the archive we just updated
        const updatedArchive = updatedArchives.find(a => a.id === archiveId);
        const updatedExpense = updatedArchive?.expenses.find(exp => exp.id === expenseId) || { ...originalExpense, ...updates };
        
        // Populate for archived FOLLOWING months (excluding the source archive month)
        finalArchives = updatedArchives.map(archive => {
          // Skip if not in range (monthsToPopulate only contains following months, not archive month)
          if (!monthsToPopulate.includes(archive.month)) {
            return archive;
          }
          
          // Check if expense already exists in this archive
          const expenseExists = archive.expenses.some(exp => 
            exp.description === updatedExpense.description && 
            exp.categoryId === updatedExpense.categoryId &&
            exp.amount === updatedExpense.amount
          );
          
          if (expenseExists) return archive; // Don't duplicate
          
          // Add the recurring expense to this archive
          const [year, month] = archive.month.split('-').map(Number);
          const archiveDate = new Date(year, month - 1, 1);
          
          const newExpense: Expense = {
            ...updatedExpense,
            id: generateId(),
            date: archiveDate.toISOString(),
            receiptImage: undefined,
            isRecurring: true,
          };
          
          // Recalculate category spending
          const categoryMap = new Map<string, number>();
          [...archive.expenses, newExpense].forEach(exp => {
            const current = categoryMap.get(exp.categoryId) || 0;
            categoryMap.set(exp.categoryId, current + exp.amount);
          });
          
          const updatedCategorySnapshots = archive.categorySnapshots.map(cat => ({
            ...cat,
            spent: categoryMap.get(cat.id) || cat.spent,
          }));
          
          const newTotalSpent = [...archive.expenses, newExpense].reduce((sum, exp) => sum + exp.amount, 0);
          
          return {
            ...archive,
            expenses: [...archive.expenses, newExpense],
            categorySnapshots: updatedCategorySnapshots,
            totalSpent: newTotalSpent,
          };
        });
        
        // Populate for current month if there are months to populate (archive month is before current month)
        if (monthsToPopulate.length > 0 && monthsToPopulate.includes(currentMonthStr)) {
          // Check if expense already exists in current expenses
          const expenseExists = finalExpenses.some(exp => 
            exp.description === updatedExpense.description && 
            exp.categoryId === updatedExpense.categoryId &&
            exp.amount === updatedExpense.amount
          );
          
          if (!expenseExists) {
            // Add to current month expenses
            const newExpense: Expense = {
              ...updatedExpense,
              id: generateId(),
              date: new Date().toISOString(),
              receiptImage: undefined,
              isRecurring: true,
            };
            
            finalExpenses = [...finalExpenses, newExpense];
            
            // Update category spending
            const categorySpending = new Map<string, number>();
            finalExpenses.forEach(exp => {
              const current = categorySpending.get(exp.categoryId) || 0;
              categorySpending.set(exp.categoryId, current + exp.amount);
            });
            
            finalCategories = prev.categories.map(cat => {
              const spent = categorySpending.get(cat.id) || 0;
              return { ...cat, spent };
            });
          }
        }
      }

      return {
        ...prev,
        expenses: finalExpenses,
        categories: finalCategories,
        monthlyArchives: finalArchives,
      };
    });
  };

  /**
   * Delete an expense from a specific archived month
   */
  const deleteArchivedExpense = async (archiveId: string, expenseId: string) => {
    // Find the expense to check for receipt image
    const archive = budget.monthlyArchives?.find((a) => a.id === archiveId);
    const expenseToDelete = archive?.expenses.find((exp) => exp.id === expenseId);

    // Delete receipt image if it exists in Firebase Storage
    if (expenseToDelete?.receiptImage && StorageService.isStorageURL(expenseToDelete.receiptImage)) {
      try {
        await StorageService.deleteReceiptImage(expenseToDelete.receiptImage);
      } catch (error) {
        console.error('Error deleting receipt image:', error);
      }
    }

    setBudget((prev) => {
      const updatedArchives = (prev.monthlyArchives || []).map((archive) => {
        if (archive.id !== archiveId) return archive;

        // Remove the expense
        const updatedExpenses = archive.expenses.filter((exp) => exp.id !== expenseId);

        // Recalculate category spending
        const categoryMap = new Map<string, number>();
        updatedExpenses.forEach((exp) => {
          const currentSpent = categoryMap.get(exp.categoryId) || 0;
          categoryMap.set(exp.categoryId, currentSpent + exp.amount);
        });

        // Update category snapshots with new spending
        const updatedCategorySnapshots = archive.categorySnapshots.map((cat) => ({
          ...cat,
          spent: categoryMap.get(cat.id) || 0,
        }));

        // Recalculate total spent
        const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        return {
          ...archive,
          expenses: updatedExpenses,
          categorySnapshots: updatedCategorySnapshots,
          totalSpent,
        };
      });

      return {
        ...prev,
        monthlyArchives: updatedArchives,
      };
    });
  };

  /**
   * Mark a historic expense as recurring and populate it for all consecutive months and current month
   */
  const markExpenseAsRecurring = (archiveId: string, expenseId: string) => {
    setBudget((prev) => {
      const archive = (prev.monthlyArchives || []).find(a => a.id === archiveId);
      if (!archive) return prev;

      const expense = archive.expenses.find(exp => exp.id === expenseId);
      if (!expense) return prev;

      // Mark the expense as recurring in the archive
      const updatedArchives = (prev.monthlyArchives || []).map(a => {
        if (a.id !== archiveId) return a;
        
        const updatedExpenses = a.expenses.map(exp =>
          exp.id === expenseId ? { ...exp, isRecurring: true } : exp
        );
        
        return { ...a, expenses: updatedExpenses };
      });

      // Get the month of the archive (format: YYYY-MM)
      const archiveMonth = archive.month;
      const [archiveYear, archiveMonthNum] = archiveMonth.split('-').map(Number);
      
      // Get current month
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 1-12
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      // Generate all months from archive month to current month (inclusive)
      const monthsToPopulate: string[] = [];
      let year = archiveYear;
      let month = archiveMonthNum;
      
      while (true) {
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        monthsToPopulate.push(monthStr);
        
        // Stop if we've reached the current month
        if (monthStr === currentMonthStr) break;
        
        // Move to next month
        month++;
        if (month > 12) {
          month = 1;
          year++;
        }
      }

      // Populate the expense for each month (excluding the original archive month)
      const finalArchives = updatedArchives.map(a => {
        // Skip the original archive (already updated)
        if (a.id === archiveId) return a;
        
        // Check if this archive is in the range of months to populate
        const shouldPopulate = monthsToPopulate.includes(a.month) && a.month !== archiveMonth;
        
        if (!shouldPopulate) return a;
        
        // Check if expense with same description already exists in this archive
        const expenseExists = a.expenses.some(exp => 
          exp.description === expense.description && 
          exp.categoryId === expense.categoryId &&
          exp.amount === expense.amount
        );
        
        if (expenseExists) return a; // Don't duplicate
        
        // Add the recurring expense to this archive
        // Create date for the first day of the archive month
        const [year, month] = a.month.split('-').map(Number);
        const archiveDate = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
        
        const newExpense: Expense = {
          ...expense,
          id: generateId(), // New ID for each month
          date: archiveDate.toISOString(),
          receiptImage: undefined, // Don't copy receipt images
          isRecurring: true,
        };
        
        // Recalculate category spending for this archive
        const categoryMap = new Map<string, number>();
        [...a.expenses, newExpense].forEach(exp => {
          const current = categoryMap.get(exp.categoryId) || 0;
          categoryMap.set(exp.categoryId, current + exp.amount);
        });
        
        const updatedCategorySnapshots = a.categorySnapshots.map(cat => ({
          ...cat,
          spent: categoryMap.get(cat.id) || cat.spent,
        }));
        
        const newTotalSpent = [...a.expenses, newExpense].reduce((sum, exp) => sum + exp.amount, 0);
        
        return {
          ...a,
          expenses: [...a.expenses, newExpense],
          categorySnapshots: updatedCategorySnapshots,
          totalSpent: newTotalSpent,
        };
      });

      // Populate for current month if it's after the archive month
      let finalArchivesWithCurrent = [...finalArchives];
      const currentMonthArchive = finalArchivesWithCurrent.find(a => a.month === currentMonthStr);
      let newCurrentExpenses = [...prev.expenses];
      let updatedCurrentCategories = [...prev.categories];
      
      // Check if current month should be populated (it's after the archive month)
      // Compare months: if currentMonthStr > archiveMonth, we should populate
      const shouldPopulateCurrentMonth = currentMonthStr > archiveMonth;
      
      if (shouldPopulateCurrentMonth) {
        if (currentMonthArchive) {
          // Current month is archived - check if expense was already added in the map above
          const expenseInArchive = currentMonthArchive.expenses.some(exp => 
            exp.description === expense.description && 
            exp.categoryId === expense.categoryId &&
            exp.amount === expense.amount &&
            exp.isRecurring === true
          );
          
          if (!expenseInArchive) {
            // It wasn't added, let's add it now
            const [year, month] = currentMonthStr.split('-').map(Number);
            const archiveDate = new Date(year, month - 1, 1);
            
            const newExpense: Expense = {
              ...expense,
              id: generateId(),
              date: archiveDate.toISOString(),
              receiptImage: undefined,
              isRecurring: true,
            };
            
            // Update the archive
            const archiveIndex = finalArchivesWithCurrent.findIndex(a => a.id === currentMonthArchive.id);
            if (archiveIndex >= 0) {
              const updatedArchive = finalArchivesWithCurrent[archiveIndex];
              const categoryMap = new Map<string, number>();
              [...updatedArchive.expenses, newExpense].forEach(exp => {
                const current = categoryMap.get(exp.categoryId) || 0;
                categoryMap.set(exp.categoryId, current + exp.amount);
              });
              
              const updatedCategorySnapshots = updatedArchive.categorySnapshots.map(cat => ({
                ...cat,
                spent: categoryMap.get(cat.id) || cat.spent,
              }));
              
              const newTotalSpent = [...updatedArchive.expenses, newExpense].reduce((sum, exp) => sum + exp.amount, 0);
              
              finalArchivesWithCurrent[archiveIndex] = {
                ...updatedArchive,
                expenses: [...updatedArchive.expenses, newExpense],
                categorySnapshots: updatedCategorySnapshots,
                totalSpent: newTotalSpent,
              };
            }
          }
        } else {
          // Current month is not archived, add to current expenses
          // Check if expense already exists in current expenses (but not marked as recurring)
          const existingExpenseIndex = prev.expenses.findIndex(exp => 
            exp.description === expense.description && 
            exp.categoryId === expense.categoryId &&
            exp.amount === expense.amount
          );
          
          if (existingExpenseIndex >= 0) {
            // Expense exists - mark it as recurring if it's not already
            const existingExpense = prev.expenses[existingExpenseIndex];
            if (!existingExpense.isRecurring) {
              newCurrentExpenses = prev.expenses.map((exp, idx) =>
                idx === existingExpenseIndex ? { ...exp, isRecurring: true } : exp
              );
              
              // Category spending doesn't change, just the recurring flag
              updatedCurrentCategories = prev.categories;
            }
          } else {
            // Expense doesn't exist - add it as recurring
            const newExpense: Expense = {
              ...expense,
              id: generateId(),
              date: new Date().toISOString(),
              receiptImage: undefined,
              isRecurring: true,
            };
            
            newCurrentExpenses = [...prev.expenses, newExpense];
            
            // Update category spending
            const categorySpending = new Map<string, number>();
            newCurrentExpenses.forEach(exp => {
              const current = categorySpending.get(exp.categoryId) || 0;
              categorySpending.set(exp.categoryId, current + exp.amount);
            });
            
            updatedCurrentCategories = prev.categories.map(cat => {
              const spent = categorySpending.get(cat.id) || 0;
              return { ...cat, spent };
            });
          }
        }
      }

      return {
        ...prev,
        expenses: newCurrentExpenses,
        categories: updatedCurrentCategories,
        monthlyArchives: finalArchivesWithCurrent,
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
      monthlyArchives: [],
    });
  };

  return {
    budget,
    isLoading,
    error,
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
    archiveCurrentMonth,
    deleteArchive,
    updateArchivedExpense,
    deleteArchivedExpense,
    markExpenseAsRecurring,
    resetBudget,
  };
};

