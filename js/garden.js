'use strict';
// Build your own native garden. Start with a bare backyard, then paint soils and water and plant natives.
// What you build decides who moves in: bees, butterflies, dragonflies, frogs, lizards and birds.
// Your garden is saved, so it is still there next time.

const GARDEN = { cell: 40, cols: 24, rows: 15, left: 3 };   // columns left of `left` sit under the tool palette

// ------------------------------------------------------------------ Drawings (top-down)
Object.assign(Sprites, {
  gardenIcon(ctx, o, t) {
    ell(ctx, 0, 6, 18, 10, '#7a5a3a');
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.rotate(i * 1.25); ell(ctx, 9, 0, 8, 3, '#5f9a3a'); ctx.restore(); }
    for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * TAU / 8); ell(ctx, 6, -4, 4, 2, '#e85a8a'); ctx.restore(); }
    ell(ctx, 0, -4, 2.6, 2.6, '#f2d040');
  },
  gum(ctx, o, t) {   // eucalypt (marri / jarrah) seen from above: a big leafy crown
    const r = rng(o.seed || 5);
    softShadow(ctx, 12, 14, 70, 60, 0.3);
    for (let i = 0; i < 16; i++) {
      const a = r() * TAU, d = r() * 34;
      ell(ctx, Math.cos(a) * d, Math.sin(a) * d, 22 + r() * 10, 18 + r() * 8, ['#4a7a3a', '#5a8a44', '#6a9a50', '#3f6a32'][i % 4]);
    }
    for (let i = 0; i < 10; i++) { const a = r() * TAU, d = 20 + r() * 26; ell(ctx, Math.cos(a) * d, Math.sin(a) * d, 2.4, 2, '#8a6a3a'); }   // gumnuts
    for (let i = 0; i < 6; i++) { const a = r() * TAU, d = r() * 30; ell(ctx, Math.cos(a) * d, Math.sin(a) * d, 3, 3, '#f4f0d8'); }       // blossom
  },
  banksiaTree(ctx, o) { drawBanksia(ctx, 0, 0, 36, rng(o.seed || 3)); },
  grassTree(ctx) { drawGrassTree(ctx, 0, 0, 30); },
  saltbush(ctx, o) {
    const r = rng(o.seed || 9);
    for (let i = 0; i < 12; i++) { const a = r() * TAU, d = r() * 16; ell(ctx, Math.cos(a) * d, Math.sin(a) * d, 10, 8, i % 2 ? '#9ab0a8' : '#b4c4bc'); }
    for (let i = 0; i < 20; i++) { const a = r() * TAU, d = r() * 22; plainEll(ctx, Math.cos(a) * d, Math.sin(a) * d, 2.2, 1.4, 'rgba(230,240,235,.7)', a); }
  },
  nativeGrass(ctx, o, t) {
    const sway = Math.sin((t || 0) * 1.5 + (o.seed || 0)) * 0.06;
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * TAU + sway, l = 14 + (i % 4) * 4;
      line(ctx, [0, 0, Math.cos(a) * l, Math.sin(a) * l], i % 3 ? '#a8a060' : '#c8b878', 1.4);
    }
    ell(ctx, 0, 0, 4, 4, '#7a7040');
  },
  bottlebrush(ctx, o) {
    const r = rng(o.seed || 7);
    for (let i = 0; i < 10; i++) { const a = r() * TAU, d = r() * 14; ell(ctx, Math.cos(a) * d, Math.sin(a) * d, 12, 9, i % 2 ? '#4a7a3a' : '#5a8a44'); }
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU, d = 8 + r() * 14, x = Math.cos(a) * d, y = Math.sin(a) * d;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      for (let k = 0; k < 10; k++) plainLine(ctx, [-6 + k * 1.3, 0, -6 + k * 1.3 + 1, k % 2 ? -4 : 4], '#d8303a', 1.1);
      ctx.restore();
    }
  },
  rush(ctx, o, t) {
    const sway = Math.sin((t || 0) * 2 + (o.seed || 0)) * 1.5;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU, l = 10 + (i % 3) * 5;
      line(ctx, [0, 0, Math.cos(a) * l + sway, Math.sin(a) * l], '#3f6a2a', 1.6);
      if (i % 3 === 0) plainEll(ctx, Math.cos(a) * l + sway, Math.sin(a) * l, 1.6, 1.6, '#7a5a2a');
    }
  },
  rock(ctx, o) {
    const r = rng(o.seed || 2);
    softShadow(ctx, 5, 6, 26, 18, 0.35);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, d = 16 + r() * 6; i ? ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d * 0.8) : ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d * 0.8); }
    ctx.closePath();
    const g = ctx.createRadialGradient(-6, -6, 2, 0, 0, 22); g.addColorStop(0, '#e8e2d4'); g.addColorStop(1, '#9a9282');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(60,50,40,.4)'; ctx.lineWidth = 1; ctx.stroke();
    for (let i = 0; i < 6; i++) plainEll(ctx, (r() - 0.5) * 20, (r() - 0.5) * 14, 1.6, 1.2, 'rgba(90,80,60,.4)');
    plainEll(ctx, 6, -2, 5, 3, 'rgba(110,150,70,.5)');   // a little moss
  },
  litter(ctx, o) {
    const r = rng(o.seed || 4);
    for (let i = 0; i < 14; i++) { ctx.save(); ctx.rotate(r() * TAU); ell(ctx, (r() - 0.5) * 30, (r() - 0.5) * 20, 7, 2.6, ['#a07a40', '#8a6a3a', '#c09a5a', '#7a5a30'][i % 4]); ctx.restore(); }
  },
  nestBox(ctx) {
    softShadow(ctx, 4, 6, 20, 14, 0.35);
    line(ctx, [0, 0, 0, 14], '#6a4a2a', 5);
    ctx.fillStyle = '#9a7048'; ctx.fillRect(-12, -12, 24, 22);
    ctx.fillStyle = '#7a5032'; ctx.fillRect(-14, -15, 28, 6);
    plainEll(ctx, 0, -1, 4.5, 4.5, '#2a1a0a');
  },
  pondPlant(ctx) { for (let i = 0; i < 3; i++) ell(ctx, i * 7 - 7, (i % 2) * 5, 6, 6, '#5a9a4a'); },
  // Visitors
  worm(ctx, o, t) {
    for (let k = 0; k < 9; k++) ell(ctx, -k * 2.4, Math.sin(t * 4 + k * 0.8) * 1.5, 2, 1.8, k === 2 ? '#d88a8a' : '#c87a70');
  },
  resinBee(ctx, o, t) {
    const flap = Math.sin(t * 60) * 0.4;
    for (const s of [-1, 1]) veinWing(ctx, 0, s, 8, 2.6, s * (2.6 - flap), 'rgba(210,210,220,.55)', 2);
    ell(ctx, -4, 0, 5, 3.4, '#2a2a2a'); bands(ctx, -4, 0, 5, 3.4, 3, 'rgba(240,230,200,.7)', 0.6);
    ell(ctx, 1.5, 0, 3, 3, '#3a3a3a'); ell(ctx, 5, 0, 2.4, 2.6, '#222');
  },
  ladybird(ctx, o, t) {
    insectLegs(ctx, 0, 6, '#111', 0.7, t, o.moving);
    ell(ctx, -1, 0, 6, 5.4, '#d82a1e');
    plainLine(ctx, [-7, 0, 5, 0], '#111', 0.8);
    for (const [x, y] of [[-3, -2.5], [-3, 2.5], [1, -3], [1, 3], [-5, 0]]) plainEll(ctx, x, y, 1.2, 1.2, '#111');
    ell(ctx, 5, 0, 2.6, 3, '#111'); plainEll(ctx, 5.6, -1.4, 0.8, 0.8, '#fff'); plainEll(ctx, 5.6, 1.4, 0.8, 0.8, '#fff');
  },
  skink(ctx, o, t) {
    const w = o.moving ? Math.sin(t * 14) * 0.4 : 0;
    for (const [x, s, k] of [[6, -1, 1], [6, 1, -1], [-5, -1, -1], [-5, 1, 1]]) line(ctx, [x, 0, x + 2 + k * w * 3, s * 6], '#6a5a3a', 1.2);
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-18, w * 6, -26, w * 3); ctx.strokeStyle = '#7a6a4a'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.stroke();
    ell(ctx, 0, 0, 9, 3.4, '#8a7a5a'); plainLine(ctx, [-8, -1.6, 8, -1.6], 'rgba(40,30,20,.5)', 0.8); plainLine(ctx, [-8, 1.6, 8, 1.6], 'rgba(40,30,20,.5)', 0.8);
    ell(ctx, 10, 0, 3.6, 2.8, '#8a7a5a'); plainEll(ctx, 11, -1.6, 0.7, 0.7, '#111'); plainEll(ctx, 11, 1.6, 0.7, 0.7, '#111');
  },
  orbSpider(ctx, o, t) {   // Australian golden orb-weaver, female: long banded legs, silvery body
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const a = s * [0.45, 0.9, 1.9, 2.5][i], l = [16, 14, 9, 13][i];
      tleg(ctx, 2, s, a, l, l, s * (i < 2 ? -0.3 : 0.3), '#2a2018', 1.4);
      const kx = 2 + Math.cos(a) * l, ky = s + Math.sin(a) * l;
      plainEll(ctx, kx, ky, 1.4, 1.4, '#e8c040');
    }
    ell(ctx, -8, 0, 9, 4.6, '#c8c8b8'); bands(ctx, -8, 0, 9, 4.6, 3, 'rgba(200,160,40,.6)', 1);
    plainEll(ctx, -10, 0, 3, 1.2, 'rgba(255,255,255,.5)');
    ell(ctx, 4, 0, 4.6, 4, '#3a3028'); plainEll(ctx, 4, 0, 3, 2.4, 'rgba(230,230,220,.6)');
  },
  honeyeater(ctx, o, t) {   // New Holland honeyeater: black and white streaks, yellow wing panel
    const flap = o.flying ? Math.sin(t * 22) * 6 : 0;
    line(ctx, [-8, 0, -18, 0], '#1a1a1a', 4.5); plainLine(ctx, [-12, -1.5, -17, -1.5], '#f2c832', 1.2); plainLine(ctx, [-12, 1.5, -17, 1.5], '#f2c832', 1.2);
    for (const s of [-1, 1]) { ell(ctx, -2, s * (5 + flap * 0.3), 9, 3.6 + Math.abs(flap) * 0.2, '#1e1e1e', s * 0.15); plainLine(ctx, [-8, s * (5 + flap * 0.3), 3, s * (5 + flap * 0.3)], '#f2c832', 1.6); }
    ell(ctx, 0, 0, 8, 5.4, '#f0f0ec');
    for (let k = 0; k < 4; k++) plainLine(ctx, [-6 + k * 3, -3, -5 + k * 3, 3], '#222', 0.9);
    ell(ctx, 7, 0, 4, 3.6, '#1a1a1a'); plainEll(ctx, 8, -2, 1, 1, '#fff'); plainEll(ctx, 8, 2, 1, 1, '#fff');
    plainLine(ctx, [10.5, 0, 16, 0.6], '#111', 1.3);
  },
  wattlebird(ctx, o, t) {   // red wattlebird: big grey-brown honeyeater with red wattles and a yellow belly
    const flap = o.flying ? Math.sin(t * 18) * 6 : 0;
    line(ctx, [-10, 0, -24, 0], '#6a5a4a', 6);
    for (const s of [-1, 1]) ell(ctx, -3, s * (6 + flap * 0.3), 12, 4.4, '#5a4a3a', s * 0.15);
    ell(ctx, 0, 0, 10, 6.6, '#7a6a58');
    for (let k = 0; k < 5; k++) plainLine(ctx, [-7 + k * 3, -4, -6 + k * 3, 4], 'rgba(250,250,240,.5)', 0.8);
    ell(ctx, 9, 0, 4.6, 4.2, '#6a5a4a'); plainEll(ctx, 9, -4.6, 1.6, 1.2, '#c8302a'); plainEll(ctx, 9, 4.6, 1.6, 1.2, '#c8302a');
    plainLine(ctx, [13, 0, 19, 0.8], '#222', 1.4);
  },
  fairyWren(ctx, o, t) {   // splendid fairy-wren, male: brilliant blue, cocked tail
    const hop = o.moving ? Math.abs(Math.sin(t * 10)) * 2 : 0;
    line(ctx, [-6, 0, -18, -2], '#1a3a8a', 3);
    ell(ctx, 0, -hop, 7, 5, '#2a5ad8');
    for (const s of [-1, 1]) ell(ctx, -1, s * 3.6 - hop, 5, 2.2, '#1a2a6a', s * 0.2);
    ell(ctx, 6, -hop, 4.2, 4, '#3a8af0'); plainEll(ctx, 7, -2 - hop, 1.6, 1, '#111'); plainEll(ctx, 7, 2 - hop, 1.6, 1, '#111');
    plainLine(ctx, [9.5, -hop, 12, -hop], '#111', 1);
  },
  cockatoo(ctx, o, t) {   // Carnaby's black cockatoo: black, white cheek patch and white tail band
    const flap = o.flying ? Math.sin(t * 9) * 10 : 0;
    line(ctx, [-12, 0, -34, 0], '#1a1a1a', 10); plainLine(ctx, [-22, -3, -30, -3], '#f2f2ea', 2); plainLine(ctx, [-22, 3, -30, 3], '#f2f2ea', 2);
    for (const s of [-1, 1]) ell(ctx, -4, s * (10 + flap * 0.4), 18, 6 + Math.abs(flap) * 0.3, '#151515', s * 0.15);
    ell(ctx, 0, 0, 14, 9, '#1e1e1e');
    ell(ctx, 13, 0, 7, 6.4, '#1e1e1e'); plainEll(ctx, 13, -4, 3, 2, '#f2f2ea'); plainEll(ctx, 13, 4, 3, 2, '#f2f2ea');
    ell(ctx, 19, 0, 3.6, 3, '#8a8a8a');
  },
  quenda(ctx, o, t) {   // southern brown bandicoot: pointy snout, small rounded ears, grizzled brown
    const step = o.moving ? Math.sin(t * 12) * 2 : 0;
    for (const [x, s] of [[8, -1], [8, 1], [-8, -1], [-8, 1]]) ell(ctx, x + step * s, s * 8, 3.4, 2.4, '#4a3624');
    line(ctx, [-14, 0, -22, 1], '#6a5034', 2.4);
    ell(ctx, 0, 0, 15, 9, '#8a6a46');
    const r = rng(3); for (let k = 0; k < 14; k++) plainEll(ctx, (r() - 0.5) * 24, (r() - 0.5) * 12, 1, 0.8, 'rgba(40,25,10,.4)');
    ell(ctx, 14, 0, 7, 6, '#8a6a46'); ell(ctx, 21, 0, 5, 2.6, '#9a7a56'); plainEll(ctx, 25.5, 0, 1.4, 1.4, '#2a1a10');
    for (const s of [-1, 1]) { ell(ctx, 11, s * 5.4, 2.8, 2.4, '#7a5a3a'); plainEll(ctx, 16, s * 3.2, 1, 1, '#111'); }
  },
  banjoFrog(ctx, o) {   // western banjo frog (pobblebonk): brown and warty
    for (const s of [-1, 1]) { ell(ctx, -6, s * 7, 7, 3, '#6a5a3a', s * 0.5); ell(ctx, 6, s * 6, 4, 2, '#6a5a3a', -s * 0.5); }
    ell(ctx, 0, 0, 10, 8, '#8a7448');
    const r = rng(6); for (let k = 0; k < 10; k++) plainEll(ctx, (r() - 0.5) * 14, (r() - 0.5) * 10, 1.4, 1.2, 'rgba(60,45,20,.6)');
    plainLine(ctx, [-8, 0, 7, 0], 'rgba(230,200,120,.6)', 1.2);
    eye(ctx, 6, -3.5, 2, 2, '#c8a040'); eye(ctx, 6, 3.5, 2, 2, '#c8a040');
  },
  none() {},
});

