# WebRTC Call Testing Guide

## Overview
This guide will help you test whether callers and receivers can properly connect to each other using the WebRTC calling system.

## Test Setup Requirements

### Prerequisites
1. **Two browser windows/tabs** (or different browsers)
2. **Two different user accounts** logged into BreezeChat
3. **Camera and microphone permissions** granted to the browser
4. **Modern browser with WebRTC support** (Chrome, Firefox, Safari, Edge)

### Network Requirements
- Both users should be on different networks for realistic testing
- If testing locally, use different browser profiles or incognito modes

## Step-by-Step Testing Process

### Step 1: Setup Two User Sessions
1. Open **two browser windows** or use **two different devices**
2. Navigate to `http://localhost:9002` in both windows
3. **Log in with different user accounts** in each window
4. Note the User IDs displayed in each session

### Step 2: Access Test Interface
1. Go to `http://localhost:9002/test` in both windows
2. Verify that both windows show:
   - ✅ **WebRTC Support: Supported**
   - ✅ **Connection Status: idle**
   - Current user information

### Step 3: Prepare for Testing
**User A (Caller):**
- Enter User B's User ID in the "Enter User ID to call" field
- Keep this window ready

**User B (Receiver):**
- Keep this window open and ready to receive the call
- Watch for incoming call notifications

### Step 4: Test Voice Call
1. **User A**: Click "Voice Call" button
2. **Check User A's logs** for:
   ```
   Starting voice call to [User Name] ([User ID])
   Voice call initiated successfully
   Call state: connecting with [User Name]
   ```

3. **User B**: Should see incoming call notification
4. **User B**: Click "Accept" on the notification
5. **Both users**: Monitor logs for connection establishment:
   ```
   WebRTC: Connection established - triggering call received event
   Call state: active with [User Name]
   ```

### Step 5: Test Video Call
1. Follow the same process but click "Video Call"
2. Grant camera permissions when prompted
3. Verify video streams appear in both windows

## Expected Results

### Successful Connection Indicators

#### User A (Caller) Logs:
```
[timestamp] Starting voice call to Test User ([User ID])
[timestamp] Voice call initiated successfully
[timestamp] Signal data generated
[timestamp] WebRTC connection established
[timestamp] Call state: active with Test User
```

#### User B (Receiver) Logs:
```
[timestamp] Incoming call from [Caller Name]
[timestamp] WebRTC: Remote stream received - triggering call received event
[timestamp] WebRTC: Connection established - triggering call received event
[timestamp] Call state: active with [Caller Name]
```

#### Visual Indicators:
- ✅ **Connection Status: connected**
- ✅ **Call timer showing duration**
- ✅ Video streams (for video calls)
- ✅ Audio working in both directions

### Common Issues and Solutions

#### Issue: WebRTC Not Supported
- **Solution**: Use a modern browser (Chrome, Firefox, Safari, Edge)
- **Check**: Ensure HTTPS is used in production

#### Issue: No Incoming Call Notification
- **Possible causes**:
  - User B not logged in properly
  - Firebase rules blocking access
  - Network connectivity issues
- **Solution**: Check browser console for errors

#### Issue: Connection Fails After Answering
- **Possible causes**:
  - NAT/Firewall blocking WebRTC
  - TURN server issues
  - Media permission denied
- **Solution**: Check TURN server configuration and browser permissions

#### Issue: One-way Audio/Video
- **Possible causes**:
  - Media permissions not granted on one side
  - Browser security restrictions
- **Solution**: Ensure both users grant camera/microphone permissions

## Debug Information

### Browser Console Logs
Open browser developer tools (F12) and check console for:
- Firebase connection status
- WebRTC signaling messages
- Media stream events
- Error messages

### Key Debug Points
1. **Firebase Authentication**: Check if users are properly authenticated
2. **WebRTC Support**: Verify `navigator.mediaDevices` exists
3. **Media Permissions**: Ensure camera/mic access granted
4. **Signaling**: Monitor Firebase `calls` collection for proper data exchange
5. **TURN Servers**: Check if TURN servers are accessible

## Production Deployment Notes

### HTTPS Requirement
- WebRTC requires HTTPS in production
- Use valid SSL certificates
- Configure secure headers

### TURN Server Configuration
- Replace demo TURN servers with production servers
- Use authenticated TURN servers for reliability
- Configure multiple TURN servers for redundancy

### Firebase Security Rules
- Ensure proper security rules for the `calls` collection
- Implement user-based access controls
- Add rate limiting for call creation

## Troubleshooting Commands

### Check WebRTC Support
```javascript
console.log('WebRTC supported:', !!(navigator.mediaDevices && window.RTCPeerConnection));
```

### Test Media Access
```javascript
navigator.mediaDevices.getUserMedia({audio: true, video: true})
  .then(stream => console.log('Media access granted'))
  .catch(err => console.error('Media access denied:', err));
```

### Check Firebase Connection
```javascript
import { db } from '@/lib/firebase.js';
import { doc, getDoc } from 'firebase/firestore';
// Test Firebase connectivity in browser console
```

## Success Criteria
- ✅ Users can initiate calls successfully
- ✅ Call notifications appear for receivers
- ✅ Both users can accept/decline calls
- ✅ Audio/video streams work bidirectionally  
- ✅ Call duration timer works correctly
- ✅ Users can end calls properly
- ✅ Call cleanup happens automatically
