'use strict';
// 3D models of plants, scenery and the fine ground detail (see js/render3d.js). The ground tiles are
// built by TileModels through Render3D.tile(): thousands of instanced blades, leaves and grains with
// real shadows, repeated seamlessly under the painted colour of each level.

const TileModels = {
  // A blade of grass: a thin tapering strip along +z with its width along y (so its face shows from above
  // once it leans over, which is a turn about y), its tip curling back against the lean; base at the origin.
  bladeGeo(M, len) {
    return M.geo('blade|' + len, () => {
      const T = THREE, g = new T.BufferGeometry(), n = 5, pos = [], uv = [], idx = [];
      for (let i = 0; i <= n; i++) {
        const k = i / n, w = 0.55 * (1 - k * 0.85), bend = k * k * len * 0.3;
        pos.push(-bend, -w, k * len, -bend, w, k * len);
        uv.push(0, k, 1, k);
      }
      for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      g.setIndex(idx);
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals();
      return g;
    });
  },
  // Grass seen from above: blades leaning every way, greener or strawier by o.dry, lit and shadowed.
  grass(api, o, seed, cols) {
    const M = Render3D.M, T = THREE, r = rng(seed + 3), size = api.size, len = o.height || 7;
    const n = Math.round(size * size / 30 * (o.density || 1));
    const geo = this.bladeGeo(M, len * 1.6);
    const mat = M.leaf('#ffffff', { repeat: 1 });
    const im = api.inst(geo, mat, n), d = new T.Object3D(), c = new T.Color();
    d.rotation.order = 'ZYX';
    const palette = cols.map((h) => new T.Color(h));
    for (let i = 0; i < n; i++) {
      const x = r() * size, y = r() * size;
      d.rotation.set(0, 0.55 + r() * 0.75, r() * TAU);   // lean toward its own yaw: most blades lie well over
      d.scale.set(0.8 + r() * 0.5, 1, 0.55 + r() * 0.75);
      c.copy(palette[Math.floor(r() * palette.length)]).offsetHSL(0, 0.03, 0.02 + (r() - 0.5) * 0.12);
      api.place(im, d, x, y, c);
    }
  },
};

// ---------------------------------------------------------------- shared shapes
const PlantShapes = {
  // A leaf outline along +x from -len to +len (the litter leaf of ground.js), as 2D points.
  leafPts(len, wid) {
    const p = [];
    const q = (p0, c, p1, n) => { for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); } };
    p.push([-len, 0]); q([-len, 0], [-len * 0.3, -wid], [len * 0.9, -wid * 0.15], 8); q([len * 0.9, -wid * 0.15], [len, 0], [len * 0.9, wid * 0.15], 2); q([len * 0.9, wid * 0.15], [-len * 0.3, wid], [-len, 0], 8);
    return p;
  },
  // A gently cupped leaf geometry (unit length 1 along x, half width 0.35), cached.
  leafGeo(M, key, len, wid, curl) {
    return M.geo('leaf|' + key, () => {
      const g = M.shape(this.leafPts(len, wid), { uv: true }), pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, curl * ((y / wid) * (y / wid) * wid * 0.6 + (x / len) * (x / len) * len * 0.15)); }
      pos.needsUpdate = true; g.computeVertexNormals(); return g;
    });
  },
  // A long narrow leaf with a saw-toothed edge (banksia), along +x from 0 to len.
  serratedGeo(M, key, len, wid) {
    return M.geo('serr|' + key, () => {
      const pts = [[0, 0]];
      for (let s = 4; s <= len; s += 4) pts.push([s, -wid * (s < len * 0.85 ? 1 : (len - s) / (len * 0.15)) - (Math.floor(s / 4) % 2 ? 1.2 : 0)]);
      pts.push([len, 0]);
      for (let s = len - 4; s >= 4; s -= 4) pts.push([s, wid * (s < len * 0.85 ? 1 : (len - s) / (len * 0.15)) + (Math.floor(s / 4) % 2 ? 1.2 : 0)]);
      const g = M.shape(pts, { uv: true }), pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, -(y / wid) * (y / wid) * 1.2 + (x / len) * (x / len) * 3); }   // folds down at the edges, lifts toward the tip
      pos.needsUpdate = true; g.computeVertexNormals(); return g;
    });
  },
  // Sickle gum leaf along +x.
  sickleGeo(M) {
    return M.geo('sickle', () => {
      const pts = [[0, 0]];
      for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; pts.push([u * u * 0 + 2 * u * t * 7 + t * t * 13, u * u * 0 + 2 * u * t * -4 + t * t * -1]); }
      for (let i = 9; i >= 1; i--) { const t = i / 10, u = 1 - t; pts.push([u * u * 0 + 2 * u * t * 7 + t * t * 13, u * u * 0 + 2 * u * t * 0.5 + t * t * -1]); }
      return M.shape(pts, { uv: true });
    });
  },
  // A lumpy rock: a sphere with its vertices pushed in and out by seeded noise.
  rockGeo(M, seed) {
    return M.geo('rock|' + seed, () => {
      const T = THREE, g = new T.SphereGeometry(1, 14, 10), pos = g.attributes.position, r = rng(seed), bumps = [];
      for (let i = 0; i < 6; i++) bumps.push([r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, 0.5 + r() * 0.8, (r() - 0.5) * 0.5]);
      const v = new T.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
        let d = 1;
        for (const [bx, by, bz, w, h] of bumps) { const dd = Math.hypot(v.x - bx, v.y - by, v.z - bz); d += h * Math.exp(-dd * dd / (w * w)); }
        v.multiplyScalar(d); pos.setXYZ(i, v.x, v.y, Math.max(v.z, -0.25));
      }
      pos.needsUpdate = true; g.computeVertexNormals(); g.userData.own = true; return g;
    });
  },
};

