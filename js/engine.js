'use strict';
// Shared game engine: loop, input, movement, predators, facts.

const W = 960, H = 600;          // screen (view) size
const World = { w: W, h: H };    // size of the current mission's world, set in Game.start

// Settings remembered between visits.
const Settings = {
  sound: true, speech: false,
  load() {
    try { Object.assign(this, JSON.parse(localStorage.getItem('bugame.settings') || '{}')); } catch (e) { /* storage off */ }
  },
  save() {
    try { localStorage.setItem('bugame.settings', JSON.stringify({ sound: this.sound, speech: this.speech })); } catch (e) { /* storage off */ }
  },
};
Settings.load();

// Small synthesised sound effects, no audio files.
const Sound = {
  ac: null,
  tone(freq, dur, type, vol, slideTo, delay) {
    if (!Settings.sound) return;
    try {
      if (!this.ac) this.ac = new (window.AudioContext || window.webkitAudioContext)();
      const ac = this.ac, t0 = ac.currentTime + (delay || 0);
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(vol || 0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g).connect(ac.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (e) { /* audio unavailable */ }
  },
  play(name) {
    switch (name) {
      case 'pick': this.tone(660, 0.12, 'triangle', 0.15, 990); break;
      case 'score': this.tone(523, 0.12, 'triangle', 0.15); this.tone(784, 0.18, 'triangle', 0.15, 0, 0.1); break;
      case 'jump': this.tone(300, 0.2, 'sine', 0.15, 900); break;
      case 'dart': this.tone(200, 0.3, 'sawtooth', 0.06, 600); break;
      case 'buzz': this.tone(180, 0.12, 'sawtooth', 0.05, 200); break;
      case 'sting': this.tone(900, 0.08, 'square', 0.06, 400); break;
      case 'caught': this.tone(400, 0.5, 'square', 0.08, 100); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.15, 0, i * 0.12)); break;
      case 'tap': this.tone(500, 0.06, 'sine', 0.1); break;
    }
  },
};

// Read text aloud for kids who can't read yet.
const Speech = {
  say(text, force) {
    if (!(Settings.speech || force) || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
      const voices = speechSynthesis.getVoices();
      const v = voices.find(v => v.lang === 'en-AU') || voices.find(v => v.lang && v.lang.startsWith('en'));
      if (v) u.voice = v;
      u.lang = 'en-AU';
      u.rate = 0.92;
      speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable */ }
  },
  stop() { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { /* ignore */ } },
};

