---
type: useagent-assignment
task_id: UA-0041
agent: astra
created_at: 2026-09-04T23:49:33Z
scope: ["src", "api", "tests", "package.json", "package-lock.json", "vite.config.ts", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "eslint.config.js", "index.html", "drizzle", "tools/server", "tools/build", "public/assets", "public/favicon.svg", "design-system"]
---

# Assignment UA-0041: Implement complete modern OSBlog publishing product

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Replace incomplete scaffold with usable secure Markdown admin/public blog and co-located docs rendering, including real SSR and Vercel-compatible runtime.

## Scope

- `src`
- `api`
- `tests`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `eslint.config.js`
- `index.html`
- `drizzle`
- `tools/server`
- `tools/build`
- `public/assets`
- `public/favicon.svg`
- `design-system`

## Dependencies

- none

## Acceptance

- [ ] Admin login/session UI and category/post CRUD, Markdown toolbar plus preview, custom slug thumbnail alt SEO excerpt language draft/publish and conflict UX work through real DB APIs; public pages Markdown safely render, search/categories/popular/random/related posts/comments work; SSR serves content and correct metadata with hashed assets; docs render from local Markdown; strong behavior tests and full build pass.

## Verification

- `npm run lint; npm run typecheck; npm test; npm run build; browser and integration QA`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0041.md`

## Required report

Run `python tools/useagent.py task report UA-0041 --agent astra --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/astra/inbox/UA-0041.md`
