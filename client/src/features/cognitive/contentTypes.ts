/** Typed stimulus content consumed by the task player. */

export interface ChoiceOption {
  id: string;
  label: string;
  emoji?: string;
  /** Large glyph used for shape/pattern tasks. */
  glyph?: string;
  rotation?: number;
  mirror?: boolean;
  color?: string;
}

export interface ChoiceTrial {
  id: string;
  prompt: string;
  helper?: string;
  options: ChoiceOption[];
  correctId: string;
  /** Multi-select trial (word-list recognition). */
  multi?: boolean;
  correctIds?: string[];
  timeLimitMs?: number;
  audioPattern?: number[];
  /** Two mini-grids for rapid comparison. */
  patternPair?: { left: string[]; right: string[] };
  /** Ink-colour word for the Colour Conflict activity. */
  inkWord?: { text: string; color: string };
  /** Two rotated/mirrored figures for Mental Rotation. */
  figurePair?: {
    glyph: string;
    rotationA: number;
    mirrorA: boolean;
    rotationB: number;
    mirrorB: boolean;
  };
  practice?: boolean;
}

export interface ChoiceContent {
  kind: 'choice';
  study?: {
    title: string;
    body?: string;
    items?: Array<{ emoji?: string; label: string }>;
    displaySeconds?: number;
  };
  referenceKey?: Array<{ symbol: string; value: string }>;
  trials: ChoiceTrial[];
}

export interface SequenceItem {
  id: string;
  emoji: string;
  label: string;
}

export interface SequenceContent {
  kind: 'sequence-recall';
  prompt: string;
  items: SequenceItem[];
  displayMs: number;
}

export interface GridContent {
  kind: 'grid-recall';
  prompt: string;
  cols: number;
  rows: number;
  items: Array<SequenceItem & { cell: number }>;
  displayMs: number;
}

export interface StreamSymbol {
  id: string;
  symbol: string;
  isTarget: boolean;
  isCue?: boolean;
  tone?: number[];
}

export interface TapStreamContent {
  kind: 'tap-stream';
  mode: 'target' | 'go-nogo' | 'prospective';
  instruction: string;
  targetLabel: string;
  symbols: StreamSymbol[];
  displayMs: number;
  cuePrompt?: string;
  /** Options for the sound-recognition variant. */
  audioOptions?: Array<{ id: string; label: string; pattern?: number[]; correct: boolean }>;
}

export interface SearchContent {
  kind: 'visual-search';
  targetLabel: string;
  targetSymbol: string;
  cols: number;
  rows: number;
  seconds: number;
  cells: Array<{ id: string; symbol: string; glyph: string; color: string; isTarget: boolean }>;
}

export interface SortCard {
  id: string;
  label: string;
  color: 'red' | 'blue' | 'green';
  shape: 'circle' | 'square' | 'triangle';
  count: number;
}

export interface SortRound {
  id: string;
  rule: 'colour' | 'shape' | 'count';
  ruleLabel: string;
  cards: SortCard[];
  bins: Array<{ id: string; label: string }>;
  correctBin: Record<string, string>;
}

export interface SortContent {
  kind: 'sort';
  rounds: SortRound[];
}

export interface PairContent {
  kind: 'pair-match';
  prompt: string;
  pairs: Array<{ id: string; emoji: string; label: string; partnerEmoji: string; partnerLabel: string }>;
  studyMs: number;
}

export interface OrderContent {
  kind: 'order';
  prompt: string;
  helper?: string;
  items: Array<{ id: string; label: string; emoji?: string }>;
  correctOrder: string[];
}

export interface ScheduleContent {
  kind: 'schedule';
  prompt: string;
  slots: Array<{ id: string; label: string; time: string }>;
  events: Array<{ id: string; label: string; emoji: string; time: string; slotId: string }>;
}

export interface BudgetContent {
  kind: 'budget';
  prompt: string;
  budget: number;
  currency: string;
  items: Array<{ id: string; label: string; emoji: string; price: number }>;
  requiredItemId?: string;
  remainderPrompt: string;
  remainderOptions: Array<{ id: string; label: string; value: number }>;
  correctRemainderId: string;
}

export interface ClockContent {
  kind: 'clock';
  prompt: string;
  targetHour: number;
  targetMinute: number;
}

export interface FluencyContent {
  kind: 'fluency';
  prompt: string;
  category: string;
  seconds: number;
  minTarget: number;
}

export interface TowerContent {
  kind: 'tower';
  disks: number;
  pegs: number;
  maxMoves: number;
}

export interface TrailContent {
  kind: 'trail';
  prompt: string;
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
  correctOrder: string[];
}

export interface RouteContent {
  kind: 'route';
  cols: number;
  rows: number;
  start: number;
  end: number;
  blocked: number[];
  maxMoves: number;
}

export type TaskContent =
  | ChoiceContent
  | SequenceContent
  | GridContent
  | TapStreamContent
  | SearchContent
  | SortContent
  | PairContent
  | OrderContent
  | ScheduleContent
  | BudgetContent
  | ClockContent
  | FluencyContent
  | TowerContent
  | TrailContent
  | RouteContent;

export interface RawTrial {
  index: number;
  correct: boolean;
  responseMs: number;
  missed?: boolean;
  practice?: boolean;
  response?: unknown;
}
