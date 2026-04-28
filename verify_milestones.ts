import { chromium, devices } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['iPhone 12']);
  const page = await context.newPage();
  
  try {
    console.log('Navigating to game...');
    await page.goto('http://localhost:5173/SmashMine/');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'title_screen.png' });
    
    console.log('Checking for Shop button...');
    const shopBtn = await page.$('#shop-btn');
    if (!shopBtn) throw new Error('Shop button not found');
    
    console.log('Clicking Shop...');
    await shopBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'shop_screen.png' });
    
    console.log('Checking for Shop back button...');
    const backBtn = await page.$('#shop-back-btn');
    if (!backBtn) throw new Error('Shop back button not found');
    await backBtn.click();
    await page.waitForTimeout(500);
    
    console.log('Checking for Start button...');
    const startBtn = await page.$('#start-btn');
    if (!startBtn) throw new Error('Start button not found');
    
    console.log('Clicking Start...');
    await startBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'mission_select.png' });
    
    console.log('Checking for Mission 1...');
    const mission = await page.$('.mission-card[data-index="0"]');
    if (!mission) throw new Error('Mission 1 not found');
    
    console.log('Starting Mission 1...');
    await mission.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'gameplay_start.png' });
    
    console.log('Verification successful');
  } catch (e) {
    console.error('Verification failed:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
