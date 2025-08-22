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
import { cn } from "@/lib/utils.js";

export default function CallerCallInterface({
  isVisible = false,
  callType = "voice",
  callStatus = "connecting", // "connecting" or "active"
  contact = null,
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
          {callStatus === "connecting" && (
            <span className="text-sm text-yellow-600">
              Calling... {ringRemaining > 0 ? `${ringRemaining}s` : ''}
            </span>
          )}
          {callStatus === "active" && (
            <span className="text-sm text-green-600">
              {formatDuration(duration)}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onMinimize}
        >
          <Minimize2 size={18} />
        </Button>
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
        ) : callType === "video" && callStatus === "connecting" && isWebRTCSupported ? (
          <div className="relative w-full max-w-2xl aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {/* Local video preview while calling */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Calling overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white">
                  <AvatarImage src={contact?.avatar} alt={contact?.name || 'Contact'} />
                  <AvatarFallback className="text-xl">
                    {contact?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold mb-2">{contact?.name || 'Unknown Contact'}</h3>
                <p className="text-white/80 animate-pulse">
                  Calling... {ringRemaining > 0 ? `${ringRemaining}s` : ''}
                </p>
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
            
            {callStatus === "connecting" && (
              <>
                <p className="text-muted-foreground animate-pulse text-lg mb-2">
                  Calling...
                </p>
                {ringRemaining > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-mono text-yellow-600 mb-2">
                      {ringRemaining}s
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Waiting for {contact?.name || 'contact'} to answer
                    </div>
                  </div>
                )}
              </>
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
        {callStatus === "connecting" && (
          <div className="flex items-center gap-2 mb-6">
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse delay-75"></div>
            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse delay-150"></div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-4 p-6 border-t">
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
      </div>
    </div>
  );
}
