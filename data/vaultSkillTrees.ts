// Structured Vault skill-tree content used by the /vault route.

export type VaultNodeKind = "root" | "foundation" | "branch" | "technique" | "system" | "merge";

export type VaultNode = {
  id: string;
  title: string;
  kind: VaultNodeKind;
  category: string;
  points?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Mastery";
  icon: string;
  summary: string;
  lesson: string;
  example: string;
  practice: string;
  prerequisites?: string[];
  unlocks?: string[];
};

export type VaultDomain = "Memory" | "Maths" | "Linguistics" | "Focus";

export type VaultTree = {
  id: VaultDomain;
  title: string;
  subtitle: string;
  icon: string;
  root: VaultNode;
  foundations: VaultNode[];
  branches: [VaultNode, VaultNode];
  leftPath: VaultNode[];
  rightPath: VaultNode[];
  master: VaultNode;
  leftLabel: string;
  rightLabel: string;
};

const MEMORY_ROOT: VaultNode = {
  id: "three-pillars",
  title: "3 Pillars of Memory",
  kind: "root",
  category: "Foundation",
  points: 10,
  difficulty: "Beginner",
  icon: "eye",
  summary: "The base of every memory system: imagination, association, and focus.",
  lesson: "Good memory starts before a technique is chosen. You first notice the information clearly, turn it into a vivid image, then connect it to something you already know.",
  example: "To remember apple, picture an enormous red apple bursting open on your kitchen table.",
  practice: "Take five ordinary words and make each one vivid, exaggerated, and linked to a familiar place.",
  unlocks: ["Imagination", "Association", "Focus"],
};

const FOUNDATION_NODES: VaultNode[] = [
  {
    id: "imagination",
    title: "Imagination",
    kind: "foundation",
    category: "Foundation",
    points: 3,
    difficulty: "Beginner",
    icon: "image",
    summary: "Turn dull information into vivid mental images.",
    lesson: "The brain holds striking images more easily than plain words. Exaggerate size, color, movement, emotion, and absurdity until the image becomes hard to ignore.",
    example: "Invoice becomes a glowing paper tower falling across your desk.",
    practice: "Convert ten boring words into oversized moving images.",
    prerequisites: ["3 Pillars of Memory"],
    unlocks: ["Story Method", "Sound-Like System", "Looks-Like System"],
  },
  {
    id: "association",
    title: "Association",
    kind: "foundation",
    category: "Foundation",
    points: 3,
    difficulty: "Beginner",
    icon: "link",
    summary: "Connect new information to something already known.",
    lesson: "Association creates a retrieval cue. Link the new thing to a person, place, sound, feature, route, or fixed anchor that is already stable in memory.",
    example: "Rose becomes a rose growing from someone's jacket pocket.",
    practice: "Pick five names and create one visual association for each.",
    prerequisites: ["3 Pillars of Memory"],
    unlocks: ["Peg System", "Name Association System", "Memory Palace"],
  },
  {
    id: "focus",
    title: "Focus",
    kind: "foundation",
    category: "Foundation",
    points: 3,
    difficulty: "Beginner",
    icon: "target",
    summary: "Encode clearly before memorization begins.",
    lesson: "Focus is the gateway. If information is barely noticed, the best memory technique has little to work with. Pause, look once properly, and encode deliberately.",
    example: "Before memorizing a number, take one breath and read the digits in clean chunks.",
    practice: "Study a ten-item list for 30 seconds without switching attention, then recall it.",
    prerequisites: ["3 Pillars of Memory"],
    unlocks: ["Journey Method", "Retrieval Practice"],
  },
];

const BRANCH_NODES: VaultNode[] = [
  {
    id: "techniques-branch",
    title: "Memory Techniques",
    kind: "branch",
    category: "Branch",
    icon: "map",
    summary: "Practical methods for storing ordered, spatial, and linked memories.",
    lesson: "Technique nodes teach how to arrange information: as stories, pegs, chunks, journeys, palaces, reviews, and long-term systems.",
    example: "A shopping list can become a story, a peg list, or a route through your house.",
    practice: "Choose one small list and encode it using a story first, then using locations.",
    prerequisites: ["Imagination", "Association", "Focus"],
    unlocks: ["Story Method", "Peg System", "Memory Palace"],
  },
  {
    id: "systems-branch",
    title: "Encoding Systems",
    kind: "branch",
    category: "Branch",
    icon: "cpu",
    summary: "Systems that turn abstract names, words, dates, and numbers into images.",
    lesson: "System nodes teach conversion. You turn sounds, symbols, numbers, names, and dates into reusable images that can then be placed inside techniques.",
    example: "1453 can become images using a number system, then be placed inside a history palace.",
    practice: "Take three numbers or names and turn each into one concrete image.",
    prerequisites: ["Imagination", "Association"],
    unlocks: ["Major System", "PAO System", "Name Association System"],
  },
];

