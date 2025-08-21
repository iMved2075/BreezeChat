"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";

export default function EditMessageDialog({ 
  isOpen, 
  onClose, 
  message, 
  onSaveEdit 
}) {
  const [editedContent, setEditedContent] = React.useState(message?.content || "");

  React.useEffect(() => {
    if (message?.content) {
      setEditedContent(message.content);
    }
  }, [message]);

  const handleSave = () => {
    if (editedContent.trim() && editedContent !== message?.content) {
      onSaveEdit(message.id, editedContent.trim());
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Edit your message..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
          
          <div className="text-xs text-muted-foreground">
            Press Enter to save, Shift+Enter for new line, Esc to cancel
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!editedContent.trim() || editedContent === message?.content}
          >
            <Send className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
