---
type: useagent-assignment
task_id: UA-0073
agent: astra
created_at: 2026-09-05T09:54:18Z
scope: ["drizzle/0004_post_slug_history.sql", "src/server/schema.ts", "src/server/content.ts", "src/server/router.ts", "src/server/provision.ts", "src/app/admin/AdminPostEditorPage.tsx", "tests/server/content.test.ts", "tests/server/runtime.integration.test.ts", "tests/server/seo.test.ts", "src/app/admin/AdminPostEditorPage.test.tsx", "tests/browser/publishing.spec.ts", "knowledge/architecture.md", "docs/architecture.md", "docs/vi/architecture.md"]
---

# Assignment UA-0073: Implement permanent published-slug registry and redirects

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Preserve inbound links when published post slugs change with an additive, collision-safe registry and one-hop HTML/API redirects; do not deploy or apply the migration to production in this implementation task.

## Scope

- `drizzle/0004_post_slug_history.sql`
- `src/server/schema.ts`
- `src/server/content.ts`
- `src/server/router.ts`
- `src/server/provision.ts`
- `src/app/admin/AdminPostEditorPage.tsx`
- `tests/server/content.test.ts`
- `tests/server/runtime.integration.test.ts`
- `tests/server/seo.test.ts`
- `src/app/admin/AdminPostEditorPage.test.tsx`
- `tests/browser/publishing.spec.ts`
- `knowledge/architecture.md`
- `docs/architecture.md`
- `docs/vi/architecture.md`

## Dependencies

UA-0071, UA-0072

## Acceptance

- [ ] Add an additive migration and application contract for ever-published slug ownership, deterministic audit backfill with fail-closed ambiguous conflicts, and direct one-hop 308 redirects for visible historical HTML/API URLs; hidden content remains 404; current canonical/hreflang/OG/JSON-LD/sitemap use only the current slug; editor warns on published slug change and preserves unsaved content on 409; seed remains idempotent; focused and broad verification pass; no production deploy or migration apply.

## Verification

- `Run the focused schema/content/runtime/SEO/editor/browser matrix from the slug audit, then npm run typecheck, npm run lint, npm run build, python tools/useagent.py validate and git diff --check; report any provider preflight or migration blocker explicitly.`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0073.md`

## Required report

Run `python tools/useagent.py task report UA-0073 --agent astra --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/astra/inbox/UA-0073.md`
