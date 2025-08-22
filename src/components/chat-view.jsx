import * as React from "react";
import { cn } from "@/lib/utils.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Paperclip, Download, Check, ExternalLink, Upload, Save, Maximize2, Edit, Trash } from "lucide-react";
import { extractFileIdFromUrl, getDirectLink } from "@/lib/googleDrive.js";
import ChatHeader from "@/components/chat-header.jsx";
import ChatInput from "@/components/chat-input.jsx";
import dynamic from 'next/dynamic';
const SmartReplySuggestions = dynamic(() => import("@/components/smart-reply-suggestions.jsx"), {
  ssr: false,
  // Keep it lightweight; render nothing until loaded
  loading: () => null,
});
import ImageModal from "@/components/image-modal.jsx";
import MessageContextMenu from "@/components/message-context-menu.jsx";
import EditMessageDialog from "@/components/edit-message-dialog.jsx";
import ChatContextMenu from "@/components/chat-context-menu.jsx";

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

export default function ChatView({ 
  chat, 
  userId, 
  onSendMessage, 
  getChatDetails, 
  users, 
  onFileUpload, 
  onOpenMediaUploader, 
  onMarkAsRead,
  onEditMessage,
  onDeleteMessage,
  onCloseChat 
}) {
  const [messageText, setMessageText] = React.useState("");
  const scrollAreaRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [imageModal, setImageModal] = React.useState({ open: false, url: '', fileName: '' });
  const [editDialog, setEditDialog] = React.useState({ open: false, message: null });

  // Function to download image
  const downloadImage = async (imageUrl, fileName) => {
    try {
      // Handle base64 images
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName || 'image.jpg';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Handle regular URLs
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = fileName || 'image.jpg';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback: open in new tab
      try {
        window.open(imageUrl, '_blank');
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        alert('Unable to download image. Please try right-clicking and saving manually.');
      }
    }
  };

  // Function to open image in modal
  const openImageModal = (imageUrl, fileName) => {
    setImageModal({ open: true, url: imageUrl, fileName: fileName || 'Image' });
  };

  // Function to close image modal
  const closeImageModal = () => {
    setImageModal({ open: false, url: '', fileName: '' });
  };

  // Handle edit message
  const handleEditMessage = (messageId, currentContent) => {
    const message = chat.messages.find(m => m.id === messageId);
    if (message) {
      setEditDialog({ open: true, message });
    }
  };

  // Handle save edit
  const handleSaveEdit = (messageId, newContent) => {
    onEditMessage(messageId, newContent);
    setEditDialog({ open: false, message: null });
  };

  // Handle delete message
  const handleDeleteMessage = (messageId, deleteForEveryone) => {
    onDeleteMessage(messageId, deleteForEveryone);
  };

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
    // Mark messages as read when chat is opened
    if (onMarkAsRead) {
      onMarkAsRead(chat.id);
    }
  }, [chat.id, onMarkAsRead]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      onSendMessage(chat.id, messageText);
      setMessageText("");
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && onFileUpload) {
      onFileUpload(file, chat.id);
    }
    // Clear the input
    event.target.value = '';
  };

  const handleSuggestionClick = (suggestion) => {
    onSendMessage(chat.id, suggestion);
  };

  const renderMedia = (message) => {
    if (!message.mediaUrl) return null;

    // Check if it's a base64 image (fallback)
    const isBase64 = message.mediaUrl.startsWith('data:');
    const fileId = !isBase64 ? extractFileIdFromUrl(message.mediaUrl) : null;
    const directLink = fileId ? getDirectLink(fileId) : message.mediaUrl;

    switch (message.mediaType) {
      case 'image':
        return (
          <div className="relative group max-w-sm sm:max-w-md">
            <div className="relative overflow-hidden rounded-lg bg-muted shadow-sm">
              <img 
                src={directLink} 
                alt={message.content}
                className="w-full h-auto max-h-64 sm:max-h-80 object-cover cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                onClick={() => openImageModal(directLink, message.content)}
                onError={(e) => {
                  // If direct link fails, show a fallback
                  if (!isBase64) {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
                loading="lazy"
              />
              
              {/* Action buttons overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageModal(directLink, message.content);
                  }}
                  title="View full size"
                >
                  <Maximize2 size={12} />
                </Button>
                <Button
                  size="sm"
                  variant="secondary" 
                  className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage(directLink, message.content);
                  }}
                  title="Save image"
                >
                  <Save size={12} />
                </Button>
                {!isBase64 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(message.mediaUrl, '_blank');
                    }}
                    title="Open in Google Drive"
                  >
                    <ExternalLink size={12} />
                  </Button>
                )}
              </div>
              
              {/* Mobile-friendly tap indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 sm:hidden transition-opacity bg-black/20">
                <div className="bg-white/90 rounded-full p-2">
                  <Maximize2 size={16} className="text-gray-800" />
                </div>
              </div>
              
              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate font-medium">{message.content}</p>
              </div>
            </div>
            
            {!isBase64 && (
              <div className="hidden items-center gap-2 p-4 bg-muted rounded-lg">
                <Paperclip size={16} />
                <span className="flex-1 truncate">{message.content}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(message.mediaUrl, '_blank')}
                >
                  <ExternalLink size={16} />
                </Button>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Paperclip size={16} />
            <span className="flex-1 truncate">🎥 {message.content}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            >
              <ExternalLink size={16} />
            </Button>
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Paperclip size={16} />
            <span className="flex-1 truncate">🎵 {message.content}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            >
              <ExternalLink size={16} />
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <Paperclip size={16} />
            <span className="flex-1 truncate">{message.content}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(message.mediaUrl, '_blank')}
            >
              <ExternalLink size={16} />
            </Button>
          </div>
        );
    }
  };

  const getReadStatus = (message) => {
    const otherParticipants = chat.participants?.filter(id => id !== userId) || [];
    const readCount = message.readBy?.filter(id => otherParticipants.includes(id)).length || 0;
    return readCount;
  };

  const chatHistory = React.useMemo(() => {
    return chat.messages
      .map((msg) => {
        const sender = users.find((u) => (u.uid || u.id) === msg.senderId);
        return `${sender?.name || "Unknown"}: ${msg.content}`;
      })
      .join("\n");
  }, [chat.messages, users]);

  return (
    <ChatContextMenu 
      chat={chat} 
      onCloseChat={onCloseChat}
    >
      <div className="flex flex-col h-full w-full bg-card overflow-hidden">
        <ChatHeader chat={chat} getChatDetails={getChatDetails} users={users} />
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {chat.messages
            .filter(message => {
              // Filter out messages deleted for current user
              if (message.deletedFor && message.deletedFor.includes(userId)) {
                return false;
              }
              return true;
            })
            .map((message, index) => {
            const sender = users.find((user) => (user.uid || user.id) === message.senderId);
            const isYou = message.senderId === userId;
            const showAvatar = !isYou && (index === 0 || chat.messages[index - 1].senderId !== message.senderId);
            const isUnread = !isYou && (!message.readBy || !message.readBy.includes(userId));

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
                <MessageContextMenu
                  message={message}
                  isYou={isYou}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                >
                  <div className="relative">
                    {isUnread && !isYou && (
                      <div className="absolute -left-2 top-2 h-2 w-2 bg-accent rounded-full animate-pulse"></div>
                    )}
                    <div
                      className={cn(
                        "max-w-xs md:max-w-md lg:max-w-2xl rounded-lg px-3 py-2 text-sm relative group transition-all duration-200",
                        isYou
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-secondary-foreground",
                        message.isDeleted && "opacity-90 italic",
                        isUnread && !isYou && "ring-2 ring-accent/30 bg-accent/5 shadow-lg"
                      )}
                    >
                      {!isYou && showAvatar && <p className="font-bold mb-1 text-foreground/95">{sender?.name}</p>}
                      {message.isDeleted ? (
                        <p className="text-foreground/80">
                          {message.deletedForEveryone ? "This message was deleted" : "You deleted this message"}
                        </p>
                      ) : (
                        <>
                          {message.mediaUrl ? renderMedia(message) : (
                            <>
                              <p>{message.content}</p>
                              {message.editedAt && (
                                <p className="text-xs text-foreground/90 mt-1">
                                  (edited)
                                </p>
                              )}
                            </>
                          )}
                        </>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-foreground/90">
                          <FormattedTime timestamp={message.timestamp} />
                        </p>
                        {isYou && !message.isDeleted && (
                          <div className="flex items-center gap-0.5">
                            {getReadStatus(message) > 0 ? (
                              <span className="relative inline-flex items-center">
                                <Check size={12} className="text-blue-500" />
                                <Check size={12} className="text-blue-500 -ml-2" />
                              </span>
                            ) : (
                              <Check size={12} className="text-foreground/70" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </MessageContextMenu>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <div className="pt-4 px-4 pb-2 border-t border-border bg-background">
        <SmartReplySuggestions
          chatHistory={chatHistory}
          onSuggestionClick={handleSuggestionClick}
        />
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onOpenMediaUploader}
            className="shrink-0"
            title="Media uploader"
          >
            <Upload size={16} />
          </Button>
          <div className="flex-1">
            <ChatInput
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onSendMessage={handleSendMessage}
              onAttachmentClick={() => fileInputRef.current?.click()}
            />
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.open}
        onClose={closeImageModal}
        imageUrl={imageModal.url}
        fileName={imageModal.fileName}
        onDownload={downloadImage}
      />
      
      {/* Edit Message Dialog */}
      <EditMessageDialog
        isOpen={editDialog.open}
        onClose={() => setEditDialog({ open: false, message: null })}
        message={editDialog.message}
        onSaveEdit={handleSaveEdit}
      />
    </div>
    </ChatContextMenu>
  );
}
