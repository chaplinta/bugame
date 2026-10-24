'use strict';
// Paint your own bug: a paint screen for three parts (a ladybird's wing cases, a peacock spider's fan, a painted
// lady's wings). The design is saved in the browser and, when "Use my design" is on, worn by one bug in the game:
// your own butterfly and peacock spider when you play them (in 2D and on the 3D models), one ladybird in the
// garden and on your hand, and an extra marcher in the parade. The real species stays everywhere else, and the
// Bug Book shows the design labelled as yours. Captions are sourced in docs/facts.md (Paint your own bug).

const PAINT_SIZE = 512;

// The three parts. The paint canvas is in the drawing's own top-view units: sprite (x, y) sits at
// (cx + S·x, cy + S·y) on the 512 px canvas. outline() builds the part's path in those units.
const PAINT_PARTS = {
  ladybird: {
    name: 'Ladybird', sprite: 'ladybird', what: 'wing cases', base: '#e03a1a', S: 36, cx: 292, cy: 256,
    outline(ctx) { ctx.beginPath(); ctx.ellipse(-1, 0, 6.2, 5.4, 0, 0, TAU); },
    o: {}, iconScale: 1.7,
    caption: 'Real ladybirds are bright for a reason: the colours warn birds that they taste bad.',
    where: 'A ladybird with your design will visit your garden and sit on your hand.',
  },
  spider: {
    name: 'Peacock spider', sprite: 'spider', what: 'fan', base: '#2a8aa8', S: 16, cx: 384, cy: 256,
    outline(ctx) { ctx.beginPath(); ctx.ellipse(-8, 0, 8.5, 13, 0, 0, TAU); },
    o: { fan: 1 }, iconScale: 1,
    caption: 'A real fan’s colours come from tiny scales that bend light, like a rainbow.',
    where: 'Your spider will wear this fan when you play the peacock spider’s dance.',
  },
  butterfly: {
    name: 'Painted lady', sprite: 'butterfly', what: 'wings', base: '#f08a2e', S: 14, cx: 256, cy: 60,
    outline(ctx) {   // the right side's forewing and hindwing, laid flat (the left side mirrors it)
      ctx.beginPath();
      ctx.moveTo(2, 0); ctx.bezierCurveTo(10, 1, 17, 9, 14, 23); ctx.bezierCurveTo(8, 25, 1, 18, -2, 2); ctx.closePath();
      ctx.moveTo(-1, 1); ctx.bezierCurveTo(1, 12, -5, 20, -13, 17); ctx.bezierCurveTo(-17, 9, -11, 2, -4, 1); ctx.closePath();
    },
    o: { landed: false }, t: Math.PI / 36, iconScale: 1.3,
    caption: 'Real painted lady wings are covered in thousands of tiny scales, like roof tiles.',
    where: 'Your butterfly will wear these wings when you play the painted lady and fly.',
  },
};

// How each 3D map is laid out: at(u, v) gives the sprite point a texel shows, or null for the dark underside.
// These invert the mappings the models use (js/models-animals.js ladybird, js/models-bugs.js fan and wings).
const PAINT_MAPS = {
  ladybirdDome: { w: 256, h: 128, opts: { clamp: true }, under: '#111111',
    at(u, v) { return u > 0.5 ? null : [v * 12.4 - 7.2, 5.4 * Math.sin((u - 0.25) * TAU)]; },
    after(ctx, w, h) { ctx.fillStyle = '#111'; ctx.fillRect(w * 0.24, 0, w * 0.02, h); } },   // the seam between the wing cases
  maratusFanD: { w: 128, h: 256, opts: {}, under: '#1a2a30',
    at(u, v) { if (u > 0.5) return null; const phi = u * TAU, th = v * Math.PI; return [-8 - 8.5 * Math.cos(phi) * Math.sin(th), 13 * Math.cos(th)]; } },
  // the wing maps cover each outline's bounds (patternTexture in js/models-bugs.js), taken from the same outline points
  plFore: { w: 256, h: 256, opts: { flipY: false, clamp: true }, pts: () => PL.fore(),
    at(u, v) { const b = this.b || (this.b = paintBounds(this.pts())); return [b[0] + u * (b[2] - b[0]), b[1] + v * (b[3] - b[1])]; } },
  plHind: { w: 256, h: 256, opts: { flipY: false, clamp: true }, pts: () => PL.hind(),
    at(u, v) { const b = this.b || (this.b = paintBounds(this.pts())); return [b[0] + u * (b[2] - b[0]), b[1] + v * (b[3] - b[1])]; } },
};
function paintBounds(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; }

