import { randomUUID } from 'node:crypto'
import { readServerEnv, ServerConfigError } from '../src/server/env'

interface HealthRequest {
  method?: string
}

interface HealthResponse {
  status(code: number): HealthResponse
  json(body: unknown): void
}

export function healthSnapshot(input: NodeJS.ProcessEnv = process.env) {
  try {
    const env = readServerEnv(input)
    return {
      status: 'ok' as const,
      checks: {
        configuration: 'ok' as const,
        database: env.DATABASE_URL ? 'configured' as const : 'not_configured' as const,
      },
    }
  } catch (error) {
    if (!(error instanceof ServerConfigError)) throw error
    return {
      status: 'misconfigured' as const,
      checks: { configuration: 'error' as const },
    }
  }
}

export default function handler(request: HealthRequest, response: HealthResponse): void {
  const requestId = randomUUID()
  if (request.method !== 'GET') {
    response.status(405).json({ data: null, error: { code: 'METHOD_NOT_ALLOWED' }, requestId })
    return
  }

  const snapshot = healthSnapshot()
  response.status(snapshot.status === 'ok' ? 200 : 503).json({ data: snapshot, error: null, requestId })
}
