# 🔧 **Call Function Troubleshooting Guide**

## 🚨 **Common Issues & Solutions**

### **1. Call Buttons Not Working**

#### **Check Browser Console**
- Open Developer Tools (F12)
- Look for errors when clicking Phone/Video buttons
- Check for authentication and WebRTC support messages

#### **User Authentication**
```javascript
// Check if user is logged in
console.log('Current user:', auth.currentUser);
```

#### **WebRTC Support**
```javascript
// Check WebRTC browser support
console.log('WebRTC supported:', WebRTCService.isSupported());
```

### **2. Media Access Issues**

#### **Camera/Microphone Permissions**
- Browser will prompt for permissions on first call
- Check browser address bar for blocked camera/mic icons
- Go to browser settings → Privacy & Security → Camera/Microphone

#### **HTTPS Requirement**
- WebRTC requires HTTPS in production
- Localhost works for development
- Deploy to HTTPS domain for testing between devices

### **3. Call Not Connecting**

#### **Firebase Firestore Rules**
Ensure your `firestore.rules` includes:
```javascript
match /calls/{callId} {
  allow read, write: if request.auth != null && 
    (request.auth.uid == resource.data.callerId || 
     request.auth.uid == resource.data.recipientId);
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.callerId;
}
```

#### **Network/NAT Issues**
- Both users need internet connection
- May need TURN server for calls through firewalls
- Test on same WiFi network first

### **4. Debugging Steps**

#### **Step 1: Check WebRTC Debug Info**
- Look at the WebRTC Debug component on welcome screen
- Verify WebRTC support shows "✅ Supported"
- Test media access button works

#### **Step 2: Browser Console Logs**
When clicking call button, you should see:
```
StartCall called with: {contactId: "...", contactInfo: {...}, callType: "voice"}
Generated callId: user1_user2_timestamp
Initializing media with video: false
Creating peer connection as initiator
Saving call data to Firebase: {...}
Dispatching START_CALL action
START_CALL reducer called with payload: {...}
```

#### **Step 3: Test Media Permissions**
```javascript
// Test in browser console
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => {
    console.log('✅ Media access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => console.error('❌ Media access denied:', error));
```

#### **Step 4: Check Firebase Connection**
- Verify Firebase project is configured correctly
- Check Network tab in DevTools for Firebase requests
- Ensure internet connection is stable

### **5. Quick Fixes**

#### **Reload and Retry**
- Refresh the page
- Clear browser cache (Ctrl+Shift+R)
- Try in incognito/private mode

#### **Different Browser Test**
- Chrome: Full WebRTC support
- Firefox: Full WebRTC support  
- Safari: WebRTC support (some limitations)
- Edge: Full WebRTC support

#### **Check User Data**
Make sure both users have proper profile data:
```javascript
// User should have uid, name, email fields
console.log('Chat participants:', participants);
console.log('Call recipient:', getCallRecipient());
```

### **6. Two-Device Testing**

#### **Setup Requirements**
- Two different devices (phones, computers)
- Different user accounts logged in
- Same WiFi network (recommended for testing)
- Both browsers with camera/mic permissions granted

#### **Testing Process**
1. **Login**: Different accounts on each device
2. **Start Chat**: Open direct message between users
3. **Initiate Call**: Click Phone/Video button on device 1
4. **Check Logs**: Monitor console on both devices
5. **Accept Call**: Look for notification on device 2
6. **Test Controls**: Try mute, video toggle, end call

### **7. Error Messages**

#### **"WebRTC not supported"**
- Update browser to latest version
- Use Chrome, Firefox, Edge, or Safari
- Internet Explorer not supported

#### **"User not authenticated"**  
- Ensure user is logged in
- Check Firebase authentication status
- Verify auth context is working

#### **"No recipient found for call"**
- Verify participant data structure (uid vs id)
- Check that other user exists in users array
- Ensure chat type is 'dm' (not group chat)

#### **"Media access denied"**
- Click "Allow" when browser asks for permissions
- Check browser settings for camera/microphone
- Try different browser if permissions are blocked

## 🎯 **Expected Behavior**

### **When Call Works Correctly:**
1. ✅ Click Phone/Video button
2. ✅ Browser requests media permissions (first time)
3. ✅ Call interface opens showing "Connecting..."  
4. ✅ Console shows WebRTC initialization logs
5. ✅ Other user receives call notification
6. ✅ After accepting, both users see active call
7. ✅ Video streams appear (for video calls)
8. ✅ Controls work (mute, video toggle, end call)

### **Console Log Sequence:**
```
StartCall called with: {...}
Generated callId: ...
Initializing media with video: false
Local stream received: MediaStream
Creating peer connection as initiator  
Saving call data to Firebase: {...}
START_CALL reducer called with payload: {...}
Signal data generated: {...}
Sending signal to Firebase for callId: ...
```

If you're not seeing these logs, there's likely an issue with the call initialization process.

## 🆘 **Still Not Working?**

1. **Check this troubleshooting guide step by step**
2. **Look at browser console for specific error messages**
3. **Test the WebRTC Debug component on welcome screen**
4. **Try different browsers and devices**
5. **Verify Firebase configuration and rules**

The most common issues are:
- 🔒 **Permissions**: Browser blocking camera/microphone
- 🌐 **HTTPS**: Production deployments need secure connections  
- 🔥 **Firebase**: Incorrect Firestore security rules
- 📱 **User Data**: Mismatch between uid/id in participant data
