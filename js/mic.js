'use strict';
// Shout to buzz: the microphone as a second action button. Being louder than the room counts as holding the
// button in the levels that allow it (mission.voice). Off unless the kid switches it on; nothing is recorded.

const Mic = {
  active: false, stream: null, analyser: null, buf: null,
  level: 0, floor: 0.02, thresh: 0.06, loud: false, holdT: 0,
  levelFn: null,   // tests inject a level source instead of a real microphone

  async start() {
    if (this.active) return true;
    const r = await Media.get({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } });
    if (!r.stream) { Media.note(r.error); return false; }
    try {
      const ac = Sound.ensure();
      const src = ac.createMediaStreamSource(r.stream);
      this.analyser = ac.createAnalyser(); this.analyser.fftSize = 512;
      src.connect(this.analyser);   // never to the speakers: no feedback
    } catch (e) { Media.stop(r.stream); Media.note('unsupported'); return false; }
    this.buf = new Uint8Array(512); this.stream = r.stream; this.active = true; this.floor = 0.02; this.holdT = 0;
    const el = document.getElementById('hudMic'); if (el) el.hidden = false;
    return true;
  },
  stop() {
    Media.stop(this.stream); this.stream = null; this.analyser = null; this.active = false; this.loud = false; Input.loud = false;
    const el = document.getElementById('hudMic'); if (el) el.hidden = true;
  },
  // Loudness right now: the RMS of the waveform, near 0 in a quiet room, 0.3 to 0.7 for a shout at the phone.
  read() {
    if (this.levelFn) return this.levelFn();
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.buf);
    let s = 0;
    for (let i = 0; i < this.buf.length; i++) { const v = (this.buf[i] - 128) / 128; s += v * v; }
    return Math.sqrt(s / this.buf.length);
  },
  // Each game tick: is the kid louder than the room? Sets Input.loud for the mission's hold-or-tap actions.
  tick(dt) {
    const g = Game.g, m = g && g.mission;
    if (!this.active || !m) { Input.loud = false; return; }
    const L = this.level = this.read();
    // The room's quiet level: follows a drop quickly and a rise slowly, so a steady noise soon stops counting
    this.floor += (L - this.floor) * (L < this.floor ? 0.3 : 0.004);
    this.thresh = Math.max(0.05, this.floor * 3);
    if (L > this.thresh) this.holdT += dt; else if (L < this.thresh * 0.6) this.holdT = 0;
    this.loud = this.holdT > 0.06;   // a couple of frames of noise, not a click
    Input.loud = this.loud && !!m.voice && !g.event && !g.frozen;
    this.meter();
  },
  // A little bar in the HUD so kids can see the shout working: level, with a mark at the threshold.
  meter() {
    const c = document.getElementById('hudMic');
    if (!c || c.hidden) return;
    const dpr = window.devicePixelRatio || 1, w = 18, h = 40;
    if (c.width !== w * dpr) { c.width = w * dpr; c.height = h * dpr; }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(4, 2, 10, h - 4);
    const k = Math.min(1, this.level / 0.5), th = Math.min(1, this.thresh / 0.5);
    ctx.fillStyle = this.loud ? '#2f7d5b' : '#c8501e'; ctx.fillRect(4, 2 + (h - 4) * (1 - k), 10, (h - 4) * k);
    ctx.fillStyle = '#2b2118'; ctx.fillRect(2, 1 + (h - 4) * (1 - th), 14, 2);
  },
};
