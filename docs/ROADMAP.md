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

## Rung 7: The Unwritten Visitor
- [x] Earned Reflection Gallery entrance after the three clock tower instruments are examined.
- [x] A new original Canvas environment, three interactable mirrors and a final philosophical choice.
- [x] Distinct consequences for each observation, with persistent one-time equilibrium and insight rewards.
- [x] Erwin Schrödinger introduced as a non-recruitable visitor with an enigmatic wooden case, without revealing later twists.
- [x] New Gen.E.Wrist gallery dossier, travel prompts and contextual objectives.
- [x] Compatible with existing Rung 1–6 saves, including those with the clock chamber already complete.
- [x] Tests for gallery gating, independent outcomes, save migration, validation and idempotent rewards.
- [ ] Fully cinematic scenes, advanced dialogue trees and new recruit combat abilities (future rungs).

## Rung 8: The Missing Witness
- [x] A new Hall of Witnesses unlocked after completing the Reflection Gallery.
- [x] Three conversational testimony stations and two physical clues.
- [x] Evidence-backed hypothesis comparison; incorrect accusations are rejected without soft-locking or repeat penalties.
- [x] Three persistent case resolutions with different equilibrium and insight outcomes.
- [x] Original Canvas scene and progression markers, saved case-file panel and contextual objectives.
- [x] Same local save key with migration for Rung 1–7 players and strict validation.
- [x] Regression tests for gating, evidence, deduction, replay safety, old saves and interaction coordinates.
- [ ] Deeper witness dialogue trees, multi-scene detective exploration and voiced performances (future work).

## Engineering direction
- Keep deterministic, separately tested game state.
- Preserve the canonical Gen.E.Wrist 3/6/9 interaction model when integrating the shared project later.
- Use only owned, permissively licensed or public-domain assets and original writing.
- Keep it playable without requiring an account, subscription or online API.
- Never expose unreleased narrative twists in release notes.
