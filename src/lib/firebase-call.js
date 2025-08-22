/**
 * Firebase-based WebSocket alternative for real-time calls
 * Uses Firebase Realtime Database for signaling instead of WebSocket server
 */

import { db } from '@/lib/firebase.js';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  serverTimestamp, 
  deleteDoc,
  collection,
  addDoc
} from 'firebase/firestore';

const __DEV__ = process.env.NODE_ENV !== 'production';

class FirebaseCallService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.isConnected = false;
    this.callId = null;
    this.userId = null;
    this.mediaRecorder = null;
    this.remoteAudioQueue = [];
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
    this.audioBuffer = [];
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
          sampleRate: 22050, // Lower sample rate for better streaming
          channelCount: 1     // Mono audio
        },
        video: videoEnabled ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 } // Lower frame rate
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
  async startCall(callId, userId, recipientId, videoEnabled = false) {
    this.callId = callId;
    this.userId = userId;
    this.isInitiator = true;

    try {
      // Create initial call document
      await setDoc(doc(db, 'calls', callId), {
        callerId: userId,
        recipientId: recipientId,
        status: 'calling',
        type: videoEnabled ? 'video' : 'voice',
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      // Initialize media first
      await this.initializeMedia(videoEnabled);

      // Set up Firebase listeners
      this.setupFirebaseListeners();

      // Start streaming
      this.startStreaming();

  if (__DEV__) console.log('✅ Call started successfully');
      
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

      // Start streaming
      this.startStreaming();

      // Signal that call is accepted
      await setDoc(doc(db, 'calls', callId), {
        status: 'active',
        acceptedBy: userId,
        acceptedAt: serverTimestamp()
      }, { merge: true });

      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }

  if (__DEV__) console.log('✅ Call accepted successfully');
      
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
        if (data.status === 'ended') {
          this.endCall();
        } else if (data.status === 'active' && this.isInitiator) {
          if (this.callbacks.onConnect) {
            this.callbacks.onConnect();
          }
        }
      }
    });

    // Listen for audio/video data
    const mediaCollection = collection(db, 'calls', this.callId, 'media');
    const unsubscribeMedia = onSnapshot(mediaCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.senderId !== this.userId) {
            this.handleRemoteMediaData(data);
          }
        }
      });
    });

    this.unsubscribes.push(unsubscribeCall, unsubscribeMedia);
  }

  // Start streaming media data
  startStreaming() {
    if (!this.localStream) return;

    // Stream audio
    this.streamAudio();

    // Stream video if available
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      this.streamVideo();
    }
  }

  // Stream audio using MediaRecorder
  streamAudio() {
    try {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (!audioTrack) return;

      const audioStream = new MediaStream([audioTrack]);
      
      this.mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000 // Lower bitrate for better streaming
      });

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.callId) {
          try {
            // Convert to base64
            const arrayBuffer = await event.data.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            // Send to Firebase
            await addDoc(collection(db, 'calls', this.callId, 'media'), {
              type: 'audio',
              data: base64,
              senderId: this.userId,
              timestamp: serverTimestamp(),
              size: event.data.size
            });
            
          } catch (error) {
            console.error('❌ Error sending audio data:', error);
          }
        }
      };

      // Start recording in small chunks for low latency
      this.mediaRecorder.start(200); // 200ms chunks
      
    } catch (error) {
      console.error('❌ Error setting up audio streaming:', error);
    }
  }

  // Stream video frames
  streamVideo() {
    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');
      
      video.srcObject = new MediaStream([videoTrack]);
      video.play();

      canvas.width = 320; // Smaller resolution for better performance
      canvas.height = 240;

      let frameCount = 0;
      
      const captureFrame = async () => {
        if (video.videoWidth > 0 && video.videoHeight > 0 && this.callId) {
          // Only send every 3rd frame (5 FPS instead of 15)
          frameCount++;
          if (frameCount % 3 !== 0) {
            setTimeout(captureFrame, 66); // ~15 FPS
            return;
          }

          try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameData = canvas.toDataURL('image/jpeg', 0.5); // Lower quality
            
            // Send to Firebase (only key frames to reduce data)
            await addDoc(collection(db, 'calls', this.callId, 'media'), {
              type: 'video',
              data: frameData,
              senderId: this.userId,
              timestamp: serverTimestamp()
            });
            
          } catch (error) {
            console.error('❌ Error sending video frame:', error);
          }
        }
        
        setTimeout(captureFrame, 200); // 5 FPS
      };

      video.onloadedmetadata = () => {
        captureFrame();
      };

    } catch (error) {
      console.error('❌ Error setting up video streaming:', error);
    }
  }

  // Handle remote media data
  async handleRemoteMediaData(data) {
    try {
      if (data.type === 'audio') {
        await this.playRemoteAudio(data.data);
      } else if (data.type === 'video') {
        this.displayRemoteVideo(data.data);
      }
    } catch (error) {
      console.error('❌ Error handling remote media:', error);
    }
  }

  // Play remote audio
  async playRemoteAudio(base64Data) {
    try {
      // Convert base64 to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/webm' });
      
      // Play audio
      const audio = new Audio();
      audio.src = URL.createObjectURL(blob);
      
      // Set low latency settings
      audio.preload = 'auto';
      
      await audio.play();
      
      // Clean up
      audio.onended = () => {
        URL.revokeObjectURL(audio.src);
      };

    } catch (error) {
      console.error('❌ Error playing remote audio:', error);
    }
  }

  // Display remote video
  displayRemoteVideo(frameData) {
    try {
      if (!this.remoteVideoCanvas) {
        // Create remote video canvas
        this.remoteVideoCanvas = document.createElement('canvas');
        this.remoteVideoCanvas.width = 320;
        this.remoteVideoCanvas.height = 240;
        
        // Create stream from canvas for compatibility
        const stream = this.remoteVideoCanvas.captureStream(5);
        this.remoteStream = stream;
        
        if (this.callbacks.onRemoteStream) {
          this.callbacks.onRemoteStream(this.remoteStream);
        }
      }

      // Draw frame to canvas
      const ctx = this.remoteVideoCanvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0, this.remoteVideoCanvas.width, this.remoteVideoCanvas.height);
      };
      
      img.src = frameData;

    } catch (error) {
      console.error('❌ Error displaying remote video:', error);
    }
  }

  // End call
  async endCall() {
    try {
      // Stop media recorder
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

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

  if (__DEV__) console.log('✅ Call ended successfully');

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
      navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== 'undefined' &&
      typeof AudioContext !== 'undefined'
    );
  }
}

export default FirebaseCallService;
