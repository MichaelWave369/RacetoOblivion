import test from "node:test";
import assert from "node:assert/strict";
import {initialState,restoreState,travel} from "../src/state.js";
import {clockStations} from "../src/clock-rules.js";
import {reflectionMirrors} from "../src/reflection-rules.js";
import {testimony,evidence} from "../src/witness-rules.js";
import {atlasBeacons} from "../src/atlas-rules.js";
import {blocked,stepPosition} from "../src/navigation.js";
import {
  crossingEntrance,crossingExit,crossingTable,crossingArrival,crossingPaths,
  crossingEndings,initialCrossing,validateCrossing,crossingAvailable,
  crossingSummary,observeCrossingPath,selectCrossingPath,reachFarShore,
  concludeCrossing
} from "../src/crossing-rules.js";

function publishedAtlas(){
  const state=initialState();
  state.clock={fragments:["hours","current","index"],dial:["6","3","9"],
    solved:true,stations:clockStations.map(s=>s.id)};
  state.reflection={met:true,mirrors:Object.fromEntries(reflectionMirrors.map(m=>[m.id,m.choices[0].id])),
    resolved:"harmonize"};
  state.witness={heard:testimony.map(x=>x.id),evidence:evidence.map(x=>x.id),
    rejected:[],hypothesis:"frames",verdict:"map"};
  state.atlas={met:true,scanned:atlasBeacons.map(x=>x.id),route:["east","north","west"],
    mistakes:[],ending:"common"};
  return state;
}
function surveyed(){
  let state=travel(publishedAtlas(),"crossing");
  for(const path of crossingPaths)state=observeCrossingPath(state,path.id);
  return state;
}
function ready(path="center"){
  return selectCrossingPath(surveyed(),path);
}
function reached(path="center"){
  const state=ready(path);
  return reachFarShore({...state,x:crossingArrival.x,y:crossingArrival.y});
}

