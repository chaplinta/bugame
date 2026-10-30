'use strict';
// Reach sweep: a clumsy kid on a phone. For every level, steer to each kind of target but stop a little short or to
// one side (a random 18 CSS px error), press the action button, and report any action that never becomes ready or
// never completes; also press the button far from everything and report a level that stays silent.
// Usage: node tests/sweep-reach.js [ids,comma,separated]   -> prints a table, exits 1 if anything failed.

const { launch, openGame, startMission, MISSIONS } = require('./helpers');

// What to aim at in each level, and what counts as the action having worked (all in-page, as source strings).
const TARGETS = {
  ant: ['g.items.find(i => i.kind === "caterpillar" && !i.stunned)', 'g.items.some(i => i.stunned) || Game.g.player.carry'],
  bee: ['g.items.find(i => i.pollen && i.kind !== "paw")', 'Game.g.player.load > 0'],
  fly: ['m.head(g.items.find(i => i.kind === "cow"))', 'Game.g.player.protein > 0'],
  caterpillar: ['g.items.find(i => (i.kind === "everlasting" || i.kind === "capeweed") && i.leaf > 0.05)', 'Game.g.score > 0 || Game.g.items.some(i => i.leaf < 1)'],
  butterfly: ['g.items.find(i => i.nectar)', 'Game.g.player.energy > 0'],
  termite: ['g.items.find(i => i.kind === "woodChip")', '!!Game.g.player.carry'],
  snail: ['g.items.find(i => i.amount > 0.05)', 'Game.g.items.some(i => i.amount < 1)'],
  mosquito: ['(() => { for (const pp of m.people(g)) for (const s of m.spots(pp)) return s; return null; })()', 'Game.g.player.blood > 0'],
  nymph: ['g.items[0]', 'Game.g.score > 0 || Game.g.player.grab'],
  oly_dig: ['g.items.find(i => i.kind === "pat")', 't.dug > 0'],
  oly_lift: ['g.items[0]', '!!Game.g.player.carry'],
  oly_buzz: ['g.items.find(i => i.pollen)', 'Game.g.player.buzzT > 0 || Game.g.score > 0'],
};

(async () => {
  const ids = process.argv[2] ? process.argv[2].split(',') : MISSIONS.filter(id => TARGETS[id]);
  const b = await launch();
  const rows = [];
  let bad = false;
  for (const id of ids) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
    const p = await ctx.newPage();
    p.errors = [];
    p.on('pageerror', (e) => p.errors.push(e.message));
    await p.goto(require('./helpers').FILE_URL);
    await startMission(p, id, { noNet: true, noPred: true });
    const [find, done] = TARGETS[id];
    const r = await p.evaluate(async ([find, done]) => {
      const g = Game.g, m = g.mission, p = g.player;
      const out = { ready: 0, worked: 0, tries: 0, silent: false, hint: '', hasHint: !!m.notReady };
      const cssPerWorld = Game.canvas.getBoundingClientRect().width / W * (Game.zoom || 1);
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      if (p.invuln !== undefined) p.invuln = 1e9;   // the mosquito: no swats while we teleport beside people's faces
      for (let k = 0; k < 6; k++) {
        const t = eval(find);
        if (!t) break;
        out.tries++;
        // stop 18 CSS px (a clumsy finger) off the target, in a random direction
        const a = Math.random() * Math.PI * 2, e = 18 / cssPerWorld;
        p.x = t.x + Math.cos(a) * e; p.y = t.y + Math.sin(a) * e; p.carry = null;
        await wait(80);
        if (document.getElementById('actionBtn').classList.contains('ready')) out.ready++;
        // press and hold for a moment
        Input.pressed = true; Input.held = true; await wait(900); Input.held = false;
        if (eval(done) || !g.items.includes(t)) out.worked++;   // done, or the target was used up
        p.carry = null; p.load = 0; p.protein = 0; p.energy = 0; p.blood = 0;
      }
      // a press far from everything: does the level say why?
      for (const i of g.items) i.x += 5000;
      p.x = 40; p.y = 40; g.hintT = 0; g.toasts = []; g.toastT = 0; Game.showToast(null);
      Input.pressed = true; await wait(50); Input.pressed = false;
      await wait(100);
      const el = document.getElementById('toast'), h = g.toasts.find(t => t.kind === 'hint') || (el.classList.contains('hint') ? { text: el.textContent } : null);
      out.silent = !h; out.hint = h ? h.text : '';
      for (const i of g.items) i.x -= 5000;
      return out;
    }, [find, done]);
    const ok = r.ready === r.tries && r.worked === r.tries && (!r.silent || !r.hasHint) && r.tries > 0;
    if (!ok || p.errors.length) bad = true;
    rows.push({ id, tries: r.tries, ready: r.ready, worked: r.worked, hint: r.silent ? (r.hasHint ? '(silent)' : '(no hint by design)') : r.hint.slice(0, 50), errors: p.errors.length, ok: ok && !p.errors.length ? 'ok' : 'FAIL' });
    await ctx.close();
  }
  await b.close();
  console.log('Reach sweep (phone 844×390, taps 18 px off the target)\n');
  console.log('level'.padEnd(13) + 'tries ready worked  ' + 'press far away says'.padEnd(52) + 'result');
  for (const r of rows) console.log(r.id.padEnd(13) + String(r.tries).padStart(5) + String(r.ready).padStart(6) + String(r.worked).padStart(7) + '  ' + r.hint.padEnd(52) + r.ok + (r.errors ? ' (' + r.errors + ' errors)' : ''));
  process.exit(bad ? 1 : 0);
})();
