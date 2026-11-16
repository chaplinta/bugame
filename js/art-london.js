'use strict';
// London's art (js/london.js): the five bugs side-on (feet at the origin, facing +x; o.face flips them, and they undo
// the engine's turn themselves), the animals that hunt them, the things found on the way, the five side-on
// backgrounds, and the overlays: task spots, the leaves a hidden bug sits in, the swatting hand and the Tube train.
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
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(l[0], l[1], l[2], 8);              // a bench, a chair seat, a shelf
      ctx.fillStyle = '#4a3220'; ctx.fillRect(l[0] + 6, l[1] + 8, 5, 560 - l[1] - 8); ctx.fillRect(l[0] + l[2] - 11, l[1] + 8, 5, 560 - l[1] - 8);
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
      const cols = kind === 'ivy' ? ['#2a5a2a', '#3a6a34', '#1e4a22'] : kind === 'bracken' ? ['#5a7a2a', '#6a8a34', '#4a6a22', '#8a7a2a'] : ['#2f6a2e', '#3f7a38', '#285a28'];
      this.leafBlob(ctx, -6, -4, w + 12, hh + 6, cols, Math.round(x + y), Math.round(w * hh / 260));
    }
    return { c, x: x - pad, y: y - pad };
  },

  // Task spots: flowers, fence posts, the fly, ankles, the puddle, nettles, the nests and the female, with a glow
  // and the verb over the one in reach
  spots(ctx, g, m) {
    const L = g.level, t = g.t, x0 = g.cam.x - 90, x1 = g.cam.x + W / (Game.zoom || 1) + 90;
    for (const s of L.spots) {
      if (s.x < x0 || s.x > x1) continue;   // off screen
      if (s.kind === 'flower') this.flower(ctx, s, L.floor, t);
      else if (s.kind === 'post') { ctx.fillStyle = s.done ? '#d8c8a0' : '#a08860'; ctx.fillRect(s.x - 10, s.y - 30, 20, 60); if (s.done) { ctx.strokeStyle = '#f0e6c8'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(s.x - 8, s.y - 10 + k * 5); ctx.lineTo(s.x + 6, s.y - 12 + k * 5); ctx.stroke(); } } }
      else if (s.kind === 'fly' && !s.done) Game.drawSprite('flySide', { x: s.x, y: s.y + 6, angle: 0, face: Math.cos(s.ph * 1.7) < 0 ? 1 : -1, flat: true }, 1.8);
      else if (s.kind === 'ankle') this.person(ctx, s);
      else if (s.kind === 'puddle') { ctx.fillStyle = 'rgba(80,110,130,.8)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 4, 46, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(s.x - 20, s.y + 2, 18, 1.5); if (s.done) for (let k = 0; k < 3; k++) plainEll(ctx, s.x - 6 + k * 3, s.y + 2, 1.6, 0.8, '#3a2a1a'); }
      else if (s.kind === 'nettle') { const r = rng(5); for (let k = 0; k < 9; k++) { const x = s.x - 50 + k * 12, h = 50 + r() * 30; line(ctx, [x, L.floor, x + 2, L.floor - h], '#3a6a2a', 2); for (let j = 1; j < 4; j++) { ell(ctx, x - 5, L.floor - h * j / 4, 6, 3, '#4a7a30', -0.5); ell(ctx, x + 7, L.floor - h * j / 4 - 4, 6, 3, '#3f7028', 0.5); } } if (s.done) for (let k = 0; k < 6; k++) plainEll(ctx, s.x - 10 + k * 3, s.y + 6, 1.2, 1.2, '#f4f0d8'); }
      else if (s.kind === 'nest' && m.kind === 'bee') { ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 6, 16, 12, 0, 0, TAU); ctx.fill(); }
      else if (s.kind === 'nest') { ell(ctx, s.x, s.y + 10, 24, 30, '#c8c0b0'); ctx.strokeStyle = 'rgba(120,110,95,.6)'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(s.x, s.y - 10 + k * 7, 22 - Math.abs(k - 3) * 2, 3, 0, 0, Math.PI); ctx.stroke(); } plainEll(ctx, s.x, s.y + 34, 4, 3, '#2a2418'); }
      else if (s.kind === 'female') Game.drawSprite('stagBeetleF', { x: s.x + 14, y: s.y + 12, angle: 0, face: -1, flat: true }, 1.4);
    }
    const s = g.spot, k = 0.5 + 0.5 * Math.sin(t * 6);
    if (s && !s.done) {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.9, 0, TAU); ctx.strokeStyle = 'rgba(140,255,120,' + (0.4 + k * 0.4) + ')'; ctx.lineWidth = 3; ctx.stroke();
      if (s.verb) { ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s.verb + '!', s.x, s.y - s.r - 10 - k * 4); }
    }
  },
  flower(ctx, s, floor, t) {
    const sway = Math.sin(t * 1.5 + s.x) * 1.5, x = s.x + sway, gone = s.done;
    line(ctx, [s.x, floor, x, s.y + 6], '#4a7a30', 2);
    ell(ctx, s.x - 6, (floor + s.y) / 2, 6, 2.6, '#4a7a30', -0.6); ell(ctx, s.x + 6, (floor + s.y) / 2 + 12, 6, 2.6, '#4a7a30', 0.6);
    const col = { lavender: '#8a6ac8', foxglove: '#c84a9a', rose: '#e04a5a', daisy: '#f4f4ec', purple: '#9a5ac8', pink: '#e87aa8' }[s.look] || '#e0a040';
    const c = gone ? mixHex(col, '#c8c0b0', 0.55) : col;
    if (s.look === 'lavender' || s.look === 'purple') for (let k = 0; k < 7; k++) ell(ctx, x + (k % 2 ? 2 : -2), s.y + 4 - k * 4, 3.4, 2.6, c);
    else if (s.look === 'foxglove') for (let k = 0; k < 5; k++) { ell(ctx, x + 4, s.y + 10 - k * 7, 3.4, 4.6, c, 0.4); plainEll(ctx, x + 5.6, s.y + 12 - k * 7, 1.2, 1, 'rgba(255,255,255,.6)'); }
    else if (s.look === 'daisy') { for (let k = 0; k < 10; k++) ell(ctx, x + Math.cos(k / 10 * TAU) * 8, s.y + Math.sin(k / 10 * TAU) * 3, 4, 1.8, c, k / 10 * TAU); ell(ctx, x, s.y, 3.6, 2.4, '#e8c020'); }
    else { ell(ctx, x, s.y, 9, 7, c); for (let k = 0; k < 4; k++) plainEll(ctx, x - 3 + k * 2, s.y - 2 + (k % 2) * 3, 2.4, 1.6, 'rgba(0,0,0,.15)'); }
    if (!gone) plainEll(ctx, x, s.y - 4, 2, 1.4, 'rgba(255,240,150,.8)');   // nectar's there
    if (s.crab) Game.drawSprite('crabSpider', { x: x + 2, y: s.y - 2, angle: -0.3, open: s.t > 0, flat: true }, 1.3);
  },
  // Commuters' legs on the platform: trousers or tights and shoes, still while they wait
  person(ctx, s) {
    const r = rng(Math.round(s.x)), trouser = ['#2a3a5a', '#3a3a3a', '#6a4a3a', '#2a2a2a'][Math.floor(r() * 4)], shoe = ['#1a1a1a', '#5a3a2a', '#c8c8c8'][Math.floor(r() * 3)];
    for (const dx of [-12, 10]) {
      ctx.fillStyle = trouser; ctx.fillRect(s.x + dx - 7, 220, 14, 168);
      ctx.fillStyle = '#e8c8a8'; ctx.fillRect(s.x + dx - 6, 380, 12, 8);
      ctx.fillStyle = shoe; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(s.x + dx - 8, 388, 26, 12, 5) : ctx.rect(s.x + dx - 8, 388, 26, 12); ctx.fill();
    }
    if (s.done) plainEll(ctx, s.x - 12, 384, 2.2, 1.6, '#e88080');            // an itchy bite
  },

  // In front of the bug: the leaves it hides in, the hand and its shadow, the train, arrows to hunters off screen
  front(ctx, g, m) {
    for (const f of g.fronts) if (f) { ctx.globalAlpha = g.hidden ? 0.78 : 0.95; ctx.drawImage(f.c, f.x, f.y); }
    ctx.globalAlpha = 1;
    const h = g.hz;
    if (h && h.swat) {
      const s = h.swat, k = Math.min(1, s.t);
      ctx.fillStyle = 'rgba(0,0,0,' + (0.15 + k * 0.25) + ')'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 20 + k * 40, 14 + k * 26, 0, 0, TAU); ctx.fill();
      if (s.t > 0.75) this.hand(ctx, s.x, s.y - (1 - Math.min(1, (s.t - 0.75) * 4)) * 140);
    }
    if (h && h.pass > 0) {
      const z = Game.zoom || 1, vw = W / z, tc = this.trainImage();
      const x = g.cam.x + vw + 100 - h.pass * 2600;
      ctx.drawImage(tc, x, 150);
    } else if (h && h.trainT !== undefined && h.trainT < 3) {   // its lights coming down the tunnel
      const z = Game.zoom || 1, x = g.cam.x + W / z - 10, a = 0.3 + 0.5 * (1 - h.trainT / 3);
      const gr = ctx.createRadialGradient(x, 470, 4, x, 470, 160); gr.addColorStop(0, 'rgba(255,250,210,' + a + ')'); gr.addColorStop(1, 'rgba(255,250,210,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - 170, 300, 180, 260);
    }
    // a hunter you can't see yet: an arrow at the edge of the view
    const z = Game.zoom || 1, vw = W / z;
    for (const pr of g.preds) if (pr.state !== 'leave' && (pr.x < g.cam.x || pr.x > g.cam.x + vw)) {
      const left = pr.x < g.cam.x, x = left ? g.cam.x + 24 : g.cam.x + vw - 24, y = clamp(pr.y, g.cam.y + 70, g.cam.y + H / z - 40);
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(x + (left ? -14 : 14), y); ctx.lineTo(x + (left ? 6 : -6), y - 12); ctx.lineTo(x + (left ? 6 : -6), y + 12); ctx.fill();
      ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', x + (left ? 18 : -18), y + 6);
    }
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

// ------------------------------------------------------------------ the five backgrounds
Backgrounds.ldnPark = function (ctx, W, H) {
  const L = Game.g.level;
  LondonArt.sky(ctx, W, '#9ac4e8', '#d8e8f0', '#f0f0e0');
  LondonArt.skyline(ctx, W, 400, 'rgba(150,160,175,.55)', 3, [1400]);   // terraces round the park, a tall tower beyond
  LondonArt.trees(ctx, W, 470, 'rgba(70,110,60,.6)', 8, 26, 70);
  LondonArt.trees(ctx, W, 520, 'rgba(60,100,50,.8)', 9, 16, 50);
  LondonArt.grass(ctx, W, 556, '#5a8a3a', '#6a9a44', 4);
  // flower beds along the path
  ctx.fillStyle = '#7a5a3a'; for (const x of [260, 840, 1500, 2200, 2500]) ctx.fillRect(x, 552, 160, 10);
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnPark.noVignette = true;

Backgrounds.ldnCafe = function (ctx, W, H) {
  const L = Game.g.level;
  LondonArt.sky(ctx, W, '#7ab0e0', '#c8e0f0', '#f0eada');
  LondonArt.skyline(ctx, W, 380, '#b8a088', 11);
  ctx.fillStyle = '#a8644a'; ctx.fillRect(0, 300, W, 260);                  // the garden's back wall, brick
  ctx.strokeStyle = 'rgba(240,220,200,.35)'; ctx.lineWidth = 1;
  for (let y = 300; y < 560; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = '#8a6a44'; for (let x = 0; x < 800; x += 26) ctx.fillRect(x, 380, 20, 180);   // the wooden fence
  ctx.fillStyle = '#6a5034'; ctx.fillRect(0, 410, 800, 8); ctx.fillRect(0, 500, 800, 8);
  ctx.fillStyle = '#c8bca8'; ctx.fillRect(0, 556, W, 44);                  // paving
  ctx.strokeStyle = 'rgba(80,70,60,.3)'; for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 556); ctx.lineTo(x, 600); ctx.stroke(); }
  for (const x of [1060, 1820]) { ctx.fillStyle = '#e8e4d8'; ctx.beginPath(); ctx.moveTo(x - 90, 300); ctx.quadraticCurveTo(x, 250, x + 120, 300); ctx.fill(); ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x + 14, 300, 4, 130); }   // parasols
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnCafe.noVignette = true;

Backgrounds.ldnTube = function (ctx, W, H) {
  const L = Game.g.level;
  ctx.fillStyle = '#2a2a30'; ctx.fillRect(0, 0, W, 600);
  // tiled wall along the platform, then the dark tunnel
  const g = ctx.createLinearGradient(0, 70, 0, 400); g.addColorStop(0, '#c8c0a8'); g.addColorStop(1, '#a8a088');
  ctx.fillStyle = g; ctx.fillRect(0, 70, 1650, 330);
  ctx.strokeStyle = 'rgba(80,70,60,.25)'; ctx.lineWidth = 1;
  for (let y = 70; y < 400; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1650, y); ctx.stroke(); }
  for (let x = 0; x < 1650; x += 28) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 400); ctx.stroke(); }
  ctx.fillStyle = '#7a2a24'; ctx.fillRect(0, 150, 1650, 16);                 // a coloured band of tiles
  for (const x of [200, 1200]) { ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x, 190, 220, 120); ctx.fillStyle = '#5a5a60'; ctx.fillRect(x + 10, 200, 200, 100); }   // poster frames
  const t = ctx.createLinearGradient(1650, 0, 3000, 0); t.addColorStop(0, '#3a3a40'); t.addColorStop(1, '#141418');
  ctx.fillStyle = t; ctx.fillRect(1650, 70, 1350, 490);
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3; for (let x = 1700; x < 3000; x += 90) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 560); ctx.stroke(); }   // tunnel rings
  // the track bed, rails and sleepers
  ctx.fillStyle = '#3a3634'; ctx.fillRect(0, 540, W, 60);
  ctx.fillStyle = '#5a4a3a'; for (let x = 0; x < W; x += 30) ctx.fillRect(x, 548, 18, 8);
  ctx.fillStyle = '#9a9aa0'; ctx.fillRect(0, 544, W, 3); ctx.fillRect(0, 552, W, 3);
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnTube.noVignette = true;

