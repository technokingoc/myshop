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
  language: varchar("language", { length: 8 }).default("en"),
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
  language: varchar("language", { length: 8 }).default("en"),
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
  language: varchar("language", { length: 8 }).default("en"),
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
  
  // S62: Delivery confirmation fields
  deliveryConfirmed: boolean("delivery_confirmed").default(false),
  deliveryConfirmedAt: timestamp("delivery_confirmed_at", { withTimezone: true }),
  deliveryPhotos: text("delivery_photos").default(""), // JSON array of photo URLs
  deliveryRating: integer("delivery_rating"), // 1-5 rating of delivery experience
  sellerRating: integer("seller_rating"), // 1-5 rating of seller
  deliveredBy: varchar("delivered_by", { length: 256 }).default(""), // courier name/company
  deliveryLocation: varchar("delivery_location", { length: 256 }).default(""), // delivery location description
  deliveryNotes: text("delivery_notes").default(""), // customer delivery notes
  
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
  unhelpful: integer("unhelpful").default(0), // unhelpful votes from other customers
  verified: boolean("verified").default(false), // verified purchase
  status: varchar("status", { length: 32 }).default("published"), // published, pending, hidden
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Review vote tracking to prevent duplicate votes
export const reviewVotes = pgTable("review_votes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => customerReviews.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voteType: varchar("vote_type", { length: 16 }).notNull(), // 'helpful' or 'unhelpful'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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

// Subscription billing tables for S52
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 128 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 128 }),
  
  // Plan information
  plan: varchar("plan", { length: 32 }).notNull().default("free"), // 'free', 'pro', 'business'
  status: varchar("status", { length: 32 }).notNull().default("active"), // 'active', 'canceled', 'past_due', 'trialing', 'incomplete'
  
  // Billing details
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  
  // Trial information
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  
  // Grace period for failed payments
  gracePeriodStart: timestamp("grace_period_start", { withTimezone: true }),
  gracePeriodEnd: timestamp("grace_period_end", { withTimezone: true }),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    lastPaymentFailed?: boolean;
    lastPaymentFailedAt?: string;
    downgradeAt?: string;
    upgradeFrom?: string;
  }>().default({}),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Usage tracking for subscription limits
export const usageRecords = pgTable("usage_records", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
  
  // Usage period
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  
  // Usage metrics
  productsUsed: integer("products_used").default(0),
  ordersProcessed: integer("orders_processed").default(0),
  storageUsedMB: integer("storage_used_mb").default(0),
  
  // Limits for this period (captured from plan at time of creation)
  productsLimit: integer("products_limit").default(-1), // -1 = unlimited
  ordersLimit: integer("orders_limit").default(-1), // -1 = unlimited
  storageLimitMB: integer("storage_limit_mb").default(-1), // -1 = unlimited
  
  // Status
  limitExceeded: boolean("limit_exceeded").default(false),
  warningsSent: jsonb("warnings_sent").$type<string[]>().default([]), // ['products_80', 'orders_90']
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Monthly invoices with line items
export const subscriptionInvoices = pgTable("subscription_invoices", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 128 }).unique(),
  
  // Invoice details
  invoiceNumber: varchar("invoice_number", { length: 64 }).notNull().unique(),
  status: varchar("status", { length: 32 }).notNull().default("draft"), // 'draft', 'open', 'paid', 'void', 'uncollectible'
  
  // Amounts in cents
  subtotal: integer("subtotal").notNull().default(0),
  tax: integer("tax").default(0),
  total: integer("total").notNull().default(0),
  amountPaid: integer("amount_paid").default(0),
  amountRemaining: integer("amount_remaining").default(0),
  
  currency: varchar("currency", { length: 8 }).default("USD"),
  
  // Billing period
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  
  // Important dates
  invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  
  // PDF generation
  pdfGenerated: boolean("pdf_generated").default(false),
  pdfUrl: text("pdf_url").default(""),
  pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }),
  
  // Customer details (snapshot at time of invoice)
  customerDetails: jsonb("customer_details").$type<{
    name: string;
    email: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  }>().default({ name: "", email: "" }),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    stripeHostedInvoiceUrl?: string;
    stripeInvoicePdf?: string;
    paymentIntentId?: string;
  }>().default({}),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Invoice line items
