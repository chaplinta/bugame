'use strict';
// Bugs, their life stages, and one mission per stage.
// Every fact here is listed with a source in docs/facts.md.

function setHud(goal, extra) {
  document.getElementById('hudGoal').textContent = goal;
  document.getElementById('hudExtra').textContent = extra || '';
}

function setAction(label, ready) {
  const btn = document.getElementById('actionBtn');
  if (btn.textContent !== label) btn.textContent = label;
  btn.classList.toggle('ready', !!ready);
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
    p.jump = { sx: p.x, sy: p.y, tx: clamp(tx, 20, W - 20), ty: clamp(ty, 20, H - 20), t: 0, dur: 0.32, target };
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
  { id: 'spider', name: 'Peacock Spider', sci: 'Maratus speciosus', place: 'Cottesloe dunes', sprite: 'spider', pin: { x: 262, y: 380 }, stages: ['spiderling', 'spider'] },
  { id: 'dragonfly', name: 'Blue Skimmer', sci: 'Orthetrum caledonicum', place: 'Herdsman Lake', sprite: 'dragonfly', pin: { x: 430, y: 185 }, stages: ['nymph', 'dragonfly'] },
];

const Missions = {
  // ---------------------------------------------------------------- Bull ant
  ant: {
    id: 'ant', bug: 'ant', stage: 'Worker', place: 'Banksia woodland, Kings Park',
    action: 'Sting', radius: 16, speed: 150, scale: 1.4, goal: 6,
    home: { x: 110, y: 490, r: 46, label: 'Nest' },
    facts: [
      'Almost every kind of bull ant in the world lives only in Australia.',
      'Bull ants have big eyes. They hunt by sight, and usually alone.',
      'Ants are insects: 6 legs and 3 body parts.',
    ],
    how: [
      'Move with the arrow keys, or touch and drag.',
      'Walk into a termite to pick it up.',
      'Caterpillars are too big. Get close and press Sting first.',
      'Carry the food to the nest. Watch out for the echidna!',
    ],
    factText: {
      start: 'Worker bull ants are all females. The queen stays in the nest laying eggs.',
      sting: 'A bull ant’s sting is venomous and very painful. Look at them, never touch!',
      carry: 'Bull ants can carry prey much heavier than themselves.',
      larvae: 'The insects go to the larvae (baby ants). Adult bull ants drink nectar and sweet juices instead.',
      echidna: 'Echidnas dig into ant nests and lick up ants with a long, sticky tongue.',
      win: 'A bull ant nest can last for years, with new workers growing up every season.',
    },

    setup(g) {
      for (let i = 0; i < 5; i++) this.addTermite();
      for (let i = 0; i < 2; i++) this.addCaterpillar();
      Game.addPred({ sprite: 'echidna', name: 'echidna', ground: true, r: 26, wanderSpeed: 32, chaseSpeed: 70, sight: 170,
        chaseTime: 4, restTime: 3 });
    },
    addTermite() {
      const p = Game.spawnPoint(160);
      Game.g.items.push({ sprite: 'termite', kind: 'termite', x: p.x, y: p.y, r: 9, speed: 22, scale: 1.4 });
    },
    addCaterpillar() {
      const p = Game.spawnPoint(220);
      Game.g.items.push({ sprite: 'caterpillar', kind: 'caterpillar', x: p.x, y: p.y, r: 14, speed: 12, stunned: false, scale: 1.3 });
    },
    update(g, dt, input) {
      const p = g.player;
      p.stingT = Math.max(0, (p.stingT || 0) - dt);
      for (const it of g.items) {
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
          if (it.kind === 'termite' || it.stunned) {
            p.carry = it.kind;
            g.items.splice(g.items.indexOf(it), 1);
            Sound.play('pick');
            Game.fact('carry');
            Game.later(3, () => it.kind === 'termite' ? this.addTermite() : this.addCaterpillar());
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
      }
      p.speed = p.carry ? 115 : 150;
    },
    onCaught(g) { g.player.carry = null; },
    goalPoint(g) { return g.player.carry ? g.home : null; },
    hud(g) { setHud('Food: ' + g.score + ' / ' + this.goal, g.player.carry ? 'Carrying a ' + g.player.carry : ''); },
    won(g) { return g.score >= this.goal; },
  },

  // ---------------------------------------------------------- Bull ant: queen
  queen: {
    id: 'queen', bug: 'ant', stage: 'Queen', place: 'Banksia woodland, Kings Park',
    sprite: 'queenAnt', bg: 'ant',
    action: 'Land', radius: 16, speed: 170, scale: 1.5, goal: 3,
    home: { x: 110, y: 490, r: 46, label: 'Old nest' },
    patches: [{ x: 820, y: 150 }, { x: 700, y: 470 }, { x: 470, y: 120 }],
    facts: [
      'A bull ant colony starts with one queen.',
      'Young queens have wings. Workers never do.',
      'A queen is bigger than the workers, and lays all the eggs.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag.',
      'Fly to a patch of clear sand and press Land. Dodge the willie wagtail!',
      'Hold Dig to dig your new nest.',
      'Hunt 3 termites and bring them home to feed your first babies.',
    ],
    factText: {
      start: 'On a warm day, often after rain, winged young queens and males leave the nest to mate.',
      wings: 'After mating, the queen snaps off her wings. She will never fly again.',
      dig: 'She digs a small chamber in the soil and lays her first eggs.',
      hunt: 'Bull ant queens leave the new nest to hunt for their first larvae. Queens of many other ants stay sealed inside.',
      wagtail: 'Willie wagtails snap up flying insects, and hunt on the ground too.',
      win: 'When the first workers grow up, they do the hunting. The queen stays home laying eggs for years.',
    },

    setup(g) {
      const p = g.player;
      p.wings = true; p.flying = true; p.digT = 0;
      g.phase = 'fly';
      Game.addPred({ sprite: 'wagtail', name: 'willie wagtail', r: 20, scale: 1.1, wanderSpeed: 70, chaseSpeed: 140, sight: 180,
        chaseTime: 2.5, restTime: 3.5 });
    },
    addTermite() {
      const p = Game.spawnPoint(140);
      Game.g.items.push({ sprite: 'termite', kind: 'termite', x: p.x, y: p.y, r: 9, speed: 22, scale: 1.4 });
    },
    onCaught(g) { g.player.carry = null; },
    update(g, dt, input) {
      const p = g.player;
      for (const it of g.items) wander(it, dt, it.speed);

      if (g.phase === 'fly') {
        const patch = this.patches.find(pt => dist(pt, p) < 45);
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
        if (here && input.held) {
          if (Math.floor((p.digT + dt) * 5) !== Math.floor(p.digT * 5)) Sound.play('tap');
          p.digT += dt;
          if (p.digT >= 2) {
            g.phase = 'hunt';
            Sound.play('score');
            Game.fact('dig');
            for (let i = 0; i < 4; i++) this.addTermite();
            g.toasts.push({ text: 'Your eggs need food. Hunt termites and bring them home!', kind: 'hint' });
          }
        }
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
    locked() { return false; },
    drawExtra(ctx, g) {
      if (g.phase === 'fly') {
        for (const pt of this.patches) {
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
      if (g.phase === 'fly') return nearest(this.patches, g.player, 9999);
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
    id: 'bee', bug: 'bee', stage: 'Adult female', place: 'A backyard with native plants',
    action: 'Buzz', radius: 16, speed: 175, scale: 1.5, goal: 9,
    home: { x: 110, y: 160, r: 46, label: 'Burrow' },
    facts: [
      'Blue-banded bees live alone, not in a hive. Each female digs her own burrow in soil or a clay bank.',
      'They can do "buzz pollination": shaking pollen out of a flower by vibrating their flight muscles.',
      'Bees are insects: 6 legs, 3 body parts and 4 wings.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag.',
      'Land on a blue Dianella or yellow Hibbertia flower.',
      'Hold Buzz to shake the pollen out.',
      'You can carry 3 loads. Take them back to your burrow. Watch out for the bee-eater!',
    ],
    factText: {
      start: 'European honey bees can’t buzz-pollinate. Blue-banded bees can.',
      dianella: 'Dianella (flax lily) keeps its pollen locked inside tubes. Only a buzz shakes it out.',
      hibbertia: 'Hibbertia (guinea flower) is another buzz-pollinated flower. Bees spread its pollen from flower to flower.',
      paw: 'Kangaroo paws are pollinated mainly by birds like honeyeaters. Pollen rubs onto the bird’s head as it drinks nectar.',
      nest: 'She mixes pollen with nectar into a food ball, lays an egg on it, and seals the cell.',
      beeEater: 'Rainbow bee-eaters fly to Perth in spring. They catch bees in the air, then rub them on a branch to get rid of the sting.',
      win: 'At night, male blue-banded bees sleep holding onto a plant stem with their jaws.',
    },

    setup(g) {
      const spots = [[330, 140, 'dianella'], [520, 90, 'hibbertia'], [720, 170, 'dianella'], [860, 330, 'hibbertia'],
        [640, 420, 'dianella'], [420, 500, 'hibbertia'], [260, 360, 'paw'], [560, 270, 'paw'], [880, 520, 'dianella'],
        [160, 520, 'hibbertia']];
      for (const [x, y, kind] of spots) {
        g.items.push({ sprite: kind, kind, x, y, r: 26, scale: 1.3, pollen: kind !== 'paw', regrow: 0, angle: Math.random() * TAU });
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
          if (p.load >= 3) Game.hint('Your legs are full of pollen. Fly back to the burrow!');
          else if (input.held) {
            p.buzz = true;
            if (Math.floor((p.buzzT + dt) * 8) !== Math.floor(p.buzzT * 8)) Sound.play('buzz');
            p.buzzT += dt;
            Game.fact(f.kind);
            if (p.buzzT >= 0.8) {
              p.load++; f.pollen = false; f.regrow = 9; p.buzzT = 0;
              Sound.play('pick');
              Game.pop(f.x, f.y - 20, 'Pollen!', '#f39c12');
            }
          } else Game.hint('Hold Buzz to shake the pollen out!');
        }
      }
      if (p.load > 0 && Game.inHome()) {
        g.score += p.load;
        Sound.play('score');
        Game.pop(p.x, p.y - 20, '+' + p.load, '#fff');
        p.load = 0;
        Game.fact('nest');
      }
      p.speed = 175 - p.load * 10;
    },
    onCaught(g) { g.player.load = 0; },
    goalPoint(g) { return g.player.load >= 3 ? g.home : null; },
    hud(g) { setHud('Pollen stored: ' + Math.min(g.score, this.goal) + ' / ' + this.goal, 'Carrying ' + g.player.load + ' / 3'); },
    won(g) { return g.score >= this.goal; },
  },

  // ------------------------------------------------- Peacock spider: spiderling
  spiderling: {
    id: 'spiderling', bug: 'spider', stage: 'Spiderling', place: 'Coastal dunes, Cottesloe',
    sprite: 'spiderling', bg: 'spider',
    action: 'Jump', radius: 12, speed: 95, scale: 1.5, goal: 6,
    home: { x: 100, y: 510, r: 40, label: 'Mum’s retreat' },
    facts: [
      'Peacock spiders hatch from eggs in a silk sac. The mother guards the eggs in her silk retreat.',
      'Baby spiders are called spiderlings. They are tiny, but they can already hunt.',
      'Spiders are not insects. They have 8 legs and 2 body parts.',
    ],
    how: [
      'Move with the arrow keys, or touch and drag.',
      'Springtails hop away if you rush at them. Stop close by, then press Jump.',
      'Catch 6, then go back to the retreat to moult (shed your skin).',
      'Watch out for ants!',
    ],
    factText: {
      start: 'Spiderlings stay near their mother’s retreat at first, then go off to hunt on their own.',
      springtail: 'Springtails are not insects. A spring folded under the body flicks them into the air to escape.',
      silk: 'Even tiny spiderlings stick down a silk safety line before they jump.',
      smallAnt: 'Ants attack small spiders. Many spiderlings get eaten before they grow up.',
      moult: 'Spiders have a hard outer skin. To grow, they moult: split the old skin and climb out of it.',
      win: 'Young male peacock spiders are plain brown. Their bright colours only appear at the last moult.',
    },

    setup(g) {
      for (let i = 0; i < 6; i++) this.addSpringtail();
      g.player.jcd = 0;
      Game.addPred({ sprite: 'smallAnt', name: 'ant', ground: true, r: 14, scale: 1.4, wanderSpeed: 55, chaseSpeed: 80, sight: 130,
        chaseTime: 3, restTime: 3 });
    },
    addSpringtail() {
      const p = Game.spawnPoint(150);
      Game.g.items.push({ sprite: 'springtail', kind: 'springtail', x: p.x, y: p.y, r: 9, state: 'sit',
        angle: Math.random() * TAU, scale: 1.8, hopT: 1 + Math.random() * 2 });
    },
    onCaught(g) { g.player.jump = null; g.player.hop = 0; },
    locked(g) { return !!g.player.jump || g.player.moult > 0; },
    update(g, dt, input) {
      const p = g.player;
      if (p.moult > 0) {
        p.moult -= dt;
        if (p.moult <= 0) g.moulted = true;
        return;
      }
      // Springtails hop now and then, and spring away when the spider rushes close.
      for (const s of g.items) {
        s.hop = Math.max(0, (s.hop || 0) - dt);
        s.hopT -= dt;
        const scared = !p.jump && p.moving && dist(s, p) < 65;
        if (s.hopT <= 0 || scared) {
          const a = scared ? Math.atan2(s.y - p.y, s.x - p.x) + (Math.random() - 0.5) : Math.random() * TAU;
          const d = scared ? 120 : 40;
          s.x = clamp(s.x + Math.cos(a) * d, 30, W - 30);
          s.y = clamp(s.y + Math.sin(a) * d, 60, H - 30);
          s.angle = a;
          s.hop = 0.3;
          s.hopT = 1.5 + Math.random() * 2.5;
          if (scared) Game.fact('springtail');
        }
      }
      if (g.score >= this.goal) {
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
        if (g.score < this.goal) Game.later(1.5, () => this.addSpringtail());
        else g.toasts.push({ text: 'You’ve grown too big for your skin! Go back to the retreat to moult.', kind: 'hint' });
      }
    },
    drawExtra(ctx, g) { drawSilk(ctx, g.player); },
    goalPoint(g) { return g.score >= this.goal && !(g.player.moult > 0) ? g.home : null; },
    hud(g) { setHud(g.score >= this.goal ? 'Back to the retreat!' : 'Springtails: ' + g.score + ' / ' + this.goal, ''); },
    won(g) { return !!g.moulted; },
  },

  // ----------------------------------------------------- Peacock spider: adult
  spider: {
    id: 'spider', bug: 'spider', stage: 'Adult male', place: 'Coastal dunes, Cottesloe',
    action: 'Jump', radius: 15, speed: 105, scale: 1.7, goal: 5,
    home: { x: 100, y: 510, r: 40, label: 'Silk retreat' },
    facts: [
      'The coastal peacock spider lives in the sand dunes along Perth’s coast. It is about the size of a grain of rice.',
      'Jumping spiders have 8 eyes. The two big front eyes see sharp detail and colour.',
      'Only the males have the bright colours. Females are brown.',
    ],
    how: [
      'Move with the arrow keys, or touch and drag.',
      'Flies spot you if you walk too close. Stop a little way off.',
      'Press Jump to pounce on the nearest fly.',
      'Catch 5 flies, then find the female and press Dance. Beware the spider wasp!',
    ],
    factText: {
      start: 'Jumping spiders don’t catch food in webs. They stalk it and pounce.',
      flee: 'Flies have excellent eyesight too. Creep up and stop, then jump!',
      silk: 'Before it jumps, a jumping spider sticks down a silk safety line, like a climber’s rope.',
      jump: 'Jumping spiders leap partly by pumping fluid into their legs, which snaps them straight.',
      dance: 'To win a female, the male raises a bright flap with orange fringes and waves his legs in a dance.',
      wasp: 'Spider wasps hunt spiders. They sting them so they can’t move, then lay an egg on them.',
      win: 'Almost all peacock spiders live only in Australia, and new kinds are still being discovered.',
    },

    setup(g) {
      for (let i = 0; i < 5; i++) this.addFly();
      g.player.jcd = 0;
      Game.addPred({ sprite: 'wasp', name: 'spider wasp', r: 18, wanderSpeed: 60, chaseSpeed: 112, sight: 150,
        chaseTime: 3, restTime: 3.5 });
    },
    addFly() {
      const p = Game.spawnPoint(160);
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
            Game.fact('flee');
          }
        } else {
          f.x += Math.cos(f.dir) * 260 * dt;
          f.y += Math.sin(f.dir) * 260 * dt;
          if (f.x < -20 || f.x > W + 20 || f.y < -20 || f.y > H + 20) {
            f.gone = true;
            Game.later(2.5, () => this.addFly());
          }
        }
      }
      g.items = g.items.filter(f => !f.gone);

      if (g.score >= this.goal && !g.female) {
        const s = Game.spawnPoint(380);
        g.female = { sprite: 'femaleSpider', kind: 'female', x: s.x, y: s.y, r: 14, angle: Math.random() * TAU, scale: 1.7 };
        g.items.push(g.female);
        g.toasts.push({ text: 'A female is nearby! Walk to her and press Dance.', kind: 'hint' });
      }

      if (p.dance > 0) {
        p.dance -= dt;
        p.angle = Math.atan2(g.female.y - p.y, g.female.x - p.x);
        g.female.angle = p.angle + Math.PI;
        if (p.dance <= 0) g.danced = true;
        return;
      }

      const nearFemale = g.female && dist(p, g.female) < 60;
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
        if (g.score < this.goal) Game.later(2, () => this.addFly());
      }
    },
    drawExtra(ctx, g) { drawSilk(ctx, g.player); },
    goalPoint(g) { return g.female && !(g.player.dance > 0) ? g.female : null; },
    hud(g) {
      if (g.female) setHud('Find the female and dance!', '');
      else setHud('Flies: ' + g.score + ' / ' + this.goal, '');
    },
    won(g) { return !!g.danced; },
  },

  // ------------------------------------------------- Blue skimmer: nymph
  nymph: {
    id: 'nymph', bug: 'dragonfly', stage: 'Nymph', place: 'Underwater in Herdsman Lake',
    sprite: 'nymph', bg: 'nymph',
    action: 'Jet', radius: 15, speed: 85, scale: 1.6, goal: 8,
    home: { x: 120, y: 470, r: 60, label: 'Weed bed' },
    reed: { x: 880, y: 115, r: 50 },
    facts: [
      'A dragonfly starts life as a nymph living underwater.',
      'Nymphs are hunters. They hide, wait, and grab passing food.',
      'Nymphs have 6 legs and no wings yet. Their wings grow in pads on their back.',
    ],
    how: [
      'Swim with the arrow keys, or touch and drag.',
      'When food is close the button says Grab. Press it to shoot out your jaw!',
      'Otherwise the button says Jet: a quick squirt of speed.',
      'Eat 8, then climb the reed to become a dragonfly. Hide from the turtle in the weeds.',
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
      win: 'The empty skin left on the reed is called an exuvia. Look for them on reeds around Perth lakes!',
    },

    setup(g) {
      for (let i = 0; i < 5; i++) this.addPrey('wriggler');
      for (let i = 0; i < 2; i++) this.addPrey('tadpole');
      g.player.jet = 0; g.player.jetCd = 0; g.player.grab = null;
      Game.addPred({ sprite: 'turtle', name: 'oblong turtle', r: 26, wanderSpeed: 30, chaseSpeed: 66, sight: 150,
        chaseTime: 3, restTime: 3.5 });
    },
    addPrey(kind) {
      const p = Game.spawnPoint(150);
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
        if (g.emerging <= 0) g.emerged = true;
        return;
      }

      for (const it of g.items) wander(it, dt, it.speed);

      // Ready to climb out
      if (g.score >= this.goal && dist(p, this.reed) < this.reed.r) {
        g.emerging = 3;
        g.frozen = true;
        p.x = this.reed.x; p.y = this.reed.y; p.angle = -Math.PI / 2; p.k = 0;
        Game.fact('climb');
        return;
      }

      const target = g.score < this.goal ? nearest(g.items, p, 60) : null;
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
          if (g.score === this.goal) g.toasts.push({ text: 'You’re ready to grow up! Swim to the reed and climb out.', kind: 'hint' });
          if (g.score < this.goal) Game.later(1.5, () => this.addPrey(target.kind));
        } else if (p.jetCd <= 0) {
          p.jet = 0.45; p.jetCd = 2;
          Sound.play('dart');
          Game.fact('jet');
        }
      }
      p.speed = p.jet > 0 ? 260 : 85;
    },
    drawExtra(ctx, g) {
      if (g.score >= this.goal && !(g.emerging > 0)) {
        ctx.beginPath();
        ctx.arc(this.reed.x, this.reed.y, this.reed.r + Math.sin(g.t * 5) * 4, 0, TAU);
        ctx.strokeStyle = 'rgba(255,210,63,.9)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },
    playerSprite(g) { return g.emerging > 0 ? 'emerge' : 'nymph'; },
    goalPoint(g) { return g.score >= this.goal && !(g.emerging > 0) ? this.reed : null; },
    hud(g) {
      if (g.score >= this.goal) setHud('Climb the reed!', '');
      else setHud('Food: ' + g.score + ' / ' + this.goal, '');
    },
    won(g) { return !!g.emerged; },
  },

  // ------------------------------------------------- Blue skimmer: adult
  dragonfly: {
    id: 'dragonfly', bug: 'dragonfly', stage: 'Adult', place: 'Herdsman Lake',
    action: 'Dart', radius: 20, speed: 190, scale: 1.3, goal: 15,
    home: { x: 100, y: 330, r: 50, label: 'Reeds' },
    facts: [
      'Blue skimmers are common around Perth’s lakes and wetlands.',
      'Only the males are powder-blue. Females are yellow-brown.',
      'Dragonflies are insects. Their huge eyes see almost all the way around them.',
    ],
    how: [
      'Fly with the arrow keys, or touch and drag.',
      'Fly into mosquitoes to catch them.',
      'Press Dart for a burst of speed.',
      'Catch 15. If the falcon comes, dart away or hide in the reeds!',
    ],
    factText: {
      start: 'Dragonflies catch insects in mid-air, scooping them up with their spiny legs like a basket.',
      wings: 'Dragonflies can move each of their 4 wings on its own. That lets them hover, turn sharply and dart.',
      catch: 'Some dragonflies catch more than 9 out of every 10 insects they chase.',
      hobby: 'The Australian hobby is a small, fast falcon. It can catch dragonflies in mid-air.',
      eggs: 'Female blue skimmers lay eggs by dipping the tip of their body into the water as they fly.',
      win: 'Mosquito larvae live in water too, and dragonfly nymphs eat them. Dragonflies help keep mosquitoes down.',
    },

    setup(g) {
      for (let i = 0; i < 9; i++) this.addMozzie();
      g.player.dart = 0; g.player.dartCd = 0;
      Game.addPred({ sprite: 'hobby', name: 'Australian hobby', r: 26, wanderSpeed: 90, chaseSpeed: 235, sight: 220,
        chaseTime: 2.2, restTime: 4 });
    },
    addMozzie() {
      const p = Game.spawnPoint(120);
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
    hud(g) { setHud('Mosquitoes: ' + Math.min(g.score, this.goal) + ' / ' + this.goal, ''); },
    won(g) { return g.score >= this.goal; },
  },
};
