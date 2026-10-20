'use strict';
// 3D models of the other animals: predators, birds, reptiles, mammals, garden visitors and small bugs.
// Same frame and kit as js/models-bugs.js; same sizes as the 2D drawings in js/art-world.js and js/art-world2.js.

// ---------------------------------------------------------------- birds
// A wing outline along +x from the shoulder, as 2D points (side +1): a curved leading edge, a rounded tip,
// and a trailing edge scalloped by the rounded tips of the primaries.
function wingPts(len, wid, n) {
  const pts = [[0, 0]], N = n || 7;
  const q = (p0, c, p1, k, f) => { for (let i = 1; i <= k; i++) { const t = i / k, u = 1 - t, x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]; pts.push(f ? f(x, y, t) : [x, y]); } };
  q([0, 0], [len * 0.35, -wid * 1.0], [len, -wid * 0.3], 12);
  q([len, -wid * 0.3], [len * 0.55, wid * 0.6], [0, wid * 0.45], 8 * N, (x, y, t) => { const k = t < 0.75 ? Math.abs(Math.cos(t / 0.75 * N * Math.PI)) : 1; return [x, y - (1 - k) * wid * 0.09]; });
  return pts;
}
// The wing's feathers painted in wing coordinates (side +1): a colour gradient, an optional soft panel,
// primaries and secondaries fanning from the wrist to the trailing edge, rows of coverts, darker edges.
function featherMap(M, key, len, wid, n, col, dark, panel) {
  const N = n || 7;
  return patternTexture(M, 'fm|' + key, wingPts(len, wid, N), (ctx) => {
    const gr = ctx.createLinearGradient(0, -wid, len, wid * 0.4); gr.addColorStop(0, tint(col, 0.12)); gr.addColorStop(1, tint(col, -0.18));
    ctx.fillStyle = gr; ctx.fillRect(-1, -wid * 1.1, len + 2, wid * 1.7);
    if (panel) { ctx.fillStyle = panel; ctx.beginPath(); ctx.ellipse(len * 0.42, wid * 0.02, len * 0.26, wid * 0.26, 0.12, 0, TAU); ctx.fill(); }
    ctx.lineCap = 'round'; ctx.strokeStyle = dark;
    for (let i = 0; i <= N + 3; i++) {
      const t = (i + 0.5) / (N + 4), u = 1 - t, tx = u * u * len + 2 * u * t * len * 0.55, ty = u * u * (-wid * 0.3) + 2 * u * t * wid * 0.6 + t * t * wid * 0.45;
      const wx = len * 0.45 - t * len * 0.3, wy = -wid * 0.3 + t * wid * 0.05;
      ctx.globalAlpha = 0.18; ctx.lineWidth = wid * 0.12; ctx.beginPath(); ctx.moveTo(wx + len * 0.03, wy); ctx.lineTo(tx + len * 0.015, ty - wid * 0.03); ctx.stroke();
      ctx.globalAlpha = 0.4; ctx.lineWidth = wid * 0.03; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(tx, ty); ctx.stroke();
    }
    ctx.globalAlpha = 0.25; ctx.lineWidth = wid * 0.02;
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const x = len * (0.08 + i * 0.07 + r * 0.03), y = -wid * (0.55 - r * 0.22); ctx.beginPath(); ctx.arc(x, y, wid * 0.08, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.globalAlpha = 0.55; ctx.lineWidth = wid * 0.05; ctx.beginPath(); ctx.moveTo(len, -wid * 0.3); ctx.quadraticCurveTo(len * 0.55, wid * 0.6, 0, wid * 0.45); ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.35, -wid, len, -wid * 0.3); ctx.stroke();
    ctx.globalAlpha = 1;
  });
}
// The body's plumage painted around a banded ellipsoid: x runs round the body (a quarter of the way across
// is the top of the back, three quarters the belly), y runs along it from the tail (top row) to the head.
function bodyMap(M, key, top, belly, fn) {
  return M.paint('bird|' + key, 128, 128, (ctx, w, h) => {
    const mid = new THREE.Color(top).lerp(new THREE.Color(belly), 0.5).getStyle();
    const g = ctx.createLinearGradient(0, 0, w, 0);
    for (const [k, c] of [[0, mid], [0.1, top], [0.4, top], [0.5, mid], [0.6, belly], [0.9, belly], [1, mid]]) g.addColorStop(k, c);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (fn) fn(ctx, w, h);
  });
}
// A bird seen from above. p: { key, body:[rx,ry,rz], col, belly, paint(ctx,w,h)?, head:[r, col], cap?, cheek?, eye?,
//   iris?, beak:[len, wid, col], beakDroop?, wing:[len, wid, col, dark, n, panel?], tail:[len, wid, col, tip, n, spread],
//   legs?, z (height of the belly above the ground), spread (wing angle) }
function birdModel(M, p) {
  const g = new THREE.Group(), T = THREE, z = p.z || 0, [brx, bry, brz] = p.body, zc = z + brz;
  if (p.tail) {
    const [tl, tw, tc, tip, n, spread] = p.tail, tail = new T.Group(); tail.position.set(-brx * 0.8, 0, z + brz * 1.1); g.add(tail); g.userData.tail = tail;
    for (let k = 0; k < n; k++) {
      const a = Math.PI + (k - (n - 1) / 2) * spread / Math.max(1, n - 1), f = new T.Group(); f.rotation.z = a; tail.add(f);
      const geo = M.geo('tailF|' + tl + '|' + tw, () => M.shape(PlantShapes.leafPts(tl / 2, tw), { uv: true }));
      const m = new T.Mesh(geo, M.feather(k % 2 ? tc : tint(tc, -0.1))); m.castShadow = true; m.position.x = tl / 2; m.rotation.x = 0.1 * (k - (n - 1) / 2); f.add(m);
      if (tip) M.ellipsoid(f, tw * 0.9, tw * 0.9, 0.4, M.feather(tip), [tl * 0.92, 0, 0.1]);
    }
  }
  g.userData.wings = [];
  if (p.wing) {
    const [wl, ww, wc, wd, n, panel] = p.wing, map = featherMap(M, p.key + '|w', wl, ww, n, wc, wd, panel), base = p.spread === undefined ? 1.0 : p.spread;
    for (const s of [-1, 1]) {
      const hinge = new T.Group(); hinge.position.set(brx * 0.15, s * bry * 0.55, z + brz * 1.4); g.add(hinge);
      const geo = M.geo('wing|' + p.key + '|' + s, () => M.shape(wingPts(wl, ww, n).map(([x, y]) => [x, y * s]), { uv: true }));
      if (s < 0 && !geo.userData.flipped) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); uv.needsUpdate = true; geo.userData.flipped = true; }
      const m = new T.Mesh(geo, M.feather('#ffffff', { map })); m.castShadow = true; m.receiveShadow = true;
      hinge.add(m);
      hinge.rotation.z = s * base;
      g.userData.wings.push({ hinge, s, base });
    }
  }
  M.banded(g, brx, bry, brz, M.feather('#ffffff', { map: bodyMap(M, p.key, p.col, p.belly || p.col, p.paint) }), [0, 0, zc]);
  const [hr, hc] = p.head, hx = brx * 0.85 + hr * 0.6, hz = zc + brz * 0.05;
  M.banded(g, hr, hr * 0.95, hr * 0.9, M.feather(hc), [hx, 0, hz]);
  if (p.cap) M.ellipsoid(g, hr * 0.8, hr * 0.8, hr * 0.5, M.feather(p.cap), [hx - hr * 0.1, 0, hz + hr * 0.5]);
  if (p.cheek) for (const s of [-1, 1]) M.ellipsoid(g, hr * 0.55, hr * 0.4, hr * 0.35, M.feather(p.cheek), [hx + hr * 0.15, s * hr * 0.8, hz + hr * 0.25]);
  const er = p.eye || hr * 0.2;
  for (const s of [-1, 1]) M.ellipsoid(g, er, er, er, M.eye({ color: p.iris || '#1a1008' }), [hx + hr * 0.44, s * hr * 0.73, hz + hr * 0.44]);
  const [bl, bw, bc] = p.beak;
  M.seg(g, [hx + hr * 0.7, 0, hz - hr * 0.1], [hx + hr * 0.7 + bl, 0, hz - hr * 0.1 - (p.beakDroop || 0)], bw, M.gloss(bc, { rough: 0.4 }), { cone: 0.1 });
  if (p.legs) for (const s of [-1, 1]) { M.seg(g, [-brx * 0.1, s * bry * 0.4, z + brz * 0.3], [brx * 0.1, s * bry * 0.6, z], 0.5, M.gloss(p.legs), { full: true }); for (const f of [-1, 0, 1]) M.seg(g, [brx * 0.1, s * bry * 0.6, z], [brx * 0.1 + 3 + f * 1.2, s * bry * 0.6 + f * 1.4, 0.1], 0.3, M.gloss(p.legs), { cone: 0.05 }); }
  g.userData.head = { x: hx, z: hz, r: hr };
  return g;
}
function flapPose(root, o, t, f, steps, amp) {
  const ph = SpriteCache.phase(t, f, steps), flap = Math.sin((ph + 0.5) / steps * TAU) * amp;
  for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.8, 0.05, w.s * (w.base + flap * 0.25));
  if (root.userData.tail) root.userData.tail.rotation.z = Math.sin((ph + 0.5) / steps * TAU) * 0.1;
}
// Streaks along the body over a region of the map (x0..x1 of the width), n of them.
function streaks(ctx, w, h, x0, x1, n, col, wid) { ctx.fillStyle = col; for (let k = 0; k < n; k++) ctx.fillRect(w * (x0 + (x1 - x0) * (k + 0.5) / n), h * 0.08, wid || 1.5, h * 0.8); }

Models.define('beeEater', {
  // Rainbow bee-eater: green back, golden head with an olive crown and a black eye stripe, blue rump and tail
  // with two black streamers, a long down-curved black bill, orange flashes on the wings.
  key(o, t) { return 'f' + SpriteCache.phase(t, 14, 4); },
  build(M) {
    const g = birdModel(M, { key: 'beeEater', body: [13, 6.2, 5], col: '#4aa85a', belly: '#8ccfa8', paint(ctx, w, h) { ctx.fillStyle = '#2a8ab8'; ctx.fillRect(w * 0.04, 0, w * 0.42, h * 0.18); },
      head: [5.6, '#d8a830'], cap: '#7ab048', beak: [11, 1.3, '#111'], beakDroop: 1.5, iris: '#c0392b',
      wing: [34, 14, '#3a9a48', '#1a3a20', 8, 'rgba(225,135,40,.8)'], tail: [26, 2.4, '#1f78a0', null, 5, 0.5], z: 6, spread: 0.95 });
    const H = g.userData.head;
    for (const s of [-1, 1]) M.seg(g, [-18, s * 1.2, 11.5], [-42, s * 1.2, 11.8], 0.5, M.gloss('#111'), { full: true });   // the two streamers
    for (const s of [-1, 1]) M.seg(g, [H.x - H.r * 0.5, s * H.r * 0.92, H.z + H.r * 0.2], [H.x + H.r * 0.7, s * H.r * 0.72, H.z + H.r * 0.3], 0.6, M.gloss('#111'), { full: true });   // eye stripe
    return g;
  },
  pose(root, o, t) { flapPose(root, o, t, 14, 4, 0.3); },
});

Models.define('hobby', {
  // Australian hobby: slate back, black cap with a pale half-collar, rufous barred underside, long narrow
  // pointed wings, a yellow cere on a short hooked bill.
  key(o, t) { return 'f' + SpriteCache.phase(t, 12, 4); },
  build(M) {
    const g = birdModel(M, { key: 'hobby', body: [14, 7, 5.5], col: '#5a6472', belly: '#b08058', paint(ctx, w, h) { ctx.fillStyle = 'rgba(235,225,205,.55)'; for (let k = 0; k < 8; k++) ctx.fillRect(w * 0.55, h * (0.12 + k * 0.1), w * 0.4, 2); },
      head: [6.3, '#2a2f38'], beak: [4.5, 1.6, '#4a4a50'], beakDroop: 1.2, iris: '#2a2016',
      wing: [48, 18, '#4a5260', '#20242c', 9], tail: [24, 3.5, '#3d4450', null, 6, 0.55], z: 8, spread: 1.0 });
    const H = g.userData.head;
    for (const s of [-1, 1]) M.ellipsoid(g, 2.6, 1.2, 1.8, M.feather('#d9d0b8'), [H.x - H.r * 0.15, s * H.r * 0.95, H.z - H.r * 0.1]);
    M.ellipsoid(g, 1.3, 1.6, 1, M.gloss('#e0b040'), [H.x + H.r * 0.95, 0, H.z + H.r * 0.3]);
    return g;
  },
  pose(root, o, t) { flapPose(root, o, t, 12, 4, 0.15); },
});

