'use strict';
// Newer bugs and levels: side-on and isometric views, and more female bugs.
// Every fact here is listed with a source in docs/facts.md.

// ------------------------------------------------------------------ Port Beach, side-on
// The beach is seen from the side: sky and sea above, sand below, with the sandhopper's burrow dug into it.
const Beach = {
  W: 2400, H: 720, sea: 400, bx: 1300, depth: 105,
  ground(x) {
    let y = 520 - x * 0.07;
    if (x > 1800) { const k = clamp((x - 1800) / 260, 0, 1); y -= k * k * (3 - 2 * k) * 80 - k * 22 * Math.sin((x - 1800) / 70); }
    return y;
  },
  inShaft(x) { return Math.abs(x - this.bx) < 18; },
  floor(x, y, enter) {
    // Inside the burrow shaft the floor is the chamber at the bottom. On the surface you only drop in
    // when you mean to (heading home, or pressing down), so walking past the hole never traps you.
    const gy = this.ground(x);
    return this.inShaft(x) && (y > gy + 2 || (enter && y > gy - 30)) ? gy + this.depth : gy;
  },
};

Backgrounds.beach = function (ctx, W, H) {
  const r = rng(77), B = Beach;
  // Dusk sky
  let g = ctx.createLinearGradient(0, 0, 0, 480);
  g.addColorStop(0, '#3a4a8a'); g.addColorStop(0.5, '#c87aa0'); g.addColorStop(0.85, '#f8b070'); g.addColorStop(1, '#ffd890');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Low sun over the sea, and Rottnest Island on the horizon
  const sun = ctx.createRadialGradient(180, 440, 10, 180, 440, 160);
  sun.addColorStop(0, 'rgba(255,240,180,1)'); sun.addColorStop(0.2, 'rgba(255,200,120,.8)'); sun.addColorStop(1, 'rgba(255,180,100,0)');
  ctx.fillStyle = sun; ctx.fillRect(0, 280, 400, 320);
  ctx.fillStyle = '#6a5a7a';
  ctx.beginPath(); ctx.moveTo(-20, 470); ctx.quadraticCurveTo(120, 452, 300, 466); ctx.lineTo(300, 472); ctx.lineTo(-20, 472); ctx.fill();
  for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(500 + r() * 1700, 60 + r() * 200, 60 + r() * 80, 10 + r() * 8, 0, 0, TAU); ctx.fill(); }
  // Port cranes far off to the south
  ctx.strokeStyle = 'rgba(80,70,110,.55)'; ctx.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    const x = 2050 + i * 80;
    ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 200); ctx.lineTo(x + 70, 200); ctx.moveTo(x - 30, 200); ctx.lineTo(x, 200); ctx.moveTo(x, 230); ctx.lineTo(x + 50, 200); ctx.stroke();
  }
  // Sea
  g = ctx.createLinearGradient(0, 470, 0, 640);
  g.addColorStop(0, '#5a8ab8'); g.addColorStop(1, '#2a5a8a');
  ctx.fillStyle = g; ctx.fillRect(0, 470, B.sea + 60, H - 470);
  for (let i = 0; i < 40; i++) { const x = r() * (B.sea + 40), y = 476 + r() * 140; plainLine(ctx, [x, y, x + 14, y], 'rgba(255,255,255,.35)', 1.5); }
  // Sand cross-section: dry on top, damp and darker deeper down
  const surf = () => { ctx.beginPath(); ctx.moveTo(B.sea - 40, H); for (let x = B.sea - 40; x <= W; x += 8) ctx.lineTo(x, B.ground(x)); ctx.lineTo(W, H); ctx.closePath(); };
  surf();
  g = ctx.createLinearGradient(0, 330, 0, H);
  g.addColorStop(0, '#f4e2b4'); g.addColorStop(0.25, '#e2c88e'); g.addColorStop(0.6, '#b8975e'); g.addColorStop(1, '#8a6a40');
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); surf(); ctx.clip();
  // Layers and shells in the sand
  for (let k = 0; k < 4; k++) {
    ctx.beginPath(); for (let x = B.sea - 40; x <= W; x += 20) ctx.lineTo(x, B.ground(x) + 40 + k * 45 + Math.sin(x / 120 + k) * 6);
    ctx.strokeStyle = 'rgba(120,90,50,.18)'; ctx.lineWidth = 3; ctx.stroke();
  }
  for (let i = 0; i < 260; i++) { const x = B.sea + r() * (W - B.sea), y = B.ground(x) + 6 + r() * 220; plainEll(ctx, x, y, 1 + r() * 2, 0.8 + r() * 1.4, r() < 0.5 ? 'rgba(255,250,230,.5)' : 'rgba(90,70,40,.35)'); }
  for (let i = 0; i < 14; i++) { const x = B.sea + 100 + r() * (W - 300), y = B.ground(x) + 40 + r() * 160; ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6); ctx.scale(0.7, 0.7); Sprites.seashell(ctx); ctx.restore(); }
  // Wet sand near the water
  g = ctx.createLinearGradient(B.sea - 40, 0, B.sea + 260, 0);
  g.addColorStop(0, 'rgba(110,90,60,.5)'); g.addColorStop(1, 'rgba(110,90,60,0)');
  ctx.fillStyle = g; ctx.fillRect(B.sea - 40, 380, 300, H);
  // The burrow: shaft and chamber dug into damp sand
  const gy = B.ground(B.bx);
  ctx.fillStyle = '#5a4026';
  ctx.beginPath(); ctx.moveTo(B.bx - 16, gy - 4); ctx.lineTo(B.bx - 18, gy + B.depth); ctx.lineTo(B.bx + 18, gy + B.depth); ctx.lineTo(B.bx + 16, gy - 4); ctx.fill();
  ctx.beginPath(); ctx.ellipse(B.bx, gy + B.depth + 4, 56, 26, 0, 0, TAU); ctx.fill();
  const in1 = ctx.createRadialGradient(B.bx, gy + B.depth, 5, B.bx, gy + B.depth, 56);
  in1.addColorStop(0, 'rgba(255,220,160,.25)'); in1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = in1; ctx.beginPath(); ctx.ellipse(B.bx, gy + B.depth + 4, 56, 26, 0, 0, TAU); ctx.fill();
  ctx.restore();
  // Surface line
  ctx.beginPath(); for (let x = B.sea - 40; x <= W; x += 8) ctx.lineTo(x, B.ground(x));
  ctx.strokeStyle = 'rgba(255,250,220,.8)'; ctx.lineWidth = 3; ctx.stroke();
  // Foam where the waves wash up
  for (let i = 0; i < 6; i++) ell(ctx, B.sea - 30 + i * 18, B.ground(B.sea - 30 + i * 18) - 2, 16, 4, '#ffffff');
  // Dunes: spinifex and coastal plants, and the beach-access sign
  for (let i = 0; i < 26; i++) {
    const x = 1820 + r() * 560, y = B.ground(x);
    for (let k = 0; k < 14; k++) { const a = -Math.PI / 2 + (k / 13 - 0.5) * 2.2; plainLine(ctx, [x, y, x + Math.cos(a) * (26 + r() * 16), y + Math.sin(a) * (26 + r() * 16)], k % 2 ? '#8a9a52' : '#a8b06a', 1.6); }
  }
  const sx = 1880, sy = B.ground(sx);
  plainLine(ctx, [sx, sy, sx, sy - 70], '#6a4a2a', 5);
  ctx.fillStyle = '#2f6a9a'; ctx.fillRect(sx - 44, sy - 100, 88, 34);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PORT BEACH', sx, sy - 78);
  ctx.font = '10px sans-serif'; ctx.fillText('North Fremantle', sx, sy - 68);
  ctx.fillStyle = '#5a4a32'; ctx.font = 'bold 15px sans-serif'; ctx.fillText('Burrow', B.bx, gy + B.depth + 46);
  storybookFinish(ctx, W, H, 12);
};

