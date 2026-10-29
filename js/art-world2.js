'use strict';
// Field-guide drawings of the garden visitors, beach birds and small bugs that the level files define
// (garden.js, web.js, missions2.js). Loaded after them, so these replace those drawings.
// ------------------------------------------------------------------ garden visitors, beach birds, small bugs
Object.assign(Sprites, {
  // New Holland honeyeater: black and white streaked, white eye, white whisker tufts, yellow wing
  // panels and yellow tail edges with white tips. Seen from above.
  honeyeater(ctx, o, t) {
    const flap = o.flying ? Math.sin(t * 22) * 0.3 : 0;
    for (const s of [-1, 1]) { ctx.save(); ctx.rotate(Math.PI + s * 0.12); ell(ctx, 16, 0, 10, 2.6, '#1c1c1c', 0, 'hair'); plainLine(ctx, [10, s * -1.4, 25, s * -1.4], '#f2c832', 1.1); plainEll(ctx, 25, 0, 1.6, 1.4, '#f4f4f4'); ctx.restore(); }
    for (const s of [-1, 1]) { birdWing(ctx, 2, s * 3.5, 22, s * 10, s * (o.flying ? 1.0 + flap : 0.55), '#1a1a1a', '#000', 6); ctx.save(); ctx.translate(2, s * 3.5); ctx.rotate(s * (o.flying ? 1.0 + flap : 0.55)); plainEll(ctx, 9, s * -2.8, 6.5, 1.8, 'rgba(242,200,50,.9)', s * -0.15); ctx.restore(); }
    feathered(ctx, 0, 0, 10.5, 6, '#2a2a2a', 10, 31);
    for (let k = 0; k < 7; k++) plainLine(ctx, [-7 + k * 2.3, -3.2 + (k % 2), -6 + k * 2.3, 3.2 - (k % 2)], 'rgba(245,245,240,.85)', 1);
    ell(ctx, 9.5, 0, 5, 4.6, '#151515', 0, 'hair');
    for (const s of [-1, 1]) { plainEll(ctx, 8, s * 4.2, 2.6, 1, '#f6f6f6', s * 0.4); birdEye(ctx, 10.5, s * 2.6, 1.1, '#f0f0f0'); }
    ctx.beginPath(); ctx.moveTo(14, -1); ctx.quadraticCurveTo(18, -0.6, 20.5, 0.4); ctx.quadraticCurveTo(18, 0.9, 14, 1); ctx.fillStyle = '#111'; ctx.fill();
  },
  // Red wattlebird: a big grey-brown honeyeater, streaked silver-white, long white-tipped tail, red
  // wattles behind the eye, a pale face stripe.
  wattlebird(ctx, o, t) {
    const flap = o.flying ? Math.sin(t * 18) * 0.3 : 0;
    for (const s of [-1, 1]) { ctx.save(); ctx.rotate(Math.PI + s * 0.1); ell(ctx, 20, 0, 13, 3.2, '#5a4d40', 0, 'hair'); plainEll(ctx, 32, 0, 2, 1.8, '#f2f2ea'); ctx.restore(); }
    for (const s of [-1, 1]) birdWing(ctx, 3, s * 4.5, 30, s * 13, s * (o.flying ? 1.0 + flap : 0.5), '#5e5042', '#2a2018', 8);
    feathered(ctx, 0, 0, 13.5, 7.8, '#6e6050', 14, 32);
    for (let k = 0; k < 9; k++) plainLine(ctx, [-10 + k * 2.4, -4.5 + (k % 2), -9 + k * 2.4, 4.5 - (k % 2)], 'rgba(240,235,225,.6)', 0.9);
    plainEll(ctx, -4, 0, 5, 2.4, 'rgba(230,200,60,.45)');
    ell(ctx, 12.5, 0, 6, 5.4, '#5a4d40', 0, 'hair');
    for (const s of [-1, 1]) { plainLine(ctx, [10, s * 3.6, 16, s * 2.2], '#f0ece4', 1.2); birdEye(ctx, 13.5, s * 2.8, 1.2, '#c8302a'); plainEll(ctx, 11, s * 5.4, 1.8, 1.3, '#d8302a', s * 0.3); }
    beak(ctx, 18, 0, 7, 1.6, '#2a2420');
  },
  // Splendid fairy-wren, male: cobalt body, violet-blue cheeks, black nape and breast band, a long
  // tail held cocked up.
  fairyWren(ctx, o, t) {
    const hop = o.moving ? Math.abs(Math.sin(t * 10)) * 1.5 : 0;
    ctx.save(); ctx.translate(0, -hop);
    ctx.save(); ctx.rotate(Math.PI - 0.35); ell(ctx, 12, 0, 9.5, 1.8, '#1a2e6e', 0, 'hair'); ctx.restore();
    for (const s of [-1, 1]) birdWing(ctx, 1, s * 2.8, 13, s * 6, s * 0.6, '#1d3a9a', '#0c1a4a', 5);
    feathered(ctx, 0, 0, 7.5, 5, '#2a5ae0', 8, 33);
    plainEll(ctx, 3.5, 0, 1.2, 4.6, '#101020');
    ell(ctx, 7.5, 0, 4.4, 4, '#3a8cf4', 0, 'hair');
    plainEll(ctx, 5, 0, 1, 3.6, '#101020');
    for (const s of [-1, 1]) { plainEll(ctx, 7.5, s * 3.2, 2.2, 1.2, '#6a7af0', s * 0.3); birdEye(ctx, 8.5, s * 1.9, 0.9, null); }
    beak(ctx, 11.5, 0, 3, 0.9, '#111');
    ctx.restore();
  },
  // Carnaby's black cockatoo: brownish black with pale scalloped feather edges, a big white cheek
  // patch, a white panel in the tail, a short crest and a heavy grey bill.
  cockatoo(ctx, o, t) {
    const flap = o.flying ? Math.sin(t * 9) * 0.35 : 0;
    ctx.save(); ctx.rotate(Math.PI); ell(ctx, 22, 0, 16, 5.5, '#1e1c1a', 0, 'hair'); plainEll(ctx, 24, -2.2, 7, 1.8, '#f2f2ea'); plainEll(ctx, 24, 2.2, 7, 1.8, '#f2f2ea'); for (let k = 0; k < 4; k++) plainLine(ctx, [12 + k * 6, -4.5, 12 + k * 6, 4.5], 'rgba(255,255,255,.1)', 0.6); ctx.restore();
    for (const s of [-1, 1]) birdWing(ctx, 4, s * 6, 44, s * 18, s * (o.flying ? 1.0 + flap : 0.45), '#242220', '#0a0a0a', 9);
    feathered(ctx, 0, 0, 16, 9.5, '#262422', 18, 34);
    // scalloped pale feather edges
    ctx.strokeStyle = 'rgba(220,210,190,.35)'; ctx.lineWidth = 0.6;
    for (let j = -2; j <= 2; j++) for (let i = -4; i <= 3; i++) { const x = i * 3.6 + (j % 2 ? 1.8 : 0), y = j * 3.4; if (Math.hypot(x / 15, y / 9) > 0.95) continue; ctx.beginPath(); ctx.arc(x, y, 1.9, 0.3, Math.PI - 0.3); ctx.stroke(); }
    ell(ctx, 15, 0, 7.5, 6.8, '#1e1c1a', 0, 'hair');
    for (const s of [-1, 1]) { plainEll(ctx, 14, s * 4.4, 3.6, 2.4, '#f0ece2', s * 0.2); birdEye(ctx, 16, s * 2.4, 1.3, '#4a3020'); }
    for (let k = 0; k < 5; k++) plainLine(ctx, [10 + k * 1.2, -1 + (k % 2) * 2, 7 + k * 1.2 - 2, -2 + (k % 2) * 4], '#1a1a1a', 1.6);
    ell(ctx, 22, 0, 4, 3.4, '#8a8a88', 0, 'shell'); plainLine(ctx, [21, 0, 25.5, 0], '#5a5a58', 0.6);
  },
  // Quenda (southern brown bandicoot): a hunched grizzled brown body, a long pointed pink-tipped
  // snout, small rounded ears, a short tail.
  quenda(ctx, o, t) {
    const step = o.moving ? Math.sin(t * 12) * 2 : 0;
    for (const [x, s] of [[9, -1], [9, 1], [-9, -1], [-9, 1]]) { ell(ctx, x + step * s, s * 8.5, 3.4, 2.4, '#4a3624', 0, 'hair'); for (let k = -1; k <= 1; k++) plainLine(ctx, [x + step * s + k * 1.3, s * 10, x + step * s + k * 1.5, s * 11.8], '#2a1a10', 0.7); }
    line(ctx, [-14, 0, -23, 1.5], '#5a4030', 2.6);
    Ground.contact(ctx, 0, 2, 20, 9, 0.35);
    ell(ctx, 0, 0, 15.5, 9.2, '#7a5e40', 0, 'hair');
    fur(ctx, 0, 0, 15, 8.8, '#8a6a46', 90, 1.6, 35);
    fur(ctx, -2, 0, 12, 6, '#c8b088', 24, 1.3, 36);   // grizzled pale tips
    ell(ctx, 14, 0, 7, 6.2, '#7a5e40', 0, 'hair'); fur(ctx, 14, 0, 6.5, 5.8, '#8a6a46', 24, 1.2, 37);
    ell(ctx, 21, 0, 5.5, 2.8, '#8a6a4a', 0, 'hair'); plainEll(ctx, 26, 0, 1.5, 1.3, '#d08a80');
    for (const s of [-1, 1]) { ell(ctx, 10.5, s * 5.8, 2.8, 2.4, '#6a5038', 0, 'hair'); plainEll(ctx, 10.5, s * 5.8, 1.6, 1.3, '#c89a90'); eye(ctx, 16.5, s * 3.2, 1.1, 1.1, '#1a1008'); }
    for (let k = -1; k <= 1; k++) plainLine(ctx, [24, k * 0.8, 29, k * 2.4 - 1], 'rgba(40,30,20,.6)', 0.35);
  },
  // Garden skink: bronze-brown, a dark stripe down each side with a pale line under it, fine scales,
  // a tail longer than the body.
  skink(ctx, o, t) {
    const w = o.moving ? Math.sin(t * 14) * 0.4 : 0;
    for (const [x, s, k] of [[6, -1, 1], [6, 1, -1], [-5, -1, -1], [-5, 1, 1]]) { line(ctx, [x, 0, x + 2 + k * w * 3, s * 6], '#6a5a3a', 1.3); for (let f = -1; f <= 1; f++) plainLine(ctx, [x + 2 + k * w * 3, s * 6, x + 2 + k * w * 3 + f * 1.2, s * 8.2], '#4a3a24', 0.6); }
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-18, w * 6, -28, w * 3); ctx.strokeStyle = '#6a5a3c'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -0.8); ctx.quadraticCurveTo(-18, w * 6 - 0.8, -27, w * 3 - 0.6); ctx.strokeStyle = 'rgba(200,170,110,.5)'; ctx.lineWidth = 0.8; ctx.stroke();
    ell(ctx, 0, 0, 9.5, 3.6, '#8a7048', 0, 'scale');
    plainEll(ctx, 0, 0, 8.5, 1.4, 'rgba(180,140,80,.45)');
    for (const s of [-1, 1]) { plainLine(ctx, [-8, s * 2.4, 9, s * 2.4], 'rgba(40,28,14,.75)', 1); plainLine(ctx, [-8, s * 3.3, 8, s * 3.3], 'rgba(235,220,190,.5)', 0.5); }
    ell(ctx, 10.5, 0, 3.8, 2.9, '#8a7048', 0, 'scale');
    for (const s of [-1, 1]) { plainLine(ctx, [8, s * 2.2, 13, s * 1.6], 'rgba(40,28,14,.7)', 0.8); eye(ctx, 11.2, s * 1.7, 0.8, 0.8, '#1a1008'); }
  },
  // Marbled gecko: velvety grey with dark marbling and pale blotches, big lidless eyes, wide toe pads.
  gecko(ctx, o, t) {
    ctx.save(); ctx.rotate(-(o.angle || 0) - 0.4);
    for (const [x, s] of [[6, -1], [6, 1], [-6, -1], [-6, 1]]) { line(ctx, [x, 0, x + 3, s * 7.5, x + 6, s * 8.5], '#b8a890', 1.5); for (let f = -2; f <= 2; f++) { const a = s * 1.57 + f * 0.45; plainLine(ctx, [x + 6, s * 8.5, x + 6 + Math.cos(a) * 2.6, s * 8.5 + Math.sin(a) * 2.6], '#b0a088', 0.9); plainEll(ctx, x + 6 + Math.cos(a) * 2.8, s * 8.5 + Math.sin(a) * 2.8, 0.7, 0.7, '#c8b8a0'); } }
    line(ctx, [-11, 0, -24, 3, -28, 1], '#b8a890', 3.2);
    ell(ctx, 0, 0, 12.5, 4.8, '#c4b49c', 0, 'grain'); ell(ctx, 13, 0, 5.8, 4.4, '#c4b49c', 0, 'grain');
    const r = rng(38);
    for (let i = 0; i < 12; i++) { const x = -10 + r() * 24, y = (r() - 0.5) * 6; plainEll(ctx, x, y, 1.8 + r() * 1.5, 1.2 + r(), 'rgba(80,65,50,.45)', r() * 3); }
    for (let i = 0; i < 7; i++) { const x = -9 + r() * 22, y = (r() - 0.5) * 5; plainEll(ctx, x, y, 1.2, 0.9, 'rgba(255,250,240,.35)', r() * 3); }
    for (let i = 0; i < 5; i++) plainLine(ctx, [-13 - i * 2.8, 0.6 + i * 0.6, -13 - i * 2.8, -1 + i * 0.3], 'rgba(80,65,50,.4)', 0.8);
    for (const s of [-1, 1]) { eye(ctx, 15, s * 2.6, 1.6, 1.5, '#5a4a30'); plainLine(ctx, [15, s * 1.2, 15, s * 4], '#1a1008', 0.5); }
    ctx.restore();
  },
  // Resin bee (Megachile): a black leafcutter-type bee with white hair bands on the abdomen, a big
  // square head and jaws, pollen carried on hairs under the abdomen.
  resinBee(ctx, o, t) {
    const flap = Math.sin(t * 60) * 0.4;
    legs6r(ctx, 1, 8, '#2a2420', 0.9, t, o.moving, { wide: 1.2 });
    for (const s of [-1, 1]) insectWing(ctx, 0, s * 1.2, 9, 3, s * (2.5 - flap), 'bee', { tint: 'rgba(200,190,170,.5)' });
    for (let i = 3; i >= 0; i--) ell(ctx, -3.5 - i * 1.5, 0, 4.2 - i * 0.5, 3.4 - i * 0.5, '#1c1a18', 0, 'chitin');
    for (let i = 0; i < 4; i++) plainEll(ctx, -2.5 - i * 1.5, 0, 0.5, 3.1 - i * 0.5, 'rgba(245,240,225,.85)');
    plainEll(ctx, -4, 2.2, 3.5, 0.9, 'rgba(230,190,70,.6)');
    ell(ctx, 1.5, 0, 3.2, 3, '#2a2622', 0, 'hair'); fur(ctx, 1.5, 0, 3, 2.8, '#6a6050', 18, 1, 39);
    ell(ctx, 5.3, 0, 2.6, 2.9, '#1c1a18', 0, 'chitin');
    for (const s of [-1, 1]) { facetEye(ctx, 5.2, s * 2.2, 0.9, 1.6, '#3a3230'); antenna(ctx, 6.8, s * 0.8, s * 0.7, 2.5, s * 1.2, 2.5, 4, '#1a1818', 0.5); }
    plainLine(ctx, [7.8, -1, 8.6, 0, 7.8, 1], '#1a1818', 0.8);
  },
  // Transverse ladybird: glossy orange-red with black bands across the back, a black pronotum with
  // two white spots, small black head with white cheeks.
  ladybird(ctx, o, t) {
    legs6r(ctx, 0, 6, '#111', 0.7, t, o.moving, { wide: 1.3 });
    ell(ctx, -1, 0, 6.2, 5.4, '#e03a1a', 0, 'chitin');
    plainLine(ctx, [-7, 0, 4, 0], '#111', 0.9);
    ctx.fillStyle = '#111';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(2.5, s * 0.6); ctx.quadraticCurveTo(0, s * 3.2, -1.5, s * 3.6); ctx.quadraticCurveTo(-2.5, s * 2.6, -1.2, s * 1.4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.ellipse(-4.2, s * 2.6, 1.3, 1, s * 0.4, 0, TAU); ctx.fill(); }
    ell(ctx, 4.2, 0, 1.9, 3.8, '#111', 0, 'chitin'); plainEll(ctx, 3.8, -2.4, 0.9, 0.8, '#f4f4f4'); plainEll(ctx, 3.8, 2.4, 0.9, 0.8, '#f4f4f4');
    ell(ctx, 6.4, 0, 1.3, 1.8, '#111', 0, 'chitin'); plainEll(ctx, 6.6, -1.1, 0.5, 0.4, '#eee'); plainEll(ctx, 6.6, 1.1, 0.5, 0.4, '#eee');
    plainLine(ctx, [7.2, -0.6, 8.4, -1.6], '#111', 0.4); plainLine(ctx, [7.2, 0.6, 8.4, 1.6], '#111', 0.4);
    const [lx, ly] = lightDir(ctx); plainEll(ctx, -1 + lx * 2.5, ly * 2.2, 1.8, 0.9, 'rgba(255,255,255,.4)', Math.atan2(ly, lx) + 1.57);
  },
  // A brown moth (a noctuid): scalloped forewings with dark wavy bands and a pale kidney mark, furry
  // thorax, feathery antennae.
  moth(ctx, o, t) {
    const f = o.stuck ? 0.2 : Math.sin(t * 20) * 0.3;
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(1, s); ctx.rotate(f);
      ctx.beginPath(); ctx.moveTo(2, 1); ctx.quadraticCurveTo(-2, 9, -14, 13); ctx.lineTo(-12, 9); ctx.lineTo(-13, 6); ctx.quadraticCurveTo(-10, 2, -4, 1); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, -14, 13); g.addColorStop(0, '#b8a07a'); g.addColorStop(1, '#8a7050');
      ctx.fillStyle = g; ctx.fill();
      if (Shade.rich) Tex.fillPath(ctx, 'hair', 1, 0.3, 'multiply');
      ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, 2.5); ctx.quadraticCurveTo(-6, 5, -9, 9.5); ctx.moveTo(-6, 1.8); ctx.quadraticCurveTo(-9, 4, -12.5, 8); ctx.strokeStyle = 'rgba(70,50,30,.7)'; ctx.lineWidth = 0.6; ctx.stroke();
      plainEll(ctx, -6.5, 4.5, 1.4, 0.9, 'rgba(240,230,210,.7)', -0.7);
      ell(ctx, -6, 10, 4.5, 3, '#9a8464', 0.3, 'hair');
      ctx.restore();
    }
    ell(ctx, -2, 0, 7, 2.8, '#6a5440', 0, 'hair'); fur(ctx, 0, 0, 4, 2.6, '#8a7458', 24, 1.2, 40);
    for (const s of [-1, 1]) { plainLine(ctx, [5, s * 0.8, 11, s * 5.5], '#4a3a28', 0.6); for (let k = 1; k < 7; k++) plainLine(ctx, [5 + k, s * (0.8 + k * 0.78), 5 + k - 0.6, s * (0.8 + k * 0.78) + s * 1.3], '#5a4a30', 0.3); }
    eye(ctx, 5, -1.6, 1, 1, '#1a1008'); eye(ctx, 5, 1.6, 1, 1, '#1a1008');
  },
  // Christmas beetle: metallic golden brown with striated wing cases and a bright specular shine.
  beetle(ctx, o, t) {
    const f = o.stuck ? 0 : Math.sin(t * 40) * 0.4;
    legs6r(ctx, 2, 12, '#6a4a18', 1.1, t, o.moving, { wide: 1.4 });
    for (const s of [-1, 1]) insectWing(ctx, 2, s * 3, 14, 4, s * (2.3 - f), 'bee', { tint: 'rgba(220,210,190,.5)' });
    for (const s of [-1, 1]) ell(ctx, -3, s * 4.2, 10.5, 4.1, '#c8902a', s * 0.04, 'chitin');
    ctx.strokeStyle = 'rgba(90,50,10,.5)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (const s of [-1, 1]) for (let k = 1; k < 4; k++) { ctx.moveTo(-12, s * k * 1.9); ctx.quadraticCurveTo(-3, s * k * 2.1, 6, s * k * 1.6); } ctx.stroke();
    plainLine(ctx, [-13, 0, 6, 0], 'rgba(90,50,10,.7)', 0.8);
    ell(ctx, 6.5, 0, 4, 4.6, '#b07a22', 0, 'chitin');
    ell(ctx, 10.5, 0, 2.8, 3, '#9a6a1c', 0, 'chitin');
    facetEye(ctx, 11, -2.6, 1.2, 1.3, '#2a1a0a'); facetEye(ctx, 11, 2.6, 1.2, 1.3, '#2a1a0a');
    for (const s of [-1, 1]) { plainLine(ctx, [12.5, s * 1, 15, s * 2.4], '#5a3a10', 0.6); for (let k = 0; k < 3; k++) plainLine(ctx, [15 + k * 0.4, s * (2.4 + k * 0.4), 16.5 + k * 0.3, s * (2.2 + k * 0.9)], '#5a3a10', 0.7); }
  },
  // Silver gull, side view: white head and body, pale grey back and wings, black wingtips with white
  // spots, red bill, red legs and a white eye ring.
  gull(ctx, o, t) {
    ctx.save();
    ctx.rotate(-(o.angle || 0));
    ctx.scale(o.face || 1, 1);
    const flap = o.dive ? -0.9 : Math.sin(t * 7) * 0.8;
    const wing = (back) => {
      ctx.save(); ctx.rotate(flap * (back ? 0.4 : 0.6) + (back ? 0.2 : 0)); if (back) ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-8, -26, -30, -30); ctx.quadraticCurveTo(-12, -14, -8, 0); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, -30, -30); g.addColorStop(0, back ? '#c0c6cc' : '#d8dde2'); g.addColorStop(1, back ? '#a8b0b8' : '#c0c8d0');
      ctx.fillStyle = g; ctx.fill();
      if (Shade.rich) Tex.fillPath(ctx, 'hair', 1, 0.25, 'multiply');
      ctx.strokeStyle = 'rgba(80,90,100,.5)'; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.beginPath(); for (let k = 0; k < 6; k++) { ctx.moveTo(-6 - k * 1.5, -4 - k * 2); ctx.quadraticCurveTo(-14 - k * 2, -14 - k * 1.5, -24 - k * 1, -22 - k * 1.3); } ctx.strokeStyle = 'rgba(80,90,100,.3)'; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-22, -22); ctx.lineTo(-30, -30); ctx.lineTo(-25, -28.5); ctx.lineTo(-19, -20); ctx.closePath(); ctx.fillStyle = '#1a1a1a'; ctx.fill();
      plainEll(ctx, -26, -26, 1, 0.8, '#f4f4f4'); plainEll(ctx, -23, -23.5, 0.8, 0.6, '#f4f4f4');
      ctx.restore();
    };
    wing(true);
    ell(ctx, -2, 0, 16, 7, '#f4f6f8', 0, 'hair');
    ell(ctx, -3, -2.5, 12, 3.6, '#d4dadf', 0, 'hair');
    for (const k of [0, 1, 2]) plainLine(ctx, [-18 - k * 1.5, 1 + k * 0.6, -14 - k * 1.5, -1.5 + k * 0.6], '#2a2a2a', 1.2);
    ell(ctx, -16, -0.5, 6.5, 2.6, '#e8ecf0', 0.15, 'hair');
    wing(false);
    ell(ctx, 12, -4, 6.5, 6, '#f8f8fa', 0, 'hair');
    plainEll(ctx, 14, -6, 1.9, 1.9, '#f0f0f0'); eye(ctx, 14, -6, 1.3, 1.3, '#f6f6f6'); plainEll(ctx, 14.2, -6, 0.75, 0.75, '#111');
    beak(ctx, 17, -3.4, 9, 1.7, '#d83a2a'); plainEll(ctx, 23, -2.4, 1.2, 0.8, 'rgba(120,20,10,.6)');
    if (!o.dive) for (const k of [0, 1]) { line(ctx, [0 + k * 3, 6, -2 + k * 3, 12], '#d83a2a', 1.2); for (const f of [-1, 0, 1]) plainLine(ctx, [-2 + k * 3, 12, -2 + k * 3 + f * 1.5 + 1, 14.5], '#d83a2a', 0.8); }
    ctx.restore();
  },
  // Red-capped plover, side view, running: sandy brown back, white below, a rufous cap and nape, a
  // white forehead, black bill, dark legs.
  plover(ctx, o, t) {
    ctx.save();
    ctx.rotate(-(o.angle || 0));
    ctx.scale(o.face || 1, 1);
    const run = o.moving ? Math.sin(t * 22) : 0;
    for (const [x, k] of [[0, 1], [2, -1]]) { line(ctx, [x, 8, x - 3 + run * 4 * k, 20], '#4a4a4a', 1.3); for (const f of [-1, 0, 1]) plainLine(ctx, [x - 3 + run * 4 * k, 20, x - 3 + run * 4 * k + f * 1.4 + 1, 22.5], '#3a3a3a', 0.8); }
    feathered(ctx, 0, 0, 13, 8.8, '#b8a082', 12, 41);
    ell(ctx, 2, 4, 10, 4.6, '#f8f5ee', 0, 'hair');
    // folded wing with feather edges
    ctx.save(); ctx.beginPath(); ctx.moveTo(6, -4); ctx.quadraticCurveTo(-4, -8, -16, -1); ctx.quadraticCurveTo(-6, 2, 6, -1); ctx.closePath();
    const g = ctx.createLinearGradient(0, -8, 0, 2); g.addColorStop(0, '#9a8468'); g.addColorStop(1, '#7a6448'); ctx.fillStyle = g; ctx.fill();
    if (Shade.rich) Tex.fillPath(ctx, 'hair', 1, 0.3, 'multiply');
    ctx.restore();
    ctx.beginPath(); for (let k = 0; k < 5; k++) { ctx.moveTo(2 - k * 3, -5 + k * 0.4); ctx.quadraticCurveTo(-3 - k * 3, -3 + k * 0.4, -8 - k * 2.5, 0 + k * 0.2); } ctx.strokeStyle = 'rgba(250,245,230,.45)'; ctx.lineWidth = 0.6; ctx.stroke();
    plainLine(ctx, [-13, -1, -19, 1], '#5a4a38', 2.2);
    ell(ctx, 11, -7, 6.5, 6, '#f8f5ee', 0, 'hair');
    ctx.beginPath(); ctx.moveTo(5, -9); ctx.quadraticCurveTo(10, -15, 16, -11); ctx.quadraticCurveTo(12, -11, 8, -8); ctx.closePath(); ctx.fillStyle = '#c0582a'; ctx.fill();
    plainLine(ctx, [6, -8.5, 9, -9.5], '#8a3a1a', 0.5);
    plainEll(ctx, 15.5, -10.5, 2, 1.2, '#fff');
    plainLine(ctx, [8, -6.6, 16, -5.4], '#2a2a2a', 1); eye(ctx, 13, -8, 1.3, 1.3, '#111');
    beak(ctx, 17, -7.2, 6, 1.1, '#1a1a1a');
    ctx.restore();
  },
  // A garden rock (the limestone or laterite you place): painted by Ground.rock so it matches the
  // rocks already lying about the levels.
  rock(ctx, o) { Ground.rock(ctx, 0, 0, 18, o.seed || 2, { kind: o.kind || 'limestone', moss: true }); },
});
