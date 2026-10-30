'use strict';
// The Bug Circus at the Big Top, Claremont Showground: five acts, each a thing a real bug does, dressed up as a
// circus trick. The show is pretend and every act says so; the tricks and numbers are sourced in docs/facts.md
// (Bug Circus). Cheers are the stars (three cheers = 3 stars). No nets and no predators, except the one who looks.

Bugs.push({ id: 'circus', name: 'Bug Circus', sci: 'Five acts', place: 'Claremont', sprite: 'circusIcon',
  pin: { x: 372, y: 338 }, stages: ['cir_strong', 'cir_trapeze', 'cir_rope', 'cir_vanish', 'cir_water'], kind: 'sandbox', free: true,
  book() { const n = this.stages.reduce((a, id) => a + Progress.stars(id), 0); return 'Cheers: ' + n + ' of ' + 3 * this.stages.length; },
});

const CIR = {
  place: 'The Big Top, Claremont Showground',
  ring: { r: 250, cy: 310 },
  words: ['A polite clap.', 'One cheer!', 'Two cheers!', 'Three cheers!'],
  clock() { return { time: 0, started: false, finished: false, doneT: 0, cheers: 0, line: '' }; },
  // The clock starts when you first move or press, and stops when the act ends
  tick(g, dt, input) {
    const o = g.cir;
    if (o.finished) { o.doneT += dt; return; }
    if (!o.started && (g.player.moving || input.pressed || input.held)) o.started = true;
    if (o.started) o.time += dt;
  },
  byTime(t, [three, two]) { return t <= three ? 3 : t <= two ? 2 : 1; },
  // The act is over: the crowd cheers (the stars), then the end screen
  finish(g, cheers, line) {
    const o = g.cir;
    o.finished = true; o.doneT = 0; o.cheers = cheers; o.line = line || '';
    Sound.play('win');
    Game.pop(g.player.x, g.player.y - 36, this.words[cheers], '#ffd23f');
  },
  stars(g) { return g.cir.cheers || 0; },
  endLine(g) { return this.words[g.cir.cheers || 0] + ' ' + g.cir.line; },
  won(g) { return g.cir.finished && g.cir.doneT >= 1.8; },
  time(g) { return 'Time ' + g.cir.time.toFixed(1) + ' s'; },
  adiff(a, b) { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; },
};

// ------------------------------------------------------------------ drawings
Object.assign(Sprites, {
  // A striped big top for the map pin (the apex points +x, which the portrait turns to the top of the page)
  circusIcon(ctx) {
    ctx.fillStyle = '#5a3a2a'; ctx.fillRect(-19, -17, 7, 34);
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-12, -18 + k * 6); ctx.lineTo(-12, -12 + k * 6); ctx.closePath(); ctx.fillStyle = k % 2 ? '#f6f0e4' : '#d83a2a'; ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-12, -18); ctx.lineTo(-12, 18); ctx.closePath(); ctx.strokeStyle = '#7a2a1a'; ctx.lineWidth = 1; ctx.stroke();
    plainLine(ctx, [14, 0, 21, 0], '#5a3a2a', 1.2);
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(22, -4); ctx.lineTo(22, 4); ctx.closePath(); ctx.fillStyle = '#f0c030'; ctx.fill();
  },
  // The horned dung beetle (Onthophagus taurus, male): the dung beetle drawing with a pair of horns curving back
  // from the head like a bull's
  hornBeetle(ctx, o, t) {
    Sprites.dungBeetle(ctx, o, t);
    const k = o.big ? 1.4 : 1;   // the champion's horns are longer
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(10, s * 3.2); ctx.quadraticCurveTo(10 + 7 * k, s * 8 * k, 9 - (k - 1) * 4, s * 12.5 * k); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.8 * k; ctx.lineCap = 'round'; ctx.stroke(); }
  },
  // A jumping spider seen from the side (the peacock spider on the trapeze): a round head with two huge front
  // eyes, a short abdomen, four legs each side. o.air: legs out in the jump; o.hang: hanging from the line.
  spiderSide(ctx, o, t) {
    ctx.save();
    ctx.scale(o.face !== undefined && o.face < 0 ? -1 : 1, 1);
    const w = o.moving ? Math.sin(t * 16) * 0.5 : 0, air = o.air ? 1 : 0, hang = o.hang ? 1 : 0;
    for (const [far, col, wd] of [[1, '#4a3a30', 1.1], [0, '#2a2018', 1.3]]) for (let i = 0; i < 4; i++) {
      const x = 5 - i * 3.6, k = (i % 2 ? -w : w), out = air * (i < 2 ? 1 : -1) * 4, up = hang ? -7 : 0;
      line(ctx, [x, -4, x + (i - 1.5) * 2.2 + k + out - far * 0.6, -7 + up * 0.5 + air * 1.5, x + (i - 1.5) * 4 + k + out * 1.6 - far * 1.2, (hang ? -11 : 0) - air * 0.5], col, wd);
    }
    ell(ctx, -6, -5, 6.5, 4.6, '#2a4a52', 0, 'chitin');                       // abdomen, the folded fan's colours on top
    for (let k = -1; k <= 1; k++) plainEll(ctx, -6 + k * 2.6, -7.2, 1.2, 0.6, SPIDER_COLS[0].band);
    ell(ctx, 2.5, -5, 6, 5.4, '#2a2018', 0, 'hair');                           // cephalothorax
    plainLine(ctx, [-3, -8.6, 7.5, -8], 'rgba(245,245,235,.8)', 1);
    facetEye(ctx, 7.2, -6.6, 2.3, 2.3, '#0a0a0a');                             // the big front eye (the far one peeps behind)
    facetEye(ctx, 5.6, -8.8, 1.1, 1.1, '#0a0a0a');
    plainEll(ctx, 7.8, -7.3, 0.7, 0.7, '#fff');
    plainEll(ctx, 8.6, -3.6, 1.6, 1.2, '#3a2a20');                             // pedipalp
    ctx.restore();
  },
  // A water strider (a pond skater) from above: a slim dark body, short front legs, long middle and hind legs
  // splayed on the water. o.stroke sweeps the middle legs back.
  waterStrider(ctx, o, t) {
    const sw = o.stroke > 0 ? Math.sin(Math.min(1, o.stroke) * Math.PI) * 0.9 : 0, col = '#2a2a24';
    for (const s of [-1, 1]) {
      ctx.save(); ctx.rotate(-s * sw);
      line(ctx, [2, s * 2, 7, s * 13, 10, s * 25], col, 0.8);                    // middle leg, the oar
      ctx.restore();
      line(ctx, [-3, s * 2, -10, s * 11, -19, s * 19], col, 0.7);               // hind leg, the rudder
      line(ctx, [6, s * 1.5, 9, s * 4, 12, s * 6], col, 0.7);                  // short front leg
      plainLine(ctx, [9.5, s * 0.8, 13, s * 2.6], col, 0.5);                   // antenna
    }
    ell(ctx, -1, 0, 9, 2.3, '#3a3a30', 0, 'chitin');
    plainLine(ctx, [-9, 0, 5, 0], 'rgba(230,220,200,.35)', 0.6);
    ell(ctx, 7.5, 0, 2.6, 2, '#2a2a24');
    eye(ctx, 8.5, -1.4, 0.8, 0.8, '#000'); eye(ctx, 8.5, 1.4, 0.8, 0.8, '#000');
  },
  // A timber post seen from above (the tightrope's ends)
  post(ctx) { ell(ctx, 0, 0, 13, 13, '#9a7a52', 0, 'bark'); for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(0, 0, k * 3.5, 0, TAU); ctx.strokeStyle = 'rgba(80,50,20,.45)'; ctx.lineWidth = 0.8; ctx.stroke(); } },
});

