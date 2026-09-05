// Optional browser QA: install Playwright separately; no runtime/build dependency.
// node tests/browser-check.cjs (or set PLAYWRIGHT_MODULE to its installed module path)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'tmp/browser');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };

const server = http.createServer(async (req, res) => {
    try {
        let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (pathname.startsWith('/sean-swims/')) pathname = pathname.slice('/sean-swims'.length);
        if (pathname.endsWith('/')) pathname += 'index.html';
        const file = path.resolve(root, `.${pathname}`);
        if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
        const body = await fs.readFile(file);
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
        res.end(body);
    } catch { res.writeHead(404).end(); }
});

(async () => {
    await fs.mkdir(output, { recursive: true });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const report = [];
    try {
        for (const [name, width, height, timezoneId, prefix] of [
            ['desktop', 1440, 1000, 'Europe/Dublin', '/sean-swims/'],
            ['mobile', 390, 844, 'America/Los_Angeles', '/sean-swims/'],
            ['mobile-360', 360, 800, 'Europe/Dublin', '/sean-swims/'],
            ['mobile-375', 375, 812, 'Europe/Dublin', '/sean-swims/'],
            ['mobile-414', 414, 896, 'Europe/Dublin', '/sean-swims/'],
            ['mobile-430', 430, 932, 'Europe/Dublin', '/sean-swims/'],
            ['small-mobile', 320, 740, 'Asia/Tokyo', '/sean-swims/'],
            ['tablet', 768, 1024, 'Europe/Dublin', '/']
        ]) {
            const context = await browser.newContext({ viewport: { width, height }, timezoneId });
            const page = await context.newPage();
            await page.clock.setFixedTime(new Date('2026-09-05T09:00:00Z'));
            const errors = [], failedRequests = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
            page.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
            await page.goto(base + prefix, { waitUntil: 'networkidle', timeout: 60000 });
            if (!await page.evaluate(() => Boolean(lastWeatherData))) {
                console.log(JSON.stringify({ name, errors, failedRequests }));
                throw new Error('Weather data unavailable during sky-marker browser validation');
            }
            assert.equal(await page.locator('#next-high-tide').innerText(), '12:37');
            assert.equal(await page.locator('#next-low-tide').innerText(), '18:58');
            assert.equal(await page.locator('#high-tide-countdown').innerText(), 'In 2h 37m');
            assert.equal(await page.locator('#today-tides .tide-pill').count(), 3);
            assert.equal(await page.locator('.weekly-tides-container .tide-row').count(), 7);
            assert.equal(await page.locator('.hero #tide-state').innerText(), '↗ Tide rising');
            assert.equal(await page.locator('.tide-summary > :first-child .label').innerText(), 'High tide');
            assert.equal(await page.locator('.tides-card #tide-state').count(), 0);
            assert.equal((await page.locator('.today-tide-sequence h4').textContent()).replace(/\s+/g, ' ').trim(), "Today's tides · Irish local time");
            assert.equal(await page.locator('#tide-chart-note').innerText(), 'Tide times & heights: Tarbert Island Tide Table 2026');
            const timeline = await page.evaluate(() => {
                const now = Date.now();
                return {
                    ticks: window.tideChartInstance.scales.x.ticks.map(tick => TideEngine.formatTime(tick.value)),
                    markers: tideSkyMarkers(now, now + 86400000),
                    expectedSunrise: lastWeatherData.daily.sunrise,
                    expectedSunset: lastWeatherData.daily.sunset,
                    overflowing: [...document.querySelectorAll('.app-container *')].filter(el => {
                        const r = el.getBoundingClientRect();
                        return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
                    }).map(el => el.id || el.className)
                };
            });
            assert.ok(timeline.ticks.every(tick => /^(00|06|12|18):00$/.test(tick)));
            assert.ok(timeline.markers.some(marker => marker.type === 'sunrise'));
            assert.ok(timeline.markers.some(marker => marker.type === 'sunset'));
            assert.deepEqual(timeline.overflowing, [], `${name} overflowing content`);
            const dimensions = await page.evaluate(() => ({
                viewport: innerWidth, width: document.documentElement.scrollWidth,
                chart: document.getElementById('tideChart').getBoundingClientRect().toJSON(),
                logo: document.querySelector('.logo-img').getAttribute('src'),
                weather: document.getElementById('current-temp').textContent,
                sea: document.getElementById('sea-temp').textContent,
                chartLoaded: Boolean(window.tideChartInstance),
                date: document.getElementById('current-date').textContent
            }));
            await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
            await page.locator('.tides-card').screenshot({ path: path.join(output, `${name}-tides.png`) });
            if (name === 'small-mobile' || name === 'mobile') {
                for (const section of ['sea', 'rainfall', 'weekly-tides']) {
                    await page.locator(`.${section}-card`).screenshot({ path: path.join(output, `${name}-${section}.png`) });
                }
            }
            assert.ok(dimensions.width <= width, `${name} horizontal overflow: ${JSON.stringify(dimensions)}`);
            assert.equal(dimensions.logo, 'logo_v2.png');
            const scope = await page.evaluate(async () => {
                const registration = await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker readiness timed out')), 10000))
                ]);
                return registration.scope;
            });
            assert.equal(scope, base + prefix);
            await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
            assert.deepEqual(errors, [], `${name} online console errors`);
            assert.ok(dimensions.chartLoaded, `${name} tide chart loaded`);
            report.push({ name, dimensions, scope, ticks: timeline.ticks, markers: timeline.markers, errors: [...errors], failedRequests: [...failedRequests] });

            if (name === 'desktop') {
                // A non-round current minute must not leak into the clock labels.
                await page.clock.setFixedTime(new Date('2026-09-05T09:13:00Z'));
                await page.evaluate(() => renderTidesFromTable());
                assert.deepEqual(await page.evaluate(() => window.tideChartInstance.scales.x.ticks.map(t => TideEngine.formatTime(t.value))), ['12:00', '18:00', '00:00', '06:00']);
                assert.equal(await page.evaluate(() => window.tideChartInstance.options.scales.x.min), Date.parse('2026-09-05T09:13:00Z'));
                await page.clock.setFixedTime(new Date('2026-09-05T11:37:00Z'));
                await page.evaluate(() => renderTidesFromTable());
                assert.equal(await page.locator('#tide-state').innerText(), '↘ Tide falling');
                assert.equal(await page.locator('.tide-summary > :first-child .label').innerText(), 'Low tide');
                assert.equal(await page.locator('.tide-summary > :first-child .time').innerText(), '18:58');
                assert.equal(await page.locator('.tide-summary > :last-child .time').innerText(), '01:28');
                for (const [instant, time, countdown] of [
                    ['2026-10-25T00:30:00Z', '04:38', 'In 4h 8m'],
                    ['2026-10-25T01:30:00Z', '04:38', 'In 3h 8m'],
                    ['2026-12-31T20:00:00Z', '23:56', 'In 3h 56m']
                ]) {
                    await page.clock.setFixedTime(new Date(instant));
                    await page.evaluate(() => renderTidesFromTable());
                    assert.equal(await page.locator('#next-high-tide').innerText(), time);
                    assert.equal(await page.locator('#high-tide-countdown').innerText(), countdown);
                    assert.ok((await page.evaluate(() => window.tideChartInstance.scales.x.ticks.map(t => TideEngine.formatTime(t.value)))).every(t => /^(00|06|12|18):00$/.test(t)));
                }
                await page.clock.setFixedTime(new Date('2027-01-01T00:00:00Z'));
                await page.evaluate(() => renderTidesFromTable());
                assert.equal(await page.locator('#next-high-tide').innerText(), 'Unavailable');
                assert.equal(await page.locator('#next-low-tide').innerText(), 'Unavailable');
                assert.equal(await page.locator('#tideChart').isVisible(), false);
                assert.match(await page.locator('#tide-chart-note').innerText(), /insufficient/);
                await page.screenshot({ path: path.join(output, 'unavailable.png'), fullPage: true });

                await page.clock.setFixedTime(new Date('2026-09-05T09:00:00Z'));
                await context.setOffline(true);
                await page.reload({ waitUntil: 'load' });
                assert.equal(await page.locator('#next-high-tide').innerText(), '12:37');
                assert.equal(await page.locator('#today-tides .tide-pill').count(), 3);
                report.push({ offline: 'Cached static application and tide data load successfully', errors: errors.slice() });
            }
            await context.close();
        }
        await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
        console.log(JSON.stringify(report, null, 2));
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
