'use strict';
// Field-guide drawings of the bugs you play: real proportions, jointed legs with claws, textured
// cuticle and fur, wings with their proper veins. All top-down, facing +x, same sizes as before.

// A jointed insect leg from (x, y): coxa, femur, tibia, tarsus (in little segments) and two claws.
// a: direction of the femur; bend: how far the tibia turns (positive = toward the body's rear).
function ileg(ctx, x, y, a, L, col, w, bend, t2) {
  const fem = L * 0.42, tib = L * 0.38, tar = L * 0.3;
  const kx = x + Math.cos(a) * fem, ky = y + Math.sin(a) * fem;
  const b = a + bend, ex = kx + Math.cos(b) * tib, ey = ky + Math.sin(b) * tib;
  const c = b + (t2 === undefined ? bend * 0.6 : t2), fx = ex + Math.cos(c) * tar, fy = ey + Math.sin(c) * tar;
  // shadow under the leg, then segments thick to thin, then the foot
  plainLine(ctx, [x + 0.6, y + 1, kx + 0.6, ky + 1, ex + 0.6, ey + 1, fx + 0.6, fy + 1], 'rgba(0,0,0,.25)', w + 0.8);
  line(ctx, [x, y, kx, ky], col, w);
  plainEll(ctx, kx, ky, w * 0.55, w * 0.55, tint(col, -0.3));
  line(ctx, [kx, ky, ex, ey], col, w * 0.72);
  // tarsus: 4 tarsomeres
  const n = 4;
  for (let i = 0; i < n; i++) {
    const p = i / n, q = (i + 1) / n;
    plainLine(ctx, [ex + (fx - ex) * p, ey + (fy - ey) * p, ex + (fx - ex) * q, ey + (fy - ey) * q], i % 2 ? tint(col, -0.2) : col, w * (0.5 - i * 0.05));
  }
  plainLine(ctx, [fx, fy, fx + Math.cos(c - 0.5) * 1.3, fy + Math.sin(c - 0.5) * 1.3], '#1a1008', 0.6);
  plainLine(ctx, [fx, fy, fx + Math.cos(c + 0.5) * 1.3, fy + Math.sin(c + 0.5) * 1.3], '#1a1008', 0.6);
  // a highlight along the femur
  plainLine(ctx, [x + Math.cos(a) * fem * 0.2, y + Math.sin(a) * fem * 0.2, x + Math.cos(a) * fem * 0.8, y + Math.sin(a) * fem * 0.8], 'rgba(255,255,255,.25)', w * 0.25);
}

// Six legs on a thorax centred at cx: front pair forward, middle sideways, hind pair back, walking in tripods.
function legs6r(ctx, cx, L, col, w, t, moving, o) {
  o = o || {};
  const sw = moving ? Math.sin(t * 18) : 0;
  const dirs = [-0.95, -0.15, 0.75], att = [3.2, 0.6, -2.4];   // femur angle from straight sideways; attachment x
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const tri = (i === 1 ? -1 : 1) * s;
    const a = s * (Math.PI / 2 + dirs[i] * (o.spread || 1)) + sw * 0.3 * tri;
    const bend = s * (i === 0 ? 0.9 : i === 1 ? 1.1 : 1.0);
    ileg(ctx, cx + att[i] * (o.len || 1), s * (o.wide || 2), a, L * (i === 2 ? 1.15 : i === 0 ? 0.95 : 1), col, w, bend, s * 0.5);
  }
}

// Compound eye: dark ball with a faceted sheen and a glint.
function facetEye(ctx, x, y, rx, ry, col, rot) {
  ell(ctx, x, y, rx, ry, col, rot || 0, 'chitin');
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.clip();
  if (Shade.rich) Tex.fillPath(ctx, 'wing', 3, 0.35, 'multiply');
  ctx.restore();
  const [lx, ly] = lightDir(ctx);
  plainEll(ctx, x + lx * rx * 0.4, y + ly * ry * 0.4, Math.max(0.5, rx * 0.3), Math.max(0.4, ry * 0.22), 'rgba(255,255,255,.75)', Math.atan2(ly * ry, lx * rx) + Math.PI / 2);
}

// Antenna: scape, then a curve of small segments (bead for ants, bristle for flies).
function antenna(ctx, x, y, a1, l1, a2, l2, segs, col, w) {
  const kx = x + Math.cos(a1) * l1, ky = y + Math.sin(a1) * l1;
  line(ctx, [x, y, kx, ky], col, w);
  for (let i = 0; i < segs; i++) {
    const p = i / segs, q = (i + 1) / segs, ang = a2 + (p - 0.5) * 0.5;
    const sx = kx + Math.cos(a2) * l2 * p, sy = ky + Math.sin(a2) * l2 * p;
    plainLine(ctx, [sx, sy, kx + Math.cos(a2) * l2 * q, ky + Math.sin(a2) * l2 * q], i % 2 ? col : tint(col, -0.25), w * (0.8 - p * 0.3));
  }
}

