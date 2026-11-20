import { defineTask } from './types';

const five = (a: string, b: string, c: string, d: string, e: string): [string, string, string, string, string] => [a, b, c, d, e];

export const executiveTasks = [
  defineTask({
    id: 'executive.rule-switch',
    name: 'Rule Switch',
    domain: 'EXECUTIVE',
    subdomain: 'Cognitive flexibility',
    description: 'Sort cards by one rule, then switch to a different sorting rule when instructed.',
    instructions: 'At the top of each round you will see the current rule. Choose the bin that matches the card according to that rule.',
    example: 'Rule: colour → put a red card in Red. Rule changes to shape → put a red square in Squares.',
    difficultyLevels: five('6 cards, colour only', '8 cards, colour only', '8 cards with one rule switch', '10 cards with two switches', '12 cards with alternating rules'),
    durationMinutes: 3,
    scoringMethod: 'Correct sorts ÷ trials. Post-switch errors are recorded separately.',
    responseType: 'Choose one of three bins',
    accessibilityRequirements: ['Rule always visible in text', 'Colour and shape labelled', 'No time limit'],
    playerKind: 'sort',
    practiceRecommended: true
  }),
  defineTask({
    id: 'executive.planning-tower',
    name: 'Planning Tower',
    domain: 'EXECUTIVE',
    subdomain: 'Planning and problem-solving',
    description: 'Move discs between pegs to match a target arrangement while following stacking rules.',
    instructions: 'Move all discs to the target peg. You may only move the top disc, and a larger disc may never sit on a smaller one. Plan before you move.',
    example: 'Move the two discs from the left peg to the right peg in three moves.',
    difficultyLevels: five('2 discs', '3 discs', '3 discs with a move limit', '4 discs', '4 discs with a tighter move limit'),
    durationMinutes: 4,
    scoringMethod: 'Solved or not solved, moves used, rule violations, and completion time recorded descriptively.',
    responseType: 'Tap peg to select, tap another to move',
    accessibilityRequirements: ['Large pegs', 'Move counter visible', 'Undo available', 'No dragging required'],
    playerKind: 'tower',
    motorDemand: 'fine'
  }),
  defineTask({
    id: 'executive.connect-sequence',
    name: 'Connect the Sequence',
    domain: 'EXECUTIVE',
    subdomain: 'Sequencing and set shifting',
    description: 'Connect numbered circles in order, or alternate between numbers and letters in the harder form.',
    instructions: 'Tap the circles in order. Start at 1 and continue upwards. In the alternating form, go 1 → A → 2 → B.',
    example: '1 → 2 → 3 → 4. Alternating: 1 → A → 2 → B → 3.',
    difficultyLevels: five('Numbers 1–5', 'Numbers 1–7', 'Numbers 1–9', 'Numbers and letters alternating to C', 'Alternating to E with closer spacing'),
    durationMinutes: 2,
    scoringMethod: 'Correct sequence steps ÷ required steps. Order errors and completion time recorded.',
    responseType: 'Ordered taps',
    accessibilityRequirements: ['Large nodes', 'Clear next-step hint available', 'No drag lines required'],
    playerKind: 'trail'
  }),
  defineTask({
    id: 'executive.colour-conflict',
    name: 'Colour Conflict',
    domain: 'EXECUTIVE',
    subdomain: 'Interference control',
    description: 'Identify the ink colour of a word while ignoring what the word says.',
    instructions: 'Choose the colour of the ink, not the meaning of the word.',
    example: 'The word BLUE printed in red ink → choose Red.',
    difficultyLevels: five('6 trials, congruent', '8 trials, some conflict', '10 trials, mostly conflict', '12 trials, faster', '14 trials with mixed conflict'),
    durationMinutes: 2,
    scoringMethod: 'Correct ink-colour choices ÷ trials. Conflict errors recorded.',
    responseType: 'Colour choice buttons with text labels',
    accessibilityRequirements: ['Colour names always written', 'Colour-blind-safe palette', 'No time limit'],
    playerKind: 'choice'
  }),
  defineTask({
    id: 'executive.daily-schedule',
    name: 'Daily Schedule Planner',
    domain: 'EXECUTIVE',
    subdomain: 'Planning and organisation',
    description: 'Place everyday appointments into suitable time slots while respecting fixed times and avoiding clashes.',
    instructions: 'Each activity has a preferred time. Choose the slot that matches it. Some activities must happen in the morning or afternoon.',
    example: '“Take medicine at 08:00” → Morning slot. “Lunch with Ravi at 13:00” → Afternoon slot.',
    difficultyLevels: five('3 activities, 3 slots', '4 activities', '5 activities with one conflict', '6 activities with two constraints', '7 activities with a fixed appointment'),
    durationMinutes: 3,
    scoringMethod: 'Correctly placed activities ÷ activities. Constraint violations recorded.',
    responseType: 'Assign each activity to a time slot',
    accessibilityRequirements: ['Large slot buttons', 'Times written in 12-hour and 24-hour format', 'No drag required'],
    playerKind: 'schedule'
  })
];
