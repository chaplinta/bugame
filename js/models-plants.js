'use strict';
// 3D models of plants, scenery and the fine ground detail (see js/render3d.js). The ground tiles are
// built by TileModels through Render3D.tile(): thousands of instanced blades, leaves and grains with
// real shadows, repeated seamlessly under the painted colour of each level.

const TileModels = {
  // A blade of grass: a thin tapering strip along +z, bending toward +x, base at the origin.
  bladeGeo(M, len) {
    return M.geo('blade|' + len, () => {
      const T = THREE, g = new T.BufferGeometry(), n = 5, pos = [], uv = [], idx = [];
      for (let i = 0; i <= n; i++) {
        const k = i / n, w = 0.55 * (1 - k * 0.85), bend = k * k * len * 0.35;
        pos.push(-w + bend, 0, k * len, w + bend, 0, k * len);
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
      c.copy(palette[Math.floor(r() * palette.length)]).offsetHSL(0, 0.05, 0.09 + (r() - 0.5) * 0.14);   // lit grass reads brighter than its paint
      api.place(im, d, x, y, c);
    }
  },
};
