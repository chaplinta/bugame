'use strict';
// 3D sprites. Each bug, bird, plant and prop can be a small three.js model (see js/models-*.js). Models are
// rendered once per look (state, heading, size) into transparent bitmaps for sprite-cache.js, with a sun
// that stays fixed to the screen, sky light, reflections and a real soft shadow on the ground. Play stays
// 2D. When three.js or WebGL is missing (or ?no3d=1), nothing here runs and the 2D drawings are used.
//
// Models are authored in the "ground frame": x forward (the bug faces +x), y to the right on screen when
// facing +x (that is sprite y, screen-down in the top view), z up off the ground, in sprite units (an ant
// is about 50 long). That frame is left-handed, so the root group is mirrored (scale.y = -1): inside a
// model, rotations about z turn +x toward +y exactly like ctx.rotate() does in the 2D drawings.

const Render3D = {
  ok: false, software: false, lost: false, failed: false, loading: null, readyFns: [],
  disabled: /[?&]no3d=1/.test(location.search) || (typeof localStorage !== 'undefined' && (() => { try { return localStorage.getItem('bugame.3d') === 'off'; } catch (e) { return false; } })()),
  forced: /[?&]3d=force/.test(location.search),
  MAX: 1024,                                             // GL canvas limit (phones); desktop 2048
  SUN: { az: [-0.55, -0.83], elev: 38 * Math.PI / 180 },   // screen azimuth (same as Shade / Ground.SUN) and elevation
  D: 1500,                                               // camera distance
  stats: { renders: 0, ms: 0, max: 0, tiles: 0, tileMs: 0 },

  // ---------------------------------------------------------------- loading and the probe
  load() {
    if (this.disabled) return Promise.resolve(false);
    if (!this.loading) this.loading = new Promise((res) => {
      if (window.THREE) return res(true);
      const s = document.createElement('script');
      s.src = 'vendor/three.min.js'; s.async = true;
      s.onload = () => res(true); s.onerror = () => res(false);
      document.head.appendChild(s);
    }).then((got) => { if (got) { try { this.boot(); } catch (e) { this.failed = true; } } return this.ok; });
    return this.loading;
  },
  whenReady(fn) { if (this.ok) fn(); else this.readyFns.push(fn); },
  mobile() { return navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 900; },

  boot() {
    if (this.ok || !window.THREE || this.disabled) return;
    const T = THREE, cv = document.createElement('canvas');   // never added to the page
    cv.width = cv.height = 256;
    const attrs = { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false, depth: true, stencil: false, powerPreference: 'default' };
    let gl = null;
    try {
      // Software GL (a blocked driver, or headless Chromium) is refused: it would be slower than the 2D drawings.
      const strict = Object.assign({ failIfMajorPerformanceCaveat: true }, attrs);
      gl = cv.getContext('webgl2', strict) || cv.getContext('webgl', strict);
      if (!gl && this.forced) { gl = cv.getContext('webgl2', attrs) || cv.getContext('webgl', attrs); this.software = !!gl; }
    } catch (e) { gl = null; }
    if (!gl) { this.failed = true; return; }
    cv.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); this.lost = true; this.ok = false; if (window.SpriteCache) SpriteCache.clear(); }, false);
    cv.addEventListener('webglcontextrestored', () => { this.lost = false; this.scene.environment = this.envMap(); this.ok = true; if (window.SpriteCache) SpriteCache.clear(); }, false);
    const R = this.renderer = new T.WebGLRenderer(Object.assign({ canvas: cv, context: gl }, attrs));
    R.setPixelRatio(1);
    R.setClearColor(0x000000, 0);
    R.outputColorSpace = T.SRGBColorSpace;
    R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.0;
    R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    R.setScissorTest(true);
    this.MAX = Math.min(this.mobile() ? 1024 : 2048, R.capabilities.maxTextureSize || 2048);
    this.canvas = cv; this.size = 256;
    this.buildScene();
    this.ok = true;
    this.readyFns.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* a listener failing must not stop the rest */ } });
    this.precompile();
  },

  // ---------------------------------------------------------------- the scene: sun, sky, shadow catcher
  buildScene() {
    const T = THREE, S = this.scene = new T.Scene();
    this.sun = new T.DirectionalLight(0xfff2dc, 3.0);
    this.sun.castShadow = true;
    const sm = this.mobile() ? 512 : 1024; this.sun.shadow.mapSize.set(sm, sm);
    this.sun.shadow.bias = -0.0003; this.sun.shadow.normalBias = 0.4;
    S.add(this.sun); S.add(this.sun.target);
    this.hemi = new T.HemisphereLight(0xdff2ff, 0x8a7a50, 0.5); S.add(this.hemi);
    S.environment = this.envMap();
    this.catcher = new T.Mesh(new T.PlaneGeometry(1, 1), new T.ShadowMaterial({ color: 0x1e140a, opacity: 0.38, transparent: true, depthWrite: false }));
    this.catcher.material.toneMapped = false; this.catcher.receiveShadow = true; S.add(this.catcher);
    this.cam = new T.OrthographicCamera(-1, 1, 1, -1, 1, this.D * 2 + 200); S.add(this.cam);
    this.root = new T.Group(); this.root.scale.y = -1; S.add(this.root);
  },
  // A gradient sky, made in code, as the environment map: zenith blue, pale horizon, warm ground.
  // Symmetric about z, so turning the sun per light bucket needs no new map.
  envMap(renderer) {
    const T = THREE, pm = new T.PMREMGenerator(renderer || this.renderer), sky = new T.Scene();
    const g = new T.SphereGeometry(50, 32, 16), pos = g.attributes.position, col = [];
    const zen = new T.Color('#4f90d4'), hor = new T.Color('#e8f0f4'), gnd = new T.Color('#8a7448'), c = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getY(i) / 50;      // the sphere's own poles are along y; we turn it so they point up z
      c.copy(hor).lerp(z > 0 ? zen : gnd, Math.pow(Math.abs(z), 0.6));
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide }));
    m.rotation.x = Math.PI / 2; sky.add(m);
    const rt = pm.fromScene(sky, 0.04);
    pm.dispose(); g.dispose(); m.material.dispose();
    return rt.texture;
  },

  // Unit vector toward the sun in world space: from the upper left of the picture, a bit from the front,
  // turned by the sprite's light bucket (ang), the same turn sprite-cache.js gives the 2D light.
  sunDir(ang) {
    const [wx, wy] = this.SUN.az, el = this.SUN.elev;
    const lx = wx * Math.cos(ang) + wy * Math.sin(ang), ly = -wx * Math.sin(ang) + wy * Math.cos(ang);
    const v = new THREE.Vector3(-lx * Math.cos(el), ly * Math.cos(el), Math.sin(el));   // camera space: x right, y up, z toward the viewer
    return v.applyQuaternion(this.cam.quaternion).normalize();
  },
  aimSun(dir, R, centre) {
    const c = centre || new THREE.Vector3();
    this.sun.position.copy(dir).multiplyScalar(R * 4).add(c); this.sun.target.position.copy(c);
    const sc = this.sun.shadow.camera;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = R * 2.5; sc.far = R * 5.5;
    sc.updateProjectionMatrix();
    this.sun.shadow.needsUpdate = true;
  },
  // Camera for a view: 'top' straight down, 'side' in front and a little above, 'iso' the 2:1 yard view.
  setView(view) {
    const cam = this.cam, D = this.D;
    if (view === 'side') { const a = 18 * Math.PI / 180; cam.position.set(0, -Math.cos(a) * D, Math.sin(a) * D); cam.up.set(0, 0, 1); }
    else if (view === 'iso') { const e = 30 * Math.PI / 180, az = Math.PI / 4; cam.position.set(Math.cos(e) * Math.sin(az) * D, -Math.cos(e) * Math.cos(az) * D, Math.sin(e) * D); cam.up.set(0, 0, 1); }
    else { cam.position.set(0, 0, D); cam.up.set(0, 1, 0); }
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld(true);
  },
  // Picture box in sprite units (x right, y down) round a model and its shadow, from the model's bounds.
  fitBox(root, dir, shadow) {
    const T = THREE, bb = new T.Box3().setFromObject(root), c = new T.Vector3(), pts = [];
    if (bb.isEmpty()) return { box: [-10, -10, 10, 10], R: 10, bb };
    for (let i = 0; i < 8; i++) {
      c.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z);
      pts.push(c.clone());
      if (shadow && c.z > 0 && dir.z > 1e-3) pts.push(new T.Vector3(c.x - dir.x * c.z / dir.z, c.y - dir.y * c.z / dir.z, 0));
    }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, R = 0;
    for (const p of pts) {
      R = Math.max(R, p.length());
      p.applyMatrix4(this.cam.matrixWorldInverse);
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
    }
    const m = 3;
    return { box: [x0 - m, -(y1 + m), x1 + m, -(y0 - m)], R: R + 4, bb };
  },
  grow(w, h) {
    const need = Math.min(this.MAX, Math.max(w, h));
    if (need <= this.size) return;
    let s = this.size; while (s < need) s *= 2;
    this.size = Math.min(this.MAX, s);
    this.renderer.setSize(this.size, this.size, false);
  },
  // Render the scene into a gw x gh region and copy it into a fresh 2D canvas of cw x ch pixels.
  renderTo(gw, gh, cw, ch) {
    const R = this.renderer;
    this.grow(gw, gh);
    const k = Math.min(1, this.size / gw, this.size / gh);   // a huge request renders coarser rather than failing
    gw = Math.floor(gw * k); gh = Math.floor(gh * k);
    R.setViewport(0, 0, gw, gh); R.setScissor(0, 0, gw, gh);
    R.render(this.scene, this.cam);
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(this.canvas, 0, this.canvas.height - gh, gw, gh, 0, 0, cw, ch);
    return c;
  },

  // ---------------------------------------------------------------- a sprite bitmap
  // def: the model definition; root: its built group; ang: light bucket angle; P: canvas px per unit.
  sprite(def, root, e, t, ang, P) {
    const t0 = performance.now(), view = def.view || 'top';
    this.root.add(root);
    try {
      if (def.pose) def.pose(root, e, t, this.M);
      if (view === 'side' && e && e.face !== undefined) root.rotation.z = e.face < 0 ? Math.PI : 0;
      root.updateMatrixWorld(true);
      this.setView(view);
      const dir = this.sunDir(view === 'top' ? ang : 0);
      const shadow = def.shadow !== false && view !== 'side';
      const fit = this.fitBox(root, dir, shadow);
      const box = def.box || fit.box;
      // snap the box outward to whole canvas pixels so the bitmap maps 1:1
      const bx = [Math.floor(box[0] * P) / P, Math.floor(box[1] * P) / P, Math.ceil(box[2] * P) / P, Math.ceil(box[3] * P) / P];
      const cam = this.cam;
      cam.left = bx[0]; cam.right = bx[2]; cam.top = -bx[1]; cam.bottom = -bx[3]; cam.updateProjectionMatrix();
      this.catcher.visible = shadow;
      if (shadow) { this.catcher.scale.set(fit.R * 4, fit.R * 4, 1); this.catcher.position.set(0, 0, 0); }
      this.aimSun(dir, fit.R);
      const ss = P <= 3 ? 2 : 1, cw = Math.round((bx[2] - bx[0]) * P), ch = Math.round((bx[3] - bx[1]) * P);
      const c = this.renderTo(cw * ss, ch * ss, cw, ch);
      const ms = performance.now() - t0;
      this.stats.renders++; this.stats.ms += ms; this.stats.max = Math.max(this.stats.max, ms);
      return { c, box: bx, bytes: cw * ch * 4, threeD: true };
    } finally {
      this.root.remove(root);
    }
  },

  // ---------------------------------------------------------------- a seamless ground tile
  // fn(api) places things in [0,size)^2 (ground frame). Anything within m of an edge is repeated into the
  // neighbouring copies, so blades, leaves and their shadows wrap. Returns a size*P px canvas.
  tile(size, P, m, fn) {
    if (!this.ok) return null;
    const T = THREE, t0 = performance.now(), group = new T.Group();
    const offs = (x, y) => {
      const ox = x < m ? size : x > size - m ? -size : 0, oy = y < m ? size : y > size - m ? -size : 0, out = [[0, 0]];
      if (ox) out.push([ox, 0]); if (oy) out.push([0, oy]); if (ox && oy) out.push([ox, oy]);
      return out;
    };
    const api = {
      size, group,
      add(obj, x, y) { for (const [ox, oy] of offs(x, y)) { const o = ox || oy ? obj.clone() : obj; o.position.x = x + ox; o.position.y = y + oy; group.add(o); } },
      inst(geo, mat, n) { const im = new T.InstancedMesh(geo, mat, n * 4); im.count = 0; im.castShadow = im.receiveShadow = true; im.frustumCulled = false; group.add(im); return im; },
      place(im, dummy, x, y, color) {
        for (const [ox, oy] of offs(x, y)) {
          dummy.position.x = x + ox; dummy.position.y = y + oy; dummy.updateMatrix();
          if (im.count >= im.instanceMatrix.count) break;
          im.setMatrixAt(im.count, dummy.matrix);
          if (color) im.setColorAt(im.count, color);
          im.count++;
        }
      },
    };
    this.root.add(group);
    try {
      fn(api);
      for (const o of group.children) if (o.isInstancedMesh) { o.instanceMatrix.needsUpdate = true; if (o.instanceColor) o.instanceColor.needsUpdate = true; o.computeBoundingBox(); }
      group.updateMatrixWorld(true);
      this.setView('top');
      const cam = this.cam;
      cam.left = 0; cam.right = size; cam.top = 0; cam.bottom = -size; cam.updateProjectionMatrix();
      const dir = this.sunDir(0), centre = new T.Vector3(size / 2, -size / 2, 0);
      this.catcher.visible = true; this.catcher.scale.set(size * 4, size * 4, 1); this.catcher.position.copy(centre);
      this.aimSun(dir, size * 0.9, centre);
      const px = Math.round(size * P);
      const c = this.renderTo(px, px, px, px);
      this.stats.tiles++; this.stats.tileMs += performance.now() - t0;
      return c;
    } finally {
      this.root.remove(group); this.catcher.position.set(0, 0, 0);
      this.dispose(group);
    }
  },

  // Free a built model's own geometry (shared kit geometry and all materials stay).
  dispose(root) {
    root.traverse((o) => { if (o.geometry && o.userData.own) o.geometry.dispose(); });
  },

  // Compile the shaders for the usual material recipes now, so a level's first renders don't stall on it.
  precompile() {
    const T = THREE, R = this.renderer, M = this.M, s = new T.Scene(), g = new T.SphereGeometry(1, 6, 4);
    s.add(this.sun.clone(), this.hemi.clone()); s.environment = this.scene.environment;
    for (const mat of [M.chitin('#a04020'), M.fur('#b08040'), M.wing(), M.leaf('#4f8f3a'), M.eye(), M.matte('#806040')]) {
      s.add(new T.Mesh(g, mat));
      const im = new T.InstancedMesh(g, mat, 1); im.setMatrixAt(0, new T.Matrix4()); s.add(im);
    }
    s.add(new T.Mesh(g, this.catcher.material));
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, 1, 10);
    try { if (R.compileAsync) R.compileAsync(s, cam).catch(() => {}); else R.compile(s, cam); } catch (e) { /* compiled lazily instead */ }
  },

  // ---------------------------------------------------------------- the model kit: materials and shapes
  M: {
    tex: new Map(), geos: new Map(), mats: new Map(),
    T() { return THREE; },

    // A Tex tile (black or white with alpha) composited over mid grey makes a height field for bumpMap.
    height(spec, repeat) {
      const names = [].concat(spec), base = 'h|' + names.join('+'), key = base + '|' + (repeat || 1);
      let t = this.tex.get(key); if (t) return t;
      let b = this.tex.get(base);
      if (!b) {
        const c = document.createElement('canvas'); c.width = c.height = Tex.N;
        const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, Tex.N, Tex.N);
        for (const n of names) { const tile = Tex.tile(n); if (tile) x.drawImage(tile, 0, 0); }
        b = new THREE.CanvasTexture(c); b.wrapS = b.wrapT = THREE.RepeatWrapping; b.colorSpace = THREE.NoColorSpace;
        b.anisotropy = Math.min(4, Render3D.renderer.capabilities.getMaxAnisotropy());
        this.tex.set(base, b);
      }
      t = repeat && repeat !== 1 ? b.clone() : b;
      if (t !== b) { t.repeat.set(repeat, repeat); t.needsUpdate = true; }
      this.tex.set(key, t);
      return t;
    },
    // A colour map painted in code with the 2D helpers. fn(ctx, w, h). Cached by key.
    paint(key, w, h, fn, o) {
      o = o || {};
      let t = this.tex.get('p|' + key); if (t) return t;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      fn(c.getContext('2d'), w, h);
      t = new THREE.CanvasTexture(c);
      t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
      t.anisotropy = Math.min(4, Render3D.renderer.capabilities.getMaxAnisotropy());
      if (o.flipY === false) t.flipY = false;
      this.tex.set('p|' + key, t);
      return t;
    },
    mat(key, make) { let m = this.mats.get(key); if (!m) { m = make(); this.mats.set(key, m); } return m; },
    phys(o) { return new THREE.MeshPhysicalMaterial(o); },
    // Material cache key (textures by uuid: stringifying one would serialise its canvas).
    k(name, color, o) { return name + '|' + color + '|' + (o ? JSON.stringify(o, (key, v) => (v && v.isTexture ? 'tex:' + v.uuid : v)) : ''); },

    // Insect cuticle: glossy, with fine pits. o.map for painted markings, o.rough / o.coat to tune.
    chitin(color, o) {
      o = o || {};
      return this.mat(this.k('chitin', color, o), () => this.phys({ color, roughness: o.rough === undefined ? 0.42 : o.rough, clearcoat: o.coat === undefined ? 0.6 : o.coat, clearcoatRoughness: 0.25, bumpMap: this.height(['chitin', 'chitinHi'], o.repeat || 3), bumpScale: o.bump === undefined ? 0.5 : o.bump, envMapIntensity: o.env === undefined ? 0.55 : o.env, map: o.map || null, transparent: !!o.opacity, opacity: o.opacity || 1 }));
    },
    // Dull cuticle or skin (termites, grubs, caterpillars): no clearcoat, a little sheen.
    matte(color, o) {
      o = o || {};
      return this.mat(this.k('matte', color, o), () => this.phys({ color, roughness: o.rough || 0.7, sheen: 0.3, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.4), sheenRoughness: 0.7, bumpMap: this.height('grain', o.repeat || 3), bumpScale: o.bump === undefined ? 0.3 : o.bump, envMapIntensity: 0.4, map: o.map || null }));
    },
    // Fur, pile and feathers: velvety sheen and a hair grain.
    fur(color, o) {
      o = o || {};
      return this.mat(this.k('fur', color, o), () => this.phys({ color, roughness: 0.92, sheen: o.sheen === undefined ? 0.8 : o.sheen, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35), sheenRoughness: 0.6, bumpMap: this.height(['hair', 'hairHi'], o.repeat || 4), bumpScale: o.bump === undefined ? 0.7 : o.bump, envMapIntensity: 0.35, map: o.map || null }));
    },
    feather(color, o) { return this.fur(color, Object.assign({ sheen: 0.45, bump: 0.5 }, o || {})); },
    // Single hairs and bristles (thin cones catch little light, so these are brighter and glossier).
    hair(color) { return this.mat(this.k('hair', color), () => this.phys({ color, roughness: 0.5, sheen: 0.7, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.5, clearcoat: 0.3, envMapIntensity: 1.0 })); },
    // Membrane wing: see-through, iridescent, with a faint cell grain. Transmission is avoided on purpose
    // (its pass in three r158 goes milky over a transparent background), so this is plain transparency.
    wing(o) {
      o = o || {};
      return this.mat(this.k('wing', o.color || '#ffffff', o), () => this.phys({ color: o.color || '#ffffff', transparent: true, opacity: o.opacity === undefined ? 0.4 : o.opacity, roughness: 0.18, metalness: 0, iridescence: 0.9, iridescenceIOR: 1.3, iridescenceThicknessRange: [120, 420], side: THREE.DoubleSide, depthWrite: false, bumpMap: o.bumpMap || this.height('wing', 2), bumpScale: 0.25, envMapIntensity: 1.0, map: o.map || null, alphaMap: o.alphaMap || null }));
    },
    // Scaled wing (butterflies, moths): painted pattern, matte, a velvet sheen.
    scaleWing(map, o) {
      o = o || {};
      return this.mat('scaleWing|' + map.uuid + JSON.stringify(o), () => this.phys({ map, color: '#ffffff', roughness: 0.85, sheen: 0.5, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.8, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5, alphaMap: o.alphaMap || null, bumpMap: this.height('hair', 6), bumpScale: 0.2, envMapIntensity: 0.3 }));
    },
    leaf(color, o) {
      o = o || {};
      return this.mat(this.k('leaf', color, o), () => this.phys({ color, roughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.5, side: THREE.DoubleSide, bumpMap: this.height('leaf', o.repeat || 2), bumpScale: 0.3, envMapIntensity: 0.5, map: o.map || null, transparent: !!o.alphaMap, alphaMap: o.alphaMap || null, alphaTest: o.alphaMap ? 0.5 : 0 }));
    },
    petal(color, o) {
      o = o || {};
      return this.mat(this.k('petal', color, o), () => this.phys({ color, roughness: 0.75, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.7, side: THREE.DoubleSide, bumpMap: this.height('leaf', 3), bumpScale: 0.15, envMapIntensity: 0.4, map: o.map || null }));
    },
    bark(color, o) { o = o || {}; return this.mat(this.k('bark', color, o), () => this.phys({ color, roughness: 0.95, bumpMap: this.height('bark', o.repeat || 2), bumpScale: 1.4, envMapIntensity: 0.3, map: o.map || null })); },
    rock(color, o) { o = o || {}; return this.mat(this.k('rock', color, o), () => this.phys({ color, roughness: 0.9, bumpMap: this.height(['soil', 'sandHi'], o.repeat || 2), bumpScale: 1.0, envMapIntensity: 0.4, map: o.map || null })); },
    sand(color) { return this.mat(this.k('sand', color), () => this.phys({ color, roughness: 1, bumpMap: this.height(['sand', 'sandHi'], 3), bumpScale: 0.6, envMapIntensity: 0.4 })); },
    soil(color) { return this.mat(this.k('soil', color), () => this.phys({ color, roughness: 1, bumpMap: this.height('soil', 2), bumpScale: 1.0, envMapIntensity: 0.3 })); },
    // Snail and sea shells: hard, glossy, painted.
    shell(color, o) { o = o || {}; return this.mat(this.k('shell', color, o), () => this.phys({ color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, bumpMap: this.height('grain', 3), bumpScale: 0.3, envMapIntensity: 0.9, map: o.map || null })); },
    // Lizard and fish scales.
    scales(color, o) { o = o || {}; return this.mat(this.k('scales', color, o), () => this.phys({ color, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, bumpMap: this.height('scale', o.repeat || 3), bumpScale: 0.8, envMapIntensity: 0.6, map: o.map || null })); },
    skin(color, o) { o = o || {}; return this.mat(this.k('skin', color, o), () => this.phys({ color, roughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ff9070'), 0.3), sheenRoughness: 0.6, bumpMap: this.height('grain', 4), bumpScale: 0.2, envMapIntensity: 0.4, map: o.map || null })); },
    cloth(color, o) { o = o || {}; return this.mat(this.k('cloth', color, o), () => this.phys({ color, roughness: 0.95, sheen: 0.5, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.3), sheenRoughness: 0.8, bumpMap: this.height('hair', 8), bumpScale: 0.3, envMapIntensity: 0.3, map: o.map || null })); },
    metal(color, o) { o = o || {}; return this.mat(this.k('metal', color, o), () => this.phys({ color, metalness: 1, roughness: o.rough || 0.35, envMapIntensity: 1.2, bumpMap: this.height('grain', 4), bumpScale: 0.15 })); },
    plastic(color, o) { o = o || {}; return this.mat(this.k('plastic', color, o), () => this.phys({ color, roughness: o.rough || 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.8, map: o.map || null })); },
    glass(color, o) { o = o || {}; return this.mat(this.k('glass', color, o), () => this.phys({ color, roughness: 0.05, clearcoat: 1, transparent: true, opacity: o.opacity || 0.7, envMapIntensity: 1.5, iridescence: 0.3, side: THREE.DoubleSide })); },
    water(color) { return this.mat(this.k('water', color), () => this.phys({ color, roughness: 0.05, transparent: true, opacity: 0.75, envMapIntensity: 1.2, bumpMap: this.height('ripple', 1), bumpScale: 0.6 })); },
    // Compound eye: near black, glassy, with a faceted grain.
    eye(o) { o = o || {}; return this.mat(this.k('eye', o.color || '#100c0a', o), () => this.phys({ color: o.color || '#100c0a', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, bumpMap: this.height('wing', o.repeat || 4), bumpScale: 0.35, envMapIntensity: 1.2 })); },
    // A plain glossy dark material (claws, mandible edges, tiny eyes).
    gloss(color, o) { o = o || {}; return this.mat(this.k('gloss', color, o), () => this.phys({ color, roughness: o.rough || 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2, envMapIntensity: 0.8 })); },

    // ---- geometry, cached by its arguments
    geo(key, make) { let g = this.geos.get(key); if (!g) { g = make(); this.geos.set(key, g); } return g; },
    sphere(r, seg) { return this.geo('sph|' + r + '|' + (seg || 0), () => new THREE.SphereGeometry(r, seg || (r > 6 ? 24 : r > 2 ? 16 : 10), seg ? Math.max(6, seg * 0.6 | 0) : (r > 6 ? 16 : r > 2 ? 12 : 8))); },
    capsule(r, len, seg) { return this.geo('cap|' + r + '|' + len + '|' + (seg || 0), () => new THREE.CapsuleGeometry(r, len, seg || 4, (seg || 4) * 2 + 2)); },
    cone(r0, r1, len, seg) { return this.geo('cone|' + r0 + '|' + r1 + '|' + len + '|' + (seg || 0), () => new THREE.CylinderGeometry(r1, r0, len, seg || 8, 1)); },   // r0 at the base (−y), r1 at the tip
    box(w, h, d) { return this.geo('box|' + w + '|' + h + '|' + d, () => new THREE.BoxGeometry(w, h, d)); },
    torus(r, tube, seg) { return this.geo('tor|' + r + '|' + tube + '|' + (seg || 0), () => new THREE.TorusGeometry(r, tube, seg || 8, (seg || 8) * 3)); },
    // A tube along a list of ground-frame points, tapering from r0 to r1.
    tube(pts, r0, r1, seg) {
      const T = THREE, curve = new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(p[0], p[1], p[2])));
      const g = new T.TubeGeometry(curve, Math.max(4, (seg || pts.length * 3)), 1, 7, false);
      // taper: scale each ring by its distance along the tube
      const pos = g.attributes.position, nrm = g.attributes.normal, n = g.parameters.tubularSegments + 1, rs = g.parameters.radialSegments + 1, tmp = new T.Vector3();
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1), rad = r0 + (r1 - r0) * k, centre = curve.getPointAt(k);
        for (let j = 0; j < rs; j++) { const idx = i * rs + j; tmp.set(nrm.getX(idx), nrm.getY(idx), nrm.getZ(idx)); pos.setXYZ(idx, centre.x + tmp.x * rad, centre.y + tmp.y * rad, centre.z + tmp.z * rad); }
      }
      pos.needsUpdate = true; g.computeBoundingSphere(); g.userData.own = true;
      return g;
    },
    // A flat shape from 2D points [[x,y],...] in the ground frame (built in the xy plane).
    shape(pts, o) {
      o = o || {};
      const T = THREE, s = new T.Shape();
      pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
      s.closePath();
      let g;
      if (o.depth) g = new T.ExtrudeGeometry(s, { depth: o.depth, bevelEnabled: !!o.bevel, bevelThickness: o.bevel || 0, bevelSize: o.bevel || 0, bevelSegments: 2, curveSegments: 6 });
      else g = new T.ShapeGeometry(s, 6);
      if (o.uv) {   // UVs normalised to the shape's bounds, so a painted map covers it
        g.computeBoundingBox(); const b = g.boundingBox, uv = g.attributes.uv, p = g.attributes.position;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
        uv.needsUpdate = true;
      }
      g.userData.own = true;
      return g;
    },
    lathe(profile, seg) { const g = new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg || 20); g.userData.own = true; return g; },

    // ---- placing parts in the ground frame. xf: { at:[x,y,z], rot:[x,y,z] (or z number), scale:[x,y,z] (or number), shadow:false }
    part(geo, mat, xf) {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = m.receiveShadow = true;
      return this.xf(m, xf);
    },
    xf(m, xf) {
      xf = xf || {};
      if (xf.at) m.position.set(xf.at[0], xf.at[1], xf.at[2] || 0);
      if (xf.rot !== undefined) { if (typeof xf.rot === 'number') m.rotation.z = xf.rot; else m.rotation.set(xf.rot[0] || 0, xf.rot[1] || 0, xf.rot[2] || 0); }
      if (xf.scale !== undefined) { if (typeof xf.scale === 'number') m.scale.setScalar(xf.scale); else m.scale.set(xf.scale[0], xf.scale[1], xf.scale[2]); }
      if (xf.shadow === false) m.castShadow = false;
      return m;
    },
    // An ellipsoid (rx along x, ry along y, rz up) at a point. rot turns it about z.
    ellipsoid(parent, rx, ry, rz, mat, at, rot) {
      const m = this.part(this.sphere(1, rx > 6 ? 28 : 18), mat, { at, scale: [rx, ry, rz], rot: rot || 0 });
      parent.add(m); return m;
    },
    // An ellipsoid whose texture bands run across the body (poles along x), for striped abdomens:
    // the sphere is turned inside a group that carries the stretch, so rx really is along x.
    banded(parent, rx, ry, rz, mat, at) {
      const g = new THREE.Group(); g.position.set(at[0], at[1], at[2] || 0); g.scale.set(rx, ry, rz);
      const m = this.part(this.sphere(1, 28), mat, { rot: [0, 0, Math.PI / 2] });
      g.add(m); parent.add(g); return g;
    },
    // A capsule between two ground-frame points.
    seg(parent, a, b, r, mat, o) {
      o = o || {};
      const T = THREE, A = new T.Vector3(a[0], a[1], a[2] || 0), B = new T.Vector3(b[0], b[1], b[2] || 0), d = B.clone().sub(A), len = d.length();
      const g = o.cone ? this.cone(r, o.cone, len) : this.capsule(r, Math.max(0.01, len - 2 * r * (o.full ? 0 : 1)));
      const m = new T.Mesh(g, mat); m.castShadow = m.receiveShadow = true;
      m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
      parent.add(m); return m;
    },
    // Many little things in one draw call: fn(i, dummy) sets dummy.position/rotation/scale; returns colour or nothing.
    hairs(parent, n, geo, mat, fn) {
      const T = THREE, im = new T.InstancedMesh(geo, mat, n), d = new T.Object3D(), c = new T.Color();
      let any = false;
      for (let i = 0; i < n; i++) {
        d.position.set(0, 0, 0); d.rotation.set(0, 0, 0); d.scale.set(1, 1, 1);
        const col = fn(i, d);
        d.updateMatrix(); im.setMatrixAt(i, d.matrix);
        if (col) { im.setColorAt(i, c.set(col)); any = true; }
      }
      im.instanceMatrix.needsUpdate = true; if (any) im.instanceColor.needsUpdate = true;
      im.castShadow = im.receiveShadow = true; im.frustumCulled = false; im.computeBoundingBox();
      parent.add(im); return im;
    },
    // Short hairs over an ellipsoid surface (rx, ry, rz at `at`): tapered cones leaning along the body.
    pile(parent, at, rx, ry, rz, n, len, col, seed, o) {
      o = o || {};
      const r = rng(seed || 1), geo = this.cone(o.thick || 0.17, 0.02, len), T = THREE, nrm = new T.Vector3(), up = new T.Vector3(0, 1, 0);
      const im = this.hairs(parent, n, geo, this.hair(col), (i, d) => {
        // a random point on the upper surface
        const th = r() * TAU, ph = Math.acos(1 - r() * (o.full ? 2 : 1.1));   // mostly the top
        const x = Math.sin(ph) * Math.cos(th), y = Math.sin(ph) * Math.sin(th), z = Math.cos(ph);
        d.position.set(at[0] + x * rx, at[1] + y * ry, at[2] + z * rz);
        nrm.set(x / rx, y / ry, z / rz).normalize();
        // lean the hair backward (toward -x) a little
        nrm.x -= o.lean === undefined ? 0.6 : o.lean; nrm.z += 0.2; nrm.normalize();
        d.quaternion.setFromUnitVectors(up, nrm);
        d.position.addScaledVector(nrm, len * 0.45);
        d.scale.set(1, 0.7 + r() * 0.6, 1);
        return i % 3 ? null : tint(col, 0.3);
      });
      im.receiveShadow = false;   // hairs this thin only pick up shadow acne
      return im;
    },
    // A jointed leg: coxa at `at`, femur at yaw `a` rising by `pf`, tibia turning by `bend` and coming down
    // to the ground, tarsus flat along the ground, two claws. Returns an object with set(a, lift) to pose it.
    leg(parent, at, a, L, mat, w, bend, o) {
      o = o || {};
      const T = THREE, g = new T.Group(); parent.add(g);
      const f = L * (o.femur || 0.42), tb = L * (o.tibia || 0.38), ta = L * (o.tarsus || 0.3), pf = o.pitch === undefined ? 0.5 : o.pitch;
      const K = new T.Vector3(), E = new T.Vector3(), F = new T.Vector3(), tmp = new T.Vector3();
      const parts = {
        coxa: this.part(this.sphere(w * 0.9), mat, { at: [at[0], at[1], at[2]] }),
        femur: this.part(this.capsule(w * 0.5, Math.max(0.1, f - w)), mat),
        knee: this.part(this.sphere(w * 0.6), mat),
        tibia: this.part(this.capsule(w * 0.38, Math.max(0.1, tb - w * 0.8)), mat),
        ankle: this.part(this.sphere(w * 0.42), mat),
        tarsus: [], claws: [],
      };
      for (let i = 0; i < 4; i++) parts.tarsus.push(this.part(this.capsule(w * (0.28 - i * 0.04), ta / 4 * 0.8), mat));
      for (let i = 0; i < 2; i++) parts.claws.push(this.part(this.cone(w * 0.16, 0.02, w * 1.1), this.gloss('#1a1008'), { shadow: false }));
      if (o.spines) for (let i = 0; i < o.spines; i++) parts.tarsus.push(this.part(this.cone(w * 0.12, 0.02, w * 0.9), this.gloss('#2a1a10'), { shadow: false }));
      for (const k of ['coxa', 'femur', 'knee', 'tibia', 'ankle']) g.add(parts[k]);
      for (const m of parts.tarsus) g.add(m); for (const m of parts.claws) g.add(m);
      const up = new T.Vector3(0, 1, 0);
      const orient = (m, A, B) => { tmp.copy(B).sub(A); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(up, tmp.normalize()); };
      const leg = {
        group: g, a, lift: 0,
        set(ang, lift) {
          lift = lift || 0;
          const A = new T.Vector3(at[0], at[1], at[2]);
          K.set(A.x + Math.cos(ang) * f * Math.cos(pf), A.y + Math.sin(ang) * f * Math.cos(pf), A.z + f * Math.sin(pf) + lift * 0.5);
          const b = ang + bend, drop = Math.min(0.95, K.z / tb), pt = Math.asin(drop) * (1 - lift * 0.12);
          E.set(K.x + Math.cos(b) * tb * Math.cos(pt), K.y + Math.sin(b) * tb * Math.cos(pt), Math.max(w * 0.4 + lift, K.z - tb * Math.sin(pt)));
          const c = b + bend * 0.6, zf = w * 0.3 + lift * 0.8;
          F.set(E.x + Math.cos(c) * ta, E.y + Math.sin(c) * ta, zf);
          orient(parts.femur, A, K); parts.knee.position.copy(K);
          orient(parts.tibia, K, E); parts.ankle.position.copy(E);
          for (let i = 0; i < 4; i++) { const p = i / 4, q = (i + 1) / 4; tmp.copy(E).lerp(F, p); const B2 = E.clone().lerp(F, q); orient(parts.tarsus[i], tmp.clone(), B2); }
          for (let i = 0; i < 2; i++) { const s = i ? 1 : -1; const tip = new T.Vector3(F.x + Math.cos(c + s * 0.55) * w * 1.1, F.y + Math.sin(c + s * 0.55) * w * 1.1, Math.max(0.05, zf - w * 0.3)); orient(parts.claws[i], F, tip); }
          if (o.spines) for (let i = 0; i < o.spines; i++) { const k = (i + 1) / (o.spines + 1); tmp.copy(K).lerp(E, k); const dir = new T.Vector3(Math.cos(b + 1.4 * (i % 2 ? 1 : -1)), Math.sin(b + 1.4 * (i % 2 ? 1 : -1)), -0.3).normalize(); const B2 = tmp.clone().addScaledVector(dir, w * 0.9); orient(parts.tarsus[4 + i], tmp.clone(), B2); }
          this.a = ang; this.lift = lift;
        },
      };
      leg.set(a, 0);
      return leg;
    },
    // Six legs on a thorax: front pair forward, middle sideways, hind pair back, in a tripod gait.
    // o: { cx, wide, len, z, spread, mat, w, L, pitch, spines }. Returns { legs, pose(sw) } where sw in [-1,1].
    legs6(parent, o) {
      const dirs = [-0.95, -0.15, 0.75], att = [3.2, 0.6, -2.4], legs = [];
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
        const tri = (i === 1 ? -1 : 1) * s;
        const a = s * (Math.PI / 2 + dirs[i] * (o.spread || 1));
        const bend = s * (i === 0 ? 0.9 : i === 1 ? 1.1 : 1.0);
        const L = (o.L || 19) * (i === 2 ? 1.15 : i === 0 ? 0.95 : 1);
        const leg = this.leg(parent, [(o.cx || 0) + att[i] * (o.len || 1), s * (o.wide || 2), o.z || 5], a, L, o.mat, o.w || 1.6, bend, { pitch: o.pitch, spines: o.spines });
        leg.base = a; leg.tri = tri; leg.side = s;
        legs.push(leg);
      }
      return {
        legs,
        pose(sw) { for (const l of legs) { const swing = sw * l.tri; l.set(l.base + swing * 0.3, Math.max(0, swing) * (o.lift || 2.2)); } },
      };
    },
    // An antenna: scape from `at` at yaw a1 (rising), then a run of small beads along yaw a2.
    antenna(parent, at, a1, l1, a2, l2, segs, mat, w, o) {
      o = o || {};
      const T = THREE, g = new T.Group(); parent.add(g);
      const rise = o.rise === undefined ? 0.45 : o.rise;
      const K = [at[0] + Math.cos(a1) * l1 * Math.cos(rise), at[1] + Math.sin(a1) * l1 * Math.cos(rise), at[2] + l1 * Math.sin(rise)];
      this.seg(g, at, K, w * 0.5, mat);
      let prev = K;
      for (let i = 0; i < segs; i++) {
        const q = (i + 1) / segs, ang = a2 + (q - 0.5) * (o.curve || 0.5);
        const P = [K[0] + Math.cos(ang) * l2 * q, K[1] + Math.sin(ang) * l2 * q, K[2] + l2 * q * (o.droop === undefined ? -0.1 : o.droop)];
        this.seg(g, prev, P, w * (0.42 - q * 0.12), mat, { full: true });
        prev = P;
      }
      return g;
    },
  },
};

