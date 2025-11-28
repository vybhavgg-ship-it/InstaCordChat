import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  users: { id: string; firstName: string | null }[];
  className?: string;
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].firstName || "Someone"} is typing`;
    } else if (users.length === 2) {
      return `${users[0].firstName || "Someone"} and ${users[1].firstName || "someone"} are typing`;
    } else {
      return `${users[0].firstName || "Someone"} and ${users.length - 1} others are typing`;
    }
  };

  return (
    <div
      className={cn("flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground", className)}
      data-testid="typing-indicator"
    >
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}
