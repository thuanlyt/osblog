---
type: useagent-assignment
task_id: UA-0002
agent: supervisor
created_at: 2026-09-04T19:36:11Z
scope: ["work"]
---

# Assignment UA-0002: Record supervisor bootstrap handover

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Bring the canonical supervisor report and completion evidence into the scoped lifecycle record after the bootstrap scope correction.

## Scope

- `work`

## Dependencies

- none

## Acceptance

- [ ] Canonical supervisor report states bootstrap health, roster, blockers, evidence, and exactly one next action.
- [ ] Completion and report indexes contain the bootstrap handover path.

## Verification

- `python tools/useagent.py validate`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0002.md`

## Required report

Run `python tools/useagent.py task report UA-0002 --agent supervisor --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/supervisor/inbox/UA-0002.md`