const TECHNIQUE_PATH: VaultNode[] = [
  {
    id: "story-method",
    title: "Story Method",
    kind: "technique",
    category: "Technique",
    points: 2,
    difficulty: "Beginner",
    icon: "book-open",
    summary: "Link items together through a bizarre visual story.",
    lesson: "Turn each item into an image, then make every image interact with the next. The stranger the interaction, the stronger the order.",
    example: "A key opens a river, the river carries a candle, and the candle melts a crown.",
    practice: "Make a story for six random objects and recall them in order.",
    prerequisites: ["Imagination"],
    unlocks: ["Peg System", "Journey Method"],
  },
  {
    id: "peg-system",
    title: "Peg System",
    kind: "technique",
    category: "Technique",
    points: 3,
    difficulty: "Beginner",
    icon: "map-pin",
    summary: "Attach information to fixed mental anchors.",
    lesson: "A peg system gives each position a permanent image. You attach temporary information to those fixed anchors, making ordered recall easier.",
    example: "If 1 is a tower, imagine milk pouring down the tower to remember milk first.",
    practice: "Build pegs 1-10 and attach a short shopping list.",
    prerequisites: ["Association", "Story Method"],
    unlocks: ["Chunking", "Journey Method"],
  },
  {
    id: "chunking",
    title: "Chunking",
    kind: "technique",
    category: "Technique",
    points: 3,
    difficulty: "Intermediate",
    icon: "layers",
    summary: "Compress many details into meaningful groups.",
    lesson: "Chunking reduces load by grouping separate pieces into useful units before deeper encoding begins.",
    example: "7419823650 becomes 741 / 982 / 3650.",
    practice: "Chunk three long numbers or phrases into meaningful groups.",
    prerequisites: ["Peg System"],
    unlocks: ["Memory Palace"],
  },
  {
    id: "journey-method",
    title: "Journey Method",
    kind: "technique",
    category: "Spatial Memory",
    points: 4,
    difficulty: "Intermediate",
    icon: "navigation",
    summary: "Use familiar routes as memory paths.",
    lesson: "Place images along a route you know well, then mentally walk the route to retrieve them in order.",
    example: "Put one image at your front door, one in the hallway, and one on the stairs.",
    practice: "Choose a ten-stop route and place one vivid image at every stop.",
    prerequisites: ["Focus", "Story Method"],
    unlocks: ["Memory Palace"],
  },
  {
    id: "memory-palace",
    title: "Memory Palace",
    kind: "technique",
    category: "Spatial Memory",
    points: 8,
    difficulty: "Advanced",
    icon: "home",
    summary: "Store images inside familiar physical locations.",
    lesson: "A memory palace uses stable locations as storage points. Place one vivid image at each location and recall by walking through the palace.",
    example: "To remember 'contract,' imagine a giant glowing contract exploding on your kitchen table.",
    practice: "Choose ten locations in your home and place one image in each.",
    prerequisites: ["Journey Method", "Association"],
    unlocks: ["Multi-Palace System", "Master Review"],
  },
  {
    id: "multi-palace",
    title: "Multi-Palace System",
    kind: "technique",
    category: "Spatial Memory",
    points: 7,
    difficulty: "Advanced",
    icon: "grid",
    summary: "Build multiple palaces for different subjects.",
    lesson: "Separate topics into dedicated palaces so knowledge stays organized and does not overload one route.",
    example: "Use your office for work, your home for habits, and a school route for study material.",
    practice: "Design three palaces and assign one subject to each.",
    prerequisites: ["Memory Palace"],
    unlocks: ["Review & Automation", "Master Review"],
  },
  {
    id: "retrieval-practice",
    title: "Retrieval Practice",
    kind: "technique",
    category: "Retention",
    points: 5,
    difficulty: "Intermediate",
    icon: "refresh-cw",
    summary: "Strengthen memory by actively recalling.",
    lesson: "Recall first, then check. The effort of producing the answer strengthens memory more than rereading.",
    example: "Close the list and recall it before correcting yourself.",
    practice: "Review a ten-item list using recall first, then correction.",
    prerequisites: ["Focus"],
    unlocks: ["Review & Automation"],
  },
  {
    id: "review-automation",
    title: "Review & Automation",
    kind: "technique",
    category: "Retention",
    points: 7,
    difficulty: "Advanced",
    icon: "repeat",
    summary: "Use spaced review until recall becomes automatic.",
    lesson: "Schedule recall before memories fade. Review today, tomorrow, several days later, then weekly until retrieval is quick.",
    example: "A new palace is reviewed after one day, three days, seven days, then monthly.",
    practice: "Create a review plan for one palace or number-image set.",
    prerequisites: ["Retrieval Practice", "Multi-Palace System"],
    unlocks: ["Master Review"],
  },
];

