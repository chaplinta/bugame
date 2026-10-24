'use strict';
// Map, bug page, end screen and Bug Book.

// Saved progress: stars per mission, fact keys found per mission, secrets, and best results (the Olympics).
const Progress = {
  data: { stars: {}, facts: {}, secrets: [], best: {} },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('bugame.progress') || '{}');
      this.data = { stars: d.stars || {}, facts: d.facts || {}, secrets: d.secrets || [], best: d.best || {} };
    } catch (e) { /* storage off */ }
  },
  best(id) { return this.data.best[id]; },
  // Keep a result when it beats the saved one (or there is none); true when it did.
  setBest(id, v, higherIsBetter) {
    const old = this.data.best[id];
    if (old !== undefined && (higherIsBetter ? v <= old : v >= old)) return false;
    this.data.best[id] = v; this.save(); return true;
  },
  save() { try { localStorage.setItem('bugame.progress', JSON.stringify(this.data)); } catch (e) { /* storage off */ } },
  stars(id) { return this.data.stars[id] || 0; },
  setStars(id, n) { this.data.stars[id] = Math.max(this.stars(id), n); this.save(); },
  found(id) { return this.data.facts[id] || []; },
  addFact(id, key) {
    const list = this.data.facts[id] || (this.data.facts[id] = []);
    if (!list.includes(key)) { list.push(key); this.save(); }
  },
  addSecret(key) { if (!this.data.secrets.includes(key)) { this.data.secrets.push(key); this.save(); } },
  hasSecret(key) { return this.data.secrets.includes(key); },
  // A stage is open when it is the first one or the one before it is done (bug.free: every stage is open).
  unlocked(bug, i) { return i === 0 || !!bug.free || this.stars(bug.stages[i - 1]) > 0; },
};
Progress.load();

const $ = (id) => document.getElementById(id);
let currentBug = null, currentMission = null;

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === id);
  window.scrollTo(0, 0);
}

// Small bugs need a bigger icon to match the others.
const ICON_SCALE = { bushFly: 2.2, termiteWorker: 1.6, butterfly: 1.3, mosquito: 2.4, sandhopper: 1.5 };
const SIDE_VIEW = { sandhopper: true };   // drawn from the side, so not turned to face up

// A bug's picture on a canvas. o: extra sprite state (a painted design, a pose); remembered on the canvas for redraws.
function portrait(canvas, sprite, size, o) {
  canvas.dataset.sprite = sprite; canvas.dataset.size = size; canvas.dataset.o = o ? JSON.stringify(o) : '';
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr; canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const k = size / 55 * (ICON_SCALE[sprite] || 1), angle = SIDE_VIEW[sprite] ? 0 : -Math.PI / 2;
  const st = Object.assign({ moving: false, load: 0 }, o || {});
  // 3D models come as bitmaps; the 2D drawings draw live. The bug faces up the page either way.
  if (typeof SpriteCache !== 'undefined' && SpriteCache.blit(ctx, sprite, st, 0.4, { x: size / 2, y: size / 2, scale: k, angle })) return;
  ctx.translate(size / 2, size / 2);
  ctx.rotate(angle);
  ctx.scale(k, k);
  Sprites[sprite](ctx, st, 0.4);
}
// Every portrait on the page again (the 3D renderer came up, the 3D setting changed, a design was painted).
function redrawPortraits() {
  for (const el of document.querySelectorAll('canvas[data-sprite]')) portrait(el, el.dataset.sprite, +el.dataset.size || 56, el.dataset.o ? JSON.parse(el.dataset.o) : undefined);
}
// Redraw the map pins once the 3D renderer is up (the map is built before three.js has loaded).
if (typeof Render3D !== 'undefined') Render3D.whenReady(redrawPortraits);

