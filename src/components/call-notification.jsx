"use client";

import * as React from "react";
import { Button } from "@/components/ui/button.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Phone, PhoneOff, Video } from "lucide-react";
import { cn } from "@/lib/utils.js";

export default function CallNotification({
  isVisible = false,
  callType = "voice", // "voice" or "video"
  caller = {},
  onAccept,
  onDecline,
  className,
  ringRemaining // optional countdown seconds
}) {
  const __DEV__ = process.env.NODE_ENV !== 'production';
  // Enhanced debug logging
  if (__DEV__) console.log('🎯 CallNotification render with props:', {
    isVisible,
    callType,
    caller: caller ? {
      uid: caller.uid,
      name: caller.name,
      email: caller.email,
      avatar: caller.avatar
    } : null,
    hasOnAccept: !!onAccept,
    hasOnDecline: !!onDecline,
    ringRemaining
  });

  if (__DEV__) console.log('🎯 CallNotification full caller object:', caller);

  if (!isVisible) {
    if (__DEV__) console.log('🎯 CallNotification not visible - isVisible:', isVisible);
    return null;
  }

  if (!caller || !caller.name) {
    if (__DEV__) console.log('🎯 CallNotification visible but no valid caller data:', caller);
  }

  if (__DEV__) console.log('🎯 CallNotification rendering notification UI for caller:', caller?.name);

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 min-w-[300px] animate-in slide-in-from-right-full duration-300",
      className
    )}>
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={caller?.avatar} alt={caller?.name || 'Caller'} />
          <AvatarFallback>{caller?.name?.charAt(0) || 'C'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-semibold">{caller?.name || 'Unknown Caller'}</h4>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {callType === "video" ? (
              <>
                <Video size={14} />
                Incoming video call
              </>
            ) : (
              <>
                <Phone size={14} />
                Incoming voice call
              </>
            )}
            {typeof ringRemaining === 'number' && (
              <span className="ml-2 text-xs text-foreground font-medium">{ringRemaining}s</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          className="flex-1 rounded-full"
          onClick={() => {
            if (__DEV__) console.log('🎯 Decline button clicked');
            if (__DEV__) console.log('🎯 onDecline function:', onDecline);
            if (onDecline) {
              onDecline();
            } else {
              console.error('❌ onDecline function is not available');
            }
          }}
        >
          <PhoneOff size={16} className="mr-1" />
          Decline
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
          onClick={() => {
            if (__DEV__) console.log('🎯 Accept button clicked');
            if (__DEV__) console.log('🎯 onAccept function:', onAccept);
            if (onAccept) {
              onAccept();
            } else {
              console.error('❌ onAccept function is not available');
            }
          }}
        >
          <Phone size={16} className="mr-1" />
          Accept
        </Button>
      </div>

  {/* Animated ring indicator (non-interactive) */}
  <div className="pointer-events-none absolute -inset-1 rounded-lg border-2 border-green-500 animate-pulse opacity-50" />
    </div>
  );
}
