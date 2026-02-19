"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Package, X, CheckCircle } from "lucide-react";
import { fetchJsonWithRetry } from "@/lib/api-client";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId?: number | null;
  read: boolean;
  metadata: Record<string, any>;
  actionUrl?: string;
  priority?: number;
  notificationChannel?: string;
  createdAt: string;
};

type Props = {
  t: Record<string, string>;
  sellerId?: number | null;
};

export function NotificationBell({ t, sellerId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async (unreadOnly = false) => {
    if (!sellerId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: "20" });
      if (unreadOnly) params.set("unread", "true");
      
      const data = await fetchJsonWithRetry<Notification[]>(
        `/api/notifications?${params.toString()}`,
        undefined,
        3,
        "notifications:fetch"
      );
      
      if (unreadOnly) {
        setUnreadCount(data.length);
      } else {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notifications as read
  const markAsRead = async (ids: number[]) => {
    if (!sellerId || ids.length === 0) return;
    
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
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - ids.length));
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchNotifications(true); // Get unread count
    const interval = setInterval(() => fetchNotifications(true), 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [sellerId]);

  // Load full notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_status":
      case "order:new":
      case "order:status":
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
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

  if (!sellerId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label={t.notifications || "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              {t.notifications || "Notifications"}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {t.markAllRead || "Mark all read"}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 mx-auto"></div>
                <p className="text-sm text-slate-500 mt-2">{t.loading || "Loading..."}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {t.noNotifications || "No notifications"}
                </p>
                <p className="text-xs text-slate-400">
                  {t.noNotificationsHint || "You'll see order updates and alerts here"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead([notification.id]);
                      }
                      
                      // Close dropdown
                      setIsOpen(false);
                      
                      // Handle action URL navigation
                      if (notification.actionUrl) {
                        if (notification.actionUrl.startsWith('http')) {
                          window.open(notification.actionUrl, '_blank');
                        } else {
                          window.location.href = notification.actionUrl;
                        }
                      } else if (notification.orderId) {
                        // Fallback to order link if no action URL
                        window.location.href = `/dashboard/orders?highlight=${notification.orderId}`;
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? "text-slate-900" : "text-slate-700"
                          }`}>
                            {notification.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex items-center gap-1">
                            <span className="text-xs text-slate-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <p className={`text-xs mt-1 ${
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 p-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/dashboard/notifications';
                }}
                className="w-full text-xs text-center text-slate-500 hover:text-slate-700 py-1"
              >
                {t.viewAllNotifications || "View all notifications"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}