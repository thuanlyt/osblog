import { describe, expect, it } from 'vitest'
import { HttpError, writeError } from '../../src/server/http'

describe('API envelope boundary', () => {
  it('does not expose unknown error details', () => {
    const response = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (body: string) => { response.body = JSON.parse(body) as unknown },
      body: null as unknown,
    }
    writeError(response, 'request-1', new Error('DATABASE_URL=secret-value'))
    expect(response.statusCode).toBe(500)
    expect(response.body).toEqual({
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred' },
      requestId: 'request-1',
    })
  })

  it('preserves explicit status and code for known API errors', () => {
    const response = {
      statusCode: 0,
      setHeader: () => undefined,
      end: (body: string) => { response.body = JSON.parse(body) as unknown },
      body: null as unknown,
    }
    writeError(response, 'request-2', new HttpError(409, 'CONFLICT', 'Changed'))
    expect(response.statusCode).toBe(409)
    expect(response.body).toMatchObject({ error: { code: 'CONFLICT', message: 'Changed' }, requestId: 'request-2' })
  })
})
