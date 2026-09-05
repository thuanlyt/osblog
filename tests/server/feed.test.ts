// @vitest-environment node
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { eq } from 'drizzle-orm'
import { JSDOM } from 'jsdom'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { category, post, schema } from '../../src/server/schema'
import type { Database } from '../../src/server/db'
import { migrate } from '../../src/server/provision'
import { createRouter, type Renderer } from '../../src/server/router'
import { escapeXml } from '../../src/server/feed'

const origin = 'https://blog.example.test'
const atomNamespace = 'http://www.w3.org/2005/Atom'
const engine = new PGlite()
const db = drizzle(engine, { schema }) as unknown as Database
const dom = new JSDOM('')
const render = vi.fn<Renderer>(() => '<html>Fixture page</html>')
const handler = createRouter({ database: db, env: { NODE_ENV: 'test', SITE_URL: `${origin}/ignored/path`, BETTER_AUTH_URL: 'https://unused.example.test' }, render })
const uuid = (value: number) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`
const published = new Date('2024-01-01T12:00:00.000Z')
const updated = new Date('2024-02-03T14:15:16.000Z')
const title = `English & <title> "quoted" 'single' Tiếng Việt 🌿`
const excerpt = `Read **Markdown** & <img src=x onerror="alert(1)"> <script>alert(1)</script> ]]> &#60;b&#62; 'text' 🌿`

function fixture(value = 1, overrides: Partial<typeof post.$inferInsert> = {}): typeof post.$inferInsert {
  return { id: uuid(value), categoryId: uuid(101), slug: `post-${value}`, titleEn: title, titleVi: 'Tiếng Việt & <b>bài viết</b>',
    excerptEn: excerpt, excerptVi: 'Tóm tắt <script>alert(1)</script> & "an toàn".', bodyEn: 'PRIVATE-FULL-BODY-EN', bodyVi: 'PRIVATE-FULL-BODY-VI',
    status: 'published', publishedAt: published, updatedAt: updated, ...overrides }
}
function request(path: string, init: RequestInit = {}) {
  // Deliberately use a different request host: canonical links must use SSR configuration.
  return handler(new Request(`https://untrusted.example.test${path}`, init))
}
function xmlDocument(source: string) {
  expect(source).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/)
  const xml = new dom.window.DOMParser().parseFromString(source, 'application/xml')
  expect(xml.getElementsByTagName('parsererror')).toHaveLength(0)
  return xml
}
function text(node: Document | Element, name: string) { return node.getElementsByTagName(name)[0]?.textContent }
const formats = [
  { path: '/feed.xml', root: 'rss', entry: 'item', id: 'guid', type: 'application/rss+xml' },
  { path: '/feed.atom', root: 'feed', entry: 'entry', id: 'id', type: 'application/atom+xml' },
]

beforeAll(async () => {
  const migrations = await Promise.all((await readdir('drizzle')).filter((name) => /^\d+.*\.sql$/.test(name)).map(async (name) => ({ name, source: await readFile(`drizzle/${name}`, 'utf8') })))
  await migrate(db, migrations)
}, 30_000)
beforeEach(async () => {
  render.mockClear()
  await db.delete(post)
  await db.delete(category)
  await db.insert(category).values([
    { id: uuid(101), slug: 'active', nameEn: 'Active', nameVi: 'Đang dùng' },
    { id: uuid(102), slug: 'archived', nameEn: 'Archived', nameVi: 'Lưu trữ', isArchived: true },
  ])
})
afterAll(async () => { await engine.close(); dom.window.close() })

