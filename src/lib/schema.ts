import { pgTable, serial, text, varchar, numeric, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";

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
  status: varchar("status", { length: 32 }).notNull().default("new"),
  notes: text("notes").default(""),
  statusHistory: jsonb("status_history").$type<Array<{ status: string; at: string; note?: string }>>().default([]),
  customerId: integer("customer_id").references(() => customers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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

export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  catalogItemId: integer("catalog_item_id").notNull().references(() => catalogItems.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});