Models.define('magpie', {
  // Western magpie: black with a white nape, a white back (the male), white wing patches and tail base, a pale bill.
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 18, 4) : 'x'); },
  build(M) {
    return birdModel(M, { key: 'magpie', body: [12.5, 7.2, 5.6], col: '#1a1a1a', belly: '#222222', paint(ctx, w, h) { ctx.fillStyle = '#f2f2f2'; ctx.fillRect(w * 0.04, h * 0.76, w * 0.42, h * 0.14); ctx.fillRect(w * 0.04, 0, w * 0.42, h * 0.14); ctx.fillStyle = '#e8e8e8'; ctx.fillRect(w * 0.12, h * 0.2, w * 0.26, h * 0.56); },
      head: [5.6, '#151515'], beak: [7, 1.8, '#c8d0d8'], iris: '#8a3a2a',
      wing: [16, 8, '#1a1a1a', '#000', 6, 'rgba(242,242,242,.95)'], tail: [22, 4, '#151515', null, 4, 0.35], z: 5, spread: 0.35, legs: '#333' });
  },
});

Models.define('wagtail', {
  // Willie wagtail: black above with white eyebrows, white below, a long fanned tail it swings from side to side.
  key(o, t) { return 'f' + SpriteCache.phase(t, 9, 4); },
  build(M) {
    const g = birdModel(M, { key: 'wagtail', body: [11, 7, 5.2], col: '#1d1d1d', belly: '#f4f4f4', head: [6, '#151515'], beak: [4.5, 1.2, '#1a1a1a'],
      wing: [24, 11, '#222', '#000', 6], tail: [29, 2.6, '#1a1a1a', null, 5, 0.6], z: 4, spread: 1.05, legs: '#222' });
    const H = g.userData.head;
    for (const s of [-1, 1]) M.ellipsoid(g, 2.6, 0.9, 0.5, M.feather('#fff'), [H.x + H.r * 0.1, s * H.r * 0.75, H.z + H.r * 0.62]);
    return g;
  },
  pose(root, o, t) { flapPose(root, o, t, 16, 4, 0.2); if (root.userData.tail) root.userData.tail.rotation.z = Math.sin((SpriteCache.phase(t, 9, 4) + 0.5) / 4 * TAU) * 0.35; },
});

Models.define('honeyeater', {
  // New Holland honeyeater: black and white streaks, a white eye, white tufts by the ear, yellow wing panels and tail edges.
  key(o, t) { return (o.flying ? 'f' + SpriteCache.phase(t, 22, 4) : 'x'); },
  build(M, o) {
    const g = birdModel(M, { key: 'honeyeater', body: [10.5, 6, 4.6], col: '#2a2a2a', belly: '#f4f4f0', paint(ctx, w, h) { streaks(ctx, w, h, 0.06, 0.44, 6, 'rgba(245,245,240,.85)'); streaks(ctx, w, h, 0.58, 0.92, 5, 'rgba(30,30,30,.7)'); },
      head: [5, '#151515'], beak: [6.5, 1, '#111'], beakDroop: 0.8, iris: '#f0f0f0',
      wing: [22, 10, '#1a1a1a', '#000', 6, 'rgba(242,200,50,.95)'], tail: [20, 2.6, '#1c1c1c', '#f4f4f4', 5, 0.45], z: 4, spread: o.flying ? 1.0 : 0.55, legs: '#333' });
    const H = g.userData.head;
    for (const s of [-1, 1]) M.ellipsoid(g, 2, 0.8, 0.5, M.feather('#f6f6f6'), [H.x + H.r * 0.1, s * H.r * 0.8, H.z + H.r * 0.56]);
    return g;
  },
  pose(root, o, t) { if (o.flying) flapPose(root, o, t, 22, 4, 0.3); },
});
Models.define('wattlebird', {
  // Red wattlebird: grey-brown streaked with white, a yellow belly, red wattles below the ear, a white cheek streak.
  key(o, t) { return (o.flying ? 'f' + SpriteCache.phase(t, 18, 4) : 'x'); },
  build(M, o) {
    const g = birdModel(M, { key: 'wattlebird', body: [13.5, 7.8, 5.8], col: '#6e6050', belly: '#a09078', paint(ctx, w, h) { streaks(ctx, w, h, 0.06, 0.44, 9, 'rgba(240,235,225,.6)'); ctx.fillStyle = 'rgba(230,200,60,.5)'; ctx.fillRect(w * 0.62, h * 0.1, w * 0.26, h * 0.35); },
      head: [6, '#5a4d40'], beak: [7, 1.6, '#2a2420'], iris: '#c8302a',
      wing: [30, 13, '#5e5042', '#2a2018', 8], tail: [26, 3.2, '#5a4d40', '#f2f2ea', 5, 0.4], z: 5, spread: o.flying ? 1.0 : 0.5, legs: '#333' });
    const H = g.userData.head;
    for (const s of [-1, 1]) { M.ellipsoid(g, 1.8, 1.3, 1, M.gloss('#d8302a'), [H.x - H.r * 0.6, s * H.r * 0.95, H.z - H.r * 0.2]); M.seg(g, [H.x - H.r * 0.4, s * H.r * 0.88, H.z + H.r * 0.3], [H.x + H.r * 0.5, s * H.r * 0.82, H.z + H.r * 0.35], 0.5, M.feather('#f0ece4'), { full: true }); }
    return g;
  },
  pose(root, o, t) { if (o.flying) flapPose(root, o, t, 18, 4, 0.3); },
});
Models.define('fairyWren', {
  // Splendid fairy-wren, the male in colour: bright blue with a black band across the chest, pale blue cheeks, a cocked tail.
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 10, 4) : 'x'); },
  build(M) {
    const g = birdModel(M, { key: 'fairyWren', body: [7.5, 5, 4], col: '#2a5ae0', belly: '#1c3cb0', paint(ctx, w, h) { ctx.fillStyle = '#101020'; ctx.fillRect(0, h * 0.78, w, h * 0.12); },
      head: [4.4, '#3a8cf4'], beak: [3, 0.9, '#111'], cheek: '#7ab0f8',
      wing: [13, 6, '#1d3a9a', '#0c1a4a', 5], tail: [19, 1.8, '#1a2e6e', null, 3, 0.3], z: 3, spread: 0.6, legs: '#333' });
    if (g.userData.tail) g.userData.tail.rotation.y = 0.6;   // cocked up
    return g;
  },
  pose(root, o, t) { if (root.userData.tail) root.userData.tail.rotation.y = 0.6 + (o.moving ? Math.sin((SpriteCache.phase(t, 10, 4) + 0.5) / 4 * TAU) * 0.2 : 0); },
});
Models.define('cockatoo', {
  // Carnaby's black cockatoo: dusky black feathers edged pale, white cheek patches, white tail panels, a crest.
  key(o, t) { return (o.flying ? 'f' + SpriteCache.phase(t, 9, 4) : 'x'); },
  build(M, o) {
    const g = birdModel(M, { key: 'cockatoo', body: [16, 9.5, 7], col: '#262422', belly: '#3a3634', paint(ctx, w, h) { ctx.strokeStyle = 'rgba(220,210,190,.4)'; ctx.lineWidth = 1; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(i * w / 8 + (j % 2 ? w / 16 : 0), j * h / 8, w / 18, 0.3, Math.PI - 0.3); ctx.stroke(); } },
      head: [7.5, '#1e1c1a'], beak: [5, 3.2, '#8a8a88'], beakDroop: 1.5, iris: '#4a3020', cheek: '#f0ece2',
      wing: [44, 18, '#242220', '#0a0a0a', 9], tail: [34, 5.5, '#1e1c1a', '#f2f2ea', 6, 0.5], z: 6, spread: o.flying ? 1.0 : 0.45, legs: '#444' });
    const H = g.userData.head;
    for (let k = 0; k < 5; k++) M.seg(g, [H.x - H.r * 0.3, (k % 2 ? 1 : -1) * (1 + k * 0.5), H.z + H.r * 0.8], [H.x - H.r * 0.9, (k % 2 ? 1 : -1) * (2 + k * 0.6), H.z + H.r * 1.3], 0.5, M.feather('#1a1a1a'), { cone: 0.1 });   // crest
    return g;
  },
  pose(root, o, t) { if (o.flying) flapPose(root, o, t, 9, 4, 0.35); },
});

Models.define('gull', {
  // Silver gull, side view: white head and body, pale grey back and wings, black wingtips with white
  // spots, red bill, red legs, a white eye ring. The wings are the 2D outline stood up in the plane of
  // the picture, swinging up and down from the shoulder; swept back in a dive.
  view: 'side',
  key(o, t) { return (o.dive ? 'D' : 'f' + SpriteCache.phase(t, 7, 4)) + (o.face < 0 ? 'L' : 'R'); },
  build(M, o) {
    const g = new THREE.Group(), T = THREE, z0 = 14.5;
    // the wing outline in picture coordinates (up is negative y, as the 2D drawing has it)
    const pts = [[-2, -2]], q = (p0, c, p1, n) => { for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); } };
    q([-2, -2], [-8, -26], [-30, -30], 12); q([-30, -30], [-12, -14], [-8, 0], 12);
    const tex = patternTexture(M, 'gullWing', pts, (ctx) => {
      const gr = ctx.createLinearGradient(0, 0, -30, -30); gr.addColorStop(0, '#d8dde2'); gr.addColorStop(1, '#bcc4cc'); ctx.fillStyle = gr; ctx.fillRect(-32, -32, 34, 34);
      ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(80,90,100,.35)'; ctx.lineWidth = 0.5; ctx.beginPath();
      for (let k = 0; k < 6; k++) { ctx.moveTo(-6 - k * 1.5, -4 - k * 2); ctx.quadraticCurveTo(-14 - k * 2, -14 - k * 1.5, -24 - k, -22 - k * 1.3); }
      ctx.stroke();
      ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.moveTo(-22, -22); ctx.lineTo(-30, -30); ctx.lineTo(-25, -28.5); ctx.lineTo(-19, -20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.ellipse(-26, -26, 1, 0.8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-23, -23.5, 0.8, 0.6, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(80,90,100,.5)'; ctx.lineWidth = 0.6; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
    });
    g.userData.wings = [];
    for (const s of [-1, 1]) {   // the far wing first, then the near one (model +y faces the viewer)
      const hinge = new T.Group(); hinge.position.set(0, s * 4, z0 + 2); g.add(hinge);
      const mat = M.mat('gullWingMat|' + s, () => { const w = M.feather(s > 0 ? '#ffffff' : '#b0b6bc', { map: tex }).clone(); w.side = T.DoubleSide; return w; });   // seen from either side when the gull turns
      const m = new T.Mesh(M.geo('gullWing', () => M.shape(pts, { uv: true })), mat);
      m.rotation.x = -Math.PI / 2; m.castShadow = true; hinge.add(m);
      g.userData.wings.push({ hinge, s });
    }
    M.banded(g, 16, 6.5, 7, M.feather('#f4f6f8'), [-2, 0, z0]);
    M.banded(g, 12, 5.5, 3.6, M.feather('#d4dadf'), [-3, 0, z0 + 3]);
    M.ellipsoid(g, 6.5, 2.6, 2.4, M.feather('#e8ecf0'), [-16, 0, z0 + 0.5]);
    for (const k of [0, 1, 2]) M.ellipsoid(g, 2, 1.4, 0.9, M.feather('#2a2a2a'), [-20 - k, 0, z0 + 0.6 - k * 0.5]);
    M.banded(g, 6.5, 6, 6, M.feather('#f8f8fa'), [12, 0, z0 + 4]);
    M.ellipsoid(g, 1.9, 1.9, 1.9, M.eye({ color: '#f6f6f6' }), [14, 3.8, z0 + 6]);
    M.ellipsoid(g, 0.8, 0.8, 0.8, M.gloss('#111'), [14.6, 5.2, z0 + 6.1]);
    M.seg(g, [17, 0, z0 + 3.4], [26, 0, z0 + 2.4], 1.7, M.gloss('#d83a2a', { rough: 0.35 }), { cone: 0.3 });
    if (!o.dive) for (const k of [0, 1]) { const y = (k ? 1 : -1) * 2; M.seg(g, [k * 3, y, 8.5], [-2 + k * 3, y, 2.5], 0.7, M.gloss('#d83a2a'), { full: true }); for (const f of [-1, 0, 1]) M.seg(g, [-2 + k * 3, y, 2.5], [-2 + k * 3 + f * 1.5 + 1, y + f * 0.6, 0.1], 0.4, M.gloss('#d83a2a'), { cone: 0.05 }); }
    return g;
  },
  pose(root, o, t) {
    const flap = o.dive ? -0.9 : Math.sin((SpriteCache.phase(t, 7, 4) + 0.5) / 4 * TAU) * 0.8;
    for (const w of root.userData.wings) w.hinge.rotation.y = w.s > 0 ? flap * 0.6 : flap * 0.4 + 0.2;
  },
});

