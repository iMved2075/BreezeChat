"use client";

import * as React from "react";
import { MessageSquare, Users, Circle, Wind, Bot, LogOut } from "lucide-react";
import { cn } from "@/lib/utils.js";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.jsx";
import ChatView from "@/components/chat-view.jsx";
import MediaUploader from "@/components/media-uploader.jsx";
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
import { useRouter } from "next/navigation.js";
import { Button } from "@/components/ui/button.jsx";

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
  const { user, loading, signOut, getAllUsers } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [chats, setChats] = React.useState([]);
  const [activeChatId, setActiveChatId] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [selectedProfile, setSelectedProfile] = React.useState(null);
  const [showMediaUploader, setShowMediaUploader] = React.useState(false);
  const [uploadChatId, setUploadChatId] = React.useState(null);
  const YOU_USER_ID = user?.uid;

  // Fetch chats and their messages from Firestore
  React.useEffect(() => {
    if (!user) return;
    // Listen for chat documents
    const q = query(collection(db, "chats"));
    const unsubscribeChats = onSnapshot(q, (querySnapshot) => {
      const chatsData = [];
      querySnapshot.forEach((docSnap) => {
        const chatData = { id: docSnap.id, ...docSnap.data(), messages: [] };
        // Listen for messages in each chat
        const messagesQuery = query(
          collection(db, `chats/${docSnap.id}/messages`),
          orderBy("timestamp", "asc")
        );
        onSnapshot(messagesQuery, (messagesSnapshot) => {
          const messages = messagesSnapshot.docs.map((msgDoc) => ({
            id: msgDoc.id,
            ...msgDoc.data(),
          }));
          setChats((prevChats) => {
            const existingChatIndex = prevChats.findIndex(
              (c) => c.id === docSnap.id
            );
            if (existingChatIndex > -1) {
              const updatedChats = [...prevChats];
              updatedChats[existingChatIndex] = {
                ...updatedChats[existingChatIndex],
                messages,
              };
              return updatedChats;
            }
            return prevChats;
          });
        });
        chatsData.push(chatData);
      });
      setChats(chatsData);
    });
    return () => unsubscribeChats();
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
          console.log("Using base64 fallback for small image");
          fileUrl = await fileToBase64(file);
        } catch (fallbackError) {
          console.warn(
            "Base64 fallback failed, trying Google Drive:",
            fallbackError.message
          );
        }
      }

      // If fallback didn't work or file is large, try Google Drive
      if (!fileUrl) {
        try {
          console.log("Attempting Google Drive upload...");
          uploadToast.update({
            title: "Uploading to Google Drive...",
            description: `Processing ${file.name}`,
          });

          await initializeGoogleDrive();
          const fileName = generateUniqueFileName(file.name);
          fileUrl = await uploadFileToGoogleDrive(file, fileName);
          console.log("Google Drive upload successful");
        } catch (driveError) {
          console.warn("Google Drive upload failed:", driveError.message);

          // Try fallback for images only if not already tried
          if (
            mediaType === "image" &&
            file.size <= 5 * 1024 * 1024 &&
            !fileUrl
          ) {
            try {
              console.log("Falling back to base64 after Google Drive failure");
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
      };
      setChats((prev) => [...prev, dmChat]);
    }
    setActiveChatId(dmChat.id);
    setSelectedProfile(null);
  };

  return (
    <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Custom Sidebar */}
      <div className="w-80 h-full border-r border-border/20 bg-sidebar flex flex-col">
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
            {/* List only other users (exclude current user) */}
            {users
              .filter((profile) => profile.uid !== YOU_USER_ID)
              .map((profile) => (
                <div
                  key={profile.uid}
                  className="flex items-center gap-3 p-3 hover:bg-muted/10 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 mb-1"
                  onClick={() => handleStartChat(profile)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{profile.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>
              ))}
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

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden">
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
            <p className="text-muted-foreground mb-2">
              {selectedProfile.email}
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
            />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted/20">
            <Bot size={64} className="text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground">
              Welcome to BreezeChat
            </h2>
            <p className="text-muted-foreground">
              Select a conversation or user to start messaging.
            </p>
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
    </div>
  );
}
