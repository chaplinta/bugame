'use strict';
// Art for London's later levels (js/london2.js): the pill woodlouse (walking, and rolled into a ball), the fox, a
// centipede, the things found on the way, each level's own moving parts (LondonArt.more), and the three
// backgrounds: the darts at Alexandra Palace, Highgate Wood, and a south London street at night. The 3D models of
// the woodlouse and the fox are in js/models-london.js; the drawings here are the fallback.

Object.assign(Sprites, {
  // Pill woodlouse, Armadillidium vulgare, side-on: a slate-grey dome of plates on fourteen short legs. o.rolled: a
  // ball, turned by o.spin. o.moult === 1: the back half is new and pale.
  pillLouse(ctx, o, t) {
    const slate = '#4c4f58', pale = '#b4ae9e';
    if (o.rolled) {
      sideOn(ctx, o, 5.6); ctx.rotate(o.spin || 0);
      const g = ctx.createRadialGradient(-1.6, -2, 0.8, 0, 0, 5.8); g.addColorStop(0, '#8e929c'); g.addColorStop(1, '#383a42');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 5.6, 0, TAU); ctx.fill();
      if (o.moult === 1) { ctx.fillStyle = 'rgba(200,194,176,.7)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 5.6, Math.PI * 0.5, Math.PI * 1.5); ctx.fill(); }
      ctx.strokeStyle = 'rgba(18,18,22,.6)'; ctx.lineWidth = 0.55;
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 1.4, Math.sin(a) * 1.4); ctx.lineTo(Math.cos(a) * 5.6, Math.sin(a) * 5.6); ctx.stroke(); }
      ctx.restore(); return;
    }
    sideOn(ctx, o, 3);
    const walk = o.moving ? t * 16 : 0;
    ctx.strokeStyle = '#62656c'; ctx.lineWidth = 0.7; ctx.lineCap = 'round';
    for (let k = 0; k < 7; k++) { const x = -4.5 + k * 1.5, sw = Math.sin(walk + k * 1.1) * 0.9; ctx.beginPath(); ctx.moveTo(x, 0.4); ctx.lineTo(x + sw, 3); ctx.stroke(); }
    // the dome, a plate at a time from the back
    for (let k = 0; k < 9; k++) {
      const x0 = -6.6 + k * 1.45, x1 = x0 + 1.75, h = (x) => 5.4 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 0.2) / 6.9, 2)));
      const col = o.moult === 1 && k < 5 ? pale : slate;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, 1); ctx.lineTo(x0, 1 - h(x0)); ctx.quadraticCurveTo((x0 + x1) / 2, 0.6 - h((x0 + x1) / 2) - 0.5, x1, 1 - h(x1)); ctx.lineTo(x1, 1); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x0 + 0.2, 1 - h((x0 + x1) / 2) + 0.3, 1.2, 0.7);
      ctx.strokeStyle = 'rgba(16,16,20,.55)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(x1, 1); ctx.lineTo(x1, 1 - h(x1)); ctx.stroke();
    }
    ctx.fillStyle = '#16161a'; ctx.beginPath(); ctx.arc(5.6, -0.6, 0.55, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a3c44'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(6.2, -0.2); ctx.lineTo(8.4, -1.4 + Math.sin(t * 5) * 0.4); ctx.lineTo(9.8, 0.2 + Math.sin(t * 5) * 0.5); ctx.stroke();
    ctx.restore();
  },

  // Red fox, side-on (feet at the origin). o.air: stretched out in a leap; o.listen: standing still, ears up
  fox(ctx, o, t) {
    sideOn(ctx, o, 14);
    const air = !!o.air, step = o.moving && !air ? Math.sin(t * 12) : 0, up = o.listen && !o.moving && !air ? -2.2 : 0, dark = '#2a1a12', sock = '#3a2418';
    if (air) { ctx.rotate(-0.12); for (const [x0, x1, y1, col] of [[8, 19, 8, dark], [6, 16, 10, sock], [-9, -20, 7, dark], [-11, -18, 10, sock]]) line(ctx, [x0, 3, x1, y1], col, 2.2); }
    else for (const [x, k, col] of [[8, step, dark], [-9, -step, dark], [6, -step, sock], [-11, step, sock]]) line(ctx, [x, 4, x + k * 3, 14], col, 2.2);
    const ty = air ? -4 : 2;
    ctx.beginPath(); ctx.moveTo(-14, -1); ctx.quadraticCurveTo(-26, -6 + ty * 0.4, -34, ty); ctx.quadraticCurveTo(-26, ty + 4, -14, 3); ctx.closePath(); ctx.fillStyle = '#c8602a'; ctx.fill();   // brush
    plainEll(ctx, -32, ty, 3, 2.4, '#f4f0e8');                               // its white tip
    ell(ctx, -2, 0, 15, 6.4, '#d0682e', 0, 'hair');
    plainEll(ctx, 3, 3.6, 7, 2.4, '#f0e6d4');
    ctx.translate(0, up);
    ell(ctx, 14, -5, 5.4, 4.6, '#d0682e', 0, 'hair');
    ctx.beginPath(); ctx.moveTo(17, -5); ctx.lineTo(24, -2.6); ctx.lineTo(17, -0.6); ctx.fillStyle = '#d0682e'; ctx.fill();   // muzzle
    plainEll(ctx, 23.6, -2.6, 1, 0.8, '#151010');
    plainEll(ctx, 18.4, -1.8, 2.6, 1.2, '#f0e6d4');
    const ear = up ? 7.2 : 5.4;
    for (const dx of [11, 14]) { ctx.beginPath(); ctx.moveTo(dx, -8.6); ctx.lineTo(dx + 1.6, -8.6 - ear); ctx.lineTo(dx + 3.2, -8.6); ctx.fillStyle = '#b8521e'; ctx.fill(); ctx.beginPath(); ctx.moveTo(dx + 1, -9.4); ctx.lineTo(dx + 1.6, -8 - ear); ctx.lineTo(dx + 2.2, -9.4); ctx.fillStyle = '#1a1210'; ctx.fill(); }
    plainEll(ctx, 16.4, -6.2, 0.9, 0.7, '#1a1208');
    ctx.restore();
  },

  // A brown centipede, side-on
  centipedeSide(ctx, o, t) {
    sideOn(ctx, o, 2.6);
    const w = o.moving ? t * 18 : 0;
    ctx.strokeStyle = '#c87a2a'; ctx.lineWidth = 0.6; ctx.lineCap = 'round';
    for (let k = 0; k < 15; k++) { const x = -14 + k * 2, sw = Math.sin(w + k * 0.9) * 1.1; ctx.beginPath(); ctx.moveTo(x, 0.2); ctx.lineTo(x + sw - 0.5, 2.6); ctx.stroke(); }
    for (const dx of [-16.5, -18]) { ctx.beginPath(); ctx.moveTo(-14, -0.2); ctx.lineTo(dx, 1.2 + (dx < -17 ? -1.6 : 0)); ctx.stroke(); }
    for (let k = 0; k < 15; k++) plainEll(ctx, -14 + k * 2, -0.3 + Math.sin(w * 0.5 + k * 0.6) * 0.3, 1.3, 1.25, k % 2 ? '#a8541c' : '#b86222');
    plainEll(ctx, 16.6, -0.4, 1.9, 1.5, '#c8501e'); plainEll(ctx, 17.4, -0.9, 0.4, 0.4, '#151010');
    ctx.strokeStyle = '#a8541c'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(17.8, -1); ctx.quadraticCurveTo(21, -4 + Math.sin(t * 6) * 0.6, 24, -2); ctx.moveTo(17.8, -0.6); ctx.quadraticCurveTo(21, -1, 23.4, 1 + Math.sin(t * 6 + 1) * 0.6); ctx.stroke();
    ctx.strokeStyle = '#7a3a12'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(17.6, 0.4); ctx.quadraticCurveTo(19.4, 1.8, 18.2, 2.4); ctx.stroke();   // a fang
    ctx.restore();
  },

  // Things found on the way
  oldTv(ctx) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-8, -6, 16, 12); ctx.fillStyle = '#b8c8c0'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-6, -4, 9, 8, 2) : ctx.rect(-6, -4, 9, 8); ctx.fill(); ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(5.4, -2, 1, 0, TAU); ctx.arc(5.4, 1.4, 1, 0, TAU); ctx.fill(); plainLine(ctx, [-2, -6, -5, -10], '#3a3a3a', 0.7); plainLine(ctx, [2, -6, 5, -10], '#3a3a3a', 0.7); },
  serviceLeaf(ctx) { ctx.save(); ctx.rotate(-0.4); ctx.fillStyle = '#b8642a'; ctx.beginPath(); ctx.moveTo(0, 8); for (const [x, y] of [[-3, 5], [-8, 4], [-5, 1], [-9, -2], [-4, -3], [-5, -7], [-1, -5], [0, -10], [1, -5], [5, -7], [4, -3], [9, -2], [5, 1], [8, 4], [3, 5]]) ctx.lineTo(x, y); ctx.fill(); plainLine(ctx, [0, 9, 0, -8], '#7a3a14', 0.6); ctx.restore(); },
  hornbeamSeed(ctx) { ctx.save(); ctx.rotate(0.3); ctx.fillStyle = '#c8b06a'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-7, 2); ctx.lineTo(-3, 2); ctx.lineTo(0, 9); ctx.lineTo(3, 2); ctx.lineTo(7, 2); ctx.fill(); plainEll(ctx, 0, -4, 2.2, 2.6, '#7a5a2a'); plainLine(ctx, [0, -2, 0, 8], '#9a8040', 0.5); ctx.restore(); },
  chewedBall(ctx) { ell(ctx, 0, 0, 6.4, 6.4, '#e05a4a'); ctx.fillStyle = '#b8402e'; ctx.beginPath(); ctx.arc(2.4, -2, 2.2, 0, TAU); ctx.fill(); ctx.strokeStyle = '#f4d0c8'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(-6, 0, 7, -0.7, 0.7); ctx.stroke(); },
  // ... and the lost things of the three places (js/secrets.js)
  lostDart(ctx) { ctx.save(); ctx.rotate(-0.5); ctx.fillStyle = '#c8ccd0'; ctx.fillRect(-2, -0.8, 11, 1.6); plainLine(ctx, [9, 0, 12, 0], '#8a8e94', 0.7); ctx.fillStyle = '#2f7d5b'; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-9, -4.4); ctx.lineTo(-7, 0); ctx.lineTo(-9, 4.4); ctx.fill(); ctx.restore(); },
  potShard(ctx) { ctx.save(); ctx.rotate(0.2); ctx.fillStyle = '#b8683e'; ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(-5, -5); ctx.lineTo(2, -6); ctx.lineTo(7, -1); ctx.lineTo(4, 5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#7a3e22'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-5, -2); ctx.quadraticCurveTo(0, -4, 6, 0); ctx.moveTo(-6, 1.4); ctx.quadraticCurveTo(0, -0.6, 5.4, 2.8); ctx.stroke(); ctx.restore(); },
  lostTeddy(ctx) { ell(ctx, 0, 3, 5, 5.6, '#b88a52'); ell(ctx, 0, -5, 4.2, 4, '#c0945a'); for (const s of [-1, 1]) { plainEll(ctx, s * 3.4, -8.4, 1.7, 1.7, '#a87a44'); plainEll(ctx, s * 5.6, 1, 1.8, 2.6, '#b88a52'); plainEll(ctx, s * 2.8, 8, 2.2, 1.8, '#a87a44'); plainEll(ctx, s * 1.5, -5.6, 0.6, 0.6, '#1a1210'); } plainEll(ctx, 0, -3.8, 1.5, 1.1, '#e8d4a8'); plainEll(ctx, 0, -4.2, 0.6, 0.45, '#1a1210'); },
});
Sprites.queenWasp = Sprites.commonWasp;   // the queen at the darts: the same wasp, drawn bigger
SpriteCache.registerAll(['oldTv', 'serviceLeaf', 'hornbeamSeed', 'chewedBall', 'lostDart', 'potShard', 'lostTeddy']);

