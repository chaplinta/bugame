'use strict';
// 3D models of the bugs you play (see js/render3d.js for the frame and the kit). Same sizes and
// positions as the 2D drawings in js/art-bugs2.js, so collisions and the camera fit as before.

// ---------------------------------------------------------------- shared helpers
// Outline of a membrane wing as 2D points along +x from the base (0,0); kind 'bee' | 'fly' | 'dragonfly'.
function wingOutline(len, wid, kind, side) {
  const s = side || 1, pts = [];
  const bez = (p0, c1, c2, p1, n) => { for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0], s * (u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1])]); } };
  if (kind === 'dragonfly') {
    bez([0, 0], [len * 0.15, -wid * 0.9], [len * 0.75, -wid * 1.05], [len, -wid * 0.25], 14);
    bez([len, -wid * 0.25], [len * 0.99, 0], [len * 0.96, wid * 0.3], [len * 0.9, wid * 0.4], 4);
    bez([len * 0.9, wid * 0.4], [len * 0.6, wid * 0.95], [len * 0.2, wid * 0.75], [0, 0], 12);
  } else {
    bez([0, 0], [len * 0.25, -wid * 1.05], [len * 0.85, -wid * 0.95], [len, -wid * 0.15], 14);
    bez([len, -wid * 0.15], [len * 0.9, wid * 0.7], [len * 0.35, wid * 0.8], [0, 0], 12);
  }
  return pts;
}
// The wing's veins painted as a texture (dark lines on white) in the wing's own coordinates.
function wingMap(M, len, wid, kind) {
  const key = 'wingmap|' + kind + '|' + len + '|' + wid;
  const xmin = 0, xmax = len, ymin = -wid * 1.05, ymax = wid * 0.8;
  return M.paint(key, 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.setTransform(w / (xmax - xmin), 0, 0, h / (ymax - ymin), -xmin * w / (xmax - xmin), -ymin * h / (ymax - ymin));
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5a5058'; ctx.lineWidth = 0.55;
    ctx.beginPath();
    if (kind === 'dragonfly') {
      for (const k of [0.12, 0.3, 0.48, 0.66]) { ctx.moveTo(len * 0.02, -wid * k * 0.6); ctx.quadraticCurveTo(len * 0.55, -wid * (k + 0.25), len * 0.98, -wid * (0.3 - k * 0.3)); }
      for (const k of [0.2, 0.45]) { ctx.moveTo(len * 0.05, wid * k * 0.4); ctx.quadraticCurveTo(len * 0.5, wid * (k + 0.25), len * 0.9, wid * 0.3); }
      ctx.stroke(); ctx.beginPath(); ctx.strokeStyle = '#8a8088'; ctx.lineWidth = 0.3;
      for (let i = 1; i < 26; i++) { const px = len * i / 26; ctx.moveTo(px, -wid * (0.95 - Math.abs(i - 13) * 0.01)); ctx.lineTo(px + 0.6, wid * 0.8 * (1 - Math.abs(i - 10) / 22)); }
      ctx.stroke();
      ctx.fillStyle = '#3a3030'; ctx.beginPath(); ctx.ellipse(len * 0.82, -wid * 0.72, len * 0.06, wid * 0.1, -0.25, 0, TAU); ctx.fill();
    } else {
      ctx.lineWidth = 0.7; ctx.moveTo(0, -wid * 0.1); ctx.quadraticCurveTo(len * 0.5, -wid * 1.0, len * 0.95, -wid * 0.35); ctx.stroke(); ctx.beginPath(); ctx.lineWidth = 0.5;
      ctx.moveTo(len * 0.05, 0); ctx.quadraticCurveTo(len * 0.45, -wid * 0.6, len * 0.92, -wid * 0.1);
      ctx.moveTo(len * 0.08, wid * 0.05); ctx.quadraticCurveTo(len * 0.5, -wid * 0.1, len * 0.85, wid * 0.25);
      ctx.moveTo(len * 0.1, wid * 0.1); ctx.quadraticCurveTo(len * 0.4, wid * 0.35, len * 0.7, wid * 0.5);
      ctx.moveTo(len * 0.35, -wid * 0.7); ctx.lineTo(len * 0.38, -wid * 0.35);
      ctx.moveTo(len * 0.6, -wid * 0.75); ctx.lineTo(len * 0.62, -wid * 0.3);
      ctx.moveTo(len * 0.45, -wid * 0.3); ctx.lineTo(len * 0.47, wid * 0.05);
      ctx.stroke();
      if (kind === 'fly') { ctx.fillStyle = '#6a6068'; ctx.beginPath(); ctx.ellipse(len * 0.5, -wid * 0.1, len * 0.02, wid * 0.06, 0, 0, TAU); ctx.fill(); }
    }
  }, { flipY: false, clamp: true });
}
// A membrane wing on a hinge at `at`: returns { hinge, mesh, s }. The wing lies flat, slightly tilted.
function membraneWing(M, parent, at, len, wid, kind, side, o) {
  o = o || {};
  const T = THREE, hinge = new T.Group(); hinge.position.set(at[0], at[1], at[2]); parent.add(hinge);
  const geo = M.geo('wing|' + kind + '|' + len + '|' + wid + '|' + side, () => M.shape(wingOutline(len, wid, kind, side), { uv: true }));
  const mat = M.wing({ map: wingMap(M, len, wid, kind), opacity: o.opacity === undefined ? 0.42 : o.opacity, color: o.color || '#ffffff' });
  const mesh = new T.Mesh(geo, mat);
  // the map was painted for the +1 side; mirror its v for the other wing
  if (side < 0) { const uv = geo.attributes.uv; if (!geo.userData.flipped) { for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); uv.needsUpdate = true; geo.userData.flipped = true; } }
  mesh.castShadow = true; mesh.receiveShadow = false;
  hinge.add(mesh);
  return { hinge, mesh, s: side };
}
// The 2D drawing of a sprite laid flat on the ground as a picture (used until a prop has its own model).
function flatSprite(M, parent, name, o, at, scale) {
  if (!Sprites[name]) return null;
  const key = 'flat|' + name + '|' + JSON.stringify(o || {}), S = 3, size = 192;
  const tex = M.paint(key, size, size, (ctx) => {
    ctx.setTransform(S, 0, 0, S, size / 2, size / 2);
    Shade.light = [-0.55, -0.83];
    try { Sprites[name](ctx, o || {}, 0); } finally { Shade.light = null; }
  }, { clamp: true });
  const geo = M.geo('plane|' + size / S, () => new THREE.PlaneGeometry(size / S, size / S));
  const mat = M.mat(key + '|mat', () => new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.1, roughness: 0.8, side: THREE.DoubleSide }));
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = false;
  m.position.set(at[0], at[1], at[2] === undefined ? 0.8 : at[2]);
  m.scale.set(scale || 1, -(scale || 1), 1);   // the picture's y runs down the screen, like the canvas it came from
  parent.add(m);
  return m;
}
// Mandible-like curved blade: a tapering tube through three points.
function blade(M, parent, pts, r0, r1, mat) {
  const m = new THREE.Mesh(M.tube(pts, r0, r1), mat);
  m.castShadow = m.receiveShadow = true; parent.add(m); return m;
}

// ---------------------------------------------------------------- the bugs
Models.define('ant', {
  // Bull ant worker, Myrmecia. Big head and eyes, long serrated jaws, a two-node waist, a black hairy gaster.
  buckets: 16,
  variant(o) { return (o.carry || '') + (o.stingT > 0 ? 'S' : ''); },
  key(o, t) { return (o.moving ? 'm' + SpriteCache.phase(t, 18, 8) : 'x') + (o.carry || '') + (o.stingT > 0 ? 'S' : ''); },
  build(M, o) {
    const g = new THREE.Group(), red = '#b8411e';
    g.userData.legs = M.legs6(g, { cx: 3, wide: 2.4, z: 5, mat: M.chitin('#7a2e14'), w: 1.5, L: 19, pitch: 0.55, lift: 2.4 });
    // gaster: four overlapping plates, golden hairs
    for (let i = 3; i >= 0; i--) M.ellipsoid(g, 7.6 - i * 0.9, 7.2 - i * 1.1, 5.8 - i * 0.7, M.chitin(i % 2 ? '#1c1512' : '#24201a', { coat: 0.8 }), [-11 - i * 2.6, 0, 5.6 - i * 0.4]);
    M.pile(g, [-13.5, 0, 5.6], 8.4, 6.6, 5.4, 140, 1.4, '#d8b060', 3, { lean: 0.7, thick: 0.14 });
    if (o.stingT > 0) M.seg(g, [-21, 0, 5], [-28, 0, 4.4], 0.7, M.gloss('#e8c040'), { cone: 0.05 });
    // waist: petiole and postpetiole
    M.ellipsoid(g, 2.2, 2.6, 2.4, M.chitin(red), [-3.2, 0, 5.2]);
    M.ellipsoid(g, 1.6, 2.1, 2.0, M.chitin(tint(red, -0.1)), [-0.6, 0, 5.2]);
    // mesosoma: three humps
    M.ellipsoid(g, 2.4, 3.1, 3.0, M.chitin(tint(red, -0.08)), [1.6, 0, 5.6]);
    M.ellipsoid(g, 3.2, 3.5, 3.4, M.chitin(red), [4.6, 0, 6.0]);
    M.ellipsoid(g, 3.4, 4.1, 3.8, M.chitin(tint(red, 0.05)), [8.2, 0, 6.2]);
    // head
    M.ellipsoid(g, 5.4, 5.8, 4.6, M.chitin('#c6482a'), [13.6, 0, 5.8]);
    M.ellipsoid(g, 3.6, 4.2, 3.6, M.chitin('#c6482a'), [15.5, 0, 5.4]);
    for (const s of [-1, 1]) M.ellipsoid(g, 2.3, 1.7, 1.9, M.eye(), [14.2, s * 4.9, 7.0], s * 0.35);
    for (const s of [-1, 1]) M.ellipsoid(g, 0.6, 0.6, 0.5, M.gloss('#3a1a10'), [11.5, s * 1.6, 10.2]);
    // jaws: long, nearly straight, saw-toothed on the inner edge
    const open = o.stingT > 0 ? 1.8 : 0, jaw = M.gloss('#b8862a', { rough: 0.4 });
    for (const s of [-1, 1]) {
      blade(M, g, [[17, s * 2.4, 5.4], [22.5, s * (4.4 + open), 5.0], [28, s * (1.4 + open * 0.5), 4.6]], 1.1, 0.35, jaw);
      for (let k = 0; k < 6; k++) { const x = 19 + k * 1.5, y = s * (3.3 + open * 0.9 - k * 0.42); M.seg(g, [x, y, 5], [x + 0.4, y - s * 1.1, 4.9], 0.32, M.gloss('#5a3a08'), { cone: 0.05 }); }
    }
    for (const s of [-1, 1]) M.antenna(g, [15.5, s * 2.6, 6.5], s * 1.05, 7, s * 0.25, 10, 9, M.chitin('#4a1a0c'), 1.1, { rise: 0.4, droop: 0.05 });
    if (o.carry) flatSprite(M, g, o.carry, { stunned: true }, [29, 0, 0.8], 0.8);
    return g;
  },
  pose(root, o, t) { const ph = SpriteCache.phase(t, 18, 8); root.userData.legs.pose(o.moving ? Math.sin((ph + 0.5) / 8 * TAU) : 0); },
});

