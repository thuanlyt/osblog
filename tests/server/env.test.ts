import { describe, expect, it } from 'vitest'
import { requireDatabaseUrl, readServerEnv, ServerConfigError } from '../../src/server/env'

describe('server environment contract', () => {
  it('accepts local test configuration without provider credentials', () => {
    expect(readServerEnv({ NODE_ENV: 'test' }).NODE_ENV).toBe('test')
  })

  it('fails closed for incomplete production configuration', () => {
    expect(() => readServerEnv({ NODE_ENV: 'production' })).toThrow(ServerConfigError)
    expect(() => requireDatabaseUrl({ NODE_ENV: 'test' })).toThrow(/DATABASE_URL/)
  })

  it('rejects malformed URLs instead of silently defaulting', () => {
    expect(() => readServerEnv({ NODE_ENV: 'test', DATABASE_URL: 'not-a-url' })).toThrow(ServerConfigError)
  })
})