Models.define('plover', {
  // Red-capped plover, side view, running: sandy brown back, white below, a rufous cap, black bill, dark legs.
  view: 'side',
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 22, 4) : 'x') + (o.face < 0 ? 'L' : 'R'); },
  build(M) {
    const g = new THREE.Group();
    M.ellipsoid(g, 13, 8, 8.8, M.feather('#b8a082'), [0, 0, 12]);
    M.ellipsoid(g, 10, 7, 4.6, M.feather('#f8f5ee'), [2, 0, 8.5]);
    M.ellipsoid(g, 9, 5, 3, M.feather('#ffffff', { map: featherMap(M, 'ploverWing', 9, 5, 5, '#9a8468', '#4a3a28') }), [-4, 4.5, 15]);
    M.seg(g, [-13, 0, 13], [-19, 0, 11], 2.2, M.feather('#5a4a38'), { cone: 1 });
    M.ellipsoid(g, 6.5, 6, 6, M.feather('#f8f5ee'), [11, 0, 19]);
    M.ellipsoid(g, 4.5, 4.5, 2.6, M.feather('#c0582a'), [10, 0, 23]);
    M.ellipsoid(g, 2, 1.2, 1.2, M.feather('#fff'), [15.5, 2, 22.5]);
    M.ellipsoid(g, 1.3, 1.3, 1.3, M.eye(), [13, 4.6, 20]);
    M.seg(g, [12, 3.2, 19.5], [16, 3, 19.8], 0.6, M.feather('#2a2a2a'), { full: true });
    M.seg(g, [17, 0, 19], [23, 0, 18.6], 1.1, M.gloss('#1a1a1a'), { cone: 0.2 });
    g.userData.legs = [];
    for (const [x, k] of [[0, 1], [2, -1]]) { const leg = new THREE.Group(); leg.position.set(x, k * 1.5, 7); g.add(leg); M.seg(leg, [0, 0, 0], [-3, 0, -7], 0.65, M.gloss('#4a4a4a'), { full: true }); for (const f of [-1, 0, 1]) M.seg(leg, [-3, 0, -7], [-3 + f * 1.4 + 1.5, f * 0.8, -7.2], 0.4, M.gloss('#3a3a3a'), { cone: 0.05 }); g.userData.legs.push({ leg, k }); }
    return g;
  },
  pose(root, o, t) { const run = o.moving ? Math.sin((SpriteCache.phase(t, 22, 4) + 0.5) / 4 * TAU) : 0; for (const { leg, k } of root.userData.legs) leg.rotation.y = run * 0.5 * k; },
});

// ---------------------------------------------------------------- mammals and reptiles
Models.define('echidna', {
  // Short-beaked echidna: a dome of cream spines with dark tips over dark fur, a long snout, clawed feet.
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 6, 4) : 'x'); },
  build(M) {
    const g = new THREE.Group(), T = THREE;
    g.userData.feet = [];
    for (const [x, s] of [[14, -1], [14, 1], [-12, -1], [-12, 1]]) { const f = new T.Group(); f.position.set(x, s * 17, 2.6); g.add(f); M.ellipsoid(f, 4.5, 3.2, 2.6, M.fur('#3a2414'), [0, 0, 0]); for (let k = -1; k <= 1; k++) M.seg(f, [k * 2, s * 2, 0.5], [k * 2.4, s * 5.5, 0], 0.7, M.gloss('#1a1008'), { cone: 0.1 }); g.userData.feet.push({ f, s }); }
    M.ellipsoid(g, 26, 19, 13, M.fur('#4a3220'), [0, 0, 8]);
    M.pile(g, [0, 0, 8], 25.5, 18.5, 12.8, 220, 2.6, '#6a4a30', 21, { lean: 0.5, thick: 0.2 });
    const r = rng(7), base = new T.Vector3(), nrm = new T.Vector3();
    M.hairs(g, 160, M.cone(0.55, 0.05, 9), M.hair('#f0e4c8'), (i, d) => {
      const a = r() * TAU, dd = Math.sqrt(r()) * 0.92, x = Math.cos(a) * 24 * dd, y = Math.sin(a) * 17 * dd, z = 8 + 12.5 * Math.sqrt(Math.max(0, 1 - (x / 25) ** 2 - (y / 18) ** 2));
      nrm.set(x / 25 / 25, y / 18 / 18, (z - 8) / 12.5 / 12.5).normalize(); nrm.x -= 0.25; nrm.normalize();
      d.position.set(x, y, z); d.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), nrm); d.position.addScaledVector(nrm, 4.2); d.scale.set(1, 0.8 + r() * 0.4, 1);
      return i % 2 ? null : '#d8c8a0';
    });
    // the dark tips, sitting on the ends of a second set of spines
    M.hairs(g, 160, M.cone(0.28, 0.03, 2.2), M.gloss('#1a1008'), (i, d) => {
      const a2 = r() * TAU, dd = Math.sqrt(r()) * 0.92, x = Math.cos(a2) * 24 * dd, y = Math.sin(a2) * 17 * dd, z = 8 + 12.5 * Math.sqrt(Math.max(0, 1 - (x / 25) ** 2 - (y / 18) ** 2));
      nrm.set(x / 625, y / 324, (z - 8) / 156).normalize(); nrm.x -= 0.25; nrm.normalize();
      d.position.set(x, y, z); d.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), nrm); d.position.addScaledVector(nrm, 8.4);
    });
    M.ellipsoid(g, 6.5, 6, 5, M.fur('#5b3a21'), [24, 0, 6]);
    M.seg(g, [27, 0, 5.5], [41, 0, 3.6], 2, M.skin('#2b1a0e'), { cone: 1 });
    M.ellipsoid(g, 1.6, 1.4, 1.2, M.gloss('#1a0e06'), [41, 0, 3.5]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1.1, 1.1, 1.1, M.eye(), [27, s * 3.4, 8.2]);
    return g;
  },
  pose(root, o, t) { const bob = o.moving ? Math.sin((SpriteCache.phase(t, 6, 4) + 0.5) / 4 * TAU) : 0; root.userData.feet.forEach((q, i) => { q.f.position.x = (i < 2 ? 14 : -12) + bob * q.s * 1.5; }); },
});

Models.define('kangaroo', {
  // Western grey kangaroo grazing, from above: a long thick tail behind, big haunches, narrow shoulders,
  // small forearms, a long face with big ears.
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 8, 4) : 'x'); },
  build(M) {
    const g = new THREE.Group();
    M.seg(g, [-18, 0, 5], [-52, 4, 2.5], 4.5, M.fur('#8a6a48'), { cone: 1.8 });
    M.ellipsoid(g, 18, 12, 9, M.fur('#8a6a48'), [-6, 0, 9]);
    M.pile(g, [-6, 0, 9], 17.5, 11.5, 8.8, 260, 2.4, '#c0a070', 27, { lean: 0.6, thick: 0.22 });
    for (const s of [-1, 1]) { M.ellipsoid(g, 9, 5, 4.5, M.fur('#7a5a3a'), [-8, s * 11, 5], s * 0.15); M.pile(g, [-8, s * 11, 5], 8.8, 4.8, 4.3, 40, 1.8, '#9a7a56', 28, { lean: 0.5, thick: 0.18 }); for (let k = -1; k <= 1; k++) M.seg(g, [-2 + k * 1.5, s * 14.5, 1.2], [1 + k * 1.5, s * 17, 0.3], 0.7, M.gloss('#2a1a10'), { cone: 0.1 }); }
    M.ellipsoid(g, 8, 7, 6.5, M.fur('#8a6a48'), [8, 0, 8]);
    for (const s of [-1, 1]) { M.seg(g, [10, s * 5, 6], [15, s * 9, 1.5], 1.3, M.fur('#7a5a3a'), { cone: 0.9 }); M.ellipsoid(g, 1.6, 1.2, 0.8, M.fur('#3a2a1a'), [15.5, s * 9.5, 1]); }
    M.ellipsoid(g, 6.5, 5, 4.5, M.fur('#9a7a56'), [18, 0, 7]);
    M.ellipsoid(g, 6, 3.4, 3, M.fur('#8a6a48'), [26, 0, 5.5]);
    M.ellipsoid(g, 1.6, 1.4, 1.2, M.gloss('#1a1008'), [31.5, 0, 5]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 5, 2.4, 1.2, M.fur('#7a5a3a'), [17, s * 6.5, 10.5], s * 0.7); M.ellipsoid(g, 3, 1.1, 0.6, M.skin('#c8a080'), [17.5, s * 6.5, 11.2], s * 0.7); M.ellipsoid(g, 1, 0.9, 0.9, M.eye({ color: '#2a1a0a' }), [22, s * 2.6, 9]); }
    return g;
  },
});

Models.define('quenda', {
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 12, 4) : 'x'); },
  build(M) {
    const g = new THREE.Group();
    g.userData.feet = [];
    for (const [x, s] of [[9, -1], [9, 1], [-9, -1], [-9, 1]]) { const f = new THREE.Group(); f.position.set(x, s * 8.5, 1.8); g.add(f); M.ellipsoid(f, 3.4, 2.4, 1.8, M.fur('#4a3624'), [0, 0, 0]); for (let k = -1; k <= 1; k++) M.seg(f, [k * 1.3, s * 1.5, 0.4], [k * 1.5, s * 3.3, 0], 0.45, M.gloss('#2a1a10'), { cone: 0.05 }); g.userData.feet.push({ f, s, x }); }
    M.seg(g, [-14, 0, 3], [-23, 1.5, 2], 1.3, M.skin('#5a4030'), { cone: 0.5 });
    M.ellipsoid(g, 15.5, 9.2, 7.5, M.fur('#7a5e40'), [0, 0, 6]);
    M.pile(g, [0, 0, 6], 15.3, 9, 7.4, 220, 2.0, '#8a6a46', 35, { lean: 0.6, thick: 0.18 });
    M.pile(g, [-2, 0, 6.5], 12, 6, 7, 50, 1.6, '#c8b088', 36, { lean: 0.6, thick: 0.14 });
    M.ellipsoid(g, 7, 6.2, 5.2, M.fur('#7a5e40'), [14, 0, 5]);
    M.pile(g, [14, 0, 5], 6.8, 6, 5, 60, 1.4, '#8a6a46', 37, { lean: 0.5, thick: 0.16 });
    M.ellipsoid(g, 5.5, 2.8, 2.4, M.fur('#8a6a4a'), [21, 0, 3.6]);
    M.ellipsoid(g, 1.5, 1.3, 1.1, M.skin('#d08a80'), [26, 0, 3.4]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 2.8, 2.4, 1, M.fur('#6a5038'), [10.5, s * 5.8, 9.2], s * 0.3); M.ellipsoid(g, 1.6, 1.3, 0.6, M.skin('#c89a90'), [10.5, s * 5.8, 9.8], s * 0.3); M.ellipsoid(g, 1.1, 1.1, 1.1, M.eye({ color: '#1a1008' }), [16.5, s * 3.2, 7]); }
    return g;
  },
  pose(root, o, t) { const step = o.moving ? Math.sin((SpriteCache.phase(t, 12, 4) + 0.5) / 4 * TAU) * 2 : 0; for (const { f, s, x } of root.userData.feet) f.position.x = x + step * s; },
});

Models.define('quokka', {
  // Quokka, front-on, sitting up and smiling: round brown body, pale chest, round ears, dark eyes.
  view: 'side',
  build(M) {
    const g = new THREE.Group();
    M.ellipsoid(g, 30, 22, 34, M.fur('#8a6a4a'), [0, 0, 34]);
    M.pile(g, [0, 0, 34], 29.5, 21.5, 33.5, 220, 2.2, '#a88a62', 41, { lean: 0, thick: 0.16, full: true });
    M.ellipsoid(g, 20, 14, 24, M.fur('#b09a76'), [0, 8, 28]);
    M.ellipsoid(g, 22, 18, 20, M.fur('#8a6a4a'), [0, 4, 70]);
    M.pile(g, [0, 4, 70], 21.5, 17.5, 19.5, 160, 2, '#a88a62', 42, { lean: 0, thick: 0.16, full: true });
    for (const s of [-1, 1]) { M.ellipsoid(g, 7, 4, 7, M.fur('#8a6a4a'), [s * 15, 0, 86]); M.ellipsoid(g, 4, 2.5, 4, M.skin('#c8a080'), [s * 15, 2.5, 86]); }
    for (const s of [-1, 1]) { M.ellipsoid(g, 3, 2.6, 3.4, M.eye({ color: '#111' }), [s * 8, 19, 74]); M.ellipsoid(g, 1, 0.8, 1, M.gloss('#fff'), [s * 8 - 1, 21.4, 75]); }
    M.ellipsoid(g, 4, 2.6, 3, M.gloss('#2a1a10'), [0, 21, 64]);
    for (const s of [-1, 1]) M.seg(g, [0, 21, 61], [s * 6.5, 20, 57], 0.9, M.gloss('#2a1a10'), { full: true });
    for (const s of [-1, 1]) M.ellipsoid(g, 5, 4, 7, M.fur('#7a5a3a'), [s * 12, 12, 10]);
    return g;
  },
});

