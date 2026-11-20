'use strict';
// London itself, so that the London levels and the London map look like London (js/art-london.js, js/art-london2.js):
// landmarks to stand on a skyline, rows of London houses, street things, the Tube's fittings, and a few birds.
// Everything here is painted into a level's background once, or drawn small on the map. What may be drawn where is
// in docs/facts.md (Landmarks in backgrounds): a landmark only where it stands or can really be seen from.

// ------------------------------------------------------------------ landmarks
// Each stands on (0, 0) and is drawn at about 1 px to 2.2 m (the Shard is 140 tall). c: its colour (a flat tint
// for a far skyline); d: the colour of its details (windows, a clock face). Up close a level passes real colours.
const LondonSky = {
  marks: {
    bigBen(ctx, c, d) {   // the Elizabeth Tower
      ctx.fillStyle = c; ctx.fillRect(-7, -64, 14, 64); ctx.fillRect(-9, -82, 18, 18);
      ctx.beginPath(); ctx.moveTo(-9, -82); ctx.lineTo(-5, -92); ctx.lineTo(5, -92); ctx.lineTo(9, -82); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-5, -92); ctx.lineTo(0, -108); ctx.lineTo(5, -92); ctx.fill(); ctx.fillRect(-0.6, -114, 1.2, 8);
      ctx.fillStyle = d; ctx.beginPath(); ctx.arc(0, -73, 6, 0, TAU); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -73); ctx.lineTo(0, -77.5); ctx.moveTo(0, -73); ctx.lineTo(3, -72); ctx.stroke();
      ctx.fillStyle = d; for (let k = 0; k < 5; k++) ctx.fillRect(-4.5, -58 + k * 11, 9, 1.2);
    },
    parliament(ctx, c, d) {   // the Palace of Westminster, with the Victoria Tower at the far end
      ctx.fillStyle = c; ctx.fillRect(-150, -26, 140, 26); ctx.fillRect(-170, -56, 22, 56);
      for (const x of [-172, -150]) { ctx.beginPath(); ctx.moveTo(x, -56); ctx.lineTo(x + 2, -66); ctx.lineTo(x + 4, -56); ctx.fill(); }
      for (let x = -140; x < -14; x += 18) { ctx.beginPath(); ctx.moveTo(x - 2, -26); ctx.lineTo(x, -36); ctx.lineTo(x + 2, -26); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(-86, -26); ctx.lineTo(-80, -52); ctx.lineTo(-74, -26); ctx.fill();
      ctx.fillStyle = d; for (let x = -144; x < -16; x += 9) ctx.fillRect(x, -20, 3, 12);
    },
    eye(ctx, c, d) {   // the London Eye
      ctx.strokeStyle = c; ctx.lineCap = 'round';
      ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, -64, 58, 0, TAU); ctx.stroke();
      ctx.lineWidth = 0.7; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(Math.cos(a) * 58, -64 + Math.sin(a) * 58); ctx.stroke(); }
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(-22, 0); ctx.moveTo(0, -64); ctx.lineTo(18, 0); ctx.stroke();
      ctx.fillStyle = d; for (let k = 0; k < 16; k++) { const a = (k + 0.5) / 16 * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 61, -64 + Math.sin(a) * 61, 3.4, 2.4, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -64, 4, 0, TAU); ctx.fill();
    },
    stPauls(ctx, c, d) {
      ctx.fillStyle = c; ctx.fillRect(-36, -28, 72, 28);
      for (const s of [-1, 1]) { ctx.fillRect(s * 30 - 5, -50, 10, 50); ctx.beginPath(); ctx.moveTo(s * 30 - 5, -50); ctx.lineTo(s * 30, -60); ctx.lineTo(s * 30 + 5, -50); ctx.fill(); }
      ctx.fillRect(-17, -46, 34, 18);
      ctx.beginPath(); ctx.ellipse(0, -46, 19, 24, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(-3.4, -80, 6.8, 12); ctx.beginPath(); ctx.arc(0, -82, 3, 0, TAU); ctx.fill(); ctx.fillRect(-0.6, -92, 1.2, 9); ctx.fillRect(-2.4, -89, 4.8, 1.2);
      ctx.fillStyle = d; for (let x = -15; x < 16; x += 4) ctx.fillRect(x, -44, 1.6, 14);
    },
    shard(ctx, c, d) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(17, 0); ctx.lineTo(3.4, -134); ctx.lineTo(1.4, -126); ctx.lineTo(-1, -140); ctx.lineTo(-3.6, -128); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = d; ctx.lineWidth = 0.7; for (const k of [-0.5, 0.15, 0.6]) { ctx.beginPath(); ctx.moveTo(17 * k, 0); ctx.lineTo(3 * k, -128); ctx.stroke(); }
    },
    gherkin(ctx, c, d) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.bezierCurveTo(-17, -40, -12, -70, 0, -82); ctx.bezierCurveTo(12, -70, 17, -40, 11, 0); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = d; ctx.lineWidth = 0.8; for (let k = -6; k < 8; k++) { ctx.beginPath(); ctx.moveTo(-20 + k * 7, 0); ctx.lineTo(8 + k * 7, -84); ctx.moveTo(20 + k * 7, 0); ctx.lineTo(-8 + k * 7, -84); ctx.stroke(); } ctx.restore();
    },
    walkie(ctx, c, d) {   // 20 Fenchurch Street: wider at the top than the bottom
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.lineTo(15, -60); ctx.quadraticCurveTo(14, -73, 6, -73); ctx.lineTo(-6, -73); ctx.quadraticCurveTo(-14, -73, -15, -60); ctx.closePath(); ctx.fill();
      ctx.fillStyle = d; for (let k = 0; k < 9; k++) ctx.fillRect(-12, -8 - k * 7, 24, 1);
    },
    cheesegrater(ctx, c, d) {   // the Leadenhall Building: a wedge
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(10, -102); ctx.lineTo(5, -102); ctx.lineTo(-10, -30); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = d; ctx.lineWidth = 0.7; for (let k = 1; k < 9; k++) { ctx.beginPath(); ctx.moveTo(10, -k * 11); ctx.lineTo(Math.max(-10, 10 - (102 - k * 11) * 0.21 - 5), -k * 11); ctx.stroke(); }
    },
    canary(ctx, c, d) {   // Canary Wharf: One Canada Square's pyramid between two flat-topped towers
      ctx.fillStyle = c; ctx.fillRect(-11, -98, 22, 98); ctx.beginPath(); ctx.moveTo(-11, -98); ctx.lineTo(0, -112); ctx.lineTo(11, -98); ctx.fill();
      ctx.fillRect(-36, -84, 18, 84); ctx.fillRect(18, -88, 18, 88); ctx.fillRect(-56, -52, 14, 52); ctx.fillRect(42, -60, 14, 60);
      ctx.fillStyle = d; for (let k = 0; k < 10; k++) { ctx.fillRect(-9, -92 + k * 9, 18, 1); ctx.fillRect(-34, -78 + k * 8, 14, 1); ctx.fillRect(20, -82 + k * 8, 14, 1); }
    },
    bt(ctx, c, d) {   // the BT Tower
      ctx.fillStyle = c; ctx.fillRect(-4, -62, 8, 62); ctx.fillRect(-7, -80, 14, 20); ctx.fillRect(-5.4, -88, 10.8, 8); ctx.fillRect(-0.7, -100, 1.4, 12);
      ctx.fillStyle = d; for (let k = 0; k < 5; k++) ctx.fillRect(-7, -78 + k * 4, 14, 1.4); ctx.fillRect(-5.4, -86, 10.8, 2);
    },
    towerBridge(ctx, c, d) {
      ctx.fillStyle = c;
      for (const s of [-1, 1]) {
        ctx.fillRect(s * 30 - 8, -56, 16, 56);
        ctx.beginPath(); ctx.moveTo(s * 30 - 8, -56); ctx.lineTo(s * 30, -74); ctx.lineTo(s * 30 + 8, -56); ctx.fill();
        for (const t of [-8, 8]) { ctx.fillRect(s * 30 + t - 1.6, -64, 3.2, 10); ctx.beginPath(); ctx.moveTo(s * 30 + t - 1.6, -64); ctx.lineTo(s * 30 + t, -70); ctx.lineTo(s * 30 + t + 1.6, -64); ctx.fill(); }
        ctx.fillRect(s * 30 - 11, -10, 22, 10);
      }
      ctx.fillRect(-22, -48, 44, 3); ctx.fillRect(-22, -42, 44, 2); ctx.fillRect(-84, -16, 168, 4);
      ctx.strokeStyle = d; ctx.lineWidth = 1.4;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 38, -52); ctx.quadraticCurveTo(s * 60, -18, s * 84, -18); ctx.stroke(); }
      ctx.fillStyle = d; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) ctx.fillRect(s * 30 - 2, -48 + k * 12, 4, 6);
    },
    battersea(ctx, c, d) {   // Battersea Power Station: a brick block with a pale chimney at each corner
      ctx.fillStyle = c; ctx.fillRect(-42, -30, 84, 30); ctx.fillRect(-48, -40, 22, 40); ctx.fillRect(26, -40, 22, 40);
      ctx.fillStyle = d; for (const x of [-42, -32, 32, 42]) { ctx.beginPath(); ctx.moveTo(x - 3.4, -40); ctx.lineTo(x - 2.4, -84); ctx.lineTo(x + 2.4, -84); ctx.lineTo(x + 3.4, -40); ctx.fill(); }
    },
    crystal(ctx, c) {   // the Crystal Palace transmitter: a lattice mast, like a small Eiffel Tower
      ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-5, -40, -2, -72); ctx.lineTo(-0.8, -100); ctx.moveTo(13, 0); ctx.quadraticCurveTo(5, -40, 2, -72); ctx.lineTo(0.8, -100); ctx.stroke();
      ctx.lineWidth = 0.8;
      for (let k = 0; k < 7; k++) { const y0 = -k * 11, y1 = -(k + 1) * 11, w0 = 13 - k * 1.7, w1 = 13 - (k + 1) * 1.7; ctx.beginPath(); ctx.moveTo(-w0, y0); ctx.lineTo(w1, y1); ctx.moveTo(w0, y0); ctx.lineTo(-w1, y1); ctx.moveTo(-w1, y1); ctx.lineTo(w1, y1); ctx.stroke(); }
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(0, -112); ctx.stroke();
    },
    allyMast(ctx, c, d) {   // Alexandra Palace's corner tower and the mast on it
      ctx.fillStyle = c; ctx.fillRect(-9, -30, 18, 30); ctx.fillRect(-11, -34, 22, 5);
      ctx.strokeStyle = c; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-6, -34); ctx.lineTo(-1, -92); ctx.moveTo(6, -34); ctx.lineTo(1, -92); ctx.stroke();
      ctx.lineWidth = 0.8; for (let k = 0; k < 6; k++) { const y = -40 - k * 9, w = 5.4 - k * 0.8; ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w, y); ctx.moveTo(-w, y); ctx.lineTo(w - 0.7, y - 9); ctx.stroke(); }
      for (const y of [-64, -78]) { ctx.beginPath(); ctx.moveTo(-9, y); ctx.lineTo(9, y); ctx.stroke(); }
      ctx.fillStyle = d; ctx.fillRect(-5, -24, 4, 9); ctx.fillRect(1, -24, 4, 9);
    },
    mosque(ctx, c, d) {   // the London Central Mosque: a gold dome and one slim minaret
      ctx.fillStyle = c; ctx.fillRect(-36, -16, 72, 16); ctx.fillRect(-22, -24, 44, 8);
      ctx.fillRect(44, -76, 6, 76); ctx.fillRect(42, -62, 10, 3); ctx.beginPath(); ctx.moveTo(44, -76); ctx.lineTo(47, -86); ctx.lineTo(50, -76); ctx.fill();
      ctx.fillStyle = d; ctx.beginPath(); ctx.ellipse(0, -24, 21, 17, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(-0.7, -47, 1.4, 7);
    },
    aviary(ctx, c, d) {   // the Zoo's Snowdon Aviary: netting slung between leaning poles
      ctx.fillStyle = d; ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(-24, -46); ctx.lineTo(-4, -16); ctx.lineTo(18, -52); ctx.lineTo(44, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(-24, -46); ctx.lineTo(-4, -16); ctx.lineTo(18, -52); ctx.lineTo(44, 0); ctx.moveTo(-30, 0); ctx.lineTo(-24, -46); ctx.moveTo(10, 0); ctx.lineTo(18, -52); ctx.stroke();
      ctx.lineWidth = 0.5; for (let k = -40; k < 44; k += 7) { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + 10, -40); ctx.stroke(); }
    },
    tate(ctx, c) { ctx.fillStyle = c; ctx.fillRect(-34, -22, 68, 22); ctx.fillRect(-4, -66, 8, 66); },   // Tate Modern: a brick block and one square chimney
    o2(ctx, c, d) {   // the O2: a white dome with yellow masts poking through
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 40, 15, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = d; ctx.lineWidth = 1.2; for (let k = 0; k < 6; k++) { const a = Math.PI + (k + 0.5) / 6 * Math.PI, x = Math.cos(a) * 28, y = Math.sin(a) * 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x * 1.25, y - 13); ctx.stroke(); }
    },
    palace(ctx, c, d) {   // Buckingham Palace's front
      ctx.fillStyle = c; ctx.fillRect(-40, -18, 80, 18); ctx.fillRect(-9, -22, 18, 22); ctx.beginPath(); ctx.moveTo(-9, -22); ctx.lineTo(0, -27); ctx.lineTo(9, -22); ctx.fill();
      ctx.fillStyle = d; for (let x = -36; x < 36; x += 6) ctx.fillRect(x, -14, 2.4, 9); ctx.fillRect(-0.6, -36, 1.2, 9); ctx.fillRect(0.6, -36, 6, 4);
    },
    ship(ctx, c, d) {   // the Cutty Sark, a tea clipper in dry dock at Greenwich
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-26, -8); ctx.lineTo(28, -8); ctx.lineTo(20, 0); ctx.lineTo(-20, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 1.2; for (const x of [-12, 2, 15]) { ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x, -40 + Math.abs(x) * 0.4); ctx.stroke(); }
      ctx.strokeStyle = d; ctx.lineWidth = 0.9; for (const x of [-12, 2, 15]) for (const y of [-16, -24, -32]) { ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.stroke(); }
    },
    palmHouse(ctx, c, d) {   // Kew's Palm House: a long glasshouse with a tall middle
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 36, 12, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -6, 14, 16, 0, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = d; ctx.lineWidth = 0.6; for (let x = -32; x < 34; x += 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x * 0.8, -11); ctx.stroke(); }
    },
    wembley(ctx, c, d) { ctx.strokeStyle = d; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -4, 22, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -3, 21, 7, 0, 0, TAU); ctx.fill(); },
  },
  mark(ctx, name, x, y, s, c, d) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); this.marks[name](ctx, c, d || c); ctx.restore(); },
  // A row of them along a skyline: [[name, x, scale], ...]
  line(ctx, list, y, c, d) { for (const [name, x, s] of list) this.mark(ctx, name, x, y, s || 1, c, d); },
  // Ordinary rooftops between the landmarks: terraces with chimney stacks, a church spire now and then
  roofs(ctx, x0, x1, y, c, seed) {
    const r = rng(seed); ctx.fillStyle = c;
    for (let x = x0 - 20; x < x1 + 40;) {
      const w = 46 + r() * 60, h = 22 + r() * 26;
      ctx.fillRect(x, y - h, w, h + 240);
      ctx.beginPath(); ctx.moveTo(x - 2, y - h); ctx.lineTo(x + w / 2, y - h - 12 - r() * 8); ctx.lineTo(x + w + 2, y - h); ctx.fill();
      for (let k = 0; k < 2; k++) { const cx = x + w * (0.2 + 0.55 * k); ctx.fillRect(cx, y - h - 20, 9, 14); for (let j = 0; j < 3; j++) ctx.fillRect(cx + j * 3, y - h - 24, 2, 5); }
      if (r() < 0.12) { ctx.fillRect(x + w * 0.4, y - h - 44, 8, 36); ctx.beginPath(); ctx.moveTo(x + w * 0.4 - 2, y - h - 44); ctx.lineTo(x + w * 0.4 + 4, y - h - 78); ctx.lineTo(x + w * 0.4 + 10, y - h - 44); ctx.fill(); }
      x += w;
    }
  },
};

