import { createServer } from 'node:http'
import { stat, readFile } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createServer as createViteServer, loadEnv } from 'vite'
import { createNodeHandler } from '../../src/server/node-adapter'

const production = process.argv.includes('--production')
const fileEnv = loadEnv(production ? 'production' : 'development', process.cwd(), '')
for (const [key, value] of Object.entries(fileEnv)) if (process.env[key] === undefined) process.env[key] = value
process.env.NODE_ENV ??= production ? 'production' : 'development'
const port = Number(process.env.PORT ?? 5173)
if (!production) { process.env.SITE_URL ??= `http://localhost:${port}`; process.env.BETTER_AUTH_URL ??= process.env.SITE_URL }
const vite = production ? null : await createViteServer({ server: { middlewareMode: true }, appType: 'custom' })
const app = production ? await import(pathToFileURL(resolve('dist/server/index.js')).href) : null
const root = resolve('dist/client')
const contentTypes: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => {
  const application = async () => {
    try {
      if (production) {
        const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://local').pathname)
        const target = resolve(root, '.' + pathname)
        if (target.startsWith(root + sep) && !pathname.split('/').some((part) => part.startsWith('.'))) {
          const info = await stat(target).catch(() => null)
          if (info?.isFile() && ['GET', 'HEAD'].includes(req.method ?? 'GET')) {
            res.setHeader('content-type', contentTypes[extname(target)] ?? 'application/octet-stream')
            res.setHeader('x-content-type-options', 'nosniff')
            res.setHeader('cache-control', /-[A-Za-z0-9_-]{8,}\./.test(target) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600')
            res.end(req.method === 'HEAD' ? undefined : await readFile(target)); return
          }
        }
        await app.nodeHandler(req, res)
      } else {
        const module = await vite!.ssrLoadModule('/src/entry-server.tsx')
        await createNodeHandler(async (request, context) => {
          const response = await module.handle(request, context) as Response
          if (!response.headers.get('content-type')?.includes('text/html')) return response
          const html = await vite!.transformIndexHtml(req.url ?? '/', await response.text())
          const headers = new Headers(response.headers); headers.delete('content-security-policy')
          return new Response(html, { status: response.status, headers })
        })(req, res)
      }
    } catch (error) { vite?.ssrFixStacktrace(error as Error); res.statusCode = 500; res.end('Unable to serve this request. Check local configuration.') }
  }
  if (vite) vite.middlewares(req, res, () => { void application() })
  else await application()
})
server.listen(port, '127.0.0.1', () => console.info(`OSBlog ${production ? 'production' : 'development'} server: http://localhost:${port}`))
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => { server.close(); void vite?.close(); process.exit(0) })
