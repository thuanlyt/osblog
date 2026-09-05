-- Better Auth 1.7 credential identity namespace. Existing credential rows keep their identity.
ALTER TABLE account ADD COLUMN issuer text;
UPDATE account SET issuer = CASE WHEN provider_id = 'credential' THEN 'local:credential' ELSE 'local:oauth:' || provider_id END;
ALTER TABLE account ALTER COLUMN issuer SET NOT NULL;
CREATE UNIQUE INDEX account_issuer_identity ON account(issuer, account_id);