Object.assign(TileModels, {
  // Fallen leaves, twigs and gumnuts in three layers, old and dark under fresh and pale.
  litter(api, o, seed) {
    const M = Render3D.M, T = THREE, r = rng(seed + 6), size = api.size, n = Math.round(size * size / 1100 * (o.density || 1));
    const layers = [['#4a3a26', '#5a4630', '#3e3020', '#6a5436'], ['#7a5a34', '#8a6a3e', '#6a4e2e', '#9a7a4a'], ['#b08a4a', '#c89a56', '#a07040', '#d8b070']];
    const geo = PlantShapes.leafGeo(M, 'litter', 1, 0.35, 0.5), mat = M.leaf('#ffffff', { repeat: 1 });
    const leaves = api.inst(geo, mat, n), twigs = api.inst(M.capsule(0.35, 1), M.bark('#6a4a2c'), Math.round(n * 0.12) + 1), nuts = api.inst(M.sphere(1, 10), M.rock('#7a5a3a', { repeat: 4 }), Math.round(n * 0.08) + 1);
    const d = new T.Object3D(), c = new T.Color();
    d.rotation.order = 'ZYX';
    for (let L = 0; L < 3; L++) {
      const cols = layers[L].map((h) => new T.Color(h));
      for (let i = 0; i < n / 3; i++) {
        const x = r() * size, y = r() * size, len = 10 + r() * 16, wid = len * (0.28 + r() * 0.2), a = r() * TAU, k = r();
        if (k < 0.1) { d.rotation.set(0, 0, a); d.scale.set(1, 1, 1); d.position.z = 0.4 + L * 0.5; d.scale.set(len * 1.6, 1, 1); api.place(twigs, d, x, y); continue; }
        if (k < 0.16) { const rr = 3 + r() * 2; d.rotation.set(0, 0, 0); d.scale.set(rr, rr, rr * 0.8); d.position.z = rr * 0.6 + L * 0.3; api.place(nuts, d, x, y); continue; }
        d.rotation.set((r() - 0.5) * 0.35, (r() - 0.5) * 0.35, a); d.scale.set(len, wid / 0.35, 1); d.position.z = 0.3 + L * 0.7 + r() * 0.5;
        c.copy(cols[i % 4]).offsetHSL(0, 0, (r() - 0.5) * 0.08);
        api.place(leaves, d, x, y, c);
      }
    }
  },
  // Crumbs and small stones on soil.
  soil(api, o, seed, base) {
    const M = Render3D.M, T = THREE, r = rng(seed + 2), size = api.size, n = Math.round(size * size / 700 * (o.stones === undefined ? 1 : o.stones));
    const geo = M.sphere(1, 10), crumbs = api.inst(geo, M.soil('#ffffff'), n), stones = api.inst(geo, M.rock('#ffffff', { repeat: 6 }), Math.round(n * 0.2) + 1);
    const d = new T.Object3D(), c = new T.Color(), b = new T.Color(base);
    for (let i = 0; i < n; i++) {
      const x = r() * size, y = r() * size, s = 1 + r() * 2.5, st = r() < 0.15;
      d.rotation.set(0, 0, r() * 3); d.scale.set(s, s * 0.75, s * 0.6); d.position.z = s * 0.35;
      if (st) { c.set(['#b8b0a0', '#a89c88', '#c8c0b0'][i % 3]); api.place(stones, d, x, y, c); }
      else { c.copy(b).offsetHSL(0, 0, (r() - 0.5) * 0.25); api.place(crumbs, d, x, y, c); }
    }
  },
  // Shell grit and dark grains on sand.
  sand(api, o, seed) {
    const M = Render3D.M, T = THREE, r = rng(seed + 1), size = api.size, n = Math.round(size * size / 2500);
    const im = api.inst(M.sphere(1, 8), M.sand('#ffffff'), n), d = new T.Object3D(), c = new T.Color();
    for (let i = 0; i < n; i++) {
      const s = 0.8 + r() * 1.6;
      d.rotation.set(0, 0, r() * 3); d.scale.set(s, s * 0.7, s * 0.5); d.position.z = s * 0.3;
      c.set(r() < 0.6 ? '#fffdf0' : '#5a4630');
      api.place(im, d, r() * size, r() * size, c);
    }
  },
});

