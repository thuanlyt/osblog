import { createServer, request as httpRequest } from 'node:http'
import { once } from 'node:events'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createNodeHandler } from '../../../src/server/node-adapter'
import { BODY_LIMIT, boundedBody, errorResponse } from '../../../src/server/request'

// Ephemeral loopback server owned only by this audit, no main runtime or database.
const server = createServer(createNodeHandler(async (request) => {
  try {
    const body = await boundedBody(request)
    return Response.json({ size: body.length }, { headers: [['set-cookie', 'first=1; HttpOnly'], ['set-cookie', 'second=2; HttpOnly']] })
  } catch (error) { return errorResponse(error, 'audit-fixture') }
}))
let port = 0
beforeAll(async () => {
  vi.stubEnv('SITE_URL', 'https://audit.example.test')
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('TRUST_PROXY', 'false')
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  port = (server.address() as { port: number }).port
})
afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); vi.unstubAllEnvs() })

function send(size: number, contentLength: boolean) {
  return new Promise<{ status?: number; error?: string; cookies?: string[] }>((resolve) => {
    const req = httpRequest({ hostname: '127.0.0.1', port, method: 'POST', path: '/api/audit',
      headers: { 'content-type': 'application/json', ...(contentLength ? { 'content-length': size } : {}) } }, (res) => {
      res.resume()
      res.on('end', () => resolve({ status: res.statusCode, cookies: res.headers['set-cookie'] }))
    })
    req.on('error', (error: NodeJS.ErrnoException) => resolve({ error: error.code }))
    req.setTimeout(5000, () => { req.destroy(); resolve({ error: 'TIMEOUT' }) })
    if (contentLength) req.end('x'.repeat(size))
    else { req.write('x'.repeat(size)); req.end() }
  })
}

it('preserves multiple Set-Cookie headers and rejects a declared oversized body', async () => {
  const valid = await send(32, true)
  expect(valid.status).toBe(200)
  expect(valid.cookies).toEqual(['first=1; HttpOnly', 'second=2; HttpOnly'])
  expect((await send(BODY_LIMIT + 1, true)).status).toBe(413)
})

it('R4: chunked oversized body stalls until the client timeout instead of returning 413', async () => {
  const result = await send(BODY_LIMIT + 65536, false)
  console.info('R4 chunked overflow:', JSON.stringify(result))
  expect(result).toEqual({ error: 'TIMEOUT' })
})
