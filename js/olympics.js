'use strict';
// The Bug Olympics at Perry Lakes: six events, each a thing a real bug does, measured against real numbers.
// Medals are the stars (gold 3, silver 2, bronze 1); the best result is kept. No nets and no predators here.
// Every number is sourced in docs/facts.md (Bug Olympics). Perry Lakes Stadium held the 1962 Commonwealth Games.

Bugs.push({ id: 'olympics', name: 'Bug Olympics', sci: 'Six events', place: 'Perry Lakes', sprite: 'medalIcon',
  pin: { x: 278, y: 160 }, stages: ['oly_jump', 'oly_sprint', 'oly_dig', 'oly_lift', 'oly_buzz', 'oly_gym'], kind: 'sandbox', free: true,
  // The Bug Book's extra line: medals won and best results
  book() {
    const st = this.stages.map(id => Progress.stars(id)), n = (k) => st.filter(s => s === k).length;
    const bests = this.stages.filter(id => Progress.best(id) !== undefined).map(id => Missions[id].stage + ' ' + Progress.best(id) + Missions[id].unit);
    return 'Medals: Gold ' + n(3) + ' · Silver ' + n(2) + ' · Bronze ' + n(1) + (bests.length ? ' · Best: ' + bests.join(', ') : '');
  },
});

Object.assign(Sprites, {
  // A gold medal on a ribbon (the ribbon points +x, which the portrait turns to the top of the page)
  medalIcon(ctx) {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(2, s * 3); ctx.lineTo(24, s * 11); ctx.lineTo(24, s * 19); ctx.lineTo(-2, s * 10); ctx.closePath(); ctx.fillStyle = s < 0 ? '#2a5aa0' : '#c8302a'; ctx.fill(); }
    ell(ctx, -6, 0, 14, 14, '#c89018', 0, 'none');
    ell(ctx, -6, 0, 11, 11, '#f0c030', 0, 'none');
    ctx.fillStyle = '#b07010'; ctx.beginPath();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 2.8 : 6.5; ctx.lineTo(-6 + Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  },
  // The mound a dung beetle leaves where a pat used to be
  olyMound(ctx) {
    ell(ctx, 0, 2, 22, 15, '#9a7a4e', 0, 'soil');
    ell(ctx, 0, -1, 7, 5, '#2a1a0c', 0, 'none');
    const r = rng(8); for (let k = 0; k < 9; k++) plainEll(ctx, (r() - 0.5) * 40, 4 + (r() - 0.5) * 22, 2.2, 1.6, 'rgba(70,45,20,.5)');
  },
});

// ---------------------------------------------------------------- shared: the clock, medals, the end line
const OLY = {
  place: 'Bug Olympics, Perry Lakes',
  names: ['no medal', 'Bronze', 'Silver', 'Gold'],
  // medals: [bronze, silver, gold] thresholds; times want to be low, the jump wants to be high
  medal(v, [b, s, g], higher) { return higher ? (v >= g ? 3 : v >= s ? 2 : v >= b ? 1 : 0) : (v <= g ? 3 : v <= s ? 2 : v <= b ? 1 : 0); },
  clock() { return { time: 0, started: false, finished: false, doneT: 0, result: 0, newBest: false }; },
  // The clock starts the first time you move or press, and stops at the finish
  tick(g, dt, input) {
    const o = g.oly;
    if (o.finished) { o.doneT += dt; return; }
    if (!o.started && (g.player.moving || input.pressed || input.held || input.loud)) { o.started = true; Game.pop(g.player.x, g.player.y - 34, 'Go!', '#3fd06a'); }
    if (o.started) o.time += dt;
  },
  // A timed event ends: the time is the result and the medal is the stars
  finish(g, m) {
    const o = g.oly;
    o.finished = true; o.result = Math.round(o.time * 10) / 10;
    Sound.play('win');
    Game.pop(g.player.x, g.player.y - 34, o.result + ' seconds!', '#ffd23f');
    if (typeof Progress !== 'undefined') o.newBest = Progress.setBest(m.id, o.result, false);
  },
  stars(m, g) { return this.medal(g.oly.result, m.medals, !!m.higher); },
  endLine(m, g) {
    const o = g.oly, n = this.stars(m, g), best = typeof Progress !== 'undefined' ? Progress.best(m.id) : undefined;
    return (n ? this.names[n] + ' medal! ' : 'No medal this time. ') + o.result + m.unit + '.' +
      (o.newBest ? ' Your best so far!' : best !== undefined ? ' Your best: ' + best + m.unit + '.' : '');
  },
  time(g) { return 'Time ' + g.oly.time.toFixed(1) + ' s'; },
  won(g) { return g.oly.finished && g.oly.doneT >= 1.4; },
};

// ---------------------------------------------------------------- 1. Long jump (side-on)
// A sandhopper on the long-jump pit. Walk to the board, press Jump when the swinging power bar is high.
// Three jumps; the best counts, measured in body lengths along the ruler.
const JUMP = { W: 2600, H: 600, ground: 440, start: 150, board: 620, BL: 44, attempts: 3, swing: 1.4, medals: [16, 26, 34] };

// The stadium seen side-on: the sky with clouds, the grandstand full of bugs with its banner (centred at bx), and
// the grass down to the ground line gy. The events draw their own ground below it.
function drawStadium(ctx, W, H, gy, r, bx, label, clouds) {
  const g = ctx.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#4a90d8'); g.addColorStop(1, '#cfe6f6');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy);
  const cn = clouds ? clouds.n : 9, ch = clouds ? clouds.h : 110;
  for (let i = 0; i < cn; i++) { const x = r() * W, y = 30 + r() * ch; for (let k = 0; k < 4; k++) plainEll(ctx, x + k * 24 - 36, y + (k % 2) * 7, 26 + r() * 12, 13 + r() * 6, 'rgba(255,255,255,.85)'); }
  // The grandstand: rows of seats with a crowd of bugs, a front wall and the banner
  for (let row = 0; row < 5; row++) {
    ctx.fillStyle = row % 2 ? '#7a8088' : '#949aa2'; ctx.fillRect(0, gy - 190 + row * 22, W, 22);
    for (let x = 10; x < W; x += 14) if (r() < 0.75) plainEll(ctx, x, gy - 178 + row * 22, 4, 4, ['#e85a3a', '#f0c030', '#3a8ad8', '#5aa848', '#f4f4f0', '#1a1a1a'][Math.floor(r() * 6)]);
  }
  ctx.fillStyle = '#2b2118'; ctx.fillRect(0, gy - 80, W, 20);
  ctx.fillStyle = '#2f6a9a'; ctx.fillRect(bx - 280, gy - 242, 560, 46);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, bx, gy - 209);
  // Grass between the stand and the ground line
  ctx.save(); ctx.beginPath(); ctx.rect(0, gy - 60, W, 60); ctx.clip(); ctx.translate(0, gy - 60);
  Ground.grass(ctx, W, 60, 63, { height: 6, cell: 120 });
  ctx.restore();
}

