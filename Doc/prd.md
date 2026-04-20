# PRD — Home Automation Script Helper

**Working name:** AutomationForge *(rename anytime)*

**Goal:** A public, SEO-friendly website that generates and fixes working automation code for multiple ecosystems (Shelly, Home Assistant, Node-RED, ESPHome), and monetizes via Google AdSense + affiliate "build sheets" + optional paid upgrades.

---

## 1) Problem

Home automation users waste time:

- Stitching together examples across forums/docs
- Debugging YAML/JSON/JS edge-cases
- Figuring out what hardware is compatible

They want **copy-paste-deploy code** and a clear "what do I need to buy to make this work" list.

---

## 2) Target Users

| User | Need |
|---|---|
| DIY Home Automator | Wants an automation to "just work" |
| Home Assistant power user | Wants proper YAML, entities, conditions, and troubleshooting |
| Node-RED builder | Wants importable flows that run now |
| ESPHome tinkerer | Wants ready YAML snippets + pin/sensor notes |
| Installer/consultant | Wants faster delivery + reusable templates |

---

## 3) Core Value Proposition

- **Describe the automation** → outputs `AutomationSpec` + platform-specific code (Shelly/HA/Node-RED/ESPHome)
- **Paste code/config** → detects platform → fixes → explains changes → returns deployable result
- **Build Sheet** for every automation → parts list + alternatives + links (affiliate) + safety notes

---

## 4) MVP Scope

### Pages

| Route | Description |
|---|---|
| `/` | Home (search, categories, featured build sheets) |
| `/build` | Wizard → generates AutomationSpec + 4 outputs |
| `/fix` | Paste-to-fix (Shelly JS / HA YAML / Node-RED JSON / ESPHome YAML) |
| `/scripts` | Library (filters: platform, device, goal) |
| `/build-sheets/[slug]` | Programmatic SEO pages (the main traffic engine) |
| `/products/[tag]` | Category pages ("motion sensors", "relays", "zigbee coordinators") |

### Outputs (All Platforms)

- **Shelly Script (JS)** + deployment steps (Gen2 Script component/RPC concept)
- **Home Assistant automations YAML**
- **Node-RED flow JSON** export/import
- **ESPHome YAML** snippets/config patterns
- **AutomationSpec** (internal canonical format):
  - `intent`, `assumptions`, `devices[]`, `triggers[]`, `conditions[]`, `actions[]`
  - `safety_notes[]`
  - `parts_list[]` (capability tags + quantities)
  - `render_targets[]` (shelly/ha/node_red/esphome)

> Renderers convert `AutomationSpec` → each platform's output.

---

## 5) Non-Goals (for MVP)

- No live device control from the site (no LAN scans, no remote commands)
- No paid accounts required (optional later)
- No marketplace/community submissions until quality + moderation exists

---

## 6) Architecture

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind |
| Backend | Next.js API routes (or separate Node service later) |
| Database | Managed Postgres (Neon, Railway, AWS RDS, DigitalOcean) |
| Caching | Redis later (Upstash) for hot pages |
| LLM | OpenAI (or multi-provider) with strict schema/structured output pattern |
| Search | Postgres full-text search first; vector search later if needed |

---

## 7) Database Schema (Postgres, relational-first)

### Core Tables

```sql
automation_pages   (slug, title, summary, category, primary_intent, status, seo fields)
automation_specs   (page_id, spec_json, version, created_at)
rendered_outputs   (spec_id, platform, code_text, metadata_json, checksum)
scripts            (platform, title, description, code, tags[], tested_notes)
products           (name, brand, capability_tags[], price_hint, image_url, active)
affiliate_links    (product_id, network, url, country, updated_at)
page_views         (slug, referrer, ua, created_at)
events             (conversion events: outbound_click, copy_code, generate_success, fix_success)
```

### Optional Later

```sql
users, saved_projects, project_versions, device_profiles
```

---

## 8) SEO Requirements (must-have)

- **Programmatic pages:** `/build-sheets/[slug]` (30 to start, then scale)
- **Sitemap.xml** auto-generated; `robots.txt`
- **JSON-LD:**
  - `HowTo` (steps + tools)
  - `FAQPage` (common errors)
- **Internal linking loops:** build sheet ↔ scripts ↔ product tags ↔ categories
- **Performance:** ISR/SSG for build sheets; avoid heavy client bundles

---

## 9) Monetization

### A) Google AdSense (primary passive)

Place ads on:
- Build-sheets pages (best traffic)
- Scripts library pages
- Troubleshooting articles

> Keep `/build` and `/fix` lighter on ads to preserve tool UX (higher retention)

### B) Affiliate "Build Sheets" (high-converting)

Every build sheet outputs:
- Required / Nice-to-have / Alternatives
- Capability-tag driven product picks

Start with Amazon, then add direct brand programs later.

### C) Additional Revenue Streams (recommended)

| Stream | Details |
|---|---|
| Pro tier subscription | $9–$19/mo: save projects + version history, "my devices" profiles, private script vault |
| Paid template packs | "30 Best Security Automations Pack", "Energy Monitoring Pack" |
| Lead gen for installers | "Need help installing this?" → referral network |
| Sponsored placements | "Featured device" in product tags (only after traffic) |
| Community marketplace | Vetted user-submitted scripts, rev share (later) |

---

## 10) Compliance & Trust

- Clear AdSense labeling and ad placement policy adherence
- Clear affiliate disclosures (FTC expects clear disclosures)
- Safety disclaimers for mains wiring
- "We don't store your pasted code unless you explicitly save"

---

## 11) Agent Rules

Add Andrej Karpathy's "4 principles" to the project as a repo rulebook.

Create a file in your repo root: **`AGENT_RULES.md`** (or `CLAUDE.md`) containing:

1. **Think Before Coding**
2. **Simplicity First**
3. **Surgical Changes**
4. **Goal-Driven Execution**

Use it as the standing instruction for Antigravity runs: the agent must plan first, keep changes minimal, and define "done" with verifiable checks.

---

## 12) Agent Skills & QA

In your repo, create **`/skills/README.md`** listing and linking the three skills and when to use them:

| Skill | Link | When to Use |
|---|---|---|
| Frontend Design | [claude.com/plugins/frontend-design](https://claude.com/plugins/frontend-design) | Ensures UI isn't generic and is conversion-friendly |
| Playwright | [claude.com/plugins/playwright](https://claude.com/plugins/playwright) | Auto-tests core flows: generate, fix, copy, outbound clicks |
| MCP Builder | [github.com/anthropics/skills/…/mcp-builder](https://github.com/anthropics/skills/tree/main/skills/mcp-builder) | Future: add tool integrations (device docs fetch, parts catalog sync, etc.) |

> See [Anthropic's Agent Skills concept](https://anthropic.com) for background.
