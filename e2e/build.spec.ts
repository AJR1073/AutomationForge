import { test, expect } from '@playwright/test';

test.describe('/build wizard', () => {
  test('loads step 1 with goal input', async ({ page }) => {
    await page.goto('/build');
    await expect(page.locator('h1')).toContainText('Build Your');
    await expect(page.locator('#automation-goal')).toBeVisible();
    await expect(page.getByText('Quick starts:')).toBeVisible();
  });

  test('validates empty goal', async ({ page }) => {
    await page.goto('/build');
    await page.getByText('Next: Select Devices →').click();
    await expect(page.getByText('Please describe your goal first.')).toBeVisible();
  });

  test('advances through all 3 steps', async ({ page }) => {
    await page.goto('/build');

    // Step 1: Enter goal
    await page.fill('#automation-goal', 'Turn on lights when motion is detected at night');
    await page.getByText('Next: Select Devices →').click();

    // Step 2: Select a device
    await expect(page.getByText('Which devices are involved?')).toBeVisible();
    await page.getByText('Motion Sensor').click(); // select motion_sensor
    await page.getByText('Next: Platforms →').click();

    // Step 3: Platform selection + generate
    await expect(page.getByText('Generate code for which platforms?')).toBeVisible();
    await expect(page.locator('#generate-btn')).toBeVisible();
  });

  test('generates code and shows platform tabs', async ({ page }) => {
    await page.goto('/build');
    await page.fill('#automation-goal', 'Turn on hallway light when motion is detected');
    await page.getByText('Next: Select Devices →').click();
    await page.getByText('Next: Platforms →').click();
    await page.locator('#generate-btn').click();

    // Wait for results
    await page.waitForSelector('#tab-shelly, text=Your Automation Code', { timeout: 10000 });

    // Check all platform tabs are present
    await expect(page.locator('#tab-shelly')).toBeVisible();
    await expect(page.locator('#tab-ha')).toBeVisible();
    await expect(page.locator('#tab-nodered')).toBeVisible();
    await expect(page.locator('#tab-esphome')).toBeVisible();
    await expect(page.locator('#tab-explanation')).toBeVisible();
  });

  test('copy button works on generated code', async ({ page }) => {
    await page.goto('/build');
    await page.fill('#automation-goal', 'Turn on lights when motion detected');
    await page.getByText('Next: Select Devices →').click();
    await page.getByText('Next: Platforms →').click();
    await page.locator('#generate-btn').click();

    await page.waitForSelector('#tab-shelly', { timeout: 10000 });

    const copyBtn = page.locator('#copy-shelly');
    await copyBtn.click();
    // After click, button should show "Copied!"
    await expect(copyBtn).toContainText('Copied!');
  });
});
