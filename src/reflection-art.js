import {reflectionMirrors,reflectionSummary,galleryCore,galleryExit} from "./reflection-rules.js";
const TAU=Math.PI*2;
function disc(c,x,y,r,fill,stroke=null,width=1){
  c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function line(c,x,y,X,Y,color,width=1){
  c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
function label(c,s,x,y,size=12,color="#edddbd"){
  c.save();c.textAlign="center";c.textBaseline="middle";c.font="bold "+size+"px Trebuchet MS,Arial";
  c.lineWidth=4;c.strokeStyle="#0b1027";c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y);c.restore();
}
export function drawReflectionGallery(c,state,t){
  const summary=reflectionSummary(state),done=summary.complete;
  const background=c.createRadialGradient(480,260,20,480,280,700);
  background.addColorStop(0,"#36415a");background.addColorStop(.48,"#1d2840");background.addColorStop(1,"#0b1124");
  c.fillStyle=background;c.fillRect(0,0,960,560);
  // Repeating gothic arches and parallax ridges make the dimensions
  // hard to judge without turning them into a playable future spoiler.
  for(let i=0;i<7;i++){
    const x=50+i*143;
    c.strokeStyle="#a6b6d727";c.lineWidth=3;
    c.beginPath();c.moveTo(x,420);c.lineTo(x,165);
    c.quadraticCurveTo(x+67,64,x+124,165);c.lineTo(x+124,420);c.stroke();
    c.beginPath();c.ellipse(x+58,310,45,82,0,0,TAU);
    c.strokeStyle="#b5d1cc14";c.stroke();
  }
  for(let i=0;i<13;i++){
    const y=310+i*20;
    line(c,0,y,960,y,"#e1d5c012");
  }
  for(let i=0;i<26;i++){
    const x=i*45;
    line(c,x,290,480+(x-480)*2,560,"#e9d0a10c");
  }
  for(let i=0;i<70;i++){
    const x=(i*163.1+30)%960,y=(i*83.7+24)%470;
    disc(c,x,y,.8+(i%3)*.5,i%2?"#9fc6dd40":"#ecdac66b");
  }
  label(c,"THE REFLECTION GALLERY",480,55,24,"#f5e1c1");
  label(c,"One room · several contradictory histories",480,89,12,"#b4bed1");
  const count=summary.mirrorCount;
  for(const mirror of reflectionMirrors){
    const seen=Boolean(summary.mirrors[mirror.id]);
    const pulse=2*Math.sin(t/580+mirror.x);
    disc(c,mirror.x,mirror.y,43+pulse,mirror.color+"12",mirror.color+"6b",2);
    c.save();
    c.translate(mirror.x,mirror.y);
    c.rotate(Math.sin(t/1300+mirror.y)*.055);
    const pane=c.createLinearGradient(-25,-36,25,36);
    pane.addColorStop(0,mirror.color+"90");pane.addColorStop(.6,"#253e60");pane.addColorStop(1,mirror.color+"3b");
    c.beginPath();c.moveTo(0,-39);c.lineTo(29,-18);c.lineTo(29,21);c.lineTo(0,42);c.lineTo(-29,21);c.lineTo(-29,-18);c.closePath();
    c.fillStyle=pane;c.fill();c.strokeStyle=seen?"#b0ffd7":mirror.color;c.lineWidth=3;c.stroke();
    c.restore();
    label(c,seen?"✓":mirror.symbol,mirror.x,mirror.y,27,seen?"#b5ffcf":"#fff0c9");
    label(c,mirror.name,mirror.x,mirror.y+66,13,seen?"#b6efcf":"#e9ddc9");
  }
  for(let i=0;i<count;i++){
    line(c,360+i*30,368,420+i*30,368,"#b1f9ce96",4);
  }
  const coreGlow=done?"#98e8bf":count===3?"#e6d5a8":"#a1abb3";
  disc(c,galleryCore.x,galleryCore.y,26+Math.sin(t/550)*3,"#173047",coreGlow,3);
  label(c,done?"✓":"?",galleryCore.x,galleryCore.y,23,coreGlow);
  label(c,done?"CONCLUSION RECORDED":"THE UNANSWERED QUESTION",galleryCore.x,galleryCore.y+37,11,coreGlow);
  disc(c,galleryExit.x,galleryExit.y,27,"#182e40","#d7b37d",3);
  label(c,"↶",galleryExit.x,galleryExit.y,22,"#f1d3a1");
  label(c,"RETURN TO THE CLOCK",galleryExit.x,galleryExit.y+41,11,"#f3ddb7");
  label(c,"MIRRORS "+count+" / 3",480,127,13,"#c9d6dc");
}
