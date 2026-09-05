# osblog

*Tiếng Việt: [README.vi.md](README.vi.md)*

**osblog** ("open source blog") is an open-source, MIT-licensed, bilingual (Vietnamese/English) Markdown publishing app built with Vite, React 19, TypeScript, PostgreSQL (Neon) via Drizzle ORM, and Better Auth. One operator writes and publishes bilingual articles from a real admin editor; readers get server-rendered pages and can leave moderated, email-only comments without an account.

- **Documentation:** the same Markdown files that ship in this repository are also served live at `/docs` and `/docs/<slug>` (add `?lang=vi` for Vietnamese) — see [Documentation map](#documentation-map) below.
- **Source:** [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog) — public, MIT-licensed.
- **License:** [MIT](LICENSE).

## Status snapshot (2026-09-05)

| Area | State |
|---|---|
| Application code | Admin editor, public site, comments, SEO, and both deployment adapters (Vercel, Netlify) are implemented and reviewed. |
| Automated tests | 64 unit/component/SQL integration tests pass; 2 compiled-browser E2E tests pass; lint and typecheck pass. |
| Database | A real Neon Free Postgres project (`osblog-db`, Singapore region) is provisioned. Migrations `0000`–`0003` have run and replay is idempotent; the admin account is bootstrapped; three bilingual introduction posts are seeded. |
| Local production build | `npm run build` + `npm start` serves real article data and hashed assets over HTTP 200 on `127.0.0.1`. |
| Live deployment | **Live on Vercel.** `https://osblog.thuanlyt.id.vn` is primary and `https://osblog.vercel.app` is the secondary alias for production deployment `dpl_8PzrSBYo5rsYzwfeqTXn2tDLzdjD`; both passed live route smoke, including Neon health, SSR pages, sitemap, robots, admin redirect, GIF and MP4. Netlify has an implemented adapter but no deployment has been attempted. |
| Browser/E2E QA and media | The compiled-browser gate passes the real publishing/comment/moderation and responsive-docs flows; a genuine Cap walkthrough is available in [Media](docs/media.md). |

Treat every claim above as current only as of the date shown; see [`work/SUPERVISOR_REPORT.md`](https://github.com/thuanlyt/osblog/blob/main/work/SUPERVISOR_REPORT.md) for the live release-gate record.

## Screenshots and media

The repository includes a genuine [Cap walkthrough GIF](https://raw.githubusercontent.com/thuanlyt/osblog/main/public/media/osblog-cap-demo.gif) and [MP4](https://github.com/thuanlyt/osblog/blob/main/public/media/osblog-cap-demo.mp4) showing the public site, co-located docs, and a published article. See [docs/media.md](docs/media.md) for provenance and capture rules.

## Capabilities

- **Bilingual content model.** Every post carries English and Vietnamese title, excerpt, body, cover alt text, and SEO fields side by side — there is no separate draft per language.
- **Real admin editor** at `/admin` (Better Auth session required): a Markdown toolbar, edit/preview/split view, per-language tabs, slug auto-derived from the English title, cover image URL + mandatory alt text, per-language SEO title/description, status and publish date, unsaved-draft recovery from `localStorage`, and an optimistic-concurrency conflict prompt when a post changed since it was loaded.
- **Anonymous, moderated comments.** Readers submit an email and a message only — no account. Every comment starts `pending`, protected by a signed, time-boxed form token, a honeypot field, and durable database-backed rate limits keyed by hashed IP and hashed email. Commenter email is encrypted at rest and never returned to public clients.
- **Recoverable deletes for content, permanent for comments.** Deleting a post or category archives it (recoverable); deleting a comment is a real, permanent delete.
- **Server-rendered public site** with sitemap, robots, and per-post SEO metadata, built on a single shared request router so the same logic runs on Vercel, Netlify, or a plain Node server.
- **Source-embedded documentation.** This documentation set ships inside the built app and is served at `/docs`.

## Quickstart

Requirements: Node.js 20+, npm, and a Postgres connection string (a free [Neon](https://neon.tech) project works well).

```powershell
git clone https://github.com/thuanlyt/osblog.git
cd osblog
npm ci
Copy-Item .env.example .env.local
```

Fill in `.env.local` with your own `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ random characters), `COMMENT_EMAIL_ENCRYPTION_KEY` (32 random bytes, base64-encoded), and `ADMIN_EMAIL`. See [Configuration](docs/configuration.md) for every variable.

```powershell
npm run db:migrate
$env:OSBLOG_ADMIN_PASSWORD = "choose-a-strong-12-plus-character-password"
npm run db:bootstrap
Remove-Item Env:\OSBLOG_ADMIN_PASSWORD
npm run db:seed   # optional: adds three published bilingual intro posts
npm run dev
```

Open `http://localhost:5173`. Sign in at `/admin/login` with `ADMIN_EMAIL` and the password you bootstrapped with. Full walkthrough: [docs/getting-started.md](docs/getting-started.md).

## Verification

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

As of 2026-09-05 these pass locally: 64 unit/component/SQL integration tests, 2 compiled-browser E2E tests, lint, typecheck, and the production build. The E2E gate uses an installed Chromium executable when the latest Playwright-managed browser is unavailable; see [docs/getting-started.md](docs/getting-started.md).

## Architecture, in brief

```text
Browser
  └─ React UI (src/app) ── hydrates the SSR HTML
        │
        v
Shared request router (src/server/router.ts)
  ├─ served by tools/server/start.ts in development (Vite middleware + Node HTTP)
  ├─ served by api/index.ts on Vercel (dist/server bundled into one function)
  ├─ served by netlify/functions/osblog.mts on Netlify (one Fetch function)
  └─ served by npm start on a plain Node/VPS host
        │
        v
Postgres (Neon) via Drizzle ORM ── Better Auth session store
```

One router, one build output (`dist/client` static assets + `dist/server/index.js` SSR bundle), three thin adapters. See [docs/architecture.md](docs/architecture.md) for the full technical record.

## Documentation map

- [Introduction](docs/introduction.md) — what osblog is and who it's for.
- [Getting started](docs/getting-started.md) — install, configure, run, verify.
- [Markdown editor](docs/editor.md) — the real admin editor: toolbar, preview modes, slug, cover, SEO, draft/publish.
- [Configuration](docs/configuration.md) — every environment variable and what reads it.
- [Admin and comments](docs/admin-and-comments.md) — sign-in boundary, content CRUD, comment moderation.
- [Deployment](docs/deployment.md) — local, VPS/Nginx, Vercel, and Netlify, with real commands and what's actually verified.
- [Backups and rollback](docs/backups-and-rollback.md) — migration history, backup expectations, and rollback procedure.
- [Architecture](docs/architecture.md) — full technical decision record.
- [Media](docs/media.md) — verified Cap walkthrough GIF/MP4 and capture provenance.
- [CHANGELOG](CHANGELOG.md) · [CONTRIBUTING](CONTRIBUTING.md) · [SECURITY](SECURITY.md)

Vietnamese versions live under [docs/vi/](docs/vi/index.md) and are also served at `/docs?lang=vi`.

## Support

Open an issue or pull request at [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog). See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [SECURITY.md](SECURITY.md) to report a vulnerability privately.

## License

MIT — see [LICENSE](LICENSE).
