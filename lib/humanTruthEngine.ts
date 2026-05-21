/**
 * HUMAN TRUTH ENGINE — perceptual model of modern emotional states.
 *
 * NOT demographics. NOT audience personas. NOT marketing categories.
 *
 * 23 structured emotional cores. Each is the deeper "feeling beneath
 * the surface" that one or more of the 59 ENERGY states points at.
 * The existing per-state ENERGY data (data/energy-states.ts) provides
 * the visible specifics (body, setting, time anchor). This engine
 * provides the INVISIBLE specifics — the contradiction, the mental
 * loop, the silent sentence the subject is saying to themselves.
 *
 * Used by:
 *  - the human-truth engine to ground truth-writing in a richer model
 *  - the meta-critic, to score whether the banner is honouring the
 *    emotional core or shipping a polished surface around it
 *  - the cultural-memory engine, to bridge emotional core to physical
 *    micro-moment
 *
 * Every modern emotional state the spec named is encoded here. The
 * 14 fields per core are non-negotiable — engines downstream depend on
 * the shape, not just the list.
 */

import type { HumanState } from '@/core/types';

export type EmotionalCoreId =
  | 'depletion'
  | 'overstimulation'
  | 'guilt'
  | 'shame'
  | 'avoidance'
  | 'emotional-numbness'
  | 'too-tired-to-rest'
  | 'digital-fatigue'
  | 'doomscrolling'
  | 'social-performance-exhaustion'
  | 'internal-contradiction'
  | 'hyper-awareness'
  | 'loneliness-in-public'
  | 'decision-fatigue'
  | 'inability-to-land'
  | 'overstimulated-but-flat'
  | 'silent-burnout'
  | 'revenge-bedtime-procrastination'
  | 'emotional-fragmentation'
  | 'hidden-anxiety'
  | 'invisible-pressure'
  | 'functional-collapse'
  | 'emotional-drift';

export interface EmotionalCore {
  id: EmotionalCoreId;
  emotional_core: string;
  contradiction: string;
  physical_behavior: string;
  mental_loop: string;
  hidden_desire: string;
  silent_sentence: string;
  visual_behavior: string;
  energy_signature: 'collapsing' | 'wired' | 'flat' | 'crackling' | 'static' | 'fragmented';
  atmosphere: string;
  cultural_examples: string[];
  typography_behavior: 'whisper' | 'absent' | 'editorial' | 'restrained-oversized' | 'timestamp-anchor' | 'interruption';
  pacing_behavior: 'breath' | 'quiet' | 'slow-interruption' | 'staccato' | 'wired';
  product_role: 'hidden' | 'environmental' | 'evidence' | 'partial-crop' | 'hand-held';
  forbidden_tones: string[];
  /** ENERGY state slugs that map to this emotional core. */
  mapped_states: string[];
}

