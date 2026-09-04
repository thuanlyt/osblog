import type { IncomingMessage, ServerResponse } from 'node:http'
import { adminCommentRequest, commentsDatabase, listModerationComments } from '../../../src/server/comments'
import { getRequestId, writeError, writeJson } from '../../../src/server/http'

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestId = getRequestId(request)
  try {
    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET')
      writeJson(response, 405, { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }, requestId })
      return
    }
    await adminCommentRequest(request)
    const data = await listModerationComments(commentsDatabase())
    writeJson(response, 200, { data, error: null, requestId })
  } catch (error) {
    writeError(response, requestId, error)
  }
}