// ---------------------------------------------------------------- scenery stamps for the backgrounds
// Each takes o.seed (a few variants per level) and a size; the painters turn them at random angles.
const sixSeeds = (o) => 'd' + ((o.seed || 0) % 6);

Models.define('bgShrub', {
  buckets: 4, variant: sixSeeds, key: sixSeeds,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 1), rad = 30, cols = o.cols || ['#5a7a3c', '#6f8f50', '#809f5c', '#4a6a30'];
    const leafGeo = PlantShapes.leafGeo(M, 'shrub', 1, 0.35, 0.3), T = THREE, c = new T.Color();
    const n = 12 * 14, leaves = [];
    for (let i = 0; i < 12; i++) {
      const a = r() * TAU, l = rad * (0.5 + r() * 0.5), rise = 4 + r() * 6;
      M.seg(g, [0, 0, 2], [Math.cos(a) * l, Math.sin(a) * l, 2 + rise], 0.5, M.bark('#5a4028'), { cone: 0.25 });
      for (let k = 0; k < 14; k++) { const d = l * (0.2 + (k % 7) / 7 * 0.8), side = k < 7 ? 1 : -1; leaves.push([Math.cos(a) * d + Math.cos(a + 1.57) * side * 1.5, Math.sin(a) * d + Math.sin(a + 1.57) * side * 1.5, 2 + rise * d / l + 0.4 + r() * 1.5, a + side * (0.5 + r() * 0.5), 4 + r() * 3, 2.2 + r(), cols[(i + k) % cols.length]]); }
    }
    M.hairs(g, n, leafGeo, M.leaf('#ffffff'), (i, d) => { const L = leaves[i]; d.position.set(L[0], L[1], L[2]); d.rotation.set(0, -0.3, L[3]); d.scale.set(L[4], L[5] / 0.35, 1); return L[6]; });
    for (let i = 0; i < 4; i++) { const a = r() * TAU, dd = r() * rad * 0.7; M.ellipsoid(g, 1.8, 1.8, 1.2, M.petal(['#f2f2f2', '#f0d040', '#e08ad0'][i % 3]), [Math.cos(a) * dd, Math.sin(a) * dd, 9]); }
    return g;
  },
});

