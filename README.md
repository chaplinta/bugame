# Bugame

A browser game for kids aged 5–8. Play as real bugs in real Perth places, doing what those bugs really do.

## Play

Open `index.html` in a browser. No install or build needed. To host it, turn on GitHub Pages for the repo.

- Move: arrow keys or WASD, or touch and drag.
- Action: Space, or the round button.

## How it works

- **Map**: a map of Perth. Tap a bug's place to open its page.
- **Life stages**: the bull ant, peacock spider and blue skimmer have two stages each. Finishing a stage unlocks the next.
- **Bug Book**: every fact you've found, plus "???" for the ones still to find. Progress is saved in the browser.
- **Sound** and **Read to me** (reads facts aloud) can be turned on or off on the map.

## Missions

| Bug | Place | You... |
|---|---|---|
| Bull ant: worker (*Myrmecia*) | Kings Park banksia woodland | sting and carry prey home; avoid the echidna |
| Bull ant: queen | Kings Park | fly to clear sand, land and drop your wings, dig a nest, hunt for your first larvae; dodge the willie wagtail |
| Blue-banded bee (*Amegilla*) | Backyard | buzz-pollinate Dianella and Hibbertia; avoid the rainbow bee-eater |
| Peacock spider: spiderling | Cottesloe dunes | jump on springtails, avoid ants, go home to moult |
| Peacock spider: adult male (*Maratus speciosus*) | Cottesloe dunes | stalk and jump on flies, then dance; avoid the spider wasp |
| Blue skimmer: nymph | Underwater, Herdsman Lake | grab wrigglers and tadpoles with your shooting jaw, jet away from the oblong turtle, then climb a reed and emerge |
| Blue skimmer: adult (*Orthetrum caledonicum*) | Herdsman Lake | catch mosquitoes in the air; dart from the Australian hobby |

## Code

- `js/engine.js`: loop, input, movement, predators, fact pop-ups
- `js/sprites.js`: bug, predator, plant and background drawings
- `js/missions.js`: `Bugs` (map pins, stage order) and `Missions` (one per stage, with all its facts in `factText`)
- `js/ui.js`: map, bug page, end screen, Bug Book, saved progress

Design and plans: `docs/DESIGN.md`. In-game facts and simplifications: `docs/facts.md`.
