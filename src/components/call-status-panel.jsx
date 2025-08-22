"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { useCall } from '@/context/call-context.jsx';
import { 
  Phone, 
  PhoneOff, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneMissed, 
  Pause, 
  Play, 
  RotateCcw,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function CallStatusPanel() {
  const callState = useCall();
  const [showAllStates, setShowAllStates] = useState(false);

  // All possible call states with their descriptions and colors
  const allCallStates = [
    { 
      state: 'idle', 
      label: 'Idle', 
      description: 'No active call', 
      icon: Phone, 
      color: 'text-gray-500',
      bgColor: 'bg-gray-100'
    },
    { 
      state: 'initiating', 
      label: 'Initiating', 
      description: 'Preparing to start call', 
      icon: PhoneCall, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    { 
      state: 'ringing', 
      label: 'Ringing', 
      description: 'Call is ringing', 
      icon: PhoneIncoming, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      state: 'connecting', 
      label: 'Connecting', 
      description: 'Establishing WebRTC connection', 
      icon: Wifi, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100'
    },
    { 
      state: 'connected', 
      label: 'Connected', 
      description: 'WebRTC connected, waiting for media', 
      icon: CheckCircle, 
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    { 
      state: 'active', 
      label: 'Active', 
      description: 'Call is active with media streams', 
      icon: Phone, 
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    { 
      state: 'on-hold', 
      label: 'On Hold', 
      description: 'Call is on hold', 
      icon: Pause, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    { 
      state: 'reconnecting', 
      label: 'Reconnecting', 
      description: 'Attempting to reconnect', 
      icon: RotateCcw, 
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    },
    { 
      state: 'answering', 
      label: 'Answering', 
      description: 'Answering incoming call', 
      icon: PhoneIncoming, 
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    { 
      state: 'ended', 
      label: 'Ended', 
      description: 'Call has ended', 
      icon: PhoneOff, 
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    { 
      state: 'failed', 
      label: 'Failed', 
      description: 'Call failed to connect', 
      icon: XCircle, 
      color: 'text-red-500',
      bgColor: 'bg-red-100'
    },
    { 
      state: 'busy', 
      label: 'Busy', 
      description: 'Recipient is busy', 
      icon: PhoneMissed, 
      color: 'text-red-500',
      bgColor: 'bg-red-100'
    },
    { 
      state: 'no-answer', 
      label: 'No Answer', 
      description: 'Call was not answered', 
      icon: PhoneMissed, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    { 
      state: 'declined', 
      label: 'Declined', 
      description: 'Call was declined', 
      icon: PhoneOff, 
      color: 'text-red-500',
      bgColor: 'bg-red-100'
    }
  ];

  const getCurrentStateInfo = () => {
    return allCallStates.find(s => s.state === callState.callStatus) || allCallStates[0];
  };

  const currentState = getCurrentStateInfo();
  const CurrentIcon = currentState.icon;

  const getConnectionQualityColor = () => {
    switch (callState.connectionQuality) {
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Current Call Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CurrentIcon className={`h-5 w-5 ${currentState.color}`} />
            Current Call Status
          </CardTitle>
          <CardDescription>
            Real-time call state and controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Status Display */}
          <div className={`p-4 rounded-lg ${currentState.bgColor} border`}>
            <div className="flex items-center gap-3">
              <CurrentIcon className={`h-8 w-8 ${currentState.color}`} />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{currentState.label}</h3>
                <p className="text-sm text-muted-foreground">{currentState.description}</p>
                {callState.callStatus === 'active' && (
                  <p className="text-sm font-medium mt-1">
                    Duration: {formatDuration(callState.duration)}
                  </p>
                )}
              </div>
              <Badge variant="outline" className={currentState.color}>
                {callState.callStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Call Details */}
          {(callState.isInCall || callState.hasIncomingCall) && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Call Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge variant="outline">
                        {callState.callType === 'video' ? (
                          <>
                            <Video className="h-3 w-3 mr-1" />
                            Video
                          </>
                        ) : (
                          <>
                            <Phone className="h-3 w-3 mr-1" />
                            Voice
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Direction:</span>
                      <Badge variant="outline">
                        {callState.isOutgoing ? 'Outgoing' : 'Incoming'}
                      </Badge>
                    </div>
                    {callState.contact && (
                      <div className="flex justify-between">
                        <span>Contact:</span>
                        <span className="font-medium">{callState.contact.name}</span>
                      </div>
                    )}
                    {callState.caller && (
                      <div className="flex justify-between">
                        <span>Caller:</span>
                        <span className="font-medium">{callState.caller.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Connection Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>WebRTC:</span>
                      <Badge variant={callState.isWebRTCSupported ? "default" : "destructive"}>
                        {callState.isWebRTCSupported ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <Badge variant="outline" className={getConnectionQualityColor()}>
                        {callState.connectionQuality || 'Unknown'}
                      </Badge>
                    </div>
                    {callState.reconnectAttempts > 0 && (
                      <div className="flex justify-between">
                        <span>Reconnects:</span>
                        <Badge variant="outline" className="text-orange-600">
                          {callState.reconnectAttempts}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Media Controls Status */}
          {callState.isInCall && callState.callStatus === 'active' && (
            <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
              <Badge variant={callState.isMuted ? "destructive" : "secondary"}>
                {callState.isMuted ? <MicOff className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
                {callState.isMuted ? 'Muted' : 'Audio On'}
              </Badge>
              
              {callState.callType === 'video' && (
                <Badge variant={callState.isVideoOff ? "destructive" : "secondary"}>
                  {callState.isVideoOff ? <VideoOff className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                  {callState.isVideoOff ? 'Video Off' : 'Video On'}
                </Badge>
              )}
              
              <Badge variant={callState.isSpeakerOn ? "default" : "secondary"}>
                {callState.isSpeakerOn ? <Volume2 className="h-3 w-3 mr-1" /> : <VolumeX className="h-3 w-3 mr-1" />}
                Speaker {callState.isSpeakerOn ? 'On' : 'Off'}
              </Badge>

              {callState.isOnHold && (
                <Badge variant="outline" className="text-blue-600">
                  <Pause className="h-3 w-3 mr-1" />
                  On Hold
                </Badge>
              )}
            </div>
          )}

          {/* Advanced Call Controls */}
          {callState.isInCall && callState.callStatus === 'active' && (
            <div className="flex items-center justify-center gap-2">
              {!callState.isOnHold ? (
                <Button 
                  onClick={callState.holdCall}
                  variant="outline" 
                  size="sm"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Hold
                </Button>
              ) : (
                <Button 
                  onClick={callState.resumeCall}
                  variant="outline" 
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              
              {(callState.callStatus === 'failed' || callState.callStatus === 'reconnecting') && (
                <Button 
                  onClick={callState.reconnectCall}
                  variant="outline" 
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reconnect
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Call States Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Call States Reference</CardTitle>
          <CardDescription>
            All possible call states in the system
          </CardDescription>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAllStates(!showAllStates)}
          >
            {showAllStates ? 'Hide' : 'Show'} All States
          </Button>
        </CardHeader>
        {showAllStates && (
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allCallStates.map((stateInfo) => {
                const StateIcon = stateInfo.icon;
                const isCurrentState = callState.callStatus === stateInfo.state;
                
                return (
                  <div
                    key={stateInfo.state}
                    className={`p-3 rounded-lg border ${
                      isCurrentState 
                        ? `${stateInfo.bgColor} border-current ring-2 ring-offset-2 ring-current` 
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <StateIcon className={`h-4 w-4 ${stateInfo.color}`} />
                      <span className="font-medium text-sm">{stateInfo.label}</span>
                      {isCurrentState && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stateInfo.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