// Soils and water, painted on the grid.
const SOILS = {
  dirt: { base: '#a88a64', speck: ['#9a7c58', '#b89a74'] },
  sand: { base: '#f0dca8', speck: ['#e2cc94', '#fff2cc', '#d8c088'] },
  loam: { base: '#5a4028', speck: ['#4a3420', '#6a4c30', '#3a2818'] },
  clay: { base: '#c06a3a', speck: ['#a85a30', '#d0784a'] },
  mulch: { base: '#7a5530', speck: ['#9a6a3a', '#5a3a20', '#b0804a'] },
  gravel: { base: '#b8b0a2', speck: ['#8a8478', '#d8d2c6', '#a09888'] },
  water: { base: '#4a9ac8' },
};

// Plants and things you can place. r: how close you can put two of them; tree: grows slower.
const GARDEN_THINGS = {
  paw: { label: 'Kangaroo paw', sprite: 'paw', scale: 1.3, flower: true, nectar: true },
  grevillea: { label: 'Grevillea', sprite: 'grevillea', scale: 1.8, flower: true, nectar: true, shrub: true },
  banksia: { label: 'Banksia', sprite: 'banksiaTree', scale: 1, flower: true, nectar: true, shrub: true, tree: true },
  gum: { label: 'Gum tree', sprite: 'gum', scale: 1, tree: true },
  grassTree: { label: 'Grass tree', sprite: 'grassTree', scale: 1, grass: true },
  everlasting: { label: 'Everlasting', sprite: 'everlasting', scale: 1.2, flower: true },
  saltbush: { label: 'Saltbush', sprite: 'saltbush', scale: 1, shrub: true },
  nativeGrass: { label: 'Native grass', sprite: 'nativeGrass', scale: 1.3, grass: true },
  dianella: { label: 'Dianella', sprite: 'dianella', scale: 1.4, flower: true, o: { pollen: 1 } },
  hibbertia: { label: 'Guinea flower', sprite: 'hibbertia', scale: 1.4, flower: true, o: { pollen: 1 } },
  bottlebrush: { label: 'Bottlebrush', sprite: 'bottlebrush', scale: 1.2, flower: true, nectar: true, shrub: true },
  rush: { label: 'Rushes', sprite: 'rush', scale: 1.4, grass: true, wet: true },
  rock: { label: 'Rock', sprite: 'rock', scale: 1.1, thing: true },
  log: { label: 'Log', sprite: 'log', scale: 0.55, thing: true },
  litter: { label: 'Leaf litter', sprite: 'litter', scale: 1.2, thing: true },
  birdbath: { label: 'Bird bath', sprite: 'birdbath', scale: 1.5, thing: true },
  beeHotel: { label: 'Bee hotel', sprite: 'beeHotel', scale: 1.3, thing: true },
  nestBox: { label: 'Nest box', sprite: 'nestBox', scale: 1.2, thing: true },
};

