import test from "node:test";
import assert from "node:assert/strict";
import { initialState, restoreState, travel } from "../src/state.js";
import { clockStations } from "../src/clock-rules.js";
import { reflectionMirrors } from "../src/reflection-rules.js";
import { blocked } from "../src/navigation.js";
import {
  testimony,evidence,witnessBoard,witnessEntrance,witnessExit,
  caseOptions,verdictOptions,initialWitness,validateWitness,
  witnessAvailable,witnessSummary,interviewWitness,inspectEvidence,
  testHypothesis,recordVerdict
} from "../src/witness-rules.js";

function priorGalleryDone(){
  let state=initialState();
  state.clock={fragments:["hours","current","index"],dial:["6","3","9"],solved:true,stations:clockStations.map(s=>s.id)};
  state.reflection={met:true,mirrors:Object.fromEntries(reflectionMirrors.map(m=>[m.id,m.choices[0].id])),resolved:"harmonize"};
  return state;
}
function withEvidence(){
  let state=travel(priorGalleryDone(),"witnesshall");
  for(const t of testimony)state=interviewWitness(state,t.id);
  for(const e of evidence)state=inspectEvidence(state,e.id);
  return state;
}
test("authored witnesses and evidence are unique, grounded and reachable",()=>{
  assert.equal(testimony.length,3);
  assert.equal(evidence.length,2);
  assert.equal(new Set(testimony.map(x=>x.id)).size,3);
  assert.equal(new Set(evidence.map(x=>x.id)).size,2);
  assert.equal(caseOptions.length,3);
  assert.equal(verdictOptions.length,3);
  assert.equal(caseOptions.filter(c=>c.correct).length,1);
  for(const point of [...testimony,...evidence,witnessBoard,witnessEntrance,witnessExit]){
    assert.equal(blocked(point===witnessEntrance?"gallery":"witnesshall",point.x,point.y),false,point.name);
  }
});
test("the hall is locked until a legitimate reflection conclusion",()=>{
  const start=initialState();
  assert.equal(witnessAvailable(start),false);
  assert.equal(travel(start,"witnesshall"),start);
  assert.equal(interviewWitness(start,"keeper"),start);
  assert.equal(inspectEvidence(start,"bell"),start);
  assert.equal(testHypothesis(start,"frames"),start);
  assert.equal(recordVerdict(start,"preserve"),start);
  const partial=priorGalleryDone();
  partial.reflection={...partial.reflection,resolved:null};
  assert.equal(witnessAvailable(partial),false);
  assert.equal(travel(partial,"witnesshall"),partial);
});
test("old Rung 7 save unlocks hall without deleting progress",()=>{
  const old=priorGalleryDone();
  delete old.witness;
  old.records=["garden-first"];
  old.insight=34;
  const migrated=restoreState(old);
  assert.deepEqual(migrated.witness,initialWitness());
  assert.equal(witnessAvailable(migrated),true);
  assert.deepEqual(migrated.records,["garden-first"]);
  assert.equal(migrated.insight,34);
  const inHall=travel(migrated,"witnesshall");
  assert.equal(inHall.scene,"witnesshall");
  assert.equal(restoreState(inHall).scene,"witnesshall");
  assert.equal(travel(inHall,"gallery").scene,"gallery");
  assert.equal(restoreState({...initialState(),scene:"witnesshall"}).scene,"elsewhen");
});
test("witnesses and physical traces award insight once and can be gathered in any order",()=>{
  let s=travel(priorGalleryDone(),"witnesshall");
  const startInsight=s.insight;
  for(const item of [...evidence,...testimony].reverse()){
    const previous=s;
    s=item.id==="bell"||item.id==="tracks"?inspectEvidence(s,item.id):interviewWitness(s,item.id);
    assert.equal(s.insight,previous.insight+1);
    const twice=item.id==="bell"||item.id==="tracks"?inspectEvidence(s,item.id):interviewWitness(s,item.id);
    assert.equal(twice,s);
  }
  assert.equal(s.insight,startInsight+5);
  assert.equal(witnessSummary(s).count,5);
  assert.equal(witnessSummary(s).canDeduce,true);
  assert.equal(witnessSummary(restoreState(s)).count,5);
});
test("incorrect accusations cannot be repeated to farm or cause repeated damage",()=>{
  const start=withEvidence();
  const wrong=testHypothesis(start,"accuse");
  assert.equal(wrong.stability,start.stability-2);
  assert.deepEqual(wrong.witness.rejected,["accuse"]);
  assert.equal(testHypothesis(wrong,"accuse"),wrong);
  const second=testHypothesis(wrong,"single");
  assert.equal(second.stability,wrong.stability-2);
  assert.equal(testHypothesis(second,"single"),second);
  assert.equal(witnessSummary(second).canDeduce,true);
});
test("unsupported deductions or unknown evidence never mutate state",()=>{
  let s=travel(priorGalleryDone(),"witnesshall");
  assert.equal(testHypothesis(s,"frames"),s);
  assert.equal(interviewWitness(s,"invalid"),s);
  assert.equal(inspectEvidence(s,"unknown"),s);
  s=withEvidence();
  assert.equal(testHypothesis(s,"nope"),s);
  assert.equal(recordVerdict(s,"map"),s);
});
test("a grounded deduction unlocks the concluding case decision",()=>{
  const s=withEvidence();
  const next=testHypothesis(s,"frames");
  assert.equal(next.witness.hypothesis,"frames");
  assert.equal(next.insight,s.insight+2);
  assert.equal(witnessSummary(next).canDecide,true);
  assert.equal(testHypothesis(next,"frames"),next);
  assert.equal(witnessSummary(restoreState(next)).canDecide,true);
});
test("all three case outcomes are distinct, permanent and reload-safe",()=>{
  let s=testHypothesis(withEvidence(),"frames");
  for(const option of verdictOptions){
    const resolved=recordVerdict(s,option.id);
    assert.equal(resolved.witness.verdict,option.id);
    assert.equal(resolved.stability,s.stability+option.stability);
    assert.equal(resolved.insight,s.insight+option.insight);
    assert.equal(witnessSummary(resolved).complete,true);
    assert.equal(recordVerdict(resolved,"preserve"),resolved);
    assert.equal(testHypothesis(resolved,"accuse"),resolved);
    assert.equal(restoreState(resolved).witness.verdict,option.id);
  }
});
test("malformed and old case data is safely sanitized",()=>{
  assert.deepEqual(validateWitness(null),initialWitness());
  assert.deepEqual(restoreState(initialState()).witness,initialWitness());
  const broken=validateWitness({
    heard:["keeper","keeper","invalid",null],
    evidence:["bell","bogus"],
    rejected:["accuse","accuse","frames"],
    hypothesis:"frames",verdict:"map"
  });
  assert.deepEqual(broken.heard,["keeper"]);
  assert.deepEqual(broken.evidence,["bell"]);
  assert.deepEqual(broken.rejected,["accuse"]);
  assert.equal(broken.hypothesis,null);
  assert.equal(broken.verdict,null);
});
test("new story content remains spoiler-safe",()=>{
  const source=JSON.stringify({testimony,evidence,caseOptions,verdictOptions});
  for(const secret of ["ARCLight","Project 3333","HOMO SAPIENS EXTINCT","Observer 369"]){
    assert.equal(source.includes(secret),false);
  }
});