Object.assign(Sprites, {
  // Coastal sandhopper (family Talitridae), seen from the side, facing right. Female with a brood pouch.
  sandhopper(ctx, o, t) {
    ctx.save();
    ctx.rotate(-(o.angle || 0));
    const face = o.face || (Math.cos(o.angle || 0) < -0.1 ? -1 : 1);
    ctx.scale(face, 1);
    const walk = o.moving ? Math.sin(t * 20) : 0, air = o.air ? 1 : 0;
    // Legs (7 pairs of walking legs, drawn as one side)
    for (let i = 0; i < 7; i++) {
      const x = 9 - i * 3.2, sw = (i % 2 ? walk : -walk) * 2;
      tleg(ctx, x, 3, Math.PI / 2 + (i < 3 ? -0.5 : 0.4) + air * (i < 3 ? -0.6 : 0.6), 4, 4 + sw * 0.4, (i < 3 ? 0.6 : -0.6), '#b89a7a', 1.1);
    }
    // Curved body of overlapping plates
    for (let i = 7; i >= 0; i--) {
      const a = -0.5 + i * 0.16, x = 9 - i * 3.3, y = -1 + Math.sin(i * 0.45) * 2.4 - (i > 5 ? (i - 5) * 1.5 : 0);
      ell(ctx, x, y, 3.6, 5 - i * 0.18, i % 2 ? '#c8ab88' : '#d4b894', a * 0.3);
    }
    // Tail flaps (uropods): the hop comes from flicking these
    for (const k of [0, 1]) line(ctx, [-16, -4, -21 - k * 2, 1 + k * 3 - air * 4], '#a88a6a', 1.2);
    // Brood pouch with eggs
    if (o.eggs !== false) { plainEll(ctx, 3, 4.5, 6, 2.6, 'rgba(240,230,210,.85)'); for (let i = 0; i < 4; i++) plainEll(ctx, 0 + i * 2, 4.6, 0.9, 0.9, '#7a8a5a'); }
    // Head, eye and two pairs of feelers (the second pair long)
    ell(ctx, 12, -2, 3.6, 3.4, '#d0b28e');
    eye(ctx, 13, -3, 1.6, 1.6, '#151010');
    line(ctx, [15, -3, 19, -7, 23, -6], '#9a7a5a', 0.8);
    line(ctx, [15, -1, 21, -2, 28, 2 + Math.sin(t * 6)], '#9a7a5a', 1.1);
    ctx.restore();
  },

  // Silver gull, side view, wings up or down.
  gull(ctx, o, t) {
    ctx.save();
    ctx.rotate(-(o.angle || 0));
    ctx.scale(o.face || 1, 1);
    const flap = o.dive ? -0.9 : Math.sin(t * 7) * 0.8;
    ctx.save(); ctx.rotate(flap * 0.6);
    ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-8, -26, -30, -30); ctx.quadraticCurveTo(-12, -14, -8, 0); ctx.closePath();
    ctx.fillStyle = '#d8dde4'; ctx.fill(); ctx.strokeStyle = 'rgba(80,90,100,.5)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-24, -28); ctx.lineTo(-30, -30); ctx.lineTo(-22, -22); ctx.fillStyle = '#222'; ctx.fill();
    ctx.restore();
    ell(ctx, -2, 0, 16, 7, '#f4f6f8');
    ell(ctx, -15, -1, 7, 3, '#e0e4e8', 0.2);
    ell(ctx, 12, -4, 6.5, 6, '#f8f8fa');
    eye(ctx, 14, -6, 1.4, 1.4, '#f0f0f0');
    plainEll(ctx, 14, -6, 0.7, 0.7, '#111');
    ctx.beginPath(); ctx.moveTo(17, -5); ctx.lineTo(26, -3); ctx.lineTo(17, -1.5); ctx.fillStyle = '#d83a2a'; ctx.fill();
    if (!o.dive) for (const k of [0, 1]) line(ctx, [0 + k * 3, 6, -2 + k * 3, 12], '#d83a2a', 1.2);
    ctx.save(); ctx.rotate(flap * 0.4 + 0.2); ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-14, -20, -34, -20); ctx.quadraticCurveTo(-14, -8, -8, 0); ctx.closePath();
    ctx.fillStyle = '#c8ced6'; ctx.fill(); ctx.restore();
    ctx.restore();
  },

  // Red-capped plover, side view, running.
  plover(ctx, o, t) {
    ctx.save();
    ctx.rotate(-(o.angle || 0));
    ctx.scale(o.face || 1, 1);
    const run = o.moving ? Math.sin(t * 22) : 0;
    line(ctx, [0, 8, -3 + run * 4, 20], '#3a3a3a', 1.4);
    line(ctx, [2, 8, 5 - run * 4, 20], '#3a3a3a', 1.4);
    ell(ctx, 0, 0, 13, 9, '#b8a082');
    ell(ctx, 2, 4, 10, 5, '#f6f2ea');
    ell(ctx, -10, -1, 7, 3, '#8a7458', 0.15);
    ell(ctx, 11, -7, 6.5, 6, '#f6f2ea');
    plainEll(ctx, 10, -12, 5, 2.4, '#c0502a');
    eye(ctx, 13, -8, 1.4, 1.4, '#111');
    plainLine(ctx, [8, -6, 16, -4], '#222', 1.2);
    ctx.beginPath(); ctx.moveTo(17, -8); ctx.lineTo(23, -7); ctx.lineTo(17, -6); ctx.fillStyle = '#222'; ctx.fill();
    ctx.restore();
  },

  wrack(ctx, o) {
    const a = o.amount === undefined ? 1 : o.amount;
    if (a <= 0) return;
    ctx.save(); ctx.rotate(-(o.angle || 0)); ctx.scale(0.5 + a * 0.5, 0.5 + a * 0.5);
    const r = rng(o.seed || 3);
    for (let i = 0; i < 9; i++) {
      const x = (r() - 0.5) * 30, w = 10 + r() * 10;
      ctx.beginPath(); ctx.moveTo(x - w, 4); ctx.quadraticCurveTo(x, -6 - r() * 8, x + w, 4);
      ctx.strokeStyle = ['#4a5a2a', '#6a6a2a', '#3a4a22', '#7a5a2a'][i % 4]; ctx.lineWidth = 3 + r() * 2; ctx.lineCap = 'round'; ctx.stroke();
    }
    for (let i = 0; i < 4; i++) ell(ctx, (r() - 0.5) * 24, -2 + r() * 4, 2.2, 2, '#5a6a2a');
    ctx.restore();
  },

  babyHopper(ctx, o, t) { ctx.save(); ctx.scale(0.45, 0.45); Sprites.sandhopper(ctx, { angle: o.angle, face: o.face, moving: true, eggs: false }, t); ctx.restore(); },
});

Bugs.push({ id: 'sandhopper', name: 'Sandhopper', sci: 'Family Talitridae', place: 'North Fremantle', sprite: 'sandhopper',
  pin: { x: 250, y: 478 }, stages: ['sandhopper'], kind: 'crustacean' });

