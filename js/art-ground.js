'use strict';
// The places, repainted with real ground (ground.js): sand, soil, grass, water and leaf litter,
// with trees and shrubs that sit on the ground with a shadow.

// Grass tree (Xanthorrhoea) from above: black stump, a dense skirt of needle leaves, sometimes a flower spike.
drawGrassTree = function (ctx, x, y, r, seed) {
  const rr = rng(seed || Math.round(x + y));
  Ground.contact(ctx, x, y, r * 1.1, r * 0.9, 0.4);
  const [sx, sy] = Ground.SUN;
  ctx.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    const q = rng(seed || Math.round(x + y));
    for (let i = 0; i < 110; i++) {
      const a = q() * TAU, l = r * (0.55 + q() * 0.5), lit = Math.cos(a) * sx + Math.sin(a) * sy > 0.1;
      const bend = (q() - 0.5) * r * 0.25;
      ctx.strokeStyle = pass ? (lit ? ['#8aa84a', '#9ab858', '#7a9a40'][i % 3] : ['#4a6a2a', '#56782e', '#3e5a24'][i % 3]) : 'rgba(10,15,5,.25)';
      ctx.lineWidth = pass ? 1.3 : 2;
      ctx.beginPath(); ctx.moveTo(x + (pass ? 0 : 2), y + (pass ? 0 : 3));
      ctx.quadraticCurveTo(x + Math.cos(a) * l * 0.5 - Math.sin(a) * bend, y + Math.sin(a) * l * 0.5 + Math.cos(a) * bend, x + Math.cos(a) * l + (pass ? 0 : 2), y + Math.sin(a) * l + (pass ? 0 : 3));
      ctx.stroke();
    }
  }
  ell(ctx, x, y, r * 0.22, r * 0.2, '#1e1814', 0, 'bark');
  if (rr() < 0.5) { line(ctx, [x, y, x + r * 0.2, y - r * 0.9], '#5a4a30', 3); ell(ctx, x + r * 0.2, y - r * 0.9, 4, 7, '#c8a050', 0.2, 'grain'); }
};

// Banksia from above: a rosette of long serrated leaves and upright cones.
drawBanksia = function (ctx, x, y, r, rand) {
  Ground.contact(ctx, x, y, r * 1.2, r, 0.45);
  const [sx, sy] = Ground.SUN;
  // Leaves: long, narrow, saw-edged, grey-green on top
  for (let i = 0; i < 24; i++) {
    const a = rand() * TAU, l = r * (0.7 + rand() * 0.5), w = 4 + rand() * 2.5;
    const lit = Math.cos(a) * sx + Math.sin(a) * sy > 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (let s = 0; s <= l; s += 4) ctx.lineTo(s, -w * (s < l * 0.85 ? 1 : (l - s) / (l * 0.15)) + (Math.floor(s / 4) % 2 ? 1.2 : 0));
    for (let s = l; s >= 0; s -= 4) ctx.lineTo(s, w * (s < l * 0.85 ? 1 : (l - s) / (l * 0.15)) - (Math.floor(s / 4) % 2 ? 1.2 : 0));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -w, 0, w);
    const base = lit ? '#6a8a4a' : '#4a6a34';
    g.addColorStop(0, tint(base, 0.25)); g.addColorStop(0.5, base); g.addColorStop(1, tint(base, -0.3));
    ctx.fillStyle = g; ctx.fill();
    if (Shade.rich) Tex.fillPath(ctx, 'leaf', 1.2, 0.25, 'multiply');
    ctx.strokeStyle = 'rgba(30,40,20,.5)'; ctx.lineWidth = 0.5; ctx.stroke();
    plainLine(ctx, [2, 0, l * 0.9, 0], 'rgba(230,230,200,.5)', 0.8);
    ctx.restore();
  }
  // Cones: cylinders seen end-on, spiral rows of orange styles over a brown base
  for (let i = 0; i < 3 + Math.floor(rand() * 3); i++) {
    const a = rand() * TAU, d = rand() * r * 0.5, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d, cr = 6 + rand() * 3;
    Ground.contact(ctx, cx, cy, cr * 1.6, cr * 1.3, 0.35);
    ell(ctx, cx, cy, cr, cr * 0.9, '#b87828', 0, 'grain');
    for (let k = 0; k < 26; k++) { const b = k * 2.4, rd = cr * 0.95 * Math.sqrt(k / 26); plainEll(ctx, cx + Math.cos(b) * rd, cy + Math.sin(b) * rd, 1, 1, k % 2 ? '#f0b040' : '#e89020'); }
    plainEll(ctx, cx - cr * 0.3, cy - cr * 0.35, cr * 0.35, cr * 0.2, 'rgba(255,240,200,.45)');
  }
};

