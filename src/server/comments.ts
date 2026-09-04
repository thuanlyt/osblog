import { and, desc, eq, sql } from 'drizzle-orm'
import type { IncomingMessage } from 'node:http'
import { auditEvent, category, comment, post, rateLimitBucket } from './schema'
import { commentSecrets, encryptEmail, hashSensitive, isHoneypotSubmission, verifyCommentFormToken } from './comment-policy'
import type { CommentSubmissionInput, ModerationInput } from './comment-contract'
import { createDatabase, type Database } from './db'
import { HttpError } from './http'
import { requireAdminSession } from './content'

export interface CommentRequestContext {
  ipAddress: string
  userAgent: string
}

export async function consumeRateLimit(db: Database, key: string, now = new Date(), max = 5, windowMs = 60 * 60 * 1000): Promise<boolean> {
  const expiresAt = new Date(now.getTime() + windowMs)
  const [bucket] = await db.insert(rateLimitBucket).values({
    key,
    windowStart: now,
    count: 1,
    expiresAt,
  }).onConflictDoUpdate({
    target: rateLimitBucket.key,
    set: {
      count: sql`CASE WHEN ${rateLimitBucket.expiresAt} <= ${now} THEN 1 ELSE ${rateLimitBucket.count} + 1 END`,
      windowStart: sql`CASE WHEN ${rateLimitBucket.expiresAt} <= ${now} THEN ${now} ELSE ${rateLimitBucket.windowStart} END`,
      expiresAt: sql`CASE WHEN ${rateLimitBucket.expiresAt} <= ${now} THEN ${expiresAt} ELSE ${rateLimitBucket.expiresAt} END`,
    },
  }).returning({ count: rateLimitBucket.count })
  return Boolean(bucket && bucket.count <= max)
}

export async function submitComment(db: Database, input: CommentSubmissionInput, context: CommentRequestContext, requestId: string) {
  const { authSecret, encryptionKey } = commentSecrets()
  if (!verifyCommentFormToken(input.formToken, authSecret)) throw new HttpError(400, 'INVALID_FORM_TOKEN', 'Comment form token is invalid or expired')

  const [publishedPost] = await db.select({ id: post.id }).from(post).innerJoin(category, eq(post.categoryId, category.id))
    .where(and(eq(post.id, input.postId), eq(post.status, 'published'), eq(category.isArchived, false))).limit(1)
  if (!publishedPost) throw new HttpError(404, 'NOT_FOUND', 'Published post not found')

  const email = input.email.trim().toLowerCase()
  const emailHash = hashSensitive(email, authSecret)
  const ipHash = hashSensitive(context.ipAddress, authSecret)
  const userAgentHash = hashSensitive(context.userAgent, authSecret)
  const allowedByIp = await consumeRateLimit(db, `comment:ip:${ipHash}`)
  const allowedByEmail = await consumeRateLimit(db, `comment:email:${emailHash}`)
  if (!allowedByIp || !allowedByEmail) throw new HttpError(429, 'RATE_LIMITED', 'Comment rate limit exceeded')

  const status = isHoneypotSubmission(input.honeypot) ? 'spam' : 'pending'
  const [created] = await db.insert(comment).values({
    postId: input.postId,
    emailCiphertext: encryptEmail(email, encryptionKey),
    emailHash,
    body: input.body.trim(),
    status,
    ipHash,
    userAgentHash,
  }).returning({ id: comment.id, status: comment.status })
  if (!created) throw new HttpError(500, 'CREATE_FAILED', 'Comment could not be accepted')

  await db.insert(auditEvent).values({
    action: 'comment.submit',
    entity: 'comment',
    entityId: created.id,
    requestId,
    afterSummary: { status: created.status },
  })
  return { accepted: true as const }
}

export async function listModerationComments(db: Database) {
  return db.select({
    id: comment.id,
    postId: comment.postId,
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt,
    reviewedAt: comment.reviewedAt,
    moderationReason: comment.moderationReason,
  }).from(comment).orderBy(desc(comment.createdAt))
}

export async function moderateComment(db: Database, id: string, input: ModerationInput, requestId: string, actorUserId?: string) {
  const [updated] = await db.update(comment).set({
    status: input.status,
    moderationReason: input.reason ?? null,
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(comment.id, id)).returning({ id: comment.id, status: comment.status, reviewedAt: comment.reviewedAt, moderationReason: comment.moderationReason })
  if (!updated) throw new HttpError(404, 'NOT_FOUND', 'Comment not found')
  await db.insert(auditEvent).values({
    actorUserId,
    action: `comment.${input.status}`,
    entity: 'comment',
    entityId: updated.id,
    requestId,
    afterSummary: { status: updated.status, moderationReason: updated.moderationReason },
  })
  return updated
}

export function clientContext(request: IncomingMessage): CommentRequestContext {
  const forwarded = request.headers['x-forwarded-for']
  const ipAddress = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : request.socket.remoteAddress ?? 'unknown'
  const userAgent = typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : 'unknown'
  return { ipAddress, userAgent }
}

export async function adminCommentRequest(request: IncomingMessage) {
  return requireAdminSession(request)
}

export function commentsDatabase(): Database {
  return createDatabase()
}
