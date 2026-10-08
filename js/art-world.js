'use strict';
// Field-guide drawings of the other animals, plants and things: predators, birds, reptiles, cows,
// flowers, fungi and litter. These are pre-rendered by sprite-cache.js, so they can afford detail.

// Feathers: a bird's body with a soft contour, a lit back and a few drawn feathers.
function feathered(ctx, x, y, rx, ry, col, n, seed) {
  ell(ctx, x, y, rx, ry, col, 0, 'hair');
  const r = rng(seed || 2), [lx, ly] = lightDir(ctx);
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.clip();
  for (let i = 0; i < n; i++) {
    const px = x - rx + r() * rx * 2, py = y - ry + r() * ry * 2, lit = (px - x) * lx + (py - y) * ly > 0;
    ctx.beginPath(); ctx.ellipse(px, py, rx * 0.22, ry * 0.12, 0.2 + (r() - 0.5) * 0.4, 0, TAU);
    ctx.strokeStyle = tint(col, lit ? 0.3 : -0.35); ctx.globalAlpha = 0.5; ctx.lineWidth = 0.6; ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
}
// A wing: primaries fanned out from the shoulder with a darker trailing edge.
function birdWing(ctx, x, y, len, wid, rot, col, dark, n) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.3, -wid, len, -wid * 0.3); ctx.quadraticCurveTo(len * 0.6, wid * 0.5, 0, wid * 0.4); ctx.closePath();
  const g = ctx.createLinearGradient(0, -wid, len, wid); g.addColorStop(0, tint(col, 0.2)); g.addColorStop(1, tint(col, -0.3));
  ctx.fillStyle = g; ctx.fill();
  if (Shade.rich) Tex.fillPath(ctx, 'hair', 1, 0.3, 'multiply');
  ctx.strokeStyle = dark; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.beginPath();
  for (let i = 1; i <= (n || 7); i++) { const k = i / (n || 7); ctx.moveTo(len * 0.15, -wid * 0.2 + wid * 0.5 * k); ctx.quadraticCurveTo(len * 0.6, -wid * 0.6 + wid * 0.9 * k, len * (0.55 + k * 0.45), -wid * 0.35 + wid * 0.7 * k); }
  ctx.strokeStyle = dark; ctx.globalAlpha = 0.6; ctx.lineWidth = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
  ctx.restore();
}
function beak(ctx, x, y, len, wid, col) {
  ctx.beginPath(); ctx.moveTo(x, y - wid); ctx.lineTo(x + len, y); ctx.lineTo(x, y + wid); ctx.closePath();
  const g = ctx.createLinearGradient(x, y - wid, x, y + wid); g.addColorStop(0, tint(col, 0.3)); g.addColorStop(1, tint(col, -0.4));
  ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = tint(col, -0.6); ctx.lineWidth = 0.4; ctx.stroke();
  plainLine(ctx, [x, y, x + len * 0.9, y], tint(col, -0.5), 0.4);
}
function birdEye(ctx, x, y, r, iris) { eye(ctx, x, y, r, r, '#0a0a0a'); if (iris) { plainEll(ctx, x, y, r * 0.95, r * 0.95, iris); plainEll(ctx, x, y, r * 0.55, r * 0.55, '#0a0a0a'); } }
// A petal with a soft gradient and a fold line, drawn along +x from the centre.
function petal(ctx, len, wid, col, o) {
  o = o || {};
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.3, -wid, len * 0.9, -wid * (o.pointed ? 0.5 : 1), len, 0);
  ctx.bezierCurveTo(len * 0.9, wid * (o.pointed ? 0.5 : 1), len * 0.3, wid, 0, 0); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, tint(col, o.baseDark === undefined ? -0.25 : o.baseDark)); g.addColorStop(0.5, col); g.addColorStop(1, tint(col, 0.25));
  ctx.fillStyle = g; ctx.fill();
  if (Shade.rich) Tex.fillPath(ctx, 'leaf', 1.4, 0.18, 'multiply');
  ctx.strokeStyle = tint(col, -0.45); ctx.lineWidth = 0.4; ctx.stroke();
  plainLine(ctx, [len * 0.1, 0, len * 0.85, 0], tint(col, -0.3), 0.4);
  plainEll(ctx, len * 0.45, -wid * 0.35, len * 0.2, wid * 0.15, 'rgba(255,255,255,.3)');
}
// A leaf along +x: midrib, side veins, serrated or smooth edge.
function leafDraw(ctx, len, wid, col, o) {
  o = o || {};
  ctx.beginPath(); ctx.moveTo(0, 0);
  if (o.serrate) { for (let s = 0; s <= len; s += len / 10) ctx.lineTo(s, -wid * Math.sin(Math.min(Math.PI, s / len * Math.PI * 1.05)) - (Math.round(s / (len / 10)) % 2 ? wid * 0.18 : 0)); for (let s = len; s >= 0; s -= len / 10) ctx.lineTo(s, wid * Math.sin(Math.min(Math.PI, s / len * Math.PI * 1.05)) + (Math.round(s / (len / 10)) % 2 ? wid * 0.18 : 0)); }
  else { ctx.bezierCurveTo(len * 0.2, -wid, len * 0.85, -wid * 0.8, len, 0); ctx.bezierCurveTo(len * 0.85, wid * 0.8, len * 0.2, wid, 0, 0); }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -wid, 0, wid); g.addColorStop(0, tint(col, 0.28)); g.addColorStop(0.5, col); g.addColorStop(1, tint(col, -0.3));
  ctx.fillStyle = g; ctx.fill();
  if (Shade.rich) Tex.fillPath(ctx, 'leaf', 1.3, 0.28, 'multiply');
  ctx.strokeStyle = tint(col, -0.5); ctx.lineWidth = 0.45; ctx.stroke();
  plainLine(ctx, [len * 0.05, 0, len * 0.9, 0], tint(col, -0.35), 0.6);
  ctx.beginPath(); for (let k = 1; k < 5; k++) { const px = len * k / 5; ctx.moveTo(px, 0); ctx.lineTo(px + len * 0.1, -wid * 0.55 * Math.sin(k / 5 * Math.PI)); ctx.moveTo(px, 0); ctx.lineTo(px + len * 0.1, wid * 0.55 * Math.sin(k / 5 * Math.PI)); }
  ctx.strokeStyle = tint(col, -0.3); ctx.globalAlpha = 0.5; ctx.lineWidth = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
  plainEll(ctx, len * 0.4, -wid * 0.3, len * 0.2, wid * 0.18, 'rgba(255,255,255,.22)');
}
function rosette(ctx, n, len, wid, col, o, lf) {
  for (let i = 0; i < n; i++) { ctx.save(); ctx.rotate(i * TAU / n + (o && o.turn || 0)); if (lf !== undefined && lf < 1) { leafDraw(ctx, len * (0.7 + lf * 0.3), wid, col, o); chewed(ctx, len * (0.7 + lf * 0.3) / 2, len * (0.7 + lf * 0.3) / 2, wid, lf, i); } else leafDraw(ctx, len, wid, col, o); ctx.restore(); }
}

