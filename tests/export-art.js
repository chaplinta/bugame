'use strict';
// Every sprite as a PNG: the 3D model render with its shadow (3d/), the flat drawing (drawings/), and the
// textures the art is made of (textures/: the seamless material tiles, the bump maps built from them and the
// painted maps the models wear). 8 px per game unit, facing right, lit from the top-left, each file named for
// what it is. Needs software WebGL (?3d=force), so a full run takes some minutes.
// Usage: node tests/export-art.js [--only ant,table] [--px 8] [--max 4096] [--no-zip]
//   -> tests/output/art/ (with index.csv and README.txt) and tests/output/bugame-art.zip
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { launch, openGame, FILE_URL } = require('./helpers');

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = opt('--only') ? opt('--only').split(',') : null;
const PX = +(opt('--px') || 8);
const MAX = +(opt('--max') || 4096);
const OUTPUT = path.join(__dirname, 'output'), OUT = path.join(OUTPUT, 'art'), ZIP = path.join(OUTPUT, 'bugame-art.zip');

// ------------------------------------------------------------------ what each code name is
const WHAT = {
  ant: 'Bull ant worker (Myrmecia)', queenAnt: 'Bull ant queen (Myrmecia)', bee: 'Blue-banded bee (Amegilla)', bushFly: 'Bush fly (Musca vetustissima)',
  plCaterpillar: 'Australian painted lady caterpillar (Vanessa kershawi)', chrysalis: 'Australian painted lady chrysalis', silkShelter: 'Painted lady caterpillar\'s silk shelter',
  butterfly: 'Australian painted lady (Vanessa kershawi)', egg: 'Painted lady egg', termiteWorker: 'Termite worker (Coptotermes)', snail: 'Native land snail (Bothriembryon)',
  spiderling: 'Coastal peacock spider, spiderling (Maratus speciosus)', spider: 'Coastal peacock spider, male (Maratus speciosus)', femaleSpider: 'Coastal peacock spider, female (Maratus speciosus)',
  nymph: 'Blue skimmer nymph (Orthetrum caledonicum)', emerge: 'Blue skimmer emerging from the nymph skin', dragonfly: 'Blue skimmer, adult (Orthetrum caledonicum)',
  mosquito: 'Southern house mosquito, female (Culex quinquefasciatus)', sandhopper: 'Coastal sandhopper, female (Talitridae)', babyHopper: 'Coastal sandhopper, baby',
  sugarAnt: 'Banded sugar ant worker (Camponotus consobrinus)', queenSugar: 'Banded sugar ant queen', antEgg: 'Sugar ant egg', orbSpider: 'Golden orb-weaver, female (Trichonephila edulis)',
  termite: 'Termite (prey)', caterpillar: 'Green looper caterpillar', deadBeetle: 'Dead beetle', deadMoth: 'Dead moth', fly: 'Small fly', springtail: 'Springtail', smallAnt: 'Small black ant',
  wriggler: 'Mosquito larva (wriggler)', tadpole: 'Tadpole', woodChip: 'Wood chip', mud: 'Mud ball', log: 'Fallen log', fungus: 'Fungus', lichen: 'Lichen', deadLeaf: 'Dead gum leaf',
  cow: 'Friesian cow', pat: 'Cow pat', dungBeetle: 'Dung beetle (Onthophagus type)', wrack: 'Seaweed wrack', eggRaft: 'Mosquito egg raft', eggSac: 'Spider egg sac', honeydew: 'Honeydew drop',
  lerpBug: 'Lerp psyllid', moth: 'Brown noctuid moth', beetle: 'Christmas beetle (Anoplognathus)', wrapped: 'Silk-wrapped prey',
  echidna: 'Short-beaked echidna', beeEater: 'Rainbow bee-eater', hobby: 'Australian hobby', wagtail: 'Willie wagtail', magpie: 'Western magpie', turtle: 'Oblong turtle',
  wasp: 'Spider wasp (Pompilidae)', paperWasp: 'Paper wasp (Polistes)', bobtail: 'Bobtail lizard (Tiliqua rugosa)', gull: 'Silver gull', plover: 'Red-capped plover',
  cone: 'Banksia cone', feather: 'Feather', dig: 'Dug hole', shell: 'Snail shell', seashell: 'Cockle shell', beeHotel: 'Bee hotel', birdbath: 'Bird bath (from above)',
  frog: 'Motorbike frog (Litoria moorei)', damselfly: 'Damselfly', gilgie: 'Gilgie (Cherax quinquecarinatus)', divingBeetle: 'Diving beetle', kangaroo: 'Western grey kangaroo',
  rooPoo: 'Kangaroo droppings', gecko: 'Marbled gecko', sausage: 'Snag', dianella: 'Dianella (flax lily)', hibbertia: 'Hibbertia (guinea flower)', paw: 'Kangaroo paw (Anigozanthos manglesii)',
  everlasting: 'Pink everlasting', capeweed: 'Capeweed', grevillea: 'Grevillea', gum: 'Gum tree crown', banksiaTree: 'Banksia', grassTree: 'Grass tree (Xanthorrhoea)',
  saltbush: 'Saltbush', nativeGrass: 'Native grass', bottlebrush: 'Bottlebrush', rush: 'Rushes', rock: 'Garden rock', litter: 'Leaf litter', nestBox: 'Nest box', pondPlant: 'Pond plant',
  worm: 'Earthworm', resinBee: 'Resin bee (Megachile)', ladybird: 'Transverse ladybird', skink: 'Dwarf skink', honeyeater: 'New Holland honeyeater', wattlebird: 'Red wattlebird',
  fairyWren: 'Splendid fairy-wren, male', cockatoo: 'Carnaby\'s black cockatoo', quenda: 'Quenda (southern brown bandicoot)', banjoFrog: 'Western banjo frog',
  person: 'Barbecue guest', bbq: 'Barbecue', table: 'Table with umbrella', pot: 'Pot plant', isoBirdbath: 'Bird bath', bucket: 'Bucket',
  cricketBall: 'Cricket ball', gnome: 'Garden gnome', thong: 'Thong', paperPlane: 'Paper plane', billyCan: 'Billy can', marble: 'Marble', sandcastle: 'Sandcastle', toyBoat: 'Toy boat',
  rubberDuck: 'Rubber duck', quokka: 'Quokka',
  bgShrub: 'Heath shrub (scenery)', bgBanksia: 'Banksia (scenery)', bgGrassTree: 'Grass tree (scenery)', bgGum: 'Gum crown (scenery)', bgTuft: 'Grass tuft (scenery)',
  bgRock: 'Rock (scenery)', bgLog: 'Fallen log (scenery)', bgLily: 'Lily pad (scenery)', bgWeed: 'Pond weed (scenery)',
};

