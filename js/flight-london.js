'use strict';
// Up the Thames: a painted lady at the end of her migration flies upriver through London, from below Tower Bridge
// to the thistles of Battersea Park. The second level on the 3D flight kit (js/flight.js).
// The river's bends and the order of everything along it are real (docs/facts.md, Landmarks); the streets are a toy London.

const THAMES = (() => {
  // The middle of the river, east to west: x east, z south, about 10 m to a unit. Tower Bridge is the second point.
  const P = [[95, 6], [0, 0], [-85, -27], [-160, -44], [-201, -47], [-288, -34], [-309, -7], [-322, 52], [-333, 122], [-357, 200],
    [-420, 240], [-479, 246], [-517, 233], [-579, 245], [-633, 258], [-700, 250]];
  // u: a place along the river counted in those points, so u = 1 is Tower Bridge and u = 7 is Westminster Bridge
  const U = { tower: 1, london: 2, cannon: 2.4, southwark: 2.7, millennium: 3, blackRail: 3.86, blackfriars: 4, waterloo: 5, hungerford: 6, eye: 6.45,
    westminster: 7, lambeth: 8, vauxhall: 9, power: 11, grosvenor: 11.62, chelsea: 12, park: 13, albert: 14 };
  const N = 24, S = [], HALF = 20, BANK = 1.6;
  const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < N; k++) S.push({ x: cr(a[0], b[0], c[0], d[0], k / N), z: cr(a[1], b[1], c[1], d[1], k / N), u: i + k / N });
  }
  S.push({ x: P[P.length - 1][0], z: P[P.length - 1][1], u: P.length - 1 });
  let len = 0;
  S.forEach((q, i) => {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    q.tx = (b.x - a.x) / l; q.tz = (b.z - a.z) / l;      // which way is upriver here
    if (i) len += Math.hypot(q.x - S[i - 1].x, q.z - S[i - 1].z);
    q.s = len;
  });
  const s0 = S[N].s;
  for (const q of S) q.s -= s0;   // metres (well, units) upriver of Tower Bridge

  const R = { P, U, S, N, HALF, BANK };
  // The river's middle at u
  R.at = (u) => {
    const f = clamp(u, 0, P.length - 1) * N, i = Math.min(S.length - 2, Math.floor(f)), k = f - i, a = S[i], b = S[i + 1];
    const tx = a.tx + (b.tx - a.tx) * k, tz = a.tz + (b.tz - a.tz) * k, l = Math.hypot(tx, tz) || 1;
    return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, tx: tx / l, tz: tz / l, s: a.s + (b.s - a.s) * k, u };
  };
  // A place beside the river: off is how far from the middle, plus on your right as you fly upriver (the north
  // bank, then the Westminster side), minus on your left. ry turns a model's front (its local +z) to face the water.
  R.side = (u, off, along) => {
    const q = R.at(u), rx = -q.tz, rz = q.tx, sg = off < 0 ? 1 : -1;
    return { x: q.x + rx * off + q.tx * (along || 0), z: q.z + rz * off + q.tz * (along || 0), tx: q.tx, tz: q.tz, s: q.s, u, ry: Math.atan2(rx * sg, rz * sg), across: Math.atan2(-rz, rx), yaw: Math.atan2(q.tx, q.tz) };
  };
  // The nearest bit of river to a point: how far upriver it is (s) and how far off the middle (lat, signed as above)
  R.near = (x, z) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < S.length; i += 6) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; best = i; } }
    for (let i = Math.max(0, best - 6); i <= Math.min(S.length - 1, best + 6); i++) { const d = (S[i].x - x) ** 2 + (S[i].z - z) ** 2; if (d < bd) { bd = d; best = i; } }
    const q = S[best], dx = x - q.x, dz = z - q.z;
    return { q, s: q.s + dx * q.tx + dz * q.tz, lat: dx * -q.tz + dz * q.tx, u: q.u };
  };
  R.ground = (x, z) => Math.abs(R.near(x, z).lat) < HALF ? 0 : BANK;
  R.END = R.at(U.park).s;   // Battersea Park, where it ends

  // ---- What stands where. Places first, so the streets can leave room for them.
  const M = R.marks = {
    post: R.side(0.45, -5),               // the mooring post she starts on
    walkie: R.side(1.42, 52), gherkin: R.side(1.5, 92), city1: R.side(1.3, 80), city2: R.side(1.68, 84), city3: R.side(1.58, 62),
    shard: R.side(1.93, -54),
    stpauls: R.side(U.millennium, 62),
    tate: R.side(U.millennium + 0.06, -37),
    eye: R.side(U.eye, -(HALF + 1)),
    bigben: R.side(U.westminster + 0.05, 31),
    palace: R.side(U.westminster + 0.36, 32),
    power: R.side(U.power, -50),
    balloon: R.at(4.55),                  // somebody's lost balloon, over the water
  };
  const clear = [[M.walkie, 9], [M.gherkin, 9], [M.city1, 8], [M.city2, 8], [M.city3, 8], [M.shard, 12], [M.stpauls, 17], [M.tate, 17], [M.eye, 12], [M.bigben, 8], [M.palace, 30], [M.power, 24]];
  const sol = R.solids = [];
  const boxAt = (q, lx, lz, w, d, y0, y1) => {   // a solid given in a model's own frame
    const c = Math.cos(q.ry), s = Math.sin(q.ry);
    sol.push(FlightKit.solid(q.x + lx * c + lz * s, q.z - lx * s + lz * c, w, d, q.ry, y0, y1));
  };
  boxAt(M.walkie, 0, 0, 9, 7, 0, 24); boxAt(M.gherkin, 0, 0, 8, 8, 0, 27); boxAt(M.city1, 0, 0, 6, 6, 0, 22); boxAt(M.city2, 0, 0, 7, 7, 0, 28); boxAt(M.city3, 0, 0, 6, 6, 0, 18);
  boxAt(M.shard, 0, 0, 9, 9, 0, 60);
  boxAt(M.stpauls, 0, 0, 26, 10, 0, 8); boxAt(M.stpauls, 1, 0, 9, 9, 0, 24);
  boxAt(M.tate, 0, 0, 24, 10, 0, 8.5); boxAt(M.tate, 0, 3.5, 3, 3, 0, 24);
  boxAt(M.bigben, 0, 0, 4, 4, 0, 30);
  boxAt(M.palace, 0, 0, 44, 9, 0, 7); boxAt(M.palace, -24, -1, 6, 6, 0, 21);
  boxAt(M.power, 0, 0, 28, 18, 0, 13);
  for (const [cx, cz] of [[-11, -6], [11, -6], [-11, 6], [11, 6]]) boxAt(M.power, cx, cz, 3.4, 3.4, 0, 28);

  // The bridges, in the order she meets them. kind: 'arch', 'girder' (railway), 'foot', 'hang' (suspension) or 'tower'
  R.bridges = [
    { key: 'tower', u: U.tower, kind: 'tower', road: 1 },
    { key: 'london', u: U.london, kind: 'arch', col: '#cfcabd', trim: '#b9b4a6', spans: 3, road: 2 },
    { key: 'cannon', u: U.cannon, kind: 'girder', col: '#5d7d62', trim: '#e6e0c8', spans: 5 },
    { key: 'southwark', u: U.southwark, kind: 'arch', col: '#6f9a6a', trim: '#e2c94c', spans: 5, road: 1 },
    { key: 'millennium', u: U.millennium, kind: 'foot' },
    { key: 'blackRail', u: U.blackRail, kind: 'girder', col: '#8f9aa2', trim: '#b9412f', spans: 5 },
    { key: 'blackfriars', u: U.blackfriars, kind: 'arch', col: '#b9412f', trim: '#f2ece0', spans: 5, road: 1 },
    { key: 'waterloo', u: U.waterloo, kind: 'arch', col: '#dbd8ce', trim: '#c9c6bc', spans: 5, road: 2 },
    { key: 'hungerford', u: U.hungerford, kind: 'girder', col: '#6e757c', trim: '#f4f4f0', spans: 6, masts: true },
    { key: 'westminster', u: U.westminster, kind: 'arch', col: '#6fa075', trim: '#e9e2c2', spans: 7, road: 2 },
    { key: 'lambeth', u: U.lambeth, kind: 'arch', col: '#b8443a', trim: '#3a3a3a', spans: 5, road: 1 },
    { key: 'vauxhall', u: U.vauxhall, kind: 'arch', col: '#b8443a', trim: '#e2c94c', spans: 5, road: 2 },
    { key: 'grosvenor', u: U.grosvenor, kind: 'girder', col: '#8a4a40', trim: '#d8d2c2', spans: 4 },
    { key: 'chelsea', u: U.chelsea, kind: 'hang', col: '#f2f0ea', trim: '#c8473c', road: 1 },
    { key: 'albert', u: U.albert, kind: 'hang', col: '#f0c8d0', trim: '#9fc8a8', road: 1 },
  ];
  for (const b of R.bridges) {
    const q = b.q = R.side(b.u, 0);
    b.across = HALF * 2 + 8; b.depth = b.kind === 'foot' ? 1.4 : b.kind === 'tower' ? 4 : 3.4; b.top = b.kind === 'tower' ? 4.4 : 4.8;
    sol.push(FlightKit.solid(q.x, q.z, b.across, b.depth, q.across, b.top - (b.kind === 'foot' ? 0.5 : 1.2), b.top + (b.kind === 'girder' ? 1 : 0)));
    if (b.kind === 'tower') {   // the two towers, and the walkways high between them
      for (const sg of [-1, 1]) { const t = R.side(b.u, sg * 9.5); sol.push(FlightKit.solid(t.x, t.z, 5.4, 5.4, q.across, 0, 22)); }
      sol.push(FlightKit.solid(q.x, q.z, 14, 4, q.across, 13.2, 15));
    }
  }

  // Streets: rows of buildings along both banks, in the look of each part of town
  const town = (u, right) => right
    ? (u < 3.9 ? { cols: ['#c9d3da', '#b8c4cc', '#d8d2c4', '#a9b7c2', '#e2ddd0'], h: [7, 15] }       // the City
      : u < 7.6 ? { cols: ['#d9d2c0', '#cfc7b3', '#e0dacb', '#c8beaa'], h: [6, 9] }                 // the Embankment, Whitehall
      : u < 10.4 ? { cols: ['#e8e2d4', '#c9a27a', '#d6cdb8', '#efe9dc'], h: [5, 8] }                // Pimlico
      : { cols: ['#b9785a', '#c98a66', '#d8c7ae', '#a86a50'], h: [4, 7] })                          // Chelsea
    : (u < 4 ? { cols: ['#a9744f', '#b98660', '#8f6a52', '#c4a47c', '#b8c4cc'], h: [5, 10] }       // Southwark
      : u < 7 ? { cols: ['#b9b6ae', '#c9c5bb', '#a7a49c', '#d2cec4'], h: [5, 9] }                  // the South Bank
      : u < 9 ? { cols: ['#b98660', '#c9c5bb', '#a9744f', '#d6cdb8'], h: [5, 9] }                  // Lambeth
      : u < 10.7 ? { cols: ['#b8c8d2', '#a9bcc8', '#c9d3da', '#d8d2c4'], h: [9, 19] }              // Vauxhall and Nine Elms
      : { cols: ['#b9785a', '#a86a50', '#c98a66', '#d8c7ae'], h: [4, 7] });                         // Battersea
  const r = rng(2026);
  R.blocks = [];
  for (let s = -84; s < R.at(P.length - 1).s - 6; s += 7.2) {
    const i = S.findIndex(q => q.s >= s), q = S[Math.max(0, i)];
    const hit = R.bridges.some(b => Math.abs(b.q.s - s) < 4.4);   // the road off the end of a bridge
    for (const sd of [1, -1]) for (let row = 0; row < 5; row++) {
      const off = HALF + 15 + row * 19 + (r() - 0.5) * 3, st = town(q.u, sd > 0), w = 4.6 + r() * 2, d = 12 + r() * 5;
      const h = (row === 0 ? 0.8 : 1) * (st.h[0] + r() * (st.h[1] - st.h[0])), col = st.cols[Math.floor(r() * st.cols.length)];
      const x = q.x - q.tz * off * sd, z = q.z + q.tx * off * sd;
      if (hit) continue;
      if (sd < 0 && q.u > U.chelsea + 0.12 && q.u < U.albert - 0.08 && row < 4) continue;     // Battersea Park
      if (clear.some(([c, cr2]) => Math.hypot(x - c.x, z - c.z) < cr2 + 7)) continue;
      if (Math.abs(R.near(x, z).lat) < off - 4) continue;                                       // folded into the inside of a bend
      const ry = Math.atan2(-q.tz, q.tx), blk = { x, z, w, d, h, ry, col, row, u: q.u, sd };
      R.blocks.push(blk);
      if (row < 4) sol.push(FlightKit.solid(x, z, w, d, ry, 0, BANK + h));
    }
  }
  // Stops: flowers to sip at on the way (any four), then the thistles in the park. y is what each stands on.
  const roof = R.blocks.filter(b => b.row === 0 && b.sd < 0).sort((a, b) => Math.abs(a.u - 3.72) - Math.abs(b.u - 3.72))[0];   // a roof garden on the South Bank
  const stop = (u, off, kind, more) => Object.assign({ x: R.side(u, off).x, z: R.side(u, off).z, y: BANK, kind, s: R.at(u).s }, more);
  R.stops = [
    stop(1.5, -23.5, 'box', { perch: 2.1, ringY: 6 }),
    stop(2.52, 22.5, 'buddleia', { perch: 3.3 }),
    { x: roof.x, z: roof.z, y: BANK + roof.h, kind: 'box', perch: 2.1, ringY: 6, s: R.near(roof.x, roof.z).s },
    stop(5.5, 24, 'box', { perch: 2.1, ringY: 6 }),
    stop(7.7, -23.5, 'buddleia', { perch: 3.3 }),
    stop(9.6, 23.5, 'box', { perch: 2.1, ringY: 6 }),
    stop(12.5, -31, 'thistle', { perch: 3.2, hold: 1.3 }),
    stop(12.86, -43, 'thistle', { perch: 3.2, hold: 1.3 }),
    stop(13.2, -32, 'thistle', { perch: 3.2, hold: 1.3 }),
  ];
  // Trees: London planes along the Embankment, and the park
  R.trees = [];
  for (let u = 4.1; u < 7.6; u += 0.09) if (Math.abs(u - U.waterloo) > 0.06 && Math.abs(u - U.hungerford) > 0.06 && Math.abs(u - U.westminster) > 0.06) { const t = R.side(u, HALF + 4.2); R.trees.push([t.x, t.z, 3.2 + r() * 1.2]); }
  for (let i = 0; i < 150; i++) {
    const u = U.chelsea + 0.16 + r() * (U.albert - U.chelsea - 0.3), t = R.side(u, -(HALF + 8 + r() * 80));
    if (R.stops.some(f => Math.hypot(f.x - t.x, f.z - t.z) < 9)) continue;
    R.trees.push([t.x, t.z, 3 + r() * 2.5]);
  }
  return R;
})();

