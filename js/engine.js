'use strict';
// Shared game engine: loop, input, movement, predators, facts.

const W = 960, H = 600;

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
  if (e.x < 30 || e.x > W - 30) { e.dir = Math.PI - e.dir; e.x = clamp(e.x, 30, W - 30); }
  if (e.y < 50 || e.y > H - 30) { e.dir = -e.dir; e.y = clamp(e.y, 50, H - 30); }
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
      if (this.running) { this.update(dt); this.draw(); }
      Input.pressed = false;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    this.dpr = dpr;
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
    this.canvas.addEventListener('pointerdown', (e) => { down = true; Input.target = toWorld(e); this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', (e) => { if (down) Input.target = toWorld(e); });
    const up = () => { down = false; Input.target = null; };
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);

    const btn = document.getElementById('actionBtn');
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); Input.pressed = true; Input.held = true; });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, () => { Input.held = false; });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  start(mission) {
    const home = Object.assign({}, mission.home);
    const g = {
      mission, home, t: 0, score: 0, lives: 3, done: false,
      player: { x: home.x, y: home.y, r: mission.radius, angle: -0.6, speed: mission.speed, invuln: 0, moving: false },
      items: [], preds: [], fx: [], timers: [],
      seen: new Set(), learned: [], toasts: [], toastT: 0, hintT: 0,
    };
    this.g = g;
    mission.setup(g);
    this.bg = document.createElement('canvas');
    this.bg.width = W; this.bg.height = H;
    Backgrounds[mission.bg || mission.id](this.bg.getContext('2d'), W, H, home);
    Input.keys.clear(); Input.target = null; Input.held = false; Input.pressed = false;
    const btn = document.getElementById('actionBtn');
    btn.textContent = mission.action;
    btn.classList.remove('ready');
    this.showToast(null);
    this.running = true;
    this.fact('start');
  },

  stop() { this.running = false; this.showToast(null); Speech.stop(); },

  // Show a bug fact (from mission.factText) once per game.
  fact(key) {
    const g = this.g, text = g.mission.factText[key];
    if (!text || g.seen.has(key)) return;
    g.seen.add(key);
    g.learned.push(text);
    g.toasts.push({ text, kind: 'fact' });
    if (this.onFact) this.onFact(g.mission.id, key);
  },

  // Short how-to-play reminder, rate limited.
  hint(text) {
    const g = this.g;
    if (g.hintT > 0) return;
    g.hintT = 7;
    g.toasts.push({ text, kind: 'hint' });
  },

  later(sec, fn) { this.g.timers.push({ t: sec, fn }); },

  inHome() { const g = this.g; return dist(g.player, g.home) < g.home.r; },

  spawnPoint(minFromHome) {
    const g = this.g;
    for (let i = 0; i < 50; i++) {
      const p = { x: 50 + Math.random() * (W - 100), y: 70 + Math.random() * (H - 110) };
      if (dist(p, g.home) > (minFromHome || 140) && dist(p, g.player) > 90) return p;
    }
    return { x: W / 2, y: H / 2 };
  },

  addPred(cfg) {
    const p = this.spawnPoint(300);
    this.g.preds.push(Object.assign({ x: p.x, y: p.y, angle: 0, state: 'rest', timer: 3, moving: true }, cfg));
  },

  update(dt) {
    const g = this.g, p = g.player, m = g.mission;
    g.t += dt;

    for (const tm of g.timers) { tm.t -= dt; if (tm.t <= 0) tm.fn(); }
    g.timers = g.timers.filter(tm => tm.t > 0);

    // Player movement
    let dx = 0, dy = 0;
    const k = Input.keys;
    if (k.has('arrowleft') || k.has('a')) dx -= 1;
    if (k.has('arrowright') || k.has('d')) dx += 1;
    if (k.has('arrowup') || k.has('w')) dy -= 1;
    if (k.has('arrowdown') || k.has('s')) dy += 1;
    if (!dx && !dy && Input.target) {
      const tx = Input.target.x - p.x, ty = Input.target.y - p.y, d = Math.hypot(tx, ty);
      if (d > 8) { dx = tx / d; dy = ty / d; }
    }
    p.moving = false;
    if ((dx || dy) && !(m.locked && m.locked(g))) {
      const len = Math.hypot(dx, dy);
      p.x = clamp(p.x + dx / len * p.speed * dt, 20, W - 20);
      p.y = clamp(p.y + dy / len * p.speed * dt, 20, H - 20);
      p.angle = Math.atan2(dy, dx);
      p.moving = true;
    }
    p.invuln = Math.max(0, p.invuln - dt);

    m.update(g, dt, Input);

    for (const pr of g.preds) this.updatePred(pr, dt);

    for (const f of g.fx) f.life -= dt;
    g.fx = g.fx.filter(f => f.life > 0);

    // Toasts
    g.hintT = Math.max(0, g.hintT - dt);
    g.toastT -= dt;
    if (g.toastT <= 0) {
      const next = g.toasts.shift();
      this.showToast(next || null);
      g.toastT = next ? 5.5 : 0.3;
    }

    m.hud(g);
    document.getElementById('hudLives').textContent = '♥'.repeat(g.lives) + '♡'.repeat(3 - g.lives);

    if (!g.done && m.won(g)) this.finish(true);
  },

  updatePred(pr, dt) {
    const g = this.g, p = g.player;
    if (g.frozen) return;
    const safe = this.inHome() || p.invuln > 0;
    const d = dist(pr, p);
    pr.timer -= dt;
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
    if (g.lives <= 0 && g.mission.gentle) g.lives = 1;
    Sound.play('caught');
    if (g.mission.onCaught) g.mission.onCaught(g);
    g.toasts.unshift({ text: 'Caught by the ' + pr.name + '! Back home you go.', kind: 'hint' });
    g.toastT = 0;
    if (g.lives <= 0) { this.finish(false); return; }
    p.x = g.home.x; p.y = g.home.y;
    p.invuln = 3;
    const far = this.spawnPoint(350);
    pr.x = far.x; pr.y = far.y;
    pr.state = 'rest'; pr.timer = pr.restTime;
  },

  finish(won) {
    const g = this.g;
    g.done = true;
    this.running = false;
    this.showToast(null);
    if (won) { Sound.play('win'); this.fact('win'); }
    setTimeout(() => this.onEnd && this.onEnd(won, g), won ? 400 : 900);
  },

  showToast(tst) {
    const el = document.getElementById('toast');
    if (!tst) { el.className = ''; return; }
    el.className = 'show' + (tst.kind === 'hint' ? ' hint' : '');
    el.innerHTML = (tst.kind === 'fact' ? '<b>Bug fact:</b> ' : '') + tst.text;
    Speech.say(tst.text);
  },

  drawSprite(name, e, scale) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle || 0);
    ctx.scale(scale || 1, scale || 1);
    Sprites[name](ctx, e, this.g.t);
    ctx.restore();
  },

  draw() {
    const ctx = this.ctx, g = this.g, m = g.mission, p = g.player;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.drawImage(this.bg, 0, 0);

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

    if (p.invuln > 0 && Math.floor(g.t * 10) % 2) ctx.globalAlpha = 0.4;
    this.drawSprite(m.playerSprite ? m.playerSprite(g) : (m.sprite || m.id), p, m.scale * (1 + (p.hop || 0) * 0.5));
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

    for (const f of g.fx) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillStyle = f.color || '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(f.text, f.x, f.y - (1 - f.life) * 30);
      ctx.globalAlpha = 1;
    }
  },

  pop(x, y, text, color) { this.g.fx.push({ x, y, text, color, life: 1 }); },
};
