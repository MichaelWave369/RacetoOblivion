import test from "node:test";
import assert from "node:assert/strict";
import { initialState, restoreState, recruit, resolveFracture } from "../src/state.js";
import { MAX_SQUAD, toggleSquadMember, expeditionProgress, surveySite, solveMechanism, availableMoves,
  strikeEcho, recoverFocus, coreReady, validateExpeditions, nextObjective } from "../src/expedition-rules.js";
import { worlds } from "../src/content.js";

function formedSquad(...ids){
  let state=initialState();
  for(const id of ids)state=recruit(state,id);
  return state;
}
test("recruiting three minds auto-populates a 3/6/9 squad without duplicates",()=>{
  const state=formedSquad("einstein","tesla","lovelace");
  assert.equal(MAX_SQUAD,3);
  assert.deepEqual(state.squad,["einstein","tesla","lovelace"]);
  assert.equal(recruit(state,"tesla"),state);
  assert.equal(toggleSquadMember(state,"unknown"),state);
  assert.equal(toggleSquadMember(state,"tesla").squad.length,2);
});
test("old save files regain a usable squad and retain completed worlds",()=>{
  const old=formedSquad("tesla","lovelace");
  delete old.squad;
  delete old.expeditions;
  old.completed=["causeway"];
  const restored=restoreState(old);
  assert.deepEqual(restored.squad,["tesla","lovelace"]);
  assert.equal(coreReady(restored,"causeway"),true);
  assert.equal(expeditionProgress(restored,"causeway").echo,true);
  assert.deepEqual(restored.expeditions,{});
});
test("survey is a prerequisite and awards insight exactly once",()=>{
  const state=formedSquad("einstein","lovelace");
  assert.equal(solveMechanism(state,"gardens","solo"),state);
  const surveyed=surveySite(state,"gardens");
  assert.equal(surveyed.insight,1);
  assert.equal(expeditionProgress(surveyed,"gardens").survey,true);
  assert.equal(surveySite(surveyed,"gardens"),surveyed);
});
test("science puzzles reject specialists outside the active squad",()=>{
  let state=formedSquad("einstein","lovelace");
  state=surveySite(state,"gardens");
  state=toggleSquadMember(state,"einstein");
  assert.equal(solveMechanism(state,"gardens","solo"),state);
  assert.equal(solveMechanism(state,"gardens","synergy"),state);
  assert.equal(solveMechanism(state,"gardens","invalid"),state);
});
test("wrong mechanism choice is costly but recoverable, synergy is rewarded",()=>{
  let state=surveySite(formedSquad("einstein","lovelace"),"gardens");
  const mistake=solveMechanism(state,"gardens","unsafe");
  assert.equal(mistake.stability,state.stability-4);
  assert.equal(expeditionProgress(mistake,"gardens").mechanism,false);
  const fixed=solveMechanism(mistake,"gardens","synergy");
  assert.equal(expeditionProgress(fixed,"gardens").mechanism,true);
  assert.equal(fixed.stability,mistake.stability+5);
  assert.equal(fixed.insight,mistake.insight+2);
  assert.equal(solveMechanism(fixed,"gardens","solo"),fixed);
});
test("encounters persist health and focus and cannot resolve before puzzle",()=>{
  let state=surveySite(formedSquad("einstein","tesla"),"gardens");
  assert.equal(strikeEcho(state,"gardens","einstein"),state);
  state=solveMechanism(state,"gardens","solo");
  const struck=strikeEcho(state,"gardens","einstein");
  assert.equal(expeditionProgress(struck,"gardens").echoHealth,5);
  assert.equal(expeditionProgress(struck,"gardens").focus,3);
  assert.equal(struck.stability,state.stability-2);
  const again=restoreState(struck);
  assert.equal(expeditionProgress(again,"gardens").echoHealth,5);
  assert.equal(availableMoves(again,"gardens").some(m=>m.id==="synergy"),true);
  assert.equal(coreReady(again,"gardens"),false);
});
test("multiple attacks open the final core without replaying the fight",()=>{
  let state=surveySite(formedSquad("tesla","lovelace"),"causeway");
  state=solveMechanism(state,"causeway","synergy");
  state=strikeEcho(state,"causeway","synergy");
  state=strikeEcho(state,"causeway","synergy");
  const current=expeditionProgress(state,"causeway");
  assert.equal(current.echo,true);
  assert.equal(current.echoHealth,0);
  assert.equal(coreReady(state,"causeway"),true);
  assert.equal(strikeEcho(state,"causeway","tesla"),state);
  const resolved=resolveFracture(state,"causeway","ground");
  assert.equal(resolved.completed.includes("causeway"),true);
  assert.equal(surveySite(resolved,"causeway"),resolved);
});
test("focus recovery trades balance and cannot farm unlimited focus",()=>{
  let state=surveySite(formedSquad("tesla"),"causeway");
  state=solveMechanism(state,"causeway","solo");
  state=strikeEcho(state,"causeway","tesla");
  const recovered=recoverFocus(state,"causeway");
  assert.equal(expeditionProgress(recovered,"causeway").focus,4);
  assert.equal(recovered.stability,state.stability-1);
  assert.equal(recoverFocus(recovered,"causeway"),recovered);
});
test("all authored worlds have a reachable ordered mission chain",()=>{
  for(const world of worlds){
    const member=world.needed;
    let state=surveySite(formedSquad(member),"gardens"===world.id?"gardens":world.id);
    assert.match(nextObjective(state,world.id),/mechanism/i);
    state=solveMechanism(state,world.id,"solo");
    assert.equal(expeditionProgress(state,world.id).mechanism,true);
    while(!expeditionProgress(state,world.id).echo){
      const p=expeditionProgress(state,world.id);
      state=p.focus?strikeEcho(state,world.id,member):recoverFocus(state,world.id);
    }
    assert.equal(coreReady(state,world.id),true);
  }
});
test("corrupt expedition saves are bounded and unknown worlds ignored",()=>{
  const restored=validateExpeditions({gardens:{survey:true,mechanism:true,echo:false,echoHealth:999,focus:-10,turns:Infinity},invalid:{echo:true}});
  assert.deepEqual(Object.keys(restored),["gardens"]);
  assert.equal(restored.gardens.echoHealth,8);
  assert.equal(restored.gardens.focus,0);
  assert.equal(restored.gardens.turns,0);
});
