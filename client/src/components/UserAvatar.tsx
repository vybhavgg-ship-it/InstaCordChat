import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: {
    profileImageUrl?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  status?: "online" | "away" | "busy" | "offline";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const statusSizeClasses = {
  xs: "h-2 w-2 border",
  sm: "h-2.5 w-2.5 border",
  md: "h-3 w-3 border-2",
  lg: "h-3.5 w-3.5 border-2",
  xl: "h-4 w-4 border-2",
};

const statusColors = {
  online: "bg-status-online",
  away: "bg-status-away",
  busy: "bg-status-busy",
  offline: "bg-status-offline",
};

export function UserAvatar({ user, size = "md", showStatus = false, status = "offline", className }: UserAvatarProps) {
  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || user.email?.[0]?.toUpperCase() || "?";

  return (
    <div className={cn("relative inline-flex", className)}>
      <Avatar className={cn(sizeClasses[size], "border border-border")}>
        <AvatarImage
          src={user.profileImageUrl || undefined}
          alt={`${user.firstName || "User"}'s avatar`}
          className="object-cover"
        />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-background",
            statusSizeClasses[size],
            statusColors[status]
          )}
          data-testid={`status-indicator-${status}`}
        />
      )}
    </div>
  );
}
