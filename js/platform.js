'use strict';
// Side-on platform physics for the London run (js/london.js). World px with y down; a bug's feet are at p.y.
// Solids block on every side (walls, logs, a table top, the tunnel's ceiling); ledges are one-way tops you land on
// from above and drop through by steering down; the floor runs the whole width, so there are no bottomless pits.
// Everything steps at a fixed 1/120 s, so a fast fall never passes through a ledge and the game behaves the same at
// any frame rate (and at a test's 8x speed).
//
// A level: { w, floor, solids: [[x, y, w, h, kind]], ledges: [[x, y, w]], ramps: [[x0, y0, x1, y1]], hides: [[x, y, w, h]], ... }
// A ramp is a sloping top (x0 < x1) you walk up and down, and land on from above; like a ledge, it is nothing from
// below, so a level puts something solid under its high end.
// Fliers steer to fly: { hw, hh, fly, accel, sink }. A walker walks: { hw, hh, walk, grav } and may climb bark it
// walks into (climb), fly a short way after a warm-up (the stag beetle: flyV, flyLift, flySink, warm, flyT), jump
// (the fox: jump, set off by Plat.jump) or curl into a ball that rolls down ramps and flies off their ends (the pill
// woodlouse, while p.rolled: roll is its top speed, rollG the pull of a slope).

