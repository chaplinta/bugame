'use strict';
// London: the game's second map, found by tapping the plane at Perth Airport (js/ui.js). Each place on the London
// map is one side-on level with a real London animal: a buff-tailed bumblebee in Regent's Park, a common wasp in a
// café garden, the Underground mosquito in the Tube, a Jersey tiger moth in a south-east London garden, a stag
// beetle in Richmond Park. The bus tour plays them all in a row. Steer to fly (or walk), with the physics in
// js/platform.js and the art in js/art-london.js. Every fact is sourced in docs/facts.md (London); the pretend
// parts are listed there too.
//
// A level is finished by its tasks; two optional "cheeky extras" in each one are worth a star apiece (stars: one
// for finishing, one for each extra). You can't lose: a hazard costs a heart (never the last) and sends you back to
// the last safe spot, and people only wave you away.

// How each bug moves. Fliers steer to fly and hover when you let go; the stag beetle walks, climbs bark and flies a
// short, clumsy way.
const LDN_PHYS = {
  bee: { hw: 9, hh: 14, fly: 215, accel: 14, sink: 45 },
  wasp: { hw: 9, hh: 12, fly: 240, accel: 16, sink: 50 },
  mosquito: { hw: 7, hh: 10, fly: 190, accel: 14, sink: 35 },
  moth: { hw: 12, hh: 14, fly: 200, accel: 12, sink: 40 },
  stag: { hw: 18, hh: 16, walk: 95, grav: 900, climb: 75, flyV: 150, flyLift: 100, flySink: 30, warm: 0.4, flyT: 2.4 },
};

// ------------------------------------------------------------------ people
// Whole humans, side-on, standing on q.y. pose: 'stand' | 'sit' | 'bend' | 'sleep'. look: seconds between looks
// round (0 or missing: never looks up, like someone on their phone). Someone looking round has a red zone, as at
// the Perth barbecue: close round the head, and a wedge from the eyes that sweeps from the way they face, down
// past their feet, to behind them. A bug in the zone is waved away: blown a little way off, no heart lost.
const LDN_LOOK = 2.4, LDN_ZONE = { near: 46, far: 190, half: 0.4 };
const LDN_BODY = {   // where things are on a body, from the feet, facing right
  stand: { eyes: [9, -170], head: [2, -168], neck: [-2, -150], ankle: [5, -13], hand: [12, -86], shoulder: [0, -140] },
  sit: { eyes: [9, -136], head: [2, -134], neck: [-2, -116], ankle: [31, -13], hand: [26, -62], knee: [30, -50] },
  bend: { eyes: [54, -74], head: [50, -78], neck: [38, -92], ankle: [-4, -13], bum: [-22, -98], hand: [42, -30] },
  sleep: { eyes: [-44, -66], head: [-46, -64], nose: [-40, -76], ankle: [50, -22], hand: [10, -44], tum: [0, -52] },
};
function ldnAt(q, part) { const b = (LDN_BODY[q.pose] || LDN_BODY.stand)[part] || [0, -100]; return { x: q.x + b[0] * q.face, y: q.y + b[1] }; }
function ldnGaze(q) { const k = clamp(1 - q.timer / LDN_LOOK, 0, 1); return (q.face > 0 ? 0 : Math.PI) + q.face * k * Math.PI; }
function ldnInZone(q, pt) {
  if (!q.looking) return false;
  const e = ldnAt(q, 'eyes'), dx = pt.x - e.x, dy = pt.y - e.y, d = Math.hypot(dx, dy);
  if (d < LDN_ZONE.near) return true;
  if (d > LDN_ZONE.far) return false;
  const a = Math.atan2(dy, dx) - (q.gaze || 0);
  return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < LDN_ZONE.half;
}
// Blown a little way off by a wave of the hand (or a gust): no steering for half a second, any hold starts again
function ldnBlow(g, dir, force) {
  const p = g.player;
  g.shooDir = dir; g.shooed = 0.5; p.push = dir * (force || 3400); p.vy = -150;
  for (const s of g.level.spots) s.t = 0;
}
function ldnPeople(g, dt, m) {
  const p = g.player, c = { x: p.x, y: p.y - m.P.hh / 2 };
  for (const q of g.people) {
    if (!q.look) continue;
    q.timer -= dt;
    if (q.state === 'calm' && q.timer <= 0) { q.state = 'look'; q.timer = LDN_LOOK; }
    else if (q.state === 'look' && q.timer <= 0 && !(q.shoo > 0)) { q.state = 'calm'; q.timer = q.look * (0.8 + Math.random() * 0.4); }
    q.looking = q.state === 'look';
    if (q.looking && !(q.shoo > 0)) q.gaze = ldnGaze(q);
    if (ldnInZone(q, c) && !q.shoo && !(g.shooed > 0) && p.invuln <= 0 && !g.hidden && !g.homeSafe) {
      q.shoo = 0.75;
      Game.hint('They’ve seen you! Fly out of the red!');
      if (m.shooFact) Game.fact(m.shooFact);
    }
    if (q.shoo > 0) {
      q.shoo -= dt;
      if (q.shoo <= 0) {
        q.shoo = 0; Sound.play('tap');
        const e = ldnAt(q, 'eyes');
        if (ldnInZone(q, c) && !g.hidden && p.invuln <= 0) { ldnBlow(g, c.x >= e.x ? 1 : -1); Game.pop(p.x, p.y - 34, 'Shoo!', '#fff'); Game.say(e.x, e.y - 34, 'Shoo!'); }
        else Game.pop(c.x, c.y - 34, 'Missed!', '#fff');
        q.state = 'calm'; q.timer = q.look;
      }
    }
    q.wave = q.shoo > 0;
  }
}

