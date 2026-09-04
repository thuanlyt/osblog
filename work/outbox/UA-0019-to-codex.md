---
type: useagent-assignment
task_id: UA-0019
agent: codex
created_at: 2026-09-04T20:17:47Z
scope: ["package.json", "package-lock.json", "index.html", "vite.config.ts", "tsconfig.json", "tsconfig.node.json", "vercel.json", "src", "public"]
---

# Assignment UA-0019: Fallback: implement Vite React TypeScript SSR scaffold via Codex

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Build the first real osblog application scaffold from the reviewed architecture and UI design system using the internal Codex runtime as explicit fallback because Antigravity is unavailable. Keep this slice limited to app/toolchain shell and deep-linkable route structure.

## Scope

- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `vercel.json`
- `src`
- `public`

## Dependencies

UA-0018

## Acceptance

- [ ] A runnable Vite + React + TypeScript scaffold exists with client entry, route-aware SSR entry boundary or documented equivalent, and deep-linkable public/admin placeholder routes.
- [ ] The shell consumes the persisted UI tokens, includes semantic landmarks, skip link, visible focus, responsive structure, and no placeholder fake CRUD or external side effect.
- [ ] Package scripts identify install, lint, typecheck, test, and build commands; the worker report labels Codex fallback and records exact command results.

## Verification

- `npm ci`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `python tools/useagent.py validate`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0019.md`

## Required report

Run `python tools/useagent.py task report UA-0019 --agent codex --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/codex/inbox/UA-0019.md`
