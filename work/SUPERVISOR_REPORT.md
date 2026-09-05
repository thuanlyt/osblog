# UseAgent supervisor report

## Current cycle — slug-history takeover and local production gate (2026-09-05)

OSBlog remains a bilingual, open-source Vite + React + TypeScript Markdown blog with real Neon Postgres persistence, Better Auth admin access, post/category CRUD, editor preview, custom slug/cover/SEO fields, moderated email-only comments, SSR SEO, co-located docs, Cap media, and Vercel/Netlify/Node adapters.

- **New capability:** UA-0069/UA-0072 add bounded RSS 2.0 (`/feed.xml`) and Atom 1.0 (`/feed.atom`) feeds with English/Vietnamese selection, published-only filtering, deterministic order, safe single-boundary XML escaping, ETag/HEAD/304, five-minute public caching and SSR discovery links. Focused tests cover exact text round trips and private/error-page omission.
- **Worker attribution:** Astra (`Dirac`, `gpt-6-astra`, xhigh) implemented UA-0069 and corrected it in UA-0072. Codex fallback (`Turing`, `gpt-5.6-sol`, high) completed the read-only UA-0071 slug-history audit. Claude Sonnet 5 is not exposed in this runtime, so no Claude execution is claimed.
- **Production:** the GitHub-linked `main` deployment is READY on Vercel at `osblog.thuanlyt.id.vn` (primary) and `osblog.vercel.app` (secondary). Neon `osblog-db` is connected; migrations `0000`–`0003` and the admin bootstrap are live. The reviewed feed release is live and verified on both domains; evidence is in `work/evidence/feed-live-smoke.md`.
- **Existing live evidence:** both production hosts previously passed health, SSR homepage/article/docs, sitemap, robots, admin redirect, Cap GIF and MP4 smoke; health reported `database=connected`, and article metadata exposed BlogPosting JSON-LD, OG image and hreflang.
- **Recovery:** Vercel alias rollback was rehearsed against the previous READY deployment and restored. Neon backup/branch restore remains unverified because the local Neon CLI is unauthenticated; UA-0067 is explicitly blocked on that external state.
- **Local gates:** 18 Vitest files / 93 tests passed; 2 compiled-browser E2E tests passed; typecheck, lint, production build, `npm audit --audit-level=high` (0 vulnerabilities), `python tools/useagent.py validate` (`VALID`), conformance replay (`REPLAY_PASS`) and diff/secret-path checks passed. UA-0077 review evidence covers the slug-history matrix.
- **Control plane:** 51 tasks are `done`, 23 are `cancelled`, 2 are `blocked`, and UA-0077 is `in_progress` under supervisor takeover; none are assigned or reported. UA-0073 is blocked only because its Astra worker exhausted runtime quota without a report; UA-0076 closed the feed release gate; UA-0074 refreshed the knowledge ledger and Decision 0005.

## Remaining gaps

- Published-slug history/one-hop redirects are implemented and locally verified under UA-0077, but migration 0004 is not applied to production; rollout still requires collision preflight and backup evidence.
- Neon backup/restore is blocked on Neon CLI authentication and missing native dump tools; no production data mutation was attempted.
- Turnstile is accepted in configuration but not wired into comment verification; Netlify and VPS adapters are implemented but not executed on their live platforms.
- Migration-lock load testing and explicit recovery time/data-loss objectives remain undefined.
- The primary Brave window is not exposed to this desktop CUA session; deployment evidence uses Vercel CLI/GitHub integration and live HTTP checks. The operator manually configured DNS and accepted the Neon integration.

## Evidence anchors

- [README.md](../README.md), [README.vi.md](../README.vi.md)
- [docs/feeds.md](../docs/feeds.md), [docs/vi/feeds.md](../docs/vi/feeds.md)
- [UA-0069 implementation report](reports/inbox/UA-0069-20260905T092830Z-3995ab.md)
- [UA-0069 review](evidence/UA-0069-review.md)
- [UA-0072 corrective report](reports/inbox/UA-0072-20260905T093726Z-6ced66.md)
- [UA-0072 review](evidence/UA-0072-review.md)
- [UA-0071 slug-history audit](evidence/slug-redirect-audit.md)
- [UA-0071 review](evidence/UA-0071-review.md)
- [UA-0074 context review](evidence/UA-0074-review.md)
- [UA-0076 feed live smoke](evidence/feed-live-smoke.md)
- [UA-0077 takeover review](evidence/UA-0077-review.md)
- [UA-0066 recovery evidence](evidence/ops-recovery-drill.md)
- [UA-0067 blocked Neon item](items/UA-0067.md)

## Next action

Close UA-0077 after this report review, then create the separate authorized provider rollout gate for Neon backup/restore, count-only preflight, migration 0004 and live historical-URL smoke; do not infer production redirects from local tests.
