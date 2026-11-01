import { thinkers, worlds } from "./content.js";

// Original, deterministic Canvas artwork. No image downloads, CDN calls, or
// game-engine dependencies. World coordinates are shared with navigation.js.
const WIDTH=960, HEIGHT=560, TAU=Math.PI*2;
const GOLD="#efd2a1", TEAL="#96e8de";

function poly(c,points,color,stroke=null,width=1){
  c.beginPath();c.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
  c.closePath();c.fillStyle=color;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function disk(c,x,y,r,fill,stroke=null,width=1){
  c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
function ellipse(c,x,y,rx,ry,color){
  c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fillStyle=color;c.fill();
}
function stroke(c,x1,y1,x2,y2,color,w=1){
  c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=w;c.stroke();
}
function text(c,value,x,y,size=12,color=GOLD,font="Trebuchet MS, Arial",align="center"){
  c.textAlign=align;c.textBaseline="middle";c.font="bold "+size+"px "+font;
  c.lineWidth=4;c.strokeStyle="#080f21dc";c.strokeText(value,x,y);
  c.fillStyle=color;c.fillText(value,x,y);
}
function beam(c,x,y,amplitude,h,color){
  const grad=c.createLinearGradient(0,y-h,0,y+h);grad.addColorStop(0,color+"00");grad.addColorStop(.5,color+"12");grad.addColorStop(1,color+"00");
  poly(c,[[x-amplitude,y-h],[x+amplitude,y-h],[x+amplitude*1.8,y+h],[x-amplitude*1.8,y+h]],grad);
}
function stars(c,t){
  for(let i=0;i<110;i++){
    const x=(i*127.73+41)%WIDTH,y=(i*71.41+11)%270;
    const twinkle=.35+.3*Math.sin(i*4.7+t/1800);
    disk(c,x,y,i%9===0?1.6:.8,"rgba(230,219,190,"+twinkle.toFixed(3)+")");
  }
}
function sky(c,t,score){
  const dark=.5+.5*Math.sin(t/38000);
  const gradient=c.createLinearGradient(0,0,0,HEIGHT);
  gradient.addColorStop(0,score<40?"#240e31":"#10172f");
  gradient.addColorStop(.55,score<40?"#322047":"#25354e");
  gradient.addColorStop(1,"#244248");
  c.fillStyle=gradient;c.fillRect(0,0,WIDTH,HEIGHT);
  stars(c,t);
  ellipse(c,740,74,200,45,"rgba(130,108,207,"+(.07+dark*.05)+")");
  ellipse(c,200,115,240,42,"#4daac411");
  disk(c,822,104,24,"#e1c7a51d","#e7ca9e65",1);
  if(score<70){
    const intensity=Math.max(0,(70-score)/70);
    for(let i=0;i<3;i++){
      const x=125+i*310;
      stroke(c,x,4,x+30+12*Math.sin(t/1900+i),100+20*i,"rgba(244,112,166,"+(intensity*.45)+")",2);
    }
  }
}
function brick(c,x,y,w,h,color){
  c.fillStyle=color;c.fillRect(x,y,w,h);
  for(let i=0;i<Math.floor(h/12);i++){
    const yy=y+12+i*12;stroke(c,x,yy,x+w,yy,"#94b4b118");
    for(let j=0;j<Math.floor(w/22);j++)stroke(c,x+(j+(i%2)*.5)*22,yy-12,x+(j+(i%2)*.5)*22,yy,"#94b4b11e");
  }
}
function building(c,x,y,w,h,roof="#527084",wall="#1e3444"){
  // Stylized 2.5D architecture: visible roof slope, light-catching side wall.
  ellipse(c,x+w*.52,y+h+9,w*.62,14,"#050f1e88");
  brick(c,x,y,w,h,wall);
  poly(c,[[x+w,y+2],[x+w+13,y-12],[x+w+13,y+h-8],[x+w,y+h]],"#0b1d30");
  poly(c,[[x-11,y],[x+w+4,y],[x+w+16,y-26],[x+8,y-26]],roof,"#92b4b17a",1);
  poly(c,[[x+8,y-26],[x+w+16,y-26],[x+w/2+7,y-52]],"#314a61","#d8b77d77");
  for(let i=0;i<2;i++){
    const wx=x+18+i*(w-30);
    c.fillStyle="#e3bc77";c.fillRect(wx,y+25,12,22);
    c.fillStyle="#f9e2a344";c.fillRect(wx-4,y+23,20,27);
    stroke(c,wx+6,y+25,wx+6,y+47,"#675c58",2);
  }
  c.fillStyle="#25384b";c.fillRect(x+w*.42,y+h-41,w*.19,41);
  stroke(c,x+w*.42,y+h-41,x+w*.61,y+h-41,"#aab2ac",2);
}
function road(c){
  poly(c,[[430,211],[536,211],[748,560],[220,560]],"#987d654d");
  poly(c,[[50,358],[922,358],[960,429],[0,429]],"#be9c6f36");
  poly(c,[[360,365],[599,365],[650,560],[296,560]],"#dbbe8e15");
  for(let yy=260;yy<560;yy+=26){
    stroke(c,Math.max(0,430-(yy-211)*.55),yy,Math.min(960,536+(yy-211)*.56),yy,"#ffe0ad15");
  }
  for(let i=0;i<17;i++){
    const xx=80+i*49;
    stroke(c,xx,360,xx+19,434,"#ffe0ad0b");
  }
  for(let i=0;i<14;i++) disk(c,55+i*67,385+(i%3)*12,1.3,"#f4cda04b");
}
function grass(c,t){
  for(let i=0;i<90;i++){
    const x=(i*97+13)%WIDTH,y=325+(i*37)%208;
    if(Math.abs(x-480)<103 || (y>349&&y<432))continue;
    stroke(c,x,y,x+Math.sin(t/1500+i)*1.8,y-4,"#82b8a73e");
    if(i%9===0) disk(c,x+3,y-3,2.1,i%2?"#d9a7d5":"#f6d393");
  }
}
function tree(c,x,y,s,t){
  ellipse(c,x+5,y+6,28*s,8*s,"#04121f88");
  stroke(c,x,y-19*s,x+1,y-62*s,"#6b5850",7*s);
  for(let i=0;i<5;i++){
    const angle=(i/5)*TAU;
    const xx=x+Math.cos(angle)*19*s+Math.sin(t/1500+i)*2;
    const yy=y-60*s+Math.sin(angle)*16*s;
    disk(c,xx,yy,21*s,i%2?"#4c7c76":"#568b7d");
    disk(c,xx-6*s,yy-6*s,8*s,"#96ba97a0");
  }
}
function lamppost(c,x,y,t){
  stroke(c,x,y,x,y-77,"#9b9b91",4);
  disk(c,x,y-82,8,"#ffe0a7","#baa77f",2);
  disk(c,x,y-82,20+Math.sin(t/650)*2,"#ffc97c16");
}
function clockTower(c,t){
  const x=450,y=139;
  ellipse(c,485,245,47,12,"#06101f91");
  brick(c,x,y,68,105,"#2d4355");
  poly(c,[[x-13,y+4],[x+80,y+4],[485,66]],"#8f746b","#e1bd7c",2);
  poly(c,[[485,66],[x+80,y+4],[485,y+3]],"#b29578");
  for(let i=0;i<5;i++){
    stroke(c,x+11+i*12,y+17,x+11+i*12,y+93,"#14283d4a");
  }
  circleClock(c,485,160,t);
  c.fillStyle="#b5ab87";c.fillRect(462,225,45,14);
  for(let i=0;i<6;i++){
    stroke(c,463+i*8,226,463+i*8,239,"#394b51",2);
  }
  text(c,"13",485,106,12,"#f7d6a0","Georgia,serif");
}
function circleClock(c,x,y,t){
  disk(c,x,y,24,"#0c1e35","#dbc38c",4);disk(c,x,y,19,"#172b3f","#769fa3",1.5);
  for(let i=0;i<12;i++){
    const a=i*TAU/12,xx=x+Math.sin(a)*16,yy=y-Math.cos(a)*16;
    disk(c,xx,yy,1.4,"#f8d8a4");
  }
  const angle=t/2400;
  for(const [ang,len,w,col] of [[angle,14,2.5,"#f7ddbb"],[-angle*.7,10,2,"#8fe7df"],[angle*.4+2,8,1.3,"#d6b5e4"]])
    stroke(c,x,y,x+Math.sin(ang)*len,y-Math.cos(ang)*len,col,w);
  disk(c,x,y,3,"#fce1b1");
}
function painter(c,x,y,shirt,accent,walk=0){
  // World-space feet remain fixed, allowing collision and interaction accuracy.
  ellipse(c,x,y+12,15,6,"#010a1699");
  const bob=Math.sin(walk)*1.5;
  stroke(c,x-5,y+4+bob,x-7,y+10+bob,"#141c2c",4);
  stroke(c,x+5,y+4+bob,x+7,y+10+bob,"#141c2c",4);
  poly(c,[[x-13,y-14+bob],[x+13,y-14+bob],[x+10,y+4+bob],[x-10,y+4+bob]],shirt,"#a8b5b34a",1);
  stroke(c,x-12,y-8+bob,x-16,y+2+bob,accent,3.2);
  stroke(c,x+12,y-8+bob,x+17,y+2+bob,accent,3.2);
  disk(c,x,y-23+bob,10,"#e0ba94","#423439",1.5);
  poly(c,[[x-9,y-27+bob],[x-6,y-37+bob],[x+8,y-35+bob],[x+10,y-27+bob]],accent);
  disk(c,x+3,y-24+bob,1.3,"#172134");
}
function portal(c,world,t,done){
  const {x,y,color}=world,phase=t/1000+world.x;
  beam(c,x,y+40,26,77,color);
  ellipse(c,x,y+37,43,11,color+"4b");
  c.save();c.translate(x,y);c.rotate(-.12);
  for(let i=0;i<3;i++){
    c.save();c.rotate(phase*(i%2?-.38:.27)+i);
    c.beginPath();c.ellipse(0,0,24+i*8,32+i*6,.25,0,TAU);
    c.strokeStyle=color+(i===1?"c0":"74");c.lineWidth=2.4-i*.4;c.stroke();c.restore();
  }
  c.restore();
  const inner=c.createRadialGradient(x,y,2,x,y,33);
  inner.addColorStop(0,done?"#a0ffd7cc":color+"e8");inner.addColorStop(.52,color+"44");inner.addColorStop(1,color+"00");
  disk(c,x,y,33,inner);
  disk(c,x,y,7,done?"#b9ffd2":"#ffffff");
  text(c,done?"✓":"✧",x,y+1,15,"#101a2b");
  text(c,world.name,x,y+66,13,done?"#b5efc8":GOLD);
  if(done) text(c,"HARMONIZED",x,y+82,9,"#9be2c2");
}
function drawResidents(c,t){
  // Their positions are bounded to walkable plaza zones; gameplay never relies on them for blocking.
  const walkers=[
    {x:322+Math.sin(t/2800)*21,y:469+Math.cos(t/2200)*8,shirt:"#826ab0",accent:"#e7bda6",name:"MIRA"},
    {x:658+Math.sin(t/3200+2)*23,y:467+Math.cos(t/2700+1)*11,shirt:"#508d7b",accent:"#bfe6bb",name:"ELIAN"}
  ];
  for(const npc of walkers){
    painter(c,npc.x,npc.y,npc.shirt,npc.accent,t/175);
    text(c,npc.name,npc.x,npc.y-48,9,"#b5cbd3");
  }
}
function floatingDust(c,t){
  for(let i=0;i<40;i++){
    const x=(i*111.19+17)%WIDTH,y=280+((i*59.34+Math.sin(t/1900+i)*9)%240);
    disk(c,x,y,1.2+i%3*.4,i%4?"#ffcf8750":"#90e8d76a");
  }
}
function town(c,state,t){
  sky(c,t,state.stability);
  // Hills and an impossible, luminous skyline.
  poly(c,[[0,249],[110,186],[215,245],[332,174],[483,235],[637,170],[778,234],[885,177],[960,231],[960,560],[0,560]],"#132c3b");
  poly(c,[[0,296],[160,245],[330,277],[465,230],[603,285],[775,242],[960,287],[960,560],[0,560]],"#254750");
  c.fillStyle="#244146";c.fillRect(0,288,960,272);
  road(c);grass(c,t);
  for(const [x,y,s] of [[30,324,.67],[210,257,.6],[732,262,.63],[930,314,.69],[264,484,.56],[723,495,.51]])tree(c,x,y,s,t);
  // Buildings arranged around the cross-street and accessible from all sides.
  building(c,85,279,98,74,"#5b7383","#273c4d");
  building(c,777,279,98,74,"#496c80","#223b4c");
  building(c,320,222,96,66,"#746c85","#2a384c");
  building(c,545,222,96,66,"#61788c","#24374d");
  building(c,48,411,85,72,"#728f88","#284850");
  building(c,825,414,88,65,"#745f87","#24384d");
  clockTower(c,t);
  lamppost(c,265,399,t);lamppost(c,699,395,t);lamppost(c,151,468,t);lamppost(c,807,479,t);
  // The old plaza fountain and its non-Euclidean waterline.
  ellipse(c,480,412,66,23,"#172b38");
  ellipse(c,480,410,59,16,"#a7b5ad");
  ellipse(c,480,407,50,11,"#367a8c");
  disk(c,480,394,7,"#d3ba8a");
  stroke(c,480,392,480,379+Math.sin(t/340)*3,"#87d9e6",2);
  floatingDust(c,t);
  for(const world of worlds) portal(c,world,t,state.completed.includes(world.id));
  for(const person of thinkers){
    const recruited=state.recruits.includes(person.id);
    const bob=Math.sin(t/230+person.x);
    painter(c,person.x,person.y,person.id==="einstein"?"#c8b59a":person.id==="tesla"?"#33577b":"#77557f",person.color,bob);
    if(recruited)disk(c,person.x+22,person.y-39,4,"#8bffca");
    text(c,person.name,person.x,person.y-56,12,person.color);
  }
  drawResidents(c,t);
  text(c,"THE OBSERVATORY",96,503,10,"#c8d6d8");
  text(c,"THE ATELIER",869,504,10,"#c8d6d8");
}
function worldBackdrop(c,world,t,state){
  const gr=c.createLinearGradient(0,0,0,560);
  const colors=world.id==="gardens"?["#0f2635","#24594e"]:world.id==="causeway"?["#0b1e3b","#33475a"]:["#1a1c38","#474057"];
  gr.addColorStop(0,colors[0]);gr.addColorStop(1,colors[1]);c.fillStyle=gr;c.fillRect(0,0,960,560);
  stars(c,t);
  if(world.id==="gardens"){
    poly(c,[[0,392],[200,345],[480,370],[720,330],[960,410],[960,560],[0,560]],"#29534b");
    for(let i=0;i<12;i++)tree(c,55+i*77,377+(i%3)*31,.58+(i%4)*.13,t);
    for(let i=0;i<3;i++){
      c.save();c.translate(480,275);c.rotate(i*TAU/3+t/9500);
      c.strokeStyle=["#eec7a2","#ace6c4","#9dd5ed"][i];c.lineWidth=3;
      c.beginPath();c.ellipse(0,0,130,70,.4,0,TAU);c.stroke();c.restore();
    }
  }else if(world.id==="causeway"){
    for(let i=0;i<10;i++){
      const x=i*110;
      poly(c,[[x-20,445],[x+40,445],[x+15,200+Math.sin(i)*80]],"#263a52");
      stroke(c,x+5,188,x+10+Math.sin(t/300+i)*28,282+Math.sin(i)*30,world.color+"85",3);
    }
    for(let i=0;i<12;i++)poly(c,[[i*100,440],[i*100+84,440],[i*100+128,485],[i*100+45,485]],"#6e96a570",world.color+"50",2);
  }else{
    for(let i=0;i<14;i++){
      const xx=60+i*64,yy=210+(i%4)*47+Math.sin(t/900+i)*9;
      c.save();c.translate(xx,yy);c.rotate(Math.sin(t/1100+i)*.17);
      c.fillStyle=i%2?"#ada0d17c":"#b9aed77c";c.fillRect(-20,-24,40,48);
      for(let k=0;k<5;k++)stroke(c,-12,-15+k*8,13,-15+k*8,"#2e2e4b90");
      c.restore();
    }
    poly(c,[[0,450],[960,450],[960,560],[0,560]],"#272743");
  }
  const complete=state.completed.includes(world.id);
  if(complete)beam(c,480,245,240,310,"#abf3d5");
  for(let i=0;i<34;i++){
    const xx=(i*143.8)%960,yy=200+(i*73.2)%295+Math.sin(t/900+i)*12;
    disk(c,xx,yy,i%3+1,world.color+"55");
  }
  text(c,world.name.toUpperCase(),480,61,24,world.color,"Georgia,serif");
  text(c,world.subtitle,480,92,12,"#d4dbe3");
  portal(c,{...world,x:480,y:249},t,complete);
  text(c,complete?"FRACTURE HARMONIZED":"STUDY THE FRACTURE",480,147,16,world.color);
  disk(c,480,498,28,"#0c1d33","#e4c38b",2);
  text(c,"↶",480,497,23,"#f0d6a9");
  text(c,"RETURN TO ELSEWHEN",480,546,11,"#f4dfb9");
}
function player(c,state,t,moving,facing){
  const x=state.x,y=state.y;
  ellipse(c,x,y+10,17,6,"#020917a5");
  const bounce=moving?Math.sin(t/100)*2.1:Math.sin(t/620)*.5;
  stroke(c,x-5,y+2+bounce,x-8,y+13+bounce,"#171e2e",5);
  stroke(c,x+5,y+2+bounce,x+8,y+13+bounce,"#171e2e",5);
  poly(c,[[x-14,y-24+bounce],[x+14,y-24+bounce],[x+10,y+6+bounce],[x-11,y+6+bounce]],"#344a62","#e3cba0",1.5);
  disk(c,x,y-33+bounce,10,"#edc59e","#262638",2);
  poly(c,[[x-10,y-38+bounce],[x-5,y-45+bounce],[x+9,y-41+bounce],[x+10,y-35+bounce]],"#302b35");
  stroke(c,x-13,y-15+bounce,x-18,y+bounce,"#d0b59d",4);
  stroke(c,x+13,y-15+bounce,x+17,y+bounce,"#d0b59d",4);
  disk(c,x+18,y-1+bounce,5,"#8cece0");
  disk(c,x+18,y-1+bounce,10,"#8cece01c");
  if(facing==="left")disk(c,x-5,y-34+bounce,2,"#18212a");
  else disk(c,x+5,y-34+bounce,2,"#18212a");
  text(c,"MICHAEL WAVE",x,y-60,11,"#fff4d5");
}
export function drawWorld(ctx,state,t,{moving=false,facing="right"}={}){
  ctx.save();
  if(state.scene==="elsewhen")town(ctx,state,t);
  else {
    const world=worlds.find((entry)=>entry.id===state.scene);
    if(world)worldBackdrop(ctx,world,t,state);
  }
  player(ctx,state,t,moving,facing);
  ctx.restore();
}
