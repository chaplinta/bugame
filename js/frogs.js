'use strict';
// Frog chorus: a spring night at Lake Joondalup as a male motorbike frog. Call in the gap of the chorus to be
// heard; eight clear calls bring a female. Banjo frogs, moaning frogs and squelching froglets call around you
// (each a synthesised call, panned to where it comes from), and a nankeen night heron wades the edge and hears
// you when you call. Every fact is sourced in docs/facts.md (Motorbike frog).

Bugs.push({ id: 'frog', name: 'Motorbike Frog', sci: 'Litoria moorei', place: 'Lake Joondalup', sprite: 'frog',
  pin: { x: 445, y: 75 }, stages: ['frog'] });

// ---------------------------------------------------------------- the calls
// Built from oscillators, no recordings. Each call comes from somewhere: panned by where it is relative to the
// player and quieter with distance. At most ten voices, and no more than three new calls in a tenth of a second.
const FrogCalls = {
  played: {}, voices: 0, recent: [],
  call(kind, dx, d, base) {
    this.played[kind] = (this.played[kind] || 0) + 1;
    if (!Settings.sound) return;
    try { this[kind](dx, d, base); } catch (e) { /* audio unavailable */ }
  },
  ok() {
    const now = performance.now();
    this.recent = this.recent.filter(t => now - t < 100);
    if (this.voices >= 10 || this.recent.length >= 3) return false;
    this.recent.push(now); this.voices++;
    return true;
  },
  out(dx, d, base) {   // gain → stereo pan → speakers
    const ac = Sound.ensure(), g = ac.createGain();
    g.gain.value = base / (1 + (d / 350) * (d / 350));
    let node = g;
    if (ac.createStereoPanner) { const pan = ac.createStereoPanner(); pan.pan.value = clamp(dx / 600, -1, 1); g.connect(pan); node = pan; }
    node.connect(ac.destination);
    return { ac, g };
  },
  done(o) { o.onended = () => { this.voices = Math.max(0, this.voices - 1); }; },
  tremolo(ac, hz, depth, t0, t1) {   // a gain that wobbles: the rasp in a frog's call
    const vca = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    vca.gain.value = 1 - depth / 2; lfo.frequency.value = hz; lg.gain.value = depth / 2;
    lfo.connect(lg).connect(vca.gain); lfo.start(t0); lfo.stop(t1);
    return vca;
  },
  noise(ac, dur) {
    const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = buf; return s;
  },
  // Motorbike frog: four rising "gear changes", then a warbling growl (WA Museum Frog Watch).
  motorbike(dx, d, base) {
    if (!this.ok()) return;
    const { ac, g } = this.out(dx, d, base || 0.3), t0 = ac.currentTime;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 1.5; lp.connect(g);
    let last = null;
    for (let i = 0; i < 4; i++) {
      const t = t0 + i * 0.22, f0 = 380 * Math.pow(1.14, i);
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.25, t + 0.2);
      const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t); env.gain.exponentialRampToValueAtTime(0.9, t + 0.02); env.gain.setValueAtTime(0.9, t + 0.16); env.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(env).connect(this.tremolo(ac, 22, 0.6, t, t + 0.23)).connect(lp);
      o.start(t); o.stop(t + 0.23); last = o;
    }
    const t1 = t0 + 0.9, o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(300, t1); o.frequency.exponentialRampToValueAtTime(220, t1 + 0.5);
    const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t1); env.gain.exponentialRampToValueAtTime(0.7, t1 + 0.03); env.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.5);
    const lp2 = ac.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 900; lp2.connect(g);
    o.connect(env).connect(this.tremolo(ac, 32, 0.8, t1, t1 + 0.52)).connect(lp2);
    o.start(t1); o.stop(t1 + 0.52);
    this.done(o);
  },
  // Western banjo frog: a single "bonk", like a plucked banjo string.
  banjo(dx, d, base) {
    if (!this.ok()) return;
    const { ac, g } = this.out(dx, d, base || 0.35), t0 = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(240, t0); o.frequency.exponentialRampToValueAtTime(150, t0 + 0.12);
    const env = ac.createGain(); env.gain.setValueAtTime(1, t0); env.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
    o.connect(env).connect(g); o.start(t0); o.stop(t0 + 0.3);
    const n = this.noise(ac, 0.008), ng = ac.createGain(); ng.gain.value = 0.4; n.connect(ng).connect(g); n.start(t0); n.stop(t0 + 0.01);
    this.done(o);
  },
  // Moaning frog: a long, low, rising moan from a burrow in the sand.
  moaning(dx, d, base) {
    if (!this.ok()) return;
    const { ac, g } = this.out(dx, d, base || 0.3), t0 = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(280, t0); o.frequency.linearRampToValueAtTime(420, t0 + 1.1);
    const vib = ac.createOscillator(); vib.frequency.value = 5; const vg = ac.createGain(); vg.gain.value = 8; vib.connect(vg).connect(o.frequency);
    const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t0); env.gain.exponentialRampToValueAtTime(1, t0 + 0.25); env.gain.setValueAtTime(1, t0 + 0.85); env.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    o.connect(env).connect(lp).connect(g); o.start(t0); o.stop(t0 + 1.22); vib.start(t0); vib.stop(t0 + 1.22);
    this.done(o);
  },
  // Squelching froglet: a short rubbery squelch, a fast pulse train rising in pitch.
  froglet(dx, d, base) {
    if (!this.ok()) return;
    const { ac, g } = this.out(dx, d, base || 0.2), t0 = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(1400, t0); o.frequency.linearRampToValueAtTime(1700, t0 + 0.35);
    const vca = ac.createGain(), am = ac.createOscillator(), ag = ac.createGain();
    am.type = 'square'; am.frequency.setValueAtTime(45, t0); am.frequency.linearRampToValueAtTime(70, t0 + 0.35); vca.gain.value = 0.5; ag.gain.value = 0.5; am.connect(ag).connect(vca.gain);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 2;
    const env = ac.createGain(); env.gain.setValueAtTime(0.0001, t0); env.gain.exponentialRampToValueAtTime(1, t0 + 0.01); env.gain.setValueAtTime(1, t0 + 0.3); env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
    o.connect(vca).connect(bp).connect(env).connect(g); o.start(t0); o.stop(t0 + 0.37); am.start(t0); am.stop(t0 + 0.37);
    this.done(o);
  },
};

