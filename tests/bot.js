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
