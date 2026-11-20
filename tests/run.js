'use strict';
// Bugame test suite. Usage: node tests/run.js [--quick]   (--quick skips the full mission playthroughs)

const fs = require('fs');
const path = require('path');
const { launch, launchMedia, openGame, startMission, forceWin, settle, serve, ROOT, MISSIONS, FILE_URL } = require('./helpers');

const quick = process.argv.includes('--quick');
const BOT = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
function check(cond, msg) { if (!cond) throw new Error(msg); }

// ------------------------------------------------------------------ screens
test('map, pins, bug pages, Bug Book load without errors', async (b) => {
  const p = await openGame(b);
  const pins = await p.locator('.pin').count();
  check(pins === (await p.evaluate(() => Bugs.filter(b => b.pin && !b.hub).length)), 'pin count ' + pins);
  for (let i = 0; i < pins; i++) {
    await p.locator('.pin').nth(i).click();
    check(await p.isVisible('#bug.active'), 'bug page ' + i);
    await p.click('#bugBack');
  }
  check(/Version \d+\.\d+(\.\d+)? · released \d+ \w+ \d{4}/.test(await p.textContent('.version')), 'no version on map');
  // the "3D pictures" toggle: off is remembered and stops the renderer; on brings it back
  check(await p.locator('.toggle[data-setting="threeD"]').count() === 1, 'no 3D toggle');
  await p.locator('.toggle[data-setting="threeD"]').click();
  check(await p.evaluate(() => Settings.threeD === false && JSON.parse(localStorage.getItem('bugame.settings')).threeD === false && Render3D.disabled && !Render3D.ok), '3D toggle did not turn it off');
  await p.locator('.toggle[data-setting="threeD"]').click();
  check(await p.evaluate(() => Settings.threeD === true && !Render3D.disabled), '3D toggle did not turn it back on');
  await p.click('#bookBtn');
  check(await p.locator('.bookBug').count() === pins + 1, 'book sections (one per bug plus Secrets)');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('a phone held upright asks to turn sideways and the game waits', async (b) => {
  // a touch phone held upright: the cover, and no time passes in the level or on the day clock
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p = await ctx.newPage(); p.errors = []; p.on('pageerror', (e) => p.errors.push(e.message));
  await p.goto(FILE_URL);
  check(await p.isVisible('#turn') && await p.evaluate(() => Orient.covered && document.documentElement.classList.contains('turn')), 'no turn-sideways cover on a phone held upright');
  await startMission(p, 'ant', { noNet: true, noPred: true });
  const t0 = await p.evaluate(() => [Game.g.t, Night.elapsed]);
  await p.waitForTimeout(1300);
  const t1 = await p.evaluate(() => [Game.g.t, Night.elapsed]);
  check(t1[0] === t0[0] && t1[1] === t0[1], 'time passed while the phone was upright: ' + JSON.stringify([t0, t1]));
  // turned sideways: the cover goes and the level runs
  await p.setViewportSize({ width: 844, height: 390 });
  await p.waitForTimeout(400);
  check(!(await p.isVisible('#turn')) && await p.evaluate((t) => !Orient.covered && Game.g.t > t, t1[0]), 'the cover stayed or the level did not run after turning sideways');
  // Start asks for full screen and landscape; where both are refused nothing breaks
  await p.evaluate(() => { document.documentElement.requestFullscreen = () => Promise.reject(new Error('no')); if (screen.orientation) screen.orientation.lock = () => Promise.reject(new Error('no')); window.locked = 0; const l = Orient.lock.bind(Orient); Orient.lock = () => { window.locked++; l(); }; });
  await p.click('#menuBtn');
  await p.locator('.pin').first().click();
  await p.click('#bugStart');
  await p.waitForTimeout(300);
  check(await p.evaluate(() => window.locked === 1 && Game.running), 'Start did not ask for landscape, or it broke the start');
  check(p.errors.length === 0, p.errors.join('; '));
  await ctx.close();
  // a desktop window that is tall and narrow is never covered, and keeps the place list
  const q = await openGame(b, { width: 390, height: 844 });
  check(!(await q.isVisible('#turn')) && await q.isVisible('#placeList'), 'a narrow desktop window was covered or lost the place list');
  await q.locator('#placeList button').first().click();
  await q.click('#bugStart');
  check(await q.isVisible('#actionBtn'), 'action button hidden');
  check(q.errors.length === 0, q.errors.join('; '));
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

// Keep exploring, swept over every mission in two halves (each test has a time limit)
async function exploreSweep(b, ids) {
  const p = await openGame(b);
  const bad = [];
  for (const id of ids) {
    await startMission(p, id, { noNet: true, noPred: true });
    if (await p.evaluate(() => Game.g.mission.view === '3d')) await p.waitForFunction(() => Game.g.fl3d || Game.g.noGL, null, { timeout: 30000 });   // a 3D flight loads first
    await p.evaluate(() => { Game.timeScale = 8; });
    try { await forceWin(p); } catch (e) { bad.push(id + ': never reached the end screen'); await p.evaluate(() => { Game.stop(); buildMap(); }); continue; }
    const want = await p.evaluate(() => { const m = currentMission, g = Game.g; return typeof m.explore === 'function' ? m.explore(g) : m.explore !== false; });
    const shown = await p.isVisible('#endExplore');
    if (shown !== want) bad.push(id + ': Keep exploring ' + (shown ? 'shown' : 'hidden') + ' but explore is ' + want);
    if (shown) {
      await p.click('#endExplore');
      const moved = await p.evaluate(() => {
        const g = Game.g, m = g.mission, p = g.player;
        if (m.pointerOnly) return true;
        Game.timeScale = 1;
        const fly = m.view === '3d' && !!g.fl, at = () => fly ? [g.fl.x, g.fl.z] : [p.x, p.y];   // a flight moves its own 3D butterfly
        const tryMove = () => {
          for (const k of ['arrowright', 'arrowleft', 'arrowdown', 'arrowup']) {
            const a = at();
            Input.keys.add(k); for (let i = 0; i < 20; i++) Game.update(1 / 60); Input.keys.delete(k);
            const b = at(); if (Math.hypot(b[0] - a[0], b[1] - a[1]) > (fly ? 1 : 3)) return true;   // the flight's units are metres, not pixels
          }
          return false;
        };
        if (tryMove()) return true;
        Input.pressed = true; Game.update(1 / 60); Input.pressed = false;   // the sandhopper's burrow: Hop out first
        for (let i = 0; i < 30; i++) Game.update(1 / 60);
        return tryMove();
      });
      if (!moved) bad.push(id + ': the bug cannot move after Keep exploring');
    }
    await p.evaluate(() => { Game.stop(); buildMap(); });
  }
  check(bad.length === 0, bad.join(' | '));
  check(p.errors.length === 0, p.errors.join('; '));
}
const HALF = Math.ceil(MISSIONS.length / 2);
test('keep exploring: offered only where the bug can go on, and there it moves (first half)', (b) => exploreSweep(b, MISSIONS.slice(0, HALF)));
test('keep exploring: offered only where the bug can go on, and there it moves (second half)', (b) => exploreSweep(b, MISSIONS.slice(HALF)));

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
  await p.waitForTimeout(100);
  // the button says what is happening: never a green Pupate that does nothing
  check(await p.evaluate(() => { const b = document.getElementById('actionBtn'); return /Pupating/.test(b.textContent) && !b.classList.contains('ready'); }), 'the button still offers Pupate while pupating');
  await p.waitForSelector('#end.active', { timeout: 8000 });
  check(!(await p.isVisible('#endExplore')), 'a chrysalis was offered Keep exploring');
  check(p.errors.length === 0, p.errors.join('; '));
});

// The female peacock spider: stepping the mission directly, as the circus test does
const SPIDER_STEP = `window.step = (sec, I) => { const g = Game.g, m = g.mission; I = I || { pressed: false, held: false }; for (let i = 0; i < Math.round(sec * 60); i++) { m.update(g, 1 / 60, I); I.pressed = false; } };`;

test('female peacock spider: a varied set of males with one standout, a new set every round', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'spiderF', { noNet: true, noPred: true });
  await p.evaluate(SPIDER_STEP);
  const r = await p.evaluate(() => {
    const g = Game.g, m = g.mission;
    const sig = (s) => s.map(q => q.col + '/' + q.scale.toFixed(2) + '/' + q.routine.join('-') + '/' + q.beat.toFixed(2)).join(' ');
    const look = (s) => ({ n: s.length, stars: s.filter(q => q.standout).length, cols: new Set(s.map(q => q.col)).size, sizes: new Set(s.map(q => q.scale.toFixed(2))).size, routines: new Set(s.map(q => q.routine.join('-'))).size,
      star: s.filter(q => q.standout).map(q => ({ skill: q.skill, full: q.routine.includes('full'), col: q.col }))[0], othersFull: s.some(q => !q.standout && q.routine.includes('full')), palettesOk: s.every(q => q.col >= 0 && q.col < SPIDER_COLS.length), queueFirstStar: g.queue[0].standout });
    const one = look(g.suitors), s1 = sig(g.suitors);
    m.newRound(g);
    const two = look(g.suitors), s2 = sig(g.suitors);
    // every palette and the opened sac draw in 2D
    const c = document.createElement('canvas'); c.width = c.height = 120; const ctx = c.getContext('2d'); const errs = [];
    for (let k = 0; k < SPIDER_COLS.length; k++) for (const o of [{}, { dance: 1 }, { fan: 1 }, { wave: 1, bob: 1 }]) { try { ctx.setTransform(1, 0, 0, 1, 60, 60); Sprites.spider(ctx, Object.assign({ col: k }, o), 0.4); } catch (e) { errs.push(k + ' ' + e.message); } }
    try { Sprites.eggSac(ctx, { state: 'open' }, 0); } catch (e) { errs.push('sac ' + e.message); }
    return { one, two, differ: s1 !== s2, starColChanged: one.star.col !== two.star.col, errs, round: g.round, pretend: g.seen.has('pretend') };
  });
  for (const k of ['one', 'two']) {
    const s = r[k];
    check(s.n >= 5 && s.n <= 6 && s.stars === 1 && s.cols === s.n && s.sizes >= 4 && s.routines >= s.n - 1 && s.palettesOk, 'the suitors ' + k + ': ' + JSON.stringify(s));
    check(s.star.skill === 1 && s.star.full && !s.othersFull && !s.queueFirstStar && [0, 3, 4].includes(s.star.col), 'the standout ' + k + ': ' + JSON.stringify(s));
  }
  check(r.differ && r.starColChanged && r.round === 1 && r.pretend, 'the next round is not a new set: ' + JSON.stringify(r));
  check(r.errs.length === 0, r.errs.join('; '));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('female peacock spider: males come, dance, give up and come back', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'spiderF', { noNet: true, noPred: true });
  await p.evaluate(SPIDER_STEP);
  const r = await p.evaluate(() => {
    const g = Game.g, p = g.player;
    let most = 0, starAt = null, danced = 0;
    const seenLeave = new Set(), removed = new Set();
    for (let s = 0; s < 120 * 4; s++) {
      step(0.25);
      most = Math.max(most, g.males.filter(q => q.state !== 'gone').length);
      for (const q of g.males) { if (q.state === 'leave') seenLeave.add(q); if (q.state === 'dance') danced++; }
      for (const q of seenLeave) if (!g.items.includes(q)) removed.add(q);
      if (starAt === null && g.males.some(q => q.standout)) starAt = s * 0.25;
    }
    return { most, starAt, firstIsStar: g.suitors.find(q => q.n === g.arrivals[0]).standout, gaveUp: g.gaveUp, removed: removed.size, back: g.suitors.filter(q => q.visits >= 2).length, danced, fussy: g.seen.has('fussy'), dance: g.seen.has('dance'), phase: g.phase };
  });
  check(r.most <= 3 && r.most >= 2, 'males on screen at once: ' + JSON.stringify(r));
  check(!r.firstIsStar && r.starAt !== null && r.starAt <= 25, 'the standout should come, but not first: ' + JSON.stringify(r));
  check(r.gaveUp >= 3 && r.removed >= 2 && r.back >= 2 && r.danced > 0 && r.phase === 'watch', 'males did not come and go: ' + JSON.stringify(r));
  check(r.fussy && r.dance, 'the dance and fussy facts: ' + JSON.stringify(r));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('female peacock spider: choose the standout, guard the eggs from ants, they hatch, then a new mate and two broods win', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'spiderF', { noNet: true, noPred: true });
  await p.evaluate(SPIDER_STEP);
  // choose the standout once he is dancing
  const c = await p.evaluate(() => {
    const g = Game.g, p = g.player;
    let n = 0; while (!g.males.some(q => q.standout && q.state === 'dance') && n++ < 400) step(0.1);
    const star = g.males.find(q => q.standout);
    p.x = star.x - 40; p.y = star.y;
    step(1 / 60, { pressed: true, held: true });
    return { phase: g.phase, judge: g.seen.has('judge'), chosen: g.chosen === star, others: g.males.filter(q => q !== star).every(q => q.state === 'gone'), queue: g.queue.length };
  });
  check(c.phase === 'sac' && c.judge && c.chosen && c.others && c.queue === 0, 'choosing the standout: ' + JSON.stringify(c));
  // spin at home, then an ant steals an egg, and a shooed ant takes none
  const s = await p.evaluate(() => {
    const g = Game.g, p = g.player;
    p.x = g.home.x; p.y = g.home.y;
    step(2.5, { pressed: false, held: true });
    const out = { phase: g.phase, eggs: g.eggs, sac: !!g.sac && g.items.includes(g.sac) };
    g.antT = 0; step(1 / 60);
    g.ant.x = g.sac.x + 22; g.ant.y = g.sac.y; step(0.1);
    out.stolen = out.eggs - g.eggs; out.carry = !!g.ant.carry;
    step(3);   // the thief runs off with it
    const before = g.eggs;
    g.antT = 0; step(1 / 60);
    g.ant.x = g.sac.x + 100; g.ant.y = g.sac.y; p.x = g.sac.x; p.y = g.sac.y;
    step(1 / 60, { pressed: true, held: true }); step(0.6);
    out.chased = g.chased; out.kept = g.eggs === before;
    return out;
  });
  check(s.phase === 'guard' && s.sac && s.eggs >= 8 && s.eggs <= 12 && s.stolen === 1 && s.carry && s.chased === 1 && s.kept, 'the egg sac and the ants: ' + JSON.stringify(s));
  // the eggs hatch: as many spiderlings as eggs run off, the sac is open, then a new round
  const h = await p.evaluate(() => {
    const g = Game.g;
    g.hatchT = 0.01; step(1 / 60);
    const out = { phase: g.phase, young: g.items.filter(i => i.kind === 'young').length, eggs: g.eggs, open: g.sac.state === 'open', broods: g.broods, hatch: g.seen.has('hatch') };
    step(5);
    Object.assign(out, { left: g.items.filter(i => i.kind === 'young').length, phase2: g.phase, round: g.round, score: g.score, pretend: g.seen.has('pretend'), newMales: g.suitors.length >= 5 && g.queue.length + g.males.length === g.suitors.length });
    return out;
  });
  check(h.phase === 'hatch' && h.young === h.eggs && h.open && h.broods === 1 && h.hatch, 'the hatch: ' + JSON.stringify(h));
  check(h.left === 0 && h.phase2 === 'watch' && h.round === 1 && h.score === 1 && h.pretend && h.newMales, 'after the hatch: ' + JSON.stringify(h));
  // the second brood, quickly: any male, spin, hatch; two broods win, and Keep exploring carries on
  await p.evaluate(() => {
    const g = Game.g, p = g.player;
    let n = 0; while (!g.males.some(q => q.state === 'dance') && n++ < 400) step(0.1);
    const m = g.males.find(q => q.state === 'dance'); p.x = m.x - 40; p.y = m.y;
    step(1 / 60, { pressed: true, held: true });
    p.x = g.home.x; p.y = g.home.y; step(2.5, { pressed: false, held: true });
    g.hatchT = 0.01; step(4);
  });
  await p.waitForSelector('#end.active', { timeout: 8000 });
  const e = await p.evaluate(() => ({ stars: document.getElementById('endStars').textContent, line: document.getElementById('endUnlock').textContent, explore: getComputedStyle(document.getElementById('endExplore')).display !== 'none' }));
  check(/★/.test(e.stars) && /spiderlings in 2 broods/.test(e.line) && e.explore, 'the end screen: ' + JSON.stringify(e));
  await p.click('#endExplore');
  await p.waitForTimeout(2500);
  check(await p.evaluate(() => Game.running && Game.g.phase === 'watch' && Game.g.males.length > 0), 'Keep exploring did not bring new males');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('peacock spider courtship: ten beats with moves, seven in time win her', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'spider', { noNet: true, noPred: true });
  await p.evaluate(() => { Game.g.score = 7; });
  await p.waitForFunction(() => !!Game.g.female);
  await p.evaluate(() => { const g = Game.g; g.player.x = g.female.x - 50; g.player.y = g.female.y; });
  await p.waitForFunction(() => !!Game.g.court);
  // A press off the beat (at the very start of one, well before its window) scores nothing, and she looks away
  await p.waitForFunction(() => { const c = Game.g.court; if (!c || c.i < 0) return false; const tb = c.t - COURTSHIP.lead; return (tb - c.i * COURTSHIP.BEAT) / COURTSHIP.BEAT < 0.2; }, null, { timeout: 5000 });
  await p.click('#actionBtn');
  await p.waitForTimeout(80);
  check(await p.evaluate(() => Game.g.court.good === 0 && Game.g.court.miss === 1 && Game.g.female.turn > 0 && !Game.g.done), 'off-beat press counted');
  let moves = 0;
  for (let i = 0; i < 14; i++) {
    await p.waitForFunction(() => !Game.g.court || Game.g.court.green, null, { timeout: 5000 });
    if (await p.evaluate(() => !Game.g.court)) break;
    await p.click('#actionBtn');
    await p.waitForTimeout(60);
    if (await p.evaluate(() => Game.g.player.fan > 0 || Game.g.player.wave > 0 || Game.g.player.bob > 0)) moves++;
    await p.waitForTimeout(100);
  }
  check(moves >= 7, 'beats in time did not show a move: ' + moves);
  check(await p.evaluate(() => Game.g.player.dance > 0 || Game.g.danced), 'seven good beats did not win her');
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

test('bush fly: hitch a ride on the kangaroo, and a wagtail perched there catches you', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'fly', { noNet: true, noPred: true });
  // on the kangaroo's back the button offers Sit; pressed, you go where it goes with no input at all
  await p.evaluate(() => { const g = Game.g, b = g.mission.back(g.roo); g.player.x = b.x; g.player.y = b.y; g.roo.state = 'graze'; g.roo.timer = 99; });
  await p.waitForTimeout(100);
  check(await p.evaluate(() => document.getElementById('actionBtn').textContent === 'Sit'), 'no Sit offered on the kangaroo');
  await p.click('#actionBtn');
  await p.waitForTimeout(100);
  const before = await p.evaluate(() => { const g = Game.g; g.roo.timer = 0; g.roo.angle = 0; return [g.player.x, g.player.y, !!g.player.ride, g.mission.locked(g)]; });
  check(before[2] && before[3], 'Sit did not mount: ' + JSON.stringify(before));
  await p.waitForTimeout(900);
  const after = await p.evaluate(() => [Game.g.player.x, Game.g.player.y, Game.g.roo.state, Game.g.seen.has('hop')]);
  check(Math.hypot(after[0] - before[0], after[1] - before[1]) > 60, 'the ride did not carry the fly: ' + JSON.stringify([before, after]));
  check(after[3], 'the hop fact did not show');
  check(await p.evaluate(() => document.getElementById('actionBtn').textContent === 'Hop off'), 'no Hop off offered');
  await p.click('#actionBtn');
  await p.waitForTimeout(100);
  check(await p.evaluate(() => !Game.g.player.ride && !Game.g.mission.locked(Game.g)), 'Hop off did not dismount');
  // a wagtail perched on the cow you ride snaps you up (a first stage: a heart, never a game over)
  await p.evaluate(() => {
    const g = Game.g, c = g.items.find(i => i.kind === 'cow'), b = g.mission.back(c);
    for (const pt of g.pats) if (Math.hypot(pt.x - b.x, pt.y - b.y) < 120) pt.x += 400;   // a pat under the cow would offer Lay instead
    g.player.x = b.x; g.player.y = b.y;
  });
  await p.waitForTimeout(100);
  check(await p.evaluate(() => document.getElementById('actionBtn').textContent === 'Sit'), 'no Sit offered on the cow');
  await p.click('#actionBtn');
  await p.waitForTimeout(100);
  check(await p.evaluate(() => !!Game.g.player.ride), 'Sit did not mount the cow');
  await p.evaluate(() => {
    const g = Game.g, c = g.player.ride; g.player.invuln = 0;
    g.preds.push({ sprite: 'wagtail', name: 'willie wagtail', r: 20, x: c.x + 50, y: c.y, angle: 0, state: 'wander', timer: 0, stay: 22, moving: true, wanderSpeed: 70, chaseSpeed: 150, sight: 170, chaseTime: 2.5, restTime: 3.5 });
    g.mission.perchOn(g, g.preds[0], c);
  });
  await p.waitForTimeout(200);
  const r = await p.evaluate(() => ({ lives: Game.g.lives, ride: !!Game.g.player.ride, fact: Game.g.seen.has('wagtailRide'), state: Game.g.preds[0].state }));
  check(r.lives === 2 && !r.ride && r.fact && r.state === 'leave', 'the perched wagtail did not catch the rider: ' + JSON.stringify(r));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('frog chorus: calls in the gap count, the heron hears you, the others call in stereo', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'frog', { noNet: true, noPred: true });
  await settle(p);
  await p.waitForFunction(() => Missions.frog.gap(Game.g), null, { timeout: 8000 });
  await p.keyboard.down('Space'); await p.waitForTimeout(800); await p.keyboard.up('Space');
  const r1 = await p.evaluate(() => ({ score: Game.g.score, sac: Game.g.seen.has('sac'), call: Game.g.seen.has('call'), rings: Game.g.rings.length }));
  check(r1.score === 1 && r1.call && r1.sac, 'a call in the gap was not heard: ' + JSON.stringify(r1));
  // a call over the rivals is not heard, and gets the hint
  await p.waitForFunction(() => !Missions.frog.gap(Game.g), null, { timeout: 8000 });
  await p.evaluate(() => { Game.g.hintT = 0; });
  await p.keyboard.down('Space'); await p.waitForTimeout(600); await p.keyboard.up('Space');
  const r2 = await p.evaluate(() => ({ score: Game.g.score, hint: Game.g.toasts.some(t => /Too noisy/.test(t.text)) || /Too noisy/.test(document.getElementById('toast').textContent) }));
  check(r2.score === 1 && r2.hint, 'a call over the chorus counted: ' + JSON.stringify(r2));
  // the others call around the lake, in stereo, and the first one near gives its fact
  await p.evaluate(() => { Game.timeScale = 4; });
  await p.waitForFunction(() => FrogCalls.played.banjo > 0 && FrogCalls.played.froglet > 0, null, { timeout: 20000 });
  await p.evaluate(() => { Game.timeScale = 1; });
  const r3 = await p.evaluate(() => ({ banjo: Game.g.seen.has('banjo') || Game.g.seen.has('froglet') || Game.g.seen.has('rivals'), stereo: !!(Sound.ac && Sound.ac.createStereoPanner) }));
  check(r3.banjo, 'no fact for a frog heard nearby');
  // calling draws the heron: its sight grows while the sac is puffed
  await p.evaluate(() => { const g = Game.g; g.predCfg = { sprite: 'nightHeron', name: 'night heron', r: 28, wanderSpeed: 25, chaseSpeed: 95, sight: 90, chaseTime: 3, restTime: 4 }; g.predT = 0.01; });
  await p.waitForFunction(() => Game.g.preds.length > 0, null, { timeout: 5000 });
  await p.evaluate(() => { const g = Game.g, h = g.preds[0]; g.player.x = g.home.x + 300; g.player.invuln = 0; h.x = g.player.x + 200; h.y = g.player.y; h.state = 'wander'; });   // out of the safe reeds
  await p.keyboard.down('Space'); await p.waitForTimeout(400);
  const r4 = await p.evaluate(() => ({ sight: Game.g.preds[0].sight, state: Game.g.preds[0].state }));
  await p.keyboard.up('Space');
  check(r4.sight === 260 && r4.state !== 'wander', 'the heron did not hear the call: ' + JSON.stringify(r4));
  // the female comes once you have been heard enough, and the level ends when she arrives
  await p.evaluate(() => { const g = Game.g; g.preds = []; g.predCfg = null; g.score = 8; });
  await p.waitForFunction(() => !!Game.g.female, null, { timeout: 5000 });
  await p.evaluate(() => { const g = Game.g; g.female.x = g.player.x + 60; g.female.y = g.player.y; });
  await p.waitForSelector('#end.active', { timeout: 10000 });
  check(p.errors.length === 0, p.errors.join('; '));
});

