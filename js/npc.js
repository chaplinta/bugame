'use strict';
// Other bugs living in a level: nestmates, flower visitors, a cloud of flies. They are scenery that moves. They
// never score, block or hurt, and no level's own logic sees them (they are kept in g.npcs, not in g.items).
// Each level's list is in NPCS below; where each animal lives, and who says so, is in docs/facts.md
// (Other bugs in each level).
//   how: 'walk'   wander on the ground round a place          { at, r, speed }
//        'trail'  walk up and down a line between two places  { from, to, speed }
//        'flit'   fly between places, settling on each        { points, speed, dwell }
//        'hover'  hang in the air round a place, with darts   { at, r }
//        'swarm'  a little cloud round a place                { at, r }
//        'leave'  fly off for good                            { at }
//   at / from / to / points may be functions of the game, for things that move. shy: how near you can come before
//   they scatter. side: a side-on level (they face left or right). air: drawn over the bug you play.
//   dot: a speck in this colour in place of a drawing. fact: a fact shown the first time you come near.

const Npc = {
  pt(v, g, i) { return typeof v === 'function' ? v(g, i) : v; },
  setup(g) {
    g.npcs = [];
    const list = typeof NPCS !== 'undefined' && NPCS[g.mission.id];
    if (!list) return;
    for (const d of list(g)) { if (d.sprite) d.sprite = npcKind(d.sprite); for (let i = 0; i < (d.n || 1); i++) g.npcs.push(this.one(g, d, i)); }
  },
  one(g, d, i) {
    const n = Object.assign({ d, i, x: 0, y: 0, angle: Math.random() * TAU, t: Math.random() * 10, wait: Math.random() * 2, flat: !!(d.air || d.side), moving: false, k: Math.random(), k2: Math.random(), away: 0 }, d.pose);
    if (!d.air && !d.side) n.r = d.r0 || 8;   // a ground bug gets the soft shadow the others have
    if (d.side) { n.angle = 0; n.face = Math.random() < 0.5 ? -1 : 1; }
    const at = this.pt(d.at, g, i) || { x: 0, y: 0 };
    if (d.how === 'walk') { const a = Math.random() * TAU, q = Math.sqrt(Math.random()) * (d.r || 100); n.x = at.x + Math.cos(a) * q; n.y = d.side ? at.y : at.y + Math.sin(a) * q; this.aim(g, n); }
    else if (d.how === 'trail') { n.u = (i + 0.5) / (d.n || 1); n.dir = i % 2 ? -1 : 1; }
    else if (d.how === 'flit') { n.pts = this.pt(d.points, g, i) || []; const p0 = n.pts[(Math.random() * n.pts.length) | 0] || at; n.x = p0.x + (Math.random() - 0.5) * 200; n.y = p0.y - 60 - Math.random() * 80; n.to = null; }
    else if (d.how === 'hover') { n.bx = at.x + (Math.random() - 0.5) * (d.r || 60) * 2; n.by = at.y + (Math.random() - 0.5) * (d.r || 60) * (d.side ? 0.8 : 2); n.x = n.bx; n.y = n.by; }
    else if (d.how === 'leave') { n.x = at.x + (Math.random() - 0.5) * 60; n.y = at.y + (Math.random() - 0.5) * 60; n.wait = 0.8 + i * 0.7; n.angle = -Math.PI / 2 + (i - ((d.n || 1) - 1) / 2) * 0.5; }
    return n;
  },
  // A walker's next place to go: somewhere round its home ground, or straight away from you
  aim(g, n, flee) {
    const d = n.d, at = this.pt(d.at, g, n.i), p = g.player;
    if (flee) { const a = Math.atan2(n.y - p.y, n.x - p.x); n.tx = n.x + Math.cos(a) * 130; n.ty = d.side ? n.y : n.y + Math.sin(a) * 130; }
    else { const a = Math.random() * TAU, q = Math.sqrt(Math.random()) * (d.r || 100); n.tx = at.x + Math.cos(a) * q; n.ty = d.side ? n.y : at.y + Math.sin(a) * q; }
    n.tx = clamp(n.tx, 20, World.w - 20); if (!d.side) n.ty = clamp(n.ty, 20, World.h - 20);
  },
  update(g, dt) {
    if (!g.npcs || !g.npcs.length) return;
    const p = g.player;
    for (const n of g.npcs) {
      if (n.gone) continue;
      const d = n.d, near = Math.hypot(n.x - p.x, n.y - p.y), shy = d.shy && near < d.shy;
      n.t += dt;
      if (d.fact && near < 140 && n.x) Game.fact(d.fact);
      if (d.how === 'walk') {
        if (shy && n.away <= 0) { n.away = 1; this.aim(g, n, true); n.wait = 0; }
        n.away = Math.max(0, n.away - dt);
        if (n.wait > 0) { n.wait -= dt; n.moving = false; continue; }
        const dx = n.tx - n.x, dy = n.ty - n.y, len = Math.hypot(dx, dy), sp = (d.speed || 30) * (n.away > 0 ? 2.6 : 1);
        if (len < 3) { n.wait = 0.4 + Math.random() * (d.rest === undefined ? 2.2 : d.rest); this.aim(g, n); continue; }
        n.x += dx / len * sp * dt; n.y += dy / len * sp * dt; n.moving = true;
        if (d.side) n.face = dx < 0 ? -1 : 1; else n.angle = Math.atan2(dy, dx);
      } else if (d.how === 'trail') {
        const a = this.pt(d.from, g, n.i), b = this.pt(d.to, g, n.i), len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        n.moving = !(n.wait > 0 || (d.shy && near < d.shy));   // they stop and wait for you to go by
        if (n.wait > 0) n.wait -= dt;
        else if (n.moving) { n.u += n.dir * (d.speed || 40) / len * dt; if (n.u >= 1 || n.u <= 0) { n.u = clamp(n.u, 0, 1); n.dir = -n.dir; n.wait = 0.5 + Math.random(); } }
        const side = Math.sin(n.u * 9 + n.i * 2) * 5 + (n.dir > 0 ? 4 : -4);   // out one side, back the other
        n.x = a.x + (b.x - a.x) * n.u - (b.y - a.y) / len * side; n.y = a.y + (b.y - a.y) * n.u + (b.x - a.x) / len * side;
        if (d.side) { n.face = (b.x - a.x) * n.dir < 0 ? -1 : 1; n.y = a.y + (b.y - a.y) * n.u; } else n.angle = Math.atan2((b.y - a.y) * n.dir, (b.x - a.x) * n.dir);
        n.carry = n.dir < 0;
      } else if (d.how === 'flit') {
        if (!n.to) {   // settled (or just arrived in the level): pick the next place
          if (n.wait > 0 && !(shy && n.landed)) { n.wait -= dt; continue; }
          const here = n.pts.filter(q => Math.hypot(q.x - n.x, q.y - n.y) < (d.range || 700) && Math.hypot(q.x - n.x, q.y - n.y) > 30 && (!shy || Math.hypot(q.x - p.x, q.y - p.y) > d.shy * 2));
          const q = (here.length ? here : n.pts)[(Math.random() * (here.length ? here : n.pts).length) | 0];
          if (!q) continue;
          n.to = { x: q.x + (Math.random() - 0.5) * 14, y: q.y + (d.dy || 0) }; n.landed = false;
        }
        const dx = n.to.x - n.x, dy = n.to.y - n.y, len = Math.hypot(dx, dy), sp = d.speed || 90;
        if (len < 4) { if (d.dwell === 0) n.to = null; else { n.x = n.to.x; n.y = n.to.y; n.to = null; n.landed = true; n.moving = false; n.wait = (d.dwell || 2) * (0.6 + Math.random()); } continue; }
        const wob = Math.sin(n.t * 7 + n.i) * Math.min(1, len / 60) * 0.5;   // a wavering line, straightening as it comes in
        n.x += (dx / len - dy / len * wob) * sp * dt; n.y += (dy / len + dx / len * wob) * sp * dt; n.moving = true;
        if (d.side) n.face = dx < 0 ? -1 : 1; else n.angle = Math.atan2(dy, dx);
      } else if (d.how === 'hover') {
        if ((n.wait -= dt) <= 0 || shy) {
          const at = this.pt(d.at, g, n.i);
          n.bx = at.x + (Math.random() - 0.5) * (d.r || 60) * 2; n.by = at.y + (Math.random() - 0.5) * (d.r || 60) * (d.side ? 0.8 : 2); n.wait = 1 + Math.random() * 2.5;
        }
        const dx = n.bx - n.x, dy = n.by - n.y, len = Math.hypot(dx, dy);
        if (len > 2) { const st = Math.min(len, (d.speed || 260) * dt); n.x += dx / len * st; n.y += dy / len * st; if (d.side) n.face = dx < 0 ? -1 : 1; else if (len > 6) n.angle = Math.atan2(dy, dx); }
        n.x += Math.sin(n.t * 23 + n.i) * 0.3; n.y += Math.cos(n.t * 19 + n.i) * 0.3; n.moving = true;
      } else if (d.how === 'swarm') {
        const at = this.pt(d.at, g, n.i);
        if (!at) { n.hide = true; continue; }
        n.hide = false;
        n.away += ((shy ? 1 : 0) - n.away) * Math.min(1, dt * 4);
        const r = (d.r || 30) * (0.35 + n.k * 0.65) * (1 + n.away * 1.6), ox = Math.cos(n.t * (1.6 + n.k2 * 2.2) + n.i * 2.4) * r, oy = Math.sin(n.t * (2.1 + n.k * 1.7) + n.i * 1.3) * r * (d.flat ? 0.45 : 0.8);
        n.angle = d.side ? 0 : Math.atan2(at.y + oy - n.y, at.x + ox - n.x); if (d.side) n.face = at.x + ox < n.x ? -1 : 1;
        n.x = at.x + ox; n.y = at.y + oy; n.moving = true;
      } else if (d.how === 'leave') {
        if ((n.wait -= dt) > 0) continue;
        n.x += Math.cos(n.angle) * (d.speed || 130) * dt; n.y += Math.sin(n.angle) * (d.speed || 130) * dt; n.moving = true;
        if (n.x < -80 || n.y < -80 || n.x > World.w + 80 || n.y > World.h + 80) n.gone = true;
      }
    }
  },
  // On the ground they are drawn under the bug you play; in the air, over it
  draw(ctx, g, air) {
    if (!g.npcs || !g.npcs.length) return;
    const z = Game.zoom || 1, x0 = g.cam.x - 60, x1 = g.cam.x + W / z + 60, y0 = g.cam.y - 60, y1 = g.cam.y + H / z + 60;
    if (!air) g.npcFresh = 1;   // new pictures made this frame: one at most, so a level full of them opens without a stutter
    for (const n of g.npcs) {
      const d = n.d;
      if (!!d.air !== air || n.gone || n.hide || n.x < x0 || n.x > x1 || n.y < y0 || n.y > y1) continue;
      if (!d.dot && typeof SpriteCache !== 'undefined' && !SpriteCache.ready(d.sprite, n, g.t, (Game.dpr || 1) * z * (d.scale || 1))) { if (g.npcFresh <= 0) continue; g.npcFresh--; }
      if (d.dot) { ctx.fillStyle = d.dot; ctx.beginPath(); ctx.arc(n.x, n.y, d.size || 1.6, 0, TAU); ctx.fill(); if (d.wing) { ctx.fillStyle = d.wing; ctx.beginPath(); ctx.ellipse(n.x, n.y - (d.size || 1.6), (d.size || 1.6) * 1.8, (d.size || 1.6) * (0.4 + Math.abs(Math.sin(n.t * 30 + n.i)) * 0.9), 0, 0, TAU); ctx.fill(); } }
      else Game.drawSprite(d.sprite, n, d.scale || 1);
    }
  },
};

