import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { HttpError } from './http'
import { ServerConfigError } from './env'

export const BODY_LIMIT = 768 * 1024
// Draining (not cancelling) an over-limit body lets Node finish framing it on the wire, so the
// connection stays safe to reuse for the next request; cancelling can leave a chunked body's end
// undetermined and stall the rejection until the client gives up.
function drainInBackground(reader: ReadableStreamDefaultReader<Uint8Array>) {
  void (async () => { try { while (!(await reader.read()).done); } catch { /* connection already gone */ } finally { reader.releaseLock() } })()
}
export async function boundedBody(request: Request): Promise<string> {
  if (Number(request.headers.get('content-length')) > BODY_LIMIT) {
    if (request.body) drainInBackground(request.body.getReader())
    throw new HttpError(413, 'BODY_TOO_LARGE', 'Request body exceeds 768 KiB.')
  }
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []; let size = 0; let handedOff = false
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      size += part.value.byteLength
      if (size > BODY_LIMIT) { handedOff = true; drainInBackground(reader); throw new HttpError(413, 'BODY_TOO_LARGE', 'Request body exceeds 768 KiB.') }
      chunks.push(part.value)
    }
  } finally { if (!handedOff) reader.releaseLock() }
  return Buffer.concat(chunks).toString('utf8')
}
export function parseJson(raw: string, contentType: string | null): unknown {
  if (!contentType?.toLowerCase().startsWith('application/json')) throw new HttpError(415, 'CONTENT_TYPE', 'Use application/json.')
  try { return JSON.parse(raw) } catch { throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON.') }
}
export function assertOrigin(request: Request, origin: string) {
  if (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'CSRF_REJECTED', 'This request must originate from this site.')
}
export function json(data: unknown, requestId: string = randomUUID(), status = 200): Response {
  return Response.json({ data, error: null, requestId }, { status, headers: { 'cache-control': 'no-store' } })
}
export function errorResponse(error: unknown, requestId: string): Response {
  let status = 500, code = 'INTERNAL_ERROR', message = 'The request could not be completed. Please try again.'
  let fields: Record<string, string[]> | undefined
  if (error instanceof HttpError) { status = error.status; code = error.code; message = error.message }
  else if (error instanceof ServerConfigError) { status = 503; code = 'SERVER_MISCONFIGURED'; message = 'Server configuration is incomplete.' }
  else if (error instanceof z.ZodError) { status = 400; code = 'INVALID_INPUT'; message = 'Check the highlighted fields.'; fields = z.flattenError(error).fieldErrors }
  else {
    const candidate = error as { code?: string; cause?: { code?: string } }
    const dbCode = candidate?.code ?? candidate?.cause?.code
    if (dbCode === '23505') { status = 409; code = 'SLUG_TAKEN'; message = 'This slug is already in use. Choose a different slug.'; fields = { slug: [message] } }
    if (dbCode === '23503' || dbCode === '23514') { status = 409; code = 'CONSTRAINT'; message = 'The record conflicts with existing content. Reload and try again.' }
  }
  return Response.json({ data: null, error: { code, message, ...(fields ? { fields } : {}) }, requestId }, { status, headers: { 'cache-control': 'no-store', ...(status === 429 ? { 'retry-after': '3600' } : {}) } })
}
