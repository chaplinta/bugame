# Bugame: concept, design and requirements

## Context
New, empty repo (`chaplinta/bugame`, branch `claude/bugame-perth-bug-game-gbetu5`). Goal: a browser game for kids aged 5–8 where you play as real Perth bugs doing what those bugs really do. Accuracy level: real named species, true diet/predators/abilities; the game only simplifies size, time and numbers.

The user wants all three structures (missions, open world, life cycle). They fit together as layers:
- **Open world**: a Perth map is the hub. Each spot is a real place with its own bug.
- **Missions**: at each spot you play short missions built on that bug's real behaviour.
- **Life cycle**: missions run in life-stage order (egg → larva/nymph → adult). Finishing a stage unlocks the next one.

## Core concept
"Be a bug in Perth." Pick a place on the map, hatch as its bug, and grow up by surviving and doing the bug's job. Every action the game teaches is something the real animal does. Facts pop up at the moment they happen ("You buzzed! Honey bees can't do that.").

## The map (hub)
Stylised Perth: coast, river, Kings Park, a suburb, wetlands. Tap a location to enter.

| Place | Bug | Habitat |
|---|---|---|
| Kings Park | Bull ant (*Myrmecia*) | Banksia woodland, sandy soil |
| Suburban backyard | Blue-banded bee (*Amegilla*) | Garden, native flowers, soil bank |
| Cottesloe dunes | Coastal peacock spider (*Maratus speciosus*) | Dunes, spinifex |
| Herdsman Lake | Blue skimmer dragonfly (*Orthetrum caledonicum*) | Lake, reeds |
| Later | Jewel beetle, Christmas beetle, cicada, stick insect, Perth's native snails (not bugs, maybe skip) | — |

## Bugs: life stages and missions
Each bug gets 2–3 short stages (2–4 min each). Verbs stay to two at most: **move** plus **one action button**.

**Bull ant**
1. *Larva*: stay still in the nest while workers feed you; tap to wriggle when food arrives. Teaches that larvae eat insects.
2. *Worker*: forage alone by sight, sting big prey (caterpillar), carry it home. Predator: echidna. Adults drink nectar.
3. Optional: *queen's nuptial flight* after rain.

**Blue-banded bee**
1. *Larva in the burrow cell*: eats the pollen ball the mother left.
2. *Adult female*: buzz-pollinate Dianella and Hibbertia (hold the button), carry pollen to the burrow. Kangaroo paw gives a fact: it's pollinated by birds. Predator: rainbow bee-eater.
3. *Male at dusk*: find a stem and clamp on with your jaws to sleep.

**Coastal peacock spider** (teaches "spiders aren't insects": 8 legs, 2 body parts)
1. *Spiderling*: hatch from the egg sac, hunt tiny prey.
2. *Hunter*: stalk flies (they flee if you rush in), jump with a silk safety line. Predator: spider wasp.
3. *Courtship*: rhythm dance. Raise the fan, wave legs in time; a wrong move means the female leaves.

**Blue skimmer dragonfly**
1. *Nymph underwater*: shoot out the hinged jaw (labium) to catch tadpoles and mosquito larvae; avoid fish.
2. *Emergence*: climb a reed and shed your skin (simple tap/hold sequence).
3. *Adult*: catch mosquitoes mid-air, dart away from an Australian hobby (falcon). Males are blue, females yellow-brown.

## Game design rules for ages 5–8
- No reading needed to play. Icons and an arrow show the goal; facts are short, with optional read-aloud via the Web Speech API.
- Gentle failure: getting caught sends you back home and drops what you carried. No game over in the first stages. Hearts only from stage 2 on.
- Sessions under 5 minutes per mission.
- Big touch targets, one action button, drag-to-move or tap-to-move on tablets, arrows/WASD + Space on PC.
- Rewards: stickers in a **Bug Book** (one per fact learned, one per life stage completed). Book shows the real-size silhouette of each bug.
- Nothing gory. Predators "chase" and "catch"; prey gets "carried home" or "eaten" with no blood.

## Accuracy requirements
- Each bug has a `facts` list in data. Each fact has a short source note (WA Museum, Australian Museum, CSIRO, Atlas of Living Australia) kept in `docs/facts.md`, not shown to kids.
- Predators, prey and plants must occur in that Perth habitat (check ALA records).
- Allowed simplifications: size scaling, compressed time, fewer individuals. Each one goes in `docs/facts.md`.
- No invented abilities. Bugs only get verbs the real animal has.

## Technical requirements
- Plain HTML5 Canvas + vanilla JS, no build step. Runs from `index.html` or GitHub Pages. Classic `<script>` tags so `file://` works.
- Fixed 960×600 logical canvas scaled to fit, DPR-aware, works in portrait with letterboxing.
- Art: procedural canvas drawings at first (shapes, top-down bugs). Can swap to sprite sheets later.
- Data-driven: bugs, stages, facts and places in `js/data/*.js`; shared engine (movement, predator AI, collisions, toasts, timers) in `js/engine.js`; per-mission logic in small modules.
- Progress saved in `localStorage` (wrapped in try/catch, game works without it).
- Audio optional and muted by default; read-aloud toggle.
- Accessibility: colour-blind-safe goal markers, no flashing, pause button.

## Proposed file layout
```
index.html, style.css, README.md
js/engine.js      loop, input, entities, predator AI, toasts
js/sprites.js     bug, predator, plant drawings
js/map.js         Perth hub screen
js/book.js        Bug Book / stickers
js/missions/*.js  one per stage (ant-worker.js, bee-adult.js ...)
js/data/bugs.js   species, stages, facts
docs/facts.md     facts with sources and simplifications
```

## Build order
1. **MVP**: engine + the four adult missions (ant worker, bee adult, spider hunter + simple dance, dragonfly adult), a simple menu in place of the map, facts as toasts, an end screen listing facts learned.
2. Perth map hub + Bug Book + progress save.
3. Life-cycle stages (larva/nymph/spiderling) and the stage unlock chain.
4. Read-aloud, sound, more bugs.

## Verification
- Serve with `npx http-server` and drive each mission with Playwright (Chromium at `/opt/pw-browsers`): load, start every bug, simulate keys and the action button, screenshot, and check the win and caught paths fire with no console errors.
- Manual check on a phone-size viewport (touch move + action button).
- Check every in-game fact against `docs/facts.md` before each release.
