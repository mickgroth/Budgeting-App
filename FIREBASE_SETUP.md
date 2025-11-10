# Firebase Environment Variables Setup Guide

This guide will walk you through setting up Firebase environment variables for both local development and deployment.

## Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the **gear icon** (⚙️) → **Project Settings**
4. Scroll down to the **"Your apps"** section
5. If you haven't added a web app yet:
   - Click the **Web icon** (`</>`)
   - Register your app with a nickname (e.g., "Budgeting App")
   - Click "Register app"
6. You'll see a configuration object that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
7. **Copy these values** - you'll need them in the next steps

## Step 2: Local Development Setup

### Create `.env` file

1. In your project root directory (same level as `package.json`), create a file named `.env`
2. Copy the template from `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` in your editor
4. Replace the placeholder values with your actual Firebase configuration:

   ```
   VITE_FIREBASE_API_KEY=AIzaSy...your-actual-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

### Important Notes for Local Development:

- **Never commit `.env` to git** - it's already in `.gitignore`
- **Restart your dev server** after creating/updating `.env`:
  ```bash
  # Stop the server (Ctrl+C) and restart
  npm run dev
  ```
- The `.env` file should be in the **root directory** (same level as `package.json`)

## Step 3: Deployment Setup

### For Vercel:

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable one by one:
   - Click **"Add New"**
   - Name: `VITE_FIREBASE_API_KEY`
   - Value: Your Firebase API key
   - Select environments: **Production**, **Preview**, and **Development** (check all three)
   - Click **"Save"**
5. Repeat for all 6 variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. **Redeploy** your app (Vercel will automatically redeploy when you add environment variables, or you can trigger a redeploy manually)

### For Netlify:

1. Go to your site on [Netlify Dashboard](https://app.netlify.com/)
2. Click on your site
3. Go to **Site settings** → **Build & deploy** → **Environment variables**
4. Click **"Add variable"**
5. Add each variable:
   - Key: `VITE_FIREBASE_API_KEY`
   - Value: Your Firebase API key
   - Scope: Select **"All scopes"** (or specific scopes if you prefer)
   - Click **"Add variable"**
6. Repeat for all 6 variables
7. **Trigger a new deploy** (go to **Deploys** tab → **Trigger deploy** → **Deploy site**)

## Step 4: Verify It's Working

### Local Development:
1. Start your dev server: `npm run dev`
2. Open the app in your browser
3. Check the browser console - you should **NOT** see Firebase configuration errors
4. Try adding a category or expense - it should save to Firebase

### Deployment:
1. After adding environment variables, wait for the deployment to complete
2. Visit your deployed URL
3. The app should load without errors
4. Try adding data - it should sync to Firebase

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that your API key is correct in `.env` (local) or environment variables (deployment)
- Make sure there are no extra spaces or quotes around the values
- Restart your dev server after changing `.env`

### "Firebase: Error (auth/unauthorized-domain)"
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add your deployment domain (e.g., `your-app.vercel.app`)

### Environment variables not working in deployment
- Make sure you added them for the correct environment (Production/Preview/Development)
- Trigger a new deployment after adding variables
- Check that variable names start with `VITE_` (required for Vite)

### Still having issues?
- Check the browser console for specific error messages
- Verify your Firebase project has Firestore enabled
- Make sure Firestore is in "test mode" or has proper security rules

