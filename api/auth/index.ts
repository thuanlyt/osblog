import { toNodeHandler } from 'better-auth/node'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createAuth } from '../../src/server/auth'
import { ServerConfigError } from '../../src/server/env'

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    await toNodeHandler(createAuth())(request, response)
  } catch (error) {
    if (!(error instanceof ServerConfigError)) throw error
    response.statusCode = 503
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ error: 'Authentication is not configured' }))
  }
}