export const subscriptionInvoiceItems = pgTable("subscription_invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => subscriptionInvoices.id, { onDelete: "cascade" }),
  stripeInvoiceItemId: varchar("stripe_invoice_item_id", { length: 128 }),
  
  // Line item details
  description: text("description").notNull(),
  quantity: integer("quantity").default(1),
  unitAmount: integer("unit_amount").notNull(), // in cents
  amount: integer("amount").notNull(), // quantity * unitAmount, in cents
  currency: varchar("currency", { length: 8 }).default("USD"),
  
  // Plan information for this line item
  plan: varchar("plan", { length: 32 }).default(""), // 'pro', 'business'
  pricingType: varchar("pricing_type", { length: 32 }).default("subscription"), // 'subscription', 'usage', 'one_time'
  
  // Usage details if applicable
  usageStart: timestamp("usage_start", { withTimezone: true }),
  usageEnd: timestamp("usage_end", { withTimezone: true }),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    planFeatures?: string[];
    overage?: { type: string; quantity: number; rate: number; };
  }>().default({}),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment methods for subscriptions
export const subscriptionPaymentMethods = pgTable("subscription_payment_methods", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 128 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 128 }).notNull(),
  
  // Card details
  type: varchar("type", { length: 32 }).notNull(), // 'card', 'bank_account', etc.
  brand: varchar("brand", { length: 32 }).default(""), // 'visa', 'mastercard', etc.
  last4: varchar("last4", { length: 4 }).default(""),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  
  // Status
  isDefault: boolean("is_default").default(false),
  status: varchar("status", { length: 32 }).default("active"), // 'active', 'inactive', 'expired'
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    fingerprint?: string;
    country?: string;
    funding?: string;
  }>().default({}),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Billing events log for audit trail
