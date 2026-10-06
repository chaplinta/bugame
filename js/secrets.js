'use strict';
// Easter eggs: hidden lost things in each place, a quokka on the map, a bug parade, a button-mash spin,
// and a Christmas hat in December. Found secrets are saved and listed in the Bug Book.

// One hidden thing per place (keyed by background). No sparkle: you have to stumble on it.
const SECRETS = {
  places: {
    ant: { key: 's_ball', name: 'Lost cricket ball', sprite: 'cricketBall', fx: 0.97, fy: 0.5,
      text: 'A lost cricket ball! Someone hit a six right into Kings Park.' },
    bee: { key: 's_gnome', name: 'Garden gnome', sprite: 'gnome', fx: 0.94, fy: 0.9,
      text: 'A garden gnome, guarding the veggie patch. He hasn’t moved in years.' },
    paddock: { key: 's_thong', name: 'Lost thong', sprite: 'thong', fx: 0.5, fy: 0.95,
      text: 'A lost thong! Somebody walked home with one bare foot.' },
    heath: { key: 's_plane', name: 'Paper aeroplane', sprite: 'paperPlane', fx: 0.93, fy: 0.92,
      text: 'A paper aeroplane! It flew all the way here from someone’s backyard.' },
    woodland: { key: 's_billy', name: 'Old billy can', sprite: 'billyCan', fx: 0.04, fy: 0.5,
      text: 'An old billy can, left behind by bush campers long ago.' },
    litter: { key: 's_marble', name: 'Shiny marble', sprite: 'marble', fx: 0.94, fy: 0.5,
      text: 'A shiny marble. To a snail, that’s as big as a beach ball!' },
    spider: { key: 's_castle', name: 'Sandcastle', sprite: 'sandcastle', fx: 0.6, fy: 0.95,
      text: 'A sandcastle with a little flag. To a spider, it’s a giant fortress!' },
    nymph: { key: 's_boat', name: 'Sunken toy boat', sprite: 'toyBoat', fx: 0.92, fy: 0.9,
      text: 'A sunken toy boat. Ahoy there, little nymph!' },
    dragonfly: { key: 's_duck', name: 'Rubber duck', sprite: 'rubberDuck', fx: 0.95, fy: 0.75,
      text: 'A rubber duck, floating on the lake. Quack!' },
  },
  // Secrets that aren't in a place.
  other: {
    s_quokka: { name: 'Quokka on Rottnest', text: 'Tap Rottnest on the map.' },
    s_parade: { name: 'Bug parade', text: 'Tap the Bugame title lots of times.' },
    s_wheee: { name: 'Wheee!', text: 'Press the action button really fast when there’s nothing to do.' },
  },
  all() {
    const list = Object.values(this.places).map(s => ({ key: s.key, name: s.name, text: s.text }));
    for (const [key, s] of Object.entries(this.other)) list.push({ key, name: s.name, text: s.text });
    return list;
  },
};