Object.assign(Missions, {
  sandhopper: {
    id: 'sandhopper', bug: 'sandhopper', stage: 'Adult female', place: 'Port Beach, North Fremantle', view: 'side',
    world: { w: Beach.W, h: Beach.H }, sprite: 'sandhopper', bg: 'beach', escape: 'Hop',
    action: 'Hop', radius: 14, speed: 120, scale: 1.8, goal: 10,
    home: { x: Beach.bx, y: Beach.ground(Beach.bx) + Beach.depth - 12, r: 40, label: '' },
    facts: [
      'Sandhoppers live on sandy beaches all around Australia, including Perth.',
      'They are crustaceans, like crabs and prawns, not insects. They have lots of legs, not 6.',
      'You’re a mother sandhopper. Your eggs are in a pouch under your body.',
    ],
    how: [
      'This beach is side-on! Walk left and right with the arrow keys, or touch and drag.',
      'Press Hop to jump. Hopping is how you escape.',
      'Find the seaweed washed up on the beach and hold or tap Eat. Eat 10 piles.',
      'Then go back to your burrow in the damp sand and drop in. To hide there any time, stand on it and press down (or drag down).',
    ],
    discoveries: [
      { key: 'd_shell', sprite: 'seashell', fx: 0.3, fy: 0 },
      { key: 'd_feather', sprite: 'feather', color: '#d8d8d8', band: '#7a7a7a', fx: 0.68, fy: 0 },
    ],
    factText: {
      start: 'Sandhoppers hide in burrows in damp sand by day and come out at dusk and at night to feed.',
      hop: 'A sandhopper jumps by flicking its tail end against the sand. It can leap many times its own length.',
      wrack: 'Seaweed washed up on the beach is called wrack. Sandhoppers eat it and help break it down.',
      pouch: 'A female sandhopper carries her eggs in a brood pouch under her body. The babies hatch in the pouch.',
      damp: 'Sandhoppers must stay damp. They breathe through gills, like other crustaceans.',
      gull: 'Silver gulls hunt along the beach and gobble up sandhoppers.',
      plover: 'Red-capped plovers are small shorebirds that run along Perth’s beaches catching tiny animals.',
      moon: 'Sandhoppers can use the sun and the moon to find their way back up or down the beach.',
      d_shell: 'A shell from the sea. Empty shells become homes for hermit crabs.',
      d_feather: 'A gull feather, washed up on the sand.',
      win: 'Back home safe! Soon tiny baby sandhoppers will climb out of your pouch.',
    },

    setup(g) {
      const p = g.player;
      p.vy = 0; p.vx = 0; p.face = 1; p.angle = 0; p.onGround = true; p.munchT = 0; p.flat = true;
      for (const f of g.finds) f.y = Beach.ground(f.x) - 6;
      for (let i = 0; i < 7; i++) this.addWrack(i < 4 ? 520 + i * 150 + Math.random() * 40 : 1500 + (i - 4) * 160);
      g.nextPred = 12;
      Game.later(5, () => Game.fact('pouch'));
      Game.later(14, () => Game.fact('damp'));
    },
    addWrack(x) {
      x = x || 520 + Math.random() * 1300;
      if (Beach.inShaft(x) || Math.abs(x - Beach.bx) < 60) x += 90;
      Game.g.items.push({ sprite: 'wrack', kind: 'wrack', x, y: Beach.ground(x) - 4, r: 22, amount: 1, seed: (Math.random() * 1000) | 0, scale: 1.2, flat: true, angle: 0 });
    },
    inBurrow(g) { const p = g.player; return Beach.inShaft(p.x) && p.y > Beach.ground(p.x) + 10; },
    move(g, dt, dx, dy) {
      const p = g.player;
      const enter = dy > 0.5 || g.score >= this.goal || g.preds.some(pr => pr.state === 'chase' || pr.state === 'alert');
      dx = Math.abs(dx) < 0.15 ? 0 : Math.sign(dx);
      p.angle = 0;
      if (dx) p.face = dx > 0 ? 1 : -1;
      const sp = p.onGround ? p.speed : p.speed * 0.6;
      p.vx *= Math.pow(0.04, dt);
      p.x += (dx * sp + p.vx) * dt;
      if (this.inBurrow(g)) p.x = clamp(p.x, Beach.bx - 14, Beach.bx + 14);
      // Hopping out of the burrow: once clear of the hole, land beside it, not back in it
      if (p.exiting && p.y < Beach.ground(p.x) - 14) { p.vx = p.face * 320; p.exiting = false; }
      p.x = clamp(p.x, Beach.sea + 10, Beach.W - 20);
      p.vy += 1100 * dt;
      p.y += p.vy * dt;
      const fl = Beach.floor(p.x, p.y + 12, enter && !p.exiting && p.vy >= 0) - 12;
      p.onGround = p.y >= fl;
      if (p.onGround) { if (p.vy > 300) Game.burst(p.x, fl + 8, '#e8d4a0', 5); p.y = fl; p.vy = 0; }
      p.air = !p.onGround;
      p.moving = !!dx && p.onGround;
    },
    hop(g) {
      const p = g.player;
      if (!p.onGround) return;
      p.vy = -560; p.vx = p.face * 260;
      if (this.inBurrow(g)) {
        // Jump straight up the shaft, then out toward the nearest seaweed
        const w = nearest(g.items.filter(i => i.kind === 'wrack'), p, 99999);
        if (w) p.face = w.x > p.x ? 1 : -1;
        p.vx = 0; p.vy = -620; p.exiting = true;
      }
      p.onGround = false;
      Sound.play('jump');
      Game.fact('hop');
    },
    onCaught(g) { const p = g.player; p.vx = 0; p.vy = 0; },
    update(g, dt, input) {
      const p = g.player;
      // Babies climbing out of the pouch after the win
      for (const b of g.babies || []) { b.x += b.face * 30 * dt; b.y = Beach.floor(b.x, b.y) - 5; }
      for (const w of g.items) w.y = Beach.ground(w.x) - 4;
      const on = p.onGround && g.score < this.goal ? g.items.find(i => i.kind === 'wrack' && Math.abs(i.x - p.x) < 30 && i.amount > 0) : null;
      setAction(on ? 'Eat' : 'Hop', on || p.onGround);
      if (on && working(input)) {
        const w = work(input, dt);
        p.munchT += w; p.munch = true;
        on.amount = Math.max(0.06, 1 - p.munchT);
        Game.fact('wrack');
        if (p.munchT >= 1) {
          p.munchT = 0; g.score++;
          Game.pop(p.x, p.y - 26, 'Yum!', '#a8d060');
          if (g.score === this.goal) { Sound.play('score'); g.toasts.unshift({ text: 'Full up! Hop home to your burrow.', kind: 'hint' }); g.toastT = 0; }
          g.items.splice(g.items.indexOf(on), 1); Game.later(4, () => this.addWrack(p.x < Beach.bx ? Beach.bx + 150 + Math.random() * 500 : Beach.sea + 120 + Math.random() * 600));
        }
        p.progress = Math.min(1, p.munchT);
      } else if (input.pressed) this.hop(g);
      if (!on) p.munch = false;
      if (this.inBurrow(g) && g.score < this.goal && p.stillT > 2) Game.hint('You’re in your burrow. Press Hop to jump out!');
      // Predators take turns: a gull from the sky, or a plover running along the sand.
      g.nextPred -= dt;
      if (g.nextPred <= 0 && !g.preds.length) {
        g.nextPred = 30 + Math.random() * 20;
        g.preds.push(g.predFlip ? this.makePlover(g) : this.makeGull(g));
        g.predFlip = !g.predFlip;
      }
      if (g.score >= this.goal && this.inBurrow(g) && p.onGround) g.homeSafe = true;
    },
    makeGull(g) {
      const p = g.player, m = this, face = Math.random() < 0.5 ? 1 : -1;
      g.toasts.unshift({ text: 'Look out! A silver gull is flying over. Hide in your burrow, or hop away when it dives!', kind: 'hint' });
      g.toastT = 0; Sound.play('caught'); Game.fact('gull');
      return { sprite: 'gull', name: 'silver gull', x: p.x - face * 500, y: 90, r: 18, scale: 1.6, face, angle: 0, ground: true, flat: true, state: 'wander', t: 0,
        update(pr, dt) {
          const p = g.player, hidden = m.inBurrow(g);
          pr.t += dt;
          if (pr.state === 'wander') {
            // Circle overhead, closing in
            const tx = p.x + Math.sin(pr.t * 1.3) * 160;
            pr.x += clamp(tx - pr.x, -200 * dt, 200 * dt); pr.y += (110 - pr.y) * dt;
            pr.face = Math.cos(pr.t * 1.3) > 0 ? 1 : -1;
            if (pr.t > 5 && !hidden && p.invuln <= 0) { pr.state = 'alert'; pr.t = 0; }
            if (pr.t > 14) pr.state = 'leave';
          } else if (pr.state === 'alert') {
            // Hover, then dive at where you are now
            if (pr.t > 0.9) { pr.state = 'chase'; pr.dive = true; pr.tx = p.x; pr.ty = p.y; pr.face = pr.tx > pr.x ? 1 : -1; }
          } else if (pr.state === 'chase') {
            const d = Math.hypot(pr.tx - pr.x, pr.ty - pr.y);
            const sp = 520 * dt;
            if (d > sp) { pr.x += (pr.tx - pr.x) / d * sp; pr.y += (pr.ty - pr.y) / d * sp; }
            else { pr.state = 'wander'; pr.dive = false; pr.t = 2; Game.burst(pr.x, pr.y + 10, '#e8d4a0', 10); }
            if (!hidden && p.invuln <= 0 && dist(pr, p) < 26) { pr.dive = false; Game.caught(pr); }
          } else {
            pr.y -= 160 * dt; pr.x += pr.face * 180 * dt; pr.dive = false;
            if (pr.y < -60) pr.gone = true;
          }
        } };
    },
    makePlover(g) {
      const p = g.player, m = this, from = p.x < Beach.W / 2 ? 1 : -1;
      g.toasts.unshift({ text: 'Look out! A red-capped plover is running along the beach. Hop away or hide!', kind: 'hint' });
      g.toastT = 0; Sound.play('caught'); Game.fact('plover');
      const x = clamp(p.x + from * 600, Beach.sea + 40, Beach.W - 60);
      return { sprite: 'plover', name: 'red-capped plover', x, y: Beach.ground(x) - 18, r: 16, scale: 1.5, face: -from, angle: 0, ground: true, flat: true, state: 'wander', t: 0, chaseT: 0, moving: true,
        update(pr, dt) {
          const p = g.player, hidden = m.inBurrow(g);
          pr.t += dt;
          let sp = 70;
          if (pr.state === 'leave') { sp = 180; pr.face = pr.x < Beach.W / 2 ? -1 : 1; if (pr.x < Beach.sea + 20 || pr.x > Beach.W - 30) pr.gone = true; }
          else if (!hidden && p.invuln <= 0 && pr.chaseT < 4 && Math.abs(p.x - pr.x) < 260 && p.y > Beach.ground(p.x) - 80) {
            // Gives up after a few seconds of chasing
            pr.state = 'chase'; sp = 125; pr.face = p.x > pr.x ? 1 : -1; pr.chaseT += dt;
          } else {
            pr.state = 'wander';
            if (Math.random() < dt * 0.5) pr.face = -pr.face;
          }
          if (pr.t > 20 && pr.state !== 'chase') pr.state = 'leave';
          pr.x = clamp(pr.x + pr.face * sp * dt, Beach.sea, Beach.W);
          pr.y = Beach.ground(pr.x) - 18;
          if (pr.state === 'chase' && !hidden && p.invuln <= 0 && Math.abs(pr.x - p.x) < 22 && Math.abs(pr.y - p.y) < 30) Game.caught(pr);
        } };
    },
    drawExtra(ctx, g) {
      // Shadows of birds on the sand, and babies after the win
      for (const pr of g.preds) {
        const gy = Beach.ground(pr.x);
        if (pr.sprite === 'gull') softShadow(ctx, pr.x, gy, 30 * (1 - clamp((gy - pr.y) / 500, 0, 0.7)), 6, 0.3);
      }
      for (const b of g.babies || []) Game.drawSprite('babyHopper', b, 1.6);
      // Hopper's own shadow on the sand while jumping
      const p = g.player;
      if (p.air && !this.inBurrow(g)) softShadow(ctx, p.x, Beach.ground(p.x), 14, 4, 0.3);
    },
    goalPoint(g) {
      if (g.score >= this.goal) return { x: Beach.bx, y: Beach.ground(Beach.bx) };
      return nearest(g.items.filter(i => i.kind === 'wrack'), g.player, 99999);
    },
    hud(g) {
      if (g.score >= this.goal) setHud('Hop home to your burrow!', '');
      else setHud('Seaweed: ' + g.score + ' / ' + this.goal, this.inBurrow(g) ? 'Safe in burrow' : '');
    },
    won(g) {
      if (!g.homeSafe) return false;
      if (!g.babies) {
        g.babies = [];
        for (let i = 0; i < 4; i++) g.babies.push({ x: g.player.x + (i - 1.5) * 8, y: g.player.y, r: 0, face: i < 2 ? -1 : 1, angle: 0, flat: true });
      }
      return true;
    },
  },
});

