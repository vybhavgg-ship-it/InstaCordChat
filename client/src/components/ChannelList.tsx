import { Hash, Lock, Plus, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChannelWithMembers, User } from "@shared/schema";
import { UserAvatar } from "./UserAvatar";
import { formatDistanceToNow } from "date-fns";

interface ChannelListProps {
  channels: ChannelWithMembers[];
  currentUser: User;
  activeChannelId?: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: () => void;
  onlineUsers: Set<string>;
  isLoading?: boolean;
}

export function ChannelList({
  channels,
  currentUser,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  onlineUsers,
  isLoading,
}: ChannelListProps) {
  const directChannels = channels.filter((c) => c.type === "direct");
  const groupChannels = channels.filter((c) => c.type === "group");

  const getDirectChatUser = (channel: ChannelWithMembers) => {
    const otherMember = channel.members?.find((m) => m.userId !== currentUser.id);
    return otherMember?.user;
  };

  const getChannelDisplayName = (channel: ChannelWithMembers) => {
    if (channel.type === "direct") {
      const otherUser = getDirectChatUser(channel);
      return otherUser
        ? `${otherUser.firstName || ""} ${otherUser.lastName || ""}`.trim() || otherUser.email
        : "Unknown User";
    }
    return channel.name;
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <Button
          onClick={onCreateChannel}
          className="w-full gap-2"
          data-testid="button-create-channel"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Direct Messages */}
          {directChannels.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5" />
                Direct Messages
              </div>
              <div className="space-y-1">
                {directChannels.map((channel) => {
                  const otherUser = getDirectChatUser(channel);
                  const isOnline = otherUser ? onlineUsers.has(otherUser.id) : false;
                  
                  return (
                    <button
                      key={channel.id}
                      onClick={() => onSelectChannel(channel.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover-elevate",
                        activeChannelId === channel.id
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground"
                      )}
                      data-testid={`channel-item-${channel.id}`}
                    >
                      {otherUser && (
                        <UserAvatar
                          user={otherUser}
                          size="md"
                          showStatus
                          status={isOnline ? "online" : "offline"}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">
                            {getChannelDisplayName(channel)}
                          </span>
                          {channel.lastMessage && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDistanceToNow(new Date(channel.lastMessage.createdAt!), { addSuffix: false })}
                            </span>
                          )}
                        </div>
                        {channel.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {channel.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group Channels */}
          {groupChannels.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Channels
              </div>
              <div className="space-y-1">
                {groupChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover-elevate",
                      activeChannelId === channel.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground"
                    )}
                    data-testid={`channel-item-${channel.id}`}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      "bg-primary/10 text-primary"
                    )}>
                      {channel.isPrivate ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Hash className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {channel.name}
                        </span>
                        {channel.lastMessage && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(channel.lastMessage.createdAt!), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {channel.members?.length || 0} members
                        </span>
                        {channel.lastMessage && (
                          <span className="text-xs text-muted-foreground truncate">
                            • {channel.lastMessage.content}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {channels.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No conversations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start a new chat to connect with friends
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
