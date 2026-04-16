require('dotenv').config({ path: __dirname + '/.env' });
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

/* ─── Config ─── */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CHECK_MINS = parseInt(process.env.CHECK_INTERVAL_MINUTES || '30', 10);
const REMOTE_CHECK_SECS = parseInt(process.env.REMOTE_REQUEST_INTERVAL_SECONDS || '60', 10);
const RUN_ONCE = process.argv.includes('--once');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
let cycleInProgress = false;
let remoteCycleInProgress = false;
const activeSearchRuns = new Set();

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

function getTravelDateMode(job) {
  return job.travel_date_mode || (job.travel_start_date ? 'custom' : 'url');
}

/* ─── Compute base offset from travel date settings ─── */
function computeBaseOffset(job) {
  // Determine mode: use saved mode, or infer from old records
  const mode = getTravelDateMode(job);

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

function computeEffectiveShiftStart(job) {
  const requestedStart = job.shift_start ?? 0;
  if (getTravelDateMode(job) !== 'custom' || !job.travel_start_date) {
    return requestedStart;
  }

  const firstDeparture = parseDateOnly(job.travel_start_date);
  if (!firstDeparture) return requestedStart;

  const daysPast = Math.floor((startOfTodayLocal() - firstDeparture) / 86400000);
  if (daysPast <= 0) return requestedStart;

  const stepDays = job.shift_step_days || 7;
  const firstFutureShift = Math.ceil(daysPast / stepDays);
  return Math.max(requestedStart, firstFutureShift);
}

function beginSearchRun(searchId) {
  if (activeSearchRuns.has(searchId)) return false;
  activeSearchRuns.add(searchId);
  return true;
}

function endSearchRun(searchId) {
  activeSearchRuns.delete(searchId);
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
  const effectiveShiftStart = computeEffectiveShiftStart(job);

  log(`  Job: "${job.name}" | Shifts ${shift_start}→${shift_end} × ${shift_step_days}d${baseOffset ? ` | Base offset: ${baseOffset}d` : ''}`);
  if (effectiveShiftStart > shift_start) {
    log(`    Skipping past fixed-date shifts before +${effectiveShiftStart}.`);
  }
  if (effectiveShiftStart > shift_end) {
    log('    No future shifts remain for this fixed-date search.');
    return { runId: null, skippedAllPast: true };
  }

  const failedShifts = []; // collect shifts that got no price

  for (let i = effectiveShiftStart; i <= shift_end; i++) {
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

  return { runId, skippedAllPast: false };
}

async function claimRemoteRequest(id) {
  const startedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('remote_job_requests')
    .update({
      status: 'running',
      started_at: startedAt,
      last_heartbeat_at: startedAt,
      error: null,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function completeRemoteRequest(id, result) {
  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from('remote_job_requests')
    .update({
      status: 'completed',
      completed_at: completedAt,
      last_heartbeat_at: completedAt,
      result,
      error: null,
    })
    .eq('id', id);

  if (error) throw error;
}

async function failRemoteRequest(id, message) {
  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from('remote_job_requests')
    .update({
      status: 'failed',
      completed_at: completedAt,
      last_heartbeat_at: completedAt,
      error: message,
    })
    .eq('id', id);

  if (error) throw error;
}

async function heartbeatRemoteRequest(id) {
  const { error } = await supabase
    .from('remote_job_requests')
    .update({ last_heartbeat_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

async function fetchTrackedSearch(searchId) {
  const { data, error } = await supabase
    .from('tracked_searches')
    .select('*')
    .eq('id', searchId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function finalizeTrackedSearchAfterRun(job) {
  const nowIso = new Date().toISOString();
  if ((job.schedule_interval_days || 0) === 0) {
    log(`  "${job.name}" is one-off — marking complete.`);
    await supabase.from('tracked_searches')
      .update({ last_run_at: nowIso, is_active: false })
      .eq('id', job.id);
    return;
  }

  const next = new Date();
  next.setDate(next.getDate() + (job.schedule_interval_days || 1));
  await supabase.from('tracked_searches')
    .update({ last_run_at: nowIso, next_run_at: next.toISOString() })
    .eq('id', job.id);
  log(`  Next run for "${job.name}": ${next.toISOString()}`);
}

async function executeTrackedSearch(page, job) {
  if (!beginSearchRun(job.id)) {
    return { skipped: true, reason: 'Search is already running' };
  }

  try {
    if (job.stop_date && hasStopDatePassed(job.stop_date)) {
      log(`  "${job.name}" past stop date — deactivating.`);
      await supabase.from('tracked_searches')
        .update({ is_active: false })
        .eq('id', job.id);
      return { skipped: true, reason: 'Past stop date' };
    }

    const runResult = await runJob(page, job);
    if (runResult?.skippedAllPast) {
      const nowIso = new Date().toISOString();
      log(`  "${job.name}" has no future shifts left — marking inactive.`);
      await supabase.from('tracked_searches')
        .update({ last_run_at: nowIso, is_active: false, next_run_at: null })
        .eq('id', job.id);
      return { skipped: true, reason: 'No future shifts remain' };
    }

    await finalizeTrackedSearchAfterRun(job);
    return { skipped: false, runId: runResult?.runId || null };
  } finally {
    endSearchRun(job.id);
  }
}

async function processPendingRemoteRequests() {
  if (remoteCycleInProgress) {
    return;
  }
  remoteCycleInProgress = true;

  try {
    const { data: requests, error } = await supabase
      .from('remote_job_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })
      .limit(10);

    if (error) {
      if (error.code !== '42P01') {
        log(`Remote request DB error: ${error.message}`);
      }
      return;
    }
    if (!requests?.length) return;

    log(`Found ${requests.length} pending remote request(s).`);

    const profileDir = path.join(__dirname, '.browser-profile');
    let context = null;
    let page = null;

    for (const row of requests) {
      let claimed = null;
      try {
        claimed = await claimRemoteRequest(row.id);
        if (!claimed) continue;
      } catch (err) {
        log(`Remote request claim failed: ${err.message}`);
        continue;
      }

      const heartbeat = setInterval(() => {
        heartbeatRemoteRequest(row.id).catch(() => {});
      }, 10000);

      try {
        if (row.job_type !== 'run_search') {
          throw new Error(`Unknown job type: ${row.job_type}`);
        }

        const searchId = row.payload?.search_id;
        if (!searchId) {
          throw new Error('Missing payload.search_id');
        }

        const job = await fetchTrackedSearch(searchId);
        if (!job) {
          throw new Error('Tracked search not found');
        }

        if (!page) {
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
          page = context.pages()[0] || await context.newPage();
          page.setDefaultTimeout(60000);
          await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
          });
        }

        log(`Remote request → run "${job.name}"`);
        const result = await executeTrackedSearch(page, { ...job, is_active: true });
        await completeRemoteRequest(row.id, {
          ok: true,
          tracked_search_id: job.id,
          name: job.name,
          skipped: !!result.skipped,
          reason: result.reason || null,
          run_id: result.runId || null,
        });
      } catch (err) {
        log(`Remote request failed: ${err.message}`);
        await failRemoteRequest(row.id, String(err.message || err)).catch(() => {});
      } finally {
        clearInterval(heartbeat);
      }
    }

    if (context) {
      await context.close();
      log('Remote request batch done. Browser closed.');
    }
  } finally {
    remoteCycleInProgress = false;
  }
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
        await executeTrackedSearch(page, job);
      } catch (err) {
        log(`  Job "${job.name}" failed: ${err.message}`);
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
console.log(`  Remote request check: ${REMOTE_CHECK_SECS} seconds`);
console.log(`  Supabase: ${SUPABASE_URL}`);
console.log('');

checkAndRun()
  .then(() => {
    processPendingRemoteRequests().catch(err => log(`Remote cycle error: ${err.message}`));
    if (RUN_ONCE) {
      console.log('\n--once mode: exiting.');
      process.exit(0);
    }
    log(`Daemon running. Checking schedules every ${CHECK_MINS}m and remote requests every ${REMOTE_CHECK_SECS}s. Ctrl+C to stop.\n`);
    setInterval(() => {
      checkAndRun().catch(err => log(`Cycle error: ${err.message}`));
    }, CHECK_MINS * 60 * 1000);
    setInterval(() => {
      processPendingRemoteRequests().catch(err => log(`Remote cycle error: ${err.message}`));
    }, REMOTE_CHECK_SECS * 1000);
  })
  .catch(err => {
    log(`Fatal: ${err.message}`);
    process.exit(1);
  });
