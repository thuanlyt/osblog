# Deployment

*Tiếng Việt: [docs/vi/deployment.md](vi/deployment.md)*

**Current status (2026-09-05): the Vercel production deployment is live and verified.** Deployment `dpl_8PzrSBYo5rsYzwfeqTXn2tDLzdjD` is linked to the provisioned Neon database and serves both requested hostnames. Netlify's adapter is implemented but has never been deployed; VPS remains a documented, unexercised target.

## What every target shares

```powershell
npm ci
npm run build
```

[`tools/build/build.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/build/build.ts) runs two Vite builds and produces two separate outputs:

- **`dist/client/`** — hashed, immutable static assets (JS, CSS, fonts). `index.html` is deliberately removed after the build, because there is no static entry page: every route is rendered by the server.
- **`dist/server/index.js`** — a single SSR bundle exporting the request router (`handle`) and a Node adapter (`nodeHandler`), with the client asset manifest baked in via `__OSBLOG_ASSETS__`.

**Why a static-only host is not enough:** every request — including the public home page and every `/api/*` call — is handled by the shared router in [`src/server/router.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/router.ts), which queries Postgres, checks Better Auth sessions, and renders HTML per request. A host that can only serve `dist/client/` as static files (no server runtime) cannot run that router, cannot reach the database, and has no `index.html` to fall back to. You need one of the three server targets below.

Neither `npm run build` nor any deployment step runs database migrations or seeds automatically — see [Getting started](getting-started.md) and [Backups and rollback](backups-and-rollback.md) for when to run those explicitly.

## Local production preview

```powershell
npm run build
npm start
```

`npm start` and `npm run preview` are the same command: [`tools/server/start.ts --production`](https://github.com/thuanlyt/osblog/blob/main/tools/server/start.ts). It serves `dist/client` assets directly and routes everything else through the real SSR router — including the database-backed API — on a plain Node `http` server bound to `127.0.0.1:5173` (override with `PORT`). This is a full local production run, not a client-only preview.

## VPS / standalone Node server

Run the same production command behind a process manager and a reverse proxy, since `npm start` only binds to loopback and does not terminate TLS.

```powershell
npm ci
npm run build
set NODE_ENV=production
npm start
```

Use a process manager so the server restarts on crash or reboot — for example `pm2 start npm --name osblog -- start` or a systemd unit that runs `npm start` with `NODE_ENV=production` and the rest of your `.env.production.local` values exported.

Example Nginx reverse proxy (adjust `server_name` and TLS certificate paths):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.example;

    ssl_certificate     /etc/letsencrypt/live/your-domain.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.example/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set `TRUST_PROXY=true` only in this configuration, so the server reads the real client IP from `X-Forwarded-For` set by your own Nginx — never enable it if the server is directly internet-facing, since anyone could spoof that header. Set `SITE_URL`/`BETTER_AUTH_URL` to `https://your-domain.example`. This path has been reviewed but not exercised against a live VPS in this repository — verify it end to end before relying on it.

## Vercel

[`vercel.json`](https://github.com/thuanlyt/osblog/blob/main/vercel.json) points every request at a single Node.js Function:

```json
{
  "regions": ["sin1"],
  "buildCommand": "npm run build",
  "outputDirectory": "dist/client",
  "functions": { "api/index.ts": { "includeFiles": "dist/server/**", "maxDuration": 30 } },
  "routes": [{ "handle": "filesystem" }, { "src": "/(.*)", "dest": "/api/index" }]
}
```

Vercel serves `dist/client`'s hashed static files directly when a request matches one (`handle: filesystem`), and otherwise forwards the request to [`api/index.ts`](https://github.com/thuanlyt/osblog/blob/main/api/index.ts), which re-exports the same `nodeHandler` built into `dist/server/index.js` (included via `includeFiles`). There is one function, one router, no per-route Vercel functions.

**What is real today:** the application is deployed to Vercel production with the configured Neon environment and the route smoke below is passing. A fresh deployment (with authorized credentials) can be created with:

```powershell
npx vercel          # preview deployment
npx vercel --prod   # production deployment
```

Set every server-only variable from [Configuration](configuration.md) in the Vercel project's environment settings before a production deploy — never in `vercel.json` or source. [`tools/server/configure-vercel.ts`](https://github.com/thuanlyt/osblog/blob/main/tools/server/configure-vercel.ts) is a one-time, operator-run helper that pushes generated secrets to a linked Vercel project and bootstraps the admin account against it; it expects a `.env.production.local` already pulled from Vercel (`vercel env pull`) and refuses to run without an existing `DATABASE_URL` in it. The current production environment was provisioned and bootstrapped by the operator; secret values are intentionally absent from this repository.

The intended domains are:

- Primary: [`https://osblog.thuanlyt.id.vn`](https://osblog.thuanlyt.id.vn) — **verified live 2026-09-05**. DNS/TLS and HTTP smoke passed.
- Secondary: [`https://osblog.vercel.app`](https://osblog.vercel.app) — **verified live 2026-09-05** as an alias to the same production deployment. HTML canonical URLs intentionally point to the primary domain.

Live route smoke for `dpl_8PzrSBYo5rsYzwfeqTXn2tDLzdjD` passed on both hostnames: `GET /api/healthz` returned `200` with `database=connected`; `/`, a seeded article, `/docs/editor?lang=vi`, `/sitemap.xml`, `/robots.txt`, `/media/osblog-cap-demo.gif`, and `/media/osblog-cap-demo.mp4` returned `200`; `/admin` returned `303` to `/admin/login`. This verifies the Vercel/Neon production path, not VPS or Netlify.

Provider linkage (the Vercel project existing, being linked to Neon) is a separate fact from an actual application deployment — do not read one as evidence of the other. Do not treat either URL as reachable until this page or `work/SUPERVISOR_REPORT.md` says otherwise with dated evidence.

## Netlify

[`netlify.toml`](https://github.com/thuanlyt/osblog/blob/main/netlify.toml) builds the same client/server output and wires a single Fetch-style function:

```toml
[build]
command = "npm run build"
publish = "dist/client"
functions = "netlify/functions"

[build.environment]
NODE_VERSION = "24"

[functions]
node_bundler = "esbuild"
included_files = ["dist/server/**"]

[[redirects]]
from = "/*"
to = "/.netlify/functions/osblog"
status = 200
```

[`netlify/functions/osblog.mts`](https://github.com/thuanlyt/osblog/blob/main/netlify/functions/osblog.mts) imports the same built router (`handle` from `dist/server/index.js`) and adapts it to Netlify's Fetch function signature. Every path falls through the catch-all redirect to that one function, matching the Vercel and VPS behavior. **This adapter has been implemented and builds, but no Netlify deployment has ever been attempted.** Implementing an adapter and verifying it against the live Netlify platform are two different claims — this page only makes the first one. If you deploy this yourself, set the same server-only environment variables in Netlify's own environment settings.

## Reconciliation checklist for the next release pass

1. Perform and record an actual Vercel deployment (preview, then production) with a dated `curl -I` or health-check result against the real URL.
2. Confirm the primary/secondary domain status and update this page and `work/SUPERVISOR_REPORT.md` together.
3. Exercise the VPS/Nginx path against a real host at least once and record the process-manager unit used.
4. If a Netlify deployment is authorized, record its result here instead of describing the adapter as untested.

Next: [Backups and rollback](backups-and-rollback.md).
