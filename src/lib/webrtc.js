import Peer from 'simple-peer';
const __DEV__ = process.env.NODE_ENV !== 'production';

class WebRTCService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isInitiator = false;
  this._seenRemoteSignals = new Set();
  this._pendingSignals = [];
    this.callbacks = {
      onLocalStream: null,
      onRemoteStream: null,
      onError: null,
      onClose: null,
      onConnect: null
    };
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Initialize user media (camera/microphone)
  async initializeMedia(videoEnabled = false) {
    try {
      const constraints = {
        audio: true,
        video: videoEnabled ? {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 360, ideal: 720, max: 1080 },
          frameRate: { min: 16, ideal: 30 }
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(this.localStream);
      }
      
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  // Create a peer connection (for initiator)
  createPeerConnection(isInitiator = false) {
    try {
      this.isInitiator = isInitiator;
      
      this.peer = new Peer({
        initiator: isInitiator,
        stream: this.localStream,
        trickle: false,
        config: {
          iceServers: [
            // STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            // Public TURN (demo) - replace with your own production TURN for reliability
            { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
            // For production, provision a private TURN (coturn) and replace above entries.
            // Example:
            // { urls: 'turn:your-turn.example.com:3478', username: 'user', credential: 'pass' }
          ]
        }
      });

      this.setupPeerEvents();

      // Flush any pending remote signals that arrived before peer existed
      if (this._pendingSignals.length) {
  if (__DEV__) console.log(`🔁 Flushing ${this._pendingSignals.length} pending remote signals`);
        const pending = [...this._pendingSignals];
        this._pendingSignals = [];
        pending.forEach(sig => this.handleSignalData(sig));
      }
      
    } catch (error) {
      console.error('Error creating peer connection:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  // Setup peer connection event handlers
  setupPeerEvents() {
    this.peer.on('signal', (data) => {
      if (__DEV__) console.log('Signal data:', data);
      // This data needs to be sent to the remote peer through your signaling server
      if (this.callbacks.onSignal) {
        this.callbacks.onSignal(data);
      }
    });

    this.peer.on('connect', () => {
      if (__DEV__) console.log('Peer connected');
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    });

    this.peer.on('stream', (stream) => {
      if (__DEV__) console.log('Received remote stream');
      this.remoteStream = stream;
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(stream);
      }
    });

    // Some environments fire 'track' instead of or before 'stream'
    if (typeof this.peer.on === 'function') {
      this.peer.on('track', (track, stream) => {
        if (__DEV__) console.log('Received remote track', track?.kind);
        if (stream) {
          this.remoteStream = stream;
        } else {
          if (!this.remoteStream) this.remoteStream = new MediaStream();
          try {
            this.remoteStream.addTrack(track);
          } catch {}
        }
        if (this.callbacks.onRemoteStream && this.remoteStream) {
          this.callbacks.onRemoteStream(this.remoteStream);
        }
      });
    }

    this.peer.on('error', (error) => {
  console.error('Peer error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    this.peer.on('close', () => {
      if (__DEV__) console.log('Peer connection closed');
      if (this.callbacks.onClose) {
        this.callbacks.onClose();
      }
    });
  }

  // Handle incoming signal data from remote peer
  handleSignalData(signalData) {
    if (!this.peer) {
      // Queue until peer is created (e.g., user hasn't accepted yet)
      this._pendingSignals.push(signalData);
      return;
    }
    // Idempotency: drop duplicate payloads we already applied
    let key;
    try {
      key = JSON.stringify(signalData).slice(0, 1024);
    } catch {
      key = String(signalData);
    }
    if (this._seenRemoteSignals.has(key)) {
      if (__DEV__) console.log('🔁 Skipping duplicate remote signal payload');
      return;
    }
    this._seenRemoteSignals.add(key);

    // Optional sanity logs for initiator/answer roles
  const type = signalData?.type || (signalData?.sdp ? 'sdp' : signalData?.candidate ? 'candidate' : 'unknown');
  if (__DEV__) console.log(`➡️ Applying remote signal (type=${type}) as ${this.isInitiator ? 'initiator' : 'receiver'}`);
    this.peer.signal(signalData);
  }

  // Mute/unmute audio
  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Enable/disable video
  toggleVideo(enabled) {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // End the call and clean up resources
  endCall() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    this.remoteStream = null;
    this.isInitiator = false;
  this._seenRemoteSignals.clear();
  this._pendingSignals = [];
  }

  // Get current call state
  getCallState() {
    return {
      isConnected: this.peer && this.peer.connected,
      hasLocalStream: !!this.localStream,
      hasRemoteStream: !!this.remoteStream,
      isInitiator: this.isInitiator
    };
  }

  // Check if browser supports WebRTC
  static isSupported() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    );
  }
}

export default WebRTCService;