// ------------------------------------------------------------------ houses and street things
const LondonStreet = {
  STOCK: '#b99b62', STUCCO: '#ece6d6',
  // A terrace of London houses standing on `base`, from x0 to x1. o: { side: 'back' | 'front', storeys (2 or 3),
  // w (a house's width), brick (STOCK by default; STUCCO gives a Regency terrace with columns), night (some windows
  // lit, the rest dark), seed, roof: 'slate' | 'parapet', dim (0..1: how far it is washed toward `haze`), haze }.
  terrace(ctx, x0, x1, base, o) {
    o = o || {};
    const r = rng(o.seed || 5), w = o.w || 124, st = o.storeys || 2, sh = o.sh || 62, H = st * sh + 10, top = base - H, stucco = o.brick === this.STUCCO;
    const tone = (col) => (o.dim ? mixHex(col, o.haze || '#c8d4e0', o.dim) : col), night = !!o.night;
    const brick = o.brick || this.STOCK;
    if (!(o.roof === 'parapet' || stucco)) {   // one long slate roof, hipped at the two ends
      const n = Math.ceil((x1 - x0) / w), xe = x0 + n * w;
      ctx.fillStyle = tone(night ? '#1c2030' : '#4a4e5c'); ctx.beginPath(); ctx.moveTo(x0 - 3, top + 1); ctx.lineTo(x0 + 8, top - 30); ctx.lineTo(xe - 8, top - 30); ctx.lineTo(xe + 3, top + 1); ctx.fill();
      ctx.strokeStyle = tone(night ? 'rgba(0,0,0,.3)' : 'rgba(20,24,34,.3)'); ctx.lineWidth = 1; for (let y = top - 24; y < top; y += 6) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(xe, y); ctx.stroke(); }
    }
    for (let x = x0; x < x1; x += w) {
      const b = mixHex(brick, r() < 0.5 ? '#8a6a3a' : '#d8c08a', stucco ? 0 : r() * 0.22);
      ctx.fillStyle = tone(night ? mixHex(b, '#101830', 0.62) : b); ctx.fillRect(x, top, w, H);
      if (!stucco) { ctx.strokeStyle = tone(night ? 'rgba(0,0,0,.25)' : 'rgba(90,60,30,.22)'); ctx.lineWidth = 1; for (let y = top + 6; y < base; y += 8) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); } }
      ctx.fillStyle = tone(night ? 'rgba(0,0,0,.35)' : 'rgba(60,40,20,.28)'); ctx.fillRect(x + w - 2, top, 2, H);   // the party wall
      // sash windows, two to a floor, six panes over six
      for (let f = 0; f < st; f++) for (let k = 0; k < 2; k++) {
        const wx = x + w * (0.2 + 0.42 * k), wy = top + 14 + f * sh, ww = w * 0.2, wh = sh * 0.62, lit = night && r() < 0.42;
        if (o.side === 'front' && f === st - 1 && k === 0) continue;   // the front door goes here
        if (!stucco) { ctx.fillStyle = tone(night ? '#5a2c22' : '#a8523a'); ctx.fillRect(wx - 3, wy - 5, ww + 6, 5); }
        ctx.fillStyle = tone(night ? '#c8c4b8' : '#f4f0e4'); ctx.fillRect(wx - 2, wy - 1, ww + 4, wh + 4);
        ctx.fillStyle = lit ? (r() < 0.25 ? '#a8d0f0' : '#ffdc8a') : tone(night ? '#141a2a' : '#56646e'); ctx.fillRect(wx, wy + 1, ww, wh);
        ctx.fillStyle = tone(night ? '#c8c4b8' : '#f4f0e4'); ctx.fillRect(wx, wy + wh / 2, ww, 2); ctx.fillRect(wx + ww / 2 - 0.8, wy + 1, 1.6, wh);
        if (!lit && !night) { ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(wx + 2, wy + 3, ww * 0.3, wh * 0.36); }
      }
      if (o.side === 'front') {   // a front door with a fanlight and a number, and a bay window beside it
        const dx = x + w * 0.2, dw = w * 0.2, dy = base - sh + 12;
        ctx.fillStyle = tone(night ? '#c8c4b8' : '#f4f0e4'); ctx.fillRect(dx - 4, dy - 10, dw + 8, sh - 2);
        ctx.fillStyle = ['#1e3a6a', '#7a1e24', '#1e4a34', '#22222a', '#c8a020'][Math.floor(r() * 5)]; ctx.fillRect(dx, dy + 6, dw, sh - 18);
        ctx.fillStyle = night ? '#ffdc8a' : '#8aa0b0'; ctx.beginPath(); ctx.ellipse(dx + dw / 2, dy + 5, dw / 2, 9, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#d8c060'; ctx.font = 'bold 9px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(String(2 + Math.floor(r() * 90)), dx + dw / 2, dy + 20);
        ctx.fillStyle = tone(night ? '#8a8a84' : '#c8c4b8'); ctx.fillRect(dx - 8, base - 6, dw + 16, 6);
        const bx = x + w * 0.56, bw = w * 0.34;   // the bay
        ctx.fillStyle = tone(night ? '#c8c4b8' : '#f4f0e4'); ctx.beginPath(); ctx.moveTo(bx - 4, base); ctx.lineTo(bx - 4, base - sh + 8); ctx.lineTo(bx + bw + 4, base - sh + 8); ctx.lineTo(bx + bw + 4, base); ctx.fill();
        const lit = night && r() < 0.6; ctx.fillStyle = lit ? '#ffdc8a' : (night ? '#141a2a' : '#56646e'); for (let k = 0; k < 3; k++) ctx.fillRect(bx + k * bw / 3 + 1.5, base - sh + 14, bw / 3 - 3, sh - 30);
        ctx.fillStyle = tone(night ? '#3a3e4a' : '#5a5e6a'); ctx.beginPath(); ctx.moveTo(bx - 6, base - sh + 8); ctx.lineTo(bx + 4, base - sh - 2); ctx.lineTo(bx + bw - 4, base - sh - 2); ctx.lineTo(bx + bw + 6, base - sh + 8); ctx.fill();
      } else if (o.side === 'back') {   // a back extension, a drainpipe, a back door
        const ex = r() < 0.5 ? x + 4 : x + w * 0.54, ew = w * 0.4, eh = sh * 0.9;
        ctx.fillStyle = tone(night ? mixHex(b, '#101830', 0.7) : mixHex(b, '#5a4020', 0.12)); ctx.fillRect(ex, base - eh, ew, eh);
        ctx.fillStyle = tone(night ? '#2a2e3a' : '#5a5e6a'); ctx.beginPath(); ctx.moveTo(ex - 3, base - eh); ctx.lineTo(ex + ew + 3, base - eh - 12); ctx.lineTo(ex + ew + 3, base - eh); ctx.fill();
        ctx.fillStyle = night && r() < 0.5 ? '#ffdc8a' : tone(night ? '#141a2a' : '#56646e'); ctx.fillRect(ex + ew * 0.2, base - eh + 14, ew * 0.5, eh * 0.4);
        ctx.fillStyle = tone(night ? '#1a1a22' : '#2a2a30'); ctx.fillRect(x + w * 0.5 - 1.5, top, 3, H);
      }
      if (stucco) {   // a Regency front: tall columns and a cornice
        ctx.fillStyle = tone('#f8f4e8'); for (let k = 0; k < 4; k++) ctx.fillRect(x + 6 + k * (w - 16) / 3, top + sh * 0.2, 5, H - sh * 1.2);
        ctx.fillStyle = tone('#d8d0bc'); ctx.fillRect(x, top + sh * 0.16, w, 4); ctx.fillRect(x, base - sh, w, 3);
      }
      // the roof and the chimney stack on the party wall, with its row of pots
      const ry = top;
      if (o.roof === 'parapet' || stucco) { ctx.fillStyle = tone(night ? '#8a8a84' : (stucco ? '#f8f4e8' : '#d8d0bc')); ctx.fillRect(x - 1, ry - 5, w + 2, 6); }
      const cy = ry - (o.roof === 'parapet' || stucco ? 4 : 28), cx = x + w - 15;
      ctx.fillStyle = tone(night ? mixHex(b, '#101830', 0.7) : mixHex(b, '#5a4020', 0.2)); ctx.fillRect(cx, cy - 22, 30, 24);
      ctx.fillStyle = tone(night ? '#8a8a84' : '#d8d0bc'); ctx.fillRect(cx - 2, cy - 24, 34, 3);
      ctx.fillStyle = tone(night ? '#6a3a26' : '#c06a3a'); for (let k = 0; k < 5; k++) { ctx.fillRect(cx + 2 + k * 5.6, cy - 33, 3.6, 9); ctx.fillRect(cx + 1.4 + k * 5.6, cy - 34, 4.8, 2); }
      if (!stucco && r() < 0.5) { ctx.strokeStyle = tone(night ? '#5a5a66' : '#3a3a40'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 24, cy - 2); ctx.lineTo(x + 24, cy - 26); ctx.moveTo(x + 16, cy - 22); ctx.lineTo(x + 32, cy - 22); ctx.moveTo(x + 18, cy - 17); ctx.lineTo(x + 30, cy - 17); ctx.stroke(); }
    }
  },
  // A red pillar box standing at (x, y)
  pillarBox(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-9, -7, 18, 7);
    const g = ctx.createLinearGradient(-9, 0, 9, 0); g.addColorStop(0, '#a81812'); g.addColorStop(0.4, '#e02a22'); g.addColorStop(1, '#8a120e');
    ctx.fillStyle = g; ctx.fillRect(-8.5, -50, 17, 43);
    ctx.beginPath(); ctx.ellipse(0, -50, 10.5, 4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -53, 8.5, 4.4, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#6a0e0a'; ctx.fillRect(-10.5, -50, 21, 2);
    ctx.fillStyle = '#141414'; ctx.fillRect(-5.4, -42, 10.8, 2.6);
    ctx.fillStyle = '#f4f0e4'; ctx.fillRect(-4.4, -36, 8.8, 8); ctx.fillStyle = '#d8b040'; ctx.fillRect(-2.4, -24, 4.8, 3.4);
    ctx.restore();
  },
  // A red telephone kiosk (the K6), lit inside at night
  phoneBox(ctx, x, y, s, night) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-15, -4, 30, 4);
    ctx.fillStyle = '#d4241c'; ctx.fillRect(-14, -78, 28, 74);
    ctx.beginPath(); ctx.moveTo(-14, -78); ctx.quadraticCurveTo(0, -92, 14, -78); ctx.fill();
    ctx.fillStyle = '#f4f0e4'; ctx.fillRect(-10.5, -77, 21, 6); ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TELEPHONE', 0, -72.4);
    ctx.fillStyle = '#d8b040'; ctx.fillRect(-2, -84, 4, 3);
    ctx.fillStyle = night ? '#fff2c0' : '#bcd4de';
    for (let row = 0; row < 8; row++) for (let col = 0; col < 3; col++) ctx.fillRect(-10.5 + col * 7.3, -68 + row * 7.6, col === 1 ? 6.4 : 6, 6.2);
    ctx.fillStyle = '#9a1812'; ctx.fillRect(-14, -78, 2, 74); ctx.fillRect(12, -78, 2, 74);
    ctx.restore();
  },
  // A street name plate: white, black capitals, the postal district in red
  streetSign(ctx, x, y, name, district) {
    ctx.save(); ctx.font = 'bold 13px sans-serif';
    const w = ctx.measureText(name).width + (district ? ctx.measureText(' ' + district).width : 0) + 18;
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x - w / 2 - 2, y - 13, w + 4, 26);
    ctx.fillStyle = '#f8f6ee'; ctx.fillRect(x - w / 2, y - 11, w, 22);
    ctx.textAlign = 'left'; ctx.fillStyle = '#141414'; ctx.fillText(name, x - w / 2 + 9, y + 5);
    if (district) { ctx.fillStyle = '#c8201c'; ctx.fillText(' ' + district, x - w / 2 + 9 + ctx.measureText(name).width, y + 5); }
    ctx.restore();
  },
  // An old cast-iron street lamp, its lantern at the top
  lamp(ctx, x, y, h, lit) {
    ctx.fillStyle = '#16161a'; ctx.fillRect(x - 2.4, y - h, 4.8, h); ctx.fillRect(x - 6, y - 10, 12, 10); ctx.fillRect(x - 4, y - 26, 8, 4); ctx.fillRect(x - 12, y - h + 14, 24, 2.4);
    if (lit) { const g = ctx.createRadialGradient(x, y - h - 12, 3, x, y - h - 12, 150); g.addColorStop(0, 'rgba(255,224,150,.85)'); g.addColorStop(0.25, 'rgba(255,214,130,.26)'); g.addColorStop(1, 'rgba(255,214,130,0)'); ctx.fillStyle = g; ctx.fillRect(x - 150, y - h - 162, 300, 300); }
    ctx.fillStyle = lit ? '#fff0c0' : '#c8d8e0'; ctx.beginPath(); ctx.moveTo(x - 6, y - h); ctx.lineTo(x - 9, y - h - 20); ctx.lineTo(x + 9, y - h - 20); ctx.lineTo(x + 6, y - h); ctx.fill();
    ctx.fillStyle = '#16161a'; ctx.beginPath(); ctx.moveTo(x - 11, y - h - 20); ctx.lineTo(x, y - h - 30); ctx.lineTo(x + 11, y - h - 20); ctx.fill(); ctx.fillRect(x - 0.8, y - h - 36, 1.6, 7);
  },
  // Black park railings with spear tops
  railings(ctx, x0, x1, y, h) {
    ctx.fillStyle = '#16161a'; ctx.fillRect(x0, y - h + 8, x1 - x0, 3); ctx.fillRect(x0, y - 12, x1 - x0, 3);
    for (let x = x0; x <= x1; x += 9) { ctx.fillRect(x - 1, y - h, 2, h); ctx.beginPath(); ctx.moveTo(x - 2.4, y - h); ctx.lineTo(x, y - h - 7); ctx.lineTo(x + 2.4, y - h); ctx.fill(); }
    for (let x = x0; x <= x1; x += 108) { ctx.fillRect(x - 3, y - h - 4, 6, h + 4); ctx.beginPath(); ctx.arc(x, y - h - 7, 4, 0, TAU); ctx.fill(); }
  },
  // Three wheelie bins in a row
  bins(ctx, x, y, night) {
    [['#2a2a2e', '#2a2a2e'], ['#2a2a2e', '#3a7a3a'], ['#2a4a8a', '#2a4a8a']].forEach(([body, lid], k) => {
      const bx = x + k * 30; ctx.fillStyle = night ? mixHex(body, '#000000', 0.4) : body; ctx.beginPath(); ctx.moveTo(bx - 11, y - 38); ctx.lineTo(bx + 11, y - 38); ctx.lineTo(bx + 9, y - 3); ctx.lineTo(bx - 9, y - 3); ctx.fill();
      ctx.fillStyle = night ? mixHex(lid, '#000000', 0.4) : lid; ctx.fillRect(bx - 13, y - 43, 26, 6); ctx.fillStyle = '#101010'; ctx.beginPath(); ctx.arc(bx + 7, y - 2, 3, 0, TAU); ctx.fill();
    });
  },
  // A black cab from the side, standing on (x, y), about 110 long at s = 1
  cab(ctx, x, y, s, face, lit) {
    ctx.save(); ctx.translate(x, y); ctx.scale((face < 0 ? -1 : 1) * (s || 1), s || 1);
    ctx.fillStyle = '#16161a'; ctx.beginPath(); ctx.moveTo(-54, -10); ctx.lineTo(-54, -30); ctx.quadraticCurveTo(-50, -38, -36, -40); ctx.lineTo(-26, -58); ctx.quadraticCurveTo(-22, -62, -12, -62); ctx.lineTo(22, -62); ctx.quadraticCurveTo(30, -62, 34, -52); ctx.lineTo(40, -38); ctx.quadraticCurveTo(54, -36, 55, -26); ctx.lineTo(55, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(190,220,240,.8)'; ctx.beginPath(); ctx.moveTo(-22, -56); ctx.lineTo(-2, -56); ctx.lineTo(-2, -40); ctx.lineTo(-30, -40); ctx.fill(); ctx.fillRect(2, -56, 22, 16);
    ctx.fillStyle = lit ? '#ffd23f' : '#b89a30'; ctx.fillRect(-10, -69, 20, 7); ctx.fillStyle = '#16161a'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.save(); ctx.scale(face < 0 ? -1 : 1, 1); ctx.fillText('TAXI', 0, -63.4); ctx.restore();
    ctx.fillStyle = '#e8e8e0'; ctx.fillRect(-55, -16, 110, 2);
    for (const wx of [-34, 34]) { ctx.fillStyle = '#101010'; ctx.beginPath(); ctx.arc(wx, -10, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#9a9aa0'; ctx.beginPath(); ctx.arc(wx, -10, 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#fff6c8'; ctx.fillRect(51, -30, 4, 5); ctx.fillStyle = '#c8281e'; ctx.fillRect(-55, -30, 3, 5);
    ctx.restore();
  },
  // A ring-necked parakeet on the wing: bright green, a long pointed tail, a red beak. flap: -1..1
  parakeet(ctx, x, y, s, face, flap) {
    ctx.save(); ctx.translate(x, y); ctx.scale((face < 0 ? -1 : 1) * (s || 1), s || 1);
    ctx.fillStyle = '#4aa83a'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-24, 2.4); ctx.lineTo(-6, 3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.2, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(8, -1.6, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a8a2e'; ctx.beginPath(); ctx.moveTo(-2, -1); ctx.lineTo(-6, -1 - 13 * flap); ctx.lineTo(5, -1); ctx.fill();
    ctx.fillStyle = '#d8402a'; ctx.beginPath(); ctx.moveTo(11, -2.4); ctx.lineTo(14, -0.6); ctx.lineTo(10.6, 0.4); ctx.fill();
    ctx.fillStyle = '#101010'; ctx.beginPath(); ctx.arc(8.6, -2.4, 0.7, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // A feral pigeon on the ground
  pigeon(ctx, x, y, s, face, peck) {
    ctx.save(); ctx.translate(x, y); ctx.scale((face < 0 ? -1 : 1) * (s || 1), s || 1);
    ctx.strokeStyle = '#c86a5a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, -4); ctx.lineTo(-1, 0); ctx.moveTo(2, -4); ctx.lineTo(2, 0); ctx.stroke();
    ctx.fillStyle = '#8a8e98'; ctx.beginPath(); ctx.ellipse(0, -8, 9, 5.4, -0.15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a5e68'; ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(-15, -6); ctx.lineTo(-5, -5); ctx.fill(); ctx.fillRect(-4, -10, 7, 1.4); ctx.fillRect(-3, -7.6, 6, 1.4);
    const hx = peck ? 9 : 7, hy = peck ? -5 : -14;
    ctx.fillStyle = '#6a8a7a'; ctx.beginPath(); ctx.ellipse(6, -10, 3, 4, 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a7e88'; ctx.beginPath(); ctx.arc(hx, hy, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.moveTo(hx + 2.4, hy - 0.6); ctx.lineTo(hx + 5.6, hy + 0.6); ctx.lineTo(hx + 2.4, hy + 1.2); ctx.fill();
    ctx.fillStyle = '#e08030'; ctx.beginPath(); ctx.arc(hx + 0.8, hy - 0.8, 0.8, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // A grey squirrel sitting up
  squirrel(ctx, x, y, s, face) {
    ctx.save(); ctx.translate(x, y); ctx.scale((face < 0 ? -1 : 1) * (s || 1), s || 1);
    ctx.fillStyle = '#9a9a9e'; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.bezierCurveTo(-22, -4, -22, -30, -8, -28); ctx.bezierCurveTo(-14, -18, -8, -10, -4, -6); ctx.fill();
    ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.ellipse(0, -8, 6.4, 8.4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(3, -19, 4.6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, -22); ctx.lineTo(2, -27); ctx.lineTo(4.4, -23); ctx.fill();
    ctx.fillStyle = '#e8e4dc'; ctx.beginPath(); ctx.ellipse(2.4, -7, 3, 5.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#101010'; ctx.beginPath(); ctx.arc(4.6, -19.6, 0.9, 0, TAU); ctx.fill();
    ctx.restore();
  },
};

// ------------------------------------------------------------------ the Tube's fittings
const LondonTube = {
  RED: '#dc241f', BLUE: '#0019a8',
  // The roundel: a red ring, a blue bar across it, the station's name on the bar
  roundel(ctx, x, y, r, name) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r * 1.06, 0, TAU); ctx.fill();
    ctx.strokeStyle = this.RED; ctx.lineWidth = r * 0.34; ctx.beginPath(); ctx.arc(0, 0, r * 0.83, 0, TAU); ctx.stroke();
    ctx.font = 'bold ' + Math.round(r * 0.34) + 'px sans-serif';
    const w = Math.max(r * 2.5, name ? ctx.measureText(name).width + r * 0.5 : 0);
    ctx.fillStyle = this.BLUE; ctx.fillRect(-w / 2, -r * 0.25, w, r * 0.5);
    if (name) { ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, 0, r * 0.02); }
    ctx.restore();
  },
  // A Way out sign: black on yellow
  wayOut(ctx, x, y, left) {
    ctx.fillStyle = '#16161a'; ctx.fillRect(x - 62, y - 17, 124, 34); ctx.fillStyle = '#ffd329'; ctx.fillRect(x - 60, y - 15, 120, 30);
    ctx.fillStyle = '#141414'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(left ? '← Way out' : 'Way out →', x, y + 1); ctx.textBaseline = 'alphabetic';
  },
  // The next-train board: orange dots on black
  board(ctx, x, y, lines) {
    ctx.fillStyle = '#3a3a40'; ctx.fillRect(x - 3, y - 60, 6, 40);
    ctx.fillStyle = '#101010'; ctx.fillRect(x - 118, y - 22, 236, 14 + lines.length * 17);
    ctx.fillStyle = '#ff9a1e'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
    lines.forEach(([a, b], i) => { ctx.textAlign = 'left'; ctx.fillText(a, x - 108, y - 4 + i * 17); ctx.textAlign = 'right'; ctx.fillText(b, x + 108, y - 4 + i * 17); });
  },
  // A strip of the line's stations: a coloured line, a tick for each, this station ringed
  diagram(ctx, x, y, w, stations, here, col) {
    ctx.fillStyle = '#f4f2ea'; ctx.fillRect(x, y - 16, w, 40); ctx.fillStyle = col; ctx.fillRect(x + 14, y - 2, w - 28, 5);
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    stations.forEach((s, i) => {
      const sx = x + 24 + i * (w - 48) / (stations.length - 1);
      ctx.fillStyle = col; ctx.fillRect(sx - 1.5, y - 8, 3, 8);
      if (s === here) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, y + 0.5, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#141414'; ctx.lineWidth = 1.6; ctx.stroke(); }
      ctx.fillStyle = '#141414'; ctx.fillText(s, sx, y + 18);
    });
  },
};

// ------------------------------------------------------------------ things that come and go (the movers of js/london.js)
const LondonLife = {
  parakeets(ctx, mv, t) { for (let k = 0; k < 6; k++) LondonStreet.parakeet(ctx, mv.x - mv.dir * (k * 26 + (k % 2) * 8), mv.y + ((k * 37) % 5) * 9 + Math.sin(t * 3 + k) * 4, 1.25, mv.dir, Math.sin(t * 22 + k * 1.3)); },
  pigeons(ctx, mv, t) {
    for (let k = 0; k < mv.n; k++) {
      if (!mv.up) LondonStreet.pigeon(ctx, mv.x + (k - (mv.n - 1) / 2) * 26, mv.y, 1.3, k % 2 ? -1 : 1, Math.sin(t * 2.3 + k * 2) > 0.4);
      else if (mv.up < 1.5) { const x = mv.x + (k - 1) * 26 - mv.up * (90 + k * 30), y = mv.y - mv.up * (120 + k * 20); ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#8a8e98'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.6, -0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a6e78'; const f = Math.sin(t * 30 + k) * 11; ctx.beginPath(); ctx.moveTo(-5, -1); ctx.lineTo(0, -1 - f); ctx.lineTo(5, -1); ctx.fill(); ctx.restore(); }
    }
  },
  jet(ctx, mv, t) {   // a jet seen from below and to one side, wheels down
    ctx.save(); ctx.translate(mv.x, mv.y); ctx.rotate(-0.05);
    ctx.fillStyle = '#e8ecf0'; ctx.beginPath(); ctx.moveTo(-46, 0); ctx.quadraticCurveTo(-52, -5, -40, -6); ctx.lineTo(34, -6); ctx.lineTo(44, -2); ctx.lineTo(34, 3); ctx.lineTo(-38, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c8d0d8'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(18, 16); ctx.lineTo(24, 14); ctx.lineTo(8, -2); ctx.fill();
    ctx.fillStyle = '#c0282a'; ctx.beginPath(); ctx.moveTo(34, -6); ctx.lineTo(46, -22); ctx.lineTo(50, -22); ctx.lineTo(44, -4); ctx.fill();
    ctx.fillStyle = '#5a6068'; ctx.fillRect(-2, 6, 9, 5); ctx.fillRect(-30, 3, 2, 6); ctx.fillRect(4, 10, 2, 5);
    if (Math.sin(t * 6) > 0.6) { ctx.fillStyle = '#ff4030'; ctx.beginPath(); ctx.arc(0, 5, 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
};
