import { randomBytes } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { schema } from '../../../src/server/schema'
import type { Database } from '../../../src/server/db'
import { bootstrapAdmin, migrate } from '../../../src/server/provision'
import { createApp } from '../../../src/entry-server'
import { updatePostInput } from '../../../src/server/content-contract'

// All data is generated in memory; the actual router and React SSR renderer are used.
const engine = new PGlite()
const db = drizzle(engine, { schema }) as unknown as Database
const origin = 'https://audit.example.test'
const env = {
  NODE_ENV: 'test', SITE_URL: origin, BETTER_AUTH_URL: origin,
  ADMIN_EMAIL: 'audit-editor@example.test',
  BETTER_AUTH_SECRET: randomBytes(48).toString('base64url'),
  COMMENT_EMAIL_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
}
const password = 'Independent-fixture-password-2026!'
const app = createApp({ env, database: db })
let cookie = '', categoryId = ''
const headers = () => ({ origin, 'content-type': 'application/json', cookie })
const request = (path: string, method = 'GET', body?: unknown, extra: Record<string, string> = {}) =>
  app(new Request(origin + path, { method, headers: { ...headers(), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body) }), { ip: '192.0.2.48' })
async function createPublished(slug: string, extra: Record<string, unknown> = {}) {
  const response = await request('/api/admin/posts', 'POST', {
    categoryId, slug, titleEn: slug, titleVi: 'Bài viết thử', excerptEn: 'Audit fixture', excerptVi: 'Thử nghiệm',
    bodyEn: '# Real Markdown\n\n**safe**', bodyVi: '# Nội dung',
    status: 'published', publishedAt: new Date(Date.now() - 1000).toISOString(), ...extra,
  })
  expect(response.status, await response.clone().text()).toBe(201)
  return (await response.json()).data
}
beforeAll(async () => {
  const migrations = await Promise.all((await readdir('drizzle')).filter((name) => /^\d+.*\.sql$/.test(name))
    .map(async (name) => ({ name, source: await readFile(`drizzle/${name}`, 'utf8') })))
  await migrate(db, migrations)
  await bootstrapAdmin(db, env, password)
  const login = await request('/api/auth/sign-in/email', 'POST', { email: env.ADMIN_EMAIL, password })
  expect(login.status).toBe(200)
  expect(login.headers.get('set-cookie')).toMatch(/Secure/)
  cookie = login.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  const response = await request('/api/admin/categories', 'POST', { slug: 'audit', nameEn: 'Audit', nameVi: 'Kiểm tra' })
  expect(response.status).toBe(201)
  categoryId = (await response.json()).data.id
})
afterAll(async () => { await engine.close() })

