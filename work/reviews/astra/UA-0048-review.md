# UA-0048 independent runtime review

Reviewer: `astra`. Review completed 2026-09-05 against the working source in `F:/dev/test-useagent`; SHA-256 anchors are in `source-sha256.txt`. UA-0047 was cancelled; UA-0048 was verified CLI-claimed before any review files were written.

Recommendation: **another implementation iteration; do not accept the current implementation**. One reproduced P1 and three reproduced P2 findings remain. No P0 finding was established. This is an audit report, not a release approval or a `done` decision.

## Findings

### R1 — [P1] `src/server/content-contract.ts:34` — partial updates silently unpublish articles

The partial schema retains the `status: ...default('draft')` at line 17. With the installed Zod, parsing a PATCH that omits status inserts `status: 'draft'`. `src/server/content.ts:71` merges it over the saved published state and line 73 persists it.

Reproduction: create a published article, obtain its current `updatedAt`, then authenticate and PATCH `/api/admin/posts/<id>` with only `{titleEn: 'Corrected title', expectedUpdatedAt: '<current timestamp>'}`. Actual result: HTTP 200 with `data.status === 'draft'`; the previously HTTP-200 public API and real React SSR article both become 404. A timestamp-only PATCH also passes the supposed nonempty-update validation because the default creates a field.

Impact: valid partial edits remove published content from public pages and discovery without requesting a publication-state change. The current editor generally sends explicit status, so the existing publishing E2E does not cover this API contract failure.

Proposed follow-up: separate creation defaults from partial-update validation; preserve omitted fields and reject timestamp-only patches. Add a regression asserting a title-only edit keeps a published article public. Evidence: `runtime.review.ts`, test `R1`; `results.json`.

### R2 — [P2] `src/server/content-contract.ts:14` — accepted cover URLs can break published article SSR

The URL validator checks only an HTTP(S) prefix. It accepts `https://`, which `new URL(...)` in `src/server/seo.ts:15` cannot parse.

Reproduction: create a published article with `coverImageUrl: 'https://'` and nonempty alt text in both languages. Actual result: create API 201, public article API 200, real React SSR `/post/<slug>` 500 with the sanitized error page. The malformed value remains stored.

Impact: accepted editor/API data makes that public article unreadable until corrected. Proposed follow-up: validate a parseable HTTP(S) URL before persistence and add a malformed-cover regression. Evidence: `runtime.review.ts`, test `R2`; `results.json`.

### R3 — [P2] `src/server/router.ts:31` — admin checks discard session-renewal cookies

The direct Better Auth `getSession` call returns only data, and its refreshed response headers are not forwarded. `src/server/auth.ts:28` configures an eight-hour expiry with one-hour refresh. The app uses `/api/admin/session` (`src/app/api.ts:109`), which goes through this header-dropping path.

Reproduction: sign in over a fixture HTTPS origin, then age the isolated SQL session to `expires_at = now() + interval '6 hours'`. Request `/api/admin/session`. Actual result: HTTP 200 and SQL expiry extends by about two hours, but zero `Set-Cookie` headers are returned. Age it again and call `/api/auth/get-session`: the native endpoint returns the refreshed Secure cookie. This confirms the loss occurs in the application wrapper.

Impact: browser cookie expiry does not follow the configured sliding session lifetime; an active editor can be logged out at the original cookie deadline despite a renewed server session. Proposed follow-up: propagate Better Auth session headers on every admin API/SSR response that performs renewal, including redirects/errors where appropriate. Evidence: `runtime.review.ts`, test `R3`; `results.json`. Installed dependency source inspected: `node_modules/better-auth/dist/api/routes/session.mjs:172` and `:204`.

### R4 — [P2] `src/server/request.ts:13` — chunked overflow does not deliver a bounded HTTP rejection

The over-limit branch awaits stream-reader cancellation before throwing the 413 error. The Node adapter supplies the body through `Readable.toWeb(request)` (`src/server/node-adapter.ts:17`).

Reproduction: start the ephemeral loopback Node harness in `node-adapter.review.ts`; POST 851,968 bytes using chunked transfer, with no `Content-Length`. Actual result in two runs: no HTTP response before the client's five-second timeout. A declared 786,433-byte body returns 413 promptly; normal requests preserve both Set-Cookie headers. The in-memory Fetch overflow check also returns 413, so it does not cover this Node stream behavior.

Impact: the local/Node request boundary leaves an oversized streaming request unanswered until timeout/disconnect instead of completing the documented rejection. Affected router paths include the public sign-in body reader (`src/server/router.ts:52`). No claim is made about provider buffering or behavior beyond five seconds.

