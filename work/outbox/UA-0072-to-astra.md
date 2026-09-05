---
type: useagent-assignment
task_id: UA-0072
agent: astra
created_at: 2026-09-05T09:31:29Z
scope: ["src/server/feed.ts", "src/server/seo.ts", "tests/server/feed.test.ts", "tests/server/seo.test.ts", "docs/feeds.md", "docs/vi/feeds.md"]
---

# Assignment UA-0072: Harden feed text encoding and discovery

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Correct RSS plain-text excerpt encoding and add standard HTML feed discovery links before the feed release gate.

## Scope

- `src/server/feed.ts`
- `src/server/seo.ts`
- `tests/server/feed.test.ts`
- `tests/server/seo.test.ts`
- `docs/feeds.md`
- `docs/vi/feeds.md`

## Dependencies

- none

## Acceptance

- [ ] Encode RSS and Atom text exactly once at the XML boundary so parsed feed text equals the selected plain excerpt without entity artifacts; keep markup inert; add RSS/Atom discovery link tags to public SSR head with correct absolute language-aware URLs; add focused regression tests for exact text and discovery; preserve no-store/private route behavior and existing cache validators; update bilingual feed docs if behavior changes.

## Verification

- `npm test -- --run tests/server/feed.test.ts tests/server/seo.test.ts; npm run typecheck; npm run lint; npm run build; python tools/useagent.py validate; git diff --check`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0072.md`

## Required report

Run `python tools/useagent.py task report UA-0072 --agent astra --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/astra/inbox/UA-0072.md`