Models.define('bee', {
  // Blue-banded bee, Amegilla. Ginger pile on the thorax, black abdomen with four pale blue bands of
  // scale-hairs, big pale green eyes, smoky wings.
  buckets: 16,
  variant(o) { return 'l' + Math.round((o.load || 0) * 2) + (o.sip || o.buzz ? 'T' : ''); },
  key(o, t) { return 'w' + SpriteCache.phase(t, o.buzz ? 90 : 50, 3) + 'l' + Math.round((o.load || 0) * 2) + (o.sip || o.buzz ? 'T' : ''); },
  build(M, o) {
    const g = new THREE.Group();
    M.legs6(g, { cx: 1, wide: 2.2, z: 4.5, mat: M.chitin('#3a2a1a'), w: 1.1, L: 12, pitch: 0.6, lift: 1.5 });
    const load = o.load || 0;
    if (load > 0) for (const s of [-1, 1]) { M.ellipsoid(g, 1.8 + load, 1.5 + load * 0.6, 1.4 + load * 0.5, M.matte('#f5a623'), [-4, s * 9, 2.2]); M.pile(g, [-4, s * 9, 2.2], 1.9 + load, 1.6 + load * 0.6, 1.5 + load * 0.5, 30, 0.9, '#f0b040', 2, { full: true, lean: 0 }); }
    // abdomen: black with four blue bands painted across it
    const bands = M.paint('beeBands', 256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#141212'; ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 4; k++) {
        const v = (17 - k * 4.2) / 20, y = (1 - v) * h, bw = h * 0.04;
        const gr = ctx.createLinearGradient(0, y - bw, 0, y + bw);
        gr.addColorStop(0, 'rgba(120,200,240,0)'); gr.addColorStop(0.35, '#7cc4ee'); gr.addColorStop(0.65, '#4aa0dc'); gr.addColorStop(1, 'rgba(60,140,210,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, y - bw, w, bw * 2);
      }
    });
    M.banded(g, 10, 7.4, 6.6, M.chitin('#ffffff', { map: bands, coat: 0.15, rough: 0.72, env: 0.25 }), [-8, 0, 6.6]);
    M.pile(g, [-8, 0, 6.6], 10.2, 7.6, 6.8, 90, 0.9, '#8a8078', 7, { lean: 0.3, thick: 0.12 });
    // thorax: a dense ginger pile
    M.ellipsoid(g, 6.3, 6.3, 6.2, M.fur('#b8884a'), [2, 0, 7.2]);
    M.pile(g, [2, 0, 7.2], 6.4, 6.4, 6.3, 360, 1.7, '#e0b068', 5, { lean: 0.4, thick: 0.16 });
    // head: black with big pale green eyes, pale face hair, black antennae
    M.ellipsoid(g, 4, 5, 4.5, M.chitin('#1e1a18'), [9.6, 0, 6.8]);
    for (const s of [-1, 1]) M.ellipsoid(g, 2.5, 1.9, 2.3, M.eye({ color: '#6a9a68' }), [10, s * 3.7, 7.4], s * 0.3);
    M.pile(g, [10.5, 0, 7.4], 2.6, 2.2, 2.4, 40, 0.8, '#e8d0a0', 6, { lean: -0.3, thick: 0.12 });
    for (const s of [-1, 1]) M.antenna(g, [12.5, s * 1.6, 7.8], s * 1.0, 3, s * 0.6, 5, 6, M.chitin('#141010'), 0.9, { rise: 0.5, droop: -0.2 });
    if (o.sip || o.buzz) M.seg(g, [13, 0, 6.2], [19.5, 0, 5.4], 0.42, M.chitin('#3a2a1a'), { cone: 0.1 });
    // wings on hinges, held above the back
    g.userData.wings = [];
    for (const s of [-1, 1]) {
      const fw = membraneWing(M, g, [3, s * 2.4, 14.2], 15, 4.6, 'bee', s, { color: '#d8d8e0', opacity: 0.26 }); fw.base = 2.7; g.userData.wings.push(fw);
      const hw = membraneWing(M, g, [1, s * 2.4, 14.0], 10, 3.2, 'bee', s, { color: '#d8d8e0', opacity: 0.22 }); hw.base = 2.5; g.userData.wings.push(hw);
    }
    return g;
  },
  pose(root, o, t) {
    const ph = SpriteCache.phase(t, o.buzz ? 90 : 50, 3), flap = Math.sin((ph + 0.5) / 3 * TAU) * 0.35;
    for (const w of root.userData.wings) { w.hinge.rotation.set(-w.s * flap * 0.5, 0.12, w.s * (w.base - flap)); }
  },
});

// ---------------------------------------------------------------- more shared pieces
// A two-colour spider leg from `at`: femur rising at yaw a, tibia turning by bend and coming down, a short
// tarsus on the ground. mats: [dark, joint colour or null]. Returns the group; set(a) re-poses it.
function spiderLeg(M, parent, at, a, L, mat, w, bend, o) {
  o = o || {};
  return M.leg(parent, at, a, L, mat, w, bend, Object.assign({ femur: 0.44, tibia: 0.36, tarsus: 0.2, pitch: o.pitch === undefined ? 0.7 : o.pitch }, o));
}
// Paint a wing's pattern with the 2D drawing code; the canvas is mapped to the outline's bounds.
function patternTexture(M, key, pts, fn) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return M.paint(key, 256, 256, (ctx, w, h) => {
    ctx.setTransform(w / (x1 - x0), 0, 0, h / (y1 - y0), -x0 * w / (x1 - x0), -y0 * h / (y1 - y0));
    fn(ctx);
  }, { flipY: false, clamp: true });
}
// A flat painted wing (scales, like a butterfly's) on a hinge; outline pts are for side +1.
function paintedWing(M, parent, at, pts, tex, side, o) {
  o = o || {};
  const T = THREE, hinge = new T.Group(); hinge.position.set(at[0], at[1], at[2]); parent.add(hinge);
  const geo = M.geo('pw|' + o.key + '|' + side, () => M.shape(pts.map(([x, y]) => [x, y * side]), { uv: true }));
  if (side < 0 && !geo.userData.flipped) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i)); uv.needsUpdate = true; geo.userData.flipped = true; }
  const mesh = new T.Mesh(geo, M.scaleWing(tex)); mesh.castShadow = true; mesh.receiveShadow = false;
  hinge.add(mesh);
  return { hinge, mesh, s: side };
}
function bez(pts, p0, c1, c2, p1, n) { for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]]); } }

