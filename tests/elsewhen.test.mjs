import test from "node:test";
import assert from "node:assert/strict";
import { initialState, discuss, observe, restoreState } from "../src/state.js";

test("discovering the town awards insight exactly once",()=>{
  const fresh=initialState();
  assert.equal(observe(fresh,"unknown"),fresh);
  const one=observe(fresh,"fountain");
  assert.equal(one.insight,1);
  assert.deepEqual(one.observed,["fountain"]);
  assert.equal(observe(one,"fountain"),one);
});

test("three distinct conversations award unique insight",()=>{
  let state=initialState();
  state=discuss(state,"tesla","interval");
  state=discuss(state,"tesla","work");
  state=discuss(state,"tesla","consequences");
  assert.equal(state.insight,3);
  assert.equal(state.discussions.length,3);
  assert.equal(discuss(state,"tesla","interval"),state);
  assert.equal(discuss(state,"unknown","work"),state);
});

test("existing Rung 1 save files are forward compatible",()=>{
  const old={...initialState(),introSeen:true};
  delete old.discussions;delete old.observed;
  const state=restoreState(old);
  assert.deepEqual(state.discussions,[]);
  assert.deepEqual(state.observed,[]);
  assert.equal(state.introSeen,true);
});

test("corrupted exploration records are filtered",()=>{
  const raw={...initialState(),observed:["fountain","fountain","invalid"],discussions:["tesla:interval","fake:work","tesla:interval"]};
  const restored=restoreState(raw);
  assert.deepEqual(restored.observed,["fountain"]);
  assert.deepEqual(restored.discussions,["tesla:interval"]);
});
