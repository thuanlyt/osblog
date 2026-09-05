-- ISO concurrency tokens round-trip with millisecond precision.
ALTER TABLE category ALTER COLUMN created_at TYPE timestamptz(3), ALTER COLUMN updated_at TYPE timestamptz(3);
ALTER TABLE post ALTER COLUMN created_at TYPE timestamptz(3), ALTER COLUMN updated_at TYPE timestamptz(3), ALTER COLUMN published_at TYPE timestamptz(3);
ALTER TABLE comment ALTER COLUMN created_at TYPE timestamptz(3), ALTER COLUMN updated_at TYPE timestamptz(3);
ALTER TABLE post ADD CONSTRAINT post_publication_date CHECK (status <> 'published' OR published_at IS NOT NULL);
ALTER TABLE post ADD CONSTRAINT post_views_nonnegative CHECK (view_count >= 0);
CREATE UNIQUE INDEX account_credential_identity ON account(provider_id, account_id);
CREATE INDEX rate_limit_expiry_idx ON rate_limit_bucket(expires_at);