export const EMOTIONAL_CORES: Record<EmotionalCoreId, EmotionalCore> = {
  depletion: {
    id: 'depletion',
    emotional_core: 'the body is doing the day; nobody is home',
    contradiction: 'still functional, no longer present',
    physical_behavior: 'shoulders slack, eyes half-lidded, mechanical movement',
    mental_loop: 'just one more thing; then nothing; then another thing',
    hidden_desire: 'permission to stop without consequence',
    silent_sentence: 'I am tired in a way that sleep does not fix',
    visual_behavior: 'frame settles low, the body slides slightly out of the focal',
    energy_signature: 'collapsing',
    atmosphere: 'late afternoon, warm light that the subject does not notice',
    cultural_examples: ['afternoon office at 16:30', 'parent on the kitchen floor', 'returning from reserves'],
    typography_behavior: 'whisper',
    pacing_behavior: 'breath',
    product_role: 'environmental',
    forbidden_tones: ['energising', 'pick-me-up', 'fuel', 'boost', 'recharge'],
    mapped_states: ['afternoon-crash', 'late-afternoon-collapse', 'startup-burnout', 'pressure-fatigue', 'emotionally-drained', 'tired-but-continuing'],
  },
  overstimulation: {
    id: 'overstimulation',
    emotional_core: 'every sense is on; none of them are landing',
    contradiction: 'maximum input, zero retention',
    physical_behavior: 'hand on temple, jaw tight, eyes squinting against light',
    mental_loop: 'too much too much too much',
    hidden_desire: 'one room with one sound',
    silent_sentence: 'I cannot tell what I am supposed to be paying attention to',
    visual_behavior: 'frame slightly off-axis, edges full, no negative space',
    energy_signature: 'wired',
    atmosphere: 'mixed light sources — fluorescent + screen + window',
    cultural_examples: ['open-plan office at 11:42', 'mall escalator', 'doomscrolling in bed'],
    typography_behavior: 'restrained-oversized',
    pacing_behavior: 'staccato',
    product_role: 'environmental',
    forbidden_tones: ['focus', 'clarity', 'calm-down', 'reset'],
    mapped_states: ['overstimulated-brain', 'overstimulated-office', 'modern-brain-overload', 'too-many-tabs', 'attention-fragmentation', 'constant-notifications'],
  },
  guilt: {
    id: 'guilt',
    emotional_core: 'a quiet sense that I am letting someone down — usually myself',
    contradiction: 'doing more than enough, feeling like never enough',
    physical_behavior: 'eyes lowered, hand near mouth, shallow breathing',
    mental_loop: 'I should have / I should not have',
    hidden_desire: 'to be told the count is reset',
    silent_sentence: 'I do not get to put this down yet',
    visual_behavior: 'subject partially hidden by an object — partial view, partial admission',
    energy_signature: 'static',
    atmosphere: 'overcast, indoor, no theatrical light',
    cultural_examples: ['unread WhatsApp threads', 'declined invitation', 'parent leaving kid at the door'],
    typography_behavior: 'whisper',
    pacing_behavior: 'quiet',
    product_role: 'hidden',
    forbidden_tones: ['celebration', 'achievement', 'reward', 'self-care'],
    mapped_states: ['unread-messages-anxiety', 'sunday-anxiety', 'exhausted-parenting'],
  },
  shame: {
    id: 'shame',
    emotional_core: 'a feeling about who I am, not about what I did',
    contradiction: 'performing competence in public; alone in private',
    physical_behavior: 'turned away from the camera, hand on neck',
    mental_loop: 'if they knew',
    hidden_desire: 'to be witnessed without being judged',
    silent_sentence: 'I do not want anyone to see this version of me',
    visual_behavior: 'frame from behind or 3/4, the face never fully presented',
    energy_signature: 'flat',
    atmosphere: 'low ambient light, bathroom or stairwell',
    cultural_examples: ['office bathroom stall', 'parked car before meeting', 'late-night kitchen alone'],
    typography_behavior: 'absent',
    pacing_behavior: 'quiet',
    product_role: 'hidden',
    forbidden_tones: ['empowerment', 'positivity', 'glow-up', 'self-love'],
    mapped_states: ['quiet-panic', 'before-meeting-panic'],
  },
  avoidance: {
    id: 'avoidance',
    emotional_core: 'the thing I need to do exists in another room of my head',
    contradiction: 'arrived at the task; not doing it',
    physical_behavior: 'phone in hand, key in ignition, shoes half-tied',
    mental_loop: 'one more minute',
    hidden_desire: 'for someone else to decide first',
    silent_sentence: 'I came all the way here and I still cannot start',
    visual_behavior: 'subject is INSIDE the place but not engaged with it',
    energy_signature: 'static',
    atmosphere: 'liminal — parking lot, doorway, the second before',
    cultural_examples: ['parked at the gym, motor running', 'inbox open, scrolling instead', 'dressed for the date, sat back down'],
    typography_behavior: 'whisper',
    pacing_behavior: 'breath',
    product_role: 'hand-held',
    forbidden_tones: ['discipline', 'motivation', 'get-up-and-go'],
    mapped_states: ['pre-workout-hesitation', 'gym-avoidance', 'no-motivation-morning'],
  },
  'emotional-numbness': {
    id: 'emotional-numbness',
    emotional_core: 'a flatness underneath everything — no spike up, no spike down',
    contradiction: 'attending the moment; absent inside it',
    physical_behavior: 'polite half-smile, eyes that do not change',
    mental_loop: '— nothing in particular',
    hidden_desire: 'one feeling, any feeling, that is mine',
    silent_sentence: 'I am here. I do not know if I am here.',
    visual_behavior: 'subject centered but eyes drift; the rest of the frame is louder than the face',
    energy_signature: 'flat',
    atmosphere: 'restaurant, family table, birthday — celebratory contexts that do not land',
    cultural_examples: ['cake in front of them', 'dinner with friends', 'office surprise party'],
    typography_behavior: 'whisper',
    pacing_behavior: 'quiet',
    product_role: 'hidden',
    forbidden_tones: ['joy', 'celebration', 'spark', 'feel-alive'],
    mapped_states: ['emotional-numbness', 'mentally-absent', 'mentally-disconnected', 'mentally-somewhere-else'],
  },
  'too-tired-to-rest': {
    id: 'too-tired-to-rest',
    emotional_core: 'the body has stopped; the brain refuses to follow',
    contradiction: 'horizontal, exhausted, unable to sleep',
    physical_behavior: 'lying down, eyes open, phone in lap',
    mental_loop: 'tomorrow, tomorrow, tomorrow',
    hidden_desire: 'to be unconscious for one full hour',
    silent_sentence: 'I am too tired to do this and too tired to stop',
    visual_behavior: 'lying or slouched — but the head is OFF the rest',
    energy_signature: 'wired',
    atmosphere: 'bedroom past 01:00, phone light on face',
    cultural_examples: ['01:34 staring at ceiling', 'couch after work, eyes open', 'cigarette break that does not break'],
    typography_behavior: 'timestamp-anchor',
    pacing_behavior: 'wired',
    product_role: 'environmental',
    forbidden_tones: ['relaxation', 'sleep-aid', 'calm', 'wind-down'],
    mapped_states: ['exhausted-but-wired', 'low-battery-feeling'],
  },
  'digital-fatigue': {
    id: 'digital-fatigue',
    emotional_core: 'the screen has stopped being a tool; it is the climate',
    contradiction: 'phone in hand, no curiosity left',
    physical_behavior: 'thumb scrolling without seeing, glazed eyes',
    mental_loop: '(nothing — the loop replaced thought)',
    hidden_desire: 'to forget the phone exists for an afternoon',
    silent_sentence: 'I am not reading any of this',
    visual_behavior: 'phone in foreground, face out of focus',
    energy_signature: 'static',
    atmosphere: 'bed, couch, bathroom — anywhere private and lit by a screen',
    cultural_examples: ['bedtime doomscroll', 'bathroom break that became 20 minutes', 'feed open, eyes closed'],
    typography_behavior: 'whisper',
    pacing_behavior: 'quiet',
    product_role: 'environmental',
    forbidden_tones: ['detox', 'unplug', 'analog revival'],
    mapped_states: ['doomscroll-fatigue', 'exhausted-scrolling', 'overconnected-exhaustion'],
  },
  doomscrolling: {
    id: 'doomscrolling',
    emotional_core: 'a low-grade anxiety addiction, fed by infinite feed',
    contradiction: 'looking for relief in the source of the dread',
    physical_behavior: 'thumb moving, jaw slightly clenched, brow tense',
    mental_loop: 'one more, then I will stop, one more',
    hidden_desire: 'to find a piece of bad news that lets the body finally exhale',
    silent_sentence: 'this is making me worse and I cannot put it down',
    visual_behavior: 'face lit blue, eyes wide and unblinking',
    energy_signature: 'wired',
    atmosphere: 'bed at 23:51, kitchen at 02:47, train at dawn',
    cultural_examples: ['ynet refresh', 'reservists feeds', 'app notifications on lockscreen'],
    typography_behavior: 'whisper',
    pacing_behavior: 'wired',
    product_role: 'hidden',
    forbidden_tones: ['mindfulness', 'reduce-screen-time'],
    mapped_states: ['doomscroll-fatigue', 'exhausted-scrolling'],
  },
  'social-performance-exhaustion': {
    id: 'social-performance-exhaustion',
    emotional_core: 'the cost of being readable to other people for hours',
    contradiction: 'liked, included, hosting — and depleted',
    physical_behavior: 'leaning against a wall, eyes resting on the floor between conversations',
    mental_loop: 'how soon can I leave without it being noticed',
    hidden_desire: 'a quiet room with no one to be',
    silent_sentence: 'I have nothing left to give as myself',
    visual_behavior: 'subject at the edge of a social scene, the crowd present but out of focus',
    energy_signature: 'collapsing',
    atmosphere: 'party kitchen, work event corner, wedding bathroom',
    cultural_examples: ['Saturday lunch with extended family', 'work happy hour at 18:00', 'army friend reunion'],
    typography_behavior: 'editorial',
    pacing_behavior: 'slow-interruption',
    product_role: 'hidden',
    forbidden_tones: ['extrovert energy', 'connection', 'community'],
    mapped_states: ['social-exhaustion', 'low-social-battery', 'performance-fatigue'],
  },
  'internal-contradiction': {
    id: 'internal-contradiction',
    emotional_core: 'two things that cannot both be true, both being true',
    contradiction: 'wanting it and dreading it at the same time',
    physical_behavior: 'frozen mid-action, hand hovering',
    mental_loop: 'yes, no, yes, no',
    hidden_desire: 'a clean answer',
    silent_sentence: 'I do not know what I want and I have to decide in three minutes',
    visual_behavior: 'subject visible from one side, the other side cut off — only half a person in frame',
    energy_signature: 'fragmented',
    atmosphere: 'doorway, mirror, the moment before a reply',
    cultural_examples: ['hand hovering over send', 'about to agree to plans', 'considering leaving the meeting'],
    typography_behavior: 'interruption',
    pacing_behavior: 'slow-interruption',
    product_role: 'partial-crop',
    forbidden_tones: ['clarity', 'decisive', 'know-what-you-want'],
    mapped_states: ['decision-fatigue', 'creative-paralysis'],
  },
  'hyper-awareness': {
    id: 'hyper-awareness',
    emotional_core: 'watching themselves do everything from a small distance',
    contradiction: 'present, but as audience',
    physical_behavior: 'movements deliberate, micro-checked, slightly performed',
    mental_loop: 'how does this look',
    hidden_desire: 'to forget they are being watched, including by themselves',
    silent_sentence: 'I keep observing me being me',
    visual_behavior: 'subject in front of a reflective surface — window, mirror, screen',
    energy_signature: 'crackling',
    atmosphere: 'office bathroom, elevator, café window',
    cultural_examples: ['rehearsing before a meeting', 'mirror in the gym', 'phone selfie mode never taken'],
    typography_behavior: 'editorial',
    pacing_behavior: 'staccato',
    product_role: 'partial-crop',
    forbidden_tones: ['confidence', 'self-love', 'authenticity-as-pose'],
    mapped_states: ['before-meeting-panic', 'performance-fatigue', 'dead-eyed-work-mode'],
  },
  'loneliness-in-public': {
    id: 'loneliness-in-public',
    emotional_core: 'surrounded, unreached',
    contradiction: 'plural setting, singular feeling',
    physical_behavior: 'looking at the room, not at any one person',
    mental_loop: 'no one here is going to ask',
    hidden_desire: 'someone to say the right wrong sentence',
    silent_sentence: 'I am sitting in this crowd alone',
    visual_behavior: 'wide environmental frame, subject small inside it',
    energy_signature: 'static',
    atmosphere: 'café, train carriage, restaurant — public spaces where loneliness wears a coat',
    cultural_examples: ['sitting alone at a wedding', 'train ride from miluim', 'café table at lunch hour'],
    typography_behavior: 'whisper',
    pacing_behavior: 'quiet',
    product_role: 'environmental',
    forbidden_tones: ['community', 'belonging', 'tribe'],
    mapped_states: ['mentally-absent', 'mentally-disconnected', 'social-exhaustion'],
  },
  'decision-fatigue': {
    id: 'decision-fatigue',
    emotional_core: 'too many doors, no key',
    contradiction: 'capable of choosing; unable to choose',
    physical_behavior: 'standing in front of options, hand frozen',
    mental_loop: 'either or both or none or — ',
    hidden_desire: 'someone to choose for them, kindly',
    silent_sentence: 'I will pick the same thing as last time',
    visual_behavior: 'subject in front of a wall of options — supermarket aisle, menu, wardrobe',
    energy_signature: 'flat',
    atmosphere: 'supermarket, closet doorway, restaurant menu',
    cultural_examples: ['shufersal dressing aisle', 'restaurant menu, third minute', 'closet on a Wednesday'],
    typography_behavior: 'editorial',
    pacing_behavior: 'quiet',
    product_role: 'environmental',
    forbidden_tones: ['choose-yourself', 'options', 'freedom-of-choice'],
    mapped_states: ['decision-fatigue', 'creative-paralysis', 'tab-switching-paralysis'],
  },
  'inability-to-land': {
    id: 'inability-to-land',
    emotional_core: 'still in motion mentally; the body has stopped',
    contradiction: 'arrived; still arriving',
    physical_behavior: 'sitting down with eyes still scanning, coat still on',
    mental_loop: 'tomorrow I have / next week I need to / I forgot to',
    hidden_desire: 'one minute where the mind is not three minutes ahead',
    silent_sentence: 'I am physically here',
    visual_behavior: 'subject ON a piece of furniture but not committed to it — perched, half-leaning',
    energy_signature: 'wired',
    atmosphere: 'home at 19:00, train seat, the first second of a meeting',
    cultural_examples: ['car still on, motor running', 'sat on the bed with shoes on', 'home, coat still buttoned'],
    typography_behavior: 'whisper',
    pacing_behavior: 'slow-interruption',
    product_role: 'environmental',
    forbidden_tones: ['mindful arrival', 'present moment'],
    mapped_states: ['exhausted-commute', 'emotionally-drained', 'restless-work-energy'],
  },
  'overstimulated-but-flat': {
    id: 'overstimulated-but-flat',
    emotional_core: 'loud world; nothing inside is moving',
    contradiction: 'maximum noise, minimum feeling',
    physical_behavior: 'eyes wide, no expression underneath',
    mental_loop: '(nothing — overload silenced the loop)',
    hidden_desire: 'to feel one thing on purpose',
    silent_sentence: 'so much is happening and I cannot find me',
    visual_behavior: 'subject in a noisy frame with empty eyes',
    energy_signature: 'flat',
    atmosphere: 'concert, mall, open office, group video call',
    cultural_examples: ['birthday party that does not land', 'mall food court', 'open-plan office at noon'],
    typography_behavior: 'editorial',
    pacing_behavior: 'staccato',
    product_role: 'hidden',
    forbidden_tones: ['energy', 'spark', 'electric'],
    mapped_states: ['emotional-static', 'mentally-offline', 'modern-brain-overload'],
  },
  'silent-burnout': {
    id: 'silent-burnout',
    emotional_core: 'continuing to perform while empty',
    contradiction: 'visibly fine, secretly out of fuel',
    physical_behavior: 'still working, posture upright, jaw set, hands moving',
    mental_loop: 'I just have to get through today',
    hidden_desire: 'one person to notice',
    silent_sentence: 'I am running on nothing and nobody can tell',
    visual_behavior: 'subject at work, productive on the surface, body subtly off — clenched, leaning',
    energy_signature: 'crackling',
    atmosphere: 'late office, kitchen at 23:00, studio after deadline',
    cultural_examples: ['founder at the desk past midnight', 'parent finishing the dishes', 'student in the library past closing'],
    typography_behavior: 'editorial',
    pacing_behavior: 'quiet',
    product_role: 'evidence',
    forbidden_tones: ['hustle', 'grit', 'rise-and-grind'],
    mapped_states: ['startup-burnout', 'tired-ambition', 'forced-productivity', 'overwhelmed-founder', 'pressure-fatigue', 'tired-but-continuing'],
  },
  'revenge-bedtime-procrastination': {
    id: 'revenge-bedtime-procrastination',
    emotional_core: 'staying up not because awake, but because the day was not theirs',
    contradiction: 'exhausted; refusing to surrender to sleep',
    physical_behavior: 'lying in bed scrolling, eyes refusing to close',
    mental_loop: 'this hour is mine, this hour is mine',
    hidden_desire: 'to feel like the day belonged to them',
    silent_sentence: 'I will not give this hour back',
    visual_behavior: 'subject in bed in the dark, phone glow on face, no intention to sleep',
    energy_signature: 'wired',
    atmosphere: 'bedroom past 01:00',
    cultural_examples: ['scrolling in bed at 02:14', 'YouTube tab open instead of sleep', 'phone game at 00:30'],
    typography_behavior: 'timestamp-anchor',
    pacing_behavior: 'wired',
    product_role: 'environmental',
    forbidden_tones: ['sleep hygiene', 'morning routine', 'wake-up-fresh'],
    mapped_states: ['exhausted-scrolling', 'exhausted-but-wired'],
  },
  'emotional-fragmentation': {
    id: 'emotional-fragmentation',
    emotional_core: 'feeling six things faintly instead of one thing clearly',
    contradiction: 'busy inside without a single clear thought',
    physical_behavior: 'eyes darting, multiple half-actions started',
    mental_loop: 'a / b / c / a / d / b',
    hidden_desire: 'one feeling that stays for thirty seconds',
    silent_sentence: 'nothing is bothering me and everything is',
    visual_behavior: 'multiple focal pulls in the frame — phone, screen, person',
    energy_signature: 'fragmented',
    atmosphere: 'multi-monitor desk, open kitchen, kid in the background',
    cultural_examples: ['parent half-working from home', 'kitchen at 18:30', 'desk during a Slack storm'],
    typography_behavior: 'whisper',
    pacing_behavior: 'staccato',
    product_role: 'environmental',
    forbidden_tones: ['focus', 'simplify', 'centred'],
    mapped_states: ['attention-fragmentation', 'fake-productivity', 'tab-switching-paralysis', 'workday-blur'],
  },
  'hidden-anxiety': {
    id: 'hidden-anxiety',
    emotional_core: 'the body is anxious; the face is professional',
    contradiction: 'reassuring others while flooding inside',
    physical_behavior: 'public composure, private fingernail',
    mental_loop: 'just smile, just smile, just smile',
    hidden_desire: 'to be allowed to leave for ninety seconds',
    silent_sentence: 'they cannot see what is happening in my chest',
    visual_behavior: 'subject in a public context but framed close enough to catch the body, not the smile',
    energy_signature: 'crackling',
    atmosphere: 'meeting room, family lunch, dentist waiting room',
    cultural_examples: ['parent at the school meeting', 'office presentation', 'driving to the airport'],
    typography_behavior: 'whisper',
    pacing_behavior: 'slow-interruption',
    product_role: 'hidden',
    forbidden_tones: ['relax', 'breathe', 'you-got-this'],
    mapped_states: ['quiet-panic', 'before-meeting-panic', 'unread-messages-anxiety', 'sunday-anxiety'],
  },
  'invisible-pressure': {
    id: 'invisible-pressure',
    emotional_core: 'weight nobody else can see, that nobody else is carrying',
    contradiction: 'looks like a person; is a load-bearing wall',
    physical_behavior: 'shoulders raised, jaw set, breath shallow',
    mental_loop: 'I am the only one who can do this',
    hidden_desire: 'someone competent to take ONE thing off the list',
    silent_sentence: 'if I stop, everything stops',
    visual_behavior: 'subject UNDER the frame — low angle, ceiling above them tight',
    energy_signature: 'crackling',
    atmosphere: 'boardroom, founder kitchen, parent at school gate',
    cultural_examples: ['founder pacing the floor at 22:00', 'parent at the kid-pickup', 'team lead before a release'],
    typography_behavior: 'editorial',
    pacing_behavior: 'staccato',
    product_role: 'evidence',
    forbidden_tones: ['delegate', 'self-care', 'lean-in'],
    mapped_states: ['overwhelmed-founder', 'pressure-fatigue', 'endless-task-feeling', 'restless-work-energy'],
  },
  'functional-collapse': {
    id: 'functional-collapse',
    emotional_core: 'still completing tasks; the person has left',
    contradiction: 'productive shell, hollow centre',
    physical_behavior: 'unbroken work, eyes that no longer track',
    mental_loop: '(autopilot, no language)',
    hidden_desire: 'one person to ask if they are okay',
    silent_sentence: 'I keep doing the things',
    visual_behavior: 'subject at work with the screen reflection BLANK, not the work',
    energy_signature: 'flat',
    atmosphere: 'office at 17:22, kitchen at 22:00, hospital corridor at 03:00',
    cultural_examples: ['nurse at end of shift', 'parent at the laundry pile', 'teacher in the staff room'],
    typography_behavior: 'absent',
    pacing_behavior: 'breath',
    product_role: 'environmental',
    forbidden_tones: ['productivity-celebrated', 'achievement', 'flow-state'],
    mapped_states: ['dead-eyed-work-mode', 'zombie-mode', 'body-awake-mind-asleep', 'mentally-checked-out'],
  },
  'emotional-drift': {
    id: 'emotional-drift',
    emotional_core: 'not sad, not fine, not anything that has a word',
    contradiction: 'not depressed; not okay either',
    physical_behavior: 'eyes on the window, hand on the glass, slow breath',
    mental_loop: '(no loop, just a hum)',
    hidden_desire: 'to be moved by something on purpose',
    silent_sentence: 'I am living and I am not landing',
    visual_behavior: 'subject in profile, eyes off-frame, weather in the window',
    energy_signature: 'static',
    atmosphere: 'sunday afternoon, train window, bedroom on a quiet day',
    cultural_examples: ['Saturday afternoon at home', 'window seat on a slow train', 'kitchen with the kettle off'],
    typography_behavior: 'whisper',
    pacing_behavior: 'breath',
    product_role: 'environmental',
    forbidden_tones: ['joy', 'feel-it', 'find-your-spark'],
    mapped_states: ['emotional-static', 'slow-brain-morning', 'mentally-somewhere-else', 'impossible-focus'],
  },
};

/** Find the emotional core(s) that a given ENERGY state maps onto. */
export function coresForState(state: HumanState | string): EmotionalCore[] {
  const id = typeof state === 'string' ? state : state.id;
  return Object.values(EMOTIONAL_CORES).filter((c) => c.mapped_states.includes(id));
}

/** All cores. Stable order: as declared above. */
export function listCores(): EmotionalCore[] {
  return Object.values(EMOTIONAL_CORES);
}
