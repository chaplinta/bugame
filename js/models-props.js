'use strict';
// 3D models of the plants, the things lying about the levels, the secrets, and the isometric yard
// (people and furniture seen from up high). Same frame and kit as the other model files; the sizes
// follow the 2D drawings so collisions and placement stay as they were.

// ---------------------------------------------------------------- shared shapes
// A petal outline along +x from its base: 'round', 'pointed' or 'notched' (a dip at the tip).
function petalPts(len, wid, kind) {
  const p = [[0, 0]], q = (p0, c, p1, n) => { for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); } };
  if (kind === 'pointed') { q([0, 0], [len * 0.45, -wid], [len, 0], 8); q([len, 0], [len * 0.45, wid], [0, 0], 8); }
  else if (kind === 'notched') { q([0, 0], [len * 0.4, -wid * 1.1], [len * 0.9, -wid * 0.55], 8); p.push([len, -wid * 0.25], [len * 0.86, 0], [len, wid * 0.25]); q([len * 0.9, wid * 0.55], [len * 0.4, wid * 1.1], [0, 0], 8); }
  else { q([0, 0], [len * 0.4, -wid * 1.1], [len, -wid * 0.15], 8); q([len, -wid * 0.15], [len * 1.03, 0], [len, wid * 0.15], 2); q([len, wid * 0.15], [len * 0.4, wid * 1.1], [0, 0], 8); }
  return p;
}
// A petal geometry, cupped a little (the edges rise), with normalised UVs.
function petalGeo(M, key, len, wid, kind) {
  return M.geo('petal|' + key, () => {
    const g = M.shape(petalPts(len, wid, kind), { uv: true }), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setZ(i, (y / wid) * (y / wid) * wid * 0.25); }
    pos.needsUpdate = true; g.computeVertexNormals(); return g;
  });
}
// n copies of a flat part round a centre at height z, each lifted at the tip by `tilt`, turned by `phase`.
function ring(parent, n, geo, mat, z, tilt, r0, phase, fn) {
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + (phase || 0), m = new THREE.Mesh(geo, typeof mat === 'function' ? mat(i) : mat);
    m.castShadow = m.receiveShadow = true; m.position.set(Math.cos(a) * r0, Math.sin(a) * r0, z); m.rotation.set(0, -tilt, a);
    if (fn) fn(m, i, a);
    parent.add(m);
  }
}
// Strap leaves lying out from the base: n blades round the centre, length L, half width w, leaning over.
function strapLeaves(M, parent, n, L, w, col, seed, o) {
  o = o || {};
  const r = rng(seed);
  return M.hairs(parent, n, TileModels.bladeGeo(M, 1), M.leaf('#ffffff'), (i, d) => {
    const a = i / n * TAU + (o.phase || 0) + r() * 0.4, l = L * (0.75 + r() * 0.35);
    d.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, o.z || 1); d.rotation.order = 'ZYX'; d.rotation.set(0, o.lean === undefined ? 1.25 : o.lean, a); d.scale.set(1.5, w / 0.55, l);
    return i % 2 ? col : tint(col, 0.12);
  });
}
// A flower head's centre: a flattened dome with a sprinkle of dots.
function disc(M, parent, r, col, dots, dotCol, z) {
  M.ellipsoid(parent, r, r, r * 0.45, M.matte(col, { rough: 0.8 }), [0, 0, z]);
  if (dots) M.hairs(parent, dots, M.sphere(1, 6), M.gloss(dotCol, { rough: 0.6 }), (k, d) => { const b = k * 2.4, rd = r * 0.9 * Math.sqrt(k / dots); d.position.set(Math.cos(b) * rd, Math.sin(b) * rd, z + r * 0.42 * Math.sqrt(Math.max(0, 1 - (rd / r) ** 2)) + 0.3); d.scale.setScalar(r * 0.11); });
}
const flowerKey = (o) => 'p' + (o.pollen === undefined ? '' : (o.pollen ? 1 : 0)) + 'n' + (o.nectar === undefined ? '' : (o.nectar ? 1 : 0)) + 'l' + (o.leaf === undefined ? '' : Math.round(o.leaf * 5));

// ---------------------------------------------------------------- flowers of the bee and butterfly levels
Models.define('paw', {
  // Kangaroo paw, Anigozanthos manglesii: strap leaves, a furry red stalk leaning over, a one-sided row of
  // tubular flowers, red at the base and green at the tips, which split into claws.
  buckets: 8, variant: flowerKey, key: flowerKey,
  build(M, o) {
    const g = new THREE.Group(), r = rng(o.seed || 5), T = THREE;
    strapLeaves(M, g, 7, 20, 1.1, '#5a8a3a', 5, { lean: 1.2 });
    const a0 = -0.5, top = [Math.cos(a0) * 22, Math.sin(a0) * 22, 26];
    M.seg(g, [0, 0, 0], top, 1.4, M.fur('#b02a1e'), { cone: 1 });
    for (let i = 0; i < 6; i++) {
      const k = (i + 1.5) / 8, base = [top[0] * k, top[1] * k, top[2] * k], side = a0 - 1.2 - i * 0.08;
      const dir = new T.Vector3(Math.cos(side) * 0.75, Math.sin(side) * 0.75, 0.65).normalize();
      const mid = [base[0] + dir.x * 8, base[1] + dir.y * 8, base[2] + dir.z * 8], tip = [base[0] + dir.x * 15, base[1] + dir.y * 15, base[2] + dir.z * 15];
      M.seg(g, base, mid, 1.7, M.fur('#c0301e'), { full: true });
      M.seg(g, mid, tip, 1.5, M.fur('#4aa030'), { full: true });
      for (const c of [-1, 0, 1]) { const ca = side + c * 0.5; M.seg(g, tip, [tip[0] + Math.cos(ca) * 3, tip[1] + Math.sin(ca) * 3, tip[2] + 1.5 - Math.abs(c)], 0.5, M.matte('#3e8a1e'), { cone: 0.1 }); }
    }
    return g;
  },
});

Models.define('grevillea', {
  // Grevillea: divided leaves, a spider flower of curled red styles with yellow tips rising from pink tubes.
  buckets: 8, variant: flowerKey, key: flowerKey,
  build(M, o) {
    const g = new THREE.Group(), r = rng(o.seed || 6), pale = o.nectar === false, red = pale ? '#e8a0a0' : '#d8303a';
    const leaf = PlantShapes.leafGeo(M, 'grev', 7, 1.1, 0.3), lm = M.leaf('#4f7a3a');
    for (let i = 0; i < 6; i++) {
      const a = i * 1.05;
      M.seg(g, [0, 0, 1.5], [Math.cos(a) * 16, Math.sin(a) * 16, 1.2], 0.4, M.bark('#4a6a30'), { full: true });
      for (let k = 0; k < 3; k++) { const d = 5 + k * 4, s = k % 2 ? 0.6 : -0.6, m = new THREE.Mesh(leaf, lm); m.castShadow = m.receiveShadow = true; m.position.set(Math.cos(a) * d + Math.cos(a) * 7, Math.sin(a) * d + Math.sin(a) * 7, 1.6); m.rotation.set(0, -0.1, a + s); g.add(m); }
    }
    for (let i = 0; i < 10; i++) {
      const a = i * 0.63 + r() * 0.2, l = 8 + r() * 4, pts = [[0, 0, 2.5], [Math.cos(a + 0.4) * l * 0.6, Math.sin(a + 0.4) * l * 0.6, 7], [Math.cos(a) * l, Math.sin(a) * l, 5]];
      const m = new THREE.Mesh(M.tube(pts, 0.8, 0.5), M.gloss(red, { rough: 0.5 })); m.castShadow = true; g.add(m);
      M.ellipsoid(g, 1.4, 1.4, 1.4, M.gloss('#f2d040', { rough: 0.5 }), [Math.cos(a) * (l + 0.6), Math.sin(a) * (l + 0.6), 5]);
    }
    for (let i = 0; i < 6; i++) M.ellipsoid(g, 1.9, 1.5, 1.4, M.matte(pale ? '#e0b0b0' : '#e0607a'), [Math.cos(i * 1.05) * 2.6, Math.sin(i * 1.05) * 2.6, 2.6], i * 1.05);
    return g;
  },
});