// Painted lady wings: outlines and patterns from the 2D drawing (right side, wing laid flat).
const PL = {
  fore() { const p = [[2, 0]]; bez(p, [2, 0], [10, 1], [17, 9], [14, 23], 12); bez(p, [14, 23], [8, 25], [1, 18], [-2, 2], 12); return p; },
  hind() { const p = [[-1, 1]]; bez(p, [-1, 1], [1, 12], [-5, 20], [-13, 17], 12); bez(p, [-13, 17], [-17, 9], [-11, 2], [-4, 1], 12); return p; },
  paintFore(ctx) {
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.bezierCurveTo(10, 1, 17, 9, 14, 23); ctx.bezierCurveTo(8, 25, 1, 18, -2, 2); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 12, 22); g.addColorStop(0, '#a84a1a'); g.addColorStop(0.4, '#f08a2e'); g.addColorStop(1, '#e8802a');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.moveTo(7, 7); ctx.quadraticCurveTo(17, 7, 17, 27); ctx.lineTo(2, 27); ctx.quadraticCurveTo(4, 14, 7, 7); ctx.fillStyle = '#1c1816'; ctx.fill();
    for (const [px, py, pr] of [[11.5, 19.5, 1.5], [9, 16, 1.1], [13.2, 14.5, 1], [7.5, 21.5, 0.8], [13.5, 23, 0.9]]) plainEll(ctx, px, py, pr, pr * 0.9, '#f8f4ee');
    ctx.fillStyle = '#1c1816';
    ctx.beginPath(); ctx.ellipse(5.5, 4, 1.2, 3.2, 0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, 10, 2.4, 1.1, -0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, 11.5, 1, 2.2, 0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(1, 1); ctx.quadraticCurveTo(4 + k * 1.2, 8 + k, 2 + k * 3, 19 + k * 0.8); }
    ctx.strokeStyle = 'rgba(70,35,10,.35)'; ctx.lineWidth = 0.4; ctx.stroke();
    ctx.restore();
  },
  paintHind(ctx) {
    ctx.beginPath(); ctx.moveTo(-1, 1); ctx.bezierCurveTo(1, 12, -5, 20, -13, 17); ctx.bezierCurveTo(-17, 9, -11, 2, -4, 1); ctx.closePath();
    const g = ctx.createLinearGradient(-2, 0, -12, 17); g.addColorStop(0, '#9a3e18'); g.addColorStop(0.5, '#e07a2a'); g.addColorStop(1, '#c86022');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.beginPath(); ctx.moveTo(-13, 17); ctx.bezierCurveTo(-5, 20, 1, 12, -1, 1); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.6; ctx.stroke();
    for (let k = 0; k < 4; k++) { const ex = -12.5 + k * 3.1, ey = 14 - k * 1.9; plainEll(ctx, ex, ey, 1.7, 1.7, '#1e1a18'); plainEll(ctx, ex, ey, 0.9, 0.9, '#3a78e0'); plainEll(ctx, ex - 0.3, ey - 0.3, 0.35, 0.35, '#cfe6ff'); }
    ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(-3, 2); ctx.quadraticCurveTo(-6 - k * 1.5, 8 + k, -5 - k * 3, 17 - k * 1.5); }
    ctx.strokeStyle = 'rgba(70,35,10,.3)'; ctx.lineWidth = 0.4; ctx.stroke();
    ctx.restore();
  },
};

// Peacock spider, Maratus speciosus: shared by the player and the female's suitor.
function peacockSpider(M, o) {
  const g = new THREE.Group(), dance = o.dance > 0 || o.fan > 0, angles = [0.55, 1.15, 1.9, 2.5];
  g.userData.legs = [];
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    let a = s * angles[i], l = i === 2 ? 20 : i === 3 ? 17 : 15;
    if (dance && i === 2) { a = s * 1.55; l = 24; }
    const leg = spiderLeg(M, g, [3, s * 1.2, 4.2], a, l, M.chitin(i === 2 ? '#1a1410' : '#2a2018', { coat: 0.3 }), 1.5, s * 0.5, { pitch: dance && i === 2 ? 0.95 : 0.7 });
    leg.base = a; leg.i = i; leg.s = s; g.userData.legs.push(leg);
    if (i === 2) {   // white brushes on the third legs: a tuft near the foot
      const fem = l * 0.44, tb = l * 0.36, kx = 3 + Math.cos(a) * fem * Math.cos(0.7), ky = s * 1.2 + Math.sin(a) * fem * Math.cos(0.7), b = a + s * 0.5;
      M.pile(g, [kx + Math.cos(b) * tb * 0.7, ky + Math.sin(b) * tb * 0.7, 1.6], 2.2, 1.6, 1.4, 60, 1.3, '#f4f4f0', 4 + i, { full: true, lean: 0, thick: 0.14 });
    }
  }
  // the fan: iridescent, banded red, fringed when raised
  const ax = dance ? 8.5 : 7.2, ay = dance ? 13 : 6.4, az = dance ? 1.6 : 3.4;
  const fanMap = M.paint('maratusFan' + (dance ? 'D' : ''), 128, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#48e0d0'); gr.addColorStop(0.35, '#2a78d8'); gr.addColorStop(0.7, '#3ac8a0'); gr.addColorStop(1, '#2a60c0');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    for (let k = -1; k <= 1; k++) { const y = h / 2 + k * h * 0.2, bw = h * (dance ? 0.04 : 0.03); const gb = ctx.createLinearGradient(0, y - bw * 1.4, 0, y + bw * 1.4); gb.addColorStop(0, 'rgba(255,90,26,0)'); gb.addColorStop(0.3, '#ff5a1a'); gb.addColorStop(0.7, '#ff7a2a'); gb.addColorStop(1, 'rgba(255,90,26,0)'); ctx.fillStyle = gb; ctx.fillRect(0, y - bw * 1.4, w, bw * 2.8); ctx.fillStyle = 'rgba(255,230,120,.5)'; ctx.fillRect(0, y - bw * 1.2, w, bw * 0.4); }
    const rim = ctx.createLinearGradient(0, 0, 0, h); rim.addColorStop(0, 'rgba(10,30,40,.7)'); rim.addColorStop(0.1, 'rgba(10,30,40,0)'); rim.addColorStop(0.9, 'rgba(10,30,40,0)'); rim.addColorStop(1, 'rgba(10,30,40,.7)'); ctx.fillStyle = rim; ctx.fillRect(0, 0, w, h);
  });
  const fan = M.ellipsoid(g, ax, ay, az, M.chitin('#ffffff', { map: fanMap, coat: 1, rough: 0.2, env: 1.2 }), [-8, 0, dance ? 6 : 4.2]);
  if (dance) {
    fan.rotation.y = -0.5;   // tipped up at the viewer
    fan.position.z = 8;
    const r = rng(21);
    M.hairs(g, 90, M.cone(0.14, 0.02, 4.5), M.hair('#ff9a2a'), (i, d) => {
      const a = (i / 90 - 0.5) * 3.6 + Math.PI / 2 + (r() - 0.5) * 0.1, px = -8 + Math.cos(a) * ax * 0.95, py = Math.sin(a) * ay * 0.95;
      d.position.set(px, py, 8 + (px + 8) * 0.55); d.rotation.z = a - Math.PI / 2; d.rotation.x = 0;
      d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(Math.cos(a), Math.sin(a), 0.15).normalize());
      d.position.addScaledVector(new THREE.Vector3(Math.cos(a), Math.sin(a), 0), 2.2);
    });
  } else for (const s of [-1, 1]) M.hairs(g, 9, M.cone(0.12, 0.02, 2.8), M.hair('#ff8c1a'), (i, d) => { d.position.set(-13.5 + i * 1.4, s * 6.6, 3.6); d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, s, 0.1).normalize()); });
  // cephalothorax: dark, hairy, white side stripes; eight eyes, the front pair huge
  M.ellipsoid(g, 6.8, 5.8, 4.6, M.fur('#2a2018'), [4, 0, 4.4]);
  M.pile(g, [4, 0, 4.4], 6.9, 5.9, 4.7, 160, 1.0, '#3a2a20', 7, { lean: 0.3, thick: 0.12 });
  for (const s of [-1, 1]) { M.seg(g, [-1.5, s * 3.9, 7.6], [8.5, s * 4.5, 7.2], 0.55, M.hair('#f4f4ee'), { full: true }); M.seg(g, [0, s * 1.5, 8.9], [7, s * 1.7, 8.8], 0.3, M.hair('#d8d8d0'), { full: true }); }
  for (const s of [-1, 1]) {
    M.ellipsoid(g, 2.4, 2.4, 2.4, M.eye(), [9.8, s * 2.3, 6.2]);
    M.ellipsoid(g, 1, 1, 1, M.eye(), [8.6, s * 5.1, 6.4]);
    M.ellipsoid(g, 0.7, 0.7, 0.7, M.eye(), [5.2, s * 4.8, 8.4]);
    M.ellipsoid(g, 1, 1, 1, M.eye(), [1.6, s * 4.4, 8.2]);
    M.ellipsoid(g, 1.5, 1.1, 1, M.fur('#3a2a20'), [11.2, s * 1.1, 4.4]);   // pedipalps
    M.pile(g, [11.2, s * 1.1, 4.4], 1.6, 1.2, 1.1, 24, 0.9, '#e8e0d0', 8 + s, { full: true, lean: 0, thick: 0.12 });
  }
  return g;
}

Models.define('spider', {
  buckets: 16,
  variant(o) { return (o.dance > 0 || o.fan > 0) ? 'D' : ''; },
  key(o, t) { const d = o.dance > 0 || o.fan > 0; return (d ? 'D' + SpriteCache.phase(t, 12, 6) : '') + (o.moving ? 'm' + SpriteCache.phase(t, 16, 8) : 'x'); },
  build(M, o) { return peacockSpider(M, o); },
  pose(root, o, t) {
    const dance = o.dance > 0 || o.fan > 0, w = o.moving ? Math.sin((SpriteCache.phase(t, 16, 8) + 0.5) / 8 * TAU) * 0.2 : 0;
    const wave = dance ? Math.sin((SpriteCache.phase(t, 12, 6) + 0.5) / 6 * TAU) * 0.45 : 0;
    for (const l of root.userData.legs) {
      if (dance && l.i === 2) l.set(l.s * (1.55 + wave), 1.5 + wave * 2);
      else l.set(l.base + (l.i % 2 ? w : -w) * l.s, 0);
    }
  },
});