// ------------------------------------------------------------------ a level
// d: { id, kind (which LDN_PHYS), stage, place, sprite, bg, scale, action (the button's idle word), later1/later2
// (fact keys shown a little way in), sex, facts, how, discoveries, factText, level(), and any of start(g),
// tick(g, dt), hazards(g, dt), done(g, s), weak(g), busy(g) (no steering: wrestling, stuck), hud(g) }.
// level() returns { w, floor, start, solids, ledges, hides, people, spots, need, checkpoints, route, webs }.
// A spot: { id, kind, x, y, r, verb, hold (seconds; without it a press does it; without a verb, reaching it),
// need, goal, pop, fact, extra (a cheeky extra), say (what the person it is on says), on + part (it sits on that
// person), off (not to be had just now), crab, moving }.
function ldnPart(d) {
  return Object.assign({
    bug: 'london', view: 'side', world: { w: 3600, h: 600 }, noNet: true, gentle: true, zoom: [1.1, 1.35], toastTop: true,
    radius: 10, speed: 0, home: { x: 80, y: 500, r: 1, label: '' },
    get P() { return LDN_PHYS[this.kind]; },

    setup(g) {
      const L = g.level = this.level(), P = this.P, p = g.player;
      Object.assign(p, { x: L.start[0], y: L.start[1], vx: 0, vy: 0, acc: 0, face: 1, angle: 0, flat: true, r: P.hw, onGround: false, flyT: 0, warmT: 0 });
      g.home = { x: L.start[0], y: L.start[1], r: 1, label: '' };
      g.cp = 0; g.wp = 0; g.look = 1; g.counts = {}; g.hz = {}; g.extras = 0; g.shooed = 0; g.stuck = null; g.movers = [];
      g.people = (L.people || []).map((q, i) => Object.assign({ y: L.floor, face: 1, pose: 'stand', seed: i + 1, state: 'calm', timer: (q.look || 0) * (0.4 + 0.6 * ((i * 37) % 10) / 10), looking: false }, q));
      for (const s of L.spots) if (s.on) { const q = g.people.find(x => x.id === s.on), at = ldnAt(q, s.part); s.x = at.x; s.y = at.y; }
      g.fronts = (L.hides || []).map(h => LondonArt.leaves(h));   // the leaves (or pillar) drawn in front of a hidden bug
      if (this.start) this.start(g);
      Game.later(5, () => Game.fact(this.later1));
      Game.later(16, () => Game.fact(this.later2));
    },

    // The way the bug is steered: toward the finger (slowing as she gets there, so she stops on it) or with the arrow
    // keys. Let go and a flier hovers where she is; only a bumblebee out of fuel drifts down.
    move(g, dt, dx, dy) {
      const p = g.player, P = this.P, L = g.level;
      if (Input.target && !Input.keys.size && !this.locked(g)) {   // locked: blown off, stuck or wrestling
        const z = Game.zoom || 1, tx = Input.target.x / z + g.cam.x, ty = Input.target.y / z + g.cam.y;
        const cx = p.x, cy = p.y - P.hh / 2, d = Math.hypot(tx - cx, ty - cy);
        if (d < 10) { dx = 0; dy = 0; }
        else { const k = P.walk ? 1 : Math.min(1, d / 36); dx = (tx - cx) / d * k; dy = (ty - cy) / d * k; }
      }
      const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len; }
      if (P.walk && !(p.flyT > 0)) dx = Math.abs(dx) < 0.2 ? 0 : Math.sign(dx);
      if (g.stuck) { dx = 0; dy = 0; p.vx = 0; p.vy = 0; }
      const weak = this.weak ? this.weak(g) : false, hover = !P.walk && !weak && !dx && !dy;
      Plat.move(L, P, p, dt, dx, dy, { hover: hover || !!g.stuck, perch: g.perch, weak });
      if (Math.abs(p.vx) > 8) p.face = p.vx > 0 ? 1 : -1;
      p.angle = 0;
      p.flying = P.walk ? (p.flyT > 0 || p.warmT > 0) : !p.onGround;
      p.moving = P.walk ? (p.onGround && Math.abs(p.vx) > 5) || p.climbing : p.flying;
      p.landed = !p.flying;
      g.look += (p.face - g.look) * Math.min(1, dt * 2);
    },
    locked(g) { return g.shooed > 0 || !!g.stuck || !!(this.busy && this.busy(g)); },
    camera(g, vw) { const p = g.player; return { x: p.x + g.look * vw * 0.18, y: p.y - 40 }; },

    // Is a task's need met? (the nest needs four flowers' pollen first, and so on)
    ready(g, s) { for (const k in s.need || {}) if ((g.counts[k] || 0) < s.need[k]) return false; return true; },
    met(g, kind) { const L = g.level; return (g.counts[kind] || 0) >= ((L.need || {})[kind] || 99); },
    open(g, s) { return !s.done && !s.off && this.ready(g, s); },
    spotHere(g) {
      const p = g.player, cy = p.y - this.P.hh / 2, near = (s) => Math.hypot(s.x - p.x, s.y - cy) < s.r;
      return g.level.spots.find(s => this.open(g, s) && !s.moving && near(s)) || g.level.spots.find(s => this.open(g, s) && s.moving && near(s));
    },
    // The next place the arrow points to (and the test bot heads for): along the route, skipping what's done or
    // gone; if the next task still needs something (four flowers before the nest), the nearest place to get it
    waypoint(g) {
      const L = g.level, p = g.player;
      while (g.wp < L.route.length) {
        const r = L.route[g.wp], s = r[2] && L.spots.find(q => q.id === r[2]);
        if (s ? s.done || s.gone || (!s.goal && !s.extra && this.met(g, s.kind)) : p.x >= r[0] - 40) g.wp++; else break;
      }
      const r = L.route[Math.min(g.wp, L.route.length - 1)], s = r[2] && L.spots.find(q => q.id === r[2]);
      if (s && !this.ready(g, s)) {
        const want = Object.keys(s.need).filter(k => (g.counts[k] || 0) < s.need[k]);
        const got = L.spots.filter(q => want.includes(q.kind) && !q.done && !q.gone && !q.crab && this.ready(g, q)).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
        if (got) return { x: got.x, y: got.y, spot: got };
      }
      return s ? { x: s.x, y: s.y, spot: s } : { x: r[0], y: r[1] };
    },
    goalPoint(g) { return g.homeSafe ? null : this.waypoint(g); },

    update(g, dt, input) {
      const p = g.player, L = g.level, P = this.P;
      g.perch = false;
      g.hidden = Plat.hidden(L, p, P.hh);
      if (g.shooed > 0) g.shooed = Math.max(0, g.shooed - dt);
      // safe spots along the way: getting caught brings you back to the last one
      while (g.cp < L.checkpoints.length && p.x > L.checkpoints[g.cp][0]) {
        const c = L.checkpoints[g.cp++];
        g.home = { x: c[0], y: c[1], r: 1, label: '' };
        Game.pop(p.x, p.y - 40, 'Safe spot', '#fff');
      }
      if (g.people.length) ldnPeople(g, dt, this);
      for (const mv of g.movers) mv.update(g, dt);
      for (const s of L.spots) if (s.moving) { s.ph = (s.ph || 0) + dt; s.x = s.ax + Math.cos(s.ph * 1.7) * 26; s.y = s.ay + Math.sin(s.ph * 2.3) * 16; }
      if (L.webs && ldnWebs(g, dt, input, this)) { if (this.hazards) this.hazards(g, dt); return; }   // stuck in a web: wriggle
      const s = g.homeSafe || (this.busy && this.busy(g)) ? null : this.spotHere(g);
      g.spot = s;
      if (this.busy && this.busy(g)) { /* the level has the button (a wrestle) */ }
      else if (P.walk && !s) {
        setAction('Fly', p.onGround && !(p.flyT > 0) && !(p.warmT > 0));
        if (input.pressed && p.onGround && Plat.takeOff(P, p)) { Sound.play('buzz'); Game.fact('dusk'); Game.pop(p.x, p.y - 34, 'Bzzz…', '#fff'); }
      } else if (s && s.verb) {
        setAction(s.verb, true);
        if (s.hold) {
          if (working(input)) {
            g.perch = true;
            s.t = (s.t || 0) + work(input, dt);
            p.progress = Math.min(1, s.t / s.hold);
            if (s.crab && s.t > 0.4) { s.t = 0; Game.fact('crab'); Game.caught({ name: 'crab spider', caughtText: 'A crab spider was hiding on that flower! Back to the last safe spot.' }); }
            else if (s.t >= s.hold) this.complete(g, s);
          }
        } else if (input.pressed) this.complete(g, s);
      } else if (s) this.complete(g, s);   // somewhere you only have to reach
      else setAction(this.action, false);
      if (this.hazards) this.hazards(g, dt);
      if (this.tick) this.tick(g, dt, input);
    },
    complete(g, s) {
      s.done = true; s.t = 0; s.doneAt = g.t;
      g.counts[s.kind] = (g.counts[s.kind] || 0) + 1;
      Sound.play(s.goal ? 'win' : 'score');
      if (s.pop) Game.pop(s.x, s.y - 30, s.pop, '#ffd23f');
      if (s.say) { const who = s.on || s.by, q = who && g.people.find(x => x.id === who), at = q ? ldnAt(q, 'head') : s; Game.say(at.x, at.y - 34, s.say); Sound.play(s.sound || 'oi'); }
      if (s.fact) Game.fact(s.fact);
      if (s.extra) { g.extras++; Game.pop(s.x, s.y - 56, 'Cheeky! ★', '#ffd23f'); Game.burst(s.x, s.y, '#ffd23f', 18); }
      if (this.done) this.done(g, s);
      if (s.goal) g.homeSafe = true;
    },
    onCaught(g) { const p = g.player; p.vx = 0; p.vy = 0; p.acc = 0; p.flyT = 0; p.warmT = 0; p.push = 0; g.stuck = null; g.shooed = 0; for (const s of g.level.spots) s.t = 0; if (this.reset) this.reset(g); },
    caughtText(pr) { return pr.caughtText || 'Caught by a ' + pr.name + '! Back to the last safe spot.'; },
    // One star for finishing, one for each cheeky extra
    stars(g) { return 1 + Math.min(2, g.extras || 0); },
    endLine(g) { return g.extras >= 2 ? 'Both cheeky extras found!' : 'Cheeky extras found: ' + (g.extras || 0) + ' of 2. Each one is a star.'; },
    stat(g) { return '★'.repeat(Math.min(2, g.extras || 0)) + '☆'.repeat(2 - Math.min(2, g.extras || 0)); },

    drawBuild(ctx, g) { LondonArt.spots(ctx, g, this); },
    drawFront(ctx, g) { LondonArt.front(ctx, g, this); },
    won(g) { return !!g.homeSafe; },
  }, d);
}

// A spider's web across a gap: fly into it and you stick. Wriggle (hold or tap) to pull free before the spider
// gets to you. L.webs: [{ x, y, r }]
function ldnWebs(g, dt, input, m) {
  const p = g.player, cy = p.y - m.P.hh / 2;
  if (!g.stuck) {
    const w = p.invuln <= 0 && !g.homeSafe && g.level.webs.find(q => Math.hypot(q.x - p.x, q.y - cy) < q.r * 0.8);
    if (!w) return false;
    g.stuck = { web: w, t: 0, free: 0 };
    Sound.play('caught'); Game.fact('web');
    g.toasts.unshift({ text: 'Stuck in a web! Hold or tap Wriggle to pull free.', kind: 'hint' }); g.toastT = 0;
  }
  const st = g.stuck;
  st.t += dt;
  setAction('Wriggle', true);
  if (working(input)) { st.free += work(input, dt); p.progress = Math.min(1, st.free / 1.2); }
  if (st.free >= 1.2) {
    g.stuck = null; p.invuln = 1.5; ldnBlow(g, p.x < st.web.x ? -1 : 1, 1600);
    Game.pop(p.x, p.y - 34, 'Free!', '#fff'); Sound.play('jump');
  } else if (st.t > 4.5) { g.stuck = null; Game.caught({ name: 'spider', caughtText: 'The spider got to you first! Back to the last safe spot.' }); }
  return !!g.stuck;
}