Backgrounds.olyBeach = function (ctx, W, H) {
  const r = rng(62), J = JUMP, gy = J.ground;
  drawStadium(ctx, W, H, gy, r, J.board + 210, 'BUG OLYMPICS · PERRY LAKES');
  // The run-up track and the soil under everything, in cross-section
  let g = ctx.createLinearGradient(0, gy + 30, 0, H); g.addColorStop(0, '#8a6a40'); g.addColorStop(1, '#4a3420');
  ctx.fillStyle = g; ctx.fillRect(0, gy + 30, W, H - gy - 30);
  ctx.fillStyle = '#b84a30'; ctx.fillRect(0, gy, J.board + 2, 30);
  for (let x = 20; x < J.board; x += 60) plainLine(ctx, [x, gy + 15, x + 30, gy + 15], 'rgba(255,255,255,.35)', 2);
  // The sand pit from the board to the far end
  g = ctx.createLinearGradient(0, gy, 0, H); g.addColorStop(0, '#f4e2b4'); g.addColorStop(0.3, '#e2c88e'); g.addColorStop(1, '#b8975e');
  ctx.fillStyle = g; ctx.fillRect(J.board, gy, W - J.board, H - gy);
  ctx.save(); ctx.beginPath(); ctx.rect(J.board, gy, W - J.board, H - gy); ctx.clip();
  Tex.fillRect(ctx, 'sand', J.board, gy, W - J.board, H - gy, 1.4, 0.5, 'multiply');
  for (let i = 0; i < 160; i++) plainEll(ctx, J.board + r() * (W - J.board), gy + 8 + r() * 150, 1 + r() * 2, 0.8 + r() * 1.4, r() < 0.5 ? 'rgba(255,250,230,.5)' : 'rgba(90,70,40,.35)');
  ctx.restore();
  ctx.fillStyle = '#d8c4a0'; ctx.fillRect(J.board - 6, gy - 2, 6, 34); ctx.fillRect(W - 24, gy - 2, 6, 34);
  // The take-off board, white with a red line at its edge
  ctx.fillStyle = '#f8f8f4'; ctx.fillRect(J.board - 44, gy - 3, 44, 8);
  ctx.fillStyle = '#d83a2a'; ctx.fillRect(J.board - 2, gy - 4, 4, 10);
  // The ruler: a tick every body length, a number every five
  ctx.strokeStyle = 'rgba(60,40,20,.7)'; ctx.lineWidth = 1.5; ctx.fillStyle = '#4a3a20'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  for (let i = 0; i <= 44; i++) {
    const x = J.board + i * J.BL, tall = i % 5 === 0;
    ctx.beginPath(); ctx.moveTo(x, gy + 8); ctx.lineTo(x, gy + (tall ? 20 : 14)); ctx.stroke();
    if (tall) ctx.fillText(String(i), x, gy + 34);
  }
  ctx.font = '12px sans-serif'; ctx.fillText('body lengths', J.board + 22 * J.BL, gy + 50);
  ctx.fillStyle = 'rgba(255,250,220,.8)'; ctx.fillRect(0, gy - 1, W, 2);
};