// A lost balloon, for the Bug Book's list of lost things (in the level it is a 3D one)
Sprites.lostBalloon = (ctx) => { line(ctx, [0, 8, 2, 24], '#8a8a88', 1); ell(ctx, 0, 0, 8, 10, '#d8322a'); ell(ctx, -3, -4, 2, 3, 'rgba(255,255,255,.5)'); };
SECRETS.places.ldnThames = { key: 's_balloon', name: 'Lost balloon', sprite: 'lostBalloon', fx: -9, fy: -9, hub: 'london',
  text: 'A lost balloon! Somebody on the bridge let go of the string.' };

// The flat picture behind the level (seen only where the 3D flight can't run): the river and Tower Bridge
Backgrounds.ldnThames = (ctx, w, h) => {
  ctx.fillStyle = '#bcdcf0'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#6f8c88'; ctx.fillRect(0, h * 0.62, w, h * 0.38);
  if (typeof LondonSky !== 'undefined') { LondonSky.line(ctx, [['shard', w * 0.2, 1], ['stPauls', w * 0.78, 0.9], ['gherkin', w * 0.9, 0.8]], h * 0.62, '#9fb4c2'); LondonSky.mark(ctx, 'towerBridge', w * 0.5, h * 0.62, 2.2, '#7f93a2'); }
};
Backgrounds.ldnThames.noVignette = true;

