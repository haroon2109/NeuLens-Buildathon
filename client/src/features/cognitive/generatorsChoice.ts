import type { ChoiceContent, ChoiceOption, ChoiceTrial } from './contentTypes';

/** Deterministic PRNG so the same task, form and level always produce the same items. */
export function seededRandom(seed: string): () => number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rand: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sample<T>(items: T[], count: number, rand: () => number): T[] {
  return shuffle(items, rand).slice(0, Math.max(0, count));
}

const countForLevel = (level: number, base: number, step = 1, max = 8) =>
  Math.min(max, base + Math.max(0, level - 1) * step);

const u = (label: string, id: string, extra: Partial<ChoiceOption> = {}): ChoiceOption => ({ id, label, ...extra });

// ---------------------------------------------------------------------------
// Face–Name Association
// ---------------------------------------------------------------------------
const PEOPLE = [
  { name: 'Asha', face: '👩🏽' },
  { name: 'Ravi', face: '👨🏾' },
  { name: 'Meena', face: '👩🏻' },
  { name: 'Joseph', face: '👨🏿' },
  { name: 'Lakshmi', face: '👵🏽' },
  { name: 'Arun', face: '🧑🏽' },
  { name: 'Fatima', face: '👩🏾' },
  { name: 'Kumar', face: '👴🏽' }
];

function faceNames(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`face-name:${form}:${level}`);
  const count = countForLevel(level, 3);
  const people = sample(PEOPLE, count, rand);
  const trials: ChoiceTrial[] = people.map((person, index) => {
    const distractors = sample(
      PEOPLE.filter((candidate) => candidate.name !== person.name),
      3,
      rand
    );
    return {
      id: `face-${index}`,
      prompt: `Which name belongs to this person?`,
      helper: person.face,
      options: shuffle([person, ...distractors], rand).map((candidate) => u(candidate.name, candidate.name)),
      correctId: person.name,
      practice: index === 0
    };
  });
  return {
    kind: 'choice',
    study: {
      title: 'Remember these names',
      body: 'The faces will return one at a time. Choose the name that belongs to each face.',
      items: people.map((person) => ({ emoji: person.face, label: person.name })),
      displaySeconds: 6 + level
    },
    trials
  };
}

// ---------------------------------------------------------------------------
// Word List Recall
// ---------------------------------------------------------------------------
const WORDS = [
  'River', 'Lamp', 'Bread', 'Chair', 'Garden', 'Pencil', 'Window', 'Basket',
  'Spoon', 'Mountain', 'Blanket', 'Market', 'Bicycle', 'Letter', 'Kitchen', 'Clock'
];

