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
        const c = ev.corners[Math.floor(Math.random() * ev.corners.length)];
        ev.open = { x: c.x, y: c.y, t: 4.5 };
        // A leaf drops in through the gap and falls to the floor.
        ev.leaves.push({ x: c.x + (c.x < W / 2 ? 30 : -30), y: TANK.y + 10, a: Math.random() * TAU, vy: 0 });
        Sound.play('tap');
        if (!ev.toldGap) {
          ev.toldGap = true;
          const how = ev.verb === 'Fly' ? 'Fly up' : ev.verb === 'Swim' ? 'Swim up' : 'Climb up the glass';
          g.toasts.unshift({ text: 'The lid is open! ' + how + ' to the gap and press ' + ev.verb + '!', kind: 'hint' });
          g.toastT = 0;
        }
      }
    }
    for (const lf of ev.leaves) {
      const floor = TANK.y + TANK.h - (ev.water ? 40 : 66);
      if (lf.y < floor) { lf.vy = Math.min(ev.water ? 40 : 160, lf.vy + dt * 300); lf.y += lf.vy * dt; lf.x += Math.sin(g.t * 3 + lf.a) * 20 * dt; lf.a += dt; }
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
    ev.lidT = 2;
    ev.open = null;
    ev.eyeT = 1;
    ev.eyeSide = 1;
    ev.leaves = [];
    ev.water = m.id === 'nymph';
    // Side view: the gap can only open at the top, at either end of the lid.
    ev.corners = [{ x: TANK.x + 50, y: TANK.y + 28 }, { x: TANK.x + TANK.w - 50, y: TANK.y + 28 }];
    // Start on the floor of the tank (or in the middle of the water).
    p.x = TANK.x + TANK.w / 2;
    p.y = ev.water ? TANK.y + TANK.h / 2 : TANK.y + TANK.h - 80;
    p.angle = -Math.PI / 2;
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
    const z = this.zoom || 1, sx = (p.x - g.cam.x) * z, sy = (p.y - g.cam.y) * z;
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

  // Side-on view of the tank sitting on a desk, with the kid peering in from behind.
  drawTank(ctx) {
    const g = this.g, ev = g.event, m = g.mission, p = g.player, t = g.t;
    const T = TANK, floorY = T.y + T.h - 60;
    // Bedroom wall and desk
    ctx.fillStyle = '#e8dcc4';
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 48) { ctx.fillStyle = x % 96 ? '#e2d4b8' : '#ecdfc8'; ctx.fillRect(x, 0, 48, H); }
    ctx.fillStyle = '#b07a48';
    ctx.fillRect(0, T.y + T.h + 6, W, H);
    for (let x = -40; x < W; x += 70) line(ctx, [x, T.y + T.h + 14, x + 120, H], 'rgba(90,50,20,.18)', 2);
    // The kid's face behind the tank, moving to look at you
    const peek = ev.eyeT < 0 ? 1 : 0.55;
    const fx = clamp(p.x + (ev.eyeSide || 1) * 40, T.x + 120, T.x + T.w - 120), fy = T.y + 70;
    ctx.globalAlpha = peek;
    ell(ctx, fx, fy + 40, 190, 170, '#f0c8a0');
    ell(ctx, fx, fy - 90, 200, 90, '#6b4226');                     // hair
    for (const s of [-1, 1]) {
      const ex = fx + s * 70, ey = fy + 10, blink = ev.eyeT < -1.3 ? 0.15 : 1;
      ell(ctx, ex, ey, 34, 26 * blink, '#fff');
      if (blink > 0.5) {
        ell(ctx, ex + (p.x - ex) * 0.04, ey + (p.y - ey) * 0.04, 16, 16, '#5a3a1a');
        ell(ctx, ex + (p.x - ex) * 0.04, ey + (p.y - ey) * 0.04, 8, 8, '#111');
        ell(ctx, ex + (p.x - ex) * 0.04 - 5, ey - 6, 4, 4, '#fff');
      }
    }
    ctx.beginPath(); ctx.arc(fx, fy + 80, 50, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = '#a0583a'; ctx.lineWidth = 6; ctx.stroke();
    ctx.globalAlpha = 1;
    // Glass (back and sides)
    ctx.fillStyle = 'rgba(200,235,250,.5)';
    ctx.fillRect(T.x, T.y, T.w, T.h);
    // Water or substrate
    if (ev.water) {
      ctx.fillStyle = 'rgba(80,140,110,.75)';
      ctx.fillRect(T.x, T.y + 40, T.w, T.h - 40);
      line(ctx, [T.x, T.y + 40, T.x + T.w, T.y + 40], 'rgba(255,255,255,.6)', 3);
      for (let i = 0; i < 12; i++) {
        const by = T.y + T.h - ((t * 40 + i * 37) % (T.h - 50));
        ctx.beginPath(); ctx.arc(T.x + 40 + (i * 53) % (T.w - 80), by, 3, 0, TAU);
        ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(T.x, floorY + 30, T.w, T.h - (floorY + 30 - T.y));
      for (let i = 0; i < 7; i++) {
        const x = T.x + 70 + i * 90;
        ctx.beginPath(); ctx.moveTo(x, floorY + 30);
        ctx.quadraticCurveTo(x + 30 * Math.sin(t + i), floorY - 60, x + 10, floorY - 130);
        ctx.strokeStyle = '#2f6b2a'; ctx.lineWidth = 5; ctx.stroke();
      }
    } else {
      const sandy = ['ant', 'queen', 'spider', 'spiderling', 'caterpillar', 'butterfly'].includes(m.id);
      ctx.fillStyle = sandy ? '#e3cc96' : '#6a4a2a';
      ctx.fillRect(T.x, floorY, T.w, T.h - (floorY - T.y));
      ctx.fillStyle = sandy ? '#c9a868' : '#4a3420';
      ctx.fillRect(T.x, floorY + 30, T.w, T.h - (floorY + 30 - T.y));
      for (let i = 0; i < 40; i++) ell(ctx, T.x + (i * 137) % T.w, floorY + 8 + (i * 29) % 50, 4, 3, sandy ? '#b8945a' : '#3a2814', i);
      // Twig leaning from the floor up the glass, a bottle-cap of water, a leaf
      line(ctx, [T.x + 90, floorY + 6, T.x + 330, T.y + 150], '#6b4a2a', 9);
      line(ctx, [T.x + 230, T.y + 240, T.x + 290, T.y + 220], '#6b4a2a', 5);
      ctx.fillStyle = '#e8e8e8'; ctx.fillRect(T.x + 480, floorY - 14, 54, 16);
      ctx.fillStyle = '#7cc3e0'; ctx.fillRect(T.x + 484, floorY - 12, 46, 6);
      ell(ctx, T.x + 380, floorY - 2, 44, 10, '#5f9a3a', 0.08);
    }
    for (const lf of ev.leaves) ell(ctx, lf.x, lf.y, 18, 8, '#6fae3c', lf.a);
    // The bug
    Game.drawSprite(m.playerSprite ? m.playerSprite(g) : (m.sprite || m.id), p, m.scale);
    // Front glass: highlights and frame
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.fillRect(T.x, T.y, T.w, T.h);
    line(ctx, [T.x + 30, T.y + 20, T.x + 90, T.y + 200], 'rgba(255,255,255,.5)', 6);
    line(ctx, [T.x + 60, T.y + 20, T.x + 100, T.y + 140], 'rgba(255,255,255,.35)', 3);
    ctx.strokeStyle = '#4a5560'; ctx.lineWidth = 6;
    ctx.strokeRect(T.x, T.y, T.w, T.h);
    // Mesh lid along the top, one end lifted when the kid opens it
    const lidY = T.y - 6;
    const drawLid = (x0, x1, lift) => {
      ctx.save();
      ctx.translate(x0, lidY);
      ctx.rotate(lift);
      const L = x1 - x0;
      ctx.fillStyle = 'rgba(90,90,90,.85)'; ctx.fillRect(0, -6, L, 12);
      ctx.strokeStyle = 'rgba(220,220,220,.7)'; ctx.lineWidth = 1;
      for (let x = 4; x < L; x += 8) { ctx.beginPath(); ctx.moveTo(x, -5); ctx.lineTo(x, 5); ctx.stroke(); }
      ctx.restore();
    };
    if (ev.open) {
      const left = ev.open.x < W / 2;
      // Lid hinged at the far end, raised at the open end
      const hingeX = left ? T.x + T.w : T.x;
      ctx.save();
      ctx.translate(hingeX, lidY);
      ctx.rotate(left ? Math.PI + 0.22 : -0.22);
      ctx.fillStyle = 'rgba(90,90,90,.85)'; ctx.fillRect(0, -6, T.w, 12);
      ctx.restore();
      const o = ev.open, glow = 0.5 + Math.sin(t * 8) * 0.4;
      ctx.strokeStyle = 'rgba(255,210,63,' + glow + ')'; ctx.lineWidth = 4;
      ctx.strokeRect(o.x - 50, T.y - 4, 100, 70);
      // The kid's hand holding the lid up
      const hx = left ? T.x - 20 : T.x + T.w + 20, hy = T.y - 30;
      ell(ctx, hx, hy, 40, 30, '#f0c8a0');
      for (let i = 0; i < 4; i++) ell(ctx, hx + (left ? 34 : -34), hy - 18 + i * 12, 20, 6, '#eab890');
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Gap!', o.x, T.y + 40);
    } else drawLid(T.x - 6, T.x + T.w + 6, 0);
    // Sticker on the front glass
    const label = ev.water ? 'MY POND BUGS' : 'MY BUGS', lw = ev.water ? 150 : 100;
    ctx.fillStyle = '#fff6c0';
    ctx.fillRect(T.x + T.w - lw - 20, T.y + T.h - 40, lw, 26);
    ctx.fillStyle = '#c8501e'; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, T.x + T.w - 20 - lw / 2, T.y + T.h - 21);
  },
});
