import {crossingPaths,crossingEndings,crossingSummary,observeCrossingPath,
  selectCrossingPath,reachFarShore,concludeCrossing} from "./crossing-rules.js";

export function createCrossingUI({getState,apply,showDialog,closeDialog,travel}){
  function dossier(atEntrance=false){
    const state=getState(),s=crossingSummary(state);
    const list=crossingPaths.map(p=>(s.observed.includes(p.id)?"✓ ":"◇ ")+p.name+
      (s.observed.includes(p.id)?" · "+p.interpretation:" · not yet observed")).join("\n\n");
    const actions=[];
    if(atEntrance&&state.scene==="atlas"&&s.available){
      actions.push({label:"Travel to the Wayfarer's Crossing",action:()=>{
        apply(travel(getState(),"crossing"));
        showDialog("The Wayfarer's Crossing",
          "Three bridges span an impossible channel. Only one can be opened.\n\n"+
          "Examine all three markers on the near bank, then choose a route at the Route Table. "+
          "Walk across its real bridge to reach the Far Shore.",
          [{label:"Begin exploring",action:closeDialog}]);
      }});
    }
    actions.push({label:"Close",action:closeDialog});
    showDialog("Gen.E.Wrist · Wayfarer's Crossing",
      s.next+"\n\nObservations "+s.count+"/3 · Chosen bridge: "+
      (crossingPaths.find(p=>p.id===s.chosen)?.name||"not yet selected")+
      "\n\n"+list+"\n\n"+
      (s.complete?"Decision recorded: "+crossingEndings.find(e=>e.id===s.ending).text:"Your original Atlas discoveries remain intact."),
      actions);
  }
  function inspect(pathId){
    const state=getState(),path=crossingPaths.find(p=>p.id===pathId);
    if(!path||state.scene!=="crossing")return;
    const already=crossingSummary(state).observed.includes(pathId);
    if(!already)apply(observeCrossingPath(state,pathId));
    showDialog(path.name,path.observation+"\n\n"+path.interpretation+
      (already?"\n\nThis signal is already in the field notebook.":"\n\nNEW OBSERVATION · Insight +1"),
      [{label:"Review the three routes",action:()=>dossier()},
        {label:"Keep exploring",action:closeDialog}]);
  }
  function table(){
    const state=getState(),s=crossingSummary(state);
    if(state.scene!=="crossing")return;
    if(s.complete){
      const result=crossingEndings.find(e=>e.id===s.ending);
      showDialog("A Passage Recorded",result.text,[
        {label:"Review field notes",action:()=>dossier()},
        {label:"Keep exploring",action:closeDialog}
      ]);
      return;
    }
    if(s.count<3){dossier();return;}
    if(s.chosen){
      showDialog("Wayfarer's Route Table",
        s.arrived?"The far bank is reached. Make your final decision at the northern marker.":
          "Your chosen bridge is open. Walk to "+crossingPaths.find(p=>p.id===s.chosen).name+
          " and cross the water channel. The other two paths remain closed.",
        [{label:"Review map",action:()=>dossier()},{label:"Continue exploring",action:closeDialog}]);return;
    }
    const actions=crossingPaths.map(p=>({
      label:"Open "+p.name,
      action:()=>{
        const next=selectCrossingPath(getState(),p.id);apply(next);
        showDialog(p.name+" · Open",
          "The bridge takes shape across the channel. The other routes fade into the water.\n\n"+
          p.interpretation+
          "\n\nYour route is now chosen. Walk across the bridge and reach the Far Shore.",
          [{label:"Cross the channel",action:closeDialog}]);
      }
    }));
    actions.push({label:"Not yet",action:closeDialog});
    showDialog("Choose One Bridge",
      "All three signals have been recorded. One route will become physically walkable. "+
      "The others remain sealed on this save.\n\n"+
      crossingPaths.map(p=>p.name+": "+p.interpretation).join("\n\n"),
      actions);
  }
  function farShore(){
    let state=getState();
    if(state.scene!=="crossing")return;
    const before=crossingSummary(state);
    if(!before.chosen){dossier();return;}
    if(!before.arrived){apply(reachFarShore(state));state=getState();}
    const s=crossingSummary(state);
    if(!s.arrived){
      showDialog("The Far Shore","You must cross the channel using your open bridge before the shore can be recorded.");return;
    }
    if(s.complete){table();return;}
    const actions=crossingEndings.map(e=>({
      label:e.label,
      action:()=>{
        apply(concludeCrossing(getState(),e.id));
        showDialog("The Wayfarer's Crossing · Recorded",
          e.text+"\n\nThe crossing is now part of Elsewhen's chart.\n\n"+
          "Insight +"+e.insight+" · Equilibrium +"+e.stability,[
          {label:"Review chart",action:()=>dossier()},
          {label:"Continue exploring",action:closeDialog}
        ]);
      }
    }));
    actions.push({label:"Return later",action:closeDialog});
    showDialog("The Far Shore · A Decision",
      (before.arrived?"You recognize the far shore.":"You reached the far shore. Insight +2.")+
      "\n\nOne path was chosen, but its purpose is still undecided. How should Elsewhen use the newly opened passage?",
      actions);
  }
  return {dossier,inspect,table,farShore};
}