function wordList(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`word-list:${form}:${level}`);
  const count = countForLevel(level, 4, 1, 8);
  const words = sample(WORDS, count, rand);
  const distractors = sample(WORDS.filter((word) => !words.includes(word)), 4, rand);
  const options = shuffle([...words, ...distractors], rand).map((word) => u(word, word));
  return {
    kind: 'choice',
    study: {
      title: 'Read these words',
      body: 'Read them aloud if you wish. On the next screen, select every word you remember seeing.',
      items: words.map((word) => ({ label: word })),
      displaySeconds: 3 + count
    },
    trials: [
      {
        id: 'word-recall',
        prompt: 'Select every word that was in the list.',
        helper: 'Choose all that apply. There is no time limit.',
        options,
        correctId: words[0],
        multi: true,
        correctIds: words,
        practice: false
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// Story Recall
// ---------------------------------------------------------------------------
const STORIES = [
  {
    body: 'Meena took the bus to the market. She bought two mangoes and a small bag of rice. On the way home she met her neighbour, who helped her carry the bag.',
    questions: [
      { q: 'How did Meena travel to the market?', a: 'By bus', options: ['By bus', 'By train', 'On foot', 'By car'] },
      { q: 'What fruit did Meena buy?', a: 'Mangoes', options: ['Mangoes', 'Bananas', 'Apples', 'Oranges'] },
      { q: 'Who helped her carry the bag?', a: 'Her neighbour', options: ['Her neighbour', 'Her son', 'The driver', 'A shopkeeper'] }
    ]
  },
  {
    body: 'Joseph woke early because the electricity would be off at nine. He filled two buckets with water and watered the plants. Then he made tea and sat by the window until the power returned.',
    questions: [
      { q: 'Why did Joseph wake early?', a: 'The electricity would be off', options: ['The electricity would be off', 'He had an appointment', 'His phone rang', 'He heard a noise'] },
      { q: 'What did he do with the water?', a: 'Watered the plants', options: ['Watered the plants', 'Cleaned the floor', 'Washed the car', 'Filled the kettle'] },
      { q: 'Where did he sit?', a: 'By the window', options: ['By the window', 'In the kitchen', 'On the veranda', 'At the table'] }
    ]
  },
  {
    body: 'The clinic moved to a new building behind the post office. Lakshmi asked the receptionist for directions and wrote them on the back of her appointment card. She arrived ten minutes early and was seen by Dr Raman.',
    questions: [
      { q: 'Where is the new clinic?', a: 'Behind the post office', options: ['Behind the post office', 'Next to the bank', 'Above the pharmacy', 'Beside the school'] },
      { q: 'Where did Lakshmi write the directions?', a: 'On her appointment card', options: ['On her appointment card', 'In a notebook', 'On her hand', 'On a map'] },
      { q: 'Who saw her?', a: 'Dr Raman', options: ['Dr Raman', 'Dr Shah', 'A nurse', 'The receptionist'] },
      { q: 'How early did she arrive?', a: 'Ten minutes', options: ['Ten minutes', 'Five minutes', 'Twenty minutes', 'On time'] }
    ]
  }
];

function storyRecall(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`story:${form}:${level}`);
  const story = STORIES[Math.floor(rand() * STORIES.length) % STORIES.length];
  const questionCount = Math.min(story.questions.length, countForLevel(level, 2, 1, 4));
  const questions = story.questions.slice(0, questionCount);
  return {
    kind: 'choice',
    study: {
      title: 'Read this short story',
      body: story.body,
      displaySeconds: 20 + level * 5
    },
    trials: questions.map((item, index) => ({
      id: `story-q${index}`,
      prompt: item.q,
      options: shuffle(item.options, rand).map((choice) => u(choice, choice)),
      correctId: item.a,
      practice: index === 0
    }))
  };
}

// ---------------------------------------------------------------------------
// Focus Finder
// ---------------------------------------------------------------------------
const DIRECTIONS = ['Left', 'Right', 'Up', 'Down'];
const ARROWS: Record<string, string> = { Left: '←', Right: '→', Up: '↑', Down: '↓' };

function focusFinder(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`focus:${form}:${level}`);
  const trials: ChoiceTrial[] = Array.from({ length: countForLevel(level, 5, 2, 14) }).map((_, index) => {
    const centre = DIRECTIONS[Math.floor(rand() * 4)];
    const flanker = level <= 1 ? centre : DIRECTIONS[Math.floor(rand() * 4)];
    const row = `${ARROWS[flanker]} ${ARROWS[flanker]} ${ARROWS[centre]} ${ARROWS[flanker]} ${ARROWS[flanker]}`;
    return {
      id: `focus-${index}`,
      prompt: row,
      helper: 'Choose the direction of the middle arrow only.',
      options: DIRECTIONS.map((direction) => u(direction, direction)),
      correctId: centre,
      timeLimitMs: level >= 4 ? 5000 : undefined,
      practice: index === 0
    };
  });
  return { kind: 'choice', trials };
}

// ---------------------------------------------------------------------------
// Colour Conflict
// ---------------------------------------------------------------------------
const COLOURS = [
  { name: 'Red', hex: '#c0392b' },
  { name: 'Blue', hex: '#2f5e9e' },
  { name: 'Green', hex: '#2f6b4f' },
  { name: 'Yellow', hex: '#9a7b1c' }
];

function colourConflict(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`colour:${form}:${level}`);
  const trials: ChoiceTrial[] = Array.from({ length: countForLevel(level, 6, 2, 14) }).map((_, index) => {
    const ink = COLOURS[Math.floor(rand() * COLOURS.length)];
    const congruent = level <= 1 || rand() < 0.3;
    const word = congruent ? ink : COLOURS[Math.floor(rand() * COLOURS.length)];
    return {
      id: `colour-${index}`,
      prompt: 'Choose the ink colour, not the word.',
      inkWord: { text: word.name.toUpperCase(), color: ink.hex },
      options: COLOURS.map((colour) => u(colour.name, colour.name, { color: colour.hex })),
      correctId: ink.name,
      practice: index === 0
    };
  });
  return { kind: 'choice', trials };
}