Models.define('everlasting', {
  // Pink everlasting: a rosette of leaves under many narrow papery bracts round a yellow disc.
  buckets: 8, variant: flowerKey, key: flowerKey,
  build(M, o) {
    const g = new THREE.Group(), lf = o.leaf === undefined ? 1 : o.leaf, pale = o.nectar === false;
    strapLeaves(M, g, 6, 17 * (0.4 + lf * 0.6), 1.6, '#5f9a3a', 7, { lean: 1.3, phase: 0.3 });
    M.seg(g, [0, 0, 0], [0, 0, 8], 0.6, M.matte('#6a8a40'), { full: true });
    const bract = petalGeo(M, 'everl', 10.5, 1.1, 'pointed'), pm = M.petal(pale ? '#e8c8d0' : '#f2a0c0');
    ring(g, 20, bract, pm, 8, 0.25, 2.2, 0, (m, i) => { m.scale.x = i % 2 ? 1.05 : 0.9; m.rotation.z += (i % 2) * 0.1; });
    disc(M, g, 4.6, '#e8b030', 18, '#f8d060', 8.2);
    return g;
  },
});

Models.define('capeweed', {
  // Capeweed: a rosette of lobed grey-green leaves, yellow rays with a dark base, a blackish centre.
  buckets: 8, variant: flowerKey, key: flowerKey,
  build(M, o) {
    const g = new THREE.Group(), lf = o.leaf === undefined ? 1 : o.leaf, L = 13 * (0.7 + lf * 0.3);
    const lobed = M.geo('capeweedLeaf|' + L.toFixed(1), () => { const pts = [[0, 0]]; for (let k = 1; k <= 5; k++) pts.push([L * k / 5, -(k % 2 ? 4.8 : 2.4) * Math.sin(k / 5.5 * Math.PI)]); pts.push([L, 0]); for (let k = 5; k >= 1; k--) pts.push([L * k / 5, (k % 2 ? 4.8 : 2.4) * Math.sin(k / 5.5 * Math.PI)]); const sh = M.shape(pts, { uv: true }), pos = sh.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, -Math.abs(pos.getY(i)) * 0.15); pos.needsUpdate = true; sh.computeVertexNormals(); return sh; });
    ring(g, 7, lobed, (i) => M.leaf(i % 2 ? '#8aa070' : '#9ab080', { repeat: 2 }), 1.2, -0.08, 0, 0.2, (m, i) => { m.position.z = 1 + (i % 3) * 0.5; });
    M.seg(g, [0, 0, 0], [0, 0, 6], 0.5, M.matte('#6a8a40'), { full: true });
    const ray = petalGeo(M, 'capeweedRay', 7, 1.6, 'round'), ym = M.petal('#f2d040');
    ring(g, 16, ray, ym, 6, 0.2, 2, 0, (m) => { M.ellipsoid(m, 1.2, 1.1, 0.3, M.matte('#8a6020'), [1.2, 0, 0.3]); });
    disc(M, g, 3.2, '#2a2418', 0, null, 6.2);
    return g;
  },
});

Models.define('dianella', {
  // Dianella: strap leaves under a cluster of nodding blue six-petalled flowers with yellow anthers.
  buckets: 8, variant: flowerKey, key: flowerKey,
  build(M, o) {
    const g = new THREE.Group(), full = o.pollen;
    strapLeaves(M, g, 5, 16, 0.9, '#3f7a44', 8, { lean: 1.2, phase: 0.5 });
    M.seg(g, [0, 0, 0], [0, 0, 10], 0.5, M.matte('#4a7a44'), { full: true });
    const pet = petalGeo(M, 'dianella', 9, 2.4, 'pointed'), pm = M.petal(full ? '#5b5fc7' : '#a9abd8');
    ring(g, 6, pet, pm, 10, -0.35, 1.5, 0);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.5; M.seg(g, [0, 0, 10], [Math.cos(a) * 3.5, Math.sin(a) * 3.5, 9.4], 0.3, M.matte('#e8e0a0'), { full: true }); M.ellipsoid(g, 1.6, 1, 0.9, M.matte(full ? '#f4d03f' : '#d9cf9a'), [Math.cos(a) * 4, Math.sin(a) * 4, 9.4], a); }
    return g;
  },
});

Models.define('hibbertia', {
  // Hibbertia (guinea flower): five broad notched yellow petals round a ring of stamens, over small leaves.
  buckets: 8, variant: flowerKey, key: flowerKey,
  build(M, o) {
    const g = new THREE.Group(), full = o.pollen, yel = full ? '#ffd23f' : '#f3e7b3';
    const leaf = PlantShapes.leafGeo(M, 'hibb', 4.5, 1.6, 0.3);
    ring(g, 6, leaf, M.leaf('#4a7a3a'), 1.2, 0.1, 5.5, 0.3);
    M.seg(g, [0, 0, 0], [0, 0, 5], 0.5, M.matte('#5a7a3a'), { full: true });
    const pet = petalGeo(M, 'hibbertia', 11, 4.2, 'notched');
    ring(g, 5, pet, M.petal(yel), 5, 0.15, 1.5, 0);
    disc(M, g, 3.4, full ? '#e0a000' : '#cbb978', 14, full ? '#f8e080' : '#e0d8a8', 5.2);
    return g;
  },
});

// ---------------------------------------------------------------- the garden's plants and things
const seedKey = (o) => 'd' + ((o.seed || 0) % 6);
Models.define('gum', { buckets: 4, variant: seedKey, key: seedKey, build(M, o) { return Models.defs.bgGum.build(M, o); } });
Models.define('banksiaTree', { buckets: 4, variant: seedKey, key: seedKey, build(M, o) { const g = Models.defs.bgBanksia.build(M, o); g.scale.setScalar(0.78); return g; } });
Models.define('grassTree', { buckets: 4, variant: seedKey, key: seedKey, build(M, o) { const g = Models.defs.bgGrassTree.build(M, o); g.scale.setScalar(0.95); return g; } });
Models.define('log', { buckets: 4, variant: seedKey, key: seedKey, build(M, o) { return Models.defs.bgLog.build(M, o); } });
Models.define('rock', {
  // A garden rock: a flattish lump of weathered limestone (or laterite), speckled, with moss on its shady side.
  buckets: 4, variant: (o) => seedKey(o) + (o.kind || ''), key: (o) => seedKey(o) + (o.kind || ''),
  build(M, o) {
    const g = new THREE.Group(), seed = (o.seed || 2) % 6, col = o.kind === 'laterite' ? '#9a5a3a' : o.kind === 'grey' ? '#8a8a84' : '#b8b0a0', r = rng(seed + 141);
    const m = new THREE.Mesh(PlantShapes.rockGeo(M, seed + 51), M.rock(col, { repeat: 3 })); m.castShadow = m.receiveShadow = true; m.scale.set(18, 15, 7); m.position.z = 5; m.rotation.z = r() * 3; g.add(m);
    for (let i = 0; i < 6; i++) M.ellipsoid(g, 1.6, 1.2, 0.5, M.rock(tint(col, -0.3), { repeat: 4 }), [(r() - 0.5) * 24, (r() - 0.5) * 18, 11.2]);
    M.ellipsoid(g, 6, 4, 1.2, M.fur('#5a8a3a'), [5, -3, 11.4]); M.ellipsoid(g, 3.5, 3, 1, M.fur('#6a9a44'), [-6, 5, 10.8]);
    return g;
  },
});

