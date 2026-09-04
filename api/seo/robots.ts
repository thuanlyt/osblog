import type { IncomingMessage, ServerResponse } from 'node:http'
import { readServerEnv } from '../../src/server/env'

export default function handler(_request: IncomingMessage, response: ServerResponse): void {
  if (_request.method !== 'GET') {
    response.statusCode = 405
    response.setHeader('allow', 'GET')
    response.end('Method not allowed')
    return
  }
  const siteUrl = readServerEnv().VITE_SITE_URL ?? 'https://example.invalid'
  response.statusCode = 200
  response.setHeader('content-type', 'text/plain; charset=utf-8')
  response.end(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n`)
}
