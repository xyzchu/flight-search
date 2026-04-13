require('dotenv').config({ path: __dirname + '/.env' });
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

/* ─── Config ─── */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHECK_MINS = parseInt(process.env.CHECK_INTERVAL_MINUTES || '30', 10);
const RUN_ONCE = process.argv.includes('--once');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let cycleInProgress = false;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

/* ─── URL / TFS Helpers ─── */
function b64urlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64');
}

function b64urlEncode(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function extractTfs(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('tfs');
  } catch { return null; }
}

function findDatesInBuffer(buf) {
  const dates = [];
  const re = /^\d{4}-\d{2}-\d{2}$/;
  for (let j = 0; j <= buf.length - 10; j++) {
    const s = buf.slice(j, j + 10).toString('ascii');
    if (re.test(s)) {
      dates.push({ index: j, date: s });
      j += 9;
    }
  }
  return dates;
}

function shiftUrl(baseUrl, shiftDays) {
  const tfs = extractTfs(baseUrl);
  if (!tfs) {
    throw new Error('Base URL is missing a tfs parameter');
  }

  const buf = b64urlDecode(tfs);
  const dates = findDatesInBuffer(buf);
  if (!dates.length) {
    throw new Error('Base URL tfs payload did not contain any travel dates');
  }

  const shiftedDates = [];
  for (const d of dates) {
    const orig = new Date(d.date);
    orig.setDate(orig.getDate() + shiftDays);
    const shifted = orig.toISOString().slice(0, 10);
    buf.write(shifted, d.index, 10, 'ascii');
    shiftedDates.push(shifted);
  }

  const u = new URL(baseUrl);
  u.searchParams.set('tfs', b64urlEncode(buf));
  return { url: u.toString(), shiftedDates };
}

/* ─── Flight Extraction ─── */
async function waitForResults(page, timeoutMs = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await page.evaluate(() => {
      const t = document.body?.innerText || '';
      return (t.includes('A$') || t.includes('US$') || t.includes('$')) &&
             (t.includes('hr') || t.includes('stop') || t.includes('nonstop'));
    });
    if (found) return true;
    await delay(2000);
  }
  return false;
}

async function extractFlights(page) {
  return page.evaluate(() => {
    const items = [];
    document.querySelectorAll('li').forEach(row => {
      const t = row.textContent;
      if (t.includes('$') && (t.includes('hr') || t.includes('stop'))) {
        items.push(t.replace(/\s+/g, ' ').trim().substring(0, 400));
      }
    });
    return items.slice(0, 15);
  });
}

function cheapestPrice(flights) {
  let best = null;
  for (const f of flights) {
    const matches = f.match(/A?\$[\d,]+/g);
    if (matches) {
      for (const m of matches) {
        const v = parseInt(m.replace(/[A$,]/g, ''), 10);
        if (v > 10 && (best === null || v < best)) best = v;
      }
    }
  }
  return best;
}