// ---------------------------------------------------------------- the registry of models
const Models = {
  defs: {}, built: new Map(), LIMIT: 32,
  has(name) { const d = this.defs[name]; return !!(d && !d.broken); },
  // def: { view: 'top'|'side'|'iso', buckets, box?, key(o,t)?, variant(o)?, build(M, o, vk) -> Group, pose(root, o, t, M)?, warm?(player), shadow? }
  define(name, def) {
    this.defs[name] = def;
    if (typeof SpriteCache === 'undefined') return;
    const old = SpriteCache.regs[name];
    // A sprite that was drawn live before (the bugs you play) stays live when the 3D path is off
    // The drawing keeps its own cache key (reg.key) for the 2D path; the model's key is used when it renders in 3D.
    SpriteCache.register(name, Object.assign({}, old || {}, { model: def, live2d: !old, buckets: def.view && def.view !== 'top' ? 1 : (def.buckets || (old && old.buckets) || 8), key: old && old.key, box: (old && old.box) || [-60, -60, 60, 60] }));
  },
  // The built group for a model's structural variant (what changes shape), kept in a small LRU.
  root(name, def, e) {
    const vk = def.variant ? def.variant(e) : '', k = name + '|' + vk;
    let r = this.built.get(k);
    if (r) { this.built.delete(k); this.built.set(k, r); return r; }
    r = def.build(Render3D.M, e, vk); r.userData.vk = vk; this.built.set(k, r);
    if (this.built.size > this.LIMIT) { const [k0, r0] = this.built.entries().next().value; this.built.delete(k0); Render3D.dispose(r0); }
    return r;
  },
  render(name, def, e, t, ang, P) {
    if (def.broken) return null;
    try { return Render3D.sprite(def, this.root(name, def, e), e, t, ang, P); }
    catch (err) { def.broken = true; console.error('3D model ' + name + ' failed, drawing it flat', err); return null; }
  },
  // A fresh root for another scene (the flight level).
  build(name, o) { const def = this.defs[name]; if (!def) return null; return def.build(Render3D.M, o || {}, def.variant ? def.variant(o || {}) : ''); },
  // What to pre-render when a level starts: the player's looks for every heading, then its items.
  warmList(g) {
    const m = g.mission, p = g.player, name = m.playerSprite ? m.playerSprite(g) : (m.sprite || m.id), def = this.defs[name];
    if (!def || typeof SpriteCache === 'undefined') return [];
    const reg = SpriteCache.regs[name], nb = reg.buckets || 8, px = (Game.dpr || 1) * (Game.zoom || 1) * (m.scale || 1), out = [];
    const states = def.warm ? def.warm(p) : [{ moving: false, t: 0 }].concat([0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ moving: true, t: (i + 0.5) / 8 * TAU / 18 })));
    for (let b = 0; b < nb; b++) for (const s of states) out.push({ name, e: Object.assign({}, p, s, { angle: b * TAU / nb }), t: s.t || 0, px });
    for (const it of g.items || []) if (this.defs[it.sprite]) out.push({ name: it.sprite, e: it, t: 0, px: px / (m.scale || 1) * (it.scale || 1) });
    return out;
  },
};

if (!Render3D.disabled) window.addEventListener('load', () => Render3D.load());
