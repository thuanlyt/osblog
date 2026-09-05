# UA-0053 independent re-review of UA-0052

Reviewer: `astra`, independent Codex execution in this task. Workspace: `F:/dev/test-useagent`. Date: 2026-09-05. UA-0053 was already CLI-claimed (`in_progress`, assigned to `astra`) before review-owned files were created. No implementation work was performed by this reviewer.

**Gate recommendation: another iteration before accepting UA-0052.** The original R1, R2 and R4 behaviors are corrected, and ordinary R3 renewal now works. One additional R3 error-path defect and two evidence/control-plane issues remain, all P2. No unresolved P0/P1 was established in this focused review. This report completes review work; it does not approve production, a provider, deployment, or mark an implementation `done`.

## Findings

### F1 — [P2] `src/server/router.ts:31` — thrown Better Auth failures bypass the new cookie collector

`getSession({ returnHeaders: true })` still throws for Better Auth API errors. When refresh cannot update its session row, the library generates cookie-deletion headers and an unauthorized error. The await throws before `router.ts:32` copies any headers. The outer handler at `router.ts:185` passes that error to `request.ts:42`, which does not map Better Auth API errors, producing HTTP 500 and no cookies on both admin API and SSR.

Reproduction: `runtime.review.ts:190` ages the isolated SQL session, then installs a fixture-only `BEFORE UPDATE ON session` trigger that returns NULL. This deterministically exercises the library's failed-refresh branch, modelling the missing updated row from concurrent session deletion; it is not a claim to have reproduced a real multi-connection race. Request the native endpoint and both wrappers:

| Route | Observed status | Set-Cookie count |
| --- | ---: | ---: |
| `/api/auth/get-session` | 401 | 3 cookie deletions |
| `/api/admin/session` | 500 | 0 |
| `/admin` | 500 | 0 |

The corrected-behavior assertions at `runtime.review.ts:207` deliberately remain failing: API should preserve the unauthorized result and clearing cookies; SSR should preserve those cookies with an authentication failure or login redirect. The native endpoint is the positive control. The trigger/function are removed in `finally`, and the entire SQL engine is discarded afterward.

Source corroboration: installed `node_modules/better-auth/dist/api/routes/session.mjs:193` attempts refresh, `:200` deletes cookies when no row is returned, and `:201` throws unauthorized. `node_modules/better-auth/dist/api/dispatch.mjs:246` attaches error headers and rethrows even with `returnHeaders: true`.

Impact: a failed refresh is presented as an application outage and leaves browser auth cookies uncleared. This is a residual of the original R3 request to preserve session headers on error paths, not evidence that normal renewal is still broken or that the session remains authorized after revocation. Proposed follow-up: runtime owner handles the supported Better Auth error/status/header interface and adds a regression for both wrappers. Do not broadly turn unrelated internal errors into successful auth responses.

### F2 — [P2] `tests/server/node-adapter.test.ts:46` — the claimed connection-reuse regression can pass without any reuse

The follow-up assertions here and at line 54 verify only HTTP 200. `send()` at line 25 uses the default HTTP agent and returns neither socket identity nor `ClientRequest.reusedSocket`; there is no assertion connecting the overflow and follow-up requests to one socket. The comments/report claim a same-connection guarantee that these checks cannot establish.

Reproduction: `reuse-coverage.review.ts` imports the unchanged worker Node tests and forces `agent: false` in a review-only mock of `node:http.request`. Both original tests pass with **five different socket objects for five requests**. That green result is a negative control exposing insufficient coverage, not acceptance evidence.

The implementation itself passed stronger checks in `node-adapter.review.ts:122` and `:143`: an explicit keep-alive agent verifies identical server socket IDs and `reusedSocket`, and a raw TCP probe withholds upload completion until a full 413 arrives, then pipelines the follow-up on that exact socket. Thus this finding concerns durable regression coverage, not a remaining demonstrated Node framing failure.

Proposed follow-up: runtime test owner adopts explicit socket identity/reuse assertions, a full-response deadline, and the upload-not-yet-finished scenario in the normal server suite. The review-only probes are available as repeatable evidence; they are not automatically included by the repository's default test discovery.

### F3 — [P2] `work/registry.json:3466` — UA-0052's lifecycle status invalidates the control plane

The registry stores `"status": "completed"`, mirrored at `work/items/UA-0052.md:5`. `completed` is a worker report result, not a permitted task status. `python tools/useagent.py validate` exits 1 with `INVALID` and `UA-0052 has invalid status completed`.

