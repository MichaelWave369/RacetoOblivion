import { thinkers, worlds } from "./content.js";
import { validateExpeditions, validateSquad } from "./expedition-rules.js";
import { validateRecords } from "./field-records.js";
import { initialSocial, validateSocial } from "./relationships.js";
import { initialClock, validateClock } from "./clock-rules.js";

export const SAVE_KEY = "rto-interval-rung01-v1";

export function initialState() {
  return {
    version: 1,
    scene: "elsewhen",
    x: 480,
    y: 458,
    recruits: [],
    completed: [],
    choices: {},
    stability: 64,
    insight: 0,
    discussions: [],
    observed: [],
    squad: [],
    expeditions: {},
    records: [],
    social: initialSocial(),
    clock: initialClock(),
    log: ["Arrival: Elsewhen lies somewhere in The Interval."],
    introSeen: false
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function recruit(state, id) {
  const thinker = thinkers.find((entry) => entry.id === id);
  if (!thinker || state.recruits.includes(id)) return state;
  return { ...state, recruits: [...state.recruits, id], squad: validateSquad([...(state.squad || []), id], [...state.recruits, id]), log: [...state.log, thinker.name + " joined your expedition."] };
}

export function discuss(state, thinkerId, topic) {
  if (!thinkers.some((person) => person.id === thinkerId) || !["interval","work","consequences"].includes(topic)) return state;
  const key = thinkerId + ":" + topic;
  if (state.discussions.includes(key)) return state;
  const name = thinkers.find((person) => person.id === thinkerId).name;
  return { ...state, insight: state.insight + 1, discussions: [...state.discussions, key],
    log: [...state.log, "Conversation with " + name + ": " + topic + "."] };
}

export function observe(state, landmarkId) {
  if (!["fountain","observatory","atelier"].includes(landmarkId) || state.observed.includes(landmarkId)) return state;
  return { ...state, insight: state.insight + 1,
    observed: [...state.observed, landmarkId],
    log: [...state.log, "Discovered a detail at " + landmarkId + "."] };
}

export function travel(state,scene){
  const allowed=scene==="elsewhen" || worlds.some(w=>w.id===scene) ||
    (scene==="clockroom" && validateClock(state.clock).solved);
  if(!allowed)return state;
  const name=scene==="elsewhen"?"Elsewhen":scene==="clockroom"?
    "Clock Tower Observation Chamber":worlds.find(w=>w.id===scene).name;
  return {
    ...state,
    scene,
    x:480,
    y:scene==="elsewhen"?454:scene==="clockroom"?480:468,
    log:[...state.log,"Entered "+name+"."].slice(-50)
  };
}

export function resolveFracture(state, worldId, choiceId) {
  const world = worlds.find((entry) => entry.id === worldId);
  if (!world || state.completed.includes(worldId) || !state.recruits.includes(world.needed)) return state;
  const option = world.options.find((entry) => entry.id === choiceId);
  if (!option) return state;
  return {
    ...state,
    stability: clamp(state.stability + option.stability, 0, 100),
    insight: state.insight + option.insight,
    completed: [...state.completed, worldId],
    choices: { ...state.choices, [worldId]: choiceId },
    log: [...state.log, world.name + ": " + option.result]
  };
}

export function restoreState(raw) {
  const base = initialState();
  if (!raw || raw.version !== 1 || !Array.isArray(raw.recruits) || !Array.isArray(raw.completed)) return base;
  const validRecruits = thinkers.map((item) => item.id);
  const validWorlds = worlds.map((item) => item.id);
  return {
    ...base,
    scene: raw.scene === "elsewhen" || validWorlds.includes(raw.scene) ||
      (raw.scene==="clockroom" && validateClock(raw.clock).solved) ? raw.scene : "elsewhen",
    x: Number.isFinite(raw.x) ? clamp(raw.x, 35, 925) : base.x,
    y: Number.isFinite(raw.y) ? clamp(raw.y, 42, 525) : base.y,
    recruits: [...new Set(raw.recruits.filter((id) => validRecruits.includes(id)))],
    completed: [...new Set(raw.completed.filter((id) => validWorlds.includes(id)))],
    choices: raw.choices && typeof raw.choices === "object" ? raw.choices : {},
    discussions: Array.isArray(raw.discussions) ? [...new Set(raw.discussions.filter((value) => typeof value === "string" && /^(einstein|tesla|lovelace):(interval|work|consequences)$/.test(value)))] : [],
    observed: Array.isArray(raw.observed) ? [...new Set(raw.observed.filter((value) => ["fountain","observatory","atelier"].includes(value)))] : [],
    squad: validateSquad(raw.squad,raw.recruits.filter((id) => validRecruits.includes(id))),
    expeditions: validateExpeditions(raw.expeditions),
    records: validateRecords(raw.records),
    social: validateSocial(raw.social),
    clock: validateClock(raw.clock),
    stability: Number.isFinite(raw.stability) ? clamp(raw.stability, 0, 100) : base.stability,
    insight: Number.isFinite(raw.insight) ? clamp(raw.insight, 0, 100000) : 0,
    log: Array.isArray(raw.log) ? raw.log.filter((entry) => typeof entry === "string").slice(-50) : base.log,
    introSeen: raw.introSeen === true
  };
}