Proposed follow-up: make rejection complete independently of stream cancellation, with safe connection disposal; test real chunked HTTP on the Node adapter. Evidence: `node-adapter.review.ts`; `node-results.json` and `node-confirmed.json`. The initial diagnostic expected ECONNRESET but observed TIMEOUT; the confirmation assertion was corrected to the observed timeout and reproduced it without application changes.

## Verification and evidence limits

Commands run from `F:/dev/test-useagent`:

```text
node node_modules/vitest/vitest.mjs run --config work/reviews/astra/vitest.config.mjs --configLoader runner
node node_modules/vitest/vitest.mjs run work/reviews/astra/node-adapter.review.ts --config work/reviews/astra/vitest.config.mjs --configLoader runner --outputFile.json work/reviews/astra/node-results.json
node node_modules/vitest/vitest.mjs run work/reviews/astra/node-adapter.review.ts --config work/reviews/astra/vitest.config.mjs --configLoader runner --outputFile.json work/reviews/astra/node-confirmed.json
```

- First command: exit 0, 13 files / 41 tests passed in 16.89 seconds: 35 existing server tests plus six audit checks. It ran before the Node repro file was added; rerunning it now includes that file too.
- Initial Node diagnostic: exit 1, one test passed and one failed because the observed network error was TIMEOUT rather than the hypothesized ECONNRESET. Output is retained, not suppressed.
- Confirmed Node run: exit 0, two tests passed in 6.60 seconds. Across the completed runs, 35 existing and eight new checks executed; four new checks intentionally assert defect behavior. Their passing is **not acceptance evidence**. After fixes, convert those assertions to the required behavior.
- Protective checks established actual SQL rollback when an audit insert fails; missing-Origin/cross-site/malformed-JSON/Fetch-size rejection; HTTPS Secure cookies; preservation of multiple Node Set-Cookie headers; inert hostile Markdown and intact hydration JSON in the real React SSR renderer. Existing integration scenarios also covered migration replay/checksum drift, auth login/logout, visibility, audit records, stale writes, comment identifier privacy/rate limiting and category archival.
- All SQL execution used newly created in-memory PGlite instances. This is actual SQL execution, not Neon/Postgres provider parity, concurrent multi-connection proof, deployment verification or a rollback drill. The fixture DDL never touches a live database.
- The review config disables environment-file loading and puts caches/output under `work/reviews/astra`; no real `.env` or draft access secrets were read. No application/config/docs/test-source edit, shared build, migration against a provider, deployment, Git command or external-service call was performed. The Node harness used its own ephemeral loopback port and closed it.

## Source and coverage audit

Read the UseAgent review skill and its review-gate rubric, AGENTS.md, knowledge index/map/architecture decision, top current supervisor report, current task/implementation item, bounded checkpoint/completed anchors and current worker evidence. Reviewed every requested runtime module, `content-contract`, `comment-contract`, `categories`, `schema`, `env`, all four SQL migrations, entry-server, server/start, tools/build/build, Vercel entry/config and Netlify entry/config. The requested build script resolves to `tools/build/build.ts`. No additional actionable P0/P1/P2 was established in the other reviewed paths.

No baseline diff/patch artifact was found, and Git was explicitly out of scope. This is a current-source audit with file hashes, not a claim that a finding was introduced by a particular commit. Concurrent packaging/UI/docs changes require checking these anchors again before accepting a revised candidate.

The claimed 47-test full suite and two compiled-browser E2Es were treated as supplied evidence, not rerun or promoted to provider proof. Inspected `tests/browser/publishing.spec.ts` and its fixture/config: they exercise real UI publishing/comments and public home/VI-docs axe checks, but not provider packaging, sliding cookie renewal, partial PATCH semantics, malformed cover URLs, chunked overflow or a full admin accessibility audit. The existing SQL integration renderer at `tests/server/runtime.integration.test.ts:20` substitutes a simple `<h1>` for App; its HTML substring checks alone do not prove actual Markdown/React SSR safety. This review separately executed the actual React SSR renderer. Auth-schema migration assertions check SQL text, while the SQL integration suite executes the migrations; neither proves deployed provider behavior.

Operational/rollback procedures exist in `docs/backups-and-rollback.md`; they explicitly leave restore and deployment rollback unverified. Knowledge cards still describe older scaffold behavior, so contract-card reconciliation remains part of the supervisor's acceptance work. No additional docs changes were made here.

## Handover

Task: UA-0048, `astra`; report the audit as completed work awaiting supervisor review, never `done` or release-ready. Files touched: only this directory plus CLI-generated evidence/report metadata. No review blocker remains. Acceptance blocker: R1; R2–R4 need scoped fixes and regression evidence. Next action: supervisor creates/assigns follow-up work to the runtime owner, resolves the findings, updates source-anchored cards and requests a focused re-review. Main retains ownership of packaging, Cap setup and live provider/deployment gates.
