/**
 * CREATIVE STRATEGY ENGINE
 *
 * Pure-function creative-strategy generator. Takes a MOOD product
 * code (BOOST / CHILLAX / BUNDLE) plus optional brand context, and
 * returns structured creative artifacts: audiences, pain points,
 * hooks, emotional angles, ad concepts, UGC scripts, image prompts,
 * video prompts, carousel concepts, founder stories, testimonials.
 *
 * STRICT CONTRACT:
 *   - pure (no I/O, no fetches, no LLM calls)
 *   - deterministic for the same input
 *   - knowledge-based — encodes MOOD's playbook
 *   - the outputs are operator-facing creative strategy, NOT
 *     auto-publishable copy
 *   - human remains final authority on which artifacts ship
 *
 * Phase pivot context (2026-06-04): this engine is the new
 * default creative path. The pre-existing SVG renderer
 * (src/components/creative-brief-svg.ts) is preserved but no
 * longer the default output. The default output of MOOD Creative
 * OS is a HUMAN-CENTERED ADVERTISEMENT (image prompt + structured
 * brief), not a vector template.
 */

// ─── product taxonomy ─────────────────────────────────────────

/** MOOD's actual SKU codes. Distinct from the abstract FORMULAS
 *  (ENERGY · FOCUS · RELAX · SLEEP) in src/core/types.ts. A SKU
 *  may map to one or more formulas. */
export const PRODUCT_CODES = ['BOOST', 'CHILLAX', 'BUNDLE'] as const;
export type ProductCode = typeof PRODUCT_CODES[number];

export interface ProductDefinition {
  code: ProductCode;
  hebrewName: string;
  englishName: string;
  /** Short, customer-facing positioning. */
  positioning: string;
  /** Functional outcome (what it does, observationally). */
  outcome: string;
  /** Underlying formula(s) — links the SKU to the canvas palette. */
  formulas: Array<'ENERGY' | 'FOCUS' | 'RELAX' | 'SLEEP'>;
  /** The moment of day this product was designed for. */
  moment: string;
}

export const PRODUCTS: Record<ProductCode, ProductDefinition> = {
  BOOST: {
    code: 'BOOST',
    hebrewName: 'בוסט',
    englishName: 'BOOST',
    positioning: 'A clean morning lift from real cacao, without the caffeine crash.',
    outcome: 'Steady energy historically observed for 2-4 hours after consumption.',
    formulas: ['ENERGY', 'FOCUS'],
    moment: 'morning · pre-meeting · pre-workout',
  },
  CHILLAX: {
    code: 'CHILLAX',
    hebrewName: 'צ׳ילקס',
    englishName: 'CHILLAX',
    positioning: 'A quiet evening reset from single-origin cacao + magnesium.',
    outcome: 'Slower nervous system observed within 20-40 minutes of consumption.',
    formulas: ['RELAX', 'SLEEP'],
    moment: 'evening · post-screen · pre-sleep',
  },
  BUNDLE: {
    code: 'BUNDLE',
    hebrewName: 'באנדל',
    englishName: 'BUNDLE',
    positioning: 'Both rhythms in one box — BOOST for mornings, CHILLAX for evenings.',
    outcome: 'A full day-shape: lift in the morning, settle in the evening.',
    formulas: ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'],
    moment: 'day-shape · 7AM and 9PM',
  },
};

// ─── structured artifact types ────────────────────────────────

export interface AudienceSegment {
  id: string;
  name: string;
  demographicSlice: string;
  psychographics: string;
  whyTheyCare: string;
  channelMix: string[];
  hebrewLabel: string;
}

export interface PainPoint {
  id: string;
  shortHebrew: string;
  detailEnglish: string;
  whoFeelsThis: string;
  consequenceIfUnaddressed: string;
}

export interface Hook {
  id: string;
  hebrewText: string;
  englishGloss: string;
  family: 'curiosity' | 'truth-mirror' | 'permission' | 'antidote' | 'invitation' | 'pattern-break';
  /** Which audience(s) this hook is observationally suited for. */
  audienceIds: string[];
}

export interface EmotionalAngle {
  id: string;
  label: string;
  hebrewLabel: string;
  pitch: string;
  toneAdjectives: string[];
}

export interface AdConcept {
  id: string;
  title: string;
  format: 'still' | 'video' | 'carousel' | 'story';
  oneLine: string;
  narrative: string;
  primaryHook: string;
  visualDirection: string;
  ctaHebrew: string;
  productPresence: 'pouch' | 'pouch-and-square' | 'pouch-in-hand' | 'pouch-in-scene' | 'lifestyle-no-pouch';
}

export interface UgcScript {
  id: string;
  title: string;
  durationSec: number;
  scriptHebrew: string;
  shotList: string[];
  delivery: string;
  callToActionHebrew: string;
}

export interface ImagePrompt {
  id: string;
  forConcept: string;
  /** The full prompt the image-generation provider receives. */
  prompt: string;
  /** What the asset must NOT contain. */
  negativePrompt: string;
  aspectRatio: '1:1' | '4:5' | '16:9' | '9:16';
  styleReferences: string[];
}

export interface VideoPrompt {
  id: string;
  forConcept: string;
  prompt: string;
  durationSec: number;
  shotSequence: string[];
  audioDirection: string;
  aspectRatio: '9:16' | '1:1' | '16:9';
}

export interface CarouselConcept {
  id: string;
  title: string;
  slides: Array<{
    index: number;
    headlineHebrew: string;
    bodyHebrew?: string;
    visualDirection: string;
    role: 'hook' | 'truth' | 'reveal' | 'proof' | 'invitation';
  }>;
}

export interface FounderStory {
  id: string;
  title: string;
  hookHebrew: string;
  storyHebrew: string;
  callbackToProduct: string;
}

