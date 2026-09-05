# UA-0071 — Slug history and redirect audit

Status: design only; no application code or migration was changed. This audit was performed by the Codex fallback worker because the requested Claude Sonnet runtime is not exposed on this host. It does not claim Claude attribution.

## Outcome

OSBlog currently treats `post.slug` as a mutable unique value. Renaming a published post immediately makes its old HTML and JSON URLs return 404. The smallest safe backward-compatible design is an additive `post_slug_history` registry containing every slug that has ever been published, mapped directly to the immutable post id. Database triggers must maintain the registry and reject reuse so old and new application instances remain safe during rollout.

Historical HTML URLs should return a one-hop `308 Permanent Redirect` to the current visible post URL. Historical JSON URLs should redirect to the current JSON endpoint, not to HTML. Current URLs continue returning 200 and remain the only URLs emitted by canonical, hreflang, structured-data, link, and sitemap output.

## Current source findings

| Area | Current behavior and consequence | Source anchors |
| --- | --- | --- |
| Schema | `post.slug` is `varchar(180) NOT NULL UNIQUE`; there is no alias/history entity. Post ids are UUIDs and are the stable identity suitable for history references. | `src/server/schema.ts:33-60`; `drizzle/0000_durable_content.sql:16-40` |
| Migrations | Numbered SQL migrations are checksum-protected, transactionally applied under an advisory lock, and discovered by filename. Existing migrations must not be edited; the next additive migration is `0004`. | `src/server/provision.ts:10-28`; `tools/server/database.ts:10-16`; `drizzle/0001_auth_tables.sql`; `drizzle/0002_precision_and_constraints.sql`; `drizzle/0003_auth_issuer.sql` |
| Migration record discrepancy | `drizzle/README.md` still says the initial migration has not run, while the current architecture card says all four migrations ran on authorized Neon. The implementation rollout must follow current provider evidence, not that stale README sentence. | `drizzle/README.md:1-10`; `knowledge/architecture.md` under “Current runtime contract” |
| Mutation path | `updatePost` row-locks the post, merges partial input, updates `post.slug`, and records before/after audit summaries. The summary includes slug and status, so audited pre-migration slug changes may be recoverable. Creation, update, and audit are one database transaction. | `src/server/content.ts:55-76`; `src/server/schema.ts:92-108` |
| Other writer | `seedIntroduction` writes published posts directly with `ON CONFLICT DO NOTHING`. A history constraint must not make a seed rerun fail after an operator renames a seed post. | `src/server/provision.ts:46-83` |
| Validation/errors | Server and editor both accept lowercase ASCII segments separated by single hyphens, maximum 180 characters. PostgreSQL `23505` is already exposed as HTTP 409 `SLUG_TAKEN` with a `slug` field error, which can cover history conflicts. | `src/server/content-contract.ts:5-27`; `src/app/admin/AdminPostEditorPage.tsx:46-70`; `src/server/request.ts:42-54` |
| Editor | The slug is editable for existing posts. Auto-generation runs only for a blank new-post slug. The preview changes immediately, but there is no warning that an edit changes the public URL. Server field errors preserve the editor contents. | `src/app/admin/AdminPostEditorPage.tsx:200-255`; `src/app/admin/AdminPostEditorPage.tsx:290-290`; `src/app/admin/AdminPostEditorPage.tsx:400-454` |
| Public lookup | Both `/api/posts/slug/:slug` and `/post/:slug` query only the current `post.slug`. Visibility requires published, due content in an active category. Therefore the old slug becomes 404 immediately after rename. | `src/server/content.ts:8-10`; `src/server/content.ts:28-34`; `src/server/router.ts:85-93`; `src/server/pages.ts:22-26` |
| SEO/crawl | Rendered canonical, hreflang, Open Graph URL, and JSON-LD derive from `PageData.path`. Sitemap entries use only current `post.slug`, which is the desired behavior after redirects are added. | `src/server/seo.ts:9-22`; `src/server/router.ts:171-184` |
| Tests | Contract tests cover slug shape and optimistic concurrency; SQL integration covers current-slug publication, duplicate-current conflict, SSR metadata, archive visibility, and sitemap; editor/browser tests cover slug generation and publishing. No test renames a slug or asserts redirect/history behavior. | `tests/server/content.test.ts:15-50`; `tests/server/runtime.integration.test.ts:86-152`; `tests/server/runtime.integration.test.ts:173-190`; `src/app/admin/AdminPostEditorPage.test.tsx:53-68`; `tests/browser/publishing.spec.ts:12-63` |

## Recommended data model and invariants

Add an ORM table and a new immutable migration, conceptually:

```sql
CREATE TABLE post_slug_history (
  slug varchar(180) PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  first_published_at timestamptz(3) NOT NULL DEFAULT now()
);
CREATE INDEX post_slug_history_post_idx ON post_slug_history(post_id);
```

Despite the table name, it intentionally includes a post's current slug once that slug is published. It is a permanent URL ownership registry, not a redirect chain.

Required invariants:

