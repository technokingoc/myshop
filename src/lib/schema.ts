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
  warehouseId: integer("warehouse_id").default(null), // for future multi-warehouse support
  
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
  warehouseId: integer("warehouse_id").default(null), // for future multi-warehouse support
  
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