// ------------------------------------------------------------------ models
if (typeof Models !== 'undefined') {
  Models.define('hornBeetle', {
    variant(o) { return o.big ? 'B' : ''; },
    key(o, t) { return (o.big ? 'B' : '') + (o.moving ? 'm' + SpriteCache.phase(t, 10, 8) : 'x'); },
    build(M, o) {
      const g = Models.defs.dungBeetle.build(M), mat = M.chitin('#1a1a1a', { coat: 0.9, rough: 0.3 }), k = o.big ? 1.4 : 1;   // the champion's horns are longer
      for (const s of [-1, 1]) { M.seg(g, [10, s * 2.6, 4], [10 + 4.5 * k, s * 6.5 * k, 4 + 2.2 * k], 0.8 * k, mat, { full: true }); M.seg(g, [10 + 4.5 * k, s * 6.5 * k, 4 + 2.2 * k], [10 - 1 * k, s * 11 * k, 4 + 4 * k], 0.6 * k, mat, { cone: 0.15 }); }
      return g;
    },
    pose(root, o, t) { root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 10, 8) + 0.5) / 8 * TAU) : 0); },
  });
  Models.define('spiderSide', {
    view: 'side',
    key(o, t) { return (o.face < 0 ? 'L' : 'R') + (o.air ? 'A' : o.hang ? 'H' : '') + (o.moving ? 'm' + SpriteCache.phase(t, 16, 8) : 'x'); },
    build(M) { return peacockSpider(M, { col: 0 }); },
    pose(root, o, t) {
      const w = o.moving ? Math.sin((SpriteCache.phase(t, 16, 8) + 0.5) / 8 * TAU) * 0.2 : 0;
      for (const l of root.userData.legs) l.set(l.base + (l.i % 2 ? w : -w) * l.s, o.air ? 1.4 : o.hang ? 2.2 : 0);
    },
  });
  Models.define('waterStrider', {
    buckets: 8,
    key(o) { return o.stroke > 0 ? 's' + Math.round(Math.min(1, o.stroke) * 3) : 'x'; },
    build(M, o) {
      const g = new THREE.Group(), dark = M.chitin('#2a2a24', { coat: 0.4 }), body = M.chitin('#3a3a30', { coat: 0.5 }), sw = o.stroke > 0 ? Math.sin(Math.min(1, o.stroke) * Math.PI) * 0.9 : 0;
      for (const s of [-1, 1]) {
        const c = Math.cos(-s * sw), sn = Math.sin(-s * sw), R = (x, y) => [x * c - y * sn, x * sn + y * c];
        const [mx1, my1] = R(7, s * 13), [mx2, my2] = R(10, s * 25);
        M.seg(g, [2, s * 2, 2.4], [mx1, my1, 1.2], 0.35, dark, { full: true }); M.seg(g, [mx1, my1, 1.2], [mx2, my2, 0.3], 0.3, dark, { cone: 0.3 });
        M.seg(g, [-3, s * 2, 2.4], [-10, s * 11, 1.2], 0.32, dark, { full: true }); M.seg(g, [-10, s * 11, 1.2], [-19, s * 19, 0.3], 0.28, dark, { cone: 0.3 });
        M.seg(g, [6, s * 1.5, 2.2], [9, s * 4, 1.2], 0.3, dark, { full: true }); M.seg(g, [9, s * 4, 1.2], [12, s * 6, 0.3], 0.26, dark, { cone: 0.3 });
        M.seg(g, [9.5, s * 0.8, 2.6], [13, s * 2.6, 2.8], 0.18, dark, { cone: 0.3 });
        M.ellipsoid(g, 0.8, 0.8, 0.8, M.eye(), [8.5, s * 1.5, 3]);
      }
      M.ellipsoid(g, 9, 2.3, 1.9, body, [-1, 0, 2.6]);
      M.ellipsoid(g, 2.6, 2, 1.9, dark, [7.5, 0, 2.6]);
      return g;
    },
  });
}

// ------------------------------------------------------------------ the ring and the tent
// The big top from above: the ring of sawdust inside a red and white kerb, seats and a crowd of bugs around it,
// spotlights on the floor.
function drawRing(ctx, W, H, seed) {
  const r = CIR.ring.r, cx = Math.round(W / 2), cy = CIR.ring.cy, rr = rng(seed || 70);
  const g = ctx.createRadialGradient(cx, cy, r, cx, cy, Math.max(W, H) * 0.8); g.addColorStop(0, '#5a3030'); g.addColorStop(1, '#241414');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx, cy, r + 44 + k * 26, 0, TAU); ctx.strokeStyle = k % 2 ? 'rgba(130,80,80,.55)' : 'rgba(95,55,55,.55)'; ctx.lineWidth = 20; ctx.stroke(); }
  const cols = ['#e85a3a', '#f0c030', '#3a8ad8', '#5aa848', '#f4f4f0', '#1a1a1a', '#c86ab0'];
  for (let i = 0; i < 700; i++) { const a = rr() * TAU, d = r + 36 + rr() * 128; plainEll(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2.6, 2.6, cols[Math.floor(rr() * cols.length)]); }
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); ctx.translate(cx - r, cy - r);
  Ground.sand(ctx, r * 2, r * 2, 66, { pale: '#ecdcb6', mid: '#d2ba8c', dark: '#aa8c5c', ripples: false, cell: 120, relief: 0.25 });
  ctx.restore();
  for (let k = 0; k < 40; k++) { ctx.beginPath(); ctx.arc(cx, cy, r + 7, k / 40 * TAU, (k + 1) / 40 * TAU); ctx.strokeStyle = k % 2 ? '#d83a2a' : '#f8f4ec'; ctx.lineWidth = 14; ctx.stroke(); }
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.strokeStyle = 'rgba(60,30,20,.5)'; ctx.lineWidth = 2; ctx.stroke();
  for (const [ox, oy] of [[-100, -70], [110, -50], [0, 100]]) {
    const sg = ctx.createRadialGradient(cx + ox, cy + oy, 10, cx + ox, cy + oy, 160); sg.addColorStop(0, 'rgba(255,250,220,.32)'); sg.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
  }
}
Backgrounds.circusRing = function (ctx, W, H) { drawRing(ctx, W, H, 70); };

// The big top from inside, side-on: the striped roof, the seats, the net and the sawdust floor
Backgrounds.circusSide = function (ctx, W, H) {
  const cx = Math.round(W / 2), rr = rng(71), T = TRAP;
  ctx.fillStyle = '#3a2020'; ctx.fillRect(0, 0, W, H);
  // the roof: red and white wedges radiating from the king pole's top
  const apex = [cx, -140], n = Math.ceil(W / 60) + 2;
  for (let k = -1; k < n; k++) { const x0 = cx - (n / 2) * 60 + k * 60; ctx.beginPath(); ctx.moveTo(apex[0], apex[1]); ctx.lineTo(x0, 210); ctx.lineTo(x0 + 60, 210); ctx.closePath(); ctx.fillStyle = k % 2 ? '#f4ece0' : '#cc3a2a'; ctx.fill(); }
  const sh = ctx.createLinearGradient(0, 0, 0, 210); sh.addColorStop(0, 'rgba(0,0,0,.45)'); sh.addColorStop(1, 'rgba(0,0,0,.05)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, 210);
  ctx.fillStyle = '#2a1818'; ctx.fillRect(0, 210, W, 14);
  for (let i = 0; i < 14; i++) { const x = cx - 120 - (i % 2) * 40 + (i > 6 ? 280 : 0) + i * 4; plainEll(ctx, x, 222, 16, 9, i % 2 ? '#e0c030' : '#d83a2a'); }   // bunting
  // seats with a crowd of bugs behind the ring
  for (let row = 0; row < 5; row++) {
    ctx.fillStyle = row % 2 ? '#6a3a3a' : '#7a4848'; ctx.fillRect(0, T.floor - 150 + row * 24, W, 24);
    for (let x = 8; x < W; x += 13) if (rr() < 0.8) plainEll(ctx, x, T.floor - 138 + row * 24, 4, 4, ['#e85a3a', '#f0c030', '#3a8ad8', '#5aa848', '#f4f4f0', '#1a1a1a'][Math.floor(rr() * 6)]);
  }
  ctx.fillStyle = '#2b1818'; ctx.fillRect(0, T.floor - 30, W, 10);
  // the king poles and the net
  for (const x of [cx - T.sep - 150, cx + T.sep + 150]) { ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x - 6, 0, 12, T.floor); }
  ctx.save(); ctx.beginPath(); ctx.rect(cx - T.sep - 170, T.net, T.sep * 2 + 340, 26); ctx.clip();
  ctx.strokeStyle = 'rgba(230,225,210,.7)'; ctx.lineWidth = 1.2; ctx.beginPath();
  for (let x = cx - T.sep - 200; x < cx + T.sep + 200; x += 12) { ctx.moveTo(x, T.net); ctx.lineTo(x + 26, T.net + 26); ctx.moveTo(x + 26, T.net); ctx.lineTo(x, T.net + 26); }
  ctx.stroke(); ctx.restore();
  ctx.fillStyle = 'rgba(230,225,210,.8)'; ctx.fillRect(cx - T.sep - 170, T.net - 2, T.sep * 2 + 340, 3);
  // the sawdust floor with the ring's kerb seen edge-on
  ctx.save(); ctx.beginPath(); ctx.rect(0, T.floor - 20, W, H - T.floor + 20); ctx.clip(); ctx.translate(0, T.floor - 20);
  Ground.sand(ctx, W, H - T.floor + 20, 67, { pale: '#ecdcb6', mid: '#d2ba8c', dark: '#aa8c5c', ripples: false, cell: 120, relief: 0.2 });
  ctx.restore();
  for (let k = 0; k < Math.ceil(W / 40); k++) { ctx.fillStyle = k % 2 ? '#d83a2a' : '#f8f4ec'; ctx.fillRect(k * 40, T.floor - 24, 40, 10); }
};

