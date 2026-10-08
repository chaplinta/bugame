# Bugame

A browser game for kids aged 5–8. Play as real bugs in real Perth places, doing what those bugs really do.

## Play

Online: https://chaplinta.github.io/bugame/ (deployed by `.github/workflows/pages.yml`).

Offline: after one visit the service worker (`sw.js`) caches every file, so the game loads with no connection. On Android, open the site in Chrome and tap **Install app** on the map screen (or Chrome menu → Install app / Add to Home screen). It then opens full screen from its own icon and works offline. On iPhone/iPad, use Safari → Share → Add to Home Screen. Opening `index.html` straight from disk also works offline.

When you change any game file, bump `VERSION` in `sw.js` so players get the update.

- Move: arrow keys or WASD, or touch and drag.
- Action: Space, or the round button.

## How it works

- **Open worlds**: each place is a big area (four screens) to explore, with a mini-map. Sparkles mark discoveries, and each one adds a fact to the Bug Book.
- **Building**: homes grow as you bring things back (the ant nest gets more entrances, the bee fills burrow cells).
- **Predators are rare**: one passes through about once a minute, gives a warning, then leaves.
- **Girl with a net**: once in every level, a girl (green eyes, messy light-brown hair, freckles) sweeps you up in a bug net. The net lands, you wiggle, it lifts, and you drop into a bug tank on her desk, seen side-on, while she says "Got you!". Wait for her to lift a corner of the lid, get to the gap and press the action button (Climb, Fly, Hop, Jump or Swim). If you don't escape within 30 seconds she lets you go.
- **Secrets**: a hidden lost thing in every place (no sparkle to give it away), a quokka on Rottnest on the map, a bug parade if you tap the title lots, a spin if you mash the action button, and a Santa hat in December. The Bug Book counts them.
- **Keep exploring**: after finishing a goal you can carry on playing.
- **Map**: a map of Perth. Tap a bug's place to open its page.
- **Life stages**: several bugs have more than one stage, including female stages. Finishing a stage unlocks the next. Each bug page says who you are (female, male, worker, or both).
- **Different views**: most levels are top-down; the sandhopper's beach is side-on with gravity and hopping; the mosquito's backyard is isometric; the painted lady's third stage is 3D flight (three.js, `vendor/three.min.js`, loaded only for that stage).
- **Ten-minute day**: a sky dial shows the sun crossing the sky. The light warms in the last two minutes, then night falls, every bug goes to sleep and the game is over until you start a new day. The clock runs only while the game is on screen and lasts the browser session.
- **Family tree**: a cladogram showing how all the bugs are related; tap a branch for a fact. Each bug page has a Family tree button that rings that bug.
- **Building levels**: the native garden, orb web and ant nest let you build, dig and destroy. Tap or drag with tools from the palette on the left.
- **Storybook art**: everything is drawn in code (`js/art.js` adds soft shading, shadows, grain and vignette; `js/art-bugs.js` has the hand-drawn bugs).
- **Gentle first stages**: on a bug's first stage you can't run out of hearts. Later stages end when all 3 hearts are gone.
- **Bug Book**: every fact you've found, plus "???" for the ones still to find. Progress is saved in the browser.
- **Sound** and **Read to me** (reads facts aloud) can be turned on or off on the map.

## Missions

