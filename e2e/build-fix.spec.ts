import { test, expect } from '@playwright/test';

// All tests use MOCK_LLM=1 via env so they're deterministic — no real OpenAI calls.
// Set in playwright.config.ts or via shell: MOCK_LLM=1 npx playwright test

// ── /build happy path ─────────────────────────────────────────────────────────
test('build page: enter goal and get platform output tabs', async ({ page }) => {
  await page.goto('/build');

  // Step 1: enter goal
  await page.locator('#automation-goal').fill('Turn on lights when motion is detected');

  // Advance through the wizard
  await page.getByText('Next: Select Devices →').click();
  await page.getByText('Next: Platforms →').click();

  // Generate code
  await page.locator('#generate-btn').click();

  // Wait for outputs (MOCK_LLM returns instantly)
  await page.waitForSelector('pre, code', { timeout: 15000 });

  // Should have rendered code output
  const codeBlocks = await page.locator('pre, code').count();
  expect(codeBlocks).toBeGreaterThan(0);

  // Should mention "Shelly" somewhere in tabs or output
  const shellyText = await page.locator('text=Shelly').count();
  expect(shellyText).toBeGreaterThan(0);
});

// ── /fix happy path ───────────────────────────────────────────────────────────
test('fix page: broken HA YAML shows platform chip and before/after', async ({ page }) => {
  await page.goto('/fix');

  const brokenYaml = `automation:
\talias: "Motion Light"
\ttrigger:
\t  platform: state
\t  entity_id: binary_sensor.motion
  to: "on"
\taction:
\t  service: light.turn_on
\t  entity_id: light.hallway`;

  await page.fill('#fix-input', brokenYaml);

  // Platform chip should show "Home Assistant YAML"
  await expect(page.getByText('Detected: Home Assistant YAML')).toBeVisible({ timeout: 3000 });

  // Submit
  await page.click('#fix-btn');

  // Wait for result
  await page.waitForSelector('pre, code', { timeout: 10000 });

  // Should show After panel (code was changed: tabs → spaces)
  const afterText = await page.locator('text=After').count();
  expect(afterText).toBeGreaterThan(0);
});

// ── /fix: invalid JSON shows error ────────────────────────────────────────────
test('fix page: invalid JSON shows parse errors', async ({ page }) => {
  await page.goto('/fix');

  await page.fill('#fix-input', '[{"id":"abc","type":"inject","wires":[');

  // Detected as Node-RED
  await expect(page.getByText('Detected: Node-RED JSON')).toBeVisible({ timeout: 3000 });

  await page.click('#fix-btn');
  await page.waitForSelector('text=/error|issue/i', { timeout: 10000 });

  // Should show parse error
  const hasError = await page.locator('text=/parse|JSON|error/i').count();
  expect(hasError).toBeGreaterThan(0);
});
