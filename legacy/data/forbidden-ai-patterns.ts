/**
 * FORBIDDEN AI PATTERNS DATABASE
 *
 * The 17 patterns the spec named. Each entry encodes:
 *  - what it looks like (so detectors can match it structurally)
 *  - why the critic must punish it
 *  - the typography/composition fingerprints that betray it
 *
 * These patterns become heuristic detectors inside the visual-taste
 * engine and the anti-AI evolution engine. They are also passed to
 * the LLM as system context so cognition learns the refusal vocabulary.
 *
 * NEVER add to this list lightly. Each entry must encode a SPECIFIC
 * failure that a creative director would name out loud.
 */

import type { CreativeDirection, TypographyPlan } from '@/core/types';
import type { ReferenceDNA } from '@lib/referenceDNA';

export type ForbiddenPatternId =
  | 'giant-decorative-timestamp'
  | 'floating-product-png'
  | 'centered-symmetric-layout'
  | 'empty-gradient-background'
  | 'fake-cinematic-glow'
  | 'fake-lens-flare'
  | 'fake-productivity-scene'
  | 'stock-office-smile'
  | 'before-after-cliche'
  | 'giant-typography-unjustified'
  | 'decorative-clock'
  | 'isolated-product-packshot'
  | 'empty-emotional-buzzword'
  | 'hyper-clean-composition'
  | 'template-cta-placement'
  | 'fake-emotional-intensity'
  | 'fake-luxury-minimalism';

export interface ForbiddenPattern {
  id: ForbiddenPatternId;
  name: string;
  director_note: string;       // what a real creative director would say
  severity: 'soft' | 'hard';   // hard = automatic refusal in brutal mode
  visible_in: Array<'composition' | 'typography' | 'product' | 'truth' | 'image'>;
}

export const FORBIDDEN_AI_PATTERNS: Record<ForbiddenPatternId, ForbiddenPattern> = {
  'giant-decorative-timestamp': {
    id: 'giant-decorative-timestamp',
    name: 'giant decorative timestamp',
    director_note: 'A time of day is on the canvas, but the truth has no time inside it. The clock is decoration.',
    severity: 'hard',
    visible_in: ['typography'],
  },
  'floating-product-png': {
    id: 'floating-product-png',
    name: 'floating product PNG',
    director_note: 'Product hovers in space without weight or shadow. It was pasted, not placed.',
    severity: 'hard',
    visible_in: ['product', 'composition'],
  },
  'centered-symmetric-layout': {
    id: 'centered-symmetric-layout',
    name: 'centered, symmetric layout',
    director_note: 'Subject dead-center, both halves balanced. Politely invisible. The layout chose itself.',
    severity: 'soft',
    visible_in: ['composition'],
  },
  'empty-gradient-background': {
    id: 'empty-gradient-background',
    name: 'empty gradient background',
    director_note: 'Color fades with no atmospheric reason. Reads as "AI tried to mood it up".',
    severity: 'soft',
    visible_in: ['image'],
  },
  'fake-cinematic-glow': {
    id: 'fake-cinematic-glow',
    name: 'fake cinematic glow',
    director_note: 'Rim light from a source that does not exist in the scene. The cinema is performed, not observed.',
    severity: 'hard',
    visible_in: ['image'],
  },
  'fake-lens-flare': {
    id: 'fake-lens-flare',
    name: 'fake lens flare',
    director_note: 'Decorative streaks of light without a lens to explain them.',
    severity: 'hard',
    visible_in: ['image'],
  },
  'fake-productivity-scene': {
    id: 'fake-productivity-scene',
    name: 'fake productivity scene',
    director_note: 'Tidy desk, MacBook, plant, coffee. No one actually lives this — the office of an ad agency, not a life.',
    severity: 'soft',
    visible_in: ['image'],
  },
  'stock-office-smile': {
    id: 'stock-office-smile',
    name: 'stock-office smile',
    director_note: 'Coffee cup, sunlight on face, smile aimed at nothing. Stock photography vocabulary.',
    severity: 'hard',
    visible_in: ['image'],
  },
  'before-after-cliche': {
    id: 'before-after-cliche',
    name: 'before / after cliché',
    director_note: 'Two-state framing that promises transformation. Reads as supplement marketing.',
    severity: 'hard',
    visible_in: ['composition', 'truth'],
  },
  'giant-typography-unjustified': {
    id: 'giant-typography-unjustified',
    name: 'giant typography without emotional justification',
    director_note: 'Size used as production value. The headline is loud, the truth is not.',
    severity: 'soft',
    visible_in: ['typography'],
  },
  'decorative-clock': {
    id: 'decorative-clock',
    name: 'decorative clock face',
    director_note: 'Clock used as a graphic — time as visual filler rather than emotional anchor.',
    severity: 'soft',
    visible_in: ['image', 'typography'],
  },
  'isolated-product-packshot': {
    id: 'isolated-product-packshot',
    name: 'isolated product packshot',
    director_note: 'Product alone on background. Catalog photography. No human moment.',
    severity: 'hard',
    visible_in: ['product', 'image'],
  },
  'empty-emotional-buzzword': {
    id: 'empty-emotional-buzzword',
    name: 'empty emotional buzzword',
    director_note: 'Words like "balance", "elevate", "embrace", "journey" — they promise feeling without producing it.',
    severity: 'hard',
    visible_in: ['truth', 'typography'],
  },
  'hyper-clean-composition': {
    id: 'hyper-clean-composition',
    name: 'hyper-clean composition',
    director_note: 'No clutter, no flaw, no surface texture. Reads as rendered, not photographed.',
    severity: 'soft',
    visible_in: ['composition', 'image'],
  },
  'template-cta-placement': {
    id: 'template-cta-placement',
    name: 'template CTA placement',
    director_note: 'CTA in the bottom-right of every banner regardless of layout. The default for the default.',
    severity: 'soft',
    visible_in: ['composition'],
  },
  'fake-emotional-intensity': {
    id: 'fake-emotional-intensity',
    name: 'fake emotional intensity',
    director_note: 'Subject crying-but-cinematic, posed sadness, mascara mid-tear. Theatre, not feeling.',
    severity: 'hard',
    visible_in: ['image'],
  },
  'fake-luxury-minimalism': {
    id: 'fake-luxury-minimalism',
    name: 'fake luxury minimalism',
    director_note: 'Restraint without an emotional reason. "Premium" beige, sans-serif type, single-product framing. The aesthetic of nothing.',
    severity: 'soft',
    visible_in: ['composition', 'image'],
  },
};

