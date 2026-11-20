const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:5000/patient/change-detection', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText.slice(0, 900));
  console.log('TEXT:\n' + text);
  console.log('ERRORS:\n' + errors.slice(0, 8).join('\n'));
  await page.screenshot({ path: '/tmp/change-detection.png', fullPage: false });
  await browser.close();
})();
