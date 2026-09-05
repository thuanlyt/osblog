# UA-0066 operations recovery drill

Date: 2026-09-05
Owner: `supervisor`
Scope: disposable Neon recovery discovery and reversible Vercel alias rollback.

## Result

The Vercel alias rollback rehearsal passed and production aliases were restored to the current READY deployment. Neon backup/branch restore was not executed because the local Neon CLI is not authenticated and native Postgres dump tools are unavailable. No production database mutation, restore, deletion, or secret exposure occurred.

## Neon evidence

Commands:

```text
npx neon@latest profile list -o json
npx neon@latest status --output json
Get-Command pg_dump, pg_restore, psql, createdb, dropdb
```

Observed:

- The CLI reported only the `DEFAULT` profile with `account: "-"`, `file: "missing"`.
- `neon status` stopped at the official browser OAuth flow; no project or branch context was available.
- `pg_dump`, `pg_restore`, `psql`, `createdb`, and `dropdb` are not installed in the worker environment.
- Because a disposable branch could not be created safely, no backup/restore claim is made. The exact unblocker is to authenticate Neon CLI (or provide an approved operator environment with the direct connection and restore tooling), then create a short-lived branch and record its identifier before the next schema migration.

## Vercel rollback evidence

Known deployments discovered with `npx vercel list osblog --format=json --limit=10`:

| Role | Deployment URL | Source | State |
|---|---|---|---|
| Current | `osblog-4p4nm76sx-thuanlyts-projects.vercel.app` | commit `649304e` | READY |
| Previous known-good | `osblog-q0r15ysiu-thuanlyts-projects.vercel.app` | commit `b85de88` | READY |

Rehearsal commands:

```text
npx vercel alias set osblog-q0r15ysiu-thuanlyts-projects.vercel.app osblog.thuanlyt.id.vn
<smoke the primary alias>
npx vercel alias set osblog-4p4nm76sx-thuanlyts-projects.vercel.app osblog.thuanlyt.id.vn
npx vercel alias remove osblog-rollback-20260905.vercel.app --yes
```

During the rollback window, the live primary alias returned `200` with expected markers for `/api/healthz`, `/`, `/docs`, `/sitemap.xml`, and `/robots.txt`. Health reported `database=connected`. The primary alias was then restored to the current deployment.

A temporary alias was created only to exercise the previous deployment and was removed after the rehearsal. It is absent from the final alias list. Final Vercel inspection shows these OSBlog aliases all point to `osblog-4p4nm76sx-thuanlyts-projects.vercel.app` / deployment `dpl_3rEAXterTCQcvRS5CFTKHPUrxF58`:

- `osblog.thuanlyt.id.vn`
- `osblog.vercel.app`
- `osblog-git-main-thuanlyts-projects.vercel.app`
- `osblog-thuanlyts-projects.vercel.app`

## Final live smoke

Both `https://osblog.thuanlyt.id.vn` and `https://osblog.vercel.app` returned `200` with the expected content markers for `/api/healthz`, `/`, `/docs`, `/sitemap.xml`, `/robots.txt`, `/media/osblog-cap-demo.gif`, and `/media/osblog-cap-demo.mp4`. The media responses reported `image/gif` and `video/mp4` content types respectively.

## Remaining action

Authenticate Neon CLI, create a disposable branch with a short TTL, and perform a non-production backup/restore rehearsal. Do not run a destructive restore against the production branch as part of that first exercise.
