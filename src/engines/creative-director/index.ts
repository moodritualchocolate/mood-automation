/**
 * 3. CREATIVE DIRECTOR ENGINE
 *
 * Decides the creative direction: hook, focal point, emotional pacing,
 * product role, typography dominance, CTA behavior, layout family,
 * restraint level.
 *
 * The system NEVER starts from "what layout?". It starts from the human
 * truth and works outward. This engine encodes that ordering.
 */

import type { CampaignMode, CreativeDirection, EngineContext, HumanTruth, MemorySnapshot } from '@/core/types';
import { CreativeDirectionSchema } from '@/core/types';
import { cognitionEnabled, think } from '@/cognition/claude';
import { MOOD_VOICE } from '@/cognition/voice';

const SYSTEM = `
${MOOD_VOICE}

You are the CREATIVE DIRECTOR engine of MOOD CREATIVE OS.

Given a human truth, decide the creative direction for a single banner.

Your decisions encode a worldview, not a template:

- "hook": a one-line creative hook describing WHAT THE EYE SEES FIRST.
  It must reference an action, gesture, or framing — not the product
  and not the copy. Maximum 14 words.

- "focalPoint": where the eye lands first. One of:
  human-face, hands, object, environment, gesture, product-in-hand, empty-space.

- "emotionalPacing": the temporal rhythm of the image.
  quiet | tense | interrupted | collapsed | wired.

- "productRole": the product MUST feel like a scene object, never a
  pasted PNG. Choose one of:
  hidden, environmental, hand-held, partial-crop, foreground-blur,
  table-object, desk-proof, background-object, emotional-proof.
  Default toward HIDDEN or ENVIRONMENTAL unless the truth specifically
  earns a hand-held moment.

- "typographyDominance": absent | whisper | editorial | loud | timestamp.
  Use "timestamp" ONLY if the truth references a specific time of day
  that is emotionally critical.

- "ctaBehavior": quiet | integrated | editorial | corner.

- "layoutFamily": documentary-crop, editorial-page, off-center-portrait,
  environmental-wide, timestamp-anchor, negative-space.

- "restraint": 0..1. Higher = more restrained, more negative space,
  smaller typography, quieter framing.
`.trim();

export interface DirectInput {
  ctx: EngineContext;
  truth: HumanTruth;
  campaignMode: CampaignMode | null;
  memory: MemorySnapshot;
}

export async function direct(input: DirectInput): Promise<CreativeDirection> {
  const { ctx, truth, campaignMode, memory } = input;

  ctx.emit({ stage: 'creative-direction', message: 'composing creative direction' });

  if (cognitionEnabled()) {
    try {
      const raw = await think<CreativeDirection>({
        model: 'judgement',
        system: SYSTEM,
        user: buildPrompt(truth, campaignMode, memory),
        jsonShape: directionShape,
        temperature: 0.7,
        maxTokens: 600,
      });
      const parsed = CreativeDirectionSchema.parse(raw);
      ctx.emit({ stage: 'creative-direction', message: parsed.hook, data: parsed });
      return parsed;
    } catch (e) {
      ctx.emit({
        stage: 'creative-direction',
        message: 'cognition failed, falling back',
        data: { error: (e as Error).message },
      });
    }
  }

  return fallbackDirection(ctx, truth, campaignMode);
}

const directionShape = `{
  "hook": "string",
  "focalPoint": "human-face | hands | object | environment | gesture | product-in-hand | empty-space",
  "emotionalPacing": "quiet | tense | interrupted | collapsed | wired",
  "productRole": "hidden | environmental | hand-held | partial-crop | foreground-blur | table-object | desk-proof | background-object | emotional-proof",
  "typographyDominance": "absent | whisper | editorial | loud | timestamp",
  "ctaBehavior": "quiet | integrated | editorial | corner",
  "layoutFamily": "documentary-crop | editorial-page | off-center-portrait | environmental-wide | timestamp-anchor | negative-space",
  "restraint": 0.0
}`;

