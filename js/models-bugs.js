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