const SYSTEM_PATH: VaultNode[] = [
  {
    id: "sound-like",
    title: "Sound-Like System",
    kind: "system",
    category: "Encoding",
    points: 2,
    difficulty: "Beginner",
    icon: "volume-2",
    summary: "Convert unfamiliar words or names into familiar-sounding images.",
    lesson: "Listen for a familiar sound hidden inside the word or name, then turn that sound into an image.",
    example: "Victoria becomes victory: a medal, finish line, or trophy.",
    practice: "Turn ten unfamiliar names into sound-like images.",
    prerequisites: ["Imagination"],
    unlocks: ["Phonetic System", "Name Association System"],
  },
  {
    id: "looks-like",
    title: "Looks-Like System",
    kind: "system",
    category: "Encoding",
    points: 2,
    difficulty: "Beginner",
    icon: "figma",
    summary: "Convert symbols, letters, and numbers into objects they resemble.",
    lesson: "Use visual resemblance as a shortcut. Abstract marks become concrete objects.",
    example: "2 can look like a swan, 8 like a snowman, and 0 like an egg.",
    practice: "Create look-like images for digits 0 to 9.",
    prerequisites: ["Imagination"],
    unlocks: ["Peg System", "Date & Number Systems"],
  },
  {
    id: "phonetic",
    title: "Phonetic System",
    kind: "system",
    category: "Encoding",
    points: 3,
    difficulty: "Intermediate",
    icon: "radio",
    summary: "Break words into sound chunks and convert them into images.",
    lesson: "Split difficult words into useful sound pieces, then create one memorable scene from those pieces.",
    example: "Cytology might become sight + owl + logy in one visual scene.",
    practice: "Break five technical words into sound chunks and image them.",
    prerequisites: ["Sound-Like System"],
    unlocks: ["Major System"],
  },
  {
    id: "major-system",
    title: "Major System",
    kind: "system",
    category: "Encoding",
    points: 5,
    difficulty: "Intermediate",
    icon: "hash",
    summary: "Convert numbers into sounds, then sounds into images.",
    lesson: "The Major System maps digits to consonant sounds so numbers can become words and pictures.",
    example: "14 can become tire, deer, or tower depending on your mapping.",
    practice: "Encode five two-digit numbers into images.",
    prerequisites: ["Phonetic System"],
    unlocks: ["00-99 Image System", "Date & Number Systems", "PAO System"],
  },
  {
    id: "00-99-images",
    title: "00-99 Image System",
    kind: "system",
    category: "Encoding",
    points: 7,
    difficulty: "Advanced",
    icon: "database",
    summary: "Build a permanent image for every number from 00 to 99.",
    lesson: "A fixed 00-99 library turns two-digit chunks into instant pictures, reducing encoding time.",
    example: "37 might always be a mug, while 82 might always be a fan.",
    practice: "Create permanent images for one decade, such as 30-39.",
    prerequisites: ["Major System"],
    unlocks: ["PAO System"],
  },
  {
    id: "dominic",
    title: "Dominic System",
    kind: "system",
    category: "Encoding",
    points: 4,
    difficulty: "Intermediate",
    icon: "user",
    summary: "Use number initials to create memorable people-based images.",
    lesson: "Map numbers to letters, letters to people, and people to actions. People are naturally memorable.",
    example: "15 might become A.E., then Albert Einstein doing a fixed action.",
    practice: "Build people and actions for ten two-digit numbers.",
    prerequisites: ["Major System"],
    unlocks: ["PAO System"],
  },
  {
    id: "name-association",
    title: "Name Association System",
    kind: "system",
    category: "Real World Memory",
    points: 5,
    difficulty: "Intermediate",
    icon: "users",
    summary: "Attach name-images to facial features.",
    lesson: "Turn the name into an image, then attach it to a distinctive feature on the face.",
    example: "Mark becomes a marker drawing a line across a strong eyebrow.",
    practice: "Create associations for five people you know.",
    prerequisites: ["Association", "Sound-Like System"],
    unlocks: ["Master Review"],
  },
  {
    id: "date-number-systems",
    title: "Date & Number Systems",
    kind: "system",
    category: "Real World Memory",
    points: 5,
    difficulty: "Intermediate",
    icon: "calendar",
    summary: "Apply number encoding to dates, prices, statistics, and facts.",
    lesson: "Combine chunking, number images, and context so real-world facts become visual and retrievable.",
    example: "1453 becomes images placed on a historical timeline location.",
    practice: "Encode three historical dates and review them later.",
    prerequisites: ["Major System"],
    unlocks: ["PAO System", "Master Review"],
  },
  {
    id: "pao",
    title: "PAO System",
    kind: "system",
    category: "Advanced Encoding",
    points: 10,
    difficulty: "Advanced",
    icon: "activity",
    summary: "Compress information using Person-Action-Object scenes.",
    lesson: "PAO combines a person, an action, and an object into compact scenes for high-density memory.",
    example: "23-07-10 can become one person doing another person's action with a third object.",
    practice: "Create PAO entries for five numbers and combine them into scenes.",
    prerequisites: ["Major System", "00-99 Image System"],
    unlocks: ["Master Review"],
  },
];

