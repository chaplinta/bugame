'use strict';
// One mission per bug. Facts are checked against docs/facts.md.

function setHud(goal, extra) {
  document.getElementById('hudGoal').textContent = goal;
  document.getElementById('hudExtra').textContent = extra || '';
}

const Missions = [
  // ---------------------------------------------------------------- Bull ant
  {
    id: 'ant', name: 'Bull Ant', sci: 'Myrmecia', place: 'Banksia woodland, Kings Park',
    blurb: 'Hunt insects and carry them home for the larvae.',
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
    startFact: 'Worker bull ants are all females. The queen stays in the nest laying eggs.',

    setup(g) {
      for (let i = 0; i < 5; i++) this.addTermite();
      for (let i = 0; i < 2; i++) this.addCaterpillar();
      Game.addPred({ sprite: 'echidna', name: 'echidna', r: 26, wanderSpeed: 32, chaseSpeed: 70, sight: 170,
        chaseTime: 4, restTime: 3,
        fact: 'Echidnas dig into ant nests and lick up ants with a long, sticky tongue.' });
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
      if (input.pressed) {
        p.stingT = 0.3;
        const c = nearest(g.items.filter(i => i.kind === 'caterpillar' && !i.stunned), p, 48);
        if (c) {
          c.stunned = true; c.stunT = 8;
          Game.pop(c.x, c.y - 14, 'Stung!', '#ffd23f');
          Game.fact('sting', 'A bull ant’s sting is venomous and very painful. Look at them, never touch!');
        }
      }
      if (!p.carry) {
        const it = g.items.find(i => touching(p, i));
        if (it) {
          if (it.kind === 'termite' || it.stunned) {
            p.carry = it.kind;
            g.items.splice(g.items.indexOf(it), 1);
            Game.fact('carry', 'Bull ants can carry prey much heavier than themselves.');
            Game.later(3, () => it.kind === 'termite' ? this.addTermite() : this.addCaterpillar());
          } else {
            Game.hint('Too big! Press Sting right next to the caterpillar.');
          }
        }
      } else if (Game.inHome()) {
        g.score++;
        Game.pop(p.x, p.y - 20, '+1', '#fff');
        p.carry = null;
        Game.fact('larvae', 'The insects go to the larvae (baby ants). Adult bull ants drink nectar and sweet juices instead.');
      }
      p.speed = p.carry ? 115 : 150;
    },
    onCaught(g) { g.player.carry = null; },
    goalPoint(g) { return g.player.carry ? g.home : null; },
    hud(g) { setHud('Food: ' + g.score + ' / ' + this.goal, g.player.carry ? 'Carrying ' + g.player.carry : ''); },
    won(g) { return g.score >= this.goal; },
    winFact: 'Bull ant nests can live for many years, with a new generation of workers every season.',
  },

  // -------------------------------------------------------- Blue-banded bee
  {
    id: 'bee', name: 'Blue-banded Bee', sci: 'Amegilla', place: 'A backyard with native plants',
    blurb: 'Buzz pollen out of flowers and stock your nest burrow.',
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
    startFact: 'European honey bees can’t buzz-pollinate. Blue-banded bees can.',

    setup(g) {
      const spots = [[330, 140, 'dianella'], [520, 90, 'hibbertia'], [720, 170, 'dianella'], [860, 330, 'hibbertia'],
        [640, 420, 'dianella'], [420, 500, 'hibbertia'], [260, 360, 'paw'], [560, 270, 'paw'], [880, 520, 'dianella'],
        [160, 520, 'hibbertia']];
      for (const [x, y, kind] of spots) {
        g.items.push({ sprite: kind, kind, x, y, r: 26, scale: 1.3, pollen: kind !== 'paw', regrow: 0, angle: Math.random() * TAU });
      }
      g.player.load = 0;
      g.player.buzzT = 0;
      Game.addPred({ sprite: 'beeEater', name: 'rainbow bee-eater', r: 22, wanderSpeed: 70, chaseSpeed: 145, sight: 190,
        chaseTime: 2.6, restTime: 3.5, scale: 1,
        fact: 'Rainbow bee-eaters fly to Perth in spring. They catch bees in the air, then rub them on a branch to get rid of the sting.' });
    },
    update(g, dt, input) {
      const p = g.player;
      p.buzz = false;
      for (const f of g.items) {
        if (!f.pollen && f.kind !== 'paw') { f.regrow -= dt; if (f.regrow <= 0) f.pollen = true; }
      }
      const f = g.items.find(i => touching(p, i, -8));
      if (f !== p.flower) { p.flower = f; p.buzzT = 0; }
      if (f) {
        if (f.kind === 'paw') {
          Game.fact('paw', 'Kangaroo paws are pollinated mainly by birds like honeyeaters. Pollen rubs onto the bird’s head as it drinks nectar.');
        } else if (f.pollen) {
          if (p.load >= 3) Game.hint('Your legs are full of pollen. Fly back to the burrow!');
          else if (input.held) {
            p.buzz = true;
            p.buzzT += dt;
            Game.fact(f.kind, f.kind === 'dianella'
              ? 'Dianella (flax lily) keeps its pollen locked inside tubes. Only a buzz shakes it out.'
              : 'Hibbertia (guinea flower) is another buzz-pollinated flower. Bees spread its pollen from flower to flower.');
            if (p.buzzT >= 0.8) {
              p.load++; f.pollen = false; f.regrow = 9; p.buzzT = 0;
              Game.pop(f.x, f.y - 20, 'Pollen!', '#f39c12');
            }
          } else Game.hint('Hold Buzz to shake the pollen out!');
        }
      }
      if (p.load > 0 && Game.inHome()) {
        g.score += p.load;
        Game.pop(p.x, p.y - 20, '+' + p.load, '#fff');
        p.load = 0;
        Game.fact('nest', 'She mixes pollen with nectar into a food ball, lays an egg on it, and seals the cell.');
      }
      p.speed = 175 - p.load * 10;
    },
    onCaught(g) { g.player.load = 0; },
    goalPoint(g) { return g.player.load >= 3 ? g.home : null; },
    hud(g) { setHud('Pollen stored: ' + Math.min(g.score, this.goal) + ' / ' + this.goal, 'Carrying ' + g.player.load + ' / 3'); },
    won(g) { return g.score >= this.goal; },
    winFact: 'At night, male blue-banded bees sleep holding onto a plant stem with their jaws.',
  },

  // ----------------------------------------------------- Peacock spider
  {
    id: 'spider', name: 'Peacock Spider', sci: 'Maratus speciosus', place: 'Coastal dunes, Cottesloe',
    blurb: 'Stalk flies, pounce, then dance for a female.',
    action: 'Jump', radius: 15, speed: 105, scale: 1.7, goal: 5,
    home: { x: 100, y: 510, r: 40, label: 'Silk retreat' },
    facts: [
      'The coastal peacock spider lives in the sand dunes along Perth’s coast. It is about the size of a grain of rice.',
      'Spiders are not insects. They have 8 legs and 2 body parts.',
      'Jumping spiders have 8 eyes. The two big front eyes see sharp detail and colour.',
    ],
    how: [
      'Move with the arrow keys, or touch and drag.',
      'Flies spot you if you walk too close. Stop a little way off.',
      'Press Jump to pounce on the nearest fly.',
      'Catch 5 flies, then find the female and press Dance. Beware the spider wasp!',
    ],
    startFact: 'Jumping spiders don’t catch food in webs. They stalk it and pounce.',

    setup(g) {
      for (let i = 0; i < 5; i++) this.addFly();
      g.player.jcd = 0;
      Game.addPred({ sprite: 'wasp', name: 'spider wasp', r: 18, wanderSpeed: 60, chaseSpeed: 112, sight: 150,
        chaseTime: 3, restTime: 3.5,
        fact: 'Spider wasps hunt spiders. They sting them so they can’t move, then lay an egg on them.' });
    },
    addFly() {
      const p = Game.spawnPoint(160);
      Game.g.items.push({ sprite: 'fly', kind: 'fly', x: p.x, y: p.y, r: 9, state: 'sit', angle: Math.random() * TAU, scale: 1.7 });
    },
    onCaught(g) { g.player.jump = null; g.player.hop = 0; },
    locked(g) { return !!g.player.jump || g.player.dance > 0; },
    update(g, dt, input) {
      const p = g.player;
      p.jcd = Math.max(0, p.jcd - dt);
      if (p.silk) { p.silk.life -= dt; if (p.silk.life <= 0) p.silk = null; }

      // Flies
      for (const f of g.items) {
        if (f.kind !== 'fly') continue;
        if (f.state === 'sit') {
          if (Math.random() < dt * 0.5) f.angle += (Math.random() - 0.5);
          if (!p.jump && p.moving && dist(f, p) < 75) {
            f.state = 'flee';
            f.dir = Math.atan2(f.y - p.y, f.x - p.x);
            f.angle = f.dir;
            Game.fact('flee', 'Flies have excellent eyesight too. Creep up and stop, then jump!');
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

      // Female and dance
      if (g.score >= this.goal && !g.female) {
        const s = Game.spawnPoint(380);
        g.female = { sprite: 'femaleSpider', kind: 'female', x: s.x, y: s.y, r: 14, angle: Math.random() * TAU, scale: 1.7 };
        g.items.push(g.female);
        Game.g.toasts.push({ text: 'A female is nearby! Walk to her and press Dance.', kind: 'hint' });
      }
      const nearFemale = g.female && dist(p, g.female) < 60;
      document.getElementById('actionBtn').textContent = nearFemale ? 'Dance' : 'Jump';

      if (p.dance > 0) {
        p.dance -= dt;
        p.angle = Math.atan2(g.female.y - p.y, g.female.x - p.x);
        g.female.angle = p.angle + Math.PI;
        if (p.dance <= 0) g.danced = true;
        return;
      }

      if (input.pressed && nearFemale) {
        p.dance = 4;
        g.frozen = true;
        p.invuln = 5;
        g.female.heart = true;
        Game.fact('dance', 'To win a female, the male raises a bright flap with orange fringes and waves his legs in a dance.');
        return;
      }

      // Jump
      if (input.pressed && !p.jump && p.jcd <= 0) {
        const target = nearest(g.items.filter(f => f.kind === 'fly' && f.state === 'sit'), p, 170);
        let tx, ty;
        if (target) { tx = target.x; ty = target.y; }
        else { tx = p.x + Math.cos(p.angle) * 110; ty = p.y + Math.sin(p.angle) * 110; }
        p.jump = { sx: p.x, sy: p.y, tx: clamp(tx, 20, W - 20), ty: clamp(ty, 20, H - 20), t: 0, dur: 0.32 };
        p.angle = Math.atan2(ty - p.y, tx - p.x);
        p.silk = { x: p.x, y: p.y, life: 1.5 };
        Game.fact('silk', 'Before it jumps, a jumping spider sticks down a silk safety line, like a climber’s rope.');
      }
      if (p.jump) {
        const j = p.jump;
        j.t += dt;
        const k = Math.min(1, j.t / j.dur);
        p.x = j.sx + (j.tx - j.sx) * k;
        p.y = j.sy + (j.ty - j.sy) * k;
        p.hop = Math.sin(k * Math.PI);
        const f = g.items.find(i => i.kind === 'fly' && touching(p, i, 6));
        if (f) {
          g.items.splice(g.items.indexOf(f), 1);
          g.score++;
          Game.pop(f.x, f.y - 14, 'Got it!', '#ffd23f');
          Game.fact('jump', 'Jumping spiders leap partly by pumping fluid into their legs, which snaps them straight.');
          if (g.score < this.goal) Game.later(2, () => this.addFly());
        }
        if (k >= 1) { p.jump = null; p.hop = 0; p.jcd = 0.3; }
      }
    },
    drawExtra(ctx, g) {
      const p = g.player;
      if (p.silk) {
        ctx.beginPath();
        ctx.moveTo(p.silk.x, p.silk.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(1, p.silk.life) + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    },
    goalPoint(g) { return g.female && !(g.player.dance > 0) ? g.female : null; },
    hud(g) {
      if (g.female) setHud('Find the female and dance!', '');
      else setHud('Flies: ' + g.score + ' / ' + this.goal, g.player.jcd > 0 || g.player.jump ? '' : 'Jump ready');
    },
    won(g) { return !!g.danced; },
    winFact: 'Almost all peacock spiders live only in Australia, and new kinds are still being discovered.',
  },

  // --------------------------------------------------------- Blue skimmer
  {
    id: 'dragonfly', name: 'Blue Skimmer', sci: 'Orthetrum caledonicum', place: 'Herdsman Lake',
    blurb: 'Snatch mosquitoes out of the air over the lake.',
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
    startFact: 'Dragonflies catch insects in mid-air, scooping them up with their spiny legs like a basket.',

    setup(g) {
      for (let i = 0; i < 9; i++) this.addMozzie();
      g.player.dart = 0; g.player.dartCd = 0;
      Game.addPred({ sprite: 'hobby', name: 'Australian hobby', r: 26, wanderSpeed: 90, chaseSpeed: 235, sight: 220,
        chaseTime: 2.2, restTime: 4,
        fact: 'The Australian hobby is a small, fast falcon. It can catch dragonflies in mid-air.' });
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
        Game.fact('wings', 'Dragonflies can move each of their 4 wings on its own. That lets them hover, turn sharply and dart.');
      }
      p.speed = p.dart > 0 ? 340 : 190;
      document.getElementById('actionBtn').classList.toggle('ready', p.dartCd <= 0);
      for (const m of g.items) {
        wander(m, dt, m.speed);
        if (Math.random() < dt * 2) m.wt = 0;
      }
      const m = g.items.find(i => touching(p, i, 2));
      if (m) {
        g.items.splice(g.items.indexOf(m), 1);
        g.score++;
        Game.pop(m.x, m.y - 12, '+1', '#fff');
        if (g.score === 1) Game.fact('catch', 'Some dragonflies catch more than 9 out of every 10 insects they chase.');
        if (g.score === 5) Game.fact('nymph', 'Baby dragonflies (nymphs) live underwater for months. They grab food with a jaw that shoots out.');
        Game.later(1, () => this.addMozzie());
      }
    },
    goalPoint() { return null; },
    hud(g) { setHud('Mosquitoes: ' + Math.min(g.score, this.goal) + ' / ' + this.goal, g.player.dartCd <= 0 ? 'Dart ready' : ''); },
    won(g) { return g.score >= this.goal; },
    winFact: 'Mosquito babies (wrigglers) also live in water, and dragonfly nymphs eat them too.',
  },
];