// ---------------------------------------------------------------- the other frogs and the heron (drawings)
Object.assign(Sprites, {
  // Moaning frog: a plump, round burrowing frog, brown with pale blotches and a pale belly, from above.
  moaningFrog(ctx) {
    for (const s of [-1, 1]) { ell(ctx, -5, s * 7, 6, 3, '#6a5a3a', s * 0.5, 'wet'); ell(ctx, 5, s * 6, 3.6, 2, '#6a5a3a', -s * 0.5, 'wet'); }
    ell(ctx, 0, 0, 9.5, 8, '#8a7048', 0, 'wet');
    const r = rng(14); for (let k = 0; k < 10; k++) plainEll(ctx, (r() - 0.5) * 14, (r() - 0.5) * 11, 1.8, 1.4, 'rgba(230,210,160,.45)');
    ell(ctx, 6, 0, 4.2, 4, '#8a7048', 0, 'wet');
    eye(ctx, 6.5, -3, 1.8, 1.8, '#c8a040'); eye(ctx, 6.5, 3, 1.8, 1.8, '#c8a040');
    plainEll(ctx, 6.5, -3, 1, 0.45, '#1a1008'); plainEll(ctx, 6.5, 3, 1, 0.45, '#1a1008');
  },
  // Squelching froglet: tiny, grey-brown with a dark stripe through the eye.
  froglet(ctx) {
    for (const s of [-1, 1]) { ell(ctx, -3, s * 4, 3.6, 1.6, '#5a5040', s * 0.5, 'wet'); ell(ctx, 3, s * 3.4, 2, 1.1, '#5a5040', -s * 0.5, 'wet'); }
    ell(ctx, 0, 0, 5, 3.8, '#7a6a50', 0, 'wet');
    plainLine(ctx, [-4, 0, 3, 0], 'rgba(40,30,20,.35)', 0.8);
    ell(ctx, 3.6, 0, 2.4, 2.2, '#7a6a50', 0, 'wet');
    plainEll(ctx, 4, -1.7, 0.9, 0.9, '#c8a040'); plainEll(ctx, 4, 1.7, 0.9, 0.9, '#c8a040');
    plainEll(ctx, 4.2, -1.7, 0.5, 0.25, '#1a1008'); plainEll(ctx, 4.2, 1.7, 0.5, 0.25, '#1a1008');
  },
  // Nankeen night heron from above: a stocky grey-brown bird with a cinnamon back, a black cap with white
  // nape plumes, a thick dark bill and yellow legs; broad rounded wings.
  nightHeron(ctx, o, t) {
    const flap = o.moving ? Math.sin(t * 9) * 3 : 0;
    for (const s of [-1, 1]) birdWing(ctx, 2, s * 4, 30, s * 13, s * (0.95 + flap * 0.02), '#7a6a58', '#3a2e24', 7);
    feathered(ctx, -2, 0, 14, 8.5, '#a86a3a', 12, 31);
    ell(ctx, -12, 0, 6, 3.2, '#8a5a30', 0, 'hair');
    for (const s of [-1, 1]) plainLine(ctx, [-6, s * 3, -14, s * 5.5], '#d8c040', 1.4);
    ell(ctx, 10, 0, 6.2, 5.4, '#4a4a48', 0, 'hair');
    ell(ctx, 9.5, 0, 5, 3.2, '#1a1a1a', 0, 'hair');
    for (let k = 0; k < 3; k++) plainLine(ctx, [6 - k, 0, -2 - k * 2, k - 1], '#f4f4f0', 0.8);
    birdEye(ctx, 12.5, -3, 1.3, '#d8a830'); birdEye(ctx, 12.5, 3, 1.3, '#d8a830');
    beak(ctx, 15.5, 0, 12, 2, '#2a2a2a');
  },
});
SpriteCache.register('frog', { key(o, t) { return 'c' + Math.round((o.call || 0) * 4) + (o.female ? 'F' : '') + (o.moving ? 'M' : ''); } });
SpriteCache.registerAll(['moaningFrog', 'froglet']);
SpriteCache.register('nightHeron', { key(o, t) { return o.moving ? 'f' + SpriteCache.phase(t, 9, 4) : 'x'; } });

