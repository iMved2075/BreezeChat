/**
 * WebSocket-based communication service for real-time audio/video calls
 * Alternative to WebRTC that uses WebSocket for signaling and media streaming
 */

class WebSocketCallService {
  constructor() {
    this.socket = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isConnected = false;
    this.isInitiator = false;
    this.callId = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.callbacks = {
      onLocalStream: null,
      onRemoteStream: null,
      onError: null,
      onClose: null,
      onConnect: null,
      onSignal: null
    };
  }

  // Set callback functions
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Initialize WebSocket connection
  async initializeSocket(serverUrl = 'ws://localhost:8080') {
    try {
      this.socket = new WebSocket(serverUrl);
      
      this.socket.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        if (this.callbacks.onConnect) {
          this.callbacks.onConnect();
        }
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleSocketMessage(data);
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        if (this.callbacks.onClose) {
          this.callbacks.onClose();
        }
      };

      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        this.socket.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          resolve();
        };
      });

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
      throw error;
    }
  }

  // Handle incoming WebSocket messages
  handleSocketMessage(data) {
    console.log('📨 Received message:', data.type);

    switch (data.type) {
      case 'call-accepted':
        console.log('📞 Call accepted by remote peer');
        if (this.callbacks.onConnect) {
          this.callbacks.onConnect();
        }
        break;

      case 'call-declined':
        console.log('❌ Call declined by remote peer');
        this.endCall();
        break;

      case 'audio-data':
        this.handleRemoteAudioData(data.audioData);
        break;

      case 'video-frame':
        this.handleRemoteVideoFrame(data.frameData);
        break;

      case 'call-ended':
        console.log('📞 Call ended by remote peer');
        this.endCall();
        break;

      case 'error':
        console.error('❌ Remote error:', data.error);
        if (this.callbacks.onError) {
          this.callbacks.onError(new Error(data.error));
        }
        break;

      default:
        console.log('❓ Unknown message type:', data.type);
    }
  }

  // Initialize user media (camera/microphone)
  async initializeMedia(videoEnabled = false) {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
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

      // Set up media streaming
      this.setupMediaStreaming(videoEnabled);
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  // Set up media streaming over WebSocket
  setupMediaStreaming(videoEnabled) {
    if (!this.localStream) return;

    // Set up audio streaming
    this.setupAudioStreaming();

    // Set up video streaming if enabled
    if (videoEnabled) {
      this.setupVideoStreaming();
    }
  }

  // Set up audio streaming using MediaRecorder
  setupAudioStreaming() {
    try {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (!audioTrack) return;

      const audioStream = new MediaStream([audioTrack]);
      
      this.mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.socket && this.isConnected) {
          // Convert audio data to base64 and send
          const reader = new FileReader();
          reader.onload = () => {
            const audioData = reader.result.split(',')[1]; // Remove data:audio/webm;base64,
            this.sendMessage({
              type: 'audio-data',
              callId: this.callId,
              audioData: audioData,
              timestamp: Date.now()
            });
          };
          reader.readAsDataURL(event.data);
        }
      };

      // Start recording audio in small chunks
      this.mediaRecorder.start(100); // 100ms chunks for low latency
      
    } catch (error) {
      console.error('❌ Error setting up audio streaming:', error);
    }
  }

  // Set up video streaming (simplified approach)
  setupVideoStreaming() {
    try {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) return;

      // Create a canvas to capture video frames
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');
      
      video.srcObject = new MediaStream([videoTrack]);
      video.play();

      canvas.width = 640;
      canvas.height = 480;

      // Capture and send video frames (reduced frequency for bandwidth)
      const captureFrame = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL('image/jpeg', 0.7);
          
          if (this.socket && this.isConnected) {
            this.sendMessage({
              type: 'video-frame',
              callId: this.callId,
              frameData: frameData,
              timestamp: Date.now()
            });
          }
        }
        
        // Capture at 10 FPS to reduce bandwidth
        setTimeout(captureFrame, 100);
      };

      video.onloadedmetadata = () => {
        captureFrame();
      };

    } catch (error) {
      console.error('❌ Error setting up video streaming:', error);
    }
  }

  // Handle remote audio data
  handleRemoteAudioData(audioData) {
    try {
      // Convert base64 back to blob and play
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.play().catch(error => {
        console.error('❌ Error playing remote audio:', error);
      });

    } catch (error) {
      console.error('❌ Error handling remote audio:', error);
    }
  }

  // Handle remote video frame
  handleRemoteVideoFrame(frameData) {
    try {
      // Create a mock remote stream for compatibility
      if (!this.remoteStream) {
        // Create a canvas to display remote video
        const canvas = document.createElement('canvas');
        const stream = canvas.captureStream();
        this.remoteStream = stream;
        
        if (this.callbacks.onRemoteStream) {
          this.callbacks.onRemoteStream(this.remoteStream);
        }
      }

      // Display the frame (this would need a video element in practice)
      const img = new Image();
      img.onload = () => {
        // Update canvas with new frame
        // Implementation depends on how you want to display video
      };
      img.src = frameData;

    } catch (error) {
      console.error('❌ Error handling remote video frame:', error);
    }
  }

  // Send message via WebSocket
  sendMessage(message) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(message));
    }
  }

  // Start a call
  async startCall(callId, isInitiator = true) {
    this.callId = callId;
    this.isInitiator = isInitiator;

    if (!this.isConnected) {
      await this.initializeSocket();
    }

    this.sendMessage({
      type: 'start-call',
      callId: callId,
      isInitiator: isInitiator,
      timestamp: Date.now()
    });
  }

  // Accept a call
  acceptCall(callId) {
    this.callId = callId;
    this.isInitiator = false;

    this.sendMessage({
      type: 'accept-call',
      callId: callId,
      timestamp: Date.now()
    });
  }

  // Decline a call
  declineCall(callId) {
    this.sendMessage({
      type: 'decline-call',
      callId: callId,
      timestamp: Date.now()
    });
  }

  // End the call
  endCall() {
    if (this.callId) {
      this.sendMessage({
        type: 'end-call',
        callId: this.callId,
        timestamp: Date.now()
      });
    }

    // Clean up media
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Clean up WebSocket
    if (this.socket && this.isConnected) {
      this.socket.close();
    }

    this.callId = null;
    this.isConnected = false;

    if (this.callbacks.onClose) {
      this.callbacks.onClose();
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

  // Check if WebSocket is supported
  static isSupported() {
    return typeof WebSocket !== 'undefined' && typeof MediaRecorder !== 'undefined';
  }
}

export default WebSocketCallService;