Models.define('femaleSpider', {
  buckets: 16,
  variant(o) { return o.heart ? 'h' : ''; },   // the heart is part of the build, so it needs its own root
  key(o, t) { return (o.heart ? 'h' : '') + (o.moving ? 'm' + SpriteCache.phase(t, 16, 8) : 'x'); },
  build(M, o) {
    const g = new THREE.Group(), angles = [0.55, 1.15, 1.9, 2.5];
    g.userData.legs = [];
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const leg = spiderLeg(M, g, [3, s * 1.2, 4], s * angles[i], 14, M.fur('#7a6046'), 1.6, s * 0.45); leg.base = s * angles[i]; leg.i = i; leg.s = s; g.userData.legs.push(leg); }
    // brown, mottled: a painted map of pale and dark flecks
    const mottle = M.paint('femaleSpiderMottle', 128, 128, (ctx, w, h) => { ctx.fillStyle = '#8f7250'; ctx.fillRect(0, 0, w, h); const r = rng(9); for (let k = 0; k < 60; k++) { ctx.fillStyle = k % 2 ? '#5e4630' : '#c8a878'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 4, 3, r() * 3, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(220,190,140,.6)'; ctx.fillRect(0, h * 0.47, w, h * 0.06); });
    M.ellipsoid(g, 7.8, 6.8, 4.8, M.fur('#ffffff', { map: mottle }), [-8, 0, 4.8]);
    M.pile(g, [-8, 0, 4.8], 7.9, 6.9, 4.9, 120, 0.9, '#a08a68', 9, { lean: 0.3, thick: 0.12 });
    M.ellipsoid(g, 6.6, 5.6, 4.4, M.fur('#6e5438'), [4, 0, 4.4]);
    M.pile(g, [4, 0, 4.4], 6.7, 5.7, 4.5, 120, 0.9, '#8a6a48', 10, { lean: 0.3, thick: 0.12 });
    for (const s of [-1, 1]) { M.ellipsoid(g, 2.3, 2.3, 2.3, M.eye(), [9.6, s * 2.3, 6]); M.ellipsoid(g, 1, 1, 1, M.eye(), [8.6, s * 4.8, 6.2]); }
    if (o.heart) {
      const heart = M.paint('heart', 64, 64, (ctx) => { ctx.clearRect(0, 0, 64, 64); ctx.fillStyle = '#e8506a'; ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♥', 32, 34); }, { clamp: true });
      const m = new THREE.Mesh(M.geo('plane16', () => new THREE.PlaneGeometry(16, 16)), M.mat('heartMat', () => new THREE.MeshBasicMaterial({ map: heart, transparent: true, depthWrite: false })));
      m.position.set(0, -16, 14); m.scale.y = -1; m.castShadow = false; g.add(m); g.userData.heart = m;
    }
    return g;
  },
  pose(root, o, t) {
    const w = o.moving ? Math.sin((SpriteCache.phase(t, 16, 8) + 0.5) / 8 * TAU) * 0.2 : 0;
    for (const l of root.userData.legs) l.set(l.base + (l.i % 2 ? w : -w) * l.s, 0);
    if (root.userData.heart) root.userData.heart.rotation.z = -(o.angle || 0);   // the heart stays upright on screen
  },
});

Models.define('spiderling', {
  buckets: 8,
  variant(o) { return o.moult > 0 ? 'M' : ''; },
  key(o, t) { return (o.moult > 0 ? 'M' : '') + (o.moving ? 'm' + SpriteCache.phase(t, 16, 8) : 'x'); },
  build(M, o) {
    const g = new THREE.Group(), angles = [0.55, 1.15, 1.9, 2.5];
    g.userData.legs = [];
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const leg = spiderLeg(M, g, [3, s * 1, 3], s * angles[i], 11, M.chitin('#7a5f40', { coat: 0.3 }), 1.3, s * 0.45); leg.base = s * angles[i]; leg.i = i; leg.s = s; g.userData.legs.push(leg); }
    M.ellipsoid(g, 6.5, 5.6, 4, M.fur('#a5865e'), [-7, 0, 4]);
    M.ellipsoid(g, 3, 2, 1.2, M.matte('#dcc090'), [-8, 0, 7.4]);
    M.ellipsoid(g, 6, 5.1, 4.2, M.fur('#7a5f40'), [4, 0, 4.2]);
    M.pile(g, [4, 0, 4.2], 6.1, 5.2, 4.3, 80, 0.8, '#9a7a58', 11, { lean: 0.3, thick: 0.12 });
    for (const s of [-1, 1]) M.ellipsoid(g, 2.2, 2.2, 2.2, M.eye(), [8.8, s * 2.2, 5.6]);
    if (o.moult > 0) {   // the shed skin left behind: a pale ghost of the spider
      const ghost = M.mat('moultGhost', () => new THREE.MeshPhysicalMaterial({ color: '#f4f0e8', transparent: true, opacity: 0.55, roughness: 0.6, depthWrite: false }));
      const sk = new THREE.Group(); sk.position.set(-22, 0, 0); g.add(sk);
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) spiderLeg(M, sk, [3, s * 1, 2.5], s * angles[i], 11, ghost, 1.1, s * 0.4);
      M.ellipsoid(sk, 6.5, 5.5, 3, ghost, [-7, 0, 3]); M.ellipsoid(sk, 6, 5, 3.2, ghost, [4, 0, 3.2]);
    }
    return g;
  },
  pose(root, o, t) { const w = o.moving ? Math.sin((SpriteCache.phase(t, 16, 8) + 0.5) / 8 * TAU) * 0.2 : 0; for (const l of root.userData.legs) l.set(l.base + (l.i % 2 ? w : -w) * l.s, 0); },
});

// Blue skimmer: ten-segment abdomen, big eyes meeting on top, four long veined wings with pterostigmas.
function skimmer(M, o) {
  const g = new THREE.Group(), fem = o.female;
  const body = fem ? '#c8a050' : '#8ec6ec', dark = fem ? '#6a4a20' : '#4a7aa8';
  for (let k = 9; k >= 0; k--) M.ellipsoid(g, 2.1, 2.4 - k * 0.1, 2.2 - k * 0.08, M.chitin(k > 7 ? '#2d3e50' : (k % 2 ? body : tint(body, -0.06)), { rough: fem ? 0.5 : 0.75, coat: fem ? 0.5 : 0.1, bump: 0.3 }), [-5 - k * 3.4, 0, 5.2]);
  for (let k = 0; k < 9; k++) M.ellipsoid(g, 0.35, 2.2 - k * 0.1, 2.0 - k * 0.08, M.gloss('#1e2a3a'), [-6.8 - k * 3.4, 0, 5.2]);   // the seams
  if (fem) M.seg(g, [-6, 0, 7.2], [-34, 0, 6.6], 0.5, M.gloss('#3a2510'), { full: true });
  // legs: short, spiny, tucked forward under the thorax
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) M.leg(g, [3 - i * 2, s * 2, 4], s * (1.0 + i * 0.35), 9, M.chitin('#2a2a30', { coat: 0.3 }), 0.85, s * 0.9, { pitch: 0.4, spines: 3 });
  M.ellipsoid(g, 6.2, 4.8, 4.6, M.chitin(dark), [2, 0, 5.2]);
  M.ellipsoid(g, 3.2, 3.6, 3.4, M.chitin(dark), [7.5, 0, 5.4]);
  for (const s of [-1, 1]) M.ellipsoid(g, 3.9, 3.4, 3.6, M.eye({ color: fem ? '#7a6a40' : '#3a7a9a' }), [9.2, s * 3.0, 6.4]);
  M.ellipsoid(g, 1.6, 1.2, 1.2, M.gloss('#1a2a30'), [11.5, 0, 4.8]);
  g.userData.wings = [];
  for (const s of [-1, 1]) {
    const fw = membraneWing(M, g, [3, s * 1.5, 9.6], 27, 4.4, 'dragonfly', s, { opacity: 0.32 }); fw.base = 1.42; g.userData.wings.push(fw);
    const hw = membraneWing(M, g, [-2, s * 1.5, 9.4], 27, 5.4, 'dragonfly', s, { opacity: 0.32 }); hw.base = 1.78; g.userData.wings.push(hw);
  }
  return g;
}
Models.define('dragonfly', {
  buckets: 16,
  variant(o) { return o.female ? 'F' : ''; },
  key(o, t) { return (o.female ? 'F' : '') + 'w' + SpriteCache.phase(t, 40, 3) + (o.dart > 0 ? 'd' : ''); },
  build(M, o) { return skimmer(M, o); },
  pose(root, o, t) { const flap = Math.sin((SpriteCache.phase(t, 40, 3) + 0.5) / 3 * TAU) * 0.12; for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.3, 0.06, w.s * (w.base + flap)); },
});

