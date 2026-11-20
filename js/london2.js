'use strict';
// London, part two (the kit is in js/london.js): the Ally Pally wasp at the World Darts Championship, a pill
// woodlouse in Highgate Wood, and a fox out on a spring night. The art is in js/art-london2.js. Every fact is
// sourced in docs/facts.md (London); the pretend parts are listed there too. This file also puts all of London's
// places on its map.

// A score the way a darts caller says it
function ldnScoreWords(n) {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  if (!n) return 'NO SCORE';
  let s = '';
  if (n >= 100) { s = 'ONE HUNDRED'; n -= 100; if (n) s += ' AND '; }
  if (n >= 20) s += tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : ''); else s += ones[n];
  return s;
}
LDN_BODY.stand.throw = [34, -152];   // the hand a dart leaves

Object.assign(Missions, {
  // ------------------------------------------------------------------ 6. The Ally Pally wasp
  // A queen wasp, asleep for the winter in the roof of Alexandra Palace, is woken by the darts. Shiver to warm up,
  // fly down to the stage, land on the player who is throwing (his next dart scores 1), land on the board between
  // throws, sip a spilled drink in the crowd, and get back to a cold beam to sleep till spring.
  ldn_darts: ldnPart({
    id: 'ldn_darts', kind: 'queen', stage: 'Darts wasp', place: 'Alexandra Palace, a winter night', sprite: 'queenWasp', bg: 'ldnDarts', scale: 2.6,
    world: { w: 3400, h: 600 }, action: 'Land', later1: 'queen', later2: 'light', shooFact: 'landed',
    sex: 'You are a queen.',
    facts: [
      'Every winter the World Darts Championship is played at Alexandra Palace. Most years, a wasp joins in!',
      'Only young queen wasps live through the winter. They sleep till spring.',
      'A wasp that wakes up indoors flies to light and warmth. The stage has plenty of both.',
    ],
    how: [
      'Brr! First hold Shiver to warm up.',
      'Fly by dragging, or with the arrow keys. Let go and you hover.',
      'Hold Land on the player who is throwing. Then land on the dartboard, but only when he has thrown all three darts!',
      'A red zone shows where someone is looking. Fly in it and they wave you away. Wait for the stage smoke to stop.',
      'Sip the spilled drink in the crowd, then fly up to the cold beam at the end and go back to sleep. Two cheeky extras are hidden here!',
    ],
    discoveries: [{ key: 'd_ticket', sprite: 'oldTicket', fx: 0.25, fy: 0.925 }, { key: 'd_tv', sprite: 'oldTv', fx: 0.66, fy: 0.925 }],
    sights: [{ key: 'rose', name: 'the rose window', x: 430, y: 236 }, { key: 'screen', name: 'the big 180', x: 1505, y: 170 }, { key: 'trophy', name: 'the trophy', x: 1960, y: 390 }, { key: 'mast', name: 'the old TV mast', x: 3270, y: 290 }],
    factText: {
      start: 'You’re a queen wasp. It’s winter, and you were asleep in the roof of Alexandra Palace. The lights and the noise have woken you!',
      queen: 'Only young queen wasps live through the winter. The workers die in autumn. In spring, each queen starts a new nest.',
      shiver: 'A wasp has to warm up her flight muscles before she can fly. It’s a bit like shivering.',
      light: 'A wasp indoors flies to light and warmth. That’s how the Ally Pally wasp ends up on the stage.',
      landed: 'The Ally Pally wasp is real! Over the years it has landed on players, and even stung them.',
      score: 'Three darts in the treble 20 make 180. That’s the most you can score with three darts.',
      fat: 'All winter a queen lives on fat stored in her body. Awake, she uses it up faster, so she needs to get back to sleep.',
      d_ticket: 'A ticket for the darts. Alexandra Palace opened in 1873, and burnt down just 16 days later! It was soon built again.',
      d_tv: 'An old television. In 1936 the world’s first proper TV service was sent out from Alexandra Palace.',
      win: 'Back to sleep! She tucks in her antennae and holds on with her jaws. In spring she’ll fly off to start a nest.',
    },
    level() {
      const B = { x: 1640, y: 388, r: 46 };
      return {
        w: 3400, floor: 560, start: [150, 150],
        solids: [[600, 0, 44, 330, 'curtain'], [1920, 430, 80, 130, 'plinth'], [2300, 470, 260, 12, 'table'], [2700, 470, 260, 12, 'table'], [3060, 190, 44, 370, 'curtain']],
        ledges: [[60, 150, 240], [3130, 150, 220]],
        hides: [[2300, 482, 260, 78, 'table'], [2700, 482, 260, 78, 'table']],
        people: [{ id: 't2', x: 1050, face: 1, look: 6, prop: 'darts', shirt: '#c8501e' }, { id: 't1', x: 1180, home: 1180, face: 1, prop: 'throw', shirt: '#2f7d5b' },
          { id: 'ref', x: 1846, face: -1, look: 7, prop: 'mic', bald: true, shirt: '#22222a' },
          { id: 'f1', x: 2268, pose: 'sit', face: 1, look: 5, prop: 'foam', hat: 'viking' }, { id: 'f2', x: 2592, pose: 'sit', face: -1, look: 6.5, prop: 'cup', hat: 'crown' },
          { id: 'f3', x: 2668, pose: 'sit', face: 1, prop: 'phone' }, { id: 'f4', x: 2992, pose: 'sit', face: -1, look: 5.5, prop: 'foam' }],
        spots: [
          { id: 'miss', kind: 'miss', on: 't1', part: 'shoulder', follow: true, r: 34, verb: 'Land', hold: 0.8, pop: 'He flinched!', fact: 'landed' },
          { id: 'board', kind: 'board', x: B.x, y: B.y, r: 40, verb: 'Land', hold: 1, off: true, pop: 'Bullseye!', fact: 'light' },
          { id: 'ref', kind: 'ref', on: 'ref', part: 'head', r: 30, verb: 'Land', hold: 0.6, extra: true, pop: 'Shiny!', say: 'Get off my head!' },
          { id: 'trophy', kind: 'trophy', x: 1960, y: 388, r: 34, verb: 'Land', hold: 0.6, extra: true, pop: 'Champion!' },
          { id: 'sip', kind: 'sip', x: 2810, y: 456, r: 34, verb: 'Sip', hold: 1, pop: 'Fizzy!', say: 'Oi! That’s my drink!', by: 'f3', fact: 'fat' },
          { id: 'sleep', kind: 'sleep', x: 3240, y: 140, r: 40, verb: 'Sleep', hold: 1.5, need: { miss: 1, board: 1, sip: 1 }, goal: true, pop: 'Zzz…', fact: 'queen' }],
        need: { miss: 1, board: 1, sip: 1 },
        board: B, jets: [2150],
        checkpoints: [[700, 420], [1420, 300], [2060, 300], [2620, 300]],
        route: [[400, 260], [560, 420], [720, 420], [1000, 380], [1180, 420, 'miss'], [1640, 388, 'board'], [2040, 300], [2250, 300], [2810, 456, 'sip'], [2990, 300], [3010, 140], [3240, 140, 'sleep']],
      };
    },
    start(g) {
      g.oche = { ph: 'wait', t: 2, n: 0, total: 0, darts: [], visit: 0, wild: false, hadWild: false, fly: null };
      g.jetT = 1.4; g.warmT = 0;
      g.toasts.unshift({ text: 'Brr, it’s cold up here! Hold Shiver to warm up your wings.', kind: 'hint' }); g.toastT = 0;
    },
    busy(g) { return !g.counts.warm && !g.homeSafe; },   // too cold to fly yet
    done(g, s) { if (s.id === 'miss') { g.oche.wild = true; g.oche.hadWild = true; } },
    tick(g, dt, input) {
      const p = g.player, L = g.level, O = g.oche, B = L.board, cy = p.y - this.P.hh / 2;
      const T = g.people.find(q => q.id === 't1'), ref = g.people.find(q => q.id === 'ref');
      if (!g.counts.warm && !g.homeSafe) {   // waking up on her beam
        setAction('Shiver', true);
        p.shiver = working(input);
        if (p.shiver) {
          g.warmT += work(input, dt); p.progress = Math.min(1, g.warmT / 1.5);
          if (Math.floor(g.t * 8) !== Math.floor((g.t - dt) * 8)) Sound.play('buzz');
          if (g.warmT >= 1.5) {
            g.counts.warm = 1; p.shiver = false; Sound.play('score'); Game.pop(p.x, p.y - 36, 'Warm enough to fly!', '#ffd23f'); Game.fact('shiver');
            g.toasts.unshift({ text: 'Now fly down to the bright stage. Follow the arrow.', kind: 'hint' }); g.toastT = 0;
          }
        }
      }
      // The player at the oche: three darts, the caller calls the score, then he walks up and pulls them out
      const miss = L.spots.find(s => s.id === 'miss'), board = L.spots.find(s => s.id === 'board');
      if (O.ph === 'fetch') {
        O.t += dt;
        const at = B.x - 96, go = (at - T.home) / 190, pull = 0.9;
        if (O.t < go) { T.x = T.home + O.t * 190; T.walk = true; }
        else if (O.t < go + pull) { T.x = at; T.walk = false; T.reach = true; if (O.t > go + pull / 2) O.darts = []; }
        else if (O.t < go * 2 + pull) { T.reach = false; T.face = -1; T.walk = true; T.x = at - (O.t - go - pull) * 190; }
        else { T.x = T.home; T.face = 1; T.walk = false; O.ph = 'wait'; O.t = 0.8; O.n = 0; O.total = 0; O.visit++; }
      } else {
        O.t -= dt;
        if (O.ph === 'wait' && O.t <= 0) { O.ph = 'aim'; O.t = 1; }
        else if (O.ph === 'aim' && O.t <= 0) {
          const wild = O.wild; O.wild = false;
          const sc = wild ? 1 : O.visit === 0 ? 60 : [60, 20, 60, 19, 57, 5, 60, 26][(O.visit * 3 + O.n) % 8];
          const a = sc === 60 ? [-5 + O.n * 5, -0.58] : sc === 57 ? [9, -0.5] : sc === 1 ? [13, -0.84] : [-12 + O.n * 9, -0.15 - 0.2 * O.n];
          const h = ldnAt(T, 'throw');
          O.fly = { t: 0, x0: h.x, y0: h.y, x1: B.x + a[0], y1: B.y + a[1] * B.r, sc, wild };
          O.ph = 'fly'; Sound.play('jump');
        } else if (O.ph === 'fly') {
          const f = O.fly; f.t += dt / 0.3;
          if (f.t >= 1) {
            O.darts.push({ x: f.x1, y: f.y1 }); O.total += f.sc; O.n++; O.fly = null;
            Sound.play('tap'); Game.pop(B.x, B.y - B.r - 18, String(f.sc) + (f.wild ? '!' : ''), f.wild ? '#ff8a6a' : '#fff');
            if (Math.hypot(p.x - B.x, cy - B.y) < 60 && p.invuln <= 0 && !g.homeSafe) {   // a dart past her ears
              ldnBlow(g, -1, 2600); Game.pop(p.x, p.y - 34, 'Whoosh!', '#fff');
              Game.hint('Darts! Only land on the board when he has thrown all three.');
            }
            O.ph = O.n < 3 ? 'aim' : 'call'; O.t = O.n < 3 ? 0.9 : 0.7;
          }
        } else if (O.ph === 'call' && O.t <= 0) {
          const e = ldnAt(ref, 'head');
          Game.say(e.x, e.y - 34, ldnScoreWords(O.total) + '!', 2.2);
          if (O.total === 180) { Sound.play('score'); Game.fact('score'); }
          else if (O.hadWild) { Sound.play('oi'); Game.say(B.x - 250, 250, 'Ooooh!', 1.6); }
          O.hadWild = false; O.ph = 'fetch'; O.t = 0;
        }
      }
      miss.off = O.ph === 'fetch' || O.ph === 'call';
      board.off = !miss.off;
      T.throwing = O.ph === 'aim' ? 1 - Math.max(0, O.t) : O.ph === 'fly' ? 2 : 0;
      // jets of stage smoke between the stage and the crowd
      g.jetT = (g.jetT + dt) % 3.6;
      if (g.jetT < 1.1 && g.counts.warm && p.invuln <= 0 && !(g.shooed > 0) && !g.homeSafe) for (const jx of L.jets) if (Math.abs(p.x - jx) < 34) {
        ldnBlow(g, p.x < jx ? -1 : 1, 3000); p.vy = -220; Sound.play('jump'); Game.pop(p.x, p.y - 34, 'Whoosh!', '#fff');
        if (!g.toldJet) { g.toldJet = true; Game.hint('Stage smoke! Wait till the jet stops, then fly through.'); }
      }
    },
    hud(g) {
      const c = g.counts, tk = (k) => (c[k] ? '✔' : '–');
      setHud(!c.warm ? 'Hold Shiver to warm up' : c.miss && c.board && c.sip ? 'Fly up to the cold beam and sleep' : 'Player ' + tk('miss') + ' · Board ' + tk('board') + ' · Drink ' + tk('sip'), this.stat(g));
    },
  }),

  // ------------------------------------------------------------------ 7. Pill woodlouse, Highgate Wood
  // Her log has been rolled away. Walk, climb, and roll into a ball: down the sunny slope and through the ants, and
  // off the ramp over the puddle. Keep damp, munch three bits of rotting food, moult in two halves, hide from a
  // centipede, slip past the woodlouse spider at dusk, and find the damp crack under the big log.
  ldn_louse: ldnPart({
    id: 'ldn_louse', kind: 'louse', stage: 'Pill woodlouse', place: 'Highgate Wood, a warm afternoon', sprite: 'pillLouse', bg: 'ldnWood', scale: 2.6,
    world: { w: 3700, h: 600 }, action: 'Roll', later1: 'cousin', later2: 'legs', zoom: [1.25, 1.5],
    sex: 'You are a female.',
    facts: [
      'Highgate Wood is a very old wood in north London, full of hornbeam and oak trees.',
      'A woodlouse is not an insect. It’s a relative of crabs and shrimps that lives on land.',
      'The pill woodlouse can roll into a ball. Most woodlice can’t.',
    ],
    how: [
      'Someone has moved your log! Walk left and right by dragging, or with the arrow keys. Walk into a log and you climb it.',
      'Press Roll to curl into a ball. On a slope, a ball rolls fast! Steer, or press Unroll, to walk again.',
      'The sun dries you out: cross sunny ground fast, and rest under the leaves. Roll into a ball when ants are about.',
      'Hold Munch on three bits of food, and hold Moult in two hiding places.',
      'Hide from the centipede, wait for the spider to go in, and find the damp crack under the big log. Two cheeky extras are hidden here!',
    ],
    discoveries: [{ key: 'd_service', sprite: 'serviceLeaf', fx: 0.16, fy: 0.927 }, { key: 'd_seed', sprite: 'hornbeamSeed', fx: 0.52, fy: 0.927 }],
    sights: [{ key: 'sign', name: 'the wood’s name board', x: 568, y: 420 }, { key: 'bus', name: 'a red bus going by', mover: 'roadbus' }, { key: 'fountain', name: 'the old drinking fountain', x: 2085, y: 480 }, { key: 'squirrel', name: 'a grey squirrel', x: 2296, y: 480 }],
    factText: {
      start: 'You’re a pill woodlouse. Your damp log has been moved, so you need a new place to hide.',
      cousin: 'A woodlouse is not an insect. It’s a crustacean, like a crab or a shrimp, that lives on land.',
      legs: 'Woodlice have fourteen legs: seven pairs.',
      gills: 'Woodlice breathe through gill-like flaps under their back end, so they have to stay damp.',
      roll: 'The pill woodlouse can roll into a tight ball to keep safe. Most other woodlice can’t do it.',
      dry: 'Rolled into a ball, a pill woodlouse loses water more slowly.',
      rot: 'Woodlice eat dead wood, dead leaves and fungi. They help turn them back into soil.',
      moult1: 'A woodlouse sheds its skin in two halves. The back half comes off first.',
      moult2: 'A few days later the front half comes off too. Sometimes she eats the old skin.',
      poo: 'Woodlice eat their own poo! It’s thought they do it to get back the copper their blood needs.',
      drink: 'A woodlouse can drink through its bottom as well as its mouth.',
      ants: 'Ants hunt woodlice. Rolling into a ball is one way a pill woodlouse keeps safe.',
      centipede: 'Centipedes hunt woodlice. Hide under the leaves!',
      spider: 'The woodlouse spider has huge fangs for catching woodlice. It hides by day and hunts at night, with no web.',
      d_service: 'A wild service tree leaf. It’s a rare tree, and a sign that a wood is very old.',
      d_seed: 'A hornbeam seed. Highgate Wood is mostly hornbeam trees, with tall oaks among them.',
      win: 'A damp, dark crack, full of other woodlice! Later she’ll carry her eggs, and then her babies, in a pouch under her body.',
    },
    level() {
      const food = (id, x, look) => ({ id, kind: 'food', look, x, y: 548, r: 34, verb: 'Munch', hold: 0.8, pop: 'Munch!', fact: 'rot' });
      return {
        w: 3700, floor: 560, start: [90, 560],
        solids: [[960, 440, 150, 120, 'bark'], [2140, 500, 200, 32, 'stone'], [2540, 420, 130, 140, 'bark'], [3560, 420, 140, 108, 'biglog']],
        ledges: [],
        ramps: [[1110, 440, 1400, 560], [2670, 420, 2960, 540], [2960, 540, 3030, 510]],
        hides: [[740, 500, 170, 60, 'litter'], [1760, 500, 180, 60, 'litter'], [3400, 500, 140, 60, 'litter']],
        spots: [
          { id: 'poo', kind: 'poo', x: 230, y: 550, r: 30, verb: 'Munch', hold: 0.8, extra: true, pop: 'Poo! Yum?', fact: 'poo' },
          food('f1', 380, 'wood'),
          { id: 'm1', kind: 'moult', x: 825, y: 548, r: 40, verb: 'Moult', hold: 1.2, pop: 'Half a new suit!', fact: 'moult1' },
          food('f2', 1850, 'leaf'), food('f3', 2030, 'fungus'),
          { id: 'dew', kind: 'dew', x: 2440, y: 546, r: 30, verb: 'Drink', hold: 1, extra: true, pop: 'Slurp!', fact: 'drink' },
          food('f4', 3340, 'wood'),
          { id: 'm2', kind: 'moult', x: 3470, y: 548, r: 40, verb: 'Moult', hold: 1.2, need: { moult: 1 }, pop: 'All new!', fact: 'moult2' },
          { id: 'crack', kind: 'crack', x: 3610, y: 548, r: 44, need: { food: 3, moult: 2 }, goal: true, pop: 'Home!', fact: 'gills' }],
        need: { food: 3, moult: 2 },
        sun: [[470, 700], [1110, 1720]], ants: [1440, 1650], lair: [2140, 2340], puddle: [3040, 3150],
        checkpoints: [[730, 560], [1750, 560], [2070, 560], [2380, 560], [3190, 560]],
        route: [[380, 560, 'f1'], [825, 560, 'm1'], [1035, 440], [1730, 560], [1850, 560, 'f2'], [2030, 560, 'f3'], [2100, 560], [2380, 560], [2605, 420], [3190, 560], [3340, 560, 'f4'], [3470, 560, 'm2'], [3610, 560, 'crack']],
      };
    },
    start(g) {
      const A = g.level.ants;
      g.damp = 1; g.strikes = 0; g.antsOff = 0; g.curlT = 0;
      g.ants = []; for (let i = 0; i < 9; i++) g.ants.push({ x: A[0] + 10 + i * (A[1] - A[0] - 20) / 8, y: g.level.floor, v: (i % 2 ? 1 : -1) * (34 + (i * 7) % 20), face: 1 });
      g.spider = { state: 'in', t: 1.5 };
      g.player.rolled = false; g.player.moult = 0;
      // a bus goes along the road at the wood's edge now and then
      g.movers.push({ kind: 'roadbus', x: -999, y: 500, dir: 1, wait: 5, shown: false,
        update(g, dt) {
          if (!this.shown) { if ((this.wait -= dt) > 0) return; this.shown = true; this.dir = Math.random() < 0.5 ? 1 : -1; this.x = this.dir > 0 ? 330 : 840; if (Math.abs(g.player.x - 585) < 600) Sound.play('honk'); return; }
          this.x += this.dir * 120 * dt;
          if (this.x < 320 || this.x > 850) { this.shown = false; this.wait = 11 + Math.random() * 9; }
        } });
    },
    reset(g) { g.damp = 1; this.uncurl(g, true); },
    uncurl(g, quiet) { const p = g.player; if (!p.rolled) return; p.rolled = false; p.vx = 0; if (!quiet) Sound.play('tap'); },
    // The button when there's nothing else to do: Roll, and Unroll
    idle(g, input) {
      const p = g.player, slow = p.onGround && Math.abs(p.vx) < 30;
      if (p.rolled) { setAction('Unroll', slow); if (input.pressed && slow) this.uncurl(g); return; }
      setAction('Roll', true);
      if (input.pressed) {
        p.rolled = true; p.rollT = 0; Sound.play('pick'); Game.fact('roll');
        if (!g.toldRoll) { g.toldRoll = true; Game.hint('A ball can’t walk, but it rolls down slopes. Steer to uncurl.'); }
      }
    },
    done(g, s) {
      const p = g.player;
      if (s.kind === 'moult') p.moult = g.counts.moult;
      if (s.kind === 'poo') Sound.play('raspberry');
      if (s.kind === 'dew') { Sound.play('slurp'); g.damp = 1; }
      if (s.kind === 'food') Sound.play('munch');
    },
    tick(g, dt, input) {
      const p = g.player, L = g.level, A = L.ants, steering = Input.keys.size > 0 || !!Input.target;
      const inAnts = p.x > A[0] - 12 && p.x < A[1] + 12 && p.y > L.floor - 30 && !g.homeSafe;
      if (p.x < A[0]) g.antSide = -1; else if (p.x > A[1]) g.antSide = 1;
      // a ball that has stopped uncurls when you steer (not with ants all round it), or to get on with a task
      if (p.rolled) {
        p.rollT += dt;
        const slow = p.onGround && Math.abs(p.vx) < 12 && p.rollT > 0.5;
        if (slow && ((steering && !(inAnts && !(g.antsOff > 0))) || (g.spot && working(input)))) this.uncurl(g);
        if (p.onGround && Math.abs(p.vx) > 150 && !g.wheee) { g.wheee = true; Game.pop(p.x, p.y - 40, 'Wheee!', '#fff'); }
        p.spin = (p.spin || 0) + p.vx * dt / 11;
      }
      // damp: the sun dries her (less when rolled up), leaf litter and shade put it back
      const sun = L.sun.some(q => p.x > q[0] && p.x < q[1]) && !g.hidden;
      g.inSun = sun;
      if (g.homeSafe) { /* home and damp */ }
      else if (sun) {
        g.damp -= (p.rolled ? 0.05 : 0.14) * dt;
        if (!g.toldSun) { g.toldSun = true; Game.fact('gills'); g.toasts.unshift({ text: 'The sun dries you out! Get across fast. Leaves and shade make you damp again.', kind: 'hint' }); g.toastT = 0; }
        if (p.rolled) Game.fact('dry');
        if (g.damp <= 0) { g.damp = 1; Game.caught({ name: 'sun', caughtText: p.x > 1000 ? 'Too dry! Climb the log, press Roll and roll down the sunny slope. Back to the last damp spot.' : 'Too dry! Back to the last damp spot.' }); return; }
      } else g.damp = Math.min(1, g.damp + (g.hidden ? 0.5 : 0.08) * dt);
      // ants on their trail: they nip a walking woodlouse and shove her back; a ball they can only climb over
      g.antsOff = Math.max(0, g.antsOff - dt);
      for (const a of g.ants) {
        if (a.fly) { a.x += a.vx * dt; a.vy += 900 * dt; a.y += a.vy * dt; a.rot = (a.rot || 0) + dt * 12; if (a.y > L.floor) { a.y = L.floor; a.fly = false; a.v = (a.vx > 0 ? 1 : -1) * 40; a.rot = 0; } continue; }
        const flee = g.antsOff > 0 && Math.abs(a.x - p.x) < 150;
        a.x += (flee ? (a.x > p.x ? 1 : -1) * 70 : a.v) * dt;
        if (a.x < A[0] + 6) { a.x = A[0] + 6; a.v = Math.abs(a.v); } else if (a.x > A[1] - 6) { a.x = A[1] - 6; a.v = -Math.abs(a.v); }
        a.face = flee ? (a.x > p.x ? 1 : -1) : a.v > 0 ? 1 : -1;
      }
      if (inAnts) {
        if (!g.toldAnts) { g.toldAnts = true; Game.fact('ants'); }
        const near = g.ants.filter(a => !a.fly && Math.abs(a.x - p.x) < 26);
        if (p.rolled && Math.abs(p.vx) > 110) {   // bowling!
          for (const a of near) { a.fly = true; a.vx = Math.sign(p.vx) * (80 + Math.random() * 200); a.vy = -(240 + Math.random() * 220); g.strikes++; Sound.play('tap'); }
          if (g.strikes >= 3 && !g.struck) { g.struck = true; g.antsOff = 6; Sound.play('score'); Game.pop(p.x, p.y - 50, 'Strike!', '#ffd23f'); }
        } else if (p.rolled) {
          g.curlT += dt;
          if (g.curlT > 2.2 && !(g.antsOff > 0)) { g.antsOff = 6; g.curlT = 0; Game.pop(p.x, p.y - 44, 'The ants give up!', '#fff'); Sound.play('score'); }
        } else if (near.length && !(g.antsOff > 0) && p.invuln <= 0) {
          p.x = g.antSide > 0 ? A[1] + 70 : A[0] - 70; p.vx = 0; p.invuln = 1; g.curlT = 0;
          Sound.play('yelp'); Game.pop(p.x, p.y - 40, 'Nip!', '#fff');
          Game.hint('Ants! Press Roll to curl into a ball. Or climb the log and roll down the slope, right through them.');
        }
      } else g.curlT = 0;
      // the puddle past the ramp: too deep to walk
      if (p.y >= L.floor - 1 && p.x > L.puddle[0] + 8 && p.x < L.puddle[1] - 8) {
        this.uncurl(g, true); p.x = 2500; p.vx = 0; Sound.play('splat'); Game.pop(p.x, p.y - 40, 'Splash!', '#cfe6ff');
        Game.hint('Too deep! Climb the log, press Roll, and roll down the slope to jump the puddle.');
      } else if (p.rolled && p.onGround && p.x > L.puddle[1] && p.x < L.puddle[1] + 140 && !g.jumped) { g.jumped = true; Sound.play('boing'); Game.pop(p.x, p.y - 44, 'What a jump!', '#ffd23f'); }
      // evening comes on, and the woodlouse spider comes out from under its stone
      g.hz.dusk = clamp((p.x - 1850) / 700, 0, 1) * 0.85;
      const S = g.spider; S.t -= dt;
      if (S.state === 'in' && S.t <= 0) { S.state = 'warn'; S.t = 0.8; }
      else if (S.state === 'warn' && S.t <= 0) { S.state = 'out'; S.t = 2; }
      else if (S.state === 'out' && S.t <= 0) { S.state = 'in'; S.t = 3.6; }
      if (p.x > L.lair[0] - 330 && !g.toldSpider) { g.toldSpider = true; Game.fact('spider'); g.toasts.unshift({ text: 'The woodlouse spider! Wait till it goes back in, then run under the stone.', kind: 'hint' }); g.toastT = 0; }
      if (S.state === 'out' && p.x > L.lair[0] - 6 && p.x < L.lair[1] + 6 && p.y > L.floor - 30 && p.invuln <= 0 && !g.homeSafe) {
        this.uncurl(g, true); Game.caught({ name: 'woodlouse spider', caughtText: 'The woodlouse spider grabbed you! Back to the last safe spot.' });
      }
    },
    hazards(g) {
      const p = g.player;
      if (p.x > 1700 && !g.hz.centipede && !g.homeSafe) {
        g.hz.centipede = true; Game.fact('centipede'); Sound.play('caught');
        g.toasts.unshift({ text: 'A centipede! Hide under the leaves until it goes.', kind: 'hint' }); g.toastT = 0;
        g.preds.push(ldnHunter(g, { sprite: 'centipedeSide', name: 'centipede', from: p.x + 470, y: 556, speed: 100, alert: 1.5, chase: 5, reach: 22, scale: 1.5 }));
      }
    },
    hud(g) {
      const f = Math.min(3, g.counts.food || 0), mo = Math.min(2, g.counts.moult || 0), bars = Math.max(0, Math.ceil(g.damp * 5 - 0.001));
      setHud(f < 3 || mo < 2 ? 'Food: ' + f + ' / 3 · Moults: ' + mo + ' / 2' : 'Find the damp crack under the big log', 'Damp ' + '▮'.repeat(bars) + '▯'.repeat(5 - bars) + ' · ' + this.stat(g));
    },
  }),

  // ------------------------------------------------------------------ 8. The fox
  // Not a bug, but about a fifth of what a London fox eats is worms, beetles and other small creatures. Trot and
  // jump through the gardens: stand still to hear a worm, then pounce; snap a daddy-long-legs out of the air; pounce
  // on a mouse; cross the road between the cars and the night bus; get past the cat; and take the mouse home to the
  // cubs under the shed.
  ldn_fox: ldnPart({
    id: 'ldn_fox', kind: 'fox', stage: 'Fox', place: 'A south London street, a spring night', sprite: 'fox', bg: 'ldnStreet', scale: 1.5,
    world: { w: 4300, h: 600 }, action: 'Jump', later1: 'town', later2: 'fifth', zoom: [1, 1.2],
    sex: 'You are a vixen, a female fox, with cubs to feed.',
    facts: [
      'Thousands of foxes live in London. They are out mostly from dusk till dawn.',
      'A fox is not a bug, but it eats lots of them: worms, beetles and daddy-long-legs.',
      'Foxes hunt with their ears. They can hear a worm moving in the grass.',
    ],
    how: [
      'Trot left and right by dragging, or with the arrow keys. Press Jump to jump up onto walls and bins.',
      'On the grass, stand still and listen. When a worm comes up, press Pounce!',
      'Jump to snap the daddy-long-legs by the porch light. In the long grass, stand still, listen for the mouse, and Pounce.',
      'At the road, wait on the kerb till the lights have gone by, then run to the island in the middle. Don’t walk past the cat while it’s awake.',
      'Catch three snacks and a mouse, and take the mouse home to your cubs under the shed. Two cheeky extras are hidden here!',
    ],
    discoveries: [{ key: 'd_ball', sprite: 'chewedBall', fx: 0.18, fy: 0.925 }, { key: 'd_feather', sprite: 'feather', color: '#8a8a94', band: '#5a5a66', fx: 0.6, fy: 0.925 }],
    sights: [{ key: 'bus', name: 'the night bus', at: (g) => { const ln = g.level.road.lanes.find(q => q.kind === 'bus' && q.t < 1.6 && q.t > -0.2); return ln ? { x: ln.x, y: 450 } : null; } },
      { key: 'cab', name: 'a black cab', at: (g) => { const ln = g.level.road.lanes.find(q => q.kind === 'cab' && q.t < 1.6 && q.t > -0.2); return ln ? { x: ln.x, y: 450 } : null; } },
      { key: 'box', name: 'a red post box', x: 2714, y: 520 }, { key: 'shard', name: 'the Shard, lit up', x: 3016, y: 330 }],
    factText: {
      start: 'You’re a red fox, a vixen with hungry cubs to feed. Thousands of foxes live in London’s streets and gardens.',
      town: 'Foxes moved into Britain’s towns in the 1930s, when lots of houses with gardens were built.',
      fifth: 'About a fifth of what a London fox eats is worms, beetles and other small creatures.',
      listen: 'Foxes find worms by sound. They hunt them on lawns on warm, damp nights.',
      worm: 'She grips the worm in her front teeth and pulls it gently, so it doesn’t snap.',
      crane: 'Foxes eat lots of beetles and daddy-long-legs, also called craneflies.',
      pounce: 'A fox finds a mouse by the sounds it makes. Then she leaps high into the air and lands on it from above.',
      shoes: 'Foxes really do steal shoes! They take shoes, balls and dog toys back to the den for the cubs to play with.',
      mark: 'Foxes leave their droppings on top of things, where other foxes will find them. It’s a smelly message.',
      scent: 'Foxes mark the edges of their patch with wee. To another fox, the smell says: this is mine.',
      bus: 'London’s night buses run from about midnight till early morning. Their numbers start with N.',
      cat: 'When a fox meets a cat, it’s usually the fox that backs off.',
      d_ball: 'A chewed ball. Fox cubs play with anything their parents bring home.',
      d_feather: 'A pigeon feather. Town foxes often catch pigeons and rats.',
      win: 'Home! Town foxes often den under garden sheds. Four or five cubs are born in March, and both parents bring them food.',
    },
    level() {
      const prey = (id, x, kind, o) => Object.assign({ id, kind, prey: true, off: true, x, y: 552, r: 175, ring: 26, verb: 'Pounce', pop: kind === 'mouse' ? 'Got the mouse!' : 'Slurp! A worm', fact: kind === 'mouse' ? 'pounce' : 'worm' }, o);
      return {
        w: 4300, floor: 560, start: [120, 560],
        solids: [[900, 470, 44, 90, 'wall'], [1700, 300, 26, 210, 'fence'], [1860, 474, 60, 86, 'bin'], [1920, 474, 60, 86, 'bin'], [3400, 470, 220, 90, 'wall'], [4000, 380, 240, 130, 'denshed']],
        ledges: [],
        hides: [],
        spots: [
          prey('w1', 380, 'snack'), prey('w2', 660, 'snack'),
          { id: 'fly', kind: 'snack', ax: 1300, ay: 436, x: 1300, y: 436, r: 42, moving: true, pop: 'Snap! A daddy-long-legs', fact: 'crane' },
          { id: 'welly', kind: 'welly', x: 1520, y: 540, r: 46, verb: 'Nick', extra: true, pop: 'A welly for the cubs!', say: 'Oi! My welly!', sayAt: [1470, 330], fact: 'shoes' },
          { id: 'post', kind: 'post', x: 2110, y: 540, r: 40, pop: 'Wee! That means: mine', fact: 'scent' },
          prey('mouse', 2520, 'mouse', { listen: 0.9 }),
          prey('w3', 3720, 'snack'),
          { id: 'gnome', kind: 'gnome', x: 3920, y: 540, r: 44, verb: 'Poo', hold: 0.8, extra: true, pop: 'A message for other foxes!', fact: 'mark' },
          { id: 'den', kind: 'den', x: 4120, y: 546, r: 50, need: { snack: 3, mouse: 1 }, goal: true, pop: 'Dinner!', fact: 'fifth' }],
        need: { snack: 3, mouse: 1 },
        road: { x0: 2760, x1: 3260, island: [2990, 3030], lanes: [{ x: 2876, every: 5.6, t: 3 }, { x: 3144, every: 6.8, t: 5.2 }] },
        cat: { x: 3510, y: 470 }, dog: { x: 1640, y: 560 },
        checkpoints: [[960, 560], [1740, 560], [2300, 560], [2740, 560], [3290, 560], [3660, 560]],
        route: [[380, 560, 'w1'], [660, 560, 'w2'], [922, 470], [1300, 560, 'fly'], [1640, 560], [1780, 560], [1900, 474], [2110, 560, 'post'], [2520, 560, 'mouse'], [2740, 560], [3010, 560], [3290, 560], [3510, 470], [3720, 560, 'w3'], [4120, 560, 'den']],
      };
    },
    CAT_R: 105,
    start(g) {
      g.hz.cat = { state: 'asleep', t: 3 };
      g.pounce = null; g.stillT = 0; g.kinds = ['car', 'bus', 'cab', 'car'];
      // a train rattles over the viaduct now and then
      g.movers.push({ kind: 'vtrain', x: -999, y: 330, wait: 7, shown: false,
        update(g, dt) {
          if (!this.shown) { if ((this.wait -= dt) > 0) return; this.shown = true; this.x = 1700; if (Math.abs(g.player.x - 2230) < 900) Sound.play('tap'); return; }
          this.x += 330 * dt;
          if (this.x > 3700) { this.shown = false; this.wait = 14 + Math.random() * 10; }
        } });
      for (const ln of g.level.road.lanes) { ln.kind = 'car'; ln.n = 0; }
    },
    busy(g) { return !!g.pounce; },
    reset(g) { g.pounce = null; },
    idle(g, input) {
      const p = g.player;
      setAction('Jump', p.onGround);
      if (input.pressed && Plat.jump(this.P, p)) Sound.play('jump');
    },
    // A pounce is a leap first: up, over, and down on it from above
    complete(g, s) {
      if (!s.prey) return this.finish(g, s);
      const p = g.player;
      g.pounce = { s, t: 0, x0: p.x, y0: p.y, x1: s.x - (s.x > p.x ? 12 : -12), h: s.kind === 'mouse' ? 150 : 70, dur: s.kind === 'mouse' ? 0.7 : 0.45 };
      p.face = s.x > p.x ? 1 : -1; Sound.play('jump');
    },
    done(g, s) {
      if (s.prey) Sound.play(s.kind === 'mouse' ? 'score' : 'slurp');
      if (s.kind === 'gnome') Sound.play('raspberry');
      if (s.kind === 'den') g.player.carry = null;
    },
    tick(g, dt, input) {
      const p = g.player, L = g.level, R = L.road;
      // the leap of a pounce
      const J = g.pounce;
      if (J) {
        J.t += dt / J.dur;
        const k = Math.min(1, J.t);
        p.x = J.x0 + (J.x1 - J.x0) * k; p.y = J.y0 - J.h * 4 * k * (1 - k); p.vx = 0; p.vy = 0; p.air = k < 1;
        if (k >= 1) { g.pounce = null; p.y = J.y0; this.finish(g, J.s); }
      }
      // stand still and listen: a worm comes up (or the mouse squeaks); trot about and it's gone
      const still = p.onGround && Math.abs(p.vx) < 5 && !J;
      g.stillT = still ? g.stillT + dt : 0;
      p.listen = g.stillT > 0.25;
      for (const s of L.spots) if (s.prey && !s.done) {
        const d = Math.abs(s.x - p.x);
        if (!s.up) {
          s.off = true;
          if (d < 165 && d > 24 && g.stillT > (s.listen || 0.6)) { s.up = true; s.off = false; s.noise = 0; Sound.play('pick'); Game.pop(s.x, s.y - 34, s.kind === 'mouse' ? 'Squeak!' : 'A worm!', '#fff'); Game.fact('listen'); }
          else if (d < 200 && !still && !g.toldStill) { g.toldStill = true; g.toasts.unshift({ text: 'Stand still and listen… then press Pounce.', kind: 'hint' }); g.toastT = 0; }
        } else if (!J) {
          s.noise = still ? 0 : s.noise + dt;
          if (s.noise > 0.4 || d > 185) { s.up = false; s.off = true; Game.pop(s.x, s.y - 34, 'Gone!', '#fff'); Game.hint('Too noisy! Stand still and listen, then press Pounce.'); }
        }
      }
      p.carry = g.counts.mouse && !g.homeSafe ? 'mouse' : null;
      p.welly = !!g.counts.welly && !g.homeSafe;
      // the dog behind the gate
      if (Math.abs(p.x - L.dog.x) < 120 && !g.barked) {
        g.barked = true; Sound.play('yelp'); Game.say(L.dog.x, 470, 'Woof! Woof!', 1.6);
        Game.later(1.3, () => Game.say(1470, 296, 'Quiet, Rex!', 1.8));
      }
    },
    hazards(g, dt) {
      const p = g.player, L = g.level, R = L.road, h = g.hz;
      // the road: each lane's next car or bus shows its lights, then goes by
      const nearRoad = p.x > R.x0 - 700 && p.x < R.x1 + 400;
      for (const ln of R.lanes) {
        ln.t -= dt;
        if (ln.t < -1.2) { ln.t = ln.every + Math.random() * 1.6; ln.n++; ln.kind = g.kinds[(ln.n + (ln === R.lanes[0] ? 0 : 1)) % g.kinds.length]; ln.honked = false; }
        if (!nearRoad) continue;
        if (ln.t < 1.6 && !ln.honked) { ln.honked = true; if (Math.abs(p.x - ln.x) < 600) Sound.play(ln.kind === 'bus' ? 'honk' : 'tap'); if (ln.kind === 'bus') Game.fact('bus'); }
        if (ln.t < 0.12 && ln.t > -0.3 && Math.abs(p.x - ln.x) < 96 && p.y > L.floor - 70 && p.invuln <= 0 && !g.homeSafe) {
          Sound.play('honk'); g.pounce = null;
          Game.caught({ name: ln.kind, caughtText: 'Beep beep! Much too close. Back to the kerb.' });
        }
      }
      if (p.x > R.x0 - 260 && !g.toldRoad) { g.toldRoad = true; g.toasts.unshift({ text: 'A road! Wait on the kerb till the lights have gone by. The island in the middle is safe.', kind: 'hint' }); g.toastT = 0; }
      // the cat on the wall: awake, it won't let a fox by
      const c = h.cat, near = Math.hypot(p.x - L.cat.x, p.y - 15 - (L.cat.y - 30)) < this.CAT_R && !g.homeSafe;
      if (c.state !== 'swipe') c.t -= dt;   // a swipe counts up, for the drawing
      if (c.state === 'asleep' && c.t <= 0) { c.state = 'awake'; c.t = 3.5; }
      else if (c.state === 'awake' && c.t <= 0 && !near) { c.state = 'asleep'; c.t = 5.5; }
      else if (c.state === 'awake' && near && p.invuln <= 0) { c.state = 'alert'; c.t = 0.45; }
      else if (c.state === 'alert' && c.t <= 0) {
        c.state = 'swipe'; c.t = 0;
        if (near) { ldnBlow(g, p.x < L.cat.x ? -1 : 1, 5200); Sound.play('yelp'); Game.say(L.cat.x, L.cat.y - 70, 'Hssss!', 1.4); Game.fact('cat'); Game.hint('The cat won’t let you by! Wait till it goes to sleep.'); }
      } else if (c.state === 'swipe') { c.t += dt; if (c.t > 0.8) { c.state = 'awake'; c.t = 2.5; } }
    },
    hud(g) {
      const sn = Math.min(3, g.counts.snack || 0), mo = g.counts.mouse ? 1 : 0;
      setHud(sn < 3 || !mo ? 'Snacks: ' + sn + ' / 3 · Mouse: ' + mo + ' / 1' : 'Take the mouse home to the cubs!', this.stat(g));
    },
  }),
});

