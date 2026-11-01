import { thinkers, worlds } from "./content.js";
import { expeditions } from "./expeditions.js";
import { toggleSquadMember, expeditionProgress, surveySite, solveMechanism, availableMoves, recoverFocus } from "./expedition-rules.js";
import { laneNames, tacticalView, tacticalStrike, tacticalShift } from "./echo-tactics.js";

// UI adapter: this module owns no state. It asks main.js for the current state
// on every interaction, so actions never operate on stale save snapshots.
export function createExpeditionUI({getState,apply,showDialog,closeDialog}){
  function manageSquad(){
    const state=getState();
    const roster=thinkers.filter(person=>state.recruits.includes(person.id));
    const names=state.squad.map(id=>thinkers.find(t=>t.id===id)?.name).filter(Boolean);
    const actions=roster.map(person=>({
      label:(state.squad.includes(person.id)?"Remove ":"Add ")+person.name,
      action:()=>{
        const previous=getState();
        const changed=toggleSquadMember(previous,person.id);
        if(changed===previous){
          showDialog("Squad Full","The squad has three active minds. Remove one before adding another.",[
            {label:"Manage team",action:manageSquad}]);return;
        }
        apply(changed);manageSquad();
      }
    }));
    actions.push({label:"Ready to explore",action:closeDialog});
    showDialog("Expedition Squad · 3 Slots",
      "Active minds: "+(names.length?names.join(", "):"none")+
      "\n\nA specialist must join the active squad to solve their world's mechanism. Mixed teams can perform coordinated actions.",
      actions);
  }
  function exploreStage(node){
    const state=getState(),id=state.scene,data=expeditions[id],p=expeditionProgress(state,id);
    if(!data)return;
    if(state.completed.includes(id)){
      showDialog(data.enemy,"This reality has already been harmonized. Its consequences remain.");
      return;
    }
    if(node.id==="survey"){
      if(p.survey){showDialog("Field Survey",data.clue);return;}
      showDialog("Field Survey · "+data.subtitle,data.survey,[
        {label:"Record the observation",action:()=>{
          apply(surveySite(getState(),id));
          showDialog("Survey Complete",data.clue+"\n\nInsight gained: +1");
        }},
        {label:"Continue exploring",action:closeDialog}
      ]);
      return;
    }
    if(node.id==="mechanism"){
      if(!p.survey){showDialog(data.mechanism,"Investigate the field survey station first. The mechanism has no reliable reference.");return;}
      if(p.mechanism){showDialog(data.mechanism,"The mechanism is calibrated. Proceed toward the Paradox Echo.");return;}
      const specialist=thinkers.find(t=>t.id===worlds.find(w=>w.id===id).needed);
      if(!state.squad.includes(specialist.id)){
        showDialog(data.mechanism,
          data.mechanismText+"\n\n"+specialist.name+" must be in the active squad. Choose them in the Gen.E.Wrist squad panel.",[
            {label:"Manage squad",action:manageSquad},{label:"Back",action:closeDialog}
          ]);return;
      }
      const actions=data.solutions
        .filter(option=>option.requires.every(member=>state.squad.includes(member)))
        .map(option=>({
          label:option.label,
          action:()=>{
            apply(solveMechanism(getState(),id,option.id));
            const now=getState(),done=expeditionProgress(now,id).mechanism;
            showDialog(done?"Mechanism Calibrated":"Unstable Attempt",
              option.result+"\n\nBalance: "+now.stability+"%",[
                {label:done?"Continue expedition":"Try another approach",action:done?closeDialog:()=>exploreStage(node)},
                {label:"Review squad",action:manageSquad}
              ]);
          }
        }));
      actions.push({label:"Consider the evidence",action:closeDialog});
      showDialog(data.mechanism,
        data.mechanismText+"\n\n"+data.clue+"\n\nActive squad: "+
        state.squad.map(id=>thinkers.find(t=>t.id===id)?.name).join(", "),actions);
      return;
    }
    if(node.id==="echo"){
      if(!p.survey){showDialog(data.enemy,"Survey the anomaly before confronting its echo.");return;}
      if(!p.mechanism){showDialog(data.enemy,data.missing);return;}
      if(p.echo){showDialog(data.enemy,data.victory);return;}
      showEncounter();
    }
  }
  function showEncounter(){
    const state=getState(),id=state.scene,data=expeditions[id],p=expeditionProgress(state,id);
    if(!data)return;
    if(p.echo){showDialog("Echo Quieted",data.victory);return;}
    const view=tacticalView(state,id);
    const laneDisplay=laneNames.map((lane,i)=>{
      const position=i===view.lane?"◆ TEAM":"· EMPTY";
      return lane.padEnd(8," ")+" "+position+(i===view.threat?"  ⚠ INCOMING":"");
    }).join("\n");
    const actions=availableMoves(state,id).filter(move=>view.focus>=move.cost).map(move=>({
      label:move.label+" · "+move.cost+" focus / "+move.damage+" power",
      action:()=>{
        const before=getState();
        apply(tacticalStrike(before,id,move.id));
        const current=getState(),updated=expeditionProgress(current,id);
        if(before===current){showEncounter();return;}
        if(updated.echo){
          showDialog(data.enemy+" · Quieted",data.victory+"\n\nThe core is now accessible.",[
            {label:"Continue",action:closeDialog}
          ]);
        }else{
          showDialog(move.label+" · Echo "+updated.echoHealth+" HP",
            "The echo recoils.\n\n"+current.log.slice(-1)[0]+
            "\n\nFocus: "+updated.focus+" / 4 · Balance: "+current.stability+"%",[
              {label:"Next tactical turn",action:showEncounter},
              {label:"Retreat",action:closeDialog}
            ]);
        }
      }
    }));
    if(view.lane>0)actions.push({
      label:"Sidestep LEFT · +1 focus",
      action:()=>{apply(tacticalShift(getState(),id,-1));showEncounter();}
    });
    if(view.lane<2)actions.push({
      label:"Sidestep RIGHT · +1 focus",
      action:()=>{apply(tacticalShift(getState(),id,1));showEncounter();}
    });
    if(p.focus<4)actions.push({label:"Regroup · +2 focus / −1 balance",action:()=>{
      apply(recoverFocus(getState(),id));
      showEncounter();
    }});
    actions.push({label:"Retreat",action:closeDialog});
    showDialog(data.enemy+" · "+view.health+" HP",
      data.enemyText+"\n\nROUND "+view.round+" · FOCUS "+view.focus+"/4"+
      "\n\n"+laneDisplay+
      "\n\nThe echo telegraphs its next strike. Sidestep to a safer lane, then launch your strongest coordinated attack. An unfinished attack costs equilibrium; taking a telegraphed hit costs more.",
      actions);
  }
  return {manageSquad,exploreStage};
}