// ---------------------------------------------------------------- the 3D versions
Models.define('moaningFrog', {
  build(M) {
    const g = new THREE.Group(), skin = M.skin('#8a7048', { rough: 0.5 });
    for (const s of [-1, 1]) { M.ellipsoid(g, 6, 3, 2.4, M.skin('#6a5a3a'), [-5, s * 7, 2.2], s * 0.5); M.ellipsoid(g, 3.6, 2, 1.6, M.skin('#6a5a3a'), [5, s * 6, 1.6], -s * 0.5); }
    M.ellipsoid(g, 9.5, 8, 6, skin, [0, 0, 5.2]);
    const r = rng(14); for (let k = 0; k < 10; k++) M.ellipsoid(g, 1.8, 1.4, 0.8, M.skin('#d8c090'), [(r() - 0.5) * 14, (r() - 0.5) * 11, 10.4]);
    M.ellipsoid(g, 4.2, 4, 3.4, skin, [6, 0, 4.6]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 1.8, 1.8, 1.8, M.eye({ color: '#c8a040' }), [6.5, s * 3, 7.6]); M.ellipsoid(g, 1, 0.45, 0.45, M.gloss('#1a1008'), [7, s * 3, 8.5]); }
    return g;
  },
});
Models.define('froglet', {
  build(M) {
    const g = new THREE.Group(), skin = M.skin('#7a6a50', { rough: 0.5 });
    for (const s of [-1, 1]) { M.ellipsoid(g, 3.6, 1.6, 1.2, M.skin('#5a5040'), [-3, s * 4, 1.1], s * 0.5); M.ellipsoid(g, 2, 1.1, 0.9, M.skin('#5a5040'), [3, s * 3.4, 0.9], -s * 0.5); }
    M.ellipsoid(g, 5, 3.8, 2.8, skin, [0, 0, 2.6]);
    M.ellipsoid(g, 4, 0.5, 0.3, M.skin('#3a3028'), [-0.5, 0, 5.2]);
    M.ellipsoid(g, 2.4, 2.2, 1.8, skin, [3.6, 0, 2.4]);
    for (const s of [-1, 1]) { M.ellipsoid(g, 0.9, 0.9, 0.9, M.eye({ color: '#c8a040' }), [4, s * 1.7, 3.8]); }
    return g;
  },
});
Models.define('nightHeron', {
  key(o, t) { return o.moving ? 'f' + SpriteCache.phase(t, 9, 4) : 'x'; },
  build(M) {
    const g = birdModel(M, { key: 'nightHeron', body: [15, 8.5, 6.5], col: '#a86a3a', belly: '#f0ece0', head: [6.5, '#4a4a48'], cap: '#1a1a1a', beak: [12, 1.9, '#2a2a2a'], iris: '#d8a830',
      wing: [30, 13, '#7a6a58', '#3a2e24', 7], tail: [12, 3, '#8a5a30', null, 4, 0.3], z: 8, spread: 0.95, legs: '#d8c040' });
    const H = g.userData.head;
    for (let k = 0; k < 3; k++) M.seg(g, [H.x - H.r * 0.5, (k - 1) * 0.8, H.z + H.r * 0.5], [H.x - H.r * 2.2, (k - 1) * 1.4, H.z + H.r * 0.3], 0.3, M.feather('#f4f4f0'), { full: true });
    return g;
  },
  pose(root, o, t) { flapPose(root, o, t, 9, 4, o.moving ? 0.2 : 0); },
});

