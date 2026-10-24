'use strict';
// Bug on your hand: the phone's camera is the level. Hold your hand under it and a pretend bug walks about on
// it, comes when you tap, and sits still for a photo. Bugs you have played can be picked from the palette;
// the ladybird and the snail are always there. Without a camera (refused, missing, or a browser that can't)
// a painted hand stands in. The camera is used live on the device only: nothing is recorded or sent anywhere.
// Every fact is sourced in docs/facts.md (Bug on your hand).

Bugs.push({ id: 'hand', name: 'Bug on your hand', sci: 'Hold a bug', place: 'Your hand', sprite: 'handIcon',
  pin: { x: 905, y: 395 }, stages: ['hand'], kind: 'sandbox' });

// The bugs on offer: `needs` names the stage you must have finished first (a star) to hold that bug.
const HAND_BUGS = {
  ladybird: { name: 'Transverse ladybird', label: 'Ladybird', sprite: 'ladybird', scale: 2.6, speed: 50, r: 14, icon: 1.6 },
  snail: { name: 'Native snail', label: 'Snail', sprite: 'snail', scale: 1.6, speed: 14, r: 16, icon: 0.8, o: { size: 1 } },
  butterfly: { name: 'Painted lady', label: 'Butterfly', sprite: 'butterfly', scale: 1.7, speed: 55, r: 18, icon: 0.55, needs: 'butterfly', o: { landed: true } },
  bee: { name: 'Blue-banded bee', label: 'Bee', sprite: 'bee', scale: 1.9, speed: 70, r: 16, icon: 0.7, needs: 'bee', o: { load: 0 } },
  bushFly: { name: 'Bush fly', label: 'Bush fly', sprite: 'bushFly', scale: 2.8, speed: 80, r: 12, icon: 1.3, needs: 'fly', o: { landed: true } },
  spider: { name: 'Peacock spider', label: 'Spider', sprite: 'spider', scale: 1.9, speed: 60, r: 14, icon: 1, needs: 'spider' },
  dragonfly: { name: 'Blue skimmer', label: 'Dragonfly', sprite: 'dragonfly', scale: 1.5, speed: 50, r: 20, icon: 0.5, needs: 'dragonfly', o: { dart: 0 } },
  termiteWorker: { name: 'Termite worker', label: 'Termite', sprite: 'termiteWorker', scale: 2.2, speed: 45, r: 12, icon: 1, needs: 'termite' },
  plCaterpillar: { name: 'Painted lady caterpillar', label: 'Caterpillar', sprite: 'plCaterpillar', scale: 1.7, speed: 20, r: 14, icon: 0.8, needs: 'caterpillar', o: { size: 1, fat: 1 } },
};

Object.assign(Sprites, {
  // A hand with a ladybird on it, for the map pin (fingers toward +x: the portrait turns that to the top)
  handIcon(ctx) {
    const skin = '#d8a070', edge = '#b8805a';
    ell(ctx, -6, 0, 14, 13, skin, 0, 'none');
    for (const [a, len] of [[-0.55, 15], [-0.2, 18], [0.15, 17], [0.5, 14]]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(4, -3, len, 6, 3) : ctx.rect(4, -3, len, 6); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 0.8; ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.rotate(1.3); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(2, -3, 12, 6, 3) : ctx.rect(2, -3, 12, 6); ctx.fillStyle = skin; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 0.8; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(-6, -2); ctx.rotate(-0.6); ctx.scale(1.1, 1.1); Sprites.ladybird(ctx, { moving: false }, 0); ctx.restore();
  },
  cameraIcon(ctx) {
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-14, -9, 28, 20, 4) : ctx.rect(-14, -9, 28, 20); ctx.fill();
    ctx.fillRect(-6, -13, 12, 5);
    ell(ctx, 0, 1, 7, 7, '#5a7a9a', 0, 'none'); ell(ctx, 0, 1, 4, 4, '#1a2a3a', 0, 'none'); plainEll(ctx, -1.5, -0.5, 1.3, 1, '#cfe6ff');
    plainEll(ctx, 9, -5, 1.6, 1.6, '#e8c030');
  },
  flipIcon(ctx) {
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.moveTo(-12, 1); ctx.lineTo(-5, 1); ctx.lineTo(-8.5, 7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -1); ctx.lineTo(5, -1); ctx.lineTo(8.5, -7); ctx.closePath(); ctx.fill();
  },
});

