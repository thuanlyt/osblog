# Architecture module card

freshness: verified
verified_on: 2026-09-05
owner: supervisor

## Current runtime contract — supersedes archived scaffold details below

- `src/entry-server.tsx:createApp` combines real React SSR with `src/server/router.ts:createRouter`. Production uses Postgres; tests inject isolated PGlite, not an in-memory production fallback.
- `src/server/pages.ts:loadPage` loads route data; `src/server/seo.ts:renderDocument` emits canonical/hreflang, JSON-LD and safe hydration data. `src/server/docs.ts` embeds EN/VI Markdown at build time.
- `tools/build/build.ts` produces hashed assets and the SSR module, removing client index.html so filesystem routing cannot bypass SSR. `api/index.ts` is the Vercel entry; `netlify/functions/osblog.mts` and `tools/server/start.ts` share the runtime for Netlify/Node.
- `src/server/auth.ts:createAuth` provides operator-only admin sessions, no public signup. The router calls Better Auth's native get-session handler for admin checks so renewal and failure cookie headers remain available on the shared response; API/SSR verify configured email and role. Mutations require exact Origin; login has durable rate limits.
- `content.ts:visiblePost` limits public output to due published posts in active categories. Content/category/moderation mutations use optimistic timestamps and transactional audit records.
- UA-0073 adds locally verified `drizzle/0004_post_slug_history.sql` / `schema.ts:postSlugHistory`: an ever-published slug registry keyed by slug and mapped to immutable post IDs, including scheduled publication. The AFTER post trigger serializes ownership checks with transaction advisory lock 62874110; current and historical published names cannot be reused, including by the same post. Draft-only names remain reusable; archive/unpublish retains history.
- `content.ts:resolvePublishedSlug` joins history directly to the current visible post. `router.ts` returns one-hop 308 HTML-to-HTML and API-to-API redirects (GET/HEAD), with absolute SSR-origin destinations, normalized HTML language and no-store; hidden targets return 404 without Location. Current-only SSR and sitemap output remains intact. `AdminPostEditorPage.tsx` warns from the saved slug baseline and preserves unsaved fields on 409; `provision.ts:seedIntroduction` skips reserved seed names.
- `comments.ts` and `comment-policy.ts` enforce pending moderation, signed tokens, honeypot and rate limits. Email is encrypted and never public. Turnstile is not wired.
- `feed.ts:feedResponse` owns bounded RSS 2.0 and Atom 1.0 delivery at `/feed.xml` and `/feed.atom`; it selects only `lang=en|vi`, uses the published-content query, escapes plain text once at the XML boundary, and emits ETag/HEAD/304 plus five-minute public caching. `seo.ts:renderDocument` advertises both language-aware feeds only from successful public SSR pages.
- `provision.ts` provides checksum-verified locked migrations, idempotent operator bootstrap and optional seed. Five migrations (`0000`–`0004`) now run on authorized Neon; UA-0080 verified a disposable branch restore, production migration/replay, the GitHub-linked Vercel deployment on `main`, and both requested hostname smoke checks. Netlify deployment is not verified.
- Current responses use no-store. Sitemap SQL reads are paged with an explicit capacity guard requiring index partitioning at large scale.

