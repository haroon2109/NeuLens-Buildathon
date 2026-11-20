import { seededRandom, shuffle } from './generatorsChoice';
import type {
  BudgetContent,
  ClockContent,
  FluencyContent,
  GridContent,
  OrderContent,
  PairContent,
  RouteContent,
  ScheduleContent,
  SearchContent,
  SequenceContent,
  SortContent,
  TapStreamContent,
  TaskContent,
  TowerContent,
  TrailContent
} from './contentTypes';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const count = (level: number, base: number, step = 1, max = 9) => clamp(base + (level - 1) * step, base, max);

const PICTURES = [
  { emoji: '☕', label: 'Cup' }, { emoji: '🔑', label: 'Key' }, { emoji: '👟', label: 'Shoe' },
  { emoji: '🕰️', label: 'Clock' }, { emoji: '📘', label: 'Book' }, { emoji: '🍎', label: 'Apple' },
  { emoji: '🪑', label: 'Chair' }, { emoji: '☂️', label: 'Umbrella' }, { emoji: '🧺', label: 'Basket' },
  { emoji: '🪥', label: 'Brush' }
];

function pictureSequence(level: number, form: string): SequenceContent {
  const rand = seededRandom(`picture-seq:${form}:${level}`);
  const items = shuffle(PICTURES, rand).slice(0, count(level, 3, 1, 7));
  return {
    kind: 'sequence-recall',
    prompt: 'Tap the pictures in the same order you saw them.',
    items: items.map((item, index) => ({ id: `pic-${index}`, ...item })),
    displayMs: level >= 5 ? 1300 : level >= 3 ? 1700 : 2200
  };
}

function objectLocation(level: number, form: string): GridContent {
  const rand = seededRandom(`object-loc:${form}:${level}`);
  const grid = level === 1 ? 2 : level <= 4 ? 3 : 4;
  const itemCount = count(level, 4, 1, 8);
  const cells = shuffle(Array.from({ length: grid * grid }, (_, index) => index), rand).slice(0, itemCount);
  const objects = shuffle(PICTURES, rand).slice(0, itemCount);
  return {
    kind: 'grid-recall',
    prompt: 'Tap the cell where each object was shown.',
    cols: grid,
    rows: grid,
    items: objects.map((object, index) => ({
      id: `loc-${index}`,
      emoji: object.emoji,
      label: object.label,
      cell: cells[index]
    })),
    displayMs: 2500 + itemCount * 900
  };
}

function targetDetection(level: number, form: string): TapStreamContent {
  const rand = seededRandom(`target:${form}:${level}`);
  const total = clamp(16 + (level - 1) * 4, 16, 32);
  const symbols = Array.from({ length: total }, (_, index) => {
    const isTarget = rand() < 0.3;
    return {
      id: `sym-${index}`,
      symbol: isTarget ? '●' : ['▲', '■', '◆'][Math.floor(rand() * 3)],
      isTarget
    };
  });
  return {
    kind: 'tap-stream',
    mode: 'target',
    instruction: 'Tap only when you see ●. Do not tap for other symbols.',
    targetLabel: '●',
    symbols,
    displayMs: Math.max(1000, 2000 - (level - 1) * 250)
  };
}

function goNoGo(level: number, form: string): TapStreamContent {
  const rand = seededRandom(`gonogo:${form}:${level}`);
  const total = clamp(12 + (level - 1) * 4, 12, 28);
  const symbols = Array.from({ length: total }, (_, index) => {
    const isTarget = rand() < 0.65;
    return {
      id: `go-${index}`,
      symbol: isTarget ? '🟢' : '🟥',
      isTarget
    };
  });
  return {
    kind: 'tap-stream',
    mode: 'go-nogo',
    instruction: 'Tap for green circles. Do not tap for red squares.',
    targetLabel: '🟢',
    symbols,
    displayMs: Math.max(900, 2000 - (level - 1) * 250)
  };
}

function prospectiveMemory(level: number, form: string): TapStreamContent {
  const rand = seededRandom(`prospective:${form}:${level}`);
  const total = 14 + level * 2;
  const firstCue = clamp(5 + level, 6, total - 2);
  const symbols = Array.from({ length: total }, (_, index) => ({
    id: `pro-${index}`,
    symbol: index === firstCue || (level >= 4 && index === firstCue + 5) ? '★' : ['●', '▲', '■'][Math.floor(rand() * 3)],
    isTarget: false,
    isCue: index === firstCue || (level >= 4 && index === firstCue + 5)
  }));
  return {
    kind: 'tap-stream',
    mode: 'prospective',
    instruction: 'Keep responding to the shapes. When you see a star ★, tap the Reminder button.',
    targetLabel: '★',
    symbols,
    displayMs: 1500,
    cuePrompt: 'Tap Reminder when the star appears'
  };
}