test('Bug Olympics: every event is open, jumps are measured, a finish gives a medal, the Book shows it', async (b) => {
  const p = await openGame(b);
  await p.locator('.pin', { hasText: 'Bug Olympics' }).click();
  check(await p.locator('#stages .stageBtn:not([disabled])').count() === 6, 'not every event is open');
  check(await p.isHidden('#bugTree'), 'the family tree button shows for the Olympics');
  // long jump: a full-power jump from the board lands far out, a weak one close; three jumps end the event
  await startMission(p, 'oly_jump', {});
  const sim = async (k) => p.evaluate((k) => {
    const g = Game.g, m = g.mission, p = g.player;
    g.restT = 0; p.onGround = true; p.x = JUMP.board; p.y = JUMP.ground - 12;
    m.jump(g, k);
    let n = 0; while (!p.onGround && n++ < 4000) m.move(g, 1 / 120, 0, 0);
    return g.jumps[g.jumps.length - 1].bl;
  }, k);
  const far = await sim(1), nearJ = await sim(0.2);
  check(far >= 36 && far <= 42, 'a full-power jump went ' + far + ' body lengths');
  check(nearJ >= 6 && nearJ <= 14, 'a weak jump went ' + nearJ + ' body lengths');
  await sim(0.5);
  await p.waitForSelector('#end.active', { timeout: 10000 });
  const end1 = await p.evaluate(() => ({ stars: document.getElementById('endStars').textContent, line: document.getElementById('endUnlock').textContent, best: Progress.best('oly_jump'), saved: Progress.stars('oly_jump') }));
  check(end1.stars === '★★★' && /Gold medal/.test(end1.line) && /swimming pool/.test(end1.line), 'no gold for ' + far + ' body lengths: ' + JSON.stringify(end1));
  check(end1.best === far && end1.saved === 3, 'best result not saved: ' + JSON.stringify(end1));
  // sprint: through the rings in order stops the clock; a quick lap is gold
  await p.click('#endMap');
  await startMission(p, 'oly_sprint', {});
  for (let i = 0; i < 6; i++) { await p.evaluate((i) => { const g = Game.g, [x, y] = SPRINT.gates[i]; g.player.x = x; g.player.y = y; }, i); await p.waitForTimeout(80); }
  await p.waitForSelector('#end.active', { timeout: 10000 });
  const end2 = await p.evaluate(() => ({ stars: document.getElementById('endStars').textContent, line: document.getElementById('endUnlock').textContent, time: Game.g.oly.result, gate: Game.g.gate }));
  check(end2.gate === 6 && end2.time < 5 && end2.stars === '★★★' && /Gold medal/.test(end2.line) && /seconds/.test(end2.line), 'sprint result: ' + JSON.stringify(end2));
  // gymnastics: a full-power click flies over 20 body lengths with five or more somersaults and, with Land pressed in
  // the window, comes down on its feet; a half-power flip without Land lands on its back and clicks again
  await p.click('#endMap');
  await startMission(p, 'oly_gym', {});
  check(await p.evaluate(() => World.w === W && World.h === GYM.H && Game.g.player.spin === Math.PI && Game.g.player.onGround), 'the beetle does not start on its back on the mat');
  const flip = async (k, land) => p.evaluate(([k, land]) => {
    const g = Game.g, m = g.mission, p = g.player;
    g.restT = 0; g.recoverT = 0; p.onGround = true; p.recover = false; p.x = World.w / 2; p.y = GYM.ground;
    m.click(g, k);
    let n = 0, peakCam = 1e9;
    while (!p.onGround && n++ < 6000) { m.move(g, 1 / 120, 0, 0); Game.updateCamera(); peakCam = Math.min(peakCam, g.cam.y); if (land && p.vy > 0 && m.toLand(p) <= GYM.window) p.landPress = true; }
    const f = g.flips[g.flips.length - 1];
    return { turns: f.turns, feet: f.feet, points: f.points, height: f.height, peakCam, recover: g.recoverT > 0, spin: p.spin };
  }, [k, land]);
  const f1 = await flip(1, true), f2 = await flip(0.5, false);
  check(f1.turns === 6 && f1.feet && f1.points === 15 && f1.height >= 20 && f1.peakCam === 0 && f1.spin === 0, 'a full-power flip: ' + JSON.stringify(f1));
  check(f2.turns >= 2 && f2.turns <= 4 && !f2.feet && f2.points === 2 * f2.turns && f2.recover && f2.spin === Math.PI, 'a half-power flip without Land: ' + JSON.stringify(f2));
  await flip(0.2, true);
  await p.waitForSelector('#end.active', { timeout: 10000 });
  const end3 = await p.evaluate(() => ({ stars: document.getElementById('endStars').textContent, line: document.getElementById('endUnlock').textContent, best: Progress.best('oly_gym') }));
  check(end3.stars === '★★★' && /Gold medal/.test(end3.line) && /points/.test(end3.line) && /storey/.test(end3.line) && end3.best === f1.points, 'gymnastics result: ' + JSON.stringify(end3));
  // the Bug Book and the bug page show the medals and best results
  await p.click('#endMap');
  await p.click('#bookBtn');
  const book = await p.locator('.bookBug', { hasText: 'Bug Olympics' }).locator('.medals').textContent();
  check(/Gold 3 · Silver 0 · Bronze 0/.test(book) && /Long jump 3\d body lengths/.test(book) && /Sprint [\d.]+ seconds/.test(book) && /Gymnastics 1\d points/.test(book), 'book medals line: ' + book);
  await p.click('#bookBack');
  await p.locator('.pin', { hasText: 'Bug Olympics' }).click();
  check(/★★★/.test(await p.locator('.stageBtn').first().textContent()), 'no stars on the event button');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('Bug Circus: every act is open; the shoving match, the trapeze line, the bridge, the hiding and the strokes work; cheers are the stars', async (b) => {
  const p = await openGame(b);
  await p.locator('.pin', { hasText: 'Bug Circus' }).click();
  check(await p.locator('#stages .stageBtn:not([disabled])').count() === 5, 'not every act is open');
  check(/pretend/.test(await p.textContent('#stageFacts')), 'the act page does not say the show is pretend');
  // the Strongbug: the rival pushes the pair back on his own, holding pushes against him, taps shove hard (at most ten
  // a second count), a wind-up is followed by a heave, over his line wins the round and three wins give three cheers
  await startMission(p, 'cir_strong', {});
  const st = await p.evaluate(() => {
    const g = Game.g, m = g.mission, I = { pressed: false, held: false };
    const step = (n, input) => { for (let i = 0; i < n; i++) { m.update(g, 1 / 60, input); m.move(g, 1 / 60, 0, 0); } };
    g.heaveIn = 99;
    step(60, I); const idle = g.pos;
    g.pos = 0; step(60, { pressed: false, held: true }); const held = g.pos;
    g.pos = 0; step(10, { pressed: true, held: true }); const tapped = g.pos;   // ten taps in ten frames, under the cap
    g.pos = 0; g.heaveIn = 0; step(1, I); const windUp = g.windT > 0; step(Math.round(STRONG.windUp * 60) + 2, I); const heaving = g.heaveT > 0; step(30, I); const heaved = g.pos;
    return { idle, held, tapped, windUp, heaving, heaved, pushes: STRONG.rivals.map(r => r.push), rival: g.items[0] && g.items[0].sprite };
  });
  check(st.idle < -15 && st.held > st.idle && st.tapped >= 120 && st.tapped < 170 && st.windUp && st.heaving && st.heaved < -30 && st.pushes[2] > st.pushes[0] && st.rival === 'hornBeetle', 'the shoving match: ' + JSON.stringify(st));
  await p.evaluate(() => { const g = Game.g, m = g.mission; for (let r = 0; r < 3; r++) { g.restT = 1 / 120; let n = 0; while (g.round === r && n++ < 3000) { m.update(g, 1 / 60, { pressed: true, held: true }); m.move(g, 1 / 60, 0, 0); } } });
  await p.waitForSelector('#end.active', { timeout: 10000 });
  const end1 = await p.evaluate(() => ({ stars: document.getElementById('endStars').textContent, line: document.getElementById('endUnlock').textContent, saved: Progress.stars('cir_strong'), beaten: Game.g.beaten }));
  check(end1.stars === '★★★' && /Three cheers/.test(end1.line) && end1.saved === 3 && end1.beaten === 3, 'the Strongbug: ' + JSON.stringify(end1));
  // the trapeze: a jump trails a line from the bar; jumping as the bars swing apart misses, hangs on the line and
  // climbs back; jumping as they swing together catches the other bar, and canCatch (the helper ring) foresees both;
  // the gap grows with each catch, the ring goes after two, and a catch is still possible at the widest gap
  await p.click('#endMap');
  await startMission(p, 'cir_trapeze', {});
  const tr = await p.evaluate(() => {
    const g = Game.g, m = g.mission, p = g.player, T = TRAP;
    const settle = () => { let n = 0; while ((p.air || p.hang) && n++ < 6000) { g.t += 1 / 120; m.move(g, 1 / 120, 0, 0); } };
    const jumpAt = (t0) => { g.t = t0; p.air = false; p.hang = false; m.move(g, 0, 0, 0); const before = g.catches; m.jump(g); const anchored = !!g.anchor && p.air; settle(); return { anchored, caught: g.catches > before }; };
    g.t = T.period * 0.5 + 0.1; p.air = false; p.hang = false; m.move(g, 0, 0, 0); const noCatchApart = !m.canCatch(g);
    const apart = jumpAt(T.period * 0.5 + 0.1), misses = g.misses;   // the bars swinging apart
    let caught = null, foresaw = false; for (let k = 0; k < 10 && caught === null; k++) { const t0 = T.period * (k / 10) * 0.5 + 0.05; g.t = t0; p.air = false; p.hang = false; m.move(g, 0, 0, 0); const can = m.canCatch(g); const r = jumpAt(t0); if (r.caught) { caught = k; foresaw = can; } }
    const sepGrew = m.sep(g) > T.sep, cued = m.cued(g);
    // after two catches the helper ring and the green moment are gone: the button is simply ready on the bar
    g.catches = T.cued; g.t = T.period * 0.75; m.move(g, 0, 0, 0); m.update(g, 0.016, { pressed: false, held: false });
    const cueGone = !m.cued(g), readyAnyway = document.getElementById('actionBtn').classList.contains('ready');
    // at the widest gap a catch is still possible at some moment of the swing
    g.catches = T.catches - 2; const sepMax = m.sep(g);
    let caughtWide = null; for (let k = 0; k < 20 && caughtWide === null; k++) { const r = jumpAt(T.period * (k / 20) * 0.5 + 0.02); if (r.caught) caughtWide = k; }
    return { anchored: apart.anchored, noCatchApart, missed: !apart.caught && misses === 1, caught, foresaw, sepGrew, cued, cueGone, readyAnyway, sepMax, caughtWide, catches: g.catches, finished: g.cir.finished, seven: T.catches === 7 };
  });
  check(tr.anchored && tr.noCatchApart && tr.missed && tr.caught !== null && tr.foresaw && tr.sepGrew && tr.cued && tr.cueGone && tr.readyAnyway && tr.sepMax === 280 && tr.caughtWide !== null && !tr.finished && tr.seven, 'the trapeze: ' + JSON.stringify(tr));
  // the tightrope: the line sticks only when the wind blows at the far post; a gust without holding on blows her off,
  // holding on keeps her up; the far post ends the act
  await p.click('#menuBtn');
  await startMission(p, 'cir_rope', {});
  const rp = await p.evaluate(() => {
    const g = Game.g, m = g.mission, p = g.player, I = { pressed: false, held: false };
    g.wind = Math.PI; g.windV = 0; m.update(g, 0.016, { pressed: true, held: false }); const wrong = !!g.sail && !g.sail.ok;
    for (let i = 0; i < 100; i++) { g.wind = Math.PI; m.update(g, 0.016, I); } const backToWind = g.phase === 'wind';
    g.wind = 0; m.update(g, 0.016, { pressed: true, held: false }); const right = !!g.sail && g.sail.ok;
    for (let i = 0; i < 100; i++) { g.wind = 0; m.update(g, 0.016, I); } const walking = g.phase === 'walk';
    const x0 = p.x; m.move(g, 0.5, 1, 0); const walked = p.x - x0;
    g.gust = 1; g.blown = false; g.held = false; g.warn = 0; m.update(g, 0.016, I); const blown = g.fallT > 0 && g.falls === 1;
    g.fallT = 0; g.gust = 1; g.blown = false; g.held = false; m.update(g, 0.016, { pressed: false, held: true }); const held = g.fallT === 0 && g.held;
    g.gust = 0; p.x = World.w / 2 + ROPE.half - 30; m.move(g, 0.2, 1, 0);
    return { wrong, backToWind, right, walking, walked, blown, held, done: g.phase === 'done' && g.cir.finished };
  });
  check(rp.wrong && rp.backToWind && rp.right && rp.walking && rp.walked > 40 && rp.blown && rp.held && rp.done, 'the tightrope: ' + JSON.stringify(rp));
  await p.waitForSelector('#end.active', { timeout: 10000 });
  // the disappearing act: settled on the lit bark and lined up is hidden; the sand refuses a settle; moving is spotted
  await p.click('#endMap');
  await startMission(p, 'cir_vanish', {});
  const vn = await p.evaluate(() => {
    const g = Game.g, m = g.mission, p = g.player, lit = VANISH.patches[g.lit], cx = World.w / 2, cy = CIR.ring.cy, I = { pressed: false, held: false };
    p.x = cx + lit[1]; p.y = cy + lit[2]; p.moving = false;
    m.update(g, 0.016, { pressed: true, held: false }); const settling = p.settled;
    for (let i = 0; i < 60; i++) m.update(g, 0.016, I);
    const d = Math.abs(CIR.adiff(p.angle, lit[3])), aligned = d < 0.05 || Math.abs(d - Math.PI) < 0.05;
    m.look(g); const hidden = g.hidden === 1 && g.round === 1;
    const sand = VANISH.patches.find(q => q[0] === 'sand'); p.x = cx + sand[1]; p.y = cy + sand[2]; p.settled = false; p.moving = false;
    m.update(g, 0.016, { pressed: true, held: false }); const refused = !p.settled;
    const lit2 = VANISH.patches[g.lit]; p.x = cx + lit2[1]; p.y = cy + lit2[2]; p.moving = true; p.settled = false;
    m.look(g); const spotted = g.hidden === 1 && g.round === 2;
    return { settling, aligned, hidden, refused, spotted, litBark: lit[0] === 'bark' && lit2[0] === 'bark' };
  });
  check(vn.settling && vn.aligned && vn.hidden && vn.refused && vn.spotted && vn.litBark, 'the disappearing act: ' + JSON.stringify(vn));
  await p.click('#menuBtn');
  // walking on water: no stroke, no movement; a stroke pushes off and leaves dimples, then the strider glides and slows;
  // the pool's edge keeps her in; six insects end the act with cheers
  await startMission(p, 'cir_water', {});
  const wt = await p.evaluate(() => {
    const g = Game.g, m = g.mission, p = g.player, I = { pressed: false, held: false };
    const x0 = p.x; m.move(g, 0.5, 0, 0); const still = Math.abs(p.x - x0) < 0.01;
    p.angle = 0; m.update(g, 0.016, { pressed: true, held: false }); const pushed = p.vx > 150 && g.dimples.length === 2;
    for (let i = 0; i < 60; i++) m.move(g, 1 / 60, 0, 0); const glided = p.x - x0 > 60 && p.vx < 150;
    p.vx = 900; for (let i = 0; i < 120; i++) m.move(g, 1 / 60, 0, 0); const inside = Math.hypot(p.x - World.w / 2, p.y - CIR.ring.cy) <= WATER.r - 15;
    for (const b of g.items.filter(i => i.kind === 'bug')) { p.x = b.x; p.y = b.y; m.update(g, 0.016, I); }
    return { still, pushed, glided, inside, score: g.score, finished: g.cir.finished };
  });
  check(wt.still && wt.pushed && wt.glided && wt.inside && wt.score === 6 && wt.finished, 'walking on water: ' + JSON.stringify(wt));
  await p.waitForSelector('#end.active', { timeout: 10000 });
  check(/cheers/i.test(await p.textContent('#endUnlock')), 'no cheers on the end screen');
  // the Bug Book counts the cheers
  await p.click('#endMap'); await p.click('#bookBtn');
  const book = await p.locator('.bookBug', { hasText: 'Bug Circus' }).locator('.medals').textContent();
  check(/Cheers: \d+ of 15/.test(book), 'book cheers line: ' + book);
  check(p.errors.length === 0, p.errors.join('; '));
});

test('reach: an action is ready beside its target, a press that can’t act says why, and taps fit a finger', async (b) => {
  const p = await openGame(b);
  // an empty hint never burns the rate limit
  await startMission(p, 'ant', { noNet: true, noPred: true });
  check(await p.evaluate(() => { const g = Game.g; g.hintT = 0; Game.hint(''); return g.hintT === 0 && !g.toasts.some(t => t.kind === 'hint'); }), 'an empty hint was shown');
  await p.click('#menuBtn');
  // the item and spot levels: the button is ready 32 px from the thing, and a press far from anything says why
  const bad = [];
  for (const id of ['ant', 'bee', 'fly', 'caterpillar', 'butterfly', 'termite', 'snail', 'mosquito', 'oly_dig', 'oly_lift', 'oly_buzz']) {
    await startMission(p, id, { noNet: true, noPred: true });
    const r = await p.evaluate((id) => {
      const g = Game.g, m = g.mission, p = g.player;
      const target = {
        ant: () => g.items.find(i => i.kind === 'caterpillar' && !i.stunned),
        bee: () => g.items.find(i => i.pollen && i.kind !== 'paw'),
        fly: () => m.head(g.items.find(i => i.kind === 'cow')),
        caterpillar: () => g.items.find(i => (i.kind === 'everlasting' || i.kind === 'capeweed') && i.leaf > 0.05),
        butterfly: () => g.items.find(i => i.nectar),
        termite: () => g.items.find(i => i.kind === 'woodChip'),
        snail: () => g.items.find(i => i.amount > 0.05),
        mosquito: () => { for (const pp of m.people(g)) for (const s of m.spots(pp)) return s; return null; },
        oly_dig: () => g.items.find(i => i.kind === 'pat'),
        oly_lift: () => g.items[0],
        oly_buzz: () => g.items.find(i => i.pollen),
      }[id]();
      if (!target) return { error: 'no target' };
      p.x = target.x + 32; p.y = target.y; p.carry = null;
      m.update(g, 0.016, { pressed: false, held: false });
      const ready = document.getElementById('actionBtn').classList.contains('ready'), label = document.getElementById('actionBtn').textContent;
      // a press far from everything: the level's own reason, as a hint
      for (const i of g.items) i.x += 5000;
      for (const q of (g.pats || []).concat(g.sun || [])) q.x += 5000;   // the snail's sunny patches too: one in the corner would offer Seal
      p.x = 40; p.y = 40; g.hintT = 0; g.toasts = []; g.toastT = 0; Game.showToast(null);
      const want = m.notReady(g);
      Input.pressed = true; Game.update(1 / 60); Input.pressed = false;
      const el = document.getElementById('toast'), hint = el.classList.contains('hint') ? el.textContent : (g.toasts.find(t => t.kind === 'hint') || {}).text;
      for (const i of g.items) i.x -= 5000;
      for (const q of (g.pats || []).concat(g.sun || [])) q.x -= 5000;
      return { ready, label, hint, want };
    }, id);
    if (!(r.ready && r.hint && r.hint === r.want)) bad.push(id + ': ' + JSON.stringify(r));
    await p.click('#menuBtn');
  }
  check(bad.length === 0, bad.join(' | '));
  check(p.errors.length === 0, p.errors.join('; '));
  // taps fit a finger on a phone: Set free 20 CSS px off a stuck insect frees it, Cut 12 px off a thread cuts it
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const q = await ctx.newPage();
  q.errors = []; q.on('pageerror', (e) => q.errors.push(e.message)); q.on('console', (m) => { if (m.type() === 'error') q.errors.push(m.text()); });
  await q.goto(FILE_URL);
  await startMission(q, 'web', {});
  const box = await q.locator('#game').boundingBox(), Wn = await q.evaluate(() => W);
  const toScreen = (x, y) => [box.x + x / Wn * box.width, box.y + y / 600 * box.height];
  const fly = await q.evaluate(() => { const g = Game.g, t = g.threads[0], x = (t.a.x + t.b.x) / 2, y = (t.a.y + t.b.y) / 2; g.prey.push({ sprite: 'fly', x, y, vx: 90, vy: 0, ph: 0, r: 8, scale: 1.7, angle: 0, flat: true, stuck: t, tag: 'freeMe' }); return [x, y, Game.fingerR()]; });
  check(fly[2] > 30 && fly[2] <= 48, 'a fingertip on a phone is ' + fly[2] + ' world px');
  await q.locator('#tools .tool', { hasText: 'Set free' }).click();
  const [sx, sy] = toScreen(fly[0], fly[1]);
  await q.touchscreen.tap(sx + 20, sy);
  await q.waitForFunction(() => { const q = Game.g.prey.find(q => q.tag === 'freeMe'); return !q || (!q.stuck && q.freeT > 0); }, null, { timeout: 5000 });
  // a tap on empty sawdust with Set free says what to tap
  await q.evaluate(() => { const g = Game.g; g.hintT = 0; g.toasts = []; g.toastT = 0; Game.showToast(null); });
  await q.touchscreen.tap(sx, sy + 120);
  check(await q.waitForFunction(() => Game.g.toasts.some(t => t.kind === 'hint' && /stuck insect/.test(t.text)) || /stuck insect/.test(document.getElementById('toast').textContent), null, { timeout: 2000 }).then(() => true, () => false), 'no hint for a Set free tap on nothing');
  const th = await q.evaluate(() => { const t = Game.g.threads[0]; return [(t.a.x + t.b.x) / 2, (t.a.y + t.b.y) / 2, Game.g.threads.length]; });
  await q.locator('#tools .tool', { hasText: 'Cut' }).click();
  const [cx, cy] = toScreen(th[0], th[1]);
  await q.touchscreen.tap(cx, cy + 12);
  check(await q.evaluate((n) => Game.g.threads.length < n, th[2]), 'a tap 12 px off the thread did not cut it');
  check(q.errors.length === 0, q.errors.join('; '));
  await ctx.close();
});

test('real size: the bug is drawn life-size with a ruler, the coin match is saved, phones use their own scale', async (b) => {
  const p = await openGame(b);
  // the ant's page has the button; the screen draws the ant 20 mm long at 96 dpi (3.78 px per mm), with the ruler and a line to read
  await p.locator('.pin').first().click();
  check(await p.isVisible('#sizeBtn'), 'no Real size button on the ant page');
  await p.click('#sizeBtn');
  check(await p.isVisible('#size.active'), 'the Real size screen did not open');
  const ant = await p.evaluate(() => { const c = document.getElementById('sizeCanvas'), r = c.getBoundingClientRect(); return { w: r.width, h: r.height, want: 20 * Size.pxPerMm(), px: Size.pxPerMm(), line: document.getElementById('sizeLine').textContent, cmp: document.getElementById('sizeCompare').textContent, ruler: document.getElementById('sizeRuler').getBoundingClientRect().width, note: document.getElementById('sizeNote').textContent }; });
  check(Math.abs(ant.w - ant.want) <= 2 && Math.abs(ant.px - 96 / 25.4) < 1e-6 && ant.h > 10 && ant.h < ant.w, 'the ant is not 20 mm long: ' + JSON.stringify(ant));
  check(/about 20 mm long/.test(ant.line) && /Put your finger/.test(ant.line) && /5 cent coin/.test(ant.cmp) && Math.abs(ant.ruler - 50 * ant.px - 2) <= 2 && /About real size/.test(ant.note), 'the lines or the ruler: ' + JSON.stringify(ant));
  // the coin match: the slider rescales everything, is saved, survives a reload, and Start again clears it
  await p.evaluate(() => { const s = document.getElementById('coinSlider'); s.value = 20; s.dispatchEvent(new Event('input')); });
  const after = await p.evaluate(() => ({ saved: +localStorage.getItem('bugame.mm'), w: document.getElementById('sizeCanvas').getBoundingClientRect().width, note: document.getElementById('sizeNote').textContent, coin: document.getElementById('coinCanvas').getBoundingClientRect().width }));
  check(Math.abs(after.saved - 1.2 * 96 / 25.4) < 1e-6 && Math.abs(after.w - 20 * after.saved) <= 2 && /Matched/.test(after.note) && after.coin > 28.65 * after.saved, 'the coin match: ' + JSON.stringify(after));
  await p.reload();
  check(await p.evaluate((px) => Math.abs(Size.pxPerMm() - px) < 1e-6, after.saved), 'the coin match was not kept');
  await p.evaluate(() => { openBug(Bugs.find(b => b.id === 'ant'), 'ant'); });
  await p.click('#sizeBtn');
  await p.click('#coinReset');
  check(await p.evaluate(() => Math.abs(Size.pxPerMm() - 96 / 25.4) < 1e-6 && !localStorage.getItem('bugame.mm')), 'Start again did not clear the match');
  // the butterfly is measured across its wings: the canvas is 50 mm tall; Back returns to the bug page
  await p.click('#sizeBack');
  check(await p.isVisible('#bug.active'), 'Back did not return to the bug page');
  await p.evaluate(() => { openBug(Bugs.find(b => b.id === 'butterfly'), 'butterfly'); });
  await p.click('#sizeBtn');
  const bf = await p.evaluate(() => { const r = document.getElementById('sizeCanvas').getBoundingClientRect(); return { h: r.height, want: 50 * Size.pxPerMm() }; });
  check(Math.abs(bf.h - bf.want) <= 2, 'the butterfly is not 50 mm across: ' + JSON.stringify(bf));
  // every stage that is a real bug has a size, the garden and hand pages hide the button (and the fox's: too big for a screen), the trapeze is the peacock spider
  const cover = await p.evaluate(() => {
    const need = Object.keys(PAINT_BUGS).concat(['queenAnt', 'babyHopper', 'plCaterpillar', 'chrysalis', 'nymph', 'spiderling', 'femaleSpider', 'clickBeetle', 'hornBeetle', 'moth', 'waterStrider', 'queenSugar']);
    return { missing: need.filter(n => !SIZES[n]), noSize: Object.values(Missions).filter(m => !Size.of(m)).map(m => m.id), trapeze: Size.sprite(Missions.cir_trapeze), badText: Object.values(SIZES).filter(S => !/\d+(\.\d+)? mm/.test(S.what)).length };
  });
  check(cover.missing.length === 0 && cover.noSize.join() === 'garden,hand,ldn_fox' && cover.trapeze === 'spider' && cover.badText === 0, 'sizes: ' + JSON.stringify(cover));
  await p.evaluate(() => { openBug(Bugs.find(b => b.id === 'garden')); });
  check(!(await p.isVisible('#sizeBtn')), 'the garden page shows Real size');
  await p.evaluate(() => { openBug(Bugs.find(b => b.id === 'olympics'), 'oly_gym'); });
  check(await p.isVisible('#sizeBtn'), 'the gymnastics page hides Real size');
  // every size comes out at its figure along its axis (the snail is measured on its shell, so the crawling snail is longer), from the flat drawings here
  const sizes = (pg, mode) => pg.evaluate((mode) => { const bad = []; for (const name of Object.keys(SIZES)) { Size.current = name; const r = Size.drawBug(document.getElementById('sizeCanvas'), name), S = SIZES[name], got = S.axis === 'y' ? r.h : r.w, want = S.mm * Size.pxPerMm(); const ok = S.measure ? got > want && got < 2 * want : Math.abs(got - want) <= 2; if (!ok || r.w < 2 || r.h < 2) bad.push(name + ' ' + mode + ' ' + JSON.stringify(r)); } return bad; }, mode);
  await p.click('#sizeBtn');
  const bad2 = await sizes(p, '2d');
  check(bad2.length === 0 && await p.evaluate(() => !SpriteCache.is3D('ant')), bad2.join('; '));
  check(p.errors.length === 0, p.errors.join('; '));
  await p.context().close();
  // and from the 3D models: the extent is measured on the model's own bitmap, so the sizes still come out right
  const p3 = await openGame(b, null, FILE_URL + '?3d=force');
  await p3.waitForFunction(() => typeof Render3D !== 'undefined' && (Render3D.ok || Render3D.failed), null, { timeout: 60000 });
  check(await p3.evaluate(() => Render3D.ok && SpriteCache.is3D('ant')), 'Render3D did not start');
  await p3.evaluate(() => { openBug(Bugs.find(b => b.id === 'ant'), 'ant'); });
  await p3.click('#sizeBtn');
  const ant3 = await p3.evaluate(() => { const r = document.getElementById('sizeCanvas').getBoundingClientRect(); return { w: r.width, h: r.height, want: 20 * Size.pxPerMm(), e2: Size.extent('ant', Size.opts('ant', SIZES.ant, true), 0.4) }; });
  check(Math.abs(ant3.w - ant3.want) <= 2 && ant3.h > 10, 'the 3D ant is not 20 mm long: ' + JSON.stringify(ant3));
  const bad3 = await sizes(p3, '3d');
  check(bad3.length === 0, bad3.join('; '));
  check(p3.errors.length === 0, p3.errors.join('; '));
  await p3.context().close();
  // a touch screen starts from 160 dpi: the ant is 126 px long; a phone on its side has no sideways scroll
  const ctx = await b.newContext({ viewport: { width: 740, height: 360 }, hasTouch: true });
  const q = await ctx.newPage(); q.errors = []; q.on('pageerror', (e) => q.errors.push(e.message));
  await q.goto(FILE_URL);
  await q.evaluate(() => { openBug(Bugs.find(b => b.id === 'ant'), 'ant'); });
  await q.click('#sizeBtn');
  const ph = await q.evaluate(() => ({ px: Size.pxPerMm(), w: document.getElementById('sizeCanvas').getBoundingClientRect().width, scrollX: document.documentElement.scrollWidth - window.innerWidth }));
  check(Math.abs(ph.px - 160 / 25.4) < 1e-6 && Math.abs(ph.w - 20 * ph.px) <= 2 && ph.scrollX <= 0, 'the phone scale: ' + JSON.stringify(ph));
  check(q.errors.length === 0, q.errors.join('; '));
  await ctx.close();
});

test('bug quiz: eight picture questions a round, right and wrong answers explained, the best is saved, a perfect round is a secret', async (b) => {
  const p = await openGame(b);
  await p.click('#quizBtn');
  check(await p.isVisible('#quiz.active'), 'the quiz did not open');
  // readable for a seven-year-old: short questions, three different bugs, one right, every picture and name exists
  const read = await p.evaluate(() => {
    const bad = [];
    for (const q of QUESTIONS) {
      if (q.q.split(' ').length > 8 || q.q.length > 48) bad.push('long: ' + q.q);
      const all = [q.a].concat(q.wrong); if (all.length !== 3 || new Set(all).size !== 3) bad.push('not three bugs: ' + q.q);
      for (const n of all) if (!Sprites[n] || !BUG_NAMES[n]) bad.push('unknown bug ' + n);
      if (q.why.length > 90) bad.push('long why: ' + q.q);
    }
    for (const w of WHAT_IS) { const all = [w.pic].concat(w.wrong); if (new Set(all).size !== 3) bad.push('not three names: ' + w.pic); for (const n of all) if (!Sprites[n] || !BUG_NAMES[n]) bad.push('unknown bug ' + n); }
    return { bad, n: QUESTIONS.length, what: WHAT_IS.length, round: Quiz.round.length, kinds: Quiz.round.map(q => q.kind).sort().join(''), pics: new Set(Quiz.round.filter(q => q.kind === 'what').map(q => q.a)).size };
  });
  check(read.bad.length === 0 && read.n >= 30 && read.what >= 10 && read.round === 8 && read.kinds === 'whatwhatwhatwhowhowhowhowho' && read.pics === 3, 'the questions: ' + JSON.stringify(read));
  const first = await p.evaluate(() => { const q = Quiz.current(); return { kind: q.kind, buttons: document.querySelectorAll('.quizA').length, canvases: document.querySelectorAll('#quizA canvas').length, pic: !document.getElementById('quizPic').hidden, text: document.getElementById('quizQ').textContent === q.q, nextOff: document.getElementById('quizNext').disabled, size: document.querySelector('.quizA').getBoundingClientRect().height }; });
  check(first.buttons === 3 && first.text && first.nextOff && first.size >= 44 && (first.kind === 'who' ? first.canvases === 3 && !first.pic : first.canvases === 0 && first.pic), 'the first question: ' + JSON.stringify(first));
  // a round: seven right, the fourth wrong; each answer lights the right bug and explains
  const seen = [];
  for (let i = 0; i < 8; i++) {
    seen.push(await p.evaluate((wrongOne) => {
      const q = Quiz.current(), idx = wrongOne ? q.choices.findIndex(n => n !== q.a) : q.choices.indexOf(q.a);
      document.querySelectorAll('.quizA')[idx].click();
      const why = document.getElementById('quizWhy');
      return { ok: (wrongOne ? /^Not that one\. / : /^Yes! /).test(why.textContent) && why.textContent.includes(q.why) && why.classList.contains(wrongOne ? 'no' : 'yes'),
        lit: document.querySelector('.quizA.right').dataset.name === q.a && document.querySelectorAll('.quizA.wrong').length === (wrongOne ? 1 : 0), locked: [...document.querySelectorAll('.quizA')].every(b => b.disabled), next: document.getElementById('quizNext').textContent };
    }, i === 3));
    await p.click('#quizNext');
  }
  check(seen.every(s => s.ok && s.lit && s.locked) && seen[7].next === 'See my score', 'answers: ' + JSON.stringify(seen));
  const end = await p.evaluate(() => ({ q: document.getElementById('quizQ').textContent, best: Progress.best('quiz'), saved: JSON.parse(localStorage.getItem('bugame.progress')).best.quiz, secret: Progress.hasSecret('s_quiz'), next: document.getElementById('quizNext').textContent, stars: document.getElementById('quizStars').textContent }));
  check(end.q === 'You got 7 out of 8!' && end.best === 7 && end.saved === 7 && !end.secret && end.next === 'Play again' && end.stars === '★★★★★★★☆', 'the end of the round: ' + JSON.stringify(end));
  // a perfect round: the best goes up and the Bug expert secret is found; the Book counts it
  await p.click('#quizNext');
  for (let i = 0; i < 8; i++) { await p.evaluate(() => { const q = Quiz.current(); document.querySelectorAll('.quizA')[q.choices.indexOf(q.a)].click(); }); await p.click('#quizNext'); }
  check(await p.evaluate(() => Progress.best('quiz') === 8 && Progress.hasSecret('s_quiz') && /Bug expert/.test(document.getElementById('quizWhy').textContent)), 'a perfect round');
  // the speaker reads the question and the three names
  await p.evaluate(() => { window.spoken = []; window.speechSynthesis.speak = (u) => window.spoken.push(u.text); });
  await p.click('#quizNext');
  await p.click('#quizSpeak');
  check(await p.evaluate(() => { const q = Quiz.current(); return window.spoken.length === 1 && window.spoken[0].startsWith(q.q) && q.choices.every(n => window.spoken[0].includes(BUG_NAMES[n])); }), 'the speaker did not read the question and the names');
  await p.click('#quizBack');
  check(await p.isVisible('#map.active'), 'Map did not go back to the map');
  await p.click('#bookBtn');
  check(/Bug expert/.test(await p.textContent('.secrets')), 'the Book does not list the quiz secret');
  check(p.errors.length === 0, p.errors.join('; '));
  await p.context().close();
  // a phone held upright: three answers across, no sideways scroll, buttons at least 44 px
  const q = await openGame(b, { width: 360, height: 740 });
  await q.click('#quizBtn');
  const ph = await q.evaluate(() => ({ scrollX: document.documentElement.scrollWidth - window.innerWidth, h: Math.min(...[...document.querySelectorAll('.quizA')].map(b => b.getBoundingClientRect().height)), rows: new Set([...document.querySelectorAll('.quizA')].map(b => Math.round(b.getBoundingClientRect().top))).size }));
  check(ph.scrollX <= 0 && ph.h >= 44 && ph.rows === 1, 'the quiz in a narrow window: ' + JSON.stringify(ph));
  check(q.errors.length === 0, q.errors.join('; '));
  // a phone on its side (phones always play landscape): three answers across, no scroll sideways
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const r = await ctx.newPage(); r.errors = []; r.on('pageerror', (e) => r.errors.push(e.message));
  await r.goto(FILE_URL);
  await r.click('#quizBtn');
  const pl = await r.evaluate(() => ({ scrollX: document.documentElement.scrollWidth - window.innerWidth, h: Math.min(...[...document.querySelectorAll('.quizA')].map(b => b.getBoundingClientRect().height)), rows: new Set([...document.querySelectorAll('.quizA')].map(b => Math.round(b.getBoundingClientRect().top))).size, covered: Orient.covered }));
  check(pl.scrollX <= 0 && pl.h >= 44 && pl.rows === 1 && !pl.covered, 'the quiz on a phone on its side: ' + JSON.stringify(pl));
  check(r.errors.length === 0, r.errors.join('; '));
  await ctx.close();
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

test('the net girl is rare and random, rests after a visit, and her net can be dodged', async (b) => {
  const p = await openGame(b);
  // the odds: about one level in four, 20 to 140 s in; never in a noNet level; never in the two starts after a visit
  const odds = await p.evaluate(() => {
    let n = 0, lo = 1e9, hi = 0; Game.netRest = 0;
    for (let i = 0; i < 4000; i++) { const t = Game.rollNet({}); if (t < 1e8) { n++; lo = Math.min(lo, t); hi = Math.max(hi, t); } }
    Game.netRest = 2; const rest = [Game.rollNet({}), Game.rollNet({})], left = Game.netRest;
    return { share: n / 4000, lo, hi, none: Game.rollNet({ noNet: true }), rest, left };
  });
  check(odds.share > 0.2 && odds.share < 0.3 && odds.lo >= 20 && odds.hi <= 140 && odds.none > 1e8, 'her odds: ' + JSON.stringify(odds));
  check(odds.rest.every(t => t > 1e8) && odds.left === 0, 'no rest after a visit: ' + JSON.stringify(odds));
  await p.evaluate(() => { window.shown = []; const pop = Game.pop.bind(Game); Game.pop = (x, y, text, c) => { shown.push(text); return pop(x, y, text, c); }; });
  // out from under the net before it lands: she misses and doesn't come back; the next two levels are hers off
  await startMission(p, 'ant', { noPred: true });
  await p.evaluate(LDN_STEP);
  const miss = await p.evaluate(() => {
    const g = Game.g, pl = g.player; g.timers = []; Game.netRest = 0;
    pl.x += 400; g.netT = 0; lstep(0.1);
    const out = { aiming: !!g.net && !g.event, rest: Game.netRest, steer: null };
    const x0 = pl.x; lstep(0.3, { keys: ['arrowright'] }); out.steer = pl.x - x0 > 20;   // you can still move while it comes down
    pl.x += 200; lstep(2.5);
    return Object.assign(out, { event: !!g.event, net: !!g.net, done: g.netDone, missed: shown.includes('Missed!') });
  });
  check(miss.aiming && miss.rest === 2 && miss.steer, 'the net did not aim first: ' + JSON.stringify(miss));
  check(!miss.event && !miss.net && miss.done && miss.missed, 'a dodged net still caught the bug: ' + JSON.stringify(miss));
  // still under it when it lands: caught, into the tank; getting out is one secret and brings her advice
  await startMission(p, 'ant', { noPred: true });
  await p.evaluate(LDN_STEP);
  const got = await p.evaluate(() => {
    const g = Game.g, pl = g.player; g.timers = [];
    pl.x += 400; g.netT = 0; lstep(2);
    const out = { swoop: !!g.event && g.event.phase === 'swoop' };
    lstep(3); out.tank = !!g.event && g.event.phase === 'tank'; out.says = g.event && g.event.say;
    Game.leaveTank('You escaped! Back to the wild.');
    out.secret = Progress.hasSecret('s_tank'); out.advice = g.toasts.some(t => /always let it go/.test(t.text)); out.fact = 'tank' in g.mission.factText;
    return out;
  });
  check(got.swoop && got.tank && got.says && got.secret && got.advice && !got.fact, 'caught under the net: ' + JSON.stringify(got));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('kid with a net: tank escape and 20 s release', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'termite', { noPred: true });
  await p.evaluate(() => { const g = Game.g; g.player.x += 400; g.player.y -= 300; g.player.carry = 'mud'; g.netT = 0; });
  await p.waitForFunction(() => Game.g.event && Game.g.event.phase === 'tank', null, { timeout: 8000 });
  check(await p.textContent('#actionBtn') === 'Crawl', 'escape verb');
  await p.waitForFunction(() => Game.g.event.open, null, { timeout: 10000 });
  await p.evaluate(() => { const o = Game.g.event.open; Game.g.player.x = o.x; Game.g.player.y = o.y; });
  await p.keyboard.press(' ');
  await p.waitForTimeout(150);
  check(await p.evaluate(() => !Game.g.event && Game.g.player.carry === 'mud'), 'did not escape with carry kept');
  await startMission(p, 'snail', { noPred: true });
  await p.evaluate(() => { Game.g.player.x += 400; Game.g.netT = 0; });
  await p.waitForFunction(() => Game.g.event && Game.g.event.phase === 'tank', null, { timeout: 8000 });
  await p.evaluate(() => { Game.g.event.t = 19.95; });
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

// The 3D sprite renderer (js/render3d.js). Headless Chromium only has software WebGL, which the game refuses,
// so ?3d=force is used here: slow, but the same pixels a phone's GPU would draw.
test('3D sprites: a model renders with a shadow, light turns with the heading, tiles wrap', async (b) => {
  const p = await openGame(b, null, FILE_URL + '?3d=force');
  await p.waitForFunction(() => typeof Render3D !== 'undefined' && (Render3D.ok || Render3D.failed), null, { timeout: 60000 });
  check(await p.evaluate(() => Render3D.ok), 'Render3D did not start');
  const r = await p.evaluate(() => {
    const count = (c) => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let body = 0, soft = 0;
      for (let i = 3; i < d.length; i += 4) { if (d[i] > 240) body++; else if (d[i] > 20) soft++; }
      return { body, soft, px: c.width * c.height };
    };
    const a = SpriteCache.image('ant', { moving: false }, { px: 4, angle: 0 });
    const b2 = SpriteCache.image('ant', { moving: false }, { px: 4, angle: Math.PI });
    const bee = SpriteCache.image('bee', { moving: true, load: 1 }, { px: 4, angle: 1, t: 0.2 });
    const tile = Render3D.tile(64, 2, 8, (api) => { api.add(Render3D.M.part(Render3D.M.sphere(5), Render3D.M.chitin('#a04020')), 2, 32); });
    const td = tile.getContext('2d').getImageData(0, 0, tile.width, tile.height).data;
    let left = 0, right = 0;
    for (let y = 0; y < tile.height; y++) { if (td[(y * tile.width) * 4 + 3] > 100) left++; if (td[(y * tile.width + tile.width - 1) * 4 + 3] > 100) right++; }
    // The ladybird's painted seam must run along its back (the long axis), not across it
    const lb = SpriteCache.image('ladybird', { moving: false }, { px: 8, angle: 0 });
    const ld = lb.c.getContext('2d').getImageData(0, 0, lb.c.width, lb.c.height).data, ox = -lb.box[0] * 8, oy = -lb.box[1] * 8;
    const dark = (x, y) => { const i = (Math.round(y) * lb.c.width + Math.round(x)) * 4; return ld[i + 3] > 200 && ld[i] < 70 && ld[i + 1] < 70 && ld[i + 2] < 70; };
    let along = 0, across = 0;
    for (let d = -5.5 * 8; d <= 4.5 * 8; d++) if (dark(ox - 8 + d, oy)) along++;      // the row through the dome's centre line
    for (let d = -4.5 * 8; d <= 4.5 * 8; d++) if (dark(ox - 8, oy + d)) across++;     // the column across it
    // every fan palette renders from one shared spider (recoloured in pose), and col 0 comes back the same
    const fans = SPIDER_COLS.map((_, k) => { const e = SpriteCache.image('spider', { dance: 1, col: k }, { px: 4, angle: 0 }); return e && e.threeD ? e.c.toDataURL() : null; });
    SpriteCache.clear();
    const again = SpriteCache.image('spider', { dance: 1, col: 0 }, { px: 4, angle: 0 });
    const roots = [...Models.built.keys()].filter(k => k.startsWith('spider|')).length;
    const sac = SpriteCache.image('eggSac', {}, { px: 4, angle: 0 }), sacOpen = SpriteCache.image('eggSac', { state: 'open' }, { px: 4, angle: 0 });
    return { ant: a && count(a.c), threeD: !!(a && a.threeD), different: a && b2 && a.c.toDataURL() !== b2.c.toDataURL(), bee: bee && count(bee.c), left, right, seam: { along, across }, stats: Render3D.stats,
      fans: { all3D: fans.every(Boolean), distinct: new Set(fans).size, same0: !!again && again.c.toDataURL() === fans[0], roots }, sac: { open3D: !!(sacOpen && sacOpen.threeD), differs: !!(sac && sacOpen) && sac.c.toDataURL() !== sacOpen.c.toDataURL() } };
  });
  check(r.fans.all3D && r.fans.distinct === 8 && r.fans.same0 && r.fans.roots <= 4, 'the spider palettes in 3D: ' + JSON.stringify(r.fans));
  check(r.sac.open3D && r.sac.differs, 'the opened egg sac in 3D: ' + JSON.stringify(r.sac));
  check(r.seam.along > 40 && r.seam.along > r.seam.across * 1.5, 'ladybird seam does not run along the back: ' + JSON.stringify(r.seam));
  check(r.threeD, 'ant was not rendered in 3D');
  check(r.ant.body > r.ant.px * 0.03, 'ant body too small: ' + JSON.stringify(r.ant));
  check(r.ant.soft > r.ant.body * 0.2, 'no soft shadow or edges: ' + JSON.stringify(r.ant));
  check(r.different, 'the light did not turn with the heading');
  check(r.bee.body > 50, 'bee did not render: ' + JSON.stringify(r.bee));
  check(r.left > 0 && r.right > 0, 'tile does not wrap at its edges: ' + r.left + '/' + r.right);
  check(p.errors.length === 0, p.errors.join('; '));
});

test('3D sprites: the ant level plays with the models, and ?no3d=1 keeps the drawings', async (b) => {
  const p = await openGame(b, null, FILE_URL + '?3d=force');
  await p.waitForFunction(() => typeof Render3D !== 'undefined' && (Render3D.ok || Render3D.failed), null, { timeout: 60000 });
  await p.addScriptTag({ content: BOT });
  await startMission(p, 'ant', { noNet: true });
  await p.evaluate(() => { Bot.install('perfect'); Game.timeScale = 3; });
  await p.waitForFunction(() => Game.g.score >= 2 || Game.g.t > 40, null, { timeout: 120000 });
  const st = await p.evaluate(() => ({ is3D: SpriteCache.is3D('ant'), renders: Render3D.stats.renders, broken: Object.keys(Models.defs).filter((k) => Models.defs[k].broken) }));
  check(st.is3D && st.renders > 0, 'ant not drawn from its model: ' + JSON.stringify(st));
  check(st.broken.length === 0, 'broken models: ' + st.broken.join(','));
  check(p.errors.length === 0, p.errors.join('; '));
  const q = await openGame(b, null, FILE_URL + '?no3d=1');
  await startMission(q, 'ant', { noNet: true, noPred: true });
  await q.waitForTimeout(300);
  check(await q.evaluate(() => !Render3D.ok && !SpriteCache.is3D('ant') && Game.running), '2D fallback not in use');
  check(q.errors.length === 0, q.errors.join('; '));
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
  check(await p.evaluate(() => Tree.hits.filter(h => h.bug).length === Bugs.filter(b => b.kind !== 'sandbox').length), 'not every bug is on the tree');
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
  // Safe in the burrow: the girl's net doesn't come, and a gull won't dive
  await p.evaluate(() => { Game.g.netT = 0; Game.g.netDone = false; Game.g.player.invuln = 0; Game.g.preds.push(Missions.sandhopper.makeGull(Game.g)); Game.g.preds[0].t = 6; Game.g.preds[0].x = Game.g.player.x; });
  await p.waitForTimeout(1500);
  check(await p.evaluate(() => !Game.g.event && Game.g.lives === 3 && Game.g.preds[0].state !== 'chase'), 'not safe in the burrow');
  // Seaweed you're standing next to can be eaten
  await p.evaluate(() => { Game.g.preds = []; Game.g.event = null; Game.g.netDone = true; const w = Game.g.items.find(i => i.kind === 'wrack'); Game.g.player.x = w.x + 40; Game.g.player.y = Beach.ground(w.x) - 30; });
  await p.waitForTimeout(500);
  check(await p.textContent('#actionBtn') === 'Eat', 'no Eat button next to seaweed');
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

test('a side-on and an isometric level are open from the start, and tagged on the map', async (b) => {
  const p = await openGame(b);
  for (const [name, tag] of [['Sandhopper', 'Side-on'], ['Mosquito', 'Isometric']]) {
    const pin = p.locator('.pin', { hasText: name });
    check((await pin.locator('.viewTag').textContent()) === tag, name + ' not tagged ' + tag);
    await pin.click();
    check(!(await p.locator('#bugStart').isDisabled()) && !/locked/.test(await p.textContent('#stages')), name + ' locked');
    await p.click('#bugStart');
    check(await p.isVisible('#play.active'), name + ' did not start');
    await p.click('#menuBtn');
  }
});

test('native garden: paint, plant, wildlife arrives, garden is saved', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'garden', {});
  check(await p.isVisible('#tools') && !(await p.isVisible('#actionBtn')), 'tool palette not shown');
  const box = await p.locator('#game').boundingBox();
  const at = (x, y) => [box.x + x / 960 * box.width, box.y + y / 600 * box.height];
  // Real drag with the pond tool
  await p.locator('#tools .tool', { hasText: 'Pond' }).click();
  await p.mouse.move(...at(500, 300)); await p.mouse.down();
  for (let x = 500; x <= 700; x += 20) for (const y of [300, 340]) await p.mouse.move(...at(x, y));
  await p.mouse.up();
  check(await p.evaluate(() => gardenCounts(Game.g).water >= 6), 'pond not painted');
  await p.locator('#tools .tool', { hasText: 'Everlasting' }).click();
  await p.mouse.click(...at(250, 150)); await p.mouse.click(...at(300, 180));
  check(await p.evaluate(() => gardenCounts(Game.g).everlasting === 2), 'plants not placed');
  await p.evaluate(() => { Game.timeScale = 8; });
  await p.waitForFunction(() => Game.g.score >= 2, null, { timeout: 20000 });
  // Saved: reopen and it's still there
  await p.click('#menuBtn');
  await startMission(p, 'garden', {});
  check(await p.evaluate(() => gardenCounts(Game.g).everlasting === 2 && gardenCounts(Game.g).water >= 6), 'garden not saved');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('orb web: spin threads between branches, spiral, wrap stuck insects', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'web', {});
  const box = await p.locator('#game').boundingBox();
  const at = (x, y) => [box.x + x / 960 * box.width, box.y + y / 600 * box.height];
  const drag = async (a, c) => { await p.mouse.move(...at(...a)); await p.mouse.down(); await p.mouse.move(...at(...c)); await p.mouse.up(); };
  await drag([158, 300], [898, 260]);
  for (const e of [[520, 80], [700, 66], [740, 262], [650, 510], [430, 470], [330, 318], [300, 72]]) await drag([520, 280], e);
  check(await p.evaluate(() => Game.g.threads.length >= 9), 'threads not spun');
  await drag([520, 280], [520, 400]);   // ends in mid-air: not allowed
  check(await p.evaluate(() => Game.g.threads.length < 10), 'thread ending in the air was allowed');
  await p.locator('#tools .tool', { hasText: 'Spiral' }).click();
  await p.mouse.click(...at(520, 280));
  check(await p.evaluate(() => Game.g.threads.some(t => t.type === 'sticky')), 'no spiral');
  await p.evaluate(() => { Game.timeScale = 4; });
  await p.waitForFunction(() => Game.g.prey.some(q => q.stuck && !q.wrapped), null, { timeout: 30000 });
  await p.evaluate(() => { Game.g.prey.filter(q => q.stuck).forEach(q => { q.sting = false; }); });
  const q = await p.evaluate(() => { const q = Game.g.prey.find(q => q.stuck && !q.wrapped); return [q.x, q.y]; });
  await p.mouse.click(...at(...q));
  await p.waitForFunction(() => Game.g.wrapped >= 1, null, { timeout: 10000 });
  // Tap the bundle to eat it: score and silk go up
  const silk0 = await p.evaluate(() => { Game.g.silk = 50; return 50; });
  const bundle = await p.evaluate(() => { const q = Game.g.prey.find(q => q.wrapped); return [q.x, q.y]; });
  await p.mouse.click(...at(...bundle));
  await p.waitForFunction(() => Game.g.score >= 1, null, { timeout: 10000 });
  check(await p.evaluate((s0) => Game.g.silk > s0 + 20, silk0), 'eating did not give silk');
  // Set free: pick the tool and tap a stuck insect
  const th = await p.evaluate(() => { const g = Game.g, t = g.threads.find(t => t.type === 'sticky'); const x = (t.a.x + t.b.x) / 2, y = (t.a.y + t.b.y) / 2;
    g.prey.push({ sprite: 'fly', x, y, vx: 90, vy: 0, ph: 0, r: 8, scale: 1.7, angle: 0, flat: true, stuck: t, tag: 'freeMe' }); return [x, y]; });
  await p.evaluate(() => { Game.timeScale = 1; });
  await p.locator('#tools .tool', { hasText: 'Set free' }).click();
  await p.mouse.click(...at(...th));
  await p.waitForFunction(() => { const q = Game.g.prey.find(q => q.tag === 'freeMe'); return !q || (!q.stuck && q.freeT > 0); }, null, { timeout: 5000 });
  // A stinging bee is cut loose instead of wrapped
  await p.locator('#tools .tool', { hasText: 'Dry silk' }).click();
  const bee = await p.evaluate(() => { const g = Game.g, t = g.threads.find(t => t.type === 'sticky'); const x = (t.a.x * 0.3 + t.b.x * 0.7), y = (t.a.y * 0.3 + t.b.y * 0.7);
    g.prey.push({ sprite: 'resinBee', x, y, vx: 90, vy: 0, ph: 0, r: 8, scale: 1.7, angle: 0, flat: true, stuck: t, sting: true, tag: 'bee' }); return [x, y]; });
  await p.mouse.click(...at(...bee));
  await p.waitForFunction(() => { const q = Game.g.prey.find(q => q.tag === 'bee'); return !q || (!q.stuck && !q.wrapped); }, null, { timeout: 5000 });
  check(p.errors.length === 0, p.errors.join('; '));
});

test('sugar ant nest: dig, build the mound, plug the entrance before rain', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'nest', { noNet: true });
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(1500); await p.keyboard.up('ArrowDown');
  check(await p.evaluate(() => Game.g.player.crumbs >= 2), 'no soil dug');
  // Carry it up: walk to the surface through the shaft
  await p.keyboard.down('ArrowUp'); await p.waitForTimeout(2500); await p.keyboard.up('ArrowUp');
  check(await p.evaluate(() => Game.g.mound >= 2 && Game.g.player.crumbs === 0), 'soil not added to the mound');
  // Rain coming: plug the entrance (soil comes from the mound)
  await p.evaluate(() => { Game.g.rainT = 9; });
  await p.waitForTimeout(300);
  check(await p.textContent('#actionBtn') === 'Plug', 'no Plug button on the entrance');
  await p.click('#actionBtn');
  await p.evaluate(() => { Game.g.rainT = 0; Game.timeScale = 4; });
  await p.waitForTimeout(2500);
  check(await p.evaluate(() => Game.g.water.flat().every(w => !w)), 'water got into a plugged nest');
  // Press down on the plug to open it again
  await p.evaluate(() => { Game.g.raining = 0; Game.g.rainT = 60; Game.timeScale = 1; });   // rainT too, or it starts raining again at once
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(800); await p.keyboard.up('ArrowDown');
  check(await p.evaluate(() => Game.g.mission.entrances(Game.g).length === 1), 'could not reopen the entrance');
  check(p.errors.length === 0, p.errors.join('; '));
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
  // best results (the Olympics) and the mic setting ride along with the stars
  await p.evaluate(() => { Progress.setBest('jump', 31, true); Progress.setBest('jump', 20, true); Progress.setBest('sprint', 40, false); Progress.setBest('sprint', 35, false); Settings.mic = true; Settings.save(); });
  await p.reload();
  const stars = await p.locator('.pin', { hasText: 'Peacock Spider' }).locator('.pinStars').textContent();
  check(/★/.test(stars), 'no stars after reload: ' + stars);
  const kept = await p.evaluate(() => [Progress.best('jump'), Progress.best('sprint'), Settings.mic]);
  check(kept[0] === 31 && kept[1] === 35 && kept[2] === true, 'best results or settings lost: ' + JSON.stringify(kept));
  await p.evaluate(() => { Settings.mic = false; Settings.save(); });
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
  await p.waitForFunction(() => Game.g.event && Game.g.event.phase === 'tank', null, { timeout: 8000 });
  const ys = await p.evaluate(() => Game.g.event.corners.map(c => c.y));
  check(ys.every(y => y < 150), 'gap not at the top: ' + ys);
});

// ------------------------------------------------------------------ controls and layout
test('controls: a second finger, lost focus, leaving after a catch', async (b) => {
  const ctx = await b.newContext({ viewport: { width: 1000, height: 720 }, hasTouch: true });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') p.errors.push(m.text()); });
  await p.goto(FILE_URL);
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  await startMission(p, 'ant', { noNet: true, noPred: true });
  const box = await p.locator('#game').boundingBox();
  const a = { x: box.x + box.width * 0.75, y: box.y + box.height * 0.65, id: 1 }, s = { x: box.x + box.width * 0.4, y: box.y + box.height * 0.5, id: 2 };
  await touch('touchStart', [a]); await p.waitForTimeout(300);
  await touch('touchStart', [a, s]); await touch('touchEnd', [s]);   // a second finger taps and lifts (touchEnd lists the points released); the first keeps steering
  await p.waitForTimeout(150);
  check(await p.evaluate(() => Input.target !== null && Game.g.player.moving), 'a second finger stopped the drag');
  await touch('touchEnd', []); await p.waitForTimeout(100);
  check(await p.evaluate(() => Input.target === null && Input.pointer === null), 'the drag did not end');
  // keys held when the window loses focus are let go
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(100);
  await p.evaluate(() => window.dispatchEvent(new Event('blur')));
  check(await p.evaluate(() => Input.keys.size === 0 && !Input.held), 'keys stuck after losing focus');
  await p.keyboard.up('ArrowRight');
  // leaving right after being caught out must not bring the end screen up over the map
  await p.click('#menuBtn');
  await startMission(p, 'queen', { noNet: true, noPred: true });
  await p.evaluate(() => { Game.g.lives = 1; Game.caught({ name: 'test' }); });
  await p.click('#menuBtn'); await p.waitForTimeout(1300);
  check(await p.isVisible('#map.active'), 'the end screen came up after leaving');
  // leaving during the win confetti keeps the stars
  await startMission(p, 'bee', { noNet: true, noPred: true });
  await p.evaluate(() => { Game.g.score = 99; }); await p.waitForTimeout(300);
  await p.click('#menuBtn');
  check(await p.evaluate(() => Progress.stars('bee') > 0), 'stars lost by leaving during the confetti');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('sugar ant: digging at an angle never makes a dead end', async (b) => {
  const p = await openGame(b);
  await startMission(p, 'nest', { noNet: true });
  const r = await p.evaluate(() => {
    const g = Game.g, m = g.mission, p = g.player, N = NEST.cell, ec = Math.floor(960 / N);
    p.x = ec * N + N / 2; p.y = NEST.surf + 4.5 * N; p.crumbs = 0;
    // Push at angles for a long while, dropping the soil whenever the jaws fill, as a kid steering by thumb does
    const dirs = [[0.8, 0.9], [-0.7, 0.9], [0.9, -0.6], [0.6, 0.95], [-0.9, 0.5]];
    for (let i = 0; i < 3000; i++) { const d = dirs[Math.floor(i / 600)]; m.move(g, 1 / 60, d[0], d[1]); if (p.crumbs >= 4) p.crumbs = 0; }
    // Every open cell must be reachable from the entrance moving only up, down, left or right
    const R = NEST.rows, C = NEST.cols, seen = new Set(), q = [];
    for (let c = 0; c < C; c++) if (g.grid[0][c] === 0) { q.push([0, c]); seen.add(c); }
    while (q.length) {
      const [r, c] = q.pop();
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C || g.grid[nr][nc] !== 0 || seen.has(nr * 1000 + nc)) continue;
        seen.add(nr * 1000 + nc); q.push([nr, nc]);
      }
    }
    let open = 0; for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) if (g.grid[i][j] === 0) open++;
    return { open, reached: seen.size };
  });
  check(r.open > 25, 'the ant hardly dug: ' + JSON.stringify(r));
  check(r.reached === r.open, 'tunnel cells cut off from the rest: ' + JSON.stringify(r));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('Bug Book: every fact can be found', async (b) => {
  const p = await openGame(b);
  const bad = await p.evaluate(() => {
    const out = [];
    for (const [id, m] of Object.entries(Missions)) {
      for (const [k, t] of Object.entries(m.factText)) if (!t) out.push(id + '.' + k + ' is empty');
      if ('tank' in m.factText) out.push(id + ' lists the tank fact (the net girl is one secret now, not a fact of each level)');
    }
    return out;
  });
  check(bad.length === 0, bad.join('; '));
  await p.click('#bookBtn');
  const counts = await p.evaluate(() => [...document.querySelectorAll('.bookBug:not(.secrets)')].map(s => ({ name: s.querySelector('h2').textContent, count: s.querySelector('.count').textContent, unknown: s.querySelectorAll('li.unknown').length })));
  const totals = await p.evaluate(() => Bugs.map(bg => ({ name: bg.name, total: bg.stages.reduce((n, id) => n + Object.keys(Missions[id].factText).length, 0) })));
  for (const c of counts) {
    const t = totals.find(x => x.name === c.name);
    check(t && c.count === 'Facts found: 0 / ' + t.total && c.unknown === t.total, c.name + ': ' + c.count + ', ' + c.unknown + ' unknown');
  }
  check(p.errors.length === 0, p.errors.join('; '));
});

test('phone layouts: messages clear the tools, the HUD stays one line, pins stay on the map', async (b) => {
  // a phone on its side with a building level open: the message must not cover the tool palette
  let p = await openGame(b, { width: 640, height: 360 });
  await startMission(p, 'garden', {});
  await p.evaluate(() => Game.showToast({ text: 'Bug fact: Blue-banded bees nest in burrows in clay banks and buzz pollen out of flowers. Dianella keeps its pollen locked inside tubes.', kind: 'fact' }));
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const q = (id) => document.getElementById(id).getBoundingClientRect();
    const over = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
    return { toastTools: over(q('toast'), q('tools')), toolH: Math.min(...[...document.querySelectorAll('#tools .tool')].map(e => e.getBoundingClientRect().height)) };
  });
  check(!r.toastTools, 'the message covers the tool palette');
  check(r.toolH >= 40, 'tool buttons only ' + r.toolH + ' px tall');
  // a phone held upright: no sideways scroll, every pin on the map, a one-line HUD that the message stays clear of
  p = await openGame(b, { width: 360, height: 740 });
  const m = await p.evaluate(() => {
    const map = document.getElementById('mapWrap').getBoundingClientRect();
    const out = [...document.querySelectorAll('.pin')].filter(el => { const r = el.getBoundingClientRect(); return r.left < map.left - 1 || r.right > map.right + 1 || r.top < map.top - 1 || r.bottom > map.bottom + 1; }).length;
    return { over: document.documentElement.scrollWidth - document.documentElement.clientWidth, out };
  });
  check(m.over <= 0, 'the map page scrolls sideways by ' + m.over + ' px');
  check(m.out === 0, m.out + ' pins poke outside the map');
  await startMission(p, 'ant', { noNet: true, noPred: true });
  await p.evaluate(() => {
    setHud('Food: 10 / 12', 'Carrying: a caterpillar'); document.getElementById('hudFind').textContent = '\u{1F50D} 3 / 3';
    let best = ''; for (const mm of Object.values(Missions)) for (const t of Object.values(mm.factText)) if (t && t.length > best.length) best = t;
    Game.showToast({ text: best, kind: 'fact' });
  });
  await p.waitForTimeout(400);
  const h = await p.evaluate(() => {
    const q = (id) => document.getElementById(id).getBoundingClientRect();
    const hud = q('hud'), toast = q('toast'), btn = q('actionBtn');
    return { hudH: hud.height, toastHud: toast.bottom > hud.top && toast.top < hud.bottom, toastBtn: toast.left < btn.right && btn.left < toast.right && toast.top < btn.bottom && btn.top < toast.bottom };
  });
  check(h.hudH <= 40, 'the HUD wraps to ' + h.hudH + ' px');
  check(!h.toastHud, 'the message runs into the HUD');
  check(!h.toastBtn, 'the message covers the action button');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('landscape layouts: the view fills wide screens, the map and bug pages fit without scrolling', async (b) => {
  const scroll = (p) => p.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  const stage = (p) => p.evaluate(() => { const st = document.getElementById('stage').getBoundingClientRect(), app = document.getElementById('play').getBoundingClientRect(); return { W, zoom: Game.zoom, stageW: Math.round(st.width), appW: Math.round(app.width), stageH: Math.round(st.height), innerH: window.innerHeight, canvasW: Game.canvas.width / Game.dpr, world: World.w }; });
  // a phone on its side: the map sits beside its header, the view is wider than 960 and fills the width, phones keep their zoom
  let p = await openGame(b, { width: 844, height: 390 });
  const m1 = await p.evaluate(() => { const map = document.getElementById('mapWrap').getBoundingClientRect(); return { scroll: document.documentElement.scrollHeight - window.innerHeight, pinsOut: [...document.querySelectorAll('.pin')].filter(el => { const r = el.getBoundingClientRect(); return r.left < map.left - 1 || r.right > map.right + 1 || r.top < map.top - 1 || r.bottom > map.bottom + 1; }).length, mapRight: map.right <= window.innerWidth, mapLeft: map.left > 150 }; });
  check(m1.scroll <= 0 && m1.mapRight && m1.mapLeft, 'the map page on a phone on its side: ' + JSON.stringify(m1));
  check(m1.pinsOut === 0, m1.pinsOut + ' pins poke outside the map');
  await p.locator('.pin').first().click();
  const bugScroll = await scroll(p);
  check(bugScroll <= 100, 'the bug page scrolls by ' + bugScroll + ' px on a phone on its side');
  await startMission(p, 'ant', { noNet: true, noPred: true });
  const s1 = await stage(p);
  check(s1.W >= 1200 && s1.W <= 1320 && s1.canvasW === s1.W && s1.zoom === 1.6, 'the view on a phone on its side: ' + JSON.stringify(s1));
  check(Math.abs(s1.stageW - s1.appW) <= 2 && s1.stageH <= s1.innerH, 'the stage does not fill the width: ' + JSON.stringify(s1));
  await p.click('#menuBtn');
  // the one-screen scenes widen with the view: the garden's grid covers the yard, the web's trees sit in the middle
  await startMission(p, 'garden', {});
  check(await p.evaluate(() => World.w === W && GARDEN.cols * GARDEN.cell >= World.w && Game.g.cells.every(r => r.length === GARDEN.cols)), 'the garden grid does not cover the wide yard');
  await p.click('#menuBtn');
  await startMission(p, 'web', {});
  check(await p.evaluate(() => { const ox = Math.round((World.w - 960) / 2); return World.w === W && ox > 100 && WEB_ANCHORS[0][0][0] === 150 + ox && Math.abs(Game.g.player.x - (515 + ox)) < 1 && Math.abs(Game.g.home.x - (520 + ox)) < 1; }), 'the web scene is not in the middle of the wide view');
  await p.click('#menuBtn');
  check(p.errors.length === 0, p.errors.join('; '));
  await p.context().close();
  // a laptop: no margins beside the stage, the map page fits without scrolling, the camera stays inside the world
  p = await openGame(b, { width: 1366, height: 768 });
  const m2 = await scroll(p);
  check(m2 <= 0, 'the map page scrolls by ' + m2 + ' px on a laptop');
  await startMission(p, 'bee', { noNet: true, noPred: true });
  const s2 = await stage(p);
  check(s2.W > 1000 && s2.W < 1100 && Math.abs(s2.stageW - s2.appW) <= 2 && s2.stageH <= s2.innerH && s2.zoom === 1.3, 'the laptop view: ' + JSON.stringify(s2));
  await p.evaluate(() => { Game.g.player.x = World.w - 10; Game.g.player.y = World.h - 10; Game.updateCamera(); });
  check(await p.evaluate(() => Game.g.cam.x + W / Game.zoom <= World.w + 0.01 && Game.g.cam.y + H / Game.zoom <= World.h + 0.01), 'the camera shows past the world edge');
  check(p.errors.length === 0, p.errors.join('; '));
  await p.context().close();
  // a phone held upright keeps the 960-wide view, and the map pins stay put after a level widened the view
  p = await openGame(b, { width: 360, height: 740 });
  const pinBefore = await p.evaluate(() => document.querySelector('.pin').style.getPropertyValue('--x'));
  await startMission(p, 'ant', { noNet: true, noPred: true });
  check(await p.evaluate(() => W === 960 && Game.zoom === 1.6), 'a phone held upright changed its view');
  await p.click('#menuBtn');
  check(await p.evaluate((x) => document.querySelector('.pin').style.getPropertyValue('--x') === x, pinBefore), 'the map pins moved');
  check(p.errors.length === 0, p.errors.join('; '));
  await p.context().close();
});

// ------------------------------------------------------------------ microphone
test('shout to buzz: the toggle asks for the mic, a loud room buzzes the bee, quiet does not', async () => {
  const srv = await serve(ROOT);
  const b2 = await launchMedia();
  try {
    const ctx = await b2.newContext({ permissions: ['microphone'] });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', (e) => p.errors.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') p.errors.push(m.text()); });
    await p.goto(srv.url);
    await p.locator('.toggle[data-setting="mic"]').click();
    await p.waitForFunction(() => Mic.active, null, { timeout: 10000 });
    check(await p.evaluate(() => Settings.mic && !document.getElementById('hudMic').hidden), 'the mic toggle did not switch on');
    await startMission(p, 'bee', { noNet: true, noPred: true });
    await p.waitForFunction(() => Mic.level > 0, null, { timeout: 5000 }).catch(() => {});   // Chromium's fake microphone hums
    const heard = await p.evaluate(() => Mic.level > 0);
    // on a flower with pollen, a shout buzzes with no button pressed
    await p.evaluate(() => { const f = Game.g.items.find(i => i.pollen); Game.g.player.x = f.x; Game.g.player.y = f.y; Mic.levelFn = () => 0.5; });
    await p.waitForTimeout(700);
    const r1 = await p.evaluate(() => ({ loud: Input.loud, buzzT: Game.g.player.buzzT, load: Game.g.player.load, fact: Game.g.seen.has('buzz') }));
    check(r1.loud && (r1.buzzT > 0.2 || r1.load >= 1) && r1.fact, 'shouting did not buzz: ' + JSON.stringify(r1));
    // quiet stops it
    await p.evaluate(() => { Mic.levelFn = () => 0; });
    await p.waitForTimeout(300);
    const r2 = await p.evaluate(() => ({ loud: Input.loud, buzzT: Game.g.player.buzzT }));
    await p.waitForTimeout(300);
    const r3 = await p.evaluate(() => Game.g.player.buzzT);
    check(!r2.loud && r3 <= r2.buzzT, 'quiet kept buzzing: ' + JSON.stringify([r2, r3]));
    // a level without voice ignores the mic
    await p.click('#menuBtn');
    await startMission(p, 'ant', { noNet: true, noPred: true });
    await p.evaluate(() => { Mic.levelFn = () => 0.5; });
    await p.waitForTimeout(300);
    check(await p.evaluate(() => Input.loud === false && Mic.loud), 'the ant level listened to the mic');
    check(heard, 'the fake microphone was silent');
    check(p.errors.length === 0, p.errors.join('; '));
  } finally { await b2.close(); srv.close(); }
});

// ------------------------------------------------------------------ paint a bug
test('paint a bug: every bug, strokes on the whole bug save, the drawings and models wear the design, the real one stays', async (b) => {
  const p = await openGame(b);
  await p.click('#paintBtn');
  check(await p.isVisible('#paint.active'), 'the paint screen did not open');
  check(await p.evaluate(() => Object.keys(PAINT_BUGS).length) === 18 && await p.locator('#paintParts button[data-part]').count() === 18 && await p.locator('#paintTools .swatch').count() === 10, 'bugs or colours missing');
  check(await p.evaluate(() => Object.keys(PAINT_BUGS).every(n => typeof Sprites[n] === 'function') && Object.keys(PAINT_ALIAS).every(n => typeof Sprites[n] === 'function' && !!PAINT_BUGS[PAINT_ALIAS[n].of])), 'a bug to paint has no drawing');
  check(await p.locator('#paintTools [data-tool="real"]').count() === 0, 'the tracing tool is still there');
  // the view shows the whole ladybird fitted to the box: the black head sits outside the wing cases
  const box = await p.locator('#paintCanvas').boundingBox();
  const viewPx = (x, y) => p.evaluate(([x, y]) => { const v = PaintUI.viewAt(x, y); return [...document.getElementById('paintCanvas').getContext('2d').getImageData(Math.round(v.x), Math.round(v.y), 1, 1).data]; }, [x, y]);
  const head = await viewPx(6.6, 0), wing = await viewPx(-6, 1);   // (the seam runs along y = 0, the spots sit at y = ±2.6)
  check(head[0] < 60 && head[1] < 60 && wing[0] > 180 && wing[1] < 90, 'the view does not show the whole bug: ' + JSON.stringify({ head, wing }));
  // a white spot stamped with a tap, then a black brush stroke, placed through the view in the ladybird's own
  // units; the layer stays clear where nothing was painted
  const at = async (x, y) => { const v = await p.evaluate(([x, y]) => PaintUI.viewAt(x, y), [x, y]); return [box.x + box.width * v.x / 512, box.y + box.height * v.y / 512]; };
  const designPx = (name, x, y) => p.evaluate(([name, x, y]) => { const f = Paint.frame(name); return [...Paint.image(name).getContext('2d').getImageData(Math.round(f.cx + f.S * x), Math.round(f.cy + f.S * y), 1, 1).data]; }, [name, x, y]);
  await p.locator('#paintTools [data-tool="c#f4f4f0"]').click();
  await p.locator('#paintTools [data-tool="spot"]').click();
  await p.mouse.click(...await at(3, 3));
  await p.locator('#paintTools [data-tool="c#111111"]').click();
  await p.locator('#paintTools [data-tool="s18"]').click();
  await p.mouse.move(...await at(-4, -4)); await p.mouse.down(); await p.mouse.move(...await at(-2, -4), { steps: 4 }); await p.mouse.up();
  const px = { spot: await designPx('ladybird', 3, 3), stroke: await designPx('ladybird', -2.6, -4), plain: await designPx('ladybird', -3, 3) };
  check(px.spot[0] > 230 && px.spot[1] > 230 && px.spot[3] === 255 && px.stroke[0] < 40 && px.stroke[3] === 255 && px.plain[3] === 0, 'the strokes did not land: ' + JSON.stringify(px));
  // the view wears the stroke, and the real ladybird's own spot shows through where nothing is painted
  const vStroke = await viewPx(-2.6, -4), vSpot = await viewPx(-4.2, 2.6);
  check(vStroke[0] < 60 && vSpot[0] < 60 && vSpot[3] === 255, 'the view does not show the paint over the real bug: ' + JSON.stringify({ vStroke, vSpot }));
  // the eraser takes paint off and shows the real bug again
  await p.locator('#paintTools [data-tool="eraser"]').click();
  await p.mouse.move(...await at(-4, -4)); await p.mouse.down(); await p.mouse.move(...await at(-3.6, -4), { steps: 3 }); await p.mouse.up();
  const erased = await designPx('ladybird', -3.8, -4), kept = await designPx('ladybird', -2.6, -4);
  check(erased[3] === 0 && kept[3] === 255 && (await viewPx(-3.8, -4))[0] > 150, 'the eraser did not clear the paint: ' + JSON.stringify({ erased, kept }));
  await p.locator('#paintTools [data-tool="c#111111"]').click();
  check(await p.evaluate(() => PaintUI.tool === 'brush'), 'a colour did not leave the eraser');
  // zoom: the buttons, the wheel and Fit; a stroke still lands where the bug is under the finger when zoomed in
  await p.locator('#paintBox [data-zoom="in"]').click();
  check(await p.evaluate(() => PaintUI.view.z === 1.5), 'the + button did not zoom');
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await p.mouse.wheel(0, -120);
  check(await p.evaluate(() => PaintUI.view.z > 1.5), 'the wheel did not zoom');
  await p.mouse.move(...await at(3, -3)); await p.mouse.down(); await p.mouse.move(...await at(4, -3), { steps: 3 }); await p.mouse.up();
  check((await designPx('ladybird', 3.5, -3))[0] < 40, 'a stroke while zoomed in missed');
  await p.locator('#paintBox [data-zoom="fit"]').click();
  check(await p.evaluate(() => PaintUI.view.z === 1 && PaintUI.view.px === 0), 'Fit did not reset the view');
  // the Move tool drags the picture, and picking a colour goes back to painting
  await p.locator('#paintTools [data-tool="move"]').click();
  await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5, { steps: 3 }); await p.mouse.up();
  check(await p.evaluate(() => PaintUI.view.px > 20 && PaintUI.tool === 'move'), 'Move did not drag the picture');
  await p.locator('#paintTools [data-tool="c#111111"]').click();
  check(await p.evaluate(() => PaintUI.tool === 'brush'), 'a colour did not leave the Move tool');
  await p.locator('#paintBox [data-zoom="fit"]').click();
  // the butterfly is painted on both sides (a stroke on the left wing lands on the stored right side), and
  // switching bugs keeps the unsaved ladybird
  await p.evaluate(() => PaintUI.pick('butterfly'));
  await p.mouse.move(...await at(9, -15)); await p.mouse.down(); await p.mouse.move(...await at(11, -15), { steps: 3 }); await p.mouse.up();
  check((await designPx('butterfly', 10, 15))[0] < 40, 'a stroke on the left wing was not mirrored');
  await p.evaluate(() => PaintUI.pick('ladybird'));
  check((await designPx('ladybird', -2.6, -4))[0] < 40, 'switching bugs lost the unsaved strokes');
  // a spot off the bug: the paint only shows on the bug
  const off = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = c.height = 400; const ctx = c.getContext('2d'); ctx.setTransform(8, 0, 0, 8, 200, 200); Sprites.ladybird(ctx, { moving: false }, 0.4);
    const bare = [[8, 7], [9, 8], [-10, 8], [0, -8.5], [10, -7]].find(([x, y]) => ctx.getImageData(Math.round(200 + 8 * x), Math.round(200 + 8 * y), 1, 1).data[3] === 0);
    if (!bare) return null;
    const f = Paint.frame('ladybird'); PaintUI.colour = '#f4f4f0'; PaintUI.stamp({ x: f.cx + f.S * bare[0], y: f.cy + f.S * bare[1] }, 'spot');
    return bare;
  });
  check(off && (await viewPx(off[0], off[1]))[3] === 0 && (await designPx('ladybird', off[0], off[1]))[3] === 255, 'paint off the bug showed in the view');
  await p.click('#paintSave');
  const saved = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('bugame.paint')), f = Paint.frame('ladybird'); return { img: !!(d.img && d.img.ladybird), use: d.use.ladybird, stamp: Paint.stamp('ladybird'), secret: Progress.hasSecret('s_paint'), note: document.getElementById('paintNote').textContent, frame: d.frame.ladybird && d.frame.ladybird.S === f.S && d.frame.ladybird.cx === f.cx }; });
  check(saved.img && saved.use && saved.stamp === 1 && saved.secret && saved.frame && /Saved!/.test(saved.note), 'save: ' + JSON.stringify(saved));
  // the drawing wears the paint where painted, the real markings show through elsewhere, nothing lands off the
  // bug, and the real one is untouched
  const d2 = await p.evaluate((off) => {
    const draw = (o) => { const c = document.createElement('canvas'); c.width = c.height = 240; const ctx = c.getContext('2d'); ctx.translate(120, 120); ctx.scale(8, 8); Paint.drawSprite(ctx, 'ladybird', o, 0.4); return ctx; };
    const q = (ctx, x, y) => [...ctx.getImageData(Math.round(120 + 8 * x), Math.round(120 + 8 * y), 1, 1).data];
    const real = draw({ moving: false }), mine = draw({ moving: false, paint: Paint.stamp('ladybird') });
    return { realSpot: q(real, -4.2, 2.6), mineSpot: q(mine, -4.2, 2.6), mineStroke: q(mine, -2.6, -4), realStroke: q(real, -2.6, -4), mineWhite: q(mine, 3, 3), realWhite: q(real, 3, 3), mineOff: q(mine, off[0], off[1]) };
  }, off);
  check(d2.realSpot[0] < 60 && d2.mineSpot[0] < 60 && d2.mineStroke[0] < 60 && d2.realStroke[0] > 150 && d2.mineWhite[1] > 180 && d2.realWhite[1] < 90 && d2.mineOff[3] === 0, 'the drawing: ' + JSON.stringify(d2));
  // the parade gains a marcher per design; the Book labels a painted butterfly as yours; one garden ladybird and
  // one garden butterfly wear theirs, as does the ladybird on your hand; the sugar ant's nest wears the sugar ant's
  await p.evaluate(() => {
    PaintUI.pick('butterfly'); PaintUI.colour = '#3a5ab0'; const f = Paint.frame('butterfly'); PaintUI.stamp({ x: f.cx + f.S * 10, y: f.cy + f.S * 15 }, 'star'); PaintUI.save();
    PaintUI.pick('sugarAnt'); PaintUI.colour = '#f4f4f0'; const g = Paint.frame('sugarAnt'); PaintUI.stamp({ x: g.cx, y: g.cy }, 'spot'); PaintUI.save();
  });
  check(await p.evaluate(() => paradeMarchers().length === Bugs.filter(b => !b.hub).length + 3 && paradeMarchers().slice(-3).every(m => m.paint)), 'the parade did not gain the painted bugs');
  await p.click('#paintBack');
  await p.click('#bookBtn');
  check(await p.locator('.bookBug', { hasText: 'Painted Lady' }).locator('.mine').count() === 1 && await p.locator('.bookBug', { hasText: 'Bull Ant' }).locator('.mine').count() === 0, 'the Book does not show the design as yours');
  check(/My design/.test(await p.locator('.bookBug', { hasText: 'Painted Lady' }).locator('.mine').textContent()), 'no label on the design');
  await p.click('#bookBack');
  await startMission(p, 'butterfly', { noNet: true, noPred: true });
  check(await p.evaluate(() => Game.g.player.paint === 1), 'the butterfly you play does not wear the design');
  await p.click('#menuBtn');
  await startMission(p, 'nest', {});
  check(await p.evaluate(() => Game.g.player.paint === 1), 'the sugar ant in the nest does not wear the design');
  await p.click('#menuBtn');
  await startMission(p, 'garden', {});
  await p.evaluate(() => { const g = Game.g, m = g.mission; m.addThing(g, 'everlasting', 400, 300, 1); for (const id of ['v_ladybird', 'v_butterfly']) for (let i = 0; i < 2; i++) m.arrive(g, VISITORS.find(v => v.id === id)); });
  check(await p.evaluate(() => Game.g.visitors.filter(v => v.paint && v.sprite === 'ladybird').length === 1 && Game.g.visitors.filter(v => v.paint && v.sprite === 'butterfly').length === 1), 'not exactly one garden ladybird and one butterfly wear the designs');
  await p.click('#menuBtn');
  await p.evaluate(() => { Media.get = async () => ({ error: 'none' }); });
  await startMission(p, 'hand', {});
  check(await p.evaluate(() => Game.g.bug.paint === 1), 'the ladybird on your hand does not wear the design');
  await p.click('#menuBtn');
  // the switch takes the design out of the game without losing it
  await p.click('#paintBtn');
  await p.evaluate(() => PaintUI.pick('ladybird'));
  await p.locator('#paintUse').click();
  check(await p.evaluate(() => Paint.stamp('ladybird') === undefined && !!JSON.parse(localStorage.getItem('bugame.paint')).img.ladybird), 'the switch did not take the design out');
  // frames come back after a reload, and a design saved before 3.9 (no frame) keeps its old place
  await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('bugame.paint')); delete d.frame.butterfly; localStorage.setItem('bugame.paint', JSON.stringify(d)); });
  await p.reload(); await p.waitForTimeout(300);
  const fr = await p.evaluate(() => ({ lady: Paint.frame('ladybird'), fly: Paint.frame('butterfly'), fit: Paint.fitFrame('ladybird') }));
  check(fr.lady.S === fr.fit.S && fr.lady.cx === fr.fit.cx && fr.fly.S === 14 && fr.fly.cy === 60, 'frames: ' + JSON.stringify(fr));
  check(p.errors.length === 0, p.errors.join('; '));
  // the 3D models: the design lands on the ant's render but not on its shadow, the real render is unchanged, the
  // butterfly's wing maps carry the real pattern under the design
  const p3 = await openGame(b, null, FILE_URL + '?3d=force');
  await p3.waitForFunction(() => typeof Render3D !== 'undefined' && (Render3D.ok || Render3D.failed), null, { timeout: 60000 });
  check(await p3.evaluate(() => Render3D.ok), 'Render3D did not start');
  await p3.click('#paintBtn');
  const r3 = await p3.evaluate(() => {
    const img = (n, o, t) => SpriteCache.image(n, o, { t: t || 0.4, px: 4, angle: 0 });
    const before = img('ant', { moving: false }).c.toDataURL();
    PaintUI.pick('ant'); PaintUI.colour = '#f4f4f0'; PaintUI.size = 34; PaintUI.tool = 'brush';
    const f = Paint.frame('ant'); PaintUI.down({ x: f.cx + f.S * -14, y: f.cy }); PaintUI.move({ x: f.cx + f.S * 12, y: f.cy }); PaintUI.last = null; PaintUI.save();
    const st = Paint.stamp('ant'), real = img('ant', { moving: false }), mine = img('ant', { moving: false, paint: st });
    const a = real.c.getContext('2d').getImageData(0, 0, real.c.width, real.c.height).data, m = mine.c.getContext('2d').getImageData(0, 0, mine.c.width, mine.c.height).data;
    let diff = 0, shadowTouched = 0;
    for (let i = 0; i < Math.min(a.length, m.length); i += 4) {
      const d = Math.abs(a[i] - m[i]) + Math.abs(a[i + 1] - m[i + 1]) + Math.abs(a[i + 2] - m[i + 2]) + Math.abs(a[i + 3] - m[i + 3]);
      if (d > 60) diff++;
      if (a[i + 3] <= 200 && d > 0) shadowTouched++;
    }
    PaintUI.pick('butterfly'); PaintUI.colour = '#3a5ab0'; const g = Paint.frame('butterfly'); PaintUI.stamp({ x: g.cx + g.S * 10, y: g.cy + g.S * 15 }, 'star'); PaintUI.save();
    const st2 = Paint.stamp('butterfly');
    img('butterfly', { moving: false, landed: false, paint: st2 }, Math.PI / 36);
    const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d');
    Paint.build('butterfly', 'plFore', ctx, 256, 256);
    const c2 = document.createElement('canvas'); c2.width = c2.height = 256; const ctx2 = c2.getContext('2d');
    PAINT_MAPS.plFore.base(ctx2, 256, 256);
    const bb = PAINT_MAPS.plFore.bounds(), uv = (x, y) => [Math.round((x - bb[0]) / (bb[2] - bb[0]) * 256), Math.round((y - bb[1]) / (bb[3] - bb[1]) * 256)];
    const [sx, sy] = uv(10, 15), [rx, ry] = uv(6, 5);
    const star = [...ctx.getImageData(sx, sy, 1, 1).data].slice(0, 3), under = [...ctx.getImageData(rx, ry, 1, 1).data].slice(0, 3), realUnder = [...ctx2.getImageData(rx, ry, 1, 1).data].slice(0, 3);
    const keys = [...Models.built.keys()];
    return { stamp: st, same: real.c.toDataURL() === before, diff, shadowTouched, star, under, realUnder, flyKeys: keys.filter(k => /U1/.test(k)).length, antKeys: keys.filter(k => /^ant\|.*U/.test(k)).length };
  });
  check(r3.stamp === 1 && r3.same && r3.diff > 20 && r3.shadowTouched === 0 && r3.star[2] > r3.star[0] + 40 && r3.under.join() === r3.realUnder.join() && r3.flyKeys === 1 && r3.antKeys === 0, '3D: ' + JSON.stringify(r3));
  check(p3.errors.length === 0, p3.errors.join('; '));
});