// Membrane wing with real-looking veins. Drawn from the wing base at (0,0) along +x after rotate(rot).
// kind: 'bee' | 'fly' | 'dragonfly'
function insectWing(ctx, x, y, len, wid, rot, kind, o) {
  o = o || {};
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const shape = () => {
    ctx.beginPath(); ctx.moveTo(0, 0);
    if (kind === 'dragonfly') {
      ctx.bezierCurveTo(len * 0.15, -wid * 0.9, len * 0.75, -wid * 1.05, len, -wid * 0.25);
      ctx.quadraticCurveTo(len * 0.98, wid * 0.25, len * 0.9, wid * 0.4);
      ctx.bezierCurveTo(len * 0.6, wid * 0.95, len * 0.2, wid * 0.75, 0, 0);
    } else {
      ctx.bezierCurveTo(len * 0.25, -wid * 1.05, len * 0.85, -wid * 0.95, len, -wid * 0.15);
      ctx.bezierCurveTo(len * 0.9, wid * 0.7, len * 0.35, wid * 0.8, 0, 0);
    }
    ctx.closePath();
  };
  shape();
  const g = ctx.createLinearGradient(0, -wid, len, wid);
  g.addColorStop(0, o.tint || 'rgba(225,232,240,.45)'); g.addColorStop(0.5, 'rgba(255,255,255,.22)'); g.addColorStop(1, o.tint || 'rgba(210,225,240,.4)');
  ctx.fillStyle = g; ctx.fill();
  if (Shade.rich) Tex.fillPath(ctx, 'wing', kind === 'dragonfly' ? 2.2 : 1.4, 0.3, 'multiply');
  ctx.strokeStyle = o.vein || 'rgba(55,50,60,.65)'; ctx.lineWidth = 0.55; ctx.stroke();
  // veins
  ctx.beginPath();
  if (kind === 'dragonfly') {
    // long veins and a fine ladder of cross veins
    for (const k of [0.12, 0.3, 0.48, 0.66]) { ctx.moveTo(len * 0.02, -wid * k * 0.6); ctx.quadraticCurveTo(len * 0.55, -wid * (k + 0.25), len * 0.98, -wid * (0.3 - k * 0.3)); }
    for (const k of [0.2, 0.45]) { ctx.moveTo(len * 0.05, wid * k * 0.4); ctx.quadraticCurveTo(len * 0.5, wid * (k + 0.25), len * 0.9, wid * 0.3); }
    ctx.strokeStyle = o.vein || 'rgba(55,50,60,.7)'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.beginPath();
    for (let i = 1; i < 26; i++) { const px = len * i / 26; ctx.moveTo(px, -wid * (0.95 - Math.abs(i - 13) * 0.01)); ctx.lineTo(px + 0.6, wid * 0.8 * (1 - Math.abs(i - 10) / 22)); }
    ctx.strokeStyle = 'rgba(55,50,60,.28)'; ctx.lineWidth = 0.35; ctx.stroke();
    // pterostigma: the dark cell near the tip
    plainEll(ctx, len * 0.82, -wid * 0.72, len * 0.06, wid * 0.1, o.stigma || '#3a3030', -0.25);
  } else {
    // costa thick along the front, then branching veins
    ctx.moveTo(0, -wid * 0.1); ctx.quadraticCurveTo(len * 0.5, -wid * 1.0, len * 0.95, -wid * 0.35);
    ctx.moveTo(len * 0.05, 0); ctx.quadraticCurveTo(len * 0.45, -wid * 0.6, len * 0.92, -wid * 0.1);
    ctx.moveTo(len * 0.08, wid * 0.05); ctx.quadraticCurveTo(len * 0.5, -wid * 0.1, len * 0.85, wid * 0.25);
    ctx.moveTo(len * 0.1, wid * 0.1); ctx.quadraticCurveTo(len * 0.4, wid * 0.35, len * 0.7, wid * 0.5);
    // cross veins making the closed cells
    ctx.moveTo(len * 0.35, -wid * 0.7); ctx.lineTo(len * 0.38, -wid * 0.35);
    ctx.moveTo(len * 0.6, -wid * 0.75); ctx.lineTo(len * 0.62, -wid * 0.3);
    ctx.moveTo(len * 0.45, -wid * 0.3); ctx.lineTo(len * 0.47, wid * 0.05);
    ctx.strokeStyle = o.vein || 'rgba(55,50,60,.7)'; ctx.lineWidth = 0.55; ctx.stroke();
    if (kind === 'fly') plainEll(ctx, len * 0.5, -wid * 0.1, len * 0.02, wid * 0.06, 'rgba(55,50,60,.5)');
  }
  // sheen
  plainEll(ctx, len * 0.5, -wid * 0.3, len * 0.28, wid * 0.14, 'rgba(255,255,255,.3)', -0.15);
  ctx.restore();
}

// Dense fur drawn as many short strokes inside an oval, lit from the light.
function fur(ctx, x, y, rx, ry, col, n, len, seed) {
  const r = rng(seed || 1), [lx, ly] = lightDir(ctx);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()), px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d, dir = a + (r() - 0.5) * 0.8;
    const lit = (px - x) * lx + (py - y) * ly > 0;
    ctx.strokeStyle = tint(col, lit ? 0.3 + r() * 0.2 : -0.2 - r() * 0.2); ctx.lineWidth = 0.5 + r() * 0.4;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(dir) * len, py + Math.sin(dir) * len); ctx.stroke();
  }
}

