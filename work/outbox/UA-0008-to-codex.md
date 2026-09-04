---
type: useagent-assignment
task_id: UA-0008
agent: codex
created_at: 2026-09-04T19:47:25Z
scope: ["design-system", "docs/ui-design.md"]
---

# Assignment UA-0008: Fix UI hover contrast regression

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Resolve the reviewed P1 contrast failure in the persisted osblog design system without weakening its accessibility contract.

## Scope

- `design-system`
- `docs/ui-design.md`

## Dependencies

- none

## Acceptance

- [ ] The primary button hover foreground/background pair meets at least 4.5:1 for normal text, or the hover treatment uses a passing semantic token.
- [ ] MASTER.md, ui-design.md, and recorded contrast verification agree; no normal-text pink-on-white pairing is introduced.
- [ ] The worker report includes the exact contrast command/result and does not modify application source.

## Verification

- `node contrast verification for default and hover button pairs`
- `python tools/useagent.py validate`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0008.md`

## Required report

Run `python tools/useagent.py task report UA-0008 --agent codex --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/codex/inbox/UA-0008.md`
