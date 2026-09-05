import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const postStatus = pgEnum('post_status', ['draft', 'published', 'archived'])
export const commentStatus = pgEnum('comment_status', ['pending', 'approved', 'rejected', 'spam'])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const category = pgTable('category', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 160 }).notNull().unique(),
  nameVi: varchar('name_vi', { length: 160 }).notNull(),
  nameEn: varchar('name_en', { length: 160 }).notNull(),
  descriptionVi: text('description_vi'),
  descriptionEn: text('description_en'),
  isArchived: boolean('is_archived').default(false).notNull(),
  ...timestamps,
})

export const post = pgTable(
  'post',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id').references(() => category.id).notNull(),
    slug: varchar('slug', { length: 180 }).notNull().unique(),
    titleVi: varchar('title_vi', { length: 240 }).notNull(),
    titleEn: varchar('title_en', { length: 240 }).notNull(),
    excerptVi: text('excerpt_vi').notNull(),
    excerptEn: text('excerpt_en').notNull(),
    bodyVi: text('body_vi').notNull(),
    bodyEn: text('body_en').notNull(),
    coverImageUrl: text('cover_image_url'),
    coverImageAltVi: varchar('cover_image_alt_vi', { length: 240 }),
    coverImageAltEn: varchar('cover_image_alt_en', { length: 240 }),
    status: postStatus('status').default('draft').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    viewCount: integer('view_count').default(0).notNull(),
    seoTitleVi: varchar('seo_title_vi', { length: 240 }),
    seoTitleEn: varchar('seo_title_en', { length: 240 }),
    seoDescriptionVi: varchar('seo_description_vi', { length: 320 }),
    seoDescriptionEn: varchar('seo_description_en', { length: 320 }),
    ...timestamps,
  },
  (table) => ({
    statusPublishedAtIdx: index('post_status_published_at_idx').on(table.status, table.publishedAt),
    categoryIdx: index('post_category_idx').on(table.categoryId),
  }),
)

export const postSlugHistory = pgTable('post_slug_history', {
  slug: varchar('slug', { length: 180 }).primaryKey(),
  postId: uuid('post_id').references(() => post.id, { onDelete: 'cascade' }).notNull(),
  firstPublishedAt: timestamp('first_published_at', { withTimezone: true, precision: 3 }).defaultNow().notNull(),
}, (table) => ({ postIdx: index('post_slug_history_post_idx').on(table.postId) }))

export const comment = pgTable(
  'comment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id').references(() => post.id).notNull(),
    emailCiphertext: text('email_ciphertext').notNull(),
    emailHash: varchar('email_hash', { length: 64 }).notNull(),
    body: text('body').notNull(),
    status: commentStatus('status').default('pending').notNull(),
    ipHash: varchar('ip_hash', { length: 64 }).notNull(),
    userAgentHash: varchar('user_agent_hash', { length: 64 }).notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    moderationReason: varchar('moderation_reason', { length: 500 }),
    ...timestamps,
  },
  (table) => ({
    postIdx: index('comment_post_idx').on(table.postId),
    moderationIdx: index('comment_status_created_at_idx').on(table.status, table.createdAt),
    emailHashIdx: index('comment_email_hash_idx').on(table.emailHash),
  }),
)

export const rateLimitBucket = pgTable('rate_limit_bucket', {
  key: varchar('key', { length: 200 }).primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  count: integer('count').default(0).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const auditEvent = pgTable(
  'audit_event',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: text('actor_user_id'),
    action: varchar('action', { length: 120 }).notNull(),
    entity: varchar('entity', { length: 80 }).notNull(),
    entityId: text('entity_id'),
    beforeSummary: jsonb('before_summary'),
    afterSummary: jsonb('after_summary'),
    requestId: varchar('request_id', { length: 120 }).notNull(),
    ...timestamps,
  },
  (table) => ({
    entityIdx: index('audit_event_entity_idx').on(table.entity, table.entityId),
    actorIdx: index('audit_event_actor_idx').on(table.actorUserId, table.createdAt),
  }),
)

export const schema = { category, post, postSlugHistory, comment, rateLimitBucket, auditEvent }
