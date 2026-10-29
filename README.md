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
- **Bug Circus**: five acts under the big top at Claremont Showground, all open from the start: a horned dung beetle strongman, a jumping spider's trapeze, an orb-weaver's tightrope, a moth's disappearing act and a water strider walking on water. Each act is a thing the bug really does, dressed up as a trick; the show is pretend and every act says so. Cheers are the stars.
- **Bug Olympics**: six short events at Perry Lakes, all open from the start. Each is a real thing a bug does, against real numbers from the sources in `docs/facts.md`: a result in body lengths or seconds, a medal (the stars) and a saved best. The end screen says what your result would be for a kid.
- **Different views**: most levels are top-down; the sandhopper's beach is side-on with gravity and hopping, and the sugar ant's nest is a side-on cross-section you dig through; the mosquito's backyard is isometric; the painted lady's third stage is 3D flight (three.js, `vendor/three.min.js`); the garden, orb web and ant nest are building levels with a tool palette; Bug on your hand draws over the camera.
- **Ten-minute day**: a sky dial shows the sun crossing the sky. The light warms in the last two minutes, then night falls, every bug goes to sleep and the game is over until you start a new day. The clock runs only while the game is on screen and lasts the browser session.
- **Family tree**: a cladogram showing how all the bugs are related; tap a branch for a fact. Each bug page has a Family tree button that rings that bug.
- **Building levels**: the native garden, orb web and ant nest let you build, dig and destroy. Tap or drag with tools from the palette on the left.
- **Storybook art**: everything is drawn in code (`js/art.js` adds soft shading, shadows, grain and vignette; `js/art-bugs.js` has the hand-drawn bugs).
- **Gentle first stages**: on a bug's first stage you can't run out of hearts. Later stages end when all 3 hearts are gone.
- **Fills the screen**: the view is 600 tall and as wide as the screen's shape allows (960 to 1320), so a phone on its side or a laptop sees more of the world sideways instead of empty margins; a phone held upright keeps the 960-wide view with a tip to turn it. The map and the bug pages fit a phone on its side without scrolling.
- **Bug Book**: every fact you've found, plus "???" for the ones still to find. Progress is saved in the browser.
- **Sound**, **Read to me** (reads facts aloud) and **3D pictures** can be turned on or off on the map. The 3D pictures are small three.js models of every bug, bird, plant and prop, rendered with real shadows; on a device without WebGL (or with it turned off, or with `?no3d=1` in the address) the same things are drawn flat.
- **Shout to buzz**: off until you turn it on. Then the microphone is a second action button in the levels that allow it: land on a flower as the blue-banded bee and shout BUZZ, or call like a motorbike frog at the night lake. It listens only while the game is running, on your device; nothing is recorded or sent anywhere. The button still works too.
- **Paint a bug**: a paint screen on the map. Pick any of the 18 bugs you can be and paint anywhere on it (colours, brushes, spot, stripe and star stamps, an eraser). The paint is a see-through layer that sticks only to the bug: wherever you leave it bare, the real markings show. Zoom with a pinch, the mouse wheel or the + and − buttons, and drag the picture with two fingers or the Move tool; "Your design" and "The real one" are shown full size underneath. Saved in the browser. With "Use my design in the game" on, one bug of that kind wears it: the bug you play (in 2D and on the 3D models, including its queen or baby stages), the bug on your hand, one garden visitor, and an extra marcher in the parade. The real species stays everywhere else, and the Bug Book shows your design labelled as yours.
- **Bug on your hand**: the camera as a level. The camera is asked for when you press Start and stopped when you leave. The picture is used live on your device only; nothing is recorded or sent anywhere, and a photo you take goes only where you send or save it.

## Missions

