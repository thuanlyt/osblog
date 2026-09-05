import { createServer, request as httpRequest, Agent } from 'node:http'
import { connect, type Socket } from 'node:net'
import { once } from 'node:events'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createNodeHandler } from '../../../src/server/node-adapter'
import { BODY_LIMIT, boundedBody, errorResponse } from '../../../src/server/request'

// Real Node adapter, ephemeral loopback port and explicit socket identity.
const socketIds = new WeakMap<Socket, number>()
let nextSocketId = 0, port = 0
const handler = createNodeHandler(async (request) => {
  try {
    const body = await boundedBody(request)
    return Response.json({ size: Buffer.byteLength(body), path: new URL(request.url).pathname }, {
      headers: [['set-cookie', 'first=1; HttpOnly'], ['set-cookie', 'second=2; HttpOnly']],
    })
  } catch (error) { return errorResponse(error, 'UA-0053-node') }
})
const server = createServer((request, response) => {
  response.setHeader('x-review-socket-id', socketIds.get(request.socket)!)
  void handler(request, response)
})
server.on('connection', (socket) => socketIds.set(socket, ++nextSocketId))
beforeAll(async () => {
  vi.stubEnv('SITE_URL', 'https://rereview.example.test')
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('TRUST_PROXY', 'false')
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  port = (server.address() as { port: number }).port
})
afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  vi.unstubAllEnvs()
})

interface Reply { status: number; body: string; socketId: string; cookies?: string[]; reused?: boolean; elapsed?: number }
function send(agent: Agent, size: number, declared: boolean): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const started = performance.now()
    const timer = setTimeout(() => { req.destroy(); reject(new Error('No complete HTTP response within 1500 ms')) }, 1500)
    const req = httpRequest({ hostname: '127.0.0.1', port, agent, method: 'POST', path: '/follow-up',
      headers: { 'content-type': 'application/json', ...(declared ? { 'content-length': size } : {}) } }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (part) => { body += part })
      response.on('end', () => {
        clearTimeout(timer)
        resolve({ status: response.statusCode!, body, socketId: String(response.headers['x-review-socket-id']),
          cookies: response.headers['set-cookie'], reused: req.reusedSocket, elapsed: performance.now() - started })
      })
      response.on('error', reject)
    })
    req.on('error', (error) => { clearTimeout(timer); reject(error) })
    if (declared) req.end(Buffer.alloc(size, 120))
    else { req.write(Buffer.alloc(size, 120)); req.end() }
  })
}

// Parse the adapter's actual HTTP/1.1 replies, including chunked response framing.
function takeReply(buffer: Buffer): { reply: Reply; used: number } | undefined {
  const end = buffer.indexOf('\r\n\r\n')
  if (end < 0) return
  const lines = buffer.subarray(0, end).toString().split('\r\n')
  const status = Number(lines.shift()!.split(' ')[1])
  const headers = new Map<string, string>()
  for (const line of lines) { const split = line.indexOf(':'); headers.set(line.slice(0, split).toLowerCase(), line.slice(split + 1).trim()) }
  let offset = end + 4
  const parts: Buffer[] = []
  if (headers.get('transfer-encoding') === 'chunked') {
    for (;;) {
      const next = buffer.indexOf('\r\n', offset)
      if (next < 0) return
      const size = Number.parseInt(buffer.subarray(offset, next).toString(), 16)
      if (!Number.isFinite(size)) throw new Error('Invalid response chunk framing')
      offset = next + 2
      if (buffer.length < offset + size + 2) return
      parts.push(buffer.subarray(offset, offset + size))
      offset += size + 2
      if (size === 0) break
    }
  } else {
    const size = Number(headers.get('content-length') ?? 0)
    if (buffer.length < offset + size) return
    parts.push(buffer.subarray(offset, offset + size)); offset += size
  }
  return { reply: { status, body: Buffer.concat(parts).toString(), socketId: headers.get('x-review-socket-id')! }, used: offset }
}
async function wire() {
  const socket = connect({ host: '127.0.0.1', port })
  const replies: Reply[] = []
  let buffer = Buffer.alloc(0), error: Error | undefined
  let pending: { count: number; resolve: () => void; reject: (error: Error) => void } | undefined
  socket.on('data', (part) => {
    buffer = Buffer.concat([buffer, part])
    try {
      for (;;) {
        const parsed = takeReply(buffer)
        if (!parsed) break
        replies.push(parsed.reply); buffer = buffer.subarray(parsed.used)
      }
      if (pending && replies.length >= pending.count) pending.resolve()
    } catch (failure) { error = failure as Error; pending?.reject(error) }
  })
  socket.on('error', (failure) => { error = failure; pending?.reject(failure) })
  socket.on('close', () => { if (pending && replies.length < pending.count) pending.reject(new Error('Socket closed before expected replies')) })
  await once(socket, 'connect')
  return {
    socket, replies,
    wait: async (count: number) => {
      if (error) throw error
      if (replies.length >= count) return
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { pending = undefined; reject(new Error(`Only ${replies.length}/${count} replies within 1500 ms`)) }, 1500)
        pending = { count, resolve: () => { clearTimeout(timer); pending = undefined; resolve() }, reject: (failure) => { clearTimeout(timer); pending = undefined; reject(failure) } }
      })
    },
  }
}

