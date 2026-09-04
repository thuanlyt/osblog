# Bounded supervisor cycles

Each cycle is finite: read state, ingest reports, review completed claims, dispatch ready non-overlapping work, run configured QA when requested, update the supervisor report, and create one checkpoint with exactly one next action.

Stop when credentials or user choices are required, when scopes conflict, or when the same failure repeats without a new hypothesis. Scheduled invocations may continue later, but a cycle must not become an implicit infinite loop.

## Replay labeling

Mailbox files and any generated capture are process evidence. A replay or simulation must be labeled as such; only a verified screen recording may be called live activity.