function parseDateOnly(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function startOfTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function hasStopDatePassed(stopDate) {
  const stopDay = parseDateOnly(stopDate);
  if (!stopDay) return false;
  stopDay.setDate(stopDay.getDate() + 1);
  return startOfTodayLocal() >= stopDay;
}

/* ─── Compute base offset from travel date settings ─── */
function computeBaseOffset(job) {
  // Determine mode: use saved mode, or infer from old records
  const mode = job.travel_date_mode || (job.travel_start_date ? 'custom' : 'url');

  if (mode === 'relative' && job.base_dates?.length) {
    // Dynamic: today + N days
    const days = job.travel_date_relative_days || 14;
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const target = new Date(now);
    target.setDate(target.getDate() + days);
    const firstBase = new Date(job.base_dates[0] + 'T00:00:00Z');
    const offset = Math.round((target - firstBase) / 86400000);
    log(`    Relative mode: +${days}d from today → ${target.toISOString().slice(0, 10)} (base offset: ${offset}d)`);
    return offset;
  }

  if (mode === 'custom' && job.travel_start_date && job.base_dates?.length) {
    // Fixed date
    const travelStart = new Date(job.travel_start_date + 'T00:00:00Z');
    const firstBase = new Date(job.base_dates[0] + 'T00:00:00Z');
    const offset = Math.round((travelStart - firstBase) / 86400000);
    return offset;
  }

  // mode === 'url' or no data → no offset
  return 0;
}

/* ─── Job Runner ─── */
/* ─── Job Runner ─── */
async function runJob(page, job) {
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { shift_start = 0, shift_end = 4, shift_step_days = 7 } = job;

  if (!job.base_url) {
    throw new Error('Tracked search is missing a base URL');
  }

  const baseOffset = computeBaseOffset(job);

  log(`  Job: "${job.name}" | Shifts ${shift_start}→${shift_end} × ${shift_step_days}d${baseOffset ? ` | Base offset: ${baseOffset}d` : ''}`);

  const failedShifts = []; // collect shifts that got no price

  for (let i = shift_start; i <= shift_end; i++) {
    const days = baseOffset + (i * shift_step_days);
    const { url: shiftedUrl, shiftedDates } = shiftUrl(job.base_url, days);

    log(`    Shift +${i} (+${days}d): ${shiftedDates.join(' / ')}`);

    try {
      await page.goto(shiftedUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      let found = await waitForResults(page, 35000);

      if (!found) {
        log(`      No results — retrying...`);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
        found = await waitForResults(page, 25000);
      }

      await delay(3000);
      const flights = await extractFlights(page);
      const price = cheapestPrice(flights);

      log(`      ${flights.length} results | Cheapest: ${price ? `A$${price}` : 'N/A'}`);

      await supabase.from('price_snapshots').insert({
        tracked_search_id: job.id,
        user_id: job.user_id,
        run_id: runId,
        shift_index: i,
        shift_days: days,
        shift_label: `+${i} (${days}d)`,
        shifted_dates: shiftedDates,
        cheapest_price: price,
        currency: 'AUD',
        flights_raw: flights,
        result_count: flights.length,
        url_used: shiftedUrl,
      });

      if (price === null) {
        failedShifts.push({ shiftIndex: i, days, shiftedUrl, shiftedDates });
      }
    } catch (err) {
      log(`      ERROR: ${err.message}`);
      await supabase.from('price_snapshots').insert({
        tracked_search_id: job.id,
        user_id: job.user_id,
        run_id: runId,
        shift_index: i,
        shift_days: days,
        shift_label: `+${i} (${days}d)`,
        shifted_dates: [],
        cheapest_price: null,
        flights_raw: [`ERROR: ${err.message}`],
        result_count: 0,
      });
      failedShifts.push({ shiftIndex: i, days, shiftedDates: [] });
    }

    const wait = 15000 + Math.random() * 15000;
    log(`      Waiting ${Math.round(wait / 1000)}s...`);
    await delay(wait);
  }

  // ─── Retry pass for shifts that got no price ───
  if (failedShifts.length > 0) {
    log(`  🔄 Retrying ${failedShifts.length} failed shift(s): [${failedShifts.map(s => s.shiftIndex).join(', ')}]`);

    for (const shift of failedShifts) {
      const { shiftIndex, days, shiftedDates } = shift;

      log(`    🔄 Retry shift +${shiftIndex} (+${days}d): ${shiftedDates.length ? shiftedDates.join(' / ') : 'dates unavailable'}`);

      try {
        const { url: shiftedUrl } = shiftUrl(job.base_url, days);
        await page.goto(shiftedUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        let found = await waitForResults(page, 35000);

        if (!found) {
          log(`      No results on retry — reloading...`);
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
          found = await waitForResults(page, 25000);
        }

        await delay(3000);
        const flights = await extractFlights(page);
        const price = cheapestPrice(flights);

        if (price !== null) {
          log(`      ✅ Retry succeeded: A$${price}`);
          const { error: updateErr } = await supabase
            .from('price_snapshots')
            .update({
              cheapest_price: price,
              flights_raw: flights,
              result_count: flights.length,
              url_used: shiftedUrl,
              scraped_at: new Date().toISOString(),
            })
            .eq('run_id', runId)
            .eq('shift_index', shiftIndex);

          if (updateErr) {
            log(`      ❌ DB update failed: ${updateErr.message}`);
          }
        } else {
          log(`      ❌ Retry still no price — keeping null`);
        }
      } catch (err) {
        log(`      ❌ Retry error: ${err.message}`);
      }

      const wait = 15000 + Math.random() * 15000;
      log(`      Waiting ${Math.round(wait / 1000)}s...`);
      await delay(wait);
    }
  }

  return runId;
}

/* ─── Main Check Cycle ─── */
async function checkAndRun() {
  if (cycleInProgress) {
    log('Previous cycle still running; skipping this tick.');
    return;
  }
  cycleInProgress = true;
  log('Checking for due jobs...');

  try {
    const now = new Date().toISOString();
    const { data: jobs, error } = await supabase
      .from('tracked_searches')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now)
      .order('next_run_at', { ascending: true });

    if (error) { log(`DB error: ${error.message}`); return; }
    if (!jobs?.length) { log('No jobs due.'); return; }

    log(`Found ${jobs.length} job(s) to run.`);

    const profileDir = path.join(__dirname, '.browser-profile');
    let context;
    try {
      context = await chromium.launchPersistentContext(profileDir, {
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-dev-shm-usage',
        ],
        ignoreDefaultArgs: ['--enable-automation'],
        viewport: { width: 1366, height: 900 },
        locale: 'en-AU',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      });
    } catch (err) {
      log(`Browser launch failed: ${err.message}`);
      return;
    }

    const page = context.pages()[0] || await context.newPage();
    page.setDefaultTimeout(60000);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    for (const job of jobs) {
      if (job.stop_date && hasStopDatePassed(job.stop_date)) {
        log(`  "${job.name}" past stop date — deactivating.`);
        await supabase.from('tracked_searches')
          .update({ is_active: false })
          .eq('id', job.id);
        continue;
      }

      const claimTimestamp = new Date().toISOString();
      const nextPlaceholder = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { data: claimedJobs, error: claimError } = await supabase
        .from('tracked_searches')
        .update({ last_run_at: claimTimestamp, next_run_at: nextPlaceholder })
        .eq('id', job.id)
        .eq('is_active', true)
        .eq('next_run_at', job.next_run_at)
        .select('id');

      if (claimError) {
        log(`  Could not claim "${job.name}": ${claimError.message}`);
        continue;
      }
      if (!claimedJobs?.length) {
        log(`  Skipping "${job.name}" — another cycle already claimed it.`);
        continue;
      }

      try {
        await runJob(page, job);
      } catch (err) {
        log(`  Job "${job.name}" failed: ${err.message}`);
      }

      const nowIso = new Date().toISOString();

      if ((job.schedule_interval_days || 0) === 0) {
        log(`  "${job.name}" is one-off — marking complete.`);
        await supabase.from('tracked_searches')
          .update({ last_run_at: nowIso, is_active: false })
          .eq('id', job.id);
      } else {
        const next = new Date();
        next.setDate(next.getDate() + (job.schedule_interval_days || 1));
        await supabase.from('tracked_searches')
          .update({ last_run_at: nowIso, next_run_at: next.toISOString() })
          .eq('id', job.id);
        log(`  Next run for "${job.name}": ${next.toISOString()}`);
      }

      await delay(5000);
    }

    await context.close();
    log('All jobs done. Browser closed.');
  } finally {
    cycleInProgress = false;
  }
}

/* ─── Start ─── */
console.log('═'.repeat(50));
console.log('  FLIGHT PRICE TRACKER DAEMON');
console.log('═'.repeat(50));
console.log(`  Mode: ${RUN_ONCE ? 'Run once' : 'Daemon (continuous)'}`);
console.log(`  Check interval: ${CHECK_MINS} minutes`);
console.log(`  Supabase: ${SUPABASE_URL}`);
console.log('');

checkAndRun()
  .then(() => {
    if (RUN_ONCE) {
      console.log('\n--once mode: exiting.');
      process.exit(0);
    }
    log(`Daemon running. Checking every ${CHECK_MINS}m. Ctrl+C to stop.\n`);
    setInterval(() => {
      checkAndRun().catch(err => log(`Cycle error: ${err.message}`));
    }, CHECK_MINS * 60 * 1000);
  })
  .catch(err => {
    log(`Fatal: ${err.message}`);
    process.exit(1);
  });