test('paint a bug: a pinch zooms and drags the picture without painting, one finger still paints', async (b) => {
  const ctx = await b.newContext({ viewport: { width: 1000, height: 720 }, hasTouch: true });
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') p.errors.push(m.text()); });
  // Paint asks for the full screen; in a headless browser that rescales the raw touch points sent below, so it is
  // switched off here (the full screen has its own test)
  await p.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.resolve(); });
  await p.goto(FILE_URL);
  await p.click('#paintBtn'); await p.waitForTimeout(200);
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const box = await p.locator('#paintCanvas').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2, perPx = 512 / box.width;   // the picture's own pixels per screen pixel
  const a = (dx, dy) => ({ x: cx + dx, y: cy + dy, id: 1 }), s = (dx, dy) => ({ x: cx + dx, y: cy + dy, id: 2 });
  await touch('touchStart', [a(-40, 0)]);
  await touch('touchStart', [a(-40, 0), s(40, 0)]);
  for (let k = 1; k <= 6; k++) await touch('touchMove', [a(-40 - k * 15, 0), s(40 + k * 15, 0)]);   // fingers spread: zoom in about the middle
  await p.waitForTimeout(120);   // touch moves are handed to the page on its next frame
  const z1 = await p.evaluate(() => ({ z: PaintUI.view.z, px: Math.round(PaintUI.view.px), dirty: PaintUI.dirty }));
  check(z1.z > 2 && z1.z <= 4 && z1.px === 0 && !z1.dirty, 'the pinch did not zoom cleanly: ' + JSON.stringify(z1));
  for (let k = 1; k <= 5; k++) await touch('touchMove', [a(-130 + k * 20, k * 10), s(130 + k * 20, k * 10)]);   // both fingers move: drag
  await p.waitForTimeout(120);
  const z2 = await p.evaluate(() => ({ z: PaintUI.view.z, px: Math.round(PaintUI.view.px), py: Math.round(PaintUI.view.py) }));
  check(Math.abs(z2.z - z1.z) < 0.01 && Math.abs(z2.px - 100 * perPx) <= 1 && Math.abs(z2.py - 50 * perPx) <= 1, 'the two-finger drag did not move the picture: ' + JSON.stringify(z2) + ' at ' + perPx);
  await touch('touchEnd', [s(230, 50)]); await touch('touchEnd', []);
  await p.waitForTimeout(120);
  check(await p.evaluate(() => PaintUI.pointers.size === 0 && !PaintUI.pinch && !PaintUI.dirty), 'the pinch left a stroke or a finger behind');
  await touch('touchStart', [a(0, 0)]); await touch('touchMove', [a(30, 0)]); await touch('touchEnd', []);
  await p.waitForTimeout(120);
  check(await p.evaluate(() => PaintUI.dirty), 'one finger did not paint after the pinch');
  check(p.errors.length === 0, p.errors.join('; '));
  await ctx.close();
});

