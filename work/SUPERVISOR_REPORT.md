# UseAgent supervisor report

## Current checkpoint — post-deploy evidence boundary (2026-09-05)

OSBlog is a bilingual, open-source Vite + React + TypeScript Markdown blog with Neon Postgres persistence, Better Auth admin access, category/post CRUD, a Markdown editor with preview, bilingual content, custom slug/cover/SEO fields, moderated email-only comments, SSR SEO, co-located docs, Cap media, and Vercel/Netlify/Node adapters.

The current release candidate is live on Vercel. Published-slug history and one-hop redirect handling are deployed after migration `0004_post_slug_history.sql`; RSS 2.0 and Atom 1.0 feeds are also live with published-only filtering, bilingual selection, XML escaping, ETag/HEAD/304 behavior, caching, and SSR discovery links.

## Production evidence

- Latest deployment: `dpl_7u4LuF7JfhkUNkYwn4Vi2eRfv8Xe`, `READY`, aliases `osblog.thuanlyt.id.vn` and `osblog.vercel.app`.
- Both aliases passed health/database, public posts API, current EN/VI article, docs, RSS, Atom, sitemap, robots, and unknown HTML/API safety smoke.
- Production schema is at migrations `0000`–`0004`; the idempotent migration rerun returned no pending migrations. Slug-history preflight is clean.
- Live `/docs/architecture?lang=en` exposes `0004_post_slug_history.sql`, the five-migration production state, and the historical-alias evidence boundary.
- A disposable Neon branch restore rehearsal passed; the pre-migration branch state and preserved migrated snapshot were both verified without mutating production.
- Local gates remain green: 18 Vitest files / 93 tests, 2 compiled-browser E2E tests, typecheck, lint, production build, `npm audit --audit-level=high` with 0 vulnerabilities, UseAgent validation `VALID`, conformance replay `REPLAY_PASS`, and diff/secret-path checks.

## Control-plane status

- `done`: 56
- `cancelled`: 23
- `blocked`: 3
- active/review tasks: none

UA-0082 closed the post-deploy documentation and route-smoke evidence gate. The full lifecycle ledger remains in `work/registry.json`; the most recent report is `work/reports/inbox/UA-0082-20260905T151736Z-56651c.md`.

## Remaining gaps and explicit boundaries

- No positive live historical `308` claim is made because production has no historical-alias fixture. Run that smoke only after an intentional published-post rename; do not create a content fixture solely for testing.
- Turnstile is accepted in configuration but is not wired into comment verification.
- Netlify and VPS adapters are implemented but have not been exercised on their live platforms.
- Native `pg_dump`/`pg_restore`, migration-lock contention testing, and explicit recovery time/data-loss objectives remain open. The provider-native disposable Neon branch mechanism is the current recovery evidence.
- The primary Brave window is not exposed to this desktop CUA session; deployment evidence used the authenticated Vercel CLI/GitHub integration and live HTTP checks. DNS and the Neon integration were manually completed by the operator.

## Evidence anchors

- [README.md](../README.md), [README.vi.md](../README.vi.md)
- [docs/architecture.md](../docs/architecture.md), [docs/vi/architecture.md](../docs/vi/architecture.md)
- [docs/feeds.md](../docs/feeds.md), [docs/vi/feeds.md](../docs/vi/feeds.md)
- [post-deploy evidence](evidence/slug-history-rollout.md)
- [feed live smoke](evidence/feed-live-smoke.md)
- [slug-history takeover review](evidence/UA-0077-review.md)
- [Neon/Vercel recovery evidence](evidence/ops-recovery-drill.md)
- [UA-0082 report](reports/inbox/UA-0082-20260905T151736Z-56651c.md)

## Next action

Keep the production release candidate under bounded monitoring. Only open a new work item for the positive historical-alias smoke when an intentional published-post rename is approved; otherwise prioritize the remaining explicit operations/security gaps without mutating public content.