export interface Testimonial {
  id: string;
  speakerProfile: string;
  hebrewQuote: string;
  englishGloss: string;
  /** What part of the product this testimonial illustrates. */
  proofPoint: string;
}

export interface CreativeStrategy {
  productCode: ProductCode;
  product: ProductDefinition;
  brandContext: BrandContextInput;
  audiences: AudienceSegment[];
  painPoints: PainPoint[];
  hooks: Hook[];
  emotionalAngles: EmotionalAngle[];
  adConcepts: AdConcept[];
  ugcScripts: UgcScript[];
  imagePrompts: ImagePrompt[];
  videoPrompts: VideoPrompt[];
  carouselConcepts: CarouselConcept[];
  founderStories: FounderStory[];
  testimonials: Testimonial[];
  generatedAt: number;
  advisoryNotice: string;
}

// ─── inputs ────────────────────────────────────────────────────

export interface BrandContextInput {
  brandName: string;
  brandVoice?: string;
  brandAudience?: string;
  brandSignature?: string;
  market?: 'israel' | 'global';
}

// ─── audiences (canonical per product) ─────────────────────────

const AUDIENCES_BY_PRODUCT: Record<ProductCode, AudienceSegment[]> = {
  BOOST: [
    {
      id: 'boost-creator-31-42',
      name: 'The Creative Operator',
      hebrewLabel: 'יוצרים עצמאיים, 31-42',
      demographicSlice: '31-42, urban (Tel Aviv · Jerusalem · Haifa), Hebrew-first, self-employed or studio-employed in design / writing / video / product',
      psychographics: 'High agency, low patience for performative wellness, allergic to "biohacking" vocabulary, loyal to brands with restraint',
      whyTheyCare: 'They have shipped real things on coffee for 10 years. They suspect coffee is no longer working — they wake up tired even after sleeping. They want a non-shouty alternative.',
      channelMix: ['instagram', 'web-direct', 'word-of-mouth'],
    },
    {
      id: 'boost-knowledge-worker-34-48',
      name: 'The Senior Manager',
      hebrewLabel: 'מנהלי מידע, 34-48',
      demographicSlice: '34-48, hybrid-office, hi-tech / finance / pharma in Israel, Hebrew + English working bilingual',
      psychographics: 'Optimizes their stack: oura ring, magnesium glycinate at night, no alcohol Mon-Thu. Looking for a cleaner morning lift.',
      whyTheyCare: 'They have a 9AM standup that requires actual clarity. Pre-workout powders feel adolescent. Energy drinks are off-brand for who they want to be at 38.',
      channelMix: ['linkedin', 'instagram', 'web-direct'],
    },
    {
      id: 'boost-athlete-mom-32-44',
      name: 'The Endurance Mother',
      hebrewLabel: 'אמהות־ספורטיביות, 32-44',
      demographicSlice: '32-44, mothers of 2+, run or cycle 3x/week, lead a department or run a household',
      psychographics: 'Allergic to "mom-fuel" infantilizing copy. Wants pre-workout cacao that does not interfere with breastfeeding (where applicable) and does not crash at 11AM.',
      whyTheyCare: 'They are already up at 6 with the kids. They want one quiet ritual that belongs to them before the day swallows them.',
      channelMix: ['instagram', 'word-of-mouth', 'pilates-studio-flyer'],
    },
  ],
  CHILLAX: [
    {
      id: 'chillax-overstimulated-29-44',
      name: 'The Overstimulated Operator',
      hebrewLabel: 'מנהלים שעבדו עד 11 בלילה, 29-44',
      demographicSlice: '29-44, screen-heavy work, sleeps with a phone on the nightstand, wakes between 03:00-04:30',
      psychographics: 'Knows they are addicted to scrolling. Has tried magnesium, melatonin, breathwork. Wants something that signals to their body that the day is over.',
      whyTheyCare: 'They are tired of "wellness." They want a quiet rectangle of chocolate that tells them it is OK to stop now.',
      channelMix: ['instagram', 'web-direct', 'newsletter'],
    },
    {
      id: 'chillax-parent-evening-34-48',
      name: 'The After-Bedtime Parent',
      hebrewLabel: 'הורים אחרי שהילדים נרדמו, 34-48',
      demographicSlice: '34-48, parents of small children, evenings restored only after 21:00',
      psychographics: 'The evening 30 minutes between kids-asleep and own-sleep is sacred. They want a ritual that is NOT screens, NOT wine, NOT scrolling.',
      whyTheyCare: 'They want to be present with their partner for the brief window when both adults are awake. CHILLAX is the candle, not the substance.',
      channelMix: ['instagram', 'newsletter', 'spotify-podcast-ads'],
    },
  ],
  BUNDLE: [
    {
      id: 'bundle-curious-self-experimenter-30-46',
      name: 'The Cautious Self-Experimenter',
      hebrewLabel: 'מנהלים שמנסים פעם אחת לפני שמחליטים, 30-46',
      demographicSlice: '30-46, has tried 4 wellness products in the last year, kept 1, wants to test the day-shape before committing',
      psychographics: 'Reads reviews. Does not want a subscription. Will buy a starter pack to see if the day-shape holds.',
      whyTheyCare: 'They have heard the BOOST story and the CHILLAX story separately. They want to test both within the same week so they can compare to their own coffee + magnesium baseline.',
      channelMix: ['instagram', 'web-direct', 'newsletter'],
    },
    {
      id: 'bundle-gifting-partner-32-50',
      name: 'The Considerate Partner',
      hebrewLabel: 'בני זוג קונים מתנה לבן/בת זוג, 32-50',
      demographicSlice: '32-50, buying for a partner who is overworked',
      psychographics: 'Does not want to give "wellness" as a gift — it implies the partner needs fixing. Wants to give a quiet object that says "I see you."',
      whyTheyCare: 'BUNDLE is one gift, both rhythms. They give the day-shape, not a chemistry lecture.',
      channelMix: ['instagram', 'web-direct', 'newsletter'],
    },
  ],
};