function bugSprite(bug) { return bug.sprite; }
// How a level is seen, when it isn't the usual top-down view.
function viewTag(m) { return { side: 'Side-on', iso: 'Isometric', '3d': '3D', build: 'Build', camera: 'Camera' }[m && m.view] || ''; }
function bugStars(bug) { return bug.stages.reduce((n, id) => n + Progress.stars(id), 0); }

function fillList(el, items) {
  el.innerHTML = '';
  for (const t of items) { const li = document.createElement('li'); li.textContent = t; el.appendChild(li); }
}

// ---------------------------------------------------------------- Map

function drawMap() {
  const c = $('mapCanvas');
  const dpr = window.devicePixelRatio || 1;
  c.width = W * dpr; c.height = H * dpr;
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawPerthMap(ctx, W, H);
}

function buildMap() {
  const pins = $('pins'), places = $('placeList');
  pins.innerHTML = '';
  places.innerHTML = '';
  for (const bug of Bugs) {
    const b = document.createElement('button');
    b.className = 'pin';
    // The CSS clamps these, so a pin near the edge stays on the map.
    b.style.setProperty('--x', (bug.pin.x / W * 100) + '%');
    b.style.setProperty('--y', (bug.pin.y / H * 100) + '%');
    const max = bug.stages.length * 3, got = bugStars(bug);
    b.innerHTML = '<span class="viewTag"></span><canvas></canvas><span class="pinName"></span><span class="pinPlace"></span><span class="pinStars"></span>';
    const vt = viewTag(Missions[bug.stages[0]]);
    b.querySelector('.viewTag').textContent = vt;
    portrait(b.querySelector('canvas'), bugSprite(bug), 56);
    b.querySelector('.pinName').textContent = bug.name;
    b.querySelector('.pinPlace').textContent = bug.place;
    b.querySelector('.pinStars').textContent = got ? '★ ' + got + ' / ' + max : '';
    b.setAttribute('aria-label', bug.name + ', ' + bug.place);
    b.addEventListener('click', () => { Sound.play('tap'); openBug(bug); });
    pins.appendChild(b);
    // Same places as a list, shown on narrow screens where pins are icons only.
    const row = document.createElement('button');
    row.innerHTML = '<canvas></canvas><span><b></b><small></small></span>';
    portrait(row.querySelector('canvas'), bugSprite(bug), 44);
    row.querySelector('b').textContent = bug.name + (vt ? ' (' + vt + ')' : '');
    row.querySelector('small').textContent = bug.place + (got ? ' \u00b7 \u2605 ' + got + ' / ' + max : '');
    row.addEventListener('click', () => { Sound.play('tap'); openBug(bug); });
    places.appendChild(row);
  }
  syncToggles();
  show('map');
}

// ---------------------------------------------------------------- Bug page

function openBug(bug, missionId) {
  currentBug = bug;
  $('bugTree').hidden = bug.kind === 'sandbox';
  $('bugName').textContent = bug.name;
  $('bugSci').textContent = bug.sci;
  portrait($('bugPic'), bugSprite(bug), 120);
  // Default: first unlocked stage not yet finished, else the last stage.
  let pick = missionId;
  if (!pick) {
    pick = bug.stages[bug.stages.length - 1];
    for (let i = 0; i < bug.stages.length; i++) {
      if (Progress.unlocked(bug, i) && !Progress.stars(bug.stages[i])) { pick = bug.stages[i]; break; }
    }
  }
  selectStage(pick);
  show('bug');
}

