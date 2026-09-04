# Architecture module card

freshness: verified
verified_on: 2026-09-05
owner: supervisor

## Responsibility

`docs/architecture.md` and decision 0003 define the Vite + React + TypeScript application boundary: a route-aware SSR entry, Vercel Node.js Functions under `api/`, Neon Postgres via Drizzle, Better Auth for admin-only sessions, and server-side SEO/abuse controls. UA-0020 verified the client route shell, token-based responsive styles, test/build scripts, and an SSR boundary entry in `src/`; these are scaffold-level interfaces and placeholders, not provider-backed product behavior. The architecture cards do not claim working credentials, provider accounts, migrations, or deployment.

## Entry points and interfaces

- `src/main.tsx` — browser entry and route-aware client render.
- `src/app/App.tsx` — public/admin placeholder route shell and semantic layout.
- `src/entry-server.tsx` — SSR boundary using `StaticRouter`; Vercel function wiring and data loading remain future work.
- `src/server/content.ts` — Drizzle published reads, admin session guard, post mutations, optimistic concurrency, and audit writes.
- `src/server/content-contract.ts` — bounded post create/update/archive and list-query validation.
- `api/posts/index.ts` and `api/posts/[id].ts` — public published reads and admin-only post CRUD/archive HTTP adapters.
- `docs/architecture.md:Routes` — public, admin, API, health, sitemap, and robots paths.
- `docs/architecture.md:Entities and invariants` — category, post, comment, auth, rate-limit, and audit boundaries.
- `docs/architecture.md:Auth and CRUD flow` — server-side role, validation, concurrency, audit, and archive rules.
- `docs/architecture.md:Anonymous comments, moderation, and anti-spam` — email-only pending flow, honeypot/token/rate-limit/Turnstile controls.
- `docs/architecture.md:SEO and crawl output` — SSR metadata, alternates, JSON-LD, sitemap, robots, and noindex rules.
- `docs/architecture.md:Environment variables` and `Migration, seed, and rollback` — operational contracts and explicit provider blockers.

## Invariants

Only published content is public; admin mutations are server-authorized; anonymous comments never auto-approve; raw email/IP/fingerprint data is not public; API responses use stable status codes/envelopes; no in-memory CRUD fallback; server-only secrets never use `VITE_` prefixes.

## Dependency edges

UA-0020 consumed this card and the UI card to create the client scaffold and SSR boundary. UA-0024 through UA-0028 added the durable schema, auth boundary, and post API/admin CRUD contract; UA-0030 through UA-0034 added privacy-safe comments, public client/token flow, SSR metadata, crawl handlers, and the public comment form without provider execution. Operations and release gates consume migration, env, rollback, and provider evidence.

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

Scaffold, boundary, public-flow, and SSR contract verification completed under UA-0020, UA-0024 through UA-0028, and UA-0030 through UA-0034: install, typecheck, lint, focused unit/contract tests, production build, direct API/SSR tsc, high-severity audit, secret/client-boundary scans, metadata checks, and local deep-link smoke passed. Live API/persistence/auth, hydrated SSR, E2E, a11y, and provider/deployment verification remain pending and are listed in `docs/architecture.md:Verification boundaries for follow-up implementation`.

## Known gaps

The health, auth, post, comments, render, sitemap, and robots handlers, typed content/auth/comment schemas, migration shapes, and server configuration contracts now exist. No migration or handler has been exercised against an authorized provider target; admin screens, hydrated SSR data snapshots, provider-backed abuse/auth/CRUD behavior, browser QA, deployment, and rollback evidence require implementation and review.
