/**
 * COPY PATTERNS (Strategy-Conditioned Copywriter — Phase Next)
 *
 * Deterministic Hebrew-first phrase tables and tone templates. The
 * copywriter never writes from a blank slate — it composes from
 * these tables, conditioned on the strategy assessment.
 *
 * Premium Israeli restraint: short, observational, modern, never
 * translated-marketing-English. No miracle claims, no hustle tone,
 * no fake urgency.
 */

import type { AudienceArchetype, CampaignRole, PersuasionMode } from './adStrategyMemory';

// ─── eleven persuasion tones ──────────────────────────────────

export type CopyTone =
  | 'empathic'
  | 'restrained'
  | 'cinematic'
  | 'documentary'
  | 'observational'
  | 'confrontational-soft'
  | 'ritualistic'
  | 'intimate'
  | 'anti-hype'
  | 'emotionally-exhausted'
  | 'hopeful-quiet';

// ─── wound → Hebrew anchor phrase ─────────────────────────────

export const WOUND_PHRASES_HE: Record<string, string> = {
  'interrupted-sleep':       'לישון חצי שינה',
  'identity-erasure':        'להיעלם בשקט',
  'guilt-when-resting':      'אסור לעצור',
  'never-finished':          'תמיד נשארת רשימה',
  'focus-collapse':          'המחשבה נחתכת באמצע',
  'meeting-fatigue':         'פגישה אחרי פגישה',
  'screen-burn':             'מסכים מסכים מסכים',
  'invisible-output':        'אף אחד לא רואה את זה',
  'decision-fatigue':        'להחליט עד שכואב',
  'isolation':               'לבד עם זה',
  'identity-fused-with-work': 'אני בעצם זה',
  'recursive-doubt':         'שוב ושוב אותה שאלה',
  'attention-fragmentation': 'עשרים טאבים פתוחים בראש',
  'exam-pressure':           'ספירה לאחור שלא נגמרת',
  'sleep-debt':              'להתעורר עייף',
  'comparison-anxiety':      'כולם נראים שהם כבר שם',
  'weekend-collapse':        'ביום ראשון פשוט קופאת',
  'evening-zombie':          'בשמונה בערב כבר אין כלום',
  'hidden-fatigue':          'מחייכת ושוקעת',
  'professional-mask-cost':  'הקלטה תמיד דלוקה',
  'burned-by-prior-claims':  'שמעתי את ההבטחה הזאת כבר',
  'allergic-to-marketing-language': 'מבחין בפילטר השיווקי מקילומטר',
  'tired-of-being-targeted': 'נמאס לי שמדברים אליי דרך אלגוריתם',
  '3am-spiral':              'שלוש לפנות בוקר',
  'racing-thoughts':         'המחשבות לא נעצרות',
  'sleep-anxiety':           'מפחד מהשעה הזאת',
  'lonely-rumination':       'לבד בראש שלי',
  'plateau':                 'נדבק בנקודה',
  'recovery-mismatch':       'נח אבל לא מתאושש',
  'invisible-attrition':     'משהו נשחק שאי אפשר לראות',
  'edge-erosion':            'היתרון נסחף',
  'compassion-fatigue':      'אין יותר מקום לדאוג',
  'numbness':                'כבר לא ממש מרגיש את זה',
  'invisible-grief':         'אבל שאף אחד לא יודע עליו',
  'social-exhaustion':       'להיות נוכח כשאני לא',
};

// ─── desire → Hebrew aspiration phrase ────────────────────────

export const DESIRE_PHRASES_HE: Record<string, string> = {
  'real-rest':                  'מנוחה אמיתית',
  'recognition':                'שמישהו פשוט יראה',
  'permission-to-pause':        'רשות לעצור',
  'reclaimed-quiet':            'שקט שחזר אליי',
  'clean-focus':                'פוקוס בלי רעש',
  'energy-without-jitter':      'אנרגיה בלי קצוות חדים',
  'protected-deep-work':        'שעה אחת שלא נשברת',
  'protected-thinking':         'מחשבה שלא קוטעים',
  'edge-without-burnout':       'יתרון בלי לשלם בכל פעם',
  'real-rest-rare':             'מנוחה אמיתית — נדירה',
  'locked-in-focus':            'נעול בפנים',
  'memory-retention':           'דברים שנשארים',
  'calm-under-deadline':        'שקט מתחת ללחץ',
  'sustainable-output':         'תפוקה שלא מתפרקת',
  'private-restoration':        'התאוששות שקטה',
  'dignified-energy':           'אנרגיה ששומרת על דמות',
  'honest-product':             'מוצר ישר',
  'ingredient-transparency':    'מה בפנים, בלי עיגולים',
  'no-mysticism':               'בלי מיסטיקה',
  'mental-quiet':               'שקט בראש',
  'sleep-without-fear':         'לישון בלי לפחד',
  'compounding-edge':           'יתרון שמצטבר',
  'recovery-as-discipline':     'התאוששות כתחום',
  'measurable-gain':            'הבדל שאפשר למדוד',
  'being-met-without-fixing':   'שמישהו פשוט יהיה שם',
  'quiet-restoration':          'התאוששות שקטה',
  'permission-to-feel-less':    'רשות להרגיש פחות',
};

