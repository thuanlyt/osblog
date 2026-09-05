# UA-0080 — Published-slug production rollout gate

Date: 2026-09-05 (Asia/Bangkok)

## Target state

The reviewed implementation is local at commit `68034d9` (`feat: preserve published slug history`). It has not been pushed to `main` or deployed, because the runtime must not call the new history table before migration 0004 is safely applied.

Production aliases remain the existing READY Vercel release:

- `https://osblog.thuanlyt.id.vn`
- `https://osblog.vercel.app`

## Read-only production checks

The protected production database connection was used only for read-only checks. No credential, URL, slug value or private row was recorded.

| Check | Result |
| --- | --- |
| `npx --yes neon@latest profile list -o json` | BLOCKED: local `DEFAULT` profile reports `account: "-"`, `auth: "-"`, and missing credentials file. |
| `preflightSlugHistory(db)` | PASS: `malformed=0`, `missing=0`, `multiOwner=0`, `currentOwnerConflicts=0`. |
| `select name from osblog_migration order by name` | Production has `0000_durable_content.sql` through `0003_auth_issuer.sql`. |
| `to_regclass('post_slug_history')` | `null`; migration 0004 is not applied. |

## Backup and restore evidence

Neon OAuth completed and the CLI profile is now authenticated. A disposable branch `br-rough-rain-azcd2dou` (`useagent-slug-rollout-20260905`) was created from production `main`, with expiry `2026-09-06T00:00:00Z`. The migration was applied and replayed there (`firstApplied=[0004_post_slug_history.sql]`, `secondApplied=[]`). Neon then preserved the migrated snapshot as `br-jolly-scene-azeag8yn` (`useagent-slug-migrated-20260905`) and restored the disposable branch to `^parent`.

Read-only verification after restore found the restored branch at migrations `0000`–`0003` with no `post_slug_history` table, while the preserved migrated snapshot contained migrations `0000`–`0004` and `post_slug_history`. This proves the disposable branch restore boundary without mutating production.

## Production migration evidence

After the backup/restore checkpoint and clean preflight, `npm run db:migrate -- --mode=production` applied `[0004_post_slug_history.sql]`. A second identical run returned `[]`. Post-migration read-only verification reported migrations `0000`–`0004`, table `post_slug_history`, `registeredSlugs=3`, and `malformed=0`, `missing=0`, `multiOwner=0`, `currentOwnerConflicts=0`.

## Gate decision

PASS for the database rollout gate. No connection string or private row was recorded. The reviewed code commit `68034d9` is now safe to push and deploy because the production schema is ahead of the redirect-aware code; the remaining gate is deployment plus live historical HTML/API, hidden-target, SEO/sitemap and rollback smoke on both aliases.
