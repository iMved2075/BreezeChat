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
  Minimize2,
  Maximize2 
} from "lucide-react";
import { cn } from "@/lib/utils.js";

export default function CallInterface({
  isOpen = false,
  callType = "voice", // "voice" or "video"
  callStatus = "connecting", // "connecting", "active", "ended"
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
  isMinimized = false,
  localVideoRef,
  remoteVideoRef,
  isWebRTCSupported = false,
  ringRemaining,
  isOutgoing
}) {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-xl p-4 min-w-[280px] animate-in slide-in-from-bottom-full duration-300">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={contact?.avatar} alt={contact?.name || 'Contact'} />
            <AvatarFallback>{contact?.name?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{contact?.name || 'Unknown Contact'}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {callType === "video" ? (
                <>
                  <Video size={12} />
                  Video call
                </>
              ) : (
                <>
                  <Phone size={12} />
                  Voice call
                </>
              )}
              {callStatus === "connecting" && typeof ringRemaining === 'number' && (
                <span className="ml-2 text-yellow-600 font-medium">
                  {isOutgoing ? 'Ringing' : 'Incoming'} {ringRemaining}s
                </span>
              )}
              {(callStatus === "active" || callStatus === "connected") && (
                <span className="ml-2 text-green-600 font-medium">
                  {formatDuration(duration)}
                </span>
              )}
              {callStatus === "connecting" && !isOutgoing && (
                <span className="ml-2 text-blue-600 font-medium">
                  Incoming call
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Video preview for video calls */}
        {callType === "video" && callStatus === "active" && (
          <div className="mb-3 relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-32 bg-gray-900 rounded object-cover"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted={true}
              className="absolute bottom-2 right-2 w-16 h-12 bg-gray-800 rounded object-cover border-2 border-white"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="sm"
            className="flex-1"
            onClick={onToggleMute}
            disabled={!isWebRTCSupported}
          >
            {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
          </Button>
          
          {callType === "video" && (
            <Button
              variant={isVideoOff ? "destructive" : "secondary"}
              size="sm"
              className="flex-1"
              onClick={onToggleVideo}
              disabled={!isWebRTCSupported}
            >
              {isVideoOff ? <VideoOff size={14} /> : <Video size={14} />}
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onMinimize}
            title="Expand"
          >
            <Maximize2 size={14} />
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onEndCall}
            title="End call"
          >
            <PhoneOff size={14} />
          </Button>
        </div>
        
        {/* Status indicator */}
        {callStatus === "connecting" && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              Connecting...
            </div>
          </div>
        )}
        
        {callStatus === "active" && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {callType === "video" ? "Video Call" : "Voice Call"}
          </h2>
          {(callStatus === "active" || callStatus === "connected") && (
            <span className="text-sm text-muted-foreground">
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
  <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {callType === "video" && callStatus === "active" && !isVideoOff && isWebRTCSupported ? (
          <div className="relative w-full max-w-2xl aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 sm:mb-6">
            {/* Remote video stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            
            {/* Local video in corner */}
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-24 h-18 sm:w-32 sm:h-24 bg-gray-800 rounded-lg border-2 border-white overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-3 sm:mb-4">
              <AvatarImage src={contact?.avatar} alt={contact?.name || 'Contact'} />
              <AvatarFallback className="text-2xl">
                {contact?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl sm:text-2xl font-semibold mb-2">{contact?.name || 'Unknown Contact'}</h3>
            <p className={cn(
              "text-muted-foreground",
              (callStatus === "connecting" || callStatus === "reconnecting") && "animate-pulse"
            )}>
              {/* Comprehensive status messages for all call states */}
              {callStatus === "idle" && "Ready to call"}
              {callStatus === "initiating" && "Preparing call..."}
              {callStatus === "ringing" && (
                isOutgoing
                  ? (typeof ringRemaining === 'number' ? `Ringing... ${ringRemaining}s` : 'Ringing...')
                  : 'Incoming call...'
              )}
              {callStatus === "connecting" && "Establishing connection..."}
              {callStatus === "connected" && formatDuration(duration)}
              {callStatus === "active" && formatDuration(duration)}
              {callStatus === "on-hold" && "Call on hold"}
              {callStatus === "reconnecting" && "Reconnecting..."}
              {callStatus === "answering" && "Answering call..."}
              {callStatus === "ended" && "Call ended"}
              {callStatus === "failed" && "Call failed - connection error"}
              {callStatus === "busy" && "User is busy"}
              {callStatus === "no-answer" && "No answer"}
              {callStatus === "declined" && "Call declined"}
            </p>
            {(callStatus === "connecting" || callStatus === "ringing") && isOutgoing && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  {callStatus === "connecting" ? `Connecting to ${contact?.name || 'contact'}...` : `Calling ${contact?.name || 'contact'}...`}
                </div>
                {typeof ringRemaining === 'number' && callStatus === "ringing" && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {ringRemaining} seconds remaining
                  </div>
                )}
              </div>
            )}
            {callStatus === "reconnecting" && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  Connection lost, attempting to reconnect...
                </div>
              </div>
            )}
            {callStatus === "on-hold" && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Call is on hold
                </div>
              </div>
            )}
            {!isWebRTCSupported && (callStatus === "connecting" || callStatus === "ringing") && (
              <p className="text-yellow-600 text-sm mt-2">
                WebRTC not supported in this browser
              </p>
            )}
          </div>
        )}

        {/* Enhanced Call Status Indicators */}
        {(callStatus === "connecting" || callStatus === "ringing" || callStatus === "reconnecting") && (
          <div className="flex items-center gap-2 mb-6">
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              callStatus === "connecting" ? "bg-yellow-500" :
              callStatus === "ringing" ? "bg-blue-500" :
              callStatus === "reconnecting" ? "bg-orange-500" : "bg-accent"
            )}></div>
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse delay-75",
              callStatus === "connecting" ? "bg-yellow-500" :
              callStatus === "ringing" ? "bg-blue-500" :
              callStatus === "reconnecting" ? "bg-orange-500" : "bg-accent"
            )}></div>
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse delay-150",
              callStatus === "connecting" ? "bg-yellow-500" :
              callStatus === "ringing" ? "bg-blue-500" :
              callStatus === "reconnecting" ? "bg-orange-500" : "bg-accent"
            )}></div>
          </div>
        )}
        
        {callStatus === "on-hold" && (
          <div className="flex items-center gap-2 mb-6">
            <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce"></div>
            <span className="text-blue-600 text-sm font-medium">On Hold</span>
            <div className="h-3 w-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
  <div className="flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 border-t">
        {/* Mute Button */}
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="default"
          className="rounded-full h-12 w-12 sm:h-14 sm:w-14"
          onClick={onToggleMute}
        >
          {isMuted ? <MicOff size={18} className="sm:size-5" /> : <Mic size={18} className="sm:size-5" />}
        </Button>

        {/* Video Toggle (only for video calls) */}
        {callType === "video" && (
          <Button
            variant={isVideoOff ? "destructive" : "secondary"}
            size="default"
            className="rounded-full h-12 w-12 sm:h-14 sm:w-14"
            onClick={onToggleVideo}
          >
            {isVideoOff ? <VideoOff size={18} className="sm:size-5" /> : <Video size={18} className="sm:size-5" />}
          </Button>
        )}

        {/* Speaker Button */}
        <Button
          variant={isSpeakerOn ? "default" : "secondary"}
          size="default"
          className="rounded-full h-12 w-12 sm:h-14 sm:w-14"
          onClick={onToggleSpeaker}
        >
          {isSpeakerOn ? <Volume2 size={18} className="sm:size-5" /> : <VolumeX size={18} className="sm:size-5" />}
        </Button>

        {/* End Call Button */}
        <Button
          variant="destructive"
          size="default"
          className="rounded-full h-14 w-14 sm:h-16 sm:w-16"
          onClick={onEndCall}
        >
          <PhoneOff size={20} className="sm:size-6" />
        </Button>
      </div>
    </div>
  );
}
