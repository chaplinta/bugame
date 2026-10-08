'use strict';
// Storybook look, layered over the plain sprites and backgrounds:
// - every solid body part gets soft round shading, lit from the top-left of the screen, and a thin darker edge;
// - creatures cast soft shadows;
// - backgrounds get paper grain, dappled sunlight and a gentle vignette.

const Shade = { on: true, maxR: 1e9, rich: true, mat: 'grain', light: null };
// rich: material texture, specular and rim light on every shaded shape (textures.js). mat: default material.
// light: [lx, ly] override in user space, used while pre-rendering sprites (sprite-cache.js).

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
// Returns [lx, ly, s]: the light in user space and how many device pixels one user unit is.
function lightDir(ctx) {
  const m = ctx.getTransform();
  const det = m.a * m.d - m.b * m.c || 1;
  const s = Math.sqrt(Math.abs(det));
  if (Shade.light) return [Shade.light[0], Shade.light[1], s];
  // Inverse of the transform's linear part, applied to the screen direction (-0.55, -0.83).
  const wx = -0.55, wy = -0.83;
  let lx = (m.d * wx - m.c * wy) / det, ly = (-m.b * wx + m.a * wy) / det;
  const l = Math.hypot(lx, ly) || 1;
  return [lx / l, ly / l, s];
}
// rgba() version of tint.
function tintA(hex, k, a) { return tint(hex, k).replace('rgb(', 'rgba(').replace(')', ',' + a + ')'); }
const SPECULAR = { chitin: 0.34, shell: 0.4, scale: 0.22, wet: 0.5 };