// ------------------------------------------------------------------ camera
test('bug on your hand: the camera is the level, taps call the bug, a photo is made, leaving stops the camera', async () => {
  const srv = await serve(ROOT);
  const b2 = await launchMedia();
  try {
    const ctx = await b2.newContext({ permissions: ['camera'] });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', (e) => p.errors.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') p.errors.push(m.text()); });
    await p.goto(srv.url);
    await startMission(p, 'hand', {});
    await p.waitForFunction(() => Game.g.live.ready && Game.g.mission.liveBg(Game.g), null, { timeout: 10000 });
    await p.waitForTimeout(300);
    const live = await p.evaluate(() => ({ w: Game.g.live.video.videoWidth, fact: Game.g.seen.has('camera'), locked: document.querySelectorAll('#tools .tool.locked').length, open: document.querySelectorAll('#tools .tool:not(.locked)').length }));
    check(live.w > 0 && live.fact, 'no live frame: ' + JSON.stringify(live));
    check(live.locked === 7 && live.open === 4, 'palette: ' + JSON.stringify(live));   // ladybird and snail always, photo and flip; the rest need a star
    // the frame on the canvas is the camera, not the painted hand (Chromium's fake camera is a bright green pattern)
    const px = await p.evaluate(() => { const c = document.getElementById('game'), d = c.getContext('2d').getImageData(Math.round(c.width * 0.6), Math.round(c.height * 0.3), 1, 1).data; return [d[0], d[1], d[2]]; });
    check(px[1] > 100 && px[0] < 80, 'the canvas does not show the camera frame: ' + px);
    // a tap calls the bug over, a tap on it says hello and gives its fact
    const before = await p.evaluate(() => [Game.g.bug.x, Game.g.bug.y]);
    await p.evaluate(() => Game.g.mission.onPointer(Game.g, 'down', 760, 160));
    await p.waitForTimeout(1200);
    const after = await p.evaluate(() => [Game.g.bug.x, Game.g.bug.y]);
    check(Math.hypot(after[0] - before[0], after[1] - before[1]) > 30, 'the bug did not come: ' + before + ' -> ' + after);
    await p.evaluate(() => Game.g.mission.onPointer(Game.g, 'down', Game.g.bug.x, Game.g.bug.y));
    check(await p.evaluate(() => Game.g.hello === 1 && Game.g.seen.has('ladybird')), 'tapping the bug gave no hello');
    // the palette swaps the bug; a locked one only explains
    await p.locator('#tools .tool[data-tool="snail"]').click();
    await p.waitForTimeout(100);
    check(await p.evaluate(() => Game.g.bug.kind === 'snail' && Game.g.items[0].sprite === 'snail'), 'the snail did not come out');
    await p.locator('#tools .tool[data-tool="bee"]').click();
    await p.waitForTimeout(100);
    check(await p.evaluate(() => Game.g.bug.kind === 'snail' && Game.g.toasts.concat([{ text: document.getElementById('toast').textContent }]).some(t => /Finish the Blue-banded Bee level first/.test(t.text))), 'a locked bug came out, or no hint');
    // a photo: a PNG of the frame and the bug, and the secret
    const url = await p.evaluate(() => Game.g.mission.snap(Game.g, true));
    check(url.startsWith('data:image/png') && url.length > 5000 && await p.evaluate(() => Game.g.photos === 1 && Progress.hasSecret('s_photo')), 'no photo');
    // flip asks for the other camera
    await p.locator('#tools .tool[data-tool="flip"]').click();
    await p.waitForFunction(() => Game.g.live.ready && !Game.g.live.opening, null, { timeout: 10000 });
    check(await p.evaluate(() => Game.g.live.facing === 'user' && Game.g.live.mirror), 'flip did not switch to the front camera');
    // leaving stops the stream
    await p.click('#menuBtn');
    await p.waitForTimeout(200);
    check(await p.evaluate(() => Game.g.live.stream === null && !Game.g.live.ready), 'the camera kept running after leaving');
    check(p.errors.length === 0, p.errors.join('; '));
  } finally { await b2.close(); srv.close(); }
});

