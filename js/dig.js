'use strict';
// Sugar ant nest, side-on like an ant farm. Dig tunnels anywhere, carry the soil up to build the mound,
// make rooms for the queen's eggs and for food, fetch honeydew, and plug the entrance before rain floods in.

const NEST = { cell: 24, surf: 300, cols: 80, rows: 37 };   // world 1920 x (300 + 37 * 24 = 1188)
const SOIL_HARD = { 1: 0.3, 2: 0.4, 3: 0.9, 6: 0.25 };      // seconds to dig: topsoil, deep soil, clay, packed soil
const ROOM_TYPES = [
  { id: 'nursery', name: 'Nursery', color: 'rgba(255,240,200,.18)' },
  { id: 'food', name: 'Food store', color: 'rgba(255,220,120,.18)' },
  { id: 'rubbish', name: 'Rubbish room', color: 'rgba(160,140,110,.18)' },
];

Object.assign(Sprites, {
  // Banded sugar ant: black head, orange band on the body, long legs.
  sugarAnt(ctx, o, t) {
    legs6(ctx, 3, 15, '#2a1a10', 1.4, t, o.moving, 1);
    const full = o.honey ? 1.35 : 1;
    ell(ctx, -11, 0, 8 * full, 6 * full, '#1e1612');
    ctx.save(); ctx.beginPath(); ctx.ellipse(-11, 0, 8 * full, 6 * full, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = o.honey ? 'rgba(240,190,60,.55)' : 'rgba(0,0,0,0)'; ctx.fillRect(-20, -8, 18, 16);
    ctx.restore();
    ell(ctx, -4.5, 0, 2.2, 2.2, '#c86a28');
    ell(ctx, 2.5, 0, 6, 3.4, '#d07a30');
    ell(ctx, 11, 0, 5.4, 5.2, '#221a14');
    eye(ctx, 12, -3.8, 1.6, 1.3); eye(ctx, 12, 3.8, 1.6, 1.3);
    for (const s of [-1, 1]) line(ctx, [14.5, s * 2.5, 18, s * 9, 25, s * 9], '#2a1a10', 1);
    if (o.crumbs) for (let i = 0; i < o.crumbs; i++) ell(ctx, 18 + (i % 2) * 3, (i - 1.5) * 2.4, 2.4, 2.2, '#8a6a42');
  },
  queenSugar(ctx, o, t) {
    ctx.save(); ctx.scale(1.4, 1.4); Sprites.sugarAnt(ctx, Object.assign({}, o, { moving: false }), t); ctx.restore();
  },
  antEgg(ctx, o) { ell(ctx, 0, 0, 3.4 + (o.grow || 0) * 2, 2.2 + (o.grow || 0) * 1.4, o.grow > 0.6 ? '#f0e8d0' : '#fffaf0'); },
  honeydew(ctx) { ell(ctx, 0, 0, 4, 4.4, 'rgba(240,200,90,.9)'); plainEll(ctx, -1.2, -1.6, 1.2, 1, 'rgba(255,255,255,.8)'); },
  lerpBug(ctx) { ell(ctx, 0, 0, 3.4, 2.4, '#7a8a3a'); plainEll(ctx, -2, 0, 1.6, 1.4, 'rgba(255,240,180,.9)'); },
});

Bugs.push({ id: 'sugarant', name: 'Sugar Ant', sci: 'Camponotus', place: 'Bull Creek', sprite: 'sugarAnt',
  pin: { x: 585, y: 552 }, stages: ['nest'] });

Missions.nest = {
  id: 'nest', bug: 'sugarant', stage: 'Worker', place: 'Under a backyard in Bull Creek', view: 'side',
  world: { w: NEST.cols * NEST.cell, h: NEST.surf + NEST.rows * NEST.cell }, sprite: 'sugarAnt', bg: 'nestSoil', escape: 'Climb',
  action: 'Build', radius: 10, speed: 120, scale: 1.3, goal: 4,
  home: { x: 960, y: NEST.surf + 3.5 * NEST.cell, r: 30, label: '' },
  facts: [
    'Sugar ants live in nests under the ground all around Perth. They come out mostly at night.',
    'Worker ants dig the nest. They carry the soil out and pile it up by the entrance.',
    'A nest has rooms: nurseries for eggs and young, and stores for food.',
  ],
  how: [
    'Walk into the soil to dig. You carry up to 4 crumbs of soil at a time.',
    'Take the soil up to the surface: it builds your mound by the entrance.',
    'In a big open space, press Make room: first a nursery for the queen, then a food store.',
    'Fetch honeydew from the bugs on the plant and bring it to the food store. Press Build to put soil back. Plug the entrance before it rains!',
  ],
  discoveries: [],
  factText: {
    start: 'Ant nests can go deep: some go down more than a metre, where the soil stays cool and damp.',
    dig: 'Ants dig with their jaws, biting off little pellets of soil and carrying them out.',
    mound: 'The pile of soil around the entrance is called a mound. It shows how much the ants have dug.',
    full: 'An ant can carry things many times heavier than itself.',
    nursery: 'The queen lays eggs in the nursery. Workers lick the eggs clean and keep them at the right warmth.',
    food: 'Food is stored in special rooms. Some ants keep food in their own crops and share it mouth to mouth.',
    rubbish: 'Ants keep their nest clean. Rubbish and dead ants go to a rubbish room or outside.',
    honeydew: 'Sugar ants “farm” sap-sucking bugs like lerps and scale insects, guarding them and drinking the sweet honeydew they make.',
    clay: 'Clay is hard to dig. Ants often dig around it.',
    rock: 'Ants can’t dig through rock or big roots, so tunnels bend around them.',
    rain: 'Before rain, ants plug the nest entrance with soil to keep the water out.',
    flood: 'Water rushes down open tunnels. Ants carry their eggs up to dry rooms when a nest floods.',
    larvae: 'Ant eggs hatch into larvae, which look like little white grubs. Workers feed them.',
    build: 'Ants also build: they pack soil to make walls, ceilings and plugs.',
    win: 'Your nest is up and running! A sugar ant colony can grow to thousands of ants.',
  },

  setup(g) {
    g.netDone = true;
    const R = NEST.rows, C = NEST.cols, r = rng(Math.floor(Math.random() * 1000));
    // Soil types: topsoil near the top, darker deep soil below, patches of clay, rocks and roots
    g.grid = [];
    for (let i = 0; i < R; i++) {
      g.grid.push([]);
      for (let j = 0; j < C; j++) g.grid[i].push(i < 8 ? 1 : 2);
    }
    const blob = (type, n, rad) => { for (let k = 0; k < n; k++) { const ci = 6 + Math.floor(r() * (R - 8)), cj = Math.floor(r() * C); for (let i = -rad; i <= rad; i++) for (let j = -rad - 1; j <= rad + 1; j++) if ((i * i) / (rad * rad + 0.1) + (j * j) / ((rad + 1) * (rad + 1)) < 1 && g.grid[ci + i] && g.grid[ci + i][cj + j] !== undefined) g.grid[ci + i][cj + j] = type; } };
    blob(3, 9, 3); blob(4, 12, 1);
    // A few roots coming down from the plants
    for (const rx of [12, 33, 62]) { let j = rx; for (let i = 0; i < 14; i++) { if (g.grid[i]) g.grid[i][j] = 5; j += r() < 0.3 ? 1 : r() < 0.3 ? -1 : 0; } }
    // The starting entrance and a small chamber; no rocks or roots straight under the entrance
    const ec = Math.floor(960 / NEST.cell);
    for (let i = 0; i < 18; i++) for (let j = ec - 1; j <= ec + 1; j++) if (g.grid[i][j] >= 3) g.grid[i][j] = i < 8 ? 1 : 2;
    for (let i = 0; i <= 4; i++) g.grid[i][ec] = 0;
    for (let i = 3; i <= 4; i++) for (let j = ec - 2; j <= ec + 2; j++) g.grid[i][j] = 0;
    g.water = g.grid.map(row => row.map(() => 0));
    g.rooms = []; g.mound = 0; g.food = 0; g.eggs = [];
    g.rainT = 70; g.raining = 0; g.flowT = 0; g.digT = 0; g.digCell = null;
    g.plant = { x: 1400, y: NEST.surf - 6 };
    const p = g.player; p.crumbs = 0; p.honey = false; p.face = 1;
    p.x = ec * NEST.cell + 12; p.y = NEST.surf + 3.5 * NEST.cell;
    g.cacheDirty = true;
    Game.later(2, () => Game.hint('Walk into the soil to dig! Then carry it up to the surface.'));
  },
  cellOf(x, y) { return { r: Math.floor((y - NEST.surf) / NEST.cell), c: Math.floor(x / NEST.cell) }; },
  at(g, r, c) { if (r < 0) return 0; return g.grid[r] && g.grid[r][c] !== undefined ? g.grid[r][c] : 4; },
  solid(g, x, y) { if (y < NEST.surf) return false; const { r, c } = this.cellOf(x, y); return this.at(g, r, c) !== 0; },
  above(g) { return g.player.y < NEST.surf - 2; },
  locked() { return false; },
  move(g, dt, dx, dy) {
    const p = g.player, sp = p.speed, N = NEST.cell;
    const len = Math.hypot(dx, dy);
    p.moving = false;
    if (!len) { g.digCell = null; return; }
    dx /= len; dy /= len;
    p.angle = Math.atan2(dy, dx);
    if (Math.abs(dx) > 0.2) p.face = dx > 0 ? 1 : -1;
    // On the surface: walk along the ground; go down where a tunnel opens
    if (this.above(g)) {
      p.x = clamp(p.x + dx * sp * dt, 20, World.w - 20);
      const open = !this.solid(g, p.x, NEST.surf + 4);
      if (dy > 0.5 && open) p.y += dy * sp * dt;
      else {
        p.y = NEST.surf - 8;
        // Pressing down where the ground is soft digs a way in (or reopens a plugged entrance)
        const { c } = this.cellOf(p.x, NEST.surf + 4), t = this.at(g, 0, c);
        if (dy > 0.5 && (t === 6 || t === 1)) { this.digAt(g, 0, c, dt); return; }
      }
      p.moving = true;
      return;
    }
    // Underground: move through open tunnels; pushing into soil digs it
    const look = 9;
    // Can the ant's head go to (nx, ny), heading (hx, hy)?
    const tryMove = (nx, ny, hx, hy) => {
      const l = Math.hypot(hx, hy) || 1, ex = nx + hx / l * look, ey = ny + hy / l * look;
      if (ey < NEST.surf) return true;
      return !this.solid(g, ex, ey);
    };
    const nx = p.x + dx * sp * dt, ny = p.y + dy * sp * dt;
    if (tryMove(nx, ny, dx, dy)) { p.x = nx; p.y = ny; p.moving = true; g.digCell = null; return; }
    // Slide along walls when heading at an angle
    if (Math.abs(dx) > 0.3 && tryMove(nx, p.y, dx, 0)) { p.x = nx; p.moving = true; return; }
    if (Math.abs(dy) > 0.3 && tryMove(p.x, ny, 0, dy)) { p.y = ny; p.moving = true; return; }
    // Blocked: dig the cell in front
    const { r, c } = this.cellOf(p.x + dx * (look + 4), p.y + dy * (look + 4));
    this.digAt(g, r, c, dt);
  },
  digAt(g, r, c, dt) {
    const p = g.player, N = NEST.cell, type = this.at(g, r, c);
    if (type === 0) return;
    if (type === 4 || type === 5) { if (Math.random() < dt) Game.fact('rock'); g.digCell = null; return; }
    if (p.crumbs >= 4) { Game.hint('Your jaws are full! Take the soil up to the surface.'); Game.fact('full'); return; }
    if (!g.digCell || g.digCell.r !== r || g.digCell.c !== c) { g.digCell = { r, c }; g.digT = 0; }
    g.digT += dt;
    p.progress = g.digT / SOIL_HARD[type];
    p.moving = true;
    if (Math.floor(g.t * 6) !== Math.floor((g.t - dt) * 6)) Sound.play('tap');
    if (type === 3) Game.fact('clay');
    if (g.digT >= SOIL_HARD[type]) {
      g.grid[r][c] = 0; g.digCell = null; p.crumbs++;
      this.paintCell(g, r, c);
      Game.burst(c * N + N / 2, NEST.surf + r * N + N / 2, '#8a6a42', 6);
      Game.fact('dig');
    }
  },
  // Big enough open space around the ant to make a room?
  openSpace(g) {
    const p = g.player, { r, c } = this.cellOf(p.x, p.y);
    if (r < 2) return null;
    const seen = new Set(), q = [[r, c]];
    while (q.length && seen.size < 40) {
      const [i, j] = q.pop(), k = i * 1000 + j;
      if (seen.has(k) || this.at(g, i, j) !== 0 || Math.abs(i - r) > 3 || Math.abs(j - c) > 4 || i < 1) continue;
      seen.add(k);
      q.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]);
    }
    if (seen.size < 12) return null;
    if (g.rooms.some(rm => Math.abs(rm.r - r) <= 3 && Math.abs(rm.c - c) <= 4)) return null;
    return { r, c, cells: [...seen].map(k => [Math.floor(k / 1000), k % 1000]) };
  },
  update(g, dt, input) {
    const p = g.player, N = NEST.cell;
    if (g.cacheDirty) this.paintAll(g);
    const up = this.above(g);
    const nearEntrance = up && this.entrances(g).some(c => Math.abs(c * N + N / 2 - p.x) < 100);
    // Drop soil on the mound
    if (up && p.crumbs > 0 && nearEntrance) {
      g.mound += p.crumbs; Game.pop(p.x, p.y - 20, '+' + p.crumbs + ' mound', '#d8b880'); Sound.play('pick');
      p.crumbs = 0; Game.fact('mound');
    }
    // Honeydew from the sap-sucking bugs on the plant
    const atPlant = up && Math.abs(p.x - g.plant.x) < 50;
    const room = this.roomAt(g, p.x, p.y);
    if (p.honey && room && room.type === 'food') { p.honey = false; g.food++; Sound.play('score'); Game.pop(p.x, p.y - 20, 'Food!', '#f2c040'); }
    const space = !up && g.rooms.length < ROOM_TYPES.length ? this.openSpace(g) : null;
    const front = this.cellOf(p.x + Math.cos(p.angle) * 20, p.y + Math.sin(p.angle) * 20);
    const canBuild = p.crumbs > 0 && this.at(g, front.r, front.c) === 0 && front.r >= 0 && !(this.cellOf(p.x, p.y).r === front.r && this.cellOf(p.x, p.y).c === front.c);
    // Plug the entrance with soil you carry, or pull some from the mound
    const plugCell = up && (p.crumbs > 0 || g.mound > 0) ? this.entrances(g).find(c => Math.abs(c * N + N / 2 - p.x) < 30) : undefined;
    let act = 'Build', ready = canBuild || plugCell !== undefined;
    if (atPlant && !p.honey) { act = 'Milk'; ready = true; }
    else if (space) { act = 'Make room'; ready = true; }
    else if (plugCell !== undefined) act = 'Plug';
    setAction(act, ready);
    if (act === 'Milk' && working(input)) {
      g.milkT = (g.milkT || 0) + work(input, dt); p.progress = g.milkT;
      if (g.milkT >= 1) { g.milkT = 0; p.honey = true; Sound.play('pick'); Game.pop(p.x, p.y - 20, 'Honeydew!', '#f2c040'); Game.fact('honeydew'); }
    } else if (input.pressed) {
      if (act === 'Make room') {
        const type = ROOM_TYPES[g.rooms.length];
        g.rooms.push({ r: space.r, c: space.c, type: type.id, name: type.name, cells: space.cells });
        Sound.play('score'); Game.pop(p.x, p.y - 26, type.name + '!', '#ffd23f'); Game.fact(type.id);
        if (type.id === 'nursery') { g.queen = { x: p.x, y: p.y, angle: 0 }; for (let i = 0; i < 5; i++) g.eggs.push({ x: p.x + (i - 2) * 9, y: p.y + 6, grow: 0 }); }
        if (type.id === 'nursery') g.toasts.unshift({ text: 'The queen has moved in! Now dig another big space for a food store.', kind: 'hint' });
        else if (type.id === 'food') g.toasts.unshift({ text: 'Food store done! Fetch honeydew from the bugs on the plant up top.', kind: 'hint' });
        g.toastT = 0;
      } else if (plugCell !== undefined) {
        g.grid[0][plugCell] = 6; if (p.crumbs > 0) p.crumbs--; else g.mound--; g.water[0][plugCell] = 0; this.paintCell(g, 0, plugCell); Sound.play('tap'); Game.pop(p.x, p.y - 20, 'Plugged!', '#fff'); Game.fact('rain');
      } else if (canBuild) {
        g.grid[front.r][front.c] = 6; p.crumbs--; this.paintCell(g, front.r, front.c); Sound.play('tap'); Game.fact('build');
      }
    }
    if (p.stillT > 6 && p.crumbs === 0 && !up) Game.hint('Walk into the soil to dig.');
    // Eggs slowly become larvae
    for (const e of g.eggs) { e.grow = Math.min(1, e.grow + dt / 40); if (e.grow > 0.6) Game.fact('larvae'); }
    this.weather(g, dt);
    g.score = this.jobs(g);
  },
  jobs(g) { return (g.mound >= 30 ? 1 : 0) + (g.rooms.some(r => r.type === 'nursery') ? 1 : 0) + (g.rooms.some(r => r.type === 'food') ? 1 : 0) + (g.food >= 3 ? 1 : 0); },
  entrances(g) { const out = []; for (let c = 0; c < NEST.cols; c++) if (g.grid[0][c] === 0) out.push(c); return out; },
  roomAt(g, x, y) { const { r, c } = this.cellOf(x, y); return g.rooms.find(rm => rm.cells.some(([i, j]) => i === r && j === c)); },
  // Rain: water pours into any open entrance and runs down the tunnels, then soaks away.
  weather(g, dt) {
    g.rainT -= dt;
    if (!g.raining && g.rainT <= 10 && !g.warned) { g.warned = true; g.toasts.unshift({ text: 'Rain is coming! Go up, stand on the entrance and press Plug. To open it again later, press down on it.', kind: 'hint' }); g.toastT = 0; Sound.play('caught'); Game.fact('rain'); }
    if (!g.raining && g.rainT <= 0) { g.raining = 18; g.warned = false; }
    if (g.raining > 0) { g.raining -= dt; if (g.raining <= 0) g.rainT = 80 + Math.random() * 30; }
    g.flowT -= dt;
    if (g.flowT > 0) return;
    g.flowT = 0.12;
    const W2 = g.water, R = NEST.rows, C = NEST.cols;
    let total = 0;
    for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) total += W2[i][j];
    if (g.raining > 0 && total < 70) for (const c of this.entrances(g)) if (!W2[0][c]) { W2[0][c] = 1; total++; }
    // Flow: down first, then sideways
    for (let i = R - 2; i >= 0; i--) for (let j = 0; j < C; j++) {
      if (!W2[i][j]) continue;
      if (g.grid[i + 1][j] === 0 && !W2[i + 1][j]) { W2[i + 1][j] = 1; W2[i][j] = 0; continue; }
      const s = Math.random() < 0.5 ? -1 : 1;
      for (const d of [s, -s]) if (g.grid[i][j + d] === 0 && !W2[i][j + d] && Math.random() < 0.5) { W2[i][j + d] = 1; W2[i][j] = 0; break; }
    }
    // Soak away slowly when the rain stops
    if (!(g.raining > 0) && total && Math.random() < 0.35) {
      const wet = []; for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) if (W2[i][j]) wet.push([i, j]);
      const [i, j] = wet[Math.floor(Math.random() * wet.length)]; W2[i][j] = 0;
    }
    // Swept away?
    const p = g.player, { r, c } = this.cellOf(p.x, p.y);
    if (r >= 0 && W2[r] && W2[r][c] && p.invuln <= 0) {
      // Washed out: no hearts lost, but you land back on the surface and drop what you carry
      Game.fact('flood');
      p.x = Math.floor(960 / NEST.cell) * NEST.cell + 60; p.y = NEST.surf - 8; p.crumbs = 0; p.honey = false; p.invuln = 2;
      Game.pop(p.x, p.y - 24, 'Washed out!', '#9ad0ff'); Sound.play('caught');
      Game.hint('The water washed you out! Plug the entrance with soil next time it rains.');
    }
  },
  // The soil is painted once into a canvas, and cells are repainted as they change.
  paintAll(g) {
    const N = NEST.cell, k = Math.min(2, window.devicePixelRatio || 1);
    if (!g.soil) { g.soil = document.createElement('canvas'); g.soil.width = World.w * k; g.soil.height = (World.h - NEST.surf) * k; }
    const ctx = g.soil.getContext('2d'); ctx.setTransform(k, 0, 0, k, 0, 0);
    // Soil first, then tunnels on top so their rounded edges aren't covered
    for (let r = 0; r < NEST.rows; r++) for (let c = 0; c < NEST.cols; c++) if (g.grid[r][c]) this.paintCell(g, r, c, ctx);
    for (let r = 0; r < NEST.rows; r++) for (let c = 0; c < NEST.cols; c++) if (!g.grid[r][c]) this.paintCell(g, r, c, ctx);
    g.cacheDirty = false;
  },
  paintCell(g, r, c, ctxIn) {
    if (!g.soil) return;
    const N = NEST.cell, k = Math.min(2, window.devicePixelRatio || 1);
    const ctx = ctxIn || (() => { const x = g.soil.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0); return x; })();
    const x = c * N, y = r * N, t = g.grid[r][c], rr = rng(r * 131 + c * 17 + 3);
    const depth = r / NEST.rows;
    const soil = mix('#a8865a', '#4a3420', Math.min(1, depth * 1.2));
    const base = t === 3 ? '#b8683a' : t === 6 ? '#8a6a42' : soil;
    if (t === 0) {
      // Dug tunnel: dark and rounded, so tunnels look burrowed, not boxy
      ctx.fillStyle = soil; ctx.fillRect(x, y, N, N);
      ctx.beginPath(); ctx.arc(x + N / 2, y + N / 2, N * 0.7, 0, TAU); ctx.fillStyle = '#2a1c10'; ctx.fill();
      ctx.beginPath(); ctx.arc(x + N / 2, y + N / 2 - 2, N * 0.45, 0, TAU); ctx.fillStyle = 'rgba(70,50,30,.35)'; ctx.fill();
      return;
    }
    ctx.fillStyle = base; ctx.fillRect(x, y, N, N);
    // Soil grain, and a little sun on the top edge of every cell so the cross-section has some depth
    ctx.beginPath(); ctx.rect(x, y, N, N);
    if (Shade.rich && t !== 4) Tex.fillPath(ctx, t === 3 ? 'grain' : 'soil', 1, t === 6 ? 0.55 : 0.4, 'multiply');
    if (t === 4) {
      ell(ctx, x + N / 2, y + N / 2, N * 0.6, N * 0.5, '#a8a296');
    } else if (t === 5) {
      plainLine(ctx, [x + N / 2, y, x + N / 2 + (rr() - 0.5) * 6, y + N], '#8a6a44', 8); plainLine(ctx, [x + N / 2, y, x + N / 2 + 6, y + N * 0.7], '#7a5a3a', 2);
    } else {
      for (let i = 0; i < 6; i++) plainEll(ctx, x + rr() * N, y + rr() * N, 1 + rr() * 1.6, 0.8 + rr(), t === 6 ? 'rgba(60,40,20,.5)' : 'rgba(40,25,10,.3)');
      if (t === 6) { ctx.strokeStyle = 'rgba(60,40,20,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 1, y + 1, N - 2, N - 2); }
      if (t === 2 && rr() < 0.08) plainEll(ctx, x + N / 2, y + N / 2, 5, 3, 'rgba(230,220,200,.5)');   // a pebble or shell bit
    }
  },
  drawBuild(ctx, g) {
    const N = NEST.cell;
    if (g.soil) ctx.drawImage(g.soil, 0, NEST.surf, World.w, World.h - NEST.surf);
    // Rooms: a warm glow and a label
    for (const rm of g.rooms) {
      const def = ROOM_TYPES.find(t => t.id === rm.type);
      ctx.fillStyle = def.color;
      for (const [i, j] of rm.cells) if (g.grid[i][j] === 0) { ctx.beginPath(); ctx.arc(j * N + N / 2, NEST.surf + i * N + N / 2, N * 0.62, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,240,200,.85)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(def.name, rm.c * N + N / 2, NEST.surf + (rm.r - 1) * N + 6);
      if (rm.type === 'food') for (let i = 0; i < g.food; i++) Game.drawSprite('honeydew', { x: rm.c * N + (i - g.food / 2) * 10, y: NEST.surf + rm.r * N + 16 }, 1.2);
      if (rm.type === 'rubbish') for (let i = 0; i < 5; i++) plainEll(ctx, rm.c * N - 12 + i * 6, NEST.surf + rm.r * N + 18, 2, 1.4, '#5a4a3a');
    }
    for (const e of g.eggs) Game.drawSprite('antEgg', e, 1.2);
    if (g.queen) Game.drawSprite('queenSugar', g.queen, 1.2);
    // Water in flooded tunnels
    for (let i = 0; i < NEST.rows; i++) for (let j = 0; j < NEST.cols; j++) if (g.water[i][j]) {
      ctx.fillStyle = 'rgba(70,140,200,.75)'; ctx.fillRect(j * N, NEST.surf + i * N + 2, N, N - 2);
      plainLine(ctx, [j * N + 3, NEST.surf + i * N + 5, j * N + N - 3, NEST.surf + i * N + 5], 'rgba(255,255,255,.4)', 1);
    }
    // Mound of dug soil around each entrance
    const ents = this.entrances(g), h = Math.min(70, Math.sqrt(g.mound) * 7);
    const ec = ents.length ? ents.reduce((a, c) => Math.abs(c * N - 960) < Math.abs(a * N - 960) ? c : a) : Math.floor(960 / N);
    const mx = ec * N + N / 2;
    if (h > 2) {
      ctx.beginPath(); ctx.moveTo(mx - h * 2.4, NEST.surf + 1); ctx.quadraticCurveTo(mx - h * 0.8, NEST.surf - h * 1.1, mx - 10, NEST.surf - h * 0.7);
      ctx.lineTo(mx + 10, NEST.surf - h * 0.7); ctx.quadraticCurveTo(mx + h * 0.8, NEST.surf - h * 1.1, mx + h * 2.4, NEST.surf + 1); ctx.closePath();
      ctx.fillStyle = '#9a7a4e'; ctx.fill();
      const r = rng(5); for (let i = 0; i < h * 3; i++) plainEll(ctx, mx + (r() - 0.5) * h * 3.6, NEST.surf - r() * h * 0.7, 1.6, 1.3, 'rgba(60,40,20,.4)');
      if (ents.includes(ec)) plainEll(ctx, mx, NEST.surf - h * 0.7, 8, 3, '#1a1008');
    }
    // Bugs making honeydew on the plant
    for (let i = 0; i < 5; i++) Game.drawSprite('lerpBug', { x: g.plant.x - 30 + i * 14, y: g.plant.y - 60 - (i % 2) * 18, angle: 0, flat: true }, 1.6);
    if (Math.sin(g.t * 3) > 0) Game.drawSprite('honeydew', { x: g.plant.x, y: g.plant.y - 40 + (g.t * 20) % 30 }, 1);
    // Rain
    if (g.raining > 0) {
      ctx.strokeStyle = 'rgba(200,220,255,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 160; i++) { const x = (i * 97 + g.t * 300) % World.w, y = (i * 53 + g.t * 700) % NEST.surf; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); }
      ctx.stroke();
    }
  },
  playerSprite() { return 'sugarAnt'; },
  goalPoint(g) {
    const p = g.player;
    if (p.honey) { const f = g.rooms.find(r => r.type === 'food'); return f ? { x: f.c * NEST.cell, y: NEST.surf + f.r * NEST.cell } : null; }
    if (p.crumbs >= 4) { const e = this.entrances(g)[0]; return e !== undefined ? { x: e * NEST.cell, y: NEST.surf - 8 } : null; }
    if (g.rooms.some(r => r.type === 'food') && g.food < 3) return { x: g.plant.x, y: g.plant.y };
    return null;
  },
  hud(g) {
    const done = [g.mound >= 30, g.rooms.some(r => r.type === 'nursery'), g.rooms.some(r => r.type === 'food'), g.food >= 3];
    setHud('Nest jobs: ' + done.filter(Boolean).length + ' / 4', 'Mound ' + Math.min(g.mound, 30) + '/30 · Soil ' + g.player.crumbs + '/4' + (g.rooms.some(r => r.type === 'food') ? ' · Food ' + g.food + '/3' : ''));
  },
  won(g) { return g.score >= 4; },
};