function thamesScenery(scene, g, T) {
  const K = FlightKit, R = THAMES, U = R.U, M = R.marks, HALF = R.HALF, BANK = R.BANK, r = rng(77);
  K.sky(scene, '#a6d0ee', '#d9e6ee');
  scene.fog = new T.Fog('#d9e6ee', 90, 300);
  scene.add(new T.HemisphereLight('#eaf4ff', '#8a8f86', 1.15));
  const sun = new T.DirectionalLight('#fff2d8', 1.5);
  sun.position.set(80, 120, 60);
  scene.add(sun);
  const mats = {};
  const lam = (c, o) => mats[c] || (mats[c] = new T.MeshLambertMaterial(Object.assign({ color: c }, o)));
  const mesh = (parent, geo, mat, x, y, z) => { const m = new T.Mesh(geo, typeof mat === 'string' ? lam(mat) : mat); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (parent, w, h, d, mat, x, y, z) => mesh(parent, new T.BoxGeometry(w, h, d), mat, x, y + h / 2, z);
  const cyl = (parent, r0, r1, h, mat, x, y, z, seg) => mesh(parent, new T.CylinderGeometry(r0, r1, h, seg || 10), mat, x, y + h / 2, z);
  const pic = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
  const group = (q, y) => { const gp = new T.Group(); gp.position.set(q.x, y === undefined ? BANK : y, q.z); gp.rotation.y = q.ry; scene.add(gp); return gp; };

  // ---- The river, its walls, the banks
  const strip = (o0, y0, o1, y1, colour) => {
    const pos = [], cols = [], idx = [], c = new T.Color();
    R.S.forEach((q, i) => {
      const rx = -q.tz, rz = q.tx;
      pos.push(q.x + rx * o0, y0, q.z + rz * o0, q.x + rx * o1, y1, q.z + rz * o1);
      for (const o of [o0, o1]) { c.set(typeof colour === 'function' ? colour(q, o) : colour); cols.push(c.r, c.g, c.b); }
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    scene.add(new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide })));
  };
  const inPark = (q) => q.u > U.chelsea + 0.1 && q.u < U.albert - 0.06;
  const base = new T.Mesh(new T.PlaneGeometry(2400, 2000), lam('#b3b1a8')); base.rotation.x = -Math.PI / 2; base.position.set(-300, -0.6, 120); scene.add(base);
  strip(-HALF - 0.5, 0, HALF + 0.5, 0, (q, o) => (Math.sin(q.s * 0.21) > 0.2 ? '#6f8c88' : '#68857f'));       // the Thames: grey-green and busy
  strip(HALF, BANK, HALF + 100, BANK, (q, o) => (o < HALF + 1 ? '#c4c0b4' : '#b3b1a8'));
  strip(-HALF, BANK, -HALF - 100, BANK, (q, o) => (inPark(q) ? '#86b266' : o > -HALF - 1 ? '#c4c0b4' : '#b3b1a8'));
  for (const sg of [-1, 1]) { strip(sg * HALF, -0.4, sg * HALF, BANK + 0.5, '#a39d8e'); strip(sg * (HALF + 0.5), BANK + 0.5, sg * HALF, BANK + 0.5, '#bdb7a8'); }

  // ---- Streets: every building one copy of the same box, with painted windows
  const win = pic(64, 64, (c) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 5; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x * 7 + y * 3) % 5 === 0 ? '#9fb4c4' : '#566878'; c.fillRect(4 + x * 16, 5 + y * 12.4, 9, 7.6); }
  });
  const wall = new T.MeshLambertMaterial({ map: win }), slate = new T.MeshLambertMaterial({ color: '#8c9198' });
  const tint = new T.Color();
  K.inst(scene, new T.BoxGeometry(1, 1, 1), [wall, wall, slate, slate, wall, wall], R.blocks.map(b => K.mat(b.x, BANK + b.h / 2 - 0.3, b.z, b.w, b.h + 0.6, b.d, b.ry)), R.blocks.map(b => tint.set(b.col).clone()));
  const blob = new T.IcosahedronGeometry(1, 0), stem = new T.CylinderGeometry(0.7, 1, 1, 5);
  K.inst(scene, stem, lam('#6a5a48'), R.trees.map(t => K.mat(t[0], BANK + t[2] * 0.45, t[1], 0.28, t[2] * 0.9, 0.28)));
  K.inst(scene, blob, new T.MeshLambertMaterial({ color: '#5f8f4a', flatShading: true }), R.trees.map(t => K.mat(t[0], BANK + t[2] * 1.15, t[1], t[2] * 0.62, t[2] * 0.55, t[2] * 0.62, t[0])));
  const clouds = [];
  for (let i = 0; i < 22; i++) { const cx = -320 + (r() - 0.5) * 900, cy = 70 + r() * 30, cz = 110 + (r() - 0.5) * 700; for (let k = 0; k < 5; k++) clouds.push(K.mat(cx + k * 9 - 18, cy + r() * 3, cz + r() * 8, 8 + r() * 7, 4 + r() * 2, 7 + r() * 5)); }
  K.inst(scene, new T.IcosahedronGeometry(1, 1), new T.MeshLambertMaterial({ color: '#ffffff', emissive: '#66707c' }), clouds);

  // ---- Bridges
  const archFace = (b) => pic(512, 64, (c, w, h) => {
    c.fillStyle = b.col; c.fillRect(0, 0, w, h);
    c.fillStyle = b.trim; c.fillRect(0, 0, w, 7); c.fillRect(0, 12, w, 2);
    c.globalCompositeOperation = 'destination-out';
    if (b.kind === 'arch') for (let i = 0; i < b.spans; i++) { c.beginPath(); c.ellipse((i + 0.5) / b.spans * w, h, w / b.spans * 0.43, h * 0.74, 0, 0, TAU); c.fill(); }
    else for (let i = 0; i < b.spans; i++) c.fillRect((i + 0.08) / b.spans * w, 26, w / b.spans * 0.84, h);
  });
  const buses = [];
  const busGeo = new T.BoxGeometry(2.7, 1.5, 1), glass = new T.BoxGeometry(2.72, 0.3, 1.02);
  for (const b of R.bridges) {
    const gp = new T.Group(); gp.position.set(b.q.x, 0, b.q.z); gp.rotation.y = b.q.across; scene.add(gp);
    const W2 = b.across, top = b.top;
    if (b.kind === 'arch' || b.kind === 'girder') {
      const face = new T.MeshLambertMaterial({ map: archFace(b), alphaTest: 0.5, side: T.DoubleSide });
      for (const sg of [-1, 1]) { const p = mesh(gp, new T.PlaneGeometry(W2, top + 0.5), face, 0, (top + 0.5) / 2, sg * b.depth / 2); if (sg < 0) p.rotation.y = Math.PI; }
      box(gp, W2, 0.4, b.depth, b.kind === 'girder' ? '#5a5650' : '#6b6b6b', 0, top - 0.4, 0);
      if (b.kind === 'girder') for (const sg of [-1, 1]) box(gp, W2, 1, 0.25, b.col, 0, top, sg * b.depth / 2);
      if (b.masts) for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) {   // the footbridges' white masts, leaning out either side
        const mast = cyl(gp, 0.12, 0.16, 7, '#f4f4f0', -W2 / 2 + (i + 0.5) * W2 / 4, top, sg * (b.depth / 2 + 1.1), 6); mast.rotation.x = sg * 0.3;
        box(gp, W2 / 4 - 0.6, 0.12, 0.9, '#e4e4e0', -W2 / 2 + (i + 0.5) * W2 / 4, top - 0.1, sg * (b.depth / 2 + 0.8));
      }
    } else if (b.kind === 'foot') {   // the Millennium Bridge: a blade of steel on two Y-shaped piers
      box(gp, W2, 0.18, 1.2, '#c9d0d6', 0, top - 0.2, 0);
      for (const px of [-8, 8]) {
        cyl(gp, 0.5, 0.7, top - 1.2, '#aeb6bc', px, 0, 0, 8);
        for (const sg of [-1, 1]) { const arm = box(gp, 0.3, 0.3, 2.6, '#c9d0d6', px, top - 1, sg * 1.1); arm.rotation.x = -sg * 0.5; }
      }
      for (const sg of [-1, 1]) box(gp, W2, 0.08, 0.08, '#dfe5ea', 0, top + 0.25, sg * 1.9);
    } else if (b.kind === 'hang') {
      box(gp, W2, 0.4, b.depth, '#6b6b6b', 0, top - 0.4, 0);
      for (const sg of [-1, 1]) box(gp, W2, 0.5, 0.2, b.trim, 0, top, sg * b.depth / 2);
      for (const px of [-10, 10]) for (const sg of [-1, 1]) {
        box(gp, 0.7, 9, 0.7, b.col, px, 0, sg * b.depth / 2); mesh(gp, new T.SphereGeometry(0.5, 8, 6), b.trim, px, 9.3, sg * b.depth / 2);
        for (const [x1, len, rot] of [[px / 2, 10.9, -Math.sign(px) * 0.42], [px + Math.sign(px) * 6, 12.8, Math.sign(px) * 0.36]]) { const cab = box(gp, len, 0.14, 0.14, b.col, x1, top + (9 - top) / 2 - 0.1, sg * b.depth / 2); cab.rotation.z = rot; }
      }
    } else {   // Tower Bridge
      const st = '#cfc6ae', blue = '#8fbcd4';
      box(gp, W2, 0.5, b.depth, '#6b6b6b', 0, top - 0.5, 0);
      for (const sg of [-1, 1]) {
        box(gp, W2, 0.7, 0.2, blue, 0, top, sg * b.depth / 2);
        box(gp, 7, 3.2, 8, '#b9b09a', sg * 9.5, -0.4, 0);                 // pier
        box(gp, 5, 15.6, 5, st, sg * 9.5, 2.8, 0);                       // tower
        box(gp, 5.3, 0.5, 5.3, '#e6dfca', sg * 9.5, 12, 0);
        for (const cx of [-1, 1]) for (const cz of [-1, 1]) { box(gp, 1, 17.4, 1, st, sg * 9.5 + cx * 2.3, 2.8, cz * 2.3); const sp = mesh(gp, new T.ConeGeometry(0.75, 2.6, 4), '#5f6a72', sg * 9.5 + cx * 2.3, 21.5, cz * 2.3); sp.rotation.y = Math.PI / 4; }
        const cap = mesh(gp, new T.ConeGeometry(3, 3.6, 4), '#5f6a72', sg * 9.5, 20.2, 0); cap.rotation.y = Math.PI / 4;
        mesh(gp, new T.SphereGeometry(0.3, 6, 5), '#e2c94c', sg * 9.5, 22.2, 0);
        box(gp, 14, 1.3, 1.3, blue, 0, 13.4, sg * 1.25);                 // high walkways
        box(gp, 14, 0.25, 1.4, '#f2f2ee', 0, 14.7, sg * 1.25);
        box(gp, 2.6, 6.2, 3.6, st, sg * (W2 / 2 - 1.3), 0, 0);           // the little towers at the shore
        const chain = box(gp, 13.4, 0.5, 0.5, blue, sg * 16.3, 8, b.depth / 2 - 0.2); chain.rotation.z = -sg * 0.42;
        const chain2 = box(gp, 13.4, 0.5, 0.5, blue, sg * 16.3, 8, -b.depth / 2 + 0.2); chain2.rotation.z = -sg * 0.42;
      }
    }
    for (let i = 0; i < (b.road || 0); i++) {   // red buses going over
      const bus = new T.Group(); mesh(bus, busGeo, '#d8261e', 0, 0.75, 0); mesh(bus, glass, '#2a3138', 0, 0.55, 0); mesh(bus, glass, '#2a3138', 0, 1.15, 0);
      gp.add(bus); buses.push({ bus, half: W2 / 2 + 22, lane: i % 2 ? 1 : -1, y: top, ph: r(), sp: 4 + r() * 2 });
    }
  }

  // ---- Landmarks. Each is built facing the water (its own +z), then stood in its place.
  const glassy = (c) => new T.MeshLambertMaterial({ color: c, emissive: '#22323c' });
  { // The City's towers, with the Walkie-Talkie and the Gherkin
    const w = group(M.walkie); const wt = cyl(w, 5.4, 4, 24, glassy('#c4d6e0'), 0, 0, 0, 4); wt.rotation.y = Math.PI / 4; wt.scale.set(1.25, 1, 0.9);
    const gk = group(M.gherkin);
    const lat = pic(128, 128, (c) => { c.fillStyle = '#9fc0d0'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#2f4a5a'; c.lineWidth = 5; for (let i = -128; i < 256; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 128, 128); c.moveTo(i + 128, 0); c.lineTo(i, 128); c.stroke(); } });
    lat.wrapS = lat.wrapT = T.RepeatWrapping; lat.repeat.set(3, 3);
    const prof = [[3.1, 0], [4, 5], [4.4, 10], [4.2, 15], [3.3, 20], [1.9, 24], [0.5, 26.6], [0, 27]].map(p => new T.Vector2(p[0], p[1]));
    mesh(gk, new T.LatheGeometry(prof, 16), new T.MeshLambertMaterial({ map: lat, emissive: '#18242c' }), 0, 0, 0);
    box(group(M.city1), 6, 22, 6, glassy('#aebfca'), 0, 0, 0); box(group(M.city2), 7, 28, 7, glassy('#b9c9d2'), 0, 0, 0); box(group(M.city3), 6, 18, 6, glassy('#c9d3da'), 0, 0, 0);
  }
  { // The Shard
    const sh = group(M.shard); const p = mesh(sh, new T.ConeGeometry(6.4, 58, 4), glassy('#c2dcea'), 0, 29, 0); p.rotation.y = Math.PI / 4;
    box(sh, 9, 2.5, 9, '#a9b7c2', 0, 0, 0);
  }
  { // St Paul's: the nave along the river, the dome on its drum, the two west towers
    const sp = group(M.stpauls), stone = '#ddd7c8', lead = '#8f9aa0';
    const cols = pic(128, 32, (c) => { c.fillStyle = stone; c.fillRect(0, 0, 128, 32); c.fillStyle = '#8a8474'; for (let i = 0; i < 16; i++) c.fillRect(i * 8 + 3, 5, 2.4, 24); });
    const colMat = new T.MeshLambertMaterial({ map: cols });
    box(sp, 26, 8, 9, colMat, 0, 0, 0); box(sp, 9, 8, 15, colMat, 1, 0, 0);
    cyl(sp, 4.6, 4.6, 5.5, colMat, 1, 8, 0, 20);
    const dome = mesh(sp, new T.SphereGeometry(4.5, 20, 10, 0, TAU, 0, Math.PI / 2), lead, 1, 13.5, 0); dome.scale.y = 1.25;
    cyl(sp, 0.9, 1, 2.8, stone, 1, 19, 0, 8); mesh(sp, new T.SphereGeometry(0.55, 8, 6), '#e2c94c', 1, 22.3, 0);
    box(sp, 0.14, 1.5, 0.14, '#e2c94c', 1, 22.6, 0); box(sp, 0.9, 0.14, 0.14, '#e2c94c', 1, 23.5, 0);
    // the west front is the upriver end: on this bank that is the model's -x
    for (const sg of [-1, 1]) { box(sp, 2.8, 13, 2.8, colMat, -11.5, 0, sg * 3.1); const c2 = mesh(sp, new T.SphereGeometry(1.3, 8, 6), lead, -11.5, 13.2, sg * 3.1); c2.scale.y = 1.4; }
  }
  { // Tate Modern: the old power station, brick with one square chimney
    const tm = group(M.tate);
    box(tm, 24, 7.5, 10, '#8a6a55', 0, 0, 0); box(tm, 24, 1.1, 10, '#d9e4ea', 0, 7.5, 0); box(tm, 3, 24, 3, '#7d5f4c', 0, 0, 3.5);
  }
  let wheel = null;
  { // The London Eye: its face to the river, turning slowly
    const eye = group(M.eye), white = '#f4f6f8', RR = 15, hubY = 17;
    wheel = new T.Group(); wheel.position.set(0, hubY, 0); eye.add(wheel);
    for (const dz of [-0.45, 0.45]) mesh(wheel, new T.TorusGeometry(RR, 0.16, 6, 64), white, 0, 0, dz);
    const spokes = [];
    for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; spokes.push(0, 0, 0, Math.cos(a) * RR, Math.sin(a) * RR, 0); }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(spokes, 3));
    wheel.add(new T.LineSegments(sg, new T.LineBasicMaterial({ color: '#e8edf0' })));
    const pods = [];
    for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; pods.push(K.mat(Math.cos(a) * (RR + 0.7), Math.sin(a) * (RR + 0.7), 0, 0.55, 0.42, 0.7)); }
    K.inst(wheel, new T.SphereGeometry(1, 8, 6), glassy('#dfeaf0'), pods);
    cyl(eye, 0.5, 0.5, 2.2, white, 0, hubY - 1.1, 0, 10).rotation.x = Math.PI / 2;
    for (const sx of [-1, 1]) { const leg = cyl(eye, 0.32, 0.4, 21, white, sx * 3.4, 0, -6.2, 8); leg.position.y = hubY / 2 - 0.2; leg.rotation.set(0.62, 0, sx * 0.33, 'YXZ'); }
    box(eye, 8, 0.8, 3, '#d8d8d2', 0, 0.2, 1.5);
  }
  { // Big Ben (the Elizabeth Tower) and the Houses of Parliament
    const tw = group(M.bigben), gold = '#c9ad74', dark = '#5a5648';
    box(tw, 3.4, 18, 3.4, gold, 0, 0, 0); box(tw, 4, 4.4, 4, '#d9c08a', 0, 18, 0);
    const clock = pic(128, 128, (c) => {
      c.fillStyle = '#d9c08a'; c.fillRect(0, 0, 128, 128);
      c.beginPath(); c.arc(64, 64, 54, 0, TAU); c.fillStyle = '#fbf8ee'; c.fill(); c.lineWidth = 7; c.strokeStyle = '#3a3428'; c.stroke();
      c.lineWidth = 4; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(64 + Math.cos(a) * 40, 64 + Math.sin(a) * 40); c.lineTo(64 + Math.cos(a) * 49, 64 + Math.sin(a) * 49); c.stroke(); }
      c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 24); c.moveTo(64, 64); c.lineTo(88, 78); c.stroke();
    });
    const face = new T.MeshBasicMaterial({ map: clock });
    for (let i = 0; i < 4; i++) { const f = mesh(tw, new T.PlaneGeometry(3.5, 3.5), face, Math.sin(i * Math.PI / 2) * 2.03, 20.2, Math.cos(i * Math.PI / 2) * 2.03); f.rotation.y = i * Math.PI / 2; }
    box(tw, 3.6, 2.2, 3.6, dark, 0, 22.4, 0);
    const spire = mesh(tw, new T.ConeGeometry(2.7, 5.6, 4), dark, 0, 27.4, 0); spire.rotation.y = Math.PI / 4;
    mesh(tw, new T.SphereGeometry(0.25, 6, 5), '#e2c94c', 0, 30.3, 0);
    const pal = group(M.palace);
    const gothic = pic(256, 32, (c) => { c.fillStyle = gold; c.fillRect(0, 0, 256, 32); c.fillStyle = '#7a6a48'; for (let i = 0; i < 32; i++) { c.fillRect(i * 8 + 2.5, 6, 3, 9); c.fillRect(i * 8 + 2.5, 19, 3, 9); } });
    box(pal, 44, 7, 9, new T.MeshLambertMaterial({ map: gothic }), 0, 0, 0);
    const pins = [];
    for (let i = 0; i < 23; i++) pins.push(K.mat(-22 + i * 2, 7.9, 4.4, 0.32, 1.9, 0.32));
    K.inst(pal, new T.ConeGeometry(1, 1, 4), lam(gold), pins);
    box(pal, 6, 21, 6, gold, -24, 0, -1);                              // the Victoria Tower, at the upriver end
    for (const cx of [-1, 1]) for (const cz of [-1, 1]) mesh(pal, new T.ConeGeometry(0.6, 3, 4), dark, -24 + cx * 2.7, 22.5, -1 + cz * 2.7);
    box(pal, 0.08, 3.4, 0.08, '#f4f4f0', -24, 21, -1); box(pal, 1.5, 0.9, 0.05, '#c8322a', -23.2, 23.4, -1);
    mesh(pal, new T.ConeGeometry(1.2, 9, 8), dark, 0, 11.5, -1);   // the spire over the middle
  }
  { // Battersea Power Station: a brick block with a tall pale chimney at each corner
    const ps = group(M.power), brick = '#9c6c50';
    box(ps, 28, 12.5, 18, brick, 0, 0, 0); box(ps, 16, 2, 10, '#8a5c44', 0, 12.5, 0);
    for (const [cx, cz] of [[-11, -6], [11, -6], [-11, 6], [11, 6]]) { box(ps, 4.2, 16, 4.2, brick, cx, 0, cz); cyl(ps, 1.1, 1.5, 12, '#f1ead6', cx, 16, cz, 12); }
  }
  // The mooring post she starts on, and somebody's lost balloon
  cyl(scene, 0.35, 0.45, 3, '#6a5238', M.post.x, -0.5, M.post.z, 7);
  const balloon = new T.Group(); balloon.position.set(M.balloon.x, 15, M.balloon.z); scene.add(balloon);
  const bl = mesh(balloon, new T.SphereGeometry(1.1, 12, 10), new T.MeshLambertMaterial({ color: '#d8322a', emissive: '#40100c' }), 0, 0, 0); bl.scale.y = 1.25;
  box(balloon, 0.04, 3, 0.04, '#f4f4f0', 0, -4.4, 0);
  // Boats on the water
  const boats = [];
  for (let i = 0; i < 4; i++) {
    const bt = new T.Group(); box(bt, 1.8, 0.7, 6.4, '#f4f4f0', 0, 0, 0); box(bt, 1.5, 0.7, 3.4, i % 2 ? '#2f5f9a' : '#c8322a', 0, 0.7, -0.3); box(bt, 1.52, 0.3, 3.42, '#2a3138', 0, 0.9, -0.3);
    scene.add(bt); boats.push({ bt, lat: i % 2 ? 9 : -9, dir: i % 2 ? 1 : -1, u: 1.5 + i * 3.1 });
  }
  return {
    balloon,
    frame(g, dt) {
      wheel.rotation.z += dt * 0.06;
      balloon.position.y = 15 + Math.sin(g.t * 0.8) * 0.6; balloon.rotation.y += dt * 0.3;
      for (const b of buses) { const x = ((g.t * b.sp + b.ph * b.half * 2) % (b.half * 2)) - b.half; b.bus.position.set(b.lane * x, b.y, b.lane * 0.75); }
      for (const b of boats) {
        b.u += b.dir * dt * 0.06; if (b.u > 14.6) b.u = 0.3; if (b.u < 0.3) b.u = 14.6;
        const q = R.side(b.u, b.lat); b.bt.position.set(q.x, 0, q.z); b.bt.rotation.y = q.yaw + (b.dir < 0 ? Math.PI : 0);
      }
    },
  };
}

