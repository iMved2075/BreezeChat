import * as React from "react";
import { cn } from "@/lib/utils.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import ChatHeader from "@/components/chat-header.jsx";
import ChatInput from "@/components/chat-input.jsx";
import SmartReplySuggestions from "@/components/smart-reply-suggestions.jsx";

const FormattedTime = ({ timestamp }) => {
  const [formattedTime, setFormattedTime] = React.useState("");

  React.useEffect(() => {
    if (timestamp?.toDate) {
      setFormattedTime(new Date(timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [timestamp]);

  if (!formattedTime) {
    return null;
  }

  return <>{formattedTime}</>;
};

export default function ChatView({ chat, userId, onSendMessage, getChatDetails, users }) {
  const [messageText, setMessageText] = React.useState("");
  const scrollAreaRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollable = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if(scrollable) {
        scrollable.scrollTo({
            top: scrollable.scrollHeight,
            behavior: "smooth",
        });
      }
    }
  }, [chat.messages]);
  
  React.useEffect(() => {
    setMessageText("");
  }, [chat.id]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(chat.id, messageText);
      setMessageText("");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onSendMessage(chat.id, suggestion);
  };

  const chatHistory = React.useMemo(() => {
    return chat.messages
      .map((msg) => {
        const sender = users.find((u) => u.id === msg.senderId);
        return `${sender?.name || "Unknown"}: ${msg.content}`;
      })
      .join("\n");
  }, [chat.messages, users]);

  return (
    <div className="flex flex-col h-screen bg-card">
      <ChatHeader chat={chat} getChatDetails={getChatDetails} users={users} />
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chat.messages.map((message, index) => {
            const sender = users.find((user) => user.id === message.senderId);
            const isYou = message.senderId === userId;
            const showAvatar = !isYou && (index === 0 || chat.messages[index - 1].senderId !== message.senderId);

            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2",
                  isYou ? "justify-end" : "justify-start"
                )}
              >
                {!isYou && (
                  <div className="w-8 h-8">
                  {showAvatar && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={sender?.avatar} alt={sender?.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-3 py-2 text-sm",
                    isYou
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {!isYou && showAvatar && <p className="font-bold mb-1">{sender?.name}</p>}
                  <p>{message.content}</p>
                   <p className="text-xs text-muted-foreground/70 text-right mt-1">
                      <FormattedTime timestamp={message.timestamp} />
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border bg-background">
        <SmartReplySuggestions
          chatHistory={chatHistory}
          onSuggestionClick={handleSuggestionClick}
        />
        <ChatInput
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
