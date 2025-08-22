"use client";

import { createContext, useContext, useReducer, useEffect, useRef, useState } from 'react';
import { db, auth } from '@/lib/firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import WebRTCService from '@/lib/webrtc.js';
import { useAuth } from './auth-context.jsx';

const CallContext = createContext();

const __DEV__ = process.env.NODE_ENV !== 'production';

const callReducer = (state, action) => {
  if (__DEV__) console.log('🔄 REDUCER ACTION:', action.type, 'payload:', action.payload);
  if (__DEV__) console.log('🔄 REDUCER BEFORE:', {
    currentStatus: state.currentStatus,
    isInCall: state.isInCall,
    hasIncomingCall: state.hasIncomingCall,
    callStatus: state.callStatus,
    ringStartTime: state.ringStartTime,
    ringRemaining: state.ringRemaining
  });
  
  let newState;
  switch (action.type) {
    case 'SET_CALL_STATE':
      newState = {
        ...state,
        ...action.payload
      };
      break;
    
    case 'INITIATE_CALL':
      if (__DEV__) console.log('INITIATE_CALL reducer called with payload:', action.payload);
      newState = {
        ...state,
        isInCall: true,
        callType: action.payload.callType,
        contact: action.payload.contact,
        callId: action.payload.callId,
        callStatus: 'initiating', // New state: preparing to call
        isOutgoing: true,
        isMinimized: false,
        startTime: null, // Will be set when call connects
        ringStartTime: Date.now(),
        ringRemaining: 30
      };
      break;
    
    case 'CALL_RINGING':
      if (__DEV__) console.log('CALL_RINGING reducer called');
      return {
        ...state,
        callStatus: 'ringing', // Outgoing call is ringing
        ringStartTime: Date.now(),
        ringRemaining: 30
      };
    
    case 'START_CALL':
      if (__DEV__) console.log('🎯 START_CALL reducer called with payload:', action.payload);
      if (__DEV__) console.log('🎯 Previous call status:', state.callStatus);
      const newStartCallState = {
        ...state,
        callId: action.payload.callId, // Update the callId from the payload
        callStatus: 'ringing', // Move to ringing state after successful initiation
        // Keep other properties from INITIATE_CALL state
      };
  if (__DEV__) console.log('🎯 New call status after START_CALL:', newStartCallState.callStatus);
      return newStartCallState;
    
    case 'RECEIVE_CALL':
      if (__DEV__) console.log('🎯 RECEIVE_CALL reducer called with payload:', action.payload);
      if (__DEV__) console.log('🎯 Previous state hasIncomingCall:', state.hasIncomingCall);
      if (__DEV__) console.log('🎯 Previous state caller:', state.caller);
      if (__DEV__) console.log('🎯 New caller info:', action.payload.caller);
      newState = {
        ...state,
        hasIncomingCall: true,
        callType: action.payload.callType,
        caller: action.payload.caller,
        callId: action.payload.callId,
        callStatus: 'ringing',
        ringStartTime: Date.now(),
        ringRemaining: 30
      };
  if (__DEV__) console.log('🎯 New state hasIncomingCall:', newState.hasIncomingCall);
  if (__DEV__) console.log('🎯 New state caller:', newState.caller);
      break;
    
    case 'ACCEPT_CALL':
      return {
        ...state,
        hasIncomingCall: false,
        isInCall: true,
        callStatus: 'answering', // Start as answering, will become active when WebRTC connects
        isOutgoing: false,
        isMinimized: false,
        startTime: null, // Will be set when call becomes active
        ringStartTime: null,
        ringRemaining: 0,
        ...(action.payload || {})
      };
    
    case 'CALL_CONNECTING':
      if (__DEV__) console.log('🎯 CALL_CONNECTING - WebRTC handshake in progress');
      return {
        ...state,
        callStatus: 'connecting', // WebRTC peer connection establishing
        ringStartTime: null,
        ringRemaining: 0
      };
    
    case 'CALL_CONNECTED':
      if (__DEV__) console.log('🎯 CALL_CONNECTED - Media streams established');
      return {
        ...state,
        callStatus: 'connected', // WebRTC connected but media not yet flowing
        // Start the call timer at connection time if not already started
        startTime: state.startTime || Date.now(),
      };
    
    case 'CALL_ACTIVE':
      if (__DEV__) console.log('🎯 CALL_ACTIVE - Call is now fully active with media');
      const activeStartTime = state.startTime || Date.now();
      return {
        ...state,
        callStatus: 'active', // Fully active call with media streams
        hasIncomingCall: false,
        isInCall: true,
        startTime: activeStartTime,
        ringStartTime: null,
        ringRemaining: 0,
        // If we already started timing at 'connected', keep existing duration progression
        duration: state.startTime ? state.duration : 0
      };
    
    case 'CALL_ON_HOLD':
      if (__DEV__) console.log('🎯 CALL_ON_HOLD - Call placed on hold');
      return {
        ...state,
        callStatus: 'on-hold', // Call is on hold
        isOnHold: true
      };
    
    case 'CALL_RESUME':
      if (__DEV__) console.log('🎯 CALL_RESUME - Call resumed from hold');
      return {
        ...state,
        callStatus: 'active',
        isOnHold: false
      };
    
    case 'CALL_RECONNECTING':
      if (__DEV__) console.log('🎯 CALL_RECONNECTING - Attempting to reconnect');
      return {
        ...state,
        callStatus: 'reconnecting', // Network issues, trying to reconnect
      };
    
    case 'CALL_FAILED':
      if (__DEV__) console.log('🎯 CALL_FAILED - Call failed to connect');
      return {
        ...state,
        callStatus: 'failed', // Call failed to establish
      };
    
    case 'CALL_BUSY':
      if (__DEV__) console.log('🎯 CALL_BUSY - Recipient is busy');
      return {
        ...state,
        callStatus: 'busy', // Recipient is busy
      };
    
    case 'CALL_NO_ANSWER':
      if (__DEV__) console.log('🎯 CALL_NO_ANSWER - Call was not answered');
      newState = {
        ...state,
        callStatus: 'no-answer', // Call timed out, no answer
      };
      break;
    
    case 'CALL_DECLINED':
      if (__DEV__) console.log('🎯 CALL_DECLINED - Call was declined');
      newState = {
        ...state,
        callStatus: 'declined', // Call was declined by recipient
      };
      break;
    
    case 'DECLINE_CALL':
      newState = {
        ...state,
        hasIncomingCall: false,
        caller: null,
        callId: null,
        ringStartTime: null,
        ringRemaining: 0
      };
      break;
    
    case 'END_CALL':
      newState = {
        ...state,
        isInCall: false,
        hasIncomingCall: false,
        callStatus: 'ended',
        contact: null,
        caller: null,
        callId: null,
        isMinimized: false,
        isMuted: false,
        isVideoOff: false,
        isSpeakerOn: false,
        duration: 0,
        startTime: null,
        ringStartTime: null,
        ringRemaining: 0
      };
      break;
    
    case 'CALL_RECEIVED':
      console.log('🎯 CALL_RECEIVED - Connection established, showing call interface for both sides');
      const currentStartTime = Date.now();
      console.log('🎯 Setting startTime to:', currentStartTime);
      return {
        ...state,
        callStatus: 'active', // Use 'active' instead of custom received state
        hasIncomingCall: false, // Hide notification if it was showing
        isInCall: true, // Ensure call interface shows for both sides
        startTime: currentStartTime, // Set start time when actually connected
        ringStartTime: null,
        ringRemaining: 0,
        duration: 0 // Reset duration
      };
    
    case 'UPDATE_CALL_STATUS':
      return {
        ...state,
        callStatus: action.payload
      };
    
    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted
      };
    
    case 'TOGGLE_VIDEO':
      return {
        ...state,
        isVideoOff: !state.isVideoOff
      };
    
    case 'TOGGLE_SPEAKER':
      return {
        ...state,
        isSpeakerOn: !state.isSpeakerOn
      };
    
    case 'TOGGLE_MINIMIZE':
      return {
        ...state,
        isMinimized: !state.isMinimized
      };
    
    case 'UPDATE_DURATION':
      return {
        ...state,
        duration: action.payload
      };
    case 'RING_TICK':
      return {
        ...state,
        ringRemaining: action.payload
      };
    case 'RESET_RING':
      return {
        ...state,
        ringStartTime: null,
        ringRemaining: 0
      };
    
    default:
      newState = state;
  }
  
  if (__DEV__) console.log('🔄 REDUCER AFTER:', {
    currentStatus: newState.currentStatus,
    isInCall: newState.isInCall,
    hasIncomingCall: newState.hasIncomingCall,
    callStatus: newState.callStatus,
    ringStartTime: newState.ringStartTime,
    ringRemaining: newState.ringRemaining
  });
  
  return newState;
};