// What a stop looks like: a planter of flowers, a buddleia bush on a wall, or a thistle
function thamesStop(T, f) {
  const gp = new T.Group(), K = FlightKit, r = rng(Math.round(Math.abs(f.x * 7 + f.z)) + 3);
  const m = (geo, col, x, y, z) => { const o = new T.Mesh(geo, new T.MeshLambertMaterial({ color: col })); o.position.set(x, y, z); gp.add(o); return o; };
  if (f.kind === 'thistle') {
    for (const [sx, sz, h] of [[0, 0, 2.7], [0.9, 0.5, 2.1], [-0.8, 0.6, 2.3], [0.2, -0.9, 1.9]]) {
      m(new T.CylinderGeometry(0.07, 0.1, h, 5), '#6f9860', sx, h / 2, sz);
      for (let k = 0; k < 4; k++) { const lf = m(new T.ConeGeometry(0.16, 1.1, 4), '#7fa86c', sx, 0.5 + k * h / 5, sz); lf.rotation.set(0, k * 1.9, 1.25, 'YXZ'); lf.position.x += Math.cos(k * 1.9) * 0.4; lf.position.z -= Math.sin(k * 1.9) * 0.4; }
      m(new T.SphereGeometry(0.34, 8, 6), '#5f8a56', sx, h + 0.15, sz);
      m(new T.CylinderGeometry(0.42, 0.24, 0.42, 9), '#b05ac8', sx, h + 0.6, sz);
    }
    return gp;
  }
  if (f.kind === 'buddleia') {
    for (const [bx, by, bz, br] of [[0, 1.3, 0, 1.5], [1.1, 1.8, 0.3, 1.1], [-1, 1.9, -0.2, 1.2]]) { const b = m(new T.IcosahedronGeometry(br, 0), '#5a8450', bx, by, bz); b.material.flatShading = true; }
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + r(), sp = m(new T.ConeGeometry(0.26, 1.7, 6), k % 3 ? '#8a5ac8' : '#a878dc', Math.cos(a) * 1.5, 2.6 + r() * 0.6, Math.sin(a) * 1.5); sp.rotation.set(0.7, -a + Math.PI / 2, 0, 'YXZ'); }
    m(new T.ConeGeometry(0.3, 1.8, 6), '#9a68d4', 0, 3.4, 0);
    return gp;
  }
  m(new T.BoxGeometry(3.6, 0.9, 1.7), '#8a6a4a', 0, 0.45, 0);
  m(new T.BoxGeometry(3.3, 0.3, 1.4), '#5a8450', 0, 0.95, 0);
  const cols = ['#f4a0c8', '#f2d040', '#ffffff', '#c86ad8', '#f07848'];
  for (let k = 0; k < 12; k++) m(new T.SphereGeometry(0.3, 6, 5), cols[k % 5], -1.4 + (k % 6) * 0.56, 1.3 + r() * 0.25, k < 6 ? -0.35 : 0.35);
  return gp;
}