const MASTER_NODE: VaultNode = {
  id: "master-review",
  title: "Master Review",
  kind: "merge",
  category: "Mastery",
  points: 20,
  difficulty: "Mastery",
  icon: "award",
  summary: "Unite techniques and systems into one complete memory workflow.",
  lesson: "Master Review is where the two branches meet. Encoding systems turn information into images; memory techniques store and retrieve those images.",
  example: "Use sound-like images for names, Major/PAO for numbers, and memory palaces for structured knowledge.",
  practice: "Create one mixed memory plan using at least three techniques from the tree.",
  prerequisites: ["PAO System", "Memory Palace", "Review & Automation"],
};

export const MEMORY_TREE: VaultTree = {
  id: "Memory",
  title: "Memory Skill Tree",
  subtitle: "Start with the three pillars, split into techniques and encoding systems, then bring everything together in Master Review.",
  icon: "eye",
  root: MEMORY_ROOT,
  foundations: FOUNDATION_NODES,
  branches: [BRANCH_NODES[0], BRANCH_NODES[1]],
  leftPath: TECHNIQUE_PATH,
  rightPath: SYSTEM_PATH,
  master: MASTER_NODE,
  leftLabel: "Techniques",
  rightLabel: "Systems",
};

function makeNode(id: string, title: string, kind: VaultNodeKind, category: string, icon: string, summary: string, lesson: string, example: string, practice: string, difficulty?: VaultNode["difficulty"], prerequisites?: string[], unlocks?: string[]): VaultNode {
  return { id, title, kind, category, icon, summary, lesson, example, practice, difficulty, prerequisites, unlocks };
}

