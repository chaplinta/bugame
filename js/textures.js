'use strict';
// Material textures, made once in code: seamless 128 px tiles of noise (chitin grain, hair, leaf cells,
// wing membrane, lizard scales, sand, soil, bark, water caustics). Each is a canvas pattern that gets
// laid over a shape with 'multiply' (dark detail) or 'screen' (bright detail), so the colour underneath
// still shows through. Nothing is fetched: it all comes from a seeded random number generator.

const Tex = {
  N: 128,
  blend: true,          // false: plain alpha overlay instead of multiply/screen (slow-device fallback)
  tiles: {},
  patterns: new WeakMap(),

  // ---------------------------------------------------------------- noise fields (all periodic in the tile)
  // Value noise with smooth interpolation, lattice cell (cx, cy) pixels, wrapping at N.
  value(seed, cx, cy) {
    const N = this.N, gx = Math.max(1, Math.round(N / cx)), gy = Math.max(1, Math.round(N / cy)), r = rng(seed);
    const lat = new Float32Array(gx * gy);
    for (let i = 0; i < lat.length; i++) lat[i] = r();
    const out = new Float32Array(N * N);
    const sm = (v) => v * v * (3 - 2 * v);
    for (let y = 0; y < N; y++) {
      const fy = y / N * gy, y0 = Math.floor(fy), ty = sm(fy - y0), y1 = (y0 + 1) % gy;
      for (let x = 0; x < N; x++) {
        const fx = x / N * gx, x0 = Math.floor(fx), tx = sm(fx - x0), x1 = (x0 + 1) % gx;
        const a = lat[y0 * gx + x0], b = lat[y0 * gx + x1], c = lat[y1 * gx + x0], d = lat[y1 * gx + x1];
        out[y * N + x] = (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
      }
    }
    return out;
  },
  // Several octaves added up (0..1 after normalising).
  fbm(seed, cell, octaves, persist, ax, ay) {
    const N = this.N, out = new Float32Array(N * N);
    let amp = 1, total = 0, c = cell;
    for (let o = 0; o < octaves; o++) {
      const f = this.value(seed + o * 101, Math.max(1, c * (ax || 1)), Math.max(1, c * (ay || 1)));
      for (let i = 0; i < out.length; i++) out[i] += f[i] * amp;
      total += amp; amp *= persist; c = Math.max(1, c / 2);
    }
    for (let i = 0; i < out.length; i++) out[i] /= total;
    return out;
  },
  // Cell noise: distance to the nearest and second-nearest of n points (wrapping). Returns {f1, f2} in pixels.
  worley(seed, n) {
    const N = this.N, r = rng(seed), px = [], py = [];
    for (let i = 0; i < n; i++) { px.push(r() * N); py.push(r() * N); }
    const f1 = new Float32Array(N * N), f2 = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let a = 1e9, b = 1e9;
      for (let i = 0; i < n; i++) {
        let dx = Math.abs(px[i] - x), dy = Math.abs(py[i] - y);
        if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy;
        const d = dx * dx + dy * dy;
        if (d < a) { b = a; a = d; } else if (d < b) b = d;
      }
      f1[y * N + x] = Math.sqrt(a); f2[y * N + x] = Math.sqrt(b);
    }
    return { f1, f2 };
  },

  // ---------------------------------------------------------------- tiles
  // Build a tile from a per-pixel function returning [r, g, b, a] (0..255).
  make(fn) {
    const N = this.N, c = document.createElement('canvas');
    c.width = N; c.height = N;
    const ctx = c.getContext('2d'), img = ctx.createImageData(N, N), d = img.data;
    for (let i = 0; i < N * N; i++) {
      const px = fn(i, i % N, Math.floor(i / N));
      d[i * 4] = px[0]; d[i * 4 + 1] = px[1]; d[i * 4 + 2] = px[2]; d[i * 4 + 3] = px[3];
    }
    ctx.putImageData(img, 0, 0);
    return c;
  },
  dark(a) { return [0, 0, 0, Math.max(0, Math.min(255, a * 255)) | 0]; },
  light(a) { return [255, 255, 255, Math.max(0, Math.min(255, a * 255)) | 0]; },

  recipes: {
    // Soft general-purpose grain for anything without a better material.
    grain() { const f = Tex.fbm(1, 8, 3, 0.5); return Tex.make(i => Tex.dark((f[i] - 0.5) * 0.5 + 0.12)); },
    // Insect cuticle: fine grain with tiny pits.
    chitin() {
      const f = Tex.fbm(2, 6, 3, 0.55), w = Tex.worley(3, 60);
      return Tex.make(i => { const pit = Math.max(0, 1 - w.f1[i] / 3.2); return Tex.dark((f[i] - 0.45) * 0.6 + pit * 0.45 + 0.08); });
    },
    // Tiny glints on cuticle (screen).
    chitinHi() { const f = Tex.fbm(4, 4, 2, 0.5); return Tex.make(i => Tex.light(f[i] > 0.66 ? (f[i] - 0.66) * 2.2 : 0)); },
    // Hair and fur: long streaks along x.
    hair() { const f = Tex.fbm(5, 10, 3, 0.5, 4, 0.22); return Tex.make(i => Tex.dark((f[i] - 0.5) * 0.9 + 0.14)); },
    hairHi() { const f = Tex.fbm(6, 10, 2, 0.5, 4, 0.2); return Tex.make(i => Tex.light(f[i] > 0.6 ? (f[i] - 0.6) * 1.6 : 0)); },
    // Leaf: cell walls and soft lobes.
    leaf() {
      const w = Tex.worley(7, 28), f = Tex.fbm(8, 12, 2, 0.5);
      return Tex.make(i => { const e = w.f2[i] - w.f1[i]; return Tex.dark(Math.max(0, 1 - e / 2.2) * 0.3 + (f[i] - 0.5) * 0.3 + 0.06); });
    },
    // Wing membrane: big cells, edges only.
    wing() { const w = Tex.worley(9, 9); return Tex.make(i => { const e = w.f2[i] - w.f1[i]; return Tex.dark(Math.max(0, 1 - e / 2.6) * 0.3); }); },
    // Reptile scales: plates with a dark seam and a darker trailing edge.
    scale() {
      const w = Tex.worley(10, 16);
      return Tex.make(i => { const e = w.f2[i] - w.f1[i]; return Tex.dark(Math.max(0, 1 - e / 3) * 0.55 + Math.min(1, w.f1[i] / 14) * 0.2); });
    },
    // Sand grains: no low frequencies at all, just specks.
    sand() { const r = rng(11); return Tex.make(() => { const v = r(); return Tex.dark(v < 0.18 ? 0.25 + r() * 0.3 : 0); }); },
    sandHi() { const r = rng(12); return Tex.make(() => { const v = r(); return Tex.light(v < 0.12 ? 0.3 + r() * 0.45 : 0); }); },
    // Soil: crumbs with dark cracks between.
    soil() {
      const f = Tex.fbm(13, 10, 3, 0.55), w = Tex.worley(14, 40);
      return Tex.make(i => { const e = w.f2[i] - w.f1[i]; return Tex.dark((f[i] - 0.45) * 0.7 + Math.max(0, 1 - e / 1.8) * 0.35 + 0.1); });
    },
    // Bark: furrows running along y.
    bark() { const f = Tex.fbm(15, 12, 3, 0.55, 0.25, 4); return Tex.make(i => Tex.dark((f[i] - 0.5) * 1.1 + 0.15)); },
    // Light on the bottom of a pond (screen).
    caustic() { const w = Tex.worley(16, 12); return Tex.make(i => { const e = w.f2[i] - w.f1[i]; return Tex.light(Math.max(0, 1 - e / 3.5) ** 2 * 0.9); }); },
    // Water surface ripples (multiply, very light).
    ripple() { const f = Tex.fbm(17, 24, 2, 0.5, 3, 0.6); return Tex.make(i => Tex.dark((f[i] - 0.5) * 0.4 + 0.05)); },
  },

  tile(name) {
    let t = this.tiles[name];
    if (t) return t;
    try { t = this.recipes[name] ? this.recipes[name]() : null; } catch (e) { t = null; }
    if (!t) t = false;   // remembered as missing: never throw inside a draw
    this.tiles[name] = t;
    return t;
  },
  pattern(ctx, name) {
    let m = this.patterns.get(ctx);
    if (!m) { m = new Map(); this.patterns.set(ctx, m); }
    let p = m.get(name);
    if (p !== undefined) return p;
    const t = this.tile(name);
    p = t ? ctx.createPattern(t, 'repeat') : null;
    m.set(name, p);
    return p;
  },
  // Fill the current path with a material. `px` = texture pixels per user unit (bigger = finer grain).
  fillPath(ctx, name, px, alpha, op) {
    const p = this.pattern(ctx, name);
    if (!p) return;
    ctx.save();
    ctx.globalAlpha *= alpha === undefined ? 0.3 : alpha;
    if (this.blend) ctx.globalCompositeOperation = op || 'multiply';
    const k = 1 / (px || 1);
    ctx.scale(k, k);   // the path is already set, so only the pattern scales
    ctx.fillStyle = p;
    ctx.fill();
    ctx.restore();
  },
  fillRect(ctx, name, x, y, w, h, px, alpha, op) {
    ctx.beginPath(); ctx.rect(x, y, w, h);
    this.fillPath(ctx, name, px, alpha, op);
  },
  // Make every tile now (a few ms), so the first frame of a level doesn't pay for it.
  ready() { for (const k in this.recipes) this.tile(k); },
};
