'use strict';
// Bugame test suite. Usage: node tests/run.js [--quick]   (--quick skips the full mission playthroughs)

const fs = require('fs');
const path = require('path');
const { launch, openGame, startMission, forceWin, serve, ROOT, MISSIONS } = require('./helpers');

const quick = process.argv.includes('--quick');
const BOT = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
function check(cond, msg) { if (!cond) throw new Error(msg); }

// ------------------------------------------------------------------ screens
test('map, pins, bug pages, Bug Book load without errors', async (b) => {
  const p = await openGame(b);
  const pins = await p.locator('.pin').count();
  check(pins === (await p.evaluate(() => Bugs.length)), 'pin count ' + pins);
  for (let i = 0; i < pins; i++) {
    await p.locator('.pin').nth(i).click();
    check(await p.isVisible('#bug.active'), 'bug page ' + i);
    await p.click('#bugBack');
  }
  await p.click('#bookBtn');
  check(await p.locator('.bookBug').count() === pins, 'book sections');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('phone portrait shows place list and rotate tip', async (b) => {
  const p = await openGame(b, { width: 390, height: 844 });
  check(await p.isVisible('#placeList'), 'place list hidden');
  await p.locator('#placeList button').first().click();
  await p.click('#bugStart');
  check(await p.isVisible('.rotate'), 'rotate tip hidden');
  check(await p.isVisible('#actionBtn'), 'action button hidden');
});

test('phone landscape: touch-drag moves the bug and the action button fits', async (b) => {
  const p = await openGame(b, { width: 844, height: 390 });
  await startMission(p, 'ant', { noNet: true, noPred: true });
  const box = await p.locator('#game').boundingBox();
  const before = await p.evaluate(() => [Game.g.player.x, Game.g.player.y]);
  await p.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.3);
  await p.mouse.down(); await p.waitForTimeout(600); await p.mouse.up();
  const after = await p.evaluate(() => [Game.g.player.x, Game.g.player.y]);
  check(Math.hypot(after[0] - before[0], after[1] - before[1]) > 40, 'did not move');
  const btn = await p.locator('#actionBtn').boundingBox();
  check(btn.y + btn.height <= box.y + box.height + 1 && btn.x + btn.width <= box.x + box.width + 1, 'button outside stage');
});

// ------------------------------------------------------------------ missions
if (!quick) {
  for (const id of MISSIONS) {
    test(`mission ${id}: can be finished and shows facts`, async (b) => {
      const p = await openGame(b);
      await p.addScriptTag({ content: BOT });
      await startMission(p, id, {});
      await p.evaluate(() => { Bot.install('perfect'); Game.timeScale = 8; });
      await p.waitForFunction(() => Game.g.done || Game.g.t > 300, null, { timeout: 120000, polling: 250 });
      const r = await p.evaluate(() => Bot.report());
      check(r.won, `not won after ${r.time}s (lives ${3 - r.livesLost})`);
      await p.waitForSelector('#end.active', { timeout: 5000 });
      check(await p.locator('#endFacts li').count() >= 2, 'too few facts on end screen');
      check(p.errors.length === 0, p.errors.join('; '));
    });
  }
}

test('keep exploring resumes play after winning', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'ant', { noNet: true, noPred: true });
  await forceWin(p);
  check(await p.isVisible('#endExplore'), 'no keep exploring button');
  await p.click('#endExplore');
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(300); await p.keyboard.up('ArrowRight');
  check(await p.evaluate(() => Game.running && Game.g.player.moving !== undefined), 'not running');
  check(await p.isVisible('#play.active'), 'not on play screen');
});

test('finishing a first stage unlocks the next', async (b) => {
  const p = await openGame(b);
  await p.locator('.pin', { hasText: 'Blue Skimmer' }).click();
  check(await p.locator('.stageBtn').nth(1).isDisabled(), 'adult should start locked');
  await p.click('#bugStart');
  await forceWin(p);
  check(/unlocked/i.test(await p.textContent('#endUnlock')), 'no unlock message');
  await p.click('#endNext');
  check(!(await p.locator('.stageBtn').nth(1).isDisabled()), 'adult still locked');
});