Missions.oly_jump = {
  id: 'oly_jump', bug: 'olympics', stage: 'Long jump', place: OLY.place, view: 'side',
  world: { w: JUMP.W, h: JUMP.H }, sprite: 'sandhopper', bg: 'olyBeach',
  action: 'Jump', radius: 14, speed: 120, scale: 1.2, noNet: true, gentle: true,
  medals: JUMP.medals, higher: true, unit: ' body lengths',
  home: { x: JUMP.start, y: JUMP.ground - 12, r: 26, label: 'Start' },
  facts: [
    'Welcome to the Bug Olympics! The games are pretend, but the numbers are real.',
    'You’re a sandhopper. Sandhoppers jump by flicking their tail end against the sand.',
    'Jumps are measured in body lengths, so a tiny animal can be compared with a big one.',
  ],
  how: [
    'This event is side-on. Walk right to the white board with the arrow keys, or touch and drag.',
    'On the board a power bar swings. Press Jump when it’s full!',
    'Three jumps. Your best one counts, in body lengths along the ruler.',
    'Bronze at 16, silver at 26, gold at 34 body lengths.',
  ],
  factText: {
    start: 'Three jumps! A real sandhopper jumps to escape a hungry gull, not for a medal.',
    flick: 'Sandhoppers don’t jump with their legs. They flick their tail end against the sand, like a spring letting go.',
    far: 'A real sandhopper leaps many times its own length. The best human long jumpers reach about 9 metres: five times their own height.',
    win: 'Jumps are measured in body lengths so that a sandhopper, a frog and a kangaroo can be compared fairly.',
  },

  setup(g) {
    const p = g.player;
    p.vx = 0; p.vy = 0; p.face = 1; p.angle = 0; p.onGround = true; p.flat = true; p.y = JUMP.ground - 12;
    g.oly = OLY.clock(); g.jumps = []; g.restT = 0; g.meter = -1; g.meterT = 0;
    Game.later(2, () => Game.hint('Walk right to the white board!'));
  },
  move(g, dt, dx, dy) {
    const p = g.player, J = JUMP;
    dx = Math.abs(dx) < 0.15 ? 0 : Math.sign(dx);
    p.angle = 0;
    if (p.onGround) {
      if (dx && g.restT <= 0 && !g.oly.finished) { p.face = dx > 0 ? 1 : -1; p.x = clamp(p.x + dx * p.speed * dt, 60, J.board); p.moving = true; }
    } else {
      p.vy += 1100 * dt;
      p.x = clamp(p.x + p.vx * dt, 60, J.W - 60);
      p.y += p.vy * dt;
      if (p.y >= J.ground - 12 && p.vy > 0) { p.y = J.ground - 12; p.onGround = true; p.vx = 0; p.vy = 0; this.land(g); }
    }
    p.air = !p.onGround;
  },
  update(g, dt, input) {
    const p = g.player, J = JUMP, o = g.oly;
    if (g.restT > 0) { g.restT -= dt; if (g.restT <= 0) this.lineUp(g); }
    // On the board the power bar swings; the meter restarts from empty each time you step on
    const zone = p.onGround && g.restT <= 0 && !o.finished && p.x >= J.board - 70;
    if (zone) { g.meterT += dt; g.meter = 0.5 - 0.5 * Math.cos(g.meterT / J.swing * TAU); } else { g.meter = -1; g.meterT = 0; }
    setAction('Jump', zone);
    if (input.pressed && p.onGround && g.restT <= 0 && !o.finished) {
      if (zone) this.jump(g, g.meter);
      else { p.vx = p.face * 110; p.vy = -260; p.onGround = false; p.practice = true; Sound.play('jump'); }   // a little hop on the spot
    }
    if (!zone && p.onGround && g.restT <= 0 && !o.finished && p.stillT > 4) Game.hint('Walk right to the white board. Then press Jump when the power bar is full!');
    if (o.finished) o.doneT += dt;
  },
  jump(g, k) {
    const p = g.player;
    p.vx = 350 + k * 700; p.vy = -(380 + k * 520); p.onGround = false; p.face = 1; p.practice = false;
    Sound.play('jump'); Game.fact('flick');
    Game.pop(p.x, p.y - 30, k > 0.9 ? 'Perfect!' : k > 0.6 ? 'Good!' : 'Hop!', k > 0.9 ? '#3fd06a' : '#fff');
  },
  land(g) {
    const p = g.player, J = JUMP, o = g.oly;
    Game.burst(p.x, p.y + 10, '#e8d4a0', 8);
    if (p.practice) { p.practice = false; return; }
    const bl = Math.max(0, Math.round((p.x - J.board) / J.BL));
    g.jumps.push({ bl, x: p.x }); o.result = Math.max(o.result, bl);
    Sound.play('score'); Game.pop(p.x, p.y - 36, bl + ' body lengths!', '#ffd23f');
    if (bl >= 20) Game.fact('far');
    if (g.jumps.length >= J.attempts) {
      o.finished = true; o.doneT = 0; Sound.play('win');
      if (typeof Progress !== 'undefined') o.newBest = Progress.setBest(this.id, o.result, true);
    } else g.restT = 2.2;
  },
  lineUp(g) { const p = g.player; p.x = JUMP.start; p.face = 1; p.stillT = 0; Game.pop(p.x, p.y - 30, 'Jump ' + (g.jumps.length + 1) + ' of ' + JUMP.attempts, '#fff'); },
  drawExtra(ctx, g) {
    const p = g.player, J = JUMP;
    // The hopper's shadow on the sand, smaller the higher it flies
    const h = J.ground - 12 - p.y, k = Math.max(0.3, 1 - h / 500);
    softShadow(ctx, p.x + 4, J.ground + 2, 22 * k, 5 * k, 0.3 * k);
    // A flag where each jump landed
    for (const j of g.jumps) {
      plainLine(ctx, [j.x, J.ground, j.x, J.ground - 26], '#4a3a20', 2);
      ctx.fillStyle = '#e8c030'; ctx.beginPath(); ctx.moveTo(j.x, J.ground - 26); ctx.lineTo(j.x + 16, J.ground - 20); ctx.lineTo(j.x, J.ground - 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b2118'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(j.bl, j.x, J.ground - 30);
    }
    // The power bar over the hopper while it stands on the board
    if (g.meter >= 0) {
      const x = p.x - 40, y = p.y - 52;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x - 2, y - 2, 84, 14);
      const grad = ctx.createLinearGradient(x, 0, x + 80, 0); grad.addColorStop(0, '#f0c030'); grad.addColorStop(1, '#3fd06a');
      ctx.fillStyle = grad; ctx.fillRect(x, y, 80 * g.meter, 10);
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 80 * g.meter - 1.5, y - 3, 3, 16);
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Power', p.x, y - 7);
    }
  },
  goalPoint(g) { const p = g.player; return p.onGround && g.restT <= 0 && !g.oly.finished && p.x < JUMP.board - 70 ? { x: JUMP.board - 20, y: p.y } : null; },
  hud(g) {
    const o = g.oly, n = Math.min(JUMP.attempts, g.jumps.length + (o.finished ? 0 : 1));
    setHud('Jump ' + n + ' of ' + JUMP.attempts, o.result ? 'Best: ' + o.result + ' body lengths' : '');
  },
  stars(g) { return OLY.stars(this, g); },
  // The medal, the best jump, and what that jump would be for a kid about 1.2 m tall
  endLine(g) {
    const bl = g.oly.result, m = Math.round(bl * 1.2);
    return OLY.endLine(this, g) + ' A kid jumping ' + bl + ' body lengths would fly ' + m + ' metres: ' +
      (m >= 50 ? 'two swimming pools!' : m >= 25 ? 'a whole swimming pool!' : m >= 12 ? 'the length of a bus!' : 'longer than a car!');
  },
  won(g) { return g.oly.finished && g.oly.doneT >= 1.6; },
};

// ---------------------------------------------------------------- 2. Sprint
// A blue skimmer flies a lap of Herdsman Lake through six gates, darting when the button is ready.
const SPRINT = { gates: [[600, 300], [1300, 200], [1700, 620], [1300, 1000], [600, 1000], [220, 600]], r: 48, medals: [60, 40, 26] };

