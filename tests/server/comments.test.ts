import { describe, expect, it } from 'vitest'
import { commentSubmissionInput, moderationInput } from '../../src/server/comment-contract'
import { commentSecrets, encryptEmail, hashSensitive, issueCommentFormToken, verifyCommentFormToken } from '../../src/server/comment-policy'

const secret = 's'.repeat(32)
const key = Buffer.alloc(32, 7).toString('base64')

describe('comment privacy and abuse boundary', () => {
  it('issues short-lived signed form tokens', () => {
    const issuedAt = Date.parse('2026-09-05T00:00:00.000Z')
    const token = issueCommentFormToken(secret, issuedAt)
    expect(verifyCommentFormToken(token, secret, issuedAt + 60_000)).toBe(true)
    expect(verifyCommentFormToken(token, secret, issuedAt + 16 * 60_000)).toBe(false)
    expect(verifyCommentFormToken(token, 'x'.repeat(32), issuedAt + 60_000)).toBe(false)
  })

  it('hashes identifiers and encrypts email without returning plaintext', () => {
    expect(hashSensitive('127.0.0.1', secret)).toHaveLength(64)
    const ciphertext = encryptEmail('person@example.test', key)
    expect(ciphertext).toMatch(/^v1:/)
    expect(ciphertext).not.toContain('person@example.test')
  })

  it('fails closed when comment encryption is not configured', () => {
    expect(() => commentSecrets({ NODE_ENV: 'test', BETTER_AUTH_SECRET: secret })).toThrow(/COMMENT_EMAIL_ENCRYPTION_KEY/)
  })

  it('accepts a normal pending submission and rejects malformed input', () => {
    const input = commentSubmissionInput.safeParse({
      postId: '00000000-0000-4000-8000-000000000001',
      email: 'person@example.test',
      body: 'A useful note',
      formToken: 'signed-token',
    })
    expect(input.success).toBe(true)
    expect(commentSubmissionInput.safeParse({ ...input, email: 'not-an-email' }).success).toBe(false)
  })

  it('requires concurrency tokens for every moderation transition', () => {
    const expectedUpdatedAt = '2026-09-05T00:00:00.000Z'
    expect(moderationInput.safeParse({ status: 'approved', expectedUpdatedAt }).success).toBe(true)
    expect(moderationInput.safeParse({ status: 'pending', expectedUpdatedAt }).success).toBe(true)
    expect(moderationInput.safeParse({ status: 'approved' }).success).toBe(false)
    expect(moderationInput.safeParse({ status: 'invalid', expectedUpdatedAt }).success).toBe(false)
  })
})
