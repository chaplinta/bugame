'use strict';
// London's art (js/london.js): the five bugs side-on (feet at the origin, facing +x; o.face flips them, and they undo
// the engine's turn themselves), the animals that hunt them, the things found on the way, the five side-on
// backgrounds, and the overlays: task spots, the leaves a hidden bug sits in, the hand that waves the wasp away and the Tube train.
// The 3D models of the bugs are in js/models-london.js; the drawings are the fallback.

// Side-on drawings start like this: undo the turn, face the way the bug faces, lift the body off the feet
function sideOn(ctx, o, lift) { ctx.save(); ctx.rotate(-(o.angle || 0)); ctx.scale(o.face !== undefined && o.face < 0 ? -1 : 1, 1); ctx.translate(0, -lift); }
// Six legs seen from the side: the far ones first and paler; xs are where they join the body
function sideLegs(ctx, xs, y, len, near, far, w, walk) {
  for (const [isFar, col, lw] of [[1, far, w * 0.8], [0, near, w]]) xs.forEach((x, i) => {
    const k = (i === 1 ? -walk : walk) * 0.9, dir = i === 0 ? 1 : i === 2 ? -1 : 0;
    line(ctx, [x, y, x + dir * len * 0.35 + k - isFar * 0.6, y + len * 0.55, x + dir * len * 0.6 + k * 1.6 - isFar, y + len], col, lw);
  });
}
// A wing seen from the side, beating: its angle swings while flying
function sideWing(ctx, x, y, len, wid, o, t, rate, tint, rest) {
  const beat = o.flying ? Math.sin(t * rate) : 0;
  ctx.save(); if (o.flying) ctx.globalAlpha = 0.7;
  insectWing(ctx, x, y, len, wid, Math.PI + (rest === undefined ? 0.25 : rest) + beat * 0.9, 'bee', { tint });
  if (o.flying) insectWing(ctx, x, y, len, wid, Math.PI + (rest === undefined ? 0.25 : rest) - beat * 0.9 + 0.2, 'bee', { tint: tint.replace(/[\d.]+\)$/, '0.25)') });
  ctx.restore();
}

Object.assign(Sprites, {
  // Buff-tailed bumblebee worker, Bombus terrestris: black with a yellow collar and band and a whitish tail.
  // o.pollen > 0: the pollen baskets on her hind legs are loaded.
  bumblebee(ctx, o, t) {
    sideOn(ctx, o, 7);
    const walk = o.moving && !o.flying ? Math.sin(t * 16) : 0;
    sideLegs(ctx, [3.5, 1, -1.5], 3, 6, '#1a1410', '#4a3a2a', 1.1, walk);
    if (o.pollen) ell(ctx, -3.6, 6.6, 2.4, 1.8, '#e8a020');
    ell(ctx, -6, 0.5, 7.6, 6, '#1c1814', 0, 'hair');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-6, 0.5, 7.6, 6, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = '#e8c228'; ctx.fillRect(-6.2, -6, 2.6, 13);
    ctx.fillStyle = '#f0ece0'; ctx.fillRect(-14, -6, 4.4, 13);
    fur(ctx, -6, 0.5, 7.2, 5.6, '#2a241c', 36, 1, 3);
    ctx.restore();
    ell(ctx, 3, -0.4, 4.8, 5, '#1c1814', 0, 'hair');
    ctx.save(); ctx.beginPath(); ctx.ellipse(3, -0.4, 4.8, 5, 0, 0, TAU); ctx.clip(); ctx.fillStyle = '#e8c228'; ctx.fillRect(4.6, -6, 2.4, 11); ctx.restore();
    fur(ctx, 3, -0.4, 4.4, 4.6, '#2a241c', 22, 0.9, 5);
    ell(ctx, 8.4, 0.8, 2.7, 3, '#141010', 0, 'hair');
    facetEye(ctx, 9, -0.2, 1.1, 1.7, '#0a0a0a');
    antenna(ctx, 9.6, -1.6, -1.1, 2.4, -0.3, 3, 4, '#141010', 0.6);
    sideWing(ctx, 1.6, -4.2, 11, 3.2, o, t, 80, 'rgba(200,200,210,.55)');
    ctx.restore();
  },

  // Common wasp worker, Vespula vulgaris: yellow and black, narrow waist, wings folded lengthways at rest
  commonWasp(ctx, o, t) {
    sideOn(ctx, o, 6);
    const walk = o.moving && !o.flying ? Math.sin(t * 16) : 0;
    sideLegs(ctx, [4, 1.6, -0.6], 2.6, 6, '#d8b020', '#8a7020', 0.9, walk);
    // abdomen: yellow with black bands, tapering to the sting end
    ctx.beginPath(); ctx.moveTo(-1.5, -2.6); ctx.quadraticCurveTo(-8, -5.4, -14, 0.4); ctx.quadraticCurveTo(-8, 4.6, -1.5, 2.6); ctx.closePath();
    ctx.fillStyle = '#f0c818'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#16120c'; for (let k = 0; k < 4; k++) ctx.fillRect(-3.6 - k * 2.7, -6, 1.1, 12);
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-4.4 - k * 2.7, -4.6); ctx.lineTo(-5.4 - k * 2.7, -1.6); ctx.lineTo(-6.2 - k * 2.7, -4.6); ctx.fill(); }
    if (Shade.rich) Tex.fillPath(ctx, 'chitin', 1.2, 0.25, 'multiply');
    ctx.restore();
    plainLine(ctx, [-1.6, 0, 0.2, 0], '#16120c', 1.2);                     // the narrow waist
    ell(ctx, 3.2, -0.4, 3.8, 3.4, '#1a160e', 0, 'chitin');                 // thorax, black with yellow marks
    plainEll(ctx, 3.6, -3, 2, 0.6, '#f0c818');
    plainEll(ctx, 1.4, 1.6, 1, 0.7, '#f0c818');
    ell(ctx, 7.6, 0.4, 2.4, 2.8, '#16120c', 0, 'chitin');
    plainEll(ctx, 8.4, 1.4, 1.2, 1.5, '#f0c818');                           // yellow face
    facetEye(ctx, 7.8, -0.4, 1, 1.9, '#1a1208');
    antenna(ctx, 8.6, -1.8, -1.0, 2, -0.15, 3.6, 5, '#16120c', 0.55);
    sideWing(ctx, 1.8, -3.4, 10.5, 2.2, o, t, 90, 'rgba(210,190,140,.5)', 0.12);
    ctx.restore();
  },

  // Underground mosquito, Culex pipiens form molestus: slender, brown, long legs and a long mouthpart.
  // o.blood: her abdomen is full and red.
  ugMosquito(ctx, o, t) {
    sideOn(ctx, o, 6);
    const walk = o.moving && !o.flying ? Math.sin(t * 16) : 0;
    for (const [far, col, w] of [[1, '#7a6a58', 0.45], [0, '#3a2e22', 0.55]]) for (let i = 0; i < 3; i++) {
      const x = 2.5 - i * 1.6, dir = i === 0 ? 1 : i === 2 ? -1 : 0, k = (i === 1 ? -walk : walk);
      line(ctx, [x, 1.4, x + dir * 4 + k - far, 3.4, x + dir * 8 + k * 1.5 - far, 6], col, w);
    }
    const full = o.blood > 0;
    ell(ctx, -5.5, 0.6, 6.2, full ? 2.4 : 1.6, full ? '#a02818' : '#7a6448');
    for (let k = 0; k < 5; k++) plainLine(ctx, [-1.5 - k * 2, -1, -1.5 - k * 2, 2], 'rgba(40,30,20,.5)', 0.4);
    ell(ctx, 1.8, -0.4, 2.4, 2.2, '#6a5440');                               // thorax
    ell(ctx, 4.8, 0.3, 1.3, 1.3, '#4a3a2a');
    facetEye(ctx, 5, 0, 0.7, 1, '#141008');
    plainLine(ctx, [5.8, 0.8, 11.5, 2.6], '#3a2e22', 0.5);                  // mouthpart
    plainLine(ctx, [5.4, -0.2, 8.4, -2.8], '#5a4a38', 0.4);
    sideWing(ctx, 0.6, -2, 8.4, 1.4, o, t, 130, 'rgba(200,200,190,.45)', 0.08);
    ctx.restore();
  },

  // Jersey tiger moth, Euplagia quadripunctaria: black forewings with cream stripes, folded like a roof at rest;
  // flying, the wings lift and the orange hindwings show.
  tigerMoth(ctx, o, t) {
    sideOn(ctx, o, 7);
    const walk = o.moving && !o.flying ? Math.sin(t * 14) : 0, beat = o.flying ? Math.sin(t * 22) : 0;
    sideLegs(ctx, [3.4, 1.4, -0.6], 3, 5, '#2a221c', '#5a4a3c', 0.8, walk);
    if (o.flying) {
      ctx.save(); ctx.rotate(-0.4 - beat * 0.5);
      ctx.beginPath(); ctx.moveTo(0, -1); ctx.quadraticCurveTo(-9, -15, -20, -13); ctx.quadraticCurveTo(-14, -3, 0, -1); ctx.fillStyle = '#e86a1a'; ctx.fill();
      for (let k = 0; k < 4; k++) plainEll(ctx, -9 - k * 2.6, -8 - k, 1.4, 1.1, '#1a1410');
      ctx.restore();
    }
    ell(ctx, -3, 0.6, 7.2, 2.6, '#e8a050', 0, 'hair');                       // body, orange underneath
    ctx.save(); ctx.rotate(o.flying ? -0.9 - beat * 0.6 : 0);
    ctx.beginPath(); ctx.moveTo(2.4, -2.4); ctx.lineTo(-15, -1.4); ctx.quadraticCurveTo(-11, 2.6, 2.6, 1.2); ctx.closePath();
    ctx.fillStyle = '#1e1a18'; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.strokeStyle = '#f2ead2'; ctx.lineWidth = 0.9;
    for (const [a, b] of [[[2, -2], [-14, -0.6]], [[-2, -2.6], [-6, 2.2]], [[-7, -2.4], [-10.5, 2.4]], [[-12, -2], [-14.4, 1.4]]]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
    ell(ctx, 3.6, -0.4, 2.6, 2.4, '#2a2420', 0, 'hair');
    plainLine(ctx, [2.2, -2.4, 4.6, -2.6], '#f2ead2', 0.7);
    facetEye(ctx, 6, 0.2, 1, 1.2, '#141008');
    antenna(ctx, 6.4, -0.8, -1.3, 1.8, -0.5, 4.4, 5, '#2a221c', 0.5);
    ctx.restore();
  },

  // Stag beetle, Lucanus cervus, male: chestnut wing cases and huge antler-like jaws. Flying, he holds his body
  // tipped up, wing cases open and the wings buzzing. stagBeetleF is a female: small jaws.
  stagBeetle(ctx, o, t) { stagDraw(ctx, o, t, true); },
  stagBeetleF(ctx, o, t) { stagDraw(ctx, o, t, false); },

  // Flower crab spider, Misumena vatia: white, waiting with its front legs open
  crabSpider(ctx, o, t) {
    const open = o.open ? 1 : 0.55;
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) line(ctx, [0.5, s * 1, 3 + i * 1.5, s * (3 + i * 1.6) * open, 6 + i, s * (5 + i * 2) * open], '#e8e4d8', 0.7);
    for (const s of [-1, 1]) line(ctx, [-1, s, -3, s * 3, -4, s * 4], '#e8e4d8', 0.5);
    ell(ctx, -2.5, 0, 3, 2.8, '#f4f0e4');
    ell(ctx, 1.2, 0, 2, 1.9, '#ece6d6');
    plainEll(ctx, -2.5, -1.4, 0.8, 0.5, 'rgba(200,80,90,.6)');
  },

  // A house fly, side-on, buzzing
  flySide(ctx, o, t) {
    sideOn(ctx, o, 4);
    sideLegs(ctx, [1.6, 0.4, -0.8], 1.6, 3.6, '#1a1a1a', '#555', 0.5, 0);
    ell(ctx, -2.6, 0.4, 3.2, 2.2, '#5a5a54');
    for (let k = 0; k < 2; k++) plainLine(ctx, [-1.5 - k * 1.6, -1.6, -1.5 - k * 1.6, 2], 'rgba(20,20,20,.5)', 0.4);
    ell(ctx, 1.2, -0.2, 2, 1.9, '#4a4a46');
    plainLine(ctx, [0, -1.6, 2.4, -1.6], '#2a2a28', 0.5);
    ell(ctx, 3.6, 0.2, 1.4, 1.6, '#7a2418');
    sideWing(ctx, 0.4, -1.4, 5.6, 1.8, { flying: true }, t, 140, 'rgba(220,220,230,.5)');
    ctx.restore();
  },

  // Great tit, Parus major: black cap and bib, white cheek, yellow front, green back. Side-on, flying.
  greatTit(ctx, o, t) {
    sideOn(ctx, o, 0);
    const flap = Math.sin(t * 30);
    ctx.save(); ctx.rotate(0.15);
    ctx.beginPath(); ctx.moveTo(-6, -1); ctx.lineTo(-17, -3); ctx.lineTo(-17, 1.6); ctx.closePath(); ctx.fillStyle = '#3a4a5a'; ctx.fill();   // tail
    ell(ctx, -1, 0.5, 7, 5, '#e8d040', 0, 'feather');
    ell(ctx, -2, -2.4, 6, 3, '#7a9a50', 0, 'feather');
    plainLine(ctx, [2.6, 0.8, -3, 4.6], '#151515', 1.4);                    // the black stripe down the front
    ell(ctx, 5.4, -2.4, 3.6, 3.4, '#151515', 0, 'feather');
    plainEll(ctx, 5.6, -1.6, 2, 1.4, '#f4f4f0');
    plainEll(ctx, 6.4, -3.2, 0.7, 0.7, '#fff'); plainEll(ctx, 6.5, -3.2, 0.45, 0.45, '#111');
    ctx.beginPath(); ctx.moveTo(8.6, -2.6); ctx.lineTo(10.6, -2.2); ctx.lineTo(8.6, -1.6); ctx.fillStyle = '#222'; ctx.fill();
    ctx.save(); ctx.translate(-1, -3); ctx.rotate(-0.4 - flap * 0.9);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, -9, -12, -6); ctx.quadraticCurveTo(-6, 0, 0, 0); ctx.fillStyle = '#4a5a6a'; ctx.fill();
    plainLine(ctx, [-3, -3, -9, -5], '#e8e8e8', 0.8);
    ctx.restore();
    ctx.restore();
    ctx.restore();
  },

  // Eurasian magpie, Pica pica: black and white with a long glossy tail, hopping on the ground (feet at the origin)
  euMagpie(ctx, o, t) {
    sideOn(ctx, o, 10);
    const hop = o.moving ? Math.abs(Math.sin(t * 9)) * 3 : 0;
    ctx.translate(0, -hop);
    line(ctx, [1, 6, 0, 10], '#151515', 1.2); line(ctx, [-1.5, 6, -2.5, 10], '#151515', 1.2);
    ctx.beginPath(); ctx.moveTo(-8, -1); ctx.lineTo(-30, -6); ctx.lineTo(-30, -2.5); ctx.closePath(); ctx.fillStyle = '#1a2a3a'; ctx.fill();   // long tail, glossy
    plainLine(ctx, [-12, -2, -28, -5], 'rgba(90,140,170,.6)', 1);
    ell(ctx, -1, 1, 9, 6, '#121212', 0, 'feather');
    ell(ctx, 0.5, 3, 6, 3.4, '#f2f2ee');                                   // white belly
    ctx.beginPath(); ctx.moveTo(-6, -3); ctx.quadraticCurveTo(-1, -6, 4, -2); ctx.quadraticCurveTo(-1, -1, -6, -3); ctx.fillStyle = '#f2f2ee'; ctx.fill();   // white on the wing
    ell(ctx, 8, -3, 4, 3.6, '#121212', 0, 'feather');
    plainEll(ctx, 9.4, -4, 0.8, 0.8, '#3a2a1a');
    ctx.beginPath(); ctx.moveTo(11.6, -3.4); ctx.lineTo(15.4, -2.6); ctx.lineTo(11.6, -1.8); ctx.fillStyle = '#111'; ctx.fill();
    ctx.restore();
  },

  // Red fox, side-on, trotting (feet at the origin)
  fox(ctx, o, t) {
    sideOn(ctx, o, 14);
    const step = o.moving ? Math.sin(t * 10) : 0;
    for (const [x, k, col] of [[8, step, '#2a1a12'], [-9, -step, '#2a1a12'], [6, -step, '#3a2418'], [-11, step, '#3a2418']]) line(ctx, [x, 4, x + k * 2.5, 14], col, 2.2);
    ctx.beginPath(); ctx.moveTo(-14, -1); ctx.quadraticCurveTo(-26, -6, -34, 2); ctx.quadraticCurveTo(-26, 6, -14, 3); ctx.closePath(); ctx.fillStyle = '#c8602a'; ctx.fill();   // brush
    plainEll(ctx, -32, 2, 3, 2.4, '#f4f0e8');                               // white tip
    ell(ctx, -2, 0, 15, 6.4, '#d0682e', 0, 'hair');
    plainEll(ctx, 3, 3.6, 7, 2.4, '#f0e6d4');
    ell(ctx, 14, -5, 5.4, 4.6, '#d0682e', 0, 'hair');
    ctx.beginPath(); ctx.moveTo(17, -5); ctx.lineTo(24, -2.6); ctx.lineTo(17, -0.6); ctx.fillStyle = '#d0682e'; ctx.fill();   // muzzle
    plainEll(ctx, 23.6, -2.6, 1, 0.8, '#151010');
    plainEll(ctx, 18.4, -1.8, 2.6, 1.2, '#f0e6d4');
    for (const dx of [11, 14]) { ctx.beginPath(); ctx.moveTo(dx, -8.6); ctx.lineTo(dx + 1.6, -14); ctx.lineTo(dx + 3.2, -8.6); ctx.fillStyle = '#b8521e'; ctx.fill(); }
    plainEll(ctx, 16.4, -6.2, 0.9, 0.7, '#1a1208');
    ctx.restore();
  },

  // London's portrait on the bug page: a red double-decker bus seen from the side (no operator's markings)
  londonIcon(ctx) {
    ctx.save(); ctx.translate(-22, -15);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(2, 28, 42, 4);
    const g = ctx.createLinearGradient(0, 0, 0, 30); g.addColorStop(0, '#e2382c'); g.addColorStop(1, '#a8201a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, 44, 28, 4) : ctx.rect(0, 0, 44, 28); ctx.fill();
    ctx.fillStyle = '#d8eef8';
    for (let k = 0; k < 5; k++) { ctx.fillRect(3 + k * 8, 3, 6, 6); ctx.fillRect(3 + k * 8, 15, 6, 6); }
    ctx.fillStyle = '#f2f2ea'; ctx.fillRect(0, 12, 44, 1.4);
    for (const x of [9, 35]) { ell(ctx, x, 28, 4, 4, '#1a1a1a'); plainEll(ctx, x, 28, 1.6, 1.6, '#9a9a9a'); }
    ctx.restore();
  },

  // A plain white jet, seen from above, nose toward +x (no airline's markings): at Perth Airport on the map
  jetPlane(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(2, 3, 12, 2.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4f4f0'; ctx.strokeStyle = '#8a8e94'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(-1, -1.2); ctx.lineTo(-4, -11); ctx.lineTo(-1.2, -11); ctx.lineTo(4, -1.2); ctx.closePath(); ctx.fill(); ctx.stroke();   // wings
    ctx.beginPath(); ctx.moveTo(-1, 1.2); ctx.lineTo(-4, 11); ctx.lineTo(-1.2, 11); ctx.lineTo(4, 1.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-12, -4); ctx.lineTo(-10.5, -4); ctx.lineTo(-7.5, -0.8); ctx.lineTo(-7.5, 0.8); ctx.lineTo(-10.5, 4); ctx.lineTo(-12, 4); ctx.closePath(); ctx.fill(); ctx.stroke();   // tail
    ctx.beginPath(); ctx.ellipse(0, 0, 12, 1.7, 0, 0, TAU); ctx.fill(); ctx.stroke();   // body
    ctx.fillStyle = '#5a7a9a'; ctx.beginPath(); ctx.ellipse(10.2, 0, 1.4, 0.9, 0, 0, TAU); ctx.fill();   // cockpit
  },

  // Things found on the way
  nutShell(ctx) { ell(ctx, 0, 0, 5, 4.2, '#a07040', 0, 'shell'); plainEll(ctx, 1.4, -0.6, 2.2, 1.8, '#3a2614'); plainEll(ctx, -2, 1.6, 1, 0.6, 'rgba(255,255,255,.3)'); },
  oldTicket(ctx) { ctx.save(); ctx.rotate(0.15); ctx.fillStyle = '#e8dcb8'; ctx.fillRect(-7, -4, 14, 8); ctx.fillStyle = '#8a7a5a'; ctx.fillRect(-5, -2, 7, 1); ctx.fillRect(-5, 0.5, 9, 1); ctx.fillStyle = '#c8501e'; ctx.fillRect(3.5, -2.6, 2.4, 2.4); ctx.restore(); },
  mouseSide(ctx, o, t) {
    sideOn(ctx, o, 3);
    plainLine(ctx, [-6, 1, -12, -1, -16, 2], '#9a8a7a', 0.8);
    ell(ctx, -1, 0, 6.4, 4, '#8a7a68', 0, 'hair');
    ell(ctx, 5, -0.8, 3.4, 2.8, '#8a7a68', 0, 'hair');
    plainEll(ctx, 3.6, -3.4, 1.8, 1.8, '#c8a898');
    plainEll(ctx, 6.4, -1.4, 0.7, 0.7, '#111'); plainEll(ctx, 8.4, -0.4, 0.6, 0.5, '#d89090');
    ctx.restore();
  },
  acorn(ctx) { ell(ctx, 0, 1, 3.4, 4.6, '#8a9a3a', 0, 'shell'); ell(ctx, 0, -3, 4, 2.4, '#7a5a32', 0, 'bark'); plainLine(ctx, [0, -5, 0.6, -7], '#5a4024', 0.8); },
  antler(ctx) {
    line(ctx, [-12, 2, -4, 0, 6, -3, 13, -9], '#d8c8a4', 2);
    line(ctx, [-4, 0, -2, -7], '#d8c8a4', 1.4); line(ctx, [4, -2.4, 6, -9], '#d8c8a4', 1.3); line(ctx, [10, -6, 15, -6], '#d8c8a4', 1.1);
    plainEll(ctx, -12, 2, 2.2, 1.8, '#a89470');
  },
});

