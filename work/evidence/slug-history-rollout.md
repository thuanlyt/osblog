# UA-0082 — Post-deploy documentation and route smoke

Date: 2026-09-05 (Asia/Bangkok)

## Scope

This evidence records the production state after the bilingual README/docs synchronization in commit `1fba90a` and the published-slug implementation in commit `183d785`. It refreshes the deployment and route evidence without mutating production content.

## Deployment

Vercel deployment `dpl_7u4LuF7JfhkUNkYwn4Vi2eRfv8Xe` is `READY`, targets `production`, and is assigned to both public aliases:

- `https://osblog.thuanlyt.id.vn` (primary)
- `https://osblog.vercel.app` (secondary)

The deployment uses `npm run build`, `dist/client`, the SSR/API function at `api/index`, Node.js 24.x, and region `sin1`. The Vercel inspect response was checked without recording credentials or environment values.

## Production schema

The authenticated Neon rollout applied `0004_post_slug_history.sql` after the disposable backup/restore checkpoint. A second identical migration run returned an empty applied list. Read-only post-migration verification reported migrations `0000`–`0004`, the `post_slug_history` table, `registeredSlugs=3`, and `malformed=0`, `missing=0`, `multiOwner=0`, `currentOwnerConflicts=0`.

The disposable recovery rehearsal used branch `br-rough-rain-azcd2dou` (`useagent-slug-rollout-20260905`) and preserved migrated snapshot `br-jolly-scene-azeag8yn` (`useagent-slug-migrated-20260905`). The restored disposable branch returned to migrations `0000`–`0003` with no history table; the preserved snapshot retained `0000`–`0004` and `post_slug_history`. No production data was changed by this rehearsal.

## Live route smoke

The same bounded `Invoke-WebRequest` matrix was run against both aliases:

| Route class | Result on both aliases |
| --- | --- |
| `/api/healthz` | `200`; body reports `database=connected` |
| `/api/posts?limit=3` | `200` |
| Current article EN and VI | `200` |
| `/docs/architecture?lang=en` | `200` |
| `/feed.xml`, `/feed.atom` | `200` |
| `/sitemap.xml`, `/robots.txt` | `200` |
| Unknown HTML and API slug | `404`; no `Location` header |

Additional content assertions passed on the primary alias: the architecture docs contain `0004_post_slug_history.sql`, `historical-alias`, and `five SQL migrations`; the article SSR contains RSS/Atom discovery links; the sitemap contains the current article slug.

## Evidence boundary

The positive historical `308` assertion is intentionally not claimed. Production currently has three slug-history rows and all three equal current slugs, so no historical alias exists to request. Local SQL/browser tests cover the one-hop `a -> b -> c` behavior, and the live unknown/hidden safety paths pass. Creating or renaming a production post solely to create a fixture would permanently reserve the old slug and mutate public content; that requires a separate intentional content decision.

## Gate result

PASS for the post-deploy docs and route-smoke acceptance criteria. Remaining product/operations gaps are recorded in `work/SUPERVISOR_REPORT.md`: live positive historical-alias fixture, Turnstile wiring, non-Vercel live adapter exercises, native dump/restore tooling, provider contention/load testing, and explicit recovery objectives.