Models.define('bgBanksia', {
  buckets: 4, variant: sixSeeds, key: sixSeeds,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 11), rad = 48;
    for (let i = 0; i < 24; i++) {
      const a = r() * TAU, l = rad * (0.7 + r() * 0.5), w = 4 + r() * 2.5;
      const m = new THREE.Mesh(PlantShapes.serratedGeo(M, Math.round(l) + '|' + w.toFixed(1), l, w), M.leaf(i % 2 ? '#6a8a4a' : '#5c7c40', { repeat: 3 }));
      m.castShadow = m.receiveShadow = true; m.position.set(0, 0, 6 + r() * 4); m.rotation.set(0, -0.15 - r() * 0.2, a); g.add(m);
    }
    M.seg(g, [0, 0, 0], [0, 0, 8], 3, M.bark('#4a3a28'));
    for (let i = 0; i < 3 + Math.floor(r() * 3); i++) {
      const a = r() * TAU, d = r() * rad * 0.5, cx = Math.cos(a) * d, cy = Math.sin(a) * d, cr = 6 + r() * 3, h = 14 + r() * 6;
      const cone = M.part(M.cone(cr * 0.8, cr * 0.9, h), M.rock('#b87828', { repeat: 3 }), { at: [cx, cy, h / 2 + 2], rot: [Math.PI / 2, 0, 0] }); g.add(cone);
      M.hairs(g, 60, M.sphere(1, 6), M.hair('#f0b040'), (k, dd) => { const b = k * 2.4, z = 2 + (k / 60) * h; dd.position.set(cx + Math.cos(b) * cr * 0.95, cy + Math.sin(b) * cr * 0.95, z); dd.scale.setScalar(0.9); return k % 2 ? null : '#e89020'; });
    }
    return g;
  },
});

Models.define('bgGrassTree', {
  buckets: 4, variant: sixSeeds, key: sixSeeds,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 21), rad = 32, T = THREE;
    g.add(M.part(M.cone(7, 6, 10), M.bark('#1e1814', { repeat: 2 }), { at: [0, 0, 5], rot: [Math.PI / 2, 0, 0] }));
    const geo = TileModels.bladeGeo(M, 1), up = new T.Vector3(0, 0, 1);
    M.hairs(g, 260, geo, M.leaf('#ffffff'), (i, d) => {
      const a = r() * TAU, l = rad * (0.55 + r() * 0.5), lean = 1.15 + r() * 0.4;
      d.position.set(Math.cos(a) * 3, Math.sin(a) * 3, 9); d.rotation.order = 'ZYX'; d.rotation.set(0, lean, a); d.scale.set(2.0, 1, l * 0.8);
      return ['#a8c860', '#b8d870', '#98b852', '#6a8a3a', '#76983e'][i % 5];
    });
    if (r() < 0.5) { M.seg(g, [0, 0, 10], [6, -8, 40], 1.4, M.bark('#5a4a30'), { cone: 1 }); M.ellipsoid(g, 3, 3, 9, M.rock('#c8a050', { repeat: 4 }), [6.5, -9, 46]); }
    return g;
  },
});

