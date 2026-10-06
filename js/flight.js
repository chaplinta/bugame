'use strict';
// Painted lady, third stage: fly in 3D over the Bold Park heath (three.js, loaded only when needed).
// Third-person camera behind the butterfly. Steer with the arrows or by dragging; Flap to climb.

const Flight3D = {
  ready: false, failed: false, canvas: null, renderer: null,

  // Load three.js from the vendor folder the first time it is needed (works offline and from file://).
  load(cb) {
    if (window.THREE) { cb(); return; }
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
};

// Wing picture for the 3D butterfly, painted on a canvas: forewing and hindwing of the right side.
function wingTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.translate(20, 128); ctx.scale(7, 7);
  ctx.rotate(-Math.PI / 2);
  // Reuse the 2D butterfly's wing shapes: draw it and keep one side.
  ctx.save(); ctx.beginPath(); ctx.rect(-30, 0, 60, 40); ctx.clip();
  Sprites.butterfly(ctx, { landed: false }, Math.PI / 36);   // wings fully open
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function heathHeight(x, z) {
  return Math.sin(x * 0.03) * 2.2 + Math.cos(z * 0.025) * 2 + Math.sin((x + z) * 0.06) * 0.8;
}

function buildHeath(scene) {
  const T = THREE, r = rng(99);
  scene.background = new T.Color('#9fd4f2');
  scene.fog = new T.Fog('#cfe8f4', 60, 190);
  scene.add(new T.HemisphereLight('#dff2ff', '#7a8a4a', 1.1));
  const sun = new T.DirectionalLight('#fff4d8', 1.6);
  sun.position.set(-60, 90, 40);
  scene.add(sun);
  // Ground with gentle hills and patchy colour
  const geo = new T.PlaneGeometry(400, 400, 80, 80);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, cols = [];
  const cA = new T.Color('#9ab65a'), cB = new T.Color('#c8b878'), cC = new T.Color('#6a9a4a'), tmp = new T.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, heathHeight(x, z));
    const n = (Math.sin(x * 0.11) + Math.cos(z * 0.13) + Math.sin((x - z) * 0.05)) / 3;
    tmp.copy(cA).lerp(n > 0.2 ? cB : cC, Math.abs(n));
    cols.push(tmp.r, tmp.g, tmp.b);
  }
  geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  scene.add(new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true })));
  // Distant sea to the west and white clouds
  const sea = new T.Mesh(new T.PlaneGeometry(400, 600), new T.MeshLambertMaterial({ color: '#4a9ad0' }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(-380, -1, 0); scene.add(sea);
  const cloudMat = new T.MeshLambertMaterial({ color: '#ffffff', emissive: '#556070' });
  for (let i = 0; i < 14; i++) {
    const g = new T.Group();
    for (let k = 0; k < 5; k++) { const m = new T.Mesh(new T.IcosahedronGeometry(4 + r() * 4, 1), cloudMat); m.position.set(k * 5 - 10, r() * 2, r() * 4); g.add(m); }
    g.position.set((r() - 0.5) * 360, 45 + r() * 25, (r() - 0.5) * 360);
    scene.add(g);
  }
  // Banksias and grass trees
  const trunkMat = new T.MeshLambertMaterial({ color: '#6a4a2a' });
  const leafMat = new T.MeshLambertMaterial({ color: '#5a7a3a', flatShading: true });
  const coneMat = new T.MeshLambertMaterial({ color: '#e8b830' });
  const gtTrunk = new T.MeshLambertMaterial({ color: '#2a2420' });
  const gtLeaf = new T.MeshLambertMaterial({ color: '#7a9a3a' });
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 300, z = (r() - 0.5) * 300;
    if (Math.hypot(x, z) < 12) continue;
    const y = heathHeight(x, z), t = new T.Group();
    if (r() < 0.6) {
      const h = 4 + r() * 4;
      const trunk = new T.Mesh(new T.CylinderGeometry(0.3, 0.5, h, 6), trunkMat); trunk.position.y = h / 2; t.add(trunk);
      for (let k = 0; k < 4; k++) {
        const c = new T.Mesh(new T.IcosahedronGeometry(2 + r() * 1.5, 0), leafMat);
        c.position.set((r() - 0.5) * 3, h + r() * 2, (r() - 0.5) * 3); t.add(c);
      }
      for (let k = 0; k < 4; k++) {
        const cone = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 1.4, 6), coneMat);
        cone.position.set((r() - 0.5) * 4, h + 1 + r() * 2, (r() - 0.5) * 4); t.add(cone);
      }
    } else {
      const h = 1.5 + r() * 2;
      const trunk = new T.Mesh(new T.CylinderGeometry(0.45, 0.55, h, 7), gtTrunk); trunk.position.y = h / 2; t.add(trunk);
      for (let k = 0; k < 18; k++) {
        const leaf = new T.Mesh(new T.ConeGeometry(0.08, 3, 3), gtLeaf);
        const a = k / 18 * TAU;
        leaf.position.set(Math.cos(a) * 0.6, h + 0.8, Math.sin(a) * 0.6);
        leaf.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9);
        t.add(leaf);
      }
      if (r() < 0.5) { const spike = new T.Mesh(new T.CylinderGeometry(0.1, 0.14, 2.6, 5), new T.MeshLambertMaterial({ color: '#9a7a4a' })); spike.position.y = h + 2.1; t.add(spike); }
    }
    t.position.set(x, y, z);
    scene.add(t);
  }
  // Small wildflowers everywhere, for colour
  const dotGeo = new T.SphereGeometry(0.25, 5, 4);
  for (const col of ['#f0a0c8', '#f2d040', '#ffffff', '#c03030']) {
    const mat = new T.MeshLambertMaterial({ color: col });
    const inst = new T.InstancedMesh(dotGeo, mat, 300);
    const m4 = new T.Matrix4();
    for (let i = 0; i < 300; i++) { const x = (r() - 0.5) * 300, z = (r() - 0.5) * 300; m4.makeTranslation(x, heathHeight(x, z) + 0.3, z); inst.setMatrixAt(i, m4); }
    scene.add(inst);
  }
}

