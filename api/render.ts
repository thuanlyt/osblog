import type { IncomingMessage, ServerResponse } from 'node:http'
import { render } from '../src/entry-server'

export default function handler(request: IncomingMessage, response: ServerResponse): void {
  if (request.method !== 'GET') {
    response.statusCode = 405
    response.setHeader('allow', 'GET')
    response.end('Method not allowed')
    return
  }
  const url = new URL(request.url ?? '/', 'http://localhost')
  const path = url.searchParams.get('path') ?? url.pathname
  response.statusCode = 200
  response.setHeader('content-type', 'text/html; charset=utf-8')
  response.end(render(path))
}
