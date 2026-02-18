import { pgTable, serial, text, varchar, numeric, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

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
  socialLinks: jsonb("social_links").$type<{
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
  }>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  email: varchar("email", { length: 256 }).unique(),
  passwordHash: text("password_hash"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const catalogItems = pgTable("catalog_items", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  type: varchar("type", { length: 32 }).notNull().default("Product"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 32 }).notNull().default("Draft"),
  imageUrl: text("image_url").default(""),
  shortDescription: text("short_description").default(""),
  category: varchar("category", { length: 128 }).default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  itemId: integer("item_id"),
  customerName: varchar("customer_name", { length: 256 }).notNull(),
  customerContact: varchar("customer_contact", { length: 512 }).notNull(),
  message: text("message").default(""),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
