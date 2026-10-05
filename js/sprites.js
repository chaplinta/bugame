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

const Backgrounds = {
  ant(ctx, W, H, home) {
    const r = rng(11);
    ctx.fillStyle = '#e3cc96';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 500, ['#d4b77a', '#ecd9ab', '#c9a868'], r, 3);
    speckle(ctx, W, H, 160, ['#8a6a3a', '#a0783e', '#6e5a35'], r, 5);
    for (const [x, y, s] of [[300, 90, 50], [820, 470, 60], [560, 300, 40], [80, 220, 45], [920, 120, 45]]) drawBanksia(ctx, x, y, s, r);
    for (const [x, y] of [[420, 520, 34], [700, 200, 30], [200, 360, 28]].map(a => a)) drawGrassTree(ctx, x, y, 30);
    drawHole(ctx, home.x, home.y, home.r * 0.6, '#c9a868');
  },
  bee(ctx, W, H, home) {
    const r = rng(23);
    ctx.fillStyle = '#9bbf6a';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 900, ['#8bb05c', '#a8c97a', '#86a656'], r, 4);
    ell(ctx, home.x, home.y, 110, 90, '#c9a26b');
    speckle(ctx, 220, 200, 80, ['#b48e58', '#d6b47f'], r, 3);
    drawHole(ctx, home.x, home.y, home.r * 0.5, '#a8804c');
    for (const [x, y] of [[480, 300], [850, 520], [880, 120]]) drawGrassTree(ctx, x, y, 34);
  },
  spider(ctx, W, H, home) {
    const r = rng(37);
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#f6ead0');
    g.addColorStop(1, '#ecdcb6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 700, ['#e6d4a8', '#f9f0dc', '#d9c393'], r, 2.5);
    for (let i = 0; i < 9; i++) {
      const x = 120 + r() * 760, y = 60 + r() * 480;
      for (let k = 0; k < 26; k++) {
        const a = r() * TAU, l = 18 + r() * 22;
        line(ctx, [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l], k % 2 ? '#9aa85a' : '#b7b86e', 1.6);
      }
    }
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < 30; i++) {
      const a = r() * TAU;
      line(ctx, [home.x, home.y, home.x + Math.cos(a) * home.r, home.y + Math.sin(a) * home.r], '#ffffff', 1);
    }
    ell(ctx, home.x, home.y, home.r * 0.6, home.r * 0.45, 'rgba(255,255,255,.85)');
    ctx.globalAlpha = 1;
  },
  dragonfly(ctx, W, H, home) {
    const r = rng(51);
    const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
    g.addColorStop(0, '#5aa7c7');
    g.addColorStop(1, '#3a7f9e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) {
      const x = r() * W, y = r() * H;
      line(ctx, [x, y, x + 20 + r() * 30, y], 'rgba(255,255,255,.18)', 2);
    }
    for (let i = 0; i < 14; i++) {
      const x = r() * W, y = r() * H, s = 14 + r() * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, s, 0.12, TAU - 0.12);
      ctx.fillStyle = '#4f8f3a';
      ctx.fill();
    }
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
    reeds(60, 60, 14, 120);
    reeds(900, 80, 12, 120);
  },
  nymph(ctx, W, H, home, extra) {
    const r = rng(77);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#6d8f5a');
    g.addColorStop(1, '#3f5a35');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 400, ['rgba(70,55,30,.35)', 'rgba(110,90,50,.3)', 'rgba(40,60,30,.3)'], r, 6);
    for (let i = 0; i < 40; i++) {
      const x = r() * W, y = r() * H;
      ell(ctx, x, y, 1.5, 1.5, 'rgba(255,255,255,.25)');
    }
    // Weed bed (safe home)
    for (let i = 0; i < 60; i++) {
      const a = r() * TAU, d = r() * home.r * 1.4;
      const x = home.x + Math.cos(a) * d, y = home.y + Math.sin(a) * d;
      const l = 14 + r() * 18, b = r() * TAU;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + Math.cos(b + 0.6) * l, y + Math.sin(b + 0.6) * l, x + Math.cos(b) * l * 1.6, y + Math.sin(b) * l * 1.6);
      ctx.strokeStyle = i % 2 ? '#2f6b2a' : '#3f8236';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // Reed stems poking up through the water (top-down circles)
    for (const [x, y] of [[890, 90], [860, 140], [920, 160], [840, 70], [905, 125]]) {
      ell(ctx, x + 4, y + 4, 9, 9, 'rgba(0,0,0,.2)');
      ell(ctx, x, y, 9, 9, '#a3b45a');
      ell(ctx, x, y, 5, 5, '#c8d47a');
    }
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Reed stems', 880, 190);
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
