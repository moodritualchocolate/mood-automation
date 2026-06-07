/**
 * MVP LLM PROVIDER (boundary · stub fallback)
 *
 * Single abstraction for generating the MVP's creative output from
 * 4 brand inputs. Defaults to a deterministic stub provider if no
 * API key is set. Returns real LLM output if OPENAI_API_KEY or
 * ANTHROPIC_API_KEY is set in the environment.
 *
 * STRICT CONTRACT:
 *   - the route NEVER hard-codes a vendor URL outside this module
 *   - the route NEVER stores API keys; they live in process.env
 *   - failures degrade to stub — never throw to the UI
 *   - the stub provider exists so the platform works without an
 *     API key (testing, screenshots, demos)
 */

import type {
  OneLinerCandidate, HookItem, UgcScriptItem, ImageConceptItem,
} from './mvpGenerationMemory';

export interface MvpGenerateInput {
  artifact: string;
  audience: string;
  emotional: string;
  locale: string;
}

export interface MvpGenerateOutput {
  oneLinerCandidates: OneLinerCandidate[];
  hooks: HookItem[];
  ugcScripts: UgcScriptItem[];
  imageConcepts: ImageConceptItem[];
  providerId: 'stub' | 'openai' | 'anthropic';
}

// ─── provider discovery ────────────────────────────────────────

export function activeProvider(): 'stub' | 'openai' | 'anthropic' {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'stub';
}

// ─── id generators ─────────────────────────────────────────────