/**
 * Heuristic detector for the patterns the system can recognise WITHOUT
 * vision (composition / typography / direction shape only).
 *
 * Returns the named patterns present in the banner — both soft + hard.
 * Hard-severity hits become refusal-grade signals in the meta-critic.
 */
export function detectForbiddenPatterns(args: {
  direction: CreativeDirection;
  typography: TypographyPlan;
  dna: ReferenceDNA;
  truthText: string;
  timeAnchor: string | null;
  imageProvider: string;
}): ForbiddenPattern[] {
  const { direction, typography, dna, truthText, timeAnchor, imageProvider } = args;
  const hits: ForbiddenPattern[] = [];

  // giant decorative timestamp — timestamp dominance without a time anchor in the state
  if (direction.typographyDominance === 'timestamp' && !timeAnchor) {
    hits.push(FORBIDDEN_AI_PATTERNS['giant-decorative-timestamp']);
  }
  // centered symmetric layout
  if (dna.framing_behavior < 0.32 && dna.silence_ratio < 0.6) {
    hits.push(FORBIDDEN_AI_PATTERNS['centered-symmetric-layout']);
  }
  // giant typography unjustified — loud dominance on a long, non-tense truth
  if (direction.typographyDominance === 'loud' && truthText.length > 100 && dna.tension_map < 0.55) {
    hits.push(FORBIDDEN_AI_PATTERNS['giant-typography-unjustified']);
  }
  // fake luxury minimalism — extreme restraint with low documentary weight
  if (direction.restraint > 0.85 && dna.documentary_weight < 0.45) {
    hits.push(FORBIDDEN_AI_PATTERNS['fake-luxury-minimalism']);
  }
  // template CTA placement — direction.ctaBehavior is 'corner' AND layout is documentary-crop
  if (direction.ctaBehavior === 'corner' && direction.layoutFamily === 'documentary-crop') {
    hits.push(FORBIDDEN_AI_PATTERNS['template-cta-placement']);
  }
  // empty emotional buzzword — truth contains a banned word
  const buzzwords = /\b(balance|elevate|embrace|journey|unlock|empower|wellness|mindful|optimi[sz]e)\b/i;
  if (buzzwords.test(truthText)) {
    hits.push(FORBIDDEN_AI_PATTERNS['empty-emotional-buzzword']);
  }
  // hyper-clean composition — high luxury_restraint + low realism_type + low documentary_weight
  if (dna.luxury_restraint > 0.78 && dna.realism_type < 0.55 && dna.documentary_weight < 0.45) {
    hits.push(FORBIDDEN_AI_PATTERNS['hyper-clean-composition']);
  }
  // empty gradient background — only relevant under real-image providers
  if (!imageProvider.startsWith('stub') && dna.documentary_weight < 0.4 && dna.realism_type < 0.5) {
    hits.push(FORBIDDEN_AI_PATTERNS['empty-gradient-background']);
  }
  // isolated product packshot — product role implies hero placement
  if (direction.productRole === 'hand-held' && direction.focalPoint === 'product-in-hand' && dna.documentary_weight < 0.5) {
    hits.push(FORBIDDEN_AI_PATTERNS['isolated-product-packshot']);
  }
  // fake emotional intensity — face-forward + collapsed + low restraint
  if (direction.focalPoint === 'human-face' && direction.emotionalPacing === 'collapsed' && direction.restraint < 0.5) {
    hits.push(FORBIDDEN_AI_PATTERNS['fake-emotional-intensity']);
  }
  void typography;
  return hits;
}
