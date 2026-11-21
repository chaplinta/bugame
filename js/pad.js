'use strict';
// The control pad: a thumb stick in the bottom left corner of the side-on levels, on screens that can be touched.
// Slide a thumb on it and the bug goes that way (Input.stick, read in Game.update like the arrow keys): a little
// off the middle for slow, out to the ring for full speed. In those levels it is the one way to move by touch. A
// finger dragged over the picture hides the bug, and dragged in from the edge of the screen it calls up the phone's
// own back and home gestures. Keyboard and mouse are as they were.

const Pad = {
  DEAD: 0.2,       // the middle of the ring, where nothing happens
  shown: false, el: null, ring: null, knob: null, id: null, told: false, w: 0,

  init() {
    const el = this.el = document.getElementById('pad');
    this.ring = document.getElementById('padRing'); this.knob = document.getElementById('padKnob');
    if (!el) return;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); Sound.wake();
      if (this.id !== null) return;   // one thumb at a time
      this.id = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
      this.steer(e);
    });
    el.addEventListener('pointermove', (e) => { if (e.pointerId === this.id) this.steer(e); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, (e) => { if (e.pointerId === this.id) this.drop(); });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', () => this.measure());
  },
  // Shown in a level that asks for it (mission.pad), on a screen that can be touched
  sync(mission) {
    this.shown = !!(mission && mission.pad && Orient.touch);
    this.told = false;
    if (this.el) this.el.hidden = !this.shown;
    const stage = document.getElementById('stage');
    if (stage) stage.classList.toggle('hasPad', this.shown);
    this.drop();
    this.measure();
  },
  // How much of the stage's left side the pad and the thumb on it take up, in the game's own units. The camera keeps
  // the bug to the right of this (Game.updateCamera), so she is never under the pad, even at the start of a level.
  measure() {
    this.w = 0;
    if (!this.shown || !this.ring) return;
    const s = document.getElementById('stage').getBoundingClientRect(), r = this.ring.getBoundingClientRect();
    if (s.width > 0 && r.width > 0) this.w = (r.right - s.left + 56) * W / s.width;
  },
  steer(e) {
    const r = this.ring.getBoundingClientRect(), R = r.width / 2 || 1;
    let x = (e.clientX - (r.left + R)) / R, y = (e.clientY - (r.top + R)) / R;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }   // slid out past the ring: still full tilt that way
    this.knob.style.transform = 'translate(' + (x * R * 0.6).toFixed(1) + 'px,' + (y * R * 0.6).toFixed(1) + 'px)';
    const k = Math.min(1, m), s = k < this.DEAD ? 0 : (k - this.DEAD) / (1 - this.DEAD) / (k || 1);
    Input.stick = { x: x * s, y: y * s };
  },
  drop() {
    this.id = null; Input.stick = null;
    if (this.knob) this.knob.style.transform = '';
  },
  // A finger on the picture, in a level steered with the pad: say where the steering is (once), and show it
  nudge() {
    if (!this.el) return;
    this.el.classList.remove('pulse'); void this.el.offsetWidth; this.el.classList.add('pulse');
    if (!this.told && typeof Game !== 'undefined' && Game.running) { this.told = true; Game.hint('Slide your thumb on the pad to move.'); }
  },
};
Pad.init();
