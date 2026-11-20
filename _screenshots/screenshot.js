const puppeteer = require('puppeteer');
const path = require('path');
const outDir = __dirname;

const apps = [
  { name: 'landing', url: 'http://localhost:5173/' }
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  for (const app of apps) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(app.url, { waitUntil: 'networkidle2', timeout: 25000 });
    await page.waitForTimeout(900);
    const file = path.join(outDir, app.name + '.png');
    await page.screenshot({ path: file, fullPage: false, type: 'png' });
    await page.close();
    console.log('OK', app.name, file);
  }

  await browser.close();
  process.exit(0);
})().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
