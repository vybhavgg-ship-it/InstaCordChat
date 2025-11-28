import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Hash, Lock, Users, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "./UserAvatar";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

const createChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required").max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  type: z.enum(["direct", "group"]).default("group"),
});

type CreateChannelForm = z.infer<typeof createChannelSchema>;

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChannel: (data: CreateChannelForm & { memberIds: string[] }) => void;
  users: User[];
  currentUser: User;
  isLoading?: boolean;
}

export function CreateChannelDialog({
  open,
  onOpenChange,
  onCreateChannel,
  users,
  currentUser,
  isLoading,
}: CreateChannelDialogProps) {
  const [channelType, setChannelType] = useState<"direct" | "group">("group");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<CreateChannelForm>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
      type: "group",
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.id !== currentUser.id &&
      !selectedUsers.find((u) => u.id === user.id) &&
      (user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectUser = (user: User) => {
    if (channelType === "direct") {
      setSelectedUsers([user]);
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
    setSearchQuery("");
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = (data: CreateChannelForm) => {
    onCreateChannel({
      ...data,
      type: channelType,
      name: channelType === "direct" && selectedUsers[0]
        ? `${selectedUsers[0].firstName || ""} ${selectedUsers[0].lastName || ""}`.trim() || selectedUsers[0].email || "Direct Message"
        : data.name,
      memberIds: selectedUsers.map((u) => u.id),
    });
    form.reset();
    setSelectedUsers([]);
    setSearchQuery("");
  };

  const handleClose = () => {
    form.reset();
    setSelectedUsers([]);
    setSearchQuery("");
    setChannelType("group");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start a new conversation</DialogTitle>
          <DialogDescription>
            Create a group channel or start a direct message with someone
          </DialogDescription>
        </DialogHeader>

        {/* Type Selector */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setChannelType("direct");
              setSelectedUsers([]);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors",
              channelType === "direct"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover-elevate"
            )}
            data-testid="button-type-direct"
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">Direct Message</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setChannelType("group");
              setSelectedUsers([]);
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors",
              channelType === "group"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover-elevate"
            )}
            data-testid="button-type-group"
          >
            <Hash className="h-4 w-4" />
            <span className="font-medium">Group Channel</span>
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* User Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {channelType === "direct" ? "Select a person" : "Add members"}
              </label>
              
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                      <UserAvatar user={user} size="xs" />
                      <span>{user.firstName || user.email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user.id)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                        data-testid={`button-remove-user-${user.id}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Search Input */}
              {(channelType === "group" || selectedUsers.length === 0) && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-users"
                  />
                </div>
              )}

              {/* User List */}
              {searchQuery && (
                <ScrollArea className="h-40 mt-2 border rounded-lg">
                  <div className="p-1">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover-elevate text-left"
                          data-testid={`user-option-${user.id}`}
                        >
                          <UserAvatar user={user} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {user.firstName || ""} {user.lastName || ""}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No users found
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Channel Name (for groups only) */}
            {channelType === "group" && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="general"
                          className="pl-9"
                          data-testid="input-channel-name"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description (for groups only) */}
            {channelType === "group" && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's this channel about?"
                        className="resize-none"
                        rows={2}
                        data-testid="input-channel-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Private Toggle (for groups only) */}
            {channelType === "group" && (
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <FormLabel className="text-base">Private channel</FormLabel>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Only invited members can see and join
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-private"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  selectedUsers.length === 0 ||
                  (channelType === "group" && !form.watch("name"))
                }
                data-testid="button-create-channel"
              >
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
