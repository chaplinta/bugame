'use strict';
// In-page playtest bot. Loaded into the game page by tests; drives Input every game tick via Game.testHook.
// skill 'perfect': reacts instantly and steers straight. skill 'kid': ~0.4 s reactions, wobbly steering,
// wanders off sometimes, misses some presses, doesn't always run from predators.
// Also records metrics used to judge pacing and frustration.

(function () {
  // What to do right now, for each mission: { goal: point to head for, act: tap the button, hold: keep it held }.
  function decide(g) {
    const p = g.player, m = g.mission, id = m.id;
    const near = (list) => nearest(list, p, 99999);
    const pr = g.preds[0];
    if (pr && (pr.state === 'chase' || pr.state === 'alert') && dist(pr, p) < 170) return { goal: g.home, flee: true };
    let goal = null, act = false, hold = false;
    if (id === 'ant') {
      if (p.carry) goal = g.home;
      else {
        const t = near(g.items.filter(i => i.kind !== 'caterpillar' || i.stunned)) || near(g.items);
        goal = t;
        if (t && t.kind === 'caterpillar' && !t.stunned && dist(t, p) < 45) act = true;
      }
    } else if (id === 'queen') {
      if (g.phase === 'fly') { const pt = near(g.patches); goal = pt; if (dist(pt, p) < 40) act = true; }
      else if (g.phase === 'dig') { goal = Game.inHome() ? null : g.home; hold = Game.inHome(); }
      else goal = p.carry ? g.home : near(g.items);
    } else if (id === 'bee') {
      if (p.load >= 3) goal = g.home;
      else { const f = near(g.items.filter(i => i.pollen)); goal = f; if (f && dist(f, p) < 22) { hold = true; goal = null; } }
    } else if (id === 'fly') {
      if (p.protein < 1) { const c = near(g.items.filter(i => i.kind === 'cow')); if (c) { const h = m.head(c); goal = h; if (dist(h, p) < 30) { hold = true; goal = null; } } }
      else { const pt = near(g.pats.filter(q => q.fresh > 0.4)); goal = pt; if (pt && dist(pt, p) < 22) { hold = true; goal = null; } }
    } else if (id === 'caterpillar') {
      if (g.score >= m.goal) act = true;
      else { const f = near(g.items.filter(i => i.kind !== 'grevillea' && i.leaf > 0.1)); goal = f; if (f && dist(f, p) < 24) { hold = true; goal = null; } }
    } else if (id === 'butterfly') {
      const want = p.energy >= 1 ? g.items.filter(i => i.kind === 'everlasting' || i.kind === 'capeweed') : g.items.filter(i => i.nectar);
      const f = near(want); goal = f; if (f && dist(f, p) < 24) { hold = true; goal = null; }
    } else if (id === 'termite') {
      if (p.carry) goal = g.home;
      else { const f = near(g.items); goal = f; if (f && dist(f, p) < 22) { hold = true; goal = null; } }
    } else if (id === 'snail') {
      const f = near(g.items.filter(i => i.amount > 0.05)); goal = f; if (f && dist(f, p) < 26) { hold = true; goal = null; }
    } else if (id === 'spiderling') {
      if (g.score >= m.goal) goal = g.home;
      else { const f = near(g.items); if (f) { if (dist(f, p) < 130) act = true; else goal = f; } }
    } else if (id === 'spider') {
      if (g.court) act = g.court.green && !g.court.hit;
      else if (g.female && !g.danced) goal = g.female;
      else { const f = near(g.items.filter(i => i.kind === 'fly' && i.state === 'sit')); if (f) { if (dist(f, p) < 150) act = true; else goal = f; } }
    } else if (id === 'nymph') {
      if (g.score >= m.goal) goal = m.reed;
      else { const f = near(g.items); goal = f; if (f && dist(f, p) < 55) act = true; }
    } else if (id === 'sandhopper') {
      if (g.score >= m.goal) { goal = { x: Beach.bx, y: Beach.ground(Beach.bx) + 60 }; }
      else {
        const w = near(g.items.filter(i => i.kind === 'wrack' && i.amount > 0));
        if (w && Math.abs(w.x - p.x) < 24 && p.onGround) { hold = true; goal = null; } else goal = w;
        if (m.inBurrow(g) && p.onGround) act = true;
      }
      // Hop away from a chasing plover or a diving gull
      if (pr && (pr.state === 'chase' || pr.state === 'alert') && dist(pr, p) < 200 && p.onGround) act = true;
    } else if (id === 'mosquito') {
      const threat = m.people(g).find(pp => pp.swat > 0);
      if (threat) goal = { x: p.x + (p.x - threat.sx) * 3 + 60, y: p.y + (p.y - threat.sy) * 3 + 60 };
      else {
        const t = m.goalPoint(g);
        if (t && dist(t, p) < 22 && !(t.pp && t.pp.look)) { hold = true; goal = null; } else goal = t;
        if (t && t.pp && t.pp.look) goal = null;
      }
    } else if (id === 'flight') {
      const fl = g.fl;
      if (!fl || g.noGL) return { goal: null };
      if (!fl.flying) act = true;
      else if (fl.landed) hold = true;
      else {
        const left = fl.flowers.filter(f => !f.visited);
        const f = left.reduce((a, c) => Math.hypot(c.x - fl.x, c.z - fl.z) < Math.hypot(a.x - fl.x, a.z - fl.z) ? c : a);
        let rel = Math.atan2(f.x - fl.x, f.z - fl.z) - fl.yaw;
        while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
        const turn = clamp(-rel * 2, -1, 1);
        const want = f.y + 6, dyv = fl.y > want + 1 ? 0.5 : 0;
        goal = { x: p.x + turn * 200, y: p.y + dyv * 200 };
        if (fl.y < want - 1 && fl.vy < 2) act = true;
      }
    } else if (id === 'skimmerF') {
      if (p.energy < 8) goal = near(g.items.filter(i => i.kind === 'mosquito'));
      else { const s = near(g.spots.filter(q => !q.done)); goal = s; if (s && dist(s, p) < 30) act = true; }
    } else if (id === 'spiderF') {
      if (g.phase === 'watch') { const mm = near(g.males); if (mm) { goal = mm; if (dist(mm, p) < 60) act = true; } }
      else if (g.phase === 'sac') { if (Game.inHome()) { hold = true; goal = null; } else goal = g.home; }
      else if (g.ant && !g.ant.flee) { if (dist(g.ant, p) < 150) act = true; else goal = g.ant; }
      else goal = g.sac;
    } else if (id === 'nest') {
      const N = NEST.cell, S = NEST.surf, ec = Math.floor(960 / N);
      const cellPt = (r, c) => ({ x: c * N + N / 2, y: S + r * N + N / 2 });
      const ent = { x: ec * N + N / 2, y: S - 8 };
      const up = m.above(g);
      // Plan: a shaft down the entrance column, a nursery at rows 7-9 and a food store at rows 12-14
      if (!g.botPlan) {
        g.botPlan = [];
        for (let r = 5; r <= 14; r++) g.botPlan.push([r, ec]);
        for (const [r0, c0] of [[7, ec + 2], [12, ec - 3]]) for (let r = r0; r <= r0 + 2; r++) for (let c = c0 - 2; c <= c0 + 2; c++) g.botPlan.push([r, c]);
      }
      const todo = g.botPlan.filter(([r, c]) => g.grid[r][c] !== 0 && g.grid[r][c] !== 4 && g.grid[r][c] !== 5);
      const plugged = !m.entrances(g).length;
      if ((g.warned || g.raining > 0) && !plugged) {
        goal = ent; if (up && Math.abs(p.x - ent.x) < 20) act = true;
      } else if (plugged && !(g.raining > 0)) {
        // After the rain, dig the plug out again
        goal = up && Math.abs(p.x - ent.x) > 10 ? { x: ent.x, y: S - 8 } : { x: ent.x, y: S + 80 };
      } else if (m.openSpace(g) && g.rooms.length < 2) act = true;
      else if (p.crumbs >= 4 || (p.crumbs > 0 && !todo.length)) goal = ent;
      else if (todo.length) goal = cellPt(...todo[0]);
      else if (g.mound < 30) { let r = 15; while (r < NEST.rows - 1 && g.grid[r][ec] === 0) r++; goal = cellPt(r, ec); }
      else if (g.rooms.some(r => r.type === 'food') && g.food < 3) {
        if (p.honey) { const f = g.rooms.find(r => r.type === 'food'); goal = cellPt(f.r, f.c); }
        else if (up && Math.abs(p.x - g.plant.x) < 40) { hold = true; goal = null; }
        else goal = up ? { x: g.plant.x, y: S - 8 } : ent;
      }
      // Get into the nest from the entrance
      if (goal && up && goal.y > S && Math.abs(p.x - ent.x) > 10) goal = { x: ent.x, y: S - 8 };
      if (goal && goal.y > S && up && Math.abs(p.x - ent.x) <= 10) goal = { x: ent.x, y: S + 60 };
      // Underground: shortest route (Dijkstra) through tunnels, digging soil only if the jaws have room; rocks and roots block
      if (goal && !up) {
        const from = m.cellOf(p.x, p.y), to = goal.y < S ? { r: -1, c: ec } : m.cellOf(goal.x, goal.y);
        const R = NEST.rows, C = NEST.cols, key = (r, c) => (r + 1) * 1000 + c;
        const dist = new Map([[key(from.r, from.c), 0]]), prev = new Map(), open = [[0, from.r, from.c]];
        let found = null;
        while (open.length) {
          let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
          const [d, r, c] = open.splice(bi, 1)[0];
          if (d > (dist.get(key(r, c)) ?? 1e9)) continue;
          if (r === to.r && c === to.c) { found = [r, c]; break; }
          if (r === -1) continue;
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            if (!dr === !dc) continue;   // up, down, left, right only
            const nr = r + dr, nc = c + dc;
            if (nc < 0 || nc >= C || nr >= R || nr < -1) continue;
            if (nr === -1 && nc !== ec) continue;
            const t = nr === -1 ? 0 : g.grid[nr][nc];
            if (t === 4 || t === 5) continue;
            if (t !== 0 && p.crumbs >= 4 && !(nr === to.r && nc === to.c)) continue;
            if (dr && dc && t !== 0) continue;   // dig straight, not diagonally
            const nd = d + (t === 0 ? (dr && dc ? 1.4 : 1) : 4);
            if (nd < (dist.get(key(nr, nc)) ?? 1e9)) { dist.set(key(nr, nc), nd); prev.set(key(nr, nc), [r, c]); open.push([nd, nr, nc]); }
          }
        }
        if (found) {
          const steps = [];
          for (let cur = found; cur; cur = prev.get(key(cur[0], cur[1]))) steps.unshift(cur);
          const nxt = steps[Math.min(1, steps.length - 1)];
          goal = nxt[0] === -1 ? { x: ent.x, y: S - 40 } : cellPt(nxt[0], nxt[1]);
        }
      }
    } else if (id === 'dragonfly') {
      goal = near(g.items);
    }
    return { goal, act, hold };
  }

  const Bot = {
    install(skill) {
      // 'tapper' plays like 'kid' but never holds the button: it taps instead.
      const tapper = skill === 'tapper';
      const kid = skill === 'kid' || tapper;
      const st = { next: 0, d: null, wander: 0, wdir: 0, pressNext: false, tapT: 0, tapHeld: 0 };
      const mx = Bot.metrics = { rewards: [], hints: {}, caught: 0, maxToasts: 0, tank: null, facts: 0 };
      // Instrument the game.
      const pop = Game.pop.bind(Game);
      Game.pop = (x, y, text, color) => { mx.rewards.push(Game.g.t); return pop(x, y, text, color); };
      const hint = Game.hint.bind(Game);
      Game.hint = (text) => { if (Game.g.hintT <= 0) mx.hints[text] = (mx.hints[text] || 0) + 1; return hint(text); };
      const caught = Game.caught.bind(Game);
      Game.caught = (pr) => { mx.caught++; return caught(pr); };
      const fact = Game.fact.bind(Game);
      Game.fact = (k) => { const before = Game.g.seen.size; fact(k); if (Game.g.seen.size > before) mx.facts++; };
      const leave = Game.leaveTank.bind(Game);
      Game.leaveTank = (msg) => { mx.tank = /escaped/.test(msg) ? 'escaped' : 'released'; mx.tankTime = Game.g.event.t; return leave(msg); };

      Game.testHook = (dt) => {
        const g = Game.g;
        if (!g || g.done) return;
        mx.maxToasts = Math.max(mx.maxToasts, g.toasts.length);
        const p = g.player;
        // Bug tank: head for the gap once it opens.
        if (g.event) {
          const o = g.event.phase === 'tank' && g.event.open;
          Input.held = false;
          Input.target = o ? { x: o.x + (kid ? (Math.random() - 0.5) * 20 : 0), y: o.y } : null;
          if (o && dist(o, p) < 50 && (!kid || Math.random() < 0.05)) Input.pressed = true;
          return;
        }
        st.next -= dt;
        if (st.next <= 0) {
          st.next = kid ? 0.3 + Math.random() * 0.25 : 0;
          let d = decide(g);
          if (kid && d.flee && Math.random() < 0.4) d = decide(Object.assign({}, g, { preds: [] }));  // didn't notice
          if (kid && st.wander <= 0 && !d.hold && Math.random() < 0.04) { st.wander = 1 + Math.random() * 1.5; st.wdir = Math.random() * Math.PI * 2; }
          if (kid && d.goal) d.goal = { x: d.goal.x + (Math.random() - 0.5) * 30, y: d.goal.y + (Math.random() - 0.5) * 30 };
          st.d = d;
          st.pressNext = d.act && (!kid || Math.random() < 0.75);
        }
        st.wander -= dt;
        const d = st.d || {};
        let goal = d.goal;
        if (st.wander > 0) goal = { x: p.x + Math.cos(st.wdir) * 200, y: p.y + Math.sin(st.wdir) * 200 };
        const z = Game.zoom || 1;
        Input.target = goal ? { x: (goal.x - g.cam.x) * z, y: (goal.y - g.cam.y) * z } : null;
        Input.held = !!d.hold && st.wander <= 0;
        if (tapper && Input.held) {
          // A tap: a short press about four times a second.
          Input.held = st.tapHeld > 0;
          st.tapHeld -= dt; st.tapT -= dt;
          if (st.tapT <= 0) { st.tapT = 0.25; st.tapHeld = 0.08; Input.pressed = true; Input.held = true; }
        }
        if (st.pressNext) { Input.pressed = true; st.pressNext = false; }
        // Darting away from a chaser (dragonfly, nymph).
        if (d.flee && (g.mission.id === 'dragonfly' || g.mission.id === 'nymph') && (!kid || Math.random() < 0.02)) Input.pressed = true;
      };
    },
    // Summary at the end of a run.
    report() {
      const g = Game.g, mx = Bot.metrics, r = [0].concat(mx.rewards, [g.t]);
      let maxGap = 0;
      for (let i = 1; i < r.length; i++) maxGap = Math.max(maxGap, r[i] - r[i - 1]);
      return {
        won: g.done && g.lives > 0, time: Math.round(g.t), livesLost: 3 - g.lives, caught: mx.caught,
        rewards: mx.rewards.length, rewardEvery: +(g.t / Math.max(1, mx.rewards.length)).toFixed(1), maxGap: Math.round(maxGap),
        hints: mx.hints, maxToasts: mx.maxToasts, facts: mx.facts, tank: mx.tank, tankTime: mx.tankTime && Math.round(mx.tankTime),
        finds: g.finds.filter(f => f.found).length + '/' + g.finds.length,
      };
    },
  };
  window.Bot = Bot;
})();
