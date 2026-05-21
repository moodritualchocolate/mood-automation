/**
 * CULTURAL MEMORY ENGINE
 *
 * 20 structured real-life micro-moments. NOT stock-photo life.
 * Includes Israeli specificity where the spec named it (miluim,
 * Saturday emotional stillness, the 16:47 office brain death).
 *
 * Each moment is the BUILT-WORLD half of the human truth — the
 * physical situation where the emotional core lives. The cultural-
 * intelligence engine selects one of these per banner (alongside the
 * broader cultural mood like "exhaustion culture") so the image
 * brief can ground itself in a specific lived second.
 */

import type { EmotionalCoreId } from './humanTruthEngine';

export type CulturalMicroMomentId =
  | 'car-after-work'
  | 'fridge-open-at-night'
  | 'unread-whatsapp'
  | 'bed-scrolling'
  | 'office-fluorescent'
  | 'train-ride-silence'
  | 'reserves-fatigue'
  | 'startup-late-night'
  | 'parenting-overload'
  | 'coffee-machine-emptiness'
  | 'no-energy-for-people'
  | 'saturday-stillness'
  | 'overstimulated-tabs'
  | 'office-1647-brain-death'
  | 'post-meeting-emptiness'
  | 'zoning-out'
  | 'eating-without-hunger'
  | 'late-kitchen-silence'
  | 'avoiding-messages'
  | 'staring-without-processing';

export interface CulturalMicroMoment {
  state_id: CulturalMicroMomentId;
  environment: string;
  emotional_temperature: 'warm-but-tired' | 'cool-flat' | 'overcast' | 'fluorescent-cold' | 'window-soft' | 'screen-blue' | 'dawn-grey';
  soundscape: string;
  camera_behavior: string;
  body_language: string;
  lighting_behavior: string;
  object_meaning: string;
  social_context: 'solitary' | 'public-alone' | 'shared-room-private-feeling' | 'plural';
  silence_level: number;        // 0..1 — how loud the room IS (silence high = quiet)
  pacing: 'breath' | 'still' | 'slow' | 'staccato' | 'wired';
  typography_density: 'absent' | 'whisper' | 'editorial' | 'timestamp-only';
  campaign_fit: EmotionalCoreId[];
  visual_reference_tags: string[];
  is_israeli_specific: boolean;
}

