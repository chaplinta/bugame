'use strict';
// 3D models of London's bugs (js/london.js), seen side-on like the click beetle: x forward, z up, the feet on the
// ground at z = 0, the 2D drawings (js/art-london.js) the same size in the same units. Wings stand up in the picture
// on hinges and beat in pose(); the keys carry the facing (L/R) and the wingbeat phase.

// A wing standing on a hinge above the back, pointing backwards; pose turns hinge.rotation.y (up is positive)
function sideWingModel(M, g, at, len, wid, kind, color, opacity) {
  const w = membraneWing(M, g, at, len, wid, kind, 1, { color, opacity });
  w.mesh.rotation.x = Math.PI / 2;    // stood up in the picture
  w.hinge.rotation.z = Math.PI;       // pointing back along the body
  return w;
}
const sideKey = (o, t, rate) => (o.face < 0 ? 'L' : 'R') + (o.flying ? 'f' + SpriteCache.phase(t, rate, 3) : o.moving ? 'm' + SpriteCache.phase(t, 16, 4) : 'x');
function sidePose(root, o, t, rate, rest, swing) {
  const u = root.userData;
  if (u.legs) u.legs.pose(o.moving && !o.flying ? Math.sin((SpriteCache.phase(t, 16, 4) + 0.5) / 4 * TAU) : 0);
  const beat = o.flying ? Math.sin((SpriteCache.phase(t, rate, 3) + 0.5) / 3 * TAU) : 0;
  (u.wings || []).forEach((w, i) => { w.hinge.rotation.y = rest + beat * swing + (i ? 0.25 * beat : 0); });
}

Models.define('bumblebee', {
  // Buff-tailed bumblebee worker: black, a yellow collar and band, a whitish tail; pollen baskets when loaded
  view: 'side',
  variant(o) { return o.pollen ? 'p' : ''; },
  key(o, t) { return sideKey(o, t, 80) + (o.pollen ? 'p' : ''); },
  build(M, o) {
    const g = new THREE.Group(), black = M.fur('#1c1814'), yellow = M.fur('#e8c228');
    g.userData.legs = M.legs6(g, { cx: 1, wide: 1.8, z: 4, mat: M.chitin('#1a1410'), w: 0.7, L: 7, pitch: 0.6, lift: 1.2 });
    M.ellipsoid(g, 7.4, 5.8, 5.8, black, [-6, 0, 7.4]);
    M.ellipsoid(g, 1.6, 6, 6, yellow, [-4.6, 0, 7.4]);
    M.ellipsoid(g, 3, 4.4, 4.4, M.fur('#f0ece0'), [-12, 0, 7.2]);
    M.pile(g, [-6, 0, 7.4], 7.5, 5.9, 5.9, 120, 0.9, '#2a241c', 41, { lean: 0.3, thick: 0.12 });
    M.ellipsoid(g, 4.6, 4.8, 4.8, black, [3, 0, 7.8]);
    M.ellipsoid(g, 1.5, 4.9, 4.9, yellow, [5.4, 0, 7.8]);
    M.pile(g, [3, 0, 7.8], 4.7, 4.9, 4.9, 90, 0.9, '#2a241c', 42, { lean: 0.3, thick: 0.12 });
    M.ellipsoid(g, 2.7, 2.9, 3, M.chitin('#141010'), [8.4, 0, 6.8]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1, 1.4, 1.7, M.eye({ color: '#0a0a0a' }), [8.8, s * 1.8, 7.4]);
    for (const s of [-1, 1]) M.antenna(g, [9.6, s * 0.8, 8.6], s * 0.2, 2.4, s * 0.1, 3, 4, M.chitin('#141010'), 0.5, { rise: 0.6, droop: -0.3 });
    if (o.pollen) for (const s of [-1, 1]) M.ellipsoid(g, 2.2, 1.4, 1.6, M.matte('#e8a020'), [-3.6, s * 2.4, 1.6]);
    g.userData.wings = [sideWingModel(M, g, [2, 0.6, 13.4], 11, 3.2, 'bee', '#d0d0dc', 0.42), sideWingModel(M, g, [2, -0.6, 13.4], 11, 3.2, 'bee', '#d0d0dc', 0.42)];   // above the fur
    return g;
  },
  pose(root, o, t) { sidePose(root, o, t, 80, 0.35, 0.9); },
});