// ------------------------------------------------------------------ the few new drawings (all small)
Object.assign(Sprites, {
  // European honey bee: amber and brown bands, a furry brown thorax. Seen from above, or from the side in London.
  honeyBee(ctx, o, t) {
    const beat = Math.sin(t * 60);
    if (o.face !== undefined) {
      sideOn(ctx, o, 5);
      if (!o.landed) for (const k of [0.25, -0.25]) insectWing(ctx, 0, -3, 9, 3, Math.PI + 0.9 + beat * 0.6 + k, 'bee');
      else insectWing(ctx, -1, -3, 9, 3, Math.PI - 0.25, 'bee');
      for (const x of [2, 0, -2]) plainLine(ctx, [x, 1, x + 0.6, 4.6], '#2a1c10', 0.6);
      ell(ctx, -4.6, 0, 4.4, 2.8, '#d89a2c', -0.1, 'chitin'); for (const x of [-6.6, -4.6, -2.8]) plainLine(ctx, [x, -2.4, x - 0.3, 2.4], '#3a2410', 1);
      ell(ctx, 0.6, -0.4, 2.8, 2.7, '#7a5a30', 0, 'fur'); ell(ctx, 3.8, 0, 1.9, 2, '#2a1c10', 0, 'chitin');
      ctx.restore(); return;
    }
    for (const s of [-1, 1]) insectWing(ctx, 0, s * 1.2, 9, 3.2, s * (o.landed ? 2.75 : 2.2 + beat * 0.5), 'bee');
    ell(ctx, -4.8, 0, 4.6, 3, '#d89a2c', 0, 'chitin'); for (const x of [-7, -5, -3]) plainLine(ctx, [x, -2.7, x, 2.7], '#3a2410', 1.1);
    ell(ctx, 0.6, 0, 2.9, 2.9, '#7a5a30', 0, 'fur'); ell(ctx, 3.9, 0, 1.8, 2.2, '#2a1c10', 0, 'chitin');
    plainLine(ctx, [5, -0.8, 7, -2], '#2a1c10', 0.4); plainLine(ctx, [5, 0.8, 7, 2], '#2a1c10', 0.4);
  },
  // A hover fly: a slim yellow and black body, big eyes, two clear wings held out
  hoverfly(ctx, o, t) {
    const beat = Math.sin(t * 90);
    if (o.face !== undefined) {
      sideOn(ctx, o, 4);
      insectWing(ctx, 0, -2, 8, 2.4, Math.PI + 0.7 + beat * 0.5, 'bee');
      ell(ctx, -3.6, 0, 4, 1.7, '#e8c020', -0.05, 'chitin'); for (const x of [-5.6, -3.8, -2]) plainLine(ctx, [x, -1.5, x, 1.5], '#1a1408', 0.9);
      ell(ctx, 0.8, -0.2, 2, 1.9, '#3a3018', 0, 'chitin'); plainEll(ctx, 3, -0.2, 1.5, 1.6, '#7a2a18');
      ctx.restore(); return;
    }
    for (const s of [-1, 1]) insectWing(ctx, 0.5, s * 1, 8, 2.6, s * (1.9 + beat * 0.35), 'bee');
    ell(ctx, -3.8, 0, 4.2, 2, '#e8c020', 0, 'chitin'); for (const x of [-6, -4, -2.2]) plainLine(ctx, [x, -1.8, x, 1.8], '#1a1408', 1);
    ell(ctx, 0.8, 0, 2, 2.1, '#3a3018', 0, 'chitin'); for (const s of [-1, 1]) plainEll(ctx, 3, s * 1, 1.3, 1.2, '#7a2a18');
  },
  // A termite soldier: the same pale body with a big amber head and dark jaws
  termiteSoldier(ctx, o, t) {
    legs6r(ctx, 0, 10, '#c8a874', 1.0, t, o.moving, { wide: 1.8, len: 0.7 });
    ell(ctx, -8, 0, 7, 4.6, '#f0e6cc', 0, 'none'); for (let k = 1; k < 5; k++) plainLine(ctx, [-14 + k * 2.6, -4.4, -14.2 + k * 2.6, 4.4], 'rgba(170,140,90,.5)', 0.5);
    ell(ctx, 0, 0, 3.4, 3.5, '#ead9b0', 0, 'none');
    ell(ctx, 7, 0, 6, 4.6, '#d08a2c', 0, 'chitin'); plainEll(ctx, 6, -1.6, 2.6, 1, 'rgba(255,230,170,.35)');
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(12, s * 1.6); ctx.quadraticCurveTo(17, s * 3.4, 18.4, s * 0.5); ctx.quadraticCurveTo(15.6, s * 1.4, 12.4, s * 0.4); ctx.closePath(); ctx.fillStyle = '#3a2210'; ctx.fill(); }
  },
  // A Portuguese millipede: a smooth dark body of many rings, a fringe of legs, flowing along
  millipede(ctx, o, t) {
    const N = 16, w = (k) => Math.sin(k * 0.55 - (o.moving ? t * 6 : 0)) * 1.6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let k = 0; k < N; k++) { const x = 13 - k * 1.8, y = w(k), l = 2.6 + Math.sin(k * 1.3 + (o.moving ? t * 14 : 0)) * 0.5; ctx.moveTo(x, y - l); ctx.lineTo(x, y + l); }
    ctx.stroke();
    for (let k = N - 1; k >= 0; k--) ell(ctx, 13 - k * 1.8, w(k), 1.5, 1.7 - (k > N - 3 ? 0.4 : 0), k % 2 ? '#2e2a2c' : '#3c3638', 0, 'chitin');
    plainLine(ctx, [14.2, -0.6, 16.6, -2], '#2e2a2c', 0.4); plainLine(ctx, [14.2, 0.6, 16.6, 2], '#2e2a2c', 0.4);
  },
  // A water boatman, rowing under water with its two long hind legs
  boatman(ctx, o, t) {
    const row = Math.sin(t * (o.moving ? 12 : 3)) * 0.7;
    for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * (1.5 + row)); plainLine(ctx, [0, 0, 9, 0], '#5a5030', 0.9); plainEll(ctx, 9.5, 0, 2.2, 0.8, '#6a6038'); ctx.restore(); }
    for (const s of [-1, 1]) plainLine(ctx, [2, s * 1.4, 5, s * 3.4], '#5a5030', 0.5);
    ell(ctx, 0, 0, 6, 3.2, '#6b6234', 0, 'chitin'); for (let k = -2; k < 3; k++) plainLine(ctx, [-4 + k * 1.2, -2.6, -4 + k * 1.2 + 0.4, 2.6], 'rgba(230,220,160,.45)', 0.5);
    ell(ctx, 5, 0, 2, 3, '#4a4426', 0, 'chitin'); for (const s of [-1, 1]) plainEll(ctx, 5.6, s * 1.9, 1, 1.1, '#7a2418');
  },
  // A garden butterfly from the side, for London's buddleia. kind: 'admiral' (red admiral) or 'peacock'
  gardenButterfly(ctx, o, t) {
    sideOn(ctx, o, 4);
    const open = o.landed ? 0.75 + Math.sin(t * 2.2 + (o.i || 0)) * 0.25 : Math.abs(Math.sin(t * 16 + (o.i || 0)));
    plainLine(ctx, [-4, 0, 4, 0], '#1c1612', 1.5); plainLine(ctx, [4, -0.4, 7, -3], '#1c1612', 0.4); plainLine(ctx, [4, -0.2, 7.6, -2], '#1c1612', 0.4);
    ctx.save(); ctx.scale(1, 0.25 + open * 0.75);
    const wing = (pts, fill) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
    if (o.kind === 'peacock') {
      wing([-1, -1, -9, -8, -7, -15, 1, -10], '#8a2c18'); wing([0, -1, 2, -17, 10, -15, 6, -3], '#a8361c');
      for (const [x, y, r] of [[7, -13, 2.6], [-6.4, -11, 2.2]]) { plainEll(ctx, x, y, r, r, '#e8d070'); plainEll(ctx, x, y, r * 0.72, r * 0.72, '#3a5ac8'); plainEll(ctx, x - 0.3, y + 0.3, r * 0.36, r * 0.36, '#14101c'); }
    } else {
      wing([-1, -1, -9, -8, -7, -14, 1, -10], '#1c1816'); wing([0, -1, 2, -17, 10, -15, 6, -3], '#1c1816');
      ctx.strokeStyle = '#e2482a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(1.6, -5); ctx.lineTo(7.6, -11); ctx.moveTo(-7.8, -12.6); ctx.lineTo(-2.4, -9.6); ctx.stroke();
      for (const [x, y] of [[5.6, -14.6], [8, -13.6], [4, -13]]) plainEll(ctx, x, y, 0.9, 0.8, '#f4f0e8');
    }
    ctx.restore(); ctx.restore();
  },
  // A seven-spot ladybird from the side
  ladybirdSide(ctx, o, t) {
    sideOn(ctx, o, 3);
    const walk = o.moving ? Math.sin(t * 14) : 0;
    for (const x of [2, 0, -2.4]) plainLine(ctx, [x, 1, x + walk * 0.8, 3.2], '#111', 0.6);
    ctx.beginPath(); ctx.ellipse(-0.6, 1, 4.6, 4.2, 0, Math.PI, 0); ctx.fillStyle = '#d83a1e'; ctx.fill();
    for (const [x, y] of [[-2.6, -0.4], [-0.4, -1.8], [1.6, -0.2]]) plainEll(ctx, x, y, 0.8, 0.8, '#111');
    plainEll(ctx, 4.2, 0.2, 1.6, 1.5, '#111'); plainEll(ctx, 4.4, -0.4, 0.5, 0.4, '#f4f4f4');
    ctx.restore();
  },
});

