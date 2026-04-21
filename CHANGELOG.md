# CHANGELOG

## [Unreleased] — LLM Spec Generation + Quality Gate Upgrade

### Added
- **LLM-based spec generation** (`src/lib/ai/spec-generator.ts`): Uses OpenAI structured output (JSON schema mode) to generate precise `AutomationSpec` objects. 15s timeout, falls back to heuristics silently on any failure.
- **AutomationSpec schema + validator** (`src/lib/ai/schema.ts`): JSON Schema definition for OpenAI and runtime validator (`validateSpec`) for defense-in-depth.
- **Quality gate validators** (`src/lib/engine/validators.ts`): Real YAML parsing (via `yaml` package), JSON/Node-RED validation, and placeholder detection (`YOUR_WEBHOOK_URL`, `TODO`, `<PLACEHOLDER>`, etc.).
- **Power-monitoring Shelly pattern**: Shelly renderer now detects power-threshold intents and generates `apower`-based polling with `Timer.set()`, hold-counter logic, and HTTP webhook notifications.
- **Required Inputs panel**: Both Shelly scripts and the `/fix` page now surface placeholder values the user must configure.
- **Before/After diff view** (`/fix` page): Side-by-side code panels show original and fixed code when changes are applied.
- **Colored platform detection chip** (`/fix` page): Each platform (Shelly, HA, Node-RED, ESPHome) gets a distinct color chip.
- **Per-output validation** in `/api/build` response: Each platform output includes `{ok, errors[], placeholders[]}`.
- **`source` field** in `/api/build` response: Indicates whether output came from `'llm'` or `'heuristic'`.
- **Playwright E2E tests** (`e2e/build-fix.spec.ts`): Tests for /build happy path, /fix platform detection + fix, and /fix parse error display.
- **`.env.example`**: Documents `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `NEXT_PUBLIC_SITE_URL`.

### Changed
- `/api/build` now tries LLM generation first, validates, then falls back to `buildSpecFromWizard()`.
- `/api/fix` now returns `placeholders[]` alongside the fix result.
- Shelly renderer completely rewritten with two render paths: standard event-driven and power-monitoring.
- Shelly `checkConditions()` now generates real executable time/state checks instead of `return true`.

### Dependencies
- Added `yaml` (YAML parsing for ESPHome/HA validators — ~40KB, zero transitive deps).

### Environment Variables
- `OPENAI_API_KEY` — enables LLM generation (optional, falls back gracefully)
- `OPENAI_MODEL` — defaults to `gpt-4o-mini`
