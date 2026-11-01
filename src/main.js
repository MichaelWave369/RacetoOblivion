import { thinkers, worlds, intro } from "./content.js";
import { SAVE_KEY, initialState, restoreState, recruit, travel, resolveFracture, clamp } from "./state.js";

const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
const $ = (id) => document.getElementById(id);
const dialog = $("dialog");
const keys = new Set();
let clickDestination = null;
let lastFrame = 0;
let lastSave = 0;
let lastPrompt = "";
let state = load();
let open = false;

function load() {
  try { return restoreState(JSON.parse(localStorage.getItem(SAVE_KEY))); }
  catch { return initialState(); }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch { /* Local storage may be disabled; gameplay still works. */ }
}
function apply(next) {
  state = next;
  save();
  updateReadout();
}
function showDialog(title, body, actions = []) {
  open = true;
  clickDestination = null;
  $("dialog-title").textContent = title;
  $("dialog-body").textContent = body;
  const target = $("dialog-actions");
  target.replaceChildren();
  const choices = actions.length ? actions : [{ label: "Continue", action: closeDialog }];
  for (const choice of choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice.label;
    button.addEventListener("click", choice.action);
    target.append(button);
  }
  dialog.hidden = false;
  target.querySelector("button")?.focus();
}
function closeDialog() {
  open = false;
  dialog.hidden = true;
  canvas.focus({ preventScroll: true });
}
function showJournal() {
  const entries = state.log.slice(-9).reverse().map((line, i) => String(i + 1).padStart(2, "0") + ". " + line);
  showDialog("Field Journal", entries.join("\n\n") || "No entries yet.");
}
function updateReadout() {
  const scene = worlds.find((world) => world.id === state.scene);
  $("location").textContent = scene ? scene.name : "Elsewhen";
  $("chapter").textContent = state.completed.length === 3 ? "CHAPTER 01 · OBSERVATION" : "CHAPTER 01 · ARRIVAL";
  $("progress").textContent = state.completed.length + " / 3 FRACTURES";
  $("stability-value").textContent = state.stability + "%";
  $("stability-meter").style.width = state.stability + "%";
  $("stability-status").textContent = state.stability >= 75 ? "HARMONIC" : state.stability >= 40 ? "UNSTEADY" : "CRITICAL";
  $("insight").textContent = String(state.insight);
  $("completed").textContent = state.completed.length + " / 3";
  const roster = $("roster");
  roster.replaceChildren();
  for (const person of thinkers) {
    const row = document.createElement("div");
    row.className = "roster-entry" + (state.recruits.includes(person.id) ? " active" : "");
    const name = document.createElement("span");
    name.textContent = person.name;
    const status = document.createElement("small");
    status.textContent = state.recruits.includes(person.id) ? "RECRUITED" : "IN TOWN";
    row.append(name, status);
    roster.append(row);
  }
}
function near(x, y, radius = 66) { return Math.hypot(state.x - x, state.y - y) < radius; }
function targetNear() {
  if (state.scene === "elsewhen") {
    for (const person of thinkers) if (near(person.x, person.y, 65)) return { kind: "person", item: person, x: person.x, y: person.y };
    for (const world of worlds) if (near(world.x, world.y, 72)) return { kind: "portal", item: world, x: world.x, y: world.y };
  } else {
    if (near(480, 249, 83)) return { kind: "fracture", item: worlds.find((world) => world.id === state.scene), x: 480, y: 249 };
    if (near(480, 498, 75)) return { kind: "exit", x: 480, y: 498 };
  }
  return null;
}
function interact() {
  if (open) return;
  const target = targetNear();
  if (!target) return;
  if (target.kind === "person") {
    const person = target.item;
    const already = state.recruits.includes(person.id);
    showDialog(person.name + " · " + person.role, already ? person.lines + "\n\n" + "I am ready when you are." : person.lines, already ? [] : [
      { label: "Invite to the expedition", action: () => { apply(recruit(state, person.id)); showDialog(person.name, person.join); } },
      { label: "Not yet", action: closeDialog }
    ]);
  }
  if (target.kind === "portal") {
    const world = target.item;
    showDialog(world.name, world.subtitle + "\n\n" + (state.completed.includes(world.id) ? "This fracture has been stabilized. You may revisit it." : "A dimensional breach waits beyond the threshold."), [
      { label: "Open portal", action: () => { apply(travel(state, world.id)); closeDialog(); } },
      { label: "Stay in Elsewhen", action: closeDialog }
    ]);
  }
  if (target.kind === "exit") { apply(travel(state, "elsewhen")); return; }
  if (target.kind === "fracture") {
    const world = target.item;
    if (state.completed.includes(world.id)) {
      showDialog(world.name, "Your decision has already shaped this reality.\n\n" + state.log.findLast((entry) => entry.startsWith(world.name + ":")));
      return;
    }
    const thinker = thinkers.find((person) => person.id === world.needed);
    if (!state.recruits.includes(world.needed)) {
      showDialog("A Mind Is Missing", world.description + "\n\nYou need " + thinker.name + " to interpret this fracture. Return to Elsewhen and invite them.");
      return;
    }
    const actions = world.options.map((option) => ({
      label: option.label + " (" + (option.stability >= 0 ? "+" : "") + option.stability + " balance)",
      action: () => {
        apply(resolveFracture(state, world.id, option.id));
        showDialog("Fracture Stabilized", option.result + "\n\nBalance: " + state.stability + "% · Insight: " + state.insight, [
          { label: "Return to Elsewhen", action: () => {
            const finished = state.completed.length === worlds.length;
            apply(travel(state, "elsewhen"));
            if (finished) showDialog("The First Observation", "All three fractures are settled. The clock tower has begun counting backward.\n\nA message appears on your Gen.E.Wrist:\n\nNOT EVERY QUESTION HAS BEEN ASKED.");
            else closeDialog();
          } }
        ]);
      }
    }));
    actions.push({ label: "Study the anomaly later", action: closeDialog });
    showDialog(world.name + " · A Decision", world.description + "\n\n" + thinker.name + " offers several possibilities. Each changes what remains.", actions);
  }
}
function line(x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();ctx.moveTo(x1, y1);ctx.lineTo(x2, y2);ctx.stroke();
}
function circle(x, y, radius, fill, stroke = null, width = 1) {
  ctx.beginPath();ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;ctx.fill();
  if (stroke) { ctx.lineWidth = width;ctx.strokeStyle = stroke;ctx.stroke(); }
}
function label(value, x, y, size = 13, color = "#f6e7c8") {
  ctx.font = "bold " + size + "px Trebuchet MS, Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#050a17";
  ctx.fillText(value, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
function backdrop(t) {
  const current = worlds.find((item) => item.id === state.scene);
  const grad = ctx.createLinearGradient(0, 0, 0, 560);
  grad.addColorStop(0, current ? "#091526" : "#111830");
  grad.addColorStop(1, current ? "#18313b" : "#263b43");
  ctx.fillStyle = grad;ctx.fillRect(0, 0, 960, 560);
  for (let i = 0; i < 85; i++) {
    const x = (i * 137 + 47) % 960, y = (i * 71 + 19) % 385;
    circle(x, y, i % 6 === 0 ? 1.5 : 0.8, i % 3 ? "#aacdd1b0" : "#f3d6a1a0");
  }
  if (current) {
    const tint = current.color;
    ctx.fillStyle = tint + "16";ctx.fillRect(0, 65, 960, 495);
    for (let i = 0; i < 16; i++) {
      const x = i * 73 + 15;
      line(x, 95, x + Math.sin(t / 900 + i) * 18, 440, tint + "1d", 2);
    }
    for (let i = 0; i < 7; i++) {
      circle(100 + i * 130, 380 + Math.sin(i) * 30, 44 + i % 3 * 12, tint + "14", tint + "30");
    }
    label(current.name.toUpperCase(), 480, 72, 21, tint);
    label(current.subtitle, 480, 101, 12, "#b8c6d1");
  } else {
    const ground = ctx.createRadialGradient(480, 420, 80, 480, 420, 540);
    ground.addColorStop(0, "#344447");ground.addColorStop(1, "#152333");
    ctx.fillStyle = ground;ctx.fillRect(0, 178, 960, 382);
  }
  for (let i = 0; i < 16; i++) line(0, 180 + i * 26, 960, 180 + i * 26, "#83b6bd12");
  for (let i = 0; i < 25; i++) line(i * 40, 180, i * 40, 560, "#83b6bd0e");
}
function drawTown(t) {
  ctx.fillStyle = "#a9a08520";ctx.beginPath();ctx.ellipse(480, 360, 455, 135, 0, 0, Math.PI * 2);ctx.fill();
  line(480, 520, 480, 175, "#c6a77b55", 50);
  line(120, 385, 836, 385, "#c6a77b40", 43);
  const houses = [[80,262,106,92],[780,267,105,92],[322,208,99,83],[565,207,105,83]];
  for (const [x,y,w,h] of houses) {
    ctx.fillStyle = "#111d2d";ctx.fillRect(x,y,w,h);
    ctx.fillStyle = "#657b84";ctx.fillRect(x-8,y-17,w+16,22);
    ctx.fillStyle = "#dcc087";ctx.fillRect(x+w/2-9,y+24,18,24);
    line(x+5,y+h,x+w-5,y+h,"#a3a5a3",2);
  }
  ctx.fillStyle="#20364a";ctx.fillRect(446,115,68,130);
  ctx.fillStyle="#bf9c6a";ctx.fillRect(438,109,84,9);
  ctx.fillStyle="#d9c38a";ctx.beginPath();ctx.moveTo(437,109);ctx.lineTo(480,56);ctx.lineTo(523,109);ctx.fill();
  circle(480,146,22,"#101c2a","#dbbd86",3);
  line(480,146,480+Math.cos(t/12000)*16,146+Math.sin(t/12000)*16,"#f7dfbb",3);
  line(480,146,480+Math.cos(t/42000+1)*10,146+Math.sin(t/42000+1)*10,"#f7dfbb",2);
  label("THE CLOCK TOWER",480,261,11,"#dbb67b");
  for (const person of thinkers) {
    const active = state.recruits.includes(person.id);
    circle(person.x,person.y+13,21,"#02091890");
    circle(person.x,person.y,21,person.color+"3a",person.color,2);
    label(person.initials,person.x,person.y+5,13,person.color);
    label(person.name,person.x,person.y-32,13);
    if (active) label("◆",person.x+28,person.y-16,16,"#7bffcf");
  }
  for (const world of worlds) {
    const completed = state.completed.includes(world.id);
    const pulse = Math.sin(t/420+world.x)*4;
    circle(world.x,world.y,37+pulse,world.color+"12",world.color+"70",2);
    circle(world.x,world.y,24,completed ? "#133b36" : "#13283b",world.color,3);
    circle(world.x,world.y,12,world.color+"80");
    label(completed ? "✓" : "◇",world.x,world.y+5,17,"#ffffff");
    label(world.name,world.x,world.y+59,13);
  }
}
function drawDimension(t) {
  const world = worlds.find((item) => item.id === state.scene);
  for (let i=0;i<8;i++) {
    const x=155+i*92;
    circle(x,310+Math.sin(i*3)*26,60,world.color+"10",world.color+"33",2);
  }
  const pulse=7*Math.sin(t/550);
  circle(480,249,70+pulse,world.color+"15",world.color+"70",2);
  circle(480,249,46,world.color+"28",world.color,4);
  circle(480,249,17,world.color);
  label(state.completed.includes(world.id) ? "STABILIZED" : "FRACTURE",480,163,18,world.color);
  circle(480,498,31,"#0e2034","#d2ab75",3);
  label("↩",480,506,30,"#e7c99f");
  label("RETURN TO ELSEWHEN",480,548,13,"#f7d7ad");
}
function drawPlayer(t) {
  const bob=Math.sin(t/220)*2;
  circle(state.x,state.y+13,18,"#02061091");
  circle(state.x,state.y+bob,16,"#172e40","#fff0ce",3);
  circle(state.x,state.y-5+bob,8,"#f2cf9e");
  circle(state.x+17,state.y+bob,5,"#8eede0");
  label("MICHAEL WAVE",state.x,state.y-32,12,"#ffffff");
}
function prompt() {
  const target=targetNear();
  const message = !target ? "Explore with WASD / arrows, E to interact, G for Gen.E.Wrist." :
    target.kind === "person" ? "E · SPEAK WITH " + target.item.name.toUpperCase() :
    target.kind === "portal" ? "E · ENTER " + target.item.name.toUpperCase() :
    target.kind === "fracture" ? "E · INVESTIGATE DIMENSIONAL FRACTURE" : "E · RETURN TO ELSEWHEN";
  if (lastPrompt !== message) { $("prompt").textContent = message; lastPrompt=message; }
}
function frame(t) {
  const dt=Math.min((t-lastFrame)/1000 || 0, 0.04);
  lastFrame=t;
  if (!open) {
    let dx=0,dy=0;
    if (keys.has("arrowleft") || keys.has("a") || keys.has("left")) dx--;
    if (keys.has("arrowright") || keys.has("d") || keys.has("right")) dx++;
    if (keys.has("arrowup") || keys.has("w") || keys.has("up")) dy--;
    if (keys.has("arrowdown") || keys.has("s") || keys.has("down")) dy++;
    if (dx || dy) clickDestination=null;
    if (clickDestination && !dx && !dy) {
      const distance=Math.hypot(clickDestination.x-state.x,clickDestination.y-state.y);
      if (distance < 7) clickDestination=null;
      else { dx=(clickDestination.x-state.x)/distance;dy=(clickDestination.y-state.y)/distance; }
    }
    const norm=Math.hypot(dx,dy)||1;
    state.x=clamp(state.x+dx/norm*205*dt,35,925);
    state.y=clamp(state.y+dy/norm*205*dt,55,520);
  }
  backdrop(t);
  if(state.scene==="elsewhen") drawTown(t); else drawDimension(t);
  drawPlayer(t);
  prompt();
  if(t-lastSave>2200){save();lastSave=t;}
  requestAnimationFrame(frame);
}
window.addEventListener("keydown", (event) => {
  const key=event.key.toLowerCase();
  if(["arrowleft","arrowright","arrowup","arrowdown"," "].includes(key)) event.preventDefault();
  if(key==="escape" && open){closeDialog();return;}
  if(open) return;
  if(key==="e" && !event.repeat) interact();
  if(key==="j" && !event.repeat) showJournal();
  if(key==="g" && !event.repeat) {
    $("wrist").scrollIntoView({behavior:"smooth",block:"nearest"});
    $("wrist").classList.toggle("highlight");
  }
  keys.add(key);
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
canvas.addEventListener("pointerdown", (event) => {
  if(open) return;
  const rect=canvas.getBoundingClientRect();
  clickDestination={x:(event.clientX-rect.left)/rect.width*canvas.width,y:(event.clientY-rect.top)/rect.height*canvas.height};
});
for(const button of document.querySelectorAll("[data-direction]")){
  const dir=button.dataset.direction;
  const end=()=>keys.delete(dir);
  button.addEventListener("pointerdown",(event)=>{event.preventDefault();button.setPointerCapture(event.pointerId);keys.add(dir);});
  button.addEventListener("pointerup",end);
  button.addEventListener("pointercancel",end);
  button.addEventListener("lostpointercapture",end);
}
$("touch-interact").addEventListener("click",interact);
$("journal-button").addEventListener("click",showJournal);
$("close-dialog").addEventListener("click",closeDialog);
$("reset-button").addEventListener("click",()=>{
  showDialog("Begin Again?", "This will erase your local journey, recruited minds, and choices.",[
    {label:"Erase and restart",action:()=>{apply(initialState());closeDialog();showIntro();}},
    {label:"Keep my journey",action:closeDialog}
  ]);
});
function showIntro(){
  state.introSeen=true;save();showDialog("Welcome to Elsewhen",intro);
}
updateReadout();
requestAnimationFrame(frame);
if(!state.introSeen) showIntro();
