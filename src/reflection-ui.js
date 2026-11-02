import { unwrittenVisitor, reflectionMirrors, reflectionConclusions, galleryCore,
  reflectionSummary, meetUnwrittenVisitor, chooseReflection, concludeReflection } from "./reflection-rules.js";

// Interaction controller with no separate save state. All results go through
// the game's existing update function and local save migration.
export function createReflectionUI({getState,apply,showDialog,closeDialog,travel}){
  function talkVisitor(){
    const state=getState();
    const wasMet=reflectionSummary(state).met;
    if(!wasMet)apply(meetUnwrittenVisitor(state));
    const result=reflectionSummary(getState());
    const actions=[
      {label:"Ask about the wooden case",action:()=>{
        showDialog("A Case Without a Label",
          "Schrödinger sets the wooden box gently onto the pavement. Its contents are never visible.\n\n"+
          "\"I do not need the box to contain anything for it to make me ask a question,\" he says. "+
          "\"That may be the most annoying part of this experiment.\"",
          [{label:"Ask another question",action:talkVisitor},
           {label:"Return to town",action:closeDialog}]);
      }},
      {label:"Ask about the Reflection Gallery",action:()=>{
        showDialog("Erwin Schrödinger · An Unfinished Experiment",
          result.complete?unwrittenVisitor.after:
            "Beyond the clock tower is a room that seems to show incompatible accounts of the same place. "+
            "I'm not convinced we should discard an account just because it makes our answer less comfortable.",
          [{label:"Return to conversation",action:talkVisitor},
           {label:"Return to town",action:closeDialog}]);
      }},
      {label:"Leave him to his research",action:closeDialog}
    ];
    showDialog("Erwin Schrödinger · The Unwritten Visitor",
      (wasMet?unwrittenVisitor.followup:unwrittenVisitor.introduction)+
      (result.complete?"\n\n"+unwrittenVisitor.after:"")+
      (wasMet?"":"\n\nNew acquaintance · Insight +1"),actions);
  }
  function showGalleryStatus(atEntrance=false){
    const state=getState(),summary=reflectionSummary(state);
    const status=reflectionMirrors.map(m=>
      (summary.mirrors[m.id]?"✓ ":"◇ ")+m.name+
      (summary.mirrors[m.id]?" · observed":" · unobserved")
    ).join("\n");
    const actions=[];
    if(summary.available&&atEntrance&&state.scene==="clockroom")actions.push({
      label:"Enter the Reflection Gallery",
      action:()=>{
        apply(travel(getState(),"gallery"));
        showDialog("The Reflection Gallery",
          "Three mirrors hold contradictory memories of places you have explored. "+
          "Your choices will determine how the gallery preserves their evidence.\n\n"+
          "Examine the mirrors, then approach the Unanswered Question.",
          [{label:"Begin exploring",action:closeDialog}]);
      }
    });
    actions.push({label:"Continue exploring",action:closeDialog});
    showDialog("Gen.E.Wrist · Reflection Gallery",
      summary.next+"\n\nMirrors: "+summary.mirrorCount+"/3\n\n"+status+
      (summary.complete?"\n\nConclusion: "+reflectionConclusions.find(c=>c.id===summary.resolved).text:""),
      actions);
  }
  function examineMirror(mirrorId){
    const mirror=reflectionMirrors.find(m=>m.id===mirrorId);
    const state=getState(),summary=reflectionSummary(state);
    if(!mirror||state.scene!=="gallery"||!summary.available)return;
    const chosen=summary.mirrors[mirror.id];
    if(chosen){
      const recorded=mirror.choices.find(c=>c.id===chosen);
      showDialog(mirror.name,recorded.text+"\n\nThis observation is already part of your field record.",[
        {label:"Review gallery progress",action:()=>showGalleryStatus()},
        {label:"Continue exploring",action:closeDialog}
      ]);
      return;
    }
    const options=mirror.choices.map(option=>({
      label:option.label,
      action:()=>{
        const next=chooseReflection(getState(),mirror.id,option.id);
        apply(next);
        showDialog(mirror.name+" · Observed",option.text+
          "\n\nInsight +1 · Equilibrium "+(option.delta>0?"+":"")+option.delta,
          [{label:"Review gallery progress",action:()=>showGalleryStatus()},
           {label:"Continue exploring",action:closeDialog}]);
      }
    }));
    options.push({label:"Leave unobserved for now",action:closeDialog});
    showDialog(mirror.name,mirror.prompt,options);
  }
  function examineQuestion(){
    const state=getState(),summary=reflectionSummary(state);
    if(state.scene!=="gallery"||!summary.available)return;
    if(summary.complete){
      showDialog("The Unanswered Question",
        "You have already made your final observation.\n\n"+
        reflectionConclusions.find(c=>c.id===summary.resolved).text,
        [{label:"Review gallery progress",action:()=>showGalleryStatus()},
         {label:"Continue exploring",action:closeDialog}]);
      return;
    }
    if(!summary.canConclude){showGalleryStatus();return;}
    const options=reflectionConclusions.map(choice=>({
      label:choice.label,
      action:()=>{
        apply(concludeReflection(getState(),choice.id));
        showDialog("The Unwritten Visitor · A New Question",choice.text+
          "\n\nInsight +3 · Equilibrium +"+choice.delta+
          "\n\nOne last field note appears: 'An answer can be truthful and still incomplete.'",[
          {label:"Review gallery",action:()=>showGalleryStatus()},
          {label:"Continue exploring",action:closeDialog}
        ]);
      }
    }));
    options.push({label:"Consider the question later",action:closeDialog});
    showDialog(galleryCore.name,
      "The three mirrors disagree, yet each preserves something meaningful. "+
      "Their contradictions can be retained, measured or deliberately left unresolved.\n\n"+
      "How will Michael record the result?",options);
  }
  return {talkVisitor,showGalleryStatus,examineMirror,examineQuestion};
}
