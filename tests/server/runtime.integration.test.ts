// @vitest-environment node
import { randomBytes } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { sql } from 'drizzle-orm'
import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { schema } from '../../src/server/schema'
import type { Database } from '../../src/server/db'
import { migrate, bootstrapAdmin, seedIntroduction, type Migration } from '../../src/server/provision'
import { createRouter } from '../../src/server/router'
import { escapeHtml, renderDocument } from '../../src/server/seo'

const origin = 'http://localhost:5173'
// Isolated throwaway SQL database; never a production fallback or provider-deployment claim.
const engine = new PGlite()
const db = drizzle(engine, { schema }) as unknown as Database
const env = { NODE_ENV: 'test', SITE_URL: origin, BETTER_AUTH_URL: origin, ADMIN_EMAIL: 'editor@example.test', BETTER_AUTH_SECRET: randomBytes(32).toString('base64url'), COMMENT_EMAIL_ENCRYPTION_KEY: randomBytes(32).toString('base64') }
const password = 'Fixture-only-password-2026!'
const handler = createRouter({ database: db, env, render: (data, site, nonce) => renderDocument(`<main><h1>${escapeHtml(data.title)}</h1></main>`, data, site, nonce, { scripts: ['/assets/test.js'], styles: ['/assets/test.css'] }) })
let cookies = '', migrations: Migration[]
async function request(path: string, options: { method?: string; body?: unknown; cookie?: boolean; origin?: string; ip?: string } = {}) {
  const method = options.method ?? 'GET'
  return handler(new Request(origin + path, { method, headers: { ...(options.cookie ? { cookie: cookies } : {}), ...(method !== 'GET' ? { origin: options.origin ?? origin, 'content-type': 'application/json' } : {}) }, body: options.body !== undefined ? JSON.stringify(options.body) : undefined }), { ip: options.ip ?? '127.0.0.1' })
}
beforeAll(async () => {
  migrations = await Promise.all((await readdir('drizzle')).filter((name) => /^\d+.*\.sql$/.test(name)).map(async (name) => ({ name, source: await readFile(`drizzle/${name}`, 'utf8') })))
  await migrate(db, migrations)
  await bootstrapAdmin(db, env, password)
}, 30_000)
afterAll(async () => { await engine.close() })

