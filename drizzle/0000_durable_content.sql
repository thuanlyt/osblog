CREATE TYPE "post_status" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "comment_status" AS ENUM ('pending', 'approved', 'rejected', 'spam');

CREATE TABLE "category" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" varchar(160) NOT NULL UNIQUE,
  "name_vi" varchar(160) NOT NULL,
  "name_en" varchar(160) NOT NULL,
  "description_vi" text,
  "description_en" text,
  "is_archived" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "post" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id" uuid NOT NULL REFERENCES "category"("id"),
  "slug" varchar(180) NOT NULL UNIQUE,
  "title_vi" varchar(240) NOT NULL,
  "title_en" varchar(240) NOT NULL,
  "excerpt_vi" text NOT NULL,
  "excerpt_en" text NOT NULL,
  "body_vi" text NOT NULL,
  "body_en" text NOT NULL,
  "cover_image_url" text,
  "cover_image_alt_vi" varchar(240),
  "cover_image_alt_en" varchar(240),
  "status" "post_status" NOT NULL DEFAULT 'draft',
  "published_at" timestamptz,
  "view_count" integer NOT NULL DEFAULT 0,
  "seo_title_vi" varchar(240),
  "seo_title_en" varchar(240),
  "seo_description_vi" varchar(320),
  "seo_description_en" varchar(320),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "post_status_published_at_idx" ON "post" ("status", "published_at");
CREATE INDEX "post_category_idx" ON "post" ("category_id");

CREATE TABLE "comment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL REFERENCES "post"("id"),
  "email_ciphertext" text NOT NULL,
  "email_hash" varchar(64) NOT NULL,
  "body" text NOT NULL,
  "status" "comment_status" NOT NULL DEFAULT 'pending',
  "ip_hash" varchar(64) NOT NULL,
  "user_agent_hash" varchar(64) NOT NULL,
  "reviewed_at" timestamptz,
  "moderation_reason" varchar(500),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "comment_post_idx" ON "comment" ("post_id");
CREATE INDEX "comment_status_created_at_idx" ON "comment" ("status", "created_at");
CREATE INDEX "comment_email_hash_idx" ON "comment" ("email_hash");

CREATE TABLE "rate_limit_bucket" (
  "key" varchar(200) PRIMARY KEY,
  "window_start" timestamptz NOT NULL,
  "count" integer NOT NULL DEFAULT 0,
  "expires_at" timestamptz NOT NULL
);

CREATE TABLE "audit_event" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_user_id" text,
  "action" varchar(120) NOT NULL,
  "entity" varchar(80) NOT NULL,
  "entity_id" text,
  "before_summary" jsonb,
  "after_summary" jsonb,
  "request_id" varchar(120) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "audit_event_entity_idx" ON "audit_event" ("entity", "entity_id");
CREATE INDEX "audit_event_actor_idx" ON "audit_event" ("actor_user_id", "created_at");
