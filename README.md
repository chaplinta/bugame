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
- **Girl with a net**: now and then (about one level in four, at a random moment, never twice running) a girl (green eyes, messy light-brown hair, freckles) comes with a bug net. Its shadow shows where it will land: get out from under it and she misses. If she gets you, you drop into a bug tank on her desk, seen side-on. Wait for her to lift a corner of the lid, get to the gap and press the action button (Climb, Fly, Hop, Jump or Swim). If you don't escape within 20 seconds she lets you go. Getting out is one of the Bug Book's secrets.
- **Secrets**: a hidden lost thing in every place (no sparkle to give it away), a quokka on Rottnest on the map, a plane at Perth Airport that flies you to London, a bug parade if you tap the title lots, a spin if you mash the action button, and a Santa hat in December. The Bug Book counts them.
- **Keep exploring**: after finishing a goal you can carry on playing.
- **Map**: a map of Perth. Tap a bug's place to open its page.
- **Life stages**: several bugs have more than one stage, including female stages. Finishing a stage unlocks the next. Each bug page says who you are (female, male, worker, or both).
- **Bug Circus**: five acts under the big top at Claremont Showground, all open from the start: a horned dung beetle strongman, a jumping spider's trapeze, an orb-weaver's tightrope, a moth's disappearing act and a water strider walking on water. Each act is a thing the bug really does, dressed up as a trick; the show is pretend and every act says so. Cheers are the stars.
- **London (hidden)**: tap the plane at Perth Airport and it lands on a second map, London, with a pin for every London level and a red bus driving round. Every way back from a London level returns to the London map; the plane at Heathrow flies home. The eight levels are side-on: steer to fly (drag or arrow keys; let go and you hover) or walk (the woodlouse rolls into a ball, the fox jumps and pounces), use the animal's real action, keep out of people's red zones, hide from what hunts you. You can't lose: a hazard costs a heart and sends you back to the last safe spot. Each level has two cheeky extras, each worth a star, and four London things to spot (the BT Tower, a red post box, green parakeets and so on), listed on its page and ticked as you pass them. The scenery is London's own: stock-brick terraces and chimney pots, the Tube's roundels, landmarks where they can really be seen from. **Bus tour** plays every level in a row, the bus driving from stop to stop on the map. London stays out of the Book and the parade until the plane has been found.
- **Bug Olympics**: six short events at Perry Lakes, all open from the start. Each is a real thing a bug does, against real numbers from the sources in `docs/facts.md`: a result in body lengths or seconds, a medal (the stars) and a saved best. The end screen says what your result would be for a kid.
- **Different views**: most levels are top-down; the sandhopper's beach is side-on with gravity and hopping, and the sugar ant's nest is a side-on cross-section you dig through; the mosquito's backyard is isometric; the painted lady's third stage is 3D flight (three.js, `vendor/three.min.js`); the garden, orb web and ant nest are building levels with a tool palette; Bug on your hand draws over the camera.
- **Ten-minute day**: a sky dial shows the sun crossing the sky. The light warms in the last two minutes, then night falls, every bug goes to sleep and the game is over until you start a new day. The clock runs only while the game is on screen and lasts the browser session.
- **Family tree**: a cladogram showing how all the bugs are related; tap a branch for a fact. Each bug page has a Family tree button that rings that bug.
- **Building levels**: the native garden, orb web and ant nest let you build, dig and destroy. Tap or drag with tools from the palette on the left.
- **Storybook art**: everything is drawn in code (`js/art.js` adds soft shading, shadows, grain and vignette; `js/art-bugs.js` has the hand-drawn bugs).
- **Gentle first stages**: on a bug's first stage you can't run out of hearts. Later stages end when all 3 hearts are gone.
- **Reach and feedback**: an action is ready from beside its target (a bug never has to stand on top of a leaf or a chip), tap targets in the building levels are finger-sized on phones, and pressing a button that can't act says why.
- **Fills the screen**: the view is 600 tall and as wide as the screen's shape allows (960 to 1320), so a phone on its side or a laptop sees more of the world sideways instead of empty margins; a desktop window narrower than it is tall keeps the 960-wide view. The map and the bug pages fit a phone on its side without scrolling.
- **Always landscape**: phones and tablets play sideways. The installed app is set to landscape; Start (and the quiz, Paint and Real size) asks for full screen and locks the screen sideways where the browser allows it (Android). Where it can't (iPhones, a browser tab), holding the phone upright shows a picture asking to turn it, and the game waits: no time passes in the level or on the day clock.
- **Bug Book**: every fact you've found, plus "???" for the ones still to find. Progress is saved in the browser.
- **Sound**, **Read to me** (reads facts aloud) and **3D pictures** can be turned on or off on the map. The 3D pictures are small three.js models of every bug, bird, plant and prop, rendered with real shadows; on a device without WebGL (or with it turned off, or with `?no3d=1` in the address) the same things are drawn flat.
- **Shout to buzz**: off until you turn it on. Then the microphone is a second action button in the levels that allow it: land on a flower as the blue-banded bee and shout BUZZ, or call like a motorbike frog at the night lake. It listens only while the game is running, on your device; nothing is recorded or sent anywhere. The button still works too.
- **Paint a bug**: a paint screen on the map. Pick any of the 18 bugs you can be and paint anywhere on it (colours, brushes, spot, stripe and star stamps, an eraser). The paint is a see-through layer that sticks only to the bug: wherever you leave it bare, the real markings show. Zoom with a pinch, the mouse wheel or the + and − buttons, and drag the picture with two fingers or the Move tool; "Your design" and "The real one" are shown full size underneath. Saved in the browser. With "Use my design in the game" on, one bug of that kind wears it: the bug you play (in 2D and on the 3D models, including its queen or baby stages), the bug on your hand, one garden visitor, and an extra marcher in the parade. The real species stays everywhere else, and the Bug Book shows your design labelled as yours.
- **Real size**: a button on every bug page draws that bug as big as the real one, with a 5 cm ruler, a line to read ("A bull ant worker is about 20 mm long. Put your finger next to it!") and something to compare it with (a grain of rice, a 5 cent coin, a credit card). No browser knows the true size of its screen, so the game starts from a guess for the kind of device and lets you match a circle to a 20 cent coin; the match is saved. Figures and sources in `docs/facts.md`.
- **Bug quiz**: a button on the map. Eight questions a round, each one short line of plain words ("Who has 8 legs?"), answered by tapping one of three bug pictures; a few are "What is this?" with one picture and three names. A speaker reads the question and the names aloud. Right or wrong, one line says why. The best round is saved and a perfect round is a secret.
- **Bug on your hand**: the camera as a level. The camera is asked for when you press Start and stopped when you leave. The picture is used live on your device only; nothing is recorded or sent anywhere, and a photo you take goes only where you send or save it.

