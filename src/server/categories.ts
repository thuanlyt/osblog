import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import type { Database } from './db'
import { category } from './schema'
import { categoryInput } from './content-contract'
import { audit, nextTimestamp } from './content'
import { HttpError } from './http'

export async function saveCategory(db: Database, input: z.infer<typeof categoryInput>, id: string | undefined, expected: string | undefined, requestId: string, actor: string) {
  return db.transaction(async (tx) => {
    const [before] = id ? await tx.select().from(category).where(eq(category.id, id)).for('update') : []
    if (id && !before) throw new HttpError(404, 'NOT_FOUND', 'Category not found')
    if (before && before.updatedAt.toISOString() !== new Date(expected ?? '').toISOString()) throw new HttpError(409, 'CONFLICT', 'This category changed. Reload the latest version before saving.')
    const now = before ? nextTimestamp(before.updatedAt) : new Date()
    const [row] = before ? await tx.update(category).set({ ...input, updatedAt: now }).where(eq(category.id, before.id)).returning()
      : await tx.insert(category).values({ ...input, createdAt: now, updatedAt: now }).returning()
    const brief = (value: typeof category.$inferSelect) => ({ slug: value.slug, isArchived: value.isArchived })
    await audit(tx, before ? 'category.update' : 'category.create', 'category', row.id, requestId, actor, before ? brief(before) : null, brief(row))
    return row
  })
}