// A shaded body part: gradient lit from the light, a material texture, a rim of light on the lit edge and
// shadow on the far edge, and a specular glint on shiny materials. mat: 'chitin', 'hair', 'leaf', 'scale',
// 'shell', 'wet', 'grain' (default) or 'none'.
ell = function (ctx, x, y, rx, ry, fill, rot, mat) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  const r = Math.max(rx, ry);
  if (Shade.on && typeof fill === 'string' && fill[0] === '#' && r > 2 && Math.min(rx, ry) > 1.2 && r < Shade.maxR) {
    const [lx, ly, s] = lightDir(ctx);
    mat = mat || Shade.mat;
    const fur = mat === 'hair';
    const gr = ctx.createRadialGradient(x + lx * rx * 0.45, y + ly * ry * 0.45, r * 0.08, x, y, r * 1.08);
    gr.addColorStop(0, tint(fill, fur ? 0.28 : 0.42));
    gr.addColorStop(fur ? 0.62 : 0.5, fill);
    gr.addColorStop(1, tint(fill, fur ? -0.3 : -0.38));
    ctx.fillStyle = gr;
    ctx.fill();
    const rich = Shade.rich && r >= 3 && typeof Tex !== 'undefined';
    if (rich && mat !== 'none' && r >= 4) {
      // Texture only where it can be seen: tiny parts get the gradient and rim alone
      const tile = mat === 'shell' || mat === 'wet' ? 'grain' : mat;
      Tex.fillPath(ctx, tile, Math.max(0.6, s) * (fur ? 0.5 : 0.8), mat === 'grain' ? 0.22 : 0.32, 'multiply');
      if (r >= 7) {
        if (mat === 'hair') Tex.fillPath(ctx, 'hairHi', Math.max(0.6, s) * 0.5, 0.25, 'screen');
        if (mat === 'chitin') Tex.fillPath(ctx, 'chitinHi', Math.max(0.6, s), 0.14, 'screen');
      }
    }
    if (r > 3) {
      // Rim: light on the side facing the light, darker where the part turns away
      if (rich) {
        const lg = ctx.createLinearGradient(x + lx * rx, y + ly * ry, x - lx * rx, y - ly * ry);
        lg.addColorStop(0, tintA(fill, 0.55, 0.5));
        lg.addColorStop(0.45, tintA(fill, -0.25, 0.35));
        lg.addColorStop(1, tintA(fill, -0.7, 0.75));
        ctx.strokeStyle = lg;
      } else {
        ctx.strokeStyle = tint(fill, -0.6);
        ctx.globalAlpha *= 0.55;
      }
      ctx.lineWidth = Math.min(1.2, r * 0.12);
      ctx.stroke();
      if (!rich) ctx.globalAlpha /= 0.55;
    }
    const sp = rich && r >= 4 && SPECULAR[mat];
    if (sp) {
      // A small bright streak across the lit side, lying along the surface
      const hx = x + lx * rx * 0.5, hy = y + ly * ry * 0.5;
      ctx.beginPath();
      ctx.ellipse(hx, hy, Math.max(0.8, rx * 0.32), Math.max(0.5, ry * 0.13), Math.atan2(ly * ry, lx * rx) + Math.PI / 2, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,' + sp + ')';
      ctx.fill();
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

// Backgrounds are painted through Ground.paint (ground.js), which shades small things and leaves the ground flat.

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

// ------------------------------------------------------------------ Perth landmarks for backgrounds
// The Dingo Flour mill in North Fremantle: a tall white mill with a giant red dingo painted on the side.
function drawDingoMill(ctx, x, base, s, haze) {
  ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
  ctx.globalAlpha *= 1 - (haze || 0);
  // Silos behind
  for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#d8d2c4' : '#e4dece'; ctx.fillRect(120 + i * 22, -150, 20, 150); ell(ctx, 130 + i * 22, -150, 10, 4, '#cfc8b8'); }
  // Main mill block, stepped roof
  ctx.fillStyle = '#efeadc'; ctx.fillRect(0, -190, 120, 190);
  ctx.fillStyle = '#e2dccc'; ctx.fillRect(20, -220, 70, 30);
  ctx.fillStyle = '#d4cebe'; ctx.fillRect(40, -236, 30, 16);
  ctx.fillStyle = 'rgba(120,110,90,.25)'; for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) ctx.fillRect(10 + c * 28, -175 + r * 28, 12, 8);
  // The painted dingo (red-orange, leaping), and DINGO lettering
  ctx.fillStyle = '#d0402a';
  ctx.beginPath();
  ctx.moveTo(14, -78); ctx.quadraticCurveTo(40, -96, 70, -90); ctx.lineTo(86, -104); ctx.lineTo(90, -96); ctx.lineTo(100, -98);
  ctx.lineTo(96, -88); ctx.quadraticCurveTo(102, -80, 94, -76); ctx.lineTo(80, -78); ctx.quadraticCurveTo(70, -66, 66, -54);
  ctx.lineTo(58, -54); ctx.lineTo(60, -68); ctx.quadraticCurveTo(44, -70, 34, -64); ctx.lineTo(24, -52); ctx.lineTo(16, -54);
  ctx.lineTo(22, -68); ctx.quadraticCurveTo(10, -66, 4, -60); ctx.quadraticCurveTo(6, -72, 14, -78); ctx.closePath(); ctx.fill();
  ctx.font = 'bold 22px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('DINGO', 60, -24);
  ctx.restore();
}

// Perth city skyline across the river, softened by distance.
function drawPerthSkyline(ctx, x, base, w, s, haze) {
  ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
  const cols = ['#9aa8b8', '#8a98aa', '#aab6c4', '#7a889c'];
  // [x, width, height, top style]
  const towers = [[0, 26, 70], [30, 22, 96], [56, 30, 120], [90, 24, 150, 'spire'], [118, 34, 210, 'central'], [156, 28, 170], [188, 30, 186, 'slope'],
    [222, 22, 130], [248, 30, 160], [282, 20, 100], [306, 26, 80], [336, 18, 60, 'bell']];
  for (const [tx, tw, th, top] of towers) {
    ctx.fillStyle = cols[(tx / 2 | 0) % 4];
    ctx.fillRect(tx, -th, tw, th);
    if (top === 'spire') { ctx.beginPath(); ctx.moveTo(tx + 4, -th); ctx.lineTo(tx + tw / 2, -th - 30); ctx.lineTo(tx + tw - 4, -th); ctx.fill(); }
    if (top === 'central') { ctx.fillRect(tx + 8, -th - 18, tw - 16, 18); plainLine(ctx, [tx + tw / 2, -th - 18, tx + tw / 2, -th - 44], cols[1], 2); }
    if (top === 'slope') { ctx.beginPath(); ctx.moveTo(tx, -th); ctx.lineTo(tx + tw, -th - 22); ctx.lineTo(tx + tw, -th); ctx.fill(); }
    if (top === 'bell') {   // the Bell Tower by the river
      ctx.fillStyle = '#a8b4c0'; ctx.beginPath(); ctx.moveTo(tx - 4, 0); ctx.lineTo(tx + tw / 2, -th - 40); ctx.lineTo(tx + tw + 4, 0); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    for (let k = 8; k < th - 4; k += 9) ctx.fillRect(tx + 3, -th + k, tw - 6, 2);
  }
  if (haze) { ctx.fillStyle = 'rgba(220,235,245,' + haze + ')'; ctx.fillRect(-10, -260, 380, 262); }
  ctx.restore();
}

// Wadjemup (Rottnest) lighthouse: a white tower on the island.
function drawRottnestLighthouse(ctx, x, base, s) {
  ctx.save(); ctx.translate(x, base); ctx.scale(s, s);
  ctx.fillStyle = '#f4f0e6'; ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-3.5, -30); ctx.lineTo(3.5, -30); ctx.lineTo(5, 0); ctx.fill();
  ctx.fillStyle = '#5a5a5a'; ctx.fillRect(-4, -36, 8, 6);
  ctx.fillStyle = '#ffe9a0'; ctx.fillRect(-2.5, -35, 5, 3);
  ctx.restore();
}

// An election corflute stuck in the Cottesloe dunes.
function drawCorflute(ctx, x, y) {
  softShadow(ctx, x + 14, y + 40, 46, 12, 0.3);
  plainLine(ctx, [x - 30, y + 40, x - 30, y - 10], '#8a7a5a', 3);
  plainLine(ctx, [x + 30, y + 40, x + 30, y - 10], '#8a7a5a', 3);
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-46, -52, 92, 64);
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.strokeRect(-46, -52, 92, 64);
  ctx.fillStyle = '#1a4a9a'; ctx.fillRect(-46, -52, 92, 20);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('VOTE 1', 0, -37);
  ctx.fillStyle = '#1a4a9a'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('LIBERAL', 0, -12);
  ctx.font = '9px sans-serif'; ctx.fillText('for Cottesloe', 0, 4);
  ctx.restore();
}

