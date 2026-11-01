import { expeditionNodes, expeditions } from "./expeditions.js";
import { expeditionProgress, coreReady } from "./expedition-rules.js";
import { recordsForWorld } from "./field-records.js";

function line(ctx,x1,y1,x2,y2,color,w=2){
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();
}
function circle(ctx,x,y,r,color,stroke=null,w=2){
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
}
function label(ctx,value,x,y,size=12,color="#f2debb"){
  ctx.font="bold "+size+"px Trebuchet MS, Arial";ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.lineWidth=4;ctx.strokeStyle="#080d1ee0";ctx.strokeText(value,x,y);
  ctx.fillStyle=color;ctx.fillText(value,x,y);
}
export function drawExpeditionArt(ctx,state,t){
  const data=expeditions[state.scene];
  if(!data)return;
  const p=expeditionProgress(state,state.scene);
  const done={survey:p.survey,mechanism:p.mechanism,echo:p.echo,core:state.completed.includes(state.scene)};
  const xs={survey:[205,310],mechanism:[755,310],echo:[480,398],core:[480,249]};
  const color=state.scene==="gardens"?"#b4e4ae":state.scene==="causeway"?"#9ce4fa":"#d9b4f9";
  // Connect the points of each expedition: observation, investigation, confrontation, judgment.
  for(const [a,b] of [["survey","mechanism"],["mechanism","echo"],["echo","core"]]){
    const A=xs[a],B=xs[b];
    line(ctx,A[0],A[1],B[0],B[1],done[a]?"#a0edc652":"#e5d2b526",2);
  }
  for(const node of expeditionNodes){
    if(node.id==="core"){
      if(!coreReady(state,state.scene)&&!done.core){
        circle(ctx,node.x,node.y,13,"#101d32c8","#edc89a",2);
        label(ctx,"×",node.x,node.y+1,15,"#f6ce99");
      }
      label(ctx,done.core?"HARMONIZED":coreReady(state,state.scene)?"CORE READY":"CORE SEALED",node.x,node.y+79,11,color);
      continue;
    }
    const finished=done[node.id],radius=node.id==="echo"?27:24;
    const pulse=Math.sin(t/560+node.x)*3;
    circle(ctx,node.x,node.y,radius+9+pulse,color+"13",color+"50",2);
    circle(ctx,node.x,node.y,radius,"#111a32dd",finished?"#a3ffc9":color,3);
    label(ctx,finished?"✓":node.symbol,node.x,node.y,25,finished?"#b7ffd5":"#f9ddaa");
    label(ctx,node.label,node.x,node.y+45,12,finished?"#bcf3ce":"#f8dfb7");
    if(node.id==="echo"&&!finished){
      circle(ctx,node.x,node.y-38,4+Math.sin(t/320)*1.5,"#ed94ba");
      label(ctx,"HP "+p.echoHealth+"   FOCUS "+p.focus,node.x,node.y+63,10,"#e5caba");
    }
  }
  // Optional research markers remain available even after a world is stabilized.
  for(const record of recordsForWorld(state.scene)){
    const found=state.records?.includes(record.id);
    const wave=Math.sin(t/670+record.x)*3;
    circle(ctx,record.x,record.y,18+wave,found?"#b8f4cb24":"#f1d5ac18",found?"#b1ffd080":"#f4d8ad99",2);
    label(ctx,found?"✓":"✧",record.x,record.y+1,18,found?"#b9ffd5":"#ffe4be");
    label(ctx,found?"RECOVERED":"FIELD RECORD",record.x,record.y+37,11,found?"#abdfbb":"#f6dcae");
  }
  // The physical, visual consequences of the expedition keep the player informed.
  if(p.survey)label(ctx,"SURVEY COMPLETE",200,370,10,"#aaf6c8");
  if(p.mechanism)label(ctx,"ARRAY CALIBRATED",754,370,10,"#aaf6c8");
  if(p.echo)label(ctx,"ECHO QUIETED",480,472,10,"#aaf6c8");
}