// ------------------------------------------------------------------ The wrestle (the Stag Beetle's second stage)
// One log at dusk, a female watching, three rival males of rising size. A wrestle, not a brawl, and timing, not
// mashing: one button whose word changes with the moment.
//   Push (hold): shove him along the log. It costs breath; let go to get it back. Stray taps cost breath too.
//   Get under! (press when he rears): your jaws go under him. Then hold Lift! and he is thrown off: round won.
//   Hold tight! (press when he dips): or he gets under you and carries you back toward your end.
// Shoving him right off his end wins the round as well. Off your own end is a fall: back on, the round again,
// and he is a little more tired each time, so it can't be lost for good. Stars are for how few falls it took.
const WRESTLE = {
  rivals: [
    { name: 'a small male', size: 0.86, push: 16, win: 0.95, lift: 1.0, gap: [3.4, 5.4], carry: 80 },
    { name: 'a big male', size: 1, push: 22, win: 0.8, lift: 1.3, gap: [3, 5], carry: 100 },
    { name: 'the giant of the log', size: 1.2, push: 27, win: 0.68, lift: 1.6, gap: [2.6, 4.4], carry: 115 },
  ],
  S: 3.6, L: 250, END: 375, Y: 392, G: 548, shove: 62, drain: 0.42, regain: 0.7, tap: 0.1, slam: 55, slip: 35,
};

