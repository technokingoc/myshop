import { pgTable, serial, text, varchar, numeric, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";

// Unified users table (replaces both sellers and customers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 64 }).default(""),
  avatarUrl: text("avatar_url").default(""),
  city: varchar("city", { length: 256 }).default(""),
  country: varchar("country", { length: 64 }).default(""),
  role: varchar("role", { length: 32 }).default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Stores table (replaces seller business info, one store per user)
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").default(""),
  logoUrl: text("logo_url").default(""),
  bannerUrl: text("banner_url").default(""),
  businessType: varchar("business_type", { length: 128 }).default("Retail"),
  currency: varchar("currency", { length: 16 }).default("USD"),
  socialLinks: jsonb("social_links").$type<{
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  }>().default({}),
  plan: varchar("plan", { length: 32 }).default("free"),
  themeColor: varchar("theme_color", { length: 32 }).default("green"),
  storeTemplate: varchar("store_template", { length: 32 }).default("classic"),
  headerTemplate: varchar("header_template", { length: 32 }).default("compact"),
  businessHours: jsonb("business_hours").$type<Record<string, { open: string; close: string }>>().default({}),
  address: text("address").default(""),
  city: varchar("city", { length: 256 }).default(""),
  country: varchar("country", { length: 64 }).default(""),
  emailNotifications: boolean("email_notifications").default(true),
  verificationStatus: varchar("verification_status", { length: 32 }).default("pending"),
  verificationNotes: text("verification_notes").default(""),
  verificationRequestedAt: timestamp("verification_requested_at", { withTimezone: true }).defaultNow(),
  verificationReviewedAt: timestamp("verification_reviewed_at", { withTimezone: true }),
  verificationReviewedBy: integer("verification_reviewed_by"),
  businessDocuments: jsonb("business_documents").default([]),
  flaggedReason: text("flagged_reason").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Legacy tables for backward compatibility during migration (can be removed later)
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").default(""),
  ownerName: varchar("owner_name", { length: 256 }).default(""),
  businessType: varchar("business_type", { length: 128 }).default("Retail"),
  currency: varchar("currency", { length: 16 }).default("USD"),
  city: varchar("city", { length: 256 }).default(""),
  logoUrl: text("logo_url").default(""),
  bannerUrl: text("banner_url").default(""),
  socialLinks: jsonb("social_links").$type<{
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  }>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  email: varchar("email", { length: 256 }).unique(),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 32 }).default("seller"),
  plan: varchar("plan", { length: 32 }).default("free"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  emailNotifications: boolean("email_notifications").default(true),
  themeColor: varchar("theme_color", { length: 32 }).default("green"),
  businessHours: jsonb("business_hours").$type<Record<string, { open: string; close: string }>>().default({}),
  address: text("address").default(""),
  country: varchar("country", { length: 64 }).default(""),
  storeTemplate: varchar("store_template", { length: 32 }).default("classic"),
  headerTemplate: varchar("header_template", { length: 32 }).default("compact"),
  verificationStatus: varchar("verification_status", { length: 32 }).default("pending"),
  verificationNotes: text("verification_notes").default(""),
  verificationRequestedAt: timestamp("verification_requested_at", { withTimezone: true }).defaultNow(),
  verificationReviewedAt: timestamp("verification_reviewed_at", { withTimezone: true }),
  verificationReviewedBy: integer("verification_reviewed_by"),
  businessDocuments: jsonb("business_documents").default([]),
  flaggedReason: text("flagged_reason").default(""),
});

