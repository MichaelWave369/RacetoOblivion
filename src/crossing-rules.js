import { atlasSummary } from "./atlas-rules.js";

// Rung 10 is a physical crossing, not just another menu choice.
// World coordinates are shared with navigation.js and crossing-art.js.
// The writing here is fictional and avoids revealing later story mysteries.
export const crossingEntrance=Object.freeze({x:480,y:108,name:"The Wayfarer's Crossing"});
export const crossingExit=Object.freeze({x:480,y:515,name:"Return to the Living Atlas"});
export const crossingTable=Object.freeze({x:606,y:461,name:"Wayfarer's Route Table"});
export const crossingArrival=Object.freeze({x:480,y:188,name:"The Far Shore"});
export const crossingPaths=Object.freeze([
  {id:"west",name:"The Orchard Bridge",x:184,y:421,color:"#afd7a2",gap:[151,229],
    glyph:"I",observation:"Three footprints approach the old orchard bridge. One is fresh, one is faded and one belongs to a traveler who has yet to arrive.",
    interpretation:"This crossing favors preserving vulnerable histories, even when they cannot agree about which came first."},
  {id:"center",name:"The Lantern Span",x:480,y:405,color:"#e2cd9a",gap:[443,517],
    glyph:"II",observation:"A hanging lantern flickers in a rhythm shared by three different roads. Its light falls in the same direction from every side.",
    interpretation:"This crossing offers a common reference, but only if each observer agrees on what was measured."},
  {id:"east",name:"The Glass Footbridge",x:778,y:421,color:"#a7dcef",gap:[735,821],
    glyph:"III",observation:"A translucent bridge reflects travelers standing on its far bank, even while the near bank remains empty.",
    interpretation:"This crossing favors the unexplored route, trusting that a careful traveler will leave evidence behind."}
]);
export const crossingEndings=Object.freeze([
  {id:"shelter",label:"Keep a safe passage open for travelers",stability:4,insight:1,
    text:"The chosen bridge is marked as a refuge. Its lights guide later travelers without hiding the hazards beside it."},
  {id:"record",label:"Catalogue every route and its uncertainty",stability:2,insight:3,
    text:"Mera's chart preserves the chosen crossing alongside the conditions that made it safe. Future travelers can question the record."},
  {id:"share",label:"Share the route with the whole town",stability:3,insight:2,
    text:"The route becomes part of Elsewhen's common knowledge. No single scholar gets to own the road."}
]);
const pathIds=crossingPaths.map(p=>p.id);
const endingIds=crossingEndings.map(o=>o.id);
const clean=(value,allowed)=>Array.isArray(value)?[...new Set(value.filter(x=>typeof x==="string"&&allowed.includes(x)))]:[];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const log=(state,msg)=>[...state.log,msg].slice(-50);
export function initialCrossing(){return {observed:[],chosen:null,arrived:false,ending:null};}
export function validateCrossing(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return initialCrossing();
  const observed=clean(raw.observed,pathIds);
  const chosen=observed.length===3&&pathIds.includes(raw.chosen)?raw.chosen:null;
  const arrived=Boolean(chosen&&raw.arrived===true);
  const ending=arrived&&endingIds.includes(raw.ending)?raw.ending:null;
  return {observed,chosen,arrived,ending};
}
export function crossingAvailable(state){return atlasSummary(state).complete;}
export function crossingSummary(state){
  const c=validateCrossing(state.crossing);
  return {...c,available:crossingAvailable(state),count:c.observed.length,
    complete:Boolean(c.ending),
    next:!crossingAvailable(state)?"Finish and publish the Living Atlas route first.":
      c.ending?"The crossing is recorded. Return to Elsewhen and tell Mera what you found.":
      c.observed.length<3?"Walk to all three southern bridge markers and study their observations.":
      !c.chosen?"Use the Wayfarer's Route Table to select one bridge. The other two will remain closed.":
      !c.arrived?"Cross the actual water channel using your chosen bridge, then reach the Far Shore.":"The Far Shore is reached. Decide how the passage should serve Elsewhen."
  };
}
export function observeCrossingPath(state,pathId){
  if(state.scene!=="crossing"||!crossingAvailable(state))return state;
  const path=crossingPaths.find(p=>p.id===pathId),c=validateCrossing(state.crossing);
  if(!path||c.observed.includes(path.id))return state;
  return {...state,crossing:{...c,observed:[...c.observed,path.id]},
    insight:state.insight+1,log:log(state,"Bridge observation: "+path.name+".")};
}
export function selectCrossingPath(state,pathId){
  if(state.scene!=="crossing"||!crossingAvailable(state))return state;
  const path=crossingPaths.find(p=>p.id===pathId),c=validateCrossing(state.crossing);
  if(!path||c.observed.length!==3||c.chosen)return state;
  return {...state,crossing:{...c,chosen:path.id},
    log:log(state,"The "+path.name+" is open. The other approaches remain sealed.")};
}
export function reachFarShore(state){
  if(state.scene!=="crossing"||!crossingAvailable(state))return state;
  const c=validateCrossing(state.crossing);
  // Require genuinely reaching the northern marker by world-space movement.
  if(!c.chosen||c.arrived||Math.hypot(state.x-crossingArrival.x,state.y-crossingArrival.y)>56)return state;
  return {...state,crossing:{...c,arrived:true},
    insight:state.insight+2,log:log(state,"Reached the far shore by the "+crossingPaths.find(p=>p.id===c.chosen).name+".")};
}
export function concludeCrossing(state,endingId){
  if(state.scene!=="crossing"||!crossingAvailable(state))return state;
  const c=validateCrossing(state.crossing),ending=crossingEndings.find(e=>e.id===endingId);
  if(!c.arrived||c.ending||!ending)return state;
  return {...state,crossing:{...c,ending:ending.id},
    insight:state.insight+ending.insight,
    stability:clamp(state.stability+ending.stability,0,100),
    log:log(state,"Wayfarer's Crossing: "+ending.text)};
}
