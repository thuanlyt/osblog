import type { AdminComment, Category, Post, PublicComment } from './types'

export type ApiFieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly code: string
  readonly fields?: ApiFieldErrors
  readonly status: number

  constructor(code: string, message: string, status = 0, fields?: ApiFieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fields = fields
  }
}

interface Envelope<T> {
  data: T | null
  error: { code: string; message: string; fields?: ApiFieldErrors } | null
  requestId: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
        ...init?.headers,
      },
      ...init,
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.')
  }
  let payload: Envelope<T> | null = null
  try {
    payload = (await response.json()) as Envelope<T>
  } catch {
    /* handled below */
  }
  if (!payload) throw new ApiError('INVALID_RESPONSE', 'The server returned an unexpected response.', response.status)
  if (!response.ok || payload.error) {
    throw new ApiError(payload.error?.code ?? 'REQUEST_FAILED', payload.error?.message ?? 'The request could not be completed.', response.status, payload.error?.fields)
  }
  if (payload.data === null) throw new ApiError('EMPTY_RESPONSE', 'The server returned no data.', response.status)
  return payload.data
}

function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'GET', signal })
}

function send<T>(path: string, method: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body), signal })
}

export interface PostListQuery {
  sort?: 'latest' | 'popular' | 'random'
  q?: string
  category?: string
  year?: string
  page?: number
  limit?: number
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export function fetchPosts(query: PostListQuery, signal?: AbortSignal): Promise<{ posts: Post[]; total: number }> {
  return get(`/api/posts${buildQuery({ ...query })}`, signal)
}

export function fetchPostBySlug(slug: string, signal?: AbortSignal): Promise<Post> {
  return get(`/api/posts/slug/${encodeURIComponent(slug)}`, signal)
}

export function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  return get('/api/categories', signal)
}

export function fetchCommentToken(signal?: AbortSignal): Promise<string> {
  return get<{ formToken: string }>('/api/comments/token', signal).then((data) => data.formToken)
}

export function fetchComments(postId: string, signal?: AbortSignal): Promise<PublicComment[]> {
  return get(`/api/comments?postId=${encodeURIComponent(postId)}`, signal)
}

export function postComment(input: { postId: string; email: string; body: string; formToken: string; honeypot: string }, signal?: AbortSignal): Promise<{ accepted: true }> {
  return send('/api/comments', 'POST', input, signal)
}

export function recordView(postId: string): Promise<{ counted: boolean }> {
  return send(`/api/posts/${encodeURIComponent(postId)}/view`, 'POST', {})
}

export function fetchAdminSession(signal?: AbortSignal): Promise<{ email: string }> {
  return get('/api/admin/session', signal)
}

interface BetterAuthResponse {
  user?: { email?: string }
  message?: string
  code?: string
}

export async function signInWithPassword(email: string, password: string): Promise<{ email: string }> {
  const response = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  let payload: BetterAuthResponse | null = null
  try {
    payload = (await response.json()) as BetterAuthResponse
  } catch {
    /* fall through to generic error */
  }
  if (!response.ok) {
    throw new ApiError(payload?.code ?? 'SIGN_IN_FAILED', payload?.message ?? 'Sign-in failed. Check your email and password.', response.status)
  }
  return { email: payload?.user?.email ?? email }
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/sign-out', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({}),
  })
}

export function fetchAdminPosts(signal?: AbortSignal): Promise<Post[]> {
  return get('/api/admin/posts', signal)
}

export function fetchAdminPost(id: string, signal?: AbortSignal): Promise<Post> {
  return get(`/api/admin/posts/${encodeURIComponent(id)}`, signal)
}

export interface PostPayload {
  categoryId: string
  slug: string
  titleEn: string
  titleVi: string
  excerptEn: string
  excerptVi: string
  bodyEn: string
  bodyVi: string
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  coverImageUrl: string | null
  coverImageAltEn: string | null
  coverImageAltVi: string | null
  seoTitleEn: string | null
  seoTitleVi: string | null
  seoDescriptionEn: string | null
  seoDescriptionVi: string | null
}

export function createAdminPost(payload: PostPayload): Promise<Post> {
  return send('/api/admin/posts', 'POST', payload)
}

export function updateAdminPost(id: string, payload: Partial<PostPayload> & { expectedUpdatedAt: string }): Promise<Post> {
  return send(`/api/admin/posts/${encodeURIComponent(id)}`, 'PATCH', payload)
}

export function archiveAdminPost(id: string, expectedUpdatedAt: string): Promise<Post> {
  return send(`/api/admin/posts/${encodeURIComponent(id)}`, 'DELETE', { expectedUpdatedAt })
}

export function fetchAdminCategories(signal?: AbortSignal): Promise<Category[]> {
  return get('/api/admin/categories', signal)
}

export interface CategoryPayload {
  slug: string
  nameEn: string
  nameVi: string
  descriptionEn: string | null
  descriptionVi: string | null
  isArchived: boolean
}

export function createCategory(payload: CategoryPayload): Promise<Category> {
  return send('/api/admin/categories', 'POST', payload)
}

export function updateCategory(id: string, payload: CategoryPayload & { expectedUpdatedAt: string }): Promise<Category> {
  return send(`/api/admin/categories/${encodeURIComponent(id)}`, 'PATCH', payload)
}

export function archiveCategory(id: string, expectedUpdatedAt: string): Promise<Category> {
  return send(`/api/admin/categories/${encodeURIComponent(id)}`, 'DELETE', { expectedUpdatedAt })
}

export function fetchAdminComments(signal?: AbortSignal): Promise<AdminComment[]> {
  return get('/api/admin/comments', signal)
}

export interface ModerationPayload {
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  expectedUpdatedAt: string
  reason?: string | null
  body?: string
}

export function moderateComment(id: string, payload: ModerationPayload): Promise<{ id: string; status: string; updatedAt: string }> {
  return send(`/api/admin/comments/${encodeURIComponent(id)}`, 'PATCH', payload)
}

export function deleteAdminComment(id: string, expectedUpdatedAt: string): Promise<{ deleted: true }> {
  return send(`/api/admin/comments/${encodeURIComponent(id)}`, 'DELETE', { expectedUpdatedAt })
}
