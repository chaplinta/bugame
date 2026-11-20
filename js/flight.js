'use strict';
// 3D flights (three.js, loaded only when needed). flightLevel({...}) builds a level from a description, so the
// flying, the camera, the shadow, the stops, the wind and the hunter are the same code in every one of them.
// Third-person camera behind the butterfly. Steer with the arrows or by dragging; Flap to climb; nose down to go faster.
// Two levels: the painted lady over Bold Park (below) and her cousin up the Thames (js/flight-london.js).

const Flight3D = {
  ready: false, failed: false, canvas: null, renderer: null,

  // Load three.js from the vendor folder the first time it is needed (works offline and from file://).
  load(cb) {
    if (window.THREE) { cb(); return; }
    // render3d.js loads three.js for the whole game; this is the same loader for when that is switched off.
    if (typeof Render3D !== 'undefined' && !Render3D.disabled) { Render3D.load().then(() => { if (!window.THREE) this.failed = true; cb(); }); return; }
    const s = document.createElement('script');
    s.src = 'vendor/three.min.js';
    s.onload = () => cb();
    s.onerror = () => { this.failed = true; cb(); };
    document.head.appendChild(s);
  },

  supported() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
    catch (e) { return false; }
  },

  show() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'game3d';
      $('stage').insertBefore(this.canvas, $('game'));
    }
    this.canvas.hidden = false;
    $('game').classList.add('over3d');
  },
  hide() {
    if (this.canvas) this.canvas.hidden = true;
    $('game').classList.remove('over3d');
  },
  // One renderer for every flight. A phone's screen has more pixels than it can fill at speed, so fewer are drawn there.
  gl() {
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      const touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      this.renderer.setPixelRatio(Math.min(touch ? 1.5 : 2, window.devicePixelRatio || 1));
    }
    return this.renderer;
  },
  // Free a finished level's shapes and pictures (the butterfly's own model is shared with the sprite renderer and kept).
  dispose(scene, keep) {
    const walk = (o) => {
      if (keep.includes(o)) return;
      if (o.geometry) o.geometry.dispose();
      for (const mt of o.material ? [].concat(o.material) : []) { if (mt.map) mt.map.dispose(); mt.dispose(); }
      for (const c of o.children) walk(c);
    };
    walk(scene);
  },
};

const FlightKit = {
  // Where one copy goes: place, size (one number, or three), turn about the upright, then tilt.
  mat(x, y, z, sx, sy, sz, ry, rx, rz) {
    const T = THREE;
    return new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0, 'YXZ')),
      new T.Vector3(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz));
  },
  // Many copies of one shape in a single draw call: a whole wood costs what one tree did.
  inst(scene, geo, mat, list, colours) {
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    for (let i = 0; i < list.length; i++) { im.setMatrixAt(i, list[i]); if (colours) im.setColorAt(i, colours[i]); }
    im.instanceMatrix.needsUpdate = true;
    if (colours && im.instanceColor) im.instanceColor.needsUpdate = true;
    im.frustumCulled = false;
    scene.add(im);
    return im;
  },
  // The sky behind everything: blue overhead, fading to the haze colour from the horizon down, so the far edge of
  // the ground (and whatever the camera no longer draws) melts into it
  sky(scene, top, haze) {
    const T = THREE, c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, top); gr.addColorStop(0.36, haze); gr.addColorStop(1, haze);
    x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    scene.background = tex;
  },
  // A soft dark blob to lie on the ground under something in the air: the way to judge height.
  shadow(scene) {
    const T = THREE, c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(0.6, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const m = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2;
    scene.add(m);
    return m;
  },
  put(sh, x, y, z, h, size) {
    sh.position.set(x, y + 0.12, z);
    sh.scale.setScalar(size * (1 + h * 0.025));
    sh.material.opacity = clamp(1 - h * 0.02, 0.3, 1);
  },
  // Streaks of moving air, to show where a wind is and which way it goes
  streaks(scene, n) {
    const T = THREE, im = new T.InstancedMesh(new T.BoxGeometry(0.07, 0.07, 1), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false, fog: false }), n);
    im.frustumCulled = false; im.visible = false;
    const r = rng(41);
    im.userData.seeds = Array.from({ length: n }, () => [r(), r(), r(), 0.6 + r() * 0.8]);
    scene.add(im);
    return im;
  },
  blow(im, w, fl, t) {
    im.visible = !!w;
    if (!w) return;
    const box = 90, yaw = Math.atan2(w.x, w.z), m = new THREE.Matrix4(), wrap = (v) => ((v % box) + box) % box - box / 2;
    im.userData.seeds.forEach((s, i) => {
      const along = t * w.sp * 2.2 * s[3];
      m.copy(this.mat(fl.x + wrap(s[0] * box + w.x * along - fl.x), w.y0 + 1 + s[1] * (w.y1 - w.y0 - 1), fl.z + wrap(s[2] * box + w.z * along - fl.z), 1, 1, 3 + s[3] * 4, yaw));
      im.setMatrixAt(i, m);
    });
    im.instanceMatrix.needsUpdate = true;
  },
  // What is under and over a point: ground or a roof to settle on, a bridge to stay under, a wall to be turned by.
  // A solid is a box: { x, z, hw, hd, c, s (its turn), y0, y1, r2 }.
  probe(m, fl, x, z, y) {
    const out = { floor: m.ground(x, z), roof: Infinity, px: 0, pz: 0 };
    for (const s of fl.solids) {
      const dx = x - s.x, dz = z - s.z;
      if (dx * dx + dz * dz > s.r2) continue;
      const lx = dx * s.c - dz * s.s, lz = dx * s.s + dz * s.c;
      if (Math.abs(lx) > s.hw || Math.abs(lz) > s.hd) continue;
      if (y >= s.y1 - 1.2 || (s.y0 > 0 && y > (s.y0 + s.y1) / 2)) out.floor = Math.max(out.floor, s.y1);
      else if (s.y0 > 0) out.roof = Math.min(out.roof, s.y0);
      else {
        const ex = s.hw - Math.abs(lx), ez = s.hd - Math.abs(lz);
        if (ex < ez) { const d = (lx < 0 ? -1 : 1) * (ex + 0.05); out.px += d * s.c; out.pz -= d * s.s; }
        else { const d = (lz < 0 ? -1 : 1) * (ez + 0.05); out.px += d * s.s; out.pz += d * s.c; }
      }
    }
    return out;
  },
  solid(x, z, w, d, ry, y0, y1) { return { x, z, hw: w / 2, hd: d / 2, c: Math.cos(ry || 0), s: Math.sin(ry || 0), y0, y1, r2: (w * w + d * d) / 4 + 1 }; },
  // Pops and sparkles, drawn over the 3D picture (the engine draws them only into its own 2D worlds)
  fx(ctx, g) {
    for (const q of g.parts) { ctx.globalAlpha = Math.min(1, q.life * 2); ell(ctx, q.x, q.y, 3, 3, q.c); }
    ctx.textAlign = 'center'; ctx.font = 'bold 22px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,30,20,.65)'; ctx.lineJoin = 'round';
    for (const f of g.fx) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      const y = f.y - (1 - f.life) * 30;
      ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.color || '#fff'; ctx.fillText(f.text, f.x, y);
    }
    ctx.globalAlpha = 1;
    if (g.flash > 0) { ctx.fillStyle = 'rgba(200,40,30,' + g.flash * 0.6 + ')'; ctx.fillRect(0, 0, W, H); }
  },
};

