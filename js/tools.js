'use strict';
// Tool palette for the building levels (garden, web, nest): a column of buttons down the left of the game.
// A mission lists its tools as groups: tools: [{ name, items: [{ id, label, sprite?, color?, now? }] }].
// Picking a tool sets g.tool; tools with now: true call mission.onTool(g, id) straight away instead.

const Tools = {
  build(m, g) {
    const box = $('tools');
    box.innerHTML = '';
    box.hidden = !m.tools;
    $('actionBtn').style.display = m.pointerOnly ? 'none' : '';
    if (!m.tools) return;
    for (const grp of m.tools) {
      const h = document.createElement('div');
      h.className = 'toolGroup'; h.textContent = grp.name;
      box.appendChild(h);
      for (const t of grp.items) {
        const b = document.createElement('button');
        b.className = 'tool'; b.dataset.tool = t.id;
        b.setAttribute('aria-label', t.label);
        if (t.sprite || t.color) {
          const c = document.createElement('canvas');
          this.icon(c, t);
          b.appendChild(c);
        }
        const s = document.createElement('span'); s.textContent = t.label; b.appendChild(s);
        b.addEventListener('pointerdown', (e) => e.stopPropagation());
        b.addEventListener('click', () => {
          Sound.play('tap');
          if (t.now) { if (m.onTool) m.onTool(Game.g, t.id, b); return; }
          this.select(t.id);
        });
        box.appendChild(b);
      }
    }
    const first = m.tools[0].items.find(t => !t.now);
    if (first) this.select(m.defaultTool || first.id);
  },
  select(id) {
    if (Game.g) Game.g.tool = id;
    for (const b of document.querySelectorAll('#tools .tool')) b.classList.toggle('on', b.dataset.tool === id);
  },
  hide() { $('tools').hidden = true; $('actionBtn').style.display = ''; },
  icon(c, t) {
    const dpr = window.devicePixelRatio || 1, s = 34;
    c.width = s * dpr; c.height = s * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (t.color) {
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(3, 3, s - 6, s - 6, 7) : ctx.rect(3, 3, s - 6, s - 6);
      ctx.fillStyle = t.color; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke();
      if (t.speck) { const r = rng(4); for (let i = 0; i < 18; i++) plainEll(ctx, 5 + r() * (s - 10), 5 + r() * (s - 10), 1.4, 1, t.speck); }
    }
    if (t.sprite) {
      ctx.translate(s / 2, s / 2);
      const k = (t.iconScale || 0.6);
      ctx.scale(k, k);
      Sprites[t.sprite](ctx, Object.assign({ moving: false, grow: 1 }, t.o || {}), 0.4);
    }
  },
};
