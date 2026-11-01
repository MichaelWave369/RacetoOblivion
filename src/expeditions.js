// Public-facing Rung 3 expedition content.
// The shared coordinates match the original 960×560 Canvas world.
// Keep later story revelations out of public gameplay and source data.
export const expeditionNodes = Object.freeze([
  { id:"survey", x:205, y:310, label:"FIELD SURVEY", symbol:"⌕" },
  { id:"mechanism", x:755, y:310, label:"THE MECHANISM", symbol:"⚙" },
  { id:"echo", x:480, y:398, label:"PARADOX ECHO", symbol:"◇" },
  { id:"core", x:480, y:249, label:"EQUILIBRIUM CORE", symbol:"✧" }
]);

export const expeditions = {
  gardens: {
    subtitle:"Three versions of one forest compete for the same spring.",
    survey:"An ancient tree has rings that run backward. Seedlings grow toward shadows of trees that have not yet sprouted.",
    clue:"Field note: the newest roots point toward the oldest ring. Preserving causality requires keeping an observable reference.",
    mechanism:"The Chronology Loom",
    mechanismText:"An apparatus threads yesterday, today and tomorrow through one living root. How should the team prevent the strands from strangling each other?",
    solutions:[
      {id:"solo",label:"Anchor the oldest observable ring",requires:["einstein"],correct:true,stability:2,insight:1,
        result:"Einstein fixes one measurable reference. The seasons stop devouring each other, though the loom still hums with possibilities."},
      {id:"synergy",label:"Encode the anchor as a repeating sequence",requires:["einstein","lovelace"],correct:true,stability:5,insight:2,
        result:"Einstein's anchor and Lovelace's sequence agree. Three seasons can now grow together without consuming their origins."},
      {id:"unsafe",label:"Remove the oldest ring and hope for the best",requires:[],correct:false,stability:-4,insight:0,
        result:"The loom loses its reference and buckles. The team must study the remaining rings before trying again."}
    ],
    enemy:"The Rootbound Echo",
    enemyText:"A creature assembled from three incompatible moments lashes out through its own past. The team needs a controlled sequence of abilities to quiet it.",
    victory:"The Rootbound Echo unravels into harmless seeds. The way to the equilibrium core is open.",
    missing:"The forest refuses to settle until its ancient root has been measured."
  },
  causeway: {
    subtitle:"Electrical storms jump between six impossible bridges.",
    survey:"Six conductor pylons flicker out of phase. One displays a surge before the charge that causes it.",
    clue:"Field note: the safest route is the one that distributes energy without creating a closed feedback loop.",
    mechanism:"The Sixfold Array",
    mechanismText:"The Glass Causeway is forming a destructive loop. How can its six pylons be synchronized without overcharging the bridge?",
    solutions:[
      {id:"solo",label:"Ground the feedback through insulated anchors",requires:["tesla"],correct:true,stability:2,insight:1,
        result:"Tesla diverts the surge into grounded anchors. The bridge stabilizes just long enough to cross."},
      {id:"synergy",label:"Map the six phases, then ground each pulse",requires:["tesla","lovelace"],correct:true,stability:5,insight:2,
        result:"Lovelace maps the phase sequence and Tesla grounds every pulse. The once-chaotic bridges become a careful circuit."},
      {id:"unsafe",label:"Reverse all six pylons simultaneously",requires:[],correct:false,stability:-4,insight:0,
        result:"The feedback doubles before the pylons can settle. Sparks scatter across the void."}
    ],
    enemy:"The Storm Duplicate",
    enemyText:"A crackling copy of the squad appears on the bridge, repeating attacks a fraction of a second before they happen.",
    victory:"The Storm Duplicate disperses in a blue aurora. The way to the equilibrium core is open.",
    missing:"The bridge is too unstable to challenge its echo before calibrating the pylons."
  },
  archive: {
    subtitle:"Books from histories that never happened rewrite themselves.",
    survey:"A catalogue contains tomorrow's entries beside yesterday's losses. Every shelf contradicts the shelf facing it.",
    clue:"Field note: a stable catalogue needs an immutable index and a method to separate conflicting records.",
    mechanism:"The Recursive Index",
    mechanismText:"The archive cannot tell its own records from possible futures. What allows the system to distinguish history from speculation?",
    solutions:[
      {id:"solo",label:"Restore a read-only index of observed records",requires:["lovelace"],correct:true,stability:2,insight:1,
        result:"Lovelace restores the index, making the most reliable histories readable again."},
      {id:"synergy",label:"Timestamp observed records against a fixed frame",requires:["lovelace","einstein"],correct:true,stability:5,insight:2,
        result:"Lovelace's immutable index and Einstein's frame separate evidence from possibility without destroying either."},
      {id:"unsafe",label:"Delete all conflicting pages immediately",requires:[],correct:false,stability:-4,insight:0,
        result:"The archive tries to erase its own index. A thousand pages go blank, and the contradiction returns."}
    ],
    enemy:"The Unwritten Witness",
    enemyText:"A witness made from abandoned manuscripts repeats every sentence it has never said. Its contradictions threaten to overwhelm the expedition.",
    victory:"The Unwritten Witness lays down its borrowed words and fades into quiet pages.",
    missing:"The catalogue must be indexed before its contradictions can be confronted."
  }
};

export const encounterMoves={
  einstein:{label:"Relativity Shift",damage:3,cost:1,description:"Curve the echo's trajectory into a stable orbit."},
  tesla:{label:"Resonance Discharge",damage:3,cost:1,description:"Pulse the echo with a controlled electrical field."},
  lovelace:{label:"Logic Reversal",damage:3,cost:1,description:"Interrupt the echo's repeating pattern."},
  synergy:{label:"Coordinated 3·6·9",damage:5,cost:2,description:"Combine two minds in one synchronized move."}
};
export function requiredPartner(worldId){
  return ({gardens:"lovelace",causeway:"lovelace",archive:"einstein"})[worldId] || null;
}
