import { chromium, devices } from 'playwright-core';

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext(devices['iPhone 12']);
  const page = await context.newPage();
  
  try {
    console.log('Navigating to PROD...');
    await page.goto('https://bigknoxy.github.io/SmashMine/');
    await page.waitForTimeout(5000); // Allow deploy to propagate
    await page.screenshot({ path: 'prod_final.png' });
    
    const version = await page.evaluate(() => document.getElementById('version-tag')?.textContent);
    console.log('Detected version:', version);
    
    if (version !== 'v0.1.17') {
      console.warn('Version mismatch! Might still be deploying...');
    }
    
    const shopBtn = await page.$('#shop-btn');
    if (shopBtn) console.log('Shop button detected on PROD');
    
    console.log('Production verification complete');
  } catch (e) {
    console.error('Prod Verification failed:', e.message);
  } finally {
    await browser.close();
  }
})();