## Missions

| Bug | Place | You... |
|---|---|---|
| Bull ant: worker (*Myrmecia*) | Kings Park banksia woodland | sting and carry prey home (a stung caterpillar thrashes, and counts as two); avoid the echidna, which blows snot bubbles and leaves droppings full of ant shells |
| Bull ant: queen | Kings Park | fly to clear sand, land and snap off your wings, dig a nest, hunt for your first larvae; dodge the willie wagtail |
| Bush fly (*Musca vetustissima*) | Swan Valley paddock | sip protein from cows' faces (the cow may burp in yours), hitch a ride on a cow or the hopping kangaroo (mind the willie wagtail that perches on their backs), lay eggs in fresh cow pats before they dry or dung beetles bury them |
| Painted lady: caterpillar (*Vanessa kershawi*) | Bold Park heath | munch everlasting and capeweed leaves (what goes in comes out behind you), moult as you grow, then pupate into a chrysalis |
| Painted lady: butterfly | Bold Park heath | sip nectar, taste leaves with your feet, lay eggs on the right daisy plants |
| Termite (*Coptotermes*) | Whiteman Park woodland | chew dead wood to feed the colony (termites fart methane), dig mud to build the mound; bull ants raid |
| Native snail (*Bothriembryon*) | Bibra Lake bushland | graze fungi, lichen and dead leaves (and leave a little folded rope of poo by your shell), keep out of the sun or seal your shell, avoid the bobtail |
| Blue-banded bee (*Amegilla*) | Backyard | buzz-pollinate Dianella and Hibbertia, fill three cells, and chase off the cuckoo bee that sneaks up on your burrow; avoid the rainbow bee-eater |
| Peacock spider: spiderling | Cottesloe dunes | jump on springtails (Boing! when they get away), avoid ants, go home to moult |
| Peacock spider: adult male (*Maratus speciosus*) | Cottesloe dunes | stalk and jump on flies, then dance for a female: ten beats of fan up, leg waves and drumming tapped in time, and she stays if you keep the beat; avoid the spider wasp |
| Blue skimmer: nymph | Underwater, Herdsman Lake | grab wrigglers and tadpoles (a tadpole counts as two) with your shooting jaw, jet away from the oblong turtle in a stream of bubbles from your bottom, then climb a reed and emerge |
| Blue skimmer: adult (*Orthetrum caledonicum*) | Herdsman Lake | catch mosquitoes in the air, and see a rival male off your patch; dart from the Australian hobby |
| Blue skimmer: adult female | Herdsman Lake | catch mosquitoes for energy, then dip eggs into open water while a blue male guards you |
| Peacock spider: adult female | Cottesloe dunes | males come, dance and give up and leave, then come back: five or six each round, all different in size, fan colour and dance, with one standout; choose one, spin an egg sac, jump at ants before they steal eggs, watch the spiderlings hatch and run off, then choose a new mate for a second brood (that part is pretend: real mothers almost never mate twice) |
| Painted lady: flying high (3D) | Above Bold Park | take off, fly to glowing flowers, land and sip; dodge a willie wagtail |
| Sandhopper, female (Talitridae) | Port Beach, North Fremantle (side-on) | hop along the beach eating seaweed wrack (each pile is full of other sandhoppers, which all hop off), then get back to your burrow; dodge a silver gull and a red-capped plover, and what the gulls drop |
| Native garden (build your own) | Your backyard | paint soils and ponds, plant natives, add rocks, logs and nest boxes; 23 kinds of wildlife move in when the garden suits them; saved between visits |
| Golden orb-weaver, female (*Trichonephila edulis*) | Wireless Hill | spin dry and sticky silk between branches, lay a spiral, cut and repair, wrap stuck insects then eat them, or set them free (bees sting, so cut them loose); a little silver dewdrop spider steals what you leave sitting, unless you tap it away; beetles smash through |
| Sugar ant worker (*Camponotus*) | Under a Bull Creek backyard (side-on) | dig tunnels, carry soil up to build the mound, make a nursery and food store, fetch honeydew, plug the entrance before rain |
| Mosquito, female (*Culex quinquefasciatus*) | Backyard barbecue, Bassendean (isometric) | bite people while they chat, keep out of the red zone that shows where someone looking round can see, or they wave you away (a wave just blows you a little way off), lay egg rafts on still water; ankles smell best |
| Motorbike frog, male (*Litoria moorei*) | Lake Joondalup, at night | call in the gaps of the chorus (hold Call, or shout) to be heard and bring a female; banjo frogs (Bonk!), moaning frogs and squelching froglets call round you in stereo; keep still and quiet when the night heron wades past |
| Bug on your hand (camera) | Your hand | hold your hand under the phone's camera and a pretend bug walks on it: tap to call it over, tap it to say hello, pick any bug you have finished a level with (the ladybird and snail are always there), take a photo to share or save, flip cameras; a painted hand stands in when there is no camera |
| Bug Circus (five acts) | Claremont Showground | the Strongbug (a horned dung beetle shoves a rival horn to horn out of the tunnel: tap Push as fast as you can and the crowd gets behind you the longer you keep it up, three rivals each bigger), the flying trapeze (a peacock spider leaps between swinging bars that drift apart, a silk line trailing; seven catches, a ring shows the catching moment for the first two, a miss means hanging on the line and climbing back), the tightrope (a golden orb-weaver sends her line across on the wind, then walks it through gusts), the disappearing act (a brown moth settles on the bark in the spotlight, lined up with the grooves, before the honeyeater looks) and walking on water (a water strider rows and glides to the insects on the pool); cheers are the stars; the show is pretend, the tricks are real |
| London (hidden; its own map; side-on) | Regent's Park, a café garden, a Tube platform and tunnel, a south-east London garden, Richmond Park, Alexandra Palace, Highgate Wood, a south London street | a buff-tailed bumblebee sips flowers, robs a deep one by biting a hole in it, loses flowers to a rival bee (her footprints say so), shelters from a shower and keeps clear of a dog and two crab spiders; a common wasp scrapes wood, catches a fly and chews it into a meatball among customers who wave her off, a jam-jar trap and a web; the Underground mosquito lays a first raft with no blood, bites a commuter and a rat, hides from the trains and lays a big raft in the tunnel; a Jersey tiger moth sips buddleia, keeps out of a cat's reach, hides from a great tit and is tugged by a kitchen light at dusk; a male stag beetle wrestles a rival off his log, flies a pond, crosses a path between joggers' feet and finds a female; a queen wasp woken in winter by the World Darts Championship shivers to warm up, lands on the player who is throwing (his next dart scores 1) and on the board between throws, sips a spilled drink and goes back to sleep on a cold beam; a pill woodlouse whose log has been moved rolls into a ball down a sunny slope and through the ants, keeps damp, eats, moults in two halves, slips past a centipede and the woodlouse spider and jumps a puddle off a ramp; a fox (not a bug, but a fifth of her food is worms and insects) stands still to hear a worm and pounces, snaps a daddy-long-legs out of the air, pounces on a mouse, crosses the road between the cars and the night bus, waits for a cat to doze and takes the mouse home to her cubs under a shed |
| Bug Olympics (six events) | Perry Lakes | long jump as a sandhopper (side-on: a power bar on the board, three jumps measured in body lengths), a dragonfly sprint through six rings with darts, a dung beetle burying race, a bull ant carry relay with heavier and heavier loads, a blue-banded bee buzz-off (shouting works), and gymnastics as a click beetle (side-on: click off your back into the air, somersault, press Land to come down on your feet; three flips scored in points); medals are the stars and best results are kept; the games are pretend, the numbers are real |