function selectStage(id) {
  const bug = currentBug, m = Missions[id];
  currentMission = m;
  const box = $('stages');
  box.innerHTML = '';
  box.style.display = bug.stages.length > 1 ? '' : 'none';
  bug.stages.forEach((sid, i) => {
    const sm = Missions[sid], open = Progress.unlocked(bug, i);
    const b = document.createElement('button');
    b.className = 'stageBtn' + (sid === id ? ' on' : '');
    b.disabled = !open;
    const st = Progress.stars(sid);
    b.textContent = (i + 1) + '. ' + sm.stage + (viewTag(sm) ? ' · ' + viewTag(sm) : '') + (open ? (st ? ' ' + '★'.repeat(st) : '') : ' (locked)');
    b.addEventListener('click', () => selectStage(sid));
    box.appendChild(b);
  });
  const best = m.unit && Progress.best(id) !== undefined ? ' · Your best: ' + Progress.best(id) + m.unit : '';   // an Olympics event
  $('stagePlace').textContent = (bug.stages.length > 1 ? '' : m.stage + ' · ') + m.place + (viewTag(m) ? ' · ' + viewTag(m) + ' view' : '') + best;
  $('stageSex').textContent = m.sex || '';
  fillList($('stageFacts'), m.facts);
  fillList($('stageHow'), m.gentle ? m.how.concat('You can\u2019t lose this one. If you get caught you just go home.') : m.how);
}

function readStage() {
  const m = currentMission;
  Speech.say(currentBug.name + '. ' + m.facts.join(' ') + ' How to play. ' + m.how.join(' '), true);
}

// If a level hits an error, go back to the map with a friendly note instead of freezing.
Game.onCrash = () => {
  Game.stop();
  buildMap();
  $('crashNote').hidden = false;
  setTimeout(() => { $('crashNote').hidden = true; }, 6000);
};

function startGame() {
  if (typeof Night !== 'undefined' && Night.fallen) { Night.showScreen(); return; }
  Speech.stop();
  show('play');
  syncToggles();
  // Shout to buzz was left on last visit: the Start tap is the gesture that lets the page ask for the microphone again
  if (Settings.mic && typeof Mic !== 'undefined' && !Mic.active) Mic.start().then((ok) => { if (!ok) { Settings.mic = false; Settings.save(); syncToggles(); } });
  try { Game.start(currentMission); } catch (e) { console.error(e); Game.onCrash(e); }
}

// ---------------------------------------------------------------- End

Game.onFact = (missionId, key) => Progress.addFact(missionId, key);
// Stars are saved the moment a level is won, so leaving during the confetti keeps them.
// Stars for a win: the hearts left, or the mission's own rule (medals in the Olympics).
function starsFor(m, g) { return m.stars ? m.stars(g) : g.lives; }

Game.onWin = (g) => {
  if (!currentMission) return;
  g.firstWin = !Progress.stars(currentMission.id);   // the end screen says what this win unlocked
  Progress.setStars(currentMission.id, starsFor(currentMission, g));
};

Game.onEnd = (won, g) => {
  const m = currentMission, bug = currentBug;
  const stars = won ? starsFor(m, g) : 0;
  const idx = bug.stages.indexOf(m.id);
  const next = bug.stages[idx + 1];
  const wasLocked = next && !bug.free && (g.firstWin || !Progress.stars(m.id));
  if (won) Progress.setStars(m.id, stars);
  $('endTitle').textContent = won ? 'Well done, ' + bug.name + '!' : 'Caught! Try again?';
  $('endStars').textContent = won ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
  $('endUnlock').textContent = won && m.endLine ? m.endLine(g) : won && wasLocked ? 'New stage unlocked: ' + Missions[next].stage + '!' : '';
  fillList($('endFacts'), g.learned);
  $('endNext').style.display = won && next ? '' : 'none';
  $('endExplore').style.display = won ? '' : 'none';
  $('endExplore').classList.toggle('secondary', !!next);
  $('endAgain').classList.toggle('secondary', !!won);
  show('end');
  if (won) Speech.say($('endTitle').textContent + ' ' + m.factText.win);
};

// ---------------------------------------------------------------- Bug Book

