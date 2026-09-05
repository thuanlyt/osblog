import { describe, expect, it } from 'vitest'
import { createRouter } from '../../src/server/router'
const handler = createRouter({ env: { NODE_ENV: 'test', SITE_URL: 'http://localhost' }, render: () => '' })

describe('health endpoint', () => {
  it('does not report healthy when the database is missing', async () => {
    const result = await handler(new Request('http://localhost/api/healthz'))
    expect(result.status).toBe(503)
    expect((await result.json()).error.code).toBe('SERVER_MISCONFIGURED')
  })

  it('returns 405 for non-GET requests', async () => {
    const result = await handler(new Request('http://localhost/api/healthz', { method: 'POST', headers: { origin: 'http://localhost' } }))
    expect(result.status).toBe(405)
  })
})
