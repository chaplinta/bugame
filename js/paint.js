'use strict';
// Paint your own bug: a paint screen for every bug you can be. The design is a see-through layer of paint over
// the whole bug (wherever nothing is painted, the real bug shows), saved in the browser and, when "Use my design"
// is on, worn by one bug of that kind in the game: the bug you play (in the flat drawings and on the 3D models),
// the bug on your hand, one garden visitor, and an extra marcher in the parade. The real species stays everywhere
// else, and the Bug Book shows the design labelled as yours. Captions are sourced in docs/facts.md (Paint your own bug).

const PAINT_SIZE = 512;

// Every bug you can paint: the sprite's name, how it is drawn for the paint screen (o, t), and a true line from
// its own facts. overlay: false means the drawing and model carry the design themselves (the butterfly's wings
// flap by scaling, so a layer laid over the bug would not move with them).
const PAINT_BUGS = {
  ladybird: { name: 'Ladybird', o: {}, caption: 'Real ladybirds are bright for a reason: the colours warn birds that they taste bad.' },
  butterfly: { name: 'Painted lady', o: { landed: false }, t: Math.PI / 36, overlay: false, mirror: true, caption: 'Real painted lady wings are covered in thousands of tiny scales, like roof tiles.' },
  spider: { name: 'Peacock spider', o: { fan: 1 }, caption: 'A real fan’s colours come from tiny scales that bend light, like a rainbow.' },
  spiderling: { name: 'Spiderling', o: {}, caption: 'Spiders are not insects. They have 8 legs and 2 body parts.' },
  ant: { name: 'Bull ant', o: {}, caption: 'Ants are insects: 6 legs and 3 body parts.' },
  sugarAnt: { name: 'Sugar ant', o: {}, caption: 'Sugar ants live in nests under the ground all around Perth. They come out mostly at night.' },
  bee: { name: 'Blue-banded bee', o: { load: 0 }, caption: 'Bees are insects: 6 legs, 3 body parts and 4 wings.' },
  bushFly: { name: 'Bush fly', o: {}, caption: 'Flies are insects, but they have only 2 wings, not 4.' },
  mosquito: { name: 'Mosquito', o: { blood: 0 }, caption: 'Only female mosquitoes bite. They need blood to make their eggs. Males drink nectar.' },
  plCaterpillar: { name: 'Caterpillar', o: { size: 1, fat: 1 }, caption: 'Caterpillars are insects too: look for 6 real legs at the front.' },
  termiteWorker: { name: 'Termite', o: {}, caption: 'Termites are not ants. Their closest relatives are cockroaches!' },
  dragonfly: { name: 'Blue skimmer', o: { dart: 0 }, caption: 'Only the male blue skimmers are powder-blue. Females are yellow-brown.' },
  nymph: { name: 'Skimmer nymph', o: {}, caption: 'Nymphs have 6 legs and no wings yet. Their wings grow in pads on their back.' },
  snail: { name: 'Native snail', o: { size: 1 }, caption: 'Snails are not insects. They are molluscs, like octopuses and mussels.' },
  sandhopper: { name: 'Sandhopper', o: { face: 1, angle: 0 }, side: true, caption: 'Sandhoppers are crustaceans, like crabs and prawns, not insects. They have lots of legs, not 6.' },
  orbSpider: { name: 'Golden orb-weaver', o: {}, caption: 'Golden orb-weavers spin huge webs of golden silk. They live all over Australia, including Perth.' },
  dungBeetle: { name: 'Dung beetle', o: {}, caption: 'Real dung beetles bury cow pats so flies can’t breed in them.' },
  frog: { name: 'Motorbike frog', o: { call: 0 }, caption: 'Frogs aren’t bugs. They have a backbone inside, like you. But they eat bugs!' },
};
// Drawings that are another bug at a different size (or with wings) wear that bug's design, scaled to match
const PAINT_ALIAS = {
  queenAnt: { of: 'ant', k: 1.12, o: { wings: true } },
  queenSugar: { of: 'sugarAnt', k: 1.4 },
  babyHopper: { of: 'sandhopper', k: 0.45 },
};
// Where the three designs from before version 3.9 sit (they were painted on one part, filling a smaller frame)
const PAINT_LEGACY = { ladybird: { S: 36, cx: 292, cy: 256 }, spider: { S: 16, cx: 384, cy: 256 }, butterfly: { S: 14, cx: 256, cy: 60 } };

