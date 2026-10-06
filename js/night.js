'use strict';
// The day lasts 10 minutes of play. The sun sets over the last 2, then night falls, every bug goes to
// sleep and the game is over until you start a new day. The clock only runs while the game is on screen,
// and it is kept for the browser session so it carries on between screens and reloads.

const Night = {
  LEN: 600, DUSK: 120,
  elapsed: 0,
  facts: [],           // facts found today, for the night screen
  fallen: false,
  told: {},

  load() {
    try {
      const d = JSON.parse(sessionStorage.getItem('bugame.day') || '{}');
      this.elapsed = d.elapsed || 0; this.facts = d.facts || [];
    } catch (e) { /* storage off */ }
  },
  save() {
    try { sessionStorage.setItem('bugame.day', JSON.stringify({ elapsed: this.elapsed, facts: this.facts })); } catch (e) { /* storage off */ }
  },
  left() { return Math.max(0, this.LEN - this.elapsed); },
  // 0 in the day, rising to 1 as the sun sets.
  dusk() { return clamp(1 - this.left() / this.DUSK, 0, 1); },

  addFact(text) { if (!this.facts.includes(text)) { this.facts.push(text); this.save(); } },

  tick(dt) {
    if (this.fallen || document.hidden) return;
    this.elapsed += dt;
    if (Math.floor(this.elapsed) % 5 === 0) this.save();
    const g = Game.running && Game.g;
    if (g && !g.done) {
      if (this.left() <= this.DUSK && !this.told.dusk) { this.told.dusk = true; Game.hint('The sun is setting… The day is nearly over.'); }
      if (this.left() <= 30 && !this.told.late) { this.told.late = true; Game.hint('Nearly night time! Bugs will soon go to sleep.'); }
    }
    if (this.left() <= 0) this.fall();
    this.drawClocks();
  },

  // Night falls: in a game the sky darkens and the bugs curl up first, then the night screen.
  fall() {
    if (this.fallen) return;
    this.fallen = true;
    this.save();
    if (Game.running && Game.g) {
      const g = Game.g;
      g.night = 0.001; g.frozen = true; g.event = null;
      g.toasts = []; Game.showToast(null);
      $('actionBtn').classList.add('asleep');
      Input.target = null; Input.held = false;
      Sound.play('caught');
      setTimeout(() => this.showScreen(), 3600);
    } else this.showScreen();
  },

  showScreen() {
    Game.stop();
    Speech.stop();
    fillList($('nightFacts'), this.facts.length ? this.facts : ['None yet. Tomorrow is a new day!']);
    $('nightCount').textContent = this.facts.length ? 'You found ' + this.facts.length + ' bug fact' + (this.facts.length === 1 ? '' : 's') + ' today.' : '';
    drawMoon($('nightPic'));
    show('night');
    Speech.say('Night time. All the bugs are asleep. Good night!');
  },

  newDay() {
    this.elapsed = 0; this.facts = []; this.fallen = false; this.told = {};
    $('actionBtn').classList.remove('asleep');
    this.save();
    buildMap();
  },

  // Little sky dial: the sun travels over an arc, and the sky darkens toward night.
  drawClocks() {
    for (const c of document.querySelectorAll('canvas.sunClock')) {
      if (!c.offsetParent) continue;
      const dpr = window.devicePixelRatio || 1, w = 64, h = 30;
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const k = Math.min(1, this.elapsed / this.LEN), d = this.dusk();
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, d > 0 ? mix('#8fd0f0', '#2a2a6a', d) : '#8fd0f0');
      sky.addColorStop(1, d > 0 ? mix('#e8f6ff', '#f0905a', d) : '#e8f6ff');
      ctx.fillStyle = sky;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, w, h, 15) : ctx.rect(0, 0, w, h); ctx.fill();
      ctx.beginPath(); ctx.arc(w / 2, h + 4, 26, Math.PI, TAU); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
      const a = Math.PI + k * Math.PI, sx = w / 2 + Math.cos(a) * 26, sy = h + 4 + Math.sin(a) * 26;
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, TAU); ctx.fillStyle = mix('#ffd23f', '#ff7a2a', d); ctx.fill();
      ctx.strokeStyle = 'rgba(255,170,40,.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(60,90,40,.8)'; ctx.fillRect(0, h - 4, w, 4);
    }
  },

  // Warm then dark-blue sky over the game world, with stars and sleeping bugs at night.
  drawSky(ctx) {
    const g = Game.g, d = this.dusk();
    if (d > 0 && !g.night) {
      ctx.fillStyle = 'rgba(255,120,40,' + d * 0.18 + ')'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(30,20,80,' + d * 0.28 + ')'; ctx.fillRect(0, 0, W, H);
    }
    if (!g.night) return;
    g.night = Math.min(1, g.night + 1 / 60 / 1.6);
    const n = g.night;
    ctx.fillStyle = 'rgba(12,16,50,' + (0.35 + n * 0.4) + ')'; ctx.fillRect(0, 0, W, H);
    const r = rng(42);
    for (let i = 0; i < 70; i++) {
      const tw = 0.5 + 0.5 * Math.sin(g.t * 3 + i);
      ctx.fillStyle = 'rgba(255,255,230,' + n * (0.4 + tw * 0.6) + ')';
      ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.9, 0.8 + r() * 1.6, 0, TAU); ctx.fill();
    }
    ctx.save(); ctx.globalAlpha = n; ctx.translate(W / 2 + 250, 130); drawMoonShape(ctx, 34); ctx.restore();
    // Zzz over every creature
    const z = Game.zoom || 1;
    ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'center';
    for (const e of [g.player].concat(g.items.filter(i => i.state !== undefined || i.kind === 'fly' || i.kind === 'cow'), g.preds)) {
      const sx = (e.x - g.cam.x) * z, sy = (e.y - g.cam.y) * z;
      if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
      for (let k = 0; k < 3; k++) {
        const ph = (g.t * 0.6 + k / 3 + e.x * 0.001) % 1;
        ctx.fillStyle = 'rgba(255,255,255,' + n * (1 - ph) + ')';
        ctx.font = 'bold ' + (12 + ph * 12) + 'px Georgia, serif';
        ctx.fillText('z', sx + 14 + ph * 20, sy - 18 - ph * 34);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,' + n + ')'; ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText('Good night, bugs!', W / 2, H / 2);
  },
};

