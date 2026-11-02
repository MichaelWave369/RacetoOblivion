import { reflectionSummary } from "./reflection-rules.js";

// Rung 8: a human-scale investigation, not an explanation of the setting.
// Keep late-game lore out of publicly deployed source and metadata.
export const witnessEntrance=Object.freeze({x:480,y:112,name:"The Hall of Witnesses"});
export const witnessExit=Object.freeze({x:480,y:506,name:"Return to the Reflection Gallery"});
export const testimony=Object.freeze([
  {id:"keeper",name:"Sol · The Bell Keeper",x:205,y:264,color:"#d8b995",
    statement:"The tower bell rang before I pulled its rope. It rang twice, but only one sound reached me.",
    followup:"I kept the rope still after the second sound. Please do not turn my uncertainty into a confession."},
  {id:"courier",name:"Neri · The Courier",x:480,y:214,color:"#9ed9d8",
    statement:"I crossed the square between the two chimes. Yet the shadows moved backward, and every clock disagreed.",
    followup:"I remember the footsteps exactly. My arrival time is less certain than my route."},
  {id:"caretaker",name:"Bram · The Caretaker",x:755,y:264,color:"#cbb2ec",
    statement:"After the bell, I swept two sets of footprints from one doorway. One set led into the courtyard and one led out.",
    followup:"The dust was undisturbed beneath both sets. I cannot say which was made first."}
]);
export const evidence=Object.freeze([
  {id:"bell",name:"The Bell Plate",x:256,y:391,color:"#e4c38c",
    statement:"Two strikes left different vibration patterns on the plate. A single mechanism appears to have been heard through two conflicting time references."},
  {id:"tracks",name:"The Courtyard Tracks",x:704,y:391,color:"#a8d9bf",
    statement:"Two trails overlap but neither obscures the other. The evidence cannot establish one universal before-and-after order."}
]);
export const witnessBoard=Object.freeze({x:480,y:355,name:"The Contradiction Board"});
export const caseOptions=Object.freeze([
  {id:"accuse",label:"One witness must be lying",correct:false,
    text:"The evidence doesn't support an accusation. The board rejects a conclusion that discards testimony without proving it false."},
  {id:"single",label:"Force all accounts onto one clock",correct:false,
    text:"The tracks and bell cannot be reconciled under a single unverified clock. The board resets its inference."},
  {id:"frames",label:"Compare observations using separate time references",correct:true,
    text:"The bell, shadows and footprints become consistent when their observers' clocks are treated as distinct measurement frames."}
]);
export const verdictOptions=Object.freeze([
  {id:"preserve",label:"Preserve all accounts with their uncertainty",stability:2,insight:2,
    text:"Every testimony is preserved alongside its uncertainty. The witnesses can disagree without one becoming an enemy."},
  {id:"map",label:"Publish the reconciled observation map",stability:3,insight:2,
    text:"A shared diagram explains the different observations without claiming that the observers saw identical events."},
  {id:"open",label:"Keep the case open for new evidence",stability:1,insight:3,
    text:"The investigation remains open. The record makes space for evidence not yet discovered instead of forcing a verdict."}
]);
const witnessIds=testimony.map(w=>w.id), evidenceIds=evidence.map(e=>e.id);
const falseIds=caseOptions.filter(c=>!c.correct).map(c=>c.id);
const pick=(raw,allowed)=>Array.isArray(raw)?[...new Set(raw.filter(s=>typeof s==="string"&&allowed.includes(s)))]:[];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function initialWitness(){
  return {heard:[],evidence:[],rejected:[],hypothesis:null,verdict:null};
}
export function validateWitness(raw){
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return initialWitness();
  const heard=pick(raw.heard,witnessIds);
  const found=pick(raw.evidence,evidenceIds);
  const rejected=pick(raw.rejected,falseIds);
  const ready=heard.length===witnessIds.length&&found.length===evidenceIds.length;
  const hypothesis=ready&&raw.hypothesis==="frames"?"frames":null;
  const verdict=hypothesis&&verdictOptions.some(v=>v.id===raw.verdict)?raw.verdict:null;
  return {heard,evidence:found,rejected,hypothesis,verdict};
}
export function witnessAvailable(state){
  return reflectionSummary(state).complete;
}
export function witnessSummary(state){
  const caseState=validateWitness(state.witness),unlocked=witnessAvailable(state);
  const allEvidence=caseState.heard.length===witnessIds.length&&caseState.evidence.length===evidenceIds.length;
  return {
    ...caseState,
    unlocked,
    count:caseState.heard.length+caseState.evidence.length,
    total:witnessIds.length+evidenceIds.length,
    canDeduce:unlocked&&allEvidence&&!caseState.hypothesis,
    canDecide:unlocked&&Boolean(caseState.hypothesis)&&!caseState.verdict,
    complete:Boolean(caseState.verdict),
    next:!unlocked
      ?"Finish your interpretation of the three mirrors in the Reflection Gallery."
      :caseState.verdict
        ?"The case is recorded. Revisit the Hall of Witnesses or discuss its meaning with the physicist in Elsewhen."
        :!allEvidence
          ?"Hear all three witnesses and inspect the two physical clues in the Hall of Witnesses."
          :!caseState.hypothesis
            ?"Compare the testimony and evidence on the Contradiction Board."
            :"The observations now agree. Return to the Contradiction Board to decide what the record should say."
  };
}
function log(state,message){
  return [...state.log,message].slice(-50);
}
export function interviewWitness(state,id){
  if(!witnessAvailable(state)||state.scene!=="witnesshall")return state;
  const person=testimony.find(x=>x.id===id),saved=validateWitness(state.witness);
  if(!person||saved.heard.includes(id))return state;
  return {
    ...state,witness:{...saved,heard:[...saved.heard,id]},
    insight:state.insight+1,
    log:log(state,"Witness testimony: "+person.name+".")
  };
}
export function inspectEvidence(state,id){
  if(!witnessAvailable(state)||state.scene!=="witnesshall")return state;
  const item=evidence.find(x=>x.id===id),saved=validateWitness(state.witness);
  if(!item||saved.evidence.includes(id))return state;
  return {
    ...state,witness:{...saved,evidence:[...saved.evidence,id]},
    insight:state.insight+1,
    log:log(state,"Physical evidence examined: "+item.name+".")
  };
}
export function testHypothesis(state,id){
  if(!witnessAvailable(state)||state.scene!=="witnesshall")return state;
  const summary=witnessSummary(state),choice=caseOptions.find(x=>x.id===id);
  if(!choice||!summary.canDeduce||(!choice.correct&&summary.rejected.includes(id)))return state;
  const saved=validateWitness(state.witness);
  if(choice.correct){
    return {...state,
      witness:{...saved,hypothesis:"frames"},
      insight:state.insight+2,
      log:log(state,"Deduction confirmed: "+choice.text)};
  }
  return {...state,
    witness:{...saved,rejected:[...saved.rejected,id]},
    stability:clamp(state.stability-2,0,100),
    log:log(state,"Unproven hypothesis rejected: "+choice.text)};
}
export function recordVerdict(state,id){
  if(!witnessAvailable(state)||state.scene!=="witnesshall")return state;
  const summary=witnessSummary(state),option=verdictOptions.find(v=>v.id===id);
  if(!option||!summary.canDecide)return state;
  const saved=validateWitness(state.witness);
  return {...state,
    witness:{...saved,verdict:id},
    insight:state.insight+option.insight,
    stability:clamp(state.stability+option.stability,0,100),
    log:log(state,"Missing Witness case concluded: "+option.text)};
}
