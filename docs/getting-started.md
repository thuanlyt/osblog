# Getting started

*Tiếng Việt: [docs/vi/getting-started.md](vi/getting-started.md)*

**Current status:** every command on this page is a real script in [`package.json`](https://github.com/thuanlyt/osblog/blob/main/package.json). Following it end to end gives you a working blog with a real admin account and a real database — this is not a client-only preview.

## Requirements

- Node.js 20+ and npm.
- A Postgres connection string. A free [Neon](https://neon.tech) project works well; any Postgres 14+ works.

## Clone and install

```powershell
git clone https://github.com/thuanlyt/osblog.git
cd osblog
npm ci
```

## Configure environment variables

Copy the template and fill in your own values. Never commit `.env.local` or any file containing real secrets — `.gitignore` excludes `.env` and `.env.*` except the tracked `.env.example` template.

```powershell
Copy-Item .env.example .env.local
```

On macOS/Linux:

```bash
cp .env.example .env.local
```

At minimum, set `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ characters), `COMMENT_EMAIL_ENCRYPTION_KEY` (32 random bytes, base64), and `ADMIN_EMAIL`. See [Configuration](configuration.md) for what every variable does.

## Set up the database

These are the real scripts in [`tools/server/database.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/database.ts), run through npm:

```powershell
npm run db:migrate
```

Applies every SQL file under [`drizzle/`](https://github.com/thuanlyt/osblog/blob/main/drizzle/) in order, tracked in an `osblog_migration` table with a checksum guard — re-running it is safe and idempotent, and it fails loudly if an already-applied migration file changed. `db:migrate` reads `NODE_ENV`, or pass `--mode=production` explicitly to load `.env.production.local` instead of `.env.local`.

```powershell
$env:OSBLOG_ADMIN_PASSWORD = "choose-a-strong-12-plus-character-password"
npm run db:bootstrap
Remove-Item Env:\OSBLOG_ADMIN_PASSWORD
```

Creates the single admin account for the email in `ADMIN_EMAIL`, using the password from the `OSBLOG_ADMIN_PASSWORD` environment variable (12–128 characters). This is an operator-only command, not a web endpoint — it never overwrites an existing admin, so it is safe to run again after a failed attempt. Clear the environment variable immediately after running it.

```powershell
npm run db:seed
```

Optional and idempotent: adds three published, bilingual introduction posts under an "Open source" category, using `onConflictDoNothing` so re-running it never duplicates content or overwrites edits.

## Run the dev server

```powershell
npm run dev
```

This runs [`tools/server/start.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts): a Vite dev server in middleware mode in front of the real Node SSR router, listening on `http://localhost:5173`. Every route — home, categories, articles, `/docs`, `/about`, `/admin`, comments, and the API — runs against your configured database, not a mock.

Sign in at `http://localhost:5173/admin/login` with `ADMIN_EMAIL` and the password you bootstrapped with.

## Verification commands

Run these from the repository root before considering a change complete:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

- `npm run lint` — ESLint over the TypeScript/React source.
- `npm run typecheck` — `tsc -b` project-wide type checking.
- `npm test` — Vitest unit, component, and SQL integration tests (see [`tests/server/`](https://github.com/thuanlyt/osblog/blob/main/tests/server/)).
- `npm run build` — the production Vite build (see [Deployment](deployment.md) for what it produces).

A Playwright browser suite (`npm run test:e2e`, see [`tests/browser/`](https://github.com/thuanlyt/osblog/tree/main/tests/browser/)) is part of the local release gate. It currently covers the real publish/comment/moderation workflow, compiled SSR, responsive docs, keyboard navigation, and Axe checks. If the exact Playwright-managed Chromium revision is unavailable, set `OSBLOG_TEST_BROWSER` to an installed Chromium executable before running the suite.

## Preview a production build locally

```powershell
npm run build
npm run preview
```

`npm run build` produces `dist/client` (hashed static assets, no `index.html`) and `dist/server/index.js` (the SSR bundle). `npm run preview` is identical to `npm start`: it runs [`tools/server/start.ts --production`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts), a real Node HTTP server bound to `127.0.0.1` that serves the built client assets and the full SSR router — including the database-backed API — on the same port. See [Deployment](deployment.md) for why this needs a reverse proxy on a VPS, and how the same build is packaged for Vercel and Netlify.

Next: [Markdown editor](editor.md) or [Deployment](deployment.md).