The CLI's own `task report` maps a completed result to `reported` (`tools/useagent.py:865`). Impact: the required validation gate fails and the worker result is not represented as a valid pending-review state. No attribution is made about who introduced this state. Proposed follow-up: supervisor reconciles UA-0052 through the permitted UseAgent lifecycle command and reruns validation, preserving its report/evidence. No registry or item correction was made by this reviewer.

## Acceptance evidence against UA-0048

| Finding | Current implementation and reproduced corrected behavior |
| --- | --- |
| R1 | `content-contract.ts:21,31,38`: default belongs only to create. Title-only PATCH preserves `published`, `publishedAt`, other omitted fields and SQL state; public API, EN/VI actual React SSR and sitemap remain available. Timestamp-only and unknown-field-only PATCH return 400 without post/audit changes; stale writes still return 409. Draft/archived partial updates retain their state. |
| R2 | `content-contract.ts:14`: parseable absolute HTTP(S) URLs are required. Four malformed URL variants are rejected on CREATE and PATCH, with unchanged SQL/audit counts, no created bad slug and unchanged previous cover/timestamp. Valid local and HTTPS covers still produce real SSR 200. |
| R3 | `router.ts:30,108,173,181,195`: session renewal propagates on API, actual SSR, HEAD, native endpoint, later 400/404 responses and renewed-but-forbidden 403 responses. Tests verify SQL expiry extension over 7,100 seconds, one Secure/HttpOnly/SameSite=Lax/Path=/ session cookie with Max-Age=28800, and successful use of the returned cookie. Expired-session API 401 and SSR 303 preserve multiple cookie deletions; simultaneous guest requests receive no authenticated cookie. Exception-path gap F1 remains. |
| R4 | `request.ts:10,14,26`: background drain permits a full 413 before upload completion. Final run measured declared overflow 4.6 ms and chunked overflow 3.3 ms with verified same-socket 200 follow-ups. Raw TCP measured 1.2/3.2 ms before body/end-chunk completion, followed by correctly framed 200 on the same sockets. Exactly 786,432 bytes are accepted for both framing modes. Two Node Set-Cookie headers remain separate. Regression gap F2 remains. |

The original UA-0048 repros intentionally expected draft/404, persisted invalid URLs/SSR 500, missing renewed cookies, and a timeout. None was treated as a passing acceptance test here. New probes assert corrected behavior; the F1 test remains red. The coverage negative control is explicitly labelled and counted separately from acceptance checks.

## Commands and results

All commands ran from `F:/dev/test-useagent`, using installed Node v24.13.0 and Vitest v3.2.7. Full stdout/stderr, timings and hash comparisons are in `verification-output.txt`.

```powershell
node node_modules/vitest/vitest.mjs run tests/server/content.test.ts tests/server/runtime.integration.test.ts tests/server/node-adapter.test.ts --config work/reviews/astra-rereview/vitest.config.mjs --configLoader runner --outputFile.json work/reviews/astra-rereview/worker-tests.json
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false
node node_modules/typescript/bin/tsc -p tsconfig.node.json --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/server/content-contract.ts src/server/router.ts src/server/request.ts src/server/node-adapter.ts tests/server/content.test.ts tests/server/runtime.integration.test.ts tests/server/node-adapter.test.ts --no-cache
node node_modules/vitest/vitest.mjs run work/reviews/astra-rereview/runtime.review.ts work/reviews/astra-rereview/node-adapter.review.ts --config work/reviews/astra-rereview/vitest.config.mjs --configLoader runner --outputFile.json work/reviews/astra-rereview/independent-tests.json
node node_modules/vitest/vitest.mjs run work/reviews/astra-rereview/runtime.review.ts work/reviews/astra-rereview/reuse-coverage.review.ts --config work/reviews/astra-rereview/vitest.config.mjs --configLoader runner --outputFile.json work/reviews/astra-rereview/error-and-coverage-tests.json
node node_modules/vitest/vitest.mjs run tests/server/content.test.ts tests/server/runtime.integration.test.ts tests/server/node-adapter.test.ts work/reviews/astra-rereview/runtime.review.ts work/reviews/astra-rereview/node-adapter.review.ts work/reviews/astra-rereview/reuse-coverage.review.ts --config work/reviews/astra-rereview/vitest.config.mjs --configLoader runner --outputFile.json work/reviews/astra-rereview/final-focused-tests.json
python tools/useagent.py validate
```

