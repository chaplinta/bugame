'use strict';
// Golden orb-weaver: build your own web between the trees, any shape you like.
// Dry silk makes the frame and spokes; sticky silk catches insects. Cut threads, make a spiral,
// and run out to wrap whatever gets stuck. Big beetles can smash through threads.

// Branches you can tie silk to: polylines in world coordinates (the scene is one screen, side-on).
const WEB_ANCHORS = [
  [[150, 600], [158, 420], [150, 240], [162, 60], [170, 0]],          // left tree trunk
  [[905, 600], [896, 400], [910, 200], [900, 0]],                     // right tree trunk
  [[160, 92], [330, 70], [520, 82], [700, 64], [902, 84]],           // high branch across the top
  [[158, 330], [260, 300], [330, 318]],                               // branch off the left trunk
  [[898, 260], [800, 240], [740, 262]],                               // branch off the right trunk
  [[300, 600], [360, 520], [430, 470], [500, 500]],                   // shrub stems at the bottom
  [[700, 600], [650, 510], [600, 470]],
];
const SILK_MAX = 150;

function nearestOnSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
  return { x: ax + dx * t, y: ay + dy * t, d: Math.hypot(px - ax - dx * t, py - ay - dy * t) };
}
function segsCross(a, b, c, d) {
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (!den) return null;
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t } : null;
}

Object.assign(Sprites, {
  moth(ctx, o, t) {
    const f = o.stuck ? 0.2 : Math.sin(t * 20) * 0.3;
    for (const s of [-1, 1]) { ctx.save(); ctx.scale(1, s); ctx.rotate(f); ell(ctx, -2, 7, 10, 7, '#b8a07a'); ell(ctx, -6, 9, 4, 3, '#8a7050'); ctx.restore(); }
    ell(ctx, 0, 0, 8, 3, '#7a6448'); line(ctx, [6, -1, 12, -6], '#5a4a30', 0.8); line(ctx, [6, 1, 12, 6], '#5a4a30', 0.8);
  },
  beetle(ctx, o, t) {   // Christmas beetle: shiny golden-brown, heavy flier
    const f = o.stuck ? 0 : Math.sin(t * 40) * 0.4;
    for (const s of [-1, 1]) veinWing(ctx, 2, s * 3, 14, 4, s * (2.3 - f), 'rgba(220,210,190,.5)', 2);
    ell(ctx, -2, 0, 11, 8, '#c8902a'); plainLine(ctx, [-12, 0, 6, 0], 'rgba(90,50,10,.6)', 1);
    ell(ctx, 9, 0, 4.6, 5, '#a87020'); eye(ctx, 11, -2.6, 1.3, 1.3, '#2a1a0a'); eye(ctx, 11, 2.6, 1.3, 1.3, '#2a1a0a');
  },
  wrapped(ctx) {
    ell(ctx, 0, 0, 9, 6, '#f4f2ea');
    ctx.strokeStyle = 'rgba(180,170,150,.8)'; ctx.lineWidth = 0.7;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 3 - 3, -6); ctx.lineTo(k * 3 + 3, 6); ctx.stroke(); }
  },
});

Bugs.push({ id: 'orbweaver', name: 'Golden Orb-weaver', sci: 'Trichonephila edulis', place: 'Wireless Hill', sprite: 'orbSpider',
  pin: { x: 560, y: 452 }, stages: ['web'] });