function stagDraw(ctx, o, t, male) {
  sideOn(ctx, o, 8);
  const fly = o.flying && o.flyT > 0, walk = o.moving && !o.flying ? Math.sin(t * 12) : 0, beat = Math.sin(t * 55);
  if (fly) ctx.rotate(-0.6);                                                // tipped up in flight
  sideLegs(ctx, [5, 1.6, -2], 4, 9, '#1a110c', '#4a3428', 1.4, walk);
  if (fly || o.warmT > 0) {                                                  // wings out (the warm-up buzz shows them too)
    ctx.save(); ctx.globalAlpha = 0.6;
    for (const k of [0.3, -0.3]) insectWing(ctx, 0, -3, 20, 5, Math.PI + 0.9 + beat * 0.6 + k, 'bee', { tint: 'rgba(210,190,160,.5)' });
    ctx.restore();
  }
  // wing cases: chestnut, glossy; raised in flight
  ctx.save(); if (fly || o.warmT > 0) { ctx.translate(-1, -2); ctx.rotate(-0.5); }
  ell(ctx, -7, 0, 10, 6, '#5a2a14', 0, 'chitin');
  plainEll(ctx, -9, -3, 6, 1.2, 'rgba(255,220,180,.25)');
  plainLine(ctx, [2, -5.6, -16, -1], 'rgba(0,0,0,.35)', 0.5);
  ctx.restore();
  ell(ctx, 5, -0.6, 4.4, 4.6, '#1a1210', 0, 'chitin');                       // pronotum, black
  ell(ctx, 10.2, 0, 3.6 + (male ? 1 : 0), 3.2, '#1e1410', 0, 'chitin');    // head (broad in males)
  facetEye(ctx, 11.2, -0.6, 0.9, 1, '#0a0806');
  antenna(ctx, 12, 0.6, 0.6, 2.4, -0.2, 2.6, 3, '#1a1210', 0.6);
  if (male) {                                                                // the antler-like jaws, curving up and in
    for (const [col, dy] of [['#6a2c14', -0.6], ['#7e361a', 0.6]]) {
      ctx.beginPath(); ctx.moveTo(12.6, dy - 1); ctx.quadraticCurveTo(19, dy - 7, 24, dy - 6); ctx.quadraticCurveTo(21.5, dy - 4, 20.6, dy - 2.4);
      ctx.lineTo(19, dy - 3.4); ctx.quadraticCurveTo(16.4, dy - 1.4, 13, dy + 1); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    plainEll(ctx, 18.4, -4.4, 1.6, 0.6, 'rgba(255,220,180,.35)');
  } else for (const dy of [-0.6, 0.6]) line(ctx, [12.8, dy, 15, dy - 1.4, 16, dy - 0.2], '#3a1c0e', 1.1);
  ctx.restore();
}

// ------------------------------------------------------------------ backgrounds (painted once per part)
// Each draws its own sky and scenery, then the level's solids, ledges and hiding places so the art and the physics
// match. The level comes from the game that is starting (js/london.js setup runs before the background is painted).
const LondonArt = {
  sky(ctx, W, top, mid, low) {
    const g = ctx.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, top); g.addColorStop(0.65, mid); g.addColorStop(1, low);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 600);
  },
  // Rows of London rooftops far off: terraces, chimneys and a few towers
  skyline(ctx, W, y, col, seed, tall) {
    const r = rng(seed); ctx.fillStyle = col;
    for (let x = -20; x < W + 40;) {
      const w = 40 + r() * 70, h = 30 + r() * 40;
      ctx.fillRect(x, y - h, w, h + 200);
      if (r() < 0.6) ctx.fillRect(x + w * 0.2, y - h - 10, 6, 10);           // chimney pots
      if (r() < 0.3) { ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w / 2, y - h - 18); ctx.lineTo(x + w, y - h); ctx.fill(); }
      x += w;
    }
    for (const tx of tall || []) { ctx.fillRect(tx, y - 170, 22, 200); ctx.fillRect(tx + 6, y - 200, 10, 34); }
  },
  trees(ctx, W, y, col, seed, n, size) {
    const r = rng(seed); ctx.fillStyle = col;
    for (let i = 0; i < n; i++) { const x = r() * W, s = (size || 60) * (0.7 + r() * 0.6); ctx.beginPath(); ctx.ellipse(x, y - s * 0.6, s, s * 0.8, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - 4, y - s * 0.2, 8, s * 0.3); }
  },
  grass(ctx, W, y, base, blade, seed) {
    ctx.fillStyle = base; ctx.fillRect(0, y, W, 600 - y);
    const r = rng(seed); ctx.strokeStyle = blade; ctx.lineWidth = 1.4;
    ctx.beginPath(); for (let x = 0; x < W; x += 5) { const h = 4 + r() * 10; ctx.moveTo(x, y + 2); ctx.lineTo(x + (r() - 0.5) * 4, y - h); } ctx.stroke();
  },
  leafBlob(ctx, x, y, w, h, cols, seed, n) {
    const r = rng(seed);
    for (let i = 0; i < (n || 40); i++) { ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.ellipse(x + r() * w, y + r() * h, 6 + r() * 8, 4 + r() * 6, r() * 3, 0, TAU); ctx.fill(); }
  },
  // The level's own things, so what you see is what you bump into
  solids(ctx, L) {
    for (const s of L.solids) {
      const [x, y, w, h, kind] = s;
      if (kind === 'hedge') { ctx.fillStyle = '#2f5a2a'; ctx.fillRect(x, y + 6, w, h); this.leafBlob(ctx, x - 6, y - 6, w + 12, h, ['#3a6a30', '#4a7a38', '#2a5226'], x, 90); }
      else if (kind === 'trunk') {
        const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#5a4430'); g.addColorStop(0.5, '#7a5e42'); g.addColorStop(1, '#4a3826');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(40,28,16,.5)'; ctx.lineWidth = 1.5; for (let k = 0; k < 12; k++) { ctx.beginPath(); ctx.moveTo(x + 8 + (k * 13) % (w - 16), y + 10 + k * 30); ctx.lineTo(x + 8 + (k * 13) % (w - 16), y + 40 + k * 30); ctx.stroke(); }
        ctx.fillStyle = '#4a3826'; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x - 60, y - 40); ctx.lineTo(x - 54, y - 48); ctx.lineTo(x + 10, y - 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w, y + 10); ctx.lineTo(x + w + 70, y - 30); ctx.lineTo(x + w + 64, y - 38); ctx.lineTo(x + w - 8, y); ctx.fill();
      } else if (kind === 'bank') { ctx.fillStyle = '#6a5034'; ctx.beginPath(); ctx.moveTo(x - 30, y + h); ctx.quadraticCurveTo(x + 10, y - 10, x + w, y); ctx.lineTo(x + w, y + h); ctx.fill(); ctx.fillStyle = '#4a7a30'; ctx.fillRect(x, y - 4, w, 6); }
      else if (kind === 'table') { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#5a4028'; ctx.fillRect(x + 10, y + h, 8, 560 - y - h); ctx.fillRect(x + w - 18, y + h, 8, 560 - y - h); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x, y + h, w, 4); }
      else if (kind === 'bin') { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#3a4a44'); g.addColorStop(0.5, '#5a6e66'); g.addColorStop(1, '#2e3c36'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#28322e'; ctx.fillRect(x - 4, y - 6, w + 8, 8); }
      else if (kind === 'shed') {
        ctx.fillStyle = '#7a6a4a'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(40,30,16,.4)'; ctx.lineWidth = 2; for (let k = 0; k < w; k += 18) { ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k, y + h); ctx.stroke(); }
        ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.moveTo(x - 50, y + 4); ctx.lineTo(x + w * 0.5, y - 70); ctx.lineTo(x + w + 20, y + 4); ctx.fill();
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x + w * 0.45, y + h - 140, 60, 140);
      } else if (kind === 'ceiling') { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#202024'); g.addColorStop(1, '#4a4a50'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); for (let k = 0; k < w; k += 120) { ctx.fillStyle = 'rgba(255,240,200,.5)'; ctx.fillRect(x + k + 40, y + h - 6, 40, 4); } }
      else if (kind === 'platform') {
        ctx.fillStyle = '#5a5654'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#d8c020'; ctx.fillRect(x, y, w, 5);                  // the line to stand behind
        ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k < w; k += 60) ctx.fillRect(x + k, y + 5, 2, h - 5);
        ctx.fillStyle = '#3a3634'; ctx.fillRect(x + w - 6, y, 6, h);
      } else if (kind === 'wall') {
        ctx.fillStyle = '#9a4a32'; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(230,210,190,.5)'; ctx.lineWidth = 1;
        for (let k = 0; k < h; k += 10) { ctx.beginPath(); ctx.moveTo(x, y + k); ctx.lineTo(x + w, y + k); ctx.stroke(); for (let j = (k / 10) % 2 ? 0 : 12; j < w; j += 24) { ctx.beginPath(); ctx.moveTo(x + j, y + k); ctx.lineTo(x + j, y + k + 10); ctx.stroke(); } }
        ctx.fillStyle = '#7a6a5a'; ctx.fillRect(x - 3, y - 6, w + 6, 8);
      } else if (kind === 'bark') {
        const round = h < 140 || w > 200;                                    // a lying log, or a standing stump
        const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#6a5038'); g.addColorStop(0.5, '#4e3a28'); g.addColorStop(1, '#382818');
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, round ? Math.min(30, h / 2) : 8) : ctx.rect(x, y, w, h); ctx.fill();
        ctx.strokeStyle = 'rgba(30,20,10,.45)'; ctx.lineWidth = 1.4;
        for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x + 10 + k * w / 8, y + 6); ctx.lineTo(x + 6 + k * w / 8, y + h - 6); ctx.stroke(); }
        if (!round) { ctx.fillStyle = '#9a7a52'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 2, w / 2, 7, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,30,.6)'; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + w / 2, y + 2, w / 2 * k / 4, 7 * k / 4, 0, 0, TAU); ctx.stroke(); } }
        ctx.fillStyle = 'rgba(120,150,70,.5)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x + (k * 37) % w, y + 4 + (k * 13) % 20, 8, 4, 0, 0, TAU); ctx.fill(); }   // moss
      }
    }
    for (const l of L.ledges || []) {
      if (l[2] > 600) { ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(l[0], l[1] + 2); ctx.lineTo(l[0] + l[2], l[1] + 2); ctx.stroke(); ctx.strokeStyle = '#4a4a50'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(l[0], l[1] + 8); ctx.lineTo(l[0] + l[2], l[1] + 8); ctx.stroke(); continue; }   // cables along a tunnel wall
      const under = L.solids.filter(q => q[1] > l[1] && l[0] + l[2] / 2 > q[0] && l[0] + l[2] / 2 < q[0] + q[2]).map(q => q[1]), foot = Math.min(L.floor, ...under);   // it stands on what's below it
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(l[0], l[1], l[2], 8);              // a bench, a chair seat, a shelf
      ctx.fillStyle = '#4a3220'; ctx.fillRect(l[0] + 6, l[1] + 8, 5, foot - l[1] - 8); ctx.fillRect(l[0] + l[2] - 11, l[1] + 8, 5, foot - l[1] - 8);
    }
    for (const h of L.hides || []) if (h[4] === 'alcove') { ctx.fillStyle = 'rgba(10,10,14,.75)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(h[0], h[1], h[2], h[3], [20, 20, 0, 0]) : ctx.rect(h[0], h[1], h[2], h[3]); ctx.fill(); }
  },

  // The leaves (or pillar) in front of a hiding place, painted once
  leaves(h) {
    const [x, y, w, hh, kind] = h;
    if (kind === 'table' || kind === 'alcove') return null;
    const c = document.createElement('canvas'), pad = 14;
    c.width = Math.ceil(w + pad * 2); c.height = Math.ceil(hh + pad * 2);
    const ctx = c.getContext('2d'); ctx.translate(pad, pad);
    if (kind === 'pillar') {
      const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#6a6460'); g.addColorStop(0.5, '#9a948c'); g.addColorStop(1, '#5a5450');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, hh);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < hh; k += 24) ctx.fillRect(0, k, w, 2);
    } else {
      const cols = kind === 'ivy' ? ['#2a5a2a', '#3a6a34', '#1e4a22'] : kind === 'bracken' ? ['#5a7a2a', '#6a8a34', '#4a6a22', '#8a7a2a'] : kind === 'buddleia' ? ['#5a7a52', '#6a8a5e', '#4a6a46', '#7a9a6a'] : ['#2f6a2e', '#3f7a38', '#285a28'];
      this.leafBlob(ctx, -6, -4, w + 12, hh + 6, cols, Math.round(x + y), Math.round(w * hh / 260));
    }
    return { c, x: x - pad, y: y - pad };
  },

  hand(ctx, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#e8b896'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-34, -24, 62, 44, 18) : ctx.rect(-34, -24, 62, 44); ctx.fill();
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-30 + k * 15, -64, 13, 46, 6) : ctx.rect(-30 + k * 15, -64, 13, 46); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(34, -6, 9, 20, -0.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(150,90,60,.4)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-17 + k * 15, -18); ctx.lineTo(-17 + k * 15, -2); ctx.stroke(); }
    ctx.restore();
  },
  // A Tube train, painted once: a long carriage with windows and doors (no operator's markings)
  trainImage() {
    if (this.train) return this.train;
    const c = document.createElement('canvas'); c.width = 1500; c.height = 410;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 410); g.addColorStop(0, '#d8dce0'); g.addColorStop(0.5, '#b8bcc4'); g.addColorStop(1, '#8a8e94');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 20, 1500, 380, 60) : ctx.rect(0, 20, 1500, 380); ctx.fill();
    ctx.fillStyle = '#c8281e'; ctx.fillRect(0, 300, 1500, 60);
    ctx.fillStyle = '#1e3a6a'; ctx.fillRect(0, 360, 1500, 18);
    for (let k = 0; k < 7; k++) {
      ctx.fillStyle = 'rgba(40,50,60,.9)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(40 + k * 210, 80, 150, 150, 18) : ctx.rect(40 + k * 210, 80, 150, 150); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,220,.25)'; ctx.fillRect(50 + k * 210, 90, 60, 130);
    }
    ctx.fillStyle = '#ffeaa0'; ctx.beginPath(); ctx.ellipse(30, 330, 14, 10, 0, 0, TAU); ctx.fill();
    return (this.train = c);
  },
};