// Water slides over the fence at Bibra Lake: twisting tubes, a splash pool and the park's sign.
function drawWaterSlides(ctx, x0, y0) {
  // Fence line
  for (let i = 0; i < 26; i++) plainLine(ctx, [x0 - 20 + i * 18, y0 + 300, x0 - 10 + i * 18, y0 + 300], '#7a7a7a', 3);
  plainLine(ctx, [x0 - 20, y0 + 304, x0 + 450, y0 + 304], 'rgba(90,90,90,.6)', 1.5);
  // Concrete and pool
  ctx.fillStyle = '#d8d4c8'; ctx.fillRect(x0, y0, 440, 290);
  ctx.beginPath(); ctx.ellipse(x0 + 300, y0 + 200, 110, 60, 0, 0, TAU);
  const pg = ctx.createRadialGradient(x0 + 280, y0 + 180, 10, x0 + 300, y0 + 200, 110);
  pg.addColorStop(0, '#9ae0f0'); pg.addColorStop(1, '#3aa0d0');
  ctx.fillStyle = pg; ctx.fill(); ctx.strokeStyle = '#f4f2ec'; ctx.lineWidth = 6; ctx.stroke();
  for (let i = 0; i < 6; i++) plainLine(ctx, [x0 + 230 + i * 22, y0 + 190 + (i % 2) * 14, x0 + 246 + i * 22, y0 + 190 + (i % 2) * 14], 'rgba(255,255,255,.6)', 2);
  // Twisting slides from a tower into the pool
  const slide = (col, pts, w) => {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 4) ctx.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = w + 6; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = w * 0.3; ctx.stroke();
  };
  slide('#e8402a', [x0 + 60, y0 + 50, x0 + 180, y0 - 10, x0 + 160, y0 + 90, x0 + 120, y0 + 190, x0 + 230, y0 + 180], 18);
  slide('#f2c030', [x0 + 70, y0 + 60, x0 + 20, y0 + 160, x0 + 120, y0 + 240, x0 + 200, y0 + 280, x0 + 250, y0 + 220], 16);
  slide('#2a80d0', [x0 + 80, y0 + 40, x0 + 300, y0 + 20, x0 + 380, y0 + 90, x0 + 420, y0 + 160, x0 + 370, y0 + 200], 20);
  // Tower platform
  ctx.fillStyle = '#b84a2a'; ctx.fillRect(x0 + 40, y0 + 20, 60, 60);
  ctx.fillStyle = '#f2c030'; ctx.fillRect(x0 + 34, y0 + 14, 72, 10);
  // Sign
  ctx.fillStyle = '#1a6a3a'; ctx.fillRect(x0 + 150, y0 + 262, 170, 30);
  ctx.fillStyle = '#ffe680'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ADVENTURE WORLD', x0 + 235, y0 + 283);
}

{
  const spider = Backgrounds.spider, litter = Backgrounds.litter;
  Backgrounds.spider = function (ctx, W, H, home) { spider(ctx, W, H, home); drawCorflute(ctx, W * 0.82, H * 0.18); };
  Backgrounds.litter = function (ctx, W, H, home) { litter(ctx, W, H, home); drawWaterSlides(ctx, W - 470, 10); };
}
