"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MessageNotificationsProps {
  user?: any;
  className?: string;
}

export function MessageNotifications({ user, className = "" }: MessageNotificationsProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      setupRealtimeConnection();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/messages?limit=1");
      if (response.ok) {
        const data = await response.json();
        const totalUnread = data.conversations?.reduce(
          (sum: number, conv: any) => sum + (conv.unreadCount || 0), 
          0
        ) || 0;
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const setupRealtimeConnection = () => {
    if (!user) return;

    const eventSource = new EventSource("/api/messages/stream");
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("new_message", (event) => {
      const data = JSON.parse(event.data);
      
      // Only count messages from others
      if (data.messages?.some((msg: any) => msg.senderId !== user.id)) {
        setUnreadCount(prev => prev + data.messages.length);
        setHasNewMessages(true);
        
        // Show browser notification if permission granted
        if (Notification.permission === "granted") {
          const latestMessage = data.messages[0];
          new Notification("New Message", {
            body: `${latestMessage.senderName}: ${latestMessage.content.substring(0, 100)}...`,
            icon: "/favicon.ico",
            tag: `message-${data.conversationId}`,
          });
        }
      }
    });

    eventSource.addEventListener("conversation_updated", (event) => {
      const data = JSON.parse(event.data);
      // Update unread count for specific conversation
      // This is a simplified implementation - in production you'd want to track per-conversation counts
    });

    eventSource.onerror = (error) => {
      console.error("Message notifications SSE error:", error);
    };
  };

  const handleClick = () => {
    // Reset the "new messages" indicator when user clicks
    setHasNewMessages(false);
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`} onClick={handleClick}>
      <MessageCircle className="w-6 h-6 text-gray-600" />
      
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className={`absolute -top-2 -right-2 px-1.5 py-0.5 text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center ${
            hasNewMessages ? "animate-pulse" : ""
          }`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
      
      {hasNewMessages && unreadCount === 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}
    </div>
  );
}

export default MessageNotifications;