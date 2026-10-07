'use strict';
// Shared helpers for the Bugame browser tests (Playwright + Chromium).

const path = require('path');
const fs = require('fs');
const http = require('http');

function loadPlaywright() {
  const tries = ['playwright', '/opt/node22/lib/node_modules/playwright'];
  for (const t of tries) { try { return require(t); } catch (e) { /* try next */ } }
  throw new Error('Playwright not found. Install it with: npm i -D playwright');
}
const { chromium } = loadPlaywright();

const ROOT = path.resolve(__dirname, '..');
const FILE_URL = 'file://' + path.join(ROOT, 'index.html');

function launch() { return chromium.launch(); }

// Open the game and record page errors.
async function openGame(browser, viewport, url) {
  const ctx = await browser.newContext({ viewport: viewport || { width: 1000, height: 720 } });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(url || FILE_URL);
  return page;
}

// Start a mission straight from code. opts.noNet / opts.noPred switch off the random events.
async function startMission(page, id, opts) {
  await page.evaluate(([id, o]) => {
    const bug = Bugs.find((b) => b.stages.includes(id));
    openBug(bug, id);
    startGame();
    if (o.noNet) Game.g.netT = 1e9;
    if (o.noPred) Game.g.predCfg = null;
  }, [id, opts || {}]);
}

// Make the current mission count as won, whatever its goal.
async function forceWin(page) {
  await page.evaluate(() => {
    const g = Game.g;
    g.score = 99; g.wood = g.mud = 9;
    g.danced = g.moulted = g.emerged = g.pupated = true;
  });
  await page.waitForSelector('#end.active', { timeout: 5000 });
}

// Minimal static file server, so service-worker and install checks run over http.
function serve(dir) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
    '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(dir, p.endsWith('/') ? p + 'index.html' : p);
    if (!file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    resolve({ url: 'http://127.0.0.1:' + server.address().port + '/', close: () => server.close() });
  }));
}

const MISSIONS = ['ant', 'queen', 'bee', 'fly', 'caterpillar', 'butterfly', 'termite', 'snail', 'spiderling', 'spider', 'nymph', 'dragonfly', 'sandhopper', 'mosquito', 'flight', 'skimmerF', 'spiderF', 'nest'];

module.exports = { launch, openGame, startMission, forceWin, serve, ROOT, FILE_URL, MISSIONS };
