'use strict';
// The game is always landscape on phones and tablets. The installed app is set to landscape (manifest.webmanifest);
// a tap on Start (or Play again, Next stage, the quiz, Paint, Real size) asks for full screen and locks the screen
// sideways where the browser allows it (Android). Where it can't (iPhones, a browser tab), a phone or tablet held
// upright shows a picture asking to turn it, and the game waits: no time passes in a level, and the day clock stops.
// Desktop browsers have no touch points, so a narrow desktop window is never covered.

const Orient = {
  touch: navigator.maxTouchPoints > 0,
  covered: false,

  update() {
    const was = this.covered;
    this.covered = this.touch && window.matchMedia('(orientation: portrait)').matches;
    document.documentElement.classList.toggle('turn', this.covered);
    const el = document.getElementById('turn');
    if (el) el.hidden = !this.covered;
    if (this.covered && !was) {
      // a finger on the screen as the phone turns never gets its release: let go of everything
      Input.keys.clear(); Input.held = false; Input.pressed = false; Input.target = null; Input.pointer = null;
      Speech.stop();
      if (Settings.speech) Speech.say('Turn your phone sideways to play.');
    }
  },

  // Full screen, then landscape. Every step can be refused (no API, not allowed, not full screen): that's fine.
  lock() {
    if (!this.touch) return;
    const root = document.documentElement, turn = () => {
      try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch (e) { /* not allowed here */ }
    };
    try {
      if (!document.fullscreenElement && root.requestFullscreen) {
        const p = root.requestFullscreen({ navigationUI: 'hide' });
        if (p && p.then) { p.then(turn, turn); return; }
      }
    } catch (e) { /* no full screen here */ }
    turn();
  },
};

Orient.update();
window.addEventListener('resize', () => Orient.update());
window.addEventListener('orientationchange', () => Orient.update());
// The buttons that start something big: a level, the quiz, the paint screen, Real size
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest && e.target.closest('#bugStart, #endAgain, #endNext, #quizBtn, #paintBtn, #sizeBtn');
  if (b) Orient.lock();
}, true);
