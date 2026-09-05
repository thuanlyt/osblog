import { createHash } from 'node:crypto'
import { localized, type Language } from '../app/types'
import { listPublishedPosts } from './content'
import type { Store } from './db'

const ATOM_NAMESPACE = 'http://www.w3.org/2005/Atom'
const FEED_LIMIT = 20

export function escapeXml(value: string): string {
  // XML 1.0 cannot represent most control characters or lone UTF-16 surrogates.
  const text = Array.from(value).filter((character) => {
    const point = character.codePointAt(0)!
    return point === 0x9 || point === 0xa || point === 0xd ||
      (point >= 0x20 && point <= 0xd7ff) || (point >= 0xe000 && point <= 0xfffd) || point >= 0x10000
  }).join('')
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

export async function feedResponse(db: Store, request: Request, origin: string): Promise<Response> {
  const url = new URL(request.url)
  const lang: Language = url.searchParams.get('lang') === 'vi' ? 'vi' : 'en'
  const atom = url.pathname === '/feed.atom'
  const contentType = atom ? 'application/atom+xml' : 'application/rss+xml'
  const link = (path: string) => {
    const target = new URL(path, origin)
    target.searchParams.set('lang', lang)
    return escapeXml(target.href)
  }
  const home = link('/')
  const self = link(atom ? '/feed.atom' : '/feed.xml')
  const title = lang === 'vi' ? 'OSBlog — Bài viết mới nhất' : 'OSBlog — Latest posts'
  const description = lang === 'vi' ? 'Những bài viết mới nhất từ OSBlog.' : 'The latest published posts from OSBlog.'
  // The shared query filters drafts, future publication dates and archived categories,
  // then orders by publishedAt DESC, id DESC before applying the SQL limit.
  const posts = await listPublishedPosts(db, FEED_LIMIT)
  const entries = posts.map((row) => ({
    id: escapeXml(`urn:uuid:${row.id}`),
    link: link(`/post/${encodeURIComponent(row.slug)}`),
    title: escapeXml(localized(row, 'title', lang)),
    excerpt: escapeXml(localized(row, 'excerpt', lang)),
    published: row.publishedAt!,
    updated: new Date(Math.max(row.updatedAt.getTime(), row.publishedAt!.getTime())),
  }))
  // An empty feed has a fixed baseline so polling does not manufacture updates.
  const updated = new Date(Math.max(0, ...entries.map((entry) => entry.updated.getTime())))
  const document = '<?xml version="1.0" encoding="UTF-8"?>\n' + (atom
    ? `<feed xmlns="${ATOM_NAMESPACE}" xml:lang="${lang}">
  <id>${self}</id><title type="text">${title}</title><subtitle type="text">${description}</subtitle>
  <link rel="self" type="${contentType}" href="${self}"/>
  <link rel="alternate" type="text/html" href="${home}" hreflang="${lang}"/>
  <author><name>OSBlog</name></author><updated>${updated.toISOString()}</updated>
  ${entries.map((entry) => `<entry>
    <id>${entry.id}</id><title type="text">${entry.title}</title>
    <link rel="alternate" type="text/html" href="${entry.link}" hreflang="${lang}"/>
    <published>${entry.published.toISOString()}</published><updated>${entry.updated.toISOString()}</updated>
    <summary type="text">${entry.excerpt}</summary>
  </entry>`).join('\n  ')}
</feed>`
    : `<rss version="2.0" xmlns:atom="${ATOM_NAMESPACE}" xml:lang="${lang}"><channel>
  <title>${title}</title><link>${home}</link><description>${description}</description><language>${lang}</language>
  <atom:link rel="self" type="${contentType}" href="${self}"/>
  <lastBuildDate>${updated.toUTCString()}</lastBuildDate><ttl>5</ttl>
  ${entries.map((entry) => `<item>
    <guid isPermaLink="false">${entry.id}</guid><title>${entry.title}</title><link>${entry.link}</link>
    <pubDate>${entry.published.toUTCString()}</pubDate><atom:updated>${entry.updated.toISOString()}</atom:updated>
    <description>${entry.excerpt}</description>
  </item>`).join('\n  ')}
</channel></rss>`)
  // Both excerpts are plain text, escaped once in the entry mapping for XML.
  const etag = `"${createHash('sha256').update(document).digest('hex')}"`
  const headers = {
    'content-type': `${contentType}; charset=utf-8`,
    'content-language': lang,
    'cache-control': 'public, max-age=300, s-maxage=300',
    etag,
  }
  const unchanged = request.headers.get('if-none-match')?.split(',').some((tag) => tag.trim() === '*' || tag.trim().replace(/^W\//, '') === etag)
  return new Response(unchanged || request.method === 'HEAD' ? null : document, { status: unchanged ? 304 : 200, headers })
}
