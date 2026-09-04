import { readServerEnv } from './env'

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