// When there is no camera: a lawn, an open hand held flat, and a gum leaf.
Backgrounds.handFallback = function (ctx, W, H) {
  Ground.lawn(ctx, W, H, 71, {});
  const skin = '#d8a070', edge = 'rgba(150,95,60,.55)', cx = W * 0.52, cy = H * 0.8;
  Ground.contact(ctx, cx + 12, cy + 16, 230, 210, 0.3);
  const finger = (x0, y0, x1, y1, w) => {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = edge; ctx.lineCap = 'round'; ctx.lineWidth = w + 3; ctx.stroke();
    ctx.strokeStyle = skin; ctx.lineWidth = w; ctx.stroke();
  };
  ctx.fillStyle = skin; ctx.fillRect(cx - 120, cy + 60, 240, H - cy);   // the wrist, in from the bottom
  finger(cx - 150, cy - 40, cx - 40, cy - 100, 54);                      // thumb
  for (const [dx, len] of [[-95, 190], [-32, 230], [32, 225], [92, 180]]) finger(cx + dx, cy - 60, cx + dx * 1.15, cy - 60 - len, 56);
  ell(ctx, cx, cy, 160, 140, skin, 0, 'none');
  ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 160, 140, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = skin; ctx.fillRect(cx - 160, cy, 320, 70);
  ctx.strokeStyle = 'rgba(150,95,60,.35)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 120, cy - 20); ctx.quadraticCurveTo(cx - 20, cy + 30, cx + 110, cy - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 130, cy + 30); ctx.quadraticCurveTo(cx - 10, cy + 70, cx + 90, cy + 50); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 60, cy + 120); ctx.quadraticCurveTo(cx - 70, cy + 40, cx - 20, cy - 40); ctx.stroke();
  // a gum leaf on the lawn
  ctx.save(); ctx.translate(W * 0.16, H * 0.22); ctx.rotate(0.7);
  ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-20, -26, 70, -4); ctx.quadraticCurveTo(-20, 22, -70, 0); ctx.closePath();
  ctx.fillStyle = '#7a8a4a'; ctx.fill(); ctx.strokeStyle = '#4a5a2a'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-66, 0); ctx.lineTo(66, -3); ctx.stroke();
  ctx.restore();
};

