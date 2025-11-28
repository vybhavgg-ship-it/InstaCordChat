import { Mail, MessageCircle, Phone, MoreHorizontal, UserPlus, UserMinus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "./UserAvatar";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

interface UserProfileCardProps {
  user: User;
  currentUser: User;
  isOnline?: boolean;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
  onMessage?: () => void;
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
  className?: string;
}

export function UserProfileCard({
  user,
  currentUser,
  isOnline = false,
  isFriend = false,
  hasPendingRequest = false,
  onMessage,
  onAddFriend,
  onRemoveFriend,
  className,
}: UserProfileCardProps) {
  const isOwnProfile = user.id === currentUser.id;

  const getStatusText = () => {
    if (user.statusMessage) return user.statusMessage;
    if (isOnline) return "Available";
    return "Offline";
  };

  return (
    <Card className={cn("overflow-hidden", className)} data-testid={`profile-card-${user.id}`}>
      {/* Banner/Header */}
      <div className="h-20 bg-gradient-to-r from-primary/30 to-primary/10" />

      <CardContent className="pt-0 -mt-8">
        {/* Avatar */}
        <div className="flex items-end justify-between">
          <UserAvatar
            user={user}
            size="xl"
            showStatus
            status={isOnline ? "online" : "offline"}
            className="ring-4 ring-card"
          />

          {!isOwnProfile && (
            <div className="flex items-center gap-1 pb-2">
              <Button
                size="sm"
                variant="default"
                onClick={onMessage}
                className="gap-1"
                data-testid="button-message-user"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" data-testid="button-user-actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isFriend ? (
                    <DropdownMenuItem onClick={onRemoveFriend}>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove friend
                    </DropdownMenuItem>
                  ) : hasPendingRequest ? (
                    <DropdownMenuItem disabled>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Request pending
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onAddFriend}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add friend
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Phone className="h-4 w-4 mr-2" />
                    Start call
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Ban className="h-4 w-4 mr-2" />
                    Block user
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="mt-3 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-foreground" data-testid="text-user-name">
              {user.firstName || ""} {user.lastName || ""}
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-user-email">
              {user.email}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isOnline ? "bg-status-online" : "bg-status-offline"
              )}
            />
            <span className="text-sm text-muted-foreground">{getStatusText()}</span>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-foreground" data-testid="text-user-bio">
              {user.bio}
            </p>
          )}

          {/* Member since */}
          <p className="text-xs text-muted-foreground">
            Member since{" "}
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })
              : "Unknown"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
