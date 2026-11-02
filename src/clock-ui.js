import { clockFragments, clockStations, clockOrder, clockSummary,
  enterClockGlyph, observeClockStation } from "./clock-rules.js";

// All meaningful progress is persisted by state.js. This controller owns no
// hidden client-side puzzle state and remains compatible with existing saves.
export function createClockUI({getState,apply,showDialog,closeDialog,travel}){
  function showClock(atTower=false){
    const state=getState(),report=clockSummary(state);
    const recovered=clockFragments.map(f=>
      (report.fragments.includes(f.id)?"✓ ":"◇ ")+f.name+
      " · "+(report.fragments.includes(f.id)?f.clue:f.hint)
    ).join("\n\n");
    if(report.solved){
      const actions=[];
      if(atTower&&state.scene==="elsewhen")actions.push({
        label:"Enter the Observation Chamber",
        action:()=>{
          apply(travel(getState(),"clockroom"));
          showDialog("The Unwritten Hour",
            "You stand inside a room of brass instruments and carefully unasked questions.\n\n"+
            "Examine the harmonic lens, the unwritten ledger and the clockwork orrery.",
            [{label:"Begin exploring",action:closeDialog}]);
        }
      });
      if(state.scene==="clockroom")actions.push({
        label:"Return to Elsewhen",
        action:()=>{apply(travel(getState(),"elsewhen"));closeDialog();}
      });
      actions.push({label:"Close",action:closeDialog});
      showDialog("The Clock Tower · Open",
        report.roomComplete?
          "The tower has recorded the Unwritten Hour. You have found all three instruments.\n\n"+
          "The answer is not a destination. It is the next question.":
          "The clock tower's hidden chamber is open.\n\n"+
          "Observation stations: "+report.stations.length+"/3. "+
          "The mechanism repeats the sequence "+clockOrder.join(" · ")+".",
        actions);
      return;
    }
    if(!report.allFragments){
      showDialog("The Clock That Counts Backward",
        "A small dial beneath the clock face has three empty sockets.\n\n"+
        "Recovered inscriptions: "+report.fragmentsFound+"/3.\n\n"+
        recovered+"\n\n"+
        "When a world has been stabilized, return to the corresponding Elsewhen landmark and investigate its inscription.",
        [{label:"Return to exploration",action:closeDialog}]);
      return;
    }
    const actions=atTower&&state.scene==="elsewhen"
      ?clockOrder.map(symbol=>({label:"Turn the dial to "+symbol,action:()=>{
        const before=getState(),next=enterClockGlyph(before,symbol);
        if(before===next){showClock(true);return;}
        apply(next);
        const result=clockSummary(next);
        if(result.solved){
          showDialog("The Unwritten Hour",
            "The tower strikes once. No one in town hears it.\n\n"+
            "A narrow door appears between the clock's last two ticks. The observation chamber is now accessible.\n\n"+
            "Insight +3",[
            {label:"Enter the Observation Chamber",action:()=>{
              apply(travel(getState(),"clockroom"));
              closeDialog();
            }},
            {label:"Remain in Elsewhen",action:closeDialog}
          ]);
        }else{
          const success=next.clock.dial.length>before.clock.dial.length;
          showDialog(success?"The Dial Responds":"The Dial Resets",
            success?
              "The glyph locks into place. "+next.clock.dial.length+"/3 sockets lit.":
              "The mechanism refuses this order and resets all three sockets.\n\n"+
              "The inscriptions mention which element comes first and which comes last.",
            [{label:"Continue aligning",action:()=>showClock(true)},
              {label:"Step away",action:closeDialog}]);
        }
      }}))
      :[];
    if(!actions.length)actions.push({label:"Close",action:closeDialog});
    else actions.push({label:"Step away",action:closeDialog});
    showDialog("The Clock Tower · Three Glyphs",
      "All inscriptions are recovered. The mechanism awaits the correct ordering.\n\n"+
      recovered+"\n\n"+
      "Dial: "+(report.dial.join(" · ")||"—")+
      "\n\n"+(atTower?"Choose a glyph for the next socket.":"Approach the clock face north of the town square to align the dial."),
      actions);
  }
  function inspectStation(station){
    const state=getState();
    if(state.scene!=="clockroom"||!clockStations.some(s=>s.id===station.id))return;
    const already=clockSummary(state).stations.includes(station.id);
    if(!already)apply(observeClockStation(state,station.id));
    const report=clockSummary(getState());
    showDialog(station.name,
      station.text+"\n\n"+station.note+
      (already?"\n\nThe instrument has already been observed.":
        report.roomComplete?
          "\n\nTHE THREE OBSERVATIONS AGREE.\nThe clock registers an hour that no calendar contains. A new unanswered question is inscribed on the ledger.\n\nInsight +3":
          "\n\nNEW OBSERVATION · Insight +1 ("+report.stations.length+"/3)"),
      [{label:"Review clock research",action:()=>showClock(false)},
       {label:"Continue exploring",action:closeDialog}]);
  }
  return {showClock,inspectStation};
}
