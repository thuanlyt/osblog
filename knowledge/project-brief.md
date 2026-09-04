# osblog project brief

## Goal

Build and release an open-source MIT bilingual blog named **osblog** (open source blog) with a polished minimalist content experience, real admin CRUD for categories and posts, sitemap and thumbnails, email-only comments without login/registration with anti-spam controls, related/random/most-viewed content, strong pure SEO, Vercel readiness, practical bilingual documentation, and production-quality test, security, accessibility, and performance evidence.

## Stack assumption

Use Vite + React + TypeScript, with a lightweight Vercel-compatible persistence layer and serverless API boundary selected during discovery. Do not introduce a fake in-memory CRUD path in a production claim. The chosen provider, schema, environment variables, migration/seed, abuse controls, and rollback path must be recorded before implementation is considered production-ready.

## Milestones

- L0: bootstrap and workflow conformance evidence.
- L1: discovery, architecture, and persisted design system.
- L2: public blog shell, data/backend, admin/content, SEO, and comments.
- L3: tests, security, accessibility, performance, documentation, and integration.
- L4: release gate, GitHub/Vercel status, and rollback-ready handoff.

## Non-negotiable acceptance criteria

1. Public routes are deep-linkable, responsive, keyboard usable, semantic, and visually consistent with the persisted UI/UX Pro Max system.
2. Categories and posts support real create/read/update/delete flows with validation and persistence; admin access is protected and documented.
3. Comments use email without user accounts, have visible moderation/abuse controls, and include anti-spam/rate-limit measures.
4. Sitemap, metadata, canonical/alternate language links, thumbnails, structured data, and crawl behavior are tested.
5. Related/random/most-viewed content is deterministic where appropriate, bounded, and covered by tests.
6. Focused and integration tests, accessibility checks, security review, and performance evidence pass with no open P0/P1 findings.
7. README and practical documentation are bilingual, MIT licensing is present, operations/rollback notes exist, and GitHub/Vercel status is reported without fabricated evidence.
8. The UseAgent lifecycle is replayable: context → DAG → dispatch → pull → implementation → report/COMPLETED → review → QA → checkpoint.

## Constraints and stop conditions

The supervisor may modify local workspace state within declared scopes. Stop for missing credentials, ambiguous acceptance, overlapping writers, unsafe external side effects, or a repeated failure without a new hypothesis. External worker runtimes are not claimed unless an actual runner produces evidence.
