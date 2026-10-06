'use strict';
// Storybook look, layered over the plain sprites and backgrounds:
// - every solid body part gets soft round shading, lit from the top-left of the screen, and a thin darker edge;
// - creatures cast soft shadows;
// - backgrounds get paper grain, dappled sunlight and a gentle vignette.

const Shade = { on: true, maxR: 1e9 };

// Lighter or darker versions of a #rgb / #rrggbb colour (cached).
const shadeCache = new Map();
function tint(hex, k) {
  const key = hex + k;
  let c = shadeCache.get(key);
  if (c) return c;
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; }
  else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
  c = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  shadeCache.set(key, c);
  return c;
}

// The light comes from the top-left of the screen whichever way the sprite is turned.
function lightDir(ctx) {
  const m = ctx.getTransform();
  const det = m.a * m.d - m.b * m.c || 1;
  // Inverse of the transform's linear part, applied to the screen direction (-0.55, -0.83).
  const wx = -0.55, wy = -0.83;
  let lx = (m.d * wx - m.c * wy) / det, ly = (-m.b * wx + m.a * wy) / det;
  const l = Math.hypot(lx, ly) || 1;
  return [lx / l, ly / l];
}

ell = function (ctx, x, y, rx, ry, fill, rot) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  const r = Math.max(rx, ry);
  if (Shade.on && typeof fill === 'string' && fill[0] === '#' && r > 2 && Math.min(rx, ry) > 1.2 && r < Shade.maxR) {
    const [lx, ly] = lightDir(ctx);
    const gr = ctx.createRadialGradient(x + lx * rx * 0.45, y + ly * ry * 0.45, r * 0.08, x, y, r * 1.08);
    gr.addColorStop(0, tint(fill, 0.42));
    gr.addColorStop(0.5, fill);
    gr.addColorStop(1, tint(fill, -0.38));
    ctx.fillStyle = gr;
    ctx.fill();
    if (r > 3) {
      ctx.strokeStyle = tint(fill, -0.6);
      ctx.globalAlpha *= 0.55;
      ctx.lineWidth = Math.min(1.1, r * 0.12);
      ctx.stroke();
      ctx.globalAlpha /= 0.55;
    }
  } else {
    ctx.fillStyle = fill;
    ctx.fill();
  }
};

// Legs and feelers: a soft dark edge under the stroke so they read as solid.
const plainLine = line;
line = function (ctx, pts, color, width) {
  if (Shade.on && width >= 1.5 && typeof color === 'string' && color[0] === '#') {
    plainLine(ctx, pts, tint(color, -0.5), width + 1);
    plainLine(ctx, pts, color, width);
    if (width >= 2.5) plainLine(ctx, pts, tint(color, 0.3), width * 0.3);
  } else plainLine(ctx, pts, color, width);
};

