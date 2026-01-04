import { test, expect } from '@playwright/test';

test.describe('Bottom Panel Simple Check', () => {
  test('should check if bottom panel exists in DOM', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002');

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Check if bottom panel exists in DOM even if not visible
    const bottomPanelExists = await page.locator('[data-testid="bottom-panel"]').count();
    console.log('Bottom panel testid count:', bottomPanelExists);

    // Check if page has any content at all
    const body = await page.locator('body');
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log('Body scroll height:', bodyHeight);

    // Check if there are any divs with bottom panel classes
    const bottomPanelClasses = await page.locator('div.border-t.border-border.bg-surface').count();
    console.log('Bottom panel with classes count:', bottomPanelClasses);

    // Check page source
    const html = await page.content();
    console.log('HTML length:', html.length);

    // Look for bottom panel in HTML
    const hasBottomPanel = html.includes('bottom-panel');
    console.log('Has bottom panel in HTML:', hasBottomPanel);

    // Look for tab text in HTML
    const hasTabText = html.includes('Positions') || html.includes('Open Orders');
    console.log('Has tab text in HTML:', hasTabText);

    if (!hasBottomPanel && !hasTabText) {
      console.log('HTML sample:', html.substring(0, 1000));
    }
  });
});