Models.define('saltbush', {
  // Saltbush: a low grey-green mound of small fleshy leaves with a silvery bloom.
  buckets: 4, variant: seedKey, key: seedKey,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 9) % 6 + 91), leafGeo = PlantShapes.leafGeo(M, 'salt', 1, 0.42, 0.4), leaves = [];
    for (let i = 0; i < 14; i++) {
      const a = r() * TAU, l = 10 + r() * 14, rise = 3 + r() * 7;
      M.seg(g, [0, 0, 1], [Math.cos(a) * l, Math.sin(a) * l, 1 + rise], 0.45, M.bark('#8a8a78'), { cone: 0.2 });
      for (let k = 0; k < 12; k++) { const d = l * (0.15 + (k % 6) / 6 * 0.85), side = k < 6 ? 1 : -1; leaves.push([Math.cos(a) * d + Math.cos(a + 1.57) * side * 1.4, Math.sin(a) * d + Math.sin(a + 1.57) * side * 1.4, 1 + rise * d / l + 0.5 + r() * 1.2, a + side * (0.6 + r() * 0.5), 3 + r() * 2, 1.4 + r() * 0.8, k % 3 ? '#9ab0a8' : '#c0d0c8']); }
    }
    M.hairs(g, leaves.length, leafGeo, M.leaf('#ffffff', { repeat: 1 }), (i, d) => { const L = leaves[i]; d.position.set(L[0], L[1], L[2]); d.rotation.set(0, -0.4, L[3]); d.scale.set(L[4], L[5] / 0.42, 1); return L[6]; });
    return g;
  },
});

Models.define('bottlebrush', {
  // Bottlebrush: a leafy shrub carrying brushes of red filaments on its twigs.
  buckets: 4, variant: seedKey, key: seedKey,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 7) % 6 + 101), leafGeo = PlantShapes.leafGeo(M, 'bbrush', 1, 0.2, 0.2), leaves = [], T = THREE;
    for (let i = 0; i < 10; i++) {
      const a = r() * TAU, l = 12 + r() * 14, rise = 4 + r() * 8;
      M.seg(g, [0, 0, 1], [Math.cos(a) * l, Math.sin(a) * l, 1 + rise], 0.5, M.bark('#6a5038'), { cone: 0.25 });
      for (let k = 0; k < 14; k++) { const d = l * (0.2 + (k % 7) / 7 * 0.8), side = k < 7 ? 1 : -1; leaves.push([Math.cos(a) * d + Math.cos(a + 1.57) * side * 1.2, Math.sin(a) * d + Math.sin(a + 1.57) * side * 1.2, 1 + rise * d / l + 0.4 + r() * 1.5, a + side * (0.35 + r() * 0.4), 7 + r() * 3, 1.3 + r() * 0.5, k % 2 ? '#4a7a3a' : '#5a8a44']); }
      if (i < 8) {   // a brush at the end of the twig: a core with filaments all round, gold anthers at the tips
        const bx = Math.cos(a) * l * 0.85, by = Math.sin(a) * l * 0.85, bz = 1 + rise * 0.85 + 2, dir = new T.Vector3(Math.cos(a), Math.sin(a), rise / l * 0.6).normalize();
        M.seg(g, [bx - dir.x * 7, by - dir.y * 7, bz - dir.z * 7], [bx + dir.x * 7, by + dir.y * 7, bz + dir.z * 7], 0.8, M.bark('#8a4a3a'), { full: true });
        const up = new T.Vector3(0, 1, 0), tmp = new T.Vector3(), side = new T.Vector3();
        M.hairs(g, 60, M.cone(0.14, 0.04, 4.2), M.hair('#d8303a'), (k, d) => {
          const along = -6.5 + (k / 60) * 13, ang = k * 2.4;
          side.set(Math.cos(ang), Math.sin(ang), (k % 2 ? 0.6 : -0.6)).cross(dir).normalize();   // a filament out from the core
          tmp.copy(dir).multiplyScalar(along); d.position.set(bx + tmp.x, by + tmp.y, bz + tmp.z);
          d.quaternion.setFromUnitVectors(up, side); d.position.addScaledVector(side, 2.6);
          return k % 3 ? null : '#f0c040';
        });
      }
    }
    M.hairs(g, leaves.length, leafGeo, M.leaf('#ffffff', { repeat: 1 }), (i, d) => { const L = leaves[i]; d.position.set(L[0], L[1], L[2]); d.rotation.set(0, -0.3, L[3]); d.scale.set(L[4], L[5] / 0.2, 1); return L[6]; });
    return g;
  },
});

Models.define('nativeGrass', {
  buckets: 4, variant: seedKey, key: seedKey,
  build(M, o) { const g = Models.defs.bgTuft.build(M, { seed: o.seed, kind: 'straw' }); g.scale.setScalar(1.1); return g; },
});
Models.define('rush', {
  // Rushes: a tall green tuft with brown seed heads near the tips.
  buckets: 4, variant: seedKey, key: seedKey,
  build(M, o) {
    const g = Models.defs.bgTuft.build(M, { seed: o.seed, kind: 'green' }), r = rng((o.seed || 0) % 6 + 111);
    for (let i = 0; i < 6; i++) { const a = r() * TAU, d = 10 + r() * 8; M.ellipsoid(g, 1.6, 1.6, 2.2, M.rock('#7a5a2a', { repeat: 6 }), [Math.cos(a) * d, Math.sin(a) * d, 10 + r() * 6]); }
    g.scale.setScalar(1.05);
    return g;
  },
});
Models.define('pondPlant', {
  // Floating leaves on the pond.
  buckets: 4, shadow: false,
  build(M) {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) { const pad = Models.defs.bgLily.build(M, { seed: i + 2 }); pad.scale.setScalar(0.32); pad.position.set(i * 7 - 7, (i % 2) * 5, 0); g.add(pad); }
    return g;
  },
});

Models.define('nestBox', {
  // A nest box on a post, seen from above: a sloping roof over a box, the entrance hole on the front.
  buckets: 4,
  build(M) {
    // leaned well back on its post so the front with the hole shows from above, as the drawing did
    const g = new THREE.Group(), box = new THREE.Group(); box.rotation.x = -0.95; box.position.set(0, 2, 10); g.add(box);
    M.seg(g, [0, 0, 0], [0, 3, 10], 2.5, M.bark('#6a4a2a'), { full: true });
    box.add(M.part(M.box(24, 20, 22), M.bark('#9a7048', { repeat: 1 }), { at: [0, 0, 11] }));
    box.add(M.part(M.box(28, 26, 3), M.bark('#7a5032', { repeat: 1 }), { at: [0, -1, 23.5], rot: [-0.2, 0, 0] }));
    M.ellipsoid(box, 4.5, 0.6, 4.5, M.matte('#2a1a0a'), [0, -10.2, 14]);
    M.seg(box, [-4, -10.4, 8], [4, -10.4, 8], 0.6, M.bark('#5a3a1a'), { full: true });
    return g;
  },
});
Models.define('birdbath', {
  // A stone bird bath from above: a rim, water, the pedestal's shadow.
  buckets: 4,
  build(M) {
    const g = new THREE.Group(), prof = [[6, 0], [6.5, 14], [5, 18], [9, 24], [16, 29], [17, 31], [15.5, 31.5], [12.5, 29.5], [0.05, 28]];
    const bowl = new THREE.Mesh(M.lathe(prof, 28), M.rock('#b5b0a5', { repeat: 2 })); bowl.rotation.x = Math.PI / 2; bowl.castShadow = bowl.receiveShadow = true; g.add(bowl);
    const water = M.part(M.geo('disc', () => new THREE.CircleGeometry(1, 28)), M.water('#8cc8e0'), { at: [0, 0, 30.2], scale: [13, 13, 1] }); g.add(water);
    return g;
  },
});
Models.define('beeHotel', {
  // A bee hotel: a wooden block drilled with holes, standing on its end so the holes face up in this view.
  buckets: 4,
  build(M) {
    const g = new THREE.Group();
    g.add(M.part(M.box(28, 24, 12), M.bark('#9a7048', { repeat: 1 }), { at: [0, 0, 6] }));
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) M.ellipsoid(g, 2.2, 2.2, 1, M.matte('#2a180a'), [-8 + i * 8, -6 + k * 6, 12.1]);
    for (let i = 0; i < 4; i++) M.seg(g, [-13 + i * 8.5, -12.5, 2], [-13 + i * 8.5, -12.5, 11], 1.2, M.bark('#b08858'), { full: true });
    return g;
  },
});

