# Admin and comments

*Tiếng Việt: [docs/vi/admin-and-comments.md](vi/admin-and-comments.md)*

**Current status: implemented and tested.** The sign-in boundary, CRUD contract, and comment moderation described below exist in source and are covered by unit/contract tests (see [`tests/server/auth.test.ts`](https://github.com/thuanlyt/osblog/blob/main/tests/server/auth.test.ts) and [`tests/server/comments.test.ts`](https://github.com/thuanlyt/osblog/blob/main/tests/server/comments.test.ts)). A real admin account has been bootstrapped against the provisioned Neon database. The compiled-browser gate verifies the end-to-end publish and moderation path; exploratory testing of every admin screen remains an operator responsibility.

## Admin sign-in model

- Authentication uses [Better Auth](https://better-auth.com) with exactly one admin identity — see [`src/server/auth.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/auth.ts) and [`src/server/auth-policy.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/auth-policy.ts).
- **There is no public sign-up, no self-registration, and no email verification or password-reset flow.** `disableSignUp` is set on the Better Auth policy, and the only account that can ever exist is created by the operator running `npm run db:bootstrap` (see [Getting started](getting-started.md)). Running bootstrap attests that the operator controls the identity behind `ADMIN_EMAIL` — there is no automated verification step, and none is invented by this documentation.
- Sessions expire after 8 hours and refresh after 1 hour of use. Cookies are marked `Secure` automatically whenever `BETTER_AUTH_URL` is an `https://` origin.
- Every mutation carries its own server-side role check (`isAdminUser`) in [`src/server/router.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/router.ts) — hiding admin controls in the React UI is never treated as authorization on its own.
- Sign-in itself is rate-limited: 15 attempts per 15 minutes, tracked separately by hashed IP and hashed email.

## Category and post CRUD contract

The admin surface (`/admin`, `/admin/posts`, `/admin/posts/new`, `/admin/posts/:id/edit`, `/admin/categories`, `/admin/comments`) is a real React app — see [`src/app/admin/`](https://github.com/thuanlyt/osblog/blob/main/src/app/admin/) — talking to the `/api/admin/*` routes:

- Post fields, validation, and the slug/cover/SEO/draft-publish workflow are documented in [Markdown editor](editor.md).
- Category delete is rejected with `409 Conflict` when posts still reference it, unless a deliberate reassignment/archive step is taken first.
- **Post and category delete archive by default** — the "Archive" action in the UI sets `isArchived`/`status: archived` rather than removing the row. There is no hard-delete button for posts or categories in the current admin UI.
- Every write records an audit event (actor, action, entity, before/after summary, request ID) per the `audit_event` table in [`src/server/schema.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/schema.ts).
- Updates use optimistic concurrency via `expectedUpdatedAt`; a stale write is rejected as a `409` conflict rather than silently overwriting a concurrent edit.

## Anonymous comments

Comments never require an account. A reader supplies only an email address and a message:

| Field | Rule |
|---|---|
| `email` | Required, valid email, up to 320 characters. Stored encrypted (`emailCiphertext`, AES-256-GCM) plus a hash (`emailHash`) used for deduplication and rate limiting — never returned to public clients. |
| `body` | Required, 1–5,000 characters. |
| `formToken` | A server-issued, HMAC-signed token (`GET /api/comments/token`) valid for 15 minutes; submissions with a missing, expired, or invalid token are rejected. |
| `honeypot` | An optional hidden field, up to 200 characters. A filled-in honeypot marks the submission as spam — it is one signal among several, never the only check. |

See [`src/server/comment-contract.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/comment-contract.ts) for the exact validation and [`src/server/comment-policy.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/comment-policy.ts) / [`src/server/comments.ts`](https://github.com/thuanlyt/osblog/blob/main/src/server/comments.ts) for the moderation service.

### Moderation state machine

Every comment enters as `pending` or `spam` — **never** directly `approved`:

```
pending ──► approved
        └─► rejected
        └─► spam
```

An admin moderation action carries a `status`, an optional `reason`, and the same `expectedUpdatedAt` optimistic-concurrency guard used for posts.

### Anti-abuse layers — what's real today

- A server-issued, signed, time-boxed form token rejects stale or forged submissions.
- A honeypot field is present but never relied on alone.
- Rate limiting is atomic and database-backed (`rate_limit_bucket` table), keyed by hashed IP and hashed normalized email — not a client-side counter.
- Raw IP addresses and email addresses are never logged in plain text; only HMAC hashes are stored for rate limiting, and the email itself is encrypted at rest for moderator use only.
- **Turnstile/CAPTCHA is not active.** The environment schema accepts a `TURNSTILE_SECRET_KEY` value, but no code path currently verifies a Turnstile token. Do not describe comments as CAPTCHA-protected until that integration exists — see [Configuration](configuration.md).

## Comment delete is real deletion

Unlike posts and categories, deleting a comment from the moderation queue **permanently removes the row** — there is no archive state for comments. This is an explicitly audited action, not a soft delete.

Next: [Deployment](deployment.md).
