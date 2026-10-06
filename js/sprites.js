'use strict';
// All sprites are drawn top-down at the origin, facing +x.

const TAU = Math.PI * 2;

function rng(seed) {
  return function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function ell(ctx, x, y, rx, ry, fill, rot) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

function line(ctx, pts, color, width) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// Jointed leg: from (x,y) out at angle a, then bends.
function leg(ctx, x, y, a, l1, l2, bend, color, width) {
  const kx = x + Math.cos(a) * l1, ky = y + Math.sin(a) * l1;
  const b = a + bend;
  line(ctx, [x, y, kx, ky, kx + Math.cos(b) * l2, ky + Math.sin(b) * l2], color, width);
}

// Six insect legs from a thorax centred at x.
function insectLegs(ctx, x, len, color, width, t, moving) {
  const w = moving ? Math.sin(t * 18) * 0.3 : 0;
  for (let i = 0; i < 3; i++) {
    for (const s of [-1, 1]) {
      const ph = (i === 1 ? -w : w) * s;
      const a = s * (Math.PI / 2 + (i - 1) * 0.75) + ph;
      leg(ctx, x + (1 - i) * 3, 0, a, len * 0.5, len * 0.6, s * (i - 1) * 0.5 - s * 0.2, color, width);
    }
  }
}

function wings(ctx, x, y, rx, ry, flap, fill) {
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(x, y * s);
    ctx.rotate(s * (-0.35 + flap));
    ell(ctx, -rx * 0.6, 0, rx, ry, fill);
    ctx.strokeStyle = 'rgba(60,60,80,.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }
}

const Sprites = {
  // Bull ant (Myrmecia): red head and thorax, black gaster, long toothed mandibles.
  ant(ctx, o, t) {
    insectLegs(ctx, 2, 16, '#3a160a', 1.8, t, o.moving);
    ell(ctx, -13, 0, 9, 7, '#1d1714');
    ell(ctx, -4, 0, 2.6, 2.2, '#9c2f17');
    ell(ctx, 2, 0, 6.5, 3.8, '#b8361c');
    ell(ctx, 11, 0, 5.2, 5, '#b8361c');
    ell(ctx, 12, -3.6, 2.1, 1.6, '#111');
    ell(ctx, 12, 3.6, 2.1, 1.6, '#111');
    const open = o.stingT > 0 ? 1.5 : 0;
    line(ctx, [15, -2, 23, -3.5 - open, 25, -1.5], '#e8c040', 1.8);
    line(ctx, [15, 2, 23, 3.5 + open, 25, 1.5], '#e8c040', 1.8);
    line(ctx, [14, -3, 19, -9, 26, -8], '#3a160a', 1.1);
    line(ctx, [14, 3, 19, 9, 26, 8], '#3a160a', 1.1);
    if (o.stingT > 0) line(ctx, [-21, 0, -27, 0], '#e8c040', 1.5);
    if (o.carry) {
      ctx.save();
      ctx.translate(27, 0);
      ctx.scale(0.8, 0.8);
      Sprites[o.carry](ctx, { stunned: true }, t);
      ctx.restore();
    }
  },

  // Blue-banded bee (Amegilla): black abdomen with blue bands, buff fuzzy thorax.
  bee(ctx, o, t) {
    const flap = Math.sin(t * (o.buzz ? 90 : 50)) * 0.35;
    insectLegs(ctx, 1, 10, '#222', 1.3, t, false);
    ell(ctx, -8, 0, 10, 7, '#141414');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-8, 0, 10, 7, 0, 0, TAU);
    ctx.clip();
    ctx.fillStyle = '#4fc3f7';
    for (let k = 0; k < 4; k++) ctx.fillRect(-16 + k * 4.2, -8, 2.1, 16);
    ctx.restore();
    ell(ctx, 2, 0, 6, 6, '#c8a060');
    ell(ctx, 9, 0, 4, 5, '#1d1d1d');
    ell(ctx, 10, -3.4, 2.4, 1.8, '#7a9f6a');
    ell(ctx, 10, 3.4, 2.4, 1.8, '#7a9f6a');
    line(ctx, [12, -2, 17, -6], '#111', 1);
    line(ctx, [12, 2, 17, 6], '#111', 1);
    if (o.load > 0) {
      ell(ctx, -3, -8, 1.5 + o.load, 1.5 + o.load * 0.6, '#f39c12');
      ell(ctx, -3, 8, 1.5 + o.load, 1.5 + o.load * 0.6, '#f39c12');
    }
    wings(ctx, 2, 4, 10, 4, flap, 'rgba(230,240,255,.6)');
    if (o.buzz) {
      for (let i = 0; i < 3; i++) {
        const r = 16 + ((t * 60 + i * 6) % 18);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.strokeStyle = 'rgba(255,210,63,' + (1 - (r - 16) / 18) * 0.7 + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  },

  // Coastal peacock spider (Maratus speciosus) male.
  spider(ctx, o, t) {
    const dance = o.dance > 0;
    const w = o.moving ? Math.sin(t * 16) * 0.2 : 0;
    const angles = [0.55, 1.15, 1.9, 2.5];
    for (let i = 0; i < 4; i++) {
      for (const s of [-1, 1]) {
        let a = s * angles[i] + (i % 2 ? w : -w) * s;
        let l = i === 2 ? 9 : 7;
        if (dance && i === 2) { a = s * (1.6 + Math.sin(t * 12) * 0.4); l = 12; }
        const col = i === 2 && dance ? '#ddd' : '#2b2018';
        leg(ctx, 3, 0, a, l, l * 0.9, s * 0.4, col, 1.5);
      }
    }
    if (dance) {
      // Raised abdominal flap with orange side fringes.
      ctx.save();
      ctx.translate(-8, 0);
      ctx.beginPath();
      ctx.ellipse(-2, 0, 9, 15, 0, 0, TAU);
      ctx.fillStyle = '#ff8c1a';
      ctx.fill();
      ctx.restore();
    }
    ell(ctx, -8, 0, dance ? 8 : 7, dance ? 12 : 6, '#2c6fb0');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-8, 0, dance ? 8 : 7, dance ? 12 : 6, 0, 0, TAU);
    ctx.clip();
    ctx.fillStyle = '#ff8c1a';
    for (let k = -2; k <= 2; k++) ctx.fillRect(-16, k * 4 - 0.8, 16, 1.6);
    ctx.fillStyle = '#5ec8d8';
    ctx.fillRect(-16, -0.8, 16, 1.6);
    ctx.restore();
    if (!dance) {
      ell(ctx, -8, -6, 4, 1.3, '#ff8c1a');
      ell(ctx, -8, 6, 4, 1.3, '#ff8c1a');
    }
    ell(ctx, 4, 0, 6.5, 5.5, '#2b2018');
    ell(ctx, 9.3, -2.3, 2.2, 2.2, '#0b0b0b');
    ell(ctx, 9.3, 2.3, 2.2, 2.2, '#0b0b0b');
    ell(ctx, 9.9, -2.8, 0.6, 0.6, '#fff');
    ell(ctx, 9.9, 1.8, 0.6, 0.6, '#fff');
    ell(ctx, 8.5, -4.6, 1, 1, '#0b0b0b');
    ell(ctx, 8.5, 4.6, 1, 1, '#0b0b0b');
  },

  femaleSpider(ctx, o, t) {
    for (let i = 0; i < 4; i++) {
      for (const s of [-1, 1]) leg(ctx, 3, 0, s * [0.55, 1.15, 1.9, 2.5][i], 7, 6, s * 0.4, '#6b5238', 1.5);
    }
    ell(ctx, -8, 0, 7.5, 6.5, '#8a6d4c');
    ell(ctx, -9, 0, 4, 2.5, '#a88a63');
    ell(ctx, 4, 0, 6.5, 5.5, '#6b5238');
    ell(ctx, 9.3, -2.3, 2.2, 2.2, '#0b0b0b');
    ell(ctx, 9.3, 2.3, 2.2, 2.2, '#0b0b0b');
    if (o.heart) {
      ctx.fillStyle = '#e74c3c';
      ctx.font = '16px sans-serif';
      ctx.fillText('♥', -4, -14 - Math.sin(t * 4) * 3);
    }
  },

  // Blue skimmer (Orthetrum caledonicum) male: powder-blue abdomen.
  dragonfly(ctx, o, t) {
    const flap = Math.sin(t * 40) * 0.12;
    for (let k = 0; k < 8; k++) ell(ctx, -6 - k * 3.6, 0, 2.4, 2.2 - k * 0.08, k === 7 ? '#2d3e50' : '#8cc4ea');
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.rotate(s * (0.12 + flap));
      ell(ctx, 4, s * 14, 3.6, 13, 'rgba(235,245,255,.55)');
      ell(ctx, -3, s * 14, 4.6, 14, 'rgba(235,245,255,.55)');
      ctx.restore();
    }
    ell(ctx, 2, 0, 6, 4.5, '#6f8fa6');
    ell(ctx, 9, -3.2, 3.8, 3.6, '#2f5d7a');
    ell(ctx, 9, 3.2, 3.8, 3.6, '#2f5d7a');
    if (o.dart > 0) {
      for (let i = 0; i < 3; i++) line(ctx, [-36 - i * 6, -6 + i * 6, -48 - i * 6, -6 + i * 6], 'rgba(255,255,255,.6)', 2);
    }
  },

  // --- prey ---
  termite(ctx, o, t) {
    insectLegs(ctx, 0, 6, '#c9b48a', 0.9, t, true);
    ell(ctx, -6, 0, 5, 3.3, '#f1e6c8');
    ell(ctx, 0, 0, 2.5, 2.4, '#ead9b0');
    ell(ctx, 4.5, 0, 3, 2.6, '#a8742e');
  },
  caterpillar(ctx, o, t) {
    const wig = o.stunned ? 0 : Math.sin(t * 6);
    for (let k = 5; k >= 0; k--) ell(ctx, -k * 4.5, Math.sin(k + t * 6) * wig * 1.2, 3.8, 3.8, k % 2 ? '#6fae3c' : '#7fc24a');
    ell(ctx, 3, 0, 3.6, 3.6, '#4d7a2a');
    if (o.stunned) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('z', -6, -8);
    }
  },
  fly(ctx, o, t) {
    const flap = o.state === 'flee' ? Math.sin(t * 80) * 0.5 : 0;
    insectLegs(ctx, 0, 5, '#333', 0.8, t, false);
    wings(ctx, 0, 2, 6, 2.6, flap + 0.2, 'rgba(220,230,240,.7)');
    ell(ctx, -4, 0, 4, 2.8, '#555');
    ell(ctx, 1, 0, 2.8, 2.6, '#444');
    ell(ctx, 4, -1.6, 1.4, 1.5, '#a0302a');
    ell(ctx, 4, 1.6, 1.4, 1.5, '#a0302a');
  },
  mosquito(ctx, o, t) {
    const flap = Math.sin(t * 90) * 0.4;
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) leg(ctx, 0, 0, s * (1 + i * 0.6), 4, 5, s * 0.3, '#3b3b3b', 0.6);
    wings(ctx, 0, 1.5, 4.5, 1.6, flap, 'rgba(220,230,240,.7)');
    ell(ctx, -4, 0, 4, 1.2, '#4a4a4a');
    ell(ctx, 0.5, 0, 1.8, 1.6, '#3a3a3a');
    line(ctx, [2, 0, 6, 0], '#3a3a3a', 0.7);
  },

  // --- predators ---
  echidna(ctx, o, t) {
    const bob = o.moving ? Math.sin(t * 6) : 0;
    for (const [x, s] of [[14, -1], [14, 1], [-12, -1], [-12, 1]]) ell(ctx, x + bob * s, s * 17, 4, 3, '#3a2414');
    ell(ctx, 0, 0, 26, 19, '#4f321c');
    const r = rng(7);
    for (let i = 0; i < 70; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.9;
      const x = Math.cos(a) * 24 * d, y = Math.sin(a) * 17 * d;
      line(ctx, [x, y, x - 5, y + (y > 0 ? 1.5 : -1.5)], '#f2e6c8', 1.6);
      ell(ctx, x - 5, y + (y > 0 ? 1.5 : -1.5), 0.8, 0.8, '#222');
    }
    ell(ctx, 24, 0, 6, 6, '#5b3a21');
    line(ctx, [27, 0, 40, 0], '#2b1a0e', 4);
  },
  beeEater(ctx, o, t) {
    const flap = Math.sin(t * 14) * 0.25;
    line(ctx, [-18, -1, -40, -1], '#111', 1.4);
    line(ctx, [-18, 1, -40, 1], '#111', 1.4);
    ell(ctx, -16, 0, 9, 4, '#1f6f8b');
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.rotate(s * (0.15 + flap));
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(0, s * 34, -14, s * 30);
      ctx.lineTo(-8, 0);
      ctx.fillStyle = '#3d9a4a';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, s * 12);
      ctx.quadraticCurveTo(-10, s * 26, -14, s * 30);
      ctx.lineTo(-2, s * 18);
      ctx.fillStyle = '#d97b1e';
      ctx.fill();
      ctx.restore();
    }
    ell(ctx, 0, 0, 13, 6, '#48a858');
    ell(ctx, 12, 0, 6, 5, '#e3a12a');
    line(ctx, [10, -4.5, 16, -2.5], '#111', 1.6);
    line(ctx, [10, 4.5, 16, 2.5], '#111', 1.6);
    line(ctx, [17, 0, 27, 0], '#111', 1.8);
  },
  // Australian hobby: small dark falcon with long pointed wings.
  hobby(ctx, o, t) {
    const flap = Math.sin(t * 12) * 3;
    ctx.beginPath();
    ctx.moveTo(-10, -4); ctx.lineTo(-30, -7); ctx.lineTo(-32, 0); ctx.lineTo(-30, 7); ctx.lineTo(-10, 4);
    ctx.fillStyle = '#3d4450';
    ctx.fill();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(8, s * 3);
      ctx.lineTo(2, s * (26 + flap));
      ctx.lineTo(-16, s * (46 + flap));
      ctx.lineTo(-8, s * (24 + flap * 0.5));
      ctx.lineTo(-8, s * 3);
      ctx.closePath();
      ctx.fillStyle = '#4a5260';
      ctx.fill();
      line(ctx, [4, s * 10, -12, s * (40 + flap)], '#2d333d', 2);
    }
    ell(ctx, 0, 0, 14, 7, '#555e6b');
    ell(ctx, 13, 0, 6.5, 6, '#2a2f38');
    ell(ctx, 13, -4.5, 2.2, 1.2, '#d9d0b8');
    ell(ctx, 13, 4.5, 2.2, 1.2, '#d9d0b8');
    ell(ctx, 15, -2.6, 1.4, 1.4, '#e0a020');
    ell(ctx, 15, 2.6, 1.4, 1.4, '#e0a020');
    line(ctx, [19, 0, 22, 0], '#e0b040', 2.5);
  },
  // Oblong turtle (Chelodina oblonga): long-necked turtle of Perth wetlands.
  turtle(ctx, o, t) {
    const pad = o.moving ? Math.sin(t * 5) * 0.4 : 0;
    for (const [x, s, k] of [[12, -1, 1], [12, 1, -1], [-14, -1, -1], [-14, 1, 1]]) {
      ctx.save();
      ctx.translate(x, s * 14);
      ctx.rotate(s * (0.5 + pad * k));
      ell(ctx, 0, s * 4, 4, 8, '#5d5a3a');
      ctx.restore();
    }
    line(ctx, [-24, 0, -32, 0], '#5d5a3a', 3);
    ell(ctx, 0, 0, 25, 18, '#4a3f2a');
    ell(ctx, 0, 0, 20, 14, '#5c4d32');
    line(ctx, [-16, 0, 16, 0], '#3e3422', 1.2);
    for (const x of [-8, 6]) line(ctx, [x, -13, x, 13], '#3e3422', 1.2);
    const nk = Math.sin(t * 2) * 4;
    line(ctx, [22, 0, 34, nk * 0.5, 46, nk], '#6b6844', 6);
    ell(ctx, 50, nk, 6, 5, '#6b6844');
    ell(ctx, 53, nk - 3, 1.2, 1.2, '#111');
    ell(ctx, 53, nk + 3, 1.2, 1.2, '#111');
  },
  wasp(ctx, o, t) {
    const flap = Math.sin(t * 70) * 0.3;
    insectLegs(ctx, 2, 16, '#d2691e', 1.4, t, true);
    wings(ctx, 2, 3, 13, 4, flap, 'rgba(230,120,30,.6)');
    ell(ctx, -12, 0, 10, 5.5, '#1a1a1a');
    ell(ctx, -3, 0, 1.8, 1.5, '#1a1a1a');
    ell(ctx, 3, 0, 5.5, 4.2, '#1a1a1a');
    ell(ctx, 11, 0, 4, 4.2, '#1a1a1a');
    line(ctx, [14, -2, 19, -6, 22, -4], '#d2691e', 1.2);
    line(ctx, [14, 2, 19, 6, 22, 4], '#d2691e', 1.2);
  },

  // --- plants ---
  dianella(ctx, o) {
    const full = o.pollen;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate(i * TAU / 6);
      ell(ctx, 9, 0, 9, 4.5, full ? '#5b5fc7' : '#a9abd8');
      ctx.restore();
    }
    for (let i = 0; i < 6; i++) ell(ctx, Math.cos(i) * 3.5, Math.sin(i) * 3.5, 1.6, 2.5, full ? '#f4d03f' : '#d9cf9a', i);
  },
  hibbertia(ctx, o) {
    const full = o.pollen;
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate(i * TAU / 5);
      ell(ctx, 10, 0, 9, 7, full ? '#ffd23f' : '#f3e7b3');
      ctx.restore();
    }
    ell(ctx, 0, 0, 5, 5, full ? '#e0a000' : '#cbb978');
  },
  // Kangaroo paw (Anigozanthos manglesii): red woolly stem, green claw-tipped flowers.
  paw(ctx) {
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate(i * TAU / 6 + 0.3);
      line(ctx, [0, 0, 10, 0], '#b3261e', 4);
      ell(ctx, 10, 0, 3.5, 3.5, '#c0392b');
      ell(ctx, 17, 0, 7, 3.4, '#58a832');
      for (const s of [-1, 0, 1]) line(ctx, [23, s * 1.5, 27, s * 3.5], '#3e8a1e', 1.4);
      ctx.restore();
    }
    ell(ctx, 0, 0, 5, 5, '#b3261e');
    ell(ctx, 0, 0, 2.5, 2.5, '#d84c3a');
  },

  // --- spiderling stage ---
  // Young peacock spider: plain brown like the female; colours come at the last moult.
  spiderling(ctx, o, t) {
    const w = o.moving ? Math.sin(t * 16) * 0.2 : 0;
    for (let i = 0; i < 4; i++) {
      for (const s of [-1, 1]) leg(ctx, 3, 0, s * [0.55, 1.15, 1.9, 2.5][i] + (i % 2 ? w : -w) * s, 6, 5, s * 0.4, '#7a5f40', 1.3);
    }
    ell(ctx, -7, 0, 6.5, 5.5, '#a5865e');
    ell(ctx, -8, 0, 3, 2, '#c4a47a');
    ell(ctx, 4, 0, 6, 5, '#7a5f40');
    ell(ctx, 8.8, -2.2, 2.1, 2.1, '#0b0b0b');
    ell(ctx, 8.8, 2.2, 2.1, 2.1, '#0b0b0b');
    ell(ctx, 9.3, -2.6, 0.6, 0.6, '#fff');
    if (o.moult > 0) {
      ctx.globalAlpha = Math.min(1, o.moult);
      ctx.save();
      ctx.translate(-22, 0);
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) leg(ctx, 3, 0, s * [0.55, 1.15, 1.9, 2.5][i], 6, 5, s * 0.4, 'rgba(255,255,255,.8)', 1);
      ell(ctx, -7, 0, 6.5, 5.5, 'rgba(255,255,255,.55)');
      ell(ctx, 4, 0, 6, 5, 'rgba(255,255,255,.55)');
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  },
  // Springtail: tiny six-legged hexapod with a forked spring folded underneath.
  springtail(ctx, o, t) {
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) leg(ctx, 1 - i * 2, 0, s * (1.2 + i * 0.4), 3, 3, 0, '#6d6480', 0.8);
    ell(ctx, -2, 0, 6, 2.6, '#8a7fa3');
    ell(ctx, 4.5, 0, 2.6, 2.4, '#6d6480');
    line(ctx, [6, -1, 10, -4], '#6d6480', 0.9);
    line(ctx, [6, 1, 10, 4], '#6d6480', 0.9);
    if (o.hop > 0) line(ctx, [-8, 0, -13, -2, -13, 2], '#6d6480', 1);
  },
  // Small black ant, a danger to spiderlings.
  smallAnt(ctx, o, t) {
    insectLegs(ctx, 1, 11, '#1b1b1b', 1.3, t, true);
    ell(ctx, -8, 0, 5.5, 4.5, '#262626');
    ell(ctx, -2.5, 0, 1.6, 1.4, '#262626');
    ell(ctx, 2, 0, 4, 2.6, '#333');
    ell(ctx, 8, 0, 3.8, 3.6, '#262626');
    line(ctx, [10, -2, 14, -6, 18, -5], '#1b1b1b', 0.9);
    line(ctx, [10, 2, 14, 6, 18, 5], '#1b1b1b', 0.9);
  },

  // --- bull ant queen stage ---
  queenAnt(ctx, o, t) {
    Sprites.ant(ctx, o, t);
    if (o.wings) {
      const flap = o.flying ? Math.sin(t * 50) * 0.3 : 0.5;
      wings(ctx, 2, 3, 15, 5, flap, 'rgba(240,235,220,.65)');
    }
  },
  // Willie wagtail: black above, white eyebrow, fanned tail.
  wagtail(ctx, o, t) {
    const flap = Math.sin(t * 16) * 4;
    const fan = Math.sin(t * 9) * 0.35;
    for (const k of [-1, 0, 1]) {
      ctx.save();
      ctx.rotate(Math.PI + k * 0.25 + fan * k);
      ell(ctx, 18, 0, 12, 3.2, '#1a1a1a');
      ctx.restore();
    }
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(6, s * 3);
      ctx.quadraticCurveTo(0, s * (24 + flap), -12, s * (22 + flap));
      ctx.lineTo(-6, s * 3);
      ctx.fillStyle = '#222';
      ctx.fill();
    }
    ell(ctx, 0, 0, 11, 7, '#1d1d1d');
    ell(ctx, 10, 0, 6, 5.5, '#151515');
    ell(ctx, 11, -3.4, 2.6, 0.9, '#fff');
    ell(ctx, 11, 3.4, 2.6, 0.9, '#fff');
    line(ctx, [15, 0, 19, 0], '#111', 1.6);
  },

  // --- bush fly stage ---
  // Bush fly (Musca vetustissima): small grey fly, two dark stripes on the thorax.
  bushFly(ctx, o, t) {
    const flap = o.landed ? 0.25 : Math.sin(t * 80) * 0.45;
    insectLegs(ctx, 0, 7, '#2a2a2a', 0.9, t, o.moving && o.landed);
    wings(ctx, 0, 2.5, 8, 3.2, flap + 0.15, 'rgba(225,232,240,.7)');
    ell(ctx, -5, 0, 5, 3.4, '#6b6b5e');
    ell(ctx, -5, 0, 3.5, 1, '#3d3d35');
    ell(ctx, 1, 0, 3.6, 3.3, '#8a8a7a');
    line(ctx, [-1.5, -1.2, 3.5, -1.2], '#2e2e28', 1);
    line(ctx, [-1.5, 1.2, 3.5, 1.2], '#2e2e28', 1);
    ell(ctx, 5, -2, 1.9, 2, '#8b2a1e');
    ell(ctx, 5, 2, 1.9, 2, '#8b2a1e');
    if (o.sip) line(ctx, [6, 0, 9, 0], '#4a4a40', 1.2);
  },
  // Dairy cow from above.
  cow(ctx, o, t) {
    const sw = Math.sin(t * 3 + (o.x || 0)) * 0.5;
    line(ctx, [-44, 0, -60, sw * 14], '#3a2a1e', 2.5);
    ell(ctx, -61, sw * 14, 3, 3, '#1a1a1a');
    for (const [x, y] of [[26, -22], [26, 22], [-30, -22], [-30, 22]]) ell(ctx, x, y, 6, 4, '#2a2a2a');
    ell(ctx, 0, 0, 46, 26, '#f4f1ea');
    ell(ctx, -16, -10, 14, 10, '#2a2a2a', 0.4);
    ell(ctx, 14, 12, 12, 8, '#2a2a2a', -0.3);
    ell(ctx, -30, 12, 8, 6, '#2a2a2a');
    ell(ctx, 52, 0, 15, 12, '#f4f1ea');
    ell(ctx, 56, 0, 8, 10, '#2a2a2a');
    ell(ctx, 66, 0, 6, 8, '#e8b4a6');
    ell(ctx, 48, -14, 6, 3, '#2a2a2a', -0.5);
    ell(ctx, 48, 14, 6, 3, '#2a2a2a', 0.5);
  },
  // Cow pat: glossy when fresh, pale and cracked when dry. o.fresh 1 → 0, o.size 1 → 0 as beetles bury it.
  pat(ctx, o) {
    const s = o.size === undefined ? 1 : o.size, f = o.fresh === undefined ? 1 : o.fresh;
    const c = (a, b) => Math.round(a + (b - a) * (1 - f));
    const col = 'rgb(' + c(74, 150) + ',' + c(52, 128) + ',' + c(30, 96) + ')';
    ell(ctx, 0, 0, 22 * s, 18 * s, col);
    ell(ctx, -3, -2, 15 * s, 12 * s, 'rgb(' + c(60, 140) + ',' + c(42, 118) + ',' + c(24, 88) + ')');
    if (f > 0.5) ell(ctx, -6 * s, -6 * s, 5 * s, 3 * s, 'rgba(255,255,255,.35)');
    else { line(ctx, [-10 * s, -2, 0, 3 * s, 8 * s, -4 * s], 'rgba(60,45,25,.6)', 1); }
    if (o.eggs) for (let i = 0; i < o.eggs * 5; i++) ell(ctx, Math.cos(i * 2.4) * 9 * s, Math.sin(i * 2.4) * 7 * s, 1.6, 0.9, '#fbf7ea', i);
    if (o.maggots) {
      for (let i = 0; i < o.maggots * 3; i++) {
        const w = Math.sin((o.t || 0) * 6 + i) * 2;
        ell(ctx, Math.cos(i * 1.7) * 11 * s + w, Math.sin(i * 1.7) * 8 * s, 3, 1.4, '#f2ead0', i + w * 0.2);
      }
    }
  },
  // Dung beetle (introduced Onthophagus/Digitonthophagus type): shiny black, broad front legs for digging.
  dungBeetle(ctx, o, t) {
    insectLegs(ctx, 2, 10, '#1a1a1a', 1.6, t, o.moving);
    line(ctx, [8, -4, 13, -9], '#1a1a1a', 2.4);
    line(ctx, [8, 4, 13, 9], '#1a1a1a', 2.4);
    ell(ctx, -4, 0, 9, 7.5, '#1d1b17');
    line(ctx, [-12, 0, 4, 0], '#3a362e', 0.8);
    ell(ctx, 6, 0, 5, 6, '#24221d');
    ell(ctx, 11, 0, 3, 5, '#2a2822');
    ell(ctx, -6, -3, 3, 1.2, 'rgba(255,255,255,.3)');
  },
  // Dead insect on its back (for scavenging ants).
  deadBeetle(ctx, o) {
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) line(ctx, [-2 + i * 4, s * 3, -1 + i * 4, s * 8, i * 4 + 2, s * 7], '#3a2a1a', 1.2);
    ell(ctx, -2, 0, 9, 6.5, '#6a4a2a');
    ell(ctx, 8, 0, 4, 4, '#4a3420');
    line(ctx, [-9, 0, 5, 0], '#4a3420', 0.8);
  },
  deadMoth(ctx, o) {
    ell(ctx, -2, -7, 9, 6, '#b7a27a', -0.3);
    ell(ctx, -2, 7, 9, 6, '#b7a27a', 0.3);
    ell(ctx, -2, -7, 4, 2.5, '#8f7a52', -0.3);
    ell(ctx, -2, 7, 4, 2.5, '#8f7a52', 0.3);
    ell(ctx, 0, 0, 7, 2.6, '#7a6644');
    line(ctx, [6, -1, 11, -5], '#5a4a30', 0.8);
    line(ctx, [6, 1, 11, 5], '#5a4a30', 0.8);
  },

  // --- discoveries ---
  cone(ctx) {
    ell(ctx, 0, 0, 14, 6, '#6e5236');
    for (let i = -3; i <= 3; i++) for (const s of [-1, 1]) ell(ctx, i * 3.6, s * 3, 1.6, 1.2, '#3e2c1a');
    line(ctx, [14, 0, 19, 0], '#5a4028', 2);
  },
  feather(ctx, o) {
    line(ctx, [-14, 0, 14, 0], '#444', 1);
    ell(ctx, 1, 0, 13, 4, o.color || '#1c1c1c');
    if (o.band) ell(ctx, -5, 0, 3, 4, o.band);
  },
  dig(ctx) {
    ell(ctx, 4, 0, 13, 10, '#c9a868');
    ell(ctx, -2, 0, 7, 6, '#2a1a0c');
  },
  shell(ctx, o) {
    ell(ctx, 0, 0, 8, 8, o.color || '#8a6a44');
    ctx.beginPath();
    for (let a = 0; a < 12; a += 0.2) ctx.lineTo(Math.cos(a) * a * 0.6, Math.sin(a) * a * 0.6);
    ctx.strokeStyle = '#4a3420';
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  beeHotel(ctx) {
    ctx.fillStyle = '#9a7048';
    ctx.fillRect(-14, -12, 28, 24);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) ell(ctx, -8 + i * 8, -6 + k * 6, 2, 2, '#3a2412');
  },
  birdbath(ctx) {
    ell(ctx, 0, 0, 16, 16, '#b5b0a5');
    ell(ctx, 0, 0, 12, 12, '#8cc8e0');
  },
  bobtail(ctx, o, t) {
    for (const [x, s] of [[8, -1], [8, 1], [-8, -1], [-8, 1]]) ell(ctx, x, s * 8, 3, 3, '#4a3a28');
    ell(ctx, 0, 0, 13, 7, '#6b5434');
    for (let i = -2; i <= 2; i++) line(ctx, [i * 4, -6, i * 4, 6], '#4a3a22', 1);
    ell(ctx, -16, 0, 6, 5, '#6b5434');
    ell(ctx, 16, 0, 6, 5, '#7a6244');
    if (Math.sin(t * 2) > 0.7) line(ctx, [21, 0, 26, 0], '#2f4f8f', 2);
  },
  seashell(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.arc(0, 0, 11, Math.PI * 1.1, Math.PI * 1.9);
    ctx.closePath();
    ctx.fillStyle = '#f2d6c2';
    ctx.fill();
    for (let i = -3; i <= 3; i++) line(ctx, [0, 10, i * 3, -9], '#d9a88a', 0.8);
  },
  frog(ctx) {
    for (const s of [-1, 1]) { ell(ctx, -6, s * 7, 7, 3, '#4f8f3a', s * 0.5); ell(ctx, 6, s * 6, 4, 2, '#4f8f3a', -s * 0.5); }
    ell(ctx, 0, 0, 9, 7, '#5fa046');
    ell(ctx, 6, -3, 2, 2, '#d8c040');
    ell(ctx, 6, 3, 2, 2, '#d8c040');
  },
  damselfly(ctx) {
    for (let k = 0; k < 9; k++) ell(ctx, -4 - k * 3, 0, 1.4, 1.2, k % 2 ? '#2a6fb0' : '#58a8e0');
    ell(ctx, -8, -1.5, 12, 1.6, 'rgba(235,245,255,.7)');
    ell(ctx, -8, 1.5, 12, 1.6, 'rgba(235,245,255,.7)');
    ell(ctx, 1, 0, 3, 2, '#2a6fb0');
    ell(ctx, 4, -2.4, 1.6, 1.6, '#1a3f6a');
    ell(ctx, 4, 2.4, 1.6, 1.6, '#1a3f6a');
  },
  gilgie(ctx, o, t) {
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) line(ctx, [-2 + i * 3, s * 3, -1 + i * 3, s * 8], '#5a4630', 1);
    for (const s of [-1, 1]) { line(ctx, [6, s * 3, 12, s * 7], '#5a4630', 2); ell(ctx, 15, s * 8, 4, 2.4, '#6a5238', s * 0.4); }
    ell(ctx, 2, 0, 8, 5, '#6a5238');
    for (let k = 0; k < 5; k++) ell(ctx, -8 - k * 3.2, 0, 3.4 - k * 0.3, 3.6 - k * 0.3, '#6a5238');
    ell(ctx, -25, 0, 3, 5, '#5a4630');
  },
  divingBeetle(ctx, o, t) {
    for (const s of [-1, 1]) line(ctx, [-2, s * 4, -12, s * 10 + Math.sin(t * 8) * 2], '#2a2a1a', 1.8);
    ell(ctx, -1, 0, 9, 6.5, '#2f3a1e');
    ell(ctx, -1, 0, 9, 6.5, 'rgba(0,0,0,0)');
    line(ctx, [-9, 0, 5, 0], '#1a2010', 0.8);
    ell(ctx, 8, 0, 3.5, 4.5, '#2a3418');
    ell(ctx, -10, 0, 2.5, 2, 'rgba(220,240,255,.8)');
  },
  kangaroo(ctx, o, t) {
    line(ctx, [-20, 0, -48, 2], '#8a6a4a', 6);
    ell(ctx, -4, 0, 20, 13, '#9a7a58');
    for (const s of [-1, 1]) ell(ctx, -10, s * 13, 10, 4, '#8a6a4a', s * 0.2);
    ell(ctx, 16, 0, 8, 6, '#a88a66');
    ell(ctx, 26, 0, 7, 4, '#9a7a58');
    for (const s of [-1, 1]) ell(ctx, 20, s * 6, 4, 2, '#7a5a3a', s * 0.6);
  },
  rooPoo(ctx) {
    for (let i = 0; i < 6; i++) ell(ctx, Math.cos(i * 1.3) * 7, Math.sin(i * 1.3) * 5, 3, 2.6, '#4a3a26');
  },
  magpie(ctx, o, t) {
    line(ctx, [-10, 0, -22, 0], '#151515', 6);
    ell(ctx, 0, 0, 12, 7, '#151515');
    for (const s of [-1, 1]) ell(ctx, -4, s * 5, 8, 3, '#f2f2f2', s * 0.1);
    ell(ctx, -16, 0, 4, 4, '#f2f2f2');
    ell(ctx, 11, 0, 5.5, 5, '#151515');
    line(ctx, [15, 0, 21, 0], '#c8c0b0', 2.5);
  },

  // --- painted lady (Vanessa kershawi) ---
  // Caterpillar: dark and spiky with pale side stripes. o.size grows as it eats.
  plCaterpillar(ctx, o, t) {
    const s = o.size || 1, wig = o.moving ? Math.sin(t * 8) : 0;
    ctx.save();
    ctx.scale(s, s);
    for (let k = 6; k >= 0; k--) {
      const y = Math.sin(k * 0.9 + t * 8) * wig * 1.2;
      ell(ctx, -k * 4.2, y, 3.8, 3.6, k % 2 ? '#3a2e2a' : '#4a3c34');
      ell(ctx, -k * 4.2, y - 2.6, 1.6, 0.7, '#d8c070');
      ell(ctx, -k * 4.2, y + 2.6, 1.6, 0.7, '#d8c070');
      for (const sgn of [-1, 1]) line(ctx, [-k * 4.2, y + sgn * 3, -k * 4.2 - 1, y + sgn * 6], '#c8b060', 0.8);
    }
    ell(ctx, 3, 0, 3.4, 3.4, '#1e1612');
    ctx.restore();
    if (o.munch) ell(ctx, 6 * s, 0, 1.6, 1.6, '#7fc24a');
  },
  chrysalis(ctx) {
    line(ctx, [16, 0, 22, 0], '#8a7a5a', 1.5);
    ell(ctx, 4, 0, 12, 6, '#9a8a6a');
    ell(ctx, 4, 0, 12, 6, 'rgba(0,0,0,0)');
    for (let i = -1; i <= 1; i++) ell(ctx, i * 6, 0, 1.5, 4, '#c8b88a');
    ell(ctx, 8, -2, 1.5, 1, '#e8d8a0');
    ell(ctx, 8, 2, 1.5, 1, '#e8d8a0');
  },
  // Butterfly from above: orange wings with black tips and white spots, blue eyespots on the hindwings.
  butterfly(ctx, o, t) {
    const f = o.landed ? 0.35 : 0.55 + Math.sin(t * 18) * 0.45;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.scale(1, s * f);
      ctx.beginPath();
      ctx.moveTo(2, 0); ctx.quadraticCurveTo(14, 4, 12, 22); ctx.quadraticCurveTo(2, 24, -2, 2); ctx.closePath();
      ctx.fillStyle = '#e8782a'; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(10, 10); ctx.quadraticCurveTo(15, 14, 12, 22); ctx.quadraticCurveTo(7, 22, 6, 18); ctx.closePath();
      ctx.fillStyle = '#1e1a18'; ctx.fill();
      ell(ctx, 10, 18, 1.4, 1.4, '#fff');
      ell(ctx, 8, 15, 1.1, 1.1, '#fff');
      ctx.beginPath();
      ctx.moveTo(-2, 1); ctx.quadraticCurveTo(-2, 18, -12, 15); ctx.quadraticCurveTo(-14, 6, -4, 1); ctx.closePath();
      ctx.fillStyle = '#d96a24'; ctx.fill();
      ell(ctx, -9, 11, 2.2, 2.2, '#2a5ab0');
      ell(ctx, -9, 11, 1, 1, '#111');
      ctx.restore();
    }
    ell(ctx, -2, 0, 9, 1.8, '#2a221c');
    ell(ctx, 7, 0, 2.2, 2.2, '#2a221c');
    line(ctx, [8, -1, 15, -5], '#2a221c', 0.8);
    line(ctx, [8, 1, 15, 5], '#2a221c', 0.8);
    if (o.sip) { ctx.beginPath(); ctx.arc(11, 0, 2.5, -1.5, 1.5); ctx.strokeStyle = '#2a221c'; ctx.lineWidth = 0.8; ctx.stroke(); }
  },
  // Everlasting (paper daisy): pink papery petals, yellow centre. o.leaf 0..1 is how much leaf is left.
  everlasting(ctx, o) {
    const lf = o.leaf === undefined ? 1 : o.leaf;
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * 1.05 + 0.3); ell(ctx, 16, 0, 9 * (0.4 + lf * 0.6), 3.5, '#5f9a3a'); ctx.restore(); }
    for (let i = 0; i < 14; i++) { ctx.save(); ctx.rotate(i * TAU / 14); ell(ctx, 8, 0, 6, 2.2, o.nectar === false ? '#e8c8d0' : '#f2a8c0'); ctx.restore(); }
    ell(ctx, 0, 0, 4.5, 4.5, '#e8b030');
  },
  // Capeweed: a weed from South Africa with grey-green leaves and a yellow daisy.
  capeweed(ctx, o) {
    const lf = o.leaf === undefined ? 1 : o.leaf;
    for (let i = 0; i < 7; i++) { ctx.save(); ctx.rotate(i * 0.9); ell(ctx, 13, 0, 11 * (0.4 + lf * 0.6), 4.5, '#8aa070'); ctx.restore(); }
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * TAU / 12); ell(ctx, 6, 0, 4.5, 1.8, '#f2d040'); ctx.restore(); }
    ell(ctx, 0, 0, 3, 3, '#2a2418');
  },
  // Grevillea: nectar-rich flower, but not a food plant for caterpillars.
  grevillea(ctx, o) {
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * 1.05); ell(ctx, 14, 0, 9, 1.6, '#4f7a3a'); ctx.restore(); }
    for (let i = 0; i < 8; i++) { const a = i * 0.8; line(ctx, [0, 0, Math.cos(a) * 10, Math.sin(a) * 10], o.nectar === false ? '#e8a0a0' : '#d8303a', 2); ell(ctx, Math.cos(a) * 11, Math.sin(a) * 11, 1.5, 1.5, '#f2d040'); }
  },
  egg(ctx) { ell(ctx, 0, 0, 2, 2, '#a8d070'); },
  paperWasp(ctx, o, t) {
    const flap = Math.sin(t * 70) * 0.3;
    insectLegs(ctx, 2, 16, '#c8901e', 1.3, t, true);
    wings(ctx, 2, 3, 13, 4, flap, 'rgba(200,170,120,.55)');
    ell(ctx, -12, 0, 10, 5.5, '#c8901e');
    for (let i = 0; i < 3; i++) ctx.fillRect(-19 + i * 5, -5, 2, 10);
    ell(ctx, -3, 0, 1.8, 1.5, '#2a1a0a');
    ell(ctx, 3, 0, 5, 4, '#3a2a12');
    ell(ctx, 10, 0, 4, 4.2, '#c8901e');
    line(ctx, [13, -2, 18, -6, 21, -5], '#3a2a12', 1.2);
    line(ctx, [13, 2, 18, 6, 21, 5], '#3a2a12', 1.2);
  },

  // --- termite (Coptotermes) ---
  termiteWorker(ctx, o, t) {
    ell(ctx, -2, 0, 17, 7, 'rgba(60,40,20,.25)');
    insectLegs(ctx, 0, 9, '#9a845a', 1.1, t, o.moving);
    ell(ctx, -8, 0, 7, 4.6, '#f1e6c8');
    ell(ctx, -8, 0, 5, 3, '#e6d2a8');
    ell(ctx, 0, 0, 3.2, 3.2, '#ead9b0');
    ell(ctx, 6, 0, 4, 3.6, '#d8a050');
    line(ctx, [9, -2, 14, -6], '#c9b48a', 0.9);
    line(ctx, [9, 2, 14, 6], '#c9b48a', 0.9);
    if (o.carry) {
      ctx.save(); ctx.translate(14, 0);
      if (o.carry === 'mud') ell(ctx, 0, 0, 4.5, 4, '#6b4a2a');
      else { ctx.fillStyle = '#a07848'; ctx.fillRect(-5, -2, 10, 4); }
      ctx.restore();
    }
  },
  woodChip(ctx) {
    ctx.fillStyle = '#a07848';
    ctx.fillRect(-9, -4, 18, 8);
    line(ctx, [-8, -1, 8, -1], '#7a5a32', 1);
    line(ctx, [-8, 2, 6, 2], '#7a5a32', 1);
  },
  mud(ctx) {
    ell(ctx, 0, 0, 10, 8, '#6b4a2a');
    ell(ctx, -3, -2, 4, 3, '#8a6440');
  },
  log(ctx) {
    ctx.fillStyle = '#6a5034';
    ctx.fillRect(-60, -14, 120, 28);
    ell(ctx, 60, 0, 8, 14, '#a07848');
    for (let i = 0; i < 4; i++) ell(ctx, 60, 0, 6 - i * 1.5, 11 - i * 2.5, i % 2 ? '#8a6a44' : '#a07848');
    line(ctx, [-50, -6, 40, -6], '#4a3420', 1.2);
    line(ctx, [-40, 5, 50, 5], '#4a3420', 1.2);
  },

  // --- native land snail (Bothriembryon) ---
  // Tall, cone-shaped brown shell with pale bands. o.size grows as it eats; o.sealed hides the body.
  snail(ctx, o, t) {
    const s = o.size || 1;
    ctx.save();
    ctx.scale(s, s);
    if (!o.sealed) {
      const st = Math.sin(t * 3) * 0.6;
      ell(ctx, 2, 0, 18, 6, '#8a7a6a');
      ell(ctx, 2, 0, 16, 4.5, '#9a8a7a');
      for (const sg of [-1, 1]) {
        line(ctx, [16, sg * 2, 26, sg * (6 + st)], '#7a6a5a', 1.6);
        ell(ctx, 26, sg * (6 + st), 1.6, 1.6, '#2a2018');
        line(ctx, [18, sg * 1, 21, sg * 3], '#7a6a5a', 1);
      }
    }
    for (let i = 0; i < 5; i++) ell(ctx, -4 - i * 3.2, 0, 10 - i * 1.8, 8 - i * 1.4, i % 2 ? '#7a4a24' : '#9a6234');
    for (let i = 0; i < 4; i++) line(ctx, [-2 - i * 3.4, -7 + i * 1.3, -2 - i * 3.4, 7 - i * 1.3], 'rgba(240,220,180,.6)', 1);
    if (o.sealed) ell(ctx, 4, 0, 4, 6, '#e8e0d0');
    ctx.restore();
  },
  fungus(ctx, o) {
    const a = o.amount === undefined ? 1 : o.amount;
    for (let i = 0; i < 4; i++) ell(ctx, Math.cos(i * 1.6) * 7, Math.sin(i * 1.6) * 6, 5 * a + 2, 5 * a + 2, i % 2 ? '#c89a6a' : '#e0b888');
    for (let i = 0; i < 4; i++) ell(ctx, Math.cos(i * 1.6) * 7, Math.sin(i * 1.6) * 6, 1.5, 1.5, '#8a6440');
  },
  lichen(ctx, o) {
    const a = o.amount === undefined ? 1 : o.amount;
    for (let i = 0; i < 7; i++) ell(ctx, Math.cos(i * 0.9) * 9 * a, Math.sin(i * 0.9) * 7 * a, 4 + 2 * a, 3 + 2 * a, i % 2 ? '#a8b888' : '#c0cc9a', i);
  },
  deadLeaf(ctx, o) {
    const a = o.amount === undefined ? 1 : o.amount;
    ell(ctx, 0, 0, 16 * (0.4 + a * 0.6), 7, '#a8783a');
    line(ctx, [-14, 0, 14, 0], '#7a5428', 1);
  },
  slime(ctx) {},

  // --- dragonfly nymph stage ---
  // Dragonfly nymph: stocky, wing pads on its back, folded labium under the head.
  nymph(ctx, o, t) {
    insectLegs(ctx, 0, 14, '#4a3a22', 1.6, t, o.moving);
    for (let k = 0; k < 6; k++) ell(ctx, -6 - k * 3.4, 0, 6 - k * 0.7, 6.5 - k * 0.8, k % 2 ? '#6b5530' : '#7a6238');
    line(ctx, [-25, 0, -29, -2], '#4a3a22', 1.5);
    line(ctx, [-25, 0, -29, 2], '#4a3a22', 1.5);
    ell(ctx, 0, 0, 6, 5.5, '#7a6238');
    ell(ctx, -6, -3, 7, 2.2, '#5b4a2a', 0.15);
    ell(ctx, -6, 3, 7, 2.2, '#5b4a2a', -0.15);
    ell(ctx, 8, 0, 5, 6.5, '#806840');
    ell(ctx, 9, -5, 2.6, 2.4, '#2b2418');
    ell(ctx, 9, 5, 2.6, 2.4, '#2b2418');
    if (o.grab) {
      const L = o.grab.len;
      line(ctx, [10, 0, 10 + L * 0.5, 2, 10 + L, 0], '#a08050', 2.6);
      line(ctx, [10 + L, 0, 14 + L, -3], '#5b4a2a', 1.6);
      line(ctx, [10 + L, 0, 14 + L, 3], '#5b4a2a', 1.6);
    }
    if (o.jet > 0) {
      for (let i = 0; i < 4; i++) {
        const r = 2 + i * 1.5;
        ctx.beginPath();
        ctx.arc(-32 - i * 8 - (t * 60) % 8, (i % 2 ? 3 : -3), r, 0, TAU);
        ctx.strokeStyle = 'rgba(255,255,255,.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  },
  // Mosquito larva ("wriggler"): head, fat thorax, thin body, breathing tube.
  wriggler(ctx, o, t) {
    const w = Math.sin(t * 14 + (o.x || 0)) * 3;
    ell(ctx, 6, 0, 2.6, 2.6, '#3b3b2c');
    ell(ctx, 2, 0, 3.4, 3.4, '#5b5b44');
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.quadraticCurveTo(-7, w, -13, 0);
    ctx.strokeStyle = '#5b5b44';
    ctx.lineWidth = 2;
    ctx.stroke();
    line(ctx, [-13, 0, -17, w * 0.5 - 2], '#3b3b2c', 1.2);
  },
  tadpole(ctx, o, t) {
    const w = Math.sin(t * 10 + (o.x || 0)) * 4;
    ctx.beginPath();
    ctx.moveTo(-4, -3);
    ctx.quadraticCurveTo(-12, w, -22, w * 1.4);
    ctx.quadraticCurveTo(-12, w + 1, -4, 3);
    ctx.fillStyle = '#4e4636';
    ctx.fill();
    ell(ctx, 0, 0, 7, 6, '#3a3428');
    ell(ctx, 4, -3, 1.2, 1.2, '#c8b878');
    ell(ctx, 4, 3, 1.2, 1.2, '#c8b878');
  },
  // Adult pulling out of the nymph skin (o.k from 0 to 1).
  emerge(ctx, o, t) {
    ctx.globalAlpha = 0.85;
    ctx.save();
    ctx.translate(-14 * o.k, 0);
    Sprites.nymph(ctx, {}, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.translate(18 * o.k, 0);
    ctx.scale(0.5 + o.k * 0.5, 0.5 + o.k * 0.5);
    Sprites.dragonfly(ctx, { dart: 0 }, o.k > 0.8 ? t : 0);
    ctx.restore();
  },
};

// --- backgrounds, drawn once per mission ---

function drawGrassTree(ctx, x, y, r) {
  ell(ctx, x, y, r * 0.35, r * 0.35, '#3b2a1a');
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * TAU;
    line(ctx, [x, y, x + Math.cos(a) * r, y + Math.sin(a) * r], i % 2 ? '#7a9a3a' : '#5e7f2a', 1.5);
  }
}

function drawBanksia(ctx, x, y, r, rand) {
  ell(ctx, x + 6, y + 8, r, r * 0.9, 'rgba(0,0,0,.15)');
  for (let i = 0; i < 9; i++) {
    const a = rand() * TAU, d = rand() * r * 0.5;
    ell(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.55, r * 0.55, i % 2 ? '#4f7a3a' : '#5f8c45');
  }
  for (let i = 0; i < 5; i++) {
    const a = rand() * TAU, d = rand() * r * 0.7;
    ell(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 5, 9, '#e9a23b', a);
  }
}

function speckle(ctx, W, H, n, colors, rand, size) {
  for (let i = 0; i < n; i++) {
    ell(ctx, rand() * W, rand() * H, size * (0.5 + rand()), size * (0.3 + rand() * 0.5),
      colors[(rand() * colors.length) | 0], rand() * TAU);
  }
}

function drawHole(ctx, x, y, r, rim) {
  ell(ctx, x, y, r * 1.5, r * 1.3, rim);
  ell(ctx, x, y, r * 0.55, r * 0.5, '#2a1a0c');
}

// Scatter n things over the world, keeping clear of the home area.
function scatter(r, W, H, n, home, clear, fn) {
  for (let i = 0; i < n; i++) {
    const x = 40 + r() * (W - 80), y = 40 + r() * (H - 80);
    if (home && Math.hypot(x - home.x, y - home.y) < clear) continue;
    fn(x, y);
  }
}

const Backgrounds = {
  ant(ctx, W, H, home) {
    const r = rng(11), A = W * H / (960 * 600);
    ctx.fillStyle = '#e3cc96';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 500 * A, ['#d4b77a', '#ecd9ab', '#c9a868'], r, 3);
    speckle(ctx, W, H, 160 * A, ['#8a6a3a', '#a0783e', '#6e5a35'], r, 5);
    // Sandy track through the bush
    ctx.beginPath();
    ctx.moveTo(0, H * 0.3);
    ctx.bezierCurveTo(W * 0.3, H * 0.1, W * 0.6, H * 0.7, W, H * 0.55);
    ctx.strokeStyle = 'rgba(245,232,200,.7)';
    ctx.lineWidth = 46;
    ctx.stroke();
    scatter(r, W, H, 7 * A, home, 140, (x, y) => drawBanksia(ctx, x, y, 38 + r() * 25, r));
    scatter(r, W, H, 5 * A, home, 120, (x, y) => drawGrassTree(ctx, x, y, 28 + r() * 8));
    drawHole(ctx, home.x, home.y, home.r * 0.6, '#c9a868');
  },
  bee(ctx, W, H, home) {
    const r = rng(23), A = W * H / (960 * 600);
    ctx.fillStyle = '#9bbf6a';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 900 * A, ['#8bb05c', '#a8c97a', '#86a656'], r, 4);
    // Paths, a veggie patch and a shed, so it reads as a backyard
    ctx.fillStyle = '#d8c7a0';
    ctx.fillRect(W * 0.45, 0, 34, H);
    ctx.fillRect(0, H * 0.62, W, 30);
    ctx.fillStyle = '#7a5a3a';
    ctx.fillRect(W * 0.7, H * 0.12, 220, 120);
    for (let i = 0; i < 5; i++) for (let k = 0; k < 9; k++) ell(ctx, W * 0.7 + 20 + k * 22, H * 0.12 + 18 + i * 22, 7, 6, '#4f8f3a');
    ctx.fillStyle = '#a3a9ad';
    ctx.fillRect(W * 0.08, H * 0.75, 170, 120);
    ctx.fillStyle = '#8b9195';
    for (let i = 0; i < 8; i++) ctx.fillRect(W * 0.08 + i * 21, H * 0.75, 3, 120);
    ell(ctx, home.x, home.y, 110, 90, '#c9a26b');
    drawHole(ctx, home.x, home.y, home.r * 0.5, '#a8804c');
    scatter(r, W, H, 4 * A, home, 160, (x, y) => drawGrassTree(ctx, x, y, 34));
  },
  spider(ctx, W, H, home) {
    const r = rng(37), A = W * H / (960 * 600);
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#f6ead0');
    g.addColorStop(1, '#ecdcb6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Ocean along the west edge
    ctx.fillStyle = '#7cc3e0';
    ctx.fillRect(0, 0, 70, H);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (let y = 0; y < H; y += 26) ell(ctx, 74, y, 10, 5, 'rgba(255,255,255,.7)');
    speckle(ctx, W, H, 700 * A, ['#e6d4a8', '#f9f0dc', '#d9c393'], r, 2.5);
    scatter(r, W, H, 10 * A, home, 100, (x, y) => {
      for (let k = 0; k < 26; k++) {
        const a = r() * TAU, l = 18 + r() * 22;
        line(ctx, [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l], k % 2 ? '#9aa85a' : '#b7b86e', 1.6);
      }
    });
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 30; i++) {
      const a = r() * TAU;
      line(ctx, [home.x, home.y, home.x + Math.cos(a) * home.r, home.y + Math.sin(a) * home.r], '#ffffff', 1);
    }
    ell(ctx, home.x, home.y, home.r * 0.6, home.r * 0.45, 'rgba(255,255,255,.85)');
    ctx.globalAlpha = 1;
  },
  dragonfly(ctx, W, H, home) {
    const r = rng(51), A = W * H / (960 * 600);
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, '#5aa7c7');
    g.addColorStop(1, '#3a7f9e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60 * A; i++) {
      const x = r() * W, y = r() * H;
      line(ctx, [x, y, x + 20 + r() * 30, y], 'rgba(255,255,255,.18)', 2);
    }
    scatter(r, W, H, 14 * A, home, 90, (x, y) => {
      const s = 14 + r() * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, s, 0.12, TAU - 0.12);
      ctx.fillStyle = '#4f8f3a';
      ctx.fill();
    });
    const reeds = (cx, cy, n, spread) => {
      for (let i = 0; i < n; i++) {
        const x = cx + (r() - 0.5) * spread, y = cy + (r() - 0.5) * spread;
        ell(ctx, x, y, 4, 4, '#6a8a3a');
        for (let k = 0; k < 5; k++) {
          const a = r() * TAU;
          line(ctx, [x, y, x + Math.cos(a) * 16, y + Math.sin(a) * 16], '#86a64a', 2);
        }
      }
    };
    reeds(home.x, home.y, 30, home.r * 2.2);
    // Reedy shore round the edges
    for (let x = 0; x < W; x += 140) { reeds(x, 20, 6, 60); reeds(x, H - 20, 6, 60); }
    for (let y = 0; y < H; y += 140) { reeds(20, y, 6, 60); reeds(W - 20, y, 6, 60); }
  },
  nymph(ctx, W, H, home) {
    const r = rng(77), A = W * H / (960 * 600);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6d8f5a');
    g.addColorStop(1, '#3f5a35');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 400 * A, ['rgba(70,55,30,.35)', 'rgba(110,90,50,.3)', 'rgba(40,60,30,.3)'], r, 6);
    for (let i = 0; i < 40 * A; i++) ell(ctx, r() * W, r() * H, 1.5, 1.5, 'rgba(255,255,255,.25)');
    const weeds = (cx, cy, rad, n) => {
      for (let i = 0; i < n; i++) {
        const a = r() * TAU, d = r() * rad;
        const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
        const l = 14 + r() * 18, b = r() * TAU;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(b + 0.6) * l, y + Math.sin(b + 0.6) * l, x + Math.cos(b) * l * 1.6, y + Math.sin(b) * l * 1.6);
        ctx.strokeStyle = i % 2 ? '#2f6b2a' : '#3f8236';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    };
    weeds(home.x, home.y, home.r * 1.4, 60);
    scatter(r, W, H, 6 * A, home, 200, (x, y) => weeds(x, y, 50, 18));
  },
  // Swan Valley paddock: dry summer grass, a fence line, a big shady gum.
  paddock(ctx, W, H, home) {
    const r = rng(91), A = W * H / (960 * 600);
    ctx.fillStyle = '#d9c27a';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 1200 * A, ['#cdb46a', '#e4cf8e', '#bfa75e', '#a9b86a'], r, 4);
    // Fence
    line(ctx, [0, 30, W, 30], '#7a5a3a', 3);
    for (let x = 10; x < W; x += 80) ell(ctx, x, 30, 5, 5, '#5a4028');
    // Water trough
    ctx.fillStyle = '#9aa3a8';
    ctx.fillRect(W * 0.5, H * 0.08, 120, 40);
    ctx.fillStyle = '#7cc3e0';
    ctx.fillRect(W * 0.5 + 6, H * 0.08 + 6, 108, 28);
    // Shady gum tree (home)
    ell(ctx, home.x + 14, home.y + 18, home.r * 1.5, home.r * 1.3, 'rgba(0,0,0,.18)');
    for (let i = 0; i < 12; i++) {
      const a = r() * TAU, d = r() * home.r * 0.9;
      ell(ctx, home.x + Math.cos(a) * d, home.y + Math.sin(a) * d, home.r * 0.6, home.r * 0.55, i % 2 ? '#6b8f4a' : '#7ea35a');
    }
    scatter(r, W, H, 6 * A, home, 200, (x, y) => {
      for (let k = 0; k < 18; k++) {
        const a = r() * TAU, l = 10 + r() * 14;
        line(ctx, [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l], '#9a9a4a', 1.5);
      }
    });
  },
  // Bold Park heath in spring: low shrubs and wildflowers on grey sand.
  heath(ctx, W, H, home) {
    const r = rng(101), A = W * H / (960 * 600);
    ctx.fillStyle = '#d8d0b0';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 900 * A, ['#c8c0a0', '#e4dcc0', '#a8b888', '#98a878'], r, 4);
    scatter(r, W, H, 18 * A, home, 120, (x, y) => {
      for (let i = 0; i < 6; i++) ell(ctx, x + (r() - 0.5) * 40, y + (r() - 0.5) * 30, 14, 11, i % 2 ? '#6f8f50' : '#809f5c');
    });
    scatter(r, W, H, 80 * A, home, 60, (x, y) => ell(ctx, x, y, 2.2, 2.2, ['#f2f2f2', '#f0d040', '#c060c0'][Math.floor(r() * 3)]));
    // Silk shelter / chrysalis stem at home
    for (let i = 0; i < 5; i++) ell(ctx, home.x + (r() - 0.5) * 30, home.y + (r() - 0.5) * 30, 16, 7, '#5f9a3a', r() * TAU);
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 20; i++) { const a = r() * TAU; line(ctx, [home.x, home.y, home.x + Math.cos(a) * 26, home.y + Math.sin(a) * 26], '#fff', 0.8); }
    ctx.globalAlpha = 1;
  },
  // Whiteman Park woodland: dry grass, fallen logs, a termite mound for home.
  woodland(ctx, W, H, home) {
    const r = rng(113), A = W * H / (960 * 600);
    ctx.fillStyle = '#d6c08c';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 900 * A, ['#c8b07a', '#e2d0a0', '#b0a070', '#8a7a50'], r, 4);
    scatter(r, W, H, 6 * A, home, 200, (x, y) => drawBanksia(ctx, x, y, 34 + r() * 20, r));
    scatter(r, W, H, 6 * A, home, 220, (x, y) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r() * TAU); Sprites.log(ctx); ctx.restore();
    });
    ell(ctx, home.x, home.y, home.r * 1.2, home.r, '#9a7448');
  },
  // Bibra Lake bushland floor: shady leaf litter under trees.
  litter(ctx, W, H, home) {
    const r = rng(127), A = W * H / (960 * 600);
    ctx.fillStyle = '#6a5a3e';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 1400 * A, ['#7a6444', '#8a6e48', '#5a4a30', '#9a7a4a', '#6a7a40'], r, 6);
    scatter(r, W, H, 10 * A, home, 150, (x, y) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r() * TAU); line(ctx, [-50, 0, 50, 0], '#4a3420', 6); ctx.restore();
    });
    // Damp hollow under a log: home
    ell(ctx, home.x, home.y, home.r * 1.3, home.r, '#4a3c28');
    ctx.save(); ctx.translate(home.x, home.y - home.r * 0.6); Sprites.log(ctx); ctx.restore();
  },
};