// ------------------------------------------------------------------ tapping (kids tap rather than hold)
async function tapUntil(p, cond, max) {
  for (let i = 0; i < (max || 12); i++) {
    if (await p.evaluate(cond)) return true;
    await p.keyboard.press(' ', { delay: 60 });
    await p.waitForTimeout(140);
  }
  return p.evaluate(cond);
}

test('tapping Munch makes the caterpillar eat', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'caterpillar', { noNet: true, noPred: true });
  await p.evaluate(() => { const g = Game.g, pl = g.items.find(i => i.kind !== 'grevillea'); g.player.x = pl.x; g.player.y = pl.y; });
  check(await tapUntil(p, () => Game.g.score >= 1), 'no munch from taps');
});

test('tapping Chew makes the termite take wood', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'termite', { noNet: true, noPred: true });
  await p.evaluate(() => { const g = Game.g, it = g.items.find(i => i.kind === 'woodChip'); g.player.x = it.x; g.player.y = it.y; });
  check(await tapUntil(p, () => !!Game.g.player.carry), 'no wood from taps');
});

test('tapping Sip and Lay works for the bush fly', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'fly', { noNet: true, noPred: true });
  await p.evaluate(() => { const g = Game.g; g.items.filter(i => i.kind === 'cow').forEach(c => { c.wt = 1e9; c.dir = 0; }); const c = g.items.find(i => i.kind === 'cow'); const h = g.mission.head(c); g.player.x = h.x; g.player.y = h.y; });
  check(await tapUntil(p, () => Game.g.player.protein >= 1, 16), 'protein did not fill from taps');
  await p.evaluate(() => { const g = Game.g, pt = g.pats.find(q => q.fresh > 0.5); g.player.x = pt.x; g.player.y = pt.y; });
  await p.waitForTimeout(100);
  check(await tapUntil(p, () => Game.g.score >= 1, 16), 'no eggs from taps');
});

test('the progress ring shows while munching', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'snail', { noNet: true, noPred: true });
  await p.evaluate(() => { const g = Game.g, f = g.items[0]; g.player.x = f.x; g.player.y = f.y; });
  await p.keyboard.down(' '); await p.waitForTimeout(500);
  const prog = await p.evaluate(() => Game.g.player.progress);
  await p.keyboard.up(' ');
  check(prog > 0.1, 'progress ' + prog);
});

// ------------------------------------------------------------------ systems
test('predator visits with a warning, then leaves', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'bee', { noNet: true });
  check(await p.evaluate(() => Game.g.preds.length === 0), 'predator at start');
  await p.evaluate(() => { Game.g.predT = 0.01; });
  await p.waitForTimeout(300);
  check(await p.evaluate(() => Game.g.preds.length === 1), 'no visit');
  check(/coming past/i.test(await p.textContent('#toast')), 'no warning');
  await p.evaluate(() => { Game.g.player.invuln = 99; Game.g.preds[0].stay = 0; });
  await p.waitForFunction(() => Game.g.preds.length === 0, null, { timeout: 15000 });
});

test('getting caught costs a heart; first stages never end in game over', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'ant', { noNet: true });
  await p.evaluate(() => { Game.g.predT = 0.01; });
  await p.waitForTimeout(200);
  for (let i = 0; i < 4; i++) await p.evaluate(() => { const g = Game.g; g.player.invuln = 0; Game.caught(g.preds[0] || { name: 'echidna' }); });
  check(await p.evaluate(() => Game.g.lives === 1 && !Game.g.done), 'gentle stage ended');
  await startMission(p, 'queen', { noNet: true });
  for (let i = 0; i < 3; i++) await p.evaluate(() => { Game.g.player.invuln = 0; Game.caught({ name: 'willie wagtail' }); });
  check(await p.evaluate(() => Game.g.done && Game.g.lives === 0), 'later stage should end at 0 hearts');
});

test('discoveries are found, counted and saved to the Bug Book', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'snail', { noNet: true, noPred: true });
  await p.evaluate(() => { const d = Game.g.finds[0]; Game.g.player.x = d.x; Game.g.player.y = d.y; });
  await p.waitForTimeout(200);
  check(/1 \/ 3/.test(await p.textContent('#hudFind')), 'counter ' + await p.textContent('#hudFind'));
  await p.click('#menuBtn');
  await p.click('#bookBtn');
  const text = await p.textContent('#bookList');
  check(/motorbike frog/i.test(text), 'fact not in book');
});