Missions.web = {
  id: 'web', bug: 'orbweaver', stage: 'Adult female', place: 'Wireless Hill bushland', view: 'build',
  sprite: 'orbSpider', bg: 'webBush', pointerOnly: true,
  action: '', radius: 14, speed: 0, scale: 2, goal: 8,
  home: { x: 520, y: 300, r: 1, label: '' },
  facts: [
    'Golden orb-weavers spin huge webs of golden silk. They live all over Australia, including Perth.',
    'An orb web has a frame, spokes like a wheel, and a sticky spiral to catch insects.',
    'The females are big. The males are tiny and live on the edge of her web.',
  ],
  how: [
    'Pick a silk on the left. Drag from a branch (or another thread) to another branch or thread to spin a line.',
    'Dry silk is strong but not sticky. Sticky silk catches insects.',
    'Spiral: make some spokes from one middle point, then tap that point to spin a sticky spiral.',
    'Tap a stuck insect to run over and wrap it. Wrap 8! Cut threads with the scissors.',
  ],
  discoveries: [],
  tools: [
    { name: 'Silk', items: [
      { id: 'dry', label: 'Dry silk', color: '#f4eed8', speck: '#c8b880' },
      { id: 'sticky', label: 'Sticky silk', color: '#e8c040', speck: '#fff6c0' },
      { id: 'spiral', label: 'Spiral', sprite: 'spiralIcon', iconScale: 1 },
    ] },
    { name: 'Tools', items: [
      { id: 'cut', label: 'Cut', sprite: 'cutIcon', iconScale: 1 },
      { id: 'clearWeb', label: 'Start again', now: true },
    ] },
  ],
  factText: {
    start: 'Orb-weavers make a new sticky spiral often, because dust and wind make old silk less sticky.',
    first: 'Spiders make silk inside their bodies and pull it out of spinnerets at the tip of the abdomen.',
    sticky: 'The sticky spiral is dotted with tiny glue droplets. Insects that touch it are stuck.',
    dry: 'The frame and spokes are dry silk. The spider walks on these so she doesn’t get stuck.',
    spiral: 'An orb weaver lays the sticky spiral round and round, from the outside in.',
    wrap: 'She wraps her prey in silk, then bites it. The silk keeps it from escaping.',
    golden: 'Golden orb-weaver silk really is golden-yellow. It is one of the strongest natural materials.',
    beetle: 'Big beetles can crash through a web. The spider just repairs it.',
    escape: 'Some insects struggle free if the spider is too slow.',
    male: 'Look! A tiny male has moved onto the edge of your web. He is a lot smaller than her.',
    klepto: 'Little silver dewdrop spiders sometimes live in golden orb webs and steal small insects.',
    silk: 'Making silk takes energy. Eating insects gives the spider more silk.',
    win: 'What a web! Golden orb-weavers can keep the same web for weeks, mending it every day.',
  },

  setup(g) {
    g.netDone = true;
    g.threads = []; g.prey = []; g.drawing = null; g.silk = SILK_MAX; g.spawnT = 3; g.wrapping = null; g.path = [];
    const p = g.player; p.x = 520; p.y = 300; p.angle = Math.PI / 2; p.flat = true;
    // Start with one dry bridge line across the top, like a real spider's first thread
    this.addThread(g, { x: 330, y: 70 }, { x: 700, y: 64 }, 'dry', true);
    p.x = 515; p.y = 68;
    Game.later(1.5, () => Game.hint('Drag from a branch to another branch to spin silk. Make a frame, then spokes!'));
  },
  addThread(g, a, b, type, free) {
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const cost = free ? 0 : len / (type === 'sticky' ? 120 : 60);
    if (g.silk < cost) { Game.hint('You’re out of silk. Catch and wrap insects to make more.'); Game.fact('silk'); return false; }
    g.silk -= cost;
    g.threads.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y }, type, t: g.t });
    if (!free) {
      Sound.play('tap');
      Game.fact(g.threads.length < 3 ? 'first' : type === 'sticky' ? 'sticky' : 'dry');
      // The spider runs to the start and spins along it
      g.path.push({ x: a.x, y: a.y }, { x: b.x, y: b.y });
    }
    if (g.threads.length >= 15 && !g.male) { g.male = { x: b.x, y: b.y }; Game.fact('male'); }
    if (g.threads.length >= 8) Game.fact('golden');
    return true;
  },
  // Snap to the nearest branch or thread
  snap(g, x, y, maxD) {
    let best = null;
    const tryPt = (q) => { if (q.d < (best ? best.d : (maxD || 24))) best = q; };
    for (const line of WEB_ANCHORS) for (let i = 1; i < line.length; i++) tryPt(nearestOnSeg(x, y, line[i - 1][0], line[i - 1][1], line[i][0], line[i][1]));
    for (const th of g.threads) tryPt(nearestOnSeg(x, y, th.a.x, th.a.y, th.b.x, th.b.y));
    return best;
  },
  onTool(g, id, btn) {
    if (id !== 'clearWeb') return;
    if (!g.clearArmed) { g.clearArmed = true; btn.querySelector('span').textContent = 'Tap again'; setTimeout(() => { g.clearArmed = false; btn.querySelector('span').textContent = 'Start again'; }, 2500); return; }
    g.threads = []; g.prey = g.prey.filter(q => !q.stuck); g.silk = SILK_MAX; g.clearArmed = false;
    btn.querySelector('span').textContent = 'Start again';
    Game.hint('A fresh start. Spin a bridge line between the branches first.');
  },
  onPointer(g, type, x, y) {
    if (type === 'down') {
      // Tap a stuck insect to wrap it
      const q = nearest(g.prey.filter(q => q.stuck && !q.wrapped), { x, y }, 30);
      if (q) { this.goWrap(g, q); return; }
    }
    this.use(g, g.tool, x, y, type);
  },
  use(g, tool, x, y, type) {
    if (tool === 'cut') {
      if (type === 'up') return;
      let hit = null, bd = 14;
      for (const th of g.threads) { const n = nearestOnSeg(x, y, th.a.x, th.a.y, th.b.x, th.b.y); if (n.d < bd) { bd = n.d; hit = th; } }
      if (hit) { g.threads.splice(g.threads.indexOf(hit), 1); Game.burst(x, y, '#fff6c0', 8); Sound.play('tap'); this.dropLoose(g); }
      return;
    }
    if (tool === 'spiral') { if (type === 'down') this.spiral(g, x, y); return; }
    if (type === 'down') {
      const s = this.snap(g, x, y);
      if (!s) { Game.hint('Start your silk on a branch or on another thread.'); g.drawing = null; return; }
      g.drawing = { a: s, b: { x, y }, type: tool };
    } else if (type === 'move' && g.drawing) {
      g.drawing.b = { x, y };
      g.drawing.ok = !!this.snap(g, x, y);
    } else if (type === 'up' && g.drawing) {
      const d = g.drawing; g.drawing = null;
      const e = this.snap(g, x, y);
      if (!e) { Game.hint('Silk has to end on a branch or another thread.'); return; }
      if (Math.hypot(e.x - d.a.x, e.y - d.a.y) < 18) return;
      this.addThread(g, d.a, e, d.type);
    }
  },
  // Threads whose ends are no longer attached to anything fall away
  dropLoose(g) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const th of g.threads.slice()) {
        const held = (pt) => {
          for (const line of WEB_ANCHORS) for (let i = 1; i < line.length; i++) if (nearestOnSeg(pt.x, pt.y, line[i - 1][0], line[i - 1][1], line[i][0], line[i][1]).d < 3) return true;
          return g.threads.some(o => o !== th && nearestOnSeg(pt.x, pt.y, o.a.x, o.a.y, o.b.x, o.b.y).d < 3);
        };
        if (!held(th.a) || !held(th.b)) { g.threads.splice(g.threads.indexOf(th), 1); changed = true; }
      }
    }
    for (const q of g.prey) if (q.stuck && !g.threads.includes(q.stuck)) { q.stuck = null; q.vy = 60; }
  },
  // Spin a sticky spiral around a hub: needs spokes (threads with one end near the hub)
  spiral(g, x, y) {
    const spokes = [];
    for (const th of g.threads) {
      const da = Math.hypot(th.a.x - x, th.a.y - y), db = Math.hypot(th.b.x - x, th.b.y - y);
      if (Math.min(da, db) < 30 && Math.max(da, db) > 80) {
        const hub = da < db ? th.a : th.b, far = da < db ? th.b : th.a;
        spokes.push({ hub, far, ang: Math.atan2(far.y - hub.y, far.x - hub.x), len: Math.max(da, db) });
      }
    }
    if (spokes.length < 3) { Game.hint('First spin at least 3 spokes from one middle point, then tap that point.'); return; }
    spokes.sort((p, q) => p.ang - q.ang);
    const maxR = Math.min(...spokes.map(s => s.len)) - 10;
    let made = 0;
    for (let r = maxR; r > 26; r -= 20) {
      for (let i = 0; i < spokes.length; i++) {
        const s1 = spokes[i], s2 = spokes[(i + 1) % spokes.length];
        let gap = s2.ang - s1.ang; if (gap <= 0) gap += TAU;
        if (gap > Math.PI * 0.9) continue;   // don't bridge big empty gaps
        const p1 = { x: x + Math.cos(s1.ang) * r, y: y + Math.sin(s1.ang) * r }, p2 = { x: x + Math.cos(s2.ang) * r, y: y + Math.sin(s2.ang) * r };
        if (!this.addThread(g, p1, p2, 'sticky')) return;
        made++;
      }
    }
    if (made) { Game.fact('spiral'); Sound.play('score'); Game.pop(x, y - 20, 'Spiral!', '#ffd23f'); }
  },
  goWrap(g, q) {
    g.path = [{ x: q.x, y: q.y }];
    g.wrapping = q;
  },
  locked() { return true; },
  move() {},
  update(g, dt) {
    const p = g.player;
    g.silk = Math.min(SILK_MAX, g.silk + dt * 1.5);
    // Spider follows its path: along new threads, or out to prey
    if (g.path.length) {
      const tgt = g.path[0], d = Math.hypot(tgt.x - p.x, tgt.y - p.y), sp = 320 * dt;
      p.angle = Math.atan2(tgt.y - p.y, tgt.x - p.x); p.moving = true;
      if (d <= sp) { p.x = tgt.x; p.y = tgt.y; g.path.shift(); } else { p.x += (tgt.x - p.x) / d * sp; p.y += (tgt.y - p.y) / d * sp; }
    } else {
      p.moving = false;
      p.angle += (Math.PI / 2 - p.angle) * Math.min(1, dt * 3);   // rest head-down, like real orb-weavers
    }
    // Wrap prey once the spider gets there
    const w = g.wrapping;
    if (w && !g.path.length) {
      w.wrapT = (w.wrapT || 0) + dt;
      p.progress = w.wrapT / 1.2;
      if (w.wrapT >= 1.2) {
        w.wrapped = true; g.wrapping = null; g.score++; g.silk = Math.min(SILK_MAX, g.silk + 30);
        Sound.play('score'); Game.pop(w.x, w.y - 20, 'Wrapped!', '#ffd23f'); Game.fact('wrap');
        if (g.score === 4) Game.fact('klepto');
      }
    }
    // Insects fly through
    g.spawnT -= dt;
    if (g.spawnT <= 0 && g.prey.filter(q => !q.stuck).length < 4) {
      g.spawnT = 2.5 + Math.random() * 2.5;
      const kinds = ['fly', 'fly', 'moth', 'mosquito', 'moth', 'beetle'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const left = Math.random() < 0.5;
      g.prey.push({ sprite: kind, x: left ? 110 : W + 20, y: 120 + Math.random() * 380, vx: (left ? 1 : -1) * (kind === 'beetle' ? 150 : 90 + Math.random() * 50),
        vy: 0, ph: Math.random() * 6, r: 8, scale: kind === 'beetle' ? 1.4 : 1.7, angle: left ? 0 : Math.PI, flat: true, heavy: kind === 'beetle' });
    }
    for (const q of g.prey) {
      if (q.wrapped) continue;
      if (q.stuck) {
        q.struggle = (q.struggle || 0) + dt;
        q.angle = (q.vx > 0 ? 0 : Math.PI) + Math.sin(g.t * 30) * 0.3;
        if (q.struggle > 14 && g.wrapping !== q) { q.stuck = null; q.vy = -40; Game.hint('It got away! Tap stuck insects quickly.'); Game.fact('escape'); }
        continue;
      }
      const from = { x: q.x, y: q.y };
      q.ph += dt * 3;
      q.x += q.vx * dt; q.y += (q.vy + Math.sin(q.ph) * 50) * dt;
      q.vy *= 0.98;
      for (const th of g.threads.slice()) {
        const hit = segsCross(from, q, th.a, th.b);
        if (!hit) continue;
        if (q.heavy) {
          // Beetles smash straight through
          g.threads.splice(g.threads.indexOf(th), 1); Game.burst(hit.x, hit.y, '#fff6c0', 10); Game.fact('beetle'); Sound.play('tap');
          q.vx *= 0.8; q.hits = (q.hits || 0) + 1;
          if (q.hits >= 3 && th.type === 'sticky') { q.stuck = th; q.x = hit.x; q.y = hit.y; }
          this.dropLoose(g);
          break;
        }
        if (th.type === 'sticky') { q.stuck = th; q.x = hit.x; q.y = hit.y; Sound.play('pick'); break; }
        q.vy = (q.y > hit.y ? 1 : -1) * 80; q.x = from.x; q.y = from.y;   // dry silk: bounce off
        break;
      }
      if (q.x < 60 || q.x > W + 40 || q.y < -40 || q.y > H + 40) q.gone = true;
    }
    g.prey = g.prey.filter(q => !q.gone);
    if (g.prey.some(q => q.stuck && !q.wrapped && !q.told)) {
      const q = g.prey.find(q => q.stuck && !q.told); q.told = true;
      if (g.score < 2) Game.hint('Something’s stuck! Tap it to run over and wrap it.');
    }
  },
  drawBuild(ctx, g) {
    // Threads: dry silk is fine and pale; sticky silk is golden with glue beads
    for (const th of g.threads) {
      const sway = Math.sin(g.t * 1.3 + th.a.x * 0.01) * 0.6;
      plainLine(ctx, [th.a.x, th.a.y + sway, th.b.x, th.b.y + sway], th.type === 'sticky' ? 'rgba(232,192,64,.95)' : 'rgba(250,245,225,.85)', th.type === 'sticky' ? 1.6 : 1.2);
      if (th.type === 'sticky') {
        const len = Math.hypot(th.b.x - th.a.x, th.b.y - th.a.y), n = Math.floor(len / 7);
        ctx.fillStyle = 'rgba(255,250,210,.9)';
        for (let i = 1; i < n; i++) { const k = i / n; ctx.beginPath(); ctx.arc(th.a.x + (th.b.x - th.a.x) * k, th.a.y + (th.b.y - th.a.y) * k + sway, 1.2, 0, TAU); ctx.fill(); }
      }
    }
    const d = g.drawing;
    if (d) {
      ctx.setLineDash([6, 5]);
      plainLine(ctx, [d.a.x, d.a.y, d.b.x, d.b.y], d.ok ? (d.type === 'sticky' ? '#e8c040' : '#fff') : 'rgba(220,80,60,.9)', 2);
      ctx.setLineDash([]);
      ell(ctx, d.a.x, d.a.y, 4, 4, '#ffd23f');
    }
    if (g.male) Game.drawSprite('orbSpider', { x: g.male.x, y: g.male.y, angle: Math.PI / 2, flat: true }, 0.6);
  },
  drawExtra(ctx, g) {
    for (const q of g.prey) Game.drawSprite(q.wrapped ? 'wrapped' : q.sprite, Object.assign({}, q, { stuck: !!q.stuck }), q.wrapped ? 1.3 : q.scale);
    // Silk meter
    const k = g.silk / SILK_MAX;
    ctx.fillStyle = 'rgba(255,250,240,.8)'; ctx.fillRect(W - 40, 140, 16, 200);
    ctx.fillStyle = '#e8c040'; ctx.fillRect(W - 40, 140 + 200 * (1 - k), 16, 200 * k);
    ctx.fillStyle = '#2b2118'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Silk', W - 32, 132);
  },
  goalPoint() { return null; },
  hud(g) { setHud('Wrapped: ' + g.score + ' / ' + this.goal, g.threads.length + ' threads'); },
  won(g) { return g.score >= this.goal; },
};