describe.each(formats)('$path with isolated SQL and XML parsing', (format) => {
  it('emits valid XML, canonical links, dates, safe excerpts and public response headers', async () => {
    await db.insert(post).values(fixture(1, { titleEn: title + '\u0001\ufffe', excerptEn: excerpt + '\u0002\uffff' }))
    const response = await request(format.path)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(`${format.type}; charset=utf-8`)
    expect(response.headers.get('content-language')).toBe('en')
    expect(response.headers.get('cache-control')).toBe('public, max-age=300, s-maxage=300')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('set-cookie')).toBeNull()
    const source = await response.text()
    expect(source).not.toMatch(/PRIVATE-FULL-BODY|untrusted\.example|unused\.example|<script>|<img|<!DOCTYPE|<!\[CDATA\[/)
    expect(source).not.toMatch(/&amp;(amp|lt|gt|quot|apos);/)
    const xml = xmlDocument(source)
    expect(xml.documentElement.localName).toBe(format.root)
    expect(xml.documentElement.getAttribute('xml:lang')).toBe('en')
    const entry = xml.getElementsByTagName(format.entry)[0]
    expect(text(entry, 'title')).toBe(title)
    expect(text(entry, format.id)).toBe(`urn:uuid:${uuid(1)}`)
    if (format.root === 'rss') {
      expect(xml.documentElement.getAttribute('version')).toBe('2.0')
      expect(text(xml, 'language')).toBe('en')
      expect(text(xml, 'lastBuildDate')).toBe(updated.toUTCString())
      expect(text(entry, 'pubDate')).toBe(published.toUTCString())
      expect(entry.getElementsByTagNameNS(atomNamespace, 'updated')[0].textContent).toBe(updated.toISOString())
      expect(entry.getElementsByTagName('guid')[0].getAttribute('isPermaLink')).toBe('false')
      expect(text(entry, 'link')).toBe(`${origin}/post/post-1?lang=en`)
      expect(text(entry, 'description')).toBe(excerpt)
      expect(entry.getElementsByTagName('description')[0].childElementCount).toBe(0)
      expect(xml.getElementsByTagNameNS(atomNamespace, 'link')[0].getAttribute('href')).toBe(`${origin}/feed.xml?lang=en`)
    } else {
      expect(xml.documentElement.namespaceURI).toBe(atomNamespace)
      expect(text(xml, 'updated')).toBe(updated.toISOString())
      expect(text(xml, 'author')).toBe('OSBlog')
      expect(text(entry, 'published')).toBe(published.toISOString())
      expect(text(entry, 'updated')).toBe(updated.toISOString())
      expect(text(entry, 'summary')).toBe(excerpt)
      expect(entry.getElementsByTagName('summary')[0].childElementCount).toBe(0)
      expect(entry.getElementsByTagName('summary')[0].getAttribute('type')).toBe('text')
      expect(entry.getElementsByTagName('link')[0].getAttribute('href')).toBe(`${origin}/post/post-1?lang=en`)
      expect(xml.querySelector('link[rel="self"]')?.getAttribute('href')).toBe(`${origin}/feed.atom?lang=en`)
    }
    expect(render).not.toHaveBeenCalled()
  })

  it('selects Vietnamese explicitly and falls back to English for other language values', async () => {
    await db.insert(post).values(fixture())
    const viResponse = await request(`${format.path}?lang=vi&limit=999`, { headers: { 'accept-language': 'en', cookie: 'lang=en' } })
    expect(viResponse.headers.get('content-language')).toBe('vi')
    const source = await viResponse.text()
    const xml = xmlDocument(source)
    const entry = xml.getElementsByTagName(format.entry)[0]
    expect(xml.documentElement.getAttribute('xml:lang')).toBe('vi')
    expect(text(entry, 'title')).toBe(fixture().titleVi)
    expect(source).toContain(`${origin}/post/post-1?lang=vi`)
    expect(source).toContain(`${origin}${format.path}?lang=vi`)
    expect(source).not.toContain('limit=')
    if (format.root === 'rss') {
      expect(text(xml, 'language')).toBe('vi')
      expect(text(entry, 'description')).toBe(fixture().excerptVi)
      expect(entry.getElementsByTagName('description')[0].childElementCount).toBe(0)
    } else expect(text(entry, 'summary')).toBe(fixture().excerptVi)
    const english = await request(`${format.path}?lang=en`)
    for (const query of ['', '?lang=fr', '?lang=VI', '?lang=%22%3E%3Cscript%3E']) {
      const fallback = await request(format.path + query, { headers: { 'accept-language': 'vi', cookie: 'lang=vi' } })
      expect(fallback.headers.get('content-language')).toBe('en')
      expect(await fallback.text()).toBe(await english.clone().text())
    }
    expect(viResponse.headers.get('etag')).not.toBe(english.headers.get('etag'))
  })

  it('round-trips literal entity strings as text without interpreting markup', async () => {
    const original = 'A & <b>plain</b> &amp; &#60; &unknown; "quotes" ]]> Tiếng Việt 🌿'
    await db.insert(post).values(fixture(1, { excerptEn: original, excerptVi: original }))
    for (const lang of ['en', 'vi']) {
      const xml = xmlDocument(await (await request(`${format.path}?lang=${lang}`)).text())
      const entry = xml.getElementsByTagName(format.entry)[0]
      const summary = entry.getElementsByTagName(format.root === 'rss' ? 'description' : 'summary')[0]
      expect(summary.textContent).toBe(original)
      expect(summary.childElementCount).toBe(0)
    }
  })

  it('excludes non-public content before the fixed SQL limit and keeps a deterministic order', async () => {
    const rows = Array.from({ length: 24 }, (_, index) => fixture(index + 1))
    rows.push(fixture(25, { publishedAt: new Date('2024-01-02T00:00:00Z') }))
    rows.push(fixture(31, { status: 'draft' }), fixture(32, { status: 'archived' }),
      fixture(33, { publishedAt: new Date('2999-01-01T00:00:00Z') }), fixture(34, { categoryId: uuid(102) }),
      fixture(35, { status: 'draft', publishedAt: null }))
    await db.insert(post).values(rows.reverse())
    const response = await request(`${format.path}?limit=999&page=2&sort=random&q=missing&category=missing`)
    const source = await response.text()
    const entries = [...xmlDocument(source).getElementsByTagName(format.entry)]
    expect(entries).toHaveLength(20)
    expect(entries.map((entry) => text(entry, format.id))).toEqual([25, ...Array.from({ length: 19 }, (_, index) => 24 - index)].map((id) => `urn:uuid:${uuid(id)}`))
    expect(source).not.toMatch(/post-(31|32|33|34|35)\?lang/)
    expect(await (await request(format.path)).text()).toBe(source)
  })

  it('returns stable empty feeds and handles publication after the saved update date', async () => {
    const empty = await (await request(format.path)).text()
    const xml = xmlDocument(empty)
    expect(xml.getElementsByTagName(format.entry)).toHaveLength(0)
    expect(text(xml, format.root === 'rss' ? 'lastBuildDate' : 'updated')).toBe(format.root === 'rss' ? new Date(0).toUTCString() : new Date(0).toISOString())
    expect(await (await request(format.path)).text()).toBe(empty)
    await db.insert(post).values(fixture(1, { updatedAt: new Date('2023-01-01T00:00:00Z') }))
    const publishedXml = xmlDocument(await (await request(format.path)).text())
    expect(text(publishedXml, format.root === 'rss' ? 'lastBuildDate' : 'updated')).toBe(format.root === 'rss' ? published.toUTCString() : published.toISOString())
  })

  it('revalidates GET and HEAD by ETag and notices edits and removal of older entries', async () => {
    await db.insert(post).values([fixture(1), fixture(2, { updatedAt: new Date('2024-01-02T00:00:00Z') })])
    const first = await request(format.path)
    const etag = first.headers.get('etag')!
    expect(etag).toMatch(/^"[a-f0-9]{64}"$/)
    const head = await request(format.path, { method: 'HEAD' })
    expect(head.status).toBe(200)
    expect(await head.text()).toBe('')
    for (const name of ['etag', 'content-type', 'content-language', 'cache-control']) expect(head.headers.get(name)).toBe(first.headers.get(name))
    for (const condition of [etag, `"other", W/${etag}`, '*']) {
      const cached = await request(format.path, { headers: { 'if-none-match': condition } })
      expect(cached.status).toBe(304)
      expect(await cached.text()).toBe('')
      expect(cached.headers.get('cache-control')).toBe(first.headers.get('cache-control'))
      expect(cached.headers.get('etag')).toBe(etag)
    }
    expect((await request(format.path, { method: 'HEAD', headers: { 'if-none-match': etag } })).status).toBe(304)
    expect((await request(`${format.path}?lang=vi`, { headers: { 'if-none-match': etag } })).status).toBe(200)
    await db.update(post).set({ titleEn: 'Edited title', slug: 'edited-slug' }).where(eq(post.id, uuid(2)))
    const changed = await request(format.path, { headers: { 'if-none-match': etag } })
    expect(changed.status).toBe(200)
    expect(changed.headers.get('etag')).not.toBe(etag)
    const changedXml = xmlDocument(await changed.text())
    expect([...changedXml.getElementsByTagName(format.entry)].map((entry) => text(entry, format.id))).toContain(`urn:uuid:${uuid(2)}`)
    await db.update(post).set({ status: 'archived' }).where(eq(post.id, uuid(2)))
    const removed = await request(format.path, { headers: { 'if-none-match': changed.headers.get('etag')! } })
    expect(removed.status).toBe(200)
    expect(removed.headers.get('etag')).not.toBe(changed.headers.get('etag'))
    expect(xmlDocument(await removed.text()).getElementsByTagName(format.entry)).toHaveLength(1)
  })

  it('keeps database errors and rejected methods uncached without rendering HTML', async () => {
    const failure = vi.spyOn(db, 'select').mockImplementationOnce(() => { throw new Error('sensitive-database-detail') })
    try {
      const response = await request(format.path)
      expect(response.status).toBe(500)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(response.headers.get('etag')).toBeNull()
      expect(await response.text()).not.toContain('sensitive-database-detail')
    } finally { failure.mockRestore() }
    const rejected = await request(format.path, { method: 'POST', headers: { origin } })
    expect(rejected.status).toBe(405)
    expect(rejected.headers.get('cache-control')).toBe('no-store')
    expect(render).not.toHaveBeenCalled()
  })
})

it('removes invalid XML scalar values but preserves valid whitespace, Vietnamese and emoji', () => {
  const value = `\t\n\rTiếng Việt 🌿 <>&"'`
  const escaped = escapeXml(value + '\u0000\u0001\u000b\ufffe\uffff\ud800\udc00\ud800\udfff')
  // U+10000 and U+103FF are valid surrogate pairs; isolated surrogates are not.
  expect(escaped).toBe(`\t\n\rTiếng Việt 🌿 &lt;&gt;&amp;&quot;&apos;𐀀𐏿`)
  expect(escapeXml('\ud800x\udfff')).toBe('x')
  xmlDocument(`<?xml version="1.0" encoding="UTF-8"?><text>${escaped}</text>`)
})

it('leaves API, admin, SSR and crawl responses no-store and embeds both feed guides', async () => {
  for (const path of ['/api/posts', '/api/admin/posts', '/admin/login', '/about', '/robots.txt', '/sitemap.xml']) {
    expect((await request(path)).headers.get('cache-control')).toBe('no-store')
  }
  for (const lang of ['en', 'vi']) {
    const response = await request(`/docs/feeds?lang=${lang}`)
    expect(response.status).toBe(200)
    const data = render.mock.calls.at(-1)?.[0]
    expect(data).toMatchObject({ kind: 'doc', lang, doc: { slug: 'feeds', lang } })
  }
})
