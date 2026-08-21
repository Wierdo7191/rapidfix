# Posts Migration Plan

This document describes how the existing static blog posts would be migrated into the new `posts` table. **Do not execute this migration until the admin UI is ready and the mapping has been verified.**

## Existing Static Posts

| # | Filename | Category | Read Time | Date |
|---|----------|----------|-----------|------|
| 1 | `acer-tv-wont-turn-on-troubleshooting-guide.html` | ELECTRONICS | 5 min | 2026-07-04 |
| 2 | `samsung-refrigerator-not-cooling.html` | REFRIGERATION | 6 min | 2026-07-04 |
| 3 | `lg-washing-machine-not-spinning.html` | LAUNDRY | 7 min | 2026-07-04 |
| 4 | `beko-dishwasher-not-cleaning-properly.html` | KITCHEN | 5 min | 2026-07-04 |
| 5 | `whirlpool-oven-not-heating.html` | COOKING | 6 min | 2026-07-04 |
| 6 | `hisense-ac-not-cooling.html` | CLIMATE | 6 min | 2026-07-04 |
| 7 | `cooker-oven-not-heating-evenly.html` | COOKING | 7 min | 2026-07-04 |
| 8 | `electric-kettle-stopped-working.html` | KITCHEN | 4 min | 2026-07-04 |
| 9 | `freezer-constantly-freezing-over.html` | REFRIGERATION | 7 min | 2026-07-04 |
| 10 | `how-to-troubleshoot-dead-tv.html` | ELECTRONICS | 8 min | 2026-07-04 |
| 11 | `kenwood-home-theatre-not-working.html` | ELECTRONICS | 6 min | 2026-07-04 |
| 12 | `microwave-oven-not-heating.html` | KITCHEN | 6 min | 2026-07-04 |
| 13 | `microwave-oven-sparking.html` | KITCHEN | 5 min | 2026-07-04 |
| 14 | `repair-or-replace-oven.html` | COOKING | 7 min | 2026-07-04 |
| 15 | `top-10-most-repaired-appliance-brands.html` | GENERAL | 6 min | 2026-07-04 |
| 16 | `top-5-reasons-fridge-not-cooling-enough.html` | REFRIGERATION | 6 min | 2026-07-04 |
| 17 | `top-tips-maintaining-appliance-longevity.html` | GENERAL | 7 min | 2026-07-04 |
| 18 | `washing-machine-not-draining-quick-fix.html` | LAUNDRY | 5 min | 2026-07-04 |
| 19 | `washing-machine-not-spinning.html` | LAUNDRY | 6 min | 2026-07-04 |
| 20 | `whirlpool-oven-not-heating.html` | COOKING | 6 min | 2026-07-04 |
| 21 | `why-is-my-tv-screen-glitching.html` | ELECTRONICS | 7 min | 2026-07-04 |

## Field Mapping

| posts table column | Source | Notes |
|-------------------|--------|-------|
| `id` | Generated UUID | Do not reuse filename |
| `title` | `<title>` tag or `<h1>` in HTML | e.g. `Acer TV Won't Turn On – Troubleshooting Guide` |
| `slug` | Filename without `.html` | e.g. `acer-tv-wont-turn-on-troubleshooting-guide` |
| `content` | Full HTML body content | Extract from `<article>` or main content area |
| `excerpt` | `<meta name="description">` or first paragraph | ~150-200 chars |
| `category` | Hardcoded badge in `blog.html` | ELECTRONICS, REFRIGERATION, LAUNDRY, KITCHEN, COOKING, CLIMATE, GENERAL |
| `status` | `published` | All existing posts are live |
| `published_at` | Hardcoded date in listing (`Jul 4, 2026`) or JSON-LD `datePublished` | Convert to ISO-8601 |
| `updated_at` | Same as `published_at` initially | |
| `author_id` | NULL initially | Can be assigned to first admin user later |
| `image_url` | `<meta property="og:image">` or featured image | e.g. `/Images/acer-tv-repair-nairobi.webp` |
| `meta_description` | `<meta name="description">` | |
| `meta_keywords` | `<meta name="keywords">` | |
| `read_time` | Hardcoded in `blog.html` listing | e.g. `5 min read` |
| `created_at` | Same as `published_at` initially | |

## Migration SQL Pattern

```sql
INSERT INTO public.posts (
  title, slug, content, excerpt, category, status, published_at, updated_at, author_id, image_url, meta_description, meta_keywords, read_time, created_at
) VALUES (
  'Acer TV Won''t Turn On – Troubleshooting Guide',
  'acer-tv-wont-turn-on-troubleshooting-guide',
  '<html>...</html>',
  'Expert troubleshooting guide for Acer TVs that won''t turn on...',
  'ELECTRONICS',
  'published',
  '2026-07-04T00:00:00Z',
  '2026-07-04T00:00:00Z',
  NULL,
  'https://rapidfixkenya.site/Images/acer-tv-repair-nairobi.webp',
  'Acer TV won''t turn on? Follow our expert troubleshooting guide...',
  'Acer TV repair, TV won''t turn on, appliance repair Nairobi...',
  '5 min read',
  '2026-07-04T00:00:00Z'
);
```

## Important Constraints

1. **Slugs must remain unique.** The existing static URLs (`/blog/{slug}.html`) must not change.
2. **Do not delete or modify static HTML files during migration.** They remain the source of truth until the public blog is dynamically rendered.
3. **Content extraction must be manual or carefully scripted.** Automated scraping risks breaking HTML structure, SEO metadata, or JSON-LD.
4. **Author assignment requires an existing admin auth user.** Leave `author_id` NULL until an admin user is available.
5. **Image URLs should remain absolute** (`https://rapidfixkenya.site/Images/...`) to avoid broken links.

## Recommended Migration Order

1. Execute `sql/posts-schema.sql` in Supabase SQL Editor.
2. Verify `posts` table exists with correct RLS policies.
3. Manually insert 1-2 test posts using the pattern above.
4. Verify `/api/posts` returns expected data.
5. Build `/admin/posts.html` admin UI.
6. Use admin UI to migrate remaining posts.
7. Only after admin UI is fully tested, consider dynamic public blog rendering.

## What This Does NOT Cover

- Supabase Storage for images (not required yet)
- Dynamic public blog rendering (preserve static HTML for now)
- Comment migration (comments remain in localStorage/FormSubmit)
- Redirect rules from old static URLs to dynamic URLs
