# 📞 **Enhanced Call States System**

## Overview
The BreezeChat calling system now supports comprehensive call states to provide better user experience and debugging capabilities. This document outlines all available states and their usage.

## 🔄 **Call State Flow**

### **Outgoing Call Flow**
```
idle → initiating → ringing → connecting → connected → active
                                     ↓
                              failed/busy/no-answer
```

### **Incoming Call Flow**
```
idle → ringing → answering → connecting → connected → active
        ↓
     declined
```

### **Active Call States**
```
active ↔ on-hold
active → reconnecting → active/failed
active → ended
```

## 📋 **Complete State Reference**

### **1. Idle State**
- **Description**: No active call, system ready
- **UI**: Default interface
- **Actions**: Can initiate calls

### **2. Initiating State**
- **Description**: Preparing to start a call (media initialization)
- **UI**: "Preparing call..." message
- **Actions**: Cancel call

### **3. Ringing State**
- **Description**: Call is ringing (outgoing) or incoming notification
- **UI**: Ring indication, countdown timer (30s)
- **Actions**: End call (outgoing), Accept/Decline (incoming)

### **4. Connecting State**  
- **Description**: WebRTC peer connection establishing
- **UI**: "Establishing connection..." with loading indicators
- **Actions**: End call, shows connection progress

### **5. Connected State**
- **Description**: WebRTC connected, waiting for media streams
- **UI**: "Connected, waiting for media..." 
- **Actions**: End call

### **6. Active State**
- **Description**: Fully active call with media streams
- **UI**: Call duration, video/audio controls
- **Actions**: Mute, video toggle, hold, end call

### **7. On-Hold State**
- **Description**: Call placed on hold (audio/video paused)
- **UI**: "Call on hold" indicator
- **Actions**: Resume call, end call

### **8. Reconnecting State**
- **Description**: Attempting to reconnect after connection loss
- **UI**: "Reconnecting..." with retry indicators  
- **Actions**: Manual reconnect, end call

### **9. Answering State**
- **Description**: Processing incoming call acceptance
- **UI**: "Answering call..." message
- **Actions**: None (transitional state)

### **10. Ended State**
- **Description**: Call has ended normally
- **UI**: "Call ended" message, cleanup
- **Actions**: Return to idle

### **11. Failed State**
- **Description**: Call failed to establish connection
- **UI**: "Call failed - connection error" message
- **Actions**: Retry call, return to idle

### **12. Busy State**
- **Description**: Recipient is currently busy
- **UI**: "User is busy" message
- **Actions**: Retry later, return to idle

### **13. No-Answer State**
- **Description**: Call timed out with no answer
- **UI**: "No answer" message
- **Actions**: Retry call, return to idle

### **14. Declined State**
- **Description**: Call was declined by recipient
- **UI**: "Call declined" message
- **Actions**: Return to idle

## 🎛️ **New Control Functions**

### **Hold/Resume**
```javascript
// Hold current call
callState.holdCall();

// Resume held call  
callState.resumeCall();

// Check if call is on hold
if (callState.isOnHold) {
  // Show hold UI
}
```

### **Reconnection**
```javascript
// Manual reconnection attempt
callState.reconnectCall();

// Check reconnection attempts
console.log('Attempts:', callState.reconnectAttempts);
```

### **Connection Quality**
```javascript
// Update connection quality
callState.updateConnectionQuality('poor');

// Check current quality
console.log('Quality:', callState.connectionQuality); // good/fair/poor
```

## 🎨 **UI State Indicators**

### **Loading Indicators**
- **Connecting**: Yellow pulsing dots
- **Ringing**: Blue pulsing dots  
- **Reconnecting**: Orange pulsing dots

### **Status Colors**
- **Green**: Active, connected, good quality
- **Blue**: Ringing, on-hold, incoming
- **Yellow**: Connecting, fair quality  
- **Orange**: Reconnecting, warnings
- **Red**: Failed, declined, poor quality, busy

### **Visual Elements**
- **Active Call**: Green pulsing indicator
- **On Hold**: Blue bouncing indicator
- **Reconnecting**: Rotating icon
- **Failed States**: Error icons with retry options

## 📊 **State Monitoring**

### **Call Status Panel** (`/test` → Call Status tab)
- Real-time state display
- Connection quality monitoring
- Media controls status
- Advanced call controls (Hold/Resume/Reconnect)
- Complete state reference

### **Debug Information**
```javascript
// Get complete call state
const callState = useCall();

console.log({
  callStatus: callState.callStatus,
  isInCall: callState.isInCall,
  hasIncomingCall: callState.hasIncomingCall,
  connectionQuality: callState.connectionQuality,
  isOnHold: callState.isOnHold,
  reconnectAttempts: callState.reconnectAttempts
});
```

## 🔧 **Implementation Details**

### **State Transitions**
States are managed through Redux-like actions:
```javascript
dispatch({ type: 'CALL_CONNECTING' });
dispatch({ type: 'CALL_ACTIVE' });  
dispatch({ type: 'CALL_ON_HOLD' });
dispatch({ type: 'CALL_FAILED' });
```

### **WebRTC Integration**
- **onLocalStream**: Triggers `CALL_CONNECTING`
- **onConnect**: Triggers `CALL_CONNECTED`  
- **onRemoteStream**: Triggers `CALL_ACTIVE`
- **onError**: Triggers `CALL_FAILED`
- **onClose**: Triggers `END_CALL`

### **Firebase Integration**
States are synchronized with Firebase for multi-device consistency:
```javascript
// Update call status in Firebase
await setDoc(doc(db, 'calls', callId), {
  status: 'active',
  connectedAt: serverTimestamp()
}, { merge: true });
```

## 🧪 **Testing States**

### **Manual State Testing**
1. Go to `/test` → Call Status tab
2. View current state and available controls
3. Initiate calls to test state transitions
4. Use hold/resume/reconnect controls

### **Automated State Flow**
The system automatically transitions through states based on:
- WebRTC events
- User actions  
- Network conditions
- Timeouts

## 🚀 **Future Enhancements**

### **Planned States**
- `transferring`: Call transfer in progress
- `conference`: Multi-party call state  
- `recording`: Call recording active
- `screenshare`: Screen sharing active

### **Advanced Features**
- Call quality metrics
- Bandwidth adaptation
- Automatic reconnection strategies
- Call analytics and reporting

This enhanced state system provides comprehensive call lifecycle management with clear visual feedback and robust error handling.
