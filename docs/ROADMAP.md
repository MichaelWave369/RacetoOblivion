# The Interval: public design roadmap

This file intentionally avoids late-story revelations. **Please keep major twists out of public documentation, issue titles, commits, UI labels, and launch marketing.**

## Rung 1: The Interval Awakens
- [x] Offline-first, dependency-free browser game (keyboard, pointer and touch).
- [x] Explore Elsewhen and meet three historical thinkers.
- [x] Gen.E.Wrist status panel, stability index and journal.
- [x] Three dimensional fractures with distinct choices and consequences.
- [x] Local save and reset with validation.
- [x] Node test suite and GitHub Actions checks.

## Rung 2: Make Elsewhen alive
- [x] Collision-aware town geometry and hand-drawn animated characters (fully tiled art is future work).
- [x] Character topic dialogues and first-discussion insight; deeper friendship arcs remain future work.
- [x] Equilibrium-based sky, portal completion and landmark reactions.
- [x] Observatory, atelier, fountain, roaming townsfolk, original opt-in ambient audio, reduced-motion/high-contrast options.
- [x] Contextual quest hints, Gen.E.Wrist tabs and browser gamepad support.
- [ ] Equipment and inventory (future rung).

## Rung 3: The first larger expedition
- [x] Three independently themed maps with a multi-stop authored expedition loop (survey, mechanism, encounter, core).
- [x] Configurable three-genius squad and cooperative approaches to each puzzle.
- [x] Deterministic turn-based echo encounters with focus, health and cumulative pressure; scenario-specific scientific puzzles.
- [x] Contextual four-step expedition objectives, persistent choice consequences and revisitable stabilized worlds.
- [ ] Deeper replayable boss fights, turn grid combat and authored multi-map questlines (future work).

## Rung 4: Echoes Remember
- [x] Telegraph-driven three-lane tactical echo encounters.
- [x] Sidestep positioning, safe-lane choices and persistent combat lane on save/reload.
- [x] Six recoverable and rereadable field records, each with original speculative lore.
- [x] Gen.E.Wrist archive mode and exploration markers for optional discoveries.
- [x] Migration tests, full module syntax checks, and deterministic combat rules.
- [ ] Fully animated tactical battlefield and deeper replayability (future rung).

## Rung 5: The Minds of Elsewhen
- [x] Persistent trust and rapport tiers for Einstein, Tesla, and Lovelace.
- [x] Three personal investigations integrated with existing collectible field evidence.
- [x] Decision-sensitive reactions to completed dimensions.
- [x] The Conclave, an accessible town forum with three once-only research debates and branching social outcomes.
- [x] Two discoverable historical visitors: Marie Curie and Leonardo da Vinci (non-recruitable for now).
- [x] Strong bonds improve select cooperative puzzle outcomes; no quest or debate can farm repeat rewards.
- [x] Legacy save migration and deterministic social-system tests.
- [ ] Fully recruitable new thinkers, character schedules, and deeper affinity arcs (future rungs).

## Rung 6: The Clock That Counts Backward
- [x] Three optional clue inscriptions connect established realm choices to familiar Elsewhen landmarks.
- [x] A three-glyph order puzzle with persisted partial input and no punitive lockout.
- [x] A new clock tower observation chamber accessible after aligning the dial, with original procedural art.
- [x] Three chamber instruments, one-time insight rewards and an earned chapter-completion moment.
- [x] Gen.E.Wrist clock dossier, contextual objectives, and save compatibility across previous rungs.
- [x] Fix interaction overlap by repositioning Ada away from the clock face.
- [ ] A larger authored story campaign continuing beyond the observation room (future rung).

## Engineering direction
- Keep deterministic, separately tested game state.
- Preserve the canonical Gen.E.Wrist 3/6/9 interaction model when integrating the shared project later.
- Use only owned, permissively licensed or public-domain assets and original writing.
- Keep it playable without requiring an account, subscription or online API.
- Never expose unreleased narrative twists in release notes.