// Cache the drawings that stand still; the bugs you play are drawn live (or from their 3D models)
SpriteCache.registerAll(['nutShell', 'oldTicket', 'acorn', 'antler', 'londonIcon']);
SpriteCache.register('crabSpider', { key(o) { return o.open ? 'o' : 'c'; } });
SpriteCache.register('stagBeetleF', { key(o) { return 'F' + (o.face < 0 ? 0 : 1); } });

// ------------------------------------------------------------------ the red bus
// A London double-decker from the side, about 150 x 84 at s = 1, standing on (x, y) at the middle of its wheels and
// facing `face`. o: { night (lit windows and headlamps), blind (the words on its front), t (for the wheels) }. No
// operator's markings. Used tiny on the London map, and full size in the levels.
LondonArt.bus = function (ctx, x, y, s, face, o) {
  o = o || {};
  ctx.save(); ctx.translate(x, y); ctx.scale((face < 0 ? -1 : 1) * s, s);
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, 2, 80, 6, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(0, -84, 0, 0); g.addColorStop(0, '#e63a2e'); g.addColorStop(1, '#a81e18');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-75, -84, 150, 78, [14, 18, 6, 6]) : ctx.rect(-75, -84, 150, 78); ctx.fill();
  ctx.fillStyle = '#f4f0e4'; ctx.fillRect(-75, -47, 150, 3);                                  // the cream band between the decks
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-75, -10, 150, 4);                           // the skirt
  const glass = o.night ? '#ffe9a0' : '#cfe8f4', dark = o.night ? '#c8a850' : '#9cc0d2';
  for (let k = 0; k < 6; k++) {                                                                // top deck, then the lower one
    ctx.fillStyle = glass; ctx.fillRect(-68 + k * 22, -78, 18, 22);
    if (k < 5) { ctx.fillStyle = glass; ctx.fillRect(-68 + k * 22, -40, 18, 20); }
    if (k % 2 === 0) { ctx.fillStyle = 'rgba(40,30,30,.55)'; ctx.beginPath(); ctx.arc(-59 + k * 22, -62, 5, Math.PI, 0); ctx.fill(); ctx.fillRect(-64 + k * 22, -62, 10, 6); }   // a passenger upstairs
    ctx.fillStyle = dark; ctx.fillRect(-68 + k * 22, -78, 18, 2);
  }
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(44, -40, 14, 30);                                    // the doors
  ctx.fillStyle = glass; ctx.fillRect(46, -38, 10, 20);
  ctx.fillStyle = glass; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(62, -40, 11, 22, 3) : ctx.rect(62, -40, 11, 22); ctx.fill();   // the driver's window
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(40, -82, 33, 9);                                     // the blind
  if (o.blind && s > 0.6) { ctx.save(); ctx.scale(face < 0 ? -1 : 1, 1); ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(o.blind, (face < 0 ? -1 : 1) * 56.5, -75); ctx.restore(); }
  if (o.night) { ctx.fillStyle = 'rgba(255,240,170,.9)'; ctx.beginPath(); ctx.ellipse(75, -16, 3, 4, 0, 0, TAU); ctx.fill(); const b = ctx.createLinearGradient(75, 0, 190, 0); b.addColorStop(0, 'rgba(255,240,170,.35)'); b.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = b; ctx.beginPath(); ctx.moveTo(76, -18); ctx.lineTo(190, -34); ctx.lineTo(190, 2); ctx.lineTo(76, -12); ctx.fill(); }
  else { ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.ellipse(74, -16, 2.4, 3.4, 0, 0, TAU); ctx.fill(); }
  const spin = (o.t || 0) * 6;
  for (const wx of [-46, 40]) {
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(wx, -8, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a8a88'; ctx.beginPath(); ctx.arc(wx, -8, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a5a58'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx + Math.cos(spin) * 5, -8 + Math.sin(spin) * 5); ctx.lineTo(wx - Math.cos(spin) * 5, -8 - Math.sin(spin) * 5); ctx.stroke();
  }
  ctx.restore();
};