Models.define('bobtail', {
  // Bobtail: overlapping pinecone scales in rows, a triangular head, a stumpy tail shaped like the head.
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 10, 4) : 'x') + (Math.sin(t * 2) > 0.7 ? 'T' : ''); },
  build(M, o) {
    const g = new THREE.Group(), T = THREE;
    for (const [x, s] of [[8, -1], [8, 1], [-8, -1], [-8, 1]]) { M.ellipsoid(g, 3.4, 3, 2.2, M.scales('#4a3a28'), [x, s * 8, 2]); for (let k = -1; k <= 1; k++) M.seg(g, [x + k * 1.6, s * 10, 1], [x + k * 2, s * 12.5, 0.2], 0.5, M.gloss('#2a1a10'), { cone: 0.05 }); }
    M.ellipsoid(g, 14, 7.5, 5, M.scales('#7a6240'), [0, 0, 5]);
    M.ellipsoid(g, 6.5, 5.2, 4, M.scales('#6e5838'), [-17, 0, 4.2]);
    // the big plates, each a flattened dome, in staggered rows over the body and the stumpy tail
    const plates = [];
    for (let i = -6; i <= 4; i++) for (let j = -2; j <= 2; j++) { const x = i * 3.6 + (j % 2 ? 1.8 : 0), y = j * 3, w = x > -15 ? 7.2 : 5, h = Math.sqrt(Math.max(0, 1 - (x / 23) ** 2)) * w; if (Math.abs(y) > h + 1) continue; plates.push([x, y, h]); }
    M.hairs(g, plates.length, M.sphere(1, 10), M.scales('#ffffff', { repeat: 1 }), (i, d) => { const [x, y, h] = plates[i]; const z = 5 + 4.8 * Math.sqrt(Math.max(0, 1 - (x / 23) ** 2 - (y / 8) ** 2)); d.position.set(x, y, z); d.scale.set(2.7, 2.1, 0.6); d.rotation.set(y * 0.08, -x * 0.02, 0); return (i % 3) ? '#8a6e46' : '#a88a58'; });
    // the broad triangular head, with small scales, a brow ridge and ear openings
    M.ellipsoid(g, 8, 6.2, 4.2, M.scales('#8a7250', { repeat: 6 }), [17.5, 0, 4.6]);
    M.ellipsoid(g, 5.5, 7, 2.2, M.scales('#7a6240', { repeat: 6 }), [15, 0, 6.6]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 1.3, 1.1, 1.1, M.eye({ color: '#2a1a0a' }), [19.5, s * 4.2, 7.4]); M.ellipsoid(g, 0.5, 0.5, 0.4, M.gloss('#2a1a0a'), [24.2, s * 1.8, 5.4]); M.ellipsoid(g, 0.8, 0.6, 0.8, M.gloss('#2a1a0a'), [13.5, s * 5.6, 5.8]); }
    const tongue = new T.Group(); tongue.visible = false; g.add(tongue); g.userData.tongue = tongue;
    M.seg(tongue, [24, 0, 4.4], [29, 0, 4.2], 1, M.skin('#2f4f8f'), { full: true }); M.seg(tongue, [28, 0, 4.2], [30.5, -1.2, 4.2], 0.6, M.skin('#2f4f8f'), { cone: 0.1 }); M.seg(tongue, [28, 0, 4.2], [30.5, 1.2, 4.2], 0.6, M.skin('#2f4f8f'), { cone: 0.1 });
    return g;
  },
  pose(root, o, t) { root.userData.tongue.visible = Math.sin(t * 2) > 0.7; },
});

Models.define('skink', {
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 14, 4) : 'x'); },
  build(M) {
    const g = new THREE.Group();
    g.userData.legs = [];
    for (const [x, s, k] of [[6, -1, 1], [6, 1, -1], [-5, -1, -1], [-5, 1, 1]]) { const leg = new THREE.Group(); leg.position.set(x, 0, 2); g.add(leg); M.seg(leg, [0, 0, 0], [2, s * 6, -1.3], 0.6, M.scales('#6a5a3a'), { full: true }); for (let f = -1; f <= 1; f++) M.seg(leg, [2, s * 6, -1.3], [2 + f * 1.2, s * 8.2, -1.8], 0.3, M.gloss('#4a3a24'), { cone: 0.05 }); g.userData.legs.push({ leg, s, k }); }
    g.userData.tail = new THREE.Group(); g.userData.tail.position.set(-8, 0, 1.8); g.add(g.userData.tail);
    M.seg(g.userData.tail, [0, 0, 0], [-20, 0, -0.4], 1.3, M.scales('#6a5a3c'), { cone: 0.2 });
    M.ellipsoid(g, 9.5, 3.6, 2.4, M.scales('#8a7048'), [0, 0, 2.2]);
    M.ellipsoid(g, 8.5, 1.4, 0.6, M.scales('#b08a50'), [0, 0, 4.2]);
    for (const s of [-1, 1]) { M.seg(g, [-8, s * 2.4, 3.2], [9, s * 2.4, 3.2], 0.5, M.gloss('#2a1c0e', { rough: 0.8 }), { full: true }); M.seg(g, [-8, s * 3.3, 2.6], [8, s * 3.3, 2.6], 0.25, M.gloss('#ebdcbe', { rough: 0.8 }), { full: true }); }
    M.ellipsoid(g, 3.8, 2.9, 2, M.scales('#8a7048'), [10.5, 0, 2.1]);
    for (const s of [-1, 1]) M.ellipsoid(g, 0.8, 0.8, 0.8, M.eye({ color: '#1a1008' }), [11.2, s * 1.9, 3.2]);
    return g;
  },
  pose(root, o, t) { const w = o.moving ? Math.sin((SpriteCache.phase(t, 14, 4) + 0.5) / 4 * TAU) * 0.4 : 0; for (const { leg, k } of root.userData.legs) leg.rotation.z = k * w * 0.6; root.userData.tail.rotation.z = w * 0.5; },
});

Models.define('gecko', {
  // Marbled gecko on the wall: velvety grey with dark marbling, big lidless eyes, wide toe pads. Its 2D
  // drawing turned itself a little; the model does the same so it sits on the brick the same way.
  key(o, t) { return 'x'; },
  build(M) {
    const g = new THREE.Group(), inner = new THREE.Group(); inner.rotation.z = -0.4; g.add(inner);
    const marble = M.paint('geckoSkin', 128, 128, (ctx, w, h) => { ctx.fillStyle = '#c4b49c'; ctx.fillRect(0, 0, w, h); const r = rng(38); for (let i = 0; i < 24; i++) { ctx.fillStyle = 'rgba(80,65,50,.5)'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 8 + r() * 10, 5 + r() * 6, r() * 3, 0, TAU); ctx.fill(); } for (let i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(255,250,240,.35)'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 5, 4, r() * 3, 0, TAU); ctx.fill(); } });
    const skin = M.skin('#ffffff', { map: marble });
    for (const [x, s] of [[6, -1], [6, 1], [-6, -1], [-6, 1]]) { M.seg(inner, [x, 0, 1.8], [x + 3, s * 7.5, 1], 0.75, skin, { full: true }); M.seg(inner, [x + 3, s * 7.5, 1], [x + 6, s * 8.5, 0.6], 0.6, skin, { full: true }); for (let f = -2; f <= 2; f++) { const a = s * 1.57 + f * 0.45; M.seg(inner, [x + 6, s * 8.5, 0.5], [x + 6 + Math.cos(a) * 2.6, s * 8.5 + Math.sin(a) * 2.6, 0.3], 0.4, skin, { full: true }); M.ellipsoid(inner, 0.8, 0.8, 0.4, skin, [x + 6 + Math.cos(a) * 2.8, s * 8.5 + Math.sin(a) * 2.8, 0.3]); } }
    M.seg(inner, [-11, 0, 1.8], [-24, 3, 1.4], 1.6, skin, { cone: 0.6 }); M.seg(inner, [-24, 3, 1.4], [-28, 1, 1.2], 0.6, skin, { cone: 0.1 });
    M.ellipsoid(inner, 12.5, 4.8, 2.6, skin, [0, 0, 2.4]); M.ellipsoid(inner, 5.8, 4.4, 2.4, skin, [13, 0, 2.3]);
    for (const s of [-1, 1]) { M.ellipsoid(inner, 1.6, 1.5, 1.5, M.eye({ color: '#5a4a30' }), [15, s * 2.6, 3.6]); M.ellipsoid(inner, 0.2, 1.4, 0.3, M.gloss('#1a1008'), [16.4, s * 2.6, 3.8]); }
    return g;
  },
});

Models.define('turtle', {
  // Oblong turtle: a narrow dark shell with ridged scutes, a neck longer than the shell, webbed clawed feet.
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 5, 4) : 'x') + 'n' + SpriteCache.phase(t, 2, 4); },
  build(M) {
    const g = new THREE.Group(), T = THREE;
    g.userData.feet = [];
    for (const [x, s, k] of [[12, -1, 1], [12, 1, -1], [-14, -1, -1], [-14, 1, 1]]) { const f = new T.Group(); f.position.set(x, s * 14, 2); g.add(f); M.ellipsoid(f, 4.2, 8, 2.2, M.scales('#5d5a3a'), [0, s * 4, 0], s * 0.5); for (let c = -1; c <= 1; c++) M.seg(f, [c * 1.8, s * 10, 0.5], [c * 2.4, s * 13.5, 0.1], 0.45, M.gloss('#2a2818'), { cone: 0.05 }); g.userData.feet.push({ f, s, k }); }
    M.seg(g, [-24, 0, 3], [-33, 0, 2.2], 1.7, M.scales('#5d5a3a'), { cone: 0.4 });
    // the carapace: a low dome with the scutes as raised plates following its curve, a ridge down the middle
    const shell = new T.Mesh(M.geo('turtleDome', () => new T.SphereGeometry(1, 28, 14, 0, TAU, 0, Math.PI / 2)), M.scales('#4a3e2a', { repeat: 2 }));
    shell.scale.set(25, 18, 9); shell.position.z = 3; shell.rotation.x = Math.PI / 2; shell.castShadow = shell.receiveShadow = true; g.add(shell);
    M.ellipsoid(g, 25, 18, 1.2, M.scales('#3e3626'), [0, 0, 3]);
    const dome = (x, y) => 3 + 9 * Math.sqrt(Math.max(0, 1 - (x / 25) ** 2 - (y / 18) ** 2)), nrm = new T.Vector3(), up = new T.Vector3(0, 0, 1);
    [[-13, 0, 6, 5], [-1, 0, 7, 5.5], [12, 0, 6, 5], [-8, -9, 6, 3.5], [4, -9.5, 6, 3.5], [-8, 9, 6, 3.5], [4, 9.5, 6, 3.5], [15, -7, 4, 3], [15, 7, 4, 3], [-18, -6, 4, 3], [-18, 6, 4, 3]].forEach(([cx, cy, rx, ry], i) => {
      const z = dome(cx, cy); nrm.set(cx / 625, cy / 324, (z - 3) / 81).normalize();
      const m = M.part(M.sphere(1, 18), M.scales(i % 2 ? '#5e5038' : '#6a5a3e', { repeat: 2 }), { at: [cx, cy, z - 0.4], scale: [rx, ry, 1] });
      m.quaternion.setFromUnitVectors(up, nrm); g.add(m);
      const r = M.part(M.sphere(1, 12), M.scales('#7a6a46'), { at: [cx + nrm.x * 0.6, cy + nrm.y * 0.6, z + 0.3], scale: [rx * 0.5, ry * 0.5, 0.5] }); g.add(r);
    });
    g.userData.neck = new T.Group(); g.userData.neck.position.set(22, 0, 4); g.add(g.userData.neck);
    M.seg(g.userData.neck, [0, 0, 0], [24, 0, 0.5], 3, M.scales('#6b6844'), { cone: 2.4 });
    for (let k = 0; k < 5; k++) M.ellipsoid(g.userData.neck, 0.3, 3.1, 2.6, M.gloss('#3a3520', { rough: 0.9 }), [4 + k * 4, 0, 0.3]);
    M.ellipsoid(g.userData.neck, 6.5, 5, 3.6, M.scales('#6b6844'), [28, 0, 0.6]);
    for (const s of [-1, 1]) M.ellipsoid(g.userData.neck, 1.3, 1.3, 1.3, M.eye(), [31, s * 3, 2.6]);
    M.ellipsoid(g.userData.neck, 1.5, 1.8, 1.2, M.gloss('#5a5838'), [34, 0, 0.6]);
    return g;
  },
  pose(root, o, t) {
    const pad = o.moving ? Math.sin((SpriteCache.phase(t, 5, 4) + 0.5) / 4 * TAU) * 0.4 : 0, nk = Math.sin((SpriteCache.phase(t, 2, 4) + 0.5) / 4 * TAU) * 0.15;
    for (const { f, s, k } of root.userData.feet) f.rotation.z = s * pad * k;
    root.userData.neck.rotation.z = nk;
  },
});