const Plat = {
  STEP: 1 / 120,

  // Does a box (centre x, feet y, half width hw, height hh) overlap the rectangle s?
  overlaps(x, y, hw, hh, s) { return x + hw > s[0] && x - hw < s[0] + s[2] && y > s[1] && y - hh < s[1] + s[3]; },

  // Is the bug inside a hiding place (a bush, an alcove, under the table)?
  hidden(L, p, hh) {
    const cy = p.y - (hh || 8) / 2;
    return (L.hides || []).some(h => p.x > h[0] && p.x < h[0] + h[2] && cy > h[1] && cy < h[1] + h[3]);
  },

  // Advance the player by dt in fixed steps. dx, dy: the steering direction (length up to 1); o: { hover, perch,
  // weak (can't climb: an empty bee), drop (steer down through a ledge) }.
  move(L, P, p, dt, dx, dy, o) {
    o = o || {};
    p.acc = Math.min(0.25, (p.acc || 0) + dt);
    while (p.acc >= this.STEP) { p.acc -= this.STEP; this.step(L, P, p, dx, dy, o); }
  },

  step(L, P, p, dx, dy, o) {
    const h = this.STEP;
    if (P.walk) this.walker(P, p, dx, dy, h); else this.flier(P, p, dx, dy, h, o);
    this.collide(L, P, p, h, o.drop || dy > 0.6);
  },

  // Steer to fly: the bug flies the way you steer; let go and it sinks slowly and lands on what's below
  flier(P, p, dx, dy, h, o) {
    let tx = 0, ty = P.sink;
    if (o.perch || o.hover) { tx = 0; ty = 0; }
    else if (dx || dy) { tx = dx * P.fly; ty = dy * P.fly; if (o.weak) ty = Math.max(ty, P.sink); }
    const k = Math.min(1, P.accel * h);
    p.vx += (tx - p.vx) * k; p.vy += (ty - p.vy) * k;
    if (p.push) { p.vx += p.push * h; p.push *= Math.pow(0.02, h); if (Math.abs(p.push) < 5) p.push = 0; }   // a gust
  },

  // The stag beetle: walks, climbs bark it walks into, and after a warm-up flies a short, clumsy way
  walker(P, p, dx, dy, h) {
    if (p.flyT > 0) {
      p.flyT = Math.max(0, p.flyT - h);
      const tx = dx * P.flyV, ty = dy < -0.3 ? -P.flyLift : dy > 0.3 ? P.flyLift : P.flySink, k = Math.min(1, 3 * h);
      p.vx += (tx - p.vx) * k; p.vy += (ty - p.vy) * k;
      return;
    }
    if (p.warmT > 0) {   // buzzing its wings to warm up before take-off
      p.warmT -= h; p.vx = 0; p.vy = Math.min(600, p.vy + P.grav * h);
      if (p.warmT <= 0) { p.flyT = P.flyT; p.vy = -P.flyLift; }
      return;
    }
    if (p.rolled) {   // a ball: no steering; a slope pulls it along, flat ground slows it, the air leaves it be
      if (p.onGround) {
        if (p.slope) p.vx = clamp(p.vx + p.slope * P.rollG * h, -P.roll, P.roll);
        else p.vx *= Math.pow(0.33, h);
      }
      p.vy = Math.min(700, p.vy + P.grav * h);
      return;
    }
    p.vx = dx * P.walk;
    if (p.push) { p.vx += p.push * 0.08; p.push *= Math.pow(0.02, h); if (Math.abs(p.push) < 5) p.push = 0; }   // shoved back
    if (p.climbing) p.vy = -P.climb;
    else p.vy = Math.min(P.jump ? 900 : 600, p.vy + P.grav * h);
  },

  // A jump (the fox): only off the ground
  jump(P, p) { if (!p.onGround) return false; p.vy = -P.jump; p.onGround = false; return true; },
  // Where a ramp's top is at x (null: not over it)
  rampY(r, x) { return x < r[0] || x > r[2] ? null : r[1] + (r[3] - r[1]) * (x - r[0]) / (r[2] - r[0]); },

  // Take off (the walker's Fly). Only from a standing start.
  takeOff(P, p) { if (p.flyT > 0 || p.warmT > 0) return false; p.warmT = P.warm; return true; },

  collide(L, P, p, h, drop) {
    const hw = P.hw, hh = P.hh;
    // Across: walls stop you (and a walker pushing into bark climbs it)
    p.climbing = false; p.wall = 0;
    p.x += p.vx * h;
    for (const s of L.solids) if (this.overlaps(p.x, p.y, hw, hh, s)) {
      const right = p.vx > 0 || (p.vx === 0 && p.x < s[0] + s[2] / 2);
      p.x = right ? s[0] - hw : s[0] + s[2] + hw; p.wall = right ? 1 : -1;
      if (P.climb && s[4] === 'bark' && p.vx * p.wall > 0 && !p.rolled) p.climbing = true;
      p.vx = 0;
    }
    p.x = clamp(p.x, hw, L.w - hw);
    // Up and down: land on tops, bump your head on undersides
    const y0 = p.y;
    p.onGround = false;
    p.y += p.vy * h;
    for (const s of L.solids) if (this.overlaps(p.x, p.y, hw, hh, s)) {
      if (p.vy < 0 && y0 - hh >= s[1] + s[3] - 0.5) { p.y = s[1] + s[3] + hh; p.vy = 0; }
      else { p.y = s[1]; p.vy = Math.min(0, p.vy); p.onGround = true; }
    }
    if (p.vy >= 0 && !drop) {
      for (const l of L.ledges || []) if (p.x + hw * 0.4 > l[0] && p.x - hw * 0.4 < l[0] + l[2] && y0 <= l[1] + 0.5 && p.y >= l[1]) { p.y = l[1]; p.vy = 0; p.onGround = true; }
    }
    // Ramps: land on one from above, and follow it up and down once on it. Rolling off the end of one that points
    // up throws a ball into the air.
    const was = p.ramp; p.ramp = null; p.slope = 0;
    if (L.ramps && p.vy >= 0) {
      for (const r of L.ramps) {
        const ry = this.rampY(r, p.x); if (ry === null) continue;
        const ry0 = this.rampY(r, clamp(p.x - p.vx * h, r[0], r[2]));
        if ((y0 <= ry0 + 0.5 && p.y >= ry) || (was === r && p.y >= ry - 8) || (p.onGround && p.y >= ry && p.y - ry < 10)) {
          p.y = ry; p.vy = 0; p.onGround = true; p.ramp = r; p.slope = (r[3] - r[1]) / (r[2] - r[0]);
        }
      }
      if (was && !p.ramp && p.rolled) {
        const sl = (was[3] - was[1]) / (was[2] - was[0]);
        if (p.vx * sl < 0) { p.vy = p.vx * sl; p.onGround = false; }   // going up it: launched
      }
    }
    if (p.y >= L.floor) { p.y = L.floor; p.vy = Math.min(0, p.vy); p.onGround = true; }
    if (p.y - hh < 0) { p.y = hh; p.vy = Math.max(0, p.vy); }
    if (p.onGround && p.flyT > 0 && p.vy >= 0 && p.flyT < P.flyT - 0.3) p.flyT = 0;   // a walker's flight ends when it lands
  },

  // Is a straight route between two points clear of solids for a box of this size? (tests check every level's route)
  clear(L, P, a, b) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4);
    for (let i = 0; i <= n; i++) {
      const x = a[0] + (b[0] - a[0]) * i / n, y = a[1] + (b[1] - a[1]) * i / n;
      if (L.solids.some(s => this.overlaps(x, y, P.hw - 1, P.hh - 1, s))) return false;
    }
    return true;
  },
};
