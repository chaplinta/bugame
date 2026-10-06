'use strict';
// Map, bug page, end screen and Bug Book.

// Saved progress: stars per mission and fact keys found per mission.
const Progress = {
  data: { stars: {}, facts: {} },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('bugame.progress') || '{}');
      this.data = { stars: d.stars || {}, facts: d.facts || {} };
    } catch (e) { /* storage off */ }
  },
  save() { try { localStorage.setItem('bugame.progress', JSON.stringify(this.data)); } catch (e) { /* storage off */ } },
  stars(id) { return this.data.stars[id] || 0; },
  setStars(id, n) { this.data.stars[id] = Math.max(this.stars(id), n); this.save(); },
  found(id) { return this.data.facts[id] || []; },
  addFact(id, key) {
    const list = this.data.facts[id] || (this.data.facts[id] = []);
    if (!list.includes(key)) { list.push(key); this.save(); }
  },
  // A stage is open when it is the first one or the one before it is done.
  unlocked(bug, i) { return i === 0 || this.stars(bug.stages[i - 1]) > 0; },
};
Progress.load();

const $ = (id) => document.getElementById(id);
let currentBug = null, currentMission = null;

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === id);
  window.scrollTo(0, 0);
}

// Small bugs need a bigger icon to match the others.
const ICON_SCALE = { bushFly: 2.2 };

function portrait(canvas, sprite, size) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr; canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(size / 2, size / 2);
  ctx.rotate(-Math.PI / 2);
  const k = size / 55 * (ICON_SCALE[sprite] || 1);
  ctx.scale(k, k);
  Sprites[sprite](ctx, { moving: false, load: 0 }, 0.4);
}

function bugSprite(bug) { return bug.sprite; }
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
    b.style.left = (bug.pin.x / W * 100) + '%';
    b.style.top = (bug.pin.y / H * 100) + '%';
    const max = bug.stages.length * 3, got = bugStars(bug);
    b.innerHTML = '<canvas></canvas><span class="pinName"></span><span class="pinPlace"></span><span class="pinStars"></span>';
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
    row.querySelector('b').textContent = bug.name;
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
    b.textContent = (i + 1) + '. ' + sm.stage + (open ? (st ? ' ' + '★'.repeat(st) : '') : ' (locked)');
    b.addEventListener('click', () => selectStage(sid));
    box.appendChild(b);
  });
  $('stagePlace').textContent = (bug.stages.length > 1 ? '' : m.stage + ' · ') + m.place;
  fillList($('stageFacts'), m.facts);
  fillList($('stageHow'), m.gentle ? m.how.concat('You can\u2019t lose this one. If you get caught you just go home.') : m.how);
}

function readStage() {
  const m = currentMission;
  Speech.say(currentBug.name + '. ' + m.facts.join(' ') + ' How to play. ' + m.how.join(' '), true);
}

function startGame() {
  Speech.stop();
  show('play');
  syncToggles();
  Game.start(currentMission);
}

// ---------------------------------------------------------------- End

Game.onFact = (missionId, key) => Progress.addFact(missionId, key);

Game.onEnd = (won, g) => {
  const m = currentMission, bug = currentBug;
  const stars = won ? g.lives : 0;
  const idx = bug.stages.indexOf(m.id);
  const next = bug.stages[idx + 1];
  const wasLocked = next && !Progress.stars(m.id);
  if (won) Progress.setStars(m.id, stars);
  $('endTitle').textContent = won ? 'Well done, ' + bug.name + '!' : 'Caught! Try again?';
  $('endStars').textContent = won ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
  $('endUnlock').textContent = won && wasLocked ? 'New stage unlocked: ' + Missions[next].stage + '!' : '';
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
    const ul = sec.querySelector('ul');
    for (const it of items) {
      const li = document.createElement('li');
      li.textContent = it.text;
      if (!it.known) li.className = 'unknown';
      ul.appendChild(li);
    }
    list.appendChild(sec);
  }
  show('book');
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
