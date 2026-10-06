# Bugame tests

Needs Node and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`, or a machine where they're already installed).

| Command | What it does |
|---|---|
| `node tests/run.js` | Full test suite: every screen, every mission played to a win by a bot, predators, discoveries, the kid-with-a-net tank, saved progress, offline play, app installability, phone layouts. About 1.5 minutes. |
| `node tests/run.js --quick` | Same without the 12 mission playthroughs. About 25 seconds. |
| `node tests/playtest.js kid 5` | A "kid" bot (slow reactions, wobbly steering, gets distracted, misses presses) plays every mission 5 times at 6x speed and reports time to finish, lives lost, how often rewards come, the longest dull stretch, repeated hints and tank results. Use `perfect` for an ideal player or `tapper` for a kid who taps the button instead of holding it, and add `ant,bee` to test only some missions. |
| `node tests/screenshots.js` | Screenshots of every mission on desktop and phone landscape, plus the catch flash and win confetti, in `tests/output/shots/`. |

Targets used when tuning (kid bot, game seconds): finish each mission in roughly 20–120 s (real children take 2–3 times longer), a reward at least every 8 s, no stretch over about 25 s without one, and no game overs on first stages.

`tests/bot.js` is loaded into the game page and drives it through `Game.testHook`; `Game.timeScale` fast-forwards the game. Neither is used in normal play.
