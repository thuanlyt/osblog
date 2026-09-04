import { readServerEnv, ServerConfigError } from './env'

export const ADMIN_ROLE = 'admin'

export interface AuthenticatedUser {
  email?: unknown
  role?: unknown
}

export class AdminAuthorizationError extends Error {
  constructor(message = 'Admin authorization required') {
    super(message)
    this.name = 'AdminAuthorizationError'
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isAdminUser(user: AuthenticatedUser, input: NodeJS.ProcessEnv = process.env): boolean {
  const adminEmail = readServerEnv(input).ADMIN_EMAIL
  return Boolean(
    adminEmail
      && user.role === ADMIN_ROLE
      && typeof user.email === 'string'
      && normalizeEmail(user.email) === normalizeEmail(adminEmail),
  )
}

export function requireAdminUser(user: AuthenticatedUser | null | undefined, input: NodeJS.ProcessEnv = process.env): void {
  if (!user || !isAdminUser(user, input)) {
    throw new AdminAuthorizationError()
  }
}

export function requireAuthIdentity(input: NodeJS.ProcessEnv = process.env): { email: string; origin: string } {
  const env = readServerEnv(input)
  if (!env.ADMIN_EMAIL || !env.BETTER_AUTH_URL) {
    throw new ServerConfigError('ADMIN_EMAIL and BETTER_AUTH_URL are required for admin auth')
  }
  return { email: normalizeEmail(env.ADMIN_EMAIL), origin: new URL(env.BETTER_AUTH_URL).origin }
}