const MATHS_TREE: VaultTree = {
  id: "Maths",
  title: "Maths Skill Tree",
  subtitle: "Build number sense first, then split into mental calculation and problem-solving systems.",
  icon: "hash",
  root: makeNode("number-sense", "Number Sense", "root", "Foundation", "hash", "Understand quantity, place value, and relationships between numbers.", "Maths improves when numbers feel structured rather than random. Number sense teaches you to see size, distance, factors, and patterns quickly.", "48 is close to 50, so 48 x 6 can be handled as 50 x 6 minus 12.", "Estimate ten calculations before solving them exactly.", "Beginner", undefined, ["Arithmetic Fluency", "Pattern Recognition"]),
  foundations: [
    makeNode("arithmetic-fluency", "Arithmetic Fluency", "foundation", "Foundation", "plus", "Make basic operations fast and reliable.", "Fluency reduces load. When basic facts are automatic, the mind has room for strategy.", "17 + 28 becomes 17 + 30 - 2.", "Solve twenty small additions using adjustment.", "Beginner", ["Number Sense"], ["Mental Addition"]),
    makeNode("pattern-recognition-maths", "Pattern Recognition", "foundation", "Foundation", "grid", "Spot repeated structures in numbers and shapes.", "Patterns turn problems into known forms. You learn to ask what the problem resembles before calculating.", "99 x 12 is 100 x 12 minus 12.", "Find three shortcuts in ordinary multiplication examples.", "Beginner", ["Number Sense"], ["Algebra Thinking"]),
    makeNode("working-precision", "Working Precision", "foundation", "Foundation", "crosshair", "Keep steps clean and avoid careless drift.", "Precision is not slowness. It means arranging work so each step is visible and recoverable.", "Write partial totals in aligned chunks instead of holding everything at once.", "Rework five errors and identify exactly where each drifted.", "Beginner", ["Number Sense"], ["Problem Review"]),
  ],
  branches: [
    makeNode("mental-calculation", "Mental Calculation", "branch", "Branch", "zap", "Fast strategies for arithmetic in your head.", "This branch builds calculation strategies from compensation to advanced multiplication.", "68 + 97 becomes 68 + 100 - 3.", "Solve ten sums using compensation only.", undefined, ["Arithmetic Fluency"], ["Multiplication Systems"]),
    makeNode("maths-reasoning", "Maths Reasoning", "branch", "Branch", "git-branch", "Reusable thinking patterns for harder problems.", "This branch focuses on structure: algebraic thinking, estimation, proof habits, and review.", "A word problem becomes variables, relationships, and constraints.", "Translate three word problems into equations.", undefined, ["Pattern Recognition"], ["Problem Solving"]),
  ],
  leftPath: [
    makeNode("mental-addition", "Mental Addition", "technique", "Calculation", "plus-circle", "Use splitting, compensation, and friendly numbers.", "Break numbers into easier parts and rebalance them.", "76 + 49 becomes 76 + 50 - 1.", "Do ten additions with friendly-number adjustment.", "Beginner", ["Arithmetic Fluency"], ["Mental Subtraction"]),
    makeNode("mental-subtraction", "Mental Subtraction", "technique", "Calculation", "minus-circle", "Subtract by distance, adjustment, or decomposition.", "Choose the subtraction route that creates the least mental load.", "102 - 78 is the distance from 78 to 102.", "Solve ten subtractions by counting distance.", "Beginner", ["Mental Addition"], ["Multiplication Systems"]),
    makeNode("multiplication-systems", "Multiplication Systems", "technique", "Calculation", "x-circle", "Use distributive thinking for products.", "Multiplication becomes easier when split around friendly numbers.", "23 x 14 becomes 23 x 10 plus 23 x 4.", "Solve ten products by splitting.", "Intermediate", ["Mental Subtraction"], ["Percentage Systems"]),
    makeNode("percentage-systems", "Percentage Systems", "technique", "Calculation", "percent", "Turn percentages into flexible fractions and chunks.", "Percentages are comparisons. Move between 10%, 5%, 1%, and useful fractions.", "15% of 80 is 10% plus 5%, so 8 + 4.", "Calculate five discounts without a calculator.", "Intermediate", ["Multiplication Systems"], ["Speed Estimation"]),
    makeNode("speed-estimation", "Speed Estimation", "technique", "Calculation", "trending-up", "Judge magnitude before exact work.", "Estimation catches impossible answers and guides strategy.", "19.8 x 51 is roughly 20 x 50, about 1000.", "Estimate ten results before calculating.", "Advanced", ["Percentage Systems"], ["Maths Master Review"]),
  ],
  rightPath: [
    makeNode("algebra-thinking", "Algebra Thinking", "system", "Reasoning", "box", "Represent unknowns cleanly.", "Algebra is a language for relationships. Name the unknown and write what must be true.", "If total is 42 and one part is x, the other might be 42 - x.", "Write variables for five simple word problems.", "Beginner", ["Pattern Recognition"], ["Problem Solving"]),
    makeNode("problem-solving", "Problem Solving", "system", "Reasoning", "compass", "Choose a plan before calculating.", "Good problem-solving starts with structure: knowns, unknowns, constraints, and possible methods.", "A rate problem becomes distance = rate x time.", "For five problems, write the plan before solving.", "Intermediate", ["Algebra Thinking"], ["Proof Habits"]),
    makeNode("visual-models", "Visual Models", "system", "Reasoning", "bar-chart-2", "Use diagrams, bars, and grids to reveal structure.", "Visual models reduce abstraction and make hidden relationships visible.", "A ratio can become two bars split into equal units.", "Draw a model for three ratio problems.", "Intermediate", ["Problem Solving"], ["Proof Habits"]),
    makeNode("proof-habits", "Proof Habits", "system", "Reasoning", "check-square", "Explain why a result must be true.", "Proof habits train you to justify, not just answer. This improves transfer to new problems.", "Show that an odd plus odd is even using 2a+1 and 2b+1.", "Explain one result in words and symbols.", "Advanced", ["Visual Models"], ["Problem Review"]),
    makeNode("problem-review", "Problem Review", "system", "Reasoning", "rotate-ccw", "Turn mistakes into reusable rules.", "Review makes maths compound. Every error becomes a pattern to catch next time.", "A sign error becomes a checklist item for future algebra.", "Review three mistakes and write a prevention rule.", "Advanced", ["Proof Habits"], ["Maths Master Review"]),
  ],
  master: makeNode("maths-master-review", "Maths Master Review", "merge", "Mastery", "award", "Unite calculation speed with structured reasoning.", "Mastery means knowing when to calculate, estimate, model, prove, or review.", "A percentage word problem can be estimated, modeled, solved exactly, then checked.", "Solve one mixed problem using estimation, exact work, and review.", "Mastery", ["Speed Estimation", "Problem Review"]),
  leftLabel: "Calculation",
  rightLabel: "Reasoning",
};