// ---------------------------------------------------------------- the night lake
// Lake Joondalup after dark: open water with lily pads, the reed beds where the frogs sit, a sandy bank along
// the top where the moaning frogs burrow, and the moon's path across the water.
Backgrounds.lakeNight = function (ctx, W, H, home) {
  const r = rng(55), A = W * H / (960 * 600);
  Ground.water(ctx, W, H, 55, { shallow: '#2a6a8a', deep: '#0c2444', depth: 'radial', caustics: 0.05, weed: 0.6 });
  drawLilies(ctx, r, W, H, home, 12 * A);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 90); ctx.clip();
  Ground.soil(ctx, W, 90, 56, { base: '#5a4c38', dark: '#2e2618', light: '#7a6a4c', stones: 0.3 });
  ctx.restore();
  const mp = ctx.createLinearGradient(W * 0.55, 0, W * 0.75, 0); mp.addColorStop(0, 'rgba(255,250,210,0)'); mp.addColorStop(0.5, 'rgba(255,250,210,.14)'); mp.addColorStop(1, 'rgba(255,250,210,0)');
  ctx.fillStyle = mp; ctx.fillRect(W * 0.55, 90, W * 0.2, H - 90);
  drawReeds(ctx, home.x, home.y, 14, home.r * 2.2, 57);
  for (let x = 0; x < W; x += 140) { drawReeds(ctx, x, 100, 3, 60, x); drawReeds(ctx, x, H - 20, 3, 60, x + 1); }
  for (let y = 100; y < H; y += 140) { drawReeds(ctx, 20, y, 3, 60, y + 2); drawReeds(ctx, W - 20, y, 3, 60, y + 3); }
};

// ---------------------------------------------------------------- the level
const CHORUS = { slot: 1.6, slots: 4 };   // a round of four slots: rival males take the first three, the fourth is the gap
const REED_SPOTS = [[520, 300], [1500, 260], [1650, 900], [900, 1050], [300, 400], [1200, 620]];

