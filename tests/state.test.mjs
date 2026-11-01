import test from "node:test";
import assert from "node:assert/strict";
import { initialState, recruit, travel, resolveFracture, restoreState } from "../src/state.js";

test("new journey begins in Elsewhen with no spoilers or progress", () => {
  const state=initialState();
  assert.equal(state.scene,"elsewhen");
  assert.deepEqual(state.completed,[]);
  assert.equal(state.stability,64);
});

test("recruitment is unique and valid", () => {
  const state=recruit(initialState(),"einstein");
  assert.deepEqual(state.recruits,["einstein"]);
  assert.equal(recruit(state,"einstein"),state);
  assert.equal(recruit(state,"unknown"),state);
});

test("a fracture requires the correct thinker", () => {
  const state=initialState();
  assert.equal(resolveFracture(state,"gardens","anchor"),state);
  assert.equal(resolveFracture(recruit(state,"tesla"),"gardens","anchor").completed.length,0);
});

test("choices change balance and insight only once", () => {
  let state=recruit(initialState(),"einstein");
  state=resolveFracture(state,"gardens","weave");
  assert.equal(state.stability,68);
  assert.equal(state.insight,3);
  assert.deepEqual(state.completed,["gardens"]);
  assert.equal(resolveFracture(state,"gardens","cut"),state);
});

test("stability is bounded and scene transitions are safe", () => {
  let state=recruit(initialState(),"tesla");
  state={...state,stability:96};
  state=resolveFracture(state,"causeway","ground");
  assert.equal(state.stability,100);
  assert.equal(travel(state,"nonexistent"),state);
  assert.equal(travel(state,"archive").scene,"archive");
  assert.equal(travel(state,"elsewhen").scene,"elsewhen");
});

test("save data is validated on restore", () => {
  assert.deepEqual(restoreState(null),initialState());
  const state=restoreState({version:1,scene:"not-a-scene",x:Infinity,y:-200,recruits:["einstein","einstein","fake"],completed:["archive","fake"],stability:500,insight:-10,log:["hi",42],introSeen:true});
  assert.equal(state.scene,"elsewhen");
  assert.equal(state.x,480);
  assert.equal(state.y,42);
  assert.deepEqual(state.recruits,["einstein"]);
  assert.deepEqual(state.completed,["archive"]);
  assert.equal(state.stability,100);
  assert.equal(state.insight,0);
  assert.deepEqual(state.log,["hi"]);
});
