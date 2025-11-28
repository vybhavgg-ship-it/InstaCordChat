import { useEffect, useRef, useState, useCallback } from "react";
import type { MessageWithSender, User } from "@shared/schema";

type WebSocketMessage = {
  type: string;
  payload: any;
};

type TypingUser = {
  id: string;
  firstName: string | null;
  channelId: string;
};

export function useWebSocket(userId?: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser[]>>(new Map());
  const [newMessage, setNewMessage] = useState<MessageWithSender | null>(null);
  const [messageReaction, setMessageReaction] = useState<{messageId: string; emoji: string; userId: string; action: 'add' | 'remove'} | null>(null);

  const connect = useCallback(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setIsConnected(true);
      socket.send(JSON.stringify({ type: "auth", payload: { userId } }));
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case "online_users":
            setOnlineUsers(new Set(message.payload));
            break;
          case "user_online":
            setOnlineUsers((prev) => new Set([...prev, message.payload]));
            break;
          case "user_offline":
            setOnlineUsers((prev) => {
              const next = new Set(prev);
              next.delete(message.payload);
              return next;
            });
            break;
          case "typing_start":
            setTypingUsers((prev) => {
              const next = new Map(prev);
              const channelTyping = next.get(message.payload.channelId) || [];
              if (!channelTyping.find(u => u.id === message.payload.userId)) {
                next.set(message.payload.channelId, [...channelTyping, {
                  id: message.payload.userId,
                  firstName: message.payload.firstName,
                  channelId: message.payload.channelId,
                }]);
              }
              return next;
            });
            break;
          case "typing_stop":
            setTypingUsers((prev) => {
              const next = new Map(prev);
              const channelTyping = next.get(message.payload.channelId) || [];
              next.set(message.payload.channelId, channelTyping.filter(u => u.id !== message.payload.userId));
              return next;
            });
            break;
          case "new_message":
            setNewMessage(message.payload);
            break;
          case "message_reaction":
            setMessageReaction(message.payload);
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      setTimeout(() => connect(), 3000);
    };

    socket.onerror = () => {
      socket.close();
    };

    socketRef.current = socket;

    return () => {
      socket.close();
    };
  }, [userId]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const startTyping = useCallback((channelId: string) => {
    sendMessage("typing_start", { channelId });
  }, [sendMessage]);

  const stopTyping = useCallback((channelId: string) => {
    sendMessage("typing_stop", { channelId });
  }, [sendMessage]);

  const sendChatMessage = useCallback((channelId: string, content: string, replyToId?: string) => {
    sendMessage("send_message", { channelId, content, replyToId });
  }, [sendMessage]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    sendMessage("add_reaction", { messageId, emoji });
  }, [sendMessage]);

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    sendMessage("remove_reaction", { messageId, emoji });
  }, [sendMessage]);

  const clearNewMessage = useCallback(() => {
    setNewMessage(null);
  }, []);

  const clearMessageReaction = useCallback(() => {
    setMessageReaction(null);
  }, []);

  return {
    isConnected,
    onlineUsers,
    typingUsers,
    newMessage,
    messageReaction,
    startTyping,
    stopTyping,
    sendChatMessage,
    addReaction,
    removeReaction,
    clearNewMessage,
    clearMessageReaction,
  };
}