// ------------------------------------------------------------------ every look to export
// { code, file, o, t, state, only ('2d' | '3d'), painter (2D source for things that are not a Sprite), scenery }
const LOOKS = [];
function L(code, file, o, x) { LOOKS.push(Object.assign({ code, file, o: Object.assign({ moving: false }, o || {}), t: 0.3, state: '' }, x || {})); }

// the bugs you play
L('ant', 'bull-ant-worker');
L('ant', 'bull-ant-worker-carrying-termite', { carry: 'termite' }, { state: 'carrying a termite' });
L('ant', 'bull-ant-worker-stinging', { stingT: 0.3 }, { state: 'stinging, jaws open' });
L('queenAnt', 'bull-ant-queen', { wings: true }, { state: 'winged' });
L('queenAnt', 'bull-ant-queen-wings-shed', {}, { state: 'wings shed' });
L('bee', 'blue-banded-bee', { load: 0 });
L('bee', 'blue-banded-bee-carrying-pollen', { load: 1 }, { state: 'pollen baskets full' });
L('bushFly', 'bush-fly');
L('bushFly', 'bush-fly-landed', { landed: true }, { state: 'landed, wings folded' });
L('plCaterpillar', 'painted-lady-caterpillar', { size: 1, fat: 1 });
L('chrysalis', 'painted-lady-chrysalis');
L('silkShelter', 'painted-lady-silk-shelter');
L('butterfly', 'painted-lady-butterfly', {}, { t: Math.PI / 36, state: 'wings open' });
L('butterfly', 'painted-lady-butterfly-landed', { landed: true }, { state: 'landed, wings folded' });
L('termiteWorker', 'termite-worker');
L('termiteWorker', 'termite-worker-carrying-mud', { carry: 'mud' }, { state: 'carrying mud' });
L('termiteWorker', 'termite-worker-carrying-wood', { carry: 'wood' }, { state: 'carrying wood' });
L('snail', 'native-land-snail', { size: 1 });
L('snail', 'native-land-snail-sealed', { size: 1, sealed: true }, { state: 'sealed in its shell' });
L('spiderling', 'peacock-spider-spiderling');
L('spiderling', 'peacock-spider-spiderling-moulting', { moult: 1 }, { state: 'moulting' });
L('spider', 'peacock-spider-male');
L('spider', 'peacock-spider-male-displaying', { dance: 1 }, { state: 'displaying, fan raised' });
L('spider', 'peacock-spider-male-legs-waving', { wave: 1 }, { state: 'third legs raised and waving' });
L('spider', 'peacock-spider-male-drumming', { bob: 1 }, { state: 'abdomen shaking, drumming' });
L('spider', 'peacock-spider-male-fan-bluer', { dance: 1, col: 1 }, { state: 'a suitor with a bluer fan' });
L('spider', 'peacock-spider-male-fan-greener', { dance: 1, col: 2 }, { state: 'a suitor with a greener fan' });
L('femaleSpider', 'peacock-spider-female');
L('nymph', 'blue-skimmer-nymph');
L('emerge', 'blue-skimmer-emerging', { k: 0.5 }, { state: 'halfway out of the nymph skin' });
L('dragonfly', 'blue-skimmer-male', { dart: 0 });
L('dragonfly', 'blue-skimmer-female', { female: true, dart: 0 }, { state: 'female' });
L('mosquito', 'southern-house-mosquito', { blood: 0 });
L('mosquito', 'southern-house-mosquito-fed', { blood: 1 }, { state: 'fed, abdomen full of blood' });
L('sandhopper', 'coastal-sandhopper', { face: 1, angle: 0 }, { state: 'with brood pouch' });
L('sandhopper', 'coastal-sandhopper-no-eggs', { face: 1, angle: 0, eggs: false }, { state: 'without eggs' });
L('babyHopper', 'coastal-sandhopper-baby', { face: 1, angle: 0 });
L('sugarAnt', 'banded-sugar-ant-worker');
L('sugarAnt', 'banded-sugar-ant-worker-carrying-honeydew', { honey: true }, { state: 'full of honeydew' });
L('sugarAnt', 'banded-sugar-ant-worker-carrying-crumbs', { crumbs: 2 }, { state: 'carrying crumbs' });
L('queenSugar', 'banded-sugar-ant-queen');
L('orbSpider', 'golden-orb-weaver');
// prey and things
L('termite', 'termite');
L('caterpillar', 'green-looper-caterpillar');
L('caterpillar', 'green-looper-caterpillar-stunned', { stunned: true }, { state: 'stunned' });
L('deadBeetle', 'dead-beetle'); L('deadMoth', 'dead-moth'); L('fly', 'small-fly'); L('springtail', 'springtail'); L('smallAnt', 'small-black-ant');
L('wriggler', 'mosquito-wriggler', { x: 0 }); L('tadpole', 'tadpole', { x: 0 }); L('egg', 'painted-lady-egg'); L('woodChip', 'wood-chip'); L('mud', 'mud-ball');
L('log', 'fallen-log', { seed: 0 });
L('fungus', 'fungus', { amount: 1 }); L('lichen', 'lichen', { amount: 1 }); L('deadLeaf', 'dead-gum-leaf', { amount: 1 });
L('cow', 'friesian-cow', { size: 1, x: 0 });
L('pat', 'cow-pat-fresh', { size: 1, fresh: 1 }, { state: 'fresh' });
L('pat', 'cow-pat-dry', { size: 1, fresh: 0 }, { state: 'dry and cracked' });
L('pat', 'cow-pat-fresh-with-fly-eggs', { size: 1, fresh: 1, eggs: 1 }, { state: 'fresh, with fly eggs' });
L('pat', 'cow-pat-drying-with-maggots', { size: 1, fresh: 0.25, maggots: 1, t: 0.3 }, { state: 'drying, with maggots' });
L('dungBeetle', 'dung-beetle');
L('wrack', 'seaweed-wrack', { amount: 1, seed: 3, angle: 0 });
L('eggRaft', 'mosquito-egg-raft'); L('eggSac', 'spider-egg-sac');
L('antEgg', 'sugar-ant-egg', { grow: 0 }); L('antEgg', 'sugar-ant-egg-about-to-hatch', { grow: 1 }, { state: 'about to hatch' });
L('honeydew', 'honeydew-drop'); L('lerpBug', 'lerp-psyllid');
L('moth', 'brown-moth'); L('moth', 'brown-moth-caught-in-web', { stuck: true }, { state: 'caught in the web' });
L('beetle', 'christmas-beetle'); L('beetle', 'christmas-beetle-caught-in-web', { stuck: true }, { state: 'caught in the web' });
L('wrapped', 'silk-wrapped-prey');
// predators and the other animals
L('echidna', 'short-beaked-echidna'); L('beeEater', 'rainbow-bee-eater'); L('hobby', 'australian-hobby'); L('wagtail', 'willie-wagtail'); L('magpie', 'western-magpie'); L('turtle', 'oblong-turtle');
L('wasp', 'spider-wasp'); L('paperWasp', 'paper-wasp');
L('bobtail', 'bobtail-lizard'); L('bobtail', 'bobtail-lizard-tongue-out', {}, { t: 0.5, state: 'blue tongue out' });
L('gull', 'silver-gull', { face: 1, angle: 0 }); L('gull', 'silver-gull-diving', { face: 1, angle: 0, dive: true }, { state: 'diving' });
L('plover', 'red-capped-plover', { face: 1, angle: 0 });
L('frog', 'motorbike-frog'); L('damselfly', 'damselfly'); L('gilgie', 'gilgie'); L('divingBeetle', 'diving-beetle'); L('kangaroo', 'western-grey-kangaroo'); L('rooPoo', 'kangaroo-droppings');
L('gecko', 'marbled-gecko', { angle: 0 });
L('worm', 'earthworm'); L('resinBee', 'resin-bee'); L('ladybird', 'transverse-ladybird'); L('skink', 'dwarf-skink');
L('honeyeater', 'new-holland-honeyeater', { flying: false }); L('honeyeater', 'new-holland-honeyeater-flying', { flying: true }, { state: 'flying' });
L('wattlebird', 'red-wattlebird', { flying: false }); L('wattlebird', 'red-wattlebird-flying', { flying: true }, { state: 'flying' });
L('fairyWren', 'splendid-fairy-wren');
L('cockatoo', 'carnabys-black-cockatoo', { flying: false }); L('cockatoo', 'carnabys-black-cockatoo-flying', { flying: true }, { state: 'flying' });
L('quenda', 'quenda'); L('banjoFrog', 'western-banjo-frog'); L('quokka', 'quokka', { face: 1 });
// discoveries and props
L('cone', 'banksia-cone');
L('feather', 'feather-black-cockatoo', { color: '#1c1c1c', band: '#f2f2f2' }, { state: 'black cockatoo, white band' });
L('feather', 'feather-red-tailed-black-cockatoo', { color: '#1c1c1c', band: '#c8303a' }, { state: 'red-tailed black cockatoo' });
L('feather', 'feather-silver-gull', { color: '#d8d8d8', band: '#7a7a7a' }, { state: 'silver gull' });
L('feather', 'feather-black-swan', { color: '#1a1a1a' }, { state: 'black swan' });
L('dig', 'dug-hole');
L('shell', 'snail-shell-garden-snail', {}, { state: 'garden snail' });
L('shell', 'snail-shell-white-italian-snail', { color: '#f2efe4' }, { state: 'white Italian snail' });
L('shell', 'snail-shell-freshwater-snail', { color: '#5a5040' }, { state: 'freshwater snail' });
L('seashell', 'cockle-shell', { seed: 0 }); L('beeHotel', 'bee-hotel'); L('birdbath', 'bird-bath-top-view'); L('sausage', 'snag');
// plants
L('dianella', 'dianella-flax-lily', { pollen: true }); L('dianella', 'dianella-flax-lily-no-pollen', { pollen: false }, { state: 'pollen taken' });
L('hibbertia', 'hibbertia-guinea-flower', { pollen: true }); L('hibbertia', 'hibbertia-guinea-flower-no-pollen', { pollen: false }, { state: 'pollen taken' });
L('paw', 'kangaroo-paw', { seed: 5 });
L('everlasting', 'pink-everlasting', { leaf: 1, nectar: true }); L('everlasting', 'pink-everlasting-no-nectar', { leaf: 1, nectar: false }, { state: 'nectar taken' });
L('everlasting', 'pink-everlasting-chewed', { leaf: 0.4, nectar: true }, { state: 'leaves chewed' });
L('capeweed', 'capeweed', { leaf: 1 }); L('capeweed', 'capeweed-chewed', { leaf: 0.4 }, { state: 'leaves chewed' });
L('grevillea', 'grevillea', { nectar: true, seed: 6 }); L('grevillea', 'grevillea-no-nectar', { nectar: false, seed: 6 }, { state: 'nectar taken' });
L('gum', 'gum-tree-crown', { seed: 5 }); L('banksiaTree', 'banksia-tree', { seed: 3 }); L('grassTree', 'grass-tree', { seed: 0 }); L('saltbush', 'saltbush', { seed: 9 });
L('nativeGrass', 'native-grass', { seed: 0 }); L('bottlebrush', 'bottlebrush', { seed: 7 }); L('rush', 'rushes', { seed: 0 });
L('rock', 'garden-rock-limestone', { seed: 2 }, { state: 'limestone' }); L('rock', 'garden-rock-laterite', { seed: 2, kind: 'laterite' }, { state: 'laterite' });
L('litter', 'leaf-litter', { seed: 4 }, { only: '2d' }); L('nestBox', 'nest-box'); L('pondPlant', 'pond-plant');
// the backyard barbecue (isometric); the guests as js/missions2.js places them
const guest = (n, file, o, state) => L('person', file, Object.assign({ face: 1, itch: 0, seed: n }, o), { state });
guest(1, 'barbecue-guest-1-standing', { pose: 'stand', skin: '#e8b890', shirt: '#2f6a9a', pants: '#3a3a3a', hair: '#3a2a1a', hat: '#1a4a2a' }, 'standing, with a hat');
guest(2, 'barbecue-guest-2-sitting', { pose: 'sit', skin: '#8a5a3a', shirt: '#d8502a', pants: '#2a3a5a', hair: '#1a1a1a', long: true }, 'sitting');
guest(3, 'barbecue-guest-3-sitting', { pose: 'sit', skin: '#f2c8a8', shirt: '#f2d040', pants: '#5a7a4a', hair: '#c8a060', long: true }, 'sitting');
guest(4, 'barbecue-guest-4-standing-with-drink', { pose: 'stand', skin: '#c89a70', shirt: '#7a4a9a', pants: '#3a4a6a', hair: '#2a1a10', drink: true }, 'standing, with a drink');
L('bbq', 'barbecue'); L('table', 'table-with-umbrella'); L('isoBirdbath', 'bird-bath'); L('bucket', 'bucket');
L('pot', 'pot-plant-with-water', { water: true }, { state: 'saucer full of water' }); L('pot', 'pot-plant-dry', { water: false }, { state: 'saucer dry' });
// the secrets
for (const [c, f] of [['cricketBall', 'cricket-ball'], ['gnome', 'garden-gnome'], ['thong', 'thong'], ['paperPlane', 'paper-plane'], ['billyCan', 'billy-can'], ['marble', 'marble'], ['sandcastle', 'sandcastle'], ['toyBoat', 'toy-boat']]) L(c, f);
L('rubberDuck', 'rubber-duck', {}, { only: '2d' });
// scenery stamped into the backgrounds: 3D models, and the 2D painters of js/art-ground.js for the drawings
const S = (code, file, o, painter, state) => L(code, file, Object.assign({ seed: 1 }, o), { painter, scenery: true, state: state || '' });
S('bgShrub', 'scenery-heath-shrub', {}, 'drawShrub(ctx, 0, 0, 30, 1);');
S('bgBanksia', 'scenery-banksia', {}, 'drawBanksia(ctx, 0, 0, 48, rng(1));');
S('bgGrassTree', 'scenery-grass-tree', {}, 'drawGrassTree(ctx, 0, 0, 32, 1);');
S('bgGum', 'scenery-gum-crown', {}, 'drawGumCrown(ctx, 0, 0, 55, 1);');
const TUFT_COLS = { dry: ['#b8a858', '#c8b868', '#a89848'], spinifex: ['#9aa85a', '#b7b86e', '#8a9a4a'], green: ['#4a7a2c', '#5a8a36', '#6a9a42'], straw: ['#a8a860', '#b8b870', '#8a8a4a'] };
for (const kind of ['dry', 'spinifex', 'green', 'straw']) S('bgTuft', 'scenery-grass-tuft-' + kind, { kind }, 'tuft(ctx, 0, 0, 24, 1, ' + JSON.stringify(TUFT_COLS[kind]) + ', ' + JSON.stringify(kind) + ');', kind);
S('bgRock', 'scenery-rock-limestone', { kind: 'limestone' }, 'rock(ctx, 0, 0, 12, 1, { kind: "limestone" });', 'limestone');
S('bgRock', 'scenery-rock-laterite', { kind: 'laterite' }, 'rock(ctx, 0, 0, 12, 1, { kind: "laterite" });', 'laterite');
S('bgRock', 'scenery-rock-grey', { kind: 'grey' }, 'rock(ctx, 0, 0, 12, 1, { color: "#8a8a84" });', 'grey');
S('bgRock', 'scenery-rock-limestone-mossy', { kind: 'limestone', moss: true }, 'rock(ctx, 0, 0, 12, 1, { kind: "limestone", moss: true });', 'limestone, mossy');
S('bgLog', 'scenery-fallen-log', {}, 'Ground.contact(ctx, 4, 8, 70, 22, 0.45); Ground.bark(ctx, -60, -14, 120, 28, 1, { axis: "x", color: "#6a5034" }); Ground.endGrain(ctx, 60, 0, 8, 14);');
S('bgLog', 'scenery-fallen-log-thin', { thin: true }, 'Ground.contact(ctx, 2, 5, 55, 10, 0.4); Ground.bark(ctx, -50, -3, 100, 6, 1, { axis: "x", color: "#4a3420" });', 'thin');
S('bgLily', 'scenery-lily-pad', {}, [   // the lily pad of Backgrounds.dragonfly (js/art-ground.js)
  'const s = 20, x = 0, y = 0;',
  'ctx.fillStyle = "rgba(0,20,30,.25)"; ctx.beginPath(); ctx.ellipse(x + 2, y + 3, s, s * 0.95, 0, 0, TAU); ctx.fill();',
  'ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s, 0.12, TAU - 0.12); ctx.closePath();',
  'const g = ctx.createRadialGradient(x - s * 0.3, y - s * 0.3, 2, x, y, s); g.addColorStop(0, "#6aa848"); g.addColorStop(1, "#3a7a2c"); ctx.fillStyle = g; ctx.fill();',
  'if (Shade.rich) Tex.fillPath(ctx, "leaf", 1.2, 0.3, "multiply");',
  'ctx.strokeStyle = "rgba(20,50,20,.5)"; ctx.lineWidth = 0.8; ctx.stroke();',
  'for (let k = 0; k < 7; k++) plainLine(ctx, [x, y, x + Math.cos(k * 0.86 + 0.2) * s * 0.9, y + Math.sin(k * 0.86 + 0.2) * s * 0.9], "rgba(30,70,30,.35)", 0.7);',
].join('\n'));
S('bgWeed', 'scenery-pond-weed', {}, [   // the weed of Backgrounds.nymph (js/art-ground.js)
  'const r = rng(1), cx = 0, cy = 0, rad = 40;',
  'for (let i = 0; i < 18; i++) {',
  '  const a = r() * TAU, d = r() * rad, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, l = 14 + r() * 18, b = r() * TAU;',
  '  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(b + 0.6) * l, y + Math.sin(b + 0.6) * l, x + Math.cos(b) * l * 1.6, y + Math.sin(b) * l * 1.6);',
  '  ctx.strokeStyle = "rgba(10,30,10,.3)"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.stroke();',
  '  ctx.strokeStyle = i % 2 ? "#2f6b2a" : "#3f8236"; ctx.lineWidth = 2.6; ctx.stroke();',
  '  ctx.strokeStyle = "rgba(180,230,150,.35)"; ctx.lineWidth = 0.8; ctx.stroke();',
  '}',
].join('\n'));