Missions.oly_sprint = {
  id: 'oly_sprint', bug: 'olympics', stage: 'Sprint', place: OLY.place, world: BIG, sprite: 'dragonfly', bg: 'dragonfly',
  action: 'Dart', radius: 20, speed: 190, scale: 1.3, noNet: true, gentle: true,
  medals: SPRINT.medals, unit: ' seconds',
  home: { x: 220, y: 600, r: 50, label: 'Start and finish' },
  facts: [
    'You’re a blue skimmer dragonfly, one of the fastest fliers at the lake.',
    'The Australian Museum says big dragonflies can reach 70 kilometres an hour.',
    'Dragonflies move each of their four wings on its own, so they can dart and turn sharply.',
  ],
  how: [
    'Fly with the arrow keys, or touch and drag. The clock starts when you move.',
    'Fly through the six rings in order. The next one glows yellow.',
    'Press Dart for a burst of speed when the button is ready.',
    'Bronze under 60 seconds, silver under 40, gold under 26.',
  ],
  factText: {
    start: 'Sprint! Six rings in order, as fast as you can. Darting helps.',
    dart: 'A dragonfly darts with a burst of wing power. Each of its four wings beats on its own.',
    wings: 'Dragonflies can hover, fly backwards and turn in the air, because every wing works alone.',
    car: 'Big dragonflies can reach 70 kilometres an hour: as fast as a car on a main road.',
    win: 'The fastest reliably timed dragonflies fly at about 60 kilometres an hour in short bursts.',
  },

  setup(g) { g.oly = OLY.clock(); g.gate = 0; g.player.dart = 0; g.player.dartCd = 0; },
  locked(g) { return g.oly.finished; },
  update(g, dt, input) {
    const p = g.player, o = g.oly, G = SPRINT.gates;
    OLY.tick(g, dt, input);
    p.dart = Math.max(0, p.dart - dt); p.dartCd = Math.max(0, p.dartCd - dt);
    if (input.pressed && p.dartCd <= 0 && !o.finished) { p.dart = 0.6; p.dartCd = 1.5; Sound.play('dart'); Game.fact('dart'); }
    p.speed = p.dart > 0 ? 340 : 190;
    setAction('Dart', p.dartCd <= 0 && !o.finished);
    if (g.gate < G.length) {
      const [x, y] = G[g.gate];
      if (Math.hypot(p.x - x, p.y - y) < SPRINT.r) {
        g.gate++; Sound.play('pick');
        if (g.gate < G.length) { Game.pop(x, y - 46, 'Ring ' + g.gate + '!', '#ffd23f'); if (g.gate === 2) Game.fact('wings'); }
        else { OLY.finish(g, this); Game.fact('car'); }
      }
    }
  },
  drawExtra(ctx, g) {
    const G = SPRINT.gates;
    for (let i = 0; i < G.length; i++) {
      const [x, y] = G[i], next = i === g.gate, done = i < g.gate;
      const pulse = next ? 0.5 + 0.5 * Math.sin(g.t * 5) : 0;
      ctx.beginPath(); ctx.arc(x, y, SPRINT.r - 4 + pulse * 4, 0, TAU);
      ctx.strokeStyle = done ? 'rgba(63,208,106,.45)' : next ? 'rgba(255,210,63,' + (0.7 + pulse * 0.3) + ')' : 'rgba(255,255,255,.55)';
      ctx.lineWidth = next ? 7 : 4; ctx.stroke();
      ctx.fillStyle = done ? 'rgba(63,208,106,.7)' : '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x, y + 7);
    }
  },
  goalPoint(g) { const gt = SPRINT.gates[g.gate]; return gt ? { x: gt[0], y: gt[1] } : null; },
  hud(g) { setHud(OLY.time(g), g.oly.finished ? 'Finished!' : 'Ring ' + Math.min(g.gate + 1, SPRINT.gates.length) + ' of ' + SPRINT.gates.length); },
  stars(g) { return OLY.stars(this, g); },
  endLine(g) { return OLY.endLine(this, g); },
  won(g) { return OLY.won(g); },
};

// ---------------------------------------------------------------- 3. Dung burying
// A dung beetle on the paddock buries three cow pats: hold Dig at a pat to pull it down the tunnel.
const DIG = { pats: [[520, 300], [1420, 360], [980, 1000]], need: 6, medals: [90, 62, 45] };

Missions.oly_dig = {
  id: 'oly_dig', bug: 'olympics', stage: 'Dung burying', place: OLY.place, world: BIG, sprite: 'dungBeetle', bg: 'paddock',
  action: 'Dig', radius: 14, speed: 120, scale: 1.7, noNet: true, gentle: true,
  medals: DIG.medals, unit: ' seconds',
  home: { x: 960, y: 600, r: 50, label: 'Start' },
  facts: [
    'You’re a dung beetle. Real dung beetles bury cow pats so flies can’t breed in them.',
    'CSIRO brought dung beetles to Australia from overseas to clean up cattle paddocks.',
    'A dung beetle digs a tunnel under the pat and pulls the dung down for its babies to eat.',
  ],
  how: [
    'Walk with the arrow keys, or touch and drag. The clock starts when you move.',
    'Walk to a cow pat and hold or tap Dig. The pat shrinks as you pull it underground.',
    'Bury all three pats as fast as you can.',
    'Bronze under 90 seconds, silver under 62, gold under 45.',
  ],
  factText: {
    start: 'Dung burying! Three pats to pull underground. The dung beetles CSIRO brought in bury pats like these every day.',
    tunnel: 'Dung beetles dig tunnels under the pat and pull the dung down. Some tunnels go a metre deep!',
    brood: 'Underground, the dung is packed into balls. The beetle lays an egg in each one, and the grub eats its way out.',
    win: 'Buried pats mean fewer bush flies, because flies breed in fresh dung. Dung beetles are the paddock’s cleaners.',
  },

  setup(g) {
    g.oly = OLY.clock(); g.mounds = [];
    for (const [x, y] of DIG.pats) g.items.push({ sprite: 'pat', kind: 'pat', x, y, r: 22, fresh: 0.6, size: 1, dug: 0, buried: false, angle: Math.random() * TAU });
  },
  update(g, dt, input) {
    const p = g.player, o = g.oly;
    OLY.tick(g, dt, input);
    const pat = o.finished ? null : g.items.find(i => i.kind === 'pat' && dist(p, i) < 46);   // the reach stays as the pat shrinks
    setAction('Dig', !!pat);
    if (pat && working(input)) {
      const w = work(input, dt), before = pat.dug;
      pat.dug += w; p.moving = true;
      pat.size = Math.max(0.15, 1 - 0.85 * pat.dug / DIG.need);
      p.progress = Math.min(1, pat.dug / DIG.need);
      if (Math.floor(pat.dug * 3) !== Math.floor(before * 3)) { Game.burst(p.x, p.y, '#6a4a2a', 4); Sound.play('tap'); }
      Game.fact('tunnel');
      if (pat.dug >= DIG.need) {
        g.items.splice(g.items.indexOf(pat), 1);
        g.mounds.push({ sprite: 'olyMound', x: pat.x, y: pat.y, r: 20, scale: 1.3, angle: 0, flat: true });
        g.items.push(g.mounds[g.mounds.length - 1]);
        g.score++; Sound.play('score'); Game.pop(pat.x, pat.y - 30, 'Buried!', '#ffd23f');
        if (g.score === 1) Game.fact('brood');
        if (g.score >= DIG.pats.length) OLY.finish(g, this);
      }
    } else if (pat && p.stillT > 1.5) Game.hint('Hold Dig to pull the dung down into your tunnel!');
  },
  // Dug soil spreads round a pat as it goes down
  drawBuild(ctx, g) {
    for (const pt of g.items) if (pt.kind === 'pat' && pt.dug > 0) ell(ctx, pt.x, pt.y + 4, 26 + 10 * pt.dug / DIG.need, 20 + 8 * pt.dug / DIG.need, 'rgba(90,60,30,.35)', 0, 'none');
  },
  goalPoint(g) { return g.oly.finished ? null : nearest(g.items.filter(i => i.kind === 'pat'), g.player, 99999); },
  hud(g) { setHud(OLY.time(g), 'Pats buried: ' + g.score + ' / ' + DIG.pats.length); },
  stars(g) { return OLY.stars(this, g); },
  endLine(g) { return OLY.endLine(this, g); },
  won(g) { return OLY.won(g); },
};