| Bug | Place | You... |
|---|---|---|
| Bull ant: worker (*Myrmecia*) | Kings Park banksia woodland | sting and carry prey home; avoid the echidna |
| Bull ant: queen | Kings Park | fly to clear sand, land and drop your wings, dig a nest, hunt for your first larvae; dodge the willie wagtail |
| Bush fly (*Musca vetustissima*) | Swan Valley paddock | sip protein from cows' faces, hitch a ride on a cow or the hopping kangaroo (mind the willie wagtail that perches on their backs), lay eggs in fresh cow pats before they dry or dung beetles bury them |
| Painted lady: caterpillar (*Vanessa kershawi*) | Bold Park heath | munch everlasting and capeweed leaves, moult as you grow, then pupate into a chrysalis |
| Painted lady: butterfly | Bold Park heath | sip nectar, taste leaves with your feet, lay eggs on the right daisy plants |
| Termite (*Coptotermes*) | Whiteman Park woodland | chew dead wood to feed the colony, dig mud to build the mound; bull ants raid |
| Native snail (*Bothriembryon*) | Bibra Lake bushland | graze fungi, lichen and dead leaves, keep out of the sun or seal your shell, avoid the bobtail |
| Blue-banded bee (*Amegilla*) | Backyard | buzz-pollinate Dianella and Hibbertia; avoid the rainbow bee-eater |
| Peacock spider: spiderling | Cottesloe dunes | jump on springtails, avoid ants, go home to moult |
| Peacock spider: adult male (*Maratus speciosus*) | Cottesloe dunes | stalk and jump on flies, then dance for a female: ten beats of fan up, leg waves and drumming tapped in time, and she stays if you keep the beat; avoid the spider wasp |
| Blue skimmer: nymph | Underwater, Herdsman Lake | grab wrigglers and tadpoles with your shooting jaw, jet away from the oblong turtle, then climb a reed and emerge |
| Blue skimmer: adult (*Orthetrum caledonicum*) | Herdsman Lake | catch mosquitoes in the air; dart from the Australian hobby |
| Blue skimmer: adult female | Herdsman Lake | catch mosquitoes for energy, then dip eggs into open water while a blue male guards you |
| Peacock spider: adult female | Cottesloe dunes | watch three males dance (one keeps the beat best) and choose one, spin an egg sac, chase ants away from it |
| Painted lady: flying high (3D) | Above Bold Park | take off, fly to glowing flowers, land and sip; dodge a willie wagtail |
| Sandhopper, female (Talitridae) | Port Beach, North Fremantle (side-on) | hop along the beach eating seaweed wrack, then get back to your burrow; dodge a silver gull and a red-capped plover |
| Native garden (build your own) | Your backyard | paint soils and ponds, plant natives, add rocks, logs and nest boxes; 23 kinds of wildlife move in when the garden suits them; saved between visits |
| Golden orb-weaver, female (*Trichonephila edulis*) | Wireless Hill | spin dry and sticky silk between branches, lay a spiral, cut and repair, wrap stuck insects then eat them, or set them free (bees sting, so cut them loose); beetles smash through |
| Sugar ant worker (*Camponotus*) | Under a Bull Creek backyard (side-on) | dig tunnels, carry soil up to build the mound, make a nursery and food store, fetch honeydew, plug the entrance before rain |
| Mosquito, female (*Culex quinquefasciatus*) | Backyard barbecue, Bassendean (isometric) | bite people while they chat, fly off before they swat, lay egg rafts on still water |
| Motorbike frog, male (*Litoria moorei*) | Lake Joondalup, at night | call in the gaps of the chorus (hold Call, or shout) to be heard and bring a female; banjo frogs, moaning frogs and squelching froglets call round you in stereo; keep still and quiet when the night heron wades past |
| Bug on your hand (camera) | Your hand | hold your hand under the phone's camera and a pretend bug walks on it: tap to call it over, tap it to say hello, pick any bug you have finished a level with (the ladybird and snail are always there), take a photo to share or save, flip cameras; a painted hand stands in when there is no camera |
| Bug Circus (five acts) | Claremont Showground | the Strongbug (a horned dung beetle drags a sledge of weights: 100, 500 and 1,141 times its weight), the flying trapeze (a peacock spider leaps between swinging bars, a silk line trailing; a miss means hanging on the line and climbing back), the tightrope (a golden orb-weaver sends her line across on the wind, then walks it through gusts), the disappearing act (a brown moth settles on the bark in the spotlight, lined up with the grooves, before the honeyeater looks) and walking on water (a water strider rows and glides to the insects on the pool); cheers are the stars; the show is pretend, the tricks are real |
| Bug Olympics (six events) | Perry Lakes | long jump as a sandhopper (side-on: a power bar on the board, three jumps measured in body lengths), a dragonfly sprint through six rings with darts, a dung beetle burying race, a bull ant carry relay with heavier and heavier loads, a blue-banded bee buzz-off (shouting works), and gymnastics as a click beetle (side-on: click off your back into the air, somersault, press Land to come down on your feet; three flips scored in points); medals are the stars and best results are kept; the games are pretend, the numbers are real |