// ------------------------------------------------------------------ 1. The Strongbug (top-down)
// Two horned males meet horn to horn in a tunnel across the ring, the way big Onthophagus taurus males really
// fight: tap Push as fast as you can (holding pushes a little too), the rival pushes back and now and then winds up
// for a heave. Shove him over his line to win the round. Three rivals, each bigger; the cheers are the rivals beaten.
const STRONG = {
  rivals: [{ name: 'a small male', push: 22, heave: 25, scale: 1.3 }, { name: 'a bigger male', push: 40, heave: 35, scale: 1.6 }, { name: 'the champion', push: 58, heave: 45, scale: 1.9, big: true }],
  tap: 14, hold: 24, taps: 10, line: 170, gap: 18, windUp: 0.6, heaveT: 0.45, heaveEvery: [3, 5], tries: 2,
  rally: 0.4, rallyAt: 10,   // the crowd gets behind you: every tap shoves harder the longer a round goes (px per tap per second, up to double)
};

Missions.cir_strong = {
  id: 'cir_strong', bug: 'circus', stage: 'Strongbug', place: CIR.place,
  get world() { return { w: W, h: H }; }, sprite: 'hornBeetle', bg: 'circusRing',
  action: 'Push', radius: 14, speed: 0, scale: 1.6, noNet: true, gentle: true,
  get home() { return { x: Math.round(W / 2) - STRONG.gap, y: CIR.ring.cy, r: 1, label: '' }; },
  facts: [
    'Welcome to the Bug Circus! The show is pretend, but every trick is something a real bug does.',
    'You’re a horned dung beetle. Big males fight horn to horn in their tunnels and shove each other out.',
    'They are the strongest insects for their size: a male in a lab test pulled 1,141 times his own weight.',
  ],
  how: [
    'Horn to horn in the tunnel! Tap Push as fast as you can. Holding pushes a little too, and the longer you keep tapping, the harder you shove.',
    'Shove the rival over his line to win the round. Watch him wind up: then he heaves!',
    'Three rivals, each bigger than the last. Every rival you beat is a cheer.',
  ],
  factText: {
    start: 'The Strongbug! Tap Push as fast as you can and shove him out of the tunnel. The circus is pretend; the shoving is real.',
    horns: 'Big male dung beetles grow horns and fight with them in the tunnels to the females. Little hornless males sneak past instead.',
    perth: 'Onthophagus taurus was brought to Australia in the 1970s to bury cow pats. Around Perth it is now the commonest dung beetle of all.',
    pull: 'A beetle like you pulled 1,141 times his own weight in a lab test: the strongest insect for its size.',
    win: '1,141 times your weight is like a kid pulling twenty cars. Three cheers for the Strongbug!',
  },

  setup(g) {
    const p = g.player; p.y = CIR.ring.cy; p.angle = 0; p.flat = true;
    g.cir = CIR.clock(); g.round = 0; g.tries = 0; g.beaten = 0; g.restT = 0; g.pos = 0; g.tapPush = 0; g.tapBudget = STRONG.taps; g.holding = false; g.roundT = 0; g.tapsRound = 0;
    this.newRival(g);
    Game.later(2, () => Game.hint('Tap Push as fast as you can!'));
  },
  newRival(g) {
    const R = STRONG.rivals[g.round];
    g.rival = { sprite: 'hornBeetle', kind: 'rival', x: 0, y: CIR.ring.cy, r: 14, scale: R.scale, angle: Math.PI, flat: true, big: !!R.big, moving: true };
    g.items = [g.rival];
    g.pos = 0; g.heaveIn = STRONG.heaveEvery[0] + Math.random() * (STRONG.heaveEvery[1] - STRONG.heaveEvery[0]); g.windT = 0; g.heaveT = 0; g.roundT = 0; g.tapsRound = 0; g.rallied = false;
    this.place(g);
  },
  // The pair sits horn to horn, g.pos from the middle of the tunnel (positive toward the rival's line); the rival
  // leans back while he winds up
  place(g) { const cx = Math.round(World.w / 2), p = g.player; p.x = cx - STRONG.gap + g.pos; g.rival.x = cx + STRONG.gap + g.pos + (g.windT > 0 ? 10 : 0); },
  locked() { return true; },
  move(g, dt) {
    const p = g.player, o = g.cir, S = STRONG, R = S.rivals[g.round];
    if (o.finished || g.restT > 0) { p.moving = false; return; }
    // the rival pushes back steadily and harder in a heave; you push with taps (at most ten a second count) and a hold
    const v = -R.push - (g.heaveT > 0 ? R.heave / S.heaveT : 0) + (g.holding ? S.hold : 0);
    g.pos = clamp(g.pos + v * dt + g.tapPush, -S.line - 20, S.line + 20); g.tapPush = 0;
    p.moving = true; p.angle = Math.sin(g.t * 30) * 0.06; g.rival.angle = Math.PI + Math.sin(g.t * 30 + 1) * 0.06;   // straining
    this.place(g);
    if (g.pos >= S.line) this.shoved(g);
    else if (g.pos <= -S.line) this.lost(g);
  },
  update(g, dt, input) {
    const p = g.player, o = g.cir, S = STRONG;
    CIR.tick(g, dt, input);
    if (g.restT > 0) { g.restT -= dt; if (g.restT <= 0) this.lineUp(g); }
    const live = !o.finished && g.restT <= 0;
    g.holding = live && !!input.held;
    setAction('Push', live);
    g.tapBudget = Math.min(S.taps, g.tapBudget + dt * S.taps);
    if (live) g.roundT += dt;
    if (live && input.pressed && g.tapBudget >= 1) {
      g.tapBudget -= 1; g.tapPush += this.tapPush(g); g.tapsRound++;
      Sound.play('tap'); Game.burst(p.x + 10, p.y + 8, '#d8c090', 3);
    }
    if (live) {
      // the rival's heave: a wind-up you can see, then the shove
      if (g.heaveT > 0) g.heaveT -= dt;
      else if (g.windT > 0) { g.windT -= dt; if (g.windT <= 0) { g.heaveT = S.heaveT; Sound.play('caught'); Game.burst(g.rival.x - 10, g.rival.y + 8, '#d8c090', 6); } }
      else { g.heaveIn -= dt; if (g.heaveIn <= 0) { g.windT = S.windUp; g.heaveIn = S.heaveEvery[0] + Math.random() * (S.heaveEvery[1] - S.heaveEvery[0]); Game.pop(g.rival.x, g.rival.y - 30, 'He’s winding up!', '#ffd23f'); } }
      if (p.stillT > 5 && !g.nudged) { g.nudged = true; Game.hint('Tap Push as fast as you can!'); }
      if (g.roundT > S.rallyAt && !g.rallied) { g.rallied = true; Game.pop(p.x, p.y - 50, 'The crowd’s behind you! Keep tapping!', '#ffd23f'); }
      if (g.round === 2 && !g.toldPull) { g.toldPull = true; Game.fact('pull'); }
    }
  },
  // What one tap shoves: more the longer the round has gone, up to double
  tapPush(g) { const S = STRONG; return S.tap + Math.min(S.tap, S.rally * g.roundT); },
  shoved(g) {
    g.beaten++; g.round++; g.tries = 0; Sound.play('score'); Game.burst(g.rival.x, g.rival.y, '#ffd23f', 12);
    Game.pop(g.rival.x, g.rival.y - 30, 'Shoved out!', '#ffd23f');
    if (g.beaten === 1) Game.fact('horns');
    if (g.beaten === 2) Game.fact('perth');
    this.next(g);
  },
  lost(g) {
    g.tries++; Sound.play('caught'); Game.pop(g.player.x, g.player.y - 30, 'He pushed you out!', '#fff');
    if (g.tapsRound < 12) Game.hint('Tap Push, fast! Tapping shoves much harder than holding.');   // a holder, not a tapper
    else if (g.tries >= STRONG.tries) Game.hint('Too strong this time! Here comes the next one.');
    if (g.tries >= STRONG.tries) { g.round++; g.tries = 0; }
    this.next(g);
  },
  next(g) {
    const n = g.beaten;
    if (g.round >= STRONG.rivals.length) CIR.finish(g, Math.max(1, n), n === 3 ? 'All three rivals shoved out of the tunnel!' : n + (n === 1 ? ' rival' : ' rivals') + ' shoved out of three.');
    else g.restT = 2.2;
  },
  lineUp(g) {
    const p = g.player;
    if (g.tries === 0) this.newRival(g); else { g.pos = 0; g.windT = 0; g.heaveT = 0; g.heaveIn = 3; g.roundT = 0; g.tapsRound = 0; g.rallied = false; this.place(g); }
    g.nudged = false; p.stillT = 0;
    Game.pop(p.x + STRONG.gap, p.y - 34, 'Round ' + (g.round + 1) + ': ' + STRONG.rivals[g.round].name, '#fff');
  },
  drawBuild(ctx, g) {
    const cx = Math.round(World.w / 2), cy = CIR.ring.cy, S = STRONG, w2 = S.line + 60;
    // the tunnel: a trench across the ring with a line at each end
    ctx.fillStyle = 'rgba(70,45,25,.45)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - w2, cy - 34, w2 * 2, 68, 30) : ctx.rect(cx - w2, cy - 34, w2 * 2, 68); ctx.fill();
    ctx.fillStyle = 'rgba(40,25,12,.35)'; ctx.fillRect(cx - w2 + 20, cy - 34, w2 * 2 - 40, 6);
    for (const s of [-1, 1]) plainLine(ctx, [cx + s * S.line, cy - 36, cx + s * S.line, cy + 36], s > 0 ? 'rgba(255,255,255,.9)' : 'rgba(255,210,63,.9)', 4);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('HIS LINE', cx + S.line, cy - 42); ctx.fillText('YOUR LINE', cx - S.line, cy - 42);
    // the shove meter: where the pair is between the lines
    const w = 200, x = cx - w / 2, y = cy + 120, k = clamp((g.pos + S.line) / (2 * S.line), 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 2, y - 2, w + 4, 14);
    const grad = ctx.createLinearGradient(x, 0, x + w, 0); grad.addColorStop(0, '#e85a3a'); grad.addColorStop(0.5, '#f0c030'); grad.addColorStop(1, '#3fd06a');
    ctx.fillStyle = grad; ctx.fillRect(x, y, w * k, 10);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + w * k - 1.5, y - 3, 3, 16);
    if (g.windT > 0) { ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('Winding up…', g.rival.x, g.rival.y - 44); }
  },
  goalPoint() { return null; },
  hud(g) { const o = g.cir; setHud('Round ' + Math.min(3, g.round + (o.finished ? 0 : 1)) + ' of 3', g.beaten ? 'Rivals beaten: ' + g.beaten : o.finished ? '' : 'Tap Push!'); },
  stars(g) { return CIR.stars(g); },
  endLine(g) { return CIR.endLine(g); },
  won(g) { return CIR.won(g); },
};