Models.define('frog', {
  // Motorbike frog: olive-green with a pale stripe, golden eyes, long legs folded at the sides.
  build(M) {
    const g = new THREE.Group(), wet = M.skin('#5fa046', { rough: 0.3 });
    for (const s of [-1, 1]) { M.ellipsoid(g, 7, 3, 2.4, M.skin('#4f8f3a', { rough: 0.3 }), [-6, s * 7, 2.2], s * 0.5); M.ellipsoid(g, 3, 1.4, 1.2, M.skin('#4a8a36', { rough: 0.3 }), [-11, s * 9, 1.2], s * 0.9); M.ellipsoid(g, 4, 2, 1.6, M.skin('#4f8f3a', { rough: 0.3 }), [6, s * 6, 1.6], -s * 0.5); for (let f = -1; f <= 1; f++) M.seg(g, [-12, s * 10, 0.8], [-13 + f * 1.5, s * 13, 0.3], 0.5, M.skin('#4a8a36'), { cone: 0.1 }); }
    M.ellipsoid(g, 9, 7, 5, wet, [0, 0, 4.6]);
    M.ellipsoid(g, 8, 0.55, 0.3, M.skin('#c8d890'), [-1, 0, 9.5]);
    const r = rng(9); for (let k = 0; k < 12; k++) M.ellipsoid(g, 1.2, 1, 0.6, M.skin('#6e5028'), [(r() - 0.5) * 15, (r() - 0.5) * 11, 4.6 + 4.9 * Math.sqrt(Math.max(0, 1 - 0.5))]);
    M.ellipsoid(g, 4.5, 4.4, 3.6, wet, [7, 0, 4.4]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 2.1, 2.1, 2.1, M.eye({ color: '#d8a840' }), [7.5, s * 3.3, 7.6]); M.ellipsoid(g, 1.2, 0.5, 0.5, M.gloss('#1a1008'), [8.2, s * 3.3, 8.6]); }
    return g;
  },
});
Models.define('banjoFrog', {
  build(M) {
    const g = new THREE.Group(), skin = M.skin('#8a7448', { rough: 0.5 });
    for (const s of [-1, 1]) { M.ellipsoid(g, 7, 3, 2.4, M.skin('#6a5a3a'), [-6, s * 7, 2.2], s * 0.5); M.ellipsoid(g, 4, 2, 1.6, M.skin('#6a5a3a'), [6, s * 6, 1.6], -s * 0.5); }
    M.ellipsoid(g, 10, 8, 5.6, skin, [0, 0, 5]);
    const r = rng(6); for (let k = 0; k < 14; k++) M.ellipsoid(g, 1.4, 1.2, 0.8, M.skin('#5a4520'), [(r() - 0.5) * 14, (r() - 0.5) * 10, 9.6]);
    M.ellipsoid(g, 7.5, 0.8, 0.4, M.skin('#e6c878'), [-1, 0, 10.4]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 2, 2, 2, M.eye({ color: '#c8a040' }), [6, s * 3.5, 8.6]); M.ellipsoid(g, 1.1, 0.5, 0.5, M.gloss('#1a1008'), [6.6, s * 3.5, 9.6]); }
    return g;
  },
});

// ---------------------------------------------------------------- wasps, beetles and the garden's small bugs
// A wasp body: black or painted, a narrow waist, long legs, smoky wings that beat while it flies.
function waspModel(M, o, p) {
  const g = new THREE.Group();
  g.userData.legs = M.legs6(g, { cx: 2, wide: 2.4, z: 5, mat: M.chitin(p.leg), w: 1.2, L: 18, pitch: 0.6, lift: 2 });
  M.banded(g, 10, 5.5, 4.6, M.chitin('#ffffff', { map: p.abd, coat: 0.7 }), [-12, 0, 5]);
  M.ellipsoid(g, 1.8, 1.5, 1.4, M.chitin(p.dark), [-3, 0, 5]);
  M.ellipsoid(g, 5.5, 4.2, 4, M.chitin(p.thorax), [3, 0, 5.4]);
  if (p.thoraxSpots) for (const s of [-1, 1]) M.ellipsoid(g, 2.5, 0.8, 0.5, M.chitin(p.body), [3, s * 2.5, 9.2]);
  M.ellipsoid(g, 4, 4.2, 3.8, M.chitin(p.body), [11, 0, 5.2]);
  for (const s of [-1, 1]) { M.ellipsoid(g, 1.6, 2, 2.2, M.eye({ color: p.eye }), [12, s * 3, 6], s * 0.3); M.antenna(g, [14, s * 2, 5.6], s * 0.9, 4, s * 0.3, 9, 8, M.chitin(p.leg), 1, { rise: 0.35, droop: 0 }); }
  for (const s of [-1, 1]) M.seg(g, [14.5, s * 1.2, 4.2], [16.5, s * 0.6, 4], 0.5, M.gloss('#2a1a0a'), { cone: 0.1 });
  g.userData.wings = [];
  for (const s of [-1, 1]) { const w = membraneWing(M, g, [3, s * 2.5, 9.4], 16, 4.6, 'bee', s, { opacity: 0.4, color: p.wing }); w.base = 2.6; g.userData.wings.push(w); }
  return g;
}
function waspPose(root, o, t) {
  const flap = Math.sin((SpriteCache.phase(t, 70, 3) + 0.5) / 3 * TAU) * 0.3;
  for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.5, 0.1, w.s * (w.base - flap));
  root.userData.legs.pose(Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU));
}
Models.define('wasp', {
  // Spider wasp (Pompilidae): black with orange wings and antennae, long legs.
  buckets: 16,
  key(o, t) { return 'w' + SpriteCache.phase(t, 70, 3) + 'm' + SpriteCache.phase(t, 18, 8); },
  build(M) {
    const abd = M.paint('spiderWaspAbd', 128, 64, (ctx, w, h) => { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, w, h); for (let k = 1; k < 6; k++) { ctx.fillStyle = 'rgba(110,110,110,.5)'; ctx.fillRect(0, h * k / 6 - 1, w, 1.5); } });
    return waspModel(M, {}, { abd, leg: '#d2691e', dark: '#1a1a1a', thorax: '#1a1a1a', body: '#1a1a1a', eye: '#3a3a3a', wing: '#f0a040' });
  },
  pose: waspPose,
});
Models.define('paperWasp', {
  // Paper wasp (Polistes): yellow-brown with dark bands, dark thorax with two yellow spots, amber wings.
  buckets: 16,
  key(o, t) { return 'w' + SpriteCache.phase(t, 70, 3) + 'm' + SpriteCache.phase(t, 18, 8); },
  build(M) {
    const abd = M.paint('paperWaspAbd', 128, 64, (ctx, w, h) => { ctx.fillStyle = '#c8901e'; ctx.fillRect(0, 0, w, h); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3a2a12'; ctx.fillRect(0, h * (0.22 + k * 0.25), w, h * 0.09); } });
    return waspModel(M, {}, { abd, leg: '#c8901e', dark: '#2a1a0a', thorax: '#3a2a12', body: '#c8901e', eye: '#2a1a0a', wing: '#e8d0a0', thoraxSpots: true });
  },
  pose: waspPose,
});

Models.define('dungBeetle', {
  // Dung beetle: shiny black, a domed pronotum, striated wing cases, broad toothed front legs for digging.
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 10, 8) : 'x'); },
  build(M) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 1, wide: 2.4, z: 3.5, mat: M.chitin('#1a1a1a'), w: 1.4, L: 11, pitch: 0.45, spines: 3, lift: 1.6 });
    for (const s of [-1, 1]) { M.seg(g, [8, s * 4, 3], [13, s * 9, 1], 1.3, M.chitin('#1a1a1a'), { full: true }); for (let k = 0; k < 3; k++) M.seg(g, [10 + k * 1.2, s * (5.5 + k * 1.3), 1.8], [11.5 + k * 1.2, s * (6.5 + k * 1.3), 0.6], 0.5, M.chitin('#1a1a1a'), { cone: 0.1 }); }
    const elytra = M.paint('dungElytra', 128, 128, (ctx, w, h) => { ctx.fillStyle = '#1d1b17'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#3a362e'; ctx.fillRect(w / 2 - 1, 0, 2, h); for (let k = 1; k < 5; k++) { ctx.fillStyle = 'rgba(70,65,55,.5)'; ctx.fillRect(w / 2 + k * w * 0.09, 0, 1, h); ctx.fillRect(w / 2 - k * w * 0.09, 0, 1, h); } });
    M.banded(g, 9, 7.5, 5.2, M.chitin('#ffffff', { map: elytra, coat: 0.9, rough: 0.3 }), [-4, 0, 4]);
    M.ellipsoid(g, 5, 6, 4.4, M.chitin('#24221d', { coat: 0.9, rough: 0.3 }), [6, 0, 4.2]);
    M.ellipsoid(g, 3, 5, 2, M.chitin('#2a2822'), [11, 0, 2.6]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1, 0.8, 0.7, M.eye({ color: '#3a3a3a' }), [11, s * 1.5, 3.8]);
    for (const s of [-1, 1]) M.antenna(g, [13, s * 2.5, 2.4], s * 0.9, 2, s * 0.6, 2, 3, M.chitin('#2a2822'), 0.8, { rise: 0.3 });
    return g;
  },
  pose(root, o, t) { root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 10, 8) + 0.5) / 8 * TAU) : 0); },
});

Models.define('resinBee', {
  // Resin bee (Megachile): black with white hair bands on the abdomen, a big square head and jaws.
  key(o, t) { return 'w' + SpriteCache.phase(t, 60, 3) + (o.moving ? 'm' + SpriteCache.phase(t, 18, 8) : 'x'); },
  build(M) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 1, wide: 1.4, len: 0.5, z: 3, mat: M.chitin('#2a2420'), w: 0.8, L: 8, pitch: 0.55, lift: 1.2 });
    const abd = M.paint('resinBeeAbd', 128, 64, (ctx, w, h) => { ctx.fillStyle = '#1c1a18'; ctx.fillRect(0, 0, w, h); for (let k = 1; k < 5; k++) { ctx.fillStyle = 'rgba(245,240,225,.85)'; ctx.fillRect(0, h * k / 5 - 1.5, w, 2); } });
    M.banded(g, 5, 3.4, 3, M.chitin('#ffffff', { map: abd, coat: 0.5 }), [-3.5, 0, 3.2]);
    M.ellipsoid(g, 3.5, 0.9, 0.6, M.hair('#e6be46'), [-4, 2.4, 1.4]);   // pollen on the belly hairs
    M.ellipsoid(g, 3.2, 3, 2.8, M.fur('#2a2622'), [1.5, 0, 3.4]);
    M.pile(g, [1.5, 0, 3.4], 3.3, 3.1, 2.9, 40, 1, '#8a8070', 39, { lean: 0.3, thick: 0.09 });
    M.ellipsoid(g, 2.6, 2.9, 2.6, M.chitin('#1c1a18'), [5.3, 0, 3.2]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 0.9, 0.9, 1.6, M.eye({ color: '#3a3230' }), [5.2, s * 2.2, 3.6]); M.antenna(g, [6.8, s * 0.8, 3.4], s * 0.7, 2.5, s * 1.2, 2.5, 4, M.chitin('#1a1818'), 0.5, { rise: 0.3 }); }
    for (const s of [-1, 1]) M.seg(g, [7.6, s * 1, 2.6], [8.6, s * 0.3, 2.5], 0.45, M.gloss('#1a1818'), { cone: 0.1 });
    g.userData.wings = [];
    for (const s of [-1, 1]) { const w = membraneWing(M, g, [0, s * 1.2, 6.4], 9, 3, 'bee', s, { opacity: 0.32, color: '#d8d0c0' }); w.base = 2.5; g.userData.wings.push(w); }
    return g;
  },
  pose(root, o, t) {
    const flap = Math.sin((SpriteCache.phase(t, 60, 3) + 0.5) / 3 * TAU) * 0.4;
    for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.5, 0.1, w.s * (w.base - flap));
    root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU) : 0);
  },
});

