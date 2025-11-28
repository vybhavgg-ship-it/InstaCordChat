import {
  users,
  channels,
  channelMembers,
  messages,
  reactions,
  friendships,
  type User,
  type UpsertUser,
  type Channel,
  type InsertChannel,
  type ChannelMember,
  type InsertChannelMember,
  type Message,
  type InsertMessage,
  type Reaction,
  type InsertReaction,
  type Friendship,
  type InsertFriendship,
  type MessageWithSender,
  type ChannelWithMembers,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  searchUsersByUsername(username: string, limit?: number): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserStatus(userId: string, status: string, statusMessage?: string): Promise<User | undefined>;

  // Channel operations
  getChannel(id: string): Promise<Channel | undefined>;
  getChannelWithMembers(id: string): Promise<ChannelWithMembers | undefined>;
  getUserChannels(userId: string): Promise<ChannelWithMembers[]>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  updateChannel(id: string, updates: Partial<InsertChannel>): Promise<Channel | undefined>;
  deleteChannel(id: string): Promise<boolean>;

  // Channel member operations
  addChannelMember(member: InsertChannelMember): Promise<ChannelMember>;
  removeChannelMember(channelId: string, userId: string): Promise<boolean>;
  getChannelMembers(channelId: string): Promise<(ChannelMember & { user: User })[]>;
  isChannelMember(channelId: string, userId: string): Promise<boolean>;

  // Message operations
  getMessage(id: string): Promise<Message | undefined>;
  getMessageWithSender(id: string): Promise<MessageWithSender | undefined>;
  getChannelMessages(channelId: string, limit?: number, before?: string): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<MessageWithSender>;
  updateMessage(id: string, content: string): Promise<Message | undefined>;
  deleteMessage(id: string): Promise<boolean>;

  // Reaction operations
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean>;
  getMessageReactions(messageId: string): Promise<(Reaction & { user: User })[]>;

  // Friendship operations
  getFriendship(userId1: string, userId2: string): Promise<Friendship | undefined>;
  getUserFriends(userId: string): Promise<(Friendship & { friend: User })[]>;
  getPendingFriendRequests(userId: string): Promise<(Friendship & { requester: User })[]>;
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendshipStatus(id: string, status: string): Promise<Friendship | undefined>;
  deleteFriendship(id: string): Promise<boolean>;

  // Direct message helpers
  findDirectChannel(userId1: string, userId2: string): Promise<Channel | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async searchUsersByUsername(username: string, limit: number = 10): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, username),
          and(
            users.username.like(`${username}%`),
            users.username.notEqualsInsensitive(null)
          )
        )
      )
      .limit(limit);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUserStatus(userId: string, status: string, statusMessage?: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ status, statusMessage, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // Channel operations
  async getChannel(id: string): Promise<Channel | undefined> {
    const [channel] = await db.select().from(channels).where(eq(channels.id, id));
    return channel || undefined;
  }

  async getChannelWithMembers(id: string): Promise<ChannelWithMembers | undefined> {
    const channel = await this.getChannel(id);
    if (!channel) return undefined;

    const members = await this.getChannelMembers(id);
    const channelMessages = await this.getChannelMessages(id, 1);
    const lastMessage = channelMessages[0];

    return {
      ...channel,
      members,
      lastMessage,
    };
  }

  async getUserChannels(userId: string): Promise<ChannelWithMembers[]> {
    const memberRecords = await db
      .select()
      .from(channelMembers)
      .where(eq(channelMembers.userId, userId));

    const channelIds = memberRecords.map((m) => m.channelId);
    if (channelIds.length === 0) return [];

    const channelRecords = await db
      .select()
      .from(channels)
      .where(inArray(channels.id, channelIds));

    const result: ChannelWithMembers[] = [];
    for (const channel of channelRecords) {
      const members = await this.getChannelMembers(channel.id);
      const channelMessages = await this.getChannelMessages(channel.id, 1);
      const lastMessage = channelMessages[0];

      result.push({
        ...channel,
        members,
        lastMessage,
      });
    }

    // Sort by last message date
    result.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return result;
  }

  async createChannel(channelData: InsertChannel): Promise<Channel> {
    const [channel] = await db.insert(channels).values(channelData).returning();
    return channel;
  }

  async updateChannel(id: string, updates: Partial<InsertChannel>): Promise<Channel | undefined> {
    const [channel] = await db
      .update(channels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(channels.id, id))
      .returning();
    return channel || undefined;
  }

  async deleteChannel(id: string): Promise<boolean> {
    const result = await db.delete(channels).where(eq(channels.id, id));
    return true;
  }

  // Channel member operations
  async addChannelMember(member: InsertChannelMember): Promise<ChannelMember> {
    const [record] = await db.insert(channelMembers).values(member).returning();
    return record;
  }

  async removeChannelMember(channelId: string, userId: string): Promise<boolean> {
    await db
      .delete(channelMembers)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)));
    return true;
  }

  async getChannelMembers(channelId: string): Promise<(ChannelMember & { user: User })[]> {
    const members = await db
      .select()
      .from(channelMembers)
      .where(eq(channelMembers.channelId, channelId));

    const result: (ChannelMember & { user: User })[] = [];
    for (const member of members) {
      const user = await this.getUser(member.userId);
      if (user) {
        result.push({ ...member, user });
      }
    }
    return result;
  }

  async isChannelMember(channelId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(channelMembers)
      .where(and(eq(channelMembers.channelId, channelId), eq(channelMembers.userId, userId)));
    return !!member;
  }

  // Message operations
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getMessageWithSender(id: string): Promise<MessageWithSender | undefined> {
    const message = await this.getMessage(id);
    if (!message) return undefined;

    const sender = await this.getUser(message.senderId);
    if (!sender) return undefined;

    const messageReactions = await this.getMessageReactions(id);

    return {
      ...message,
      sender,
      reactions: messageReactions,
    };
  }

  async getChannelMessages(channelId: string, limit = 50, before?: string): Promise<MessageWithSender[]> {
    let query = db
      .select()
      .from(messages)
      .where(eq(messages.channelId, channelId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    const messageRecords = await query;

    const result: MessageWithSender[] = [];
    for (const message of messageRecords.reverse()) {
      const sender = await this.getUser(message.senderId);
      if (sender) {
        const messageReactions = await this.getMessageReactions(message.id);
        result.push({
          ...message,
          sender,
          reactions: messageReactions,
        });
      }
    }
    return result;
  }

  async createMessage(messageData: InsertMessage): Promise<MessageWithSender> {
    const [message] = await db.insert(messages).values(messageData).returning();
    const sender = await this.getUser(message.senderId);
    if (!sender) throw new Error("Sender not found");

    return {
      ...message,
      sender,
      reactions: [],
    };
  }

  async updateMessage(id: string, content: string): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ content, isEdited: true, updatedAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return message || undefined;
  }

  async deleteMessage(id: string): Promise<boolean> {
    await db.delete(messages).where(eq(messages.id, id));
    return true;
  }

  // Reaction operations
  async addReaction(reactionData: InsertReaction): Promise<Reaction> {
    // Check if reaction already exists
    const [existing] = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.messageId, reactionData.messageId),
          eq(reactions.userId, reactionData.userId),
          eq(reactions.emoji, reactionData.emoji)
        )
      );

    if (existing) return existing;

    const [reaction] = await db.insert(reactions).values(reactionData).returning();
    return reaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
    await db
      .delete(reactions)
      .where(
        and(
          eq(reactions.messageId, messageId),
          eq(reactions.userId, userId),
          eq(reactions.emoji, emoji)
        )
      );
    return true;
  }

  async getMessageReactions(messageId: string): Promise<(Reaction & { user: User })[]> {
    const reactionRecords = await db
      .select()
      .from(reactions)
      .where(eq(reactions.messageId, messageId));

    const result: (Reaction & { user: User })[] = [];
    for (const reaction of reactionRecords) {
      const user = await this.getUser(reaction.userId);
      if (user) {
        result.push({ ...reaction, user });
      }
    }
    return result;
  }

  // Friendship operations
  async getFriendship(userId1: string, userId2: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, userId1), eq(friendships.addresseeId, userId2)),
          and(eq(friendships.requesterId, userId2), eq(friendships.addresseeId, userId1))
        )
      );
    return friendship || undefined;
  }

  async getUserFriends(userId: string): Promise<(Friendship & { friend: User })[]> {
    const friendRecords = await db
      .select()
      .from(friendships)
      .where(
        and(
          or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
          eq(friendships.status, "accepted")
        )
      );

    const result: (Friendship & { friend: User })[] = [];
    for (const record of friendRecords) {
      const friendId = record.requesterId === userId ? record.addresseeId : record.requesterId;
      const friend = await this.getUser(friendId);
      if (friend) {
        result.push({ ...record, friend });
      }
    }
    return result;
  }

  async getPendingFriendRequests(userId: string): Promise<(Friendship & { requester: User })[]> {
    const requests = await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")));

    const result: (Friendship & { requester: User })[] = [];
    for (const request of requests) {
      const requester = await this.getUser(request.requesterId);
      if (requester) {
        result.push({ ...request, requester });
      }
    }
    return result;
  }

  async createFriendship(friendshipData: InsertFriendship): Promise<Friendship> {
    const [friendship] = await db.insert(friendships).values(friendshipData).returning();
    return friendship;
  }

  async updateFriendshipStatus(id: string, status: string): Promise<Friendship | undefined> {
    const [friendship] = await db
      .update(friendships)
      .set({ status, updatedAt: new Date() })
      .where(eq(friendships.id, id))
      .returning();
    return friendship || undefined;
  }

  async deleteFriendship(id: string): Promise<boolean> {
    await db.delete(friendships).where(eq(friendships.id, id));
    return true;
  }

  // Direct message helpers
  async findDirectChannel(userId1: string, userId2: string): Promise<Channel | undefined> {
    // Find a direct channel that has exactly both users
    const user1Channels = await db
      .select()
      .from(channelMembers)
      .where(eq(channelMembers.userId, userId1));

    for (const membership of user1Channels) {
      const channel = await this.getChannel(membership.channelId);
      if (channel?.type !== "direct") continue;

      const members = await this.getChannelMembers(membership.channelId);
      if (members.length === 2 && members.some((m) => m.userId === userId2)) {
        return channel;
      }
    }
    return undefined;
  }
}

export const storage = new DatabaseStorage();
