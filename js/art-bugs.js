'use strict';
// Hand-drawn storybook versions of the bugs you play, replacing the simple shapes in sprites.js.
// Same size and facing (+x) as before, so hit circles and missions are unchanged.

// Leg with thick upper part, thinner lower part and a little foot.
function tleg(ctx, x, y, a, l1, l2, bend, col, w) {
  const kx = x + Math.cos(a) * l1, ky = y + Math.sin(a) * l1, b = a + bend;
  const ex = kx + Math.cos(b) * l2, ey = ky + Math.sin(b) * l2;
  line(ctx, [x, y, kx, ky], col, w);
  line(ctx, [kx, ky, ex, ey], col, w * 0.7);
  plainLine(ctx, [ex, ey, ex + Math.cos(b + bend * 0.6) * l2 * 0.25, ey + Math.sin(b + bend * 0.6) * l2 * 0.25], col, Math.max(0.6, w * 0.45));
}

// Six walking legs from a thorax at x. Alternating tripods like real insects.
function legs6(ctx, x, len, col, w, t, moving, spread) {
  const sw = moving ? Math.sin(t * 18) : 0;
  const base = [-0.85, 0, 0.8].map(v => v * (spread || 1));
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
    const tri = (i === 1 ? -1 : 1) * s;
    const a = s * (Math.PI / 2 - base[i]) + sw * 0.28 * tri;
    tleg(ctx, x + (1 - i) * 2.5, s * 1.5, a, len * 0.5, len * 0.62, s * (i - 1) * 0.55 - s * 0.25 * (i === 0 ? -1 : 1), col, w);
  }
}

// Shiny eye: dark ball with a white glint toward the light.
function eye(ctx, x, y, rx, ry, col) {
  ell(ctx, x, y, rx, ry, col || '#151010');
  const [lx, ly] = lightDir(ctx);
  plainEll(ctx, x + lx * rx * 0.38, y + ly * ry * 0.38, Math.max(0.45, rx * 0.32), Math.max(0.45, ry * 0.32), 'rgba(255,255,255,.9)');
}
function plainEll(ctx, x, y, rx, ry, fill, rot) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fillStyle = fill; ctx.fill();
}

// See-through wing with veins.
function veinWing(ctx, x, y, len, wid, rot, tintCol, veins) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.3, -wid, len * 0.9, -wid * 0.9, len, 0);
  ctx.bezierCurveTo(len * 0.9, wid * 0.7, len * 0.3, wid * 0.6, 0, 0);
  const gr = ctx.createLinearGradient(0, -wid, len, wid);
  gr.addColorStop(0, tintCol || 'rgba(235,245,255,.55)');
  gr.addColorStop(0.5, 'rgba(255,255,255,.3)');
  gr.addColorStop(1, tintCol || 'rgba(220,235,250,.5)');
  ctx.fillStyle = gr; ctx.fill();
  ctx.strokeStyle = 'rgba(60,60,80,.45)'; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.beginPath();
  for (let i = 1; i <= (veins || 3); i++) {
    const k = i / ((veins || 3) + 1);
    ctx.moveTo(len * 0.05, 0);
    ctx.quadraticCurveTo(len * 0.5, -wid * (0.9 - k * 1.3) * 0.7, len * (0.75 + k * 0.2), -wid * (0.6 - k * 1.1) * 0.6);
  }
  ctx.strokeStyle = 'rgba(70,70,90,.35)'; ctx.lineWidth = 0.4; ctx.stroke();
  // Shine
  ctx.beginPath(); ctx.ellipse(len * 0.45, -wid * 0.35, len * 0.25, wid * 0.12, 0, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
  ctx.restore();
}

// Short hairs around an oval (fuzz on bees, bristles on flies).
function fuzz(ctx, x, y, rx, ry, n, len, col, w) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + (i % 2) * 0.1;
    const c = Math.cos(a), s = Math.sin(a);
    ctx.moveTo(x + c * rx * 0.9, y + s * ry * 0.9);
    ctx.lineTo(x + c * (rx + len), y + s * (ry + len));
  }
  ctx.strokeStyle = col; ctx.lineWidth = w || 0.6; ctx.lineCap = 'round'; ctx.stroke();
}

