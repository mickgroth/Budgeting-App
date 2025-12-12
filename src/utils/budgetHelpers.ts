import { Budget, BudgetCategory } from '../types/budget';

/**
 * Calculate the total allocated amount across all categories
 */
export const getTotalAllocated = (categories: BudgetCategory[]): number => {
  return categories.reduce((sum, category) => sum + category.allocated, 0);
};

/**
 * Calculate the total spent amount across all categories
 */
export const getTotalSpent = (categories: BudgetCategory[]): number => {
  return categories.reduce((sum, category) => sum + category.spent, 0);
};

/**
 * Calculate the total budget (salary + additional income)
 */
export const getCalculatedTotalBudget = (budget: Budget): number => {
  const additionalTotal = budget.additionalIncome.reduce((sum, income) => sum + income.amount, 0);
  return budget.salaryIncome + additionalTotal;
};

/**
 * Calculate the remaining budget (total - allocated)
 */
export const getRemainingBudget = (budget: Budget): number => {
  const totalBudget = getCalculatedTotalBudget(budget);
  return totalBudget - getTotalAllocated(budget.categories);
};

/**
 * Calculate the percentage of budget allocated
 */
export const getAllocatedPercentage = (budget: Budget): number => {
  const totalBudget = getCalculatedTotalBudget(budget);
  if (totalBudget === 0) return 0;
  return (getTotalAllocated(budget.categories) / totalBudget) * 100;
};

/**
 * Calculate the percentage spent for a specific category
 */
export const getCategorySpentPercentage = (category: BudgetCategory): number => {
  if (category.allocated === 0) return 0;
  return (category.spent / category.allocated) * 100;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Capitalize the first letter of each word
 */
export const capitalizeWords = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

