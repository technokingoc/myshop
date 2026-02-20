CREATE TABLE "review_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"analytics_date" timestamp with time zone NOT NULL,
	"total_reviews" integer DEFAULT 0,
	"new_reviews" integer DEFAULT 0,
	"published_reviews" integer DEFAULT 0,
	"pending_reviews" integer DEFAULT 0,
	"rating_5_count" integer DEFAULT 0,
	"rating_4_count" integer DEFAULT 0,
	"rating_3_count" integer DEFAULT 0,
	"rating_2_count" integer DEFAULT 0,
	"rating_1_count" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"previous_average_rating" numeric(3, 2) DEFAULT '0.00',
	"positive_reviews" integer DEFAULT 0,
	"negative_reviews" integer DEFAULT 0,
	"neutral_reviews" integer DEFAULT 0,
	"response_rate" numeric(5, 2) DEFAULT '0.00',
	"avg_response_time_hours" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"status" varchar(32) DEFAULT 'pending',
	"delay_days" integer DEFAULT 3,
	"scheduled_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"customer_email" varchar(256) NOT NULL,
	"customer_name" varchar(256) NOT NULL,
	"order_items" jsonb DEFAULT '[]'::jsonb,
	"email_opened" boolean DEFAULT false,
	"email_clicked" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"review_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"content" text NOT NULL,
	"status" varchar(32) DEFAULT 'published',
	"moderated_by" integer,
	"moderated_at" timestamp with time zone,
	"moderator_notes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"store_id" integer,
	"total_reviews" integer DEFAULT 0,
	"average_rating" numeric(3, 2) DEFAULT '0.00',
	"rating_5_count" integer DEFAULT 0,
	"rating_4_count" integer DEFAULT 0,
	"rating_3_count" integer DEFAULT 0,
	"rating_2_count" integer DEFAULT 0,
	"rating_1_count" integer DEFAULT 0,
	"verified_reviews_count" integer DEFAULT 0,
	"with_photos_count" integer DEFAULT 0,
	"response_rate" numeric(5, 2) DEFAULT '0.00',
	"rating_trend" varchar(16) DEFAULT 'stable',
	"trend_percentage" numeric(5, 2) DEFAULT '0.00',
	"last_calculated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "review_analytics" ADD CONSTRAINT "review_analytics_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_responses" ADD CONSTRAINT "seller_responses_review_id_customer_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."customer_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_responses" ADD CONSTRAINT "seller_responses_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_responses" ADD CONSTRAINT "seller_responses_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_ratings" ADD CONSTRAINT "store_ratings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_ratings" ADD CONSTRAINT "store_ratings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;