"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Bell, 
  Package, 
  AlertTriangle, 
  Star, 
  Settings, 
  Filter, 
  CheckCircle, 
  Circle,
  Archive,
  Eye,
  EyeOff
} from "lucide-react";
import { fetchJsonWithRetry } from "@/lib/api-client";
import { NotificationPreferences } from "@/lib/notification-service";

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
  userId: number;
  sellerId?: number | null;
  lang: "en" | "pt";
};

export function NotificationCenter({ t, userId, sellerId, lang }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "orders" | "inventory" | "reviews">("all");
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!sellerId) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: "100" });
      
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

  // Fetch notification preferences
  const fetchPreferences = async () => {
    try {
      setPreferencesLoading(true);
      const data = await fetchJsonWithRetry<NotificationPreferences>(
        "/api/notifications/preferences",
        undefined,
        3,
        "preferences:fetch"
      );
      setPreferences(data);
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setPreferencesLoading(false);
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

  // Update preferences
  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    try {
      const data = await fetchJsonWithRetry<NotificationPreferences>(
        "/api/notifications/preferences",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPrefs),
        },
        3,
        "preferences:update"
      );
      setPreferences(data);
    } catch (error) {
      console.error("Failed to update preferences:", error);
    }
  };

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    switch (filter) {
      case "unread":
        filtered = notifications.filter(n => !n.read);
        break;
      case "orders":
        filtered = notifications.filter(n => 
          n.type.startsWith("order:") || n.orderId
        );
        break;
      case "inventory":
        filtered = notifications.filter(n => 
          n.type.startsWith("inventory:")
        );
        break;
      case "reviews":
        filtered = notifications.filter(n => 
          n.type.startsWith("review:")
        );
        break;
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications, filter]);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [sellerId]);

  const getNotificationIcon = (type: string) => {
    switch (true) {
      case type.startsWith("order:"):
        return <Package className="h-5 w-5 text-blue-500" />;
      case type.startsWith("inventory:"):
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case type.startsWith("review:"):
        return <Star className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getNotificationColor = (type: string, priority?: number) => {
    // High priority notifications get red accent
    if (priority === 3) {
      return "bg-red-50 border-red-200";
    }
    
    // Medium priority gets orange accent
    if (priority === 2) {
      return "bg-orange-50 border-orange-200";
    }
    
    // Regular priority based on type
    switch (true) {
      case type.startsWith("order:"):
        return "bg-blue-50 border-blue-200";
      case type.startsWith("inventory:"):
        return "bg-amber-50 border-amber-200";
      case type.startsWith("review:"):
        return "bg-green-50 border-green-200";
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

  if (!sellerId) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">{t.noAccess || "No access to notifications"}</p>
      </div>
    );
  }

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
              { key: "orders", label: t.orders || "Orders", count: notifications.filter(n => n.type.startsWith("order:")).length },
              { key: "inventory", label: t.inventory || "Inventory", count: notifications.filter(n => n.type.startsWith("inventory:")).length },
              { key: "reviews", label: t.reviews || "Reviews", count: notifications.filter(n => n.type.startsWith("review:")).length },
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
          
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            <Settings className="h-4 w-4" />
            {t.preferences || "Preferences"}
          </button>
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {t.notificationPreferences || "Notification Preferences"}
          </h3>
          
          {preferencesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
            </div>
          ) : preferences ? (
            <div className="space-y-6">
              {/* Email Notifications */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">
                  {t.emailNotifications || "Email Notifications"}
                </h4>
                <div className="space-y-3">
                  {[
                    { key: "orderUpdates", label: t.orderUpdates || "Order updates" },
                    { key: "inventoryAlerts", label: t.inventoryAlerts || "Inventory alerts" },
                    { key: "reviewAlerts", label: t.reviewAlerts || "Review alerts" },
                    { key: "promotionalEmails", label: t.promotionalEmails || "Promotional emails" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.email[key as keyof typeof preferences.email]}
                        onChange={(e) => updatePreferences({
                          email: {
                            ...preferences.email,
                            [key]: e.target.checked,
                          },
                        })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* In-App Notifications */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">
                  {t.inAppNotifications || "In-App Notifications"}
                </h4>
                <div className="space-y-3">
                  {[
                    { key: "orderUpdates", label: t.orderUpdates || "Order updates" },
                    { key: "inventoryAlerts", label: t.inventoryAlerts || "Inventory alerts" },
                    { key: "reviewAlerts", label: t.reviewAlerts || "Review alerts" },
                    { key: "systemUpdates", label: t.systemUpdates || "System updates" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.inApp[key as keyof typeof preferences.inApp]}
                        onChange={(e) => updatePreferences({
                          inApp: {
                            ...preferences.inApp,
                            [key]: e.target.checked,
                          },
                        })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email Frequency */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">
                  {t.emailFrequency || "Email Frequency"}
                </h4>
                <div className="space-y-3">
                  {[
                    { key: "instant", label: t.instant || "Instant" },
                    { key: "daily", label: t.daily || "Daily digest" },
                    { key: "weekly", label: t.weekly || "Weekly summary" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="radio"
                        name="emailFrequency"
                        value={key}
                        checked={preferences.emailFrequency === key}
                        onChange={() => updatePreferences({
                          emailFrequency: key as typeof preferences.emailFrequency,
                        })}
                        className="border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500">{t.failedToLoadPreferences || "Failed to load preferences"}</p>
            </div>
          )}
        </div>
      )}

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
              {t.notificationsWillAppear || "Your notifications will appear here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !notification.read ? getNotificationColor(notification.type, notification.priority) : ""
                }`}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead([notification.id]);
                  }
                  
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
                        {/* Priority indicator */}
                        {notification.priority === 3 && (
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                            HIGH
                          </span>
                        )}
                        {notification.priority === 2 && (
                          <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                            MEDIUM
                          </span>
                        )}
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