// ─── audience-specific opening cadences ──────────────────────

/** A short Hebrew opener used as the second sentence after the wound
 *  anchor — adapts the tone to the archetype's register. */
export const AUDIENCE_OPENERS_HE: Record<AudienceArchetype, string[]> = {
  tired_parent:              ['את לא לבד בזה.', 'זה לא עצלות.', 'זה גם לא דרמה.'],
  office_worker:             ['וזה לא חוסר משמעת.', 'גם הקפה כבר לא עוזר.', 'משהו פשוט לא בריא בקצב.'],
  founder_creator:           ['אתה לא חייב להחזיק את כולם לבד.', 'יש מחיר שאף אחד לא רואה.', 'אף אחד לא מדבר על זה.'],
  student_focus:             ['וזה גם לא בלגן בראש שלך.', 'זאת לא הבעיה שלך.', 'אבל המוח שלך מסוגל לעוד.'],
  overworked_professional:   ['ואת ממשיכה כי אין ברירה.', 'בלי שאחד מסביב באמת רואה.', 'התפקיד עוטף את הכל.'],
  wellness_skeptic:          ['בלי שיווק. רק נתונים.', 'גם אנחנו לא אוהבים את הז\'אנר הזה.', 'נשמע יותר מדי טוב — בכוונה לא.'],
  night_overthinker:         ['ההגעה לפה מוכרת.', 'זאת לא חכמה. זאת מלכודת.', 'הראש לא נח כי הוא מוגן.'],
  high_performer:            ['ההגעה לפלאטו לא מקרית.', 'התאוששות היא תחום, לא תוצר לוואי.', 'הגוף סופר. גם כשאת לא.'],
  emotionally_drained_adult: ['ולא צריך לתקן את זה.', 'את כבר נושאת מספיק.', 'מותר רגע בלי לפרק את זה.'],
};

// ─── tone wrappers — Hebrew templates ─────────────────────────
//
// Each template uses these slots:
//   {wound}     — Hebrew wound phrase
//   {desire}    — Hebrew desire phrase
//   {opener}    — audience opener line
//
// Templates are chosen deterministically by a hash of the strategy.

export interface ToneTemplate {
  hook: string;
  body: string;
}

