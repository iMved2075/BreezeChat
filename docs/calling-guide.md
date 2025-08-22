# 📞 Voice & Video Calling Guide

## Overview
BreezeChat now includes comprehensive voice and video calling functionality. Users can make high-quality calls directly from the chat interface.

## Features

### 🎙️ Voice Calls
- High-quality audio calling
- Mute/unmute microphone control
- Speaker phone toggle
- Call duration tracking
- Minimizable call interface

### 📹 Video Calls
- Full video calling capabilities
- Video on/off toggle
- Self-video preview window
- Video stream display
- All voice call controls included

### 📱 Call Interface
- **Full Screen Mode**: Complete call interface taking over the entire window
- **Minimized Mode**: Small floating call widget in bottom-right corner
- **Call Controls**: Easy-to-access buttons for all call functions
- **Visual Feedback**: Clear status indicators and duration display

### 🔔 Call Notifications
- **Incoming Call Alerts**: Toast notifications for incoming calls
- **Accept/Decline**: Quick action buttons
- **Caller Information**: Display caller's name and avatar
- **Call Type Indicator**: Visual distinction between voice and video calls

## How to Use

### Making a Call
1. Open a direct message conversation (calls only available in 1-on-1 chats)
2. Click the **Phone** icon (📞) for voice calls or **Video** icon (🎥) for video calls
3. The call interface will open and attempt to connect

### During a Call
- **Mute/Unmute**: Click the microphone button to toggle audio
- **Video Toggle**: Click the camera button to turn video on/off (video calls only)
- **Speaker**: Toggle speaker phone mode for better audio
- **Minimize**: Click minimize to continue the call while using other features
- **End Call**: Click the red phone button to hang up

### Receiving a Call
1. An incoming call notification will appear in the top-right corner
2. Click **Accept** to answer the call
3. Click **Decline** to reject the call

### Call States
- **Connecting**: Call is being established (shows animated dots)
- **Active**: Call is in progress (shows duration timer)  
- **Ended**: Call has been completed

## Technical Implementation

### Real-time Synchronization
- Call states are synchronized via Firebase Firestore
- Real-time updates ensure both participants see the same call status
- Automatic cleanup of call documents after completion

### Call Management
- Each call creates a temporary document in the `calls` collection
- Call status is tracked: 'calling' → 'active' → 'ended'
- Call documents are automatically deleted after 5 seconds

### Security
- Only authenticated users can make calls
- Users can only access calls where they are participants
- Firebase security rules prevent unauthorized call access

### Components Architecture
- **CallContext**: Manages all call state using React Context API
- **CallInterface**: Full-screen call interface component
- **CallNotification**: Incoming call notification component

## Firebase Setup

### Firestore Security Rules
Add these rules to your `firestore.rules` file:

```javascript
// Calls collection
match /calls/{callId} {
  allow read, write: if request.auth != null && 
    (request.auth.uid == resource.data.callerId || 
     request.auth.uid == resource.data.recipientId);
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.callerId;
}
```

### Data Structure
Call documents contain:
- `callerId`: UID of the user initiating the call
- `recipientId`: UID of the user receiving the call
- `callerInfo`: Caller's profile information
- `recipientInfo`: Recipient's profile information
- `type`: 'voice' or 'video'
- `status`: 'calling', 'active', 'declined', or 'ended'
- `createdAt`: Timestamp when call was initiated
- `endedAt`: Timestamp when call ended (if applicable)

## Development & Testing

### Testing with Real Users
To test the call functionality:
- Open the application in two different browsers or devices
- Log in with different user accounts
- Start a direct message conversation
- Click the Phone or Video call buttons to initiate calls
- Test call controls and state synchronization

### Testing Scenarios
1. **Voice Call Test**: Click Phone button in chat header to start voice call
2. **Video Call Test**: Click Video button in chat header to start video call  
3. **Call Controls**: Test all buttons (mute, speaker, minimize, end call)
4. **State Transitions**: Observe connecting → active state changes
5. **Minimization**: Test minimize/maximize functionality
6. **Call Notifications**: Test incoming call accept/decline functionality

## Future Enhancements

### Planned Features
- WebRTC integration for actual audio/video streaming
- Call history and logs
- Group calling (conference calls)
- Screen sharing during video calls
- Call recording functionality
- Mobile app integration
- Push notifications for missed calls

### Current Limitations
- Call interface is currently UI-only (no actual audio/video streaming)
- Calls are limited to direct messages (1-on-1 conversations)
- No persistent call history
- No integration with system audio/video devices

## Troubleshooting

### Common Issues
1. **Call buttons disabled**: Only available in direct messages, not group chats
2. **Firebase errors**: Ensure proper Firestore security rules are configured
3. **Call state not updating**: Check internet connection and Firebase configuration
4. **Components not rendering**: Verify all call components are properly imported

### Support
For technical support or feature requests related to calling functionality, please refer to the main project documentation or create an issue in the repository.
