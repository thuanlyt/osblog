# Drizzle migration boundary

`src/server/schema.ts` is the source schema and `0000_durable_content.sql` is the reviewed initial migration shape. The migration has not been executed in this workspace because no authorized Neon or local Postgres target is configured.

Before an authorized migration run:

1. Set `DATABASE_URL_MIGRATIONS` in a protected operator environment.
2. Review the generated/diffed SQL against the schema and take a provider backup or disposable branch.
3. Apply the migration with the selected Drizzle migration runner and record the target, command, and result in the work report.
4. Add an idempotent seed only in the admin-auth work item; a seed must not invent credentials or overwrite edited content.

This guard is intentional: missing provider access must fail closed, never switch to in-memory CRUD or silently claim a successful migration.