// ------------------------------------------------------------------ 2. The flying trapeze (side-on)
// A peacock spider, a jumping spider, leaps between two swinging trapezes. Every jump trails a silk line from the
// bar she left; a miss leaves her hanging on it, and she climbs back up. Seven catches finish the act; the bars drift
// apart a little with every catch, and the helper ring on the far bar goes after the first two.
const TRAP = { sep: 230, sepGrow: 10, sepMax: 280, top: 60, rope: 230, swing: 0.62, period: 3, floor: 540, net: 440, catches: 7, g: 900, jump: [430, -230], reach: 36, cued: 2,
  h: 1 / 120, late: 0.1 };   // the flight's fixed step; the ring shows only while a jump up to 0.1 s late would still catch

Missions.cir_trapeze = {
  id: 'cir_trapeze', bug: 'circus', stage: 'Trapeze', place: CIR.place, view: 'side',
  get world() { return { w: W, h: H }; }, sprite: 'spiderSide', bg: 'circusSide',
  action: 'Jump', radius: 12, speed: 0, scale: 1.6, noNet: true, gentle: true,
  get home() { return { x: Math.round(W / 2) - TRAP.sep, y: TRAP.top + TRAP.rope, r: 1, label: '' }; },
  facts: [
    'You’re a peacock spider, a jumping spider. Before every jump a jumping spider glues a silk line to where it stands.',
    'The silk is more than a safety line: in the air the spider pulls on it to straighten up and land on its feet.',
    'The trapeze is pretend. The silk line is real, and it saves jumping spiders every day.',
  ],
  how: [
    'This act is side-on. You stand on a swinging trapeze. The other one swings toward you.',
    'Press Jump as the bars swing up toward each other. For the first two catches a ring shows the moment. Your silk line trails behind you.',
    'Miss, and you hang on the line and climb back up. Catch the bar seven times to finish. The bars drift apart as you go, and after two catches the ring that showed the moment is gone. No misses: three cheers!',
  ],
  factText: {
    start: 'The flying trapeze! Press Jump as the bars swing up toward each other. The circus is pretend; the silk line is real.',
    line: 'Before every jump, a jumping spider glues a silk line to where it stands. The line trails behind it in the air.',
    steer: 'The silk isn’t just a safety line. Jumping spiders pull on it in mid-air to straighten up and land on their feet.',
    eyes: 'Peacock spiders are jumping spiders. Their two big front eyes judge the distance before each jump.',
    miss: 'Missed! Hang on the line and climb back up. A real jumping spider that misses does just that.',
    win: 'Seven catches! A jumping spider jumps many times its own length, and the silk line makes the landing safe.',
  },

  sep(g) { return Math.min(TRAP.sepMax, TRAP.sep + TRAP.sepGrow * (g.catches || 0)); },   // the bars drift apart with every catch
  cued(g) { return (g.catches || 0) < TRAP.cued; },   // the helper ring and the green button, for the first catches only
  bar(g, i) { return this.barAt(g.t, i, this.sep(g)); },
  barAt(t, i, sep) { const T = TRAP, a = (i ? -1 : 1) * T.swing * Math.sin(t / T.period * TAU), x0 = Math.round(World.w / 2) + (i ? 1 : -1) * sep; return { x: x0 + Math.sin(a) * T.rope, y: T.top + Math.cos(a) * T.rope, a, x0 }; },
  setup(g) {
    const p = g.player; p.on = 0; p.face = 1; p.angle = 0; p.flat = true; p.vx = 0; p.vy = 0; p.air = false; p.hang = false;
    g.cir = CIR.clock(); g.catches = 0; g.misses = 0; g.anchor = null; g.climbT = 0; g.acc = 0; g.fl = null;
    const b = this.bar(g, 0); p.x = b.x; p.y = b.y - 4;
    Game.later(2, () => Game.hint('Press Jump as the bars swing up toward each other!'));
  },
  locked() { return true; },
  // The flight is stepped at a fixed 1/120 s, so it lands the same at any frame rate and the forecast behind the
  // helper ring (canCatch) can run the very same steps ahead of time. A flight f = { x, y, vx, vy, t, on, sep }.
  jumpVel(t, on, sep) {
    const T = TRAP, b = this.barAt(t, on, sep), dir = on ? -1 : 1;
    const va = T.swing * TAU / T.period * Math.cos(t / T.period * TAU) * (on ? -1 : 1);   // the bar's own swing speed
    return { vx: Math.cos(b.a) * va * T.rope + dir * T.jump[0], vy: -Math.sin(b.a) * va * T.rope + T.jump[1] };
  },
  flight(t, on, sep) { const b = this.barAt(t, on, sep), v = this.jumpVel(t, on, sep); return { x: b.x, y: b.y - 4, vx: v.vx, vy: v.vy, t, on, sep }; },
  flyStep(f) {
    const T = TRAP, h = T.h;
    f.t += h; f.vy += T.g * h; f.x += f.vx * h; f.y += f.vy * h;
    const b = this.barAt(f.t, 1 - f.on, f.sep);
    if (Math.hypot(b.x - f.x, b.y - 4 - f.y) < T.reach && f.vy > -160) return 'catch';
    if (f.y > T.net - 20 || Math.abs(f.x - Math.round(World.w / 2)) > f.sep + 200) return 'miss';
    return null;
  },
  wouldCatch(t, on, sep) { const f = this.flight(t, on, sep); for (let i = 0; i < 240; i++) { const r = this.flyStep(f); if (r) return r === 'catch'; } return false; },
  // Would a jump now catch the other bar, and still catch a moment later? The ring and the green button show these moments
  canCatch(g) { const p = g.player, sep = this.sep(g); return this.wouldCatch(g.t, p.on, sep) && this.wouldCatch(g.t + TRAP.late, p.on, sep); },
  move(g, dt) {
    const p = g.player, T = TRAP;
    if (p.hang) {   // hanging on the line below the anchor, then climbing back to the bar
      g.climbT -= dt;
      const b = this.bar(g, p.on), k = Math.max(0, Math.min(1, 1 - g.climbT / 2.5));
      p.x = g.anchor.x + (b.x - g.anchor.x) * k; p.y = g.anchor.y + g.hangL * (1 - k) + (b.y - 4 - g.anchor.y) * k;
      if (g.climbT <= 0) { p.hang = false; p.x = b.x; p.y = b.y - 4; }
      p.moving = true; return;
    }
    if (p.air) {
      g.acc += dt;
      while (g.acc >= T.h && p.air) {
        g.acc -= T.h;
        const r = this.flyStep(g.fl); p.x = g.fl.x; p.y = g.fl.y; p.vy = g.fl.vy;
        if (r === 'catch') this.catchBar(g, 1 - p.on); else if (r === 'miss') this.miss(g);
      }
      p.moving = true; return;
    }
    const b = this.bar(g, p.on); p.x = b.x; p.y = b.y - 4; p.face = p.on ? -1 : 1; p.moving = false;
  },
  update(g, dt, input) {
    const p = g.player, o = g.cir;
    CIR.tick(g, dt, input);
    const onBar = !p.air && !p.hang && !o.finished;
    g.catchNow = onBar && this.canCatch(g);
    setAction('Jump', this.cued(g) ? g.catchNow : onBar);
    if (input.pressed && !p.air && !p.hang && !o.finished) this.jump(g);
    if (!p.air && !p.hang && !o.finished && p.stillT > 7 && !g.nudged) { g.nudged = true; Game.hint('Press Jump as the bars swing up toward each other!'); }
  },
  jump(g) {
    const p = g.player, f = this.flight(g.t, p.on, this.sep(g));
    g.fl = f; g.acc = 0; p.x = f.x; p.y = f.y; p.vx = f.vx; p.vy = f.vy;
    p.air = true; g.anchor = { x: f.x, y: f.y + 4 }; p.stillT = 0;
    Sound.play('jump'); Game.fact('line');
  },
  catchBar(g, i) {
    const p = g.player; p.air = false; p.on = i; g.catches++; g.nudged = false;
    Sound.play('score'); Game.pop(p.x, p.y - 30, 'Caught!', '#3fd06a');
    if (g.catches === 1) Game.fact('steer');
    if (g.catches === 2) Game.fact('eyes');
    if (g.catches === TRAP.cued) Game.later(0.8, () => Game.pop(p.x, p.y - 50, 'Now without the ring!', '#ffd23f'));
    if (g.catches >= TRAP.catches) CIR.finish(g, g.misses === 0 ? 3 : g.misses === 1 ? 2 : 1, g.misses ? g.misses + (g.misses === 1 ? ' miss, saved by the silk line.' : ' misses, saved by the silk line every time.') : 'Seven catches without a miss!');
  },
  miss(g) {
    const p = g.player; p.air = false; p.hang = true; g.misses++; g.climbT = 2.5; g.hangL = Math.min(200, Math.max(80, Math.hypot(p.x - g.anchor.x, p.y - g.anchor.y)));
    Sound.play('tap'); Game.pop(p.x, p.y - 20, 'Hang on!', '#fff'); Game.fact('miss');
  },
  drawExtra(ctx, g) {
    const p = g.player, T = TRAP;
    for (const i of [0, 1]) {
      const b = this.bar(g, i);
      for (const s of [-1, 1]) plainLine(ctx, [b.x0 + s * 14, T.top, b.x + s * 14, b.y], 'rgba(240,230,210,.9)', 2);
      plainLine(ctx, [b.x - 22, b.y, b.x + 22, b.y], '#8a6a4a', 5);
      plainEll(ctx, b.x0, T.top, 5, 5, '#5a3a2a');
    }
    if ((p.air || p.hang) && g.anchor) plainLine(ctx, [g.anchor.x, g.anchor.y, p.x, p.y - (p.hang ? 8 : 2)], 'rgba(250,245,225,.9)', 1.2);   // the dragline
    if (g.catchNow && this.cued(g)) { const o = this.bar(g, 1 - p.on); ctx.beginPath(); ctx.arc(o.x, o.y, 22 + Math.sin(g.t * 6) * 3, 0, TAU); ctx.strokeStyle = 'rgba(255,210,63,.8)'; ctx.lineWidth = 3; ctx.stroke(); }
  },
  goalPoint() { return null; },
  hud(g) { setHud('Catches: ' + g.catches + ' / ' + TRAP.catches, g.misses ? 'Misses: ' + g.misses : ''); },
  stars(g) { return CIR.stars(g); },
  endLine(g) { return CIR.endLine(g); },
  won(g) { return CIR.won(g); },
};

