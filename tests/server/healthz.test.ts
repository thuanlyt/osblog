import { describe, expect, it } from 'vitest'
import handler, { healthSnapshot } from '../../api/healthz'

describe('health endpoint', () => {
  it('reports missing local database as not configured without leaking secrets', () => {
    expect(healthSnapshot({ NODE_ENV: 'test' })).toEqual({
      status: 'ok',
      checks: { configuration: 'ok', database: 'not_configured' },
    })
  })

  it('returns 405 for non-GET requests', () => {
    const response = { status: (code: number) => { response.code = code; return response }, json: (body: unknown) => { response.body = body }, code: 0, body: null as unknown }
    handler({ method: 'POST' }, response)
    expect(response.code).toBe(405)
    expect(response.body).toMatchObject({ data: null, error: { code: 'METHOD_NOT_ALLOWED' } })
  })
})
