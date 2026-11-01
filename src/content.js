export const thinkers = [
  { id: "einstein", name: "Albert Einstein", role: "The Relativist", initials: "AE", x: 228, y: 328, color: "#e6bd84", lines: "The town refuses to obey ordinary time. That should worry us. It also makes it a marvelous place to think.", join: "I will help you trace the fractures. But don't confuse a useful equation with a harmless decision." },
  { id: "tesla", name: "Nikola Tesla", role: "The Conductor", initials: "NT", x: 722, y: 330, color: "#89d9e4", lines: "The portals hum with a frequency no instrument should be able to hear. We must follow it.", join: "My field stabilizers are yours. Try not to cross the wires of existence." },
  { id: "lovelace", name: "Ada Lovelace", role: "The Coder", initials: "AL", x: 476, y: 285, color: "#caabfa", lines: "There is a pattern beneath all these worlds. Patterns may be decoded, but never assume the pattern is kind.", join: "We shall write a better outcome, provided we understand the rules first." }
];

export const worlds = [
  {
    id: "gardens", name: "The Chrono Gardens", subtitle: "A forest growing through its own yesterday", x: 183, y: 154, color: "#a7d99b", needed: "einstein",
    description: "Three versions of the same forest are occupying one moment. The oldest roots are strangling their future selves. Einstein can help measure which history is anchored.",
    options: [
      { id: "anchor", label: "Anchor the earliest branch", stability: 9, insight: 1, result: "A single history takes root. Two possible forests fade, leaving a living world behind." },
      { id: "weave", label: "Weave all three histories together", stability: 4, insight: 3, result: "The branches coexist in a fragile new pattern. Strange flowers bloom out of sequence." },
      { id: "cut", label: "Cut away the weakest branch", stability: -9, insight: 4, result: "The fracture closes quickly. The silence where one timeline stood is harder to explain." }
    ]
  },
  {
    id: "causeway", name: "The Glass Causeway", subtitle: "A bridge made of borrowed lightning", x: 480, y: 118, color: "#8ed8ed", needed: "tesla",
    description: "Lightning is crossing between incompatible realities. The causeway vibrates with enough energy to split another timeline. Tesla recognizes a way to conduct it.",
    options: [
      { id: "ground", label: "Ground the charge through safe anchors", stability: 10, insight: 1, result: "The lightning gutters into the anchors. One stable pathway survives." },
      { id: "redistribute", label: "Redistribute the energy across six paths", stability: 5, insight: 3, result: "Six silver pathways flare to life. The danger is shared, but none is entirely safe." },
      { id: "overload", label: "Overload the unstable bridge", stability: -11, insight: 4, result: "The bridge shatters and the rift snaps shut. Something on the far side stops answering." }
    ]
  },
  {
    id: "archive", name: "The Echo Archive", subtitle: "A library recording books never written", x: 782, y: 154, color: "#d3b5fa", needed: "lovelace",
    description: "A library is indexing histories that have not happened. Its recursive catalog threatens to overwrite the memories of entire civilizations. Ada can decode its rules.",
    options: [
      { id: "repair", label: "Repair the original catalog", stability: 8, insight: 2, result: "The archive remembers where its first story began. Most histories settle into place." },
      { id: "fork", label: "Fork the archive into separate indexes", stability: 3, insight: 4, result: "The books stop rewriting each other. Their conflicting versions remain accessible." },
      { id: "erase", label: "Erase every contradictory record", stability: -12, insight: 5, result: "The recursion ends. So do countless memories that had nowhere else to live." }
    ]
  }
];

export const intro = "You arrived in Elsewhen with a device on your wrist and a name you remember: Michael Wave.\n\nThree fractures are spreading through The Interval. The greatest minds of different centuries are gathered here, but none can solve every problem alone.\n\nMove through town, invite the thinkers to join you, and investigate each portal. Be careful: a faster solution is not always a better one.";


// Public-facing character encounters. Every conversation can be replayed;
// the first exploration of a topic awards one insight.
export const conversations = {
  einstein: {
    interval: "Elsewhen is full of convincing clocks. None of them agree. Perhaps time is less like a river and more like a conversation.",
    work: "A good theory tells us what should happen, but an experiment must still tell us whether it does.",
    consequences: "A calculation can describe what changes. It cannot assign the value of a person or a world."
  },
  tesla: {
    interval: "Every portal sings. Listen closely, and you can tell which world is trembling before you can see it.",
    work: "I would rather build one useful machine than give a hundred lectures about it. Of course, I do enjoy a good lecture.",
    consequences: "We can redirect the energy, but we must never forget where we have sent it."
  },
  lovelace: {
    interval: "Look at the town's streets from above. There is a pattern. The odd thing is that it changes each time you count.",
    work: "A machine can manipulate symbols according to rules. The questions we give it remain entirely our own responsibility.",
    consequences: "An elegant solution is not necessarily an ethical one. The people living inside our equations have opinions."
  }
};

export const landmarks = [
  {
    id: "fountain", x: 480, y: 411, name: "Fountain of Seasons",
    description: "The basin holds reflected leaves from spring, summer, autumn and winter, all in the same water. Its stonework feels older than the town.",
    after: "The fountain's four seasons ripple into one slow current. Something in Elsewhen has become calmer."
  },
  {
    id: "observatory", x: 182, y: 466, name: "The Observatory",
    description: "A brass telescope points toward a constellation no chart recognizes. Every astronomer draws it differently, yet the telescope never moves.",
    after: "A newly steady star has appeared in the observation log. Its location agrees with none of the maps."
  },
  {
    id: "atelier", x: 766, y: 463, name: "The Atelier",
    description: "A clockwork sparrow taps at the window, carrying a note: 'Every useful invention begins with a question.'",
    after: "The sparrow now sings in three-part harmony. Even the workshop instruments fall quiet to listen."
  }
];
