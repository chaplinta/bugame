'use strict';
// Menu, intro and end screens.

const Progress = {
  load() { try { return JSON.parse(localStorage.getItem('bugame.done') || '{}'); } catch (e) { return {}; } },
  save(id, stars) {
    const d = this.load();
    d[id] = Math.max(d[id] || 0, stars);
    try { localStorage.setItem('bugame.done', JSON.stringify(d)); } catch (e) { /* storage off */ }
  },
};

const $ = (id) => document.getElementById(id);
let current = null;

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === id);
}

function portrait(canvas, mission) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 120 * dpr; canvas.height = 120 * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(60, 60);
  ctx.rotate(-Math.PI / 2);
  ctx.scale(2.2, 2.2);
  Sprites[mission.id](ctx, { moving: false, load: 0 }, 0.4);
}

function buildMenu() {
  const done = Progress.load();
  const cards = $('cards');
  cards.innerHTML = '';
  for (const m of Missions) {
    const b = document.createElement('button');
    b.className = 'card';
    b.innerHTML = '<canvas></canvas><h2></h2><p class="sci-small"><i></i></p><p></p><p class="done"></p>';
    portrait(b.querySelector('canvas'), m);
    b.querySelector('h2').textContent = m.name;
    b.querySelector('i').textContent = m.sci;
    b.querySelectorAll('p')[1].textContent = m.place;
    b.querySelector('.done').textContent = done[m.id] ? '★'.repeat(done[m.id]) : '';
    b.addEventListener('click', () => openIntro(m));
    cards.appendChild(b);
  }
  show('menu');
}

function fillList(el, items) {
  el.innerHTML = '';
  for (const t of items) { const li = document.createElement('li'); li.textContent = t; el.appendChild(li); }
}

function openIntro(m) {
  current = m;
  $('introName').textContent = m.name;
  $('introSci').textContent = m.sci;
  $('introPlace').textContent = m.place;
  fillList($('introFacts'), m.facts);
  fillList($('introHow'), m.how);
  portrait($('introPic'), m);
  show('intro');
}

function startGame() {
  show('play');
  Game.start(current);
}

Game.onEnd = (won, g) => {
  const stars = won ? g.lives : 0;
  if (won) {
    Progress.save(current.id, stars);
    g.learned.push(current.winFact);
  }
  $('endTitle').textContent = won ? 'Well done, ' + current.name + '!' : 'Caught! Try again?';
  $('endStars').textContent = won ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '';
  fillList($('endFacts'), g.learned);
  show('end');
};

$('introBack').addEventListener('click', buildMenu);
$('introStart').addEventListener('click', startGame);
$('endAgain').addEventListener('click', startGame);
$('endMenu').addEventListener('click', buildMenu);
$('menuBtn').addEventListener('click', () => { Game.stop(); buildMenu(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && Game.running) { Game.stop(); buildMenu(); } });

Game.init($('game'));
buildMenu();