// ---------------------------------------------------------------- 4. Carry relay
// A bull ant carries five loads, each heavier than the last, from the pile to the nest. Heavy loads are slow.
const LIFT = { loads: [['termite', 'termite', 1], ['deadMoth', 'dead moth', 2], ['deadBeetle', 'dead beetle', 3], ['beetle', 'Christmas beetle', 4], ['caterpillar', 'caterpillar', 5]], pile: { x: 1200, y: 600 }, medals: [110, 75, 50] };

Missions.oly_lift = {
  id: 'oly_lift', bug: 'olympics', stage: 'Carry relay', place: OLY.place, world: BIG, sprite: 'ant', bg: 'ant',
  action: 'Grab', radius: 16, speed: 150, scale: 1.4, noNet: true, gentle: true,
  medals: LIFT.medals, unit: ' seconds',
  home: { x: 700, y: 600, r: 50, label: 'Nest' },
  facts: [
    'You’re a bull ant worker. Ants carry food many times heavier than themselves.',
    'Five loads wait at the pile, each heavier than the last. Carry each one to the nest.',
    'A heavy load slows an ant down, but it still gets there.',
  ],
  how: [
    'Walk with the arrow keys, or touch and drag. The clock starts when you move.',
    'Walk to the pile and press Grab to pick up the load. Carry it into the nest circle.',
    'Then go back for the next one. Heavier loads are slower!',
    'Bronze under 110 seconds, silver under 75, gold under 50.',
  ],
  factText: {
    start: 'Carry relay! Five loads to the nest. The ants’ larvae eat insects like these.',
    carry: 'Ants carry food many times heavier than themselves. Scientists have weighed ants carrying several times their own weight.',
    heavy: 'Heavy loads slow an ant down. Really big prey is sometimes cut up, or carried by a team of ants.',
    win: 'Five loads home! An ant carrying several times its weight is like a kid carrying a grown-up.',
  },

  setup(g) { g.oly = OLY.clock(); g.load = 0; g.player.carry = null; this.nextLoad(g); },
  nextLoad(g) {
    const [sprite, name, w] = LIFT.loads[g.load];
    g.items = [{ sprite, kind: 'load', name, w, x: LIFT.pile.x, y: LIFT.pile.y, r: 12, scale: 1.4, angle: 0, stunned: true }];
  },
  update(g, dt, input) {
    const p = g.player, o = g.oly;
    OLY.tick(g, dt, input);
    const near = !p.carry && !o.finished ? g.items.find(i => i.kind === 'load' && dist(p, i) < 40) : null;
    setAction('Grab', !!near);
    if (near && input.pressed) {
      p.carry = near.sprite; p.carryW = near.w; p.carryName = near.name;
      g.items.splice(g.items.indexOf(near), 1);
      Sound.play('pick'); Game.pop(p.x, p.y - 20, 'Got it!', '#fff');
      Game.fact(near.w >= 4 ? 'heavy' : 'carry');
    } else if (near && p.stillT > 1.5) Game.hint('Press Grab to pick up the ' + near.name + '!');
    if (p.carry && Game.inHome()) {
      g.score++; g.load++; p.carry = null;
      Sound.play('score'); Game.pop(p.x, p.y - 20, 'Load ' + g.score + '!', '#fff');
      if (g.load < LIFT.loads.length) this.nextLoad(g); else OLY.finish(g, this);
    }
    p.speed = p.carry ? 150 / (1 + 0.15 * p.carryW) : 150;
  },
  // The pile: a patch of bare sand with a sign
  drawBuild(ctx, g) {
    const q = LIFT.pile;
    ell(ctx, q.x, q.y + 4, 40, 28, 'rgba(120,95,60,.3)', 0, 'none');
    ctx.fillStyle = 'rgba(43,33,24,.75)'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Loads', q.x, q.y + 48);
  },
  onCaught(g) { g.player.carry = null; },
  goalPoint(g) { return g.oly.finished ? null : g.player.carry ? g.home : LIFT.pile; },
  hud(g) { setHud(OLY.time(g), g.player.carry ? 'Carrying a ' + g.player.carryName : 'Loads home: ' + g.score + ' / ' + LIFT.loads.length); },
  stars(g) { return OLY.stars(this, g); },
  endLine(g) { return OLY.endLine(this, g); },
  won(g) { return OLY.won(g); },
};

// ---------------------------------------------------------------- 5. Buzz-off
// A blue-banded bee shakes the pollen out of eight flowers as fast as she can. Shouting works too.
const BUZZ = { flowers: [[500, 300], [900, 220], [1350, 320], [1650, 650], [1350, 980], [900, 1060], [500, 950], [250, 650]], need: 0.8, medals: [75, 50, 35] };

