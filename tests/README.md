# Bugame tests

Needs Node and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`, or a machine where they're already installed).

| Command | What it does |
|---|---|
| `node tests/run.js` | Full test suite: every screen, every mission played to a win by a bot, predators, discoveries, the kid-with-a-net tank, saved progress, offline play, app installability, phone layouts, touch and keyboard controls, the Bug Book. A few minutes. |
| `node tests/run.js --quick` | Same without the 25 mission playthroughs. About half a minute. |
| `node tests/playtest.js kid 5` | A "kid" bot (slow reactions, wobbly steering, gets distracted, misses presses) plays every mission 5 times at 6x speed and reports time to finish, lives lost, how often rewards come, the longest dull stretch, repeated hints and tank results. Use `perfect` for an ideal player or `tapper` for a kid who taps the button instead of holding it, and add `ant,bee` to test only some missions. |
| `node tests/screenshots.js` | Screenshots of every mission on desktop and phone landscape, plus the catch flash and win confetti, in `tests/output/shots/`. |
| `node tests/export-art.js` | Every sprite as a PNG, twice: the 3D model render with its shadow and the flat drawing, at 8 px per game unit, facing right, lit from the top-left, named for what it is; plus the material tiles, bump maps and painted maps. Writes `tests/output/art/` (with `index.csv`) and `tests/output/bugame-art.zip`. Renders with software WebGL, about a minute. `--only ant,table` for a few, `--max 2048` if the GL context is lost. |
| `node tests/perf.js` | Draw cost per level, normal and with the CPU throttled four times, against the frame and start budgets. Measured on the flat drawings (`?no3d=1`); a `--3d` pass prints the model renderer's numbers for information. |

Headless Chromium has no GPU, so the 3D models are refused there (software rendering would be slower than the drawings) and the suite plays the levels on the flat drawings. Two tests open the game with `?3d=force`, which accepts software rendering, so the models still render and any model that throws shows up as a failure. The microphone and camera features are tested in a second Chromium started with fake devices (`launchMedia` in `tests/helpers.js`); refusals are tested by stubbing `Media.get`.

Targets used when tuning (kid bot, game seconds): finish each mission in roughly 20–120 s (real children take 2–3 times longer), a reward at least every 8 s, no stretch over about 25 s without one, and no game overs on first stages.

`tests/bot.js` is loaded into the game page and drives it through `Game.testHook`; `Game.timeScale` fast-forwards the game. Neither is used in normal play.
