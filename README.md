# Budget Tracker App

A modern, cloud-based budgeting application that helps you manage your finances with powerful features like receipt scanning, savings tracking, historic data analysis, and multi-month comparisons.

## Features

### 🔐 Authentication & User Management
- **User Authentication**: Secure sign up and sign in with Firebase Authentication
- **User Profiles**: Personalized user profiles with avatar display
- **Private Data**: Each user has their own secure budget data
- **Session Management**: Automatic login state persistence

### 💰 Budget Management
- **Monthly Budget Management**: Set and track your monthly budget with dynamic month display
- **Budget Consumption Bar**: Visual progress bar showing real-time spending for the current month
- **Custom Categories**: Create, edit, and delete budget categories with custom names and colors
- **Budget Allocation**: Allocate specific amounts to each category
- **Auto-Calculated Spending**: Category spent amounts are automatically calculated from logged expenses
- **Visual Progress Bars**: See spending progress at a glance with color-coded progress bars (green, orange, red)
- **Budget Warnings**: Get alerts when categories are over budget or when total allocation exceeds budget

### 📁 Data Import & Export
- **Excel Import**: Upload Excel files (.xlsx, .xls, .csv) to automatically create multiple budget categories
- **Google Sheets Import**: Copy and paste data directly from Google Sheets
- **Bulk Category Creation**: Create multiple categories at once from structured data

### 📸 Smart Receipt Management
- **Receipt Scanning**: Upload receipt photos (JPEG/PNG/HEIC) with automatic OCR text extraction
- **Auto-Extract Amount**: Automatically detects and extracts the total amount from receipts
- **Auto-Extract Merchant**: Pulls merchant/vendor name as the expense description
- **Smart Category Matching**: Intelligently suggests the best matching category based on receipt content
- **Receipt Storage**: Cloud storage for all receipt images via Firebase Storage
- **Receipt Viewing**: Click on any expense to view the original receipt image
- **HEIC Support**: Automatic conversion of iPhone HEIC images to JPEG
- **Multiple Formats**: Supports JPEG, PNG, WebP, and HEIC formats

### 💵 Expense Tracking
- **Expense Logging**: Log individual expenses with descriptions and automatic category updates
- **Expense Editing**: Edit previously logged expenses (description, amount, category)
- **Expense Deletion**: Remove expenses with automatic category recalculation
- **Expense History**: View all logged expenses with timestamps and category information
- **Category Filtering**: Filter expenses by category to view spending patterns
- **Real-time Updates**: Instant category updates as you add, edit, or delete expenses

### 💎 Savings Features
- **Savings Tracker**: Comprehensive savings management with past, current, and future months
- **Monthly Savings Goals**: Set monthly savings goals with optional notes
- **Actual Savings Calculation**: Automatic calculation of achieved savings based on spending
- **Long-Term Savings Goals**: Create and track multi-month savings goals
- **Goal Progress Tracking**: Visual progress bars showing percentage toward long-term goals
- **Smart Forecasting**: Estimated completion dates based on average monthly savings
- **Goal Prioritization**: Reorder goals with drag-and-drop functionality
- **Savings Integration**: Monthly savings goals are reflected in available budget calculations

### 📊 Historic Data & Analytics
- **End of Month Archiving**: Archive current month's expenses and budget data
- **Historic Expenses View**: Browse archived data by month
- **Edit Archived Data**: Modify archived expenses after archiving
- **Delete Archives**: Remove archived months if needed
- **Monthly Comparison**: Compare spending across multiple months
- **Interactive Charts**: Visualize spending trends with line charts
- **Category Analysis**: Compare spending by category across different months
- **Table & Chart Views**: Toggle between detailed tables and visual charts
- **Multi-Month Selection**: Select specific months to compare

### ☁️ Cloud Features
- **Firebase Firestore**: Cloud database for all budget data
- **Firebase Storage**: Secure cloud storage for receipt images
- **Real-time Sync**: Changes are saved immediately to the cloud
- **Cross-Device Access**: Access your budget from any device
- **No Data Loss**: Data persists even if you clear your browser cache
- **User Isolation**: Each user's data is completely private and separate

### 📱 User Experience
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional interface with gradient designs
- **Touch-Friendly**: All buttons meet accessibility standards
- **Mobile Optimized**: Special optimizations for mobile devices
- **Intuitive Navigation**: Easy switching between different views
- **Success Feedback**: Visual confirmation of actions
- **Error Handling**: Clear error messages and recovery options

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

### 1. Sign Up / Sign In 🔐
**First-time Users:**
- Click "Sign Up" on the authentication screen
- Enter your name, email, and password (minimum 6 characters)
- Click "Sign Up" to create your account
- You'll be automatically signed in

**Returning Users:**
- Enter your email and password
- Click "Sign In" to access your budget