// Same rules as the first bugs (see the end of missions.js): first stages are gentle, and the tank fact.
function finishMissions() {
  for (const bug of Bugs) Missions[bug.stages[0]].gentle = true;
  for (const id in Missions) Missions[id].factText.tank = 'It’s fine to catch a bug to have a look, but always let it go where you found it.';
}
finishMissions();

// ------------------------------------------------------------------ Backyard barbecue, isometric
// Painted as an isometric yard: lawn tiles, patio, house wall and fence. Things are drawn back to front.
const ISO_TILE = { w: 96, h: 48 };

function isoDiamond(ctx, x, y, w, h, fill, stroke) {
  ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x + w / 2, y); ctx.lineTo(x, y + h / 2); ctx.lineTo(x - w / 2, y); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
// An isometric box: base centre (x, y), footprint a x b (along the two iso axes), height h.
function isoBox(ctx, x, y, a, b, h, top, left, right) {
  const ax = a * 0.5, ay = a * 0.25, bx = b * 0.5, by = b * 0.25;
  const N = [x - ax + bx, y - ay - by], E = [x + ax + bx, y + ay - by], S = [x + ax - bx, y + ay + by], Wp = [x - ax - bx, y - ay + by];
  const poly = (pts, c) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.stroke(); };
  poly([Wp, S, [S[0], S[1] - h], [Wp[0], Wp[1] - h]], left);
  poly([S, E, [E[0], E[1] - h], [S[0], S[1] - h]], right);
  poly([[N[0], N[1] - h], [E[0], E[1] - h], [S[0], S[1] - h], [Wp[0], Wp[1] - h]], top);
}

Backgrounds.yard = function (ctx, W, H) {
  const r = rng(51), T = ISO_TILE;
  ctx.fillStyle = '#7aa04a'; ctx.fillRect(0, 0, W, H);
  // Lawn tiles
  for (let j = -1; j < H / (T.h / 2) + 2; j++) for (let i = -1; i < W / T.w + 2; i++) {
    const x = i * T.w + (j % 2 ? T.w / 2 : 0), y = j * T.h / 2;
    const v = r();
    isoDiamond(ctx, x, y, T.w, T.h, v < 0.33 ? '#86ac54' : v < 0.66 ? '#7ea44e' : '#8ab25a');
  }
  for (let i = 0; i < 2500; i++) { const x = r() * W, y = r() * H; plainLine(ctx, [x, y, x + (r() - 0.5) * 3, y - 3 - r() * 4], r() < 0.5 ? 'rgba(60,100,30,.45)' : 'rgba(170,200,110,.45)', 1); }
  // Patio pavers
  for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) {
    const x = 980 + (i - j) * 40, y = 420 + (i + j) * 20;
    isoDiamond(ctx, x, y, 78, 38, (i + j) % 2 ? '#d8c8a8' : '#cdbb98', 'rgba(120,100,70,.4)');
  }
  // House: back wall with weatherboards, a window and a sliding door
  ctx.fillStyle = '#e9e2d0'; ctx.fillRect(0, 0, W, 230);
  for (let y = 10; y < 230; y += 14) plainLine(ctx, [0, y, W, y], 'rgba(150,140,120,.35)', 1.5);
  ctx.fillStyle = '#8a5a3a'; ctx.fillRect(0, 0, W, 26);
  const g1 = ctx.createLinearGradient(0, 26, 0, 70); g1.addColorStop(0, 'rgba(0,0,0,.25)'); g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 26, W, 44);
  for (const [x, w] of [[380, 160], [1300, 160]]) {
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, 70, w + 12, 102);
    const gw = ctx.createLinearGradient(x, 76, x + w, 166); gw.addColorStop(0, '#a8d0e8'); gw.addColorStop(1, '#5a8ab0');
    ctx.fillStyle = gw; ctx.fillRect(x, 76, w, 90);
    plainLine(ctx, [x + w / 2, 76, x + w / 2, 166], '#fff', 4);
    plainLine(ctx, [x + 20, 160, x + 60, 84], 'rgba(255,255,255,.4)', 6);
  }
  ctx.fillStyle = '#fff'; ctx.fillRect(820, 60, 260, 172);
  ctx.fillStyle = '#6a8aa0'; ctx.fillRect(830, 68, 118, 164); ctx.fillRect(952, 68, 118, 164);
  ctx.fillStyle = 'rgba(255,240,180,.35)'; ctx.fillRect(830, 68, 118, 164);
  // Light by the door (mozzies love a light at night)
  const lg = ctx.createRadialGradient(1110, 70, 4, 1110, 70, 120); lg.addColorStop(0, 'rgba(255,240,170,.8)'); lg.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = lg; ctx.fillRect(990, 0, 240, 200);
  ell(ctx, 1110, 70, 9, 9, '#fff6c8');
  // Wall base shadow onto the lawn
  const g2 = ctx.createLinearGradient(0, 230, 0, 270); g2.addColorStop(0, 'rgba(0,0,0,.25)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 230, W, 40);
  // Colorbond-style fence down the right side
  for (let i = 0; i < 20; i++) {
    const x = 1560 + i * 20, y = 240 + i * 10;
    ctx.fillStyle = i % 2 ? '#7a8a7a' : '#8a9a8a';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y + 10); ctx.lineTo(x + 20, y - 150); ctx.lineTo(x, y - 160); ctx.closePath(); ctx.fill();
  }
  // Garden bed along the left, with shrubs
  isoDiamond(ctx, 180, 520, 300, 520, '#6a4a30');
  for (let i = 0; i < 9; i++) { const x = 100 + r() * 160, y = 340 + r() * 360; softShadow(ctx, x + 8, y + 10, 34, 16, 0.3); ell(ctx, x, y - 10, 30, 26, '#4a7a3a'); ell(ctx, x - 8, y - 18, 16, 14, '#6a9a4a'); }
  storybookFinish(ctx, W, H, 33);
};

