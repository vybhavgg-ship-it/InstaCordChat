import { useEffect, useRef, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { ChatHeader } from "./ChatHeader";
import { TypingIndicator } from "./TypingIndicator";
import { MemberList } from "./MemberList";
import type { ChannelWithMembers, MessageWithSender, User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ChatViewProps {
  channel: ChannelWithMembers;
  messages: MessageWithSender[];
  currentUser: User;
  onlineUsers: Set<string>;
  typingUsers: { id: string; firstName: string | null }[];
  onSendMessage: (content: string, replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onReact: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  isLoading?: boolean;
  onMemberClick?: (user: User) => void;
}

export function ChatView({
  channel,
  messages,
  currentUser,
  onlineUsers,
  typingUsers,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onReact,
  onRemoveReaction,
  isLoading,
  onMemberClick,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check if messages are grouped (same sender, within 5 minutes)
  const isGroupedWithPrevious = useCallback((index: number) => {
    if (index === 0) return false;
    const current = messages[index];
    const previous = messages[index - 1];
    
    if (current.senderId !== previous.senderId) return false;
    
    const currentTime = new Date(current.createdAt!).getTime();
    const previousTime = new Date(previous.createdAt!).getTime();
    return currentTime - previousTime < 5 * 60 * 1000; // 5 minutes
  }, [messages]);

  const handleReply = (message: MessageWithSender) => {
    setReplyTo(message);
  };

  const handleSend = (content: string, replyToId?: string) => {
    onSendMessage(content, replyToId);
    setReplyTo(null);
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          channel={channel}
          currentUser={currentUser}
          onlineUsers={onlineUsers}
          onShowMembers={() => setShowMembers(!showMembers)}
        />

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-4xl">
                    {channel.type === "direct" ? "👋" : "💬"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {channel.type === "direct"
                    ? "Start the conversation"
                    : `Welcome to #${channel.name}`}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {channel.type === "direct"
                    ? "Send a message to start chatting"
                    : channel.description || "This is the beginning of the channel. Start the conversation!"}
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUser={currentUser}
                  isGrouped={isGroupedWithPrevious(index)}
                  onReply={handleReply}
                  onReact={onReact}
                  onRemoveReaction={onRemoveReaction}
                />
              ))
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <TypingIndicator users={typingUsers} />
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <MessageInput
          onSend={handleSend}
          onTypingStart={onTypingStart}
          onTypingStop={onTypingStop}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      {/* Member List Sidebar */}
      {showMembers && channel.type !== "direct" && channel.members && (
        <div className={cn(
          "w-60 border-l border-border bg-sidebar flex-shrink-0",
          "hidden lg:flex flex-col"
        )}>
          <MemberList
            members={channel.members}
            onlineUsers={onlineUsers}
            onMemberClick={onMemberClick}
          />
        </div>
      )}
    </div>
  );
}
