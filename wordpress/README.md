# WordPress → Next.js revalidation webhooks

This folder holds the **WordPress-side** piece of on-demand ISR. The Next.js app already exposes:

`POST /api/revalidate`

## Install (WordPress)

This is a regular WordPress plugin (source: `plugins/gmcc-next-revalidate/`), installed from a zip on every environment. The URL and secret live in each environment's `wp-config.php`, never in the plugin file.

1. Build the zip from the repo root (avoid PowerShell 5.1 `Compress-Archive`; it writes backslash paths):

```powershell
New-Item -ItemType Directory -Force wordpress\dist | Out-Null
tar -a -cf wordpress\dist\gmcc-next-revalidate-<version>.zip -C wordpress\plugins gmcc-next-revalidate
```

2. WP admin → **Plugins → Add New → Upload Plugin** → upload the zip → **Activate**. To update later, bump `Version` in the plugin header, rebuild, upload again, and choose **Replace current with uploaded**.
3. Add to that environment's `wp-config.php` (above “That’s all, stop editing!”):

```php
define('GMCC_NEXT_REVALIDATE_URL', 'https://YOUR-NEXT-HOST/api/revalidate');
define('GMCC_NEXT_REVALIDATE_SECRET', 'paste-the-same-secret-as-Next-REVALIDATE_SECRET');
// define('GMCC_NEXT_REVALIDATE_DEBUG', true); // optional: also log successes and skips
```

4. On the paired Atlas environment, set `REVALIDATE_SECRET` to the same value (no `$` characters) and rebuild.
5. Publish or update a Program / Center / Event in WP admin. The site should refresh within seconds instead of waiting for the 15-minute timer.

Failures are always written to the PHP error log (WP Engine: User Portal → Logs). Do not also install a copy in `wp-content/mu-plugins/`.

## What gets purged

| WordPress change | Next tags (main) | Paths (examples) |
|------------------|------------------|------------------|
| Program | `programs` | `/programs`, `/programs/{slug}` |
| Center | `centers` | `/centers`, `/centers/{slug}` |
| Amenity | `amenities`, `centers` | `/amenities/{slug}`, `/centers`, `/membership`, and **every** `/centers/{slug}` (center pages show their amenities) |
| Event | `events` | `/events`, `/visit`, `/centers`, `/`, `/events/{yyyy}/{mm}/{slug}` (from ACF `eventSchedule.datetime.startDatetime`), and **every** `/centers/{slug}` (center pages list the week's events, and an edit may move an event between centers) |
| News | `news` | `/news`, `/news/{slug}`, `/` |
| Announcement bar | `announcements` | root layout |
| Nav menu | `nav` | root layout |
| Page (`membership`, `visit`, …) | mapped page tags | matching routes |
| Taxonomy term | programs / membership / … | listing routes |

Every GraphQL fetch also carries the global tag `wp`, so a nuclear purge is:

`POST /api/revalidate` with `{ "secret": "…", "tag": "wp", "layout": true }`

## Manual test from a terminal

```bash
curl -X POST "https://YOUR-NEXT-HOST/api/revalidate" \
  -H "Content-Type: application/json" \
  -H "X-Revalidate-Secret: YOUR_SECRET" \
  -d "{\"post_type\":\"program\",\"slug\":\"some-program-slug\"}"
```

Expected: `{ "ok": true, "source": "wordpress-webhook", "revalidated": { ... } }`

## Notes

- Requests are sent on `shutdown`, after WordPress has released the editor's response, so saves stay fast. The wait (default 30s, `GMCC_NEXT_REVALIDATE_TIMEOUT`) only affects the background request.
- Multiple hooks in one request are **deduped**. Drafts, autosaves, revisions, media, and nav-menu items are ignored; a menu save sends one request.
- Event detail paths come from the ACF `eventSchedule` repeater (`datetime.startDatetime`), read as the raw stored value. The plugin sends `event_start` for the active occurrence plus a `paths` entry for every occurrence date. It also records the event's slug and dates *before* the update (`pre_post_update`) and sends those URLs too, so a renamed or rescheduled event doesn't leave its old URL stale.
- If an event isn't refreshing its detail page, turn on `GMCC_NEXT_REVALIDATE_DEBUG`: the log says "No event schedule found" when the plugin can't read the schedule field.
- The Next endpoint revalidates up to 4 paths at a time; an event save covers about 15 paths.
- Edge purge only runs on Atlas; locally `edge.status` is `skipped`.
