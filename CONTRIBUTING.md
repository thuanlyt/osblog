# Contributing to osblog

Thanks for considering a contribution to **osblog** ("open source blog"). This project is MIT-licensed and public at [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog).

## Before you start

Read [docs/index.md](docs/index.md) first, especially [docs/architecture.md](docs/architecture.md) and the "Current status" note at the top of whichever page covers the area you want to change. This project deliberately documents unfinished work as unfinished — check whether the feature you want to add is already tracked as a known gap in [CHANGELOG.md](CHANGELOG.md) before starting.

## Development setup

```powershell
git clone https://github.com/thuanlyt/osblog.git
cd osblog
npm ci
Copy-Item .env.example .env.local
```

Set at least `DATABASE_URL`, `BETTER_AUTH_SECRET`, `COMMENT_EMAIL_ENCRYPTION_KEY`, and `ADMIN_EMAIL` in `.env.local` (see [docs/configuration.md](docs/configuration.md)), then run migrate/bootstrap/seed and start the dev server — full walkthrough: [docs/getting-started.md](docs/getting-started.md). The dev server starts without a configured database, but content, admin, and comment routes fail closed with a "temporarily unavailable" response rather than a crash until `DATABASE_URL` and related variables are set. The unit/component test suite does not need a real Postgres target; SQL integration tests use an embedded [pglite](https://github.com/electric-sql/pglite) instance.

## Before opening a pull request

Run the full local verification gate and make sure it passes:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --audit-level=high
```

## Code and documentation conventions

- **Don't invent commands or claims.** If a feature isn't implemented, say so explicitly rather than describing intended behavior as if it already works — this repository's documentation style depends on that distinction.
- **Bilingual by default.** Product-facing schema fields, UI copy, and documentation carry both Vietnamese and English content side by side (see the `*Vi`/`*En` field pairs in `src/server/schema.ts`). If you add a new documentation page under `docs/`, add its Vietnamese counterpart under `docs/vi/` in the same pull request, and cross-link both directions.
- **No fabricated media.** Do not add an image, GIF, or video reference to any Markdown file unless the referenced file is committed in the same pull request. See [docs/media.md](docs/media.md).
- **Server-only code stays server-only.** Anything in `src/server/` must never be imported by client-bundled code; only `VITE_`-prefixed environment variables may reach the browser. See [docs/configuration.md](docs/configuration.md).
- **Validate everything server-side.** UI validation is a convenience, not the authority — see the Zod schemas in `src/server/content-contract.ts` and `src/server/comment-contract.ts` for the pattern to follow.
- **Small, focused pull requests.** Prefer one coherent change per pull request over a bundle of unrelated edits.

## Reporting bugs and requesting features

Open an issue on [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog). Include reproduction steps, the command output you saw, and which documented behavior (if any) it contradicts.

## Reporting security issues

Do not open a public issue for a security vulnerability. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the project's [MIT License](LICENSE).
