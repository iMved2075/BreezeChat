"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { useAuth } from '@/context/auth-context.jsx';
import { useCall } from '@/context/call-context.jsx';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.js';
import { Phone, CheckCircle, XCircle, AlertCircle, Database, Wifi, User } from 'lucide-react';

export default function CallDebug() {
  const { user } = useAuth();
  const callState = useCall();
  const [firebaseConnected, setFirebaseConnected] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { timestamp, message, type }]);
  };

  // Test Firebase connectivity
  const testFirebaseConnection = async () => {
    addResult('Testing Firebase connection...', 'info');
    try {
      // Try to create a test document
      const testDoc = await addDoc(collection(db, 'test'), {
        test: true,
        timestamp: serverTimestamp(),
        userId: user?.uid
      });
      
      setFirebaseConnected(true);
      addResult('✅ Firebase connection successful', 'success');
      addResult(`Test document created: ${testDoc.id}`, 'info');
      
      return true;
    } catch (error) {
      setFirebaseConnected(false);
      addResult(`❌ Firebase connection failed: ${error.message}`, 'error');
      return false;
    }
  };

  // Test call creation
  const testCallCreation = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    addResult('Testing call document creation...', 'info');
    try {
      const testCallId = `debug_call_${Date.now()}`;
      const callData = {
        id: testCallId,
        callerId: user.uid,
        recipientId: 'test_recipient_123',
        callerInfo: {
          uid: user.uid,
          name: user.displayName || 'Test Caller',
          email: user.email,
          avatar: user.photoURL
        },
        recipientInfo: {
          uid: 'test_recipient_123',
          name: 'Test Recipient',
          email: 'test@example.com'
        },
        type: 'voice',
        status: 'calling',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'calls', testCallId), callData);
      addResult('✅ Call document created successfully', 'success');
      addResult(`Call ID: ${testCallId}`, 'info');
      
      return testCallId;
    } catch (error) {
      addResult(`❌ Call creation failed: ${error.message}`, 'error');
      return null;
    }
  };

  // Test incoming call listener
  const testIncomingCallListener = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    addResult('Testing incoming call listener...', 'info');
    try {
      const callsRef = collection(db, 'calls');
      const q = query(
        callsRef,
        where('recipientId', '==', user.uid),
        where('status', '==', 'calling')
      );

      addResult('Setting up listener...', 'info');
      let listenerActive = false;
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!listenerActive) {
          addResult('✅ Incoming call listener is active', 'success');
          listenerActive = true;
        }
        
        addResult(`Snapshot received with ${snapshot.docs.length} documents`, 'info');
        
        snapshot.docChanges().forEach((change) => {
          addResult(`Change detected: ${change.type} - ${change.doc.id}`, 'info');
          if (change.type === 'added') {
            const callData = change.doc.data();
            addResult(`Incoming call from: ${callData.callerInfo?.name}`, 'success');
          }
        });
      }, (error) => {
        addResult(`❌ Listener error: ${error.message}`, 'error');
      });

      // Clean up after 10 seconds
      setTimeout(() => {
        unsubscribe();
        addResult('Listener test completed', 'info');
      }, 10000);
      
    } catch (error) {
      addResult(`❌ Listener setup failed: ${error.message}`, 'error');
    }
  };

  // Create test call to self
  const createTestCallToSelf = async () => {
    if (!user) {
      addResult('❌ No user logged in', 'error');
      return;
    }

    addResult('Creating test call to self...', 'info');
    const testCallId = `self_call_${Date.now()}`;
    
    try {
      const callData = {
        id: testCallId,
        callerId: 'test_caller_999',
        recipientId: user.uid, // Call to self
        callerInfo: {
          uid: 'test_caller_999',
          name: 'Test Debug Caller',
          email: 'debug@test.com',
          avatar: 'https://placehold.co/100x100.png'
        },
        recipientInfo: {
          uid: user.uid,
          name: user.displayName || 'You',
          email: user.email,
          avatar: user.photoURL
        },
        type: 'voice',
        status: 'calling',
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'calls', testCallId), callData);
      addResult('✅ Test call created - should trigger notification', 'success');
      addResult(`Test call ID: ${testCallId}`, 'info');
      addResult('Check if incoming call notification appears...', 'info');
      
    } catch (error) {
      addResult(`❌ Test call creation failed: ${error.message}`, 'error');
    }
  };

  // Run comprehensive connectivity test
  const runConnectivityTest = async () => {
    setIsTestingConnectivity(true);
    setTestResults([]);
    
    addResult('Starting comprehensive connectivity test...', 'info');
    addResult(`User: ${user?.displayName} (${user?.uid})`, 'info');
    addResult(`Call state - hasIncomingCall: ${callState.hasIncomingCall}`, 'info');
    addResult(`Call state - isInCall: ${callState.isInCall}`, 'info');
    
    // Test Firebase connection
    const firebaseOk = await testFirebaseConnection();
    
    if (firebaseOk) {
      // Test call creation
      await testCallCreation();
      
      // Test incoming call listener
      await testIncomingCallListener();
      
      // Wait a moment then create test call to self
      setTimeout(async () => {
        await createTestCallToSelf();
        setIsTestingConnectivity(false);
      }, 2000);
    } else {
      setIsTestingConnectivity(false);
    }
  };

  useEffect(() => {
    if (user) {
      testFirebaseConnection();
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please log in to test the call system
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Call System Debug & Connectivity Test
          </CardTitle>
          <CardDescription>
            Diagnose issues with WebRTC calling and Firebase connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Indicators */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <User className="h-4 w-4" />
              <span className="font-medium">User:</span>
              <span className="text-sm">{user.displayName || user.email}</span>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Database className="h-4 w-4" />
              <span className="font-medium">Firebase:</span>
              {firebaseConnected ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <Phone className="h-4 w-4" />
              <span className="font-medium">Incoming Call:</span>
              {callState.hasIncomingCall ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={runConnectivityTest}
              disabled={isTestingConnectivity}
              className="flex-1"
            >
              <Wifi className="h-4 w-4 mr-2" />
              {isTestingConnectivity ? 'Testing...' : 'Run Connectivity Test'}
            </Button>
            
            <Button 
              onClick={createTestCallToSelf}
              disabled={!firebaseConnected}
              variant="outline"
            >
              <Phone className="h-4 w-4 mr-2" />
              Test Call to Self
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Call State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Call State</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
            {JSON.stringify({
              isInCall: callState.isInCall,
              hasIncomingCall: callState.hasIncomingCall,
              callStatus: callState.callStatus,
              callType: callState.callType,
              caller: callState.caller,
              contact: callState.contact,
              callId: callState.callId,
              isWebRTCSupported: callState.isWebRTCSupported,
              duration: callState.duration
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results & Debug Logs</CardTitle>
          <CardDescription>
            Real-time test results and system diagnostics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto bg-muted rounded-lg p-3 font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">No test results yet. Click "Run Connectivity Test" to begin.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className={`mb-1 ${
                  result.type === 'error' ? 'text-red-600' : 
                  result.type === 'success' ? 'text-green-600' :
                  result.type === 'warning' ? 'text-yellow-600' : 
                  'text-foreground'
                }`}>
                  <span className="text-muted-foreground">[{result.timestamp}]</span> {result.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
