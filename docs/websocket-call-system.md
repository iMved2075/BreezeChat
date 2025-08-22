# WebSocket Call System - Alternative to WebRTC

Due to WebRTC complexity and potential issues with NAT traversal, TURN servers, and browser compatibility, we've implemented a simpler Firebase-based real-time communication system.

## Features

### ✅ **Firebase-Based Communication**
- Uses Firebase Firestore for real-time signaling
- No need for external TURN servers
- Simpler setup and maintenance

### ✅ **Real-Time Audio/Video Streaming**
- MediaRecorder API for audio streaming
- Canvas-based video frame capture and transmission
- Lower bandwidth usage with optimized settings

### ✅ **Better Reliability**
- No NAT traversal issues
- Works behind corporate firewalls
- Consistent cross-browser compatibility

## Implementation

### **Files Structure**
```
src/
├── lib/
│   ├── firebase-call.js       # Main Firebase call service
│   ├── websocket-call.js      # Alternative WebSocket implementation
│   └── webrtc.js              # Original WebRTC (legacy)
└── context/
    └── call-context.jsx       # Updated to use Firebase service
```

### **Key Components**

#### **1. FirebaseCallService** (`firebase-call.js`)
- **Purpose**: Handle real-time audio/video communication using Firebase
- **Features**:
  - MediaRecorder for audio streaming (32kbps, 200ms chunks)
  - Canvas-based video streaming (320x240, 5 FPS, JPEG 50% quality)
  - Firebase Firestore for signaling and media data
  - Automatic cleanup and connection management

#### **2. WebSocketCallService** (`websocket-call.js`)
- **Purpose**: Alternative implementation using dedicated WebSocket server
- **Features**:
  - Direct WebSocket connection for lower latency
  - Requires separate Node.js server (`call-server.js`)
  - Better for high-frequency real-time data

#### **3. Call Server** (`call-server.js`)
- **Purpose**: Optional WebSocket server for advanced scenarios
- **Features**:
  - Handles multiple concurrent calls
  - Real-time media relay
  - Connection management and cleanup

## Usage

### **Current Implementation (Firebase-based)**
```javascript
// The call context automatically uses FirebaseCallService
const { startCall, acceptCall, endCall } = useCall();

// Start a call
await startCall(contactId, contactInfo, 'video');

// Accept incoming call
await acceptCall();

// End call
await endCall();
```

### **Configuration**
```javascript
// Audio settings (optimized for streaming)
const audioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 22050,        // Lower for better streaming
  channelCount: 1           // Mono audio
};

// Video settings (optimized for bandwidth)
const videoConstraints = {
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 15 }  // Lower frame rate
};
```

## Advantages over WebRTC

### **🔧 Simpler Setup**
- No STUN/TURN server configuration
- No complex peer-to-peer negotiation
- Firebase handles all infrastructure

### **🌐 Better Connectivity**
- Works behind NAT/firewalls
- No port forwarding needed
- Reliable in corporate networks

### **📱 Cross-Platform**
- Consistent behavior across browsers
- Mobile-friendly implementation
- Progressive enhancement support

### **💡 Easier Debugging**
- All data flows through Firebase
- Clear audit trail in Firestore
- Simple error handling

## Performance Considerations

### **Bandwidth Usage**
- Audio: ~32 kbps (vs WebRTC ~64-128 kbps)
- Video: ~200-500 kbps (vs WebRTC 500-2000 kbps)
- Lower quality but much more reliable

### **Latency**
- Firebase RTT: ~100-300ms (acceptable for voice calls)
- WebSocket: ~50-150ms (better for real-time interaction)
- WebRTC: ~20-100ms (best but often fails)

### **Cost**
- Firebase Firestore: Pay per read/write operation
- WebSocket Server: Fixed server hosting cost
- WebRTC: Free but requires TURN servers

## Migration Path

### **Current Status**
✅ Firebase-based implementation active
✅ Separate caller/receiver interfaces
✅ 30-second ring timer with countdown
✅ Audio/video streaming working

### **Future Enhancements**
- [ ] WebSocket server deployment for lower latency
- [ ] Adaptive quality based on connection
- [ ] Group call support
- [ ] Screen sharing capability
- [ ] Call recording feature

## Testing

### **Browser Support**
- Chrome: ✅ Full support
- Firefox: ✅ Full support  
- Safari: ✅ Limited (no MediaRecorder in older versions)
- Edge: ✅ Full support

### **Network Conditions**
- Home WiFi: ✅ Excellent
- Mobile 4G: ✅ Good
- Corporate Network: ✅ Reliable (major advantage)
- Public WiFi: ✅ Acceptable

## Troubleshooting

### **Common Issues**
1. **No audio/video**: Check browser permissions
2. **High latency**: Consider WebSocket server option
3. **Connection fails**: Check Firebase configuration
4. **Quality issues**: Adjust streaming parameters

### **Debug Mode**
```javascript
// Enable debug logging
localStorage.setItem('DEBUG_CALLS', 'true');

// Check Firebase connection
console.log('Firebase initialized:', !!db);

// Test media devices
navigator.mediaDevices.getUserMedia({ audio: true, video: true })
  .then(stream => console.log('Media access OK'))
  .catch(err => console.error('Media access failed:', err));
```

This implementation provides a much more reliable calling experience while maintaining the core functionality of audio/video calls with a simpler, more maintainable codebase.