// Stylised map of the Perth area for the hub screen. Coordinates in a 960x600 box.
function drawPerthMap(ctx, W, H) {
  const r = rng(3);
  ctx.fillStyle = '#7cc3e0';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 50; i++) {
    const x = r() * 260, y = r() * H;
    line(ctx, [x, y, x + 18, y], 'rgba(255,255,255,.35)', 2);
  }
  // Land with a wavy west coast
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.lineTo(250, 0);
  for (let y = 0; y <= H; y += 30) ctx.lineTo(250 + Math.sin(y / 70) * 14 - (y > 420 ? (y - 420) * 0.15 : 0), y);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = '#e9dcae';
  ctx.fill();
  // Beach strip
  ctx.strokeStyle = '#f7efcf';
  ctx.lineWidth = 10;
  ctx.stroke();
  speckle(ctx, W, H, 300, ['rgba(140,170,90,.25)', 'rgba(120,150,80,.2)'], r, 10);
  // Rottnest Island
  ell(ctx, 80, 430, 55, 16, '#e9dcae', -0.15);
  ctx.fillStyle = '#5a4a32';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Rottnest', 80, 462);
  // Kings Park bush
  ell(ctx, 455, 330, 48, 34, '#8fb06a');
  // Herdsman Lake
  ell(ctx, 430, 185, 40, 28, '#7cc3e0');
  ell(ctx, 430, 185, 48, 34, 'rgba(110,150,80,.35)');
  // Swan River from Fremantle to the hills
  ctx.beginPath();
  ctx.moveTo(240, 490);
  ctx.bezierCurveTo(330, 470, 340, 380, 420, 370);
  ctx.bezierCurveTo(480, 362, 500, 340, 540, 345);
  ctx.bezierCurveTo(600, 352, 640, 320, 700, 300);
  ctx.bezierCurveTo(780, 270, 860, 240, W, 210);
  ctx.strokeStyle = '#7cc3e0';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.stroke();
  ell(ctx, 380, 400, 40, 22, '#7cc3e0', -0.5);
  ell(ctx, 560, 352, 34, 14, '#7cc3e0');
  // City
  ctx.fillStyle = '#9a9a9a';
  for (let i = 0; i < 7; i++) ctx.fillRect(520 + i * 9, 300 - (i % 3) * 8, 7, 22 + (i % 3) * 8);
  ctx.fillStyle = '#5a4a32';
  ctx.fillText('Perth city', 552, 290);
  ctx.fillText('Fremantle', 300, 520);
  ctx.fillText('Swan River', 760, 300);
  ctx.fillText('Indian Ocean', 130, 120);
  // Suburb houses
  for (let i = 0; i < 12; i++) {
    const x = 640 + (i % 4) * 30, y = 420 + Math.floor(i / 4) * 28;
    ctx.fillStyle = '#d8c7a0';
    ctx.fillRect(x, y, 16, 12);
    ctx.fillStyle = '#b5523a';
    ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 8, y - 8); ctx.lineTo(x + 18, y); ctx.fill();
  }
  // North arrow
  line(ctx, [910, 70, 910, 30], '#5a4a32', 3);
  line(ctx, [902, 40, 910, 28, 918, 40], '#5a4a32', 3);
  ctx.fillText('N', 910, 88);
}
