import { readServerEnv } from './env'
import type { PageData } from '../app/types'
import { localized } from '../app/types'

export interface ClientAssets { scripts: string[]; styles: string[] }
export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
}
export function renderDocument(body: string, data: PageData, origin: string, nonce: string, assets: ClientAssets): string {
  const canonical = new URL(data.path, origin)
  canonical.searchParams.set('lang', data.lang)
  const noIndex = data.status !== 200 || ['login', 'admin', 'error'].includes(data.kind) || canonical.pathname === '/search' || Boolean(canonical.searchParams.get('q')) || ['random', 'popular'].includes(canonical.searchParams.get('sort') ?? '')
  for (const name of [...canonical.searchParams.keys()]) if (!['lang', 'page', 'year', 'category'].includes(name)) canonical.searchParams.delete(name)
  const title = `${data.title} — OSBlog`
  const image = data.post?.coverImageUrl ? new URL(data.post.coverImageUrl, origin).href : null
  const alternates = ['en', 'vi'].map((language) => { const url = new URL(canonical); url.searchParams.set('lang', language); return `<link rel="alternate" hreflang="${language}" href="${escapeHtml(url.href)}"/>` }).join('')
  const feeds = data.status === 200 && !['login', 'admin', 'error'].includes(data.kind) ? [
    { path: '/feed.xml', type: 'application/rss+xml', title: 'OSBlog RSS' },
    { path: '/feed.atom', type: 'application/atom+xml', title: 'OSBlog Atom' },
  ].map((feed) => {
    const url = new URL(feed.path, origin)
    url.searchParams.set('lang', data.lang)
    return `<link rel="alternate" type="${feed.type}" title="${feed.title} (${data.lang})" hreflang="${data.lang}" href="${escapeHtml(url.href)}"/>`
  }).join('') : ''
  const structured = data.kind === 'article' && data.post ? {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: localized(data.post, 'title', data.lang), description: data.description,
    datePublished: data.post.publishedAt, dateModified: data.post.updatedAt, inLanguage: data.lang, mainEntityOfPage: canonical.href,
    author: { '@type': 'Organization', name: 'OSBlog', url: `${origin}/about` }, ...(image ? { image: [image] } : {}),
  } : { '@context': 'https://schema.org', '@type': data.kind === 'doc' ? 'TechArticle' : 'WebSite', name: title, description: data.description, url: canonical.href, inLanguage: data.lang }
  return `<!doctype html><html lang="${data.lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#fafafa"/><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(data.description)}"/><meta name="robots" content="${noIndex ? 'noindex,follow' : 'index,follow'}"/><link rel="canonical" href="${escapeHtml(canonical.href)}"/>${alternates}${feeds}<link rel="icon" type="image/svg+xml" href="/favicon.svg"/><meta property="og:type" content="${data.kind === 'article' ? 'article' : 'website'}"/><meta property="og:title" content="${escapeHtml(title)}"/><meta property="og:description" content="${escapeHtml(data.description)}"/><meta property="og:url" content="${escapeHtml(canonical.href)}"/><meta property="og:site_name" content="OSBlog"/><meta property="og:locale" content="${data.lang === 'vi' ? 'vi_VN' : 'en_US'}"/><meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"/>${image ? `<meta property="og:image" content="${escapeHtml(image)}"/><meta property="og:image:alt" content="${escapeHtml(localized(data.post!, 'coverImageAlt', data.lang))}"/>` : ''}${assets.styles.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}"/>`).join('')}<script type="application/ld+json" nonce="${nonce}">${safeJson(structured)}</script></head><body><div id="root">${body}</div><script id="osblog-data" type="application/json" nonce="${nonce}">${safeJson(data)}</script>${assets.scripts.map((src) => `<script type="module" nonce="${nonce}" src="${escapeHtml(src)}"></script>`).join('')}</body></html>`
}

export interface SeoMetadata {
  title: string
  description: string
  canonical: string
  locale: 'vi' | 'en'
  noIndex: boolean
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character)
}

function humanizeSlug(slug: string): string {
  return slug.split('-').filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ')
}

export function seoForPath(url: string, input: NodeJS.ProcessEnv = process.env): SeoMetadata {
  const parsed = new URL(url, 'http://localhost')
  const env = readServerEnv(input)
  const siteUrl = env.VITE_SITE_URL ?? 'https://example.invalid'
  const noIndex = parsed.pathname === '/search' || parsed.pathname === '/admin' || parsed.pathname.startsWith('/admin/') || parsed.pathname.startsWith('/api/')
  let title = 'osblog — open source blog'
  let description = 'osblog — an open source bilingual blog.'

  if (parsed.pathname.startsWith('/post/')) {
    title = `${humanizeSlug(parsed.pathname.slice('/post/'.length))} — osblog`
    description = 'A bilingual open source essay from osblog.'
  } else if (parsed.pathname.startsWith('/category/')) {
    title = `${humanizeSlug(parsed.pathname.slice('/category/'.length))} — osblog`
    description = 'Published bilingual writing from the osblog archive.'
  } else if (parsed.pathname === '/about') {
    title = 'About osblog — open source blog'
    description = 'A small home for thoughtful bilingual writing about software, craft, and the commons.'
  } else if (parsed.pathname === '/search') {
    title = 'Search the archive — osblog'
    description = 'Search the published osblog archive.'
  } else if (parsed.pathname.startsWith('/admin')) {
    title = 'Admin — osblog'
    description = 'Protected osblog publishing workspace.'
  }

  return {
    title,
    description,
    canonical: new URL(parsed.pathname, siteUrl).toString(),
    locale: 'vi',
    noIndex,
  }
}

export function renderHtmlDocument(body: string, metadata: SeoMetadata): string {
  const robots = metadata.noIndex ? 'noindex,follow' : 'index,follow'
  return `<!doctype html><html lang="${escapeHtml(metadata.locale)}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><meta name="theme-color" content="#FAFAFA"/><meta name="description" content="${escapeHtml(metadata.description)}"/><meta name="robots" content="${robots}"/><link rel="canonical" href="${escapeHtml(metadata.canonical)}"/><title>${escapeHtml(metadata.title)}</title></head><body><div id="root">${body}</div></body></html>`
}
