import { worlds } from "./content.js";
import { expeditionProgress, availableMoves, strikeEcho } from "./expedition-rules.js";

const worldSeeds={gardens:1,causeway:0,archive:2};
export const laneNames=Object.freeze(["LEFT","CENTER","RIGHT"]);
const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
function eligible(state,id){
  return Boolean(worlds.find(world=>world.id===id))
    && !state.completed.includes(id)
    && expeditionProgress(state,id).mechanism
    && !expeditionProgress(state,id).echo;
}
export function telegraphLane(worldId,turns){
  if(!Object.hasOwn(worldSeeds,worldId))return 1;
  const turn=Number.isFinite(turns)?Math.max(0,Math.floor(turns)):0;
  return (turn+worldSeeds[worldId])%3;
}
export function tacticalView(state,worldId){
  const p=expeditionProgress(state,worldId);
  return {
    lane:p.lane,
    threat:telegraphLane(worldId,p.turns),
    health:p.echoHealth,
    focus:p.focus,
    round:p.turns+1,
    active:eligible(state,worldId)
  };
}
export function tacticalShift(state,worldId,direction){
  if(!eligible(state,worldId)||![-1,1].includes(direction))return state;
  const p=expeditionProgress(state,worldId);
  const nextLane=p.lane+direction;
  if(nextLane<0||nextLane>2)return state;
  const incoming=telegraphLane(worldId,p.turns);
  const hit=nextLane===incoming;
  const next={...p,lane:nextLane,focus:clip(p.focus+1,0,4),turns:p.turns+1};
  const event="Sidestep to "+laneNames[nextLane]+". "+
    (hit?"The predicted echo pulse catches the squad.":"The echo pulse passes harmlessly.")+
    " Focus "+next.focus+"/4.";
  return {
    ...state,
    expeditions:{...state.expeditions,[worldId]:next},
    stability:clip(state.stability-(hit?2:0),0,100),
    log:[...state.log,event].slice(-50)
  };
}
export function tacticalStrike(state,worldId,moveId){
  if(!eligible(state,worldId))return state;
  const p=expeditionProgress(state,worldId);
  const move=availableMoves(state,worldId).find(m=>m.id===moveId);
  if(!move||p.focus<move.cost)return state;
  const danger=p.lane===telegraphLane(worldId,p.turns);
  const after=strikeEcho(state,worldId,moveId);
  if(after===state)return state;
  // The legacy strike model stays intact for old saves, unit tests and
  // headless consumers. Only the tactical UI adds a telegraphed counterpulse.
  if(expeditionProgress(after,worldId).echo)return after;
  const penalty=danger?2:0;
  return {
    ...after,
    stability:clip(after.stability-penalty,0,100),
    log:[...after.log,danger?
      "The echo's predicted pulse struck the squad in "+laneNames[p.lane]+".":
      "The squad attacked from a safe lane, avoiding the predicted pulse."].slice(-50)
  };
}
