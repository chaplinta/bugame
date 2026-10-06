'use strict';
// Bugs, their life stages, and one mission per stage.
// Every fact here is listed with a source in docs/facts.md.

function setHud(goal, extra) {
  document.getElementById('hudGoal').textContent = goal;
  document.getElementById('hudExtra').textContent = extra || '';
}

// Action buttons work by holding OR tapping: holding counts time, each new press adds a little extra.
// Progress is never lost by letting go, so tapping kids get there too.
function working(input) { return input.held || input.pressed; }
function work(input, dt) { return (input.held ? dt : 0) + (input.pressed ? 0.3 : 0); }

function setAction(label, ready) {
  const btn = document.getElementById('actionBtn');
  if (btn.textContent !== label) btn.textContent = label;
  btn.classList.toggle('ready', !!ready);
}

// Every mission world is four screens big.
const BIG = { w: 1920, h: 1200 };

// Somewhere for new food to appear: mostly near the player, so there is always something close by.
function nearPlayer(minFromHome) {
  const g = Game.g;
  return Math.random() < 0.7 ? Game.spawnPoint(minFromHome || 140, g.player, 520) : Game.spawnPoint(minFromHome || 140);
}

// Jumping-spider hunting, shared by the spiderling and adult spider.
// Prey with state 'sit' (or no state) within range can be jumped on. Returns the prey caught this frame.
function spiderHunt(g, dt, input, prey, range) {
  const p = g.player;
  p.jcd = Math.max(0, (p.jcd || 0) - dt);
  if (p.silk) { p.silk.life -= dt; if (p.silk.life <= 0) p.silk = null; }
  const target = nearest(prey.filter(f => !f.state || f.state === 'sit'), p, range);
  setAction('Jump', target && !p.jump && p.jcd <= 0);
  if (input.pressed && !p.jump && p.jcd <= 0) {
    let tx, ty;
    if (target) { tx = target.x; ty = target.y; }
    else { tx = p.x + Math.cos(p.angle) * 110; ty = p.y + Math.sin(p.angle) * 110; }
    p.jump = { sx: p.x, sy: p.y, tx: clamp(tx, 20, World.w - 20), ty: clamp(ty, 20, World.h - 20), t: 0, dur: 0.32, target };
    p.angle = Math.atan2(ty - p.y, tx - p.x);
    p.silk = { x: p.x, y: p.y, life: 1.5 };
    Sound.play('jump');
    Game.fact('silk');
  }
  if (!p.jump) return null;
  const j = p.jump;
  // Game simplification: the jump follows a target that hops mid-jump.
  if (j.target && g.items.includes(j.target)) { j.tx = j.target.x; j.ty = j.target.y; }
  j.t += dt;
  const k = Math.min(1, j.t / j.dur);
  p.x = j.sx + (j.tx - j.sx) * k;
  p.y = j.sy + (j.ty - j.sy) * k;
  p.hop = Math.sin(k * Math.PI);
  if (k >= 1) { p.jump = null; p.hop = 0; p.jcd = 0.3; }
  const f = prey.find(i => touching(p, i, 6));
  if (!f) return null;
  p.jump = null; p.hop = 0; p.jcd = 0.3;
  g.items.splice(g.items.indexOf(f), 1);
  Sound.play('score');
  return f;
}

function drawSilk(ctx, p) {
  if (!p.silk) return;
  ctx.beginPath();
  ctx.moveTo(p.silk.x, p.silk.y);
  ctx.lineTo(p.x, p.y);
  ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, p.silk.life) + ')';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

// Map pins are in the 960x600 map box (see drawPerthMap).
const Bugs = [
  { id: 'ant', name: 'Bull Ant', sci: 'Myrmecia', place: 'Kings Park', sprite: 'ant', pin: { x: 455, y: 330 }, stages: ['ant', 'queen'] },
  { id: 'bee', name: 'Blue-banded Bee', sci: 'Amegilla', place: 'A backyard', sprite: 'bee', pin: { x: 700, y: 455 }, stages: ['bee'] },
  { id: 'fly', name: 'Bush Fly', sci: 'Musca vetustissima', place: 'Swan Valley', sprite: 'bushFly', pin: { x: 780, y: 185 }, stages: ['fly'] },
  { id: 'butterfly', name: 'Painted Lady', sci: 'Vanessa kershawi', place: 'Bold Park', sprite: 'butterfly', pin: { x: 300, y: 300 }, stages: ['caterpillar', 'butterfly'] },
  { id: 'termite', name: 'Termite', sci: 'Coptotermes', place: 'Whiteman Park', sprite: 'termiteWorker', pin: { x: 640, y: 100 }, stages: ['termite'] },
  { id: 'snail', name: 'Native Snail', sci: 'Bothriembryon', place: 'Bibra Lake', sprite: 'snail', pin: { x: 430, y: 525 }, stages: ['snail'] },
  { id: 'spider', name: 'Peacock Spider', sci: 'Maratus speciosus', place: 'Cottesloe dunes', sprite: 'spider', pin: { x: 262, y: 380 }, stages: ['spiderling', 'spider'] },
  { id: 'dragonfly', name: 'Blue Skimmer', sci: 'Orthetrum caledonicum', place: 'Herdsman Lake', sprite: 'dragonfly', pin: { x: 430, y: 185 }, stages: ['nymph', 'dragonfly'] },
];

