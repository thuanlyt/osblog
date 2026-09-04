import { and, desc, eq } from 'drizzle-orm'
import { fromNodeHeaders } from 'better-auth/node'
import type { IncomingMessage } from 'node:http'
import { createAuth } from './auth'
import { AdminAuthorizationError, requireAdminUser } from './auth-policy'
import { createDatabase, type Database } from './db'
import { auditEvent, category, post } from './schema'
import { HttpError } from './http'
import { toPostDate, type CreatePostInput, type UpdatePostInput } from './content-contract'

export async function requireAdminSession(request: IncomingMessage) {
  const auth = createAuth()
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
  if (!session?.user) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required')
  try {
    requireAdminUser(session.user)
  } catch (error) {
    if (error instanceof AdminAuthorizationError) throw new HttpError(403, 'FORBIDDEN', error.message)
    throw error
  }
  return session.user
}

export async function listPublishedPosts(db: Database, limit: number) {
  return db.select({
    id: post.id,
    slug: post.slug,
    titleVi: post.titleVi,
    titleEn: post.titleEn,
    excerptVi: post.excerptVi,
    excerptEn: post.excerptEn,
    coverImageUrl: post.coverImageUrl,
    coverImageAltVi: post.coverImageAltVi,
    coverImageAltEn: post.coverImageAltEn,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    category: { id: category.id, slug: category.slug, nameVi: category.nameVi, nameEn: category.nameEn },
  }).from(post).innerJoin(category, eq(post.categoryId, category.id))
    .where(and(eq(post.status, 'published'), eq(category.isArchived, false)))
    .orderBy(desc(post.publishedAt))
    .limit(limit)
}

export async function getPublishedPost(db: Database, slug: string) {
  const [result] = await db.select({
    id: post.id,
    slug: post.slug,
    titleVi: post.titleVi,
    titleEn: post.titleEn,
    excerptVi: post.excerptVi,
    excerptEn: post.excerptEn,
    bodyVi: post.bodyVi,
    bodyEn: post.bodyEn,
    coverImageUrl: post.coverImageUrl,
    coverImageAltVi: post.coverImageAltVi,
    coverImageAltEn: post.coverImageAltEn,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    category: { id: category.id, slug: category.slug, nameVi: category.nameVi, nameEn: category.nameEn },
  }).from(post).innerJoin(category, eq(post.categoryId, category.id))
    .where(and(eq(post.slug, slug), eq(post.status, 'published'), eq(category.isArchived, false)))
    .limit(1)
  return result
}

export async function getPublishedPostById(db: Database, id: string) {
  const [result] = await db.select({
    id: post.id,
    slug: post.slug,
    titleVi: post.titleVi,
    titleEn: post.titleEn,
    excerptVi: post.excerptVi,
    excerptEn: post.excerptEn,
    bodyVi: post.bodyVi,
    bodyEn: post.bodyEn,
    coverImageUrl: post.coverImageUrl,
    coverImageAltVi: post.coverImageAltVi,
    coverImageAltEn: post.coverImageAltEn,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    category: { id: category.id, slug: category.slug, nameVi: category.nameVi, nameEn: category.nameEn },
  }).from(post).innerJoin(category, eq(post.categoryId, category.id))
    .where(and(eq(post.id, id), eq(post.status, 'published'), eq(category.isArchived, false)))
    .limit(1)
  return result
}

async function assertCategoryAvailable(db: Database, categoryId: string): Promise<void> {
  const [result] = await db.select({ id: category.id }).from(category)
    .where(and(eq(category.id, categoryId), eq(category.isArchived, false))).limit(1)
  if (!result) throw new HttpError(409, 'CATEGORY_UNAVAILABLE', 'The selected category is unavailable')
}

async function auditPost(db: Database, action: string, entityId: string, requestId: string, summary: Record<string, unknown>) {
  await db.insert(auditEvent).values({
    action,
    entity: 'post',
    entityId,
    requestId,
    afterSummary: summary,
  })
}

export async function createPost(db: Database, input: CreatePostInput, requestId: string) {
  await assertCategoryAvailable(db, input.categoryId)
  const [created] = await db.insert(post).values({
    ...input,
    publishedAt: toPostDate(input.publishedAt),
  }).returning()
  if (!created) throw new HttpError(500, 'CREATE_FAILED', 'Post could not be created')
  await auditPost(db, 'post.create', created.id, requestId, { slug: created.slug, status: created.status })
  return created
}

function updateValues(input: UpdatePostInput) {
  const { expectedUpdatedAt, publishedAt, ...values } = input
  void expectedUpdatedAt
  return { ...values, ...(publishedAt !== undefined ? { publishedAt: toPostDate(publishedAt) } : {}), updatedAt: new Date() }
}

export async function updatePost(db: Database, id: string, input: UpdatePostInput, requestId: string) {
  if (input.categoryId) await assertCategoryAvailable(db, input.categoryId)
  const [updated] = await db.update(post).set(updateValues(input))
    .where(and(eq(post.id, id), eq(post.updatedAt, new Date(input.expectedUpdatedAt))))
    .returning()
  if (!updated) {
    const [existing] = await db.select({ id: post.id }).from(post).where(eq(post.id, id)).limit(1)
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Post not found')
    throw new HttpError(409, 'CONFLICT', 'Post changed since it was loaded')
  }
  await auditPost(db, 'post.update', updated.id, requestId, { slug: updated.slug, status: updated.status })
  return updated
}

export async function archivePost(db: Database, id: string, expectedUpdatedAt: string, requestId: string) {
  const [archived] = await db.update(post).set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(post.id, id), eq(post.updatedAt, new Date(expectedUpdatedAt))))
    .returning()
  if (!archived) {
    const [existing] = await db.select({ id: post.id }).from(post).where(eq(post.id, id)).limit(1)
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Post not found')
    throw new HttpError(409, 'CONFLICT', 'Post changed since it was loaded')
  }
  await auditPost(db, 'post.archive', archived.id, requestId, { slug: archived.slug, status: archived.status })
  return archived
}

export function databaseForRequest(): Database {
  return createDatabase()
}
