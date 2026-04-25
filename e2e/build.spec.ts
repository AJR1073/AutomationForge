import { test, expect } from '@playwright/test';

test.describe('/build wizard', () => {
  test('loads step 1 with goal input', async ({ page }) => {
    await page.goto('/build');
    await expect(page.locator('h1')).toContainText('Build your automation');
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
    await page.getByRole('button', { name: 'Motion Sensor' }).click();
    await page.getByText('Next: Platforms →').click();

    // Step 3: Platform selection + generate
    await expect(page.getByText('Generate code for which platforms?')).toBeVisible();
    await expect(page.locator('#generate-btn')).toBeVisible();
  });

  test('suggests devices from the automation goal', async ({ page }) => {
    await page.goto('/build');
    await page.fill('#automation-goal', 'Turn on hallway light when motion is detected at night');
    await page.getByText('Next: Select Devices →').click();

    await expect(page.getByText('Suggested from your goal.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Motion Sensor.*Suggested/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Smart Light.*Suggested/ })).toBeVisible();
  });

  test('suggests presence and relay for garage arrival automation', async ({ page }) => {
    await page.goto('/build');
    await page.fill('#automation-goal', 'open my grauge door when I come home automatically');
    await page.getByText('Next: Select Devices →').click();

    await expect(page.getByRole('button', { name: /Presence \/ Geofence.*Suggested/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Relay \/ Switch.*Suggested/ })).toBeVisible();
  });

  test('generates code and shows platform tabs', async ({ page }) => {
    await page.goto('/build');
    await page.fill('#automation-goal', 'Turn on hallway light when motion is detected');
    await page.getByText('Next: Select Devices →').click();
    await page.getByText('Next: Platforms →').click();
    await page.locator('#generate-btn').click();

    // Wait for results
    await expect(page.getByText('Your Automation Code')).toBeVisible({ timeout: 10000 });

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

  test('start over resets device selections for a new goal', async ({ page }) => {
    await page.goto('/build');

    // First run: door-focused automation
    await page.fill('#automation-goal', 'Send alert when door left open');
    await page.getByText('Next: Select Devices →').click();
    await page.getByText('Next: Platforms →').click();
    await page.locator('#generate-btn').click();
    await expect(page.getByText('Your Automation Code')).toBeVisible({ timeout: 10000 });

    // Restart and run temperature-focused automation
    await page.getByRole('button', { name: '← Start Over' }).click();
    await page.fill('#automation-goal', 'Turn on fan when temp exceeds 26°C');
    await page.getByText('Next: Select Devices →').click();
    await page.getByText('Next: Platforms →').click();
    await page.locator('#generate-btn').click();

    // Should reflect temp-based parts, not stale door-only selections.
    await expect(page.getByText('Temperature/Humidity Sensor')).toBeVisible({ timeout: 10000 });
  });

  test('buy all link uses prefilled Amazon cart with specific parts', async ({ page }) => {
    await page.goto('/build');
    await page.fill('#automation-goal', 'Turn on hallway light when motion is detected');
    await page.getByText('Next: Select Devices →').click();
    await page.getByText('Next: Platforms →').click();
    await page.locator('#generate-btn').click();

    const buyAll = page.locator('#buy-all-amazon');
    await expect(buyAll).toBeVisible({ timeout: 10000 });
    await expect(buyAll).toHaveAttribute('href', /amazon\.com\/gp\/aws\/cart\/add\.html/);

    const href = await buyAll.getAttribute('href');
    expect(href || '').toContain('ASIN.1=');
    expect(href || '').toContain('Quantity.1=');
    expect(href || '').toContain('tag=automforge20-20');
  });
});