Models.define('commonWasp', {
  // Common wasp worker: yellow and black, a narrow waist, wings folded along the back at rest
  view: 'side',
  key(o, t) { return sideKey(o, t, 90); },
  build(M) {
    const g = new THREE.Group(), black = M.chitin('#16120c', { coat: 0.7 }), yellow = M.chitin('#f0c818', { coat: 0.7 });
    g.userData.legs = M.legs6(g, { cx: 1.6, wide: 1.4, z: 3.4, mat: M.chitin('#d8b020'), w: 0.55, L: 7, pitch: 0.6, lift: 1 });
    for (let k = 0; k < 5; k++) M.ellipsoid(g, 1.6, 3.6 - k * 0.5, 3.6 - k * 0.5, k % 2 ? black : yellow, [-3.4 - k * 2.4, 0, 6 - k * 0.2]);
    M.seg(g, [-1.8, 0, 6.2], [0.4, 0, 6.4], 0.6, black);                     // the waist
    M.ellipsoid(g, 3.8, 3.2, 3.4, black, [3.2, 0, 6.6]);
    M.ellipsoid(g, 2, 3.3, 0.8, yellow, [3.6, 0, 9.4]);
    M.ellipsoid(g, 2.4, 2.8, 2.8, black, [7.6, 0, 6]);
    M.ellipsoid(g, 1.2, 2, 1.6, yellow, [8.6, 0, 4.8]);                      // the yellow face
    for (const s of [-1, 1]) M.ellipsoid(g, 0.9, 1.2, 1.8, M.eye({ color: '#1a1208' }), [7.8, s * 1.6, 6.6]);
    for (const s of [-1, 1]) M.antenna(g, [8.6, s * 0.8, 7.8], s * 0.2, 2, s * 0.1, 3.6, 5, black, 0.45, { rise: 0.7, droop: -0.4 });
    g.userData.wings = [sideWingModel(M, g, [1.8, 0.5, 9.4], 10.5, 2.2, 'bee', '#e8d8a8', 0.32), sideWingModel(M, g, [1.8, -0.5, 9.4], 10.5, 2.2, 'bee', '#e8d8a8', 0.32)];
    return g;
  },
  pose(root, o, t) { sidePose(root, o, t, 90, 0.12, 0.9); },
});

Models.define('ugMosquito', {
  // The Underground mosquito: slender and brown, long legs, a long mouthpart; red and swollen once she has fed
  view: 'side',
  variant(o) { return o.blood > 0 ? 'b' : ''; },
  key(o, t) { return sideKey(o, t, 130) + (o.blood > 0 ? 'b' : ''); },
  build(M, o) {
    const g = new THREE.Group(), brown = M.chitin('#6a5440'), dark = M.chitin('#3a2e22');
    g.userData.legs = M.legs6(g, { cx: 1, wide: 1, z: 6, mat: dark, w: 0.32, L: 10, pitch: 0.75, lift: 1 });
    const full = o.blood > 0;
    M.ellipsoid(g, 6.2, full ? 2.4 : 1.6, full ? 2.4 : 1.6, full ? M.gloss('#a02818', { rough: 0.4 }) : brown, [-5.5, 0, 6.4]);
    M.ellipsoid(g, 2.4, 2, 2.2, brown, [1.8, 0, 7]);
    M.ellipsoid(g, 1.3, 1.3, 1.3, dark, [4.8, 0, 6.4]);
    for (const s of [-1, 1]) M.ellipsoid(g, 0.6, 0.6, 0.9, M.eye({ color: '#141008' }), [5, s * 0.8, 6.6]);
    M.seg(g, [5.8, 0, 5.8], [11.5, 0, 4], 0.25, dark, { cone: 0.3 });        // the mouthpart
    for (const s of [-1, 1]) M.seg(g, [5.4, s * 0.4, 7.2], [8.4, s * 0.8, 9.6], 0.2, dark);
    g.userData.wings = [sideWingModel(M, g, [0.6, 0.4, 8.6], 8.4, 1.4, 'fly', '#d8d8d0', 0.35), sideWingModel(M, g, [0.6, -0.4, 8.6], 8.4, 1.4, 'fly', '#d8d8d0', 0.35)];
    return g;
  },
  pose(root, o, t) { sidePose(root, o, t, 130, 0.08, 1); },
});

