# 🔧 Call Reception Debug Guide

## 🚨 **Issue: Cannot Receive Calls**

I've added comprehensive debugging tools to identify why calls aren't being received.

## 🛠️ **New Debug Features Added:**

### 1. **Enhanced Call Context Logging**
- Detailed incoming call listener setup
- Query monitoring with user ID verification  
- Real-time snapshot change tracking
- Call document structure verification

### 2. **Call Debugger Component**
- Interactive testing tool on the main page
- Manual Firebase operations testing
- Real-time listener verification
- Step-by-step troubleshooting

## 🧪 **Step-by-Step Testing Process:**

### **Step 1: Access the Debug Tool**
1. Go to http://localhost:9002
2. Log in with Google
3. You'll see the "Call Debug Tool" on the welcome page

### **Step 2: Test Firebase Operations**
1. Click **"1. Create Test Call"** - This creates a test call document
2. Click **"2. Query Calls"** - This searches for incoming calls  
3. Click **"3. Start Listener"** - This starts real-time monitoring

### **Step 3: Check Console Logs**
Open browser developer tools and look for:
```
🎯 Setting up incoming calls listener for user: [your-user-id]
🎯 Current user object: [user-object]  
🎯 Query created - listening for calls to recipientId: [your-user-id]
🎯 Snapshot received, changes: [number]
```

### **Step 4: Test Real Call Flow**
1. Open **two browser tabs** with different Google accounts
2. In Tab 1: Try starting a call (watch console for call creation logs)
3. In Tab 2: Watch for incoming call detection logs
4. Use the debug tool to verify Firebase operations

## 🎯 **What to Look For:**

### **✅ Good Signs:**
- `🎯 Setting up incoming calls listener` appears
- `🎯 Query created - listening for calls` shows correct user ID
- Debug tool shows "Found X incoming calls" 
- `🎯 Snapshot received` appears when calls are created

### **❌ Problem Signs:**
- `🎯 No current user - not setting up call listener` 
- Firebase permission errors in console
- Debug tool shows "Found 0 incoming calls" consistently
- No snapshot updates when calls should be created

## 🔍 **Common Issues & Solutions:**

### **Issue 1: User Not Available**
```
🎯 No current user - not setting up call listener
```
**Solution:** Make sure you're logged in with Google before testing

### **Issue 2: Firebase Permissions**
```
FirebaseError: [code=permission-denied]
```
**Solution:** Update Firestore security rules as described in firebase-permissions-fix.md

### **Issue 3: Query Not Finding Calls**
```  
📊 Found 0 incoming calls
```
**Solution:** Check if calls are being created with correct `recipientId` structure

### **Issue 4: Listener Not Triggering**
```
🎯 Snapshot received, changes: 0
```
**Solution:** Verify Firebase connection and call document structure

## 🚀 **Next Steps:**

1. **Run the debug tests** to identify the specific failure point
2. **Check console output** for detailed logging information  
3. **Test with two different browser sessions** to verify end-to-end flow
4. **Share the debug tool results** if issues persist

The debug tool will show exactly where the call reception is failing - whether it's authentication, Firebase queries, document structure, or real-time listening.

## 📱 **Current Status:**
- ✅ Server running at http://localhost:9002  
- ✅ Enhanced debug logging implemented
- ✅ Interactive debug tool available
- ✅ Ready for comprehensive troubleshooting

**Test the debug tool now to identify the exact issue!** 🔍
