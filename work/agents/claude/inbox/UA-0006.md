---
type: useagent-assignment
task_id: UA-0006
agent: claude
created_at: 2026-09-04T19:37:27Z
scope: ["docs/conformance.md", "knowledge/decisions/0004-conformance.md", "tests/useagent-conformance"]
---

# Assignment UA-0006: Define UseAgent conformance and replay evidence plan

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Specify a small reproducible fixture and evidence capture plan that exercises context, DAG, dispatch, worker pull, report/COMPLETED, review, QA, and checkpoint without claiming unavailable vendor runtimes are live.

## Scope

- `docs/conformance.md`
- `knowledge/decisions/0004-conformance.md`
- `tests/useagent-conformance`

## Dependencies

UA-0001

## Acceptance

- [ ] The plan names concrete CLI commands and expected artifacts for the end-to-end UseAgent lifecycle.
- [ ] Replay/simulation labeling is explicit and no live Antigravity/Claude activity is fabricated.
- [ ] The fixture scope does not overlap application source, architecture, or design-system work.

## Verification

- `python tools/useagent.py validate`
- `A documented replay command can be run from a clean target checkout`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0006.md`

## Required report

Run `python tools/useagent.py task report UA-0006 --agent claude --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/claude/inbox/UA-0006.md`
