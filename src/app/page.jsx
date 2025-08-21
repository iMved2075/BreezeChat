"use client";

import * as React from "react";
import {
  MessageSquare,
  Users,
  Circle,
  Wind,
  Bot,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils.js";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar.jsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import ChatView from "@/components/chat-view.jsx";
import { db } from "@/lib/firebase.js";
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/auth-context.jsx";
import { useRouter } from "next/navigation.js";
import { Button } from "@/components/ui/button.jsx";

const FormattedTime = ({ timestamp }) => {
  const [formattedTime, setFormattedTime] = React.useState("");

  React.useEffect(() => {
    if (timestamp?.toDate) {
      setFormattedTime(timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [timestamp]);

  if (!formattedTime) {
    return null;
  }

  return <>{formattedTime}</>;
};

// Dynamic user list from Firestore

export default function BreezeChatPage() {
  // Fetch chats and their messages from Firestore
  React.useEffect(() => {
    if (!user) return;
      const { user, loading, signOut, getAllUsers } = useAuth();
      const router = useRouter();
      const [chats, setChats] = React.useState([]);
      const [activeChatId, setActiveChatId] = React.useState(null);
      const [users, setUsers] = React.useState([]);
      const [selectedProfile, setSelectedProfile] = React.useState(null);
      const YOU_USER_ID = user?.uid;

    // Listen for chat documents
    const q = query(collection(db, "chats"));
    const unsubscribeChats = onSnapshot(q, (querySnapshot) => {
      const chatsData = [];
      querySnapshot.forEach((docSnap) => {
        const chatData = { id: docSnap.id, ...docSnap.data(), messages: [] };
        // Listen for messages in each chat
        const messagesQuery = query(collection(db, `chats/${docSnap.id}/messages`), orderBy("timestamp", "asc"));
        onSnapshot(messagesQuery, (messagesSnapshot) => {
          const messages = messagesSnapshot.docs.map(msgDoc => ({ id: msgDoc.id, ...msgDoc.data() }));
          setChats((prevChats) => {
            const existingChatIndex = prevChats.findIndex(c => c.id === docSnap.id);
            if (existingChatIndex > -1) {
              const updatedChats = [...prevChats];
              updatedChats[existingChatIndex] = { ...updatedChats[existingChatIndex], messages };
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
        uid: otherUserId, name: "Unknown User", avatar: "https://placehold.co/100x100.png"
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
  const handleSendMessage = async (chatId, content) => {
    if (!chatId || !YOU_USER_ID) return;
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      senderId: YOU_USER_ID,
      content,
      timestamp: serverTimestamp(),
    });
  };
  const { user, loading, signOut, getAllUsers } = useAuth();
  const router = useRouter();
  const [chats, setChats] = React.useState([]);
  const [activeChatId, setActiveChatId] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [selectedProfile, setSelectedProfile] = React.useState(null);
  const YOU_USER_ID = user?.uid;

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
  const currentUser = users.find(u => u.uid === YOU_USER_ID) || { uid: user?.uid, name: user?.displayName || user?.email || 'You', avatar: user?.photoURL || 'https://placehold.co/100x100.png' };

  // Profile interaction UI
  const handleViewProfile = (profile) => setSelectedProfile(profile);
  const handleStartChat = async (profile) => {
    // Find if a DM chat already exists between current user and selected user
    let dmChat = chats.find(
      (chat) => chat.type === "dm" && chat.participants?.includes(YOU_USER_ID) && chat.participants?.includes(profile.uid)
    );
    if (!dmChat) {
      // Create a new DM chat in Firestore
      const chatDoc = await addDoc(collection(db, "chats"), {
        type: "dm",
        participants: [YOU_USER_ID, profile.uid],
        createdAt: serverTimestamp(),
      });
      dmChat = { id: chatDoc.id, type: "dm", participants: [YOU_USER_ID, profile.uid], messages: [] };
      setChats((prev) => [...prev, dmChat]);
    }
    setActiveChatId(dmChat.id);
    setSelectedProfile(null);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar
          variant="sidebar"
          collapsible="icon"
          className="border-r border-border/20"
        >
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <Wind size={24} />
              </div>
              <h1 className="text-xl font-bold font-headline">BreezeChat</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {/* List all users */}
              {users.map((profile) => (
                <div key={profile.uid} className="flex items-center gap-3 p-2 hover:bg-muted/10 rounded cursor-pointer" onClick={() => handleViewProfile(profile)}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate text-sm">{profile.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                  </div>
                  {profile.uid !== YOU_USER_ID && (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleStartChat(profile); }}>Chat</Button>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="person portrait" />
                <AvatarFallback>{currentUser.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="font-semibold truncate text-sm">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">Welcome back!</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full group-data-[collapsible=icon]:hidden" onClick={signOut}>
                <LogOut size={18} />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          {/* Profile view modal/panel */}
          {selectedProfile ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={selectedProfile.avatar} alt={selectedProfile.name} />
                <AvatarFallback>{selectedProfile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold mb-2">{selectedProfile.name}</h2>
              <p className="text-muted-foreground mb-2">{selectedProfile.email}</p>
              {selectedProfile.uid !== YOU_USER_ID && (
                <Button onClick={() => handleStartChat(selectedProfile)}>Start Chat</Button>
              )}
              <Button variant="ghost" className="mt-4" onClick={() => setSelectedProfile(null)}>Close</Button>
            </div>
          ) : (
            activeChat ? (
              <ChatView
                chat={activeChat}
                userId={YOU_USER_ID}
                onSendMessage={handleSendMessage}
                getChatDetails={getChatDetails}
                users={users}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-muted/20">
                <Bot size={64} className="text-muted-foreground/50 mb-4" />
                <h2 className="text-2xl font-semibold text-muted-foreground">Welcome to BreezeChat</h2>
                <p className="text-muted-foreground">
                  Select a conversation or user to start messaging.
                </p>
              </div>
            )
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

