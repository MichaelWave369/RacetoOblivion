import test from "node:test";
import assert from "node:assert/strict";
import {initialState, restoreState, travel, observe, recruit, resolveFracture} from "../src/state.js";
import {blocked} from "../src/navigation.js";
import {
  clockFragments, clockStations, clockOrder, initialClock, validateClock,
  eligibleClockFragment, recoverClockFragment, clockReady, enterClockGlyph,
  observeClockStation, clockSummary
} from "../src/clock-rules.js";

function worldDone(state,worldId){
  const specialists={gardens:"einstein",causeway:"tesla",archive:"lovelace"};
  let next=state;
  if(!next.recruits.includes(specialists[worldId]))next=recruit(next,specialists[worldId]);
  // Older saved games may already have completed these worlds, so emulate a
  // valid recorded finale rather than solving an unrelated combat in this test.
  return resolveFracture(next,worldId,{gardens:"anchor",causeway:"ground",archive:"repair"}[worldId]);
}
function discoverAll(){
  let state=initialState();
  for(const frag of clockFragments){
    state=worldDone(state,frag.world);
    state=observe(state,frag.anchor);
    state=recoverClockFragment(state,frag.anchor);
  }
  return state;
}
test("Rung 6 content has three distinct world-landmark links and chamber objects",()=>{
  assert.equal(clockFragments.length,3);
  assert.equal(clockStations.length,3);
  assert.equal(new Set(clockFragments.map(x=>x.world)).size,3);
  assert.equal(new Set(clockFragments.map(x=>x.anchor)).size,3);
  assert.deepEqual(clockOrder,["6","3","9"]);
  assert.equal(new Set(clockStations.map(x=>x.id)).size,3);
});
test("clock fragment needs its completed world and explored landmark",()=>{
  const start=initialState();
  assert.equal(recoverClockFragment(start,"fountain"),start);
  const observed=observe(start,"fountain");
  assert.equal(recoverClockFragment(observed,"fountain"),observed);
  const completed=worldDone(observed,"gardens");
  assert.equal(eligibleClockFragment(completed,"fountain"),true);
  const recovered=recoverClockFragment(completed,"fountain");
  assert.deepEqual(recovered.clock.fragments,["hours"]);
  assert.equal(recovered.insight,completed.insight+1);
  assert.equal(recoverClockFragment(recovered,"fountain"),recovered);
  assert.equal(recoverClockFragment(recovered,"not-a-landmark"),recovered);
});
test("existing players can recover inscriptions in any order without reset",()=>{
  let state=initialState();
  for(const frag of [...clockFragments].reverse()){
    state=worldDone(state,frag.world);
    state=observe(state,frag.anchor);
    state=recoverClockFragment(state,frag.anchor);
  }
  assert.equal(clockReady(state),true);
  assert.equal(clockSummary(state).fragmentsFound,3);
  assert.equal(clockSummary(state).remaining.length,0);
  assert.equal(clockSummary(state).solved,false);
  assert.deepEqual(restoreState(state).clock.fragments,state.clock.fragments);
});
test("dial rejects unknown glyphs, resets on wrong order and preserves partial save",()=>{
  let state=discoverAll();
  assert.equal(enterClockGlyph(state,"Z"),state);
  const wrong=enterClockGlyph(state,"9");
  assert.deepEqual(wrong.clock.dial,[]);
  assert.equal(wrong.clock.solved,false);
  state=enterClockGlyph(state,"6");
  assert.deepEqual(state.clock.dial,["6"]);
  assert.deepEqual(restoreState(state).clock.dial,["6"]);
  const reset=enterClockGlyph(state,"9");
  assert.deepEqual(reset.clock.dial,[]);
  state=enterClockGlyph(reset,"6");
  state=enterClockGlyph(state,"3");
  assert.deepEqual(state.clock.dial,["6","3"]);
  const solved=enterClockGlyph(state,"9");
  assert.equal(solved.clock.solved,true);
  assert.equal(solved.insight,state.insight+3);
  assert.equal(clockReady(solved),false);
  assert.equal(enterClockGlyph(solved,"3"),solved);
});
test("tower room is gated by a solved dial and survives save and travel",()=>{
  const start=initialState();
  assert.equal(travel(start,"clockroom"),start);
  const corrupt=restoreState({...start,scene:"clockroom"});
  assert.equal(corrupt.scene,"elsewhen");
  let solved=discoverAll();
  for(const glyph of clockOrder)solved=enterClockGlyph(solved,glyph);
  const inside=travel(solved,"clockroom");
  assert.equal(inside.scene,"clockroom");
  assert.equal(inside.y,480);
  assert.equal(restoreState(inside).scene,"clockroom");
  assert.equal(travel(inside,"elsewhen").scene,"elsewhen");
});
test("three observation stations complete the unwritten hour once",()=>{
  let state=discoverAll();
  for(const glyph of clockOrder)state=enterClockGlyph(state,glyph);
  state=travel(state,"clockroom");
  assert.equal(observeClockStation(state,"invalid"),state);
  const startInsight=state.insight;
  state=observeClockStation(state,clockStations[0].id);
  assert.equal(state.insight,startInsight+1);
  assert.equal(observeClockStation(state,clockStations[0].id),state);
  state=observeClockStation(state,clockStations[1].id);
  state=observeClockStation(state,clockStations[2].id);
  assert.equal(state.clock.stations.length,3);
  assert.equal(clockSummary(state).roomComplete,true);
  assert.equal(state.insight,startInsight+5);
  assert.equal(observeClockStation(state,clockStations[2].id),state);
  assert.deepEqual(restoreState(state).clock.stations,state.clock.stations);
});
test("malformed clock saves are sanitized, and older saves get defaults",()=>{
  assert.deepEqual(validateClock(null),initialClock());
  assert.deepEqual(restoreState(initialState()).clock,initialClock());
  const v=validateClock({
    fragments:["hours","hours","current","index","bad"],
    dial:["6","9"],solved:false,
    stations:["lens","lens","fake"]
  });
  assert.deepEqual(v.fragments,["hours","current","index"]);
  assert.deepEqual(v.dial,[]);
  assert.deepEqual(v.stations,[]);
  assert.equal(v.solved,false);
  const completed=validateClock({
    fragments:["hours","current","index"],dial:["6","3","9"],
    solved:true,stations:["lens","engine","bogus","lens"]
  });
  assert.deepEqual(completed.stations,["lens","engine"]);
  assert.equal(completed.solved,true);
});
test("clock tower interaction approach and Ada's new position are navigable",()=>{
  assert.equal(blocked("elsewhen",485,249),false);
  assert.equal(blocked("elsewhen",394,321),false);
  assert.equal(blocked("clockroom",480,480),false);
  for(const item of clockStations)assert.equal(blocked("clockroom",item.x,item.y),false);
});
