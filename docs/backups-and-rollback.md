# Backups and rollback

*Tiếng Việt: [docs/vi/backups-and-rollback.md](vi/backups-and-rollback.md)*

**Current status (2026-09-05):** a real Neon Postgres database (`osblog-db`, Singapore region) is provisioned and linked to the live Vercel production deployment. Migrations `0000` through `0004` have run against it, and replaying the production migration runner is idempotent. Live route smoke, a disposable Neon branch restore rehearsal, and a reversible Vercel alias rollback rehearsal have passed. Native dump/restore tooling and a positive live historical-alias fixture remain open.

## Database migrations

The schema source of truth is [`src/server/schema.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/schema.ts). Five reviewed migration files exist under [`drizzle/`](https://github.com/thuanlyt/osblog/blob/main/drizzle/); all five have been applied to production after the UA-0080 backup/preflight gate:

| Migration | Covers |
|---|---|
| `0000_durable_content.sql` | Initial `category`, `post`, `comment`, `rate_limit_bucket`, `audit_event` tables. |
| `0001_auth_tables.sql` | Better Auth's `user`, `session`, `account`, and verification tables. |
| `0002_precision_and_constraints.sql` | Additional precision and constraint fixes on the content schema. |
| `0003_auth_issuer.sql` | Fixes the auth account `issuer` field used to distinguish credential-based accounts. |
| `0004_post_slug_history.sql` | Additive registry, deterministic backfill, and database ownership trigger for permanent published slugs; applied after disposable-branch restore rehearsal and zero-conflict preflight. |

`npm run db:migrate` (see [`src/server/provision.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/provision.ts)) applies every migration file inside a single transaction, guarded by a Postgres advisory lock (so concurrent runs don't race) and an `osblog_migration` tracking table keyed by name and a SHA-256 checksum of the file contents. Re-running it after all available migrations are applied is a no-op; running it against a file whose already-applied contents changed throws instead of silently reapplying. The runner was applied to the disposable branch and production, then replayed on both with no additional migrations.

Before running a migration against a real target:

1. Set `DATABASE_URL_MIGRATIONS` (or rely on the `DATABASE_URL` fallback) in a protected operator environment — never in client code or a committed file.
2. Take a Neon backup or open a disposable branch first — see below.
3. Run `npm run db:migrate` (or `--mode=production` against `.env.production.local`) and record the exact target, command, and result in the work report.
4. Run `npm run db:seed` only if you want the optional bilingual introduction content; it is idempotent and never overwrites edited content (`onConflictDoNothing`).

## Backup expectations

Neon Postgres provides point-in-time restore and branching on the free tier used by this project.

- Confirm the project's retention window and branch-restore procedure directly in the Neon console before relying on it for an incident.
- Take a provider backup or disposable branch immediately before running any migration against the production database.
- Record the backup/branch identifier alongside the migration evidence in the work report, not just in a chat message.

UA-0080 exercised Neon branching end to end without changing production data: `useagent-slug-rollout-20260905` was created from `main`, migrated and replayed, preserved as `useagent-slug-migrated-20260905`, and the disposable branch was restored to `^parent`. The restored branch returned to `0000`–`0003` with no history table while the preserved snapshot retained `0004`. Branch identifiers and expiry are recorded in the work evidence; native `pg_dump`/`pg_restore` remain unavailable on the host.

## Code rollback

Rollback is two-dimensional:

1. **Code-only failure:** point the deployment target's alias/domain back to the last known-good build, then run smoke checks (at minimum, `GET /api/healthz` and a real article page) against the restored deployment before considering the incident closed.
2. **Schema change involved:** roll back code only while the database remains backward-compatible with the previous version (expand/contract migrations, not destructive in-place changes). Never run an unreviewed destructive "down" migration during an incident. If content must be restored, use Neon's tested backup/point-in-time mechanism under explicit incident approval, then reconcile `audit_event` rows and invalidate any cached HTML.

The "point the alias back" step was rehearsed on 2026-09-05. The primary alias `osblog.thuanlyt.id.vn` was temporarily assigned to the previous READY deployment `osblog-q0r15ysiu-thuanlyts-projects.vercel.app`; `/api/healthz`, `/`, `/docs`, `/sitemap.xml`, and `/robots.txt` all returned the expected successful response. The alias was then restored to the current READY deployment `osblog-4p4nm76sx-thuanlyts-projects.vercel.app`, the temporary alias was removed, and both production aliases were smoke-tested again. Full evidence is in [`work/evidence/ops-recovery-drill.md`](https://github.com/thuanlyt/osblog/blob/main/work/evidence/ops-recovery-drill.md).

## Content-level recovery

Because posts and categories use soft deletion (`archived` status, not a hard delete) and every mutation writes an `audit_event` row, most accidental content changes can be recovered by re-publishing the archived record rather than restoring the whole database. **Comment deletion is a real, permanent delete** (see [Admin and comments](admin-and-comments.md)) — recovering a deleted comment requires a full database restore, and there is no soft-delete path for it.

## What is still unverified

- Neon disposable-branch backup/restore has been exercised and verified; native dump/restore and provider lock-contention load testing remain open.
- Deployment-alias rollback has been rehearsed safely against the live primary alias and restored successfully.
- Migration locking behavior under concurrent operator runs is guarded by an advisory lock but has not been load-tested.
- Recovery time and acceptable data-loss objectives have not been defined by the project owner.

Back to [Documentation index](index.md).
