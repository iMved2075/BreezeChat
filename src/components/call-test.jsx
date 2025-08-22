"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { useCall } from '@/context/call-context.jsx';
import { useAuth } from '@/context/auth-context.jsx';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase.js';
import { Phone, Video, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function CallTest() {
  const { user } = useAuth();
  const { 
    startCall, 
    isWebRTCSupported,
    isInCall,
    hasIncomingCall,
    callStatus,
    duration,
    contact,
    caller
  } = useCall();

  const [testUserId, setTestUserId] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [logs, setLogs] = useState([]);

  // Add log function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Load available users for testing
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(10));
        const snapshot = await getDocs(q);
        const users = [];
        
        snapshot.forEach((doc) => {
          const userData = doc.data();
          if (doc.id !== user?.uid) { // Don't include current user
            users.push({
              uid: doc.id,
              ...userData
            });
          }
        });
        
        setAvailableUsers(users);
        addLog(`Loaded ${users.length} available users for testing`);
      } catch (error) {
        addLog(`Error loading users: ${error.message}`, 'error');
      }
    };

    if (user) {
      loadUsers();
    }
  }, [user]);

  // Monitor call state changes
  useEffect(() => {
    if (isInCall) {
      addLog(`Call state: ${callStatus} ${contact ? `with ${contact.name}` : ''}`, 'success');
      setConnectionStatus('connected');
    } else if (hasIncomingCall) {
      addLog(`Incoming call from ${caller?.name || 'Unknown'}`, 'info');
      setConnectionStatus('incoming');
    } else {
      if (connectionStatus !== 'idle') {
        addLog('Call ended or disconnected', 'warning');
        setConnectionStatus('idle');
      }
    }
  }, [isInCall, hasIncomingCall, callStatus, contact, caller, connectionStatus]);

  const handleStartVoiceCall = async () => {
    if (!testUserId.trim()) {
      addLog('Please enter a User ID to call', 'error');
      return;
    }

    const targetUser = availableUsers.find(u => u.uid === testUserId);
    if (!targetUser) {
      addLog(`User ${testUserId} not found. Creating mock contact.`, 'warning');
    }

    const contactInfo = targetUser || {
      uid: testUserId,
      name: `Test User ${testUserId}`,
      email: `${testUserId}@test.com`,
      avatar: null
    };

    addLog(`Starting voice call to ${contactInfo.name} (${contactInfo.uid})`, 'info');
    setConnectionStatus('calling');
    
    try {
      await startCall(testUserId, contactInfo, 'voice');
      addLog('Voice call initiated successfully', 'success');
    } catch (error) {
      addLog(`Error starting voice call: ${error.message}`, 'error');
      setConnectionStatus('error');
    }
  };

  const handleStartVideoCall = async () => {
    if (!testUserId.trim()) {
      addLog('Please enter a User ID to call', 'error');
      return;
    }

    const targetUser = availableUsers.find(u => u.uid === testUserId);
    if (!targetUser) {
      addLog(`User ${testUserId} not found. Creating mock contact.`, 'warning');
    }

    const contactInfo = targetUser || {
      uid: testUserId,
      name: `Test User ${testUserId}`,
      email: `${testUserId}@test.com`,
      avatar: null
    };

    addLog(`Starting video call to ${contactInfo.name} (${contactInfo.uid})`, 'info');
    setConnectionStatus('calling');
    
    try {
      await startCall(testUserId, contactInfo, 'video');
      addLog('Video call initiated successfully', 'success');
    } catch (error) {
      addLog(`Error starting video call: ${error.message}`, 'error');
      setConnectionStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'calling':
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'incoming':
        return <Phone className="h-4 w-4 text-blue-500 animate-bounce" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            WebRTC Call Test
          </CardTitle>
          <CardDescription>
            Please log in to test calling functionality
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            WebRTC Call Test
          </CardTitle>
          <CardDescription>
            Test voice and video calling between users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <User className="h-4 w-4" />
            <span className="font-medium">Current User:</span>
            <span>{user.displayName || user.email}</span>
            <Badge variant="outline">{user.uid}</Badge>
          </div>

          {/* WebRTC Support Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {isWebRTCSupported ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span>WebRTC Support: </span>
            <Badge variant={isWebRTCSupported ? "default" : "destructive"}>
              {isWebRTCSupported ? "Supported" : "Not Supported"}
            </Badge>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            {getStatusIcon()}
            <span>Connection Status: </span>
            <Badge variant="outline" className="capitalize">
              {connectionStatus}
            </Badge>
            {isInCall && (
              <div className="flex items-center gap-2 ml-4">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Manual Test</CardTitle>
            <CardDescription>
              Enter a User ID to call directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter User ID to call"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              disabled={isInCall}
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleStartVoiceCall}
                disabled={!testUserId.trim() || isInCall || !isWebRTCSupported}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                Voice Call
              </Button>
              
              <Button 
                onClick={handleStartVideoCall}
                disabled={!testUserId.trim() || isInCall || !isWebRTCSupported}
                className="flex-1"
              >
                <Video className="h-4 w-4 mr-2" />
                Video Call
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Users</CardTitle>
            <CardDescription>
              Click to quick-call available users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users found</p>
              ) : (
                availableUsers.map((user) => (
                  <div 
                    key={user.uid}
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                    onClick={() => setTestUserId(user.uid)}
                  >
                    <div>
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.uid}</div>
                    </div>
                    <Badge variant="outline">Online</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Test Logs</CardTitle>
            <CardDescription>
              Real-time connection and call status logs
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            Clear Logs
          </Button>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto bg-muted rounded-lg p-3 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${
                  log.type === 'error' ? 'text-red-600' : 
                  log.type === 'success' ? 'text-green-600' :
                  log.type === 'warning' ? 'text-yellow-600' : 
                  'text-foreground'
                }`}>
                  <span className="text-muted-foreground">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
