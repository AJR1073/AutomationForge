# Skill: Code Quality — AutomationForge

## TypeScript

- **Strict mode** is on. No `any` without `// eslint-disable-next-line` comment.
- All DB query functions live in `src/lib/queries.ts`. Never write raw SQL in pages.
- JSON columns (tags, spec) are stored as strings. Parse with `JSON.parse()` at read time.
- Prefer `interface` over `type` for object shapes. Export interfaces from `types.ts`.

## Prisma 7

- Generated client lives at `src/generated/prisma/`. Do NOT edit generated files.
- The client uses `@prisma/adapter-libsql` (PrismaLibSql) for SQLite.
- Singleton pattern in `src/lib/db.ts` — globalThis cache for HMR in dev.
- Migration: `npx prisma migrate dev --name <description>`.
- After schema change: `npx prisma generate` then rebuild.
- **Seeding:** Use `scripts/seed.js` (plain Node.js + `better-sqlite3`). NOT the Prisma seed hook — Prisma 7's ESM output causes CJS conflicts.

## Next.js App Router

- All page routes are in `src/app/`. Use `page.tsx` for routes, `layout.tsx` for shared UI.
- Server Components by default. Only add `'use client'` when the component needs:
  - `useState`, `useEffect`, event handlers, or browser APIs.
- Use `generateStaticParams()` for SSG pages (build sheets, products).
- Use `generateMetadata()` for dynamic SEO titles/descriptions.
- API routes go in `src/app/api/*/route.ts`. Always return `NextResponse.json()`.

## Engine Architecture

```
src/lib/engine/
├── types.ts           # AutomationSpec interface
├── spec-builder.ts    # Intent → AutomationSpec (deterministic)
├── renderer-shelly.ts # Spec → Shelly JS
├── renderer-ha.ts     # Spec → HA YAML
├── renderer-nodered.ts# Spec → Node-RED JSON
├── renderer-esphome.ts# Spec → ESPHome YAML
└── fixer.ts           # Platform detection + fix broken code
```

- `buildSpec(goal, devices, constraints)` returns an `AutomationSpec`.
- Each renderer takes a spec and returns a code string.
- The fixer heuristically detects platform from code, then applies common fixes.

## File Organization Rules

1. **Components** go in `src/components/`. One component per file. PascalCase filenames.
2. **Lib** code goes in `src/lib/`. kebab-case filenames.
3. **Static assets** go in `public/`. Product images in `public/products/`.
4. **No barrel exports.** Import directly from the file.
5. **No `../../../` imports.** Use the `@/` path alias.