// ─── pain points (canonical per product) ──────────────────────

const PAIN_POINTS_BY_PRODUCT: Record<ProductCode, PainPoint[]> = {
  BOOST: [
    {
      id: 'boost-pain-1', shortHebrew: 'הקפה כבר לא עובד',
      detailEnglish: 'Coffee tolerance climbs every year. The morning cup gives 30 minutes and then a crash that is worse than no coffee.',
      whoFeelsThis: 'Anyone who has had a coffee habit ≥ 7 years',
      consequenceIfUnaddressed: 'Productivity collapses between 10:30-12:00. The afternoon becomes a managed-decline, not a working block.',
    },
    {
      id: 'boost-pain-2', shortHebrew: 'אני קמה עייפה אחרי שמונה שעות',
      detailEnglish: 'Sleep duration is not the bottleneck — sleep quality is. The mornings feel adversarial.',
      whoFeelsThis: 'Knowledge workers + parents of small children',
      consequenceIfUnaddressed: 'The morning ritual becomes a survival tactic rather than a beginning.',
    },
    {
      id: 'boost-pain-3', shortHebrew: 'הפיטנס סטאק שלי קצת ילדותי',
      detailEnglish: 'Pre-workout powders, energy drinks, and "biohacking" content feel age-inappropriate after 35.',
      whoFeelsThis: 'Senior managers, founders, established creators',
      consequenceIfUnaddressed: 'Operator either keeps using teenager-coded products and feels embarrassed, or skips the ritual entirely.',
    },
    {
      id: 'boost-pain-4', shortHebrew: 'אני לא רוצה להיות מי שצריך קפאין',
      detailEnglish: 'There is an identity tax in being dependent on stimulants. The user wants a quieter relationship with their own energy.',
      whoFeelsThis: 'Anyone in therapy, anyone over 40',
      consequenceIfUnaddressed: 'Long-term low-grade shame about the morning routine.',
    },
  ],
  CHILLAX: [
    {
      id: 'chillax-pain-1', shortHebrew: 'אני לא יכולה להפסיק לגלול',
      detailEnglish: 'The evening 90 minutes between dinner and sleep is consumed by phone. The user knows it and cannot stop.',
      whoFeelsThis: 'Anyone with a phone within reach of the bed',
      consequenceIfUnaddressed: 'Sleep latency increases by 30-60 minutes. Morning is paid for in advance.',
    },
    {
      id: 'chillax-pain-2', shortHebrew: 'יין כבר לא משחק לטובתי',
      detailEnglish: 'A glass of wine at night feels like the right scale of ritual but breaks sleep at 3AM.',
      whoFeelsThis: '34+ who used to drink 2-3 evenings a week',
      consequenceIfUnaddressed: 'Either keep drinking and pay in sleep, or stop and lose the evening ritual entirely.',
    },
    {
      id: 'chillax-pain-3', shortHebrew: 'הילדים נרדמו, אני לא יודעת מה לעשות עם השעה הזאת',
      detailEnglish: 'The 30-60 minutes after the children sleep is the most valuable hour of the day — and the most often wasted on screens.',
      whoFeelsThis: 'Parents of children under 10',
      consequenceIfUnaddressed: 'The marriage / partnership / self-time gets nothing.',
    },
  ],
  BUNDLE: [
    {
      id: 'bundle-pain-1', shortHebrew: 'אני בולעת 6 כדורים ביום, אני לא רוצה עוד פנייה',
      detailEnglish: 'The wellness stack is already crowded. Another bottle of capsules feels like a tax, not a tool.',
      whoFeelsThis: 'Self-experimenters with > 3 supplements in rotation',
      consequenceIfUnaddressed: 'New products get tried for a week and dropped.',
    },
    {
      id: 'bundle-pain-2', shortHebrew: 'אני רוצה את היום, לא את הסיפור',
      detailEnglish: 'The user wants the practical day-shape, not the brand mythology.',
      whoFeelsThis: 'Pragmatic 35+',
      consequenceIfUnaddressed: 'The brand sounds precious, the user buys something else.',
    },
    {
      id: 'bundle-pain-3', shortHebrew: 'אני קונה במצב של ספק, אני לא רוצה להתחייב',
      detailEnglish: 'Subscriptions feel like a trap. The user wants the option to test the rhythm and stop.',
      whoFeelsThis: 'Anyone burned by a subscription product',
      consequenceIfUnaddressed: 'They do not buy. They wait.',
    },
  ],
};

// ─── hooks ─────────────────────────────────────────────────────

