---
type: useagent-assignment
task_id: UA-0071
agent: codex
created_at: 2026-09-05T09:18:10Z
scope: ["work/evidence/slug-redirect-audit.md"]
---

# Assignment UA-0071: Audit slug history redirect strategy

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Produce a source-anchored design for preserving inbound links when published post slugs change, without modifying application code.

## Scope

- `work/evidence/slug-redirect-audit.md`

## Dependencies

- none

## Acceptance

- [ ] Inspect the current post schema, migrations, router, editor validation, SEO and tests; document the smallest backward-compatible redirect/history model, migration/backfill needs, collision and loop handling, status-code/canonical behavior, test matrix, and rollout/rollback risks; do not change application code or claim implementation.

## Verification

- `Evidence file contains source anchors, a concrete recommendation, open questions and a bounded follow-up task; python tools/useagent.py validate; git diff --check`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0071.md`

## Required report

Run `python tools/useagent.py task report UA-0071 --agent codex --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/codex/inbox/UA-0071.md`
