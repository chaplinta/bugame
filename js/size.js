'use strict';
// Real size: a screen that draws the bug you are looking at as big as the real one, with a ruler and something to
// compare it with. No browser reports the true size of its screen, so the game starts from a sensible guess for the
// kind of device and lets you match a circle to a 20 cent coin; the match is saved. Figures and sources: docs/facts.md
// (Real size). The whole drawing, antennae and legs included, is scaled to the figure, so bodies come out a little under.

// Plain names for the drawings, shared with the quiz (js/quiz.js)
const BUG_NAMES = {
  ant: 'Bull ant', queenAnt: 'Bull ant queen', sugarAnt: 'Sugar ant', queenSugar: 'Sugar ant queen', bee: 'Blue-banded bee', bushFly: 'Bush fly',
  plCaterpillar: 'Painted lady caterpillar', butterfly: 'Painted lady', chrysalis: 'Painted lady chrysalis', termiteWorker: 'Termite', snail: 'Native snail',
  spider: 'Peacock spider', femaleSpider: 'Peacock spider (female)', spiderling: 'Peacock spiderling', nymph: 'Skimmer nymph', dragonfly: 'Blue skimmer',
  sandhopper: 'Sandhopper', babyHopper: 'Baby sandhopper', mosquito: 'Mosquito', orbSpider: 'Golden orb-weaver', frog: 'Motorbike frog',
  dungBeetle: 'Dung beetle', hornBeetle: 'Horned dung beetle', ladybird: 'Ladybird', clickBeetle: 'Click beetle', moth: 'Moth', waterStrider: 'Water strider',
};

// mm: the real measurement; axis: which way across the drawing it runs ('x' along the body, 'y' across the wings);
// what: the line a kid reads; measure: options the drawing is measured with (the snail is measured sealed, so its
// shell is the 20 mm, not its stretched-out body); draw: options it is drawn with; t: the drawing's time
const SIZES = {
  ant: { mm: 20, what: 'A bull ant worker is about 20 mm long.' },
  queenAnt: { mm: 25, what: 'A bull ant queen is about 25 mm long.', draw: { wings: true } },
  sugarAnt: { mm: 10, what: 'A sugar ant worker is about 10 mm long.' },
  queenSugar: { mm: 16, what: 'A sugar ant queen is about 16 mm long.' },
  bee: { mm: 11, what: 'A blue-banded bee is about 11 mm long.' },
  bushFly: { mm: 6, what: 'A bush fly is about 6 mm long: smaller than a house fly.' },
  plCaterpillar: { mm: 30, what: 'A grown painted lady caterpillar is about 30 mm long.' },
  butterfly: { mm: 50, axis: 'y', what: 'A painted lady is about 50 mm across its open wings.', draw: { landed: false }, t: Math.PI / 36 },
  chrysalis: { mm: 25, what: 'A painted lady chrysalis is about 25 mm long.' },
  termiteWorker: { mm: 5, what: 'A termite worker is about 5 mm long.' },
  snail: { mm: 20, what: 'A native snail’s shell is about 20 mm long.', measure: { sealed: true } },
  spider: { mm: 5, what: 'A coastal peacock spider is about 5 mm long: smaller than a grain of rice!' },
  femaleSpider: { mm: 5, what: 'A female peacock spider is about 5 mm long.' },
  spiderling: { mm: 1.5, what: 'A peacock spiderling is about 1.5 mm long: a speck.' },
  nymph: { mm: 25, what: 'A grown skimmer nymph is about 25 mm long.' },
  dragonfly: { mm: 70, axis: 'y', what: 'A blue skimmer is about 70 mm across its open wings.' },
  sandhopper: { mm: 12, what: 'A sandhopper is about 12 mm long.' },
  babyHopper: { mm: 4, what: 'A baby sandhopper is about 4 mm long.' },
  mosquito: { mm: 4, what: 'A mosquito’s body is about 4 mm long.' },
  orbSpider: { mm: 100, what: 'A big female golden orb-weaver reaches about 100 mm from leg tip to leg tip. Her body is about 30 mm.' },
  frog: { mm: 75, what: 'A motorbike frog is about 75 mm long: the biggest thing here.' },
  dungBeetle: { mm: 9, what: 'A horned dung beetle is about 9 mm long.' },
  hornBeetle: { mm: 9, what: 'A horned dung beetle is about 9 mm long, horns and all.' },
  ladybird: { mm: 6, what: 'A ladybird is about 6 mm long.' },
  clickBeetle: { mm: 15, what: 'A click beetle like this one is about 15 mm long.' },
  moth: { mm: 20, what: 'A moth like this one is about 20 mm long.' },
  waterStrider: { mm: 10, what: 'A water strider’s body is about 10 mm long. Its legs reach much further.' },
};
// A stage whose sprite is a special drawing of a bug listed above
const SIZE_STAGE = { cir_trapeze: 'spider' };
// Everyday things to compare with, in mm
const COMPARE = [[6, 'a grain of rice'], [10, 'your little fingernail'], [19, 'a 5 cent coin'], [29, 'a 20 cent coin'], [54, 'a credit card’s short side'], [86, 'a credit card’s long side']];
const COIN_MM = 28.65;   // a 20 cent coin, Royal Australian Mint