Models.define('tigerMoth', {
  // Jersey tiger moth: black forewings striped with cream, folded like a roof at rest; flying, they open over the
  // orange hindwings
  view: 'side',
  variant(o) { return o.flying ? 'f' : ''; },
  key(o, t) { return sideKey(o, t, 22); },
  build(M, o) {
    const g = new THREE.Group(), T = THREE;
    g.userData.legs = M.legs6(g, { cx: 1.4, wide: 1.4, z: 4, mat: M.chitin('#2a221c'), w: 0.5, L: 6, pitch: 0.6, lift: 1 });
    M.ellipsoid(g, 7, 2.4, 2.6, M.fur('#e8a050'), [-3, 0, 7.4]);
    M.ellipsoid(g, 2.6, 2.4, 2.6, M.fur('#2a2420'), [3.6, 0, 8]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1, 0.9, 1.2, M.eye({ color: '#141008' }), [6, s * 1, 8]);
    for (const s of [-1, 1]) M.antenna(g, [6.4, s * 0.6, 9], s * 0.2, 1.8, s * 0.1, 4.4, 5, M.chitin('#2a221c'), 0.4, { rise: 0.9, droop: -0.3 });
    const fore = M.paint('jerseyTigerFore', 128, 64, (ctx, w, h) => {
      ctx.fillStyle = '#1e1a18'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f2ead2'; ctx.lineWidth = 5;
      for (const [a, b] of [[[0, 10], [w, 20]], [[30, 0], [20, h]], [[70, 0], [56, h]], [[108, 0], [100, h]]]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    });
    const hind = M.paint('jerseyTigerHind', 64, 64, (ctx, w, h) => { ctx.fillStyle = '#e86a1a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#1a1410'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(14 + k * 12, 20 + (k % 2) * 16, 5, 0, TAU); ctx.fill(); } });
    const wing = (map, len, wid) => { const m = new T.Mesh(M.geo('mothWing|' + len + '|' + wid, () => new T.PlaneGeometry(len, wid)), M.mat('mothWing|' + map.uuid, () => new T.MeshStandardMaterial({ map, roughness: 0.85, side: T.DoubleSide }))); m.castShadow = true; return m; };
    g.userData.wings = [];
    for (const [s, map, len, wid] of [[1, hind, 11, 7], [0, fore, 16, 6]]) {
      const hinge = new T.Group(); hinge.position.set(2, s ? -0.6 : 0.6, 9); g.add(hinge);
      const m = wing(map, len, wid); m.rotation.x = Math.PI / 2; m.position.set(-len / 2, 0, wid / 2 - 1); hinge.add(m);
      g.userData.wings.push({ hinge });
    }
    return g;
  },
  pose(root, o, t) {
    const u = root.userData, beat = o.flying ? Math.sin((SpriteCache.phase(t, 22, 3) + 0.5) / 3 * TAU) : 0;
    u.legs.pose(o.moving && !o.flying ? Math.sin((SpriteCache.phase(t, 16, 4) + 0.5) / 4 * TAU) : 0);
    u.wings[0].hinge.rotation.y = o.flying ? 0.9 + beat * 0.6 : -0.05;     // the orange hindwing shows in flight
    u.wings[1].hinge.rotation.y = o.flying ? 1.1 + beat * 0.6 : 0.12;
  },
});

