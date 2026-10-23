'use strict';
// Pre-rendered sprites. Plants, scenery, items and visiting creatures are painted once, at high
// resolution, into little bitmaps and then just blitted each frame. That keeps the detailed
// shading cheap enough for phones. Anything with state the cache can't name is still drawn live.
// Lighting stays fixed to the screen: the bitmap is rendered with the light turned to match the
// sprite's heading (in 8 steps), then drawn with the exact rotation. Sprites with a 3D model
// (js/render3d.js, js/models-*.js) are rendered by three.js instead of their 2D drawing.

const SpriteCache = {
  enabled: !/[?&]nocache=1/.test(location.search),
  regs: {},
  entries: new Map(),   // key -> { c, bytes }
  bytes: 0,
  LIMIT: 32 * 1024 * 1024,
  hits: 0, misses: 0,

  // A sprite is cacheable when its look can be named by a short key.
  register(name, def) { this.regs[name] = Object.assign({ box: [-60, -60, 60, 60] }, def || {}); },
  registerAll(names, def) { for (const n of names) this.register(n, def); },

  // Phase of an animation with frequency f (radians per second), in `steps` buckets.
  phase(t, f, steps) { return Math.floor(((t * f / TAU) % 1 + 1) % 1 * steps); },
  // Default key: the flags and values most sprites read.
  defaultKey(o, t) {
    let k = '';
    if (o.moving) k += 'm' + this.phase(t, 18, 8);
    if (o.flying) k += 'f' + this.phase(t, 22, 4);
    if (o.state) k += 's' + o.state;
    if (o.pollen !== undefined) k += 'p' + (o.pollen ? 1 : 0);
    if (o.nectar !== undefined) k += 'n' + (o.nectar ? 1 : 0);
    if (o.leaf !== undefined) k += 'l' + Math.round(o.leaf * 5);
    if (o.fresh !== undefined) k += 'r' + Math.round(o.fresh * 4);
    if (o.amount !== undefined) k += 'a' + Math.round(o.amount * 4);
    if (o.size !== undefined) k += 'z' + Math.round(o.size * 10);
    if (o.grow !== undefined && o.grow < 1) k += 'g';
    if (o.sealed) k += 'S';
    if (o.stunned) k += 'T';
    if (o.hop) k += 'h';
    if (o.stuck) k += 'k';
    if (o.face !== undefined) k += 'F' + (o.face < 0 ? 0 : 1);
    if (o.dive) k += 'D';
    if (o.pose) k += 'P' + o.pose;
    if (o.water !== undefined) k += 'w' + (o.water ? 1 : 0);
    if (o.seed !== undefined) k += 'd' + o.seed;
    if (o.kind) k += 'K' + o.kind;
    if (o.color) k += 'c' + o.color;
    if (o.band) k += 'b' + o.band;
    if (o.sway !== undefined) k += 'y' + this.phase(t, 1.5, 6);
    return k;
  },

  // Is this sprite drawn from a 3D model right now?
  is3D(name) { const r = this.regs[name]; return !!(r && r.model && !r.model.broken && typeof Render3D !== 'undefined' && Render3D.ok); },
  P(px) { return px <= 2 ? 2 : px <= 3 ? 3 : px <= 4 ? 4 : px <= 6 ? 6 : 8; },
  bucketOf(reg, a) { const nb = reg.buckets || 8; return nb === 1 ? 0 : ((Math.round((a || 0) / (TAU / nb)) % nb) + nb) % nb; },
  // Get-or-make with the least recently used entries dropped past the byte limit.
  entry(key, make) {
    let ent = this.entries.get(key);
    if (ent) { this.hits++; this.entries.delete(key); this.entries.set(key, ent); return ent; }
    this.misses++;
    ent = make();
    if (!ent) return null;
    this.entries.set(key, ent); this.bytes += ent.bytes;
    while (this.bytes > this.LIMIT && this.entries.size > 1) {
      const [k0, e0] = this.entries.entries().next().value;
      this.entries.delete(k0); this.bytes -= e0.bytes;
    }
    return ent;
  },

  // The look key: a 3D model's own key (its poses) when it renders in 3D, else the drawing's key as before.
  keyOf(reg, o, t, threeD) { const k = threeD && reg.model && reg.model.key ? reg.model.key : reg.key; return k ? k(o, t) : this.defaultKey(o, t); },
  // Draw name at the current transform (already translated and rotated, not scaled). Returns false if not cached.
  draw(ctx, name, e, t, scale, px) {
    const reg = this.regs[name];
    if (!reg) return false;
    const threeD = this.is3D(name);
    if (!threeD && (!Sprites[name] || reg.live2d)) return false;
    // Light turned into the sprite's frame, in 8 steps (fewer for things lying flat on the ground)
    const nb = reg.buckets || 8, a = e.angle || 0, bucket = this.bucketOf(reg, a), P = this.P(px);
    const vk = this.keyOf(reg, e, t, threeD);
    if (vk === null) return false;   // this one wants to be drawn live right now
    const key = name + '|' + vk + '|' + bucket + '|' + P, near = name + '|' + bucket + '|' + P;
    let ent = this.entries.get(key);
    // 3D renders are rationed per frame: past the budget, reuse the last look of this heading for a frame
    if (!ent && threeD && this.frameRenders >= this.FRAME_RENDERS && this.recent.get(near)) ent = this.recent.get(near);
    else ent = this.entry(key, () => { if (threeD) this.frameRenders++; return this.render(name, reg, e, t, bucket * TAU / nb, P); });
    if (!ent) return false;
    if (threeD) this.recent.set(near, ent);
    const s = scale || 1, b = ent.box;
    if (ent.threeD && reg.model.view === 'side') ctx.rotate(-a);   // side-on bitmaps stay upright; the engine turned by e.angle
    ctx.drawImage(ent.c, b[0] * s, b[1] * s, (b[2] - b[0]) * s, (b[3] - b[1]) * s);
    return true;
  },

  // A bitmap for direct callers (portraits, icons, stamps). opts: { t, px, angle }. null when there is none.
  image(name, o, opts) {
    const reg = this.regs[name];
    if (!reg || !this.enabled) return null;
    opts = opts || {};
    const threeD = this.is3D(name);
    if (!threeD && (!Sprites[name] || (reg.live2d && !opts.any))) return null;
    const nb = reg.buckets || 8, bucket = this.bucketOf(reg, opts.angle), P = this.P(opts.px || 2), t = opts.t || 0;
    const vk = this.keyOf(reg, o, t, threeD);
    if (vk === null) return null;
    return this.entry(name + '|' + vk + '|' + bucket + '|' + P, () => this.render(name, reg, o, t, bucket * TAU / nb, P));
  },
  // Draw a sprite's bitmap at (x, y), turned by angle and scaled; false when there is none (draw it live).
  // Only 3D models are blitted this way unless opts.any is set: the 2D drawings keep drawing live.
  blit(ctx, name, o, t, opts) {
    opts = opts || {};
    if (!opts.any && !this.is3D(name)) return false;
    const s = opts.scale || 1, m = ctx.getTransform(), px = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * s;
    const ent = this.image(name, o, { t, px, angle: opts.angle });
    if (!ent) return false;
    ctx.save(); ctx.translate(opts.x || 0, opts.y || 0);
    if (!(ent.threeD && this.regs[name].model.view === 'side')) ctx.rotate(opts.angle || 0);
    const b = ent.box; ctx.drawImage(ent.c, b[0] * s, b[1] * s, (b[2] - b[0]) * s, (b[3] - b[1]) * s);
    ctx.restore();
    return true;
  },

  // Per-frame budget for 3D renders, and the warm-up queue (filled by Game.start, drained a few ms at a time).
  FRAME_RENDERS: 2, frameRenders: 0, recent: new Map(), queue: [],
  beginFrame() { this.frameRenders = 0; if (this.queue.length) this.warmTick(4); },
  warm(list) { this.queue = list || []; },
  warmTick(ms) {
    const t0 = performance.now();
    while (this.queue.length && performance.now() - t0 < ms) { const j = this.queue.shift(); this.image(j.name, j.e, { t: j.t, px: j.px, angle: j.e.angle }); }
  },

  render(name, reg, e, t, ang, P) {
    if (reg.model && typeof Render3D !== 'undefined' && Render3D.ok && !reg.model.broken) {
      const ent = Models.render(name, reg.model, e, t, ang, P);
      if (ent) return ent;
      if (!Sprites[name]) return null;
    }
    let box = reg.box;
    const c = document.createElement('canvas');
    const paint = (bx) => {
      c.width = Math.ceil((bx[2] - bx[0]) * P); c.height = Math.ceil((bx[3] - bx[1]) * P);
      const x = c.getContext('2d');
      x.setTransform(P, 0, 0, P, -bx[0] * P, -bx[1] * P);
      const wx = -0.55, wy = -0.83;
      Shade.light = [wx * Math.cos(ang) + wy * Math.sin(ang), -wx * Math.sin(ang) + wy * Math.cos(ang)];
      try { Sprites[name](x, e, t); } catch (err) { Shade.light = null; return null; }
      Shade.light = null;
      return x;
    };
    let x = paint(box);
    if (!x) return null;
    if (!reg.trimmed) {
      // First time: find the drawn area, remember it, and paint again into a tight box.
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3]) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      if (x1 >= x0) {
        const m = 2 / P;
        box = [box[0] + x0 / P - m, box[1] + y0 / P - m, box[0] + (x1 + 1) / P + m, box[1] + (y1 + 1) / P + m];
        reg.box = box;
      }
      reg.trimmed = true;
      x = paint(box);
      if (!x) return null;
    }
    return { c, box, bytes: c.width * c.height * 4 };
  },

  clear() { this.entries.clear(); this.recent.clear(); this.queue = []; this.bytes = 0; },
  stats() { return { entries: this.entries.size, mb: +(this.bytes / 1048576).toFixed(1), hits: this.hits, misses: this.misses, queued: this.queue.length }; },
};

