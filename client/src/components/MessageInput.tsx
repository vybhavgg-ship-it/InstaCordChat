import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Smile, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MessageWithSender } from "@shared/schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageInputProps {
  onSend: (content: string, replyToId?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyTo?: MessageWithSender | null;
  onCancelReply?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const EMOJI_GRID = [
  ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂"],
  ["😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰"],
  ["😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪"],
  ["😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨"],
  ["😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨"],
  ["🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒"],
  ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟"],
  ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍"],
];

export function MessageInput({
  onSend,
  onTypingStart,
  onTypingStop,
  replyTo,
  onCancelReply,
  disabled,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingStop();
    }, 2000);
  }, [isTyping, onTypingStart, onTypingStop]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    onSend(trimmed, replyTo?.id);
    setContent("");
    setIsTyping(false);
    onTypingStop();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setEmojiPickerOpen(false);
    inputRef.current?.focus();
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    handleTyping();

    // Auto-resize
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
  };

  return (
    <div className="border-t border-border bg-background p-4">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50 border-l-2 border-primary">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Replying to{" "}
              <span className="font-medium text-foreground">
                {replyTo.sender.firstName || replyTo.sender.email}
              </span>
            </p>
            <p className="text-sm text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 flex-shrink-0"
            onClick={onCancelReply}
            data-testid="button-cancel-reply"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 flex items-end gap-2 px-4 py-2 rounded-3xl bg-muted/50 border border-border focus-within:border-primary/50 transition-colors">
          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                data-testid="button-emoji-picker"
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="grid gap-1">
                {EMOJI_GRID.map((row, i) => (
                  <div key={i} className="flex gap-1">
                    {row.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="h-8 w-8 flex items-center justify-center rounded-md text-lg hover-elevate"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <textarea
            ref={inputRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent border-0 outline-none text-sm",
              "placeholder:text-muted-foreground min-h-[36px] max-h-[150px] py-2"
            )}
            data-testid="input-message"
          />

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 flex-shrink-0"
            data-testid="button-attach"
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <Button
          size="icon"
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="h-10 w-10 rounded-full flex-shrink-0"
          data-testid="button-send-message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