// A low heath shrub from above: many small leaves on radiating twigs, lit from the sun, a shadow underneath.
function drawShrub(ctx, x, y, rad, seed, cols) {
  const r = rng(seed || 1), [sx, sy] = Ground.SUN;
  cols = cols || ['#5a7a3c', '#6f8f50', '#809f5c', '#4a6a30'];
  Ground.contact(ctx, x, y, rad * 1.2, rad * 0.9, 0.4);
  for (let i = 0; i < 10; i++) {
    const a = r() * TAU, l = rad * (0.5 + r() * 0.5);
    plainLine(ctx, [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l], '#5a4028', 1.4);
    for (let k = 0; k < 7; k++) {
      const d = l * (0.25 + k / 7 * 0.75), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      const lit = Math.cos(a) * sx + Math.sin(a) * sy > 0, c = cols[(i + k) % cols.length];
      ell(ctx, px, py, 5 + r() * 3, 2.4 + r(), lit ? tint(c, 0.12) : tint(c, -0.15), a + (k % 2 ? 0.7 : -0.7), 'leaf');
    }
  }
  for (let i = 0; i < 4; i++) { const a = r() * TAU, d = r() * rad * 0.7; plainEll(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 1.8, 1.8, ['#f2f2f2', '#f0d040', '#e08ad0'][i % 3]); }
}

// A eucalypt crown from above: branches radiating from the trunk, clusters of sickle leaves, gumnuts and blossom.
function drawGumCrown(ctx, x, y, rad, seed) {
  const r = rng(seed || 2), [sx, sy] = Ground.SUN;
  Ground.contact(ctx, x + 10, y + 12, rad * 1.3, rad * 1.1, 0.4);
  for (let i = 0; i < 7; i++) {
    const a = r() * TAU, l = rad * (0.6 + r() * 0.4);
    plainLine(ctx, [x, y, x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5], '#b8a890', 5);
    plainLine(ctx, [x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l], '#c8b8a0', 3);
    for (let k = 0; k < 12; k++) {
      const d = l * (0.3 + k / 12 * 0.75), px = x + Math.cos(a) * d + (r() - 0.5) * 14, py = y + Math.sin(a) * d + (r() - 0.5) * 14;
      const la = a + (r() - 0.5) * 2.4, lit = Math.cos(la) * sx + Math.sin(la) * sy > 0, c = k % 3 ? '#6b8f4a' : '#7ea35a';
      ctx.save(); ctx.translate(px, py); ctx.rotate(la);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(7, -4, 13, -1); ctx.quadraticCurveTo(7, 0.5, 0, 0); ctx.closePath();
      ctx.fillStyle = lit ? tint(c, 0.15) : tint(c, -0.2); ctx.fill(); ctx.strokeStyle = 'rgba(30,50,20,.45)'; ctx.lineWidth = 0.4; ctx.stroke();
      ctx.restore();
      if (r() < 0.12) ell(ctx, px, py, 2, 2, '#8a6a3a', 0, 'grain');
      if (r() < 0.08) { for (let q = 0; q < 8; q++) plainLine(ctx, [px, py, px + Math.cos(q * 0.8) * 3, py + Math.sin(q * 0.8) * 3], '#f8f0d0', 0.8); }
    }
  }
  ell(ctx, x, y, 7, 7, '#9a8a70', 0, 'bark');
}

// Reeds and sedges from above: a clump of flat blades with a dark heart.
function drawReeds(ctx, x, y, n, spread, seed) {
  const r = rng(seed || Math.round(x * 3 + y));
  for (let i = 0; i < n; i++) Ground.tuft(ctx, x + (r() - 0.5) * spread, y + (r() - 0.5) * spread, 16 + r() * 8, Math.round(r() * 1e6), ['#4a7a2c', '#5a8a36', '#6a9a42']);
}

