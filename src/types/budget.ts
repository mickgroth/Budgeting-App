/**
 * Represents a budget category with allocation and spending tracking
 */
export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

/**
 * Represents an individual expense entry
 */
export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // ISO date string
  receiptImage?: string; // Firebase Storage URL or Base64 data URL (for backward compatibility)
}

/**
 * Represents monthly savings goals and actual savings
 */
export interface MonthlySavings {
  id: string;
  month: string; // Format: YYYY-MM
  goal: number;
  actual: number;
  notes?: string;
}

/**
 * Represents long-term savings goals
 * Goals are stacked - only the first incomplete goal receives savings
 */
export interface LongTermSavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdDate: string; // ISO date string
  order: number; // Priority order - lower numbers are funded first
  notes?: string;
}

/**
 * Represents the overall budget state
 */
export interface Budget {
  totalBudget: number;
  categories: BudgetCategory[];
  expenses: Expense[];
  savings: MonthlySavings[];
  longTermGoals: LongTermSavingsGoal[];
}

/**
 * Available colors for category visualization
 */
export const CATEGORY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
] as const;

