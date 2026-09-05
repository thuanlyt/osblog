import { describe, expect, it } from 'vitest'
import { escapeHtml, renderDocument, renderHtmlDocument, seoForPath } from '../../src/server/seo'
import type { PageData } from '../../src/app/types'

describe('SSR SEO boundary', () => {
  it('escapes metadata and marks private/search routes noindex', () => {
    expect(escapeHtml('<title>"safe" & sound</title>')).toBe('&lt;title&gt;&quot;safe&quot; &amp; sound&lt;/title&gt;')
    expect(seoForPath('/search?q=secret', { NODE_ENV: 'test' }).noIndex).toBe(true)
    expect(seoForPath('/admin', { NODE_ENV: 'test' }).noIndex).toBe(true)
    expect(seoForPath('/post/hello-world', { NODE_ENV: 'test', VITE_SITE_URL: 'https://osblog.example' }).canonical).toBe('https://osblog.example/post/hello-world')
  })

  it('returns a complete route-aware HTML document', () => {
    const document = renderDocument('<main id="app-main">About</main>', { kind: 'about', path: '/about', lang: 'vi', status: 200, title: 'Giới thiệu', description: 'OSBlog' }, 'https://osblog.example', 'test-nonce', { styles: ['/assets/test.css'], scripts: ['/assets/test.js'] })
    expect(document).toContain('<!doctype html>')
    expect(document).toContain('<html lang="vi">')
    expect(document).toContain('<link rel="canonical"')
    expect(document).toContain('<main id="app-main"')
    expect(renderHtmlDocument('<p>body</p>', seoForPath('/admin', { NODE_ENV: 'test' }))).toContain('noindex,follow')
  })

  it.each(['en', 'vi'] as const)('discovers both feeds in the public SSR head using the rendered %s language', (lang) => {
    const pages: Pick<PageData, 'kind' | 'path'>[] = [
      { kind: 'home', path: '/' },
      { kind: 'archive', path: '/archive?page=2&year=2024' },
      { kind: 'archive', path: '/category/engineering' },
      { kind: 'article', path: '/post/a-post?lang=fr' },
      { kind: 'about', path: '/about' },
      { kind: 'docs', path: '/docs' },
      { kind: 'doc', path: '/docs/feeds' },
      { kind: 'archive', path: '/search?q=private-search&sort=popular' },
    ]
    for (const page of pages) {
      const source = renderDocument('<main>Public page</main>', { ...page, lang, status: 200, title: '<unsafe> & title', description: 'Fixture' }, 'https://osblog.example', 'test-nonce', { scripts: [], styles: [] })
      const html = new DOMParser().parseFromString(source, 'text/html')
      const links = [...html.head.querySelectorAll('link[rel="alternate"][type]')]
      expect(links.map((link) => ({ type: link.getAttribute('type'), href: link.getAttribute('href'), lang: link.getAttribute('hreflang') }))).toEqual([
        { type: 'application/rss+xml', href: `https://osblog.example/feed.xml?lang=${lang}`, lang },
        { type: 'application/atom+xml', href: `https://osblog.example/feed.atom?lang=${lang}`, lang },
      ])
      for (const link of links) expect(link.getAttribute('title')).toContain('OSBlog')
      expect(html.body.querySelector('link[rel="alternate"][type]')).toBeNull()
      expect(html.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
      expect(html.head.querySelectorAll('link[rel="alternate"][hreflang]:not([type])')).toHaveLength(2)
      expect(html.head.querySelector('unsafe')).toBeNull()
      if (page.path.startsWith('/search')) expect(html.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,follow')
    }
  })

  it('omits feed discovery from private and unsuccessful pages while preserving noindex', () => {
    const pages: Pick<PageData, 'kind' | 'path' | 'status'>[] = [
      { kind: 'login', path: '/admin/login', status: 200 },
      { kind: 'admin', path: '/admin', status: 200 },
      { kind: 'admin', path: '/admin/posts/new', status: 200 },
      { kind: 'error', path: '/about', status: 503 },
      { kind: 'not-found', path: '/missing', status: 404 },
    ]
    for (const page of pages) {
      const source = renderDocument('<main>Fixture</main>', { ...page, lang: 'vi', title: 'Fixture', description: '' }, 'https://osblog.example', 'test-nonce', { scripts: [], styles: [] })
      const html = new DOMParser().parseFromString(source, 'text/html')
      expect(html.head.querySelector('link[rel="alternate"][type]')).toBeNull()
      expect(html.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,follow')
    }
  })
})
