# UA-0075 — Production feed live smoke

Date: 2026-09-05 (Asia/Bangkok)

## Scope

Verified the reviewed RSS/Atom release from commit `fdfe270c6a3950841891ada4cb7877502fb8e9ee` on both public aliases:

- `https://osblog.thuanlyt.id.vn`
- `https://osblog.vercel.app`

The Vercel deployment inspected for the source commit was `dpl_6NydGspFgX9bQgnB833ZawDaC7HB` with state `READY`.

## Reproduction command

Run from `F:\dev\test-useagent`:

```powershell
$bases = @('https://osblog.thuanlyt.id.vn','https://osblog.vercel.app')
foreach ($base in $bases) {
  foreach ($path in @('/feed.xml','/feed.atom')) {
    foreach ($lang in @('en','vi')) {
      $uri = $base + $path + '?lang=' + $lang
      $res = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 30
      $xml = [xml][string]$res.Content
      # Assert status 200, expected root, language, bounded entries, safe XML,
      # Cache-Control, ETag, HEAD 200, and If-None-Match 304.
    }
  }
}
```

## Evidence

All eight feed combinations returned `200` with three entries (within the maximum of 20):

| Domain | RSS EN/VI | Atom EN/VI | XML | Cache / validators |
| --- | --- | --- | --- | --- |
| `osblog.thuanlyt.id.vn` | `200`, root `rss`, language `en`/`vi` | `200`, root `feed`, language `en`/`vi` | Parsed successfully; no double-escaped XML entities | `public, max-age=300`, ETag present, HEAD `200`, conditional request `304` |
| `osblog.vercel.app` | `200`, root `rss`, language `en`/`vi` | `200`, root `feed`, language `en`/`vi` | Parsed successfully; no double-escaped XML entities | `public, max-age=300`, ETag present, HEAD `200`, conditional request `304` |

HTML discovery links were present on both `/` and `/?lang=vi` for both domains, including `application/rss+xml` and `application/atom+xml` alternates.

## Result

PASS. No secrets or private content were included in the evidence. The next production work item is UA-0073 (permanent published-slug history and redirects); Neon backup/restore remains blocked by CLI authentication and is not inferred from this smoke test.
