import { test, expect } from '@playwright/test';

test.describe('Agent Sandbox UX Console E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to local dev server URL
    await page.goto('/');
  });

  test('should load the home page successfully', async ({ page }) => {
    // Expect the main h1 to be visible and contain the app name
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Agent Sandbox');

    // Expect the first paragraph to contain the description
    const desc = page.locator('p').first();
    await expect(desc).toBeVisible();
    await expect(desc).toContainText('Modular, visually stunning console hub');
  });

  test('should navigate to the Cluster Resource Explorer view', async ({ page }) => {
    // Click the cluster resource explorer button
    const explorerBtn = page.getByRole('button', { name: 'Cluster resource explorer' });
    await expect(explorerBtn).toBeVisible();
    await explorerBtn.click();

    // Verify it navigates and shows the breadcrumb navigation back to Home
    const homeBreadcrumb = page.getByRole('button', { name: 'Home' }).first();
    await expect(homeBreadcrumb).toBeVisible();

    // Click Home to navigate back
    await homeBreadcrumb.click();
    await expect(page.locator('h1')).toHaveText('Agent Sandbox');
  });

  test('should navigate to the Warm Pool Telemetry view', async ({ page }) => {
    // Click the warm pool telemetry button
    const telemetryBtn = page.getByRole('button', { name: 'Warm pool telemetry' });
    await expect(telemetryBtn).toBeVisible();
    await telemetryBtn.click();

    // Verify it navigates and displays the Home breadcrumb
    const homeBreadcrumb = page.getByRole('button', { name: 'Home' }).first();
    await expect(homeBreadcrumb).toBeVisible();

    // Click Home to navigate back
    await homeBreadcrumb.click();
    await expect(page.locator('h1')).toHaveText('Agent Sandbox');
  });
});
