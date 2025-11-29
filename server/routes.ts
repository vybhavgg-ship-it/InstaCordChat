import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import { insertChannelSchema, insertMessageSchema, insertFriendshipSchema } from "@shared/schema";
import { z } from "zod";
import { parse as parseCookie } from "cookie";
import type { IncomingMessage } from "http";
import bcrypt from "bcryptjs";
import path from "path";
import { promises as fs } from "fs";

// Store connected clients
const clients = new Map<string, WebSocket>();
const userChannels = new Map<string, Set<string>>();

function broadcastToChannel(channelId: string, message: any, excludeUserId?: string) {
  const channelUsers = Array.from(userChannels.entries())
    .filter(([_, channels]) => channels.has(channelId))
    .map(([userId]) => userId);

  for (const userId of channelUsers) {
    if (userId === excludeUserId) continue;
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

function broadcastToAll(message: any, excludeUserId?: string) {
  for (const [userId, client] of clients.entries()) {
    if (userId === excludeUserId) continue;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  // Media upload endpoint (simple file storage)
  app.post("/api/media/upload", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { messageId, fileName, fileType, base64Data } = req.body;

      if (!messageId || !fileName || !fileType || !base64Data) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Decode base64 and store (in production, use cloud storage)
      const buffer = Buffer.from(base64Data, "base64");
      const storagePath = path.join(uploadsDir, `${Date.now()}-${fileName}`);
      const fileUrl = `/uploads/${path.basename(storagePath)}`;

      await fs.writeFile(storagePath, buffer);

      const media = await storage.addMediaAttachment({
        messageId,
        fileUrl,
        fileName,
        fileType,
        mimeType: req.body.mimeType || "application/octet-stream",
        fileSize: buffer.length,
      });

      res.json(media);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Password signup route
  app.post("/api/auth/signup", async (req: any, res) => {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      // Validation
      if (!email || !username || !password) {
        return res.status(400).json({ message: "Email, username, and password required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Check if email or username exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const { displayName } = req.body;
      const user = await storage.upsertUser({
        email,
        username,
        displayName: displayName || username,
        passwordHash,
        firstName: firstName || "",
        lastName: lastName || "",
      });

      // Create session
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Password login route
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Create session
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Search users by username
  app.get("/api/users/search/:username", isAuthenticated, async (req, res) => {
    try {
      const { username } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!username || username.length < 1) {
        return res.json([]);
      }

      const results = await storage.searchUsersByUsername(username, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Channel routes
  app.get("/api/channels", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const channels = await storage.getUserChannels(userId);
      res.json(channels);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.post("/api/channels", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, isPrivate, type, memberIds } = req.body;

      // For direct messages, check if one already exists
      if (type === "direct" && memberIds.length === 1) {
        const existingChannel = await storage.findDirectChannel(userId, memberIds[0]);
        if (existingChannel) {
          const channelWithMembers = await storage.getChannelWithMembers(existingChannel.id);
          return res.json(channelWithMembers);
        }
      }

      // Create the channel
      const channel = await storage.createChannel({
        name: name || "Direct Message",
        description,
        isPrivate: isPrivate || type === "direct",
        type: type || "group",
        ownerId: userId,
      });

      // Add the creator as owner
      await storage.addChannelMember({
        channelId: channel.id,
        userId,
        role: "owner",
      });

      // Add other members
      for (const memberId of memberIds) {
        await storage.addChannelMember({
          channelId: channel.id,
          userId: memberId,
          role: "member",
        });
      }

      // Update user channels map for WebSocket
      if (!userChannels.has(userId)) {
        userChannels.set(userId, new Set());
      }
      userChannels.get(userId)!.add(channel.id);

      for (const memberId of memberIds) {
        if (!userChannels.has(memberId)) {
          userChannels.set(memberId, new Set());
        }
        userChannels.get(memberId)!.add(channel.id);
      }

      const channelWithMembers = await storage.getChannelWithMembers(channel.id);
      res.json(channelWithMembers);
    } catch (error) {
      console.error("Error creating channel:", error);
      res.status(500).json({ message: "Failed to create channel" });
    }
  });

  app.get("/api/channels/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const channelId = req.params.id;

      // Check if user is a member
      const isMember = await storage.isChannelMember(channelId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this channel" });
      }

      const channel = await storage.getChannelWithMembers(channelId);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ message: "Failed to fetch channel" });
    }
  });

  // Message routes
  app.get("/api/channels/:channelId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { channelId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      // Check if user is a member
      const isMember = await storage.isChannelMember(channelId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this channel" });
      }

      const messages = await storage.getChannelMessages(channelId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/channels/:channelId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { channelId } = req.params;
      const { content, replyToId } = req.body;

      // Check if user is a member
      const isMember = await storage.isChannelMember(channelId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this channel" });
      }

      const message = await storage.createMessage({
        channelId,
        senderId: userId,
        content,
        replyToId,
      });

      // Broadcast to channel members via WebSocket
      broadcastToChannel(channelId, {
        type: "new_message",
        payload: message,
      });

      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Reaction routes
  app.post("/api/messages/:messageId/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId } = req.params;
      const { emoji } = req.body;

      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Check if user is a member of the channel
      const isMember = await storage.isChannelMember(message.channelId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Not a member of this channel" });
      }

      const reaction = await storage.addReaction({
        messageId,
        userId,
        emoji,
      });

      // Broadcast to channel members
      broadcastToChannel(message.channelId, {
        type: "message_reaction",
        payload: { messageId, emoji, userId, action: "add" },
      });

      res.json(reaction);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  app.delete("/api/messages/:messageId/reactions/:emoji", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { messageId, emoji } = req.params;

      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      await storage.removeReaction(messageId, userId, emoji);

      // Broadcast to channel members
      broadcastToChannel(message.channelId, {
        type: "message_reaction",
        payload: { messageId, emoji, userId, action: "remove" },
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  // Friend routes
  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  app.get("/api/friends/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getPendingFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { addresseeId } = req.body;

      if (userId === addresseeId) {
        return res.status(400).json({ message: "Cannot send friend request to yourself" });
      }

      // Check if friendship already exists
      const existing = await storage.getFriendship(userId, addresseeId);
      if (existing) {
        return res.status(400).json({ message: "Friend request already exists" });
      }

      const friendship = await storage.createFriendship({
        requesterId: userId,
        addresseeId,
        status: "pending",
      });

      res.json(friendship);
    } catch (error) {
      console.error("Error creating friend request:", error);
      res.status(500).json({ message: "Failed to create friend request" });
    }
  });

  app.patch("/api/friends/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const friendship = await storage.updateFriendshipStatus(id, status);
      if (!friendship) {
        return res.status(404).json({ message: "Friend request not found" });
      }

      res.json(friendship);
    } catch (error) {
      console.error("Error updating friend request:", error);
      res.status(500).json({ message: "Failed to update friend request" });
    }
  });

  app.delete("/api/friends/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFriendship(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting friendship:", error);
      res.status(500).json({ message: "Failed to delete friendship" });
    }
  });

  // WebSocket server with session-based authentication
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const sessionMiddleware = getSession();

  // Store userId in WebSocket connection for later access
  const wsUserMap = new Map<WebSocket, string>();

  wss.on("connection", async (ws, req: IncomingMessage) => {
    let userId: string | null = null;

    // Parse session from cookie to authenticate WebSocket connection
    const authenticateWebSocket = (): Promise<string | null> => {
      return new Promise((resolve) => {
        // Create a mock request/response for session middleware
        const mockReq = req as any;
        const mockRes = {
          end: () => {},
          setHeader: () => {},
          getHeader: () => null,
        } as any;
        
        sessionMiddleware(mockReq, mockRes, () => {
          const user = mockReq.session?.passport?.user;
          if (user?.claims?.sub) {
            resolve(user.claims.sub);
          } else {
            resolve(null);
          }
        });
      });
    };

    // Authenticate on connection
    const authenticatedUserId = await authenticateWebSocket();
    
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "auth":
            // Validate that the client-provided userId matches the session
            const clientUserId = message.payload.userId;
            
            // If we have a session-authenticated user, use that
            // Otherwise, verify the user exists in database as fallback
            if (authenticatedUserId) {
              if (clientUserId !== authenticatedUserId) {
                console.warn("WebSocket auth mismatch: client sent different userId than session");
                ws.close(4001, "Authentication mismatch");
                return;
              }
              userId = authenticatedUserId;
            } else {
              // Fallback: verify user exists in database
              const user = await storage.getUser(clientUserId);
              if (!user) {
                console.warn("WebSocket auth failed: user not found");
                ws.close(4002, "User not found");
                return;
              }
              userId = clientUserId;
            }

            if (userId) {
              clients.set(userId, ws);
              wsUserMap.set(ws, userId);

              // Load user's channels
              const channels = await storage.getUserChannels(userId);
              const channelIds = new Set(channels.map((c) => c.id));
              userChannels.set(userId, channelIds);

              // Send online users list
              const onlineUserIds = Array.from(clients.keys());
              ws.send(
                JSON.stringify({
                  type: "online_users",
                  payload: onlineUserIds,
                })
              );

              // Notify others that user is online
              broadcastToAll(
                { type: "user_online", payload: userId },
                userId
              );
            }
            break;

          case "typing_start":
            if (userId && message.payload.channelId) {
              const user = await storage.getUser(userId);
              broadcastToChannel(
                message.payload.channelId,
                {
                  type: "typing_start",
                  payload: {
                    userId,
                    channelId: message.payload.channelId,
                    firstName: user?.firstName,
                  },
                },
                userId
              );
            }
            break;

          case "typing_stop":
            if (userId && message.payload.channelId) {
              broadcastToChannel(
                message.payload.channelId,
                {
                  type: "typing_stop",
                  payload: {
                    userId,
                    channelId: message.payload.channelId,
                  },
                },
                userId
              );
            }
            break;

          case "send_message":
            if (userId && message.payload.channelId) {
              const { channelId, content, replyToId } = message.payload;

              const isMember = await storage.isChannelMember(channelId, userId);
              if (!isMember) break;

              const newMessage = await storage.createMessage({
                channelId,
                senderId: userId,
                content,
                replyToId,
              });

              broadcastToChannel(channelId, {
                type: "new_message",
                payload: newMessage,
              });
            }
            break;

          case "add_reaction":
            if (userId && message.payload.messageId) {
              const { messageId, emoji } = message.payload;
              const msg = await storage.getMessage(messageId);
              if (!msg) break;

              await storage.addReaction({ messageId, userId, emoji });

              broadcastToChannel(msg.channelId, {
                type: "message_reaction",
                payload: { messageId, emoji, userId, action: "add" },
              });
            }
            break;

          case "remove_reaction":
            if (userId && message.payload.messageId) {
              const { messageId, emoji } = message.payload;
              const msg = await storage.getMessage(messageId);
              if (!msg) break;

              await storage.removeReaction(messageId, userId, emoji);

              broadcastToChannel(msg.channelId, {
                type: "message_reaction",
                payload: { messageId, emoji, userId, action: "remove" },
              });
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      const closingUserId = wsUserMap.get(ws) || userId;
      if (closingUserId) {
        clients.delete(closingUserId);
        userChannels.delete(closingUserId);
        wsUserMap.delete(ws);

        // Notify others that user is offline
        broadcastToAll({ type: "user_offline", payload: closingUserId });
      }
    });
  });

  return httpServer;
}