export const CULTURAL_MICRO_MOMENTS: Record<CulturalMicroMomentId, CulturalMicroMoment> = {
  'car-after-work': {
    state_id: 'car-after-work',
    environment: 'driver seat, engine off, key still in the ignition',
    emotional_temperature: 'warm-but-tired',
    soundscape: 'engine ticking cool, distant traffic',
    camera_behavior: 'close, asymmetric, slight rake — interior of a car shot from the passenger side',
    body_language: 'head against headrest, hands still on the wheel',
    lighting_behavior: 'street-lamp orange through windshield, the rest of the cabin in shadow',
    object_meaning: 'keys in ignition = unable to start the next thing',
    social_context: 'solitary',
    silence_level: 0.85,
    pacing: 'breath',
    typography_density: 'whisper',
    campaign_fit: ['inability-to-land', 'depletion', 'silent-burnout'],
    visual_reference_tags: ['nocturnal-stillness', 'interior-quiet', 'documentary-portrait'],
    is_israeli_specific: false,
  },
  'fridge-open-at-night': {
    state_id: 'fridge-open-at-night',
    environment: 'kitchen at 23:51, fridge door open, light on the face',
    emotional_temperature: 'cool-flat',
    soundscape: 'fridge compressor hum, distant city',
    camera_behavior: 'mid shot from inside the kitchen, fridge as light source',
    body_language: 'standing barefoot, one hand on the door, eyes scanning without intent',
    lighting_behavior: 'cold fridge light from below, kitchen dark behind',
    object_meaning: 'open fridge = looking for something that is not in the fridge',
    social_context: 'solitary',
    silence_level: 0.9,
    pacing: 'still',
    typography_density: 'whisper',
    campaign_fit: ['eating-without-hunger' as any, 'emotional-drift', 'too-tired-to-rest'].filter(Boolean) as EmotionalCoreId[],
    visual_reference_tags: ['kitchen-nocturne', 'fridge-light', 'private-domestic'],
    is_israeli_specific: false,
  },
  'unread-whatsapp': {
    state_id: 'unread-whatsapp',
    environment: 'phone on table, screen lit, notification stack visible from outside the frame',
    emotional_temperature: 'cool-flat',
    soundscape: 'silence + occasional buzz',
    camera_behavior: 'macro on phone screen, face deliberately out of focus in background',
    body_language: 'hand near phone, not picking it up',
    lighting_behavior: 'natural window light, phone glow distinct',
    object_meaning: 'unread WhatsApp = obligation not yet decided',
    social_context: 'shared-room-private-feeling',
    silence_level: 0.8,
    pacing: 'still',
    typography_density: 'absent',
    campaign_fit: ['guilt', 'avoidance', 'hidden-anxiety'],
    visual_reference_tags: ['device-as-object', 'phone-light', 'avoidance-portrait'],
    is_israeli_specific: true,
  },
  'bed-scrolling': {
    state_id: 'bed-scrolling',
    environment: 'bedroom past 01:00, phone overhead, blue light on face',
    emotional_temperature: 'screen-blue',
    soundscape: 'silence + phone touchscreen taps',
    camera_behavior: 'top-down or 3/4 from above, frame includes only the upper body',
    body_language: 'lying flat, eyes lit, thumb on screen',
    lighting_behavior: 'phone is the only light source',
    object_meaning: 'phone above the face = the day refused to end',
    social_context: 'solitary',
    silence_level: 0.95,
    pacing: 'wired',
    typography_density: 'timestamp-only',
    campaign_fit: ['too-tired-to-rest', 'revenge-bedtime-procrastination', 'doomscrolling'],
    visual_reference_tags: ['nocturnal-portrait', 'phone-blue', 'documentary-intimate'],
    is_israeli_specific: false,
  },
  'office-fluorescent': {
    state_id: 'office-fluorescent',
    environment: 'open-plan office, fluorescent ceiling, monitor in foreground',
    emotional_temperature: 'fluorescent-cold',
    soundscape: 'mechanical air, keyboard cluster, low voices',
    camera_behavior: '35mm at desk height, slight off-axis crop, edges of frame include other desks',
    body_language: 'leaning forward at screen, shoulders raised, eyes flat',
    lighting_behavior: 'even fluorescent, no shadow definition — the absence of theatre',
    object_meaning: 'monitor glow on face = work has replaced expression',
    social_context: 'shared-room-private-feeling',
    silence_level: 0.45,
    pacing: 'staccato',
    typography_density: 'editorial',
    campaign_fit: ['silent-burnout', 'functional-collapse', 'overstimulated-but-flat'],
    visual_reference_tags: ['office-realism', 'fluorescent-flat', 'editorial-doc'],
    is_israeli_specific: false,
  },
  'train-ride-silence': {
    state_id: 'train-ride-silence',
    environment: 'train window seat, evening, city sliding past the glass',
    emotional_temperature: 'window-soft',
    soundscape: 'rail rhythm, occasional announcement, no conversation',
    camera_behavior: '3/4 from the next seat, the window doing half the work',
    body_language: 'head against glass, eyes on motion, body still',
    lighting_behavior: 'street and platform lights stutter across the face',
    object_meaning: 'window = the outsourcing of looking',
    social_context: 'public-alone',
    silence_level: 0.7,
    pacing: 'slow',
    typography_density: 'whisper',
    campaign_fit: ['loneliness-in-public', 'inability-to-land', 'emotional-drift'],
    visual_reference_tags: ['commute-portrait', 'window-light', 'documentary-quiet'],
    is_israeli_specific: false,
  },
  'reserves-fatigue': {
    state_id: 'reserves-fatigue',
    environment: 'kitchen the day after returning from miluim, uniform half-folded on a chair',
    emotional_temperature: 'warm-but-tired',
    soundscape: 'kettle, distant kid, traffic outside',
    camera_behavior: 'medium shot, slight low angle, the chair and the uniform sharing focus with the person',
    body_language: 'sitting with both hands on a mug, staring past it',
    lighting_behavior: 'morning window light, warm but ambivalent',
    object_meaning: 'uniform on the chair = the body has not arrived yet',
    social_context: 'solitary',
    silence_level: 0.8,
    pacing: 'breath',
    typography_density: 'whisper',
    campaign_fit: ['depletion', 'inability-to-land', 'silent-burnout'],
    visual_reference_tags: ['post-miluim', 'kitchen-quiet', 'israeli-doc'],
    is_israeli_specific: true,
  },
  'startup-late-night': {
    state_id: 'startup-late-night',
    environment: 'open-plan office at 23:42, one screen lit, the rest dark',
    emotional_temperature: 'screen-blue',
    soundscape: 'building HVAC, single keyboard',
    camera_behavior: 'wide environmental, the empty office around them, subject small',
    body_language: 'one hand on chin, the other still on the trackpad',
    lighting_behavior: 'monitor blue + a desk lamp warm — the only two lights',
    object_meaning: 'empty desks = the ambition outlived the team',
    social_context: 'solitary',
    silence_level: 0.95,
    pacing: 'breath',
    typography_density: 'editorial',
    campaign_fit: ['silent-burnout', 'invisible-pressure', 'depletion'],
    visual_reference_tags: ['founder-night', 'empty-office', 'editorial-doc'],
    is_israeli_specific: true,
  },
  'parenting-overload': {
    state_id: 'parenting-overload',
    environment: 'living-room floor, toys around, child has just left the room',
    emotional_temperature: 'warm-but-tired',
    soundscape: 'TV in another room, dishwasher cycle',
    camera_behavior: 'low angle from the floor, subject sat on the rug',
    body_language: 'sitting on the floor, back against the sofa, head dropped',
    lighting_behavior: 'late afternoon window, soft and patient',
    object_meaning: 'one toy still in their hand = the day did not end, it paused',
    social_context: 'solitary',
    silence_level: 0.75,
    pacing: 'breath',
    typography_density: 'whisper',
    campaign_fit: ['depletion', 'silent-burnout', 'invisible-pressure'],
    visual_reference_tags: ['parent-doc', 'living-room', 'documentary-quiet'],
    is_israeli_specific: false,
  },
  'coffee-machine-emptiness': {
    state_id: 'coffee-machine-emptiness',
    environment: 'office kitchenette, espresso machine, single cup in hand',
    emotional_temperature: 'fluorescent-cold',
    soundscape: 'distant Slack notification chime, lift, conversation behind a wall',
    camera_behavior: 'close on hands and machine, face out of frame or partly visible',
    body_language: 'standing still, cup in one hand, the other on the counter',
    lighting_behavior: 'overhead cool, machine indicator light',
    object_meaning: 'cup full = ritual completed, function unchanged',
    social_context: 'shared-room-private-feeling',
    silence_level: 0.6,
    pacing: 'slow',
    typography_density: 'editorial',
    campaign_fit: ['depletion', 'functional-collapse', 'silent-burnout'],
    visual_reference_tags: ['kitchenette', 'macro-hands', 'office-doc'],
    is_israeli_specific: false,
  },
  'no-energy-for-people': {
    state_id: 'no-energy-for-people',
    environment: 'apartment doorway, coat in hand, the party is on the other side',
    emotional_temperature: 'warm-but-tired',
    soundscape: 'voices from inside, faint',
    camera_behavior: '3/4 over the shoulder, the door as compositional barrier',
    body_language: 'one hand on the doorframe, the other holding the coat, head tilted',
    lighting_behavior: 'hallway dim, room beyond bright',
    object_meaning: 'coat in hand = the social cost has been calculated',
    social_context: 'plural',
    silence_level: 0.5,
    pacing: 'still',
    typography_density: 'whisper',
    campaign_fit: ['social-performance-exhaustion', 'avoidance', 'loneliness-in-public'],
    visual_reference_tags: ['threshold', 'doc-quiet', 'editorial-intimate'],
    is_israeli_specific: false,
  },
  'saturday-stillness': {
    state_id: 'saturday-stillness',
    environment: 'living room on a Saturday at 14:00, light through the curtain',
    emotional_temperature: 'window-soft',
    soundscape: 'silence of a closed city, distant child laughter, kettle in another room',
    camera_behavior: 'wide environmental, subject small in a room that has stopped',
    body_language: 'sat on the sofa, book unopen in lap',
    lighting_behavior: 'natural window light, slow shadows',
    object_meaning: 'open curtain = the day refused to start, refused to end',
    social_context: 'solitary',
    silence_level: 0.9,
    pacing: 'breath',
    typography_density: 'absent',
    campaign_fit: ['emotional-drift', 'depletion', 'too-tired-to-rest'],
    visual_reference_tags: ['shabbat-stillness', 'living-room', 'editorial-quiet'],
    is_israeli_specific: true,
  },
  'overstimulated-tabs': {
    state_id: 'overstimulated-tabs',
    environment: 'desk with three open monitors, ten Slack windows, a coffee that went cold',
    emotional_temperature: 'screen-blue',
    soundscape: 'continuous notification ping, mechanical air',
    camera_behavior: 'screen reflection in the eyes, the surfaces of the monitors out of focus',
    body_language: 'multiple half-turns, hands hovering between input devices',
    lighting_behavior: 'monitor blue + harsh overhead',
    object_meaning: 'cold coffee = the ritual did not work',
    social_context: 'shared-room-private-feeling',
    silence_level: 0.35,
    pacing: 'staccato',
    typography_density: 'editorial',
    campaign_fit: ['overstimulation', 'emotional-fragmentation', 'overstimulated-but-flat'],
    visual_reference_tags: ['multi-screen', 'desk-doc', 'office-realism'],
    is_israeli_specific: false,
  },
  'office-1647-brain-death': {
    state_id: 'office-1647-brain-death',
    environment: 'office at 16:47, sun on a slant through blinds, screens dimmed in user opinion if not in fact',
    emotional_temperature: 'warm-but-tired',
    soundscape: 'air conditioning, single keyboard, someone laughing in a meeting room',
    camera_behavior: 'close on face, screen reflection visible, blinds throwing horizontal lines',
    body_language: 'eyes glazed, forehead in palm, the work is open but unread',
    lighting_behavior: 'low afternoon angle, warm but accusing',
    object_meaning: 'open spreadsheet = the appearance of work',
    social_context: 'shared-room-private-feeling',
    silence_level: 0.55,
    pacing: 'still',
    typography_density: 'timestamp-only',
    campaign_fit: ['depletion', 'functional-collapse', 'silent-burnout'],
    visual_reference_tags: ['office-1647', 'blinds-light', 'doc-portrait'],
    is_israeli_specific: false,
  },
  'post-meeting-emptiness': {
    state_id: 'post-meeting-emptiness',
    environment: 'corridor outside a meeting room, door just closed',
    emotional_temperature: 'fluorescent-cold',
    soundscape: 'distant office, lift mechanism',
    camera_behavior: 'medium from the side, the door composition behind',
    body_language: 'walking but slowed, breath visible, eyes on the floor',
    lighting_behavior: 'cool overhead, corridor depth',
    object_meaning: 'closing door = the performance is over',
    social_context: 'shared-room-private-feeling',
    silence_level: 0.7,
    pacing: 'slow',
    typography_density: 'whisper',
    campaign_fit: ['social-performance-exhaustion', 'hidden-anxiety', 'silent-burnout'],
    visual_reference_tags: ['corridor', 'post-event', 'doc-quiet'],
    is_israeli_specific: false,
  },
  'zoning-out': {
    state_id: 'zoning-out',
    environment: 'video call open, camera ON, mouth slightly open, mind elsewhere',
    emotional_temperature: 'screen-blue',
    soundscape: 'compressed voice over speakers',
    camera_behavior: 'webcam framing — slightly low, slightly close, slightly unflattering',
    body_language: 'nodding without listening, the eyes elsewhere',
    lighting_behavior: 'screen on face',
    object_meaning: 'open call = social presence without social cost',
    social_context: 'public-alone',
    silence_level: 0.4,
    pacing: 'breath',
    typography_density: 'whisper',
    campaign_fit: ['emotional-numbness', 'overstimulated-but-flat', 'functional-collapse'],
    visual_reference_tags: ['webcam-portrait', 'screen-blue', 'doc-realism'],
    is_israeli_specific: false,
  },
  'eating-without-hunger': {
    state_id: 'eating-without-hunger',
    environment: 'kitchen counter, snack open, eyes on a phone, no hunger involved',
    emotional_temperature: 'cool-flat',
    soundscape: 'crinkle, distant television',
    camera_behavior: 'macro on hand-mouth-phone triangle',
    body_language: 'mechanical eating, no chewing rhythm',
    lighting_behavior: 'evening kitchen, single light',
    object_meaning: 'snack as palliative, not nutrition',
    social_context: 'solitary',
    silence_level: 0.65,
    pacing: 'still',
    typography_density: 'whisper',
    campaign_fit: ['emotional-numbness', 'digital-fatigue', 'emotional-drift'],
    visual_reference_tags: ['kitchen-macro', 'snack-portrait', 'doc-domestic'],
    is_israeli_specific: false,
  },
  'late-kitchen-silence': {
    state_id: 'late-kitchen-silence',
    environment: 'kitchen after midnight, dishes from dinner still on the counter',
    emotional_temperature: 'cool-flat',
    soundscape: 'tap drip, fridge, the city through one window',
    camera_behavior: 'wide environmental, subject small, the kitchen the actual subject',
    body_language: 'standing at the sink, hands on the counter, head down',
    lighting_behavior: 'one light, low, warm',
    object_meaning: 'unwashed dishes = the day refused to be put away',
    social_context: 'solitary',
    silence_level: 0.92,
    pacing: 'breath',
    typography_density: 'absent',
    campaign_fit: ['too-tired-to-rest', 'depletion', 'silent-burnout'],
    visual_reference_tags: ['kitchen-night', 'sink-portrait', 'editorial-quiet'],
    is_israeli_specific: false,
  },
  'avoiding-messages': {
    state_id: 'avoiding-messages',
    environment: 'phone face-down on a table, screen lighting up against the wood',
    emotional_temperature: 'cool-flat',
    soundscape: 'occasional buzz, otherwise silence',
    camera_behavior: 'close on the phone-on-wood; face deliberately out of frame',
    body_language: 'hand near, not on, the phone',
    lighting_behavior: 'window light, the table darker than the wall',
    object_meaning: 'face-down phone = chosen unreachability',
    social_context: 'solitary',
    silence_level: 0.85,
    pacing: 'still',
    typography_density: 'absent',
    campaign_fit: ['avoidance', 'guilt', 'hidden-anxiety'],
    visual_reference_tags: ['phone-down', 'macro-still-life', 'doc-quiet'],
    is_israeli_specific: false,
  },
  'staring-without-processing': {
    state_id: 'staring-without-processing',
    environment: 'desk, document open, eyes on it, not reading',
    emotional_temperature: 'fluorescent-cold',
    soundscape: 'office air, distant typing',
    camera_behavior: 'close on eyes, document blurred in foreground',
    body_language: 'still, breath shallow, no sign of comprehension',
    lighting_behavior: 'monitor cool, overhead even',
    object_meaning: 'open document = appearance of work, absence of reading',
    social_context: 'shared-room-private-feeling',
    silence_level: 0.6,
    pacing: 'still',
    typography_density: 'whisper',
    campaign_fit: ['functional-collapse', 'emotional-fragmentation', 'overstimulated-but-flat'],
    visual_reference_tags: ['desk-portrait', 'doc-realism', 'office-quiet'],
    is_israeli_specific: false,
  },
};

/** All cultural micro-moments. Stable order by declaration. */
export function listMicroMoments(): CulturalMicroMoment[] {
  return Object.values(CULTURAL_MICRO_MOMENTS);
}

/** Find micro-moments that fit a given emotional core. */
export function momentsForCore(coreId: EmotionalCoreId): CulturalMicroMoment[] {
  return Object.values(CULTURAL_MICRO_MOMENTS).filter((m) => m.campaign_fit.includes(coreId));
}
