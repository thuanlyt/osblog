# osblog application architecture

**Status:** reviewed architecture contract with a verified client scaffold. The initial internal **Codex fallback** attempt for UA-0013 produced the proposal but stopped without a CLI report; this document was supervisor-recovered under UA-0014. UA-0020 then verified the Vite/React/TypeScript client shell, tests, build, and SSR boundary placeholder. It is not Antigravity execution. Antigravity remains the preferred primary for this work when its client is callable. No provider account, credential, deployment, database, or production readiness is claimed here.

## Decision in one paragraph

Build a Vite + React + TypeScript application with a browser client, a small shared server layer, and Vercel Node.js Functions under `api/`. Use Neon Postgres as the durable store and Drizzle ORM with the Neon HTTP driver for short serverless transactions. Use Better Auth with its Drizzle adapter for the protected admin session boundary, with public sign-up disabled and an explicitly seeded admin identity. Public pages use a route-aware Vite SSR entry served by one Node function so crawlers receive article HTML and metadata; the client hydrates the same React tree. CRUD, moderation, auth, SEO, and rate-limit writes cross the API boundary only. The current tree contains the reviewed client scaffold, server schema/auth boundary, and post API adapters; provider-backed execution and route-aware SSR data loading remain follow-up gates.

This choice is grounded in the [Vercel Node.js Functions documentation](https://vercel.com/docs/functions/runtimes/node-js), which supports TypeScript functions in `api/`, and the [Vercel configuration documentation](https://vercel.com/docs/project-configuration/vercel-json), which documents function routing and rewrites. Drizzle documents both Neon HTTP and WebSocket drivers and specifically describes HTTP as suitable for single, non-interactive serverless transactions ([Drizzle <> Neon](https://orm.drizzle.team/docs/connect-neon)). Better Auth documents a Drizzle adapter for PostgreSQL and schema generation/migration ([Drizzle adapter](https://better-auth.com/docs/adapters/drizzle)). These are design anchors, not execution or vendor-access evidence.

## Runtime and ownership boundaries

```text
Browser
  ├─ React UI and hydration (src/)
  ├─ public read requests ───────────────┐
  └─ admin/comment form requests ────────┤
                                          v
Vercel Node.js Functions (api/)
  ├─ request parsing, auth, CSRF/origin checks, validation
  ├─ route handlers and SEO HTML/XML responses
  └─ server-only services ──> Neon Postgres (Drizzle)
```

Planned ownership is deliberately narrow:

- `src/app/` owns React routes, layouts, view models, and the shared public/admin component tree.
- `src/entry-client.tsx` hydrates the SSR HTML; `src/entry-server.tsx` renders public routes and page metadata from a read-only query service.
- `src/server/` owns schema, query services, validation, and auth configuration that are imported by API handlers only. It must never be included in client bundles.
- `api/` owns HTTP adapters. Each handler delegates to the shared server layer and returns explicit status codes; it does not contain an in-memory repository.
- `drizzle/` owns the reviewed initial content and Better Auth migration shapes. Migration execution and a guarded idempotent seed remain operator/auth work-item responsibilities; the current implementation has no provider-backed persistence run.

Vercel deployment configuration must keep `/api/*` as functions, serve Vite client assets from the build output, and rewrite public page paths to the SSR handler before the SPA fallback. The exact `vercel.json` shape is a later implementation task and is outside UA-0013 scope. Node.js is the default function runtime; Edge is not selected because the first persistence/auth implementation needs the Node-compatible Postgres and crypto ecosystem. Function duration, region, and pool behavior must be verified against the chosen Vercel plan before release.

## Routes

| Route | Access | Output and behavior |
|---|---|---|
| `/` | public | Bilingual home, featured/latest posts, bounded related/random/most-viewed sections. SSR. |
| `/category/:slug` | public | Published posts in one category, stable pagination, canonical URL. SSR. |
| `/post/:slug` | public | Published article, language alternates, view event, related posts, comments. SSR. |
| `/search?q=` | public | Bounded server-side search; `noindex,follow`, never exposes drafts. |
| `/about` | public | Static bilingual editorial/about page. SSR or static HTML. |
| `/admin/login` | unauthenticated | Better Auth sign-in only; no public registration. |
| `/admin` | admin | Moderation and content summary. Redirects to login when unauthenticated. |
| `/admin/posts` and `/admin/posts/new` | admin | Post list and validated create form. |
| `/admin/posts/:id/edit` | admin | Post update form with draft/publish transition. |
| `/admin/categories` | admin | Category create/read/update/delete. Referenced categories cannot be deleted silently. |
| `/admin/comments` | admin | Pending/approved/rejected/spam moderation queue. |

API handlers are separate from browser routes:

| Method and path | Boundary |
|---|---|
| `GET /api/posts`, `GET /api/posts/:id` | Public published reads; admin may request drafts. |
| `POST /api/posts`, `PATCH /api/posts/:id`, `DELETE /api/posts/:id` | Admin-only CRUD; Zod-style validation, audit record, transactional category check. Delete means archive by default; hard delete is a separately audited operation. |
| `GET /api/categories`, `POST/PATCH/DELETE /api/categories/:id` | Public read; admin-only mutations. |
| `POST /api/comments` | Anonymous submission; always enters `pending` or `spam`, never directly `approved`. |
| `GET /api/admin/comments`, `PATCH /api/admin/comments/:id` | Admin-only moderation and status transitions. Comment email is never returned to public clients. |
| `/api/auth/*` | Better Auth sign-in, session, and sign-out handlers. |
| `GET /api/healthz` | Read-only liveness/configuration check; no secrets or database contents. |
| `GET /sitemap.xml`, `GET /robots.txt` | XML/text functions backed by published rows only; rewrites may point these paths to `api/seo/*`. |

API responses use a stable `{ data, error, requestId }` envelope. Validation errors are `400`, unauthenticated is `401`, unauthorized is `403`, missing records are `404`, conflicts are `409`, rate limits are `429`, and unexpected failures are generic `500` responses with server-side request IDs.

## Entities and invariants

The initial PostgreSQL schema should contain:

- `category`: UUID `id`, unique `slug`, `name_vi`, `name_en`, descriptions, timestamps, and an active/archived flag. Slugs are lowercase and immutable after publication unless a redirect record is added.
- `post`: UUID `id`, `category_id`, unique `slug`, bilingual title/excerpt/body Markdown, cover image URL and alt text per language, `status` (`draft|published|archived`), `published_at`, timestamps, `view_count`, and optional SEO title/description. Only `published` rows are public; publishing requires both language titles and a valid category.
- `comment`: UUID `id`, `post_id`, encrypted email for moderator use, email hash for deduplication/rate limiting, body text, `status` (`pending|approved|rejected|spam`), hashed IP and user-agent fingerprint, created/reviewed timestamps, and moderation reason. Email and fingerprints are sensitive data with a documented retention/deletion policy; neither is public.
- Better Auth tables (`user`, `session`, `account`, and verification data as configured): one or more `admin` users, with role checks in the API. Public sign-up is disabled.
- `rate_limit_bucket`: normalized key, window start, count, and expiry. It is used atomically for comment limits and is not a client-side counter.
- `audit_event`: actor/session, action, entity, entity ID, before/after summary, request ID, and timestamp. Do not store raw passwords, auth tokens, or comment email in the audit payload.

Foreign keys, unique slugs, status checks, maximum lengths, and indexes on `(status, published_at)`, `category_id`, `post_id`, and moderation status are database invariants, not only UI rules. Published content is immutable from the public perspective: edits create a new `updated_at` and invalidate any cached HTML.

Related content is deterministic: same category and language first, then a stable hash of post ID ordered by a request seed. Random content accepts a server-generated bounded seed and a maximum count. Most-viewed uses a time-bounded view aggregate, not an unbounded counter scan. View increments are deduplicated per short-lived anonymous cookie/IP hash and may be eventually consistent; they never gate publication.

## Auth and CRUD flow

1. `POST /api/auth/sign-in/email` accepts credentials only for pre-created admin users. Better Auth issues a rotating, expiring, `HttpOnly; Secure; SameSite=Lax` session cookie. Use a strong `BETTER_AUTH_SECRET`, origin checks, and a server-side role check on every mutation.
2. The admin shell calls a session endpoint and renders only after a `401`/redirect decision. Hiding controls in React is not authorization.
3. Each mutation parses JSON with a shared schema, normalizes slugs, checks optimistic concurrency (`updated_at` or version), runs the database transaction, writes an audit event, and returns the saved record. No request may select a repository implementation that falls back to memory.
4. Category delete is rejected when posts reference it (`409`) unless a deliberate reassignment/archive operation is submitted. Post delete archives by default; hard deletion requires a separate confirmation and audit trail.
5. Sign-out revokes the session. Session cookies, CSRF/origin failures, and admin role failures are covered by integration tests.

The exact Better Auth configuration and generated schema require provider/package verification during implementation. Until that work is complete, admin auth is a design boundary, not a working login and not a production claim. Better Auth's email/password flow is documented at [Email & Password](https://better-auth.com/docs/authentication/email-password); its default sign-up behavior must be disabled or guarded for this single-admin use case.

## Anonymous comments, moderation, and anti-spam

The form asks for email and comment text only; there is no commenter account, registration, or login. The API still treats the browser as hostile:

- Normalize and validate email server-side; cap body length; strip/escape HTML and render only sanitized Markdown/plain text.
- Require a server-issued form token and reject submissions that arrive implausibly quickly. Include a honeypot field, but never rely on it alone.
- Enforce an atomic database rate limit by hashed IP and hashed normalized email (for example, a small per-IP and per-email window); return `429` with `Retry-After`. Do not log raw IP or email.
- In production, verify Turnstile server-side when `TURNSTILE_SECRET_KEY` is configured/required. A missing key in production is a configuration failure, not permission to bypass the check. The provider choice and quotas remain unverified until credentials are supplied.
- Optionally run a provider-backed moderation check, but keep the durable state machine local: `pending -> approved|rejected|spam`, with moderator, timestamp, and reason. The safe default is `pending`.
- Return a generic accepted response for syntactically valid anonymous submissions to reduce account/content enumeration. Do not send notification mail until moderation and abuse tests pass.
- Apply retention rules to encrypted email and hashed fingerprints, and provide an admin deletion path. Never expose email in HTML, JSON, analytics, or sitemap output.

## SEO and crawl output

The SSR response for each public route must include:

- `<html lang="vi">` or `lang="en"` and a user-selectable language URL strategy;
- unique title and description, one canonical URL, and `alternate` links for `vi`, `en`, and `x-default` where a translation exists;
- Open Graph/Twitter metadata and a responsive cover image with meaningful alt text;
- JSON-LD `Article` and `BreadcrumbList` for posts, using the public site URL and publication/update timestamps;
- noindex for admin, drafts, and search results; no draft or rejected comment in SSR data;
- `/sitemap.xml` containing only canonical published post/category URLs with `lastmod`, and `/robots.txt` disallowing `/admin` and private API paths.

Because a client-only Vite shell would leave crawlers with incomplete article metadata, public route rewrites must reach the SSR function. Hydration must use the same route/data snapshot to avoid markup mismatch. Cache only public GET HTML and invalidate/revalidate after publication; never cache admin, comments, auth, or draft responses.

## Environment variables

Server-only values are never prefixed with `VITE_` and must be configured separately per Vercel environment:

| Variable | Use |
|---|---|
| `DATABASE_URL` | Neon runtime URL for Drizzle HTTP queries. |
| `DATABASE_URL_MIGRATIONS` | Direct/migration connection used only by CI or an operator, never shipped to the browser. Exact Neon connection mode is an implementation blocker until verified. |
| `BETTER_AUTH_SECRET` | Session/signing secret; rotate via a documented session invalidation procedure. |
| `BETTER_AUTH_URL` | Trusted canonical auth origin. |
| `ADMIN_EMAIL` | Seed/bootstrap allow-list; not a public registration setting. |
| `ADMIN_SEED_PASSWORD` | One-time bootstrap secret, supplied only to a protected migration/seed job and removed afterward. |
| `TURNSTILE_SECRET_KEY` | Server-side anonymous comment challenge verification. |
| `RESEND_API_KEY` and `COMMENT_NOTIFICATION_EMAIL` | Optional post-moderation notification delivery; not required for accepting a pending comment. |
| `SENTRY_DSN` | Optional server error reporting after privacy review. |

Public build-time values may include `VITE_SITE_URL`, `VITE_SITE_NAME`, and `VITE_DEFAULT_LOCALE`. The client must never receive database URLs, auth secrets, seed credentials, Turnstile secrets, raw email, or unredacted operational configuration. Missing required server variables should fail health checks and deployment validation, not silently use development defaults.

## Migration, seed, and rollback

The first implementation should add a Drizzle schema and generated SQL migrations, then run:

```text
npm run db:generate       # review generated SQL in the change
npm run db:migrate        # CI/operator step against DATABASE_URL_MIGRATIONS
npm run db:seed           # idempotent categories/admin bootstrap; blocked in prod unless explicitly enabled
```

Migrations are expand/contract and forward-only in normal operation: add nullable structures, deploy code that dual-reads/writes when needed, backfill, then enforce constraints in a later migration. Production migration execution is a separately authorized release step and is not run by this task. Seed data must use stable IDs/upserts and must not overwrite edited content. Better Auth schema generation must be reviewed alongside application migrations.

Rollback is two-dimensional:

1. For code-only failures, point the Vercel production alias back to the last known-good immutable deployment after smoke checks.
2. For schema changes, roll back code only while the database remains backward-compatible. Do not run an unreviewed destructive down migration. Restore content from the provider's tested backup/point-in-time mechanism only under incident approval, then reconcile audit events and invalidate caches.

Before release, verify Neon backup/branch restore, Vercel alias rollback, migration locking, and the recovery time/data-loss objectives. Those provider-account checks are explicit blockers; no rollback evidence exists in this target.

## Verification boundaries for follow-up implementation

The current tree has a package manifest, client source, API adapters, schema/auth migration shapes, SSR/crawl handlers, and local build/test boundaries, but no provider execution or credentials. The commands below identify follow-up QA; only the scoped checks recorded in UA-0020, UA-0024 through UA-0028, and UA-0030 through UA-0034 are claimed as passing:

```text
npm ci
npm run lint
npm run typecheck
npm run test -- --runInBand                 # unit: schemas, selectors, rate-limit decisions
npm run test:api                             # auth/CRUD/comments/status and 401/403/409/429 cases
npm run test:seo                             # SSR HTML, canonical/hreflang, JSON-LD, sitemap/robots
npm run test:e2e                             # deep links, admin CRUD, moderation, responsive keyboard flows
npm run test:a11y                            # WCAG-oriented route/component checks
npm run build                                # Vite client + SSR bundle + API type/build boundary
```

Focused acceptance evidence must include: a real database integration run against a disposable Neon branch or local Postgres-compatible test database; migration/seed replay; auth cookie and authorization tests; comment abuse/rate-limit tests; deterministic related/random/most-viewed tests; HTML/XML parsing and metadata assertions; route refresh/deep-link checks; keyboard/focus/reduced-motion checks at the persisted UI reference widths; and a production bundle/performance review. Until those exist, status remains discovery-only and `not_ready`.

## Known blockers and next action

- **Provider verification blocker:** no Neon, Better Auth, Turnstile, mail, Vercel, or domain credentials are available in this task. Confirm package versions, Neon connection mode, quotas, and account backup/rollback capabilities during implementation; do not wait on them here.
- **SSR/runtime blocker:** `src/entry-server.tsx` and `api/render.ts` now define route-aware metadata/HTML boundaries, but hashed client-asset hydration, route-aware provider data snapshots, and full crawl pagination require implementation and review.
- **Schema/provider blocker:** migration shapes, guarded seed, data-retention policy, and provider execution require implementation and review. Local API code does not constitute live CRUD or production behavior.

**Next action:** obtain an authorized Neon/Postgres and Better Auth provider target/credentials, then run migration/auth/CRUD/comments/SSR integration QA before any deployment action.