test('bug on your hand without a camera: the painted hand, the note, and the bug still walks', async (b) => {
  const p = await openGame(b);
  await p.evaluate(() => { Media.get = async () => ({ error: 'none' }); });
  await startMission(p, 'hand', {});
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => ({ err: Game.g.live.error, note: !document.getElementById('mediaNote').hidden, fact: Game.g.seen.has('camera'), hud: document.getElementById('hudExtra').textContent, running: Game.running }));
  check(r.err === 'none' && r.note && r.fact && /painted hand/.test(r.hud) && r.running, 'fallback: ' + JSON.stringify(r));
  await p.evaluate(() => Game.g.mission.onPointer(Game.g, 'down', 300, 150));
  await p.waitForTimeout(1000);
  check(await p.evaluate(() => Math.hypot(Game.g.bug.x - 300, Game.g.bug.y - 150) < 400 && Game.g.bug.moving), 'the bug did not walk on the painted hand');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('mic refused: the toggle switches itself back off and play goes on', async (b) => {
  const p = await openGame(b);
  await p.evaluate(() => { Media.get = async () => ({ error: 'denied' }); });
  await p.locator('.toggle[data-setting="mic"]').click();
  await p.waitForTimeout(300);
  check(await p.evaluate(() => Settings.mic === false && !Mic.active && !document.getElementById('mediaNote').hidden && document.querySelector('.toggle[data-setting="mic"]').getAttribute('aria-pressed') === 'false'), 'a refused mic was not handled');
  await startMission(p, 'bee', { noNet: true, noPred: true });
  await p.waitForTimeout(300);
  check(await p.evaluate(() => Game.running && Input.loud === false), 'play did not go on');
  check(p.errors.length === 0, p.errors.join('; '));
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

// ------------------------------------------------------------------ London (js/platform.js, js/london.js)
// Steps the game by hand with the loop paused, so a side-on part runs the same every time
const LDN_STEP = `window.lstep = (sec, o) => { o = o || {}; Game.running = false; Input.keys = new Set(o.keys || []); Input.target = null; Input.held = !!o.held;
  for (let i = 0; i < Math.round(sec * 60); i++) { Input.pressed = !!o.press && i === 0; Game.update(1 / 60); } Input.pressed = false; Input.held = false; Input.keys = new Set(); };`;

test('platform physics: the same at any frame rate; sink and land, drop through, walls, ceiling; the stag beetle climbs and flies', async (b) => {
  const p = await openGame(b);
  const r = await p.evaluate(() => {
    const L = { w: 1000, floor: 500, solids: [[0, 0, 1000, 40, 'ceiling'], [400, 300, 50, 200, 'wall'], [600, 420, 100, 80, 'bark']], ledges: [[100, 350, 150]] };
    const F = { hw: 9, hh: 12, fly: 200, accel: 5, sink: 45 }, S = LDN_PHYS.stag;
    const bug = (x, y) => ({ x, y, vx: 0, vy: 0, acc: 0, flyT: 0, warmT: 0 });
    const run = (P, p, sec, dt, dx, dy, o) => { for (let i = 0; i < Math.round(sec / dt); i++) Plat.move(L, P, p, dt, dx, dy, o); return p; };
    const out = {};
    const a = run(F, bug(50, 300), 1.5, 1 / 60, 0.9, -0.3), c = run(F, bug(50, 300), 1.5, 1 / 20, 0.9, -0.3);
    out.rate = Math.hypot(a.x - c.x, a.y - c.y);
    const s = run(F, bug(170, 200), 6, 1 / 60, 0, 0); out.land = [s.y, s.onGround];
    run(F, s, 3, 1 / 60, 0, 1); out.drop = [s.y, s.onGround];
    const w = run(F, bug(300, 450), 3, 1 / 60, 1, 0); out.wall = w.x;
    const u = run(F, bug(200, 200), 3, 1 / 60, 0, -1); out.ceil = u.y;
    const k = run(F, bug(200, 300), 2, 1 / 60, 0, -1, { weak: true }); out.weak = k.y;
    const h = run(F, bug(200, 300), 2, 1 / 60, 0, 0, { hover: true }); out.hover = h.y;
    // the stag beetle: walks into the bark and climbs it, then stands on top
    const st = run(S, bug(520, 500), 2.4, 1 / 60, 1, 0); out.climb = [st.x, st.y, st.onGround];
    // Fly: a warm-up on the ground first, then a short flight, then he lands
    const f = run(S, bug(150, 500), 0.5, 1 / 60, 0, 0); Plat.takeOff(S, f);
    run(S, f, 0.25, 1 / 60, 1, -1); out.warm = [f.warmT > 0, f.flyT, f.x];
    run(S, f, 0.6, 1 / 60, 1, -1); out.flying = [f.flyT > 0, f.y];
    out.again = Plat.takeOff(S, f);
    run(S, f, 6, 1 / 60, 1, 0); out.landed = [f.flyT, f.onGround];
    return out;
  });
  check(r.rate < 2, 'different paths at 60 and 20 frames a second: ' + r.rate);
  check(r.land[0] === 350 && r.land[1], 'did not sink onto the ledge: ' + r.land);
  check(r.drop[0] === 500 && r.drop[1], 'did not drop through the ledge to the floor: ' + r.drop);
  check(r.wall === 391, 'went into the wall: ' + r.wall);
  check(r.ceil === 52, 'went into the ceiling: ' + r.ceil);
  check(r.weak > 300, 'an empty bee still flew up: ' + r.weak);
  check(r.hover === 300, 'did not hover: ' + r.hover);
  check(r.climb[0] > 600 && r.climb[1] === 420 && r.climb[2], 'the stag beetle did not climb the bark: ' + r.climb);
  check(r.warm[0] && r.warm[1] === 0 && r.warm[2] === 150, 'no warm-up before the flight: ' + r.warm);
  check(r.flying[0] && r.flying[1] < 500, 'the stag beetle did not fly: ' + r.flying);
  check(!r.again, 'took off again in mid-air');
  check(r.landed[0] === 0 && r.landed[1], 'the flight did not end on the ground: ' + r.landed);
});

test('London: every part’s route is clear of the walls, and no task sits inside one', async (b) => {
  const p = await openGame(b);
  const bad = await p.evaluate(() => {
    const out = [];
    for (const id of Bugs.filter(x => x.hub === 'london').flatMap(x => x.stages).filter(id => Missions[id].level)) {   // the side-on levels (not the flight up the Thames, nor the wrestle)
      const m = Missions[id], L = m.level(), P = m.P;
      for (const s of L.spots) if (L.solids.some(q => Plat.overlaps(s.x, s.y + P.hh / 2, P.hw - 1, P.hh - 1, q))) out.push(id + ' ' + s.id + ' is inside a wall');
      for (const s of L.spots) if (s.need && !L.route.some(r => r[2] === s.id)) out.push(id + ' ' + s.id + ' is not on the route');
      if (P.walk) {   // a walker's route points are on the ground or on top of a log
        for (const r of L.route) if (r[1] !== L.floor && !L.solids.some(q => q[1] === r[1] && r[0] > q[0] && r[0] < q[0] + q[2])) out.push(id + ' route point ' + r + ' is in mid-air');
      } else {
        const pts = [L.start].concat(L.route.map(r => [r[0], r[1] + P.hh / 2]));
        for (let i = 1; i < pts.length; i++) if (!Plat.clear(L, P, pts[i - 1], pts[i])) out.push(id + ' route ' + pts[i - 1] + ' to ' + pts[i] + ' hits a wall');
      }
    }
    return out;
  });
  check(bad.length === 0, bad.join('; '));
});

// Everything shown or said in a level: toasts, pops and speech bubbles
const LDN_SHOWN = `window.shown = []; { const sh = Game.showToast.bind(Game), pop = Game.pop.bind(Game), say = Game.say.bind(Game);
  Game.showToast = (t) => { if (t) shown.push(t.text); sh(t); }; Game.pop = (x, y, text, c) => { shown.push(text); return pop(x, y, text, c); }; Game.say = (x, y, text, l) => { shown.push(text); return say(x, y, text, l); }; }
  window.ldnKit = () => { const g = Game.g, L = g.level; g.timers = []; return { g, pl: g.player, m: g.mission, L, at: (id) => L.spots.find(s => s.id === id), who: (id) => g.people.find(q => q.id === id),
    put: (x, y) => Object.assign(g.player, { x, y, vx: 0, vy: 0, invuln: 0, onGround: true }), calm: () => { for (const q of g.people) { q.state = 'calm'; q.timer = 99; q.shoo = 0; } }, btn: () => document.getElementById('actionBtn').textContent }; };`;

test('London bumblebee: fuel, robbing a deep flower, a rival’s footprints, rain, the dog, a crab spider, the extras', async (b) => {
  const p = await openGame(b);
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_bee', { noNet: true });
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const { g, pl, m, L, at, put } = ldnKit(), out = {}, splats = () => shown.filter(t => t === 'Splat!').length;
    const rival = g.movers.find(q => q.kind === 'rival'); rival.t = 99;
    // let go and she hovers; she stops soon after you let go; with no fuel she can't climb
    put(700, 300); g.fuel = 1; lstep(2); out.hover = Math.abs(pl.y - 300);
    lstep(1, { keys: ['arrowright'] }); const x1 = pl.x; lstep(1); out.stop = [Math.round(x1 - 700), Math.round(pl.x - x1), Math.abs(pl.y - 300) < 2];
    put(700, 300); g.fuel = 0; lstep(3, { keys: ['arrowup'] }); out.empty = [g.fuel, pl.y];
    // an open flower: nectar and pollen; a deep one: robbed, and the tank is full
    const f1 = at('f1'); put(f1.x, f1.y + 7); g.fuel = 0.2; lstep(1.1, { held: true }); out.sip = [g.counts.flower, +g.fuel.toFixed(2), pl.pollen];
    const f3 = at('f3'); put(f3.x, f3.y + 7); lstep(0.05); out.robBtn = document.getElementById('actionBtn').textContent; lstep(1.3, { held: true }); out.rob = [g.counts.rob, g.fuel, g.seen.has('rob')];
    // the rival empties a flower ahead of you: footprints, and it is no use to you any more
    rival.t = 0; put(100, 300); lstep(6);
    const used = L.spots.filter(s => s.used); out.rival = [used.length, used.every(s => s.off && s.gone), g.seen.has('scent')];
    if (used[0]) { put(used[0].x, used[0].y + 7); lstep(0.2); out.usedSpot = g.spot === used[0]; }
    rival.t = 99; rival.to = null;
    // a safe spot, then a crab spider sends her back to it
    put(1010, 470); lstep(0.1); out.cp = [g.cp, g.home.x];
    const c = at('f4'); put(c.x, c.y + 7); lstep(0.6, { held: true }); out.crab = [g.lives, pl.x, g.seen.has('crab'), c.done];
    // rain: splats in the open, none under leaves
    put(1800, 300); lstep(0.1); out.cloud = g.hz.cloud > 0;
    lstep(2.6); out.raining = !!g.hz.rain;
    g.fuel = 1; const n0 = splats(); put(1700, 300); lstep(2.5); const n1 = splats();
    const h = L.hides[0]; put(h[0] + h[2] / 2, h[1] + h[3] / 2 + 7); lstep(2.5); out.rain = [n1 - n0, splats() - n1, g.fuel < 1];
    g.hz.rain.over = true;
    // the dog snaps at a bee by its nose, not at one flying high; and the last heart is never lost
    const d = g.hz.dog; put(d.x, 300); lstep(2); out.dogHigh = [d.state, g.lives];
    put(d.x - 40, d.y - 60); lstep(0.3); out.dogAlert = d.state; lstep(1.2); out.dogSnap = [g.lives, pl.x];
    d.state = 'sit'; put(d.x - 40, d.y - 60); lstep(1.6); out.last = g.lives;
    // the cheeky extras: each one is a star
    const s0 = m.stars(g), hat = at('hat'); put(hat.x, hat.y + 7); lstep(0.8, { held: true });
    const gi = at('giraffe'); put(gi.x, gi.y + 7); lstep(0.1, { press: true });
    out.extras = [s0, g.extras, m.stars(g), shown.includes('Eek! A bee!'), g.seen.has('zoo')];
    // home needs four flowers and a robbed one
    const nest = at('nest'); put(nest.x, nest.y + 7); lstep(0.2); out.early = !!g.homeSafe;
    g.counts.flower = 4; lstep(0.2); out.home = !!g.homeSafe;
    return out;
  });
  check(r.hover < 2 && r.stop[0] > 140 && r.stop[1] < 30 && r.stop[2], 'hovering and stopping: ' + JSON.stringify(r));
  check(r.empty[0] === 0 && r.empty[1] > 300, 'an empty bee still flew: ' + r.empty);
  check(r.sip[0] === 1 && r.sip[1] >= 0.5 && r.sip[2] === 1, 'sipping: ' + r.sip);
  check(r.robBtn === 'Rob' && r.rob[0] === 1 && r.rob[1] > 0.95 && r.rob[2], 'robbing a deep flower: ' + r.robBtn + ' ' + r.rob);
  check(r.rival[0] >= 1 && r.rival[1] && r.rival[2] && r.usedSpot === false, 'the rival’s footprints: ' + JSON.stringify([r.rival, r.usedSpot]));
  check(r.cp[0] === 1 && r.cp[1] === 1000 && r.crab[0] === 2 && r.crab[1] === 1000 && r.crab[2] && !r.crab[3], 'the safe spot and the crab spider: ' + JSON.stringify([r.cp, r.crab]));
  check(r.cloud && r.raining && r.rain[0] >= 1 && r.rain[1] === 0 && r.rain[2], 'the rain: ' + JSON.stringify([r.cloud, r.raining, r.rain]));
  check(r.dogHigh[0] === 'sit' && r.dogHigh[1] === 2 && r.dogAlert === 'alert' && r.dogSnap[0] === 1 && r.dogSnap[1] === 2100 && r.last === 1, 'the dog: ' + JSON.stringify([r.dogHigh, r.dogAlert, r.dogSnap, r.last]));
  check(r.extras[0] === 1 && r.extras[1] === 2 && r.extras[2] === 3 && r.extras[3] && r.extras[4], 'the extras: ' + r.extras);
  check(!r.early && r.home, 'the nest: ' + r.early + ' ' + r.home);
  check(p.errors.length === 0, p.errors.join('; '));
});

test('London Tube: a first raft with no blood, whole commuters with red zones, a rat to bite, the train’s wind, a web, the big raft', async (b) => {
  const p = await openGame(b);
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_mosquito', { noNet: true });
  await p.evaluate(LDN_STEP);
  const t = await p.evaluate(() => {
    const { g, pl, m, L, at, who, put, calm } = ldnKit(), out = {};
    g.hz.trainT = 99; calm();
    const r1 = at('raft1'), sump = at('sump');
    put(r1.x, r1.y + 5); lstep(1.4, { held: true }); out.first = [g.counts.raft1, pl.blood || 0, g.seen.has('first'), m.open(g, sump)];
    // someone on their phone never looks up: an easy ankle
    const a1 = at('a1'); put(a1.x, a1.y + 5); lstep(1.4, { held: true }); out.bite = [who('a1').look || 0, g.counts.bite, pl.blood, shown.includes('Ow!')];
    // someone looking round waves her off if she is in the red: blown away, no heart; outside it, nothing
    const q = who('a2'), e = ldnAt(q, 'eyes'); q.state = 'look'; q.timer = 2.4; put(e.x + 30, e.y + 5); const x0 = pl.x;
    lstep(0.3); out.waving = [q.shoo > 0, !!q.wave]; lstep(1.2); out.shooed = [Math.round(Math.abs(pl.x - x0)), g.lives, shown.includes('Shoo!')];
    q.state = 'look'; q.timer = 2.4; q.shoo = 0; put(q.x - 300, 200); lstep(0.5); out.outside = q.shoo > 0;
    calm();
    // a rat can only be bitten while it stops to sniff
    const rat = g.movers.find(z => z.kind === 'rat'), rs = rat.spot;
    rat.sniff = 0; rat.run = 5; lstep(0.2); out.running = rs.off;
    rat.sniff = 4; lstep(0.05); put(rs.x, rs.y + 5); lstep(1.2, { held: true }); out.rat = [g.counts.rat, shown.includes('Squeak!')];
    // the train: safe behind a pillar; in the open its wind blows her back along the line, and costs no heart
    const pil = L.hides[0], px = pil[0] + pil[2] / 2; put(px, 260); g.hz.trainT = 0.5; lstep(2.5); out.hidden = [Math.round(Math.abs(pl.x - px)), g.lives];
    put(1700, 300); g.hz.trainT = 0.5; lstep(2.5); out.open = [Math.round(1700 - pl.x), g.lives, shown.some(t => /rush of air/.test(t))];
    g.hz.trainT = 99;
    // a web: wriggle free in time, or the spider gets there first
    const w = L.webs[0]; put(w.x, w.y + 5); lstep(0.2); out.stuck = [!!g.stuck, m.locked(g)]; lstep(1.5, { held: true }); out.free = [!g.stuck, g.lives];
    put(w.x, w.y + 5); lstep(5.2); out.spider = [!g.stuck, g.lives];
    // a cheeky extra, and the big raft at the end
    const bum = at('bum'); put(bum.x, bum.y + 5); lstep(1.2, { held: true }); out.bum = [g.extras, m.stars(g), shown.includes('YEOWCH!')];
    out.ready = m.open(g, sump); put(sump.x, sump.y); lstep(1.7, { held: true }); out.won = [!!g.homeSafe, g.counts.sump];
    return out;
  });
  check(t.first[0] === 1 && t.first[1] === 0 && t.first[2] && !t.first[3], 'the first raft: ' + t.first);
  check(t.bite[0] === 0 && t.bite[1] === 1 && t.bite[2] === 1 && t.bite[3], 'biting an ankle: ' + t.bite);
  check(t.waving[0] && t.waving[1] && t.shooed[0] > 50 && t.shooed[1] === 3 && t.shooed[2] && !t.outside, 'the red zone: ' + JSON.stringify([t.waving, t.shooed, t.outside]));
  check(t.running && t.rat[0] === 1 && t.rat[1], 'the rat: ' + JSON.stringify([t.running, t.rat]));
  check(t.hidden[0] < 40 && t.hidden[1] === 3 && t.open[0] > 150 && t.open[1] === 3 && t.open[2], 'the train: ' + JSON.stringify([t.hidden, t.open]));
  check(t.stuck[0] && t.stuck[1] && t.free[0] && t.free[1] === 3 && t.spider[0] && t.spider[1] === 2, 'the web: ' + JSON.stringify([t.stuck, t.free, t.spider]));
  check(t.bum[0] === 1 && t.bum[1] === 2 && t.bum[2] && t.ready && t.won[0] && t.won[1] === 1, 'the extra and the big raft: ' + JSON.stringify([t.bum, t.ready, t.won]));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('London wasp, moth and stag beetle: meatball, jam jar, cat, the light, pond, wrestling, joggers’ feet', async (b) => {
  const p = await openGame(b);
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_wasp', { noNet: true });
  await p.evaluate(LDN_STEP);
  const w = await p.evaluate(() => {
    const { g, pl, m, L, at, who, put, calm, btn } = ldnKit(), out = {};
    calm();
    const p1 = at('p1'); put(p1.x, p1.y + 6); lstep(1.2, { held: true }); out.post = g.counts.post;
    // catch the fly, then snip it into a meatball anywhere
    const fly = at('fly'); lstep(0.05); put(fly.x, fly.y + 6); lstep(0.05, { press: true }); out.fly = g.counts.fly;
    put(1300, 300); lstep(0.1); out.snipBtn = btn(); lstep(1.2, { held: true }); out.ball = [g.counts.ball, pl.carry, g.seen.has('ball')];
    // a customer looking round waves her off; under the table she isn't seen
    const q = who('c3'), e = ldnAt(q, 'eyes'); q.state = 'look'; q.timer = 2.4; put(e.x + 30, e.y + 6); const x0 = pl.x; lstep(1.4); out.shoo = [Math.round(Math.abs(pl.x - x0)), g.lives];
    q.state = 'look'; q.timer = 2.4; q.shoo = 0; const hd = L.hides[1]; put(hd[0] + 30, hd[1] + 60); lstep(1.2); out.under = [q.shoo > 0, Math.round(Math.abs(pl.x - hd[0] - 30))];
    calm();
    // the jam-jar trap tugs at her, and holds her if she goes in
    const J = L.jar; put(J.x + 70, J.y + 6); lstep(0.6); out.pull = Math.hypot(pl.x - J.x, pl.y - 6 - J.y) < 68;
    put(J.x + 5, J.y + 6); lstep(0.1); out.jar = [g.lives, g.seen.has('trap')];
    const jam = at('jam'); put(jam.x, jam.y + 6); lstep(1, { held: true }); out.jam = [g.extras, shown.includes('Oi! My scone!')];
    const nest = at('nest'); put(nest.x, nest.y + 6); lstep(0.2); out.early = !!g.homeSafe; g.counts.post = 3; lstep(0.2); out.home = [!!g.homeSafe, m.stars(g)];
    return out;
  });
  check(w.post === 1 && w.fly === 1 && w.snipBtn === 'Chew' && w.ball[0] === 1 && w.ball[1] === 'ball' && w.ball[2], 'the wasp’s wood and meatball: ' + JSON.stringify(w));
  check(w.shoo[0] >= 40 && w.shoo[1] === 3 && !w.under[0] && w.under[1] < 5, 'the customer’s red zone: ' + JSON.stringify([w.shoo, w.under]));
  check(w.pull && w.jar[0] === 2 && w.jar[1] && w.jam[0] === 1 && w.jam[1] && !w.early && w.home[0] && w.home[1] === 2, 'the jam jar, the jam and the nest: ' + JSON.stringify(w));
  await startMission(p, 'ldn_moth', { noNet: true });
  await p.evaluate(LDN_STEP);
  const mo = await p.evaluate(() => {
    const { g, pl, m, L, at, put } = ldnKit(), out = {}, C = L.cat, cat = g.hz.cat;
    g.hz.bird1100 = g.hz.bird2350 = true;
    const b1 = at('b1'); put(b1.x, b1.y + 7); lstep(1, { held: true }); out.sip = g.counts.flower;
    // the cat: awake, it swipes at a moth inside its red circle; asleep, it doesn't
    cat.state = 'awake'; cat.t = 0; put(C.x - 40, C.y - 23); lstep(0.3); out.alert = cat.state; lstep(0.8); out.swipe = g.lives;
    cat.state = 'asleep'; cat.t = 0; put(C.x - 40, C.y - 23); lstep(1.5); out.asleep = [g.lives, cat.state];
    cat.t = -99;
    // dusk and the kitchen light: pulled in, bonk, bounced off, no heart lost
    const Lp = L.lamp; put(Lp.x - 120, Lp.y + 7); lstep(0.1); out.dusk = g.hz.dusk > 0; g.hz.dusk = 1; const l0 = g.lives; lstep(4); out.lamp = [shown.includes('Bonk!'), g.lives - l0, g.seen.has('light')];
    const pants = at('pants'); put(pants.x, pants.y + 7); lstep(0.8, { held: true }); const nose = at('nose'); put(nose.x, nose.y + 7); lstep(0.8, { held: true });
    out.extras = [g.extras, shown.includes('You sat on the pants!'), shown.includes('Snrrk! Achoo!')];
    const web = L.webs[0]; put(web.x, web.y + 7); lstep(0.2); out.stuck = !!g.stuck; lstep(1.5, { held: true }); out.free = !g.stuck;
    const n = at('nettle'); put(n.x, n.y + 7); lstep(0.3, { held: true }); out.early = n.t || 0; g.counts.flower = 4; lstep(1.7, { held: true }); out.home = [!!g.homeSafe, m.stars(g)];
    return out;
  });
  check(mo.sip === 1 && mo.alert === 'alert' && mo.swipe === 2 && mo.asleep[0] === 2 && mo.asleep[1] === 'asleep', 'the cat: ' + JSON.stringify(mo));
  check(mo.dusk && mo.lamp[0] && mo.lamp[1] === 0 && mo.lamp[2] && mo.extras[0] === 2 && mo.extras[1] && mo.extras[2], 'the light and the extras: ' + JSON.stringify(mo));
  check(mo.stuck && mo.free && mo.early === 0 && mo.home[0] && mo.home[1] === 3, 'the web and the nettles: ' + JSON.stringify(mo));
  await startMission(p, 'ldn_stag', { noNet: true });
  await p.evaluate(LDN_STEP);
  const st = await p.evaluate(() => {
    const { g, pl, m, L, at, put, btn } = ldnKit(), out = {};
    g.jogT = 99; g.hz.magpie = g.hz.fox = true;
    const sap = at('sap'); put(sap.x, 560); lstep(1.2, { held: true }); out.sap = [g.extras, g.seen.has('sap')];
    // the pond: too wet to walk, so he is put back on the bank; a flight takes him over
    put(L.pond[0] + 40, 560); lstep(0.1); out.splash = [Math.round(pl.x - L.pond[0]), shown.includes('Splash!')];
    put(L.pond[0] - 60, 560); lstep(0.05, { press: true }); lstep(4.4, { keys: ['arrowright', 'arrowup'] }); out.flew = [pl.x > L.pond[1], pl.y];
    // a rival on his log: do nothing and he tips you off; tap fast and you flip him
    const r = g.rivals[0]; put(r.x - 80, r.y); lstep(0.3, { keys: ['arrowright'] }); out.locked = [!!g.wrestle, m.locked(g), btn()];
    lstep(6); out.lost = [!g.wrestle, r.state, pl.x < r.x - 100, g.lives];
    put(r.x - 80, r.y); lstep(0.3, { keys: ['arrowright'] }); for (let i = 0; i < 40 && g.wrestle; i++) lstep(0.1, { press: true });
    out.won = [!g.wrestle, r.state, g.counts.won, g.seen.has('wrestle')];
    // a jogger's foot: on its red mark he is trodden on; beside it he is fine
    g.steps = [{ x: 2400, t: -0.2, hit: false }]; put(2400, 560); const l0 = g.lives; lstep(0.4); out.trod = l0 - g.lives;
    g.steps = [{ x: 2400, t: -0.2, hit: false }]; put(2470, 560); const l1 = g.lives; lstep(0.4); out.beside = l1 - g.lives;
    // the second rival is an extra; then the female, who needs a win first (he has one)
    const r2 = g.rivals[1]; put(r2.x - 80, r2.y); lstep(0.3, { keys: ['arrowright'] }); for (let i = 0; i < 40 && g.wrestle; i++) lstep(0.1, { press: true });
    out.second = [g.counts.won, g.extras, m.stars(g)];
    const f = at('female'); put(f.x - 10, 380); lstep(0.3); out.home = !!g.homeSafe;
    return out;
  });
  check(st.sap[0] === 1 && st.sap[1] && st.splash[0] === -70 && st.splash[1] && st.flew[0] && st.flew[1] <= 560, 'sap and the pond: ' + JSON.stringify(st));
  check(st.locked[0] && st.locked[1] && st.locked[2] === 'Push' && st.lost[0] && st.lost[1] !== 'lost' && st.lost[2] && st.lost[3] === 3, 'losing a wrestle: ' + JSON.stringify([st.locked, st.lost]));
  check(st.won[0] && /lost|gone/.test(st.won[1]) && st.won[2] === 1 && st.won[3], 'winning a wrestle: ' + st.won);
  check(st.trod === 1 && st.beside === 0 && st.second[0] === 2 && st.second[1] === 2 && st.second[2] === 3 && st.home, 'feet, the second rival and the female: ' + JSON.stringify(st));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('mozzies are shooed away, not swatted: blown a little way off, no heart lost, and only in the red zone', async (b) => {
  const p = await openGame(b);
  await p.evaluate(() => {   // everything shown or said: toasts and pops
    window.shown = [];
    const sh = Game.showToast.bind(Game), pop = Game.pop.bind(Game);
    Game.showToast = (t) => { if (t) shown.push(t.text); sh(t); };
    Game.pop = (x, y, text, c) => { shown.push(text); return pop(x, y, text, c); };
  });
  // the Perth mosquito, biting the arm of someone who looks round
  await startMission(p, 'mosquito', { noNet: true, noPred: true });
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const g = Game.g, pl = g.player, m = g.mission, out = {};
    g.timers = [];
    for (const q of m.people(g)) { q.state = 'chat'; q.timer = 99; }
    const pp = m.people(g)[0], s = m.spots(pp)[1], home = [g.home.x, g.home.y];
    Object.assign(pl, { x: s.x, y: s.y, invuln: 0, blood: 0.4 });
    pp.state = 'look'; pp.timer = 5;
    lstep(0.3, { held: true }); out.waving = [pp.shoo > 0, !!pp.wave];
    lstep(0.5, { held: true }); out.blown = [!!g.shooed, m.locked(g)];
    const x0 = pl.x, b0 = pl.blood;
    lstep(0.2, { held: true, keys: ['arrowleft'] }); out.drift = [pl.x > x0, pl.blood === b0];   // no steering, no biting
    lstep(0.6);
    out.after = { d: Math.round(Math.hypot(pl.x - s.x, pl.y - s.y)), lives: g.lives, blood: pl.blood >= 0.4, home: Math.round(Math.hypot(pl.x - home[0], pl.y - home[1])), shooed: !!g.shooed, waving: !!pp.wave };
    return out;
  });
  check(r.waving[0] && r.waving[1], 'nobody waved: ' + JSON.stringify(r));
  check(r.blown[0] && r.blown[1] && r.drift[0] && r.drift[1], 'the wave did not blow her off: ' + JSON.stringify(r));
  check(r.after.d > 60 && r.after.lives === 3 && r.after.blood && r.after.home > 200 && !r.after.shooed && !r.after.waving, 'shooed wrongly: ' + JSON.stringify(r));
  // the red zone: only someone looking has one; it sweeps; outside it nobody waves; fly out of it in time and the wave misses
  const z = await p.evaluate(() => {
    const g = Game.g, pl = g.player, m = g.mission, out = {};
    for (const q of m.people(g)) { q.state = 'chat'; q.timer = 99; q.shoo = 0; }
    lstep(0.1);
    const pp = m.people(g)[3], e = m.eyes(pp);
    out.chatting = m.inZone(pp, { x: e.x, y: e.y + 10 });
    pp.state = 'look'; pp.timer = m.LOOK; lstep(1 / 60);
    const along = (a, r) => ({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r });
    out.ahead = m.inZone(pp, along(pp.gaze, 150)); out.beside = m.inZone(pp, along(pp.gaze + 1.5, 150)); out.far = m.inZone(pp, along(pp.gaze, 260));
    const g0 = pp.gaze; pp.timer = m.LOOK / 2; lstep(1 / 60); out.swept = Math.abs(pp.gaze - g0) > 1;
    // outside the zone: nobody waves
    Object.assign(pl, along(pp.gaze + Math.PI, 150)); pl.invuln = 0; pp.timer = 2; lstep(0.5); out.outside = pp.shoo > 0 || !!pp.wave;
    // inside it: they wave; out again before it lands: missed
    Object.assign(pl, along(pp.gaze, 120)); lstep(0.1); out.started = pp.shoo > 0;
    Object.assign(pl, along(pp.gaze + Math.PI, 260)); lstep(0.8); out.escaped = [!!g.shooed, g.lives, shown.includes('Missed!')];
    return out;
  });
  check(!z.chatting && z.ahead && !z.beside && !z.far && z.swept, 'the red zone is in the wrong place: ' + JSON.stringify(z));
  check(!z.outside && z.started && !z.escaped[0] && z.escaped[1] === 3 && z.escaped[2], 'the zone did not decide the shoo: ' + JSON.stringify(z));
  // nothing shown or said talks of swatting
  const words = await p.evaluate(() => {
    const t = [...shown];
    for (const id of ['mosquito'].concat(Object.keys(Missions).filter(k => k.startsWith('ldn_')))) { const m = Missions[id]; t.push(...m.how, ...m.facts, ...Object.values(m.factText)); }
    return { swat: t.filter(s => /swat/i.test(s)), shoo: t.filter(s => s === 'Shoo!').length };
  });
  check(words.swat.length === 0 && words.shoo >= 1, 'words: ' + JSON.stringify(words));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('cheeky but true: big meals count double, the echidna’s bubble and droppings, the cuckoo bee, a rival skimmer, termite and snail business, the gull’s splat, the web thief, the waggle, Bonk!', async (b) => {
  const p = await openGame(b);
  await p.evaluate(LDN_SHOWN);
  await p.evaluate(LDN_STEP);
  const run = async (id, o, fn) => { await startMission(p, id, Object.assign({ noNet: true }, o)); return p.evaluate(fn); };
  // bull ant: a caterpillar is two loads; the echidna's snot bubble and its droppings each have a fact
  const ant = await run('ant', {}, () => {
    const g = Game.g, pl = g.player, out = {};
    const e = { sprite: 'echidna', name: 'echidna', ground: true, r: 26, x: pl.x + 300, y: pl.y, angle: 0, state: 'rest', timer: 99, stay: 99, wanderSpeed: 0, chaseSpeed: 0, sight: 0, chaseTime: 4, restTime: 99 };
    g.preds = [e]; g.predCfg = null; pl.invuln = 99;
    pl.carry = 'caterpillar'; pl.carryName = 'caterpillar'; pl.big = true; pl.x = g.home.x; pl.y = g.home.y; lstep(0.1); out.big = [g.score, shown.includes('+2  A big meal!')];
    e.snotT = -1.59; lstep(0.1); out.bubble = [g.seen.has('bubble'), shown.includes('Pop!')];
    g.scats = [{ x: pl.x, y: pl.y, a: 0 }]; lstep(0.1); out.scat = [g.seen.has('scat'), shown.includes('Echidna poo!')];
    out.goal = [g.mission.goal, Missions.bee.goal, Missions.caterpillar.goal, Missions.butterfly.goal, Missions.termite.goal, Missions.snail.goal, Missions.spiderling.goal, Missions.spider.goal, Missions.nymph.goal, Missions.dragonfly.goal, Missions.skimmerF.goal, Missions.sandhopper.goal, Missions.frog.goal].join();
    return out;
  });
  check(ant.big[0] === 2 && ant.big[1] && ant.bubble.every(Boolean) && ant.scat.every(Boolean), 'the ant level: ' + JSON.stringify(ant));
  check(ant.goal === '8,9,9,6,6,8,6,5,6,15,5,7,6', 'the shorter goals: ' + ant.goal);
  // blue-banded bee: the cuckoo bee is seen off by flying at her; left alone she gets in and a load is lost
  const bee = await run('bee', { noPred: true }, () => {
    const g = Game.g, pl = g.player, h = g.home, out = {};
    g.score = 3; pl.x = h.x + 700; pl.y = h.y + 300; lstep(0.1); const c = g.cuckoo; out.came = [!!c && c.state, g.seen.has('cuckoo'), Math.round(dist(c, h)) > 200];
    const d0 = dist(c, h); lstep(2); out.creeps = dist(c, h) < d0 - 10;
    pl.x = c.x + 10; pl.y = c.y; lstep(0.1); out.shooed = [c.state, g.score, shown.includes('Shoo! Off she goes'), g.cuckooDone];
    lstep(5); out.gone = !g.cuckoo;
    g.cuckooDone = false; pl.x = h.x + 700; pl.y = h.y + 300; lstep(0.1); g.cuckoo.x = h.x + 5; g.cuckoo.y = h.y; lstep(0.1); out.gotIn = [g.score, shown.includes('She got in! One load lost')];
    return out;
  });
  check(bee.came[0] === 'sneak' && bee.came[1] && bee.came[2] && bee.creeps && bee.shooed[0] === 'flee' && bee.shooed[1] === 3 && bee.shooed[2] && bee.shooed[3] && bee.gone && bee.gotIn[0] === 2 && bee.gotIn[1], 'the cuckoo bee: ' + JSON.stringify(bee));
  // blue skimmer: a rival male circles your patch till you fly at him; a nymph's tadpole is two meals
  const dr = await run('dragonfly', { noPred: true }, () => {
    const g = Game.g, pl = g.player, out = {};
    g.score = 5; g.items = []; lstep(0.1); const r = g.rival; out.came = [!!r && r.state, g.seen.has('rival'), !!g.mission.goalPoint(g)];
    pl.x = r.x; pl.y = r.y; lstep(0.1); out.off = [r.state, g.rivalDone, shown.includes('Clack! Off he goes')]; lstep(3.5); out.gone = !g.rival;
    return out;
  });
  check(dr.came[0] === 'circle' && dr.came[1] && dr.came[2] && dr.off[0] === 'flee' && dr.off[1] && dr.off[2] && dr.gone, 'the rival skimmer: ' + JSON.stringify(dr));
  const ny = await run('nymph', { noPred: true }, () => {
    const g = Game.g, pl = g.player;
    g.items = [{ sprite: 'tadpole', kind: 'tadpole', x: pl.x + 30, y: pl.y, r: 12, speed: 0, scale: 1 }]; lstep(0.1); lstep(0.05, { press: true });
    const two = g.score; g.items = []; lstep(0.5); lstep(0.05, { press: true }); lstep(0.2);
    return [two, shown.includes('Gulp! +2'), (g.bubbles || []).length > 0, shown.includes('Pfft!')];
  });
  check(ny[0] === 2 && ny[1] && ny[2] && ny[3], 'the nymph’s tadpole and bubbles: ' + JSON.stringify(ny));
  // termite: three of each wins; the second load of wood comes with a fart. Snail: every third meal, a folded rope
  const te = await run('termite', { noPred: true }, () => {
    const g = Game.g, pl = g.player, m = g.mission, out = {};
    for (let k = 0; k < 2; k++) { pl.carry = 'wood'; pl.x = g.home.x; pl.y = g.home.y; lstep(0.1); }
    out.fart = [g.wood, g.seen.has('fart'), shown.includes('Pfft!')];
    g.wood = 3; g.mud = 2; out.notYet = m.won(g); g.mud = 3; out.won = m.won(g);
    return out;
  });
  check(te.fart[0] === 2 && te.fart[1] && te.fart[2] && !te.notYet && te.won, 'the termites: ' + JSON.stringify(te));
  const sn = await run('snail', { noPred: true }, () => {
    const g = Game.g, pl = g.player;
    g.sun = []; g.score = 2; const f = g.items[0]; f.amount = 0.2; pl.x = f.x; pl.y = f.y; lstep(0.6, { held: true });
    return [g.score, (g.poos || []).length, g.seen.has('poo'), shown.includes('Plop!')];
  });
  check(sn[0] === 3 && sn[1] === 1 && sn[2] && sn[3], 'the snail’s poo: ' + JSON.stringify(sn));
  // sandhopper: an eaten pile sends the others hopping; the gull's splat lands on her and does no harm
  const sa = await run('sandhopper', { noPred: true }, () => {
    const g = Game.g, pl = g.player, out = {}, gy = Beach.ground(pl.x);
    g.splatT = 99; g.splat = { x: pl.x, y: gy - 30, gy, t: 0, hit: false }; lstep(0.3); out.splat = [g.splat.hit, g.lives, shown.includes('Splat! Yuck!')];
    const w = g.items.find(i => i.kind === 'wrack'); pl.x = w.x; pl.y = Beach.ground(w.x); pl.onGround = true; lstep(0.2); lstep(1.3, { held: true }); out.ate = [g.score, (g.hoppers || []).length > 0];
    return out;
  });
  check(sa.splat[0] && sa.splat[1] === 3 && sa.splat[2] && sa.ate[0] === 1 && sa.ate[1], 'the sandhopper’s beach: ' + JSON.stringify(sa));
  // the orb web: what sits too long brings the dewdrop spider; a tap sends it off; left alone it steals
  const web = await run('web', {}, () => {
    const g = Game.g, m = g.mission, out = {};
    const q = { sprite: 'fly', kind: 'fly', x: 520, y: 300, r: 9, scale: 1.5, stuck: {}, sitT: 6 }; g.prey = [q]; g.spawnT = 99; g.thiefT = 0;
    lstep(0.1); const th = g.thief; out.came = [!!th && th.state, Math.hypot(th.x - q.x, th.y - q.y) > 100];
    m.onPointer(g, 'down', th.x, th.y); out.shooed = [th.state, g.seen.has('klepto'), shown.includes('Shoo, thief!'), g.prey.includes(q)];
    lstep(3); out.gone = !g.thief;
    q.sitT = 6; g.thiefT = 0; lstep(0.1); g.thief.x = q.x + 2; g.thief.y = q.y; lstep(0.1); out.stolen = [!g.prey.includes(q), shown.includes('Stolen!'), g.score];
    return out;
  });
  check(web.came[0] === 'creep' && web.came[1] && web.shooed[0] === 'flee' && web.shooed[1] && web.shooed[2] && web.shooed[3] && web.gone && web.stolen[0] && web.stolen[1] && web.stolen[2] === 0, 'the web thief: ' + JSON.stringify(web));
  // the sugar ant nest: it rains again after the first shower. The mother spider's waggle. The banjo frog says Bonk!
  const ne = await run('nest', {}, () => { const g = Game.g; g.raining = 0.02; g.rainT = -5; g.mission.weather(g, 0.1); const a = [g.raining, g.rainT > 60]; g.rainT = 0; g.mission.weather(g, 0.1); return a.concat(g.raining > 10, NEST.mound, NEST.jaws); });
  check(ne[0] === 0 && ne[1] && ne[2] && ne[3] === 12 && ne[4] === 6, 'rain comes back to the nest: ' + JSON.stringify(ne));
  const sf = await run('spiderF', { noPred: true }, () => { const g = Game.g, pl = g.player, m = g.mission; const male = { x: pl.x + 60, y: pl.y, state: 'dance' }; m.giveUp(g, male); return [g.waggleT > 0, g.seen.has('waggle'), shown.includes('No thanks!'), male.state]; });
  check(sf[0] && sf[1] && sf[2] && sf[3] === 'leave', 'the waggle: ' + JSON.stringify(sf));
  const fr = await run('frog', { noPred: true }, () => { const g = Game.g, pl = g.player, o = g.others.find(q => q.kind === 'banjo'); pl.x = o.x + 100; pl.y = o.y; g.mission.callFrom(g, o, 'banjo'); return [shown.includes('Bonk!'), g.seen.has('banjo')]; });
  check(fr[0] && fr[1], 'Bonk!: ' + JSON.stringify(fr));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('platform physics: ramps to walk up, a ball that rolls down one and flies off its end, the fox’s jump', async (b) => {
  const p = await openGame(b);
  const r = await p.evaluate(() => {
    const L = { w: 4000, floor: 560, solids: [[900, 440, 150, 120, 'bark'], [2540, 420, 130, 140, 'bark']], ledges: [], ramps: [[1050, 440, 1340, 560], [2670, 420, 2960, 540], [2960, 540, 3030, 510]] };
    const W = LDN_PHYS.louse, F = LDN_PHYS.fox, bug = (x, y, o) => Object.assign({ x, y, vx: 0, vy: 0, acc: 0, flyT: 0, warmT: 0 }, o);
    const run = (P, q, sec, dx, each) => { for (let i = 0; i < sec * 60; i++) { Plat.move(L, P, q, 1 / 60, dx, 0, {}); if (each) each(q); } return q; };
    const out = {};
    // walking: up the slope from its foot, onto the log it leans on
    const up = run(W, bug(1420, 560), 5.5, -1); out.up = [Math.round(up.x) < 1040, up.y === 440, up.onGround];
    // a ball: no steering on the flat; down the slope it gathers speed, and rolls on along the flat
    const flat = run(W, bug(300, 560, { rolled: true }), 1, 1); out.flat = flat.x === 300;
    let top = 0; const ball = run(W, bug(1062, 444, { rolled: true }), 6, 0, (q) => { top = Math.max(top, q.vx); }); out.roll = [Math.round(top), ball.x > 1500, Math.abs(ball.vx) < 5, ball.y === 560];
    // the second slope kicks up at its end: the ball is thrown over what lies beyond
    let high = 560, air = 0; const jump = run(W, bug(2682, 424, { rolled: true }), 3, 0, (q) => { if (q.x > 3030 && !q.onGround) { air = Math.max(air, q.x); high = Math.min(high, q.y); } }); out.jump = [Math.round(air), Math.round(high), jump.x > 3160];
    // walking off the same lip just drops
    const drop = run(W, bug(2900, 515), 3, 1, null); out.drop = drop.x > 3030;
    // the fox: jumps onto a wall as high as her shoulder and a bit, not from mid-air
    const fx = bug(100, 560, { onGround: true }); Plat.jump(F, fx); let apex = 560; run(F, fx, 1.2, 0, (q) => { apex = Math.min(apex, q.y); }); out.fox = [Math.round(560 - apex), Plat.jump(F, Object.assign(fx, { onGround: false }))];
    return out;
  });
  check(r.up[0] && r.up[1] && r.up[2], 'walking up the ramp: ' + JSON.stringify(r.up));
  check(r.flat && r.roll[0] >= 300 && r.roll[0] <= LDN_ROLL && r.roll[1] && r.roll[2] && r.roll[3], 'the rolling ball: ' + JSON.stringify(r));
  check(r.jump[0] > 3150 && r.jump[1] < 510 && r.jump[2] && r.drop, 'the ramp’s jump: ' + JSON.stringify(r));
  check(r.fox[0] > 110 && r.fox[0] < 160 && r.fox[1] === false, 'the fox’s jump: ' + JSON.stringify(r.fox));
  check(p.errors.length === 0, p.errors.join('; '));
});
const LDN_ROLL = 360;   // the ball's top speed (LDN_PHYS.louse.roll)

test('the Ally Pally wasp: shiver first, land on the thrower and his dart scores 1, the board only between throws, smoke, the drink, back to sleep', async (b) => {
  const p = await openGame(b);
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_darts', { noNet: true });
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const { g, pl, m, L, at, put, calm, btn } = ldnKit(), out = {}, O = g.oche;
    calm(); g.jetT = 1.5;
    out.words = [ldnScoreWords(180), ldnScoreWords(100), ldnScoreWords(41), ldnScoreWords(7), ldnScoreWords(0)];
    // too cold to fly until she has shivered
    const x0 = pl.x; lstep(0.4, { keys: ['arrowright'] }); out.cold = [btn(), pl.x === x0, m.locked(g)];
    lstep(1.7, { held: true }); out.warm = [g.counts.warm, g.seen.has('shiver')];
    lstep(0.4, { keys: ['arrowright'] }); out.flies = pl.x > x0 + 20;
    const sl = at('sleep'); put(sl.x, 150); lstep(0.2); out.early = btn();
    // on the thrower's shoulder: his next dart goes in the 1
    O.ph = 'wait'; O.t = 9; O.n = 0; O.total = 0; O.darts = []; lstep(0.05);
    const ms = at('miss'); put(ms.x, ms.y + 7); lstep(1, { held: true }); out.miss = [g.counts.miss, O.wild];
    O.t = 0; lstep(1.5); out.wild = [O.darts.length, O.total, shown.includes('1!')];
    // the board: not while darts fly (one whooshes past her), free once he has thrown three
    const bd = at('board'); out.off = bd.off; put(bd.x, bd.y + 7); lstep(1.25); out.whoosh = [shown.includes('Whoosh!'), g.lives, pl.x < bd.x - 20];
    put(1400, 300); g.shooed = 0; lstep(1.4); lstep(0.8); out.call = [O.ph, shown.includes('ONE HUNDRED AND TWENTY-ONE!'), shown.includes('Ooooh!')];
    out.open = !bd.off; put(bd.x, bd.y + 7); lstep(1.2, { held: true }); out.board = g.counts.board;
    // stage smoke blows her back, and costs nothing
    g.jetT = 0.1; put(L.jets[0] - 10, 300); g.shooed = 0; lstep(0.3); out.jet = [pl.x < L.jets[0] - 30, g.lives]; g.jetT = 1.5; g.shooed = 0;
    // the extras: the caller's bald head, the trophy
    calm(); const rf = at('ref'); put(rf.x, rf.y + 7); lstep(0.8, { held: true }); out.ref = [g.extras, shown.includes('Get off my head!')];
    const tr = at('trophy'); put(tr.x, tr.y + 7); lstep(0.8, { held: true }); out.trophy = g.extras;
    const sp = at('sip'); put(sp.x, sp.y + 7); lstep(1.2, { held: true }); out.sip = [g.counts.sip, shown.includes('Oi! That’s my drink!')];
    put(sl.x, 150); lstep(0.2); out.sleepBtn = btn(); lstep(1.7, { held: true }); out.home = [!!g.homeSafe, m.stars(g)];
    return out;
  });
  check(r.words.join('|') === 'ONE HUNDRED AND EIGHTY|ONE HUNDRED|FORTY-ONE|SEVEN|NO SCORE', 'the caller’s words: ' + r.words);
  check(r.cold[0] === 'Shiver' && r.cold[1] && r.cold[2] && r.warm[0] === 1 && r.warm[1] && r.flies && r.early !== 'Sleep', 'shivering first: ' + JSON.stringify(r));
  check(r.miss[0] === 1 && r.miss[1] && r.wild[0] === 1 && r.wild[1] === 1 && r.wild[2], 'landing on the thrower: ' + JSON.stringify(r));
  check(r.off && r.whoosh[0] && r.whoosh[1] === 3 && r.whoosh[2] && r.call[0] === 'fetch' && r.call[1] && r.call[2] && r.open && r.board === 1, 'the board and the darts: ' + JSON.stringify(r));
  check(r.jet[0] && r.jet[1] === 3 && r.ref[0] === 1 && r.ref[1] && r.trophy === 2 && r.sip[0] === 1 && r.sip[1] && r.sleepBtn === 'Sleep' && r.home[0] && r.home[1] === 3, 'smoke, extras, drink and sleep: ' + JSON.stringify(r));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('the pill woodlouse: Roll and uncurl, the sun dries her, two moults, bowling the ants, the spider’s stone, the puddle jump', async (b) => {
  const p = await openGame(b);
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_louse', { noNet: true });
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const { g, pl, m, L, at, put, btn } = ldnKit(), out = {}, F = L.floor, A = L.ants, S = g.spider;
    g.hz.centipede = true; S.state = 'in'; S.t = 99;
    // Roll: a ball doesn't walk; steering uncurls it after a moment
    lstep(0.1); out.btn = btn(); lstep(0.05, { press: true }); out.rolled = [pl.rolled, btn(), g.seen.has('roll')];
    const x0 = pl.x; lstep(0.3, { keys: ['arrowright'] }); out.ball = pl.rolled && Math.abs(pl.x - x0) < 2; lstep(0.6, { keys: ['arrowright'] }); out.uncurl = [!pl.rolled, pl.x > x0 + 5];
    // food, and the poo
    const f1 = at('f1'); put(f1.x, F); lstep(1, { held: true }); out.food = g.counts.food;
    const poo = at('poo'); put(poo.x, F); lstep(1, { held: true }); out.poo = [g.extras, g.seen.has('poo')];
    // the sun dries her, more slowly rolled up; under the leaves she gets damp again; bone dry costs a heart
    g.damp = 1; put(560, F); lstep(1); const d1 = 1 - g.damp; pl.rolled = true; pl.rollT = 0; g.damp = 1; lstep(1); const d2 = 1 - g.damp; out.dry = [d1 > 0.1, d2 > 0 && d2 < d1 / 2, g.seen.has('dry')];
    pl.rolled = false; g.damp = 0.3; const h = L.hides[0]; put(h[0] + 60, F); lstep(1); out.leaves = [g.hidden, g.damp > 0.7];
    g.damp = 0.03; put(560, F); lstep(0.5); out.dried = [g.lives, g.damp];
    // two moults: the back half, then the front
    const m1 = at('m1'), m2 = at('m2'); put(m2.x, F); lstep(0.2); out.m2early = btn() !== 'Moult';
    put(m1.x, F); lstep(1.4, { held: true }); out.moult = [g.counts.moult, pl.moult, shown.includes('Half a new suit!')];
    put(m2.x, F); lstep(1.4, { held: true }); out.moult2 = [g.counts.moult, pl.moult];
    // down the slope as a ball, right through the ants
    const r1 = L.ramps[0], on = (q, dx) => put(q[0] + dx, q[1] + dx * (q[3] - q[1]) / (q[2] - q[0]));
    on(r1, 14); lstep(0.05); lstep(0.05, { press: true }); out.curl = pl.rolled; lstep(4.5); out.bowl = [pl.x > A[1], g.strikes >= 3, shown.includes('Strike!'), shown.includes('Wheee!')];
    // walking into them: nipped and shoved back out; curled up among them, they give up
    g.antsOff = 0; for (const a of g.ants) { a.fly = false; a.y = F; } g.ants[0].x = A[0] + 60; g.ants[0].v = 0; pl.rolled = false; put(A[0] - 30, F); lstep(0.05); put(A[0] + 60, F); const l0 = g.lives; lstep(0.1);
    out.nip = [shown.includes('Nip!'), Math.round(pl.x) === A[0] - 70, g.lives === l0];
    g.ants[0].x = A[0] + 60; put(A[0] + 60, F); pl.rolled = true; pl.rollT = 1; lstep(2.5); out.giveUp = [g.antsOff > 0, shown.includes('The ants give up!'), g.lives === l0];
    // the spider's stone: safe while it is in, caught when it is out
    pl.rolled = false; put(L.lair[0] + 60, F); lstep(0.3); const l1 = g.lives; S.state = 'out'; S.t = 2; lstep(0.1); out.spider = [l1 === l0, g.lives < l1 || g.lives === 1]; S.state = 'in'; S.t = 99;
    // the puddle: walking in is a splash and back to the log; the ramp throws a ball clean over
    put(L.puddle[0] + 40, F); lstep(0.1); out.splash = [Math.round(pl.x), shown.includes('Splash!')];
    const n0 = shown.filter(x => x === 'Splash!').length; on(L.ramps[1], 14); pl.rolled = true; pl.rollT = 0; lstep(3.2); out.jump = [pl.x > L.puddle[1], shown.includes('What a jump!'), shown.filter(x => x === 'Splash!').length === n0];
    // the dew drop, and home only with three meals and both moults
    pl.rolled = false; const dew = at('dew'); put(dew.x, F); const e0 = g.extras; lstep(1.2, { held: true }); out.dew = [g.extras - e0, g.seen.has('drink')];
    const cr = at('crack'); put(cr.x, F); lstep(0.2); out.early = !!g.homeSafe; g.counts.food = 3; lstep(0.2); out.home = [!!g.homeSafe, m.stars(g)];
    return out;
  });
  check(r.btn === 'Roll' && r.rolled[0] && r.rolled[1] === 'Unroll' && r.rolled[2] && r.ball && r.uncurl[0] && r.uncurl[1], 'Roll and uncurl: ' + JSON.stringify(r));
  check(r.food === 1 && r.poo[0] === 1 && r.poo[1] && r.dry[0] && r.dry[1] && r.dry[2] && r.leaves[0] && r.leaves[1] && r.dried[0] === 2 && r.dried[1] === 1, 'food, poo and the sun: ' + JSON.stringify(r));
  check(r.m2early && r.moult[0] === 1 && r.moult[1] === 1 && r.moult[2] && r.moult2[0] === 2 && r.moult2[1] === 2, 'the two moults: ' + JSON.stringify(r));
  check(r.curl && r.bowl.every(Boolean) && r.nip.every(Boolean) && r.giveUp.every(Boolean), 'the ants: ' + JSON.stringify(r));
  check(r.spider[0] && r.spider[1] && r.splash[0] === 2500 && r.splash[1] && r.jump.every(Boolean), 'the spider and the puddle: ' + JSON.stringify(r));
  check(r.dew[0] === 1 && r.dew[1] && !r.early && r.home[0] && r.home[1] === 3, 'the dew and the crack: ' + JSON.stringify(r));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('the fox: jump, stand still for a worm and pounce, the daddy-long-legs, the mouse, the road, the cat, the welly and the gnome', async (b) => {
  const p = await openGame(b);
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_fox', { noNet: true });
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const { g, pl, m, L, at, put, btn } = ldnKit(), out = {}, F = L.floor, R = L.road, C = L.cat, cat = g.hz.cat;
    for (const ln of R.lanes) ln.t = 99;
    lstep(0.1); out.btn = btn(); lstep(0.05, { press: true }); lstep(0.25); out.jump = [pl.y < F - 60, !pl.onGround]; lstep(1);
    // a worm: trot up and it stays down; stand still and up it comes; trot off and it's gone; Pounce is a leap
    const w1 = at('w1'); put(w1.x - 190, F); lstep(0.45, { keys: ['arrowright'] }); out.down = !w1.up && w1.off;
    put(w1.x - 100, F); lstep(0.9); out.up = [w1.up, btn(), shown.includes('A worm!'), g.seen.has('listen')];
    lstep(0.6, { keys: ['arrowleft'] }); out.gone = [!w1.up, shown.includes('Gone!')];
    put(w1.x - 100, F); lstep(0.9); lstep(0.05, { press: true }); out.leap = [!!g.pounce, m.locked(g), g.counts.snack || 0]; lstep(0.2); out.air = pl.y < F - 20; lstep(0.5);
    out.worm = [g.counts.snack, Math.abs(pl.x - w1.x) < 20, shown.includes('Slurp! A worm'), pl.y === F];
    // the daddy-long-legs: out of reach from the ground, snapped up with a jump
    const fl = at('fly'); put(fl.ax, F); lstep(0.4); out.ground = !fl.done; lstep(0.05, { press: true }); lstep(0.6); out.fly = [fl.done, g.counts.snack];
    // the mouse: listen for longer, a much higher leap, and then she carries it
    const mo = at('mouse'); put(mo.x - 110, F); lstep(0.7); out.quiet = !mo.up; lstep(0.5); out.squeak = [mo.up, shown.includes('Squeak!')];
    lstep(0.05, { press: true }); lstep(0.33); const top = pl.y; lstep(0.6); out.mouse = [g.counts.mouse, top < F - 110, pl.carry];
    // the road: safe on the island as the bus goes by; in a lane, back to the kerb
    put(R.island[0] + 20, F); R.lanes[0].t = 0.3; R.lanes[1].t = 0.3; R.lanes[0].kind = 'bus'; lstep(0.6); out.island = g.lives;
    put(R.lanes[0].x + 30, F); R.lanes[0].t = 0.3; lstep(0.4); out.car = g.lives; R.lanes[0].t = 99; R.lanes[1].t = 99;
    // the cat on the wall: awake, it sends her back; asleep, she walks past
    cat.state = 'awake'; cat.t = 9; put(C.x - 60, C.y); const x0 = pl.x; lstep(0.8); out.hiss = [shown.includes('Hssss!'), g.lives, pl.x < x0 - 30, g.seen.has('cat')];
    lstep(1); cat.state = 'asleep'; cat.t = 9; g.shooed = 0; put(C.x - 60, C.y); lstep(0.7, { keys: ['arrowright'] }); out.asleep = pl.x > C.x + 30;
    // the extras
    const we = at('welly'); put(we.x, F); lstep(0.1); out.wellyBtn = btn(); lstep(0.05, { press: true }); lstep(0.05); out.welly = [g.extras, shown.includes('Oi! My welly!'), pl.welly, g.seen.has('shoes')];
    const gn = at('gnome'); put(gn.x, F); lstep(1, { held: true }); out.gnome = [g.extras, g.seen.has('mark')];
    // home, with three snacks and the mouse
    const den = at('den'); put(den.x, F); lstep(0.2); out.early = !!g.homeSafe; g.counts.snack = 3; lstep(0.2); out.home = [!!g.homeSafe, m.stars(g), pl.carry];
    return out;
  });
  check(r.btn === 'Jump' && r.jump[0] && r.jump[1], 'the jump: ' + JSON.stringify(r));
  check(r.down && r.up[0] && r.up[1] === 'Pounce' && r.up[2] && r.up[3] && r.gone[0] && r.gone[1], 'listening for a worm: ' + JSON.stringify(r));
  check(r.leap[0] && r.leap[1] && r.leap[2] === 0 && r.air && r.worm[0] === 1 && r.worm[1] && r.worm[2] && r.worm[3], 'the pounce: ' + JSON.stringify(r));
  check(r.ground && r.fly[0] && r.fly[1] === 2 && r.quiet && r.squeak[0] && r.squeak[1] && r.mouse[0] === 1 && r.mouse[1] && r.mouse[2] === 'mouse', 'the daddy-long-legs and the mouse: ' + JSON.stringify(r));
  check(r.island === 3 && r.car === 2 && r.hiss[0] && r.hiss[1] === 2 && r.hiss[2] && r.hiss[3] && r.asleep, 'the road and the cat: ' + JSON.stringify(r));
  check(r.wellyBtn === 'Nick' && r.welly[0] === 1 && r.welly[1] && r.welly[2] && r.welly[3] && r.gnome[0] === 2 && r.gnome[1] && !r.early && r.home[0] && r.home[1] === 3 && r.home[2] === null, 'extras and home: ' + JSON.stringify(r));
  check(p.errors.length === 0, p.errors.join('; '));
});

test('London I-spy: four sights a level, each named in the docs; spotted only on screen, saved, on the page, the HUD and the end screen', async (b) => {
  const p = await openGame(b);
  const facts = fs.readFileSync(path.join(ROOT, 'docs', 'facts.md'), 'utf8');
  const all = await p.evaluate(() => Bugs.filter(x => x.hub === 'london').flatMap(x => x.stages).filter(id => id !== 'ldn_wrestle').map(id => ({ id, sights: (Missions[id].sights || []).map(s => ({ key: s.key, name: s.name, how: s.mover ? 'mover' : s.at ? 'at' : 'place' })) })));
  check(all.length >= 9 && all.some(m => m.id === 'ldn_thames'), 'levels with an I-spy list: ' + all.map(m => m.id));
  for (const m of all) {
    check(m.sights.length === 4 && new Set(m.sights.map(s => s.key)).size === 4, m.id + ' has ' + m.sights.length + ' sights');
    for (const s of m.sights) check(facts.toLowerCase().includes('*' + s.name.toLowerCase() + '*'), m.id + ': "' + s.name + '" is not in docs/facts.md');
  }
  // a save from before the I-spy list still loads
  await p.evaluate(() => { localStorage.setItem('bugame.progress', JSON.stringify({ stars: { ant: 2 }, facts: {}, secrets: ['s_london'], best: {} })); Progress.load(); });
  check(await p.evaluate(() => Progress.stars('ant') === 2 && Progress.sights('ldn_bee').length === 0), 'an old save did not load');
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_bee', { noNet: true });
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const { g, pl, m, put } = ldnKit(), out = {}, bt = m.sights.find(s => s.key === 'bt');
    for (const mv of g.movers) if (mv.kind === 'parakeets') mv.wait = 999;
    put(3000, 300); g.cam.x = 2700; lstep(1.2); out.far = [g.spied.has('bt'), Progress.sights('ldn_bee').includes('bt')];
    put(bt.x - 60, 300); lstep(0.3); out.soon = g.spied.has('bt'); lstep(1.6);
    out.seen = [g.spied.has('bt'), Progress.sights('ldn_bee').includes('bt'), shown.includes('Spotted: the BT Tower'), !!g.spyFx || true];
    out.hud = document.getElementById('hudFind').textContent; out.end = m.endLine(g);
    // a flock of parakeets counts once it is in view
    const fl = g.movers.find(q => q.kind === 'parakeets'); fl.wait = 0; lstep(3); out.flock = [g.spied.has('parakeets'), shown.includes('Spotted: green parakeets')];
    return out;
  });
  check(!r.far[0] && !r.far[1] && r.seen[0] && r.seen[1] && r.seen[2], 'spotting the BT Tower: ' + JSON.stringify(r));
  check(/\u{1F440} \d \/ 4/u.test(r.hud) && /London things spotted: \d of 4/.test(r.end) && r.flock[0] && r.flock[1], 'the HUD, the end line and the flock: ' + JSON.stringify(r));
  // the level's page lists them, the spotted ones ticked
  await p.evaluate(() => { Game.stop && Game.stop(); currentHub = 'london'; openBug(Bugs.find(x => x.id === 'l_bee')); });
  const page = await p.evaluate(() => ({ head: !document.getElementById('stageSpyHead').hidden, items: [...document.querySelectorAll('#stageSpy li')].map(li => [li.textContent, li.className]) }));
  check(page.head && page.items.length === 4 && page.items.some(([t, c]) => /BT Tower/.test(t) && c === 'spied' && t.startsWith('✓')) && page.items.some(([t, c]) => c === '' && t.startsWith('○')), 'the page’s list: ' + JSON.stringify(page));
  await p.evaluate(() => openBug(Bugs.find(x => x.id === 'ant')));
  check(await p.evaluate(() => document.getElementById('stageSpy').hidden && document.getElementById('stageSpyHead').hidden), 'a Perth level shows the I-spy list');
  // every one of them spotted: the London spotter secret
  const spy = await p.evaluate(() => { const before = Progress.hasSecret('s_spy'); for (const m of Object.values(Missions)) for (const s of m.sights || []) Progress.addSight(m.id, s.key); return [before, Progress.hasSecret("s_spy"), SECRETS.all().some(x => x.key === "s_spy")]; });
  check(!spy[0] && spy[1] && spy[2], 'the London spotter secret: ' + JSON.stringify(spy));
  check(p.errors.length === 0, p.errors.join('; '));
});

// ---- 3.20: the 3D flight kit, the flight up the Thames, the stag beetle wrestle
test('3D flight kit: speed follows the nose, a shadow lies under her, the camera keeps time not frames, the hunter is seen first and loses her down low', async (b) => {
  const p = await openGame(b);
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'flight', { noNet: true });
  await p.waitForFunction(() => Game.g.fl3d || Game.g.noGL, null, { timeout: 30000 });
  check(await p.evaluate(() => !!Game.g.fl3d), 'no 3D scene');
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const g = Game.g, m = g.mission, fl = g.fl, out = {};
    g.timers = []; fl.birdT = 1e9;
    lstep(0.1, { press: true }); out.off = [fl.flying, fl.sp];
    // nose down: faster. A climb: slower. Level: cruising.
    fl.y = 30; for (let i = 0; i < 150; i++) { fl.y = 30; m.move(g, 1 / 60, 0, 1); } out.dive = [fl.vy, fl.sp];
    for (let i = 0; i < 150; i++) { fl.y = 20; fl.vy = 5; m.move(g, 1 / 60, 0, -1); } out.climb = fl.sp;
    for (let i = 0; i < 200; i++) { fl.y = 20; fl.vy = 0; m.move(g, 1 / 60, 0, 0); } out.level = [fl.sp, m.cruise, m.slow, m.fast];
    // a glide sinks gently, and she leans into a turn
    fl.vy = 0; for (let i = 0; i < 180; i++) { fl.y = 30; m.move(g, 1 / 60, 1, 0); } out.glide = fl.vy; out.bank = fl.bank; const y0 = fl.yaw; m.move(g, 1 / 60, 1, 0); out.right = fl.yaw < y0;
    // the shadow: straight under her, on the ground
    fl.x = 40; fl.z = -20; fl.y = heathHeight(40, -20) + 12; fl.floor = heathHeight(40, -20); Game.draw();
    const sh = g.fl3d.shadow.position; out.shadow = [Math.abs(sh.x - fl.x) < 0.01, Math.abs(sh.z - fl.z) < 0.01, Math.abs(sh.y - heathHeight(40, -20)) < 0.3, g.fl3d.shadow.visible];
    // the camera closes on its place by the clock: 30 frames a second and 120 end in the same spot
    const run = (fps) => { fl.x = 0; fl.z = 0; fl.y = 12; fl.yaw = 0; fl.turn = 0; fl.camPos = null; m.cam(g, 0); fl.x = 20; fl.z = 20; fl.y = 18; for (let i = 0; i < fps * 0.3; i++) m.cam(g, 1 / fps); return [fl.camPos.x, fl.camPos.y, fl.camPos.z]; };
    const a = run(30), c = run(120); out.cam = [Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]), Math.hypot(a[0] - 20, a[2] - 20)];
    fl.y = -50; m.cam(g, 1); out.above = fl.camPos.y > heathHeight(fl.camPos.x, fl.camPos.z) + 1;
    // the hunter: seen first, circling; then it comes; get down low and it loses you
    fl.x = 0; fl.z = 0; fl.y = 30; fl.vy = 0; g.score = 1; fl.birdT = 0; shown.length = 0;
    lstep(1); const bd = fl.bird; out.watch = [bd && bd.state, bd && Math.round(Math.hypot(bd.x - fl.x, bd.z - fl.z)), shown.some(t => /seen you/.test(t)), g.lives];
    lstep(2); out.still = [fl.bird.state, g.lives];
    lstep(1); out.stoop = fl.bird.state;
    for (let i = 0; i < 80 && fl.bird && fl.bird.state === 'stoop'; i++) { fl.y = fl.floor + 1.5; fl.vy = 0; lstep(1 / 60 * 2); }
    out.lost = [fl.bird && fl.bird.state, shown.includes('It lost you!'), g.lives];
    // caught in the open: a heart, and back to the start
    fl.bird = { x: fl.x, y: 30, z: fl.z, yaw: 0, t: 0, state: 'stoop' }; fl.y = 30; fl.vy = 0; g.player.invuln = 0; lstep(0.05); out.caught = [g.lives, Math.round(fl.x), Math.round(fl.z)];
    // the sea breeze comes in after two flowers, up high only
    g.score = 2; fl.y = fl.floor + 20; out.wind = [!!m.air(g, fl) && m.air(g, fl).k, m.air(g, fl).x > 0]; fl.y = fl.floor + 3; out.calm = m.air(g, fl).k; g.score = 1; out.before = m.air(g, fl);
    return out;
  });
  check(r.off[0] && r.dive[1] > r.level[1] + 3 && r.dive[1] <= r.level[3] + 0.01 && r.climb < r.level[1] - 2 && r.climb >= r.level[2] - 0.01 && Math.abs(r.level[0] - r.level[1]) < 0.2, 'speed: ' + JSON.stringify(r));
  check(r.glide < -2 && r.glide > -3 && r.bank < -0.3 && r.right, 'the glide and the lean: ' + JSON.stringify([r.glide, r.bank, r.right]));
  check(r.shadow.every(Boolean), 'the shadow: ' + r.shadow);
  check(r.cam[0] < 1e-6 && r.cam[1] > 1 && r.above, 'the camera: ' + JSON.stringify(r.cam));
  check(r.watch[0] === 'watch' && r.watch[1] >= 14 && r.watch[2] && r.watch[3] === 3 && r.still[0] === 'watch' && r.still[1] === 3 && r.stoop === 'stoop', 'the hunter gave no warning: ' + JSON.stringify(r));
  check(r.lost[0] === 'leave' && r.lost[1] && r.lost[2] === 3, 'hiding low did not lose it: ' + JSON.stringify(r.lost));
  check(r.caught[0] === 2 && r.caught[1] === 0 && r.caught[2] === 0, 'caught: ' + r.caught);
  check(r.wind[0] === 1 && r.wind[1] && r.calm === 0 && r.before === null, 'the sea breeze: ' + JSON.stringify([r.wind, r.calm, r.before]));
  // pops are drawn over the 3D picture, and leaving frees the scene
  check(await p.evaluate(() => { Game.pop(W / 2, 200, 'Yum!', '#ffd23f'); Game.draw(); const c = document.getElementById('game').getContext('2d'), d = c.getImageData(0, 0, c.canvas.width, c.canvas.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) return true; return false; }), 'nothing drawn over the 3D view');
  await p.evaluate(() => { Game.stop(); buildMap(); });
  check(p.errors.length === 0, p.errors.join('; '));
});

