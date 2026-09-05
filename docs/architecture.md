# osblog application architecture

*Tiếng Việt (tóm tắt): [docs/vi/architecture.md](vi/architecture.md)*

**Status:** implemented and reviewed. This replaces an earlier scaffold-era version of this document that described `api/render.ts`, per-route Vercel functions, and a placeholder admin UI — none of that shape exists anymore. What is described below is the current single-router architecture, verified locally with 64 passing unit/component/SQL integration tests plus 2 compiled-browser E2E tests. Production deployment `dpl_8PzrSBYo5rsYzwfeqTXn2tDLzdjD` is live on both requested Vercel hostnames and passed the dated route smoke recorded in [Deployment](deployment.md).

## Decision in one paragraph

osblog is a Vite + React 19 + TypeScript application with one shared request router ([`src/server/router.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/router.ts)) that handles every path — public pages, the documentation site, the admin app, and the JSON API — behind a single `Request -> Response` function. That router is reused unmodified across three runtimes: a Node HTTP server in development and on a VPS ([`tools/server/start.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts)), a single Vercel Node.js Function ([`api/index.ts`](https://github.com/thuanlyt/osblog/blob/main/api/index.ts)), and a single Netlify Fetch function ([`netlify/functions/osblog.mts`](https://github.com/thuanlyt/osblog/blob/main/netlify/functions/osblog.mts)). Persistence uses Neon Postgres via Drizzle ORM's HTTP driver; admin authentication uses Better Auth with public sign-up disabled and one operator-bootstrapped identity. Public routes render server-side with `renderToString` so crawlers receive real article HTML and metadata; the same React tree hydrates in the browser.

## Runtime and ownership boundaries

```text
Browser
  ├─ React UI and hydration (src/app/)
  ├─ public read requests ───────────────┐
  └─ admin/comment form requests ────────┤
                                          v
Shared request router (src/server/router.ts)
  ├─ request parsing, auth, CSRF/origin checks, validation, security headers
  ├─ route dispatch: API JSON, SSR HTML, sitemap/robots
  └─ server-only services ──> Neon Postgres (Drizzle)
        ^
        │ same router, three thin adapters
  ┌─────┴──────┬───────────────────┬─────────────────────┐
  Node HTTP     Vercel Function      Netlify Function
  (dev/VPS)     (api/index.ts)       (netlify/functions/osblog.mts)
```

- `src/app/` owns React routes, layouts, the public component tree, and the admin app (`src/app/admin/`).
- `src/entry-client.tsx` hydrates the SSR HTML in the browser; `src/entry-server.tsx` renders every route to a string via `renderToString` and builds the full HTML document (SEO tags, JSON-LD, hashed asset links) via [`src/server/seo.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/seo.ts).
- `src/server/` owns the router, schema, query services (`content.ts`, `comments.ts`, `docs.ts`, `pages.ts`), validation contracts, and auth configuration. It is imported only by server entry points and must never be bundled for the client.
- `src/server/node-adapter.ts` adapts the `Request/Response`-based router to Node's `IncomingMessage`/`ServerResponse`, used by both `tools/server/start.ts` and, indirectly, by the Vercel/Netlify adapters (which run the same built router in their own request model).
- `api/index.ts` and `netlify/functions/osblog.mts` are thin re-exports of the built `dist/server/index.js` handler — neither contains routing logic of its own.
- `drizzle/` owns the four applied SQL migrations; `src/server/provision.ts` owns migration execution, admin bootstrap, and the optional content seed.

## Routes

Route resolution happens in [`src/server/pages.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/pages.ts) (`loadPage`), which is data-driven rather than a client-side route table — it inspects the URL and returns a typed `PageData` payload that `src/app/App.tsx` renders by `kind`.

| Route | Access | Output and behavior |
|---|---|---|
| `/` | public | Bilingual home: latest published posts, categories, archive years. SSR. |
| `/archive` | public | Same listing shape as home, framed as the full archive. SSR. |
| `/category/:slug` | public | Published posts filtered to one category. SSR. |
| `/search?q=` | public | Bounded server-side search across title/excerpt (both languages); `noindex,follow`. |
| `/post/:slug` | public | Published article: bilingual body, approved comments, up to 3 related posts from the same category. SSR. |
| `/about` | public | Static bilingual about page. |
| `/docs`, `/docs/:slug` | public | This documentation set, read from `docs/**/*.md`; `?lang=vi` selects the Vietnamese variant. |
| `/admin/login` | unauthenticated | Better Auth sign-in only; no public registration. |
| `/admin`, `/admin/posts`, `/admin/posts/new`, `/admin/posts/:id/edit`, `/admin/categories`, `/admin/comments` | admin | The real publishing workspace (React Router app under `src/app/admin/`); redirects to `/admin/login` when unauthenticated. |

API handlers, all under `/api/`:

| Method and path | Boundary |
|---|---|
| `GET /api/posts`, `GET /api/posts/slug/:slug` | Public published reads only. |
| `GET /api/categories` | Public read of active categories. |
| `POST /api/posts/:id/view` | Rate-limited (1 per IP per post per 24h), increments `view_count`. |
| `GET /api/comments/token` | Issues a signed, time-boxed comment form token. |
| `GET /api/comments?postId=`, `POST /api/comments` | Public read of approved comments; anonymous submission, always `pending`/`spam`. |
| `GET/POST /api/admin/posts`, `GET/PATCH/DELETE /api/admin/posts/:id` | Admin-only post CRUD; `DELETE` archives. |
| `GET/POST /api/admin/categories`, `PATCH/DELETE /api/admin/categories/:id` | Admin-only category CRUD; `DELETE` archives; referenced categories cannot be archived by another route's cascade — deletion is rejected with `409` if posts still reference an active category. |
| `GET /api/admin/comments`, `PATCH /api/admin/comments/:id`, `DELETE /api/admin/comments/:id` | Admin-only moderation; `DELETE` is a real, permanent delete. |
| `GET /api/admin/session` | Returns the signed-in admin's email. |
| `/api/auth/sign-in/email`, `/api/auth/sign-out`, `/api/auth/get-session` | The only three Better Auth endpoints exposed — no public sign-up surface. |
| `GET /api/healthz` | Liveness/DB-connectivity check (`select 1`); no secrets or database contents. |
| `GET /sitemap.xml`, `GET /robots.txt` | Generated from published rows and the documentation set; robots disallows `/admin` and `/api/`. |

API responses use a stable `{ data, error, requestId }`-shaped envelope (see [`src/server/http.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/http.ts)). Validation errors are `400`, unauthenticated `401`, unauthorized `403`, missing records `404`, conflicts `409`, rate limits `429`, and unexpected failures a generic `500`/`503` with a server-side request ID.

## Entities and invariants

Schema source: [`src/server/schema.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/schema.ts).

- **`category`** — UUID `id`, unique `slug`, bilingual name/description, `isArchived` flag, timestamps.
- **`post`** — UUID `id`, `categoryId` (FK), unique `slug`, bilingual title/excerpt/body, cover image URL + bilingual alt text, `status` (`draft|published|archived`), `publishedAt`, `viewCount`, bilingual SEO title/description, timestamps. Indexed on `(status, published_at)` and `categoryId`. Only rows where `status = 'published'`, `publishedAt <= now()`, and the owning category is not archived are publicly visible (`visiblePost()` in [`src/server/content.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/content.ts)) — a future `publishedAt` is a real, working way to schedule a post.
- **`comment`** — UUID `id`, `postId` (FK), encrypted email (`emailCiphertext`) plus `emailHash` for dedup/rate-limit lookups, body text, `status` (`pending|approved|rejected|spam`), hashed IP and user-agent, `reviewedAt`, `moderationReason`, timestamps. Indexed on `postId`, `(status, createdAt)`, and `emailHash`.
- **Better Auth tables** (`user`, `session`, `account`, verification) — exactly one admin user; a `databaseHooks.user.create.before` hook additionally rejects creating any account whose email doesn't match `ADMIN_EMAIL`, on top of `disableSignUp`.
- **`rate_limit_bucket`** — normalized key, window start, count, expiry; used atomically for comment submission, sign-in attempts, and per-post view counting.
- **`audit_event`** — actor user ID, action, entity, entity ID, before/after JSON summary, request ID, timestamp. Never stores raw passwords, tokens, or comment email.

Published content is not literally immutable, but every edit bumps `updated_at` (`nextTimestamp`, strictly increasing) and is guarded by optimistic concurrency (`expectedUpdatedAt`) so concurrent edits are rejected as `409` rather than silently lost.

## Auth and CRUD flow

1. `POST /api/auth/sign-in/email` accepts credentials only for the single pre-created admin user, rate-limited by hashed IP and hashed email (15 attempts / 15 minutes each). Better Auth issues a session cookie, `Secure` when the auth origin is `https://`, expiring after 8 hours and refreshing after 1 hour of use.
2. The admin app calls `GET /api/admin/session`; a `401` redirects to `/admin/login`. Hiding controls in React is never treated as authorization — every admin route handler calls the same `admin(request)` check in `router.ts`.
3. Each mutation parses JSON with a shared Zod schema, checks optimistic concurrency against `expectedUpdatedAt`, runs the write inside a database transaction, writes an `audit_event` row, and returns the saved record.
4. Category delete/archive is rejected with `409` when active posts still reference it. Post and category delete archive by default; there is no hard-delete action for either in the current admin UI. Comment delete is a real, permanent delete.
5. Sign-out revokes the session. Session cookies, CSRF/origin failures, and admin role failures are covered by [`tests/server/auth.test.ts`](https://github.com/thuanlyt/osblog/blob/main/tests/server/auth.test.ts).

## Anonymous comments, moderation, and anti-spam

The form asks for email and comment text only; there is no commenter account. Implemented protections, in order of what actually runs today:

- Server-side validation caps `body` at 5,000 characters and `email` at 320; Markdown/HTML in comment bodies is rendered through the same sanitized renderer used for posts, never raw HTML.
- A server-issued, HMAC-signed form token (`GET /api/comments/token`) expires after 15 minutes; submissions with a missing, expired, or forged token are rejected.
- A honeypot field is present but is one signal among several, never the only spam check.
- An atomic, database-backed rate limit (`rate_limit_bucket`) keyed by hashed IP and hashed normalized email; over-limit requests get `429`. Neither raw IP nor raw email is ever logged.
- The moderation state machine is `pending -> approved|rejected|spam`, with moderator action, timestamp, and reason, always starting `pending` or `spam` — never auto-approved.
- **Turnstile is not wired in.** `TURNSTILE_SECRET_KEY` is accepted by the environment schema but no code path verifies it yet — see [Configuration](configuration.md). Do not describe comment submission as CAPTCHA-protected.
- There is no outbound moderation-notification email; moderators check the queue at `/admin/comments`.

## SEO and crawl output

Implemented in [`src/server/seo.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/seo.ts) (`renderDocument`, used by every SSR response via `src/entry-server.tsx`):

- `<html lang="vi">` or `lang="en"` per the `?lang=` query parameter, with `hreflang` alternate links for both languages.
- A canonical URL (query parameters other than `lang`/`page`/`year`/`category` stripped), unique per-page title and description, Open Graph and Twitter Card metadata, and a responsive cover image with alt text when a post has one.
- JSON-LD: `BlogPosting` for articles (headline, dates, author, image), `TechArticle` for documentation pages, `WebSite` otherwise.
- `robots` meta is `noindex,follow` for non-200 responses, `/admin*`, `/login`, error pages, `/search`, and sorted (`random`/`popular`) listing views; everything else is `index,follow`.
- `/sitemap.xml` includes only visible posts (see `visiblePost()`), the documentation index and pages, static routes, and both language variants of each, with `lastmod` from `updated_at`; capped with an explicit `503` if a single sitemap would exceed roughly 49,000 URLs (partitioning is not implemented, and is not expected to be needed at this project's scale). `/robots.txt` disallows `/admin` and `/api/`.

## Environment variables

See [Configuration](configuration.md) for the complete, current table. In summary: `DATABASE_URL` (pooled) and `DATABASE_URL_MIGRATIONS` (direct, operator-only, falls back to `DATABASE_URL`) are never sent to the browser; `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, and `COMMENT_EMAIL_ENCRYPTION_KEY` are required in production and fail closed if missing; only `VITE_SITE_URL` is intended to reach the client bundle.

## Migration, seed, and rollback

```powershell
npm run db:migrate      # applies drizzle/*.sql inside one transaction, advisory-locked, checksum-tracked
npm run db:bootstrap    # creates the single admin account; never overwrites an existing one
npm run db:seed         # optional, idempotent bilingual introduction content
```

Migrations `0000_durable_content.sql` through `0003_auth_issuer.sql` have run against the provisioned Neon database and replay is idempotent (see [Backups and rollback](backups-and-rollback.md)). None of these three commands runs automatically as part of `npm run build` or any deployment — they are explicit operator steps.

Rollback is two-dimensional: for code-only failures, point the deployment target back at the last known-good build and smoke-test; for schema changes, keep rollback code backward-compatible with the deployed schema rather than running an unreviewed destructive migration. Full detail in [Backups and rollback](backups-and-rollback.md).

## Verification boundaries

```powershell
npm ci
npm run lint
npm run typecheck
npm test          # 64 unit/component/SQL integration tests as of 2026-09-05
npm run build
npm run test:e2e  # 2 compiled-browser E2E tests as of 2026-09-05
```

What is verified as of 2026-09-05: schema, environment parsing, auth policy, comment policy, content contracts, HTTP envelopes, SEO output, admin editor component behavior, SQL-backed integration tests against the real schema, compiled-browser publishing/moderation, responsive docs, Axe checks, production build output, and Vercel/Neon production route smoke on both requested hostnames. What is not yet verified: provider rollback/restore exercises and non-Vercel adapter execution (see [Deployment](deployment.md) and [Backups and rollback](backups-and-rollback.md)).

## Known gaps and next action

- **No slug-redirect mechanism.** Changing a published post's slug breaks existing inbound links; see [Markdown editor](editor.md).
- **Turnstile is unwired.** The secret is accepted but unused; comments are not CAPTCHA-protected today.
- **Non-Vercel operations remain open.** Netlify's adapter and the VPS path have not been exercised on their live platforms; Neon backup/restore and Vercel alias rollback drills are also pending. See [Deployment](deployment.md) and [Backups and rollback](backups-and-rollback.md).
- **Coverage boundary.** The compiled-browser gate proves the tested publishing/comment/moderation and responsive-docs flows; it does not replace provider rollback/restore drills or a full exploratory audit of every admin screen.

**Next action:** document and run a backup/rollback drill before the next material schema change, then consider Turnstile and non-Vercel deployment as separate follow-on work.
