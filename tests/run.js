'use strict';
// Bugame test suite. Usage: node tests/run.js [--quick]   (--quick skips the full mission playthroughs)

const fs = require('fs');
const path = require('path');
const { launch, launchMedia, openGame, startMission, forceWin, serve, ROOT, MISSIONS, FILE_URL } = require('./helpers');

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
  await p.evaluate(() => { const g = Game.g, c = g.items.find(i => i.kind === 'cow'), b = g.mission.back(c); g.player.x = b.x; g.player.y = b.y; });
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
    return { ant: a && count(a.c), threeD: !!(a && a.threeD), different: a && b2 && a.c.toDataURL() !== b2.c.toDataURL(), bee: bee && count(bee.c), left, right, seam: { along, across }, stats: Render3D.stats };
  });
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
  await p.evaluate(() => { Game.g.raining = 0; Game.timeScale = 1; });
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
  await p.waitForFunction(() => Game.g.event && Game.g.event.phase === 'tank', null, { timeout: 5000 });
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
      if (m.noNet && 'tank' in m.factText) out.push(id + ' lists the tank fact but has no net');
      if (!m.noNet && !m.factText.tank) out.push(id + ' has a net but no tank fact');
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
  check(await p.evaluate(() => paradeMarchers().length === Bugs.length + 3 && paradeMarchers().slice(-3).every(m => m.paint)), 'the parade did not gain the painted bugs');
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
  await p.goto(FILE_URL);
  await p.click('#paintBtn'); await p.waitForTimeout(200);
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const box = await p.locator('#paintCanvas').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const a = (dx, dy) => ({ x: cx + dx, y: cy + dy, id: 1 }), s = (dx, dy) => ({ x: cx + dx, y: cy + dy, id: 2 });
  await touch('touchStart', [a(-40, 0)]);
  await touch('touchStart', [a(-40, 0), s(40, 0)]);
  for (let k = 1; k <= 6; k++) await touch('touchMove', [a(-40 - k * 15, 0), s(40 + k * 15, 0)]);   // fingers spread: zoom in about the middle
  const z1 = await p.evaluate(() => ({ z: PaintUI.view.z, px: Math.round(PaintUI.view.px), dirty: PaintUI.dirty }));
  check(z1.z > 2 && z1.z <= 4 && z1.px === 0 && !z1.dirty, 'the pinch did not zoom cleanly: ' + JSON.stringify(z1));
  for (let k = 1; k <= 5; k++) await touch('touchMove', [a(-130 + k * 20, k * 10), s(130 + k * 20, k * 10)]);   // both fingers move: drag
  const z2 = await p.evaluate(() => ({ z: PaintUI.view.z, px: Math.round(PaintUI.view.px), py: Math.round(PaintUI.view.py) }));
  check(Math.abs(z2.z - z1.z) < 0.01 && z2.px === 100 && z2.py === 50, 'the two-finger drag did not move the picture: ' + JSON.stringify(z2));
  await touch('touchEnd', [s(230, 50)]); await touch('touchEnd', []);
  check(await p.evaluate(() => PaintUI.pointers.size === 0 && !PaintUI.pinch && !PaintUI.dirty), 'the pinch left a stroke or a finger behind');
  await touch('touchStart', [a(0, 0)]); await touch('touchMove', [a(30, 0)]); await touch('touchEnd', []);
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
