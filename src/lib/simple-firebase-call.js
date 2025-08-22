/**
 * Simplified Firebase-based call service
 * Uses main collections instead of subcollections to avoid permission issues
 */

import { db } from '@/lib/firebase.js';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  serverTimestamp, 
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';

const __DEV__ = process.env.NODE_ENV !== 'production';

class SimpleFirebaseCallService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.isConnected = false;
    this.callId = null;
    this.userId = null;
    this.mediaRecorder = null;
    this.unsubscribes = [];
    this.callbacks = {
      onLocalStream: null,
      onRemoteStream: null,
      onError: null,
      onClose: null,
      onConnect: null,
      onSignal: null
    };
    
    // Audio context for better audio handling
    this.audioContext = null;
    this.lastAudioTime = 0;
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Initialize user media
  async initializeMedia(videoEnabled = false) {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 22050,
          channelCount: 1
        },
        video: videoEnabled ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(this.localStream);
      }

      // Initialize audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  // Start call as initiator
  async startCall(callId, userId, recipientId, videoEnabled = false, callerInfo = null, recipientInfo = null) {
    this.callId = callId;
    this.userId = userId;
    this.isInitiator = true;

    try {
      // Create initial call document with proper field names and caller info
      const callData = {
        callerId: userId,
        recipientId: recipientId,
        receiverId: recipientId, // Add this for compatibility
        status: 'calling',
        type: videoEnabled ? 'video' : 'voice',
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      };

      // Add caller and recipient info if provided
      if (callerInfo) {
        callData.callerInfo = callerInfo;
      }
      if (recipientInfo) {
        callData.recipientInfo = recipientInfo;
      }

      await setDoc(doc(db, 'calls', callId), callData);

      // Initialize media first
      await this.initializeMedia(videoEnabled);

      // Set up Firebase listeners
      this.setupFirebaseListeners();

      // Simulate connection (since we're not doing actual media streaming yet)
      setTimeout(() => {
        if (this.callbacks.onConnect) {
          this.callbacks.onConnect();
        }
      }, 1000);

  if (__DEV__) console.log('✅ Simple call started successfully');
      
    } catch (error) {
      console.error('❌ Error starting call:', error);
      throw error;
    }
  }

  // Accept incoming call
  async acceptCall(callId, userId, videoEnabled = false) {
    this.callId = callId;
    this.userId = userId;
    this.isInitiator = false;

    try {
      // Initialize media
      await this.initializeMedia(videoEnabled);

      // Set up Firebase listeners
      this.setupFirebaseListeners();

      // Signal that call is accepted
      await setDoc(doc(db, 'calls', callId), {
        status: 'active',
        acceptedBy: userId,
        acceptedAt: serverTimestamp()
      }, { merge: true });

      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }

  if (__DEV__) console.log('✅ Simple call accepted successfully');
      
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      throw error;
    }
  }

  // Set up Firebase listeners for real-time communication
  setupFirebaseListeners() {
    if (!this.callId) return;

    // Listen for call status changes
    const callDoc = doc(db, 'calls', this.callId);
    const unsubscribeCall = onSnapshot(callDoc, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
  if (__DEV__) console.log('📞 Call status update:', data.status);
        
        if (data.status === 'ended') {
          this.endCall();
        } else if (data.status === 'active') {
          if (this.isInitiator && this.callbacks.onConnect) {
            this.callbacks.onConnect();
          }
          // Create a mock remote stream for now
          if (!this.remoteStream) {
            this.createMockRemoteStream();
          }
        }
      }
    }, (error) => {
      console.error('❌ Error listening to call updates:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    this.unsubscribes.push(unsubscribeCall);
  }

  // Create a mock remote stream for testing
  createMockRemoteStream() {
    try {
      // Create a silent audio track for compatibility
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Silent
      
      const stream = audioContext.createMediaStreamDestination().stream;
      this.remoteStream = stream;
      
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream);
      }
      
      console.log('✅ Mock remote stream created');
    } catch (error) {
      console.error('❌ Error creating mock remote stream:', error);
    }
  }

  // End call
  async endCall() {
    try {
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Clean up Firebase listeners
      this.unsubscribes.forEach(unsubscribe => unsubscribe());
      this.unsubscribes = [];

      // Update call status
      if (this.callId) {
        await setDoc(doc(db, 'calls', this.callId), {
          status: 'ended',
          endedBy: this.userId,
          endedAt: serverTimestamp()
        }, { merge: true });
      }

      // Clean up audio context
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      this.callId = null;
      this.isConnected = false;

      if (this.callbacks.onClose) {
        this.callbacks.onClose();
      }

      console.log('✅ Simple call ended successfully');

    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  }

  // Toggle mute
  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle video
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  // Check if supported
  static isSupported() {
    return (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }
}

export default SimpleFirebaseCallService;