// ---------------------------------------------------------------- things lying about the levels
Models.define('fungus', {
  // A clump of small brown mushrooms (the termites' food): domed caps on short stems, amount sets the size.
  variant(o) { return 'a' + Math.round((o.amount === undefined ? 1 : o.amount) * 4); }, key(o) { return 'a' + Math.round((o.amount === undefined ? 1 : o.amount) * 4); },
  build(M, o) {
    const g = new THREE.Group(), a = Math.round((o.amount === undefined ? 1 : o.amount) * 4) / 4;
    for (let i = 0; i < 4; i++) {
      const x = Math.cos(i * 1.6) * 7, y = Math.sin(i * 1.6) * 6, rr = 5 * a + 2, h = rr * 0.9;
      M.seg(g, [x, y, 0], [x, y, h], rr * 0.3, M.matte('#e8d8b8', { rough: 0.8 }), { full: true });
      M.ellipsoid(g, rr, rr, rr * 0.55, M.matte(i % 2 ? '#c89a6a' : '#e0b888', { rough: 0.75 }), [x, y, h]);
      M.ellipsoid(g, rr * 0.32, rr * 0.3, rr * 0.2, M.matte('#8a6440'), [x, y, h + rr * 0.5]);
    }
    return g;
  },
});
Models.define('lichen', {
  // Lichen: pale green crusty rosettes, flat on the wood.
  shadow: false,
  variant(o) { return 'a' + Math.round((o.amount === undefined ? 1 : o.amount) * 4); }, key(o) { return 'a' + Math.round((o.amount === undefined ? 1 : o.amount) * 4); },
  build(M, o) {
    const g = new THREE.Group(), a = Math.round((o.amount === undefined ? 1 : o.amount) * 4) / 4, r = rng(4);
    for (let i = 0; i < 7; i++) {
      const x = Math.cos(i * 0.9) * 9 * a, y = Math.sin(i * 0.9) * 7 * a, rx = 4 + 2 * a, ry = 3 + 2 * a;
      M.ellipsoid(g, rx, ry, 0.7, M.leaf(i % 2 ? '#a8b888' : '#c0cc9a', { repeat: 2 }), [x, y, 0.5], i);
      for (let k = 0; k < 6; k++) M.ellipsoid(g, 0.8, 0.6, 0.5, M.matte('#5a6e46'), [x + (r() - 0.5) * rx * 1.3, y + (r() - 0.5) * ry * 1.3, 1.1]);
    }
    return g;
  },
});
Models.define('deadLeaf', {
  // A fallen gum leaf, curled, browning; amount shrinks it as it is eaten.
  variant(o) { return 'a' + Math.round((o.amount === undefined ? 1 : o.amount) * 4); }, key(o) { return 'a' + Math.round((o.amount === undefined ? 1 : o.amount) * 4); },
  build(M, o) {
    const g = new THREE.Group(), a = Math.round((o.amount === undefined ? 1 : o.amount) * 4) / 4, L = 16 * (0.4 + a * 0.6);
    const m = new THREE.Mesh(PlantShapes.leafGeo(M, 'dead', 1, 0.35, 0.8), M.leaf('#a8783a', { repeat: 2 })); m.castShadow = m.receiveShadow = true;
    m.scale.set(L, 7 / 0.35, 1); m.position.z = 0.6; g.add(m);
    M.seg(g, [-L * 0.9, 0, 0.9], [L * 0.9, 0, 0.9], 0.3, M.bark('#7a5428'), { full: true });
    return g;
  },
});
Models.define('cone', {
  // A banksia cone lying on its side: a woody core studded with the seed follicles.
  build(M) {
    const g = new THREE.Group(), T = THREE;
    g.add(M.part(M.capsule(5.5, 12), M.bark('#6a4a2a', { repeat: 2 }), { at: [0, 0, 5.5], rot: [0, 0, Math.PI / 2] }));
    M.hairs(g, 40, M.sphere(1, 8), M.rock('#8a6a44', { repeat: 4 }), (k, d) => { const b = k * 2.4, x = -8 + (k / 40) * 16, ry = Math.cos(b), rz = Math.sin(b); d.position.set(x, ry * 5.3, 5.5 + rz * 5.3); d.scale.set(1.8, 1.4, 1.4); d.lookAt(x, ry * 12, 5.5 + rz * 12); return k % 2 ? '#5a4028' : null; });
    M.seg(g, [12, 0, 4], [18, 0, 3], 1.2, M.bark('#5a4028'), { cone: 0.6 });
    return g;
  },
});
Models.define('feather', {
  // A dropped feather: a shaft with the vane painted on a flat blade, an optional coloured band.
  variant(o) { return (o.color || '') + (o.band || ''); }, key(o) { return (o.color || '') + (o.band || ''); },
  build(M, o) {
    const g = new THREE.Group(), col = o.color || '#1c1c1c', key = 'feather|' + col + '|' + (o.band || '');
    const pts = [[-12, 0]], q = (p0, c, p1, n) => { for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); } };
    q([-12, 0], [0, -5.5], [14, -0.5], 10); q([14, -0.5], [0, 5.5], [-12, 0], 10);
    const tex = patternTexture(M, key, pts, (ctx) => {
      const gr = ctx.createLinearGradient(0, -5, 0, 5); gr.addColorStop(0, tint(col, 0.3)); gr.addColorStop(1, tint(col, -0.3)); ctx.fillStyle = gr; ctx.fillRect(-14, -6, 30, 12);
      ctx.strokeStyle = tint(col, 0.25); ctx.globalAlpha = 0.6; ctx.lineWidth = 0.25; ctx.beginPath();
      for (let k = -10; k < 13; k += 1.2) { ctx.moveTo(k, 0); ctx.lineTo(k + 2.5, -4 * (1 - Math.abs(k) / 15)); ctx.moveTo(k, 0); ctx.lineTo(k + 2.5, 4 * (1 - Math.abs(k) / 15)); }
      ctx.stroke(); ctx.globalAlpha = 1;
      if (o.band) { ctx.fillStyle = o.band; ctx.beginPath(); ctx.ellipse(-5, 0, 3, 4, 0, 0, TAU); ctx.fill(); }
    });
    const m = new THREE.Mesh(M.geo('featherVane', () => M.shape(pts, { uv: true })), M.feather('#ffffff', { map: tex })); m.castShadow = true; m.position.z = 0.5; m.rotation.x = 0.12; g.add(m);
    M.seg(g, [-14, 0, 0.6], [14, 0, 0.6], 0.4, M.gloss('#5a5a5a', { rough: 0.5 }), { cone: 0.15 });
    return g;
  },
});
Models.define('egg', { build(M) { const g = new THREE.Group(); M.ellipsoid(g, 2, 2, 2, M.matte('#a8d070', { rough: 0.4 }), [0, 0, 2]); return g; } });
Models.define('antEgg', {
  variant(o) { return 'g' + Math.round((o.grow || 0) * 3); }, key(o) { return 'g' + Math.round((o.grow || 0) * 3); },
  build(M, o) { const g = new THREE.Group(), k = Math.round((o.grow || 0) * 3) / 3; M.ellipsoid(g, 3.4 + k * 2, 2.2 + k * 1.4, 2 + k * 1.2, M.matte(k > 0.6 ? '#f0e8d0' : '#fffaf0', { rough: 0.4 }), [0, 0, 2 + k * 1.2]); return g; },
});
Models.define('eggSac', {
  // The spider's silk egg sac: a papery ball tethered by threads.
  build(M) {
    const g = new THREE.Group(), silk = M.matte('#f4f2ea', { rough: 0.6 });
    M.ellipsoid(g, 11, 10, 9, silk, [0, 0, 8]);
    M.hairs(g, 40, M.cone(0.12, 0.05, 9), M.hair('#ffffff'), (k, d) => { const a = k * 0.9, z = 2 + (k % 8) * 1.6; d.position.set(Math.cos(a) * 10.2, Math.sin(a) * 9.3, z + 4); d.rotation.set(0, 0, a + 1.2); d.rotation.x = 1.3; });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; M.seg(g, [Math.cos(a) * 10, Math.sin(a) * 9, 6], [Math.cos(a) * 18, Math.sin(a) * 16, 0.3], 0.18, M.hair('#ffffff'), { full: true }); }
    return g;
  },
});
Models.define('honeydew', { build(M) { const g = new THREE.Group(); M.ellipsoid(g, 4, 4.4, 3.4, M.glass('#f0c040', { opacity: 0.85 }), [0, 0, 3]); M.ellipsoid(g, 2.4, 2.6, 2, M.gloss('#e0a030', { rough: 0.3 }), [0, 0, 2.6]); return g; } });
Models.define('wrapped', {
  // An insect wrapped in silk: a white bundle with threads wound round it.
  build(M) {
    const g = new THREE.Group();
    M.ellipsoid(g, 9, 6, 5, M.matte('#f4f2ea', { rough: 0.6 }), [0, 0, 4.5]);
    for (let k = -2; k <= 2; k++) { const x = k * 3; M.seg(g, [x - 2, -5.8, 4.5], [x + 2, 5.8, 4.5], 0.25, M.hair('#ffffff'), { full: true }); M.seg(g, [x - 2, 0, 9.3], [x + 2, 0, 9.3], 0.25, M.hair('#ffffff'), { full: true }); }
    return g;
  },
});
Models.define('silkShelter', {
  // The painted lady caterpillar's shelter: daisy leaves pulled into a tent and stitched with silk.
  buckets: 4,
  build(M) {
    const g = new THREE.Group(), leaf = PlantShapes.leafGeo(M, 'shelter', 1, 0.35, 0.4);
    ring(g, 6, leaf, (i) => M.leaf(i % 2 ? '#5f9a3a' : '#6aa646', { repeat: 2 }), 1, 0.08, 4, 0.4, (m) => { m.scale.set(18, 8 / 0.35, 1); m.position.x *= 4.5; m.position.y *= 4.5; });
    M.ellipsoid(g, 26, 12, 9, M.leaf('#6a9a3a', { repeat: 3 }), [0, 0, 5], -0.15);
    M.ellipsoid(g, 20, 9, 6, M.leaf('#4a7a2a', { repeat: 3 }), [2, 4, 4], -0.15);
    M.ellipsoid(g, 5, 4.5, 4, M.matte('#1e2a12'), [-23, 5, 3.5]);
    for (let k = 0; k < 8; k++) { const x = -18 + k * 5; M.seg(g, [x, -8, 10], [x + 2.5, 8, 11], 0.22, M.hair('#ffffff'), { full: true }); }
    return g;
  },
});
Models.define('rooPoo', { build(M) { const g = new THREE.Group(); for (let i = 0; i < 6; i++) M.ellipsoid(g, 3, 2.6, 2.2, M.rock('#4a3a26', { repeat: 4 }), [Math.cos(i * 1.3) * 7, Math.sin(i * 1.3) * 5, 2], i); return g; } });
Models.define('wrack', {
  // Washed-up seaweed: strands of brown and olive weed lying over each other, with air bladders.
  buckets: 4,
  variant(o) { return 'a' + Math.round((o.amount === undefined ? 1 : o.amount) * 4) + 'd' + ((o.seed || 0) % 6); }, key(o) { return 'a' + Math.round((o.amount === undefined ? 1 : o.amount) * 4) + 'd' + ((o.seed || 0) % 6); },
  build(M, o) {
    const g = new THREE.Group(), a = Math.round((o.amount === undefined ? 1 : o.amount) * 4) / 4;
    if (a <= 0) return g;
    const s = 0.5 + a * 0.5, r = rng((o.seed || 3) % 6 + 121), cols = ['#4a5a2a', '#6a6a2a', '#3a4a22', '#7a5a2a'];
    for (let i = 0; i < 9; i++) {
      const x = (r() - 0.5) * 30, w = 10 + r() * 10, lift = 2 + r() * 4, rr = 1.5 + r() * 1;
      const m = new THREE.Mesh(M.tube([[x - w, 4, rr], [x, -3, rr + lift], [x + w, 4, rr]], rr, rr * 0.8), M.leaf(cols[i % 4], { repeat: 3 })); m.castShadow = m.receiveShadow = true; g.add(m);
    }
    for (let i = 0; i < 4; i++) M.ellipsoid(g, 2.2, 2, 2, M.chitin('#5a6a2a', { coat: 0.6 }), [(r() - 0.5) * 24, -2 + r() * 4, 3]);
    g.scale.setScalar(s);
    return g;
  },
});
Models.define('shell', {
  // A snail's empty shell from above: a glossy dome with the whorl painted as a spiral.
  variant(o) { return o.color || ''; }, key(o) { return o.color || ''; },
  build(M, o) {
    const g = new THREE.Group(), col = o.color || '#8a6a44';
    const spiral = M.paint('shellSpiral|' + col, 128, 128, (ctx, w, h) => { ctx.fillStyle = col; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(0, h * (0.1 + k * 0.3)); ctx.lineTo(w, h * (0.4 + k * 0.3)); ctx.stroke(); } ctx.fillStyle = 'rgba(255,240,210,.35)'; for (let k = 0; k < 3; k++) ctx.fillRect(0, h * (0.22 + k * 0.3), w, 4); });
    const dome = new THREE.Mesh(M.geo('halfDome', () => new THREE.SphereGeometry(1, 24, 12, 0, TAU, 0, Math.PI / 2)), M.shell('#ffffff', { map: spiral }));
    dome.scale.set(8, 8, 5.5); dome.rotation.x = Math.PI / 2; dome.castShadow = dome.receiveShadow = true; g.add(dome);
    return g;
  },
});
Models.define('seashell', {
  // A cockle shell on the sand: a ribbed fan, pale pink, hinge toward the back.
  variant: seedKey, key: seedKey,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 131), col = ['#f2d6c2', '#f6e0cc', '#e8c8b0', '#f0d8d0', '#ecd0b8', '#f4dcc8'][(o.seed || 0) % 6];
    const pts = [[0, 10]]; for (let a = Math.PI * 1.1; a <= Math.PI * 1.9; a += 0.1) pts.push([Math.cos(a) * 11, Math.sin(a) * 11]);
    const sh = new THREE.Mesh(M.geo('cockle', () => { const sg = M.shape(pts, { uv: true, depth: 1.5, bevel: 0.6 }); return sg; }), M.shell(col)); sh.castShadow = sh.receiveShadow = true; sh.position.z = 0.2; g.add(sh);
    for (let i = -3; i <= 3; i++) M.seg(g, [0, 9, 2.2], [i * 3, -8.5, 2.2], 0.6, M.shell(tint(col, -0.12)), { cone: 0.2 });
    g.rotation.z = r() * 0.4 - 0.2;
    return g;
  },
});
Models.define('mud', { build(M) { const g = new THREE.Group(); M.ellipsoid(g, 6, 5, 3, M.soil('#6b4a2a'), [0, 0, 2.6]); M.ellipsoid(g, 2.5, 2, 1, M.gloss('#8a6440', { rough: 0.5 }), [-2, -2, 5]); return g; } });
Models.define('woodChip', { build(M) { const g = new THREE.Group(); g.add(M.part(M.box(12, 5, 2.2), M.bark('#a07848', { repeat: 1 }), { at: [0, 0, 1.1], rot: 0.3 })); return g; } });
Models.define('dig', {
  // A dug hole: a ring of thrown-up sand round a dark opening.
  build(M) { const g = new THREE.Group(); M.ellipsoid(g, 13, 10, 3, M.sand('#c9a868'), [4, 0, 0]); M.ellipsoid(g, 7, 6, 0.3, M.matte('#2a1a0c', { rough: 1 }), [-2, 0, 3.1]); return g; },
});