// ------------------------------------------------------------------ the London map (painted on the map screen, js/ui.js)
// A storybook map, not to scale: the Thames winding west to east, the parks, a few landmarks, Heathrow in the west
// (the plane home) and a ring of road the red bus drives round. The pins come from the London bugs in js/london.js.
const LDN_MAP = {
  river: [[40, 620], [80, 540, 150, 482, 205, 454], [255, 428, 290, 448, 335, 422], [380, 396, 405, 368, 445, 380], [486, 392, 524, 356, 574, 364], [624, 372, 640, 430, 684, 422], [726, 414, 716, 364, 764, 354], [826, 342, 884, 364, 980, 346]],
  road: [[300, 318], [400, 300], [505, 292], [612, 302], [668, 342], [642, 452], [520, 470], [400, 462], [316, 408]],
  heathrow: [70, 322],
};
function drawLondonMap(ctx, W, H) {
  const r = rng(11);
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#e8e2ce'); g.addColorStop(1, '#ded7c0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // countryside round the edge, rooftops in the middle
  for (let i = 0; i < 110; i++) { const a = r() * TAU, k = 0.92 + r() * 0.3; softBlob(ctx, W / 2 + Math.cos(a) * W * 0.56 * k, H / 2 + Math.sin(a) * H * 0.62 * k, 40 + r() * 46, 'rgba(126,164,92,.3)'); }
  for (let i = 0; i < 620; i++) {
    const x = r() * W, y = r() * H, d = Math.hypot((x - 500) / 480, (y - 330) / 300);
    if (d > 0.95 + r() * 0.2) continue;
    ctx.fillStyle = ['rgba(186,140,112,.34)', 'rgba(168,158,150,.3)', 'rgba(200,168,128,.3)'][i % 3];
    ctx.fillRect(x, y, 7 + r() * 13, 5 + r() * 9);
  }
  // roads: the bus's ring and a few ways out
  const road = (pts, close, w) => {
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (close) ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(150,130,100,.5)'; ctx.lineWidth = w + 3; ctx.stroke();
    ctx.strokeStyle = '#f6f0dc'; ctx.lineWidth = w; ctx.stroke();
  };
  for (const pts of [[[400, 300], [380, 180], [440, 60], [470, 0]], [[612, 302], [700, 200], [820, 120], [960, 70]], [[300, 318], [170, 320], [70, 322]], [[642, 452], [760, 520], [900, 600]], [[400, 462], [330, 540], [300, 600]], [[505, 292], [560, 170], [612, 100]]]) road(pts, false, 4);
  road(LDN_MAP.road, true, 6);
  // the Thames, widening as it runs east
  const river = (w, col, from) => {
    const R = LDN_MAP.river; ctx.beginPath();
    const s = from ? R[from - 1] : R[0]; ctx.moveTo(s[s.length - 2], s[s.length - 1]);
    for (let i = from || 1; i < R.length; i++) ctx.bezierCurveTo(...R[i]);
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke();
  };
  river(26, 'rgba(120,150,90,.4)'); river(18, '#6aaed2'); river(30, '#6aaed2', 6); river(40, '#6aaed2', 7); river(6, 'rgba(255,255,255,.28)');
  // parks: green with trees
  const park = (x, y, rx, ry, n, dense) => {
    plainEll(ctx, x, y, rx + 5, ry + 5, 'rgba(100,140,70,.35)');
    ell(ctx, x, y, rx, ry, '#a8cc7a');
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.86, tx = x + Math.cos(a) * rx * d, ty = y + Math.sin(a) * ry * d;
      softShadow(ctx, tx + 1.5, ty + 2.5, 6, 4, 0.22);
      ell(ctx, tx, ty, 4.5 + r() * 2.5, 4 + r() * 2.5, dense ? (r() < 0.5 ? '#4f7a36' : '#628c40') : (r() < 0.5 ? '#6a9a48' : '#84aa56'));
    }
  };
  park(215, 525, 74, 48, 22);            // Richmond Park
  park(332, 240, 46, 34, 10);            // Regent's Park
  park(322, 346, 44, 16, 8);             // Hyde Park
  park(286, 146, 44, 30, 16);            // Hampstead Heath
  park(404, 100, 32, 24, 28, true);      // Highgate Wood
  park(612, 92, 56, 30, 10);             // Alexandra Park
  park(706, 300, 32, 18, 8);             // Victoria Park
  park(744, 440, 30, 22, 8);             // Greenwich Park
  park(296, 506, 26, 20, 9);             // Wimbledon Common
  park(852, 96, 62, 52, 40, true);       // Epping Forest
  plainEll(ctx, 338, 244, 12, 6, '#7ab8d8');                                                   // the boating lake in Regent's Park
  for (const [dx, dy] of [[-22, -8], [14, 12]]) { ctx.save(); ctx.translate(215 + dx, 525 + dy); ctx.fillStyle = '#8a5a34'; ctx.fillRect(-5, -3, 9, 5); ctx.fillRect(3, -7, 3, 5); ctx.fillRect(-5, 2, 1.6, 5); ctx.fillRect(2.4, 2, 1.6, 5); ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(5, -7); ctx.lineTo(3, -12); ctx.moveTo(5, -7); ctx.lineTo(8, -11); ctx.stroke(); ctx.restore(); }   // deer
  // houses with gardens in the south-east
  for (let i = 0; i < 14; i++) {
    const x = 660 + (i % 5) * 26 + (i % 2) * 5, y = 486 + Math.floor(i / 5) * 24;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x + 2, y + 2, 15, 11);
    ctx.fillStyle = '#e8d8b8'; ctx.fillRect(x, y, 15, 11);
    ctx.fillStyle = i % 2 ? '#a8563e' : '#7a5648'; ctx.beginPath(); ctx.moveTo(x - 2, y + 1); ctx.lineTo(x + 7.5, y - 7); ctx.lineTo(x + 17, y + 1); ctx.fill();
    plainEll(ctx, x + 8, y + 16, 8, 3.4, 'rgba(120,170,90,.8)');
  }
  // landmarks
  const tower = (x, y, w, h, top, a, b) => { const gg = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gg.addColorStop(0, a); gg.addColorStop(1, b); ctx.fillStyle = gg; ctx.fillRect(x - w / 2, y - h, w, h); if (top) top(); };
  // Alexandra Palace on its hill: the long front, the rose window, and the mast the first TV pictures came from
  ctx.save(); ctx.translate(612, 88);
  softShadow(ctx, 2, 12, 40, 8, 0.25);
  ctx.fillStyle = '#d8c8a0'; ctx.fillRect(-36, -10, 72, 20); ctx.fillStyle = '#c4b288'; ctx.fillRect(-36, 6, 72, 4);
  ctx.fillStyle = '#b8a67c'; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(0, -22); ctx.lineTo(10, -10); ctx.fill();
  ctx.fillStyle = '#6a8aa8'; ctx.beginPath(); ctx.arc(0, -6, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#f0e6c8'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#7a6a50'; for (let k = 0; k < 6; k++) if (k !== 2 && k !== 3) ctx.fillRect(-32 + k * 12, -4, 5, 9);
  ctx.fillStyle = '#c4b288'; ctx.fillRect(28, -20, 8, 12);
  ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(29, -20); ctx.lineTo(32, -46); ctx.lineTo(35, -20); ctx.moveTo(30, -29); ctx.lineTo(34, -29); ctx.moveTo(31, -38); ctx.lineTo(33, -38); ctx.stroke();
  ctx.restore();
  tower(432, 300, 7, 40, () => { ctx.fillStyle = '#8a98a4'; ctx.fillRect(427, 268, 10, 10); ctx.fillStyle = '#5a6a76'; ctx.fillRect(431.3, 250, 1.4, 12); }, '#c0ccd4', '#7c8a96');   // the BT Tower
  // St Paul's dome
  ctx.fillStyle = '#d8d4c4'; ctx.fillRect(538, 326, 22, 12); ctx.fillStyle = '#a8b4bc'; ctx.beginPath(); ctx.arc(549, 326, 9, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#c8a850'; ctx.fillRect(548.3, 311, 1.4, 6);
  // Big Ben and the wheel
  tower(446, 372, 6, 26, () => { ctx.fillStyle = '#f4f0dc'; ctx.beginPath(); ctx.arc(446, 351, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a7a50'; ctx.beginPath(); ctx.moveTo(442.5, 346); ctx.lineTo(446, 338); ctx.lineTo(449.5, 346); ctx.fill(); }, '#c8b880', '#9a8a58');
  ctx.strokeStyle = '#f4f4f0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(470, 398, 11, 0, TAU); ctx.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; plainLine(ctx, [470, 398, 470 + Math.cos(a) * 11, 398 + Math.sin(a) * 11], 'rgba(244,244,240,.8)', 0.7); }
  // Tower Bridge across the river, and the Shard
  ctx.fillStyle = '#8a9aa8'; ctx.fillRect(596, 366, 30, 2.4);
  for (const x of [602, 618]) { ctx.fillStyle = '#c8bca0'; ctx.fillRect(x - 3, 354, 6, 16); ctx.fillStyle = '#5a7a98'; ctx.beginPath(); ctx.moveTo(x - 3.5, 354); ctx.lineTo(x, 347); ctx.lineTo(x + 3.5, 354); ctx.fill(); }
  ctx.strokeStyle = '#5a9ac8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(590, 368); ctx.quadraticCurveTo(596, 358, 602, 357); ctx.moveTo(618, 357); ctx.quadraticCurveTo(624, 358, 630, 368); ctx.stroke();
  g = ctx.createLinearGradient(578, 0, 592, 0); g.addColorStop(0, '#d4e4ec'); g.addColorStop(1, '#8aa4b4'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(578, 410); ctx.lineTo(585, 372); ctx.lineTo(592, 410); ctx.fill();
  // the City's towers
  for (let i = 0; i < 6; i++) { const x = 560 + i * 8, h = 14 + ((i * 5) % 4) * 6; tower(x, 344, 6, h, null, '#c8d4dc', '#7a8894'); }
  // Wembley's arch
  ctx.strokeStyle = '#f8f8f4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(232, 222, 16, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); plainEll(ctx, 232, 224, 15, 6, '#b8c8a0'); plainEll(ctx, 232, 224, 11, 3.6, '#78a858');
  // Heathrow: two runways, the terminal and a plane (tap it to fly home: js/ui.js)
  ctx.save(); ctx.translate(LDN_MAP.heathrow[0], LDN_MAP.heathrow[1]);
  for (const dy of [-12, 12]) { ctx.fillStyle = '#9a9890'; ctx.fillRect(-46, dy - 3.5, 92, 7); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-42, dy); ctx.lineTo(42, dy); ctx.stroke(); ctx.setLineDash([]); }
  ctx.fillStyle = '#d8d4c8'; ctx.fillRect(-12, 20, 26, 8);
  ctx.save(); ctx.rotate(0.38); ctx.scale(1.15, 1.15); Sprites.jetPlane(ctx); ctx.restore();
  ctx.restore();
  // labels
  ctx.textAlign = 'center';
  const label = (text, x, y, size, col) => {
    ctx.font = 'italic bold ' + size + 'px Georgia, serif';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,250,235,.75)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = col || '#4a3a22'; ctx.fillText(text, x, y);
  };
  label('London', 110, 64, 34, '#8a2a1e');
  label('River Thames', 838, 392, 15, '#2a5a7a');
  label('Heathrow', 70, 368, 13);
  label('Hampstead Heath', 276, 106, 12, '#3a5a22');
  label('Epping Forest', 852, 166, 12, '#3a5a22');
  label('Wembley', 232, 246, 12);
  label('Greenwich', 800, 446, 12, '#3a5a22');
  label('The City', 590, 318, 12);
  ctx.save(); ctx.translate(910, 540);
  ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fillStyle = 'rgba(255,250,235,.7)'; ctx.fill(); ctx.strokeStyle = '#7a6040'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(6, 0); ctx.lineTo(0, 18); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fillStyle = '#c8501e'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(6, 0); ctx.lineTo(-6, 0); ctx.fillStyle = '#5a4a32'; ctx.fill();
  ctx.restore();
  label('N', 910, 514, 13);
  storybookFinish(ctx, W, H, 77);
  ctx.strokeStyle = 'rgba(90,60,30,.35)'; ctx.lineWidth = 6; ctx.strokeRect(0, 0, W, H);
}

// ------------------------------------------------------------------ people
// A whole person from the side, feet on (q.x, q.y), facing q.face. pose: stand | sit | bend | sleep (in a
// deckchair). prop: phone | paper | guitar | cup | book. hat: 'flowers' (a sunhat). q.wave: waving a bug away;
// q.looking: looking round (a "?" over the head; the red zone is drawn by LondonArt.zone). Clothes, skin and hair
// come from q.seed. Body points for tasks (ankle, neck, bum, nose...) are LDN_BODY in js/london.js.
LondonArt.human = function (ctx, q, t) {
  const r = rng((q.seed || 1) * 7 + 3), pick = (a) => a[Math.floor(r() * a.length)];
  const skin = pick(['#f2cfae', '#e0b088', '#b98054', '#8a5a3a', '#f6d8bc']), top = pick(['#3a6ab0', '#c8501e', '#2f7d5b', '#8a4a9a', '#d8a020', '#5a5a66', '#c03a5a']);
  const bot = pick(['#2a3a5a', '#3a3a3a', '#6a4a3a', '#4a5a3a', '#7a7a88']), hair = pick(['#2a1a10', '#5a3a1e', '#c8a060', '#1a1a1a', '#8a8a8a', '#a8502a']), shoe = pick(['#1a1a1a', '#5a3a2a', '#e8e8e8', '#c8281e']);
  const limb = (pts, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.stroke(); };
  const box = (x, y, w, h, col, rad) => { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, rad || 0) : ctx.rect(x, y, w, h); ctx.fill(); };
  const dot = (x, y, rx, ry, col, rot) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); };
  const foot = (x, y) => box(x - 7, y - 10, 24, 10, shoe, 5);
  const head = (x, y, down) => {
    dot(x, y, 15, 16, skin);
    ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(x - 1, y - 2, 16, Math.PI * 0.82, Math.PI * 1.96); ctx.fill();
    dot(x + 14, y + 3 + (down ? 3 : 0), 3.4, 2.6, skin);                                             // nose
    dot(x + 8, y - 1 + (down ? 3 : 0), 1.8, q.sleepy ? 0.5 : 2.2, '#2a1a10');                        // eye
    ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x + 8, y + 7, 3.4, 0.2, Math.PI - 0.6); ctx.stroke();
    if (q.hat === 'flowers') { dot(x, y - 11, 25, 5, '#e8d49a'); box(x - 12, y - 24, 24, 14, '#e8d49a', 7); for (const [dx, dy, c] of [[-7, -17, '#e04a5a'], [2, -19, '#8a6ac8'], [9, -16, '#f4f4ec'], [-1, -13, '#e87aa8']]) dot(x + dx, y + dy, 3.2, 3.2, c); }
  };
  ctx.save(); ctx.translate(q.x, q.y); ctx.scale(q.face < 0 ? -1 : 1, 1);
  const wave = q.wave ? Math.sin(t * 16) : 0;
  if (q.pose === 'sit') {
    limb([30, -48, 31, -16], bot, 13); limb([31, -17, 31, -11], skin, 9); foot(31, 0);
    limb([0, -52, 30, -50], bot, 15);
    box(-15, -116, 30, 70, top, 10);
    if (q.wave) { limb([2, -108, 16, -134, 18 + wave * 12, -160], top, 10); dot(18 + wave * 12, -164, 6, 7, skin); }
    else if (q.prop === 'phone') { limb([2, -106, 12, -88, 26, -100], top, 10); box(24, -116, 7, 13, '#1a1a1a', 2); box(25, -114, 5, 9, '#9ad0f0', 1); }
    else if (q.prop === 'book') { limb([2, -106, 12, -84, 24, -74], top, 10); box(18, -84, 18, 12, '#b8402a', 2); box(20, -82, 14, 8, '#f4ecd8', 1); }
    else { limb([2, -106, 14, -84, 26, -64], top, 10); dot(27, -62, 5, 5, skin); if (q.prop === 'cup') { box(27, -78, 10, 12, '#f4f0e4', 2); ctx.strokeStyle = '#f4f0e4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(38, -72, 4, -1.2, 1.2); ctx.stroke(); } }
    limb([0, -118, 1, -122], skin, 9);
    head(2, -134, q.prop === 'phone' || q.prop === 'book');
  } else if (q.pose === 'bend') {
    limb([-12, -92, -8, -12], mixHex(bot, '#000000', 0.2), 14); limb([-4, -92, -2, -12], bot, 14); limb([-2, -17, -2, -11], skin, 9); foot(-8, 0); foot(-2, 0);
    dot(-14, -96, 17, 15, bot);                                                                     // trousers, riding low
    dot(-19, -108, 9, 5, skin, -0.3); ctx.strokeStyle = 'rgba(120,70,50,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-21, -112); ctx.lineTo(-18, -104); ctx.stroke();   // and what shows above them
    limb([-8, -102, 36, -92], top, 30);
    limb([32, -90, 40, -58, 42, -32], top, 9); dot(42, -29, 5, 5, skin);
    box(30, -24, 40, 24, '#c8281e', 4); box(44, -30, 12, 8, '#8a1a14', 2);                          // the toolbox
    head(50, -78, true);
  } else if (q.pose === 'sleep') {
    limb([-72, -100, 36, 0], '#7a5a34', 7); limb([-46, 0, 56, -38], '#7a5a34', 7); limb([-72, -100, -80, -108], '#7a5a34', 7);   // the deckchair's crossed legs
    limb([-66, -92, 46, -30], '#e8b030', 14); limb([-66, -92, 46, -30], '#f4f0e4', 4);                 // and its stripy sling
    limb([10, -42, 40, -40, 52, -22], bot, 14); foot(50, -14);
    limb([-34, -60, 10, -42], top, 28);
    limb([-20, -62, -4, -48, 10, -46], top, 9); dot(10, -44, 5, 5, skin);
    q.sleepy = true; head(-46, -64); q.sleepy = false;
    const z = (t * 0.6) % 1; ctx.fillStyle = 'rgba(255,255,255,' + (0.9 - z * 0.9) + ')'; ctx.font = 'bold ' + (14 + z * 8) + 'px sans-serif';
    ctx.save(); ctx.translate(-30, -92 - z * 30); ctx.scale(q.face < 0 ? -1 : 1, 1); ctx.fillText('z', 0, 0); ctx.restore();
  } else {
    limb([-5, -84, -5, -14], mixHex(bot, '#000000', 0.2), 14); limb([5, -84, 5, -17], bot, 14); limb([5, -17, 5, -11], skin, 9); foot(-5, 0); foot(5, 0);
    box(-17, -148, 34, 70, top, 11);
    if (q.prop === 'guitar') { dot(4, -104, 20, 15, '#b8743a', -0.3); dot(4, -104, 6, 5, '#3a2414', -0.3); limb([16, -112, 40, -134], '#7a4a22', 5); }
    if (q.wave) { limb([0, -138, 16, -160, 18 + wave * 12, -190], top, 10); dot(18 + wave * 12, -194, 6, 7, skin); }
    else if (q.prop === 'phone') { limb([0, -138, 8, -116, 22, -134], top, 10); box(20, -152, 8, 14, '#1a1a1a', 2); box(21, -150, 6, 10, '#9ad0f0', 1); }
    else if (q.prop === 'paper') { limb([0, -138, 10, -120, 22, -124], top, 10); box(18, -156, 26, 40, '#f0ead8', 2); ctx.fillStyle = 'rgba(60,60,60,.5)'; for (let k = 0; k < 5; k++) ctx.fillRect(21, -150 + k * 7, 20, 2); }
    else if (q.prop === 'guitar') { limb([0, -138, 10, -122, 8, -106], top, 10); dot(8, -104, 5, 5, skin); }
    else { limb([0, -138, 4, -112, 10, -90], top, 10); dot(11, -87, 5, 5, skin); }
    limb([0, -150, 1, -156], skin, 9);
    head(2, -168, q.prop === 'phone' || q.prop === 'paper');
  }
  ctx.restore();
  if (q.looking) { const e = ldnAt(q, 'head'); ctx.fillStyle = '#c0392b'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', e.x, e.y - 30); }
};
// Where someone looking round can see: the red zone (js/london.js ldnInZone)
LondonArt.zone = function (ctx, q, t) {
  const e = ldnAt(q, 'eyes'), a = q.gaze || 0, glow = 0.15 + 0.06 * Math.sin(t * 6);
  ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, LDN_ZONE.far, a - LDN_ZONE.half, a + LDN_ZONE.half); ctx.closePath();
  ctx.moveTo(e.x + LDN_ZONE.near, e.y); ctx.arc(e.x, e.y, LDN_ZONE.near, 0, TAU);
  ctx.fillStyle = 'rgba(230,40,40,' + glow + ')'; ctx.fill('nonzero');
  ctx.strokeStyle = 'rgba(220,40,40,.55)'; ctx.lineWidth = 2; ctx.stroke();
};

// ------------------------------------------------------------------ animals and things in the levels
LondonArt.rat = function (ctx, x, y, face, sniff, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face < 0 ? -1 : 1, 1);
  const up = sniff ? -5 : 0, run = sniff ? 0 : Math.sin(t * 26) * 3;
  ctx.strokeStyle = '#c89a94'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-18, -8); ctx.quadraticCurveTo(-38, -2 + run, -50, -10); ctx.stroke();   // tail
  ctx.fillStyle = '#6a5a50'; ctx.beginPath(); ctx.ellipse(0, -11, 19, 10, sniff ? -0.25 : 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7a6a5e'; ctx.beginPath(); ctx.ellipse(18, -15 + up, 10, 7.5, -0.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(26, -17 + up); ctx.lineTo(33, -13 + up); ctx.lineTo(25, -10 + up); ctx.fill();
  ctx.fillStyle = '#d8a8a0'; ctx.beginPath(); ctx.ellipse(13, -24 + up, 5, 6, 0.2, 0, TAU); ctx.fill();                            // ear
  ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(22, -17 + up, 1.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8a8a0'; ctx.beginPath(); ctx.arc(33, -13 + up, 1.6, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(240,240,240,.6)'; ctx.lineWidth = 0.8; for (const dy of [-2, 1, 4]) { ctx.beginPath(); ctx.moveTo(30, -13 + up); ctx.lineTo(40, -14 + up + dy + (sniff ? Math.sin(t * 20 + dy) : 0)); ctx.stroke(); }
  ctx.strokeStyle = '#5a4a40'; ctx.lineWidth = 3; for (const lx of [-10, 10]) { ctx.beginPath(); ctx.moveTo(lx, -5); ctx.lineTo(lx + (sniff ? 0 : run * (lx > 0 ? 1 : -1)), 0); ctx.stroke(); }
  ctx.restore();
};
LondonArt.dog = function (ctx, d, t) {
  const alert = d.state === 'alert', snap = d.state === 'snap' && d.t < 0.35;
  ctx.save(); ctx.translate(d.x, d.y);
  const col = '#c8a068', dark = '#8a6a40', hy = alert ? -52 : snap ? -74 : -44, hx = snap ? -14 : -18;
  ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(22, -22); ctx.quadraticCurveTo(34, -34 + Math.sin(t * (alert ? 20 : 6)) * 5, 30, -46); ctx.stroke();   // tail
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(4, alert || snap ? -24 : -18, 22, 15, alert || snap ? -0.3 : -0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = dark; ctx.fillRect(-12, -10, 6, 10); ctx.fillRect(10, -8, 7, 8);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(hx, hy, 13, 11, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx - 13, hy + 3, 8, snap ? 3 : 5, 0, 0, TAU); ctx.fill();                                           // muzzle
  if (snap) { ctx.beginPath(); ctx.ellipse(hx - 12, hy + 10, 8, 3, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(hx - 18, hy + 5, 10, 2); }
  ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(hx + 6, hy - 9, 5, 8, 0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(hx - 5, hy - 3, 1.8, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(hx - 21, hy + 2, 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c0392b'; ctx.fillRect(hx - 2, hy + 9, 10, 3);                                                                  // collar
  ctx.restore();
  if (alert) { ctx.fillStyle = '#c0392b'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', d.x - 18, d.y - 78 - Math.sin(t * 20) * 3); }
};
LondonArt.cat = function (ctx, x, y, c, t) {
  const sleep = c.state === 'asleep', alert = c.state === 'alert', swipe = c.state === 'swipe' && c.t < 0.3, col = '#3a3a40', light = '#f4f0e4';
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(20, -6); ctx.quadraticCurveTo(38, -4 + (alert ? Math.sin(t * 22) * 8 : Math.sin(t * 2) * 3), 40, sleep ? -4 : -22); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(2, sleep ? -11 : -16, 24, sleep ? 11 : 16, 0, 0, TAU); ctx.fill();
  const hx = sleep ? -18 : -16, hy = sleep ? -14 : -36;
  ctx.beginPath(); ctx.ellipse(hx, hy, 12, 11, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx - 10, hy - 6); ctx.lineTo(hx - 8, hy - 18); ctx.lineTo(hx - 1, hy - 9); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx + 10, hy - 6); ctx.lineTo(hx + 8, hy - 18); ctx.lineTo(hx + 1, hy - 9); ctx.fill();
  ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(hx - 3, hy + 4, 5, 4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(-8, -6, 8, 6, 0, 0, TAU); ctx.fill();
  if (sleep) { ctx.strokeStyle = light; ctx.lineWidth = 1.4; for (const ex of [-6, 2]) { ctx.beginPath(); ctx.arc(hx + ex, hy - 1, 3, 0.2, Math.PI - 0.2); ctx.stroke(); } }
  else { ctx.fillStyle = '#c8e048'; for (const ex of [-6, 3]) { ctx.beginPath(); ctx.ellipse(hx + ex, hy - 2, 3, alert ? 3.6 : 2.6, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#101010'; for (const ex of [-6, 3]) ctx.fillRect(hx + ex - 0.7, hy - 5, 1.4, 6); }
  if (swipe) { ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(-46, -52); ctx.stroke(); ctx.fillStyle = light; ctx.beginPath(); ctx.arc(-48, -54, 6, 0, TAU); ctx.fill(); }
  ctx.restore();
  if (sleep) { const z = (t * 0.6) % 1; ctx.fillStyle = 'rgba(255,255,255,' + (0.9 - z * 0.9) + ')'; ctx.font = 'bold ' + (13 + z * 8) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('z', x - 20, y - 34 - z * 26); }
  if (alert) { ctx.fillStyle = '#c0392b'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', x - 16, y - 62 - Math.sin(t * 20) * 3); }
};
// A web across a gap, its spider at the hub (or on its way to whatever is stuck: st)
LondonArt.web = function (ctx, w, st, p) {
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1;
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r); ctx.stroke(); }
  for (let i = 1; i <= 4; i++) { ctx.beginPath(); for (let k = 0; k <= 10; k++) { const a = k / 10 * TAU, rr = w.r * i / 4 * (k % 2 ? 0.94 : 1); k ? ctx.lineTo(w.x + Math.cos(a) * rr, w.y + Math.sin(a) * rr) : ctx.moveTo(w.x + Math.cos(a) * rr, w.y + Math.sin(a) * rr); } ctx.stroke(); }
  const k = st ? Math.min(0.85, st.t / 4.5) : 0, sx = w.x + (st ? (p.x - w.x) * k : 0), sy = w.y + (st ? (p.y - 8 - w.y) * k : 0);
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.4; for (let i = 0; i < 4; i++) for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sgn * (9 + i), sy - 6 + i * 4); ctx.stroke(); }
  ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(sx, sy + 3, 6, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a3420'; ctx.beginPath(); ctx.arc(sx, sy - 4, 3.6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(sx - 3, sy + 1, 6, 1.4); ctx.fillRect(sx - 0.7, sy - 1, 1.4, 7);
};

// ------------------------------------------------------------------ what's in a level, behind the bug
// People, the things that move (a rival bee, rats, mice, the bus behind the wall), each task spot, the level's own
// hazards (dog, cat, webs, jam jar, rival beetles), and a glow with the verb over the spot in reach.
LondonArt.flower = function (ctx, s, floor, t) {
  const sway = Math.sin(t * 1.5 + s.x) * 1.5, x = s.x + sway, gone = s.done || s.used;
  const col = { lavender: '#8a6ac8', foxglove: '#c84a9a', rose: '#e04a5a', daisy: '#f4f4ec', purple: '#9a5ac8', pink: '#e87aa8', comfrey: '#5a6ad8', buddleia: '#8a4ac0' }[s.look] || '#e0a040';
  const c = gone ? mixHex(col, '#c8c0b0', 0.55) : col;
  if (s.look === 'buddleia') {                                    // a long cone of tiny flowers, leaning out of the bush
    ctx.save(); ctx.translate(x, s.y); ctx.rotate(0.5 * (s.x % 2 ? 1 : -1));
    for (let k = 0; k < 9; k++) { const w = 9 - k * 0.8; ell(ctx, (k % 2 ? 2 : -2), 14 - k * 6, w, 4.2, c); if (!gone && k % 3 === 0) plainEll(ctx, (k % 2 ? 2 : -2), 14 - k * 6, 1.6, 1.2, '#f0a030'); }
    ctx.restore();
    if (s.used) LondonArt.footprints(ctx, x, s.y);
    return;
  }
  line(ctx, [s.x, floor, x, s.y + 6], '#4a7a30', 2);
  ell(ctx, s.x - 6, (floor + s.y) / 2, 6, 2.6, '#4a7a30', -0.6); ell(ctx, s.x + 6, (floor + s.y) / 2 + 12, 6, 2.6, '#4a7a30', 0.6);
  if (s.look === 'lavender' || s.look === 'purple') for (let k = 0; k < 7; k++) ell(ctx, x + (k % 2 ? 2 : -2), s.y + 4 - k * 4, 3.4, 2.6, c);
  else if (s.look === 'foxglove') for (let k = 0; k < 5; k++) { ell(ctx, x + 4, s.y + 10 - k * 7, 3.4, 4.6, c, 0.4); plainEll(ctx, x + 5.6, s.y + 12 - k * 7, 1.2, 1, 'rgba(255,255,255,.6)'); }
  else if (s.look === 'daisy') { for (let k = 0; k < 10; k++) ell(ctx, x + Math.cos(k / 10 * TAU) * 8, s.y + Math.sin(k / 10 * TAU) * 3, 4, 1.8, c, k / 10 * TAU); ell(ctx, x, s.y, 3.6, 2.4, '#e8c020'); }
  else if (s.look === 'comfrey') {                                // deep hanging bells: too deep for a short tongue
    line(ctx, [x, s.y + 6, x + 10, s.y - 6, x + 16, s.y - 2], '#4a7a30', 1.6); ell(ctx, x - 8, s.y + 14, 9, 4, '#4a7a30', -0.5);
    for (const [dx, dy] of [[-6, 2], [2, 4], [10, 2], [16, 6]]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + dx - 3, s.y + dy - 6); ctx.lineTo(x + dx + 3, s.y + dy - 6); ctx.lineTo(x + dx + 4.4, s.y + dy + 7); ctx.lineTo(x + dx - 4.4, s.y + dy + 7); ctx.fill(); plainEll(ctx, x + dx, s.y + dy + 7, 4.6, 1.6, mixHex(c, '#ffffff', 0.3)); }
    if (s.done) plainEll(ctx, x + 2, s.y + 2, 1.8, 1.8, '#2a1a3a');   // the hole she bit
  } else { ell(ctx, x, s.y, 9, 7, c); for (let k = 0; k < 4; k++) plainEll(ctx, x - 3 + k * 2, s.y - 2 + (k % 2) * 3, 2.4, 1.6, 'rgba(0,0,0,.15)'); }
  if (!gone && s.look !== 'comfrey') plainEll(ctx, x, s.y - 4, 2, 1.4, 'rgba(255,240,150,.8)');   // nectar's there
  if (s.used) LondonArt.footprints(ctx, x, s.y);
  if (s.crab) Game.drawSprite('crabSpider', { x: x + 2, y: s.y - 2, angle: -0.3, open: s.t > 0, flat: true }, 1.3);
};
LondonArt.footprints = function (ctx, x, y) { ctx.fillStyle = 'rgba(90,60,30,.85)'; for (const [dx, dy] of [[-6, -3], [-2, 1], [3, -4], [7, 0], [0, 5]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.5, 0, TAU); ctx.fill(); } };
LondonArt.spots = function (ctx, g, m) {
  const L = g.level, t = g.t, p = g.player, x0 = g.cam.x - 220, x1 = g.cam.x + W / (Game.zoom || 1) + 220, see = (x) => x > x0 && x < x1;
  for (const mv of g.movers) if (mv.kind === 'bus' && mv.x > x0 - 200 && mv.x < x1 + 200) { ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, 300); ctx.clip(); LondonArt.bus(ctx, mv.x, 392, 2.2, 1, { t }); ctx.restore(); }
  if (L.cat) LondonArt.cat(ctx, L.cat.x, L.cat.y, g.hz.cat, t);
  if (L.jar) {                                                                     // the jam-jar trap on the third table
    const j = L.jar, x = j.x, y = 430;
    ctx.fillStyle = 'rgba(200,225,235,.55)'; ctx.fillRect(x - 12, y - 34, 24, 34); ctx.fillStyle = '#b02848'; ctx.fillRect(x - 12, y - 12, 24, 12);
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 14, y - 38, 28, 6); ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 3, y - 38, 6, 2);
    ctx.strokeStyle = 'rgba(255,200,220,.5)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2; ctx.beginPath(); ctx.moveTo(x - 8 + k * 8, y - 42); ctx.quadraticCurveTo(x - 8 + k * 8 + Math.sin(a) * 6, y - 56, x - 8 + k * 8, y - 70); ctx.stroke(); }
  }
  for (const q of g.people) if (see(q.x)) LondonArt.human(ctx, q, t);
  if (g.hz.dog) {
    const d = g.hz.dog; LondonArt.dog(ctx, d, t);
    plainLine(ctx, [d.x - 12, d.y - (d.state === 'sit' ? 34 : 44), 3008, 474], 'rgba(60,40,30,.8)', 1.6);   // its lead
  }
  for (const s of L.spots) {
    if (!see(s.x)) continue;
    if (s.kind === 'flower' || s.kind === 'rob') this.flower(ctx, s, L.floor, t);
    else if (s.kind === 'post') { ctx.fillStyle = s.done ? '#d8c8a0' : '#a08860'; ctx.fillRect(s.x - 10, s.y - 30, 20, 60); if (s.done) { ctx.strokeStyle = '#f0e6c8'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(s.x - 8, s.y - 10 + k * 5); ctx.lineTo(s.x + 6, s.y - 12 + k * 5); ctx.stroke(); } } }
    else if (s.kind === 'fly' && !s.done) Game.drawSprite('flySide', { x: s.x, y: s.y + 6, angle: 0, face: Math.cos(s.ph * 1.7) < 0 ? 1 : -1, flat: true }, 1.8);
    else if (s.kind === 'giraffe') {
      const flick = s.doneAt !== undefined && t - s.doneAt < 1.6 ? Math.sin((t - s.doneAt) * 30) * 0.7 : 0, bx = s.x - 34, by = 330;
      ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.moveTo(bx - 16, by); ctx.lineTo(bx + 18, by); ctx.lineTo(s.x + 4, s.y + 14); ctx.lineTo(s.x - 16, s.y + 6); ctx.fill();
      ctx.fillStyle = '#a8703a'; for (const [dx, dy] of [[-8, -20], [4, -44], [-2, -70], [8, -92], [0, -112]]) { ctx.beginPath(); ctx.ellipse(bx + dx + (by + dy - by) * -0.25, by + dy, 7, 9, 0.3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.ellipse(s.x + 8, s.y, 24, 12, 0.25, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d8a860'; ctx.beginPath(); ctx.ellipse(s.x + 26, s.y + 6, 9, 7, 0.25, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(s.x - 12, s.y - 8); ctx.rotate(-0.6 + flick); ctx.fillStyle = '#d8a860'; ctx.beginPath(); ctx.ellipse(-8, 0, 10, 4.4, 0, 0, TAU); ctx.fill(); ctx.restore();
      for (const dx of [-4, 4]) { plainLine(ctx, [s.x + dx, s.y - 10, s.x + dx - 2, s.y - 24], '#a8703a', 3); plainEll(ctx, s.x + dx - 2, s.y - 25, 3, 3, '#5a3a1a'); }
      plainEll(ctx, s.x + 10, s.y - 3, 2.2, 2.6, '#1a1210'); plainEll(ctx, s.x + 30, s.y + 4, 1.4, 1, '#5a3a1a');
    } else if (s.kind === 'jam') {
      plainEll(ctx, s.x, 429, 22, 4, '#f4f0e4'); ell(ctx, s.x, 422, 13, 8, '#e0b870'); plainEll(ctx, s.x, 417, 11, 4, '#f0d090');
      if (!s.done) { plainEll(ctx, s.x, 414, 8, 3.4, '#b02848'); plainEll(ctx, s.x - 3, 413, 2.4, 1, 'rgba(255,255,255,.5)'); }
    } else if (s.kind === 'glass') {
      ctx.fillStyle = 'rgba(210,235,245,.55)'; ctx.fillRect(s.x - 9, 398, 18, 32);
      ctx.fillStyle = 'rgba(250,236,150,.9)'; ctx.fillRect(s.x - 9, s.done ? 416 : 404, 18, s.done ? 14 : 26);
      plainLine(ctx, [s.x + 3, 428, s.x + 10, 386], '#e04a5a', 2);
      plainEll(ctx, s.x - 2, 404, 5, 2.4, '#f0e060');
    } else if (s.kind === 'raft1' || s.kind === 'sump') {
      const big = s.kind === 'sump', y = big ? L.floor - 4 : 399, w = big ? 62 : 34;
      ctx.fillStyle = 'rgba(80,110,130,.85)'; ctx.beginPath(); ctx.ellipse(s.x, y, w, big ? 7 : 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(s.x - w * 0.5, y - 2, w * 0.4, 1.5);
      if (!big) { ctx.fillStyle = '#5a5a60'; ctx.fillRect(s.x - 5, 70, 10, 50); ctx.fillRect(s.x - 8, 116, 16, 8); const d = (t * 0.9) % 1; plainEll(ctx, s.x, 126 + d * d * 268, 2.4, 3.4, 'rgba(160,200,230,.9)'); }
      if (s.done) for (let k = 0; k < (big ? 9 : 4); k++) plainEll(ctx, s.x - (big ? 12 : 5) + k * 3, y - 1 + (k % 2), 1.6, 0.9, '#3a2a1a');
    } else if (s.kind === 'pants') {
      ctx.fillStyle = '#7a6a5a'; ctx.fillRect(s.x - 164, 290, 8, 270); ctx.fillRect(s.x + 156, 290, 8, 270);
      ctx.strokeStyle = '#e8e4d8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s.x - 160, 296); ctx.quadraticCurveTo(s.x, 312, s.x + 160, 296); ctx.stroke();
      const sw = Math.sin(t * 1.3) * 2;
      ctx.fillStyle = '#f4f4f0'; ctx.fillRect(s.x - 110 + sw, 304, 50, 60);                                                          // a shirt
      ctx.fillStyle = '#e04a5a'; ctx.beginPath(); ctx.moveTo(s.x - 24 + sw, 308); ctx.lineTo(s.x + 24 + sw, 308); ctx.lineTo(s.x + 26 + sw, 352); ctx.lineTo(s.x + 4 + sw, 352); ctx.lineTo(s.x + sw, 332); ctx.lineTo(s.x - 4 + sw, 352); ctx.lineTo(s.x - 26 + sw, 352); ctx.fill();   // the pants
      ctx.fillStyle = '#fff'; for (const [dx, dy] of [[-12, 320], [8, 316], [14, 336], [-16, 340]]) { ctx.beginPath(); ctx.arc(s.x + dx + sw, dy, 2.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#3a6ab0'; ctx.fillRect(s.x + 70 + sw, 302, 12, 34); ctx.fillRect(s.x + 96 + sw, 302, 12, 34);                 // socks
    } else if (s.kind === 'sap') {
      ctx.fillStyle = 'rgba(210,140,40,.9)'; ctx.beginPath(); ctx.moveTo(s.x - 5, s.y - 60); ctx.quadraticCurveTo(s.x + 8, s.y - 20, s.x - 2, s.y + 6); ctx.quadraticCurveTo(s.x - 10, s.y - 20, s.x - 5, s.y - 60); ctx.fill();
      plainEll(ctx, s.x - 1, s.y + 4, 5, 4, 'rgba(240,180,70,.95)'); plainEll(ctx, s.x - 2, s.y + 2, 1.6, 1.2, 'rgba(255,255,255,.7)');
    } else if (s.kind === 'nettle') { const r = rng(5); for (let k = 0; k < 9; k++) { const x = s.x - 50 + k * 12, h = 50 + r() * 30; line(ctx, [x, L.floor, x + 2, L.floor - h], '#3a6a2a', 2); for (let j = 1; j < 4; j++) { ell(ctx, x - 5, L.floor - h * j / 4, 6, 3, '#4a7a30', -0.5); ell(ctx, x + 7, L.floor - h * j / 4 - 4, 6, 3, '#3f7028', 0.5); } } if (s.done) for (let k = 0; k < 6; k++) plainEll(ctx, s.x - 10 + k * 3, s.y + 6, 1.2, 1.2, '#f4f0d8'); }
    else if (s.kind === 'nest' && m.kind === 'bee') { ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 6, 16, 12, 0, 0, TAU); ctx.fill(); }
    else if (s.kind === 'nest') { ell(ctx, s.x, s.y + 10, 24, 30, '#c8c0b0'); ctx.strokeStyle = 'rgba(120,110,95,.6)'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(s.x, s.y - 10 + k * 7, 22 - Math.abs(k - 3) * 2, 3, 0, 0, Math.PI); ctx.stroke(); } plainEll(ctx, s.x, s.y + 34, 4, 3, '#2a2418'); }
    else if (s.kind === 'female') Game.drawSprite('stagBeetleF', { x: s.x + 14, y: s.y + 12, angle: 0, face: -1, flat: true }, 1.4);
    else if (s.on && s.done) plainEll(ctx, s.x, s.y, 3, 2.4, '#e86060');                                                            // an itchy bite
  }
  for (const mv of g.movers) {
    if (!see(mv.x)) continue;
    if (mv.kind === 'rival') Game.drawSprite('bumblebee', { x: mv.x, y: mv.y + 12, angle: 0, face: mv.face, flat: true, flying: !(mv.sit > 0), moving: true, pollen: 1 }, 1.8);
    else if (mv.kind === 'rat') LondonArt.rat(ctx, mv.x, mv.y, mv.face, mv.sniff > 0, t);
    else if (mv.kind === 'mouse') Game.drawSprite('mouseSide', { x: mv.x, y: mv.y, angle: 0, face: mv.face, flat: true, moving: !(mv.wait > 0) }, 1.2);
  }
  for (const w of L.webs || []) if (see(w.x)) LondonArt.web(ctx, w, g.stuck && g.stuck.web === w ? g.stuck : null, p);
  for (const r of g.rivals || []) if (r.state !== 'gone' && see(r.x)) {
    ctx.save(); ctx.translate(r.x, r.y - 14); ctx.rotate(r.spin || 0); ctx.translate(-r.x, -(r.y - 14));
    Game.drawSprite('stagBeetle', { x: r.x, y: r.y, angle: 0, face: -1, flat: true, moving: r.state === 'fight' }, 1.6);
    ctx.restore();
  }
  const s = g.spot, k = 0.5 + 0.5 * Math.sin(t * 6);
  if (s && !s.done) {
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.9, 0, TAU); ctx.strokeStyle = 'rgba(140,255,120,' + (0.4 + k * 0.4) + ')'; ctx.lineWidth = 3; ctx.stroke();
    if (s.verb) { ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,20,10,.6)'; ctx.strokeText(s.verb + '!', s.x, s.y - s.r - 10 - k * 4); ctx.fillText(s.verb + '!', s.x, s.y - s.r - 10 - k * 4); }
  }
};

// ------------------------------------------------------------------ in front of the bug
// The leaves it hides in, what it carries, the red zones (people looking, the cat's reach, the dog's snap, feet
// about to land), the train, the rain, dusk and the light, a wrestle's meter, and arrows to hunters off screen.
LondonArt.front = function (ctx, g, m) {
  const L = g.level, t = g.t, p = g.player, z = Game.zoom || 1, vw = W / z, vh = H / z, h = g.hz, cy = p.y - m.P.hh / 2;
  for (const f of g.fronts) if (f) { ctx.globalAlpha = g.hidden ? 0.78 : 0.95; ctx.drawImage(f.c, f.x, f.y); }
  ctx.globalAlpha = 1;
  if (p.carry) { plainEll(ctx, p.x + p.face * 5, p.y + 3, p.carry === 'ball' ? 5 : 6, p.carry === 'ball' ? 5 : 3.4, p.carry === 'ball' ? '#7a5a3a' : '#3a3a3a'); if (p.carry === 'ball') plainEll(ctx, p.x + p.face * 4, p.y + 1.6, 1.6, 1.2, 'rgba(255,255,255,.4)'); }
  const red = (x, y, r, a) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = 'rgba(230,40,40,' + a + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(220,40,40,.55)'; ctx.lineWidth = 2; ctx.stroke(); };
  for (const q of g.people) if (q.looking && Math.abs(q.x - p.x) < vw) LondonArt.zone(ctx, q, t);
  if (L.cat && h.cat.state !== 'asleep') red(L.cat.x, L.cat.y - 30, m.CAT_R, h.cat.state === 'alert' ? 0.26 : 0.13 + 0.04 * Math.sin(t * 5));
  if (h.dog) red(h.dog.x, h.dog.y - 44, 130, h.dog.state === 'alert' ? 0.26 : 0.12 + 0.04 * Math.sin(t * 5));
  if (g.shooed > 0) {   // blown off: streaks of air behind her
    const dir = g.shooDir || 1;
    ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, 0.3 + g.shooed) + ')'; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(p.x - dir * 14, cy + i * 7); ctx.lineTo(p.x - dir * 48, cy + i * 9); ctx.stroke(); }
  }
  // the joggers on the path: a red mark where each foot will land, then the leg and its trainer
  for (const s of g.steps || []) {
    if (s.t < 0) { ctx.beginPath(); ctx.ellipse(s.x, L.floor - 2, 34, 9, 0, 0, TAU); ctx.fillStyle = 'rgba(230,40,40,' + (0.2 + 0.25 * (1 + s.t / 1.3)) + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(220,40,40,.6)'; ctx.lineWidth = 2; ctx.stroke(); }
    if (s.t > -0.3) {
      const off = s.t < 0 ? (-s.t / 0.3) * 170 : 0, y = L.floor - off;
      ctx.fillStyle = '#e0b088'; ctx.fillRect(s.x - 2, y - 260, 22, 236);
      ctx.fillStyle = '#f4f4f0'; ctx.fillRect(s.x - 3, y - 44, 24, 24);
      ctx.fillStyle = '#2f7d9b'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(s.x - 44, y - 26, 70, 24, [14, 8, 6, 12]) : ctx.rect(s.x - 44, y - 26, 70, 24); ctx.fill();
      ctx.fillStyle = '#f4f4f0'; ctx.fillRect(s.x - 44, y - 6, 70, 5); ctx.fillStyle = '#ffd23f'; ctx.fillRect(s.x - 20, y - 20, 22, 4);
    }
  }
  const r = g.wrestle;
  if (r) {   // the shoving match: the bar fills as you push him to the edge
    const x = r.x - 66, y = r.y - 76;
    ctx.fillStyle = 'rgba(30,20,10,.7)'; ctx.fillRect(x - 3, y - 3, 126, 16);
    ctx.fillStyle = r.heave ? '#e0a020' : '#4aa84a'; ctx.fillRect(x, y, 120 * clamp(r.m, 0, 1), 10);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x, y, 120, 10);
  }
  if (h.pass > 0) {
    const tc = this.trainImage(), x = g.cam.x + vw + 100 - h.pass * 2600;
    ctx.drawImage(tc, x, 150);
  } else if (h.trainT !== undefined && h.trainT < 3) {   // its lights coming down the tunnel
    const x = g.cam.x + vw - 10, a = 0.3 + 0.5 * (1 - h.trainT / 3);
    const gr = ctx.createRadialGradient(x, 470, 4, x, 470, 160); gr.addColorStop(0, 'rgba(255,250,210,' + a + ')'); gr.addColorStop(1, 'rgba(255,250,210,0)');
    ctx.fillStyle = gr; ctx.fillRect(x - 170, 300, 180, 260);
  }
  // weather and light
  const dark = h.rain && !h.rain.over ? 0.2 : h.cloud > 0 ? 0.2 * (1 - h.cloud / 2.5) : 0;
  if (dark > 0) { ctx.fillStyle = 'rgba(50,60,90,' + dark + ')'; ctx.fillRect(g.cam.x - 20, g.cam.y - 20, vw + 40, vh + 40); }
  if (h.rain && !h.rain.over) {
    ctx.strokeStyle = 'rgba(215,232,255,.65)'; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i = 0; i < 70; i++) { const x = g.cam.x + ((i * 97 + t * 260) % (vw + 80)) - 40, y = g.cam.y + ((i * 53 + t * 900) % vh); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 16); }
    ctx.stroke();
  }
  const dusk = h.dusk || (L.pond ? clamp((p.x - 1500) / 2200, 0, 1) * 0.9 : 0);
  if (dusk > 0) { ctx.fillStyle = 'rgba(22,18,58,' + 0.4 * dusk + ')'; ctx.fillRect(g.cam.x - 20, g.cam.y - 20, vw + 40, vh + 40); }
  if (L.lamp && h.dusk > 0.2) {
    const a = Math.min(1, (h.dusk - 0.2) * 2), gr = ctx.createRadialGradient(L.lamp.x, L.lamp.y, 6, L.lamp.x, L.lamp.y, 240);
    gr.addColorStop(0, 'rgba(255,236,170,' + 0.75 * a + ')'); gr.addColorStop(0.3, 'rgba(255,226,150,' + 0.3 * a + ')'); gr.addColorStop(1, 'rgba(255,226,150,0)');
    ctx.fillStyle = gr; ctx.fillRect(L.lamp.x - 240, L.lamp.y - 240, 480, 480);
  }
  // a hunter you can't see yet: an arrow at the edge of the view
  for (const pr of g.preds) if (pr.state !== 'leave' && (pr.x < g.cam.x || pr.x > g.cam.x + vw)) {
    const left = pr.x < g.cam.x, x = left ? g.cam.x + 24 : g.cam.x + vw - 24, y = clamp(pr.y, g.cam.y + 70, g.cam.y + vh - 40);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(x + (left ? -14 : 14), y); ctx.lineTo(x + (left ? 6 : -6), y - 12); ctx.lineTo(x + (left ? 6 : -6), y + 12); ctx.fill();
    ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', x + (left ? 18 : -18), y + 6);
  }
};

// ------------------------------------------------------------------ the backgrounds
// Each paints its sky and scenery, then the level's own solids, ledges and hiding places (LondonArt.solids), so
// the art and the physics match. The level comes from the game that is starting.
Backgrounds.ldnPark = function (ctx, W, H) {
  const L = Game.g.level;
  LondonArt.sky(ctx, W, '#9ac4e8', '#d8e8f0', '#f0f0e0');
  LondonArt.skyline(ctx, W, 400, 'rgba(150,160,175,.55)', 3);                       // the terraces round the park
  // the BT Tower, seen over the trees from all across Regent's Park
  ctx.fillStyle = 'rgba(130,142,160,.75)'; ctx.fillRect(1490, 150, 20, 260); ctx.fillRect(1483, 196, 34, 46); ctx.fillRect(1480, 250, 40, 10); ctx.fillRect(1498, 104, 4, 48);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let k = 0; k < 5; k++) ctx.fillRect(1483, 200 + k * 9, 34, 3);
  LondonArt.trees(ctx, W, 470, 'rgba(70,110,60,.6)', 8, 32, 70);
  LondonArt.trees(ctx, W, 520, 'rgba(60,100,50,.8)', 9, 20, 50);
  // the Zoo's fence at the far end (a giraffe looks over it: drawn with the level)
  ctx.fillStyle = '#3f6a3a'; ctx.fillRect(3240, 330, 330, 230);
  ctx.strokeStyle = 'rgba(20,40,20,.35)'; ctx.lineWidth = 2; for (let x = 3240; x < 3570; x += 22) { ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 560); ctx.stroke(); }
  ctx.fillStyle = '#f4f0e4'; ctx.fillRect(3262, 372, 74, 34); ctx.fillStyle = '#2f5a2a'; ctx.font = 'bold 22px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('ZOO', 3299, 397);
  LondonArt.grass(ctx, W, 556, '#5a8a3a', '#6a9a44', 4);
  ctx.fillStyle = '#7a5a3a'; for (const x of [240, 840, 1500, 2200, 2580, 3120, 3440]) ctx.fillRect(x, 552, 150, 10);   // flower beds along the path
  ctx.fillStyle = '#6a4a2a'; ctx.fillRect(606, 470, 190, 8); ctx.fillRect(606, 478, 6, 36); ctx.fillRect(790, 478, 6, 36);   // the bench's back
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnPark.noVignette = true;

Backgrounds.ldnCafe = function (ctx, W, H) {
  const L = Game.g.level;
  LondonArt.sky(ctx, W, '#7ab0e0', '#c8e0f0', '#f0eada');
  LondonArt.skyline(ctx, W, 320, '#b8a088', 11);
  ctx.fillStyle = '#a8644a'; ctx.fillRect(0, 300, W, 260);                          // the garden's back wall, brick
  ctx.strokeStyle = 'rgba(240,220,200,.35)'; ctx.lineWidth = 1;
  for (let y = 300; y < 560; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = '#8a7a6a'; ctx.fillRect(0, 294, W, 8);
  ctx.fillStyle = '#8a6a44'; for (let x = 0; x < 720; x += 26) ctx.fillRect(x, 380, 20, 180);   // the wooden fence
  ctx.fillStyle = '#6a5034'; ctx.fillRect(0, 410, 720, 8); ctx.fillRect(0, 500, 720, 8);
  // the café's back door and its sign
  ctx.fillStyle = '#3a4a44'; ctx.fillRect(2100, 380, 110, 180); ctx.fillStyle = 'rgba(255,240,200,.35)'; ctx.fillRect(2112, 394, 86, 70);
  ctx.fillStyle = '#2f5a4a'; ctx.fillRect(2060, 330, 190, 40); ctx.fillStyle = '#f4f0e4'; ctx.font = 'bold 26px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('CAFÉ', 2155, 359);
  ctx.fillStyle = '#c8bca8'; ctx.fillRect(0, 556, W, 44);                           // paving
  ctx.strokeStyle = 'rgba(80,70,60,.3)'; for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 556); ctx.lineTo(x, 600); ctx.stroke(); }
  for (const s of L.solids) if (s[4] === 'table') { const x = s[0] + 85; ctx.fillStyle = '#e8e4d8'; ctx.beginPath(); ctx.moveTo(x - 110, 320); ctx.quadraticCurveTo(x, 262, x + 110, 320); ctx.fill(); ctx.fillStyle = '#c8501e'; ctx.fillRect(x - 110, 318, 220, 5); ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x - 2, 320, 4, 110); }   // parasols
  for (const l of L.ledges) { ctx.fillStyle = '#5a4028'; ctx.fillRect(l[0] + (l[0] % 2 ? 0 : 38), l[1] - 50, 6, 50); }   // chair backs
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnCafe.noVignette = true;