// Who might visit, and what they need. c = counts of what's in the garden (see gardenCounts).
const VISITORS = [
  { id: 'v_worm', name: 'Earthworms', sprite: 'worm', move: 'sit', scale: 1.4, at: 'loam',
    need: c => c.loam + c.mulch >= 6, hint: 'Earthworms like rich dark loam and mulch.',
    fact: 'Earthworms tunnel through soil and turn dead leaves into food for plants.' },
  { id: 'v_ant', name: 'Bull ants', sprite: 'ant', move: 'walk', scale: 0.9, at: 'sand',
    need: c => c.sand >= 6, hint: 'Bull ants dig their nests in sandy soil.',
    fact: 'Bull ants nest in sandy soil and hunt other insects to feed their larvae.' },
  { id: 'v_snail', name: 'Native snail', sprite: 'snail', move: 'walk', scale: 1, at: 'mulch', speed: 6,
    need: c => c.mulch >= 3 && c.plants >= 4, hint: 'Snails like damp mulch with plants around.',
    fact: 'Native snails hide under mulch and leaves during the day and come out when it’s damp.' },
  { id: 'v_bee', name: 'Blue-banded bee', sprite: 'bee', move: 'fly', scale: 1.4, at: ['dianella', 'hibbertia'],
    need: c => c.dianella + c.hibbertia >= 2 && c.clay >= 2, hint: 'Blue-banded bees buzz on dianella and guinea flowers, and dig nests in clay.',
    fact: 'Blue-banded bees nest in burrows in clay banks and buzz pollen out of flowers.' },
  { id: 'v_resin', name: 'Resin bee', sprite: 'resinBee', move: 'fly', scale: 1.6, at: ['beeHotel', 'flower'],
    need: c => c.beeHotel >= 1 && c.flowers >= 3, hint: 'Small native bees move into a bee hotel if there are flowers nearby.',
    fact: 'Resin bees lay eggs in hollow stems and holes, then seal them with plant resin. A bee hotel gives them a home.' },
  { id: 'v_butterfly', name: 'Painted lady', sprite: 'butterfly', move: 'fly', scale: 1.4, at: ['everlasting'],
    need: c => c.everlasting >= 2, hint: 'Painted lady butterflies lay their eggs on everlasting daisies.',
    fact: 'Painted ladies lay eggs on everlastings so their caterpillars have food when they hatch.' },
  { id: 'v_ladybird', name: 'Ladybirds', sprite: 'ladybird', move: 'walk', scale: 1.6, at: ['flower', 'shrub'], speed: 10,
    need: c => c.plants >= 6, hint: 'Ladybirds come when there are lots of plants with aphids to eat.',
    fact: 'Ladybirds eat aphids and other sap-suckers, so gardeners love them.' },
  { id: 'v_skimmer', name: 'Blue skimmer', sprite: 'dragonfly', move: 'fly', scale: 1.1, at: 'water',
    need: c => c.water >= 6, hint: 'Dragonflies need a pond to lay their eggs in.',
    fact: 'Blue skimmers patrol ponds catching mosquitoes and lay their eggs in the water.' },
  { id: 'v_damsel', name: 'Damselflies', sprite: 'damselfly', move: 'fly', scale: 1.6, at: ['rush'],
    need: c => c.water >= 6 && c.rush >= 2, hint: 'Damselflies like a pond with rushes to perch on.',
    fact: 'Damselflies rest with their wings folded along their body and lay eggs inside water plants.' },
  { id: 'v_frog', name: 'Motorbike frog', sprite: 'frog', move: 'sit', scale: 1.4, at: 'waterEdge',
    need: c => c.water >= 8 && c.rush >= 2 && c.rock + c.log >= 1, hint: 'Frogs need a big pond with rushes, and rocks or logs to hide under.',
    fact: 'Motorbike frogs live around ponds and wetlands. The male’s call sounds like a motorbike changing gears.' },
  { id: 'v_banjo', name: 'Western banjo frog', sprite: 'banjoFrog', move: 'sit', scale: 1.4, at: 'waterEdge',
    need: c => c.water >= 10 && c.loam >= 4, hint: 'Banjo frogs dig into soft loam near a large pond.',
    fact: 'The western banjo frog’s call goes “bonk!”, like plucking a banjo. It digs backwards into soil to hide.' },
  { id: 'v_bobtail', name: 'Bobtail', sprite: 'bobtail', move: 'walk', scale: 1.8, at: ['rock', 'log', 'litter'], speed: 12,
    need: c => c.rock + c.log >= 2 && c.plants >= 5, hint: 'Bobtails like rocks and logs to shelter under, with plants nearby.',
    fact: 'Bobtails eat snails, insects and flowers. They shelter under logs, rocks and thick plants.' },
  { id: 'v_skink', name: 'Dwarf skink', sprite: 'skink', move: 'walk', scale: 1.4, at: ['rock', 'litter'], speed: 30,
    need: c => c.rock >= 1 && c.mulch + c.litter >= 3, hint: 'Little skinks hunt in leaf litter and mulch and bask on rocks.',
    fact: 'Dwarf skinks are tiny lizards that hunt small insects in leaf litter.' },
  { id: 'v_orb', name: 'Golden orb-weaver', sprite: 'orbSpider', move: 'sit', scale: 1.4, at: ['shrub'],
    need: c => c.shrubs >= 3, hint: 'Orb-weaving spiders hang their webs between shrubs.',
    fact: 'Golden orb-weavers spin big webs of golden silk between shrubs and trees.' },
  { id: 'v_honeyeater', name: 'New Holland honeyeater', sprite: 'honeyeater', move: 'fly', scale: 1.5, at: ['nectar'],
    need: c => c.nectar >= 3, hint: 'Honeyeaters come for nectar flowers: grevillea, banksia, bottlebrush and kangaroo paw.',
    fact: 'New Holland honeyeaters drink nectar with brush-tipped tongues and pollinate the flowers as they go.' },
  { id: 'v_wattlebird', name: 'Red wattlebird', sprite: 'wattlebird', move: 'fly', scale: 1.5, at: ['banksia', 'gum'],
    need: c => c.banksia >= 1 && c.gum >= 1, hint: 'Wattlebirds feed on banksias and gum blossom.',
    fact: 'Red wattlebirds are big, noisy honeyeaters with red wattles hanging from their cheeks.' },
  { id: 'v_wren', name: 'Splendid fairy-wren', sprite: 'fairyWren', move: 'walk', scale: 1.5, at: ['shrub', 'grass'], speed: 30,
    need: c => c.shrubs + c.grasses >= 6, hint: 'Fairy-wrens need thick, low shrubs and grasses to hide in.',
    fact: 'Splendid fairy-wrens live in family groups and dart between dense shrubs, hunting insects.' },
  { id: 'v_wagtail', name: 'Willie wagtail', sprite: 'wagtail', move: 'walk', scale: 1.3, at: 'open', speed: 40,
    need: (c, g) => g.visitorCount.insects >= 3 && (c.birdbath >= 1 || c.water >= 4), hint: 'Wagtails come when there are plenty of insects to catch, and water to drink.',
    fact: 'Willie wagtails wag their tails side to side to flush insects out of the grass.' },
  { id: 'v_magpie', name: 'Magpie', sprite: 'magpie', move: 'walk', scale: 1.6, at: 'open', speed: 25,
    need: c => c.open >= 25 && c.gum >= 1, hint: 'Magpies walk across open ground looking for grubs, and roost in tall trees.',
    fact: 'Magpies listen for beetle grubs under the soil, then dig them out with their beaks.' },
  { id: 'v_cockatoo', name: 'Carnaby’s black cockatoo', sprite: 'cockatoo', move: 'sit', scale: 1.5, at: ['banksia', 'gum'],
    need: c => c.banksia >= 2 && c.gum >= 1, hint: 'Black cockatoos eat banksia seeds and need tall trees.',
    fact: 'Carnaby’s black cockatoos live only in the south-west of WA. They crack open banksia cones for the seeds. They are endangered.' },
  { id: 'v_quenda', name: 'Quenda', sprite: 'quenda', move: 'walk', scale: 1.4, at: ['shrub', 'mulch'], speed: 20,
    need: c => c.mulch >= 5 && c.shrubs >= 3 && (c.water >= 1 || c.birdbath >= 1), hint: 'Quendas dig in mulch for grubs and need thick shrubs to hide in, and water.',
    fact: 'Quendas are small native bandicoots that live in some Perth gardens. They dig little cone-shaped holes looking for grubs.' },
  { id: 'v_termite', name: 'Termites', sprite: 'termiteWorker', move: 'walk', scale: 1.6, at: ['log'], speed: 8,
    need: c => c.log >= 1, hint: 'Termites move into old logs and eat the wood.',
    fact: 'Termites recycle dead wood back into soil. Native termites are an important part of the bush.' },
  { id: 'v_beeEater', name: 'Rainbow bee-eater', sprite: 'beeEater', move: 'fly', scale: 1.1, at: 'sand',
    need: (c, g) => c.sand >= 10 && g.visitorCount.insects >= 2, hint: 'Rainbow bee-eaters dig nesting tunnels in sand and catch flying insects.',
    fact: 'Rainbow bee-eaters dig nest tunnels in sandy ground and catch bees in the air.' },
];
const INSECTS = ['v_ant', 'v_bee', 'v_resin', 'v_butterfly', 'v_ladybird', 'v_skimmer', 'v_damsel', 'v_termite'];

