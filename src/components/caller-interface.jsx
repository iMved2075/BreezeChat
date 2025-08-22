"use client";

import * as React from "react";
import { Button } from "@/components/ui/button.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { 
  Phone, 
  PhoneOff, 
  Video, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils.js";

export default function CallerInterface({
  isVisible = false,
  callType = "voice", // "voice" or "video"
  contact = {},
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onMinimize,
  isMuted = false,
  isVideoOff = false,
  isSpeakerOn = false,
  ringRemaining = 30,
  localVideoRef,
  isWebRTCSupported = false
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {callType === "video" ? "Video Call" : "Voice Call"}
          </h2>
          <span className="text-sm text-muted-foreground">
            Calling... {ringRemaining > 0 ? `${ringRemaining}s` : ''}
          </span>
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
        {callType === "video" && isWebRTCSupported && (
          <div className="relative w-full max-w-2xl aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {/* Local video preview */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            
            {/* Calling overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4">
                  <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white">
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                    <AvatarFallback className="text-xl">
                      {contact.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold mb-2">{contact.name}</h3>
                  <p className="text-white/80 animate-pulse">
                    Calling... {ringRemaining > 0 ? `${ringRemaining}s` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(callType === "voice" || !isWebRTCSupported) && (
          <div className="flex flex-col items-center mb-8">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src={contact.avatar} alt={contact.name} />
              <AvatarFallback className="text-2xl">
                {contact.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-2xl font-semibold mb-2">{contact.name}</h3>
            <p className="text-muted-foreground animate-pulse">
              Calling... {ringRemaining > 0 ? `${ringRemaining}s` : ''}
            </p>
            {!isWebRTCSupported && callType === "video" && (
              <p className="text-yellow-600 text-sm mt-2">
                WebRTC not supported in this browser
              </p>
            )}
          </div>
        )}

        {/* Call Status Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-2 w-2 bg-accent rounded-full animate-pulse"></div>
          <div className="h-2 w-2 bg-accent rounded-full animate-pulse delay-75"></div>
          <div className="h-2 w-2 bg-accent rounded-full animate-pulse delay-150"></div>
        </div>
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
            {isVideoOff ? <Video size={20} /> : <Video size={20} />}
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