test('Up the Thames: the river in its real order, a tailwind high up, four sips then three eggs on thistles, bridges and walls are solid, I-spy from the air', async (b) => {
  const p = await openGame(b);
  const facts = fs.readFileSync(path.join(ROOT, 'docs', 'facts.md'), 'utf8');
  // the layout: no 3D needed to check it
  const lay = await p.evaluate(() => {
    const R = THAMES, side = (k) => { const n = R.near(R.marks[k].x, R.marks[k].z); return [Math.round(n.s), Math.sign(n.lat)]; };
    return { bridges: R.bridges.map(b => b.key), ordered: R.bridges.every((b, i) => !i || b.q.s > R.bridges[i - 1].q.s), marks: Object.fromEntries(['shard', 'gherkin', 'stpauls', 'tate', 'eye', 'bigben', 'palace', 'power'].map(k => [k, side(k)])),
      end: Math.round(R.END), stops: R.stops.map(f => [f.kind, Math.round(f.s), Math.sign(R.near(f.x, f.z).lat)]), heading: [R.at(1.5).tx < -0.9, R.at(7.5).tz > 0.9, R.at(12.5).tx < -0.9],
      bug: (() => { const bg = Bugs.find(x => x.id === 'l_lady'); return [bg.hub, bg.stages.join(), bg.sci, !!bg.pin, LDN_TOUR[LDN_TOUR.length - 1], /painted lady/.test(LDN_STOP.ldn_thames)]; })(),
      inWater: R.stops.concat(R.blocks).filter(f => Math.abs(R.near(f.x, f.z).lat) < R.HALF).length, blocks: R.blocks.length,
      parkClear: R.blocks.filter(q => q.sd < 0 && q.row < 4 && q.u > 12.2 && q.u < 13.8).length };
  });
  check(lay.bridges.join() === 'tower,london,cannon,southwark,millennium,blackRail,blackfriars,waterloo,hungerford,westminster,lambeth,vauxhall,grosvenor,chelsea,albert' && lay.ordered, 'the bridges are out of order: ' + lay.bridges);
  const M = lay.marks;   // which bank (flying upriver: +1 on your right, the north and then the Westminster side) and how far up
  check(M.shard[1] === -1 && M.gherkin[1] === 1 && M.stpauls[1] === 1 && M.tate[1] === -1 && M.eye[1] === -1 && M.bigben[1] === 1 && M.palace[1] === 1 && M.power[1] === -1, 'a landmark is on the wrong bank: ' + JSON.stringify(M));
  check(M.gherkin[0] < M.shard[0] + 60 && M.shard[0] < M.stpauls[0] && Math.abs(M.stpauls[0] - M.tate[0]) < 20 && M.tate[0] < M.eye[0] && M.eye[0] < M.bigben[0] && M.bigben[0] < M.palace[0] && M.palace[0] < M.power[0] && M.power[0] < lay.end, 'a landmark is out of order: ' + JSON.stringify(M));
  check(lay.heading.every(Boolean), 'the river does not run west, then south, then west: ' + lay.heading);
  check(lay.stops.filter(f => f[0] !== 'thistle').length >= 5 && lay.stops.filter(f => f[0] === 'thistle').length === 3 && lay.stops.filter(f => f[0] === 'thistle').every(f => f[2] === -1 && f[1] > M.power[0]), 'the stops: ' + JSON.stringify(lay.stops));
  check(lay.inWater === 0 && lay.blocks > 500 && lay.parkClear === 0, 'buildings in the river or the park: ' + JSON.stringify([lay.inWater, lay.blocks, lay.parkClear]));
  check(lay.bug.join() === 'london,ldn_thames,Vanessa cardui,true,ldn_thames,true', 'her place in London: ' + lay.bug);
  for (const name of ['Tower Bridge', 'London Bridge', 'Cannon Street', 'Southwark Bridge', 'Millennium Bridge', 'Blackfriars', 'Waterloo Bridge', 'Hungerford', 'Westminster Bridge', 'Lambeth Bridge', 'Vauxhall Bridge', 'Grosvenor', 'Chelsea Bridge', 'Albert Bridge', 'Battersea Power Station', 'Tate Modern', 'Gherkin', 'Battersea Park']) check(facts.includes(name), name + ' is not in docs/facts.md');
  // play
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_thames', { noNet: true });
  await p.waitForFunction(() => Game.g.fl3d || Game.g.noGL, null, { timeout: 30000 });
  check(await p.evaluate(() => !!Game.g.fl3d), 'no 3D scene');
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const g = Game.g, m = g.mission, fl = g.fl, R = THAMES, out = {}, btn = () => document.getElementById('actionBtn').textContent;
    const put = (u, off, y, yaw) => { const q = R.side(u, off || 0); fl.x = q.x; fl.z = q.z; fl.y = y; fl.vy = 0; fl.yaw = yaw === undefined ? q.yaw : yaw; fl.sp = m.cruise; fl.landed = null; };
    g.timers = [];
    out.start = [Math.round(fl.s), fl.y > 2, btn(), g.mission.gentle, Math.round(R.near(fl.x, fl.z).lat)];
    lstep(0.1, { press: true }); lstep(0.8); out.spied = [g.spied.has('tower'), shown.includes('Spotted: Tower Bridge'), document.getElementById('hudFind').textContent];
    // the tailwind: only up high, and along the river wherever it bends
    put(1.4, 0, 30); const a1 = m.air(g, fl), q1 = R.at(1.4); put(7.5, 0, 30); const a2 = m.air(g, fl), q2 = R.at(7.5); put(7.5, 0, 10); out.low = m.air(g, fl).k;
    out.wind = [a1.k, (a1.x * q1.tx + a1.z * q1.tz) / Math.hypot(a1.x, a1.z), (a2.x * q2.tx + a2.z * q2.tz) / Math.hypot(a2.x, a2.z), Math.hypot(a1.x, a1.z)];
    const leg = (y) => { put(8.2, 0, y); const s0 = R.near(fl.x, fl.z).s; for (let i = 0; i < 120; i++) { fl.y = y; fl.vy = 0; m.move(g, 1 / 60, 0, 0); } return R.near(fl.x, fl.z).s - s0; };
    out.legs = [leg(30), leg(10)];
    // a bridge is solid: over the top or under the arches, never through the road
    const cross = (y) => { put(1.75, 0, y); let lo = 99, hi = -99, through = false; const bq = R.bridges[1]; for (let i = 0; i < 400; i++) { m.move(g, 1 / 60, 0, 0); fl.vy = 0; const n = R.near(fl.x, fl.z); if (Math.abs(n.s - bq.q.s) < bq.depth / 2 - 0.2) { lo = Math.min(lo, fl.y); hi = Math.max(hi, fl.y); if (fl.y > bq.top - 1.2 && fl.y < bq.top + 0.9) through = true; } } return [Math.round(lo * 10) / 10, Math.round(hi * 10) / 10, through, R.near(fl.x, fl.z).s > bq.q.s]; };
    out.under = cross(2); out.over = cross(9); out.deck = cross(4.3);
    // a tall building turns her; a roof she can settle on; the banks are the edge
    const sh = R.marks.shard; fl.x = sh.x + 14; fl.z = sh.z; fl.y = 12; fl.yaw = -Math.PI / 2; fl.vy = 0; for (let i = 0; i < 200; i++) { m.move(g, 1 / 60, 0, 0); fl.vy = 0; fl.y = 12; } out.wall = Math.hypot(fl.x - sh.x, fl.z - sh.z) > 4.4;
    const blk = R.blocks.find(q => q.row === 1 && q.u > 2); fl.y = 30; fl.vy = -3; for (let i = 0; i < 900; i++) { fl.x = blk.x; fl.z = blk.z; m.move(g, 1 / 60, 0, 1); } out.roof = [Math.round((fl.y - (R.BANK + blk.h)) * 10) / 10, Math.round(fl.floor - (R.BANK + blk.h))];
    put(5, 200, 20); m.move(g, 1 / 60, 0, 0); out.edge = Math.abs(R.near(fl.x, fl.z).lat) < 80;
    // the lost balloon, out over the water
    const bl = R.marks.balloon; fl.x = bl.x; fl.z = bl.z; fl.y = 15; fl.vy = 0; lstep(0.05); out.balloon = [Progress.hasSecret('s_balloon'), g.secret.found];
    // stops: flowers first (any four), thistles only once she has fed
    const fw = fl.flowers.filter(f => f.kind !== 'thistle'), th = fl.flowers.filter(f => f.kind === 'thistle');
    out.can = [m.can(g, fw[0]), m.can(g, th[0]), m.verb(g, fw[0]), m.verb(g, th[0])];
    put(1, 0, 8); fl.s = R.near(fl.x, fl.z).s; out.next = m.target(g) === fw[0];
    shown.length = 0;
    for (let i = 0; i < 4; i++) { const f = fw[i]; fl.x = f.x; fl.z = f.z; fl.y = f.y + 5; fl.vy = 0; lstep(0.1); if (i === 0) out.landed = [fl.landed === f, btn()]; lstep(1.4, { held: true }); }
    out.sips = [g.score, shown.filter(t => t === 'Yum!').length, shown.some(t => /Battersea Park/.test(t)), m.can(g, fw[4]), m.can(g, th[0]), m.target(g) && m.target(g).kind];
    for (let i = 0; i < 3; i++) { const f = th[i]; fl.x = f.x; fl.z = f.z; fl.y = f.y + 5; fl.vy = 0; lstep(0.1); if (i === 0) out.lay = [fl.landed === f, btn()]; lstep(1.6, { held: true }); }
    out.eggs = [g.score, shown.filter(t => t === 'An egg!').length, m.won(g), g.seen.has('lay'), g.lives];
    out.words = m.how.concat(m.facts, Object.values(m.factText)).filter(t => /gull|swat|caught/i.test(t)).length;
    return out;
  });
  check(r.start[0] < -20 && r.start[1] && r.start[2] === 'Flap' && r.start[3] && Math.abs(r.start[4]) < 15, 'the start: ' + r.start);
  check(r.spied[0] && r.spied[1] && /\u{1F440} [1-4] \/ 4/u.test(r.spied[2]), 'Tower Bridge was not spotted from the air: ' + r.spied);
  check(r.wind[0] === 1 && r.wind[1] > 0.99 && r.wind[2] > 0.99 && r.wind[3] > 6 && r.low === 0 && r.legs[0] > r.legs[1] + 10, 'the tailwind: ' + JSON.stringify([r.wind, r.low, r.legs]));
  check(r.under[1] < 3.7 && r.under[3] && !r.under[2] && r.over[0] > 5 && r.over[3] && !r.deck[2] && r.deck[3], 'a bridge is not solid: ' + JSON.stringify([r.under, r.over, r.deck]));
  check(r.wall && Math.abs(r.roof[0] - 1) < 0.2 && r.roof[1] === 0 && r.edge, 'walls, roofs and the edge: ' + JSON.stringify([r.wall, r.roof, r.edge]));
  check(r.can.join() === 'true,false,Sip,Lay' && r.next && r.landed[0] && r.landed[1] === 'Sip', 'the first stops: ' + JSON.stringify([r.can, r.next, r.landed]));
  check(r.sips[0] === 4 && r.sips[1] === 4 && r.sips[2] && !r.sips[3] && r.sips[4] && r.sips[5] === 'thistle', 'four sips: ' + r.sips);
  check(r.lay[0] && r.lay[1] === 'Lay' && r.eggs[0] === 7 && r.eggs[1] === 3 && r.eggs[2] && r.eggs[3] && r.eggs[4] === 3, 'three eggs on the thistles: ' + JSON.stringify([r.lay, r.eggs]));
  check(r.balloon[0] && r.balloon[1] && r.words === 0, 'the balloon, the words: ' + JSON.stringify([r.balloon, r.words]));
  // the British painted lady: dark eyespots, where the Australian one's have blue centres
  const blue = await p.evaluate(() => {
    const count = (name) => { const c = document.createElement('canvas'); c.width = c.height = 240; const x = c.getContext('2d'); x.translate(120, 120); x.scale(5, 5); Sprites[name](x, { landed: false }, Math.PI / 36); const d = x.getImageData(0, 0, 240, 240).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 180 && d[i] < 110 && d[i + 3] > 200) n++; return n; };
    return [count('butterfly'), count('paintedLady'), Models.has('paintedLady'), typeof SIZES.paintedLady.mm];
  });
  check(blue[0] > 20 && blue[1] === 0 && blue[2] && blue[3] === 'number', 'the eyespots: ' + blue);
  // where the 3D flight can't run she flies off on her own
  await p.evaluate(() => { Game.stop(); buildMap(); Flight3D.supported = () => false; });
  await startMission(p, 'ldn_thames', { noNet: true });
  await p.waitForSelector('#end.active', { timeout: 10000 });
  check(p.errors.length === 0, p.errors.join('; '));
});

