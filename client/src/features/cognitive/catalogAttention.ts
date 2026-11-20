import { defineTask } from './types';

const five = (a: string, b: string, c: string, d: string, e: string): [string, string, string, string, string] => [a, b, c, d, e];

export const attentionTasks = [
  defineTask({
    id: 'attention.target-detection',
    name: 'Target Detection',
    domain: 'ATTENTION',
    subdomain: 'Sustained attention and response consistency',
    description: 'Tap when a designated target symbol appears among other symbols, and stay still for the rest.',
    instructions: 'A symbol will appear in the centre. Tap the large button only when you see the target symbol. Do not tap for other symbols.',
    example: 'Target = ●. Tap for ●●, do not tap for ▲.',
    difficultyLevels: five('16 symbols, 2 s each', '20 symbols, 1.8 s', '24 symbols, 1.5 s', '28 symbols, 1.2 s', '32 symbols, 1 s with more distractors'),
    durationMinutes: 2,
    scoringMethod: 'Correct target hits and correct non-target withholds. Commission and omission errors recorded.',
    responseType: 'Large tap button',
    accessibilityRequirements: ['High-contrast symbols', 'No colour-only distinction', 'Response window at least 1 s'],
    playerKind: 'tap-stream',
    practiceRecommended: true
  }),
  defineTask({
    id: 'attention.focus-finder',
    name: 'Focus Finder',
    domain: 'ATTENTION',
    subdomain: 'Selective attention and interference control',
    description: 'Identify the direction of the central arrow while ignoring surrounding arrows pointing elsewhere.',
    instructions: 'Look only at the middle arrow. Choose the direction it points, even when the arrows around it point a different way.',
    example: '← ← ← ← ←  (middle points left) → choose Left.',
    difficultyLevels: five('5 trials, all arrows agree', '8 trials, some conflict', '10 trials, mostly conflict', '12 trials, faster', '14 trials with mixed directions'),
    durationMinutes: 2,
    scoringMethod: 'Correct direction choices ÷ trials. Interference errors are flagged separately.',
    responseType: 'Direction choice',
    accessibilityRequirements: ['Large central arrow', 'Direction words as well as arrows', 'Adequate spacing between flankers'],
    playerKind: 'choice'
  }),
  defineTask({
    id: 'attention.visual-search',
    name: 'Visual Search',
    domain: 'ATTENTION',
    subdomain: 'Visual attention and search efficiency',
    description: 'Find and tap all matching target shapes in a crowded display within a time limit.',
    instructions: 'Tap every shape that exactly matches the target shown above the grid. Ignore shapes that are different.',
    example: 'Target = red circle. Tap all red circles; ignore red squares and blue circles.',
    difficultyLevels: five('6×4 grid, 1 target, 30 s', '1 target among more distractors', '2 targets', '2 targets, 25 s', '3 targets, 20 s'),
    durationMinutes: 2,
    scoringMethod: 'Targets found ÷ targets present. False taps recorded as errors.',
    responseType: 'Grid taps',
    accessibilityRequirements: ['Large cells', 'Shape and colour cues together', 'No motion during search'],
    playerKind: 'visual-search'
  }),
  defineTask({
    id: 'attention.go-no-go',
    name: 'Go / No-Go Challenge',
    domain: 'ATTENTION',
    subdomain: 'Inhibitory control and attention',
    description: 'Respond quickly to one category of symbol and withhold the response for another.',
    instructions: 'Tap for green circles. Do not tap for red squares. The next symbol appears after each response or a short wait.',
    example: 'Green circle → tap. Red square → wait.',
    difficultyLevels: five('12 symbols, 2 s each', '16 symbols, 1.8 s', '20 symbols, 1.5 s', '24 symbols, 1.2 s', '28 symbols, 1 s with more no-go trials'),
    durationMinutes: 2,
    scoringMethod: 'Correct go responses and correct no-go withholds. Premature taps recorded.',
    responseType: 'Large tap button',
    accessibilityRequirements: ['Shape as well as colour', 'Large symbols', 'No flashing'],
    playerKind: 'tap-stream'
  }),
  defineTask({
    id: 'attention.sound-recognition',
    name: 'Sound Recognition',
    domain: 'ATTENTION',
    subdomain: 'Auditory attention',
    description: 'Listen to short tone patterns and identify when the designated target pattern is heard.',
    instructions: 'You will hear short beep patterns. Tap when you hear the target pattern: two high beeps. Use headphones if available.',
    example: 'Target = high–high. A low–high pattern should not be tapped.',
    difficultyLevels: five('6 patterns, slow', '8 patterns', '10 patterns', '12 patterns', '14 patterns, faster'),
    durationMinutes: 2,
    scoringMethod: 'Correct target identifications and correct rejections.',
    responseType: 'Large tap button',
    accessibilityRequirements: ['Hearing check first', 'Visual alternative available', 'Volume control', 'No audio-only scoring without confirmation'],
    playerKind: 'tap-stream',
    requiresAudio: true,
    practiceRecommended: true
  })
];
