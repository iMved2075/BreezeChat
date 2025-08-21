import * as React from "react";
import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

export default function ChatInput({ value, onChange, onSendMessage, onAttachmentClick }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="relative">
      <Textarea
        placeholder="Type a message..."
        className="pr-20 py-1.5 min-h-[44px] resize-none"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
      <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={onAttachmentClick}
        >
          <Paperclip size={20} />
          <span className="sr-only">Attach file</span>
        </Button>
        <Button size="icon" className="rounded-full bg-accent hover:bg-accent/90" onClick={onSendMessage}>
          <Send size={20} />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
