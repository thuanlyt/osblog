# Configuration

*Tiếng Việt: [docs/vi/configuration.md](vi/configuration.md)*

**Current status:** the variables below are the real set read by [`src/server/env.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/env.ts), [`tools/server/database.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/database.ts), and [`tools/server/configure-vercel.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/configure-vercel.ts), matching [`.env.example`](https://github.com/thuanlyt/osblog/blob/main/.env.example). This page does not invent any variable not already present in source.

## Rule: `VITE_`-prefixed values are public, everything else is server-only

Vite exposes any variable prefixed `VITE_` to the browser bundle at build time. Every other variable is read only on the server (`src/server/`, `tools/server/`, and the deployment adapters under `api/` / `netlify/functions/`). Never put a database URL, secret, or credential behind a `VITE_` name.

## Variables

| Variable | Required in production? | Purpose |
|---|---|---|
| `NODE_ENV` | — | `development`, `test`, or `production`; defaults to `development`. |
| `DATABASE_URL` | **yes** | Pooled Postgres connection string used for runtime queries (Neon's pooled connection string works directly). |
| `DATABASE_URL_MIGRATIONS` | no (operator use) | A direct, non-pooled connection used only when running `npm run db:migrate` or `npm run db:bootstrap`/`db:seed`; falls back to `DATABASE_URL` when unset. Never bundled into client code or a serverless request path. When pulling environment variables from a Vercel project linked to Neon's integration, [`tools/server/configure-vercel.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/configure-vercel.ts) additionally accepts Neon's own `DATABASE_URL_UNPOOLED` as a fallback source for this value — that variable is not read directly by the application at runtime. |
| `BETTER_AUTH_SECRET` | **yes** | Session signing secret for Better Auth; also used to sign comment form tokens and to hash IP/email values for rate limiting. Must be at least 32 characters. Rotating it invalidates existing sessions. |
| `BETTER_AUTH_URL` | **yes** | The trusted, canonical origin Better Auth issues sessions for. |
| `SITE_URL` | no | Server-side canonical origin, preferred over `BETTER_AUTH_URL`/`VITE_SITE_URL` when the server resolves its own origin for SEO, sitemap, and absolute-URL purposes. Must be `http(s)://`; production requires `https://`. |
| `VITE_SITE_URL` | no | Public, browser-safe origin exposed to the client bundle; used as a legacy/fallback source for the site origin. |
| `ADMIN_EMAIL` | no (required to bootstrap) | The single allow-listed operator account email. Not a public registration field — see [Admin and comments](admin-and-comments.md). |
| `COMMENT_EMAIL_ENCRYPTION_KEY` | **yes** | Exactly 32 random bytes, base64-encoded, used with AES-256-GCM to encrypt commenter email addresses at rest. See [`src/server/comment-policy.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/comment-policy.ts). |
| `TURNSTILE_SECRET_KEY` | no | Accepted by the environment schema but **currently unused by the application code.** Setting it has no effect yet — do not advertise CAPTCHA/Turnstile protection until it is wired into the comment path. |
| `TRUST_PROXY` | no | `true` or `false` (default `false`). When `true`, the server trusts the `X-Forwarded-For` header for the client IP — only enable this behind a reverse proxy you control (see the VPS/Nginx section of [Deployment](deployment.md)). On Vercel the platform-owned `x-vercel-forwarded-for` header is used automatically regardless of this flag. |
| `OSBLOG_ADMIN_PASSWORD` | operator use only | Read only by `npm run db:bootstrap`; never stored, never a request parameter. Must be 12–128 characters. Unset it from your shell after bootstrapping. |
| `PORT` | no | Port for `tools/server/start.ts` in development/preview; defaults to `5173`. |

`readServerEnv()` fails closed: when `NODE_ENV=production`, a missing `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAIL`, or `COMMENT_EMAIL_ENCRYPTION_KEY` throws a `ServerConfigError` instead of falling back to a development default. `requireDatabaseUrl()` throws rather than ever using an in-memory substitute — there is no fake data path in production.

## What is intentionally not implemented

There is no public sign-up, email verification, or password-reset flow — the bootstrap operator model in [Admin and comments](admin-and-comments.md) is the entire account system by design. Do not configure or advertise an outbound-email provider for account recovery; none exists.

## Local setup

```powershell
Copy-Item .env.example .env.local
```

Fill in the values described above, then follow [Getting started](getting-started.md) to migrate, bootstrap, and seed.

## Secrets hygiene

- `.gitignore` excludes `.env` and `.env.*` except the tracked `.env.example` template — never commit a real `.env.local` or `.env.production.local`.
- Never read or quote `.env.production.local`, `draft/admin-access.json`, or any other locally generated credential file in documentation, issues, or pull requests.
- Use separate databases for preview/development and production. Running migrations or seeds against a shared database from multiple environments risks clobbering real content.
- Vercel/Netlify/VPS environment variables should be set through each platform's own secret store, not committed anywhere in this repository.

Next: [Admin and comments](admin-and-comments.md) or [Deployment](deployment.md).
