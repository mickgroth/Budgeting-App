/**
 * Represents a budget category with allocation and spending tracking
 */
export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
  order: number; // Display order (lower numbers appear first)
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
  isRecurring?: boolean; // If true, this expense will be automatically populated for new months
}

/**
 * Represents a reimbursement entry (reduces spending in a category)
 */
export interface Reimbursement {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // ISO date string
  receiptImage?: string; // Firebase Storage URL or Base64 data URL
}

/**
 * Represents additional income entry (non-salary income for the month)
 */
export interface AdditionalIncome {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO date string
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
 * Snapshot of a category's state in a given month
 */
export interface CategorySnapshot {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
}

/**
 * Unified data structure for a single month (current or historic)
 * All months use the same structure for consistency
 */
export interface MonthData {
  id: string;
  month: string; // Format: YYYY-MM
  expenses: Expense[];
  reimbursements: Reimbursement[];
  additionalIncome: AdditionalIncome[];
  categories: BudgetCategory[]; // Each month has its own category state
  salaryIncome: number;
  createdDate: string; // ISO date string when this month was created
}

/**
 * Archived expenses and budget data for a specific month
 * @deprecated - Keeping for backward compatibility during migration
 */
export interface MonthlyArchive {
  id: string;
  month: string; // Format: YYYY-MM
  expenses: Expense[];
  reimbursements: Reimbursement[];
  additionalIncome: AdditionalIncome[];
  categorySnapshots: CategorySnapshot[];
  salaryIncome: number; // Snapshot of salary income for this month
  totalBudget: number; // Total budget (salary + additional income)
  totalSpent: number;
  archivedDate: string; // ISO date string
}

/**
 * Represents the overall budget state (NEW UNIFIED STRUCTURE)
 */
export interface Budget {
  salaryIncome: number; // Fixed monthly salary income (applies to all months)
  months: MonthData[]; // All months (current and historic) use same structure
  savings: MonthlySavings[];
  longTermGoals: LongTermSavingsGoal[];
  
  // DEPRECATED FIELDS - kept for backward compatibility during migration
  additionalIncome?: AdditionalIncome[];
  totalBudget?: number;
  categories?: BudgetCategory[];
  expenses?: Expense[];
  reimbursements?: Reimbursement[];
  monthlyArchives?: MonthlyArchive[];
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