// Wing picture for the plain 3D butterfly, painted on a canvas: forewing and hindwing of the right side.
function wingTexture(sprite) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.translate(20, 128); ctx.scale(7, 7);
  ctx.rotate(-Math.PI / 2);
  // Reuse the 2D butterfly's wing shapes: draw it and keep one side.
  ctx.save(); ctx.beginPath(); ctx.rect(-30, 0, 60, 40); ctx.clip();
  Sprites[sprite](ctx, { landed: false, paint: sprite === 'butterfly' && typeof Paint !== 'undefined' ? Paint.stamp('butterfly') : undefined }, Math.PI / 36);   // wings fully open, in your design if you painted one
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeButterfly(T, sprite) {
  // The sprite model, turned from its ground frame (x forward, z up) into the flight scene (z forward, y up)
  if (typeof Models !== 'undefined' && typeof Render3D !== 'undefined' && Render3D.ok && Models.has(sprite)) {
    try {
      const root = Models.build(sprite, { landed: false, paint: sprite === 'butterfly' && typeof Paint !== 'undefined' ? Paint.stamp('butterfly') : undefined }), mirror = new T.Group(), wrap = new T.Group(), g = new T.Group();
      mirror.scale.set(1, -1, 1); mirror.add(root);
      wrap.setRotationFromMatrix(new T.Matrix4().makeBasis(new T.Vector3(0, 0, 1), new T.Vector3(1, 0, 0), new T.Vector3(0, 1, 0)));
      wrap.add(mirror); wrap.scale.setScalar(0.12); wrap.position.y = -0.5; g.add(wrap);
      g.userData.wings = root.userData.wings.map((w) => ({ hinge: w.hinge, s: w.s, axis: 'x' }));
      g.userData.shared = true;
      return g;
    } catch (e) { /* fall through to the plain one */ }
  }
  const g = new T.Group();
  const bodyMat = new T.MeshLambertMaterial({ color: '#3a2c22' });
  const body = new T.Mesh(new T.CapsuleGeometry ? new T.CapsuleGeometry(0.12, 1.1, 4, 8) : new T.CylinderGeometry(0.12, 0.12, 1.3, 8), bodyMat);
  body.rotation.x = Math.PI / 2; g.add(body);
  const head = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), bodyMat); head.position.z = 0.75; g.add(head);
  for (const s of [-1, 1]) {
    const ant = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.8, 3), bodyMat);
    ant.position.set(s * 0.15, 0.25, 1.1); ant.rotation.x = 1.1; ant.rotation.z = -s * 0.3; g.add(ant);
  }
  const tex = wingTexture(sprite);
  const wingMat = new T.MeshLambertMaterial({ map: tex, transparent: true, side: T.DoubleSide, alphaTest: 0.1 });
  g.userData.wings = [];
  for (const s of [-1, 1]) {
    const hinge = new T.Group();
    const w = new T.Mesh(new T.PlaneGeometry(3, 3), wingMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(s * 1.5, 0, 0);
    if (s < 0) w.scale.x = -1;
    hinge.add(w);
    g.add(hinge);
    g.userData.wings.push({ hinge, s });
  }
  return g;
}

// A flower to land on, with a ring over it: an everlasting daisy by default.
function makeFlower(T, kind) {
  const g = new T.Group();
  const stem = new T.Mesh(new T.CylinderGeometry(0.12, 0.15, 3, 5), new T.MeshLambertMaterial({ color: '#4a7a3a' }));
  stem.position.y = 1.5; g.add(stem);
  const petalMat = new T.MeshLambertMaterial({ color: kind === 'pink' ? '#f4a0c8' : kind === 'yellow' ? '#f2d040' : '#ffffff', side: T.DoubleSide });
  const petal = new T.SphereGeometry(0.6, 6, 4);
  for (let k = 0; k < 14; k++) {
    const p = new T.Mesh(petal, petalMat);
    p.scale.set(1.6, 0.25, 0.6);
    const a = k / 14 * TAU;
    p.position.set(Math.cos(a) * 1.1, 3, Math.sin(a) * 1.1);
    p.rotation.y = -a;
    g.add(p);
  }
  const disc = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.3, 12), new T.MeshLambertMaterial({ color: '#f2b020' }));
  disc.position.y = 3.1; g.add(disc);
  return g;
}
function flightRing(T, y) {
  const ring = new T.Mesh(new T.TorusGeometry(2.4, 0.18, 8, 32), new T.MeshBasicMaterial({ color: '#ffe060', transparent: true, opacity: 0.8 }));
  ring.position.y = y; ring.rotation.x = Math.PI / 2;
  return ring;
}