Object.assign(Sprites, {
  cricketBall(ctx) {
    ell(ctx, 0, 0, 8, 8, '#b3261e');
    ctx.beginPath(); ctx.arc(0, 0, 8, -0.6, 0.6); ctx.strokeStyle = '#f2e6c8'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 8, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
    ell(ctx, -3, -3, 2, 1.4, 'rgba(255,255,255,.4)');
  },
  gnome(ctx) {
    ell(ctx, 0, 0, 14, 12, '#3a6ab0');
    ell(ctx, 6, 0, 8, 7, '#f0c8a0');
    ell(ctx, 10, 0, 6, 8, '#f2f2f2');
    ctx.beginPath(); ctx.moveTo(-2, -9); ctx.lineTo(-2, 9); ctx.lineTo(-18, 0); ctx.closePath();
    ctx.fillStyle = '#c8302a'; ctx.fill();
  },
  thong(ctx) {
    ell(ctx, 0, 0, 22, 9, '#2f7d5b');
    ell(ctx, 0, 0, 20, 7, '#3f9a6e');
    line(ctx, [10, 0, -2, -7], '#f2d040', 2.5);
    line(ctx, [10, 0, -2, 7], '#f2d040', 2.5);
  },
  paperPlane(ctx) {
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-14, -12); ctx.lineTo(-8, 0); ctx.lineTo(-14, 12); ctx.closePath();
    ctx.fillStyle = '#fbfbf5'; ctx.fill();
    line(ctx, [18, 0, -8, 0], '#c8c8c0', 1);
  },
  billyCan(ctx) {
    ell(ctx, 0, 0, 13, 13, '#8a8a88');
    ell(ctx, 0, 0, 10, 10, '#3a3a38');
    ctx.beginPath(); ctx.arc(0, 0, 16, -2.4, -0.7); ctx.strokeStyle = '#6a6a68'; ctx.lineWidth = 1.5; ctx.stroke();
  },
  marble(ctx) {
    ell(ctx, 0, 0, 9, 9, 'rgba(120,190,255,.85)');
    ctx.beginPath(); ctx.moveTo(-6, 3); ctx.quadraticCurveTo(0, -8, 6, 3); ctx.strokeStyle = '#e8503a'; ctx.lineWidth = 2; ctx.stroke();
    ell(ctx, -3, -4, 2.5, 1.6, 'rgba(255,255,255,.8)');
  },
  sandcastle(ctx) {
    ell(ctx, 0, 0, 24, 20, '#d9c08a');
    for (const [x, y] of [[-12, -10], [12, -10], [-12, 10], [12, 10]]) { ell(ctx, x, y, 8, 8, '#c9ad72'); ell(ctx, x, y, 5, 5, '#e3cc96'); }
    ell(ctx, 0, 0, 9, 9, '#c9ad72');
    line(ctx, [0, 0, 0, -22], '#5a4028', 1.5);
    ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(10, -18); ctx.lineTo(0, -14); ctx.fillStyle = '#c8302a'; ctx.fill();
  },
  toyBoat(ctx) {
    ell(ctx, 0, 0, 18, 8, '#c8501e');
    ell(ctx, 0, 0, 14, 5, '#e87a3a');
    ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -16); ctx.lineTo(12, -4); ctx.closePath();
    ctx.fillStyle = '#f2f2f2'; ctx.fill();
  },
  rubberDuck(ctx, o, t) {
    const bob = Math.sin((t || 0) * 3) * 1.5;
    ell(ctx, 0, bob, 14, 10, '#f2d040');
    ell(ctx, 9, bob - 1, 7, 7, '#f2d040');
    ell(ctx, 16, bob - 1, 4, 2.5, '#e87a1e');
    ell(ctx, 10, bob - 4, 1.5, 1.5, '#111');
  },
  // Quokka, for the map secret.
  quokka(ctx) {
    ell(ctx, 0, 14, 30, 34, '#8a6a4a');
    ell(ctx, 0, 20, 20, 24, '#a88a66');
    ell(ctx, 0, -22, 22, 20, '#8a6a4a');
    for (const s of [-1, 1]) { ell(ctx, s * 15, -38, 7, 7, '#8a6a4a'); ell(ctx, s * 15, -38, 4, 4, '#c8a080'); }
    for (const s of [-1, 1]) { ell(ctx, s * 8, -26, 3, 3.4, '#111'); ell(ctx, s * 8 - 1, -27, 1, 1, '#fff'); }
    ell(ctx, 0, -16, 4, 3, '#2a1a10');
    ctx.beginPath(); ctx.arc(0, -12, 7, 0.2, Math.PI - 0.2); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2; ctx.stroke();
    for (const s of [-1, 1]) ell(ctx, s * 12, 6, 5, 7, '#7a5a3a');
  },
});

Object.assign(Game, {
  // Hidden thing for this place.
  setupSecret() {
    const g = this.g, m = g.mission;
    const sc = SECRETS.places[m.bg || m.id];
    g.secret = sc ? Object.assign({ found: false, angle: 0.4, scale: 1.6 }, sc, { x: sc.fx * World.w, y: sc.fy * World.h }) : null;
    g.mash = [];
  },

  checkSecret(dt) {
    const g = this.g, s = g.secret;
    if (s && !s.found && dist(s, g.player) < 45) {
      s.found = true;
      this.foundSecret(s.key, s.text, s.x, s.y);
    }
    // Button mashing with nothing to do: Wheee!
    if (Input.pressed && !document.getElementById('actionBtn').classList.contains('ready')) {
      g.mash.push(g.t);
      g.mash = g.mash.filter(t => g.t - t < 2.5);
      if (g.mash.length >= 8 && !(g.player.spinT > 0)) {
        g.mash = [];
        g.player.spinT = 1;
        this.pop(g.player.x, g.player.y - 30, 'Wheee!', '#ffd23f');
        if (!g.wheee) { g.wheee = true; this.foundSecret('s_wheee', 'You found a secret: spinning bugs! Wheee!'); }
      }
    }
    if (g.player.spinT > 0) { g.player.spinT -= dt; g.player.angle += dt * 20; }
  },

  foundSecret(key, text, x, y) {
    const g = this.g;
    Sound.play('win');
    if (x !== undefined) { this.burst(x, y, '#ffd23f', 30); this.burst(x, y, '#fff', 20); this.pop(x, y - 30, 'Secret!', '#ffd23f'); }
    g.toasts.unshift({ text, kind: 'secret' });
    g.toastT = 0;
    if (this.onSecret) this.onSecret(key);
  },

  drawSecret(ctx) {
    const g = this.g, s = g.secret;
    if (s) this.drawSprite(s.sprite, s, s.scale);
  },

  // Santa hat on your bug in December.
  drawHat(ctx) {
    if (new Date().getMonth() !== 11) return;
    const p = this.g.player, r = p.r * 0.9;
    ctx.save();
    ctx.translate(p.x, p.y - r);
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(4, -20); ctx.closePath();
    ctx.fillStyle = '#c8302a'; ctx.fill();
    ell(ctx, 0, 0, 12, 4, '#fff');
    ell(ctx, 4, -21, 3.5, 3.5, '#fff');
    ctx.restore();
  },
});
