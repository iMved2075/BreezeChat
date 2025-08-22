"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { useCall } from '@/context/call-context.jsx';
import { useAuth } from '@/context/auth-context.jsx';
import { Phone, PhoneOff, Activity } from 'lucide-react';

export default function CallStateMonitor() {
  const { user } = useAuth();
  const { 
    currentStatus,
    isInCall,
    hasIncomingCall,
    isOutgoing,
    callStatus,
    duration,
    contact,
    caller,
    callId,
    ringRemaining,
    startCall,
    endCall
  } = useCall();

  const [stateHistory, setStateHistory] = useState([]);
  const [testUserId, setTestUserId] = useState('test-user-123');

  // Track state changes
  useEffect(() => {
    const newState = {
      timestamp: new Date().toLocaleTimeString(),
      currentStatus,
      isInCall,
      hasIncomingCall,
      isOutgoing,
      callStatus,
      callId,
      ringRemaining,
      contact: contact?.name || null,
      caller: caller?.name || null
    };

    setStateHistory(prev => {
      const updated = [...prev, newState];
      // Keep only last 10 entries
      return updated.slice(-10);
    });

    console.log('🎯 CallStateMonitor - State change:', newState);
  }, [currentStatus, isInCall, hasIncomingCall, isOutgoing, callStatus, callId, ringRemaining, contact, caller]);

  const handleTestCall = async () => {
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    const testContact = {
      uid: testUserId,
      name: `Test User ${testUserId}`,
      email: `${testUserId}@test.com`,
      avatar: null
    };

    console.log('🎯 CallStateMonitor - Starting test call');
    try {
      await startCall(testUserId, testContact, 'voice');
      console.log('✅ CallStateMonitor - Test call started');
    } catch (error) {
      console.error('❌ CallStateMonitor - Test call failed:', error);
    }
  };

  const handleEndCall = () => {
    console.log('🎯 CallStateMonitor - Ending call');
    endCall();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'idle': return 'bg-gray-500';
      case 'initiating': return 'bg-blue-500 animate-pulse';
      case 'ringing': return 'bg-yellow-500 animate-pulse';
      case 'connecting': return 'bg-orange-500 animate-pulse';
      case 'active': return 'bg-green-500';
      case 'ended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current State Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Current Call State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Status:</strong>
              <Badge className={`ml-2 ${getStatusColor(currentStatus)}`}>
                {currentStatus}
              </Badge>
            </div>
            <div>
              <strong>Call Status:</strong>
              <Badge variant="outline" className="ml-2">
                {callStatus}
              </Badge>
            </div>
            <div>
              <strong>In Call:</strong> {isInCall ? '✅' : '❌'}
            </div>
            <div>
              <strong>Incoming:</strong> {hasIncomingCall ? '✅' : '❌'}
            </div>
            <div>
              <strong>Outgoing:</strong> {isOutgoing ? '✅' : '❌'}
            </div>
            <div>
              <strong>Ring Remaining:</strong> {ringRemaining}s
            </div>
            <div>
              <strong>Call ID:</strong> {callId || 'None'}
            </div>
            <div>
              <strong>Duration:</strong> {duration}s
            </div>
          </div>
          
          {contact && (
            <div className="mt-4 p-2 bg-muted rounded">
              <strong>Contact:</strong> {contact.name} ({contact.uid})
            </div>
          )}
          
          {caller && (
            <div className="mt-4 p-2 bg-muted rounded">
              <strong>Caller:</strong> {caller.name} ({caller.uid})
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              placeholder="Test User ID"
              className="px-3 py-2 border rounded flex-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleTestCall}
              disabled={isInCall || !user}
              className="flex-1"
            >
              <Phone className="h-4 w-4 mr-2" />
              Test Call
            </Button>
            
            <Button 
              onClick={handleEndCall}
              disabled={!isInCall}
              variant="destructive"
              className="flex-1"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* State History */}
      <Card>
        <CardHeader>
          <CardTitle>State Transition History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stateHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No state changes yet...</p>
            ) : (
              stateHistory.map((state, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded text-xs">
                  <span className="text-muted-foreground">[{state.timestamp}]</span>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(state.currentStatus)} text-xs`}>
                      {state.currentStatus}
                    </Badge>
                    {state.callStatus && (
                      <Badge variant="outline" className="text-xs">
                        {state.callStatus}
                      </Badge>
                    )}
                    {state.isInCall && <span className="text-green-600">📞</span>}
                    {state.hasIncomingCall && <span className="text-blue-600">📥</span>}
                    {state.isOutgoing && <span className="text-orange-600">📤</span>}
                    {state.ringRemaining > 0 && <span className="text-yellow-600">⏰{state.ringRemaining}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
