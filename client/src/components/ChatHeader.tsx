import { Hash, Lock, Phone, Video, Settings, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import type { ChannelWithMembers, User } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  channel: ChannelWithMembers;
  currentUser: User;
  onlineUsers: Set<string>;
  onShowMembers?: () => void;
  onShowSettings?: () => void;
}

export function ChatHeader({
  channel,
  currentUser,
  onlineUsers,
  onShowMembers,
  onShowSettings,
}: ChatHeaderProps) {
  const isDirectMessage = channel.type === "direct";
  
  const getOtherUser = () => {
    if (!isDirectMessage) return null;
    const otherMember = channel.members?.find((m) => m.userId !== currentUser.id);
    return otherMember?.user;
  };

  const otherUser = getOtherUser();
  const isOnline = otherUser ? onlineUsers.has(otherUser.id) : false;

  const getDisplayName = () => {
    if (isDirectMessage && otherUser) {
      return `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || otherUser.email || "Unknown";
    }
    return channel.name;
  };

  const getSubtitle = () => {
    if (isDirectMessage && otherUser) {
      return isOnline ? "Online" : "Offline";
    }
    const onlineMemberCount = channel.members?.filter((m) => onlineUsers.has(m.userId)).length || 0;
    return `${channel.members?.length || 0} members, ${onlineMemberCount} online`;
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 min-w-0">
        {isDirectMessage && otherUser ? (
          <UserAvatar
            user={otherUser}
            size="md"
            showStatus
            status={isOnline ? "online" : "offline"}
          />
        ) : (
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
            "bg-primary/10 text-primary"
          )}>
            {channel.isPrivate ? (
              <Lock className="h-5 w-5" />
            ) : (
              <Hash className="h-5 w-5" />
            )}
          </div>
        )}

        <div className="min-w-0">
          <h2 className="font-semibold text-foreground truncate" data-testid="text-channel-name">
            {getDisplayName()}
          </h2>
          <p className={cn(
            "text-xs truncate",
            isOnline ? "text-status-online" : "text-muted-foreground"
          )} data-testid="text-channel-status">
            {getSubtitle()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          data-testid="button-voice-call"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          data-testid="button-video-call"
        >
          <Video className="h-4 w-4" />
        </Button>
        
        {!isDirectMessage && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onShowMembers}
            data-testid="button-show-members"
          >
            <Users className="h-4 w-4" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-channel-menu">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onShowMembers}>
              <Users className="h-4 w-4 mr-2" />
              View members
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowSettings}>
              <Settings className="h-4 w-4 mr-2" />
              Channel settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Leave channel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
