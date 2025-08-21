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
import { Edit3, Trash2, UserX, Users } from "lucide-react";

export default function MessageContextMenu({ 
  children, 
  message, 
  isYou, 
  onEditMessage, 
  onDeleteMessage 
}) {
  const [deleteDialog, setDeleteDialog] = React.useState({ open: false, type: null });

  const handleDelete = (type) => {
    setDeleteDialog({ open: true, type });
  };

  const confirmDelete = () => {
    onDeleteMessage(message.id, deleteDialog.type === 'everyone');
    setDeleteDialog({ open: false, type: null });
  };

  // Don't show context menu for messages that are deleted
  if (message.isDeleted) {
    return children;
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {isYou && !message.mediaUrl && (
            <>
              <ContextMenuItem onClick={() => onEditMessage(message.id, message.content)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Message
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          
          {isYou && (
            <>
              <ContextMenuItem onClick={() => handleDelete('me')}>
                <UserX className="mr-2 h-4 w-4" />
                Delete for Me
              </ContextMenuItem>
              <ContextMenuItem 
                onClick={() => handleDelete('everyone')}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete for Everyone
              </ContextMenuItem>
            </>
          )}
          
          {!isYou && (
            <ContextMenuItem onClick={() => handleDelete('me')}>
              <UserX className="mr-2 h-4 w-4" />
              Delete for Me
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'everyone' 
                ? "This message will be deleted for everyone in the chat. This action cannot be undone."
                : "This message will be deleted for you only. Other participants will still see the message."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className={deleteDialog.type === 'everyone' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Delete {deleteDialog.type === 'everyone' ? 'for Everyone' : 'for Me'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
