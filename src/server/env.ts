import { z } from 'zod'

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_URL_MIGRATIONS: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  COMMENT_EMAIL_ENCRYPTION_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  VITE_SITE_URL: z.string().url().optional(),
})

export type ServerEnv = z.infer<typeof rawEnvSchema>

export class ServerConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServerConfigError'
  }
}

export function readServerEnv(input: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = rawEnvSchema.safeParse(input)
  if (!parsed.success) {
    throw new ServerConfigError('Server environment contains invalid values')
  }

  const env = parsed.data
  if (env.NODE_ENV === 'production') {
    const missing = [
      ['DATABASE_URL', env.DATABASE_URL],
      ['BETTER_AUTH_SECRET', env.BETTER_AUTH_SECRET],
      ['BETTER_AUTH_URL', env.BETTER_AUTH_URL],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name)

    if (missing.length > 0) {
      throw new ServerConfigError(`Production server configuration is incomplete: ${missing.join(', ')}`)
    }
  }

  return env
}

export function requireDatabaseUrl(input: NodeJS.ProcessEnv = process.env): string {
  const env = readServerEnv(input)
  if (!env.DATABASE_URL) {
    throw new ServerConfigError('DATABASE_URL is required for database access; no in-memory fallback exists')
  }
  return env.DATABASE_URL
}
