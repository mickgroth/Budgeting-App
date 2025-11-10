# Troubleshooting: Categories Not Saving to Firestore

If categories aren't showing up in Firestore, follow these steps:

## Step 1: Check Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. Try adding a category
5. Look for any error messages

**Common errors to look for:**
- `Firebase: Error (auth/invalid-api-key)`
- `Firebase: Error (permission-denied)`
- `Error saving budget to Firebase`
- `Failed to save changes`

## Step 2: Check Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `budgeting-app-cbc8b`
3. Go to **Firestore Database** → **Rules** tab
4. Check your security rules

**If you're in test mode**, your rules should look like:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 9);
    }
  }
}
```

**If rules are too restrictive**, update them to allow read/write:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /budget/{document} {
      allow read, write: if true;
    }
  }
}
```

## Step 3: Verify Environment Variables

Make sure your `.env` file has all Firebase variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Restart your dev server** after changing `.env`:
```bash
# Stop server (Ctrl+C) and restart
npm run dev
```

## Step 4: Check Network Tab

1. Open Developer Tools → **Network** tab
2. Filter by "firestore" or "firebase"
3. Try adding a category
4. Look for requests to Firestore
5. Check if requests are:
   - ✅ **200 OK** - Success
   - ❌ **403 Forbidden** - Permission denied (check security rules)
   - ❌ **400 Bad Request** - Invalid data
   - ❌ **401 Unauthorized** - Invalid API key

## Step 5: Verify Data Structure

Check if the document exists in Firestore:
1. Go to Firebase Console → Firestore Database → Data tab
2. Look for collection: `budget`
3. Look for document: `budget-data`
4. Click on it to see the data structure

**Expected structure:**
```json
{
  "totalBudget": 0,
  "categories": [
    {
      "id": "...",
      "name": "Groceries",
      "allocated": 500,
      "spent": 0,
      "color": "#3B82F6"
    }
  ],
  "expenses": [],
  "savings": [],
  "longTermGoals": []
}
```

## Step 6: Test Firebase Connection

Add this temporary code to test Firebase connection:

1. Open browser console
2. Type:
```javascript
// Check if Firebase is initialized
console.log('Firebase config:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

// Try to read from Firestore
import { getFirestore, doc, getDoc } from 'firebase/firestore';
const db = getFirestore();
const docRef = doc(db, 'budget', 'budget-data');
getDoc(docRef).then(snap => {
  console.log('Firestore data:', snap.data());
}).catch(err => {
  console.error('Firestore error:', err);
});
```

## Common Issues and Solutions

### Issue 1: Permission Denied
**Error**: `Firebase: Error (permission-denied)`
**Solution**: Update Firestore security rules (see Step 2)

### Issue 2: Invalid API Key
**Error**: `Firebase: Error (auth/invalid-api-key)`
**Solution**: Check your `.env` file and restart dev server

### Issue 3: Categories appear in UI but not in Firestore
**Possible causes**:
- Save is being blocked by real-time listener
- Debounce timeout is too long
- Error is being silently caught

**Solution**: Check browser console for errors

### Issue 4: Real-time Listener Overwriting Changes
If you have multiple tabs open, the real-time listener might be overwriting your changes.

**Solution**: Close other tabs and try again

## Quick Test

1. Open browser console
2. Add a category in the app
3. Wait 1-2 seconds
4. Check console for:
   - ✅ "Error saving budget to Firebase" - means save was attempted
   - ✅ No errors - check Firestore directly
   - ❌ Any error messages - follow the error

## Still Not Working?

If none of the above works:
1. Check the browser console for specific error messages
2. Check Firestore security rules
3. Verify environment variables are correct
4. Try clearing browser cache and reloading
5. Check if Firestore is enabled in your Firebase project

