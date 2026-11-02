import { clockSummary } from "./clock-rules.js";

// The first optional post-clock chapter. These fictional experiments are not
// claims about actual physics, and deliberately disclose no late-story secrets.
export const unwrittenVisitor=Object.freeze({
  id:"schrodinger",name:"Erwin Schrödinger",initials:"ES",x:574,y:344,color:"#f0d5a0",
  introduction:"I have arrived in Elsewhen with a wooden case, Michael. Please don't ask me to open it. I'm not sure the case agrees with itself.",
  followup:"The case was empty when I packed it, unless I remember packing a different case. That is the difficulty with this place.",
  after:"You found the Reflection Gallery. I wonder whether its mirrors showed you possibilities, or taught the possibilities how to become real."
});
export const reflectionMirrors=Object.freeze([
  {
    id:"origin",name:"Mirror of Origins",symbol:"Ⅰ",x:225,y:282,color:"#98e5c1",
    prompt:"You see a garden with two histories. One tree has lived for centuries; the other remembers centuries it never lived. Both are growing.",
    choices:[
      {id:"preserve",label:"Preserve both histories",delta:1,insight:1,
        text:"Both histories persist. Their roots learn to grow around one another, even where they disagree."},
      {id:"trace",label:"Trace the earliest measurable cause",delta:2,insight:1,
        text:"One observation becomes a reference. The other history remains possible, but no longer claims to be the only one."}
    ]
  },
  {
    id:"current",name:"Mirror of Currents",symbol:"Ⅱ",x:480,y:201,color:"#9bdcf5",
    prompt:"A closed circuit illuminates two roads, one occupied and one empty. Only one road can safely accept the charge.",
    choices:[
      {id:"share",label:"Share the load across both roads",delta:1,insight:1,
        text:"Each road bears part of the burden. The occupied road remains lit, but the journey demands care."},
      {id:"ground",label:"Ground the excess before it crosses",delta:2,insight:1,
        text:"The charge finds a safe resting place. Neither road must bear what it cannot carry."}
    ]
  },
  {
    id:"witness",name:"Mirror of Witnesses",symbol:"Ⅲ",x:735,y:282,color:"#d6b1f4",
    prompt:"A record describes three people who remember the same event differently. There is no evidence that any one of them is lying.",
    choices:[
      {id:"listen",label:"Keep every account accessible",delta:1,insight:1,
        text:"The archive keeps its contradictions legible. No witness must vanish for the record to remain useful."},
      {id:"verify",label:"Distinguish observations from interpretations",delta:2,insight:1,
        text:"Each testimony is preserved beside its uncertainty. The ledger finally admits what it cannot know."}
    ]
  }
]);
export const reflectionConclusions=Object.freeze([
  {id:"harmonize",label:"Let the three truths coexist",delta:3,
    text:"Three incompatible reflections remain visible. They stop fighting to be the only reality. The gallery becomes quiet without becoming simple."},
  {id:"measure",label:"Create a common frame of observation",delta:4,
    text:"The mirrors share one clear reference but retain their differences. Michael learns that a useful answer may begin by naming uncertainty."},
  {id:"defer",label:"Leave the final answer open",delta:1,
    text:"Michael refuses to close a question that still has witnesses. The gallery accepts the unfinished investigation and records it as a decision."}
]);
export const galleryEntrance=Object.freeze({x:480,y:345,name:"The Reflection Threshold"});
export const galleryExit=Object.freeze({x:480,y:503,name:"Return to Observation Chamber"});
export const galleryCore=Object.freeze({x:480,y:391,name:"The Unanswered Question"});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function initialReflection(){
  return {met:false,mirrors:{},resolved:null};
}
export function validateReflection(raw){
  const base=initialReflection();
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return base;
  const mirrors={};
  for(const mirror of reflectionMirrors){
    const choice=raw.mirrors?.[mirror.id];
    if(mirror.choices.some(x=>x.id===choice))mirrors[mirror.id]=choice;
  }
  const resolved=reflectionMirrors.every(m=>Object.hasOwn(mirrors,m.id))&&
    reflectionConclusions.some(x=>x.id===raw.resolved)?raw.resolved:null;
  return {met:raw.met===true,mirrors,resolved};
}
export function galleryAvailable(state){
  return clockSummary(state).roomComplete;
}
export function reflectionSummary(state){
  const reflection=validateReflection(state.reflection);
  const count=Object.keys(reflection.mirrors).length;
  return {
    ...reflection,
    mirrorCount:count,
    available:galleryAvailable(state),
    canConclude:galleryAvailable(state)&&count===reflectionMirrors.length&&!reflection.resolved,
    complete:Boolean(reflection.resolved),
    next:!galleryAvailable(state)
      ?"Finish the three observations inside Elsewhen's clock tower."
      :reflection.resolved
        ?"The gallery's conclusion is recorded. Revisit its mirrors or speak with the visiting physicist."
        :count<3
          ?"Observe the three mirrors and make a considered choice at each."
          :"All three mirrors have been studied. Approach the central question to conclude the investigation."
  };
}
export function meetUnwrittenVisitor(state){
  if(!galleryAvailable(state)||state.scene!=="elsewhen")return state;
  const reflection=validateReflection(state.reflection);
  if(reflection.met)return state;
  return {
    ...state,reflection:{...reflection,met:true},
    insight:state.insight+1,
    log:[...state.log,"Met Erwin Schrödinger, who carries a perplexing wooden case."].slice(-50)
  };
}
export function chooseReflection(state,mirrorId,choiceId){
  if(state.scene!=="gallery"||!galleryAvailable(state))return state;
  const reflection=validateReflection(state.reflection);
  if(reflection.resolved||Object.hasOwn(reflection.mirrors,mirrorId))return state;
  const mirror=reflectionMirrors.find(m=>m.id===mirrorId);
  const option=mirror?.choices.find(c=>c.id===choiceId);
  if(!option)return state;
  return {
    ...state,
    reflection:{...reflection,mirrors:{...reflection.mirrors,[mirrorId]:choiceId}},
    stability:clamp(state.stability+option.delta,0,100),
    insight:state.insight+option.insight,
    log:[...state.log,mirror.name+": "+option.text].slice(-50)
  };
}
export function concludeReflection(state,choiceId){
  if(state.scene!=="gallery"||!galleryAvailable(state))return state;
  const reflection=validateReflection(state.reflection);
  if(reflection.resolved||!reflectionMirrors.every(m=>Object.hasOwn(reflection.mirrors,m.id)))return state;
  const ending=reflectionConclusions.find(c=>c.id===choiceId);
  if(!ending)return state;
  return {
    ...state,
    reflection:{...reflection,resolved:ending.id},
    stability:clamp(state.stability+ending.delta,0,100),
    insight:state.insight+3,
    log:[...state.log,"Reflection Gallery: "+ending.text].slice(-50)
  };
}
