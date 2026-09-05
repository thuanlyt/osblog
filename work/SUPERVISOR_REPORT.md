# UseAgent supervisor report

## Current cycle — slug-history deployed with live-alias evidence boundary (2026-09-05)

OSBlog remains a bilingual, open-source Vite + React + TypeScript Markdown blog with real Neon Postgres persistence, Better Auth admin access, post/category CRUD, editor preview, custom slug/cover/SEO fields, moderated email-only comments, SSR SEO, co-located docs, Cap media, and Vercel/Netlify/Node adapters.

- **New capability:** UA-0069/UA-0072 add bounded RSS 2.0 (`/feed.xml`) and Atom 1.0 (`/feed.atom`) feeds with English/Vietnamese selection, published-only filtering, deterministic order, safe single-boundary XML escaping, ETag/HEAD/304, five-minute public caching and SSR discovery links. Focused tests cover exact text round trips and private/error-page omission.
- **Worker attribution:** Astra (`Dirac`, `gpt-6-astra`, xhigh) implemented UA-0069 and corrected it in UA-0072. Codex fallback (`Turing`, `gpt-5.6-sol`, high) completed the read-only UA-0071 slug-history audit. Claude Sonnet 5 is not exposed in this runtime, so no Claude execution is claimed.
- **Production:** the GitHub-linked `main` deployment `dpl_Atf66pXC8tDUC2NrT9czpYuzJ4nU` is READY on Vercel at `osblog.thuanlyt.id.vn` (primary) and `osblog.vercel.app` (secondary). Neon `osblog-db` is connected; migrations `0000`–`0004` and the admin bootstrap are live. Current routes, schema access and public safety smoke passed on both domains; evidence is in `work/evidence/slug-history-rollout.md` and `work/evidence/feed-live-smoke.md`.
- **Existing live evidence:** both production hosts previously passed health, SSR homepage/article/docs, sitemap, robots, admin redirect, Cap GIF and MP4 smoke; health reported `database=connected`, and article metadata exposed BlogPosting JSON-LD, OG image and hreflang.
- **Recovery:** Vercel alias rollback and a disposable Neon branch restore were rehearsed and restored. The preserved migrated branch retained 0004 while the restored branch returned to the pre-migration state; UA-0067 remains a historical blocked item, not evidence of the current authenticated rehearsal.
- **Local gates:** 18 Vitest files / 93 tests passed; 2 compiled-browser E2E tests passed; typecheck, lint, production build, `npm audit --audit-level=high` (0 vulnerabilities), `python tools/useagent.py validate` (`VALID`), conformance replay (`REPLAY_PASS`) and diff/secret-path checks passed. UA-0077 review evidence covers the slug-history matrix.
- **Control plane:** 53 tasks are `done`, 23 are `cancelled`, and 3 are `blocked`; none are active, assigned or reported. UA-0073 is blocked because its Astra worker exhausted runtime quota without a report; UA-0077 closed the local slug-history implementation gate; UA-0078 aligned bilingual rollout documentation; UA-0076 closed the feed release gate; UA-0080 is blocked only on a positive live historical-alias fixture (provider/schema/deploy gates passed).

## Remaining gaps

- Published-slug history/one-hop redirects are implemented, migration 0004 is applied, and the reviewed code is deployed. Local one-hop redirects and live current/unknown safety paths pass; production has no existing historical alias, so positive live 308 evidence awaits a real intentional rename and is not fabricated.
- Neon backup/restore and production migration gates passed through the authenticated disposable-branch rehearsal; native dump tools remain absent, so the recorded recovery evidence relies on the provider branch mechanism.
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
- [UA-0078 documentation report](reports/inbox/UA-0078-20260905T144910Z-c05965.md)
- [UA-0080 rollout gate](evidence/slug-history-rollout.md)
- [UA-0066 recovery evidence](evidence/ops-recovery-drill.md)
- [UA-0067 blocked Neon item](items/UA-0067.md)

## Next action

Wait for or explicitly authorize a real published-post rename fixture, then rerun the live 308/canonical/sitemap smoke; keep the no-mutation boundary for production content unless that fixture is intentional.
