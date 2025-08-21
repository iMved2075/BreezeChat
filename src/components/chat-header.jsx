import { Phone, Video, Users, User, Circle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { cn } from "@/lib/utils.js";

export default function ChatHeader({ chat, getChatDetails, users: allUsers }) {
  const { name, user } = getChatDetails(chat);
  const participants = chat.participants.map(id => allUsers.find(u => u.id === id)).filter(Boolean);

  return (
    <header className="flex items-center p-3 border-b border-border bg-background">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex -space-x-4">
          {participants.slice(0, 3).map(p => (
            p && <Avatar key={p.id} className="h-10 w-10 border-2 border-background">
              <AvatarImage src={p.avatar} alt={p.name} data-ai-hint="person portrait" />
              <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div>
          <h2 className="font-semibold text-lg">{name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {chat.type === 'dm' && user ? (
              <>
                <Circle className={cn("h-2 w-2 fill-current", user.status === 'active' ? 'text-green-500' : 'text-gray-400')} />
                <span>{user.status === 'active' ? 'Active' : 'Away'}</span>
              </>
            ) : (
                <>
                <Users size={14} />
                <span>{chat.participants.length} Members</span>
                </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Phone />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Video />
        </Button>
      </div>
    </header>
  );
}
