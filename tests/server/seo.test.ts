import { describe, expect, it } from 'vitest'
import { escapeHtml, renderDocument, renderHtmlDocument, seoForPath } from '../../src/server/seo'

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
})
