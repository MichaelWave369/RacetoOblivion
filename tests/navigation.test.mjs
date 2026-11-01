import test from "node:test";
import assert from "node:assert/strict";
import { blocked, stepPosition, townObstacles } from "../src/navigation.js";

test("all landmark buildings are solid",()=>{
  for(const o of townObstacles)assert.equal(blocked("elsewhen",o.x+o.w/2,o.y+o.h/2),true);
});

test("player spawn and required recruitment/portal approach zones stay accessible",()=>{
  for(const [x,y] of [[480,458],[228,377],[722,380],[476,285],[183,215],[782,215],[480,73],[480,315]]){
    assert.equal(blocked("elsewhen",x,y),false,"blocked at "+x+","+y);
  }
});

test("movement slides along walls and cannot tunnel through tower",()=>{
  const start={x:485,y:286};
  const result=stepPosition("elsewhen",start.x,start.y,0,-1,180);
  assert.equal(result.x,start.x);
  assert.ok(result.y>=244);
  assert.equal(blocked("elsewhen",result.x,result.y),false);
});

test("walking diagonally is normalized",()=>{
  const p=stepPosition("elsewhen",650,460,1,1,10);
  assert.ok(Math.abs(Math.hypot(p.x-650,p.y-460)-10)<1e-7);
});

test("dimension bounds apply without town buildings",()=>{
  assert.equal(blocked("archive",485,180),false);
  assert.equal(blocked("archive",2,400),true);
});