1. Every slug that reaches `status = 'published'` is permanently registered to exactly one post id.
2. A slug registered to any post cannot later be adopted as a different current slug. This also forbids an article from reclaiming one of its own retired slugs. A cached permanent redirect must never later point into a reverse redirect.
3. Draft-only slugs are not registered and remain reusable after a draft rename. Publishing, including scheduled publication, registers the current slug before the transaction commits.
4. Registry rows point directly to `post.id`. Resolution obtains the target's current `post.slug`; it never follows alias-to-alias links. Repeated `a -> b -> c` renames therefore make both `a` and `b` resolve directly to `c` in one hop.
5. Public resolution joins through the existing `visiblePost()` predicate. A draft, future, archived, or category-hidden target returns 404 from both current and historical slugs and does not disclose its current slug.
6. Hard deletion may cascade its registry rows only as an explicit data-retention decision. The application currently archives rather than hard-deletes, so normal operation retains redirects indefinitely.

### Database enforcement

Application-only checks are insufficient: an old serverless instance, seed, direct SQL writer, or concurrent create/rename could pass a check and reuse a historical slug. Migration `0004_post_slug_history.sql` should install an `AFTER INSERT OR UPDATE OF slug, status ON post` trigger that:

- takes one fixed transaction-scoped advisory lock for the small admin slug namespace;
- on insert or a changed slug, rejects `NEW.slug` when it is already registered (a same-post historical slug is also rejected when the slug changed);
- when `NEW.status = 'published'`, inserts or verifies the `(NEW.slug, NEW.id)` registry owner;
- leaves all prior registry rows intact on rename or unpublish;
- raises SQLSTATE `23505` with a named slug-history constraint for collision, preserving the existing 409 `SLUG_TAKEN` API contract.

The existing `post.slug` unique constraint continues protecting concurrent current-slug collisions. The advisory lock serializes the cross-table check/insert edge that two independent unique constraints cannot enforce by themselves. Trigger installation is important for expand-first compatibility: once the migration is applied, the currently deployed application preserves history even before redirect-aware code is deployed.

`seedIntroduction` should skip a seed whose requested slug is present in the registry as well as one present in `post`. The trigger remains the final race-safe guard. This keeps seed reruns idempotent after a seed article has been renamed.

## Migration and backfill

Do not modify `0000`–`0003`; add `0004_post_slug_history.sql` so the checksum guard remains valid.

The migration should run transactionally in this order:

1. Create the table/index.
2. Register every currently `published` post slug using `published_at` as `first_published_at` where available.
3. Derive candidate older published slugs from `audit_event` rows for `entity = 'post'`: use `before_summary.slug` when `before_summary.status = 'published'`, join by `post.id::text = entity_id`, validate the current slug format/length, and deduplicate `(slug, post_id)`.
4. Before inserting candidates, abort rather than guess if one slug maps to multiple post ids or maps to a post different from its current owner. These conflicts are possible today because an old slug is presently reusable.
5. Insert only deterministic candidates, retaining the earliest available audit timestamp as `first_published_at`, then install the trigger.

The implementation must run a read-only production preflight that reports counts for malformed candidates, missing/deleted target posts, multi-owner history, and current-owner conflicts. No slug values need to be copied into public work evidence. If any ownership conflict exists, stop the rollout and require an operator-supplied mapping; the current live owner should remain functional, but the tool must not silently redirect that URL to an earlier owner.

Audit logs may be incomplete for direct SQL edits, deleted posts, or events predating logging. Those slugs cannot be safely invented. Record the known gap and optionally accept an operator-reviewed alias map; otherwise preservation begins at migration time.

## Routing, status codes, and canonical behavior

Add one indexed resolver that looks up `post_slug_history.slug`, joins the target post/category, applies `visiblePost()`, and returns the target's current slug only when it differs from the requested slug.

- `GET /post/<historical>?lang=vi` -> `308` with an absolute `Location: <origin>/post/<current>?lang=vi`.
- Missing or unsupported language normalizes to the existing default, `lang=en`. Drop unrelated query parameters so the destination is the same URL emitted as canonical. URL fragments are client-side and survive normal browser redirects without server handling.
- `HEAD` returns the same 308 headers and no body through the existing router wrapper.
- `GET /api/posts/slug/<historical>` -> `308` to `/api/posts/slug/<current>`, so fetch clients that follow redirects still receive JSON rather than an HTML document.
- A current visible slug remains 200. A historical slug whose target is not visible remains 404 with no `Location` header.
- Keep the current global `Cache-Control: no-store` during initial rollout. The 308 and permanent no-reuse invariant provide search-engine semantics without introducing a stale shared-cache dependency.

An old URL must never render article HTML. After the redirect, the current page's existing `PageData.path` produces canonical/hreflang/Open Graph/JSON-LD URLs for the current slug. Sitemap and application links must continue reading only `post.slug`; registry entries must never be emitted into sitemap or related-card URLs.

## Editor behavior

Keep the existing regex, length, optimistic concurrency, and server field-error flow. For an existing post, retain the loaded slug as a baseline and display a non-blocking warning when it changes: saving a published URL makes the new slug canonical, permanently redirects the prior URL, and prevents reuse of all published slugs. The preview should continue showing the proposed current URL.

