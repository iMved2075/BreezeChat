"use client";

import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, UserMinus, Archive, Settings } from "lucide-react";

export default function ChatContextMenu({ 
  children, 
  chat, 
  onCloseChat,
  onArchiveChat 
}) {
  const [closeChatDialog, setCloseChatDialog] = React.useState(false);

  const handleCloseChat = () => {
    setCloseChatDialog(true);
  };

  const confirmCloseChat = () => {
    onCloseChat(chat.id);
    setCloseChatDialog(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="h-full w-full">
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={handleCloseChat}>
            <X className="mr-2 h-4 w-4" />
            Close Chat
          </ContextMenuItem>
          
          {onArchiveChat && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onArchiveChat(chat.id)}>
                <Archive className="mr-2 h-4 w-4" />
                Archive Chat
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={closeChatDialog} onOpenChange={setCloseChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this chat? You can always reopen it by clicking on the contact again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseChat}>
              Close Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
