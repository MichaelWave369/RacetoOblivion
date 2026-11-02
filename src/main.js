import { thinkers, worlds, intro, conversations, landmarks } from "./content.js";
import { SAVE_KEY, initialState, restoreState, recruit, travel, resolveFracture, discuss, observe } from "./state.js";
import { drawWorld } from "./visuals.js";
import { stepPosition } from "./navigation.js";
import { createAmbientAudio } from "./audio.js";
import { expeditionNodes } from "./expeditions.js";
import { coreReady, nextObjective } from "./expedition-rules.js";
import { createExpeditionUI } from "./expedition-ui.js";
import { recordsForWorld, collectRecord, archiveSummary, totalRecords } from "./field-records.js";
import { visitors, conclave, socialSummary, validateSocial } from "./relationships.js";
import { createSocialUI } from "./social-ui.js";
import { clockFragments, clockStations, clockSummary, eligibleClockFragment, recoverClockFragment } from "./clock-rules.js";
import { createClockUI } from "./clock-ui.js";
import { galleryAvailable, reflectionSummary, reflectionMirrors, unwrittenVisitor, galleryEntrance, galleryExit, galleryCore } from "./reflection-rules.js";
import { createReflectionUI } from "./reflection-ui.js";
import { witnessAvailable, witnessSummary, witnessEntrance, witnessExit, testimony, evidence, witnessBoard } from "./witness-rules.js";
import { createWitnessUI } from "./witness-ui.js";

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
let facing = "right";
let moving = false;
let wristMode = "field";
let padWas = [];
const ambient = createAmbientAudio();
const SETTINGS_KEY = "rto-field-settings-v2";
function restoreSettings() {
  const defaults = { motion: Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches), contrast: false };
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return {motion: typeof saved?.motion === "boolean" ? saved.motion : defaults.motion,contrast: saved?.contrast === true};
  } catch {return defaults;}
}
const settings = restoreSettings();
function saveSettings() {
  try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}
}
function syncSettings() {
  document.body.classList.toggle("reduce-motion",settings.motion);
  document.body.classList.toggle("high-contrast",settings.contrast);
  for(const [id,value,yes,no] of [
    ["motion-toggle",settings.motion,"MOTION REDUCED","REDUCE MOTION"],
    ["contrast-toggle",settings.contrast,"STANDARD CONTRAST","HIGH CONTRAST"],
    ["audio-toggle",ambient.enabled,"SOUND ON","SOUND OFF"]
  ]) {
    const button=$(id);
    button.textContent=value?yes:no;
    button.setAttribute("aria-pressed",String(value));
  }
}
function showWristMode(mode) {
  wristMode=mode;
  for(const button of document.querySelectorAll("[data-wrist-tab]")){
    const selected=button.dataset.wristTab===mode;
    button.classList.toggle("selected",selected);
    button.setAttribute("aria-pressed",String(selected));
  }
  updateWristIntel();
}
function updateWristIntel() {
  if(wristMode==="archive"){
    const summary=archiveSummary(state.records);
    $("wrist-intel").textContent=summary.complete
      ?"The field records form a constellation of unanswered questions. Every entry is now available for review."
      :"Recovered "+summary.count+" of "+totalRecords+" field records. Follow the small amber signals on expedition maps.";
    return;
  }
  if(state.scene==="witnesshall"){
    $("wrist-intel").textContent=witnessSummary(state).next;return;
  }
  if(state.scene==="gallery"){
    $("wrist-intel").textContent=witnessAvailable(state)?witnessSummary(state).next:reflectionSummary(state).next;return;
  }
  if(state.scene==="clockroom"){
    $("wrist-intel").textContent=galleryAvailable(state)?reflectionSummary(state).next:clockSummary(state).next;return;
  }
  if(state.scene!=="elsewhen"){
    $("wrist-intel").textContent=nextObjective(state,state.scene);
    return;
  }
  if(wristMode==="field") {
    $("wrist-intel").textContent=state.stability>=80
      ? "The Interval is breathing more easily. Every correction leaves an echo."
      : state.stability<40
        ? "Caution: dimensional interference rising. Seek a careful solution."
        : "Three distant signals. Each asks for a different kind of mind.";
  } else if(wristMode==="paths"){
    $("wrist-intel").textContent=worlds.map(w=>(state.completed.includes(w.id)?"✓ ":"◇ ")+w.name).join(" · ");
  } else {
    $("wrist-intel").textContent=thinkers.map(p=>(state.squad.includes(p.id)?"✧ ":state.recruits.includes(p.id)?"✓ ":"◇ ")+p.name).join(" · ");
  }
}
function updateQuest() {
  if(state.scene==="witnesshall"){
    $("quest-status").textContent=witnessSummary(state).next;return;
  }
  if(state.scene==="gallery"){
    $("quest-status").textContent=witnessAvailable(state)?witnessSummary(state).next:reflectionSummary(state).next;return;
  }
  if(state.scene==="clockroom"){
    $("quest-status").textContent=galleryAvailable(state)? "A new doorway is open. Find the Reflection Gallery." : "Observe the three instruments of the unwritten hour.";return;
  }
  if(state.scene!=="elsewhen"){
    $("quest-status").textContent=nextObjective(state,state.scene);
    return;
  }
  const notRecruited=thinkers.filter(p=>!state.recruits.includes(p.id));
  const unresolved=worlds.filter(w=>!state.completed.includes(w.id));
  if(witnessAvailable(state)){
    $("quest-status").textContent=witnessSummary(state).complete?"Return to Elsewhen and discuss the case with Schrödinger.":"A new doorway has opened in the Reflection Gallery. Find the Hall of Witnesses.";
  }
  else if(galleryAvailable(state)){
    $("quest-status").textContent=reflectionSummary(state).complete?"Speak with Schrödinger about the investigation.":"The clock tower has opened another chamber. Return there or speak with the visiting physicist.";
  }
  else if(clockSummary(state).solved){$("quest-status").textContent=clockSummary(state).roomComplete?"The unwritten hour has been observed. Explore other mysteries.":"Enter the clock tower and explore its observation chamber.";} 
  else if(state.completed.length===worlds.length)$("quest-status").textContent="Trace the inscriptions in the fountain, atelier and observatory. Then visit the clock tower.";
  else if(notRecruited.length)$("quest-status").textContent="Meet "+notRecruited.map(p=>p.name).join(", ")+".";
  else $("quest-status").textContent="Investigate "+unresolved.map(w=>w.name).join(", ")+".";
}
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
  const entries=state.log.slice(-9).reverse().map((line,i)=>String(i+1).padStart(2,"0")+". "+line);
  showDialog("Field Journal",entries.join("\n\n")||"No entries yet.");
}
function showRecord(record){
  showDialog(record.title,record.text+"\n\n"+record.note,[
    {label:"Back to field archive",action:showArchive},
    {label:"Continue exploring",action:closeDialog}
  ]);
}
function showArchive(){
  const summary=archiveSummary(state.records);
  const actions=summary.lines.map(record=>({
    label:record.title,
    action:()=>showRecord(record)
  }));
  actions.push({label:"Close archive",action:closeDialog});
  showDialog("Gen.E.Wrist · Field Archive",
    "Recovered "+summary.count+"/"+totalRecords+" field records.\n\n"+
    (summary.complete
      ?"CHRONICLE COMPLETE: These records describe different questions, but each points toward the same missing observation."
      :"Records are scattered throughout the three realms. Their amber markers are visible on the expedition maps.")+
    "\n\nCollected entries may be reread at any time.",
    actions);
}
function exploreRecord(record){
  const discovered=state.records?.includes(record.id);
  if(!discovered)apply(collectRecord(state,record.id));
  showDialog(record.title,
    record.text+"\n\n"+record.note+
    (discovered?"\n\nPreviously recovered.":"\n\nNEW FIELD RECORD · Insight +1"),
    [{label:"Open Field Archive",action:showArchive},{label:"Continue expedition",action:closeDialog}]);
}
function updateReadout() {
  const scene = worlds.find((world) => world.id === state.scene);
  $("location").textContent = state.scene==="witnesshall"?"The Hall of Witnesses":state.scene==="gallery"?"The Reflection Gallery":state.scene==="clockroom"?"Clock Tower · Observation Chamber":scene?scene.name:"Elsewhen";
  $("chapter").textContent = state.scene==="witnesshall"?"CHAPTER 05 · THE MISSING WITNESS":state.scene==="gallery"?"CHAPTER 04 · REFLECTIONS":state.scene==="clockroom"?"CHAPTER 03 · THE UNWRITTEN HOUR":state.scene !== "elsewhen" ? "CHAPTER 02 · EXPEDITION" : state.completed.length === 3 ? "CHAPTER 01 · OBSERVATION" : "CHAPTER 01 · ARRIVAL";
  $("progress").textContent = state.completed.length + " / 3 FRACTURES";
  $("stability-value").textContent = state.stability + "%";
  $("stability-meter").style.width = state.stability + "%";
  $("stability-status").textContent = state.stability >= 75 ? "HARMONIC" : state.stability >= 40 ? "UNSTEADY" : "CRITICAL";
  $("insight").textContent = String(state.insight);
  $("completed").textContent = state.completed.length + " / 3";
  $("archive-button").textContent="FIELD ARCHIVE · "+archiveSummary(state.records).count+" / "+totalRecords;
  const social=socialSummary(state);
  $("relationship-button").textContent="THE MINDS · "+social.filter(p=>p.quest==="completed").length+" / 3 INQUIRIES";
  const clock=clockSummary(state);
  $("clock-button").textContent=clock.solved?"CLOCK TOWER · "+clock.stations.length+" / 3 OBSERVATIONS":"CLOCK TOWER · "+clock.fragmentsFound+" / 3 INSCRIPTIONS";
  const gallery=reflectionSummary(state);
  $("reflection-button").textContent=gallery.available?"REFLECTION GALLERY · "+gallery.mirrorCount+" / 3":"REFLECTION GALLERY · LOCKED";
  $("reflection-status").textContent=gallery.next;
  const caseFile=witnessSummary(state);
  $("witness-button").textContent=caseFile.unlocked?"MISSING WITNESS · "+caseFile.count+" / "+caseFile.total:"MISSING WITNESS · LOCKED";
  $("witness-status").textContent=caseFile.next;
  $("relationship-status").textContent=social.filter(p=>p.quest==="ready").length
    ?"A companion has evidence to review. Return to their home in Elsewhen."
    :social.filter(p=>p.quest==="active").length
      ?"Personal inquiries underway. Seek the matching field records."
      :"Trust grows through shared research and thoughtful debate.";
  updateQuest();
  updateWristIntel();
  const team=state.squad.map(id=>thinkers.find(t=>t.id===id)?.name).filter(Boolean);
  $("squad-status").textContent=team.length?team.join(" · "):"Recruit minds to assemble your expedition squad.";
  $("squad-button").textContent="MANAGE SQUAD · "+team.length+" / 3";
  const roster = $("roster");
  roster.replaceChildren();
  for (const person of thinkers) {
    const row = document.createElement("div");
    row.className = "roster-entry" + (state.recruits.includes(person.id) ? " active" : "");
    const name = document.createElement("span");
    name.textContent = person.name;
    const status = document.createElement("small");
    status.textContent = state.recruits.includes(person.id) ? social.find(s=>s.id===person.id).trust+"/6 TRUST" : "IN TOWN";
    row.append(name, status);
    roster.append(row);
  }
}
function near(x, y, radius = 66) { return Math.hypot(state.x - x, state.y - y) < radius; }
function targetNear() {
  if(state.scene==="elsewhen"){
    if(near(485,249,34))return {kind:"tower"};
    for(const person of thinkers)if(near(person.x,person.y,65))return {kind:"person",item:person};
    for(const world of worlds)if(near(world.x,world.y,76))return {kind:"portal",item:world};
    if(galleryAvailable(state)&&near(unwrittenVisitor.x,unwrittenVisitor.y,59))return {kind:"unwrittenVisitor"};
    for(const visitor of visitors)if(near(visitor.x,visitor.y,57))return {kind:"visitor",item:visitor};
    if(near(conclave.x,conclave.y,62))return {kind:"conclave"};
    for(const landmark of landmarks)if(near(landmark.x,landmark.y,54))return {kind:"landmark",item:landmark};
  }else if(state.scene==="clockroom"){
    if(galleryAvailable(state)&&near(galleryEntrance.x,galleryEntrance.y,60))return {kind:"galleryEntrance"};
    for(const station of clockStations)if(near(station.x,station.y,63))return {kind:"clockStation",item:station};
    if(near(480,503,67))return {kind:"clockExit"};
  }else if(state.scene==="gallery"){
    if(witnessAvailable(state)&&near(witnessEntrance.x,witnessEntrance.y,51))return {kind:"witnessEntrance"};
    for(const mirror of reflectionMirrors)if(near(mirror.x,mirror.y,59))return {kind:"reflectionMirror",item:mirror};
    if(near(galleryCore.x,galleryCore.y,58))return {kind:"reflectionCore"};
    if(near(galleryExit.x,galleryExit.y,62))return {kind:"galleryExit"};
  }else if(state.scene==="witnesshall"){
    for(const person of testimony)if(near(person.x,person.y,58))return {kind:"witnessPerson",item:person};
    for(const item of evidence)if(near(item.x,item.y,56))return {kind:"witnessEvidence",item};
    if(near(witnessBoard.x,witnessBoard.y,60))return {kind:"witnessBoard"};
    if(near(witnessExit.x,witnessExit.y,59))return {kind:"witnessExit"};
  }else{
    for(const node of expeditionNodes.filter(n=>n.id!=="core")){
      if(near(node.x,node.y,node.id==="echo"?62:64))return {kind:"stage",node};
    }
    for(const record of recordsForWorld(state.scene))if(near(record.x,record.y,52))return {kind:"record",item:record};
    if(near(480,249,72))return {kind:"fracture",item:worlds.find(w=>w.id===state.scene)};
    if(near(480,498,61))return {kind:"exit"};
  }
  return null;
}
const {talkToThinker,greetVisitor,showRelationships,showConclave}=createSocialUI({
  getState:()=>state,apply,showDialog,closeDialog
});
function inspectLandmark(item) {
  const discovered=state.observed.includes(item.id);
  const after=state.completed.length?item.after:item.description;
  let next=observe(state,item.id);
  const fragment=clockFragments.find(f=>f.anchor===item.id);
  const eligible=eligibleClockFragment(next,item.id);
  if(eligible)next=recoverClockFragment(next,item.id);
  apply(next);
  showDialog(item.name,after+"\n\n"+
    (discovered?"You recognize this place.":"NEW FIELD NOTE · Insight +1")+
    (eligible&&fragment?"\n\nNEW CLOCK INSCRIPTION · "+fragment.name+
    "\n"+fragment.clue+"\n\nAdditional insight +1.":""));
}
const {manageSquad,exploreStage}=createExpeditionUI({getState:()=>state,apply,showDialog,closeDialog});
const {showClock,inspectStation}=createClockUI({getState:()=>state,apply,showDialog,closeDialog,travel});
const {talkVisitor,showGalleryStatus,examineMirror,examineQuestion}=createReflectionUI({getState:()=>state,apply,showDialog,closeDialog,travel});
const {status:showWitnessStatus,speak:speakWitness,examine:examineWitnessEvidence,board:openWitnessBoard}=createWitnessUI({getState:()=>state,apply,showDialog,closeDialog,travel});
function interact() {
  if(open)return;
  const target=targetNear();
  if(!target)return;
  if(target.kind==="witnessEntrance"){showWitnessStatus(true);return;}
  if(target.kind==="witnessPerson"){speakWitness(target.item.id);return;}
  if(target.kind==="witnessEvidence"){examineWitnessEvidence(target.item.id);return;}
  if(target.kind==="witnessBoard"){openWitnessBoard();return;}
  if(target.kind==="witnessExit"){apply(travel(state,"gallery"));return;}
  if(target.kind==="unwrittenVisitor"){talkVisitor();return;}
  if(target.kind==="galleryEntrance"){showGalleryStatus(true);return;}
  if(target.kind==="reflectionMirror"){examineMirror(target.item.id);return;}
  if(target.kind==="reflectionCore"){examineQuestion();return;}
  if(target.kind==="galleryExit"){apply(travel(state,"clockroom"));return;}
  if(target.kind==="tower"){showClock(true);return;}
  if(target.kind==="clockStation"){inspectStation(target.item);return;}
  if(target.kind==="clockExit"){apply(travel(state,"elsewhen"));return;}
  if(target.kind==="person"){talkToThinker(target.item);return;}
  if(target.kind==="visitor"){greetVisitor(target.item);return;}
  if(target.kind==="conclave"){showConclave();return;}
  if(target.kind==="landmark"){inspectLandmark(target.item);return;}
  if(target.kind==="stage"){exploreStage(target.node);return;}
  if(target.kind==="record"){exploreRecord(target.item);return;}
  if(target.kind==="portal"){
    const world=target.item;
    showDialog(world.name,world.subtitle+"\n\n"+(state.completed.includes(world.id)
      ?"The breach is quiet now. You may return and examine its echoes."
      :"A dimensional breach waits beyond the threshold."),[
      {label:"Open portal",action:()=>{apply(travel(state,world.id));closeDialog();}},
      {label:"Stay in Elsewhen",action:closeDialog}
    ]);
    return;
  }
  if(target.kind==="exit"){apply(travel(state,"elsewhen"));return;}
  if(target.kind==="fracture"){
    const world=target.item;
    if(state.completed.includes(world.id)){
      showDialog(world.name,"Your decision has already shaped this reality.\n\n"+state.log.findLast(entry=>entry.startsWith(world.name+":")));
      return;
    }
    if(!coreReady(state,world.id)){
      showDialog("Equilibrium Core · Sealed",nextObjective(state,world.id));return;
    }
    const thinker=thinkers.find(person=>person.id===world.needed);
    if(!state.recruits.includes(world.needed)){
      showDialog("A Mind Is Missing",world.description+"\n\nYou need "+thinker.name+" to interpret this fracture. Return to Elsewhen and invite them.");
      return;
    }
    const actions=world.options.map(option=>({
      label:option.label+" ("+(option.stability>=0?"+":"")+option.stability+" balance)",
      action:()=>{
        apply(resolveFracture(state,world.id,option.id));
        showDialog("Fracture Stabilized",option.result+"\n\nBalance: "+state.stability+"% · Insight: "+state.insight,[
          {label:"Return to Elsewhen",action:()=>{
            const finished=state.completed.length===worlds.length;
            apply(travel(state,"elsewhen"));
            if(finished)showDialog("The First Observation",
              "All three fractures are settled. The clock tower has begun counting backward.\n\nA message appears on your Gen.E.Wrist:\n\nNOT EVERY QUESTION HAS BEEN ASKED.");
            else closeDialog();
          }}
        ]);
      }
    }));
    actions.push({label:"Study the anomaly later",action:closeDialog});
    showDialog(world.name+" · A Decision",world.description+
      "\n\n"+thinker.name+" offers several possibilities. Each changes what remains.",actions);
  }
}
function prompt() {
  const target=targetNear();
  const message = !target ? "Explore with WASD / arrows, E to interact, G for Gen.E.Wrist." :
    target.kind === "witnessEntrance" ? "E · ENTER THE HALL OF WITNESSES" :
    target.kind === "witnessPerson" ? "E · HEAR " + target.item.name.toUpperCase() :
    target.kind === "witnessEvidence" ? "E · EXAMINE " + target.item.name.toUpperCase() :
    target.kind === "witnessBoard" ? "E · STUDY THE CONTRADICTION BOARD" :
    target.kind === "witnessExit" ? "E · RETURN TO THE REFLECTION GALLERY" :
    target.kind === "unwrittenVisitor" ? "E · SPEAK WITH ERWIN SCHRÖDINGER" :
    target.kind === "galleryEntrance" ? "E · ENTER THE REFLECTION GALLERY" :
    target.kind === "reflectionMirror" ? "E · OBSERVE " + target.item.name.toUpperCase() :
    target.kind === "reflectionCore" ? "E · CONSIDER THE UNANSWERED QUESTION" :
    target.kind === "galleryExit" ? "E · RETURN TO THE CLOCK TOWER" :
    target.kind === "tower" ? "E · EXAMINE THE CLOCK TOWER" :
    target.kind === "clockStation" ? "E · STUDY " + target.item.name.toUpperCase() :
    target.kind === "clockExit" ? "E · RETURN TO ELSEWHEN" :
    target.kind === "person" ? "E · SPEAK WITH " + target.item.name.toUpperCase() :
    target.kind === "visitor" ? "E · MEET " + target.item.name.toUpperCase() :
    target.kind === "conclave" ? "E · ENTER THE CONCLAVE" :
    target.kind === "portal" ? "E · ENTER " + target.item.name.toUpperCase() :
    target.kind === "stage" ? "E · INVESTIGATE " + target.node.label :
    target.kind === "record" ? "E · READ FIELD RECORD" :
    target.kind === "fracture" ? "E · INVESTIGATE DIMENSIONAL FRACTURE" : target.kind === "landmark" ? "E · EXPLORE " + target.item.name.toUpperCase() : "E · RETURN TO ELSEWHEN";
  if (lastPrompt !== message) { $("prompt").textContent = message; lastPrompt=message; }
}
function frame(t) {
  const dt=Math.min((t-lastFrame)/1000||0,.04);
  lastFrame=t;
  const pads=typeof navigator.getGamepads==="function"?navigator.getGamepads():[];
  const pad=Array.from(pads||[]).find(p=>p&&p.connected);
  let dx=0,dy=0;
  if(!open){
    if(keys.has("arrowleft")||keys.has("a")||keys.has("left"))dx--;
    if(keys.has("arrowright")||keys.has("d")||keys.has("right"))dx++;
    if(keys.has("arrowup")||keys.has("w")||keys.has("up"))dy--;
    if(keys.has("arrowdown")||keys.has("s")||keys.has("down"))dy++;
    if(pad){
      const deadzone=v=>Math.abs(v)<.22?0:v;
      dx+=deadzone(pad.axes[0]||0)+(pad.buttons[15]?.pressed?1:0)-(pad.buttons[14]?.pressed?1:0);
      dy+=deadzone(pad.axes[1]||0)+(pad.buttons[13]?.pressed?1:0)-(pad.buttons[12]?.pressed?1:0);
      const pressed=[0,1,3].map(i=>Boolean(pad.buttons[i]?.pressed));
      if(pressed[0]&&!padWas[0])interact();
      if(pressed[1]&&!padWas[1])showJournal();
      if(pressed[2]&&!padWas[2])cycleWrist();
      padWas=pressed;
    }else padWas=[];
    if(dx||dy)clickDestination=null;
    if(clickDestination&&!dx&&!dy){
      const d=Math.hypot(clickDestination.x-state.x,clickDestination.y-state.y);
      if(d<8)clickDestination=null;
      else{dx=(clickDestination.x-state.x)/d;dy=(clickDestination.y-state.y)/d;}
    }
    moving=Boolean(dx||dy);
    if(dx!==0)facing=dx<0?"left":"right";
    const lastX=state.x,lastY=state.y;
    const next=stepPosition(state.scene,lastX,lastY,dx,dy,205*dt);
    state.x=next.x;state.y=next.y;
    // A tap on an unreachable building must not keep the player walking forever.
    if(clickDestination&&moving&&Math.hypot(lastX-state.x,lastY-state.y)<.12)clickDestination=null;
    moving=Math.hypot(lastX-state.x,lastY-state.y)>.1;
  } else moving=false;
  const animationTime=settings.motion?2000:t;
  drawWorld(ctx,state,animationTime,{moving:settings.motion?false:moving,facing});
  prompt();
  $("atmosphere").textContent=state.stability>=80?"HARMONIC TWILIGHT":
    state.stability<40?"THE SKY IS FRACTURING":"THE HOUR BETWEEN HOURS";
  if(t-lastSave>2200){save();lastSave=t;}
  requestAnimationFrame(frame);
}
function cycleWrist() {
  const tabs=["field","paths","roster","archive"];
  showWristMode(tabs[(tabs.indexOf(wristMode)+1)%tabs.length]);
  $("wrist").scrollIntoView({behavior:settings.motion?"auto":"smooth",block:"nearest"});
  $("wrist").classList.add("highlight");
}
window.addEventListener("keydown",(event)=>{
  const key=event.key.toLowerCase();
  if(["arrowleft","arrowright","arrowup","arrowdown"," "].includes(key))event.preventDefault();
  if(key==="escape"&&open){closeDialog();return;}
  if(open)return;
  if(key==="e"&&!event.repeat)interact();
  if(key==="j"&&!event.repeat)showJournal();
  if(key==="g"&&!event.repeat)cycleWrist();
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
$("archive-button").addEventListener("click",showArchive);
$("relationship-button").addEventListener("click",showRelationships);
$("clock-button").addEventListener("click",()=>showClock(false));
$("reflection-button").addEventListener("click",()=>showGalleryStatus(false));
$("witness-button").addEventListener("click",()=>showWitnessStatus(false));
$("squad-button").addEventListener("click",manageSquad);
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
for(const button of document.querySelectorAll("[data-wrist-tab]")){
  button.addEventListener("click",()=>showWristMode(button.dataset.wristTab));
}
$("audio-toggle").addEventListener("click",()=>{
  ambient.toggle();syncSettings();
});
$("motion-toggle").addEventListener("click",()=>{
  settings.motion=!settings.motion;saveSettings();syncSettings();
});
$("contrast-toggle").addEventListener("click",()=>{
  settings.contrast=!settings.contrast;saveSettings();syncSettings();
});
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){ambient.stop();syncSettings();}
});
syncSettings();
showWristMode("field");
updateReadout();
requestAnimationFrame(frame);
if(!state.introSeen) showIntro();
