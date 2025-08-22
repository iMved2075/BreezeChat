# Firestore Security Rules for BreezeChat

## Current Rules Structure
The firestore security rules should include the following for the calls collection:

```javascript
// Add this to your existing firestore.rules file

// Calls collection - for voice and video calling
match /calls/{callId} {
  allow read, write: if request.auth != null && 
    (request.auth.uid == resource.data.callerId || 
     request.auth.uid == resource.data.recipientId);
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.callerId;
}
```

## Security Features
- Only authenticated users can create calls
- Users can only read/write call documents where they are either the caller or recipient  
- Prevents unauthorized access to call data
- Enables real-time call status updates between participants

## Implementation Notes
- Call documents are automatically cleaned up after 5 seconds of being ended/declined
- Call status includes: 'calling', 'active', 'ended', 'declined'
- Each call document includes caller info, recipient info, call type (voice/video), and timestamps
