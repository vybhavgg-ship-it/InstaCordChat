import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LogOut, Settings, Search, MessageCircle, Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { ChannelList } from "@/components/ChannelList";
import { ChatView } from "@/components/ChatView";
import { CreateChannelDialog } from "@/components/CreateChannelDialog";
import { UserProfileCard } from "@/components/UserProfileCard";
import { VoiceCallWidget } from "@/components/VoiceCallWidget";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChannelWithMembers, MessageWithSender, User } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);

  // WebSocket connection
  const {
    isConnected,
    onlineUsers,
    typingUsers,
    newMessage,
    messageReaction,
    startTyping,
    stopTyping,
    sendChatMessage,
    addReaction,
    removeReaction,
    clearNewMessage,
    clearMessageReaction,
  } = useWebSocket(user?.id);

  // Fetch channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery<ChannelWithMembers[]>({
    queryKey: ["/api/channels"],
    enabled: !!user,
  });

  // Fetch messages for active channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/channels", activeChannelId, "messages"],
    enabled: !!activeChannelId,
  });

  // Fetch all users for creating channels
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Handle new message from WebSocket
  useEffect(() => {
    if (newMessage && newMessage.channelId === activeChannelId) {
      queryClient.setQueryData<MessageWithSender[]>(
        ["/api/channels", activeChannelId, "messages"],
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
      clearNewMessage();
    } else if (newMessage) {
      // Update channel list with last message
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      clearNewMessage();
    }
  }, [newMessage, activeChannelId, clearNewMessage]);

  // Handle reaction update from WebSocket
  useEffect(() => {
    if (messageReaction) {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/channels", activeChannelId, "messages"] 
      });
      clearMessageReaction();
    }
  }, [messageReaction, activeChannelId, clearMessageReaction]);

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPrivate?: boolean; type: string; memberIds: string[] }) => {
      const response = await apiRequest("POST", "/api/channels", data);
      return response;
    },
    onSuccess: (newChannel: ChannelWithMembers) => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      setActiveChannelId(newChannel.id);
      setCreateDialogOpen(false);
      toast({
        title: "Channel created",
        description: `Successfully created ${newChannel.type === "direct" ? "direct message" : newChannel.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create channel",
        variant: "destructive",
      });
    },
  });

  // Filter channels based on search
  const filteredChannels = channels.filter((channel) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (channel.name.toLowerCase().includes(query)) return true;
    if (channel.type === "direct") {
      const otherMember = channel.members?.find((m) => m.userId !== user?.id);
      if (
        otherMember?.user.firstName?.toLowerCase().includes(query) ||
        otherMember?.user.lastName?.toLowerCase().includes(query) ||
        otherMember?.user.email?.toLowerCase().includes(query)
      ) {
        return true;
      }
    }
    return false;
  });

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Get typing users for active channel
  const channelTypingUsers = activeChannelId
    ? (typingUsers.get(activeChannelId) || []).filter((u) => u.id !== user?.id)
    : [];

  const handleSendMessage = useCallback(
    (content: string, replyToId?: string) => {
      if (activeChannelId) {
        sendChatMessage(activeChannelId, content, replyToId);
      }
    },
    [activeChannelId, sendChatMessage]
  );

  const handleTypingStart = useCallback(() => {
    if (activeChannelId) {
      startTyping(activeChannelId);
    }
  }, [activeChannelId, startTyping]);

  const handleTypingStop = useCallback(() => {
    if (activeChannelId) {
      stopTyping(activeChannelId);
    }
  }, [activeChannelId, stopTyping]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleCreateChannel = (data: { name: string; description?: string; isPrivate?: boolean; type: string; memberIds: string[] }) => {
    createChannelMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left Sidebar - Conversations */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-80 bg-background border-r border-border flex flex-col transition-transform duration-300 md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">STEALTHchat</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 hover-elevate rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-channels"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ChannelList
          channels={filteredChannels}
          currentUser={user}
          activeChannelId={activeChannelId || undefined}
          onSelectChannel={(id) => {
            setActiveChannelId(id);
            setSidebarOpen(false);
          }}
          onCreateChannel={() => setCreateDialogOpen(true)}
          onlineUsers={onlineUsers}
          isLoading={channelsLoading}
        />

        {/* User Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              size="md"
              showStatus
              status="online"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {user.firstName || ""} {user.lastName || ""}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" data-testid="button-user-menu">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSelectedUserProfile(user)}>
                  <UserAvatar user={user} size="xs" className="mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <div className="border-b border-border bg-background">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-1 hover-elevate rounded-lg"
                data-testid="button-sidebar-toggle"
              >
                <Menu className="h-5 w-5" />
              </button>
              {activeChannel && (
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-foreground">
                    {activeChannel.type === "direct"
                      ? activeChannel.members?.find((m) => m.userId !== user.id)?.user.firstName ||
                        activeChannel.members?.find((m) => m.userId !== user.id)?.user.email ||
                        "Direct Message"
                      : activeChannel.name}
                  </h1>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-status-online" : "bg-status-offline"
                )}
                title={isConnected ? "Connected" : "Disconnected"}
              />
              {activeChannel && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setVoiceCallOpen(true)}
                  data-testid="button-start-voice-call"
                  title="Start voice call"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          {activeChannel ? (
            <ChatView
              channel={activeChannel}
              messages={messages}
              currentUser={user}
              onlineUsers={onlineUsers}
              typingUsers={channelTypingUsers}
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              onReact={addReaction}
              onRemoveReaction={removeReaction}
              isLoading={messagesLoading}
              onMemberClick={setSelectedUserProfile}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to STEALTHchat
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Select a conversation or start a new chat to begin messaging.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2" data-testid="button-start-chat">
                <MessageCircle className="h-4 w-4" />
                Start a New Chat
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Voice Call Widget */}
      {activeChannel && (
        <VoiceCallWidget
          channelId={activeChannel.id}
          currentUserId={user?.id || ""}
          isVisible={voiceCallOpen}
          onClose={() => setVoiceCallOpen(false)}
        />
      )}

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateChannel={handleCreateChannel}
        users={allUsers}
        currentUser={user}
        isLoading={createChannelMutation.isPending}
      />

      {/* User Profile Sheet/Dialog */}
      {selectedUserProfile && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedUserProfile(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <UserProfileCard
              user={selectedUserProfile}
              currentUser={user}
              isOnline={onlineUsers.has(selectedUserProfile.id)}
              onMessage={() => {
                // Find or create DM channel
                const existingDM = channels.find(
                  (c) =>
                    c.type === "direct" &&
                    c.members?.some((m) => m.userId === selectedUserProfile.id)
                );
                if (existingDM) {
                  setActiveChannelId(existingDM.id);
                } else {
                  createChannelMutation.mutate({
                    name: "",
                    type: "direct",
                    memberIds: [selectedUserProfile.id],
                  });
                }
                setSelectedUserProfile(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