Models.define('bgGum', {
  buckets: 4, variant: sixSeeds, key: sixSeeds,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 31), rad = 55, T = THREE, geo = PlantShapes.sickleGeo(M), leaves = [];
    g.add(M.part(M.cone(7, 6, 30), M.bark('#9a8a70', { repeat: 2 }), { at: [0, 0, 15], rot: [Math.PI / 2, 0, 0] }));
    for (let i = 0; i < 7; i++) {
      const a = r() * TAU, l = rad * (0.6 + r() * 0.4);
      M.seg(g, [0, 0, 28], [Math.cos(a) * l * 0.5, Math.sin(a) * l * 0.5, 32], 2.4, M.bark('#b8a890'), { cone: 1.6 });
      M.seg(g, [Math.cos(a) * l * 0.5, Math.sin(a) * l * 0.5, 32], [Math.cos(a) * l, Math.sin(a) * l, 34], 1.5, M.bark('#c8b8a0'), { cone: 0.8 });
      for (let k = 0; k < 39; k++) { const d = l * (0.3 + (k % 13) / 13 * 0.75); leaves.push([Math.cos(a) * d + (r() - 0.5) * 16, Math.sin(a) * d + (r() - 0.5) * 16, 30 + (k % 13) * 0.5 + r() * 7, a + (r() - 0.5) * 2.6, k % 3 ? '#6b8f4a' : '#7ea35a']); }
    }
    M.hairs(g, leaves.length, geo, M.leaf('#ffffff'), (i, d) => { const L = leaves[i]; d.position.set(L[0], L[1], L[2]); d.rotation.set((r() - 0.5) * 0.8, -0.4 - r() * 0.5, L[3]); d.scale.setScalar(1.5); return L[4]; });
    for (let i = 0; i < 8; i++) { const L = leaves[Math.floor(r() * leaves.length)]; M.ellipsoid(g, 2, 2, 2, M.rock('#8a6a3a', { repeat: 5 }), [L[0], L[1], L[2]]); }
    for (let i = 0; i < 5; i++) { const L = leaves[Math.floor(r() * leaves.length)]; M.hairs(g, 14, M.cone(0.25, 0.05, 3), M.hair('#f8f0d0'), (q, d) => { const a = q * 0.45, up = Math.sin(q * 1.7) * 0.5; d.position.set(L[0], L[1], L[2] + 1); d.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(Math.cos(a), Math.sin(a), up).normalize()); d.position.addScaledVector(new T.Vector3(Math.cos(a), Math.sin(a), up).normalize(), 1.5); }); }
    return g;
  },
});

Models.define('bgTuft', {
  buckets: 4,
  variant(o) { return 'd' + ((o.seed || 0) % 6) + (o.kind || ''); },
  key(o) { return 'd' + ((o.seed || 0) % 6) + (o.kind || ''); },
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 41), rad = 24;
    const cols = { dry: ['#d8c870', '#c8b868', '#e8d888'], spinifex: ['#c0cc78', '#d4d48c', '#a8b868'], green: ['#6a9a3c', '#7aaa46', '#8aba52'], straw: ['#c8c878', '#d8d888', '#a8a860'] }[o.kind || 'dry'];
    M.hairs(g, 100, TileModels.bladeGeo(M, 1), M.leaf('#ffffff'), (i, d) => {
      const a = r() * TAU, l = rad * (0.5 + r() * 0.6), lean = 1.1 + r() * 0.4;
      d.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, 1.2); d.rotation.order = 'ZYX'; d.rotation.set(0, lean, a); d.scale.set(2.2, 1, l * 0.95);
      return cols[i % 3];
    });
    M.ellipsoid(g, 3.5, 3, 1.5, M.soil('#5a4a2a'), [0, 0, 0.5]);
    return g;
  },
});

Models.define('bgRock', {
  buckets: 4,
  variant(o) { return 'd' + ((o.seed || 0) % 6) + (o.kind || '') + (o.moss ? 'm' : ''); },
  key(o) { return 'd' + ((o.seed || 0) % 6) + (o.kind || '') + (o.moss ? 'm' : ''); },
  build(M, o) {
    const g = new THREE.Group(), seed = (o.seed || 0) % 6, col = o.kind === 'laterite' ? '#9a5a3a' : o.kind === 'grey' ? '#8a8a84' : '#c8bca4';
    const m = new THREE.Mesh(PlantShapes.rockGeo(M, seed + 51), M.rock(col, { repeat: 2 })); m.castShadow = m.receiveShadow = true;
    m.scale.set(12, 11, 7); m.position.z = 5; g.add(m);
    if (o.moss) M.ellipsoid(g, 5, 3.5, 1.2, M.fur('#5a8a3a'), [3, 2, 11.5]);
    return g;
  },
});

