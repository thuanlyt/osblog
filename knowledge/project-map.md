# Project map

freshness: verified
verified_on: 2026-09-05
owner: supervisor

## Current runtime — supersedes the archived scaffold map below

OSBlog has a real Vite/React SSR application, SQL-backed admin/comments and co-located bilingual docs. UA-0048 findings were fixed by UA-0052/UA-0056; UA-0058 found no new application P0/P1/P2 issue, and the current Vercel/Neon production path is live with route smoke verified. Independent Astra re-review was unavailable after the account usage limit; the supervisor retains that limitation in the release report.

| Scope | Source anchors |
| --- | --- |
| Browser UI/editor | `src/app/App.tsx`, `src/app/admin/AdminPostEditorPage.tsx`, `src/main.tsx`, `src/styles.css` |
| SSR/API | `src/entry-server.tsx:createApp`, `src/server/router.ts:createRouter`, `src/server/pages.ts:loadPage` |
| SQL/auth | `src/server/db.ts`, `schema.ts`, `auth.ts`, `provision.ts`, `drizzle/*.sql` |
| Embedded docs | `docs/`, `src/server/docs.ts`, `src/app/pages/DocsPage.tsx` |
| Build/adapters | `tools/build/build.ts`, `tools/server/start.ts`, `api/index.ts`, `vercel.json`, `netlify/functions/osblog.mts`, `netlify.toml` |
| Assets | `public/assets/`: original editorial SVGs; local font packages |
| Verification | `tests/server/`, `src/app/*.test.tsx`, `tests/browser/`, `tests/useagent-conformance/replay.py` |

The GitHub-linked Vercel production deployment on `main` is READY and live on both requested hostnames; health and route smoke confirmed Neon connectivity and SSR/media outputs. A genuine Cap walkthrough is tracked under `public/media/`, and local unit/browser/build gates pass. Netlify is an implemented adapter, not a verified deployment; rollback/restore drills remain open. Consult the live registry for writer ownership. Secrets, draft and raw test recordings stay ignored.

## Archived scaffold map (historical only)

The following was recorded before runtime recovery and must not be used as current behavior:

```text
AGENTS.md                    repository rules
knowledge/                   source-anchored project ledger
work/                        registry, mailboxes, reports, evidence, checkpoints
tools/useagent.py            local UseAgent CLI copied from the control-plane source
.agents/skills/              UseAgent skills required by the validator
docs/                        user-facing, operational, and release documentation
design-system/osblog/        persisted UI/UX Pro Max Master design system
tests/useagent-conformance/  bounded control-plane replay fixture
docs/architecture.md         reviewed app/data/auth/SEO/rollback proposal
package.json                 verified client scripts and dependency boundary
src/                         Vite/React route shell, placeholders, tests, styles, and SSR boundary
public/                      public asset root (currently empty by design)
api/                         Vercel-compatible health, auth, and post read/admin CRUD endpoints
tests/                       unit and boundary tests; integration/accessibility/security release suites remain pending
```

Ownership is assigned by work item. No two active writers may claim the same subtree.

Freshness: `verified` on 2026-09-05 by supervisor after UA-0046, UA-0052, UA-0053, UA-0056, UA-0057, UA-0059 and UA-0061 review. Client routes, post API/auth/comments boundaries, token flow, SSR metadata, crawl handlers, admin publish/moderation browser flow, media capture, lifecycle validation, Vercel/Neon production deployment and live route smoke are verified; Netlify/VPS provider execution and backup/rollback drills remain unverified.
