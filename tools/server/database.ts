import { loadEnv } from 'vite'
import { readFile, readdir } from 'node:fs/promises'
import { createDatabase } from '../../src/server/db'
import { bootstrapAdmin, migrate, seedIntroduction } from '../../src/server/provision'

const modeName = process.argv.find((arg) => arg.startsWith('--mode='))?.slice(7) ?? process.env.NODE_ENV ?? 'development'
const env = { ...loadEnv(modeName, process.cwd(), ''), ...process.env }
const mode = process.argv[2]
if (!['migrate', 'bootstrap', 'seed'].includes(mode)) throw new Error('Usage: database.ts migrate|bootstrap|seed')
// Use a direct (not transaction-pooled) connection for migrations when one is configured.
const db = createDatabase({ ...env, DATABASE_URL: mode === 'migrate' ? env.DATABASE_URL_MIGRATIONS || env.DATABASE_URL_UNPOOLED || env.DATABASE_URL : env.DATABASE_URL })
try {
  if (mode === 'migrate') {
    const names = (await readdir('drizzle')).filter((name) => /^\d+.*\.sql$/.test(name))
    const sources = await Promise.all(names.map(async (name) => ({ name, source: await readFile(`drizzle/${name}`, 'utf8') })))
    console.info('Applied migrations:', await migrate(db, sources))
  } else if (mode === 'bootstrap') {
    if (!env.OSBLOG_ADMIN_PASSWORD) throw new Error('Set OSBLOG_ADMIN_PASSWORD in the process environment for this operator-only command.')
    const result = await bootstrapAdmin(db, env, env.OSBLOG_ADMIN_PASSWORD)
    console.info(result.created ? 'Admin created. Remove OSBLOG_ADMIN_PASSWORD from the environment.' : 'Admin already exists; password was not changed.')
  } else console.info('Added introduction posts:', await seedIntroduction(db))
} finally { await db.$client.end() }