function makeWagtail(T) {
  const g = new T.Group();
  const black = new T.MeshLambertMaterial({ color: '#1a1a1a' }), white = new T.MeshLambertMaterial({ color: '#f4f4f4' });
  const body = new T.Mesh(new T.SphereGeometry(0.8, 10, 8), black); body.scale.set(0.8, 0.8, 1.4); g.add(body);
  const belly = new T.Mesh(new T.SphereGeometry(0.7, 10, 8), white); belly.scale.set(0.75, 0.6, 1.2); belly.position.y = -0.25; g.add(belly);
  const head = new T.Mesh(new T.SphereGeometry(0.55, 10, 8), black); head.position.set(0, 0.3, 1.1); g.add(head);
  for (const s of [-1, 1]) { const brow = new T.Mesh(new T.SphereGeometry(0.1, 6, 4), white); brow.position.set(s * 0.32, 0.55, 1.35); g.add(brow); }
  const tail = new T.Mesh(new T.BoxGeometry(0.6, 0.08, 1.6), black); tail.position.set(0, 0.2, -1.6); g.add(tail);
  g.userData.wings = [];
  for (const s of [-1, 1]) {
    const hinge = new T.Group();
    const w = new T.Mesh(new T.BoxGeometry(1.8, 0.06, 0.9), black); w.position.x = s * 0.9; hinge.add(w);
    hinge.position.set(s * 0.4, 0.2, 0); g.add(hinge); g.userData.wings.push({ hinge, s });
  }
  return g;
}

