"use client";

import * as React from "react";
import { MessageSquare, Users, Circle, Wind, Bot, LogOut, Menu, Plus, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils.js";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.jsx";
import ChatView from "@/components/chat-view.jsx";
import MediaUploader from "@/components/media-uploader.jsx";
import CallInterface from "@/components/call-interface.jsx";
import CallNotification from "@/components/call-notification.jsx";
import { ThemeToggle } from "@/components/theme-toggle.jsx";
import { db } from "@/lib/firebase.js";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  arrayRemove,
  where,
} from "firebase/firestore";
import {
  uploadFileToGoogleDrive,
  initializeGoogleDrive,
} from "@/lib/googleDrive.js";
import {
  fileToBase64,
  validateFile,
  generateUniqueFileName,
} from "@/lib/fileUtils.js";
import { useToast } from "@/hooks/use-toast.js";
import { useAuth } from "@/context/auth-context.jsx";
import { useCall } from "@/context/call-context.jsx";
import { useRouter } from "next/navigation.js";
import { Button } from "@/components/ui/button.jsx";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet.jsx";
import { Input } from "@/components/ui/input.jsx";

const FormattedTime = ({ timestamp }) => {
  const [formattedTime, setFormattedTime] = React.useState("");

  React.useEffect(() => {
    if (timestamp?.toDate) {
      setFormattedTime(
        timestamp
          .toDate()
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
  }, [timestamp]);

  if (!formattedTime) {
    return null;
  }

  return <>{formattedTime}</>;
};

// Dynamic user list from Firestore

export default function BreezeChatPage() {
  const __DEV__ = process.env.NODE_ENV !== 'production';
  const { user, loading, signOut, getAllUsers } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const callState = useCall();
  const [chats, setChats] = React.useState([]);
  const [activeChatId, setActiveChatId] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [selectedProfile, setSelectedProfile] = React.useState(null);
  const [showMediaUploader, setShowMediaUploader] = React.useState(false);
  const [uploadChatId, setUploadChatId] = React.useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [mobileSearch, setMobileSearch] = React.useState("");
  const mobileSearchRef = React.useRef(null);

  React.useEffect(() => {
    if (mobileSidebarOpen) {
      // slight delay to ensure element is mounted
      setTimeout(() => mobileSearchRef.current?.focus(), 100);
    } else {
      setMobileSearch("");
    }
  }, [mobileSidebarOpen]);
  const YOU_USER_ID = user?.uid;

  // Fetch chats and their messages from Firestore
  React.useEffect(() => {
    if (!user) return;

    let unsubscribeMessages = {};

  // Listen only to chats the user participates in (matches typical security rules)
  const q = query(collection(db, "chats"), where('participants', 'array-contains', user.uid));
  const unsubscribeChats = onSnapshot(q, (querySnapshot) => {
      const chatsData = [];
      
      querySnapshot.forEach((docSnap) => {
        const chatData = { id: docSnap.id, ...docSnap.data(), messages: [] };
        chatsData.push(chatData);

        // Clean up old message listener if it exists
        if (unsubscribeMessages[docSnap.id]) {
          unsubscribeMessages[docSnap.id]();
        }

        // Listen for messages in each chat
        const messagesQuery = query(
          collection(db, `chats/${docSnap.id}/messages`),
          orderBy("timestamp", "asc")
        );
        
        unsubscribeMessages[docSnap.id] = onSnapshot(messagesQuery, (messagesSnapshot) => {
          const messages = messagesSnapshot.docs.map((msgDoc) => ({
            id: msgDoc.id,
            ...msgDoc.data(),
          }));
          
          setChats((prevChats) => {
            const existingChatIndex = prevChats.findIndex((c) => c.id === docSnap.id);
            if (existingChatIndex > -1) {
              const updatedChats = [...prevChats];
              updatedChats[existingChatIndex] = {
                ...updatedChats[existingChatIndex],
                messages,
                lastMessage: messages[messages.length - 1] || null
              };
              return updatedChats;
            } else {
              // Add new chat with messages
              return [...prevChats, { 
                ...chatData, 
                messages,
                lastMessage: messages[messages.length - 1] || null
              }];
            }
          });
        });
      });
      
      // Initialize chats if this is the first load
      setChats((prevChats) => {
        if (prevChats.length === 0) {
          return chatsData;
        }
        return prevChats;
      });
    }, (err) => {
      console.error('🔥 Chats snapshot error:', err);
      if (err.code === 'permission-denied') {
    if (__DEV__) console.warn('Permission denied: ensure Firestore rules allow reading chats where user is a participant.');
      }
    });

    return () => {
      unsubscribeChats();
      Object.values(unsubscribeMessages).forEach(unsub => unsub());
    };
  }, [user]);
  // Get chat details for rendering
  const getChatDetails = (chat) => {
    if (chat.type === "dm") {
      const otherUserId = chat.participants?.find((id) => id !== YOU_USER_ID);
      const otherUser = users.find((user) => user.uid === otherUserId) || {
        uid: otherUserId,
        name: "Unknown User",
        avatar: "https://placehold.co/100x100.png",
      };
      return {
        name: otherUser.name,
        avatar: otherUser.avatar,
        icon: <Users size={18} />,
        user: otherUser,
      };
    } else {
      return {
        name: chat.name,
        avatar: chat.avatar,
        icon: <Users size={18} />,
        user: null,
      };
    }
  };

  // Get latest message for a user
  const getLatestMessageWithUser = (userProfile) => {
    const dmChat = chats.find(
      (chat) =>
        chat.type === "dm" &&
        chat.participants?.includes(YOU_USER_ID) &&
        chat.participants?.includes(userProfile.uid)
    );
    
    if (!dmChat || !dmChat.lastMessage) {
      return "No messages yet";
    }
    
    const lastMessage = dmChat.lastMessage;
    const isYou = lastMessage.senderId === YOU_USER_ID;
    const prefix = isYou ? "You: " : "";
    
    if (lastMessage.isDeleted) {
      return lastMessage.deletedForEveryone ? "Message was deleted" : "You deleted this message";
    }
    
    if (lastMessage.mediaUrl) {
      const mediaType = lastMessage.mediaType || "file";
      return `${prefix}📎 ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;
    }
    
    const content = lastMessage.content || "";
    return `${prefix}${content.length > 30 ? content.substring(0, 30) + "..." : content}`;
  };

  // Get unread message count for a user
  const getUnreadCountForUser = (userProfile) => {
    const dmChat = chats.find(
      (chat) =>
        chat.type === "dm" &&
        chat.participants?.includes(YOU_USER_ID) &&
        chat.participants?.includes(userProfile.uid)
    );
    
    if (!dmChat || !dmChat.messages) {
      return 0;
    }
    
    // Count messages that are not read by current user and not sent by current user
    const unreadCount = dmChat.messages.filter(message => 
      message.senderId !== YOU_USER_ID &&
      (!message.readBy || !message.readBy.includes(YOU_USER_ID))
    ).length;
    
    return unreadCount;
  };

  // Check if user has unread messages
  const hasUnreadMessages = (userProfile) => {
    return getUnreadCountForUser(userProfile) > 0;
  };
  // Send a message to the active chat
  const handleSendMessage = async (
    chatId,
    content,
    mediaUrl = null,
    mediaType = null
  ) => {
    if (!chatId || !YOU_USER_ID) return;
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      senderId: YOU_USER_ID,
      content,
      mediaUrl,
      mediaType,
      timestamp: serverTimestamp(),
      readBy: [YOU_USER_ID], // Sender has read the message by default
    });
  };

  // Mark messages as read
  const markMessagesAsRead = async (chatId) => {
    if (!chatId || !YOU_USER_ID) return;
    const messagesQuery = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy("timestamp", "asc")
    );
    const messagesSnapshot = await getDocs(messagesQuery);

    messagesSnapshot.docs.forEach(async (messageDoc) => {
      const messageData = messageDoc.data();
      if (!messageData.readBy?.includes(YOU_USER_ID)) {
        await updateDoc(doc(db, `chats/${chatId}/messages`, messageDoc.id), {
          readBy: [...(messageData.readBy || []), YOU_USER_ID],
        });
      }
    });
  };

  // Edit message function
  const handleEditMessage = async (messageId, newContent) => {
    if (!activeChat?.id || !YOU_USER_ID) return;
    
    try {
      await updateDoc(doc(db, `chats/${activeChat.id}/messages`, messageId), {
        content: newContent,
        editedAt: serverTimestamp(),
        isEdited: true,
      });
      
      toast({
        title: "Message Updated",
        description: "Your message has been edited successfully.",
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Edit Failed",
        description: "Could not edit the message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete message function
  const handleDeleteMessage = async (messageId, deleteForEveryone = false) => {
    if (!activeChat?.id || !YOU_USER_ID) return;
    
    try {
      if (deleteForEveryone) {
        // Delete for everyone - mark as deleted but keep the document
        await updateDoc(doc(db, `chats/${activeChat.id}/messages`, messageId), {
          isDeleted: true,
          deletedForEveryone: true,
          deletedAt: serverTimestamp(),
          deletedBy: YOU_USER_ID,
        });
      } else {
        // Delete for me only - add user to deletedFor array
        const messageDoc = doc(db, `chats/${activeChat.id}/messages`, messageId);
        await updateDoc(messageDoc, {
          deletedFor: arrayRemove(YOU_USER_ID) // Remove first in case it exists
        });
        await updateDoc(messageDoc, {
          deletedFor: [...(await getDocs(query(collection(db, `chats/${activeChat.id}/messages`)))).docs
            .find(doc => doc.id === messageId)?.data()?.deletedFor || [], YOU_USER_ID]
        });
      }
      
      toast({
        title: "Message Deleted",
        description: deleteForEveryone 
          ? "Message deleted for everyone." 
          : "Message deleted for you.",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle file upload to Google Drive with fallback
  const handleFileUpload = async (file, chatId = null) => {
    const targetChatId = chatId || uploadChatId;
    if (!file || !targetChatId) return;

    // Show upload starting notification
    const uploadToast = toast({
      title: "Uploading...",
      description: `Uploading ${file.name}`,
    });

    try {
      // Validate file first
      validateFile(file, 50 * 1024 * 1024); // 50MB max

      let fileUrl = null;
      let mediaType = "file";

      // Determine media type
      if (file.type.startsWith("image/")) {
        mediaType = "image";
      } else if (file.type.startsWith("video/")) {
        mediaType = "video";
      } else if (file.type.startsWith("audio/")) {
        mediaType = "audio";
      }

      // For small images, try fallback first (faster and more reliable)
      if (mediaType === "image" && file.size <= 2 * 1024 * 1024) {
        // 2MB for images
        try {
          if (__DEV__) console.log("Using base64 fallback for small image");
          fileUrl = await fileToBase64(file);
        } catch (fallbackError) {
          if (__DEV__) console.warn(
            "Base64 fallback failed, trying Google Drive:",
            fallbackError.message
          );
        }
      }

      // If fallback didn't work or file is large, try Google Drive
      if (!fileUrl) {
        try {
          if (__DEV__) console.log("Attempting Google Drive upload...");
          uploadToast.update({
            title: "Uploading to Google Drive...",
            description: `Processing ${file.name}`,
          });

          await initializeGoogleDrive();
          const fileName = generateUniqueFileName(file.name);
          fileUrl = await uploadFileToGoogleDrive(file, fileName);
          if (__DEV__) console.log("Google Drive upload successful");
        } catch (driveError) {
          if (__DEV__) console.warn("Google Drive upload failed:", driveError.message);

          // Try fallback for images only if not already tried
          if (
            mediaType === "image" &&
            file.size <= 5 * 1024 * 1024 &&
            !fileUrl
          ) {
            try {
              if (__DEV__) console.log("Falling back to base64 after Google Drive failure");
              uploadToast.update({
                title: "Using fallback method...",
                description: `Processing ${file.name}`,
              });

              fileUrl = await fileToBase64(file);
            } catch (fallbackError) {
              throw new Error(
                `Both Google Drive and fallback failed. Google Drive: ${driveError.message}. Fallback: ${fallbackError.message}`
              );
            }
          } else {
            throw new Error(
              `Google Drive upload failed: ${driveError.message}${
                mediaType !== "image"
                  ? " (Non-image files require Google Drive)"
                  : file.size > 5 * 1024 * 1024
                  ? " (File too large for fallback)"
                  : ""
              }`
            );
          }
        }
      }

      // Send message with media
      await handleSendMessage(targetChatId, file.name, fileUrl, mediaType);

      // Update to success notification
      uploadToast.update({
        title: "Upload Successful",
        description: `${file.name} has been uploaded and shared.`,
      });

      return {
        success: true,
        url: fileUrl,
        mediaType,
        fileName: file.name,
      };
    } catch (error) {
      console.error("Error uploading file:", error);

      // Update to error notification
      uploadToast.update({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });

      throw new Error(`Upload failed: ${error.message}`);
    }
  };

  // Handle opening media uploader
  const openMediaUploader = (chatId) => {
    setUploadChatId(chatId);
    setShowMediaUploader(true);
  };

  // Handle closing media uploader
  const closeMediaUploader = () => {
    setShowMediaUploader(false);
    setUploadChatId(null);
  };

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (!user) return;
    // Fetch all users from Firestore
    const fetchUsers = async () => {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    };
    fetchUsers();
    // ...existing chat fetching logic...
  }, [user]);

  // Find the active chat from chats array
  const activeChat = React.useMemo(
    () => chats.find((chat) => chat.id === activeChatId),
    [chats, activeChatId]
  );

  // Replace static users with dynamic list, find current user from it
  const currentUser = users.find((u) => u.uid === YOU_USER_ID) || {
    uid: user?.uid,
    name: user?.displayName || user?.email || "You",
    avatar: user?.photoURL || "https://placehold.co/100x100.png",
  };

  // Profile interaction UI
  const handleViewProfile = (profile) => setSelectedProfile(profile);
  const handleStartChat = async (profile) => {
    // Find if a DM chat already exists between current user and selected user
    let dmChat = chats.find(
      (chat) =>
        chat.type === "dm" &&
        chat.participants?.includes(YOU_USER_ID) &&
        chat.participants?.includes(profile.uid)
    );
    
    if (!dmChat) {
      try {
        // Create a new DM chat in Firestore
        const chatDoc = await addDoc(collection(db, "chats"), {
          type: "dm",
          participants: [YOU_USER_ID, profile.uid],
          createdAt: serverTimestamp(),
        });
        
        dmChat = {
          id: chatDoc.id,
          type: "dm",
          participants: [YOU_USER_ID, profile.uid],
          messages: [],
          lastMessage: null,
          createdAt: new Date()
        };
        
        // Add the chat to state immediately for better UX
        setChats((prev) => [...prev, dmChat]);
      } catch (error) {
        console.error("Error creating chat:", error);
        toast({
          title: "Error",
          description: "Failed to start chat. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    
    setActiveChatId(dmChat.id);
    setSelectedProfile(null);
  };

  // Close chat function
  const handleCloseChat = (chatId) => {
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    // You can also add logic to remove the chat from recent chats or mark it as closed
    toast({
      title: "Chat Closed",
      description: "The chat has been closed. You can reopen it by selecting the contact again.",
    });
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {activeChatId ? (
            <Button variant="ghost" size="icon" onClick={() => setActiveChatId(null)} aria-label="Back to contacts">
              <ArrowLeft size={20} />
            </Button>
          ) : (
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Wind size={20} />
            </div>
          )}
          <h1 className="text-lg font-bold font-headline">BreezeChat</h1>
        </div>
        {!activeChatId && (
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)} aria-label="Open contacts">
            <Menu size={20} />
          </Button>
        )}
      </div>
  {/* Custom Sidebar (desktop) */}
  <div className="hidden md:flex w-80 h-full border-r border-border/20 bg-sidebar flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/10">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Wind size={24} />
              </div>
              <h1 className="text-xl font-bold font-headline">BreezeChat</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Contacts
            </h2>
          </div>
          <div className="px-2">
            {/* List only other users (exclude current user) - sorted by unread first, then by most recent message */}
            {users
              .filter((profile) => profile.uid !== YOU_USER_ID)
              .sort((a, b) => {
                const aHasUnread = hasUnreadMessages(a);
                const bHasUnread = hasUnreadMessages(b);
                
                // First sort by unread status
                if (aHasUnread && !bHasUnread) return -1;
                if (!aHasUnread && bHasUnread) return 1;
                
                // Then sort by most recent message
                const aChatLastMessage = chats.find(chat => 
                  chat.type === "dm" && 
                  chat.participants?.includes(YOU_USER_ID) && 
                  chat.participants?.includes(a.uid)
                )?.lastMessage;
                
                const bChatLastMessage = chats.find(chat => 
                  chat.type === "dm" && 
                  chat.participants?.includes(YOU_USER_ID) && 
                  chat.participants?.includes(b.uid)
                )?.lastMessage;
                
                const aTime = aChatLastMessage?.timestamp?.toDate?.() || 0;
                const bTime = bChatLastMessage?.timestamp?.toDate?.() || 0;
                
                return new Date(bTime) - new Date(aTime);
              })
              .map((profile) => {
                const unreadCount = getUnreadCountForUser(profile);
                const hasUnread = hasUnreadMessages(profile);
                
                return (
                <div
                  key={profile.uid}
                  className={cn(
                    "flex items-center gap-3 p-3 hover:bg-muted/10 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 mb-1",
                    hasUnread && "bg-accent/5 border border-accent/20"
                  )}
                  onClick={() => handleStartChat(profile)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {hasUnread && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={cn(
                      "font-semibold truncate",
                      hasUnread ? "text-foreground" : "text-foreground/90"
                    )}>
                      {profile.name}
                    </p>
                    <p className={cn(
                      "text-sm truncate",
                      hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {getLatestMessageWithUser(profile)}
                    </p>
                  </div>
                  {hasUnread && (
                    <div className="h-2 w-2 bg-accent rounded-full flex-shrink-0"></div>
                  )}
                </div>
                );
              })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/10">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={currentUser.avatar}
                alt={currentUser.name}
                data-ai-hint="person portrait"
              />
              <AvatarFallback>{currentUser.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate text-sm">
                {currentUser.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Welcome back!
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={signOut}
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>

  {/* Main Content Area (desktop) */}
  <div className="hidden md:block flex-1 h-full overflow-hidden">
        {/* Profile view modal/panel */}
        {selectedProfile ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage
                src={selectedProfile.avatar}
                alt={selectedProfile.name}
              />
              <AvatarFallback>{selectedProfile.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold mb-2">{selectedProfile.name}</h2>
            <p className="text-muted-foreground mb-4">
              {getLatestMessageWithUser(selectedProfile)}
            </p>
            {selectedProfile.uid !== YOU_USER_ID && (
              <Button onClick={() => handleStartChat(selectedProfile)}>
                Start Chat
              </Button>
            )}
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setSelectedProfile(null)}
            >
              Close
            </Button>
          </div>
        ) : activeChat ? (
          <div className="flex flex-col h-full w-full">
            <ChatView
              chat={activeChat}
              userId={YOU_USER_ID}
              onSendMessage={handleSendMessage}
              getChatDetails={getChatDetails}
              users={users}
              onFileUpload={handleFileUpload}
              onOpenMediaUploader={() => openMediaUploader(activeChat.id)}
              onMarkAsRead={markMessagesAsRead}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onCloseChat={handleCloseChat}
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted/20">
            <Bot size={64} className="text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground">
              Welcome to BreezeChat
            </h2>
            <p className="text-muted-foreground mb-8">
              Select a conversation or user to start messaging.
            </p>
            
            {/* Select a user to start chatting or place a call */}
          </div>
        )}
      </div>

      {/* Mobile Content Area: Contacts first, Chat after selection */}
      <div className="md:hidden flex-1 h-full overflow-hidden">
        {!activeChatId ? (
          <div className="flex flex-col h-full">
            {/* Mobile contacts with search */}
            <div className="p-3 border-b">
              <Input
                ref={mobileSearchRef}
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                placeholder="Search contacts"
                className="h-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {users
                .filter((profile) => profile.uid !== YOU_USER_ID)
                .filter((profile) => {
                  if (!mobileSearch) return true;
                  const q = mobileSearch.toLowerCase();
                  return (
                    (profile.name || "").toLowerCase().includes(q) ||
                    (profile.email || "").toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => {
                  const aHasUnread = hasUnreadMessages(a);
                  const bHasUnread = hasUnreadMessages(b);
                  if (aHasUnread && !bHasUnread) return -1;
                  if (!aHasUnread && bHasUnread) return 1;
                  const aChatLastMessage = chats.find(chat => 
                    chat.type === "dm" && 
                    chat.participants?.includes(YOU_USER_ID) && 
                    chat.participants?.includes(a.uid)
                  )?.lastMessage;
                  const bChatLastMessage = chats.find(chat => 
                    chat.type === "dm" && 
                    chat.participants?.includes(YOU_USER_ID) && 
                    chat.participants?.includes(b.uid)
                  )?.lastMessage;
                  const aTime = aChatLastMessage?.timestamp?.toDate?.() || 0;
                  const bTime = bChatLastMessage?.timestamp?.toDate?.() || 0;
                  return new Date(bTime) - new Date(aTime);
                })
                .map((profile) => {
                  const unreadCount = getUnreadCountForUser(profile);
                  const hasUnread = hasUnreadMessages(profile);
                  return (
                    <div
                      key={profile.uid}
                      className={cn(
                        "flex items-center gap-3 p-3 hover:bg-muted/10 rounded-lg cursor-pointer transition-all duration-200 mb-1",
                        hasUnread && "bg-accent/5 border border-accent/20"
                      )}
                      onClick={async () => {
                        await handleStartChat(profile);
                      }}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.avatar} alt={profile.name} />
                          <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={cn(
                          "font-semibold truncate",
                          hasUnread ? "text-foreground" : "text-foreground/90"
                        )}>
                          {profile.name}
                        </p>
                        <p className={cn(
                          "text-sm truncate",
                          hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {getLatestMessageWithUser(profile)}
                        </p>
                      </div>
                      {hasUnread && <div className="h-2 w-2 bg-accent rounded-full flex-shrink-0"></div>}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <ChatView
              chat={activeChat}
              userId={YOU_USER_ID}
              onSendMessage={handleSendMessage}
              getChatDetails={getChatDetails}
              users={users}
              onFileUpload={handleFileUpload}
              onOpenMediaUploader={() => openMediaUploader(activeChat.id)}
              onMarkAsRead={markMessagesAsRead}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onCloseChat={() => setActiveChatId(null)}
            />
          </div>
        )}
      </div>

      {/* Media Uploader Dialog */}
      <MediaUploader
        isOpen={showMediaUploader}
        onClose={closeMediaUploader}
        onUpload={handleFileUpload}
        maxFiles={10}
        allowMultiple={true}
      />

  {/* Call Interface */}
      <CallInterface
        isOpen={callState.isInCall}
        callType={callState.callType}
        callStatus={callState.callStatus}
        contact={callState.contact || callState.caller}
        onEndCall={callState.endCall}
        onToggleMute={callState.toggleMute}
        onToggleVideo={callState.toggleVideo}
        onToggleSpeaker={callState.toggleSpeaker}
        onMinimize={callState.toggleMinimize}
        duration={callState.duration}
        isMuted={callState.isMuted}
        isVideoOff={callState.isVideoOff}
        isSpeakerOn={callState.isSpeakerOn}
        isMinimized={callState.isMinimized}
        localVideoRef={callState.localVideoRef}
        remoteVideoRef={callState.remoteVideoRef}
        isWebRTCSupported={callState.isWebRTCSupported}
        ringRemaining={callState.ringRemaining}
        isOutgoing={callState.isOutgoing}
      />

  {/* Hidden audio element for voice calls to ensure remote audio plays */}
  <audio ref={callState.remoteAudioRef} autoPlay playsInline hidden />

      {/* Call Notification for incoming calls */}
  {/* Dev-only trace for CallNotification props removed for production */}
  <CallNotification
        isVisible={callState.hasIncomingCall}
        callType={callState.callType}
        caller={callState.caller}
        ringRemaining={callState.ringRemaining}
        onAccept={() => {
          if (callState.acceptCall) callState.acceptCall();
        }}
        onDecline={() => {
          if (callState.declineCall) callState.declineCall();
        }}
      />

      {/* Mobile FAB: New Chat */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Button
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="New chat"
        >
          <Plus size={24} />
        </Button>
      </div>

      {/* Mini call pill when minimized (mobile) */}
      {callState.isInCall && callState.isMinimized && (
        <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <Button
            className="rounded-full px-4 py-2 shadow-md bg-primary text-primary-foreground flex items-center gap-2"
            onClick={callState.toggleMinimize}
          >
            <MessageSquare size={16} />
            <span className="text-sm">Back to call</span>
          </Button>
        </div>
      )}

      {/* Mobile Contacts Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[85%] sm:max-w-sm">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Wind size={20} />
              </div>
              <h2 className="text-lg font-semibold">Contacts</h2>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b">
                <Input
                  ref={mobileSearchRef}
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  placeholder="Search contacts"
                  className="h-9"
                />
              </div>
              <div className="px-2 py-2">
                {users
                  .filter((profile) => profile.uid !== YOU_USER_ID)
                  .filter((profile) => {
                    if (!mobileSearch) return true;
                    const q = mobileSearch.toLowerCase();
                    return (
                      (profile.name || "").toLowerCase().includes(q) ||
                      (profile.email || "").toLowerCase().includes(q)
                    );
                  })
                  .sort((a, b) => {
                    const aHasUnread = hasUnreadMessages(a);
                    const bHasUnread = hasUnreadMessages(b);
                    if (aHasUnread && !bHasUnread) return -1;
                    if (!aHasUnread && bHasUnread) return 1;
                    const aChatLastMessage = chats.find(chat => 
                      chat.type === "dm" && 
                      chat.participants?.includes(YOU_USER_ID) && 
                      chat.participants?.includes(a.uid)
                    )?.lastMessage;
                    const bChatLastMessage = chats.find(chat => 
                      chat.type === "dm" && 
                      chat.participants?.includes(YOU_USER_ID) && 
                      chat.participants?.includes(b.uid)
                    )?.lastMessage;
                    const aTime = aChatLastMessage?.timestamp?.toDate?.() || 0;
                    const bTime = bChatLastMessage?.timestamp?.toDate?.() || 0;
                    return new Date(bTime) - new Date(aTime);
                  })
                  .map((profile) => {
                    const unreadCount = getUnreadCountForUser(profile);
                    const hasUnread = hasUnreadMessages(profile);
                    return (
                      <div
                        key={profile.uid}
                        className={cn(
                          "flex items-center gap-3 p-3 hover:bg-muted/10 rounded-lg cursor-pointer transition-all duration-200 mb-1",
                          hasUnread && "bg-accent/5 border border-accent/20"
                        )}
                        onClick={async () => {
                          await handleStartChat(profile);
                          setMobileSidebarOpen(false);
                        }}
                      >
                        <div className="relative">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={profile.avatar} alt={profile.name} />
                            <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {hasUnread && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={cn(
                            "font-semibold truncate",
                            hasUnread ? "text-foreground" : "text-foreground/90"
                          )}>
                            {profile.name}
                          </p>
                          <p className={cn(
                            "text-sm truncate",
                            hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {getLatestMessageWithUser(profile)}
                          </p>
                        </div>
                        {hasUnread && <div className="h-2 w-2 bg-accent rounded-full flex-shrink-0"></div>}
                      </div>
                    );
                  })}
              </div>
            </div>
            {/* Footer */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold truncate text-sm">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">Welcome back!</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={signOut}>
                  <LogOut size={18} />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