// ------------------------------------------------------------------ texture names
const TILE_NAMES = { chitinHi: 'chitin-highlights', hairHi: 'hair-highlights', sandHi: 'sand-highlights' };
const tileName = (k) => TILE_NAMES[k] || k;
const BIRD = { beeEater: 'rainbow-bee-eater', hobby: 'australian-hobby', magpie: 'western-magpie', wagtail: 'willie-wagtail', honeyeater: 'new-holland-honeyeater', wattlebird: 'red-wattlebird', fairyWren: 'splendid-fairy-wren', cockatoo: 'carnabys-black-cockatoo' };
const SHELL_COL = { '#f2efe4': 'white-italian-snail', '#5a5040': 'freshwater-snail', '#8a6a44': 'garden-snail' };
const FEATHER_COL = { '#1c1c1c|#f2f2f2': 'black-cockatoo', '#1c1c1c|#c8303a': 'red-tailed-black-cockatoo', '#d8d8d8|#7a7a7a': 'silver-gull', '#1a1a1a|': 'black-swan' };
const PAINTED = {
  beeBands: 'blue-banded-bee-abdomen-bands', ladybirdDome: 'transverse-ladybird-wing-cases', snailShell: 'native-land-snail-shell', maratusFan0: 'peacock-spider-fan', maratusFan0D: 'peacock-spider-fan-raised', maratusFan1: 'peacock-spider-fan-bluer', maratusFan1D: 'peacock-spider-fan-bluer-raised', maratusFan2: 'peacock-spider-fan-greener', maratusFan2D: 'peacock-spider-fan-greener-raised',
  femaleSpiderMottle: 'peacock-spider-female-mottle', nymphMottle: 'blue-skimmer-nymph-mottle', chrysalisBands: 'painted-lady-chrysalis-bands', bushFlyThorax: 'bush-fly-thorax-stripes', bushFlyAbd: 'bush-fly-abdomen',
  sugarGaster: 'banded-sugar-ant-gaster', sugarGasterH: 'banded-sugar-ant-gaster-full-of-honeydew', orbAbd: 'golden-orb-weaver-abdomen', geckoSkin: 'marbled-gecko-skin', dungElytra: 'dung-beetle-wing-cases',
  divingBeetleBack: 'diving-beetle-wing-cases', lilyPad: 'lily-pad-veins', cowHide: 'friesian-cow-hide', endGrain: 'log-end-grain', heart: 'heart', zLabel: 'stunned-z', isoQ: 'question-mark', isoTalk: 'speech-bubble',
  flyAbd: 'small-fly-abdomen', flyThorax: 'small-fly-thorax', spiderWaspAbd: 'spider-wasp-abdomen', paperWaspAbd: 'paper-wasp-abdomen', resinBeeAbd: 'resin-bee-abdomen', gullWing: 'silver-gull-wing',
  mothWing: 'brown-moth-wing', deadMothWing: 'dead-moth-wing', plFore: 'painted-lady-forewing', plHind: 'painted-lady-hindwing',
};
function sanitise(s) { return String(s).toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, ''); }
function paintedName(key) {
  if (PAINTED[key]) return PAINTED[key];
  let m;
  if ((m = key.match(/^bird\|(\w+)$/))) return (BIRD[m[1]] || sanitise(m[1])) + '-plumage';
  if ((m = key.match(/^fm\|(\w+)\|w$/))) return (BIRD[m[1]] || sanitise(m[1])) + '-wing-feathers';
  if (key === 'fm|ploverWing') return 'red-capped-plover-wing-feathers';
  if ((m = key.match(/^logBark(\d+)$/))) return 'fallen-log-bark-' + m[1];
  if ((m = key.match(/^shellSpiral\|(.+)$/))) return 'snail-shell-spiral-' + (SHELL_COL[m[1]] || sanitise(m[1]));
  if ((m = key.match(/^feather\|([^|]*)\|(.*)$/))) return 'feather-' + (FEATHER_COL[m[1] + '|' + m[2]] || sanitise(m[1] + '-' + m[2]));
  if ((m = key.match(/^mozzieAbd([\d.]+)$/))) return 'mosquito-abdomen-blood-' + m[1];
  if ((m = key.match(/^wingmap\|(\w+)\|([\d.]+)\|([\d.]+)$/))) return 'wing-veins-' + m[1] + '-' + m[2] + 'x' + m[3];
  if ((m = key.match(/^flat\|(\w+)\|(.*)$/))) return 'flat-' + sanitise(m[1]) + '-' + sanitise(m[2]);
  return sanitise(key);
}

