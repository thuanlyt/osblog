# Decision 0005: Manual worker limitation and Codex fallback

## Context

The configured roster preserves the real worker identities `antigravity`, `codex`, and `claude`, but all three target entries currently report `execution: manual`. The Codex app project registry exposes `F:\dev\UseAgent`, not the target `F:\dev\test-useagent`, so this supervisor cannot safely create a worker thread pointed at the target through the app project API. A previous Codex runtime did complete UA-0005/UA-0008 in the shared target; attribution is retained as Codex because the CLI reports identify `codex`.

## Decision

Keep `antigravity` as the preferred primary for UA-0003 architecture and `claude` as the preferred owner for UA-0006 conformance when their clients become callable. When they are unavailable, recreate the same narrow scope under the actual internal Codex runtime one item at a time, and label every report/evidence entry as **Codex fallback**. Preserve the original outbox prompts and cancelled task history.

## Affected work

- Original UA-0003: Antigravity-preferred architecture/persistence discovery.
- Original UA-0006: Claude-preferred conformance/replay evidence plan.
- Fallback work must not overlap: architecture first (`package.json`, Vite config, `src`, `api`, architecture docs/decision), then conformance (`docs/conformance.md`, conformance decision, `tests/useagent-conformance`).

## Invariants

No unavailable vendor runtime is claimed. A fallback cannot broaden scope, introduce fake persistence, or mark work done without a worker report, review evidence, QA, and checkpoint. GitHub/Vercel/provider credentials remain separate blockers.

## Current limitation

The target CLI currently rejects `task update --status cancelled --agent supervisor` when the assigned worker differs, even though cancellation is a supervisor-only administrative action. This prevents safe reassignment without a narrowly scoped CLI fix; the limitation and fix task are recorded in the supervisor ledger.

## Observed fallback attempt

UA-0013 was dispatched to Codex with the corrected `backend` + `frontend` capability set. After multiple bounded waits, the runtime was stopped without a CLI worker report; `docs/architecture.md` and `knowledge/decisions/0003-architecture.md` existed in scope, but the registry still had no reported files/evidence. UA-0013 is therefore cancelled with `runtime_failure` evidence. UA-0014 is the supervisor-owned recovery/review of those partial documents. This is not Antigravity execution and not a production claim.
