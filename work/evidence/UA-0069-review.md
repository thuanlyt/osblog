# UA-0069 review

Date: 2026-09-05
Reviewer: `supervisor`

## Gate result

**Passed after one corrective iteration.** The initial review found two P2 issues. UA-0072 corrected the RSS text boundary, added direct XML-text regression coverage, and added standard HTML feed discovery links. The focused release gates now pass.

## Findings

- [P2] `src/server/feed.ts:40,66-69` — `entry.excerpt` is escaped while mapping rows and is escaped again inside RSS `<description>`. Reproduce with `npx tsx -e "import { escapeXml } from './src/server/feed.ts'; const once=escapeXml('A & <b>plain</b>'); const twice=escapeXml(once); console.log(JSON.stringify({once,twice}))"`; output contains `&amp;amp;` and `&amp;lt;`. A feed reader can display entity text instead of the plain excerpt. Create a scoped debug task to encode the XML layer exactly once and assert parsed RSS text equals the original excerpt.
- [P2] `src/server/seo.ts:16,22` — public HTML currently emits canonical/hreflang links but no RSS/Atom discovery links. The endpoints are documented and callable, but common feed readers cannot discover them from the site head. Add discovery links in a follow-up within the feed feature scope and test both language URLs.

## Positive evidence

- `src/server/router.ts` routes `/feed.xml` and `/feed.atom`, preserves public feed cache headers, and avoids HTML error rendering for feed failures.
- Worker report `work/reports/inbox/UA-0069-20260905T092830Z-3995ab.md` records 26 focused/runtime tests, typecheck, lint, build, validator and whitespace checks passing.
- XML parser tests cover invalid scalar removal, language fallback, publication filtering, deterministic order, ETag/HEAD/304 behavior, no-store failures and private-content exclusion.
- No P0/P1 issue was found; the two P2 follow-ups are concrete and reproducible.

## Resolution evidence

- UA-0072 changed RSS `<description>` to use the same single XML escape boundary as Atom; the parser now reads the original excerpt text and rejects double-encoded entities.
- Public SSR HTML now advertises `/feed.xml` and `/feed.atom` for the rendered `en` or `vi` language, while private/error pages omit discovery.
- `npm test -- --run tests/server/feed.test.ts tests/server/seo.test.ts` passed 21 tests; typecheck, lint, build, validator and diff checks passed.

## Recommendation

Mark UA-0069 done after the UA-0072 review and final live feed smoke. The remaining slug-history limitation is independently documented in UA-0071.