Object.assign(Sprites, {
  // A person, drawn from the side in the iso yard. o.pose 'stand' or 'sit'; o.look turns the head.
  person(ctx, o, t) {
    const f = o.face || 1, sk = o.skin, sh = o.shirt, pa = o.pants, sit = o.pose === 'sit';
    softShadow(ctx, 0, 0, 34, 12, 0.3);
    ctx.save(); ctx.scale(f, 1);
    const bob = Math.sin(t * 2 + (o.seed || 0)) * 1.2;
    if (sit) {
      // Legs out in front, on a chair
      isoBox(ctx, -6, -2, 34, 30, 40, '#e8e8e8', '#c8c8c8', '#d8d8d8');
      line(ctx, [-6, -46, 22, -46, 26, -6], pa, 13);
      line(ctx, [22, -40, 26, -4], sk, 9);
      ell(ctx, 30, -3, 8, 4, '#3a3a3a');
    } else {
      line(ctx, [-5, -50, -6, -6], sk, 9); line(ctx, [6, -50, 6, -6], sk, 9);
      ell(ctx, -5, -3, 8, 4, '#3a3a3a'); ell(ctx, 8, -3, 8, 4, '#3a3a3a');
      ctx.fillStyle = pa; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-13, -72, 26, 26, 5) : ctx.rect(-13, -72, 26, 26); ctx.fill();
    }
    const by = sit ? -48 : -66;
    // Body and arms
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(0, by - 22 + bob, 17, 28, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1; ctx.stroke();
    const arm = o.swat > 0 ? -1.2 : o.wave ? Math.sin(t * 6) * 0.3 : 0.3;
    line(ctx, [8, by - 40 + bob, 8 + Math.cos(arm + 1.2) * 24, by - 40 + bob + Math.sin(arm + 1.2) * 24, 14 + Math.cos(arm + 0.4) * 34, by - 40 + bob + Math.sin(arm + 0.4) * 34], sk, 8);
    if (o.drink) { ctx.fillStyle = '#d8402a'; ctx.fillRect(12 + Math.cos(arm + 0.4) * 34, by - 50 + bob + Math.sin(arm + 0.4) * 34, 9, 14); }
    line(ctx, [-8, by - 40 + bob, -14, by - 16 + bob, -10, by + 2 + bob], sk, 8);
    // Head
    const hy = by - 62 + bob;
    ell(ctx, 0, hy, 17, 18, sk);
    ctx.fillStyle = o.hair; ctx.beginPath(); ctx.ellipse(-3, hy - 6, 18, 14, 0, Math.PI * 0.95, TAU + 0.1); ctx.fill();
    if (o.long) { ctx.beginPath(); ctx.ellipse(-10, hy + 8, 9, 20, 0.2, 0, TAU); ctx.fill(); }
    if (o.hat) { ell(ctx, 0, hy - 12, 24, 6, o.hat); ell(ctx, 0, hy - 18, 14, 9, o.hat); }
    const lk = o.look ? 1 : 0;
    eye(ctx, 9 + lk * 2, hy - 2, 2.2, 2.6, '#2a1a10');
    ctx.beginPath(); ctx.arc(9, hy + 7, 4, 0.1, Math.PI - 0.5); ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1.5; ctx.stroke();
    if (o.itch > 0.3) { ctx.fillStyle = 'rgba(230,80,80,' + o.itch * 0.6 + ')'; ctx.beginPath(); ctx.arc(o.spotX || 0, o.spotY || 0, 4, 0, TAU); ctx.fill(); }
    ctx.restore();
    // Chatting or looking around
    ctx.textAlign = 'center';
    if (o.look) { ctx.fillStyle = '#c0392b'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('?', 0, hy - 30); }
    else if (o.talk) {
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(f * 26, hy - 34, 22, 13, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#555'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(f * 26 - 8 + i * 8, hy - 34, 2 + (Math.floor(t * 3) % 3 === i ? 1 : 0), 0, TAU); ctx.fill(); }
    }
    // Breath: puffs of carbon dioxide drifting up, which mosquitoes smell
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.5 + i / 3 + (o.seed || 0)) % 1;
      ctx.fillStyle = 'rgba(255,255,255,' + 0.22 * (1 - ph) + ')';
      ctx.beginPath(); ctx.arc(f * (18 + ph * 20), hy + 4 - ph * 50, 4 + ph * 10, 0, TAU); ctx.fill();
    }
  },
  bbq(ctx) {
    softShadow(ctx, 6, 4, 60, 20, 0.35);
    isoBox(ctx, 0, 0, 90, 50, 60, '#555', '#3a3a3a', '#4a4a4a');
    isoBox(ctx, 0, -60, 84, 46, 8, '#2a2a2a', '#222', '#2a2a2a');
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(-10 + i * 14, -72 + i * 4); ctx.rotate(0.45); ell(ctx, 0, 0, 14, 4, '#9a4a2a'); ctx.restore(); }
    for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(200,200,200,.25)'; ctx.beginPath(); ctx.arc(-6 + i * 10, -100 - i * 16, 10 + i * 4, 0, TAU); ctx.fill(); }
  },
  table(ctx, o, t) {
    softShadow(ctx, 0, 6, 90, 34, 0.3);
    isoBox(ctx, 0, 0, 120, 90, 46, '#a87a4a', '#7a5432', '#8a6440');
    ell(ctx, -10, -52, 14, 7, '#e8e8e8'); ell(ctx, 18, -48, 10, 6, '#d84a2a');
    // Umbrella
    line(ctx, [0, -46, 0, -150], '#ddd', 3);
    ctx.beginPath(); ctx.moveTo(-90, -130); ctx.quadraticCurveTo(0, -200, 90, -130); ctx.quadraticCurveTo(0, -150, -90, -130);
    ctx.fillStyle = '#2f7d9b'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.stroke();
  },
  pot(ctx, o) {
    softShadow(ctx, 4, 4, 30, 12, 0.3);
    ell(ctx, 0, 0, 30, 13, '#a8583a');
    ell(ctx, 0, -2, 26, 10, o.water ? '#6a9ab8' : '#8a4a30');
    if (o.water) plainEll(ctx, -6, -4, 8, 2, 'rgba(255,255,255,.5)');
    isoBox(ctx, 0, -4, 34, 34, 34, '#8a4a2a', '#b0603a', '#c06a40');
    ell(ctx, 0, -48, 30, 22, '#3f7a3a'); ell(ctx, -10, -56, 16, 12, '#5a9a4a'); ell(ctx, 12, -54, 14, 12, '#4a8a3a');
    for (let i = 0; i < 3; i++) ell(ctx, -12 + i * 12, -60 + (i % 2) * 6, 3, 3, '#f2d040');
  },
  isoBirdbath(ctx) {
    softShadow(ctx, 6, 4, 40, 14, 0.3);
    line(ctx, [0, 0, 0, -50], '#b8b0a0', 14);
    ell(ctx, 0, -54, 44, 18, '#c8c0b0');
    ell(ctx, 0, -56, 38, 14, '#6aa0c0');
    plainEll(ctx, -10, -60, 12, 3, 'rgba(255,255,255,.5)');
  },
  bucket(ctx) {
    softShadow(ctx, 4, 4, 24, 9, 0.3);
    ctx.fillStyle = '#e8b030'; ctx.beginPath(); ctx.moveTo(-18, -30); ctx.lineTo(-14, 0); ctx.lineTo(14, 0); ctx.lineTo(18, -30); ctx.closePath(); ctx.fill();
    ell(ctx, 0, -30, 18, 7, '#d09a20'); ell(ctx, 0, -30, 15, 5, '#6a9ab8');
    ctx.beginPath(); ctx.arc(0, -30, 18, Math.PI, TAU); ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.stroke();
  },
  eggRaft(ctx) {
    ctx.fillStyle = '#3a2a1a';
    for (let i = 0; i < 20; i++) { const a = i * 2.4, rr = Math.sqrt(i) * 1.6; ctx.beginPath(); ctx.arc(Math.cos(a) * rr * 1.6, Math.sin(a) * rr * 0.7, 1.1, 0, TAU); ctx.fill(); }
  },
  gecko(ctx, o, t) {
    ctx.save(); ctx.rotate(-(o.angle || 0) - 0.4);
    for (const [x, s] of [[6, -1], [6, 1], [-6, -1], [-6, 1]]) line(ctx, [x, 0, x + 3, s * 8, x + 6, s * 9], '#c8b090', 1.6);
    ell(ctx, 0, 0, 12, 4.5, '#c8b090'); ell(ctx, 13, 0, 5.5, 4, '#c8b090');
    line(ctx, [-11, 0, -24, 3, -28, 1], '#c8b090', 3);
    for (let i = 0; i < 6; i++) plainEll(ctx, -8 + i * 3.5, (i % 2 - 0.5) * 3, 1, 1, '#7a6040');
    eye(ctx, 15, -2.4, 1.3, 1.3, '#3a2a1a'); eye(ctx, 15, 2.4, 1.3, 1.3, '#3a2a1a');
    ctx.restore();
  },
  sausage(ctx) { ell(ctx, 0, 0, 16, 5, '#9a4a2a'); plainLine(ctx, [-8, -2, 8, -2], 'rgba(60,20,10,.5)', 1); },
});

Bugs.push({ id: 'mosquito', name: 'Mosquito', sci: 'Culex quinquefasciatus', place: 'Bassendean', sprite: 'mosquito',
  pin: { x: 650, y: 245 }, stages: ['mosquito'] });

