'use strict';
// London: a hidden run across one late-July day in London, in five parts, a different real London bug in each:
// a buff-tailed bumblebee in Regent's Park in the morning, a common wasp in a café garden at midday, the Underground
// mosquito in the Tube, a Jersey tiger moth in a south-east London garden in the afternoon, and a stag beetle in
// Richmond Park at dusk. Found by tapping the plane at Perth Airport on the Perth map (js/ui.js). Side-on: steer to
// fly (or walk, for the stag beetle), with the physics in js/platform.js and the art in js/art-london.js. Every fact
// is sourced in docs/facts.md (London); the pretend parts are listed there too.

Bugs.push({ id: 'london', name: 'London', sci: 'Five real London bugs', place: 'London, England', sprite: 'londonIcon',
  hub: 'london', kind: 'sandbox', run: true, stages: ['ldn_bee', 'ldn_wasp', 'ldn_mosquito', 'ldn_moth', 'ldn_stag'] });

// How each bug moves. Fliers steer to fly; the stag beetle walks, climbs bark and flies a short, clumsy way.
const LDN_PHYS = {
  bee: { hw: 9, hh: 14, fly: 190, accel: 5, sink: 45 },
  wasp: { hw: 9, hh: 12, fly: 210, accel: 6, sink: 50 },
  mosquito: { hw: 7, hh: 10, fly: 160, accel: 5, sink: 35 },
  moth: { hw: 12, hh: 14, fly: 175, accel: 4, sink: 40 },
  stag: { hw: 18, hh: 16, walk: 75, grav: 900, climb: 55, flyV: 120, flyLift: 90, flySink: 30, warm: 0.6, flyT: 2.4 },
};

