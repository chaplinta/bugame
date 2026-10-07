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
  check(/Version \d+\.\d+(\.\d+)? · released \d+ \w+ \d{4}/.test(await p.textContent('.version')), 'no version on map');
  await p.click('#bookBtn');
  check(await p.locator('.bookBug').count() === pins + 1, 'book sections (one per bug plus Secrets)');
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

test('Pupate button works anywhere once the caterpillar is grown', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'caterpillar', { noNet: true, noPred: true });
  await p.evaluate(() => { const g = Game.g; g.score = 12; g.items = []; g.player.x = 1500; g.player.y = 300; });
  await p.waitForTimeout(1000);
  check(await p.evaluate(() => document.getElementById('actionBtn').classList.contains('ready')), 'Pupate not ready');
  await p.click('#actionBtn');
  await p.waitForSelector('#end.active', { timeout: 8000 });
  check(p.errors.length === 0, p.errors.join('; '));
});

test('peacock spider courtship: tap on the green beat three times', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'spider', { noNet: true, noPred: true });
  await p.evaluate(() => { Game.g.score = 7; });
  await p.waitForFunction(() => !!Game.g.female);
  await p.evaluate(() => { const g = Game.g; g.player.x = g.female.x - 50; g.player.y = g.female.y; });
  await p.waitForFunction(() => !!Game.g.court);
  // A press off the beat does nothing bad.
  await p.waitForFunction(() => !Game.g.court.green);
  await p.click('#actionBtn');
  check(await p.evaluate(() => Game.g.court.good === 0 && !Game.g.done), 'off-beat press counted');
  for (let i = 0; i < 8; i++) {
    await p.waitForFunction(() => !Game.g.court || (Game.g.court.green && !Game.g.court.hit), null, { timeout: 5000 });
    if (await p.evaluate(() => !Game.g.court)) break;
    await p.click('#actionBtn');
    await p.waitForTimeout(100);
  }
  check(await p.evaluate(() => Game.g.player.dance > 0 || Game.g.danced), 'three good beats did not win her');
  await p.waitForSelector('#end.active', { timeout: 8000 });
  check(p.errors.length === 0, p.errors.join('; '));
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

test('night falls after 10 minutes: bugs sleep, night screen, new day', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'bee', { noNet: true, noPred: true });
  await p.evaluate(() => { Night.elapsed = 500; Night.tick(0); });
  check(await p.evaluate(() => Night.dusk() > 0), 'no dusk');
  await p.evaluate(() => { Night.elapsed = 598.5; });
  await p.waitForFunction(() => Game.g.night > 0, null, { timeout: 5000 });
  const x = await p.evaluate(() => Game.g.player.x);
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(400); await p.keyboard.up('ArrowRight');
  check(await p.evaluate((x) => Game.g.player.x === x, x), 'bug moved while asleep');
  await p.waitForSelector('#night.active', { timeout: 8000 });
  check(await p.locator('#nightFacts li').count() >= 1, 'no facts on night screen');
  // Reloading keeps it night; starting a game shows the night screen again.
  await p.reload();
  check(await p.isVisible('#night.active'), 'night not kept after reload');
  await p.click('#newDay');
  check(await p.isVisible('#map.active'), 'new day did not go to map');
  check(await p.evaluate(() => Night.left() > 590 && !Night.fallen), 'clock not reset');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('3D butterfly flight: three.js loads, renders, and falls back without WebGL', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'flight', { noNet: true, noPred: true });
  await p.waitForFunction(() => Game.g.fl3d || Game.g.noGL, null, { timeout: 15000 });
  check(await p.evaluate(() => !!Game.g.fl3d), 'no 3D scene');
  await p.click('#actionBtn');
  await p.waitForTimeout(500);
  check(await p.evaluate(() => Game.g.fl.flying), 'did not take off');
  check(await p.isVisible('#game3d'), '3D canvas hidden');
  // Leaving the stage hides the 3D canvas
  await p.click('#menuBtn');
  check(!(await p.isVisible('#game3d')), '3D canvas still showing on the map');
  // No WebGL: a message, then the stage completes by itself
  await p.evaluate(() => { Flight3D.supported = () => false; });
  await startMission(p, 'flight', { noNet: true, noPred: true });
  await p.waitForSelector('#end.active', { timeout: 10000 });
  check(p.errors.length === 0, p.errors.join('; '));
});

