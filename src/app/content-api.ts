export interface PublishedPost {
  id: string
  slug: string
  titleVi: string
  titleEn: string
  excerptVi: string
  excerptEn: string
  bodyVi?: string
  bodyEn?: string
  coverImageUrl: string | null
  coverImageAltVi: string | null
  coverImageAltEn: string | null
  publishedAt: string | null
  updatedAt: string
  category: { id: string; slug: string; nameVi: string; nameEn: string }
}

interface ApiEnvelope<T> {
  data: T | null
  error: { code: string; message: string } | null
  requestId: string
}

export class ContentApiError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'ContentApiError'
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { headers: { accept: 'application/json' }, signal })
  let payload: ApiEnvelope<T>
  try {
    payload = await response.json() as ApiEnvelope<T>
  } catch {
    throw new ContentApiError('INVALID_RESPONSE', 'The content service returned invalid data')
  }
  if (!response.ok || payload.error || payload.data === null) {
    throw new ContentApiError(payload.error?.code ?? 'REQUEST_FAILED', payload.error?.message ?? 'Content could not be loaded')
  }
  return payload.data
}

export function fetchLatestPosts(signal?: AbortSignal): Promise<PublishedPost[]> {
  return getJson<PublishedPost[]>('/api/posts', signal)
}

export function fetchPostBySlug(slug: string, signal?: AbortSignal): Promise<PublishedPost> {
  return getJson<PublishedPost>(`/api/posts/slug/${encodeURIComponent(slug)}`, signal)
}

export function fetchCommentFormToken(signal?: AbortSignal): Promise<string> {
  return getJson<{ token: string }>('/api/comments/token', signal).then((data) => data.token)
}

export async function submitComment(input: { postId: string; email: string; body: string; formToken: string }, signal?: AbortSignal): Promise<{ accepted: true }> {
  const response = await fetch('/api/comments', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  })
  let payload: ApiEnvelope<{ accepted: true }>
  try {
    payload = await response.json() as ApiEnvelope<{ accepted: true }>
  } catch {
    throw new ContentApiError('INVALID_RESPONSE', 'The comment service returned invalid data')
  }
  if (!response.ok || payload.error || payload.data === null) {
    throw new ContentApiError(payload.error?.code ?? 'REQUEST_FAILED', payload.error?.message ?? 'Comment could not be submitted')
  }
  return payload.data
}
