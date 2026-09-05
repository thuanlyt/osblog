# Markdown editor: slug, cover image, SEO, and draft/publish

*Tiếng Việt: [docs/vi/editor.md](vi/editor.md)*

**Current status: implemented and browser-tested.** The editor described below is a real screen at `/admin/posts/new` and `/admin/posts/:id/edit` — see [`src/app/admin/AdminPostEditorPage.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/AdminPostEditorPage.tsx) and its test coverage in [`AdminPostEditorPage.test.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/AdminPostEditorPage.test.tsx). The compiled-browser gate exercises login, Markdown editing, publish, and the resulting public article; the Cap walkthrough in [Media](media.md) shows the public runtime. Full exploratory coverage of every admin screen remains an operator responsibility.

## Layout

- **Language tabs** ("English" / "Tiếng Việt") switch the title, excerpt, body, SEO, and cover-alt fields for that language. Both languages are edited on the same post — there is no separate draft per language.
- **Markdown toolbar** above the body field: heading, bold, italic, link, image, list, quote, and code buttons apply Markdown syntax around the current selection (see [`src/app/admin/toolbar.ts`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/toolbar.ts)).
- **View modes**: Edit, Preview, and Split. Preview renders the same sanitized Markdown component ([`src/app/markdown.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/markdown.tsx)) used on the public site, via `react-markdown` + `remark-gfm`.
- **Sidebar**: status (`draft`/`published`/`archived`), publish date and time, category picker, slug field with a live preview link, cover image URL, and a cover preview thumbnail.

## What a post has

| Field | Notes |
|---|---|
| `slug` | Lowercase letters, numbers, and single hyphens only (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), 1–180 characters, unique. Appears in `/post/:slug`. Auto-derived from the English title on first blur while creating a new post (see [`src/app/admin/slug.ts`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/slug.ts)); editable afterward. |
| `titleVi` / `titleEn` | Required, up to 240 characters each. |
| `excerptVi` / `excerptEn` | Required, up to 1,000 characters each. |
| `bodyVi` / `bodyEn` | Required Markdown body, up to 100,000 characters each. A live word count is shown under the editor. |
| `coverImageUrl` | Optional. Must be an `http(s)://` URL or a `/assets/...` path. |
| `coverImageAltVi` / `coverImageAltEn` | **Required in both languages the moment a cover image is set.** Enforced client-side and server-side (`createPostInput`/`updatePostInput`); this is not just a UI hint. |
| `seoTitleVi` / `seoTitleEn` | Optional per-language SEO title override, up to 240 characters, with a live search-result preview in the sidebar. |
| `seoDescriptionVi` / `seoDescriptionEn` | Optional per-language SEO description override, up to 320 characters. |
| `status` | `draft`, `published`, or `archived`. |
| `publishedAt` | Required the moment `status` is set to `published`. |
| `categoryId` | Required; every post belongs to exactly one category. Archived categories still appear in the picker for a post already assigned to them. |

## Slug behavior and a real caution

A slug is validated against the pattern above on every create and update, both client- and server-side. **There is no slug-redirect mechanism.** If you change the slug of an already-published post, any existing inbound link or bookmark to the old URL will 404 — there is no automatic redirect. Treat a published slug as effectively permanent, or accept the broken-link cost deliberately.

## Draft recovery and conflict handling

- **Unsaved-draft recovery.** While editing, the form is written to `localStorage` (debounced, keyed per admin email and post ID) via [`src/app/storage.ts`](https://github.com/thuanlyt/osblog/blob/main/src/app/storage.ts). If you return to an editor with an unsaved draft newer than the saved post, a banner offers to restore or discard it. A `beforeunload` guard warns before leaving with unsaved changes.
- **Optimistic concurrency.** Every save sends `expectedUpdatedAt`. If the post changed since you loaded it (someone else's edit, or an edit from another tab), the server rejects the update as a conflict and the editor shows a "this post changed" prompt with options to reload the latest version or keep editing.

## Publish workflow

1. A new post defaults to `status: draft` and can be saved without `publishedAt`.
2. Moving `status` to `published` requires `publishedAt`; the "Publish" button sets it to the current time if empty.
3. `archived` removes a post from public listings without deleting it. The editor's "Archive" action does this for an already-saved post and requires the current `expectedUpdatedAt`, same as any other update.
4. Scheduling a future `publishedAt` on a published post is accepted by validation, but the public listing/detail queries filter on `published_at <= now()` — a "published" post with a future date will not appear publicly until that time passes.

## Markdown rendering

Both the editor preview and the public article page render through the same component: [`react-markdown`](https://github.com/remarkjs/react-markdown) with [`remark-gfm`](https://github.com/remarkjs/remark-gfm), wrapped by [`src/app/markdown.tsx`](https://github.com/thuanlyt/osblog/blob/main/src/app/markdown.tsx) to keep output sanitized and consistent between what an author previews and what a reader sees.

Next: [Admin and comments](admin-and-comments.md).
