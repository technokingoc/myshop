"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  Package, 
  CheckCircle, 
  Circle,
  Eye,
  EyeOff
} from "lucide-react";
import { fetchJsonWithRetry } from "@/lib/api-client";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId?: number | null;
  read: boolean;
  metadata: Record<string, any>;
  createdAt: string;
};

type Props = {
  t: Record<string, string>;
  customerId: number;
  lang: "en" | "pt";
};

export function CustomerNotificationCenter({ t, customerId, lang }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ 
        limit: "100",
        customer: "true" // Flag to get customer notifications
      });
      
      const data = await fetchJsonWithRetry<Notification[]>(
        `/api/notifications?${params.toString()}`,
        undefined,
        3,
        "notifications:fetch"
      );
      
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications as read
  const markAsRead = async (ids: number[]) => {
    if (ids.length === 0) return;
    
    try {
      await fetchJsonWithRetry(
        "/api/notifications",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, read: true }),
        },
        3,
        "notifications:mark-read"
      );
      
      setNotifications(prev => 
        prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = filteredNotifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter === "unread") {
      filtered = notifications.filter(n => !n.read);
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [customerId]);

  const getNotificationIcon = (type: string) => {
    switch (true) {
      case type.startsWith("order:"):
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (true) {
      case type.startsWith("order:"):
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t.justNow || "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Filter Buttons */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            {[
              { key: "all", label: t.all || "All", count: notifications.length },
              { key: "unread", label: t.unread || "Unread", count: unreadCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === key 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {label} {count > 0 && <span className="text-xs">({count})</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {filteredUnreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <CheckCircle className="h-4 w-4" />
              {t.markAllRead || "Mark all read"}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200 rounded-lg">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500 mb-1">
              {filter === "unread" 
                ? (t.noUnreadNotifications || "No unread notifications")
                : (t.noNotifications || "No notifications")
              }
            </p>
            <p className="text-sm text-slate-400">
              {t.orderUpdatesWillAppear || "Order updates and important information will appear here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !notification.read ? getNotificationColor(notification.type) : ""
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead([notification.id]);
                  }
                }}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          !notification.read ? "text-slate-900" : "text-slate-700"
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm mt-1 ${
                          !notification.read ? "text-slate-700" : "text-slate-500"
                        }`}>
                          {notification.message}
                        </p>
                        {notification.orderId && (
                          <span className="inline-block mt-1 text-xs text-blue-600 font-medium">
                            ORD-{notification.orderId}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {!notification.read ? (
                          <Circle className="h-2 w-2 fill-blue-500 text-blue-500" />
                        ) : (
                          <Circle className="h-2 w-2 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}