function soundRecognition(level: number, form: string): TapStreamContent {
  const rand = seededRandom(`sound:${form}:${level}`);
  const total = clamp(6 + (level - 1) * 2, 6, 14);
  const patterns = Array.from({ length: total }, (_, index) => {
    const isTarget = rand() < 0.5;
    const pattern = isTarget ? [660, 660] : rand() < 0.5 ? [440, 440] : [440, 660];
    return {
      id: `sound-${index}`,
      symbol: '♪',
      isTarget,
      tone: pattern
    };
  });
  return {
    kind: 'tap-stream',
    mode: 'target',
    instruction: 'Listen to each tone pattern. Tap when you hear two high beeps.',
    targetLabel: 'High–High',
    symbols: patterns,
    displayMs: 1600,
    audioOptions: patterns.map((pattern) => ({
      id: pattern.id,
      label: pattern.isTarget ? 'High–High' : 'Other pattern',
      pattern: pattern.tone,
      correct: pattern.isTarget
    }))
  };
}

function ruleSwitch(level: number, form: string): SortContent {
  const rand = seededRandom(`rule:${form}:${level}`);
  const colours: Array<'red' | 'blue' | 'green'> = ['red', 'blue', 'green'];
  const shapes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];
  const rounds = Array.from({ length: level <= 2 ? 1 : level === 3 ? 2 : level === 4 ? 3 : 4 }).map((_, roundIndex) => {
    const rule: 'colour' | 'shape' = roundIndex === 0 ? 'colour' : roundIndex % 2 === 0 ? 'shape' : 'colour';
    const cards = Array.from({ length: level <= 2 ? 6 : 4 }).map((__, cardIndex) => {
      const colour = colours[Math.floor(rand() * 3)];
      const shape = shapes[Math.floor(rand() * 3)];
      const value = 1 + Math.floor(rand() * 2);
      const binId = rule === 'colour' ? colour : shape;
      return {
        id: `card-${roundIndex}-${cardIndex}`,
        label: `${value} ${colour} ${shape}`,
        color: colour,
        shape,
        count: value,
        binId
      };
    });
    const bins = (rule === 'colour' ? colours : shapes).map((value) => ({ id: value, label: value }));
    const correctBin: Record<string, string> = {};
    for (const card of cards) correctBin[card.id] = rule === 'colour' ? card.color : card.shape;
    return {
      id: `round-${roundIndex}`,
      rule,
      ruleLabel: rule === 'colour' ? 'Sort by COLOUR' : 'Sort by SHAPE',
      cards: cards.map(({ binId, ...card }) => card),
      bins,
      correctBin
    };
  });
  return { kind: 'sort', rounds };
}

function pairedAssociation(level: number, form: string): PairContent {
  const rand = seededRandom(`pairs:${form}:${level}`);
  const objects = shuffle(PICTURES, rand).slice(0, count(level, 3, 1, 7));
  return {
    kind: 'pair-match',
    prompt: 'Choose the partner that was shown with each object.',
    pairs: objects.map((object, index) => {
      const partner = objects[(index + 1) % objects.length];
      return {
        id: `pair-${index}`,
        emoji: object.emoji,
        label: object.label,
        partnerEmoji: partner.emoji,
        partnerLabel: partner.label
      };
    }),
    studyMs: 1800 + level * 300
  };
}

function tower(level: number, form: string): TowerContent {
  const disks = level <= 1 ? 2 : level <= 3 ? 3 : 4;
  return {
    kind: 'tower',
    disks,
    pegs: 3,
    maxMoves: level === 1 ? 4 : level === 2 ? 9 : level === 3 ? 9 : level === 4 ? 20 : 16
  };
}

function trail(level: number, form: string): TrailContent {
  const rand = seededRandom(`trail:${form}:${level}`);
  const alternating = level >= 4;
  const numberCount = alternating ? count(level, 3, 1, 5) : count(level, 5, 1, 9);
  const labels: string[] = [];
  for (let i = 1; i <= numberCount; i += 1) {
    labels.push(String(i));
    if (alternating) labels.push(String.fromCharCode(64 + i));
  }
  const nodes = labels.map((label, index) => ({
    id: `node-${index}`,
    label,
    x: 8 + ((index * 29 + (index % 3) * 7) % 84),
    y: 12 + ((index * 37 + (index % 4) * 9) % 72)
  }));
  return {
    kind: 'trail',
    prompt: alternating
      ? 'Tap in order: 1 → A → 2 → B → 3 → C…'
      : 'Tap the numbers in order, starting at 1.',
    nodes: shuffle(nodes, rand),
    correctOrder: nodes.map((node) => node.id)
  };
}