// ------------------------------------------------------------------ the darts
const LDN2 = {
  dart(ctx, x, y, a, col) {   // its point at (x, y), flying along a
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    plainLine(ctx, [0, 0, -5, 0], '#8a8e94', 1); ctx.fillStyle = '#c8ccd0'; ctx.fillRect(-15, -1.4, 10, 2.8); plainLine(ctx, [-15, 0, -21, 0], '#3a3a3a', 1.2);
    ctx.fillStyle = col || '#2f7d5b'; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-29, -6); ctx.lineTo(-26, 0); ctx.lineTo(-29, 6); ctx.fill();
    ctx.restore();
  },
  // The board, seen a little from the side: black and cream wedges, red and green rings, the bull
  board(ctx, B) {
    const rx = B.r * 0.66, ry = B.r, nums = 20;
    ctx.save(); ctx.translate(B.x, B.y);
    ctx.fillStyle = '#16161a'; ctx.beginPath(); ctx.ellipse(0, 0, rx + 9, ry + 12, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < nums; k++) {
      const a0 = (k - 0.5) / nums * TAU - Math.PI / 2, a1 = (k + 0.5) / nums * TAU - Math.PI / 2;
      const wedge = (r0, r1, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, rx * r1, ry * r1, 0, a0, a1); ctx.ellipse(0, 0, rx * r0, ry * r0, 0, a1, a0, true); ctx.fill(); };
      wedge(0.1, 0.92, k % 2 ? '#e8dcb8' : '#1c1c20');
      wedge(0.52, 0.62, k % 2 ? '#3a8a4a' : '#c8322a'); wedge(0.86, 0.96, k % 2 ? '#3a8a4a' : '#c8322a');
    }
    ctx.fillStyle = '#3a8a4a'; ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.13, ry * 0.13, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.06, ry * 0.06, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // Something coming down the road at you: a car, a black cab or the night bus, k = 1 at the crossing
  vehicle(ctx, kind, x, y, k, a) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha = a;
    const box = (bx, by, w, h, col, r) => { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, w, h, r || 0) : ctx.rect(bx, by, w, h); ctx.fill(); };
    const lamp = (lx, ly) => { const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 46); g.addColorStop(0, 'rgba(255,250,210,.95)'); g.addColorStop(1, 'rgba(255,250,210,0)'); ctx.fillStyle = g; ctx.fillRect(lx - 46, ly - 46, 92, 92); plainEll(ctx, lx, ly, 8, 7, '#fffbe0'); };
    if (kind === 'bus') {
      box(-78, -250, 156, 240, '#c8201c', 12); box(-66, -236, 132, 56, '#ffe9a8', 5); box(-66, -128, 132, 62, '#ffe9a8', 5);
      box(-56, -172, 112, 26, '#1a1a1a', 3); ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('NIGHT BUS', 0, -152);
      ctx.fillStyle = 'rgba(40,30,30,.75)'; for (const hx of [-40, -8, 26]) { ctx.beginPath(); ctx.arc(hx, -196, 9, 0, TAU); ctx.fill(); ctx.fillRect(hx - 11, -188, 22, 10); }   // people upstairs
      box(-78, -38, 156, 28, '#8a1612', 6); box(-70, -14, 26, 14, '#141414', 4); box(44, -14, 26, 14, '#141414', 4); lamp(-52, -34); lamp(52, -34);
    } else {
      const cab = kind === 'cab', body = cab ? '#1c1c20' : '#3a6ab0';
      box(-66, -70, 132, 60, body, 14); box(-50, -108, 100, 46, body, 14); box(-42, -100, 84, 32, 'rgba(190,220,240,.75)', 6);
      if (cab) { box(-16, -122, 32, 14, '#ffd23f', 3); ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TAXI', 0, -111); }
      box(-60, -16, 22, 16, '#141414', 4); box(38, -16, 22, 16, '#141414', 4); box(-22, -34, 44, 12, '#e8e8e0', 2); lamp(-46, -44); lamp(46, -44);
    }
    ctx.restore();
  },
};

LondonArt.more.ldn_darts = {
  spots(ctx, g, m, see) {
    const L = g.level, t = g.t, O = g.oche, B = L.board, p = g.player;
    for (const d of O.darts) LDN2.dart(ctx, d.x, d.y, 0.06);
    if (O.fly) { const f = O.fly, k = Math.min(1, f.t), x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * 16; LDN2.dart(ctx, x, y, Math.atan2(f.y1 - f.y0 + (k - 0.5) * 60, f.x1 - f.x0)); }
    const sip = L.spots.find(s => s.id === 'sip');
    if (see(sip.x)) {   // a plastic cup on its side, and what was in it
      ctx.fillStyle = 'rgba(240,190,70,' + (sip.done ? 0.35 : 0.9) + ')'; ctx.beginPath(); ctx.ellipse(sip.x + 8, 468, sip.done ? 12 : 26, 3.4, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(sip.x - 22, 462); ctx.rotate(-1.5); ctx.fillStyle = 'rgba(235,240,245,.7)'; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(6, -12); ctx.lineTo(8, 12); ctx.lineTo(-8, 12); ctx.fill(); ctx.restore();
    }
    const tr = L.spots.find(s => s.id === 'trophy');
    if (see(tr.x)) { const gl = 0.5 + 0.5 * Math.sin(t * 3); ctx.strokeStyle = 'rgba(255,255,255,' + gl * 0.9 + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tr.x - 14, tr.y - 16); ctx.lineTo(tr.x - 8, tr.y - 22); ctx.moveTo(tr.x - 16, tr.y - 22); ctx.lineTo(tr.x - 6, tr.y - 16); ctx.stroke(); }
    if (!g.counts.warm) {   // cold and stiff on her beam
      ctx.fillStyle = 'rgba(210,235,255,.9)'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      if (p.shiver) { ctx.strokeStyle = 'rgba(210,235,255,.9)'; ctx.lineWidth = 2; for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const x = p.x + s * (22 + k * 8 + Math.sin(t * 40) * 2); ctx.beginPath(); ctx.moveTo(x, p.y - 22); ctx.lineTo(x + s * 3, p.y - 14); ctx.lineTo(x, p.y - 6); ctx.stroke(); } }
      else { const z = (t * 0.6) % 1; ctx.globalAlpha = 0.9 - z * 0.9; ctx.fillText('z', p.x + 18, p.y - 30 - z * 26); ctx.globalAlpha = 1; }
    }
  },
  front(ctx, g, m) {
    const L = g.level, t = g.t;
    for (const jx of L.jets) {
      if (Math.abs(jx - g.player.x) > 900) continue;
      if (g.jetT < 1.1) {
        for (let i = 0; i < 16; i++) { const y = 556 - i * 36 - ((t * 420) % 36), r = 15 + i * 1.3; ctx.fillStyle = 'rgba(238,240,250,' + (0.62 - i * 0.03) + ')'; ctx.beginPath(); ctx.arc(jx + Math.sin(t * 9 + i * 1.7) * (6 + i), y, r, 0, TAU); ctx.fill(); }
      } else if (g.jetT > 3) { ctx.fillStyle = 'rgba(238,240,250,.7)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(jx + Math.sin(t * 20 + i * 2) * 8, 548 - i * 9, 5 - i, 0, TAU); ctx.fill(); } }
    }
  },
};