Backgrounds.ldnGarden = function (ctx, W, H) {
  const L = Game.g.level;
  LondonArt.sky(ctx, W, '#8ab8e0', '#e0e8e8', '#f4ead0');
  LondonArt.skyline(ctx, W, 360, '#c09a7a', 21);                           // the backs of terraced houses
  ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 30; x < W; x += 140) ctx.fillRect(x, 300, 16, 20);
  ctx.fillStyle = '#8a6a48'; for (let x = 0; x < W; x += 30) ctx.fillRect(x, 420, 24, 140);   // the fence
  ctx.fillStyle = '#6a5034'; ctx.fillRect(0, 450, W, 8);
  LondonArt.trees(ctx, W, 470, 'rgba(60,110,60,.7)', 23, 14, 45);
  LondonArt.grass(ctx, W, 556, '#5e9440', '#6aa04a', 24);
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnGarden.noVignette = true;

Backgrounds.ldnRichmond = function (ctx, W, H) {
  const L = Game.g.level;
  LondonArt.sky(ctx, W, '#3a3a6a', '#d88a6a', '#f8c88a');                   // dusk
  const sun = ctx.createRadialGradient(2300, 470, 10, 2300, 470, 260); sun.addColorStop(0, 'rgba(255,230,170,.9)'); sun.addColorStop(1, 'rgba(255,200,140,0)');
  ctx.fillStyle = sun; ctx.fillRect(2000, 200, 600, 400);
  LondonArt.skyline(ctx, W, 470, 'rgba(70,60,90,.45)', 31, [600]);         // the city far off
  // old oaks in silhouette, and deer on the skyline
  const r = rng(32);
  for (let i = 0; i < 9; i++) { const x = 100 + i * 340 + r() * 80; ctx.fillStyle = 'rgba(40,36,50,.75)'; ctx.fillRect(x - 10, 360, 20, 200); ctx.beginPath(); ctx.ellipse(x, 330, 110, 70, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x - 70, 360, 60, 40, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 70, 356, 60, 40, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(40,36,50,.8)';
  for (const x of [900, 1650]) { ctx.beginPath(); ctx.ellipse(x, 500, 18, 8, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - 12, 504, 3, 14); ctx.fillRect(x + 10, 504, 3, 14); ctx.fillRect(x + 14, 488, 4, 12); ctx.beginPath(); ctx.ellipse(x + 20, 486, 6, 4, -0.3, 0, TAU); ctx.fill(); plainLine(ctx, [x + 20, 482, x + 18, 472, x + 24, 468], 'rgba(40,36,50,.8)', 1.4); }
  LondonArt.grass(ctx, W, 556, '#6a7a3a', '#7a8a44', 33);
  LondonArt.solids(ctx, L);
};
Backgrounds.ldnRichmond.noVignette = true;

// Cache the drawings that stand still; the bugs you play are drawn live (or from their 3D models)
SpriteCache.registerAll(['nutShell', 'oldTicket', 'acorn', 'antler', 'londonIcon']);
SpriteCache.register('crabSpider', { key(o) { return o.open ? 'o' : 'c'; } });
SpriteCache.register('stagBeetleF', { key(o) { return 'F' + (o.face < 0 ? 0 : 1); } });
