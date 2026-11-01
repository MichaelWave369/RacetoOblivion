// Six optional, spoiler-safe field records. A record is collectible once and
// remains readable in the Gen.E.Wrist archive after leaving its world.
export const fieldRecords = Object.freeze([
  {
    id:"garden-first",world:"gardens",x:106,y:243,title:"Seed Without a Season",
    text:"A seed bearing rings from three different centuries was found beneath an ordinary tree. None of the rings contained the year in which it was planted.",
    note:"The margins contain a warning: a corrected timeline still remembers what was lost."
  },
  {
    id:"garden-last",world:"gardens",x:854,y:227,title:"The Orchard Keeper's Ledger",
    text:"A handwritten ledger lists harvests that occurred before the orchard existed. The keeper marked each contradiction with a tiny star.",
    note:"A final entry asks who gets to decide which memories deserve to survive."
  },
  {
    id:"causeway-first",world:"causeway",x:106,y:243,title:"Conductor's Diagram",
    text:"The coils are drawn as if they were an instrument, each tuned to a separate temporal frequency. The final circuit is deliberately unfinished.",
    note:"One handwritten annotation reads: 'Never mistake the current for the destination.'"
  },
  {
    id:"causeway-last",world:"causeway",x:854,y:227,title:"The Sixth Bridge",
    text:"Five bridges have matching construction records. The sixth appears only in eyewitness accounts, all of which disagree about its direction.",
    note:"The witness sketches form a perfect hexagon when laid over one another."
  },
  {
    id:"archive-first",world:"archive",x:106,y:243,title:"Unwritten Catalogue",
    text:"A library index assigns numbers to books no one has written. One entry contains only the instruction: 'Confirm the observer.'",
    note:"The indexer's name has been crossed out, yet the ink remains wet."
  },
  {
    id:"archive-last",world:"archive",x:854,y:227,title:"The Missing Equation",
    text:"A proof ends with an empty line. There is enough mathematics to show that something should be there, but not enough to determine what.",
    note:"The missing line is indexed under the heading 'Unasked Questions.'"
  }
]);
const recordIds=new Set(fieldRecords.map(record=>record.id));
export const totalRecords=fieldRecords.length;
export function validateRecords(raw){
  return Array.isArray(raw) ? [...new Set(raw.filter(id=>typeof id==="string"&&recordIds.has(id)))]:[];
}
export function recordsForWorld(worldId){
  return fieldRecords.filter(record=>record.world===worldId);
}
export function collectRecord(state,recordId){
  const record=fieldRecords.find(r=>r.id===recordId);
  if(!record || state.scene!==record.world || state.records?.includes(recordId))return state;
  return {
    ...state,
    records:[...validateRecords(state.records),recordId],
    insight:state.insight+1,
    log:[...state.log,"Field record recovered: "+record.title+"."].slice(-50)
  };
}
export function archiveSummary(records){
  const collected=validateRecords(records);
  const lines=fieldRecords.filter(r=>collected.includes(r.id));
  return {
    count:collected.length,
    complete:collected.length===totalRecords,
    lines
  };
}