export const TONE_TEMPLATES: Record<CopyTone, ToneTemplate[]> = {
  empathic: [
    { hook: '{wound}.',
      body: '{opener} מה שמרגיש כמו כישלון אישי הוא לפעמים פשוט שאי אפשר לעמוד בקצב. {desire} זה לא בקשה מוגזמת.' },
    { hook: '{wound}, ועדיין מחזיק את הכל.',
      body: '{opener} אולי הגיע הזמן להפסיק להאשים את עצמך. {desire} זאת אפשרות, לא הבטחה.' },
  ],
  restrained: [
    { hook: '{wound}.',
      body: '{opener}\n{desire}.' },
    { hook: '{wound}. שום מהפך.',
      body: '{opener} רק {desire}.' },
  ],
  cinematic: [
    { hook: 'בין הפגישה לפגישה — {wound}.',
      body: '{opener} שלוש דקות שבהן הקצב נשבר. {desire}. שום דבר אחר.' },
    { hook: '{wound}. אור צהוב על קיר לבן.',
      body: '{opener} זה הקטע שאף אחד לא מצלם. {desire}. בלי טקס.' },
  ],
  documentary: [
    { hook: '{wound}.',
      body: '{opener} זאת לא תיאוריה. זה מה שעולה במחקרים על אנשים שעובדים יותר מ-9 שעות מול מסך. {desire} — בעדויות.' },
    { hook: 'מה שראינו שוב ושוב: {wound}.',
      body: '{opener} זאת לא הבטחה — זה דפוס. {desire} כשיש למה שיתפוס.' },
  ],
  observational: [
    { hook: '{wound}.',
      body: '{opener} תסתכל סביב — חצי מהאנשים שאת רואה עכשיו מרגישים את זה. {desire}. בלי הכרזה.' },
    { hook: 'אתה לא היחיד ש{wound}.',
      body: '{opener} זה רק לא דבר שמדברים עליו בקול. {desire}.' },
  ],
  'confrontational-soft': [
    { hook: '{wound}. כמה זמן עוד תגיד שזה בסדר?',
      body: '{opener} זה לא מה שאתה. זה מה שקורה לאדם שמושך יותר מדי קווים. {desire}.' },
    { hook: 'תפסיק להאשים את עצמך ש{wound}.',
      body: '{opener} השאלה האמיתית היא איך עוד שבועיים יחזרו לעבור ככה. {desire} זה לא דרישה, זה תיקון.' },
  ],
  ritualistic: [
    { hook: 'בשמונה בבוקר. שום דבר אחר לא משתנה.',
      body: '{opener} {wound} — לא נעלם, רק נכנס למסגרת. דקה אחת ביום. {desire}.' },
    { hook: 'אותו ספל. אותה שעה. {desire}.',
      body: '{opener} זה לא מהפך. זה רק שהדבר הזה תופס מקום קבוע. {wound} מקבל מקום נפרד.' },
  ],
  intimate: [
    { hook: '{wound}.',
      body: '{opener} אתה לא חייב לספר לאף אחד שזה ככה. {desire} — בשקט. רק עם עצמך.' },
    { hook: 'בינך לבין עצמך: {wound}.',
      body: '{opener} זה הזמן שלך, ולא הזמן של מישהו אחר. {desire}.' },
  ],
  'anti-hype': [
    { hook: '{wound}. בלי הבטחות.',
      body: '{opener} אנחנו לא מבטיחים מהפך. {desire} — וגם זה לא תמיד. רוב הימים? יום רגיל קצת יותר נושם.' },
    { hook: 'לא מהפך. {wound}, פחות.',
      body: '{opener} לא ביוהאק. לא סוד. רק {desire}, בערך.' },
  ],
  'emotionally-exhausted': [
    { hook: '{wound}.',
      body: '{opener} אנחנו יודעים שכבר אין כוח לעוד דבר חדש. אז זה לא דורש כוח. רק רגע. {desire}.' },
    { hook: 'אם אין כוח לקרוא את כל זה — {desire}.',
      body: '{opener} {wound}. גם הלשון כבדה. גם זה בסדר.' },
  ],
  'hopeful-quiet': [
    { hook: '{wound}. עדיין יש משהו.',
      body: '{opener} לא נס, לא פתרון. רק {desire} — שעובד ככה, לאט.' },
    { hook: 'יש דרך אחרת. בלי הבטחות.',
      body: '{opener} {wound} — לאט נסוג. {desire} מתפנה.' },
  ],
};

// ─── CTA pools — keyed by restraint band + role ──────────────

export type RestraintBand = 'high' | 'medium' | 'low';

export const CTA_POOLS_HE: Record<RestraintBand, Record<CampaignRole, string[]>> = {
  high: {
    awareness:            ['מודרים מעניין? נראה לך.', 'לדעת זה כבר משהו.'],
    curiosity:            ['אם זה מעניין — תקרא הלאה.', 'יש עוד.'],
    objection_breaker:    ['אם זה לא משכנע — אל תקנה.', 'תפוס רק אם מתאים לך.'],
    trust_builder:        ['בקצב שלך.', 'תכיר. בלי לחץ.'],
    conversion_push:      ['כשתרצה — אנחנו פה.', 'אפשר להתחיל קטן.'],
    retargeting_memory:   ['חזרת. גם אנחנו זוכרים.', 'מוכן? כשתחליט.'],
    ritual_education:     ['חמש דקות ביום. שבעה ימים.', 'תנסה שבוע. בלי התחייבות.'],
    product_proof:        ['תראה את זה בעצמך.', 'הוכחה לא נמכרת — נראית.'],
    emotional_mirror:     ['אם זה מדויק — את יודעת.', 'אם זה לא — תעבור הלאה.'],
    social_share_trigger: ['אם זה דיבר אליך — תעביר.', 'מישהי שאת מכירה תרצה לראות.'],
  },
  medium: {
    awareness:            ['ללמוד עוד.', 'לקרוא עוד דקה.'],
    curiosity:            ['גלה למה זה עובד אחרת.', 'תראה איך זה בנוי.'],
    objection_breaker:    ['השווה. אנחנו לא מפחדים.', 'תקרא את החששות. ענינו עליהם.'],
    trust_builder:        ['תכיר את האנשים מאחורי המוצר.', 'אנחנו מסבירים. בלי לקצר.'],
    conversion_push:      ['התחל בערכה הקטנה.', 'נסה שבועיים.'],
    retargeting_memory:   ['חזרת בזמן הנכון. בוא נתחיל.', 'הגיע הרגע.'],
    ritual_education:     ['תכיר את הטקס. שבעה ימים, חמש דקות.', 'תבנה לעצמך את הקצב.'],
    product_proof:        ['ראה את ההבדל אצלך, לא אצלנו.', 'נסה שבועיים. אנחנו מחזירים.'],
    emotional_mirror:     ['אם זה היה את — תפנה זמן.', 'אם זה מדבר אליך — תגיב.'],
    social_share_trigger: ['העבר למי שצריך לראות.', 'תייג מישהי.'],
  },
  low: {
    awareness:            ['גלה איך זה עובד.', 'תתחיל פה.'],
    curiosity:            ['תכיר. עכשיו.', 'תיכנס לראות.'],
    objection_breaker:    ['קנה. נחזיר אם לא עבד.', 'נסה. אין סיכון.'],
    trust_builder:        ['התחל היום. בלי התחייבות.', 'הצטרף לאלפים שכבר ניסו.'],
    conversion_push:      ['קנה עכשיו.', 'התחל היום.'],
    retargeting_memory:   ['השלם את ההזמנה.', 'קצת שכחת? אנחנו פה.'],
    ritual_education:     ['בנה את הטקס. עכשיו.', 'תתחיל את השבוע הראשון.'],
    product_proof:        ['קנה ובדק בעצמך.', 'נסה. אין מה להפסיד.'],
    emotional_mirror:     ['תגיב לעצמך — לא לנו.', 'תקח רגע.'],
    social_share_trigger: ['שתף.', 'תעביר הלאה.'],
  },
};

