import { thinkers, worlds } from "./content.js";
import { expeditions, encounterMoves } from "./expeditions.js";
import { rapportBonus } from "./relationships.js";

export const MAX_SQUAD=3;
const MAX_FOCUS=4;
const START_HEALTH=8;
const worldIds=worlds.map(w=>w.id);
const thinkerIds=thinkers.map(t=>t.id);
const limit=(value,min,max)=>Math.max(min,Math.min(max,value));
export const freshProgress=()=>({survey:false,mechanism:false,echo:false,echoHealth:START_HEALTH,focus:MAX_FOCUS,turns:0,lane:1});

export function expeditionProgress(state,worldId){
  const current=state?.expeditions?.[worldId];
  if(state?.completed?.includes(worldId)) return {...freshProgress(),survey:true,mechanism:true,echo:true,echoHealth:0};
  if(!current||typeof current!=="object")return freshProgress();
  return {
    survey:current.survey===true,
    mechanism:current.mechanism===true,
    echo:current.echo===true,
    echoHealth:Number.isFinite(current.echoHealth)?limit(Math.floor(current.echoHealth),0,START_HEALTH):START_HEALTH,
    focus:Number.isFinite(current.focus)?limit(Math.floor(current.focus),0,MAX_FOCUS):MAX_FOCUS,
    turns:Number.isFinite(current.turns)?limit(Math.floor(current.turns),0,10000):0,
    lane:Number.isInteger(current.lane)?limit(current.lane,0,2):1
  };
}
export function validateExpeditions(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return {};
  const output={};
  for(const id of worldIds){
    if(!raw[id]||typeof raw[id]!=="object"||Array.isArray(raw[id]))continue;
    const p=expeditionProgress({expeditions:raw},id);
    output[id]={
      survey:p.survey||p.mechanism||p.echo,
      mechanism:p.mechanism||p.echo,
      echo:p.echo,
      echoHealth:p.echo?0:p.echoHealth,
      focus:p.focus,
      turns:p.turns,
      lane:p.lane
    };
  }
  return output;
}
export function validateSquad(raw,recruits){
  const allowed=new Set((Array.isArray(recruits)?recruits:[]).filter(id=>thinkerIds.includes(id)));
  const candidates=Array.isArray(raw)?raw:recruits;
  return [...new Set(candidates.filter(id=>typeof id==="string"&&allowed.has(id)))].slice(0,MAX_SQUAD);
}
export function toggleSquadMember(state,thinkerId){
  if(!state.recruits.includes(thinkerId)||!thinkerIds.includes(thinkerId))return state;
  const original=validateSquad(state.squad,state.recruits);
  if(original.includes(thinkerId)){
    return {...state,squad:original.filter(id=>id!==thinkerId)};
  }
  if(original.length>=MAX_SQUAD)return state;
  return {...state,squad:[...original,thinkerId]};
}
function updateProgress(state,worldId,next,description,stability=0,insight=0){
  return {
    ...state,
    expeditions:{...state.expeditions,[worldId]:next},
    stability:limit(state.stability+stability,0,100),
    insight:state.insight+insight,
    log:[...state.log,description].slice(-50)
  };
}
function validUnfinished(state,id){return Boolean(expeditions[id])&&!state.completed.includes(id);}
export function surveySite(state,worldId){
  if(!validUnfinished(state,worldId))return state;
  const p=expeditionProgress(state,worldId);
  if(p.survey)return state;
  return updateProgress(state,worldId,{...p,survey:true},
    expeditions[worldId].clue,0,1);
}
export function solveMechanism(state,worldId,solutionId){
  if(!validUnfinished(state,worldId))return state;
  const p=expeditionProgress(state,worldId);
  if(!p.survey||p.mechanism)return state;
  const solution=expeditions[worldId].solutions.find(x=>x.id===solutionId);
  if(!solution||!solution.requires.every(id=>state.squad.includes(id)))return state;
  if(solution.correct&&!state.squad.includes(worlds.find(w=>w.id===worldId).needed))return state;
  const bonus=solution.correct&&solution.id==="synergy"?rapportBonus(state,solution.requires):0;
  return updateProgress(state,worldId,solution.correct?{...p,mechanism:true}:p,
    solution.result+(bonus?" Shared trust strengthens the result.":""),solution.stability+bonus,solution.insight);
}
export function availableMoves(state,worldId){
  if(!validUnfinished(state,worldId))return [];
  const squad=validateSquad(state.squad,state.recruits);
  const moves=squad.map(id=>({id,...encounterMoves[id]})).filter(m=>m.label);
  if(squad.length>=2)moves.push({id:"synergy",...encounterMoves.synergy});
  return moves;
}
export function strikeEcho(state,worldId,moveId){
  if(!validUnfinished(state,worldId))return state;
  const p=expeditionProgress(state,worldId);
  if(!p.mechanism||p.echo)return state;
  const move=availableMoves(state,worldId).find(m=>m.id===moveId);
  if(!move||p.focus<move.cost)return state;
  const health=limit(p.echoHealth-move.damage,0,START_HEALTH);
  const victory=health===0;
  const next={...p,echoHealth:health,focus:p.focus-move.cost,turns:p.turns+1,echo:victory};
  const message=victory?expeditions[worldId].victory:
    move.label+" weakens "+expeditions[worldId].enemy+". Its unstable wake disturbs the field.";
  return updateProgress(state,worldId,next,message,victory?1:-2,victory?2:0);
}
export function recoverFocus(state,worldId){
  if(!validUnfinished(state,worldId))return state;
  const p=expeditionProgress(state,worldId);
  if(!p.mechanism||p.echo||p.focus>=MAX_FOCUS)return state;
  const next={...p,focus:limit(p.focus+2,0,MAX_FOCUS),turns:p.turns+1};
  return updateProgress(state,worldId,next,
    "The team regroups under pressure. Their focus returns, but the echo surges.",-1);
}
export function coreReady(state,worldId){
  if(state.completed.includes(worldId))return true;
  if(!expeditions[worldId])return false;
  const p=expeditionProgress(state,worldId);
  return p.survey&&p.mechanism&&p.echo;
}
export function nextObjective(state,worldId){
  if(state.completed.includes(worldId))return "Revisit a stabilized reality, or return to Elsewhen.";
  const p=expeditionProgress(state,worldId);
  if(!p.survey)return "Survey the anomaly on the left side of the map.";
  if(!p.mechanism)return "Solve the mechanism on the right side of the map.";
  if(!p.echo)return "Quiet the Paradox Echo near the southern pathway.";
  return "The core is open. Make the final equilibrium decision.";
}
