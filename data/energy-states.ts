/**
 * The 59 ENERGY human states.
 *
 * Each state is structured data — not just a label — because:
 *  - the Human Truth engine reads `body` and `setting` to ground language
 *  - the Composition Planner uses `timeAnchor` to decide if a timestamp earns its place
 *  - the State Selector uses `family` to ensure rotation across emotional categories
 *
 * Order is intentional: the first ~15 are the strongest hooks and should
 * dominate launch rotation; later entries widen the emotional surface area.
 */

import type { HumanState } from '@/core/types';

export const ENERGY_STATES: HumanState[] = [
  { id: 'afternoon-crash', label: 'afternoon crash', family: 'collapse', timeAnchor: '16:30', setting: ['open office', 'desk', 'shared kitchen'], body: ['eyes half-closed', 'hand on forehead', 'leaning on elbow'], weight: 1 },
  { id: 'third-coffee', label: 'third coffee', family: 'fatigue', timeAnchor: null, setting: ['kitchen counter', 'cafe', 'desk corner'], body: ['cup held too tight', 'staring past it', 'unmoving hand'], weight: 1 },
  { id: 'startup-burnout', label: 'startup burnout', family: 'fatigue', timeAnchor: null, setting: ['empty meeting room', 'apartment desk at night', 'laptop on bed'], body: ['shoulders down', 'mouth slightly open', 'staring at screen'], weight: 1 },
  { id: 'pre-workout-hesitation', label: 'pre-workout hesitation', family: 'avoidance', timeAnchor: null, setting: ['gym entrance', 'parked car', 'changing room bench'], body: ['shoes half-tied', 'phone in hand', 'not moving'], weight: 1 },
  { id: 'doomscroll-fatigue', label: 'doomscroll fatigue', family: 'overstimulation', timeAnchor: null, setting: ['couch', 'bed', 'toilet seat'], body: ['thumb on screen', 'glazed eyes', 'slack jaw'], weight: 1 },
  { id: 'unread-messages-anxiety', label: 'unread messages anxiety', family: 'pressure', timeAnchor: null, setting: ['kitchen island', 'subway seat', 'meeting room'], body: ['phone face down', 'finger hovering', 'screen lit but ignored'], weight: 1 },
  { id: 'mentally-absent', label: 'mentally absent', family: 'numbness', timeAnchor: null, setting: ['restaurant table', 'family dinner', 'office party'], body: ['smiling without reach', 'eyes elsewhere', 'glass untouched'], weight: 1 },
  { id: 'social-exhaustion', label: 'social exhaustion', family: 'fatigue', timeAnchor: null, setting: ['party bathroom', 'coat closet', 'parking lot after dinner'], body: ['back against wall', 'eyes closed', 'shoulders dropped'], weight: 1 },
  { id: 'airport-fatigue', label: 'airport fatigue', family: 'collapse', timeAnchor: null, setting: ['terminal floor', 'gate seats', 'duty free aisle'], body: ['head on bag', 'legs sprawled', 'boarding pass crumpled'], weight: 1 },
  { id: 'zombie-mode', label: 'zombie mode', family: 'numbness', timeAnchor: null, setting: ['elevator', 'office corridor', 'kitchen sink'], body: ['blank stare', 'mechanical hand', 'unblinking'], weight: 1 },
  { id: 'low-battery-feeling', label: 'low battery feeling', family: 'collapse', timeAnchor: null, setting: ['couch', 'car seat', 'kitchen floor'], body: ['phone dying', 'body slumped', 'eyes half-lidded'], weight: 1 },
  { id: 'too-many-tabs', label: 'too many tabs', family: 'fragmentation', timeAnchor: null, setting: ['laptop on desk', 'monitor wall', 'cafe table'], body: ['cursor still', 'mouth slightly open', 'eyes scanning'], weight: 1 },
  { id: 'post-lunch-collapse', label: 'post-lunch collapse', family: 'collapse', timeAnchor: '14:10', setting: ['conference room', 'desk', 'office sofa'], body: ['fork down', 'belly out', 'eyes glazed'], weight: 1 },
  { id: 'creative-paralysis', label: 'creative paralysis', family: 'paralysis', timeAnchor: null, setting: ['studio desk', 'blank canvas', 'empty doc'], body: ['hand on chin', 'mouse still', 'one eye narrowed'], weight: 1 },
  { id: 'before-meeting-panic', label: 'before meeting panic', family: 'pressure', timeAnchor: '08:57', setting: ['bathroom mirror', 'office stairwell', 'parked car'], body: ['phone in shaking hand', 'mouthing words', 'eyes wide'], weight: 1 },
  { id: 'exhausted-parenting', label: 'exhausted parenting', family: 'fatigue', timeAnchor: null, setting: ['kitchen floor', 'living room couch', 'kid bedroom doorway'], body: ['toy in lap', 'head against wall', 'eyes closed'], weight: 1 },
  { id: 'emotional-overload', label: 'emotional overload', family: 'overstimulation', timeAnchor: null, setting: ['car steering wheel', 'shower', 'office stall'], body: ['hands covering face', 'silent', 'shoulders shaking quietly'], weight: 1 },
  { id: 'exhausted-commute', label: 'exhausted commute', family: 'fatigue', timeAnchor: '18:42', setting: ['bus window', 'train aisle', 'subway pole'], body: ['head against glass', 'phone in lap', 'eyes closed'], weight: 1 },
  { id: 'sunday-anxiety', label: 'Sunday anxiety', family: 'pressure', timeAnchor: '21:14', setting: ['bedroom', 'kitchen', 'balcony'], body: ['staring at calendar', 'arms crossed', 'jaw tight'], weight: 1 },
  { id: 'mentally-offline', label: 'mentally offline', family: 'numbness', timeAnchor: null, setting: ['standup meeting', 'video call', 'gym mirror'], body: ['nodding without listening', 'unfocused eyes', 'forced smile'], weight: 1 },
  { id: 'tired-but-continuing', label: 'tired but continuing', family: 'fatigue', timeAnchor: null, setting: ['treadmill', 'spreadsheet screen', 'kitchen at 23:00'], body: ['leaning forward', 'jaw set', 'breathing slow'], weight: 1 },
  { id: 'overstimulated-brain', label: 'overstimulated brain', family: 'overstimulation', timeAnchor: null, setting: ['street corner', 'mall escalator', 'open plan office'], body: ['hand on temple', 'eyes squinting', 'mouth shut tight'], weight: 1 },
  { id: 'no-motivation-morning', label: 'no motivation morning', family: 'avoidance', timeAnchor: '07:18', setting: ['bed', 'bathroom edge', 'kitchen window'], body: ['blanket half-on', 'eyes closed', 'phone glowing'], weight: 1 },
  { id: 'fake-productivity', label: 'fake productivity', family: 'fragmentation', timeAnchor: null, setting: ['office desk', 'home setup', 'cafe table'], body: ['typing without reading', 'multiple tabs open', 'eyes glazed'], weight: 1 },
  { id: 'body-awake-mind-asleep', label: 'body awake, mind asleep', family: 'numbness', timeAnchor: null, setting: ['shower', 'commute', 'kitchen'], body: ['mechanical movements', 'staring through', 'autopilot'], weight: 1 },
  { id: 'exhausted-scrolling', label: 'exhausted scrolling', family: 'overstimulation', timeAnchor: '23:51', setting: ['bed', 'couch', 'bathroom floor'], body: ['phone above face', 'thumb tired', 'eyes refusing to close'], weight: 1 },
  { id: 'dead-eyed-work-mode', label: 'dead-eyed work mode', family: 'numbness', timeAnchor: null, setting: ['desk', 'open plan', 'standing desk'], body: ['blank screen reflection', 'unblinking', 'shoulders forward'], weight: 1 },
  { id: 'mentally-disconnected', label: 'mentally disconnected', family: 'numbness', timeAnchor: null, setting: ['date night', 'family lunch', 'friend cafe'], body: ['nodding politely', 'eyes drifting', 'glass half-full'], weight: 1 },
  { id: 'overwhelmed-founder', label: 'overwhelmed founder', family: 'pressure', timeAnchor: null, setting: ['empty office at night', 'kitchen island', 'taxi backseat'], body: ['head in hands', 'phone vibrating', 'laptop still open'], weight: 1 },
  { id: 'tab-switching-paralysis', label: 'tab switching paralysis', family: 'fragmentation', timeAnchor: null, setting: ['laptop screen', 'desk', 'monitor wall'], body: ['hand on trackpad', 'eyes flicking', 'mouth slightly open'], weight: 1 },
  { id: 'gym-avoidance', label: 'gym avoidance', family: 'avoidance', timeAnchor: null, setting: ['parking lot', 'changing room', 'apartment doorway'], body: ['gym bag at feet', 'phone in hand', 'not moving'], weight: 1 },
  { id: 'emotional-numbness', label: 'emotional numbness', family: 'numbness', timeAnchor: null, setting: ['birthday party', 'office celebration', 'family dinner'], body: ['half-smile', 'eyes flat', 'hands in lap'], weight: 1 },
  { id: 'restless-work-energy', label: 'restless work energy', family: 'pressure', timeAnchor: null, setting: ['standing desk', 'pacing office', 'phone room'], body: ['bouncing leg', 'hand on neck', 'clicking pen'], weight: 1 },
  { id: 'late-afternoon-collapse', label: 'late afternoon collapse', family: 'collapse', timeAnchor: '17:22', setting: ['office sofa', 'desk forehead-down', 'window seat'], body: ['arms loose', 'head heavy', 'breathing slow'], weight: 1 },
  { id: 'exhausted-creativity', label: 'exhausted creativity', family: 'paralysis', timeAnchor: null, setting: ['studio', 'desk', 'sketchbook on lap'], body: ['pen still', 'staring at wall', 'eyes hollow'], weight: 1 },
  { id: 'forced-productivity', label: 'forced productivity', family: 'pressure', timeAnchor: null, setting: ['office at 21:00', 'cafe closing', 'kitchen table'], body: ['leaning into screen', 'jaw clenched', 'shoulders up'], weight: 1 },
  { id: 'caffeine-no-longer-works', label: 'caffeine no longer works', family: 'fatigue', timeAnchor: null, setting: ['kitchen', 'cafe counter', 'desk corner'], body: ['empty cup', 'tired eyes', 'same posture as before'], weight: 1 },
  { id: 'attention-fragmentation', label: 'attention fragmentation', family: 'fragmentation', timeAnchor: null, setting: ['multi-monitor desk', 'cafe corner', 'open notebook'], body: ['head turning', 'eyes darting', 'mouth slightly open'], weight: 1 },
  { id: 'low-social-battery', label: 'low social battery', family: 'fatigue', timeAnchor: null, setting: ['party kitchen', 'office breakroom', 'event lobby'], body: ['back against wall', 'cup in hand', 'eyes on floor'], weight: 1 },
  { id: 'constant-notifications', label: 'constant notifications', family: 'overstimulation', timeAnchor: null, setting: ['desk', 'bedside table', 'shared kitchen'], body: ['phone buzzing', 'hand reaching then stopping', 'eyes tired'], weight: 1 },
  { id: 'decision-fatigue', label: 'decision fatigue', family: 'paralysis', timeAnchor: null, setting: ['supermarket aisle', 'menu in hand', 'closet doorway'], body: ['hand frozen', 'eyes scanning', 'jaw slack'], weight: 1 },
  { id: 'mentally-checked-out', label: 'mentally checked out', family: 'numbness', timeAnchor: null, setting: ['video call', 'team meeting', 'training session'], body: ['nodding mechanically', 'eyes unfocused', 'mute on'], weight: 1 },
  { id: 'emotional-static', label: 'emotional static', family: 'fragmentation', timeAnchor: null, setting: ['bus seat', 'cafe window', 'street corner'], body: ['blank stare', 'thumb on phone', 'breathing shallow'], weight: 1 },
  { id: 'workday-blur', label: 'workday blur', family: 'fragmentation', timeAnchor: null, setting: ['office', 'desk', 'kitchen at lunch'], body: ['head tilted slightly', 'eyes glazed', 'pen still in hand'], weight: 1 },
  { id: 'quiet-panic', label: 'quiet panic', family: 'pressure', timeAnchor: null, setting: ['office stall', 'parked car', 'stairwell'], body: ['hand on chest', 'eyes wide', 'shallow breath'], weight: 1 },
  { id: 'overstimulated-office', label: 'overstimulated office', family: 'overstimulation', timeAnchor: null, setting: ['open plan', 'phone booth', 'kitchenette'], body: ['headphones on', 'eyes squeezed', 'shoulders raised'], weight: 1 },
  { id: 'overwhelmed-student', label: 'overwhelmed student', family: 'pressure', timeAnchor: null, setting: ['library carrel', 'dorm desk', 'lecture hall back row'], body: ['head on books', 'highlighter dropped', 'eyes red'], weight: 1 },
  { id: 'mentally-overloaded', label: 'mentally overloaded', family: 'overstimulation', timeAnchor: null, setting: ['kitchen island', 'office desk', 'taxi backseat'], body: ['hand on forehead', 'phone face down', 'eyes shut'], weight: 1 },
  { id: 'tired-ambition', label: 'tired ambition', family: 'fatigue', timeAnchor: null, setting: ['gym mirror', 'desk at midnight', 'studio'], body: ['head down', 'fists loose', 'still working'], weight: 1 },
  { id: 'endless-task-feeling', label: 'endless task feeling', family: 'pressure', timeAnchor: null, setting: ['inbox screen', 'notebook open', 'todo app'], body: ['scrolling without reading', 'jaw tight', 'eyes scanning'], weight: 1 },
  { id: 'impossible-focus', label: 'impossible focus', family: 'fragmentation', timeAnchor: null, setting: ['desk', 'cafe', 'library'], body: ['hand on temple', 'eyes drifting to window', 'pen tapping'], weight: 1 },
  { id: 'slow-brain-morning', label: 'slow brain morning', family: 'fatigue', timeAnchor: '06:48', setting: ['kitchen', 'bathroom mirror', 'bedroom edge'], body: ['cup unsteady', 'eyes puffy', 'movements delayed'], weight: 1 },
  { id: 'emotionally-drained', label: 'emotionally drained', family: 'collapse', timeAnchor: null, setting: ['shower floor', 'couch', 'car steering wheel'], body: ['head in hands', 'shoulders down', 'eyes closed'], weight: 1 },
  { id: 'mentally-somewhere-else', label: 'mentally somewhere else', family: 'numbness', timeAnchor: null, setting: ['dinner table', 'meeting', 'shared bed'], body: ['half-listening', 'eyes elsewhere', 'fork still'], weight: 1 },
  { id: 'exhausted-but-wired', label: 'exhausted but wired', family: 'overstimulation', timeAnchor: '01:34', setting: ['bedroom', 'desk', 'kitchen'], body: ['eyes wide open', 'body heavy', 'mind racing'], weight: 1 },
  { id: 'pressure-fatigue', label: 'pressure fatigue', family: 'pressure', timeAnchor: null, setting: ['boardroom', 'home office', 'studio'], body: ['shoulders raised', 'jaw clenched', 'eyes tired'], weight: 1 },
  { id: 'overconnected-exhaustion', label: 'overconnected exhaustion', family: 'overstimulation', timeAnchor: null, setting: ['phone in hand', 'desk', 'subway'], body: ['notifications stacked', 'eyes glazed', 'thumb still'], weight: 1 },
  { id: 'performance-fatigue', label: 'performance fatigue', family: 'fatigue', timeAnchor: null, setting: ['greenroom', 'office bathroom', 'studio'], body: ['holding pose', 'eyes blank in mirror', 'breathing controlled'], weight: 1 },
  { id: 'modern-brain-overload', label: 'modern brain overload', family: 'overstimulation', timeAnchor: null, setting: ['city street', 'office', 'apartment'], body: ['hand on neck', 'eyes squeezing', 'mouth slightly open'], weight: 1 },
];

if (ENERGY_STATES.length !== 59) {
  throw new Error(`ENERGY_STATES expected 59 states, got ${ENERGY_STATES.length}`);
}
