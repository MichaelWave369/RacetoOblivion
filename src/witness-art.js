import {testimony,evidence,witnessBoard,witnessExit,witnessSummary} from "./witness-rules.js";
const TAU=Math.PI*2;
function circle(c,x,y,r,fill,stroke=null,w=2){
  c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}
}
function line(c,x,y,X,Y,color,w=1){
  c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.lineWidth=w;c.strokeStyle=color;c.stroke();
}
function label(c,s,x,y,size=12,color="#ead8bc"){
  c.save();c.textAlign="center";c.textBaseline="middle";c.font="bold "+size+"px Trebuchet MS,Arial";
  c.strokeStyle="#0a1424";c.lineWidth=4;c.strokeText(s,x,y);c.fillStyle=color;c.fillText(s,x,y);c.restore();
}
export function drawWitnessHall(c,state,t){
  const status=witnessSummary(state);
  const gradient=c.createLinearGradient(0,0,0,560);
  gradient.addColorStop(0,"#101c31");gradient.addColorStop(.55,"#23394c");gradient.addColorStop(1,"#172d36");
  c.fillStyle=gradient;c.fillRect(0,0,960,560);
  for(let i=0;i<9;i++){
    const x=40+i*114;
    c.fillStyle=i%2?"#c6d2da09":"#efdfba0a";c.fillRect(x,80,47,400);
    line(c,x,80,x,480,"#9abac322",2);
  }
  c.fillStyle="#b1a18a12";c.fillRect(0,460,960,100);
  for(let i=0;i<14;i++)line(c,0,420+i*11,960,420+i*11,"#d3c3a919");
  for(let i=0;i<20;i++)line(c,i*53,460,480+(i*53-480)*1.5,560,"#e9d9ba12");
  // Repeating paper slips and impossible time instruments are ambience only.
  for(let i=0;i<12;i++){
    const x=30+i*84,y=128+(i%3)*27;
    c.save();c.translate(x,y);c.rotate(Math.sin(t/2900+i)*.04);
    c.fillStyle="#e0d8c13c";c.fillRect(-18,-24,36,48);
    for(let j=0;j<4;j++)line(c,-12,-12+j*10,12,-12+j*10,"#29375099");
    c.restore();
  }
  label(c,"THE HALL OF WITNESSES",480,47,24,"#f8e2b8");
  label(c,"Three recollections · two traces · one unfinished account",480,87,12,"#b7ccd2");
  for(const [index,person] of testimony.entries()){
    const heard=status.heard.includes(person.id),pulse=Math.sin(t/550+index)*2;
    circle(c,person.x,person.y,29+pulse,person.color+"25",person.color+"92");
    circle(c,person.x,person.y,21,heard?"#265348":"#20384a",person.color,3);
    label(c,heard?"✓":String(index+1),person.x,person.y,19,heard?"#bdffcf":"#ffe5c1");
    label(c,person.name,person.x,person.y+53,13,person.color);
  }
  for(const [index,item] of evidence.entries()){
    const found=status.evidence.includes(item.id);
    circle(c,item.x,item.y,23,item.color+"28",item.color,2);
    label(c,found?"✓":"⌕",item.x,item.y,23,found?"#c6fadd":"#fce5b5");
    label(c,item.name,item.x,item.y+42,12,item.color);
  }
  const ready=status.count===status.total;
  circle(c,witnessBoard.x,witnessBoard.y,35+Math.sin(t/680)*3,ready?"#c5edcb25":"#dfc28e1b",ready?"#a0f2c2":"#dabb8a",3);
  circle(c,witnessBoard.x,witnessBoard.y,23,"#1b3444","#b9bbc6",2);
  label(c,status.complete?"✓":status.hypothesis?"◇":"?",witnessBoard.x,witnessBoard.y,24,ready?"#baf9d3":"#f7d9aa");
  label(c,witnessBoard.name,witnessBoard.x,witnessBoard.y+57,12,"#ebd7b6");
  circle(c,witnessExit.x,witnessExit.y,28,"#1a3443","#e8cba2",3);
  label(c,"↶",witnessExit.x,witnessExit.y,25,"#ffe5b5");
  label(c,"RETURN TO REFLECTIONS",witnessExit.x,witnessExit.y+39,11,"#eedcbf");
  label(c,"CASE FILE "+status.count+" / "+status.total,480,139,13,status.complete?"#b7ffe0":"#d8d4ca");
  if(status.complete)label(c,"CASE RECORDED · OBSERVATIONS RETAINED",480,448,12,"#bdf0ce");
}
