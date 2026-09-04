import type { IncomingMessage, ServerResponse } from 'node:http'
import { archivePost, databaseForRequest, getPublishedPostById, requireAdminSession, updatePost } from '../../src/server/content'
import { deletePostInput, updatePostInput } from '../../src/server/content-contract'
import { getRequestId, readJson, writeError, writeJson, HttpError } from '../../src/server/http'
import { z } from 'zod'

function postId(request: IncomingMessage): string {
  const url = new URL(request.url ?? '/', 'http://localhost')
  const id = url.pathname.split('/').filter(Boolean).pop()
  if (!id || !z.string().uuid().safeParse(id).success) throw new HttpError(400, 'INVALID_ID', 'A valid post id is required')
  return id
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestId = getRequestId(request)
  try {
    const id = postId(request)
    if (request.method === 'GET') {
      const data = await getPublishedPostById(databaseForRequest(), id)
      if (!data) throw new HttpError(404, 'NOT_FOUND', 'Published post not found')
      writeJson(response, 200, { data, error: null, requestId })
      return
    }

    await requireAdminSession(request)
    if (request.method === 'PATCH') {
      const input = updatePostInput.safeParse(await readJson(request))
      if (!input.success) throw new HttpError(400, 'INVALID_INPUT', 'Post update is invalid')
      const data = await updatePost(databaseForRequest(), id, input.data, requestId)
      writeJson(response, 200, { data, error: null, requestId })
      return
    }

    if (request.method === 'DELETE') {
      const input = deletePostInput.safeParse(await readJson(request))
      if (!input.success) throw new HttpError(400, 'INVALID_INPUT', 'Post archive input is invalid')
      const data = await archivePost(databaseForRequest(), id, input.data.expectedUpdatedAt, requestId)
      writeJson(response, 200, { data, error: null, requestId })
      return
    }

    response.setHeader('allow', 'GET, PATCH, DELETE')
    writeJson(response, 405, { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }, requestId })
  } catch (error) {
    writeError(response, requestId, error)
  }
}
