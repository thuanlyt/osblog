import type { IncomingMessage, ServerResponse } from 'node:http'
import { z } from 'zod'
import { databaseForRequest, getPublishedPost } from '../../../src/server/content'
import { getRequestId, writeError, writeJson, HttpError } from '../../../src/server/http'

function postSlug(request: IncomingMessage): string {
  const slug = new URL(request.url ?? '/', 'http://localhost').pathname.split('/').filter(Boolean).pop()
  const parsed = z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(slug)
  if (!parsed.success) throw new HttpError(400, 'INVALID_SLUG', 'A valid post slug is required')
  return parsed.data
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestId = getRequestId(request)
  try {
    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET')
      writeJson(response, 405, { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }, requestId })
      return
    }
    const data = await getPublishedPost(databaseForRequest(), postSlug(request))
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'Published post not found')
    writeJson(response, 200, { data, error: null, requestId })
  } catch (error) {
    writeError(response, requestId, error)
  }
}