Object.assign(Missions, {
  mosquito: {
    id: 'mosquito', bug: 'mosquito', stage: 'Adult female', place: 'A backyard barbecue, Bassendean', view: 'iso',
    world: BIG, sprite: 'mosquito', bg: 'yard', escape: 'Fly',
    action: 'Bite', radius: 12, speed: 160, scale: 2.4, goal: 3,
    home: { x: 230, y: 540, r: 60, label: 'Garden bed' },
    facts: [
      'The southern house mosquito lives in backyards all over Perth.',
      'Only female mosquitoes bite. They need blood to make their eggs. Males drink nectar.',
      'You’re a mother mosquito. Get a meal of blood, then lay your eggs on still water.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag. This yard is seen from up high, at an angle.',
      'Land on a person’s arm or ankle while they are busy chatting, and hold or tap Bite.',
      'If someone looks around (?), fly off before they swat you!',
      'When you’re full of blood, find still water and hold Lay. Lay 3 egg rafts.',
    ],
    discoveries: [
      { key: 'd_gecko', sprite: 'gecko', fx: 0.3, fy: 0.12 },
      { key: 'd_snag', sprite: 'sausage', fx: 0.62, fy: 0.5 },
    ],
    factText: {
      start: 'This mosquito bites mostly at dusk and at night, when people are outside having a barbecue.',
      co2: 'Mosquitoes find people by smelling the carbon dioxide we breathe out, and the smell of our skin.',
      bite: 'A mosquito’s mouth is a bundle of tiny needles. Her spit stops the blood clotting, and that’s what makes the bite itchy.',
      swat: 'People can feel a mosquito landing on them. Fly away before they swat!',
      full: 'A mosquito can drink more than her own weight in blood.',
      raft: 'This mosquito lays her eggs stuck together in a little raft that floats on still water.',
      water: 'The young, called wrigglers, grow in still water. That’s why we tip out water from pots, buckets and bird baths.',
      d_gecko: 'A marbled gecko on the wall. Geckos wait near outside lights to catch insects.',
      d_snag: 'A snag fell off the barbie! Ants will find it soon.',
      win: 'In a few days your eggs hatch into wrigglers. That’s why people tip out still water in their yards!',
    },

    setup(g) {
      const p = g.player;
      p.blood = 0; p.flat = true; p.layT = 0;
      const people = [
        { x: 1110, y: 590, face: -1, pose: 'stand', skin: '#e8b890', shirt: '#2f6a9a', pants: '#3a3a3a', hair: '#3a2a1a', hat: '#1a4a2a', seed: 1 },
        { x: 790, y: 720, face: 1, pose: 'sit', skin: '#8a5a3a', shirt: '#d8502a', pants: '#2a3a5a', hair: '#1a1a1a', long: true, seed: 2 },
        { x: 960, y: 800, face: -1, pose: 'sit', skin: '#f2c8a8', shirt: '#f2d040', pants: '#5a7a4a', hair: '#c8a060', long: true, seed: 3 },
        { x: 1400, y: 920, face: -1, pose: 'stand', skin: '#c89a70', shirt: '#7a4a9a', pants: '#3a4a6a', hair: '#2a1a10', drink: true, seed: 4 },
      ];
      for (const pp of people) g.items.push(Object.assign({ sprite: 'person', kind: 'person', r: 30, angle: 0, flat: true, state: 'chat', timer: 3 + Math.random() * 5, talk: true, itch: 0 }, pp));
      g.items.push({ sprite: 'bbq', kind: 'thing', x: 1230, y: 520, r: 40, angle: 0, flat: true });
      g.items.push({ sprite: 'table', kind: 'thing', x: 890, y: 790, r: 50, angle: 0, flat: true, back: true });
      for (const [x, y, sp] of [[1500, 1000, 'isoBirdbath'], [420, 860, 'pot'], [1700, 640, 'pot'], [680, 1080, 'bucket'], [520, 420, 'pot']]) {
        g.items.push({ sprite: sp, kind: 'water', x, y, r: 30, angle: 0, flat: true, water: true, rafts: [],
          wy: sp === 'isoBirdbath' ? -56 : sp === 'bucket' ? -30 : -2 });
      }
      Game.later(4, () => Game.fact('co2'));
    },
    people(g) { return g.items.filter(i => i.kind === 'person'); },
    // Where a mosquito can bite this person: an ankle and an arm.
    spots(pp) {
      const f = pp.face;
      return pp.pose === 'sit'
        ? [{ x: pp.x + f * 24, y: pp.y - 16, pp }, { x: pp.x - f * 12, y: pp.y - 68, pp }]
        : [{ x: pp.x + f * 6, y: pp.y - 12, pp }, { x: pp.x - f * 12, y: pp.y - 88, pp }];
    },
    update(g, dt, input) {
      const p = g.player, m = this;
      // Draw back to front
      g.items.sort((a, b) => a.y - b.y);
      // People chat, then look around now and then
      for (const pp of this.people(g)) {
        pp.timer -= dt;
        pp.itch = Math.max(0, pp.itch - dt * 0.05);
        if (pp.state === 'chat' && pp.timer <= 0) { pp.state = 'look'; pp.timer = 2.4; }
        else if (pp.state === 'look' && pp.timer <= 0) { pp.state = 'chat'; pp.timer = 5 + Math.random() * 4; }
        pp.look = pp.state === 'look'; pp.talk = !pp.look;
        // Noticing a mosquito close to their face, or one biting them
        const near = Math.hypot(p.x - pp.x, p.y - (pp.y - 70)) < 110;
        if (pp.look && (near || p.biting === pp) && !pp.swat && p.invuln <= 0) {
          pp.swat = 0.75; pp.sx = p.x; pp.sy = p.y;
          Game.hint('Look out! They’ve seen you. Fly away!');
          Game.fact('swat');
        }
        if (pp.swat > 0) {
          pp.swat -= dt;
          if (pp.swat <= 0) {
            pp.swat = 0; g.shake = 0.15; Sound.play('tap');
            if (Math.hypot(p.x - pp.sx, p.y - pp.sy) < 40 && p.invuln <= 0) { p.biting = null; Game.caught({ name: 'swat of a hand', state: 'chat' }); }
            else Game.pop(pp.sx, pp.sy - 20, 'Missed!', '#fff');
            pp.state = 'chat'; pp.timer = 4 + Math.random() * 3;
          }
        }
      }
      p.biting = null;
      const full = p.blood >= 1;
      // Lay eggs on still water when full
      const water = full ? g.items.find(i => i.kind === 'water' && Math.hypot(i.x - p.x, i.y + i.wy - p.y) < 40) : null;
      // Bite a person when hungry
      let spot = null;
      if (!full) for (const pp of this.people(g)) for (const s of this.spots(pp)) if (dist(s, p) < 28) spot = s;
      setAction(full ? 'Lay' : 'Bite', full ? !!water : !!spot);
      if (water && working(input)) {
        p.layT += work(input, dt); p.progress = p.layT / 1.2;
        if (p.layT >= 1.2) {
          p.layT = 0; p.blood = 0; g.score++;
          water.rafts.push({ dx: (Math.random() - 0.5) * 14, dy: (Math.random() - 0.5) * 4 });
          Sound.play('score'); Game.pop(p.x, p.y - 20, 'Eggs!', '#ffd23f');
          Game.fact('raft'); if (g.score === 2) Game.fact('water');
        }
      } else if (spot && working(input)) {
        p.biting = spot.pp;
        const w = work(input, dt);
        p.blood = Math.min(1, p.blood + w * 0.22);
        spot.pp.itch = Math.min(1, spot.pp.itch + w * 0.3);
        spot.pp.spotX = (spot.x - spot.pp.x) * spot.pp.face; spot.pp.spotY = spot.y - spot.pp.y;
        p.progress = (p.blood * 10 % 5) / 5 || (p.blood >= 1 ? 1 : 0);
        p.x += (spot.x - p.x) * Math.min(1, dt * 8); p.y += (spot.y - p.y) * Math.min(1, dt * 8);
        Game.fact('bite');
        if (Math.floor(g.t * 4) !== Math.floor((g.t - dt) * 4)) Sound.play('tap');
        if (p.blood >= 1) { Game.pop(p.x, p.y - 20, 'Full!', '#e04040'); Sound.play('score'); Game.fact('full'); g.toasts.unshift({ text: 'Full of blood! Now find still water and hold Lay.', kind: 'hint' }); g.toastT = 0; }
      }
      if (!full && !spot && p.stillT > 6) Game.hint('Fly to a glowing spot on someone’s arm or ankle, then hold Bite.');
    },
    drawExtra(ctx, g) {
      const p = g.player, t = g.t, full = p.blood >= 1;
      // Bite spots glow: green while they chat, red when they're looking
      if (!full) for (const pp of this.people(g)) for (const s of this.spots(pp)) {
        const k = 0.5 + 0.5 * Math.sin(t * 5 + s.x);
        ctx.beginPath(); ctx.arc(s.x, s.y, 7 + k * 3, 0, TAU);
        ctx.strokeStyle = pp.look ? 'rgba(220,60,60,.8)' : 'rgba(120,255,140,' + (0.5 + k * 0.4) + ')'; ctx.lineWidth = 2.5; ctx.stroke();
      }
      // Egg rafts floating on the water, and a glow on water when you're full
      for (const w of g.items.filter(i => i.kind === 'water')) {
        for (const rf of w.rafts) { ctx.save(); ctx.translate(w.x + rf.dx, w.y + w.wy + rf.dy); Sprites.eggRaft(ctx); ctx.restore(); }
        if (full) { ctx.beginPath(); ctx.ellipse(w.x, w.y + w.wy, 34, 14, 0, 0, TAU); ctx.strokeStyle = 'rgba(120,220,255,' + (0.5 + 0.4 * Math.sin(t * 5)) + ')'; ctx.lineWidth = 3; ctx.stroke(); }
      }
      // Hands coming down to swat
      for (const pp of this.people(g)) if (pp.swat > 0) {
        const k = 1 - pp.swat / 0.75;
        softShadow(ctx, pp.sx, pp.sy, 34 + k * 20, 20 + k * 12, 0.25 + k * 0.4);
        ctx.save(); ctx.translate(pp.sx, pp.sy - 80 + k * 70); ctx.globalAlpha = 0.5 + k * 0.5;
        ell(ctx, 0, 0, 26, 18, pp.skin);
        for (let i = 0; i < 4; i++) ell(ctx, -15 + i * 10, -18, 5, 11, pp.skin);
        ctx.restore();
      }
      // The mosquito's shadow on the ground below her
      softShadow(ctx, p.x, p.y + 30, 10, 4, 0.35);
    },
    goalPoint(g) {
      const p = g.player;
      if (p.blood >= 1) return nearest(g.items.filter(i => i.kind === 'water').map(w => ({ x: w.x, y: w.y + w.wy })), p, 99999);
      const spots = [];
      for (const pp of this.people(g)) if (!pp.look) spots.push(...this.spots(pp));
      return nearest(spots, p, 99999);
    },
    hud(g) {
      const k = Math.round(g.player.blood * 5);
      setHud('Egg rafts: ' + Math.min(g.score, this.goal) + ' / ' + this.goal, 'Blood ' + '■'.repeat(k) + '□'.repeat(5 - k));
    },
    won(g) { return g.score >= this.goal; },
  },
});

