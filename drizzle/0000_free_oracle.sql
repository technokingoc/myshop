CREATE TABLE "admin_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"action" varchar(128) NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" integer NOT NULL,
	"old_values" jsonb DEFAULT '{}'::jsonb,
	"new_values" jsonb DEFAULT '{}'::jsonb,
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliate_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"product_id" integer,
	"code" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text DEFAULT '',
	"commission_type" varchar(16) DEFAULT 'percentage',
	"commission_value" numeric(8, 2) DEFAULT '10.00',
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"total_commission" numeric(12, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "affiliate_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"visitor_id" varchar(128),
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"action" varchar(32) NOT NULL,
	"order_id" integer,
	"customer_id" integer,
	"order_value" numeric(12, 2) DEFAULT '0',
	"commission_amount" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"user_id" integer,
	"name" varchar(256) NOT NULL,
	"key_hash" varchar(512) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"last_used_at" timestamp with time zone,
	"usage_count" integer DEFAULT 0,
	"rate_limit_per_day" integer DEFAULT 1000,
	"is_active" boolean DEFAULT true,
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "billing_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"subscription_id" integer,
	"event_type" varchar(64) NOT NULL,
	"stripe_event_id" varchar(128),
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"processed_successfully" boolean DEFAULT true,
	"error_message" text DEFAULT '',
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"type" varchar(32) DEFAULT 'Product' NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" varchar(32) DEFAULT 'Draft' NOT NULL,
	"image_url" text DEFAULT '',
	"image_urls" text DEFAULT '',
	"short_description" text DEFAULT '',
	"category" varchar(128) DEFAULT '',
	"stock_quantity" integer DEFAULT -1,
	"track_inventory" boolean DEFAULT false,
	"low_stock_threshold" integer DEFAULT 5,
	"compare_at_price" numeric(10, 2) DEFAULT '0',
	"has_variants" boolean DEFAULT false,
	"moderation_status" varchar(32) DEFAULT 'approved',
	"flagged_reason" text DEFAULT '',
	"flagged_by" integer,
	"flagged_at" timestamp with time zone,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" varchar(128) NOT NULL,
	"name_pt" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"icon" varchar(64) DEFAULT '',
	"parent_id" integer,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalog_item_id" integer,
	"seller_id" integer,
	"author_name" varchar(100) NOT NULL,
	"author_email" varchar(255),
	"content" text NOT NULL,
	"rating" integer,
	"moderation_status" varchar(32) DEFAULT 'approved',
	"flagged_reason" text DEFAULT '',
	"flagged_by" integer,
	"flagged_at" timestamp with time zone,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"name" varchar(256) NOT NULL,
	"enabled" boolean DEFAULT true,
	"filter_type" varchar(32) NOT NULL,
	"patterns" jsonb DEFAULT '[]'::jsonb,
	"case_sensitive" boolean DEFAULT false,
	"whole_words_only" boolean DEFAULT false,
	"action" varchar(32) DEFAULT 'flag',
	"replacement" text DEFAULT '[FILTERED]',
	"severity" varchar(16) DEFAULT 'medium',
	"match_count" integer DEFAULT 0,
	"last_match" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"flagged_by" integer,
	"reason" varchar(64) NOT NULL,
	"description" text DEFAULT '',
	"severity" varchar(16) DEFAULT 'medium',
	"auto_flagged" boolean DEFAULT false,
	"trigger_rules" jsonb DEFAULT '[]'::jsonb,
	"status" varchar(32) DEFAULT 'pending',
	"moderated_by" integer,
	"moderated_at" timestamp with time zone,
	"moderator_notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"subject" varchar(256) DEFAULT '',
	"status" varchar(32) DEFAULT 'active',
	"last_message_id" integer,
	"last_message_at" timestamp with time zone,
	"last_message_preview" varchar(150) DEFAULT '',
	"unread_by_customer" integer DEFAULT 0,
	"unread_by_seller" integer DEFAULT 0,
	"product_id" integer,
	"order_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"code" varchar(64) NOT NULL,
	"type" varchar(16) DEFAULT 'percentage' NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"min_order_amount" numeric(10, 2) DEFAULT '0',
	"max_uses" integer DEFAULT -1,
	"used_count" integer DEFAULT 0,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"label" varchar(100) DEFAULT 'Home' NOT NULL,
	"full_name" varchar(256) NOT NULL,
	"address_line1" varchar(256) NOT NULL,
	"address_line2" varchar(256) DEFAULT '',
	"city" varchar(256) NOT NULL,
	"state" varchar(256) DEFAULT '',
	"postal_code" varchar(32) DEFAULT '',
	"country" varchar(64) DEFAULT 'Mozambique' NOT NULL,
	"phone" varchar(64) DEFAULT '',
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"order_id" integer,
	"catalog_item_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(256) DEFAULT '',
	"content" text DEFAULT '',
	"image_urls" text DEFAULT '',
	"helpful" integer DEFAULT 0,
	"unhelpful" integer DEFAULT 0,
	"verified" boolean DEFAULT false,
	"status" varchar(32) DEFAULT 'published',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"password_hash" text NOT NULL,
	"phone" varchar(64) DEFAULT '',
	"address" text DEFAULT '',
	"city" varchar(256) DEFAULT '',
	"country" varchar(64) DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"name" varchar(256) NOT NULL,
	"subject" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"audience_type" varchar(32) DEFAULT 'all',
	"audience_filter" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(32) DEFAULT 'draft',
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"estimated_recipients" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"email" varchar(256) NOT NULL,
	"name" varchar(256) DEFAULT '',
	"phone" varchar(64) DEFAULT '',
	"status" varchar(32) DEFAULT 'subscribed',
	"source" varchar(64) DEFAULT 'manual',
	"city" varchar(256) DEFAULT '',
	"country" varchar(64) DEFAULT '',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"customer_id" integer,
	"total_purchases" integer DEFAULT 0,
	"last_purchase_date" timestamp with time zone,
	"subscribed_at" timestamp with time zone DEFAULT now(),
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"name" varchar(256) NOT NULL,
	"subject" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"preview_text" text DEFAULT '',
	"template_type" varchar(32) DEFAULT 'custom',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flash_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text DEFAULT '',
	"discount_type" varchar(16) DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"max_discount" numeric(10, 2) DEFAULT '0',
	"min_order_amount" numeric(10, 2) DEFAULT '0',
	"max_uses" integer DEFAULT -1,
	"used_count" integer DEFAULT 0,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"products" text DEFAULT '',
	"banner_text" varchar(512) DEFAULT '',
	"banner_color" varchar(16) DEFAULT '#ef4444',
	"show_countdown" boolean DEFAULT true,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" varchar(128) NOT NULL,
	"name_pt" varchar(128) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"country" varchar(64) DEFAULT 'Mozambique',
	"region" varchar(128) DEFAULT '',
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "locations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "message_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"file_name" varchar(256) NOT NULL,
	"file_type" varchar(64) NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"virus_scanned" boolean DEFAULT false,
	"scan_result" varchar(32) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_filter_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"filter_id" integer NOT NULL,
	"matched_text" text NOT NULL,
	"filter_pattern" text NOT NULL,
	"action_taken" varchar(32) NOT NULL,
	"original_content" text DEFAULT '',
	"position" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"conversation_id" integer NOT NULL,
	"reporter_id" integer NOT NULL,
	"reported_user_id" integer NOT NULL,
	"reason" varchar(32) NOT NULL,
	"description" text DEFAULT '',
	"category" varchar(32) DEFAULT 'inappropriate',
	"status" varchar(32) DEFAULT 'pending',
	"moderated_by" integer,
	"moderated_at" timestamp with time zone,
	"moderator_notes" text DEFAULT '',
	"action_taken" varchar(64) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar(32) DEFAULT 'text',
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"read_by_customer" boolean DEFAULT false,
	"read_by_customer_at" timestamp with time zone,
	"read_by_seller" boolean DEFAULT false,
	"read_by_seller_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_type" varchar(32) DEFAULT 'seller' NOT NULL,
	"email_order_updates" boolean DEFAULT true,
	"email_inventory_alerts" boolean DEFAULT true,
	"email_review_alerts" boolean DEFAULT true,
	"email_promotional_emails" boolean DEFAULT false,
	"email_system_updates" boolean DEFAULT true,
	"inapp_order_updates" boolean DEFAULT true,
	"inapp_inventory_alerts" boolean DEFAULT true,
	"inapp_review_alerts" boolean DEFAULT true,
	"inapp_system_updates" boolean DEFAULT true,
	"email_frequency" varchar(32) DEFAULT 'instant',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer,
	"customer_id" integer,
	"type" varchar(64) DEFAULT 'order_status' NOT NULL,
	"title" varchar(256) NOT NULL,
	"message" text NOT NULL,
	"order_id" integer,
	"read" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"action_url" text DEFAULT '',
	"priority" integer DEFAULT 1,
	"notification_channel" varchar(32) DEFAULT 'in_app',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"item_id" integer,
	"customer_name" varchar(256) NOT NULL,
	"customer_contact" varchar(512) NOT NULL,
	"message" text DEFAULT '',
	"status" varchar(32) DEFAULT 'placed' NOT NULL,
	"notes" text DEFAULT '',
	"status_history" jsonb DEFAULT '[]'::jsonb,
	"coupon_code" varchar(64) DEFAULT '',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"customer_id" integer,
	"tracking_token" varchar(128),
	"cancel_reason" text,
	"refund_reason" text,
	"refund_amount" numeric(10, 2),
	"shipping_method_id" integer,
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"shipping_address" jsonb,
	"estimated_delivery" timestamp,
	"tracking_number" varchar(128) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_tracking_token_unique" UNIQUE("tracking_token")
);
--> statement-breakpoint
CREATE TABLE "payment_instructions" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"method" varchar(32) NOT NULL,
	"bank_name" varchar(256) DEFAULT '',
	"account_number" varchar(64) DEFAULT '',
	"account_name" varchar(256) DEFAULT '',
	"swift_code" varchar(32) DEFAULT '',
	"iban" varchar(64) DEFAULT '',
	"mobile_number" varchar(32) DEFAULT '',
	"network_provider" varchar(64) DEFAULT '',
	"instructions_en" text DEFAULT '',
	"instructions_pt" text DEFAULT '',
	"active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"method" varchar(32) NOT NULL,
	"enabled" boolean DEFAULT true,
	"bank_name" varchar(256) DEFAULT '',
	"bank_account" varchar(128) DEFAULT '',
	"bank_account_name" varchar(256) DEFAULT '',
	"bank_swift_code" varchar(32) DEFAULT '',
	"bank_branch" varchar(256) DEFAULT '',
	"bank_instructions" text DEFAULT '',
	"mpesa_business_number" varchar(64) DEFAULT '',
	"mpesa_business_name" varchar(256) DEFAULT '',
	"mpesa_api_key" varchar(512) DEFAULT '',
	"mpesa_api_secret" varchar(512) DEFAULT '',
	"mpesa_environment" varchar(16) DEFAULT 'sandbox',
	"display_name" varchar(256) DEFAULT '',
	"instructions" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"receipt_number" varchar(128) NOT NULL,
	"receipt_date" timestamp NOT NULL,
	"customer_name" varchar(256) NOT NULL,
	"customer_email" varchar(256) DEFAULT '',
	"customer_phone" varchar(64) DEFAULT '',
	"payment_method" varchar(32) NOT NULL,
	"payment_amount" numeric(12, 2) NOT NULL,
	"payment_reference" varchar(128) NOT NULL,
	"order_items" jsonb DEFAULT '[]'::jsonb,
	"order_subtotal" numeric(12, 2) NOT NULL,
	"order_discount" numeric(12, 2) DEFAULT '0',
	"order_shipping" numeric(12, 2) DEFAULT '0',
	"order_total" numeric(12, 2) NOT NULL,
	"store_name" varchar(256) NOT NULL,
	"store_address" text DEFAULT '',
	"store_phone" varchar(64) DEFAULT '',
	"store_email" varchar(256) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "payment_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"status" varchar(32) NOT NULL,
	"previous_status" varchar(32) DEFAULT '',
	"reason" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" varchar(64) DEFAULT 'system',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"customer_id" integer,
	"method" varchar(32) NOT NULL,
	"provider" varchar(64) DEFAULT '',
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"fees" numeric(10, 2) DEFAULT '0',
	"net_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(8) DEFAULT 'MZN',
	"external_id" varchar(128),
	"external_reference" varchar(256) DEFAULT '',
	"confirmation_code" varchar(64) DEFAULT '',
	"payer_phone" varchar(32) DEFAULT '',
	"payer_name" varchar(256) DEFAULT '',
	"payer_email" varchar(256) DEFAULT '',
	"settled" boolean DEFAULT false,
	"settled_at" timestamp,
	"settled_amount" numeric(12, 2) DEFAULT '0',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "plan_change_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"subscription_id" integer,
	"from_plan" varchar(32) NOT NULL,
	"to_plan" varchar(32) NOT NULL,
	"change_type" varchar(32) NOT NULL,
	"effective_date" timestamp with time zone,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"requested_by" integer,
	"proration_amount" integer DEFAULT 0,
	"proration_description" text DEFAULT '',
	"stripe_subscription_schedule_id" varchar(128),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"sku" varchar(128) DEFAULT '',
	"price" numeric(12, 2) NOT NULL,
	"compare_at_price" numeric(10, 2) DEFAULT '0',
	"stock_quantity" integer DEFAULT 0,
	"low_stock_threshold" integer DEFAULT 5,
	"image_url" text DEFAULT '',
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text DEFAULT '',
	"type" varchar(32) DEFAULT 'banner' NOT NULL,
	"banner_image_url" text DEFAULT '',
	"background_color" varchar(16) DEFAULT '#3b82f6',
	"text_color" varchar(16) DEFAULT '#ffffff',
	"link_url" text DEFAULT '',
	"priority" integer DEFAULT 0,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"code" varchar(64) NOT NULL,
	"target_url" text,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"is_active" boolean DEFAULT true,
	"name" varchar(256) DEFAULT 'Referral Program',
	"description" text DEFAULT '',
	"referrer_reward_type" varchar(32) DEFAULT 'percentage',
	"referrer_reward_value" numeric(8, 2) DEFAULT '10.00',
	"referred_reward_type" varchar(32) DEFAULT 'percentage',
	"referred_reward_value" numeric(8, 2) DEFAULT '5.00',
	"max_referrals" integer DEFAULT -1,
	"max_reward_amount" numeric(10, 2) DEFAULT '0',
	"validity_days" integer DEFAULT 30,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"visitor_id" varchar(128),
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"action" varchar(32) NOT NULL,
	"order_id" integer,
	"customer_id" integer,
	"order_value" numeric(12, 2) DEFAULT '0',
	"reward_amount" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restock_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"warehouse_id" integer,
	"trigger_quantity" integer NOT NULL,
	"target_quantity" integer NOT NULL,
	"lead_time_days" integer DEFAULT 7,
	"supplier_name" varchar(256) DEFAULT '',
	"supplier_email" varchar(256) DEFAULT '',
	"supplier_phone" varchar(64) DEFAULT '',
	"last_order_date" timestamp,
	"average_lead_time" integer DEFAULT 7,
	"status" varchar(32) DEFAULT 'active',
	"last_triggered" timestamp,
	"snooze_until" timestamp,
	"email_notifications" boolean DEFAULT true,
	"auto_reorder_enabled" boolean DEFAULT false,
	"min_order_quantity" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenues" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"payment_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"platform_fee_rate" numeric(8, 4) DEFAULT '0',
	"platform_fee_amount" numeric(12, 2) DEFAULT '0',
	"net_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(8) DEFAULT 'MZN' NOT NULL,
	"settlement_status" varchar(32) DEFAULT 'pending',
	"settlement_date" timestamp,
	"settlement_reference" varchar(128) DEFAULT '',
	"settlement_notes" text DEFAULT '',
	"revenue_date" timestamp NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"vote_type" varchar(16) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(128) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text DEFAULT '',
	"owner_name" varchar(256) DEFAULT '',
	"business_type" varchar(128) DEFAULT 'Retail',
	"currency" varchar(16) DEFAULT 'USD',
	"city" varchar(256) DEFAULT '',
	"logo_url" text DEFAULT '',
	"banner_url" text DEFAULT '',
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" varchar(256),
	"password_hash" text,
	"role" varchar(32) DEFAULT 'seller',
	"plan" varchar(32) DEFAULT 'free',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email_notifications" boolean DEFAULT true,
	"theme_color" varchar(32) DEFAULT 'green',
	"business_hours" jsonb DEFAULT '{}'::jsonb,
	"address" text DEFAULT '',
	"country" varchar(64) DEFAULT '',
	"store_template" varchar(32) DEFAULT 'classic',
	"header_template" varchar(32) DEFAULT 'compact',
	"verification_status" varchar(32) DEFAULT 'pending',
	"verification_notes" text DEFAULT '',
	"verification_requested_at" timestamp with time zone DEFAULT now(),
	"verification_reviewed_at" timestamp with time zone,
	"verification_reviewed_by" integer,
	"business_documents" jsonb DEFAULT '[]'::jsonb,
	"flagged_reason" text DEFAULT '',
	"language" varchar(8) DEFAULT 'en',
	CONSTRAINT "sellers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "sellers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"platform_fees" numeric(10, 2) DEFAULT '0',
	"payment_fees" numeric(10, 2) DEFAULT '0',
	"net_amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(32) DEFAULT '',
	"payment_reference" varchar(256) DEFAULT '',
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"payment_ids" text DEFAULT '',
	"notes" text DEFAULT '',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"processed_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"zone_id" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"type" varchar(32) DEFAULT 'flat_rate' NOT NULL,
	"rate" numeric(10, 2) DEFAULT '0',
	"free_shipping_min_order" numeric(10, 2) DEFAULT '0',
	"estimated_days" integer DEFAULT 3,
	"max_weight" numeric(8, 2) DEFAULT '0',
	"pickup_address" text DEFAULT '',
	"pickup_instructions" text DEFAULT '',
	"active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"regions" jsonb DEFAULT '[]'::jsonb,
	"countries" jsonb DEFAULT '[]'::jsonb,
	"active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"product_id" integer,
	"platform" varchar(32) NOT NULL,
	"shared_url" text NOT NULL,
	"share_title" varchar(256) DEFAULT '',
	"visitor_id" varchar(128),
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"product_id" integer,
	"variant_id" integer,
	"warehouse_id" integer,
	"change_type" varchar(32) NOT NULL,
	"quantity_before" integer NOT NULL,
	"quantity_change" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"order_id" integer,
	"reason" text DEFAULT '',
	"notes" text DEFAULT '',
	"batch_number" varchar(128) DEFAULT '',
	"expiration_date" timestamp,
	"cost_price" numeric(10, 2) DEFAULT '0',
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"slug" varchar(128) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text DEFAULT '',
	"logo_url" text DEFAULT '',
	"banner_url" text DEFAULT '',
	"business_type" varchar(128) DEFAULT 'Retail',
	"currency" varchar(16) DEFAULT 'USD',
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"plan" varchar(32) DEFAULT 'free',
	"theme_color" varchar(32) DEFAULT 'green',
	"store_template" varchar(32) DEFAULT 'classic',
	"header_template" varchar(32) DEFAULT 'compact',
	"business_hours" jsonb DEFAULT '{}'::jsonb,
	"address" text DEFAULT '',
	"city" varchar(256) DEFAULT '',
	"country" varchar(64) DEFAULT '',
	"email_notifications" boolean DEFAULT true,
	"verification_status" varchar(32) DEFAULT 'pending',
	"verification_notes" text DEFAULT '',
	"verification_requested_at" timestamp with time zone DEFAULT now(),
	"verification_reviewed_at" timestamp with time zone,
	"verification_reviewed_by" integer,
	"business_documents" jsonb DEFAULT '[]'::jsonb,
	"flagged_reason" text DEFAULT '',
	"language" varchar(8) DEFAULT 'en',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscription_invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"stripe_invoice_item_id" varchar(128),
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1,
	"unit_amount" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(8) DEFAULT 'USD',
	"plan" varchar(32) DEFAULT '',
	"pricing_type" varchar(32) DEFAULT 'subscription',
	"usage_start" timestamp with time zone,
	"usage_end" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"subscription_id" integer,
	"stripe_invoice_id" varchar(128),
	"invoice_number" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"tax" integer DEFAULT 0,
	"total" integer DEFAULT 0 NOT NULL,
	"amount_paid" integer DEFAULT 0,
	"amount_remaining" integer DEFAULT 0,
	"currency" varchar(8) DEFAULT 'USD',
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"invoice_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"pdf_generated" boolean DEFAULT false,
	"pdf_url" text DEFAULT '',
	"pdf_generated_at" timestamp with time zone,
	"customer_details" jsonb DEFAULT '{"name":"","email":""}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id"),
	CONSTRAINT "subscription_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "subscription_payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"stripe_payment_method_id" varchar(128) NOT NULL,
	"stripe_customer_id" varchar(128) NOT NULL,
	"type" varchar(32) NOT NULL,
	"brand" varchar(32) DEFAULT '',
	"last4" varchar(4) DEFAULT '',
	"exp_month" integer,
	"exp_year" integer,
	"is_default" boolean DEFAULT false,
	"status" varchar(32) DEFAULT 'active',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_payment_methods_stripe_payment_method_id_unique" UNIQUE("stripe_payment_method_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"stripe_customer_id" varchar(128),
	"stripe_subscription_id" varchar(128),
	"stripe_price_id" varchar(128),
	"plan" varchar(32) DEFAULT 'free' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false,
	"cancel_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"grace_period_start" timestamp with time zone,
	"grace_period_end" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "typing_indicators" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"is_typing" boolean DEFAULT true,
	"last_typing_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"subscription_id" integer,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"products_used" integer DEFAULT 0,
	"orders_processed" integer DEFAULT 0,
	"storage_used_mb" integer DEFAULT 0,
	"products_limit" integer DEFAULT -1,
	"orders_limit" integer DEFAULT -1,
	"storage_limit_mb" integer DEFAULT -1,
	"limit_exceeded" boolean DEFAULT false,
	"warnings_sent" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"blocked_user_id" integer NOT NULL,
	"reason" varchar(32) DEFAULT '',
	"notes" text DEFAULT '',
	"block_type" varchar(32) DEFAULT 'messages',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(256) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(256) NOT NULL,
	"phone" varchar(64) DEFAULT '',
	"avatar_url" text DEFAULT '',
	"city" varchar(256) DEFAULT '',
	"country" varchar(64) DEFAULT '',
	"role" varchar(32) DEFAULT 'user',
	"language" varchar(8) DEFAULT 'en',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"code" varchar(32) NOT NULL,
	"address" text DEFAULT '',
	"city" varchar(256) DEFAULT '',
	"state" varchar(256) DEFAULT '',
	"country" varchar(64) DEFAULT 'Mozambique',
	"postal_code" varchar(32) DEFAULT '',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"allow_sales" boolean DEFAULT true,
	"allow_transfers" boolean DEFAULT true,
	"contact_person" varchar(256) DEFAULT '',
	"contact_email" varchar(256) DEFAULT '',
	"contact_phone" varchar(64) DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_id" integer NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"url" text NOT NULL,
	"http_method" varchar(10) DEFAULT 'POST',
	"headers" jsonb DEFAULT '{}'::jsonb,
	"body" text NOT NULL,
	"response_status" integer,
	"response_body" text DEFAULT '',
	"response_headers" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(32) NOT NULL,
	"retry_count" integer DEFAULT 0,
	"next_retry_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer,
	"seller_id" integer,
	"user_id" integer,
	"name" varchar(256) NOT NULL,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb,
	"secret" varchar(128) NOT NULL,
	"is_active" boolean DEFAULT true,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"last_delivery_at" timestamp with time zone,
	"last_delivery_status" varchar(32) DEFAULT 'pending',
	"max_retries" integer DEFAULT 3,
	"timeout_seconds" integer DEFAULT 30,
	"notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"catalog_item_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_product_id_catalog_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_tracking" ADD CONSTRAINT "affiliate_tracking_link_id_affiliate_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_tracking" ADD CONSTRAINT "affiliate_tracking_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_tracking" ADD CONSTRAINT "affiliate_tracking_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_filters" ADD CONSTRAINT "content_filters_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_flags" ADD CONSTRAINT "conversation_flags_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_flags" ADD CONSTRAINT "conversation_flags_flagged_by_users_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_flags" ADD CONSTRAINT "conversation_flags_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_product_id_catalog_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscribers" ADD CONSTRAINT "email_subscribers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscribers" ADD CONSTRAINT "email_subscribers_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_subscribers" ADD CONSTRAINT "email_subscribers_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flash_sales" ADD CONSTRAINT "flash_sales_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_files" ADD CONSTRAINT "message_files_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_files" ADD CONSTRAINT "message_files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_filter_matches" ADD CONSTRAINT "message_filter_matches_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_filter_matches" ADD CONSTRAINT "message_filter_matches_filter_id_content_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."content_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_instructions" ADD CONSTRAINT "payment_instructions_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_status_history" ADD CONSTRAINT "payment_status_history_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_change_requests" ADD CONSTRAINT "plan_change_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_catalog_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_program_id_referral_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."referral_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_links" ADD CONSTRAINT "referral_links_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_tracking" ADD CONSTRAINT "referral_tracking_link_id_referral_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."referral_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_tracking" ADD CONSTRAINT "referral_tracking_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_tracking" ADD CONSTRAINT "referral_tracking_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_reminders" ADD CONSTRAINT "restock_reminders_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_reminders" ADD CONSTRAINT "restock_reminders_product_id_catalog_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_reminders" ADD CONSTRAINT "restock_reminders_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_customer_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."customer_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_zones" ADD CONSTRAINT "shipping_zones_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_product_id_catalog_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_product_id_catalog_items_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoice_items" ADD CONSTRAINT "subscription_invoice_items_invoice_id_subscription_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."subscription_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment_methods" ADD CONSTRAINT "subscription_payment_methods_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;