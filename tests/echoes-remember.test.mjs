import test from "node:test";
import assert from "node:assert/strict";
import {initialState,restoreState,recruit,travel} from "../src/state.js";
import {surveySite,solveMechanism,expeditionProgress} from "../src/expedition-rules.js";
import {telegraphLane,tacticalView,tacticalShift,tacticalStrike,laneNames} from "../src/echo-tactics.js";
import {fieldRecords,collectRecord,archiveSummary,validateRecords,recordsForWorld} from "../src/field-records.js";

function readyGarden(){
  let s=initialState();
  s=recruit(s,"einstein");s=recruit(s,"lovelace");
  s=surveySite(s,"gardens");return solveMechanism(s,"gardens","synergy");
}
test("six unique field records are placed evenly across expeditions",()=>{
  assert.equal(fieldRecords.length,6);
  assert.equal(new Set(fieldRecords.map(r=>r.id)).size,6);
  for(const world of ["gardens","causeway","archive"])assert.equal(recordsForWorld(world).length,2);
});
test("field records reward first discovery only, survive reload and stay scene scoped",()=>{
  const first=fieldRecords[0],start=initialState();
  assert.equal(collectRecord(start,first.id),start);
  const inWorld=travel(start,first.world),found=collectRecord(inWorld,first.id);
  assert.equal(found.insight,inWorld.insight+1);
  assert.equal(collectRecord(found,first.id),found);
  assert.deepEqual(restoreState(found).records,[first.id]);
  assert.equal(archiveSummary(found.records).count,1);
});
test("six collected records complete the archive and corrupted saves are sanitized",()=>{
  let s=initialState();
  for(const rec of fieldRecords){s=travel(s,rec.world);s=collectRecord(s,rec.id);}
  assert.equal(archiveSummary(s.records).complete,true);
  assert.deepEqual(restoreState(s).records,s.records);
  assert.deepEqual(validateRecords(["garden-first","garden-first","fake",42]),["garden-first"]);
  const old=initialState();delete old.records;
  assert.deepEqual(restoreState(old).records,[]);
});
test("three combat lanes telegraph deterministically",()=>{
  assert.deepEqual(laneNames,["LEFT","CENTER","RIGHT"]);
  assert.deepEqual([0,1,2,3].map(n=>telegraphLane("gardens",n)),[1,2,0,1]);
  assert.equal(telegraphLane("invalid",7),1);
});
test("telegraphed attack causes extra equilibrium pressure",()=>{
  const s=readyGarden();
  assert.equal(tacticalView(s,"gardens").threat,1);
  assert.equal(tacticalView(s,"gardens").lane,1);
  const hit=tacticalStrike(s,"gardens","einstein");
  assert.equal(expeditionProgress(hit,"gardens").echoHealth,5);
  assert.equal(hit.stability,s.stability-4);
  const safe={...s,expeditions:{...s.expeditions,gardens:{...s.expeditions.gardens,lane:0}}};
  assert.equal(tacticalStrike(safe,"gardens","einstein").stability,safe.stability-2);
});
test("sidesteps change lane, regain focus, persist on reload, and respect edges",()=>{
  let s=tacticalStrike(readyGarden(),"gardens","einstein");
  s=tacticalShift(s,"gardens",-1);
  assert.equal(expeditionProgress(s,"gardens").lane,0);
  assert.equal(expeditionProgress(s,"gardens").focus,4);
  assert.equal(expeditionProgress(restoreState(s),"gardens").lane,0);
  assert.equal(tacticalShift(s,"gardens",-1),s);
  assert.equal(tacticalShift(s,"gardens",-2),s);
});
test("moving into a telegraphed strike is penalized",()=>{
  const s=readyGarden();
  const staged={...s,expeditions:{...s.expeditions,gardens:{...s.expeditions.gardens,turns:2,lane:1}}};
  assert.equal(tacticalShift(staged,"gardens",-1).stability,staged.stability-2);
});
test("tactics are gated to active calibrated encounters",()=>{
  const start=initialState();
  assert.equal(tacticalShift(start,"gardens",1),start);
  assert.equal(tacticalStrike(start,"gardens","einstein"),start);
  assert.equal(tacticalStrike(start,"invalid","einstein"),start);
  let s=readyGarden();
  s=tacticalStrike(s,"gardens","synergy");
  s=tacticalStrike(s,"gardens","synergy");
  assert.equal(expeditionProgress(s,"gardens").echo,true);
  assert.equal(tacticalShift(s,"gardens",1),s);
  assert.equal(tacticalStrike(s,"gardens","einstein"),s);
});
