import { pgTable, serial, text, varchar, numeric, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { orders, users } from "./schema";

// Delivery confirmations - for buyer confirmation with optional photo proof
export const deliveryConfirmations = pgTable("delivery_confirmations", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Confirmation details
  confirmed: boolean("confirmed").default(false),
  confirmationDate: timestamp("confirmation_date", { withTimezone: true }),
  
  // Photo proof (optional)
  photoUrls: jsonb("photo_urls").$type<string[]>().default([]), // Array of photo URLs
  notes: text("notes").default(""), // Customer notes about delivery
  
  // Delivery details
  deliveredBy: varchar("delivered_by", { length: 256 }).default(""), // Delivery person/company
  deliveryLocation: text("delivery_location").default(""), // Where it was delivered (e.g., "Left at door", "Handed to customer")
  
  // Ratings (optional)
  deliveryRating: integer("delivery_rating"), // 1-5 stars for delivery experience
  sellerRating: integer("seller_rating"), // 1-5 stars for seller
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Enhanced order tracking - detailed status updates and estimated delivery calculations
export const orderTracking = pgTable("order_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  
  // Enhanced tracking info
  trackingProvider: varchar("tracking_provider", { length: 64 }).default(""), // DHL, PostNL, etc.
  trackingUrl: text("tracking_url").default(""), // Full tracking URL
  
  // Estimated delivery calculation
  estimatedDeliveryStart: timestamp("estimated_delivery_start", { withTimezone: true }),
  estimatedDeliveryEnd: timestamp("estimated_delivery_end", { withTimezone: true }),
  actualDeliveryDate: timestamp("actual_delivery_date", { withTimezone: true }),
  
  // Delivery zone info (from S61)
  shippingZoneId: integer("shipping_zone_id"), // Reference to shipping zones
  estimatedDays: integer("estimated_days").default(3), // Business days estimate
  
  // Tracking events (external API integration ready)
  lastTrackingCheck: timestamp("last_tracking_check", { withTimezone: true }),
  trackingEvents: jsonb("tracking_events").$type<Array<{
    status: string;
    description: string;
    location?: string;
    timestamp: string;
  }>>().default([]),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Delivery analytics - for admin dashboard
export const deliveryAnalytics = pgTable("delivery_analytics", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Time period for analytics (daily aggregation)
  analyticsDate: timestamp("analytics_date", { withTimezone: true }).notNull(),
  
  // Delivery performance metrics
  totalOrders: integer("total_orders").default(0),
  ordersShipped: integer("orders_shipped").default(0),
  ordersDelivered: integer("orders_delivered").default(0),
  ordersInTransit: integer("orders_in_transit").default(0),
  deliveryIssues: integer("delivery_issues").default(0), // Cancelled, returned, damaged
  
  // Timing metrics (in hours)
  avgProcessingTime: numeric("avg_processing_time", { precision: 8, scale: 2 }).default("0"), // Hours from confirmed to shipped
  avgShippingTime: numeric("avg_shipping_time", { precision: 8, scale: 2 }).default("0"), // Hours from shipped to delivered
  avgTotalDeliveryTime: numeric("avg_total_delivery_time", { precision: 8, scale: 2 }).default("0"), // Hours from confirmed to delivered
  
  // On-time delivery
  onTimeDeliveries: integer("on_time_deliveries").default(0), // Delivered within estimated window
  lateDeliveries: integer("late_deliveries").default(0),
  onTimeDeliveryRate: numeric("on_time_delivery_rate", { precision: 5, scale: 2 }).default("0.00"), // Percentage
  
  // Customer satisfaction
  deliveryRatingsCount: integer("delivery_ratings_count").default(0),
  avgDeliveryRating: numeric("avg_delivery_rating", { precision: 3, scale: 2 }).default("0.00"),
  confirmationRate: numeric("confirmation_rate", { precision: 5, scale: 2 }).default("0.00"), // % of deliveries confirmed by customers
  
  // Geographic data
  topDeliveryZones: jsonb("top_delivery_zones").$type<Array<{
    zoneName: string;
    orderCount: number;
    avgDeliveryTime: number;
  }>>().default([]),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Notification templates and tracking
export const deliveryNotifications = pgTable("delivery_notifications", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Notification details
  notificationType: varchar("notification_type", { length: 64 }).notNull(), // 'status_change', 'tracking_update', 'delivery_request'
  status: varchar("status", { length: 32 }).notNull(), // The status that triggered this notification
  
  // Channel configuration
  channels: jsonb("channels").$type<Array<'email' | 'sms' | 'whatsapp' | 'push'>>().default(['email']),
  
  // Delivery status
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  
  // Content (can be templated)
  subject: varchar("subject", { length: 256 }).notNull(),
  message: text("message").notNull(),
  
  // Tracking
  opened: boolean("opened").default(false),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clicked: boolean("clicked").default(false),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  
  // Error handling
  deliveryAttempts: integer("delivery_attempts").default(0),
  lastError: text("last_error").default(""),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});