// ---------------------------------------------------------------------------
// Pattern Detective
// ---------------------------------------------------------------------------
const GLYPHS = ['●', '■', '▲', '◆', '★'];

function patternDetective(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`pattern:${form}:${level}`);
  const trials: ChoiceTrial[] = Array.from({ length: countForLevel(level, 3, 1, 6) }).map((_, index) => {
    const [a, b] = sample(GLYPHS, 2, rand);
    const c = level >= 3 ? sample(GLYPHS, 1, rand)[0] : a;
    const sequence = level <= 2 ? [a, b, a, b] : [a, b, c, a, b, c];
    const answer = level <= 2 ? a : c;
    return {
      id: `pattern-${index}`,
      prompt: `${sequence.join('  ')}  ?`,
      helper: 'Which shape continues the pattern?',
      options: shuffle(GLYPHS.slice(0, 4), rand).map((glyph) => u(glyph, glyph, { glyph })),
      correctId: answer,
      practice: index === 0
    };
  });
  return { kind: 'choice', trials };
}

// ---------------------------------------------------------------------------
// Sequence Logic
// ---------------------------------------------------------------------------
function sequenceLogic(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`sequence:${form}:${level}`);
  const trials: ChoiceTrial[] = Array.from({ length: countForLevel(level, 3, 1, 6) }).map((_, index) => {
    const start = 1 + Math.floor(rand() * 4) + index;
    const step = level <= 2 ? 2 : 2 + Math.floor(rand() * 2);
    const sequence = Array.from({ length: 4 }, (__, i) => start + i * step);
    const answer = start + 4 * step;
    const options = shuffle(
      [answer, answer + step, answer - 1, answer + 2 * step].filter((value, i, arr) => arr.indexOf(value) === i),
      rand
    );
    return {
      id: `logic-${index}`,
      prompt: `${sequence.join(', ')}, ?`,
      helper: 'Choose the number that comes next.',
      options: options.map((value) => u(String(value), String(value))),
      correctId: String(answer),
      practice: index === 0
    };
  });
  return { kind: 'choice', trials };
}

// ---------------------------------------------------------------------------
// Everyday Decision
// ---------------------------------------------------------------------------
const DECISIONS = [
  {
    situation: 'You feel dizzy while cooking. What is the safest first step?',
    answer: 'Sit down and turn off the stove',
    options: ['Sit down and turn off the stove', 'Finish cooking quickly', 'Take an extra tablet', 'Call a neighbour after eating'],
    best: 'Sit down and turn off the stove'
  },
  {
    situation: 'You cannot read the label on a new medicine. What should you do?',
    answer: 'Ask a pharmacist or clinician before taking it',
    options: ['Ask a pharmacist or clinician before taking it', 'Guess from the tablet colour', 'Take half a tablet', 'Ask a friend to read it once'],
    best: 'Ask a pharmacist or clinician before taking it'
  },
  {
    situation: 'A stranger on the phone asks for your bank PIN. What do you do?',
    answer: 'Hang up and never share the PIN',
    options: ['Hang up and never share the PIN', 'Give the first two digits', 'Ask them to call later', 'Share it if they know your name'],
    best: 'Hang up and never share the PIN'
  },
  {
    situation: 'The power goes out at night and the room is dark. What is safest?',
    answer: 'Stay still and use a torch or phone light',
    options: ['Stay still and use a torch or phone light', 'Walk carefully without light', 'Open the front door for light', 'Light a candle near curtains'],
    best: 'Stay still and use a torch or phone light'
  },
  {
    situation: 'You miss your usual bus and have a clinic appointment. What is best?',
    answer: 'Call the clinic and explain you will be late',
    options: ['Call the clinic and explain you will be late', 'Go home without telling anyone', 'Wait for the same bus tomorrow', 'Take a different bus without checking'],
    best: 'Call the clinic and explain you will be late'
  }
];

function everydayDecision(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`decision:${form}:${level}`);
  const count = Math.min(DECISIONS.length, countForLevel(level, 3, 1, 5));
  const selected = sample(DECISIONS, count, rand);
  return {
    kind: 'choice',
    trials: selected.map((item, index) => ({
      id: `decision-${index}`,
      prompt: item.situation,
      options: shuffle(item.options, rand).map((choice) => u(choice, choice)),
      correctId: item.best,
      practice: index === 0
    }))
  };
}

