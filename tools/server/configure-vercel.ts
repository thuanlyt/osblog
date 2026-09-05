/** Explicit operator command: prepare a NEW installation on the linked Vercel project.
 * Generated credentials stay in ignored local files, never stdout or command arguments.
 */
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { parseEnv } from 'node:util'
import { createDatabase } from '../../src/server/db'
import { bootstrapAdmin } from '../../src/server/provision'

const site = process.argv.find((arg) => arg.startsWith('--site='))?.slice(7)
const email = process.argv.find((arg) => arg.startsWith('--admin='))?.slice(8)
if (!site || !email || new URL(site).protocol !== 'https:') throw new Error('Usage: configure-vercel.ts --site=https://your-domain --admin=you@example.com')
const existing = parseEnv(await readFile('.env.production.local', 'utf8'))
if (!existing.DATABASE_URL) throw new Error('First link a new Neon database and pull production env to .env.production.local.')
const env: Record<string, string> = {
  ...existing,
  SITE_URL: new URL(site).origin,
  VITE_SITE_URL: new URL(site).origin,
  BETTER_AUTH_URL: new URL(site).origin,
  ADMIN_EMAIL: email,
  DATABASE_URL_MIGRATIONS: existing.DATABASE_URL_MIGRATIONS || existing.DATABASE_URL_UNPOOLED || existing.DATABASE_URL,
  BETTER_AUTH_SECRET: existing.BETTER_AUTH_SECRET || randomBytes(48).toString('base64url'),
  COMMENT_EMAIL_ENCRYPTION_KEY: existing.COMMENT_EMAIL_ENCRYPTION_KEY || randomBytes(32).toString('base64'),
}
const credentialPath = 'draft/admin-access.json'
await mkdir('draft', { recursive: true })
let credentials: { email: string; password: string; site: string }
try { credentials = JSON.parse(await readFile(credentialPath, 'utf8')) }
catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; credentials = { email, password: randomBytes(24).toString('base64url'), site: new URL(site).origin }; await writeFile(credentialPath, JSON.stringify(credentials, null, 2) + '\n', { flag: 'wx', mode: 0o600 }) }
if (credentials.email !== email || credentials.site !== new URL(site).origin) throw new Error('Existing local credentials belong to a different installation. Refusing overwrite.')
// Stable output enables safe retries with the SAME keys; never rotate secrets on a retry.
await writeFile('.env.production.local', Object.entries(env).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n') + '\n', { mode: 0o600 })
const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx'
for (const key of ['SITE_URL', 'VITE_SITE_URL', 'BETTER_AUTH_URL', 'ADMIN_EMAIL', 'BETTER_AUTH_SECRET', 'COMMENT_EMAIL_ENCRYPTION_KEY']) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, ['--yes', 'vercel@latest', 'env', 'add', key, 'production', '--yes', '--force', ...(key.endsWith('SECRET') || key.endsWith('_KEY') ? ['--sensitive'] : [])], { shell: process.platform === 'win32', stdio: ['pipe', 'pipe', 'pipe'] })
    let output = ''
    child.stdout.on('data', (chunk) => { output += String(chunk) }); child.stderr.on('data', (chunk) => { output += String(chunk) })
    child.on('error', reject)
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Vercel env failed for ${key}; exit ${code}; ${output.replaceAll(env[key], '[redacted]')}`)))
    child.stdin.end(env[key])
  })
  console.info(`Configured ${key} (value hidden)`)
}
const db = createDatabase({ ...env, NODE_ENV: 'production' })
try {
  const result = await bootstrapAdmin(db, env, credentials.password)
  console.info(result.created ? 'Admin bootstrapped. Access details: draft/admin-access.json (ignored).' : 'Admin already exists; no password reset performed.')
} finally { await db.$client.end() }
