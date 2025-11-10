# Firebase Storage Setup Guide

This guide will help you enable Firebase Storage for receipt image uploads. Firebase Storage supports unlimited file sizes and stores images securely in the cloud.

## Why Firebase Storage?

Previously, receipt images were stored as Base64 strings in Firestore documents, which has a 1MB limit. With Firebase Storage:
- ✅ Support for images of any size (no 1MB limit)
- ✅ More efficient data transfer
- ✅ Automatic image optimization
- ✅ CDN delivery for faster loading
- ✅ Lower costs for large files

## Step 1: Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `budgeting-app-cbc8b`
3. In the left sidebar, go to **Build** → **Storage**
4. Click **Get Started**
5. You'll see a dialog about security rules:
   - Click **Next** (we'll set up custom rules)
   - Choose your storage location (e.g., `us-central1` or the same as your Firestore)
   - Click **Done**

## Step 2: Update Firebase Storage Rules

After enabling Storage, update the security rules:

1. In the Firebase Console, go to **Build** → **Storage** → **Rules** tab
2. Replace the default rules with these:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read/write their own receipt images
    match /receipts/{userId}/{receiptId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024  // Max 10MB per file
                   && request.resource.contentType.matches('image/.*');  // Only images
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**What these rules do:**
- Only authenticated users can access receipt images
- Users can only access their own receipts (path includes `userId`)
- Uploads are limited to 10MB (you can adjust this)
- Only image files are allowed
- Users can delete their own receipts

3. Click **Publish**

## Step 3: Test Locally

No code changes are needed! The app already uses Firebase Storage. Just test it:

1. Start your development server: `npm run dev`
2. Log in with your account
3. Go to **Add Expense**
4. Upload a receipt image (even large ones >1MB)
5. Submit the expense

The receipt will be uploaded to Firebase Storage, and you'll see it in:
- Firebase Console → Storage → `receipts/{your-user-id}/`

## Step 4: Verify in Firebase Console

After uploading a receipt:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Build** → **Storage** → **Files**
4. Navigate to `receipts/` → `{your-user-id}/`
5. You should see your uploaded receipt images

## Step 5: Deploy to Vercel

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add Firebase Storage support for receipt images"
   git push origin main
   ```

2. Vercel will automatically deploy your changes
3. No new environment variables needed (Storage uses the same Firebase config)

## How It Works

### Uploading Receipts

When you upload a receipt:
1. The image is converted to a blob
2. It's uploaded to Firebase Storage at: `receipts/{userId}/{expenseId}.jpg`
3. Firebase returns a secure download URL
4. Only the URL is stored in Firestore (not the image data)

### Displaying Receipts

When you view a receipt:
1. The app loads the image from the Firebase Storage URL
2. Firebase CDN delivers the image quickly
3. The URL includes a security token, so only authorized users can access it

### Deleting Receipts

When you delete an expense:
1. The app first deletes the image from Firebase Storage
2. Then it removes the expense from Firestore

## Troubleshooting

### "Firebase Storage: User does not have permission"

**Solution:** Make sure you've updated the Storage security rules (Step 2 above)

### Images not uploading

**Possible causes:**
1. Storage not enabled → Follow Step 1
2. Wrong security rules → Check Step 2
3. File too large → Check the size limit in your rules (currently 10MB)
4. Not logged in → Make sure you're authenticated

### Old Base64 images still showing

**This is normal!** The app supports both:
- Old receipts stored as Base64 (still work fine)
- New receipts stored in Firebase Storage (for files >1MB or new uploads)

Existing receipts don't need to be migrated.

## Cost Information

Firebase Storage pricing (Spark plan - free tier):
- **Storage:** 5 GB free
- **Downloads:** 1 GB/day free
- **Uploads:** 20k/day free

For a personal budgeting app, you'll likely stay well within the free tier. Even with hundreds of receipts, you'll use only a fraction of the free storage.

## Summary

✅ Firebase Storage is now set up!
✅ Receipt images of any size are supported
✅ Images are stored securely with user-based access control
✅ Backward compatible with existing Base64 receipts

You're all set! Upload receipt images without size restrictions.

