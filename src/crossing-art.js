import { crossingPaths,crossingTable,crossingArrival,crossingExit,crossingSummary } from "./crossing-rules.js";
const TAU=Math.PI*2;
function disc(c,x,y,r,color,stroke=null,w=1){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function line(c,x,y,X,Y,color,w=1){c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function text(c,label,x,y,size=12,color="#f3dfb4"){c.save();c.textAlign="center";c.textBaseline="middle";c.font="bold "+size+"px Trebuchet MS,Arial";c.strokeStyle="#090f25";c.lineWidth=4;c.strokeText(label,x,y);c.fillStyle=color;c.fillText(label,x,y);c.restore();}
function polygon(c,points,color,stroke=null,w=1){c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
export function drawWayfarersCrossing(c,state,t){
  const progress=crossingSummary(state);
  const gradient=c.createLinearGradient(0,0,0,560);
  gradient.addColorStop(0,"#131e38");gradient.addColorStop(.53,"#28424a");gradient.addColorStop(1,"#1a3541");
  c.fillStyle=gradient;c.fillRect(0,0,960,560);
  polygon(c,[[0,175],[92,138],[198,170],[327,119],[460,170],[626,121],[746,179],[876,127],[960,165],[960,560],[0,560]],"#26494d");
  polygon(c,[[0,244],[140,224],[355,254],[512,218],[748,249],[960,213],[960,560],[0,560]],"#44615899");
  // The channel is genuinely unwalkable except where navigation.js opens
  // the bridge chosen by the player.
  c.fillStyle="#0d3445";c.fillRect(24,295,912,60);
  for(let i=0;i<19;i++){
    const y=298+i*3.2,offset=Math.sin(t/1100+i)*10;
    line(c,24,y,936,y,"#8ac0c0"+(i%3===0?"28":"12"),1.5);
    for(let j=0;j<6;j++){
      const x=45+j*155+offset;
      line(c,x,y,x+45,y,"#b4ecec25",1);
    }
  }
  for(const path of crossingPaths){
    const active=progress.chosen===path.id;
    const inspected=progress.observed.includes(path.id);
    const [left,right]=path.gap;
    polygon(c,[[left,290],[right,290],[right,362],[left,362]],
      active?"#b8ddb670":"#0a2539",active?path.color:"#5e7f88",3);
    // Walkable wood/stone planks only appear after the choice.
    if(active){
      for(let y=298;y<352;y+=13)line(c,left+4,y,right-4,y,path.color+"ae",2);
      for(let k=0;k<5;k++){
        const xx=left+(right-left)*k/4;
        line(c,xx,293,xx,357,"#ffdfae5c",1.5);
      }
    }else{
      line(c,left,292,right,351,"#e4aac044",2);
      line(c,right,292,left,351,"#e4aac044",2);
    }
    disc(c,path.x,path.y,28+Math.sin(t/620+path.x)*2,
      inspected?path.color+"22":"#e7d7b51c",path.color,3);
    disc(c,path.x,path.y,19,inspected?"#204c42":"#1b3346",path.color,2);
    text(c,inspected?"✓":path.glyph,path.x,path.y,22,path.color);
    text(c,path.name,path.x,path.y+48,12,inspected?"#c5f1d6":"#efdbb9");
    if(active)text(c,"OPEN",path.x,277,13,"#baffd8");
  }
  // The far shore is reachable only by crossing an unlocked bridge.
  disc(c,crossingArrival.x,crossingArrival.y,34+Math.sin(t/810)*3,
    progress.arrived?"#9bebbc2b":"#d9c4a023",
    progress.chosen?"#b7efcc":"#e0c69c",3);
  text(c,progress.arrived?"✓":"✧",crossingArrival.x,crossingArrival.y,28,progress.arrived?"#bdfacb":"#f3d8a7");
  text(c,crossingArrival.name,crossingArrival.x,crossingArrival.y+52,13,"#f3deb9");
  // South-side route table and exit always remain reachable.
  disc(c,crossingTable.x,crossingTable.y,29,"#203d4b",
    progress.chosen?"#a8edca":"#d6b98a",3);
  text(c,progress.complete?"✓":progress.chosen?"◈":"?",crossingTable.x,crossingTable.y,22,"#f6deaa");
  text(c,"ROUTE TABLE",crossingTable.x,crossingTable.y+44,12,"#ebd8b8");
  disc(c,crossingExit.x,crossingExit.y,26,"#1d3444","#e1c18c",2);
  text(c,"↶",crossingExit.x,crossingExit.y,23,"#ffe1ae");
  text(c,"RETURN TO ATLAS",crossingExit.x,crossingExit.y+34,11,"#f3d9a9");
  text(c,"THE WAYFARER'S CROSSING",480,51,24,"#f4dfb4");
  text(c,"The route you choose is the only bridge that opens",480,85,12,"#c2d0c8");
  text(c,"SURVEYS "+progress.count+"/3 · "+
    (progress.complete?"PASSAGE RECORDED":progress.arrived?"FAR SHORE REACHED":progress.chosen?"BRIDGE OPEN":"NO BRIDGE SELECTED"),480,125,12,
    progress.complete?"#b7f8c8":"#d8d2b9");
}
