import { and, desc, eq, sql } from 'drizzle-orm'
import { comment, rateLimitBucket } from './schema'
import { commentSecrets, encryptEmail, hashSensitive, isHoneypotSubmission, verifyCommentFormToken } from './comment-policy'
import type { CommentSubmissionInput, ModerationInput } from './comment-contract'
import type { Database, Store } from './db'
import { HttpError } from './http'
import { audit, getPublishedPostById, nextTimestamp } from './content'

export async function consumeRateLimit(db: Store, key: string, now = new Date(), max = 5, windowMs = 60 * 60 * 1000): Promise<boolean> {
  const expiresAt = new Date(now.getTime() + windowMs)
  const [bucket] = await db.insert(rateLimitBucket).values({ key, windowStart: now, count: 1, expiresAt }).onConflictDoUpdate({
    target: rateLimitBucket.key,
    set: {
      count: sql`CASE WHEN ${rateLimitBucket.expiresAt} <= ${now} THEN 1 ELSE LEAST(${rateLimitBucket.count} + 1, ${max + 1}) END`,
      windowStart: sql`CASE WHEN ${rateLimitBucket.expiresAt} <= ${now} THEN ${now} ELSE ${rateLimitBucket.windowStart} END`,
      expiresAt: sql`CASE WHEN ${rateLimitBucket.expiresAt} <= ${now} THEN ${expiresAt} ELSE ${rateLimitBucket.expiresAt} END`,
    },
  }).returning({ count: rateLimitBucket.count })
  return Boolean(bucket && bucket.count <= max)
}
export async function submitComment(db: Database, input: CommentSubmissionInput, context: { ipAddress: string; userAgent: string }, requestId: string, env: NodeJS.ProcessEnv) {
  const { authSecret, encryptionKey } = commentSecrets(env)
  if (!verifyCommentFormToken(input.formToken, authSecret)) throw new HttpError(400, 'INVALID_FORM_TOKEN', 'The form expired. Try again to receive a fresh token.')
  if (!await getPublishedPostById(db, input.postId)) throw new HttpError(404, 'NOT_FOUND', 'Published post not found')
  const email = input.email.trim().toLowerCase()
  const emailHash = hashSensitive(email, authSecret)
  const ipHash = hashSensitive(context.ipAddress, authSecret)
  const ipAllowed = await consumeRateLimit(db, `comment:ip:${ipHash}`)
  const emailAllowed = await consumeRateLimit(db, `comment:email:${emailHash}`)
  if (!ipAllowed || !emailAllowed) throw new HttpError(429, 'RATE_LIMITED', 'Too many comments. Please try again in an hour.')
  if (isHoneypotSubmission(input.honeypot)) return { accepted: true as const }
  return db.transaction(async (tx) => {
    const now = new Date()
    const [row] = await tx.insert(comment).values({ postId: input.postId, emailCiphertext: encryptEmail(email, encryptionKey), emailHash, ipHash,
      userAgentHash: hashSensitive(context.userAgent, authSecret), body: input.body, status: 'pending', createdAt: now, updatedAt: now }).returning()
    await audit(tx, 'comment.submit', 'comment', row.id, requestId, null, null, { status: row.status })
    return { accepted: true as const }
  })
}
export async function approvedComments(db: Store, postId: string) {
  return db.select({ id: comment.id, body: comment.body, createdAt: comment.createdAt }).from(comment)
    .where(and(eq(comment.postId, postId), eq(comment.status, 'approved'))).orderBy(desc(comment.createdAt)).limit(100)
}
export async function listModerationComments(db: Store) {
  return db.select({ id: comment.id, postId: comment.postId, body: comment.body, status: comment.status, createdAt: comment.createdAt,
    updatedAt: comment.updatedAt, reviewedAt: comment.reviewedAt, moderationReason: comment.moderationReason }).from(comment).orderBy(desc(comment.createdAt)).limit(200)
}
export async function moderateComment(db: Database, id: string, input: ModerationInput, requestId: string, actor: string) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(comment).where(eq(comment.id, id)).for('update')
    if (!before) throw new HttpError(404, 'NOT_FOUND', 'Comment not found')
    if (before.updatedAt.toISOString() !== new Date(input.expectedUpdatedAt).toISOString()) throw new HttpError(409, 'CONFLICT', 'This comment changed. Reload it before moderating.')
    const [row] = await tx.update(comment).set({ status: input.status, body: input.body ?? before.body, moderationReason: input.reason ?? null,
      reviewedAt: new Date(), updatedAt: nextTimestamp(before.updatedAt) }).where(eq(comment.id, id)).returning({ id: comment.id, status: comment.status, updatedAt: comment.updatedAt })
    await audit(tx, 'comment.moderate', 'comment', id, requestId, actor, { status: before.status }, { status: row.status })
    return row
  })
}
export async function deleteComment(db: Database, id: string, expectedUpdatedAt: string, requestId: string, actor: string) {
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(comment).where(eq(comment.id, id)).for('update')
    if (!before) throw new HttpError(404, 'NOT_FOUND', 'Comment not found')
    if (before.updatedAt.toISOString() !== new Date(expectedUpdatedAt).toISOString()) throw new HttpError(409, 'CONFLICT', 'This comment changed. Reload before deleting.')
    await tx.delete(comment).where(eq(comment.id, id))
    await audit(tx, 'comment.delete', 'comment', id, requestId, actor, { status: before.status }, null)
    return { deleted: true }
  })
}
