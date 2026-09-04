---
type: useagent-assignment
task_id: UA-0015
agent: codex
created_at: 2026-09-04T20:07:12Z
scope: ["docs/conformance.md", "knowledge/decisions/0004-conformance.md", "tests/useagent-conformance"]
---

# Assignment UA-0015: Fallback: build UseAgent conformance and replay fixture via Codex

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Execute the original Claude-preferred UseAgent usability/conformance scope with the internal Codex runtime because Claude is unavailable. Create a small reproducible fixture that exercises the real control-plane lifecycle without claiming simulated activity is live vendor execution.

## Scope

- `docs/conformance.md`
- `knowledge/decisions/0004-conformance.md`
- `tests/useagent-conformance`

## Dependencies

- none

## Acceptance

- [ ] The fixture exercises context, DAG/task creation, dispatch, worker pull/claim, report/COMPLETED, review, QA/validation, and checkpoint artifacts using the real CLI.
- [ ] The fixture is bounded, reproducible from a clean target checkout, and labels replay/simulation versus real Codex execution explicitly.
- [ ] The conformance decision preserves Claude as preferred when callable and labels this item Codex fallback; no application code or external deployment is changed.

## Verification

- `A documented PowerShell/Python replay command completes with expected registry/report/checkpoint evidence`
- `python tools/useagent.py validate`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0015.md`

## Required report

Run `python tools/useagent.py task report UA-0015 --agent codex --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/codex/inbox/UA-0015.md`
