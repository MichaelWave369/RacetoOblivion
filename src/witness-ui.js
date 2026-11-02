import {testimony,evidence,caseOptions,verdictOptions,witnessSummary,
  interviewWitness,inspectEvidence,testHypothesis,recordVerdict} from "./witness-rules.js";

// The field state is owned by the game's original save pipeline. Reopen
// actions always get a fresh state snapshot rather than capturing old data.
export function createWitnessUI({getState,apply,showDialog,closeDialog,travel}){
  function status(atEntrance=false){
    const state=getState(),summary=witnessSummary(state);
    const lines=[
      ...testimony.map(w=>(summary.heard.includes(w.id)?"✓ ":"◇ ")+w.name),
      ...evidence.map(e=>(summary.evidence.includes(e.id)?"✓ ":"◇ ")+e.name)
    ].join("\n");
    const actions=[];
    if(atEntrance&&summary.unlocked&&state.scene==="gallery")actions.push({
      label:"Enter the Hall of Witnesses",
      action:()=>{
        apply(travel(getState(),"witnesshall"));
        showDialog("The Hall of Witnesses","Three people remember an impossible event differently. "+
          "Two physical traces may help reconcile their testimony.\n\n"+
          "Hear all three accounts, inspect both traces, and compare the evidence on the Contradiction Board.",
          [{label:"Begin investigating",action:closeDialog}]);
      }
    });
    actions.push({label:"Continue exploring",action:closeDialog});
    showDialog("Gen.E.Wrist · Missing Witness Case",
      summary.next+"\n\nEvidence collected: "+summary.count+"/"+summary.total+"\n\n"+lines+
      (summary.complete?"\n\nRecorded outcome: "+verdictOptions.find(v=>v.id===summary.verdict).text:""),
      actions);
  }
  function speak(id){
    const state=getState(),person=testimony.find(x=>x.id===id);
    if(!person||state.scene!=="witnesshall")return;
    const heard=witnessSummary(state).heard.includes(id);
    if(!heard)apply(interviewWitness(state,id));
    showDialog(person.name,
      heard?person.followup:person.statement+"\n\nTESTIMONY RECORDED · Insight +1",
      [{label:"Review case file",action:()=>status()},{label:"Continue exploring",action:closeDialog}]);
  }
  function examine(id){
    const state=getState(),item=evidence.find(x=>x.id===id);
    if(!item||state.scene!=="witnesshall")return;
    const recorded=witnessSummary(state).evidence.includes(id);
    if(!recorded)apply(inspectEvidence(state,id));
    showDialog(item.name,item.statement+
      (recorded?"\n\nThe evidence has already been catalogued.":"\n\nNEW EVIDENCE · Insight +1"),
      [{label:"Review case file",action:()=>status()},{label:"Continue exploring",action:closeDialog}]);
  }
  function board(){
    const state=getState(),summary=witnessSummary(state);
    if(state.scene!=="witnesshall")return;
    if(summary.complete){
      const ending=verdictOptions.find(v=>v.id===summary.verdict);
      showDialog("Case Closed · The Missing Witness",ending.text+
        "\n\nEvery interview and physical trace remains preserved in your case file.",
        [{label:"Review case file",action:()=>status()},{label:"Continue exploring",action:closeDialog}]);
      return;
    }
    if(summary.canDecide){
      const actions=verdictOptions.map(v=>({label:v.label,action:()=>{
        apply(recordVerdict(getState(),v.id));
        showDialog("A Case Without an Accused",v.text+
          "\n\nThe witnesses thank Michael for listening before choosing.\n\nInsight +"+v.insight+
          " · Equilibrium +"+v.stability,[
            {label:"Review case file",action:()=>status()},
            {label:"Return to investigation",action:closeDialog}
          ]);
      }}));
      actions.push({label:"Consider the decision later",action:closeDialog});
      showDialog("The Contradiction Board · Final Record",
        "The observations reconcile when each is assigned its own time reference. "+
        "What should Elsewhen preserve from this discovery?",actions);
      return;
    }
    if(!summary.canDeduce){status();return;}
    const available=caseOptions.filter(option=>!summary.rejected.includes(option.id));
    const actions=available.map(option=>({label:option.label,action:()=>{
      const before=getState(),after=testHypothesis(before,option.id);
      if(after===before){board();return;}
      apply(after);
      showDialog(option.correct?"Deduction Confirmed":"Unproven Hypothesis",
        option.text+"\n\n"+
        (option.correct?"Insight +2 · The final record can now be written.":
          "Equilibrium −2 · That unsupported explanation cannot be tried again."),
        [{label:"Return to the board",action:board},{label:"Continue exploring",action:closeDialog}]);
    }}));
    actions.push({label:"Study the evidence again",action:()=>status()});
    showDialog("The Contradiction Board · Compare Testimony",
      "All five observations have been recorded. The witnesses report different orders of the same sounds and movements.\n\n"+
      "Which hypothesis fits the physical traces *without declaring any witness dishonest*?",
      actions);
  }
  return {status,speak,examine,board};
}