test('family tree: branches give facts, bugs open their page', async (b) => {
  const p = await openGame(b);
  await p.click('#treeBtn');
  check(await p.isVisible('#tree.active'), 'tree screen not shown');
  const box = await p.locator('#treeCanvas').boundingBox();
  const at = (h) => [box.x + (h.x + h.w / 2) / 960 * box.width, box.y + (h.y + h.h / 2) / 640 * box.height];
  const insects = await p.evaluate(() => Tree.hits.find(h => h.node && h.node.name === 'Insects'));
  await p.mouse.click(...at(insects));
  check(/6 legs/.test(await p.textContent('#treeFact')), 'no fact for a branch');
  check(await p.evaluate(() => Tree.hits.filter(h => h.bug).length === Bugs.length), 'not every bug is on the tree');
  const snail = await p.evaluate(() => Tree.hits.find(h => h.bug && h.bug.id === 'snail'));
  await p.mouse.click(...at(snail));
  check(await p.isVisible('#bug.active') && (await p.textContent('#bugName')) === 'Native Snail', 'bug page not opened');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('bug pages say who you are (female, male, both)', async (b) => {
  const p = await openGame(b);
  await p.evaluate(() => openBug(Bugs.find(x => x.id === 'mosquito')));
  check(/female/i.test(await p.textContent('#stageSex')), 'mosquito not female');
  await p.evaluate(() => openBug(Bugs.find(x => x.id === 'snail')));
  check(/male and female/i.test(await p.textContent('#stageSex')), 'snail not both');
});

test('sandhopper: tapping Hop gets you out of the burrow, and walking over it does not trap you', async (b) => {
  const p = await openGame(b, { width: 844, height: 390 });
  await startMission(p, 'sandhopper', { noNet: true, noPred: true });
  await p.evaluate(() => { Game.g.nextPred = 1e9; });
  check(await p.evaluate(() => Missions.sandhopper.inBurrow(Game.g)), 'does not start in the burrow');
  for (let i = 0; i < 3; i++) { await p.click('#actionBtn'); await p.waitForTimeout(700); }
  await p.waitForTimeout(600);
  check(await p.evaluate(() => !Missions.sandhopper.inBurrow(Game.g) && Game.g.player.onGround), 'still stuck in the burrow');
  // Walk right across the hole: stays on the surface
  await p.evaluate(() => { Game.g.player.x = Beach.bx - 80; });
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1500); await p.keyboard.up('ArrowRight');
  check(await p.evaluate(() => Game.g.player.x > Beach.bx + 20 && !Missions.sandhopper.inBurrow(Game.g)), 'fell into the burrow walking past');
  // Pressing down on the hole drops you in to hide
  await p.evaluate(() => { Game.g.player.x = Beach.bx; });
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(800); await p.keyboard.up('ArrowDown');
  check(await p.evaluate(() => Missions.sandhopper.inBurrow(Game.g)), 'could not drop into the burrow');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('an error in a level returns to the map and other levels still work', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'bee', { noNet: true, noPred: true });
  await p.evaluate(() => { window.realHud = Missions.bee.hud; Missions.bee.hud = () => { throw new Error('test crash'); }; });
  await p.waitForSelector('#map.active', { timeout: 5000 });
  check(await p.isVisible('#crashNote'), 'no crash note');
  await p.evaluate(() => { Missions.bee.hud = window.realHud; });
  await startMission(p, 'ant', { noNet: true, noPred: true });
  const t0 = await p.evaluate(() => Game.g.t);
  await p.waitForTimeout(500);
  check(await p.evaluate((t0) => Game.running && Game.g.t > t0, t0), 'game loop stopped after the crash');
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

test('secrets: hidden thing in a world, quokka on the map, Bug Book count', async (b) => {
  const p = await openGame(b);
  await p.click('#rottnest');
  check(await p.isVisible('#secretPop'), 'no quokka');
  await p.click('#secretClose');
  await startMission(p, 'termite', { noNet: true, noPred: true });
  await p.evaluate(() => { const s = Game.g.secret; Game.g.player.x = s.x; Game.g.player.y = s.y; });
  await p.waitForTimeout(200);
  check(/Secret!/.test(await p.textContent('#toast')), 'no secret message');
  await p.click('#menuBtn');
  await p.click('#bookBtn');
  check(/Secrets found: 2 \//.test(await p.textContent('.secrets .count')), 'book count ' + await p.textContent('.secrets .count'));
});

test('tank is side-on: gaps only open at the top', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'bee', { noPred: true });
  await p.evaluate(() => { Game.g.player.x += 400; Game.g.netT = 0; });
  await p.waitForFunction(() => Game.g.event && Game.g.event.phase === 'tank', null, { timeout: 5000 });
  const ys = await p.evaluate(() => Game.g.event.corners.map(c => c.y));
  check(ys.every(y => y < 150), 'gap not at the top: ' + ys);
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