// The butterfly's wing maps for the 3D model (patternTexture in js/models-bugs.js): each covers its outline's
// bounds; at(u, v) gives the wing point a texel shows, base() paints the real pattern first.
const PAINT_MAPS = {
  plFore: { w: 256, h: 256, opts: { flipY: false, clamp: true }, pts: () => PL.fore(), paint: (ctx) => PL.paintFore(ctx) },
  plHind: { w: 256, h: 256, opts: { flipY: false, clamp: true }, pts: () => PL.hind(), paint: (ctx) => PL.paintHind(ctx) },
};
for (const spec of Object.values(PAINT_MAPS)) {
  spec.bounds = () => spec.b || (spec.b = paintBounds(spec.pts()));
  spec.at = (u, v) => { const b = spec.bounds(); return [b[0] + u * (b[2] - b[0]), b[1] + v * (b[3] - b[1])]; };
  spec.base = (ctx, w, h) => { const b = spec.bounds(); ctx.setTransform(w / (b[2] - b[0]), 0, 0, h / (b[3] - b[1]), -b[0] * w / (b[2] - b[0]), -b[1] * h / (b[3] - b[1])); spec.paint(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0); };
}
function paintBounds(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; }

const PaintStore = {
  key: 'bugame.paint',
  data: { ver: {}, use: {}, img: {}, frame: {} },
  load() {
    try { const d = JSON.parse(localStorage.getItem(this.key) || '{}'); this.data = { ver: d.ver || {}, use: d.use || {}, img: d.img || {}, frame: d.frame || {} }; }
    catch (e) { /* storage off */ }
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* storage off or full */ } },
};

