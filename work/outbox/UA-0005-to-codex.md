---
type: useagent-assignment
task_id: UA-0005
agent: codex
created_at: 2026-09-04T19:36:58Z
scope: ["design-system", "docs/ui-design.md"]
---

# Assignment UA-0005: Create persisted osblog UI design system

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Use UI/UX Pro Max against the requested Vite/React stack to create a persisted minimalist editorial design system for osblog, including typography, palette, spacing, responsive states, interaction/accessibility rules, icon discipline, and page overrides needed by the blog.

## Scope

- `design-system`
- `docs/ui-design.md`

## Dependencies

UA-0001

## Acceptance

- [ ] design-system/osblog/MASTER.md exists and is the source of truth for the public/admin UI.
- [ ] Design choices cover WCAG contrast, visible focus, keyboard interaction, 44px touch targets, mobile-first layout, reduced motion, responsive image treatment, semantic labels, and no emoji icons.
- [ ] A UI handover documents how the design system maps to Vite/React components and includes reproducible search commands.

## Verification

- `python F:\dev\UseAgent\.agents\skills\ui-ux-pro-max\scripts/search.py "open source bilingual editorial blog minimalist content-first" --design-system --persist -p "osblog" --output-dir F:\dev\test-useagent`
- `python tools/useagent.py validate`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0005.md`

## Required report

Run `python tools/useagent.py task report UA-0005 --agent codex --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/codex/inbox/UA-0005.md`
