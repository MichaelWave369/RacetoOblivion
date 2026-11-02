import {atlasBeacons,atlasChart,atlasExit,atlasRoute,atlasSummary} from "./atlas-rules.js";
const TAU=Math.PI*2;
function disk(c,x,y,r,fill,stroke=null,w=1){
  c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=fill;c.fill();
  if(stroke){c.lineWidth=w;c.strokeStyle=stroke;c.stroke();}
}
function stroke(c,x,y,X,Y,color,w=1){
  c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.lineWidth=w;c.strokeStyle=color;c.stroke();
}
function title(c,s,x,y,size=12,color="#ead9b5"){
  c.save();c.textBaseline="middle";c.textAlign="center";
  c.font="bold "+size+"px Trebuchet MS,Arial";
  c.strokeStyle="#090e1edb";c.lineWidth=4;c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y);c.restore();
}
export function drawLivingAtlas(c,state,t){
  const data=atlasSummary(state);
  const gr=c.createLinearGradient(0,0,0,560);
  gr.addColorStop(0,"#151e39");gr.addColorStop(.46,"#24404a");gr.addColorStop(1,"#182e3d");
  c.fillStyle=gr;c.fillRect(0,0,960,560);
  // An impossible night sky overlays a hand-drawn geographical chart.
  for(let i=0;i<110;i++){
    const x=(i*119.73+17)%960,y=(i*87.4+31)%510;
    disk(c,x,y,.6+i%4*.38,i%3===0?"#fae0b46b":"#a7dadd45");
  }
  for(let i=0;i<13;i++){
    const x=30+i*75;
    stroke(c,x,70,x+Math.sin(t/1600+i)*7,540,"#c5c5bd13");
  }
  for(let i=0;i<12;i++)stroke(c,0,90+i*40,960,90+i*40,"#d5c5a411");
  c.save();c.translate(480,283);
  for(let i=0;i<8;i++){
    c.rotate(Math.PI/4);
    stroke(c,0,-162,0,-170,"#edd6ab50",2);
  }
  c.restore();
  // Old, inconsistent paths are dim; the correct path is authored by the player.
  const west=atlasBeacons.find(b=>b.id==="west");
  const east=atlasBeacons.find(b=>b.id==="east");
  const north=atlasBeacons.find(b=>b.id==="north");
  for(const [a,b] of [[west,north],[east,west],[east,north]]){
    c.setLineDash([6,10]);
    stroke(c,a.x,a.y,b.x,b.y,"#ccd6b52b",3);
    c.setLineDash([]);
  }
  const plotted=data.route.map(id=>atlasBeacons.find(b=>b.id===id));
  for(let i=1;i<plotted.length;i++){
    const a=plotted[i-1],b=plotted[i];
    stroke(c,a.x,a.y,b.x,b.y,data.complete?"#c0fcd0":"#f5d59a",5);
  }
  for(let i=0;i<atlasBeacons.length;i++){
    const b=atlasBeacons[i],found=data.scanned.includes(b.id);
    disk(c,b.x,b.y,32+Math.sin(t/600+i)*2,b.color+"16",b.color+"80",2);
    disk(c,b.x,b.y,22,found?"#294f47":"#203345",found?"#b7ffd4":b.color,2);
    title(c,found?"✓":b.symbol,b.x,b.y,21,found?"#d4ffde":b.color);
    title(c,b.name,b.x,b.y+52,12,found?"#bfe7cf":"#ead9b5");
  }
  disk(c,atlasChart.x,atlasChart.y,33+Math.sin(t/630)*2,data.charted?"#b4ffd126":"#edd3a329",data.charted?"#b8f7ca":"#dbb982",3);
  disk(c,atlasChart.x,atlasChart.y,22,"#21384a","#c3d3c4",2);
  title(c,data.complete?"✓":data.charted?"◇":"?",atlasChart.x,atlasChart.y,23,"#f7e7bd");
  title(c,atlasChart.name,atlasChart.x,atlasChart.y+49,12,"#f3e0bd");
  disk(c,atlasExit.x,atlasExit.y,27,"#203645","#dfc591",2);
  title(c,"↶",atlasExit.x,atlasExit.y,24,"#ffe5b1");
  title(c,"RETURN TO THE HALL",atlasExit.x,atlasExit.y+38,11,"#f4dfbd");
  title(c,"THE LIVING ATLAS",480,50,24,"#f1debc");
  title(c,"A route is not a fact until its observations are known",480,82,12,"#c7cece");
  title(c,"OBSERVATIONS "+data.scannedCount+"/3 · CONNECTED "+data.route.length+"/3",480,125,12,data.complete?"#b9efc9":"#d7d0bf");
  if(data.complete)title(c,"ROUTE RECORDED",480,455,13,"#b7f2ce");
}