- Worker focused suite: 3 files / 20 passed, exit 0, 5.89 seconds.
- Both TypeScript projects: exit 0. Direct no-emit project checks replace `npm run typecheck` because `tsc -b` writes build metadata outside the review directory. Focused lint: exit 0, no diagnostics.
- Initial independent suite, before adding the failed-refresh probe: 2 files / 19 passed, exit 0, 5.59 seconds. Rerunning that command now includes the added failing probe; the retained initial JSON is historical evidence, not the final gate.
- Added auth-error/coverage run: 15 passed / 1 failed, exit 1, 5.54 seconds. F1 reproduced; F2 negative control passed.
- Final combined focused run: **6 files / 41 passed / 1 failed**, exit 1, 10.96 seconds. Of the 41 passing tests, two are the deliberate no-reuse negative control. There are 39 passing corrected/protective checks and one failing corrected-behavior check. `final-focused-tests.json` is the authoritative final test result.
- UseAgent validation: exit 1, F3 above. Application code, tests and configuration were not changed to make a check pass.

## Diff, source anchors and residual risks

Read the review SKILL.md and review-gate reference fully in both the provided skill root and workspace copy; AGENTS.md, knowledge index/map/architecture and decisions 0001–0003; supervisor report, latest checkpoint/completion anchors; UA-0053/UA-0052 items, current registry, UA-0052 worker report and UA-0048 report/harnesses. The useagent-review rubric guided the severity, repeated evidence and recommendation. The user's narrower write scope overrides the skill's general `work/evidence/` destination and follow-up-task creation workflow; follow-ups are recommendations for the supervisor.

Read-only Git inspection:

```powershell
git --no-optional-locks diff --no-ext-diff --no-textconv -- src/server/content-contract.ts src/server/request.ts src/server/node-adapter.ts src/server/router.ts tests/server/content.test.ts tests/server/runtime.integration.test.ts tests/server/node-adapter.test.ts
git --no-optional-locks ls-files -- src/server/router.ts src/server/request.ts src/server/node-adapter.ts tests/server/runtime.integration.test.ts tests/server/node-adapter.test.ts
```

The available tracked diff is retained in `tracked-source-diff.txt`; it includes older pre-UA-0052 changes as well. The second command returned no tracked entries, so those five current files have no index baseline. No separate UA-0052 patch/snapshot was found in `work`. This is a current-source re-review against UA-0048 and supplied change evidence, not a claim of a clean commit-isolated UA-0052 diff. No Git mutation was performed.

`source-sha256.txt` records 11 source/test files and matching before/after hashes. Compared to UA-0048's retained hashes, `content-contract`, `router` and `request` changed; `node-adapter`, `content`, `auth` and `entry-server` did not. `provision.ts` has unrelated intervening seed changes; its current hash is recorded but those changes are not attributed to UA-0052. Recheck anchors if another writer changes the candidate.

All data work used fresh in-memory PGlite, real migrations, real Better Auth and actual React SSR. Fixture SQL fault injection tests a library error branch; provider parity, a real concurrent revocation race, browser cookie-expiry timing, production migration/release, provider request buffering and deployment remain unverified. Review HTTP servers used ephemeral loopback ports and closed their sockets/servers.

`request.ts:10` drains until end/error with no local duration or discarded-byte ceiling. The review proved prompt rejection, finite-upload framing and threshold acceptance, not resilience against indefinitely streaming hostile clients or provider lifetime limits. Those limits remain an operational risk to assess under the Node/provider gate; no additional outage was established.

Current knowledge cards still name cancelled UA-0049 as fix owner (`knowledge/architecture.md:22`, `knowledge/project-map.md:9`). Supervisor should reconcile cards with UA-0052/UA-0053 and the eventual gate. `docs/backups-and-rollback.md` documents procedures but explicitly lacks completed restore/deployment rollback drills. Prior full-suite/browser/provider statements were treated as supplied evidence and not rerun or promoted to approval.

## Handover

Task: UA-0053. Review work completed, pending supervisor decision. Files created only under `work/reviews/astra-rereview`: this report, review-only runner/probes, JSON results, captured command output, source hashes and tracked diff. The only writes outside this directory are generated by the explicitly requested UseAgent CLI report.

No reviewer blocker remains. Acceptance blockers: F1–F3 and the known source-card reconciliation. Next action: supervisor routes the auth error handling and durable reuse-test gaps to the runtime owner, reconciles UA-0052 lifecycle state through CLI, updates its owned cards, then requests a focused re-review. Do not close UA-0052 or claim production/provider approval on the current evidence.

CLI handover submitted successfully at 2026-09-05T07:45:17Z using `python tools/useagent.py task report UA-0053 --agent astra --result completed` with the summary, next action, files and checks above. Result: `work/reports/inbox/UA-0053-20260905T074517Z-2e8fab.md`, exit 0. Registry read-back confirms UA-0053 `status=reported`, `assigned_to=astra`, `last_result=completed`. Post-report validation still exits 1 solely for UA-0052's invalid `completed` status; that finding was not repaired or hidden.