test("Rung 10 has three genuine bridge routes and reachable map markers",()=>{
  assert.equal(crossingPaths.length,3);
  assert.equal(new Set(crossingPaths.map(p=>p.id)).size,3);
  assert.equal(crossingEndings.length,3);
  for(const item of [...crossingPaths,crossingTable,crossingExit]){
    assert.equal(blocked("crossing",item.x,item.y),false,item.name);
  }
  assert.equal(blocked("crossing",crossingArrival.x,crossingArrival.y),false);
  assert.equal(blocked("atlas",crossingEntrance.x,crossingEntrance.y),false);
  for(const path of crossingPaths){
    assert.ok(path.gap[0]<path.x&&path.x<path.gap[1]);
    assert.ok(path.gap[1]-path.gap[0]>24);
  }
});
test("before Atlas publication the new scene and all progress actions are locked",()=>{
  const state=initialState();
  assert.equal(crossingAvailable(state),false);
  assert.equal(travel(state,"crossing"),state);
  assert.equal(observeCrossingPath(state,"center"),state);
  assert.equal(selectCrossingPath(state,"center"),state);
  assert.equal(reachFarShore(state),state);
  assert.equal(concludeCrossing(state,"record"),state);
  const incomplete=publishedAtlas();
  incomplete.atlas.ending=null;
  assert.equal(crossingAvailable(incomplete),false);
  assert.equal(travel(incomplete,"crossing"),incomplete);
});
test("Rung 9 progress migrates without a save reset",()=>{
  const old=publishedAtlas();
  old.insight=41;
  old.records=["garden-first"];
  delete old.crossing;
  const restored=restoreState(old);
  assert.deepEqual(restored.crossing,initialCrossing());
  assert.equal(crossingAvailable(restored),true);
  assert.equal(restored.insight,41);
  assert.deepEqual(restored.records,["garden-first"]);
  const inside=travel(restored,"crossing");
  assert.equal(inside.scene,"crossing");
  assert.equal(restoreState(inside).scene,"crossing");
  assert.equal(travel(inside,"atlas").scene,"atlas");
  assert.equal(restoreState({...initialState(),scene:"crossing"}).scene,"elsewhen");
});
test("survey each of the three bridges in any order and reward insight exactly once",()=>{
  let state=travel(publishedAtlas(),"crossing");
  for(const path of [...crossingPaths].reverse()){
    const before=state;
    state=observeCrossingPath(state,path.id);
    assert.equal(state.insight,before.insight+1);
    assert.equal(observeCrossingPath(state,path.id),state);
  }
  assert.equal(crossingSummary(state).count,3);
  assert.equal(restoreState(state).crossing.observed.length,3);
  assert.equal(observeCrossingPath(state,"missing"),state);
});
test("route selection requires all three surveys and cannot be switched",()=>{
  const blank=travel(publishedAtlas(),"crossing");
  assert.equal(selectCrossingPath(blank,"west"),blank);
  assert.equal(selectCrossingPath(blank,"bad"),blank);
  const s=surveyed();
  const chosen=selectCrossingPath(s,"east");
  assert.equal(chosen.crossing.chosen,"east");
  assert.equal(selectCrossingPath(chosen,"west"),chosen);
  assert.equal(restoreState(chosen).crossing.chosen,"east");
  assert.equal(crossingSummary(chosen).complete,false);
});
test("the river is impassable before selection and opens only the chosen bridge",()=>{
  const locked=surveyed();
  for(const path of crossingPaths){
    assert.equal(blocked("crossing",path.x,320,12,locked),true);
  }
  const selected=ready("west");
  assert.equal(blocked("crossing",184,320,12,selected),false);
  assert.equal(blocked("crossing",480,320,12,selected),true);
  assert.equal(blocked("crossing",778,320,12,selected),true);
  assert.equal(blocked("crossing",150,320,12,selected),true,"the character radius must fit on the bridge");
  assert.equal(blocked("crossing",224,320,12,selected),true,"the character radius must fit on the bridge");
});
test("real incremental movement collides with the river and traverses an open bridge",()=>{
  const locked=surveyed();
  const before=stepPosition("crossing",184,383,0,-1,145,locked);
  assert.ok(before.y>=367,"river blocks movement before a route is selected");
  const open=ready("west");
  const across=stepPosition("crossing",184,383,0,-1,145,open);
  assert.ok(across.y<290,"chosen bridge permits physical movement north");
  assert.equal(blocked("crossing",across.x,across.y,12,open),false);
  const wrong=stepPosition("crossing",480,383,0,-1,145,open);
  assert.ok(wrong.y>=367,"closed central bridge stays impassable");
});
test("the far shore requires an actual northern position and gives insight once",()=>{
  const chosen=ready("center");
  assert.equal(reachFarShore(chosen),chosen,"player starts on near bank");
  const far={...chosen,x:480,y:188};
  const arrived=reachFarShore(far);
  assert.equal(arrived.crossing.arrived,true);
  assert.equal(arrived.insight,far.insight+2);
  assert.equal(reachFarShore(arrived),arrived);
  assert.equal(restoreState(arrived).crossing.arrived,true);
  assert.equal(crossingSummary(arrived).complete,false);
});
test("three unique final decisions persist and cannot grant rewards twice",()=>{
  const base=reached();
  assert.equal(concludeCrossing(base,"invalid"),base);
  for(const ending of crossingEndings){
    const after=concludeCrossing(base,ending.id);
    assert.equal(after.crossing.ending,ending.id);
    assert.equal(after.stability,base.stability+ending.stability);
    assert.equal(after.insight,base.insight+ending.insight);
    assert.equal(crossingSummary(after).complete,true);
    assert.equal(concludeCrossing(after,"share"),after);
    assert.equal(selectCrossingPath(after,"west"),after);
    assert.equal(restoreState(after).crossing.ending,ending.id);
  }
});
test("corrupted crossing saves are sanitized without inventing completion",()=>{
  assert.deepEqual(validateCrossing(null),initialCrossing());
  const broken=validateCrossing({observed:["west","west","bad"],chosen:"west",arrived:true,ending:"record"});
  assert.deepEqual(broken.observed,["west"]);
  assert.equal(broken.chosen,null);
  assert.equal(broken.arrived,false);
  assert.equal(broken.ending,null);
  const finished=validateCrossing({observed:["west","center","east"],chosen:"east",arrived:true,ending:"share"});
  assert.equal(finished.ending,"share");
  assert.equal(finished.chosen,"east");
});
test("public Rung 10 scenes do not describe unreleased final story",()=>{
  const text=JSON.stringify({crossingPaths,crossingEndings});
  assert.doesNotMatch(text,/stasis pod|alien origin|human extinction|hidden spaceship/i);
});