// A big everlasting daisy to land on, with a glowing ring over it.
function makeFlower(T, kind) {
  const g = new T.Group();
  const stem = new T.Mesh(new T.CylinderGeometry(0.12, 0.15, 3, 5), new T.MeshLambertMaterial({ color: '#4a7a3a' }));
  stem.position.y = 1.5; g.add(stem);
  const petalMat = new T.MeshLambertMaterial({ color: kind === 'pink' ? '#f4a0c8' : kind === 'yellow' ? '#f2d040' : '#ffffff', side: T.DoubleSide });
  for (let k = 0; k < 14; k++) {
    const p = new T.Mesh(new T.SphereGeometry(0.6, 6, 4), petalMat);
    p.scale.set(1.6, 0.25, 0.6);
    const a = k / 14 * TAU;
    p.position.set(Math.cos(a) * 1.1, 3, Math.sin(a) * 1.1);
    p.rotation.y = -a;
    g.add(p);
  }
  const disc = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.3, 12), new T.MeshLambertMaterial({ color: '#f2b020' }));
  disc.position.y = 3.1; g.add(disc);
  const ring = new T.Mesh(new T.TorusGeometry(2.4, 0.18, 8, 32), new T.MeshBasicMaterial({ color: '#ffe060', transparent: true, opacity: 0.8 }));
  ring.position.y = 7; ring.rotation.x = Math.PI / 2;
  g.add(ring);
  g.userData.ring = ring;
  return g;
}

function makeButterfly(T) {
  const g = new T.Group();
  const bodyMat = new T.MeshLambertMaterial({ color: '#3a2c22' });
  const body = new T.Mesh(new T.CapsuleGeometry ? new T.CapsuleGeometry(0.12, 1.1, 4, 8) : new T.CylinderGeometry(0.12, 0.12, 1.3, 8), bodyMat);
  body.rotation.x = Math.PI / 2; g.add(body);
  const head = new T.Mesh(new T.SphereGeometry(0.17, 8, 6), bodyMat); head.position.z = 0.75; g.add(head);
  for (const s of [-1, 1]) {
    const ant = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.8, 3), bodyMat);
    ant.position.set(s * 0.15, 0.25, 1.1); ant.rotation.x = 1.1; ant.rotation.z = -s * 0.3; g.add(ant);
  }
  const tex = wingTexture();
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