test('kid with a net: tank escape and 30 s release', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'termite', { noPred: true });
  await p.evaluate(() => { const g = Game.g; g.player.x += 400; g.player.y -= 300; g.player.carry = 'mud'; g.netT = 0; });
  await p.waitForFunction(() => Game.g.event && Game.g.event.phase === 'tank', null, { timeout: 5000 });
  check(await p.textContent('#actionBtn') === 'Crawl', 'escape verb');
  await p.waitForFunction(() => Game.g.event.open, null, { timeout: 10000 });
  await p.evaluate(() => { const o = Game.g.event.open; Game.g.player.x = o.x; Game.g.player.y = o.y; });
  await p.keyboard.press(' ');
  await p.waitForTimeout(150);
  check(await p.evaluate(() => !Game.g.event && Game.g.player.carry === 'mud'), 'did not escape with carry kept');
  await startMission(p, 'snail', { noPred: true });
  await p.evaluate(() => { Game.g.player.x += 400; Game.g.netT = 0; });
  await p.waitForFunction(() => Game.g.event && Game.g.event.phase === 'tank', null, { timeout: 5000 });
  await p.evaluate(() => { Game.g.event.t = 29.95; });
  await p.waitForTimeout(200);
  check(await p.evaluate(() => !Game.g.event), 'not released');
});

test('messages do not pile up', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'ant', { noNet: true, noPred: true });
  const n = await p.evaluate(() => { for (const k of ['sting', 'carry', 'larvae', 'build', 'scavenge', 'echidna']) Game.fact(k);
    for (let i = 0; i < 4; i++) { Game.g.hintT = 0; Game.hint('hint ' + i); } return Game.g.toasts.length; });
  check(n <= 5, 'queue length ' + n);
});

test('progress is saved and survives a reload', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'spiderling', { noNet: true, noPred: true });
  await forceWin(p);
  await p.reload();
  const stars = await p.locator('.pin', { hasText: 'Peacock Spider' }).locator('.pinStars').textContent();
  check(/★/.test(stars), 'no stars after reload: ' + stars);
});

// ------------------------------------------------------------------ platform
test('works offline after one visit (service worker)', async (b) => {
  const srv = await serve(ROOT);
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  try {
    await p.goto(srv.url);
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload();
    await p.waitForTimeout(500);
    await ctx.setOffline(true);
    await p.reload();
    check(await p.locator('.pin').count() > 0, 'map did not load offline');
    await p.locator('.pin').first().click();
    await p.click('#bugStart');
    await p.waitForTimeout(300);
    check(await p.evaluate(() => Game.running), 'game did not start offline');
  } finally { await ctx.close(); srv.close(); }
});

test('installable as an app (no manifest or installability errors)', async (b) => {
  const srv = await serve(ROOT);
  const ctx = await b.newContext();
  const p = await ctx.newPage();
  try {
    await p.goto(srv.url);
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.reload();
    await p.waitForTimeout(1000);
    const cdp = await ctx.newCDPSession(p);
    const man = await cdp.send('Page.getAppManifest');
    check(man.errors.length === 0, 'manifest: ' + JSON.stringify(man.errors));
    const inst = await cdp.send('Page.getInstallabilityErrors');
    check(inst.installabilityErrors.length === 0, 'install: ' + JSON.stringify(inst.installabilityErrors));
  } finally { await ctx.close(); srv.close(); }
});

// ------------------------------------------------------------------ run
(async () => {
  const b = await launch();
  let pass = 0, fail = 0;
  const t0 = Date.now();
  for (const t of tests) {
    const start = Date.now();
    try {
      await Promise.race([t.fn(b), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 150000))]);
      pass++;
      console.log(`PASS  ${t.name}  (${((Date.now() - start) / 1000).toFixed(1)}s)`);
    } catch (e) {
      fail++;
      console.log(`FAIL  ${t.name}\n      ${e.message.split('\n')[0]}`);
    }
    for (const c of b.contexts()) await c.close().catch(() => {});
  }
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  process.exit(fail ? 1 : 0);
})();
