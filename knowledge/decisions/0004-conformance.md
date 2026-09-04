# Decision 0004: Replayable UseAgent conformance evidence

## Decision

Keep the original Claude-preferred conformance work identity and mailbox history
(`UA-0006`) even when Claude is unavailable. A Codex fallback may be used only
with explicit attribution. If that runtime fails, a supervisor-local fixture may
exercise the real CLI in an isolated temporary root, with output labeled
`supervisor-local-replay` and `simulation=true`.

## Source anchors

- `docs/conformance.md:What it proves` — lifecycle sequence and attribution rule.
- `tests/useagent-conformance/replay.py:main` — isolated root, CLI commands,
  report/review/checkpoint assertions, and cleanup.
- `work/registry.json:UA-0006` and `work/registry.json:UA-0015` — preserved
  original manual assignment and failed Codex fallback evidence.

## Invariants

- The target registry is never used by the replay fixture.
- The fixture uses the real CLI, but replayed worker activity is not live vendor
  execution and must never be reported as such.
- A report is not completion: the explicit review evidence and
  `needs_review → done` gate remain mandatory.
- The fixture is bounded, cleans up its temporary root, and does not deploy,
  mutate secrets, or call external services.

## Verification

```powershell
python tests/useagent-conformance/replay.py
python tools/useagent.py validate
```

Expected replay output contains `REPLAY_PASS`, a done fixture task with report
and review evidence, and a complete checkpoint. Current product QA remains
pending until the Vite application exists.

## Freshness and known gap

freshness: verified
verified_on: 2026-09-05
owner: supervisor

The fixture proves the control-plane lifecycle, not application behavior. A
future release task should add this command to CI and attach a genuine screen
recording only if one is actually captured.