Object.assign(Sprites, {
  spiralIcon(ctx) {
    ctx.beginPath();
    for (let a = 0; a < TAU * 3; a += 0.2) { const r = 2 + a * 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = '#c89a20'; ctx.lineWidth = 1.6; ctx.stroke();
  },
  cutIcon(ctx) {
    for (const s of [-1, 1]) { plainLine(ctx, [-9, s * 7, 9, -s * 4], '#555', 2.4); ctx.beginPath(); ctx.arc(-10, s * 7, 3.6, 0, TAU); ctx.strokeStyle = '#c8302a'; ctx.lineWidth = 2; ctx.stroke(); }
  },
});

// Bushland at Wireless Hill: two trees with a branch between them, and a shrub below.
Backgrounds.webBush = function (ctx, W, H) {
  const r = rng(61);
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#b8dcef'); g.addColorStop(0.7, '#e6eedb'); g.addColorStop(1, '#c8c8a0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Perth city across the Swan River, seen from Wireless Hill
  ctx.fillStyle = 'rgba(120,170,200,.55)'; ctx.fillRect(0, 392, W, 26);
  drawPerthSkyline(ctx, 380, 396, 360, 0.75, 0.35);
  // Distant bush
  for (let i = 0; i < 40; i++) { const x = r() * W, y = 380 + r() * 120; softBlob(ctx, x, y, 30 + r() * 40, 'rgba(110,140,90,' + (0.25 + r() * 0.2) + ')'); }
  ctx.fillStyle = 'rgba(160,150,110,.5)'; ctx.fillRect(0, 540, W, 60);
  // Branches and trunks, drawn along the same lines the silk can attach to
  WEB_ANCHORS.forEach((line, i) => {
    const w = i < 2 ? 46 : i === 2 ? 16 : i < 5 ? 10 : 7;
    ctx.beginPath(); line.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = i < 5 ? '#6a4a30' : '#5a4a2a'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,190,.25)'; ctx.lineWidth = w * 0.3; ctx.stroke();
    if (i < 2) for (let k = 0; k < 30; k++) { const y = r() * H; const x = line[0][0] + (r() - 0.5) * 30; plainLine(ctx, [x, y, x + (r() - 0.5) * 4, y + 12 + r() * 20], 'rgba(40,25,15,.35)', 1.5); }
  });
  // Leaves on the high branch and the shrubs
  for (let i = 0; i < 70; i++) {
    const line = WEB_ANCHORS[r() < 0.5 ? 2 : 5 + Math.floor(r() * 2)];
    const k = Math.floor(r() * (line.length - 1)), f = r();
    const x = line[k][0] + (line[k + 1][0] - line[k][0]) * f, y = line[k][1] + (line[k + 1][1] - line[k][1]) * f;
    ell(ctx, x + (r() - 0.5) * 30, y + (r() - 0.5) * 24, 9, 4, r() < 0.5 ? '#5a8a44' : '#6a9a50', r() * 3);
  }
  storybookFinish(ctx, W, H, 9);
};

finishMissions();
Missions.web.factText.tank = '';
