import { describe, expect, it } from 'vitest'
import { issueCommentFormToken, verifyCommentFormToken } from '../../src/server/comment-policy'

describe('public API contracts', () => {
  it('keeps comment form tokens short-lived and verifiable', () => {
    const token = issueCommentFormToken('s'.repeat(32), 1_000)
    expect(verifyCommentFormToken(token, 's'.repeat(32), 2_000)).toBe(true)
    expect(verifyCommentFormToken(token, 's'.repeat(32), 1_000 + 16 * 60_000)).toBe(false)
  })
})
