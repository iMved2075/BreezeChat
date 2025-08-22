# Call Function Test Guide

## Fixed Issues ✅

1. **Hydration Errors**: Fixed SSR/client-side rendering conflicts in call context
2. **Participant Data Structure**: Fixed participant lookup from `p.id` to `p.uid` in chat-header.jsx
3. **WebRTC Support Check**: Added proper browser environment checks
4. **Import Issues**: Ensured all React hooks are properly imported

## Call System Status

### Components Ready:
- ✅ `CallInterface` - Full-screen call interface with video streams
- ✅ `CallNotification` - Incoming call notification popup
- ✅ `CallContext` - Complete call state management
- ✅ `WebRTCService` - Media device access and peer connections
- ✅ `chat-header.jsx` - Call button handlers with proper debugging

### Testing Steps:

1. **Start Call Test**:
   - Open the app at http://localhost:9002
   - Log in with two different users (use two browser windows/tabs)
   - Start a chat between the users
   - Click the voice or video call button
   - Check browser console for debug logs

2. **Expected Console Output**:
   ```
   🎯 Call button clicked for recipient: [recipient-uid]
   🎯 Call context - startCall function called
   🎯 Starting call with recipient: [recipient-uid]
   📞 Call state after start: [call-state-object]
   ```

3. **Potential Issues to Check**:
   - Camera/microphone permissions
   - Firebase Firestore rules for call collection
   - Network connectivity for WebRTC signaling

## Next Steps for Full Functionality

1. **Test Call Buttons**: Verify console logs show proper recipient data
2. **Test Media Access**: Ensure camera/microphone permissions work
3. **Test Signaling**: Verify Firebase call documents are created
4. **Test Peer Connection**: Implement full WebRTC handshake
5. **Add TURN Servers**: For production NAT traversal

## Debug Commands

```javascript
// In browser console, check call context state:
window.__CALL_DEBUG__ = true;

// Check Firebase connection:
firebase.firestore().collection('calls').get().then(console.log);

// Check WebRTC support:
navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(console.log);
```