// Paper grain, dappled light and a vignette over a finished background.
function storybookFinish(ctx, W, H, seed) {
  const r = rng(seed || 7);
  // Grain
  for (let i = 0; i < W * H / 220; i++) {
    const x = r() * W, y = r() * H, s = 0.6 + r() * 1.6;
    ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(60,40,20,.07)';
    ctx.fillRect(x, y, s, s);
  }
  // Brush-like strokes of colour variation
  for (let i = 0; i < W * H / 9000; i++) {
    const x = r() * W, y = r() * H, rr = 30 + r() * 90;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rr);
    const light = r() < 0.5;
    gr.addColorStop(0, light ? 'rgba(255,245,210,.10)' : 'rgba(70,50,20,.08)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  // Dappled sunlight through leaves
  for (let i = 0; i < W * H / 40000; i++) {
    const x = r() * W, y = r() * H, rr = 40 + r() * 70;
    const gr = ctx.createRadialGradient(x, y, rr * 0.2, x, y, rr);
    gr.addColorStop(0, 'rgba(255,250,215,.16)');
    gr.addColorStop(1, 'rgba(255,250,215,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.7, r() * 3, 0, TAU); ctx.fill();
  }
  // Vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.hypot(W, H) * 0.55);
  v.addColorStop(0, 'rgba(40,25,10,0)');
  v.addColorStop(1, 'rgba(40,25,10,.28)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

for (const [name, fn] of Object.entries(Backgrounds)) {
  Backgrounds[name] = function (ctx, W, H, home) {
    Shade.maxR = 30;   // pebbles, leaves and shrubs get shaded; big ground patches stay flat
    try { fn(ctx, W, H, home); } finally { Shade.maxR = 1e9; }
    storybookFinish(ctx, W, H, name.length * 31 + 5);
  };
}

// Soft round shadow under something standing on the ground.
function softShadow(ctx, x, y, rx, ry, a) {
  const gr = ctx.createRadialGradient(x, y, 0, x, y, rx);
  gr.addColorStop(0, 'rgba(30,20,10,' + (a || 0.3) + ')');
  gr.addColorStop(1, 'rgba(30,20,10,0)');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
}

// Painted map of Perth: ocean, sandy coastal plain, river, lakes, bush and the hills.
drawPerthMap = function (ctx, W, H) {
  const r = rng(3);
  const coast = (y) => 250 + Math.sin(y / 70) * 14 - (y > 420 ? (y - 420) * 0.15 : 0);
  // Ocean: deeper blue offshore
  let g = ctx.createLinearGradient(0, 0, 280, 0);
  g.addColorStop(0, '#2f7fb8'); g.addColorStop(0.7, '#5aaed8'); g.addColorStop(1, '#8fd0e8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = r() * 240, y = r() * H, l = 10 + r() * 16;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l / 2, y - 3, x + l, y);
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.2 + r() * 0.25) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // Land
  const landPath = () => {
    ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(coast(0), 0);
    for (let y = 0; y <= H; y += 10) ctx.lineTo(coast(y), y);
    ctx.lineTo(W, H); ctx.closePath();
  };
  // Surf and beach
  ctx.save(); ctx.translate(-8, 0); landPath(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill(); ctx.restore();
  landPath();
  g = ctx.createLinearGradient(250, 0, W, 0);
  g.addColorStop(0, '#f2e6c0'); g.addColorStop(0.08, '#e6d8a6'); g.addColorStop(0.55, '#d8d09a'); g.addColorStop(0.85, '#b8c08a'); g.addColorStop(1, '#94a46e');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); landPath(); ctx.clip();
  // Beach line and dunes
  ctx.beginPath(); for (let y = 0; y <= H; y += 10) ctx.lineTo(coast(y) + 6, y);
  ctx.strokeStyle = '#fbf3d8'; ctx.lineWidth = 10; ctx.stroke();
  for (let i = 0; i < 60; i++) { const y = r() * H; softBlob(ctx, coast(y) + 22 + r() * 16, y, 8 + r() * 6, 'rgba(150,170,100,.35)'); }
  // Bushland patches and paddocks
  for (let i = 0; i < 260; i++) {
    const x = 270 + r() * (W - 270), y = r() * H;
    softBlob(ctx, x, y, 4 + r() * 10, 'rgba(' + (100 + r() * 40 | 0) + ',' + (140 + r() * 30 | 0) + ',80,' + (0.18 + r() * 0.2) + ')');
  }
  // Darling Scarp hills to the east
  for (let i = 0; i < 40; i++) { const y = r() * H; softBlob(ctx, W - 40 + r() * 50, y, 24 + r() * 20, 'rgba(90,110,60,.25)'); }
  ctx.restore();
  // Rottnest Island with its salt lakes
  ell(ctx, 80, 430, 55, 16, '#eadcae', -0.15);
  plainEll(ctx, 70, 430, 10, 4, 'rgba(240,170,170,.8)', -0.15);
  plainEll(ctx, 95, 426, 7, 3, 'rgba(240,170,170,.8)', -0.15);
  plainEll(ctx, 74, 422, 32, 4, 'rgba(255,255,255,.35)', -0.15);
  // Swan River from Fremantle to the hills
  const river = (w, col) => {
    ctx.beginPath();
    ctx.moveTo(coast(490) - 4, 490);
    ctx.bezierCurveTo(330, 470, 340, 380, 420, 370);
    ctx.bezierCurveTo(480, 362, 500, 340, 540, 345);
    ctx.bezierCurveTo(600, 352, 640, 320, 700, 300);
    ctx.bezierCurveTo(780, 270, 860, 240, W, 210);
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  };
  river(30, 'rgba(120,150,80,.45)');
  river(22, '#5aaed8');
  river(8, 'rgba(255,255,255,.25)');
  for (const [x, y, rx, ry, a] of [[380, 400, 42, 24, -0.5], [560, 352, 36, 15, 0]]) {
    plainEll(ctx, x, y, rx + 6, ry + 6, 'rgba(120,150,80,.45)', a);
    ell(ctx, x, y, rx, ry, '#5aaed8', a);
  }
  // Lakes: Herdsman and Bibra
  for (const [x, y, rx, ry] of [[430, 185, 40, 28], [455, 545, 22, 14]]) {
    plainEll(ctx, x, y, rx + 9, ry + 8, 'rgba(110,150,80,.5)');
    ell(ctx, x, y, rx, ry, '#6ab8dc');
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; plainLine(ctx, [x + Math.cos(a) * rx, y + Math.sin(a) * ry, x + Math.cos(a) * (rx + 6), y + Math.sin(a) * (ry + 6) - 3], '#5a8a40', 1.2); }
  }
  // Kings Park bush: a cluster of trees
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, d = r();
    const x = 455 + Math.cos(a) * d * 44, y = 330 + Math.sin(a) * d * 30;
    softShadow(ctx, x + 2, y + 3, 9, 6, 0.25);
    ell(ctx, x, y, 7 + r() * 3, 6 + r() * 3, r() < 0.5 ? '#5f8a3e' : '#76a04a');
  }
  // Trees across the plain
  for (let i = 0; i < 70; i++) {
    const x = 290 + r() * (W - 300), y = 20 + r() * (H - 40);
    if (Math.abs(y - (210 + (W - x) * 0.35)) < 30) continue;
    ell(ctx, x, y, 4 + r() * 2, 3.5 + r() * 2, r() < 0.5 ? '#6a9a48' : '#88aa58');
  }
  // City towers
  for (let i = 0; i < 8; i++) {
    const x = 518 + i * 9, h = 20 + ((i * 7) % 4) * 9;
    const gg = ctx.createLinearGradient(x, 0, x + 8, 0);
    gg.addColorStop(0, '#c8d4dc'); gg.addColorStop(1, '#7a8894');
    ctx.fillStyle = gg; ctx.fillRect(x, 322 - h, 8, h);
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let k = 0; k < h - 4; k += 4) ctx.fillRect(x + 1.5, 322 - h + 2 + k, 5, 1);
  }
  // Suburb houses
  for (let i = 0; i < 16; i++) {
    const x = 630 + (i % 4) * 30 + (i % 3) * 3, y = 410 + Math.floor(i / 4) * 26;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x + 2, y + 2, 16, 12);
    ctx.fillStyle = '#efe2c0'; ctx.fillRect(x, y, 16, 12);
    ctx.fillStyle = i % 2 ? '#b5523a' : '#8a5a4a';
    ctx.beginPath(); ctx.moveTo(x - 2, y + 1); ctx.lineTo(x + 8, y - 7); ctx.lineTo(x + 18, y + 1); ctx.fill();
  }
  // Labels
  ctx.textAlign = 'center';
  const label = (text, x, y, size, col) => {
    ctx.font = 'italic bold ' + size + 'px Georgia, serif';
    ctx.lineWidth = 4; ctx.strokeStyle = col && col[1] === 'e' ? 'rgba(20,60,90,.55)' : 'rgba(255,250,235,.7)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = col || '#4a3a22'; ctx.fillText(text, x, y);
  };
  label('Indian Ocean', 130, 120, 20, '#e8f6ff');
  label('Rottnest', 80, 462, 15);
  label('Perth city', 552, 290, 15);
  label('Fremantle', 300, 520, 15);
  label('Swan River', 760, 300, 15, '#2a5a7a');
  label('Darling Scarp', 900, 560, 13, '#3a4a22');
  // Compass
  ctx.save(); ctx.translate(910, 60);
  ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fillStyle = 'rgba(255,250,235,.7)'; ctx.fill();
  ctx.strokeStyle = '#7a6040'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(6, 0); ctx.lineTo(0, 18); ctx.lineTo(-6, 0); ctx.closePath();
  ctx.fillStyle = '#c8501e'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(6, 0); ctx.lineTo(-6, 0); ctx.fillStyle = '#5a4a32'; ctx.fill();
  ctx.restore();
  label('N', 910, 34, 13);
  storybookFinish(ctx, W, H, 99);
  // Paper edge
  ctx.strokeStyle = 'rgba(90,60,30,.35)'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, W, H);
};

function softBlob(ctx, x, y, rr, col) {
  ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.75, 0, 0, TAU); ctx.fillStyle = col; ctx.fill();
}
