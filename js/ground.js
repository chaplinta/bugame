'use strict';
// Real-looking ground, painted once per level into the background canvas:
// a slow, low-resolution noise field gives the broad light and dark (damp patches, dune swell, soil
// tone) and is lit like a relief map; fine grain comes from the material tiles in textures.js and
// from thousands of small strokes (grass blades, leaves, ripples) on top.

const Ground = {
  SUN: [-0.55, -0.83, 0.6],

  // Non-repeating value noise, w x h samples, lattice `cell` samples wide, `oct` octaves.
  field(w, h, seed, cell, oct, persist) {
    const out = new Float32Array(w * h);
    let amp = 1, total = 0, c = cell;
    const sm = (v) => v * v * (3 - 2 * v);
    for (let o = 0; o < (oct || 3); o++) {
      const gx = Math.ceil(w / c) + 2, gy = Math.ceil(h / c) + 2, r = rng(seed + o * 7919);
      const lat = new Float32Array(gx * gy);
      for (let i = 0; i < lat.length; i++) lat[i] = r();
      for (let y = 0; y < h; y++) {
        const fy = y / c, y0 = Math.floor(fy), ty = sm(fy - y0);
        for (let x = 0; x < w; x++) {
          const fx = x / c, x0 = Math.floor(fx), tx = sm(fx - x0);
          const i0 = y0 * gx + x0;
          const a = lat[i0], b = lat[i0 + 1], cc = lat[i0 + gx], d = lat[i0 + gx + 1];
          const top = a + (b - a) * tx, bot = cc + (d - cc) * tx;
          out[y * w + x] += (top + (bot - top) * ty) * amp;
        }
      }
      total += amp; amp *= (persist || 0.5); c = Math.max(2, c / 2);
    }
    for (let i = 0; i < out.length; i++) out[i] /= total;
    return out;
  },

  // Colour a field with a ramp [[t, '#hex'], ...] and light it from the sun by its slopes.
  // Draws it stretched over W x H and returns the field so callers can reuse it (e.g. for damp areas).
  macro(ctx, W, H, seed, ramp, opts) {
    opts = opts || {};
    const res = opts.res || 0.25, fw = Math.max(8, Math.ceil(W * res)), fh = Math.max(8, Math.ceil(H * res));
    const f = this.field(fw, fh, seed, (opts.cell || 90) * res, opts.oct || 3, opts.persist || 0.55);
    const relief = opts.relief === undefined ? 0.4 : opts.relief;
    const cols = ramp.map(([t, c]) => [t, hexRGB(c)]);
    const c = document.createElement('canvas'); c.width = fw; c.height = fh;
    const x = c.getContext('2d'), img = x.createImageData(fw, fh), d = img.data;
    const [sx, sy, sz] = this.SUN;
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
      const k = j * fw + i, v = f[k];
      // slope from neighbours -> how much the surface faces the sun
      const dx = (f[j * fw + Math.min(fw - 1, i + 1)] - f[j * fw + Math.max(0, i - 1)]) * relief * 12;
      const dy = (f[Math.min(fh - 1, j + 1) * fw + i] - f[Math.max(0, j - 1) * fw + i]) * relief * 12;
      const nl = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const light = 0.82 + 0.4 * Math.max(0, (-dx * sx - dy * sy + sz) * nl) - 0.25 * relief;
      // ramp
      let a = cols[0], b = cols[cols.length - 1];
      for (let q = 1; q < cols.length; q++) if (v <= cols[q][0]) { a = cols[q - 1]; b = cols[q]; break; }
      const t = Math.max(0, Math.min(1, (v - a[0]) / Math.max(1e-6, b[0] - a[0])));
      d[k * 4] = Math.min(255, (a[1][0] + (b[1][0] - a[1][0]) * t) * light);
      d[k * 4 + 1] = Math.min(255, (a[1][1] + (b[1][1] - a[1][1]) * t) * light);
      d[k * 4 + 2] = Math.min(255, (a[1][2] + (b[1][2] - a[1][2]) * t) * light);
      d[k * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'low';
    ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
    ctx.drawImage(c, 0, 0, fw, fh, 0, 0, W, H);
    ctx.restore();
    return { f, fw, fh };
  },

  // Fine detail (blades, crumbs, leaves) drawn once into a seamless tile and repeated over W x H, so a
  // big world costs the same as a small one. fn(ctx, tw, th, put) draws into the tile; `put(x, y, draw)`
  // calls draw(x, y) and again shifted by a tile width or height when (x, y) is within `m` of an edge,
  // so nothing is cut off at the seams. The tile is rendered at the canvas's own resolution.
  micro(ctx, W, H, seed, m, fn, o) {
    o = o || {};
    const tw = o.tw || 448, th = o.th || 416;
    const s = Math.min(2, Math.max(0.5, ctx.getTransform().a || 1));
    const c = document.createElement('canvas');
    c.width = Math.ceil(tw * s); c.height = Math.ceil(th * s);
    const x = c.getContext('2d');
    x.scale(s, s);
    const put = (px, py, draw) => {
      draw(px, py);
      const dx = px < m ? tw : px > tw - m ? -tw : 0, dy = py < m ? th : py > th - m ? -th : 0;
      if (dx) draw(px + dx, py);
      if (dy) draw(px, py + dy);
      if (dx && dy) draw(px + dx, py + dy);
    };
    fn(x, tw, th, put);
    ctx.save();
    ctx.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    ctx.scale(1 / s, 1 / s);
    ctx.fillStyle = ctx.createPattern(c, 'repeat');
    ctx.fillRect(0, 0, W * s, H * s);
    ctx.restore();
  },

  // Soft dark ring where something sits on the ground (ambient occlusion), slightly offset from the sun.
  contact(ctx, x, y, rx, ry, a) {
    // offset away from the light, whichever way the sprite is turned
    const [lx, ly] = typeof lightDir === 'function' ? lightDir(ctx) : [-0.55, -0.83];
    x -= lx * 2.5; y -= ly * 2.5;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rx);
    gr.addColorStop(0, 'rgba(25,15,5,' + (a === undefined ? 0.35 : a) + ')');
    gr.addColorStop(0.7, 'rgba(25,15,5,' + (a === undefined ? 0.35 : a) * 0.5 + ')');
    gr.addColorStop(1, 'rgba(25,15,5,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  },

  // Shade from trees overhead: clusters of leaf shadows with sunny gaps. Shadows are soft anyway, so
  // the whole layer is drawn at a third of the resolution and scaled up once.
  canopy(ctx, W, H, seed, opts) {
    opts = opts || {};
    const r = rng(seed), n = Math.round(W * H / 60000 * (opts.density || 1)), alpha = opts.alpha || 0.25;
    const res = 0.34, lw = Math.ceil(W * res), lh = Math.ceil(H * res);
    const layer = document.createElement('canvas'); layer.width = lw; layer.height = lh;
    const x = layer.getContext('2d');
    x.scale(res, res);
    for (let i = 0; i < n; i++) {
      const cx = r() * W, cy = r() * H, rad = 120 + r() * 160;
      const gr = x.createRadialGradient(cx, cy, rad * 0.3, cx, cy, rad);
      gr.addColorStop(0, 'rgba(15,25,10,' + alpha + ')'); gr.addColorStop(1, 'rgba(15,25,10,0)');
      x.fillStyle = gr; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      // soft leaf shadows inside the cluster
      for (let k = 0; k < 30; k++) {
        const a = r() * TAU, dd = r() * rad * 0.8, lx = cx + Math.cos(a) * dd, ly = cy + Math.sin(a) * dd, lr = 6 + r() * 8;
        const lg = x.createRadialGradient(lx, ly, 0, lx, ly, lr);
        lg.addColorStop(0, 'rgba(15,25,10,' + alpha * 0.5 + ')'); lg.addColorStop(1, 'rgba(15,25,10,0)');
        x.fillStyle = lg; x.beginPath(); x.ellipse(lx, ly, lr * 1.6, lr * 0.7, r() * TAU, 0, TAU); x.fill();
      }
    }
    // Sun gaps
    for (let i = 0; i < n * 3; i++) {
      const cx = r() * W, cy = r() * H, rad = 12 + r() * 30;
      const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gr.addColorStop(0, 'rgba(255,245,200,' + (opts.sun || 0.14) + ')');
      gr.addColorStop(1, 'rgba(255,245,200,0)');
      x.fillStyle = gr; x.beginPath(); x.ellipse(cx, cy, rad, rad * 0.6, r() * TAU, 0, TAU); x.fill();
    }
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(layer, 0, 0, lw, lh, 0, 0, W, H);
    ctx.restore();
  },

  // Gentle darkening toward the edges, so the eye stays on the middle.
  finish(ctx, W, H) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.5, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    v.addColorStop(0, 'rgba(30,20,10,0)'); v.addColorStop(1, 'rgba(30,20,10,.22)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  },

  // ---------------------------------------------------------------- surfaces
  sand(ctx, W, H, seed, o) {
    o = o || {};
    const pale = o.pale || '#efe0bc', mid = o.mid || '#dcc58f', dark = o.dark || '#b89a62';
    this.macro(ctx, W, H, seed, [[0, dark], [0.45, mid], [1, pale]], { cell: o.cell || 160, relief: o.relief === undefined ? 0.35 : o.relief });
    Tex.fillRect(ctx, [['sand', 0.55], ['sandHi', 0.5]], 0, 0, W, H, 1.4, 1);
    const r = rng(seed + 1);
    if (o.ripples !== false) {
      // Wind ripples: long gentle waves, a bright crest line and a shadow line beside it (drawn over the
      // whole area, not tiled, so the repeat never shows on these long lines)
      const n = Math.round(W * H / 9000 * (o.ripples || 1));
      for (let i = 0; i < n; i++) {
        const x0 = r() * W, y0 = r() * H, len = 60 + r() * 120, a = (o.wind || -0.3) + (r() - 0.5) * 0.5;
        const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
        ctx.beginPath();
        for (let s = 0; s <= len; s += 6) { const w = Math.sin(s / 11 + i) * 2.2; const px = x0 + dx * s + nx * w, py = y0 + dy * s + ny * w; s ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.strokeStyle = 'rgba(255,250,230,.28)'; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.save(); ctx.translate(nx * 1.6, ny * 1.6); ctx.strokeStyle = 'rgba(90,70,40,.18)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
      }
    }
    // Shell grit and dark grains
    this.micro(ctx, W, H, seed, 4, (x, tw, th, put) => {
      for (let i = 0; i < tw * th / 2500; i++) {
        const s = 0.8 + r() * 1.6, col = r() < 0.6 ? 'rgba(255,255,250,.55)' : 'rgba(70,50,30,.35)', rot = r() * 3;
        put(r() * tw, r() * th, (qx, qy) => { x.fillStyle = col; x.beginPath(); x.ellipse(qx, qy, s, s * 0.7, rot, 0, TAU); x.fill(); });
      }
    });
  },

  soil(ctx, W, H, seed, o) {
    o = o || {};
    const base = o.base || '#9a7a52', dark = o.dark || '#5a4028', light = o.light || '#b89a6e';
    this.macro(ctx, W, H, seed, [[0, dark], [0.5, base], [1, light]], { cell: o.cell || 120, relief: o.relief === undefined ? 0.5 : o.relief });
    Tex.fillRect(ctx, [['soil', 0.5], ['sandHi', 0.18]], 0, 0, W, H, 1.2, 1);
    const r = rng(seed + 2);
    // Crumbs and small stones, each with a little shadow
    const stones = o.stones === undefined ? 1 : o.stones;
    if (stones > 0) this.micro(ctx, W, H, seed, 8, (x, tw, th, put) => {
      const n = Math.round(tw * th / 700 * stones);
      for (let i = 0; i < n; i++) {
        const px = r() * tw, py = r() * th, s = 1 + r() * 2.5, st = r() < 0.15, rot = r() * 3, col = st ? ['#b8b0a0', '#a89c88', '#c8c0b0'][i % 3] : tint(base, (r() - 0.5) * 0.5);
        put(px, py, (qx, qy) => {
          x.fillStyle = 'rgba(30,20,10,.3)'; x.beginPath(); x.ellipse(qx + 1.2, qy + 1.6, s * 1.1, s * 0.8, 0, 0, TAU); x.fill();
          x.fillStyle = col; x.beginPath(); x.ellipse(qx, qy, s, s * 0.75, rot, 0, TAU); x.fill();
          if (st) { x.fillStyle = 'rgba(255,255,255,.4)'; x.beginPath(); x.ellipse(qx - s * 0.3, qy - s * 0.3, s * 0.4, s * 0.25, 0, 0, TAU); x.fill(); }
        });
      }
    });
    if (o.cracks) {
      ctx.strokeStyle = 'rgba(40,25,10,' + 0.35 * o.cracks + ')'; ctx.lineWidth = 1.2;
      for (let i = 0; i < W * H / 40000 * o.cracks; i++) {
        let x = r() * W, y = r() * H, a = r() * TAU;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let k = 0; k < 8; k++) { a += (r() - 0.5) * 1.2; x += Math.cos(a) * 14; y += Math.sin(a) * 14; ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }
  },

  // Grass seen from above: a dark base, then thousands of short blades leaning every way, lit from the sun.
  grass(ctx, W, H, seed, o) {
    o = o || {};
    const dry = o.dry || 0;
    const green = ['#5a8a34', '#6a9a40', '#7aa84a', '#4a7a2c'], straw = ['#c8b878', '#b8a060', '#d8c890', '#a89050'];
    const cols = green.map((g, i) => mixHex(g, straw[i], dry));
    this.macro(ctx, W, H, seed, [[0, mixHex('#3a5a22', '#8a7a40', dry)], [0.5, mixHex('#4f7a30', '#a89860', dry)], [1, mixHex('#6a9a44', '#c8b878', dry)]], { cell: o.cell || 140, relief: 0.2 });
    Tex.fillRect(ctx, 'soil', 0, 0, W, H, 1, 0.25, 'multiply');
    const len = o.height || 7;
    const [sx, sy] = this.SUN;
    // Shadows first, then blades, batched by colour; all drawn once into a repeating tile
    this.micro(ctx, W, H, seed, len * 1.5 + 3, (x, tw, th, put) => {
      const rr = rng(seed + 3), n = Math.round(tw * th / 28 * (o.density || 1));
      const buckets = cols.map(() => []);
      for (let i = 0; i < n; i++) {
        const a = rr() * TAU, l = len * (0.6 + rr() * 0.8);
        buckets[Math.floor(rr() * cols.length)].push(rr() * tw, rr() * th, Math.cos(a) * l, Math.sin(a) * l, Math.cos(a) * sx + Math.sin(a) * sy);
      }
      x.lineCap = 'round';
      const blades = (b, test, ox, oy) => { x.beginPath(); for (let i = 0; i < b.length; i += 5) if (test(b[i + 4])) put(b[i], b[i + 1], (px, py) => { x.moveTo(px + ox, py + oy); x.lineTo(px + ox + b[i + 2], py + oy + b[i + 3]); }); x.stroke(); };
      x.strokeStyle = 'rgba(20,30,10,.22)'; x.lineWidth = 1.6;
      for (const b of buckets) blades(b, () => true, 1.5, 2.2);
      // blades pointing at the sun are lit, blades pointing away are darker
      x.lineWidth = 1.35;
      for (let c = 0; c < cols.length; c++) {
        x.strokeStyle = tint(cols[c], 0.18); blades(buckets[c], (d) => d > 0, 0, 0);
        x.strokeStyle = tint(cols[c], -0.22); blades(buckets[c], (d) => d <= 0, 0, 0);
      }
    });
  },

  lawn(ctx, W, H, seed, o) {
    o = o || {};
    this.grass(ctx, W, H, seed, { height: 5, density: 0.5, dry: o.dry || 0.1, cell: 200 });
    // Mown stripes
    if (o.stripes !== false) {
      for (let x = 0; x < W; x += 120) { ctx.fillStyle = (x / 120) % 2 ? 'rgba(255,255,230,.06)' : 'rgba(0,20,0,.06)'; ctx.fillRect(x, 0, 120, H); }
    }
    // Clover patches and worn spots
    const r = rng(seed + 4);
    for (let i = 0; i < W * H / 60000 * (o.clover === undefined ? 1 : o.clover); i++) {
      const cx = r() * W, cy = r() * H, rad = 30 + r() * 50;
      for (let k = 0; k < rad; k++) { const a = r() * TAU, d = r() * rad; ctx.fillStyle = k % 2 ? '#4a8a3a' : '#5a9a48'; ctx.beginPath(); ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3, 2.4, r() * 3, 0, TAU); ctx.fill(); }
    }
  },

  // Still water seen from above: deeper is darker, light dances on the bottom in the shallows.
  water(ctx, W, H, seed, o) {
    o = o || {};
    const shallow = o.shallow || '#6ab8d8', deep = o.deep || '#1e4f78';
    const m = this.macro(ctx, W, H, seed, [[0, deep], [0.6, mixHex(deep, shallow, 0.5)], [1, shallow]], { cell: o.cell || 260, relief: 0, oct: 2 });
    if (o.depth === 'radial') {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.15, W / 2, H / 2, Math.max(W, H) * 0.6);
      g.addColorStop(0, hexA(deep, 0.75)); g.addColorStop(1, hexA(deep, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // Weed beds below the surface
    const r = rng(seed + 5);
    for (let i = 0; i < W * H / 50000 * (o.weed === undefined ? 1 : o.weed); i++) {
      const cx = r() * W, cy = r() * H, rad = 40 + r() * 90;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, 'rgba(30,80,50,.45)'); g.addColorStop(1, 'rgba(30,80,50,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.7, r() * 3, 0, TAU); ctx.fill();
    }
    const ca = o.caustics === undefined ? 0.3 : o.caustics;
    Tex.fillRect(ctx, 'caustic', 0, 0, W, H, 1.1, ca * 0.5, 'screen');
    Tex.fillRect(ctx, 'caustic', 0, 0, W, H, 2.3, ca * 0.3, 'screen');
    Tex.fillRect(ctx, 'ripple', 0, 0, W, H, 0.35, 0.2, 'multiply');
    // Sparkle on the surface
    for (let i = 0; i < W * H / 6000; i++) {
      const x = r() * W, y = r() * H, l = 3 + r() * 10;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.15 + r() * 0.35) + ')'; ctx.lineWidth = 1 + r();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + (r() - 0.5) * 2); ctx.stroke();
    }
    return m;
  },

  // Fallen leaves, twigs, bark and gumnuts in three layers from old and dark to fresh.
  litter(ctx, W, H, seed, o) {
    o = o || {};
    this.soil(ctx, W, H, seed, { base: '#6a5238', dark: '#3e2e1c', light: '#8a6e4c', stones: 0.3 });
    const r = rng(seed + 6);
    const layers = [
      ['#4a3a26', '#5a4630', '#3e3020', '#6a5436'],
      ['#7a5a34', '#8a6a3e', '#6a4e2e', '#9a7a4a'],
      ['#b08a4a', '#c89a56', '#a07040', '#d8b070'],
    ];
    // A bigger tile than usual, so the repeat is harder to spot among the leaves
    this.micro(ctx, W, H, seed, 32, (x, tw, th, put) => {
      const n = Math.round(tw * th / 1100 * (o.density || 1));
      for (let L = 0; L < 3; L++) {
        const cols = layers[L], shade = 0.25 + L * 0.08;
        for (let i = 0; i < n / 3; i++) {
          const px = r() * tw, py = r() * th, len = 10 + r() * 16, wid = len * (0.28 + r() * 0.2), a = r() * TAU, k = r(), v = r(), col = cols[i % cols.length];
          if (k < 0.1) put(px, py, (qx, qy) => this.twig(x, qx, qy, len * 2, a, shade));
          else if (k < 0.16) put(px, py, (qx, qy) => this.gumnut(x, qx, qy, 3 + v * 2, shade));
          else put(px, py, (qx, qy) => this.leafShape(x, qx, qy, len, wid, a, col, shade, v));
        }
      }
    }, { tw: 640, th: 576 });
  },
  leafShape(ctx, x, y, len, wid, a, col, shade, v) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const path = () => { ctx.beginPath(); ctx.moveTo(-len, 0); ctx.quadraticCurveTo(-len * 0.3, -wid, len * 0.9, -wid * 0.15); ctx.quadraticCurveTo(len, 0, len * 0.9, wid * 0.15); ctx.quadraticCurveTo(-len * 0.3, wid, -len, 0); ctx.closePath(); };
    // shadow, cast away from the sun
    ctx.save(); ctx.translate(2.5, 3.5); path(); ctx.fillStyle = 'rgba(20,12,5,' + shade + ')'; ctx.fill(); ctx.restore();
    path();
    const g = ctx.createLinearGradient(0, -wid, 0, wid);
    g.addColorStop(0, tint(col, 0.3)); g.addColorStop(0.5, col); g.addColorStop(1, tint(col, -0.3));
    ctx.fillStyle = g; ctx.fill();
    if (Shade.rich) Tex.fillPath(ctx, 'leaf', 1.2, 0.3, 'multiply');
    ctx.strokeStyle = tint(col, -0.5); ctx.lineWidth = 0.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-len * 0.9, 0); ctx.quadraticCurveTo(0, (v || 0.5) * wid * 0.3, len * 0.85, 0); ctx.strokeStyle = tint(col, -0.4); ctx.lineWidth = 0.7; ctx.stroke();
    if (v > 0.6) { ctx.beginPath(); ctx.moveTo(-len * 0.5, -wid * 0.5); ctx.quadraticCurveTo(0, -wid * 0.75, len * 0.5, -wid * 0.3); ctx.strokeStyle = 'rgba(255,245,220,.35)'; ctx.lineWidth = 1.2; ctx.stroke(); }
    ctx.restore();
  },
  twig(ctx, x, y, len, a, shade) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.strokeStyle = 'rgba(20,12,5,' + shade + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-len / 2 + 2, 3); ctx.quadraticCurveTo(0, 5, len / 2 + 2, 2); ctx.stroke();
    ctx.strokeStyle = '#6a4a2c'; ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.quadraticCurveTo(0, 2, len / 2, -1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,190,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-len / 2, -1); ctx.quadraticCurveTo(0, 1, len / 2, -2); ctx.stroke();
    ctx.restore();
  },
  gumnut(ctx, x, y, rr, shade) {
    ctx.fillStyle = 'rgba(20,12,5,' + shade + ')'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, rr, rr * 0.8, 0, 0, TAU); ctx.fill();
    ell(ctx, x, y, rr, rr, '#7a5a3a', 0, 'grain');
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(x, y, rr * 0.45, 0, TAU); ctx.fill();
  },

  // Bark across a rectangle: furrows along `axis` ('y' = up and down).
  bark(ctx, x, y, w, h, seed, o) {
    o = o || {};
    const col = o.color || '#7a5a3a', axis = o.axis || 'y';
    const g = axis === 'y' ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, tint(col, 0.25)); g.addColorStop(0.35, col); g.addColorStop(1, tint(col, -0.45));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.beginPath(); ctx.rect(x, y, w, h);
    if (axis === 'x') { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 2); Tex.fillPath(ctx, 'bark', 1, 0.55, 'multiply'); ctx.restore(); }
    else Tex.fillPath(ctx, 'bark', 1, 0.55, 'multiply');
    // Furrows and lichen
    const r = rng(seed || 1), n = Math.round((axis === 'y' ? w : h) / 9);
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const p = r(), long = axis === 'y' ? h : w;
      ctx.strokeStyle = 'rgba(30,18,8,' + (0.25 + r() * 0.3) + ')'; ctx.lineWidth = 1 + r() * 1.5;
      ctx.beginPath();
      for (let s = 0; s <= long; s += 10) {
        const wob = Math.sin(s / 23 + i) * 2.5;
        const px = axis === 'y' ? x + p * w + wob : x + s, py = axis === 'y' ? y + s : y + p * h + wob;
        s ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    for (let i = 0; i < n * 0.3; i++) { const px = x + r() * w, py = y + r() * h; ctx.fillStyle = r() < 0.5 ? 'rgba(170,190,120,.5)' : 'rgba(210,200,150,.4)'; ctx.beginPath(); ctx.ellipse(px, py, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, TAU); ctx.fill(); }
  },
  endGrain(ctx, x, y, rx, ry) {
    ell(ctx, x, y, rx, ry, '#c8a070', 0, 'none');
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x, y, rx * i / 6, ry * i / 6, 0, 0, TAU); ctx.strokeStyle = 'rgba(90,60,30,.45)'; ctx.lineWidth = 0.8; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rx * 0.7, y - ry * 0.4); ctx.strokeStyle = 'rgba(60,40,20,.6)'; ctx.lineWidth = 1; ctx.stroke();
  },

  // A rock with a lit top, pitted sides and a shadow on the ground.
  rock(ctx, x, y, rad, seed, o) {
    o = o || {};
    const r = rng(seed || 2), col = o.color || (o.kind === 'laterite' ? '#9a5a3a' : '#c8bca4');
    this.contact(ctx, x, y, rad * 1.4, rad * 1.1, 0.45);
    const pts = [];
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, d = rad * (0.75 + r() * 0.3); pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85]); }
    const path = () => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); };
    path();
    const g = ctx.createRadialGradient(x - rad * 0.4, y - rad * 0.45, rad * 0.1, x, y, rad * 1.2);
    g.addColorStop(0, tint(col, 0.35)); g.addColorStop(0.6, col); g.addColorStop(1, tint(col, -0.5));
    ctx.fillStyle = g; ctx.fill();
    if (Shade.rich) Tex.fillPath(ctx, 'soil', 1.5, 0.35, 'multiply');
    ctx.strokeStyle = tint(col, -0.6); ctx.lineWidth = 0.8; ctx.stroke();
    for (let i = 0; i < rad; i++) { const a = r() * TAU, d = r() * rad * 0.8; ctx.fillStyle = 'rgba(40,30,20,.3)'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85, 1 + r() * 2, 0.8 + r() * 1.4, r() * 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,245,.3)'; ctx.beginPath(); ctx.ellipse(x - rad * 0.35, y - rad * 0.4, rad * 0.35, rad * 0.15, -0.5, 0, TAU); ctx.fill();
    if (o.moss) { ctx.fillStyle = 'rgba(90,130,60,.55)'; ctx.beginPath(); ctx.ellipse(x + rad * 0.3, y + rad * 0.2, rad * 0.35, rad * 0.2, 0.3, 0, TAU); ctx.fill(); }
  },

  // A clump of grass blades from one point (spinifex, tussock), lit from the sun.
  tuft(ctx, x, y, rad, seed, cols) {
    const r = rng(seed || 3), [sx, sy] = this.SUN;
    cols = cols || ['#8a9a4a', '#a8b060', '#6a7a3a'];
    this.contact(ctx, x, y, rad * 0.9, rad * 0.6, 0.3);
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      const rr = rng(seed || 3);
      for (let i = 0; i < 34; i++) {
        const a = rr() * TAU, l = rad * (0.5 + rr() * 0.6), c = cols[i % cols.length];
        const lit = Math.cos(a) * sx + Math.sin(a) * sy > 0;
        const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l, bend = (rr() - 0.5) * rad * 0.3;
        ctx.strokeStyle = pass ? tint(c, lit ? 0.2 : -0.25) : 'rgba(20,20,10,.2)'; ctx.lineWidth = pass ? 1.4 : 2;
        ctx.beginPath(); ctx.moveTo(x + (pass ? 0 : 1.5), y + (pass ? 0 : 2.5));
        ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 - Math.sin(a) * bend, y + Math.sin(a) * l * 0.5 + Math.cos(a) * bend, ex + (pass ? 0 : 1.5), ey + (pass ? 0 : 2.5));
        ctx.stroke();
      }
    }
    ell(ctx, x, y, rad * 0.14, rad * 0.11, '#5a4a2a', 0, 'none');
  },
};

function hexRGB(h) { h = h.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function hexA(h, a) { const [r, g, b] = hexRGB(h); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }
function mixHex(a, b, k) { const A = hexRGB(a), B = hexRGB(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * k).toString(16).padStart(2, '0')).join(''); }

// Paint a level's background: shrubs and small things get shaded, big ground patches stay flat.
Ground.paint = function (name, ctx, W, H, home) {
  Shade.maxR = 30;
  try { Backgrounds[name](ctx, W, H, home); } finally { Shade.maxR = 1e9; }
  Ground.finish(ctx, W, H);
};