const LINGUISTICS_TREE: VaultTree = {
  id: "Linguistics",
  title: "Linguistics Skill Tree",
  subtitle: "Build sound awareness, word structure, grammar, and meaning into one language-learning system.",
  icon: "message-circle",
  root: makeNode("language-awareness", "Language Awareness", "root", "Foundation", "message-circle", "Notice sounds, patterns, meanings, and sentence structure.", "Language learning becomes easier when you can hear and see the structure beneath words.", "The word unbelievable has parts: un + believe + able.", "Break ten words into meaningful pieces.", "Beginner", undefined, ["Sound Awareness", "Word Building"]),
  foundations: [
    makeNode("sound-awareness", "Sound Awareness", "foundation", "Foundation", "volume-2", "Hear and reproduce important sound differences.", "Sound awareness sharpens pronunciation and listening.", "Ship and sheep differ by vowel length and quality.", "Record five difficult sounds and compare them.", "Beginner", ["Language Awareness"], ["Pronunciation Map"]),
    makeNode("word-building", "Word Building", "foundation", "Foundation", "layers", "Recognize roots, prefixes, suffixes, and families.", "Words are often built from reusable parts. Learning those parts multiplies vocabulary.", "Predict, prediction, predictable, and predictor share a root.", "Create word families for five roots.", "Beginner", ["Language Awareness"], ["Vocabulary Systems"]),
    makeNode("sentence-attention", "Sentence Attention", "foundation", "Foundation", "align-left", "Track word order and sentence roles.", "Grammar makes meaning visible. Sentence attention trains you to notice what each word is doing.", "The dog chased the cat differs from the cat chased the dog.", "Label subject, verb, and object in ten sentences.", "Beginner", ["Language Awareness"], ["Grammar Frames"]),
  ],
  branches: [
    makeNode("vocabulary-branch", "Vocabulary Systems", "branch", "Branch", "book-open", "Methods for learning and recalling words.", "This branch organizes vocabulary by sound, meaning, roots, and review.", "A new word becomes sound, image, context, and usage.", "Build a four-part card for five new words.", undefined, ["Word Building"], ["Spaced Vocabulary"]),
    makeNode("structure-branch", "Language Structure", "branch", "Branch", "git-branch", "Grammar, syntax, and meaning patterns.", "This branch turns language from memorized phrases into reusable structure.", "A tense pattern becomes a frame you can reuse.", "Collect three example sentences for one grammar pattern.", undefined, ["Sentence Attention"], ["Grammar Frames"]),
  ],
  leftPath: [
    makeNode("pronunciation-map", "Pronunciation Map", "technique", "Sound", "map", "Map difficult sounds to mouth positions.", "Pronunciation improves when you know what tongue, lips, and voice are doing.", "The th sound needs tongue placement between the teeth.", "Practice five sounds with a mirror.", "Beginner", ["Sound Awareness"], ["Vocabulary Images"]),
    makeNode("vocabulary-images", "Vocabulary Images", "technique", "Vocabulary", "image", "Attach words to clear images and context.", "Words stick better when linked to visual meaning and a real sentence.", "Maison becomes a house image plus a sentence where it appears.", "Image ten new words and use each in a phrase.", "Beginner", ["Word Building"], ["Spaced Vocabulary"]),
    makeNode("spaced-vocabulary", "Spaced Vocabulary", "technique", "Vocabulary", "repeat", "Review words at useful intervals.", "Vocabulary needs retrieval, not rereading. Spaced recall keeps words alive.", "Recall a word today, tomorrow, three days later, then weekly.", "Build a review stack for twenty words.", "Intermediate", ["Vocabulary Images"], ["Context Recall"]),
    makeNode("context-recall", "Context Recall", "technique", "Vocabulary", "file-text", "Remember words inside phrases and scenes.", "Context prevents isolated word knowledge and teaches usage.", "Learn negotiate inside a meeting scene, not as a naked translation.", "Create five sentences with new words.", "Intermediate", ["Spaced Vocabulary"], ["Language Master Review"]),
  ],
  rightPath: [
    makeNode("grammar-frames", "Grammar Frames", "system", "Structure", "columns", "Turn grammar into reusable sentence frames.", "A grammar frame lets you swap vocabulary while keeping structure stable.", "I used to ___ becomes a reusable past-habit frame.", "Write five sentences from one frame.", "Beginner", ["Sentence Attention"], ["Syntax Patterns"]),
    makeNode("syntax-patterns", "Syntax Patterns", "system", "Structure", "shuffle", "Notice how word order changes meaning.", "Syntax is the arrangement of roles. Patterns help comprehension and production.", "Question order differs from statement order.", "Transform five statements into questions.", "Intermediate", ["Grammar Frames"], ["Meaning Networks"]),
    makeNode("meaning-networks", "Meaning Networks", "system", "Meaning", "share-2", "Connect words by nuance, register, and usage.", "Meaning is relational. Words become clearer when linked to similar and contrasting words.", "Big, large, huge, and massive overlap but feel different.", "Build a meaning map for one topic.", "Intermediate", ["Syntax Patterns"], ["Speaking Retrieval"]),
    makeNode("speaking-retrieval", "Speaking Retrieval", "system", "Fluency", "mic", "Retrieve language under time pressure.", "Speaking needs fast access. Practice recall in short, realistic bursts.", "Answer a prompt in twenty seconds using a target frame.", "Record five short answers using one structure.", "Advanced", ["Meaning Networks"], ["Language Master Review"]),
  ],
  master: makeNode("language-master-review", "Language Master Review", "merge", "Mastery", "award", "Unite sound, vocabulary, grammar, and recall.", "Language mastery means you can hear, build, understand, and produce patterns together.", "A new phrase is learned by sound, word parts, grammar frame, meaning, and spoken recall.", "Take one short text and extract sounds, words, grammar, and speaking prompts.", "Mastery", ["Context Recall", "Speaking Retrieval"]),
  leftLabel: "Vocabulary",
  rightLabel: "Structure",
};

