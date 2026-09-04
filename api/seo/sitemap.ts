import type { IncomingMessage, ServerResponse } from 'node:http'
import { databaseForRequest, listPublishedPosts } from '../../src/server/content'
import { readServerEnv } from '../../src/server/env'
import { getRequestId, writeError } from '../../src/server/http'
import { escapeHtml } from '../../src/server/seo'

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestId = getRequestId(request)
  try {
    if (request.method !== 'GET') {
      response.statusCode = 405
      response.setHeader('allow', 'GET')
      response.end('Method not allowed')
      return
    }
    const siteUrl = readServerEnv().VITE_SITE_URL ?? 'https://example.invalid'
    const posts = await listPublishedPosts(databaseForRequest(), 50)
    const urls = posts.map((post) => `<url><loc>${escapeHtml(new URL(`/post/${post.slug}`, siteUrl).toString())}</loc>${post.updatedAt ? `<lastmod>${post.updatedAt.toISOString()}</lastmod>` : ''}</url>`).join('')
    response.statusCode = 200
    response.setHeader('content-type', 'application/xml; charset=utf-8')
    response.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`)
  } catch (error) {
    writeError(response, requestId, error)
  }
}
