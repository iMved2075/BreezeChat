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
    <div className="relative w-full min-w-0 max-w-full">
      <Textarea
        placeholder="Type a message..."
        className="py-1.5 min-h-[44px] resize-none pr-24 md:pr-28"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
      <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full h-9 w-9"
          onClick={onAttachmentClick}
        >
          <Paperclip size={20} />
          <span className="sr-only">Attach file</span>
        </Button>
        <Button size="icon" className="rounded-full h-9 w-9 bg-accent hover:bg-accent/90" onClick={onSendMessage}>
          <Send size={20} />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
