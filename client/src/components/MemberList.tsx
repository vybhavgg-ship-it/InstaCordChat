import { Crown, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "./UserAvatar";
import type { ChannelMember, User } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MemberListProps {
  members: (ChannelMember & { user: User })[];
  onlineUsers: Set<string>;
  onMemberClick?: (user: User) => void;
  className?: string;
}

export function MemberList({ members, onlineUsers, onMemberClick, className }: MemberListProps) {
  const sortedMembers = [...members].sort((a, b) => {
    // Online first
    const aOnline = onlineUsers.has(a.userId) ? 1 : 0;
    const bOnline = onlineUsers.has(b.userId) ? 1 : 0;
    if (aOnline !== bOnline) return bOnline - aOnline;

    // Then by role
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    const aRole = roleOrder[a.role as keyof typeof roleOrder] ?? 2;
    const bRole = roleOrder[b.role as keyof typeof roleOrder] ?? 2;
    return aRole - bRole;
  });

  const onlineMembers = sortedMembers.filter((m) => onlineUsers.has(m.userId));
  const offlineMembers = sortedMembers.filter((m) => !onlineUsers.has(m.userId));

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case "admin":
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const MemberItem = ({ member }: { member: (typeof members)[0] }) => {
    const isOnline = onlineUsers.has(member.userId);
    
    return (
      <button
        onClick={() => onMemberClick?.(member.user)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover-elevate",
          !isOnline && "opacity-60"
        )}
        data-testid={`member-item-${member.userId}`}
      >
        <UserAvatar
          user={member.user}
          size="sm"
          showStatus
          status={isOnline ? "online" : "offline"}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">
              {member.user.firstName || ""} {member.user.lastName || ""}
            </span>
            {getRoleIcon(member.role)}
          </div>
          {member.user.statusMessage && (
            <p className="text-xs text-muted-foreground truncate">
              {member.user.statusMessage}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Members</h3>
        <p className="text-xs text-muted-foreground">
          {onlineMembers.length} online, {members.length} total
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Online Members */}
          {onlineMembers.length > 0 && (
            <div className="mb-4">
              <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Online — {onlineMembers.length}
              </p>
              <div className="space-y-0.5">
                {onlineMembers.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}

          {/* Offline Members */}
          {offlineMembers.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Offline — {offlineMembers.length}
              </p>
              <div className="space-y-0.5">
                {offlineMembers.map((member) => (
                  <MemberItem key={member.id} member={member} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
