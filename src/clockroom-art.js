import { clockStations, validateClock, clockOrder } from "./clock-rules.js";
function disc(c,x,y,r,fill,stroke=null,w=1){
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();
  if(stroke){c.lineWidth=w;c.strokeStyle=stroke;c.stroke();}
}
function ln(c,x,y,x2,y2,color,w=1){
  c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=w;c.stroke();
}
function label(c,value,x,y,size=13,color="#e2ceb2"){
  c.save();c.textAlign="center";c.textBaseline="middle";
  c.font="bold "+size+"px Trebuchet MS,Arial";c.strokeStyle="#071022";
  c.lineWidth=4;c.strokeText(value,x,y);c.fillStyle=color;c.fillText(value,x,y);c.restore();
}
function gear(c,x,y,r,teeth,t){
  c.save();c.translate(x,y);c.rotate(t);
  c.strokeStyle="#ad9876";c.lineWidth=4;c.beginPath();
  for(let i=0;i<teeth*2;i++){
    const a=i*Math.PI/teeth;const rr=r+(i%2?6:0);
    if(!i)c.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
    else c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
  }
  c.closePath();c.stroke();disc(c,0,0,r*.52,"#1b354b","#86aab0",2);
  for(let i=0;i<4;i++){
    const a=t*0+i*Math.PI/2;
    ln(c,Math.cos(a)*r*.3,Math.sin(a)*r*.3,Math.cos(a)*r*.8,Math.sin(a)*r*.8,"#c3a778",3);
  }
  c.restore();
}
export function drawClockRoom(c,state,t){
  const clock=validateClock(state.clock);
  const gradient=c.createRadialGradient(480,180,50,480,300,700);
  gradient.addColorStop(0,"#243c54");gradient.addColorStop(.55,"#131c31");gradient.addColorStop(1,"#090c20");
  c.fillStyle=gradient;c.fillRect(0,0,960,560);
  // A room that seems to extend farther than the tower's exterior would allow.
  c.fillStyle="#16263b";
  c.beginPath();c.moveTo(170,95);c.lineTo(790,95);c.lineTo(950,560);
  c.lineTo(10,560);c.fill();
  for(let i=0;i<16;i++){
    const x=50+i*58;
    ln(c,x,420,x+(x-480)*.5,560,"#f0cd8b17");
  }
  for(let i=0;i<6;i++){
    const y=340+i*43;
    ln(c,0,y,960,y,"#f0cd8b15");
  }
  for(let i=0;i<8;i++)ln(c,190+i*83,108,125+i*101,380,"#b5b2bf14");
  // Mechanical ceiling and brass conduits are deliberately suggestive, not explanatory.
  for(let i=0;i<4;i++){
    gear(c,185+i*195,78,30+(i%2)*10,12,((i%2)?1:-1)*t/8000);
    ln(c,185+i*195,116,185+i*195,175,"#e1ba794f",3);
  }
  for(let i=0;i<3;i++){
    const x=345+i*137,glow=["#99d6bc","#e5ba89","#c6a5e9"][i];
    ln(c,x,113,480,238,glow+"66",1.8);
    disc(c,x,113,8,glow);
  }
  disc(c,480,238,66,"#0a1b33","#e2c48a",3);
  disc(c,480,238,48,"#112942","#799ea0",2);
  for(let i=0;i<9;i++){
    const a=i*2*Math.PI/9+t/8500;
    disc(c,480+Math.cos(a)*39,238+Math.sin(a)*39,3,"#d9c89f");
  }
  label(c,"THE UNWRITTEN HOUR",480,48,23,"#f1dbb2");
  label(c,"Clock Tower · Observation Chamber",480,116,12,"#afbdc6");
  const colors=["#8be2d1","#d9b6fc","#ffd19d"];
  for(let i=0;i<clockStations.length;i++){
    const station=clockStations[i],observed=clock.stations.includes(station.id);
    const pulse=2*Math.sin(t/600+i*2);
    disc(c,station.x,station.y,34+pulse,colors[i]+"18",colors[i]+"64",2);
    disc(c,station.x,station.y,24,observed?"#20493e":"#152a40",colors[i],3);
    label(c,observed?"✓":station.symbol,station.x,station.y+1,22,colors[i]);
    label(c,station.name,station.x,station.y+53,13,observed?"#b5efcd":"#e5dfd0");
  }
  // Brass-inscribed exit floor circle.
  disc(c,480,503,29,"#192d3e","#d8b87c",3);
  label(c,"↶",480,503,24,"#ffe4b6");
  label(c,"RETURN TO ELSEWHEN",480,547,11,"#e4cda9");
  if(clock.stations.length===3){
    label(c,"THREE INSTRUMENTS IN AGREEMENT",480,386,14,"#b7f4d1");
  }else {
    label(c,"OBSERVATIONS "+clock.stations.length+" / 3",480,385,12,"#c7b3dd");
  }
  // The finished dial sequence is printed as a simple decorative band.
  label(c,clockOrder.join(" · "),480,428,16,"#d8bd87");
}
