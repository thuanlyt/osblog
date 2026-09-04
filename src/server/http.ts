import { randomUUID } from 'node:crypto'
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http'
import { AdminAuthorizationError } from './auth-policy'
import { ServerConfigError } from './env'

export interface ApiError {
  code: string
  message: string
}

export interface ApiEnvelope<T> {
  data: T | null
  error: ApiError | null
  requestId: string
}

export class HttpError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export function getRequestId(request: IncomingMessage): string {
  const requestId = request.headers['x-request-id']
  return typeof requestId === 'string' && requestId.trim() ? requestId.trim().slice(0, 120) : randomUUID()
}

export function writeJson<T>(response: ServerResponse, status: number, body: ApiEnvelope<T>): void {
  response.statusCode = status
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

export function writeError(response: ServerResponse, requestId: string, error: unknown): void {
  if (error instanceof HttpError) {
    writeJson(response, error.status, { data: null, error: { code: error.code, message: error.message }, requestId })
    return
  }
  if (error instanceof AdminAuthorizationError) {
    writeJson(response, 403, { data: null, error: { code: 'FORBIDDEN', message: error.message }, requestId })
    return
  }
  if (error instanceof ServerConfigError) {
    writeJson(response, 503, { data: null, error: { code: 'SERVER_MISCONFIGURED', message: 'Server configuration is incomplete' }, requestId })
    return
  }
  writeJson(response, 500, { data: null, error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred' }, requestId })
}

export function headersFromRequest(request: IncomingMessage): Headers {
  const headers: IncomingHttpHeaders = request.headers
  const entries = Object.entries(headers).flatMap(([key, value]) => {
    if (Array.isArray(value)) return [[key, value.join(', ')]] as [string, string][]
    return typeof value === 'string' ? [[key, value]] as [string, string][] : []
  })
  return new Headers(entries)
}

export async function readJson(request: IncomingMessage): Promise<unknown> {
  const requestWithBody = request as IncomingMessage & { body?: unknown }
  if (requestWithBody.body !== undefined) return requestWithBody.body

  const chunks: Buffer[] = []
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) throw new HttpError(400, 'INVALID_JSON', 'A JSON request body is required')
  try {
    return JSON.parse(raw) as unknown
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Request body must be valid JSON')
  }
}