Object.assign(Sprites, {
  // ------------------------------------------------------------------ predators
  // Short-beaked echidna: a dome of cream spines with dark tips over dark fur, a long snout, clawed feet.
  echidna(ctx, o, t) {
    const bob = o.moving ? Math.sin(t * 6) : 0;
    for (const [x, s] of [[14, -1], [14, 1], [-12, -1], [-12, 1]]) { ell(ctx, x + bob * s, s * 17, 4.5, 3.2, '#3a2414', 0, 'hair'); for (let k = -1; k <= 1; k++) plainLine(ctx, [x + bob * s + k * 2, s * 19, x + bob * s + k * 2.4, s * 22.5], '#1a1008', 1); }
    ell(ctx, 0, 0, 26, 19, '#4a3220', 0, 'hair');
    fur(ctx, 0, 0, 25, 18, '#6a4a30', 120, 1.6, 21);
    const r = rng(7), [lx, ly] = lightDir(ctx);
    for (let i = 0; i < 110; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.92, x = Math.cos(a) * 24 * d, y = Math.sin(a) * 17 * d;
      const dir = Math.atan2(y, x) + Math.PI + (r() - 0.5) * 0.5, L = 5 + r() * 3;
      const lit = Math.cos(dir) * lx + Math.sin(dir) * ly < 0;
      plainLine(ctx, [x, y, x + Math.cos(dir) * L, y + Math.sin(dir) * L], lit ? '#f6ecd0' : '#d8c8a0', 1.5);
      plainLine(ctx, [x + Math.cos(dir) * L * 0.75, y + Math.sin(dir) * L * 0.75, x + Math.cos(dir) * L, y + Math.sin(dir) * L], '#1a1008', 1.3);
    }
    ell(ctx, 24, 0, 6.5, 6, '#5b3a21', 0, 'hair');
    fur(ctx, 24, 0, 6, 5.5, '#7a5a3a', 24, 1, 22);
    line(ctx, [27, 0, 41, 0], '#2b1a0e', 4); plainEll(ctx, 41, 0, 1.6, 1.4, '#1a0e06');
    eye(ctx, 27, -3.2, 1.1, 1.1); eye(ctx, 27, 3.2, 1.1, 1.1);
  },
  // Rainbow bee-eater: green body, gold crown, blue rump and tail with two long streamers, black
  // eye stripe over an orange throat, a long down-curved black bill, orange flashes under the wings.
  beeEater(ctx, o, t) {
    const flap = Math.sin(t * 14) * 0.25;
    line(ctx, [-18, -1.2, -42, -1.2], '#111', 1.3); line(ctx, [-18, 1.2, -42, 1.2], '#111', 1.3);
    ell(ctx, -16, 0, 9, 4.2, '#1f78a0', 0, 'hair');
    for (const s of [-1, 1]) {
      birdWing(ctx, 2, s * 3, 34, s * 14, s * (0.9 + flap), '#3a9a48', '#1a3a20', 8);
      ctx.save(); ctx.translate(2, s * 3); ctx.rotate(s * (0.9 + flap)); plainEll(ctx, 14, s * -3, 9, 3, 'rgba(220,130,40,.8)', s * -0.2); ctx.restore();
    }
    feathered(ctx, 0, 0, 13, 6.2, '#4aa85a', 18, 23);
    plainEll(ctx, -4, 0, 6, 3, 'rgba(90,180,110,.7)');
    ell(ctx, 11, 0, 6, 5.2, '#e3a12a', 0, 'hair');
    plainEll(ctx, 9, 0, 3.5, 4, 'rgba(60,140,70,.6)');
    for (const s of [-1, 1]) plainLine(ctx, [8, s * 4.2, 16, s * 2.6], '#111', 1.8);
    plainEll(ctx, 15, 0, 2.6, 2.2, '#e87a28');
    birdEye(ctx, 11.5, -3.2, 1.1, '#c0392b'); birdEye(ctx, 11.5, 3.2, 1.1, '#c0392b');
    ctx.beginPath(); ctx.moveTo(17, -1.2); ctx.quadraticCurveTo(24, -0.5, 28, 1.5); ctx.quadraticCurveTo(24, 0.8, 17, 1.2); ctx.fillStyle = '#111'; ctx.fill();
  },
  // Australian hobby: slate back, black cap and moustache, pale half-collar, rufous barred underside,
  // long narrow pointed wings, barred tail.
  hobby(ctx, o, t) {
    const flap = Math.sin(t * 12) * 3;
    ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-30, -7); ctx.lineTo(-33, 0); ctx.lineTo(-30, 7); ctx.lineTo(-10, 4); ctx.closePath();
    ctx.fillStyle = '#3d4450'; ctx.fill();
    for (let k = 0; k < 4; k++) plainLine(ctx, [-14 - k * 4.5, -5.5 + k * 0.3, -14 - k * 4.5, 5.5 - k * 0.3], 'rgba(220,210,190,.35)', 1);
    for (const s of [-1, 1]) birdWing(ctx, 6, s * 3, 48, s * 18, s * (1.0 + flap * 0.03), '#4a5260', '#20242c', 9);
    feathered(ctx, 0, 0, 14, 7, '#5a6472', 20, 24);
    for (let k = 0; k < 6; k++) plainLine(ctx, [-10 + k * 4, -5.5, -9 + k * 4, 5.5], 'rgba(200,140,90,.45)', 0.8);
    ell(ctx, 13, 0, 6.5, 6, '#2a2f38', 0, 'hair');
    plainEll(ctx, 11, -5, 2.6, 1.3, '#d9d0b8'); plainEll(ctx, 11, 5, 2.6, 1.3, '#d9d0b8');
    plainLine(ctx, [14, -3.2, 16, -5.5], '#1a1a1a', 1.6); plainLine(ctx, [14, 3.2, 16, 5.5], '#1a1a1a', 1.6);
    birdEye(ctx, 15, -2.6, 1.4, '#4a3a20'); birdEye(ctx, 15, 2.6, 1.4, '#4a3a20');
    beak(ctx, 18.5, 0, 4.5, 1.6, '#d8d0c0'); plainEll(ctx, 18.8, 0, 1.3, 1.6, '#e0b040');
  },
  // Western magpie: black with a white nape, white back and wing patches, white tail base, pale bill.
  magpie(ctx, o, t) {
    line(ctx, [-10, 0, -24, 0], '#151515', 6.5); plainLine(ctx, [-11, 0, -16, 0], '#f2f2f2', 6);
    feathered(ctx, 0, 0, 12.5, 7.2, '#1a1a1a', 14, 25);
    for (const s of [-1, 1]) { ell(ctx, -4, s * 5, 8.5, 3.2, '#f2f2f2', s * 0.1, 'hair'); plainEll(ctx, 1, s * 4.5, 4, 2, '#1a1a1a', s * 0.1); }
    ell(ctx, -1, 0, 5, 2.6, '#f2f2f2', 0, 'hair');
    ell(ctx, 11, 0, 5.6, 5, '#151515', 0, 'hair');
    plainEll(ctx, 7, 0, 2.5, 4, '#f2f2f2');
    birdEye(ctx, 12.5, -2.6, 1.2, '#8a3a2a'); birdEye(ctx, 12.5, 2.6, 1.2, '#8a3a2a');
    beak(ctx, 15.5, 0, 7, 1.8, '#c8d0d8'); plainLine(ctx, [20.5, -0.4, 22.5, 0], '#1a1a1a', 1.2);
  },
  // Willie wagtail: black above with a white eyebrow, white belly, a long fanned tail it swings sideways.
  wagtail(ctx, o, t) {
    const flap = Math.sin(t * 16) * 4, fan = Math.sin(t * 9) * 0.35;
    for (const k of [-2, -1, 0, 1, 2]) { ctx.save(); ctx.rotate(Math.PI + k * 0.17 + fan * k * 0.5); ell(ctx, 18, 0, 12, 2.4, k % 2 ? '#1a1a1a' : '#242424', 0, 'hair'); plainLine(ctx, [8, 0, 29, 0], 'rgba(255,255,255,.12)', 0.5); ctx.restore(); }
    for (const s of [-1, 1]) birdWing(ctx, 4, s * 3, 24, s * 11, s * (1.05 + flap * 0.03), '#222', '#000', 6);
    feathered(ctx, 0, 0, 11, 7, '#1d1d1d', 12, 26);
    ell(ctx, -3, 0, 7, 3.8, '#f4f4f4', 0, 'hair');
    ell(ctx, 10, 0, 6, 5.5, '#151515', 0, 'hair');
    plainEll(ctx, 11, -3.6, 2.8, 0.9, '#fff'); plainEll(ctx, 11, 3.6, 2.8, 0.9, '#fff');
    birdEye(ctx, 11.5, -2.2, 1, null); birdEye(ctx, 11.5, 2.2, 1, null);
    beak(ctx, 15.5, 0, 4.5, 1.2, '#1a1a1a');
    for (let k = 0; k < 4; k++) plainLine(ctx, [14.5 + k * 0.6, -1.4 - k * 0.4, 15.5 + k * 0.8, -2.6 - k * 0.5], '#111', 0.4);
  },
  // Bobtail: pinecone scales in rows, a triangular head, a stumpy tail shaped like the head, blue tongue.
  bobtail(ctx, o, t) {
    for (const [x, s] of [[8, -1], [8, 1], [-8, -1], [-8, 1]]) { ell(ctx, x, s * 8, 3.4, 3, '#4a3a28', 0, 'scale'); for (let k = -1; k <= 1; k++) plainLine(ctx, [x + k * 1.6, s * 10, x + k * 2, s * 12.5], '#2a1a10', 0.8); }
    Ground.contact(ctx, 0, 3, 22, 9, 0.4);
    ell(ctx, 0, 0, 14, 7.5, '#7a6240', 0, 'none');
    ell(ctx, -17, 0, 6.5, 5.2, '#6e5838', 0, 'none');
    ell(ctx, 16, 0, 6.6, 5.4, '#8a7250', 0, 'none');
    // scale rows: overlapping plates with a lit edge
    const [lx, ly] = lightDir(ctx);
    for (let i = -5; i <= 5; i++) for (let j = -2; j <= 2; j++) {
      const x = i * 3.6 + (j % 2 ? 1.8 : 0), y = j * 3, w = Math.abs(x) < 15 ? 7.2 : 5, scaleH = Math.sqrt(Math.max(0, 1 - (x / 23) ** 2)) * w;
      if (Math.abs(y) > scaleH + 1) continue;
      const col = (i + j) % 3 ? '#8a6e46' : '#a88a58';
      ctx.beginPath(); ctx.ellipse(x, y, 2.3, 1.8, 0, 0, TAU);
      const g = ctx.createRadialGradient(x + lx, y + ly, 0.2, x, y, 2.4); g.addColorStop(0, tint(col, 0.35)); g.addColorStop(1, tint(col, -0.4));
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(30,20,10,.5)'; ctx.lineWidth = 0.35; ctx.stroke();
    }
    eye(ctx, 18.5, -3.2, 1.3, 1.1, '#2a1a0a'); eye(ctx, 18.5, 3.2, 1.3, 1.1, '#2a1a0a');
    plainEll(ctx, 21.5, -1.5, 0.5, 0.5, '#2a1a0a'); plainEll(ctx, 21.5, 1.5, 0.5, 0.5, '#2a1a0a');
    if (Math.sin(t * 2) > 0.7) { line(ctx, [22, 0, 27, 0], '#2f4f8f', 2); plainLine(ctx, [26, 0, 28, -1], '#2f4f8f', 1.2); plainLine(ctx, [26, 0, 28, 1], '#2f4f8f', 1.2); }
  },
  // Oblong turtle: a narrow dark shell with ridged scutes, a neck longer than the shell, webbed clawed feet.
  turtle(ctx, o, t) {
    const pad = o.moving ? Math.sin(t * 5) * 0.4 : 0;
    for (const [x, s, k] of [[12, -1, 1], [12, 1, -1], [-14, -1, -1], [-14, 1, 1]]) {
      ctx.save(); ctx.translate(x, s * 14); ctx.rotate(s * (0.5 + pad * k));
      ell(ctx, 0, s * 4, 4.2, 8, '#5d5a3a', 0, 'scale');
      for (let c = -1; c <= 1; c++) plainLine(ctx, [c * 1.8, s * 10, c * 2.4, s * 13.5], '#2a2818', 0.9);
      ctx.restore();
    }
    line(ctx, [-24, 0, -33, 0], '#5d5a3a', 3.5);
    ell(ctx, 0, 0, 25, 18, '#3e3626', 0, 'none');
    ell(ctx, 0, 0, 21, 14.5, '#5a4c30', 0, 'scale');
    // scutes with a lit ridge
    const [lx, ly] = lightDir(ctx);
    for (const [cx, cy, rx, ry] of [[-13, 0, 6, 5], [-1, 0, 7, 5.5], [12, 0, 6, 5], [-8, -9, 6, 3.5], [4, -9.5, 6, 3.5], [-8, 9, 6, 3.5], [4, 9.5, 6, 3.5], [15, -7, 4, 3], [15, 7, 4, 3], [-18, -6, 4, 3], [-18, 6, 4, 3]]) {
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
      const g = ctx.createRadialGradient(cx + lx * rx * 0.4, cy + ly * ry * 0.4, 1, cx, cy, rx); g.addColorStop(0, '#7a6a42'); g.addColorStop(1, '#3e3424');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#2a2416'; ctx.lineWidth = 0.7; ctx.stroke();
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(cx, cy, rx * k / 4, ry * k / 4, 0, 0, TAU); ctx.strokeStyle = 'rgba(30,25,15,.3)'; ctx.lineWidth = 0.4; ctx.stroke(); }
    }
    const nk = Math.sin(t * 2) * 4;
    line(ctx, [22, 0, 34, nk * 0.5, 46, nk], '#6b6844', 6);
    for (let k = 0; k < 5; k++) plainLine(ctx, [25 + k * 4, nk * k / 6 - 3, 25 + k * 4, nk * k / 6 + 3], 'rgba(40,35,20,.35)', 0.6);
    ell(ctx, 50, nk, 6.5, 5, '#6b6844', 0, 'scale');
    eye(ctx, 53, nk - 3, 1.3, 1.3); eye(ctx, 53, nk + 3, 1.3, 1.3);
    plainEll(ctx, 56, nk, 1.5, 1.8, '#5a5838');
  },
  // Spider wasp (Pompilidae): black with orange wings and antennae, long legs.
  wasp(ctx, o, t) {
    const flap = Math.sin(t * 70) * 0.3;
    legs6r(ctx, 2, 18, '#d2691e', 1.3, t, true, { wide: 2.5 });
    for (const s of [-1, 1]) insectWing(ctx, 3, s * 2.5, 16, 4.6, s * (2.6 - flap), 'bee', { tint: 'rgba(230,130,40,.55)', vein: 'rgba(90,40,10,.6)' });
    ell(ctx, -12, 0, 10, 5.5, '#1a1a1a', 0, 'chitin'); bands(ctx, -12, 0, 10, 5.5, 5, 'rgba(90,90,90,.5)', 0.6);
    ell(ctx, -3, 0, 1.8, 1.5, '#1a1a1a', 0, 'chitin');
    ell(ctx, 3, 0, 5.5, 4.2, '#1a1a1a', 0, 'chitin');
    ell(ctx, 11, 0, 4, 4.2, '#1a1a1a', 0, 'chitin');
    facetEye(ctx, 12, -3, 1.6, 2, '#3a3a3a'); facetEye(ctx, 12, 3, 1.6, 2, '#3a3a3a');
    for (const s of [-1, 1]) antenna(ctx, 14, s * 2, s * 0.9, 4, s * 0.3, 9, 8, '#d2691e', 1);
  },
  paperWasp(ctx, o, t) {
    const flap = Math.sin(t * 70) * 0.3;
    legs6r(ctx, 2, 16, '#c8901e', 1.2, t, true, { wide: 2.4 });
    for (const s of [-1, 1]) insectWing(ctx, 3, s * 2.5, 15, 4.4, s * (2.6 - flap), 'bee', { tint: 'rgba(200,170,120,.5)' });
    ell(ctx, -12, 0, 10, 5.5, '#c8901e', 0, 'chitin');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-12, 0, 10, 5.5, 0, 0, TAU); ctx.clip(); for (let i = 0; i < 3; i++) { ctx.fillStyle = '#3a2a12'; ctx.fillRect(-19 + i * 5, -6, 2.2, 12); } ctx.restore();
    ell(ctx, -3, 0, 1.8, 1.5, '#2a1a0a', 0, 'chitin');
    ell(ctx, 3, 0, 5, 4, '#3a2a12', 0, 'chitin'); plainEll(ctx, 3, -2.5, 2.5, 0.8, '#c8901e'); plainEll(ctx, 3, 2.5, 2.5, 0.8, '#c8901e');
    ell(ctx, 10, 0, 4, 4.2, '#c8901e', 0, 'chitin');
    facetEye(ctx, 11, -3, 1.5, 1.9, '#2a1a0a'); facetEye(ctx, 11, 3, 1.5, 1.9, '#2a1a0a');
    for (const s of [-1, 1]) antenna(ctx, 13, s * 2, s * 0.9, 4, s * 0.3, 8, 8, '#3a2a12', 1);
  },
  dungBeetle(ctx, o, t) {
    legs6r(ctx, 2, 11, '#1a1a1a', 1.5, t, o.moving, { wide: 2.4 });
    for (const s of [-1, 1]) { line(ctx, [8, s * 4, 13, s * 9], '#1a1a1a', 2.4); for (let k = 0; k < 3; k++) plainLine(ctx, [10 + k * 1.2, s * (5.5 + k * 1.3), 11.5 + k * 1.2, s * (6.5 + k * 1.3)], '#1a1a1a', 0.8); }
    ell(ctx, -4, 0, 9, 7.5, '#1d1b17', 0, 'chitin');
    plainLine(ctx, [-12, 0, 4, 0], '#3a362e', 0.8);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) plainLine(ctx, [-12 + k * 0.5, s * (1.5 + k * 1.6), 3 - k * 1.5, s * (1.5 + k * 1.6)], 'rgba(70,65,55,.5)', 0.5);
    ell(ctx, 6, 0, 5, 6, '#24221d', 0, 'chitin');
    ell(ctx, 11, 0, 3, 5, '#2a2822', 0, 'chitin');
    plainEll(ctx, 11, -1.5, 1, 0.8, '#3a3a3a'); plainEll(ctx, 11, 1.5, 1, 0.8, '#3a3a3a');
  },
  // Western grey kangaroo grazing, from above: long thick tail behind, big haunches, a narrow
  // shoulder, small forearms, a long face with big ears.
  kangaroo(ctx, o, t) {
    Ground.contact(ctx, 0, 6, 34, 16, 0.4);
    ctx.beginPath(); ctx.moveTo(-18, -3); ctx.quadraticCurveTo(-40, -2, -52, 4); ctx.quadraticCurveTo(-40, 5, -18, 3); ctx.closePath();
    const tg = ctx.createLinearGradient(0, -4, 0, 5); tg.addColorStop(0, '#9a7a56'); tg.addColorStop(1, '#5a4030'); ctx.fillStyle = tg; ctx.fill();
    ell(ctx, -6, 0, 18, 12, '#8a6a48', 0, 'hair');
    fur(ctx, -6, 0, 17, 11, '#a08860', 110, 2.2, 27);
    for (const s of [-1, 1]) { ell(ctx, -8, s * 11, 9, 5, '#7a5a3a', s * 0.15, 'hair'); fur(ctx, -8, s * 11, 8, 4, '#9a7a56', 24, 1.6, 28); for (let k = -1; k <= 1; k++) plainLine(ctx, [-2 + k * 1.5, s * 14.5, 1 + k * 1.5, s * 17], '#2a1a10', 1.3); }
    ell(ctx, 8, 0, 8, 7, '#8a6a48', 0, 'hair');
    for (const s of [-1, 1]) { line(ctx, [10, s * 5, 15, s * 9], '#7a5a3a', 2.4); plainEll(ctx, 15.5, s * 9.5, 1.6, 1.2, '#3a2a1a'); }
    ell(ctx, 18, 0, 6.5, 5, '#9a7a56', 0, 'hair');
    ell(ctx, 26, 0, 6, 3.4, '#8a6a48', 0, 'hair');
    plainEll(ctx, 31.5, 0, 1.6, 1.4, '#1a1008');
    for (const s of [-1, 1]) { ell(ctx, 17, s * 6.5, 5, 2.4, '#7a5a3a', s * 0.7, 'hair'); plainEll(ctx, 17.5, s * 6.5, 3, 1.1, '#c8a080', s * 0.7); }
    eye(ctx, 22, -2.6, 1, 0.9, '#2a1a0a'); eye(ctx, 22, 2.6, 1, 0.9, '#2a1a0a');
  },
  // Motorbike frog: olive-green with a pale stripe, golden eyes, long legs folded at the sides.
  frog(ctx) {
    for (const s of [-1, 1]) { ell(ctx, -6, s * 7, 7, 3, '#4f8f3a', s * 0.5, 'wet'); ell(ctx, -11, s * 9, 3, 1.4, '#4a8a36', s * 0.9, 'wet'); ell(ctx, 6, s * 6, 4, 2, '#4f8f3a', -s * 0.5, 'wet'); }
    ell(ctx, 0, 0, 9, 7, '#5fa046', 0, 'wet');
    plainLine(ctx, [-8, 0, 7, 0], 'rgba(220,230,160,.5)', 1.5);
    const r = rng(9); for (let k = 0; k < 12; k++) plainEll(ctx, (r() - 0.5) * 15, (r() - 0.5) * 11, 1.2, 1, 'rgba(110,80,40,.4)');
    ell(ctx, 7, 0, 4.5, 4.4, '#5fa046', 0, 'wet');
    eye(ctx, 7.5, -3.3, 2.1, 2.1, '#d8a840'); eye(ctx, 7.5, 3.3, 2.1, 2.1, '#d8a840');
    plainEll(ctx, 7.5, -3.3, 1.2, 0.5, '#1a1008'); plainEll(ctx, 7.5, 3.3, 1.2, 0.5, '#1a1008');
  },
  smallAnt(ctx, o, t) {
    legs6r(ctx, 1, 12, '#1b1b1b', 1.1, t, true, { wide: 1.8 });
    ell(ctx, -8, 0, 5.5, 4.5, '#262626', 0, 'chitin'); bands(ctx, -8, 0, 5.5, 4.5, 3, 'rgba(120,120,120,.5)', 0.5);
    ell(ctx, -2.5, 0, 1.5, 1.3, '#262626', 0, 'chitin');
    ell(ctx, 2, 0, 4, 2.6, '#333', 0, 'chitin');
    ell(ctx, 8, 0, 3.8, 3.6, '#262626', 0, 'chitin');
    eye(ctx, 8.6, -2.4, 0.9, 0.7); eye(ctx, 8.6, 2.4, 0.9, 0.7);
    for (const s of [-1, 1]) antenna(ctx, 10, s * 1.6, s * 1.0, 4, s * 0.2, 7, 8, '#1b1b1b', 0.8);
  },
  springtail(ctx, o, t) {
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) ileg(ctx, 1 - i * 2, s * 0.8, s * (1.2 + i * 0.4), 6, '#6d6480', 0.7, s * 0.6, s * 0.3);
    ell(ctx, -2, 0, 6, 2.6, '#8a7fa3', 0, 'chitin'); bands(ctx, -2, 0, 6, 2.6, 4, 'rgba(60,50,80,.5)', 0.4);
    ell(ctx, 4.5, 0, 2.6, 2.4, '#6d6480', 0, 'chitin');
    for (const s of [-1, 1]) antenna(ctx, 6, s * 1, s * 0.9, 2, s * 0.6, 3, 4, '#6d6480', 0.7);
    if (o.hop > 0) line(ctx, [-8, 0, -13, -2, -13, 2], '#6d6480', 1);
  },
  // Green looper caterpillar: plump segments, a pale side line, true legs at the front.
  caterpillar(ctx, o, t) {
    const wig = o.stunned ? 0 : Math.sin(t * 6);
    for (let k = 5; k >= 0; k--) { const y = Math.sin(k + t * 6) * wig * 1.2; ell(ctx, -k * 4.5, y, 3.9, 3.9, k % 2 ? '#6fae3c' : '#7fc24a', 0, 'grain'); plainEll(ctx, -k * 4.5, y + 2.6, 2.2, 0.6, 'rgba(240,250,200,.55)'); if (k > 1) for (const s of [-1, 1]) plainEll(ctx, -k * 4.5, y + s * 3.6, 1.1, 0.8, '#4d7a2a'); }
    ell(ctx, 3, 0, 3.6, 3.6, '#4d7a2a', 0, 'chitin');
    for (const s of [-1, 1]) { plainLine(ctx, [1, s * 2.5, 2, s * 5], '#2a4a18', 0.8); plainEll(ctx, 4.5, s * 1.4, 0.6, 0.6, '#1a2a10'); }
    if (o.stunned) { ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('z', -6, -8); }
  },
  fly(ctx, o, t) {
    const flap = o.state === 'flee' ? Math.sin(t * 80) * 0.5 : 0;
    legs6r(ctx, 0, 6, '#333', 0.7, t, false, { wide: 1.3, len: 0.5 });
    for (const s of [-1, 1]) insectWing(ctx, 0, s * 1.2, 7, 2.4, s * (2.5 - flap), 'fly', { tint: 'rgba(215,225,235,.6)' });
    ell(ctx, -4, 0, 4, 2.8, '#5a5a52', 0, 'chitin'); bands(ctx, -4, 0, 4, 2.8, 3, 'rgba(30,30,30,.5)', 0.4);
    ell(ctx, 1, 0, 2.8, 2.6, '#4a4a44', 0, 'chitin'); plainLine(ctx, [-1, -0.9, 3, -0.9], '#222', 0.6); plainLine(ctx, [-1, 0.9, 3, 0.9], '#222', 0.6);
    facetEye(ctx, 4, -1.6, 1.4, 1.5, '#a0302a'); facetEye(ctx, 4, 1.6, 1.4, 1.5, '#a0302a');
  },
  gilgie(ctx, o, t) {
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) line(ctx, [-2 + i * 3, s * 3, -1 + i * 3, s * 8], '#5a4630', 1);
    for (const s of [-1, 1]) { line(ctx, [6, s * 3, 12, s * 7], '#5a4630', 2); ell(ctx, 15, s * 8, 4.2, 2.5, '#6a5238', s * 0.4, 'chitin'); plainLine(ctx, [17, s * 9, 19.5, s * 7.5], '#4a3620', 1); }
    ell(ctx, 2, 0, 8, 5, '#6a5238', 0, 'chitin'); plainLine(ctx, [-5, 0, 9, 0], 'rgba(40,25,10,.4)', 0.6);
    for (let k = 0; k < 5; k++) { ell(ctx, -8 - k * 3.2, 0, 3.4 - k * 0.3, 3.6 - k * 0.3, '#6a5238', 0, 'chitin'); }
    ell(ctx, -25, 0, 3, 5, '#5a4630', 0, 'chitin'); for (const s of [-1, 1]) plainEll(ctx, -26, s * 3, 2.4, 1.8, '#5a4630', s * 0.5);
    eye(ctx, 9, -2.2, 0.9, 0.9); eye(ctx, 9, 2.2, 0.9, 0.9);
    for (const s of [-1, 1]) line(ctx, [10, s * 1, 20, s * 4], '#5a4630', 0.6);
  },
  divingBeetle(ctx, o, t) {
    for (const s of [-1, 1]) { line(ctx, [-2, s * 4, -12, s * 10 + Math.sin(t * 8) * 2], '#2a2a1a', 1.8); for (let k = 0; k < 5; k++) plainLine(ctx, [-5 - k * 1.5, s * (6 + k * 1.2), -5.5 - k * 1.5, s * (8 + k * 1.2)], '#2a2a1a', 0.5); }
    ell(ctx, -1, 0, 9, 6.5, '#2f3a1e', 0, 'chitin');
    plainLine(ctx, [-9, 0, 5, 0], '#1a2010', 0.8);
    ctx.beginPath(); ctx.ellipse(-1, 0, 8.4, 5.9, 0, 0, TAU); ctx.strokeStyle = 'rgba(200,180,80,.5)'; ctx.lineWidth = 0.8; ctx.stroke();
    ell(ctx, 8, 0, 3.5, 4.5, '#2a3418', 0, 'chitin');
    eye(ctx, 9.5, -2.2, 1, 1); eye(ctx, 9.5, 2.2, 1, 1);
    plainEll(ctx, -10, 0, 2.5, 2, 'rgba(220,240,255,.8)');
  },

  // ------------------------------------------------------------------ cows and pats
  // Friesian cow from above: black patches on white with a hair sheen, pink muzzle, spine line.
  cow(ctx, o, t) {
    const sw = Math.sin(t * 3 + (o.x || 0)) * 0.5;
    line(ctx, [-44, 0, -60, sw * 14], '#3a2a1e', 2.5); ell(ctx, -61, sw * 14, 3.4, 3.2, '#1a1a1a', 0, 'hair');
    for (const [x, y] of [[26, -22], [26, 22], [-30, -22], [-30, 22]]) ell(ctx, x, y, 6, 4, '#2a2a2a', 0, 'hair');
    ell(ctx, 0, 0, 46, 26, '#f1ede4', 0, 'hair');
    fur(ctx, 0, 0, 44, 24, '#e8e2d4', 220, 2.2, 31);
    for (const [x, y, rx, ry, a] of [[-16, -10, 14, 10, 0.4], [14, 12, 12, 8, -0.3], [-30, 12, 8, 6, 0], [30, -8, 7, 5, 0.3]]) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a, 0, TAU); ctx.clip();
      ell(ctx, x, y, rx * 1.3, ry * 1.3, '#262626', a, 'hair'); fur(ctx, x, y, rx, ry, '#3a3a3a', 40, 2, 32 + x); ctx.restore();
    }
    plainLine(ctx, [-40, 0, 40, 0], 'rgba(90,80,70,.35)', 1.6);
    plainEll(ctx, -8, -12, 18, 5, 'rgba(255,255,255,.25)', 0.1);
    ell(ctx, 52, 0, 15, 12, '#f1ede4', 0, 'hair');
    ell(ctx, 56, 0, 8, 10, '#2a2a2a', 0, 'hair');
    ell(ctx, 66, 0, 6, 8, '#e8b4a6', 0, 'wet'); plainEll(ctx, 68, -2.5, 1.4, 1, '#8a5a50'); plainEll(ctx, 68, 2.5, 1.4, 1, '#8a5a50');
    for (const s of [-1, 1]) { ell(ctx, 48, s * 14, 6.5, 3.2, '#2a2a2a', -s * 0.5, 'hair'); plainEll(ctx, 48.5, s * 14, 3.8, 1.5, '#e8b4a6', -s * 0.5); }
    eye(ctx, 58, -5, 1.6, 1.4, '#3a2a1a'); eye(ctx, 58, 5, 1.6, 1.4, '#3a2a1a');
  },
  pat(ctx, o) {
    const s = o.size === undefined ? 1 : o.size, f = o.fresh === undefined ? 1 : o.fresh;
    const c = (a, b) => Math.round(a + (b - a) * (1 - f));
    const col = 'rgb(' + c(74, 150) + ',' + c(52, 128) + ',' + c(30, 96) + ')';
    const hex = '#' + [c(74, 150), c(52, 128), c(30, 96)].map(v => v.toString(16).padStart(2, '0')).join('');
    Ground.contact(ctx, 0, 0, 24 * s, 20 * s, 0.4);
    ell(ctx, 0, 0, 22 * s, 18 * s, hex, 0, f > 0.5 ? 'wet' : 'soil');
    // concentric ridges, glossy when fresh, cracked when dry
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(-2 * s, -1 * s, 17 * s * k / 4, 13 * s * k / 4, 0, 0, TAU); ctx.strokeStyle = f > 0.5 ? 'rgba(20,12,5,.35)' : 'rgba(255,240,200,.25)'; ctx.lineWidth = 1.2; ctx.stroke(); }
    if (f > 0.5) { plainEll(ctx, -7 * s, -7 * s, 6 * s, 3 * s, 'rgba(255,255,255,.35)', -0.4); plainEll(ctx, 4 * s, 5 * s, 3 * s, 1.5 * s, 'rgba(255,255,255,.2)', 0.3); }
    else { ctx.strokeStyle = 'rgba(50,35,20,.6)'; ctx.lineWidth = 0.9; for (const pts of [[-12, -3, -4, 2, 6, -4, 13, 1], [-6, -10, -2, -3, 3, 6], [2, 10, 8, 4]]) { ctx.beginPath(); ctx.moveTo(pts[0] * s, pts[1] * s); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i] * s, pts[i + 1] * s); ctx.stroke(); } }
    if (o.eggs) for (let i = 0; i < o.eggs * 5; i++) ell(ctx, Math.cos(i * 2.4) * 9 * s, Math.sin(i * 2.4) * 7 * s, 1.6, 0.9, '#fbf7ea', i, 'none');
    if (o.maggots) for (let i = 0; i < o.maggots * 3; i++) { const w = Math.sin((o.t || 0) * 6 + i) * 2; ell(ctx, Math.cos(i * 1.7) * 11 * s + w, Math.sin(i * 1.7) * 8 * s, 3, 1.4, '#f2ead0', i + w * 0.2, 'none'); }
  },

  // ------------------------------------------------------------------ plants
  // Kangaroo paw, Anigozanthos manglesii: a leaning red furry stalk with a one-sided row of tubular
  // flowers, red at the base and green at the tips, which split into six claws; strap leaves below.
  paw(ctx, o) {
    const r = rng(o.seed || 5);
    Ground.contact(ctx, 0, 2, 20, 14, 0.3);
    for (let i = 0; i < 7; i++) { ctx.save(); ctx.rotate(i * 0.9 + 0.2); leafDraw(ctx, 18 + r() * 6, 2.2, '#5a8a3a'); ctx.restore(); }
    ctx.save(); ctx.rotate(-0.5);
    line(ctx, [0, 0, 26, -6], '#b02a1e', 3); plainLine(ctx, [2, -1, 24, -6.5], 'rgba(255,120,100,.4)', 1);
    for (let i = 0; i < 6; i++) {
      const x = 8 + i * 3.6, y = -2 - i * 0.85, a = -0.9 - i * 0.08;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ell(ctx, 4, 0, 4.5, 1.7, '#c0301e', 0, 'hair'); fuzz(ctx, 4, 0, 4.5, 1.7, 12, 0.7, 'rgba(255,120,100,.7)', 0.4);
      ell(ctx, 11, 0, 4.2, 1.5, '#4aa030', 0, 'hair'); fuzz(ctx, 11, 0, 4.2, 1.5, 12, 0.6, 'rgba(160,240,120,.7)', 0.4);
      for (const k of [-1, 0, 1]) plainLine(ctx, [14.5, k * 0.8, 17.5, k * 2.2], '#3e8a1e', 1.1);
      ctx.restore();
    }
    ctx.restore();
  },
  // Grevillea: a spider flower of curled red styles rising from pink tubes, over divided leaves.
  grevillea(ctx, o) {
    const r = rng(o.seed || 6), pale = o.nectar === false;
    Ground.contact(ctx, 0, 2, 18, 13, 0.3);
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * 1.05); for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(5 + k * 4, 0); ctx.rotate((k % 2 ? 0.6 : -0.6)); leafDraw(ctx, 7, 1.1, '#4f7a3a'); ctx.restore(); } plainLine(ctx, [0, 0, 16, 0], '#4a6a30', 0.8); ctx.restore(); }
    for (let i = 0; i < 10; i++) {
      const a = i * 0.63 + r() * 0.2, l = 8 + r() * 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a + 0.4) * l * 0.7, Math.sin(a + 0.4) * l * 0.7, Math.cos(a) * l, Math.sin(a) * l);
      ctx.strokeStyle = pale ? '#e8a0a0' : '#d8303a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,200,200,.4)'; ctx.lineWidth = 0.6; ctx.stroke();
      plainEll(ctx, Math.cos(a) * (l + 1), Math.sin(a) * (l + 1), 1.4, 1.4, '#f2d040'); plainEll(ctx, Math.cos(a) * (l + 0.6), Math.sin(a) * (l + 0.6) - 0.5, 0.5, 0.5, '#fff8d0');
    }
    for (let i = 0; i < 6; i++) ell(ctx, Math.cos(i * 1.05) * 2.4, Math.sin(i * 1.05) * 2.4, 1.8, 1.4, pale ? '#e0b0b0' : '#e0607a', i * 1.05, 'grain');
  },
  // Pink everlasting: many narrow papery pointed bracts with a crease, a yellow disc with a dark ring.
  everlasting(ctx, o) {
    const lf = o.leaf === undefined ? 1 : o.leaf, pale = o.nectar === false;
    Ground.contact(ctx, 0, 2, 16, 12, 0.25);
    rosette(ctx, 6, 17, 3.2, '#5f9a3a', { turn: 0.3 }, lf);
    for (let i = 0; i < 20; i++) { ctx.save(); ctx.rotate(i * TAU / 20 + (i % 2) * 0.1); ctx.translate(2.5, 0); petal(ctx, i % 2 ? 11 : 9.5, 1.5, pale ? '#e8c8d0' : '#f2a0c0', { pointed: true, baseDark: -0.05 }); ctx.restore(); }
    ell(ctx, 0, 0, 4.6, 4.6, '#e8b030', 0, 'grain');
    for (let k = 0; k < 18; k++) { const b = k * 2.4, rd = 4 * Math.sqrt(k / 18); plainEll(ctx, Math.cos(b) * rd, Math.sin(b) * rd, 0.6, 0.6, k > 11 ? '#8a5a10' : '#f8d060'); }
  },
  // Capeweed: a rosette of lobed grey-green woolly leaves, yellow rays with a dark base, a blackish centre.
  capeweed(ctx, o) {
    const lf = o.leaf === undefined ? 1 : o.leaf;
    Ground.contact(ctx, 0, 2, 16, 12, 0.25);
    for (let i = 0; i < 7; i++) {
      ctx.save(); ctx.rotate(i * 0.9);
      const L = 13 * (0.7 + lf * 0.3);
      ctx.beginPath(); ctx.moveTo(0, 0); for (let k = 1; k <= 5; k++) ctx.lineTo(L * k / 5, -(k % 2 ? 4.8 : 2.4) * Math.sin(k / 5.5 * Math.PI)); ctx.lineTo(L, 0); for (let k = 5; k >= 1; k--) ctx.lineTo(L * k / 5, (k % 2 ? 4.8 : 2.4) * Math.sin(k / 5.5 * Math.PI)); ctx.closePath();
      const g = ctx.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, '#a8bc8c'); g.addColorStop(0.5, '#8aa070'); g.addColorStop(1, '#6a8054');
      ctx.fillStyle = g; ctx.fill(); if (Shade.rich) Tex.fillPath(ctx, 'leaf', 1.3, 0.25, 'multiply'); ctx.strokeStyle = '#4a6038'; ctx.lineWidth = 0.4; ctx.stroke();
      plainLine(ctx, [1, 0, L * 0.9, 0], 'rgba(230,240,220,.5)', 0.7);
      chewed(ctx, L / 2, L / 2, 4.5, lf, i);
      ctx.restore();
    }
    for (let i = 0; i < 16; i++) { ctx.save(); ctx.rotate(i * TAU / 16); ctx.translate(2, 0); petal(ctx, 7, 1.6, '#f2d040', { baseDark: -0.5 }); ctx.restore(); }
    ell(ctx, 0, 0, 3.2, 3.2, '#2a2418', 0, 'grain'); plainEll(ctx, -0.8, -0.8, 1, 0.7, 'rgba(255,255,255,.3)');
  },
  // Dianella: a cluster of nodding blue six-petalled flowers with yellow anthers over strap leaves.
  dianella(ctx, o) {
    const full = o.pollen;
    Ground.contact(ctx, 0, 2, 14, 10, 0.25);
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * 1.26 + 0.5); leafDraw(ctx, 16, 1.8, '#3f7a44'); ctx.restore(); }
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * TAU / 6); ctx.translate(1.5, 0); petal(ctx, 9, 3.2, full ? '#5b5fc7' : '#a9abd8', { pointed: true }); ctx.restore(); }
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.5; plainLine(ctx, [0, 0, Math.cos(a) * 3.5, Math.sin(a) * 3.5], '#e8e0a0', 0.6); ell(ctx, Math.cos(a) * 4, Math.sin(a) * 4, 1.6, 1, full ? '#f4d03f' : '#d9cf9a', a, 'grain'); }
  },
  // Hibbertia (guinea flower): five broad notched yellow petals around a ring of stamens.
  hibbertia(ctx, o) {
    const full = o.pollen;
    Ground.contact(ctx, 0, 2, 14, 10, 0.25);
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * 1.05 + 0.3); leafDraw(ctx, 9, 2.2, '#4a7a3a'); ctx.restore(); }
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * TAU / 5); ctx.translate(1.5, 0); petal(ctx, 11, 5.5, full ? '#ffd23f' : '#f3e7b3', {}); plainLine(ctx, [11, -1.2, 12.5, 0, 11, 1.2], tint(full ? '#ffd23f' : '#f3e7b3', -0.3), 0.6); ctx.restore(); }
    ell(ctx, 0, 0, 3.4, 3.4, full ? '#e0a000' : '#cbb978', 0, 'grain');
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; plainEll(ctx, Math.cos(a) * 3.6, Math.sin(a) * 3.6, 0.7, 0.7, full ? '#f8e080' : '#e0d8a8'); }
  },
  fungus(ctx, o) {
    const a = o.amount === undefined ? 1 : o.amount;
    for (let i = 0; i < 4; i++) {
      const x = Math.cos(i * 1.6) * 7, y = Math.sin(i * 1.6) * 6, rr = 5 * a + 2;
      Ground.contact(ctx, x, y, rr * 1.3, rr, 0.35);
      ell(ctx, x, y, rr, rr, i % 2 ? '#c89a6a' : '#e0b888', 0, 'grain');
      for (let k = 0; k < 10; k++) { const b = k / 10 * TAU; plainLine(ctx, [x + Math.cos(b) * rr * 0.35, y + Math.sin(b) * rr * 0.35, x + Math.cos(b) * rr * 0.92, y + Math.sin(b) * rr * 0.92], 'rgba(120,80,50,.3)', 0.5); }
      ell(ctx, x, y, rr * 0.32, rr * 0.3, '#8a6440', 0, 'grain');
    }
  },
  lichen(ctx, o) {
    const a = o.amount === undefined ? 1 : o.amount, r = rng(4);
    for (let i = 0; i < 7; i++) {
      const x = Math.cos(i * 0.9) * 9 * a, y = Math.sin(i * 0.9) * 7 * a, rx = 4 + 2 * a, ry = 3 + 2 * a;
      ell(ctx, x, y, rx, ry, i % 2 ? '#a8b888' : '#c0cc9a', i, 'leaf');
      for (let k = 0; k < 8; k++) plainEll(ctx, x + (r() - 0.5) * rx * 1.4, y + (r() - 0.5) * ry * 1.4, 0.8, 0.6, 'rgba(90,110,70,.5)');
    }
  },
  deadLeaf(ctx, o) {
    const a = o.amount === undefined ? 1 : o.amount;
    Ground.leafShape(ctx, 0, 0, 16 * (0.4 + a * 0.6), 7, 0, '#a8783a', 0.3, 0.7);
  },
  log(ctx, o) {
    Ground.contact(ctx, 4, 8, 70, 22, 0.4);
    Ground.bark(ctx, -60, -14, 120, 28, 5, { axis: 'x', color: '#6a5034' });
    Ground.endGrain(ctx, 60, 0, 8, 14);
  },
  woodChip(ctx) { ctx.save(); ctx.rotate(0.3); Ground.bark(ctx, -6, -2.5, 12, 5, 3, { axis: 'x', color: '#a07848' }); ctx.restore(); },
  mud(ctx) { ell(ctx, 0, 0, 6, 5, '#6b4a2a', 0, 'soil'); plainEll(ctx, -2, -2, 2, 1.2, 'rgba(255,255,255,.2)'); },
  cone(ctx) {
    Ground.contact(ctx, 0, 2, 12, 8, 0.35);
    ell(ctx, 0, 0, 10, 7, '#6a4a2a', 0, 'bark');
    for (let k = 0; k < 24; k++) { const b = k * 2.4, rd = 8 * Math.sqrt(k / 24); ell(ctx, Math.cos(b) * rd, Math.sin(b) * rd * 0.75, 1.8, 1.3, k % 2 ? '#8a6a44' : '#5a4028', b, 'none'); }
  },
  feather(ctx, o) {
    const col = o.color || '#1c1c1c';
    plainLine(ctx, [-14, 0, 14, 0], '#444', 1);
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -5.5, 14, -0.5); ctx.quadraticCurveTo(0, 5.5, -12, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, tint(col, 0.3)); g.addColorStop(1, tint(col, -0.3));
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); for (let k = -10; k < 13; k += 1.6) { ctx.moveTo(k, 0); ctx.lineTo(k + 2.5, -4 * (1 - Math.abs(k) / 15)); ctx.moveTo(k, 0); ctx.lineTo(k + 2.5, 4 * (1 - Math.abs(k) / 15)); }
    ctx.strokeStyle = tint(col, 0.2); ctx.globalAlpha = 0.5; ctx.lineWidth = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
    if (o.band) plainEll(ctx, -5, 0, 3, 4, o.band);
  },
});
