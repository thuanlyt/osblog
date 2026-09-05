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

## Deployment and live smoke

Commit `183d785` was pushed to GitHub `main`. Vercel deployment `dpl_Atf66pXC8tDUC2NrT9czpYuzJ4nU` reached `READY` and was assigned both `osblog.thuanlyt.id.vn` and `osblog.vercel.app`.

On both aliases, live smoke returned: health `200` with `database=connected`; public post API `200`; a current article `200` in EN and VI; current JSON API `200`; docs, sitemap, robots and RSS `200`; sitemap contains the current slug; SSR contains RSS/Atom discovery. Unknown HTML and API slug paths returned `404` with no `Location` header. The deployed code is therefore running against the migrated production schema.

## Gate boundary

Database rollout and deployment PASS. A positive live historical-308 assertion was not fabricated: production currently has three `post_slug_history` rows and all three equal current slugs, so there is no existing historical alias. Local SQL/browser verification covers the full `a -> b -> c` one-hop behavior, and the live unknown/hidden safety path is verified. Creating a temporary production post or renaming a real post solely to create an alias would mutate public content and make the old slug permanently unavailable for reuse; that requires a separately explicit content-fixture decision. No such mutation was made.

## Required follow-up

When a real published post is intentionally renamed, rerun live smoke for its old HTML/API URLs and record the 308 `Location` plus final canonical/sitemap output. Until then, the production deployment is schema-safe and current-route verified, but the positive historical-alias live fixture remains an evidence boundary rather than an unverified claim.
