import test from "node:test";
import assert from "node:assert/strict";
import {initialState,restoreState,travel} from "../src/state.js";
import {clockStations} from "../src/clock-rules.js";
import {reflectionMirrors} from "../src/reflection-rules.js";
import {testimony,evidence} from "../src/witness-rules.js";
import {blocked} from "../src/navigation.js";
import {
  mapmaker,atlasEntrance,atlasExit,atlasChart,atlasBeacons,atlasRoute,atlasEndings,
  initialAtlas,validateAtlas,atlasAvailable,atlasSummary,meetMapmaker,scanBeacon,
  plotStep,finishAtlas
} from "../src/atlas-rules.js";

function finishedCase(){
  const s=initialState();
  s.clock={fragments:["hours","current","index"],dial:["6","3","9"],solved:true,
    stations:clockStations.map(s=>s.id)};
  s.reflection={met:true,mirrors:Object.fromEntries(reflectionMirrors.map(m=>[m.id,m.choices[0].id])),
    resolved:"measure"};
  s.witness={heard:testimony.map(x=>x.id),evidence:evidence.map(x=>x.id),
    rejected:[],hypothesis:"frames",verdict:"map"};
  return s;
}
function surveyed(){
  let s=travel(finishedCase(),"atlas");
  for(const beacon of atlasBeacons)s=scanBeacon(s,beacon.id);
  return s;
}
function charted(){
  let s=surveyed();
  for(const id of atlasRoute)s=plotStep(s,id);
  return s;
}
test("the atlas is physically reachable and all markers are unique",()=>{
  assert.equal(atlasBeacons.length,3);
  assert.equal(new Set(atlasBeacons.map(x=>x.id)).size,3);
  assert.deepEqual(atlasRoute,["east","north","west"]);
  assert.equal(atlasEndings.length,3);
  for(const node of [...atlasBeacons,atlasChart,atlasExit]){
    assert.equal(blocked("atlas",node.x,node.y),false,node.name);
  }
  assert.equal(blocked("witnesshall",atlasEntrance.x,atlasEntrance.y),false);
  assert.equal(blocked("elsewhen",mapmaker.x,mapmaker.y),false);
});
test("atlas and mapmaker are locked until a complete witness case exists",()=>{
  const s=initialState();
  assert.equal(atlasAvailable(s),false);
  assert.equal(travel(s,"atlas"),s);
  assert.equal(meetMapmaker(s),s);
  assert.equal(scanBeacon(s,"east"),s);
  assert.equal(plotStep(s,"east"),s);
  assert.equal(finishAtlas(s,"open"),s);
  const noVerdict=finishedCase();noVerdict.witness.verdict=null;
  assert.equal(atlasAvailable(noVerdict),false);
  assert.equal(travel(noVerdict,"atlas"),noVerdict);
});
test("Rung 8 completed saves migrate without reset or lost evidence",()=>{
  const old=finishedCase();
  old.insight=45;
  old.records=["archive-first"];
  delete old.atlas;
  const restored=restoreState(old);
  assert.deepEqual(restored.atlas,initialAtlas());
  assert.equal(atlasAvailable(restored),true);
  assert.equal(restored.insight,45);
  assert.deepEqual(restored.records,["archive-first"]);
  const entered=travel(restored,"atlas");
  assert.equal(entered.scene,"atlas");
  assert.equal(restoreState(entered).scene,"atlas");
  assert.equal(travel(entered,"witnesshall").scene,"witnesshall");
  assert.equal(restoreState({...initialState(),scene:"atlas"}).scene,"elsewhen");
});
test("Mera can be met once in Elsewhen and does not join combat",()=>{
  const old=finishedCase();
  const first=meetMapmaker(old);
  assert.equal(first.insight,old.insight+1);
  assert.equal(first.atlas.met,true);
  assert.deepEqual(first.recruits,old.recruits);
  assert.equal(meetMapmaker(first),first);
  assert.equal(meetMapmaker(travel(first,"atlas")).atlas.met,true);
  assert.equal(restoreState(first).atlas.met,true);
});
test("three survey beacons give one insight each and can be visited in any order",()=>{
  const initial=travel(finishedCase(),"atlas");
  let state=initial;
  for(const beacon of [...atlasBeacons].reverse()){
    const before=state;
    state=scanBeacon(state,beacon.id);
    assert.equal(state.insight,before.insight+1);
    assert.equal(scanBeacon(state,beacon.id),state);
  }
  assert.equal(atlasSummary(state).scannedCount,3);
  assert.deepEqual(restoreState(state).atlas.scanned,state.atlas.scanned);
  assert.equal(scanBeacon(state,"unknown"),state);
});
test("charting is gated behind observations; order is east, north, west",()=>{
  const initial=travel(finishedCase(),"atlas");
  assert.equal(plotStep(initial,"east"),initial);
  let state=surveyed();
  assert.equal(atlasSummary(state).charted,false);
  state=plotStep(state,"east");
  assert.deepEqual(state.atlas.route,["east"]);
  assert.deepEqual(restoreState(state).atlas.route,["east"]);
  state=plotStep(state,"north");
  assert.deepEqual(state.atlas.route,["east","north"]);
  state=plotStep(state,"west");
  assert.deepEqual(state.atlas.route,["east","north","west"]);
  assert.equal(atlasSummary(state).charted,true);
  assert.equal(atlasSummary(state).complete,false);
  assert.equal(plotStep(state,"east"),state);
});
test("wrong connections reset the route, cannot farm a repeat penalty, and never erase surveys",()=>{
  let state=surveyed();
  const initialStability=state.stability;
  state=plotStep(state,"west");
  assert.equal(state.stability,initialStability-1);
  assert.deepEqual(state.atlas.route,[]);
  assert.equal(state.atlas.scanned.length,3);
  state=plotStep(state,"west");
  assert.equal(state.stability,initialStability-1);
  state=plotStep(state,"east");
  assert.deepEqual(state.atlas.route,["east"]);
  state=plotStep(state,"west");
  assert.deepEqual(state.atlas.route,[]);
  assert.equal(state.stability,initialStability-2);
  assert.equal(state.atlas.scanned.length,3);
  assert.equal(atlasSummary(restoreState(state)).scannedCount,3);
});
test("the atlas has three permanent, distinct publishing outcomes",()=>{
  const prepared=charted();
  assert.equal(finishAtlas(prepared,"unknown"),prepared);
  for(const option of atlasEndings){
    const done=finishAtlas(prepared,option.id);
    assert.equal(done.atlas.ending,option.id);
    assert.equal(done.stability,prepared.stability+option.balance);
    assert.equal(done.insight,prepared.insight+option.insight);
    assert.equal(atlasSummary(done).complete,true);
    assert.equal(finishAtlas(done,"safe"),done);
    assert.equal(plotStep(done,"east"),done);
    assert.equal(restoreState(done).atlas.ending,option.id);
  }
});
test("corrupted routes and older saved state are sanitized",()=>{
  assert.deepEqual(validateAtlas(null),initialAtlas());
  assert.deepEqual(restoreState(initialState()).atlas,initialAtlas());
  const dirty=validateAtlas({
    met:"yes",scanned:["west","west","north","invalid"],
    route:["east","north","west"],mistakes:["0:west","0:west","7:east","1:west"],
    ending:"safe"
  });
  assert.deepEqual(dirty.scanned,["west","north"]);
  assert.deepEqual(dirty.route,[]);
  assert.deepEqual(dirty.mistakes,["0:west","1:west"]);
  assert.equal(dirty.ending,null);
  const complete=validateAtlas({
    met:true,scanned:["east","north","west"],
    route:["east","north","west"],ending:"open"
  });
  assert.equal(complete.ending,"open");
});
test("Rung 9 public-facing content avoids later story revelations",()=>{
  const source=JSON.stringify({mapmaker,atlasBeacons,atlasEndings});
  for(const secret of ["ARCLight","Project 3333","HOMO SAPIENS EXTINCT","Observer 369"]){
    assert.equal(source.includes(secret),false);
  }
});