it.each([true, false])('R4 promptly rejects declared=%s overflow and explicitly reuses one socket', async (declared) => {
  const agent = new Agent({ keepAlive: true, maxSockets: 1, maxFreeSockets: 1 })
  try {
    const first = await send(agent, 32, true)
    expect(first.status).toBe(200)
    expect(first.cookies).toEqual(['first=1; HttpOnly', 'second=2; HttpOnly'])
    const overflow = await send(agent, BODY_LIMIT + 65536, declared)
    expect(overflow.status).toBe(413)
    expect(JSON.parse(overflow.body).error.code).toBe('BODY_TOO_LARGE')
    expect(overflow.elapsed).toBeLessThan(1500)
    expect(overflow.reused).toBe(true)
    expect(overflow.socketId).toBe(first.socketId)
    const follow = await send(agent, 64, true)
    expect(follow.status).toBe(200)
    expect(JSON.parse(follow.body)).toEqual({ size: 64, path: '/follow-up' })
    expect(follow.reused).toBe(true)
    expect(follow.socketId).toBe(first.socketId)
    console.info(`R4 declared=${declared}: 413 in ${overflow.elapsed!.toFixed(1)} ms; 200 follow-up; all socket=${first.socketId}`)
  } finally { agent.destroy() }
})

it.each([true, false])('R4 returns 413 before declared=%s upload completes, then frames a pipelined follow-up safely', async (declared) => {
  const connection = await wire()
  const size = BODY_LIMIT + 65536
  const start = performance.now()
  try {
    connection.socket.write(`POST /overflow HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\n${declared ? `Content-Length: ${size}` : 'Transfer-Encoding: chunked'}\r\nConnection: keep-alive\r\n\r\n`)
    if (!declared) {
      connection.socket.write(size.toString(16) + '\r\n')
      connection.socket.write(Buffer.alloc(size, 120))
      connection.socket.write('\r\n')
      // Deliberately withhold terminating zero chunk until AFTER the complete rejection.
    }
    // Declared-length case deliberately sends no body bytes until AFTER rejection.
    await connection.wait(1)
    const elapsed = performance.now() - start
    expect(connection.replies[0].status).toBe(413)
    expect(JSON.parse(connection.replies[0].body).error.code).toBe('BODY_TOO_LARGE')
    expect(elapsed).toBeLessThan(1500)
    const follow = 'GET /wire-follow-up HTTP/1.1\r\nHost: localhost\r\nConnection: keep-alive\r\n\r\n'
    if (declared) connection.socket.write(Buffer.concat([Buffer.alloc(size, 120), Buffer.from(follow)]))
    else connection.socket.write('0\r\n\r\n' + follow)
    await connection.wait(2)
    expect(connection.replies[1].status).toBe(200)
    expect(JSON.parse(connection.replies[1].body)).toEqual({ size: 0, path: '/wire-follow-up' })
    expect(connection.replies[1].socketId).toBe(connection.replies[0].socketId)
    expect(connection.replies).toHaveLength(2)
    console.info(`R4 raw declared=${declared}: complete 413 before upload end in ${elapsed.toFixed(1)} ms; pipelined 200 on socket=${connection.replies[0].socketId}`)
  } finally { connection.socket.destroy() }
})

it.each([true, false])('R4 accepts exactly BODY_LIMIT bytes with declared=%s framing', async (declared) => {
  const agent = new Agent({ keepAlive: true, maxSockets: 1 })
  try {
    const response = await send(agent, BODY_LIMIT, declared)
    expect(response.status).toBe(200)
    expect(JSON.parse(response.body).size).toBe(BODY_LIMIT)
  } finally { agent.destroy() }
})