// A 3D flight. The description gives: start(g), ground(x, z), layout(g) (fills g.fl.flowers, and g.fl.solids if any),
// scenery(scene, g, T) (may return { frame(g, dt) }), keep(g, fl) (the edge of the level), and optionally
// can(g, f), verb(g, f), done(g, f), stop(T, f) (a stop's own model), hunter, windNow(g, fl), sights, tick, overlay.
function flightLevel(def) {
  const m = {
    view: '3d', escape: 'Fly', action: 'Flap', radius: 18, speed: 0, scale: 2, discoveries: [],
    cruise: 9, slow: 6, fast: 13, ceiling: 40, model: 'butterfly', sky: '#9fd4f2',
    noNet: true,   // no bug net up in the air
    get home() { return { x: W / 2, y: H / 2, r: 1, label: '' }; },   // the middle of the view, whatever its width
    explore(g) { return !g.noGL && !!g.fl3d; },   // without the 3D flight the butterfly flies off on its own: nothing to explore
    can() { return true; },
    verb() { return 'Sip'; },
    done() {},
    yum() { return 'Yum!'; },
    keep() {},
    stop(T, f) { return makeFlower(T, f.kind); },
    // The stop the arrow points at: the nearest one still to do
    target(g) {
      const fl = g.fl, left = fl.flowers.filter(f => !f.visited && this.can(g, f));
      return left.length ? left.reduce((a, c) => Math.hypot(c.x - fl.x, c.z - fl.z) < Math.hypot(a.x - fl.x, a.z - fl.z) ? c : a) : null;
    },

    setup(g) {
      const p = g.player, st = this.start(g);
      p.flat = true;
      g.fl = { x: st.x, y: st.y, z: st.z, yaw: st.yaw || 0, vy: 0, sp: 0, turn: 0, bank: 0, flap: 0, flying: false, landed: null, sipT: 0, wingT: 0, orbit: 0, lowT: 0, windK: 0,
        flowers: [], solids: [], bird: null, birdT: this.hunter ? this.hunter.first : 1e9, camPos: null, camLook: null, floor: this.ground(st.x, st.z) };
      this.layout(g);
      g.fl3d = null;
      if (this.sights) { g.spied = new Set(typeof Progress !== 'undefined' ? Progress.sights(this.id) : []); g.spyT = {}; }
      if (!Flight3D.supported()) { this.noGL(g); return; }
      Flight3D.show();
      Flight3D.load(() => {
        if (Game.g !== g) return;
        if (!window.THREE || Flight3D.failed) { this.noGL(g); return; }
        try { this.build(g); } catch (e) { this.noGL(g); }
      });
    },
    noGL(g) {
      Flight3D.hide();
      g.noGL = true;
      Game.fact('nodgl');
      Game.later(3, () => { g.score = this.goal; });
    },
    teardown(g) {
      Flight3D.hide();
      if (g && g.fl3d) { try { Flight3D.dispose(g.fl3d.scene, g.fl3d.bf.userData.shared ? [g.fl3d.bf] : []); } catch (e) { /* the page is closing */ } g.fl3d = null; }
    },
    build(g) {
      const T = THREE, fl = g.fl, R = Flight3D.gl();
      const scene = new T.Scene();
      const world = this.scenery(scene, g, T) || {};
      if (typeof Render3D !== 'undefined' && Render3D.ok) { try { scene.environment = Render3D.envMap(R); } catch (e) { /* plain lighting then */ } }
      const camera = new T.PerspectiveCamera(60, W / H, 0.1, this.far || 400);
      const bf = makeButterfly(T, this.model); bf.rotation.order = 'YXZ'; scene.add(bf);
      for (const f of fl.flowers) {
        const mesh = this.stop(T, f), ring = flightRing(T, f.ringY || 7);
        mesh.add(ring); mesh.userData.ring = ring;
        mesh.position.set(f.x, f.y, f.z); scene.add(mesh); f.mesh = mesh;
      }
      const d = { scene, camera, bf, world, shadow: FlightKit.shadow(scene), bird: null, birdShadow: null, streaks: this.windNow ? FlightKit.streaks(scene, 70) : null };
      if (this.hunter) { d.bird = this.hunter.make(T); d.bird.visible = false; scene.add(d.bird); d.birdShadow = FlightKit.shadow(scene); d.birdShadow.visible = false; }
      g.fl3d = d;
    },
    locked() { return false; },

    // The wind where the butterfly is: { x, z, k } (k: how far into the stream she is, 0 to 1), or null for still air
    air(g, fl) {
      const w = this.windNow ? this.windNow(g, fl) : null;
      if (!w) return null;
      const k = clamp((fl.y - w.y0) / 4, 0, 1);
      return { x: w.x * w.sp * k, z: w.z * w.sp * k, k };
    },
    move(g, dt, dx, dy) {
      const fl = g.fl;
      if (!fl || fl.landed || !fl.flying) return;
      fl.turn += (dx - fl.turn) * (1 - Math.exp(-dt * 9));   // eased, so the lean and the camera don't snap
      fl.yaw -= dx * 2.4 * dt;
      fl.vy += (-dy * 5 - 2.2) * dt;    // up arrow (or dragging up) climbs a little, down dives; otherwise a slow glide down
      if (dy <= 0.2 && fl.vy < -2.4) fl.vy += (-2.4 - fl.vy) * Math.min(1, dt * 4);   // a glide sinks gently: only a dive drops fast
      fl.vy = clamp(fl.vy, -5.5, 5);
      const want = clamp(this.cruise - fl.vy * 0.9, this.slow, this.fast);   // nose down gains speed, a climb costs it
      fl.sp += (want - fl.sp) * (1 - Math.exp(-dt * 1.8));
      const w = this.air(g, fl);
      fl.windK += ((w ? w.k : 0) - fl.windK) * (1 - Math.exp(-dt * 3));
      fl.x += (Math.sin(fl.yaw) * fl.sp + (w ? w.x : 0)) * dt;
      fl.z += (Math.cos(fl.yaw) * fl.sp + (w ? w.z : 0)) * dt;
      fl.y += fl.vy * dt;
      this.keep(g, fl);
      const pr = FlightKit.probe(this, fl, fl.x, fl.z, fl.y);
      fl.x += pr.px; fl.z += pr.pz;
      if (fl.y < pr.floor + 1) { fl.y = pr.floor + 1; fl.vy = Math.max(0, fl.vy); }
      if (fl.y > pr.roof - 0.7) { fl.y = pr.roof - 0.7; fl.vy = Math.min(0, fl.vy); }
      fl.y = Math.min(fl.y, this.ceiling);
      fl.floor = pr.floor;
      fl.bank = clamp(-fl.turn * 0.7, -0.7, 0.7);
    },
    update(g, dt, input) {
      const fl = g.fl, p = g.player;
      p.x = W / 2; p.y = H / 2;
      if (g.noGL) { setAction('Flap', false); return; }
      fl.wingT += dt;
      // Flap: take off, then climb
      if (!fl.flying && !fl.landed) {
        setAction('Flap', true);
        if (input.pressed || input.held) { fl.flying = true; fl.vy = 4; fl.sp = this.cruise; Sound.play('jump'); Game.fact('takeoff'); }
        if (p.stillT > 3) Game.hint('Press Flap to take off!');
        return;
      }
      if (this.sights) this.spy(g, dt);
      if (this.tick) this.tick(g, dt, input);
      if (fl.landed) {
        const f = fl.landed, verb = this.verb(g, f), need = f.hold || 1.1;
        fl.orbit += dt * 0.55;   // the camera swings round for a look
        setAction(verb, true);
        if (working(input)) {
          fl.sipT += work(input, dt);
          p.progress = fl.sipT / need;
          Game.fact(verb === 'Sip' ? 'sip' : 'lay');
          if (fl.sipT >= need) {
            f.visited = true; g.score++; fl.sipT = 0; fl.landed = null; fl.vy = 4; fl.sp = this.cruise; fl.last = f;
            Sound.play('score'); Game.pop(W / 2, H / 2 - 40, this.yum(g, f), '#ffd23f');
            if (f.mesh) f.mesh.userData.ring.visible = false;
            this.done(g, f);
          }
        } else if (p.stillT > 3) Game.hint(verb === 'Sip' ? 'Hold Sip to drink the nectar.' : 'Hold ' + verb + '.');
        return;
      }
      fl.orbit = 0;
      setAction('Flap', true);
      if (input.pressed) { fl.vy = Math.min(5, fl.vy + 3.2); fl.flap = 0.35; Sound.play('tap'); }
      if (input.held) fl.vy = Math.min(5, fl.vy + 6 * dt);
      fl.flap = Math.max(0, fl.flap - dt);
      if (fl.vy < -1) Game.fact('glide');
      if (fl.sp > this.cruise + 2.5) Game.fact('dive');
      // Land on a stop you haven't visited, by flying down into its ring
      for (const f of fl.flowers) {
        if (f.visited || !this.can(g, f)) continue;
        if (Math.hypot(f.x - fl.x, f.z - fl.z) < 3.2 && fl.y < f.y + 9) {
          fl.landed = f; fl.flying = true; fl.x = f.x; fl.z = f.z; fl.y = f.y + (f.perch || 3.4); fl.vy = 0; fl.turn = 0; fl.bank = 0;
          Sound.play('pick'); Game.pop(W / 2, H / 2 - 40, 'Landed!', '#fff');
          return;
        }
      }
      if (this.hunter) this.hunt(g, dt);
    },

    // The hunter: seen first, wheeling round you with its shadow on the ground, and only then does it come.
    // Diving away outruns it, a hard turn slips it, and flying low among the plants loses it.
    hunt(g, dt) {
      const fl = g.fl, p = g.player, hn = this.hunter;
      fl.birdT -= dt;
      if (!fl.bird && fl.birdT <= 0 && g.score >= hn.from) {
        const a = fl.yaw + (Math.random() < 0.5 ? 0.6 : -0.6);
        fl.bird = { a, x: fl.x + Math.sin(a) * 16, y: fl.y + 7, z: fl.z + Math.cos(a) * 16, yaw: a + Math.PI / 2, t: 0, state: 'watch' };
        g.toasts.unshift({ text: hn.warn, kind: 'hint' }); g.toastT = 0;
        Sound.tone(2300, 0.09, 'sine', 0.14, 2900); Sound.tone(2700, 0.09, 'sine', 0.14, 2100, 0.13);
        Game.fact(hn.fact);
      }
      const b = fl.bird;
      if (!b) return;
      b.t += dt;
      if (b.state === 'watch') {   // round and round overhead, well in view
        b.a += dt * 0.9;
        b.x = fl.x + Math.sin(b.a) * 16; b.z = fl.z + Math.cos(b.a) * 16; b.y += (fl.y + 7 - b.y) * Math.min(1, dt * 2); b.yaw = b.a + Math.PI / 2;
        if (b.t > hn.watch) { b.state = 'stoop'; b.t = 0; fl.lowT = 0; b.yaw = Math.atan2(fl.x - b.x, fl.z - b.z); Sound.play('caught'); }
        return;
      }
      if (b.state === 'stoop') {
        const want = Math.atan2(fl.x - b.x, fl.z - b.z);
        let d = want - b.yaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
        b.yaw += clamp(d, -1.1 * dt, 1.1 * dt);
        b.x += Math.sin(b.yaw) * 10 * dt; b.z += Math.cos(b.yaw) * 10 * dt;
        b.y += clamp(fl.y - b.y, -3 * dt, 3 * dt);
        fl.lowT = fl.y - fl.floor < 2.6 ? fl.lowT + dt : 0;
        if (fl.lowT > 1) { b.state = 'leave'; b.t = 0; Game.pop(W / 2, H / 2 - 70, 'It lost you!', '#fff'); Sound.play('score'); }
        else if (p.invuln <= 0 && Math.hypot(b.x - fl.x, b.y - fl.y, b.z - fl.z) < 1.6) {
          b.state = 'leave'; b.t = 0;
          Game.caught({ name: hn.name, state: 'chase' });
          const st = this.start(g);
          fl.x = st.x; fl.z = st.z; fl.y = st.y + 3; fl.vy = 2; fl.landed = null;
          p.x = W / 2; p.y = H / 2;
        } else if (b.t > 7) { b.state = 'leave'; b.t = 0; }
        return;
      }
      b.x += Math.sin(b.yaw) * 14 * dt; b.z += Math.cos(b.yaw) * 14 * dt; b.y += 3 * dt;   // off it goes
      if (b.t > 4) { fl.bird = null; fl.birdT = hn.gap[0] + Math.random() * (hn.gap[1] - hn.gap[0]); }
    },

    // London's I-spy from the air: a sight is ticked once it has been ahead of you, near enough to make out, for half a second
    spy(g, dt) {
      const fl = g.fl, fx = Math.sin(fl.yaw), fz = Math.cos(fl.yaw);
      for (const s of this.sights) {
        if (g.spied.has(s.key)) continue;
        const dx = s.x - fl.x, dz = s.z - fl.z, dd = Math.hypot(dx, dz) || 1;
        const on = dd < (s.r || 110) && (dx * fx + dz * fz) / dd > 0.8;
        g.spyT[s.key] = on ? (g.spyT[s.key] || 0) + dt : 0;
        if (g.spyT[s.key] < 0.5) continue;
        g.spied.add(s.key);
        if (typeof Progress !== 'undefined') Progress.addSight(this.id, s.key);
        Sound.play('spot'); Game.pop(W / 2, 150, 'Spotted: ' + s.name, '#ffd23f');
      }
    },
    findText(g) { return this.sights ? '\u{1F440} ' + this.sights.filter(s => g.spied.has(s.key)).length + ' / ' + this.sights.length : ''; },

    // Where the camera sits: behind and above, further back the higher and faster she flies, turned a little into
    // the bend. It closes on that place by the clock, not by the frame, so a slow phone sees the same flight.
    cam(g, dt) {
      const fl = g.fl, k = 1 - Math.exp(-dt * 6);
      const back = 6.5 + clamp((fl.y - fl.floor) * 0.1, 0, 3) + clamp((fl.sp - this.cruise) * 0.25, -0.5, 1.2) + fl.windK * 1.5;
      const yaw = fl.yaw + (fl.landed ? fl.orbit : fl.turn * 0.3);
      const want = { x: fl.x - Math.sin(yaw) * back, y: fl.y + 3 + back * 0.3, z: fl.z - Math.cos(yaw) * back };
      const look = fl.landed ? { x: fl.x, y: fl.y - 0.4, z: fl.z } : { x: fl.x + Math.sin(fl.yaw - fl.turn * 0.25) * 5, y: fl.y + 0.5, z: fl.z + Math.cos(fl.yaw - fl.turn * 0.25) * 5 };
      if (!fl.camPos) { fl.camPos = want; fl.camLook = look; }
      for (const a of ['x', 'y', 'z']) { fl.camPos[a] += (want[a] - fl.camPos[a]) * k; fl.camLook[a] += (look[a] - fl.camLook[a]) * (1 - Math.exp(-dt * 10)); }
      const under = FlightKit.probe(this, fl, fl.camPos.x, fl.camPos.z, fl.camPos.y);
      fl.camPos.y = Math.max(fl.camPos.y, under.floor + 1.2);   // never under the ground or inside a roof
    },

    render(ctx, g) {
      const fl = g.fl, d = g.fl3d;
      ctx.clearRect(0, 0, W, H);
      if (g.noGL || !d) {
        ctx.fillStyle = this.sky; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#2b2118'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(g.noGL ? 'This device can’t show 3D. Off you fly!' : 'Getting ready to fly…', W / 2, H / 2);
        return;
      }
      const R = Flight3D.renderer, cv = Flight3D.canvas;
      const w = cv.clientWidth, h = cv.clientHeight;
      if (w && (cv.width !== Math.floor(w * R.getPixelRatio()) || cv.height !== Math.floor(h * R.getPixelRatio()))) R.setSize(w, h, false);
      const dt = clamp(g.t - (d.t === undefined ? g.t : d.t), 0, 0.1); d.t = g.t;
      const air = fl.flying && !fl.landed;
      // Butterfly: position, heading, lean into the turn, nose up in a climb and down in a dive, flapping wings
      const bf = d.bf;
      bf.position.set(fl.x, fl.y, fl.z);
      bf.rotation.set((air ? -0.4 : 0) + clamp(-fl.vy * 0.07, -0.3, 0.35), fl.yaw, air ? fl.bank : 0);
      const flapSpeed = fl.landed ? 2 : fl.flying ? (fl.flap > 0 || fl.vy > 0 ? 22 : 9) : 1.5;
      const open = fl.landed ? 0.9 + Math.sin(fl.wingT * flapSpeed) * 0.25 : 0.15 + Math.sin(fl.wingT * flapSpeed) * 0.7;
      for (const wg of bf.userData.wings) { const a = wg.s * (air ? open : 1.2 + Math.sin(fl.wingT * 2) * 0.1); if (wg.axis === 'x') wg.hinge.rotation.x = a; else wg.hinge.rotation.z = a; }
      FlightKit.put(d.shadow, fl.x, fl.floor, fl.z, fl.y - fl.floor, 1.5);
      // Stops: rings spin and bob; one you can reach from here glows
      const tg = this.target(g);
      for (const f of fl.flowers) if (f.mesh) {
        const rg = f.mesh.userData.ring, open = !f.visited && this.can(g, f);
        rg.visible = open && fl.landed !== f;
        if (!rg.visible) continue;
        const near = Math.hypot(f.x - fl.x, f.z - fl.z) < 14 && !fl.landed;
        rg.rotation.z += dt * 1.2; rg.position.y = (f.ringY || 7) + Math.sin(g.t * 2 + f.x) * 0.4;
        rg.scale.setScalar(near ? 1.15 + Math.sin(g.t * 9) * 0.1 : f === tg ? 1.05 : 1);
        rg.material.color.set(near ? '#ffffff' : '#ffe060'); rg.material.opacity = near ? 1 : 0.8;
      }
      // Hunter and its shadow
      const b = fl.bird;
      if (d.bird) {
        d.bird.visible = d.birdShadow.visible = !!b;
        if (b) {
          d.bird.position.set(b.x, b.y, b.z); d.bird.rotation.y = b.yaw; d.bird.rotation.z = b.state === 'watch' ? -0.35 : 0;
          for (const wg of d.bird.userData.wings) wg.hinge.rotation.z = wg.s * Math.sin(g.t * (b.state === 'watch' ? 9 : 18)) * 0.8;
          const gy = this.ground(b.x, b.z);
          FlightKit.put(d.birdShadow, b.x, gy, b.z, b.y - gy, 2.2);
        }
      }
      if (d.streaks) FlightKit.blow(d.streaks, this.windNow(g, fl), fl, g.t);
      if (d.world.frame) d.world.frame(g, dt);
      // Camera
      this.cam(g, dt);
      d.camera.position.set(fl.camPos.x, fl.camPos.y, fl.camPos.z);
      d.camera.lookAt(fl.camLook.x, fl.camLook.y, fl.camLook.z);
      d.camera.aspect = w && h ? w / h : W / H;
      d.camera.fov = 60 + clamp((fl.sp - this.cruise) * 1.5, -3, 6) + fl.windK * 5;   // the view opens out with speed
      d.camera.updateProjectionMatrix();
      R.render(d.scene, d.camera);

      // 2D overlay: an arrow to the next stop at the edge of the screen, and how far it is
      if (tg && !fl.landed) {
        let rel = Math.atan2(tg.x - fl.x, tg.z - fl.z) - fl.yaw;
        while (rel > Math.PI) rel -= TAU; while (rel < -Math.PI) rel += TAU;
        const dist3 = Math.hypot(tg.x - fl.x, tg.z - fl.z);
        ctx.save(); ctx.translate(W / 2 - Math.sin(rel) * 140, H - 190 - Math.cos(rel) * 40); ctx.rotate(-rel - Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-10, -14); ctx.lineTo(-4, 0); ctx.lineTo(-10, 14); ctx.closePath();
        ctx.fillStyle = 'rgba(255,210,63,' + (0.7 + Math.sin(g.t * 6) * 0.3) + ')'; ctx.fill();
        ctx.strokeStyle = 'rgba(90,60,10,.6)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(dist3 < 14 && fl.y > tg.y + 9 ? 'Down into the ring!' : Math.round(dist3) + ' m', W / 2, H - 132);
      }
      if (b && b.state !== 'leave') {
        ctx.fillStyle = b.state === 'watch' ? '#e8a020' : '#c0392b'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', W / 2, 90);
        ctx.font = 'bold 16px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(b.state === 'watch' ? 'It has seen you. Get down low!' : 'Dive, turn, or hide down low!', W / 2, 112);
      }
      // Nectar bar: it drains as she drinks (or an egg on its way)
      if (fl.landed) {
        const k = clamp(fl.sipT / (fl.landed.hold || 1.1), 0, 1), sip = this.verb(g, fl.landed) === 'Sip', bw = 150;
        ctx.fillStyle = 'rgba(40,30,20,.55)'; ctx.fillRect(W / 2 - bw / 2 - 3, H / 2 - 98, bw + 6, 20);
        ctx.fillStyle = sip ? '#ffb03a' : '#bfe08a'; ctx.fillRect(W / 2 - bw / 2, H / 2 - 95, bw * (sip ? 1 - k : k), 14);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(sip ? 'Nectar' : 'Egg', W / 2, H / 2 - 104);
      }
      // Height bar, with the band where the wind blows
      const hk = clamp((fl.y - fl.floor) / 30, 0, 1), wn = this.windNow ? this.windNow(g, fl) : null;
      ctx.fillStyle = 'rgba(255,250,240,.7)'; ctx.fillRect(16, 140, 14, 200);
      if (wn) { const wk = clamp((wn.y0 + 2 - fl.floor) / 30, 0, 1); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillRect(13, 140, 20, 200 * (1 - wk)); ctx.fillStyle = '#7a8a9a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('wind', 36, 152); }
      ctx.fillStyle = '#4fc3f7'; ctx.fillRect(16, 140 + 200 * (1 - hk), 14, 200 * hk);
      ctx.fillStyle = '#2b2118'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Height', 10, 132);
      if (this.overlay) this.overlay(ctx, g);
      FlightKit.fx(ctx, g);
    },
    goalPoint() { return null; },
    won(g) { return g.score >= this.goal; },
  };
  Object.defineProperties(m, Object.getOwnPropertyDescriptors(def));
  return m;
}

// ------------------------------------------------------------------ Bold Park
function heathHeight(x, z) {
  const hills = Math.sin(x * 0.03) * 2.2 + Math.cos(z * 0.025) * 2 + Math.sin((x + z) * 0.06) * 0.8;
  const k = clamp((x + 196) / 40, 0, 1), land = k * k * (3 - 2 * k);   // in the west the dunes run down to the beach
  return hills * land - 0.5 * (1 - land);
}
const HEATH_SEA = -0.2;   // sea level: the beach goes under it at about x = -190

function buildHeath(scene, T) {
  const K = FlightKit, r = rng(99);
  K.sky(scene, '#8fcbf0', '#cfe8f4');
  scene.fog = new T.Fog('#cfe8f4', 60, 190);
  scene.add(new T.HemisphereLight('#dff2ff', '#7a8a4a', 1.1));
  const sun = new T.DirectionalLight('#fff4d8', 1.6);
  sun.position.set(-60, 90, 40);
  scene.add(sun);
  // Ground with gentle hills and patchy colour, pale sand where it runs down to the sea
  const geo = new T.PlaneGeometry(400, 400, 80, 80);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = [];
  const cA = new T.Color('#9ab65a'), cB = new T.Color('#c8b878'), cC = new T.Color('#6a9a4a'), sand = new T.Color('#ecdfb4'), tmp = new T.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, heathHeight(x, z));
    const n = (Math.sin(x * 0.11) + Math.cos(z * 0.13) + Math.sin((x - z) * 0.05)) / 3;
    tmp.copy(cA).lerp(n > 0.2 ? cB : cC, Math.abs(n)).lerp(sand, clamp((-158 - x) / 14, 0, 1));
    cols.push(tmp.r, tmp.g, tmp.b);
  }
  geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  scene.add(new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true })));
  // The Indian Ocean to the west, with lines of surf running in, and Rottnest low on the horizon
  const sea = new T.Mesh(new T.PlaneGeometry(520, 800), new T.MeshLambertMaterial({ color: '#3f93c8' }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(-446, HEATH_SEA, 0); scene.add(sea);
  const surf = [];
  for (let i = 0; i < 3; i++) {
    const s = new T.Mesh(new T.PlaneGeometry(2.2, 420), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.set(-192, HEATH_SEA + 0.06, 0); scene.add(s); surf.push(s);
  }
  const far = new T.MeshBasicMaterial({ color: '#8fb4c2', fog: false });
  const rotto = new T.Mesh(new T.SphereGeometry(1, 12, 6), far); rotto.scale.set(22, 2.4, 84); rotto.position.set(-640, 0, 170); scene.add(rotto);
  const light = new T.Mesh(new T.CylinderGeometry(0.7, 0.9, 6, 6), new T.MeshBasicMaterial({ color: '#f4f6f4', fog: false })); light.position.set(-640, 4.6, 150); scene.add(light);
  // Perth city skyline in the distance to the east, on a painted billboard
  const sc = document.createElement('canvas'); sc.width = 512; sc.height = 256;
  const sctx = sc.getContext('2d');
  drawPerthSkyline(sctx, 70, 250, 360, 1, 0);   // the fog does the haze
  const stex = new T.CanvasTexture(sc); stex.colorSpace = T.SRGBColorSpace;
  for (const [x, z, ry] of [[195, -40, -Math.PI / 2], [150, -150, -Math.PI / 4]]) {
    const city = new T.Mesh(new T.PlaneGeometry(90, 45), new T.MeshBasicMaterial({ map: stex, transparent: true, fog: true }));
    city.position.set(x, 18, z); city.rotation.y = ry; scene.add(city);
  }
  const blob = new T.IcosahedronGeometry(1, 1), rough = new T.IcosahedronGeometry(1, 0), cyl = new T.CylinderGeometry(0.75, 1, 1, 6), rod = new T.CylinderGeometry(1, 1, 1, 6), blade = new T.ConeGeometry(1, 1, 3);
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const cx = (r() - 0.5) * 360, cy = 45 + r() * 25, cz = (r() - 0.5) * 360;
    for (let k = 0; k < 5; k++) clouds.push(K.mat(cx + k * 5 - 10, cy + r() * 2, cz + r() * 4, 4 + r() * 4));
  }
  K.inst(scene, blob, new T.MeshLambertMaterial({ color: '#ffffff', emissive: '#556070' }), clouds);
  // Banksia and tuart woodland with grass trees, and kangaroo paws in flower
  const trunks = [], crowns = [], candles = [], tuartTrunks = [], tuartCrowns = [], gtTrunks = [], gtLeaves = [], gtSpikes = [];
  for (let i = 0; i < 84; i++) {
    const x = (r() - 0.5) * 300, z = (r() - 0.5) * 300, pick = r();
    if (Math.hypot(x, z) < 12 || x < -150) continue;
    const y = heathHeight(x, z);
    if (pick < 0.5) {
      const h = 4 + r() * 4;
      trunks.push(K.mat(x, y + h / 2, z, 0.5, h, 0.5));
      for (let k = 0; k < 4; k++) {
        const bx = x + (r() - 0.5) * 3, by = y + h + r() * 2, bz = z + (r() - 0.5) * 3, br = 2 + r() * 1.5;
        crowns.push(K.mat(bx, by, bz, br));
        candles.push(K.mat(bx + (r() - 0.5) * br, by + br * 0.75 + 0.5, bz + (r() - 0.5) * br, 0.34, 1.5, 0.34));   // the flower spikes stand up like candles
      }
    } else if (pick < 0.62) {
      const h = 11 + r() * 5;
      tuartTrunks.push(K.mat(x, y + h / 2, z, 0.7, h, 0.7));
      for (let k = 0; k < 6; k++) tuartCrowns.push(K.mat(x + (r() - 0.5) * 7, y + h + (r() - 0.3) * 4, z + (r() - 0.5) * 7, 2.6 + r() * 2));
    } else {
      const h = 1.5 + r() * 2;
      gtTrunks.push(K.mat(x, y + h / 2, z, 0.5, h, 0.5));
      for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; gtLeaves.push(K.mat(x + Math.cos(a) * 0.6, y + h + 0.8, z + Math.sin(a) * 0.6, 0.08, 3, 0.08, 0, Math.sin(a) * 0.9, -Math.cos(a) * 0.9)); }
      if (r() < 0.5) gtSpikes.push(K.mat(x, y + h + 2.1, z, 0.12, 2.6, 0.12));
    }
  }
  K.inst(scene, cyl, new T.MeshLambertMaterial({ color: '#6a4a2a' }), trunks);
  K.inst(scene, rough, new T.MeshLambertMaterial({ color: '#5a7a3a', flatShading: true }), crowns);
  K.inst(scene, rod, new T.MeshLambertMaterial({ color: '#e8b830' }), candles);
  K.inst(scene, cyl, new T.MeshLambertMaterial({ color: '#9a8e7c' }), tuartTrunks);
  K.inst(scene, rough, new T.MeshLambertMaterial({ color: '#4c6e3e', flatShading: true }), tuartCrowns);
  K.inst(scene, cyl, new T.MeshLambertMaterial({ color: '#2a2420' }), gtTrunks);
  K.inst(scene, blade, new T.MeshLambertMaterial({ color: '#7a9a3a' }), gtLeaves);
  K.inst(scene, rod, new T.MeshLambertMaterial({ color: '#9a7a4a' }), gtSpikes);
  const stems = [], paws = [];
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 290, z = (r() - 0.5) * 290;
    if (x < -150) continue;
    const y = heathHeight(x, z);
    for (let k = 0; k < 3; k++) {
      const a = r() * TAU, lean = 0.15 + r() * 0.2, h = 1.6 + r() * 0.8, sx = x + Math.cos(a) * 0.3, sz = z + Math.sin(a) * 0.3;
      stems.push(K.mat(sx + Math.sin(a) * lean * h / 2, y + h / 2, sz + Math.cos(a) * lean * h / 2, 0.05, h, 0.05, a, lean));
      paws.push(K.mat(sx + Math.sin(a) * (lean * h + 0.2), y + h + 0.04, sz + Math.cos(a) * (lean * h + 0.2), 0.09, 0.3, 0.09, a, 1.1));
    }
  }
  K.inst(scene, rod, new T.MeshLambertMaterial({ color: '#b8302a' }), stems);
  K.inst(scene, blob, new T.MeshLambertMaterial({ color: '#5e9a3c' }), paws);
  // Small wildflowers everywhere, for colour
  const dotGeo = new T.SphereGeometry(0.25, 5, 4);
  for (const col of ['#f0a0c8', '#f2d040', '#ffffff', '#c03030']) {
    const dots = [];
    for (let i = 0; i < 300; i++) { const x = (r() - 0.5) * 300, z = (r() - 0.5) * 300; if (x > -156) dots.push(K.mat(x, heathHeight(x, z) + 0.3, z, 1)); }
    K.inst(scene, dotGeo, new T.MeshLambertMaterial({ color: col }), dots);
  }
  return {
    frame(g) {   // the surf comes in, line after line
      surf.forEach((s, i) => { const k = (g.t * 0.22 + i / 3) % 1; s.position.x = -200 + k * 11; s.material.opacity = Math.sin(k * Math.PI) * 0.85; });
    },
  };
}