// ------------------------------------------------------------------ 3. The tightrope (top-down)
// A golden orb-weaver gets a line across the ring the way real ones do: silk let out on the wind until it sticks
// to the far post. Then she walks the line through the gusts, holding on when they blow.
const ROPE = { half: 300, speed: 110, gustEvery: [4, 7], warn: 0.9, gust: 1.6, fall: 2.6, times: [30, 45] };

Missions.cir_rope = {
  id: 'cir_rope', bug: 'circus', stage: 'Tightrope', place: CIR.place,
  get world() { return { w: W, h: H }; }, sprite: 'orbSpider', bg: 'circusRing',
  action: 'Spin', radius: 14, speed: 0, scale: 1.5, noNet: true, gentle: true,
  get home() { return { x: Math.round(W / 2) - ROPE.half, y: CIR.ring.cy, r: 1, label: '' }; },
  facts: [
    'You’re a golden orb-weaver. To cross a gap, a real orb-weaver lets out silk and lets the wind carry it until it sticks.',
    'Then she pulls the line tight and walks across. Claws and hooked hairs on her feet grip the silk.',
    'The tightrope is pretend. The bridging line is how every big orb web starts.',
  ],
  how: [
    'Watch the wind arrow. Press Spin when the wind blows toward the far post, and your silk sails across.',
    'Then walk the line with the arrow keys, or touch and drag.',
    'When a gust comes, hold Hold on! Let go in a gust and you’re blown off the line. Fast across: three cheers.',
  ],
  factText: {
    start: 'The tightrope! First the line has to get across. Press Spin when the wind points at the far post. The circus is pretend; the silk trick is real.',
    bridge: 'Stuck! Real orb-weavers cross gaps this way: a line floats off on the wind, catches on the far side, and the spider pulls it tight.',
    grip: 'A spider holds the line with claws and hooked hairs on its feet, so it doesn’t slip.',
    stretch: 'Silk is stretchy. A thread stretches a long way before it breaks, so a gust bends it instead of snapping it.',
    fall: 'Blown off! She’s hanging on a safety line. Climb back up and keep going.',
    win: 'Across! Golden orb-weaver silk is one of the strongest natural threads for its weight.',
  },

  setup(g) {
    const p = g.player, cx = Math.round(World.w / 2), cy = CIR.ring.cy;
    p.x = cx - ROPE.half; p.y = cy; p.angle = 0; p.flat = true;
    g.cir = CIR.clock(); g.phase = 'wind'; g.wind = Math.PI * 0.8; g.windV = 0.5; g.sail = null; g.gustIn = 5; g.gust = 0; g.warn = 0; g.held = false; g.fallT = 0; g.falls = 0;
    g.items.push({ sprite: 'post', kind: 'post', x: cx - ROPE.half, y: cy, r: 14, scale: 1.2, angle: 0, flat: true }, { sprite: 'post', kind: 'post', x: cx + ROPE.half, y: cy, r: 14, scale: 1.2, angle: 0, flat: true });
    Game.later(2, () => Game.hint('Wait for the wind arrow to point at the far post, then press Spin!'));
  },
  locked(g) { return g.phase !== 'walk' || g.fallT > 0; },
  move(g, dt, dx) {
    const p = g.player, cx = Math.round(World.w / 2), cy = CIR.ring.cy;
    if (g.phase !== 'walk' || g.fallT > 0) { p.moving = false; return; }
    const d = Math.abs(dx) < 0.15 ? 0 : Math.sign(dx);
    if (d) { p.x = clamp(p.x + d * ROPE.speed * dt, cx - ROPE.half, cx + ROPE.half); p.moving = true; p.angle = d > 0 ? 0 : Math.PI; }
    p.y = cy;
    if (p.x >= cx + ROPE.half - 22) { g.phase = 'done'; CIR.finish(g, CIR.byTime(g.cir.time, ROPE.times), 'Across the line in ' + g.cir.time.toFixed(0) + ' seconds' + (g.falls ? ', blown off ' + g.falls + (g.falls === 1 ? ' time.' : ' times.') : ', never blown off.')); }
  },
  update(g, dt, input) {
    const p = g.player, o = g.cir, cx = Math.round(World.w / 2), cy = CIR.ring.cy;
    CIR.tick(g, dt, input);
    // the wind wanders, now and then swinging right round
    g.windV += (Math.random() - 0.5) * 2 * dt; g.windV = clamp(g.windV, -0.9, 0.9);
    g.wind += g.windV * dt; if (Math.random() < 0.004) g.windV = -g.windV;
    if (g.phase === 'wind') {
      const aligned = Math.abs(CIR.adiff(g.wind, 0)) < 0.45;
      setAction('Spin', aligned);
      if (input.pressed) {
        g.sail = { t: 0, a: g.wind, ok: aligned }; g.phase = 'sail'; Sound.play('tap');
        if (!aligned) Game.hint('The wind took it. Press Spin when the arrow points at the far post.');
      }
    } else if (g.phase === 'sail') {
      g.sail.t += dt;
      if (g.sail.t >= 1.3) {
        if (g.sail.ok) { g.phase = 'walk'; Sound.play('score'); Game.pop(cx + ROPE.half, cy - 30, 'Stuck!', '#ffd23f'); Game.fact('bridge'); Game.hint('Walk the line! Hold on when a gust comes.'); }
        else { g.phase = 'wind'; g.sail = null; }
      }
      setAction('Spin', false);
    } else if (g.phase === 'walk') {
      if (g.fallT > 0) { g.fallT -= dt; setAction('Hold on', false); if (g.fallT <= 0) Game.pop(p.x, p.y - 24, 'Back on the line!', '#fff'); return; }
      setAction('Hold on', g.gust > 0 || g.warn > 0);
      if (g.gust > 0) {
        g.gust -= dt;
        if (working(input)) { if (!g.held) { g.held = true; Game.fact('grip'); } }
        else if (!g.blown) { g.blown = true; g.falls++; g.fallT = ROPE.fall; g.gust = 0; Sound.play('caught'); Game.pop(p.x, p.y - 24, 'Blown off!', '#fff'); Game.fact('fall'); }
        if (g.gust <= 0 && !g.blown) { Game.pop(p.x, p.y - 24, 'Held on!', '#3fd06a'); if (++g.gustsHeld === 2) Game.fact('stretch'); }
      } else if (g.warn > 0) { g.warn -= dt; if (g.warn <= 0) { g.gust = ROPE.gust; g.held = false; g.blown = false; } }
      else { g.gustIn -= dt; if (g.gustIn <= 0) { g.warn = ROPE.warn; g.gustIn = ROPE.gustEvery[0] + Math.random() * (ROPE.gustEvery[1] - ROPE.gustEvery[0]); Game.pop(p.x, p.y - 30, 'Gust coming!', '#ffd23f'); Sound.play('tap'); } }
    }
  },
  drawBuild(ctx, g) {
    const cx = Math.round(World.w / 2), cy = CIR.ring.cy, p = g.player;
    // the wind arrow over the ring
    ctx.save(); ctx.translate(cx, cy - 190); ctx.rotate(g.wind);
    const aligned = Math.abs(CIR.adiff(g.wind, 0)) < 0.45;
    plainLine(ctx, [-26, 0, 22, 0], aligned ? 'rgba(63,208,106,.95)' : 'rgba(255,255,255,.85)', 5);
    ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(16, -11); ctx.lineTo(16, 11); ctx.closePath(); ctx.fillStyle = aligned ? 'rgba(63,208,106,.95)' : 'rgba(255,255,255,.85)'; ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('wind', cx, cy - 214);
    // the line: sailing on the wind, or tied across
    if (g.phase === 'sail' && g.sail) {
      const k = Math.min(1, g.sail.t / 1.2), a = g.sail.ok ? 0 : g.sail.a, ex = cx - ROPE.half + Math.cos(a) * 2 * ROPE.half * k, ey = cy + Math.sin(a) * 2 * ROPE.half * k;
      ctx.beginPath(); ctx.moveTo(cx - ROPE.half, cy); ctx.quadraticCurveTo((cx - ROPE.half + ex) / 2 + Math.sin(g.t * 9) * 18, (cy + ey) / 2 - 24, ex, ey); ctx.strokeStyle = 'rgba(232,192,64,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (g.phase === 'walk' || g.phase === 'done') {
      const sag = g.gust > 0 ? Math.sin(g.t * 20) * 6 : 0;
      ctx.beginPath(); ctx.moveTo(cx - ROPE.half, cy); ctx.quadraticCurveTo(cx, cy + sag, cx + ROPE.half, cy); ctx.strokeStyle = 'rgba(232,192,64,.95)'; ctx.lineWidth = 2.5; ctx.stroke();
      if (g.gust > 0) for (let k = 0; k < 6; k++) plainLine(ctx, [cx - 200 + k * 80 + (g.t * 300) % 80, cy - 90 + (k % 3) * 60, cx - 170 + k * 80 + (g.t * 300) % 80, cy - 90 + (k % 3) * 60], 'rgba(255,255,255,.5)', 2);   // gust streaks
      if (g.fallT > 0) plainLine(ctx, [p.x, cy, p.x, cy + 10 + Math.sin(g.t * 3) * 6 + 40 * Math.min(1, g.fallT / ROPE.fall)], 'rgba(250,245,225,.9)', 1.2);
    }
  },
  playerSprite() { return 'orbSpider'; },
  goalPoint(g) { return g.phase === 'walk' && g.fallT <= 0 ? { x: Math.round(World.w / 2) + ROPE.half, y: CIR.ring.cy } : null; },
  hud(g) { setHud(g.phase === 'wind' || g.phase === 'sail' ? 'Get the line across' : CIR.time(g), g.phase === 'walk' ? (g.gust > 0 ? 'Gust! Hold on!' : g.warn > 0 ? 'Gust coming…' : 'Walk to the far post') : ''); },
  stars(g) { return CIR.stars(g); },
  endLine(g) { return CIR.endLine(g); },
  won(g) { return CIR.won(g); },
};