// Stag beetles: chestnut wing cases, a black front; the male with huge antler-like jaws. Flying, he tips up with his
// wing cases open and wings buzzing (the warm-up shows them too).
function stagModel(M, o, male) {
  const g = new THREE.Group(), chest = M.chitin('#5a2a14', { coat: 0.9, rough: 0.3 }), black = M.chitin('#1a1210', { coat: 0.7 }), jaw = M.chitin('#7a3418', { coat: 0.9, rough: 0.3 });
  const body = new THREE.Group(); g.add(body); g.userData.body = body;
  g.userData.legs = M.legs6(body, { cx: 2, wide: 2.6, z: 4.4, mat: M.chitin('#1a110c'), w: 0.8, L: 11, pitch: 0.6, lift: 1.4 });
  const open = o.flying || o.warm;
  const cases = new THREE.Group(); body.add(cases); cases.position.set(1, 0, 10);
  for (const s of [-1, 1]) { const m = M.ellipsoid(cases, 10, 3.2, 3.4, chest, [-8, s * 3, -2]); if (open) m.rotation.x = s * 0.6; }
  if (open) for (const s of [-1, 1]) { const w = membraneWing(M, body, [0, s * 2, 12], 20, 5, 'bee', s, { color: '#e8d8b8', opacity: 0.3 }); w.mesh.rotation.x = s * 1.2; w.hinge.rotation.z = Math.PI + s * 0.5; }
  else M.ellipsoid(body, 10, 6.2, 5.4, chest, [-7, 0, 8]);
  M.ellipsoid(body, 4.4, 5.2, 4.2, black, [5, 0, 8.4]);
  M.ellipsoid(body, male ? 4.2 : 3.4, male ? 5.4 : 4, 3.2, black, [10.2, 0, 7.6]);
  for (const s of [-1, 1]) M.ellipsoid(body, 0.9, 0.9, 1, M.eye({ color: '#0a0806' }), [11, s * (male ? 5 : 3.8), 8.2]);
  for (const s of [-1, 1]) M.antenna(body, [12, s * 2.6, 8.6], s * 0.6, 2.4, s * 0.3, 2.6, 3, black, 0.5, { rise: 0.4, droop: -0.2 });
  for (const s of [-1, 1]) {
    if (male) { M.seg(body, [12.6, s * 2.2, 8], [19, s * 4.4, 13], 1.4, jaw, { cone: 0.6 }); M.seg(body, [19, s * 4.4, 13], [24, s * 1.6, 13.6], 1, jaw, { cone: 0.3 }); M.seg(body, [20, s * 4, 12.4], [21, s * 2.4, 10.8], 0.5, jaw); }
    else M.seg(body, [12.4, s * 1.6, 7.4], [15.4, s * 0.8, 7.8], 0.7, jaw, { cone: 0.3 });
  }
  return g;
}
for (const [name, male] of [['stagBeetle', true], ['stagBeetleF', false]]) {
  Models.define(name, {
    view: 'side',
    variant(o) { return o.flyT > 0 || o.warmT > 0 ? 'f' : ''; },
    key(o, t) { const f = o.flyT > 0 || o.warmT > 0; return (o.face < 0 ? 'L' : 'R') + (f ? 'f' + SpriteCache.phase(t, 55, 2) : o.moving ? 'm' + SpriteCache.phase(t, 12, 4) : 'x'); },
    build(M, o) { return stagModel(M, { flying: o.flyT > 0, warm: o.warmT > 0 }, male); },
    pose(root, o, t) {
      const u = root.userData, fly = o.flyT > 0;
      u.legs.pose(o.moving && !fly ? Math.sin((SpriteCache.phase(t, 12, 4) + 0.5) / 4 * TAU) : 0);
      u.body.rotation.y = fly ? -0.55 : 0;                                   // tipped up in flight
      u.body.position.z = fly ? 6 : 0;
    },
  });
}
