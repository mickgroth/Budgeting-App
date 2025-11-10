# How to Check if Firestore Database is Enabled

Follow these steps to verify that Firestore is enabled in your Firebase project:

## Step 1: Go to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **budgeting-app-cbc8b**

## Step 2: Check for Firestore Database

1. In the left sidebar, look for **"Build"** section
2. Look for **"Firestore Database"** (it might be called "Firestore Database" or just "Firestore")
3. Click on it

## What You Should See:

### ✅ If Firestore is Enabled:
- You'll see a page with your Firestore database
- You might see:
  - A data viewer (showing collections and documents)
  - An empty database (if you haven't added data yet)
  - Or existing data if you've already used the app
- You'll see tabs like: **Data**, **Rules**, **Indexes**, **Usage**

### ❌ If Firestore is NOT Enabled:
- You'll see a message like: "Cloud Firestore isn't set up for this project"
- Or: "Create database" button
- You'll need to enable it (see steps below)

## Step 3: Enable Firestore (If Not Enabled)

If you don't see the database, follow these steps:

1. Click **"Create database"** button
2. Choose **"Start in test mode"** (for now - you can secure it later)
   - This allows read/write access for 30 days
   - Perfect for development and testing
3. Select a **location** for your database:
   - Choose the region closest to you
   - Common options: `us-central`, `us-east1`, `europe-west`, etc.
4. Click **"Enable"**
5. Wait a few seconds for the database to be created

## Step 4: Verify It's Working

After enabling Firestore:

1. You should see the Firestore Database page
2. You should see a message like: "Cloud Firestore has been created"
3. The **Data** tab should show an empty database (no collections yet)
4. You can now use your app - it will automatically create collections when you add data

## Quick Test

You can also test if Firestore is working by:

1. Start your app: `npm run dev`
2. Open the app in your browser
3. Try adding a category or expense
4. Go back to Firebase Console → Firestore Database → Data tab
5. You should see a new collection called `budget` with a document `budget-data`

## Troubleshooting

### "Permission denied" errors:
- Make sure Firestore is in "test mode" (allows read/write for 30 days)
- Or check the **Rules** tab in Firestore to see your security rules

### Can't find Firestore in the sidebar:
- Make sure you're in the correct Firebase project
- Try refreshing the page
- Look for "Firestore Database" under the "Build" section

### Still having issues?
- Check the browser console for specific error messages
- Make sure your Firebase project is active (not deleted or suspended)