// ---------------------------------------------------------------- the secrets
Models.define('cricketBall', {
  build(M) { const g = new THREE.Group(); M.ellipsoid(g, 8, 8, 8, M.plastic('#b3261e', { rough: 0.3 }), [0, 0, 8]); for (const s of [-1, 1]) { const seam = M.part(M.torus(8, 0.35, 10), M.gloss('#f2e6c8', { rough: 0.6 }), { at: [0, 0, 8], rot: [Math.PI / 2, 0, 0], scale: [1, 1, 1] }); seam.position.y = s * 1.2; seam.scale.set(0.99, 0.99, 1); g.add(seam); } return g; },
});
Models.define('gnome', {
  // A garden gnome lying on his back in the grass: blue coat, white beard, red hat.
  build(M) {
    const g = new THREE.Group();
    M.ellipsoid(g, 14, 12, 9, M.plastic('#3a6ab0', { rough: 0.5 }), [-2, 0, 8]);
    M.ellipsoid(g, 8, 7, 7, M.plastic('#f0c8a0', { rough: 0.6 }), [8, 0, 8]);
    M.ellipsoid(g, 6, 8, 5, M.fur('#f2f2f2'), [12, 0, 6]);
    M.ellipsoid(g, 2.2, 1.8, 1.5, M.plastic('#e8a080'), [12.5, 0, 12]);
    for (const s of [-1, 1]) M.ellipsoid(g, 1, 1, 1, M.gloss('#1a1a2a'), [10.5, s * 2.6, 13]);
    g.add(M.part(M.cone(7.5, 0.3, 20), M.plastic('#c8302a', { rough: 0.5 }), { at: [-22, 0, 8], rot: [0, 0, Math.PI / 2] }));
    for (const s of [-1, 1]) M.seg(g, [-8, s * 9, 3], [-16, s * 11, 2.5], 3, M.plastic('#3a3a3a'), { full: true });
    return g;
  },
});
Models.define('thong', {
  // A lost thong: a rubber sole with a yellow strap.
  build(M) {
    const g = new THREE.Group();
    M.ellipsoid(g, 22, 9, 1.6, M.plastic('#2f7d5b', { rough: 0.8 }), [0, 0, 1.6]);
    M.ellipsoid(g, 20, 7, 0.8, M.plastic('#3f9a6e', { rough: 0.8 }), [0, 0, 3]);
    for (const s of [-1, 1]) { const m = new THREE.Mesh(M.tube([[10, 0, 3.2], [4, s * 3.5, 7], [-2, s * 7, 3.4]], 1.2, 1.2), M.plastic('#f2d040', { rough: 0.6 })); m.castShadow = true; g.add(m); }
    return g;
  },
});
Models.define('paperPlane', {
  build(M) {
    const g = new THREE.Group(), paper = M.mat('paper', () => M.phys({ color: '#fbfbf5', roughness: 0.9, side: THREE.DoubleSide, sheen: 0.2 }));
    for (const s of [-1, 1]) { const m = new THREE.Mesh(M.geo('planeWing', () => M.shape([[18, 0], [-14, -12], [-8, 0]], { uv: true })), paper); m.castShadow = m.receiveShadow = true; m.scale.y = s; m.rotation.x = s * 0.35; m.position.z = 0.4; g.add(m); }
    M.seg(g, [18, 0, 0.6], [-8, 0, 0.6], 0.3, M.matte('#c8c8c0'), { full: true });
    return g;
  },
});
Models.define('billyCan', {
  // A billy can from above: a dented tin with a wire handle.
  build(M) {
    const g = new THREE.Group();
    g.add(M.part(M.cone(13, 12.5, 14), M.metal('#9a9a98', { rough: 0.45 }), { at: [0, 0, 7], rot: [Math.PI / 2, 0, 0] }));
    M.ellipsoid(g, 10.5, 10.5, 0.6, M.matte('#2a2a28', { rough: 0.9 }), [0, 0, 13.8]);
    const h = new THREE.Mesh(M.tube([[-13, 0, 10], [-14, -8, 18], [-6, -15, 20], [2, -15, 19], [10, -8, 16], [13, 0, 10]], 0.8, 0.8), M.metal('#6a6a68')); h.castShadow = true; g.add(h);
    return g;
  },
});
Models.define('marble', {
  build(M) { const g = new THREE.Group(); M.ellipsoid(g, 2.8, 1.4, 1.2, M.gloss('#e8503a', { rough: 0.3 }), [0, 0, 9], 0.6); M.ellipsoid(g, 9, 9, 9, M.glass('#78bfff', { opacity: 0.55 }), [0, 0, 9]); return g; },
});
Models.define('sandcastle', {
  // A sandcastle: four corner towers round a keep, a paper flag on top.
  buckets: 4,
  build(M) {
    const g = new THREE.Group(), sand = M.sand('#d9c08a'), dark = M.sand('#c9ad72');
    M.ellipsoid(g, 24, 20, 4, sand, [0, 0, 1]);
    for (const [x, y] of [[-12, -10], [12, -10], [-12, 10], [12, 10]]) { g.add(M.part(M.cone(8, 7.5, 12), dark, { at: [x, y, 6], rot: [Math.PI / 2, 0, 0] })); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; g.add(M.part(M.box(3, 3, 3), sand, { at: [x + Math.cos(a) * 6, y + Math.sin(a) * 6, 13.5], rot: a })); } }
    g.add(M.part(M.cone(9, 8, 16), sand, { at: [0, 0, 8], rot: [Math.PI / 2, 0, 0] }));
    M.seg(g, [0, 0, 16], [0, 0, 30], 0.5, M.bark('#5a4028'), { full: true });
    const flag = new THREE.Mesh(M.geo('flag', () => M.shape([[0, 0], [10, 2], [0, 4]])), M.cloth('#c8302a')); flag.rotation.x = Math.PI / 2; flag.position.set(0, 0, 26); flag.castShadow = true; g.add(flag);
    return g;
  },
});
Models.define('toyBoat', {
  // A toy boat: an orange hull with a white sail on a mast.
  buckets: 4,
  build(M) {
    const g = new THREE.Group();
    M.ellipsoid(g, 18, 8, 5, M.plastic('#c8501e', { rough: 0.4 }), [0, 0, 4]);
    M.ellipsoid(g, 14, 5, 1, M.plastic('#e87a3a', { rough: 0.5 }), [0, 0, 8.8]);
    // heeled over in the wind, so the sail shows from above
    M.seg(g, [0, 0, 9], [0, -11, 21], 0.6, M.bark('#8a6a44'), { full: true });
    const sail = new THREE.Mesh(M.geo('sail', () => M.shape([[0, 0], [0, 16], [13, 2]], { uv: true })), M.cloth('#f2f2f2')); sail.rotation.x = 0.75; sail.position.set(0.5, -0.5, 9.5); sail.castShadow = true; g.add(sail);
    return g;
  },
});