Missions.ldn_thames = flightLevel({
  id: 'ldn_thames', stage: 'Painted lady', place: 'Up the Thames, a summer afternoon',
  sprite: 'paintedLady', model: 'paintedLady', bg: 'ldnThames', goal: 7, gentle: true, sky: '#bcdcf0', far: 330,   // nothing is drawn past the fog
  SIPS: 4,
  facts: [
    'Painted ladies reach Britain every summer from North Africa, the Middle East and southern Europe.',
    'They cannot live through a British winter. Every one you see flew in, or is the child of one that did.',
    'This flight is in 3D.',
  ],
  how: [
    'Press Flap to take off, and keep flapping to climb.',
    'Steer with the arrow keys, or touch and drag left and right. Nose down to go faster.',
    'High up, the wind carries you along the river. Come down to sip at 4 flowers on the way.',
    'Fly on to the thistles in Battersea Park, land, and hold Lay. Three eggs!',
    'Bridges: over the top, or under the arches. You choose.',
  ],
  factText: {
    start: 'This painted lady has flown here from the south. No painted lady can live through a British winter.',
    takeoff: 'Butterflies fly by flapping their wings in a figure-eight, which makes swirls of air that lift them.',
    wind: 'Painted ladies fly high to ride the wind. On their autumn flight south, radar has tracked them more than 500 metres up, going as fast as 30 miles an hour.',
    sip: 'A butterfly sips nectar through its proboscis, a long tube that uncurls like a party blower.',
    buddleia: 'Painted ladies often come into gardens to feed on buddleia.',
    trip: 'Painted ladies go from tropical Africa to the Arctic Circle and back each year: about 9,000 miles. No butterfly does it all. It takes up to six generations, each flying one leg.',
    spots: 'Spot the difference: the Australian painted lady usually has blue centres in the spots on her back wings. This one’s spots are dark.',
    lay: 'She lays her eggs on thistles, the food her caterpillars like best.',
    nodgl: 'This device can’t show the 3D flight, so the butterfly flies off on its own.',
    win: 'Eggs on the thistles! In autumn the butterflies that grow up here will set off south again.',
  },
  sights: [
    { key: 'tower', name: 'Tower Bridge', x: THAMES.bridges[0].q.x, z: THAMES.bridges[0].q.z, r: 130 },
    { key: 'stpauls', name: 'St Paul’s', x: THAMES.marks.stpauls.x, z: THAMES.marks.stpauls.z, r: 120 },
    { key: 'eye', name: 'the London Eye', x: THAMES.marks.eye.x, z: THAMES.marks.eye.z, r: 120 },
    { key: 'bigben', name: 'Big Ben', x: THAMES.marks.bigben.x, z: THAMES.marks.bigben.z, r: 120 },
  ],

  start() { const q = THAMES.marks.post; return { x: q.x, y: 3.1, z: q.z, yaw: q.yaw }; },
  ground: THAMES.ground,
  layout(g) {
    g.fl.flowers = THAMES.stops.map(f => Object.assign({ visited: false }, f));
    g.fl.solids = THAMES.solids;
    g.fl.s = THAMES.near(g.fl.x, g.fl.z).s; g.fl.calm = 0;
  },
  scenery: thamesScenery,
  stop: thamesStop,
  can(g, f) { return f.kind === 'thistle' ? g.score >= this.SIPS : g.score < this.SIPS; },
  verb(g, f) { return f.kind === 'thistle' ? 'Lay' : 'Sip'; },
  yum(g, f) { return f.kind === 'thistle' ? 'An egg!' : 'Yum!'; },
  // The next stop is the nearest one still ahead of her, so the arrow never sends her back down the river
  target(g) {
    const fl = g.fl, left = fl.flowers.filter(f => !f.visited && this.can(g, f)), ahead = left.filter(f => f.s > fl.s - 12);
    const pick = ahead.length ? ahead : left;
    return pick.length ? pick.reduce((a, c) => Math.hypot(c.x - fl.x, c.z - fl.z) < Math.hypot(a.x - fl.x, a.z - fl.z) ? c : a) : null;
  },
  // She stays over the river and its banks
  keep(g, fl) {
    const n = THAMES.near(fl.x, fl.z), q = n.q, lim = 78;
    if (Math.abs(n.lat) > lim) { const push = (Math.abs(n.lat) - lim) * Math.sign(n.lat); fl.x -= -q.tz * push; fl.z -= q.tx * push; }
    const lo = -78, hi = THAMES.END + 55;
    if (n.s < lo) { fl.x += q.tx * (lo - n.s); fl.z += q.tz * (lo - n.s); }
    if (n.s > hi) { fl.x -= q.tx * (n.s - hi); fl.z -= q.tz * (n.s - hi); }
    fl.s = n.s;
  },
  // High up, a wind blows along the river, the way she is going
  windNow(g, fl) { const q = THAMES.near(fl.x, fl.z).q; return { x: q.tx, z: q.tz, sp: 8, y0: 22, y1: 40 }; },
  tick(g, dt) {
    const fl = g.fl, d = g.fl3d;
    if (fl.windK > 0.6) { Game.fact('wind'); fl.calm = -1e9; }
    else if (fl.flying && !fl.landed && (fl.calm += dt) > 14 && fl.s > 40) { fl.calm = 0; Game.hint('Flap up high! The wind up there carries you along the river.'); }
    if (fl.s > THAMES.at(THAMES.U.waterloo).s) Game.fact('trip');
    if (fl.s > THAMES.at(THAMES.U.lambeth).s) Game.fact('spots');
    if (g.score < this.SIPS && fl.s > THAMES.at(THAMES.U.chelsea).s && !fl.told) { fl.told = true; g.toasts.unshift({ text: 'She is too hungry to lay yet. Find ' + (this.SIPS - g.score) + ' more flowers to sip at first.', kind: 'hint' }); g.toastT = 0; }
    const b = THAMES.marks.balloon;   // the lost thing
    if (g.secret && !g.secret.found && d && Math.hypot(b.x - fl.x, b.z - fl.z, 15 - fl.y) < 3.2) {
      g.secret.found = true; d.world.balloon.visible = false;
      Game.foundSecret(g.secret.key, g.secret.text, W / 2, H / 2 - 40);
    }
  },
  done(g, f) {
    if (f.kind === 'buddleia') Game.fact('buddleia');
    if (g.score === this.SIPS) { g.toasts.unshift({ text: 'Full of nectar! Now fly on up the river to the thistles in Battersea Park.', kind: 'hint' }); g.toastT = 0; }
  },
  // A strip along the top: how far up the river she has come
  overlay(ctx, g) {
    const fl = g.fl, x0 = W / 2 - 150, y = 74, k = clamp(fl.s / THAMES.END, 0, 1);
    ctx.fillStyle = 'rgba(255,250,240,.75)'; ctx.fillRect(x0 - 8, y - 9, 316, 18);
    ctx.fillStyle = '#7fa8c2'; ctx.fillRect(x0, y - 2, 300, 4);
    ctx.fillStyle = '#2b2118';
    for (const u of [THAMES.U.tower, THAMES.U.millennium, THAMES.U.eye, THAMES.U.westminster, THAMES.U.power, THAMES.U.park]) ctx.fillRect(x0 + 300 * clamp(THAMES.at(u).s / THAMES.END, 0, 1) - 1, y - 5, 2, 10);
    ctx.beginPath(); ctx.arc(x0 + 300 * k, y, 6, 0, TAU); ctx.fillStyle = '#f08a2e'; ctx.fill(); ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#2b2118'; ctx.textAlign = 'left'; ctx.fillText('Tower Bridge', x0 - 6, y + 22); ctx.textAlign = 'right'; ctx.fillText('Battersea Park', x0 + 306, y + 22);
  },
  hud(g) {
    const fl = g.fl;
    if (g.noGL) setHud('Flying off…', '');
    else if (!fl.flying) setHud('Press Flap to take off!', '');
    else if (g.score < this.SIPS) setHud('Sips: ' + g.score + ' / ' + this.SIPS, fl.landed ? 'Hold Sip' : fl.windK > 0.5 ? 'Riding the wind' : '');
    else setHud('Eggs: ' + Math.min(3, g.score - this.SIPS) + ' / 3', fl.landed ? 'Hold Lay' : 'On to Battersea Park');
  },
  endLine(g) { return 'London things spotted: ' + this.sights.filter(s => g.spied.has(s.key)).length + ' of ' + this.sights.length + '.'; },
  won(g) { return g.score >= this.goal || !!g.homeSafe; },
});
Missions.ldn_thames.sex = 'You are a female.';

// Her place on the London map, in the Bug Book and on the bus tour (js/london2.js puts her last: the long flight home)
const LDN_LADY = { id: 'l_lady', stage: 'ldn_thames', name: 'Painted Lady', sci: 'Vanessa cardui', place: 'The Thames', pin: { x: 852, y: 338 } };
LDN_STOP.ldn_thames = 'the River Thames. Now you’re a painted lady, flying right through the middle of London!';