const FOCUS_TREE: VaultTree = {
  id: "Focus",
  title: "Focus Skill Tree",
  subtitle: "Train attention control, distraction resistance, and recovery into a dependable focus system.",
  icon: "target",
  root: makeNode("attention-control", "Attention Control", "root", "Foundation", "target", "Choose where attention goes and keep it there.", "Focus is a trainable control skill. You learn to notice drift, return deliberately, and protect the next action.", "Reading one paragraph while ignoring notifications is attention control.", "Set a two-minute timer and return attention every time it drifts.", "Beginner", undefined, ["Single Tasking", "Distraction Awareness"]),
  foundations: [
    makeNode("single-tasking", "Single Tasking", "foundation", "Foundation", "square", "Work on one target without switching.", "Single tasking lowers attention residue and makes deep work possible.", "One tab, one problem, one timer.", "Do one five-minute single-task block.", "Beginner", ["Attention Control"], ["Deep Work Blocks"]),
    makeNode("distraction-awareness", "Distraction Awareness", "foundation", "Foundation", "eye", "Notice triggers before they take over.", "You cannot manage distractions you do not see. Awareness creates a choice point.", "Reaching for the phone becomes a noticed urge, not an automatic action.", "List five common distraction triggers.", "Beginner", ["Attention Control"], ["Environment Design"]),
    makeNode("energy-check", "Energy Check", "foundation", "Foundation", "battery", "Match tasks to current energy.", "Focus depends on state. The right task at the wrong energy becomes friction.", "Do creative work when fresh and admin when tired.", "Rate energy before three tasks and adjust order.", "Beginner", ["Attention Control"], ["Recovery Skills"]),
  ],
  branches: [
    makeNode("focus-techniques", "Focus Techniques", "branch", "Branch", "clock", "Practical blocks, timers, and return methods.", "This branch turns focus into repeatable work sessions.", "A deep work block has a target, timer, and shutdown point.", "Plan one focused block before starting.", undefined, ["Single Tasking"], ["Deep Work Blocks"]),
    makeNode("focus-systems", "Focus Systems", "branch", "Branch", "settings", "Environment, energy, and recovery design.", "This branch protects focus outside the moment of work.", "The room, phone, schedule, and breaks all shape attention.", "Change one environmental cue before work.", undefined, ["Distraction Awareness", "Energy Check"], ["Environment Design"]),
  ],
  leftPath: [
    makeNode("deep-work-blocks", "Deep Work Blocks", "technique", "Execution", "clock", "Use bounded sessions for demanding work.", "A deep work block has a clear target, time boundary, and no switching.", "Write for 25 minutes with only the document open.", "Run one 20-minute focus block.", "Beginner", ["Single Tasking"], ["Attention Reset"]),
    makeNode("attention-reset", "Attention Reset", "technique", "Execution", "refresh-cw", "Return quickly after drift.", "The skill is not never drifting. The skill is returning fast without drama.", "Notice tab switching, close it, breathe, return to the line.", "Practice five deliberate returns during a task.", "Beginner", ["Deep Work Blocks"], ["Task Switching Control"]),
    makeNode("task-switching-control", "Task Switching Control", "technique", "Execution", "repeat", "Switch intentionally instead of reactively.", "Switching costs less when captured, named, and scheduled.", "Write the new task down instead of jumping to it.", "Use a capture list for one session.", "Intermediate", ["Attention Reset"], ["Focus Master Review"]),
  ],
  rightPath: [
    makeNode("environment-design", "Environment Design", "system", "Protection", "sliders", "Shape the workspace so focus is easier.", "The best focus system removes decisions and temptations before they happen.", "Phone outside the room, one browser window, clean desk.", "Remove three distractions before your next block.", "Beginner", ["Distraction Awareness"], ["Energy Rhythm"]),
    makeNode("energy-rhythm", "Energy Rhythm", "system", "Energy", "activity", "Plan hard work around natural energy.", "Energy rhythm aligns task difficulty with your best hours.", "Study hardest material before low-energy admin.", "Map your energy across one day.", "Intermediate", ["Energy Check"], ["Recovery Skills"]),
    makeNode("recovery-skills", "Recovery Skills", "system", "Recovery", "sun", "Recover attention between intense blocks.", "Focus improves when breaks are real recovery, not disguised distraction loops.", "Walk, breathe, stretch, or look outside instead of scrolling.", "Take one five-minute non-screen recovery break.", "Intermediate", ["Energy Rhythm"], ["Focus Master Review"]),
  ],
  master: makeNode("focus-master-review", "Focus Master Review", "merge", "Mastery", "award", "Unite attention control, work blocks, environment, and recovery.", "Focus mastery means you can start, stay, return, protect, and recover.", "A hard study session uses a clear target, clean space, timer, capture list, and real break.", "Design a full focus session from setup to recovery.", "Mastery", ["Task Switching Control", "Recovery Skills"]),
  leftLabel: "Execution",
  rightLabel: "Systems",
};

export const VAULT_TREES: VaultTree[] = [MEMORY_TREE, MATHS_TREE, LINGUISTICS_TREE, FOCUS_TREE];
