# Skill: Frontend Design — AutomationForge

## Design System

- **Theme:** Dark glassmorphism. Background: `#0a0a1a` → `#0f0f23` gradient.
- **Glass cards:** `backdrop-blur-xl`, `bg-white/5`, `border border-white/10`, `rounded-2xl`.
- **Typography:** `Inter` from Google Fonts. Headings are `font-extrabold`, body is `text-slate-400`.
- **Gradient text:** `.gradient-text` — purple → cyan → emerald sweep.
- **Accent colors:** Violet-500 primary, Emerald-400 success, Amber-400 warning, Rose-400 error.

## Component Conventions

### Buttons
- `.btn-primary` — gradient violet→indigo, white text, used for primary CTAs.
- `.btn-secondary` — transparent with violet border, used for secondary actions.
- `.btn-ghost` — no border, hover shows `bg-white/5`.
- All buttons: `rounded-xl`, `font-semibold`, smooth `transition-all`.

### ProductCard
- Two variants: **full** (grid card with image, price badge, tags, CTA) and **compact** (inline for parts lists).
- Always pass `imageUrl` from the DB. Images are in `/public/products/`.
- Amazon links must have `rel="noopener noreferrer nofollow"` and fire a tracking event via `/api/events`.

### CodeBlock
- Traffic light dots (red/amber/green) in header.
- Platform badge (JAVASCRIPT, YAML, JSON) in header.
- Copy button with "Copied!" feedback state.
- Font: `font-mono`, bg: glass card with subtle border.

### PlatformTabs
- 5 tabs: Shelly | HA | Node-RED | ESPHome | Explanation.
- Active tab has animated underline (violet gradient).
- Tab content renders a `<CodeBlock>`.

## Rules for UI Work

1. **Never use plain colors.** Always use the curated palette from CSS variables.
2. **Every interactive element needs hover/active states.** Transitions should be 200ms.
3. **Use Next.js `<Image>` component** for all product images. Never use raw `<img>`.
4. **Mobile-first.** All layouts must work at 320px width.
5. **'use client'** only on components with interactivity (click handlers, state). Page routes stay server-side.
6. **Affiliate disclosure must appear** on any page showing product links.
