# Fix Firestore Security Rules

## The Problem
You're getting "Missing or insufficient permissions" errors because Firestore security rules are blocking read/write access.

## The Solution

### Step 1: Go to Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **budgeting-app-cbc8b**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### Step 2: Update the Rules

Replace your current rules with one of these options:

#### Option 1: Allow All Access (For Development/Testing)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### Option 2: Allow Access to Budget Collection Only (More Secure)
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

#### Option 3: Test Mode (30 Days - If You Started in Test Mode)
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

**Note**: The date in Option 3 is 30 days from when you created the database. If it's expired, use Option 1 or 2.

### Step 3: Publish the Rules
1. After updating the rules, click **"Publish"** button
2. Wait a few seconds for the rules to update

### Step 4: Test
1. Refresh your app in the browser
2. Try adding a category again
3. The errors should be gone!

## Important Notes

- **Option 1** allows access to ALL collections (good for development)
- **Option 2** only allows access to the `budget` collection (more secure)
- **Option 3** is temporary (30 days) - use for testing only

For production, you should use more restrictive rules, but for now, Option 1 or 2 will work.

