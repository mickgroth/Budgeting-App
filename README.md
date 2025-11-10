# Budget Tracker App

A modern, intuitive budgeting application that helps you manage your finances by breaking down your overall budget into customizable categories.

## Features

- **Monthly Budget Management**: Set and track your monthly budget with dynamic month display
- **Budget Consumption Bar**: Visual progress bar showing real-time spending for the current month
- **Savings Tracker**: Set monthly savings goals and track actual savings across multiple months
- **Long-Term Savings Goals**: Create and track progress toward long-term goals with automatic forecasting
- **Savings Goal Integration**: Savings goals are automatically subtracted from available budget
- **Custom Categories**: Create, edit, and delete budget categories with custom names
- **Excel & Google Sheets Import**: Upload Excel files or paste data from Google Sheets to automatically create multiple budget categories
- **Budget Allocation**: Allocate specific amounts to each category
- **Receipt Scanning**: Upload receipt photos (JPEG/PNG/HEIC) and automatically extract amounts using OCR
- **Receipt Storage**: Automatically saves uploaded receipt images with each expense
- **Receipt Viewing**: Click on any expense with a receipt to view the original image
- **Expense Tracking**: Log individual expenses with descriptions and automatic category updates
- **Expense Editing**: Edit previously logged expenses (description, amount, category)
- **Expense History**: View all logged expenses with timestamps and category information
- **Auto-Calculated Spending**: Category spent amounts are automatically calculated from logged expenses
- **Category Filtering**: Filter expenses by category to view spending patterns
- **Spending Tracking**: Track spending in each category and monitor progress
- **Visual Progress Bars**: See spending progress at a glance with color-coded progress bars
- **Budget Warnings**: Get alerts when categories are over budget or when total allocation exceeds budget
- **Persistent Storage**: All data is automatically saved to localStorage
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with intuitive user experience

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

Create an optimized production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Running Tests

Run the test suite:
```bash
npm test
```

## How to Use

### 1. Set Your Monthly Budget
- **Double-click** the "Monthly Budget" card at the top to edit
- Enter your budget amount for the current month
- Press **Enter** to save or **Escape** to cancel
- The budget progress bar will dynamically show "{Current Month} Budget Consumption"

### 2. Set Savings Goals 💰

**Monthly Savings Goals:**
- Click "💰 Savings Tracker" button on the main screen
- View a grid of months (3 past, current, and 6 future months)
- Click "+ Set Goal" on any month card to define a savings goal
- Enter:
  - **Savings Goal Amount**: How much you want to save that month
  - **Notes** (optional): Purpose of savings (e.g., "Vacation fund", "Emergency fund")
- The app shows how much will be available for expenses (Budget - Savings Goal)
- For past and current months, the app calculates your **actual savings** automatically
- Formula: `Actual Savings = Total Budget - Savings Goal - Total Spent`
- Clear status messages show whether you achieved your savings goal or fell short

**Long-Term Savings Goals:** 🎯
- Scroll down on the Savings Tracker screen to the "Long-Term Savings Goals" section
- Click "+ Add Long-Term Goal" to create a new goal
- Enter:
  - **Goal Name**: e.g., "Emergency Fund", "House Down Payment", "Vacation to Europe"
  - **Target Amount**: Total amount you want to save
  - **Notes** (optional): Additional details about the goal
- **Automatic Progress Tracking**: The app automatically calculates progress based on your actual monthly savings
- **Smart Forecasting**: See estimated completion date based on your average monthly savings
- **Visual Progress**: Color-coded progress bars show how close you are to your goal
  - 🟢 Green (100%): Goal achieved!
  - 🔵 Blue (75-99%): Almost there
  - 🟠 Orange (50-74%): Halfway there
  - 🔴 Red (<50%): Just getting started
- **Edit & Delete**: Update goals or remove them when no longer needed

### 3. Add Categories

**Option 1: Add Manually**
- Click the "+ Add Category" button
- Enter a category name (e.g., "Groceries", "Rent", "Entertainment")
- Set the allocated amount for this category
- Click "Add Category" to save

**Option 2: Import from Excel or Google Sheets** 📊

*From Excel File:*
- Click "📁 Choose Excel File" in the Import section
- Upload an Excel file (.xlsx, .xls, or .csv) with:
  - **Column A**: Category Name
  - **Column B**: Allocated Amount
- The app will automatically create all categories from the file

*From Google Sheets:*
- Click "📋 Paste from Google Sheets"
- In your Google Sheet, select the cells (including category names and amounts)
- Copy the cells (Ctrl+C or Cmd+C)
- Paste into the text area (Ctrl+V or Cmd+V)
- Click "Import Data"