function gardenCounts(g) {
  const c = { plants: 0, flowers: 0, nectar: 0, shrubs: 0, grasses: 0, open: 0 };
  for (const k of Object.keys(SOILS)) c[k] = 0;
  for (const k of Object.keys(GARDEN_THINGS)) c[k] = 0;
  for (const row of g.cells) for (const s of row) c[s]++;
  c.open = c.dirt + c.sand + c.loam + c.gravel;
  for (const it of g.items) {
    const d = GARDEN_THINGS[it.kind];
    if (!d) continue;
    c[it.kind]++;
    if (!d.thing) c.plants++;
    if (d.flower) c.flowers++;
    if (d.nectar) c.nectar++;
    if (d.shrub) c.shrubs++;
    if (d.grass) c.grasses++;
  }
  return c;
}

const GardenStore = {
  load() { try { return JSON.parse(localStorage.getItem('bugame.garden')); } catch (e) { return null; } },
  save(g) {
    try {
      localStorage.setItem('bugame.garden', JSON.stringify({ cells: g.cells, items: g.items.map(i => ({ k: i.kind, x: Math.round(i.x), y: Math.round(i.y), s: i.seed })) }));
    } catch (e) { /* storage off */ }
  },
};

Bugs.push({ id: 'garden', name: 'Native Garden', sci: 'Build your own', place: 'Your backyard', sprite: 'gardenIcon',
  pin: { x: 845, y: 545 }, stages: ['garden'], kind: 'sandbox' });