### Current gate and known findings

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`, UseAgent validation and conformance replay are the relevant commands. The current local gate is 93 unit/component/SQL integration tests plus 2 compiled-browser tests. Compiled-browser publishing tests use real isolated SQL and record genuine interactions; Cap footage is separate product media, not test evidence.

UA-0048 independently reproduced partial PATCH unpublishing (P1), malformed cover URL SSR failure, dropped renewed cookies and stalled chunked overflow (P2). UA-0052 fixed the original findings; UA-0053 found a residual auth failure path and insufficient socket-reuse coverage; UA-0056 fixed both and UA-0058 found no new application P0/P1/P2 finding. The Vercel/Neon production path is live and smoke-verified; remaining gates are explicit operational follow-up (Turnstile, non-Vercel execution, native dump/restore, provider lock contention and a positive live historical-alias fixture), not an unverified deployment claim.

## Archived scaffold responsibility (historical only)

`docs/architecture.md` and decision 0003 define the Vite + React + TypeScript application boundary: a route-aware SSR entry, Vercel Node.js Functions under `api/`, Neon Postgres via Drizzle, Better Auth for admin-only sessions, and server-side SEO/abuse controls. UA-0020 verified the client route shell, token-based responsive styles, test/build scripts, and an SSR boundary entry in `src/`; these are scaffold-level interfaces and placeholders, not provider-backed product behavior. The architecture cards do not claim working credentials, provider accounts, migrations, or deployment.

## Entry points and interfaces

- `src/main.tsx` — browser entry and route-aware client hydration.
- `src/app/App.tsx` — real public/admin route rendering and semantic layout.
- `src/entry-server.tsx` — SSR boundary using the shared route loader and router; Vercel wiring is provided by `api/index.ts`.
- `src/server/content.ts` — Drizzle published reads, admin session guard, post mutations, optimistic concurrency, and audit writes.
- `src/server/content-contract.ts` — bounded post create/update/archive and list-query validation.
- `src/server/router.ts` — shared API, SSR, auth, security-header and crawl-route dispatcher used by every runtime adapter.
- `src/server/feed.ts:feedResponse` — published-only RSS/Atom renderer with XML scalar filtering, language selection and cache validators.
- `src/server/seo.ts:renderDocument` — public head generation, including feed discovery links.
- `docs/architecture.md:Routes` — public, admin, API, health, sitemap, and robots paths.
- `docs/architecture.md:Entities and invariants` — category, post, comment, auth, rate-limit, and audit boundaries.
- `docs/architecture.md:Auth and CRUD flow` — server-side role, validation, concurrency, audit, and archive rules.
- `docs/architecture.md:Anonymous comments, moderation, and anti-spam` — email-only pending flow, honeypot/token/rate-limit/Turnstile controls.
- `docs/architecture.md:SEO and crawl output` — SSR metadata, alternates, JSON-LD, sitemap, robots, and noindex rules.
- `docs/architecture.md:Environment variables` and `Migration, seed, and rollback` — operational contracts and the remaining provider/rollback boundaries.

## Invariants

Only published content is public; admin mutations are server-authorized; anonymous comments never auto-approve; raw email/IP/fingerprint data is not public; API responses use stable status codes/envelopes; no in-memory CRUD fallback; server-only secrets never use `VITE_` prefixes.

Feeds never include drafts, future/archived content, full bodies, comments or account data; feed excerpts remain plain text and are XML-escaped exactly once. Feed discovery is omitted from private/error/not-found pages.

## Dependency edges

UA-0020 consumed this card and the UI card to create the client scaffold and SSR boundary. UA-0024 through UA-0028 added the durable schema, auth boundary, and post API/admin CRUD contract; UA-0030 through UA-0034 added privacy-safe comments, public client/token flow, SSR metadata, crawl handlers, and the public comment form. Later runtime/browser/release work added the shared router, live Neon/Vercel verification and production smoke; operations still consume migration, env, rollback and provider evidence.

## Verification

```powershell
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --audit-level=high
python tools/useagent.py validate
python tests/useagent-conformance/replay.py
```

Scaffold, boundary, public-flow, SSR, runtime-regression, browser, feed and slug-history verification completed under UA-0020, UA-0024 through UA-0028, UA-0030 through UA-0034, UA-0046, UA-0052, UA-0056, UA-0057, UA-0059, UA-0061, UA-0069, UA-0072 and UA-0077 through UA-0080: install, 93 Vitest tests, 2 browser E2E tests, typecheck, lint, production build, audit, direct API/SSR checks, metadata checks, Cap validation, local deep-link smoke, lifecycle fixture, Neon branch restore, production migration/replay, and Vercel live route smoke passed. VPS/Netlify execution, native dump/restore, provider lock contention testing and positive live historical-alias fixture remain open.

## Known gaps

The health, auth, post, comments, render, feed, sitemap, and robots handlers, typed content/auth/comment schemas, migration shapes, and server configuration contracts now exist. Slug-history code is implemented and deployed under UA-0077/UA-0080; migration 0004 is applied to Neon after zero-conflict preflight and branch restore evidence. The read-only `provision.ts:preflightSlugHistory` helper reports malformed/missing audit candidates and multi-owner/current-owner conflicts without slug values. The transactional migration aborts ambiguous ownership and backfills only deterministic current/audited published candidates. Missing audit history cannot be invented.

Native production dump/restore, lock-duration/two-session PostgreSQL verification and a positive live historical-alias smoke remain open. Local PGlite competing-call tests serialize SQL sessions and do not establish provider contention behavior. Application rollback keeps the additive table/trigger; older code then protects ownership but temporarily returns 404 for aliases. Database rollback is not implicitly authorized. See `docs/architecture.md:Permanent published-slug ownership` and `Migration, seed, and rollback` for retention and release details. Feed, alias-fixture and non-Vercel follow-ups remain separately tracked.
