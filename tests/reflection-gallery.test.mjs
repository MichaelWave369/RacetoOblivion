import test from "node:test";
import assert from "node:assert/strict";
import { initialState, restoreState, travel } from "../src/state.js";
import { clockStations } from "../src/clock-rules.js";
import { blocked } from "../src/navigation.js";
import {
  unwrittenVisitor, reflectionMirrors, reflectionConclusions, galleryEntrance, galleryExit, galleryCore,
  initialReflection, validateReflection, galleryAvailable, reflectionSummary,
  meetUnwrittenVisitor, chooseReflection, concludeReflection
} from "../src/reflection-rules.js";

function completedClock(){
  const state=initialState();
  return {...state,clock:{
    fragments:["hours","current","index"],dial:["6","3","9"],solved:true,
    stations:clockStations.map(s=>s.id)
  }};
}
test("new content has three unique mirrors and three legitimate conclusions",()=>{
  assert.equal(reflectionMirrors.length,3);
  assert.equal(new Set(reflectionMirrors.map(m=>m.id)).size,3);
  assert.equal(reflectionConclusions.length,3);
  assert.equal(new Set(reflectionConclusions.map(c=>c.id)).size,3);
  for(const m of reflectionMirrors){
    assert.equal(m.choices.length,2);
    assert.ok(m.prompt.length>45);
    assert.equal(blocked("gallery",m.x,m.y),false);
  }
  for(const node of [galleryEntrance,galleryExit,galleryCore]){
    assert.equal(blocked("gallery",node.x,node.y),false);
  }
  assert.equal(blocked("elsewhen",unwrittenVisitor.x,unwrittenVisitor.y),false);
});
test("gallery cannot be entered or explored before three clock observations",()=>{
  const state=initialState();
  assert.equal(galleryAvailable(state),false);
  assert.equal(travel(state,"gallery"),state);
  assert.equal(meetUnwrittenVisitor(state),state);
  assert.equal(chooseReflection(state,"origin","trace"),state);
  assert.equal(concludeReflection(state,"harmonize"),state);
  const solvedWithoutStations={...completedClock(),clock:{...completedClock().clock,stations:["lens","ledger"]}};
  assert.equal(galleryAvailable(solvedWithoutStations),false);
  assert.equal(travel(solvedWithoutStations,"gallery"),solvedWithoutStations);
});
test("prior completed clock saves unlock gallery without losing prior data",()=>{
  const preRung7=completedClock();
  delete preRung7.reflection;
  preRung7.records=["garden-first"];
  preRung7.insight=27;
  const migrated=restoreState(preRung7);
  assert.deepEqual(migrated.reflection,initialReflection());
  assert.equal(galleryAvailable(migrated),true);
  assert.equal(migrated.insight,27);
  assert.deepEqual(migrated.records,["garden-first"]);
  const entered=travel(migrated,"gallery");
  assert.equal(entered.scene,"gallery");
  assert.equal(entered.y,325);
  assert.equal(restoreState(entered).scene,"gallery");
  assert.equal(travel(entered,"clockroom").scene,"clockroom");
});
test("the mysterious visitor is encountered once in town without becoming a battle recruit",()=>{
  const initial=completedClock();
  assert.equal(meetUnwrittenVisitor({...initial,scene:"clockroom"}).reflection.met,false);
  const met=meetUnwrittenVisitor(initial);
  assert.equal(met.reflection.met,true);
  assert.equal(met.insight,initial.insight+1);
  assert.deepEqual(met.recruits,initial.recruits);
  assert.equal(meetUnwrittenVisitor(met),met);
  assert.equal(reflectionSummary(restoreState(met)).met,true);
});
test("mirror observations can be made in any order; each is recorded once",()=>{
  let state=travel(completedClock(),"gallery");
  for(const m of [...reflectionMirrors].reverse()){
    const before=state;
    state=chooseReflection(state,m.id,m.choices[0].id);
    assert.equal(state.insight,before.insight+1);
    assert.equal(chooseReflection(state,m.id,m.choices[1].id),state);
  }
  assert.equal(reflectionSummary(state).mirrorCount,3);
  assert.equal(reflectionSummary(state).canConclude,true);
  assert.deepEqual(Object.keys(restoreState(state).reflection.mirrors).length,3);
});
test("different choices have meaningfully different persistent outcomes",()=>{
  const start=travel(completedClock(),"gallery");
  const a=chooseReflection(start,"origin","preserve");
  const b=chooseReflection(start,"origin","trace");
  assert.equal(a.stability,start.stability+1);
  assert.equal(b.stability,start.stability+2);
  assert.notEqual(a.reflection.mirrors.origin,b.reflection.mirrors.origin);
  assert.equal(chooseReflection(a,"unknown","preserve"),a);
  assert.equal(chooseReflection(a,"current","not-real"),a);
});
test("the final question is gated by all three mirrors and gives a one-time result",()=>{
  let state=travel(completedClock(),"gallery");
  assert.equal(concludeReflection(state,"harmonize"),state);
  for(const m of reflectionMirrors)state=chooseReflection(state,m.id,m.choices[0].id);
  assert.equal(concludeReflection(state,"bogus"),state);
  const done=concludeReflection(state,"harmonize");
  assert.equal(reflectionSummary(done).complete,true);
  assert.equal(done.insight,state.insight+3);
  assert.equal(done.stability,state.stability+3);
  assert.equal(concludeReflection(done,"measure"),done);
  assert.equal(chooseReflection(done,"current","ground"),done);
  assert.deepEqual(restoreState(done).reflection,done.reflection);
});
test("every conclusion preserves a different decision and is reload safe",()=>{
  for(const outcome of reflectionConclusions){
    let state=travel(completedClock(),"gallery");
    for(const m of reflectionMirrors)state=chooseReflection(state,m.id,m.choices[1].id);
    state=concludeReflection(state,outcome.id);
    assert.equal(reflectionSummary(state).resolved,outcome.id);
    assert.equal(reflectionSummary(restoreState(state)).resolved,outcome.id);
  }
});
test("scene and corrupted stored reflection state are validated strictly",()=>{
  const fresh=initialState();
  assert.equal(restoreState({...fresh,scene:"gallery"}).scene,"elsewhen");
  assert.deepEqual(validateReflection(null),initialReflection());
  const corrupt=validateReflection({
    met:"true",
    mirrors:{origin:"trace",current:"unknown",witness:"listen",__proto__:{hacked:"sure"}},
    resolved:"measure"
  });
  assert.equal(corrupt.met,false);
  assert.deepEqual(corrupt.mirrors,{origin:"trace",witness:"listen"});
  assert.equal(corrupt.resolved,null);
  const complete=validateReflection({met:true,
    mirrors:{origin:"trace",current:"share",witness:"verify"},resolved:"defer"});
  assert.equal(complete.resolved,"defer");
});
test("the new public-facing chapter contains no late-game revelations",()=>{
  const text=JSON.stringify({unwrittenVisitor,reflectionMirrors,reflectionConclusions});
  for(const spoiler of ["ARCLight","Project 3333","HOMO SAPIENS EXTINCT","Observer 369"]){
    assert.equal(text.includes(spoiler),false);
  }
});