Missions.garden = {
  id: 'garden', bug: 'garden', stage: 'Gardener', place: 'Your own backyard', view: 'build',
  sprite: 'none', bg: 'gardenYard', pointerOnly: true,
  action: '', radius: 1, speed: 0, scale: 1, goal: 8,
  home: { x: -400, y: -400, r: 1, label: '' },
  facts: [
    'Native plants feed native animals: nectar for birds and bees, seeds, leaves and shelter.',
    'Ponds, rocks, logs and leaf litter give animals water and places to hide.',
    'Start with bare dirt and build any garden you like.',
  ],
  how: [
    'Pick a tool on the left, then tap or drag on the yard.',
    'Paint soils and water. Plant natives. Add rocks, logs and a bird bath.',
    'Animals move in when your garden has what they need. Tap a visitor to learn about it.',
    'Get 8 kinds of visitors for a star, 12 for two and 16 for three. Your garden is saved for next time.',
  ],
  discoveries: [],
  tools: [
    { name: 'Ground', items: [
      { id: 'sand', label: 'Sand', color: SOILS.sand.base, speck: '#d8c088' },
      { id: 'loam', label: 'Loam', color: SOILS.loam.base, speck: '#6a4c30' },
      { id: 'clay', label: 'Clay', color: SOILS.clay.base, speck: '#a85a30' },
      { id: 'mulch', label: 'Mulch', color: SOILS.mulch.base, speck: '#b0804a' },
      { id: 'gravel', label: 'Path', color: SOILS.gravel.base, speck: '#8a8478' },
      { id: 'water', label: 'Pond', color: SOILS.water.base, speck: 'rgba(255,255,255,.6)' },
    ] },
    { name: 'Plants', items: Object.entries(GARDEN_THINGS).filter(([, d]) => !d.thing).map(([id, d]) =>
      ({ id, label: d.label, sprite: d.sprite, iconScale: d.tree ? 0.38 : d.sprite === 'grassTree' ? 0.5 : 0.7, o: Object.assign({ seed: 3 }, d.o) })) },
    { name: 'Things', items: Object.entries(GARDEN_THINGS).filter(([, d]) => d.thing).map(([id, d]) =>
      ({ id, label: d.label, sprite: d.sprite, iconScale: id === 'log' ? 0.24 : 0.7, o: { seed: 3 } })) },
    { name: 'Tools', items: [
      { id: 'erase', label: 'Dig up', color: '#f4ead2', speck: '#a88a64' },
      { id: 'clear', label: 'New garden', now: true },
    ] },
  ],
  factText: Object.assign({
    start: 'Lots of Perth gardeners plant natives to bring wildlife back to the suburbs.',
    win: 'Your garden is full of life! Every native plant helps local animals.',
    tank: '',
  }, Object.fromEntries(VISITORS.map(v => [v.id, v.name + ': ' + v.fact]))),

  setup(g) {
    g.netDone = true;
    const p = g.player; p.x = -400; p.y = -400; p.flat = true;
    const saved = GardenStore.load();
    g.cells = saved && saved.cells && saved.cells.length === GARDEN.rows ? saved.cells
      : Array.from({ length: GARDEN.rows }, () => Array(GARDEN.cols).fill('dirt'));
    if (saved && saved.items) for (const s of saved.items) if (GARDEN_THINGS[s.k]) this.addThing(g, s.k, s.x, s.y, 1, s.s);
    g.groundDirty = true;
    g.visitors = []; g.visitorCount = { insects: 0 }; g.checkT = 1; g.hintT2 = 20; g.kinds = new Set();
    if (!saved || !saved.items || !saved.items.length) Game.later(1.5, () => Game.hint('Pick a tool on the left, then tap or drag on the yard to build your garden.'));
  },
  addThing(g, kind, x, y, grow, seed) {
    const d = GARDEN_THINGS[kind];
    g.items.push({ kind, sprite: d.sprite, x, y, r: 16, scale: d.scale, grow: grow === undefined ? 0.3 : grow, tree: d.tree,
      seed: seed || ((Math.random() * 1000) | 0), angle: kind === 'log' ? -0.3 : 0, flat: true, pollen: 1, leaf: 1 });
  },
  cellAt(x, y) {
    const c = Math.floor(x / GARDEN.cell), r = Math.floor(y / GARDEN.cell);
    return c >= GARDEN.left && c < GARDEN.cols && r >= 0 && r < GARDEN.rows ? { c, r } : null;
  },
  onTool(g, id, btn) {
    if (id !== 'clear') return;
    if (!g.clearArmed) { g.clearArmed = true; btn.querySelector('span').textContent = 'Tap again'; setTimeout(() => { g.clearArmed = false; btn.querySelector('span').textContent = 'New garden'; }, 2500); return; }
    g.cells = Array.from({ length: GARDEN.rows }, () => Array(GARDEN.cols).fill('dirt'));
    g.items = []; g.visitors = []; g.groundDirty = true; g.clearArmed = false;
    btn.querySelector('span').textContent = 'New garden';
    GardenStore.save(g);
    Game.hint('A fresh, empty yard. What will you build?');
  },
  onPointer(g, type, x, y) {
    if (type === 'up') { if (g.changed) { GardenStore.save(g); g.changed = false; } g.lastPlace = null; return; }
    // Tapping a visitor tells you about it
    if (type === 'down') {
      const v = nearest(g.visitors, { x, y }, 26);
      if (v) { g.toasts.unshift({ text: v.def.name + ': ' + v.def.fact, kind: 'fact' }); g.toastT = 0; Speech.say(v.def.name + '. ' + v.def.fact); Sound.play('tap'); return; }
    }
    this.use(g, g.tool, x, y, type);
  },
  // Do what the chosen tool does at (x, y). Also used by the test bot.
  use(g, tool, x, y, type) {
    const cell = this.cellAt(x, y);
    if (!cell) return;
    if (SOILS[tool]) {
      if (g.cells[cell.r][cell.c] !== tool) {
        g.cells[cell.r][cell.c] = tool; g.groundDirty = true; g.changed = true;
        if (type !== 'move') Sound.play('tap');
        // Plants can't stand in a pond (except rushes)
        if (tool === 'water') g.items = g.items.filter(i => i.kind === 'rush' || i.kind === 'birdbath' || dist(i, { x: cell.c * 40 + 20, y: cell.r * 40 + 20 }) > 24);
      }
      return;
    }
    if (tool === 'erase') {
      const it = nearest(g.items, { x, y }, 30);
      if (it) { g.items.splice(g.items.indexOf(it), 1); Game.burst(it.x, it.y, '#a88a64', 10); Sound.play('tap'); }
      else if (g.cells[cell.r][cell.c] !== 'dirt') { g.cells[cell.r][cell.c] = 'dirt'; g.groundDirty = true; }
      g.changed = true;
      return;
    }
    const d = GARDEN_THINGS[tool];
    if (!d) return;
    // Dragging plants spreads them out; tapping drops one
    const gap = d.tree ? 70 : d.thing ? 40 : 30;
    if (type === 'move' && g.lastPlace && dist(g.lastPlace, { x, y }) < gap) return;
    if (g.items.some(i => dist(i, { x, y }) < (d.tree || GARDEN_THINGS[i.kind].tree ? 30 : 16))) return;
    const onWater = g.cells[cell.r][cell.c] === 'water';
    if (onWater && !d.wet && tool !== 'birdbath') { if (type === 'down') Game.hint('That plant can’t grow in the pond. Rushes can!'); return; }
    this.addThing(g, tool, x, y);
    g.lastPlace = { x, y }; g.changed = true;
    Sound.play('pick');
    Game.burst(x, y, '#7fc24a', 6);
  },
  locked() { return true; },
  move() {},
  update(g, dt) {
    for (const it of g.items) if (it.grow < 1) it.grow = Math.min(1, it.grow + dt / (it.tree ? 25 : 10));
    // Every couple of seconds, see who wants to visit
    g.checkT -= dt;
    if (g.checkT <= 0) {
      g.checkT = 2;
      const c = gardenCounts(g);
      g.counts = c;
      for (const v of VISITORS) {
        const here = g.visitors.filter(x => x.def === v);
        const ok = v.need(c, g);
        if (ok && here.length < (v.move === 'fly' || v.id === 'v_ant' || v.id === 'v_worm' ? 2 : 1) && Math.random() < 0.3) this.arrive(g, v);
        if (!ok) for (const x of here) x.leaving = true;
      }
      g.visitorCount.insects = new Set(g.visitors.filter(x => INSECTS.includes(x.def.id) && !x.leaving).map(x => x.def.id)).size;
      const kinds = new Set(g.visitors.filter(x => !x.leaving).map(x => x.def.id));
      g.score = kinds.size;
      // Stars as the garden fills up, without stopping play: it's your garden, keep building
      const stars = g.score >= 16 ? 3 : g.score >= 12 ? 2 : g.score >= this.goal ? 1 : 0;
      if (stars > (g.stars || 0)) {
        g.stars = stars;
        Progress.setStars('garden', stars);
        Sound.play('win'); Game.fact('win');
        g.toasts.unshift({ text: '★'.repeat(stars) + ' ' + g.score + ' kinds of visitors! ' + (stars < 3 ? 'Keep going for more stars.' : 'A real wildlife garden!'), kind: 'secret' }); g.toastT = 0;
        for (let i = 0; i < 4; i++) Game.burst(200 + Math.random() * 700, 100 + Math.random() * 400, ['#ffd23f', '#e85a8a', '#4fc3f7', '#7fc24a'][i], 24);
      }
      // A gentle hint about who could come next, now and then
      g.hintT2 -= 2;
      if (g.hintT2 <= 0) {
        g.hintT2 = 24;
        const want = VISITORS.filter(v => !kinds.has(v.id) && !v.need(c, g));
        if (want.length) Game.hint('Idea: ' + want[Math.floor(Math.random() * want.length)].hint);
      }
    }
    for (const v of g.visitors) this.moveVisitor(g, v, dt);
    g.visitors = g.visitors.filter(v => !v.gone);
  },
  // A place in the garden this visitor likes
  spot(g, def) {
    const at = Array.isArray(def.at) ? def.at : [def.at];
    const pts = [];
    for (const a of at) {
      if (SOILS[a] || a === 'open' || a === 'waterEdge') {
        for (let r = 0; r < GARDEN.rows; r++) for (let c = GARDEN.left; c < GARDEN.cols; c++) {
          const s = g.cells[r][c];
          const want = a === 'open' ? ['dirt', 'sand', 'loam', 'gravel'].includes(s)
            : a === 'waterEdge' ? s !== 'water' && [[0, 1], [1, 0], [0, -1], [-1, 0]].some(([dr, dc]) => (g.cells[r + dr] || [])[c + dc] === 'water')
              : s === a;
          if (want) pts.push({ x: c * 40 + 8 + Math.random() * 24, y: r * 40 + 8 + Math.random() * 24 });
        }
      } else {
        for (const it of g.items) {
          const d = GARDEN_THINGS[it.kind];
          if (it.kind === a || (a === 'flower' && d.flower) || (a === 'nectar' && d.nectar) || (a === 'shrub' && d.shrub) || (a === 'grass' && d.grass)) pts.push({ x: it.x + (Math.random() - 0.5) * 16, y: it.y + (Math.random() - 0.5) * 16 });
        }
      }
    }
    return pts.length ? pts[Math.floor(Math.random() * pts.length)] : null;
  },
  arrive(g, def) {
    const to = this.spot(g, def);
    if (!to) return;
    const fromLeft = Math.random() < 0.5;
    const v = { def, sprite: def.sprite, x: fromLeft ? 100 : World.w + 30, y: def.move === 'fly' ? -20 : to.y, r: 0, scale: def.scale, angle: 0, flat: true,
      tx: to.x, ty: to.y, rest: 0, moving: true, flying: true };
    if (def.move !== 'fly') v.x = fromLeft ? 110 : World.w + 20;
    g.visitors.push(v);
    if (!g.kinds.has(def.id)) {
      g.kinds.add(def.id);
      Sound.play('score');
      g.toasts.unshift({ text: 'New visitor: ' + def.name + '!', kind: 'hint' }); g.toastT = 0;
      Game.fact(def.id);
      Game.later(1.2, () => Game.pop(v.x, v.y - 24, def.name + '!', '#ffd23f'));
    }
  },
  moveVisitor(g, v, dt) {
    const d = v.def;
    if (v.leaving) { v.tx = v.x < World.w / 2 ? -60 : World.w + 60; v.ty = v.y - (d.move === 'fly' ? 200 : 0); v.rest = 0; }
    const dx = v.tx - v.x, dy = v.ty - v.y, dd = Math.hypot(dx, dy);
    const sp = d.speed || (d.move === 'fly' ? (d.sprite === 'cockatoo' || d.sprite === 'wattlebird' || d.sprite === 'honeyeater' || d.sprite === 'magpie' ? 160 : 90) : 50);
    if (v.rest > 0) {
      v.rest -= dt; v.moving = false; v.flying = false;
      if (d.move === 'sit' && Math.random() < dt * 0.1) v.angle += (Math.random() - 0.5);
      return;
    }
    if (dd < 4) {
      if (v.leaving) { v.gone = true; return; }
      v.rest = d.move === 'sit' ? 8 + Math.random() * 10 : 1.5 + Math.random() * 3;
      const nx = this.spot(g, d);
      if (nx) { v.tx = nx.x; v.ty = nx.y; }
      return;
    }
    const step = Math.min(dd, sp * dt);
    v.x += dx / dd * step; v.y += dy / dd * step;
    if (d.move === 'fly') v.y += Math.sin(g.t * 6 + v.tx) * 0.6;
    v.angle = Math.atan2(dy, dx); v.moving = true; v.flying = true;
  },
  drawBuild(ctx, g) {
    if (g.groundDirty || !g.ground) { this.paintGround(g); g.groundDirty = false; }
    ctx.drawImage(g.ground, 0, 0, World.w, World.h);
    // Water shimmer
    for (let r = 0; r < GARDEN.rows; r++) for (let c = 0; c < GARDEN.cols; c++) if (g.cells[r][c] === 'water') {
      const k = Math.sin(g.t * 2 + r + c * 1.7);
      plainLine(ctx, [c * 40 + 8, r * 40 + 18 + k * 3, c * 40 + 26, r * 40 + 18 + k * 3], 'rgba(255,255,255,.35)', 1.5);
    }
    // Plants and things, back to front, growing from seedlings
    g.items.sort((a, b) => a.y - b.y);
  },
  paintGround(g) {
    const k = Math.min(2, window.devicePixelRatio || 1);
    if (!g.ground) { g.ground = document.createElement('canvas'); g.ground.width = World.w * k; g.ground.height = World.h * k; }
    const ctx = g.ground.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, World.w, World.h);
    const C = GARDEN.cell;
    for (let r = 0; r < GARDEN.rows; r++) for (let c = GARDEN.left; c < GARDEN.cols; c++) {
      const s = g.cells[r][c];
      if (s === 'dirt' || s === 'water') continue;
      const sd = SOILS[s], rr = rng(r * 31 + c * 7 + 1);
      ctx.fillStyle = sd.base;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(c * C - 2, r * C - 2, C + 4, C + 4, 8) : ctx.rect(c * C, r * C, C, C); ctx.fill();
      for (let i = 0; i < 14; i++) plainEll(ctx, c * C + rr() * C, r * C + rr() * C, s === 'gravel' ? 3 : s === 'mulch' ? 3.4 : 1.6, s === 'mulch' ? 1.2 : 1.4, sd.speck[i % sd.speck.length], rr() * 3);
      if (s === 'clay') for (let i = 0; i < 2; i++) plainLine(ctx, [c * C + rr() * C, r * C + rr() * C, c * C + rr() * C, r * C + rr() * C], 'rgba(90,40,20,.35)', 0.8);
    }
    // Ponds: overlapping circles make soft, natural edges
    const water = [];
    for (let r = 0; r < GARDEN.rows; r++) for (let c = GARDEN.left; c < GARDEN.cols; c++) if (g.cells[r][c] === 'water') water.push([c * C + C / 2, r * C + C / 2]);
    for (const [x, y] of water) { ctx.beginPath(); ctx.arc(x, y, 33, 0, TAU); ctx.fillStyle = '#7a6a48'; ctx.fill(); }
    for (const [x, y] of water) { ctx.beginPath(); ctx.arc(x, y, 29, 0, TAU); ctx.fillStyle = '#3a82b0'; ctx.fill(); }
    // Deeper, darker water away from the edges
    const isW = (r, c) => (g.cells[r] || [])[c] === 'water';
    for (let r = 0; r < GARDEN.rows; r++) for (let c = GARDEN.left; c < GARDEN.cols; c++) {
      if (isW(r, c) && isW(r - 1, c) && isW(r + 1, c) && isW(r, c - 1) && isW(r, c + 1)) { ctx.beginPath(); ctx.arc(c * C + C / 2, r * C + C / 2, 30, 0, TAU); ctx.fillStyle = 'rgba(20,60,110,.25)'; ctx.fill(); }
    }
    for (const [x, y] of water) if ((x + y) % 80 === 0) plainEll(ctx, x - 6, y - 8, 10, 2.4, 'rgba(255,255,255,.22)');
  },
  drawExtra(ctx, g) {
    for (const it of g.items) if (it.grow < 1) { ctx.globalAlpha = 1; }
    for (const v of g.visitors) {
      if (v.def.move === 'fly' && v.flying) softShadow(ctx, v.x + 8, v.y + 16, 8 * v.scale, 4 * v.scale, 0.25);
      Game.drawSprite(v.sprite, v, v.scale);
    }
  },
  playerSprite() { return 'none'; },
  goalPoint() { return null; },
  hud(g) {
    const next = g.score < this.goal ? this.goal : g.score < 12 ? 12 : g.score < 16 ? 16 : 0;
    setHud('Visitors: ' + g.score + ' kind' + (g.score === 1 ? '' : 's'), (g.stars ? '★'.repeat(g.stars) + ' ' : '') + (next ? 'Next star: ' + next : 'All stars!'));
  },
  won() { return false; },   // a sandbox: never ends, stars are given as you go
};