Backgrounds.ldnTube = function (ctx, W, H) {
  const L = Game.g.level, PW = L.solids.find(s => s[4] === 'platform')[2];
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(0, 0, W, 600);
  // tiled wall along the platform, then the dark tunnel
  const g = ctx.createLinearGradient(0, 70, 0, 400); g.addColorStop(0, '#c8c0a8'); g.addColorStop(1, '#a8a088');
  ctx.fillStyle = g; ctx.fillRect(0, 70, PW, 330);
  ctx.strokeStyle = 'rgba(80,70,60,.25)'; ctx.lineWidth = 1;
  for (let y = 70; y < 400; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PW, y); ctx.stroke(); }
  for (let x = 0; x < PW; x += 28) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 400); ctx.stroke(); }
  ctx.fillStyle = '#7a2a24'; ctx.fillRect(0, 150, PW, 16);                          // a coloured band of tiles
  // posters: sunny Perth (where the game began), a West End show, the way out
  const frame = (x, w) => { ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x, 186, w, 128); };
  frame(300, 230);
  let sk = ctx.createLinearGradient(0, 196, 0, 304); sk.addColorStop(0, '#5ab0e8'); sk.addColorStop(0.6, '#bfe4f4'); sk.addColorStop(0.61, '#3a9ac8'); sk.addColorStop(0.8, '#f2e2b0'); sk.addColorStop(1, '#e8d49a');
  ctx.fillStyle = sk; ctx.fillRect(310, 196, 210, 108);
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(486, 222, 16, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a6a48'; ctx.beginPath(); ctx.ellipse(352, 286, 14, 9, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(366, 276, 7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(362, 269, 2.6, 0, TAU); ctx.fill();   // a quokka on the sand
  ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('Sunny PERTH', 414, 232);
  ctx.font = 'bold 12px sans-serif'; ctx.fillText('17 hours by plane', 414, 250);
  frame(1010, 200); ctx.fillStyle = '#2a1a3a'; ctx.fillRect(1020, 196, 180, 108); ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 20px Georgia, serif'; ctx.fillText('BUGS!', 1110, 240); ctx.fillStyle = '#e8e4d8'; ctx.font = '12px sans-serif'; ctx.fillText('the musical', 1110, 260);
  ctx.fillStyle = '#1e3a6a'; ctx.fillRect(1650, 196, 150, 40); ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 20px sans-serif'; ctx.fillText('WAY OUT →', 1725, 223);
  const t = ctx.createLinearGradient(PW, 0, W, 0); t.addColorStop(0, '#3a3a40'); t.addColorStop(1, '#141418');
  ctx.fillStyle = t; ctx.fillRect(PW, 70, W - PW, 490);
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3; for (let x = PW + 50; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 560); ctx.stroke(); }   // tunnel rings
  ctx.fillStyle = 'rgba(160,200,230,.25)'; for (const x of [2380, 2840, 3420, 3850]) ctx.fillRect(x, 70, 3, 60);   // drips down the tunnel wall
  // the track bed, rails and sleepers
  ctx.fillStyle = '#3a3634'; ctx.fillRect(0, 540, W, 60);
  ctx.fillStyle = '#5a4a3a'; for (let x = 0; x < W; x += 30) ctx.fillRect(x, 548, 18, 8);
  ctx.fillStyle = '#9a9aa0'; ctx.fillRect(0, 544, W, 3); ctx.fillRect(0, 552, W, 3);
  LondonArt.solids(ctx, L);
  ctx.fillStyle = 'rgba(40,36,30,.8)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  for (let x = 160; x < PW - 100; x += 380) ctx.fillText('MIND THE GAP', x, 420);  // painted along the platform's edge
  ctx.fillStyle = '#3a4a6a'; ctx.fillRect(1100, 300, 170, 8); ctx.fillRect(1104, 308, 6, 46); ctx.fillRect(1260, 308, 6, 46);   // the bench's back
};
Backgrounds.ldnTube.noVignette = true;

