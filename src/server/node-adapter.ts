import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { isIP } from 'node:net'
import { pipeline } from 'node:stream/promises'
import { headersFromRequest } from './http'
import { siteOrigin } from './env'

export function createNodeHandler(handle: (request: Request, context?: { ip?: string }) => Promise<Response>) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    try {
      const headers = headersFromRequest(request)
      const forwarded = process.env.VERCEL ? headers.get('x-vercel-forwarded-for') : process.env.TRUST_PROXY === 'true' ? headers.get('x-forwarded-for')?.split(',')[0]?.trim() : null
      const ip = forwarded && isIP(forwarded) ? forwarded : request.socket.remoteAddress ?? 'unknown'
      let body: BodyInit | undefined
      if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
        const preParsed = (request as IncomingMessage & { body?: unknown }).body
        body = preParsed !== undefined ? typeof preParsed === 'string' ? preParsed : JSON.stringify(preParsed) : Readable.toWeb(request) as ReadableStream<Uint8Array>
      }
      const init = { method: request.method ?? 'GET', headers, body, duplex: 'half' } as RequestInit
      const result = await handle(new Request(new URL(request.url ?? '/', siteOrigin(process.env)), init), { ip })
      response.statusCode = result.status
      result.headers.forEach((value, key) => { if (key !== 'set-cookie') response.setHeader(key, value) })
      const cookies = result.headers.getSetCookie()
      if (cookies.length) response.setHeader('set-cookie', cookies)
      if (result.body) await pipeline(Readable.fromWeb(result.body as Parameters<typeof Readable.fromWeb>[0]), response)
      else response.end()
    } catch {
      if (!response.headersSent) { response.statusCode = 503; response.setHeader('content-type', 'application/json'); response.setHeader('cache-control', 'no-store') }
      response.end(JSON.stringify({ data: null, error: { code: 'SERVER_UNAVAILABLE', message: 'Server configuration or connection is unavailable.' } }))
    }
  }
}