// Plants grow from seedlings: draw them smaller until grown.
{
  const draw = Game.drawSprite.bind(Game);
  Game.drawSprite = function (name, e, scale) { draw(name, e, e && e.grow !== undefined ? (scale || 1) * (0.35 + 0.65 * e.grow) : scale); };
}

// Bare backyard: dirt, a timber fence and the back step.
Backgrounds.gardenYard = function (ctx, W, H) {
  const r = rng(12);
  ctx.fillStyle = SOILS.dirt.base; ctx.fillRect(0, 0, W, H);
  speckle(ctx, W, H, 1800, SOILS.dirt.speck.concat(['#c0a27a', '#8a6c48']), r, 2.4);
  // Fence along the top and sides
  for (let x = 0; x < W; x += 22) { ctx.fillStyle = (x / 22) % 2 ? '#9a7a52' : '#a8885e'; ctx.fillRect(x, 0, 21, 26); }
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, 26, W, 6);
  for (let y = 26; y < H; y += 22) { ctx.fillStyle = (y / 22) % 2 ? '#9a7a52' : '#a8885e'; ctx.fillRect(W - 18, y, 18, 21); }
  // Back step and a tap
  ctx.fillStyle = '#c8c0b0'; ctx.fillRect(W / 2 - 80, H - 26, 160, 26);
  ctx.fillStyle = '#b0a898'; ctx.fillRect(W / 2 - 80, H - 26, 160, 5);
  plainEll(ctx, W - 40, 60, 6, 6, '#8a8a8a'); plainLine(ctx, [W - 40, 60, W - 30, 60], '#6a6a6a', 3);
  storybookFinish(ctx, W, H, 21);
};

finishMissions();
Missions.garden.factText.tank = '';