// ---------------------------------------------------------------- the backyard barbecue, seen from up high
// Iso models stand on z = 0 at the origin. The yard's picture axes: model +x runs down to the right, model -y up
// to the right, z up. Someone facing the picture's right faces model (1, -1, 0).
const ISO = { e: 30 * Math.PI / 180, az: Math.PI / 4 };
// A flat picture that always faces the yard's camera (a speech bubble, a question mark), placed inside a model
// that is turned by `rot` about z. The frame is mirrored in y, so the picture is painted mirrored to read right.
function isoBillboard(M, parent, tex, w, h, at, rot) {
  const T = THREE, n = new T.Vector3(Math.cos(ISO.e) * Math.sin(ISO.az), Math.cos(ISO.e) * Math.cos(ISO.az), Math.sin(ISO.e));
  const up = new T.Vector3(-Math.sin(ISO.az) * Math.sin(ISO.e), -Math.cos(ISO.az) * Math.sin(ISO.e), Math.cos(ISO.e)), right = new T.Vector3().crossVectors(up, n);
  const rz = new T.Matrix4().makeRotationZ(-(rot || 0)); n.applyMatrix4(rz); up.applyMatrix4(rz); right.applyMatrix4(rz);
  const m = new T.Mesh(M.geo('bb|' + w + '|' + h, () => new T.PlaneGeometry(w, h)), M.mat('bb|' + tex.uuid, () => new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })));
  m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right, up, n));
  m.position.set(at[0], at[1], at[2]); m.castShadow = false; parent.add(m); return m;
}
const mirrored = (fn) => (ctx, w, h) => { ctx.translate(w, 0); ctx.scale(-1, 1); fn(ctx, w, h); };