export const billingEvents = pgTable("billing_events", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
  
  // Event details
  eventType: varchar("event_type", { length: 64 }).notNull(), // 'subscription.created', 'payment.succeeded', etc.
  stripeEventId: varchar("stripe_event_id", { length: 128 }).unique(),
  
  // Event data
  eventData: jsonb("event_data").default({}),
  processedSuccessfully: boolean("processed_successfully").default(true),
  errorMessage: text("error_message").default(""),
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Plan change requests (for handling upgrades/downgrades)
export const planChangeRequests = pgTable("plan_change_requests", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
  
  // Change details
  fromPlan: varchar("from_plan", { length: 32 }).notNull(),
  toPlan: varchar("to_plan", { length: 32 }).notNull(),
  changeType: varchar("change_type", { length: 32 }).notNull(), // 'upgrade', 'downgrade'
  effectiveDate: timestamp("effective_date", { withTimezone: true }),
  
  // Request status
  status: varchar("status", { length: 32 }).notNull().default("pending"), // 'pending', 'completed', 'failed', 'cancelled'
  requestedBy: integer("requested_by").references(() => users.id),
  
  // Proration details
  prorationAmount: integer("proration_amount").default(0), // in cents
  prorationDescription: text("proration_description").default(""),
  
  // Stripe information
  stripeSubscriptionScheduleId: varchar("stripe_subscription_schedule_id", { length: 128 }),
  
  // Metadata
  metadata: jsonb("metadata").$type<{
    reason?: string;
    previousPlanFeatures?: string[];
    newPlanFeatures?: string[];
  }>().default({}),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Referral program tables
export const referralPrograms = pgTable("referral_programs", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  
  // Program settings
  isActive: boolean("is_active").default(true),
  name: varchar("name", { length: 256 }).default("Referral Program"),
  description: text("description").default(""),
  
  // Reward configuration
  referrerRewardType: varchar("referrer_reward_type", { length: 32 }).default("percentage"), // 'percentage', 'fixed'
  referrerRewardValue: numeric("referrer_reward_value", { precision: 8, scale: 2 }).default("10.00"),
  referredRewardType: varchar("referred_reward_type", { length: 32 }).default("percentage"), // 'percentage', 'fixed'
  referredRewardValue: numeric("referred_reward_value", { precision: 8, scale: 2 }).default("5.00"),
  
  // Program limits
  maxReferrals: integer("max_referrals").default(-1), // -1 = unlimited
  maxRewardAmount: numeric("max_reward_amount", { precision: 10, scale: 2 }).default("0"), // 0 = unlimited
  validityDays: integer("validity_days").default(30), // Days link is valid
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referralLinks = pgTable("referral_links", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull().references(() => referralPrograms.id, { onDelete: "cascade" }),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  
  // Link details
  code: varchar("code", { length: 64 }).notNull().unique(), // Unique referral code
  targetUrl: text("target_url"), // Specific product/page to refer to, null = store homepage
  
  // Usage tracking
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  totalRevenue: numeric("total_revenue", { precision: 12, scale: 2 }).default("0"),
  
  // Status
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referralTracking = pgTable("referral_tracking", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").notNull().references(() => referralLinks.id, { onDelete: "cascade" }),
  
  // Visitor tracking
  visitorId: varchar("visitor_id", { length: 128 }), // Browser fingerprint or session ID
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4/IPv6
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  
  // Action tracking
  action: varchar("action", { length: 32 }).notNull(), // 'click', 'conversion', 'purchase'
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  
  // Revenue tracking
  orderValue: numeric("order_value", { precision: 12, scale: 2 }).default("0"),
  rewardAmount: numeric("reward_amount", { precision: 10, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Email marketing campaigns (UI only, no actual sending)
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  
  // Campaign details
  name: varchar("name", { length: 256 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  content: text("content").notNull(),
  
  // Audience
  audienceType: varchar("audience_type", { length: 32 }).default("all"), // 'all', 'customers', 'subscribers'
  audienceFilter: jsonb("audience_filter").$type<{
    city?: string;
    country?: string;
    minPurchases?: number;
    tags?: string[];
  }>().default({}),
  
  // Scheduling
  status: varchar("status", { length: 32 }).default("draft"), // 'draft', 'scheduled', 'sent', 'cancelled'
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  
  // Mock statistics (since no actual sending)
  estimatedRecipients: integer("estimated_recipients").default(0),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Affiliate links table
export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  productId: integer("product_id").references(() => catalogItems.id, { onDelete: "cascade" }),
  
  // Link details
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").default(""),
  
  // Commission settings
  commissionType: varchar("commission_type", { length: 16 }).default("percentage"), // 'percentage' or 'fixed'
  commissionValue: numeric("commission_value", { precision: 8, scale: 2 }).default("10.00"),
  
  // Tracking
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  totalRevenue: numeric("total_revenue", { precision: 12, scale: 2 }).default("0"),
  totalCommission: numeric("total_commission", { precision: 12, scale: 2 }).default("0"),
  
  // Status
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Affiliate tracking table
export const affiliateTracking = pgTable("affiliate_tracking", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").notNull().references(() => affiliateLinks.id, { onDelete: "cascade" }),
  
  // Visitor tracking
  visitorId: varchar("visitor_id", { length: 128 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  
  // Action tracking
  action: varchar("action", { length: 32 }).notNull(), // 'click', 'conversion', 'purchase'
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => users.id, { onDelete: "set null" }),
  
  // Revenue tracking
  orderValue: numeric("order_value", { precision: 12, scale: 2 }).default("0"),
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Social share tracking table
export const socialShares = pgTable("social_shares", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  productId: integer("product_id").references(() => catalogItems.id, { onDelete: "set null" }), // NULL for store shares
  
  // Share details
  platform: varchar("platform", { length: 32 }).notNull(), // 'whatsapp', 'facebook', 'twitter', 'copy_link'
  sharedUrl: text("shared_url").notNull(),
  shareTitle: varchar("share_title", { length: 256 }).default(""),
  
  // Tracking
  visitorId: varchar("visitor_id", { length: 128 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  
  // Template details
  name: varchar("name", { length: 256 }).notNull(),
  subject: varchar("subject", { length: 256 }).notNull(),
  content: text("content").notNull(), // HTML content
  previewText: text("preview_text").default(""), // Email preview text
  
  // Template type
  templateType: varchar("template_type", { length: 32 }).default("custom"), // 'new_product', 'promotion', 'custom'
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Email subscribers table
export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  
  // Subscriber details
  email: varchar("email", { length: 256 }).notNull(),
  name: varchar("name", { length: 256 }).default(""),
  phone: varchar("phone", { length: 64 }).default(""),
  
  // Subscription settings
  status: varchar("status", { length: 32 }).default("subscribed"), // 'subscribed', 'unsubscribed', 'bounced'
  source: varchar("source", { length: 64 }).default("manual"), // 'manual', 'import', 'signup', 'purchase'
  
  // Segmentation
  city: varchar("city", { length: 256 }).default(""),
  country: varchar("country", { length: 64 }).default(""),
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // Customer relationship
  customerId: integer("customer_id").references(() => users.id, { onDelete: "set null" }),
  totalPurchases: integer("total_purchases").default(0),
  lastPurchaseDate: timestamp("last_purchase_date", { withTimezone: true }),
  
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// API Keys for S55 - REST API access
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  
  // Key details
  name: varchar("name", { length: 256 }).notNull(), // User-friendly name
  keyHash: varchar("key_hash", { length: 512 }).notNull(), // Hashed API key
  keyPrefix: varchar("key_prefix", { length: 16 }).notNull(), // First few chars for display (e.g., "mk_123456...")
  
  // Permissions
  permissions: jsonb("permissions").$type<string[]>().default([]), // ['products:read', 'products:write', 'orders:read', etc.]
  
  // Usage tracking
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  usageCount: integer("usage_count").default(0),
  rateLimitPerDay: integer("rate_limit_per_day").default(1000),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Metadata
  notes: text("notes").default(""),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }), // Optional expiration
});

// Webhooks for S55 - Order status change notifications
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").references(() => sellers.id, { onDelete: "cascade" }), // Legacy support
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  
  // Webhook details
  name: varchar("name", { length: 256 }).notNull(), // User-friendly name
  url: text("url").notNull(), // Webhook endpoint URL
  
  // Events
  events: jsonb("events").$type<string[]>().default([]), // ['order.created', 'order.paid', 'order.shipped', etc.]
  
  // Security
  secret: varchar("secret", { length: 128 }).notNull(), // Used for HMAC signature
  
  // Status and stats
  isActive: boolean("is_active").default(true),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  lastDeliveryAt: timestamp("last_delivery_at", { withTimezone: true }),
  lastDeliveryStatus: varchar("last_delivery_status", { length: 32 }).default("pending"),
  
  // Settings
  maxRetries: integer("max_retries").default(3),
  timeoutSeconds: integer("timeout_seconds").default(30),
  
  // Metadata
  notes: text("notes").default(""),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Webhook delivery log
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: serial("id").primaryKey(),
  webhookId: integer("webhook_id").notNull().references(() => webhooks.id, { onDelete: "cascade" }),
  
  // Event details
  eventType: varchar("event_type", { length: 64 }).notNull(),
  eventData: jsonb("event_data").default({}),
  
  // Delivery details
  url: text("url").notNull(),
  httpMethod: varchar("http_method", { length: 10 }).default("POST"),
  headers: jsonb("headers").default({}),
  body: text("body").notNull(),
  
  // Response details
  responseStatus: integer("response_status"),
  responseBody: text("response_body").default(""),
  responseHeaders: jsonb("response_headers").default({}),
  
  // Delivery status
  status: varchar("status", { length: 32 }).notNull(), // 'pending', 'success', 'failure', 'retry'
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  
  // Timing
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Chat/messaging system tables (S57)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Conversation metadata
  subject: varchar("subject", { length: 256 }).default(""), // Optional subject/topic
  status: varchar("status", { length: 32 }).default("active"), // 'active', 'archived', 'closed'
  
  // Last message info for quick access
  lastMessageId: integer("last_message_id"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  lastMessagePreview: varchar("last_message_preview", { length: 150 }).default(""),
  
  // Unread counts
  unreadByCustomer: integer("unread_by_customer").default(0),
  unreadBySeller: integer("unread_by_seller").default(0),
  
  // Related entities (optional)
  productId: integer("product_id").references(() => catalogItems.id, { onDelete: "set null" }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Message content
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 32 }).default("text"), // 'text', 'image', 'file', 'system'
  
  // File attachments (JSON array)
  attachments: jsonb("attachments").$type<Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>>().default([]),
  
  // Message metadata (JSON)
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  
  // Read receipts (simplified approach)
  readByCustomer: boolean("read_by_customer").default(false),
  readByCustomerAt: timestamp("read_by_customer_at", { withTimezone: true }),
  readBySeller: boolean("read_by_seller").default(false),
  readBySellerAt: timestamp("read_by_seller_at", { withTimezone: true }),
  
  // Soft delete
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: integer("deleted_by").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Typing indicators for real-time typing status
export const typingIndicators = pgTable("typing_indicators", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Typing state
  isTyping: boolean("is_typing").default(true),
  lastTypingAt: timestamp("last_typing_at", { withTimezone: true }).defaultNow().notNull(),
  
  // Auto-cleanup old indicators (handled by app logic)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// S58 Extensions - Message reports and blocking
export const messageReports = pgTable("message_reports", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  reporterId: integer("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportedUserId: integer("reported_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Report details
  reason: varchar("reason", { length: 32 }).notNull(), // 'spam', 'harassment', 'inappropriate', 'fraud', 'other'
  description: text("description").default(""),
  category: varchar("category", { length: 32 }).default("inappropriate"), // 'inappropriate', 'safety', 'fraud', 'spam'
  
  // Moderation status
  status: varchar("status", { length: 32 }).default("pending"), // 'pending', 'reviewed', 'resolved', 'dismissed'
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  moderatorNotes: text("moderator_notes").default(""),
  actionTaken: varchar("action_taken", { length: 64 }).default(""), // 'warning', 'temp_ban', 'permanent_ban', 'none'
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// User blocking system
export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedUserId: integer("blocked_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Block details
  reason: varchar("reason", { length: 32 }).default(""), // 'spam', 'harassment', 'inappropriate', 'other'
  notes: text("notes").default(""),
  
  // Block scope
  blockType: varchar("block_type", { length: 32 }).default("messages"), // 'messages', 'orders', 'all'
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Content filtering rules
export const contentFilters = pgTable("content_filters", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }), // null = global
  
  // Filter configuration
  name: varchar("name", { length: 256 }).notNull(),
  enabled: boolean("enabled").default(true),
  filterType: varchar("filter_type", { length: 32 }).notNull(), // 'phone', 'email', 'url', 'keyword', 'regex'
  
  // Filter patterns
  patterns: jsonb("patterns").$type<string[]>().default([]), // Array of patterns to match
  caseSensitive: boolean("case_sensitive").default(false),
  wholeWordsOnly: boolean("whole_words_only").default(false),
  
  // Actions
  action: varchar("action", { length: 32 }).default("flag"), // 'flag', 'block', 'replace', 'warn'
  replacement: text("replacement").default("[FILTERED]"), // Replacement text
  severity: varchar("severity", { length: 16 }).default("medium"), // 'low', 'medium', 'high'
  
  // Statistics
  matchCount: integer("match_count").default(0),
  lastMatch: timestamp("last_match", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Message filter matches (for audit trail)
export const messageFilterMatches = pgTable("message_filter_matches", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  filterId: integer("filter_id").notNull().references(() => contentFilters.id, { onDelete: "cascade" }),
  
  // Match details
  matchedText: text("matched_text").notNull(),
  filterPattern: text("filter_pattern").notNull(),
  actionTaken: varchar("action_taken", { length: 32 }).notNull(), // 'flagged', 'blocked', 'replaced', 'warned'
  
  // Context
  originalContent: text("original_content").default(""), // Store original if replaced
  position: integer("position").default(0), // Position in message where match occurred
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Message file uploads
export const messageFiles = pgTable("message_files", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // File details
  fileName: varchar("file_name", { length: 256 }).notNull(),
  fileType: varchar("file_type", { length: 64 }).notNull(), // MIME type
  fileSize: integer("file_size").notNull(), // Size in bytes
  fileUrl: text("file_url").notNull(), // Storage URL
  
  // File metadata
  width: integer("width"), // For images
  height: integer("height"), // For images
  duration: integer("duration"), // For videos/audio in seconds
  
  // Security
  virusScanned: boolean("virus_scanned").default(false),
  scanResult: varchar("scan_result", { length: 32 }).default("pending"), // 'clean', 'infected', 'error'
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Conversation moderation flags
export const conversationFlags = pgTable("conversation_flags", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  flaggedBy: integer("flagged_by").references(() => users.id), // null = auto-flagged
  
  // Flag details
  reason: varchar("reason", { length: 64 }).notNull(), // 'inappropriate', 'spam', 'suspicious_activity', 'policy_violation'
  description: text("description").default(""),
  severity: varchar("severity", { length: 16 }).default("medium"), // 'low', 'medium', 'high', 'critical'
  
  // Auto-flag metadata
  autoFlagged: boolean("auto_flagged").default(false),
  triggerRules: jsonb("trigger_rules").$type<string[]>().default([]), // Filter IDs that triggered flag
  
  // Moderation status
  status: varchar("status", { length: 32 }).default("pending"), // 'pending', 'reviewed', 'resolved', 'dismissed'
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  moderatorNotes: text("moderator_notes").default(""),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// S60: Seller responses to reviews
export const sellerResponses = pgTable("seller_responses", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => customerReviews.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Response content
  content: text("content").notNull(),
  
  // Moderation status
  status: varchar("status", { length: 32 }).default("published"), // 'published', 'pending', 'hidden'
  moderatedBy: integer("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  moderatorNotes: text("moderator_notes").default(""),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// S60: Review analytics and sentiment tracking
export const reviewAnalytics = pgTable("review_analytics", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Time period for analytics (daily aggregation)
  analyticsDate: timestamp("analytics_date", { withTimezone: true }).notNull(),
  
  // Review counts
  totalReviews: integer("total_reviews").default(0),
  newReviews: integer("new_reviews").default(0), // Reviews added on this date
  publishedReviews: integer("published_reviews").default(0),
  pendingReviews: integer("pending_reviews").default(0),
  
  // Rating distribution
  rating5Count: integer("rating_5_count").default(0),
  rating4Count: integer("rating_4_count").default(0),
  rating3Count: integer("rating_3_count").default(0),
  rating2Count: integer("rating_2_count").default(0),
  rating1Count: integer("rating_1_count").default(0),
  
  // Average ratings
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  previousAverageRating: numeric("previous_average_rating", { precision: 3, scale: 2 }).default("0.00"),
  
  // Sentiment analysis (basic keywords)
  positiveReviews: integer("positive_reviews").default(0), // Contains positive keywords
  negativeReviews: integer("negative_reviews").default(0), // Contains negative keywords
  neutralReviews: integer("neutral_reviews").default(0),
  
  // Response metrics
  responseRate: numeric("response_rate", { precision: 5, scale: 2 }).default("0.00"), // % of reviews responded to
  avgResponseTime: integer("avg_response_time_hours").default(0), // Average hours to respond
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// S60: Store rating aggregates
export const storeRatings = pgTable("store_ratings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: integer("store_id").references(() => stores.id, { onDelete: "cascade" }),
  
  // Overall metrics
  totalReviews: integer("total_reviews").default(0),
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }).default("0.00"),
  
  // Rating distribution
  rating5Count: integer("rating_5_count").default(0),
  rating4Count: integer("rating_4_count").default(0),
  rating3Count: integer("rating_3_count").default(0),
  rating2Count: integer("rating_2_count").default(0),
  rating1Count: integer("rating_1_count").default(0),
  
  // Quality metrics
  verifiedReviewsCount: integer("verified_reviews_count").default(0),
  withPhotosCount: integer("with_photos_count").default(0),
  responseRate: numeric("response_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  // Trend indicators (vs previous period)
  ratingTrend: varchar("rating_trend", { length: 16 }).default("stable"), // 'improving', 'declining', 'stable'
  trendPercentage: numeric("trend_percentage", { precision: 5, scale: 2 }).default("0.00"),
  
  // Last calculation
  lastCalculated: timestamp("last_calculated", { withTimezone: true }).defaultNow().notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// S60: Review request tracking for automated emails
export const reviewRequests = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Request details
  status: varchar("status", { length: 32 }).default("pending"), // 'pending', 'sent', 'responded', 'expired'
  delayDays: integer("delay_days").default(3), // Days to wait after delivery
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  
  // Email details
  customerEmail: varchar("customer_email", { length: 256 }).notNull(),
  customerName: varchar("customer_name", { length: 256 }).notNull(),
  
  // Order context for email
  orderItems: jsonb("order_items").$type<Array<{
    productId: number;
    productName: string;
    productImage?: string;
  }>>().default([]),
  
  // Tracking
  emailOpened: boolean("email_opened").default(false),
  emailClicked: boolean("email_clicked").default(false),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// S62: Delivery analytics table for admin dashboard
export const deliveryAnalytics = pgTable("delivery_analytics", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  analyticsDate: timestamp("analytics_date", { withTimezone: true }).notNull(),
  
  // Order counts by status
  totalOrders: integer("total_orders").default(0),
  confirmedOrders: integer("confirmed_orders").default(0),
  preparingOrders: integer("preparing_orders").default(0),
  shippedOrders: integer("shipped_orders").default(0),
  inTransitOrders: integer("in_transit_orders").default(0),
  deliveredOrders: integer("delivered_orders").default(0),
  cancelledOrders: integer("cancelled_orders").default(0),
  
  // Delivery metrics
  avgDeliveryTimeHours: integer("avg_delivery_time_hours").default(0), // Average from confirmed to delivered
  avgPreparationTimeHours: integer("avg_preparation_time_hours").default(0), // Average from confirmed to shipped
  avgShippingTimeHours: integer("avg_shipping_time_hours").default(0), // Average from shipped to delivered
  
  // Delivery confirmation metrics
  deliveryConfirmations: integer("delivery_confirmations").default(0),
  deliveryConfirmationRate: numeric("delivery_confirmation_rate", { precision: 5, scale: 2 }).default("0.00"),
  avgDeliveryRating: numeric("avg_delivery_rating", { precision: 3, scale: 2 }).default("0.00"),
  avgSellerRating: numeric("avg_seller_rating", { precision: 3, scale: 2 }).default("0.00"),
  
  // Issue tracking
  deliveryIssues: integer("delivery_issues").default(0),
  cancellationRate: numeric("cancellation_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// S62: Delivery status change log table for SMS/notifications
export const deliveryStatusChanges = pgTable("delivery_status_changes", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => users.id, { onDelete: "set null" }),
  
  // Status change details
  oldStatus: varchar("old_status", { length: 32 }),
  newStatus: varchar("new_status", { length: 32 }).notNull(),
  changedBy: integer("changed_by").references(() => users.id, { onDelete: "set null" }),
  changeReason: text("change_reason").default(""),
  
  // Notification tracking
  smsSent: boolean("sms_sent").default(false),
  smsSentAt: timestamp("sms_sent_at", { withTimezone: true }),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  pushSent: boolean("push_sent").default(false),
  pushSentAt: timestamp("push_sent_at", { withTimezone: true }),
  
  // Customer contact info at time of change
  customerPhone: varchar("customer_phone", { length: 64 }).default(""),
  customerEmail: varchar("customer_email", { length: 256 }).default(""),
  customerName: varchar("customer_name", { length: 256 }).default(""),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// S62: Delivery issue reports table
export const deliveryIssues = pgTable("delivery_issues", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => users.id, { onDelete: "cascade" }),
  
  // Issue details
  issueType: varchar("issue_type", { length: 64 }).notNull(), // 'damaged', 'wrong_item', 'not_delivered', 'late_delivery', 'other'
  description: text("description").notNull(),
  severity: varchar("severity", { length: 16 }).default("medium"), // 'low', 'medium', 'high', 'critical'
  
  // Resolution tracking
  status: varchar("status", { length: 32 }).default("open"), // 'open', 'investigating', 'resolved', 'closed'
  resolution: text("resolution").default(""),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  
  // Photo evidence
  photoUrls: text("photo_urls").default(""), // JSON array of photo URLs
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// S65: Bulk operations tracking
export const bulkJobs = pgTable("bulk_jobs", {
  id: varchar("id", { length: 128 }).primaryKey(), // UUID
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  jobType: varchar("job_type", { length: 64 }).notNull(), // "price_adjustment", "category_assignment", etc.
  status: varchar("status", { length: 32 }).notNull().default("pending"), // "pending", "running", "completed", "failed"
  progress: integer("progress").notNull().default(0), // percentage 0-100
  totalItems: integer("total_items").notNull().default(0),
  processedItems: integer("processed_items").notNull().default(0),
  failedItems: integer("failed_items").notNull().default(0),
  payload: jsonb("payload").default({}), // operation-specific data
  results: jsonb("results").default({}), // results and error details
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).default(sql`NOW() + INTERVAL \047 7 days\047`)
});

// S65: Price change history for undo functionality
export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 128 }).references(() => bulkJobs.id, { onDelete: "cascade" }),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => catalogItems.id, { onDelete: "cascade" }),
  oldPrice: numeric("old_price", { precision: 12, scale: 2 }).notNull(),
  newPrice: numeric("new_price", { precision: 12, scale: 2 }).notNull(),
  changeType: varchar("change_type", { length: 32 }).notNull(), // "percentage", "fixed", "set"
  changeAction: varchar("change_action", { length: 32 }).notNull(), // "increase", "decrease", "set"
  changeValue: varchar("change_value", { length: 32 }).notNull(), // the actual value used (e.g., "10" for 10%)
  canUndo: boolean("can_undo").notNull().default(true),
  undoneAt: timestamp("undone_at", { withTimezone: true }),
  undoneBy: integer("undone_by").references(() => sellers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// S65: Product tags for better organization
export const productTags = pgTable("product_tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  color: varchar("color", { length: 32 }).default("#3B82F6"), // hex color for UI
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  productCount: integer("product_count").default(0), // denormalized count for performance
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// S65: Many-to-many relationship between products and tags
export const productTagAssignments = pgTable("product_tag_assignments", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => catalogItems.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => productTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