// ------------------------------------------------------------------ the wood
LondonArt.more.ldn_louse = {
  spots(ctx, g, m, see) {
    const L = g.level, t = g.t, p = g.player, F = L.floor;
    if (see(420) || see(750)) {   // the road at the wood's edge: a bus going by, seen through the railings
      const bus = g.movers.find(q => q.kind === 'roadbus');
      if (bus && bus.shown) { ctx.save(); ctx.beginPath(); ctx.rect(420, 380, 330, 180); ctx.clip(); LondonArt.bus(ctx, bus.x, 544, 0.92, bus.dir, { t }); ctx.restore(); }
      LondonStreet.railings(ctx, 420, 750, F, 58);
    }
    for (const s of L.spots) {
      if (!see(s.x)) continue;
      if (s.kind === 'food') {
        const a = s.done ? 0.45 : 1; ctx.globalAlpha = a;
        if (s.look === 'wood') { ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(s.x - 20, F - 15, 40, 15, 5) : ctx.rect(s.x - 20, F - 15, 40, 15); ctx.fill(); ctx.fillStyle = '#c8a86a'; ctx.beginPath(); ctx.ellipse(s.x + 19, F - 7.5, 4, 7.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(230,220,180,.8)'; for (const dx of [-12, -3, 7]) ctx.fillRect(s.x + dx, F - 12 + (dx & 3), 4, 2); }
        else if (s.look === 'leaf') { for (const [dx, r, c] of [[-10, -0.4, '#a8642a'], [4, 0.3, '#8a4a1e'], [-2, 0, '#c08a3a']]) { ctx.save(); ctx.translate(s.x + dx, F - 5); ctx.rotate(r); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 13, 5, 0, 0, TAU); ctx.fill(); plainLine(ctx, [-12, 0, 12, 0], 'rgba(60,30,10,.5)', 0.8); ctx.restore(); } }
        else { for (const [dx, h, r] of [[-8, 18, 9], [7, 12, 7]]) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(s.x + dx - 2, F - h, 4, h); ctx.fillStyle = '#b8683a'; ctx.beginPath(); ctx.ellipse(s.x + dx, F - h, r, r * 0.55, 0, Math.PI, 0); ctx.fill(); } }
        ctx.globalAlpha = 1;
        if (s.done) { ctx.fillStyle = '#2a1c10'; for (const dx of [-6, 0, 5]) { ctx.beginPath(); ctx.arc(s.x + dx, F - 9, 2, 0, TAU); ctx.fill(); } }   // bite marks
      } else if (s.kind === 'poo' && !s.done) { ctx.fillStyle = '#3a2a1a'; for (const [dx, dy] of [[-5, 0], [0, -1], [5, 0], [-2, -4], [3, -4]]) { ctx.beginPath(); ctx.ellipse(s.x + dx, F - 2 + dy, 2.6, 1.8, 0, 0, TAU); ctx.fill(); } }
      else if (s.kind === 'moult' && s.done) { ctx.fillStyle = 'rgba(235,235,225,.75)'; ctx.beginPath(); ctx.ellipse(s.x - 22, F - 3, 8, 5, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(160,160,150,.8)'; ctx.lineWidth = 0.8; for (const dx of [-26, -22, -18]) { ctx.beginPath(); ctx.moveTo(s.x + dx, F - 3); ctx.lineTo(s.x + dx, F - 7); ctx.stroke(); } }
      else if (s.kind === 'dew') {
        ctx.strokeStyle = '#3f7a38'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(s.x + 46, F); ctx.quadraticCurveTo(s.x + 30, F - 60, s.x - 2, s.y - 8); ctx.stroke();
        ctx.fillStyle = '#4a8a40'; for (let k = 0; k < 7; k++) { const u = k / 7, x = s.x + 46 - u * 48, y = F - u * 46 - Math.sin(u * 3) * 14; ctx.beginPath(); ctx.ellipse(x, y, 9, 3, -0.8 + u, 0, TAU); ctx.fill(); }
        if (!s.done) { const gr = ctx.createRadialGradient(s.x - 1, s.y - 1, 0.5, s.x, s.y, 6); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(150,200,235,.75)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, 5.5 + Math.sin(t * 3) * 0.4, 0, TAU); ctx.fill(); }
      }
    }
    // the ants on their trail
    for (const a of g.ants) if (see(a.x)) {
      ctx.save(); ctx.translate(a.x, a.y - 3); ctx.rotate(a.rot || 0); ctx.scale(a.face, 1);
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 0.9; for (const dx of [-3, 0, 3]) { ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx + Math.sin(t * 24 + dx + a.x) * 2, 3); ctx.stroke(); }
      ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.ellipse(-4, -1, 3.4, 2.4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0.4, -1, 1.8, 1.6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(4, -1.6, 2.2, 2, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // the woodlouse spider under its stone: legs first, then all of it
    const S = g.spider, lair = L.lair;
    if (see(lair[1])) {
      const out = S.state === 'out' ? Math.min(1, (2 - S.t) * 3, S.t * 3) : S.state === 'warn' ? 0.15 : 0, x = lair[1] - 14 - out * 90, y = F - 9;
      if (out > 0) {
        ctx.save(); ctx.translate(x, y);
        ctx.strokeStyle = '#c8502a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        for (let k = 0; k < 4; k++) { const sw = Math.sin(t * 12 + k * 1.4) * 3; ctx.beginPath(); ctx.moveTo(-2 - k * 2, -2); ctx.lineTo(-10 - k * 5 + sw, -12 + k); ctx.lineTo(-16 - k * 6 + sw, 8); ctx.stroke(); }
        ctx.fillStyle = '#d8c8a8'; ctx.beginPath(); ctx.ellipse(10, 0, 11, 7, 0, 0, TAU); ctx.fill();          // pale abdomen
        ctx.fillStyle = '#a83a1e'; ctx.beginPath(); ctx.ellipse(-4, -1, 7, 5.4, 0, 0, TAU); ctx.fill();        // red front
        ctx.strokeStyle = '#6a1e0e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-17, 2, -15, 7); ctx.moveTo(-9, 2); ctx.quadraticCurveTo(-14, 6, -11, 9); ctx.stroke();   // those fangs
        ctx.restore();
      }
    }
    if (g.counts.moult === 1) { /* her new back half shows on the drawing itself */ }
  },
  front(ctx, g, m) {
    const L = g.level, t = g.t, S = g.spider, lair = L.lair, F = L.floor, p = g.player;
    if (S.state !== 'in' && Math.abs(p.x - lair[0]) < 1000) {   // where the spider hunts
      ctx.fillStyle = 'rgba(230,40,40,' + (S.state === 'warn' ? 0.12 + 0.1 * Math.sin(t * 20) : 0.3) + ')'; ctx.fillRect(lair[0], F - 26, lair[1] - lair[0], 26);
      ctx.strokeStyle = 'rgba(220,40,40,.6)'; ctx.lineWidth = 2; ctx.strokeRect(lair[0], F - 26, lair[1] - lair[0], 26);
    }
    if (g.inSun) { ctx.fillStyle = 'rgba(255,230,120,' + (0.1 + 0.05 * Math.sin(t * 5)) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y - 10, 30, 0, TAU); ctx.fill(); }
    if (g.damp < 0.4 && !g.homeSafe) { ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Too dry!', p.x, p.y - 34 - Math.sin(t * 8) * 2); }
  },
};

// ------------------------------------------------------------------ the street
LondonArt.more.ldn_fox = {
  spots(ctx, g, m, see) {
    const L = g.level, t = g.t, p = g.player, F = L.floor, R = L.road;
    const tr = g.movers.find(q => q.kind === 'vtrain');
    if (tr && tr.shown) {   // a train over the viaduct: a row of lit windows
      ctx.save(); ctx.beginPath(); ctx.rect(1726, 250, 1014, 114); ctx.clip();
      for (let k = 0; k < 4; k++) { const x = tr.x - k * 236; ctx.fillStyle = '#2a3a5a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 230, 304, 226, 58, 8) : ctx.rect(x - 230, 304, 226, 58); ctx.fill(); ctx.fillStyle = '#ffe9a8'; for (let j = 0; j < 6; j++) ctx.fillRect(x - 220 + j * 36, 314, 26, 22); ctx.fillStyle = '#d8c020'; ctx.fillRect(x - 230, 344, 226, 4); }
      ctx.restore();
    }
    for (const s of L.spots) {
      if (!see(s.x)) continue;
      if (s.prey && s.kind === 'snack' && !s.done) {
        if (s.up) { const w = Math.sin(t * 9) * 3; ctx.strokeStyle = '#d88a8a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s.x, F + 2); ctx.quadraticCurveTo(s.x + w, F - 9, s.x - w * 0.6, F - 17); ctx.stroke(); ctx.strokeStyle = '#b86a6a'; ctx.lineWidth = 1; for (const dy of [-5, -9, -13]) { ctx.beginPath(); ctx.moveTo(s.x - 2 + w * 0.3, F + dy); ctx.lineTo(s.x + 2 + w * 0.3, F + dy); ctx.stroke(); } }
        else { ctx.fillStyle = '#4a3420'; ctx.beginPath(); ctx.ellipse(s.x, F - 1, 6, 2.4, 0, 0, TAU); ctx.fill(); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(s.x - 5 + k * 3.4, F - 3 - (k % 2), 1.6, 0, TAU); ctx.fill(); } }   // a worm cast
      } else if (s.kind === 'mouse' && !s.done) {
        const q = Math.sin(t * 22) * (s.up ? 2.2 : 0.8);
        ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 2; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(s.x + k * 7, F); ctx.quadraticCurveTo(s.x + k * 8 + q, F - 22, s.x + k * 9 + q * 2, F - 36 - (k & 1) * 6); ctx.stroke(); }
        if (s.up) { Game.drawSprite('mouseSide', { x: s.x, y: F - 1, angle: 0, face: p.x < s.x ? 1 : -1, flat: true, moving: false }, 1.2); const k = (t * 1.6) % 1; ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 - k * 0.8) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, F - 10, 10 + k * 26, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      } else if (s.id === 'fly' && !s.done) {   // a daddy-long-legs under the light
        ctx.save(); ctx.translate(s.x, s.y);
        ctx.strokeStyle = 'rgba(70,56,40,.9)'; ctx.lineWidth = 0.9; for (const k of [-1, 1]) for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.moveTo(j * 3 - 3, 0); ctx.lineTo(k * (9 + j * 3), 7 + j * 2); ctx.lineTo(k * (12 + j * 4), 20 + j); ctx.stroke(); }
        ctx.fillStyle = '#8a6a48'; ctx.beginPath(); ctx.ellipse(-4, 0, 9, 2, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(6, -0.5, 2.4, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(230,230,240,.5)'; const b = Math.sin(t * 60) * 0.5; for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(0, -5 * k * (0.6 + b * k), 3, 10, k * 0.5, 0, TAU); ctx.fill(); }
        ctx.restore();
      } else if (s.kind === 'welly' && !s.done) LDN2.welly(ctx, s.x, F, 1);
      else if (s.kind === 'post' && s.done) { ctx.fillStyle = 'rgba(230,210,90,.55)'; ctx.beginPath(); ctx.ellipse(s.x + 10, F - 1, 14, 3, 0, 0, TAU); ctx.fill(); }
      else if (s.kind === 'gnome') {
        const x = s.x, y = F;
        ctx.fillStyle = '#3a6ab0'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 9, y - 26, 18, 26, 6) : ctx.rect(x - 9, y - 26, 18, 26); ctx.fill();
        ctx.fillStyle = '#f2cfae'; ctx.beginPath(); ctx.arc(x, y - 31, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.moveTo(x - 7, y - 30); ctx.lineTo(x, y - 14); ctx.lineTo(x + 7, y - 30); ctx.fill();
        ctx.fillStyle = '#c8281e'; ctx.beginPath(); ctx.moveTo(x - 8, y - 35); ctx.lineTo(x + 1, y - 56); ctx.lineTo(x + 8, y - 35); ctx.fill();
        if (s.done) { ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(x + 1, y - 57, 4.4, 2.6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 2, y - 60, 3, 2, 0, 0, TAU); ctx.fill(); const w = Math.sin(t * 5) * 2; ctx.strokeStyle = 'rgba(160,200,90,.7)'; ctx.lineWidth = 1.4; for (const dx of [-5, 3]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 64); ctx.quadraticCurveTo(x + dx + w, y - 72, x + dx, y - 80); ctx.stroke(); } }
      } else if (s.kind === 'den') {
        // the cubs: eyes in the dark under the shed, then out they come
        const out = s.done ? Math.min(1, (t - s.doneAt) * 1.2) : 0;
        for (let k = 0; k < 3; k++) {
          const cx = s.x - 44 + k * 40 - out * (20 + k * 14), cy = F - 6;
          if (out > 0.2) { ctx.save(); ctx.translate(cx, cy + Math.abs(Math.sin(t * 7 + k)) * -6 * out); ctx.scale(0.55, 0.55); Sprites.fox(ctx, { face: 1, angle: 0, moving: true }, t + k); ctx.restore(); }
          else { ctx.fillStyle = 'rgba(190,230,120,.9)'; const bl = Math.sin(t * 0.9 + k * 2) > 0.94 ? 0.2 : 1; for (const dx of [-4, 4]) { ctx.beginPath(); ctx.ellipse(s.x - 40 + k * 36 + dx, F - 22, 2.2, 2.2 * bl, 0, 0, TAU); ctx.fill(); } }
        }
        if (s.done && g.counts.welly) LDN2.welly(ctx, s.x - 96, F, 1);
      }
    }
    // the dog behind its gate
    const d = L.dog; if (see(d.x)) { const bark = g.barked && Math.sin(t * 16) > 0; ctx.fillStyle = '#c8a068'; ctx.beginPath(); ctx.ellipse(d.x - 2, F - 52, 13, 11, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(d.x - 15, F - 49, 8, bark ? 3 : 5, 0, 0, TAU); ctx.fill(); if (bark) { ctx.beginPath(); ctx.ellipse(d.x - 14, F - 42, 8, 3, 0.3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#8a6a40'; ctx.beginPath(); ctx.ellipse(d.x + 5, F - 60, 5, 8, 0.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(d.x - 6, F - 55, 1.8, 0, TAU); ctx.arc(d.x - 23, F - 50, 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6a4a2a'; for (let k = 0; k < 5; k++) ctx.fillRect(d.x - 40 + k * 18, F - 78, 8, 78); ctx.fillRect(d.x - 42, F - 64, 84, 6); ctx.fillRect(d.x - 42, F - 22, 84, 6); }
    // the beacons at the crossing blink
    if (see(R.x0) || see(R.x1)) for (const bx of [R.x0 - 16, R.x1 + 16]) { const on = Math.sin(t * 5) > 0; const gr = ctx.createRadialGradient(bx, F - 150, 2, bx, F - 150, on ? 34 : 14); gr.addColorStop(0, 'rgba(255,190,60,' + (on ? 0.95 : 0.5) + ')'); gr.addColorStop(1, 'rgba(255,190,60,0)'); ctx.fillStyle = gr; ctx.fillRect(bx - 36, F - 186, 72, 72); ctx.fillStyle = on ? '#ffc040' : '#b8862a'; ctx.beginPath(); ctx.arc(bx, F - 150, 9, 0, TAU); ctx.fill(); }
  },
  front(ctx, g, m) {
    const L = g.level, t = g.t, p = g.player, F = L.floor, R = L.road, s = m.scale;
    // what she carries: the mouse by its tail, and the welly
    const mx = p.x + p.face * 24 * s, my = p.y - 16 * s;
    if (p.welly) LDN2.welly(ctx, mx + p.face * 2, my + 20, p.face);
    if (p.carry === 'mouse') { ctx.strokeStyle = '#c89a94'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + p.face * 2, my + 8); ctx.stroke(); ctx.fillStyle = '#8a7a6e'; ctx.beginPath(); ctx.ellipse(mx + p.face * 3, my + 13, 4.4, 6.4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(mx + p.face * 3, my + 20, 3, 0, TAU); ctx.fill(); }
    if (p.listen && !g.pounce && L.spots.some(q => q.prey && !q.done && Math.abs(q.x - p.x) < 200)) {   // listening: sound rings by her ears
      const k = (t * 1.4) % 1; ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 - k * 0.7) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x + p.face * 20 * s, p.y - 26 * s, 8 + k * 16, 0, TAU); ctx.stroke();
    }
    // the road: a red mark where each one will pass, and the thing itself
    if (Math.abs(p.x - (R.x0 + R.x1) / 2) > 1300) return;
    const vp = { x: (R.x0 + R.x1) / 2, y: 392 };
    for (const ln of R.lanes) {
      if (ln.t < 1.3 && ln.t > -0.3) { ctx.beginPath(); ctx.ellipse(ln.x, F - 2, 96, 10, 0, 0, TAU); ctx.fillStyle = 'rgba(230,40,40,' + (0.18 + 0.3 * (1 - Math.max(0, ln.t) / 1.3)) + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(220,40,40,.6)'; ctx.lineWidth = 2; ctx.stroke(); }
      if (ln.t < 2.6 && ln.t > -0.5) {
        const k = ln.t > 0 ? 1 / (1 + ln.t * 2.6) : 1 + (-ln.t) * 4;
        LDN2.vehicle(ctx, ln.kind, vp.x + (ln.x - vp.x) * k, vp.y + (F + 6 - vp.y) * k, k, ln.t < 0 ? Math.max(0, 1 + ln.t / 0.5) : 1);
      }
    }
  },
};
LDN2.welly = function (ctx, x, y, face) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face < 0 ? -1 : 1, 1);
  ctx.fillStyle = '#e0b020'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-6, -24, 12, 22, 3) : ctx.rect(-6, -24, 12, 22); ctx.fill();
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-6, -9, 20, 9, [3, 6, 2, 2]) : ctx.rect(-6, -9, 20, 9); ctx.fill();
  ctx.fillStyle = '#a87a10'; ctx.fillRect(-6, -2, 20, 2); ctx.fillRect(-6, -24, 12, 3);
  ctx.restore();
};

// ------------------------------------------------------------------ the backgrounds
Backgrounds.ldnDarts = function (ctx, W, H) {
  const L = Game.g.level, B = L.board, F = L.floor, r = rng(61);
  // the hall, dark behind the lights
  let g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#14102a'); g.addColorStop(0.7, '#2a1c4a'); g.addColorStop(1, '#1a1230');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 600);
  // the cold roof space at each end: old timbers, a round window, frost
  const roof = (x0, x1) => {
    const gr = ctx.createLinearGradient(0, 0, 0, 600); gr.addColorStop(0, '#1c2638'); gr.addColorStop(1, '#2c3a50'); ctx.fillStyle = gr; ctx.fillRect(x0, 0, x1 - x0, 600);
    ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = 16; for (let x = x0 - 200; x < x1; x += 190) { ctx.beginPath(); ctx.moveTo(x, 600); ctx.lineTo(x + 330, 0); ctx.stroke(); }
    ctx.lineWidth = 12; for (const y of [70, 330, 470]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(220,235,250,.5)'; for (let i = 0; i < 60; i++) ctx.fillRect(x0 + r() * (x1 - x0), 64 + (i % 3) * 200 + r() * 10, 3, 2);   // frost
    ctx.fillStyle = '#3a3026'; ctx.fillRect(x0, F - 4, x1 - x0, 44);
  };
  const arches = (x0, x1) => {   // the hall's iron roof ribs
    ctx.strokeStyle = '#3c3c48'; ctx.lineCap = 'butt';
    for (const k of [0, 1]) { const w = x1 - x0, y = 300 + k * 26; ctx.lineWidth = k ? 3 : 7; ctx.beginPath(); ctx.moveTo(x0 - 40, y + 220); ctx.quadraticCurveTo(x0 + w / 2, y - 330 + k * 30, x1 + 40, y + 220); ctx.stroke(); }
  };
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 600, 600); ctx.clip(); roof(0, 600); arches(0, 600);
  // the rose window, and through it London lit up at night, a long way below the hill
  const RX = 430, RY = 236, RR = 80;
  ctx.save(); ctx.beginPath(); ctx.arc(RX, RY, RR, 0, TAU); ctx.clip();
  const ng = ctx.createLinearGradient(0, RY - RR, 0, RY + RR); ng.addColorStop(0, '#101a44'); ng.addColorStop(0.7, '#3a4a84'); ng.addColorStop(1, '#6a5a7a'); ctx.fillStyle = ng; ctx.fillRect(RX - RR, RY - RR, RR * 2, RR * 2);
  ctx.fillStyle = '#f0f0e0'; ctx.beginPath(); ctx.arc(RX + 34, RY - 44, 10, 0, TAU); ctx.fill();
  LondonSky.line(ctx, [['canary', RX - 50, 0.3], ['stPauls', RX - 14, 0.42], ['cheesegrater', RX + 12, 0.34], ['gherkin', RX + 24, 0.34], ['walkie', RX + 36, 0.34], ['shard', RX + 54, 0.38]], RY + 52, '#0c1230', '#ffdc8a');
  ctx.fillStyle = '#0c1230'; ctx.fillRect(RX - RR, RY + 52, RR * 2, RR);
  ctx.fillStyle = '#ffdc8a'; for (let i = 0; i < 60; i++) ctx.fillRect(RX - RR + r() * RR * 2, RY + 54 + r() * 24, 1.6, 1.6);
  ctx.restore();
  ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(RX, RY, RR, 0, TAU); ctx.stroke();
  ctx.lineWidth = 3; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.beginPath(); ctx.moveTo(RX + Math.cos(a) * 22, RY + Math.sin(a) * 22); ctx.lineTo(RX + Math.cos(a) * RR, RY + Math.sin(a) * RR); ctx.stroke(); ctx.beginPath(); ctx.arc(RX + Math.cos(a + TAU / 24) * 62, RY + Math.sin(a + TAU / 24) * 62, 15, 0, TAU); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(RX, RY, 22, 0, TAU); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(3104, 0, W - 3104, 600); ctx.clip(); roof(3104, W); arches(3104, W);
  // a skylight, and the old television mast against the night
  ctx.save(); ctx.beginPath(); ctx.moveTo(3190, 372); ctx.lineTo(3210, 214); ctx.lineTo(3330, 214); ctx.lineTo(3350, 372); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#16224e'; ctx.fillRect(3180, 200, 180, 180); ctx.fillStyle = '#f0f0e0'; for (let i = 0; i < 12; i++) ctx.fillRect(3190 + r() * 150, 216 + r() * 90, 1.6, 1.6);
  LondonSky.mark(ctx, 'allyMast', 3270, 380, 1.7, '#0a1030', '#ffdc8a'); ctx.fillStyle = '#ff4030'; ctx.beginPath(); ctx.arc(3270, 226, 3, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(3190, 372); ctx.lineTo(3210, 214); ctx.lineTo(3330, 214); ctx.lineTo(3350, 372); ctx.closePath(); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(3270, 214); ctx.lineTo(3270, 372); ctx.stroke();
  ctx.restore();
  // the stage: back wall, banner, the big screen, lights on their truss
  ctx.fillStyle = '#241848'; ctx.fillRect(644, 60, 1460, 500);
  ctx.fillStyle = '#3a2a6a'; for (let x = 660; x < 2100; x += 120) ctx.fillRect(x, 60, 60, 500);
  ctx.fillStyle = '#c8322a'; ctx.fillRect(820, 96, 480, 70); ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 44px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('WORLD DARTS', 1060, 146);
  ctx.fillStyle = '#0c0c14'; ctx.fillRect(1380, 96, 250, 150); ctx.fillStyle = '#18305a'; ctx.fillRect(1390, 106, 230, 130);
  ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 86px Georgia, serif'; ctx.fillText('180', 1505, 204);
  ctx.fillStyle = '#3a3a44'; ctx.fillRect(640, 30, 1470, 12); ctx.fillRect(640, 52, 1470, 6); for (let x = 650; x < 2100; x += 46) plainLine(ctx, [x, 42, x + 23, 52, x + 46, 42], '#3a3a44', 2);
  for (const [x, col] of [[760, '255,220,150'], [1000, '255,150,150'], [1240, '255,240,200'], [1640, '255,250,230'], [1880, '150,200,255'], [2040, '255,220,150']]) {
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(x - 12, 56, 24, 22);
    const cone = ctx.createLinearGradient(0, 78, 0, 560); cone.addColorStop(0, 'rgba(' + col + ',.34)'); cone.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(x - 10, 78); ctx.lineTo(x + 10, 78); ctx.lineTo(x + 130, 560); ctx.lineTo(x - 130, 560); ctx.fill();
  }
  // the board in its lit surround, and the line to throw from
  ctx.fillStyle = '#101018'; ctx.fillRect(B.x - 70, B.y - 96, 140, 270); ctx.fillStyle = '#e8e4d8'; ctx.fillRect(B.x - 62, B.y - 88, 124, 176);
  ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.strokeRect(B.x - 62, B.y - 88, 124, 176);
  LDN2.board(ctx, B);
  ctx.fillStyle = '#c8322a'; ctx.fillRect(644, F - 4, 1460, 44); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(644, F + 8, 1460, 32);
  ctx.fillStyle = '#f4f4f0'; ctx.fillRect(1206, F - 4, 8, 4);
  // the trophy on its stand
  const tx = 1960, ty = 430;
  g = ctx.createLinearGradient(1920, 0, 2000, 0); g.addColorStop(0, '#2a2a34'); g.addColorStop(0.5, '#4a4a58'); g.addColorStop(1, '#22222a'); ctx.fillStyle = g; ctx.fillRect(1920, 430, 80, 130);
  ctx.fillStyle = '#d8a820'; ctx.fillRect(tx - 12, ty - 8, 24, 8); ctx.fillRect(tx - 3, ty - 24, 6, 16); ctx.beginPath(); ctx.moveTo(tx - 18, ty - 60); ctx.lineTo(tx + 18, ty - 60); ctx.quadraticCurveTo(tx + 16, ty - 26, tx, ty - 22); ctx.quadraticCurveTo(tx - 16, ty - 26, tx - 18, ty - 60); ctx.fill();
  ctx.strokeStyle = '#d8a820'; ctx.lineWidth = 3; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(tx + s * 20, ty - 46, 8, s > 0 ? -1.4 : 1.7, s > 0 ? 1.4 : 4.5); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(tx - 12, ty - 56, 4, 22);
  for (const jx of L.jets) { ctx.fillStyle = '#1a1a22'; ctx.fillRect(jx - 14, F - 12, 28, 12); ctx.fillStyle = '#4a4a58'; ctx.fillRect(jx - 8, F - 16, 16, 5); }
  // the crowd: rows of heads in the dark, signs, the long tables
  ctx.fillStyle = '#1c1434'; ctx.fillRect(2104, 60, 956, 500);
  for (let row = 0; row < 5; row++) for (let x = 2120 + (row % 2) * 22; x < 3050; x += 44) {
    const y = 250 + row * 44 + r() * 8, c = ['#3a2a5a', '#4a3468', '#2e2248', '#54407a'][Math.floor(r() * 4)];
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.fillRect(x - 17, y + 10, 34, 40);
    if (r() < 0.16) { ctx.fillStyle = '#f4f0e0'; ctx.fillRect(x - 20, y - 54, 40, 28); ctx.fillStyle = '#c8322a'; ctx.font = 'bold 17px sans-serif'; ctx.fillText('180', x, y - 34); ctx.fillStyle = c; ctx.fillRect(x - 2, y - 26, 4, 16); }
    else if (r() < 0.12) { ctx.fillStyle = '#e03a3a'; ctx.fillRect(x + 8, y - 44, 9, 34); ctx.fillRect(x + 4, y - 22, 18, 16); }
  }
  ctx.fillStyle = '#2a2040'; ctx.fillRect(2104, F - 4, 956, 44);
  for (const s of L.solids) if (s[4] === 'table') { ctx.fillStyle = '#4a3a2a'; ctx.fillRect(s[0] - 40, 514, 70, 8); ctx.fillRect(s[0] + s[2] - 30, 514, 70, 8); ctx.fillRect(s[0] - 30, 522, 6, 38); ctx.fillRect(s[0] + s[2] + 24, 522, 6, 38);
    for (const dx of [50, 150, 210]) { ctx.fillStyle = 'rgba(235,240,245,.55)'; ctx.fillRect(s[0] + dx, s[1] - 22, 14, 22); ctx.fillStyle = 'rgba(240,190,70,.85)'; ctx.fillRect(s[0] + dx, s[1] - 14, 14, 14); } }
  LondonArt.solids(ctx, { solids: L.solids, ledges: [], hides: [], floor: F });
  // the heavy curtains, and the beams she sleeps on
  for (const s of L.solids) if (s[4] === 'curtain') {
    g = ctx.createLinearGradient(s[0], 0, s[0] + s[2], 0); g.addColorStop(0, '#5a1420'); g.addColorStop(0.5, '#8a2030'); g.addColorStop(1, '#4a101a'); ctx.fillStyle = g; ctx.fillRect(s[0], s[1], s[2], s[3]);
    ctx.strokeStyle = 'rgba(30,6,10,.5)'; ctx.lineWidth = 2; for (let k = 8; k < s[2]; k += 12) { ctx.beginPath(); ctx.moveTo(s[0] + k, s[1]); ctx.lineTo(s[0] + k, s[1] + s[3]); ctx.stroke(); }
    ctx.fillStyle = '#d8a820'; ctx.fillRect(s[0], s[1] ? s[1] : s[1] + s[3] - 6, s[2], 6);
  }
  for (const l of L.ledges) { g = ctx.createLinearGradient(0, l[1], 0, l[1] + 22); g.addColorStop(0, '#6a5038'); g.addColorStop(1, '#3a2a1c'); ctx.fillStyle = g; ctx.fillRect(l[0] - 60, l[1], l[2] + 120, 22); ctx.strokeStyle = 'rgba(20,14,8,.5)'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(l[0] - 60, l[1] + 4 + k * 4); ctx.lineTo(l[0] + l[2] + 60, l[1] + 5 + k * 4); ctx.stroke(); } ctx.fillStyle = 'rgba(220,235,250,.55)'; ctx.fillRect(l[0] - 60, l[1], l[2] + 120, 2); }
};
Backgrounds.ldnDarts.noVignette = true;

Backgrounds.ldnWood = function (ctx, W, H) {
  const L = Game.g.level, F = L.floor, r = rng(71);
  // light through the leaves, going gold then dim towards evening at the far end
  let g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#b8d890'); g.addColorStop(0.5, '#d8d888'); g.addColorStop(0.8, '#d8a868'); g.addColorStop(1, '#8a6a70');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 600);
  // far trunks, then nearer ones: smooth grey hornbeams and rough brown oaks
  for (let i = 0; i < 46; i++) { const x = r() * W, w = 14 + r() * 16; ctx.fillStyle = 'rgba(90,110,80,.35)'; ctx.fillRect(x, 0, w, F); }
  LondonArt.leafBlob(ctx, -40, 380, W + 80, 130, ['rgba(90,130,70,.5)', 'rgba(110,150,80,.45)', 'rgba(80,120,66,.5)'], 72, 420);   // understorey
  for (let i = 0; i < 17; i++) {
    const x = 60 + i * 218 + r() * 90, oak = i % 3 === 0, w = oak ? 64 + r() * 26 : 34 + r() * 14;
    g = ctx.createLinearGradient(x, 0, x + w, 0);
    if (oak) { g.addColorStop(0, '#4a3828'); g.addColorStop(0.5, '#6a543c'); g.addColorStop(1, '#3a2c1e'); } else { g.addColorStop(0, '#6e7068'); g.addColorStop(0.5, '#8e9086'); g.addColorStop(1, '#5a5c56'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w + 10, F); ctx.lineTo(x - 10, F); ctx.fill();
    ctx.strokeStyle = oak ? 'rgba(24,16,8,.45)' : 'rgba(40,42,38,.3)'; ctx.lineWidth = oak ? 2 : 1.4; for (let k = 1; k < (oak ? 6 : 4); k++) { ctx.beginPath(); ctx.moveTo(x + k * w / (oak ? 6 : 4), 0); ctx.quadraticCurveTo(x + k * w / (oak ? 6 : 4) + 5, 300, x + k * w / (oak ? 6 : 4) - 2, F); ctx.stroke(); }
  }
  LondonArt.leafBlob(ctx, -40, -30, W + 80, 150, ['#4a8a3c', '#5a9a46', '#3a7a34', '#6aa850'], 73, 520);                              // the canopy
  // sunny patches: shafts of light, bright ground
  for (const [x0, x1] of L.sun) {
    g = ctx.createLinearGradient(0, 0, 0, F); g.addColorStop(0, 'rgba(255,246,190,.5)'); g.addColorStop(1, 'rgba(255,240,170,.16)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 + 120, 0); ctx.lineTo(x1 + 60, 0); ctx.lineTo(x1, F); ctx.lineTo(x0, F); ctx.fill();
  }
  // the ground: leaf litter
  ctx.fillStyle = '#6a4a2a'; ctx.fillRect(0, F - 4, W, 44);
  for (let i = 0; i < 900; i++) { const x = r() * W, y = F - 4 + r() * 40; ctx.fillStyle = ['#8a5a2a', '#a8703a', '#5a3a1e', '#b88a3a', '#7a4a1e'][i % 5]; ctx.beginPath(); ctx.ellipse(x, y, 5 + r() * 5, 2 + r() * 2, r() * 3, 0, TAU); ctx.fill(); }
  for (const [x0, x1] of L.sun) { ctx.fillStyle = 'rgba(255,240,160,.3)'; ctx.fillRect(x0, F - 4, x1 - x0, 44); }
  // where her log used to be: a damp, bare patch, and the log rolled away behind
  ctx.fillStyle = '#3a2a1c'; ctx.beginPath(); ctx.ellipse(110, F + 2, 120, 9, 0, 0, TAU); ctx.fill();
  g = ctx.createLinearGradient(0, 380, 0, 470); g.addColorStop(0, '#6a5038'); g.addColorStop(1, '#3a2a1c'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(20, 400, 300, 74, 36) : ctx.rect(20, 400, 300, 74); ctx.fill();
  ctx.fillStyle = '#9a7a52'; ctx.beginPath(); ctx.ellipse(318, 437, 12, 36, 0, 0, TAU); ctx.fill();
  // the wood's edge: the road beyond (a bus goes by: drawn with the level, behind the railings), the gate's name board
  ctx.fillStyle = '#c8c4b8'; ctx.fillRect(420, 470, 330, 90); ctx.fillStyle = '#8a8a88'; ctx.fillRect(420, 520, 330, 40); ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let x = 430; x < 740; x += 48) ctx.fillRect(x, 538, 24, 3);
  ctx.fillStyle = '#6a4a2a'; ctx.fillRect(560, 420, 8, 140); ctx.fillStyle = '#e8dcb8'; ctx.fillRect(516, 400, 104, 40); ctx.fillStyle = '#2f5a2a'; ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('HIGHGATE', 568, 417); ctx.fillText('WOOD', 568, 433);
  // the old drinking fountain: a pink granite obelisk over a bowl
  const fx = 2085;
  ctx.fillStyle = '#b89a9a'; ctx.fillRect(fx - 22, F - 10, 44, 10); ctx.fillRect(fx - 14, F - 34, 28, 24);
  ctx.fillStyle = '#c8a8a8'; ctx.beginPath(); ctx.ellipse(fx, F - 36, 22, 6, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(fx - 9, F - 40); ctx.lineTo(fx - 5, F - 104); ctx.lineTo(fx, F - 114); ctx.lineTo(fx + 5, F - 104); ctx.lineTo(fx + 9, F - 40); ctx.fill();
  ctx.fillStyle = 'rgba(90,60,60,.35)'; ctx.fillRect(fx + 2, F - 104, 4, 64); ctx.fillStyle = '#8a6a3a'; ctx.fillRect(fx - 5, F - 66, 10, 12);
  LondonStreet.squirrel(ctx, 2296, 500, 1.5, -1);                                          // a grey squirrel on the spider's stone
  // slopes: a fallen trunk to roll down, then a bank that kicks up at its end, and the puddle beyond it
  const bark = (pts) => { g = ctx.createLinearGradient(0, 420, 0, F); g.addColorStop(0, '#6a5038'); g.addColorStop(1, '#382818'); ctx.fillStyle = g; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.fill(); };
  const R = L.ramps;
  bark([[R[0][0], R[0][1]], [R[0][2], R[0][3]], [R[0][0], F]]);
  bark([[R[1][0], R[1][1]], [R[1][2], R[1][3]], [R[2][2], R[2][3]], [R[2][2], F], [R[1][0], F]]);
  ctx.strokeStyle = 'rgba(120,150,70,.7)'; ctx.lineWidth = 4; for (const q of R) { ctx.beginPath(); ctx.moveTo(q[0], q[1] + 1); ctx.lineTo(q[2], q[3] + 1); ctx.stroke(); }
  const [p0, p1] = L.puddle;
  ctx.fillStyle = '#4a6a8a'; ctx.beginPath(); ctx.ellipse((p0 + p1) / 2, F + 4, (p1 - p0) / 2, 9, 0, 0, TAU); ctx.fill(); ctx.fillRect(p0 + 8, F + 4, p1 - p0 - 16, 36);
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(p0 + 20, F + 1, 34, 2); ctx.fillRect(p0 + 62, F + 6, 24, 2);
  // the ants' nest by their trail
  const [a0, a1] = L.ants; ctx.fillStyle = '#5a3e24'; ctx.beginPath(); ctx.ellipse((a0 + a1) / 2, F - 2, 30, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.ellipse((a0 + a1) / 2, F - 8, 4, 2.4, 0, 0, TAU); ctx.fill();
  LondonArt.solids(ctx, { solids: L.solids, ledges: [], hides: [], floor: F });
  for (const s of L.solids) {
    if (s[4] === 'stone') {   // the spider's flat stone, propped on two small ones
      ctx.fillStyle = '#5a5a5e'; ctx.beginPath(); ctx.ellipse(s[0] + 14, F - 12, 16, 16, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#16120e'; ctx.fillRect(s[0] + s[2] - 30, s[1] + s[3], 30, F - s[1] - s[3]);
      g = ctx.createLinearGradient(0, s[1], 0, s[1] + s[3]); g.addColorStop(0, '#9a9a9e'); g.addColorStop(1, '#5a5a60'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(s[0] - 8, s[1], s[2] + 22, s[3], 12) : ctx.rect(s[0], s[1], s[2], s[3]); ctx.fill();
      ctx.fillStyle = 'rgba(120,150,70,.6)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(s[0] + 20 + k * 40, s[1] + 3, 12, 4, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(240,240,240,.5)'; ctx.beginPath(); ctx.ellipse(s[0] + s[2] - 14, F - 10, 12, 9, 0, 0, TAU); ctx.fill();      // its silk cell
    } else if (s[4] === 'biglog') {   // the big old log at the end, with the dark, damp gap under it
      ctx.fillStyle = '#120e0a'; ctx.fillRect(s[0] - 30, s[1] + s[3] - 4, s[2] + 30, F - s[1] - s[3] + 4);
      g = ctx.createLinearGradient(0, s[1] - 60, 0, s[1] + s[3]); g.addColorStop(0, '#7a5e42'); g.addColorStop(0.6, '#4e3a28'); g.addColorStop(1, '#2a1e12'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(s[0] - 60, s[1] - 60, s[2] + 120, s[3] + 60, 60) : ctx.rect(s[0], s[1], s[2], s[3]); ctx.fill();
      ctx.strokeStyle = 'rgba(20,14,8,.45)'; ctx.lineWidth = 2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(s[0] - 40, s[1] - 40 + k * 22); ctx.lineTo(s[0] + s[2] + 40, s[1] - 44 + k * 22); ctx.stroke(); }
      ctx.fillStyle = 'rgba(120,150,70,.65)'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.ellipse(s[0] - 30 + k * 26, s[1] - 56 + (k % 3) * 4, 16, 6, 0, 0, TAU); ctx.fill(); }
      for (const [dx, f] of [[26, 1], [56, -1], [96, 1], [118, -1]]) { ctx.save(); ctx.translate(s[0] + dx, F); ctx.scale(1.6 * f, 1.6); Sprites.pillLouse(ctx, { face: 1, angle: 0 }, dx); ctx.restore(); }   // the others, tucked in
    }
  }
  // ferns and fungi here and there
  for (const x of [640, 1560, 2000, 2470, 3180, 3500]) { ctx.strokeStyle = '#3f7a38'; ctx.lineWidth = 2; for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(x, F); ctx.quadraticCurveTo(x + k * 14, F - 44, x + k * 38, F - 56 + Math.abs(k) * 12); ctx.stroke(); } }
};
Backgrounds.ldnWood.noVignette = true;

Backgrounds.ldnStreet = function (ctx, W, H) {
  const L = Game.g.level, F = L.floor, R = L.road, r = rng(81);
  let g = ctx.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, '#0e1430'); g.addColorStop(0.7, '#24305a'); g.addColorStop(1, '#3a3a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 600);
  ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 90; i++) ctx.fillRect(r() * W, r() * 260, 1.6, 1.6);
  ctx.fillStyle = '#f0f0e0'; ctx.beginPath(); ctx.arc(700, 110, 34, 0, TAU); ctx.fill(); ctx.fillStyle = '#0e1430'; ctx.beginPath(); ctx.arc(686, 102, 30, 0, TAU); ctx.fill();   // a crescent moon
  // terraces behind, some windows lit
  LondonSky.roofs(ctx, 0, W, 330, '#161c36', 82);
  // the backs of a terrace behind the gardens, some windows still lit
  LondonStreet.terrace(ctx, -40, 1180, 446, { side: 'back', night: true, seed: 82, storeys: 2, sh: 64, w: 132 });
  LondonStreet.terrace(ctx, 3290, W + 60, 446, { side: 'back', night: true, seed: 83, storeys: 2, sh: 64, w: 132 });
  ctx.fillStyle = '#2a2a44'; ctx.fillRect(0, 446, W, 114);
  // garden fences along the back, except across the road
  const fence = (x0, x1) => { ctx.fillStyle = '#3a3040'; for (let x = x0; x < x1; x += 26) ctx.fillRect(x, 430, 22, 130); ctx.fillStyle = '#2a2234'; ctx.fillRect(x0, 452, x1 - x0, 7); };
  fence(0, 1726); fence(3290, W);
  // the alley runs under a railway viaduct: stock-brick arches, a train going over now and then (drawn with the level)
  ctx.fillStyle = '#5a4a36'; ctx.fillRect(1726, 372, 1014, 188); ctx.strokeStyle = 'rgba(20,14,8,.35)'; ctx.lineWidth = 1; for (let y = 372; y < 560; y += 11) { ctx.beginPath(); ctx.moveTo(1726, y); ctx.lineTo(2740, y); ctx.stroke(); }
  ctx.fillStyle = '#6a5a44'; ctx.fillRect(1726, 364, 1014, 10); ctx.fillStyle = '#3a3a44'; for (let x = 1730; x < 2740; x += 26) ctx.fillRect(x, 346, 3, 18); ctx.fillRect(1726, 344, 1014, 3);
  for (let x = 1760; x + 150 < 2740; x += 196) {
    ctx.fillStyle = '#7a6850'; ctx.beginPath(); ctx.moveTo(x - 8, 560); ctx.lineTo(x - 8, 470); ctx.arc(x + 75, 470, 83, Math.PI, 0); ctx.lineTo(x + 158, 560); ctx.fill();
    ctx.fillStyle = '#0e0e16'; ctx.beginPath(); ctx.moveTo(x, 560); ctx.lineTo(x, 470); ctx.arc(x + 75, 470, 75, Math.PI, 0); ctx.lineTo(x + 150, 560); ctx.fill();
    if ((x - 1760) % 392 === 0) { ctx.fillStyle = '#3a3e4a'; ctx.fillRect(x + 8, 452, 134, 108); ctx.strokeStyle = 'rgba(0,0,0,.4)'; for (let y = 460; y < 560; y += 9) { ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + 142, y); ctx.stroke(); } }   // a shutter
  }
  LondonStreet.streetSign(ctx, 2610, 420, 'FOXLEY ROAD', 'SW9');
  // lawns, paving, the verge
  const ground = (x0, x1, col, top) => { ctx.fillStyle = col; ctx.fillRect(x0, F - 4, x1 - x0, 44); if (top) { ctx.strokeStyle = top; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = x0; x < x1; x += 5) { ctx.moveTo(x, F - 2); ctx.lineTo(x + (r() - 0.5) * 4, F - 6 - r() * 8); } ctx.stroke(); } };
  ground(0, 900, '#2e5a34', '#3a6e3e'); ground(944, 1700, '#2e5a34', '#3a6e3e'); ground(1726, 2300, '#4a4a54'); ground(2300, 2760, '#2a5030', '#3a6e3e'); ground(3260, W, '#2e5a34', '#3a6e3e');
  ctx.fillStyle = '#56565e'; ctx.fillRect(1380, F - 4, 320, 44);                                              // the path to the back door
  // the house with the back door, its porch light and the doorstep
  ctx.fillStyle = '#54483a'; ctx.fillRect(1180, 180, 480, 380); ctx.fillStyle = '#1c2030'; ctx.beginPath(); ctx.moveTo(1160, 184); ctx.lineTo(1420, 90); ctx.lineTo(1680, 184); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1; for (let y = 190; y < 560; y += 11) { ctx.beginPath(); ctx.moveTo(1180, y); ctx.lineTo(1660, y); ctx.stroke(); }
  ctx.fillStyle = '#463a2e'; ctx.fillRect(1560, 60, 44, 70); ctx.fillStyle = '#6a3a26'; for (let k = 0; k < 5; k++) ctx.fillRect(1563 + k * 8, 46, 5, 14);   // its chimney and pots
  ctx.fillStyle = '#ffe9a8'; ctx.fillRect(1430, 262, 80, 70); ctx.fillStyle = '#4a3a44'; ctx.fillRect(1468, 262, 4, 70); ctx.fillRect(1430, 295, 80, 4);   // the window they shout from
  ctx.fillStyle = '#2f5a4a'; ctx.fillRect(1540, 400, 70, 160); ctx.fillStyle = '#d8c060'; ctx.beginPath(); ctx.arc(1598, 484, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a7a84'; ctx.fillRect(1500, F - 12, 150, 12);
  ctx.fillStyle = '#3a3a44'; ctx.fillRect(1296, 318, 8, 18); g = ctx.createRadialGradient(1300, 344, 4, 1300, 344, 170); g.addColorStop(0, 'rgba(255,236,170,.85)'); g.addColorStop(0.25, 'rgba(255,226,150,.3)'); g.addColorStop(1, 'rgba(255,226,150,0)'); ctx.fillStyle = g; ctx.fillRect(1130, 174, 340, 340); ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(1300, 344, 9, 0, TAU); ctx.fill();
  // a lamp post in the alley, and a street tree on the verge
  ctx.fillStyle = '#22222c'; ctx.fillRect(2106, 250, 8, 310); ctx.fillRect(2106, 250, 44, 6); g = ctx.createRadialGradient(2150, 262, 4, 2150, 262, 240); g.addColorStop(0, 'rgba(255,214,140,.8)'); g.addColorStop(0.2, 'rgba(255,204,120,.26)'); g.addColorStop(1, 'rgba(255,204,120,0)'); ctx.fillStyle = g; ctx.fillRect(1910, 22, 480, 540); ctx.fillStyle = '#fff0c8'; ctx.beginPath(); ctx.ellipse(2150, 260, 12, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2420'; ctx.fillRect(2396, 300, 16, 260); ctx.fillStyle = '#1e3a28'; for (const [dx, dy, s] of [[0, 0, 70], [-50, 30, 46], [52, 26, 50]]) { ctx.beginPath(); ctx.ellipse(2404 + dx, 250 + dy, s, s * 0.8, 0, 0, TAU); ctx.fill(); }
  // the road, running away between the houses, with its zebra crossing and two beacons
  const vp = { x: (R.x0 + R.x1) / 2, y: 392 };
  ctx.fillStyle = '#16182a'; ctx.fillRect(R.x0 - 20, 392, R.x1 - R.x0 + 40, 170);
  // at the end of the road, across the river: the Shard, lit
  LondonSky.line(ctx, [['walkie', vp.x - 78, 0.5], ['cheesegrater', vp.x - 54, 0.5], ['gherkin', vp.x - 34, 0.5], ['shard', vp.x + 6, 1.05]], 404, '#232a4c', '#ffdc8a');
  ctx.fillStyle = '#ffdc8a'; for (let i = 0; i < 26; i++) ctx.fillRect(vp.x + 6 - 8 + r() * 16, 280 + r() * 120, 1.4, 1.4); ctx.fillStyle = '#fff6d0'; ctx.fillRect(vp.x + 4, 256, 3, 10);
  ctx.fillStyle = '#2c2c36'; ctx.beginPath(); ctx.moveTo(R.x0, 600); ctx.lineTo(vp.x - 26, vp.y); ctx.lineTo(vp.x + 26, vp.y); ctx.lineTo(R.x1, 600); ctx.fill();
  ctx.strokeStyle = 'rgba(240,240,230,.6)'; ctx.lineWidth = 3; ctx.setLineDash([16, 16]); ctx.beginPath(); ctx.moveTo(vp.x, vp.y + 6); ctx.lineTo(vp.x, F - 30); ctx.stroke(); ctx.setLineDash([]);
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const y = 400 + k * 26, hh = 60 + k * 18, x = vp.x + s * (40 + k * 56); ctx.fillStyle = '#20223a'; ctx.fillRect(s > 0 ? x : x - 60 - k * 8, y - hh, 60 + k * 8, hh + 40); if (k % 2) { ctx.fillStyle = 'rgba(255,220,140,.6)'; ctx.fillRect((s > 0 ? x : x - 60 - k * 8) + 14, y - hh + 12, 12, 14); } }
  ctx.fillStyle = '#2c2c36'; ctx.fillRect(R.x0, F - 4, R.x1 - R.x0, 44);
  ctx.fillStyle = '#e8e8e0'; for (let x = R.x0 + 12; x < R.x1 - 20; x += 44) if (x + 24 < R.island[0] || x > R.island[1]) ctx.fillRect(x, F - 4, 24, 44);
  ctx.fillStyle = '#7a7a84'; ctx.fillRect(R.x0 - 8, F - 8, 8, 48); ctx.fillRect(R.x1, F - 8, 8, 48); ctx.fillRect(R.island[0], F - 8, R.island[1] - R.island[0], 48);
  ctx.fillStyle = '#e8e8e0'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(R.island[0] + 8, F - 56, 24, 48, 6) : ctx.rect(R.island[0] + 8, F - 56, 24, 48); ctx.fill(); ctx.fillStyle = '#2a5ab0'; ctx.beginPath(); ctx.arc(R.island[0] + 20, F - 36, 9, 0, TAU); ctx.fill();   // a keep-left bollard
  for (const bx of [R.x0 - 16, R.x1 + 16]) for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#f0f0e8' : '#1a1a1a'; ctx.fillRect(bx - 3, F - 142 + k * 20, 6, 20); }
  LondonStreet.pillarBox(ctx, R.x0 - 46, F, 1.5); LondonStreet.phoneBox(ctx, R.x1 + 52, F, 1.35, true);
  // the last garden: the shed the den is under
  for (const s of L.solids) if (s[4] === 'denshed') {
    ctx.fillStyle = '#0c0a0e'; ctx.fillRect(s[0] + 10, s[1] + s[3], s[2] - 20, F - s[1] - s[3]);                    // the dark under it
    ctx.fillStyle = '#6a4a40'; ctx.fillRect(s[0], s[1] + s[3], 16, F - s[1] - s[3]); ctx.fillRect(s[0] + s[2] - 16, s[1] + s[3], 16, F - s[1] - s[3]);   // brick piers
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(s[0], s[1], s[2], s[3]); ctx.strokeStyle = 'rgba(20,14,10,.5)'; ctx.lineWidth = 2; for (let k = 0; k < s[2]; k += 20) { ctx.beginPath(); ctx.moveTo(s[0] + k, s[1]); ctx.lineTo(s[0] + k, s[1] + s[3]); ctx.stroke(); }
    ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.moveTo(s[0] - 20, s[1] + 4); ctx.lineTo(s[0] + s[2] / 2, s[1] - 60); ctx.lineTo(s[0] + s[2] + 20, s[1] + 4); ctx.fill();
    ctx.fillStyle = '#1a1a20'; ctx.fillRect(s[0] + 40, s[1] + 30, 60, 100); ctx.fillStyle = 'rgba(150,180,220,.25)'; ctx.fillRect(s[0] + 140, s[1] + 34, 54, 40);
  } else if (s[4] === 'fence') {   // a tall fence with a gap at the bottom
    ctx.fillStyle = '#4a3a34'; for (let k = 0; k < 2; k++) ctx.fillRect(s[0] + k * 13, s[1], 12, s[3]); ctx.fillStyle = '#3a2c28'; ctx.fillRect(s[0] - 2, s[1] + 20, s[2] + 4, 6); ctx.fillRect(s[0] - 2, s[1] + s[3] - 30, s[2] + 4, 6);
  }
  LondonArt.solids(ctx, { solids: L.solids, ledges: [], hides: [], floor: F });
};
Backgrounds.ldnStreet.noVignette = true;
