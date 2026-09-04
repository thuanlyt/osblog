import type { IncomingMessage, ServerResponse } from 'node:http'
import { z } from 'zod'
import { adminCommentRequest, commentsDatabase, moderateComment } from '../../../src/server/comments'
import { moderationInput } from '../../../src/server/comment-contract'
import { getRequestId, readJson, writeError, writeJson, HttpError } from '../../../src/server/http'

function commentId(request: IncomingMessage): string {
  const id = new URL(request.url ?? '/', 'http://localhost').pathname.split('/').filter(Boolean).pop()
  if (!id || !z.string().uuid().safeParse(id).success) throw new HttpError(400, 'INVALID_ID', 'A valid comment id is required')
  return id
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestId = getRequestId(request)
  try {
    if (request.method !== 'PATCH') {
      response.setHeader('allow', 'PATCH')
      writeJson(response, 405, { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }, requestId })
      return
    }
    const actor = await adminCommentRequest(request)
    const input = moderationInput.safeParse(await readJson(request))
    if (!input.success) throw new HttpError(400, 'INVALID_INPUT', 'Moderation input is invalid')
    const data = await moderateComment(commentsDatabase(), commentId(request), input.data, requestId, actor.id)
    writeJson(response, 200, { data, error: null, requestId })
  } catch (error) {
    writeError(response, requestId, error)
  }
}