Missions.flight = {
  id: 'flight', bug: 'butterfly', stage: 'Flying high', place: 'Above the heath, Bold Park', view: '3d',
  sprite: 'butterfly', bg: 'heath', escape: 'Fly',
  action: 'Flap', radius: 18, speed: 0, scale: 2, goal: 6,
  home: { x: W / 2, y: H / 2, r: 1, label: '' },
  facts: [
    'Painted ladies are strong fliers. Some fly hundreds of kilometres across Australia.',
    'Butterflies warm up in the sun before they fly. Cold wing muscles don’t work well.',
    'Fly like a butterfly! This one is in 3D.',
  ],
  how: [
    'Press Flap to take off, and keep flapping to climb.',
    'Steer with the arrow keys, or touch and drag left and right.',
    'Fly to the glowing rings over the big flowers, then land and hold Sip.',
    'Visit 6 flowers. Watch out for the willie wagtail!',
  ],
  discoveries: [],
  factText: {
    start: 'A painted lady can see colours we can’t, like ultraviolet patterns on flowers.',
    takeoff: 'Butterflies fly by flapping their wings in a figure-eight, which makes swirls of air that lift them.',
    sip: 'A butterfly sips nectar through its proboscis, a long tube that uncurls like a party blower.',
    glide: 'Butterflies save energy by gliding between flaps.',
    wagtail: 'Willie wagtails catch insects in mid-air, twisting and turning as they fly.',
    pollen: 'Moving from flower to flower, butterflies carry pollen and help plants make seeds.',
    nodgl: 'This device can’t show the 3D flight, so the butterfly flies off on its own.',
    win: 'Six flowers! A well-fed painted lady can live for a few weeks and fly a long way.',
  },

  setup(g) {
    g.netDone = true;   // no bug net up in the air
    const p = g.player;
    p.flat = true;
    g.fl = { x: 0, y: heathHeight(0, 0) + 3.2, z: 0, yaw: 0, vy: 0, flap: 0, flying: false, landed: null, sipT: 0, wingT: 0,
      flowers: [], bird: null, birdT: 25, camPos: null };
    const r = rng(7);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + r() * 0.5, d = 35 + r() * 70;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      g.fl.flowers.push({ x, z, y: heathHeight(x, z), kind: ['pink', 'yellow', 'white'][i % 3], visited: false });
    }
    g.fl3d = null;
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
  teardown() { Flight3D.hide(); },
  build(g) {
    const T = THREE, fl = g.fl;
    const cv = Flight3D.canvas;
    if (!Flight3D.renderer) {
      Flight3D.renderer = new T.WebGLRenderer({ canvas: cv, antialias: true });
      Flight3D.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    }
    const scene = new T.Scene();
    buildHeath(scene);
    const camera = new T.PerspectiveCamera(60, W / H, 0.1, 400);
    const bf = makeButterfly(T); scene.add(bf);
    // Empty chrysalis where you start
    const chrys = new T.Mesh(new T.SphereGeometry(0.5, 8, 6), new T.MeshLambertMaterial({ color: '#c8b88a' }));
    chrys.scale.set(0.7, 1.4, 0.7); chrys.position.set(0, heathHeight(0, 0) + 2.2, -0.6); scene.add(chrys);
    const twig = new T.Mesh(new T.CylinderGeometry(0.1, 0.12, 3.2, 5), new T.MeshLambertMaterial({ color: '#6a4a2a' }));
    twig.position.set(0, heathHeight(0, 0) + 1.5, -0.6); scene.add(twig);
    for (const f of fl.flowers) { const m = makeFlower(T, f.kind); m.position.set(f.x, f.y, f.z); scene.add(m); f.mesh = m; }
    const bird = makeWagtail(T); bird.visible = false; scene.add(bird);
    g.fl3d = { scene, camera, bf, bird };
  },
  locked() { return false; },
  move(g, dt, dx, dy) {
    const fl = g.fl;
    if (!fl) return;
    if (fl.landed) return;
    if (fl.flying) {
      fl.yaw -= dx * 1.9 * dt;
      fl.vy += (-dy * 4 - 2.2) * dt;    // up arrow (or dragging up) climbs a little; otherwise a slow glide down
      fl.vy = clamp(fl.vy, -4, 5);
      const sp = 8;
      fl.x += Math.sin(fl.yaw) * sp * dt; fl.z += Math.cos(fl.yaw) * sp * dt;
      fl.x = clamp(fl.x, -150, 150); fl.z = clamp(fl.z, -150, 150);
      fl.y += fl.vy * dt;
      const ground = heathHeight(fl.x, fl.z) + 1;
      if (fl.y < ground) { fl.y = ground; fl.vy = Math.max(0, fl.vy); }
      fl.y = Math.min(fl.y, 40);
      fl.bank = clamp(-dx * 0.6, -0.6, 0.6);
    }
  },
  update(g, dt, input) {
    const fl = g.fl, p = g.player;
    p.x = W / 2; p.y = H / 2;
    if (g.noGL) { setAction('Flap', false); return; }
    fl.wingT += dt;
    // Flap: take off, then climb
    if (!fl.flying && !fl.landed) {
      setAction('Flap', true);
      if (input.pressed || input.held) { fl.flying = true; fl.vy = 4; Sound.play('jump'); Game.fact('takeoff'); }
      if (p.stillT > 3) Game.hint('Press Flap to take off!');
      return;
    }
    if (fl.landed) {
      const f = fl.landed;
      setAction('Sip', true);
      if (working(input)) {
        fl.sipT += work(input, dt);
        p.progress = fl.sipT / 1.5;
        Game.fact('sip');
        if (fl.sipT >= 1.5) {
          f.visited = true; g.score++; fl.sipT = 0; fl.landed = null; fl.vy = 4; fl.lift = 0.6;
          Sound.play('score'); Game.pop(W / 2, H / 2 - 40, 'Yum!', '#ffd23f');
          if (f.mesh) f.mesh.userData.ring.visible = false;
          if (g.score === 2) Game.fact('pollen');
        }
      } else if (p.stillT > 3) Game.hint('Hold Sip to drink the nectar.');
      return;
    }
    setAction('Flap', true);
    if (input.pressed) { fl.vy = Math.min(5, fl.vy + 3.2); fl.flap = 0.35; Sound.play('tap'); }
    if (input.held) fl.vy = Math.min(5, fl.vy + 6 * dt);
    fl.flap = Math.max(0, fl.flap - dt);
    if (fl.vy < -1) Game.fact('glide');
    // Land on a flower you haven't visited, by flying into its ring area
    for (const f of fl.flowers) {
      if (f.visited) continue;
      if (Math.hypot(f.x - fl.x, f.z - fl.z) < 3.2 && fl.y < f.y + 9) {
        fl.landed = f; fl.flying = true; fl.x = f.x; fl.z = f.z; fl.y = f.y + 3.4; fl.vy = 0;
        Sound.play('pick'); Game.pop(W / 2, H / 2 - 40, 'Landed!', '#fff');
        return;
      }
    }
    // Willie wagtail: shows up now and then and darts after you
    fl.birdT -= dt;
    if (!fl.bird && fl.birdT <= 0 && g.score >= 1) {
      const a = fl.yaw + Math.PI * (0.7 + Math.random() * 0.6);
      fl.bird = { x: fl.x + Math.sin(a) * 40, y: fl.y + 4, z: fl.z + Math.cos(a) * 40, yaw: a + Math.PI, t: 0 };
      g.toasts.unshift({ text: 'A willie wagtail! Turn hard and flap to dodge it!', kind: 'hint' }); g.toastT = 0;
      Sound.play('caught'); Game.fact('wagtail');
    }
    const b = fl.bird;
    if (b) {
      b.t += dt;
      const want = Math.atan2(fl.x - b.x, fl.z - b.z);
      let d = want - b.yaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      if (b.t < 7) b.yaw += clamp(d, -1.1 * dt, 1.1 * dt);
      const sp = b.t < 7 ? 10 : 14;
      b.x += Math.sin(b.yaw) * sp * dt; b.z += Math.cos(b.yaw) * sp * dt;
      b.y += clamp(fl.y - b.y, -3 * dt, 3 * dt) * (b.t < 7 ? 1 : -1);
      if (b.t < 7 && p.invuln <= 0 && Math.hypot(b.x - fl.x, b.y - fl.y, b.z - fl.z) < 1.6) {
        b.t = 7;
        Game.caught({ name: 'willie wagtail', state: 'chase' });
        fl.x = 0; fl.z = 0; fl.y = heathHeight(0, 0) + 6; fl.vy = 2;
        p.x = W / 2; p.y = H / 2;
      }
      if (b.t > 11) { fl.bird = null; fl.birdT = 30 + Math.random() * 15; }
    }
  },
  render(ctx, g) {
    const fl = g.fl, d = g.fl3d;
    ctx.clearRect(0, 0, W, H);
    if (g.noGL) {
      ctx.fillStyle = '#9fd4f2'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#2b2118'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('This device can’t show 3D. Off you fly!', W / 2, H / 2);
      return;
    }
    if (!d) { ctx.fillStyle = '#9fd4f2'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#2b2118'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Getting ready to fly…', W / 2, H / 2); return; }
    const T = THREE, R = Flight3D.renderer, cv = Flight3D.canvas;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (w && (cv.width !== Math.floor(w * R.getPixelRatio()) || cv.height !== Math.floor(h * R.getPixelRatio()))) R.setSize(w, h, false);
    // Butterfly: position, heading, bank and flapping wings
    const bf = d.bf;
    bf.position.set(fl.x, fl.y, fl.z);
    bf.rotation.set(0, fl.yaw, 0);
    bf.rotation.z = fl.bank || 0;
    bf.rotation.x = (fl.flying && !fl.landed ? -0.45 : 0) + clamp(-fl.vy * 0.05, -0.25, 0.25);   // body angled nose-up in flight
    const flapSpeed = fl.landed ? 2 : fl.flying ? (fl.flap > 0 || fl.vy > 0 ? 22 : 9) : 1.5;
    const open = fl.landed ? 0.9 + Math.sin(fl.wingT * flapSpeed) * 0.25 : 0.15 + Math.sin(fl.wingT * flapSpeed) * 0.7;
    for (const wg of bf.userData.wings) wg.hinge.rotation.z = wg.s * (fl.flying && !fl.landed ? open : 1.2 + Math.sin(fl.wingT * 2) * 0.1);
    // Flowers: rings spin and bob; visited flowers lose their ring
    for (const f of fl.flowers) if (f.mesh) { const rg = f.mesh.userData.ring; rg.rotation.z += 0.02; rg.position.y = 7 + Math.sin(g.t * 2 + f.x) * 0.4; }
    // Bird
    const b = fl.bird;
    d.bird.visible = !!b;
    if (b) {
      d.bird.position.set(b.x, b.y, b.z); d.bird.rotation.y = b.yaw;
      for (const wg of d.bird.userData.wings) wg.hinge.rotation.z = wg.s * Math.sin(g.t * 18) * 0.8;
    }
    // Camera behind and a little above, smoothly following
    const back = new T.Vector3(fl.x - Math.sin(fl.yaw) * 6.5, fl.y + 5, fl.z - Math.cos(fl.yaw) * 6.5);
    if (!fl.camPos) fl.camPos = back.clone();
    fl.camPos.lerp(back, 0.12);
    d.camera.position.copy(fl.camPos);
    d.camera.lookAt(fl.x + Math.sin(fl.yaw) * 5, fl.y + 0.5, fl.z + Math.cos(fl.yaw) * 5);
    d.camera.aspect = w && h ? w / h : W / H; d.camera.updateProjectionMatrix();
    R.render(d.scene, d.camera);
    // 2D overlay: arrow to the nearest flower you haven't visited, at the edge of the screen
    const left = fl.flowers.filter(f => !f.visited);
    if (left.length && !fl.landed) {
      const f = left.reduce((a, c) => Math.hypot(c.x - fl.x, c.z - fl.z) < Math.hypot(a.x - fl.x, a.z - fl.z) ? c : a);
      let rel = Math.atan2(f.x - fl.x, f.z - fl.z) - fl.yaw;
      while (rel > Math.PI) rel -= TAU; while (rel < -Math.PI) rel += TAU;
      const dist3 = Math.hypot(f.x - fl.x, f.z - fl.z);
      ctx.save(); ctx.translate(W / 2 - Math.sin(rel) * 140, H - 190 - Math.cos(rel) * 40); ctx.rotate(-rel - Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-10, -14); ctx.lineTo(-4, 0); ctx.lineTo(-10, 14); ctx.closePath();
      ctx.fillStyle = 'rgba(255,210,63,' + (0.7 + Math.sin(g.t * 6) * 0.3) + ')'; ctx.fill();
      ctx.strokeStyle = 'rgba(90,60,10,.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(Math.round(dist3) + ' m', W / 2, H - 132);
    }
    if (b && b.t < 7) { ctx.fillStyle = '#c0392b'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', W / 2, 90); }
    // Height bar
    const hk = clamp((fl.y - heathHeight(fl.x, fl.z)) / 30, 0, 1);
    ctx.fillStyle = 'rgba(255,250,240,.7)'; ctx.fillRect(16, 140, 14, 200);
    ctx.fillStyle = '#4fc3f7'; ctx.fillRect(16, 140 + 200 * (1 - hk), 14, 200 * hk);
    ctx.fillStyle = '#2b2118'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Height', 10, 132);
  },
  goalPoint() { return null; },
  hud(g) {
    if (g.noGL) setHud('Flying off…', '');
    else if (!g.fl.flying) setHud('Press Flap to take off!', '');
    else setHud('Flowers: ' + g.score + ' / ' + this.goal, g.fl.landed ? 'Hold Sip' : '');
  },
  won(g) { return g.score >= this.goal; },
};

Bugs.find(b => b.id === 'butterfly').stages.push('flight');
Missions.flight.sex = 'You are a female.';
finishMissions();