// Dragonfly nymph: stocky, mottled brown, wing pads folded over the back, the hinged labium under the head.
function nymphModel(M, o) {
  const g = new THREE.Group();
  g.userData.legs = M.legs6(g, { cx: 1, wide: 3, z: 4.5, spread: 1.1, mat: M.chitin('#4a3a22', { coat: 0.25 }), w: 1.4, L: 16, pitch: 0.4, spines: 2, lift: 1.5 });
  const mottle = M.paint('nymphMottle', 128, 128, (ctx, w, h) => { ctx.fillStyle = '#7a6238'; ctx.fillRect(0, 0, w, h); const r = rng(5); for (let k = 0; k < 90; k++) { ctx.fillStyle = k % 3 ? 'rgba(50,35,15,.5)' : 'rgba(200,170,110,.5)'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 2 + r() * 4, 2 + r() * 3, r() * 3, 0, TAU); ctx.fill(); } });
  const skin = M.chitin('#ffffff', { map: mottle, coat: 0.2, rough: 0.7 });
  for (let k = 6; k >= 0; k--) M.ellipsoid(g, 5.6 - k * 0.55, 6.2 - k * 0.75, 3.8 - k * 0.4, skin, [-6 - k * 3.2, 0, 4]);
  for (let k = 0; k < 7; k++) M.ellipsoid(g, 0.4, 5.4 - k * 0.7, 3.2 - k * 0.38, M.gloss('#2a1c0c'), [-7.6 - k * 3.2, 0, 4]);
  for (const s of [-1, 0, 1]) M.seg(g, [-27, 0, 4], [-32, s * 2.4, 3.8], 0.6, M.chitin('#4a3a22'), { cone: 0.1 });
  M.ellipsoid(g, 6.2, 5.8, 4.2, skin, [0, 0, 4.2]);
  for (const s of [-1, 1]) M.ellipsoid(g, 8, 2.4, 1.2, M.chitin('#5b4a2a', { coat: 0.3 }), [-7, s * 3.2, 7.6], s * 0.12);   // wing pads
  M.ellipsoid(g, 5, 6.6, 4.4, skin, [8, 0, 4.4]);
  for (const s of [-1, 1]) M.ellipsoid(g, 2.9, 2.6, 2.6, M.eye({ color: '#3a3020' }), [9, s * 5, 6.2]);
  M.ellipsoid(g, 1.8, 2.8, 1.4, M.matte('#5a3c1c'), [12, 0, 2.8]);   // folded labium
  for (const s of [-1, 1]) M.seg(g, [11, s * 2, 4], [14.5, s * 3.5, 3.6], 0.4, M.chitin('#3a2a18'), { full: true });
  if (o.grab) { const L = o.grab.len; M.seg(g, [10, 0, 3], [10 + L, 0, 3], 1.2, M.matte('#a08050')); M.seg(g, [10 + L, 0, 3], [14 + L, -3, 3], 0.7, M.chitin('#5b4a2a'), { cone: 0.1 }); M.seg(g, [10 + L, 0, 3], [14 + L, 3, 3], 0.7, M.chitin('#5b4a2a'), { cone: 0.1 }); }
  return g;
}
Models.define('nymph', {
  buckets: 16,
  variant(o) { return o.grab ? 'g' + Math.round(o.grab.len / 4) : ''; },
  key(o, t) { return (o.grab ? 'g' + Math.round(o.grab.len / 4) : '') + (o.moving ? 'm' + SpriteCache.phase(t, 18, 8) : 'x'); },
  build(M, o) { return nymphModel(M, o); },
  pose(root, o, t) { root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU) : 0); },
});
Models.define('emerge', {
  buckets: 8, shadow: true,
  variant(o) { return 'k' + Math.round((o.k || 0) * 8); },
  key(o, t) { return 'k' + Math.round((o.k || 0) * 8) + 'w' + SpriteCache.phase(t, 40, 3); },
  build(M, o) {
    const g = new THREE.Group(), k = Math.round((o.k || 0) * 8) / 8;
    const n = nymphModel(M, {}); n.position.x = -14 * k; n.traverse((m) => { if (m.material && m.material.opacity !== undefined) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.85; } }); g.add(n);
    const d = skimmer(M, { dart: 0 }); d.position.set(18 * k, 0, 2); d.scale.setScalar(0.5 + k * 0.5); g.add(d); g.userData.wings = d.userData.wings;
    return g;
  },
  pose(root, o, t) { const flap = (o.k || 0) > 0.8 ? Math.sin((SpriteCache.phase(t, 40, 3) + 0.5) / 3 * TAU) * 0.12 : 0; for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.3, 0.06, w.s * (w.base + flap)); },
});

// Australian painted lady: four painted wings on hinges along the body, furry body, clubbed antennae.
function paintedLady(M, o) {
  const g = new THREE.Group();
  const foreTex = patternTexture(M, 'plFore', PL.fore(), (ctx) => PL.paintFore(ctx)), hindTex = patternTexture(M, 'plHind', PL.hind(), (ctx) => PL.paintHind(ctx));
  g.userData.wings = [];
  for (const s of [-1, 1]) {
    const hw = paintedWing(M, g, [0, 0, 5.4], PL.hind(), hindTex, s, { key: 'plHind' }); hw.kind = 'hind'; g.userData.wings.push(hw);
    const fw = paintedWing(M, g, [0, 0, 5.6], PL.fore(), foreTex, s, { key: 'plFore' }); fw.kind = 'fore'; g.userData.wings.push(fw);
  }
  M.ellipsoid(g, 8.5, 2.1, 2.1, M.fur('#3a2c22'), [-4, 0, 4.6]);
  M.pile(g, [-4, 0, 4.6], 8.6, 2.2, 2.2, 90, 0.9, '#6a5040', 9, { full: true, lean: 0.4, thick: 0.1 });
  M.ellipsoid(g, 3.4, 3, 2.8, M.fur('#3a2c22'), [4, 0, 4.8]);
  M.pile(g, [4, 0, 4.8], 3.5, 3.1, 2.9, 90, 1.1, '#7a6048', 10, { full: true, lean: 0.3, thick: 0.12 });
  M.ellipsoid(g, 2.2, 2.2, 2.2, M.chitin('#2a221c'), [7.6, 0, 4.8]);
  for (const s of [-1, 1]) { M.ellipsoid(g, 1.1, 1, 1, M.eye({ color: '#3a3020' }), [8.4, s * 1.5, 5.4]); M.seg(g, [8.5, s * 1, 5.6], [16.5, s * 5, 6.4], 0.3, M.chitin('#2a221c'), { full: true }); M.ellipsoid(g, 1.1, 0.9, 0.8, M.chitin('#5a4a30'), [16.8, s * 5.2, 6.4]); }
  if (o.sip) M.seg(g, [9, 0, 4.2], [12.5, 0, 1.2], 0.3, M.chitin('#2a221c'), { full: true });
  return g;
}
Models.define('butterfly', {
  buckets: 16,
  variant(o) { return (o.sip ? 'S' : '') + (o.landed ? 'L' : ''); },
  key(o, t) { return (o.sip ? 'S' : '') + (o.landed ? 'L' : 'w' + SpriteCache.phase(t, 18, 6)); },
  build(M, o) { return paintedLady(M, o); },
  pose(root, o, t) {
    const f = o.landed ? 0.35 : 0.55 + Math.sin((SpriteCache.phase(t, 18, 6) + 0.5) / 6 * TAU) * 0.45;   // how open the wings are, as the 2D drew them
    const ang = Math.acos(Math.max(0.05, Math.min(1, f)));
    for (const w of root.userData.wings) w.hinge.rotation.set(w.s * ang, 0, w.kind === 'hind' ? -w.s * 0.08 : w.s * 0.08);
  },
});

// Painted lady caterpillar: dark, spiny, a pale yellow side stripe; o.size and o.fat grow it.
Models.define('plCaterpillar', {
  buckets: 16,
  variant(o) { return 'z' + Math.round((o.size || 1) * 4) + 'f' + Math.round((o.fat || 1) * 4) + (o.munch ? 'M' : ''); },
  key(o, t) { return 'z' + Math.round((o.size || 1) * 4) + 'f' + Math.round((o.fat || 1) * 4) + (o.munch ? 'M' + SpriteCache.phase(t, 20, 2) : '') + (o.moving ? 'm' + SpriteCache.phase(t, 8, 6) : 'x'); },
  build(M, o) {
    const g = new THREE.Group(), s = Math.round((o.size || 1) * 4) / 4, fat = Math.round((o.fat || 1) * 4) / 4;
    g.scale.set(s, s * fat, s * fat);
    g.userData.segs = [];
    const skin = M.matte('#3a2e2a', { rough: 0.8 }), skin2 = M.matte('#4a3a32', { rough: 0.8 }), stripe = M.matte('#e0c870');
    for (let k = 7; k >= 0; k--) {
      const seg = new THREE.Group(); seg.position.set(-k * 4, 0, 3.7); g.add(seg); g.userData.segs.push({ seg, k });
      M.ellipsoid(seg, 3.9, 3.7, 3.7, k % 2 ? skin : skin2, [0, 0, 0]);
      M.ellipsoid(seg, 1.9, 0.75, 0.6, stripe, [0, -2.5, 2.6]); M.ellipsoid(seg, 1.9, 0.75, 0.6, stripe, [0, 2.5, 2.6]);
      M.ellipsoid(seg, 0.8, 0.6, 0.5, M.matte('#f0d890'), [-0.5, 0, 3.6]);
      if (k >= 3 && k <= 6) for (const sg of [-1, 1]) M.ellipsoid(seg, 1.2, 1, 1.2, M.matte('#2a201c'), [0, sg * 3.8, -2.6]);
      if (k <= 2 && k >= 1) for (const sg of [-1, 1]) M.seg(seg, [0, sg * 3, -2], [1, sg * 5, -3.6], 0.4, M.chitin('#1a1210'), { cone: 0.1 });
      // branched spines
      M.hairs(seg, 12, M.cone(0.16, 0.02, 3.2), M.hair('#d8c070'), (i, d) => {
        const sg = i < 6 ? -1 : 1, j = i % 6, a = sg * (0.5 + j * 0.42), nrm = new THREE.Vector3(Math.cos(a) * 0.2 * (j % 2 ? 1 : -1), Math.sin(a), Math.cos(a) * 0.8).normalize();
        d.position.set((j % 2 ? 1.2 : -1.2), nrm.y * 3.6, nrm.z * 3.5); d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm); d.position.addScaledVector(nrm, 1.4);
      });
    }
    M.ellipsoid(g, 3.5, 3.5, 3.4, M.chitin('#1e1612'), [3.2, 0, 3.4]);
    for (const sg of [-1, 1]) M.ellipsoid(g, 0.6, 0.6, 0.5, M.gloss('#dddddd'), [4.6, sg * 1.6, 5.2]);
    if (o.munch) { const m = M.ellipsoid(g, 1.8, 1.6, 1.2, M.leaf('#7fc24a'), [6.5, 0, 2.8]); g.userData.leaf = m; }
    return g;
  },
  pose(root, o, t) {
    const ph = o.moving ? (SpriteCache.phase(t, 8, 6) + 0.5) / 6 * TAU : 0;
    for (const { seg, k } of root.userData.segs) seg.position.y = o.moving ? Math.sin(k * 0.9 + ph) * 1.2 : 0;
    if (root.userData.leaf) root.userData.leaf.position.y = Math.sin((SpriteCache.phase(t, 20, 2) + 0.5) / 2 * TAU);
  },
});

