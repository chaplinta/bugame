# Bugame

A browser game for kids aged 5–8. Play as real bugs in real Perth places, doing what those bugs really do.

## Play

Open `index.html` in a browser. No install or build needed. To host it, turn on GitHub Pages for the repo.

- Move: arrow keys or WASD, or touch and drag.
- Action: Space, or the round button.

## Missions

| Bug | Place | You... |
|---|---|---|
| Bull ant (*Myrmecia*) | Kings Park banksia woodland | sting and carry prey home; avoid the echidna |
| Blue-banded bee (*Amegilla*) | Backyard | buzz-pollinate Dianella and Hibbertia; avoid the rainbow bee-eater |
| Peacock spider (*Maratus speciosus*) | Cottesloe dunes | stalk and jump on flies, then dance; avoid the spider wasp |
| Blue skimmer (*Orthetrum caledonicum*) | Herdsman Lake | catch mosquitoes in the air; dart from the Australian hobby |

## Code

- `js/engine.js`: loop, input, movement, predators, fact pop-ups
- `js/sprites.js`: bug, predator, plant and background drawings
- `js/missions.js`: one object per bug
- `js/ui.js`: menu, intro and end screens

Design and plans: `docs/DESIGN.md`. In-game facts and simplifications: `docs/facts.md`.
