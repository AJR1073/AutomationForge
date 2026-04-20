import { test, expect } from '@playwright/test';

test.describe('/fix paste-to-fix', () => {
  test('loads with textarea and example loaders', async ({ page }) => {
    await page.goto('/fix');
    await expect(page.locator('h1')).toContainText('Fix My');
    await expect(page.locator('#fix-input')).toBeVisible();
    await expect(page.locator('#fix-btn')).toBeVisible();
    await expect(page.getByText('Load example:')).toBeVisible();
  });

  test('detects Shelly platform from pasted JS', async ({ page }) => {
    await page.goto('/fix');
    await page.fill('#fix-input', 'Shelly.addEventHandler(function(event) { return; });');
    await expect(page.getByText('Detected:')).toBeVisible();
    await expect(page.getByText(/Shelly JS/)).toBeVisible();
  });

  test('detects HA YAML platform', async ({ page }) => {
    await page.goto('/fix');
    await page.fill('#fix-input', 'automation:\n  - alias: "Test"\n    trigger:\n      - platform: state\n        entity_id: binary_sensor.test');
    await expect(page.getByText(/Home Assistant/)).toBeVisible();
  });

  test('validates empty code input', async ({ page }) => {
    await page.goto('/fix');
    await page.locator('#fix-btn').click();
    await expect(page.getByText('Paste your code first.')).toBeVisible();
  });

  test('fixes broken HA YAML with tab indentation', async ({ page }) => {
    await page.goto('/fix');
    const brokenYaml = 'automation:\n\talias: "Motion Light"\n\ttrigger:\n\t  platform: state\n\t  entity_id: binary_sensor.motion\n\taction:\n\t  service: light.turn_on';
    await page.fill('#fix-input', brokenYaml);
    await page.locator('#fix-btn').click();

    // Wait for results
    await page.waitForSelector('text=Fixed Code', { timeout: 10000 });
    await expect(page.getByText('Fixed Code')).toBeVisible();
    await expect(page.getByText(/Replaced tab indentation/)).toBeVisible();
  });

  test('loads Shelly example and fixes it', async ({ page }) => {
    await page.goto('/fix');
    // Click the Shelly example button
    await page.getByText('⚡ Shelly JS').first().click();
    await expect(page.locator('#fix-input')).not.toBeEmpty();
    
    await page.locator('#fix-btn').click();
    await page.waitForSelector('text=Fixed Code', { timeout: 10000 });
    await expect(page.getByText('Fixed Code')).toBeVisible();
  });

  test('copy button on fixed code', async ({ page }) => {
    await page.goto('/fix');
    await page.getByText('🏠 Home Assistant YAML').click();
    await page.locator('#fix-btn').click();
    await page.waitForSelector('text=Fixed Code', { timeout: 10000 });

    const copyBtn = page.locator('#copy-ha');
    await copyBtn.click();
    await expect(copyBtn).toContainText('Copied!');
  });
});
