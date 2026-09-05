// @vitest-environment node
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { eq, sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { createPostInput, deletePostInput, listPostsQuery, updatePostInput } from '../../src/server/content-contract'
import { auditEvent, category, post, postSlugHistory, schema } from '../../src/server/schema'
import type { Database } from '../../src/server/db'
import { createPost, resolvePublishedSlug, updatePost } from '../../src/server/content'
import { migrate, preflightSlugHistory, seedIntroduction, type Migration } from '../../src/server/provision'

const validPost = {
  categoryId: '00000000-0000-4000-8000-000000000001',
  slug: 'durable-boundary',
  titleVi: 'Ranh giới bền vững',
  titleEn: 'A durable boundary',
  excerptVi: 'Tóm tắt',
  excerptEn: 'Summary',
  bodyVi: 'Nội dung',
  bodyEn: 'Body',
}

describe('content API contracts', () => {
  it('defaults new posts to draft and rejects invalid slugs', () => {
    expect(createPostInput.parse(validPost).status).toBe('draft')
    expect(createPostInput.safeParse({ ...validPost, slug: 'Not valid' }).success).toBe(false)
  })

  it('requires a publication timestamp for explicit publication', () => {
    expect(createPostInput.safeParse({ ...validPost, status: 'published' }).success).toBe(false)
    expect(createPostInput.safeParse({ ...validPost, status: 'published', publishedAt: '2026-09-05T00:00:00.000Z' }).success).toBe(true)
  })

  it('requires optimistic concurrency input for updates', () => {
    expect(updatePostInput.safeParse({ titleEn: 'Updated' }).success).toBe(false)
    expect(updatePostInput.safeParse({ titleEn: 'Updated', expectedUpdatedAt: '2026-09-05T00:00:00.000Z' }).success).toBe(true)
  })

  it('does not inject a default status into a partial update (R1 regression)', () => {
    const parsed = updatePostInput.parse({ titleEn: 'Updated', expectedUpdatedAt: '2026-09-05T00:00:00.000Z' })
    expect('status' in parsed).toBe(false)
    expect(updatePostInput.safeParse({ expectedUpdatedAt: '2026-09-05T00:00:00.000Z' }).success).toBe(false)
  })

  it('rejects a cover URL that is not actually parseable (R2 regression)', () => {
    const withCover = { ...validPost, coverImageAltVi: 'x', coverImageAltEn: 'x' }
    expect(createPostInput.safeParse({ ...withCover, coverImageUrl: 'https://' }).success).toBe(false)
    expect(createPostInput.safeParse({ ...withCover, coverImageUrl: 'https://example.test/cover.png' }).success).toBe(true)
  })

  it('uses the same optimistic concurrency guard for archive requests', () => {
    expect(deletePostInput.safeParse({ expectedUpdatedAt: '2026-09-05T00:00:00.000Z' }).success).toBe(true)
    expect(deletePostInput.safeParse({}).success).toBe(false)
  })

  it('bounds public list size', () => {
    expect(listPostsQuery.parse({ limit: '10' }).limit).toBe(10)
    expect(listPostsQuery.safeParse({ limit: '1000' }).success).toBe(false)
  })
})

let migrations: Migration[]
beforeAll(async () => {
  migrations = await Promise.all((await readdir('drizzle')).filter((name) => /^\d+.*\.sql$/.test(name)).map(async (name) => ({ name, source: await readFile(`drizzle/${name}`, 'utf8') })))
})
const historyMigration = '0004_post_slug_history.sql'
const publishedAt = new Date('2024-01-01T00:00:00Z')
const sqlPost = (categoryId: string, slug: string, status: 'draft' | 'published' | 'archived' = 'published') => ({ ...validPost, categoryId, slug, status, publishedAt })
async function withSql(run: (db: Database, categoryId: string) => Promise<void>, legacy = false) {
  const engine = new PGlite()
  const db = drizzle(engine, { schema }) as unknown as Database
  try {
    await migrate(db, legacy ? migrations.filter((migration) => migration.name !== historyMigration) : migrations)
    const [topic] = await db.insert(category).values({ slug: 'testing', nameEn: 'Testing', nameVi: 'Kiểm thử' }).returning()
    await run(db, topic.id)
  } finally { await engine.close() }
}

describe('permanent published slug ownership in disposable SQL', () => {
  it('migrates and replays, guards direct SQL, preserves ownership and never registers draft-only slugs', async () => {
    await withSql(async (db, categoryId) => {
      expect(await migrate(db, migrations)).toEqual([])
      const [article] = await db.insert(post).values(sqlPost(categoryId, 'alpha')).returning()
      await db.update(post).set({ slug: 'beta' }).where(eq(post.id, article.id))
      await db.update(post).set({ slug: 'gamma' }).where(eq(post.id, article.id))
      const history = await db.select().from(postSlugHistory).where(eq(postSlugHistory.postId, article.id)).orderBy(postSlugHistory.slug)
      expect(history.map((row) => row.slug)).toEqual(['alpha', 'beta', 'gamma'])
      expect(await resolvePublishedSlug(db, 'alpha')).toBe('gamma')
      expect(await resolvePublishedSlug(db, 'beta')).toBe('gamma')
      expect(await resolvePublishedSlug(db, 'gamma')).toBeUndefined()
      await expect(db.update(post).set({ slug: 'alpha' }).where(eq(post.id, article.id))).rejects.toMatchObject({ cause: { code: '23505', constraint: 'post_slug_history_owner' } })
      await expect(db.insert(post).values(sqlPost(categoryId, 'beta', 'draft'))).rejects.toMatchObject({ cause: { code: '23505' } })
      await db.update(post).set({ status: 'draft' }).where(eq(post.id, article.id))
      expect(await resolvePublishedSlug(db, 'alpha')).toBeUndefined()
      await db.update(post).set({ status: 'archived' }).where(eq(post.id, article.id))
      expect(await db.select().from(postSlugHistory).where(eq(postSlugHistory.postId, article.id))).toHaveLength(3)
      const [draft] = await db.insert(post).values(sqlPost(categoryId, 'draft-before', 'draft')).returning()
      await db.update(post).set({ slug: 'draft-after' }).where(eq(post.id, draft.id))
      await db.insert(post).values(sqlPost(categoryId, 'draft-before', 'draft'))
      expect(await db.select().from(postSlugHistory).where(eq(postSlugHistory.postId, draft.id))).toHaveLength(0)
      await db.update(post).set({ status: 'published', publishedAt: new Date('2999-01-01T00:00:00Z') }).where(eq(post.id, draft.id))
      expect(await db.select().from(postSlugHistory).where(eq(postSlugHistory.postId, draft.id))).toHaveLength(1)
      await expect(db.insert(post).values(sqlPost(categoryId, 'alpha'))).rejects.toMatchObject({ cause: { code: '23505' } })
    })
  }, 30_000)

  it('backfills current and audited published slugs deterministically, counting unusable evidence', async () => {
    await withSql(async (db, categoryId) => {
      const [article] = await db.insert(post).values(sqlPost(categoryId, 'current')).returning()
      const [hidden] = await db.insert(post).values(sqlPost(categoryId, 'hidden-current', 'draft')).returning()
      const audit = (entityId: string, slug: string, createdAt = new Date('2024-03-01T00:00:00Z')) => ({ entity: 'post', entityId, action: 'post.update', requestId: 'fixture', beforeSummary: { slug, status: 'published' }, createdAt })
      await db.insert(auditEvent).values([
        audit(article.id, 'older'), audit(article.id, 'older', new Date('2024-02-01T00:00:00Z')),
        audit(hidden.id, 'hidden-published'), audit(article.id, 'INVALID SLUG'), audit(article.id, 'a'.repeat(181)),
        audit('missing-not-a-uuid', 'missing-post'),
        { ...audit(article.id, 'never-published'), beforeSummary: { slug: 'never-published', status: 'draft' } },
      ])
      expect(await preflightSlugHistory(db)).toEqual({ malformed: 2, missing: 1, multiOwner: 0, currentOwnerConflicts: 0 })
      expect(await migrate(db, migrations)).toEqual([historyMigration])
      const rows = await db.select().from(postSlugHistory).orderBy(postSlugHistory.slug)
      expect(rows.map((row) => row.slug)).toEqual(['current', 'hidden-published', 'older'])
      expect(rows.find((row) => row.slug === 'older')?.firstPublishedAt.toISOString()).toBe('2024-02-01T00:00:00.000Z')
      expect(rows.find((row) => row.slug === 'current')?.firstPublishedAt.toISOString()).toBe(publishedAt.toISOString())
      expect(await resolvePublishedSlug(db, 'hidden-published')).toBeUndefined()
      expect(await migrate(db, migrations)).toEqual([])
    }, true)
  }, 30_000)

  it.each(['multi-owner', 'current-owner'] as const)('rolls the entire migration back on %s ambiguity', async (conflict) => {
    await withSql(async (db, categoryId) => {
      const [first, second] = await db.insert(post).values([sqlPost(categoryId, 'first'), sqlPost(categoryId, 'second', 'draft')]).returning()
      const slug = conflict === 'multi-owner' ? 'ambiguous' : 'second'
      await db.insert(auditEvent).values({ entity: 'post', entityId: first.id, action: 'post.update', requestId: 'fixture', beforeSummary: { slug, status: 'published' } })
      if (conflict === 'multi-owner') await db.insert(auditEvent).values({ entity: 'post', entityId: second.id, action: 'post.update', requestId: 'fixture', beforeSummary: { slug, status: 'published' } })
      const preflight = await preflightSlugHistory(db)
      expect(conflict === 'multi-owner' ? preflight.multiOwner : preflight.currentOwnerConflicts).toBe(1)
      await expect(migrate(db, migrations)).rejects.toMatchObject({ cause: { code: '23505', constraint: 'post_slug_history_backfill_owner' } })
      expect((await db.execute(sql`select to_regclass('post_slug_history') as name`)).rows[0].name).toBeNull()
      expect((await db.execute(sql`select name from osblog_migration where name = ${historyMigration}`)).rows).toHaveLength(0)
      expect((await db.select().from(post).where(eq(post.id, second.id)))[0].slug).toBe('second')
    }, true)
  }, 30_000)

  it('arbitrates competing application writes and rolls failed ownership changes back with their audits', async () => {
    await withSql(async (db, categoryId) => {
      const input = (slug: string) => createPostInput.parse({ ...sqlPost(categoryId, slug), publishedAt: publishedAt.toISOString() })
      const a = await createPost(db, input('race-a'), 'create-a', 'fixture')
      const b = await createPost(db, input('race-b'), 'create-b', 'fixture')
      const attempts = await Promise.allSettled([
        updatePost(db, a.id, { slug: 'race-target', expectedUpdatedAt: a.updatedAt.toISOString() }, 'race-a', 'fixture'),
        updatePost(db, b.id, { slug: 'race-target', expectedUpdatedAt: b.updatedAt.toISOString() }, 'race-b', 'fixture'),
      ])
      expect(attempts.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
      expect(attempts.filter((result) => result.status === 'rejected')).toHaveLength(1)
      expect(await db.select().from(auditEvent).where(eq(auditEvent.action, 'post.update'))).toHaveLength(1)
      await expect(createPost(db, input('race-a'), 'reuse', 'fixture')).rejects.toMatchObject({ cause: { code: '23505' } })
      expect(await db.select().from(post)).toHaveLength(2)
      const winner = (await db.select().from(post).where(eq(post.slug, 'race-target')))[0]
      expect((await db.select().from(postSlugHistory).where(eq(postSlugHistory.slug, 'race-target')))[0].postId).toBe(winner.id)
      await expect(updatePost(db, winner.id, { titleEn: 'stale', expectedUpdatedAt: a.updatedAt.toISOString() }, 'stale', 'fixture')).rejects.toMatchObject({ status: 409 })
    })
  }, 30_000)

  it('keeps optional seed reruns idempotent after a published seed is renamed', async () => {
    await withSql(async (db) => {
      expect(await seedIntroduction(db)).toHaveLength(3)
      const [seed] = await db.select().from(post).where(eq(post.slug, 'welcome-to-osblog'))
      await db.update(post).set({ slug: 'welcome-renamed' }).where(eq(post.id, seed.id))
      expect(await seedIntroduction(db)).toEqual([])
      expect(await db.select().from(post)).toHaveLength(3)
      expect(await resolvePublishedSlug(db, 'welcome-to-osblog')).toBe('welcome-renamed')
    })
  }, 30_000)
})