Object.assign(Sprites, {
  // Bull ant, Myrmecia (worker). Big head and eyes, long straight serrated jaws, a two-node waist,
  // black gaster with golden hairs and a sting.
  ant(ctx, o, t) {
    const red = '#b8411e', dark = '#4a1a0c';
    legs6r(ctx, 3, 19, '#7a2e14', 1.7, t, o.moving, { wide: 2.4 });
    // Gaster: 4 overlapping plates, hairy
    for (let i = 3; i >= 0; i--) ell(ctx, -11 - i * 2.6, 0, 7.6 - i * 0.9, 7.2 - i * 1.1, i % 2 ? '#1c1512' : '#24201a', 0, 'chitin');
    fur(ctx, -14, 0, 8.2, 6.2, '#c8a050', 70, 1.0, 3);
    if (o.stingT > 0) line(ctx, [-21, 0, -27, 0], '#e8c040', 1.4);
    // Waist: petiole (long node) and postpetiole (round)
    ell(ctx, -3.2, 0, 2.2, 2.6, red, 0, 'chitin');
    ell(ctx, -0.6, 0, 1.6, 2.1, tint(red, -0.1), 0, 'chitin');
    // Mesosoma in three humps: propodeum, mesonotum, pronotum
    ell(ctx, 1.6, 0, 2.4, 3.1, tint(red, -0.08), 0, 'chitin');
    ell(ctx, 4.6, 0, 3.2, 3.5, red, 0, 'chitin');
    ell(ctx, 8.2, 0, 3.4, 4.1, tint(red, 0.05), 0, 'chitin');
    // Head: wide behind the eyes, narrowing to the jaws
    ell(ctx, 13.6, 0, 5.4, 5.8, '#c6482a', 0, 'chitin');
    ell(ctx, 15.5, 0, 3.6, 4.2, '#c6482a', 0, 'chitin');
    facetEye(ctx, 14.2, -4.6, 2.2, 1.7, '#1a1410', 0.35);
    facetEye(ctx, 14.2, 4.6, 2.2, 1.7, '#1a1410', -0.35);
    for (const s of [-1, 1]) plainEll(ctx, 11.5, s * 1.6, 0.6, 0.6, '#3a1a10');   // ocelli
    // Jaws: long, almost straight, with saw teeth on the inner edge
    const open = o.stingT > 0 ? 1.8 : 0;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(17, s * 2.4); ctx.quadraticCurveTo(22.5, s * (4.6 + open), 28, s * (1.4 + open * 0.5));
      ctx.lineTo(27.6, s * (0.6 + open * 0.4)); ctx.quadraticCurveTo(22.5, s * (3.2 + open), 17.2, s * 1.2); ctx.closePath();
      const g = ctx.createLinearGradient(17, 0, 28, 0); g.addColorStop(0, '#c89a2a'); g.addColorStop(1, '#f0d060');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = 0.5; ctx.stroke();
      for (let k = 0; k < 6; k++) plainLine(ctx, [19 + k * 1.5, s * (3.3 + open * 0.9 - k * 0.42), 19.4 + k * 1.5, s * (2.3 + open * 0.9 - k * 0.42)], '#5a3a08', 0.55);
    }
    // Elbowed antennae: long scape, then a bead of segments
    for (const s of [-1, 1]) antenna(ctx, 15.5, s * 2.6, s * 1.05, 7, s * 0.25, 10, 9, dark, 1.1);
    if (o.carry) { ctx.save(); ctx.translate(29, 0); ctx.scale(0.8, 0.8); Sprites[o.carry](ctx, { stunned: true }, t); ctx.restore(); }
  },

  // Blue-banded bee, Amegilla. Ginger pile on the thorax, black abdomen with four pale iridescent blue
  // bands of scale-hairs, big pale green eyes, smoky wings.
  bee(ctx, o, t) {
    const flap = Math.sin(t * (o.buzz ? 90 : 50)) * 0.35;
    legs6r(ctx, 1, 12, '#3a2a1a', 1.2, t, false, { wide: 2.2 });
    for (const s of [-1, 1]) if (o.load > 0) { ell(ctx, -4, s * 9, 1.8 + o.load, 1.5 + o.load * 0.6, '#f5a623', 0, 'grain'); fur(ctx, -4, s * 9, 2 + o.load, 1.6 + o.load * 0.6, '#f0b040', 14, 1, 2); }
    // Abdomen: black, with soft blue bands
    ell(ctx, -8, 0, 10, 7.4, '#141212', 0, 'chitin');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-8, 0, 10, 7.4, 0, 0, TAU); ctx.clip();
    for (let k = 0; k < 4; k++) {
      const bx = -15 + k * 4.2;
      const gr = ctx.createLinearGradient(bx - 1.6, 0, bx + 1.6, 0);
      gr.addColorStop(0, 'rgba(120,220,255,0)'); gr.addColorStop(0.3, '#8ad8ff'); gr.addColorStop(0.6, '#4ab0e8'); gr.addColorStop(1, 'rgba(60,150,220,0)');
      ctx.fillStyle = gr; ctx.fillRect(bx - 1.8, -8, 3.6, 16);
    }
    if (Shade.rich) Tex.fillPath(ctx, 'hair', 1.2, 0.3, 'multiply');
    ctx.restore();
    fuzz(ctx, -8, 0, 10, 7.4, 30, 0.9, 'rgba(90,80,70,.6)', 0.45);
    // Thorax: a dense ginger pile
    ell(ctx, 2, 0, 6.3, 6.3, '#b8884a', 0, 'hair');
    fur(ctx, 2, 0, 6.6, 6.6, '#d8a860', 160, 1.4, 5);
    fuzz(ctx, 2, 0, 6.3, 6.3, 36, 1.8, '#c89850', 0.6);
    // Head with big pale green eyes and black antennae
    ell(ctx, 9.6, 0, 4, 5, '#1e1a18', 0, 'chitin');
    facetEye(ctx, 10, -3.4, 2.5, 1.9, '#6a9a68', 0.3);
    facetEye(ctx, 10, 3.4, 2.5, 1.9, '#6a9a68', -0.3);
    fur(ctx, 9.6, 0, 3, 2.4, '#d8c090', 20, 0.8, 6);
    for (const s of [-1, 1]) antenna(ctx, 12.5, s * 1.6, s * 1.0, 3, s * 0.6, 5, 6, '#141010', 0.9);
    if (o.sip || o.buzz) plainLine(ctx, [13, 0, 19, 0], '#3a2a1a', 0.8);
    for (const s of [-1, 1]) {
      insectWing(ctx, 3, s * 2, 15, 4.6, s * (2.7 - flap), 'bee', { tint: 'rgba(190,190,205,.5)' });
      insectWing(ctx, 1, s * 2, 10, 3.2, s * (2.5 - flap), 'bee', { tint: 'rgba(190,190,205,.4)' });
    }
    if (o.buzz) for (let i = 0; i < 3; i++) { const r = 18 + ((t * 60 + i * 6) % 18); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.strokeStyle = 'rgba(255,210,63,' + (1 - (r - 18) / 18) * 0.7 + ')'; ctx.lineWidth = 1.5; ctx.stroke(); }
  },

  // Coastal peacock spider, Maratus speciosus, male. Dark hairy cephalothorax with white bands, two
  // huge front eyes, iridescent fan with red bands and orange side fringes, third legs black with white tips.
  spider(ctx, o, t) {
    const dance = o.dance > 0 || o.fan > 0;
    const w = o.moving ? Math.sin(t * 16) * 0.2 : 0;
    const angles = [0.55, 1.15, 1.9, 2.5];
    for (let i = 3; i >= 0; i--) for (const s of [-1, 1]) {
      let a = s * angles[i] + (i % 2 ? w : -w) * s, l = i === 2 ? 20 : i === 3 ? 17 : 15;
      if (dance && i === 2) { a = s * (1.55 + Math.sin(t * 12) * 0.45); l = 24; }
      ileg(ctx, 3, s * 1.2, a, l, i === 2 ? '#1a1410' : '#2a2018', 1.7, s * 0.5, s * 0.4);
      if (i === 2) {   // white brush on the third legs
        const fem = l * 0.42, tib = l * 0.38;
        const kx = 3 + Math.cos(a) * fem, ky = s * 1.2 + Math.sin(a) * fem, b = a + s * 0.5;
        const ex = kx + Math.cos(b) * tib, ey = ky + Math.sin(b) * tib;
        fur(ctx, ex + Math.cos(b + s * 0.4) * l * 0.12, ey + Math.sin(b + s * 0.4) * l * 0.12, 2.4, 1.4, '#f4f4f0', 16, 1.2, 4);
      }
    }
    // Fan: iridescent abdomen with transverse red bands; raised and fringed when dancing
    const ax = dance ? 8.5 : 7.2, ay = dance ? 13 : 6.4;
    if (dance) { ctx.beginPath(); for (let k = 0; k < 44; k++) { const a = Math.PI / 2 + (k / 43 - 0.5) * 3.6; ctx.moveTo(-8 + Math.cos(a) * 8, Math.sin(a) * 13); ctx.lineTo(-8 + Math.cos(a) * 12, Math.sin(a) * 17.5); } ctx.strokeStyle = '#ff9a2a'; ctx.lineWidth = 1.1; ctx.stroke(); }
    else for (const s of [-1, 1]) { ctx.beginPath(); for (let k = 0; k < 9; k++) { ctx.moveTo(-13.5 + k * 1.4, s * 5.6); ctx.lineTo(-14 + k * 1.4, s * 8.4); } ctx.strokeStyle = '#ff8c1a'; ctx.lineWidth = 0.7; ctx.stroke(); }
    ell(ctx, -8, 0, ax, ay, '#2a8aa8', 0, 'none');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-8, 0, ax, ay, 0, 0, TAU); ctx.clip();
    const gr = ctx.createLinearGradient(-16, -ay, 0, ay);
    gr.addColorStop(0, '#48e0d0'); gr.addColorStop(0.35, '#2a78d8'); gr.addColorStop(0.7, '#3ac8a0'); gr.addColorStop(1, '#2a60c0');
    ctx.fillStyle = gr; ctx.fillRect(-17, -ay, 18, ay * 2);
    for (let k = -2; k <= 2; k++) { ctx.fillStyle = '#ff5a1a'; ctx.beginPath(); ctx.ellipse(-8, k * ay * 0.36, ax, 0.9 + (dance ? 0.7 : 0), 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,230,120,.6)'; ctx.beginPath(); ctx.ellipse(-8, k * ay * 0.36 - 0.7, ax * 0.9, 0.3, 0, 0, TAU); ctx.fill(); }
    if (Shade.rich) Tex.fillPath(ctx, 'chitinHi', 1.5, 0.35, 'screen');
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-10, -ay * 0.45, ax * 0.5, ay * 0.16, -0.3, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(-8, 0, ax, ay, 0, 0, TAU); ctx.strokeStyle = 'rgba(10,30,40,.6)'; ctx.lineWidth = 0.6; ctx.stroke();
    // Cephalothorax: dark, hairy, white side stripes; eight eyes
    ell(ctx, 4, 0, 6.8, 5.8, '#2a2018', 0, 'hair');
    fur(ctx, 4, 0, 6.5, 5.5, '#3a2a20', 50, 1, 7);
    for (const s of [-1, 1]) { plainLine(ctx, [-1.5, s * 3.6, 8.5, s * 4.2], 'rgba(245,245,235,.8)', 1.1); plainLine(ctx, [0, s * 1.4, 7, s * 1.6], 'rgba(245,245,235,.35)', 0.6); }
    facetEye(ctx, 9.8, -2.3, 2.4, 2.4, '#0a0a0a');
    facetEye(ctx, 9.8, 2.3, 2.4, 2.4, '#0a0a0a');
    for (const s of [-1, 1]) { eye(ctx, 8.6, s * 5.1, 1, 1, '#0a0a0a'); plainEll(ctx, 5.2, s * 4.8, 0.7, 0.7, '#0a0a0a'); plainEll(ctx, 1.6, s * 4.4, 1, 1, '#0a0a0a'); }
    for (const s of [-1, 1]) { ell(ctx, 11.2, s * 1.1, 1.5, 1.1, '#3a2a20', 0, 'hair'); fur(ctx, 11.2, s * 1.1, 1.5, 1, '#e8e0d0', 8, 0.8, 8); }
  },

  // Blue skimmer, Orthetrum caledonicum. Powder-blue male (yellow-brown female), long narrow
  // abdomen in ten segments, four clear wings with dense veins and a dark pterostigma, big eyes.
  dragonfly(ctx, o, t) {
    const flap = Math.sin(t * 40) * 0.12, fem = o.female;
    const body = fem ? '#c8a050' : '#8ec6ec', dark = fem ? '#6a4a20' : '#4a7aa8';
    for (const s of [-1, 1]) {
      insectWing(ctx, 3, s * 1.5, 27, 4.4, s * (1.42 + flap), 'dragonfly', { tint: 'rgba(225,235,245,.4)' });
      insectWing(ctx, -2, s * 1.5, 27, 5.4, s * (1.78 + flap), 'dragonfly', { tint: 'rgba(225,235,245,.4)' });
    }
    // Abdomen: segments, each a little narrower, with a dark seam
    for (let k = 9; k >= 0; k--) {
      ell(ctx, -5 - k * 3.4, 0, 2.2, 2.4 - k * 0.1, k > 7 ? '#2d3e50' : (k % 2 ? body : tint(body, -0.06)), 0, 'none');
      plainLine(ctx, [-6.8 - k * 3.4, -2.2 + k * 0.1, -6.8 - k * 3.4, 2.2 - k * 0.1], 'rgba(30,40,60,.45)', 0.6);
    }
    if (fem) plainLine(ctx, [-6, 0, -34, 0], 'rgba(40,25,10,.6)', 1.2);
    // Legs: short, spiny, tucked forward
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) ileg(ctx, 3 - i * 2, s * 2, s * (1.0 + i * 0.35), 9, '#2a2a30', 0.9, s * 0.9, s * 0.3);
    // Thorax and head
    ell(ctx, 2, 0, 6.2, 4.8, dark, 0, 'chitin');
    plainLine(ctx, [-2, -3, 5, -2], 'rgba(255,255,255,.25)', 1);
    ell(ctx, 7.5, 0, 3.2, 3.6, dark, 0, 'chitin');
    facetEye(ctx, 9.2, -3.2, 3.9, 3.6, fem ? '#7a6a40' : '#3a7a9a');
    facetEye(ctx, 9.2, 3.2, 3.9, 3.6, fem ? '#7a6a40' : '#3a7a9a');
    plainEll(ctx, 11.5, 0, 1.6, 1.2, '#1a2a30');
    if (o.dart > 0) for (let i = 0; i < 3; i++) line(ctx, [-36 - i * 6, -6 + i * 6, -48 - i * 6, -6 + i * 6], 'rgba(255,255,255,.6)', 2);
  },

  // Australian painted lady, Vanessa kershawi. Orange with black tips carrying white spots, black
  // bars across the forewing, a row of blue-centred eyespots on the hindwing, furry body, clubbed antennae.
  butterfly(ctx, o, t) {
    const f = o.landed ? 0.35 : 0.55 + Math.sin(t * 18) * 0.45;
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(1, s * f);
      // Hindwing first (behind)
      ctx.beginPath(); ctx.moveTo(-1, 1); ctx.bezierCurveTo(1, 12, -5, 20, -13, 17); ctx.bezierCurveTo(-17, 9, -11, 2, -4, 1); ctx.closePath();
      let g = ctx.createLinearGradient(-2, 0, -12, 17); g.addColorStop(0, '#9a3e18'); g.addColorStop(0.5, '#e07a2a'); g.addColorStop(1, '#c86022');
      ctx.fillStyle = g; ctx.fill();
      if (Shade.rich) Tex.fillPath(ctx, 'grain', 2, 0.25, 'multiply');
      ctx.strokeStyle = 'rgba(40,20,5,.7)'; ctx.lineWidth = 0.6; ctx.stroke();
      // dark margin and eyespots
      ctx.beginPath(); ctx.moveTo(-13, 17); ctx.bezierCurveTo(-5, 20, 1, 12, -1, 1); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.4; ctx.stroke();
      for (let k = 0; k < 4; k++) { const ex = -12.5 + k * 3.1, ey = 14 - k * 1.9; plainEll(ctx, ex, ey, 1.7, 1.7, '#1e1a18'); plainEll(ctx, ex, ey, 0.9, 0.9, '#3a78e0'); plainEll(ctx, ex - 0.3, ey - 0.3, 0.35, 0.35, '#cfe6ff'); }
      // Forewing
      ctx.beginPath(); ctx.moveTo(2, 0); ctx.bezierCurveTo(10, 1, 17, 9, 14, 23); ctx.bezierCurveTo(8, 25, 1, 18, -2, 2); ctx.closePath();
      g = ctx.createLinearGradient(0, 0, 12, 22); g.addColorStop(0, '#a84a1a'); g.addColorStop(0.4, '#f08a2e'); g.addColorStop(1, '#e8802a');
      ctx.fillStyle = g; ctx.fill();
      if (Shade.rich) Tex.fillPath(ctx, 'grain', 2, 0.25, 'multiply');
      ctx.save(); ctx.clip();
      // black apex with white spots, black bars
      ctx.beginPath(); ctx.moveTo(7, 7); ctx.quadraticCurveTo(17, 7, 17, 27); ctx.lineTo(2, 27); ctx.quadraticCurveTo(4, 14, 7, 7); ctx.fillStyle = '#1c1816'; ctx.fill();
      for (const [px, py, pr] of [[11.5, 19.5, 1.5], [9, 16, 1.1], [13.2, 14.5, 1], [7.5, 21.5, 0.8], [13.5, 23, 0.9]]) plainEll(ctx, px, py, pr, pr * 0.9, '#f8f4ee');
      ctx.fillStyle = '#1c1816';
      ctx.beginPath(); ctx.ellipse(5.5, 4, 1.2, 3.2, 0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(3, 10, 2.4, 1.1, -0.2, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(8, 11.5, 1, 2.2, 0.2, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(40,20,5,.75)'; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(1, 1); ctx.quadraticCurveTo(4 + k * 1.2, 8 + k, 2 + k * 3, 19 + k * 0.8); }
      ctx.strokeStyle = 'rgba(70,35,10,.3)'; ctx.lineWidth = 0.4; ctx.stroke();
      ctx.restore();
    }
    // Furry body, thorax and head with clubbed antennae
    ell(ctx, -4, 0, 8.5, 2.1, '#3a2c22', 0, 'hair');
    fur(ctx, -4, 0, 8, 1.8, '#5a4030', 40, 1, 9);
    ell(ctx, 4, 0, 3.4, 3, '#3a2c22', 0, 'hair');
    fur(ctx, 4, 0, 3.4, 3, '#6a5038', 30, 1.2, 10);
    ell(ctx, 7.6, 0, 2.2, 2.2, '#2a221c', 0, 'chitin');
    facetEye(ctx, 8.4, -1.4, 1.1, 1, '#3a3020'); facetEye(ctx, 8.4, 1.4, 1.1, 1, '#3a3020');
    for (const sg of [-1, 1]) { line(ctx, [8.5, sg, 16.5, sg * 5], '#2a221c', 0.7); plainEll(ctx, 16.8, sg * 5.2, 1.1, 0.9, '#5a4a30'); plainEll(ctx, 17.1, sg * 5.3, 0.5, 0.4, '#f0e0c0'); }
    if (o.sip) { ctx.beginPath(); ctx.arc(11, 0, 2.5, -1.5, 1.5); ctx.strokeStyle = '#2a221c'; ctx.lineWidth = 0.8; ctx.stroke(); }
  },

  // Bush fly, Musca vetustissima. Grey thorax with two dark stripes, grey abdomen with pale side
  // patches and a dark line down the middle, big red-brown eyes, bristles, wings with the bent M vein.
  bushFly(ctx, o, t) {
    const flap = o.landed ? 0.25 : Math.sin(t * 80) * 0.45;
    legs6r(ctx, 0, 8.5, '#2a2622', 0.8, t, o.moving && o.landed, { wide: 1.6, len: 0.6 });
    for (const s of [-1, 1]) insectWing(ctx, 0.5, s * 1.6, 11.5, 3.4, s * (2.6 - flap), 'fly', { tint: 'rgba(210,218,228,.5)' });
    // Abdomen
    ell(ctx, -5, 0, 5.2, 3.6, '#8a8878', 0, 'chitin');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-5, 0, 5.2, 3.6, 0, 0, TAU); ctx.clip();
    for (const s of [-1, 1]) plainEll(ctx, -4, s * 2.2, 3.2, 1.3, 'rgba(210,180,110,.55)');
    plainLine(ctx, [-10, 0, 0, 0], 'rgba(40,40,35,.75)', 1.2);
    for (let k = 1; k < 4; k++) plainLine(ctx, [-9.5 + k * 2.6, -4, -9.8 + k * 2.6, 4], 'rgba(40,40,35,.45)', 0.5);
    ctx.restore();
    fuzz(ctx, -5, 0, 5.2, 3.6, 16, 1.1, '#1e1e1a', 0.4);
    // Thorax with two stripes
    ell(ctx, 1.2, 0, 3.9, 3.5, '#9a9888', 0, 'chitin');
    plainLine(ctx, [-2, -1.3, 4.2, -1.3], '#34332e', 1.1); plainLine(ctx, [-2, 1.3, 4.2, 1.3], '#34332e', 1.1);
    fuzz(ctx, 1.2, 0, 3.9, 3.5, 14, 1.2, '#1e1e1a', 0.45);
    for (const s of [-1, 1]) plainEll(ctx, -2.4, s * 3.4, 1.1, 0.7, '#c8c4b0');   // halteres
    // Head: big red eyes nearly meeting, short antennae, sponging mouth
    ell(ctx, 5.4, 0, 2.3, 2.8, '#6a6658', 0, 'chitin');
    facetEye(ctx, 5.6, -1.9, 2.1, 2.1, '#8b2a1e');
    facetEye(ctx, 5.6, 1.9, 2.1, 2.1, '#8b2a1e');
    for (const s of [-1, 1]) plainLine(ctx, [7, s * 0.6, 8.2, s * 1.6], '#2a2622', 0.6);
    if (o.sip) { plainLine(ctx, [7, 0, 9.5, 0], '#5a5a50', 1.2); plainEll(ctx, 9.6, 0, 1, 0.7, '#7a7a6a'); }
  },

  // Termite worker, Coptotermes. Soft, pale and translucent: the gut shows through the abdomen.
  // Round orange head with no eyes, beaded antennae, short legs.
  termiteWorker(ctx, o, t) {
    legs6r(ctx, 0, 10, '#c8a874', 1.0, t, o.moving, { wide: 1.8, len: 0.7 });
    ell(ctx, -8, 0, 7.4, 4.9, '#f0e6cc', 0, 'none');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-8, 0, 7.4, 4.9, 0, 0, TAU); ctx.clip();
    plainEll(ctx, -8.5, 0.2, 4.6, 2, 'rgba(150,110,60,.4)');
    plainEll(ctx, -10, 0, 2.2, 1.2, 'rgba(110,80,40,.35)');
    for (let k = 1; k < 6; k++) plainLine(ctx, [-14.5 + k * 2.4, -5, -14.8 + k * 2.4, 5], 'rgba(170,140,90,.5)', 0.5);
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(-8, 0, 7.4, 4.9, 0, 0, TAU); ctx.strokeStyle = 'rgba(160,130,80,.5)'; ctx.lineWidth = 0.6; ctx.stroke();
    ell(ctx, 0, 0, 3.4, 3.5, '#ead9b0', 0, 'none');
    ell(ctx, 6, 0, 4.2, 3.8, '#d8a050', 0, 'grain');
    plainEll(ctx, 8.4, -1.3, 1.2, 0.7, '#7a4a20'); plainEll(ctx, 8.4, 1.3, 1.2, 0.7, '#7a4a20');
    for (const s of [-1, 1]) for (let k = 0; k < 8; k++) plainEll(ctx, 9 + k * 0.85, s * (1.8 + k * 0.75), 0.45, 0.45, k % 2 ? '#b89868' : '#d8b888');
    if (o.carry) { ctx.save(); ctx.translate(14, 0); if (o.carry === 'mud') ell(ctx, 0, 0, 4.5, 4, '#6b4a2a', 0, 'soil'); else { ctx.fillStyle = '#a07848'; ctx.fillRect(-5, -2, 10, 4); ctx.fillStyle = '#c89a68'; ctx.fillRect(-5, -2, 10, 1); } ctx.restore(); }
  },

  // Native snail, Bothriembryon. A tall conical shell lying over on its side, brown with pale growth
  // streaks and a dark line along each suture; a grey, granular body with two pairs of tentacles.
  snail(ctx, o, t) {
    const s = o.size || 1;
    ctx.save(); ctx.scale(s, s);
    if (!o.sealed) {
      const st = Math.sin(t * 3) * 0.6;
      ell(ctx, 4, 0, 19, 6.4, '#8a7e70', 0, 'scale');
      ctx.save(); ctx.beginPath(); ctx.ellipse(4, 0, 19, 6.4, 0, 0, TAU); ctx.clip();
      plainEll(ctx, 2, 4.5, 16, 1.6, 'rgba(255,250,240,.3)');   // the foot's pale edge
      ctx.restore();
      for (const sg of [-1, 1]) {
        line(ctx, [18, sg * 2, 28, sg * (6.8 + st)], '#7a6e62', 1.6);
        facetEye(ctx, 28.2, sg * (6.8 + st), 1.5, 1.5, '#2a2018');
        line(ctx, [20, sg * 1, 23.5, sg * 3.2], '#7a6e62', 1);
      }
    }
    // Shell: wide body whorl at the front, tapering to the apex behind-left
    ctx.save(); ctx.translate(-2, -1); ctx.rotate(0.12);
    ctx.beginPath(); ctx.moveTo(7, -9.5); ctx.bezierCurveTo(14, -5, 14, 5, 7, 9.5); ctx.lineTo(-4, 7); ctx.lineTo(-13, 4); ctx.lineTo(-20, 1); ctx.lineTo(-13, -4); ctx.lineTo(-4, -7); ctx.closePath();
    const g = ctx.createLinearGradient(0, -9, 0, 9); g.addColorStop(0, '#c89060'); g.addColorStop(0.4, '#a0683a'); g.addColorStop(1, '#5a3418');
    ctx.fillStyle = g; ctx.fill();
    if (Shade.rich) Tex.fillPath(ctx, 'grain', 1.5, 0.3, 'multiply');
    ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 0.7; ctx.stroke();
    // sutures between whorls, growth streaks, and a shine
    for (const [x, h] of [[-4, 7], [-13, 4]]) { ctx.beginPath(); ctx.moveTo(x, -h); ctx.quadraticCurveTo(x - 2.5, 0, x, h); ctx.strokeStyle = '#3a2010'; ctx.lineWidth = 0.8; ctx.stroke(); }
    for (let k = 0; k < 9; k++) { const x = 6 - k * 1.2, h = 9 - k * 0.3; ctx.beginPath(); ctx.moveTo(x, -h); ctx.quadraticCurveTo(x - 1.5, 0, x, h); ctx.strokeStyle = k % 3 ? 'rgba(255,235,200,.35)' : 'rgba(60,30,10,.35)'; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(4, -4.5, 5, 1.6, -0.1, 0, TAU); ctx.fillStyle = 'rgba(255,245,225,.45)'; ctx.fill();
    ctx.restore();
    if (o.sealed) ell(ctx, 6, 0, 4, 6.5, '#e8e0d0', 0, 'grain');
    ctx.restore();
  },

  // Dragonfly nymph: stocky, mottled brown, wing pads folded over the back, big eyes, the hinged
  // labium folded under the head, sprawling spiny legs and three short spines at the tail.
  nymph(ctx, o, t) {
    legs6r(ctx, 1, 16, '#4a3a22', 1.5, t, o.moving, { wide: 3, spread: 1.1 });
    for (let k = 6; k >= 0; k--) ell(ctx, -6 - k * 3.2, 0, 5.6 - k * 0.55, 6.2 - k * 0.75, k % 2 ? '#6b5530' : '#7a6238', 0, 'chitin');
    for (let k = 0; k < 7; k++) { plainEll(ctx, -6 - k * 3.2, 0, 1, 2.6 - k * 0.3, 'rgba(50,35,15,.4)'); plainLine(ctx, [-7.6 - k * 3.2, -5.5 + k * 0.7, -7.6 - k * 3.2, 5.5 - k * 0.7], 'rgba(40,28,12,.45)', 0.5); }
    for (const s of [-1, 1]) { line(ctx, [-27, 0, -31.5, s * 2.4], '#4a3a22', 1.3); } line(ctx, [-27, 0, -32, 0], '#4a3a22', 1.3);
    ell(ctx, 0, 0, 6.2, 5.8, '#7a6238', 0, 'chitin');
    // wing pads
    for (const s of [-1, 1]) { ell(ctx, -7, s * 3.2, 8, 2.4, '#5b4a2a', s * 0.12, 'chitin'); plainLine(ctx, [-13, s * 3.6, -1, s * 2.8], 'rgba(30,20,10,.5)', 0.5); }
    ell(ctx, 8, 0, 5, 6.6, '#806840', 0, 'chitin');
    facetEye(ctx, 9, -5, 2.9, 2.6, '#3a3020'); facetEye(ctx, 9, 5, 2.9, 2.6, '#3a3020');
    plainEll(ctx, 12, 0, 1.8, 2.8, 'rgba(60,40,20,.5)');   // folded labium under the head
    for (const s of [-1, 1]) plainLine(ctx, [11, s * 2, 14.5, s * 3.5], '#3a2a18', 0.7);
    if (o.grab) { const L = o.grab.len; line(ctx, [10, 0, 10 + L * 0.5, 2, 10 + L, 0], '#a08050', 2.6); line(ctx, [10 + L, 0, 14 + L, -3], '#5b4a2a', 1.6); line(ctx, [10 + L, 0, 14 + L, 3], '#5b4a2a', 1.6); }
    if (o.jet > 0) for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-32 - i * 8 - (t * 60) % 8, (i % 2 ? 3 : -3), 2 + i * 1.5, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.stroke(); }
  },

  // Mosquito, Culex quinquefasciatus (female). Slender brown body with pale bands on the abdomen,
  // long banded legs, narrow scaly wings, a long proboscis. o.blood swells the abdomen red.
  mosquito(ctx, o, t) {
    const flap = Math.sin(t * 90) * 0.4, fed = o.blood || 0;
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
      const a = s * (0.85 + i * 0.75);
      ileg(ctx, 0, s * 0.8, a, 16, '#4a3a2a', 0.7, s * 0.5, s * 0.5);
      const kx = Math.cos(a) * 16 * 0.42, ky = s * 0.8 + Math.sin(a) * 16 * 0.42;
      plainEll(ctx, kx, ky, 0.7, 0.7, '#e8e0d0');
    }
    for (const s of [-1, 1]) insectWing(ctx, 0.5, s * 1, 9.5, 2, s * (2.7 - flap), 'fly', { tint: 'rgba(215,220,230,.5)' });
    ell(ctx, -5, 0, 5 + fed, 1.5 + fed * 1.8, fed > 0.2 ? '#a81e2a' : '#5a4634', 0, 'chitin');
    for (let k = 1; k < 7; k++) plainLine(ctx, [-9.5 + k * 1.4, -1.6 - fed * 1.8, -9.5 + k * 1.4, 1.6 + fed * 1.8], 'rgba(235,225,200,.7)', 0.55);
    ell(ctx, 0.6, 0, 2.2, 1.9, '#6a5440', 0, 'hair');
    fur(ctx, 0.6, 0, 2, 1.7, '#8a7050', 10, 0.6, 11);
    facetEye(ctx, 2.6, -0.9, 0.9, 1.1, '#1a1a1a'); facetEye(ctx, 2.6, 0.9, 0.9, 1.1, '#1a1a1a');
    plainLine(ctx, [3.2, 0, 9, 0], '#2a2018', 0.6);
    for (const s of [-1, 1]) { plainLine(ctx, [3.2, s * 0.4, 6.5, s * 2.2], '#3a2a1a', 0.4); for (let k = 0; k < 5; k++) plainEll(ctx, 3.6 + k * 0.7, s * (0.6 + k * 0.42), 0.35, 0.35, '#5a4a3a'); }
  },

  // Banded sugar ant, Camponotus consobrinus. Heart-shaped black head, orange-brown thorax and
  // front of the gaster, black rear with golden hairs, a single waist node, long orange legs.
  sugarAnt(ctx, o, t) {
    legs6r(ctx, 3, 17, '#b8702e', 1.4, t, o.moving, { wide: 2.2 });
    const full = o.honey ? 1.35 : 1;
    ell(ctx, -11, 0, 8 * full, 6 * full, '#1e1612', 0, 'chitin');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-11, 0, 8 * full, 6 * full, 0, 0, TAU); ctx.clip();
    plainEll(ctx, -5.5, 0, 4 * full, 7, '#d07a30');
    if (o.honey) { ctx.fillStyle = 'rgba(240,190,60,.55)'; ctx.fillRect(-20, -8, 18, 16); }
    for (let k = 1; k < 4; k++) plainLine(ctx, [-18 + k * 3.4 * full, -7, -18.5 + k * 3.4 * full, 7], 'rgba(120,90,60,.45)', 0.6);
    ctx.restore();
    fur(ctx, -12, 0, 7, 5, '#c8a050', 40, 0.9, 12);
    ell(ctx, -4.2, 0, 1.9, 2.3, '#c86a28', 0, 'chitin');
    ell(ctx, 0.5, 0, 3.2, 3.2, '#d07a30', 0, 'chitin');
    ell(ctx, 4.8, 0, 2.8, 3.6, '#d8842e', 0, 'chitin');
    // Heart-shaped head: wide and notched at the back
    ell(ctx, 10.6, 0, 5.2, 5.4, '#221a14', 0, 'chitin');
    plainEll(ctx, 6, 0, 1.6, 2.2, '#d07a30');
    facetEye(ctx, 11.4, -3.8, 1.6, 1.3, '#0a0a0a', 0.3); facetEye(ctx, 11.4, 3.8, 1.6, 1.3, '#0a0a0a', -0.3);
    for (const s of [-1, 1]) { plainLine(ctx, [14.8, s * 1.8, 17.6, s * 1.2], '#3a2a1a', 1.6); antenna(ctx, 14, s * 2.4, s * 1.1, 5.5, s * 0.3, 9, 9, '#5a3a1a', 0.9); }
    if (o.crumbs) for (let i = 0; i < o.crumbs; i++) ell(ctx, 17.5 + (i % 2) * 3, (i - 1.5) * 2.4, 2.4, 2.2, '#8a6a42', 0, 'soil');
  },

  // Golden orb-weaver, Trichonephila edulis (female). Long grey-brown abdomen with silvery patches,
  // silver-haired cephalothorax, long dark legs banded orange-yellow at the joints.
  orbSpider(ctx, o, t) {
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const a = s * [0.45, 0.9, 1.9, 2.5][i], l = [30, 26, 17, 24][i];
      ileg(ctx, 2, s, a, l, '#2a2018', 1.4, s * (i < 2 ? -0.35 : 0.35), s * 0.3);
      const fem = l * 0.42, kx = 2 + Math.cos(a) * fem, ky = s + Math.sin(a) * fem;
      plainEll(ctx, kx, ky, 1.5, 1.1, '#e8b030', a); plainEll(ctx, 2 + Math.cos(a) * fem * 0.25, s + Math.sin(a) * fem * 0.25, 1.3, 1, '#e8b030', a);
    }
    ell(ctx, -9, 0, 10, 4.8, '#8a8070', 0, 'chitin');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-9, 0, 10, 4.8, 0, 0, TAU); ctx.clip();
    for (let k = 0; k < 4; k++) plainEll(ctx, -15 + k * 4, 0, 1.6, 3.2 - k * 0.3, 'rgba(240,240,225,.75)');
    plainLine(ctx, [-18, -2.6, -1, -2.2], 'rgba(60,50,40,.4)', 0.7); plainLine(ctx, [-18, 2.6, -1, 2.2], 'rgba(60,50,40,.4)', 0.7);
    ctx.restore();
    ell(ctx, 4, 0, 4.8, 4.2, '#4a4038', 0, 'hair');
    fur(ctx, 4, 0, 4.6, 4, '#d8d8cc', 40, 0.9, 13);
    for (const s of [-1, 1]) { eye(ctx, 8, s * 1.4, 0.8, 0.8); plainEll(ctx, 7, s * 2.8, 0.6, 0.6, '#0a0a0a'); }
    for (const s of [-1, 1]) plainLine(ctx, [8, s * 1, 11, s * 2.4], '#3a3028', 1);
  },
});