// ─── proof line templates ────────────────────────────────────

export const PROOF_LINES_HE: Record<'low' | 'medium' | 'high', string[]> = {
  low:    [''],
  medium: [
    'מבוסס על מולקולה מוכרת, לא על הבטחה.',
    'נבנה עם רופאים, לא עם משפיענים.',
  ],
  high: [
    'מולקולה אחת מובילה, מתועדת ב-12 מחקרים. בלי קומבינות.',
    'הרכב פתוח. כמויות בתווית. רוצים לראות מקור? שלחו לך.',
    'נבדק במעבדה חיצונית. דוח זמין למי שמבקש.',
  ],
};

// ─── forbidden phrases ───────────────────────────────────────
//
// Cheap dopamine hooks, miracle claims, hustle clichés, fake urgency,
// pseudo-medical certainty, clickbait. Detection is substring (case-
// insensitive). Both Hebrew and English so even hybrid copy gets flagged.

export const FORBIDDEN_PHRASES: string[] = [
  // Hebrew clichés
  'תעשה מהפך', 'מהפך לחייך', 'החיים שלך ישתנו', 'הסוד ל',
  'פריצת דרך', 'מומחים מסכימים', 'הזמן רץ', 'אל תפספס',
  'מבצע אחרון', 'מהרו ל', 'מוגבל ב', 'רק היום', 'הרגע האחרון',
  'מהפכה', 'גלה את הסוד', 'המוצר שכולם מדברים עליו',
  'המוצר שייקח אותך', 'הצטרף אלינו',
  // English-marketing intrusions (premium-Hebrew should resist)
  'transform your life', 'change your life', 'level up',
  'biohack', '10x', 'game changer', 'game-changer', 'viral',
  'limited time', 'act now', 'shocking', 'you won\'t believe',
  'this one trick', 'doctors hate', 'one weird',
  // Pseudo-medical certainty
  'מרפא', 'מבטיח להבריא', 'תרופה ל',
  'cure', 'guaranteed cure', 'medical breakthrough',
  // Hustle / cringe / wellness pseudo-spirituality
  'הכניס לעצמך הילוך', 'תיהיה גרסה טובה יותר',
  'unlock your potential', 'be your best self',
  'morning routine of millionaires',
];

// ─── persuasion mode → tone selection ────────────────────────

/** Deterministic tone selection from strategy. */
export function toneForStrategy(
  persuasionMode: PersuasionMode,
  trustDebt: number,
  brandDignity: number,
  brutality: number,
): CopyTone {
  // High brutality + high trust debt → softer / restrained tones.
  if (trustDebt >= 6) {
    return brutality >= 0.7 ? 'restrained' : 'anti-hype';
  }
  if (brandDignity <= 5) {
    return brutality >= 0.7 ? 'restrained' : 'hopeful-quiet';
  }
  switch (persuasionMode) {
    case 'empathic':         return brutality >= 0.7 ? 'emotionally-exhausted' : 'empathic';
    case 'narrative':        return 'cinematic';
    case 'observational':    return 'documentary';
    case 'demonstrative':    return 'documentary';
    case 'minimal':          return 'restrained';
    case 'aspirational':     return 'hopeful-quiet';
    case 'specification':    return 'documentary';
    case 'confrontational':  return brutality >= 0.7 ? 'confrontational-soft' : 'anti-hype';
    default:                 return 'observational';
  }
}

// ─── deterministic hash ──────────────────────────────────────

/** Small deterministic 32-bit FNV-1a — used to pick template index
 *  from a strategy fingerprint. No RNG. */
export function fingerprintHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