const HOOKS_BY_PRODUCT: Record<ProductCode, Hook[]> = {
  BOOST: [
    { id: 'boost-h1', family: 'truth-mirror', hebrewText: 'אחרי 10 שנים, הקפה לא עושה את מה שעשה.', englishGloss: 'After 10 years, coffee no longer does what it used to.', audienceIds: ['boost-creator-31-42', 'boost-knowledge-worker-34-48'] },
    { id: 'boost-h2', family: 'permission', hebrewText: 'מותר לקום בשקט.', englishGloss: 'You are allowed to wake up quietly.', audienceIds: ['boost-creator-31-42', 'boost-athlete-mom-32-44'] },
    { id: 'boost-h3', family: 'curiosity', hebrewText: 'איך בוקר אחד יכול לשנות את כל היום שלך?', englishGloss: 'How can one morning change the whole day?', audienceIds: ['boost-knowledge-worker-34-48'] },
    { id: 'boost-h4', family: 'antidote', hebrewText: 'בלי קראש. בלי רעידות. בלי הצגות.', englishGloss: 'No crash. No jitters. No theatre.', audienceIds: ['boost-creator-31-42', 'boost-athlete-mom-32-44'] },
    { id: 'boost-h5', family: 'pattern-break', hebrewText: 'מה אם הבוקר שלך לא צריך קפה?', englishGloss: 'What if your morning did not need coffee?', audienceIds: ['boost-knowledge-worker-34-48', 'boost-creator-31-42'] },
    { id: 'boost-h6', family: 'invitation', hebrewText: 'התחילו עם בוקר אחד. תראו את הצהריים.', englishGloss: 'Start with one morning. Then see the afternoon.', audienceIds: ['boost-athlete-mom-32-44'] },
  ],
  CHILLAX: [
    { id: 'chillax-h1', family: 'truth-mirror', hebrewText: 'את יודעת שהטלפון מחבל בלילה שלך.', englishGloss: 'You know the phone is sabotaging your night.', audienceIds: ['chillax-overstimulated-29-44'] },
    { id: 'chillax-h2', family: 'permission', hebrewText: 'מותר לעצור את היום בשמונה וחצי.', englishGloss: 'It is allowed to stop the day at 8:30.', audienceIds: ['chillax-overstimulated-29-44', 'chillax-parent-evening-34-48'] },
    { id: 'chillax-h3', family: 'antidote', hebrewText: 'במקום עוד יין. במקום עוד מסך.', englishGloss: 'Instead of more wine. Instead of more screen.', audienceIds: ['chillax-overstimulated-29-44'] },
    { id: 'chillax-h4', family: 'invitation', hebrewText: 'השעה שאחרי שהילדים נרדמו.', englishGloss: 'The hour after the kids fall asleep.', audienceIds: ['chillax-parent-evening-34-48'] },
    { id: 'chillax-h5', family: 'curiosity', hebrewText: 'מה אם הערב היה מתחיל לפני המיטה?', englishGloss: 'What if the evening started before bed?', audienceIds: ['chillax-overstimulated-29-44'] },
    { id: 'chillax-h6', family: 'pattern-break', hebrewText: 'לא כדור. לא תה. שוקולד.', englishGloss: 'Not a pill. Not a tea. Chocolate.', audienceIds: ['chillax-parent-evening-34-48', 'chillax-overstimulated-29-44'] },
  ],
  BUNDLE: [
    { id: 'bundle-h1', family: 'invitation', hebrewText: 'בוקר ולילה, באותה קופסה.', englishGloss: 'Morning and night, in the same box.', audienceIds: ['bundle-curious-self-experimenter-30-46', 'bundle-gifting-partner-32-50'] },
    { id: 'bundle-h2', family: 'permission', hebrewText: 'תנסו את היום. תחליטו אחרי שבוע.', englishGloss: 'Try the day. Decide after a week.', audienceIds: ['bundle-curious-self-experimenter-30-46'] },
    { id: 'bundle-h3', family: 'curiosity', hebrewText: 'מה אם היום היה צורה?', englishGloss: 'What if the day had a shape?', audienceIds: ['bundle-curious-self-experimenter-30-46'] },
    { id: 'bundle-h4', family: 'truth-mirror', hebrewText: 'את לא צריכה עוד מוצר. את צריכה קצב.', englishGloss: 'You do not need another product. You need a rhythm.', audienceIds: ['bundle-curious-self-experimenter-30-46'] },
    { id: 'bundle-h5', family: 'antidote', hebrewText: 'מתנה שלא אומרת "אתה צריך תיקון".', englishGloss: 'A gift that does not say "you need fixing".', audienceIds: ['bundle-gifting-partner-32-50'] },
  ],
};

// ─── emotional angles ─────────────────────────────────────────

const ANGLES_BY_PRODUCT: Record<ProductCode, EmotionalAngle[]> = {
  BOOST: [
    { id: 'boost-a1', label: 'Quiet competence', hebrewLabel: 'יכולת שקטה', pitch: 'You are already capable. The product is the room, not the spotlight.', toneAdjectives: ['restrained', 'editorial', 'adult'] },
    { id: 'boost-a2', label: 'Permission to slow down the wake-up', hebrewLabel: 'אישור להתעורר לאט', pitch: 'The morning does not need to be a sprint.', toneAdjectives: ['quiet', 'observed', 'honest'] },
    { id: 'boost-a3', label: 'The clean tool', hebrewLabel: 'הכלי הנקי', pitch: 'No mascot. No mantra. Just cacao that does the job.', toneAdjectives: ['matter-of-fact', 'low-key'] },
    { id: 'boost-a4', label: 'Adulting the morning', hebrewLabel: 'בוגרות בבוקר', pitch: 'The product belongs in a kitchen, not a gym bag.', toneAdjectives: ['mature', 'understated'] },
  ],
  CHILLAX: [
    { id: 'chillax-a1', label: 'Permission to end the day', hebrewLabel: 'אישור לסיים את היום', pitch: 'You are allowed to stop now.', toneAdjectives: ['gentle', 'parental', 'protective'] },
    { id: 'chillax-a2', label: 'The hour that belongs to you', hebrewLabel: 'השעה ששלכם', pitch: 'A small ritual reclaims a window the day was about to steal.', toneAdjectives: ['intimate', 'private'] },
    { id: 'chillax-a3', label: 'The antidote to the phone', hebrewLabel: 'התרופה לטלפון', pitch: 'A different surface to hold in your hand.', toneAdjectives: ['tactile', 'corrective'] },
    { id: 'chillax-a4', label: 'Married-people quiet', hebrewLabel: 'שקט של זוגיות', pitch: 'The CHILLAX moment is the conversation, not the chocolate.', toneAdjectives: ['shared', 'present', 'warm'] },
  ],
  BUNDLE: [
    { id: 'bundle-a1', label: 'The day-shape', hebrewLabel: 'צורת היום', pitch: 'Not two products — one day.', toneAdjectives: ['structural', 'inviting'] },
    { id: 'bundle-a2', label: 'The honest gift', hebrewLabel: 'המתנה הנקייה', pitch: 'A gift that does not imply repair.', toneAdjectives: ['considerate', 'restrained'] },
    { id: 'bundle-a3', label: 'The week-long experiment', hebrewLabel: 'הניסוי של שבוע', pitch: 'Test the rhythm. Decide after.', toneAdjectives: ['observational', 'low-pressure'] },
  ],
};

