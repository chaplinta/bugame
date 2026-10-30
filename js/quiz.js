'use strict';
// The Bug quiz: eight short questions a round, answered by tapping a bug's picture (or, for "What is this?", one of
// three names), so a child who is still learning to read can play. Every question is one short line of plain words
// and can be read aloud. Each answer is a fact from the game, sourced in docs/facts.md (Bug quiz). The best round is
// saved; a perfect round earns the "Bug expert" secret.

// Who questions: q, the right bug (a), two wrong bugs, and one line of why. Only one of the three fits.
const QUESTIONS = [
  { q: 'Who has 8 legs?', a: 'spider', wrong: ['ant', 'bee'], why: 'Spiders have 8 legs. Insects have 6.' },
  { q: 'Who has only 2 wings?', a: 'bushFly', wrong: ['bee', 'dragonfly'], why: 'Flies have 2 wings. Bees and dragonflies have 4.' },
  { q: 'Who is not an insect?', a: 'snail', wrong: ['ant', 'ladybird'], why: 'A snail is a mollusc, not an insect.' },
  { q: 'Who spins a golden web?', a: 'orbSpider', wrong: ['spider', 'mosquito'], why: 'Golden orb-weavers spin big webs of golden silk.' },
  { q: 'Who dances with a colourful fan?', a: 'spider', wrong: ['butterfly', 'dragonfly'], why: 'Male peacock spiders dance and wave a bright fan.' },
  { q: 'Who lives in a nest under the ground?', a: 'sugarAnt', wrong: ['butterfly', 'dragonfly'], why: 'Sugar ants dig their nests under the ground.' },
  { q: 'Who drinks blood?', a: 'mosquito', wrong: ['bee', 'butterfly'], why: 'Only female mosquitoes bite. They need blood for their eggs.' },
  { q: 'Who buzzes pollen out of flowers?', a: 'bee', wrong: ['bushFly', 'moth'], why: 'Blue-banded bees shake pollen out by buzzing.' },
  { q: 'Who was a caterpillar first?', a: 'butterfly', wrong: ['dragonfly', 'ant'], why: 'A butterfly starts life as a caterpillar.' },
  { q: 'Who grew up under the water?', a: 'dragonfly', wrong: ['butterfly', 'bee'], why: 'Dragonfly nymphs live under the water for months.' },
  { q: 'Who jumps with a flick of its tail?', a: 'sandhopper', wrong: ['snail', 'ant'], why: 'Sandhoppers flick their tails to jump.' },
  { q: 'Who is not a bug at all?', a: 'frog', wrong: ['spider', 'snail'], why: 'A frog has a backbone inside, like you. It eats bugs!' },
  { q: 'Who buries cow pats?', a: 'dungBeetle', wrong: ['ladybird', 'bee'], why: 'Dung beetles bury cow pats so flies can’t breed in them.' },
  { q: 'Who flips in the air with a click?', a: 'clickBeetle', wrong: ['ladybird', 'ant'], why: 'A click beetle snaps its body to flip itself over.' },
  { q: 'Who walks on water?', a: 'waterStrider', wrong: ['ant', 'dragonfly'], why: 'Water striders stand on the skin of the water.' },
  { q: 'Who hides on tree bark?', a: 'moth', wrong: ['butterfly', 'bee'], why: 'A moth’s colours match the bark it rests on.' },
  { q: 'Who is a cousin of the cockroach?', a: 'termiteWorker', wrong: ['ant', 'bee'], why: 'Termites’ closest relatives are cockroaches.' },
  { q: 'Who carries its house on its back?', a: 'snail', wrong: ['ant', 'spider'], why: 'A snail carries its shell everywhere it goes.' },
  { q: 'Whose wings are made of tiny scales?', a: 'butterfly', wrong: ['dragonfly', 'bushFly'], why: 'Butterfly wings are covered in tiny scales, like roof tiles.' },
  { q: 'Who is the fastest flier here?', a: 'dragonfly', wrong: ['butterfly', 'mosquito'], why: 'Dragonflies dart faster than any butterfly or mosquito.' },
  { q: 'Who likes to sit on a cow?', a: 'bushFly', wrong: ['bee', 'butterfly'], why: 'Bush flies land on cows to drink and to lay their eggs.' },
  { q: 'Who can pull 1,000 times its weight?', a: 'hornBeetle', wrong: ['ant', 'frog'], why: 'A horned dung beetle pulled 1,141 times its own weight.' },
  { q: 'Who has a mum called a queen?', a: 'ant', wrong: ['spider', 'snail'], why: 'Ants live in a nest with a queen who lays the eggs.' },
  { q: 'Who has a safety line of silk?', a: 'spider', wrong: ['bee', 'dragonfly'], why: 'Jumping spiders glue a silk line down before every jump.' },
  { q: 'Who starts life in a cow pat?', a: 'bushFly', wrong: ['butterfly', 'dragonfly'], why: 'Bush fly eggs are laid in fresh cow pats.' },
  { q: 'Who sings like a motorbike?', a: 'frog', wrong: ['mosquito', 'bee'], why: 'The motorbike frog’s call sounds like a motorbike changing gear.' },
  { q: 'Who has big eyes at the front?', a: 'spider', wrong: ['snail', 'termiteWorker'], why: 'Jumping spiders judge their jumps with two big front eyes.' },
  { q: 'Who is a crustacean, like a crab?', a: 'sandhopper', wrong: ['ant', 'spider'], why: 'Sandhoppers are crustaceans, like crabs and prawns.' },
  { q: 'Who hunts alone, by sight?', a: 'ant', wrong: ['termiteWorker', 'snail'], why: 'Bull ants have big eyes and hunt alone.' },
  { q: 'Whose tongue curls up like a spring?', a: 'butterfly', wrong: ['ant', 'frog'], why: 'A butterfly’s long tongue curls up when it isn’t drinking.' },
  { q: 'Who shoots out its jaw to catch food?', a: 'nymph', wrong: ['snail', 'ant'], why: 'A skimmer nymph’s hinged jaw shoots out at its prey.' },
  { q: 'Who sleeps holding a stem in its jaws?', a: 'bee', wrong: ['butterfly', 'dragonfly'], why: 'Male blue-banded bees sleep gripping a stem with their jaws.' },
  { q: 'Who eats daisy leaves?', a: 'plCaterpillar', wrong: ['bee', 'dragonfly'], why: 'Painted lady caterpillars eat the leaves of daisies.' },
  { q: 'Who comes out mostly at night?', a: 'sugarAnt', wrong: ['bee', 'butterfly'], why: 'Sugar ants are busiest after dark.' },
  { q: 'Who has no wings yet?', a: 'nymph', wrong: ['dragonfly', 'butterfly'], why: 'A nymph’s wings are still growing in pads on its back.' },
  { q: 'Who seals its shell for the summer?', a: 'snail', wrong: ['ladybird', 'frog'], why: 'A native snail seals its shell to stay damp through summer.' },
];
// What is this? One picture, three names: the only reading in the quiz, and the speaker reads them too.
const WHAT_IS = [
  { pic: 'ant', wrong: ['termiteWorker', 'sugarAnt'] },
  { pic: 'bee', wrong: ['bushFly', 'mosquito'] },
  { pic: 'bushFly', wrong: ['bee', 'moth'] },
  { pic: 'butterfly', wrong: ['moth', 'dragonfly'] },
  { pic: 'snail', wrong: ['ladybird', 'sandhopper'] },
  { pic: 'spider', wrong: ['orbSpider', 'ant'] },
  { pic: 'dragonfly', wrong: ['butterfly', 'mosquito'] },
  { pic: 'sandhopper', wrong: ['snail', 'termiteWorker'] },
  { pic: 'mosquito', wrong: ['bushFly', 'bee'] },
  { pic: 'frog', wrong: ['snail', 'moth'] },
  { pic: 'termiteWorker', wrong: ['ant', 'sugarAnt'] },
  { pic: 'ladybird', wrong: ['dungBeetle', 'clickBeetle'] },
  { pic: 'orbSpider', wrong: ['spider', 'mosquito'] },
  { pic: 'dungBeetle', wrong: ['ladybird', 'clickBeetle'] },
];
const QUIZ_N = 8, QUIZ_WHAT = 3;   // questions a round, and how many of them are "What is this?"