// What gets cached: everything that stands still or loops simply. The bugs you play stay live.
SpriteCache.registerAll([
  'dianella', 'hibbertia', 'paw', 'everlasting', 'capeweed', 'grevillea', 'cone', 'dig', 'feather', 'shell', 'beeHotel', 'birdbath',
  'seashell', 'frog', 'damselfly', 'gilgie', 'divingBeetle', 'kangaroo', 'rooPoo', 'magpie', 'egg', 'woodChip', 'mud', 'log', 'fungus',
  'lichen', 'deadLeaf', 'slime', 'deadBeetle', 'deadMoth', 'cricketBall', 'gnome', 'thong', 'paperPlane', 'billyCan', 'marble',
  'sandcastle', 'toyBoat', 'wrack', 'rock', 'litter', 'gum', 'banksiaTree', 'grassTree', 'saltbush', 'bottlebrush', 'nestBox',
  'pondPlant', 'eggSac', 'wrapped', 'honeydew', 'lerpBug', 'antEgg', 'bbq', 'table', 'pot', 'isoBirdbath', 'bucket', 'sausage', 'gecko',
  'chrysalis', 'silkShelter', 'echidna', 'beeEater', 'hobby', 'turtle', 'wasp', 'paperWasp', 'bobtail', 'wagtail', 'smallAnt',
  'springtail', 'caterpillar', 'fly', 'dungBeetle', 'termite', 'gull', 'plover', 'moth', 'beetle', 'resinBee', 'ladybird', 'skink',
  'orbSpider', 'honeyeater', 'wattlebird', 'fairyWren', 'cockatoo', 'quenda', 'banjoFrog', 'worm', 'skimmerF', 'queenSugar',
]);
// The kangaroo hops (the drawing animates on o.moving, like the model)
SpriteCache.register('kangaroo', { key(o, t) { return o.moving ? 'm' + SpriteCache.phase(t, 8, 4) : 'x'; } });
// Mosquitoes the dragonfly hunts: the player's own mosquito level draws it live (o.blood changes)
SpriteCache.register('mosquito', { key(o, t) { return o.blood ? null : 'w' + SpriteCache.phase(t, 90, 3); } });
SpriteCache.registerAll(['nativeGrass', 'rush'], { key(o, t) { return 'd' + (o.seed || 0) + 'y' + SpriteCache.phase(t, 1.5, 6); } });
SpriteCache.register('cow', { box: [-90, -90, 90, 90], buckets: 4, key(o, t) { return 'z' + Math.round((o.size || 1) * 10) + 'm' + (o.moving ? SpriteCache.phase(t, 8, 6) : 'x'); } });
SpriteCache.register('pat', { buckets: 1, key(o, t) { return 'z' + Math.round((o.size || 1) * 10) + 'r' + Math.round((o.fresh || 0) * 4) + 'e' + (o.eggs ? 1 : 0) + 'g' + (o.maggots ? SpriteCache.phase(t, 6, 4) : 'x'); } });
