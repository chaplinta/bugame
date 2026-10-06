'use strict';
// Random event: a kid catches you with a bug net and puts you in a bug tank. Escape through the lid.

const TANK = { x: 150, y: 90, w: 660, h: 440 };   // inside of the tank, in screen pixels
const SWOOP_TIME = 3;
const ESCAPE_VERB = { ant: 'Climb', queen: 'Climb', spiderling: 'Jump', spider: 'Jump', nymph: 'Swim' };

Object.assign(Game, {
  // Count down to the catch, but only when it's fair: away from home, no predator about, nothing scripted running.
  netCheck(dt) {
    const g = this.g, m = g.mission;
    if (g.event || g.netDone || g.frozen) return;
    if (g.netT > 0) { g.netT -= dt; return; }
    if (this.inHome() || g.preds.length || (m.locked && m.locked(g)) || g.player.invuln > 0) return;
    g.event = { phase: 'swoop', t: 0 };
    g.toasts.unshift({ text: m.id === 'nymph' ? 'Uh oh! A girl with a pond net!' : 'Uh oh! A girl with a bug net!', kind: 'hint' });
    g.toastT = 0;
    Sound.play('caught');
  },

  updateEvent(dt) {
    const g = this.g, ev = g.event, p = g.player;
    ev.t += dt;
    if (ev.phase === 'swoop') {
      // Net lands at 0.9 s, the bug wiggles, the net lifts, then fade to the tank.
      if (ev.t >= 0.9 && !ev.landed) {
        ev.landed = true;
        g.shake = 0.3; this.burst(p.x, p.y, '#e8dcc0', 16);
        Sound.play('tap');
      }
      if (ev.t > 1 && ev.t < 2.2) p.angle += Math.sin(ev.t * 30) * 0.15;
      if (ev.t >= SWOOP_TIME) this.enterTank();
      return;
    }
    if (ev.t > 30) { this.leaveTank('She lets you go. Thanks!'); return; }
    ev.dropT = Math.max(0, (ev.dropT || 0) - dt);
    ev.sayT = Math.max(0, (ev.sayT || 0) - dt);
    if (ev.dropT > 0) {
      // Dropping in from the top of the tank onto the floor.
      const k = 1 - ev.dropT / 0.7;
      p.y = ev.dropY0 + (ev.dropY1 - ev.dropY0) * k * k;
      if (ev.dropT <= dt) { this.burst(p.x, p.y + 10, ev.water ? '#fff' : '#c9a868', 12); Sound.play('tap'); }
      setHud('Escape the bug tank!', '');
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
      Game.hint('Wait for her to lift the lid, then go to the gap and press ' + ev.verb + '.');
    }

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
    ev.dropY0 = TANK.y + 30;
    ev.dropY1 = ev.water ? TANK.y + TANK.h / 2 : TANK.y + TANK.h - 80;
    p.y = ev.dropY0;
    ev.dropT = 0.7;
    ev.sayT = 2.4;
    setAction(ev.verb, false);
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

  // The catch, in screen space over the world: her shadow and net sweep in on an arc, the net lands,
  // the bug wiggles inside, the net lifts toward you, then everything fades into the tank.
  drawSwoop(ctx) {
    const g = this.g, p = g.player, t = g.event.t;
    const z = this.zoom || 1, bx = (p.x - g.cam.x) * z, by = (p.y - g.cam.y) * z;
    const ease = (v) => v * v * (3 - 2 * v);
    // Her shadow falls across the ground
    const sk = ease(clamp(t / 0.9, 0, 1));
    softShadow(ctx, W + 200 - sk * 420, H * 0.55, 420, 340, 0.35 + sk * 0.15);
    if (t < 0.9) {
      ctx.fillStyle = '#c0392b'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('!', bx, by - 40 - Math.sin(t * 20) * 4);
    }
    // Net position: in on an arc from the top right, then lifts up toward the viewer
    let nx, ny, nr, lift = 0;
    if (t < 0.9) {
      const k = ease(t / 0.9);
      nx = W + 160 + (bx - W - 160) * k; ny = -160 + (by + 160) * k + Math.sin(k * Math.PI) * 90;
      nr = 200 - k * 140;
    } else {
      lift = ease(clamp((t - 1.8) / 0.9, 0, 1));
      nx = bx + (W / 2 - bx) * lift; ny = by + (H / 2 - by) * lift;
      nr = 60 + lift * 260;
    }
    if (lift > 0) {
      // Darken the world as the net comes up close
      ctx.fillStyle = 'rgba(30,20,10,' + lift * 0.55 + ')'; ctx.fillRect(0, 0, W, H);
    }
    // Handle, held by her arm off the top right
    const hx = nx + nr * 0.75, hy = ny - nr * 0.75;
    const ax = W + 60 - lift * 40, ay = -60 + lift * 20;
    line(ctx, [hx, hy, ax, ay], '#7a4a22', 12 + lift * 8);
    plainLine(ctx, [hx, hy, ax, ay], 'rgba(255,220,170,.35)', 3);
    // Her arm and sleeve coming in from the corner
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(Math.atan2(hy - ay, hx - ax));
    ell(ctx, 30, 0, 46, 26, '#f6d2b0');
    ell(ctx, 80, 0, 40, 34, '#5aa86a');
    ctx.restore();
    // Bug inside the net, big when lifted
    if (lift > 0) {
      const s = 1 + lift * 3.5;
      ctx.save(); ctx.translate(nx + Math.sin(t * 28) * 6 * lift, ny + nr * 0.2);
      ctx.rotate(Math.sin(t * 26) * 0.4 - Math.PI / 2); ctx.scale(s * (g.mission.scale || 1), s * (g.mission.scale || 1));
      const m = g.mission;
      Sprites[m.playerSprite ? m.playerSprite(g) : (m.sprite || m.id)](ctx, Object.assign({}, p, { moving: true }), t);
      ctx.restore();
    }
    // Mesh bag (closes over the bug after landing)
    ctx.save();
    ctx.translate(nx, ny);
    ctx.beginPath(); ctx.arc(0, 0, nr, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.12 + lift * 0.1) + ')'; ctx.fillRect(-nr, -nr, nr * 2, nr * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1 + lift;
    const step = 10 + lift * 18, wob = t > 0.9 && t < 1.8 ? Math.sin(t * 30) * 2 : 0;
    ctx.beginPath();
    for (let i = -nr; i <= nr; i += step) {
      ctx.moveTo(i + wob, -nr); ctx.lineTo(i - wob, nr);
      ctx.moveTo(-nr, i - wob); ctx.lineTo(nr, i + wob);
    }
    ctx.stroke();
    ctx.restore();
    // Hoop rim
    ctx.beginPath(); ctx.arc(nx, ny, nr, 0, TAU);
    ctx.strokeStyle = '#3a6ab0'; ctx.lineWidth = 7 + lift * 6; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.stroke();
    if (t > 1 && t < 1.8) {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Wiggle!', bx, by - nr - 14);
    }
    // Fade into the tank
    const fade = clamp((t - 2.5) / 0.5, 0, 1);
    if (fade > 0) { ctx.fillStyle = 'rgba(245,234,210,' + fade + ')'; ctx.fillRect(0, 0, W, H); }
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
    // The girl's face behind the tank, following you with her eyes
    const peek = ev.sayT > 0 || ev.eyeT < 0 ? 1 : 0.6;
    const fx = clamp(p.x + (ev.eyeSide || 1) * 40, T.x + 150, T.x + T.w - 150), fy = T.y + 150;
    ctx.globalAlpha = peek;
    drawGirl(ctx, fx, fy, 0.78, { lookX: p.x, lookY: p.y, blink: ev.eyeT < -1.3 && ev.eyeT > -1.45, mouth: ev.sayT > 0 ? 'open' : 'smile', t });
    ctx.globalAlpha = 1;
    // Glass (back and sides)
    ctx.fillStyle = 'rgba(200,235,250,.22)';
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
    if (ev.sayT > 0) {
      const bx = clamp(fx + 260, 120, W - 110), by = 48;
      ctx.globalAlpha = Math.min(1, ev.sayT * 2);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(bx, by, 95, 34, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx - 60, by + 22); ctx.lineTo(bx - 110, by + 70); ctx.lineTo(bx - 30, by + 30); ctx.fill();
      ctx.fillStyle = '#c8501e'; ctx.font = 'bold 28px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillText('Got you!', bx, by + 10);
      ctx.globalAlpha = 1;
    }
  },
});

// The girl with the bug net: green eyes, slightly messy light-brown hair, freckles.
// Front view centred on (x, y); face is about 300 px wide at s = 1.
function drawGirl(ctx, x, y, s, o) {
  o = o || {};
  const t = o.t || 0;
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  const hair = '#b88c5a', hairDark = '#8a6238', hairLight = '#d8b282';
  // Hair behind the head, uneven edge
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const a = i / 48 * TAU, rr = 190 + Math.sin(a * 7) * 10 + Math.sin(a * 13 + 1) * 6;
    const px = Math.cos(a) * rr * 1.02, py = -20 + Math.sin(a) * rr * (a > 0 && a < Math.PI ? 1.15 : 0.95);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  let gr = ctx.createRadialGradient(-50, -120, 20, 0, 0, 240);
  gr.addColorStop(0, hairLight); gr.addColorStop(0.6, hair); gr.addColorStop(1, hairDark);
  ctx.fillStyle = gr; ctx.fill();
  // Shoulders and T-shirt
  gr = ctx.createLinearGradient(0, 170, 0, 300);
  gr.addColorStop(0, '#6cc07a'); gr.addColorStop(1, '#3f8a50');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 300, 230, 120, 0, Math.PI, TAU); ctx.fill();
  ell(ctx, 0, 175, 48, 40, '#f0c4a0');   // neck
  // Ears
  for (const sg of [-1, 1]) ell(ctx, sg * 150, 20, 22, 32, '#f2c6a2');
  // Face
  gr = ctx.createRadialGradient(-40, -40, 20, 0, 10, 190);
  gr.addColorStop(0, '#fde2c8'); gr.addColorStop(0.7, '#f6d0ae'); gr.addColorStop(1, '#e8b48e');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 10, 150, 172, 0, 0, TAU); ctx.fill();
  // Rosy cheeks
  for (const sg of [-1, 1]) softBlob(ctx, sg * 88, 72, 30, 'rgba(240,130,120,.25)');
  // Freckles over the nose and cheeks
  const r = rng(5);
  for (let i = 0; i < 30; i++) {
    const sg = i % 2 ? -1 : 1, fx = sg * (25 + r() * 75), fy = 45 + r() * 35 - Math.abs(fx) * 0.12;
    plainEll(ctx, fx, fy, 2 + r() * 1.6, 1.8 + r() * 1.2, 'rgba(176,110,70,.6)');
  }
  // Eyes: green, looking at the bug
  const blink = o.blink;
  for (const sg of [-1, 1]) {
    const ex = sg * 62, ey = 0;
    if (blink) { ctx.beginPath(); ctx.arc(ex, ey, 26, 0.15 * Math.PI, 0.85 * Math.PI); ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 4; ctx.stroke(); continue; }
    plainEll(ctx, ex, ey, 34, 26, '#fff');
    let lx = 0, ly = 0;
    if (o.lookX !== undefined) {
      const dx = o.lookX - (x + ex * s), dy = o.lookY - (y + ey * s), d = Math.hypot(dx, dy) || 1;
      lx = dx / d * Math.min(12, d * 0.05); ly = dy / d * Math.min(8, d * 0.05);
    }
    ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 34, 26, 0, 0, TAU); ctx.clip();
    gr = ctx.createRadialGradient(ex + lx, ey + ly, 2, ex + lx, ey + ly, 18);
    gr.addColorStop(0, '#9ad88a'); gr.addColorStop(0.55, '#3f9a5a'); gr.addColorStop(1, '#1f5a34');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(ex + lx, ey + ly, 18, 0, TAU); ctx.fill();
    plainEll(ctx, ex + lx, ey + ly, 8, 8, '#141010');
    plainEll(ctx, ex + lx - 6, ey + ly - 7, 5, 5, 'rgba(255,255,255,.95)');
    plainEll(ctx, ex + lx + 6, ey + ly + 5, 2, 2, 'rgba(255,255,255,.8)');
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(ex, ey, 34, 26, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.strokeStyle = '#4a2e1a'; ctx.lineWidth = 4; ctx.stroke();
    for (let k = 0; k < 3; k++) plainLine(ctx, [ex + sg * (14 + k * 9), ey - 24 + k * 2, ex + sg * (20 + k * 11), ey - 33 + k * 3], '#4a2e1a', 2);
    // Eyebrows
    ctx.beginPath(); ctx.moveTo(ex - 26, ey - 38); ctx.quadraticCurveTo(ex, ey - 50, ex + 26, ey - 40);
    ctx.strokeStyle = hairDark; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
  }
  // Nose
  ctx.beginPath(); ctx.moveTo(-6, 52); ctx.quadraticCurveTo(0, 60, 8, 52);
  ctx.strokeStyle = 'rgba(170,100,70,.7)'; ctx.lineWidth = 3; ctx.stroke();
  // Mouth
  if (o.mouth === 'open') {
    ctx.beginPath(); ctx.ellipse(0, 108, 26, 20 + Math.sin(t * 10) * 3, 0, 0, TAU); ctx.fillStyle = '#8a2a2a'; ctx.fill();
    plainEll(ctx, 0, 118, 14, 7, '#e86a6a');
    ctx.fillStyle = '#fff'; ctx.fillRect(-14, 90, 28, 7);
  } else {
    ctx.beginPath(); ctx.arc(0, 82, 40, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.strokeStyle = '#b05040'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke();
  }
  // Hair over the top of the head, then a messy fringe of uneven locks
  gr = ctx.createLinearGradient(0, -200, 0, -60);
  gr.addColorStop(0, hairLight); gr.addColorStop(1, hair);
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.ellipse(0, -75, 160, 125, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
  const rl = rng(17);
  for (let i = 0; i < 12; i++) {
    const x0 = -145 + i * 26 + (rl() - 0.5) * 8, tipY = -62 - rl() * 22 + Math.abs(x0) * 0.12, curl = (rl() - 0.5) * 22, w = 15 + rl() * 6;
    ctx.beginPath();
    ctx.moveTo(x0 - w, -95);
    ctx.quadraticCurveTo(x0 - w * 0.4 + curl * 0.5, tipY - 12, x0 + curl, tipY);
    ctx.quadraticCurveTo(x0 + w * 0.5 + curl * 0.3, tipY - 18, x0 + w, -95);
    ctx.closePath();
    ctx.fillStyle = i % 3 ? hair : hairLight; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x0, -110); ctx.quadraticCurveTo(x0 + curl * 0.3, tipY - 20, x0 + curl * 0.8, tipY - 4);
    ctx.strokeStyle = 'rgba(110,70,35,.45)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // Shine on the hair
  ctx.beginPath(); ctx.ellipse(-50, -150, 60, 14, -0.25, 0, TAU); ctx.fillStyle = 'rgba(255,240,210,.35)'; ctx.fill();
  // Side hair falling past the cheeks
  for (const sg of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sg * 140, -80); ctx.quadraticCurveTo(sg * 185, 60, sg * 160, 190);
    ctx.quadraticCurveTo(sg * 150, 90, sg * 128, -10); ctx.closePath();
    ctx.fillStyle = hair; ctx.fill();
  }
  // Flyaway strands
  ctx.strokeStyle = hairLight; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * (0.2 + i * 0.075), sx = Math.cos(a) * 175, sy = -20 + Math.sin(a) * 195;
    ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + Math.cos(a) * 30 + Math.sin(t * 2 + i) * 6, sy + Math.sin(a) * 30 - 10, sx + Math.cos(a + 0.6) * 45, sy + Math.sin(a + 0.6) * 40);
    ctx.stroke();
  }
  ctx.restore();
}
