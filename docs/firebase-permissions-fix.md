# Firebase Permissions Fix Guide

## 🚨 Problem: Permission Denied Error

You're seeing this error:
```
[code=permission-denied]: Missing or insufficient permissions
```

This happens because Firestore security rules are blocking access to the `calls` collection.

## ✅ Solution: Update Firestore Security Rules

### Option 1: Quick Fix (Development Only)

For **development/testing only**, you can temporarily use permissive rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish**

⚠️ **Warning**: This allows all authenticated users to access all data. Only use for development!

### Option 2: Production-Ready Rules (Recommended)

Use the secure rules I've created in `firestore.rules`:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** → **Rules**
4. Copy the content from `firestore.rules` file in your project
5. Click **Publish**

These rules ensure:
- ✅ Users can only access chats they participate in
- ✅ Users can only access calls they are involved in
- ✅ Proper message and signaling permissions
- ✅ Security for production use

### Option 3: Firebase CLI Deployment

If you have Firebase CLI installed:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Deploy security rules
firebase deploy --only firestore:rules
```

## 🔧 Additional Steps

### 1. Update Your Firebase Project ID

In `firebase.json`, replace `"your-project-id"` with your actual Firebase project ID.

### 2. Enable Firestore Collections

Make sure these collections exist in your Firestore:
- `users` - User profiles
- `chats` - Chat rooms
- `calls` - Call metadata
- `call-signaling` - WebRTC signaling data

### 3. Test the Fix

After updating the rules:
1. Refresh your browser
2. Try clicking a call button
3. Check browser console - the permission error should be gone

## 🐛 Troubleshooting

### If you still see permission errors:

1. **Check Authentication**: Make sure you're logged in with Google
2. **Clear Cache**: Hard refresh the browser (Ctrl+Shift+R)
3. **Check Rules**: Verify the rules were published in Firebase Console
4. **Check Console**: Look for other error messages in browser console

### Common Issues:

- **Rules not applied**: Wait 1-2 minutes after publishing rules
- **Wrong collection**: Make sure collection names match exactly
- **Auth issues**: Ensure user is properly authenticated before calling

## 📝 Current Rule Summary

The security rules I created allow:

- **Users**: Read all users, write only own profile
- **Chats**: Access only chats you participate in
- **Messages**: Access messages in your chats only
- **Calls**: Access calls where you're caller or receiver
- **Signaling**: Access WebRTC signaling data for your calls

This provides security while enabling all chat and call functionality!

## 🎯 Next Steps

1. Update Firestore security rules (choose Option 1 or 2 above)
2. Test the call functionality
3. The "permission denied" error should be resolved
4. Call system should work properly with authentication

Let me know if you need help with any of these steps!
