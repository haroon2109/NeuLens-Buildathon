import { defineTask } from './types';

const five = (a: string, b: string, c: string, d: string, e: string): [string, string, string, string, string] => [a, b, c, d, e];

export const visuospatialTasks = [
  defineTask({
    id: 'visuospatial.mental-rotation',
    name: 'Mental Rotation',
    domain: 'VISUOSPATIAL',
    subdomain: 'Spatial visualisation',
    description: 'Decide whether two rotated figures show the same shape or a mirrored different shape.',
    instructions: 'Look at both shapes. Choose “Same” if one is simply turned, or “Different” if it is a mirror or changed shape.',
    example: 'An L rotated 90° is the same shape. A mirror-image L is different.',
    difficultyLevels: five('2 simple shapes, small rotation', '3 shapes', '3 shapes with mirror pairs', '4 shapes, larger rotations', '5 shapes, mixed rotation and mirror'),
    durationMinutes: 2,
    scoringMethod: 'Correct same/different judgements ÷ trials.',
    responseType: 'Same / Different',
    accessibilityRequirements: ['High-contrast outlines', 'Large figures', 'No time limit'],
    playerKind: 'choice',
    visualDetail: 'detailed'
  }),
  defineTask({
    id: 'visuospatial.clock-construction',
    name: 'Clock Construction',
    domain: 'VISUOSPATIAL',
    subdomain: 'Visuospatial organisation and planning',
    description: 'Set the hands on a clock face to show a requested time.',
    instructions: 'Use the hour and minute controls to set the clock to the time shown in the instruction.',
    example: '“Set the clock to 10:10.” Move the short hand near 10 and the long hand to 2.',
    difficultyLevels: five('3:00', '6:30', '10:10', '2:45', '11:05 with a distractor'),
    durationMinutes: 3,
    scoringMethod: 'Hour-hand and minute-hand accuracy scored separately.',
    responseType: 'Adjustable clock hands',
    accessibilityRequirements: ['Large controls', 'Digital time shown alongside', 'Assisted entry option for motor difficulty'],
    playerKind: 'clock',
    motorDemand: 'fine'
  }),
  defineTask({
    id: 'visuospatial.route-finder',
    name: 'Route Finder',
    domain: 'VISUOSPATIAL',
    subdomain: 'Spatial navigation and planning',
    description: 'Navigate a simple map from a start point to a destination while avoiding blocked paths.',
    instructions: 'Tap neighbouring squares to move from START to HOME. You cannot cross walls or blocked squares.',
    example: 'Move right twice, then down once to reach home.',
    difficultyLevels: five('4×4 map', '5×5 map', '5×5 with obstacles', '6×6 with obstacles', '6×6 with one-way planning'),
    durationMinutes: 3,
    scoringMethod: 'Destination reached, valid moves, blocked attempts and path length recorded.',
    responseType: 'Adjacent grid taps',
    accessibilityRequirements: ['Large map cells', 'Clear start and home markers', 'Obstacle patterns plus labels'],
    playerKind: 'route'
  })
];

export const functionalTasks = [
  defineTask({
    id: 'functional.medication-schedule',
    name: 'Medication Schedule Simulation',
    domain: 'FUNCTIONAL',
    subdomain: 'Everyday prospective memory and sequencing',
    description: 'Put simulated medication times in the correct order across a day.',
    instructions: 'Arrange the medication times from earliest to latest. This is a simulation, not medical advice.',
    example: '08:00 → 13:00 → 20:00.',
    difficultyLevels: five('3 times', '4 times', '5 times', '6 times with a repeated time', '7 times with morning/evening labels only'),
    durationMinutes: 3,
    scoringMethod: 'Correctly ordered positions ÷ items. This activity does not recommend any medication regimen.',
    responseType: 'Ordered list',
    accessibilityRequirements: ['Large labels', '12-hour and 24-hour times', 'No real medication names required'],
    playerKind: 'order'
  }),
  defineTask({
    id: 'functional.shopping-budget',
    name: 'Shopping and Budget Challenge',
    domain: 'FUNCTIONAL',
    subdomain: 'Functional numeracy and planning',
    description: 'Choose items within a budget and work out the remaining amount.',
    instructions: 'Select items that stay within the budget. Then choose how much money is left.',
    example: 'Budget 100. Bread 30 and tea 25 → 45 left.',
    difficultyLevels: five('2 items, round prices', '3 items', '4 items', '4 items with a required item', '5 items with a discount'),
    durationMinutes: 3,
    scoringMethod: 'Budget-valid selection and correct remainder recorded as separate trials.',
    responseType: 'Item selection and single choice',
    accessibilityRequirements: ['Large price labels', 'Currency-neutral option', 'Calculator not required'],
    playerKind: 'budget',
    motorDemand: 'fine'
  }),
  defineTask({
    id: 'functional.activity-sequencing',
    name: 'Everyday Activity Sequencing',
    domain: 'FUNCTIONAL',
    subdomain: 'Sequencing and practical organisation',
    description: 'Arrange the steps of a familiar daily activity into the correct order.',
    instructions: 'Put the steps in the order you would actually do them.',
    example: 'Boil water → add tea → pour → add milk.',
    difficultyLevels: five('3 steps', '4 steps', '5 steps', '6 steps', '7 steps with two plausible orders'),
    durationMinutes: 2,
    scoringMethod: 'Correctly ordered steps ÷ steps.',
    responseType: 'Ordered list',
    accessibilityRequirements: ['Large step cards', 'Move up/down buttons', 'No drag required'],
    playerKind: 'order'
  })
];

export const processingSpeedTasks = [
  defineTask({
    id: 'processing.symbol-number',
    name: 'Symbol–Number Matching',
    domain: 'PROCESSING_SPEED',
    subdomain: 'Processing speed and visual scanning',
    description: 'Match symbols to numbers using a reference key, as quickly and accurately as possible.',
    instructions: 'A key at the top shows which number belongs to each symbol. Choose the number for the symbol shown.',
    example: '● = 1, ▲ = 2. If the symbol is ▲, choose 2.',
    difficultyLevels: five('6 trials, 3 symbols', '8 trials, 4 symbols', '10 trials, 5 symbols', '12 trials, 6 symbols', '14 trials, 6 symbols, shorter limit'),
    durationMinutes: 2,
    scoringMethod: 'Correct matches ÷ trials. Median response time recorded descriptively.',
    responseType: 'Number choice',
    accessibilityRequirements: ['Key always visible', 'Large symbols and numbers', 'No colour-only mapping'],
    playerKind: 'choice',
    practiceRecommended: true
  }),
  defineTask({
    id: 'processing.rapid-comparison',
    name: 'Rapid Pattern Comparison',
    domain: 'PROCESSING_SPEED',
    subdomain: 'Processing speed and discrimination',
    description: 'Decide whether two visual patterns are identical or different, as quickly as is comfortable.',
    instructions: 'Look at both patterns. Choose “Same” or “Different”.',
    example: 'Two identical grids → Same. One changed cell → Different.',
    difficultyLevels: five('6 pairs, 3×3 grids', '8 pairs', '10 pairs', '12 pairs, 4×4 grids', '14 pairs, 4×4 grids, shorter limit'),
    durationMinutes: 2,
    scoringMethod: 'Correct same/different choices ÷ trials. Median response time recorded descriptively.',
    responseType: 'Same / Different',
    accessibilityRequirements: ['High contrast', 'Large patterns', 'No flashing'],
    playerKind: 'choice'
  })
];
