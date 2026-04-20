# Skill: Testing — AutomationForge

## Stack

- **Playwright** for E2E browser tests.
- Config: `playwright.config.ts` — runs against `http://localhost:3003`.
- Test dir: `e2e/`.

## Running Tests

```bash
# Install browsers (one-time, requires sudo)
sudo npx playwright install chromium --with-deps

# Run all tests
npm test

# Run with UI mode
npm run test:ui

# Run a specific test file
npx playwright test e2e/build.spec.ts
```

## What to Test

### Critical User Flows (Must-have)
1. **Build Wizard** (`e2e/build.spec.ts`)
   - Step 1 loads with goal textarea
   - Empty goal shows validation error
   - Advances through all 3 steps
   - Generates code → platform tabs appear
   - Copy button shows "Copied!" feedback

2. **Fix Tool** (`e2e/fix.spec.ts`)
   - Paste area loads
   - Platform auto-detection works (Shelly JS, HA YAML, etc.)
   - Empty input shows validation error
   - Fixes broken YAML (tabs → spaces)
   - Example loader buttons populate textarea
   - Copy button on fixed code works

### Page Smoke Tests (Nice-to-have)
- Home page loads with hero section
- Scripts page loads with filter controls
- Build sheets index shows cards
- Individual build sheet renders code tabs
- Products page shows product grid
- Sitemap.xml returns valid XML

## Test Patterns

### Page Navigation
```ts
await page.goto('/build');
await expect(page.locator('h1')).toContainText('Build Your');
```

### Form Interaction
```ts
await page.fill('#automation-goal', 'Turn on lights when motion detected');
await page.getByText('Next: Select Devices →').click();
```

### Waiting for Async Results
```ts
await page.locator('#generate-btn').click();
await page.waitForSelector('#tab-shelly', { timeout: 10000 });
```

### Checking Copy Button
```ts
const copyBtn = page.locator('#copy-shelly');
await copyBtn.click();
await expect(copyBtn).toContainText('Copied!');
```

## Rules

1. **Always run `npm run build` before testing** to catch TypeScript errors.
2. **Tests must be independent** — no test should depend on state from another.
3. **Use accessible selectors** — prefer `getByText`, `getByRole` over CSS selectors.
4. **Set reasonable timeouts** — 10s for API calls, 5s for UI transitions.
5. **Never test implementation details** — test what the user sees and does.