// ------------------------------------------------------------------ 4. The disappearing act (top-down)
// A brown moth hides on the bark in the spotlight: fly there, press Settle to line up with the grooves, and keep
// still while the honeyeater looks. Five rounds; vanish every time for three cheers.
const VANISH = {
  patches: [['bark', -150, -90, -0.5], ['straw', 20, -120, 0.3], ['bark', 150, -70, 1.2], ['sand', -170, 60, 0], ['bark', 0, 20, -1.1], ['litter', 160, 80, 0.2], ['bark', -60, 150, 0.8], ['straw', 110, 170, -0.4], ['bark', 190, -170, 0.1]],
  size: 68, rounds: 5, look: 7.5, align: 0.35,
};

function drawPatch(ctx, kind, angle, seed) {
  const S = VANISH.size, h = S / 2, r = rng(seed);
  ctx.save(); ctx.rotate(angle);
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-h, -h, S, S, 10) : ctx.rect(-h, -h, S, S); ctx.clip();
  if (kind === 'bark') Ground.bark(ctx, -h, -h, S, S, seed, { axis: 'x', color: '#8a6a48' });
  else if (kind === 'straw') { ctx.fillStyle = '#d8c070'; ctx.fillRect(-h, -h, S, S); for (let i = 0; i < 40; i++) plainLine(ctx, [-h + r() * S, -h + r() * S, -h + r() * S, -h + r() * S], i % 2 ? '#f0dc90' : '#b89a40', 1.4); }
  else if (kind === 'sand') { ctx.fillStyle = '#e8d8ac'; ctx.fillRect(-h, -h, S, S); for (let i = 0; i < 90; i++) plainEll(ctx, -h + r() * S, -h + r() * S, 1.2, 1, r() < 0.5 ? 'rgba(255,255,250,.7)' : 'rgba(120,90,50,.4)'); }
  else { ctx.fillStyle = '#9a7a52'; ctx.fillRect(-h, -h, S, S); for (let i = 0; i < 14; i++) { ctx.save(); ctx.translate(-h + r() * S, -h + r() * S); ctx.rotate(r() * TAU); ell(ctx, 0, 0, 9, 4, ['#b89a62', '#7a5a3a', '#c8a870'][i % 3], 0, 'none'); plainLine(ctx, [-8, 0, 8, 0], 'rgba(60,40,20,.4)', 0.7); ctx.restore(); } }
  ctx.restore();
  ctx.save(); ctx.rotate(angle); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-h, -h, S, S, 10) : ctx.rect(-h, -h, S, S); ctx.strokeStyle = 'rgba(40,25,15,.45)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}