// The new drawings are kept as a few ready-made pictures each, like the game's other small animals
if (typeof SpriteCache !== 'undefined') {
  const face = (o) => (o.face === undefined ? '' : o.face < 0 ? 'l' : 'r');
  SpriteCache.registerAll(['honeyBee', 'hoverfly'], { key(o, t) { return face(o) + (o.landed ? 'L' : 'w' + SpriteCache.phase(t, 60, 2)); } });
  SpriteCache.registerAll(['termiteSoldier', 'millipede', 'boatman'], { key(o, t) { return o.moving ? 'm' + SpriteCache.phase(t, 12, 4) : 'x'; } });
  SpriteCache.register('gardenButterfly', { buckets: 1, key(o, t) { return o.kind + face(o) + (o.landed ? 'L' + SpriteCache.phase(t, 2.2, 4) : 'w' + SpriteCache.phase(t, 16, 3)); } });
  SpriteCache.register('ladybirdSide', { buckets: 1, key(o, t) { return face(o) + (o.moving ? 'm' + SpriteCache.phase(t, 14, 3) : 'x'); } });
}
// One of the bugs you can play, as an extra. The bug you play is drawn afresh every frame; a dozen more of it would
// cost too much that way, so the extras are the same drawing (and the same model) under another name, kept as a
// few ready-made pictures: standing, a few steps of a walk, a few beats of the wings.
function npcKind(name) {
  const alias = name + 'Npc';
  if (Sprites[alias] || typeof SpriteCache === 'undefined' || !SpriteCache.regs[name] || !SpriteCache.regs[name].live2d) return Sprites[alias] ? alias : name;
  Sprites[alias] = Sprites[name];
  SpriteCache.register(alias, { box: SpriteCache.regs[name].box, key(o, t) { return (o.face === undefined ? '' : o.face < 0 ? 'l' : 'r') + (o.landed ? 'L' : '') + (o.dance ? 'd' + SpriteCache.phase(t, 6, 4) : o.moving || o.flying ? 'm' + SpriteCache.phase(t, o.flying ? 40 : 12, 4) : 'x'); } });
  if (typeof Models !== 'undefined' && Models.defs[name]) Models.define(alias, Models.defs[name]);
  return alias;
}