Missions.ldn_wrestle = {
  id: 'ldn_wrestle', stage: 'The wrestle', place: 'A log in Richmond Park, dusk', view: 'side',
  get world() { return { w: W, h: H }; }, sprite: 'stagBeetle', bg: 'ldnLog',
  action: 'Push', radius: 16, speed: 0, scale: 1.6, noNet: true, gentle: true, explore: false,
  gentleText: 'You can’t lose this one. If you fall off the log, you climb back on and try that round again.',
  get home() { return { x: Math.round(W / 2), y: WRESTLE.Y, r: 1, label: '' }; },
  facts: [
    'Male stag beetles wrestle over the females. The loser is thrown off the log, or backs away.',
    'A male stands up on his back legs to throw his rival off.',
    'The bigger male usually wins.',
  ],
  how: [
    'Hold Push to shove him along the log. Pushing uses up your breath: let go to get it back.',
    'When he rears up, press Get under! Then hold Lift! and throw him off the log.',
    'When he dips his head, press Hold tight! or he will lift you and carry you back.',
    'Three rivals, each bigger than the last. Don’t mash the button: every tap costs breath.',
  ],
  factText: {
    start: 'Two males on one log, and a female watching. Male stag beetles wrestle over the females.',
    jaws: 'Only males have the big jaws, like a stag’s antlers. They use them to wrestle other males.',
    throw: 'Thrown! A male stands up on his back legs to throw his rival off the log.',
    size: 'In stag beetle fights the bigger male usually wins. You are not the biggest here, so timing is everything.',
    end: 'A fight usually ends when one beetle is thrown off or backs away.',
    win: 'Three rivals off the log! The log is yours, and the female has seen it all.',
  },

  setup(g) {
    const p = g.player; p.flat = true; p.x = Math.round(World.w / 2); p.y = WRESTLE.Y;
    g.wr = { round: 0, falls: 0, beaten: 0, state: 'ready', t: 0, pos: 0, breath: 1, resting: false, puffed: false, shoving: false,
      cue: null, cueT: 0, cueN: 0, cueIn: 3, lift: 0, loose: 0, ease: 0, slamT: 0, from: 0, over: false, won: false, told: {} };
    Game.fact('jaws');
  },
  locked() { return true; },
  move() {},
  rival(g) { return WRESTLE.rivals[Math.min(WRESTLE.rivals.length - 1, g.wr.round)]; },
  // How long a cue stays open: longer for the first two of the level, and longer each time you have fallen
  window(g) { const w = g.wr; return this.rival(g).win + w.ease * 0.6 + (w.cueN <= 2 ? 0.5 : 0); },
  go(g, state) { const w = g.wr; w.state = state; w.t = 0; w.cue = null; w.cueT = 0; w.slamT = 0; w.shoving = false; },
  update(g, dt, input) {
    const w = g.wr, K = WRESTLE, R = this.rival(g), p = g.player, cx = World.w / 2;
    p.x = cx + w.pos - 21 * K.S; p.y = K.Y;
    w.t += dt;
    if (w.over) { setAction('Push', false); return; }
    if (w.state === 'ready') {
      setAction('Push', false);
      if (w.t > 1.7) { this.go(g, 'push'); w.cueIn = R.gap[0] + Math.random() * (R.gap[1] - R.gap[0]); if (w.round === 1) Game.fact('size'); }
    } else if (w.state === 'push') this.pushing(g, dt, input, R);
    else if (w.state === 'lift') {
      setAction('Lift!', true);
      if (input.held) { w.lift += dt / R.lift; w.loose = 0; } else { w.lift = Math.max(0, w.lift - dt * 0.6); w.loose += dt; }
      if (w.lift >= 1) {
        w.beaten++; this.go(g, 'thrown');
        Sound.play('boing'); Game.pop(cx + w.pos + 30, K.Y - 190, 'Thrown off!', '#ffd23f'); Game.burst(cx + w.pos + 30, K.Y - 60, '#ffd23f', 14); Game.fact('throw');
      } else if (w.loose > 1.3) { this.go(g, 'push'); w.lift = 0; w.cueIn = 2.5; Game.pop(cx + w.pos + 30, K.Y - 150, 'He wriggled free!', '#fff'); }
      else if (w.loose > 0.5 && !w.told.lift) { w.told.lift = true; Game.hint('Hold Lift! to throw him off.'); }
    } else if (w.state === 'thrown' || w.state === 'off') {
      setAction('Push', false);
      if (w.t > 2.3) this.next(g);
    } else if (w.state === 'carried') {
      setAction('Push', false);
      const k = Math.min(1, w.t / 0.9);
      w.pos = w.from - w.carry * (k * k * (3 - 2 * k));
      if (w.pos <= -K.L) this.fall(g);
      else if (k >= 1) { this.go(g, 'push'); w.cueIn = 2.2 + Math.random() * 1.5; Game.pop(p.x, K.Y - 120, 'Oof!', '#fff'); }
    } else if (w.state === 'fall') {
      setAction('Push', false);
      if (w.t > 2 && w.roundFalls >= 4) this.next(g);   // four falls to one rival: he gives up on you, and the next one comes
      else if (w.t > 2) { w.pos = 0; w.breath = 1; w.puffed = false; w.lift = 0; this.go(g, 'ready'); Game.pop(cx, K.Y - 130, 'Back on the log!', '#fff'); }
    }
  },
  pushing(g, dt, input, R) {
    const w = g.wr, K = WRESTLE, p = g.player, cx = World.w / 2, ease = 1 - Math.min(0.55, w.ease);
    // breath: holding spends it, letting go gets it back, and a tap with nothing to answer wastes some
    if (input.held) w.breath = Math.max(0, w.breath - K.drain * dt); else w.breath = Math.min(1, w.breath + K.regain * dt);
    if (input.pressed && !w.cue) w.breath = Math.max(0, w.breath - K.tap);
    if (w.breath <= 0 && !w.puffed) { w.puffed = true; Game.pop(p.x, K.Y - 120, 'Puff… puff…', '#fff'); if (!w.told.puff) { w.told.puff = true; Game.hint('Out of breath! Let go of the button to get it back.'); } }
    if (w.puffed && w.breath > 0.4) w.puffed = false;
    w.resting = w.breath < 0.12 ? true : w.breath > 0.75 ? false : w.resting;
    w.shoving = !!input.held && !w.puffed && !w.cue;
    if (w.slamT > 0) { w.slamT -= dt; w.pos -= K.slam / 0.3 * dt; }
    else w.pos += ((w.shoving ? K.shove : 0) - R.push * ease) * dt;
    if (w.shoving && Math.random() < dt * 9) Game.burst(p.x - 40, K.Y - 2, '#c9b48a', 1);
    if (w.cue) {
      w.cueT += dt;
      setAction(w.cue === 'rear' ? 'Get under!' : 'Hold tight!', true);
      if (input.pressed && w.cueT > 0.06 && w.breath >= 0.1) {
        if (w.cue === 'rear') { this.go(g, 'lift'); w.lift = 0.12; w.loose = 0; Sound.play('pick'); Game.pop(p.x + 30, K.Y - 130, 'Got under him!', '#ffd23f'); }
        else { w.cue = null; w.pos += K.slip; w.cueIn = R.gap[0] + Math.random() * (R.gap[1] - R.gap[0]); Sound.play('score'); Game.pop(p.x, K.Y - 130, 'Held on!', '#ffd23f'); Game.fact('end'); }
      } else if (input.pressed && w.cueT > 0.06 && !w.told.air) { w.told.air = true; Game.hint('No breath left to do it! Keep some breath for when he moves.'); }
      else if (w.cueT > this.window(g)) {
        const kind = w.cue; w.cue = null; w.cueIn = R.gap[0] + Math.random() * (R.gap[1] - R.gap[0]);
        if (kind === 'rear') { w.slamT = 0.3; Sound.play('caught'); Game.pop(p.x, K.Y - 130, 'Wham!', '#fff'); g.shake = 0.25; }
        else { this.go(g, 'carried'); w.from = w.pos; w.carry = R.carry * (1 - Math.min(0.5, w.ease)); Sound.play('yelp'); Game.pop(p.x, K.Y - 140, 'He got under you!', '#fff'); }
      }
    } else {
      setAction('Push', true);
      if ((w.cueIn -= dt) <= 0) {
        w.cue = w.cueN === 0 ? 'rear' : w.cueN === 1 ? 'dip' : Math.random() < 0.55 ? 'rear' : 'dip';   // one of each first, to learn them
        w.cueT = 0; w.cueN++;
        if (w.cue === 'rear') { Sound.tone(520, 0.12, 'square', 0.1, 880); if (!w.told.rear) { w.told.rear = true; g.toasts.unshift({ text: 'He is rearing up! Press Get under! now.', kind: 'hint' }); g.toastT = 0; } }
        else { Sound.tone(520, 0.12, 'square', 0.1, 300); if (!w.told.dip) { w.told.dip = true; g.toasts.unshift({ text: 'He is going under you! Press Hold tight! now.', kind: 'hint' }); g.toastT = 0; } }
      }
      if (g.player.stillT > 4 && !w.told.push) { w.told.push = true; Game.hint('Hold Push to shove him along the log.'); }
    }
    if (w.state !== 'push') return;
    if (w.pos >= K.L) { w.beaten++; this.go(g, 'off'); Sound.play('score'); Game.pop(cx + K.L, K.Y - 130, 'He backs off!', '#ffd23f'); Game.fact('end'); }
    else if (w.pos <= -K.L) this.fall(g);
  },
  fall(g) {
    const w = g.wr;
    w.falls++; w.roundFalls = (w.roundFalls || 0) + 1; w.ease += 0.18; this.go(g, 'fall');
    Sound.play('caught'); Game.pop(World.w / 2 - WRESTLE.L - 60, WRESTLE.Y - 120, 'Off the log!', '#fff');
    g.toasts.unshift({ text: w.roundFalls >= 4 ? 'Four falls! He has had enough of this and wanders off.' : 'You fell off! Climb back on and try that round again. He is getting tired.', kind: 'hint' }); g.toastT = 0;
  },
  next(g) {
    const w = g.wr;
    w.round++; w.pos = 0; w.lift = 0; w.ease = 0; w.roundFalls = 0; w.breath = 1; w.puffed = false;
    if (w.round >= WRESTLE.rivals.length) { w.over = true; w.won = true; w.t = 0; g.score = 3; Sound.play('win'); }
    else { g.score = w.round; this.go(g, 'ready'); }
  },
  render(ctx, g) { LondonArt.wrestle(ctx, g, this); },
  hud(g) {
    const w = g.wr;
    setHud(w.over ? 'The log is yours!' : 'Round ' + (w.round + 1) + ' of 3', 'Falls: ' + w.falls);
  },
  stars(g) { const f = g.wr.falls; return f === 0 ? 3 : f <= 2 ? 2 : 1; },
  endLine(g) { const f = g.wr.falls; return f === 0 ? 'Not one fall! Three stars.' : 'Falls: ' + f + '. Fewer falls, more stars.'; },
  won(g) { return !!g.homeSafe || (g.wr.won && g.wr.t > 1.8); },
};
Missions.ldn_wrestle.sex = 'You are a male. Only the males have the antler jaws.';