Missions.flight = flightLevel({
  id: 'flight', bug: 'butterfly', stage: 'Flying high', place: 'Above the heath, Bold Park',
  sprite: 'butterfly', bg: 'heath', goal: 6,
  facts: [
    'Painted ladies are strong fliers. Some fly hundreds of kilometres across Australia.',
    'Butterflies warm up in the sun before they fly. Cold wing muscles don’t work well.',
    'Fly like a butterfly! This one is in 3D.',
  ],
  how: [
    'Press Flap to take off, and keep flapping to climb.',
    'Steer with the arrow keys, or touch and drag left and right. Nose down to go faster.',
    'Fly to the glowing rings over the big flowers, then land and hold Sip.',
    'Visit 6 flowers. If the willie wagtail spots you, get down low!',
  ],
  factText: {
    start: 'A painted lady can see colours we can’t, like ultraviolet patterns on flowers.',
    takeoff: 'Butterflies fly by flapping their wings in a figure-eight, which makes swirls of air that lift them.',
    sip: 'A butterfly sips nectar through its proboscis, a long tube that uncurls like a party blower.',
    glide: 'Butterflies save energy by gliding between flaps.',
    wagtail: 'Willie wagtails catch insects in mid-air, twisting and turning as they fly.',
    pollen: 'Moving from flower to flower, butterflies carry pollen and help plants make seeds.',
    doctor: 'The Fremantle Doctor is Perth’s afternoon sea breeze. It blows in off the Indian Ocean and cools the city down.',
    nodgl: 'This device can’t show the 3D flight, so the butterfly flies off on its own.',
    win: 'Six flowers! A well-fed painted lady can live for a few weeks and fly a long way.',
  },
  hunter: { name: 'willie wagtail', make: makeWagtail, fact: 'wagtail', first: 25, gap: [30, 45], from: 1, watch: 3.5,
    warn: 'A willie wagtail! It has seen you. Get down low among the plants.' },

  start() { return { x: 0, y: heathHeight(0, 0) + 3.2, z: 0, yaw: 0 }; },
  ground: heathHeight,
  layout(g) {
    const r = rng(7);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + r() * 0.5, d = 35 + r() * 70;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      g.fl.flowers.push({ x, z, y: heathHeight(x, z), kind: ['pink', 'yellow', 'white'][i % 3], visited: false });
    }
  },
  keep(g, fl) { fl.x = clamp(fl.x, -186, 150); fl.z = clamp(fl.z, -150, 150); },
  scenery(scene, g, T) {
    const w = buildHeath(scene, T);
    // Empty chrysalis where you start
    const chrys = new T.Mesh(new T.SphereGeometry(0.5, 8, 6), new T.MeshLambertMaterial({ color: '#c8b88a' }));
    chrys.scale.set(0.7, 1.4, 0.7); chrys.position.set(0, heathHeight(0, 0) + 2.2, -0.6); scene.add(chrys);
    const twig = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 3.2, 5), new T.MeshLambertMaterial({ color: '#6a4a2a' }));
    twig.position.set(0, heathHeight(0, 0) + 1.5, -0.6); scene.add(twig);
    return w;
  },
  // The Fremantle Doctor comes in off the sea once the afternoon is under way: a south-westerly, blowing inland, up above the trees
  windNow(g, fl) { return g.score >= 2 ? { x: 0.82, z: -0.57, sp: 4.5, y0: fl.floor + 10, y1: fl.floor + 24 } : null; },
  done(g) {
    if (g.score === 2) { Game.fact('pollen'); Game.fact('doctor'); g.toasts.unshift({ text: 'Here comes the sea breeze! Up high it carries you inland. Down low the air is still.', kind: 'hint' }); g.toastT = 0; }
  },
  hud(g) {
    if (g.noGL) setHud('Flying off…', '');
    else if (!g.fl.flying) setHud('Press Flap to take off!', '');
    else setHud('Flowers: ' + g.score + ' / ' + this.goal, g.fl.landed ? 'Hold Sip' : '');
  },
});

Bugs.find(b => b.id === 'butterfly').stages.push('flight');
Missions.flight.sex = 'You are a female.';
finishMissions();
