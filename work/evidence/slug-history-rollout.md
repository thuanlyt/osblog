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

## Gate decision

STOP / BLOCKED. The ownership preflight is clean, but a verified Neon backup or disposable restore checkpoint cannot be produced while the Neon CLI is unauthenticated and no native `pg_dump`/`pg_restore` tools are available on this host. Therefore UA-0080 did not run `npm run db:migrate`, did not push commit `68034d9`, did not deploy to Vercel, and did not mutate production data.

## Required next action

Authenticate the Neon CLI in an operator-controlled browser/session, create and record a disposable backup/restore checkpoint, then rerun this gate. Only after that checkpoint is independently verified should the supervisor apply 0004, verify migration idempotence, push the reviewed commit, deploy, and smoke-test current/historical HTML/API URLs on both aliases.
