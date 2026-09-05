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
- `comments.ts` and `comment-policy.ts` enforce pending moderation, signed tokens, honeypot and rate limits. Email is encrypted and never public. Turnstile is not wired.
- `provision.ts` provides checksum-verified locked migrations, idempotent operator bootstrap and optional seed. Four migrations actually ran on authorized Neon; the GitHub-linked Vercel production deployment on `main` and both requested hostname smoke checks confirmed connectivity. Netlify deployment is not verified.
- Current responses use no-store. Sitemap SQL reads are paged with an explicit capacity guard requiring index partitioning at large scale.

### Current gate and known findings

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`, UseAgent validation and conformance replay are the relevant commands. The current local gate is 64 unit/component/SQL integration tests plus 2 compiled-browser tests. Compiled-browser publishing tests use real isolated SQL and record genuine interactions; Cap footage is separate product media, not test evidence.

UA-0048 independently reproduced partial PATCH unpublishing (P1), malformed cover URL SSR failure, dropped renewed cookies and stalled chunked overflow (P2). UA-0052 fixed the original findings; UA-0053 found a residual auth failure path and insufficient socket-reuse coverage; UA-0056 fixed both and UA-0058 found no new application P0/P1/P2 finding. The Vercel/Neon production path is live and smoke-verified; remaining gates are explicit operational follow-up (backup/restore, alias rollback, Turnstile and non-Vercel execution), not an unverified deployment claim.

## Archived scaffold responsibility (historical only)

`docs/architecture.md` and decision 0003 define the Vite + React + TypeScript application boundary: a route-aware SSR entry, Vercel Node.js Functions under `api/`, Neon Postgres via Drizzle, Better Auth for admin-only sessions, and server-side SEO/abuse controls. UA-0020 verified the client route shell, token-based responsive styles, test/build scripts, and an SSR boundary entry in `src/`; these are scaffold-level interfaces and placeholders, not provider-backed product behavior. The architecture cards do not claim working credentials, provider accounts, migrations, or deployment.

## Entry points and interfaces

- `src/main.tsx` — browser entry and route-aware client hydration.
- `src/app/App.tsx` — real public/admin route rendering and semantic layout.
- `src/entry-server.tsx` — SSR boundary using the shared route loader and router; Vercel wiring is provided by `api/index.ts`.
- `src/server/content.ts` — Drizzle published reads, admin session guard, post mutations, optimistic concurrency, and audit writes.
- `src/server/content-contract.ts` — bounded post create/update/archive and list-query validation.
- `src/server/router.ts` — shared API, SSR, auth, security-header and crawl-route dispatcher used by every runtime adapter.
- `docs/architecture.md:Routes` — public, admin, API, health, sitemap, and robots paths.
- `docs/architecture.md:Entities and invariants` — category, post, comment, auth, rate-limit, and audit boundaries.
- `docs/architecture.md:Auth and CRUD flow` — server-side role, validation, concurrency, audit, and archive rules.
- `docs/architecture.md:Anonymous comments, moderation, and anti-spam` — email-only pending flow, honeypot/token/rate-limit/Turnstile controls.
- `docs/architecture.md:SEO and crawl output` — SSR metadata, alternates, JSON-LD, sitemap, robots, and noindex rules.
- `docs/architecture.md:Environment variables` and `Migration, seed, and rollback` — operational contracts and the remaining provider/rollback boundaries.

## Invariants

Only published content is public; admin mutations are server-authorized; anonymous comments never auto-approve; raw email/IP/fingerprint data is not public; API responses use stable status codes/envelopes; no in-memory CRUD fallback; server-only secrets never use `VITE_` prefixes.

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

Scaffold, boundary, public-flow, SSR, runtime-regression, and browser verification completed under UA-0020, UA-0024 through UA-0028, UA-0030 through UA-0034, UA-0046, UA-0052, UA-0056, UA-0057, UA-0059 and UA-0061: install, typecheck, lint, 64 unit/component/SQL integration tests, 2 compiled-browser E2E tests, production build, direct API/SSR tsc, metadata checks, Cap validation, local deep-link smoke, lifecycle fixture, and Vercel/Neon live route smoke passed. VPS/Netlify execution and backup/rollback drills remain pending.

## Known gaps

The health, auth, post, comments, render, sitemap, and robots handlers, typed content/auth/comment schemas, migration shapes, and server configuration contracts now exist. Local SQL, compiled-browser paths, and the authorized Vercel/Neon production path are verified; live rollback/restore and non-Vercel adapter execution remain operational follow-up work.
