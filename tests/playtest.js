'use strict';
// Playtest every mission with the in-page bot and report pacing and difficulty.
// Usage: node tests/playtest.js [kid|perfect] [runs] [mission,mission,...]

const fs = require('fs');
const path = require('path');
const { launch, openGame, startMission, MISSIONS } = require('./helpers');

const skill = process.argv[2] || 'kid';
const RUNS = +(process.argv[3] || 5);
const only = process.argv[4] ? process.argv[4].split(',') : MISSIONS;
const SPEED = 6;          // game ticks per frame
const LIMIT = 300;        // give up after this many game seconds
const PARALLEL = 4;
const BOT = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');

async function playOnce(browser, id) {
  const page = await openGame(browser);
  await page.addScriptTag({ content: BOT });
  await startMission(page, id, {});
  await page.evaluate(([skill, speed]) => { Bot.install(skill); Game.timeScale = speed; }, [skill, SPEED]);
  await page.waitForFunction((limit) => Game.g.done || Game.g.t > limit, LIMIT, { timeout: (LIMIT / SPEED) * 1000 * 3 + 30000, polling: 500 });
  const r = await page.evaluate(() => Bot.report());
  r.errors = page.errors.length;
  await page.context().close();
  return r;
}

function median(a) { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; }

(async () => {
  const browser = await launch();
  const jobs = [];
  for (const id of only) for (let i = 0; i < RUNS; i++) jobs.push(id);
  const results = {};
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const id = jobs[next++];
      try { (results[id] = results[id] || []).push(await playOnce(browser, id)); }
      catch (e) { (results[id] = results[id] || []).push({ won: false, error: e.message.split('\n')[0] }); }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  await browser.close();

  console.log(`\nPlaytest (${skill} bot, ${RUNS} runs each, times in game seconds)\n`);
  console.log('mission      won  time(med)  livesLost  caught  rewardEvery  maxGap  toasts  tank        topHint');
  const summary = {};
  for (const id of only) {
    const rs = results[id];
    const won = rs.filter(r => r.won).length;
    const ok = rs.filter(r => r.time !== undefined);
    const hintCounts = {};
    for (const r of ok) for (const [h, n] of Object.entries(r.hints || {})) hintCounts[h] = (hintCounts[h] || 0) + n;
    const top = Object.entries(hintCounts).sort((a, b) => b[1] - a[1])[0];
    const s = {
      won: won + '/' + rs.length,
      time: median(ok.map(r => r.time)),
      livesLost: +(ok.reduce((a, r) => a + r.livesLost, 0) / ok.length).toFixed(1),
      caught: +(ok.reduce((a, r) => a + r.caught, 0) / ok.length).toFixed(1),
      rewardEvery: median(ok.map(r => r.rewardEvery)),
      maxGap: Math.max(...ok.map(r => r.maxGap)),
      toasts: Math.max(...ok.map(r => r.maxToasts)),
      tank: ok.map(r => r.tank ? r.tank[0] : '-').join(''),
      topHint: top ? `${top[1]}x "${top[0].slice(0, 40)}"` : '',
      errors: rs.reduce((a, r) => a + (r.errors || 0), 0) + rs.filter(r => r.error).length,
    };
    summary[id] = s;
    console.log(id.padEnd(12), s.won.padEnd(4), String(s.time).padStart(9), String(s.livesLost).padStart(10),
      String(s.caught).padStart(7), String(s.rewardEvery).padStart(12), String(s.maxGap).padStart(7),
      String(s.toasts).padStart(7), ('  ' + s.tank).padEnd(12), s.topHint, s.errors ? ' ERRORS:' + s.errors : '');
  }
  const out = path.join(__dirname, 'output');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, `playtest-${skill}.json`), JSON.stringify({ summary, results }, null, 2));
  console.log('\ntank: e = escaped, r = kid let it go, - = not caught.  Full results in tests/output/.');
})();
