import { cn } from "@/lib/utils";
import type { MessageWithSender, User } from "@shared/schema";
import { UserAvatar } from "./UserAvatar";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { MoreHorizontal, Reply, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

interface MessageBubbleProps {
  message: MessageWithSender;
  currentUser: User;
  isGrouped?: boolean;
  showAvatar?: boolean;
  onReply?: (message: MessageWithSender) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

function formatMessageTime(date: Date) {
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, h:mm a");
}

export function MessageBubble({
  message,
  currentUser,
  isGrouped = false,
  showAvatar = true,
  onReply,
  onReact,
  onRemoveReaction,
}: MessageBubbleProps) {
  const isOwnMessage = message.senderId === currentUser.id;
  const [showActions, setShowActions] = useState(false);
  const [reactionPopoverOpen, setReactionPopoverOpen] = useState(false);

  // Group reactions by emoji
  const reactionGroups = message.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>) || {};

  const hasReacted = (emoji: string) => {
    return reactionGroups[emoji]?.some((r) => r.userId === currentUser.id);
  };

  const handleReactionClick = (emoji: string) => {
    if (hasReacted(emoji)) {
      onRemoveReaction?.(message.id, emoji);
    } else {
      onReact?.(message.id, emoji);
    }
    setReactionPopoverOpen(false);
  };

  return (
    <div
      className={cn(
        "group flex gap-3 px-4",
        isOwnMessage ? "flex-row-reverse" : "flex-row",
        isGrouped ? "mt-0.5" : "mt-4"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      data-testid={`message-bubble-${message.id}`}
    >
      {/* Avatar */}
      <div className={cn("flex-shrink-0 w-8", isGrouped && !showAvatar && "invisible")}>
        {(!isGrouped || showAvatar) && (
          <UserAvatar user={message.sender} size="sm" />
        )}
      </div>

      {/* Message content */}
      <div className={cn("flex flex-col max-w-[65%]", isOwnMessage && "items-end")}>
        {/* Sender name and time */}
        {!isGrouped && (
          <div className={cn("flex items-center gap-2 mb-1", isOwnMessage && "flex-row-reverse")}>
            <span className="text-sm font-medium">
              {isOwnMessage
                ? "You"
                : `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim() ||
                  message.sender.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(new Date(message.createdAt!))}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={cn(
              "px-4 py-2.5 rounded-2xl text-sm break-words",
              isOwnMessage
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted text-foreground rounded-bl-md"
            )}
          >
            {message.content}
            {message.isEdited && (
              <span className="text-xs opacity-70 ml-2">(edited)</span>
            )}
          </div>

          {/* Quick actions */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity",
              isOwnMessage ? "-left-20" : "-right-20",
              showActions ? "opacity-100" : "opacity-0"
            )}
          >
            <Popover open={reactionPopoverOpen} onOpenChange={setReactionPopoverOpen}>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`button-react-${message.id}`}>
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align={isOwnMessage ? "end" : "start"}>
                <div className="flex gap-1">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReactionClick(emoji)}
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-md text-lg hover-elevate",
                        hasReacted(emoji) && "bg-primary/20"
                      )}
                      data-testid={`reaction-${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {onReply && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => onReply(message)}
                data-testid={`button-reply-${message.id}`}
              >
                <Reply className="h-4 w-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`button-more-${message.id}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                <DropdownMenuItem>Copy text</DropdownMenuItem>
                {isOwnMessage && <DropdownMenuItem>Edit message</DropdownMenuItem>}
                {isOwnMessage && (
                  <DropdownMenuItem className="text-destructive">Delete message</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isOwnMessage && "justify-end")}>
            {Object.entries(reactionGroups).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border hover-elevate",
                  hasReacted(emoji) && "bg-primary/10 border-primary/30"
                )}
                data-testid={`reaction-count-${emoji}`}
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground">{reactions?.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
