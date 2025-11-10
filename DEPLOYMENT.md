# Deployment Guide

This guide will help you deploy your budgeting app so it's accessible on the web.

## Firebase Setup (Required)

The app uses Firebase Firestore to store data, so you'll need to set up Firebase first.

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter a project name (e.g., "budgeting-app")
   - Enable Google Analytics (optional)
   - Click "Create project"

### 2. Enable Firestore Database

1. In your Firebase project, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for now - you can secure it later)
4. Select a location for your database (choose closest to you)
5. Click "Enable"

### 3. Get Your Firebase Configuration

1. Go to **Project Settings** (gear icon) → **General** tab
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "Budgeting App")
5. Click "Register app"
6. **Copy the Firebase configuration object** - you'll need these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### 4. Set Up Environment Variables

**For Local Development:**

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

**For Deployment (Vercel/Netlify):**

You'll add these same environment variables in your hosting platform (see deployment steps below).

## Quick Deploy with Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy your Vite app. It's free and takes just a few minutes.

### Option 1: Deploy via Vercel Website (No Command Line)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign up/login (free account)

3. **Click "Add New Project"**

4. **Import your GitHub repository**:
   - Select your `Budgeting-App` repository
   - Vercel will auto-detect it's a Vite app

5. **Configure the project**:
   - Framework Preset: Vite (should be auto-detected)
   - Build Command: `npm run build` (should be auto-filled)
   - Output Directory: `dist` (should be auto-filled)
   - Install Command: `npm install` (should be auto-filled)

6. **Add Firebase Environment Variables**:
   - Before deploying, click "Environment Variables"
   - Add all 6 Firebase variables:
     - `VITE_FIREBASE_API_KEY` = your Firebase API key
     - `VITE_FIREBASE_AUTH_DOMAIN` = your Firebase auth domain
     - `VITE_FIREBASE_PROJECT_ID` = your Firebase project ID
     - `VITE_FIREBASE_STORAGE_BUCKET` = your Firebase storage bucket
     - `VITE_FIREBASE_MESSAGING_SENDER_ID` = your messaging sender ID
     - `VITE_FIREBASE_APP_ID` = your Firebase app ID
   - Make sure to select "Production", "Preview", and "Development" for each variable

7. **Click "Deploy"**

8. **Wait 1-2 minutes** for deployment to complete

9. **Get your URL**: Vercel will give you a URL like `https://budgeting-app-xyz.vercel.app`

10. **Share the URL** with your girlfriend! 🎉

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project? No (first time)
   - Project name: `budgeting-app` (or your choice)
   - Directory: `./` (current directory)
   - Override settings? No

5. **Your app will be deployed** and you'll get a URL!

### Updating Your Deployment

Every time you push to GitHub, Vercel will automatically redeploy your app with the latest changes!

Or manually deploy:
```bash
vercel --prod
```

## Alternative: Deploy with Netlify

1. **Push your code to GitHub** (if not already)

2. **Go to [netlify.com](https://netlify.com)** and sign up/login

3. **Click "Add new site" → "Import an existing project"**

4. **Connect to GitHub** and select your repository

5. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

6. **Add Firebase Environment Variables**:
   - Before deploying, go to "Advanced" → "New variable"
   - Add all 6 Firebase variables (same as Vercel above)
   - Make sure to add them for "Production" and "Deploy previews"

7. **Click "Deploy site"**

8. **Get your URL**: Netlify will give you a URL like `https://random-name-123.netlify.app`

**Note:** Both you and your girlfriend will see the same data since it's stored in Firebase!

## Important Notes

### Data Storage
- The app uses **Firebase Firestore**, which means:
  - **Shared data**: Both you and your girlfriend will see the same budget data
  - **Real-time sync**: Changes made by one person appear instantly for the other
  - **Cloud storage**: Data is stored in the cloud, accessible from any device
  - **No data loss**: Data persists even if you clear your browser cache

### Custom Domain (Optional)
Both Vercel and Netlify allow you to add a custom domain:
- Vercel: Go to Project Settings → Domains
- Netlify: Go to Site Settings → Domain Management

### Environment Variables
The app requires Firebase environment variables to work. Make sure to add them:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment Variables

Required variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Troubleshooting

### Build Fails
- Make sure all dependencies are in `package.json`
- Check that `npm run build` works locally first
- Review build logs in Vercel/Netlify dashboard

### App Doesn't Load
- Check that the build completed successfully
- Verify the output directory is `dist`
- Check browser console for errors

### Need Help?
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com