// A bird or animal hunting side-on: it shows itself (alert, with a "!"), then chases; hide and it gives up.
// o: { sprite, name, from (x), y, air (flies), speed, alert, chase, reach, caughtText }
function ldnHunter(g, o) {
  const p = g.player, m = g.mission, side = o.from > p.x ? 1 : -1;
  return Object.assign({ x: o.from, y: o.y, r: 14, scale: 1.6, face: -side, angle: 0, ground: true, flat: true, state: 'alert', t: 0, moving: true, flying: !!o.air,
    update(pr, dt) {
      const p = g.player, hid = Plat.hidden(g.level, p, m.P.hh), cy = p.y - m.P.hh / 2;
      pr.t += dt;
      if (pr.state === 'alert') {
        // closing in to where it can see you, then a moment to get ready
        const tx = p.x + side * 260, ty = o.air ? Math.max(80, cy - 120) : o.y;
        pr.x += clamp(tx - pr.x, -o.speed * dt, o.speed * dt); if (o.air) pr.y += clamp(ty - pr.y, -o.speed * dt, o.speed * dt);
        pr.face = p.x > pr.x ? 1 : -1;
        if (pr.t > o.alert) { pr.state = hid ? 'leave' : 'chase'; pr.t = 0; }
      } else if (pr.state === 'chase') {
        const ty = o.air ? cy : o.y, d = Math.hypot(p.x - pr.x, ty - pr.y), sp = o.speed * dt;
        pr.face = p.x > pr.x ? 1 : -1;
        if (d > sp) { pr.x += (p.x - pr.x) / d * sp; pr.y += (ty - pr.y) / d * sp; }
        if (hid || pr.t > o.chase) { pr.state = 'leave'; pr.t = 0; if (hid) Game.pop(pr.x, pr.y - 30, 'Hidden!', '#fff'); }
        else if (p.invuln <= 0 && Math.abs(p.x - pr.x) < o.reach && Math.abs(cy - pr.y) < (o.air ? o.reach : 40)) Game.caught(pr);
      } else {
        pr.face = side; pr.x += side * o.speed * 1.4 * dt; if (o.air) pr.y -= 120 * dt;
        if (pr.x < -80 || pr.x > World.w + 80 || pr.y < -80) pr.gone = true;
      }
    } }, o);
}