Models.define('chrysalis', {
  buckets: 8,
  build(M) {
    const g = new THREE.Group();
    M.seg(g, [14, -2, 6.5], [26, 2, 7.5], 0.8, M.bark('#8a7a5a'));
    // the case: a lathe from the pointed tail (left) to the rounded head end hooked under the twig
    const prof = [[0, -12], [1.8, -11], [3.6, -8], [5.2, -4], [6.2, 0], [6.0, 4], [5.0, 7.5], [3.2, 10], [1.4, 11.4], [0, 11.8]];
    const bands = M.paint('chrysalisBands', 128, 128, (ctx, w, h) => { ctx.fillStyle = '#b8a478'; ctx.fillRect(0, 0, w, h); for (let k = 0; k < 7; k++) { ctx.fillStyle = 'rgba(90,70,40,.55)'; ctx.fillRect(0, h * (0.1 + k * 0.12), w, 2); } ctx.fillStyle = 'rgba(60,45,25,.35)'; ctx.fillRect(0, h * 0.48, w, 1.5); });
    const m = new THREE.Mesh(M.lathe(prof, 24), M.chitin('#ffffff', { map: bands, coat: 0.9, rough: 0.3 }));
    m.castShadow = m.receiveShadow = true; m.rotation.z = -Math.PI / 2; m.position.set(4, 0, 6.2); g.add(m);
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) M.ellipsoid(g, 0.8, 0.7, 0.5, M.metal('#f0d080', { rough: 0.2 }), [-2 + i * 3.6, s * 3.2, 11.2 - Math.abs(i - 1.5) * 0.5]);
    M.seg(g, [15, 0, 6.5], [16, -1, 6.8], 0.4, M.gloss('#5a4a30'), { full: true });   // the silk pad on the twig
    return g;
  },
});

// Bush fly: grey thorax with two dark stripes, grey abdomen with pale side patches, big red eyes, bristles.
Models.define('bushFly', {
  buckets: 16,
  variant(o) { return (o.sip ? 'S' : '') + (o.landed ? 'L' : ''); },
  key(o, t) { return (o.sip ? 'S' : '') + (o.landed ? 'L' + (o.moving ? 'm' + SpriteCache.phase(t, 18, 8) : '') : 'w' + SpriteCache.phase(t, 80, 3)); },
  build(M, o) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 0, wide: 1.6, len: 0.6, z: 3.4, mat: M.chitin('#2a2622', { coat: 0.3 }), w: 0.75, L: 8.5, pitch: 0.6, spines: 2, lift: 1.2 });
    const abd = M.paint('bushFlyAbd', 128, 64, (ctx, w, h) => { ctx.fillStyle = '#8a8878'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(210,180,110,.6)'; ctx.fillRect(0, 0, w, h * 0.3); ctx.fillRect(0, h * 0.7, w, h * 0.3); ctx.fillStyle = 'rgba(40,40,35,.8)'; ctx.fillRect(0, h * 0.47, w, h * 0.06); for (let k = 1; k < 4; k++) { ctx.fillStyle = 'rgba(40,40,35,.45)'; ctx.fillRect(w * (0.2 + k * 0.2), 0, 1.5, h); } });
    M.ellipsoid(g, 5.2, 3.6, 3.2, M.chitin('#ffffff', { map: abd, coat: 0.3, rough: 0.6 }), [-5, 0, 3.6]);
    M.pile(g, [-5, 0, 3.6], 5.3, 3.7, 3.3, 50, 1.1, '#2a2a26', 12, { lean: 0.3, thick: 0.1 });
    const th = M.paint('bushFlyThorax', 128, 128, (ctx, w, h) => { ctx.fillStyle = '#9a9888'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#34332e'; ctx.fillRect(0, h * 0.3, w, h * 0.09); ctx.fillRect(0, h * 0.61, w, h * 0.09); });
    M.ellipsoid(g, 3.9, 3.5, 3.4, M.chitin('#ffffff', { map: th, coat: 0.3, rough: 0.55 }), [1.2, 0, 3.8]);
    M.pile(g, [1.2, 0, 3.8], 4, 3.6, 3.5, 50, 1.4, '#2a2a26', 13, { lean: 0.3, thick: 0.1 });
    for (const s of [-1, 1]) M.ellipsoid(g, 1.1, 0.7, 0.6, M.matte('#c8c4b0'), [-2.4, s * 3.4, 4.6]);   // halteres
    M.ellipsoid(g, 2.3, 2.8, 2.6, M.chitin('#6a6658'), [5.4, 0, 3.8]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 2.1, 2.1, 2.1, M.eye({ color: '#8b2a1e' }), [5.6, s * 1.9, 4.4]); M.seg(g, [7, s * 0.6, 3.4], [8.2, s * 1.6, 3.2], 0.25, M.chitin('#2a2622'), { full: true }); }
    if (o.sip) { M.seg(g, [7, 0, 2.8], [9.5, 0, 1.2], 0.5, M.matte('#5a5a50')); M.ellipsoid(g, 1, 0.8, 0.5, M.matte('#7a7a6a'), [9.6, 0, 0.8]); }
    g.userData.wings = [];
    for (const s of [-1, 1]) { const w = membraneWing(M, g, [0.5, s * 1.6, 7.4], 11.5, 3.4, 'fly', s, { opacity: 0.3 }); w.base = 2.6; g.userData.wings.push(w); }
    return g;
  },
  pose(root, o, t) {
    const flap = o.landed ? 0.25 : Math.sin((SpriteCache.phase(t, 80, 3) + 0.5) / 3 * TAU) * 0.45;
    for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.5, 0.1, w.s * (w.base - flap));
    root.userData.legs.pose(o.moving && o.landed ? Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU) : 0);
  },
});

// Termite worker: soft, pale and a little see-through, the gut showing; round orange eyeless head.
Models.define('termiteWorker', {
  buckets: 16,
  variant(o) { return o.carry || ''; },
  key(o, t) { return (o.carry || '') + (o.moving ? 'm' + SpriteCache.phase(t, 18, 8) : 'x'); },
  build(M, o) {
    const g = new THREE.Group();
    g.userData.legs = M.legs6(g, { cx: 0, wide: 1.8, len: 0.7, z: 3.2, mat: M.matte('#c8a874'), w: 0.9, L: 10, pitch: 0.5, lift: 1.4 });
    const pale = M.mat('termiteSkin', () => new THREE.MeshPhysicalMaterial({ color: '#f0e6cc', transparent: true, opacity: 0.82, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.4, clearcoatRoughness: 0.4, envMapIntensity: 0.5 }));
    M.ellipsoid(g, 4.6, 2, 1.6, M.matte('#8a6a3a'), [-8.5, 0.2, 3.2]);   // the gut, seen through the skin
    M.ellipsoid(g, 2.2, 1.2, 1, M.matte('#6a4a24'), [-10, 0, 3.4]);
    M.ellipsoid(g, 7.4, 4.9, 3.6, pale, [-8, 0, 3.6]);
    for (let k = 1; k < 6; k++) M.ellipsoid(g, 0.25, 4.6, 3.3, M.matte('#d8c8a0'), [-14.5 + k * 2.4, 0, 3.6]);
    M.ellipsoid(g, 3.4, 3.5, 2.8, M.matte('#ead9b0'), [0, 0, 3.2]);
    M.ellipsoid(g, 4.2, 3.8, 3.2, M.chitin('#d8a050', { coat: 0.3, rough: 0.5 }), [6, 0, 3.2]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 1.2, 0.7, 0.5, M.gloss('#7a4a20'), [8.4, s * 1.3, 4.2]); M.antenna(g, [9, s * 1.8, 3.6], s * 0.7, 2, s * 0.7, 6, 8, M.matte('#c8a878'), 0.7, { rise: 0.2, droop: -0.05 }); }
    if (o.carry === 'mud') M.ellipsoid(g, 4.5, 4, 3.2, M.soil('#6b4a2a'), [14, 0, 3.2]);
    else if (o.carry) { const w = M.part(M.box(10, 4, 3), M.bark('#a07848', { repeat: 1 }), { at: [14, 0, 1.5] }); g.add(w); }
    return g;
  },
  pose(root, o, t) { root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU) : 0); },
});