function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return 'rgb(' + c(16) + ',' + c(8) + ',' + c(0) + ')';
}

function drawMoonShape(ctx, r) {
  const gr = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  gr.addColorStop(0, '#fffbe0'); gr.addColorStop(1, '#e8d890');
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = gr; ctx.fill();
  for (const [x, y, s] of [[-0.3, 0.2, 0.18], [0.25, -0.2, 0.12], [0.2, 0.35, 0.1]]) {
    ctx.beginPath(); ctx.arc(x * r, y * r, s * r, 0, TAU); ctx.fillStyle = 'rgba(200,180,110,.5)'; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, TAU);
  const glow = ctx.createRadialGradient(0, 0, r, 0, 0, r * 1.5);
  glow.addColorStop(0, 'rgba(255,250,200,.3)'); glow.addColorStop(1, 'rgba(255,250,200,0)');
  ctx.fillStyle = glow; ctx.fill();
}

// Night screen picture: moon, stars, and a bug curled up asleep on a leaf.
function drawMoon(canvas) {
  const dpr = window.devicePixelRatio || 1, w = 300, h = 180;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#0e1440'); sky.addColorStop(1, '#2a3a7a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  const r = rng(8);
  for (let i = 0; i < 50; i++) { ctx.fillStyle = 'rgba(255,255,230,' + (0.4 + r() * 0.6) + ')'; ctx.beginPath(); ctx.arc(r() * w, r() * h * 0.8, 0.6 + r() * 1.4, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.translate(230, 55); drawMoonShape(ctx, 28); ctx.restore();
  ell(ctx, 120, 150, 90, 22, '#3f7a3a', -0.1);
  ctx.save(); ctx.translate(120, 136); ctx.scale(2, 2); ctx.rotate(-0.2);
  Sprites.bee(ctx, { moving: false, load: 0 }, 0);
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('z', 160, 100); ctx.font = 'bold 28px Georgia, serif'; ctx.fillText('z', 178, 78); ctx.font = 'bold 34px Georgia, serif'; ctx.fillText('Z', 200, 50);
}

Night.load();
if (Night.left() <= 0) Night.fallen = true;
setInterval(() => Night.tick(1), 1000);

// Facts found today go on the night screen.
{
  const fact = Game.fact;
  Game.fact = function (key) {
    const g = this.g, before = g.seen.size;
    fact.call(this, key);
    if (g.seen.size > before) Night.addFact(g.mission.factText[key]);
  };
  const showScreen = show;
  show = function (id) { showScreen(id); Night.drawClocks(); };
}
$('newDay').addEventListener('click', () => Night.newDay());
if (Night.fallen) Night.showScreen();
Night.drawClocks();
