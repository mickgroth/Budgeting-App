# Firebase Data Storage Summary

This document outlines exactly what data is currently being saved to Firebase Firestore.

## Current Data Structure

All data is stored in a single Firestore document:
- **Collection**: `budget`
- **Document ID**: `budget-data`

The document contains a `Budget` object with the following structure:

## ✅ Data Being Saved

### 1. Budget Categories ✅
**Location**: `budget.categories[]`

Each category includes:
- `id`: Unique identifier
- `name`: Category name (e.g., "Groceries", "Transportation")
- `allocated`: Budgeted amount for this category
- `spent`: Amount spent (auto-calculated from expenses)
- `color`: Color code for visualization

**Example**:
```json
{
  "id": "cat123",
  "name": "Groceries",
  "allocated": 500,
  "spent": 250,
  "color": "#3B82F6"
}
```

### 2. All Logged Expenses (Including Receipt Attachments) ✅
**Location**: `budget.expenses[]`

Each expense includes:
- `id`: Unique identifier
- `categoryId`: Reference to the category
- `amount`: Expense amount
- `description`: Expense description
- `date`: ISO date string
- `receiptImage`: **Base64-encoded image data** (if receipt was uploaded)

**Example**:
```json
{
  "id": "exp456",
  "categoryId": "cat123",
  "amount": 71.65,
  "description": "FedEx Ground",
  "date": "2024-11-09T18:00:00.000Z",
  "receiptImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Note**: Receipt images are stored as Base64 data URLs. This means:
- ✅ Receipt images ARE saved to Firebase
- ✅ They're included in the expense object
- ⚠️ Base64 encoding increases storage size (but works for small images)
- ⚠️ Large images may hit Firestore document size limits (1MB per document)

### 3. Monthly Savings Goals ✅
**Location**: `budget.savings[]`

Each monthly savings entry includes:
- `id`: Unique identifier
- `month`: Month in YYYY-MM format (e.g., "2024-11")
- `goal`: Savings goal amount
- `actual`: Actual savings achieved
- `notes`: Optional notes

**Example**:
```json
{
  "id": "sav789",
  "month": "2024-11",
  "goal": 500,
  "actual": 450,
  "notes": "Emergency fund"
}
```

### 4. Long-Term Savings Goals ✅
**Location**: `budget.longTermGoals[]`

Each long-term goal includes:
- `id`: Unique identifier
- `name`: Goal name (e.g., "Emergency Fund")
- `targetAmount`: Target amount to save
- `currentAmount`: Current progress
- `createdDate`: ISO date string when goal was created
- `order`: Priority order (for sequential funding)
- `notes`: Optional notes

**Example**:
```json
{
  "id": "goal101",
  "name": "Emergency Fund",
  "targetAmount": 8000,
  "currentAmount": 2000,
  "createdDate": "2024-01-01T00:00:00.000Z",
  "order": 0,
  "notes": "6 months expenses"
}
```

### 5. Total Budget ✅
**Location**: `budget.totalBudget`

The overall monthly budget amount.

## Complete Data Structure

```typescript
{
  totalBudget: number,
  categories: BudgetCategory[],
  expenses: Expense[],
  savings: MonthlySavings[],
  longTermGoals: LongTermSavingsGoal[]
}
```

## How Data is Saved

1. **Automatic Saving**: Whenever the `budget` state changes, it's automatically saved to Firebase (debounced by 500ms)
2. **Real-time Sync**: Changes made by one user appear instantly for other users via Firebase real-time listeners
3. **Single Document**: All data is stored in one document for simplicity and atomic updates

## Storage Considerations

### Receipt Images
- Currently stored as Base64 data URLs in the expense object
- **Pros**: Simple, no additional storage service needed
- **Cons**: 
  - Increases document size
  - Firestore document limit is 1MB
  - May hit limits with many large images

### Recommendations for Future
If you encounter size limits or want to optimize:
1. **Use Firebase Storage** for receipt images instead of Base64
2. Store only the Storage URL in Firestore
3. This would allow unlimited image storage

## Verification

To verify what's being saved:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `budgeting-app-cbc8b`
3. Go to **Firestore Database** → **Data** tab
4. Click on the `budget` collection
5. Click on the `budget-data` document
6. You should see all the data fields listed above