const Input = {
  keys: new Set(),
  target: null,      // pointer position the player moves toward
  pressed: false,    // action pressed this frame
  held: false,       // action held
};

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function touching(a, b, pad) { return dist(a, b) < a.r + b.r + (pad || 0); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function nearest(list, p, maxD) {
  let best = null, bd = maxD;
  for (const e of list) { const d = dist(e, p); if (d < bd) { bd = d; best = e; } }
  return best;
}

// Random walk that bounces off the edges.
function wander(e, dt, speed) {
  e.wt = (e.wt || 0) - dt;
  if (e.wt <= 0 || e.dir === undefined) { e.dir = Math.random() * TAU; e.wt = 0.8 + Math.random() * 2; }
  e.x += Math.cos(e.dir) * speed * dt;
  e.y += Math.sin(e.dir) * speed * dt;
  if (e.x < 30 || e.x > World.w - 30) { e.dir = Math.PI - e.dir; e.x = clamp(e.x, 30, World.w - 30); }
  if (e.y < 30 || e.y > World.h - 30) { e.dir = -e.dir; e.y = clamp(e.y, 30, World.h - 30); }
  e.angle = e.dir;
  e.moving = true;
}

const Game = {
  canvas: null, ctx: null, bg: null,
  g: null,          // current game state
  running: false,
  onEnd: null,      // callback(won, game)
  onFact: null,     // callback(missionId, key) when a fact is found

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInput();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      requestAnimationFrame(loop);   // first, so one bad frame can never stop the game for good
      if (this.running) {
        try {
          // Tests can fast-forward (timeScale) and drive a bot every tick (testHook). Normal play: one tick.
          const n = this.timeScale || 1;
          for (let i = 0; i < n && this.running; i++) {
            if (this.testHook) this.testHook(dt);
            this.update(dt);
            Input.pressed = false;
          }
          if (this.running) this.draw();
        } catch (e) {
          // Something broke in this level: leave it cleanly so the rest of the game still works.
          console.error(e);
          this.running = false;
          if (this.onCrash) this.onCrash(e);
        }
      }
      Input.pressed = false;
    };
    requestAnimationFrame(loop);
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.dpr = dpr;
    if (this.g) { this.updateZoom(); this.updateCamera(); }
  },

  bindInput() {
    const actionKeys = [' ', 'Enter'];
    window.addEventListener('keydown', (e) => {
      if (!this.running) return;
      if (actionKeys.includes(e.key)) {
        if (!Input.held) Input.pressed = true;
        Input.held = true;
        e.preventDefault();
      } else {
        Input.keys.add(e.key.toLowerCase());
        if (e.key.startsWith('Arrow')) e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (actionKeys.includes(e.key)) Input.held = false;
      Input.keys.delete(e.key.toLowerCase());
    });
    const toWorld = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    };
    let down = false;
    // Building levels (garden, web, nest) get taps and drags in world coordinates through mission.onPointer.
    const tell = (type, e) => {
      const g = this.g, m = g && g.mission;
      if (!this.running || !m || !m.onPointer || g.event || g.night) return false;
      const s = toWorld(e), z = this.zoom || 1;
      m.onPointer(g, type, s.x / z + g.cam.x, s.y / z + g.cam.y);
      return !!m.pointerOnly;
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      down = true; this.canvas.setPointerCapture(e.pointerId);
      if (!tell('down', e)) Input.target = toWorld(e);
    });
    this.canvas.addEventListener('pointermove', (e) => { if (down && !tell('move', e)) Input.target = toWorld(e); });
    const up = (e) => { if (down) tell('up', e); down = false; Input.target = null; };
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);

    const btn = document.getElementById('actionBtn');
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); Input.pressed = true; Input.held = true; });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, () => { Input.held = false; });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  start(mission) {
    if (this.g && this.g.mission.teardown) this.g.mission.teardown(this.g);
    World.w = mission.world ? mission.world.w : W;
    World.h = mission.world ? mission.world.h : H;
    const home = Object.assign({}, mission.home);
    const g = {
      mission, home, t: 0, score: 0, lives: 3, done: false,
      player: { x: home.x, y: home.y, r: mission.radius, angle: -0.6, speed: mission.speed, invuln: 0, moving: false },
      items: [], preds: [], fx: [], timers: [], cam: { x: 0, y: 0 },
      predCfg: null, predT: 0,
      seen: new Set(), learned: [], toasts: [], toastT: 0, hintT: 0,
      netT: 15 + Math.random() * 20, event: null, parts: [], shake: 0, flash: 0,   // the kid-with-a-net event (js/tank.js)
    };
    g.finds = (mission.discoveries || []).map(d => Object.assign({ found: false, angle: 0 }, d,
      { x: d.fx * World.w, y: d.fy * World.h }));
    this.g = g;
    if (typeof SpriteCache !== 'undefined') SpriteCache.clear();
    if (typeof Tex !== 'undefined') Tex.ready();
    mission.setup(g);
    if (typeof Tools !== 'undefined') Tools.build(mission, g);
    if (this.setupSecret) this.setupSecret();
    this.updateZoom();
    this.updateCamera();
    this.bg = document.createElement('canvas');
    // Painted at a higher resolution so it stays sharp when zoomed in.
    const k = Math.min(1.8, Math.sqrt(8e6 / (World.w * World.h)), (this.zoom || 1) * (window.devicePixelRatio || 1));
    this.bg.width = Math.round(World.w * k); this.bg.height = Math.round(World.h * k);
    const bctx = this.bg.getContext('2d');
    bctx.scale(k, k);
    Backgrounds[mission.bg || mission.id](bctx, World.w, World.h, home);
    Input.keys.clear(); Input.target = null; Input.held = false; Input.pressed = false;
    const btn = document.getElementById('actionBtn');
    btn.textContent = mission.action;
    btn.classList.remove('ready');
    this.showToast(null);
    this.running = true;
    this.fact('start');
  },

  stop() {
    this.running = false; this.showToast(null); Speech.stop();
    if (typeof Tools !== 'undefined') Tools.hide();
    if (this.g && this.g.mission.teardown) this.g.mission.teardown(this.g);
  },

  // Show a bug fact (from mission.factText) once per game.
  fact(key) {
    const g = this.g, text = g.mission.factText[key];
    if (!text || g.seen.has(key)) return;
    g.seen.add(key);
    g.learned.push(text);
    // Don't let facts pile up on screen: keep at most 3 waiting (all still go in the Bug Book).
    const waiting = g.toasts.filter(t => t.kind === 'fact');
    if (waiting.length >= 3) g.toasts.splice(g.toasts.indexOf(waiting[0]), 1);
    g.toasts.push({ text, kind: 'fact' });
    if (this.onFact) this.onFact(g.mission.id, key);
  },

  // Short how-to-play reminder, rate limited.
  hint(text) {
    const g = this.g;
    if (g.hintT > 0) return;
    g.hintT = 7;
    g.toasts = g.toasts.filter(t => t.kind !== 'hint');   // only the latest hint matters
    g.toasts.push({ text, kind: 'hint' });
  },

  later(sec, fn) { this.g.timers.push({ t: sec, fn }); },

  inHome() { const g = this.g; return dist(g.player, g.home) < g.home.r; },

  spawnPoint(minFromHome, near, radius) {
    const g = this.g;
    for (let i = 0; i < 60; i++) {
      const p = near
        ? { x: clamp(near.x + (Math.random() * 2 - 1) * radius, 50, World.w - 50), y: clamp(near.y + (Math.random() * 2 - 1) * radius, 50, World.h - 50) }
        : { x: 50 + Math.random() * (World.w - 100), y: 50 + Math.random() * (World.h - 100) };
      if (dist(p, g.home) > (minFromHome || 140) && dist(p, g.player) > 90) return p;
    }
    return { x: World.w / 2, y: World.h / 2 };
  },

  // Predators don't live in the world: one visits now and then, stays a while, then leaves.
  addPred(cfg) {
    const g = this.g;
    g.predCfg = cfg;
    g.predT = 20 + Math.random() * 15;
  },

  predArrive() {
    const g = this.g, cfg = g.predCfg, p = g.player;
    // Enter from just outside the view, on the side away from home.
    const a = Math.atan2(p.y - g.home.y, p.x - g.home.x) + (Math.random() - 0.5) * 1.5;
    const x = clamp(p.x + Math.cos(a) * (W * 0.6), 40, World.w - 40);
    const y = clamp(p.y + Math.sin(a) * (H * 0.6), 40, World.h - 40);
    g.preds.push(Object.assign({ x, y, angle: a + Math.PI, state: 'wander', timer: 0, stay: 22, moving: true }, cfg));
    g.toasts.unshift({ text: 'Look out! ' + (/^[aeiou]/i.test(cfg.name) ? 'An ' : 'A ') + cfg.name + ' is coming past. Keep clear, or hide at home.', kind: 'hint' });
    g.toastT = 0;
    Sound.play('caught');
  },

  // Small screens (phones) see a zoomed-in part of the world so bugs aren't tiny.
  updateZoom() {
    const w = this.canvas.getBoundingClientRect().width;
    this.zoom = World.w > W ? (w > 0 && w < 700 ? 1.6 : 1.3) : 1;
  },

  updateCamera() {
    const g = this.g, p = g.player, z = this.zoom || 1;
    const vw = W / z, vh = H / z;
    g.cam.x = clamp(p.x - vw / 2, 0, Math.max(0, World.w - vw));
    g.cam.y = clamp(p.y - vh / 2, 0, Math.max(0, World.h - vh));
  },

  // Discoveries: hidden things to find while exploring. Each one is a fact for the Bug Book.
  updateFinds() {
    const g = this.g;
    for (const d of g.finds) {
      if (!d.found && dist(d, g.player) < 45) {
        d.found = true;
        Sound.play('score');
        this.pop(d.x, d.y - 24, 'Discovery!', '#ffd23f');
        this.fact(d.key);
      }
    }
    const el = document.getElementById('hudFind');
    if (el) el.textContent = g.finds.length ? '\u{1F50D} ' + g.finds.filter(d => d.found).length + ' / ' + g.finds.length : '';
  },

  update(dt) {
    const g = this.g, p = g.player, m = g.mission;
    g.t += dt;
    if (g.night) return;   // night has fallen: everyone is asleep (js/night.js)

    for (const tm of g.timers) { tm.t -= dt; if (tm.t <= 0) tm.fn(); }
    g.timers = g.timers.filter(tm => tm.t > 0);

    if (g.celebrate > 0) { this.celebrateTick(dt); return; }
    g.shake = Math.max(0, g.shake - dt);
    g.flash = Math.max(0, g.flash - dt);
    this.tickParts(dt);

    // A kid with a net: while caught, the tank takes over and the world waits.
    if (this.netCheck) this.netCheck(dt);
    if (g.event) {
      this.updateEvent(dt);
      this.updateToasts(dt);
      return;
    }

    // Player movement
    let dx = 0, dy = 0;
    const k = Input.keys;
    if (k.has('arrowleft') || k.has('a')) dx -= 1;
    if (k.has('arrowright') || k.has('d')) dx += 1;
    if (k.has('arrowup') || k.has('w')) dy -= 1;
    if (k.has('arrowdown') || k.has('s')) dy += 1;
    if (!dx && !dy && Input.target) {
      // Pointer is in screen space; the world scrolls under it.
      const z = this.zoom || 1;
      const tx = Input.target.x / z + g.cam.x - p.x, ty = Input.target.y / z + g.cam.y - p.y, d = Math.hypot(tx, ty);
      if (d > 8) { dx = tx / d; dy = ty / d; }
    }
    p.moving = false;
    if (m.move) m.move(g, dt, (m.locked && m.locked(g)) ? 0 : dx, (m.locked && m.locked(g)) ? 0 : dy);   // side-on and other custom movement
    else if ((dx || dy) && !(m.locked && m.locked(g))) {
      const len = Math.hypot(dx, dy);
      p.x = clamp(p.x + dx / len * p.speed * dt, 20, World.w - 20);
      p.y = clamp(p.y + dy / len * p.speed * dt, 20, World.h - 20);
      p.angle = Math.atan2(dy, dx);
      p.moving = true;
    }
    p.invuln = Math.max(0, p.invuln - dt);
    // How long you've stayed put without pressing anything (for gentle hints that don't nag tappers).
    p.stillT = p.moving || Input.pressed || Input.held ? 0 : (p.stillT || 0) + dt;

    p.progress = 0;   // missions set this while an action is under way (drawn as a ring)
    m.update(g, dt, Input);
    this.updateCamera();
    this.updateFinds();
    if (this.checkSecret) this.checkSecret(dt);

    if (g.predCfg && !g.preds.length && !g.frozen) {
      g.predT -= dt;
      if (g.predT <= 0) this.predArrive();
    }
    for (const pr of g.preds) this.updatePred(pr, dt);
    if (g.preds.some(pr => pr.gone)) {
      g.preds = g.preds.filter(pr => !pr.gone);
      g.predT = 50 + Math.random() * 40;
    }

    for (const f of g.fx) f.life -= dt;
    g.fx = g.fx.filter(f => f.life > 0);

    this.updateToasts(dt);

    m.hud(g);
    document.getElementById('hudLives').textContent = '♥'.repeat(g.lives) + '♡'.repeat(3 - g.lives);

    if (!g.done && m.won(g)) this.finish(true);
  },

  updatePred(pr, dt) {
    const g = this.g, p = g.player;
    if (g.frozen) return;
    if (pr.update) { pr.update(pr, dt); return; }   // a mission's own predator
    const safe = this.inHome() || p.invuln > 0;
    const d = dist(pr, p);
    pr.timer -= dt;
    pr.stay -= dt;
    if (pr.stay <= 0 && pr.state !== 'chase' && pr.state !== 'leave') pr.state = 'leave';
    if (pr.state === 'leave') {
      // Head for the nearest edge of the world and disappear.
      if (pr.exitA === undefined) {
        const ex = [[-1, 0, pr.x], [1, 0, World.w - pr.x], [0, -1, pr.y], [0, 1, World.h - pr.y]].sort((a, b) => a[2] - b[2])[0];
        pr.exitA = Math.atan2(ex[1], ex[0]);
      }
      pr.angle = pr.exitA;
      pr.moving = true;
      pr.x += Math.cos(pr.exitA) * pr.wanderSpeed * 2 * dt;
      pr.y += Math.sin(pr.exitA) * pr.wanderSpeed * 2 * dt;
      if (pr.x < -60 || pr.y < -60 || pr.x > World.w + 60 || pr.y > World.h + 60) pr.gone = true;
      return;
    }
    if (pr.state === 'chase') {
      const a = Math.atan2(p.y - pr.y, p.x - pr.x);
      pr.angle = a;
      pr.x += Math.cos(a) * pr.chaseSpeed * dt;
      pr.y += Math.sin(a) * pr.chaseSpeed * dt;
      if (safe || pr.timer <= 0 || d > pr.sight * 1.7) { pr.state = 'rest'; pr.timer = pr.restTime; }
    } else if (pr.state === 'alert') {
      // Short warning pause before a chase so players can react.
      pr.angle = Math.atan2(p.y - pr.y, p.x - pr.x);
      pr.moving = false;
      if (safe) { pr.state = 'wander'; }
      else if (pr.timer <= 0) { pr.state = 'chase'; pr.timer = pr.chaseTime; }
    } else {
      // Wander around the player's part of the world rather than the whole map.
      if (dist(pr, p) > 450) pr.dir = Math.atan2(p.y - pr.y, p.x - pr.x);
      wander(pr, dt, pr.state === 'rest' ? pr.wanderSpeed * 0.6 : pr.wanderSpeed);
      if (pr.state === 'rest' && pr.timer <= 0) pr.state = 'wander';
      if (pr.state === 'wander' && !safe && d < pr.sight) {
        pr.state = 'alert';
        pr.timer = 0.7;
        this.fact(pr.sprite);
      }
    }
    // Predators never enter the safe home, and don't hang about near it unless chasing.
    const hd = dist(pr, g.home), minD = g.home.r + pr.r + (pr.state === 'chase' ? 0 : 70);
    if (hd < minD) {
      const a = Math.atan2(pr.y - g.home.y, pr.x - g.home.x);
      pr.x = g.home.x + Math.cos(a) * minD;
      pr.y = g.home.y + Math.sin(a) * minD;
    }
    if (!safe && d < pr.r * 0.75 + p.r) this.caught(pr);
  },

  caught(pr) {
    const g = this.g, p = g.player;
    g.lives--;
    // First stages are gentle: you can't run out of hearts.
    // Also after the goal is done: exploring on can't end in a loss.
    if (g.lives <= 0 && (g.mission.gentle || g.done)) g.lives = 1;
    Sound.play('caught');
    g.shake = 0.4; g.flash = 0.4;
    if (g.mission.onCaught) g.mission.onCaught(g);
    g.toasts.unshift({ text: 'Caught by the ' + pr.name + '! Back home you go.', kind: 'hint' });
    g.toastT = 0;
    if (g.lives <= 0) { this.finish(false); return; }
    p.x = g.home.x; p.y = g.home.y;
    p.invuln = 3;
    pr.state = 'leave';   // a predator that caught you moves on
  },

  finish(won) {
    const g = this.g;
    g.done = true;
    if (won) {
      // Celebrate for a moment in the world before the end screen.
      Sound.play('win');
      this.fact('win');
      g.celebrate = 1.8;
      g.confetti = [];
      const cols = ['#ffd23f', '#c8501e', '#2f7d5b', '#4fc3f7', '#f2a8c0', '#fff'];
      for (let i = 0; i < 90; i++) {
        g.confetti.push({ x: Math.random() * W, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 80,
          vy: 120 + Math.random() * 160, a: Math.random() * TAU, va: (Math.random() - 0.5) * 10, c: cols[i % cols.length] });
      }
      g.toasts = [];
      this.showToast({ text: 'You did it!', kind: 'hint' });
      return;
    }
    this.running = false;
    this.showToast(null);
    setTimeout(() => this.onEnd && this.onEnd(won, g), 900);
  },

  celebrateTick(dt) {
    const g = this.g;
    g.celebrate -= dt;
    for (const c of g.confetti) { c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt; }
    this.tickParts(dt);
    if (g.celebrate <= 0) {
      g.celebrate = 0;
      this.running = false;
      this.showToast(null);
      if (this.onEnd) this.onEnd(true, g);
    }
  },

  // Little sparkle bursts for rewards.
  burst(x, y, color, n) {
    const g = this.g;
    for (let i = 0; i < (n || 10); i++) {
      const a = Math.random() * TAU, sp = 60 + Math.random() * 120;
      g.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6 + Math.random() * 0.3, c: color || '#ffd23f' });
    }
  },

  tickParts(dt) {
    const g = this.g;
    for (const q of g.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.92; q.vy *= 0.92; q.life -= dt; }
    g.parts = g.parts.filter(q => q.life > 0);
  },

  // Carry on exploring after finishing the mission goal.
  resume() {
    Input.keys.clear(); Input.target = null; Input.held = false; Input.pressed = false;
    this.g.frozen = false;
    this.running = true;
  },

  showToast(tst) {
    const el = document.getElementById('toast');
    if (!tst) { el.className = ''; return; }
    el.className = 'show' + (tst.kind === 'hint' ? ' hint' : tst.kind === 'secret' ? ' secret' : '');
    el.innerHTML = (tst.kind === 'fact' ? '<b>Bug fact:</b> ' : tst.kind === 'secret' ? '<b>Secret!</b> ' : '') + tst.text;
    Speech.say(tst.text);
  },

  drawSprite(name, e, scale) {
    const ctx = this.ctx;
    if (e.r && !e.flat && typeof softShadow === 'function') {
      const k = (scale || 1) / 1.7;
      softShadow(ctx, e.x + 3, e.y + 6, e.r * 1.5 * Math.max(1, k), e.r * 1.0 * Math.max(1, k), 0.26);
    }
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle || 0);
    // Pre-rendered where possible (sprite-cache.js); otherwise drawn live
    const px = (this.dpr || 1) * (this.zoom || 1) * (scale || 1);
    if (!(typeof SpriteCache !== 'undefined' && SpriteCache.enabled && SpriteCache.draw(ctx, name, e, this.g.t, scale || 1, px))) {
      ctx.scale(scale || 1, scale || 1);
      Sprites[name](ctx, e, this.g.t);
    }
    ctx.restore();
  },

  updateToasts(dt) {
    const g = this.g;
    g.hintT = Math.max(0, g.hintT - dt);
    g.toastT -= dt;
    if (g.toastT <= 0) {
      const next = g.toasts.shift();
      this.showToast(next || null);
      g.toastT = next ? (next.kind === 'fact' ? 4.5 : 3.2) : 0.3;
    }
  },

  draw() {
    const ctx = this.ctx, g = this.g;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (g.event && g.event.phase === 'tank') { this.drawTank(ctx); return; }
    if (g.mission.render) {   // a mission with its own renderer (the 3D flight)
      g.mission.render(ctx, g);
      if (typeof Night !== 'undefined') Night.drawSky(ctx);
      return;
    }
    this.drawWorld(ctx);
    if (g.event) this.drawSwoop(ctx);
    if (typeof Night !== 'undefined') Night.drawSky(ctx);
  },

  drawWorld(ctx) {
    const g = this.g, m = g.mission, p = g.player;
    ctx.save();
    const sh = g.shake > 0 ? g.shake * 18 : 0;
    const z = this.zoom || 1;
    ctx.scale(z, z);
    ctx.translate(-Math.round(g.cam.x) + (Math.random() - 0.5) * sh, -Math.round(g.cam.y) + (Math.random() - 0.5) * sh);
    ctx.drawImage(this.bg, 0, 0, World.w, World.h);

    // Home marker
    ctx.beginPath();
    ctx.arc(g.home.x, g.home.y, g.home.r, 0, TAU);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(43,33,24,.75)';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.home.label, g.home.x, g.home.y + g.home.r + 16);

    if (m.drawBuild) m.drawBuild(ctx, g);
    if (this.drawSecret) this.drawSecret(ctx);
    for (const d of g.finds) {
      this.drawSprite(d.sprite, d, d.scale || 1.4);
      if (!d.found) {
        const s = 0.5 + Math.sin(g.t * 4 + d.x) * 0.5;
        ctx.fillStyle = 'rgba(255,240,150,' + (0.4 + s * 0.5) + ')';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('\u2726', d.x + 18, d.y - 16 - s * 4);
      }
    }
    for (const it of g.items) this.drawSprite(it.sprite, it, it.scale);
    if (m.drawExtra) m.drawExtra(ctx, g);

    // Guide arrow to the current goal
    const goal = m.goalPoint && m.goalPoint(g);
    if (goal && dist(goal, p) > 80) {
      const a = Math.atan2(goal.y - p.y, goal.x - p.x);
      ctx.save();
      ctx.translate(p.x + Math.cos(a) * 42, p.y + Math.sin(a) * 42);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.closePath();
      ctx.fillStyle = 'rgba(255,210,63,' + (0.6 + Math.sin(g.t * 6) * 0.3) + ')';
      ctx.fill();
      ctx.restore();
    }

    // Progress ring for munching, chewing, sipping, laying...
    if (p.progress > 0.01) {
      const rr = p.r + 16;
      ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, TAU);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6; ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, rr, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, p.progress));
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
    }
    if (p.invuln > 0 && Math.floor(g.t * 10) % 2) ctx.globalAlpha = 0.4;
    this.drawSprite(m.playerSprite ? m.playerSprite(g) : (m.sprite || m.id), p, m.scale * (1 + (p.hop || 0) * 0.5));
    if (this.drawHat) this.drawHat(ctx);
    ctx.globalAlpha = 1;

    for (const pr of g.preds) {
      // Shadow first so flyers look airborne.
      if (!pr.ground) {
        ctx.fillStyle = 'rgba(0,0,0,.15)';
        ctx.beginPath();
        ctx.ellipse(pr.x + 10, pr.y + 14, pr.r, pr.r * 0.6, 0, 0, TAU);
        ctx.fill();
      }
      this.drawSprite(pr.sprite, pr, pr.scale);
      if (pr.state === 'chase' || pr.state === 'alert') {
        ctx.fillStyle = '#c0392b';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('!', pr.x, pr.y - pr.r - 8);
      }
    }

    for (const q of g.parts) {
      ctx.globalAlpha = Math.min(1, q.life * 2);
      ell(ctx, q.x, q.y, 3, 3, q.c);
    }
    ctx.globalAlpha = 1;
    for (const f of g.fx) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillStyle = f.color || '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(f.text, f.x, f.y - (1 - f.life) * 30);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (g.flash > 0) { ctx.fillStyle = 'rgba(200,40,30,' + g.flash * 0.6 + ')'; ctx.fillRect(0, 0, W, H); }
    if (g.celebrate > 0) {
      for (const c of g.confetti) {
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
        ctx.fillStyle = c.c; ctx.fillRect(-5, -3, 10, 6);
        ctx.restore();
      }
    }
    if (World.w > W || World.h > H) this.drawMiniMap(ctx);
  },

  drawMiniMap(ctx) {
    const g = this.g, mw = 150, mh = mw * World.h / World.w, x0 = W - mw - 12, y0 = 52;
    const sx = mw / World.w, sy = mh / World.h;
    ctx.fillStyle = 'rgba(255,250,240,.75)';
    ctx.fillRect(x0 - 3, y0 - 3, mw + 6, mh + 6);
    ctx.drawImage(this.bg, 0, 0, this.bg.width, this.bg.height, x0, y0, mw, mh);
    ctx.strokeStyle = 'rgba(43,33,24,.8)';
    ctx.lineWidth = 1.5;
    const z = this.zoom || 1;
    ctx.strokeRect(x0 + g.cam.x * sx, y0 + g.cam.y * sy, W / z * sx, H / z * sy);
    const dot = (e, c, r) => { ctx.beginPath(); ctx.arc(x0 + e.x * sx, y0 + e.y * sy, r, 0, TAU); ctx.fillStyle = c; ctx.fill(); };
    dot(g.home, '#fff', 4);
    for (const d of g.finds) if (d.found) dot(d, '#2f7d5b', 2.5);
    const goal = g.mission.goalPoint && g.mission.goalPoint(g);
    if (goal) dot(goal, '#ffd23f', 3.5);
    for (const pr of g.preds) dot(pr, '#c0392b', 4);
    dot(g.player, '#c8501e', 3.5);
  },

  pop(x, y, text, color) { this.g.fx.push({ x, y, text, color, life: 1 }); this.burst(x, y + 16, color); },
};
