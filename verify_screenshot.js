const puppeteer = require('puppeteer');

(async () => {
  const url = 'http://localhost:3000';
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.goto(url, {waitUntil: 'networkidle2'});
  // Wait for the dashboard text to appear (max 10s)
  await page.waitForTimeout(5000); // give page time to render
  const screenshotPath = 'screenshot.png';
  await page.screenshot({path: screenshotPath, fullPage: true});
  console.log('Screenshot saved to', screenshotPath);
  await browser.close();
})();
