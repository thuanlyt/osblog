import { describe, expect, it } from 'vitest'
import { createPostInput, deletePostInput, listPostsQuery, updatePostInput } from '../../src/server/content-contract'

const validPost = {
  categoryId: '00000000-0000-4000-8000-000000000001',
  slug: 'durable-boundary',
  titleVi: 'Ranh giới bền vững',
  titleEn: 'A durable boundary',
  excerptVi: 'Tóm tắt',
  excerptEn: 'Summary',
  bodyVi: 'Nội dung',
  bodyEn: 'Body',
}

describe('content API contracts', () => {
  it('defaults new posts to draft and rejects invalid slugs', () => {
    expect(createPostInput.parse(validPost).status).toBe('draft')
    expect(createPostInput.safeParse({ ...validPost, slug: 'Not valid' }).success).toBe(false)
  })

  it('requires a publication timestamp for explicit publication', () => {
    expect(createPostInput.safeParse({ ...validPost, status: 'published' }).success).toBe(false)
    expect(createPostInput.safeParse({ ...validPost, status: 'published', publishedAt: '2026-09-05T00:00:00.000Z' }).success).toBe(true)
  })

  it('requires optimistic concurrency input for updates', () => {
    expect(updatePostInput.safeParse({ titleEn: 'Updated' }).success).toBe(false)
    expect(updatePostInput.safeParse({ titleEn: 'Updated', expectedUpdatedAt: '2026-09-05T00:00:00.000Z' }).success).toBe(true)
  })

  it('does not inject a default status into a partial update (R1 regression)', () => {
    const parsed = updatePostInput.parse({ titleEn: 'Updated', expectedUpdatedAt: '2026-09-05T00:00:00.000Z' })
    expect('status' in parsed).toBe(false)
    expect(updatePostInput.safeParse({ expectedUpdatedAt: '2026-09-05T00:00:00.000Z' }).success).toBe(false)
  })

  it('rejects a cover URL that is not actually parseable (R2 regression)', () => {
    const withCover = { ...validPost, coverImageAltVi: 'x', coverImageAltEn: 'x' }
    expect(createPostInput.safeParse({ ...withCover, coverImageUrl: 'https://' }).success).toBe(false)
    expect(createPostInput.safeParse({ ...withCover, coverImageUrl: 'https://example.test/cover.png' }).success).toBe(true)
  })

  it('uses the same optimistic concurrency guard for archive requests', () => {
    expect(deletePostInput.safeParse({ expectedUpdatedAt: '2026-09-05T00:00:00.000Z' }).success).toBe(true)
    expect(deletePostInput.safeParse({}).success).toBe(false)
  })

  it('bounds public list size', () => {
    expect(listPostsQuery.parse({ limit: '10' }).limit).toBe(10)
    expect(listPostsQuery.safeParse({ limit: '1000' }).success).toBe(false)
  })
})
