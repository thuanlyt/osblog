# UA-0060 verification output

All commands ran in `F:/dev/test-useagent` on 2026-09-05. Fixture and runtime artifacts are under `work/reviews/astra-final2`.

```powershell
python -B work/reviews/astra-final2/lifecycle.review.py
```

Exit: 0

```text
{
  "mode": "disposable review-owned CLI fixtures, no provider execution",
  "production_state_unchanged": true,
  "valid_cases": 4,
  "refusal_cases": 65,
  "passed": 69,
  "failed": 0
}

```

```powershell
npx --no-install vitest run tests/server/runtime.integration.test.ts tests/server/node-adapter.test.ts --config work/reviews/astra-final2/vitest.config.mjs --reporter verbose --reporter json --outputFile.json work/reviews/astra-final2/focused-tests.json
```

Exit: 0

```text

 RUN  v3.2.7 F:/dev/test-useagent

 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > replays migrations safely and refuses checksum drift 79ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > reports database health and blocks guests, signup and cross-origin writes 32ms
stderr | tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > authenticates through Better Auth password hashing and database sessions
2026-09-05T08:15:31.575Z WARN [Better Auth]: Invalid password

 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > authenticates through Better Auth password hashing and database sessions 166ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > forwards renewed session cookies on both the admin API and SSR admin pages (R3 regression) 15ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > preserves cookie clearing when Better Auth cannot persist a session renewal 21ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > creates categories and drafts, publishes Markdown, and prevents stale writes 50ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > keeps a published article public through a title-only PATCH and rejects a timestamp-only PATCH (R1 regression) 24ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > rejects a malformed cover URL before persistence (R2 regression) 6ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > filters search/year/sort, deduplicates views and emits safe SEO and docs 25ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > accepts email comments only into moderation and never publishes private identifiers 55ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > archives categories without data loss and hides all associated public surfaces 18ms
 ✓ tests/server/runtime.integration.test.ts > real SQL and Fetch runtime integration > adds bilingual introduction only once and invalidates logout sessions 29ms
 ✓ tests/server/node-adapter.test.ts > preserves multiple Set-Cookie headers and rejects a declared oversized body without corrupting the reused connection 40ms
 ✓ tests/server/node-adapter.test.ts > rejects an oversized chunked body with a prompt 413 instead of stalling until timeout (R4 regression) 9ms

 Test Files  2 passed (2)
      Tests  14 passed (14)
   Start at  15:15:26
   Duration  5.61s (transform 298ms, setup 0ms, collect 2.12s, tests 2.66s, environment 0ms, prepare 361ms)

JSON report written to F:/dev/test-useagent/work/reviews/astra-final2/focused-tests.json

```

```powershell
python tools/useagent.py validate
python tools/useagent.py task reconcile --help
```

Exit: 0

```text
VALID
usage: useagent task reconcile [-h] --agent AGENT task_id

positional arguments:
  task_id

options:
  -h, --help     show this help message and exit
  --agent AGENT  supervisor or release-gate identity

```

Standalone validation after tests: exit 0, `VALID`. SHA256 comparison against the pre-run manifest: 24 paths checked, 0 changed. The manifest includes the real registry, UA-0052 item/report, control-plane source, runtime/test/config inputs, and the conformance test source.
