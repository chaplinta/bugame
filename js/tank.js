'use strict';
// Random event: a kid catches you with a bug net and puts you in a bug tank. Escape through the lid.

const TANK = { x: 150, y: 90, w: 660, h: 440 };   // inside of the tank, in screen pixels
const ESCAPE_VERB = { ant: 'Climb', queen: 'Climb', spiderling: 'Jump', spider: 'Jump', nymph: 'Swim' };

Object.assign(Game, {
  // Count down to the catch, but only when it's fair: away from home, no predator about, nothing scripted running.
  netCheck(dt) {
    const g = this.g, m = g.mission;
    if (g.event || g.netDone || g.frozen) return;
    if (g.netT > 0) { g.netT -= dt; return; }
    if (this.inHome() || g.preds.length || (m.locked && m.locked(g)) || g.player.invuln > 0) return;
    g.event = { phase: 'swoop', t: 0 };
    g.toasts.unshift({ text: m.id === 'nymph' ? 'Uh oh! A kid with a pond net!' : 'Uh oh! A kid with a bug net!', kind: 'hint' });
    g.toastT = 0;
    Sound.play('caught');
  },

  updateEvent(dt) {
    const g = this.g, ev = g.event, p = g.player;
    ev.t += dt;
    if (ev.phase === 'swoop') {
      if (ev.t >= 1.8) this.enterTank();
      return;
    }

    // In the tank: move about inside the glass.
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
    if (dx || dy) {
      const len = Math.hypot(dx, dy), sp = clamp(ev.speed, 160, 180);   // slow bugs still reach a corner in time
      p.x = clamp(p.x + dx / len * sp * dt, TANK.x + 18, TANK.x + TANK.w - 18);
      p.y = clamp(p.y + dy / len * sp * dt, TANK.y + 18, TANK.y + TANK.h - 18);
      p.angle = Math.atan2(dy, dx);
      p.moving = true;
    }

    // The kid lifts a corner of the lid now and then to drop in a leaf.
    if (ev.open) {
      ev.open.t -= dt;
      if (ev.open.t <= 0) { ev.open = null; ev.lidT = 6 + Math.random() * 2; }
    } else {
      ev.lidT -= dt;
      if (ev.lidT <= 0) {
        const c = ev.corners[Math.floor(Math.random() * 4)];
        ev.open = { x: c.x, y: c.y, t: 4.5 };
        ev.leaves.push({ x: TANK.x + 80 + Math.random() * (TANK.w - 160), y: TANK.y + 80 + Math.random() * (TANK.h - 160), a: Math.random() * TAU });
        Sound.play('tap');
        if (!ev.toldGap) {
          ev.toldGap = true;
          g.toasts.unshift({ text: 'The lid is open! Get to the gap and press ' + ev.verb + '!', kind: 'hint' });
          g.toastT = 0;
        }
      }
    }
    ev.eyeT -= dt;
    if (ev.eyeT < -1.6) { ev.eyeT = 3 + Math.random() * 3; ev.eyeSide = Math.random() < 0.5 ? -1 : 1; }

    const atGap = ev.open && dist(p, ev.open) < 70;
    setAction(ev.verb, atGap);
    if (Input.pressed) {
      if (atGap) { this.leaveTank('You escaped! Back to the wild.'); return; }
      Game.hint('Wait for the kid to lift the lid, then go to the gap and press ' + ev.verb + '.');
    }
    if (ev.t > 30) { this.leaveTank('The kid lets you go. Good kid!'); return; }

    setHud('Escape the bug tank!', ev.open ? 'The lid is open!' : '');
  },

  enterTank() {
    const g = this.g, p = g.player, m = g.mission;
    const ev = g.event;
    ev.phase = 'tank';
    ev.t = 0;
    ev.saved = { x: p.x, y: p.y, angle: p.angle };
    ev.verb = m.escape || ESCAPE_VERB[m.id] || 'Fly';
    ev.speed = p.speed;
    ev.lidT = 3;
    ev.open = null;
    ev.eyeT = 1;
    ev.eyeSide = 1;
    ev.leaves = [];
    ev.water = m.id === 'nymph';
    ev.corners = [
      { x: TANK.x + 30, y: TANK.y + 30 }, { x: TANK.x + TANK.w - 30, y: TANK.y + 30 },
      { x: TANK.x + 30, y: TANK.y + TANK.h - 30 }, { x: TANK.x + TANK.w - 30, y: TANK.y + TANK.h - 30 },
    ];
    p.x = TANK.x + TANK.w / 2;
    p.y = TANK.y + TANK.h / 2;
    p.jump = null; p.hop = 0; p.grab = null; p.sip = false; p.buzz = false;
    Input.target = null;
    g.toasts.push({ text: 'You’re in a bug tank! Move around and watch the lid.', kind: 'hint' });
  },

  leaveTank(msg) {
    const g = this.g, p = g.player, ev = g.event;
    p.x = ev.saved.x; p.y = ev.saved.y; p.angle = ev.saved.angle;
    p.invuln = 3;
    g.event = null;
    g.netDone = true;
    Input.target = null;
    document.getElementById('actionBtn').textContent = g.mission.action;
    this.updateCamera();
    Sound.play('win');
    g.toasts.unshift({ text: msg, kind: 'hint' });
    g.toastT = 0;
    this.fact('tank');
  },

  // Net coming down over the bug, with the kid's shadow behind it.
  drawSwoop(ctx) {
    const g = this.g, p = g.player, k = Math.min(1, g.event.t / 1.4);
    const sx = p.x - g.cam.x, sy = p.y - g.cam.y;
    ctx.fillStyle = 'rgba(20,20,30,' + (0.12 + k * 0.2) + ')';
    ctx.beginPath();
    ctx.ellipse(W + 120 - k * 360, H * 0.5, 320, 260, 0, 0, TAU);
    ctx.fill();
    const r = 220 - k * 170;
    line(ctx, [sx + r * 0.7, sy - r * 0.7, W + 40, -40 + k * 120], '#8a5a2a', 8);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.globalAlpha = 0.25 + k * 0.6;
    ell(ctx, 0, 0, r, r, 'rgba(255,255,255,.15)');
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 1;
    for (let i = -r; i <= r; i += 14) {
      ctx.beginPath(); ctx.moveTo(i, -r); ctx.lineTo(i, r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r, i); ctx.lineTo(r, i); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.strokeStyle = '#e8e2d0';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  },

  drawTank(ctx) {
    const g = this.g, ev = g.event, m = g.mission, p = g.player, t = g.t;
    const T = TANK;
    // Desk top
    ctx.fillStyle = '#c9a27a';
    ctx.fillRect(0, 0, W, H);
    for (let y = 10; y < H; y += 26) line(ctx, [0, y, W, y + 6], 'rgba(120,80,40,.18)', 2);
    // Glass walls
    ctx.fillStyle = 'rgba(200,235,250,.55)';
    ctx.fillRect(T.x - 22, T.y - 22, T.w + 44, T.h + 44);
    ctx.strokeStyle = 'rgba(120,170,200,.9)';
    ctx.lineWidth = 4;
    ctx.strokeRect(T.x - 22, T.y - 22, T.w + 44, T.h + 44);
    // Floor
    if (ev.water) {
      ctx.fillStyle = '#5f8f6a';
      ctx.fillRect(T.x, T.y, T.w, T.h);
      for (let i = 0; i < 30; i++) ell(ctx, T.x + (i * 97) % T.w, T.y + (i * 61) % T.h, 2, 2, 'rgba(255,255,255,.3)');
    } else {
      ctx.fillStyle = m.id === 'bee' || m.id === 'fly' || m.id === 'dragonfly' ? '#8a6a44' : '#e3cc96';
      ctx.fillRect(T.x, T.y, T.w, T.h);
      for (let i = 0; i < 120; i++) ell(ctx, T.x + (i * 137) % T.w, T.y + (i * 89) % T.h, 3, 2, 'rgba(60,40,20,.25)', i);
    }
    if (ev.water) {
      // Pond weed the kid scooped up too
      for (let i = 0; i < 7; i++) {
        const x = T.x + 90 + i * 80, y = T.y + 120 + (i % 3) * 110;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 30, y + 20, x + 10, y + 60);
        ctx.strokeStyle = '#2f6b2a';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    } else {
      // Things the kid put in: a twig, a leaf, a bottle-cap of water
      line(ctx, [T.x + 120, T.y + 300, T.x + 330, T.y + 220, T.x + 420, T.y + 250], '#6b4a2a', 8);
      line(ctx, [T.x + 250, T.y + 250, T.x + 280, T.y + 180], '#6b4a2a', 5);
      ell(ctx, T.x + 500, T.y + 120, 40, 20, '#5f9a3a', 0.4);
      line(ctx, [T.x + 465, T.y + 100, T.x + 535, T.y + 140], '#3f7a2a', 2);
      ell(ctx, T.x + 520, T.y + 340, 26, 26, '#f2f2f2');
      ell(ctx, T.x + 520, T.y + 340, 20, 20, '#7cc3e0');
    }
    for (const lf of ev.leaves) ell(ctx, lf.x, lf.y, 18, 9, '#6fae3c', lf.a);
    // The bug
    Game.drawSprite(m.playerSprite ? m.playerSprite(g) : (m.sprite || m.id), p, m.scale);
    // Mesh lid over everything, except the corner the kid has lifted
    ctx.save();
    ctx.beginPath();
    ctx.rect(T.x - 22, T.y - 22, T.w + 44, T.h + 44);
    if (ev.open) ctx.rect(ev.open.x + 50, ev.open.y - 50, -100, 100);   // counter-wound hole
    ctx.clip('evenodd');
    ctx.strokeStyle = 'rgba(90,90,90,.35)';
    ctx.lineWidth = 1;
    for (let x = T.x - 22; x <= T.x + T.w + 22; x += 12) { ctx.beginPath(); ctx.moveTo(x, T.y - 22); ctx.lineTo(x, T.y + T.h + 22); ctx.stroke(); }
    for (let y = T.y - 22; y <= T.y + T.h + 22; y += 12) { ctx.beginPath(); ctx.moveTo(T.x - 22, y); ctx.lineTo(T.x + T.w + 22, y); ctx.stroke(); }
    ctx.restore();
    // Open gap and the kid's hand holding the lid up
    if (ev.open) {
      const o = ev.open, glow = 0.5 + Math.sin(t * 8) * 0.4;
      ctx.strokeStyle = 'rgba(255,210,63,' + glow + ')';
      ctx.lineWidth = 4;
      ctx.strokeRect(o.x - 50, o.y - 50, 100, 100);
      const hx = o.x + (o.x < W / 2 ? -70 : 70), hy = o.y + (o.y < H / 2 ? -60 : 60);
      ell(ctx, hx, hy, 46, 34, '#f0c8a0');
      for (let i = 0; i < 4; i++) ell(ctx, hx + (o.x < W / 2 ? 30 : -30) + (i - 1.5) * 4, hy - 20 + i * 13, 22, 7, '#eab890');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Gap!', o.x, o.y + 6);
    }
    // A giant eye peering in through the glass
    if (ev.eyeT < 0) {
      const ex = ev.eyeSide > 0 ? T.x + T.w + 60 : T.x - 60, ey = T.y + T.h / 2;
      const blink = ev.eyeT < -1.3 ? 0.2 : 1;
      ell(ctx, ex, ey, 46, 70 * blink, '#fdfdfd');
      if (blink > 0.5) {
        ell(ctx, ex - ev.eyeSide * 12, ey + (p.y - ey) * 0.05, 28, 28, '#6b4a2a');
        ell(ctx, ex - ev.eyeSide * 14, ey + (p.y - ey) * 0.05, 13, 13, '#111');
        ell(ctx, ex - ev.eyeSide * 8, ey - 8, 5, 5, '#fff');
      }
    }
    // Sticker on the glass
    const label = ev.water ? 'MY POND BUGS' : 'MY BUGS', lw = ev.water ? 150 : 100;
    ctx.fillStyle = '#fff6c0';
    ctx.fillRect(T.x + 10, T.y + T.h - 2, lw, 26);
    ctx.fillStyle = '#c8501e';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, T.x + 10 + lw / 2, T.y + T.h + 17);
  },
});