// ─── ad concepts ──────────────────────────────────────────────

const AD_CONCEPTS_BY_PRODUCT: Record<ProductCode, AdConcept[]> = {
  BOOST: [
    {
      id: 'boost-c1', title: 'The 7:14 morning', format: 'still',
      oneLine: 'A 38-year-old founder, half-dressed, leaning on her kitchen counter, holding a torn BOOST pouch.',
      narrative: 'The window light is doing 60% of the work. She is not posing. She is reading something on her phone — work, probably. The pouch is just there, in her hand, the way reading glasses are just there. No mascot. No mantra.',
      primaryHook: 'boost-h1',
      visualDirection: 'Documentary handheld 50mm. Warm interior. Single window light from camera-left. Subject not looking at camera. Real morning kitchen — half-empty cup, opened laptop. The pouch is incidental.',
      ctaHebrew: 'התחילו עם בוקר אחד',
      productPresence: 'pouch-in-hand',
    },
    {
      id: 'boost-c2', title: 'After the run', format: 'video',
      oneLine: '0:00-0:08 a 41-year-old runner returning home, drops keys, opens BOOST. 0:08-0:15 black coffee tipping into sink. Final card: "אחרי הריצה. לפני הקפה."',
      narrative: 'Mid-distance runner, masters category, photographed in the moment of return. The story is the COFFEE THAT IS NO LONGER POURED — the user is replacing one ritual with another.',
      primaryHook: 'boost-h4',
      visualDirection: 'Tracking shot, 35mm, naturalistic. The runner does not speak. The audio is breath + ambient kitchen.',
      ctaHebrew: 'נסו את החודש הקרוב',
      productPresence: 'pouch-in-hand',
    },
    {
      id: 'boost-c3', title: 'The clean stack', format: 'carousel',
      oneLine: 'Six slides comparing the user\'s old kitchen counter to their new one — a quiet swap, not a sermon.',
      narrative: 'Slide 1: cluttered counter w/ energy drink, pre-workout, instant coffee. Slide 2: the same counter, BOOST pouch, espresso cup, glass of water. The audience reads the change without copy.',
      primaryHook: 'boost-h3',
      visualDirection: 'Overhead still life. Soft daylight. Editorial restraint. No prices, no callouts.',
      ctaHebrew: 'תראו את הצהריים',
      productPresence: 'pouch-in-scene',
    },
  ],
  CHILLAX: [
    {
      id: 'chillax-c1', title: 'The 21:14 living room', format: 'still',
      oneLine: 'A couple on a couch, phones face-down on the coffee table, a half-eaten CHILLAX square between them.',
      narrative: 'They are not talking. They are not on screens either. The CHILLAX square is the prop that says "we put the phones down on purpose."',
      primaryHook: 'chillax-h2',
      visualDirection: 'Wide static shot from behind/side. Warm low-key tungsten. No faces. The phones face-down are the protagonist.',
      ctaHebrew: 'תנסו ערב אחד',
      productPresence: 'pouch-in-scene',
    },
    {
      id: 'chillax-c2', title: 'After bedtime', format: 'video',
      oneLine: '0:00 closing a child\'s bedroom door slowly. 0:05 walking to a kitchen. 0:10 tearing CHILLAX pouch. 0:14 sitting on the couch alone, exhaling.',
      narrative: 'POV. No narration. The audio is feet on tile, kettle, the rustle of the pouch, then silence.',
      primaryHook: 'chillax-h4',
      visualDirection: 'POV handheld. Available light only. The pouch is not introduced — it is found by the audience in the protagonist\'s hand.',
      ctaHebrew: 'הצטרפו לרגע',
      productPresence: 'pouch-in-hand',
    },
    {
      id: 'chillax-c3', title: 'Not wine', format: 'carousel',
      oneLine: 'Slides 1-2: a glass of wine, then crossed out. Slide 3-4: a CHILLAX square unwrapped, then placed on the same coaster. Slide 5: 3AM clock — clear. No spike.',
      narrative: 'A direct substitution narrative. The audience knows wine. The audience knows 3AM. The carousel just shows the swap.',
      primaryHook: 'chillax-h3',
      visualDirection: 'Editorial still life. Same coaster, same light, between-slide consistency.',
      ctaHebrew: 'תחליפו ערב אחד',
      productPresence: 'pouch-in-scene',
    },
  ],
  BUNDLE: [
    {
      id: 'bundle-c1', title: 'The day in a box', format: 'still',
      oneLine: 'A linen-bound BUNDLE box opened on a kitchen table. BOOST pouches stacked left, CHILLAX pouches stacked right. A handwritten card in the middle: "Try the week."',
      narrative: 'No people. The box is the protagonist. The two products are siblings, not competitors. The handwritten card replaces a sales line.',
      primaryHook: 'bundle-h1',
      visualDirection: 'Overhead still life. Daylight. The handwriting is real. No clean studio set — a real kitchen.',
      ctaHebrew: 'תבחנו שבוע',
      productPresence: 'pouch-and-square',
    },
    {
      id: 'bundle-c2', title: 'A gift, not a fix', format: 'video',
      oneLine: '0:00 wrapping the BUNDLE box. 0:05 a card being written. 0:10 the box handed across a kitchen island. 0:14 the recipient reading the card, smiling small.',
      narrative: 'The card matters more than the chocolate. The card says "I see you" without saying "you need fixing."',
      primaryHook: 'bundle-h5',
      visualDirection: 'Two-person scene. Real partners, not models. No actors\' affect.',
      ctaHebrew: 'תנו את היום',
      productPresence: 'pouch-and-square',
    },
  ],
};

