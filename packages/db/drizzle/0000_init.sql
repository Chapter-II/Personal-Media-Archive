CREATE TYPE "public"."api_token_scope" AS ENUM('submit', 'admin');--> statement-breakpoint
CREATE TYPE "public"."archive_level" AS ENUM('L0', 'L1', 'L2_O', 'L2_N', 'L2_R');--> statement-breakpoint
CREATE TYPE "public"."asset_source" AS ENUM('original_file', 'manual_upload', 'official_download', 'public_web_asset', 'html_snapshot', 'pdf_snapshot', 'screenshot_snapshot', 'network_capture', 'visual_recording', 'browser_extension_capture');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('video', 'audio', 'image', 'html', 'pdf', 'json', 'text', 'manifest', 'other');--> statement-breakpoint
CREATE TYPE "public"."capture_method" AS ENUM('html_pdf_screenshot', 'screenshot_carousel', 'network_capture', 'visual_recording', 'livestream_recording', 'upload');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('pending', 'capturing', 'processing', 'completed', 'failed', 'manual_review_required');--> statement-breakpoint
CREATE TYPE "public"."snapshot_status" AS ENUM('pending', 'pre_flight', 'capturing', 'processing', 'indexed', 'completed', 'failed', 'manual_review_required');--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"scope" "api_token_scope" DEFAULT 'submit' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"master_password_hash" text NOT NULL,
	"totp_secret_encrypted" text NOT NULL,
	"recovery_codes_hashes" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"color" text,
	"is_inbox" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "item_tags" (
	"item_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_tags_item_id_tag_id_pk" PRIMARY KEY("item_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"canonical_url" text NOT NULL,
	"platform" text,
	"content_type" text,
	"title" text,
	"author" text,
	"published_at" timestamp with time zone,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archive_level" "archive_level" DEFAULT 'L0' NOT NULL,
	"status" "item_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_canonical_url_unique" UNIQUE("canonical_url")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"asset_source" "asset_source" NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" bigint NOT NULL,
	"sha256" text NOT NULL,
	"width" integer,
	"height" integer,
	"duration_sec" numeric(12, 3),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_sha256_lowercase_hex" CHECK ("assets"."sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "assets_file_size_non_negative" CHECK ("assets"."file_size" >= 0)
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"capture_method" "capture_method" NOT NULL,
	"detected_video_duration_sec" numeric(12, 3),
	"recorded_duration_sec" numeric(12, 3),
	"cropped_to_video_element" boolean DEFAULT false NOT NULL,
	"pre_flight_log" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "snapshot_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshots_item_version_unique" UNIQUE("item_id","version"),
	CONSTRAINT "snapshots_version_positive" CHECK ("snapshots"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "cookie_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"cookies_encrypted" "bytea" NOT NULL,
	"user_agent" text,
	"expires_at" timestamp with time zone,
	"last_validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cookie_profiles_platform_unique" UNIQUE("platform")
);
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_tags" ADD CONSTRAINT "item_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_tokens_user_idx" ON "api_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_tokens_active_idx" ON "api_tokens" USING btree ("user_id") WHERE "api_tokens"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "item_tags_tag_idx" ON "item_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "items_collection_idx" ON "items" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "items_platform_idx" ON "items" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "items_status_idx" ON "items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "items_saved_at_idx" ON "items" USING btree ("saved_at");--> statement-breakpoint
CREATE INDEX "assets_snapshot_idx" ON "assets" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "assets_sha256_idx" ON "assets" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "snapshots_status_idx" ON "snapshots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "snapshots_captured_at_idx" ON "snapshots" USING btree ("captured_at");