## Code

- `js/engine.js`: loop, input, movement, predators, fact pop-ups
- `js/sprites.js`: the plain drawings of bugs, predators, plants and backgrounds (the base the art files build on)
- `js/art.js`: shaded shapes (gradient, material texture, rim light, specular), the painted map and landmarks
- `js/textures.js`: seamless material tiles made in code (chitin, hair, leaf, wing, scales, sand, soil, bark, caustics)
- `js/sprite-cache.js`: pre-renders still and simply looping sprites into bitmaps keyed by state and heading
- `js/ground.js`, `js/art-ground.js`: lit noise ground (sand, soil, grass, lawn, water, leaf litter, bark, rock, canopy shade) and the level backgrounds
- `js/art-bugs.js`, `js/art-bugs2.js`: field-guide drawings of the bugs you play
- `js/art-world.js`, `js/art-world2.js`: field-guide drawings of predators, birds, reptiles, plants, scenery and the garden visitors
- `js/render3d.js`: the three.js renderer, lighting rig and model kit that turn models into cached sprites with real shadows (the drawings above are the fallback when WebGL is off)
- `js/models-bugs.js`, `js/models-animals.js`, `js/models-plants.js`, `js/models-props.js`: the 3D models of the bugs you play, the other animals, plants and ground tiles, props and the isometric yard
- `js/missions.js`: `Bugs` (map pins, stage order) and `Missions` (one per stage, with all its facts in `factText`)
- `js/missions2.js`: sandhopper (side-on), mosquito (isometric), female skimmer and spider stages
- `js/flight.js`: the 3D painted lady flight stage
- `js/tank.js`: the girl-with-a-net event, the catch animation and the bug tank
- `js/night.js`: the ten-minute day and the night screen
- `js/tools.js`: tool palette for building levels; `js/garden.js`, `js/web.js`, `js/dig.js`: the garden, orb web and ant nest
- `js/frogs.js`: the frog chorus night level, with the four frog calls built from oscillators and panned to where they come from
- `js/olympics.js`: the Bug Olympics (six timed or measured events, medals, best results)
- `js/circus.js`: the Bug Circus (five acts, the big top from above and from the side, the horned beetle, side-on spider and water strider)
- `js/hand.js`: Bug on your hand, the camera level (live frame, the bug's behaviour, the photo, the painted fallback)
- `js/tree.js`: the bug family tree
- `js/secrets.js`: Easter eggs
- `js/ui.js`: map, bug page, end screen, Bug Book, saved progress
- `js/paint.js`: Paint a bug (the paint screen, saved designs, the layer laid over drawings and 3D renders, and the wing maps the butterfly model wears)

Tests: `node tests/run.js` (see `tests/README.md`). Draw cost per level: `node tests/perf.js`.

Design and plans: `docs/DESIGN.md`. In-game facts and simplifications: `docs/facts.md`.
