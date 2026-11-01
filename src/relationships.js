import { thinkers, worlds } from "./content.js";
import { fieldRecords } from "./field-records.js";

// Spoiler-safe, original character chapters. Each quest points at a field
// record already available in Rung 4, so previous players are not locked out.
export const personalQuests = Object.freeze({
  einstein: {
    title:"The Seasons That Never Were",
    record:"garden-first",
    setup:"I need the Seed Without a Season from the Chrono Gardens. A forest without a reliable history might teach us what must be preserved.",
    returnLine:"A tree that remembers three springs is not merely an anomaly. It is a warning that our choices give some lives a future and others only a memory.",
    completedLine:"You brought me evidence, Michael, not another easy answer. I appreciate the difference."
  },
  tesla: {
    title:"An Unfinished Circuit",
    record:"causeway-first",
    setup:"A conductor's diagram went missing on the Glass Causeway. Find it and bring me what the sixth coil reveals. The dangerous part is what the builder left undone.",
    returnLine:"The final circuit was unfinished because completing it would have forced the current into another reality. Sometimes the most useful invention is a restraint.",
    completedLine:"I trust you with the schematics. Your instinct is to understand a machine before turning it on."
  },
  lovelace: {
    title:"An Index Without an Author",
    record:"archive-first",
    setup:"The Echo Archive contains an Unwritten Catalogue. I want to see how it distinguishes observed knowledge from possibility. Recover a copy for us.",
    returnLine:"The catalogue records what it expects, not what it knows. We must never let an elegant prediction replace testimony.",
    completedLine:"We do not merely calculate outcomes together, Michael. We ask what our calculations mean for those living inside them."
  }
});

export const visitors = Object.freeze([
  {id:"curie",name:"Marie Curie",x:146,y:394,initials:"MC",color:"#a9e8ba",
    first:"The observatory has an unusual sample. It doesn't decay so much as reconsider what century it belongs to. I will study it carefully.",
    again:"I would prefer a cautious experiment to a spectacular one that leaves people harmed. Curiosity and responsibility can coexist."},
  {id:"davinci",name:"Leonardo da Vinci",x:838,y:395,initials:"LD",color:"#f3b98c",
    first:"Elsewhen has architecture I cannot understand. Naturally, I have filled twelve notebooks trying. Come back when the fountain changes.",
    again:"A city should be designed for the people who inhabit it. Even a city with impossible clocks."}
]);

export const conclave={id:"conclave",name:"The Conclave",x:615,y:446};

const ids=thinkers.map(person=>person.id);
const validVisitors=visitors.map(v=>v.id);
const validWorlds=worlds.map(w=>w.id);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const unique=(arr,allowed)=>Array.isArray(arr)?[...new Set(arr.filter(x=>typeof x==="string"&&allowed.includes(x)))]:[];