// Native snail, Bothriembryon: a tall conical shell lying over on its side, a grey granular foot, two pairs of tentacles.
Models.define('snail', {
  buckets: 16,
  variant(o) { return 'z' + Math.round((o.size || 1) * 4) + (o.sealed ? 'S' : ''); },
  key(o, t) { return 'z' + Math.round((o.size || 1) * 4) + (o.sealed ? 'S' : 'e' + SpriteCache.phase(t, 3, 4)); },
  build(M, o) {
    const g = new THREE.Group(), s = Math.round((o.size || 1) * 4) / 4;
    g.scale.setScalar(s);
    if (!o.sealed) {
      M.ellipsoid(g, 19, 6.4, 3.2, M.scales('#8a7e70', { repeat: 2 }), [4, 0, 3]);
      M.ellipsoid(g, 16, 1.4, 0.8, M.matte('#c8c0b4'), [2, 4.6, 1.2]); M.ellipsoid(g, 16, 1.4, 0.8, M.matte('#c8c0b4'), [2, -4.6, 1.2]);
      g.userData.stalks = [];
      for (const sg of [-1, 1]) {
        const st = new THREE.Group(); st.position.set(18, sg * 2, 5); g.add(st);
        M.seg(st, [0, 0, 0], [10, sg * 4.8, 3.5], 0.9, M.skin('#7a6e62'), { cone: 0.5 });
        M.ellipsoid(st, 1.5, 1.5, 1.5, M.eye({ color: '#2a2018' }), [10.2, sg * 4.9, 3.7]);
        g.userData.stalks.push({ st, sg });
        M.seg(g, [20, sg * 1, 2.4], [23.5, sg * 3.2, 2.2], 0.6, M.skin('#7a6e62'), { cone: 0.3 });
      }
    }
    // shell: a lathe of the whorl profile, lying on its side, apex toward -x
    const prof = [];   // whorls: a slim spire that swells in turns, then the big rounded body whorl at the mouth
    for (let i = 0; i <= 26; i++) {
      const k = i / 26, y = -12 + k * 22;
      const r = k < 0.62 ? 9.6 * Math.pow(k / 0.62, 0.85) * (1 + 0.12 * Math.sin(k * 4 * Math.PI - 0.5)) : 9.6 * Math.sqrt(Math.max(0, 1 - Math.pow((k - 0.62) / 0.38, 2)));
      prof.push([Math.max(0.05, r), y]);
    }
    prof.push([0, 10.1]);
    const shellMap = M.paint('snailShell', 256, 128, (ctx, w, h) => {
      const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c89060'); gr.addColorStop(0.5, '#a0683a'); gr.addColorStop(1, '#7a4a24');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
      for (let k = 0; k < 28; k++) { ctx.fillStyle = k % 3 ? 'rgba(255,235,200,.3)' : 'rgba(60,30,10,.35)'; ctx.fillRect(k * w / 28, 0, 1.2, h); }
      for (const v of [0.22, 0.42]) { ctx.fillStyle = 'rgba(40,20,8,.6)'; ctx.fillRect(0, h * v, w, 1.5); }
    });
    const shell = new THREE.Mesh(M.lathe(prof, 28), M.shell('#ffffff', { map: shellMap }));
    shell.castShadow = shell.receiveShadow = true;
    shell.rotation.set(0, 0, Math.PI / 2 + 0.12); shell.rotation.x = 0.1;   // the lathe's axis (y) laid along -x
    shell.position.set(-2, -1, 7.5); g.add(shell);
    if (o.sealed) M.ellipsoid(g, 4, 6.5, 2.4, M.matte('#e8e0d0'), [6, 0, 3]);
    return g;
  },
  pose(root, o, t) { if (!root.userData.stalks) return; const st = Math.sin((SpriteCache.phase(t, 3, 4) + 0.5) / 4 * TAU) * 0.12; for (const q of root.userData.stalks) q.st.rotation.z = q.sg * st; },
});

// Mosquito, Culex (female): slender brown body with pale bands, long banded legs, narrow wings, a long proboscis.
Models.define('mosquito', {
  buckets: 16,
  variant(o) { return 'b' + Math.round((o.blood || 0) * 4); },
  key(o, t) { return 'b' + Math.round((o.blood || 0) * 4) + 'w' + SpriteCache.phase(t, 90, 3); },
  build(M, o) {
    const g = new THREE.Group(), fed = Math.round((o.blood || 0) * 4) / 4;
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
      const a = s * (0.85 + i * 0.75), leg = M.leg(g, [0, s * 0.8, 3.2], a, 16, M.chitin('#4a3a2a', { coat: 0.2 }), 0.6, s * 0.5, { pitch: 0.75, femur: 0.42, tibia: 0.38, tarsus: 0.3 });
      const fem = 16 * 0.42; M.ellipsoid(g, 0.7, 0.7, 0.6, M.matte('#e8e0d0'), [Math.cos(a) * fem * 0.5, s * 0.8 + Math.sin(a) * fem * 0.5, 3.2 + fem * 0.5 * Math.sin(0.75)]);
    }
    const abdMap = M.paint('mozzieAbd' + fed, 128, 64, (ctx, w, h) => { ctx.fillStyle = fed > 0.2 ? '#a81e2a' : '#5a4634'; ctx.fillRect(0, 0, w, h); for (let k = 1; k < 7; k++) { ctx.fillStyle = 'rgba(235,225,200,.75)'; ctx.fillRect(0, h * k / 7 - 1, w, 2); } });
    M.banded(g, 5 + fed, 1.5 + fed * 1.8, 1.4 + fed * 1.6, M.chitin('#ffffff', { map: abdMap, coat: 0.4, rough: 0.5 }), [-5, 0, 3.4]);
    M.ellipsoid(g, 2.2, 1.9, 1.9, M.fur('#6a5440'), [0.6, 0, 3.6]);
    M.pile(g, [0.6, 0, 3.6], 2.3, 2, 2, 30, 0.6, '#9a8060', 11, { lean: 0.3, thick: 0.08 });
    for (const s of [-1, 1]) { M.ellipsoid(g, 0.9, 1.1, 1, M.eye(), [2.6, s * 1.1, 3.9]); M.antenna(g, [3.2, s * 0.4, 3.9], s * 0.5, 1.5, s * 0.5, 3.5, 6, M.chitin('#3a2a1a'), 0.35, { rise: 0.3, droop: 0 }); }
    M.seg(g, [3.2, 0, 3.2], [9.5, 0, 2.8], 0.28, M.chitin('#2a2018'), { full: true });
    g.userData.wings = [];
    for (const s of [-1, 1]) { const w = membraneWing(M, g, [0.5, s * 1, 5.6], 9.5, 2, 'fly', s, { opacity: 0.35, color: '#d8d8d0' }); w.base = 2.7; g.userData.wings.push(w); }
    return g;
  },
  pose(root, o, t) { const flap = Math.sin((SpriteCache.phase(t, 90, 3) + 0.5) / 3 * TAU) * 0.4; for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.5, 0.1, w.s * (w.base - flap)); },
});

// Banded sugar ant, Camponotus consobrinus: heart-shaped black head, orange thorax and front of the gaster,
// black rear with golden hairs, one waist node, long orange legs.
function sugarAntModel(M, o) {
  const g = new THREE.Group(), full = o.honey ? 1.35 : 1;
  g.userData.legs = M.legs6(g, { cx: 3, wide: 2.2, z: 4.6, mat: M.chitin('#b8702e'), w: 1.3, L: 17, pitch: 0.55, lift: 2.2 });
  const gMap = M.paint('sugarGaster' + (o.honey ? 'H' : ''), 128, 128, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1e1612'); gr.addColorStop(0.42, '#1e1612'); gr.addColorStop(0.58, '#d07a30'); gr.addColorStop(1, '#d07a30');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    if (o.honey) { ctx.fillStyle = 'rgba(240,190,60,.45)'; ctx.fillRect(0, 0, w, h * 0.5); }
    for (let k = 1; k < 4; k++) { ctx.fillStyle = 'rgba(120,90,60,.45)'; ctx.fillRect(0, h * (0.12 + k * 0.17), w, 1.5); }
  });
  M.banded(g, 8 * full, 6 * full, 5 * full, M.chitin('#ffffff', { map: gMap, coat: 0.7, rough: 0.4 }), [-11, 0, 5 * full]);
  M.pile(g, [-13, 0, 5 * full], 7 * full, 5.2 * full, 4.4 * full, 80, 1.1, '#d8b060', 12, { lean: 0.6, thick: 0.12 });
  M.ellipsoid(g, 1.9, 2.3, 2.1, M.chitin('#c86a28'), [-4.2, 0, 4.6]);
  M.ellipsoid(g, 3.2, 3.2, 3.2, M.chitin('#d07a30'), [0.5, 0, 5]);
  M.ellipsoid(g, 2.8, 3.6, 3.4, M.chitin('#d8842e'), [4.8, 0, 5.2]);
  M.ellipsoid(g, 5.2, 5.4, 4.2, M.chitin('#221a14'), [10.6, 0, 5]);
  M.ellipsoid(g, 1.8, 2.2, 1.8, M.chitin('#d07a30'), [6, 0, 5]);
  for (const s of [-1, 1]) { M.ellipsoid(g, 1.6, 1.3, 1.3, M.eye(), [11.4, s * 4.0, 6.4], s * 0.3); M.seg(g, [14.8, s * 1.8, 4.4], [17.6, s * 1.2, 4.2], 0.8, M.gloss('#3a2a1a'), { cone: 0.2 }); M.antenna(g, [14, s * 2.4, 5.6], s * 1.1, 5.5, s * 0.3, 9, 9, M.chitin('#5a3a1a'), 0.9, { rise: 0.4, droop: 0.05 }); }
  if (o.crumbs) for (let i = 0; i < o.crumbs; i++) M.ellipsoid(g, 2.4, 2.2, 1.8, M.soil('#8a6a42'), [17.5 + (i % 2) * 3, (i - 1.5) * 2.4, 1.8]);
  return g;
}
Models.define('sugarAnt', {
  buckets: 16,
  variant(o) { return (o.honey ? 'H' : '') + 'c' + (o.crumbs || 0); },
  key(o, t) { return (o.honey ? 'H' : '') + 'c' + (o.crumbs || 0) + (o.moving ? 'm' + SpriteCache.phase(t, 18, 8) : 'x'); },
  build(M, o) { return sugarAntModel(M, o); },
  pose(root, o, t) { root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU) : 0); },
});
Models.define('queenSugar', {
  buckets: 8,
  key(o) { return (o.honey ? 'H' : ''); },
  build(M, o) { const g = sugarAntModel(M, Object.assign({}, o, { crumbs: 0 })); g.scale.setScalar(1.4); return g; },
});

