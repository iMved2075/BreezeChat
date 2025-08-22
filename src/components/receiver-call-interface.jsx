"use client";

import * as React from "react";
import { Button } from "@/components/ui/button.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Minimize2
} from "lucide-react";

export default function ReceiverCallInterface({
  isVisible = false,
  callType = "voice",
  callStatus = "incoming", // "incoming", "answering", or "active"
  contact = null,
  onAcceptCall,
  onDeclineCall,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onMinimize,
  duration = 0,
  isMuted = false,
  isVideoOff = false,
  isSpeakerOn = false,
  ringRemaining = 30,
  localVideoRef,
  remoteVideoRef,
  isWebRTCSupported = false
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {callType === "video" ? "Video Call" : "Voice Call"}
          </h2>
          {callStatus === "incoming" && (
            <span className="text-sm text-blue-600">
              Incoming Call {ringRemaining > 0 ? `(${ringRemaining}s)` : ''}
            </span>
          )}
          {callStatus === "answering" && (
            <span className="text-sm text-yellow-600">
              Answering...
            </span>
          )}
          {callStatus === "active" && (
            <span className="text-sm text-green-600">
              {formatDuration(duration)}
            </span>
          )}
        </div>
        {callStatus === "active" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
          >
            <Minimize2 size={18} />
          </Button>
        )}
      </div>

      {/* Main Call Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {callType === "video" && callStatus === "active" && !isVideoOff && isWebRTCSupported ? (
          <div className="relative w-full max-w-2xl aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {/* Remote video stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Local video in corner */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg border-2 border-white overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>
          </div>
        ) : callType === "video" && (callStatus === "answering" || callStatus === "incoming") && isWebRTCSupported ? (
          <div className="relative w-full max-w-2xl aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {/* Local video preview while answering */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Incoming call overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white">
                  <AvatarImage src={contact?.avatar} alt={contact?.name || 'Contact'} />
                  <AvatarFallback className="text-xl">
                    {contact?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold mb-2">{contact?.name || 'Unknown Contact'}</h3>
                {callStatus === "incoming" && (
                  <p className="text-white/80 animate-pulse">
                    Incoming {callType} call...
                  </p>
                )}
                {callStatus === "answering" && (
                  <p className="text-white/80 animate-pulse">
                    Connecting...
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src={contact?.avatar} alt={contact?.name || 'Contact'} />
              <AvatarFallback className="text-2xl">
                {contact?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-2xl font-semibold mb-2">{contact?.name || 'Unknown Contact'}</h3>
            
            {callStatus === "incoming" && (
              <>
                <p className="text-muted-foreground animate-pulse text-lg mb-2">
                  Incoming {callType} call
                </p>
                {ringRemaining > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-mono text-blue-600 mb-2">
                      {ringRemaining}s
                    </div>
                  </div>
                )}
              </>
            )}

            {callStatus === "answering" && (
              <p className="text-muted-foreground animate-pulse text-lg mb-2">
                Connecting...
              </p>
            )}
            
            {callStatus === "active" && (
              <div className="text-center">
                <div className="text-2xl font-mono text-green-600 mb-2">
                  {formatDuration(duration)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Connected
                </div>
              </div>
            )}
            
            {!isWebRTCSupported && (
              <p className="text-yellow-600 text-sm mt-2">
                WebRTC not supported in this browser
              </p>
            )}
          </div>
        )}

        {/* Call Status Indicator */}
        {(callStatus === "incoming" || callStatus === "answering") && (
          <div className="flex items-center gap-2 mb-6">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4 p-6 border-t">
        {/* Incoming call buttons */}
        {callStatus === "incoming" && (
          <>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-16 w-16"
              onClick={onDeclineCall}
            >
              <PhoneOff size={24} />
            </Button>
            <Button
              variant="default"
              size="lg"
              className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700"
              onClick={onAcceptCall}
              disabled={!isWebRTCSupported}
            >
              {callType === "video" ? <Video size={24} /> : <Phone size={24} />}
            </Button>
          </>
        )}

        {/* Active call controls */}
        {(callStatus === "answering" || callStatus === "active") && (
          <>
            {/* Mute Button */}
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={onToggleMute}
              disabled={!isWebRTCSupported}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </Button>

            {/* Video Toggle (only for video calls) */}
            {callType === "video" && (
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={onToggleVideo}
                disabled={!isWebRTCSupported}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </Button>
            )}

            {/* Speaker Button */}
            <Button
              variant={isSpeakerOn ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={onToggleSpeaker}
            >
              {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </Button>

            {/* End Call Button */}
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-16 w-16"
              onClick={onEndCall}
            >
              <PhoneOff size={24} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