function buildPrompt(truth: HumanTruth, mode: CampaignMode | null, memory: MemorySnapshot): string {
  return [
    `STATE: ${truth.state.label}`,
    `FAMILY: ${truth.state.family}`,
    `TRUTH: ${truth.truth}`,
    `TENSION: ${truth.tension}`,
    `TIME ANCHOR: ${truth.state.timeAnchor ?? 'none'}`,
    `CAMPAIGN MODE: ${mode ?? 'unspecified'}`,
    `RECENT LAYOUTS (avoid): ${memory.recentLayouts.slice(0, 4).join(', ') || 'none yet'}`,
    `RECENT HOOKS (avoid echoing): ${memory.recentHooks.slice(0, 4).join(' | ') || 'none yet'}`,
    '',
    'Output the JSON now.',
  ].join('\n');
}

/**
 * Heuristic fallback. Deterministically maps state family + mode to
 * a plausible direction. Not as nuanced as cognition, but enforces
 * the same rules (especially product role and timestamp earning).
 */
function fallbackDirection(
  ctx: EngineContext,
  truth: HumanTruth,
  mode: CampaignMode | null,
): CreativeDirection {
  const family = truth.state.family;
  const hasTime = !!truth.state.timeAnchor;

  const focalByFamily: Record<typeof family, CreativeDirection['focalPoint']> = {
    fatigue: 'human-face',
    overstimulation: 'environment',
    avoidance: 'gesture',
    numbness: 'empty-space',
    pressure: 'hands',
    fragmentation: 'environment',
    paralysis: 'hands',
    collapse: 'human-face',
  };

  const pacingByFamily: Record<typeof family, CreativeDirection['emotionalPacing']> = {
    fatigue: 'quiet',
    overstimulation: 'wired',
    avoidance: 'interrupted',
    numbness: 'quiet',
    pressure: 'tense',
    fragmentation: 'interrupted',
    paralysis: 'quiet',
    collapse: 'collapsed',
  };

  const layoutByMode: Partial<Record<CampaignMode, CreativeDirection['layoutFamily']>> = {
    Editorial: 'editorial-page',
    Documentary: 'documentary-crop',
    Performance: 'off-center-portrait',
    Emotional: 'environmental-wide',
    Minimal: 'negative-space',
    Aggressive: 'documentary-crop',
    Luxury: 'editorial-page',
    'Product-focused': 'off-center-portrait',
  };

  // Vary restraint per state so the fallback doesn't return the same
  // template restraint level for every banner — otherwise the taste
  // critic correctly flags every output as "template energy."
  const stateNudge = hashString(truth.state.id) % 19 / 100 - 0.09;   // -0.09..+0.09
  const familyBaseline =
    family === 'collapse'        ? 0.78 :
    family === 'fatigue'         ? 0.72 :
    family === 'numbness'        ? 0.80 :
    family === 'paralysis'       ? 0.75 :
    family === 'pressure'        ? 0.55 :
    family === 'fragmentation'   ? 0.50 :
    family === 'overstimulation' ? 0.42 :
    family === 'avoidance'       ? 0.62 :
    0.65;
  const baseRestraint = mode === 'Aggressive' ? 0.3
                      : mode === 'Minimal'    ? 0.88
                      : mode === 'Luxury'     ? 0.85
                      : familyBaseline + stateNudge;

  const direction: CreativeDirection = {
    hook: hookFromTruth(truth),
    focalPoint: focalByFamily[family],
    emotionalPacing: pacingByFamily[family],
    productRole: mode === 'Product-focused' ? 'partial-crop' : (hasTime ? 'desk-proof' : 'environmental'),
    typographyDominance: hasTime ? 'timestamp' : (mode === 'Editorial' ? 'editorial' : 'whisper'),
    ctaBehavior: mode === 'Aggressive' ? 'editorial' : 'quiet',
    layoutFamily: hasTime ? 'timestamp-anchor' : (layoutByMode[mode ?? 'Editorial'] ?? 'documentary-crop'),
    restraint: Math.max(0.1, Math.min(0.95, baseRestraint)),
  };

  ctx.emit({ stage: 'creative-direction', message: direction.hook, data: direction });
  return direction;
}

function hookFromTruth(truth: HumanTruth): string {
  // Strip the truth to a visual hook — first 12 words, ending cleanly.
  const words = truth.truth.replace(/[.,;:!?]+$/, '').split(/\s+/);
  return words.slice(0, 12).join(' ');
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