Models.define('ladybird', {
  // Transverse ladybird: glossy orange-red dome with black bands, a black pronotum with two white spots.
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 10, 8) : 'x'); },
  build(M) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 0, wide: 1.3, len: 0.55, z: 2.4, mat: M.chitin('#111111'), w: 0.7, L: 6, pitch: 0.5, lift: 1 });
    const dome = M.paint('ladybirdDome', 256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#e03a1a'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#111';
      ctx.fillRect(0, h * 0.48, w, h * 0.04);   // the seam between the wing cases
      // the transverse bands: a bar across the shoulders, two curved bands behind it, a spot each side at the back
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(w * 0.6, h * (0.5 + s * 0.05)); ctx.quadraticCurveTo(w * 0.52, h * (0.5 + s * 0.3), w * 0.4, h * (0.5 + s * 0.38)); ctx.quadraticCurveTo(w * 0.36, h * (0.5 + s * 0.28), w * 0.42, h * (0.5 + s * 0.15)); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.ellipse(w * 0.22, h * (0.5 + s * 0.26), w * 0.05, h * 0.1, 0, 0, TAU); ctx.fill(); }
      ctx.fillRect(w * 0.7, h * 0.12, w * 0.06, h * 0.76);
    }, { clamp: true });
    M.banded(g, 6.2, 5.4, 3.6, M.chitin('#ffffff', { map: dome, coat: 1, rough: 0.2, bump: 0.1 }), [-1, 0, 2.6]);
    M.ellipsoid(g, 2, 3.8, 2, M.chitin('#111111', { coat: 1, rough: 0.2 }), [4.2, 0, 2.4]);
    for (const s of [-1, 1]) M.ellipsoid(g, 0.9, 0.8, 0.4, M.gloss('#f4f4f4'), [3.8, s * 2.4, 4.2]);
    M.ellipsoid(g, 1.3, 1.8, 1.3, M.chitin('#111111'), [6.4, 0, 1.6]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 0.5, 0.4, 0.3, M.gloss('#eeeeee'), [6.6, s * 1.1, 2.6]); M.seg(g, [7.2, s * 0.6, 1.6], [8.4, s * 1.6, 1.4], 0.25, M.chitin('#111111'), { full: true }); }
    return g;
  },
  pose(root, o, t) { root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 10, 8) + 0.5) / 8 * TAU) : 0); },
});

// The moth's forewing pattern, painted in wing coordinates: a gradient, two dark wavy bands, a pale kidney mark, a dark rim.
function mothWingPaint(ctx, pts, c0, c1) {
  const gr = ctx.createLinearGradient(2, 1, -14, 13); gr.addColorStop(0, c0); gr.addColorStop(1, c1); ctx.fillStyle = gr; ctx.fillRect(-16, -1, 20, 16);
  ctx.strokeStyle = 'rgba(70,50,30,.7)'; ctx.lineWidth = 0.6; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(-3, 2.5); ctx.quadraticCurveTo(-6, 5, -9, 9.5); ctx.moveTo(-6, 1.8); ctx.quadraticCurveTo(-9, 4, -12.5, 8); ctx.stroke();
  ctx.fillStyle = 'rgba(240,230,210,.75)'; ctx.beginPath(); ctx.ellipse(-6.5, 4.5, 1.4, 0.9, -0.7, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 0.5; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
}
// A little white letter floating over a stunned bug (the 2D drawing's "z").
function zLabel(M, parent, at) {
  const tex = M.paint('zLabel', 32, 32, (ctx, w, h) => { ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('z', w / 2, h / 2); }, { clamp: true });
  const m = new THREE.Mesh(M.geo('plane|6', () => new THREE.PlaneGeometry(6, 6)), M.mat('zLabelMat', () => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })));
  m.position.set(at[0], at[1], at[2]); m.scale.y = -1; parent.add(m); return m;
}

Models.define('moth', {
  // A brown noctuid moth: scalloped forewings with dark wavy bands and a pale kidney mark, a furry thorax,
  // feathery antennae. Flutters in the web until it sticks.
  key(o, t) { return o.stuck ? 'S' : 'f' + SpriteCache.phase(t, 20, 4); },
  build(M) {
    const g = new THREE.Group(), T = THREE;
    const pts = [[2, 1], [0, 3], [-3, 6], [-8, 10], [-14, 13], [-12, 9], [-13, 6], [-11, 3.5], [-8, 2], [-4, 1]];
    const key = 'mothWing', tex = patternTexture(M, key, pts, (ctx) => mothWingPaint(ctx, pts, '#b8a07a', '#8a7050'));
    g.userData.wings = [];
    for (const s of [-1, 1]) {
      const w = paintedWing(M, g, [1, s * 0.8, 3.2], pts, tex, s, { key });
      M.ellipsoid(w.hinge, 4.5, 3, 0.6, M.fur('#9a8464'), [-6, s * 10, -0.3], s * 0.3);   // the hindwing, tucked under
      g.userData.wings.push(w);
    }
    M.ellipsoid(g, 7, 2.8, 2.4, M.fur('#6a5440'), [-2, 0, 2.6]);
    M.pile(g, [0, 0, 2.6], 4, 2.6, 2.4, 60, 1.3, '#8a7458', 40, { lean: 0.5, thick: 0.12 });
    M.ellipsoid(g, 2, 2, 1.8, M.fur('#5a4636'), [5, 0, 2.6]);
    for (const s of [-1, 1]) {
      M.ellipsoid(g, 1, 1, 1, M.eye({ color: '#1a1008' }), [5, s * 1.6, 3.2]);
      M.seg(g, [5, s * 0.8, 3.4], [11, s * 5.5, 3.6], 0.3, M.chitin('#4a3a28'), { full: true });
      for (let k = 1; k < 7; k++) M.seg(g, [5 + k, s * (0.8 + k * 0.78), 3.5], [5 + k - 0.6, s * (0.8 + k * 0.78) + s * 1.3, 3.5], 0.14, M.hair('#5a4a30'), { full: true });
    }
    return g;
  },
  pose(root, o, t) {
    const f = o.stuck ? 0.2 : Math.sin((SpriteCache.phase(t, 20, 4) + 0.5) / 4 * TAU) * 0.3;
    for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * Math.abs(f) * 0.6, 0, w.s * f);
  },
});

Models.define('beetle', {
  // Christmas beetle: metallic golden brown with striated wing cases, a heavy flier that opens them to fly.
  key(o, t) { return (o.stuck ? 'S' : 'f' + SpriteCache.phase(t, 40, 3)) + (o.moving ? 'm' + SpriteCache.phase(t, 12, 8) : 'x'); },
  build(M) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 2, wide: 1.6, len: 0.8, z: 4, mat: M.chitin('#6a4a18'), w: 1.1, L: 12, pitch: 0.5, spines: 2, lift: 1.6 });
    const gold = M.mat('xmasBeetle', () => new THREE.MeshPhysicalMaterial({ color: '#c8902a', metalness: 0.75, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1.3, bumpMap: M.height('grain', 3), bumpScale: 0.2 }));
    for (const s of [-1, 1]) { M.ellipsoid(g, 10.5, 4.1, 3.8, gold, [-3, s * 4.2, 3.6], s * 0.04); for (let k = 1; k < 4; k++) M.seg(g, [-12, s * k * 1.9, 3.6 + 3.6 * Math.sqrt(Math.max(0, 1 - (k * 1.9 - 4.2) ** 2 / 17))], [6, s * k * 1.6, 3.6 + 3.6 * Math.sqrt(Math.max(0, 1 - (k * 1.6 - 4.2) ** 2 / 17))], 0.22, M.gloss('#5a3a10'), { full: true }); }
    M.ellipsoid(g, 4, 4.6, 3.8, M.chitin('#b07a22', { coat: 0.9, rough: 0.3 }), [6.5, 0, 3.6]);
    M.ellipsoid(g, 2.8, 3, 2.4, M.chitin('#9a6a1c', { coat: 0.9 }), [10.5, 0, 3]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 1.2, 1.3, 1.2, M.eye({ color: '#2a1a0a' }), [11, s * 2.6, 3.8]); M.seg(g, [12.5, s * 1, 2.6], [15, s * 2.4, 2.8], 0.4, M.chitin('#5a3a10'), { full: true }); for (let k = 0; k < 3; k++) M.ellipsoid(g, 1.1, 0.35, 0.35, M.chitin('#5a3a10'), [15.5 + k * 0.3, s * (2.6 + k * 0.5), 2.8], s * 0.4); }
    g.userData.wings = [];
    for (const s of [-1, 1]) { const w = membraneWing(M, g, [2, s * 3, 7.6], 14, 4, 'bee', s, { opacity: 0.3, color: '#e8dcc8' }); w.base = 2.3; g.userData.wings.push(w); }
    return g;
  },
  pose(root, o, t) {
    const f = o.stuck ? 0 : Math.sin((SpriteCache.phase(t, 40, 3) + 0.5) / 3 * TAU) * 0.4;
    for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * f * 0.5, 0.1, w.s * (w.base - f));
    root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 12, 8) + 0.5) / 8 * TAU) : 0);
  },
});

Models.define('worm', {
  // Earthworm: pink-brown rings, a paler saddle a third of the way along, wriggling.
  key(o, t) { return 'w' + SpriteCache.phase(t, 4, 6); },
  build(M) {
    const g = new THREE.Group(); g.userData.segs = [];
    for (let k = 0; k < 9; k++) { const m = M.ellipsoid(g, 2, 1.8, 1.6, M.skin(k === 2 ? '#d88a8a' : k % 2 ? '#c87a70' : '#b86e64', { rough: 0.35 }), [-k * 2.4, 0, 1.6]); g.userData.segs.push({ m, k }); }
    return g;
  },
  pose(root, o, t) { const ph = (SpriteCache.phase(t, 4, 6) + 0.5) / 6 * TAU; for (const { m, k } of root.userData.segs) m.position.y = Math.sin(ph + k * 0.8) * 1.5; },
});

Models.define('termite', {
  // Termite seen by the ant: creamy, soft, an orange head; the player's termite model in miniature.
  key(o, t) { return 'm' + SpriteCache.phase(t, 18, 8); },
  build(M) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 0, wide: 1.4, len: 0.55, z: 2.4, mat: M.matte('#c9b48a'), w: 0.7, L: 6.5, pitch: 0.5, lift: 1 });
    M.ellipsoid(g, 5, 3.3, 2.6, M.matte('#f1e6c8', { rough: 0.5 }), [-6, 0, 2.6]);
    for (let k = 1; k < 5; k++) M.ellipsoid(g, 0.2, 3.1, 2.4, M.matte('#d8c8a0'), [-10 + k * 2, 0, 2.6]);
    M.ellipsoid(g, 2.5, 2.4, 2.1, M.matte('#ead9b0'), [0, 0, 2.3]);
    M.ellipsoid(g, 3, 2.6, 2.2, M.chitin('#a8742e', { coat: 0.3, rough: 0.5 }), [4.5, 0, 2.3]);
    for (const s of [-1, 1]) M.antenna(g, [7, s * 1.2, 2.6], s * 0.7, 1.5, s * 0.7, 4, 6, M.matte('#c8a878'), 0.5, { rise: 0.2, droop: -0.05 });
    return g;
  },
  pose(root, o, t) { root.userData.legs.pose(Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU)); },
});

Models.define('smallAnt', {
  // Small black ant, a danger to spiderlings.
  key(o, t) { return 'm' + SpriteCache.phase(t, 18, 8); },
  build(M) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 1, wide: 1.8, len: 0.7, z: 3.4, mat: M.chitin('#1b1b1b'), w: 0.9, L: 12, pitch: 0.55, lift: 1.6 });
    M.ellipsoid(g, 5.5, 4.5, 3.6, M.chitin('#262626', { coat: 0.8 }), [-8, 0, 3.6]);
    for (let k = 1; k < 4; k++) M.ellipsoid(g, 0.25, 4.2, 3.3, M.chitin('#5a5a5a'), [-12 + k * 2.6, 0, 3.6]);
    M.ellipsoid(g, 1.5, 1.3, 1.2, M.chitin('#262626'), [-2.5, 0, 3.4]);
    M.ellipsoid(g, 4, 2.6, 2.6, M.chitin('#333333'), [2, 0, 3.6]);
    M.ellipsoid(g, 3.8, 3.6, 3, M.chitin('#262626'), [8, 0, 3.4]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 0.9, 0.7, 0.7, M.eye(), [8.6, s * 2.6, 4.6]); M.antenna(g, [10, s * 1.6, 3.8], s * 1.0, 4, s * 0.2, 7, 8, M.chitin('#1b1b1b'), 0.7, { rise: 0.35 }); }
    for (const s of [-1, 1]) M.seg(g, [11.2, s * 1.4, 2.8], [13.2, s * 0.5, 2.6], 0.5, M.gloss('#1a1008'), { cone: 0.1 });
    return g;
  },
  pose(root, o, t) { root.userData.legs.pose(Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU)); },
});

Models.define('springtail', {
  // Springtail: a tiny mauve hexapod with a forked spring folded under the body; it shows when it hops.
  variant(o) { return o.hop > 0 ? 'H' : ''; },
  key(o, t) { return (o.hop > 0 ? 'H' : '') + 'm' + SpriteCache.phase(t, 14, 4); },
  build(M, o) {
    const g = new THREE.Group(), mauve = M.matte('#8a7fa3', { rough: 0.5 }), dark = M.matte('#6d6480', { rough: 0.5 });
    g.userData.legs = M.legs6(g, { cx: 0, wide: 0.9, len: 0.6, z: 1.6, mat: dark, w: 0.5, L: 4.5, pitch: 0.5, lift: 0.6 });
    M.ellipsoid(g, 6, 2.6, 2.2, mauve, [-2, 0, 2.1]);
    for (let k = 1; k < 5; k++) M.ellipsoid(g, 0.18, 2.4, 2, M.matte('#4a405c'), [-6.5 + k * 2, 0, 2.1]);
    M.pile(g, [-2, 0, 2.1], 6, 2.6, 2.2, 40, 0.8, '#b0a8c8', 44, { lean: 0.4, thick: 0.07 });
    M.ellipsoid(g, 2.6, 2.4, 2, dark, [4.5, 0, 2]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 0.5, 0.5, 0.5, M.eye(), [5.5, s * 1.4, 3]); M.antenna(g, [6, s * 1, 2.2], s * 0.9, 2, s * 0.6, 3, 4, dark, 0.45, { rise: 0.3 }); }
    if (o.hop > 0) { M.seg(g, [-8, 0, 1], [-13, -2, 0.6], 0.4, dark, { full: true }); M.seg(g, [-8, 0, 1], [-13, 2, 0.6], 0.4, dark, { full: true }); }
    return g;
  },
  pose(root, o, t) { root.userData.legs.pose(Math.sin((SpriteCache.phase(t, 14, 4) + 0.5) / 4 * TAU)); },
});