function buildBook() {
  const list = $('bookList');
  list.innerHTML = '';
  for (const bug of Bugs) {
    const sec = document.createElement('section');
    sec.className = 'bookBug panel';
    let total = 0, found = 0;
    const items = [];
    for (const id of bug.stages) {
      const m = Missions[id], have = Progress.found(id);
      for (const f of m.facts) items.push({ text: f, known: true });
      for (const key of Object.keys(m.factText)) {
        if (!m.factText[key]) continue;   // nothing to find
        total++;
        const known = have.includes(key);
        if (known) found++;
        items.push({ text: known ? m.factText[key] : '??? Play ' + bug.name + (bug.stages.length > 1 ? ' (' + m.stage + ')' : '') + ' to find this one.', known });
      }
    }
    sec.innerHTML = '<div class="bookHead"><canvas></canvas><div><h2></h2><p class="sci"></p><p class="count"></p></div></div><ul class="facts"></ul>';
    portrait(sec.querySelector('canvas'), bugSprite(bug), 80);
    sec.querySelector('h2').textContent = bug.name;
    sec.querySelector('.sci').textContent = bug.sci + ' · ' + bug.place;
    sec.querySelector('.count').textContent = 'Facts found: ' + found + ' / ' + total;
    if (bug.book) {   // the Olympics: medals and best results
      const line = document.createElement('p');
      line.className = 'count medals';
      line.textContent = bug.book();
      sec.querySelector('.bookHead div').appendChild(line);
    }
    const ul = sec.querySelector('ul');
    for (const it of items) {
      const li = document.createElement('li');
      li.textContent = it.text;
      if (!it.known) li.className = 'unknown';
      ul.appendChild(li);
    }
    list.appendChild(sec);
  }
  // Secrets found anywhere in the game.
  const all = SECRETS.all(), got = all.filter(s => Progress.hasSecret(s.key));
  const sec = document.createElement('section');
  sec.className = 'bookBug panel secrets';
  sec.innerHTML = '<div class="bookHead"><div><h2>Secrets</h2><p class="count"></p></div></div><ul class="facts"></ul>';
  sec.querySelector('.count').textContent = 'Secrets found: ' + got.length + ' / ' + all.length;
  const ul = sec.querySelector('ul');
  for (const s of all) {
    const li = document.createElement('li');
    const known = Progress.hasSecret(s.key);
    li.textContent = known ? s.name + ': ' + s.text.replace(/^Tap.*|^Press.*/, 'found!') : '??? Keep exploring\u2026';
    if (!known) li.className = 'unknown';
    ul.appendChild(li);
  }
  list.appendChild(sec);
  show('book');
}

// ---------------------------------------------------------------- Map secrets

Game.onSecret = (key) => Progress.addSecret(key);

function mapSecret(key, text, draw) {
  const pop = $('secretPop');
  const c = pop.querySelector('canvas');
  const ctx = c.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  c.width = 160 * dpr; c.height = 160 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, 160, 160);
  ctx.translate(80, 90);
  ctx.scale(1.4, 1.4);
  draw(ctx);
  pop.querySelector('p').textContent = text;
  pop.hidden = false;
  Sound.play('win');
  Speech.say(text);
  Progress.addSecret(key);
}

// Tap Rottnest: a quokka says hello.
$('rottnest').addEventListener('click', () => mapSecret('s_quokka',
  'A quokka! Quokkas live on Rottnest Island. In 1696 a Dutch explorer thought they were giant rats, and named the island \u201crat\u2019s nest\u201d.',
  (ctx) => Sprites.quokka(ctx)));
$('secretClose').addEventListener('click', () => { $('secretPop').hidden = true; Speech.stop(); });

// Tap the title lots of times: a parade of bugs marches across the map.
let titleTaps = 0, titleTimer = 0;
$('title').addEventListener('click', () => {
  titleTaps++;
  clearTimeout(titleTimer);
  titleTimer = setTimeout(() => { titleTaps = 0; }, 1500);
  if (titleTaps < 5) return;
  titleTaps = 0;
  bugParade();
});

