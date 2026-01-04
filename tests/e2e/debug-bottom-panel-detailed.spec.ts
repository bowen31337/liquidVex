import { test, expect } from '@playwright/test';

test.describe('Bottom Panel Debug', () => {
  test('should load application and check for errors', async ({ page }) => {
    // Capture console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Check console errors
    console.log('Console errors found:', errors.length);
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`, error);
    });

    // Check page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check if body has any content
    const body = await page.locator('body');
    const bodyText = await body.textContent();
    console.log('Body text length:', bodyText?.length || 0);

    // Check if there are any elements with class that might be the bottom panel
    const elements = await page.locator('*').all();
    console.log('Total elements found:', elements.length);

    // Look for elements that might contain the bottom panel
    const possibleBottomPanel = await page.locator('*').filter({
      hasText: /Positions|Open Orders|Order History|Trade History|Calculator/
    }).all();

    console.log('Elements with tab text:', possibleBottomPanel.length);

    // Check for any div with border classes
    const borderedElements = await page.locator('div[class*="border"]').all();
    console.log('Bordered elements:', borderedElements.length);

    // Check for any elements with surface classes
    const surfaceElements = await page.locator('div[class*="surface"]').all();
    console.log('Surface elements:', surfaceElements.length);

    // Take screenshot
    await page.screenshot({ path: 'full-page-screenshot.png', fullPage: true });

    // Check for any visible elements at the bottom of the page
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    console.log('Viewport height:', viewportHeight);

    // Look for elements in the bottom 200px
    const bottomElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const bottomElements = [];
      const viewportHeight = window.innerHeight;

      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Check if element is in bottom 200px
        if (rect.bottom > viewportHeight - 200 && rect.top < viewportHeight) {
          bottomElements.push({
            tag: el.tagName,
            classes: el.className,
            text: el.textContent?.slice(0, 50),
            rect: rect
          });
        }
      });

      return bottomElements;
    });

    console.log('Elements in bottom 200px:', bottomElements.length);
    bottomElements.slice(0, 5).forEach((el, index) => {
      console.log(`Bottom element ${index + 1}:`, el);
    });
  });
});