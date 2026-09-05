import { createCipheriv, createHmac, timingSafeEqual, randomBytes } from 'node:crypto'
import { ServerConfigError, readServerEnv } from './env'

const FORM_TOKEN_MAX_AGE_MS = 15 * 60 * 1000

export function issueCommentFormToken(secret: string, issuedAt = Date.now()): string {
  const timestamp = String(issuedAt)
  const signature = createHmac('sha256', secret).update(timestamp).digest('base64url')
  return `${timestamp}.${signature}`
}

export function verifyCommentFormToken(token: string, secret: string, now = Date.now()): boolean {
  const [timestamp, signature, extra] = token.split('.')
  const issuedAt = Number(timestamp)
  if (extra !== undefined || !timestamp || !signature || !Number.isSafeInteger(issuedAt) || issuedAt > now || now - issuedAt > FORM_TOKEN_MAX_AGE_MS) return false
  const expected = createHmac('sha256', secret).update(timestamp).digest('base64url')
  const actualBytes = Buffer.from(signature)
  const expectedBytes = Buffer.from(expected)
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes)
}

export function hashSensitive(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function encryptEmail(email: string, encodedKey: string): string {
  const key = Buffer.from(encodedKey, 'base64')
  if (key.length !== 32) throw new ServerConfigError('COMMENT_EMAIL_ENCRYPTION_KEY must decode to 32 bytes')
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(email, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join(':')
}

export function commentSecrets(input: NodeJS.ProcessEnv = process.env): { authSecret: string; encryptionKey: string } {
  const env = readServerEnv(input)
  if (!env.BETTER_AUTH_SECRET || !env.COMMENT_EMAIL_ENCRYPTION_KEY) {
    throw new ServerConfigError('Comment protection requires BETTER_AUTH_SECRET and COMMENT_EMAIL_ENCRYPTION_KEY')
  }
  return { authSecret: env.BETTER_AUTH_SECRET, encryptionKey: env.COMMENT_EMAIL_ENCRYPTION_KEY }
}

export function isHoneypotSubmission(honeypot: string | undefined): boolean {
  return Boolean(honeypot?.trim())
}

export function redactEmailForLogs(): never {
  throw new Error('Raw comment email must never be logged or returned')
}