// ------------------------------------------------------------------ who else lives where
const NPCS = (() => {
  const kinds = (g, list) => g.items.filter(i => list.includes(i.kind));
  const spots = (g, kind) => g.level.spots.filter(s => s.kind === kind && isFinite(s.x));
  const fixed = (seed, n, pad) => { const r = rng(seed); return Array.from({ length: n }, () => ({ x: pad + r() * (World.w - pad * 2), y: pad + r() * (World.h - pad * 2) })); };
  // a place a set way from home, toward the middle of the world
  const out = (g, far) => { const a = Math.atan2(World.h / 2 - g.home.y, World.w / 2 - g.home.x); return { x: g.home.x + Math.cos(a) * far, y: g.home.y + Math.sin(a) * far }; };
  const honeyBees = (g, n, list) => ({ sprite: 'honeyBee', n, how: 'flit', points: () => kinds(g, list), speed: 100, dwell: 2.4, scale: 2.2, shy: 70, air: true });
  const ladies = (g, n, scale) => ({ sprite: 'butterfly', n, how: 'flit', points: () => kinds(g, ['everlasting', 'grevillea']), speed: 120, dwell: 3, range: 900, scale, shy: 90, air: true });
  const damsels = (g) => ({ sprite: 'damselfly', n: 3, how: 'flit', points: fixed(61, 9, 120), speed: 130, dwell: 3, range: 900, scale: 1.3, shy: 100, air: true });
  return {
    // ---- Perth
    ant: (g) => [{ sprite: 'ant', n: 3, how: 'walk', at: g.home, r: 120, speed: 45, scale: 1.25 }],                      // nestmates round the nest mouth
    queen: (g) => [{ sprite: 'queenAnt', n: 5, how: 'leave', at: g.home, speed: 120, scale: 1.3, air: true, pose: { wings: true, flying: true } }],   // the other new queens of the flight
    bee: (g) => [honeyBees(g, 3, ['dianella', 'hibbertia', 'paw']), { sprite: 'hoverfly', n: 2, how: 'hover', at: (g2, i) => g.items[(i * 7 + 2) % g.items.length], r: 70, scale: 1.9, air: true }],
    fly: (g) => kinds(g, ['cow']).map(c => ({ sprite: 'bushFly', n: 5, how: 'swarm', at: () => ({ x: c.x + Math.cos(c.angle) * 36, y: c.y + Math.sin(c.angle) * 36 }), r: 26, scale: 0.8, shy: 55, air: true })),
    caterpillar: (g) => [ladies(g, 2, 1.5), honeyBees(g, 2, ['everlasting', 'capeweed', 'grevillea'])],
    butterfly: (g) => [ladies(g, 2, 1.7), honeyBees(g, 2, ['everlasting', 'capeweed', 'grevillea'])],
    termite: (g) => { const wood = out(g, 320); return [
      { sprite: 'termiteWorker', n: 6, how: 'trail', from: g.home, to: wood, speed: 42, scale: 1.7, shy: 34 },
      { sprite: 'termiteSoldier', n: 2, how: 'walk', at: g.home, r: 60, speed: 16, scale: 1.8, rest: 4, fact: 'soldier' }]; },
    snail: (g) => [{ sprite: 'snail', n: 2, how: 'walk', at: out(g, 420), r: 260, speed: 7, scale: 1.4, rest: 5 },
      { sprite: 'millipede', n: 2, how: 'walk', at: out(g, 300), r: 320, speed: 24, scale: 2.2, shy: 60, fact: 'millipede' }],
    spiderling: (g) => [{ sprite: 'spiderling', n: 4, how: 'walk', at: g.home, r: 180, speed: 55, scale: 1.3, shy: 70 }],       // brothers and sisters, spreading out
    spider: (g) => [{ sprite: 'spider', n: 1, how: 'walk', at: out(g, 520), r: 90, speed: 26, scale: 1.5, rest: 6, pose: { dance: true } }],   // a rival male, dancing far off
    nymph: (g) => [{ sprite: 'boatman', n: 4, how: 'hover', at: (g2, i) => fixed(47, 4, 200)[i], r: 130, speed: 170, scale: 1.8, shy: 80 }],
    dragonfly: (g) => [damsels(g)],
    skimmerF: (g) => [damsels(g)],
    sandhopper: (g) => kinds(g, ['wrack']).map(wr => ({ n: 4, how: 'swarm', at: () => (g.items.includes(wr) && wr.amount > 0.05 ? { x: wr.x, y: wr.y - 16 } : null), r: 22, dot: '#2e2a24', size: 1.4, shy: 50, air: true, fact: 'kelpfly' })),
    mosquito: (g) => [
      { sprite: 'moth', n: 5, how: 'swarm', at: { x: 1110, y: 76 }, r: 44, scale: 0.75, air: true },
      { n: 4, how: 'swarm', at: { x: 1230, y: 470 }, r: 30, dot: '#2a2420', size: 1.5, air: true, shy: 60 },
      { sprite: 'smallAnt', n: 7, how: 'trail', from: { x: 640, y: 1010 }, to: { x: 880, y: 870 }, speed: 32, scale: 0.8, shy: 26 }],
    nest: (g) => [{ sprite: 'sugarAnt', n: 3, how: 'trail', from: { x: g.home.x + 60, y: NEST.surf - 8 }, to: { x: g.plant.x - 20, y: NEST.surf - 8 }, speed: 46, scale: 1.1, side: true }],
    frog: (g) => [[700, 520], [1280, 760], [420, 760]].map(([x, y]) => ({ n: 16, how: 'swarm', at: { x, y }, r: 38, dot: 'rgba(240,236,200,.9)', size: 1.3, air: true, fact: 'midges' })),
    // ---- London (side-on)
    ldn_bee: (g) => [
      { sprite: 'honeyBee', n: 3, how: 'flit', points: () => spots(g, 'flower').concat(spots(g, 'rob')), speed: 90, dwell: 2.6, range: 900, dy: -8, scale: 1.5, shy: 80, side: true, air: true },
      { sprite: 'hoverfly', n: 2, how: 'hover', at: (g2, i) => ({ x: [1420, 2460][i], y: 360 }), r: 90, scale: 1.5, side: true, air: true },
      { sprite: 'ladybirdSide', n: 1, how: 'walk', at: { x: 700, y: g.level.floor }, r: 120, speed: 12, scale: 1.4, rest: 4, side: true }],
    ldn_wasp: (g) => [{ sprite: 'commonWasp', n: 3, how: 'swarm', at: () => spots(g, 'jam')[0] && { x: spots(g, 'jam')[0].x, y: spots(g, 'jam')[0].y - 26 }, r: 34, scale: 1.1, side: true, air: true, pose: { flying: true } },
      { sprite: 'hoverfly', n: 1, how: 'hover', at: { x: 2600, y: 380 }, r: 80, scale: 1.5, side: true, air: true }],
    ldn_mosquito: (g) => [{ n: 6, how: 'swarm', at: { x: 3840, y: 500 }, r: 34, dot: '#1c1a18', size: 1.3, air: true, shy: 40 }],
    ldn_moth: (g) => [
      { sprite: 'gardenButterfly', n: 1, how: 'flit', points: () => spots(g, 'flower'), speed: 80, dwell: 3.5, range: 1200, dy: -10, scale: 1.5, shy: 80, side: true, air: true, pose: { kind: 'admiral' } },
      { sprite: 'gardenButterfly', n: 1, how: 'flit', points: () => spots(g, 'flower'), speed: 80, dwell: 3.5, range: 1200, dy: -10, scale: 1.5, shy: 80, side: true, air: true, pose: { kind: 'peacock' }, fact: 'buddleia2' }],
    ldn_stag: (g) => [
      { sprite: 'stagBeetle', n: 2, how: 'flit', points: [{ x: 500, y: 190 }, { x: 1400, y: 150 }, { x: 2300, y: 210 }, { x: 3200, y: 170 }], speed: 70, dwell: 0, range: 1300, scale: 0.9, side: true, air: true, pose: { flying: true, flyT: 1 } },
      { n: 3, how: 'walk', at: { x: 2874, y: 553 }, r: 16, speed: 5, dot: '#22160e', size: 2, side: true, rest: 3, fact: 'dung' }],
    ldn_louse: (g) => [{ sprite: 'pillLouse', n: 2, how: 'walk', at: { x: 190, y: g.level.floor }, r: 90, speed: 14, scale: 2, rest: 5, shy: 46, side: true },
      { sprite: 'pillLouse', n: 2, how: 'walk', at: { x: 3560, y: g.level.floor }, r: 60, speed: 14, scale: 2, rest: 5, side: true }],
    ldn_fox: (g) => [150, 1660, 2860].map(x => ({ n: 5, how: 'swarm', at: { x, y: 396 }, r: 30, dot: '#d8c890', wing: 'rgba(240,230,190,.6)', size: 1.5, air: true })),
  };
})();

// Facts that go with them (each is listed with the level's own in the Bug Book)
const NPC_FACTS = {
  snail: { millipede: 'That dark millipede is a Portuguese millipede. It was first found in Western Australia in 1986, and now it is common all over the south-west.' },
  sandhopper: { kelpfly: 'Those little flies are kelp flies. Their maggots eat the rotting seaweed.' },
  frog: { midges: 'Those clouds over the water are midges. They rise from Perth’s lakes in spring and summer.' },
  ldn_moth: { buddleia2: 'Peacock and red admiral butterflies often gather on buddleia in summer.' },
  ldn_stag: { dung: 'Dung beetles live in the deer’s droppings in Richmond Park. One rare kind is hardly found anywhere but deer parks.' },
};
for (const [id, facts] of Object.entries(NPC_FACTS)) Object.assign(Missions[id].factText, facts);