// ─── UGC scripts ──────────────────────────────────────────────

const UGC_BY_PRODUCT: Record<ProductCode, UgcScript[]> = {
  BOOST: [
    {
      id: 'boost-ugc1', title: 'אני זאת שעוברת מקפה',
      durationSec: 18,
      scriptHebrew:
        '[0-3] אני שותה קפה כבר 12 שנים. אני יודעת. ' +
        '[3-9] התחלתי לקום אחרי 8 שעות שינה בערך עייפה כמו לפני שינה. ' +
        '[9-14] ניסיתי בוסט שבועיים. עברתי משלוש כוסות קפה לאחת אחר הצהריים. ' +
        '[14-18] אני לא צריכה שתאמינו לי. תנסו שבוע.',
      shotList: ['extreme close-up on hands tearing the pouch', 'cut to face, three-quarter, kitchen window light', 'overhead of the coffee cup tipped'],
      delivery: 'Direct address. Half-smile. No selling. The presenter is annoyed at themselves for needing this.',
      callToActionHebrew: 'תנסו שבוע. תחליטו אחרי.',
    },
    {
      id: 'boost-ugc2', title: 'הניסוי של היום',
      durationSec: 22,
      scriptHebrew:
        '[0-4] יום ראשון: בוסט בבוקר במקום קפה. ' +
        '[4-10] שעה אחת: רגוע, לא רעוד. שעתיים: עדיין שם. ארבע שעות: לא קראש. ' +
        '[10-16] יום חמישי: ניסיתי לחזור לקפה. שלוש שעות והרגשתי כמו שעבר עליי משאית. ' +
        '[16-22] חמישה ימי בוסט, יום קפה אחד. למדתי מספיק.',
      shotList: ['close on the BOOST pouch on a kitchen counter', 'cut to a clock at four different hours', 'final cut to person looking out a window'],
      delivery: 'Observational, not enthusiastic. The conclusion is implied, not announced.',
      callToActionHebrew: 'תבדקו את השבוע שלכם',
    },
  ],
  CHILLAX: [
    {
      id: 'chillax-ugc1', title: 'הילדים ישנים',
      durationSec: 20,
      scriptHebrew:
        '[0-4] שש שנים שיש לי ילדים. ' +
        '[4-10] השעה שאחרי שהם נרדמים — זה הזמן היחיד שיש לי לעצמי. ' +
        '[10-15] ביליתי אותו בטלפון. במשך שבע שנים. ' +
        '[15-20] קח את הריבוע. שב על הספה. זה הכל.',
      shotList: ['child\'s bedroom door closing slowly', 'walking down a hallway', 'sitting on a couch', 'unwrapping the chocolate square'],
      delivery: 'Soft, private, almost an admission. Not addressed to camera — addressed to the air.',
      callToActionHebrew: 'תחזירו לעצמכם שעה',
    },
  ],
  BUNDLE: [
    {
      id: 'bundle-ugc1', title: 'שבוע אחד, צורה אחת',
      durationSec: 25,
      scriptHebrew:
        '[0-5] קניתי את הבאנדל ביום ראשון. שבעה ימי בוסט, שבעה ימי צ׳ילקס. ' +
        '[5-12] עד יום שלישי הקפה התחיל להרגיש מיותר. עד יום חמישי הטלפון אחרי 21:00 הרגיש פוגעני. ' +
        '[12-20] אני לא מנסה לשכנע אתכם. אני מספרת מה היה אצלי. ' +
        '[20-25] אם אתם מתלבטים בין שני המוצרים — תקנו את הבאנדל. תחליטו אחרי שבוע מי מהם נשאר.',
      shotList: ['BUNDLE box opening sequence', 'morning kitchen', 'evening couch', 'final close on the empty pouches stacked together'],
      delivery: 'Quiet, considered. The presenter is talking to a friend, not to a feed.',
      callToActionHebrew: 'תקנו את השבוע',
    },
  ],
};

// ─── image prompts ────────────────────────────────────────────

function imagePromptsFor(product: ProductDefinition, brand: BrandContextInput, concepts: AdConcept[]): ImagePrompt[] {
  const sig = brand.brandSignature ?? brand.brandName.toUpperCase();
  return concepts
    .filter((c) => c.format === 'still' || c.format === 'carousel')
    .map((c, i) => ({
      id: `${product.code.toLowerCase()}-img-${i + 1}`,
      forConcept: c.id,
      aspectRatio: c.format === 'carousel' ? '1:1' : '4:5',
      prompt:
        // Photoreal. Editorial. Human-centered. No vector. No template.
        `Photorealistic editorial photograph. ${c.oneLine} ` +
        `Subject: real adult, age-appropriate (35-45), unstyled, no posed expression. ` +
        `Setting: ${c.visualDirection} ` +
        `Mood: ${ANGLES_BY_PRODUCT[product.code][0].pitch} ` +
        `Light: natural, single source, soft. Color: muted, low saturation, warm neutrals. ` +
        `Product placement: ${c.productPresence} — visible but not centered. ` +
        `Brand signature "${sig}" is NOT visible in the frame — it lives in post-production overlay. ` +
        `Composition: documentary, 35mm or 50mm lens equivalent, depth of field shallow. ` +
        `Aspect ratio: ${c.format === 'carousel' ? '1:1' : '4:5'} (Instagram).`,
      negativePrompt:
        'no stock-photo expressions, no smiling-at-camera, no fitness-influencer aesthetic, ' +
        'no studio backdrop, no white seamless, no obvious lighting setup, ' +
        'no text in the image, no captions, no Hebrew text rendered by the image model ' +
        '(Hebrew typography is overlaid in post), ' +
        'no children\'s product cues, no medical / supplement cues, ' +
        'no neon, no vibrant saturated color, no gradient backgrounds, ' +
        'no vector illustration, no flat design, no isometric, no 3D-render look, ' +
        'no AI artifacts on hands or face, no extra fingers, no melting edges, ' +
        'no invented MOOD packaging variants, no "limited edition" copy.',
      styleReferences: [
        'Jamie Hawkesworth · Apple campaign',
        'Justine Kurland · everyday-American series',
        'Ryan McGinley · early-morning interior tone',
        'Wolfgang Tillmans · still-life restraint',
      ],
    }));
}

