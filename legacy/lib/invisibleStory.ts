/**
 * INVISIBLE STORY ENGINE (Phase 7)
 *
 * Every frame implies an unseen story.
 *
 * The engine answers FIVE questions the spec named:
 *
 *   - what happened 10 minutes before?
 *   - what happens after this frame?
 *   - what is the subject avoiding?
 *   - what pressure exists outside the crop?
 *   - what is emotionally unresolved?
 *
 * The output is consumed by the image brief AS CONTEXT — not as
 * literal copy the photo must include. The point is the camera knows
 * the story even when the viewer only sees the still.
 *
 * The engine never invents a story that contradicts the emotional
 * core. It works from core + cultural micro-moment + state body.
 */

import type { HumanState } from '@/core/types';
import type { EmotionalCore } from './humanTruthEngine';
import type { CulturalMicroMoment } from './culturalMemory';

export interface InvisibleStory {
  ten_minutes_before: string;
  two_minutes_after: string;
  avoiding: string;
  outside_the_crop: string;
  unresolved: string;
  /** Single-paragraph composite — the form the image brief receives. */
  contextParagraph: string;
}

export interface StoryInput {
  state: HumanState;
  emotionalCore: EmotionalCore | null;
  microMoment: CulturalMicroMoment | null;
}

export function buildInvisibleStory(input: StoryInput): InvisibleStory {
  const { state, emotionalCore, microMoment } = input;

  const ten_minutes_before = beforeFor(state, emotionalCore, microMoment);
  const two_minutes_after = afterFor(state, emotionalCore);
  const avoiding = avoidingFor(emotionalCore, state);
  const outside_the_crop = outsideFor(emotionalCore, microMoment);
  const unresolved = unresolvedFor(emotionalCore, state);

  const contextParagraph = [
    `Ten minutes ago: ${ten_minutes_before}.`,
    `Two minutes from now: ${two_minutes_after}.`,
    `What the subject is avoiding: ${avoiding}.`,
    `Outside the crop: ${outside_the_crop}.`,
    `What is unresolved: ${unresolved}.`,
  ].join(' ');

  return { ten_minutes_before, two_minutes_after, avoiding, outside_the_crop, unresolved, contextParagraph };
}

function beforeFor(state: HumanState, core: EmotionalCore | null, moment: CulturalMicroMoment | null): string {
  if (moment?.state_id === 'reserves-fatigue') return 'returned from miluim, dropped the bag in the hall';
  if (moment?.state_id === 'fridge-open-at-night') return 'lay in bed for forty minutes pretending to sleep';
  if (moment?.state_id === 'startup-late-night') return 'told the team they could leave at 19:00 and stayed';
  if (moment?.state_id === 'unread-whatsapp') return 'read the message at 09:00; has not replied since';
  if (moment?.state_id === 'office-1647-brain-death') return 'opened the same spreadsheet four times';
  if (moment?.state_id === 'car-after-work') return 'pulled into the driveway and turned the engine off, then did not move';

  switch (core?.id) {
    case 'depletion':         return 'sat through one more meeting than there was energy for';
    case 'overstimulation':   return 'three notifications, two interruptions, one missed thought';
    case 'silent-burnout':    return 'closed the laptop, opened it again, kept going';
    case 'too-tired-to-rest': return 'lay down with the intention of sleep';
    case 'hidden-anxiety':    return 'rehearsed an answer to a question that has not been asked';
    case 'doomscrolling':     return 'opened the feed to "check one thing"';
    case 'social-performance-exhaustion': return 'said yes to one more conversation than there was reserve for';
    case 'avoidance':         return 'arrived where the task lives; did not start';
    default:                  return `${state.body[0] ?? 'sat down'} ten minutes ago and has not moved`;
  }
}

function afterFor(state: HumanState, core: EmotionalCore | null): string {
  void state;
  switch (core?.id) {
    case 'depletion':         return 'gets up to do the next thing, slowly';
    case 'overstimulation':   return 'puts on headphones with no music';
    case 'silent-burnout':    return 'sends one more reply';
    case 'too-tired-to-rest': return 'sleep does not come — the phone comes back on';
    case 'hidden-anxiety':    return 'walks into the room and smiles';
    case 'doomscrolling':     return 'tells themselves twenty more seconds, again';
    case 'social-performance-exhaustion': return 'leaves with an excuse no one believes';
    case 'avoidance':         return 'opens a new tab';
    case 'emotional-drift':   return 'goes to bed without remembering the evening';
    default:                  return 'the next thing happens';
  }
}

function avoidingFor(core: EmotionalCore | null, state: HumanState): string {
  if (core) return core.hidden_desire || 'a thing they cannot name';
  void state;
  return 'a small unfinished task';
}

function outsideFor(core: EmotionalCore | null, moment: CulturalMicroMoment | null): string {
  if (moment) return moment.social_context === 'plural' ? 'other people, expecting things' : 'the next ten things on the list';
  if (core?.id === 'invisible-pressure') return 'work that will not delegate itself';
  if (core?.id === 'parenting-overload' as any) return 'a child in another room, awake again';
  return 'a phone face-down on a table, lighting up at intervals';
}

function unresolvedFor(core: EmotionalCore | null, state: HumanState): string {
  if (core?.silent_sentence) return `the sentence "${core.silent_sentence}" that the subject is privately saying`;
  return `the contradiction inside "${state.label}"`;
}