Backgrounds.ldnGarden = function (ctx, W, H) {
  const L = Game.g.level;
  LondonArt.sky(ctx, W, '#8ab8e0', '#e0e8e8', '#f4ead0');
  LondonArt.skyline(ctx, W, 360, '#c09a7a', 21);                                    // the backs of terraced houses
  ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 30; x < W; x += 140) ctx.fillRect(x, 300, 16, 20);
  // the house at the end of the garden, with the kitchen window that lights up at dusk
  ctx.fillStyle = '#b8846a'; ctx.fillRect(2690, 120, 250, 440); ctx.fillStyle = '#7a5a4a'; ctx.beginPath(); ctx.moveTo(2670, 124); ctx.lineTo(2815, 40); ctx.lineTo(2960, 124); ctx.fill();
  ctx.strokeStyle = 'rgba(240,220,200,.3)'; ctx.lineWidth = 1; for (let y = 130; y < 560; y += 12) { ctx.beginPath(); ctx.moveTo(2690, y); ctx.lineTo(2940, y); ctx.stroke(); }
  ctx.fillStyle = '#f4f0e4'; ctx.fillRect(2748, 198, 104, 104); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(2756, 206, 88, 88); ctx.fillStyle = '#f4f0e4'; ctx.fillRect(2797, 206, 6, 88); ctx.fillRect(2756, 247, 88, 6);
  ctx.fillStyle = '#5a6a5a'; ctx.fillRect(2860, 400, 60, 160);
  ctx.fillStyle = '#8a6a48'; for (let x = 0; x < 2690; x += 30) ctx.fillRect(x, 420, 24, 140); for (let x = 2940; x < W; x += 30) ctx.fillRect(x, 420, 24, 140);   // the fence
  ctx.fillStyle = '#6a5034'; ctx.fillRect(0, 450, 2690, 8); ctx.fillRect(2940, 450, W - 2940, 8);
  LondonArt.trees(ctx, W, 470, 'rgba(60,110,60,.55)', 23, 10, 40);
  for (const x of [1800, 1900]) { ctx.fillStyle = '#b8a070'; ctx.fillRect(x - 3, 250, 6, 310); }   // bean poles (a web between them)
  LondonArt.leafBlob(ctx, 1770, 430, 160, 120, ['#3f7a38', '#4a8a40', '#2f6a2e'], 77, 60);
  LondonArt.leafBlob(ctx, 3180, 470, 150, 90, ['#3a5a2a', '#4a6a34', '#6a3a4a'], 78, 50);   // brambles by the nettles
  LondonArt.grass(ctx, W, 556, '#5e9440', '#6aa04a', 24);
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnGarden.noVignette = true;