const initialState = {
  isInCall: false,
  hasIncomingCall: false,
  callType: 'voice',
  callStatus: 'idle', // idle, initiating, ringing, connecting, connected, active, on-hold, reconnecting, failed, busy, no-answer, declined, ended
  contact: null,
  caller: null,
  callId: null,
  isOutgoing: false,
  isMinimized: false,
  isMuted: false,
  isVideoOff: false,
  isSpeakerOn: false,
  isOnHold: false, // New state for hold functionality
  duration: 0,
  startTime: null,
  ringStartTime: null,
  ringRemaining: 30,
  connectionQuality: 'good', // good, fair, poor, unknown
  reconnectAttempts: 0 // Track reconnection attempts
};

export const CallProvider = ({ children }) => {
  const [state, dispatch] = useReducer(callReducer, initialState);
  const { user: currentUser } = useAuth();
  const webrtcService = useRef(new WebRTCService());
  // Keep the latest callId available synchronously for callbacks
  const callIdRef = useRef(null);
  // Cache of processed remote signals to avoid double application
  const appliedSignalsRef = useRef(new Set());
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Keep ref in sync with state.callId for use inside async callbacks
  useEffect(() => {
    callIdRef.current = state.callId;
  }, [state.callId]);

  // Reset applied signals cache when call changes
  useEffect(() => {
    appliedSignalsRef.current.clear();
  }, [state.callId]);

  // Initialize WebRTC callbacks
  useEffect(() => {
    const webrtc = webrtcService.current;
    
    webrtc.setCallbacks({
      onLocalStream: (stream) => {
  if (__DEV__) console.log('Local stream received:', stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Transition to connecting state when local stream is ready
        dispatch({ type: 'CALL_CONNECTING' });
      },
      onRemoteStream: (stream) => {
  if (__DEV__) console.log('Remote stream received:', stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        // Also attach to hidden audio element for voice call playback
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {
            if (__DEV__) console.warn('Autoplay prevented; user interaction may be required to start audio');
          });
        }
  if (__DEV__) console.log('🎯 WebRTC: Remote stream received - call now active');
        dispatch({ type: 'CALL_ACTIVE' });
      },
      onSignal: (signalData) => {
  if (__DEV__) console.log('Signal data generated:', signalData);
        // Send signal data to Firebase for the other peer
        const activeCallId = callIdRef.current;
        if (activeCallId && currentUser) {
          if (__DEV__) console.log('Sending signal to Firebase for callId:', activeCallId);
          // Store signal data per-user; keep timestamp outside the map to avoid stray keys
          setDoc(doc(db, 'calls', activeCallId), {
            signalData: {
              [currentUser.uid]: signalData
            },
            signalMeta: {
              [currentUser.uid]: serverTimestamp()
            },
            lastSignalAt: serverTimestamp()
          }, { merge: true });
        } else {
          console.warn('No activeCallId available when emitting signal. Skipping write.');
        }
      },
      onConnect: () => {
  if (__DEV__) console.log('WebRTC peer connection established');
        dispatch({ type: 'CALL_CONNECTED' });
      },
      onError: (error) => {
  console.error('WebRTC Error:', error);
        dispatch({ type: 'CALL_FAILED' });
      },
      onClose: () => {
  if (__DEV__) console.log('WebRTC connection closed');
        dispatch({ type: 'END_CALL' });
      }
    });

    return () => {
      webrtc.endCall();
    };
  }, [currentUser, state.callId]);

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUser) {
  if (__DEV__) console.log('🎯 No current user - not setting up call listener');
      return;
    }

  if (__DEV__) console.log('🎯 Setting up incoming calls listener for user:', currentUser.uid);
  if (__DEV__) console.log('🎯 Current user object:', currentUser);

    const callsRef = collection(db, 'calls');
    const q = query(
      callsRef,
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'calling')
      // Removed orderBy to avoid composite index requirement
      // We'll sort on the client side instead
    );

  if (__DEV__) console.log('🎯 Query created - listening for calls to recipientId:', currentUser.uid);

    const unsubscribe = onSnapshot(q, (snapshot) => {
  if (__DEV__) console.log('🎯 Snapshot received, changes:', snapshot.docChanges().length);
      
      snapshot.docChanges().forEach((change) => {
  if (__DEV__) console.log('🎯 Change detected:', change.type, change.doc.id);
        
        if (change.type === 'added') {
          const callData = change.doc.data();
          if (__DEV__) console.log('🎯 Incoming call detected:', callData);
          if (__DEV__) console.log('🎯 Call document ID:', change.doc.id);
          if (__DEV__) console.log('🎯 Call recipientId matches user?', callData.recipientId === currentUser.uid);
          
          // Only show notifications for recent calls (within last 5 minutes)
          const callTime = callData.createdAt?.seconds ? callData.createdAt.seconds * 1000 : Date.now();
          const now = Date.now();
          const timeDiff = now - callTime;
          const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutes
          
          if (__DEV__) console.log('🎯 Call time:', new Date(callTime).toLocaleTimeString());
          if (__DEV__) console.log('🎯 Current time:', new Date(now).toLocaleTimeString());
          if (__DEV__) console.log('🎯 Time difference (ms):', timeDiff);
          if (__DEV__) console.log('🎯 Is recent call?', isRecent);
          
          // Skip test calls or very old calls
          if (change.doc.id.startsWith('test_') && !isRecent) {
            if (__DEV__) console.log('🎯 Skipping old test call');
            return;
          }
          
          if (__DEV__) console.log('🎯 Dispatching RECEIVE_CALL...');
          dispatch({
            type: 'RECEIVE_CALL',
            payload: {
              callType: callData.type,
              caller: callData.callerInfo,
              callId: change.doc.id
            }
          });
          
          if (__DEV__) console.log('🎯 RECEIVE_CALL dispatched with payload:', {
            callType: callData.type,
            caller: callData.callerInfo,
            callId: change.doc.id
          });
        }
      });
    });

    return () => {
      if (__DEV__) console.log('🎯 Cleaning up incoming calls listener for user:', currentUser?.uid);
      unsubscribe();
    };
  }, [currentUser]);

  // (Removed duplicate signaling listener to prevent double application)

  // Listen for signaling data for active call (complete WebRTC handshake)
  useEffect(() => {
    if (!state.callId || !currentUser) return;
    const callRef = doc(db, 'calls', state.callId);
    const unsub = onSnapshot(callRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      // Expect structure: signalData: { [uid]: {...} }
      const signalData = data.signalData || {};
      Object.entries(signalData).forEach(([uid, payload]) => {
        const looksLikeSignal = payload && typeof payload === 'object' && (payload.type || payload.sdp || payload.candidate);
        if (uid === currentUser.uid || !looksLikeSignal) return;

        // Create a stable key to avoid re-applying the same remote payload
        let sigKey;
        try {
          sigKey = `${state.callId}|${uid}|${JSON.stringify(payload).slice(0,512)}`;
        } catch {
          sigKey = `${state.callId}|${uid}|raw`;
        }

        if (appliedSignalsRef.current.has(sigKey)) {
          console.log('🎯 Skipping duplicate remote signal for', uid);
          return;
        }
        appliedSignalsRef.current.add(sigKey);

        try {
          webrtcService.current.handleSignalData(payload);
        } catch (e) {
          console.error('Error handling remote signal data', e);
        }
      });
    });
    return () => unsub();
  }, [state.callId, currentUser]);

  // Timer for call duration (counts during connected and active states)
  useEffect(() => {
    let interval;
    
    if (__DEV__) console.log('🎯 Timer effect - isInCall:', state.isInCall, 'callStatus:', state.callStatus, 'startTime:', state.startTime);
    
    const shouldTick = state.isInCall && (state.callStatus === 'active' || state.callStatus === 'connected') && state.startTime;
    if (shouldTick) {
      if (__DEV__) console.log('🎯 Starting duration timer');
      interval = setInterval(() => {
        const duration = Math.floor((Date.now() - state.startTime) / 1000);
        if (__DEV__) console.log('🎯 Updating duration:', duration);
        dispatch({ type: 'UPDATE_DURATION', payload: duration });
      }, 1000);
    } else {
      if (__DEV__) console.log('🎯 Timer conditions not met');
    }

    return () => {
      if (interval) {
        if (__DEV__) console.log('🎯 Clearing duration timer');
        clearInterval(interval);
      }
    };
  }, [state.isInCall, state.callStatus, state.startTime]);

  // Ring countdown (30s) for unanswered incoming or outgoing calls
  useEffect(() => {
    const isRingingIncoming = state.hasIncomingCall && state.callStatus === 'ringing';
    const isRingingOutgoing = state.isInCall && state.isOutgoing && (state.callStatus === 'ringing' || state.callStatus === 'initiating');
    
  if (__DEV__) console.log('🎯 Ring timeout effect - conditions:', {
      isRingingIncoming,
      isRingingOutgoing,
      hasIncomingCall: state.hasIncomingCall,
      isInCall: state.isInCall,
      isOutgoing: state.isOutgoing,
      callStatus: state.callStatus,
      ringStartTime: state.ringStartTime,
      currentTime: Date.now(),
      timeDiff: state.ringStartTime ? Date.now() - state.ringStartTime : 'no start time'
    });
    
    if (!(isRingingIncoming || isRingingOutgoing) || !state.ringStartTime) {
  if (__DEV__) console.log('🎯 Ring timeout - conditions not met, not starting timer');
      return;
    }

    // Simple countdown starting from 30 seconds
    let countdown = 30;
  if (__DEV__) console.log('🎯 Starting fresh 30-second countdown');
    
    // Update initial countdown
    dispatch({ type: 'RING_TICK', payload: countdown });
    
    const interval = setInterval(() => {
      countdown--;
  if (__DEV__) console.log(`🎯 Ring countdown: ${countdown}s remaining`);
      
      dispatch({ type: 'RING_TICK', payload: countdown });
      
      if (countdown <= 0) {
  if (__DEV__) console.log('🎯 Ring timeout reached - ending call');
  if (__DEV__) console.log('🎯 Final state check before timeout:', {
          hasIncomingCall: state.hasIncomingCall,
          isInCall: state.isInCall,
          isOutgoing: state.isOutgoing,
          callStatus: state.callStatus
        });
        
        // Check current state one more time before timeout
        if (state.hasIncomingCall) {
          if (__DEV__) console.log('🎯 Ending incoming call due to timeout');
          if (state.callId) {
            setDoc(doc(db, 'calls', state.callId), { status: 'missed', missedAt: serverTimestamp() }, { merge: true }).catch(()=>{});
          }
          dispatch({ type: 'DECLINE_CALL' });
        } else if (state.isInCall && state.isOutgoing) {
          if (__DEV__) console.log('🎯 Ending outgoing call due to timeout');
          if (state.callId) {
            setDoc(doc(db, 'calls', state.callId), { status: 'no-answer', endedAt: serverTimestamp() }, { merge: true }).catch(()=>{});
          }
          dispatch({ type: 'CALL_NO_ANSWER' });
        }
      }
    }, 1000);
    
    return () => {
  if (__DEV__) console.log('🎯 Clearing ring countdown timer');
      clearInterval(interval);
    };
  }, [state.hasIncomingCall, state.isOutgoing, state.isInCall, state.callStatus, state.ringStartTime, state.ringRemaining, state.callId]);

  const startCall = async (contactId, contactInfo, callType = 'voice') => {
  if (__DEV__) console.log('🎯 StartCall called with:', { contactId, contactInfo, callType });
  if (__DEV__) console.log('🎯 Current user:', currentUser);
    
    if (!currentUser) {
      console.error('❌ User not authenticated - currentUser is:', currentUser);
      return;
    }

  if (__DEV__) console.log('✅ User authenticated:', currentUser.uid);

    if (!WebRTCService.isSupported()) {
      console.error('❌ WebRTC not supported in this browser');
      dispatch({ type: 'CALL_FAILED' });
      return;
    }

    try {
  if (__DEV__) console.log('🎯 Step 1: Starting call initiation process');
      
      // First dispatch INITIATE_CALL to show preparation state
      dispatch({
        type: 'INITIATE_CALL',
        payload: {
          callType,
          contact: contactInfo,
          callId: null // Will be set after Firebase creation
        }
      });

      const callId = `${currentUser.uid}_${contactId}_${Date.now()}`;
  if (__DEV__) console.log('🎯 Step 2: Generated callId:', callId);
      
  if (__DEV__) console.log('🎯 Step 3: Creating call document in Firebase');
      const callData = {
        id: callId,
        callerId: currentUser.uid,
        recipientId: contactId,
        callerInfo: {
          uid: currentUser.uid,
          name: currentUser.displayName,
          email: currentUser.email,
          avatar: currentUser.photoURL
        },
        recipientInfo: contactInfo,
        type: callType,
        status: 'calling',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'calls', callId), callData);
  if (__DEV__) console.log('✅ Step 3: Call document created in Firebase');
      
      // Ensure callId is available to callbacks before any signal events
      callIdRef.current = callId;

  if (__DEV__) console.log('🎯 Step 4: Dispatching START_CALL action with callId');
      dispatch({
        type: 'START_CALL',
        payload: {
          callType,
          contact: contactInfo,
          callId
        }
      });

  if (__DEV__) console.log('🎯 Step 5: Initializing media');
      const videoEnabled = callType === 'video';
      await webrtcService.current.initializeMedia(videoEnabled);
  if (__DEV__) console.log('✅ Step 5: Media initialized successfully');
      
  if (__DEV__) console.log('🎯 Step 6: Creating peer connection as initiator');
      webrtcService.current.createPeerConnection(true);
  if (__DEV__) console.log('✅ Step 6: Peer connection created');
      
  if (__DEV__) console.log('✅ Call initiation completed successfully');

    } catch (error) {
  console.error('❌ Error starting call:', error);
  if (__DEV__) console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
  });
      
      // Clean up any partial state
      if (webrtcService.current) {
        webrtcService.current.endCall();
      }
      
      dispatch({ type: 'CALL_FAILED' });
    }
  };

  const acceptCall = async () => {
  if (__DEV__) console.log('🎯 Accept call clicked - callId:', state.callId);
  if (__DEV__) console.log('🎯 Current call state:', state);
    
    if (!state.callId) {
      console.error('❌ No callId available for accepting call');
      return;
    }

    if (!currentUser) {
      console.error('❌ User not authenticated for accepting call');
      return;
    }

    if (!WebRTCService.isSupported()) {
      console.error('❌ WebRTC not supported in this browser');
      dispatch({ type: 'UPDATE_CALL_STATUS', payload: 'failed' });
      return;
    }

    try {
  if (__DEV__) console.log('🎯 Starting call acceptance process...');
      
      // Set to answering state first
      dispatch({ 
        type: 'UPDATE_CALL_STATUS', 
        payload: 'answering' 
      });
    
    // Ensure callIdRef is set for any immediate signaling writes
    callIdRef.current = state.callId;
      
      // Initialize media for the recipient
      const videoEnabled = state.callType === 'video';
  if (__DEV__) console.log('🎯 Initializing media - video enabled:', videoEnabled);
      
      await webrtcService.current.initializeMedia(videoEnabled);
      
      // Set up local video if available
      if (localVideoRef.current && webrtcService.current.localStream) {
        localVideoRef.current.srcObject = webrtcService.current.localStream;
      }
      
  // Create peer connection as receiver (not initiator) BEFORE flipping status
  if (__DEV__) console.log('🎯 Creating peer connection as receiver...');
  webrtcService.current.createPeerConnection(false);

    // Now update call status in Firebase
  if (__DEV__) console.log('🎯 Updating call status to active in Firebase...');
    await setDoc(doc(db, 'calls', state.callId), {
      status: 'active',
      acceptedAt: serverTimestamp()
    }, { merge: true });

      // Dispatch accept call action
      dispatch({ 
        type: 'ACCEPT_CALL',
        payload: {
          callStatus: 'active',
          isInCall: true,
          hasIncomingCall: false
        }
      });
      
  if (__DEV__) console.log('✅ Call accepted successfully');
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      dispatch({ type: 'UPDATE_CALL_STATUS', payload: 'failed' });
    }
  };

  const declineCall = async () => {
  if (__DEV__) console.log('🎯 Decline call clicked - callId:', state.callId);
  if (__DEV__) console.log('🎯 Current call state:', state);
    
    if (!state.callId) {
      console.error('❌ No callId available for declining call');
      return;
    }

    try {
  if (__DEV__) console.log('🎯 Updating call status to declined in Firebase...');
      await setDoc(doc(db, 'calls', state.callId), {
        status: 'declined',
        declinedAt: serverTimestamp()
      }, { merge: true });

  if (__DEV__) console.log('🎯 Dispatching DECLINE_CALL action...');
      dispatch({ type: 'DECLINE_CALL' });

      // Clean up call document after a delay
      setTimeout(async () => {
  if (__DEV__) console.log('🎯 Cleaning up call document...');
        await deleteDoc(doc(db, 'calls', state.callId));
      }, 5000);
      
  if (__DEV__) console.log('✅ Call declined successfully');
    } catch (error) {
      console.error('❌ Error declining call:', error);
    }
  };

  const endCall = async () => {
    // End WebRTC connection
    webrtcService.current.endCall();
    
    if (state.callId) {
      try {
        await setDoc(doc(db, 'calls', state.callId), {
          status: 'ended',
          endedAt: serverTimestamp()
        }, { merge: true });

        // Clean up call document after a delay
        setTimeout(async () => {
          await deleteDoc(doc(db, 'calls', state.callId));
        }, 5000);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }

    dispatch({ type: 'END_CALL' });
  };

  const toggleMute = () => {
    const newMutedState = !state.isMuted;
    webrtcService.current.toggleAudio(!newMutedState);
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  const toggleVideo = () => {
    const newVideoState = !state.isVideoOff;
    webrtcService.current.toggleVideo(!newVideoState);
    dispatch({ type: 'TOGGLE_VIDEO' });
  };

  const toggleSpeaker = () => {
    dispatch({ type: 'TOGGLE_SPEAKER' });
  };

  const toggleMinimize = () => {
    dispatch({ type: 'TOGGLE_MINIMIZE' });
  };

  const holdCall = () => {
  if (__DEV__) console.log('🎯 Holding call');
    // Mute audio/video streams
    if (webrtcService.current) {
      webrtcService.current.toggleAudio(false);
      webrtcService.current.toggleVideo(false);
    }
    dispatch({ type: 'CALL_ON_HOLD' });
  };

  const resumeCall = () => {
  if (__DEV__) console.log('🎯 Resuming call');
    // Restore audio/video based on previous state
    if (webrtcService.current) {
      webrtcService.current.toggleAudio(!state.isMuted);
      webrtcService.current.toggleVideo(!state.isVideoOff);
    }
    dispatch({ type: 'CALL_RESUME' });
  };

  const reconnectCall = async () => {
  if (__DEV__) console.log('🎯 Attempting to reconnect call');
    dispatch({ type: 'CALL_RECONNECTING' });
    
    try {
      // Attempt to re-establish WebRTC connection
      if (state.callId && webrtcService.current) {
        // Re-initialize media and peer connection
        const videoEnabled = state.callType === 'video';
        await webrtcService.current.initializeMedia(videoEnabled);
        webrtcService.current.createPeerConnection(state.isOutgoing);
      }
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      dispatch({ type: 'CALL_FAILED' });
    }
  };

  const updateConnectionQuality = (quality) => {
    dispatch({ 
      type: 'SET_CALL_STATE', 
      payload: { connectionQuality: quality } 
    });
  };

  const value = {
    ...state,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    holdCall,
    resumeCall,
    reconnectCall,
    updateConnectionQuality,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleMinimize,
    localVideoRef,
    remoteVideoRef,
  remoteAudioRef,
    isWebRTCSupported: isClient && typeof window !== 'undefined' ? WebRTCService.isSupported() : false
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
