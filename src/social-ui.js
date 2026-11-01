import { thinkers, worlds, conversations } from "./content.js";
import { recruit, discuss } from "./state.js";
import { personalQuests, visitors, debateChoices, trustFor, trustTier,
  questStatus, acceptPersonalQuest, completePersonalQuest,
  hearVisitor, debateAvailable, resolveDebate, reactionFor, socialSummary,
  validateSocial } from "./relationships.js";

// UI controller: pure social rules live in relationships.js and are tested
// independently; no mutable secondary state is kept by this adapter.
export function createSocialUI({getState,apply,showDialog,closeDialog}){
  function talkToThinker(person){
    const state=getState(),has=state.recruits.includes(person.id),status=questStatus(state,person.id);
    const actions=[
      ...["interval","work","consequences"].map(topic=>({
        label:topic==="interval"?"Ask about the Interval":topic==="work"?"Ask about their research":"Discuss the cost of choices",
        action:()=>{
          apply(discuss(getState(),person.id,topic));
          const now=getState();
          showDialog(person.name+" · "+person.role,conversations[person.id][topic]+
            "\n\n"+reactionFor(now,person.id),[
            {label:"Ask another question",action:()=>talkToThinker(person)},
            {label:"Return to town",action:closeDialog}
          ]);
        }
      }))
    ];
    if(!has)actions.push({label:"Invite to the expedition",action:()=>{
      apply(recruit(getState(),person.id));
      showDialog(person.name,person.join,[
        {label:"Ask about a personal inquiry",action:()=>talkToThinker(person)},
        {label:"Return to town",action:closeDialog}
      ]);
    }});
    if(has){
      const quest=personalQuests[person.id];
      if(status==="available")actions.push({label:"Begin personal inquiry · "+quest.title,action:()=>{
        apply(acceptPersonalQuest(getState(),person.id));
        showDialog(quest.title,quest.setup,[
          {label:"Review relationships",action:showRelationships},
          {label:"Return to town",action:closeDialog}
        ]);
      }});
      if(status==="ready")actions.push({label:"Share recovered evidence · "+quest.title,action:()=>{
        apply(completePersonalQuest(getState(),person.id));
        showDialog(quest.title+" · Complete",quest.returnLine+"\n\n"+quest.completedLine+
          "\n\nTrust +2 · Insight +2",[
          {label:"Review relationships",action:showRelationships},
          {label:"Return to town",action:closeDialog}
        ]);
      }});
      if(status==="active")actions.push({label:"Discuss ongoing inquiry",action:()=>{
        const recovered=getState().records?.includes(quest.record);
        showDialog(quest.title,quest.setup+
          "\n\n"+(recovered?"The evidence is ready for review.":"The corresponding field record is still missing."),
          [{label:"Continue exploring",action:closeDialog}]);
      }});
      if(status==="completed")actions.push({label:"Reflect on our inquiry",action:()=>{
        showDialog(quest.title,quest.completedLine);
      }});
    }
    actions.push({label:"Return to town",action:closeDialog});
    const socialText=has?"\n\n"+reactionFor(state,person.id):"";
    showDialog(person.name+" · "+person.role,
      person.lines+socialText+
      (has?"\n\nRapport: "+trustFor(state,person.id)+"/6 · "+trustTier(state,person.id):""),
      actions);
  }
  function greetVisitor(visitor){
    const state=getState(),met=validateSocial(state.social).visitors.includes(visitor.id);
    if(!met)apply(hearVisitor(state,visitor.id));
    showDialog(visitor.name+" · Visiting Scholar",
      met?visitor.again:visitor.first+"\n\nNew acquaintance: Insight +1",[
        {label:"Continue exploring",action:closeDialog}
      ]);
  }
  function showRelationships(){
    const state=getState(),summaries=socialSummary(state);
    const done=summaries.filter(p=>p.quest==="completed").length;
    const entries=summaries.map(p=>p.name+": "+p.trust+"/6 trust · "+p.tier+" · "+p.quest).join("\n\n");
    showDialog("Gen.E.Wrist · The Minds",
      "Personal inquiries: "+done+"/3 complete.\n\n"+entries+
      "\n\nTrust strengthens coordinated scientific solutions after both participating minds have earned confidence in Michael. Speak with recruited thinkers to begin or finish their inquiries.",
      [{label:"Return to town",action:closeDialog}]);
  }
  function showConclave(){
    const state=getState();
    const available=worlds.filter(world=>debateAvailable(state,world.id));
    const social=validateSocial(state.social);
    const actions=available.map(world=>({
      label:"Debate · "+world.name,
      action:()=>debateWorld(world)
    }));
    actions.push({label:"Review relationships",action:showRelationships});
    actions.push({label:"Return to town",action:closeDialog});
    showDialog("The Conclave · Elsewhen",
      state.completed.length===0
        ?"The hall is quiet. The town's thinkers have agreed to meet after your first expedition, when they have something real to argue about."
        :"A small gathering of scholars reviews what Michael's choices have changed.\n\n"+
        "Debates held: "+social.debates.length+"/3. "+
        (available.length?"Choose a recovered reality to reconsider together.":"No new debates available. Resolve another fracture, or recruit another mind."),
      actions);
  }
  function debateWorld(world){
    const state=getState();
    if(!debateAvailable(state,world.id)){showConclave();return;}
    const choice=state.choices[world.id]||"unknown";
    const actions=debateChoices
      .filter(stance=>stance.id==="common"||state.recruits.includes(stance.id))
      .map(stance=>({
        label:stance.label,
        action:()=>{
          const before=getState(),after=resolveDebate(before,world.id,stance.id);
          if(after===before){showConclave();return;}
          apply(after);
          const narrative=after.log.at(-1);
          showDialog("Conclave · "+world.name,
            "Your earlier decision: "+choice+".\n\n"+narrative+
            "\n\nRelationships updated · Insight +1",
            [{label:"View bonds",action:showRelationships},{label:"Return to town",action:closeDialog}]);
        }
      }));
    actions.push({label:"Not yet",action:showConclave});
    showDialog("The Conclave · "+world.name,
      "The scientists debate the meaning of your earlier decision ("+choice+"). Is a stable result enough, or must a better solution account for everything it changed?\n\n"+
      "Choosing common ground builds trust across the recruited team. Supporting one interpretation strengthens that friendship but may alienate a rival.",
      actions);
  }
  return {talkToThinker,greetVisitor,showRelationships,showConclave};
}
