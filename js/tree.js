'use strict';
// Bug family tree: how all the bugs in the game are related (a simplified cladogram).
// Tap a branch for a fact, or tap a bug to play it. Bugs you haven't played yet show as shadows.

const FAMILY = {
  name: 'Animals', fact: 'All these bugs are animals. They all come from one ancestor that lived more than 500 million years ago.',
  kids: [
    { name: 'Molluscs', fact: 'Snails are molluscs, like slugs, octopuses and mussels. They are only distant cousins of insects.', kids: [{ bug: 'snail' }] },
    { name: 'Arthropods', fact: 'Arthropods have a hard skeleton on the outside and legs with joints. They moult to grow.', kids: [
      { name: 'Spiders & scorpions', fact: 'Spiders, scorpions and mites have 8 legs and fangs called chelicerae.', kids: [{ bug: 'spider' }] },
      { name: 'Crustaceans & insects', fact: 'Surprise! Insects are a branch of the crustacean family tree. Their ancestors lived in water.', kids: [
        { name: 'Crustaceans', fact: 'Crabs, prawns, gilgies and sandhoppers are crustaceans. Most breathe with gills.', kids: [{ bug: 'sandhopper' }] },
        { name: 'Insects', fact: 'Insects have 6 legs and 3 body parts. There are more kinds of insects than any other animal.', kids: [
          { name: 'Dragonflies', fact: 'Dragonflies are an ancient group. Giant ones flew 300 million years ago, before the dinosaurs.', kids: [{ bug: 'dragonfly' }] },
          { name: 'Cockroaches & termites', fact: 'Termites are really a kind of cockroach that lives in big families.', kids: [{ bug: 'termite' }] },
          { name: 'Complete change', fact: 'These insects change completely as they grow: egg, larva, pupa, then adult.', kids: [
            { name: 'Ants, bees & wasps', fact: 'Ants, bees and wasps have a narrow waist. Many live in colonies with a queen.', kids: [{ bug: 'ant' }, { bug: 'bee' }] },
            { name: 'Butterflies & moths', fact: 'Butterflies and moths have wings covered in tiny coloured scales.', kids: [{ bug: 'butterfly' }] },
            { name: 'Flies', fact: 'True flies have only 2 wings. Their back wings are tiny knobs that help them balance.', kids: [{ bug: 'fly' }, { bug: 'mosquito' }] },
          ] },
        ] },
      ] },
    ] },
  ],
};

const Tree = {
  hits: [],
  layout() {
    const leaves = [];
    const walk = (n, depth) => {
      n.depth = depth;
      if (n.bug) { n.y = leaves.length; leaves.push(n); return; }
      for (const k of n.kids) walk(k, depth + 1);
      n.y = (n.kids[0].y + n.kids[n.kids.length - 1].y) / 2;
    };
    walk(FAMILY, 0);
    return leaves;
  },

  draw() {
    const c = $('treeCanvas'), dpr = window.devicePixelRatio || 1;
    const TW = 960, TH = 640;
    c.width = TW * dpr; c.height = TH * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Paper background
    const bg = ctx.createLinearGradient(0, 0, 0, TH);
    bg.addColorStop(0, '#fbf3dc'); bg.addColorStop(1, '#efe0b8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, TW, TH);
    storybookFinish(ctx, TW, TH, 61);
    const leaves = this.layout(), n = leaves.length;
    const X = (d) => 40 + d * 92, Y = (v) => 30 + v * (TH - 60) / (n - 1);
    const leafX = 640;
    this.hits = [];
    // Branches: thick at the root, thinner toward the tips, like a real tree
    const branch = (node) => {
      if (node.bug) return;
      const x0 = X(node.depth), y0 = Y(node.y);
      for (const k of node.kids) {
        const x1 = k.bug ? leafX - 34 : X(k.depth), y1 = Y(k.y);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.bezierCurveTo(x0 + 40, y0, x0 + 20, y1, x0 + 60, y1); ctx.lineTo(x1, y1);
        ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = Math.max(3, 12 - node.depth * 1.6); ctx.lineCap = 'round'; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,230,180,.35)'; ctx.lineWidth = Math.max(1, 4 - node.depth * 0.5); ctx.stroke();
        branch(k);
      }
      // Group name at the fork
      // Name labels go on top later, so branches never cover them
      labels.push(() => {
        ctx.font = 'italic bold 14px Georgia, serif'; ctx.textAlign = 'left';
        const w = ctx.measureText(node.name).width + 14;
        const ly = node.kids.length === 1 ? y0 + 8 : y0 - 26;   // one-bug groups label under the branch
        ctx.fillStyle = 'rgba(255,250,235,.92)'; ctx.strokeStyle = '#b89a6a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0 - 6, ly, w, 20, 8) : ctx.rect(x0 - 6, ly, w, 20); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4a3a22'; ctx.fillText(node.name, x0 + 1, ly + 15);
        ell(ctx, x0, y0, 6, 6, '#c8501e');
        this.hits.push({ x: x0 - 8, y: Math.min(ly, y0 - 8) - 2, w: w + 4, h: 34, node });
      });
    };
    const labels = [];
    branch(FAMILY);
    for (const l of labels) l();
    // Bugs at the tips: icon (or a shadow if not played yet) and name
    for (const leaf of leaves) {
      const bug = Bugs.find(b => b.id === leaf.bug);
      if (!bug) continue;
      const y = Y(leaf.y), played = bugStars(bug) > 0;
      const ic = document.createElement('canvas');
      portrait(ic, bugSprite(bug), 44);
      if (!played) {
        const ictx = ic.getContext('2d');
        ictx.setTransform(1, 0, 0, 1, 0, 0);
        ictx.globalCompositeOperation = 'source-in'; ictx.fillStyle = '#5a4a3a'; ictx.fillRect(0, 0, ic.width, ic.height);
      }
      ctx.beginPath(); ctx.arc(leafX, y, 25, 0, TAU); ctx.fillStyle = '#fffaf0'; ctx.fill();
      ctx.strokeStyle = played ? '#2f7d5b' : '#b8ab8f'; ctx.lineWidth = 3; ctx.stroke();
      ctx.drawImage(ic, leafX - 22, y - 22, 44, 44);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#2b2118'; ctx.font = 'bold 17px "Trebuchet MS", sans-serif';
      ctx.fillText(played ? bug.name : bug.name + '  ?', leafX + 34, y + 1);
      ctx.fillStyle = '#6a5a42'; ctx.font = 'italic 12px Georgia, serif';
      ctx.fillText(bug.sci, leafX + 34, y + 16);
      this.hits.push({ x: leafX - 28, y: y - 28, w: 300, h: 56, bug });
    }
  },

  tap(e) {
    const c = $('treeCanvas'), r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 960, y = (e.clientY - r.top) / r.height * 640;
    const hit = this.hits.slice().reverse().find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    if (!hit) return;
    Sound.play('tap');
    if (hit.bug) { openBug(hit.bug); return; }
    $('treeFact').innerHTML = '';
    const b = document.createElement('b'); b.textContent = hit.node.name + ': ';
    $('treeFact').append(b, hit.node.fact);
    Speech.say(hit.node.name + '. ' + hit.node.fact);
  },

  open() {
    $('treeFact').textContent = 'Tap a branch to learn about that group. Tap a bug to play it.';
    show('tree');
    this.draw();
  },
};

$('treeBtn').addEventListener('click', () => Tree.open());
$('treeBack').addEventListener('click', () => buildMap());
$('treeCanvas').addEventListener('click', (e) => Tree.tap(e));
