# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project intends to follow [Semantic Versioning](https://semver.org/) once a first tagged release is cut. There is no tagged release yet; `package.json` currently reports `0.1.0` as a pre-release working version.

*Tiếng Việt: this file is documented in English only; see [docs/vi/index.md](docs/vi/index.md) for the bilingual product documentation.*

## [Unreleased]

### Added

- A real admin publishing workspace at `/admin`: Markdown toolbar, edit/preview/split view, per-language tabs, slug auto-derivation, cover image + mandatory alt text, per-language SEO fields, status/publish-date controls, unsaved-draft recovery via `localStorage`, and an optimistic-concurrency conflict prompt — see [docs/editor.md](docs/editor.md).
- A single shared request router ([`src/server/router.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/router.ts)) reused across three deployment adapters: a Node HTTP server for development/VPS ([`tools/server/start.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts)), a single Vercel Node.js Function (`api/index.ts`), and a single Netlify Fetch function (`netlify/functions/osblog.mts`) — see [docs/deployment.md](docs/deployment.md).
- Operator database tooling: `npm run db:migrate`, `npm run db:bootstrap`, and `npm run db:seed` ([`tools/server/database.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/database.ts), [`src/server/provision.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/provision.ts)).
- Four applied database migrations (`drizzle/0000` through `0003`), replayed idempotently against a provisioned Neon Postgres database (`osblog-db`, Singapore region); the admin account is bootstrapped and three bilingual introduction posts are seeded.
- Source-embedded documentation served live at `/docs` and `/docs/<slug>` (`?lang=vi` for Vietnamese), read from this same `docs/` tree — see [`src/server/docs.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/docs.ts) and [`src/app/pages/DocsPage.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/pages/DocsPage.tsx).
- Reconciled bilingual documentation set under `docs/` and `docs/vi/` reflecting the implemented product rather than the original scaffold.

### Known gaps (tracked for the next release)

- **Vercel/Neon is live and smoke-verified.** `https://osblog.thuanlyt.id.vn` and `https://osblog.vercel.app` serve the same production deployment; Netlify's adapter is implemented but has never been deployed, and VPS remains unexercised — see [docs/deployment.md](docs/deployment.md).
- Browser publishing, moderation, responsive-docs and automated accessibility checks pass in the compiled E2E suite; a separate manual visual review is evidence in the work record rather than an enforced CI service.
- Turnstile anti-spam verification is not wired in — `TURNSTILE_SECRET_KEY` is accepted by the environment schema but no code path uses it yet.
- No slug-redirect mechanism — changing a published post's slug breaks existing inbound links.
- No public sign-up, email verification, or password-reset flow — by design; the bootstrap operator model is the entire account system.
- Neon backup/restore and deployment-alias rollback drills remain unexercised; see [docs/backups-and-rollback.md](docs/backups-and-rollback.md).

## [0.1.0] - 2026-09-05

Initial open-source scaffold release. Most of what this version describes as designed-but-not-built has since been implemented under [Unreleased] above; this entry is kept for history.

### Added

- Vite + React 19 + TypeScript client shell with deep-linkable public routes and a comment form.
- Drizzle ORM schema for `category`, `post`, `comment`, `rate_limit_bucket`, and `audit_event`, targeting Neon Postgres (`src/server/schema.ts`).
- Better Auth admin-only policy and schema modules, with public sign-up disabled by design.
- Post/category/comment API route handlers using a stable `{ data, error, requestId }` response envelope.
- A server-side rendering boundary and SEO helpers, plus sitemap/robots handlers.
- A persisted UI/accessibility design system (`design-system/osblog/`) and an initial architecture decision record.
- Unit and contract test suite (`tests/server/`).
- MIT license; public repository at [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog).
