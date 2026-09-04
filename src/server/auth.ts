import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import { createDatabase } from './db'
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

export function createAuth(input: NodeJS.ProcessEnv = process.env) {
  const env = readServerEnv(input)
  const identity = requireAuthIdentity(input)
  const db = createDatabase(input)

  return betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: identity.origin,
    trustedOrigins: [identity.origin],
    emailAndPassword: ADMIN_AUTH_POLICY.emailAndPassword,
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
