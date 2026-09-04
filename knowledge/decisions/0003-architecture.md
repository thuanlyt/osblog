# Decision 0003: Vite/React/TypeScript with a Vercel API and Neon persistence boundary

## Status and attribution

**Status:** reviewed architecture decision; client scaffold verified under UA-0020, provider-backed implementation still pending.

This decision was drafted by the internal **Codex fallback** attempt for UA-0013 because the preferred Antigravity runtime is unavailable. That attempt stopped without a CLI report; the documents were supervisor-recovered and reviewed under UA-0014. It is not Antigravity execution. Antigravity remains the preferred primary for the original architecture task when available. UA-0020 later verified the client scaffold and SSR boundary placeholder; no provider account, credential, migration, or deployment was created.

## Decision

Use Vite + React + TypeScript for the browser and shared rendering code. Use Vercel Node.js Functions in root `api/` as the only server boundary. Use Neon Postgres with Drizzle ORM and the Neon HTTP driver for durable content, moderation, auth-adapter, rate-limit, and audit data. Use Better Auth with its Drizzle adapter for admin-only email/password sessions, with public sign-up disabled and an explicitly seeded admin identity. Serve public pages through a route-aware Vite SSR entry behind a Vercel rewrite so article HTML and SEO metadata are present before hydration; keep admin/auth/comments/API responses server-only and uncached.

The full route, entity, CRUD, auth, comment-abuse, SEO, environment, migration, rollback, and verification contract is recorded in [`docs/architecture.md`](../../docs/architecture.md).

## Why this boundary

- Vercel natively builds TypeScript functions placed in `api/` under the Node.js runtime. This is a direct fit for a Vite static/client build plus a small server API, without introducing a second full-stack framework.
- Postgres gives categories, posts, comments, auth records, moderation states, audit events, and atomic rate-limit updates one transactional relational boundary. Drizzle's Neon HTTP driver is intended for short, non-interactive serverless work; interactive transactions can be evaluated later if a real use case requires the WebSocket driver.
- Better Auth's Drizzle adapter keeps admin sessions and application data on the same relational boundary while avoiding an invented cookie/session implementation. The app still owns the admin role policy and disables public registration.
- SSR is required for the project's “pure SEO” goal. A client-only Vite shell would make crawlers depend on JavaScript for article metadata, canonical/alternate links, and structured data. One route-aware SSR function is the smallest documented boundary that preserves Vite.
- The API is the persistence boundary. React state, localStorage, build-time JSON, and module-level caches are never treated as CRUD storage.

Official anchors used during Codex fallback discovery:

- [Vercel Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js) — TypeScript functions and `api/` entry points.
- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json) — function routing, rewrites, and deployment configuration.
- [Drizzle <> Neon Postgres](https://orm.drizzle.team/docs/connect-neon) — Neon HTTP/WebSocket drivers and serverless connection guidance.
- [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle) — PostgreSQL adapter and schema generation/migration boundary.
- [Better Auth email/password](https://better-auth.com/docs/authentication/email-password) — sign-in flow that must be constrained to seeded admins.

These links support the architecture shape only. They do not verify this repository's package versions, credentials, account quotas, or deployment behavior.

## Alternatives rejected

| Alternative | Rejection reason |
|---|---|
| In-memory arrays, localStorage, or JSON files | Not durable across serverless instances and would be fake CRUD for a production blog. |
| Vercel KV/Blob as the primary store | Useful primitives, but insufficient alone for relational category/post/comment/auth constraints and atomic moderation queries. They may be added for a bounded cache only after measurement. |
| A hosted headless CMS | Adds a second admin/data source and vendor-specific operational dependency; the requirement is in-app category/post CRUD with an explicit API boundary. |
| SQLite on a function filesystem | Function filesystems are not a shared durable write store; a hosted SQLite service would add another provider and does not simplify this relational/auth boundary enough. |
| Supabase or another full backend platform | Technically viable, but it bundles database/auth/storage policy decisions that are not needed for the smallest Vercel API boundary. Revisit only with credentials and a concrete requirement. |
| Next.js or a different meta-framework | Strong Vercel SSR support, but it would replace the requested Vite baseline. A Vite SSR entry plus one Node function preserves the explicit stack assumption. |
| Edge Functions for all routes | Not selected for the first cut because Node.js compatibility and straightforward Postgres/auth dependencies are more important than an unverified edge latency gain. |

## Consequences and release gates

This keeps the first application small, but it requires a real SSR build, server-only module separation, migration discipline, cookie/CSRF tests, and a provider-backed integration environment. Vercel rewrites and build output need an implementation task; Neon connection behavior, Better Auth package versions, Turnstile policy, mail delivery, backups, and rollback must be verified with authorized accounts. No production claim is valid until focused/integration/accessibility/security/performance evidence and supervisor review show no open P0/P1 findings.

The next work item should implement only the persistence/auth boundary described here, then stop for review before broad public/admin UI or content features are added.