## Code

- `js/engine.js`: loop, input, movement, predators, fact pop-ups
- `js/orient.js`: always landscape (the full-screen lock and the turn-sideways picture)
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
- `js/platform.js`: side-on platform physics for London (fixed steps, walls, ledges, ramps, steer to fly, the stag beetle's walk, climb and flight, the woodlouse's roll, the fox's jump)
- `js/london.js`, `js/london2.js`: London (the kit and the first five levels; the darts wasp, the woodlouse and the fox, and the London map's pins and the bus tour's order): the people and their red zones, cheeky extras, hazards and facts; `js/art-london.js`, `js/art-london2.js`, `js/art-london3.js` (London's landmarks, houses, street things, Tube fittings and birds), `js/models-london.js`: the side-on drawings, people, backgrounds, the bus, the painted London map and the 3D models
- `js/hand.js`: Bug on your hand, the camera level (live frame, the bug's behaviour, the photo, the painted fallback)
- `js/tree.js`: the bug family tree
- `js/secrets.js`: Easter eggs
- `js/ui.js`: map, bug page, end screen, Bug Book, saved progress
- `js/paint.js`: Paint a bug (the paint screen, saved designs, the layer laid over drawings and 3D renders, and the wing maps the butterfly model wears)
- `js/size.js`: Real size (the sizes table, the screen's pixels per millimetre and the coin match, the life-size drawing and ruler)
- `js/quiz.js`: the Bug quiz (the questions, a round, the score and the Bug expert secret)

Tests: `node tests/run.js` (see `tests/README.md`). Draw cost per level: `node tests/perf.js`.

Design and plans: `docs/DESIGN.md`. In-game facts and simplifications: `docs/facts.md`.
