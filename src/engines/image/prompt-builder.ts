/**
 * Builds the cinematic-scene prompt for the image provider.
 *
 * The structure is deliberate: scene first, lighting second, lens third,
 * forbidden last. The forbidden list is the most important part — it is
 * how we stop the camera from pretending to be a designer.
 */

import type { CompositionPlan, CreativeDirection, HumanTruth, ImageBrief } from '@/core/types';

const FORBIDDEN_IN_IMAGE = [
  'no text of any kind',
  'no Hebrew letters',
  'no English letters',
  'no numbers',
  'no logos',
  'no brand names',
  'no packaging text',
  'no CTA buttons',
  'no overlays',
  'no graphic design elements',
  'no stickers',
  'no signage with words',
  'no fake typography',
  'no watermarks',
];

const LENS_BY_PACING: Record<CreativeDirection['emotionalPacing'], string> = {
  quiet:       '50mm prime, shallow depth of field, calm framing',
  tense:       '35mm, slight handheld feel, tight crop',
  interrupted: '28mm, off-axis, dutch tilt, mid-action',
  collapsed:   '50mm low angle, heavy body, motionless subject',
  wired:       '35mm slight motion blur on hands, sharp eyes',
};

const LIGHTING_BY_FAMILY: Record<string, string> = {
  fatigue:         'late afternoon window light, warm but tired, soft shadows',
  overstimulation: 'mixed fluorescent and screen light, slightly clinical, ambient noise visible in light',
  avoidance:       'overcast natural light, flat and ambivalent',
  numbness:        'desaturated daylight, even, no theatre',
  pressure:        'cool office daylight with one warm desk lamp, contrasting temperatures',
  fragmentation:   'multiple light sources, ambient screen glow on face',
  paralysis:       'single window light, dust visible, still air',
  collapse:        'low warm light, body in shadow, environment muted',
};

const PRODUCT_INSTRUCTIONS: Record<CreativeDirection['productRole'], string> = {
  hidden:            'no product visible in this image at all',
  environmental:    'a small functional chocolate product half-visible in the environment (table edge, bag side, drawer), unbranded, treated as a scene object not a hero',
  'hand-held':       'a hand holding a small chocolate bar at the edge of frame, partial crop, no label readable',
  'partial-crop':    'a small chocolate bar partially cropped at the edge of frame, casual, unbranded, scene-object behavior',
  'foreground-blur': 'a small chocolate bar in the very foreground, out of focus, suggestion of presence only',
  'table-object':    'a small chocolate bar laid flat on a surface among other ordinary objects (keys, phone, coffee cup), no label readable',
  'desk-proof':      'a small chocolate bar on a working desk among notes and a laptop, treated as evidence of the day',
  'background-object': 'a small chocolate bar in the background, soft focus, presence only',
  'emotional-proof': 'a small chocolate bar near the subject, with body language suggesting it was the last thing they reached for',
};

export function buildImagePrompt(args: {
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
}): ImageBrief {
  const { truth, direction, composition } = args;
  const state = truth.state;

  const setting = state.setting[0] ?? 'an ordinary interior';
  const body = state.body.join(', ');

  // Imperfection rules — controlled realism. ENERGY = pressure + interruption.
  const imperfections = [
    'off-center framing',
    'documentary feel',
    'no posed expression',
    'real human asymmetry',
    'visible skin texture and pores',
    'natural grain',
    'one minor "wrong" element in the scene (a wrinkle in the shirt, a coffee ring, a crumpled receipt)',
  ];

  // Negative space — the camera leaves room where typography will sit.
  const negativeSpaceClause = `compose with significant negative space at the ${composition.negativeSpaceBias} of the frame so a designer can place editorial typography there afterwards`;

  const productClause = PRODUCT_INSTRUCTIONS[direction.productRole];

  const scene = [
    `A single quiet candid moment of ${state.label}.`,
    `Setting: ${setting}.`,
    `The subject's body language: ${body}.`,
    `Emotional tension: ${truth.tension}.`,
    `The image must read like a documentary still — observed, not posed.`,
    `Product placement instruction: ${productClause}.`,
    negativeSpaceClause,
  ].join(' ');

  return {
    scene,
    lighting: LIGHTING_BY_FAMILY[state.family] ?? 'natural daylight, soft, untheatrical',
    framing: framingFor(direction, composition),
    lens: LENS_BY_PACING[direction.emotionalPacing],
    mood: `${direction.emotionalPacing}; restraint ${direction.restraint.toFixed(2)}`,
    forbiddenInImage: FORBIDDEN_IN_IMAGE,
    imperfections,
    aspect: composition.aspect,
  };
}

function framingFor(d: CreativeDirection, c: CompositionPlan): string {
  const focal = `focal at ${(c.focal.x * 100).toFixed(0)}%,${(c.focal.y * 100).toFixed(0)}% of frame, size ${(c.focal.w * 100).toFixed(0)}%x${(c.focal.h * 100).toFixed(0)}%`;
  switch (d.focalPoint) {
    case 'human-face':       return `close on the human face, eyes-first composition, ${focal}`;
    case 'hands':            return `close on hands, face partly out of frame, ${focal}`;
    case 'object':           return `close on a single significant object in their world, ${focal}`;
    case 'environment':      return `wide environmental frame, subject as part of the scene, ${focal}`;
    case 'gesture':          return `mid-action gesture, slight motion implied, ${focal}`;
    case 'product-in-hand':  return `hand and product as the focal element, face out of frame or blurred, ${focal}`;
    case 'empty-space':      return `subject small in the frame, environment dominant, ${focal}`;
  }
}

/** Flatten the brief into a single prompt string for providers that take one. */
export function flatten(brief: ImageBrief): string {
  return [
    brief.scene,
    `Lighting: ${brief.lighting}.`,
    `Lens: ${brief.lens}.`,
    `Framing: ${brief.framing}.`,
    `Mood: ${brief.mood}.`,
    `Imperfection rules: ${brief.imperfections.join('; ')}.`,
    `Aspect: ${brief.aspect}.`,
    'STRICT RULES (do not violate any):',
    ...brief.forbiddenInImage.map((f) => `- ${f}`),
  ].join('\n');
}