Models.define('caterpillar', {
  // Green looper caterpillar: plump segments, a pale side line, true legs at the front, prolegs behind.
  variant(o) { return o.stunned ? 'Z' : ''; },
  key(o, t) { return o.stunned ? 'Z' : 'w' + SpriteCache.phase(t, 6, 6); },
  build(M, o) {
    const g = new THREE.Group(); g.userData.segs = [];
    for (let k = 5; k >= 0; k--) {
      const seg = new THREE.Group(); seg.position.set(-k * 4.5, 0, 3.6); g.add(seg); g.userData.segs.push({ seg, k });
      M.ellipsoid(seg, 3.9, 3.9, 3.6, M.matte(k % 2 ? '#6fae3c' : '#7fc24a', { rough: 0.55 }), [0, 0, 0]);
      M.ellipsoid(seg, 2.2, 0.6, 0.5, M.matte('#eef8d0'), [0, 2.6, 2.4]); M.ellipsoid(seg, 2.2, 0.6, 0.5, M.matte('#eef8d0'), [0, -2.6, 2.4]);
      if (k > 1 && k < 5) for (const s of [-1, 1]) M.ellipsoid(seg, 1.1, 0.8, 1.2, M.matte('#4d7a2a'), [0, s * 3.6, -2.6]);
      if (k === 0 || k === 1) for (const s of [-1, 1]) M.seg(seg, [0, s * 2.5, -1.5], [1, s * 5, -3.4], 0.4, M.chitin('#2a4a18'), { cone: 0.1 });
    }
    M.ellipsoid(g, 3.6, 3.6, 3.4, M.chitin('#4d7a2a', { coat: 0.3 }), [3, 0, 3.4]);
    for (const s of [-1, 1]) M.ellipsoid(g, 0.6, 0.6, 0.5, M.gloss('#1a2a10'), [4.5, s * 1.4, 5.4]);
    if (o.stunned) zLabel(M, g, [-6, -8, 6]);
    return g;
  },
  pose(root, o, t) { const ph = (SpriteCache.phase(t, 6, 6) + 0.5) / 6 * TAU; for (const { seg, k } of root.userData.segs) seg.position.y = o.stunned ? 0 : Math.sin(k + ph) * 1.2; },
});

Models.define('fly', {
  // A small grey house-type fly the ant catches: red eyes, striped thorax, clear wings held back.
  variant(o) { return o.state === 'flee' ? 'F' : ''; },
  key(o, t) { return o.state === 'flee' ? 'F' + SpriteCache.phase(t, 80, 3) : 'x'; },
  build(M) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 0, wide: 1.3, len: 0.5, z: 2.6, mat: M.chitin('#333333'), w: 0.7, L: 6, pitch: 0.55, lift: 1 });
    const abd = M.paint('flyAbd', 128, 64, (ctx, w, h) => { ctx.fillStyle = '#5a5a52'; ctx.fillRect(0, 0, w, h); for (let k = 1; k < 4; k++) { ctx.fillStyle = 'rgba(30,30,30,.5)'; ctx.fillRect(0, h * k / 4 - 1, w, 1.5); } });
    M.banded(g, 4, 2.8, 2.4, M.chitin('#ffffff', { map: abd, coat: 0.4 }), [-4, 0, 2.6]);
    const th = M.paint('flyThorax', 64, 64, (ctx, w, h) => { ctx.fillStyle = '#4a4a44'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#222'; ctx.fillRect(0, h * 0.3, w, h * 0.08); ctx.fillRect(0, h * 0.62, w, h * 0.08); });
    M.ellipsoid(g, 2.8, 2.6, 2.4, M.chitin('#ffffff', { map: th, coat: 0.4 }), [1, 0, 2.8]);
    M.ellipsoid(g, 1.6, 2, 1.8, M.chitin('#4a4a44'), [4, 0, 2.8]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1.4, 1.3, 1.5, M.eye({ color: '#a0302a' }), [4.2, s * 1.6, 3.2]);
    g.userData.wings = [];
    for (const s of [-1, 1]) { const w = membraneWing(M, g, [0, s * 1.2, 5.4], 7, 2.4, 'fly', s, { opacity: 0.35 }); w.base = 2.5; g.userData.wings.push(w); }
    return g;
  },
  pose(root, o, t) { const flap = o.state === 'flee' ? Math.sin((SpriteCache.phase(t, 80, 3) + 0.5) / 3 * TAU) * 0.5 : 0; for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.5, 0.1, w.s * (w.base - flap)); },
});

Models.define('damselfly', {
  // Blue damselfly at rest: a needle body in blue and black rings, four clear wings folded together over the back.
  build(M) {
    const g = new THREE.Group();
    for (let k = 0; k < 9; k++) M.ellipsoid(g, 1.6, 1.2, 1.2, M.chitin(k % 2 ? '#2a6fb0' : '#58a8e0', { coat: 0.8 }), [-4 - k * 3, 0, 2.6]);
    M.ellipsoid(g, 3, 2, 2, M.chitin('#2a6fb0', { coat: 0.8 }), [1, 0, 2.6]);
    M.ellipsoid(g, 2, 1.8, 1.6, M.chitin('#1a3f6a'), [4, 0, 2.6]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1.4, 1.5, 1.4, M.eye({ color: '#1a3f6a' }), [4.2, s * 2.2, 3]);
    for (const s of [-1, 1]) { const w = membraneWing(M, g, [-2, s * 0.3, 4.6], 20, 2.2, 'dragonfly', s, { opacity: 0.28, color: '#e8f4ff' }); w.hinge.rotation.set(s * 1.2, 0, s * 3.05); }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) M.seg(g, [2 - i * 1.5, s * 1, 1.8], [2 - i * 1.5 + 1, s * 4, 0.2], 0.3, M.chitin('#1a3f6a'), { full: true });
    return g;
  },
});

Models.define('lerpBug', {
  // A psyllid under its lerp: a tiny olive bug beneath a sugary white cone.
  build(M) {
    const g = new THREE.Group();
    M.ellipsoid(g, 3.4, 2.4, 1.6, M.chitin('#7a8a3a'), [0, 0, 1.4]);
    const lerp = M.mat('lerpSugar', () => new THREE.MeshPhysicalMaterial({ color: '#fff6e0', transparent: true, opacity: 0.8, roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.4, envMapIntensity: 0.6 }));
    M.ellipsoid(g, 2.4, 2.2, 1.8, lerp, [-1.5, 0, 1.8]);
    return g;
  },
});

Models.define('wriggler', {
  // Mosquito larva: a round head, a fat thorax, a thin segmented body ending in a breathing siphon.
  key(o, t) { return 'w' + SpriteCache.phase(t, 14, 6); },
  build(M) {
    const g = new THREE.Group(), dark = M.matte('#3b3b2c', { rough: 0.5 }), mid = M.matte('#5b5b44', { rough: 0.5 });
    M.ellipsoid(g, 2.6, 2.6, 2.4, dark, [6, 0, 2.4]);
    M.ellipsoid(g, 3.4, 3.4, 3, mid, [2, 0, 2.6]);
    g.userData.segs = [];
    for (let k = 0; k < 6; k++) { const m = M.ellipsoid(g, 1.5, 1.3, 1.2, k % 2 ? mid : dark, [-1 - k * 2.2, 0, 2], 0); g.userData.segs.push({ m, k }); }
    const tube = M.seg(g, [-13, 0, 2], [-17, -2, 1.6], 0.6, dark, { cone: 0.4 }); g.userData.tube = tube;
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) M.seg(g, [1 + k * 1.5, s * 2.5, 2.2], [1 + k * 1.5, s * 4.5, 1.8], 0.15, M.hair('#8a8a70'), { full: true });
    return g;
  },
  pose(root, o, t) { const ph = (SpriteCache.phase(t, 14, 6) + 0.5) / 6 * TAU; for (const { m, k } of root.userData.segs) m.position.y = Math.sin(ph) * 3 * Math.sin((k + 1) / 7 * Math.PI); root.userData.tube.position.y = Math.sin(ph) * 1.5 - 1; },
});

Models.define('tadpole', {
  // Tadpole: a dark round body, gold-flecked eyes, a finned tail that beats side to side.
  key(o, t) { return 'w' + SpriteCache.phase(t, 10, 6); },
  build(M) {
    const g = new THREE.Group(), T = THREE;
    M.ellipsoid(g, 7, 6, 4.2, M.skin('#3a3428', { rough: 0.3 }), [0, 0, 3.6]);
    M.ellipsoid(g, 4, 4, 1.6, M.skin('#5a5040', { rough: 0.3 }), [-1, 0, 7.2]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1.2, 1.2, 1, M.eye({ color: '#c8b878' }), [4, s * 3, 6.4]);
    const tail = new T.Group(); tail.position.set(-5, 0, 3.6); g.add(tail); g.userData.tail = tail;
    const fin = M.mat('tadFin', () => new T.MeshPhysicalMaterial({ color: '#6a6050', transparent: true, opacity: 0.6, roughness: 0.4, side: T.DoubleSide, sheen: 0.4 }));
    const finGeo = M.geo('tadFin', () => M.shape([[0, 0], [-6, 3.5], [-12, 4], [-18, 2.2], [-19, 0], [-18, -2.2], [-12, -4], [-6, -3.5]]));
    const fm = new T.Mesh(finGeo, fin); fm.rotation.x = Math.PI / 2; fm.castShadow = true; tail.add(fm);
    M.seg(tail, [1, 0, 0], [-18, 0, 0], 1.4, M.skin('#4e4636', { rough: 0.3 }), { cone: 0.3 });
    return g;
  },
  pose(root, o, t) { root.userData.tail.rotation.z = Math.sin((SpriteCache.phase(t, 10, 6) + 0.5) / 6 * TAU) * 0.35; },
});

Models.define('deadBeetle', {
  // A dead beetle on its back, legs curled up in the air.
  build(M) {
    const g = new THREE.Group(), leg = M.chitin('#3a2a1a');
    M.ellipsoid(g, 9, 6.5, 3.4, M.chitin('#6a4a2a', { coat: 0.4, rough: 0.6 }), [-2, 0, 3.2]);
    M.ellipsoid(g, 7.5, 5, 1.2, M.matte('#8a6a48'), [-2, 0, 5.6]);   // the pale underside, uppermost
    for (let k = -2; k <= 2; k++) M.ellipsoid(g, 0.3, 4.6, 0.6, M.matte('#5a4030'), [-2 + k * 2.6, 0, 6.2]);
    M.ellipsoid(g, 4, 4, 2.8, M.chitin('#4a3420'), [8, 0, 2.6]);
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const x = -2 + i * 4; M.seg(g, [x, s * 3, 5], [x - 1, s * 7, 8], 0.6, leg, { full: true }); M.seg(g, [x - 1, s * 7, 8], [x + 2, s * 6, 10], 0.45, leg, { full: true }); M.seg(g, [x + 2, s * 6, 10], [x + 3.5, s * 4.5, 9.4], 0.3, leg, { cone: 0.08 }); }
    return g;
  },
});
Models.define('deadMoth', {
  // A dead moth lying flat, wings spread.
  build(M) {
    const g = new THREE.Group();
    const pts = [[2, 1], [0, 3], [-3, 6], [-8, 10], [-14, 13], [-12, 9], [-13, 6], [-11, 3.5], [-8, 2], [-4, 1]];
    const tex = patternTexture(M, 'deadMothWing', pts, (ctx) => mothWingPaint(ctx, pts, '#c0ac86', '#8f7a52'));
    for (const s of [-1, 1]) { const w = paintedWing(M, g, [1, s * 0.8, 1.2], pts, tex, s, { key: 'deadMothWing' }); w.hinge.rotation.set(0, 0, s * 0.35); M.ellipsoid(w.hinge, 4.5, 3, 0.5, M.fur('#9a8464'), [-6, s * 10, -0.2], s * 0.3); }
    M.ellipsoid(g, 7, 2.6, 1.8, M.fur('#7a6644'), [0, 0, 1.6]);
    for (const s of [-1, 1]) M.seg(g, [6, s * 1, 1.8], [11, s * 5, 1.4], 0.3, M.chitin('#5a4a30'), { full: true });
    return g;
  },
});