Object.assign(Backgrounds, {
  // Kings Park: grey-yellow sand under banksia and grass trees, dappled light, a sandy track.
  ant(ctx, W, H, home) {
    const r = rng(11), A = W * H / (960 * 600);
    Ground.sand(ctx, W, H, 11, { pale: '#e6d6ad', mid: '#cdb882', dark: '#a8905c', ripples: 0.3, cell: 200 });
    ctx.beginPath(); ctx.moveTo(0, H * 0.3); ctx.bezierCurveTo(W * 0.3, H * 0.1, W * 0.6, H * 0.7, W, H * 0.55);
    ctx.strokeStyle = 'rgba(248,236,205,.55)'; ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,95,60,.18)'; ctx.lineWidth = 56; ctx.stroke();
    ctx.strokeStyle = 'rgba(248,236,205,.5)'; ctx.lineWidth = 40; ctx.stroke();
    Ground.canopy(ctx, W, H, 12, { density: 0.8, alpha: 0.2 });
    scatter(r, W, H, 9 * A, home, 140, (x, y) => Ground.tuft(ctx, x, y, 22 + r() * 10, Math.round(r() * 1e6), ['#b8a860', '#a89850', '#c8b870']));
    scatter(r, W, H, 7 * A, home, 140, (x, y) => drawBanksia(ctx, x, y, 38 + r() * 25, r));
    scatter(r, W, H, 5 * A, home, 120, (x, y) => drawGrassTree(ctx, x, y, 28 + r() * 8, Math.round(r() * 1e6)));
    scatter(r, W, H, 5 * A, home, 100, (x, y) => Ground.rock(ctx, x, y, 8 + r() * 8, Math.round(r() * 1e6), { kind: 'laterite' }));
    Ground.contact(ctx, home.x, home.y, home.r * 1.4, home.r * 1.2, 0.3);
    ell(ctx, home.x, home.y, home.r * 0.9, home.r * 0.78, '#c9a868', 0, 'none');
    Tex.fillPath(ctx, 'sand', 1.4, 0.4, 'multiply');
    ell(ctx, home.x, home.y, home.r * 0.33, home.r * 0.3, '#2a1a0c', 0, 'none');
  },
  // A backyard: mown lawn, paths, a veggie patch and a shed.
  bee(ctx, W, H, home) {
    const r = rng(23), A = W * H / (960 * 600);
    Ground.lawn(ctx, W, H, 23, { clover: 1 });
    // Gravel paths
    ctx.save();
    ctx.beginPath(); ctx.rect(W * 0.45, 0, 34, H); ctx.rect(0, H * 0.62, W, 30); ctx.clip();
    Ground.soil(ctx, W, H, 24, { base: '#d8c7a0', dark: '#b0a080', light: '#e8dcbc', stones: 0.4, relief: 0.2 });
    ctx.restore();
    // Veggie patch
    Ground.contact(ctx, W * 0.7 + 110, H * 0.12 + 60, 150, 90, 0.25);
    ctx.save(); ctx.beginPath(); ctx.rect(W * 0.7, H * 0.12, 220, 120); ctx.clip();
    ctx.translate(W * 0.7, H * 0.12);
    Ground.soil(ctx, 220, 120, 25, { base: '#5a4028', dark: '#3a2818', light: '#7a5a3a', stones: 0.6 });
    ctx.restore();
    for (let i = 0; i < 5; i++) for (let k = 0; k < 9; k++) { const x = W * 0.7 + 20 + k * 22, y = H * 0.12 + 18 + i * 22; Ground.contact(ctx, x, y, 9, 7, 0.3); for (let q = 0; q < 5; q++) ell(ctx, x + Math.cos(q * 1.26) * 4, y + Math.sin(q * 1.26) * 4, 5, 3.2, q % 2 ? '#4f8f3a' : '#5a9a44', q * 1.26, 'leaf'); }
    // Shed
    Ground.contact(ctx, W * 0.08 + 85, H * 0.75 + 60, 120, 80, 0.35);
    const sg = ctx.createLinearGradient(W * 0.08, 0, W * 0.08 + 170, 0);
    sg.addColorStop(0, '#b8bec2'); sg.addColorStop(1, '#8a9095');
    ctx.fillStyle = sg; ctx.fillRect(W * 0.08, H * 0.75, 170, 120);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(60,65,70,.45)'; ctx.fillRect(W * 0.08 + i * 21, H * 0.75, 3, 120); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(W * 0.08 + i * 21 + 3, H * 0.75, 2, 120); }
    // Bare patch and burrow
    Ground.contact(ctx, home.x, home.y, 120, 100, 0.2);
    ctx.save(); ctx.beginPath(); ctx.ellipse(home.x, home.y, 110, 90, 0, 0, TAU); ctx.clip();
    ctx.translate(home.x - 110, home.y - 90);
    Ground.soil(ctx, 220, 180, 26, { base: '#c08a4a', dark: '#8a5a30', light: '#d8a868', stones: 0.5 });
    ctx.restore();
    ell(ctx, home.x, home.y, home.r * 0.28, home.r * 0.25, '#2a1a0c', 0, 'none');
    scatter(r, W, H, 4 * A, home, 160, (x, y) => drawGrassTree(ctx, x, y, 34, Math.round(r() * 1e6)));
  },
  // Cottesloe dunes: white sand with wind ripples, spinifex, the ocean along the west.
  spider(ctx, W, H, home) {
    const r = rng(37), A = W * H / (960 * 600);
    Ground.sand(ctx, W, H, 37, { pale: '#fbf3dc', mid: '#efe2c0', dark: '#cdbd92', ripples: 1.6, wind: -0.2, cell: 220, relief: 0.5 });
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 80, H); ctx.clip();
    Ground.water(ctx, 80, H, 38, { shallow: '#8ad0e8', deep: '#2a78b0', caustics: 0.2, weed: 0 });
    ctx.restore();
    // Foam and wet sand at the edge
    for (let y = 0; y < H; y += 26) { plainEll(ctx, 78 + Math.sin(y / 40) * 4, y, 12, 6, 'rgba(255,255,255,.75)'); }
    const wet = ctx.createLinearGradient(80, 0, 150, 0); wet.addColorStop(0, 'rgba(120,100,70,.45)'); wet.addColorStop(1, 'rgba(120,100,70,0)');
    ctx.fillStyle = wet; ctx.fillRect(80, 0, 70, H);
    scatter(r, W, H, 10 * A, home, 100, (x, y) => Ground.tuft(ctx, x, y, 26 + r() * 10, Math.round(r() * 1e6), ['#9aa85a', '#b7b86e', '#8a9a4a']));
    scatter(r, W, H, 3 * A, home, 100, (x, y) => Ground.rock(ctx, x, y, 10 + r() * 10, Math.round(r() * 1e6), { kind: 'limestone' }));
    // Silk retreat
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 30; i++) { const a = r() * TAU; plainLine(ctx, [home.x, home.y, home.x + Math.cos(a) * home.r, home.y + Math.sin(a) * home.r], '#ffffff', 1); }
    plainEll(ctx, home.x, home.y, home.r * 0.6, home.r * 0.45, 'rgba(255,255,255,.85)');
    ctx.globalAlpha = 1;
  },
  // Herdsman Lake from above: open water with lily pads and reed beds.
  dragonfly(ctx, W, H, home) {
    const r = rng(51), A = W * H / (960 * 600);
    Ground.water(ctx, W, H, 51, { shallow: '#62a8c8', deep: '#1f4f72', depth: 'radial', caustics: 0.18, weed: 1.2 });
    scatter(r, W, H, 14 * A, home, 90, (x, y) => {
      const s = 14 + r() * 12;
      ctx.fillStyle = 'rgba(0,20,30,.25)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, s, s * 0.95, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s, 0.12, TAU - 0.12); ctx.closePath();
      const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.3, 2, x, y, s);
      g.addColorStop(0, '#6aa848'); g.addColorStop(1, '#3a7a2c'); ctx.fillStyle = g; ctx.fill();
      if (Shade.rich) Tex.fillPath(ctx, 'leaf', 1.2, 0.3, 'multiply');
      ctx.strokeStyle = 'rgba(20,50,20,.5)'; ctx.lineWidth = 0.8; ctx.stroke();
      for (let k = 0; k < 7; k++) plainLine(ctx, [x, y, x + Math.cos(k * 0.86 + 0.2) * s * 0.9, y + Math.sin(k * 0.86 + 0.2) * s * 0.9], 'rgba(30,70,30,.35)', 0.7);
    });
    drawReeds(ctx, home.x, home.y, 14, home.r * 2.2, 52);
    for (let x = 0; x < W; x += 140) { drawReeds(ctx, x, 20, 3, 60, x); drawReeds(ctx, x, H - 20, 3, 60, x + 1); }
    for (let y = 0; y < H; y += 140) { drawReeds(ctx, 20, y, 3, 60, y + 2); drawReeds(ctx, W - 20, y, 3, 60, y + 3); }
  },
  // Underwater at Herdsman Lake: silty bottom, weed, specks drifting in the water.
  nymph(ctx, W, H, home) {
    const r = rng(77), A = W * H / (960 * 600);
    Ground.soil(ctx, W, H, 77, { base: '#5a6a40', dark: '#303a22', light: '#7a8a52', stones: 0.5, relief: 0.3 });
    Tex.fillRect(ctx, 'caustic', 0, 0, W, H, 0.5, 0.25, 'screen');
    const weeds = (cx, cy, rad, n) => {
      for (let i = 0; i < n; i++) {
        const a = r() * TAU, d = r() * rad, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, l = 14 + r() * 18, b = r() * TAU;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(b + 0.6) * l, y + Math.sin(b + 0.6) * l, x + Math.cos(b) * l * 1.6, y + Math.sin(b) * l * 1.6);
        ctx.strokeStyle = 'rgba(10,30,10,.3)'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = i % 2 ? '#2f6b2a' : '#3f8236'; ctx.lineWidth = 2.6; ctx.stroke();
        ctx.strokeStyle = 'rgba(180,230,150,.35)'; ctx.lineWidth = 0.8; ctx.stroke();
      }
    };
    weeds(home.x, home.y, home.r * 1.4, 60);
    scatter(r, W, H, 6 * A, home, 200, (x, y) => weeds(x, y, 50, 18));
    // Blue-green water between you and the bottom
    const wg = ctx.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, 'rgba(90,150,130,.35)'); wg.addColorStop(1, 'rgba(30,70,60,.45)');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60 * A; i++) plainEll(ctx, r() * W, r() * H, 1 + r(), 1 + r(), 'rgba(255,255,255,' + (0.1 + r() * 0.2) + ')');
  },
  // Swan Valley paddock: dry summer grass, dusty patches, a fence, a trough, a big shady gum.
  paddock(ctx, W, H, home) {
    const r = rng(91), A = W * H / (960 * 600);
    Ground.grass(ctx, W, H, 91, { dry: 0.8, height: 8, cell: 160 });
    // Dust patches worn by the cattle
    for (let i = 0; i < 3 * A; i++) {
      const cx = 60 + r() * (W - 120), cy = 60 + r() * (H - 120), rad = 40 + r() * 60;
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.7, r() * 3, 0, TAU); ctx.clip();
      ctx.translate(cx - rad, cy - rad);   // paint only the patch, not the whole paddock
      Ground.soil(ctx, rad * 2, rad * 2, 92 + i, { base: '#c8a870', dark: '#a08050', light: '#e0c890', stones: 0.5, relief: 0.2 });
      ctx.restore();
      const edge = ctx.createRadialGradient(cx, cy, rad * 0.6, cx, cy, rad); edge.addColorStop(0, 'rgba(200,170,110,0)'); edge.addColorStop(1, 'rgba(200,170,110,.5)');
      ctx.fillStyle = edge; ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.7, 0, 0, TAU); ctx.fill();
    }
    // Fence
    for (let x = 10; x < W; x += 80) { Ground.contact(ctx, x, 30, 9, 6, 0.4); ell(ctx, x, 30, 5, 5, '#5a4028', 0, 'bark'); }
    plainLine(ctx, [0, 29, W, 29], 'rgba(40,25,10,.4)', 4); plainLine(ctx, [0, 28, W, 28], '#8a6a44', 2);
    // Water trough
    Ground.contact(ctx, W * 0.5 + 60, H * 0.08 + 24, 80, 32, 0.4);
    ctx.fillStyle = '#8a9298'; ctx.fillRect(W * 0.5, H * 0.08, 120, 40);
    ctx.fillStyle = '#b8c0c6'; ctx.fillRect(W * 0.5, H * 0.08, 120, 4);
    ctx.save(); ctx.beginPath(); ctx.rect(W * 0.5 + 6, H * 0.08 + 6, 108, 28); ctx.clip();
    ctx.translate(W * 0.5 + 6, H * 0.08 + 6);
    Ground.water(ctx, 108, 28, 93, { shallow: '#7ac0d8', deep: '#3a80a8', caustics: 0.3, weed: 0 });
    ctx.restore();
    // Shady gum (home): crown of sickle leaves over a big shadow
    Ground.contact(ctx, home.x + 14, home.y + 18, home.r * 1.7, home.r * 1.4, 0.45);
    drawGumCrown(ctx, home.x, home.y, home.r * 1.05, 91);
    scatter(r, W, H, 6 * A, home, 200, (x, y) => Ground.tuft(ctx, x, y, 18 + r() * 8, Math.round(r() * 1e6), ['#b8a858', '#c8b868', '#a89848']));
  },
  // Bold Park heath in spring: grey sand, low shrubs, wildflowers.
  heath(ctx, W, H, home) {
    const r = rng(101), A = W * H / (960 * 600);
    Ground.sand(ctx, W, H, 101, { pale: '#e2dac0', mid: '#c8c0a4', dark: '#a0987c', ripples: 0.2, cell: 180 });
    scatter(r, W, H, 18 * A, home, 120, (x, y) => drawShrub(ctx, x, y, 26 + r() * 10, Math.round(r() * 1e6)));
    scatter(r, W, H, 8 * A, home, 100, (x, y) => Ground.tuft(ctx, x, y, 16 + r() * 8, Math.round(r() * 1e6), ['#a8a860', '#b8b870', '#8a8a4a']));
    scatter(r, W, H, 80 * A, home, 60, (x, y) => { const c = ['#f2f2f2', '#f0d040', '#c060c0'][Math.floor(r() * 3)]; for (let k = 0; k < 5; k++) plainEll(ctx, x + Math.cos(k * 1.26) * 2.2, y + Math.sin(k * 1.26) * 2.2, 1.6, 1.1, c, k * 1.26); plainEll(ctx, x, y, 1, 1, '#e8a000'); });
    for (let i = 0; i < 7; i++) ell(ctx, home.x + Math.cos(i * 0.9) * 26, home.y + Math.sin(i * 0.9) * 22, 18, 7, '#5f9a3a', i * 0.9, 'leaf');
  },
  // Whiteman Park woodland: dry sandy soil, banksias, fallen logs, a termite mound for home.
  woodland(ctx, W, H, home) {
    const r = rng(113), A = W * H / (960 * 600);
    Ground.soil(ctx, W, H, 113, { base: '#c8a876', dark: '#8a6a44', light: '#e0c898', stones: 0.8, relief: 0.35 });
    Ground.litter(ctx, W, H, 114, { density: 0.35 });
    Ground.canopy(ctx, W, H, 115, { density: 0.7, alpha: 0.2 });
    scatter(r, W, H, 6 * A, home, 200, (x, y) => drawBanksia(ctx, x, y, 34 + r() * 20, r));
    scatter(r, W, H, 6 * A, home, 220, (x, y) => {
      const a = r() * TAU;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      Ground.contact(ctx, 4, 8, 70, 22, 0.45);
      Ground.bark(ctx, -60, -14, 120, 28, Math.round(r() * 1e6), { axis: 'x', color: '#6a5034' });
      Ground.endGrain(ctx, 60, 0, 8, 14);
      ctx.restore();
    });
    Ground.contact(ctx, home.x, home.y, home.r * 1.5, home.r * 1.3, 0.45);
    ell(ctx, home.x, home.y, home.r * 1.2, home.r, '#9a7448', 0, 'none');
    Tex.fillPath(ctx, 'soil', 1.2, 0.5, 'multiply');
  },
  // Bibra Lake bushland floor: deep shade and thick leaf litter.
  litter(ctx, W, H, home) {
    const r = rng(127), A = W * H / (960 * 600);
    Ground.litter(ctx, W, H, 127, { density: 1.1 });
    Ground.canopy(ctx, W, H, 128, { density: 1.4, alpha: 0.3, sun: 0.12 });
    scatter(r, W, H, 10 * A, home, 150, (x, y) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r() * TAU);
      Ground.contact(ctx, 2, 5, 55, 10, 0.4);
      Ground.bark(ctx, -50, -3, 100, 6, Math.round(r() * 1e6), { axis: 'x', color: '#4a3420' });
      ctx.restore();
    });
    Ground.contact(ctx, home.x, home.y, home.r * 1.5, home.r * 1.2, 0.5);
    ell(ctx, home.x, home.y, home.r * 1.3, home.r, '#3a2e20', 0, 'none');
    ctx.save(); ctx.translate(home.x, home.y - home.r * 0.6);
    Ground.bark(ctx, -60, -14, 120, 28, 5, { axis: 'x', color: '#5a4030' }); Ground.endGrain(ctx, 60, 0, 8, 14);
    ctx.restore();
  },
});
