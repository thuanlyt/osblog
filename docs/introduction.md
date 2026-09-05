# Introduction to OSBlog

*Tiếng Việt: [docs/vi/introduction.md](vi/introduction.md)*

OSBlog — "open source blog" — is a small, bilingual publishing app. One writer or a small team writes in Vietnamese and English, publishes Markdown articles with a real cover image and SEO metadata, and lets readers leave moderated comments without creating an account. No slogans, no unnecessary abstraction — a content-first interface backed by a real Postgres database.

## Why it exists

Most bilingual blog starters either fake the backend (an in-memory array pretending to be a database) or bring an entire CMS's worth of complexity for a single-author site. OSBlog picks a narrower target:

- A single, real Postgres database (Neon) with a reviewed schema for categories, posts, comments, rate limits, and audit events — see [`src/server/schema.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/schema.ts).
- One admin identity via [Better Auth](https://better-auth.com), bootstrapped by the operator — there is no public sign-up, email verification, or password-reset flow.
- Anonymous, email-only comments that always start in a `pending` moderation state — never auto-published.
- A real Markdown editor with a slug, a cover image with mandatory per-language alt text, and per-language SEO title/description.
- Server-side rendering so published articles carry real HTML and metadata to crawlers, not just a client-side shell.

## Who this is for

- Developers who want a bilingual blog they fully own and can self-host, run on a VPS, or deploy to Vercel/Netlify.
- Anyone evaluating this repository as a reference for a Vite + React + TypeScript + Drizzle + Better Auth stack with a single shared server router across three runtimes.
- Contributors picking up follow-on work — see [Deployment](deployment.md) and [Backups and rollback](backups-and-rollback.md) for the remaining operational evidence gaps.

## What "open source" means here

The project is MIT-licensed (see [LICENSE](../LICENSE)) and the source is public at [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog). Anyone can read, fork, self-host, or contribute under the terms in [CONTRIBUTING.md](../CONTRIBUTING.md). There is no paid tier and no closed component.

## Honest status, as of 2026-09-05

The application code, admin editor, comment moderation, and SEO/SSR pipeline are implemented and covered by 64 passing unit/component/SQL integration tests plus 2 compiled-browser E2E tests. A real Neon Postgres database is provisioned, migrated, and seeded with bootstrapped admin access. A real Cap walkthrough is available in [Media](media.md). Vercel production is live on both requested hostnames and the dated route smoke passes. Each page in this documentation set states its own verified-vs-pending status near the top — if a page does not label something as done, treat it as pending. See [`work/SUPERVISOR_REPORT.md`](https://github.com/thuanlyt/osblog/blob/main/work/SUPERVISOR_REPORT.md) for the authoritative, continuously updated release-readiness snapshot.

Continue to [Getting started](getting-started.md).
