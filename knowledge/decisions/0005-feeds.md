# Decision 0005 — standards-friendly bilingual feeds

Date: 2026-09-05
Status: accepted
Owner: supervisor
Source anchors: `src/server/feed.ts:feedResponse`, `src/server/router.ts:createRouter`, `src/server/seo.ts:renderDocument`, `tests/server/feed.test.ts`, `tests/server/seo.test.ts`, `docs/feeds.md`

## Context

OSBlog is a bilingual server-rendered blog. It needed a standards-friendly subscription surface that does not expose drafts, private data or request-host-derived URLs, while preserving the existing route cache and security contract.

## Decision

Expose RSS 2.0 at `/feed.xml` and Atom 1.0 at `/feed.atom`. Both endpoints accept only `lang=en|vi` (default English), use the existing published-content SQL query with a fixed limit of 20 and deterministic publication/id ordering, and build absolute links from the configured SSR origin. Titles and excerpts are plain text and XML-escaped once; invalid XML 1.0 scalar values are removed. No full body, comment, account or draft data enters a feed.

Successful GET/HEAD feed responses use five-minute public caching, ETag revalidation and 304 responses; feed failures remain sanitized and `no-store`. Public successful HTML pages advertise language-aware RSS/Atom discovery links. Admin, login, error and not-found documents do not advertise feeds.

## Rejected alternatives

- Request-host-derived links were rejected because an untrusted Host header must not control canonical/crawl URLs.
- Unbounded archive feeds were rejected to protect serverless response size and query capacity; the feed is a recent-post subscription and the archive remains the sitemap/public listing.
- Rendering Markdown/HTML inside feed entries was rejected because excerpts are currently a plain-text safety boundary and feed readers vary in HTML sanitization.

## Verification

`npm test -- --run tests/server/feed.test.ts tests/server/seo.test.ts` passes 21 tests, including XML parsing, exact excerpt round trips, language fallback, publication filtering, deterministic ordering, ETag/HEAD/304, failure no-store behavior and public/private discovery. Typecheck, lint, build, `python tools/useagent.py validate` and `git diff --check` pass. Live `/feed.xml` and `/feed.atom` smoke is required after the next authorized production deployment.
