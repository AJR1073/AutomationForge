# AutomationForge

A home automation code generator, script fixer, and parts sourcing platform. Describe what you want to automate and get working code for **Shelly**, **Home Assistant**, **Node-RED**, and **ESPHome** — plus a parts list with one-click purchasing.

**Live:** [automationforge.vercel.app](https://automationforge.vercel.app)

---

## What it does

| Feature | Description |
|---------|-------------|
| **Build Wizard** | Describe your goal → get working code for 4 platforms |
| **Script Fixer** | Paste broken automation code → get fixes and explanations |
| **30+ Build Sheets** | Pre-built automation guides with code, parts lists, and safety notes |
| **Script Library** | Searchable collection of ready-to-use automation scripts |
| **Parts Lists** | Every guide links to recommended hardware on Amazon |
| **Buy All Button** | One click adds all parts to your Amazon cart |

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL (Neon via Vercel)
- **ORM:** Prisma 7 with PrismaPg adapter
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Design:** Custom CSS — zinc/teal editorial palette, no UI frameworks

## Project Structure

```
src/
├── app/
│   ├── build/              # Build wizard (code generator)
│   ├── fix/                # Script fixer tool
│   ├── scripts/            # Script library
│   ├── build-sheets/       # 30+ automation guides (ISR)
│   ├── products/[tag]/     # Product pages by capability
│   └── api/
│       ├── build/          # Code generation API
│       ├── fix/            # Script fixing API
│       ├── products/       # Product lookup API
│       └── events/         # Analytics tracking
├── components/
│   ├── BuyAllButton.tsx    # Amazon multi-cart button
│   ├── ProductCard.tsx     # Product display card
│   ├── PlatformTabs.tsx    # Code viewer with platform tabs
│   ├── CodeBlock.tsx       # Syntax-highlighted code
│   └── Navbar.tsx / Footer.tsx
├── lib/
│   ├── engine/             # Code generation engine
│   │   ├── spec-builder.ts # Automation spec from user input
│   │   ├── renderer-shelly.ts
│   │   ├── renderer-ha.ts
│   │   ├── renderer-nodered.ts
│   │   └── renderer-esphome.ts
│   ├── db.ts               # Prisma client
│   └── queries.ts          # Database queries
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # 15 products, 10 scripts, 30 build sheets
```

## Supported Platforms

| Platform | Output |
|----------|--------|
| **Shelly** | Gen2 JavaScript scripts for Shelly devices |
| **Home Assistant** | YAML automations for HA |
| **Node-RED** | JSON flow definitions |
| **ESPHome** | YAML device configurations for ESP32 |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or use SQLite for local dev)

### Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your DATABASE_URL

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Site URL (for SEO/sitemap) |

## Monetization

- **Amazon Associates** — affiliate links on all product recommendations
- **Buy All Button** — multi-item cart URL with affiliate tag
- **AdSense** — ad slots on build sheet pages (placeholder)

Every product link uses the Associate ID `automforge20-20`. All affiliate relationships are disclosed on-page per Amazon's requirements.

## SEO

- 30+ statically generated build sheet pages with ISR
- 20+ product tag pages
- JSON-LD structured data
- Auto-generated sitemap and robots.txt
- Descriptive meta titles and descriptions on every page

## License

Private — All rights reserved.