export function initialSocial(){
  return {trust:{einstein:0,tesla:0,lovelace:0},accepted:[],completed:[],debates:[],visitors:[]};
}
export function validateSocial(raw){
  const base=initialSocial();
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return base;
  const completed=unique(raw.completed,ids);
  return {
    trust:Object.fromEntries(ids.map(id=>[id,Number.isFinite(raw.trust?.[id])?clamp(Math.floor(raw.trust[id]),0,6):0])),
    accepted:[...new Set([...unique(raw.accepted,ids),...completed])],
    completed,
    debates:unique(raw.debates,validWorlds),
    visitors:unique(raw.visitors,validVisitors)
  };
}
export function trustFor(state,id){
  if(!ids.includes(id))return 0;
  return validateSocial(state.social).trust[id];
}
export function trustTier(state,id){
  const trust=trustFor(state,id);
  return trust>=4?"CLOSE ALLY":trust>=2?"CONFIDANT":"COLLEAGUE";
}
export function questStatus(state,id){
  if(!ids.includes(id))return "unknown";
  const social=validateSocial(state.social);
  if(social.completed.includes(id))return "completed";
  if(!social.accepted.includes(id))return "available";
  return state.records?.includes(personalQuests[id].record)?"ready":"active";
}
export function acceptPersonalQuest(state,id){
  if(!ids.includes(id)||!state.recruits?.includes(id)||questStatus(state,id)!=="available")return state;
  const social=validateSocial(state.social);
  return {
    ...state,
    social:{...social,accepted:[...social.accepted,id]},
    log:[...state.log,"Personal inquiry started: "+personalQuests[id].title+"."].slice(-50)
  };
}
export function completePersonalQuest(state,id){
  if(!ids.includes(id)||questStatus(state,id)!=="ready")return state;
  const social=validateSocial(state.social);
  return {
    ...state,
    social:{...social,completed:[...social.completed,id],trust:{
      ...social.trust,[id]:clamp(social.trust[id]+2,0,6)
    }},
    insight:state.insight+2,
    log:[...state.log,"Personal inquiry completed: "+personalQuests[id].title+". Trust +2, insight +2."].slice(-50)
  };
}
export function hearVisitor(state,id){
  const visitor=visitors.find(v=>v.id===id);
  if(!visitor)return state;
  const social=validateSocial(state.social);
  if(social.visitors.includes(id))return state;
  return {
    ...state,
    social:{...social,visitors:[...social.visitors,id]},
    insight:state.insight+1,
    log:[...state.log,"Met "+visitor.name+" in Elsewhen."].slice(-50)
  };
}
const rival={gardens:"tesla",causeway:"lovelace",archive:"einstein"};
export const debateChoices=Object.freeze([
  {id:"common",label:"Seek common ground"},
  {id:"einstein",label:"Support Einstein's interpretation"},
  {id:"tesla",label:"Support Tesla's interpretation"},
  {id:"lovelace",label:"Support Lovelace's interpretation"}
]);
export function debateAvailable(state,worldId){
  return validWorlds.includes(worldId)&&state.completed?.includes(worldId)
    && !validateSocial(state.social).debates.includes(worldId)
    && ids.filter(id=>state.recruits?.includes(id)).length>=2;
}
export function resolveDebate(state,worldId,stance){
  if(!debateAvailable(state,worldId)||!debateChoices.some(c=>c.id===stance))return state;
  if(stance!=="common"&&!state.recruits.includes(stance))return state;
  const social=validateSocial(state.social),trust={...social.trust};
  if(stance==="common"){
    for(const id of ids)if(state.recruits.includes(id))trust[id]=clamp(trust[id]+1,0,6);
  }else{
    trust[stance]=clamp(trust[stance]+2,0,6);
    // Taking a side isn't evil, but a competing thinker may disagree.
    if(rival[worldId]!==stance&&state.recruits.includes(rival[worldId])){
      trust[rival[worldId]]=clamp(trust[rival[worldId]]-1,0,6);
    }
  }
  const world=worlds.find(w=>w.id===worldId);
  const result=stance==="common"
    ?"Michael asks the thinkers to test their assumptions together. They leave disagreeing about details, but listening more carefully."
    :"Michael supports "+thinkers.find(t=>t.id===stance).name+
      ". The others consider the evidence, although not everyone appreciates being outvoted.";
  return {
    ...state,
    social:{...social,trust,debates:[...social.debates,worldId]},
    insight:state.insight+1,
    log:[...state.log,"Conclave on "+world.name+": "+result].slice(-50)
  };
}
export function reactionFor(state,id){
  const trust=trustFor(state,id);
  const choice=state.choices||{};
  const base={
    einstein:choice.gardens==="cut"
      ?"You closed the Chrono Gardens quickly. I am still thinking about the histories that disappeared."
      :choice.gardens
        ?"The forest is steady, but certainty was never the point. It was responsibility."
        :"We can calculate a path, Michael. Choosing to walk it is a different question.",
    tesla:choice.causeway==="overload"
      ?"The bridge fell silent at a terrible price. I hope we will build more carefully next time."
      :choice.causeway
        ?"The Causeway taught us that where energy goes matters as much as where it comes from."
        :"A circuit cannot help anyone until we know whom it connects.",
    lovelace:choice.archive==="erase"
      ?"The archive is quieter now. I cannot help wondering whose story was silenced."
      :choice.archive
        ?"The archive has stopped rewriting its own evidence. Now the real investigation can begin."
        :"A pattern can explain a thousand possibilities without choosing one for us."
  }[id]||"";
  return base+(trust>=4?"\n\nI trust you enough to challenge your decisions, not just applaud them.":trust>=2?"\n\nOur work together has become something I value.":"");
}
export function rapportBonus(state,requiredMembers){
  const members=Array.isArray(requiredMembers)?requiredMembers:[];
  if(members.length<2)return 0;
  return members.every(id=>trustFor(state,id)>=2)?2:0;
}
export function socialSummary(state){
  const social=validateSocial(state.social);
  return ids.map(id=>({
    id,name:thinkers.find(t=>t.id===id).name,trust:social.trust[id],
    tier:trustTier(state,id),quest:questStatus(state,id)
  }));
}