**Sign Out:**
- Click your profile avatar (top right)
- Select "Sign Out" from the dropdown menu

### 2. Set Your Monthly Budget
- **Double-click** the "Monthly Budget" card at the top to edit
- Enter your budget amount for the current month
- Press **Enter** to save or **Escape** to cancel
- The budget progress bar will dynamically show "{Current Month} Budget Consumption"

### 3. Set Savings Goals 💰

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

### 4. Add Categories

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

### 5. Log Expenses with Receipt Scanning 📸
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

### 6. View, Edit, and Filter Expense History
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

### 7. Edit Categories
- Click the edit button (✏️) on any category card
- Update category name or allocated budget
- **Note**: Spent amounts are automatically calculated from logged expenses and cannot be manually edited
- Changes are saved immediately

### 8. Delete Categories
- Click the delete button (🗑️) to remove a category
- Confirm the deletion in the dialog
- Associated expenses remain in history

### 9. Monitor Your Budget
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

### 10. End of Month - Archive Data 📦
When you're ready to start a fresh month:
- Click the "📦 End of Month" button on the main screen
- Select the month you want to archive (defaults to current month)
- Choose whether to keep the same budget for next month or start fresh
- **What gets archived:**
  - All current expenses
  - Budget snapshots for each category
  - Total budget and spending summary
- **What happens next:**
  - Current expenses are cleared (moved to archive)
  - You can optionally set a new budget
  - Start tracking expenses for the new month
- **Why archive?**
  - Keep your main view clean and focused on current month
  - Preserve historical data for analysis
  - Compare spending patterns across months

### 11. View Historic Data 📊
Access your archived monthly data:
- Click "📊 Historic Data" button on the main screen
- **Features:**
  - Browse expenses by month using the dropdown selector
  - View monthly budget summaries (total budget, allocated, spent)
  - See category breakdowns for each archived month
  - **Edit archived expenses**: Click ✏️ to modify description, amount, or category
  - **Delete archived expenses**: Click 🗑️ to remove individual expenses
  - **View receipts**: Click 📷 to see receipt images from archived expenses
  - **Delete entire archives**: Remove a complete month's archive if needed
  - **Filter by category**: Focus on specific spending categories
- Perfect for reviewing past spending habits and patterns

### 12. Compare Months 📈
Analyze spending trends across multiple months:
- From the Historic Data screen, click "📈 Compare Months"
- **Select Months:**
  - Check/uncheck months you want to compare
  - Use "Select All" or "Clear All" for quick selection
- **View Modes:**
  - **Table View**: Detailed side-by-side comparison with exact numbers
  - **Chart View**: Visual line graphs showing spending trends over time
- **Category Analysis:**
  - Compare spending by specific categories
  - Select categories to focus on particular spending areas
  - See which categories fluctuate most month-to-month
- **Insights:**
  - Total spending trends over time
  - Category-wise spending patterns
  - Budget vs. actual spending comparison
  - Identify spending spikes or savings opportunities

## Architecture

The application follows modern React best practices:

### Project Structure
```
src/
├── components/          # React components
│   ├── AddCategoryForm.tsx      # Form for creating new categories
│   ├── AddExpenseScreen.tsx     # Screen for logging expenses with receipt scanning
│   ├── ArchiveMonthModal.tsx    # Modal for archiving month data
│   ├── AuthScreen.tsx           # User authentication (sign up/sign in)
│   ├── BudgetSummary.tsx        # Budget overview statistics
│   ├── CategoryCard.tsx         # Individual category display
│   ├── ExpensesList.tsx         # Expense history list with filtering
│   ├── HistoricExpenses.tsx     # View and manage archived monthly data
│   ├── ImportBudgetExcel.tsx    # Excel/Google Sheets import functionality
│   ├── LineChart.tsx            # Interactive line chart for comparisons
│   ├── MonthlyComparison.tsx    # Multi-month comparison with charts
│   ├── SavingsTracker.tsx       # Monthly and long-term savings management
│   └── UserProfile.tsx          # User profile dropdown with logout
├── services/           # Firebase and external service integrations
│   ├── authService.ts          # Firebase Authentication wrapper
│   ├── firebaseService.ts      # Firestore database operations
│   └── storageService.ts       # Firebase Storage for receipts
├── hooks/              # Custom React hooks
│   ├── useBudget.ts            # Budget state management and Firebase sync
│   └── useBudget.test.ts       # Hook unit tests
├── types/              # TypeScript type definitions
│   └── budget.ts               # Budget, Category, Expense, Savings, Archive types
├── utils/              # Helper functions
│   └── budgetHelpers.ts        # Calculation and formatting utilities
├── config/             # Configuration files
│   └── firebase.ts             # Firebase configuration and initialization
├── App.tsx             # Main application component with view routing
├── App.css             # Application styles
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

### Key Design Principles

- **Separation of Concerns**: Components, business logic, services, and types are clearly separated
- **Type Safety**: Full TypeScript support for better development experience and fewer bugs
- **Custom Hooks**: Business logic is encapsulated in reusable hooks (useBudget)
- **Service Layer**: Firebase operations abstracted into dedicated service modules
- **Pure Functions**: Helper functions are stateless, testable, and easy to maintain
- **Cloud-First Architecture**: All data persisted to Firebase (Firestore + Storage)
- **User Privacy**: Complete data isolation - each user sees only their own data
- **Responsive Design**: Mobile-first approach with modern CSS Grid and Flexbox
- **Real-time Sync**: Changes saved immediately to cloud database
- **Optimistic UI**: Instant feedback with background synchronization

### Technologies Used

**Frontend:**
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with comprehensive type definitions
- **Vite**: Lightning-fast build tool and hot module replacement
- **CSS3**: Modern styling with custom properties, gradients, and animations

**Backend & Cloud Services:**
- **Firebase Authentication**: Secure user authentication and session management
- **Firebase Firestore**: NoSQL cloud database for budget data
- **Firebase Storage**: Cloud storage for receipt images

**Data Processing:**
- **Tesseract.js**: Client-side OCR for intelligent receipt scanning
- **heic2any**: Automatic HEIC to JPEG conversion for iPhone photos
- **XLSX (SheetJS)**: Excel file parsing for bulk category import

**Testing:**
- **Vitest**: Fast unit testing framework
- **@testing-library/react**: Component testing utilities

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

## Data Persistence & Security

All budget data is securely stored in Firebase with user-level isolation:

### Cloud Storage
- **Firebase Firestore**: All budget data stored in cloud database
- **Firebase Storage**: Receipt images stored securely in cloud storage
- **Automatic Sync**: Changes are persisted immediately to the cloud
- **Cross-Device Access**: Access your budget from any device
- **No Data Loss**: Data persists even if you clear browser cache

### User Privacy & Security
- **Private Data**: Each user has their own completely isolated budget data
- **Secure Authentication**: Firebase Authentication with email/password
- **Firestore Security Rules**: Database rules prevent unauthorized access
- **User-Specific Storage**: Receipt images stored in user-specific folders
- **No Data Sharing**: Your budget data is visible only to you

### How It Works
1. **Sign Up**: Create account with Firebase Authentication
2. **User ID**: Every user gets a unique identifier (UID)
3. **Data Isolation**: All budget data is stored under your user ID
4. **Secure Queries**: Firestore queries only return your own data
5. **Receipt Storage**: Images stored in `/receipts/{userId}/` folders

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
- **Export Data**: Export budget data to CSV/JSON formats
- **Budget Templates**: Predefined category templates for common budgets
- **Recurring Expenses**: Automatic tracking of recurring monthly expenses
- **Budget Period Options**: Switch between monthly, bi-weekly, or yearly budgets
- **AI Budget Recommendations**: Smart suggestions based on spending patterns
- **Expense Tags**: Add custom tags to expenses for better organization
- **Advanced Analytics**: Deeper insights with predictive analytics
- **Multi-language OCR**: Support for receipts in multiple languages
- **Shared Budgets**: Optional budget sharing with family members
- **Budget Alerts**: Email/SMS notifications for overspending
- **Category Icons**: Custom icons for each budget category
- **Dark Mode**: Dark theme option for better night-time viewing

## Deployment

### Prerequisites

Before deploying, you need to set up Firebase:

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Firebase Authentication (Email/Password provider)
   - Enable Cloud Firestore
   - Enable Firebase Storage

2. **Configure Firebase**
   - Get your Firebase configuration
   - Update `src/config/firebase.ts` with your config
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions

3. **Set Firestore Security Rules**
   - Configure rules to ensure user data isolation
   - See [FIX_FIRESTORE_RULES.md](./FIX_FIRESTORE_RULES.md) for security rules

### Deploy with Vercel (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign up/login (free)
   - Click "Add New Project" and import your GitHub repository
   - Vercel will auto-detect it's a Vite app
   - Click "Deploy"

3. **Access Your App**:
   - Vercel provides a URL like `https://budgeting-app-xyz.vercel.app`
   - Each user will need to sign up with their own account
   - All user data is private and isolated

### Alternative: Netlify

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com) and sign up
   - Import your repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Click "Deploy"

3. **Configure Environment** (if needed):
   - Add any environment variables for Firebase config
   - Netlify automatically handles Vite builds

### Important Notes

- **User Data**: Each user has completely private data - no sharing between users
- **Firebase Required**: The app requires Firebase to be properly configured
- **Authentication**: Users must sign up/sign in to use the app
- **No Backend Code**: Everything runs client-side with Firebase as the backend

## License

This project is open source and available for personal and commercial use.

## Contributing

Feel free to fork this project and submit pull requests for improvements.

