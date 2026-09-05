import { afterAll, expect, vi } from 'vitest'

// Negative control for regression quality, NOT evidence of corrected connection reuse.
// Run the unchanged worker tests while forcing every HTTP request onto a new socket.
const sockets = vi.hoisted(() => new Set<object>())
vi.mock('node:http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:http')>()
  return {
    ...actual,
    request: (options: import('node:http').RequestOptions, callback: (response: import('node:http').IncomingMessage) => void) => {
      const request = actual.request({ ...options, agent: false }, callback)
      request.on('socket', (socket) => sockets.add(socket))
      return request
    },
  }
})
import '../../../tests/server/node-adapter.test'
afterAll(() => {
  expect(sockets.size).toBe(5)
  console.info(`Coverage negative control: unchanged worker Node tests passed using ${sockets.size} separate sockets for 5 requests; no reuse was possible.`)
})
