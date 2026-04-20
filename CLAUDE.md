# CLAUDE.md — AutomationForge

> Project-level instructions for AI coding agents. Loaded automatically by Claude Code, Cursor, and similar tools.

## Project Overview

AutomationForge is an SEO-focused web app that generates and fixes home automation code for 4 platforms: Shelly, Home Assistant, Node-RED, and ESPHome. No accounts required.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Database:** SQLite via Prisma 7 + @prisma/adapter-libsql (production: swap to Postgres)
- **Seeding:** `scripts/seed.js` using `better-sqlite3` (NOT Prisma seed hook)
- **Testing:** Playwright E2E

## Critical Rules

1. **Think before coding.** State your assumptions. Ask if unclear.
2. **Simplicity first.** Minimal solution > over-engineered abstraction.
3. **Surgical changes.** Touch ONLY the files that need to change.
4. **No unsolicited renovations.** Don't refactor what you weren't asked to.
5. **Verify success.** Run `npm run build` after every meaningful change.
6. **Read before writing.** View a file before editing it.

## Key Commands

```bash
npm run dev          # Dev server (Turbopack, port 3003)
npm run build        # Production build — must pass before any PR
npm run seed         # Reseed database (30 build sheets, 10 scripts, 15 products)
npm test             # Playwright E2E tests
```

## Skills

Read the relevant skill file in `skills/` before starting work:

- **UI work** → `skills/frontend-design.md`
- **Backend/data work** → `skills/code-quality.md`
- **SEO or affiliate changes** → `skills/seo-affiliate.md`
- **Writing tests** → `skills/testing.md`

## Architecture Quick Reference

```
src/app/                 # Next.js pages and API routes
src/components/          # Reusable UI components
src/lib/db.ts            # Prisma singleton (PrismaLibSql adapter)
src/lib/queries.ts       # All DB queries (typed)
src/lib/engine/          # Spec builder + 4 renderers + fixer
src/generated/prisma/    # Prisma generated client (DO NOT EDIT)
public/products/         # Product images (PNG)
scripts/seed.js          # Database seeder
prisma/schema.prisma     # Database schema
skills/                  # Agent skill files (this pattern)
```

## Common Gotchas

- **Prisma 7 is ESM-only.** The seed script uses `better-sqlite3` directly to avoid CJS/ESM conflicts.
- **Product images** must be passed as `imageUrl` prop to `ProductCard`. They're served from `/products/`.
- **Affiliate links** need `rel="noopener noreferrer nofollow"` and click tracking via `/api/events`.
- **`'use client'`** — only add to components with interactivity. Page routes stay server-side.
- **SQLite DB** is at `dev.db` in the app root (not `prisma/dev.db`).