// Segment bands across an abdomen.
function bands(ctx, x, y, rx, ry, n, col, w) {
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.clip();
  ctx.beginPath();
  for (let i = 1; i <= n; i++) {
    const bx = x + rx - (2 * rx) * i / (n + 1);
    ctx.moveTo(bx + 1.5, y - ry); ctx.quadraticCurveTo(bx - 1.5, y, bx + 1.5, y + ry);
  }
  ctx.strokeStyle = col; ctx.lineWidth = w || 0.8; ctx.stroke();
  ctx.restore();
}

Object.assign(Sprites, {
  // Bull ant (Myrmecia): red head and thorax, black hairy gaster, long yellow toothed jaws.
  ant(ctx, o, t) {
    legs6(ctx, 3, 18, '#5a2210', 1.9, t, o.moving, 1);
    // Gaster with segment bands and golden hairs
    fuzz(ctx, -14, 0, 9, 7.2, 22, 1.4, 'rgba(230,190,90,.7)', 0.5);
    ell(ctx, -14, 0, 9.5, 7.6, '#211814');
    bands(ctx, -14, 0, 9.5, 7.6, 3, 'rgba(120,90,60,.6)', 0.7);
    // Two waist nodes
    ell(ctx, -4.5, 0, 2.6, 2.4, '#a8361a');
    ell(ctx, -1.5, 0, 2.2, 2.8, '#b23c1e');
    // Thorax
    ell(ctx, 3.5, 0, 5.6, 3.4, '#c0401e');
    ell(ctx, 7.5, 0, 3.2, 3.9, '#c84620');
    // Head
    ell(ctx, 13, 0, 5.4, 5.6, '#c84a22');
    eye(ctx, 13.6, -4.4, 2.1, 1.5);
    eye(ctx, 13.6, 4.4, 2.1, 1.5);
    // Jaws with teeth
    const open = o.stingT > 0 ? 2 : 0;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(16.5, s * 2.2);
      ctx.quadraticCurveTo(22, s * (5 + open), 27, s * 1.6);
      ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = '#ecc848'; ctx.lineWidth = 1.7; ctx.stroke();
      for (let k = 0; k < 3; k++) plainLine(ctx, [20 + k * 2.2, s * (3.6 + open * 0.8 - k * 0.6), 20.6 + k * 2.2, s * (2.4 + open * 0.8 - k * 0.6)], '#7a5a10', 0.6);
    }
    // Elbowed feelers
    for (const s of [-1, 1]) line(ctx, [16, s * 3, 19, s * 10, 27, s * 9.5], '#4a1c0e', 1.2);
    if (o.stingT > 0) line(ctx, [-23, 0, -29, 0], '#e8c040', 1.5);
    if (o.carry) {
      ctx.save(); ctx.translate(29, 0); ctx.scale(0.8, 0.8);
      Sprites[o.carry](ctx, { stunned: true }, t);
      ctx.restore();
    }
  },

  // Blue-banded bee (Amegilla): fuzzy ginger thorax, black abdomen with shining blue bands, big eyes.
  bee(ctx, o, t) {
    const flap = Math.sin(t * (o.buzz ? 90 : 50)) * 0.35;
    legs6(ctx, 1, 11, '#2a2420', 1.3, t, false, 0.9);
    // Abdomen
    ell(ctx, -8, 0, 10, 7.4, '#161414');
    ctx.save();
    ctx.beginPath(); ctx.ellipse(-8, 0, 10, 7.4, 0, 0, TAU); ctx.clip();
    for (let k = 0; k < 4; k++) {
      const bx = -15.5 + k * 4.2;
      const gr = ctx.createLinearGradient(bx, -8, bx, 8);
      gr.addColorStop(0, '#9be6ff'); gr.addColorStop(0.5, '#3fb0e8'); gr.addColorStop(1, '#1a6a9a');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.ellipse(bx + 1, 0, 1.3, 8, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    fuzz(ctx, -8, 0, 10, 7.4, 26, 1, 'rgba(60,50,40,.6)', 0.5);
    // Fuzzy thorax
    fuzz(ctx, 2, 0, 6, 6, 30, 2, '#d8a860', 0.8);
    ell(ctx, 2, 0, 6.2, 6.2, '#c89a58');
    // Head and big eyes
    ell(ctx, 9.5, 0, 4, 5, '#221e1c');
    eye(ctx, 10, -3.4, 2.4, 2, '#5c8a5a');
    eye(ctx, 10, 3.4, 2.4, 2, '#5c8a5a');
    for (const s of [-1, 1]) line(ctx, [12.5, s * 1.6, 15, s * 5, 18, s * 6], '#141010', 1);
    if (o.load > 0) {
      for (const s of [-1, 1]) {
        ell(ctx, -3, s * 8.5, 1.8 + o.load, 1.6 + o.load * 0.6, '#f5a623');
        fuzz(ctx, -3, s * 8.5, 1.8 + o.load, 1.6 + o.load * 0.6, 10, 0.8, 'rgba(250,200,80,.8)', 0.5);
      }
    }
    for (const s of [-1, 1]) {
      veinWing(ctx, 3, s * 2, 15, 4.5, s * (2.7 - flap), 'rgba(200,200,215,.55)', 3);
      veinWing(ctx, 1, s * 2, 10, 3.2, s * (2.5 - flap), 'rgba(200,200,215,.45)', 2);
    }
    if (o.buzz) {
      for (let i = 0; i < 3; i++) {
        const r = 18 + ((t * 60 + i * 6) % 18);
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU);
        ctx.strokeStyle = 'rgba(255,210,63,' + (1 - (r - 18) / 18) * 0.7 + ')';
        ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
  },

  // Coastal peacock spider (Maratus speciosus) male: blue-green abdomen with orange bands,
  // orange side fringes, black legs with white tips on the third pair.
  spider(ctx, o, t) {
    const dance = o.dance > 0 || o.fan > 0;
    const w = o.moving ? Math.sin(t * 16) * 0.2 : 0;
    const angles = [0.55, 1.15, 1.9, 2.5];
    for (let i = 3; i >= 0; i--) for (const s of [-1, 1]) {
      let a = s * angles[i] + (i % 2 ? w : -w) * s, l = i === 2 ? 9.5 : i === 3 ? 8.5 : 7.5;
      if (dance && i === 2) { a = s * (1.55 + Math.sin(t * 12) * 0.45); l = 12; }
      tleg(ctx, 3, s * 1, a, l, l * 0.9, s * 0.45, '#241a14', 1.9);
      if (i === 2) {
        const kx = 3 + Math.cos(a) * l, ky = s + Math.sin(a) * l, b = a + s * 0.45;
        plainEll(ctx, kx + Math.cos(b) * l * 0.9, ky + Math.sin(b) * l * 0.9, 1.3, 1.3, '#f4f4f0');
      }
    }
    // Fan (raised flap) with long orange fringes
    const fr = dance ? 1 : 0;
    if (dance) {
      ctx.beginPath();
      for (let k = 0; k < 40; k++) {
        const a = Math.PI / 2 + (k / 39 - 0.5) * 3.6;
        ctx.moveTo(-8 + Math.cos(a) * 8, Math.sin(a) * 13);
        ctx.lineTo(-8 + Math.cos(a) * 11.5, Math.sin(a) * 17);
      }
      ctx.strokeStyle = '#ff9a2a'; ctx.lineWidth = 1.2; ctx.stroke();
    } else {
      for (const s of [-1, 1]) { ctx.beginPath(); for (let k = 0; k < 7; k++) { ctx.moveTo(-13 + k * 1.6, s * 5.5); ctx.lineTo(-13.5 + k * 1.6, s * 8); } ctx.strokeStyle = '#ff8c1a'; ctx.lineWidth = 0.8; ctx.stroke(); }
    }
    const ax = dance ? 8.5 : 7.2, ay = dance ? 13 : 6.2;
    ell(ctx, -8, 0, ax, ay, '#2a8aa8');
    ctx.save();
    ctx.beginPath(); ctx.ellipse(-8, 0, ax, ay, 0, 0, TAU); ctx.clip();
    // Iridescent blue-green with orange-red bands
    const gr = ctx.createLinearGradient(-16, -ay, 0, ay);
    gr.addColorStop(0, '#3fd0c8'); gr.addColorStop(0.5, '#2a7ad0'); gr.addColorStop(1, '#40c090');
    ctx.fillStyle = gr; ctx.fillRect(-17, -ay, 18, ay * 2);
    ctx.fillStyle = '#ff6a1a';
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(-8, k * ay * 0.36, ax, 0.9 + fr * 0.6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.ellipse(-10, -ay * 0.45, ax * 0.5, ay * 0.18, -0.3, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(-8, 0, ax, ay, 0, 0, TAU); ctx.strokeStyle = 'rgba(10,30,40,.5)'; ctx.lineWidth = 0.7; ctx.stroke();
    // Head and body (cephalothorax) with white stripes
    ell(ctx, 4, 0, 6.6, 5.6, '#2a2018');
    plainLine(ctx, [-1, -3.5, 8, -4], 'rgba(240,240,230,.7)', 0.8);
    plainLine(ctx, [-1, 3.5, 8, 4], 'rgba(240,240,230,.7)', 0.8);
    eye(ctx, 9.6, -2.3, 2.3, 2.3, '#0c0c0c');
    eye(ctx, 9.6, 2.3, 2.3, 2.3, '#0c0c0c');
    eye(ctx, 8.6, -4.8, 1, 1, '#0c0c0c');
    eye(ctx, 8.6, 4.8, 1, 1, '#0c0c0c');
    for (const s of [-1, 1]) ell(ctx, 11, s * 1, 1.4, 1, '#3a2a20');   // pedipalps
  },

  // Female peacock spider: brown and speckled, no bright colours.
  femaleSpider(ctx, o, t) {
    const angles = [0.55, 1.15, 1.9, 2.5];
    for (let i = 3; i >= 0; i--) for (const s of [-1, 1]) tleg(ctx, 3, s, s * angles[i], 7.5, 6.5, s * 0.45, '#7a6046', 1.8);
    ell(ctx, -8, 0, 7.8, 6.8, '#8f7250');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-8, 0, 7.8, 6.8, 0, 0, TAU); ctx.clip();
    const r = rng(9);
    for (let k = 0; k < 18; k++) plainEll(ctx, -15 + r() * 14, -6 + r() * 12, 0.8, 0.6, k % 2 ? '#5e4630' : '#c8a878');
    plainLine(ctx, [-14, 0, -2, 0], 'rgba(220,190,140,.6)', 1.2);
    ctx.restore();
    ell(ctx, 4, 0, 6.6, 5.6, '#6e5438');
    eye(ctx, 9.6, -2.3, 2.3, 2.3, '#0c0c0c');
    eye(ctx, 9.6, 2.3, 2.3, 2.3, '#0c0c0c');
    eye(ctx, 8.6, -4.8, 1, 1);
    eye(ctx, 8.6, 4.8, 1, 1);
    if (o.heart) {
      ctx.save(); ctx.rotate(-(o.angle || 0)); ctx.fillStyle = '#e8506a'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('♥', 0, -16 - Math.sin(t * 4) * 3); ctx.restore();
    }
  },

  // Blue skimmer (Orthetrum caledonicum) male: powder-blue body, big blue-green eyes, clear veined wings.
  dragonfly(ctx, o, t) {
    const flap = Math.sin(t * 40) * 0.12;
    const fem = o.female;
    for (let k = 7; k >= 0; k--) ell(ctx, -6 - k * 3.6, 0, 2.5, 2.3 - k * 0.08, k === 7 ? '#2d3e50' : fem ? (k % 2 ? '#c8a050' : '#b88a40') : (k % 2 ? '#9acdf0' : '#86bce4'));
    for (const s of [-1, 1]) {
      veinWing(ctx, 3, s * 1.5, 26, 4.2, s * (1.42 + flap), 'rgba(230,240,255,.5)', 4);
      veinWing(ctx, -2, s * 1.5, 26, 5.2, s * (1.78 + flap), 'rgba(230,240,255,.5)', 4);
    }
    // Wing spots near the tips (pterostigma)
    ell(ctx, 2, 0, 6, 4.6, fem ? '#9a7a40' : '#6f8fa6');
    eye(ctx, 9, -3.2, 3.9, 3.7, fem ? '#7a6a40' : '#3a7a9a');
    eye(ctx, 9, 3.2, 3.9, 3.7, fem ? '#7a6a40' : '#3a7a9a');
    if (o.dart > 0) for (let i = 0; i < 3; i++) line(ctx, [-36 - i * 6, -6 + i * 6, -48 - i * 6, -6 + i * 6], 'rgba(255,255,255,.6)', 2);
  },

  // Painted lady caterpillar: dark and spiny with a pale yellow side stripe. o.size grows it.
  plCaterpillar(ctx, o, t) {
    const s = o.size || 1, wig = o.moving ? 1 : 0;
    ctx.save(); ctx.scale(s, s);
    for (let k = 7; k >= 0; k--) {
      const x = -k * 4, y = Math.sin(k * 0.9 + t * 8) * wig * 1.2;
      // Prolegs underneath (back half) and true legs (front)
      if (k >= 3 && k <= 6) for (const sg of [-1, 1]) plainEll(ctx, x, y + sg * 3.8, 1.2, 1, '#2a201c');
      if (k <= 2 && k >= 1) for (const sg of [-1, 1]) plainLine(ctx, [x, y + sg * 3, x + 1, y + sg * 5], '#1a1210', 0.8);
      ell(ctx, x, y, 3.9, 3.7, k % 2 ? '#3a2e2a' : '#4a3a32');
      plainEll(ctx, x, y - 2.5, 1.9, 0.75, '#e0c870');
      plainEll(ctx, x, y + 2.5, 1.9, 0.75, '#e0c870');
      plainEll(ctx, x - 0.5, y, 0.8, 0.6, '#f0d890');
      // Branched spines
      ctx.beginPath();
      for (const sg of [-1, 1]) for (const dx of [-1.2, 1.2]) {
        ctx.moveTo(x + dx, y + sg * 2); ctx.lineTo(x + dx * 1.6, y + sg * 5.2);
        ctx.moveTo(x + dx * 1.4, y + sg * 4); ctx.lineTo(x + dx * 2.4, y + sg * 4.6);
      }
      ctx.strokeStyle = '#d8c070'; ctx.lineWidth = 0.5; ctx.stroke();
    }
    ell(ctx, 3.2, 0, 3.5, 3.5, '#1e1612');
    plainEll(ctx, 4.6, -1.6, 0.6, 0.6, '#ddd');
    plainEll(ctx, 4.6, 1.6, 0.6, 0.6, '#ddd');
    ctx.restore();
    if (o.munch) { ell(ctx, 6.5 * s, Math.sin(t * 20), 1.8, 1.6, '#7fc24a'); }
  },

  // Australian painted lady: orange wings with black tips, white spots, and blue eyespots on the hindwings.
  butterfly(ctx, o, t) {
    const f = o.landed ? 0.35 : 0.55 + Math.sin(t * 18) * 0.45;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(1, s * f);
      // Forewing
      ctx.beginPath();
      ctx.moveTo(2, 0); ctx.bezierCurveTo(10, 2, 16, 10, 13, 23); ctx.bezierCurveTo(7, 25, 1, 18, -2, 2); ctx.closePath();
      const g1 = ctx.createLinearGradient(0, 0, 12, 22);
      g1.addColorStop(0, '#b8501e'); g1.addColorStop(0.45, '#f08a30'); g1.addColorStop(1, '#e87a2a');
      ctx.fillStyle = g1; ctx.fill();
      ctx.strokeStyle = 'rgba(60,30,10,.6)'; ctx.lineWidth = 0.6; ctx.stroke();
      // Black tip with white spots
      ctx.save(); ctx.clip();
      ctx.beginPath(); ctx.moveTo(8, 9); ctx.quadraticCurveTo(15, 10, 16, 26); ctx.lineTo(4, 26); ctx.quadraticCurveTo(6, 16, 8, 9); ctx.fillStyle = '#1e1a18'; ctx.fill();
      ctx.restore();
      plainEll(ctx, 11, 19, 1.5, 1.4, '#fff'); plainEll(ctx, 8.5, 15.5, 1.2, 1, '#fff'); plainEll(ctx, 12.5, 14, 0.9, 0.8, '#fff');
      // Veins
      ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(1, 1); ctx.quadraticCurveTo(4 + k, 8, 3 + k * 3, 18 + k); }
      ctx.strokeStyle = 'rgba(80,40,10,.35)'; ctx.lineWidth = 0.4; ctx.stroke();
      // Hindwing
      ctx.beginPath();
      ctx.moveTo(-2, 1); ctx.bezierCurveTo(0, 12, -6, 19, -13, 16); ctx.bezierCurveTo(-16, 8, -10, 2, -4, 1); ctx.closePath();
      const g2 = ctx.createLinearGradient(-2, 0, -12, 16);
      g2.addColorStop(0, '#a84a1c'); g2.addColorStop(1, '#e07a2a');
      ctx.fillStyle = g2; ctx.fill(); ctx.strokeStyle = 'rgba(60,30,10,.6)'; ctx.stroke();
      for (let k = 0; k < 3; k++) { plainEll(ctx, -12 + k * 3, 13 - k * 1.2, 1.5, 1.5, '#1e1a18'); plainEll(ctx, -12 + k * 3, 13 - k * 1.2, 0.8, 0.8, '#5aa0f0'); }
      ctx.restore();
    }
    // Furry body
    ell(ctx, -3, 0, 9, 2, '#3a2c22');
    fuzz(ctx, 1, 0, 3, 1.8, 12, 0.8, 'rgba(200,170,120,.6)', 0.4);
    ell(ctx, 7, 0, 2.3, 2.3, '#2a221c');
    eye(ctx, 8, -1.3, 1, 1, '#3a3020'); eye(ctx, 8, 1.3, 1, 1, '#3a3020');
    for (const sg of [-1, 1]) { line(ctx, [8, sg, 16, sg * 5], '#2a221c', 0.7); plainEll(ctx, 16, sg * 5, 0.9, 0.9, '#2a221c'); }
    if (o.sip) { ctx.beginPath(); ctx.arc(11, 0, 2.5, -1.5, 1.5); ctx.strokeStyle = '#2a221c'; ctx.lineWidth = 0.8; ctx.stroke(); }
  },

  chrysalis(ctx, o, t) {
    line(ctx, [17, 0, 23, 0], '#8a7a5a', 1.5);
    ell(ctx, 4, 0, 12.5, 6.2, '#a89870');
    bands(ctx, 4, 0, 12.5, 6.2, 5, 'rgba(90,70,40,.5)', 0.7);
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) plainEll(ctx, -4 + i * 4, s * 3.6, 0.9, 0.7, '#e8d080');
    plainEll(ctx, 9, -2, 2, 0.9, 'rgba(255,240,200,.7)');
  },

  // Garden snail-shaped native: soft grey body, eye stalks, brown spiral shell.
  snail(ctx, o, t) {
    const s = o.size || 1;
    ctx.save(); ctx.scale(s, s);
    if (!o.sealed) {
      const st = Math.sin(t * 3) * 0.6;
      ell(ctx, 3, 0, 19, 6.5, '#8a7e72');
      ctx.save(); ctx.beginPath(); ctx.ellipse(3, 0, 19, 6.5, 0, 0, TAU); ctx.clip();
      const r = rng(4); for (let k = 0; k < 30; k++) plainEll(ctx, -14 + r() * 34, -6 + r() * 12, 0.9, 0.6, 'rgba(60,50,40,.35)');
      ctx.restore();
      for (const sg of [-1, 1]) {
        line(ctx, [17, sg * 2, 27, sg * (6.5 + st)], '#7a6e62', 1.7);
        eye(ctx, 27, sg * (6.5 + st), 1.6, 1.6, '#2a2018');
        line(ctx, [19, sg * 1, 22, sg * 3], '#7a6e62', 1.1);
      }
    }
    // Spiral shell
    const cx = -6, cy = 0;
    ell(ctx, cx, cy, 11, 9.5, '#9a6234');
    ctx.beginPath();
    for (let a = 0; a < TAU * 2.6; a += 0.2) {
      const rr = 9 * (1 - a / (TAU * 2.9));
      const x = cx - 1 + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.85;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#5a3416'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(250,220,170,.6)'; ctx.lineWidth = 0.6; ctx.stroke();
    plainEll(ctx, cx - 3, cy - 4, 3, 1.4, 'rgba(255,240,210,.45)', -0.4);
    if (o.sealed) ell(ctx, 5, 0, 4, 6, '#e8e0d0');
    ctx.restore();
  },

  // Dragonfly nymph: mottled brown, wing buds on the back, big eyes, folding jaw (the mask).
  nymph(ctx, o, t) {
    legs6(ctx, 1, 16, '#4a3a22', 1.7, t, o.moving, 1.1);
    for (let k = 5; k >= 0; k--) ell(ctx, -6 - k * 3.4, 0, 6.2 - k * 0.7, 6.6 - k * 0.8, k % 2 ? '#6b5530' : '#7a6238');
    for (let k = 0; k < 6; k++) plainEll(ctx, -6 - k * 3.4, 0, 0.9, 2.2, 'rgba(50,35,15,.4)');
    for (const s of [-1, 1]) line(ctx, [-25, 0, -30, s * 2.5], '#4a3a22', 1.5);
    ell(ctx, 0, 0, 6, 5.6, '#7a6238');
    ell(ctx, -6, -3, 7, 2.2, '#5b4a2a', 0.15);
    ell(ctx, -6, 3, 7, 2.2, '#5b4a2a', -0.15);
    ell(ctx, 8, 0, 5, 6.6, '#806840');
    eye(ctx, 9, -5, 2.8, 2.6, '#3a3020');
    eye(ctx, 9, 5, 2.8, 2.6, '#3a3020');
    if (o.grab) {
      const L = o.grab.len;
      line(ctx, [10, 0, 10 + L * 0.5, 2, 10 + L, 0], '#a08050', 2.6);
      line(ctx, [10 + L, 0, 14 + L, -3], '#5b4a2a', 1.6);
      line(ctx, [10 + L, 0, 14 + L, 3], '#5b4a2a', 1.6);
    }
    if (o.jet > 0) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(-32 - i * 8 - (t * 60) % 8, (i % 2 ? 3 : -3), 2 + i * 1.5, 0, TAU);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
  },

  // Termite worker: soft pale body you can almost see through, rounder head with no eyes.
  termiteWorker(ctx, o, t) {
    legs6(ctx, 0, 10, '#b09868', 1.1, t, o.moving, 1);
    ell(ctx, -8, 0, 7.4, 4.9, '#f3e9cf');
    bands(ctx, -8, 0, 7.4, 4.9, 4, 'rgba(170,140,90,.45)', 0.6);
    plainEll(ctx, -9, 0, 3.5, 1.6, 'rgba(160,120,70,.35)');   // gut showing through
    ell(ctx, 0, 0, 3.3, 3.4, '#ecdcb6');
    ell(ctx, 6, 0, 4.2, 3.8, '#dca458');
    plainEll(ctx, 9.5, -1.3, 1.4, 0.7, '#7a4a20'); plainEll(ctx, 9.5, 1.3, 1.4, 0.7, '#7a4a20');
    for (const s of [-1, 1]) { ctx.beginPath(); for (let k = 0; k < 6; k++) plainEll(ctx, 9.5 + k * 0.9, s * (2.2 + k * 0.7), 0.5, 0.5, '#c9b48a'); }
    if (o.carry) {
      ctx.save(); ctx.translate(14, 0);
      if (o.carry === 'mud') ell(ctx, 0, 0, 4.5, 4, '#6b4a2a');
      else { ctx.fillStyle = '#a07848'; ctx.fillRect(-5, -2, 10, 4); ctx.fillStyle = '#c89a68'; ctx.fillRect(-5, -2, 10, 1); }
      ctx.restore();
    }
  },

  // Bush fly: grey striped thorax, big red-brown eyes, bristles.
  bushFly(ctx, o, t) {
    const flap = o.landed ? 0.25 : Math.sin(t * 80) * 0.45;
    legs6(ctx, 0, 8, '#2a2a2a', 0.9, t, o.moving && o.landed, 1);
    for (const s of [-1, 1]) veinWing(ctx, 0, s * 1.5, 11, 3.4, s * (2.6 - flap), 'rgba(215,222,232,.55)', 3);
    ell(ctx, -5, 0, 5, 3.6, '#7a7464');
    plainEll(ctx, -5, 0, 3.6, 1, '#3d3d35');
    fuzz(ctx, -5, 0, 5, 3.6, 14, 0.9, '#222', 0.4);
    ell(ctx, 1, 0, 3.8, 3.5, '#8e8c7c');
    plainLine(ctx, [-1.5, -1.3, 3.5, -1.3], '#2e2e28', 1);
    plainLine(ctx, [-1.5, 1.3, 3.5, 1.3], '#2e2e28', 1);
    fuzz(ctx, 1, 0, 3.8, 3.5, 12, 0.9, '#222', 0.4);
    eye(ctx, 5, -2, 2, 2.1, '#8b2a1e');
    eye(ctx, 5, 2, 2, 2.1, '#8b2a1e');
    if (o.sip) line(ctx, [6, 0, 9, 0], '#4a4a40', 1.2);
  },

  // Peacock spiderling: small, brown, big eyes.
  spiderling(ctx, o, t) {
    const w = o.moving ? Math.sin(t * 16) * 0.2 : 0;
    const angles = [0.55, 1.15, 1.9, 2.5];
    for (let i = 3; i >= 0; i--) for (const s of [-1, 1]) tleg(ctx, 3, s, s * angles[i] + (i % 2 ? w : -w) * s, 6, 5, s * 0.45, '#7a5f40', 1.5);
    ell(ctx, -7, 0, 6.5, 5.6, '#a5865e');
    plainEll(ctx, -8, 0, 3, 2, 'rgba(220,190,140,.7)');
    ell(ctx, 4, 0, 6, 5.1, '#7a5f40');
    eye(ctx, 8.8, -2.2, 2.2, 2.2, '#0b0b0b');
    eye(ctx, 8.8, 2.2, 2.2, 2.2, '#0b0b0b');
    if (o.moult > 0) {
      ctx.globalAlpha = Math.min(1, o.moult);
      ctx.save(); ctx.translate(-22, 0);
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) leg(ctx, 3, 0, s * angles[i], 6, 5, s * 0.4, 'rgba(255,255,255,.8)', 1);
      plainEll(ctx, -7, 0, 6.5, 5.5, 'rgba(255,255,255,.55)');
      plainEll(ctx, 4, 0, 6, 5, 'rgba(255,255,255,.55)');
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  },

  queenAnt(ctx, o, t) {
    if (o.wings) {
      const flap = o.flying ? Math.sin(t * 50) * 0.3 : 0.4;
      for (const s of [-1, 1]) veinWing(ctx, 4, s * 1.5, 24, 5.5, s * (2.75 - flap), 'rgba(235,228,210,.55)', 4);
    }
    ctx.save(); ctx.scale(1.12, 1.12); Sprites.ant(ctx, o, t); ctx.restore();
    if (o.wings) {
      const flap = o.flying ? Math.sin(t * 50) * 0.3 : 0.4;
      for (const s of [-1, 1]) veinWing(ctx, 3, s * 1.5, 17, 4, s * (2.55 - flap), 'rgba(235,228,210,.5)', 3);
    }
  },

  // Female mosquito: striped legs, scaly abdomen, long biting mouthpart.
  mosquito(ctx, o, t) {
    const flap = Math.sin(t * 90) * 0.4;
    const fed = o.blood || 0;
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
      const a = s * (0.9 + i * 0.7);
      tleg(ctx, 0, 0, a, 6, 8, s * 0.35, '#3b3b3b', 0.8);
      const kx = Math.cos(a) * 6, ky = Math.sin(a) * 6;
      plainEll(ctx, kx, ky, 0.6, 0.6, '#eee');
    }
    for (const s of [-1, 1]) veinWing(ctx, 0, s * 1, 9, 2, s * (2.7 - flap), 'rgba(215,225,235,.55)', 2);
    ell(ctx, -5, 0, 5 + fed, 1.4 + fed * 1.8, fed > 0.2 ? '#b0202a' : '#4a4a4a');
    bands(ctx, -5, 0, 5 + fed, 1.4 + fed * 1.8, 4, 'rgba(240,240,240,.7)', 0.5);
    ell(ctx, 0.5, 0, 2, 1.8, '#3a3a3a');
    eye(ctx, 2.3, 0, 1.2, 1.4, '#1a1a1a');
    plainLine(ctx, [3, 0, 8.5, 0], '#2a2a2a', 0.7);
    for (const s of [-1, 1]) plainLine(ctx, [3, s * 0.4, 6, s * 1.8], '#3a3a3a', 0.4);
  },
});
