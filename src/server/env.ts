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
  SITE_URL: z.string().url().optional(),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
})

export type ServerEnv = z.infer<typeof rawEnvSchema>

export class ServerConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServerConfigError'
  }
}

export function readServerEnv(input: NodeJS.ProcessEnv = process.env): ServerEnv {
  // Optional keys in .env.example may be left empty; required production keys still fail closed.
  const parsed = rawEnvSchema.safeParse(Object.fromEntries(Object.entries(input).filter(([, value]) => value !== '')))
  if (!parsed.success) {
    throw new ServerConfigError('Server environment contains invalid values')
  }

  const env = parsed.data
  if (env.NODE_ENV === 'production') {
    const missing = [
      ['DATABASE_URL', env.DATABASE_URL],
      ['BETTER_AUTH_SECRET', env.BETTER_AUTH_SECRET],
      ['BETTER_AUTH_URL', env.BETTER_AUTH_URL],
      ['ADMIN_EMAIL', env.ADMIN_EMAIL],
      ['COMMENT_EMAIL_ENCRYPTION_KEY', env.COMMENT_EMAIL_ENCRYPTION_KEY],
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
  if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) throw new ServerConfigError('DATABASE_URL must be a Postgres connection URL')
  return env.DATABASE_URL
}

export function siteOrigin(input: NodeJS.ProcessEnv = process.env): string {
  const value = input.SITE_URL ?? input.BETTER_AUTH_URL ?? input.VITE_SITE_URL
  if (!value) throw new ServerConfigError('SITE_URL or BETTER_AUTH_URL is required')
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) throw new ServerConfigError('Site URL must use HTTP(S)')
  if (input.NODE_ENV === 'production' && url.protocol !== 'https:') throw new ServerConfigError('Production site URL must use HTTPS')
  return url.origin
}