Missions.hand = {
  id: 'hand', bug: 'hand', stage: 'Hold a bug', place: 'Your hand, through the camera', view: 'camera',
  sprite: 'none', bg: 'handFallback', pointerOnly: true, noNet: true, noSky: true,
  action: '', radius: 1, speed: 0, scale: 1,
  home: { x: -400, y: -400, r: 1, label: '' },
  facts: [
    'Hold your hand flat and still under the camera, and a pretend bug will walk about on it.',
    'Real bugs are delicate. Let them walk on, never squeeze, and put them back where you found them.',
    'The camera is only used while you play. Nothing is recorded or sent anywhere.',
  ],
  how: [
    'Press Start and allow the camera. Hold your hand under it, flat and still.',
    'Tap anywhere to call the bug over. Tap the bug to say hello.',
    'Pick a different bug on the left. Finish a bug’s level to hold that bug.',
    'Press Photo to keep a picture, and Flip to use the other camera.',
  ],
  discoveries: [],
  // The palette is built when the level starts, so bugs finished since then are open
  get tools() {
    const open = (b) => !b.needs || (typeof Progress !== 'undefined' && Progress.stars(b.needs) > 0);
    return [
      { name: 'Bugs', items: Object.entries(HAND_BUGS).map(([id, b]) => ({ id, label: b.label, sprite: b.sprite, iconScale: b.icon, o: Object.assign({}, b.o || {}), locked: !open(b) })) },
      { name: 'Photo', items: [{ id: 'photo', label: 'Photo', sprite: 'cameraIcon', now: true }, { id: 'flip', label: 'Flip camera', sprite: 'flipIcon', now: true }] },
    ];
  },
  factText: {
    start: 'Hold your hand flat and still under the camera. Tap to call the bug over.',
    camera: 'The bug is pretend, so it won’t fly away. A real one would be gone in seconds.',
    gentle: 'Real bugs are delicate. Let them walk onto a flat hand, never squeeze, and put them back where you found them.',
    photo: 'Say cheese! A photo is the kindest way to keep a bug.',
    ladybird: 'A frightened ladybird leaks a yellow drop from its knees. It tastes nasty to birds.',
    snail: 'A snail’s foot feels cool and wet. It glides along on a layer of slime.',
    butterfly: 'A butterfly on your hand may taste your skin with its feet!',
    bee: 'Blue-banded bees are gentle. They can sting, but only if they are squeezed or trapped.',
    bushFly: 'The fly wants the moisture and salt on your skin. That’s why flies land on people.',
    spider: 'A peacock spider is about as long as a grain of rice, and harmless to people.',
    dragonfly: 'Dragonflies can’t sting. A big one might nip a finger, so hold still and let it sit.',
    termiteWorker: 'Termite workers are soft and blind. Out in the open they dry out fast, so they stay in their tunnels.',
    plCaterpillar: 'Painted lady caterpillars are covered in branched spines. They hide by day and feed at night.',
  },

  setup(g) {
    g.live = { stream: null, video: null, ready: false, error: null, facing: 'environment', mirror: false, opening: false };
    g.trail = []; g.taps = 0; g.snapFlash = 0; g.photos = 0; g.hello = 0;
    g.player.flat = true;
    this.setBug(g, 'ladybird');
    g.bug.x = W * 0.5; g.bug.y = H * 0.6;
    this.openCamera(g);
    Game.later(2, () => Game.hint('Tap anywhere to call the bug over!'));
    Game.later(25, () => Game.fact('gentle'));
  },
  teardown(g) {
    const L = g.live;
    Media.stop(L.stream); L.stream = null; L.ready = false;
    if (L.video) { try { L.video.pause(); } catch (e) { /* nothing playing */ } L.video.srcObject = null; }
  },
  // Ask for the camera (the Start tap is the gesture). A refusal shows the note and the painted hand stays.
  async openCamera(g) {
    const L = g.live;
    if (L.opening) return;
    L.opening = true;
    Media.stop(L.stream); L.stream = null; L.ready = false;
    const res = await Media.get({ video: { facingMode: { ideal: L.facing }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    L.opening = false;
    if (Game.g !== g || !Game.running) { Media.stop(res.stream); return; }   // the level was left meanwhile
    if (res.error) { L.error = res.error; Media.note(res.error); Game.fact('camera'); return; }
    L.stream = res.stream; L.error = null;
    const v = L.video || (L.video = document.createElement('video'));
    v.setAttribute('playsinline', ''); v.muted = true; v.autoplay = true;
    v.srcObject = res.stream;
    const track = res.stream.getVideoTracks()[0], st = track && track.getSettings ? track.getSettings() : {};
    L.mirror = st.facingMode ? st.facingMode === 'user' : L.facing === 'user';   // a front camera is shown like a mirror
    try { await v.play(); } catch (e) { /* the frame still draws once data arrives */ }
    L.ready = true;
    Game.fact('camera');
  },
  flip(g) {
    const L = g.live;
    if (L.opening) return;
    L.facing = L.facing === 'user' ? 'environment' : 'user';
    this.openCamera(g);
  },
  liveBg(g) { const L = g.live; return !!(L.ready && L.video && L.video.readyState >= 2); },
  setBug(g, kind) {
    const b = HAND_BUGS[kind], old = g.bug;
    g.bug = Object.assign({ kind, sprite: b.sprite, x: old ? old.x : W / 2, y: old ? old.y : H / 2, r: b.r, angle: old ? old.angle : 0.6, scale: b.scale,
      moving: false, target: null, sitT: 2 + Math.random() * 2, turn: 0, t: 0, flapT: 0, buzzT: 0, sipT: 0, fanT: 0, hop: 0, nextT: 6 + Math.random() * 4,
      paint: typeof Paint !== 'undefined' ? Paint.stamp(kind) : undefined }, b.o || {});   // in your own design, if you painted this bug
    g.items = [g.bug]; g.trail = [];
    if (old) { Game.pop(g.bug.x, g.bug.y - 36, b.name + '!', '#fff'); Sound.play('pick'); }
  },
  onLocked(g, id) {
    const b = HAND_BUGS[id], bug = b && Bugs.find(x => x.stages.includes(b.needs));
    if (bug) { g.hintT = 0; Game.hint('Finish the ' + bug.name + ' level first, then a ' + b.label.toLowerCase() + ' can sit on your hand!'); }   // straight away, not rate limited
  },
  onTool(g, id) {
    if (id === 'photo') this.snap(g);
    else if (id === 'flip') this.flip(g);
  },
  onPointer(g, type, x, y) {
    if (type !== 'down') return;
    const b = g.bug;
    Sound.play('tap');
    if (dist(b, { x, y }) < b.r + 22) {   // hello: the bug turns to face you
      b.target = null; b.turn = Math.atan2(Math.sin(Math.PI / 2 - b.angle), Math.cos(Math.PI / 2 - b.angle)); b.sitT = 4;
      if (b.kind === 'spider') b.hop = 1;
      if (b.kind === 'bee') b.buzzT = 0.6;
      if (b.kind === 'butterfly') b.flapT = 1.5;
      g.hello++;
      Game.pop(b.x, b.y - 36, '♥', '#e8506a');
      Game.fact(b.kind);
      return;
    }
    b.target = { x: clamp(x, 30, W - 30), y: clamp(y, 30, H - 30) };
    g.taps++;
  },
  update(g, dt, input) {
    const b = g.bug;
    if (g.tool && g.tool !== b.kind && HAND_BUGS[g.tool]) this.setBug(g, g.tool);
    const B = HAND_BUGS[b.kind];
    b.t += dt;
    if (b.target) {
      const d = dist(b, b.target);
      if (d < 6) { b.target = null; b.moving = false; b.sitT = 3 + Math.random() * 3; this.arrive(g, b); }
      else {
        const a = Math.atan2(b.target.y - b.y, b.target.x - b.x), step = Math.min(d, B.speed * dt);
        b.angle += Math.atan2(Math.sin(a - b.angle), Math.cos(a - b.angle)) * Math.min(1, dt * 8);
        b.x += Math.cos(a) * step; b.y += Math.sin(a) * step; b.moving = true;
      }
    } else {
      b.moving = false;
      b.sitT -= dt;
      if (b.sitT <= 0) {   // a small turn, or a short wander of its own
        b.sitT = 2 + Math.random() * 4;
        if (Math.random() < 0.6) b.turn = (Math.random() - 0.5) * 1.4;
        else { const a = Math.random() * TAU, r = 40 + Math.random() * 70; b.target = { x: clamp(b.x + Math.cos(a) * r, 40, W - 40), y: clamp(b.y + Math.sin(a) * r, 40, H - 40) }; }
      }
    }
    if (b.turn) { const s = Math.sign(b.turn) * Math.min(Math.abs(b.turn), dt * 2.5); b.angle += s; b.turn -= s; if (Math.abs(b.turn) < 0.01) b.turn = 0; }
    this.flourish(g, b, dt);
    // the snail's slime trail
    if (b.kind === 'snail' && b.moving && (!g.trail.length || dist(g.trail[g.trail.length - 1], b) > 9)) g.trail.push({ x: b.x, y: b.y, t: 0 });
    for (const q of g.trail) q.t += dt;
    g.trail = g.trail.filter(q => q.t < 30);
    g.snapFlash = Math.max(0, g.snapFlash - dt);
    if (!g.live.ready && !g.live.error && g.t > 1.5 && !g.live.opening) Game.fact('camera');   // no camera asked for (unsupported): the painted hand
  },
  // What each bug does on its own: wings, a buzz, a sip, the fan, a munch
  flourish(g, b, dt) {
    b.flapT = Math.max(0, b.flapT - dt); b.buzzT = Math.max(0, b.buzzT - dt); b.sipT = Math.max(0, b.sipT - dt); b.fanT = Math.max(0, b.fanT - dt);
    b.nextT -= dt;
    if (b.nextT <= 0 && !b.moving) {
      b.nextT = 6 + Math.random() * 6;
      if (b.kind === 'butterfly') b.flapT = 1.4;
      else if (b.kind === 'bushFly') b.sipT = 1.2;
      else if (b.kind === 'spider') b.fanT = 1.6;
      else if (b.kind === 'bee') { b.buzzT = 0.5; Sound.play('buzz'); }
    }
    if (b.hop > 0) { b.hop = Math.max(0, b.hop - dt * 3); }
    b.scale = HAND_BUGS[b.kind].scale * (1 + Math.sin(b.hop * Math.PI) * 0.4);
    if (b.kind === 'butterfly') b.landed = b.flapT <= 0;
    if (b.kind === 'bushFly') { b.landed = !b.moving; b.sip = b.sipT > 0; }
    if (b.kind === 'bee') b.buzz = b.buzzT > 0;
    if (b.kind === 'spider') { b.fan = b.fanT > 0 ? 1 : 0; b.dance = 0; }
    if (b.kind === 'plCaterpillar') b.munch = !b.moving && (b.t % 5) < 2;
  },
  arrive(g, b) {
    if (b.kind === 'bee') { b.buzzT = 0.6; Sound.play('buzz'); }
    if (b.kind === 'butterfly') b.flapT = 1.2;
    if (b.kind === 'bushFly') b.sipT = 1;
    if (g.taps > 0) Game.fact(b.kind);
  },
  // A photo: the frame and the bug, no HUD. Shared on a phone, saved as a file elsewhere.
  snap(g, quiet) {
    const c = document.createElement('canvas'), k = 2;
    c.width = W * k; c.height = H * k;
    const octx = c.getContext('2d');
    octx.setTransform(k, 0, 0, k, 0, 0);
    const main = Game.ctx;
    Game.ctx = octx;
    try { this.render(octx, g, true); } finally { Game.ctx = main; }
    g.snapFlash = 0.3; g.photos++;
    Sound.play('tap'); Game.pop(g.bug.x, g.bug.y - 40, 'Snap!', '#fff');
    Game.fact('photo');
    if (!g.photoSecret) { g.photoSecret = true; Game.foundSecret('s_photo', 'You found a secret: a photo of a bug on your hand! Show someone.'); }
    const url = c.toDataURL('image/png');
    if (!quiet) this.share(c, url);
    return url;
  },
  share(c, url) {
    const done = (blob) => {
      const file = blob && typeof File !== 'undefined' ? new File([blob], 'bug-on-my-hand.png', { type: 'image/png' }) : null;
      if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Bug on my hand' }).catch(() => {}); return; }
      const a = document.createElement('a'); a.href = url; a.download = 'bug-on-my-hand.png'; document.body.appendChild(a); a.click(); a.remove();
    };
    if (c.toBlob) c.toBlob(done, 'image/png'); else done(null);
  },
  render(ctx, g, still) {
    const L = g.live;
    if (this.liveBg(g)) {
      const v = L.video, vw = v.videoWidth || 16, vh = v.videoHeight || 9, s = Math.max(W / vw, H / vh), dw = vw * s, dh = vh * s;
      ctx.save();
      if (L.mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.restore();
    }
    Game.drawWorld(ctx);
    if (!still && g.snapFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(1, g.snapFlash * 3) + ')'; ctx.fillRect(0, 0, W, H); }
  },
  drawBuild(ctx, g) {
    for (const q of g.trail) { ctx.globalAlpha = 0.35 * (1 - q.t / 30); ell(ctx, q.x, q.y, 7, 5, '#e8f4ff', 0, 'none'); }
    ctx.globalAlpha = 1;
  },
  hud(g) {
    const L = g.live;
    setHud(HAND_BUGS[g.bug.kind].name, this.liveBg(g) ? '' : L.error ? 'No camera: a painted hand' : L.opening || !L.ready ? 'Starting the camera…' : '');
  },
  won() { return false; },   // nothing to win: a sandbox
};
finishMissions();
