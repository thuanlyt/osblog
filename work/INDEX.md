# Work control plane

`work/registry.json` is the source of truth for work item lifecycle and is mutated only by `python tools/useagent.py`.

- `items/`: rendered work item cards.
- `agents/`: worker mailboxes and reports.
- `outbox/`: copyable prompts created by dispatch.
- `reports/inbox/`: worker reports awaiting ingestion.
- `evidence/`: command output and replay artifacts.
- `checkpoints/`: bounded supervisor handovers.
- `completed/COMPLETED.md`: worker completion claims; not release approval.
- `SUPERVISOR_REPORT.md`: concise current health and next action.