The database is authoritative. A reserved slug returns the existing 409 `SLUG_TAKEN` field error, the form remains dirty, and typed content remains intact. No separate availability endpoint is needed.

## Required test matrix

| Layer | Focused cases |
| --- | --- |
| Migration/schema | Fresh migration and idempotent replay; current published backfill; audit-derived backfill; malformed/missing audit rows excluded; multi-owner/current-owner collision aborts; trigger catches direct SQL and concurrent history/current collisions. |
| Content/SQL integration | Publish registers slug; published `a -> b -> c` keeps `a` and `b` mapped directly to the post whose current slug is `c`; draft-only rename leaves no history; unpublish/archive keeps prior published ownership; same-post historical reuse and another-post reuse return 409; optimistic concurrency and audit events still hold; seed rerun skips reserved seed slug. |
| Router | Current HTML and API URLs are 200; historical HTML GET/HEAD are 308 to current HTML with normalized language; historical API is 308 to current API; hidden target is 404 without `Location`; one request reaches the final current slug with no chain/loop. |
| SEO/crawl | Final article canonical, hreflang, `og:url`, and JSON-LD use current slug; sitemap contains current slug only and excludes every historical slug. |
| Editor | Editing an existing slug shows the warning and new preview; 409 history collision is attached to the slug field and preserves unsaved text. |
| Browser | Publish, rename, visit old EN/VI URL, assert browser lands on current URL and content renders; assert current sitemap entry and absence of old entry. |

Focused verification should include `npm test -- --run tests/server/runtime.integration.test.ts src/app/admin/AdminPostEditorPage.test.tsx tests/server/seo.test.ts`, followed by `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:e2e`, `python tools/useagent.py validate`, and `git diff --check`.

## Rollout, rollback, and risks

1. Take the required provider backup/disposable branch checkpoint and run the read-only collision preflight.
2. Apply the additive migration first. Verify current published rows are registered and a disposable transaction proves collision rejection. Old application instances remain functional and now preserve future published slugs through the trigger.
3. Deploy redirect-aware server/editor code. Smoke current and historical HTML/API paths, EN/VI normalization, hidden content, sitemap, and seed idempotence.
4. Monitor 409 slug conflicts, redirect counts, 404s on `/post/`, trigger errors, and migration duration before declaring the gate complete.

Application rollback is safe: roll back the server/editor build but leave the additive registry and trigger in place. Old code will still receive the existing `SLUG_TAKEN` shape and cannot reuse protected URLs, although historical URLs temporarily return 404 until redirect-aware code is restored.

Database rollback is intentionally not the first response. Dropping the trigger/table after any publish or rename loses history and reopens protected slugs. Remove them only after restoring a pre-migration database or exporting/reconciling every new registry row, and only with explicit operator approval. Permanent redirects already observed by clients/search engines cannot be revoked reliably.

Primary risks are ambiguous pre-migration audit ownership, stale provider documentation, lock time while scanning large audit tables, seed behavior under a reserved slug, and permanent-redirect loops if the no-reuse rule is weakened. The fixed advisory lock serializes only low-volume post slug/status writes; if measured contention becomes material, a later task may replace it with ordered per-slug locks.

## Open questions and defaults

1. **Does production preflight find ambiguous historical ownership?** Default: block audit backfill and require an operator mapping; never choose an owner automatically.
2. **Should historical API URLs redirect or return 200 plus `Content-Location`?** Default: API-to-API 308 for behavior parallel to HTML while preserving JSON for redirect-following clients.
3. **How long should published slugs be retained?** Default: indefinitely while the post exists. Archive does not release them; only an explicitly authorized hard delete may cascade them.
4. **May a post reclaim its own old slug?** Default: no. Reclaiming can create a loop with cached `a -> b` redirects after a later `b -> a` rename.

## Bounded follow-up implementation task

**Title:** Implement permanent published-slug registry and one-hop redirects.

**Scope:** `drizzle/0004_post_slug_history.sql`, `src/server/schema.ts`, `src/server/content.ts`, `src/server/router.ts`, `src/server/provision.ts`, `src/app/admin/AdminPostEditorPage.tsx`, the focused schema/content/runtime/SEO/editor/browser tests named above, and `knowledge/architecture.md`. Do not deploy or apply the migration to production in the implementation task; provider preflight/application is a separate authorized rollout gate.

**Acceptance:** additive migration and trigger enforce permanent published-slug ownership under concurrent/direct writes; deterministic audited history is backfilled or conflicts stop safely; visible historical HTML/API URLs issue one-hop 308 redirects to current equivalents; hidden content stays 404; canonical/hreflang/structured data/sitemap expose only current slugs; editor warning and 409 field handling preserve content; seed remains idempotent; focused and broad verification pass.

**Stop conditions:** any ambiguous production ownership, unavailable backup/recovery evidence, migration lock concern not reproduced in a disposable database, or scope overlap with another writer. Record the exact blocker rather than inventing a redirect owner or applying production changes.