Backgrounds.ldnRichmond = function (ctx, W, H) {
  const L = Game.g.level;
  LondonArt.sky(ctx, W, '#3a3a6a', '#d88a6a', '#f8c88a');                           // dusk
  const sun = ctx.createRadialGradient(2300, 470, 10, 2300, 470, 260); sun.addColorStop(0, 'rgba(255,230,170,.9)'); sun.addColorStop(1, 'rgba(255,200,140,0)');
  ctx.fillStyle = sun; ctx.fillRect(2000, 200, 600, 400);
  LondonArt.skyline(ctx, W, 470, 'rgba(70,60,90,.45)', 31, [600]);                 // the city far off
  // old oaks in silhouette, and deer on the skyline
  const r = rng(32);
  for (let i = 0; i < 11; i++) { const x = 500 + i * 320 + r() * 80; ctx.fillStyle = 'rgba(40,36,50,.75)'; ctx.fillRect(x - 10, 360, 20, 200); ctx.beginPath(); ctx.ellipse(x, 330, 110, 70, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x - 70, 360, 60, 40, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 70, 356, 60, 40, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(40,36,50,.8)';
  for (const x of [900, 1650, 2560]) { ctx.beginPath(); ctx.ellipse(x, 500, 18, 8, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - 12, 504, 3, 14); ctx.fillRect(x + 10, 504, 3, 14); ctx.fillRect(x + 14, 488, 4, 12); ctx.beginPath(); ctx.ellipse(x + 20, 486, 6, 4, -0.3, 0, TAU); ctx.fill(); plainLine(ctx, [x + 20, 482, x + 18, 472, x + 24, 468], 'rgba(40,36,50,.8)', 1.4); }
  // the great oak by the start, weeping sap
  const tg = ctx.createLinearGradient(230, 0, 370, 0); tg.addColorStop(0, '#4a3828'); tg.addColorStop(0.5, '#6a5038'); tg.addColorStop(1, '#3a2a1c');
  ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(250, 0); ctx.lineTo(350, 0); ctx.lineTo(372, 560); ctx.lineTo(228, 560); ctx.fill();
  ctx.strokeStyle = 'rgba(20,14,8,.5)'; ctx.lineWidth = 2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(258 + k * 14, 10 + (k * 37) % 60); ctx.lineTo(250 + k * 17, 540); ctx.stroke(); }
  LondonArt.grass(ctx, W, 556, '#6a7a3a', '#7a8a44', 33);
  // the pond, and the path the joggers use
  const [p0, p1] = L.pond;
  ctx.fillStyle = '#3a5a7a'; ctx.beginPath(); ctx.ellipse((p0 + p1) / 2, 566, (p1 - p0) / 2, 16, 0, 0, TAU); ctx.fill(); ctx.fillRect(p0 + 10, 566, p1 - p0 - 20, 34);
  ctx.fillStyle = 'rgba(255,220,170,.35)'; ctx.fillRect(p0 + 30, 562, 50, 2); ctx.fillRect(p0 + 90, 570, 40, 2);
  ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = 2; for (const x of [p0 + 4, p0 + 12, p1 - 14, p1 - 5]) { ctx.beginPath(); ctx.moveTo(x, 566); ctx.lineTo(x + 3, 520); ctx.stroke(); }
  ctx.fillStyle = '#b8a888'; ctx.fillRect(L.path[0], 554, L.path[1] - L.path[0], 46);
  ctx.fillStyle = 'rgba(90,80,60,.3)'; for (let i = 0; i < 160; i++) ctx.fillRect(L.path[0] + r() * (L.path[1] - L.path[0]), 556 + r() * 40, 3, 2);
  ctx.fillStyle = '#3a2a1a'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(2860 + (i % 4) * 9 + (i > 3 ? 4 : 0), 556 - Math.floor(i / 4) * 5, 5, 3.4, 0, 0, TAU); ctx.fill(); }   // deer droppings
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnRichmond.noVignette = true;