function shuffled(list) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const Quiz = {
  round: [], i: 0, score: 0, answered: false, done: false,
  // A round: five Who questions and three What is this?, mixed, no bug's picture asked about twice
  build() {
    const who = shuffled(QUESTIONS).slice(0, QUIZ_N - QUIZ_WHAT).map(q => Object.assign({ kind: 'who' }, q));
    const used = new Set();
    const what = [];
    for (const w of shuffled(WHAT_IS)) { if (what.length >= QUIZ_WHAT || used.has(w.pic)) continue; used.add(w.pic); what.push({ kind: 'what', q: 'What is this?', a: w.pic, wrong: w.wrong, why: 'This is a ' + BUG_NAMES[w.pic].toLowerCase() + '.' }); }
    return shuffled(who.concat(what));
  },
  start() {
    this.round = this.build(); this.i = 0; this.score = 0; this.done = false;
    show('quiz');
    this.ask();
  },
  current() { return this.round[this.i]; },
  ask() {
    const q = this.current();
    this.answered = false;
    $('quizCount').textContent = 'Question ' + (this.i + 1) + ' of ' + QUIZ_N;
    this.stars();
    $('quizQ').textContent = q.q;
    $('quizWhy').textContent = ''; $('quizWhy').className = 'quizWhy';
    $('quizNext').textContent = 'Next'; $('quizNext').disabled = true;
    const pic = $('quizPic');
    pic.hidden = q.kind !== 'what';
    if (q.kind === 'what') portrait(pic.querySelector('canvas'), q.a, this.picSize() + 34, this.opts(q.a));
    const box = $('quizA');
    box.innerHTML = '';
    q.choices = shuffled([q.a].concat(q.wrong));
    q.choices.forEach((name, i) => {
      const b = document.createElement('button');
      b.className = 'quizA' + (q.kind === 'what' ? ' nameOnly' : '');
      b.dataset.name = name;
      if (q.kind === 'who') { const c = document.createElement('canvas'); b.appendChild(c); portrait(c, name, this.picSize(), this.opts(name)); }
      const s = document.createElement('span'); s.textContent = BUG_NAMES[name]; b.appendChild(s);
      b.addEventListener('click', () => this.answer(i));
      box.appendChild(b);
    });
    Speech.say(this.spoken());   // read aloud when "Read to me" is on
  },
  picSize() { return window.matchMedia('(max-width: 600px)').matches ? 76 : 96; },
  opts(name) { return Object.assign({ moving: false, load: 0 }, typeof Paint !== 'undefined' ? Paint.optsOf(name) : {}); },
  spoken() { const q = this.current(); return q.q + ' ' + q.choices.map(n => BUG_NAMES[n]).join(', or ') + '?'; },
  answer(i) {
    if (this.answered || this.done) return;
    const q = this.current(), pick = q.choices[i], right = pick === q.a;
    this.answered = true;
    if (right) this.score++;
    for (const b of $('quizA').querySelectorAll('.quizA')) {
      b.disabled = true;
      if (b.dataset.name === q.a) b.classList.add('right');
      else if (b.dataset.name === pick) b.classList.add('wrong');
    }
    const why = $('quizWhy');
    why.textContent = (right ? 'Yes! ' : 'Not that one. ') + q.why;
    why.className = 'quizWhy ' + (right ? 'yes' : 'no');
    Sound.play(right ? 'score' : 'tap');
    this.stars();
    $('quizNext').disabled = false;
    $('quizNext').textContent = this.i + 1 < QUIZ_N ? 'Next' : 'See my score';
    Speech.say(why.textContent);
  },
  stars() {
    let s = '';
    for (let k = 0; k < QUIZ_N; k++) s += k < this.score ? '★' : k < this.i + (this.answered ? 1 : 0) ? '☆' : '·';
    $('quizStars').textContent = s;
  },
  next() {
    if (this.done) { this.start(); return; }
    if (!this.answered) return;
    if (this.i + 1 < QUIZ_N) { this.i++; this.ask(); return; }
    this.finish();
  },
  finish() {
    this.done = true;
    const best = Progress.best('quiz'), improved = Progress.setBest('quiz', this.score, true);
    $('quizCount').textContent = 'The end!';
    $('quizQ').textContent = 'You got ' + this.score + ' out of ' + QUIZ_N + '!';
    $('quizPic').hidden = true; $('quizA').innerHTML = '';
    let line = this.score === QUIZ_N ? 'Every one right. You’re a bug expert!' : this.score >= 6 ? 'Great work! Play again to get them all.' : 'Good try! Every bug has its own facts. Play again!';
    if (improved && best !== undefined) line += ' A new best!';
    else if (best !== undefined && !improved) line += ' Your best is ' + Math.max(best, this.score) + ' out of ' + QUIZ_N + '.';
    if (this.score === QUIZ_N && !Progress.hasSecret('s_quiz')) { Progress.addSecret('s_quiz'); line += ' Secret found: Bug expert!'; }
    const why = $('quizWhy'); why.textContent = line; why.className = 'quizWhy yes';
    $('quizNext').textContent = 'Play again'; $('quizNext').disabled = false;
    Sound.play(this.score === QUIZ_N ? 'win' : 'score');
    Speech.say($('quizQ').textContent + ' ' + line);
  },
  read() { Speech.say(this.done ? $('quizQ').textContent + ' ' + $('quizWhy').textContent : this.spoken() + (this.answered ? ' ' + $('quizWhy').textContent : ''), true); },
};

$('quizBtn').addEventListener('click', () => { Sound.play('tap'); Quiz.start(); });
$('quizBack').addEventListener('click', () => { Speech.stop(); buildMap(); });
$('quizNext').addEventListener('click', () => { Sound.play('tap'); Quiz.next(); });
$('quizSpeak').addEventListener('click', () => Quiz.read());
