# UA-0058 independent final runtime and lifecycle review

Reviewer: `astra`. Workspace: `F:/dev/test-useagent`. Date: 2026-09-05. UA-0058 was already claimed and `in_progress` before review writes. This is review evidence, not implementation, production, provider, or deployment approval.

**Recommendation: accept the reviewed UA-0056 runtime fixes at the local review gate; request another iteration for UA-0057.** UA-0053 F1/F2 are resolved. Current UseAgent validation passes and the old UA-0053 F3 invalid-status condition is resolved. Two P2 reconciliation guard findings remain. No actionable P0/P1/P2 finding was found in the focused application runtime paths. UA-0058 review work is completed, pending supervisor handling of this report; no implementation was marked `done`.

## Remaining findings

### L1 — [P2] `tools/useagent.py:895` — reconciliation accepts failed, blocked, or missing completion results

UA-0057 explicitly requires both `status=completed` and `last_result=completed` (`work/items/UA-0057.md:19`). The implementation checks only status and a nonempty report list before setting `reported` at line 901. It never verifies `last_result` or the referenced report's completed result.

Reproduction:

```powershell
python -B work/reviews/astra-final/lifecycle.review.py
```

The review-only fixture at `lifecycle.review.py:35` creates three legacy markers whose `last_result` is absent, `failed`, or `blocked`, with real fixture report files recording a failed/blocked result. It invokes the unchanged CLI as supervisor using `--root <disposable-fixture> task reconcile UA-REVIEW --agent supervisor`. All three return exit 0 and become `reported`; the incompatible result is retained. The expected refusal assertions therefore fail. No checkout registry was edited by this fixture.

**Impact and release effect:** this broadens a narrowly specified recovery command into a way to normalize failed or unproven work into a pending-review lifecycle state. It does not mark that work done, grant deployment authority, or demonstrate lost evidence, but it violates the required completion guard and prevents unconditional UA-0057 acceptance. Current UA-0052 also lacks `last_result`; its existing worker report does say completed. Thus a documented compatibility path could be justified, but the current code does not check that evidence and also admits explicit failures.

**Proposed follow-up:** supervisor assigns a scoped CLI correction and regression suite. Enforce the agreed completed-result prerequisite; if compatibility for missing legacy metadata is required, define and verify the referenced completion evidence without accepting explicit failed/blocked results.

### L2 — [P2] `tools/useagent.py:891` — reviewer roles can execute the supervisor-only recovery mutation

The command calls `review_agent`, whose guard at `tools/useagent.py:382` admits `reviewer` and `release_gate` in addition to `supervisor`. UA-0057's objective requires a supervisor-only command (`work/items/UA-0057.md:15`). Even the new CLI help at `tools/useagent.py:2078` does not advertise ordinary reviewers.

Reproduction: the same fixture's case at `lifecycle.review.py:38` uses the checkout's actual `astra-review` configuration (`useagent.config.json:161`, role `reviewer` at line 162). On an eligible fixture completion marker, `task reconcile UA-REVIEW --agent astra-review` exits 0, changes registry/frontmatter to `reported`, and appends a “supervisor reconciled” event. Expected behavior under the task objective is refusal. Worker identities `astra` and `supervisor-local` are correctly rejected as negative controls.

**Impact and release effect:** the control plane fails to enforce its promised role separation for this recovery action. This is an application workflow authorization gap, not an OS security boundary or a demonstrated runtime privilege escalation. It blocks acceptance of the claimed supervisor-only behavior, while leaving current runtime test results valid.

**Proposed follow-up:** require the intended supervisor role at this command and add role-matrix checks. If a broader policy is intended, explicitly reconcile that policy with the task objective and CLI help before acceptance.

## Reproduced runtime fixes

