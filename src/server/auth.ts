import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import { createDatabase, type Database } from './db'
import { readServerEnv } from './env'
import { requireAuthIdentity } from './auth-policy'
import { authSchema } from './auth-schema'

export const ADMIN_AUTH_POLICY = {
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: true,
  },
} as const

export function createAuth(input: NodeJS.ProcessEnv = process.env, database?: Database) {
  const env = readServerEnv(input)
  const identity = requireAuthIdentity(input)
  const db = database ?? createDatabase(input)
  if (!env.BETTER_AUTH_SECRET) throw new Error('BETTER_AUTH_SECRET is required')

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema: authSchema, transaction: true }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: identity.origin,
    trustedOrigins: [identity.origin],
    emailAndPassword: ADMIN_AUTH_POLICY.emailAndPassword,
    session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 60, cookieCache: { enabled: false } },
    // Router uses atomic, durable Postgres rate limits, including sign-in attempts.
    rateLimit: { enabled: false },
    advanced: { useSecureCookies: identity.origin.startsWith('https://') },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          input: false,
          returned: true,
          required: false,
          defaultValue: 'admin',
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => user.email.trim().toLowerCase() === identity.email
            ? undefined
            : false,
        },
      },
    },
  })
}
