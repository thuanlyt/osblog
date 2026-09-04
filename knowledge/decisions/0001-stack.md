# Decision 0001: Vite/React/TypeScript baseline

## Decision

Start discovery from Vite + React + TypeScript and choose the smallest real persistence/admin boundary that works on Vercel.

## Rationale

The user explicitly asked for Vite and a production-suitable lightweight stack. A client-rendered Vite app keeps the surface small; SEO-critical output and route behavior must be verified and supplemented with server/API or prerender strategy during discovery. The data provider is now selected by the reviewed architecture contract as Neon Postgres via Drizzle, but package/provider integration remains an evidence-backed follow-up task.

## Consequences

Workers must not add framework-specific assumptions or fake CRUD. The client scaffold is verified; provider-backed persistence/auth may proceed only within scoped schema, auth, env, migration, abuse, and rollback work items.
