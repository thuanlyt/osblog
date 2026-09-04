import type { IncomingMessage, ServerResponse } from 'node:http'
import { commentSubmissionInput } from '../../src/server/comment-contract'
import { clientContext, commentsDatabase, submitComment } from '../../src/server/comments'
import { getRequestId, readJson, writeError, writeJson } from '../../src/server/http'

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestId = getRequestId(request)
  try {
    if (request.method !== 'POST') {
      response.setHeader('allow', 'POST')
      writeJson(response, 405, { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }, requestId })
      return
    }
    const parsed = commentSubmissionInput.safeParse(await readJson(request))
    if (!parsed.success) {
      writeJson(response, 400, { data: null, error: { code: 'INVALID_INPUT', message: 'Comment input is invalid' }, requestId })
      return
    }
    const data = await submitComment(commentsDatabase(), parsed.data, clientContext(request), requestId)
    writeJson(response, 202, { data, error: null, requestId })
  } catch (error) {
    writeError(response, requestId, error)
  }
}