// ---------------------------------------------------------------------------
// Shape Construction
// ---------------------------------------------------------------------------
function shapeConstruction(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`shape:${form}:${level}`);
  const prompts = [
    { target: 'A square', answer: 'Two matching triangles', options: ['Two matching triangles', 'One circle', 'Three squares', 'Two circles'] },
    { target: 'A rectangle', answer: 'Two matching triangles', options: ['Two matching triangles', 'One triangle', 'Two circles', 'Three squares'] },
    { target: 'A larger triangle', answer: 'Four small triangles', options: ['Four small triangles', 'Two circles', 'Three squares', 'One rectangle'] },
    { target: 'A hexagon', answer: 'Six triangles', options: ['Six triangles', 'Four squares', 'Two circles', 'Three rectangles'] },
    { target: 'A star', answer: 'Two overlapping triangles', options: ['Two overlapping triangles', 'Four circles', 'Three squares', 'One rectangle'] }
  ];
  const selected = sample(prompts, countForLevel(level, 2, 1, 5), rand);
  return {
    kind: 'choice',
    trials: selected.map((item, index) => ({
      id: `shape-${index}`,
      prompt: `Which pieces build ${item.target.toLowerCase()} with no gaps?`,
      helper: `Target: ${item.target}`,
      options: shuffle(item.options, rand).map((choice) => u(choice, choice)),
      correctId: item.answer,
      practice: index === 0
    }))
  };
}

// ---------------------------------------------------------------------------
// Object Naming
// ---------------------------------------------------------------------------
const OBJECTS = [
  { label: 'Spoon', emoji: '🥄' }, { label: 'Chair', emoji: '🪑' }, { label: 'Key', emoji: '🔑' },
  { label: 'Clock', emoji: '🕰️' }, { label: 'Umbrella', emoji: '☂️' }, { label: 'Shoe', emoji: '👟' },
  { label: 'Cup', emoji: '☕' }, { label: 'Comb', emoji: '🪮' }, { label: 'Bucket', emoji: '🪣' },
  { label: 'Scissors', emoji: '✂️' }, { label: 'Toothbrush', emoji: '🪥' }, { label: 'Bicycle', emoji: '🚲' }
];

function objectNaming(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`naming:${form}:${level}`);
  const count = countForLevel(level, 4, 1, 8);
  const items = sample(OBJECTS, count, rand);
  return {
    kind: 'choice',
    trials: items.map((item, index) => {
      const distractors = sample(OBJECTS.filter((other) => other.label !== item.label), 3, rand);
      return {
        id: `name-${index}`,
        prompt: 'What is this?',
        helper: item.emoji,
        options: shuffle([item, ...distractors], rand).map((choice) => u(choice.label, choice.label, { emoji: choice.emoji })),
        correctId: item.label,
        practice: index === 0
      };
    })
  };
}

// ---------------------------------------------------------------------------
// Sentence Understanding
// ---------------------------------------------------------------------------
const SENTENCES = [
  { text: 'The cup is under the table.', answer: 'Cup under table', options: ['Cup under table', 'Cup on table', 'Cup beside chair', 'Cup above shelf'] },
  { text: 'The cat is behind the door.', answer: 'Cat behind door', options: ['Cat behind door', 'Cat on door', 'Cat under bed', 'Cat beside door'] },
  { text: 'Put the key inside the box.', answer: 'Key inside box', options: ['Key inside box', 'Key beside box', 'Key under box', 'Key on box'] },
  { text: 'The woman gives the letter to the man.', answer: 'Woman gives letter to man', options: ['Woman gives letter to man', 'Man gives letter to woman', 'Woman takes letter from man', 'Man reads a letter alone'] },
  { text: 'Before sitting down, please close the window.', answer: 'Close window, then sit', options: ['Close window, then sit', 'Sit, then close window', 'Open the window while sitting', 'Ask someone to close it later'] }
];

function sentenceUnderstanding(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`sentence:${form}:${level}`);
  const count = Math.min(SENTENCES.length, countForLevel(level, 2, 1, 5));
  const items = sample(SENTENCES, count, rand);
  return {
    kind: 'choice',
    trials: items.map((item, index) => ({
      id: `sentence-${index}`,
      prompt: 'Choose the picture description that matches the sentence.',
      helper: item.text,
      options: shuffle(item.options, rand).map((choice) => u(choice, choice)),
      correctId: item.answer,
      practice: index === 0
    }))
  };
}

