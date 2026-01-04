import { test, expect } from '@playwright/test';

test.describe('Bottom Panel Basic Check', () => {
  test('should load application and check basic structure', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check if the page loads without errors
    const title = await page.title();
    console.log('Page title:', title);

    // Check for any errors in console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Check if body has content
    const bodyText = await page.textContent('body');
    console.log('Body text length:', bodyText?.length);

    // Try to find bottom panel by class instead of data-testid
    const bottomPanelByClass = await page.locator('.border-t.border-border.bg-surface').count();
    console.log('Bottom panel elements found by class:', bottomPanelByClass);

    // Check for any visible bottom panel
    const bottomPanels = await page.locator('*').filter({ hasText: /Positions|Open Orders|Order History|Trade History/i }).count();
    console.log('Elements with tab text:', bottomPanels);

    // Check if header is present
    const header = await page.locator('[data-testid="header"]').count();
    console.log('Header elements found:', header);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-app-load.png' });
  });
});