describe('real SQL and Fetch runtime integration', () => {
  it('replays migrations safely and refuses checksum drift', async () => {
    expect(await migrate(db, migrations)).toEqual([])
    await expect(migrate(db, [{ ...migrations[0], source: migrations[0].source + '\n-- tampered' }])).rejects.toThrow('Applied migration changed')
    expect(await bootstrapAdmin(db, env, 'Different-fixture-password!')).toEqual({ created: false })
  })
  it('reports database health and blocks guests, signup and cross-origin writes', async () => {
    expect((await request('/api/healthz')).status).toBe(200)
    expect((await request('/api/admin/posts')).status).toBe(401)
    expect((await request('/admin/posts')).status).toBe(303)
    expect((await request('/api/auth/sign-up/email', { method: 'POST', body: {} })).status).toBe(404)
    expect((await request('/api/admin/posts', { method: 'POST', body: {}, origin: 'https://evil.test' })).status).toBe(403)
  })
  it('authenticates through Better Auth password hashing and database sessions', async () => {
    const failed = await request('/api/auth/sign-in/email', { method: 'POST', body: { email: env.ADMIN_EMAIL, password: 'not-the-password' } })
    expect(failed.status).toBe(401)
    const response = await request('/api/auth/sign-in/email', { method: 'POST', body: { email: env.ADMIN_EMAIL, password } })
    expect(response.status, await response.clone().text()).toBe(200)
    cookies = response.headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ')
    expect(cookies).toContain('session_token=')
    expect(response.headers.get('set-cookie')).toMatch(/HttpOnly/i)
    const session = await request('/api/admin/session', { cookie: true })
    expect((await session.json()).data.email).toBe(env.ADMIN_EMAIL)
    const rows = await db.execute(sql`select count(*) as count from session`)
    expect(Number(rows.rows[0].count)).toBe(1)
  })
  it('forwards renewed session cookies on both the admin API and SSR admin pages (R3 regression)', async () => {
    await db.execute(sql`update session set expires_at = now() + interval '6 hours'`)
    const apiRenewal = await request('/api/admin/session', { cookie: true })
    expect(apiRenewal.status).toBe(200)
    expect(apiRenewal.headers.getSetCookie().length).toBeGreaterThan(0)
    await db.execute(sql`update session set expires_at = now() + interval '6 hours'`)
    const ssrRenewal = await request('/admin', { cookie: true })
    expect(ssrRenewal.status).toBe(200)
    expect(ssrRenewal.headers.getSetCookie().length).toBeGreaterThan(0)
  })
  it('preserves cookie clearing when Better Auth cannot persist a session renewal', async () => {
    await db.execute(sql`update session set expires_at = now() + interval '6 hours'`)
    await db.execute(sql.raw('CREATE FUNCTION test_skip_session_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$'))
    await db.execute(sql.raw('CREATE TRIGGER test_skip_session_update BEFORE UPDATE ON session FOR EACH ROW EXECUTE FUNCTION test_skip_session_update()'))
    try {
      const api = await request('/api/admin/session', { cookie: true })
      expect(api.status).toBe(401)
      expect(api.headers.getSetCookie().some((value) => /session_token=;.*Max-Age=0/i.test(value))).toBe(true)
      const ssr = await request('/admin', { cookie: true })
      expect(ssr.status).toBe(303)
      expect(ssr.headers.get('location')).toBe(origin + '/admin/login')
      expect(ssr.headers.getSetCookie().some((value) => /session_token=;.*Max-Age=0/i.test(value))).toBe(true)
    } finally {
      await db.execute(sql.raw('DROP TRIGGER test_skip_session_update ON session'))
      await db.execute(sql.raw('DROP FUNCTION test_skip_session_update()'))
    }
  })
  let categoryId: string, categoryUpdated: string, postId: string, updatedAt: string
  it('creates categories and drafts, publishes Markdown, and prevents stale writes', async () => {
    const category = await request('/api/admin/categories', { method: 'POST', cookie: true, body: { slug: 'engineering', nameEn: 'Engineering', nameVi: 'Kỹ thuật' } })
    expect(category.status).toBe(201)
    const savedCategory = (await category.json()).data
    categoryId = savedCategory.id; categoryUpdated = savedCategory.updatedAt
    const payload = { categoryId, slug: 'real-sql-article', titleEn: 'Real SQL article', titleVi: 'Bài viết SQL thực', excerptEn: 'Read a real article.', excerptVi: 'Đọc bài viết thực.', bodyEn: '# Markdown\n\n**Strong** text.\n<script>alert(1)</script>', bodyVi: '# Markdown\n\n**Nội dung**.' }
    const created = await request('/api/admin/posts', { method: 'POST', cookie: true, body: payload })
    expect(created.status, await created.clone().text()).toBe(201)
    const draft = (await created.json()).data
    postId = draft.id; updatedAt = draft.updatedAt
    expect((await request('/api/posts/slug/real-sql-article')).status).toBe(404)
    const publish = await request(`/api/admin/posts/${postId}`, { method: 'PATCH', cookie: true, body: { status: 'published', publishedAt: new Date(Date.now() - 1000).toISOString(), expectedUpdatedAt: updatedAt, seoTitleEn: 'Custom SEO title' } })
    expect(publish.status, await publish.clone().text()).toBe(200)
    const published = (await publish.json()).data
    expect(published.updatedAt).not.toBe(updatedAt)
    const conflict = await request(`/api/admin/posts/${postId}`, { method: 'PATCH', cookie: true, body: { titleEn: 'Stale edit', expectedUpdatedAt: updatedAt } })
    expect(conflict.status).toBe(409)
    updatedAt = published.updatedAt
    expect((await request('/api/posts/slug/real-sql-article')).status).toBe(200)
    const duplicate = await request('/api/admin/posts', { method: 'POST', cookie: true, body: payload })
    expect(duplicate.status).toBe(409)
    expect((await duplicate.json()).error.code).toBe('SLUG_TAKEN')
    const audit = await db.execute(sql`select action from audit_event where entity_id = ${postId}`)
    expect(audit.rows.map((row) => row.action)).toEqual(['post.create', 'post.update'])
  })
  it('keeps a published article public through a title-only PATCH and rejects a timestamp-only PATCH (R1 regression)', async () => {
    const payload = { categoryId, slug: 'r1-regression-article', titleEn: 'R1 regression article', titleVi: 'Bài viết R1', excerptEn: 'Regression excerpt.', excerptVi: 'Tóm tắt.', bodyEn: 'Body.', bodyVi: 'Nội dung.', status: 'published', publishedAt: new Date(Date.now() - 1000).toISOString() }
    const created = await request('/api/admin/posts', { method: 'POST', cookie: true, body: payload })
    expect(created.status, await created.clone().text()).toBe(201)
    const draft = (await created.json()).data
    expect((await request('/api/posts/slug/r1-regression-article')).status).toBe(200)
    const titleOnly = await request(`/api/admin/posts/${draft.id}`, { method: 'PATCH', cookie: true, body: { titleEn: 'R1 corrected title', expectedUpdatedAt: draft.updatedAt } })
    expect(titleOnly.status, await titleOnly.clone().text()).toBe(200)
    const updated = (await titleOnly.json()).data
    expect(updated.status).toBe('published')
    expect((await request('/api/posts/slug/r1-regression-article')).status).toBe(200)
    const timestampOnly = await request(`/api/admin/posts/${draft.id}`, { method: 'PATCH', cookie: true, body: { expectedUpdatedAt: updated.updatedAt } })
    expect(timestampOnly.status).toBe(400)
  })
  it('rejects a malformed cover URL before persistence (R2 regression)', async () => {
    const payload = { categoryId, slug: 'r2-regression-article', titleEn: 'R2 regression article', titleVi: 'Bài viết R2', excerptEn: 'Regression excerpt.', excerptVi: 'Tóm tắt.', bodyEn: 'Body.', bodyVi: 'Nội dung.', coverImageUrl: 'https://', coverImageAltEn: 'alt', coverImageAltVi: 'thay thế' }
    const created = await request('/api/admin/posts', { method: 'POST', cookie: true, body: payload })
    expect(created.status).toBe(400)
    const rows = await db.execute(sql`select count(*) as count from post where slug = 'r2-regression-article'`)
    expect(Number(rows.rows[0].count)).toBe(0)
  })
  it('filters search/year/sort, deduplicates views and emits safe SEO and docs', async () => {
    const result = await (await request('/api/posts?q=real&category=engineering&sort=popular')).json()
    expect(result.data.total).toBe(1)
    expect(result.data.posts[0].bodyEn).toBeUndefined()
    expect((await (await request(`/api/posts/${postId}/view`, { method: 'POST', body: {} })).json()).data.counted).toBe(true)
    expect((await (await request(`/api/posts/${postId}/view`, { method: 'POST', body: {} })).json()).data.counted).toBe(false)
    const page = await request('/post/real-sql-article?lang=en')
    const html = await page.text()
    expect(html).toContain('<title>Custom SEO title — OSBlog</title>')
    expect(html).toContain('application/ld+json')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('\\u003cscript\\u003e')
    expect(page.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
    const viDocs = await request('/docs/editor?lang=vi')
    expect(viDocs.status).toBe(200)
    expect(await viDocs.text()).toContain('<html lang="vi">')
    const sitemap = await (await request('/sitemap.xml')).text()
    expect(sitemap).toContain('/post/real-sql-article?lang=vi')
    expect((await request('/does-not-exist')).status).toBe(404)
  })
  it('accepts email comments only into moderation and never publishes private identifiers', async () => {
    const token = (await (await request('/api/comments/token')).json()).data.formToken
    const body = { postId, email: 'reader@example.test', body: 'A real reader comment', formToken: token }
    const response = await request('/api/comments', { method: 'POST', body })
    expect(response.status).toBe(202)
    expect((await (await request(`/api/comments?postId=${postId}`)).json()).data).toEqual([])
    const stored = await db.execute(sql`select email_ciphertext, email_hash, ip_hash from comment where post_id = ${postId}::uuid`)
    expect(JSON.stringify(stored.rows)).not.toContain(body.email)
    expect(stored.rows[0].email_ciphertext).toMatch(/^v1:/)
    const pending = (await (await request('/api/admin/comments', { cookie: true })).json()).data[0]
    const approved = await request(`/api/admin/comments/${pending.id}`, { method: 'PATCH', cookie: true, body: { status: 'approved', expectedUpdatedAt: pending.updatedAt } })
    expect(approved.status).toBe(200)
    const publicBody = await (await request(`/api/comments?postId=${postId}`)).json()
    expect(publicBody.data[0].body).toBe(body.body)
    expect(Object.keys(publicBody.data[0]).sort()).toEqual(['body', 'createdAt', 'id'])
    for (let index = 0; index < 4; index++) expect((await request('/api/comments', { method: 'POST', body: { ...body, honeypot: 'bot' } })).status).toBe(202)
    expect((await request('/api/comments', { method: 'POST', body })).status).toBe(429)
    const count = await db.execute(sql`select count(*) as count from comment`)
    expect(Number(count.rows[0].count)).toBe(1)
  })
  it('archives categories without data loss and hides all associated public surfaces', async () => {
    const response = await request(`/api/admin/categories/${categoryId}`, { method: 'DELETE', cookie: true, body: { expectedUpdatedAt: categoryUpdated } })
    expect(response.status).toBe(200)
    expect((await request('/api/posts/slug/real-sql-article')).status).toBe(404)
    expect((await request(`/api/comments?postId=${postId}`)).status).toBe(404)
    expect((await request(`/api/admin/posts/${postId}`, { cookie: true })).status).toBe(200)
    expect(await (await request('/sitemap.xml')).text()).not.toContain('/post/real-sql-article')
  })
  it('adds bilingual introduction only once and invalidates logout sessions', async () => {
    expect((await seedIntroduction(db)).length).toBe(3)
    expect(await seedIntroduction(db)).toEqual([])
    const seeded = await db.execute(sql`select slug, cover_image_url from post where slug in ('welcome-to-osblog', 'write-with-markdown', 'docs-beside-the-code') order by slug`)
    expect(seeded.rows).toEqual([
      { slug: 'docs-beside-the-code', cover_image_url: '/assets/cover-docs-code.svg' },
      { slug: 'welcome-to-osblog', cover_image_url: '/assets/cover-open-ideas.svg' },
      { slug: 'write-with-markdown', cover_image_url: '/assets/cover-markdown-editor.svg' },
    ])
    expect((await (await request('/api/posts?sort=random')).json()).data.total).toBe(3)
    expect((await request('/api/auth/sign-out', { method: 'POST', cookie: true, body: {} })).status).toBe(200)
    expect((await request('/api/admin/session', { cookie: true })).status).toBe(401)
  })
})