const Paint = {
  cache: {},      // name → { ver, canvas }: the saved designs, decoded
  editing: null,  // { name, canvas, frame } while the paint screen is open: previews draw the work in progress
  frames: {}, boundsCache: {},
  ALPHA: 0.9,     // paint is a little see-through, so the bug's shading shows
  name(n) { return PAINT_ALIAS[n] ? PAINT_ALIAS[n].of : n; },
  scaleOf(n) { return PAINT_ALIAS[n] ? PAINT_ALIAS[n].k : 1; },
  // The paint screen's state for a drawing: the bug's own options (plus an alias's, such as the queen's wings)
  optsOf(n) { const B = PAINT_BUGS[this.name(n)], A = PAINT_ALIAS[n]; return Object.assign({ moving: false }, B ? B.o : {}, A && A.o ? A.o : {}); },
  // The design's version when it is saved, in use and decoded; undefined otherwise. Goes into cache keys as o.paint.
  stamp(n) {
    const name = this.name(n), d = PaintStore.data, c = this.cache[name];
    return d.use[name] && d.img[name] && c && c.ver === d.ver[name] ? d.ver[name] : undefined;
  },
  image(n) {
    const name = this.name(n);
    if (this.editing && this.editing.name === name) return this.editing.canvas;
    const c = this.cache[name];
    return c && c.ver === PaintStore.data.ver[name] ? c.canvas : null;
  },
  // A design laid over the whole bug (everything but the butterfly, which carries it on its wings itself)
  overlays(n) { const B = PAINT_BUGS[this.name(n)]; return !!B && B.overlay !== false; },
  // The design canvas's frame in sprite units: sprite (x, y) sits at (cx + S·x, cy + S·y). Saved with the design,
  // so a later change to a drawing never shifts an old design; a fresh design fits the whole bug.
  frame(n) {
    const name = this.name(n), d = PaintStore.data;
    if (this.editing && this.editing.name === name) return this.editing.frame;
    if (d.frame[name]) return d.frame[name];
    if (d.img[name] && PAINT_LEGACY[name]) return PAINT_LEGACY[name];
    return this.fitFrame(name);
  },
  // A fresh design's frame: the whole bug, filling most of the canvas (a mirrored bug stores one side, so that
  // side fills it)
  fitFrame(name) {
    if (this.frames[name]) return this.frames[name];
    let b = this.boundsOf(name);
    if (PAINT_BUGS[name] && PAINT_BUGS[name].mirror) b = [b[0], Math.max(b[1], -2), b[2], b[3]];
    const S = Math.round(0.88 * PAINT_SIZE / Math.max(b[2] - b[0], b[3] - b[1]) * 100) / 100;
    return (this.frames[name] = { S, cx: Math.round(PAINT_SIZE / 2 - S * (b[0] + b[2]) / 2), cy: Math.round(PAINT_SIZE / 2 - S * (b[1] + b[3]) / 2) });
  },
  // The drawn extent of a drawing in sprite units (with a little margin), measured from the drawing itself
  boundsOf(name) {
    if (this.boundsCache[name]) return this.boundsCache[name];
    const B = PAINT_BUGS[this.name(name)] || {}, c = document.createElement('canvas'), q = 8, half = 400;
    c.width = c.height = half * 2;
    const ctx = c.getContext('2d');
    ctx.setTransform(q, 0, 0, q, half, half);
    try { Sprites[name](ctx, this.optsOf(name), B.t || 0.4); } catch (e) { /* a drawing that needs more state: fall back to a wide box */ }
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    const b = x1 < 0 ? [-30, -30, 30, 30] : [(x0 - half) / q - 1, (y0 - half) / q - 1, (x1 + 1 - half) / q + 1, (y1 + 1 - half) / q + 1];
    return (this.boundsCache[name] = b);
  },
  load() {
    PaintStore.load();
    for (const name of Object.keys(PAINT_BUGS)) if (PaintStore.data.img[name]) this.decode(name, PaintStore.data.img[name], PaintStore.data.ver[name]);
  },
  // Decode a saved design; once every pending one is in, drop the old bitmaps and redraw the pictures (once)
  decoding: 0,
  decode(name, url, ver) {
    const im = new Image();
    this.decoding++;
    im.onload = im.onerror = () => {
      if (im.complete && im.naturalWidth) {
        const c = document.createElement('canvas'); c.width = c.height = PAINT_SIZE;
        c.getContext('2d').drawImage(im, 0, 0, PAINT_SIZE, PAINT_SIZE);
        this.cache[name] = { ver, canvas: c };
      }
      if (--this.decoding) return;
      this.forget();
      if (typeof redrawPortraits === 'function') redrawPortraits();
    };
    im.src = url;
  },
  // Draw the design in the drawing's units at the current transform (the butterfly's wing hooks call this inside
  // a clip; an alias's design is scaled as its drawing is)
  draw(ctx, n) {
    const name = this.name(n), img = this.image(name), f = this.frame(name), k = this.scaleOf(n);
    if (!img) return false;
    ctx.save(); ctx.globalAlpha = this.ALPHA;
    if (k !== 1) ctx.scale(k, k);
    ctx.drawImage(img, -f.cx / f.S, -f.cy / f.S, PAINT_SIZE / f.S, PAINT_SIZE / f.S);
    ctx.restore();
    return true;
  },
  // The design laid in the frame a side-on drawing paints itself in (it turns upright and faces its way itself)
  drawOn(ctx, name, o) {
    const B = PAINT_BUGS[this.name(name)];
    ctx.save();
    if (B && B.side) { ctx.rotate(-(o.angle || 0)); ctx.scale(o.face || (Math.cos(o.angle || 0) < -0.1 ? -1 : 1), 1); }
    this.draw(ctx, name);
    ctx.restore();
  },
  // Draw a live sprite at the current transform (scaled to its units) wearing its design: the drawing goes on a
  // scratch canvas alone, under the same transform, the design lands only on it (source-atop), and both come back.
  drawSprite(ctx, name, o, t) {
    if (!(o && o.paint) || !this.image(name) || !this.overlays(name)) { Sprites[name](ctx, o, t); return; }
    const m = ctx.getTransform(), b = this.boundsOf(name), q = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));   // device px per unit
    // room for the drawing however it is turned (side-on drawings turn themselves upright)
    const R = Math.max(Math.hypot(b[0], b[1]), Math.hypot(b[2], b[1]), Math.hypot(b[0], b[3]), Math.hypot(b[2], b[3])), w = Math.ceil(2 * R * q) + 2;
    if (w > 4096) { Sprites[name](ctx, o, t); return; }
    const s = this.scratch || (this.scratch = document.createElement('canvas')), sc = s.getContext('2d');
    if (s.width !== w || s.height !== w) { s.width = s.height = w; } else { sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, w, w); }
    const ox = Math.round(m.e - w / 2), oy = Math.round(m.f - w / 2);   // the scratch's top left in device pixels
    sc.setTransform(m.a, m.b, m.c, m.d, m.e - ox, m.f - oy);
    sc.save(); Sprites[name](sc, o, t); sc.restore();
    sc.globalCompositeOperation = 'source-atop';
    this.drawOn(sc, name, o);
    sc.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, ox, oy); ctx.drawImage(s, 0, 0); ctx.restore();
  },
  // The design on a cached bitmap (a 2D drawing or a 3D render) at P pixels per unit, in the bitmap's own box.
  // The paint lands on the bug itself (alpha above 200), not on its soft shadow. Side-on bitmaps are upright.
  onBitmap(ent, name, e, P) {
    if (!(e && e.paint) || !this.image(name) || !this.overlays(name) || !ent || !ent.c) return;
    const c = ent.c, b = ent.box, w = c.width, h = c.height, ctx = c.getContext('2d'), B = PAINT_BUGS[this.name(name)];
    const src = ctx.getImageData(0, 0, w, h).data, mask = document.createElement('canvas'); mask.width = w; mask.height = h;
    const mc = mask.getContext('2d'), md = mc.createImageData(w, h);
    for (let i = 3; i < src.length; i += 4) if (src[i] > 200) { md.data[i] = 255; }
    mc.putImageData(md, 0, 0);
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    const tc = t.getContext('2d');
    tc.setTransform(P, 0, 0, P, -b[0] * P, -b[1] * P);
    if (B && B.side && e.face !== undefined && e.face < 0) tc.scale(-1, 1);
    this.draw(tc, name);
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'destination-in'; tc.drawImage(mask, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(t, 0, 0); ctx.restore();
  },
  // A 3D wing map built from the design (cached by the model kit under its own key until the design changes).
  texture(n, key) {
    const name = this.name(n);
    if (!this.image(name) || typeof Render3D === 'undefined' || !Render3D.M) return null;
    const spec = PAINT_MAPS[key], ver = this.editing && this.editing.name === name ? 'edit' : PaintStore.data.ver[name];
    return Render3D.M.paint('user|' + name + '|' + key + '|' + ver, spec.w, spec.h, (ctx, w, h) => this.build(name, key, ctx, w, h), spec.opts);
  },
  // The real pattern first, then the design where it was painted, texel by texel (nearest).
  build(name, key, ctx, w, h) {
    const spec = PAINT_MAPS[key], f = this.frame(name), src = this.image(name);
    spec.base(ctx, w, h);
    const d = src.getContext('2d').getImageData(0, 0, PAINT_SIZE, PAINT_SIZE).data, out = ctx.getImageData(0, 0, w, h), o = out.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const pt = spec.at((i + 0.5) / w, (j + 0.5) / h), px = Math.round(f.cx + f.S * pt[0]), py = Math.round(f.cy + f.S * pt[1]);
      if (px < 0 || py < 0 || px >= PAINT_SIZE || py >= PAINT_SIZE) continue;
      const q = (py * PAINT_SIZE + px) * 4, a = d[q + 3] / 255 * this.ALPHA, k = (j * w + i) * 4;
      if (a <= 0) continue;
      o[k] = o[k] * (1 - a) + d[q] * a; o[k + 1] = o[k + 1] * (1 - a) + d[q + 1] * a; o[k + 2] = o[k + 2] * (1 - a) + d[q + 2] * a; o[k + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
  },
  // A design changed: drop every bitmap, texture, material and built model that wore the old one.
  forget() {
    if (typeof SpriteCache !== 'undefined') SpriteCache.clear();
    if (typeof Render3D === 'undefined' || !Render3D.M) return;
    const M = Render3D.M, gone = [];
    for (const [k, t] of [...M.tex]) if (k.startsWith('p|user|')) { gone.push(t.uuid); t.dispose(); M.tex.delete(k); }
    for (const [k, m] of [...M.mats]) if (gone.some(u => k.includes('tex:' + u))) { m.dispose(); M.mats.delete(k); }
    if (typeof Models !== 'undefined') for (const [k, r] of [...Models.built]) if (/U(\d+|edit)/.test(k.split('|')[1] || '')) { Models.built.delete(k); Render3D.dispose(r); }
  },
};

// ---------------------------------------------------------------- the paint screen
// The design canvas (512 px, a clear layer in the bug's frame) is kept off screen. What you see is a view of the
// whole bug wearing the design, fitted to the box, which you can zoom (+, −, a pinch, the mouse wheel) and drag
// (two fingers, or the Move tool). Strokes are mapped from the view into the design; paint only shows on the bug.
const PaintUI = {
  part: 'ladybird', colour: '#111111', size: 18, tool: 'brush', last: null, drag: null, dirty: false,
  view: { z: 1, px: 0, py: 0 }, pointers: new Map(), pinch: null,
  ZOOM: { min: 1, max: 4, step: 1.5 },
  colours: ['#111111', '#f4f4f0', '#e03a1a', '#f08a2e', '#f2d040', '#5aa848', '#2a8aa8', '#3a5ab0', '#8a3ab0', '#e85a8a'],
  sizes: [['Thin', 8], ['Brush', 18], ['Fat', 34]],
  stamps: [['spot', 'Spot'], ['stripe', 'Stripe'], ['star', 'Star']],
  init() {
    this.canvas = $('paintCanvas');
    this.canvas.width = this.canvas.height = PAINT_SIZE;
    this.design = document.createElement('canvas');
    this.design.width = this.design.height = PAINT_SIZE;
    const parts = $('paintParts');
    for (const [id, B] of Object.entries(PAINT_BUGS)) {
      const b = document.createElement('button'); b.dataset.part = id; b.setAttribute('aria-label', 'Paint the ' + B.name.toLowerCase());
      const c = document.createElement('canvas'); c.width = c.height = 44; b.appendChild(c);
      const s = document.createElement('span'); s.textContent = B.name; b.appendChild(s);
      b.addEventListener('click', () => { Sound.play('tap'); this.pick(id); });
      parts.appendChild(b);
    }
    const tools = $('paintTools'), add = (cls, label, data, fn, title) => {
      const b = document.createElement('button'); b.className = cls; b.dataset.tool = data; b.textContent = label; b.setAttribute('aria-label', title || label);
      b.addEventListener('click', () => { Sound.play('tap'); fn(); this.syncTools(); });
      tools.appendChild(b); return b;
    };
    for (const c of this.colours) { const b = add('swatch', '', 'c' + c, () => { this.colour = c; if (this.tool === 'eraser' || this.tool === 'move') this.tool = 'brush'; }, 'Colour ' + c); b.style.background = c; }
    for (const [label, s] of this.sizes) add('paintTool', label, 's' + s, () => { this.size = s; if (this.tool !== 'brush' && this.tool !== 'eraser') this.tool = 'brush'; });
    for (const [id, label] of this.stamps) add('paintTool', label, id, () => { this.tool = id; });
    add('paintTool', 'Eraser', 'eraser', () => { this.tool = 'eraser'; });
    add('paintTool', 'Move', 'move', () => { this.tool = 'move'; }, 'Move: drag the picture');
    add('paintTool', 'Start again', 'clear', () => { delete this.work[this.part]; Paint.editing.frame = Paint.fitFrame(this.part); this.prepare(true); this.render(); this.refresh(); });
    for (const b of document.querySelectorAll('#paintBox [data-zoom]')) b.addEventListener('click', () => { Sound.play('tap'); const k = b.dataset.zoom; if (k === 'fit') this.fit(); else this.zoomBy(k === 'in' ? this.ZOOM.step : 1 / this.ZOOM.step); });
    // One finger (or the mouse) paints, or drags with the Move tool; two fingers pinch to zoom and drag; the wheel zooms.
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
      const v = this.viewPx(e);
      this.pointers.set(e.pointerId, v);
      if (this.pointers.size === 2) { this.pending = null; this.last = null; this.drag = null; this.pinch = this.pinchStart(); return; }
      if (this.pointers.size > 2) return;
      if (this.tool === 'move') { this.drag = v; return; }
      // Painting waits for the finger to move or lift, so the first finger of a pinch leaves no dot
      this.pending = { v, d: this.designAt(v) };
    });
    c.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const v = this.viewPx(e);
      this.pointers.set(e.pointerId, v);
      if (this.pinch) { this.pinchMove(); return; }
      if (this.drag) { this.view.px += v.x - this.drag.x; this.view.py += v.y - this.drag.y; this.drag = v; this.clampPan(); this.render(); return; }
      if (this.pending) { if (Math.hypot(v.x - this.pending.v.x, v.y - this.pending.v.y) < 3) return; const d = this.pending.d; this.pending = null; this.down(d); }
      if (this.last) this.move(this.designAt(v));
    });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) c.addEventListener(ev, (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (this.pending && !this.pointers.size && ev === 'pointerup') this.down(this.pending.d);   // a tap: a dot or a stamp
      this.pending = null;
      if (this.pointers.size < 2) this.pinch = null;
      if (!this.pointers.size) { this.last = null; this.drag = null; this.refresh(); }
    });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    $('paintBox').addEventListener('wheel', (e) => { e.preventDefault(); const v = this.viewPx(e); this.zoomBy(e.deltaY < 0 ? 1.25 : 0.8, v.x, v.y); }, { passive: false });
    $('paintUse').addEventListener('change', () => { PaintStore.data.use[this.part] = $('paintUse').checked; PaintStore.save(); Paint.forget(); if (typeof redrawPortraits === 'function') redrawPortraits(); });
    $('paintSave').addEventListener('click', () => this.save());
    $('paintBtn').addEventListener('click', () => { Sound.play('tap'); this.open(); });
    $('paintBack').addEventListener('click', () => { this.stash(); Paint.editing = null; Speech.stop(); buildMap(); });
  },
  open() {
    show('paint');
    if (!this.icons) { this.icons = true; for (const b of document.querySelectorAll('#paintParts button')) this.icon(b.querySelector('canvas'), b.dataset.part); }
    this.pick(this.part);
  },
  // A bug's picture for the picker, drawn flat and facing up (side-on bugs stay side-on)
  icon(canvas, id) {
    const B = PAINT_BUGS[id], size = canvas.width, dpr = window.devicePixelRatio || 1, b = Paint.boundsOf(id);
    canvas.width = canvas.height = Math.round(size * dpr);
    const ctx = canvas.getContext('2d'), k = 0.84 * size / Math.max(b[2] - b[0], b[3] - b[1]);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(size / 2, size / 2);
    if (!B.side) ctx.rotate(-Math.PI / 2);
    ctx.scale(k, k); ctx.translate(-(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2);
    Sprites[id](ctx, Paint.optsOf(id), B.t || 0.4);
  },
  // Unsaved work is kept, per bug, while the game is open
  work: {},
  stash() {
    if (!(this.design && this.dirty && Paint.editing)) return;
    const w = this.work[this.part] || (this.work[this.part] = { canvas: document.createElement('canvas') });
    w.canvas.width = w.canvas.height = PAINT_SIZE; w.canvas.getContext('2d').drawImage(this.design, 0, 0); w.frame = Paint.editing.frame;
  },
  // Switch to a bug: the design in progress, else the saved design, else a clear layer
  pick(name) {
    this.stash();
    this.part = name;
    for (const b of document.querySelectorAll('#paintParts button')) b.classList.toggle('on', b.dataset.part === name);
    const B = PAINT_BUGS[name], work = this.work[name];
    Paint.editing = { name, canvas: this.design, frame: work ? work.frame : Paint.frame(name) };
    if (work) { const ctx = this.design.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, PAINT_SIZE, PAINT_SIZE); ctx.drawImage(work.canvas, 0, 0); }
    else this.prepare(false);
    $('paintCaption').textContent = B.caption;
    $('paintUse').checked = !!PaintStore.data.use[name];
    $('paintNote').textContent = PaintStore.data.img[name] ? 'This is your saved ' + B.name.toLowerCase() + '. Paint some more, or start again.' : 'Paint anywhere on the ' + B.name.toLowerCase() + '. The paint only sticks to the bug.';
    this.dirty = !!work;
    this.fit(); this.refresh(); this.syncTools();
  },
  prepare(fresh) {
    const ctx = this.design.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, PAINT_SIZE, PAINT_SIZE);
    const saved = !fresh && Paint.cache[this.part] && Paint.cache[this.part].ver === PaintStore.data.ver[this.part] ? Paint.cache[this.part].canvas : null;
    if (saved) ctx.drawImage(saved, 0, 0);
    this.dirty = fresh;
  },

  // ---- the view: the whole bug fitted to the box at zoom 1, in sprite units; K is view pixels per unit
  bounds() { return Paint.boundsOf(this.part); },
  centre() { const b = this.bounds(); return { x: (b[0] + b[2]) / 2, y: (b[1] + b[3]) / 2 }; },
  K() { const b = this.bounds(); return 0.9 * Math.min(PAINT_SIZE / (b[2] - b[0]), PAINT_SIZE / (b[3] - b[1])) * this.view.z; },
  viewAt(ux, uy) { const K = this.K(), c = this.centre(); return { x: (ux - c.x) * K + PAINT_SIZE / 2 + this.view.px, y: (uy - c.y) * K + PAINT_SIZE / 2 + this.view.py }; },
  unitsAt(vx, vy) { const K = this.K(), c = this.centre(); return { x: (vx - PAINT_SIZE / 2 - this.view.px) / K + c.x, y: (vy - PAINT_SIZE / 2 - this.view.py) / K + c.y }; },
  // A pointer event in view pixels, and a view point in the design canvas's pixels (a mirrored bug is painted on
  // its one stored side, whichever side you touch)
  viewPx(e) { const r = this.canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * PAINT_SIZE / r.width, y: (e.clientY - r.top) * PAINT_SIZE / r.height }; },
  designAt(v) {
    const B = PAINT_BUGS[this.part], f = Paint.frame(this.part), u = this.unitsAt(v.x, v.y);
    if (B.mirror && u.y < 0) u.y = -u.y;
    return { x: f.cx + f.S * u.x, y: f.cy + f.S * u.y };
  },
  fit() { this.view = { z: 1, px: 0, py: 0 }; this.render(); },
  // Zoom by f about a view point (the box centre by default): what was under that point stays under it
  zoomBy(f, vx, vy) {
    vx = vx === undefined ? PAINT_SIZE / 2 : vx; vy = vy === undefined ? PAINT_SIZE / 2 : vy;
    const u = this.unitsAt(vx, vy);
    this.view.z = Math.max(this.ZOOM.min, Math.min(this.ZOOM.max, this.view.z * f));
    const K = this.K(), c = this.centre();
    this.view.px = vx - PAINT_SIZE / 2 - (u.x - c.x) * K;
    this.view.py = vy - PAINT_SIZE / 2 - (u.y - c.y) * K;
    this.clampPan(); this.render();
  },
  clampPan() {
    const b = this.bounds(), K = this.K(), mx = (b[2] - b[0]) * K / 2, my = (b[3] - b[1]) * K / 2;
    this.view.px = Math.max(-mx, Math.min(mx, this.view.px));
    this.view.py = Math.max(-my, Math.min(my, this.view.py));
  },
  pinchStart() {
    const [a, b] = [...this.pointers.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), z: this.view.z, u: this.unitsAt(mid.x, mid.y) };
  },
  pinchMove() {
    const [a, b] = [...this.pointers.values()], mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, p = this.pinch;
    this.view.z = Math.max(this.ZOOM.min, Math.min(this.ZOOM.max, p.z * Math.hypot(a.x - b.x, a.y - b.y) / p.d));
    const K = this.K(), c = this.centre();
    this.view.px = mid.x - PAINT_SIZE / 2 - (p.u.x - c.x) * K;
    this.view.py = mid.y - PAINT_SIZE / 2 - (p.u.y - c.y) * K;
    this.clampPan(); this.render();
  },
  // Draw the bug wearing the design into a cleared canvas: the bug, fitted with K px per unit about the centre c
  // (the view's pan applies on the main canvas only). The butterfly draws its own wings; the others get the
  // layer laid over the bug and nowhere else.
  compose(ctx, size, K, c, pan, painted) {
    const B = PAINT_BUGS[this.part], o = Object.assign(Paint.optsOf(this.part), painted ? { paint: 'edit' } : {}), t = B.t || 0.4;
    const base = (x) => x.setTransform(K, 0, 0, K, size / 2 + pan.x - c.x * K, size / 2 + pan.y - c.y * K);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, size, size);
    ctx.save(); base(ctx); Sprites[this.part](ctx, o, t); ctx.restore();
    if (!painted || !Paint.overlays(this.part)) return;
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; base(ctx); Paint.draw(ctx, this.part); ctx.restore();   // only where the bug is
  },
  render() { this.compose(this.canvas.getContext('2d'), PAINT_SIZE, this.K(), this.centre(), { x: this.view.px, y: this.view.py }, true); },

  down(p) {
    if (this.tool === 'brush' || this.tool === 'eraser') { this.last = p; this.segment(p, p); return; }
    this.stamp(p);
  },
  move(p) { if (this.last) { this.segment(this.last, p); this.last = p; } },
  segment(a, b) {
    const ctx = this.design.getContext('2d');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = this.colour; ctx.lineWidth = this.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.restore();
    this.dirty = true;
    this.render();
  },
  // A spot, a stripe or a star in the chosen colour (p in design pixels)
  stamp(p, kind) {
    kind = kind || this.tool;
    const ctx = this.design.getContext('2d');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.colour; ctx.translate(p.x, p.y);
    ctx.beginPath();
    if (kind === 'spot') ctx.arc(0, 0, 24, 0, TAU);
    else if (kind === 'stripe') { ctx.rotate(-0.3); if (ctx.roundRect) ctx.roundRect(-44, -11, 88, 22, 11); else ctx.rect(-44, -11, 88, 22); }
    else for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 11 : 27; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.restore();
    this.dirty = true;
    this.render(); this.refresh();
  },
  // The two previews, full size: the bug wearing the design, and the real one, fitted the same way as the box
  refresh() {
    const draw = (canvas, painted) => {
      const dpr = window.devicePixelRatio || 1, size = Math.max(100, Math.round(canvas.getBoundingClientRect().width || 470));
      canvas.width = canvas.height = Math.round(size * dpr);
      const ctx = canvas.getContext('2d'), b = this.bounds(), K = 0.9 * Math.min(size / (b[2] - b[0]), size / (b[3] - b[1])) * dpr;
      this.compose(ctx, size * dpr, K, this.centre(), { x: 0, y: 0 }, painted);
    };
    draw($('paintMine'), true);
    draw($('paintReal'), false);
  },
  syncTools() {
    for (const b of document.querySelectorAll('#paintTools button')) {
      const t = b.dataset.tool;
      b.classList.toggle('on', t === 'c' + this.colour && this.tool !== 'eraser' || t === 's' + this.size && (this.tool === 'brush' || this.tool === 'eraser') || t === this.tool);
    }
  },
  save() {
    const name = this.part, d = PaintStore.data, B = PAINT_BUGS[name];
    d.ver[name] = (d.ver[name] || 0) + 1;
    d.img[name] = this.design.toDataURL('image/png');
    d.frame[name] = Object.assign({}, Paint.editing.frame);
    d.use[name] = $('paintUse').checked = true;
    PaintStore.save();
    const copy = document.createElement('canvas'); copy.width = copy.height = PAINT_SIZE;
    copy.getContext('2d').drawImage(this.design, 0, 0);
    Paint.cache[name] = { ver: d.ver[name], canvas: copy };
    delete this.work[name];
    Paint.forget();
    if (typeof redrawPortraits === 'function') redrawPortraits();
    this.dirty = false;
    Sound.play('win');
    const first = !Progress.hasSecret('s_paint');
    if (first) Progress.addSecret('s_paint');
    const where = 'Your ' + B.name.toLowerCase() + ' will wear it when you play, on your hand, in the garden and in the parade.';
    $('paintNote').textContent = 'Saved! ' + where + (first ? ' That’s a secret found!' : '');
    Speech.say('Saved! ' + where, true);
  },
};

Paint.load();
if (document.getElementById('paintCanvas')) PaintUI.init();
