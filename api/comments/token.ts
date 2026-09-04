import type { IncomingMessage, ServerResponse } from 'node:http'
import { commentSecrets, issueCommentFormToken } from '../../src/server/comment-policy'
import { getRequestId, writeError, writeJson } from '../../src/server/http'

export default function handler(request: IncomingMessage, response: ServerResponse): void {
  const requestId = getRequestId(request)
  try {
    if (request.method !== 'GET') {
      response.setHeader('allow', 'GET')
      writeJson(response, 405, { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }, requestId })
      return
    }
    const { authSecret } = commentSecrets()
    writeJson(response, 200, { data: { token: issueCommentFormToken(authSecret) }, error: null, requestId })
  } catch (error) {
    writeError(response, requestId, error)
  }
}