let __idSeq = 0;
function newId(prefix: string): string {
  __idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${__idSeq.toString(36)}`;
}

// ─── stub provider ─────────────────────────────────────────────

const HOOK_FAMILIES = [
  'truth-mirror', 'permission', 'curiosity', 'antidote',
  'pattern-break', 'invitation',
] as const;

function stubScore(text: string, audience: string, emotional: string): number {
  // Deterministic 0-100 score · simple heuristic to vary ranking.
  // Combines text length · presence of audience keywords · randomized seed.
  let score = 40;
  if (text.length > 16 && text.length < 60) score += 15;
  if (text.includes('?')) score += 5;
  if (text.includes('.')) score += 5;
  if (audience.split(' ').some((w) => w.length > 3 && text.toLowerCase().includes(w.toLowerCase().slice(0, 4)))) score += 10;
  if (emotional.split(' ').some((w) => w.length > 3 && text.toLowerCase().includes(w.toLowerCase().slice(0, 4)))) score += 10;
  // Stable hash-derived jitter ±10.
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h) + text.charCodeAt(i);
  const jitter = (Math.abs(h) % 21) - 10;
  return Math.max(0, Math.min(100, score + jitter));
}

function stubGenerate(input: MvpGenerateInput): MvpGenerateOutput {
  const { artifact, audience, emotional } = input;
  const article = artifact.trim() || 'this product';
  const aud = audience.trim() || 'a target customer';
  const feel = emotional.trim() || 'a deeper feeling';

  // 2 one-liner candidates — Hebrew flavoured but locale-agnostic.
  const oneLiners: OneLinerCandidate[] = [
    { id: newId('ol'), text: `${article} שמחזיר לך ${feel}.` },
    { id: newId('ol'), text: `${article} · בשביל ${aud}.` },
  ];

  // 10 hooks across hook families.
  const hookSeeds = [
    { family: 'truth-mirror', text: `אתה לא צריך עוד מוצר. אתה צריך ${feel}.` },
    { family: 'permission',   text: `מותר לעצור ולקחת ${feel}.` },
    { family: 'curiosity',    text: `${feel} בלחיצה אחת — שמעתם פעם על ${article}?` },
    { family: 'antidote',     text: `בלי הצגות. בלי הבטחות. רק ${article}.` },
    { family: 'pattern-break', text: `אנחנו כבר לא משתמשים בשם הגנרי. אנחנו משתמשים ב${article}.` },
    { family: 'invitation',   text: `נסה ${article} פעם אחת. תראה את הערב שאחרי.` },
    { family: 'truth-mirror', text: `${aud} כבר לא מאמינים לפרסומות. ${article} לא צריך אחת.` },
    { family: 'permission',   text: `מותר לבחור משהו אחד נקי היום.` },
    { family: 'antidote',     text: `במקום ${aud.includes('פיט') ? 'אבקה' : 'עוד מוצר'} — ${article}.` },
    { family: 'invitation',   text: `${article} · עוד רגע אחד שלך, בכל יום.` },
  ];
  const hooks: HookItem[] = hookSeeds.map((h) => {
    const text = h.text;
    return {
      id: newId('hook'),
      text,
      audience: `${aud} · בני 32-50 · עיר`,
      situation: `במהלך היום שבו ${aud} מחפשים ${feel}`,
      visualDirection: `צילום דוקומנטרי 50מ"מ · אור טבעי · אדם אמיתי לא מדגמן · ${article} בידיים`,
      commercialScore: stubScore(text, aud, feel),
    };
  });

  // 5 UGC scripts.
  const ugcScripts: UgcScriptItem[] = [
    {
      id: newId('ugc'),
      title: `אני זאת ש${feel}`,
      durationSec: 18,
      scriptHebrew:
        `[0-3] אני ${aud} כבר שנים. אני יודעת. ` +
        `[3-9] התחלתי לחפש ${feel} כי הרגשתי שמשהו לא עובד. ` +
        `[9-14] ניסיתי ${article} שבועיים. השתנה לי הרגע אחרי הצהריים. ` +
        `[14-18] אני לא מבקשת שתאמינו לי. תנסו שבוע.`,
      shotList: [
        'extreme close-up: hands holding the product',
        'cut to face, three-quarter, kitchen window light',
        'overhead of an empty cup or wrapper',
      ],
      callToActionHebrew: 'תנסו שבוע. תחליטו אחרי.',
    },
    {
      id: newId('ugc'),
      title: 'הניסוי של היום',
      durationSec: 22,
      scriptHebrew:
        `[0-4] יום ראשון: ${article} בבוקר. ` +
        `[4-10] שעה אחת: רגוע. שעתיים: עדיין שם. ארבע שעות: לא קראש. ` +
        `[10-16] יום חמישי: ניסיתי לחזור לרגיל. שלוש שעות והרגשתי כמו לפני. ` +
        `[16-22] חמישה ימים עם ${article}, יום אחד בלי. למדתי מספיק.`,
      shotList: [
        `close on the ${article}`,
        'cut to a clock at four different hours',
        'final cut to person looking out a window',
      ],
      callToActionHebrew: 'תבדקו את השבוע שלכם',
    },
    {
      id: newId('ugc'),
      title: `הרגע שלי עם ${article}`,
      durationSec: 20,
      scriptHebrew:
        `[0-5] יש לי כל היום עם ${aud}. ` +
        `[5-12] הרגע שלי הוא הרגע שאחרי. ` +
        `[12-20] ${article} הוא הסימן ש${feel} התחיל אצלי.`,
      shotList: [
        'wide shot of a quiet room',
        'hands unwrapping the product',
        'sitting alone on a couch',
      ],
      callToActionHebrew: 'תנסו את הרגע',
    },
    {
      id: newId('ugc'),
      title: 'שאלה אחת לפני שאת מתחילה',
      durationSec: 15,
      scriptHebrew:
        `[0-4] שאלת עצמך אי פעם — מתי הרגשת ${feel} בפעם האחרונה? ` +
        `[4-10] רוב ${aud} לא זוכרים. ` +
        `[10-15] ${article} מחזיר את התשובה.`,
      shotList: [
        'face-to-camera question',
        'pause beat',
        'product placed on a table',
      ],
      callToActionHebrew: 'אם זה דיבר אליך — נסי.',
    },
    {
      id: newId('ugc'),
      title: 'אחרי שבוע',
      durationSec: 25,
      scriptHebrew:
        `[0-5] שבוע אחד עם ${article}. ` +
        `[5-12] התחלתי לשים לב ל${feel} שהיה לי כל הזמן ולא הרגשתי. ` +
        `[12-20] לא משכנעת אתכם. רק מספרת. ` +
        `[20-25] אם אתם דומים לי — נסו את השבוע שלכם.`,
      shotList: [
        `unboxing ${article}`,
        'morning kitchen',
        'evening couch',
        'closing close-up on the empty wrapper',
      ],
      callToActionHebrew: 'תקנו את השבוע',
    },
  ];

  // 10 image concepts.
  const conceptSeeds = [
    { title: 'הבוקר השקט',           desc: `אדם 38 נשען על שיש המטבח · אור חלון משמאל · ${article} ביד · לא מצולם פוזה`, pair: hooks[1]?.text ?? '' },
    { title: 'אחרי הריצה',           desc: `${aud} בכניסה לדירה · נעליים על הרצפה · קפה נשפך לכיור · ${article} בשולחן`, pair: hooks[3]?.text ?? '' },
    { title: '15:30 במשרד',          desc: `שולחן עבודה · שלוש כוסות קפה · יד נשלחת לעבר ${article} במגירה`, pair: hooks[5]?.text ?? '' },
    { title: 'הערב הקטן',            desc: `סלון · אור מנורה אחת · שני אנשים על ספה · ${article} על שולחן הקפה · טלפונים הפוכים`, pair: hooks[2]?.text ?? '' },
    { title: 'הרגע אחרי הילדים',     desc: `מסדרון · דלת חדר ילדים סגורה · ${article} בכף יד · אדם הולך לכיוון הספה`, pair: hooks[4]?.text ?? '' },
    { title: 'הבליל של חברים',       desc: `סלון · ארבעה מבוגרים יושבים · ${article} עובר מיד ליד · יין בבקבוק לא נפתח`, pair: hooks[6]?.text ?? '' },
    { title: 'מרפסת קיץ בעיר',        desc: `מרפסת בקומה שנייה · 22:00 · ${aud} נשען על מעקה · ${article} בכף יד אחת · עיר ברקע`, pair: hooks[7]?.text ?? '' },
    { title: 'הים בשקיעה',           desc: `חוף · שמש נמוכה · אדם יושב על מגבת מול הים · ${article} ליד התרמוס`, pair: hooks[8]?.text ?? '' },
    { title: 'אחרי האימון',          desc: `סלון · שיער רטוב · מגבת על הכתפיים · ${article} בקצה הספה · עייפות טובה`, pair: hooks[9]?.text ?? '' },
    { title: 'יום שישי בצהריים',     desc: `מטבח · 13:00 · שולחן מתפנה · אדם יושב לבד עם ${article} ועוד שתייה קרה`, pair: hooks[0]?.text ?? '' },
  ];
  const imageConcepts: ImageConceptItem[] = conceptSeeds.map((c) => ({
    id: newId('img'),
    title: c.title,
    visualDescription: c.desc,
    forUseWith: c.pair,
    renderingNote:
      'Photorealistic editorial photograph · documentary handheld 50mm · ' +
      'real adult age-appropriate · unstyled · single natural light source · ' +
      'no studio backdrop · no stock-photo expressions · no Hebrew text in the image.',
  }));

  return {
    oneLinerCandidates: oneLiners,
    hooks,
    ugcScripts,
    imageConcepts,
    providerId: 'stub',
  };
}

// ─── public entrypoint ─────────────────────────────────────────

export async function mvpGenerate(input: MvpGenerateInput): Promise<MvpGenerateOutput> {
  // V1 ships with stub provider regardless of env — OpenAI/Anthropic
  // adapters are deferred to a follow-up. The provider boundary is
  // here so the swap is one-file when ready.
  return stubGenerate(input);
}