Example format:
```
| Category Name    | Allocated Amount |
|------------------|------------------|
| Groceries        | 500              |
| Transportation   | 300              |
| Entertainment    | 150              |
```

### 4. Log Expenses with Receipt Scanning 📸
- Click the "+ Add Expense" button on the main screen
- **Option 1: Scan Receipt (Recommended)** 🤖
  - Tap "Upload Receipt" to take a photo or upload an image
  - The app automatically extracts:
    - ✅ **Amount** (e.g., $71.65)
    - ✅ **Merchant name** as description (e.g., "FedEx Ground")
    - ✅ **Best matching category** (e.g., auto-selects "Shipping" for FedEx)
  - Review and adjust any fields if needed
- **Option 2: Enter Manually**
  - Skip the receipt upload and enter the information directly
- Click "Add Expense" to save
- The expense is automatically added to the category's spent amount
- View real-time category information while adding expenses

**🎯 Smart Category Matching:**
The app intelligently matches receipts to your categories:
- FedEx/UPS/USPS → Shipping/Delivery
- Starbucks/Restaurants → Food/Dining
- Shell/Chevron/Gas stations → Transportation/Fuel
- Walmart/Grocery stores → Groceries
- Office supply stores → Office Supplies
- And many more patterns!

### 5. View, Edit, and Filter Expense History
- Scroll down on the main screen to see all logged expenses
- **Filter by category** using the dropdown menu above the expense list
- View expense count and total for the selected filter
- Expenses are sorted by date (most recent first)
- Each expense shows:
  - Description
  - 📄 Receipt indicator (if a receipt was uploaded)
  - Category (color-coded)
  - Amount
  - Date and time
- **Edit expenses**: Click the ✏️ button to edit description, amount, or category
- **View receipts**: Click the 📷 button to view the original receipt image
- **Delete expenses**: Click the 🗑️ button to remove an expense

### 6. Edit Categories
- Click the edit button (✏️) on any category card
- Update category name or allocated budget
- **Note**: Spent amounts are automatically calculated from logged expenses and cannot be manually edited
- Changes are saved immediately

### 6. Delete Categories
- Click the delete button (🗑️) to remove a category
- Confirm the deletion in the dialog
- Associated expenses remain in history

### 7. Monitor Your Budget
- The **progress bar** at the top shows your monthly consumption with color coding:
  - 🟢 Green (0-89%): Healthy spending
  - 🟠 Orange (90-99%): Approaching limit
  - 🔴 Red (100%+): Over budget
- The **summary cards** show:
  - Monthly Budget (double-click to edit)
  - Total Allocated (amount assigned to categories)
  - Remaining (unallocated budget)
  - Total Spent (actual spending across all categories)
- Each category card displays:
  - Allocated amount
  - Spent amount (automatically calculated from expenses)
  - Remaining amount
  - Progress bar showing spending percentage
  - Warning indicators if over budget

## Architecture

The application follows modern React best practices:

### Project Structure
```
src/
├── components/          # React components
│   ├── AddCategoryForm.tsx     # Form for creating new categories
│   ├── AddExpenseScreen.tsx    # Screen for logging expenses
│   ├── BudgetSummary.tsx       # Budget overview statistics
│   ├── CategoryCard.tsx        # Individual category display
│   └── ExpensesList.tsx        # Expense history list
├── hooks/              # Custom React hooks
│   ├── useBudget.ts           # Budget state management
│   └── useBudget.test.ts      # Hook unit tests
├── types/              # TypeScript type definitions
│   └── budget.ts              # Budget, Category, and Expense types
├── utils/              # Helper functions
│   └── budgetHelpers.ts       # Calculation utilities
├── App.tsx             # Main application component with routing
├── App.css             # Application styles
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

### Key Design Principles

- **Separation of Concerns**: Components, logic, and types are clearly separated
- **Type Safety**: Full TypeScript support for better development experience
- **Custom Hooks**: Business logic is encapsulated in reusable hooks
- **Pure Functions**: Helper functions are stateless and testable
- **Persistent State**: Automatic localStorage synchronization
- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox

### Technologies Used

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Vitest**: Unit testing framework
- **Tesseract.js**: Client-side OCR for receipt scanning
- **heic2any**: Automatic HEIC to JPEG conversion
- **XLSX (SheetJS)**: Excel file parsing for category import
- **CSS3**: Modern styling with custom properties

## How Savings Integration Works

The savings feature seamlessly integrates with your budget:

### Monthly Savings

1. **Budget Display**: When you set a savings goal for the current month, it appears in the stat cards:
   - "Set Aside for Savings" card shows your monthly savings goal
   - "Allocated" includes both category allocations and savings
   - "Available to Spend" shows what's left after allocations and spending

2. **Automatic Calculation**: As you log expenses, the app automatically calculates your actual savings:
   - If you spend less than your available budget, you achieve your savings goal
   - The remaining amount after expenses is your actual savings
   - Status messages show if you achieved your goal or how much you fell short

3. **Multi-Month View**: Track your savings performance over time:
   - **Past Months**: See actual savings achieved with clear success/shortfall indicators
   - **Current Month**: Real-time tracking as you add expenses
   - **Future Months**: Plan ahead by setting goals for upcoming months

### Long-Term Savings Goals

1. **Automatic Progress**: Your progress toward long-term goals is calculated automatically:
   - The app sums up all actual monthly savings since you created the goal
   - Progress updates in real-time as you achieve monthly savings

2. **Smart Forecasting**: The app predicts when you'll reach your goal:
   - Calculates your average monthly savings from past months
   - Estimates how many months until goal completion
   - Shows projected completion date (e.g., "Estimated: March 2026 (8 months)")

3. **Example**: Emergency Fund Goal
   - **Target**: $8,000
   - **Month 1**: Saved $600 → Progress: $600 (7.5%)
   - **Month 2**: Saved $800 → Progress: $1,400 (17.5%)
   - **Month 3**: Saved $700 → Progress: $2,100 (26.3%)
   - **Average**: $700/month
   - **Forecast**: Goal will be achieved in ~8 more months

## Mobile-Friendly Design

The app is fully optimized for mobile devices:
- **Responsive Layout**: Adapts seamlessly to any screen size
- **Touch-Friendly**: All buttons meet the 44x44px minimum touch target
- **No Zoom on Input**: Input fields sized to prevent auto-zoom on iOS
- **Smooth Interactions**: Touch feedback on all interactive elements
- **Optimized Typography**: Text scales appropriately for readability
- **Landscape Support**: Special optimizations for landscape orientation
- **Pull-to-Refresh Prevention**: Prevents accidental page refreshes

## Data Persistence

All budget data is automatically saved to browser localStorage:
- Changes are persisted immediately
- Data survives page refreshes
- Each user's data is stored locally on their device
- No server or database required

## Browser Support

Works on all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Receipt Scanning Feature

The app includes intelligent receipt scanning powered by Tesseract.js:
- **Works Offline**: OCR processing happens entirely in your browser
- **Privacy First**: No data is sent to external servers
- **Smart Detection**: Automatically finds the total amount on receipts
- **Auto-Description**: Extracts merchant/vendor name as the expense description
- **Smart Categories**: Automatically selects the best matching category based on receipt content
- **Receipt Storage**: Automatically saves the receipt image with the expense
- **Receipt Viewing**: View original receipts anytime from the expense list
- **Multiple Formats**: Supports JPEG, PNG, WebP, HEIC
- **Auto-Convert HEIC**: Automatically converts iPhone HEIC images to JPEG
- **Mobile Optimized**: Use your phone camera to capture receipts instantly
- **Manual Override**: Edit any extracted information as needed

### Supported Image Formats:
- **JPEG/JPG** - Standard photos (✅ Works everywhere)
- **PNG** - Screenshots and scans (✅ Works everywhere)
- **WebP** - Modern compressed format (✅ Works everywhere)
- **HEIC/HEIF** - iPhone photos (✅ Auto-converts to JPEG)

### Tips for Best Results:
- Ensure good lighting when taking photos
- Keep the receipt flat and centered
- Make sure the total amount is clearly visible
- Works best with standard receipt formats
- Any format works - HEIC is automatically converted!

### iPhone Users (HEIC Support):
The app automatically converts HEIC images to JPEG for you!

**What happens:**
1. Upload your iPhone photo (HEIC format)
2. App shows "Converting HEIC image..." 
3. Converts to JPEG automatically
4. Scans the receipt

**If conversion fails** (rare, some browsers):
- Change iPhone camera to: Settings → Camera → Formats → "Most Compatible"
- Or share the photo (it auto-converts when shared)

## Future Enhancements

Possible features for future versions:
- Export data to CSV/JSON
- Import data from files
- Multiple budget profiles
- Budget templates
- Recurring expenses
- Data visualization with charts
- Budget period (monthly/yearly)
- Budget recommendations
- Receipt storage and management
- Search and filter expenses
- Expense tags and notes
- Budget analytics and insights
- Multi-language OCR support

## License

This project is open source and available for personal and commercial use.

## Contributing

Feel free to fork this project and submit pull requests for improvements.