function bugParade() {
  const c = $('parade');
  const dpr = window.devicePixelRatio || 1;
  c.width = W * dpr; c.height = H * dpr;
  c.hidden = false;
  const ctx = c.getContext('2d');
  const marchers = Bugs.map((b, i) => ({ sprite: b.sprite, x: -60 - i * 70, y: 300 + Math.sin(i) * 40 }));
  const start = performance.now();
  Sound.play('win');
  const step = (now) => {
    const t = (now - start) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const m of marchers) {
      const x = m.x + t * 180, y = m.y + Math.sin(t * 8 + m.x) * 6, k = 1.6 * (ICON_SCALE[m.sprite] || 1);
      if (typeof SpriteCache !== 'undefined' && SpriteCache.blit(ctx, m.sprite, { moving: true, load: 0 }, t, { x, y, scale: k })) continue;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      Sprites[m.sprite](ctx, { moving: true, load: 0 }, t);
      ctx.restore();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#c8501e'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
    if (t < 3) ctx.fillText('Bug parade!', W / 2, 120);
    if (t < 9) requestAnimationFrame(step); else c.hidden = true;
  };
  requestAnimationFrame(step);
  if (!Progress.hasSecret('s_parade')) Progress.addSecret('s_parade');
}

// ---------------------------------------------------------------- Settings

function syncToggles() {
  for (const b of document.querySelectorAll('.toggle')) {
    const on = Settings[b.dataset.setting];
    b.setAttribute('aria-pressed', on);
    b.classList.toggle('off', !on);
  }
  $('hudSound').textContent = Settings.sound ? '♪' : '♪̸';
  $('hudSound').classList.toggle('off', !Settings.sound);
}

for (const b of document.querySelectorAll('.toggle')) {
  b.addEventListener('click', () => {
    const k = b.dataset.setting;
    Settings[k] = !Settings[k];
    Settings.save();
    syncToggles();
    if (k === 'speech' && Settings.speech) Speech.say('I will read the bug facts to you.');
    if (k === 'speech' && !Settings.speech) Speech.stop();
    if (k === 'sound') Sound.play('tap');
    if (k === 'threeD' && typeof Render3D !== 'undefined') {
      Render3D.toggle(Settings.threeD);
      redrawPortraits();   // the pins follow the setting
    }
    if (k === 'mic' && typeof Mic !== 'undefined') {
      // The click is the gesture that lets the page ask for the microphone. If it can't be had, the toggle goes back off.
      if (Settings.mic) Mic.start().then((ok) => { if (!ok) { Settings.mic = false; Settings.save(); syncToggles(); } else Speech.say('Shout BUZZ to buzz!', true); });
      else Mic.stop();
    }
  });
}
$('hudSound').addEventListener('click', () => { Settings.sound = !Settings.sound; Settings.save(); syncToggles(); });

$('bugBack').addEventListener('click', () => { Speech.stop(); buildMap(); });
$('readBtn').addEventListener('click', readStage);
$('bugStart').addEventListener('click', startGame);
$('endAgain').addEventListener('click', startGame);
$('endExplore').addEventListener('click', () => { show('play'); Game.resume(); });
$('endNext').addEventListener('click', () => {
  const next = currentBug.stages[currentBug.stages.indexOf(currentMission.id) + 1];
  openBug(currentBug, next);
});
$('endMap').addEventListener('click', buildMap);
$('bookBtn').addEventListener('click', buildBook);
$('bookBack').addEventListener('click', buildMap);
$('menuBtn').addEventListener('click', () => { Game.stop(); buildMap(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && Game.running) { Game.stop(); buildMap(); } });

// "Install app" button: Android Chrome and desktop browsers offer this once the game qualifies.
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  $('installBtn').hidden = false;
});
$('installBtn').addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  try { await installPrompt.userChoice; } catch (e) { /* dismissed */ }
  installPrompt = null;
  $('installBtn').hidden = true;
});
window.addEventListener('appinstalled', () => { $('installBtn').hidden = true; });

Game.init($('game'));
drawMap();
buildMap();

// Cache the game for offline play. Service workers need http(s); opening the file directly already works offline.
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* not allowed here */ }));
}
