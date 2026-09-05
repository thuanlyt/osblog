import { randomUUID } from 'node:crypto'
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { PageData } from '../app/types'
import { createDatabase, type Database } from './db'
import { createAuth } from './auth'
import { isAdminUser } from './auth-policy'
import { siteOrigin } from './env'
import { HttpError } from './http'
import { assertOrigin, boundedBody, errorResponse, json, parseJson } from './request'
import { category, post } from './schema'
import { archivePost, countPublishedPosts, createPost, getPublishedPost, getPublishedPostById, listCategories, listPublishedPosts, updatePost, visiblePost } from './content'
import { categoryInput, categoryUpdateInput, createPostInput, deletePostInput, listPostsQuery, updatePostInput } from './content-contract'
import { saveCategory } from './categories'
import { approvedComments, consumeRateLimit, deleteComment, listModerationComments, moderateComment, submitComment } from './comments'
import { hashSensitive, issueCommentFormToken } from './comment-policy'
import { commentSubmissionInput, moderationInput } from './comment-contract'
import { loadPage } from './pages'
import { documents } from './docs'
import { escapeHtml } from './seo'

export type Renderer = (data: PageData, origin: string, nonce: string) => string | Promise<string>
export interface RouterOptions { env?: NodeJS.ProcessEnv; database?: Database; render: Renderer }
export function createRouter(options: RouterOptions) {
  type AdminSessionUser = Parameters<typeof isAdminUser>[0] & { id: string; email: string }
  const env = options.env ?? process.env
  let db = options.database
  let auth: ReturnType<typeof createAuth> | undefined
  const database = () => db ??= createDatabase(env)
  const authentication = () => auth ??= createAuth(env, database())
  const appendSetCookies = (source: HeadersInit | undefined, target: Headers) => {
    if (!source) return
    const headers = source instanceof Headers ? source : new Headers(source)
    headers.forEach((value, key) => { if (key.toLowerCase() === 'set-cookie') target.append(key, value) })
  }
  async function admin(request: Request, sessionHeaders: Headers) {
    // Use Better Auth's native handler so success and failure responses share
    // the same supported HTTP boundary. In particular, a refresh that cannot
    // persist its session returns 401 plus cookie-clearing headers; a direct
    // api.getSession() call can throw before those headers are exposed.
    const authResponse = await authentication().handler(new Request(new URL('/api/auth/get-session', request.url), { method: 'GET', headers: request.headers }))
    appendSetCookies(authResponse.headers, sessionHeaders)
    if (authResponse.status === 401) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue.')
    if (!authResponse.ok) throw new HttpError(503, 'AUTH_UNAVAILABLE', 'Authentication is temporarily unavailable.')
    const payload = await authResponse.json() as { user?: AdminSessionUser } | null
    if (!payload?.user) throw new HttpError(401, 'UNAUTHENTICATED', 'Sign in to continue.')
    if (!isAdminUser(payload.user, env)) throw new HttpError(403, 'FORBIDDEN', 'Admin authorization required.')
    return payload.user
  }
  async function dispatch(request: Request, ip: string, requestId: string, nonce: string, sessionHeaders: Headers): Promise<Response> {
    const url = new URL(request.url), path = url.pathname, method = request.method
    const origin = siteOrigin(env)
    const mutate = !['GET', 'HEAD', 'OPTIONS'].includes(method)
    if (mutate) assertOrigin(request, origin)
    const body = async () => parseJson(await boundedBody(request), request.headers.get('content-type'))
    const idFrom = (value: string) => z.string().uuid().parse(value)
    const notFound = () => { throw new HttpError(404, 'NOT_FOUND', 'Resource not found.') }
    const methodNotAllowed = () => { throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed.') }
    const privateColumns = { ...getTableColumns(post), category: { id: category.id, slug: category.slug, nameEn: category.nameEn, nameVi: category.nameVi } }
    if (path.startsWith('/api/auth/')) {
      // Keep the externally reachable auth surface minimal: no public registration or profile mutation.
      if (!['/api/auth/sign-in/email', '/api/auth/sign-out', '/api/auth/get-session'].includes(path)) return notFound()
      if ((path === '/api/auth/get-session' && method !== 'GET') || (path !== '/api/auth/get-session' && method !== 'POST')) return methodNotAllowed()
      let raw: string | undefined
      if (method === 'POST') {
        raw = await boundedBody(request)
        const parsed = parseJson(raw, request.headers.get('content-type'))
        if (path === '/api/auth/sign-in/email') {
          const credentials = z.object({ email: z.string().email().max(320), password: z.string().min(1).max(128) }).parse(parsed)
          const secret = env.BETTER_AUTH_SECRET ?? ''
          if (!secret) throw new HttpError(503, 'SERVER_MISCONFIGURED', 'Authentication is not configured.')
          const allowedIp = await consumeRateLimit(database(), `login:ip:${hashSensitive(ip, secret)}`, new Date(), 15, 15 * 60_000)
          const allowedEmail = await consumeRateLimit(database(), `login:email:${hashSensitive(credentials.email.toLowerCase(), secret)}`, new Date(), 15, 15 * 60_000)
          if (!allowedIp || !allowedEmail) throw new HttpError(429, 'RATE_LIMITED', 'Too many sign-in attempts. Try again later.')
        }
      }
      return authentication().handler(new Request(request.url, { method, headers: request.headers, body: raw }))
    }
    if (path === '/api/healthz') {
      if (method !== 'GET') return methodNotAllowed()
      await database().execute(sql`select 1`)
      return json({ status: 'ok', database: 'connected' }, requestId)
    }
    if (path === '/api/posts' && method === 'GET') {
      const query = listPostsQuery.parse(Object.fromEntries(url.searchParams))
      const [posts, total] = await Promise.all([listPublishedPosts(database(), query), countPublishedPosts(database(), query)])
      return json({ posts, total }, requestId)
    }
    if (path.startsWith('/api/posts/slug/') && method === 'GET') {
      const row = await getPublishedPost(database(), path.slice('/api/posts/slug/'.length))
      return row ? json(row, requestId) : notFound()
    }
    if (path === '/api/categories' && method === 'GET') return json(await listCategories(database()), requestId)
    const viewMatch = path.match(/^\/api\/posts\/([^/]+)\/view$/)
    if (viewMatch && method === 'POST') {
      const id = idFrom(viewMatch[1])
      if (!await getPublishedPostById(database(), id)) return notFound()
      const secret = env.BETTER_AUTH_SECRET
      if (!secret) throw new HttpError(503, 'SERVER_MISCONFIGURED', 'View counting is not configured.')
      const counted = await database().transaction(async (tx) => {
        const allowed = await consumeRateLimit(tx, `view:${id}:${hashSensitive(ip, secret)}`, new Date(), 1, 86_400_000)
        if (allowed) await tx.update(post).set({ viewCount: sql`LEAST(${post.viewCount} + 1, 2147483647)` }).where(eq(post.id, id))
        return allowed
      })
      return json({ counted }, requestId)
    }
    if (path === '/api/comments/token' && method === 'GET') {
      if (!env.BETTER_AUTH_SECRET) throw new HttpError(503, 'SERVER_MISCONFIGURED', 'Comments are not configured.')
      return json({ formToken: issueCommentFormToken(env.BETTER_AUTH_SECRET) }, requestId)
    }
    if (path === '/api/comments') {
      if (method === 'GET') {
        const id = idFrom(url.searchParams.get('postId') ?? '')
        if (!await getPublishedPostById(database(), id)) return notFound()
        return json(await approvedComments(database(), id), requestId)
      }
      if (method === 'POST') return json(await submitComment(database(), commentSubmissionInput.parse(await body()), { ipAddress: ip, userAgent: request.headers.get('user-agent') ?? '' }, requestId, env), requestId, 202)
      return methodNotAllowed()
    }
    if (path.startsWith('/api/admin/')) {
      const user = await admin(request, sessionHeaders)
      if (path === '/api/admin/session' && method === 'GET') return json({ email: user.email }, requestId)
      if (path === '/api/admin/posts') {
        if (method === 'GET') return json(await database().select(privateColumns).from(post).innerJoin(category, eq(post.categoryId, category.id)).orderBy(desc(post.updatedAt)).limit(500), requestId)
        if (method === 'POST') return json(await createPost(database(), createPostInput.parse(await body()), requestId, user.id), requestId, 201)
        return methodNotAllowed()
      }
      const postMatch = path.match(/^\/api\/admin\/posts\/([^/]+)$/)
      if (postMatch) {
        const id = idFrom(postMatch[1])
        if (method === 'GET') {
          const [row] = await database().select(privateColumns).from(post).innerJoin(category, eq(post.categoryId, category.id)).where(eq(post.id, id))
          return row ? json(row, requestId) : notFound()
        }
        if (method === 'PATCH') return json(await updatePost(database(), id, updatePostInput.parse(await body()), requestId, user.id), requestId)
        if (method === 'DELETE') return json(await archivePost(database(), id, deletePostInput.parse(await body()).expectedUpdatedAt, requestId, user.id), requestId)
        return methodNotAllowed()
      }
      if (path === '/api/admin/categories') {
        if (method === 'GET') return json(await listCategories(database(), true), requestId)
        if (method === 'POST') return json(await saveCategory(database(), categoryInput.parse(await body()), undefined, undefined, requestId, user.id), requestId, 201)
        return methodNotAllowed()
      }
      const categoryMatch = path.match(/^\/api\/admin\/categories\/([^/]+)$/)
      if (categoryMatch) {
        const id = idFrom(categoryMatch[1])
        if (method === 'PATCH') { const value = categoryUpdateInput.parse(await body()); return json(await saveCategory(database(), value, id, value.expectedUpdatedAt, requestId, user.id), requestId) }
        if (method === 'DELETE') {
          const value = deletePostInput.parse(await body())
          const [row] = await database().select().from(category).where(eq(category.id, id))
          if (!row) return notFound()
          return json(await saveCategory(database(), { ...row, isArchived: true }, id, value.expectedUpdatedAt, requestId, user.id), requestId)
        }
        return methodNotAllowed()
      }
      if (path === '/api/admin/comments' && method === 'GET') return json(await listModerationComments(database()), requestId)
      const commentMatch = path.match(/^\/api\/admin\/comments\/([^/]+)$/)
      if (commentMatch) {
        const id = idFrom(commentMatch[1])
        if (method === 'PATCH') return json(await moderateComment(database(), id, moderationInput.parse(await body()), requestId, user.id), requestId)
        if (method === 'DELETE') return json(await deleteComment(database(), id, deletePostInput.parse(await body()).expectedUpdatedAt, requestId, user.id), requestId)
        return methodNotAllowed()
      }
      return notFound()
    }
    if (path.startsWith('/api/')) return notFound()
    if (!['GET', 'HEAD'].includes(method)) return methodNotAllowed()
    if (path === '/robots.txt') return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /search\nSitemap: ${origin}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
    if (path === '/sitemap.xml') {
      // SQL streams by bounded pages rather than silently omitting posts after the first page.
      const entries = ['/', '/archive', '/about', '/docs', ...documents('en').map((doc) => `/docs/${doc.slug}`), ...(await listCategories(database())).map((row) => `/category/${row.slug}`)]
        .flatMap((path) => ['en', 'vi'].map((lang) => ({ path: `${path}?lang=${lang}`, modified: null as Date | null })))
      let cursor = ''
      for (;;) {
        const rows = await database().select({ id: post.id, slug: post.slug, updatedAt: post.updatedAt }).from(post).innerJoin(category, eq(post.categoryId, category.id))
          .where(and(visiblePost(), cursor ? sql`${post.id} > ${cursor}::uuid` : undefined)).orderBy(post.id).limit(1000)
        for (const row of rows) for (const lang of ['en', 'vi']) entries.push({ path: `/post/${row.slug}?lang=${lang}`, modified: row.updatedAt })
        if (rows.length < 1000) break
        cursor = rows.at(-1)!.id
        if (entries.length > 49000) throw new HttpError(503, 'SITEMAP_CAPACITY', 'Sitemap index partitioning is required for this site size.')
      }
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map((entry) => `<url><loc>${escapeHtml(origin + entry.path)}</loc>${entry.modified ? `<lastmod>${entry.modified.toISOString()}</lastmod>` : ''}</url>`).join('')}</urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
    }
    let email: string | undefined
    if (/^\/admin(?:\/|$)/.test(path) && path !== '/admin/login') {
      try { email = (await admin(request, sessionHeaders)).email } catch (error) { if (error instanceof HttpError && error.status === 401) return Response.redirect(`${origin}/admin/login`, 303); throw error }
    }
    const data = await loadPage(url, database)
    if (email) data.adminEmail = email
    return new Response(await options.render(data, origin, nonce), { status: data.status, headers: { 'content-type': 'text/html; charset=utf-8' } })
  }
  return async (request: Request, context: { ip?: string } = {}): Promise<Response> => {
    const requestId = randomUUID(), nonce = randomUUID().replaceAll('-', '')
    const sessionHeaders = new Headers()
    let response: Response
    try { response = await dispatch(request, context.ip ?? 'unknown', requestId, nonce, sessionHeaders) }
    catch (error) {
      // Never log request bodies, credentials, cookies or database connection strings.
      response = errorResponse(error, requestId)
      const url = new URL(request.url)
      if (['GET', 'HEAD'].includes(request.method) && !url.pathname.startsWith('/api/') && !['/robots.txt', '/sitemap.xml'].includes(url.pathname)) {
        const lang = url.searchParams.get('lang') === 'vi' ? 'vi' : 'en'
        const data: PageData = { kind: 'error', path: url.pathname, lang, status: response.status, title: lang === 'vi' ? 'Tạm thời không thể tải trang' : 'Temporarily unable to load this page', description: lang === 'vi' ? 'Vui lòng thử lại sau ít phút.' : 'Please try again in a few moments.' }
        try { response = new Response(await options.render(data, siteOrigin(env), nonce), { status: response.status, headers: { 'content-type': 'text/html; charset=utf-8' } }) } catch { /* Keep sanitized JSON if even the renderer is unavailable. */ }
      }
    }
    const headers = new Headers(response.headers)
    sessionHeaders.forEach((value, key) => headers.append(key, value))
    headers.set('x-request-id', requestId)
    headers.set('x-content-type-options', 'nosniff')
    headers.set('referrer-policy', 'strict-origin-when-cross-origin')
    headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()')
    headers.set('cache-control', 'no-store')
    headers.set('content-security-policy', `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' https: http: data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`)
    if (new URL(request.url).pathname.startsWith('/admin') || new URL(request.url).pathname.startsWith('/api')) headers.set('x-robots-tag', 'noindex, nofollow')
    return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers })
  }
}