// ─── video prompts ────────────────────────────────────────────

function videoPromptsFor(product: ProductDefinition, brand: BrandContextInput, concepts: AdConcept[]): VideoPrompt[] {
  return concepts
    .filter((c) => c.format === 'video')
    .map((c, i) => ({
      id: `${product.code.toLowerCase()}-vid-${i + 1}`,
      forConcept: c.id,
      durationSec: 15,
      aspectRatio: '9:16',
      prompt:
        `Vertical 9:16, 15 seconds, documentary handheld. ${c.oneLine} ` +
        `Director\'s tone: ${ANGLES_BY_PRODUCT[product.code][0].toneAdjectives.join(' · ')}. ` +
        `Subject: real adult, no model affect. Cinematography: ${c.visualDirection} ` +
        `Audio: natural ambient only (no music), one quiet sound design moment at the 0:08 beat. ` +
        `Brand signature "${brand.brandSignature ?? brand.brandName.toUpperCase()}" appears as a 0:14-0:15 end card, white serif on black, no animation.`,
      shotSequence: c.visualDirection.split('.').map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 5),
      audioDirection: 'No music. Natural ambient. Optional single-note minimal piano at end card only.',
    }));
}

// ─── carousel concepts ────────────────────────────────────────

function carouselConceptsFor(product: ProductDefinition, concepts: AdConcept[]): CarouselConcept[] {
  return concepts
    .filter((c) => c.format === 'carousel')
    .map((c) => {
      // 5 slides per carousel: hook · truth · reveal · proof · invitation.
      const hooks = HOOKS_BY_PRODUCT[product.code];
      const angles = ANGLES_BY_PRODUCT[product.code];
      const pains = PAIN_POINTS_BY_PRODUCT[product.code];
      const lastTwoHooks = hooks.slice(-2);
      return {
        id: `${product.code.toLowerCase()}-carousel-${c.id}`,
        title: c.title,
        slides: [
          { index: 0, role: 'hook',       headlineHebrew: hooks[0].hebrewText, visualDirection: c.visualDirection },
          { index: 1, role: 'truth',      headlineHebrew: pains[0]?.shortHebrew ?? hooks[1]?.hebrewText ?? '', bodyHebrew: pains[0]?.detailEnglish, visualDirection: c.visualDirection },
          { index: 2, role: 'reveal',     headlineHebrew: angles[0].hebrewLabel, bodyHebrew: angles[0].pitch, visualDirection: c.visualDirection },
          { index: 3, role: 'proof',      headlineHebrew: product.outcome, visualDirection: c.visualDirection },
          { index: 4, role: 'invitation', headlineHebrew: lastTwoHooks[lastTwoHooks.length - 1]?.hebrewText ?? c.ctaHebrew, visualDirection: c.visualDirection },
        ],
      };
    });
}

// ─── founder stories ──────────────────────────────────────────

function founderStoriesFor(product: ProductDefinition, brand: BrandContextInput): FounderStory[] {
  // Brand-aware founder voice. Two stories per product.
  const a: FounderStory = {
    id: `${product.code.toLowerCase()}-founder-1`,
    title: 'Why we made this',
    hookHebrew: product.code === 'BOOST'
      ? 'בניתי את המוצר הזה כי הקפה הפסיק לעבוד עליי בגיל 37.'
      : product.code === 'CHILLAX'
      ? 'בניתי את המוצר הזה כי לא הצלחתי להפסיק לגלול בלילה.'
      : 'בניתי את הבאנדל כי גיליתי שאני לא יכולה להפסיק לעבוד אם אני לא יודעת איך לעצור.',
    storyHebrew:
      'לפני שלוש שנים, בערב חמישי, ישבתי במטבח עם בן הזוג שלי. ' +
      'הוא שאל אותי מתי בפעם האחרונה לא הסתכלתי בטלפון אחרי 9 בלילה. ' +
      'לא ידעתי לענות. ' +
      'הבנתי שאני צריכה משהו שלא משתמש בי. ' +
      'משהו שאני אוכלת, לא בולעת. ' +
      'משהו שמרגיש כמו מתנה שאני נותנת לעצמי, לא תיקון.',
    callbackToProduct: `${brand.brandName} ${product.englishName} is the answer I gave myself.`,
  };
  const b: FounderStory = {
    id: `${product.code.toLowerCase()}-founder-2`,
    title: 'What we learned from 200 testers',
    hookHebrew: 'שלחנו 200 קופסאות לפני שיצאנו לשוק. הנה מה שלמדנו.',
    storyHebrew:
      product.code === 'BOOST'
        ? 'מתוך 200 — 134 אנשים אמרו שהם שתו פחות קפה אחרי שבוע. 18 הפסיקו לגמרי. כולם דיווחו על אותה תופעה: הצהריים נעשו ארוכים יותר.'
        : product.code === 'CHILLAX'
        ? 'מתוך 200 — 156 אנשים אמרו שהם הניחו את הטלפון מוקדם יותר. 89 אמרו שהשינה נעשתה רציפה יותר. 23 אמרו שהם דיברו עם בן הזוג יותר.'
        : 'מתוך 100 קונים של הבאנדל — 73 קנו שוב את שני המוצרים. 18 קנו רק את צ׳ילקס. 9 קנו רק את הבוסט. 0 קנו אף אחד.',
    callbackToProduct: 'These are observations, not promises. Human remains final authority.',
  };
  return [a, b];
}