| Requirement | Independent result and source anchors |
| --- | --- |
| UA-0053 F1: failed Better Auth renewal | `src/server/router.ts:41` uses the native HTTP handler, line 42 copies cookies before status handling, line 43 maps 401, line 186 redirects SSR to login, and line 208 merges collected headers. The unchanged earlier SQL fault-injection probe (`work/reviews/astra-rereview/runtime.review.ts:190`) now passes: native endpoint **401 / 3 cookies**, admin API **401 / identical 3 cookies**, admin SSR **303 / identical 3 cookies**. The normal regression at `tests/server/runtime.integration.test.ts:69` also proves the exact safe login Location. |
| Successful renewal and adjacent errors | The earlier independent probe verifies one Secure/HttpOnly/SameSite=Lax/Path=/ session cookie with Max-Age=28800, SQL expiry extension exceeding 7,100 seconds, and usability of the returned cookie. API, actual React SSR, HEAD, subsequent 400/404 responses, renewed-but-forbidden 403 responses, expired sessions, and simultaneous guest isolation pass. Non-401 auth failures remain mapped to 503 at `router.ts:44`; that branch is source-reviewed, not separately fault-injected in this run. |
| UA-0053 F2: durable connection reuse assertions | `tests/server/node-adapter.test.ts:40` and line 55 create single-socket keep-alive agents; lines 50 and 62 assert `reusedSocket`. Both normal tests pass. Running the prior `reuse-coverage.review.ts` mock, which forces `agent:false`, now makes **both tests fail at those assertions**, confirming that fresh sockets cannot produce false-green coverage. Its historical unconditional console message saying “tests passed” is stale fixture text; the exit code and assertions show the expected failures. |
| Node framing and prompt rejection | The unchanged stronger probes in `work/reviews/astra-rereview/node-adapter.review.ts:122` and line 143 confirm identical server socket IDs, `reusedSocket`, and safe 200 follow-ups. Declared/chunked overflow returns complete 413 in **6.5 / 3.7 ms**. Raw TCP withholds upload completion, observes complete 413 in **1.3 / 3.3 ms**, then sends the remaining framing and follow-up on that same socket. Exactly 786,432 bytes are accepted in both modes; multiple Set-Cookie headers remain separate. |
| Previous R1/R2 behavior | Earlier independent SQL/React probes still pass: partial PATCH preserves publication/omitted fields, timestamp-only updates are rejected without persistence, and malformed cover URLs fail CREATE/PATCH before post/audit changes. Current `content-contract.ts` and request/adapter hashes match the preceding review. |

The SQL trigger returning NULL models Better Auth's failed-update branch in isolated PGlite; this is not a provider concurrency-race reproduction. Test HTTP servers used ephemeral loopback ports and closed their connections.

## UA-0057 lifecycle evidence

`python tools/useagent.py validate` exits 0 with **VALID**. Current UA-0052 registry and item frontmatter both show `reported`; its original report path and all four check strings remain present and match `work/reports/inbox/UA-0052-20260905T073012Z-f4a8c1.md`. Its event log records supervisor reconciliation. No historical byte-for-byte pre-reconciliation registry snapshot was available; the isolated valid-completion control independently proves preservation of all unrelated item fields, evidence, report bytes, frontmatter, and the appended event.

The lifecycle probe has **12 passing controls and 4 failing guard cases**, corresponding to L1/L2. It rejects every nonlegacy status, missing reports, and worker identities without changing fixture registry/item bytes. The normal conformance replay also passes, but does not exercise these new reconciliation preconditions.

The UA-0057 verification string uses `--agent supervisor-local`, which is configured as a worker and is correctly refused. The worker's actual evidence used `--agent supervisor`. This review did not rerun a recovery mutation against the already repaired live work item; the same CLI was exercised in disposable state.

## Commands and captured evidence

All commands ran locally with Node **v24.13.0**, Python **3.14.3**, and Vitest **3.2.7**.

```powershell
npx --no-install vitest run tests/server/runtime.integration.test.ts tests/server/node-adapter.test.ts --config work/reviews/astra-final/vitest.config.mjs --reporter verbose --reporter json --outputFile.json work/reviews/astra-final/focused-tests.json
npm run typecheck
npm run lint
python tools/useagent.py validate
npx --no-install vitest run work/reviews/astra-rereview/runtime.review.ts work/reviews/astra-rereview/node-adapter.review.ts --config work/reviews/astra-final/vitest.config.mjs --reporter verbose --reporter json --outputFile.json work/reviews/astra-final/independent-tests.json
npx --no-install vitest run work/reviews/astra-rereview/reuse-coverage.review.ts --config work/reviews/astra-final/vitest.config.mjs --reporter verbose --reporter json --outputFile.json work/reviews/astra-final/reuse-negative-control.json
python -B work/reviews/astra-final/lifecycle.review.py
python -B tests/useagent-conformance/replay.py
```