Models.define('gilgie', {
  // Gilgie, a small freshwater crayfish: brown carapace, pincers held forward, long antennae, a fan tail.
  key(o, t) { return 'w' + SpriteCache.phase(t, 1.5, 2); },
  build(M) {
    const g = new THREE.Group(), sh = M.chitin('#6a5238', { coat: 0.5, rough: 0.45 }), dk = M.chitin('#5a4630', { coat: 0.5 });
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { M.seg(g, [-2 + i * 3, s * 3, 2.4], [-1 + i * 3, s * 6, 1.4], 0.55, dk, { full: true }); M.seg(g, [-1 + i * 3, s * 6, 1.4], [-0.5 + i * 3, s * 8.5, 0.3], 0.4, dk, { cone: 0.08 }); }
    for (const s of [-1, 1]) { M.seg(g, [6, s * 3, 2.4], [12, s * 7, 2.2], 1.1, dk, { full: true }); M.ellipsoid(g, 4.2, 2.5, 1.8, sh, [15, s * 8, 2.2], s * 0.4); M.seg(g, [17.5, s * 9.5, 2.4], [20.5, s * 7.5, 2.2], 0.6, dk, { cone: 0.1 }); M.seg(g, [18, s * 7, 2.4], [20.5, s * 7.2, 2.2], 0.5, dk, { cone: 0.1 }); }
    M.ellipsoid(g, 8, 5, 3.6, sh, [2, 0, 3.4]);
    M.ellipsoid(g, 7, 0.4, 0.5, M.matte('#3a2a18'), [2, 0, 6.8]);
    M.seg(g, [9, 0, 3.6], [12.5, 0, 3.2], 0.5, M.gloss('#4a3620'), { cone: 0.05 });   // rostrum
    for (let k = 0; k < 5; k++) M.ellipsoid(g, 3.4 - k * 0.3, 3.6 - k * 0.3, 2.4 - k * 0.2, k % 2 ? dk : sh, [-8 - k * 3.2, 0, 2.6 - k * 0.1]);
    const fan = new THREE.Group(); fan.position.set(-23, 0, 1.8); g.add(fan); g.userData.fan = fan;
    M.ellipsoid(fan, 3, 5, 0.8, dk, [-2, 0, 0]); for (const s of [-1, 1]) M.ellipsoid(fan, 2.4, 1.8, 0.6, dk, [-3, s * 3, 0.1], s * 0.5);
    for (const s of [-1, 1]) { M.ellipsoid(g, 0.9, 0.9, 0.9, M.eye(), [9, s * 2.2, 5]); M.seg(g, [10, s * 1, 3.6], [24, s * 5, 3], 0.25, dk, { full: true }); M.seg(g, [10, s * 1.6, 3.4], [16, s * 4, 3], 0.2, dk, { full: true }); }
    return g;
  },
  pose(root, o, t) { root.userData.fan.rotation.z = Math.sin((SpriteCache.phase(t, 1.5, 2) + 0.5) / 2 * TAU) * 0.1; },
});

Models.define('divingBeetle', {
  // Diving beetle: a smooth olive-black oval with a yellow rim, oar-like hind legs fringed with hairs,
  // a silver air bubble held under the tail.
  key(o, t) { return 'w' + SpriteCache.phase(t, 8, 4); },
  build(M) {
    const g = new THREE.Group(), T = THREE;
    g.userData.oars = [];
    for (const s of [-1, 1]) {
      const oar = new T.Group(); oar.position.set(-2, s * 4, 2.4); g.add(oar); g.userData.oars.push({ oar, s });
      M.seg(oar, [0, 0, 0], [-10, s * 6, -0.6], 0.8, M.chitin('#2a2a1a'), { full: true });
      for (let k = 0; k < 6; k++) M.seg(oar, [-3 - k * 1.3, s * (1.8 + k * 0.8), -0.2], [-3.5 - k * 1.3, s * (3.6 + k * 0.8), -0.4], 0.12, M.hair('#5a5a40'), { full: true });
      M.seg(g, [2, s * 3.5, 2.4], [-3, s * 8, 1], 0.5, M.chitin('#2a2a1a'), { full: true });
      M.seg(g, [6, s * 3, 2.4], [10, s * 6.5, 1], 0.45, M.chitin('#2a2a1a'), { full: true });
    }
    const back = M.paint('divingBeetleBack', 128, 128, (ctx, w, h) => { ctx.fillStyle = '#2f3a1e'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1a2010'; ctx.fillRect(w / 2 - 1, 0, 2, h); ctx.strokeStyle = 'rgba(200,180,80,.7)'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, w - 4, h - 4); });
    M.banded(g, 9, 6.5, 3.6, M.chitin('#ffffff', { map: back, coat: 1, rough: 0.15, bump: 0.1 }), [-1, 0, 3]);
    M.ellipsoid(g, 3.5, 4.5, 2.6, M.chitin('#2a3418', { coat: 1, rough: 0.2 }), [8, 0, 2.8]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1, 1, 0.9, M.eye(), [9.5, s * 2.2, 4]);
    M.ellipsoid(g, 2.5, 2, 1.4, M.glass('#f0f8ff', { opacity: 0.75 }), [-10, 0, 2.4]);
    return g;
  },
  pose(root, o, t) { const k = Math.sin((SpriteCache.phase(t, 8, 4) + 0.5) / 4 * TAU) * 0.35; for (const { oar, s } of root.userData.oars) oar.rotation.z = s * k; },
});

// ---------------------------------------------------------------- the paddock
Models.define('cow', {
  // Friesian cow from above: black patches on white, a pink muzzle, a swinging tail with a dark tassel.
  buckets: 4,
  variant(o) { return 'z' + Math.round((o.size || 1) * 10); },
  key(o, t) { return 'z' + Math.round((o.size || 1) * 10) + 'm' + (o.moving ? SpriteCache.phase(t, 8, 6) : 'x') + 't' + SpriteCache.phase(t, 3, 4); },
  build(M, o) {
    const g = new THREE.Group(), T = THREE, s = Math.round((o.size || 1) * 10) / 10; g.scale.setScalar(s);
    const hide = M.paint('cowHide', 256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#f1ede4'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#262626';
      for (const [x, y, rx, ry, a] of [[-16, -10, 14, 10, 0.4], [14, 12, 12, 8, -0.3], [-30, 12, 8, 6, 0], [30, -8, 7, 5, 0.3], [-36, -8, 6, 5, 0.6]]) { ctx.beginPath(); ctx.ellipse(w / 2 + x * w / 100, h / 2 + y * h / 60, rx * w / 100, ry * h / 60, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(90,80,70,.35)'; ctx.fillRect(w * 0.08, h / 2 - 1.5, w * 0.84, 3);
    }, { clamp: true });
    M.ellipsoid(g, 46, 26, 22, M.fur('#ffffff', { map: hide, repeat: 6 }), [0, 0, 22]);
    g.userData.feet = [];
    for (const [x, y] of [[26, -22], [26, 22], [-30, -22], [-30, 22]]) { const f = new T.Group(); f.position.set(x, y, 0); g.add(f); M.seg(f, [0, 0, 20], [0, 0, 2], 4.2, M.fur('#2a2a2a'), { full: true }); M.ellipsoid(f, 6, 4.5, 2.4, M.gloss('#1a1a1a', { rough: 0.5 }), [0, 0, 2]); g.userData.feet.push({ f, x, y }); }
    const tail = new T.Group(); tail.position.set(-44, 0, 26); g.add(tail); g.userData.tail = tail;
    M.seg(tail, [0, 0, 0], [-16, 0, -6], 2.2, M.fur('#3a2a1e'), { cone: 1.4 });
    M.ellipsoid(tail, 3.6, 3.4, 3.4, M.fur('#1a1a1a'), [-18, 0, -7]);
    M.ellipsoid(g, 15, 12, 11, M.fur('#f1ede4'), [52, 0, 20]);
    M.ellipsoid(g, 8, 10, 8, M.fur('#2a2a2a'), [56, 0, 24]);
    M.ellipsoid(g, 6, 8, 5.5, M.skin('#e8b4a6', { rough: 0.35 }), [66, 0, 20]);
    for (const s2 of [-1, 1]) { M.ellipsoid(g, 1.4, 1, 0.8, M.gloss('#8a5a50'), [70, s2 * 2.5, 21.5]); M.ellipsoid(g, 6.5, 3.2, 1.6, M.fur('#2a2a2a'), [48, s2 * 14, 26], -s2 * 0.5); M.ellipsoid(g, 3.8, 1.5, 0.8, M.skin('#e8b4a6'), [48.5, s2 * 14, 27.2], -s2 * 0.5); M.ellipsoid(g, 1.6, 1.4, 1.4, M.eye({ color: '#3a2a1a' }), [58, s2 * 7, 25]); }
    return g;
  },
  pose(root, o, t) {
    const sw = Math.sin((SpriteCache.phase(t, 3, 4) + 0.5) / 4 * TAU) * 0.5;
    root.userData.tail.rotation.z = sw * 0.6;
    const step = o.moving ? Math.sin((SpriteCache.phase(t, 8, 6) + 0.5) / 6 * TAU) * 4 : 0;
    root.userData.feet.forEach((q, i) => { q.f.position.x = q.x + step * ((i === 0 || i === 3) ? 1 : -1); });
  },
});

Models.define('pat', {
  // Cow pat: a glossy dark brown mound with concentric ridges when fresh; paler, flatter and cracked when dry.
  // Shrinks as the beetles bury it. o.fresh 1 → 0, o.size 1 → 0, o.eggs, o.maggots.
  buckets: 1,
  variant(o) { return 'z' + Math.round((o.size || 1) * 10) + 'r' + Math.round((o.fresh || 0) * 4) + 'e' + (o.eggs ? 1 : 0) + (o.maggots ? 'G' : ''); },
  key(o, t) { return 'z' + Math.round((o.size || 1) * 10) + 'r' + Math.round((o.fresh || 0) * 4) + 'e' + (o.eggs ? 1 : 0) + 'g' + (o.maggots ? SpriteCache.phase(t, 6, 4) : 'x'); },
  build(M, o) {
    const g = new THREE.Group(), s = Math.round((o.size || 1) * 10) / 10, f = Math.round((o.fresh === undefined ? 1 : o.fresh) * 4) / 4;
    const c = (a, b) => Math.round(a + (b - a) * (1 - f)), hex = '#' + [c(74, 150), c(52, 128), c(30, 96)].map((v) => v.toString(16).padStart(2, '0')).join('');
    const mat = f > 0.5 ? M.mat('patWet|' + hex, () => M.phys({ color: hex, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.2, bumpMap: M.height(['soil', 'chitin'], 2), bumpScale: 1.2, envMapIntensity: 0.6 })) : M.soil(hex);
    // the mound: a lathe (radius, height) from the rim up to the top, a steep edge, a flat top with ridges, squashed to an oval
    const H = 6.5 * (0.6 + 0.4 * f), prof = [];
    for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI / 2, r = Math.max(0.05, 22 * Math.pow(Math.cos(a), 0.8)), z = H * Math.pow(Math.sin(a), 0.7) + (i > 3 && i < 15 && i % 4 === 2 ? 0.6 : 0); prof.push([r, z]); }
    const mound = new THREE.Mesh(M.geo('pat|' + f, () => M.lathe(prof, 32)), mat);
    mound.rotation.x = Math.PI / 2; mound.scale.set(s, s * 0.82, s); mound.castShadow = mound.receiveShadow = true; g.add(mound);
    if (f <= 0.5) for (const pts of [[-12, -3, -4, 2, 6, -4, 13, 1], [-6, -10, -2, -3, 3, 6], [2, 10, 8, 4]]) for (let i = 2; i < pts.length; i += 2) M.seg(g, [pts[i - 2] * s, pts[i - 1] * s, 5 * s], [pts[i] * s, pts[i + 1] * s, 5 * s], 0.45, M.matte('#2a1c10'), { full: true });
    if (o.eggs) for (let i = 0; i < 5; i++) M.ellipsoid(g, 1.6, 0.9, 0.8, M.matte('#fbf7ea', { rough: 0.4 }), [Math.cos(i * 2.4) * 9 * s, Math.sin(i * 2.4) * 7 * s, 5.5 * s], i);
    g.userData.maggots = [];
    if (o.maggots) for (let i = 0; i < 3; i++) { const m = M.ellipsoid(g, 3, 1.4, 1.2, M.matte('#f2ead0', { rough: 0.4 }), [Math.cos(i * 1.7) * 11 * s, Math.sin(i * 1.7) * 8 * s, 5.2 * s], i); g.userData.maggots.push({ m, i, x: Math.cos(i * 1.7) * 11 * s }); }
    return g;
  },
  pose(root, o, t) { if (!o.maggots) return; const ph = (SpriteCache.phase(t, 6, 4) + 0.5) / 4 * TAU; for (const { m, i, x } of root.userData.maggots) { const w = Math.sin(ph + i) * 2; m.position.x = x + w; m.rotation.z = i + w * 0.2; } },
});