// ------------------------------------------------------------------ files
function writePng(file, dataUrl) { fs.writeFileSync(file, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')); }
const csv = (v) => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const README = [
  'Bugame art export',
  '=================',
  'Every sprite and texture of Bugame (https://chaplinta.github.io/bugame/), drawn in code by the game and exported as PNG files.',
  '',
  '3d/               The three.js models as the game shows them with WebGL on: one transparent PNG per thing, with the model\'s own cast shadow',
  '                  (none for the side-on beach animals and the floating things). 8 px = 1 game unit; a bull ant is about 50 units long.',
  'drawings/         The same things as the flat canvas drawings the game uses when WebGL is off. No shadow (the game adds a soft blob in play).',
  'textures/tiles/   The 14 seamless 128 px material tiles that shade every drawing: chitin, hair, leaf, wing, scales, sand, soil, bark, grain,',
  '                  caustic, ripple and the highlight layers. Black or white with transparency, as the game uses them.',
  'textures/bump/    The same tiles over mid grey, as the 3D models use them for bump mapping.',
  'textures/painted/ The colour maps painted in code for the models: the bee\'s bands, each bird\'s plumage and wing feathers, wing veins,',
  '                  the cow\'s hide, shells, the gecko\'s marbling, the painted lady\'s wings, and so on.',
  '',
  'Every sprite faces right (the beach animals and the barbecue guests as seen in their levels) and is lit from the top-left.',
  'Variants (a female, a queen with wings, a dry cow pat, each barbecue guest, pollen taken...) are separate files with a suffix.',
  'index.csv lists every file with the game\'s code name for it, what it is, its state, its size and the pixels per game unit.',
  '',
].join('\n');

(async () => {
  const t0 = Date.now();
  fs.rmSync(OUT, { recursive: true, force: true });
  for (const d of ['3d', 'drawings', 'textures/tiles', 'textures/bump', 'textures/painted']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  const looks = LOOKS.filter((l) => !ONLY || ONLY.some((n) => l.code === n || l.file.includes(n)));
  const rows = [], fails = [], coarse = [], count = { '3d': 0, drawings: 0, tiles: 0, bump: 0, painted: 0 };
  const row = (folder, file, l, r, note) => rows.push({ folder, file, code: l.code, what: WHAT[l.code] || l.code, state: l.state, o: JSON.stringify(l.o), t: l.t, w: r && r.w, h: r && r.h, px: r && (r.effPx || PX), note: note || '' });
  const b = await launch();

  // ---------------------------------------------------------------- the 3D renders (software WebGL)
  const pA = await openGame(b, { width: 1000, height: 720 }, FILE_URL + '?3d=force');
  pA.setDefaultTimeout(300000);
  await pA.waitForFunction(() => typeof Render3D !== 'undefined' && (Render3D.ok || Render3D.failed), null, { timeout: 60000 });
  const max = await pA.evaluate((m) => { if (!Render3D.ok) return 0; Tex.ready(); Render3D.MAX = Math.min(m, Render3D.renderer.capabilities.maxTextureSize || m); return Render3D.MAX; }, MAX);
  if (!max) { console.error('WebGL did not come up (Render3D.failed), so nothing renders in 3D'); fails.push('3d: renderer failed'); }
  else {
    console.log('3D renders at ' + PX + ' px/unit, GL canvas up to ' + max + ' px');
    for (const l of looks) {
      if (l.only === '2d') continue;
      const r = await pA.evaluate(([name, o, t, px]) => {
        try {
          SpriteCache.clear();
          const ent = SpriteCache.image(name, o, { t, px, angle: 0, any: true });
          if (!ent) return { missing: true };
          const w = ent.c.width, h = ent.c.height;
          return { data: ent.c.toDataURL('image/png'), w, h, box: ent.box, threeD: !!ent.threeD, broken: !!(Models.defs[name] && Models.defs[name].broken), lost: Render3D.lost,
            effPx: +(px * Math.min(1, Render3D.MAX / Math.max(w, h))).toFixed(2) };
        } catch (e) { return { error: String(e && e.stack || e) }; }
      }, [l.code, l.o, l.t, PX]);
      if (r.error || r.missing || !r.threeD) {
        const why = r.error ? 'error: ' + r.error.split('\n')[0] : r.missing ? 'no bitmap' : r.broken ? 'model broken, fell back to the drawing' : 'fell back to the drawing';
        fails.push('3d/' + l.file + ': ' + why); row('3d', l.file + '.png', l, r, why);
      } else {
        writePng(path.join(OUT, '3d', l.file + '.png'), r.data); count['3d']++;
        const note = r.effPx < PX ? 'rendered at ' + r.effPx + ' px/unit (bigger than the GL canvas)' : '';
        if (note) coarse.push(l.file + ': ' + r.effPx);
        row('3d', l.file + '.png', l, r, note);
      }
      if (r.lost) { fails.push('3d: the WebGL context was lost after ' + l.file + ' (try --max 2048)'); break; }
      process.stdout.write('.');
    }
    console.log('');
    // the textures, once every painted map exists
    const tex = await pA.evaluate(() => {
      const out = { tiles: [], bump: [], painted: [], flight: null, flightError: '' };
      for (const k of Object.keys(Tex.recipes)) { const c = Tex.tile(k); if (c) out.tiles.push([k, c.toDataURL('image/png')]); }
      for (const [k, t] of Render3D.M.tex) {
        if (k.startsWith('h|') && k.split('|').length === 2) out.bump.push([k.slice(2), t.image.toDataURL('image/png')]);
        else if (k.startsWith('p|')) out.painted.push([k.slice(2), t.image.toDataURL('image/png')]);
      }
      try { if (typeof wingTexture === 'function') out.flight = wingTexture().image.toDataURL('image/png'); } catch (e) { out.flightError = String(e); }
      return out;
    });
    const used = new Set(), unique = (name) => { let n = name, i = 2; while (used.has(n)) n = name + '-' + i++; used.add(n); return n; };
    for (const [k, d] of tex.tiles) { const f = tileName(k) + '.png'; writePng(path.join(OUT, 'textures/tiles', f), d); count.tiles++; rows.push({ folder: 'textures/tiles', file: f, code: k, what: 'material tile (seamless, 128 px)', w: 128, h: 128 }); }
    for (const [k, d] of tex.bump) { const f = unique('bump-' + k.split('+').map(tileName).join('-')) + '.png'; writePng(path.join(OUT, 'textures/bump', f), d); count.bump++; rows.push({ folder: 'textures/bump', file: f, code: 'h|' + k, what: 'bump map (tiles over mid grey)', w: 128, h: 128 }); }
    for (const [k, d] of tex.painted) { const f = unique(paintedName(k)) + '.png'; writePng(path.join(OUT, 'textures/painted', f), d); count.painted++; rows.push({ folder: 'textures/painted', file: f, code: 'p|' + k, what: 'painted map' }); }
    if (tex.flight) { writePng(path.join(OUT, 'textures/painted', 'painted-lady-wings-flight-model.png'), tex.flight); count.painted++; rows.push({ folder: 'textures/painted', file: 'painted-lady-wings-flight-model.png', code: 'wingTexture', what: 'painted map (the flight level\'s butterfly wings)', w: 256, h: 256 }); }
    else if (tex.flightError) fails.push('flight wing texture: ' + tex.flightError);
  }
  const errorsA = pA.errors.slice();
  await pA.context().close();

  // ---------------------------------------------------------------- the flat drawings (no three.js at all)
  const pB = await openGame(b, { width: 1000, height: 720 }, FILE_URL + '?no3d=1');
  const flat = await pB.evaluate(() => { Tex.ready(); return typeof Render3D !== 'undefined' && Render3D.disabled && !Render3D.ok; });
  if (!flat) fails.push('drawings: the no-3D page still has the renderer on');
  for (const l of looks) {
    if (l.only === '3d') continue;
    const r = await pB.evaluate(([name, o, t, px, painterSrc, scenery]) => {
      try {
        const fn = painterSrc ? new Function('ctx', 'o', 't', painterSrc) : (ctx, oo, tt) => Sprites[name](ctx, oo, tt);
        if (!painterSrc && !Sprites[name]) return { error: 'no drawing called ' + name };
        const draw = (P, box) => {
          const c = document.createElement('canvas');
          c.width = Math.ceil((box[2] - box[0]) * P); c.height = Math.ceil((box[3] - box[1]) * P);
          const x = c.getContext('2d'); x.setTransform(P, 0, 0, P, -box[0] * P, -box[1] * P);
          const m0 = Shade.maxR; if (scenery) Shade.maxR = 30;   // the levels paint their scenery under this cap
          Shade.light = [-0.55, -0.83];
          try { fn(x, o, t); } finally { Shade.light = null; Shade.maxR = m0; }
          return c;
        };
        // a coarse pass to find the drawn area, then a tight one at full size
        const R = 320, c0 = draw(2, [-R, -R, R, R]), d = c0.getContext('2d').getImageData(0, 0, c0.width, c0.height).data;
        let x0 = c0.width, y0 = c0.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c0.height; y++) for (let x = 0; x < c0.width; x++) if (d[(y * c0.width + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return { empty: true };
        const m = 2, box = [x0 / 2 - R - m, y0 / 2 - R - m, (x1 + 1) / 2 - R + m, (y1 + 1) / 2 - R + m];
        const c1 = draw(px, box);
        return { data: c1.toDataURL('image/png'), w: c1.width, h: c1.height, box: box.map((v) => +v.toFixed(1)) };
      } catch (e) { return { error: String(e && e.stack || e) }; }
    }, [l.code, l.o, l.t, PX, l.painter || null, !!l.scenery]);
    if (r.error || r.empty) { const why = r.error ? 'error: ' + r.error.split('\n')[0] : 'drew nothing'; fails.push('drawings/' + l.file + ': ' + why); row('drawings', l.file + '.png', l, r, why); }
    else { writePng(path.join(OUT, 'drawings', l.file + '.png'), r.data); count.drawings++; row('drawings', l.file + '.png', l, r); }
    process.stdout.write('.');
  }
  console.log('');
  const errorsB = pB.errors.slice();
  await pB.context().close();
  await b.close();

  // ---------------------------------------------------------------- index, readme, zip, report
  const head = ['folder', 'file', 'code', 'what', 'state', 'o', 't', 'width', 'height', 'px_per_unit', 'note'];
  fs.writeFileSync(path.join(OUT, 'index.csv'), [head.join(',')].concat(rows.map((r) => [r.folder, r.file, r.code, r.what, r.state, r.o, r.t, r.w, r.h, r.px, r.note].map(csv).join(','))).join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'README.txt'), README);
  let zipNote = 'not zipped (--no-zip)';
  if (!args.includes('--no-zip')) {
    fs.rmSync(ZIP, { force: true });
    try { execFileSync('zip', ['-r', '-q', path.basename(ZIP), 'art'], { cwd: OUTPUT }); zipNote = ZIP + ' (' + (fs.statSync(ZIP).size / 1048576).toFixed(1) + ' MB)'; }
    catch (e) { fails.push('zip failed: ' + e.message); zipNote = 'zip failed'; }
  }
  const pageErrors = errorsA.concat(errorsB);
  console.log('3d: ' + count['3d'] + ' files   drawings: ' + count.drawings + '   textures: ' + count.tiles + ' tiles, ' + count.bump + ' bump maps, ' + count.painted + ' painted maps');
  if (coarse.length) console.log('rendered coarser than ' + PX + ' px/unit (bigger than the GL canvas): ' + coarse.join(', '));
  if (fails.length) console.log('FAILED (' + fails.length + '):\n  ' + fails.join('\n  '));
  if (pageErrors.length) console.log('page errors (' + pageErrors.length + '):\n  ' + pageErrors.join('\n  '));
  console.log('out: ' + OUT + '\nzip: ' + zipNote + '\n' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  process.exit(fails.length || pageErrors.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
