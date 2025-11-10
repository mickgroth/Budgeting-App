# Setup User Authentication

This guide will walk you through enabling Firebase Authentication and securing your app so each user has their own budget data.

## Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **budgeting-app-cbc8b**
3. In the left sidebar, click on **Authentication** (under "Build")
4. Click **"Get started"** if you haven't set up Authentication yet

### Enable Email/Password Authentication

1. Go to the **Sign-in method** tab
2. Click on **"Email/Password"**
3. Toggle **"Enable"** to ON
4. Click **"Save"**

That's it! Email/Password authentication is now enabled.

## Step 2: Update Firestore Security Rules

Now you need to update your Firestore security rules so that:
- Each user can only access their own budget data
- Users must be logged in to read/write data

1. Go to **Firestore Database** → **Rules** tab
2. Replace the existing rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Each user has their own budget document in the budgets collection
    match /budgets/{userId} {
      // Allow read/write only if the user is authenticated
      // and the document ID matches their user ID
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"** to save the rules

### What these rules do:

- `request.auth != null` — User must be logged in
- `request.auth.uid == userId` — User can only access their own data
- Collection is now `budgets` instead of `budget`
- Each user has a document with their userId as the document ID

## Step 3: Test the Authentication

1. Push your code changes to GitHub (to trigger a new deployment)
2. Or rebuild locally: `npm run build`
3. Open your app
4. You should see the login/signup screen
5. Create a new account:
   - Enter your name
   - Enter your email
   - Create a password (at least 6 characters)
6. After signing up, you'll see the budget app
7. Your data is now tied to your account!

## Step 4: Create Account for Your Girlfriend

1. Share the app URL with your girlfriend
2. She should click "Don't have an account? Sign up"
3. She enters her information and creates her account
4. She'll have her own separate budget

## How It Works

### Separate Data Per User

- **You**: Your budget is stored in `budgets/{your-user-id}`
- **Your girlfriend**: Her budget is stored in `budgets/{her-user-id}`
- You each see only your own data
- No data is shared between users

### Authentication Flow

1. User opens app → sees login/signup screen
2. User creates account or logs in
3. App loads their budget data from Firestore
4. All budget operations (add category, expense, etc.) are saved to their document
5. User can log out (click profile icon → Log Out)

## Security Features

✅ **Password protected**: Each user needs a password to access their data
✅ **Isolated data**: Users can only see their own budget
✅ **Firestore security**: Database rules enforce access control
✅ **No shared data**: Each user has completely separate budgets

## Troubleshooting

### "Missing or insufficient permissions" error

If you see this error:
1. Make sure you've updated the Firestore security rules (Step 2)
2. Make sure you've published the rules
3. Try logging out and back in

### Can't create account

If account creation fails:
1. Make sure Email/Password is enabled in Firebase Authentication
2. Check the browser console for error messages
3. Make sure password is at least 6 characters

### Old data disappeared

If your existing budget data disappeared:
- Your data was in the old `budget/budget-data` document
- New data is in `budgets/{userId}`
- Old data is still there, but not accessible by the new system
- You can manually migrate data if needed (see Migration Guide below)

## Optional: Migrate Old Data

If you want to keep your existing budget data:

1. Go to Firebase Console → Firestore Database
2. Find the `budget/budget-data` document
3. Copy the data
4. Create a new document in `budgets` collection
5. Use your user ID as the document ID
6. Paste the copied data
7. Refresh your app

Your old data will now appear in the authenticated app!

## What's Next?

- Both you and your girlfriend can now use the app independently
- Each person has their own login and budget
- Data is secure and private
- You can both access the app from any device by logging in