Models.define('person', {
  // A person at the barbecue, standing or sitting on a chair, chatting (a bubble), looking round (a question
  // mark), waving, swatting, drinking; a red itch spot where the mosquito bit; breath drifting up.
  view: 'iso',
  variant(o) { return [o.pose || 'stand', o.face < 0 ? 'L' : 'R', o.skin, o.shirt, o.pants, o.hair, o.hat || '', o.long ? 'l' : '', o.drink ? 'd' : '', o.swat > 0 ? 's' : '', o.wave ? 'w' : '', o.talk ? 't' : '', o.look ? 'q' : '', o.itch > 0.3 ? 'i' : ''].join('|'); },
  key(o, t) { return Models.defs.person.variant(o) + 'b' + SpriteCache.phase(t, Math.PI, 4) + (o.wave ? 'v' + SpriteCache.phase(t, 6, 4) : ''); },
  build(M, o) {
    const g = new THREE.Group(), T = THREE, sit = o.pose === 'sit', rot = o.face < 0 ? Math.PI * 0.75 : -Math.PI / 4;
    const skin = M.skin(o.skin || '#e8b890'), shirt = M.cloth(o.shirt || '#2f6a9a'), pants = M.cloth(o.pants || '#3a3a3a'), hair = M.fur(o.hair || '#3a2a1a', { bump: 1 });
    g.rotation.z = rot;
    let hip = 80;
    if (sit) {
      // a white plastic chair: legs, seat, back
      const chair = M.plastic('#e8e8e8', { rough: 0.5 });
      for (const [x, y] of [[-10, -9], [-10, 9], [8, -9], [8, 9]]) M.seg(g, [x, y, 0], [x, y, 40], 1.6, chair, { full: true });
      g.add(M.part(M.box(26, 24, 3), chair, { at: [-1, 0, 41] }));
      g.add(M.part(M.box(3, 24, 32), chair, { at: [-13, 0, 58] }));
      hip = 46;
      for (const s of [-1, 1]) { M.seg(g, [0, s * 6, hip + 4], [24, s * 7, hip + 2], 5.5, pants, { full: true }); M.seg(g, [24, s * 7, hip], [26, s * 7, 4], 4.5, skin, { full: true }); M.ellipsoid(g, 8, 4.5, 3, M.plastic('#3a3a3a'), [30, s * 7, 2]); }
      g.add(M.part(M.box(18, 22, 16), pants, { at: [2, 0, hip + 4] }));
    } else {
      for (const s of [-1, 1]) { M.seg(g, [0, s * 6, hip], [0, s * 6, 4], 4.5, skin, { full: true }); M.ellipsoid(g, 8, 4.5, 3, M.plastic('#3a3a3a'), [3, s * 6, 2]); }
      g.add(M.part(M.box(18, 24, 30), pants, { at: [0, 0, hip - 12] }));
    }
    const torso = hip + 24;
    M.ellipsoid(g, 13, 17, 30, shirt, [0, 0, torso]);
    // arms: one busy (holding a drink, waving, swatting), the other hanging
    const sh = [0, 17, torso + 22], elbow = o.swat > 0 ? [8, 22, torso + 44] : o.wave ? [6, 24, torso + 50] : o.drink ? [10, 19, torso + 24] : [8, 20, torso + 4];
    const hand = o.swat > 0 ? [18, 14, torso + 62] : o.wave ? [2, 28, torso + 74] : o.drink ? [16, 8, torso + 40] : [22, 14, torso - 8];
    M.seg(g, sh, elbow, 4, skin, { full: true }); M.seg(g, elbow, hand, 3.6, skin, { full: true }); M.ellipsoid(g, 4, 4, 4, skin, hand);
    g.userData.hand = hand;
    M.seg(g, [0, -17, torso + 22], [-6, -22, torso], 4, skin, { full: true }); M.seg(g, [-6, -22, torso], [-2, -20, torso - 22], 3.6, skin, { full: true });
    if (o.drink) g.add(M.part(M.cone(4.5, 5, 14), M.plastic('#d8402a'), { at: [hand[0] + 2, hand[1], hand[2] + 5], rot: [Math.PI / 2, 0, 0] }));
    // head
    const hz = torso + 50;
    M.ellipsoid(g, 16, 17, 18, skin, [0, 0, hz]);
    const cap = new T.Mesh(M.geo('hairCap', () => new T.SphereGeometry(1, 20, 10, 0, TAU, 0, Math.PI * 0.55)), hair); cap.scale.set(17.5, 18.5, 19); cap.position.set(-2, 0, hz + 1); cap.rotation.x = Math.PI / 2; cap.rotation.y = 0.35; cap.castShadow = true; g.add(cap);
    if (o.long) M.ellipsoid(g, 9, 14, 20, hair, [-9, 0, hz - 12]);
    if (o.hat) { M.ellipsoid(g, 24, 24, 1.2, M.cloth(o.hat), [0, 0, hz + 11]); g.add(M.part(M.cone(14, 12, 10), M.cloth(o.hat), { at: [0, 0, hz + 16], rot: [Math.PI / 2, 0, 0] })); }
    for (const s of [-1, 1]) M.ellipsoid(g, 1.2, 2, 2.4, M.gloss('#2a1a10'), [15 + (o.look ? 1 : 0), s * 6, hz + 2]);
    M.ellipsoid(g, 1.2, 4, 1.4, M.gloss('#8a4a3a', { rough: 0.6 }), [16.2, 0, hz - 7]);
    if (o.itch > 0.3) M.ellipsoid(g, 2.6, 4, 4, M.matte('#e05050'), (o.spotY || 0) < -60 ? [hand[0] - 6, hand[1] + 1, hand[2] + 8] : [2, 7, 12]);
    // speech bubble or question mark, facing the camera
    if (o.look) isoBillboard(M, g, M.paint('isoQ', 64, 64, mirrored((ctx, w, h) => { ctx.fillStyle = '#c0392b'; ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', w / 2, h / 2); }), { clamp: true }), 26, 26, [6, 0, hz + 40], rot);
    else if (o.talk) isoBillboard(M, g, M.paint('isoTalk', 128, 80, mirrored((ctx, w, h) => { ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#555'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(w / 2 - 24 + i * 24, h / 2, 7, 0, TAU); ctx.fill(); } }), { clamp: true }), 50, 30, [22, 0, hz + 36], rot);
    // breath: three puffs that drift up and fade (posed by phase)
    g.userData.puffs = [];
    for (let i = 0; i < 3; i++) { const p = new T.Mesh(M.sphere(1, 10), M.mat('puff0', () => M.phys({ color: '#ffffff', transparent: true, opacity: 0.2, roughness: 1, depthWrite: false }))); p.castShadow = false; g.add(p); g.userData.puffs.push(p); }
    g.userData.hz = hz;
    return g;
  },
  pose(root, o, t, M) {
    const ph0 = (SpriteCache.phase(t, Math.PI, 4) + 0.5) / 4, hz = root.userData.hz;
    root.userData.puffs.forEach((p, i) => {
      const ph = (ph0 + i / 3 + (o.seed || 0) * 0.37) % 1, k = Math.round(ph * 4);
      p.position.set(18 + ph * 20, 0, hz + 4 + ph * 50); p.scale.setScalar(4 + ph * 10);
      p.material = M.mat('puff' + k, () => M.phys({ color: '#ffffff', transparent: true, opacity: 0.22 * (1 - k / 4), roughness: 1, depthWrite: false }));
    });
  },
});

Models.define('bbq', {
  // A four-burner barbecue with the hood down, three snags on the hotplate, a little smoke.
  view: 'iso',
  build(M) {
    const g = new THREE.Group(), body = M.metal('#555555', { rough: 0.55 });
    g.add(M.part(M.box(64, 36, 50), body, { at: [0, 0, 36] }));
    for (const [x, y] of [[-26, -13], [-26, 13], [26, -13], [26, 13]]) M.seg(g, [x, y, 0], [x, y, 12], 2, M.metal('#3a3a3a'), { full: true });
    g.add(M.part(M.box(60, 32, 6), M.metal('#2a2a2a', { rough: 0.6 }), { at: [0, 0, 64] }));
    g.add(M.part(M.box(58, 30, 1), M.metal('#1e1e1e', { rough: 0.4 }), { at: [0, 0, 67.6] }));
    for (let i = 0; i < 3; i++) M.ellipsoid(g, 8, 2.6, 2.6, M.skin('#9a4a2a', { rough: 0.35 }), [-12 + i * 12, -4 + i * 4, 70], 0.45);
    for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(M.sphere(1, 10), M.mat('smoke', () => M.phys({ color: '#d8d8d8', transparent: true, opacity: 0.22, roughness: 1, depthWrite: false }))); s.castShadow = false; s.scale.setScalar(9 + i * 4); s.position.set(-4 + i * 6, 2, 88 + i * 18); g.add(s); }
    return g;
  },
});
Models.define('table', {
  // A wooden outdoor table with a plate and a cup, under a big teal umbrella.
  view: 'iso',
  build(M) {
    const g = new THREE.Group(), wood = M.bark('#a87a4a', { repeat: 2 });
    g.add(M.part(M.box(85, 64, 5), wood, { at: [0, 0, 50] }));
    for (const [x, y] of [[-36, -26], [-36, 26], [36, -26], [36, 26]]) g.add(M.part(M.box(5, 5, 48), M.bark('#7a5432'), { at: [x, y, 24] }));
    M.ellipsoid(g, 11, 11, 1, M.plastic('#e8e8e8', { rough: 0.3 }), [-8, 6, 53]);
    g.add(M.part(M.cone(4.5, 5, 9), M.plastic('#d84a2a'), { at: [16, -8, 57], rot: [Math.PI / 2, 0, 0] }));
    M.seg(g, [0, 0, 52], [0, 0, 175], 1.6, M.metal('#dddddd'), { full: true });
    g.add(M.part(M.cone(90, 1, 45), M.cloth('#2f7d9b'), { at: [0, 0, 172], rot: [Math.PI / 2, 0, 0] }));
    return g;
  },
});
Models.define('pot', {
  // A terracotta pot with a flowering plant, standing in a saucer that may hold water (mosquitoes love that).
  view: 'iso',
  variant(o) { return o.water ? 'w' : ''; }, key(o) { return o.water ? 'w' : ''; },
  build(M, o) {
    const g = new THREE.Group(), terra = M.rock('#b0603a', { repeat: 3 });
    g.add(M.part(M.cone(26, 28, 3), M.rock('#a8583a', { repeat: 3 }), { at: [0, 0, 1.5], rot: [Math.PI / 2, 0, 0] }));
    if (o.water) g.add(M.part(M.geo('disc', () => new THREE.CircleGeometry(1, 28)), M.water('#6a9ab8'), { at: [0, 0, 3.2], scale: [25, 25, 1] }));
    g.add(M.part(M.cone(11, 14, 36), terra, { at: [0, 0, 21], rot: [Math.PI / 2, 0, 0] }));
    g.add(M.part(M.cone(15, 15, 5), terra, { at: [0, 0, 39], rot: [Math.PI / 2, 0, 0] }));
    M.ellipsoid(g, 13, 13, 1.5, M.soil('#5a4030'), [0, 0, 41]);
    const leaf = PlantShapes.leafGeo(M, 'potPlant', 1, 0.35, 0.4), r = rng(5);
    M.hairs(g, 60, leaf, M.leaf('#ffffff'), (i, d) => { const a = r() * TAU, dd = r() * 12; d.position.set(Math.cos(a) * dd, Math.sin(a) * dd, 44 + r() * 18); d.rotation.set((r() - 0.5) * 0.6, -0.6 - r() * 0.5, a); d.scale.set(9 + r() * 5, (2.5 + r()) / 0.35, 1); return i % 2 ? '#3f7a3a' : '#5a9a4a'; });
    for (let i = 0; i < 3; i++) { const a = i * 2.1; M.ellipsoid(g, 3, 3, 1.4, M.petal('#f2d040'), [Math.cos(a) * 8, Math.sin(a) * 8, 60 + (i % 2) * 6]); }
    return g;
  },
});
Models.define('isoBirdbath', {
  // A stone bird bath on a pedestal, full of water.
  view: 'iso',
  build(M) {
    const g = new THREE.Group(), prof = [[9, 0], [8, 3], [6, 6], [6, 50], [8, 54], [20, 58], [38, 62], [44, 66], [43, 68], [40, 68], [36, 65], [0.05, 62]];
    const b = new THREE.Mesh(M.lathe(prof, 32), M.rock('#b8b0a0', { repeat: 2 })); b.rotation.x = Math.PI / 2; b.castShadow = b.receiveShadow = true; g.add(b);
    g.add(M.part(M.geo('disc', () => new THREE.CircleGeometry(1, 32)), M.water('#6aa0c0'), { at: [0, 0, 65.5], scale: [37, 37, 1] }));
    return g;
  },
});
Models.define('bucket', {
  // A yellow bucket left out, full of water, with a wire handle.
  view: 'iso',
  build(M) {
    const g = new THREE.Group();
    g.add(M.part(M.cone(14, 18, 35), M.plastic('#e8b030', { rough: 0.4 }), { at: [0, 0, 17.5], rot: [Math.PI / 2, 0, 0] }));
    g.add(M.part(M.geo('disc', () => new THREE.CircleGeometry(1, 28)), M.water('#6a9ab8'), { at: [0, 0, 34], scale: [16.5, 16.5, 1] }));
    const h = new THREE.Mesh(M.tube([[-18, 0, 33], [-16, 0, 48], [0, 0, 56], [16, 0, 48], [18, 0, 33]], 0.8, 0.8), M.metal('#888888')); h.castShadow = true; g.add(h);
    return g;
  },
});
Models.define('sausage', { view: 'iso', build(M) { const g = new THREE.Group(); M.ellipsoid(g, 16, 5, 4.5, M.skin('#9a4a2a', { rough: 0.35 }), [0, 0, 4.2]); return g; } });
Models.define('eggRaft', {
  // The mosquito's egg raft: a little floating cluster of dark eggs.
  view: 'iso', shadow: false,
  build(M) { const g = new THREE.Group(); M.hairs(g, 20, M.sphere(1, 8), M.matte('#3a2a1a'), (i, d) => { const a = i * 2.4, rr = Math.sqrt(i) * 1.6; d.position.set(Math.cos(a) * rr * 1.2, Math.sin(a) * rr * 0.7, 0.8); d.scale.set(1, 1, 1.6); }); return g; },
});