Backgrounds.circusPatches = function (ctx, W, H) {
  drawRing(ctx, W, H, 72);
  const cx = Math.round(W / 2), cy = CIR.ring.cy;
  VANISH.patches.forEach(([kind, ox, oy, a], i) => { ctx.save(); ctx.translate(cx + ox, cy + oy); Ground.contact(ctx, 4, 6, 40, 40, 0.25); drawPatch(ctx, kind, a, 80 + i); ctx.restore(); });
};

Missions.cir_vanish = {
  id: 'cir_vanish', bug: 'circus', stage: 'Vanishing', place: CIR.place,
  get world() { return { w: W, h: H }; }, sprite: 'moth', bg: 'circusPatches',
  action: 'Settle', radius: 14, speed: 150, scale: 1.5, noNet: true, gentle: true,
  get home() { return { x: Math.round(W / 2), y: CIR.ring.cy + 230, r: 1, label: '' }; },
  facts: [
    'You’re a brown moth. By day, moths that rest on bark pick a spot and turn to line up with the grooves. Scientists found that makes them much harder to see.',
    'A moth that keeps still is hard to see. One that flutters gives itself away.',
    'The spotlight and the ringmaster are pretend. The hiding is real, and so is the honeyeater who looks.',
  ],
  how: [
    'Fly to the bark patch in the spotlight with the arrow keys, or touch and drag.',
    'On the bark, press Settle to turn with the grooves and keep still.',
    'The honeyeater looks when the countdown ends. Five rounds. Vanish every time for three cheers.',
  ],
  factText: {
    start: 'The disappearing act! Find the bark in the spotlight, settle with the grooves and keep still. The circus is pretend; the vanishing is real.',
    settle: 'Moths that rest on bark pick their spot and turn their body to line up with the grooves. Scientists found that makes them much harder to spot.',
    patch: 'Brown wings hide on brown bark. On sand or straw a brown moth stands out.',
    bird: 'New Holland honeyeaters eat insects as well as nectar, and they hunt by sight.',
    still: 'Spotted! A moth that keeps still is hard to see. One that flutters gives itself away.',
    win: 'Vanished five times! Camouflage only works if you pick the right spot and keep still.',
  },

  patchAt(g, p) { const cx = Math.round(World.w / 2), cy = CIR.ring.cy; let best = null; VANISH.patches.forEach(([kind, ox, oy, a], i) => { const d = Math.hypot(p.x - cx - ox, p.y - cy - oy); if (d < VANISH.size * 0.55 && (!best || d < best.d)) best = { i, kind, x: cx + ox, y: cy + oy, a, d }; }); return best; },
  setup(g) {
    const p = g.player; p.x = Math.round(World.w / 2); p.y = CIR.ring.cy + 230; p.flat = true; p.settled = false; p.settleT = 0;
    g.cir = CIR.clock(); g.round = 0; g.hidden = 0; g.lookT = VANISH.look; g.bird = null; g.order = VANISH.patches.map((q, i) => i).filter(i => VANISH.patches[i][0] === 'bark').sort(() => Math.random() - 0.5);
    g.lit = g.order[0];
    Game.later(2, () => Game.hint('Fly to the bark in the spotlight, then press Settle!'));
  },
  update(g, dt, input) {
    const p = g.player, o = g.cir, V = VANISH;
    CIR.tick(g, dt, input);
    if (o.finished) return;
    if (p.moving) { p.settled = false; p.settleT = 0; }
    const at = this.patchAt(g, p);
    setAction('Settle', !!at && !p.settled);
    if (input.pressed && at && !p.settled) {
      if (at.kind === 'bark') { p.settled = true; p.settleT = 0; p.target = at.a; Sound.play('tap'); Game.fact('settle'); }
      else { Game.hint('That patch doesn’t match your colours. Find the bark.'); Game.fact('patch'); }
    }
    if (p.settled) { p.settleT += dt; const d = CIR.adiff(p.target, p.angle); const dd = Math.abs(d) > Math.PI / 2 ? CIR.adiff(p.target + Math.PI, p.angle) : d; p.angle += dd * Math.min(1, dt * 6); }
    // the countdown to the look: the bird flies in over the last stretch, looks, and leaves
    g.lookT -= dt;
    if (g.lookT <= 1.6 && !g.bird) { const cx = Math.round(World.w / 2); g.bird = { sprite: 'honeyeater', x: cx + (Math.random() < 0.5 ? -1 : 1) * 520, y: CIR.ring.cy - 240, r: 20, scale: 1.5, flying: true, moving: true, angle: 0, t: 0 }; Game.fact('bird'); }
    if (g.bird) {
      const b = g.bird, cx = Math.round(World.w / 2); b.t += dt;
      const k = Math.min(1, b.t / 1.6), tx = cx, ty = CIR.ring.cy - 120;
      if (b.t < 1.6) { b.x += (tx - b.x) * Math.min(1, dt * 3); b.y += (ty - b.y) * Math.min(1, dt * 3); b.angle = Math.atan2(ty - b.y, tx - b.x); }
      else if (b.t < 2.4) { b.angle = Math.atan2(p.y - b.y, p.x - b.x); if (!b.looked) { b.looked = true; this.look(g); } }
      else { b.x += Math.cos(b.angle + Math.PI) * 420 * dt; b.y -= 200 * dt; if (b.t > 4) g.bird = null; }
      void k;
    }
  },
  look(g) {
    const p = g.player, V = VANISH, at = this.patchAt(g, p), lit = VANISH.patches[g.lit], cx = Math.round(World.w / 2), cy = CIR.ring.cy;
    const onLit = at && at.i === g.lit, aligned = p.settled && Math.abs(Math.abs(CIR.adiff(p.angle, lit[3])) % Math.PI) < V.align || (p.settled && Math.abs(Math.abs(CIR.adiff(p.angle, lit[3])) - Math.PI) < V.align);
    const hidden = onLit && p.settled && !p.moving && aligned;
    g.round++;
    if (hidden) { g.hidden++; Sound.play('score'); Game.pop(p.x, p.y - 30, 'Vanished!', '#3fd06a'); }
    else { Sound.play('caught'); Game.pop(p.x, p.y - 30, 'Spotted!', '#ff6a4a'); Game.burst(p.x, p.y, '#b8a07a', 6); if (p.moving || !p.settled) Game.fact('still'); else if (!onLit) Game.hint('The spotlight was on another bark patch!'); }
    if (g.round >= V.rounds) CIR.finish(g, g.hidden >= 5 ? 3 : g.hidden >= 4 ? 2 : 1, 'Vanished ' + g.hidden + ' times out of ' + V.rounds + '.');
    else { g.lit = g.order[g.round % g.order.length]; g.lookT = V.look; p.settled = false; Game.pop(cx + VANISH.patches[g.lit][1], cy + VANISH.patches[g.lit][2] - 50, 'Next: this bark!', '#ffd23f'); }
  },
  drawBuild(ctx, g) {
    const cx = Math.round(World.w / 2), cy = CIR.ring.cy, lit = VANISH.patches[g.lit];
    if (!g.cir.finished) {
      const sg = ctx.createRadialGradient(cx + lit[1], cy + lit[2], 20, cx + lit[1], cy + lit[2], 90); sg.addColorStop(0, 'rgba(255,250,200,.45)'); sg.addColorStop(1, 'rgba(255,250,200,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx + lit[1], cy + lit[2], 90, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + lit[1], cy + lit[2], 50 + Math.sin(g.t * 4) * 3, 0, TAU); ctx.strokeStyle = 'rgba(255,230,120,.7)'; ctx.lineWidth = 3; ctx.stroke();
    }
  },
  drawExtra(ctx, g) {
    if (g.bird) { softShadow(ctx, g.bird.x + 10, g.bird.y + 40, 24, 10, 0.25); Game.drawSprite('honeyeater', g.bird, g.bird.scale); }
    const p = g.player;
    if (p.settled && p.settleT > 0.4) { ctx.fillStyle = 'rgba(63,208,106,.9)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('still…', p.x, p.y - 30); }
  },
  goalPoint(g) { const lit = VANISH.patches[g.lit]; return g.cir.finished || g.player.settled ? null : { x: Math.round(World.w / 2) + lit[1], y: CIR.ring.cy + lit[2] }; },
  hud(g) { const o = g.cir; setHud('Round ' + Math.min(VANISH.rounds, g.round + (o.finished ? 0 : 1)) + ' of ' + VANISH.rounds, o.finished ? 'Vanished ' + g.hidden + ' times' : 'The look in ' + Math.max(0, g.lookT).toFixed(0) + ' s'); },
  stars(g) { return CIR.stars(g); },
  endLine(g) { return CIR.endLine(g); },
  won(g) { return CIR.won(g); },
};

// ------------------------------------------------------------------ 5. Walking on water (top-down)
// A water strider rows across the pool in the ring with the button and glides to the insects that fell in.
const WATER = { r: 232, need: 6, push: 200, drag: 1.8, times: [14, 24] };

Backgrounds.circusPool = function (ctx, W, H) {
  drawRing(ctx, W, H, 73);
  const cx = Math.round(W / 2), cy = CIR.ring.cy, r = WATER.r;
  ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, TAU); ctx.fillStyle = '#4a86c8'; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); ctx.translate(cx - r, cy - r);
  Ground.water(ctx, r * 2, r * 2, 68, { shallow: '#5aa8d0', deep: '#1e5a8a', depth: 'radial', caustics: 0.2, weed: 0 });
  ctx.restore();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.stroke();
};

