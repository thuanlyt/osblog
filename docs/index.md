# OSBlog documentation

*Tiếng Việt: [docs/vi/index.md](vi/index.md)*

OSBlog ("open source blog") is a bilingual (Vietnamese/English) Markdown publishing app built with Vite, React, TypeScript, Neon Postgres/Drizzle, and Better Auth. This documentation set is co-located with the application source and is also served live: the same files are read at build time and exposed at `/docs` (index) and `/docs/<slug>` (`?lang=vi` for the Vietnamese variant), via [`src/server/docs.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/docs.ts) and rendered by [`src/app/pages/DocsPage.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/pages/DocsPage.tsx). A page may set `title`, `description`, and `order` in a `---` frontmatter block; otherwise the title falls back to the first `# heading` and the description to the first paragraph.

**Status label:** each page states its own verified-vs-pending status near the top. As of 2026-09-05 the application code, admin editor, comment moderation, and both deployment adapters are implemented; 64 unit/component/SQL integration tests and 2 compiled-browser E2E tests pass locally; a real Neon database is provisioned and migrated; and Vercel production is live on both requested hostnames with route smoke passing. See [`work/SUPERVISOR_REPORT.md`](https://github.com/thuanlyt/osblog/blob/main/work/SUPERVISOR_REPORT.md) for the continuously updated release-gate snapshot and remaining operational gaps.

## Product documentation

| Page | Covers |
|---|---|
| [Introduction](introduction.md) | What OSBlog is, who it is for, and why it exists |
| [Getting started](getting-started.md) | Local install, environment setup, migrate/bootstrap/seed, running the dev server |
| [Markdown editor](editor.md) | The real admin editor: toolbar, edit/preview/split view, slug, cover image + alt, SEO fields, draft/publish |
| [Configuration](configuration.md) | Every environment variable, what reads it, and which ones are secret |
| [Admin and comments](admin-and-comments.md) | Admin sign-in boundary, category/post CRUD, anonymous comment moderation |
| [Deployment](deployment.md) | Local, VPS + Nginx, Vercel, and Netlify — with real commands and what's actually verified |
| [Backups and rollback](backups-and-rollback.md) | Migration history, database backup expectations, and rollback procedure |
| [Media](media.md) | Verified Cap walkthrough GIF/MP4 and capture provenance |

## Reference and engineering documentation

These documents predate this doc set and are maintained by other work items; they are linked here for discoverability, not duplicated:

- [Architecture](architecture.md) — stack decision, routes, entities, auth/CRUD/comment flows, SEO, environment variables, migration and rollback boundaries.
- [UI design system](ui-design.md) — the persisted visual/accessibility source of truth.
- [Operations](operations.md) and [Autopilot](autopilot.md) — control-plane run/QA conventions for the UseAgent workflow used to build this repository. These describe the project's internal build process, not the blog product itself.
- [Conformance](conformance.md) — the replayable UseAgent lifecycle fixture.

## Vietnamese translations

Each product page has a Vietnamese counterpart under [`docs/vi/`](vi/index.md), also served live at `/docs/<slug>?lang=vi`:

- [Giới thiệu](vi/introduction.md)
- [Bắt đầu](vi/getting-started.md)
- [Trình soạn thảo Markdown](vi/editor.md)
- [Cấu hình](vi/configuration.md)
- [Quản trị và bình luận](vi/admin-and-comments.md)
- [Triển khai](vi/deployment.md)
- [Sao lưu và khôi phục](vi/backups-and-rollback.md)
- [Kiến trúc (tóm tắt)](vi/architecture.md)
- [Media](vi/media.md)

## Reporting issues

Use the GitHub repository [thuanlyt/osblog](https://github.com/thuanlyt/osblog) to file issues or pull requests. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the contribution workflow and [SECURITY.md](../SECURITY.md) for vulnerability reports.
