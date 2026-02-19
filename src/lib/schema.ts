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
  themeColor: varchar("theme_color", { length: 32 }).default("indigo"),
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
  themeColor: varchar("theme_color", { length: 32 }).default("indigo"),
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
  sellerId: integer("seller_id").notNull().references(() => stores.id, { onDelete: "cascade" }), // Now references stores
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
  sellerId: integer("seller_id").references(() => stores.id, { onDelete: "cascade" }), // Now references stores
  authorName: varchar("author_name", { length: 100 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }),
  content: text("content").notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => stores.id, { onDelete: "cascade" }), // Now references stores
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => stores.id, { onDelete: "cascade" }), // Now references stores
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

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => stores.id, { onDelete: "cascade" }), // Now references stores
  customerId: integer("customer_id").references(() => users.id, { onDelete: "cascade" }), // Now references users
  type: varchar("type", { length: 64 }).notNull().default("order_status"),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  read: boolean("read").default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});