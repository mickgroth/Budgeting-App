# Fix: Vercel Deployment Not Saving to Firebase

## The Problem
Your deployed app shows "Failed to get document because the client is offline" - this means Firebase isn't connecting properly.

## The Solution: Add Environment Variables to Vercel

The most common cause is missing Firebase environment variables in Vercel.

### Step 1: Go to Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project: **Budgeting-App** (or whatever you named it)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add All 6 Firebase Environment Variables

Add each variable one by one:

1. **VITE_FIREBASE_API_KEY**
   - Value: `AIzaSyB05ZWdR9UyBekWmjjPsU5h57R5dramY04`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

2. **VITE_FIREBASE_AUTH_DOMAIN**
   - Value: `budgeting-app-cbc8b.firebaseapp.com`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **VITE_FIREBASE_PROJECT_ID**
   - Value: `budgeting-app-cbc8b`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

4. **VITE_FIREBASE_STORAGE_BUCKET**
   - Value: `budgeting-app-cbc8b.firebasestorage.app`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

5. **VITE_FIREBASE_MESSAGING_SENDER_ID**
   - Value: `1005301287005`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

6. **VITE_FIREBASE_APP_ID**
   - Value: `1:1005301287005:web:077ba34222797f88aba5b4`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

### Step 3: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger a new deployment

### Step 4: Verify

1. Wait for deployment to complete (1-2 minutes)
2. Visit your deployed URL
3. Open browser console (F12)
4. Check for Firebase errors
5. Try adding a category
6. Check Firebase Console to see if data is saved

## Alternative: Check if Variables Are Already Set

If you already added the variables:

1. Go to **Settings** → **Environment Variables**
2. Verify all 6 variables are there
3. Make sure they're enabled for **Production** environment
4. If they're missing, add them
5. If they're there but wrong, update them

## Still Not Working?

### Check Browser Console
1. Open your deployed app
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Look for:
   - `Firebase: Error (auth/invalid-api-key)` - means API key is wrong
   - `Firebase: Error (permission-denied)` - means Firestore rules need updating
   - `Failed to get document because the client is offline` - means Firebase isn't initializing

### Verify Firebase Config
In the browser console, type:
```javascript
console.log('Firebase Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

If it shows `undefined`, the environment variables aren't set correctly in Vercel.

### Check Network Tab
1. Open Developer Tools → **Network** tab
2. Filter by "firestore" or "firebase"
3. Try adding a category
4. Look for requests to Firebase
5. Check if they're:
   - ✅ **200 OK** - Success
   - ❌ **401/403** - Authentication/permission issue
   - ❌ **400** - Invalid request

## Quick Checklist

- [ ] All 6 environment variables added to Vercel
- [ ] Variables enabled for Production environment
- [ ] Redeployed after adding variables
- [ ] Checked browser console for errors
- [ ] Verified Firestore security rules allow access

