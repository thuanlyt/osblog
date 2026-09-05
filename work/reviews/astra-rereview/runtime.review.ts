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
import { createPostInput, updatePostInput } from '../../../src/server/content-contract'

// Fresh SQL and generated fixture credentials; no environment-file or provider access.
const engine = new PGlite()
const db = drizzle(engine, { schema }) as unknown as Database
const origin = 'https://rereview.example.test'
const env = {
  NODE_ENV: 'test', SITE_URL: origin, BETTER_AUTH_URL: origin,
  ADMIN_EMAIL: 'reviewer@example.test',
  BETTER_AUTH_SECRET: randomBytes(48).toString('base64url'),
  COMMENT_EMAIL_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
}
const password = 'Independent-review-fixture-2026!'
const app = createApp({ env, database: db })
let cookie = '', categoryId = ''
const request = (path: string, method = 'GET', body?: unknown, suppliedCookie = cookie) =>
  app(new Request(origin + path, {
    method, headers: { origin, 'content-type': 'application/json', cookie: suppliedCookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  }), { ip: '192.0.2.53' })
const payload = (slug: string, extra: Record<string, unknown> = {}) => ({
  categoryId, slug, titleEn: slug, titleVi: 'Bài viết thử', excerptEn: 'Review fixture', excerptVi: 'Thử nghiệm',
  bodyEn: '# Real Markdown\n\n**visible text**', bodyVi: '# Nội dung',
  status: 'published', publishedAt: new Date(Date.now() - 1000).toISOString(), ...extra,
})
async function createPublished(slug: string, extra: Record<string, unknown> = {}) {
  const response = await request('/api/admin/posts', 'POST', payload(slug, extra))
  expect(response.status, await response.clone().text()).toBe(201)
  return (await response.json()).data
}
async function counts() {
  const result = await db.execute(sql`select (select count(*)::int from post) as posts, (select count(*)::int from audit_event) as audits`)
  return result.rows[0]
}
async function stored(id: string) {
  const response = await request(`/api/admin/posts/${id}`)
  expect(response.status).toBe(200)
  return (await response.json()).data
}
async function ageSession() {
  await db.execute(sql`update session set expires_at = now() + interval '6 hours', updated_at = now() - interval '2 hours'`)
  return expiry()
}
async function expiry() {
  const result = await db.execute<{ expiry: number }>(sql`select extract(epoch from expires_at)::double precision as expiry from session`)
  return Number(result.rows[0].expiry)
}
function assertRenewal(response: Response) {
  const cookies = response.headers.getSetCookie()
  const tokens = cookies.filter((value) => value.startsWith('__Secure-better-auth.session_token='))
  expect(tokens).toHaveLength(1)
  expect(tokens[0]).toMatch(/Max-Age=28800/i)
  expect(tokens[0]).toMatch(/; HttpOnly/i)
  expect(tokens[0]).toMatch(/; Secure/i)
  expect(tokens[0]).toMatch(/; SameSite=Lax/i)
  expect(tokens[0]).toMatch(/; Path=\//i)
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  return tokens[0].split(';')[0]
}
beforeAll(async () => {
  const migrations = await Promise.all((await readdir('drizzle')).filter((name) => /^\d+.*\.sql$/.test(name))
    .map(async (name) => ({ name, source: await readFile(`drizzle/${name}`, 'utf8') })))
  await migrate(db, migrations)
  await bootstrapAdmin(db, env, password)
  const login = await request('/api/auth/sign-in/email', 'POST', { email: env.ADMIN_EMAIL, password })
  expect(login.status).toBe(200)
  cookie = login.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ')
  const category = await request('/api/admin/categories', 'POST', { slug: 'review', nameEn: 'Review', nameVi: 'Kiểm tra' })
  expect(category.status).toBe(201)
  categoryId = (await category.json()).data.id
})
afterAll(async () => { await engine.close() })

describe('UA-0053 corrected behavior: real SQL, Better Auth and React SSR', () => {
  it('R1 preserves publication and unchanged fields in SQL, public API, both SSR languages and sitemap', async () => {
    const article = await createPublished('partial-title')
    const patch = { titleEn: 'Corrected publication title', expectedUpdatedAt: article.updatedAt }
    expect(Object.hasOwn(updatePostInput.parse(patch), 'status')).toBe(false)
    const response = await request(`/api/admin/posts/${article.id}`, 'PATCH', patch)
    expect(response.status).toBe(200)
    const result = (await response.json()).data
    expect(result).toMatchObject({ status: 'published', publishedAt: article.publishedAt, titleEn: patch.titleEn, titleVi: article.titleVi, bodyEn: article.bodyEn })
    expect(result.updatedAt).not.toBe(article.updatedAt)
    expect(await stored(article.id)).toMatchObject({ status: 'published', publishedAt: article.publishedAt, titleEn: patch.titleEn })
    expect((await request('/api/posts/slug/partial-title')).status).toBe(200)
    for (const lang of ['en', 'vi']) {
      const page = await request(`/post/partial-title?lang=${lang}`)
      expect(page.status).toBe(200)
      const html = await page.text()
      const data = JSON.parse(html.match(/<script id="osblog-data"[^>]*>(.*?)<\/script>/s)![1])
      expect(data.post.status).toBe('published')
      expect(data.post.titleEn).toBe(patch.titleEn)
      if (lang === 'en') expect(html).toContain('<strong>visible text</strong>')
    }
    expect(await (await request('/sitemap.xml')).text()).toContain('/post/partial-title')
    const before = await counts()
    for (const empty of [{ expectedUpdatedAt: result.updatedAt }, { expectedUpdatedAt: result.updatedAt, unknown: 'ignored' }]) {
      const rejected = await request(`/api/admin/posts/${article.id}`, 'PATCH', empty)
      expect(rejected.status).toBe(400)
      expect((await rejected.json()).error.code).toBe('INVALID_INPUT')
    }
    expect((await stored(article.id)).updatedAt).toBe(result.updatedAt)
    expect(await counts()).toEqual(before)
    expect((await request(`/api/admin/posts/${article.id}`, 'PATCH', patch)).status).toBe(409)
  })

  it('R1 keeps the draft creation default and preserves draft/archived status on partial updates', async () => {
    const input = payload('new-draft')
    const { status: _status, publishedAt: _date, ...draft } = input
    expect(createPostInput.parse(draft).status).toBe('draft')
    for (const status of ['draft', 'archived']) {
      const article = await createPublished(`partial-${status}`, { status, publishedAt: null })
      const response = await request(`/api/admin/posts/${article.id}`, 'PATCH', { titleEn: 'Corrected', expectedUpdatedAt: article.updatedAt })
      expect(response.status).toBe(200)
      expect((await response.json()).data).toMatchObject({ status, publishedAt: null })
      expect((await request(`/api/posts/slug/${article.slug}`)).status).toBe(404)
    }
  })

  it('R2 rejects malformed cover URLs on CREATE and PATCH without post or audit persistence', async () => {
    const article = await createPublished('cover-remains-valid', { coverImageUrl: '/assets/cover-open-ideas.svg', coverImageAltEn: 'Cover', coverImageAltVi: 'Ảnh' })
    const before = await counts()
    for (const [index, coverImageUrl] of ['https://', 'http://', 'https://[broken', 'https://example.test:99999/x'].entries()) {
      const create = await request('/api/admin/posts', 'POST', payload(`bad-cover-${index}`, { coverImageUrl, coverImageAltEn: 'Cover', coverImageAltVi: 'Ảnh' }))
      expect(create.status).toBe(400)
      const patch = await request(`/api/admin/posts/${article.id}`, 'PATCH', { coverImageUrl, expectedUpdatedAt: article.updatedAt })
      expect(patch.status).toBe(400)
      expect((await patch.json()).error.code).toBe('INVALID_INPUT')
      const rows = await db.execute(sql`select count(*)::int as count from post where slug = ${`bad-cover-${index}`}`)
      expect(rows.rows[0].count).toBe(0)
    }
    expect(await counts()).toEqual(before)
    expect(await stored(article.id)).toMatchObject({ coverImageUrl: article.coverImageUrl, updatedAt: article.updatedAt })
    expect((await request(`/post/${article.slug}`)).status).toBe(200)
    const valid = await createPublished('valid-absolute-cover', { coverImageUrl: 'https://example.test/cover.png', coverImageAltEn: 'Cover', coverImageAltVi: 'Ảnh' })
    expect((await request(`/post/${valid.slug}`)).status).toBe(200)
  })

  it.each([
    ['/api/admin/session', 'GET', undefined, 200],
    ['/api/admin/posts', 'GET', undefined, 200],
    ['/api/admin/unknown', 'GET', undefined, 404],
    ['/api/admin/posts', 'POST', {}, 400],
    ['/admin', 'GET', undefined, 200],
    ['/admin/posts', 'HEAD', undefined, 200],
    ['/api/auth/get-session', 'GET', undefined, 200],
  ])('R3 propagates secure renewed cookies on %s %s, including failures and HEAD', async (path, method, body, expected) => {
    const before = await ageSession()
    const response = await request(path, method, body)
    expect(response.status).toBe(expected)
    const renewedCookie = assertRenewal(response)
    expect(await expiry() - before).toBeGreaterThan(7100)
    expect((await request('/api/admin/session', 'GET', undefined, renewedCookie)).status).toBe(200)
    if (method === 'HEAD') expect(await response.text()).toBe('')
  })

  it('R3 forwards renewal on forbidden API/SSR while maintaining the role guard', async () => {
    await db.execute(sql`update "user" set role = 'reader'`)
    try {
      for (const path of ['/api/admin/session', '/admin']) {
        const before = await ageSession()
        const response = await request(path)
        expect(response.status).toBe(403)
        assertRenewal(response)
        expect(await expiry() - before).toBeGreaterThan(7100)
      }
    } finally { await db.execute(sql`update "user" set role = 'admin'`) }
  })

  it('R3 keeps cookie collectors isolated between simultaneous authenticated and guest requests', async () => {
    await ageSession()
    const [authenticated, guest] = await Promise.all([request('/api/admin/session'), request('/api/admin/session', 'GET', undefined, '')])
    expect(authenticated.status).toBe(200)
    assertRenewal(authenticated)
    expect(guest.status).toBe(401)
    expect(guest.headers.getSetCookie()).toEqual([])
  })

  it('R3 preserves the native authentication failure and cookie clearing when renewal cannot update its SQL row', async () => {
    await ageSession()
    // Fault injection into this review's in-memory SQL only. Returning no refreshed row
    // exercises Better Auth's documented-in-source concurrent-deletion failure branch.
    await db.execute(sql.raw('CREATE FUNCTION review_skip_session_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$'))
    await db.execute(sql.raw('CREATE TRIGGER review_skip_session_update BEFORE UPDATE ON session FOR EACH ROW EXECUTE FUNCTION review_skip_session_update()'))
    try {
      const native = await request('/api/auth/get-session')
      const api = await request('/api/admin/session')
      const ssr = await request('/admin')
      console.info('R3 renewal-failure control:', JSON.stringify([
        { route: 'native', status: native.status, cookies: native.headers.getSetCookie().length },
        { route: 'admin-api', status: api.status, cookies: api.headers.getSetCookie().length },
        { route: 'admin-ssr', status: ssr.status, cookies: ssr.headers.getSetCookie().length },
      ]))
      expect(native.status).toBe(401)
      expect(native.headers.getSetCookie().some((value) => /session_token=;.*Max-Age=0/i.test(value))).toBe(true)
      expect.soft(api.status).toBe(401)
      expect.soft(api.headers.getSetCookie()).toEqual(native.headers.getSetCookie())
      expect.soft([303, 401]).toContain(ssr.status)
      expect.soft(ssr.headers.getSetCookie()).toEqual(native.headers.getSetCookie())
    } finally {
      await db.execute(sql.raw('DROP TRIGGER review_skip_session_update ON session'))
      await db.execute(sql.raw('DROP FUNCTION review_skip_session_update()'))
    }
  })

  it('R3 preserves cookie deletion on expired-session SSR redirects and API 401s', async () => {
    await db.execute(sql`update session set expires_at = now() - interval '1 hour'`)
    for (const path of ['/admin', '/api/admin/session']) {
      const response = await request(path)
      expect(response.status).toBe(path === '/admin' ? 303 : 401)
      if (path === '/admin') expect(response.headers.get('location')).toBe(origin + '/admin/login')
      const cookies = response.headers.getSetCookie()
      expect(cookies.some((value) => value.startsWith('__Secure-better-auth.session_token=;') && /Max-Age=0/i.test(value))).toBe(true)
      expect(cookies.length).toBeGreaterThan(1)
    }
  })
})
