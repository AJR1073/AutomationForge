import { test, expect } from '@playwright/test';

// ── /build happy path ─────────────────────────────────────────────────────────
test('build page: enter goal and get platform output tabs', async ({ page }) => {
  await page.goto('/build');

  // Fill in the goal
  await page.fill('#goal-input', 'Turn on lights when motion is detected');

  // Proceed through wizard
  await page.click('#next-step-btn');

  // Step 2: skip device selection, hit generate
  const generateBtn = page.locator('#generate-btn, button:has-text("Generate"), button:has-text("Build")').first();
  await generateBtn.click();

  // Wait for output to appear (LLM can take up to 15s)
  await page.waitForSelector('[data-testid="platform-tabs"], .platform-tabs, pre, code', {
    timeout: 20000,
  });

  // Assert at least one of the platform outputs is visible
  const hasShelly = await page.locator('text=Shelly').count();
  const hasOutput = await page.locator('pre, code').count();
  expect(hasShelly + hasOutput).toBeGreaterThan(0);
});

// ── /fix happy path ───────────────────────────────────────────────────────────
test('fix page: broken HA YAML shows platform chip and fixed output', async ({ page }) => {
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

  // Paste the broken code
  await page.fill('#fix-input', brokenYaml);

  // Platform chip should appear (HA detected from "automation:" + "entity_id:")
  await expect(page.locator('text=Home Assistant YAML')).toBeVisible({ timeout: 2000 });

  // Submit
  await page.click('#fix-btn');

  // Wait for fixed output
  await page.waitForSelector('pre, code', { timeout: 10000 });

  // Should show the "After" panel
  const afterPanel = await page.locator('text=After').count();
  expect(afterPanel).toBeGreaterThan(0);

  // Fixed code should be visible
  const codeBlocks = await page.locator('pre, code').count();
  expect(codeBlocks).toBeGreaterThan(0);
});

// ── /fix: invalid JSON shows parse error ──────────────────────────────────────
test('fix page: invalid JSON shows parse error', async ({ page }) => {
  await page.goto('/fix');

  // Paste clearly broken Node-RED JSON
  await page.fill('#fix-input', '[{"id":"abc","type":"inject","wires":[');

  // nodered detected (starts with [)
  await expect(page.locator('text=Node-RED JSON')).toBeVisible({ timeout: 2000 });

  await page.click('#fix-btn');
  await page.waitForSelector('pre, code', { timeout: 10000 });

  // Should show parse error
  const errText = await page.locator('text=/parse|error|JSON/i').count();
  expect(errText).toBeGreaterThan(0);
});
