'use strict';
// Draw-time check: ms per frame for every mission, normal and with the CPU throttled 4x (a phone stand-in),
// plus how long each level takes to start (mostly painting the background).
// Usage: node tests/perf.js [missions,comma,separated]   -> prints a table, writes tests/output/perf.json,
// exits 1 if the throttled p95 frame time is over 8 ms or a level takes over 1200 ms to start.

const fs = require('fs');
const path = require('path');
const { launch, openGame, startMission, MISSIONS } = require('./helpers');
const BOT = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');

const FRAME_BUDGET = 8, START_BUDGET = 1200;

async function measure(p, id, frames) {
  await p.addScriptTag({ content: BOT });
  const start = await p.evaluate((id) => {
    const bug = Bugs.find((b) => b.stages.includes(id));
    openBug(bug, id);
    const t0 = performance.now();
    startGame();
    Game.g.netT = 1e9;
    return performance.now() - t0;
  }, id);
  if (id === 'flight') await p.waitForFunction(() => Game.g.fl3d || Game.g.noGL, null, { timeout: 15000 });
  // A bot plays so the screen is busy, like a real game; the bot's own cost is excluded by timing draw() alone.
  await p.evaluate(() => { Bot.install('perfect'); Game.timeScale = 1; });
  await p.waitForTimeout(400);
  const times = await p.evaluate(async (frames) => {
    const out = [];
    const draw = Game.draw.bind(Game), upd = Game.update.bind(Game);
    let acc = 0;
    Game.update = (dt) => { const t0 = performance.now(); upd(dt); acc += performance.now() - t0; };
    Game.draw = () => { const t0 = performance.now(); draw(); out.push(performance.now() - t0 + acc); acc = 0; };
    await new Promise((res) => { const check = () => (out.length >= frames ? res() : requestAnimationFrame(check)); check(); });
    Game.draw = draw; Game.update = upd;
    return out;
  }, frames);
  times.sort((a, b) => a - b);
  const q = (k) => times[Math.min(times.length - 1, Math.floor(times.length * k))];
  return { start: Math.round(start), p50: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2) };
}

(async () => {
  const ids = process.argv[2] ? process.argv[2].split(',') : MISSIONS;
  const b = await launch();
  const rows = [];
  let bad = false;
  for (const id of ids) {
    const p = await openGame(b);
    const normal = await measure(p, id, 240);
    await p.context().close();
    const p2 = await openGame(b);
    const cdp = await p2.context().newCDPSession(p2);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const slow = await measure(p2, id, 160);
    await p2.context().close();
    const row = { id, start: normal.start, p50: normal.p50, p95: normal.p95, slowStart: slow.start, slowP50: slow.p50, slowP95: slow.p95 };
    row.ok = slow.p95 <= FRAME_BUDGET && slow.start <= START_BUDGET;
    if (!row.ok) bad = true;
    rows.push(row);
    console.log(id.padEnd(12), 'start', String(row.start).padStart(4), 'ms  frame p50', row.p50.toFixed(2).padStart(5), 'p95', row.p95.toFixed(2).padStart(5),
      ' | throttled x4: start', String(row.slowStart).padStart(4), 'p50', row.slowP50.toFixed(2).padStart(5), 'p95', row.slowP95.toFixed(2).padStart(5), row.ok ? '' : '  OVER BUDGET');
  }
  await b.close();
  fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'output', 'perf.json'), JSON.stringify(rows, null, 2));
  console.log(bad ? 'Some levels are over budget.' : 'All within budget (throttled p95 <= ' + FRAME_BUDGET + ' ms, start <= ' + START_BUDGET + ' ms).');
  process.exit(bad ? 1 : 0);
})();
