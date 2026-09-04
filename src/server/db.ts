import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { requireDatabaseUrl } from './env'
import { schema } from './schema'

export type Database = NeonHttpDatabase<typeof schema>

export function createDatabase(input: NodeJS.ProcessEnv = process.env): Database {
  const sql = neon(requireDatabaseUrl(input))
  return drizzle(sql, { schema })
}
