# Operations and rollback

## Local run

The application run/build/test commands will be recorded here after discovery creates the app. The control plane can be validated with:

```powershell
python tools/useagent.py validate
python tools/useagent.py supervisor cycle --max-assignments 4
```

## Production checklist

Record required environment variables without values, migration/seed procedure, admin bootstrap, rate limits, comment moderation, sitemap verification, health checks, and exact GitHub/Vercel URLs. Never commit secrets.

## Rollback

Rollback must identify the deploy/commit, database migration reversal or forward-fix strategy, content backup/restore boundary, and verification steps. Until those are evidenced, release status is local-ready only.