- Focused normal tests: **14/14 pass**, exit 0, 5.41 seconds.
- Prior independent corrected-behavior probes: **20/20 pass**, exit 0, 5.96 seconds.
- Typecheck/lint: both exit 0.
- Validation: exit 0, VALID.
- Forced-no-reuse negative control: **2 expected failures**, exit 1; not a runtime failure.
- Lifecycle acceptance probe: **12 pass / 4 fail**, exit 1; L1/L2 remain actionable.
- Conformance replay: exit 0, REPLAY_PASS, explicitly labeled simulation.

The review-owned Vitest config disables environment-file loading and uses a cache inside the review scope; it runs the existing test sources in Node with no test-code edits or mocks except the explicitly separate negative control. The mandated typecheck and lint scripts ran as written; typecheck may refresh ignored TypeScript build metadata.

[verification-output.md](verification-output.md) retains exact command output and exit codes. JSON results are in [focused-tests.json](focused-tests.json), [independent-tests.json](independent-tests.json), [reuse-negative-control.json](reuse-negative-control.json), and [lifecycle-results.json](lifecycle-results.json). The new lifecycle harness is [lifecycle.review.py](lifecycle.review.py); it creates and removes only review-owned temporary fixtures.

## Source integrity, limits and handover

Read AGENTS.md, knowledge index/project map/architecture/conformance, workflow/architecture/current release decisions, supervisor report, latest checkpoint and completion ledger, relevant current registry/tasks/reports, both review-skill copies and rubric, source/diff and prior review probes. The useagent-review rubric determined finding structure, severity and gate evidence. The narrower UA-0058 write scope takes precedence over the skill's generic `work/evidence/` and follow-up-task creation workflow; the supervisor should create the proposed fixes.

Git HEAD is `52d5962aea866c0d6492416bbe58357036f21bac`, with extensive existing working-tree changes. Five runtime/test inputs are untracked and have no Git baseline; the tracked diff also includes older changes, so this is a current-source review, not a commit-isolated patch review. [tracked-source-diff.txt](tracked-source-diff.txt) and [source-anchors.txt](source-anchors.txt) retain the inspected evidence. Relative to UA-0053's hashes, router/runtime integration/Node tests changed; the other overlapping inputs did not. All **19 recorded source/test/config inputs match before and after this review**, including `tools/useagent.py`; see [source-sha256-before.txt](source-sha256-before.txt) and [source-sha256-after.txt](source-sha256-after.txt).

Application code, control-plane code, normal tests, Git state and provider resources were not modified. Review artifacts are confined to `work/reviews/astra-final`; only the explicitly requested CLI worker report updates real workflow records. No secrets or provider endpoints were needed.

Residual limits: no browser/build/provider smoke, production deployment, provider buffering test, indefinite-upload resource test, or rollback drill was performed. The background drain at `src/server/request.ts:10` has no explicit local duration/discard-byte ceiling; finite-upload behavior is verified here. `docs/backups-and-rollback.md` contains procedures and explicitly outstanding drills. Existing knowledge cards still refer to the superseded UA-0049 fix ownership and should be refreshed by the supervisor.

Next action: supervisor records acceptance of the local UA-0056 runtime evidence, assigns UA-0057 guard corrections and durable CLI regressions, reconciles its source cards, then requests a focused lifecycle re-review. L1/L2 remain acceptance blockers; there is no blocker to submitting this completed independent review. No production or provider approval is granted.

CLI submission succeeded at 2026-09-05T08:08:30Z (exit 0): [worker report](../../reports/inbox/UA-0058-20260905T080830Z-07701a.md). Read-back confirms UA-0058 `status=reported`, `assigned_to=astra`, `last_result=completed`, six registry checks, all 12 referenced files present, and matching item frontmatter. Post-submission `python tools/useagent.py validate` again exits 0 with VALID. The only remaining gate recommendation is the lifecycle follow-up above; this submission is not release approval.
