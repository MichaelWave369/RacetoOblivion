// Rung 6: a spoiler-safe clock tower mystery connected to existing world
// decisions and the three established Elsewhen landmarks.
export const clockFragments=Object.freeze([
  {id:"hours",symbol:"3",anchor:"fountain",world:"gardens",name:"Spiral Hour",
    hint:"Stabilize the Chrono Gardens, then examine the Fountain of Seasons.",
    clue:"The spiral hour is marked THREE. The current must be heard before the hour."},
  {id:"current",symbol:"6",anchor:"atelier",world:"causeway",name:"Silent Current",
    hint:"Stabilize the Glass Causeway, then examine the Atelier.",
    clue:"The silent current is marked SIX. Listen to the current first."},
  {id:"index",symbol:"9",anchor:"observatory",world:"archive",name:"Ninth Margin",
    hint:"Stabilize the Echo Archive, then examine the Observatory.",
    clue:"The ninth margin is marked NINE. The written memory comes last."}
]);
export const clockStations=Object.freeze([
  {id:"lens",x:225,y:282,name:"The Harmonic Lens",symbol:"◈",
    text:"Three colored beams cross without ever touching. The lens is tuned to the frequencies of places you have already helped.",
    note:"An inscription reads: 'Not every agreement is truth; not every disagreement is failure.'"},
  {id:"ledger",x:480,y:203,name:"The Unwritten Ledger",symbol:"◇",
    text:"A book records what the town changed after each journey. Some pages contain questions instead of answers.",
    note:"A loose page says: 'The space between events may itself be an event.'"},
  {id:"engine",x:735,y:282,name:"The Clockwork Orrery",symbol:"✦",
    text:"Nine tiny worlds circle a single empty point. One orbit keeps turning even when the mechanism is stopped.",
    note:"The clockwork has no maker's mark. The missing point is not labeled."}
]);
const glyphIds=clockFragments.map(f=>f.id);
const stationIds=clockStations.map(s=>s.id);
export const clockOrder=Object.freeze(["6","3","9"]);
const uniqueAllowed=(input,allowed)=>Array.isArray(input)?[...new Set(input.filter(x=>typeof x==="string"&&allowed.includes(x)))]:[];
export function initialClock(){return {fragments:[],dial:[],solved:false,stations:[]};}
export function validateClock(raw){
  const base=initialClock();
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return base;
  const fragments=uniqueAllowed(raw.fragments,glyphIds);
  const solved=raw.solved===true&&glyphIds.every(id=>fragments.includes(id));
  const dial=Array.isArray(raw.dial)?raw.dial.filter(x=>typeof x==="string").slice(0,3):[];
  const prefix=dial.every((x,i)=>x===clockOrder[i]);
  const savedDial=prefix?dial:[];
  return {
    fragments,
    dial:solved?[...clockOrder]:savedDial,
    solved,
    stations:solved?uniqueAllowed(raw.stations,stationIds):[]
  };
}
export function eligibleClockFragment(state,anchorId){
  const fragment=clockFragments.find(f=>f.anchor===anchorId);
  return Boolean(fragment&&state.scene==="elsewhen"
    &&state.completed?.includes(fragment.world)
    &&state.observed?.includes(fragment.anchor)
    &&!validateClock(state.clock).fragments.includes(fragment.id));
}
export function recoverClockFragment(state,anchorId){
  const fragment=clockFragments.find(f=>f.anchor===anchorId);
  if(!eligibleClockFragment(state,anchorId))return state;
  const clock=validateClock(state.clock);
  return {
    ...state,
    clock:{...clock,fragments:[...clock.fragments,fragment.id]},
    insight:state.insight+1,
    log:[...state.log,"Clock inscription recovered: "+fragment.name+"."].slice(-50)
  };
}
export function clockReady(state){
  const {fragments,solved}=validateClock(state.clock);
  return !solved&&glyphIds.every(id=>fragments.includes(id));
}
export function enterClockGlyph(state,symbol){
  if(state.scene!=="elsewhen"||!clockReady(state)||!clockOrder.includes(symbol))return state;
  const clock=validateClock(state.clock);
  const correct=symbol===clockOrder[clock.dial.length];
  if(!correct){
    return {...state,clock:{...clock,dial:[]},
      log:[...state.log,"The tower's three glyphs fade and reset."].slice(-50)};
  }
  const dial=[...clock.dial,symbol],solved=dial.length===clockOrder.length;
  return {
    ...state,
    clock:{...clock,dial,solved},
    insight:state.insight+(solved?3:0),
    log:[...state.log,solved?
      "The clock tower opened between two seconds. An observation room awaits.":
      "The tower recognizes glyph "+symbol+"."].slice(-50)
  };
}
export function observeClockStation(state,stationId){
  const station=clockStations.find(s=>s.id===stationId);
  const clock=validateClock(state.clock);
  if(!station||state.scene!=="clockroom"||!clock.solved||clock.stations.includes(stationId))return state;
  const stations=[...clock.stations,stationId];
  const complete=stations.length===clockStations.length;
  return {
    ...state,
    clock:{...clock,stations},
    insight:state.insight+(complete?3:1),
    log:[...state.log,complete?
      "The tower's three instruments agree: an unwritten hour has been observed.":
      "Clock tower observation: "+station.name+"."].slice(-50)
  };
}
export function clockSummary(state){
  const clock=validateClock(state.clock);
  const remaining=clockFragments.filter(f=>!clock.fragments.includes(f.id));
  return {
    ...clock,
    fragmentsFound:clock.fragments.length,
    allFragments:clockReady(state),
    roomComplete:clock.stations.length===clockStations.length,
    remaining,
    next:clock.solved?
      clock.stations.length===clockStations.length
        ?"The clock's instruments agree. This chapter's inquiry is complete, though a deeper mystery remains."
        :"Enter the clock tower and examine its three instruments."
      :remaining.length?
        "Three inscriptions must be traced in the town. "+remaining.map(f=>f.hint).join(" "):
        "All inscriptions recovered. Approach the clock tower just above the town square and align its glyphs."
  };
}
