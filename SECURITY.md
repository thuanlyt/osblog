# Security policy

## Project status

osblog is pre-production: the application, admin editor, and comment moderation are implemented and tested, and a real Neon Postgres database is provisioned and migrated, but no environment has been deployed live and there is no real end-user data yet. See [docs/index.md](docs/index.md) and [`work/SUPERVISOR_REPORT.md`](https://github.com/thuanlyt/osblog/blob/main/work/SUPERVISOR_REPORT.md) for the current release-gate status. Reports about the implemented security boundary (schema, validation, auth, comment abuse controls) are welcome now — see [docs/architecture.md](docs/architecture.md) and [docs/admin-and-comments.md](docs/admin-and-comments.md) for what that boundary actually is.

## Supported versions

There is no tagged release yet (see [CHANGELOG.md](CHANGELOG.md)). Until a first tagged release exists, only the `main` branch is supported for security fixes.

| Version | Supported |
|---|---|
| `main` (pre-release) | ✅ |

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.** Instead, use GitHub's private security advisory feature on the repository:

1. Go to [github.com/thuanlyt/osblog](https://github.com/thuanlyt/osblog).
2. Open the "Security" tab.
3. Choose "Report a vulnerability" to open a private draft security advisory.

Include: what you found, the affected file(s) or endpoint(s), reproduction steps, and the potential impact. Since this project has no live deployment yet, reports will concern the source code, schema/contract design, and locally reproducible behavior rather than a running public service.

## What to prioritize when reviewing this codebase

Given the documented architecture, contributions and reports are especially useful if they touch:

- Authentication and authorization boundaries (`src/server/auth*.ts`) — public sign-up must remain disabled, and every mutation must carry its own server-side role check.
- Input validation (`src/server/content-contract.ts`, `src/server/comment-contract.ts`) — especially anything that could bypass slug format rules, length limits, or the mandatory alt-text-when-thumbnail-present rule.
- Comment abuse controls (`src/server/comment-policy.ts`, `src/server/comments.ts`) — rate limiting, email hashing/encryption, and the moderation state machine described in [docs/admin-and-comments.md](docs/admin-and-comments.md). Note that Turnstile verification is not wired in yet (`TURNSTILE_SECRET_KEY` is accepted but unused) — reports that assume CAPTCHA protection is active should account for that.
- Secret handling — anything that could cause a server-only value (see [docs/configuration.md](docs/configuration.md)) to leak into a `VITE_`-prefixed, client-bundled, or logged value.

## No bug bounty

This project does not currently operate a paid bug bounty program.
