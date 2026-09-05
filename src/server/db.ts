import { Pool } from 'pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { requireDatabaseUrl } from './env'
import { schema } from './schema'

export type Database = NodePgDatabase<typeof schema>
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export type Store = Database | Transaction

export function createDatabase(input: NodeJS.ProcessEnv = process.env): Database {
  const pool = new Pool({ connectionString: requireDatabaseUrl(input), max: 4, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 })
  // Neon and ordinary remote Postgres both support this transactional Node driver.
  return drizzle(pool, { schema })
}
