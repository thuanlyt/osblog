import type { IncomingMessage, ServerResponse } from 'node:http'
import { createPost, databaseForRequest, listPublishedPosts, requireAdminSession } from '../../src/server/content'
import { createPostInput, listPostsQuery } from '../../src/server/content-contract'
import { getRequestId, readJson, writeError, writeJson, HttpError } from '../../src/server/http'

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const requestId = getRequestId(request)
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url ?? '/api/posts', 'http://localhost')
      const query = listPostsQuery.safeParse({ limit: url.searchParams.get('limit') ?? undefined })
      if (!query.success) throw new HttpError(400, 'INVALID_QUERY', 'Query parameters are invalid')
      const data = await listPublishedPosts(databaseForRequest(), query.data.limit)
      writeJson(response, 200, { data, error: null, requestId })
      return
    }

    if (request.method === 'POST') {
      await requireAdminSession(request)
      const input = createPostInput.safeParse(await readJson(request))
      if (!input.success) throw new HttpError(400, 'INVALID_INPUT', 'Post input is invalid')
      const data = await createPost(databaseForRequest(), input.data, requestId)
      writeJson(response, 201, { data, error: null, requestId })
      return
    }

    response.setHeader('allow', 'GET, POST')
    writeJson(response, 405, { data: null, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }, requestId })
  } catch (error) {
    writeError(response, requestId, error)
  }
}
