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

// This should be replaced with a dynamic user list from your database
const users = [
  { id: '1', name: 'You', avatar: 'https://placehold.co/100x100.png', status: 'active' },
  { id: '2', name: 'Alice', avatar: 'https://placehold.co/100x100.png', status: 'active' },
  { id: '3', name: 'Bob', avatar: 'https://placehold.co/100x100.png', status: 'away' },
  { id: '4', name: 'Charlie', avatar: 'https://placehold.co/100x100.png', status: 'active' },
  { id: '5', name: 'David', avatar: 'https://placehold.co/100x100.png', status: 'away' },
];

export default function BreezeChatPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [chats, setChats] = React.useState([]);
  const [activeChatId, setActiveChatId] = React.useState(null);
  
  const YOU_USER_ID = user?.uid;

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (!user) return; // Don't fetch if no user

    const q = query(collection(db, "chats")); // In a real app, you'd filter chats for the current user
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatsData = [];
      querySnapshot.forEach((doc) => {
        const chatData = { id: doc.id, ...doc.data(), messages: [] };
        const messagesQuery = query(collection(db, `chats/${doc.id}/messages`), orderBy("timestamp", "asc"));
        
        onSnapshot(messagesQuery, (messagesSnapshot) => {
          const messages = messagesSnapshot.docs.map(msgDoc => ({id: msgDoc.id, ...msgDoc.data()}));
          setChats(prevChats => {
            const existingChatIndex = prevChats.findIndex(c => c.id === doc.id);
            // This logic needs to be improved for real-time updates to avoid re-renders
            if (existingChatIndex > -1) {
              const updatedChats = [...prevChats];
              updatedChats[existingChatIndex] = {...updatedChats[existingChatIndex], messages };
              return updatedChats;
            }
            return prevChats;
          });
        });
        chatsData.push(chatData);
      });
      
      setChats(chatsData);
      if (!activeChatId && chatsData.length > 0) {
        setActiveChatId(chatsData[0].id);
      }
    });
    return () => unsubscribe();
  }, [user, activeChatId]);


  const activeChat = React.useMemo(
    () => chats.find((chat) => chat.id === activeChatId),
    [chats, activeChatId]
  );
  
  const getChatDetails = (chat) => {
    // This function needs to be adapted based on your chat data structure
    if (chat.type === "dm") {
      const otherUserId = chat.participants.find((id) => id !== YOU_USER_ID);
      const otherUser = users.find((user) => user.id === otherUserId) || {
        id: otherUserId, name: 'Unknown User', avatar: `https://placehold.co/100x100.png`
      };
      
      return {
        name: otherUser?.name,
        avatar: otherUser?.avatar,
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

  const handleSendMessage = async (chatId, content) => {
    if (!chatId || !YOU_USER_ID) return;
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      senderId: YOU_USER_ID,
      content,
      timestamp: serverTimestamp(),
    });
  };

  if (loading || !user) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
          <Bot size={64} className="text-muted-foreground/50 mb-4 animate-pulse" />
       </div>
    )
  }

  // Replace static users with dynamic list, find current user from it
  const currentUser = users.find(u => u.id === YOU_USER_ID) || { id: user.uid, name: user.displayName || user.email || 'You', avatar: user.photoURL || 'https://placehold.co/100x100.png' };


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
              {chats.map((chat) => {
                const { name, avatar, user } = getChatDetails(chat);
                const lastMessage = chat.messages[chat.messages.length - 1];
                const isActive = activeChatId === chat.id;

                return (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveChatId(chat.id)}
                      isActive={isActive}
                      className="h-auto py-3 px-2 flex-col items-start"
                    >
                      <div className="flex items-center w-full gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatar} alt={name} data-ai-hint="person portrait" />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {user && (
                            <Circle
                              className={cn(
                                "absolute bottom-0 right-0 h-3 w-3 fill-current",
                                user.status === "active"
                                  ? "text-green-500"
                                  : "text-gray-400"
                              )}
                              strokeWidth={1}
                            />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {lastMessage && <FormattedTime timestamp={lastMessage.timestamp} />}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage?.content}
                          </p>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
          {activeChat ? (
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
                Select a conversation to start messaging.
              </p>
            </div>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