const Size = {
  extents: {},
  sprite(m) { return SIZE_STAGE[m.id] || m.sprite || m.id; },
  of(m) { return m ? SIZES[this.sprite(m)] : undefined; },
  // Pixels per millimetre: the saved coin match, else a guess for the kind of screen (a CSS pixel is 1/96 inch on a
  // mouse-driven screen, about 1/160 inch on phones and 1/132 inch on an iPad)
  pxPerMm() {
    let saved = 0;
    try { saved = +localStorage.getItem('bugame.mm') || 0; } catch (e) { /* storage off */ }
    if (saved > 0) return saved;
    return this.guessDpi() / 25.4;
  },
  guessDpi() {
    const touch = navigator.maxTouchPoints > 0;
    if (!touch) return 96;
    const ipad = /Macintosh|iPad/.test(navigator.userAgent) && navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) >= 744;
    return ipad ? 132 : 160;
  },
  matched() { try { return +localStorage.getItem('bugame.mm') > 0; } catch (e) { return false; } },
  save(px) { try { if (px) localStorage.setItem('bugame.mm', String(px)); else localStorage.removeItem('bugame.mm'); } catch (e) { /* storage off */ } },
  // How big a drawing is in its own units, measured from whatever draws it right now (the 3D model or the flat drawing)
  extent(name, o, t) {
    const threeD = typeof SpriteCache !== 'undefined' && SpriteCache.is3D(name);
    const key = name + '|' + (threeD ? '3' : '2') + '|' + JSON.stringify(o || {});
    if (this.extents[key]) return this.extents[key];
    const q = 3, half = 450, c = document.createElement('canvas');
    c.width = c.height = half * 2;
    const ctx = c.getContext('2d');
    ctx.setTransform(q, 0, 0, q, half, half);
    try {
      if (!(threeD && SpriteCache.blit(ctx, name, o, t, { x: 0, y: 0, scale: 1, angle: 0 }))) Sprites[name](ctx, o, t);
    } catch (e) { /* a drawing that needs more state */ }
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    const e = x1 < 0 ? { x: -20, y: -20, w: 40, h: 40 } : { x: (x0 - half) / q, y: (y0 - half) / q, w: (x1 + 1 - x0) / q, h: (y1 + 1 - y0) / q };
    return (this.extents[key] = e);
  },
  opts(name, S, forMeasure) {
    const base = typeof Paint !== 'undefined' ? Paint.optsOf(name) : {};
    return Object.assign({ moving: false, load: 0 }, base, S.draw || {}, forMeasure ? S.measure || {} : {});
  },
  // CSS pixels per drawing unit, so the measured length comes out at mm on the screen
  scaleFor(name, S) {
    const e = this.extent(name, this.opts(name, S, true), S.t === undefined ? 0.4 : S.t);
    return this.pxPerMm() * S.mm / (S.axis === 'y' ? e.h : e.w);
  },
  // Draw the bug life-size on canvas (sized here, in CSS pixels, to the drawing's extent)
  drawBug(canvas, name) {
    const S = SIZES[name], t = S.t === undefined ? 0.4 : S.t, o = this.opts(name, S, false);
    const k = this.scaleFor(name, S), e = this.extent(name, o, t), dpr = window.devicePixelRatio || 1;
    const w = Math.max(2, Math.ceil(e.w * k)), h = Math.max(2, Math.ceil(e.h * k));
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    canvas.width = Math.ceil(w * dpr); canvas.height = Math.ceil(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.translate(-e.x * k, -e.y * k);
    // the 3D bitmaps are rendered at up to 8 px per unit: past that the flat drawing is sharper
    if (!(k * dpr <= 8 && typeof SpriteCache !== 'undefined' && SpriteCache.blit(ctx, name, o, t, { x: 0, y: 0, scale: k, angle: 0 }))) {
      ctx.scale(k, k);
      if (o.paint && typeof Paint !== 'undefined') Paint.drawSprite(ctx, name, o, t); else Sprites[name](ctx, o, t);
    }
    return { w, h };
  },
  // A 5 cm ruler with millimetre ticks
  drawRuler(canvas) {
    const px = this.pxPerMm(), mm = 50, dpr = window.devicePixelRatio || 1, w = Math.ceil(mm * px) + 2, h = 34;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    canvas.width = Math.ceil(w * dpr); canvas.height = Math.ceil(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#f3e3b8'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 1; ctx.fillStyle = '#5a4630'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i <= mm; i++) {
      const x = 1 + i * px, len = i % 10 === 0 ? 16 : i % 5 === 0 ? 11 : 6;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
      if (i % 10 === 0) ctx.fillText(i / 10 + (i === 0 ? ' cm' : ''), Math.min(w - 12, Math.max(12, x)), h - 6);
    }
  },
  // The coin circle, at the current scale
  drawCoin(canvas) {
    const px = this.pxPerMm(), d = Math.ceil(COIN_MM * px) + 8, dpr = window.devicePixelRatio || 1;
    canvas.style.width = d + 'px'; canvas.style.height = d + 'px';
    canvas.width = Math.ceil(d * dpr); canvas.height = Math.ceil(d * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath(); ctx.arc(d / 2, d / 2, COIN_MM * px / 2, 0, TAU);
    ctx.fillStyle = '#e9e2d0'; ctx.fill(); ctx.strokeStyle = '#8a7a5c'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#8a7a5c'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('20c', d / 2, d / 2 + 5);
  },
  compare(mm) {
    let best = COMPARE[0];
    for (const c of COMPARE) if (Math.abs(Math.log(c[0] / mm)) < Math.abs(Math.log(best[0] / mm))) best = c;
    const r = mm / best[0];
    const how = r > 1.6 ? 'longer than' : r < 0.62 ? 'shorter than' : 'about as long as';
    return 'That’s ' + how + ' ' + best[1] + '.';
  },
  current: null,
  // Open the screen for a mission's bug
  open(m) {
    const name = this.sprite(m), S = SIZES[name];
    if (!S) return;
    this.current = name;
    $('sizeName').textContent = BUG_NAMES[name] || name;
    show('size');
    this.redraw();
    if (Settings.speech) this.read();
  },
  // Draw everything again (the scale changed, the 3D pictures came up); only while the screen is showing
  redraw() {
    const name = this.current, S = name && SIZES[name];
    if (!S || !document.getElementById('size').classList.contains('active')) return;
    this.drawBug($('sizeCanvas'), name);
    this.drawRuler($('sizeRuler'));
    this.drawCoin($('coinCanvas'));
    $('sizeLine').textContent = S.what + ' Put your finger next to it!';
    $('sizeCompare').textContent = this.compare(S.mm);
    $('sizeNote').textContent = this.matched() ? 'Matched to your 20 cent coin.' : 'About real size. Match the circle to a 20 cent coin to make it exact.';
    const slider = $('coinSlider');
    slider.value = Math.round((this.pxPerMm() / (this.guessDpi() / 25.4) - 1) * 100);
  },
  read() { const S = SIZES[this.current]; if (S) Speech.say(S.what + ' ' + this.compare(S.mm), true); },
};

$('sizeBtn').addEventListener('click', () => { Sound.play('tap'); Speech.stop(); Size.open(currentMission); });
$('sizeBack').addEventListener('click', () => { Speech.stop(); show('bug'); });
$('sizeSpeak').addEventListener('click', () => Size.read());
// Slide until the circle matches a real coin: the scale is saved and everything redraws
$('coinSlider').addEventListener('input', () => {
  const k = 1 + (+$('coinSlider').value) / 100;
  Size.save(Size.guessDpi() / 25.4 * k);
  Size.redraw();
});
$('coinReset').addEventListener('click', () => { Size.save(0); Size.redraw(); });
if (typeof Render3D !== 'undefined') Render3D.whenReady(() => { Size.extents = {}; Size.redraw(); });
