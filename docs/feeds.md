---
title: RSS and Atom feeds
description: Subscribe to the latest published OSBlog posts in English or Vietnamese.
---
# RSS and Atom feeds

*Tiếng Việt: [Nguồn tin RSS và Atom](vi/feeds.md)*

Add a feed URL from your OSBlog site to your feed reader:

| Format | English | Vietnamese |
| --- | --- | --- |
| RSS 2.0 | `/feed.xml?lang=en` | `/feed.xml?lang=vi` |
| Atom 1.0 | `/feed.atom?lang=en` | `/feed.atom?lang=vi` |

For example, use `https://your-blog.example/feed.atom?lang=vi`, replacing the example origin with your own. Without `lang`, both endpoints use English. Only `lang=vi` selects Vietnamese; other values fall back to English, matching the public pages. Cookies and `Accept-Language` do not select a translation.

Successful public pages also advertise both feeds in the server-rendered HTML head with `rel="alternate"`, `type="application/rss+xml"` or `type="application/atom+xml"`, and an absolute URL for the page's language. Feed readers can discover the subscriptions from the page URL. These links also appear on public search pages, but not on admin, login, or error pages. Discovery links do not carry page, category, or search filters.

Each feed includes at most 20 published posts, newest publication date first, with descending post ID as a stable tie-breaker. Drafts, archived posts, future publication dates, and posts in archived categories are excluded by the same query used for public listings. Other query parameters (including `limit`, `page`, search, and sort) are ignored. Feeds are a recent-post subscription, not a complete archive.

Entries contain the selected title and excerpt, publication and update dates, and an absolute link to `/post/:slug?lang=en` or `?lang=vi`. RSS descriptions and Atom summaries contain plain excerpt text escaped exactly once at the XML boundary. XML parsing recovers the original text, including ampersands, angle brackets, and literal entity strings; invalid XML 1.0 characters are removed. Markup remains text rather than XML elements. A custom reader should display the decoded excerpt with `textContent`, not insert it as trusted HTML. Atom explicitly marks summaries as `type="text"`. Full article bodies and private account/comment data are not included. Atom supplies the site name, OSBlog, as the feed author.

Post UUIDs supply stable entry identifiers across edits and slug changes. Links use the current slug; existing links to an old slug still have the limitation described in the [editor guide](editor.md). Entry update dates use the later of the saved update and publication dates. Atom's feed `updated` and RSS's `lastBuildDate` use the latest of those dates among included entries; an empty feed uses `1970-01-01T00:00:00.000Z`. RSS also exposes each entry's update time through the Atom namespace.

## Origin and caching

Feed and article links use the existing SSR origin configuration: `SITE_URL`, then `BETTER_AUTH_URL`, then `VITE_SITE_URL`. The configured URL is reduced to its HTTP(S) origin; production requires HTTPS. The incoming Host header does not control feed links. See [configuration](configuration.md) for setup.

Successful GET and HEAD responses carry a UTF-8 RSS or Atom content type, `Content-Language`, an ETag, and `Cache-Control: public, max-age=300, s-maxage=300`. HEAD returns the same headers without a body. A matching `If-None-Match` returns 304 without a body. The ETag reflects the entire feed, so edits, additions, removals, or language changes invalidate it even when the newest update date does not advance. Feed dates are not HTTP cache validators.

Readers and shared caches may retain a successful feed for five minutes, including a post that has just been archived or unpublished. The server rebuilds the feed from published SQL content on each uncached request. Failures use sanitized error responses with `no-store`; other application routes retain their existing cache policy.

## Local verification

```powershell
npm test -- --run tests/server/feed.test.ts tests/server/seo.test.ts
```

These suites use disposable local SQL and DOM/XML parsers to check both formats, exact excerpt text, inert XML markup, publication filtering, order and limits, language, dates, links, caching, failures, and public/private SSR discovery. They do not require a live database or credentials.

Source anchors: `src/server/feed.ts`, `src/server/router.ts`, `src/server/seo.ts:renderDocument`, and `src/server/content.ts:listPublishedPosts` / `visiblePost`. Format references: [RSS 2.0 specification](https://www.rssboard.org/rss-specification) and [Atom RFC 4287](https://www.rfc-editor.org/rfc/rfc4287).
