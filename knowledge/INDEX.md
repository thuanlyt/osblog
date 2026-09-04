# Knowledge index

This ledger is source-anchored. Read this file first, then open only the cards relevant to the current work item.

| Card | Purpose | Source anchor |
|---|---|---|
| [project brief](project-brief.md) | Goal, constraints, stack assumption, production definition | User goal and `useagent.config.json` |
| [project map](project-map.md) | Repository map and ownership boundaries | Current tree after bootstrap and UA-0020 |
| [stack decision](decisions/0001-stack.md) | Vite/React/TypeScript and deployment/data assumptions | User requirements; verified scaffold in `package.json` and `vite.config.ts` |
| [workflow decision](decisions/0002-workflow.md) | Real worker/replay evidence policy | `AGENTS.md` and worker roster |
| [UI design system](ui-design-system.md) | Persisted visual, accessibility, responsive, motion, and image contracts | `design-system/osblog/MASTER.md` and `docs/ui-design.md` |
| [architecture](architecture.md) | Reviewed Vite/React/TypeScript scaffold, SSR boundary, API, persistence, auth, SEO, abuse, env, migration, and rollback boundary | `src/`, `package.json`, `src/entry-server.tsx`, `docs/architecture.md`, and `knowledge/decisions/0003-architecture.md` |
| [conformance](conformance.md) | Replayable UseAgent lifecycle fixture and attribution rules | `docs/conformance.md` and `tests/useagent-conformance/replay.py` |
| [operations](../docs/operations.md) | Run, QA, deployment and rollback expectations | `useagent.config.json` |
| [autopilot](../docs/autopilot.md) | Bounded cycle and stop conditions | `useagent.config.json` and supervisor contract |

Update this index when behavior, contracts, structure, or decisions change.