Missions.cir_water = {
  id: 'cir_water', bug: 'circus', stage: 'Walking on water', place: CIR.place,
  get world() { return { w: W, h: H }; }, sprite: 'waterStrider', bg: 'circusPool',
  action: 'Row', radius: 14, speed: 0, scale: 1.6, noNet: true, gentle: true,
  get home() { return { x: Math.round(W / 2), y: CIR.ring.cy, r: 1, label: '' }; },
  facts: [
    'You’re a water strider, a pond skater. Water has a stretchy skin, and a strider’s legs are covered in tiny hairs that push water away, so it stands on the skin.',
    'It rows with its middle legs, pushing little dimples into the water, and glides between strokes.',
    'Walking on water is real. The pool in the ring is pretend.',
  ],
  how: [
    'Point with the arrow keys, or touch and drag. You only move when you row.',
    'Press Row for a stroke, then glide. Row again to go faster.',
    'Catch the six insects that fell on the water. Quick: three cheers!',
  ],
  factText: {
    start: 'Walking on water! Point, then press Row for a stroke and glide to the fallen insects. The circus is pretend; the walking on water is real.',
    skin: 'Water has a stretchy skin called surface tension. A water strider’s legs are covered in tiny hairs that push water away, so it stands on the skin and stays dry.',
    row: 'A water strider rows with its middle legs. Each stroke pushes a little dimple into the water, and the strider glides between strokes.',
    eat: 'Water striders eat insects that fall onto the water. They feel the ripples the struggling insect makes.',
    wa: 'Pond skaters live on still water all over Western Australia, on lakes, ponds and quiet river edges.',
    win: 'Six caught, and your legs are still dry! That’s the trick of the water’s skin.',
  },

  setup(g) {
    const p = g.player, cx = Math.round(World.w / 2), cy = CIR.ring.cy, r = rng(Math.floor(Math.random() * 1000));
    p.x = cx; p.y = cy; p.vx = 0; p.vy = 0; p.angle = -0.6; p.flat = true; p.stroke = 0; p.strokes = 0;
    g.cir = CIR.clock(); g.dimples = [];
    const kinds = ['fly', 'termite', 'fly', 'smallAnt', 'termite', 'fly'];
    for (let i = 0; i < WATER.need; i++) { const a = i / WATER.need * TAU + r() * 0.6, d = 110 + r() * 95; g.items.push({ sprite: kinds[i], kind: 'bug', x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, r: 10, scale: 1.3, angle: r() * TAU, flat: true, stunned: true }); }
    Game.later(2, () => Game.hint('Point at an insect, then press Row!'));
  },
  move(g, dt, dx, dy) {
    const p = g.player, cx = Math.round(World.w / 2), cy = CIR.ring.cy;
    if (!g.cir.finished && (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15)) { const want = Math.atan2(dy, dx); p.angle += CIR.adiff(want, p.angle) * Math.min(1, dt * 7); p.moving = true; }
    const k = Math.exp(-WATER.drag * dt); p.vx *= k; p.vy *= k;
    // the glide bends toward where she points, the way a strider trims its course with its legs
    const sp = Math.hypot(p.vx, p.vy); if (sp > 1) { const q = Math.min(1, dt * 1.6); p.vx += (Math.cos(p.angle) * sp - p.vx) * q; p.vy += (Math.sin(p.angle) * sp - p.vy) * q; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d > WATER.r - 16) { const nx = (p.x - cx) / d, ny = (p.y - cy) / d; p.x = cx + nx * (WATER.r - 16); p.y = cy + ny * (WATER.r - 16); const vn = p.vx * nx + p.vy * ny; if (vn > 0) { p.vx -= 1.4 * vn * nx; p.vy -= 1.4 * vn * ny; } }
    if (Math.hypot(p.vx, p.vy) > 12) p.moving = true;
    p.stroke = Math.max(0, p.stroke - dt * 2.5);
  },
  update(g, dt, input) {
    const p = g.player, o = g.cir;
    CIR.tick(g, dt, input);
    setAction('Row', !o.finished);
    if (input.pressed && !o.finished) {
      p.vx += Math.cos(p.angle) * WATER.push; p.vy += Math.sin(p.angle) * WATER.push;
      const sp = Math.hypot(p.vx, p.vy); if (sp > 320) { p.vx *= 320 / sp; p.vy *= 320 / sp; }
      p.stroke = 1; p.strokes++; Sound.play('tap');
      for (const s of [-1, 1]) g.dimples.push({ x: p.x + Math.cos(p.angle + s * 1.1) * 26, y: p.y + Math.sin(p.angle + s * 1.1) * 26, life: 1 });
      Game.fact('skin'); if (p.strokes === 3) Game.fact('row');
    }
    for (const d of g.dimples) d.life -= dt * 1.2;
    g.dimples = g.dimples.filter(d => d.life > 0);
    const bug = o.finished ? null : g.items.find(i => i.kind === 'bug' && dist(i, p) < 30);
    if (bug) {
      g.items.splice(g.items.indexOf(bug), 1); g.score++; Sound.play('pick'); Game.pop(bug.x, bug.y - 20, 'Got it!', '#ffd23f');
      if (g.score === 1) Game.fact('eat');
      if (g.score === 3) Game.fact('wa');
      if (g.score >= WATER.need) CIR.finish(g, CIR.byTime(o.time, WATER.times), 'Six insects in ' + o.time.toFixed(0) + ' seconds, with ' + p.strokes + ' strokes.');
    }
    if (!o.started && p.stillT > 6 && !g.nudged) { g.nudged = true; Game.hint('Press Row to push off across the water!'); }
  },
  drawBuild(ctx, g) {
    const p = g.player;
    for (const d of g.dimples) { ctx.beginPath(); ctx.arc(d.x, d.y, 6 + (1 - d.life) * 22, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 * d.life) + ')'; ctx.lineWidth = 1.5; ctx.stroke(); }
    // the dimples under the strider's feet: the water's skin bending
    for (const [dx, dy] of [[8, 25], [8, -25], [-19, 19], [-19, -19], [12, 6], [12, -6]]) {
      const c = Math.cos(p.angle), s = Math.sin(p.angle), x = p.x + (dx * c - dy * s) * 1.6, y = p.y + (dx * s + dy * c) * 1.6;
      const sg = ctx.createRadialGradient(x, y, 1, x, y, 7); sg.addColorStop(0, 'rgba(255,255,255,.4)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
    }
  },
  goalPoint(g) { return g.cir.finished ? null : nearest(g.items.filter(i => i.kind === 'bug'), g.player, 99999); },
  hud(g) { setHud(CIR.time(g), 'Insects: ' + g.score + ' / ' + WATER.need); },
  stars(g) { return CIR.stars(g); },
  endLine(g) { return CIR.endLine(g); },
  won(g) { return CIR.won(g); },
};

Missions.cir_strong.sex = 'You are a male. Only the males have horns.';
Missions.cir_trapeze.sex = 'You are a male peacock spider.';
Missions.cir_rope.sex = 'You are a female golden orb-weaver.';
Missions.cir_vanish.sex = 'Males and females both rest on bark by day.';
Missions.cir_water.sex = 'Males and females both skate.';
finishMissions();