// ---------------------------------------------------------------------------
// Mental Rotation
// ---------------------------------------------------------------------------
function mentalRotation(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`rotation:${form}:${level}`);
  const glyphs = ['L', 'F', 'P', 'R'];
  return {
    kind: 'choice',
    trials: Array.from({ length: countForLevel(level, 3, 1, 6) }).map((_, index) => {
      const glyph = glyphs[Math.floor(rand() * glyphs.length)];
      const same = rand() < 0.5;
      return {
        id: `rotation-${index}`,
        prompt: 'Are these the same shape?',
        figurePair: {
          glyph,
          rotationA: 0,
          mirrorA: false,
          rotationB: [90, 180, 270][Math.floor(rand() * 3)],
          mirrorB: !same
        },
        options: [u('Same shape', 'same'), u('Different shape', 'different')],
        correctId: same ? 'same' : 'different',
        practice: index === 0
      };
    })
  };
}

// ---------------------------------------------------------------------------
// Symbol–Number Matching
// ---------------------------------------------------------------------------
const SYMBOLS = ['●', '▲', '■', '◆', '★', '✚'];

function symbolNumber(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`symbol-number:${form}:${level}`);
  const symbolCount = Math.min(6, 3 + Math.max(0, level - 1));
  const symbols = SYMBOLS.slice(0, symbolCount);
  const key = symbols.map((symbol, index) => ({ symbol, value: String(index + 1) }));
  return {
    kind: 'choice',
    referenceKey: key,
    trials: Array.from({ length: countForLevel(level, 6, 2, 14) }).map((_, index) => {
      const entry = key[Math.floor(rand() * key.length)];
      return {
        id: `symbol-${index}`,
        prompt: 'Which number belongs to this symbol?',
        helper: entry.symbol,
        options: key.map((item) => u(item.value, item.value)),
        correctId: entry.value,
        timeLimitMs: level >= 4 ? 6000 : undefined,
        practice: index === 0
      };
    })
  };
}

// ---------------------------------------------------------------------------
// Rapid Pattern Comparison
// ---------------------------------------------------------------------------
function rapidComparison(level: number, form: string): ChoiceContent {
  const rand = seededRandom(`compare:${form}:${level}`);
  const size = level >= 4 ? 16 : 9;
  return {
    kind: 'choice',
    trials: Array.from({ length: countForLevel(level, 6, 2, 14) }).map((_, index) => {
      const left = Array.from({ length: size }, () => (rand() < 0.45 ? '●' : '○'));
      const same = rand() < 0.5;
      const right = [...left];
      if (!same) {
        const change = Math.floor(rand() * size);
        right[change] = right[change] === '●' ? '○' : '●';
      }
      return {
        id: `compare-${index}`,
        prompt: 'Are these two patterns identical?',
        patternPair: { left, right },
        options: [u('Same', 'same'), u('Different', 'different')],
        correctId: same ? 'same' : 'different',
        timeLimitMs: level >= 4 ? 5000 : undefined,
        practice: index === 0
      };
    })
  };
}

export function generateChoiceContent(taskId: string, level: number, form: string): ChoiceContent | null {
  switch (taskId) {
    case 'memory.face-name': return faceNames(level, form);
    case 'memory.word-list': return wordList(level, form);
    case 'memory.story-recall': return storyRecall(level, form);
    case 'attention.focus-finder': return focusFinder(level, form);
    case 'executive.colour-conflict': return colourConflict(level, form);
    case 'reasoning.pattern-detective': return patternDetective(level, form);
    case 'reasoning.sequence-logic': return sequenceLogic(level, form);
    case 'reasoning.everyday-decision': return everydayDecision(level, form);
    case 'reasoning.shape-construction': return shapeConstruction(level, form);
    case 'language.object-naming': return objectNaming(level, form);
    case 'language.sentence-understanding': return sentenceUnderstanding(level, form);
    case 'visuospatial.mental-rotation': return mentalRotation(level, form);
    case 'processing.symbol-number': return symbolNumber(level, form);
    case 'processing.rapid-comparison': return rapidComparison(level, form);
    default: return null;
  }
}

