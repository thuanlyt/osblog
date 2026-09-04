# Project map

The repository contains a validated UseAgent control plane, reviewed UI and architecture contracts, a replayable conformance fixture, a verified Vite/React/TypeScript client, and server-backed boundary slices for posts, auth, comments, and SSR/SEO. Provider execution, admin screens, and release verification remain pending.

```text
AGENTS.md                    repository rules
knowledge/                   source-anchored project ledger
work/                        registry, mailboxes, reports, evidence, checkpoints
tools/useagent.py            local UseAgent CLI copied from the control-plane source
.agents/skills/              UseAgent skills required by the validator
docs/                        user-facing, operational, and release documentation
design-system/osblog/        persisted UI/UX Pro Max Master design system
tests/useagent-conformance/  bounded control-plane replay fixture
docs/architecture.md         reviewed app/data/auth/SEO/rollback proposal
package.json                 verified client scripts and dependency boundary
src/                         Vite/React route shell, placeholders, tests, styles, and SSR boundary
public/                      public asset root (currently empty by design)
api/                         Vercel-compatible health, auth, and post read/admin CRUD endpoints
tests/                       unit and boundary tests; integration/accessibility/security release suites remain pending
```

Ownership is assigned by work item. No two active writers may claim the same subtree.

Freshness: `verified` on 2026-09-05 by supervisor after UA-0005, UA-0008, UA-0014, UA-0016, UA-0020, UA-0024, UA-0026, UA-0027, UA-0028, UA-0030, UA-0032, UA-0033, and UA-0034 review. Client routes, post API/auth/comments boundaries, token flow, SSR metadata, and crawl handlers are locally verified; provider execution, admin screens, hydrated SSR data, browser QA, and deployment remain unverified.
