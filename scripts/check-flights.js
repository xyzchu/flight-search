const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============ CONFIGURE HERE ============
const baseDates = [
  new Date('2026-06-01'),  // Leg 1: BNE → HKG
  new Date('2026-06-07'),  // Leg 2: HKG → NRT
  new Date('2026-06-14'),  // Leg 3: NRT → BNE
];
const weekShifts = [0, 1, 2, 3, 4];

const airportSwaps = [
  { from: 'PVG', to: 'NRT' }
];
// ========================================

const templateTfs = 'CBwQAhooEgoyMDI3LTAyLTExMgJDWGoNCAISCS9tLzAxYjhqanIHCAESA0hLRxoeEgoyMDI3LTAyLTExagcIARIDSEtHcgcIARIDUFZHGh4SCjIwMjctMDItMTdqBwgBEgNQVkdyBwgBEgNCTkVAAUgBcAGCAQsI____________AZgBAw';

function b64urlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64');
}

function b64urlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function replaceDates(buf, dates) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  let searchOffset = 0;
  for (let i = 0; i < dates.length; i++) {
    for (let j = searchOffset; j <= buf.length - 10; j++) {
      const candidate = buf.slice(j, j + 10).toString('ascii');
      if (datePattern.test(candidate)) {
        buf.write(dates[i], j, 10, 'ascii');
        searchOffset = j + 10;
        break;
      }
    }
  }
  return buf;
}

function replaceAirports(buf, swaps) {
  for (const { from, to } of swaps) {
    if (from.length !== to.length) continue;
    for (let j = 0; j <= buf.length - from.length; j++) {
      if (buf.slice(j, j + from.length).toString('ascii') === from) {
        buf.write(to, j, to.length, 'ascii');
      }
    }
  }
  return buf;
}

function addWeeks(baseDate, weeks) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function buildUrl(dates) {
  let buf = b64urlDecode(templateTfs);
  buf = replaceDates(buf, dates);
  buf = replaceAirports(buf, airportSwaps);
  return `https://www.google.com/travel/flights/search?tfs=${b64urlEncode(buf)}&tfu=EgYIABAAGAA`;
}

async function waitForFlightResults(page, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const hasResults = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return (text.includes('A$') || text.includes('US$') || text.includes('$')) &&
             (text.includes('hr') || text.includes('stop') || text.includes('nonstop'));
    });
    if (hasResults) return true;
    await delay(2000);
  }
  return false;
}

async function extractFlights(page) {
  return page.evaluate(() => {
    const items = [];
    document.querySelectorAll('li').forEach(row => {
      const text = row.textContent;
      if (text.includes('$') && (text.includes('hr') || text.includes('stop'))) {
        items.push(text.replace(/\s+/g, ' ').trim().substring(0, 300));
      }
    });
    return items.slice(0, 10);
  });
}

function extractCheapestPrice(flights) {
  let cheapest = null;
  for (const f of flights) {
    const matches = f.match(/A\$[\d,]+/g);
    if (matches) {
      for (const m of matches) {
        const val = parseInt(m.replace('A$', '').replace(/,/g, ''), 10);
        if (cheapest === null || val < cheapest) cheapest = val;
      }
    }
  }
  return cheapest;
}

(async () => {
  const scriptsDir = path.resolve(__dirname);
  fs.readdirSync(scriptsDir).forEach(file => {
    if (file.endsWith('.png') || file.endsWith('.txt')) {
      fs.unlinkSync(path.join(scriptsDir, file));
      console.log(`🗑️  Deleted ${file}`);
    }
  });

  const userDataDir = path.join(scriptsDir, '.browser-profile');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    viewport: { width: 1280, height: 900 },
    locale: 'en-AU',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });

  const page = context.pages()[0] || await context.newPage();
  page.setDefaultTimeout(60000);

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const summary = [];

  for (const shift of weekShifts) {
    const targetDates = baseDates.map(d => addWeeks(d, shift));

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Week +${shift}: ${targetDates.join(' / ')}`);
    console.log('='.repeat(50));

    const url = buildUrl(targetDates);
    console.log(`  URL: ${url}`);
    console.log(`  Loading...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log(`  Waiting for flight results...`);
    await waitForFlightResults(page, 30000);
    await delay(3000);

    let flights = await extractFlights(page);

    if (flights.length === 0) {
      console.log('  No results — waiting 10s and retrying...');
      await delay(10000);
      flights = await extractFlights(page);
    }

    if (flights.length === 0) {
      console.log('  Still no results — reloading...');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitForFlightResults(page, 30000);
      await delay(5000);
      flights = await extractFlights(page);
    }

    const cheapest = extractCheapestPrice(flights);
    console.log(`  ✅ Found ${flights.length} results, Cheapest: ${cheapest ? `A$${cheapest}` : 'N/A'}`);

    flights.forEach((f, i) => console.log(`    [${i}] ${f.substring(0, 120)}`));

    await page.screenshot({ path: path.join(scriptsDir, `week${shift}.png`), fullPage: true });
    summary.push({ week: shift, dates: targetDates, cheapest, resultCount: flights.length });

    if (shift < weekShifts[weekShifts.length - 1]) {
      console.log(`  Pausing 5s before next week...`);
      await delay(5000);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('PRICE SUMMARY');
  console.log('='.repeat(50));
  console.log('Week | Leg 1        | Leg 2        | Leg 3        | Cheapest');
  console.log('-----|--------------|--------------|--------------|----------');
  for (const s of summary) {
    console.log(
      ` +${s.week}  | ${s.dates[0]} | ${s.dates[1]} | ${s.dates[2]} | ${s.cheapest ? `A$${s.cheapest.toLocaleString()}` : 'N/A'}`
    );
  }

  await context.close();
  console.log('\nDone!');
})();