describe('UA-0048 concrete defect reproductions (passing means defect observed)', () => {
  it('R1: title-only PATCH unexpectedly unpublishes an existing article', async () => {
    const article = await createPublished('partial-update')
    expect((await request('/post/partial-update')).status).toBe(200)
    const patch = { titleEn: 'Corrected title', expectedUpdatedAt: article.updatedAt }
    expect(updatePostInput.parse(patch).status).toBe('draft')
    const response = await request(`/api/admin/posts/${article.id}`, 'PATCH', patch)
    expect(response.status).toBe(200)
    expect((await response.json()).data.status).toBe('draft')
    expect((await request('/api/posts/slug/partial-update')).status).toBe(404)
    expect((await request('/post/partial-update')).status).toBe(404)
    const emptyPatch = updatePostInput.safeParse({ expectedUpdatedAt: article.updatedAt })
    expect(emptyPatch.success).toBe(true)
    console.info('R1: title-only PATCH -> 200/draft; public API and real SSR -> 404; timestamp-only PATCH accepted')
  })

  it('R2: invalid absolute cover URL persists and breaks real article SSR', async () => {
    const article = await createPublished('invalid-cover', {
      coverImageUrl: 'https://', coverImageAltEn: 'Cover', coverImageAltVi: 'Ảnh bìa',
    })
    expect(article.coverImageUrl).toBe('https://')
    expect((await request('/api/posts/slug/invalid-cover')).status).toBe(200)
    const response = await request('/post/invalid-cover')
    expect(response.status).toBe(500)
    expect(await response.text()).toContain('Temporarily unable to load this page')
    console.info('R2: published POST with coverImageUrl=https:// -> 201; public API -> 200; real article SSR -> 500')
  })

  it('R3: admin session renewal updates SQL expiry but discards refreshed cookies', async () => {
    // Age only fixture rows past the one-hour refresh threshold; no clock or live DB mutation.
    await db.execute(sql`update session set expires_at = now() + interval '6 hours', updated_at = now() - interval '2 hours'`)
    const before = await db.execute<{ expiry: number }>(sql`select extract(epoch from expires_at)::double precision as expiry from session`)
    const response = await request('/api/admin/session')
    expect(response.status).toBe(200)
    const after = await db.execute<{ expiry: number }>(sql`select extract(epoch from expires_at)::double precision as expiry from session`)
    expect(Number(after.rows[0].expiry) - Number(before.rows[0].expiry)).toBeGreaterThan(7100)
    expect(response.headers.getSetCookie()).toEqual([])
    // The exposed Better Auth endpoint provides the cookie when it owns the response.
    await db.execute(sql`update session set expires_at = now() + interval '6 hours', updated_at = now() - interval '2 hours'`)
    const native = await request('/api/auth/get-session')
    expect(native.status).toBe(200)
    expect(native.headers.getSetCookie().length).toBeGreaterThan(0)
    expect(native.headers.get('set-cookie')).toMatch(/Secure/)
    console.info('R3: admin GET -> expiry extended by ~2h, zero Set-Cookie; native auth GET -> Set-Cookie present')
  })
})

describe('UA-0048 focused protective checks', () => {
  it('rolls back a content mutation when the audit insert fails', async () => {
    const article = await createPublished('audit-atomicity')
    // An isolated trigger injects an audit failure and is removed before the next check.
    await db.execute(sql.raw("CREATE FUNCTION review_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture audit failure'; END $$"))
    await db.execute(sql.raw('CREATE TRIGGER review_fail_audit BEFORE INSERT ON audit_event FOR EACH ROW EXECUTE FUNCTION review_fail_audit()'))
    try {
      const response = await request(`/api/admin/posts/${article.id}`, 'PATCH', {
        titleEn: 'Must roll back', status: 'published', publishedAt: article.publishedAt, expectedUpdatedAt: article.updatedAt,
      })
      expect(response.status).toBe(500)
      const stored = (await (await request(`/api/admin/posts/${article.id}`)).json()).data
      expect(stored.titleEn).toBe(article.titleEn)
      expect(stored.updatedAt).toBe(article.updatedAt)
      expect(await response.text()).not.toContain('fixture audit failure')
    } finally {
      await db.execute(sql.raw('DROP TRIGGER review_fail_audit ON audit_event'))
      await db.execute(sql.raw('DROP FUNCTION review_fail_audit()'))
    }
  })

  it('rejects missing Origin, cross-site requests, malformed JSON and oversized bodies', async () => {
    const url = origin + '/api/admin/posts'
    expect((await app(new Request(url, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' }))).status).toBe(403)
    expect((await request('/api/admin/posts', 'POST', {}, { 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect((await app(new Request(url, { method: 'POST', headers: headers(), body: '{' }))).status).toBe(400)
    expect((await app(new Request(url, { method: 'POST', headers: headers(), body: 'x'.repeat(768 * 1024 + 1) }))).status).toBe(413)
  })

  it('keeps hostile Markdown inert in actual React SSR and preserves hydration JSON', async () => {
    const hostile = '</script><script>globalThis.auditXss=1</script>\n\n[link](javascript:alert(1))'
    await createPublished('hostile-markdown', { bodyEn: hostile })
    const response = await request('/post/hostile-markdown')
    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).not.toContain('<script>globalThis.auditXss=1</script>')
    expect(html).not.toContain('href="javascript:')
    const payload = html.match(/<script id="osblog-data"[^>]*>(.*?)<\/script>/s)?.[1]
    expect(JSON.parse(payload!).post.bodyEn).toBe(hostile)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