// Queen bull ant: the worker's shape, bigger, with four veined wings while she still has them.
Models.define('queenAnt', {
  buckets: 16,
  variant(o) { return (o.wings ? 'W' : '') + (o.carry || ''); },
  key(o, t) { return (o.wings ? 'W' + (o.flying ? 'f' + SpriteCache.phase(t, 50, 3) : 's') : '') + (o.moving ? 'm' + SpriteCache.phase(t, 18, 8) : 'x') + (o.carry || ''); },
  build(M, o) {
    const g = new THREE.Group(), ant = Models.defs.ant.build(M, o); ant.scale.setScalar(1.12); g.add(ant); g.userData.legs = ant.userData.legs;
    g.userData.wings = [];
    if (o.wings) for (const s of [-1, 1]) {
      const fw = membraneWing(M, g, [4, s * 1.5, 12.2], 24, 5.5, 'bee', s, { opacity: 0.3, color: '#ece4d4' }); fw.base = 2.75; g.userData.wings.push(fw);
      const hw = membraneWing(M, g, [3, s * 1.5, 12.0], 17, 4, 'bee', s, { opacity: 0.26, color: '#ece4d4' }); hw.base = 2.55; g.userData.wings.push(hw);
    }
    return g;
  },
  pose(root, o, t) {
    root.userData.legs.pose(o.moving ? Math.sin((SpriteCache.phase(t, 18, 8) + 0.5) / 8 * TAU) : 0);
    const flap = o.flying ? Math.sin((SpriteCache.phase(t, 50, 3) + 0.5) / 3 * TAU) * 0.3 : 0.4;
    for (const w of root.userData.wings) w.hinge.rotation.set(-w.s * flap * 0.4, 0.1, w.s * (w.base - flap));
  },
});

// Golden orb-weaver, Trichonephila edulis (female): long grey-brown abdomen with silvery patches, silver-haired
// cephalothorax, long dark legs with yellow joints.
Models.define('orbSpider', {
  buckets: 16,
  key(o, t) { return o.moving ? 'm' + SpriteCache.phase(t, 16, 8) : 'x'; },
  build(M) {
    const g = new THREE.Group(), dark = M.chitin('#2a2018', { coat: 0.5 }), gold = M.chitin('#e8b030', { coat: 0.6 });
    g.userData.legs = [];
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const a = s * [0.45, 0.9, 1.9, 2.5][i], l = [30, 26, 17, 24][i];
      const leg = spiderLeg(M, g, [2, s * 1, 4], a, l, dark, 1.3, s * (i < 2 ? -0.35 : 0.35), { pitch: 0.75 });
      leg.base = a; leg.i = i; leg.s = s; g.userData.legs.push(leg);
      // yellow bands at the joints: small rings around the femur base and the knee
      const fem = l * 0.44, p = 0.75;
      M.ellipsoid(g, 1.3, 1.0, 1.0, gold, [2 + Math.cos(a) * fem * 0.25 * Math.cos(p), s * 1 + Math.sin(a) * fem * 0.25 * Math.cos(p), 4 + fem * 0.25 * Math.sin(p)], a);
      M.ellipsoid(g, 1.5, 1.1, 1.1, gold, [2 + Math.cos(a) * fem * Math.cos(p), s * 1 + Math.sin(a) * fem * Math.cos(p), 4 + fem * Math.sin(p)], a);
    }
    const abd = M.paint('orbAbd', 128, 128, (ctx, w, h) => { ctx.fillStyle = '#8a8070'; ctx.fillRect(0, 0, w, h); for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(240,240,225,.8)'; ctx.beginPath(); ctx.ellipse(w / 2, h * (0.15 + k * 0.2), w * 0.3 - k * 4, h * 0.05, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(60,50,40,.45)'; ctx.fillRect(w * 0.2, 0, 2, h); ctx.fillRect(w * 0.8, 0, 2, h); });
    M.banded(g, 10, 4.8, 4.4, M.chitin('#ffffff', { map: abd, coat: 0.3, rough: 0.6 }), [-9, 0, 4.4]);
    M.ellipsoid(g, 4.8, 4.2, 3.6, M.fur('#4a4038'), [4, 0, 3.6]);
    M.pile(g, [4, 0, 3.6], 4.9, 4.3, 3.7, 90, 0.9, '#e0e0d4', 13, { lean: 0.2, thick: 0.1 });
    for (const s of [-1, 1]) { M.ellipsoid(g, 0.8, 0.8, 0.8, M.eye(), [8, s * 1.4, 5.2]); M.ellipsoid(g, 0.6, 0.6, 0.6, M.eye(), [7, s * 2.8, 5.4]); M.seg(g, [8, s * 1, 3.2], [11, s * 2.4, 2.8], 0.5, M.chitin('#3a3028'), { cone: 0.2 }); }
    return g;
  },
  pose(root, o, t) { const w = o.moving ? Math.sin((SpriteCache.phase(t, 16, 8) + 0.5) / 8 * TAU) * 0.2 : 0; for (const l of root.userData.legs) l.set(l.base + (l.i % 2 ? w : -w) * l.s, 0); },
});

// Sandhopper, seen from the side (the beach level): a curved body of overlapping plates, seven pairs of legs,
// long second antennae, a brood pouch of eggs; the picture faces right and is turned for o.face.
function sandhopperModel(M, o, scale) {
  const g = new THREE.Group();
  if (scale) g.scale.setScalar(scale);
  const air = o.air ? 1 : 0;
  g.userData.legs = [];
  for (let i = 0; i < 7; i++) {
    const x = 9 - i * 3.2, a0 = (i < 3 ? -0.5 : 0.4) + air * (i < 3 ? -0.6 : 0.6);
    for (const side of [-1, 1]) {   // both sides: the far side a little higher and darker
      const grp = new THREE.Group(); grp.position.set(x, side * 1.6, 0); g.add(grp);
      M.seg(grp, [0, 0, 4.5], [Math.sin(a0) * 4, 0, 4.5 - Math.cos(a0) * 4], 0.55, M.chitin(side > 0 ? '#b89a7a' : '#9a7e62', { coat: 0.4 }), { full: true });
      M.seg(grp, [Math.sin(a0) * 4, 0, 4.5 - Math.cos(a0) * 4], [Math.sin(a0) * 4 + (i < 3 ? 1 : -1) * 2, 0, 0.3], 0.45, M.chitin(side > 0 ? '#b89a7a' : '#9a7e62', { coat: 0.4 }), { cone: 0.1 });
      g.userData.legs.push({ grp, i });
    }
  }
  const plate = (i) => M.chitin(i % 2 ? '#c8ab88' : '#d4b894', { coat: 0.6, rough: 0.35 });
  for (let i = 7; i >= 0; i--) {
    const x = 9 - i * 3.3, zc = 7 - (Math.sin(i * 0.45) * 2.4 - (i > 5 ? (i - 5) * 1.5 : 0));
    const m = M.ellipsoid(g, 3.6, 3.2, 5 - i * 0.18, plate(i), [x, 0, zc]); m.rotation.y = (-0.5 + i * 0.16) * 0.3;
  }
  for (const k of [0, 1]) M.seg(g, [-16, (k ? 1 : -1) * 0.8, 10], [-21 - k * 2, (k ? 1 : -1) * 0.8, 5 - k * 3 + air * 4], 0.6, M.chitin('#a88a6a'), { cone: 0.1 });
  if (o.eggs !== false) { M.ellipsoid(g, 6, 2.4, 2.6, M.mat('pouch', () => new THREE.MeshPhysicalMaterial({ color: '#f0e6d4', transparent: true, opacity: 0.7, roughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') })), [3, 0, 2.2]); for (let i = 0; i < 4; i++) M.ellipsoid(g, 0.9, 0.9, 0.9, M.matte('#7a8a5a'), [0 + i * 2, 0, 2]); }
  M.ellipsoid(g, 3.6, 3.2, 3.4, M.chitin('#d0b28e'), [12, 0, 8]);
  M.ellipsoid(g, 1.6, 1.6, 1.6, M.eye({ color: '#151010' }), [13, 1.8, 9]);
  for (const side of [-1, 1]) { M.seg(g, [15, side * 1, 9], [19, side * 1.2, 13], 0.4, M.chitin('#9a7a5a'), { full: true }); M.seg(g, [19, side * 1.2, 13], [23, side * 1.4, 12], 0.3, M.chitin('#9a7a5a'), { cone: 0.1 }); }
  g.userData.feelers = [];
  for (const side of [-1, 1]) { const f = new THREE.Group(); f.position.set(15, side * 1.4, 7); g.add(f); M.seg(f, [0, 0, 0], [6, 0, 1], 0.5, M.chitin('#9a7a5a'), { full: true }); M.seg(f, [6, 0, 1], [13, 0, -3], 0.4, M.chitin('#9a7a5a'), { cone: 0.1 }); g.userData.feelers.push(f); }
  return g;
}
Models.define('sandhopper', {
  view: 'side',
  variant(o) { return (o.air ? 'A' : '') + (o.eggs === false ? 'n' : 'e'); },
  key(o, t) { return (o.air ? 'A' : '') + (o.eggs === false ? 'n' : 'e') + (o.face < 0 ? 'L' : 'R') + (o.moving ? 'm' + SpriteCache.phase(t, 20, 6) : 'x') + 'f' + SpriteCache.phase(t, 6, 4); },
  build(M, o) { return sandhopperModel(M, o); },
  pose(root, o, t) {
    const walk = o.moving ? Math.sin((SpriteCache.phase(t, 20, 6) + 0.5) / 6 * TAU) : 0;
    for (const { grp, i } of root.userData.legs) grp.rotation.y = (i % 2 ? walk : -walk) * 0.35;
    const f = Math.sin((SpriteCache.phase(t, 6, 4) + 0.5) / 4 * TAU) * 0.1;
    for (const q of root.userData.feelers) q.rotation.y = f;
  },
});
Models.define('babyHopper', {
  view: 'side',
  key(o, t) { return (o.face < 0 ? 'L' : 'R') + 'm' + SpriteCache.phase(t, 20, 6); },
  build(M, o) { return sandhopperModel(M, { eggs: false }, 0.45); },
  pose(root, o, t) { const walk = Math.sin((SpriteCache.phase(t, 20, 6) + 0.5) / 6 * TAU); for (const { grp, i } of root.userData.legs) grp.rotation.y = (i % 2 ? walk : -walk) * 0.35; },
});