Missions.oly_buzz = {
  id: 'oly_buzz', bug: 'olympics', stage: 'Buzz-off', place: OLY.place, world: BIG, sprite: 'bee', bg: 'bee',
  action: 'Buzz', radius: 16, speed: 175, scale: 1.5, noNet: true, gentle: true, voice: true,
  medals: BUZZ.medals, unit: ' seconds',
  home: { x: 200, y: 220, r: 46, label: 'Start' },
  facts: [
    'You’re a blue-banded bee. You shake pollen out of flowers by buzzing on them.',
    'Scientists filmed blue-banded bees banging their heads on flowers about 350 times a second.',
    'Eight flowers are waiting. Buzz each one as fast as you can.',
  ],
  how: [
    'Fly with the arrow keys, or touch and drag. The clock starts when you move.',
    'Land on a flower and hold or tap Buzz until the pollen pops out.',
    'Or turn on Shout to buzz on the map, and shout BUZZ at the flower!',
    'Bronze under 75 seconds, silver under 50, gold under 35.',
  ],
  factText: {
    start: 'Buzz-off! Eight flowers, one buzz each. Real blue-banded bees are quick: one buzz and off to the next flower.',
    headbang: 'A blue-banded bee bangs its head on a flower about 350 times a second to shake the pollen out.',
    fast: 'Blue-banded bees buzz faster than bumblebees, and spend less time on each flower.',
    shout: 'Your voice shook the pollen out! A real bee’s buzz comes from its flight muscles shaking very fast.',
    win: 'Tomato flowers need a buzz too. Farmers would love a bee as quick as you.',
  },

  setup(g) {
    g.oly = OLY.clock(); g.player.buzzT = 0;
    BUZZ.flowers.forEach(([x, y], i) => { const kind = i % 2 ? 'hibbertia' : 'dianella'; g.items.push({ sprite: kind, kind, x, y, r: 26, scale: 1.3, pollen: true, angle: Math.random() * TAU }); });
  },
  update(g, dt, input) {
    const p = g.player, o = g.oly;
    OLY.tick(g, dt, input);
    p.buzz = false;
    const f = o.finished ? null : g.items.find(i => i.pollen && touching(p, i, -8));
    if (f !== p.flower) { p.flower = f; p.buzzT = 0; }
    setAction('Buzz', !!f);
    if (f) {
      if (working(input)) {
        p.buzz = true;
        const w = work(input, dt);
        if (Math.floor((p.buzzT + w) * 8) !== Math.floor(p.buzzT * 8)) Sound.play('buzz');
        p.buzzT += w;
        Game.fact('headbang');
        if (input.loud) Game.fact('shout');
        if (p.buzzT >= BUZZ.need) {
          f.pollen = false; p.buzzT = 0; g.score++;
          Sound.play('pick'); Game.pop(f.x, f.y - 20, 'Pollen!', '#f39c12');
          if (g.score === 4) Game.fact('fast');
          if (g.score >= BUZZ.flowers.length) OLY.finish(g, this);
        }
      } else if (p.stillT > 1.5) Game.hint(typeof Mic !== 'undefined' && Mic.active ? 'Shout BUZZ to shake the pollen out!' : 'Hold or tap Buzz to shake the pollen out!');
      p.progress = Math.min(1, p.buzzT / BUZZ.need);
    }
  },
  drawExtra(ctx, g) {
    // A sparkle ring on every flower still holding pollen
    for (const f of g.items) if (f.pollen) { const s = 0.5 + 0.5 * Math.sin(g.t * 4 + f.x); ctx.beginPath(); ctx.arc(f.x, f.y, 34 + s * 3, 0, TAU); ctx.strokeStyle = 'rgba(255,230,120,' + (0.35 + s * 0.35) + ')'; ctx.lineWidth = 3; ctx.stroke(); }
  },
  goalPoint(g) { return g.oly.finished ? null : nearest(g.items.filter(i => i.pollen), g.player, 99999); },
  hud(g) { setHud(OLY.time(g), 'Flowers buzzed: ' + g.score + ' / ' + BUZZ.flowers.length); },
  stars(g) { return OLY.stars(this, g); },
  endLine(g) { return OLY.endLine(this, g); },
  won(g) { return OLY.won(g); },
};

// ---------------------------------------------------------------- 6. Gymnastics (side-on)
// A click beetle on its back on the mat. Press Click when the power bar is full: the beetle snaps itself into the
// air (a real click beetle's launch is near vertical, so only the height varies) and somersaults on the way; press
// Land as it comes down to land on its feet (the one made-up part: a real beetle can't steer, see docs/facts.md).
// Three flips; the best counts: 2 points a somersault, 3 for landing on your feet.
const GYM = { floor: 1100, ground: 1076, H: 1200, BL: 36, mat: 240, attempts: 3, swing: 1.4, g: 1100, window: 0.45, medals: [7, 11, 15] };   // window: seconds before touchdown in which Land counts
GYM.v = (k) => 400 + k * 1007;                                // launch speed: full power flies about 25 body lengths up
GYM.rate = 6.15 * TAU / (2 * GYM.v(0.85) / GYM.g);            // the spin: six somersaults from about 85% power up (never more than six count)

