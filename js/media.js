'use strict';
// Microphone and camera access, asked for only when a feature that needs it is switched on.
// Nothing is recorded or sent anywhere: the stream is used live on the device and stopped when the feature stops.

const Media = {
  can() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.isSecureContext); },
  // → { stream } or { error: 'denied' | 'none' | 'busy' | 'unsupported' }. Tests stub this.
  async get(constraints) {
    if (!this.can()) return { error: 'unsupported' };
    try { return { stream: await navigator.mediaDevices.getUserMedia(constraints) }; }
    catch (e) {
      const n = (e && e.name) || '';
      return { error: /NotAllowed|Permission|Security/.test(n) ? 'denied' : /NotFound|Overconstrained/.test(n) ? 'none' : /NotReadable|Abort/.test(n) ? 'busy' : 'unsupported' };
    }
  },
  stop(stream) { if (stream) for (const t of stream.getTracks()) t.stop(); },
  words: {
    denied: 'No microphone or camera this time. The buttons still work!',
    none: 'This device has no microphone or camera to use here.',
    busy: 'Something else is using the microphone or camera. Try again later.',
    unsupported: 'This browser can’t do that here. The buttons still work!',
  },
  // A friendly line on the map (like the crash note), read aloud.
  note(kind) {
    const el = document.getElementById('mediaNote');
    const text = this.words[kind] || this.words.unsupported;
    if (el) {
      el.textContent = text; el.hidden = false;
      clearTimeout(this.noteT);
      this.noteT = setTimeout(() => { el.hidden = true; }, 6000);
    }
    if (typeof Speech !== 'undefined') Speech.say(text);
  },
};