const Missions = {
  // ---------------------------------------------------------------- Bull ant
  ant: {
    id: 'ant', bug: 'ant', stage: 'Worker', place: 'Banksia woodland, Kings Park', world: BIG,
    action: 'Sting', radius: 16, speed: 150, scale: 1.4, goal: 12,
    home: { x: 220, y: 980, r: 50, label: 'Nest' },
    facts: [
      'Almost every kind of bull ant in the world lives only in Australia.',
      'Bull ants have big eyes. They hunt by sight, and usually alone.',
      'Ants are insects: 6 legs and 3 body parts.',
    ],
    how: [
      'Move with the arrow keys, or touch and drag. Explore the bush!',
      'Pick up dead insects and termites and carry them to the nest.',
      'Caterpillars are too big. Get close and press Sting first.',
      'Every load makes your nest bigger. Look for sparkles: they’re discoveries.',
    ],
    discoveries: [
      { key: 'd_cone', sprite: 'cone', fx: 0.35, fy: 0.18 },
      { key: 'd_dig', sprite: 'dig', fx: 0.82, fy: 0.3 },
      { key: 'd_feather', sprite: 'feather', band: '#f2f2f2', fx: 0.6, fy: 0.85 },
      { key: 'd_magpie', sprite: 'magpie', fx: 0.92, fy: 0.82 },
    ],
    factText: {
      start: 'Worker bull ants are all females. The queen stays in the nest laying eggs.',
      scavenge: 'Bull ants don’t just hunt. They also pick up dead insects they find lying around.',
      sting: 'A bull ant’s sting is venomous and very painful. Look at them, never touch!',
      carry: 'Bull ants can carry food much heavier than themselves.',
      larvae: 'The insects go to the larvae (baby ants). Adult bull ants drink nectar and sweet juices instead.',
      build: 'As the colony grows, the workers dig more tunnels and chambers, and pile up soil around the entrances.',
      echidna: 'Echidnas dig into ant nests and lick up ants with a long, sticky tongue.',
      d_cone: 'A banksia cone! Many banksias keep their seeds locked in cones until a bushfire opens them.',
      d_dig: 'A quenda dig! Quendas are small bandicoots that dig cone-shaped holes to find insects and fungi. They live in Kings Park.',
      d_feather: 'A black cockatoo feather! Carnaby’s black cockatoos eat banksia seeds. They are endangered.',
      d_magpie: 'An Australian magpie, walking along the ground hunting for grubs.',
      win: 'A bull ant nest can last for years, with new workers growing up every season.',
    },

    setup(g) {
      for (let i = 0; i < 6; i++) this.addTermite();
      for (let i = 0; i < 8; i++) this.addDead();
      for (let i = 0; i < 3; i++) this.addCaterpillar();
      Game.addPred({ sprite: 'echidna', name: 'echidna', ground: true, r: 26, wanderSpeed: 32, chaseSpeed: 70, sight: 170,
        chaseTime: 4, restTime: 3 });
    },
    addTermite() {
      const p = nearPlayer(160);
      Game.g.items.push({ sprite: 'termite', kind: 'termite', x: p.x, y: p.y, r: 9, speed: 22, scale: 1.4 });
    },
    addDead() {
      const p = nearPlayer(160);
      const sprite = Math.random() < 0.5 ? 'deadBeetle' : 'deadMoth';
      Game.g.items.push({ sprite, kind: 'dead', name: sprite === 'deadBeetle' ? 'dead beetle' : 'dead moth',
        x: p.x, y: p.y, r: 11, scale: 1.4, angle: Math.random() * TAU });
    },
    addCaterpillar() {
      const p = Game.spawnPoint(220);
      Game.g.items.push({ sprite: 'caterpillar', kind: 'caterpillar', x: p.x, y: p.y, r: 14, speed: 12, stunned: false, scale: 1.3 });
    },
    update(g, dt, input) {
      const p = g.player;
      p.stingT = Math.max(0, (p.stingT || 0) - dt);
      for (const it of g.items) {
        if (it.kind === 'dead') continue;
        if (it.stunned) { it.stunT -= dt; it.moving = false; if (it.stunT <= 0) it.stunned = false; }
        else wander(it, dt, it.speed);
      }
      const near = nearest(g.items.filter(i => i.kind === 'caterpillar' && !i.stunned), p, 48);
      setAction('Sting', !!near && !p.carry);
      if (input.pressed) {
        p.stingT = 0.3;
        Sound.play('sting');
        if (near) {
          near.stunned = true; near.stunT = 8;
          Game.pop(near.x, near.y - 14, 'Stung!', '#ffd23f');
          Game.fact('sting');
        }
      }
      if (!p.carry) {
        const it = g.items.find(i => touching(p, i));
        if (it) {
          if (it.kind !== 'caterpillar' || it.stunned) {
            p.carry = it.sprite;
            p.carryName = it.name || it.kind;
            g.items.splice(g.items.indexOf(it), 1);
            Sound.play('pick');
            Game.fact(it.kind === 'dead' ? 'scavenge' : 'carry');
            Game.later(4, () => it.kind === 'dead' ? this.addDead() : it.kind === 'termite' ? this.addTermite() : this.addCaterpillar());
          } else {
            Game.hint('Too big! Press Sting right next to the caterpillar.');
          }
        }
      } else if (Game.inHome()) {
        g.score++;
        Sound.play('score');
        Game.pop(p.x, p.y - 20, '+1', '#fff');
        p.carry = null;
        Game.fact('larvae');
        if (g.score === 3) Game.fact('build');
      }
      p.speed = p.carry ? 115 : 150;
    },
    // The nest mound grows and gains entrances with every load.
    drawBuild(ctx, g) {
      const h = g.home, n = Math.min(g.score, 12);
      ell(ctx, h.x, h.y, h.r * 0.9 + n * 5, h.r * 0.75 + n * 4, 'rgba(150,110,60,.45)');
      for (let i = 0; i < n; i++) {
        const a = i * 2.4, d = h.r * 0.5 + (i % 3) * 10;
        ell(ctx, h.x + Math.cos(a) * d, h.y + Math.sin(a) * d * 0.8, 9, 8, '#c9a868');
        ell(ctx, h.x + Math.cos(a) * d, h.y + Math.sin(a) * d * 0.8, 4, 3.5, '#2a1a0c');
      }
    },
    onCaught(g) { g.player.carry = null; },
    goalPoint(g) { return g.player.carry ? g.home : null; },
    hud(g) { setHud('Food: ' + g.score + ' / ' + this.goal, g.player.carry ? 'Carrying a ' + g.player.carryName : ''); },
    won(g) { return g.score >= this.goal; },
  },

  // ---------------------------------------------------------- Bull ant: queen
  queen: {
    id: 'queen', bug: 'ant', stage: 'Queen', place: 'Banksia woodland, Kings Park', world: BIG,
    sprite: 'queenAnt', bg: 'ant',
    action: 'Land', radius: 16, speed: 170, scale: 1.5, goal: 5,
    home: { x: 220, y: 980, r: 46, label: 'Old nest' },
    facts: [
      'A bull ant colony starts with one queen.',
      'Young queens have wings. Workers never do.',
      'A queen is bigger than the workers, and lays all the eggs.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag.',
      'Find a patch of clear sand far from the old nest and press Land.',
      'Hold Dig to dig your new nest.',
      'Hunt 5 termites and bring them home to feed your first babies.',
    ],
    discoveries: [
      { key: 'd_echidna', sprite: 'dig', fx: 0.5, fy: 0.5 },
      { key: 'd_bobtail', sprite: 'bobtail', fx: 0.15, fy: 0.25 },
    ],
    factText: {
      start: 'On a warm day, often after rain, winged young queens and males leave the nest to mate.',
      wings: 'After mating, the queen snaps off her wings. She will never fly again.',
      dig: 'She digs a small chamber in the soil and lays her first eggs.',
      hunt: 'Bull ant queens leave the new nest to hunt for their first larvae. Queens of many other ants stay sealed inside.',
      wagtail: 'Willie wagtails snap up flying insects, and hunt on the ground too.',
      d_echidna: 'Echidna diggings! Echidnas rip open ant and termite nests with strong front claws.',
      d_bobtail: 'A bobtail lizard. Its fat tail looks like a second head, which confuses predators.',
      win: 'When the first workers grow up, they do the hunting. The queen stays home laying eggs for years.',
    },

    setup(g) {
      const p = g.player;
      p.wings = true; p.flying = true; p.digT = 0;
      g.phase = 'fly';
      g.patches = [];
      for (let i = 0; i < 4; i++) g.patches.push(Game.spawnPoint(600));
      Game.addPred({ sprite: 'wagtail', name: 'willie wagtail', r: 20, scale: 1.1, wanderSpeed: 70, chaseSpeed: 140, sight: 180,
        chaseTime: 2.5, restTime: 3.5 });
    },
    addTermite() {
      const p = Game.spawnPoint(140, Game.g.home, 400);
      Game.g.items.push({ sprite: 'termite', kind: 'termite', x: p.x, y: p.y, r: 9, speed: 22, scale: 1.4 });
    },
    onCaught(g) { g.player.carry = null; },
    update(g, dt, input) {
      const p = g.player;
      for (const it of g.items) wander(it, dt, it.speed);

      if (g.phase === 'fly') {
        const patch = g.patches.find(pt => dist(pt, p) < 45);
        setAction('Land', !!patch);
        if (patch && input.pressed) {
          g.phase = 'dig';
          p.wings = false; p.flying = false;
          g.dropped = { x: p.x - 18, y: p.y + 10 };
          g.home = { x: patch.x, y: patch.y, r: 40, label: 'New nest' };
          p.x = patch.x; p.y = patch.y;
          Sound.play('pick');
          Game.fact('wings');
          g.toasts.push({ text: 'Now hold Dig to dig your nest.', kind: 'hint' });
        }
        p.speed = 170;
      } else if (g.phase === 'dig') {
        const here = Game.inHome();
        setAction('Dig', here);
        if (here && working(input)) {
          const w = work(input, dt);
          if (Math.floor((p.digT + w) * 5) !== Math.floor(p.digT * 5)) Sound.play('tap');
          p.digT += w;
          if (p.digT >= 2) {
            g.phase = 'hunt';
            Sound.play('score');
            Game.fact('dig');
            for (let i = 0; i < 5; i++) this.addTermite();
            g.toasts.push({ text: 'Your eggs need food. Hunt termites and bring them home!', kind: 'hint' });
          }
        }
        p.progress = Math.min(1, p.digT / 2);
        p.speed = 140;
      } else {
        setAction('Sting', false);
        if (!p.carry) {
          const it = g.items.find(i => touching(p, i));
          if (it) {
            p.carry = 'termite';
            g.items.splice(g.items.indexOf(it), 1);
            Sound.play('pick');
            Game.fact('hunt');
            Game.later(3, () => this.addTermite());
          }
        } else if (Game.inHome()) {
          g.score++;
          Sound.play('score');
          Game.pop(p.x, p.y - 20, '+1', '#fff');
          p.carry = null;
        }
        p.speed = p.carry ? 110 : 140;
      }
    },
    drawExtra(ctx, g) {
      if (g.phase === 'fly') {
        for (const pt of g.patches) {
          ell(ctx, pt.x, pt.y, 42, 34, 'rgba(250,240,210,.75)');
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, 42, 34, 0, 0, TAU);
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(200,80,30,.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        const h = g.home, k = g.phase === 'dig' ? Math.min(1, g.player.digT / 2) : 1;
        ell(ctx, h.x, h.y, 10 + 22 * k, 8 + 18 * k, '#c9a868');
        ell(ctx, h.x, h.y, 4 + 10 * k, 3 + 9 * k, '#2a1a0c');
      }
      if (g.dropped) {
        ctx.save();
        ctx.translate(g.dropped.x, g.dropped.y);
        wings(ctx, 0, 3, 15, 5, 0.9, 'rgba(240,235,220,.7)');
        ctx.restore();
      }
    },
    goalPoint(g) {
      if (g.phase === 'fly') return nearest(g.patches, g.player, 99999);
      if (g.phase === 'dig') return Game.inHome() ? null : g.home;
      return g.player.carry ? g.home : null;
    },
    hud(g) {
      if (g.phase === 'fly') setHud('Find clear sand and land', '');
      else if (g.phase === 'dig') setHud('Digging: ' + Math.round(Math.min(1, g.player.digT / 2) * 100) + '%', '');
      else setHud('Food: ' + g.score + ' / ' + this.goal, g.player.carry ? 'Carrying a termite' : '');
    },
    won(g) { return g.score >= this.goal; },
  },

  // -------------------------------------------------------- Blue-banded bee
  bee: {
    id: 'bee', bug: 'bee', stage: 'Adult female', place: 'A backyard with native plants', world: BIG,
    action: 'Buzz', radius: 16, speed: 175, scale: 1.5, goal: 12,
    home: { x: 200, y: 220, r: 46, label: 'Burrow' },
    facts: [
      'Blue-banded bees live alone, not in a hive. Each female digs her own burrow in soil or a clay bank.',
      'They can do "buzz pollination": shaking pollen out of a flower by vibrating their flight muscles.',
      'Bees are insects: 6 legs, 3 body parts and 4 wings.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag. Explore the whole yard!',
      'Land on a blue Dianella or yellow Hibbertia flower and hold or tap Buzz.',
      'You can carry 3 loads. Every 3 loads fills a new cell in your burrow.',
      'Look for sparkles: they’re discoveries.',
    ],
    discoveries: [
      { key: 'd_hotel', sprite: 'beeHotel', fx: 0.76, fy: 0.62 },
      { key: 'd_bath', sprite: 'birdbath', fx: 0.3, fy: 0.45 },
      { key: 'd_snail', sprite: 'shell', fx: 0.6, fy: 0.9 },
      { key: 'd_bobtail', sprite: 'bobtail', fx: 0.9, fy: 0.35 },
    ],
    factText: {
      start: 'European honey bees can’t buzz-pollinate. Blue-banded bees can.',
      dianella: 'Dianella (flax lily) keeps its pollen locked inside tubes. Only a buzz shakes it out.',
      hibbertia: 'Hibbertia (guinea flower) is another buzz-pollinated flower. Bees spread its pollen from flower to flower.',
      paw: 'Kangaroo paws are pollinated mainly by birds like honeyeaters. Pollen rubs onto the bird’s head as it drinks nectar.',
      nest: 'She mixes pollen with nectar into a food ball, lays an egg on it, and seals the cell.',
      cell: 'A full cell! The egg in it will hatch into a larva that eats the food ball, then turns into a new bee.',
      beeEater: 'Rainbow bee-eaters fly to Perth in spring. They catch bees in the air, then rub them on a branch to get rid of the sting.',
      d_hotel: 'A bee hotel! Other solitary bees, like resin bees, nest in holes like these.',
      d_bath: 'A birdbath. Bees need water too, especially on hot days.',
      d_snail: 'A garden snail shell. These snails were brought to Australia from Europe.',
      d_bobtail: 'A bobtail lizard. Bobtails eat snails, flowers and insects, and are common in Perth gardens.',
      win: 'At night, male blue-banded bees sleep holding onto a plant stem with their jaws.',
    },

    setup(g) {
      const kinds = ['dianella', 'hibbertia', 'dianella', 'hibbertia', 'dianella', 'paw'];
      for (let c = 0; c < 9; c++) {
        // Flowers grow in patches, so there are good spots to find.
        const centre = Game.spawnPoint(200);
        const kind = kinds[c % kinds.length];
        for (let i = 0; i < 3; i++) {
          const x = clamp(centre.x + (Math.random() - 0.5) * 140, 40, World.w - 40);
          const y = clamp(centre.y + (Math.random() - 0.5) * 140, 40, World.h - 40);
          g.items.push({ sprite: kind, kind, x, y, r: 26, scale: 1.3, pollen: kind !== 'paw', regrow: 0, angle: Math.random() * TAU });
        }
      }
      g.player.load = 0;
      g.player.buzzT = 0;
      Game.addPred({ sprite: 'beeEater', name: 'rainbow bee-eater', r: 22, wanderSpeed: 70, chaseSpeed: 135, sight: 190,
        chaseTime: 2.6, restTime: 3.5 });
    },
    update(g, dt, input) {
      const p = g.player;
      p.buzz = false;
      for (const f of g.items) {
        if (!f.pollen && f.kind !== 'paw') { f.regrow -= dt; if (f.regrow <= 0) f.pollen = true; }
      }
      const f = g.items.find(i => touching(p, i, -8));
      if (f !== p.flower) { p.flower = f; p.buzzT = 0; }
      setAction('Buzz', f && f.pollen && p.load < 3);
      if (f) {
        if (f.kind === 'paw') {
          Game.fact('paw');
        } else if (f.pollen) {
          if (p.load >= 3) { if (p.stillT > 1.5) Game.hint('Your legs are full of pollen. Fly back to the burrow!'); }
          else if (working(input)) {
            p.buzz = true;
            const w = work(input, dt);
            if (Math.floor((p.buzzT + w) * 8) !== Math.floor(p.buzzT * 8)) Sound.play('buzz');
            p.buzzT += w;
            Game.fact(f.kind);
            if (p.buzzT >= 0.8) {
              p.load++; f.pollen = false; f.regrow = 12; p.buzzT = 0;
              Sound.play('pick');
              Game.pop(f.x, f.y - 20, 'Pollen!', '#f39c12');
            }
          } else if (p.stillT > 1.5) Game.hint('Hold or tap Buzz to shake the pollen out!');
        }
      }
      if (f && f.pollen) p.progress = Math.min(1, p.buzzT / 0.8);
      if (p.load > 0 && Game.inHome()) {
        const before = Math.floor(g.score / 3);
        g.score += p.load;
        Sound.play('score');
        Game.pop(p.x, p.y - 20, '+' + p.load, '#fff');
        p.load = 0;
        Game.fact('nest');
        if (Math.floor(g.score / 3) > before) Game.fact('cell');
      }
      p.speed = 175 - p.load * 10;
    },
    // Burrow cells fill with pollen balls, one cell per 3 loads.
    drawBuild(ctx, g) {
      const h = g.home, cells = 4;
      for (let i = 0; i < cells; i++) {
        const a = -0.3 + i * 0.55, x = h.x + Math.cos(a) * (h.r + 34), y = h.y + Math.sin(a) * (h.r + 34);
        const fill = clamp(g.score - i * 3, 0, 3) / 3;
        line(ctx, [h.x, h.y, x, y], 'rgba(90,60,30,.5)', 6);
        ell(ctx, x, y, 14, 11, '#8a6438');
        ell(ctx, x, y, 11, 8, '#5a3e22');
        if (fill > 0) ell(ctx, x, y, 3 + fill * 6, 3 + fill * 5, '#f0b030');
        if (fill >= 1) { ell(ctx, x, y, 13, 10, 'rgba(160,120,70,.7)'); ell(ctx, x + 2, y - 2, 2.5, 1.2, '#fbf7ea'); }
      }
    },
    onCaught(g) { g.player.load = 0; },
    goalPoint(g) { return g.player.load >= 3 ? g.home : null; },
    hud(g) { setHud('Cells filled: ' + Math.min(4, Math.floor(g.score / 3)) + ' / 4', 'Carrying ' + g.player.load + ' / 3'); },
    won(g) { return g.score >= this.goal; },
  },

  // ---------------------------------------------------------- Bush fly
  fly: {
    id: 'fly', bug: 'fly', stage: 'Adult female', place: 'A cattle paddock in the Swan Valley', world: BIG,
    sprite: 'bushFly', bg: 'paddock',
    action: 'Sip', radius: 12, speed: 170, scale: 1.7, goal: 6,
    home: { x: 220, y: 980, r: 70, label: 'Shady gum tree' },
    facts: [
      'Bush flies are the flies that buzz round your face in an Aussie summer.',
      'Flies are insects, but they have only 2 wings, not 4.',
      'Bush flies breed in dung. Lots of cows means lots of bush flies.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag.',
      'Land near a cow’s face and hold or tap Sip to fill up on protein.',
      'Then find a fresh cow pat and hold or tap Lay to lay your eggs.',
      'Old pats dry out, and dung beetles bury them. Be quick!',
    ],
    discoveries: [
      { key: 'd_roo', sprite: 'kangaroo', fx: 0.85, fy: 0.75 },
      { key: 'd_rooPoo', sprite: 'rooPoo', fx: 0.7, fy: 0.88 },
      { key: 'd_magpie', sprite: 'magpie', fx: 0.4, fy: 0.15 },
    ],
    factText: {
      start: 'Bush flies buzz round faces because they want the moisture in sweat, tears and spit.',
      sip: 'A female bush fly needs protein to make her eggs. She gets it from the runny eyes and noses of animals like cows.',
      mouth: 'Flies can’t bite or chew. A fly soaks up liquid with a mouth like a tiny sponge.',
      feet: 'Flies taste with their feet!',
      stripes: 'Bush flies have two dark stripes on their back. House flies have four.',
      poo: 'Plop! A cow can drop more than 10 cow pats a day.',
      lay: 'Bush flies lay their eggs in fresh dung. The eggs hatch into maggots that eat the dung.',
      maggots: 'The eggs have hatched! Maggots have no legs. They wriggle through the dung, eating as they go.',
      dry: 'Dried-out dung is no good for maggots. Bush flies need fresh, moist dung.',
      dungBeetle: 'Dung beetles bury cow pats to feed their young. CSIRO brought dung beetles to Australia from overseas so fewer bush flies would breed.',
      wagtail: 'Willie wagtails snap up flies and other insects, in the air and on the ground.',
      d_roo: 'A western grey kangaroo. Kangaroos often come into paddocks to graze at dawn and dusk.',
      d_rooPoo: 'Kangaroo poo: small, dry pellets. Australia’s native dung beetles mostly suit this kind of dung, not big cow pats.',
      d_magpie: 'An Australian magpie. Magpies walk through paddocks hunting for grubs and beetles.',
      win: 'Maggots turn into pupae in the soil, and new flies come out. In hot weather it takes about one to two weeks.',
    },

    setup(g) {
      g.pats = [];
      for (let i = 0; i < 4; i++) {
        // The first cow grazes near the start so there is something to do straight away.
        const c = i === 0 ? Game.spawnPoint(200, g.home, 380) : Game.spawnPoint(250);
        g.items.push({ sprite: 'cow', kind: 'cow', x: c.x, y: c.y, r: 40, scale: 1.1, angle: Math.random() * TAU,
          dir: Math.random() * TAU, wt: 3, pooT: 8 + Math.random() * 20 });
      }
      for (let i = 0; i < 5; i++) {
        const q = i === 0 ? Game.spawnPoint(160, g.home, 350) : Game.spawnPoint(200);
        this.addPat(q.x, q.y, i === 0 ? 1 : 0.4 + Math.random() * 0.6);
      }
      g.beetleT = 18;
      const p = g.player;
      p.protein = 0; p.layT = 0;
      Game.addPred({ sprite: 'wagtail', name: 'willie wagtail', r: 20, scale: 1.1, wanderSpeed: 70, chaseSpeed: 150, sight: 170,
        chaseTime: 2.5, restTime: 3.5 });
    },
    addPat(x, y, fresh) {
      Game.g.pats.push({ sprite: 'pat', x, y, r: 22, fresh, size: 1, eggs: 0, maggots: 0, angle: Math.random() * TAU });
    },
    head(cow) { return { x: cow.x + Math.cos(cow.angle) * 64, y: cow.y + Math.sin(cow.angle) * 64 }; },
    update(g, dt, input) {
      const p = g.player;
      p.sip = false; p.landed = false;

      // Cows graze slowly and drop pats now and then.
      for (const c of g.items) {
        if (c.kind !== 'cow') continue;
        c.wt -= dt;
        if (c.wt <= 0) { c.dir += (Math.random() - 0.5) * 1.6; c.wt = 3 + Math.random() * 4; }
        c.x = clamp(c.x + Math.cos(c.dir) * 10 * dt, 80, World.w - 80);
        c.y = clamp(c.y + Math.sin(c.dir) * 10 * dt, 80, World.h - 80);
        c.angle += Math.atan2(Math.sin(c.dir - c.angle), Math.cos(c.dir - c.angle)) * dt;
        c.pooT -= dt;
        if (c.pooT <= 0) {
          c.pooT = 20 + Math.random() * 15;
          this.addPat(c.x - Math.cos(c.angle) * 70, c.y - Math.sin(c.angle) * 70, 1);
          if (dist(c, p) < 500) { Sound.play('tap'); Game.pop(c.x - Math.cos(c.angle) * 70, c.y - Math.sin(c.angle) * 70 - 20, 'Plop!', '#fff'); Game.fact('poo'); }
        }
      }

      // Pats dry out; eggs hatch into maggots; dung beetles arrive and bury them.
      for (const pt of g.pats) {
        pt.t = g.t;
        pt.fresh = Math.max(0, pt.fresh - dt / 120);
        if (pt.eggs && pt.hatchT !== undefined) {
          pt.hatchT -= dt;
          if (pt.hatchT <= 0 && pt.maggots < pt.eggs) { pt.maggots = pt.eggs; if (dist(pt, p) < 600) Game.fact('maggots'); }
        }
        if (pt.beetle && pt.beetle.arrived) {
          pt.size -= dt / 16;
          if (pt.size <= 0.15) { pt.gone = true; pt.beetle.gone = true; }
        }
      }
      g.beetleT -= dt;
      if (g.beetleT <= 0) {
        g.beetleT = 15 + Math.random() * 10;
        const free = g.pats.filter(pt => !pt.beetle && pt.fresh < 0.8);
        if (free.length) {
          const pt = free[Math.floor(Math.random() * free.length)];
          const s = Game.spawnPoint(100, pt, 250);
          pt.beetle = { sprite: 'dungBeetle', kind: 'beetle', x: s.x, y: s.y, r: 10, scale: 1.5, target: pt, angle: 0 };
          g.items.push(pt.beetle);
        }
      }
      for (const b of g.items) {
        if (b.kind !== 'beetle') continue;
        const d = dist(b, b.target);
        b.moving = !b.arrived;
        if (!b.arrived) {
          b.angle = Math.atan2(b.target.y - b.y, b.target.x - b.x);
          b.x += Math.cos(b.angle) * 35 * dt;
          b.y += Math.sin(b.angle) * 35 * dt;
          if (d < 14) b.arrived = true;
        }
        if (dist(b, p) < 250) Game.fact('dungBeetle');
      }
      g.items = g.items.filter(i => !i.gone);
      g.pats = g.pats.filter(pt => !pt.gone);
      if (g.pats.length < 3) { const q = Game.spawnPoint(200); this.addPat(q.x, q.y, 1); }

      // Sip at a cow's face, lay on a fresh pat.
      if (p.waitRelease && !input.held) p.waitRelease = false;
      const quiet = p.waitRelease;   // no nagging while still holding from the last sip or lay
      const cow = g.items.find(c => c.kind === 'cow' && dist(this.head(c), p) < 45);
      const pat = g.pats.find(pt => dist(pt, p) < 30 * pt.size + 6);
      // Once full of protein, make sure there's a fresh pat not too far away.
      if (p.protein >= 1 && !g.pats.some(pt => pt.fresh > 0.5 && dist(pt, p) < 700)) {
        const c = nearest(g.items.filter(i => i.kind === 'cow'), p, 99999);
        if (c && c.pooT > 1) c.pooT = 1;
      }
      if (pat && !(cow && p.protein < 1)) {
        const ok = pat.fresh > 0.35 && p.protein >= 1;
        setAction('Lay', ok);
        if (pat !== p.layOn) { p.layOn = pat; p.layT = 0; }
        if (working(input)) {
          if (pat.fresh <= 0.35) { if (!quiet) Game.hint('This pat has dried out. Find a fresh, shiny one!'); Game.fact('dry'); }
          else if (p.protein < 1) { if (p.stillT > 1.5 && !quiet) Game.hint('You need protein first. Sip from a cow’s face.'); }
          else {
            p.landed = true;
            p.x = pat.x; p.y = pat.y;
            p.layT += work(input, dt);
            if (p.layT >= 1) {
              p.layT = 0; p.protein = 0; p.waitRelease = true;
              pat.eggs++; pat.hatchT = 6;
              g.score++;
              Sound.play('score');
              Game.pop(pat.x, pat.y - 24, 'Eggs!', '#fff');
              Game.fact('lay');
            }
          }
        }
        if (ok) p.progress = Math.min(1, p.layT);
      } else if (cow) {
        setAction('Sip', p.protein < 1);
        if (working(input) && p.protein < 1) {
          // Hang on to the cow's face while it moves.
          const h = this.head(cow);
          p.x = h.x; p.y = h.y;
          p.sip = true; p.landed = true;
          p.angle = cow.angle + Math.PI;
          p.protein = Math.min(1, p.protein + work(input, dt) / 1.2);
          p.progress = p.protein;
          if (Math.floor(g.t * 6) !== Math.floor((g.t - dt) * 6)) Sound.play('buzz');
          Game.fact('sip');
          if (p.protein >= 1) {
            p.waitRelease = true;
            Sound.play('pick');
            Game.fact('mouth');
            g.toasts.unshift({ text: 'Full of protein! Now follow the arrow to a fresh, shiny cow pat and hold Lay.', kind: 'hint' });
            g.toastT = 0;
          }
        }
      } else setAction(p.protein >= 1 ? 'Lay' : 'Sip', false);
      if (g.score === 2) Game.fact('feet');
      if (g.score === 3) Game.fact('stripes');
    },
    drawBuild(ctx, g) {
      for (const pt of g.pats) Game.drawSprite('pat', pt, 1.4);
    },
    playerSprite() { return 'bushFly'; },
    goalPoint(g) {
      const p = g.player;
      if (p.protein < 1) {
        const c = nearest(g.items.filter(i => i.kind === 'cow'), p, 99999);
        return c ? this.head(c) : null;
      }
      return nearest(g.pats.filter(pt => pt.fresh > 0.35), p, 99999);
    },
    hud(g) {
      const k = Math.round(g.player.protein * 5);
      setHud('Eggs laid: ' + Math.min(g.score, this.goal) + ' / ' + this.goal, 'Protein ' + '■'.repeat(k) + '□'.repeat(5 - k));
    },
    won(g) { return g.score >= this.goal; },
  },

  // ------------------------------------------------- Painted lady: caterpillar
  caterpillar: {
    id: 'caterpillar', bug: 'butterfly', stage: 'Caterpillar', place: 'Wildflower heath, Bold Park', world: BIG,
    sprite: 'plCaterpillar', bg: 'heath', escape: 'Crawl',
    action: 'Munch', radius: 16, speed: 75, scale: 2.2, goal: 12,
    home: { x: 240, y: 960, r: 44, label: 'Silk shelter' },
    facts: [
      'The Australian painted lady is a butterfly found all over Australia, including Perth.',
      'It starts life as a tiny green egg laid on a leaf. Out hatches a caterpillar.',
      'Caterpillars are insects too: look for 6 real legs at the front.',
    ],
    how: [
      'Crawl with the arrow keys, or touch and drag.',
      'Find pink everlastings or yellow capeweed and hold or tap Munch to eat the leaves.',
      'You’ll moult (shed your skin) as you grow. Eat 12 times.',
      'Then press Pupate on any plant to turn into a chrysalis.',
    ],
    discoveries: [
      { key: 'd_paw', sprite: 'paw', fx: 0.7, fy: 0.25 },
      { key: 'd_bobtail', sprite: 'bobtail', fx: 0.45, fy: 0.7 },
    ],
    factText: {
      start: 'Caterpillars are eating machines. They grow hundreds of times heavier before they become butterflies.',
      host: 'Painted lady caterpillars only eat daisy-family plants, like everlastings and capeweed.',
      capeweed: 'Capeweed is a weed from South Africa, and one of the painted lady caterpillar’s favourite foods.',
      shelter: 'The caterpillar ties leaves together with silk to make a shelter to hide in.',
      moult: 'A caterpillar’s skin can’t stretch, so it moults: it splits the old skin and wriggles out in a bigger one.',
      paperWasp: 'Paper wasps hunt caterpillars to feed to their young.',
      pupate: 'The caterpillar hangs from a stem and its skin splits to show the chrysalis. Inside, its body is rebuilt into a butterfly.',
      d_paw: 'A red and green kangaroo paw, the floral emblem of Western Australia.',
      d_bobtail: 'A bobtail lizard, sunning itself. Bobtails eat flowers, snails and insects.',
      win: 'After a week or two the chrysalis splits, and a painted lady butterfly crawls out.',
    },

    setup(g) {
      for (let i = 0; i < 18; i++) {
        const near = i < 8 ? Game.spawnPoint(120, g.home, 500) : Game.spawnPoint(150);
        const kind = i % 6 === 5 ? 'grevillea' : i % 2 ? 'capeweed' : 'everlasting';
        g.items.push({ sprite: kind, kind, x: near.x, y: near.y, r: 26, scale: 1.4, leaf: 1, angle: Math.random() * TAU });
      }
      const p = g.player;
      p.size = 1; p.munchT = 0;
      Game.addPred({ sprite: 'paperWasp', name: 'paper wasp', r: 18, wanderSpeed: 60, chaseSpeed: 95, sight: 150,
        chaseTime: 3, restTime: 3.5 });
      Game.later(6, () => Game.fact('shelter'));
    },
    locked(g) { return g.moultT > 0 || g.pupating > 0 || g.pupated; },
    update(g, dt, input) {
      const p = g.player;
      p.munch = false;
      for (const pl of g.items) if (pl.leaf < 1) { pl.regrow = (pl.regrow || 0) + dt; if (pl.regrow > 20) { pl.leaf = 1; pl.regrow = 0; pl.toldEmpty = false; } }
      if (g.moultT > 0) { g.moultT -= dt; return; }
      if (g.pupating > 0) {
        g.pupating -= dt;
        if (g.pupating <= 0) { g.pupated = true; g.frozen = false; Sound.play('win'); Game.fact('pupate'); }
        return;
      }
      if (g.pupated) return;

      if (g.score >= this.goal) {
        // Caterpillars wander off to pupate on a stem: any plant will do.
        const stem = g.items.some(i => dist(i, p) < 34) || Game.inHome();
        setAction('Pupate', stem);
        if (stem && working(input)) {
          g.pupating = 1.5; g.frozen = true;
          p.angle = -Math.PI / 2;
        }
        return;
      }

      const under = g.items.filter(i => dist(i, p) < 30);
      const pl = under.find(i => i.kind !== 'grevillea' && i.leaf > 0.05) || under[0];
      const host = pl && pl.kind !== 'grevillea';
      setAction('Munch', host && pl.leaf > 0.05);
      if (pl !== p.munchOn) { p.munchOn = pl; p.munchT = 0; }
      if (pl && working(input)) {
        if (!host) { Game.hint('Not this one! Painted lady caterpillars only eat daisy plants.'); Game.fact('host'); }
        else if (pl.leaf <= 0.05) { if (!pl.toldEmpty) { pl.toldEmpty = true; Game.hint('All eaten! Find another plant.'); } }
        else {
          p.munch = true;
          const w = work(input, dt);
          p.munchT += w;
          pl.leaf = Math.max(0, pl.leaf - w / 3);
          if (Math.floor(g.t * 5) !== Math.floor((g.t - dt) * 5)) Sound.play('tap');
          Game.fact(pl.kind === 'capeweed' ? 'capeweed' : 'host');
          if (p.munchT >= 1) {
            p.munchT = 0;
            g.score++;
            Game.pop(p.x, p.y - 20, 'Yum!', '#7fc24a');
            if (g.score === 3 || g.score === 6) {
              g.moultT = 1.5;
              Sound.play('score');
              Game.pop(p.x, p.y - 34, 'Moult!', '#ffd23f');
              Game.fact('moult');
            }
            if (g.score === this.goal) g.toasts.push({ text: 'You’re fully grown! Find a plant stem and press Pupate.', kind: 'hint' });
          }
        }
      }
      if (host && pl.leaf > 0.05) p.progress = Math.min(1, p.munchT);
      p.size = 1 + g.score * 0.07;
      p.r = 16 * p.size;
      p.speed = 75 + g.score * 3;
    },
    drawExtra(ctx, g) {
      if (g.moultT > 0) {
        ctx.globalAlpha = Math.min(1, g.moultT);
        ctx.save(); ctx.translate(g.player.x - 30, g.player.y + 4);
        Sprites.plCaterpillar(ctx, { size: g.player.size * 0.9 }, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    },
    playerSprite(g) { return g.pupated || g.pupating > 0 ? 'chrysalis' : 'plCaterpillar'; },
    goalPoint(g) { return g.score >= this.goal && !g.pupated ? nearest(g.items, g.player, 99999) : null; },
    hud(g) {
      if (g.pupated) setHud('You’re a chrysalis!', '');
      else if (g.score >= this.goal) setHud('Find a stem and pupate!', '');
      else setHud('Munches: ' + g.score + ' / ' + this.goal, g.score >= 6 ? 'Big!' : g.score >= 3 ? 'Growing' : 'Tiny');
    },
    won(g) { return !!g.pupated; },
  },

  // ------------------------------------------------- Painted lady: butterfly
  butterfly: {
    id: 'butterfly', bug: 'butterfly', stage: 'Butterfly', place: 'Wildflower heath, Bold Park', world: BIG,
    sprite: 'butterfly', bg: 'heath',
    action: 'Sip', radius: 18, speed: 190, scale: 2, goal: 8,
    home: { x: 240, y: 960, r: 44, label: 'Empty chrysalis' },
    facts: [
      'A painted lady butterfly is orange, black and white, with little blue spots on its back wings.',
      'Butterflies have 4 wings covered in tiny coloured scales, like dust.',
      'Adult butterflies don’t eat leaves. They drink nectar.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag.',
      'Land on a flower and hold Sip to drink nectar.',
      'Then land on an everlasting or capeweed and hold Lay to lay an egg.',
      'Lay 8 eggs. Look for sparkles: they’re discoveries.',
    ],
    discoveries: [
      { key: 'd_cone', sprite: 'cone', fx: 0.8, fy: 0.2 },
      { key: 'd_magpie', sprite: 'magpie', fx: 0.3, fy: 0.3 },
    ],
    factText: {
      start: 'A new butterfly pumps blood into its crumpled wings to stretch them out, then waits for them to dry.',
      sip: 'Butterflies drink nectar through a long tongue that curls up like a spring when it’s not being used.',
      feet: 'A female painted lady tastes leaves with her feet to check she has found the right plant for her caterpillars.',
      lay: 'She lays one tiny green egg on each leaf, so her caterpillars won’t run out of food.',
      grevillea: 'Grevilleas are full of nectar, but painted lady caterpillars can’t eat their leaves.',
      travel: 'Painted ladies can fly long distances, sometimes in big swarms.',
      wagtail: 'Willie wagtails snap up butterflies and other insects, in the air and on the ground.',
      d_cone: 'A banksia cone. Bold Park’s bushland is full of banksias.',
      d_magpie: 'An Australian magpie, hunting for grubs in the grass.',
      win: 'Each egg will hatch into a caterpillar, and the life cycle starts all over again.',
    },

    setup(g) {
      for (let i = 0; i < 20; i++) {
        const pt = Game.spawnPoint(150);
        const kind = i % 4 === 3 ? 'grevillea' : i % 2 ? 'capeweed' : 'everlasting';
        g.items.push({ sprite: kind, kind, x: pt.x, y: pt.y, r: 26, scale: 1.4, leaf: 1, nectar: kind !== 'capeweed', angle: Math.random() * TAU });
      }
      const p = g.player;
      p.energy = 0; p.layT = 0;
      Game.addPred({ sprite: 'wagtail', name: 'willie wagtail', r: 20, scale: 1.1, wanderSpeed: 70, chaseSpeed: 150, sight: 170,
        chaseTime: 2.5, restTime: 3.5 });
    },
    update(g, dt, input) {
      const p = g.player;
      p.sip = false; p.landed = false;
      for (const f of g.items) if (f.nectar === false && f.kind !== 'capeweed') { f.regrow = (f.regrow || 0) + dt; if (f.regrow > 14) { f.nectar = true; f.regrow = 0; } }
      // After a sip or a lay, no hints until the button is let go (holding through is fine, nagging isn't).
      if (p.waitRelease && !input.held) p.waitRelease = false;
      const quiet = p.waitRelease;
      const under = g.items.filter(i => i.sprite !== 'egg' && dist(i, p) < 30);
      const f = under.find(i => p.energy >= 1 ? i.kind !== 'grevillea' : i.nectar) || under[0];
      if (!f) { setAction(p.energy >= 1 ? 'Lay' : 'Sip', false); p.layT = 0; return; }
      if (f !== p.layOn) { p.layOn = f; p.layT = 0; }
      const host = f.kind !== 'grevillea';
      if (p.energy >= 1) {
        setAction('Lay', host);
        if (host) p.progress = Math.min(1, p.layT / 0.8);
        if (working(input)) {
          if (!host) { if (!quiet) Game.hint('Taste with your feet: this isn’t a daisy plant. Try an everlasting or capeweed.'); Game.fact('grevillea'); }
          else {
            p.landed = true;
            Game.fact('feet');
            p.layT += work(input, dt);
            if (p.layT >= 0.8) {
              p.layT = 0; p.energy = 0; p.waitRelease = true;
              g.score++;
              g.items.push({ sprite: 'egg', kind: 'egg', x: f.x + (Math.random() - 0.5) * 24, y: f.y + (Math.random() - 0.5) * 24, r: 2, scale: 1.4 });
              Sound.play('score');
              Game.pop(f.x, f.y - 24, 'Egg!', '#fff');
              Game.fact('lay');
              if (g.score === 3) Game.fact('travel');
            }
          }
        }
      } else {
        setAction('Sip', !!f.nectar);
        if (f.nectar) p.progress = p.energy;
        if (working(input)) {
          if (!f.nectar) { if (p.stillT > 1.5 && !quiet) Game.hint(f.kind === 'capeweed' ? 'Capeweed is for your eggs. Find a pink everlasting or a red grevillea to drink from.' : 'This flower is empty. Try another.'); }
          else {
            p.sip = true; p.landed = true;
            p.energy = Math.min(1, p.energy + work(input, dt) / 1.2);
            Game.fact('sip');
            if (p.energy >= 1) {
              f.nectar = false;
              p.waitRelease = true;
              Sound.play('pick');
              g.toasts.unshift({ text: 'Full of nectar! Now land on an everlasting or capeweed and hold Lay.', kind: 'hint' });
              g.toastT = 0;
            }
          }
        }
      }
    },
    goalPoint(g) {
      const p = g.player;
      const want = p.energy >= 1 ? g.items.filter(i => i.kind === 'everlasting' || i.kind === 'capeweed') : g.items.filter(i => i.nectar);
      return nearest(want, p, 99999);
    },
    hud(g) {
      const k = Math.round(g.player.energy * 5);
      setHud('Eggs laid: ' + Math.min(g.score, this.goal) + ' / ' + this.goal, 'Nectar ' + '■'.repeat(k) + '□'.repeat(5 - k));
    },
    won(g) { return g.score >= this.goal; },
  },

  // ---------------------------------------------------------------- Termite
  termite: {
    id: 'termite', bug: 'termite', stage: 'Worker', place: 'Woodland, Whiteman Park', world: BIG,
    sprite: 'termiteWorker', bg: 'woodland', escape: 'Crawl',
    action: 'Chew', radius: 15, speed: 120, scale: 2.2, goal: 8,
    home: { x: 300, y: 900, r: 60, label: 'Mound' },
    facts: [
      'Termites are not ants. Their closest relatives are cockroaches!',
      'Termites live in huge families called colonies, with a king, a queen, workers and soldiers.',
      'Termites are insects: 6 legs and 3 body parts.',
    ],
    how: [
      'Crawl with the arrow keys, or touch and drag.',
      'Hold or tap Chew on wood to bite off a piece, or Dig on damp mud to scoop some up.',
      'Carry it home. Wood feeds the colony; mud builds the mound.',
      'Bring 4 of each. Watch out for raiding bull ants!',
    ],
    discoveries: [
      { key: 'd_roo', sprite: 'kangaroo', fx: 0.75, fy: 0.3 },
      { key: 'd_echidna', sprite: 'dig', fx: 0.55, fy: 0.85 },
      { key: 'd_cockatoo', sprite: 'feather', band: '#c8303a', fx: 0.9, fy: 0.75 },
    ],
    factText: {
      start: 'Termite workers are blind. They find their way by smell and by feeling vibrations.',
      wood: 'Termites eat wood. Tiny living things in their gut help break it down.',
      recycle: 'By eating dead wood, termites turn it back into soil. That helps the bush grow.',
      mud: 'Termites build with soil, chewed wood, spit and poo, all mixed together.',
      soldier: 'Termite soldiers have big heads. Some squirt a sticky white liquid at attackers.',
      queen: 'A termite queen can lay hundreds of eggs a day.',
      ant: 'Bull ants and other ants raid termite nests for food.',
      d_roo: 'A western grey kangaroo. Kangaroos live in the bush at Whiteman Park.',
      d_echidna: 'Echidna diggings! Echidnas tear open termite mounds with strong claws and lick termites up.',
      d_cockatoo: 'A red-tailed black cockatoo feather. These cockatoos eat marri and jarrah seeds.',
      win: 'When the colony is big enough, winged termites fly out after rain to start new nests.',
    },

    setup(g) {
      g.wood = 0; g.mud = 0;
      for (let i = 0; i < 8; i++) this.addThing('woodChip');
      for (let i = 0; i < 6; i++) this.addThing('mud');
      g.player.workT = 0;
      Game.addPred({ sprite: 'ant', name: 'bull ant', ground: true, r: 16, scale: 1.4, wanderSpeed: 50, chaseSpeed: 85, sight: 150,
        chaseTime: 3, restTime: 3.5 });
    },
    addThing(kind) {
      const p = Game.g.items.length < 6 ? Game.spawnPoint(150, Game.g.home, 600) : nearPlayer(150);
      Game.g.items.push({ sprite: kind, kind, x: p.x, y: p.y, r: 16, scale: 1.7, angle: Math.random() * TAU });
    },
    onCaught(g) { g.player.carry = null; },
    update(g, dt, input) {
      const p = g.player;
      if (p.carry) {
        setAction(p.carry === 'mud' ? 'Dig' : 'Chew', false);
        if (Game.inHome()) {
          if (p.carry === 'mud') { g.mud++; Game.fact('mud'); if (g.mud === 3) Game.fact('soldier'); }
          else { g.wood++; Game.fact('wood'); if (g.wood === 2) Game.fact('recycle'); if (g.wood === 4) Game.fact('queen'); }
          g.score = Math.min(g.wood, 4) + Math.min(g.mud, 4);
          p.carry = null;
          Sound.play('score');
          Game.pop(p.x, p.y - 20, '+1', '#fff');
        }
        p.speed = 105;
        return;
      }
      p.speed = 120;
      const it = g.items.find(i => dist(i, p) < 26);
      const verb = it && it.kind === 'mud' ? 'Dig' : 'Chew';
      setAction(verb, !!it);
      if (it !== p.workOn) { p.workOn = it; p.workT = 0; }
      if (it) p.progress = Math.min(1, p.workT / 0.8);
      if (it && working(input)) {
        p.workT += work(input, dt);
        if (Math.floor(g.t * 5) !== Math.floor((g.t - dt) * 5)) Sound.play('tap');
        if (p.workT >= 0.8) {
          p.workT = 0;
          p.carry = it.kind === 'mud' ? 'mud' : 'wood';
          g.items.splice(g.items.indexOf(it), 1);
          Sound.play('pick');
          Game.later(3, () => this.addThing(it.kind));
        }
      }
      if (g.mud >= 4 && g.wood < 4 && !g.toldMud) { g.toldMud = true; g.toasts.push({ text: 'The mound is built! Now bring wood to feed the colony.', kind: 'hint' }); }
      if (g.wood >= 4 && g.mud < 4 && !g.toldWood) { g.toldWood = true; g.toasts.push({ text: 'Plenty of food! Now bring mud to build the mound.', kind: 'hint' }); }
    },
    // The mound grows with mud; a wood store builds up beside it.
    drawBuild(ctx, g) {
      const h = g.home, n = Math.min(g.mud, 8);
      for (let i = 0; i <= n; i++) ell(ctx, h.x, h.y - i * 4, h.r * (0.9 - i * 0.07) + 6, h.r * (0.75 - i * 0.06) + 4, i % 2 ? '#8a6438' : '#9a7448');
      for (let i = 0; i < Math.min(n, 5); i++) ell(ctx, h.x - 16 + i * 8, h.y - n * 4 - 8 - (i % 2) * 6, 5, 9, '#7a5430');
      for (let i = 0; i < Math.min(g.wood, 8); i++) { ctx.fillStyle = '#a07848'; ctx.fillRect(h.x + h.r + 4 + (i % 3) * 10, h.y + 10 - Math.floor(i / 3) * 6, 9, 4); }
    },
    goalPoint(g) {
      if (g.player.carry) return g.home;
      // Point at whatever is still needed.
      if (g.wood >= 4) return nearest(g.items.filter(i => i.kind === 'mud'), g.player, 99999);
      if (g.mud >= 4) return nearest(g.items.filter(i => i.kind === 'woodChip'), g.player, 99999);
      return null;
    },
    hud(g) {
      const w = Math.min(g.wood, 4), m = Math.min(g.mud, 4);
      setHud('Wood ' + w + '/4 · Mud ' + m + '/4', g.player.carry ? 'Carrying ' + g.player.carry : '');
    },
    won(g) { return g.wood >= 4 && g.mud >= 4; },
  },

  // ---------------------------------------------------------------- Native land snail
  snail: {
    id: 'snail', bug: 'snail', stage: 'Adult', place: 'Bushland near Bibra Lake', world: BIG,
    sprite: 'snail', bg: 'litter', escape: 'Slide',
    action: 'Graze', radius: 16, speed: 55, scale: 1.6, goal: 10,
    home: { x: 260, y: 940, r: 55, label: 'Damp hollow' },
    facts: [
      'Snails are not insects. They are molluscs, like octopuses and mussels.',
      'WA has its own native land snails, called Bothriembryon. Most live in the south-west.',
      'A snail’s eyes are on the tips of its long tentacles.',
    ],
    how: [
      'Slide with the arrow keys, or touch and drag.',
      'Hold or tap Graze on fungi, lichen or dead leaves to eat them. Eat 10 to grow your shell.',
      'Sunny patches dry you out. Keep to the shade, or hold Seal to close your shell.',
      'Watch out for the bobtail lizard.',
    ],
    discoveries: [
      { key: 'd_frog', sprite: 'frog', fx: 0.85, fy: 0.15 },
      { key: 'd_shell', sprite: 'shell', fx: 0.4, fy: 0.3 },
      { key: 'd_quenda', sprite: 'dig', fx: 0.7, fy: 0.75 },
    ],
    factText: {
      start: 'A snail glides on one big foot, on a layer of slime. Look at your shiny trail!',
      graze: 'A snail’s tongue is covered in thousands of tiny teeth for scraping up food.',
      food: 'These snails graze on fungi, lichen and rotting leaves.',
      shell: 'A snail grows its shell by adding new shell around the opening.',
      dry: 'Snails dry out in the sun. In hot weather they seal their shell with a door of dried slime and wait for rain.',
      bobtail: 'Bobtail lizards crunch up snails, shell and all.',
      d_frog: 'A motorbike frog, near the lake. Its call sounds like a motorbike changing gears.',
      d_shell: 'An empty garden snail shell. Garden snails were brought here from Europe, unlike native Bothriembryon.',
      d_quenda: 'A quenda dig. Quendas are bandicoots that live in the bush around Bibra Lake.',
      win: 'Most land snails are male and female at the same time.',
    },

    setup(g) {
      const kinds = ['fungus', 'lichen', 'deadLeaf'];
      for (let i = 0; i < 16; i++) {
        const pt = i < 6 ? Game.spawnPoint(120, g.home, 500) : Game.spawnPoint(150);
        g.items.push({ sprite: kinds[i % 3], kind: kinds[i % 3], x: pt.x, y: pt.y, r: 18, scale: 1.4, amount: 1, angle: Math.random() * TAU });
      }
      g.sun = [];
      for (let i = 0; i < 7; i++) { const pt = Game.spawnPoint(260); g.sun.push({ x: pt.x, y: pt.y, r: 110 + Math.random() * 80 }); }
      g.trail = [];
      const p = g.player;
      p.size = 1; p.moist = 1; p.grazeT = 0; p.sealed = false;
      Game.addPred({ sprite: 'bobtail', name: 'bobtail lizard', ground: true, r: 24, scale: 2, wanderSpeed: 25, chaseSpeed: 45, sight: 140,
        chaseTime: 4, restTime: 4 });
    },
    locked(g) { return g.player.sealed; },
    update(g, dt, input) {
      const p = g.player;
      for (const it of g.items) if (it.amount < 1) { it.regrow = (it.regrow || 0) + dt; if (it.regrow > 25) { it.amount = 1; it.regrow = 0; } }
      if (p.moving && (!g.lastTrail || dist(g.lastTrail, p) > 10)) { g.lastTrail = { x: p.x, y: p.y, t: g.t }; g.trail.push(g.lastTrail); }
      g.trail = g.trail.filter(q => g.t - q.t < 12);

      const inSun = g.sun.some(s => dist(s, p) < s.r);
      const food = g.items.find(i => i.amount > 0.05 && dist(i, p) < 32);
      p.sealed = false;
      if (food) {
        setAction('Graze', true);
        p.progress = 1 - food.amount;
        if (working(input)) {
          // Each piece of food takes 1.5 s to finish; finishing it counts.
          food.amount = Math.max(0, food.amount - work(input, dt) / 1.5);
          Game.fact('graze');
          if (food.amount <= 0.05) {
            food.amount = 0;
            g.score++;
            Sound.play('score');
            Game.pop(p.x, p.y - 22, 'Munch!', '#c0cc9a');
            Game.fact(g.score === 2 ? 'shell' : 'food');
          }
        }
      } else {
        setAction('Seal', inSun);
        if (input.held) { p.sealed = true; if (inSun) Game.fact('dry'); }
        p.grazeT = 0;
      }

      if (Game.inHome()) p.moist = Math.min(1, p.moist + dt / 3);
      else if (inSun && !p.sealed) {
        p.moist = Math.max(0, p.moist - dt / 9);
        if (p.moist < 0.4) { Game.hint('You’re drying out! Get into the shade, or hold Seal.'); Game.fact('dry'); }
      } else p.moist = Math.min(1, p.moist + dt / 20);
      if (p.moist <= 0) {
        g.lives--;
        if (g.lives <= 0 && (this.gentle || g.done)) g.lives = 1;
        Sound.play('caught');
        g.toasts.unshift({ text: 'Too dry! You slide back to the damp hollow.', kind: 'hint' });
        g.toastT = 0;
        p.x = g.home.x; p.y = g.home.y; p.moist = 0.6; p.invuln = 3;
        if (g.lives <= 0) Game.finish(false);
      }
      p.size = 1 + Math.min(g.score, 12) * 0.06;
      p.r = 14 * p.size;
      p.speed = p.moist < 0.3 ? 40 : 65;
    },
    drawBuild(ctx, g) {
      for (const s of g.sun) {
        const gr = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, s.r);
        gr.addColorStop(0, 'rgba(255,240,170,.55)');
        gr.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
      }
      for (let i = 1; i < g.trail.length; i++) {
        const a = g.trail[i - 1], b = g.trail[i];
        if (dist(a, b) > 40) continue;
        line(ctx, [a.x, a.y, b.x, b.y], 'rgba(230,240,255,' + (0.5 * (1 - (g.t - b.t) / 12)) + ')', 6);
      }
    },
    goalPoint() { return null; },
    hud(g) {
      const k = Math.round(g.player.moist * 5);
      setHud('Food: ' + Math.min(g.score, this.goal) + ' / ' + this.goal, 'Damp ' + '■'.repeat(k) + '□'.repeat(5 - k));
    },
    won(g) { return g.score >= this.goal; },
  },

  // ------------------------------------------------- Peacock spider: spiderling
  spiderling: {
    id: 'spiderling', bug: 'spider', stage: 'Spiderling', place: 'Coastal dunes, Cottesloe', world: BIG,
    sprite: 'spiderling', bg: 'spider',
    action: 'Jump', radius: 12, speed: 95, scale: 1.5, goal: 8,
    home: { x: 260, y: 1000, r: 40, label: 'Mum’s retreat' },
    facts: [
      'Peacock spiders hatch from eggs in a silk sac. The mother guards the eggs in her silk retreat.',
      'Baby spiders are called spiderlings. They are tiny, but they can already hunt.',
      'Spiders are not insects. They have 8 legs and 2 body parts.',
    ],
    how: [
      'Move with the arrow keys, or touch and drag. Explore the dunes!',
      'Springtails hop away if you rush at them. Stop close by, then press Jump.',
      'Catch 8, then go back to the retreat to moult (shed your skin).',
      'Look for sparkles: they’re discoveries.',
    ],
    discoveries: [
      { key: 'd_seashell', sprite: 'seashell', fx: 0.2, fy: 0.3 },
      { key: 'd_bobtail', sprite: 'bobtail', fx: 0.75, fy: 0.55 },
    ],
    factText: {
      start: 'Spiderlings stay near their mother’s retreat at first, then go off to hunt on their own.',
      springtail: 'Springtails are not insects. A spring folded under the body flicks them into the air to escape.',
      silk: 'Even tiny spiderlings stick down a silk safety line before they jump.',
      smallAnt: 'Ants attack small spiders. Many spiderlings get eaten before they grow up.',
      moult: 'Spiders have a hard outer skin. To grow, they moult: split the old skin and climb out of it.',
      d_seashell: 'A little shell, blown up into the dunes from the beach below.',
      d_bobtail: 'A bobtail lizard. Its fat tail looks like a second head, which confuses predators.',
      win: 'Young male peacock spiders are plain brown. Their bright colours only appear at the last moult.',
    },

    setup(g) {
      for (let i = 0; i < 10; i++) this.addSpringtail();
      g.player.jcd = 0;
      Game.addPred({ sprite: 'smallAnt', name: 'ant', ground: true, r: 14, scale: 1.4, wanderSpeed: 55, chaseSpeed: 80, sight: 130,
        chaseTime: 3, restTime: 3 });
    },
    addSpringtail() {
      const p = nearPlayer(150);
      Game.g.items.push({ sprite: 'springtail', kind: 'springtail', x: p.x, y: p.y, r: 9, state: 'sit',
        angle: Math.random() * TAU, scale: 1.8, hopT: 1 + Math.random() * 2 });
    },
    onCaught(g) { g.player.jump = null; g.player.hop = 0; },
    locked(g) { return !!g.player.jump || g.player.moult > 0; },
    update(g, dt, input) {
      const p = g.player;
      if (p.moult > 0) {
        p.moult -= dt;
        if (p.moult <= 0) { g.moulted = true; g.frozen = false; }
        return;
      }
      for (const s of g.items) {
        s.hop = Math.max(0, (s.hop || 0) - dt);
        s.hopT -= dt;
        const scared = !p.jump && p.moving && dist(s, p) < 65;
        if (s.hopT <= 0 || scared) {
          const a = scared ? Math.atan2(s.y - p.y, s.x - p.x) + (Math.random() - 0.5) : Math.random() * TAU;
          const d = scared ? 120 : 40;
          s.x = clamp(s.x + Math.cos(a) * d, 30, World.w - 30);
          s.y = clamp(s.y + Math.sin(a) * d, 30, World.h - 30);
          s.angle = a;
          s.hop = 0.3;
          s.hopT = 1.5 + Math.random() * 2.5;
          if (scared) Game.fact('springtail');
        }
      }
      if (g.score >= this.goal && !g.moulted) {
        setAction('Jump', false);
        if (Game.inHome()) {
          p.moult = 2.5;
          g.frozen = true;
          Sound.play('win');
          Game.fact('moult');
        }
        return;
      }
      const caught = spiderHunt(g, dt, input, g.items, 150);
      if (caught) {
        g.score++;
        Game.pop(caught.x, caught.y - 14, 'Got it!', '#ffd23f');
        Game.later(1.5, () => this.addSpringtail());
        if (g.score === this.goal) g.toasts.push({ text: 'You’ve grown too big for your skin! Go back to the retreat to moult.', kind: 'hint' });
      }
    },
    drawExtra(ctx, g) { drawSilk(ctx, g.player); },
    goalPoint(g) { return g.score >= this.goal && !g.moulted && !(g.player.moult > 0) ? g.home : null; },
    hud(g) { setHud(g.score >= this.goal && !g.moulted ? 'Back to the retreat!' : 'Springtails: ' + g.score + ' / ' + this.goal, ''); },
    won(g) { return !!g.moulted; },
  },

  // ----------------------------------------------------- Peacock spider: adult
  spider: {
    id: 'spider', bug: 'spider', stage: 'Adult male', place: 'Coastal dunes, Cottesloe', world: BIG,
    action: 'Jump', radius: 15, speed: 105, scale: 1.7, goal: 7,
    home: { x: 260, y: 1000, r: 40, label: 'Silk retreat' },
    facts: [
      'The coastal peacock spider lives in the sand dunes along Perth’s coast. It is about the size of a grain of rice.',
      'Jumping spiders have 8 eyes. The two big front eyes see sharp detail and colour.',
      'Only the males have the bright colours. Females are brown.',
    ],
    how: [
      'Move with the arrow keys, or touch and drag.',
      'Flies spot you if you walk too close. Stop a little way off, then press Jump.',
      'Catch 7 flies, then find the female and press Dance.',
      'Look for sparkles: they’re discoveries.',
    ],
    discoveries: [
      { key: 'd_gull', sprite: 'feather', color: '#d8d8d8', band: '#7a7a7a', fx: 0.15, fy: 0.6 },
      { key: 'd_snail', sprite: 'shell', color: '#f2efe4', fx: 0.65, fy: 0.25 },
    ],
    factText: {
      start: 'Jumping spiders don’t catch food in webs. They stalk it and pounce.',
      flee: 'Flies have excellent eyesight too. Creep up and stop, then jump!',
      silk: 'Before it jumps, a jumping spider sticks down a silk safety line, like a climber’s rope.',
      jump: 'Jumping spiders leap partly by pumping fluid into their legs, which snaps them straight.',
      dance: 'To win a female, the male raises a bright flap with orange fringes and waves his legs in a dance.',
      wasp: 'Spider wasps hunt spiders. They sting them so they can’t move, then lay an egg on them.',
      d_gull: 'A silver gull feather. Gulls eat almost anything they find along the beach.',
      d_snail: 'A white snail shell. These snails come from Europe. In summer they climb up plants to keep off the hot sand.',
      win: 'Almost all peacock spiders live only in Australia, and new kinds are still being discovered.',
    },

    setup(g) {
      for (let i = 0; i < 8; i++) this.addFly();
      g.player.jcd = 0;
      Game.addPred({ sprite: 'wasp', name: 'spider wasp', r: 18, wanderSpeed: 60, chaseSpeed: 112, sight: 150,
        chaseTime: 3, restTime: 3.5 });
    },
    addFly() {
      const p = nearPlayer(160);
      Game.g.items.push({ sprite: 'fly', kind: 'fly', x: p.x, y: p.y, r: 9, state: 'sit', angle: Math.random() * TAU, scale: 1.7 });
    },
    onCaught(g) { g.player.jump = null; g.player.hop = 0; },
    locked(g) { return !!g.player.jump || g.player.dance > 0; },
    update(g, dt, input) {
      const p = g.player;
      for (const f of g.items) {
        if (f.kind !== 'fly') continue;
        if (f.state === 'sit') {
          if (Math.random() < dt * 0.5) f.angle += (Math.random() - 0.5);
          if (!p.jump && p.moving && dist(f, p) < 75) {
            f.state = 'flee';
            f.dir = Math.atan2(f.y - p.y, f.x - p.x);
            f.angle = f.dir;
            f.fleeT = 1.2;
            Game.fact('flee');
          }
        } else {
          // Fly off a short way, then settle again.
          f.x = clamp(f.x + Math.cos(f.dir) * 260 * dt, 30, World.w - 30);
          f.y = clamp(f.y + Math.sin(f.dir) * 260 * dt, 30, World.h - 30);
          f.fleeT -= dt;
          if (f.fleeT <= 0) f.state = 'sit';
        }
      }

      if (g.score >= this.goal && !g.female) {
        const s = Game.spawnPoint(300, p, 700);
        g.female = { sprite: 'femaleSpider', kind: 'female', x: s.x, y: s.y, r: 14, angle: Math.random() * TAU, scale: 1.7 };
        g.items.push(g.female);
        g.toasts.push({ text: 'A female is nearby! Follow the arrow, walk to her and press Dance.', kind: 'hint' });
      }

      if (p.dance > 0) {
        p.dance -= dt;
        p.angle = Math.atan2(g.female.y - p.y, g.female.x - p.x);
        g.female.angle = p.angle + Math.PI;
        if (p.dance <= 0) { g.danced = true; g.frozen = false; }
        return;
      }

      const nearFemale = g.female && !g.danced && dist(p, g.female) < 60;
      if (nearFemale) {
        setAction('Dance', true);
        if (input.pressed) {
          p.dance = 4;
          g.frozen = true;
          g.female.heart = true;
          Sound.play('win');
          Game.fact('dance');
        }
        return;
      }

      const caught = spiderHunt(g, dt, input, g.items.filter(f => f.kind === 'fly'), 170);
      if (caught) {
        g.score++;
        Game.pop(caught.x, caught.y - 14, 'Got it!', '#ffd23f');
        Game.fact('jump');
        Game.later(2, () => this.addFly());
      }
    },
    drawExtra(ctx, g) { drawSilk(ctx, g.player); },
    goalPoint(g) { return g.female && !g.danced && !(g.player.dance > 0) ? g.female : null; },
    hud(g) {
      if (g.female && !g.danced) setHud('Find the female and dance!', '');
      else setHud('Flies: ' + g.score + (g.danced ? '' : ' / ' + this.goal), '');
    },
    won(g) { return !!g.danced; },
  },

  // ------------------------------------------------- Blue skimmer: nymph
  nymph: {
    id: 'nymph', bug: 'dragonfly', stage: 'Nymph', place: 'Underwater in Herdsman Lake', world: BIG,
    sprite: 'nymph', bg: 'nymph',
    action: 'Jet', radius: 15, speed: 85, scale: 1.6, goal: 8,
    home: { x: 220, y: 1000, r: 60, label: 'Weed bed' },
    reed: { x: 1760, y: 160, r: 50 },
    facts: [
      'A dragonfly starts life as a nymph living underwater.',
      'Nymphs are hunters. They hide, wait, and grab passing food.',
      'Nymphs have 6 legs and no wings yet. Their wings grow in pads on their back.',
    ],
    how: [
      'Swim with the arrow keys, or touch and drag. Explore the lake bed!',
      'When food is close the button says Grab. Press it to shoot out your jaw!',
      'Otherwise the button says Jet: a quick squirt of speed.',
      'Eat 8, then climb the reed to become a dragonfly.',
    ],
    discoveries: [
      { key: 'd_gilgie', sprite: 'gilgie', fx: 0.55, fy: 0.75 },
      { key: 'd_beetle', sprite: 'divingBeetle', fx: 0.35, fy: 0.25 },
      { key: 'd_snail', sprite: 'shell', color: '#5a5040', fx: 0.85, fy: 0.6 },
    ],
    factText: {
      start: 'A nymph’s lower lip is a hinged arm with hooks. It folds under the head and shoots out to grab food.',
      grab: 'The jaw-arm (called a labium) shoots out in a fraction of a second.',
      jet: 'Dragonfly nymphs breathe with gills inside their bottom. Squirting water out of it pushes them forward like a jet!',
      tadpole: 'Big dragonfly nymphs can catch tadpoles and even tiny fish.',
      wriggler: 'Mosquito larvae are called wrigglers. They hang under the water surface and breathe through a tube.',
      moult: 'A nymph sheds its skin many times as it grows bigger.',
      turtle: 'The oblong turtle lives only in south-west WA wetlands. It eats water bugs, tadpoles and fish.',
      climb: 'When it is ready, the nymph climbs out of the water up a reed stem. Its skin splits and the adult dragonfly pulls itself out.',
      d_gilgie: 'A gilgie! Gilgies are freshwater crayfish found only in south-west WA.',
      d_beetle: 'A diving beetle. It carries a bubble of air under its wing covers so it can breathe underwater.',
      d_snail: 'A freshwater snail. It scrapes slimy algae off plants and rocks.',
      win: 'The empty skin left on the reed is called an exuvia. Look for them on reeds around Perth lakes!',
    },

    setup(g) {
      this.reed.x = 1760; this.reed.y = 160;
      for (let i = 0; i < 8; i++) this.addPrey('wriggler');
      for (let i = 0; i < 3; i++) this.addPrey('tadpole');
      g.player.jet = 0; g.player.jetCd = 0; g.player.grab = null;
      Game.addPred({ sprite: 'turtle', name: 'oblong turtle', r: 26, wanderSpeed: 30, chaseSpeed: 66, sight: 150,
        chaseTime: 3, restTime: 3.5 });
    },
    addPrey(kind) {
      const p = nearPlayer(150);
      Game.g.items.push({ sprite: kind, kind, x: p.x, y: p.y, r: kind === 'tadpole' ? 12 : 9,
        speed: kind === 'tadpole' ? 45 : 20, scale: kind === 'tadpole' ? 1.4 : 1.6 });
    },
    locked(g) { return !!g.player.grab || g.emerging > 0; },
    update(g, dt, input) {
      const p = g.player;
      p.jet = Math.max(0, p.jet - dt);
      p.jetCd = Math.max(0, p.jetCd - dt);

      if (g.emerging > 0) {
        g.emerging -= dt;
        p.k = 1 - g.emerging / 3;
        if (g.emerging <= 0) { g.emerged = true; g.frozen = false; }
        return;
      }

      for (const it of g.items) wander(it, dt, it.speed);

      if (g.score >= this.goal && !g.emerged && dist(p, this.reed) < this.reed.r) {
        g.emerging = 3;
        g.frozen = true;
        p.x = this.reed.x; p.y = this.reed.y; p.angle = -Math.PI / 2; p.k = 0;
        Game.fact('climb');
        return;
      }

      const target = nearest(g.items, p, 60);
      setAction(target ? 'Grab' : 'Jet', target || p.jetCd <= 0);

      if (p.grab) {
        const gr = p.grab;
        gr.t += dt;
        gr.len = Math.sin(Math.min(1, gr.t / 0.25) * Math.PI) * gr.reach;
        if (gr.t >= 0.25) p.grab = null;
      } else if (input.pressed) {
        if (target) {
          p.angle = Math.atan2(target.y - p.y, target.x - p.x);
          p.grab = { t: 0, len: 0, reach: Math.max(10, dist(p, target) - 12) };
          g.items.splice(g.items.indexOf(target), 1);
          g.score++;
          Sound.play('score');
          Game.pop(target.x, target.y - 14, 'Gulp!', '#ffd23f');
          Game.fact('grab');
          Game.fact(target.kind);
          if (g.score === 4) Game.fact('moult');
          if (g.score === this.goal) {
            // Point to a reed a short swim away, not across the whole lake.
            const r = Game.spawnPoint(100, p, 380);
            this.reed.x = clamp(r.x, 120, World.w - 120); this.reed.y = clamp(r.y, 120, World.h - 120);
            g.toasts.push({ text: 'You’re ready to grow up! Follow the arrow to the reed and climb out.', kind: 'hint' });
          }
          Game.later(1.5, () => this.addPrey(target.kind));
        } else if (p.jetCd <= 0) {
          p.jet = 0.45; p.jetCd = 2;
          Sound.play('dart');
          Game.fact('jet');
        }
      }
      p.speed = p.jet > 0 ? 260 : 85;
    },
    drawBuild(ctx) {
      const r = this.reed;
      for (const [dx, dy] of [[0, 0], [-30, -20], [30, 10], [-20, 30], [25, -30]]) {
        ell(ctx, r.x + dx + 4, r.y + dy + 4, 9, 9, 'rgba(0,0,0,.2)');
        ell(ctx, r.x + dx, r.y + dy, 9, 9, '#a3b45a');
        ell(ctx, r.x + dx, r.y + dy, 5, 5, '#c8d47a');
      }
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Reed stems', r.x, r.y + 70);
    },
    drawExtra(ctx, g) {
      if (g.score >= this.goal && !(g.emerging > 0) && !g.emerged) {
        ctx.beginPath();
        ctx.arc(this.reed.x, this.reed.y, this.reed.r + Math.sin(g.t * 5) * 4, 0, TAU);
        ctx.strokeStyle = 'rgba(255,210,63,.9)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },
    playerSprite(g) { return g.emerging > 0 || g.emerged ? 'emerge' : 'nymph'; },
    goalPoint(g) { return g.score >= this.goal && !(g.emerging > 0) && !g.emerged ? this.reed : null; },
    hud(g) {
      if (g.score >= this.goal && !g.emerged) setHud('Climb the reed!', '');
      else setHud('Food: ' + g.score + (g.emerged ? '' : ' / ' + this.goal), '');
    },
    won(g) { return !!g.emerged; },
  },

  // ------------------------------------------------- Blue skimmer: adult
  dragonfly: {
    id: 'dragonfly', bug: 'dragonfly', stage: 'Adult', place: 'Herdsman Lake', world: BIG,
    action: 'Dart', radius: 20, speed: 190, scale: 1.3, goal: 25,
    home: { x: 220, y: 600, r: 50, label: 'Reeds' },
    facts: [
      'Blue skimmers are common around Perth’s lakes and wetlands.',
      'Only the males are powder-blue. Females are yellow-brown.',
      'Dragonflies are insects. Their huge eyes see almost all the way around them.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag. Explore the lake!',
      'Fly into mosquitoes to catch them.',
      'Press Dart for a burst of speed.',
      'Look for sparkles: they’re discoveries.',
    ],
    discoveries: [
      { key: 'd_frog', sprite: 'frog', fx: 0.05, fy: 0.12 },
      { key: 'd_damsel', sprite: 'damselfly', fx: 0.7, fy: 0.4 },
      { key: 'd_swan', sprite: 'feather', color: '#1a1a1a', fx: 0.45, fy: 0.85 },
    ],
    factText: {
      start: 'Dragonflies catch insects in mid-air, scooping them up with their spiny legs like a basket.',
      wings: 'Dragonflies can move each of their 4 wings on its own. That lets them hover, turn sharply and dart.',
      catch: 'Some dragonflies catch more than 9 out of every 10 insects they chase.',
      hobby: 'The Australian hobby is a small, fast falcon. It can catch dragonflies in mid-air.',
      eggs: 'Female blue skimmers lay eggs by dipping the tip of their body into the water as they fly.',
      d_frog: 'A motorbike frog. Its call sounds like a motorbike changing gears.',
      d_damsel: 'A damselfly, a cousin of dragonflies. Most damselflies fold their wings along their body when resting. Dragonflies hold theirs out flat.',
      d_swan: 'A black swan feather. The black swan is the bird emblem of Western Australia.',
      win: 'Mosquito larvae live in water too, and dragonfly nymphs eat them. Dragonflies help keep mosquitoes down.',
    },

    setup(g) {
      for (let i = 0; i < 14; i++) this.addMozzie();
      g.player.dart = 0; g.player.dartCd = 0;
      Game.addPred({ sprite: 'hobby', name: 'Australian hobby', r: 26, wanderSpeed: 90, chaseSpeed: 235, sight: 220,
        chaseTime: 2.2, restTime: 4 });
    },
    addMozzie() {
      const p = nearPlayer(120);
      Game.g.items.push({ sprite: 'mosquito', kind: 'mosquito', x: p.x, y: p.y, r: 9, speed: 55 + Math.random() * 40, scale: 1.7 });
    },
    update(g, dt, input) {
      const p = g.player;
      p.dart = Math.max(0, p.dart - dt);
      p.dartCd = Math.max(0, p.dartCd - dt);
      if (input.pressed && p.dartCd <= 0) {
        p.dart = 0.6; p.dartCd = 2.5;
        Sound.play('dart');
        Game.fact('wings');
      }
      p.speed = p.dart > 0 ? 340 : 190;
      setAction('Dart', p.dartCd <= 0);
      for (const m of g.items) {
        wander(m, dt, m.speed);
        if (Math.random() < dt * 2) m.wt = 0;
      }
      const m = g.items.find(i => touching(p, i, 2));
      if (m) {
        g.items.splice(g.items.indexOf(m), 1);
        g.score++;
        Sound.play('pick');
        Game.pop(m.x, m.y - 12, '+1', '#fff');
        if (g.score === 1) Game.fact('catch');
        if (g.score === 8) Game.fact('eggs');
        Game.later(1, () => this.addMozzie());
      }
    },
    goalPoint() { return null; },
    hud(g) { setHud('Mosquitoes: ' + g.score + (g.score < this.goal ? ' / ' + this.goal : ''), ''); },
    won(g) { return g.score >= this.goal; },
  },
};

// A bug's first stage is gentle: getting caught never ends the game.
for (const bug of Bugs) Missions[bug.stages[0]].gentle = true;

// Every level has the kid-with-a-net event (js/tank.js); escaping adds this to the Bug Book.
for (const id in Missions) {
  Missions[id].factText.tank = 'It\u2019s fine to catch a bug to have a look, but always let it go where you found it.';
}