Backgrounds.olyGym = function (ctx, W, H) {
  const r = rng(64), G = GYM, cx = Math.round(W / 2);
  drawStadium(ctx, W, H, G.floor, r, cx, 'BUG OLYMPICS · GYMNASTICS', { n: 22, h: G.floor - 360 });
  // The soil under the grass
  const g = ctx.createLinearGradient(0, G.floor, 0, H); g.addColorStop(0, '#8a6a40'); g.addColorStop(1, '#4a3420');
  ctx.fillStyle = g; ctx.fillRect(0, G.floor, W, H - G.floor);
  ctx.fillStyle = 'rgba(255,250,220,.8)'; ctx.fillRect(0, G.floor - 1, W, 2);
  // The mat on the grass, and the height ruler beside it: a tick every body length, a number every five
  softShadow(ctx, cx + 6, G.floor + 2, G.mat / 2 + 10, 8, 0.3);
  ctx.fillStyle = '#2a5a9a'; ctx.fillRect(cx - G.mat / 2, G.ground, G.mat, G.floor - G.ground);
  ctx.fillStyle = '#4a86c8'; ctx.fillRect(cx - G.mat / 2, G.ground, G.mat, 5);
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(cx - 2, G.ground + 8, 4, 12); ctx.fillRect(cx - 24, G.ground + 12, 48, 4);
  const rx = cx - 180, top = G.ground - 29 * G.BL;
  ctx.fillStyle = 'rgba(255,250,240,.75)'; ctx.fillRect(rx - 3, top - 10, 6, G.floor - top + 10);
  ctx.strokeStyle = 'rgba(60,40,20,.8)'; ctx.lineWidth = 1.5; ctx.fillStyle = '#2b2118'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'right';
  for (let i = 0; i <= 29; i++) {
    const y = G.ground - i * G.BL, tall = i % 5 === 0;
    ctx.beginPath(); ctx.moveTo(rx - (tall ? 12 : 7), y); ctx.lineTo(rx + 3, y); ctx.stroke();
    if (tall && i) ctx.fillText(String(i), rx - 16, y + 5);
  }
  ctx.save(); ctx.translate(rx - 40, G.ground - 12 * G.BL); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.font = '12px sans-serif'; ctx.fillText('body lengths', 0, 0); ctx.restore();
};

