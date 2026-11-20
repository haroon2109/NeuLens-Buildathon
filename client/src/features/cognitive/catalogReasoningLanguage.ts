import { defineTask } from './types';

const five = (a: string, b: string, c: string, d: string, e: string): [string, string, string, string, string] => [a, b, c, d, e];

export const reasoningTasks = [
  defineTask({
    id: 'reasoning.pattern-detective',
    name: 'Pattern Detective',
    domain: 'REASONING',
    subdomain: 'Abstract reasoning',
    description: 'Work out the rule in a visual pattern and choose the shape that completes it.',
    instructions: 'Look at the pattern. Choose the option that continues it.',
    example: 'Circle, square, circle, square, ? → circle.',
    difficultyLevels: five('3-item pattern', '4-item pattern', 'Two alternating features', 'Three-feature progression', 'Incomplete matrix with two rules'),
    durationMinutes: 2,
    scoringMethod: 'Correct completions ÷ trials.',
    responseType: 'Single choice',
    accessibilityRequirements: ['Shapes distinguish by form and label', 'No colour-only rules', 'Large options'],
    playerKind: 'choice',
    visualDetail: 'detailed'
  }),
  defineTask({
    id: 'reasoning.sequence-logic',
    name: 'Sequence Logic',
    domain: 'REASONING',
    subdomain: 'Logical reasoning',
    description: 'Identify the next item in a number or symbol sequence.',
    instructions: 'Read the sequence and choose what comes next.',
    example: '2, 4, 6, 8, ? → 10.',
    difficultyLevels: five('Simple +1 sequence', 'Simple +2 sequence', 'Alternating sequence', 'Two-step arithmetic', 'Mixed rule sequence'),
    durationMinutes: 2,
    scoringMethod: 'Correct next-item choices ÷ trials.',
    responseType: 'Single choice',
    accessibilityRequirements: ['Large numbers', 'No time limit', 'Culturally neutral items'],
    playerKind: 'choice'
  }),
  defineTask({
    id: 'reasoning.everyday-decision',
    name: 'Everyday Decision Challenge',
    domain: 'REASONING',
    subdomain: 'Practical reasoning and judgement',
    description: 'Choose the most sensible response to a familiar everyday situation.',
    instructions: 'Read the situation and choose the safest, most sensible action.',
    example: 'You feel dizzy while cooking. What do you do first? → Sit down and turn off the stove.',
    difficultyLevels: five('3 situations with clear answers', '4 situations', '5 situations', '6 situations with plausible alternatives', '7 situations requiring weighing risks'),
    durationMinutes: 2,
    scoringMethod: 'Sensible choices ÷ situations. Open discussion is not scored as incorrect.',
    responseType: 'Single choice',
    accessibilityRequirements: ['Plain language', 'Read-aloud option', 'No culturally specific assumptions'],
    playerKind: 'choice'
  }),
  defineTask({
    id: 'reasoning.shape-construction',
    name: 'Shape Construction',
    domain: 'REASONING',
    subdomain: 'Visuoconstruction and reasoning',
    description: 'Choose the set of pieces that can build the target shape without gaps or overlaps.',
    instructions: 'Look at the target shape. Choose the set of pieces that exactly builds it.',
    example: 'A rectangle can be built from two matching triangles.',
    difficultyLevels: five('2 pieces', '3 pieces', '4 pieces', '5 pieces', '6 pieces with a rotated option'),
    durationMinutes: 3,
    scoringMethod: 'Correct piece-set choices ÷ trials.',
    responseType: 'Single choice',
    accessibilityRequirements: ['High-contrast outlines', 'Pieces labelled by shape', 'No colour-only grouping'],
    playerKind: 'choice',
    visualDetail: 'detailed'
  })
];

export const languageTasks = [
  defineTask({
    id: 'language.object-naming',
    name: 'Object Naming',
    domain: 'LANGUAGE',
    subdomain: 'Naming and word retrieval',
    description: 'Name familiar everyday objects shown one at a time.',
    instructions: 'Look at the picture and choose the word that names it. You may say the word aloud before choosing.',
    example: 'A picture of a spoon → choose “spoon”.',
    difficultyLevels: five('4 common objects, 3 choices', '5 objects, 4 choices', '6 objects', '7 objects with similar names', '8 objects with close distractors'),
    durationMinutes: 2,
    scoringMethod: 'Correct names ÷ items.',
    responseType: 'Single choice',
    accessibilityRequirements: ['Clear pictures', 'Read-aloud option', 'Language-matched vocabulary'],
    playerKind: 'choice'
  }),
  defineTask({
    id: 'language.category-fluency',
    name: 'Category Fluency',
    domain: 'LANGUAGE',
    subdomain: 'Semantic fluency',
    description: 'Name as many members of a familiar category as possible within a fixed time.',
    instructions: 'Type or dictate as many animals as you can in 30 seconds. Do not repeat the same animal twice.',
    example: 'Dog, cat, elephant, sparrow…',
    difficultyLevels: five('30 s, common category', '30 s, fewer common examples', '25 s', '20 s', '20 s with a narrower category'),
    durationMinutes: 2,
    scoringMethod: 'Unique valid items recorded. Repeated items are counted as repetitions, not additional correct answers. Transcription review required.',
    responseType: 'Text entry / dictation',
    accessibilityRequirements: ['Voice input option', 'Large text field', 'No spelling penalty'],
    playerKind: 'fluency'
  }),
  defineTask({
    id: 'language.sentence-understanding',
    name: 'Sentence Understanding',
    domain: 'LANGUAGE',
    subdomain: 'Language comprehension',
    description: 'Listen to or read a spoken instruction and choose the picture that matches it.',
    instructions: 'A sentence will be spoken and shown. Choose the picture that matches what it says.',
    example: '“The cup is under the table.” → choose the picture with the cup beneath the table.',
    difficultyLevels: five('3-word instruction', '4-word instruction', 'Instruction with one preposition', 'Instruction with two details', 'Passive or multi-step instruction'),
    durationMinutes: 2,
    scoringMethod: 'Correct picture choices ÷ sentences.',
    responseType: 'Single choice',
    accessibilityRequirements: ['Text shown with audio', 'Volume control', 'Language-matched content'],
    playerKind: 'choice'
  })
];
