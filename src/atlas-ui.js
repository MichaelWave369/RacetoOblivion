import {mapmaker,atlasBeacons,atlasRoute,atlasEndings,atlasSummary,
  meetMapmaker,scanBeacon,plotStep,finishAtlas} from "./atlas-rules.js";

// Uses the main game's single state/save pipeline. No background tasks.
export function createAtlasUI({getState,apply,showDialog,closeDialog,travel}){
  function showMapmaker(){
    const before=getState(),wasMet=atlasSummary(before).met;
    if(!wasMet)apply(meetMapmaker(before));
    const result=atlasSummary(getState());
    showDialog(mapmaker.name,wasMet?mapmaker.after:mapmaker.greeting+
      "\n\nNew acquaintance · Insight +1",[
      {label:"Ask about her changing roads",action:()=>{
        showDialog("An Impossible Road",
          "Mera unfolds a map in which three beacons disagree about the order of events.\n\n"+
          result.next+"\n\nThe path can only be charted once the observations are recorded.",
          [{label:"Continue",action:showMapmaker},{label:"Leave",action:closeDialog}]);
      }},
      {label:"Return to town",action:closeDialog}
    ]);
  }
  function dossier(atEntrance=false){
    const a=atlasSummary(getState()),state=getState();
    const lines=atlasBeacons.map(b=>
      (a.scanned.includes(b.id)?"✓ ":"◇ ")+b.name+
      (a.scanned.includes(b.id)?" · "+b.clue:" · awaiting survey")).join("\n\n");
    const actions=[];
    if(atEntrance&&state.scene==="witnesshall"&&a.available){
      actions.push({label:"Enter the Living Atlas",action:()=>{
        apply(travel(getState(),"atlas"));
        showDialog("The Cartographer's Paradox",
          "Three beacons are scattered across an unfinished map. Their readings disagree until their route is assembled in the order they describe.\n\n"+
          "Explore all three stations, then return to the Route Table.",
          [{label:"Begin surveying",action:closeDialog}]);
      }});
    }
    actions.push({label:"Close dossier",action:closeDialog});
    showDialog("Gen.E.Wrist · Living Atlas",
      a.next+"\n\nStations surveyed: "+a.scannedCount+"/3"+
      "\nRoute: "+(a.route.length?a.route.map(id=>id.toUpperCase()).join(" → "):"not charted")+
      "\n\n"+lines+
      (a.complete?"\n\nRecorded decision: "+atlasEndings.find(e=>e.id===a.ending).result:""),
      actions);
  }
  function inspectBeacon(id){
    const b=atlasBeacons.find(x=>x.id===id),state=getState();
    if(!b||state.scene!=="atlas")return;
    const already=atlasSummary(state).scanned.includes(id);
    if(!already)apply(scanBeacon(state,id));
    showDialog(b.name,b.observation+"\n\n"+b.clue+
      (already?"\n\nObservation already recorded.":"\n\nNEW SURVEY · Insight +1"),
      [{label:"Review Atlas",action:()=>dossier()},{label:"Keep exploring",action:closeDialog}]);
  }
  function chart(){
    const a=atlasSummary(getState());
    if(getState().scene!=="atlas")return;
    if(a.complete){
      showDialog("The Living Atlas · Recorded",
        atlasEndings.find(e=>e.id===a.ending).result+
        "\n\nEvery observation remains available in the Gen.E.Wrist.",
        [{label:"Review Atlas",action:()=>dossier()},{label:"Keep exploring",action:closeDialog}]);return;
    }
    if(a.scannedCount<3){dossier();return;}
    if(a.charted){
      showDialog("The Route Table · Final Chart",
        "The path is measured. Now decide how Elsewhen should publish its shifting roads.",
        [...atlasEndings.map(e=>({label:e.label,action:()=>{
          apply(finishAtlas(getState(),e.id));
          showDialog("The Cartographer's Paradox · Resolved",
            e.result+"\n\nInsight +"+e.insight+" · Equilibrium +"+e.balance,
            [{label:"Review Atlas",action:()=>dossier()},
             {label:"Return to map",action:closeDialog}]);
        }})),{label:"Decide later",action:closeDialog}]);return;
    }
    const choices=atlasBeacons.map(b=>({
      label:"Connect "+b.name,
      action:()=>{
        const before=getState(),after=plotStep(before,b.id);
        apply(after);
        const next=atlasSummary(after);
        const advanced=next.route.length>a.route.length;
        showDialog(advanced?"Route Segment Aligned":"Route Contradiction",
          advanced?
            "The chart accepts "+b.name+". "+next.route.length+"/3 route segments are connected."+
            (next.charted?"\n\nThe full route is ready to publish.":""):
            "That connection contradicts the observed order. The path resets, but your surveys remain intact."+
            "\n\nUnique wrong connections cost 1 equilibrium at most once.",
          [{label:"Return to Route Table",action:chart},
           {label:"Explore more",action:closeDialog}]);
      }
    }));
    choices.push({label:"Study survey notes",action:()=>dossier()});
    choices.push({label:"Step away",action:closeDialog});
    showDialog("The Route Table · "+a.route.length+"/3 Segments",
      "Three observations establish an order. Connect the beacons from first to last.\n\n"+
      atlasBeacons.map(b=>b.name+": "+b.clue).join("\n\n")+
      "\n\nConnected: "+(a.route.length?a.route.map(id=>id.toUpperCase()).join(" → "):"none"),
      choices);
  }
  return {showMapmaker,dossier,inspectBeacon,chart};
}