// London's places: one pin on the London map and one Bug Book section a level, in the order the bus tour plays
// them (the first five are listed in js/london.js).
LDN_BUGS.push(
  { id: 'l_darts', stage: 'ldn_darts', name: 'The Ally Pally Wasp', sci: 'Vespula vulgaris', place: 'Alexandra Palace', pin: { x: 652, y: 106 } },
  { id: 'l_louse', stage: 'ldn_louse', name: 'Pill Woodlouse', sci: 'Armadillidium vulgare', place: 'Highgate Wood', pin: { x: 404, y: 104 } },
  { id: 'l_fox', stage: 'ldn_fox', name: 'Red Fox', sci: 'Vulpes vulpes', place: 'A street in south London', pin: { x: 478, y: 524 } },
  LDN_LADY);   // the flight up the Thames (js/flight-london.js): the tour's last stop
Object.assign(LDN_STOP, {
  ldn_darts: 'Alexandra Palace, in winter. Now you’re a queen wasp at the darts!',
  ldn_louse: 'Highgate Wood. Now you’re a pill woodlouse!',
  ldn_fox: 'a street in south London, at night. Now you’re a fox!',
});
LDN_BUGS.find(b => b.id === 'l_stag').more = ['ldn_wrestle'];   // the Stag Beetle has a second game; both are open from the start
for (const b of LDN_BUGS) {
  const stages = [b.stage].concat(b.more || []);
  Bugs.push({ id: b.id, name: b.name, sci: b.sci, place: b.place, sprite: Missions[b.stage].sprite, pin: b.pin, hub: 'london', kind: 'sandbox', stages, free: stages.length > 1 });
  for (const id of stages) Missions[id].bug = b.id;
}
const LDN_TOUR = LDN_BUGS.map(b => b.stage);
finishMissions();
