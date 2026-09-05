import { Agent, createServer, request as httpRequest } from 'node:http'
import { once } from 'node:events'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createNodeHandler } from '../../src/server/node-adapter'
import { BODY_LIMIT, boundedBody, errorResponse } from '../../src/server/request'

// Ephemeral loopback server owned only by this test, no main runtime or database.
const server = createServer(createNodeHandler(async (request) => {
  try {
    const body = await boundedBody(request)
    return Response.json({ size: body.length }, { headers: [['set-cookie', 'first=1; HttpOnly'], ['set-cookie', 'second=2; HttpOnly']] })
  } catch (error) { return errorResponse(error, 'test-fixture') }
}))
let port = 0
beforeAll(async () => {
  vi.stubEnv('SITE_URL', 'https://node-adapter.example.test')
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('TRUST_PROXY', 'false')
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  port = (server.address() as { port: number }).port
})
afterAll(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); vi.unstubAllEnvs() })

function send(size: number, contentLength: boolean, agent?: Agent) {
  return new Promise<{ status?: number; error?: string; cookies?: string[]; reusedSocket?: boolean }>((resolve) => {
    const req = httpRequest({ hostname: '127.0.0.1', port, method: 'POST', path: '/api/test',
      agent, headers: { 'content-type': 'application/json', ...(contentLength ? { 'content-length': size } : {}) } }, (res) => {
      res.resume()
      res.on('end', () => resolve({ status: res.statusCode, cookies: res.headers['set-cookie'], reusedSocket: req.reusedSocket }))
    })
    req.on('error', (error: NodeJS.ErrnoException) => resolve({ error: error.code }))
    req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'TIMEOUT' }) })
    if (contentLength) req.end('x'.repeat(size))
    else { req.write('x'.repeat(size)); req.end() }
  })
}

it('preserves multiple Set-Cookie headers and rejects a declared oversized body without corrupting the reused connection', async () => {
  const agent = new Agent({ keepAlive: true, maxSockets: 1 })
  try {
    const valid = await send(32, true, agent)
    expect(valid.status).toBe(200)
    expect(valid.cookies).toEqual(['first=1; HttpOnly', 'second=2; HttpOnly'])
    expect(valid.reusedSocket).toBe(false)
    const oversized = await send(BODY_LIMIT + 1, true, agent)
    expect(oversized.status).toBe(413)
    const followUp = await send(64, true, agent)
    expect(followUp.status).toBe(200)
    expect(followUp.reusedSocket).toBe(true)
  } finally { agent.destroy() }
})

it('rejects an oversized chunked body with a prompt 413 instead of stalling until timeout (R4 regression)', async () => {
  const agent = new Agent({ keepAlive: true, maxSockets: 1 })
  try {
    const result = await send(BODY_LIMIT + 65536, false, agent)
    expect(result.status).toBe(413)
    expect(result.cookies).toBeUndefined()
    const followUp = await send(64, true, agent)
    expect(followUp.status).toBe(200)
    expect(followUp.reusedSocket).toBe(true)
  } finally { agent.destroy() }
})