test('the stag beetle wrestle: both stages open, breath, his two cues and their windows, a throw, a fall and the round again, stars by falls', async (b) => {
  const p = await openGame(b);
  const open = await p.evaluate(() => { const bug = Bugs.find(x => x.id === 'l_stag'); return [bug.stages.join(), Progress.unlocked(bug, 0), Progress.unlocked(bug, 1), Missions.ldn_wrestle.bug, LDN_TOUR.includes('ldn_wrestle'), LDN_TOUR.includes('ldn_stag')]; });
  check(open.join() === 'ldn_stag,ldn_wrestle,true,true,l_stag,false,true', 'the Stag Beetle’s two stages: ' + open);
  await p.evaluate(() => { currentHub = 'london'; openBug(Bugs.find(x => x.id === 'l_stag')); });
  check(await p.evaluate(() => document.querySelectorAll('#stages button').length === 2 && [...document.querySelectorAll('#stages button')].every(q => !q.disabled)), 'two stage buttons, both open');
  await p.evaluate(LDN_SHOWN);
  await startMission(p, 'ldn_wrestle', { noNet: true });
  check(await p.evaluate(() => [...document.querySelectorAll('#stageHow li')].some(li => /climb back on/.test(li.textContent))), 'the page does not say it can’t be lost');
  await p.evaluate(LDN_STEP);
  const r = await p.evaluate(() => {
    const g = Game.g, m = g.mission, w = g.wr, K = WRESTLE, out = {}, btn = () => document.getElementById('actionBtn').textContent;
    const fresh = (pos) => { m.go(g, 'push'); w.pos = pos || 0; w.breath = 1; w.puffed = false; w.cueIn = 99; w.lift = 0; shown.length = 0; };
    g.timers = [];
    out.ready = [w.state, btn()]; lstep(1.9); out.go = [w.state, btn()];
    // Push: holding shoves him and spends breath; letting go gets it back while he shoves you
    fresh(); lstep(1, { held: true }); out.push = [w.pos > 30, w.breath < 0.65];
    const p1 = w.pos; lstep(1); out.rest = [w.pos < p1, w.breath > 0.99];
    fresh(); lstep(3, { held: true }); const p2 = w.pos; lstep(0.5, { held: true }); out.puffed = [w.puffed, w.pos < p2, shown.includes('Puff… puff…')];
    fresh(); for (let i = 0; i < 6; i++) lstep(0.05, { press: true }); out.taps = w.breath < 0.7;
    // he rears: Get under!, then hold Lift! and over he goes
    fresh(40); w.cueN = 5; w.cueIn = 0; Math.random = () => 0.1; lstep(0.2); out.rear = [w.cue, btn()];
    lstep(0.05, { press: true }); out.under = [w.state, btn()];
    lstep(0.5, { held: true }); const l1 = w.lift; lstep(0.3); out.slip = [l1 > 0.4, w.lift < l1, w.state];
    lstep(1.2, { held: true }); out.thrown = [w.state, w.beaten, shown.includes('Thrown off!'), g.seen.has('throw')];
    lstep(2.5); out.round2 = [w.round, w.state, g.score];
    // too late, and he slams you back; with no breath you can't answer at all
    fresh(0); w.cueN = 5; w.cueIn = 0; lstep(0.1); lstep(m.window(g) + 0.1); lstep(0.05, { press: true }); lstep(0.4); out.late = [w.state, w.pos < -40, shown.includes('Wham!')];
    fresh(0); w.cueN = 5; w.cueIn = 0; lstep(0.1); w.breath = 0.02; lstep(0.05, { press: true }); out.noAir = [w.state, w.cue];
    // he dips: Hold tight! or be carried back
    Math.random = () => 0.9;
    fresh(0); w.cueN = 5; w.cueIn = 0; lstep(0.2); out.dip = [w.cue, btn()]; lstep(0.05, { press: true }); out.held = [w.cue, w.pos > 25, shown.includes('Held on!')];
    fresh(0); w.cueN = 5; w.cueIn = 0; lstep(0.1); lstep(m.window(g) + 0.1); out.carried = w.state; lstep(1); out.back = [w.state, Math.round(w.pos) < -80, g.wr.falls];
    // the first two cues of the level get a longer look
    w.cueN = 1; const wide = m.window(g); w.cueN = 5; out.window = [wide > m.window(g), m.window(g)];
    // off your end: a fall, back on, the same round, and he is a little more tired
    fresh(-240); w.cueN = 5; w.cueIn = 0; lstep(0.1); lstep(m.window(g) + 0.1); lstep(1); out.fall = [w.state, w.falls, w.round, w.ease > 0, shown.includes('Off the log!')];
    lstep(2.1); out.again = [w.state, w.round, w.pos, g.lives];
    // shoving him off his end wins the round too
    fresh(246); lstep(0.4, { held: true }); out.off = [w.state, w.beaten, shown.includes('He backs off!')];
    lstep(2.5); out.round3 = [w.round, w.state];
    // four falls to one rival and he gives up on you
    for (let i = 0; i < 4; i++) { fresh(-249.9); lstep(0.3); lstep(2.2); }
    out.gaveUp = [w.falls, w.over, w.won]; out.stars = [m.stars(g), m.stars({ wr: { falls: 0 } }), m.stars({ wr: { falls: 2 } }), m.stars({ wr: { falls: 3 } })];
    out.words = m.how.concat(m.facts, Object.values(m.factText)).filter(t => /bit(e|ten|ing)|hurt|kill|weak/i.test(t)).length;
    return out;
  });
  check(r.ready.join() === 'ready,Push' && r.go.join() === 'push,Push', 'the start: ' + JSON.stringify([r.ready, r.go]));
  check(r.push.every(Boolean) && r.rest.every(Boolean) && r.puffed.every(Boolean) && r.taps, 'breath: ' + JSON.stringify([r.push, r.rest, r.puffed, r.taps]));
  check(r.rear.join() === 'rear,Get under!' && r.under.join() === 'lift,Lift!' && r.slip[0] && r.slip[1] && r.slip[2] === 'lift', 'getting under him: ' + JSON.stringify([r.rear, r.under, r.slip]));
  check(r.thrown[0] === 'thrown' && r.thrown[1] === 1 && r.thrown[2] && r.thrown[3] && r.round2.join() === '1,ready,1', 'the throw: ' + JSON.stringify([r.thrown, r.round2]));
  check(r.late[0] === 'push' && r.late[1] && r.late[2] && r.noAir[0] === 'push' && r.noAir[1] === 'rear', 'a late press or no breath still worked: ' + JSON.stringify([r.late, r.noAir]));
  check(r.dip.join() === 'dip,Hold tight!' && r.held[0] === null && r.held[1] && r.held[2] && r.carried === 'carried' && r.back[0] === 'push' && r.back[1] && r.back[2] === 0, 'his dip: ' + JSON.stringify([r.dip, r.held, r.carried, r.back]));
  check(r.window[0] && r.window[1] >= 0.6, 'the windows: ' + r.window);
  check(r.fall.join() === 'fall,1,1,true,true' && r.again[0] === 'ready' && r.again[1] === 1 && r.again[2] === 0 && r.again[3] === 3, 'the fall: ' + JSON.stringify([r.fall, r.again]));
  check(r.off[0] === 'off' && r.off[1] === 2 && r.off[2] && r.round3.join() === '2,ready', 'shoved off his end: ' + JSON.stringify([r.off, r.round3]));
  check(r.gaveUp.join() === '5,true,true' && r.stars.join() === '1,3,2,1' && r.words === 0, 'four falls, the stars, the words: ' + JSON.stringify([r.gaveUp, r.stars, r.words]));
  await p.waitForFunction(() => { Game.running = true; return true; });
  await p.waitForSelector('#end.active', { timeout: 15000 });
  const end = await p.evaluate(() => [Progress.stars('ldn_wrestle'), document.getElementById('endUnlock').textContent, document.getElementById('endExplore').offsetParent === null]);
  check(end[0] === 1 && /Falls: 5/.test(end[1]) && end[2], 'the end screen: ' + JSON.stringify(end));
  // drawn big enough to see: the two beetles fill a good part of the log
  check(await p.evaluate(() => WRESTLE.S >= 3 && WRESTLE.END * 2 <= 960 - 100), 'the log does not fit a narrow screen');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('London has its own map: hidden until the plane is found, a pin for every level, Back stays in London, the plane flies both ways', async (b) => {
  const p = await openGame(b, { width: 844, height: 390 });
  const before = await p.evaluate(() => { const ldn = Bugs.filter(x => x.hub === 'london').map(x => x.sprite); return { pins: document.querySelectorAll('.pin').length, perth: Bugs.filter(x => x.pin && !x.hub).length, london: ldn.length, parade: paradeMarchers().some(m => ldn.includes(m.sprite)), tour: document.getElementById('tourBtn').hidden && document.getElementById('flyHome').hidden }; });
  check(before.pins === before.perth && before.london >= 5 && !before.parade && before.tour, 'London shows before the plane is found: ' + JSON.stringify(before));
  // the plane: a finger-sized button that no pin covers (here at Perth Airport, later at Heathrow)
  const planeBox = () => p.evaluate(() => {
    const r = document.getElementById('plane').getBoundingClientRect(), map = document.getElementById('mapWrap').getBoundingClientRect();
    const hit = [...document.querySelectorAll('.pin')].filter(el => { const q = el.getBoundingClientRect(); return q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top; }).length;
    const out = [...document.querySelectorAll('.pin')].filter(el => { const q = el.getBoundingClientRect(); return q.left < map.left - 1 || q.right > map.right + 1 || q.top < map.top - 1 || q.bottom > map.bottom + 1; }).length;
    return { w: r.width, h: r.height, hit, out, x: (r.left + r.width / 2 - map.left) / map.width };
  });
  let box = await planeBox();
  check(box.w >= 44 && box.h >= 44 && box.hit === 0 && box.x > 0.7, 'the plane button at Perth Airport: ' + JSON.stringify(box));
  await p.click('#bookBtn');
  check(!(await p.locator('.bookBug', { hasText: 'Stag Beetle' }).count()), 'the Book shows London before the plane is found');
  await p.click('#bookBack');
  await p.click('#plane');
  check(await p.isVisible('#secretGo') && /London/.test(await p.textContent('#secretPop p')) && /Fly to London/.test(await p.textContent('#secretGo')), 'no Fly to London on the plane');
  check(await p.evaluate(() => Progress.hasSecret('s_london')), 'the plane secret was not saved');
  await p.click('#secretGo');
  await p.waitForFunction(() => currentHub === 'london' && document.getElementById('map').classList.contains('active'), null, { timeout: 6000 });
  const map = await p.evaluate(() => ({ pins: document.querySelectorAll('.pin').length, sub: document.getElementById('mapSub').textContent, tour: !document.getElementById('tourBtn').hidden && !document.getElementById('flyHome').hidden,
    rottnest: getComputedStyle(document.getElementById('rottnest')).display, pop: document.getElementById('secretPop').hidden }));
  check(map.pins === before.london && /London/.test(map.sub) && map.tour && map.rottnest === 'none' && map.pop, 'the London map: ' + JSON.stringify(map));
  box = await planeBox();
  check(box.w >= 44 && box.h >= 44 && box.hit === 0 && box.out === 0 && box.x < 0.2, 'the plane at Heathrow, and the pins on the map: ' + JSON.stringify(box));
  // a level from its pin: its own page and end screen, and every way back lands on the London map
  await p.evaluate(() => [...document.querySelectorAll('.pin')].find(el => /Stag Beetle/.test(el.getAttribute('aria-label'))).click());
  check(await p.isVisible('#bug.active') && /Richmond Park/.test(await p.textContent('#bug')), 'the stag beetle page did not open from its pin');
  await p.click('#bugBack');
  check(await p.evaluate(() => currentHub === 'london' && document.querySelectorAll('.pin').length) === before.london, 'Back left London');
  await p.evaluate(() => [...document.querySelectorAll('.pin')].find(el => /Stag Beetle/.test(el.getAttribute('aria-label'))).click());
  await p.click('#bugStart');
  await p.waitForTimeout(300);
  check(await p.evaluate(() => Game.g.mission.id === 'ldn_stag' && !Run.on), 'a pin started a tour');
  await p.keyboard.press('Escape');
  check(await p.evaluate(() => !Game.running && currentHub === 'london' && document.getElementById('map').classList.contains('active')), 'Escape left London');
  await p.evaluate(() => { openBug(Bugs.find(x => x.id === 'l_stag')); startGame(); });
  await forceWin(p);
  check(/Stag Beetle/.test(await p.textContent('#endTitle')), 'a level from its pin did not end with its own end screen');
  await p.click('#endMap');
  check(await p.evaluate(() => currentHub === 'london' && document.querySelectorAll('.pin').length) === before.london, 'the end screen’s Map left London');
  await p.click('#bookBtn');
  check(await p.locator('.bookBug', { hasText: 'Stag Beetle' }).count() === 1, 'the Book has no London once the plane is found');
  await p.click('#bookBack');
  check(await p.evaluate(() => currentHub === 'london' && paradeMarchers().some(m => m.sprite === 'stagBeetle')), 'the Book’s Map left London, or London is not in the parade');
  // home again, and now the plane flies straight there
  await p.click('#flyHome');
  await p.waitForFunction(() => currentHub === null && document.querySelectorAll('.pin').length > 10, null, { timeout: 6000 });
  check(await p.evaluate(() => document.getElementById('tourBtn').hidden && getComputedStyle(document.getElementById('rottnest')).display !== 'none'), 'the Perth map kept London’s buttons');
  await p.click('#plane');
  check(await p.evaluate(() => document.getElementById('secretPop').hidden), 'the plane asked again');
  await p.waitForFunction(() => currentHub === 'london', null, { timeout: 6000 });
  await p.click('#plane');   // at Heathrow: home
  await p.waitForFunction(() => currentHub === null, null, { timeout: 6000 });
  check(p.errors.length === 0, p.errors.join('; '));
});

test('the bus tour: the bus drives round the London map, takes you from stop to stop through every level, and adds it all up', async (b) => {
  const p = await openGame(b);
  await p.evaluate(() => { Progress.addSecret('s_london'); currentHub = 'london'; buildMap(); });
  await p.waitForTimeout(400);
  // the bus is on the map, and moving
  const bus = () => p.evaluate(() => { const c = document.getElementById('mapFx'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0, sx = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 180 && d[i + 1] < 90 && d[i + 3] > 200) { n++; sx += (i / 4) % c.width; } return { hidden: c.hidden, n, x: n ? sx / n : 0 }; });
  const b1 = await bus(); await p.waitForTimeout(700); const b2 = await bus();
  check(!b1.hidden && b1.n > 30 && Math.abs(b2.x - b1.x) > 1, 'no red bus driving on the London map: ' + JSON.stringify([b1, b2]));
  const tour = await p.evaluate(() => LDN_TOUR);
  check(tour.length >= 5 && tour.length === await p.evaluate(() => Bugs.filter(x => x.hub === 'london').length), 'the tour misses a level: ' + tour);
  await p.click('#tourBtn');
  let stars = 0;
  for (let i = 0; i < tour.length; i++) {
    await p.waitForSelector('#secretGo', { state: 'visible', timeout: 12000 });
    const card = await p.evaluate(() => ({ text: document.querySelector('#secretPop p').textContent, map: document.getElementById('map').classList.contains('active'), end: document.getElementById('end').classList.contains('active'), go: document.getElementById('secretGo').textContent }));
    check((i === 0 ? /^First stop/ : i === tour.length - 1 ? /^Last stop/ : /^Next stop/).test(card.text) && card.map && !card.end && card.go === 'Go!', 'the card at stop ' + i + ': ' + JSON.stringify(card));
    await p.click('#secretGo');
    await p.waitForFunction((id) => Game.running && Game.g.mission.id === id, tour[i], { timeout: 5000 });
    check(await p.evaluate(() => Game.g.lives === 3 && Run.on && currentBug.stages[0] === Game.g.mission.id), 'stop ' + tour[i] + ' did not start fresh');
    await p.evaluate(() => { Game.g.homeSafe = true; });
    await p.waitForFunction(() => !Game.running, null, { timeout: 8000 });
    stars += await p.evaluate((id) => Progress.stars(id), tour[i]);
  }
  await p.waitForSelector('#end.active', { timeout: 8000 });
  const end = await p.evaluate(() => ({ title: document.getElementById('endTitle').textContent, line: document.getElementById('endUnlock').textContent, on: Run.on }));
  check(/toured London/.test(end.title) && end.line.includes(stars + ' / ' + tour.length * 3) && /Every stop/.test(end.line) && !end.on && stars >= tour.length, 'the end of the tour: ' + JSON.stringify(end) + ' stars ' + stars);
  // closing the bus's card stops the tour
  await p.click('#endMap');
  await p.click('#tourBtn');
  await p.waitForSelector('#secretGo', { state: 'visible', timeout: 12000 });
  check(/Stop the tour/.test(await p.textContent('#secretClose')), 'no way to stop the tour');
  await p.click('#secretClose');
  check(await p.evaluate(() => !Run.on && document.getElementById('secretPop').hidden), 'the tour went on after Stop');
  check(p.errors.length === 0, p.errors.join('; '));
});

test('every script the page loads is cached for offline play', async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const missing = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !sw.includes("'" + s.replace(/^\.\//, '') + "'") && !sw.includes("'./" + s.replace(/^\.\//, '') + "'"));
  check(missing.length === 0, 'not in sw.js FILES: ' + missing.join(', '));
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