// Above ground: a backyard at night-ish dusk, a plant with lerps, and the soil cross-section below.
Backgrounds.nestSoil = function (ctx, W, H) {
  const r = rng(44);
  const sky = ctx.createLinearGradient(0, 0, 0, NEST.surf);
  sky.addColorStop(0, '#7aa6d0'); sky.addColorStop(1, '#d8e6c8');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, NEST.surf);
  // Fence and a house roof far behind
  for (let x = 0; x < W; x += 26) { ctx.fillStyle = (x / 26) % 2 ? '#a8885e' : '#b8986c'; ctx.fillRect(x, NEST.surf - 140, 25, 140); }
  ctx.fillStyle = '#c86a4a'; ctx.beginPath(); ctx.moveTo(200, NEST.surf - 140); ctx.lineTo(420, NEST.surf - 230); ctx.lineTo(640, NEST.surf - 140); ctx.fill();
  // Grass along the top of the soil
  for (let i = 0; i < 900; i++) { const x = r() * W; plainLine(ctx, [x, NEST.surf, x + (r() - 0.5) * 6, NEST.surf - 6 - r() * 14], r() < 0.5 ? '#5a8a3a' : '#7aa64a', 1.4); }
  // The shrub with the sap-sucking bugs
  const px = 1400;
  plainLine(ctx, [px, NEST.surf, px - 6, NEST.surf - 90], '#5a3a20', 6);
  for (let i = 0; i < 14; i++) { const a = r() * TAU, d = r() * 50; ell(ctx, px + Math.cos(a) * d, NEST.surf - 100 + Math.sin(a) * d * 0.6, 22, 14, i % 2 ? '#5a8a44' : '#4a7a3a'); }
};

finishMissions();
Missions.nest.factText.tank = '';
