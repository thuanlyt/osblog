// Isolated real SQL fixture for browser QA. Never imported by a deployment entry.
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { schema } from '../../src/server/schema'
import type { Database } from '../../src/server/db'
import { migrate, bootstrapAdmin, seedIntroduction } from '../../src/server/provision'
import { createNodeHandler } from '../../src/server/node-adapter'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const origin = 'http://127.0.0.1:5180'
Object.assign(process.env, { NODE_ENV: 'test', SITE_URL: origin, BETTER_AUTH_URL: origin, VERCEL: '', TRUST_PROXY: 'false' })
const env = { NODE_ENV: 'test', SITE_URL: origin, BETTER_AUTH_URL: origin, ADMIN_EMAIL: 'editor@example.test', BETTER_AUTH_SECRET: randomBytes(48).toString('base64url'), COMMENT_EMAIL_ENCRYPTION_KEY: randomBytes(32).toString('base64') }
const engine = new PGlite()
const db = drizzle(engine, { schema }) as unknown as Database
await migrate(db, await Promise.all((await readdir('drizzle')).filter((name) => /^\d+.*\.sql$/.test(name)).map(async (name) => ({ name, source: await readFile(`drizzle/${name}`, 'utf8') }))))
await bootstrapAdmin(db, env, 'Browser-fixture-password-2026!')
await seedIntroduction(db)
const { createApp } = await import(pathToFileURL(resolve('dist/server/index.js')).href)
const nodeHandler = createNodeHandler(createApp({ database: db, env }))
const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', origin).pathname
  if (/^\/assets\/[A-Za-z0-9_.-]+$/.test(path) || path === '/favicon.svg') {
    try {
      const file = await readFile('dist/client' + path)
      const extension = path.split('.').at(-1) ?? ''
      res.setHeader('content-type', ({ css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml', woff2: 'font/woff2', png: 'image/png', webp: 'image/webp' } as Record<string, string>)[extension] ?? 'application/octet-stream')
      res.end(file)
    } catch { res.statusCode = 404; res.end() }
  } else await nodeHandler(req, res)
})
server.listen(5180, '127.0.0.1', () => console.info('Isolated SQL browser fixture ready: ' + origin))
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => { server.close(); void engine.close().finally(() => process.exit(0)) })
