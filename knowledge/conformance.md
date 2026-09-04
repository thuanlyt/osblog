# Conformance module card

freshness: verified
verified_on: 2026-09-05
owner: supervisor

## Responsibility

`tests/useagent-conformance/replay.py` proves the UseAgent control-plane lifecycle in an isolated temporary root. `docs/conformance.md` defines the bilingual procedure, artifact expectations, attribution, and product-QA boundary. This card does not test osblog application behavior.

## Entry points

- `tests/useagent-conformance/replay.py:main` — copies local control-plane inputs, initializes an isolated root, runs real CLI commands, asserts task/report/review/checkpoint artifacts, and cleans up.
- `docs/conformance.md:What it proves` — lifecycle sequence and simulation labeling.
- `docs/conformance.md:Reproduce` — `python tests/useagent-conformance/replay.py`.

## Invariants

The target registry is never used by replay; `simulation=true` and `mode=supervisor-local-replay` are mandatory output labels; worker report plus supervisor review are separate from done; no external service, deployment, secret, or live vendor activity is claimed.

## Verification

```powershell
python tests/useagent-conformance/replay.py
python tools/useagent.py validate
```

The fixture has passed twice after the mailbox bootstrap fix; rerun it after control-plane changes.

## Known gaps

This is deterministic process evidence, not a genuine screen recording and not product QA. A future release item may attach a real capture only when one is actually recorded.
