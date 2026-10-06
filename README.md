# Bugame

A browser game for kids aged 5–8. Play as real bugs in real Perth places, doing what those bugs really do.

## Play

Online: https://chaplinta.github.io/bugame/ (deployed from `main` by `.github/workflows/pages.yml`).

Offline: after one visit the service worker (`sw.js`) caches every file, so the game loads with no connection. On Android, open the site in Chrome and tap **Install app** on the map screen (or Chrome menu → Install app / Add to Home screen). It then opens full screen from its own icon and works offline. On iPhone/iPad, use Safari → Share → Add to Home Screen. Opening `index.html` straight from disk also works offline.

When you change any game file, bump `VERSION` in `sw.js` so players get the update.

- Move: arrow keys or WASD, or touch and drag.
- Action: Space, or the round button.

## How it works

- **Open worlds**: each place is a big area (four screens) to explore, with a mini-map. Sparkles mark discoveries, and each one adds a fact to the Bug Book.
- **Building**: homes grow as you bring things back (the ant nest gets more entrances, the bee fills burrow cells).
- **Predators are rare**: one passes through about once a minute, gives a warning, then leaves.
- **Kid with a net**: once in every level, a kid catches you with a bug net and pops you in a bug tank (a jar of pond water for the nymph). Wait for the kid to lift a corner of the lid, get to the gap and press the action button (Climb, Fly, Jump or Swim) to escape. If you don't escape within 30 seconds the kid lets you go.
- **Keep exploring**: after finishing a goal you can carry on playing.
- **Map**: a map of Perth. Tap a bug's place to open its page.
- **Life stages**: the bull ant, peacock spider and blue skimmer have two stages each. Finishing a stage unlocks the next.
- **Gentle first stages**: on a bug's first stage you can't run out of hearts. Later stages end when all 3 hearts are gone.
- **Bug Book**: every fact you've found, plus "???" for the ones still to find. Progress is saved in the browser.
- **Sound** and **Read to me** (reads facts aloud) can be turned on or off on the map.

## Missions

| Bug | Place | You... |
|---|---|---|
| Bull ant: worker (*Myrmecia*) | Kings Park banksia woodland | sting and carry prey home; avoid the echidna |
| Bull ant: queen | Kings Park | fly to clear sand, land and drop your wings, dig a nest, hunt for your first larvae; dodge the willie wagtail |
| Bush fly (*Musca vetustissima*) | Swan Valley paddock | sip protein from cows' faces, lay eggs in fresh cow pats before they dry or dung beetles bury them |
| Painted lady: caterpillar (*Vanessa kershawi*) | Bold Park heath | munch everlasting and capeweed leaves, moult as you grow, pupate in your silk shelter |
| Painted lady: butterfly | Bold Park heath | sip nectar, taste leaves with your feet, lay eggs on the right daisy plants |
| Termite (*Coptotermes*) | Whiteman Park woodland | chew dead wood to feed the colony, dig mud to build the mound; bull ants raid |
| Native snail (*Bothriembryon*) | Bibra Lake bushland | graze fungi, lichen and dead leaves, keep out of the sun or seal your shell, avoid the bobtail |
| Blue-banded bee (*Amegilla*) | Backyard | buzz-pollinate Dianella and Hibbertia; avoid the rainbow bee-eater |
| Peacock spider: spiderling | Cottesloe dunes | jump on springtails, avoid ants, go home to moult |
| Peacock spider: adult male (*Maratus speciosus*) | Cottesloe dunes | stalk and jump on flies, then dance; avoid the spider wasp |
| Blue skimmer: nymph | Underwater, Herdsman Lake | grab wrigglers and tadpoles with your shooting jaw, jet away from the oblong turtle, then climb a reed and emerge |
| Blue skimmer: adult (*Orthetrum caledonicum*) | Herdsman Lake | catch mosquitoes in the air; dart from the Australian hobby |

## Code

- `js/engine.js`: loop, input, movement, predators, fact pop-ups
- `js/sprites.js`: bug, predator, plant and background drawings
- `js/missions.js`: `Bugs` (map pins, stage order) and `Missions` (one per stage, with all its facts in `factText`)
- `js/tank.js`: the kid-with-a-net event and the bug tank
- `js/ui.js`: map, bug page, end screen, Bug Book, saved progress

Tests: `node tests/run.js` (see `tests/README.md`).

Design and plans: `docs/DESIGN.md`. In-game facts and simplifications: `docs/facts.md`.