Object.assign(Missions, {
  // ------------------------------------------------------------------ 1. Buff-tailed bumblebee, Regent's Park
  // Sip four flowers and rob one deep one, keep an eye on the fuel, shelter from a shower, and get home. A rival
  // bee empties flowers ahead of you (her smelly footprints say so), two daisies hide a crab spider, and a dog
  // snaps at anything that buzzes past its nose.
  ldn_bee: ldnPart({
    id: 'ldn_bee', kind: 'bee', stage: 'Bumblebee', place: 'Regent’s Park, a summer morning', sprite: 'bumblebee', bg: 'ldnPark', scale: 2,
    world: { w: 3800, h: 600 }, action: 'Sip', later1: 'pollen', later2: 'winter',
    sex: 'You are a female worker.',
    facts: [
      'Buff-tailed bumblebees are among the commonest bumblebees in London’s parks and gardens.',
      'A bumblebee needs nectar for energy. Flying uses a lot of it.',
      'Buff-tails are nectar robbers: they bite a hole in a deep flower and drink without going in.',
    ],
    how: [
      'This is side-on! Touch and drag (or use the arrow keys) and you fly that way. Let go and you hover.',
      'Hold Sip on four open flowers. A flower with footprints is empty: another bee got there first.',
      'Hold Rob on a deep blue flower to bite a hole and steal its nectar. That fills your fuel right up.',
      'When it rains, shelter under leaves. Watch for crab spiders on the daisies, and the dog. Then fly home to your nest in the bank.',
      'Two cheeky extras are hidden here. Each one is a star!',
    ],
    discoveries: [{ key: 'd_feather', sprite: 'feather', color: '#8a9098', band: '#4a5058', fx: 0.2, fy: 0.925 }, { key: 'd_nut', sprite: 'nutShell', fx: 0.58, fy: 0.925 }],
    factText: {
      start: 'You’re a buff-tailed bumblebee worker, collecting nectar and pollen for your nest.',
      fuel: 'A bumblebee keeps nectar in her honey stomach. It fuels her wings. Run out, and she can’t fly up.',
      pollen: 'She packs pollen into baskets on her back legs and carries it home for the young bees.',
      rob: 'Robbed! Her tongue is too short for a deep flower, so she bites a hole in its side and drinks.',
      scent: 'Bees leave smelly footprints on a flower. Other bees smell them and know the nectar has gone.',
      rain: 'A bumblebee caught in heavy rain sits it out under a leaf or a flower.',
      crab: 'A flower crab spider sits still on a flower and grabs bees that land there.',
      dog: 'Dogs snap at bees that buzz past. It often ends with a stung nose.',
      zoo: 'London Zoo is in Regent’s Park. Its giraffe house is nearly 200 years old.',
      nest: 'Buff-tailed bumblebees often nest underground, in an old mouse or vole hole.',
      winter: 'In London, some buff-tailed bumblebees keep working all winter, on garden shrubs like Mahonia.',
      d_feather: 'A pigeon feather. Feral pigeons live all over London.',
      d_nut: 'A nibbled nutshell. Grey squirrels, first brought from North America, live in London’s parks.',
      win: 'Home with full pollen baskets! The pollen feeds the young bees growing in the nest.',
    },
    level() {
      const flower = (id, x, y, look, crab) => ({ id, kind: 'flower', look, x, y, r: 34, verb: 'Sip', hold: 0.8, pop: crab ? '' : 'Nectar!', fact: 'fuel', crab: !!crab });
      const deep = (id, x, y) => ({ id, kind: 'rob', look: 'comfrey', x, y, r: 34, verb: 'Rob', hold: 1, pop: 'Robbed!', fact: 'rob' });
      return {
        w: 3800, floor: 560, start: [90, 470],
        solids: [[1180, 420, 220, 140, 'hedge'], [1900, 150, 70, 410, 'trunk'], [3620, 470, 180, 90, 'bank']],
        ledges: [[606, 514, 190]],
        hides: [[1420, 440, 130, 120, 'bush'], [1960, 170, 190, 130, 'bush'], [2470, 440, 150, 120, 'bush']],
        people: [{ id: 'hat', x: 700, pose: 'sit', face: 1, seed: 3, hat: 'flowers', prop: 'book' }, { id: 'owner', x: 3020, pose: 'stand', face: -1, seed: 6, prop: 'phone' }],
        spots: [flower('f1', 300, 500, 'lavender'), flower('f2', 460, 440, 'rose'),
          { id: 'hat', kind: 'hat', on: 'hat', part: 'head', r: 30, verb: 'Land', hold: 0.5, extra: true, pop: 'That’s not a flower!', say: 'Eek! A bee!', sound: 'yelp' },
          deep('f3', 900, 468), flower('f4', 1050, 482, 'daisy', true), flower('f5', 1290, 392, 'rose'), flower('f6', 1560, 432, 'lavender'),
          flower('f7', 1730, 482, 'daisy', true), flower('f8', 2250, 470, 'lavender'), deep('f9', 2400, 452), flower('f10', 2640, 430, 'rose'),
          flower('f11', 3180, 446, 'lavender'),
          { id: 'giraffe', kind: 'giraffe', x: 3392, y: 196, r: 44, verb: 'Buzz', extra: true, pop: 'It flicked its ear!', fact: 'zoo' },
          flower('f12', 3500, 434, 'rose'),
          { id: 'nest', kind: 'nest', x: 3595, y: 540, r: 40, need: { flower: 4, rob: 1 }, goal: true, pop: 'Home!', fact: 'nest' }],
        need: { flower: 4, rob: 1 },
        checkpoints: [[1000, 480], [2100, 430], [3120, 330]],
        route: [[300, 490, 'f1'], [460, 430, 'f2'], [900, 458, 'f3'], [1290, 382, 'f5'], [1560, 422, 'f6'], [1860, 100], [1935, 100], [2010, 120], [2250, 460, 'f8'], [2400, 442, 'f9'],
          [2640, 420, 'f10'], [2800, 330], [3100, 330], [3180, 436, 'f11'], [3500, 424, 'f12'], [3595, 540, 'nest']],
      };
    },
    start(g) {
      g.fuel = 0.8;
      g.hz.dog = { x: 2950, y: 560, state: 'sit', t: 0 };
      // The rival: another bumblebee working the same flowers. She takes up to three, never leaving you short.
      const m = this, rival = { kind: 'rival', x: 640, y: 380, face: 1, t: 4, took: 0, to: null, sit: 0,
        update(g, dt) {
          const p = g.player, free = g.level.spots.filter(s => s.kind === 'flower' && !s.crab && !s.done && !s.gone);
          if (this.to) {
            const s = this.to, d = Math.hypot(s.x - this.x, s.y - 12 - this.y);
            if (s.done || s.gone) { this.to = null; this.t = 3; }
            else if (d > 6) { this.x += (s.x - this.x) / d * 170 * dt; this.y += (s.y - 12 - this.y) / d * 170 * dt; this.face = s.x > this.x ? 1 : -1; }
            else if ((this.sit += dt) > 1.3) { s.gone = s.off = s.used = true; this.took++; this.to = null; this.sit = 0; this.t = 7; if (Math.abs(s.x - p.x) < 500) Game.fact('scent'); }
          } else {
            this.y += Math.sin(g.t * 3) * 12 * dt; this.t -= dt;
            const left = 4 - Math.min(4, g.counts.flower || 0);
            if (this.t <= 0 && this.took < 3 && free.length > left + 1) {
              this.to = free.filter(s => s.x > p.x + 150 && s.x < p.x + 1100 && s !== g.spot).sort((a, b) => a.x - b.x)[0] || null;
              this.t = 2;
            }
          }
        } };
      g.movers.push(rival);
    },
    weak(g) { return g.fuel <= 0; },
    tick(g, dt) {
      const p = g.player;
      if (p.flying && !g.perch) g.fuel = Math.max(0, g.fuel - dt / 45);
      if (g.fuel < 0.25 && g.fuel > 0 && !g.toldLow) { g.toldLow = true; Game.hint('Fuel low! Sip a flower soon.'); }
      if (g.fuel <= 0 && !g.toldFuel) { g.toldFuel = true; Game.hint('Out of fuel! Drift down to a flower and Sip.'); }
    },
    done(g, s) {
      if (s.kind === 'flower') {
        g.fuel = Math.min(1, g.fuel + 0.35);
        g.player.pollen = g.counts.flower;   // her pollen baskets show it
        if (g.counts.flower === 4) { g.toasts.unshift({ text: g.counts.rob ? 'Your pollen baskets are full! Fly home to the nest in the bank.' : 'Baskets full! Now rob a deep blue flower, then fly home.', kind: 'hint' }); g.toastT = 0; }
      } else if (s.kind === 'rob') g.fuel = 1;
    },
    // A summer shower halfway, and the dog near the end
    hazards(g, dt) {
      const p = g.player, h = g.hz, cy = p.y - this.P.hh / 2;
      if (!h.cloud && p.x > 1750 && !g.homeSafe) { h.cloud = 2.5; g.toasts.unshift({ text: 'Dark clouds! Rain is coming. Get under some leaves.', kind: 'hint' }); g.toastT = 0; }
      if (h.cloud > 0 && !h.rain) { h.cloud -= dt; if (h.cloud <= 0) { h.rain = { t: 0, next: 0.6 }; Game.fact('rain'); } }
      if (h.rain && !h.rain.over) {
        const r = h.rain; r.t += dt;
        if (!g.hidden && !g.homeSafe && (r.next -= dt) <= 0) {
          r.next = 1.1; p.vy += 300; g.fuel = Math.max(0, g.fuel - 0.05); for (const s of g.level.spots) s.t = 0;
          Game.pop(p.x, p.y - 34, 'Splat!', '#cfe6ff'); Sound.play('splat');
        }
        if (r.t > 9) { r.over = true; Game.pop(p.x, p.y - 44, 'The sun is back!', '#ffd23f'); }
      }
      const d = h.dog, near = Math.hypot(p.x - d.x, cy - (d.y - 44));
      d.t += dt;
      if (d.state === 'sit' && near < 150 && p.invuln <= 0 && !g.homeSafe) { d.state = 'alert'; d.t = 0; Game.say(d.x, d.y - 84, 'Grrr!'); Sound.play('oi'); Game.fact('dog'); }
      else if (d.state === 'alert' && d.t > 0.9) {
        d.state = 'snap'; d.t = 0; Sound.play('tap');
        if (near < 130 && p.invuln <= 0) Game.caught({ name: 'dog', caughtText: 'Snap! The dog nearly got you. Back to the last safe spot.' });
        else Game.pop(d.x, d.y - 90, 'Missed!', '#fff');
      } else if (d.state === 'snap' && d.t > 1.6) d.state = 'sit';
    },
    hud(g) {
      const n = Math.min(4, g.counts.flower || 0), bars = Math.round(g.fuel * 5);
      setHud(n < 4 ? 'Flowers: ' + n + ' / 4' : g.counts.rob ? 'Fly home to the nest!' : 'Rob a deep blue flower', 'Fuel ' + '▮'.repeat(bars) + '▯'.repeat(5 - bars) + ' · ' + this.stat(g));
    },
  }),

  // ------------------------------------------------------------------ 2. Common wasp, a café garden
  // Scrape wood three times, catch a fly and chew it into a meatball, and take it all home under the shed roof. The
  // customers wave you off if you fly where they're looking; a jam-jar trap smells lovely; a web hangs by the shed.
  ldn_wasp: ldnPart({
    id: 'ldn_wasp', kind: 'wasp', stage: 'Wasp', place: 'A café garden, a late summer lunchtime', sprite: 'commonWasp', bg: 'ldnCafe', scale: 2,
    world: { w: 3600, h: 600 }, action: 'Scrape', later1: 'paper', later2: 'sweet', shooFact: 'sugar',
    sex: 'You are a female worker. All wasp workers are female.',
    facts: [
      'Common wasps live all over London. Each nest has one queen and lots of workers.',
      'Wasps catch lots of garden pests, like caterpillars and flies, to feed their young.',
      'A wasp’s nest is made of paper, and the wasps make the paper themselves.',
    ],
    how: [
      'Fly by dragging, or with the arrow keys. Let go and you hover.',
      'Hold Scrape on three wooden posts to chew wood for the nest.',
      'Catch the fly buzzing by the bin (get close, press Catch), then hold Chew to make it a meatball.',
      'A red zone shows where a customer is looking. Fly in it and they wave you away. Keep clear of the jam jar and the web, then fly home to the nest under the shed roof.',
      'Two cheeky extras are hidden here. Each one is a star!',
    ],
    discoveries: [{ key: 'd_leaf', sprite: 'deadLeaf', fx: 0.1, fy: 0.925 }, { key: 'd_feather', sprite: 'feather', color: '#8a6a48', band: '#4a3424', fx: 0.62, fy: 0.925 }],
    factText: {
      start: 'You’re a common wasp worker. Your job: wood for the nest, and food for the young.',
      paper: 'Wasps chew wood into pulp and spread it thin. It dries into paper: that’s what the nest is made of.',
      grub: 'Wasp grubs need meat, so the workers hunt insects and bring them back to the nest.',
      ball: 'She chews her catch into a meatball that’s easy to carry home to the grubs.',
      sweet: 'In return, the grubs give the workers a sweet drop to drink.',
      sugar: 'Late in summer, wasps look for sweet food, so they visit cafés and picnics.',
      trap: 'Some people set jam-jar traps. The sweet smell draws wasps in through a small hole.',
      web: 'Garden spiders catch wasps in their webs too. Wriggle!',
      d_leaf: 'A London plane leaf. Plane trees line many of London’s streets.',
      d_feather: 'A house sparrow feather. Sparrows have become much rarer in London.',
      win: 'Home to the paper nest! By late summer a big nest can hold thousands of wasps.',
    },
    level() {
      const post = (id, x, y) => ({ id, kind: 'post', x, y, r: 34, verb: 'Scrape', hold: 1, pop: 'Wood pulp!', fact: 'paper' });
      const table = (x) => [[x, 430, 170, 12, 'table']], chairs = (x) => [[x - 52, 514, 44], [x + 178, 514, 44]], under = (x) => [x, 442, 170, 118, 'table'];
      return {
        w: 3600, floor: 560, start: [90, 470],
        solids: [...table(900), [1400, 450, 90, 110, 'bin'], ...table(1700), ...table(2500), [3320, 300, 280, 260, 'shed']],
        ledges: [...chairs(900), ...chairs(1700), ...chairs(2500)],
        hides: [under(900), under(1700), under(2500)],
        people: [{ id: 'c1', x: 868, pose: 'sit', face: 1, look: 5, prop: 'cup' }, { id: 'c2', x: 1102, pose: 'sit', face: -1, look: 6.5 },
          { id: 'c3', x: 1668, pose: 'sit', face: 1, look: 5.5 }, { id: 'c4', x: 1902, pose: 'sit', face: -1, look: 7, prop: 'cup' },
          { id: 'c5', x: 2468, pose: 'sit', face: 1, look: 6, prop: 'cup' }, { id: 'c6', x: 2702, pose: 'sit', face: -1, prop: 'phone' }],
        spots: [post('p1', 260, 470), post('p2', 560, 450), post('p3', 2240, 470),
          { id: 'jam', kind: 'jam', x: 985, y: 416, r: 30, verb: 'Nick', hold: 0.8, extra: true, pop: 'Jam!', say: 'Oi! My scone!', by: 'c1', fact: 'sugar' },
          { id: 'fly', kind: 'fly', ax: 1445, ay: 392, x: 1445, y: 392, r: 40, moving: true, verb: 'Catch', pop: 'Got it!', fact: 'grub' },
          { id: 'glass', kind: 'glass', x: 1790, y: 412, r: 30, verb: 'Sip', hold: 0.8, extra: true, pop: 'Lemonade!', say: 'Hey! That’s mine!', by: 'c3', fact: 'sugar' },
          { id: 'nest', kind: 'nest', x: 3290, y: 330, r: 40, need: { post: 3, ball: 1 }, goal: true, pop: 'Home!', fact: 'sweet' }],
        need: { post: 3, ball: 1 },
        webs: [{ x: 3130, y: 410, r: 60 }],
        jar: { x: 2585, y: 404 },
        checkpoints: [[780, 380], [1560, 360], [2300, 330], [2950, 280]],
        route: [[260, 465, 'p1'], [560, 445, 'p2'], [800, 330], [1150, 330], [1445, 392, 'fly'], [1600, 320], [2000, 320], [2240, 465, 'p3'], [2400, 270], [2800, 260], [3080, 250], [3290, 330, 'nest']],
      };
    },
    start(g) {
      // A bus goes by behind the garden wall now and then: only its top deck shows
      g.movers.push({ kind: 'bus', x: -900, t: 0, honked: false,
        update(g, dt) { this.x += 250 * dt; if (!this.honked && this.x > g.cam.x - 60) { this.honked = true; Sound.play('honk'); } if (this.x > g.level.w + 300) { this.x = -1800 - Math.random() * 1500; this.honked = false; } } });
    },
    tick(g, dt, input) {
      const p = g.player, cy = p.y - this.P.hh / 2, J = g.level.jar;
      // the fly she caught: chew it into a meatball, anywhere
      if (g.counts.fly && !g.counts.ball && !g.spot && !g.stuck) {
        setAction('Chew', true);
        if (working(input)) {
          g.perch = true; g.snipT = (g.snipT || 0) + work(input, dt); p.progress = Math.min(1, g.snipT);
          if (g.snipT >= 1) { g.counts.ball = 1; p.carry = 'ball'; Sound.play('score'); Game.pop(p.x, p.y - 34, 'A meatball!', '#ffd23f'); Game.fact('ball'); }
        } else if (!g.toldSnip) { g.toldSnip = true; Game.hint('Hold Chew to make your fly into a meatball for the grubs.'); }
      }
      p.carry = g.counts.ball ? 'ball' : g.counts.fly ? 'fly' : null;
      // the jam-jar trap: its smell tugs at her; inside it she's stuck till she finds the hole again
      const d = Math.hypot(J.x - p.x, J.y - cy);
      if (d < 130 && d > 1 && !g.homeSafe && p.invuln <= 0) {
        p.x += (J.x - p.x) / d * 45 * dt; p.y += (J.y - cy) / d * 45 * dt;
        if (!g.toldJar) { g.toldJar = true; Game.fact('trap'); Game.hint('Mmm, jam… it’s a trap! Fly away from the jar.'); }
        if (d < 24) Game.caught({ name: 'jam jar', caughtText: 'In the jam jar! You squeezed back out through the hole. Phew.' });
      }
    },
    hud(g) {
      const w = Math.min(3, g.counts.post || 0), f = g.counts.fly ? 1 : 0;
      setHud(w < 3 || !f ? 'Wood: ' + w + ' / 3 · Fly: ' + f + ' / 1' : !g.counts.ball ? 'Chew the fly into a meatball' : 'Fly home to the nest!', this.stat(g));
    },
  }),

  // ------------------------------------------------------------------ 3. The Underground mosquito
  // Lay a first raft with no blood at all, then get a blood meal from a commuter and from a rat down on the track,
  // hide when a train comes, and lay a bigger raft in the tunnel's sump.
  ldn_mosquito: ldnPart({
    id: 'ldn_mosquito', kind: 'mosquito', stage: 'Underground mosquito', place: 'A Tube platform and its tunnel', sprite: 'ugMosquito', bg: 'ldnTube', scale: 2.4,
    world: { w: 4000, h: 600 }, action: 'Bite', later1: 'origin', later2: 'rats', zoom: [1.15, 1.4], shooFact: 'feel',
    sex: 'You are a female. Only females bite.',
    facts: [
      'A mosquito lives deep in the London Underground, in the warm tunnels.',
      'Only the females bite. They use the blood to make eggs.',
      'It lives in the Tube, but scientists found it didn’t start there.',
      'The wind from passing trains is real. Being blown all the way back is pretend.',
    ],
    how: [
      'Fly by dragging, or with the arrow keys. Mind the ceiling!',
      'First, hold Lay at the puddle under the dripping pipe: your first eggs need no blood.',
      'Then hold Bite on someone’s ankle. Keep out of the red zone where they’re looking. People on their phones never look.',
      'When a train comes, hide behind a pillar or in an alcove. In the tunnel, bite a rat while it stops to sniff.',
      'Fly to the big puddle at the end and hold Lay. Two cheeky extras are hidden here!',
    ],
    discoveries: [{ key: 'd_ticket', sprite: 'oldTicket', fx: 0.075, fy: 0.658 }, { key: 'd_mouse', sprite: 'mouseSide', fx: 0.6, fy: 0.925 }],
    factText: {
      start: 'This mosquito lives in the London Underground. It bites people, rats and mice.',
      origin: 'It lives in the Tube, but it didn’t start there. Its family came from the Mediterranean or Middle East long ago.',
      first: 'She can lay her first raft of eggs without any blood at all. Most mosquitoes can’t.',
      eggs2: 'A meal of blood lets her make many more eggs.',
      rats: 'Down here she bites rats and mice as well as people.',
      feel: 'People wave mosquitoes away when they notice them.',
      train: 'Moving trains push air through the tunnels, so a wind blows along the platform.',
      raft: 'She lays her eggs together in a little raft that floats on the water.',
      web: 'A spider’s web is the end of many a mosquito. Wriggle!',
      d_ticket: 'An old paper ticket. The world’s first underground railway opened in London in 1863.',
      d_mouse: 'A house mouse. Mice live in the Underground, eating the crumbs people drop.',
      win: 'A big raft of eggs! In the warm tunnels, these mosquitoes can breed all year round.',
    },
    level() {
      const bite = (id, on, extra, part, say) => ({ id, kind: extra ? id : 'bite', on, part: part || 'ankle', r: 30, verb: 'Bite', hold: extra ? 1 : 1.2, pop: 'Blood!', fact: 'eggs2', say: say || 'Ow!', sound: 'yelp', extra: !!extra });
      return {
        w: 4000, floor: 560, start: [90, 380],
        solids: [[0, 0, 4000, 70, 'ceiling'], [0, 400, 2100, 160, 'platform']],
        ledges: [[1100, 354, 170], [2150, 250, 1850]],
        hides: [[650, 110, 50, 290, 'pillar'], [1320, 110, 50, 290, 'pillar'], [1980, 110, 50, 290, 'pillar'], [2500, 400, 70, 160, 'alcove'], [3050, 400, 70, 160, 'alcove'], [3600, 400, 70, 160, 'alcove']],
        people: [{ id: 'a1', x: 480, y: 400, face: -1, prop: 'phone' }, { id: 'a2', x: 850, y: 400, face: 1, look: 5, prop: 'paper' }, { id: 'a3', x: 1160, y: 400, pose: 'sit', face: 1, look: 6 },
          { id: 'a4', x: 1560, y: 400, face: -1, look: 7, prop: 'guitar' }, { id: 'a5', x: 1830, y: 400, pose: 'bend', face: 1 }],
        spots: [{ id: 'raft1', kind: 'raft1', x: 230, y: 394, r: 36, verb: 'Lay', hold: 1.2, pop: 'Eggs!', fact: 'first' },
          bite('a1', 'a1'), bite('a2', 'a2'), bite('a3', 'a3'),
          bite('busk', 'a4', true, 'neck', 'Twang! Ow!'), bite('bum', 'a5', true, 'bum', 'YEOWCH!'),
          { id: 'r1', kind: 'rat', x: 2300, y: 536, r: 30, verb: 'Bite', hold: 1, pop: 'Rat blood!', fact: 'rats', off: true },
          { id: 'r2', kind: 'rat', x: 3200, y: 536, r: 30, verb: 'Bite', hold: 1, pop: 'Rat blood!', fact: 'rats', off: true },
          { id: 'sump', kind: 'sump', x: 3850, y: 552, r: 42, need: { raft1: 1, bite: 1, rat: 1 }, verb: 'Lay', hold: 1.5, goal: true, pop: 'A big raft!', fact: 'raft' }],
        need: { raft1: 1, bite: 1, rat: 1 },
        webs: [{ x: 2990, y: 392, r: 52 }],
        checkpoints: [[600, 300], [1400, 300], [2200, 430], [3100, 480]],
        route: [[230, 394, 'raft1'], [480, 387, 'a1'], [675, 250], [1345, 250], [2005, 250], [2180, 430], [2300, 536, 'r1'], [2535, 480], [3085, 500], [3200, 536, 'r2'], [3635, 480], [3850, 545, 'sump']],
      };
    },
    start(g) {
      const L = g.level;
      // Rats on the track: they scurry, then stop to sniff. A sniffing rat can be bitten on the ear.
      const rat = (id, x0, x1) => {
        const s = L.spots.find(q => q.id === id);
        g.movers.push({ kind: 'rat', x: x0 + 50, y: L.floor, face: 1, x0, x1, run: 1.2, sniff: 0, spot: s,
          update(g, dt) {
            if (s.done && !this.fled) { this.fled = true; this.sniff = 0; this.run = 3; Game.say(this.x, this.y - 56, 'Squeak!'); Sound.play('yelp'); }
            if (this.sniff > 0) { this.sniff -= dt; if (this.sniff <= 0) this.run = 1.2 + Math.random() * 1.4; }
            else {
              this.x += this.face * (this.fled ? 200 : 120) * dt;
              if (this.x > this.x1) this.face = -1; if (this.x < this.x0) this.face = 1;
              if ((this.run -= dt) <= 0) this.sniff = 3.2 + Math.random();
            }
            s.x = this.x + this.face * 20; s.y = this.y - 24; s.off = !(this.sniff > 0);
            if (s.off) s.t = 0;
          } });
      };
      rat('r1', 2250, 2900); rat('r2', 3150, 3700);
      // Mice between the rails by the platform: too quick to bite
      for (const [x, v] of [[400, 150], [1500, -180]]) g.movers.push({ kind: 'mouse', x, y: 590, face: v > 0 ? 1 : -1, v, wait: 0,
        update(g, dt) { if (this.wait > 0) { this.wait -= dt; return; } this.x += this.v * dt; if (this.x > 2040 || this.x < 60) { this.v = -this.v; this.face = -this.face; } if (Math.random() < dt * 0.4) this.wait = 0.5 + Math.random(); } });
    },
    done(g, s) { if (s.kind === 'bite' || s.kind === 'rat' || s.extra) g.player.blood = 1; },   // a full, red tummy
    // A train every 24 seconds: a rumble and lights first, then its rush of air (blowing you back is pretend)
    hazards(g, dt) {
      const p = g.player, h = g.hz;
      if (h.trainT === undefined) h.trainT = 13;
      h.trainT -= dt;
      if (h.trainT <= 3 && !h.warned) {
        h.warned = true; Sound.play('caught'); Game.fact('train');
        g.toasts.unshift({ text: 'A train is coming! Hide behind a pillar or in an alcove.', kind: 'hint' }); g.toastT = 0;
      }
      if (h.trainT <= 0) {
        h.pass = (h.pass || 0) + dt; g.shake = Math.max(g.shake, 0.06);
        if (!h.hit && h.pass > 0.4) {
          h.hit = true;
          if (!g.hidden && p.invuln <= 0 && !g.homeSafe && !g.stuck) {
            ldnBlow(g, -1, 15000); g.shooed = 0.9;
            Game.pop(p.x, p.y - 34, 'Whoosh!', '#fff');
            g.toasts.unshift({ text: 'Whoosh! The train’s rush of air blew you back along the line.', kind: 'hint' }); g.toastT = 0;
          } else if (g.hidden) Game.pop(p.x, p.y - 34, 'Safe!', '#fff');
        }
        if (h.pass >= 1.6) { h.trainT = 24; h.pass = 0; h.warned = false; h.hit = false; }
      }
    },
    hud(g) {
      const t = g.hz.trainT, soon = t !== undefined && t < 3 && t > 0, c = g.counts;
      setHud(!c.raft1 ? 'Lay your first eggs at the drip' : !c.bite ? 'Bite an ankle' : !c.rat ? 'Bite a rat in the tunnel' : 'Lay in the big puddle', (soon ? 'Train coming! · ' : '') + this.stat(g));
    },
  }),

  // ------------------------------------------------------------------ 4. Jersey tiger moth, a south-east London garden
  // Sip from four buddleia flowers, keep away from the cat's paw, hide from the great tit, mind the web, don't get
  // muddled by the kitchen light as dusk falls, and lay your eggs on the nettles at the end of the garden.
  ldn_moth: ldnPart({
    id: 'ldn_moth', kind: 'moth', stage: 'Jersey tiger moth', place: 'A garden in south-east London, late afternoon', sprite: 'tigerMoth', bg: 'ldnGarden', scale: 1.8,
    world: { w: 3600, h: 600 }, action: 'Sip', later1: 'day', later2: 'wings',
    sex: 'You are a female.',
    facts: [
      'Jersey tiger moths first turned up in south-east London about 20 years ago.',
      'They have stripy black and cream wings, with bright orange underwings.',
      'They fly in the daytime as well as at night.',
    ],
    how: [
      'Fly by dragging, or with the arrow keys. Let go and you hover.',
      'Hold Sip on four purple buddleia flowers.',
      'The red circle is as far as the cat can reach: go round it, or sneak past while it naps.',
      'A great tit hunts moths! When it spots you, hide in a bush or the ivy until it flies off.',
      'Then hold Lay on the nettles at the end. Two cheeky extras are hidden here!',
    ],
    discoveries: [{ key: 'd_shell', sprite: 'shell', color: '#d8c8a8', fx: 0.34, fy: 0.925 }, { key: 'd_feather', sprite: 'feather', color: '#1c1c1c', band: '#3a3a3a', fx: 0.8, fy: 0.925 }],
    factText: {
      start: 'Jersey tiger moths arrived in south-east London around 2004 and are spreading across the city.',
      day: 'Unlike most moths, Jersey tigers fly by day as well as at night.',
      wings: 'Its stripy forewings hide bright orange underwings.',
      sip: 'Jersey tigers love buddleia, the “butterfly bush”, and share it with butterflies.',
      cat: 'Cats bat at moths that flutter past. This one has done it before.',
      tit: 'Great tits hunt moths and caterpillars. Hide until it flies off!',
      web: 'Garden spiders spin their webs across gaps where insects fly. Wriggle!',
      light: 'Lights muddle moths at night: they turn their backs to the light and end up circling it.',
      nettle: 'She lays her eggs on plants like nettles. Her caterpillars eat nettles, bramble and ground ivy.',
      d_shell: 'An empty snail shell. Song thrushes smash snails on stones to get them out.',
      d_feather: 'A blackbird feather. Blackbirds sing in London gardens from early in the morning.',
      win: 'Eggs laid on the nettles! The tiny caterpillars will hatch, then sleep through the winter.',
    },
    level() {
      const cone = (id, x, y) => ({ id, kind: 'flower', look: 'buddleia', x, y, r: 34, verb: 'Sip', hold: 0.8, pop: 'Nectar!', fact: 'sip' });
      return {
        w: 3600, floor: 560, start: [90, 470],
        solids: [[960, 280, 60, 280, 'wall']],
        ledges: [],
        hides: [[290, 330, 220, 230, 'buddleia'], [930, 280, 120, 280, 'ivy'], [1140, 320, 220, 240, 'buddleia'], [2040, 330, 220, 230, 'buddleia'], [3000, 420, 170, 140, 'bush']],
        people: [{ id: 'dad', x: 2500, pose: 'sleep', face: 1, seed: 4 }],
        spots: [cone('b1', 350, 326), cone('b2', 452, 348),
          { id: 'pants', kind: 'pants', x: 760, y: 330, r: 32, verb: 'Land', hold: 0.6, extra: true, pop: 'You sat on the pants!' },
          cone('b3', 1200, 316), cone('b4', 1302, 340), cone('b5', 2100, 326), cone('b6', 2202, 350),
          { id: 'nose', kind: 'nose', on: 'dad', part: 'nose', r: 30, verb: 'Land', hold: 0.6, extra: true, pop: 'On his nose!', say: 'Snrrk! Achoo!', sound: 'burp' },
          { id: 'nettle', kind: 'nettle', x: 3380, y: 500, r: 46, need: { flower: 4 }, verb: 'Lay', hold: 1.5, goal: true, pop: 'Eggs!', fact: 'nettle' }],
        need: { flower: 4 },
        webs: [{ x: 1850, y: 330, r: 55 }],
        cat: { x: 1600, y: 420 }, lamp: { x: 2800, y: 250 },
        checkpoints: [[1060, 250], [1960, 380], [2620, 460]],
        route: [[350, 326, 'b1'], [452, 348, 'b2'], [760, 230], [990, 226], [1200, 316, 'b3'], [1302, 340, 'b4'], [1600, 230], [1850, 210], [2100, 326, 'b5'], [2202, 350, 'b6'], [2400, 480], [2700, 490], [3050, 480], [3380, 490, 'nettle']],
      };
    },
    start(g) { g.hz.cat = { state: 'awake', t: 0 }; g.hz.dusk = 0; },
    hazards(g, dt) {
      const p = g.player, h = g.hz, L = g.level, cy = p.y - this.P.hh / 2;
      // the great tit, twice
      for (const tx of [1100, 2350]) if (p.x > tx && !h['bird' + tx] && !g.homeSafe) {
        h['bird' + tx] = true; Game.fact('tit'); Sound.play('caught');
        g.toasts.unshift({ text: 'A great tit! Hide in a bush or the ivy until it flies off.', kind: 'hint' }); g.toastT = 0;
        g.preds.push(ldnHunter(g, { sprite: 'greatTit', name: 'great tit', from: p.x + (p.x > 1700 ? -520 : 520), y: 120, air: true, speed: 230, alert: 1.6, chase: 4, reach: 22 }));
      }
      // the cat on the fence: awake, it swipes at anything inside its reach; then it naps for a bit
      const c = h.cat, near = Math.hypot(p.x - L.cat.x, cy - (L.cat.y - 30));
      c.t += dt;
      if (c.state === 'awake' && near < this.CAT_R && p.invuln <= 0 && !g.homeSafe) { c.state = 'alert'; c.t = 0; Sound.play('oi'); Game.fact('cat'); }
      else if (c.state === 'awake' && c.t > 5.5) { c.state = 'asleep'; c.t = 0; }
      else if (c.state === 'asleep' && c.t > 4.5) { c.state = 'awake'; c.t = 0; }
      else if (c.state === 'alert' && c.t > 0.8) {
        c.state = 'swipe'; c.t = 0; Sound.play('tap');
        if (near < this.CAT_R + 8 && p.invuln <= 0 && !g.hidden) Game.caught({ name: 'cat', caughtText: 'Swipe! The cat’s paw got you. Back to the last safe spot.' });
        else Game.pop(L.cat.x, L.cat.y - 90, 'Missed!', '#fff');
      } else if (c.state === 'swipe' && c.t > 1.4) { c.state = 'awake'; c.t = 0; }
      // dusk falls over the far end of the garden, and the kitchen light comes on
      if (p.x > 2300 || h.dusk > 0) h.dusk = Math.min(1, h.dusk + dt / 6);
      const d = Math.hypot(L.lamp.x - p.x, L.lamp.y - cy);
      if (h.dusk > 0.4 && d < 250 && d > 1 && !g.homeSafe && !(g.shooed > 0)) {
        p.x += (L.lamp.x - p.x) / d * 55 * dt; p.y += (L.lamp.y - cy) / d * 55 * dt;
        if (!g.toldLamp) { g.toldLamp = true; Game.hint('The light is pulling you in! Steer away from it.'); }
        if (d < 30) { ldnBlow(g, -1, 2600); Game.pop(p.x, p.y - 34, 'Bonk!', '#fff'); Sound.play('boing'); Game.fact('light'); }
      }
    },
    CAT_R: 95,
    hud(g) { const n = Math.min(4, g.counts.flower || 0); setHud(n < 4 ? 'Flowers: ' + n + ' / 4' : 'Lay your eggs on the nettles', this.stat(g)); },
  }),

  // ------------------------------------------------------------------ 5. Stag beetle, Richmond Park
  // Walk and climb the logs, wrestle the male in your way off his log, fly the pond, pick your way across the path
  // between the joggers' feet, hide from a magpie and then a fox, and find the female on the old stump.
  ldn_stag: ldnPart({
    id: 'ldn_stag', kind: 'stag', stage: 'Stag beetle', place: 'Richmond Park, a warm evening', sprite: 'stagBeetle', bg: 'ldnRichmond', scale: 1.6,
    world: { w: 3800, h: 600 }, action: 'Fly', later1: 'jaws', later2: 'noeat',
    sex: 'You are a male.',
    facts: [
      'Stag beetles are Britain’s biggest beetles, and London is one of the best places to find them.',
      'Only the males have the huge jaws, like a stag’s antlers. They wrestle with them.',
      'On warm summer evenings the males fly off to look for females.',
    ],
    how: [
      'Walk left and right by dragging, or with the arrow keys. Walk into a log and you climb it.',
      'Press Fly to take off. You buzz for a moment first, then fly a short, wobbly way. That’s how to cross the pond.',
      'A male on a log? Lock jaws and tap Push fast to tip him off.',
      'On the path, red marks show where the joggers’ feet will land. When a magpie or the fox spots you, hide in the bracken.',
      'Find the female on the old stump at the end. Two cheeky extras are hidden here!',
    ],
    discoveries: [{ key: 'd_acorn', sprite: 'acorn', fx: 0.2, fy: 0.927 }, { key: 'd_antler', sprite: 'antler', fx: 0.55, fy: 0.925 }],
    factText: {
      start: 'Stag beetles are Britain’s biggest beetles. London is one of the best places in the country to find them.',
      jaws: 'Only males have the big jaws, like a stag’s antlers. They use them to wrestle other males.',
      wrestle: 'Flipped him! A male tries to get his jaws under a rival and tip him off the log.',
      sap: 'Adults can’t chew. They lap up sweet tree sap and fruit juice with a feathery tongue.',
      larva: 'He spent at least three years as a grub, eating rotting wood underground.',
      noeat: 'Adult stag beetles can’t eat solid food. They live on fat they stored as grubs.',
      dusk: 'On warm summer evenings, males fly to look for females. Their flight is slow and clumsy.',
      feet: 'Lots of stag beetles get trodden on or run over on paths and roads. Watch your step in summer!',
      magpie: 'Magpies and crows catch stag beetles out in the open. Hide in the bracken!',
      fox: 'Foxes eat stag beetles too. London has lots of foxes, in parks and gardens.',
      d_acorn: 'An acorn. Richmond Park has hundreds of very old oak trees.',
      d_antler: 'A deer’s old antler. Red and fallow deer live in Richmond Park, and grow new antlers every year.',
      win: 'You found a female! She’ll lay her eggs by buried dead wood, where the grubs will grow for years.',
    },
    level() {
      return {
        w: 3800, floor: 560, start: [90, 560],
        solids: [[480, 470, 200, 90, 'bark'], [1000, 430, 420, 130, 'bark'], [1850, 400, 140, 160, 'bark'], [3050, 440, 260, 120, 'bark'], [3460, 380, 180, 180, 'bark']],
        ledges: [],
        hides: [[760, 440, 170, 120, 'bracken'], [2020, 430, 190, 130, 'bracken'], [2780, 430, 200, 130, 'bracken']],
        spots: [{ id: 'sap', kind: 'sap', x: 300, y: 540, r: 40, verb: 'Sip', hold: 1, extra: true, pop: 'Sweet sap!', fact: 'sap' },
          { id: 'female', kind: 'female', x: 3550, y: 368, r: 46, need: { won: 1 }, goal: true, pop: 'A female!', fact: 'larva' }],
        need: { won: 1 },
        pond: [1540, 1690], path: [2300, 2700],
        rivals: [{ id: 'm1', x: 1260, y: 430 }, { id: 'm2', x: 3200, y: 440, extra: true }],
        checkpoints: [[960, 560], [1760, 560], [2250, 560], [2990, 560]],
        route: [[580, 470], [845, 560], [1205, 430], [1400, 430], [1760, 560], [1920, 400], [2115, 560], [2290, 560], [2720, 560], [2880, 560], [3550, 380, 'female']],
      };
    },
    start(g) {
      g.rivals = g.level.rivals.map(r => Object.assign({ face: -1, state: 'wait', t: 0, ease: 0 }, r));
      g.wrestle = null; g.steps = []; g.jogT = 3;
    },
    busy(g) { return !!g.wrestle; },
    reset(g) { g.wrestle = null; for (const r of g.rivals) if (r.state === 'fight') r.state = 'wait'; },
    tick(g, dt, input) {
      const p = g.player, L = g.level;
      // a cheer the first time he gets up onto each log or stump
      if (p.onGround && p.y < L.floor - 1) {
        const s = L.solids.find(q => Math.abs(q[1] - p.y) < 1 && p.x > q[0] && p.x < q[0] + q[2]);
        if (s && !s.up) { s.up = true; Game.pop(p.x, p.y - 40, s === L.solids[L.solids.length - 1] ? 'Up on the stump!' : 'Up on the log!', '#fff'); }
      }
      // the pond: too wet to walk
      if (p.y >= L.floor - 1 && p.x > L.pond[0] + 10 && p.x < L.pond[1] - 10) {
        p.x = L.pond[0] - 70; p.vx = 0; Sound.play('splat'); Game.pop(p.x, p.y - 40, 'Splash!', '#cfe6ff');
        Game.hint('Too wet to walk! Press Fly, then steer across the pond.');
      }
      // rival males: walk up to one on his log and you lock jaws
      for (const r of g.rivals) {
        r.t += dt;
        if (r.state === 'wait' && !g.wrestle && p.onGround && Math.abs(p.y - r.y) < 3 && Math.abs(p.x - r.x) < 58 && !(p.flyT > 0)) {
          r.state = 'fight'; r.m = 0.5; r.t = 0; r.wind = 0; r.taps = 0; g.wrestle = r;
          p.x = r.x - 50; p.face = 1; p.vx = 0;
          g.toasts.unshift({ text: 'A rival male! Tap Push fast to tip him off the log.', kind: 'hint' }); g.toastT = 0; Game.fact('jaws');
        } else if (r.state === 'lost') { r.x += 140 * dt; r.vy = (r.vy || -260) + 900 * dt; r.y += r.vy * dt; r.spin = (r.spin || 0) + dt * 9; if (r.y > L.floor + 60) r.state = 'gone'; }
        else if (r.state === 'rest' && r.t > 1.6) r.state = 'wait';
      }
      const r = g.wrestle;
      if (r) {
        setAction('Push', true);
        p.x = r.x - 50 + (0.5 - r.m) * -30; p.vx = 0; p.face = 1;
        if (input.pressed) { r.m += 0.11 + r.ease; r.taps++; Sound.play('tap'); }
        r.m -= 0.1 * dt;
        r.wind += dt;                                               // every couple of seconds he heaves
        if (r.wind > 2.2 && !r.heave) { r.heave = true; r.taps = 0; Game.pop(r.x, r.y - 60, 'He’s heaving!', '#fff'); }
        if (r.wind > 2.9) { r.wind = 0; r.heave = false; if (r.taps < 2) { r.m -= 0.2; g.shake = 0.12; } else Game.pop(p.x, p.y - 50, 'Held him!', '#fff'); }
        p.progress = clamp(r.m, 0, 1);
        if (r.m >= 1) {
          r.state = 'lost'; g.wrestle = null; g.counts.won = (g.counts.won || 0) + 1;
          Sound.play('score'); Game.pop(r.x, r.y - 60, 'Flipped him!', '#ffd23f'); Game.fact('wrestle');
          if (r.extra) { g.extras++; Game.pop(r.x, r.y - 86, 'Cheeky! ★', '#ffd23f'); Game.burst(r.x, r.y, '#ffd23f', 18); }
        } else if (r.m <= 0) {
          r.state = 'rest'; r.t = 0; r.ease += 0.03; g.wrestle = null;
          p.x = r.x - 150; p.vy = -200; Sound.play('caught'); Game.pop(p.x, p.y - 50, 'He tipped you off! Try again.', '#fff');
        }
      }
    },
    hazards(g, dt) {
      const p = g.player, L = g.level;
      if (p.x > 650 && !g.hz.magpie && !g.homeSafe) {
        g.hz.magpie = true; Game.fact('magpie'); Sound.play('caught');
        g.toasts.unshift({ text: 'A magpie! When it spots you, hide in the bracken.', kind: 'hint' }); g.toastT = 0;
        g.preds.push(ldnHunter(g, { sprite: 'euMagpie', name: 'magpie', from: p.x + 480, y: 548, speed: 130, alert: 1.4, chase: 5, reach: 26, scale: 1.7 }));
      }
      if (p.x > 2730 && !g.hz.fox && !g.homeSafe) {
        g.hz.fox = true; Game.fact('fox'); Sound.play('caught');
        g.toasts.unshift({ text: 'A fox! Hide in the bracken until it trots off.', kind: 'hint' }); g.toastT = 0;
        g.preds.push(ldnHunter(g, { sprite: 'fox', name: 'fox', from: p.x + 520, y: 540, speed: 160, alert: 1.6, chase: 4, reach: 30, scale: 1.5 }));
      }
      // joggers on the path: each footfall is marked on the ground a moment before the trainer comes down
      if (p.x > L.path[0] - 500 && p.x < L.path[1] + 300 && (g.jogT -= dt) <= 0) {
        g.jogT = 2.6 + Math.random() * 1.6;
        const x0 = L.path[1] - 20 - Math.random() * 60;
        for (let k = 0; k < 4; k++) g.steps.push({ x: x0 - k * 124, t: -0.34 * k - 0.9, hit: false });   // t < 0: on its way; 0: lands
        if (!g.toldFeet && p.x > L.path[0] - 200) { g.toldFeet = true; Game.fact('feet'); g.toasts.unshift({ text: 'Joggers! Keep off the red marks: a foot is about to land there.', kind: 'hint' }); g.toastT = 0; }
      }
      for (const s of g.steps) {
        s.t += dt;
        if (s.t >= 0 && !s.hit) {
          s.hit = true; g.shake = Math.max(g.shake, 0.08); Sound.play('tap');
          if (p.y >= L.floor - 2 && Math.abs(p.x - s.x) < 24 + this.P.hw && p.invuln <= 0 && !g.homeSafe) Game.caught({ name: 'trainer', caughtText: 'Careful! A jogger’s foot came down. Back to the last safe spot.' });
        }
      }
      g.steps = g.steps.filter(s => s.t < 0.5);
    },
    hud(g) { const p = g.player; setHud(g.wrestle ? 'Push! Tip him off!' : g.counts.won ? 'Find the female' : 'Tip the rival off his log', (p.warmT > 0 ? 'Warming up… · ' : p.flyT > 0 ? 'Flying! · ' : '') + this.stat(g)); },
  }),
});