Models.define('bgLog', {
  buckets: 4,
  variant(o) { return 'd' + ((o.seed || 0) % 6) + (o.thin ? 't' : ''); },
  key(o) { return 'd' + ((o.seed || 0) % 6) + (o.thin ? 't' : ''); },
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 61), len = o.thin ? 100 : 120, rad = o.thin ? 3.5 : 14, col = o.thin ? '#4a3420' : '#6a5034';
    const barkMap = M.paint('logBark' + (o.seed || 0) % 6, 256, 128, (ctx, w, h) => { ctx.fillStyle = col; ctx.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { const y = r() * h; ctx.strokeStyle = 'rgba(30,18,8,' + (0.3 + r() * 0.3) + ')'; ctx.lineWidth = 1 + r() * 2.5; ctx.beginPath(); for (let s = 0; s <= w; s += 10) { s ? ctx.lineTo(s, y + Math.sin(s / 23 + i) * 2.5) : ctx.moveTo(s, y); } ctx.stroke(); } for (let i = 0; i < 6; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(170,190,120,.5)' : 'rgba(210,200,150,.4)'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 4 + r() * 8, 3 + r() * 5, r() * 3, 0, TAU); ctx.fill(); } });
    const body = M.part(M.cone(rad, rad * 0.9, len), M.bark('#ffffff', { map: barkMap, repeat: 1 }), { at: [0, 0, rad], rot: [0, 0, Math.PI / 2] }); g.add(body);
    const endMap = M.paint('endGrain', 64, 64, (ctx, w, h) => { ctx.fillStyle = '#c8a070'; ctx.fillRect(0, 0, w, h); for (let i = 1; i < 7; i++) { ctx.strokeStyle = 'rgba(90,60,30,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * i / 14, h * i / 15, 0, 0, TAU); ctx.stroke(); } }, { clamp: true });
    for (const s of [-1, 1]) { const cap = M.part(M.geo('disc', () => new THREE.CircleGeometry(1, 20)), M.rock('#ffffff', { map: endMap }), { at: [s * len / 2 + s * 0.05, 0, rad], rot: [0, s * Math.PI / 2, 0], scale: [rad * (s > 0 ? 0.9 : 1), rad * (s > 0 ? 0.9 : 1), 1] }); g.add(cap); }
    if (!o.thin) { M.seg(g, [20, 0, rad * 1.6], [34, -10, rad * 2.2], 2, M.bark(col), { cone: 1 }); }
    return g;
  },
});

Models.define('bgLily', {
  buckets: 4, variant: sixSeeds, key: sixSeeds, shadow: false,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 71), s = 20, pts = [[0, 0]];
    for (let a = 0.12; a <= TAU - 0.12; a += 0.25) pts.push([Math.cos(a) * s, Math.sin(a) * s]);
    const veins = M.paint('lilyPad', 128, 128, (ctx, w, h) => { const gr = ctx.createRadialGradient(w * 0.4, h * 0.4, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, '#6aa848'); gr.addColorStop(1, '#3a7a2c'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(30,70,30,.4)'; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2 + Math.cos(k * 0.7) * w * 0.5, h / 2 + Math.sin(k * 0.7) * h * 0.5); ctx.stroke(); } });
    const m = new THREE.Mesh(M.shape(pts, { uv: true }), M.leaf('#ffffff', { map: veins })); m.castShadow = false; m.receiveShadow = true; m.position.z = 0.6; m.rotation.z = r() * TAU; g.add(m);
    return g;
  },
});

Models.define('bgWeed', {
  buckets: 4, variant: sixSeeds, key: sixSeeds, shadow: false,
  build(M, o) {
    const g = new THREE.Group(), r = rng((o.seed || 0) % 6 + 81), T = THREE;
    M.hairs(g, 18, TileModels.bladeGeo(M, 1), M.leaf('#ffffff'), (i, d) => {
      const a = r() * TAU, dd = r() * 40, l = 14 + r() * 18;
      d.position.set(Math.cos(a) * dd, Math.sin(a) * dd, 0.5); d.rotation.order = 'ZYX'; d.rotation.set(0, 1.1 + r() * 0.4, r() * TAU); d.scale.set(2.2, 1, l * 1.4);
      return i % 2 ? '#2f6b2a' : '#3f8236';
    });
    return g;
  },
});
