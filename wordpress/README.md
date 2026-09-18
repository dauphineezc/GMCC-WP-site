# WordPress → Next.js revalidation webhooks

This folder holds the **WordPress-side** piece of on-demand ISR. The Next.js app already exposes:

`POST /api/revalidate`

## Install (WordPress)

1. On the WordPress server, create `wp-content/mu-plugins/` if it does not exist.
2. Copy `mu-plugins/gmcc-next-revalidate.php` into that folder.
3. Add to `wp-config.php` (above “That’s all, stop editing!”):

```php
define('GMCC_NEXT_REVALIDATE_URL', 'https://gmcc-stage-1.greatermidland.org/api/revalidate');
define('GMCC_NEXT_REVALIDATE_SECRET', 'paste-the-same-secret-as-Next-REVALIDATE_SECRET');
// define('GMCC_NEXT_REVALIDATE_DEBUG', true); // optional: log send failures
```

4. On the Next.js host, ensure `REVALIDATE_SECRET` (or `FAUSTWP_SECRET_KEY`) matches that secret.
5. Publish or update a Program / Center / Event in WP admin. Staging Next should refresh without waiting for the 12h/24h timer.

## What gets purged

| WordPress change | Next tags (main) | Paths (examples) |
|------------------|------------------|------------------|
| Program | `programs` | `/programs`, `/programs/{slug}` |
| Center | `centers` | `/centers`, `/centers/{slug}` |
| Amenity | `amenities`, `centers` | `/amenities/{slug}`, `/centers`, `/membership` |
| Event | `events` | `/events`, `/visit`, `/centers`, `/` |
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

- The plugin sends **non-blocking** requests so WP admin saves stay fast.
- Multiple hooks in one request are **deduped** on `shutdown`.
- If event detail URLs stay stale, check ACF meta keys in `guess_event_start()` inside the PHP file and align them with your Event schedule fields. Listing pages still refresh via the `events` tag + `/events` layout purge.
- Autosaves and revisions are ignored.