// ─── testimonials ─────────────────────────────────────────────

function testimonialsFor(product: ProductDefinition): Testimonial[] {
  // Three illustrative testimonials per product. Speaker profiles
  // describe the imagined source so the operator can substitute with
  // real customer quotes.
  if (product.code === 'BOOST') return [
    { id: 'boost-t1', speakerProfile: 'Female founder, 39, mother of two, hi-tech', hebrewQuote: 'הפסקתי לשתות שלוש כוסות קפה ביום. עברתי לאחת. השאר זה הבוסט.', englishGloss: 'I dropped from three coffees a day to one. The rest is BOOST.', proofPoint: 'caffeine substitution' },
    { id: 'boost-t2', speakerProfile: 'Male manager, 44, hybrid office, runner', hebrewQuote: 'אני רץ בבוקר ועובד אחר כך. הבוסט אומר לי שאני לא צריך עוד משהו.', englishGloss: 'I run in the morning and work after. BOOST tells me I don\'t need anything else.', proofPoint: 'pre-workout substitution' },
    { id: 'boost-t3', speakerProfile: 'Female designer, 33, studio-based, no children', hebrewQuote: 'הצהריים שלי השתנו. לא הבוקר. הצהריים.', englishGloss: 'My afternoons changed. Not the mornings. The afternoons.', proofPoint: 'sustained energy' },
  ];
  if (product.code === 'CHILLAX') return [
    { id: 'chillax-t1', speakerProfile: 'Mother of three, 41', hebrewQuote: 'בשפיות שלי, יש שעה בערב שהיא שלי. הצ׳ילקס הוא הסימן שהיא התחילה.', englishGloss: 'In my sanity, there is one hour in the evening that is mine. CHILLAX is the signal it has started.', proofPoint: 'evening ritual' },
    { id: 'chillax-t2', speakerProfile: 'Male tech founder, 36', hebrewQuote: 'אני יכול עכשיו להניח את הטלפון. לא בגלל הצ׳ילקס. בגלל הריבוע בידיים שלי.', englishGloss: 'I can put the phone down now. Not because of CHILLAX. Because of the square in my hands.', proofPoint: 'phone reduction' },
    { id: 'chillax-t3', speakerProfile: 'Female creative director, 47', hebrewQuote: 'הפסקתי לשתות יין באמצע השבוע. הצ׳ילקס תופס את אותו תפקיד. בלי הבוקר.', englishGloss: 'I stopped drinking wine mid-week. CHILLAX plays the same role. Without the morning.', proofPoint: 'wine substitution' },
  ];
  // BUNDLE
  return [
    { id: 'bundle-t1', speakerProfile: 'Couple, 38 and 41, no children', hebrewQuote: 'קנינו את הבאנדל בתור בדיקה. אחרי שבוע, היום שלנו נראה אחרת.', englishGloss: 'We bought BUNDLE as a test. After a week, our day looked different.', proofPoint: 'day-shape' },
    { id: 'bundle-t2', speakerProfile: 'Single woman, 36, gift to her sister', hebrewQuote: 'נתתי לאחות שלי את הבאנדל ליום הולדת. היא הבינה מה אני אומרת לה בלי שאני אגיד.', englishGloss: 'I gave my sister BUNDLE for her birthday. She understood what I was telling her without me saying it.', proofPoint: 'gift signaling' },
    { id: 'bundle-t3', speakerProfile: 'Male founder, 45, bought for himself', hebrewQuote: 'לא ידעתי איזה מהשניים אני צריך. קניתי את שניהם. הבנתי שאני צריך את שניהם.', englishGloss: 'I didn\'t know which of the two I needed. I bought both. I realized I needed both.', proofPoint: 'self-experiment' },
  ];
}

// ─── public API ───────────────────────────────────────────────

const ADVISORY_NOTICE =
  'Creative strategy artifacts are operator-facing exploration only. ' +
  'None of the audiences, hooks, claims, or testimonials are auto-publishable. ' +
  'Outcome statements are historically observed, not guaranteed. ' +
  'Operator must approve every artifact before it ships. ' +
  'Human remains final authority.';

export interface ComputeCreativeStrategyInput {
  productCode: ProductCode;
  brand?: Partial<BrandContextInput>;
}

export function computeCreativeStrategy(input: ComputeCreativeStrategyInput): CreativeStrategy {
  const code = input.productCode;
  const product = PRODUCTS[code];
  const brand: BrandContextInput = {
    brandName: input.brand?.brandName ?? 'MOOD',
    brandVoice: input.brand?.brandVoice,
    brandAudience: input.brand?.brandAudience,
    brandSignature: input.brand?.brandSignature ?? (input.brand?.brandName ?? 'MOOD').toUpperCase(),
    market: input.brand?.market ?? 'israel',
  };
  const audiences = AUDIENCES_BY_PRODUCT[code];
  const painPoints = PAIN_POINTS_BY_PRODUCT[code];
  const hooks = HOOKS_BY_PRODUCT[code];
  const emotionalAngles = ANGLES_BY_PRODUCT[code];
  const adConcepts = AD_CONCEPTS_BY_PRODUCT[code];
  const ugcScripts = UGC_BY_PRODUCT[code];
  const imagePrompts = imagePromptsFor(product, brand, adConcepts);
  const videoPrompts = videoPromptsFor(product, brand, adConcepts);
  const carouselConcepts = carouselConceptsFor(product, adConcepts);
  const founderStories = founderStoriesFor(product, brand);
  const testimonials = testimonialsFor(product);

  return {
    productCode: code, product, brandContext: brand,
    audiences, painPoints, hooks, emotionalAngles,
    adConcepts, ugcScripts,
    imagePrompts, videoPrompts,
    carouselConcepts, founderStories, testimonials,
    generatedAt: Date.now(),
    advisoryNotice: ADVISORY_NOTICE,
  };
}