const SLOTS = [
  { id: 'morning', label: 'Morning', time: '08:00' },
  { id: 'midday', label: 'Midday', time: '12:00' },
  { id: 'afternoon', label: 'Afternoon', time: '15:00' },
  { id: 'evening', label: 'Evening', time: '19:00' }
];

function dailySchedule(level: number, form: string): ScheduleContent {
  const rand = seededRandom(`schedule:${form}:${level}`);
  const activities = [
    { label: 'Take morning medicine', emoji: '💊', slotId: 'morning', time: '08:00' },
    { label: 'Lunch with Ravi', emoji: '🍽️', slotId: 'midday', time: '12:00' },
    { label: 'Physiotherapy', emoji: '🦵', slotId: 'afternoon', time: '15:00' },
    { label: 'Evening walk', emoji: '🚶', slotId: 'evening', time: '19:00' },
    { label: 'Call daughter', emoji: '📞', slotId: 'evening', time: '19:00' },
    { label: 'Eye drops', emoji: '💧', slotId: 'morning', time: '08:00' }
  ];
  const selected = shuffle(activities, rand).slice(0, count(level, 3, 1, 6));
  return {
    kind: 'schedule',
    prompt: 'Choose the correct time slot for each activity.',
    slots: SLOTS,
    events: selected.map((activity, index) => ({ id: `event-${index}`, ...activity }))
  };
}

function clockConstruction(level: number, form: string): ClockContent {
  const times = [
    { hour: 3, minute: 0 },
    { hour: 6, minute: 30 },
    { hour: 10, minute: 10 },
    { hour: 2, minute: 45 },
    { hour: 11, minute: 5 }
  ];
  const target = times[Math.min(times.length - 1, level - 1)];
  return {
    kind: 'clock',
    prompt: 'Set the clock hands to the time shown.',
    targetHour: target.hour,
    targetMinute: target.minute
  };
}

function routeFinder(level: number, form: string): RouteContent {
  const rand = seededRandom(`route:${form}:${level}`);
  const size = level <= 1 ? 4 : level <= 3 ? 5 : 6;
  const total = size * size;
  const path = new Set<number>();
  for (let col = 0; col < size; col += 1) path.add(col);
  for (let row = 0; row < size; row += 1) path.add(row * size + (size - 1));
  const blocked = Array.from({ length: total }, (_, index) => index)
    .filter((index) => !path.has(index) && index !== 0 && index !== total - 1 && rand() < 0.18);
  return {
    kind: 'route',
    cols: size,
    rows: size,
    start: 0,
    end: total - 1,
    blocked,
    maxMoves: size * size
  };
}

function medicationSchedule(level: number, form: string): OrderContent {
  const rand = seededRandom(`meds:${form}:${level}`);
  const times = shuffle(['08:00', '10:30', '13:00', '16:00', '20:00', '22:00', '07:00'], rand)
    .slice(0, count(level, 3, 1, 7));
  const correctOrder = [...times].sort((a, b) => a.localeCompare(b));
  return {
    kind: 'order',
    prompt: 'Arrange these simulated medication times from earliest to latest.',
    helper: 'This is a scheduling simulation, not medical advice.',
    items: times.map((time) => ({ id: `time-${time}`, label: time, emoji: '🕰️' })),
    correctOrder: correctOrder.map((time) => `time-${time}`)
  };
}

function shoppingBudget(level: number, form: string): BudgetContent {
  const rand = seededRandom(`budget:${form}:${level}`);
  const pool = [
    { label: 'Bread', emoji: '🍞', price: 30 }, { label: 'Milk', emoji: '🥛', price: 25 },
    { label: 'Tea', emoji: '🍵', price: 40 }, { label: 'Rice', emoji: '🍚', price: 55 },
    { label: 'Soap', emoji: '🧼', price: 20 }, { label: 'Fruit', emoji: '🍎', price: 35 },
    { label: 'Oil', emoji: '🫗', price: 60 }
  ];
  const items = shuffle(pool, rand).slice(0, count(level, 2, 1, 5));
  const budget = Math.ceil(items.reduce((sum, item) => sum + item.price, 0) / 10) * 10 + 20;
  const target = items.slice(0, Math.max(2, items.length - 1));
  const spent = target.reduce((sum, item) => sum + item.price, 0);
  const remainder = budget - spent;
  const options = shuffle([remainder, remainder + 10, Math.max(0, remainder - 5), remainder + 5], rand)
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((value) => ({ id: `rem-${value}`, label: `${value}`, value }));
  return {
    kind: 'budget',
    prompt: `Choose the items on the list and stay within ${budget}.`,
    budget,
    currency: '₹',
    items: items.map((item, index) => ({ id: `item-${index}`, ...item })),
    remainderPrompt: 'How much money is left?',
    remainderOptions: options,
    correctRemainderId: `rem-${remainder}`
  };
}