Missions.oly_gym = {
  id: 'oly_gym', bug: 'olympics', stage: 'Gymnastics', place: OLY.place, view: 'side',
  get world() { return { w: W, h: GYM.H }; }, sprite: 'clickBeetle', bg: 'olyGym',
  action: 'Click', radius: 12, speed: 0, scale: 1.5, noNet: true, gentle: true,
  medals: GYM.medals, higher: true, unit: ' points',
  get home() { return { x: Math.round(W / 2), y: GYM.ground, r: 1, label: '' }; },
  facts: [
    'You’re a click beetle. Flipped on its back, a click beetle snaps a peg on its chest into a notch: click, and up it goes.',
    'A click beetle flips about 30 centimetres into the air, more than 25 times its own length, and somersaults on the way.',
    'It can’t steer in the air, so it lands on its back about half the time. Then it just clicks again.',
  ],
  how: [
    'This event is side-on. You start on your back on the mat.',
    'A power bar swings. Press Click when it’s full to snap into the air.',
    'You somersault as you fly: 2 points for every full somersault. Press Land just before you touch the mat to land on your feet: 3 more points.',
    'Three flips. Your best one counts. Bronze at 7 points, silver at 11, gold at 15.',
  ],
  factText: {
    start: 'Gymnastics! Three flips off the mat. A real click beetle flips to get back on its feet, not for a medal.',
    click: 'Click! The beetle locks a peg on its chest into a notch, loads it like a spring, and lets go: the jolt throws it into the air.',
    high: 'That’s more than 20 times your own length. A real click beetle flips about 30 centimetres into the air.',
    spin: 'In the air the beetle somersaults, up to six times on a high flip. Real click beetles can’t choose how many.',
    back: 'Landed on your back! Real click beetles land on their back about half the time. Then they click again.',
    feet: 'On your feet! A real click beetle can’t steer in the air, so landing feet first is luck. Here, Land does it.',
    win: 'The click jolts the beetle at about 380 times the pull of gravity. A rocket launch is about 3.',
  },

  setup(g) {
    const p = g.player;
    p.vx = 0; p.vy = 0; p.face = 1; p.angle = 0; p.onGround = true; p.flat = true; p.y = GYM.ground;
    p.spin = Math.PI; p.spinRate = 0; p.spinStart = Math.PI; p.peak = p.y; p.landPress = false; p.recover = false;
    g.oly = OLY.clock(); g.flips = []; g.restT = 0; g.recoverT = 0; g.meter = -1; g.meterT = 0; g.bestH = 0;
    Game.later(2, () => Game.hint('Press Click when the power bar is full!'));
  },
  locked() { return true; },   // no walking: the beetle lies on the mat
  move(g, dt) {
    const p = g.player, G = GYM;
    if (!p.onGround) {
      p.vy += G.g * dt; p.x = clamp(p.x + p.vx * dt, 40, World.w - 40); p.y += p.vy * dt;
      p.spin += p.spinRate * dt; p.peak = Math.min(p.peak, p.y);
      if (p.y >= G.ground && p.vy > 0) { p.y = G.ground; p.onGround = true; p.vx = 0; p.vy = 0; this.land(g); }
    }
    p.air = !p.onGround;
  },
  update(g, dt, input) {
    const p = g.player, G = GYM, o = g.oly;
    if (g.restT > 0) { g.restT -= dt; if (g.restT <= 0) this.lineUp(g); }
    if (g.recoverT > 0) { g.recoverT -= dt; if (g.recoverT <= 0) this.hop(g); }
    // On the mat the power bar swings; in the air, Land is ready just before touchdown
    const ready = p.onGround && g.restT <= 0 && g.recoverT <= 0 && !o.finished && !p.recover;
    if (ready) { g.meterT += dt; g.meter = 0.5 - 0.5 * Math.cos(g.meterT / G.swing * TAU); } else { g.meter = -1; g.meterT = 0; }
    const window = !p.onGround && !p.recover && p.vy > 0 && this.toLand(p) <= G.window;
    setAction(p.onGround ? 'Click' : 'Land', ready || (window && !p.landPress));
    if (input.pressed && !o.finished) {
      if (ready) this.click(g, g.meter);
      else if (window && !p.landPress) { p.landPress = true; Sound.play('tap'); Game.pop(p.x, p.y - 30, 'Feet first!', '#3fd06a'); }
      else if (!p.onGround && !p.recover && !p.landPress) Game.hint('Too early! Press Land just before you touch the mat.');
    }
    if (ready && p.stillT > 6 && !g.nudged) { g.nudged = true; Game.hint('Press Click when the power bar is full!'); }   // once a flip
    if (o.finished) o.doneT += dt;
  },
  // Seconds until the falling beetle touches the mat
  toLand(p) { const G = GYM, h = Math.max(0, G.ground - p.y); return (-p.vy + Math.sqrt(p.vy * p.vy + 2 * G.g * h)) / G.g; },
  click(g, k) {
    const p = g.player, G = GYM;
    p.vy = -G.v(k); p.vx = p.face * (20 + 50 * k); p.onGround = false; p.spinRate = G.rate; p.spinStart = p.spin; p.peak = p.y; p.landPress = false; p.recover = false;
    Sound.play('jump'); Game.fact('click');
    Game.pop(p.x, p.y - 30, k > 0.9 ? 'Click! Perfect!' : k > 0.6 ? 'Click!' : 'Click…', k > 0.9 ? '#3fd06a' : '#fff');
  },
  // Back on the mat: count the somersaults, feet or back, score the flip
  land(g) {
    const p = g.player, G = GYM, o = g.oly;
    Game.burst(p.x, p.y + 4, '#e8d4a0', 6);
    p.spinRate = 0;
    if (p.recover) { p.recover = false; p.spin = 0; Game.pop(p.x, p.y - 30, 'On your feet!', '#fff'); if (!o.finished) g.restT = 1.6; return; }
    const turns = Math.min(6, Math.floor(Math.abs(p.spin - p.spinStart) / TAU)), feet = !!p.landPress, height = Math.max(0, Math.round((G.ground - p.peak) / G.BL));
    const points = turns * 2 + (feet ? 3 : 0);
    p.spin = feet ? 0 : Math.PI;
    g.flips.push({ turns, feet, points, height }); o.result = Math.max(o.result, points); g.bestH = Math.max(g.bestH, height);
    Sound.play(feet ? 'score' : 'tap');
    Game.pop(p.x, p.y - 36, turns + (turns === 1 ? ' somersault' : ' somersaults') + (feet ? ' + feet: ' : ': ') + points + (points === 1 ? ' point' : ' points'), '#ffd23f');
    if (height >= 20) Game.fact('high');
    if (turns >= 2) Game.fact('spin');
    Game.fact(feet ? 'feet' : 'back');
    if (g.flips.length >= G.attempts) {
      o.finished = true; o.doneT = 0; Sound.play('win');
      if (typeof Progress !== 'undefined') o.newBest = Progress.setBest(this.id, o.result, true);
    }
    if (!feet) g.recoverT = 0.8;                       // on its back: it clicks again to get onto its feet
    else if (!o.finished) g.restT = 2.2;
  },
  // The small click that rights a beetle lying on its back: a half turn and down on its feet
  hop(g) {
    const p = g.player, G = GYM, vy = 380, air = 2 * vy / G.g;
    p.vy = -vy; p.vx = p.face * 30; p.onGround = false; p.recover = true; p.spinRate = Math.PI / air; p.spinStart = p.spin; p.landPress = false;
    Sound.play('jump'); Game.pop(p.x, p.y - 24, 'Click!', '#fff');
  },
  lineUp(g) {
    const p = g.player;
    p.x = Math.round(World.w / 2); p.face = 1; p.spin = Math.PI; p.stillT = 0; g.nudged = false;
    if (!g.oly.finished) Game.pop(p.x, p.y - 30, 'Flip ' + (g.flips.length + 1) + ' of ' + GYM.attempts, '#fff');
  },
  drawExtra(ctx, g) {
    const p = g.player, G = GYM, rx = Math.round(World.w / 2) - 180;
    // The beetle's shadow on the mat, smaller the higher it flies
    const h = G.ground - p.y, k = Math.max(0.25, 1 - h / 900);
    softShadow(ctx, p.x + 3, G.ground + 2, 18 * k, 4 * k, 0.3 * k);
    // A marker on the ruler for the top of each flip, and one that rides with the beetle in the air
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
    for (const f of g.flips) {
      const y = G.ground - f.height * G.BL;
      plainLine(ctx, [rx + 4, y, rx + 24, y], '#e8c030', 3);
      ctx.fillStyle = '#2b2118'; ctx.fillText(f.height + ' · ' + f.points + (f.points === 1 ? ' pt' : ' pts'), rx + 28, y + 4);
    }
    if (!p.onGround && !p.recover) plainLine(ctx, [rx - 8, p.y, rx + 8, p.y], 'rgba(255,255,255,.9)', 2);
    // The power bar over the beetle while it waits on the mat
    if (g.meter >= 0) {
      const x = p.x - 40, y = p.y - 58;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x - 2, y - 2, 84, 14);
      const grad = ctx.createLinearGradient(x, 0, x + 80, 0); grad.addColorStop(0, '#f0c030'); grad.addColorStop(1, '#3fd06a');
      ctx.fillStyle = grad; ctx.fillRect(x, y, 80 * g.meter, 10);
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 80 * g.meter - 1.5, y - 3, 3, 16);
      ctx.textAlign = 'center'; ctx.fillText('Power', p.x, y - 7);
    }
  },
  goalPoint() { return null; },
  hud(g) {
    const o = g.oly, G = GYM, p = g.player, n = Math.min(G.attempts, g.flips.length + (o.finished ? 0 : 1));
    setHud('Flip ' + n + ' of ' + G.attempts, !p.onGround && !p.recover ? 'Height ' + Math.max(0, Math.round((G.ground - p.y) / G.BL)) + ' body lengths' : o.result ? 'Best: ' + o.result + ' points' : '');
  },
  stars(g) { return OLY.stars(this, g); },
  // The medal and points, and how high the best flip would take a kid about 1.2 m tall
  endLine(g) {
    const m = Math.round(g.bestH * 1.2);
    return OLY.endLine(this, g) + ' Your highest flip was ' + g.bestH + ' body lengths. A kid flipping that high would go ' + m + ' metres up: ' +
      (m >= 24 ? 'as high as an eight-storey building!' : m >= 12 ? 'as high as a four-storey building!' : m >= 6 ? 'over the roof of a house!' : 'higher than a car!');
  },
  won(g) { return g.oly.finished && g.oly.doneT >= 2.4; },
};

Missions.oly_jump.sex = 'You are a female sandhopper.';
Missions.oly_gym.sex = 'You are a click beetle. Males and females both click.';
Missions.oly_sprint.sex = 'You are a male blue skimmer.';
Missions.oly_dig.sex = 'You are a dung beetle. Males and females both dig.';
Missions.oly_lift.sex = 'You are a female worker bull ant.';
Missions.oly_buzz.sex = 'You are a female blue-banded bee.';
finishMissions();