// A London part: the shared rules, with each part's own level, tasks, hazards and words in d.
function ldnPart(d) {
  return Object.assign({
    bug: 'london', view: 'side', world: { w: 3000, h: 600 }, noNet: true, gentle: true, zoom: [1.1, 1.35], toastTop: true,
    radius: 10, speed: 0, home: { x: 80, y: 500, r: 1, label: '' },
    get P() { return LDN_PHYS[this.kind]; },

    setup(g) {
      const L = g.level = this.level(), P = this.P, p = g.player;
      Object.assign(p, { x: L.start[0], y: L.start[1], vx: 0, vy: 0, acc: 0, face: 1, angle: 0, flat: true, r: P.hw, onGround: false, flyT: 0, warmT: 0 });
      g.home = { x: L.start[0], y: L.start[1], r: 1, label: '' };
      g.cp = 0; g.wp = 0; g.look = 1; g.counts = {}; g.hz = {};
      g.fronts = (L.hides || []).map(h => LondonArt.leaves(h));   // the leaves (or pillar) drawn in front of a hidden bug
      if (this.start) this.start(g);
      Game.later(5, () => Game.fact(this.later1));
      Game.later(16, () => Game.fact(this.later2));
    },

    // The way the bug is steered: from the finger to the bug's middle, with a still zone so a flier can hover
    move(g, dt, dx, dy) {
      const p = g.player, P = this.P, L = g.level;
      let hover = false;
      if (Input.target && !Input.keys.size) {
        const z = Game.zoom || 1, tx = Input.target.x / z + g.cam.x, ty = Input.target.y / z + g.cam.y;
        const cx = p.x, cy = p.y - P.hh / 2, d = Math.hypot(tx - cx, ty - cy);
        if (d < 30) { dx = 0; dy = 0; hover = !P.walk; } else { dx = (tx - cx) / d; dy = (ty - cy) / d; }
      }
      const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len; }
      if (P.walk && !(p.flyT > 0)) dx = Math.abs(dx) < 0.2 ? 0 : Math.sign(dx);
      Plat.move(L, P, p, dt, dx, dy, { hover, perch: g.perch, weak: this.weak ? this.weak(g) : false });
      if (Math.abs(p.vx) > 8) p.face = p.vx > 0 ? 1 : -1;
      p.angle = 0;
      p.flying = P.walk ? (p.flyT > 0 || p.warmT > 0) : !p.onGround;
      p.moving = P.walk ? (p.onGround && Math.abs(p.vx) > 5) || p.climbing : p.flying;
      p.landed = !p.flying;
      g.look += (p.face - g.look) * Math.min(1, dt * 2);
    },
    camera(g, vw) { const p = g.player; return { x: p.x + g.look * vw * 0.18, y: p.y - 40 }; },

    // Is a task's need met? (the nest needs four flowers' pollen first, and so on)
    ready(g, s) { for (const k in s.need || {}) if ((g.counts[k] || 0) < s.need[k]) return false; return true; },
    met(g, kind) { const L = g.level; return (g.counts[kind] || 0) >= ((L.need || {})[kind] || 99); },
    spotHere(g) {
      const p = g.player, cy = p.y - this.P.hh / 2;
      return g.level.spots.find(s => !s.done && !s.moving && this.ready(g, s) && Math.hypot(s.x - p.x, s.y - cy) < s.r) ||
        g.level.spots.find(s => !s.done && s.moving && this.ready(g, s) && Math.hypot(s.x - p.x, s.y - cy) < s.r);
    },
    // The next place the arrow points to (and the test bot heads for)
    waypoint(g) {
      const L = g.level, p = g.player;
      while (g.wp < L.route.length) {
        const r = L.route[g.wp], s = r[2] && L.spots.find(q => q.id === r[2]);
        if (s ? s.done || (!s.goal && this.met(g, s.kind)) : p.x >= r[0] - 40) g.wp++; else break;
      }
      const r = L.route[Math.min(g.wp, L.route.length - 1)], s = r[2] && L.spots.find(q => q.id === r[2]);
      return s ? { x: s.x, y: s.y, spot: s } : { x: r[0], y: r[1] };
    },
    goalPoint(g) { return g.homeSafe ? null : this.waypoint(g); },

    update(g, dt, input) {
      const p = g.player, L = g.level, P = this.P;
      g.perch = false;
      g.hidden = Plat.hidden(L, p, P.hh);
      // safe spots along the way: getting caught brings you back to the last one
      while (g.cp < L.checkpoints.length && p.x > L.checkpoints[g.cp][0]) {
        const c = L.checkpoints[g.cp++];
        g.home = { x: c[0], y: c[1], r: 1, label: '' };
        Game.pop(p.x, p.y - 40, 'Safe spot', '#fff');
      }
      for (const s of L.spots) if (s.moving) { s.ph = (s.ph || 0) + dt; s.x = s.ax + Math.cos(s.ph * 1.7) * 26; s.y = s.ay + Math.sin(s.ph * 2.3) * 16; }
      const s = g.homeSafe ? null : this.spotHere(g);
      g.spot = s;
      if (P.walk && !s) {
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
      if (this.tick) this.tick(g, dt);
    },
    complete(g, s) {
      s.done = true; s.t = 0;
      g.counts[s.kind] = (g.counts[s.kind] || 0) + 1;
      Sound.play(s.goal ? 'win' : 'score');
      if (s.pop) Game.pop(s.x, s.y - 30, s.pop, '#ffd23f');
      if (s.fact) Game.fact(s.fact);
      if (this.done) this.done(g, s);
      if (s.goal) g.homeSafe = true;
    },
    onCaught(g) { const p = g.player; p.vx = 0; p.vy = 0; p.acc = 0; p.flyT = 0; p.warmT = 0; p.push = 0; for (const s of g.level.spots) s.t = 0; },
    caughtText(pr) { return pr.caughtText || 'Caught by a ' + pr.name + '! Back to the last safe spot.'; },

    drawBuild(ctx, g) { LondonArt.spots(ctx, g, this); },
    drawFront(ctx, g) { LondonArt.front(ctx, g, this); },
    won(g) { return !!g.homeSafe; },
  }, d);
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
  ldn_bee: ldnPart({
    id: 'ldn_bee', kind: 'bee', stage: 'Bumblebee', place: 'Regent’s Park, morning', sprite: 'bumblebee', bg: 'ldnPark', scale: 2,
    action: 'Sip', later1: 'pollen', later2: 'winter',
    sex: 'You are a female worker.',
    facts: [
      'Buff-tailed bumblebees are among the commonest bumblebees in London’s parks and gardens.',
      'A bumblebee needs nectar for energy. Flying uses a lot of it.',
      'The London run is a pretend day out: one summer day, five real London bugs, a different one in each part.',
    ],
    how: [
      'This is side-on! Drag (or use the arrow keys) and you fly that way. Let go and you drift down.',
      'Fly to a flower and hold Sip. Nectar fills your fuel, and you collect pollen. Four flowers fill your baskets.',
      'Some flowers hide a crab spider. Look before you land!',
      'Then fly down into your nest, an old mouse hole in the bank at the end.',
    ],
    discoveries: [{ key: 'd_feather', sprite: 'feather', color: '#8a9098', band: '#4a5058', fx: 0.27, fy: 0.925 }, { key: 'd_nut', sprite: 'nutShell', fx: 0.6, fy: 0.925 }],
    factText: {
      start: 'You’re a buff-tailed bumblebee worker, collecting nectar and pollen for your nest.',
      fuel: 'A bumblebee keeps nectar in her honey stomach. It fuels her wings. Run out, and she can’t fly up.',
      pollen: 'She packs pollen into baskets on her back legs and carries it home for the young bees.',
      crab: 'A flower crab spider sits still on a flower and grabs bees that land there.',
      nest: 'Buff-tailed bumblebees often nest underground, in an old mouse or vole hole.',
      winter: 'In London, some buff-tailed bumblebees keep working all winter, on garden shrubs like Mahonia.',
      d_feather: 'A pigeon feather. Feral pigeons live all over London.',
      d_nut: 'A nibbled nutshell. Grey squirrels, first brought from North America, live in London’s parks.',
      win: 'Home with full pollen baskets! The pollen feeds the young bees growing in the nest.',
    },
    level() {
      const flower = (id, x, y, kind, crab) => ({ id, kind: 'flower', look: kind, x, y, r: 34, verb: 'Sip', hold: 1, pop: crab ? '' : 'Nectar!', fact: 'fuel', crab: !!crab });
      return {
        w: 3000, floor: 560, start: [90, 470],
        solids: [[1180, 430, 220, 130, 'hedge'], [1900, 150, 70, 410, 'trunk'], [2820, 470, 180, 90, 'bank']],
        ledges: [[600, 470, 170]],
        hides: [],
        spots: [flower('f1', 320, 498, 'lavender'), flower('f2', 520, 420, 'foxglove'), flower('f3', 900, 455, 'rose'), flower('f4', 1100, 470, 'daisy', true),
          flower('f5', 1550, 440, 'foxglove'), flower('f6', 1720, 480, 'daisy', true), flower('f7', 2250, 460, 'lavender'), flower('f8', 2560, 430, 'rose'),
          { id: 'nest', kind: 'nest', x: 2795, y: 540, r: 40, need: { flower: 4 }, goal: true, pop: 'Home!', fact: 'nest' }],
        need: { flower: 4 },
        checkpoints: [[1000, 480], [2000, 480]],
        route: [[320, 490, 'f1'], [520, 410, 'f2'], [900, 445, 'f3'], [1290, 380], [1550, 430, 'f5'], [1860, 100], [1935, 100], [2010, 120], [2250, 450, 'f7'], [2560, 420, 'f8'], [2795, 540, 'nest']],
      };
    },
    start(g) { g.fuel = 0.7; },
    weak(g) { return g.fuel <= 0; },
    tick(g, dt) {
      const p = g.player;
      if (p.flying && !g.perch) g.fuel = Math.max(0, g.fuel - dt / 30);
      if (g.fuel <= 0 && !g.toldFuel) { g.toldFuel = true; Game.hint('Out of fuel! Drift down to a flower and Sip.'); }
    },
    done(g, s) {
      if (s.kind === 'flower') {
        g.fuel = Math.min(1, g.fuel + 0.45);
        g.player.pollen = g.counts.flower;   // her pollen baskets show it
        if (g.counts.flower === 4) { g.toasts.unshift({ text: 'Your pollen baskets are full! Fly home to the nest in the bank.', kind: 'hint' }); g.toastT = 0; }
      }
    },
    hud(g) {
      const n = Math.min(4, g.counts.flower || 0), bars = Math.round(g.fuel * 5);
      setHud(n < 4 ? 'Flowers: ' + n + ' / 4' : 'Fly home to the nest!', 'Fuel ' + '▮'.repeat(bars) + '▯'.repeat(5 - bars));
    },
  }),

  // ------------------------------------------------------------------ 2. Common wasp, a café garden
  ldn_wasp: ldnPart({
    id: 'ldn_wasp', kind: 'wasp', stage: 'Wasp', place: 'A café garden, midday', sprite: 'commonWasp', bg: 'ldnCafe', scale: 2,
    action: 'Scrape', later1: 'paper', later2: 'sweet',
    sex: 'You are a female worker. All wasp workers are female.',
    facts: [
      'Common wasps live all over London. Each nest has one queen and lots of workers.',
      'Wasps catch lots of garden pests, like caterpillars and flies, to feed their young.',
      'A wasp’s nest is made of paper, and the wasps make the paper themselves.',
    ],
    how: [
      'Fly by dragging, or with the arrow keys.',
      'Hold Scrape on the fence posts to chew wood for the nest. Do two.',
      'Catch the fly buzzing by the bin: get close and press Catch.',
      'A hand swats at you! When you see its shadow, fly away or hide under a table. Then fly home to the nest under the shed roof.',
    ],
    discoveries: [{ key: 'd_leaf', sprite: 'deadLeaf', fx: 0.12, fy: 0.925 }, { key: 'd_feather', sprite: 'feather', color: '#8a6a48', band: '#4a3424', fx: 0.77, fy: 0.925 }],
    factText: {
      start: 'You’re a common wasp worker. Your job: wood for the nest, and food for the young.',
      paper: 'Wasps chew wood into pulp and spread it thin. It dries into paper: that’s what the nest is made of.',
      grub: 'Wasp grubs need meat, so the workers hunt insects and bring them back to the nest.',
      sweet: 'In return, the grubs give the workers a sweet drop to drink.',
      swat: 'Late in summer, wasps look for sweet food, so they visit cafés and picnics.',
      d_leaf: 'A London plane leaf. Plane trees line many of London’s streets.',
      d_feather: 'A house sparrow feather. Sparrows have become much rarer in London.',
      win: 'Home to the paper nest! By late summer a big nest can hold thousands of wasps.',
    },
    level() {
      const post = (id, x, y) => ({ id, kind: 'post', x, y, r: 34, verb: 'Scrape', hold: 1.2, pop: 'Wood pulp!', fact: 'paper' });
      return {
        w: 3000, floor: 560, start: [90, 470],
        solids: [[1000, 430, 170, 12, 'table'], [1480, 450, 90, 110, 'bin'], [1760, 430, 170, 12, 'table'], [2720, 300, 280, 260, 'shed']],
        ledges: [[955, 480, 40], [1175, 480, 40], [1715, 480, 40], [1935, 480, 40]],
        hides: [[1000, 442, 170, 118, 'table'], [1760, 442, 170, 118, 'table']],
        spots: [post('p1', 260, 470), post('p2', 640, 450),
          { id: 'fly', kind: 'fly', ax: 1525, ay: 400, x: 1525, y: 400, r: 38, moving: true, verb: 'Catch', pop: 'Got it!', fact: 'grub' },
          { id: 'nest', kind: 'nest', x: 2690, y: 330, r: 40, need: { post: 2, fly: 1 }, goal: true, pop: 'Home!', fact: 'sweet' }],
        need: { post: 2, fly: 1 },
        checkpoints: [[900, 450], [2000, 450]],
        route: [[260, 465, 'p1'], [640, 445, 'p2'], [900, 400], [1085, 500], [1525, 400, 'fly'], [1845, 500], [2300, 350], [2690, 330, 'nest']],
      };
    },
    // A hand swats every few seconds while you're among the tables: its shadow warns first
    hazards(g, dt) {
      const p = g.player, h = g.hz, cy = p.y - this.P.hh / 2;
      if (h.swat) {
        h.swat.t += dt;
        if (h.swat.t >= 1 && !h.swat.hit) {
          h.swat.hit = true; g.shake = 0.15; Sound.play('tap');
          if (!g.hidden && p.invuln <= 0 && Math.hypot(p.x - h.swat.x, cy - h.swat.y) < 55) Game.caught({ name: 'hand', caughtText: 'Swatted! Back to the last safe spot.' });
          else Game.pop(h.swat.x, h.swat.y - 34, 'Missed!', '#fff');
        }
        if (h.swat.t >= 1.5) { h.swat = null; h.next = 5 + Math.random() * 2; }
      } else if (p.x > 850 && p.x < 2050 && !g.homeSafe) {
        h.next = (h.next === undefined ? 2.5 : h.next) - dt;
        if (h.next <= 0 && p.invuln <= 0) {
          h.swat = { x: p.x, y: cy, t: 0 }; Sound.play('caught'); Game.fact('swat');
          if (!g.toldSwat) { g.toldSwat = true; g.toasts.unshift({ text: 'Look out, a hand! Fly away from its shadow, or hide under a table.', kind: 'hint' }); g.toastT = 0; }
        }
      }
    },
    hud(g) {
      const w = Math.min(2, g.counts.post || 0), f = g.counts.fly ? 1 : 0;
      setHud(w < 2 || !f ? 'Wood: ' + w + ' / 2 · Fly: ' + f + ' / 1' : 'Fly home to the nest!', '');
    },
  }),

  // ------------------------------------------------------------------ 3. The Underground mosquito
  ldn_mosquito: ldnPart({
    id: 'ldn_mosquito', kind: 'mosquito', stage: 'Underground mosquito', place: 'A Tube platform and tunnel', sprite: 'ugMosquito', bg: 'ldnTube', scale: 2.4,
    action: 'Bite', later1: 'origin', later2: 'eggs', zoom: [1.15, 1.4],
    sex: 'You are a female. Only females bite.',
    facts: [
      'A mosquito lives deep in the London Underground, in the warm tunnels.',
      'Only the females bite. They use the blood to make eggs.',
      'It lives in the Tube, but scientists found it didn’t start there.',
      'The wind from passing trains is real. Being blown all the way back is pretend.',
    ],
    how: [
      'Fly by dragging, or with the arrow keys. Mind the ceiling!',
      'Land on someone’s ankle and hold Bite.',
      'When a train comes, hide behind a pillar or in a little alcove in the tunnel wall.',
      'Then fly along the tunnel to the puddle and hold Lay.',
    ],
    discoveries: [{ key: 'd_ticket', sprite: 'oldTicket', fx: 0.2, fy: 0.658 }, { key: 'd_mouse', sprite: 'mouseSide', fx: 0.75, fy: 0.925 }],
    factText: {
      start: 'This mosquito lives in the London Underground. It bites people and rats, and breeds in water in the tunnels.',
      origin: 'It lives in the Tube, but it didn’t start there. Its family came from the Mediterranean or Middle East long ago.',
      eggs: 'She can lay her first eggs without any blood. A blood meal lets her make more.',
      train: 'Moving trains push air through the tunnels, so a wind blows along the platform.',
      raft: 'She lays her eggs together in a little raft that floats on the water.',
      d_ticket: 'An old paper ticket. The world’s first underground railway opened in London in 1863.',
      d_mouse: 'A house mouse. Mice live in the Underground, eating the crumbs people drop.',
      win: 'Eggs laid! In the warm tunnels, these mosquitoes can breed all year round.',
    },
    level() {
      const ankle = (id, x) => ({ id, kind: 'ankle', x, y: 384, r: 30, verb: 'Bite', hold: 1.5, pop: 'Blood!', fact: 'eggs' });
      return {
        w: 3000, floor: 560, start: [90, 380],
        solids: [[0, 0, 3000, 70, 'ceiling'], [0, 400, 1650, 160, 'platform']],
        ledges: [[1700, 250, 1300]],
        hides: [[560, 110, 50, 290, 'pillar'], [1000, 110, 50, 290, 'pillar'], [1440, 110, 50, 290, 'pillar'], [2050, 400, 70, 160, 'alcove'], [2450, 400, 70, 160, 'alcove']],
        spots: [ankle('a1', 380), ankle('a2', 800), ankle('a3', 1250),
          { id: 'puddle', kind: 'puddle', x: 2750, y: 552, r: 40, need: { ankle: 1 }, verb: 'Lay', hold: 1.5, goal: true, pop: 'Eggs!', fact: 'raft' }],
        need: { ankle: 1 },
        checkpoints: [[1000, 300], [2000, 300]],
        route: [[380, 375, 'a1'], [585, 250], [1025, 250], [1465, 250], [1700, 300], [2085, 480], [2485, 480], [2750, 545, 'puddle']],
      };
    },
    done(g, s) { if (s.kind === 'ankle') g.player.blood = 1; },   // a full, red tummy
    // A train every 22 seconds: a rumble and lights first, then its rush of air (blowing you back is pretend)
    hazards(g, dt) {
      const p = g.player, h = g.hz;
      if (h.trainT === undefined) h.trainT = 10;
      h.trainT -= dt;
      if (h.trainT <= 3 && !h.warned) {
        h.warned = true; Sound.play('caught'); Game.fact('train');
        g.toasts.unshift({ text: 'A train is coming! Hide behind a pillar or in an alcove.', kind: 'hint' }); g.toastT = 0;
      }
      if (h.trainT <= 0) {
        h.pass = (h.pass || 0) + dt; g.shake = Math.max(g.shake, 0.06);
        if (!h.hit && h.pass > 0.4) { h.hit = true; if (!g.hidden && p.invuln <= 0 && !g.homeSafe) Game.caught({ name: 'train', caughtText: 'Whoosh! The train’s rush of air blew you back.' }); }
        if (h.pass >= 1.6) { h.trainT = 22; h.pass = 0; h.warned = false; h.hit = false; }
      }
    },
    hud(g) {
      const t = g.hz.trainT, soon = t !== undefined && t < 3 && t > 0;
      setHud(g.counts.ankle ? 'Lay your eggs in the puddle' : 'Bite an ankle', soon ? 'Train coming!' : '');
    },
  }),

  // ------------------------------------------------------------------ 4. Jersey tiger moth, a south-east London garden
  ldn_moth: ldnPart({
    id: 'ldn_moth', kind: 'moth', stage: 'Jersey tiger moth', place: 'A garden in south-east London, afternoon', sprite: 'tigerMoth', bg: 'ldnGarden', scale: 1.8,
    action: 'Sip', later1: 'day', later2: 'wings',
    sex: 'You are a female.',
    facts: [
      'Jersey tiger moths first turned up in south-east London about 20 years ago.',
      'They have stripy black and cream wings, with bright orange underwings.',
      'They fly in the daytime as well as at night.',
    ],
    how: [
      'Fly by dragging, or with the arrow keys.',
      'Hold Sip on three flowers to drink nectar.',
      'A great tit hunts moths! When it spots you, hide in a bush or the ivy until it flies off.',
      'Then lay your eggs on the nettles at the end of the garden: hold Lay.',
    ],
    discoveries: [{ key: 'd_shell', sprite: 'shell', color: '#d8c8a8', fx: 0.4, fy: 0.925 }, { key: 'd_feather', sprite: 'feather', color: '#1c1c1c', band: '#3a3a3a', fx: 0.85, fy: 0.925 }],
    factText: {
      start: 'Jersey tiger moths arrived in south-east London around 2004 and are spreading across the city.',
      day: 'Unlike most moths, Jersey tigers fly by day as well as at night.',
      wings: 'Its stripy forewings hide bright orange underwings.',
      sip: 'Adult Jersey tigers sip nectar from garden flowers.',
      tit: 'Great tits hunt moths and caterpillars. Hide until it flies off!',
      nettle: 'She lays her eggs on plants like nettles. Her caterpillars eat nettles, bramble and ground ivy.',
      d_shell: 'An empty snail shell. Song thrushes smash snails on stones to get them out.',
      d_feather: 'A blackbird feather. Blackbirds sing in London gardens from early in the morning.',
      win: 'Eggs laid on the nettles! The tiny caterpillars will hatch, then sleep through the winter.',
    },
    level() {
      const flower = (id, x, y, look) => ({ id, kind: 'flower', look, x, y, r: 34, verb: 'Sip', hold: 1, pop: 'Nectar!', fact: 'sip' });
      return {
        w: 3000, floor: 560, start: [90, 470],
        solids: [[900, 280, 60, 280, 'wall']],
        ledges: [[1300, 430, 140]],
        hides: [[860, 280, 140, 280, 'ivy'], [1450, 420, 170, 140, 'bush'], [2250, 420, 170, 140, 'bush']],
        spots: [flower('f1', 300, 460, 'purple'), flower('f2', 620, 430, 'pink'), flower('f3', 1200, 440, 'purple'), flower('f4', 1750, 410, 'pink'), flower('f5', 2080, 450, 'purple'),
          { id: 'nettle', kind: 'nettle', x: 2700, y: 500, r: 44, need: { flower: 3 }, verb: 'Lay', hold: 1.5, goal: true, pop: 'Eggs!', fact: 'nettle' }],
        need: { flower: 3 },
        checkpoints: [[1000, 400], [2000, 420]],
        route: [[300, 450, 'f1'], [620, 420, 'f2'], [930, 240], [1200, 430, 'f3'], [1535, 480], [1750, 400, 'f4'], [2080, 440, 'f5'], [2335, 480], [2700, 490, 'nettle']],
      };
    },
    hazards(g, dt) {
      const p = g.player;
      for (const tx of [1000, 2000]) if (p.x > tx && !g.hz['bird' + tx] && !g.homeSafe) {
        g.hz['bird' + tx] = true; Game.fact('tit'); Sound.play('caught');
        g.toasts.unshift({ text: 'A great tit! Hide in a bush or the ivy until it flies off.', kind: 'hint' }); g.toastT = 0;
        g.preds.push(ldnHunter(g, { sprite: 'greatTit', name: 'great tit', from: p.x + (p.x > 1500 ? -520 : 520), y: 120, air: true, speed: 230, alert: 1.6, chase: 4, reach: 22 }));
      }
    },
    hud(g) { const n = Math.min(3, g.counts.flower || 0); setHud(n < 3 ? 'Flowers: ' + n + ' / 3' : 'Lay your eggs on the nettles', ''); },
  }),

  // ------------------------------------------------------------------ 5. Stag beetle, Richmond Park
  ldn_stag: ldnPart({
    id: 'ldn_stag', kind: 'stag', stage: 'Stag beetle', place: 'Richmond Park, dusk', sprite: 'stagBeetle', bg: 'ldnRichmond', scale: 1.6,
    action: 'Fly', later1: 'jaws', later2: 'noeat',
    sex: 'You are a male.',
    facts: [
      'Stag beetles are Britain’s biggest beetles, and London is one of the best places to find them.',
      'Only the males have the huge jaws, like a stag’s antlers.',
      'On warm summer evenings the males fly off to look for females.',
    ],
    how: [
      'Walk left and right by dragging, or with the arrow keys. Walk into a log and you climb it.',
      'Press Fly to take off. You buzz for a moment first, then fly a short, wobbly way. Steer up or down.',
      'A magpie and a fox are about! When one spots you, hide in the bracken.',
      'Find the female on the old stump at the end.',
    ],
    discoveries: [{ key: 'd_acorn', sprite: 'acorn', fx: 0.3, fy: 0.927 }, { key: 'd_antler', sprite: 'antler', fx: 0.55, fy: 0.925 }],
    factText: {
      start: 'Stag beetles are Britain’s biggest beetles. London is one of the best places in the country to find them.',
      jaws: 'Only males have the big jaws, like a stag’s antlers. They use them to wrestle other males.',
      larva: 'He spent at least three years as a grub, eating rotting wood underground.',
      noeat: 'Adult stag beetles can’t eat solid food. They live on fat they stored as grubs.',
      dusk: 'On warm summer evenings, males fly to look for females. Their flight is slow and clumsy.',
      magpie: 'Magpies and crows catch stag beetles out in the open. Hide in the bracken!',
      fox: 'Foxes eat stag beetles too. London has lots of foxes, in parks and gardens.',
      d_acorn: 'An acorn. Richmond Park has hundreds of very old oak trees.',
      d_antler: 'A deer’s old antler. Red and fallow deer live in Richmond Park, and grow new antlers every year.',
      win: 'You found a female! She’ll lay her eggs by buried dead wood, where the grubs will grow for years.',
    },
    level() {
      return {
        w: 3000, floor: 560, start: [90, 560],
        solids: [[520, 470, 180, 90, 'bark'], [1000, 430, 380, 130, 'bark'], [1850, 400, 140, 160, 'bark'], [2640, 380, 160, 180, 'bark']],
        ledges: [],
        hides: [[760, 440, 170, 120, 'bracken'], [1500, 430, 200, 130, 'bracken'], [2250, 430, 200, 130, 'bracken']],
        spots: [{ id: 'female', kind: 'female', x: 2720, y: 368, r: 46, goal: true, pop: 'A female!', fact: 'larva' }],
        need: {},
        checkpoints: [[960, 560], [2100, 560]],
        route: [[610, 470], [845, 560], [1190, 430], [1600, 560], [1920, 400], [2350, 560], [2720, 380, 'female']],
      };
    },
    hazards(g, dt) {
      const p = g.player;
      if (p.x > 650 && !g.hz.magpie && !g.homeSafe) {
        g.hz.magpie = true; Game.fact('magpie'); Sound.play('caught');
        g.toasts.unshift({ text: 'A magpie! When it spots you, hide in the bracken.', kind: 'hint' }); g.toastT = 0;
        g.preds.push(ldnHunter(g, { sprite: 'euMagpie', name: 'magpie', from: p.x + 480, y: 548, speed: 120, alert: 1.4, chase: 5, reach: 26, scale: 1.7 }));
      }
      if (p.x > 1700 && !g.hz.fox && !g.homeSafe) {
        g.hz.fox = true; Game.fact('fox'); Sound.play('caught');
        g.toasts.unshift({ text: 'A fox! Hide in the bracken until it trots off.', kind: 'hint' }); g.toastT = 0;
        g.preds.push(ldnHunter(g, { sprite: 'fox', name: 'fox', from: p.x + 520, y: 540, speed: 150, alert: 1.6, chase: 4, reach: 30, scale: 1.5 }));
      }
    },
    // a little cheer the first time he gets up onto each log or stump
    tick(g) {
      const p = g.player;
      if (!p.onGround || p.y >= g.level.floor - 1) return;
      const s = g.level.solids.find(q => Math.abs(q[1] - p.y) < 1 && p.x > q[0] && p.x < q[0] + q[2]);
      if (s && !s.up) { s.up = true; Game.pop(p.x, p.y - 40, s === g.level.solids[g.level.solids.length - 1] ? 'Up on the stump!' : 'Up on the log!', '#fff'); }
    },
    hud(g) { const p = g.player; setHud('Find the female', p.warmT > 0 ? 'Warming up…' : p.flyT > 0 ? 'Flying!' : ''); },
  }),
});

// The run: what the card between parts says
const LDN_NEXT = {
  ldn_wasp: 'Next stop: a café garden. Now you’re a common wasp!',
  ldn_mosquito: 'Next stop: down in the Tube. Now you’re an Underground mosquito!',
  ldn_moth: 'Next stop: a garden in south-east London. Now you’re a Jersey tiger moth!',
  ldn_stag: 'Last stop: Richmond Park at dusk. Now you’re a stag beetle!',
};
finishMissions();
