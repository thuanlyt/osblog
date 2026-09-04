# osblog / UseAgent project instructions

## Scope

This repository is the production workspace for **osblog**, an open-source MIT bilingual blog. The UseAgent control plane is part of the repository so the workflow can be replayed and audited locally.

## Supervisor protocol

Before reading application code, read `knowledge/INDEX.md`, `knowledge/project-map.md`, the relevant decision cards, `work/SUPERVISOR_REPORT.md`, latest checkpoint, `work/completed/COMPLETED.md`, and `work/registry.json`.

Every change belongs to a CLI-created work item with an owner, acceptance criteria, verification command, and non-overlapping scope. Use `python tools/useagent.py` for task lifecycle operations; never hand-edit `work/registry.json`.

Workers must claim work before editing, stay inside the claimed scope, and submit a report containing task id, files, commands, evidence, blockers, and next action. A worker report is not release approval. Review and QA are separate gates.

## Product constraints

- Prefer Vite + React + TypeScript with the smallest production-suitable persistence/admin approach compatible with Vercel.
- Preserve the registered worker identities `antigravity`, `codex`, and `claude`; external runtimes are manual unless a configured runner exists.
- Do not invent live vendor execution, secrets, credentials, GitHub/Vercel access, or deployment evidence.
- Use the persisted UI/UX Pro Max design system as the visual source of truth. Meet WCAG-oriented contrast, keyboard/focus, semantic labels, responsive behavior, reduced motion, performance, and touch-target checks.
- Do not deploy, delete data, change secrets/permissions, or create external resources without explicit authorization and evidence.

## Required evidence

Production claims must include focused/integration test output, review evidence with no open P0/P1 findings, accessibility/performance checks, operational and rollback notes, and exact GitHub/Vercel URLs or a concrete blocker.