const PaintStore = {
  key: 'bugame.paint',
  data: { ver: {}, use: {}, img: {} },
  load() {
    try { const d = JSON.parse(localStorage.getItem(this.key) || '{}'); this.data = { ver: d.ver || {}, use: d.use || {}, img: d.img || {} }; }
    catch (e) { /* storage off */ }
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* storage off or full */ } },
};

const Paint = {
  cache: {},      // name → { ver, canvas }: the saved designs, decoded
  editing: null,  // { name, canvas } while the paint screen is open: previews draw the work in progress
  // The design's version when it is saved, in use and decoded; undefined otherwise. Goes into cache keys as o.paint.
  stamp(name) {
    const d = PaintStore.data, c = this.cache[name];
    return d.use[name] && d.img[name] && c && c.ver === d.ver[name] ? d.ver[name] : undefined;
  },
  image(name) {
    if (this.editing && this.editing.name === name) return this.editing.canvas;
    const c = this.cache[name];
    return c && c.ver === PaintStore.data.ver[name] ? c.canvas : null;
  },
  load() {
    PaintStore.load();
    for (const name of Object.keys(PAINT_PARTS)) if (PaintStore.data.img[name]) this.decode(name, PaintStore.data.img[name], PaintStore.data.ver[name]);
  },
  decode(name, url, ver) {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = PAINT_SIZE;
      c.getContext('2d').drawImage(im, 0, 0, PAINT_SIZE, PAINT_SIZE);
      this.cache[name] = { ver, canvas: c };
      this.forget();
      if (typeof redrawPortraits === 'function') redrawPortraits();
    };
    im.src = url;
  },
  // The 2D drawings call this inside a clip of the part: draws the design in sprite units. fit scales it about
  // (x, y) (the folded spider fan is smaller than the raised one the design was painted for). False if none.
  draw(ctx, name, fit) {
    const img = this.image(name), P = PAINT_PARTS[name];
    if (!img) return false;
    ctx.save();
    if (fit) { ctx.translate(fit.x, fit.y); ctx.scale(fit.sx, fit.sy); ctx.translate(-fit.x, -fit.y); }
    ctx.drawImage(img, -P.cx / P.S, -P.cy / P.S, PAINT_SIZE / P.S, PAINT_SIZE / P.S);
    ctx.restore();
    return true;
  },
  // A 3D model's map built from the design (cached by the model kit under its own key until the design changes).
  texture(name, key) {
    if (!this.image(name) || typeof Render3D === 'undefined' || !Render3D.M) return null;
    const spec = PAINT_MAPS[key], ver = this.editing && this.editing.name === name ? 'edit' : PaintStore.data.ver[name];
    return Render3D.M.paint('user|' + name + '|' + key + '|' + ver, spec.w, spec.h, (ctx, w, h) => this.build(name, key, ctx, w, h), spec.opts);
  },
  // Resample the design into a map, texel by texel (nearest), with the base colour where nothing was painted.
  build(name, key, ctx, w, h) {
    const spec = PAINT_MAPS[key], P = PAINT_PARTS[name], src = this.image(name);
    const d = src.getContext('2d').getImageData(0, 0, PAINT_SIZE, PAINT_SIZE).data;
    const out = ctx.createImageData(w, h), o = out.data, base = hexRgb(P.base), under = hexRgb(spec.under || '#111111');
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const pt = spec.at((i + 0.5) / w, (j + 0.5) / h), k = (j * w + i) * 4;
      let c = under;
      if (pt) {
        const px = Math.round(P.cx + P.S * pt[0]), py = Math.round(P.cy + P.S * pt[1]);
        if (px >= 0 && py >= 0 && px < PAINT_SIZE && py < PAINT_SIZE && d[(py * PAINT_SIZE + px) * 4 + 3] >= 128) { const q = (py * PAINT_SIZE + px) * 4; c = [d[q], d[q + 1], d[q + 2]]; }
        else c = base;
      }
      o[k] = c[0]; o[k + 1] = c[1]; o[k + 2] = c[2]; o[k + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    if (spec.after) spec.after(ctx, w, h);
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
function hexRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

// ---------------------------------------------------------------- the paint screen
const PaintUI = {
  part: 'ladybird', colour: '#111111', size: 18, tool: 'brush', showReal: false, pointer: null, last: null, dirty: false,
  colours: ['#111111', '#f4f4f0', '#e03a1a', '#f08a2e', '#f2d040', '#5aa848', '#2a8aa8', '#3a5ab0', '#8a3ab0', '#e85a8a'],
  sizes: [['Thin', 8], ['Brush', 18], ['Fat', 34]],
  stamps: [['spot', 'Spot'], ['stripe', 'Stripe'], ['star', 'Star']],
  init() {
    this.canvas = $('paintCanvas'); this.guide = $('paintGuide');
    this.canvas.width = this.canvas.height = this.guide.width = this.guide.height = PAINT_SIZE;
    const parts = $('paintParts');
    for (const [id, P] of Object.entries(PAINT_PARTS)) {
      const b = document.createElement('button'); b.className = 'stageBtn'; b.dataset.part = id; b.textContent = P.name + ' ' + P.what;
      b.addEventListener('click', () => { Sound.play('tap'); this.pick(id); });
      parts.appendChild(b);
    }
    const tools = $('paintTools'), add = (cls, label, data, fn, title) => {
      const b = document.createElement('button'); b.className = cls; b.dataset.tool = data; b.textContent = label; b.setAttribute('aria-label', title || label);
      b.addEventListener('click', () => { Sound.play('tap'); fn(); this.syncTools(); });
      tools.appendChild(b); return b;
    };
    for (const c of this.colours) { const b = add('swatch', '', 'c' + c, () => { this.colour = c; if (this.tool === 'eraser') this.tool = 'brush'; }, 'Colour ' + c); b.style.background = c; }
    for (const [label, s] of this.sizes) add('paintTool', label, 's' + s, () => { this.size = s; if (this.tool !== 'brush' && this.tool !== 'eraser') this.tool = 'brush'; });
    for (const [id, label] of this.stamps) add('paintTool', label, id, () => { this.tool = id; });
    add('paintTool', 'Eraser', 'eraser', () => { this.tool = 'eraser'; });
    add('paintTool', 'Start again', 'clear', () => { this.prepare(true); this.refresh(); });
    add('paintTool', 'Real one', 'real', () => { this.showReal = !this.showReal; this.drawGuide(); });
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.pointer !== null) return; this.pointer = e.pointerId; try { c.setPointerCapture(e.pointerId); } catch (err) { /* nicety */ } this.down(this.at(e)); });
    c.addEventListener('pointermove', (e) => { if (e.pointerId === this.pointer) this.move(this.at(e)); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) c.addEventListener(ev, (e) => { if (e.pointerId !== this.pointer) return; this.pointer = null; this.last = null; this.refresh(); });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    $('paintUse').addEventListener('change', () => { PaintStore.data.use[this.part] = $('paintUse').checked; PaintStore.save(); Paint.forget(); if (typeof redrawPortraits === 'function') redrawPortraits(); });
    $('paintSave').addEventListener('click', () => this.save());
    $('paintBtn').addEventListener('click', () => { Sound.play('tap'); this.open(); });
    $('paintBack').addEventListener('click', () => { Paint.editing = null; Speech.stop(); buildMap(); });
  },
  open() { this.pick(this.part); show('paint'); },
  // Switch to a part: the canvas shows its saved design, or the base colour, inside the outline
  pick(name) {
    this.part = name;
    for (const b of document.querySelectorAll('#paintParts .stageBtn')) b.classList.toggle('on', b.dataset.part === name);
    const P = PAINT_PARTS[name];
    this.prepare(false);
    Paint.editing = { name, canvas: this.canvas };
    $('paintCaption').textContent = P.caption;
    $('paintUse').checked = !!PaintStore.data.use[name];
    $('paintNote').textContent = PaintStore.data.img[name] ? 'This is your saved ' + P.name.toLowerCase() + '. Paint some more, or start again.' : 'Paint the ' + P.what + '. Your strokes stay inside the lines.';
    this.dirty = false;
    this.drawGuide(); this.refresh(); this.syncTools();
  },
  // The part's coordinate frame on the canvas
  frame(ctx) { const P = PAINT_PARTS[this.part]; ctx.setTransform(P.S, 0, 0, P.S, P.cx, P.cy); },
  clipPart(ctx) { const P = PAINT_PARTS[this.part]; ctx.save(); this.frame(ctx); P.outline(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clip(); },
  prepare(fresh) {
    const P = PAINT_PARTS[this.part], ctx = this.canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, PAINT_SIZE, PAINT_SIZE);
    const saved = !fresh && Paint.cache[this.part] && Paint.cache[this.part].ver === PaintStore.data.ver[this.part] ? Paint.cache[this.part].canvas : null;
    if (saved) { ctx.drawImage(saved, 0, 0); return; }
    this.clipPart(ctx); ctx.fillStyle = P.base; ctx.fillRect(0, 0, PAINT_SIZE, PAINT_SIZE); ctx.restore();
    this.dirty = fresh;
  },
  drawGuide() {
    const P = PAINT_PARTS[this.part], ctx = this.guide.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, PAINT_SIZE, PAINT_SIZE);
    if (this.showReal) {   // the real bug, faint, to trace
      ctx.save(); this.frame(ctx); ctx.globalAlpha = 0.5;
      Sprites[P.sprite](ctx, Object.assign({ moving: false }, P.o), P.t || 0.4);
      ctx.restore();
    }
    ctx.save(); this.frame(ctx); P.outline(ctx); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(43,33,24,.75)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    for (const b of document.querySelectorAll('#paintTools [data-tool="real"]')) b.classList.toggle('on', this.showReal);
  },
  at(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * PAINT_SIZE / r.width, y: (e.clientY - r.top) * PAINT_SIZE / r.height };
  },
  down(p) {
    if (this.tool === 'brush' || this.tool === 'eraser') { this.last = p; this.segment(p, p); return; }
    this.stamp(p);
  },
  move(p) { if (this.last) { this.segment(this.last, p); this.last = p; } },
  paintColour() { return this.tool === 'eraser' ? PAINT_PARTS[this.part].base : this.colour; },
  segment(a, b) {
    const ctx = this.canvas.getContext('2d');
    this.clipPart(ctx);
    ctx.strokeStyle = this.paintColour(); ctx.lineWidth = this.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.restore();
    this.dirty = true;
  },
  // A spot, a stripe or a star in the chosen colour, clipped to the part
  stamp(p, kind) {
    kind = kind || this.tool;
    const ctx = this.canvas.getContext('2d');
    this.clipPart(ctx);
    ctx.fillStyle = this.colour; ctx.translate(p.x, p.y);
    ctx.beginPath();
    if (kind === 'spot') ctx.arc(0, 0, 24, 0, TAU);
    else if (kind === 'stripe') { ctx.rotate(-0.3); if (ctx.roundRect) ctx.roundRect(-44, -11, 88, 22, 11); else ctx.rect(-44, -11, 88, 22); }
    else for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 11 : 27; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.restore();
    this.dirty = true;
    this.refresh();
  },
  // The two previews: the bug wearing the design, and the real one, both drawn flat and facing up
  refresh() {
    const P = PAINT_PARTS[this.part];
    const draw = (canvas, o) => {
      const dpr = window.devicePixelRatio || 1, size = 150;
      canvas.width = size * dpr; canvas.height = size * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(size / 2, size / 2); ctx.rotate(-Math.PI / 2); const k = size / 55 * P.iconScale; ctx.scale(k, k);
      Sprites[P.sprite](ctx, Object.assign({ moving: false }, P.o, o), P.t || 0.4);
    };
    draw($('paintMine'), { paint: 'edit' });
    draw($('paintReal'), {});
  },
  syncTools() {
    for (const b of document.querySelectorAll('#paintTools button')) {
      const t = b.dataset.tool;
      b.classList.toggle('on', t === 'c' + this.colour && this.tool !== 'eraser' || t === 's' + this.size && (this.tool === 'brush' || this.tool === 'eraser') || t === this.tool || (t === 'real' && this.showReal));
    }
  },
  save() {
    const name = this.part, d = PaintStore.data, P = PAINT_PARTS[name];
    d.ver[name] = (d.ver[name] || 0) + 1;
    d.img[name] = this.canvas.toDataURL('image/png');
    d.use[name] = $('paintUse').checked = true;
    PaintStore.save();
    const copy = document.createElement('canvas'); copy.width = copy.height = PAINT_SIZE;
    copy.getContext('2d').drawImage(this.canvas, 0, 0);
    Paint.cache[name] = { ver: d.ver[name], canvas: copy };
    Paint.forget();
    if (typeof redrawPortraits === 'function') redrawPortraits();
    this.dirty = false;
    Sound.play('win');
    const first = !Progress.hasSecret('s_paint');
    if (first) Progress.addSecret('s_paint');
    $('paintNote').textContent = 'Saved! ' + P.where + (first ? ' That’s a secret found!' : '');
    Speech.say('Saved! ' + P.where, true);
  },
};

Paint.load();
if (document.getElementById('paintCanvas')) PaintUI.init();