// London's places: one pin on the London map and one Bug Book section a level, in the order the bus tour plays
// them. pin: on the 960 x 600 map painted by drawLondonMap (js/art-london.js).
const LDN_BUGS = [
  { id: 'l_bee', stage: 'ldn_bee', name: 'Buff-tailed Bumblebee', sci: 'Bombus terrestris', place: 'Regent’s Park', pin: { x: 330, y: 236 } },
  { id: 'l_wasp', stage: 'ldn_wasp', name: 'Common Wasp', sci: 'Vespula vulgaris', place: 'A café garden, Islington', pin: { x: 640, y: 232 } },
  { id: 'l_mosquito', stage: 'ldn_mosquito', name: 'Underground Mosquito', sci: 'Culex pipiens form molestus', place: 'The Tube', pin: { x: 478, y: 360 } },
  { id: 'l_moth', stage: 'ldn_moth', name: 'Jersey Tiger Moth', sci: 'Euplagia quadripunctaria', place: 'A garden in south-east London', pin: { x: 704, y: 506 } },
  { id: 'l_stag', stage: 'ldn_stag', name: 'Stag Beetle', sci: 'Lucanus cervus', place: 'Richmond Park', pin: { x: 215, y: 522 } },
];
for (const b of LDN_BUGS) {
  Bugs.push({ id: b.id, name: b.name, sci: b.sci, place: b.place, sprite: Missions[b.stage].sprite, pin: b.pin, hub: 'london', kind: 'sandbox', stages: [b.stage] });
  Missions[b.stage].bug = b.id;
}
const LDN_TOUR = LDN_BUGS.map(b => b.stage);
// What the bus's card says at each stop
const LDN_STOP = {
  ldn_bee: 'Regent’s Park. You’re a buff-tailed bumblebee!',
  ldn_wasp: 'a café garden. Now you’re a common wasp!',
  ldn_mosquito: 'down in the Tube. Now you’re an Underground mosquito!',
  ldn_moth: 'a garden in south-east London. Now you’re a Jersey tiger moth!',
  ldn_stag: 'Richmond Park at dusk. Now you’re a stag beetle!',
};
finishMissions();
