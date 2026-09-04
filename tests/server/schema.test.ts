import { describe, expect, it } from 'vitest'
import { auditEvent, category, comment, post, rateLimitBucket } from '../../src/server/schema'

describe('durable content schema', () => {
  it('exposes the tables required by the reviewed architecture', () => {
    expect([category, post, comment, rateLimitBucket, auditEvent]).toHaveLength(5)
    expect(category.slug).toBeDefined()
    expect(post.categoryId).toBeDefined()
    expect(post.status).toBeDefined()
    expect(comment.emailCiphertext).toBeDefined()
    expect(comment.status).toBeDefined()
    expect(rateLimitBucket.key).toBeDefined()
    expect(auditEvent.requestId).toBeDefined()
  })
})
