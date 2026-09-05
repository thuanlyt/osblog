import { and, count, desc, eq, getTableColumns, ilike, lte, ne, or, sql } from 'drizzle-orm'
import { auditEvent, category, post } from './schema'
import type { Database, Store } from './db'
import { HttpError } from './http'
import { createPostInput, listPostsQuery, type CreatePostInput, type UpdatePostInput } from './content-contract'
import type { z } from 'zod'

// Shared by all public reads, comments, view counts and sitemap.
export const visiblePost = () => and(eq(post.status, 'published'), lte(post.publishedAt, new Date()), eq(category.isArchived, false))
const publicColumns = { ...getTableColumns(post), category: { id: category.id, slug: category.slug, nameVi: category.nameVi, nameEn: category.nameEn } }
function listFilter(query: z.infer<typeof listPostsQuery>) {
  const escaped = query.q.replace(/[\\%_]/g, '\\$&')
  return and(visiblePost(), query.category ? eq(category.slug, query.category) : undefined,
    query.q ? or(ilike(post.titleEn, `%${escaped}%`), ilike(post.titleVi, `%${escaped}%`), ilike(post.excerptEn, `%${escaped}%`), ilike(post.excerptVi, `%${escaped}%`)) : undefined,
    query.year ? sql`extract(year from ${post.publishedAt} at time zone 'UTC') = ${Number(query.year)}` : undefined)
}
export async function listPublishedPosts(db: Store, input: number | z.infer<typeof listPostsQuery> = 20) {
  const query = typeof input === 'number' ? listPostsQuery.parse({ limit: input }) : input
  const order = query.sort === 'random' ? sql`random()` : query.sort === 'popular' ? desc(post.viewCount) : desc(post.publishedAt)
  const rows = await db.select(publicColumns).from(post).innerJoin(category, eq(post.categoryId, category.id))
    .where(listFilter(query)).orderBy(order, desc(post.id)).limit(query.limit).offset((query.page - 1) * query.limit)
  return rows.map(({ bodyEn: _en, bodyVi: _vi, ...row }) => { void _en; void _vi; return row })
}
export async function countPublishedPosts(db: Store, query: z.infer<typeof listPostsQuery>) {
  const [row] = await db.select({ total: count() }).from(post).innerJoin(category, eq(post.categoryId, category.id)).where(listFilter(query))
  return row.total
}
export async function getPublishedPost(db: Store, slug: string) {
  const [row] = await db.select(publicColumns).from(post).innerJoin(category, eq(post.categoryId, category.id)).where(and(visiblePost(), eq(post.slug, slug))).limit(1)
  return row
}
export async function getPublishedPostById(db: Store, id: string) {
  const [row] = await db.select(publicColumns).from(post).innerJoin(category, eq(post.categoryId, category.id)).where(and(visiblePost(), eq(post.id, id))).limit(1)
  return row
}
export async function relatedPosts(db: Store, categoryId: string, id: string) {
  return db.select({ id: post.id, slug: post.slug, titleEn: post.titleEn, titleVi: post.titleVi, excerptEn: post.excerptEn, excerptVi: post.excerptVi })
    .from(post).innerJoin(category, eq(post.categoryId, category.id)).where(and(visiblePost(), eq(post.categoryId, categoryId), ne(post.id, id)))
    .orderBy(desc(post.publishedAt), desc(post.id)).limit(3)
}
export async function listCategories(db: Store, admin = false) {
  return db.select().from(category).where(admin ? undefined : eq(category.isArchived, false)).orderBy(category.nameEn)
}
export async function archiveYears(db: Store) {
  return db.selectDistinct({ year: sql<string>`to_char(${post.publishedAt} at time zone 'UTC', 'YYYY')` }).from(post)
    .innerJoin(category, eq(post.categoryId, category.id)).where(visiblePost()).orderBy(desc(sql`to_char(${post.publishedAt} at time zone 'UTC', 'YYYY')`))
}
export async function audit(db: Store, action: string, entity: string, entityId: string, requestId: string, actorUserId: string | null, before: unknown, after: unknown) {
  await db.insert(auditEvent).values({ action, entity, entityId, requestId, actorUserId, beforeSummary: before, afterSummary: after })
}
async function assertCategoryAvailable(db: Store, categoryId: string) {
  const [row] = await db.select({ id: category.id }).from(category).where(and(eq(category.id, categoryId), eq(category.isArchived, false))).limit(1)
  if (!row) throw new HttpError(409, 'CATEGORY_UNAVAILABLE', 'Choose an active category before saving.')
}
const summary = (row: typeof post.$inferSelect) => ({ slug: row.slug, status: row.status, updatedAt: row.updatedAt })
export const nextTimestamp = (previous: Date) => new Date(Math.max(Date.now(), previous.getTime() + 1))
export async function createPost(db: Database, input: CreatePostInput, requestId: string, actor: string) {
  return db.transaction(async (tx) => {
    await assertCategoryAvailable(tx, input.categoryId)
    const now = new Date()
    const [row] = await tx.insert(post).values({ ...input, publishedAt: input.publishedAt ? new Date(input.publishedAt) : null, createdAt: now, updatedAt: now }).returning()
    await audit(tx, 'post.create', 'post', row.id, requestId, actor, null, summary(row))
    return row
  })
}
export async function updatePost(db: Database, id: string, input: UpdatePostInput, requestId: string, actor: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(post).where(eq(post.id, id)).for('update')
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Post not found')
    if (existing.updatedAt.toISOString() !== new Date(input.expectedUpdatedAt).toISOString()) throw new HttpError(409, 'CONFLICT', 'This post changed in another session. Your text is still here; reload the latest version before saving.')
    const merged = createPostInput.parse({ ...existing, ...input, publishedAt: input.publishedAt !== undefined ? input.publishedAt : existing.publishedAt?.toISOString() ?? null })
    if (merged.status !== 'archived') await assertCategoryAvailable(tx, merged.categoryId)
    const [row] = await tx.update(post).set({ ...merged, publishedAt: merged.publishedAt ? new Date(merged.publishedAt) : null, updatedAt: nextTimestamp(existing.updatedAt) }).where(eq(post.id, id)).returning()
    await audit(tx, 'post.update', 'post', id, requestId, actor, summary(existing), summary(row))
    return row
  })
}
export async function archivePost(db: Database, id: string, expectedUpdatedAt: string, requestId: string, actor: string) {
  return updatePost(db, id, { status: 'archived', expectedUpdatedAt }, requestId, actor)
}
