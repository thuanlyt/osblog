-- Expand first: old and new application instances share this ownership guard.
-- The migration runner applies every statement in one transaction.
LOCK TABLE post, audit_event IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE post_slug_history (
  slug varchar(180) PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  first_published_at timestamptz(3) NOT NULL DEFAULT now(),
  CONSTRAINT post_slug_history_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
CREATE INDEX post_slug_history_post_idx ON post_slug_history(post_id);

CREATE TEMP TABLE post_slug_candidates ON COMMIT DROP AS
  SELECT slug, id AS post_id, published_at AS first_published_at
    FROM post WHERE status = 'published'
  UNION ALL
  SELECT a.before_summary->>'slug', p.id, a.created_at
    FROM audit_event a JOIN post p ON p.id::text = a.entity_id
    WHERE a.entity = 'post' AND a.before_summary->>'status' = 'published'
      AND length(a.before_summary->>'slug') BETWEEN 1 AND 180
      AND a.before_summary->>'slug' ~ '^[a-z0-9]+(-[a-z0-9]+)*$';

DO $backfill$
BEGIN
  IF EXISTS (SELECT slug FROM post_slug_candidates GROUP BY slug HAVING count(DISTINCT post_id) > 1)
    OR EXISTS (SELECT 1 FROM post_slug_candidates c JOIN post p ON p.slug = c.slug WHERE p.id <> c.post_id)
  THEN
    RAISE EXCEPTION 'Ambiguous published slug ownership; operator reconciliation is required before migration'
      USING ERRCODE = '23505', CONSTRAINT = 'post_slug_history_backfill_owner';
  END IF;
END;
$backfill$;

INSERT INTO post_slug_history (slug, post_id, first_published_at)
  SELECT slug, post_id, min(first_published_at)
    FROM post_slug_candidates GROUP BY slug, post_id ORDER BY slug;

CREATE FUNCTION maintain_post_slug_history() RETURNS trigger LANGUAGE plpgsql AS $history$
BEGIN
  -- Serialize cross-table ownership checks, including direct/old-code writes.
  PERFORM pg_advisory_xact_lock(62874110);
  IF TG_OP = 'INSERT' OR NEW.slug IS DISTINCT FROM OLD.slug THEN
    IF EXISTS (SELECT 1 FROM post_slug_history WHERE slug = NEW.slug) THEN
      RAISE EXCEPTION 'A published slug cannot be reused'
        USING ERRCODE = '23505', CONSTRAINT = 'post_slug_history_owner';
    END IF;
  END IF;
  IF NEW.status = 'published' THEN
    INSERT INTO post_slug_history (slug, post_id, first_published_at)
      VALUES (NEW.slug, NEW.id, NEW.published_at) ON CONFLICT (slug) DO NOTHING;
    IF EXISTS (SELECT 1 FROM post_slug_history WHERE slug = NEW.slug AND post_id <> NEW.id) THEN
      RAISE EXCEPTION 'A published slug belongs to another post'
        USING ERRCODE = '23505', CONSTRAINT = 'post_slug_history_owner';
    END IF;
  END IF;
  RETURN NULL;
END;
$history$;

CREATE TRIGGER post_slug_history_guard AFTER INSERT OR UPDATE OF slug, status ON post
  FOR EACH ROW EXECUTE FUNCTION maintain_post_slug_history();
