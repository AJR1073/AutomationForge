import { test, expect } from '@playwright/test';

test.describe('/helpers pages', () => {
  test('helper page renders all required sections', async ({ page }) => {
    await page.goto('/helpers/esphome-dht22-basic');

    // Title exists
    await expect(page.locator('#helper-title')).toBeVisible();
    await expect(page.locator('#helper-title')).toContainText('DHT22');

    // Code block section exists
    await expect(page.locator('#helper-code-blocks')).toBeVisible();

    // Required inputs box (DHT22 has YOUR_* placeholders)
    await expect(page.locator('#helper-required-inputs')).toBeVisible();

    // Troubleshooting section
    await expect(page.locator('#helper-troubleshooting')).toBeVisible();

    // FAQ section
    await expect(page.locator('#helper-faqs')).toBeVisible();

    // Related build sheets
    await expect(page.locator('#helper-related-build-sheets')).toBeVisible();

    // Parts list section
    await expect(page.locator('#helper-parts-list')).toBeVisible();

    // Breadcrumb
    await expect(page.locator('#helper-breadcrumb')).toBeVisible();
  });

  test('sitemap includes helper URLs', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    const body = await response.text();
    expect(body).toContain('/helpers/esphome-dht22-basic');
    expect(body).toContain('/helpers/mqtt-topic-naming-convention-home');
  });
});