const ACTIVITY_STEPS = [
  {
    title: 'Make tea',
    steps: ['Boil water', 'Add tea leaves', 'Pour into a cup', 'Add milk', 'Stir and serve']
  },
  {
    title: 'Prepare for an appointment',
    steps: ['Check the appointment time', 'Gather documents', 'Arrange transport', 'Leave home', 'Check in at reception']
  },
  {
    title: 'Wash your hands',
    steps: ['Wet hands', 'Apply soap', 'Rub for 20 seconds', 'Rinse', 'Dry hands']
  }
];

function activitySequencing(level: number, form: string): OrderContent {
  const rand = seededRandom(`activity:${form}:${level}`);
  const activity = ACTIVITY_STEPS[Math.floor(rand() * ACTIVITY_STEPS.length) % ACTIVITY_STEPS.length];
  const steps = activity.steps.slice(0, clamp(count(level, 3, 1, 5), 3, activity.steps.length));
  const items = steps.map((step, index) => ({ id: `step-${index}`, label: step, emoji: '•' }));
  return {
    kind: 'order',
    prompt: `Put the steps for “${activity.title}” in the correct order.`,
    items: shuffle(items, rand),
    correctOrder: items.map((item) => item.id)
  };
}

function categoryFluency(level: number, form: string): FluencyContent {
  const categories = ['animals', 'fruits', 'things in a kitchen', 'clothing', 'names of places'];
  const category = categories[(level - 1) % categories.length];
  return {
    kind: 'fluency',
    prompt: `Name as many ${category} as you can.`,
    category,
    seconds: level <= 2 ? 30 : level === 3 ? 25 : 20,
    minTarget: 6
  };
}

export function generateOtherContent(taskId: string, level: number, form: string): TaskContent | null {
  switch (taskId) {
    case 'memory.picture-sequence': return pictureSequence(level, form);
    case 'memory.object-location': return objectLocation(level, form);
    case 'memory.prospective-memory': return prospectiveMemory(level, form);
    case 'memory.paired-association': return pairedAssociation(level, form);
    case 'attention.target-detection': return targetDetection(level, form);
    case 'attention.visual-search': return visualSearch(level, form);
    case 'attention.go-no-go': return goNoGo(level, form);
    case 'attention.sound-recognition': return soundRecognition(level, form);
    case 'executive.rule-switch': return ruleSwitch(level, form);
    case 'executive.planning-tower': return tower(level, form);
    case 'executive.connect-sequence': return trail(level, form);
    case 'executive.daily-schedule': return dailySchedule(level, form);
    case 'visuospatial.clock-construction': return clockConstruction(level, form);
    case 'visuospatial.route-finder': return routeFinder(level, form);
    case 'functional.medication-schedule': return medicationSchedule(level, form);
    case 'functional.shopping-budget': return shoppingBudget(level, form);
    case 'functional.activity-sequencing': return activitySequencing(level, form);
    case 'language.category-fluency': return categoryFluency(level, form);
    default: return null;
  }
}

function visualSearch(level: number, form: string): SearchContent {
  const rand = seededRandom(`search:${form}:${level}`);
  const cols = 6;
  const rows = 4;
  const shapes = ['●', '■', '▲', '◆'];
  const colours = ['#2f5e4e', '#b4552d', '#31557b'];
  const targetCount = level <= 2 ? 1 : level <= 4 ? 2 : 3;
  const targetSymbol = shapes[Math.floor(rand() * shapes.length)];
  const targetColour = colours[Math.floor(rand() * colours.length)];
  const cellCount = cols * rows;
  const targetCells = new Set<number>();
  while (targetCells.size < targetCount) targetCells.add(Math.floor(rand() * cellCount));
  return {
    kind: 'visual-search',
    targetLabel: `${targetSymbol} in this colour`,
    targetSymbol,
    cols,
    rows,
    seconds: level <= 2 ? 30 : level === 3 ? 25 : 20,
    cells: Array.from({ length: cellCount }, (_, index) => {
      const isTarget = targetCells.has(index);
      const symbol = isTarget ? targetSymbol : shapes[Math.floor(rand() * shapes.length)];
      return {
        id: `cell-${index}`,
        symbol,
        glyph: symbol,
        color: isTarget ? targetColour : colours[Math.floor(rand() * colours.length)],
        isTarget
      };
    })
  };
}
