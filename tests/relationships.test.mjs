import test from "node:test";
import assert from "node:assert/strict";
import {initialState,restoreState,recruit,travel} from "../src/state.js";
import {collectRecord} from "../src/field-records.js";
import {surveySite,solveMechanism} from "../src/expedition-rules.js";
import {personalQuests,visitors,initialSocial,validateSocial,trustFor,trustTier,
 questStatus,acceptPersonalQuest,completePersonalQuest,hearVisitor,
 debateAvailable,resolveDebate,reactionFor,rapportBonus,socialSummary} from "../src/relationships.js";

function recruited(...ids){let s=initialState();for(const id of ids)s=recruit(s,id);return s;}
test("all personal inquiries reference recoverable records",()=>{
  assert.equal(Object.keys(personalQuests).length,3);
  assert.equal(visitors.length,2);
  for(const id of Object.keys(personalQuests)){
    assert.ok(personalQuests[id].record.endsWith("-first"));
    assert.ok(personalQuests[id].setup.length>50);
  }
});
test("accepting an inquiry requires recruitment, cannot be repeated",()=>{
  const s=initialState();
  assert.equal(acceptPersonalQuest(s,"einstein"),s);
  assert.equal(acceptPersonalQuest(s,"unknown"),s);
  const recruitedState=recruited("einstein");
  const accepted=acceptPersonalQuest(recruitedState,"einstein");
  assert.equal(questStatus(accepted,"einstein"),"active");
  assert.equal(acceptPersonalQuest(accepted,"einstein"),accepted);
  assert.equal(completePersonalQuest(accepted,"einstein"),accepted);
});
test("personal discoveries can be collected before the quest is accepted",()=>{
  let s=recruited("einstein");
  s=travel(s,"gardens");
  s=collectRecord(s,"garden-first");
  s=travel(s,"elsewhen");
  assert.equal(questStatus(s,"einstein"),"available");
  s=acceptPersonalQuest(s,"einstein");
  assert.equal(questStatus(s,"einstein"),"ready");
  const after=completePersonalQuest(s,"einstein");
  assert.equal(questStatus(after,"einstein"),"completed");
  assert.equal(trustFor(after,"einstein"),2);
  assert.equal(after.insight,s.insight+2);
  assert.equal(completePersonalQuest(after,"einstein"),after);
});
test("quests and trust survive reloads and legacy Rung 4 saves",()=>{
  let s=recruited("tesla");
  s=acceptPersonalQuest(s,"tesla");
  assert.equal(questStatus(restoreState(s),"tesla"),"active");
  const old=initialState();delete old.social;
  assert.deepEqual(restoreState(old).social,initialSocial());
  const corrupted={...old,social:{trust:{einstein:99,tesla:-10,lovelace:2.6},
    accepted:["tesla","tesla","invalid"],completed:["lovelace"],debates:["fake","archive"],
    visitors:["curie","curie",123]}};
  assert.deepEqual(validateSocial(corrupted.social),{
    trust:{einstein:6,tesla:0,lovelace:2},
    accepted:["tesla","lovelace"],completed:["lovelace"],debates:["archive"],visitors:["curie"]
  });
});
test("town visitors reward first contact only and are not added to combat squad",()=>{
  const s=initialState();
  const after=hearVisitor(s,"curie");
  assert.equal(after.insight,s.insight+1);
  assert.equal(after.recruits.length,0);
  assert.equal(hearVisitor(after,"curie"),after);
  assert.equal(hearVisitor(after,"invalid"),after);
});
test("conclave is locked before a world is stabilized and needs two recruits",()=>{
  const s=recruited("einstein","tesla");
  assert.equal(debateAvailable(s,"gardens"),false);
  assert.equal(resolveDebate(s,"gardens","common"),s);
  const onlyOne={...s,recruits:["einstein"],squad:["einstein"],completed:["gardens"]};
  assert.equal(debateAvailable(onlyOne,"gardens"),false);
  assert.equal(debateAvailable({...s,completed:["gardens"]},"gardens"),true);
});
test("conclave choices change trust, award insight once and respect rivalry",()=>{
  let s={...recruited("einstein","tesla","lovelace"),completed:["gardens"],choices:{gardens:"weave"}};
  const considered=resolveDebate(s,"gardens","einstein");
  assert.equal(trustFor(considered,"einstein"),2);
  assert.equal(trustFor(considered,"tesla"),0);
  assert.equal(considered.insight,s.insight+1);
  assert.equal(resolveDebate(considered,"gardens","common"),considered);
  const shared=resolveDebate(s,"gardens","common");
  for(const p of ["einstein","tesla","lovelace"])assert.equal(trustFor(shared,p),1);
  assert.equal(trustTier(shared,"einstein"),"COLLEAGUE");
});
test("personal bonds strengthen coordinated mechanisms but not solo solutions",()=>{
  let s=recruited("einstein","lovelace");
  assert.equal(rapportBonus(s,["einstein","lovelace"]),0);
  for(const [person,record,scene] of [
    ["einstein","garden-first","gardens"],
    ["lovelace","archive-first","archive"]
  ]){
    s=travel(s,scene);
    s=collectRecord(s,record);
    s=travel(s,"elsewhen");
    s=acceptPersonalQuest(s,person);
    s=completePersonalQuest(s,person);
  }
  assert.equal(rapportBonus(s,["einstein","lovelace"]),2);
  assert.equal(socialSummary(s).find(x=>x.id==="einstein").tier,"CONFIDANT");
  const prepared=surveySite(s,"gardens");
  const solved=solveMechanism(prepared,"gardens","synergy");
  assert.equal(solved.stability,prepared.stability+7);
  assert.match(solved.log.at(-1),/Shared trust/);
});
test("reaction lines change after a choice and do not reveal future twists",()=>{
  let s=recruited("einstein");
  const before=reactionFor(s,"einstein");
  s={...s,choices:{gardens:"cut"}};
  const after=reactionFor(s,"einstein");
  assert.notEqual(before,after);
  assert.match(after,/histories/i);
});
test("social history and personal quest completion are bounded",()=>{
  let s=recruited("einstein","tesla","lovelace");
  s={...s,completed:["gardens","causeway","archive"]};
  s=resolveDebate(s,"gardens","common");
  s=resolveDebate(s,"causeway","common");
  s=resolveDebate(s,"archive","common");
  assert.equal(validateSocial(s.social).debates.length,3);
  for(const p of ["einstein","tesla","lovelace"])assert.equal(trustFor(s,p),3);
});
