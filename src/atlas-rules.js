import { witnessSummary } from "./witness-rules.js";

// Rung 9: original fictional navigation logic with no late-story spoilers.
// Physical observations must be made before a path may be charted.
export const mapmaker=Object.freeze({
  x:770,y:517,name:"Mera · The Cartographer",color:"#d3b8e9",
  greeting:"I charted every road through Elsewhen. Yesterday, the same road brought three travelers to three different destinations. Would you help me measure it?",
  after:"The roads no longer contradict the observations. That does not mean every traveler must take the same road."
});
export const atlasEntrance=Object.freeze({x:480,y:112,name:"The Cartographer's Threshold"});
export const atlasExit=Object.freeze({x:480,y:510,name:"Return to the Hall of Witnesses"});
export const atlasChart=Object.freeze({x:480,y:383,name:"The Route Table"});
export const atlasBeacons=Object.freeze([
  {id:"west",x:226,y:282,symbol:"W",name:"The Western Mark",color:"#eac18b",
    clue:"The westward shadow appears only after the northern bell has sounded. WEST must come last.",
    observation:"A compass needle draws a westbound road after the northbound path has already appeared."},
  {id:"east",x:734,y:282,symbol:"E",name:"The Eastern Mark",color:"#99dfca",
    clue:"The eastern light reaches the path before either bell or shadow. EAST comes first.",
    observation:"A thin ray of light arrives before the first recorded chime. The road seems to begin in the east."},
  {id:"north",x:480,y:189,symbol:"N",name:"The Northern Mark",color:"#bda9ef",
    clue:"The northern bell sounds after the eastern light but before the western shadow. NORTH is in the middle.",
    observation:"A brass bell points north and rings once between two movements of the sky."}
]);
export const atlasRoute=Object.freeze(["east","north","west"]);
export const atlasEndings=Object.freeze([
  {id:"common",label:"Publish a shared map with observer notes",balance:3,insight:2,
    result:"Every route gains an annotation explaining which observer traced it. The map becomes useful without pretending every journey is identical."},
  {id:"safe",label:"Mark the safest measured route first",balance:4,insight:1,
    result:"The safest observed route shines clearly. Alternative pathways remain visible, so no traveler is forced to forget their experience."},
  {id:"open",label:"Preserve the roads still unexplained",balance:2,insight:3,
    result:"The chart leaves space for roads that have not yet appeared. Elsewhen retains its mysteries without losing its way."}
]);
const beaconIds=atlasBeacons.map(b=>b.id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distinct=(value,allowed)=>Array.isArray(value)?[...new Set(value.filter(x=>typeof x==="string"&&allowed.includes(x)))]:[];
const allowedMistakes=atlasRoute.flatMap((_,step)=>beaconIds.map(id=>step+":"+id));
export function initialAtlas(){return {met:false,scanned:[],route:[],mistakes:[],ending:null};}
export function validateAtlas(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return initialAtlas();
  const scanned=distinct(raw.scanned,beaconIds);
  const complete=scanned.length===beaconIds.length;
  const trial=Array.isArray(raw.route)?raw.route.filter(id=>typeof id==="string").slice(0,3):[];
  const valid=trial.every((id,i)=>id===atlasRoute[i]);
  const route=complete&&valid?trial:[];
  const ending=route.length===3&&atlasEndings.some(e=>e.id===raw.ending)?raw.ending:null;
  return {met:raw.met===true,scanned,route,mistakes:distinct(raw.mistakes,allowedMistakes),ending};
}
export function atlasAvailable(state){return witnessSummary(state).complete;}
export function atlasSummary(state){
  const a=validateAtlas(state.atlas),available=atlasAvailable(state),charted=a.route.length===3;
  return {
    ...a,available,scannedCount:a.scanned.length,totalScans:3,charted,complete:Boolean(a.ending),
    next:!available?
      "Finish the Missing Witness case in the Hall of Witnesses.":
      a.ending?
        "The route has been recorded. Revisit the Atlas or speak with Mera in Elsewhen.":
      a.scanned.length<3?
        "Travel to all three beacons and record their observations.":
      !charted?
        "The observations are complete. Use the Route Table to trace a three-step path.":
        "The path is connected. Choose how Elsewhen should preserve its map."
  };
}
const log=(state,line)=>[...state.log,line].slice(-50);
export function meetMapmaker(state){
  if(state.scene!=="elsewhen"||!atlasAvailable(state))return state;
  const a=validateAtlas(state.atlas);if(a.met)return state;
  return {...state,atlas:{...a,met:true},insight:state.insight+1,
    log:log(state,"Met Mera, Elsewhen's cartographer.")};
}
export function scanBeacon(state,id){
  if(state.scene!=="atlas"||!atlasAvailable(state))return state;
  const beacon=atlasBeacons.find(b=>b.id===id),a=validateAtlas(state.atlas);
  if(!beacon||a.scanned.includes(id))return state;
  return {...state,atlas:{...a,scanned:[...a.scanned,id]},insight:state.insight+1,
    log:log(state,"Atlas observation: "+beacon.name+".")};
}
export function plotStep(state,id){
  if(state.scene!=="atlas"||!atlasAvailable(state))return state;
  const a=validateAtlas(state.atlas),beacon=atlasBeacons.find(b=>b.id===id);
  if(!beacon||a.scanned.length!==3||a.route.length===3||a.ending)return state;
  if(atlasRoute[a.route.length]===id){
    const route=[...a.route,id];
    return {...state,atlas:{...a,route},
      insight:state.insight+(route.length===3?2:0),
      log:log(state,route.length===3?"The cartographer's path has been traced.":"Route segment aligned: "+beacon.name+".")};
  }
  const key=a.route.length+":"+id;
  const fresh=!a.mistakes.includes(key);
  return {...state,atlas:{...a,route:[],mistakes:fresh?[...a.mistakes,key]:a.mistakes},
    stability:clamp(state.stability-(fresh?1:0),0,100),
    log:log(state,"The proposed path contradicts the observations. The Route Table resets.")};
}
export function finishAtlas(state,id){
  if(state.scene!=="atlas"||!atlasAvailable(state))return state;
  const a=validateAtlas(state.atlas),option=atlasEndings.find(e=>e.id===id);
  if(!option||a.ending||a.route.length!==atlasRoute.length)return state;
  return {...state,atlas:{...a,ending:id},
    stability:clamp(state.stability+option.balance,0,100),
    insight:state.insight+option.insight,
    log:log(state,"Cartographer's Paradox: "+option.result)};
}
