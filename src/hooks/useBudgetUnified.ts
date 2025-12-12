import { useState, useEffect, useRef } from 'react';
import { Budget, MonthData, BudgetCategory, Expense, Reimbursement, AdditionalIncome, MonthlySavings, LongTermSavingsGoal, CATEGORY_COLORS, MonthlyArchive } from '../types/budget';
import { generateId } from '../utils/budgetHelpers';
import { FirebaseService } from '../services/firebaseService';
import { StorageService } from '../services/storageService';

// Helper: Get current month in YYYY-MM format
const getCurrentMonthString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Default initial state
const defaultBudget: Budget = {
  salaryIncome: 0,
  months: [],
  savings: [],
  longTermGoals: [],
};

export function useBudgetUnified(userId: string | null) {
  const [budget, setBudget] = useState<Budget>(defaultBudget);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasMigrated = useRef(false);

  // Load budget from Firebase
  useEffect(() => {
    if (!userId) {
      setBudget(defaultBudget);
      setIsLoading(false);
      return;
    }

    const loadBudget = async () => {
      try {
        setIsLoading(true);
        const firebaseBudget = await FirebaseService.getBudget(userId);
        
        if (firebaseBudget) {
          // Check if this is old format (has monthlyArchives) or new format (has months)
          if (firebaseBudget.months && firebaseBudget.months.length > 0) {
            // New format - use directly
            setBudget({
              salaryIncome: firebaseBudget.salaryIncome || 0,
              months: firebaseBudget.months || [],
              savings: firebaseBudget.savings || [],
              longTermGoals: (firebaseBudget.longTermGoals || []).map((goal: any, index: number) => ({
                ...goal,
                order: goal.order !== undefined ? goal.order : index,
              })),
            });
          } else {
            // Old format - migrate
            const migratedBudget = migrateOldBudgetToUnified(firebaseBudget);
            setBudget(migratedBudget);
            
            // Save migrated data back to Firebase
            if (!hasMigrated.current) {
              hasMigrated.current = true;
              await FirebaseService.saveBudget(userId, migratedBudget);
            }
          }
        } else {
          // No budget exists - create initial month
          const initialMonth = createNewMonth(getCurrentMonthString(), 0, []);
          const initialBudget: Budget = {
            salaryIncome: 0,
            months: [initialMonth],
            savings: [],
            longTermGoals: [],
          };
          setBudget(initialBudget);
        }
      } catch (err) {
        console.error('Error loading budget:', err);
        setError('Failed to load budget');
      } finally {
        setIsLoading(false);
      }
    };

    loadBudget();
  }, [userId]);

  // Save budget to Firebase whenever it changes
  useEffect(() => {
    if (!userId || isLoading) return;

    const saveBudget = async () => {
      try {
        await FirebaseService.saveBudget(userId, budget);
      } catch (err) {
        console.error('Error saving budget:', err);
        setError('Failed to save budget');
      }
    };

    const timeoutId = setTimeout(saveBudget, 500);
    return () => clearTimeout(timeoutId);
  }, [budget, userId, isLoading]);

  // Auto-create new month if we're in a new month
  useEffect(() => {
    if (isLoading || !budget.months.length) return;

    const currentMonth = getCurrentMonthString();
    const monthExists = budget.months.some(m => m.month === currentMonth);

    if (!monthExists) {
      // We're in a new month! Create it
      autoCreateNewMonth(currentMonth);
    }
  }, [budget, isLoading]);

  /**
   * Migrate old budget format to unified format
   */
  function migrateOldBudgetToUnified(oldBudget: any): Budget {
    const migratedMonths: MonthData[] = [];
    
    // Migrate current month data
    if (oldBudget.expenses || oldBudget.categories) {
      const currentMonthStr = getCurrentMonthString();
      const currentMonth: MonthData = {
        id: generateId(),
        month: currentMonthStr,
        expenses: oldBudget.expenses || [],
        reimbursements: oldBudget.reimbursements || [],
        additionalIncome: oldBudget.additionalIncome || [],
        categories: (oldBudget.categories || []).map((cat: any, index: number) => ({
          ...cat,
          order: cat.order !== undefined ? cat.order : index,
        })),
        salaryIncome: oldBudget.salaryIncome || oldBudget.totalBudget || 0,
        createdDate: new Date().toISOString(),
      };
      migratedMonths.push(currentMonth);
    }

    // Migrate archived months
    if (oldBudget.monthlyArchives) {
      oldBudget.monthlyArchives.forEach((archive: MonthlyArchive) => {
        const monthData: MonthData = {
          id: archive.id,
          month: archive.month,
          expenses: archive.expenses || [],
          reimbursements: archive.reimbursements || [],
          additionalIncome: archive.additionalIncome || [],
          categories: (archive.categorySnapshots || []).map((snap: any, index: number) => ({
            id: snap.id,
            name: snap.name,
            allocated: snap.allocated,
            spent: snap.spent,
            color: snap.color,
            order: index,
          })),
          salaryIncome: archive.salaryIncome || 0,
          createdDate: archive.archivedDate || new Date().toISOString(),
        };
        migratedMonths.push(monthData);
      });
    }

    return {
      salaryIncome: oldBudget.salaryIncome || oldBudget.totalBudget || 0,
      months: migratedMonths,
      savings: oldBudget.savings || [],
      longTermGoals: (oldBudget.longTermGoals || []).map((goal: any, index: number) => ({
        ...goal,
        order: goal.order !== undefined ? goal.order : index,
      })),
    };
  }

  /**
   * Create a new month with given data
   */
  function createNewMonth(
    monthStr: string,
    salaryIncome: number,
    baseCategories: BudgetCategory[],
    recurringExpenses: Expense[] = []
  ): MonthData {
    return {
      id: generateId(),
      month: monthStr,
      expenses: recurringExpenses,
      reimbursements: [],
      additionalIncome: [],
      categories: baseCategories.map(cat => ({ ...cat, spent: 0 })),
      salaryIncome,
      createdDate: new Date().toISOString(),
    };
  }

  /**
   * Auto-create a new month with recurring expenses from previous month
   */
  function autoCreateNewMonth(monthStr: string) {
    setBudget(prev => {
      // Get the most recent month
      const sortedMonths = [...prev.months].sort((a, b) => b.month.localeCompare(a.month));
      const previousMonth = sortedMonths[0];

      if (!previousMonth) {
        // No previous month, create empty
        const newMonth = createNewMonth(monthStr, prev.salaryIncome, []);
        return { ...prev, months: [...prev.months, newMonth] };
      }

      // Get recurring expenses from previous month
      const recurringExpenses = previousMonth.expenses
        .filter(exp => exp.isRecurring)
        .map(exp => ({
          ...exp,
          id: generateId(),
          date: new Date().toISOString(),
        }));

      // Create new month with same categories (reset spent to 0) and recurring expenses
      const newMonth = createNewMonth(
        monthStr,
        prev.salaryIncome,
        previousMonth.categories,
        recurringExpenses
      );

      return {
        ...prev,
        months: [...prev.months, newMonth],
      };
    });
  }

  /**
   * Get a specific month's data
   */
  function getMonth(monthStr: string): MonthData | undefined {
    return budget.months.find(m => m.month === monthStr);
  }

  /**
   * Get the current month (today)
   */
  function getCurrentMonth(): MonthData | undefined {
    return getMonth(getCurrentMonthString());
  }

  /**
   * Update salary income (applies to all future months)
   */
  function setSalaryIncome(amount: number) {
    setBudget(prev => ({
      ...prev,
      salaryIncome: Math.max(0, amount),
    }));
  }

  /**
   * Add category to a specific month
   */
  function addCategoryToMonth(monthStr: string, name: string, allocated: number, color: string) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        const newCategory: BudgetCategory = {
          id: generateId(),
          name,
          allocated: Math.max(0, allocated),
          spent: 0,
          color,
          order: month.categories.length,
        };

        return {
          ...month,
          categories: [...month.categories, newCategory],
        };
      }),
    }));
  }

  /**
   * Update category in a specific month
   */
  function updateCategoryInMonth(
    monthStr: string,
    categoryId: string,
    updates: Partial<BudgetCategory>
  ) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        return {
          ...month,
          categories: month.categories.map(cat =>
            cat.id === categoryId ? { ...cat, ...updates } : cat
          ),
        };
      }),
    }));
  }

  /**
   * Delete category from a specific month
   */
  function deleteCategoryFromMonth(monthStr: string, categoryId: string) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        return {
          ...month,
          categories: month.categories.filter(cat => cat.id !== categoryId),
          expenses: month.expenses.filter(exp => exp.categoryId !== categoryId),
          reimbursements: month.reimbursements.filter(reimb => reimb.categoryId !== categoryId),
        };
      }),
    }));
  }

  /**
   * Reorder category in a specific month
   */
  function reorderCategoryInMonth(monthStr: string, categoryId: string, direction: 'up' | 'down') {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        const categories = [...month.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
        const index = categories.findIndex(cat => cat.id === categoryId);
        
        if (index === -1) return month;
        if (direction === 'up' && index === 0) return month;
        if (direction === 'down' && index === categories.length - 1) return month;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [categories[index], categories[targetIndex]] = [categories[targetIndex], categories[index]];

        // Reassign order values
        const reorderedCategories = categories.map((cat, idx) => ({
          ...cat,
          order: idx,
        }));

        return {
          ...month,
          categories: reorderedCategories,
        };
      }),
    }));
  }

  /**
   * Add expense to a specific month
   */
  function addExpenseToMonth(
    monthStr: string,
    categoryId: string,
    amount: number,
    description: string,
    receiptImage?: string,
    isRecurring?: boolean
  ) {
    const newExpense: Expense = {
      id: generateId(),
      categoryId,
      amount: Math.max(0, amount),
      description: description.trim(),
      date: new Date().toISOString(),
      receiptImage,
      isRecurring,
    };

    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        // Update category spending
        const updatedCategories = month.categories.map(cat => {
          if (cat.id !== categoryId) return cat;
          
          const categoryExpenses = [...month.expenses, newExpense].filter(e => e.categoryId === cat.id);
          const categoryReimbursements = month.reimbursements.filter(r => r.categoryId === cat.id);
          const totalExpenses = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalReimbursements = categoryReimbursements.reduce((sum, r) => sum + r.amount, 0);
          
          return {
            ...cat,
            spent: Math.max(0, totalExpenses - totalReimbursements),
          };
        });

        return {
          ...month,
          expenses: [...month.expenses, newExpense],
          categories: updatedCategories,
        };
      }),
    }));
  }

  /**
   * Update expense in a specific month
   */
  function updateExpenseInMonth(
    monthStr: string,
    expenseId: string,
    updates: Partial<Expense>
  ) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        const updatedExpenses = month.expenses.map(exp =>
          exp.id === expenseId ? { ...exp, ...updates } : exp
        );

        // Recalculate spending for affected categories
        const updatedCategories = month.categories.map(cat => {
          const categoryExpenses = updatedExpenses.filter(e => e.categoryId === cat.id);
          const categoryReimbursements = month.reimbursements.filter(r => r.categoryId === cat.id);
          const totalExpenses = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalReimbursements = categoryReimbursements.reduce((sum, r) => sum + r.amount, 0);
          
          return {
            ...cat,
            spent: Math.max(0, totalExpenses - totalReimbursements),
          };
        });

        return {
          ...month,
          expenses: updatedExpenses,
          categories: updatedCategories,
        };
      }),
    }));
  }

  /**
   * Delete expense from a specific month
   */
  function deleteExpenseFromMonth(monthStr: string, expenseId: string) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        const updatedExpenses = month.expenses.filter(exp => exp.id !== expenseId);

        // Recalculate spending
        const updatedCategories = month.categories.map(cat => {
          const categoryExpenses = updatedExpenses.filter(e => e.categoryId === cat.id);
          const categoryReimbursements = month.reimbursements.filter(r => r.categoryId === cat.id);
          const totalExpenses = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalReimbursements = categoryReimbursements.reduce((sum, r) => sum + r.amount, 0);
          
          return {
            ...cat,
            spent: Math.max(0, totalExpenses - totalReimbursements),
          };
        });

        return {
          ...month,
          expenses: updatedExpenses,
          categories: updatedCategories,
        };
      }),
    }));
  }

  /**
   * Add reimbursement to a specific month
   */
  function addReimbursementToMonth(
    monthStr: string,
    categoryId: string,
    amount: number,
    description: string,
    receiptImage?: string
  ) {
    const newReimbursement: Reimbursement = {
      id: generateId(),
      categoryId,
      amount: Math.max(0, amount),
      description: description.trim(),
      date: new Date().toISOString(),
      receiptImage,
    };

    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        // Update category spending
        const updatedCategories = month.categories.map(cat => {
          if (cat.id !== categoryId) return cat;
          
          const categoryExpenses = month.expenses.filter(e => e.categoryId === cat.id);
          const categoryReimbursements = [...month.reimbursements, newReimbursement].filter(r => r.categoryId === cat.id);
          const totalExpenses = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalReimbursements = categoryReimbursements.reduce((sum, r) => sum + r.amount, 0);
          
          return {
            ...cat,
            spent: Math.max(0, totalExpenses - totalReimbursements),
          };
        });

        return {
          ...month,
          reimbursements: [...month.reimbursements, newReimbursement],
          categories: updatedCategories,
        };
      }),
    }));
  }

  /**
   * Update reimbursement in a specific month
   */
  function updateReimbursementInMonth(
    monthStr: string,
    reimbursementId: string,
    updates: Partial<Reimbursement>
  ) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        const updatedReimbursements = month.reimbursements.map(reimb =>
          reimb.id === reimbursementId ? { ...reimb, ...updates } : reimb
        );

        // Recalculate spending for affected categories
        const updatedCategories = month.categories.map(cat => {
          const categoryExpenses = month.expenses.filter(e => e.categoryId === cat.id);
          const categoryReimbursements = updatedReimbursements.filter(r => r.categoryId === cat.id);
          const totalExpenses = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalReimbursements = categoryReimbursements.reduce((sum, r) => sum + r.amount, 0);
          
          return {
            ...cat,
            spent: Math.max(0, totalExpenses - totalReimbursements),
          };
        });

        return {
          ...month,
          reimbursements: updatedReimbursements,
          categories: updatedCategories,
        };
      }),
    }));
  }

  /**
   * Delete reimbursement from a specific month
   */
  function deleteReimbursementFromMonth(monthStr: string, reimbursementId: string) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        const updatedReimbursements = month.reimbursements.filter(reimb => reimb.id !== reimbursementId);

        // Recalculate spending
        const updatedCategories = month.categories.map(cat => {
          const categoryExpenses = month.expenses.filter(e => e.categoryId === cat.id);
          const categoryReimbursements = updatedReimbursements.filter(r => r.categoryId === cat.id);
          const totalExpenses = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
          const totalReimbursements = categoryReimbursements.reduce((sum, r) => sum + r.amount, 0);
          
          return {
            ...cat,
            spent: Math.max(0, totalExpenses - totalReimbursements),
          };
        });

        return {
          ...month,
          reimbursements: updatedReimbursements,
          categories: updatedCategories,
        };
      }),
    }));
  }

  /**
   * Add additional income to a specific month
   */
  function addAdditionalIncomeToMonth(
    monthStr: string,
    amount: number,
    description: string
  ) {
    const newIncome: AdditionalIncome = {
      id: generateId(),
      amount: Math.max(0, amount),
      description: description.trim(),
      date: new Date().toISOString(),
    };

    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        return {
          ...month,
          additionalIncome: [...month.additionalIncome, newIncome],
        };
      }),
    }));
  }

  /**
   * Update additional income in a specific month
   */
  function updateAdditionalIncomeInMonth(
    monthStr: string,
    incomeId: string,
    updates: Partial<AdditionalIncome>
  ) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        return {
          ...month,
          additionalIncome: month.additionalIncome.map(inc =>
            inc.id === incomeId ? { ...inc, ...updates } : inc
          ),
        };
      }),
    }));
  }

  /**
   * Delete additional income from a specific month
   */
  function deleteAdditionalIncomeFromMonth(monthStr: string, incomeId: string) {
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        return {
          ...month,
          additionalIncome: month.additionalIncome.filter(inc => inc.id !== incomeId),
        };
      }),
    }));
  }

  /**
   * Import categories to a specific month
   */
  async function importCategoriesToMonth(monthStr: string, file: File) {
    const categoriesData = await StorageService.parseExcelFile(file);
    
    setBudget(prev => ({
      ...prev,
      months: prev.months.map(month => {
        if (month.month !== monthStr) return month;

        const newCategories: BudgetCategory[] = categoriesData.map((cat, index) => ({
          id: generateId(),
          name: cat.name,
          allocated: cat.allocated,
          spent: 0,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
          order: month.categories.length + index,
        }));

        return {
          ...month,
          categories: [...month.categories, ...newCategories],
        };
      }),
    }));
  }

  // Savings and Long-term goals remain global (not per-month)
  function setSavingsGoal(month: string, goal: number, actual: number, notes?: string) {
    setBudget(prev => {
      const existingSaving = prev.savings.find(s => s.month === month);
      
      if (existingSaving) {
        return {
          ...prev,
          savings: prev.savings.map(s =>
            s.month === month ? { ...s, goal, actual, notes } : s
          ),
        };
      }

      const newSaving: MonthlySavings = {
        id: generateId(),
        month,
        goal,
        actual,
        notes,
      };

      return {
        ...prev,
        savings: [...prev.savings, newSaving],
      };
    });
  }

  function getCurrentMonthSavingsGoal(): number {
    const currentMonth = getCurrentMonthString();
    const saving = budget.savings.find(s => s.month === currentMonth);
    return saving?.goal || 0;
  }

  function calculateActualSavings(): number {
    const currentMonth = getCurrentMonthString();
    const monthData = getMonth(currentMonth);
    
    if (!monthData) return 0;

    const totalAdditionalIncome = monthData.additionalIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const totalBudget = monthData.salaryIncome + totalAdditionalIncome;
    const totalSpent = getTotalSpent(monthData.categories);
    const savingsGoal = getCurrentMonthSavingsGoal();
    
    return totalBudget - totalSpent - savingsGoal;
  }

  function addLongTermGoal(name: string, targetAmount: number, notes?: string) {
    const newGoal: LongTermSavingsGoal = {
      id: generateId(),
      name,
      targetAmount,
      currentAmount: 0,
      createdDate: new Date().toISOString(),
      order: budget.longTermGoals.length,
      notes,
    };

    setBudget(prev => ({
      ...prev,
      longTermGoals: [...prev.longTermGoals, newGoal],
    }));
  }

  function updateLongTermGoal(goalId: string, updates: Partial<LongTermSavingsGoal>) {
    setBudget(prev => ({
      ...prev,
      longTermGoals: prev.longTermGoals.map(goal =>
        goal.id === goalId ? { ...goal, ...updates } : goal
      ),
    }));
  }

  function deleteLongTermGoal(goalId: string) {
    setBudget(prev => ({
      ...prev,
      longTermGoals: prev.longTermGoals.filter(goal => goal.id !== goalId),
    }));
  }

  return {
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
  };
}

// Helper function to calculate total spent
function getTotalSpent(categories: BudgetCategory[]): number {
  return categories.reduce((sum, cat) => sum + cat.spent, 0);
}

