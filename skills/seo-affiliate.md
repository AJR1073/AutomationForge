# Skill: SEO & Affiliate — AutomationForge

## SEO Requirements

### Every Page Must Have
- Unique `<title>` tag via `generateMetadata()`.
- Unique `<meta name="description">` — 150-160 characters, includes primary keyword.
- Single `<h1>` per page.
- Semantic HTML (`<section>`, `<nav>`, `<article>`, `<details>`).

### Build Sheet Pages (SSG)
- JSON-LD structured data: `HowTo` + `FAQPage` schemas.
- Breadcrumb navigation: Home → Build Sheets → [Title].
- `revalidate = 3600` (ISR hourly).
- Slug format: `kebab-case`, human-readable, keyword-rich.
- SEO title format: `{Title} — Shelly, Home Assistant, Node-RED & ESPHome Code`.

### Sitemap & Robots
- `src/app/sitemap.ts` — dynamically generates from all published build sheet slugs.
- `src/app/robots.ts` — allows all crawlers, disallows `/api/`.
- Both are route files (not static) so they auto-update with new content.

## Affiliate Links

### FTC Disclosure (Required)
Every page that shows product affiliate links MUST include this disclosure banner:

```tsx
<div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/5 border border-violet-500/10 mb-6">
  <svg ...info icon... />
  <p className="text-slate-500 text-xs">
    As an Amazon Associate, AutomationForge earns from qualifying purchases.
    Product links below are affiliate links — they cost you nothing extra
    and help keep this tool free.
  </p>
</div>
```

### Link Attributes
All outbound affiliate `<a>` tags must have:
- `target="_blank"`
- `rel="noopener noreferrer nofollow"`
- An `onClick` handler that fires a tracking event to `/api/events`

### Click Tracking
```ts
fetch('/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'outbound_click',
    metadata: { name, network, url },
  }),
});
```

### Product Images
- Stored in `/public/products/` as PNG files.
- Use Next.js `<Image>` component with explicit `width`/`height`.
- Product DB has `imageUrl` field (relative path like `/products/shelly-relay.png`).

## Footer Disclosure
The site footer already includes:
> "AutomationForge is a participant in the Amazon Services LLC Associates Program."

This satisfies FTC disclosure requirements when combined with the per-page banner.
