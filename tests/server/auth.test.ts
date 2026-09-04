import { describe, expect, it } from 'vitest'
import { ADMIN_AUTH_POLICY, createAuth } from '../../src/server/auth'
import { AdminAuthorizationError, isAdminUser, requireAuthIdentity, requireAdminUser } from '../../src/server/auth-policy'

const configuredEnv = {
  NODE_ENV: 'test' as const,
  DATABASE_URL: 'https://example.neon.tech/test',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  BETTER_AUTH_URL: 'https://example.test',
  ADMIN_EMAIL: 'admin@example.test',
}

describe('admin auth boundary', () => {
  it('fails closed when provider configuration is missing', () => {
    expect(() => createAuth({ NODE_ENV: 'test', ADMIN_EMAIL: 'admin@example.test', BETTER_AUTH_URL: 'https://example.test' })).toThrow(/DATABASE_URL/)
  })

  it('requires both the admin role and configured email identity', () => {
    expect(isAdminUser({ role: 'admin', email: 'ADMIN@example.test' }, configuredEnv)).toBe(true)
    expect(isAdminUser({ role: 'user', email: 'admin@example.test' }, configuredEnv)).toBe(false)
    expect(isAdminUser({ role: 'admin', email: 'other@example.test' }, configuredEnv)).toBe(false)
    expect(() => requireAdminUser({ role: 'user', email: 'admin@example.test' }, configuredEnv)).toThrow(AdminAuthorizationError)
  })

  it('requires an explicit allow-listed identity before auth construction', () => {
    expect(requireAuthIdentity(configuredEnv)).toEqual({ email: 'admin@example.test', origin: 'https://example.test' })
    expect(() => requireAuthIdentity({ NODE_ENV: 'test', BETTER_AUTH_URL: 'https://example.test' })).toThrow(/ADMIN_EMAIL/)
  })

  it('disables public registration in the Better Auth policy', () => {
    expect(ADMIN_AUTH_POLICY.emailAndPassword).toMatchObject({
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: true,
    })
  })
})