Missions.frog = {
  id: 'frog', bug: 'frog', stage: 'Calling male', place: 'Lake Joondalup, at night', world: BIG, sprite: 'frog', bg: 'lakeNight',
  action: 'Call', radius: 16, speed: 90, scale: 1.6, goal: 8, voice: true, noNet: true,
  home: { x: 260, y: 980, r: 60, label: 'Reeds' },
  facts: [
    'Motorbike frogs live around Perth’s lakes and swamps. The male’s call sounds like a motorbike changing gears.',
    'Frogs aren’t bugs. They have a backbone inside, like you. But they eat bugs!',
    'Frogs start life as tadpoles in the water, breathing with gills.',
  ],
  how: [
    'Swim and hop with the arrow keys, or touch and drag.',
    'Hold Call (or shout!) when the ring is green: that’s the gap in the chorus, when you can be heard.',
    'Be heard 8 times and a female will come looking for you.',
    'A night heron hunts along the edge. Keep still and quiet when it’s near!',
  ],
  discoveries: [
    { key: 'd_tadpole', sprite: 'tadpole', fx: 0.3, fy: 0.3 },
    { key: 'd_turtle', sprite: 'turtle', fx: 0.8, fy: 0.55 },
  ],
  factText: {
    start: 'You’re a male motorbike frog. Your call sounds like a motorbike changing gears.',
    call: 'Male frogs call to bring females to them. The female picks a male by his call.',
    gap: 'Frogs in a chorus take turns calling, so each one can be heard.',
    sac: 'A frog puffs up the pouch under its chin to make its call louder.',
    rivals: 'Other males are calling too. Each one wants to be heard.',
    banjo: 'Bonk! That’s a western banjo frog. A chorus of them sounds like a band of bad banjo players.',
    moaning: 'That long low moan is a moaning frog, calling from its burrow in the sandy bank.',
    froglet: 'That squelch is a squelching froglet, a frog smaller than a twenty cent coin.',
    nightHeron: 'A nankeen night heron! It hunts along the water’s edge at night for frogs, fish and insects.',
    quiet: 'A frog that stays still and quiet is hard to find in the dark.',
    season: 'Motorbike frogs call in spring and summer. Banjo frogs call most in winter and spring.',
    female: 'A female! She followed your call. She’ll lay her eggs in the water.',
    d_tadpole: 'Tadpoles! They breathe with gills. In a few weeks they grow legs, lose their tails and hop out as frogs.',
    d_turtle: 'An oblong turtle, resting in the shallows. It eats tadpoles, so frogs lay lots of eggs.',
    win: 'She chose you! Frogs that call clearly, in the gaps, get heard. A lake full of frogs is a healthy lake.',
  },

  setup(g) {
    const p = g.player, r = rng(77);
    p.call = 0; p.callT = 0; p.callSound = false; p.counted = false; p.started = false;
    g.round = { t: 0, slot: 0 }; g.rivals = []; g.others = []; g.rings = []; g.point = null; g.female = null; g.met = false;
    REED_SPOTS.forEach(([x, y], i) => { const rv = { sprite: 'frog', kind: 'rival', x, y, r: 14, angle: r() * TAU, scale: 1.5, slot: i % 3, active: i < 2, call: 0 }; g.rivals.push(rv); g.items.push(rv); });
    const add = (kind, sprite, x, y, every, scale) => { const o = { sprite, kind, x, y, r: 10, angle: r() * TAU, scale, next: 2 + r() * every, every, call: 0 }; g.others.push(o); g.items.push(o); };
    add('banjo', 'banjoFrog', 700, 180, 3, 1.3); add('banjo', 'banjoFrog', 1100, 160, 3, 1.3); add('banjo', 'banjoFrog', 1750, 500, 3, 1.3);
    add('moaning', 'moaningFrog', 150, 60, 7, 1.3); add('moaning', 'moaningFrog', 1800, 60, 7, 1.3);
    add('froglet', 'froglet', 400, 1100, 1.5, 1); add('froglet', 'froglet', 1400, 1120, 1.5, 1); add('froglet', 'froglet', 60, 700, 1.5, 1);
    Game.addPred({ sprite: 'nightHeron', name: 'night heron', r: 28, scale: 1.3, wanderSpeed: 25, chaseSpeed: 95, sight: 90, chaseTime: 3, restTime: 4 });
    Game.later(2.5, () => Game.hint('Wait for the green ring, then hold Call.'));
    Game.later(60, () => Game.fact('season'));
  },
  gap(g) { return g.round.slot === CHORUS.slots - 1; },
  // A frog calls: the sound from where it sits, a ring on the water, and the fact the first time it is near.
  callFrom(g, o, kind) {
    const p = g.player, dx = o.x - p.x, d = dist(o, p);
    FrogCalls.call(kind, dx, d);
    o.call = 0.8;
    g.rings.push({ x: o.x, y: o.y, t: 0 });
    const key = kind === 'motorbike' ? 'rivals' : kind;
    if (d < 500 && !g.seen.has(key)) { Game.fact(key); g.point = { x: o.x, y: o.y, t: 2 }; }
  },
  update(g, dt, input) {
    const p = g.player, R = g.round;
    // The round: rival males in the first three slots (more of them as you are heard), the fourth slot is the gap.
    R.t += dt;
    if (R.t >= CHORUS.slot) {
      R.t -= CHORUS.slot; R.slot = (R.slot + 1) % CHORUS.slots;
      if (R.slot < CHORUS.slots - 1) for (const rv of g.rivals) if (rv.active && rv.slot === R.slot && Math.random() < 0.9) this.callFrom(g, rv, 'motorbike');
    }
    const gap = this.gap(g);
    for (const rv of g.rivals) rv.call = Math.max(0, rv.call - dt);
    for (const o of g.others) {
      o.call = Math.max(0, o.call - dt); o.next -= dt;
      if (o.next <= 0) { o.next = o.every * (0.7 + Math.random() * 0.6); this.callFrom(g, o, o.kind); }
    }
    // Your call: hold Call (or shout). The throat sac swells; a call that starts in the gap and lasts counts.
    if (working(input) && !g.met) {
      p.call = Math.min(1, p.call + dt * 4);
      if (!p.callSound) { p.callSound = true; p.started = gap; p.callT = 0; FrogCalls.call('motorbike', 0, 0, 0.35); g.rings.push({ x: p.x, y: p.y, t: 0 }); }
      p.callT += dt;
      if (p.started && gap && p.callT >= 0.6 && !p.counted) {
        p.counted = true; g.score++;
        Sound.play('score'); Game.pop(p.x, p.y - 30, 'Heard!', '#ffd23f'); Game.fact('call');
        if (g.score === 2) Game.fact('gap');
        for (let i = 0; i < g.rivals.length; i++) g.rivals[i].active = i < 2 + Math.floor(g.score / 2);   // the chorus swells
      }
      if (!p.started && p.callT > 0.4) Game.hint('Too noisy! Wait for the green ring: the gap in the chorus.');
      if (p.callT > 1.6) { p.callSound = false; p.counted = false; }   // the next call
    } else {
      p.call = Math.max(0, p.call - dt * 3);
      p.callSound = false; p.counted = false; p.started = false;
    }
    if (p.call > 0.6) Game.fact('sac');
    setAction('Call', gap && !g.met);
    // The heron hears a calling frog from far off
    for (const pr of g.preds) { pr.sight = p.call > 0.2 ? 260 : 90; if (pr.state === 'alert' || pr.state === 'chase') Game.fact('quiet'); }
    // The female comes once you have been heard enough, hopping from the far reeds
    if (g.score >= this.goal && !g.female) {
      const far = REED_SPOTS.reduce((a, s) => (Math.hypot(s[0] - p.x, s[1] - p.y) > Math.hypot(a[0] - p.x, a[1] - p.y) ? s : a));
      g.female = { sprite: 'frog', kind: 'female', female: true, x: far[0], y: far[1], r: 14, angle: 0, scale: 1.7, moving: true };
      g.items.push(g.female);
      Sound.play('win'); Game.fact('female');
      g.toasts.unshift({ text: 'A female heard you! She’s on her way. Wait for her.', kind: 'hint' }); g.toastT = 0;
    }
    if (g.female && !g.met) {
      const f = g.female, d = dist(f, p);
      f.angle = Math.atan2(p.y - f.y, p.x - f.x);
      if (d > 40) { f.x += Math.cos(f.angle) * 70 * dt; f.y += Math.sin(f.angle) * 70 * dt; }
      else { g.met = true; f.moving = false; Game.pop(f.x, f.y - 30, '♥', '#e8506a'); Game.burst(f.x, f.y, '#e8506a', 20); }
    }
    g.rings = g.rings.filter(q => (q.t += dt) < 1.2);
    if (g.point && (g.point.t -= dt) <= 0) g.point = null;
  },
  drawExtra(ctx, g) {
    const p = g.player, R = g.round;
    // calls on the water: rings spreading from whoever called
    for (const q of g.rings) { ctx.beginPath(); ctx.arc(q.x, q.y, 10 + q.t * 50, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 * (1 - q.t / 1.2)) + ')'; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (g.met) return;
    // the gap ring round you, and the round shown as four dots: three callers, then the green gap
    const gap = this.gap(g);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, 34, 0, TAU); ctx.strokeStyle = gap ? '#3fd06a' : 'rgba(255,255,255,.6)'; ctx.stroke();
    for (let i = 0; i < CHORUS.slots; i++) {
      ctx.beginPath(); ctx.arc(p.x - 18 + i * 12, p.y - 50, 4, 0, TAU);
      ctx.fillStyle = i === R.slot ? (i === CHORUS.slots - 1 ? '#3fd06a' : '#fff') : i === CHORUS.slots - 1 ? 'rgba(63,208,106,.4)' : 'rgba(255,255,255,.3)'; ctx.fill();
    }
    // an arrow toward a frog you have just heard for the first time
    if (g.point) {
      const a = Math.atan2(g.point.y - p.y, g.point.x - p.x);
      ctx.save(); ctx.translate(p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60); ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, g.point.t) + ')'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
      ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.rotate(-a); ctx.fillText('♪', 0, -12);
      ctx.restore();
    }
    if (g.female) { const pulse = 0.5 + 0.5 * Math.sin(g.t * 4); ctx.beginPath(); ctx.arc(g.female.x, g.female.y, 30 + pulse * 6, 0, TAU); ctx.fillStyle = 'rgba(255,210,80,' + (0.15 + pulse * 0.1) + ')'; ctx.fill(); }
  },
  // The level draws the world, then the night over it: a navy tint that opens round the frog, stars and the moon.
  render(ctx, g) {
    Game.drawWorld(ctx);
    const z = Game.zoom || 1, sx = (g.player.x - g.cam.x) * z, sy = (g.player.y - g.cam.y) * z;
    const tint = ctx.createRadialGradient(sx, sy, 60, sx, sy, 520);
    tint.addColorStop(0, 'rgba(10,14,40,.22)'); tint.addColorStop(1, 'rgba(10,14,40,.5)');
    ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H);
    Night.stars(ctx, 60, 0.8);
    ctx.save(); ctx.translate(W / 2 + 250, 110); drawMoonShape(ctx, 30); ctx.restore();
  },
  goalPoint(g) { return g.female && !g.met ? g.female : null; },
  hud(g) {
    if (g.met) setHud('She’s here!', '');
    else if (g.female) setHud('Heard ' + g.score + ' times', 'A female is coming!');
    else setHud('Heard ' + g.score + ' / ' + this.goal, this.gap(g) ? 'Call now!' : 'Wait for the gap');
  },
  won(g) { return !!g.met; },
};
Missions.frog.sex = 'You are a male. Only the males call.';
finishMissions();
