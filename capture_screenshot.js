const puppeteer = require('puppeteer');
(async () => {
  const url = 'http://localhost:3000';
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.goto(url, {waitUntil: 'networkidle2'});
  const screenshotPath = 'screenshot_only.png';
  await page.screenshot({path: screenshotPath, fullPage: true});
  console.log('Screenshot saved to', screenshotPath);
  await browser.close();
})();
