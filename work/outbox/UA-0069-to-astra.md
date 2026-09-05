---
type: useagent-assignment
task_id: UA-0069
agent: astra
created_at: 2026-09-05T09:17:35Z
scope: ["src/server/feed.ts", "src/server/router.ts", "tests/server/feed.test.ts", "docs/feeds.md", "docs/vi/feeds.md"]
---

# Assignment UA-0069: Add production RSS Atom feeds

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Expose bounded, escaped, bilingual RSS 2.0 and Atom feeds for published OSBlog posts with tests and user documentation.

## Scope

- `src/server/feed.ts`
- `src/server/router.ts`
- `tests/server/feed.test.ts`
- `docs/feeds.md`
- `docs/vi/feeds.md`

## Dependencies

- none

## Acceptance

- [ ] Add /feed.xml and /feed.atom endpoints using the existing SSR origin and published content query; support en/vi selection, deterministic ordering and a bounded item count; exclude drafts/archived posts; escape XML and safely render excerpts; include valid absolute links, updated timestamps, language metadata and cache headers; add focused tests for XML validity markers, escaping, language selection and exclusion; document usage in English and Vietnamese without exposing secrets.

## Verification

- `npm test -- --run src/server/feed.test.ts; npm run typecheck; npm run lint; npm run build; python tools/useagent.py validate; git diff --check`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0069.md`

## Required report

Run `python tools/useagent.py task report UA-0069 --agent astra --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/astra/inbox/UA-0069.md`
