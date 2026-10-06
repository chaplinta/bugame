'use strict';
// Screenshots of every mission mid-game (desktop and phone landscape) for a visual check.
// Usage: node tests/screenshots.js   -> tests/output/shots/
const fs = require('fs');
const path = require('path');
const { launch, openGame, startMission, MISSIONS } = require('./helpers');
const BOT = fs.readFileSync(path.join(__dirname, 'bot.js'), 'utf8');
const OUT = path.join(__dirname, 'output', 'shots');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await launch();
  for (const [tag, vp] of [['desktop', { width: 1000, height: 720 }], ['phone', { width: 844, height: 390 }]]) {
    for (const id of MISSIONS) {
      const p = await openGame(b, vp);
      await p.addScriptTag({ content: BOT });
      await startMission(p, id, { noNet: true });
      await p.evaluate(() => { Bot.install('perfect'); Game.timeScale = 4; });
      await p.waitForFunction(() => Game.g.score >= 2 || Game.g.t > 40, null, { timeout: 30000 });
      await p.evaluate(() => { Game.timeScale = 1; });
      await p.waitForTimeout(250);
      await p.screenshot({ path: path.join(OUT, `${tag}-${id}.png`) });
      await p.context().close();
    }
  }
  // Effects: caught flash, reward burst, win confetti.
  const p = await openGame(b);
  await startMission(p, 'bee', { noNet: true });
  await p.evaluate(() => { Game.g.predT = 0.01; });
  await p.waitForTimeout(200);
  await p.evaluate(() => { Game.pop(Game.g.player.x + 60, Game.g.player.y, '+3', '#fff'); Game.g.player.invuln = 0; Game.caught(Game.g.preds[0]); });
  await p.waitForTimeout(80);
  await p.screenshot({ path: path.join(OUT, 'fx-caught.png') });
  await p.evaluate(() => { Game.g.score = 99; });
  await p.waitForTimeout(700);
  await p.screenshot({ path: path.join(OUT, 'fx-win.png') });
  await b.close();
  console.log('saved to', OUT);
})();