export const adminActivities = pgTable("admin_activities", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id"),
  action: varchar("action", { length: 128 }).notNull(),
  targetType: varchar("target_type", { length: 64 }).notNull(),
  targetId: integer("target_id").notNull(),
  oldValues: jsonb("old_values").default({}),
  newValues: jsonb("new_values").default({}),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: varchar("phone", { length: 64 }).default(""),
  address: text("address").default(""),
  city: varchar("city", { length: 256 }).default(""),
  country: varchar("country", { length: 64 }).default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const catalogItems = pgTable("catalog_items", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  type: varchar("type", { length: 32 }).notNull().default("Product"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 32 }).notNull().default("Draft"),
  imageUrl: text("image_url").default(""),
  imageUrls: text("image_urls").default(""),
  shortDescription: text("short_description").default(""),
  category: varchar("category", { length: 128 }).default(""),
  stockQuantity: integer("stock_quantity").default(-1),
  trackInventory: boolean("track_inventory").default(false),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }).default("0"),
  hasVariants: boolean("has_variants").default(false),
  moderationStatus: varchar("moderation_status", { length: 32 }).default("approved"),
  flaggedReason: text("flagged_reason").default(""),
  flaggedBy: integer("flagged_by"),
  flaggedAt: timestamp("flagged_at", { withTimezone: true }),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => catalogItems.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(), // e.g. "Large / Red / Cotton"
  sku: varchar("sku", { length: 128 }).default(""),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }).default("0"),
  stockQuantity: integer("stock_quantity").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  imageUrl: text("image_url").default(""),
  attributes: jsonb("attributes").$type<Record<string, string>>().default({}), // { size: "Large", color: "Red", material: "Cotton" }
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  catalogItemId: integer("catalog_item_id").references(() => catalogItems.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }),
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }),
  content: text("content").notNull(),
  rating: integer("rating"),
  moderationStatus: varchar("moderation_status", { length: 32 }).default("approved"),
  flaggedReason: text("flagged_reason").default(""),
  flaggedBy: integer("flagged_by"),
  flaggedAt: timestamp("flagged_at", { withTimezone: true }),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  itemId: integer("item_id"),
  customerName: varchar("customer_name", { length: 256 }).notNull(),
  customerContact: varchar("customer_contact", { length: 512 }).notNull(),
  message: text("message").default(""),
  status: varchar("status", { length: 32 }).notNull().default("placed"),
  notes: text("notes").default(""),
  statusHistory: jsonb("status_history").$type<Array<{ status: string; at: string; note?: string }>>().default([]),
  couponCode: varchar("coupon_code", { length: 64 }).default(""),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0"),
  customerId: integer("customer_id").references(() => users.id), // Now references users
  trackingToken: varchar("tracking_token", { length: 128 }).unique(),
  cancelReason: text("cancel_reason"),
  refundReason: text("refund_reason"),
  refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }),
  // Shipping fields
  shippingMethodId: integer("shipping_method_id").references(() => shippingMethods.id),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  shippingAddress: jsonb("shipping_address").$type<{
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  }>(),
  estimatedDelivery: timestamp("estimated_delivery"),
  trackingNumber: varchar("tracking_number", { length: 128 }).default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 64 }).notNull(),
  type: varchar("type", { length: 16 }).notNull().default("percentage"),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxUses: integer("max_uses").default(-1),
  usedCount: integer("used_count").default(0),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 128 }).notNull(),
  namePt: varchar("name_pt", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  icon: varchar("icon", { length: 64 }).default(""),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 128 }).notNull(),
  namePt: varchar("name_pt", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  country: varchar("country", { length: 64 }).default("Mozambique"),
  region: varchar("region", { length: 128 }).default(""),
  sortOrder: integer("sort_order").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Now references users
  catalogItemId: integer("catalog_item_id").notNull().references(() => catalogItems.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }).notNull().default("Home"), // e.g. "Home", "Work", "Other"
  fullName: varchar("full_name", { length: 256 }).notNull(),
  addressLine1: varchar("address_line1", { length: 256 }).notNull(),
  addressLine2: varchar("address_line2", { length: 256 }).default(""),
  city: varchar("city", { length: 256 }).notNull(),
  state: varchar("state", { length: 256 }).default(""),
  postalCode: varchar("postal_code", { length: 32 }).default(""),
  country: varchar("country", { length: 64 }).notNull().default("Mozambique"),
  phone: varchar("phone", { length: 64 }).default(""),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customerReviews = pgTable("customer_reviews", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  catalogItemId: integer("catalog_item_id").notNull().references(() => catalogItems.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 256 }).default(""),
  content: text("content").default(""),
  imageUrls: text("image_urls").default(""), // comma-separated URLs for photo reviews
  helpful: integer("helpful").default(0), // helpful votes from other customers
  verified: boolean("verified").default(false), // verified purchase
  status: varchar("status", { length: 32 }).default("published"), // published, pending, hidden
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => users.id, { onDelete: "cascade" }), // Now references users
  type: varchar("type", { length: 64 }).notNull().default("order_status"),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  read: boolean("read").default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  actionUrl: text("action_url").default(""),
  priority: integer("priority").default(1), // 1=low, 2=medium, 3=high
  notificationChannel: varchar("notification_channel", { length: 32 }).default("in_app"), // 'in_app', 'email', 'both'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userType: varchar("user_type", { length: 32 }).notNull().default("seller"), // 'seller' or 'customer'
  
  // Email preferences
  emailOrderUpdates: boolean("email_order_updates").default(true),
  emailInventoryAlerts: boolean("email_inventory_alerts").default(true),
  emailReviewAlerts: boolean("email_review_alerts").default(true),
  emailPromotionalEmails: boolean("email_promotional_emails").default(false),
  emailSystemUpdates: boolean("email_system_updates").default(true),
  
  // In-app preferences
  inAppOrderUpdates: boolean("inapp_order_updates").default(true),
  inAppInventoryAlerts: boolean("inapp_inventory_alerts").default(true),
  inAppReviewAlerts: boolean("inapp_review_alerts").default(true),
  inAppSystemUpdates: boolean("inapp_system_updates").default(true),
  
  // Email frequency
  emailFrequency: varchar("email_frequency", { length: 32 }).default("instant"), // 'instant', 'daily', 'weekly'
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").default(""),
  type: varchar("type", { length: 32 }).notNull().default("banner"), // 'banner', 'flash_sale', 'discount'
  bannerImageUrl: text("banner_image_url").default(""),
  backgroundColor: varchar("background_color", { length: 16 }).default("#3b82f6"), // hex color
  textColor: varchar("text_color", { length: 16 }).default("#ffffff"), // hex color
  linkUrl: text("link_url").default(""), // optional link when banner is clicked
  priority: integer("priority").default(0), // higher number = higher priority
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const flashSales = pgTable("flash_sales", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").default(""),
  discountType: varchar("discount_type", { length: 16 }).notNull().default("percentage"), // 'percentage' or 'fixed'
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxDiscount: numeric("max_discount", { precision: 10, scale: 2 }).default("0"), // for percentage discounts
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxUses: integer("max_uses").default(-1), // -1 = unlimited
  usedCount: integer("used_count").default(0),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  products: text("products").default(""), // comma-separated product IDs, empty = all products
  bannerText: varchar("banner_text", { length: 512 }).default(""),
  bannerColor: varchar("banner_color", { length: 16 }).default("#ef4444"), // red by default
  showCountdown: boolean("show_countdown").default(true),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shippingZones = pgTable("shipping_zones", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  regions: jsonb("regions").$type<string[]>().default([]), // array of city/region names or location IDs
  countries: jsonb("countries").$type<string[]>().default([]), // array of country codes or names
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const shippingMethods = pgTable("shipping_methods", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  zoneId: integer("zone_id").notNull().references(() => shippingZones.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  type: varchar("type", { length: 32 }).notNull().default("flat_rate"), // 'flat_rate', 'weight_based', 'free', 'pickup'
  rate: numeric("rate", { precision: 10, scale: 2 }).default("0"), // base rate for flat_rate, rate per kg for weight_based
  freeShippingMinOrder: numeric("free_shipping_min_order", { precision: 10, scale: 2 }).default("0"), // minimum order for free shipping
  estimatedDays: integer("estimated_days").default(3), // estimated delivery days
  maxWeight: numeric("max_weight", { precision: 8, scale: 2 }).default("0"), // maximum weight for this method (0 = no limit)
  pickupAddress: text("pickup_address").default(""), // for pickup methods
  pickupInstructions: text("pickup_instructions").default(""), // for pickup methods
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Stock history tracking for inventory management
export const stockHistory = pgTable("stock_history", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => catalogItems.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  warehouseId: integer("warehouse_id"), // for future multi-warehouse support
  
  // Stock change details
  changeType: varchar("change_type", { length: 32 }).notNull(), // 'adjustment', 'sale', 'restock', 'return', 'damage', 'transfer'
  quantityBefore: integer("quantity_before").notNull(),
  quantityChange: integer("quantity_change").notNull(), // positive for increase, negative for decrease
  quantityAfter: integer("quantity_after").notNull(),
  
  // Reference data
  orderId: integer("order_id").references(() => orders.id), // if related to a sale/return
  reason: text("reason").default(""), // manual adjustment reason
  notes: text("notes").default(""), // additional context
  
  // Metadata
  batchNumber: varchar("batch_number", { length: 128 }).default(""), // for batch tracking
  expirationDate: timestamp("expiration_date"), // for perishable items
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).default("0"), // cost basis for this stock
  
  // Audit trail
  createdBy: integer("created_by").references(() => users.id), // user who made the change
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Restock reminders and alerts
export const restockReminders = pgTable("restock_reminders", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => catalogItems.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  warehouseId: integer("warehouse_id"), // for future multi-warehouse support
  
  // Reminder settings
  triggerQuantity: integer("trigger_quantity").notNull(), // stock level that triggers reminder
  targetQuantity: integer("target_quantity").notNull(), // suggested reorder quantity
  leadTimeDays: integer("lead_time_days").default(7), // days between order and delivery
  
  // Supplier information
  supplierName: varchar("supplier_name", { length: 256 }).default(""),
  supplierEmail: varchar("supplier_email", { length: 256 }).default(""),
  supplierPhone: varchar("supplier_phone", { length: 64 }).default(""),
  lastOrderDate: timestamp("last_order_date"),
  averageLeadTime: integer("average_lead_time").default(7), // historical average in days
  
  // Status tracking
  status: varchar("status", { length: 32 }).default("active"), // 'active', 'snoozed', 'disabled'
  lastTriggered: timestamp("last_triggered"),
  snoozeUntil: timestamp("snooze_until"),
  
  // Settings
  emailNotifications: boolean("email_notifications").default(true),
  autoReorderEnabled: boolean("auto_reorder_enabled").default(false), // for future automation
  minOrderQuantity: integer("min_order_quantity").default(1),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Warehouses (foundation for future multi-warehouse support)
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(), // short identifier
  
  // Location
  address: text("address").default(""),
  city: varchar("city", { length: 256 }).default(""),
  state: varchar("state", { length: 256 }).default(""),
  country: varchar("country", { length: 64 }).default("Mozambique"),
  postalCode: varchar("postal_code", { length: 32 }).default(""),
  
  // Settings
  isDefault: boolean("is_default").default(false), // primary warehouse
  isActive: boolean("is_active").default(true),
  allowSales: boolean("allow_sales").default(true), // can fulfill orders
  allowTransfers: boolean("allow_transfers").default(true), // can send/receive transfers
  
  // Contact
  contactPerson: varchar("contact_person", { length: 256 }).default(""),
  contactEmail: varchar("contact_email", { length: 256 }).default(""),
  contactPhone: varchar("contact_phone", { length: 64 }).default(""),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment system tables
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => users.id, { onDelete: "set null" }),
  
  // Payment details
  method: varchar("method", { length: 32 }).notNull(), // 'mpesa', 'bank_transfer', 'cash_on_delivery'
  provider: varchar("provider", { length: 64 }).default(""), // 'vodacom', 'movitel', etc.
  status: varchar("status", { length: 32 }).notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  
  // Amounts
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  fees: numeric("fees", { precision: 10, scale: 2 }).default("0"), // transaction fees
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(), // amount - fees
  currency: varchar("currency", { length: 8 }).default("MZN"),
  
  // External references
  externalId: varchar("external_id", { length: 128 }).unique(), // payment provider transaction ID
  externalReference: varchar("external_reference", { length: 256 }).default(""), // external reference number
  confirmationCode: varchar("confirmation_code", { length: 64 }).default(""), // M-Pesa confirmation code
  
  // Payment details
  payerPhone: varchar("payer_phone", { length: 32 }).default(""), // for mobile money
  payerName: varchar("payer_name", { length: 256 }).default(""),
  payerEmail: varchar("payer_email", { length: 256 }).default(""),
  
  // Settlement tracking
  settled: boolean("settled").default(false),
  settledAt: timestamp("settled_at"),
  settledAmount: numeric("settled_amount", { precision: 12, scale: 2 }).default("0"),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    bankDetails?: { bank: string; account: string; };
    mobileDetails?: { network: string; phone: string; };
    webhookData?: Record<string, any>;
  }>().default({}),
  
  // Timestamps
  initiatedAt: timestamp("initiated_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment status history for tracking
export const paymentStatusHistory = pgTable("payment_status_history", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).notNull(),
  previousStatus: varchar("previous_status", { length: 32 }).default(""),
  reason: text("reason").default(""), // reason for status change
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdBy: varchar("created_by", { length: 64 }).default("system"), // 'system', 'webhook', 'admin', user_id
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment instructions for different methods (bank transfers, etc.)
export const paymentInstructions = pgTable("payment_instructions", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  method: varchar("method", { length: 32 }).notNull(), // 'bank_transfer', 'mpesa', etc.
  
  // Bank transfer details
  bankName: varchar("bank_name", { length: 256 }).default(""),
  accountNumber: varchar("account_number", { length: 64 }).default(""),
  accountName: varchar("account_name", { length: 256 }).default(""),
  swiftCode: varchar("swift_code", { length: 32 }).default(""),
  iban: varchar("iban", { length: 64 }).default(""),
  
  // Mobile money details
  mobileNumber: varchar("mobile_number", { length: 32 }).default(""),
  networkProvider: varchar("network_provider", { length: 64 }).default(""), // Vodacom, Movitel
  
  // Instructions text
  instructionsEn: text("instructions_en").default(""),
  instructionsPt: text("instructions_pt").default(""),
  
  // Settings
  active: boolean("active").default(true),
  sortOrder: integer("sort_order").default(0),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Settlement records for revenue tracking
export const settlements = pgTable("settlements", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  
  // Settlement period
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  
  // Amounts
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(), // total payment amount
  platformFees: numeric("platform_fees", { precision: 10, scale: 2 }).default("0"), // MyShop platform fees
  paymentFees: numeric("payment_fees", { precision: 10, scale: 2 }).default("0"), // M-Pesa/payment provider fees
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(), // amount paid to seller
  
  // Payment details
  paymentMethod: varchar("payment_method", { length: 32 }).default(""), // how settlement is paid to seller
  paymentReference: varchar("payment_reference", { length: 256 }).default(""), // bank reference, etc.
  
  // Status
  status: varchar("status", { length: 32 }).notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  paymentIds: text("payment_ids").default(""), // comma-separated payment IDs included in settlement
  
  // Metadata
  notes: text("notes").default(""),
  metadata: jsonb("metadata").$type<{
    bankDetails?: { bank: string; account: string; };
    paymentBreakdown?: Array<{ paymentId: number; amount: number; fees: number; }>;
  }>().default({}),
  
  // Timestamps
  processedAt: timestamp("processed_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Duplicate table definition removed - using the first payments table definition above

// Payment methods configuration per store
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  
  // Method configuration
  method: varchar("method", { length: 32 }).notNull(), // 'mpesa', 'bank_transfer'
  enabled: boolean("enabled").default(true),
  
  // Bank transfer configuration
  bankName: varchar("bank_name", { length: 256 }).default(""),
  bankAccount: varchar("bank_account", { length: 128 }).default(""),
  bankAccountName: varchar("bank_account_name", { length: 256 }).default(""),
  bankSwiftCode: varchar("bank_swift_code", { length: 32 }).default(""),
  bankBranch: varchar("bank_branch", { length: 256 }).default(""),
  bankInstructions: text("bank_instructions").default(""),
  
  // M-Pesa configuration
  mpesaBusinessNumber: varchar("mpesa_business_number", { length: 64 }).default(""),
  mpesaBusinessName: varchar("mpesa_business_name", { length: 256 }).default(""),
  mpesaApiKey: varchar("mpesa_api_key", { length: 512 }).default(""), // encrypted
  mpesaApiSecret: varchar("mpesa_api_secret", { length: 512 }).default(""), // encrypted
  mpesaEnvironment: varchar("mpesa_environment", { length: 16 }).default("sandbox"), // 'sandbox' or 'production'
  
  // Display settings
  displayName: varchar("display_name", { length: 256 }).default(""),
  instructions: text("instructions").default(""),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment receipts/invoices
export const paymentReceipts = pgTable("payment_receipts", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  
  // Receipt details
  receiptNumber: varchar("receipt_number", { length: 128 }).notNull().unique(),
  receiptDate: timestamp("receipt_date").notNull(),
  
  // Customer details
  customerName: varchar("customer_name", { length: 256 }).notNull(),
  customerEmail: varchar("customer_email", { length: 256 }).default(""),
  customerPhone: varchar("customer_phone", { length: 64 }).default(""),
  
  // Payment details for receipt
  paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
  paymentAmount: numeric("payment_amount", { precision: 12, scale: 2 }).notNull(),
  paymentReference: varchar("payment_reference", { length: 128 }).notNull(),
  
  // Order summary for receipt
  orderItems: jsonb("order_items").$type<Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>>().default([]),
  orderSubtotal: numeric("order_subtotal", { precision: 12, scale: 2 }).notNull(),
  orderDiscount: numeric("order_discount", { precision: 12, scale: 2 }).default("0"),
  orderShipping: numeric("order_shipping", { precision: 12, scale: 2 }).default("0"),
  orderTotal: numeric("order_total", { precision: 12, scale: 2 }).notNull(),
  
  // Store details at time of receipt
  storeName: varchar("store_name", { length: 256 }).notNull(),
  storeAddress: text("store_address").default(""),
  storePhone: varchar("store_phone", { length: 64 }).default(""),
  storeEmail: varchar("store_email", { length: 256 }).default(""),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Revenue tracking
export const revenues = pgTable("revenues", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  paymentId: integer("payment_id").notNull().references(() => payments.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  
  // Revenue details
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(), // full payment amount
  platformFeeRate: numeric("platform_fee_rate", { precision: 8, scale: 4 }).default("0"), // percentage
  platformFeeAmount: numeric("platform_fee_amount", { precision: 12, scale: 2 }).default("0"),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(), // amount after fees
  currency: varchar("currency", { length: 8 }).notNull().default("MZN"),
  
  // Settlement details
  settlementStatus: varchar("settlement_status", { length: 32 }).default("pending"), // 'pending', 'settled', 'held'
  settlementDate: timestamp("settlement_date"),
  settlementReference: varchar("settlement_reference", { length: 128 }).default(""),
  settlementNotes: text("settlement_notes").default(""),
  
  // Dates
  revenueDate: timestamp("revenue_date").notNull(), // when payment was confirmed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Note: using the first settlements table definition above