finishMissions();

// ------------------------------------------------------------------ More female bugs
Object.assign(Sprites, {
  eggSac(ctx, o, t) {
    ell(ctx, 0, 0, 11, 10, '#f4f2ea');
    ctx.strokeStyle = 'rgba(200,195,180,.8)'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(0, 0, 3 + i * 1.1, i, i + 2.4); ctx.stroke(); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; plainLine(ctx, [Math.cos(a) * 10, Math.sin(a) * 9, Math.cos(a) * 18, Math.sin(a) * 16], 'rgba(255,255,255,.6)', 0.6); }
  },
  ripple(ctx, o, t) {
    for (let i = 0; i < 3; i++) {
      const r = 6 + ((t * 14 + i * 8) % 24);
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.8, 0, 0, TAU);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.8 - r / 32) + ')'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (!o.done) { ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fillStyle = 'rgba(255,230,120,.8)'; ctx.fill(); }
  },
});

Object.assign(Missions, {
  // Blue skimmer, adult female: eat, then lay eggs by dipping her tail into open water while a male guards her.
  skimmerF: {
    id: 'skimmerF', bug: 'dragonfly', stage: 'Adult female', place: 'Herdsman Lake', world: BIG,
    sprite: 'dragonfly', bg: 'dragonfly',
    action: 'Dart', radius: 20, speed: 190, scale: 1.3, goal: 6,
    home: { x: 220, y: 600, r: 50, label: 'Reeds' },
    facts: [
      'Female blue skimmers are yellow-brown. Only the males turn powder-blue.',
      'A female lays hundreds of tiny eggs. They hatch into nymphs, like you were.',
      'While she lays, a male often flies close by to guard her from other males.',
    ],
    how: [
      'Fly into 8 mosquitoes to get your energy up.',
      'Then fly to the glowing ripples on open water and press Dip to lay your eggs. Lay at 6 spots.',
      'The blue male will follow you and guard you. Press Dart for speed.',
    ],
    discoveries: [
      { key: 'd_swan', sprite: 'feather', color: '#1a1a1a', fx: 0.45, fy: 0.85 },
      { key: 'd_frog', sprite: 'frog', fx: 0.05, fy: 0.12 },
    ],
    factText: {
      start: 'You’re a mother blue skimmer. First you need energy, so catch some mosquitoes!',
      catch: 'Dragonflies catch insects in mid-air, scooping them up with their spiny legs.',
      dip: 'Female blue skimmers lay eggs by tapping the tip of their body on the water as they fly.',
      guard: 'The male hovers nearby to keep other males away, so the eggs being laid are his.',
      rival: 'Look! The guarding male chases off another male.',
      hobby: 'The Australian hobby is a small, fast falcon. It can catch dragonflies in mid-air.',
      wings: 'Dragonflies can move each of their 4 wings on its own.',
      d_swan: 'A black swan feather. The black swan is the bird emblem of Western Australia.',
      d_frog: 'A motorbike frog. Its call sounds like a motorbike changing gears.',
      win: 'Your eggs sink into the water and hatch into nymphs in a few weeks. The life cycle starts again!',
    },
    setup(g) {
      const p = g.player;
      p.female = true; p.dart = 0; p.dartCd = 0; p.energy = 0;
      for (let i = 0; i < 10; i++) Missions.dragonfly.addMozzie();
      g.male = { sprite: 'dragonfly', kind: 'male', x: p.x + 80, y: p.y - 60, r: 0, scale: 1.2, angle: 0, flat: true };
      g.spots = [];
      Game.addPred({ sprite: 'hobby', name: 'Australian hobby', r: 26, wanderSpeed: 90, chaseSpeed: 225, sight: 210, chaseTime: 2.2, restTime: 4 });
      Game.later(8, () => Game.fact('guard'));
    },
    makeSpots(g) {
      for (let i = 0; i < 6; i++) {
        const s = Game.spawnPoint(350);
        g.spots.push({ sprite: 'ripple', x: s.x, y: s.y, r: 18, angle: 0, flat: true, done: false });
      }
    },
    update(g, dt, input) {
      const p = g.player;
      p.dart = Math.max(0, p.dart - dt); p.dartCd = Math.max(0, p.dartCd - dt);
      p.speed = p.dart > 0 ? 340 : 190;
      // The male keeps close, just off to one side
      const mm = g.male, ta = g.t * 1.4;
      const tx = p.x + Math.cos(ta) * 70, ty = p.y + Math.sin(ta) * 50;
      mm.angle = Math.atan2(ty - mm.y, tx - mm.x);
      mm.x += (tx - mm.x) * Math.min(1, dt * 3); mm.y += (ty - mm.y) * Math.min(1, dt * 3);
      // Now and then a rival male turns up and the guard chases him off
      if (g.rival) {
        const rv = g.rival; rv.t += dt;
        if (rv.t < 1.5) { rv.x += (p.x + 160 - rv.x) * dt; rv.y += (p.y - 120 - rv.y) * dt; }
        else { rv.x += 380 * dt; rv.y -= 260 * dt; mm.x += (rv.x - mm.x) * dt * 2; }
        if (rv.t > 3.5) { g.items.splice(g.items.indexOf(rv), 1); g.rival = null; }
      } else if (g.score >= 1 && Math.random() < dt / 12) {
        g.rival = { sprite: 'dragonfly', kind: 'rival', x: p.x + 500, y: p.y - 300, r: 0, scale: 1.2, angle: Math.PI, flat: true, t: 0 };
        g.items.push(g.rival);
        Game.fact('rival');
      }
      for (const m of g.items) if (m.kind === 'mosquito') { wander(m, dt, m.speed); if (Math.random() < dt * 2) m.wt = 0; }
      const caught = g.items.find(i => i.kind === 'mosquito' && touching(p, i, 2));
      if (caught && p.energy < 8) {
        g.items.splice(g.items.indexOf(caught), 1);
        p.energy++; Sound.play('pick'); Game.pop(caught.x, caught.y - 12, '+1', '#fff'); Game.fact('catch');
        Game.later(1, () => Missions.dragonfly.addMozzie());
        if (p.energy === 8) {
          this.makeSpots(g); Sound.play('score');
          g.toasts.unshift({ text: 'Full of energy! Fly to the glowing ripples and press Dip to lay eggs.', kind: 'hint' }); g.toastT = 0;
        }
      }
      const spot = p.energy >= 8 ? g.spots.find(s => !s.done && dist(s, p) < 34) : null;
      if (spot) {
        setAction('Dip', true);
        if (input.pressed) {
          spot.done = true; g.score++;
          Sound.play('score'); Game.pop(spot.x, spot.y - 16, 'Eggs!', '#ffd23f');
          Game.burst(spot.x, spot.y, '#e8f8ff', 16); Game.fact('dip');
        }
      } else {
        setAction('Dart', p.dartCd <= 0);
        if (input.pressed && p.dartCd <= 0) { p.dart = 0.6; p.dartCd = 2.5; Sound.play('dart'); Game.fact('wings'); }
      }
    },
    drawBuild(ctx, g) { for (const s of g.spots) Game.drawSprite('ripple', s, 1.4); },
    drawExtra(ctx, g) { Game.drawSprite('dragonfly', g.male, g.male.scale); },
    goalPoint(g) { return g.player.energy >= 6 ? nearest(g.spots.filter(s => !s.done), g.player, 99999) : null; },
    hud(g) {
      const p = g.player;
      if (p.energy < 8) setHud('Energy: ' + p.energy + ' / 8', 'Catch mosquitoes');
      else setHud('Eggs laid: ' + g.score + ' / ' + this.goal, '');
    },
    won(g) { return g.score >= this.goal; },
  },

  // Peacock spider, adult female: watch the males dance, choose one, spin an egg sac and guard it.
  spiderF: {
    id: 'spiderF', bug: 'spider', stage: 'Adult female', place: 'Coastal dunes, Cottesloe', world: BIG,
    sprite: 'femaleSpider', bg: 'spider', escape: 'Jump',
    action: 'Choose', radius: 15, speed: 105, scale: 1.8, goal: 3,
    home: { x: 260, y: 1000, r: 44, label: 'Silk retreat' },
    facts: [
      'Female peacock spiders are brown, so they’re hard to spot on the sand.',
      'Males dance for the females. The female decides which male she likes best.',
      'A mother peacock spider guards her egg sac until the babies hatch.',
    ],
    how: [
      'Males will come and dance for you. Watch them!',
      'Walk up to the one you like best and press Choose.',
      'Go back to your silk retreat and hold Spin to make an egg sac.',
      'Then guard it! When an ant comes near, press Jump to chase it away. Chase off 3 ants.',
    ],
    discoveries: [
      { key: 'd_snail', sprite: 'shell', color: '#f2efe4', fx: 0.65, fy: 0.25 },
      { key: 'd_gull', sprite: 'feather', color: '#d8d8d8', band: '#7a7a7a', fx: 0.15, fy: 0.6 },
    ],
    factText: {
      start: 'Female peacock spiders can see colour well, so they can judge the males’ bright fans.',
      dance: 'Each male raises his colourful fan and waves his legs. He also drums on the ground with his body.',
      choose: 'Scientists think females pick males with the brightest colours and best dances.',
      sac: 'She wraps her eggs in a soft silk sac inside her retreat.',
      ant: 'Ants will steal spider eggs if they get the chance.',
      guard: 'Jumping spiders are brave mothers. She’ll chase off insects much bigger than she is.',
      d_snail: 'A white snail shell. In summer these snails climb plants to keep off the hot sand.',
      d_gull: 'A silver gull feather. Gulls eat almost anything they find along the beach.',
      win: 'In a few weeks, tiny spiderlings will hatch and leave the egg sac. Each one can already jump!',
    },
    setup(g) {
      const p = g.player;
      p.jcd = 0; g.phase = 'watch'; g.males = []; g.spinT = 0; g.chased = 0; g.antT = 3;
      const cols = [['#2a8aa8', '#ff6a1a'], ['#3a6ad0', '#f2d040'], ['#40a070', '#e8402a']];
      for (let i = 0; i < 3; i++) {
        Game.later(2 + i * 3, () => {
          if (g.phase !== 'watch') return;
          const s = Game.spawnPoint(60, p, 220);
          const m = { sprite: 'spider', kind: 'male', x: s.x, y: s.y, r: 14, scale: 1.6, angle: 0, dance: 0, n: i, flat: false };
          g.males.push(m); g.items.push(m);
          Sound.play('pick');
          Game.fact('dance');
          if (i === 0) { g.toasts.unshift({ text: 'A male is dancing for you! Walk up to the one you like and press Choose.', kind: 'hint' }); g.toastT = 0; }
        });
      }
    },
    update(g, dt, input) {
      const p = g.player;
      // Males face you and keep dancing
      for (const m of g.males) {
        m.angle = Math.atan2(p.y - m.y, p.x - m.x);
        m.dance = 1; m.fan = 1;
        if (dist(m, p) > 90) { m.x += Math.cos(m.angle) * 40 * dt; m.y += Math.sin(m.angle) * 40 * dt; }
        if (m.leave) { m.x -= Math.cos(m.angle) * 160 * dt; m.y -= Math.sin(m.angle) * 160 * dt; }
      }
      g.males = g.males.filter(m => { if (m.leave && dist(m, p) > 500) { g.items.splice(g.items.indexOf(m), 1); return false; } return true; });
      if (g.phase === 'watch') {
        const m = nearest(g.males, p, 70);
        setAction('Choose', !!m);
        if (m && input.pressed) {
          g.phase = 'sac'; g.chosen = m;
          Sound.play('win'); Game.pop(m.x, m.y - 30, '♥', '#e8506a'); Game.fact('choose');
          for (const o of g.males) if (o !== m) o.leave = true;
          Game.later(2.5, () => { m.leave = true; });
          g.toasts.unshift({ text: 'Good choice! Now go back to your silk retreat and hold Spin.', kind: 'hint' }); g.toastT = 0;
        }
        return;
      }
      if (g.phase === 'sac') {
        const home = Game.inHome();
        setAction('Spin', home);
        if (home && working(input)) {
          g.spinT += work(input, dt); p.progress = g.spinT / 2;
          if (g.spinT >= 2) {
            g.phase = 'guard';
            g.sac = { sprite: 'eggSac', kind: 'sac', x: g.home.x + 20, y: g.home.y, r: 12, scale: 1.4, angle: 0 };
            g.items.push(g.sac);
            Sound.play('score'); Game.pop(g.sac.x, g.sac.y - 24, 'Egg sac!', '#fff'); Game.fact('sac');
            g.toasts.unshift({ text: 'Guard your eggs! Jump at ants that come near.', kind: 'hint' }); g.toastT = 0;
          }
        }
        return;
      }
      // Guarding: ants come one at a time toward the sac
      if (!g.ant) {
        g.antT -= dt;
        if (g.antT <= 0) {
          const a = Math.random() * TAU;
          g.ant = { sprite: 'smallAnt', kind: 'ant', x: g.sac.x + Math.cos(a) * 380, y: g.sac.y + Math.sin(a) * 380, r: 10, scale: 1.4, angle: 0, state: 'sit' };
          g.ant.x = clamp(g.ant.x, 30, World.w - 30); g.ant.y = clamp(g.ant.y, 30, World.h - 30);
          g.items.push(g.ant); Game.fact('ant');
        }
      }
      const ant = g.ant;
      if (ant) {
        if (ant.flee) {
          ant.x += Math.cos(ant.angle) * 200 * dt; ant.y += Math.sin(ant.angle) * 200 * dt;
          ant.flee -= dt;
          if (ant.flee <= 0) { g.items.splice(g.items.indexOf(ant), 1); g.ant = null; g.antT = 3 + Math.random() * 2; }
        } else {
          ant.angle = Math.atan2(g.sac.y - ant.y, g.sac.x - ant.x);
          if (dist(ant, g.sac) > 20) { ant.x += Math.cos(ant.angle) * 45 * dt; ant.y += Math.sin(ant.angle) * 45 * dt; ant.moving = true; }
        }
      }
      // Jump at the ant to scare it off
      const prey = ant && !ant.flee ? [ant] : [];
      const hit = spiderHunt(g, dt, input, prey, 170);
      if (hit) {
        g.items.push(hit);   // spiderHunt removes what it lands on; the ant runs off instead
        hit.flee = 2; hit.angle = Math.atan2(hit.y - g.sac.y, hit.x - g.sac.x);
        g.chased++; Game.pop(hit.x, hit.y - 20, 'Shoo!', '#ffd23f'); Game.fact('guard');
      }
    },
    locked(g) { return !!g.player.jump; },
    drawExtra(ctx, g) { drawSilk(ctx, g.player); },
    goalPoint(g) {
      if (g.phase === 'sac') return g.home;
      if (g.phase === 'guard' && g.ant && !g.ant.flee) return g.ant;
      return null;
    },
    hud(g) {
      if (g.phase === 'watch') setHud('Choose a male', g.males.length + ' dancing');
      else if (g.phase === 'sac') setHud('Spin an egg sac at home', '');
      else setHud('Ants chased: ' + g.chased + ' / ' + this.goal, '');
    },
    won(g) { return g.chased >= this.goal; },
  },
});
Bugs.find(b => b.id === 'dragonfly').stages.push('skimmerF');
Bugs.find(b => b.id === 'spider').stages.push('spiderF');

// Who you are in each stage, shown on the bug page.
const SEX = {
  ant: 'You are a female worker. All bull ant workers are female.',
  queen: 'You are a queen: the female who lays all the colony’s eggs.',
  bee: 'You are a female.', fly: 'You are a female.',
  caterpillar: 'Caterpillars grow up to be male or female.',
  butterfly: 'You are a female.', flight: 'You are a female.',
  termite: 'Termite workers can be male or female.',
  snail: 'You are male and female at the same time.',
  spiderling: 'You’re too young to tell yet.', spider: 'You are a male.', spiderF: 'You are a female.',
  nymph: 'You’re too young to tell yet.', dragonfly: 'You are a male.', skimmerF: 'You are a female.',
  sandhopper: 'You are a female.', mosquito: 'You are a female. Only females bite.',
};
for (const id in SEX) if (Missions[id]) Missions[id].sex = SEX[id];
finishMissions();
