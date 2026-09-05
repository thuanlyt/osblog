---
type: useagent-assignment
task_id: UA-0042
agent: claude
created_at: 2026-09-04T23:49:33Z
scope: ["docs", "README.md", "README.vi.md", "CHANGELOG.md", "CONTRIBUTING.md", "SECURITY.md"]
---

# Assignment UA-0042: Write bilingual OSBlog docs and open-source release content

You are the assigned worker. Use `$useagent-worker` and do not modify files outside the scope below.

## Objective

Create practical beginner-facing co-located Markdown documentation, professional bilingual README, changelog and introduction for the modern OSBlog release.

## Scope

- `docs`
- `README.md`
- `README.vi.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

## Dependencies

- none

## Acceptance

- [ ] English and Vietnamese docs explain editor Markdown/slug/thumbnail/SEO/comments, installation/config/deploy local VPS Vercel Netlify with actual commands, backups and limitations, architecture and intro; README links requested demo and integrated docs; media refs only point to supplied real files.

## Verification

- `Markdown links and implementation consistency reviewed`

## Read first

- `AGENTS.md`
- `knowledge/INDEX.md`
- `work/items/UA-0042.md`

## Required report

Run `python tools/useagent.py task report UA-0042 --agent claude --result completed --summary "..." --next-action "Review"`.
Include changed files, checks/evidence and blockers. The supervisor will review before done.

## Assignment path

`work/agents/claude/inbox/UA-0042.md`