| Bug | Place | You... |
|---|---|---|
| Bull ant: worker (*Myrmecia*) | Kings Park banksia woodland | sting and carry prey home; avoid the echidna |
| Bull ant: queen | Kings Park | fly to clear sand, land and drop your wings, dig a nest, hunt for your first larvae; dodge the willie wagtail |
| Bush fly (*Musca vetustissima*) | Swan Valley paddock | sip protein from cows' faces, lay eggs in fresh cow pats before they dry or dung beetles bury them |
| Painted lady: caterpillar (*Vanessa kershawi*) | Bold Park heath | munch everlasting and capeweed leaves, moult as you grow, then pupate into a chrysalis |
| Painted lady: butterfly | Bold Park heath | sip nectar, taste leaves with your feet, lay eggs on the right daisy plants |
| Termite (*Coptotermes*) | Whiteman Park woodland | chew dead wood to feed the colony, dig mud to build the mound; bull ants raid |
| Native snail (*Bothriembryon*) | Bibra Lake bushland | graze fungi, lichen and dead leaves, keep out of the sun or seal your shell, avoid the bobtail |
| Blue-banded bee (*Amegilla*) | Backyard | buzz-pollinate Dianella and Hibbertia; avoid the rainbow bee-eater |
| Peacock spider: spiderling | Cottesloe dunes | jump on springtails, avoid ants, go home to moult |
| Peacock spider: adult male (*Maratus speciosus*) | Cottesloe dunes | stalk and jump on flies, then dance for a female in time to the beat; avoid the spider wasp |
| Blue skimmer: nymph | Underwater, Herdsman Lake | grab wrigglers and tadpoles with your shooting jaw, jet away from the oblong turtle, then climb a reed and emerge |
| Blue skimmer: adult (*Orthetrum caledonicum*) | Herdsman Lake | catch mosquitoes in the air; dart from the Australian hobby |
| Blue skimmer: adult female | Herdsman Lake | catch mosquitoes for energy, then dip eggs into open water while a blue male guards you |
| Peacock spider: adult female | Cottesloe dunes | watch males dance and choose one, spin an egg sac, chase ants away from it |
| Painted lady: flying high (3D) | Above Bold Park | take off, fly to glowing flowers, land and sip; dodge a willie wagtail |
| Sandhopper, female (Talitridae) | Port Beach, North Fremantle (side-on) | hop along the beach eating seaweed wrack, then get back to your burrow; dodge a silver gull and a red-capped plover |
| Native garden (build your own) | Your backyard | paint soils and ponds, plant natives, add rocks, logs and nest boxes; 23 kinds of wildlife move in when the garden suits them; saved between visits |
| Golden orb-weaver, female (*Trichonephila edulis*) | Wireless Hill | spin dry and sticky silk between branches, lay a spiral, cut and repair, wrap stuck insects then eat them, or set them free (bees sting, so cut them loose); beetles smash through |
| Sugar ant worker (*Camponotus*) | Under a Bull Creek backyard (side-on) | dig tunnels, carry soil up to build the mound, make a nursery and food store, fetch honeydew, plug the entrance before rain |
| Mosquito, female (*Culex quinquefasciatus*) | Backyard barbecue, Bassendean (isometric) | bite people while they chat, fly off before they swat, lay egg rafts on still water |

## Code

- `js/engine.js`: loop, input, movement, predators, fact pop-ups
- `js/sprites.js`: the plain drawings of bugs, predators, plants and backgrounds (the base the art files build on)
- `js/art.js`: shaded shapes (gradient, material texture, rim light, specular), the painted map and landmarks
- `js/textures.js`: seamless material tiles made in code (chitin, hair, leaf, wing, scales, sand, soil, bark, caustics)
- `js/sprite-cache.js`: pre-renders still and simply looping sprites into bitmaps keyed by state and heading
- `js/ground.js`, `js/art-ground.js`: lit noise ground (sand, soil, grass, lawn, water, leaf litter, bark, rock, canopy shade) and the level backgrounds
- `js/art-bugs.js`, `js/art-bugs2.js`: field-guide drawings of the bugs you play
- `js/art-world.js`, `js/art-world2.js`: field-guide drawings of predators, birds, reptiles, plants, scenery and the garden visitors
- `js/missions.js`: `Bugs` (map pins, stage order) and `Missions` (one per stage, with all its facts in `factText`)
- `js/missions2.js`: sandhopper (side-on), mosquito (isometric), female skimmer and spider stages
- `js/flight.js`: the 3D painted lady flight stage
- `js/tank.js`: the girl-with-a-net event, the catch animation and the bug tank
- `js/night.js`: the ten-minute day and the night screen
- `js/tools.js`: tool palette for building levels; `js/garden.js`, `js/web.js`, `js/dig.js`: the garden, orb web and ant nest
- `js/tree.js`: the bug family tree
- `js/secrets.js`: Easter eggs
- `js/ui.js`: map, bug page, end screen, Bug Book, saved progress

Tests: `node tests/run.js` (see `tests/README.md`). Draw cost per level: `node tests/perf.js`.

Design and plans: `docs/DESIGN.md`. In-game facts and simplifications: `docs/facts.md`.
