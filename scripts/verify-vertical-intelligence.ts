/**
 * VERIFY — Vertical Intelligence V1
 *
 * Exercises the vertical-intelligence layer end-to-end against 10
 * brand fixtures (one per supported V1 vertical) and asserts the 12
 * behavioural requirements from the directive:
 *
 *   1. Hebrew real-estate output contains real-estate vocabulary,
 *      no MOOD language.
 *   2. Hebrew accountant output contains tax / bookkeeping vocab.
 *   3. Hebrew lawyer output contains legal vocab · no medical/wellness.
 *   4. Hebrew HVAC output contains AC / repair vocab.
 *   5. Hebrew restaurant output contains food / table / reservation vocab.
 *   6. English SaaS output remains English-only.
 *   7. English fitness output remains English-only.
 *   8. Chocolate output may use MOOD/presence language · only there.
 *   9. No code-switch incidents across all 10 verticals.
 *  10. Generic chocolate-template phrases are rejected · cross-vertical.
 *  11. Locale rules are enforced.
 *  12. Vertical-keyword density ≥ 60% across generated hooks for
 *      each vertical.
 *
 * Exit code: 0 on success, 1 on any FAIL (this IS a gate, unlike
 * verify-output-quality which is informational).
 */

import { mvpGenerate, type MvpGenerateInput } from '../lib/mvpLlmProvider';
import {
  validateLocalePurity,
  verticalKeywordDensity,
  hasCrossVerticalLeak,
  type VerticalId,
} from '../lib/verticalIntelligence';
import { VERTICAL_KNOWLEDGE_BASE } from '../lib/verticalIntelligence/verticalKnowledgeBase';

interface Fixture {
  verticalId: VerticalId;
  brandName: string;
  input: MvpGenerateInput;
  locale: 'he' | 'en';
  /** Vocabulary that MUST appear in at least one hook for this fixture
   * to pass the vertical-relevance check. */
  expectedKeywords: string[];
  /** Forbidden cross-vertical terms · MUST NOT appear (e.g., MOOD
   * language in HVAC, medical/wellness language in lawyer). */
  forbiddenCrossVertical: string[];
}

const FIXTURES: Fixture[] = [
  {
    verticalId: 'real-estate',
    brandName: 'Anchor Properties',
    locale: 'he',
    input: {
      artifact: 'תיקי נדל"ן למשפחות שמחפשות יציבות לטווח ארוך',
      audience: 'משקיעים ישראלים בני 40-60 דור ראשון של עושר',
      emotional: 'להשאיר משהו יציב לדור הבא',
      locale: 'Israel · Hebrew',
    },
    expectedKeywords: ['נכס', 'דירה', 'בניין', 'נדל"ן', 'שכירות', 'דורות', 'ירושה', 'תיק נכסים', 'יציבות'],
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
  },
  {
    verticalId: 'accountant',
    brandName: 'Tax Studio',
    locale: 'he',
    input: {
      artifact: 'שירות הנהלת חשבונות ומס לעוסקים מורשים וחברות קטנות',
      audience: 'בעלי עסקים קטנים בני 30-55 עם מחזור שנתי 500 אלף עד 5 מיליון שח',
      emotional: 'בלי פחד ממס הכנסה במרץ',
      locale: 'Israel · Hebrew',
    },
    expectedKeywords: ['מס', 'חשבונאות', 'חשבונית', 'דיווח', 'מאזן', 'מס הכנסה', 'מע"מ', 'רואה חשבון'],
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
  },
  {
    verticalId: 'lawyer',
    brandName: 'Beit Mishpat',
    locale: 'he',
    input: {
      artifact: 'משרד עורכי דין המתמחה בגירושין בגישור',
      audience: 'הורים בגירושין בני 35-55 שרוצים למזער נזק לילדים',
      emotional: 'להגן על מה שעדיין חשוב · לשמור על הילדים שלמים',
      locale: 'Israel · Hebrew',
    },
    expectedKeywords: ['גירושין', 'גישור', 'ילדים', 'משמורת', 'הסכם', 'בית דין', 'משפחה', 'עורך דין'],
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור', 'wellness', 'healing', 'detox', 'mindfulness'],
  },
  {
    verticalId: 'hvac',
    brandName: 'Krir',
    locale: 'he',
    input: {
      artifact: 'שירות תיקון מזגנים זמין באזור המרכז',
      audience: 'בעלי דירות ושוכרים בני 35-65 בדירות עם מזגן שלא עובד',
      emotional: 'מזגן עובד באוגוסט · היום',
      locale: 'Israel · Hebrew',
    },
    expectedKeywords: ['מזגן', 'תיקון', 'קיץ', 'חום', 'דירה', 'טכנאי', 'שירות'],
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
  },
  {
    verticalId: 'restaurant',
    brandName: 'Tov Hayom',
    locale: 'he',
    input: {
      artifact: 'מסעדה שכונתית שמגישה ארוחת ערב אמיתית אחרי העבודה',
      audience: 'ישראלים עירוניים בני 28-45 · גומרים את היום עייפים · רוצים ארוחה אחת טובה',
      emotional: 'ארוחה אמיתית · לא עוד איסוף מהיר',
      locale: 'Israel · Hebrew',
    },
    expectedKeywords: ['שולחן', 'מסעדה', 'שף', 'ארוחה', 'לחם', 'מנה', 'ערב', 'הזמנה'],
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
  },
  {
    verticalId: 'saas',
    brandName: 'Quiet',
    locale: 'en',
    input: {
      artifact: 'Productivity software that protects focus from notifications',
      audience: 'Knowledge workers 28-45 fighting daily distraction',
      emotional: 'Be deep in work instead of surfing notifications',
      locale: 'Global · English',
    },
    expectedKeywords: ['focus', 'deep work', 'notifications', 'slack', 'shipping', 'block', 'flow', 'software', 'interrupts'],
    forbiddenCrossVertical: ['chocolate', 'cacao', 'presence', 'mood', 'square', 'מותר לעצור'],
  },
  {
    verticalId: 'fitness',
    brandName: 'Mile',
    locale: 'en',
    input: {
      artifact: 'Running shoes designed for the comeback runner',
      audience: '30-50 year olds who used to run but stopped during career or family',
      emotional: 'Become a runner again, not someone who used to run',
      locale: 'Global · English',
    },
    expectedKeywords: ['run', 'runner', 'pace', 'comeback', 'lace up', '5K', 'marathon', 'long run', 'mile', 'kilometer'],
    forbiddenCrossVertical: ['chocolate', 'cacao', 'presence', 'mood', 'square'],
  },
  {
    verticalId: 'jewelry',
    brandName: 'Avir',
    locale: 'he',
    input: {
      artifact: 'תכשיטים יוקרתיים בעבודת יד לנשים שרוכשות לעצמן',
      audience: 'נשים בנות 30-55 שמסמנות אבני דרך אישיות',
      emotional: 'לסמן רגע שאף אחד אחר לא מסמן בשבילך',
      locale: 'Israel · Hebrew',
    },
    expectedKeywords: ['תכשיט', 'טבעת', 'שרשרת', 'זהב', 'יהלום', 'מתנה', 'דור', 'עיצוב', 'יחיד במינה', 'עבודת יד'],
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
  },
  {
    verticalId: 'cosmetics',
    brandName: 'Real Skin',
    locale: 'he',
    input: {
      artifact: 'מותג טיפוח עור לנשים שמיצו את תעשיית היופי הסטנדרטית',
      audience: 'נשים בנות 35-55 עם עור שלא צריך להחביא יותר',
      emotional: 'להרגיש כמו עצמי · לא כמו פילטר של עצמי',
      locale: 'Israel · Hebrew',
    },
    expectedKeywords: ['עור', 'פנים', 'קרם', 'שמן', 'לחות', 'רכיב', 'שגרה', 'חומרים פעילים', 'קוסמטיקה', 'סרום'],
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
  },
  {
    verticalId: 'chocolate',
    brandName: 'MOOD',
    locale: 'he',
    input: {
      artifact: 'שוקולד מריר פרימיום של מותג ישראלי',
      audience: 'בוגרים ישראלים בני 32-50 · עירוניים · עם תקציב להוצאה איכותית',
      emotional: 'להיות נוכחים ברגעים שאחרת היו אובדים',
      locale: 'Israel · Hebrew',
    },
    expectedKeywords: ['שוקולד', 'קקאו', 'ריבוע', 'רגע', 'נוכחות', 'בית', 'יום', 'מותר'],
    // Chocolate is the only vertical permitted to use its canonical
    // language · so the cross-vertical guard is empty here.
    forbiddenCrossVertical: [],
  },
];

// ─── shared cross-vertical leakage list (the "MOOD language") ──
// any non-chocolate output containing any of these is a leak.
const MOOD_LANGUAGE_HE = ['ריבוע שוקולד', 'מותר לעצור', 'הריבוע נמס', 'נסטרופיק', 'קקאו 70%'];
const MOOD_LANGUAGE_EN = ['chocolate square', 'cacao square', 'one square moment', 'nootropic', 'biohacking'];

// ─── helpers ───────────────────────────────────────────────────

let passed = 0, failed = 0;
function pass(label: string, detail = '') {
  passed += 1;
  console.log(`  PASS  ${label}${detail ? '\n        ' + detail : ''}`);
}
function fail(label: string, detail = '') {
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? '\n        ' + detail : ''}`);
}

interface GenerationBundle {
  fixture: Fixture;
  output: Awaited<ReturnType<typeof mvpGenerate>>;
  allTexts: string[];
  hookTexts: string[];
}

async function generateAll(): Promise<GenerationBundle[]> {
  const bundles: GenerationBundle[] = [];
  for (const fx of FIXTURES) {
    const out = await mvpGenerate({ ...fx.input, forceVerticalId: fx.verticalId });
    const allTexts = [
      ...out.oneLinerCandidates.map((o) => o.text),
      ...out.hooks.map((h) => h.text),
      ...out.ugcScripts.map((u) => u.scriptHebrew),
      ...out.ugcScripts.map((u) => u.title),
      ...out.ugcScripts.map((u) => u.callToActionHebrew),
      ...out.imageConcepts.map((c) => c.visualDescription),
      ...out.imageConcepts.map((c) => c.title),
    ];
    const hookTexts = out.hooks.map((h) => h.text);
    bundles.push({ fixture: fx, output: out, allTexts, hookTexts });
  }
  return bundles;
}

// ─── checks ────────────────────────────────────────────────────

function checkVerticalRelevance(bundles: GenerationBundle[]) {
  for (const b of bundles) {
    const density = verticalKeywordDensity(b.hookTexts, b.fixture.expectedKeywords);
    const hitCount = b.hookTexts.filter((t) => b.fixture.expectedKeywords.some((k) => t.includes(k))).length;
    const label = `vertical-relevance · ${b.fixture.verticalId} (${b.fixture.brandName})`;
    if (density >= 0.60) {
      pass(label, `${(density * 100).toFixed(0)}% hooks contain required vocab (${hitCount}/${b.hookTexts.length})`);
    } else {
      fail(label, `only ${(density * 100).toFixed(0)}% hooks contain required vocab (${hitCount}/${b.hookTexts.length}) · required ≥ 60%`);
    }
  }
}

function checkLocalePurity(bundles: GenerationBundle[]) {
  for (const b of bundles) {
    const violations: string[] = [];
    for (const t of b.allTexts) {
      const r = validateLocalePurity(t, b.fixture.locale);
      if (!r.ok) violations.push(`  · "${t.slice(0, 60)}..." → ${r.reason}`);
    }
    const label = `locale-purity · ${b.fixture.verticalId} (${b.fixture.locale})`;
    if (violations.length === 0) {
      pass(label, `${b.allTexts.length} artifacts pure-${b.fixture.locale}`);
    } else {
      fail(label, `${violations.length} violations:\n${violations.slice(0, 3).join('\n')}`);
    }
  }
}

function checkCrossVerticalLeakage(bundles: GenerationBundle[]) {
  for (const b of bundles) {
    const leaks: string[] = [];
    for (const t of b.allTexts) {
      const leak = hasCrossVerticalLeak(t, b.fixture.forbiddenCrossVertical);
      if (leak.found) leaks.push(`  · "${t.slice(0, 60)}..." → leaked "${leak.word}"`);
    }
    const label = `cross-vertical-leakage · ${b.fixture.verticalId}`;
    if (leaks.length === 0) {
      pass(label, `no leakage of ${b.fixture.forbiddenCrossVertical.length} forbidden terms`);
    } else {
      fail(label, `${leaks.length} leaks:\n${leaks.slice(0, 3).join('\n')}`);
    }
  }
}

function checkMoodLanguageContainment(bundles: GenerationBundle[]) {
  // Every non-chocolate vertical must contain ZERO MOOD-specific phrases.
  const moodList = [...MOOD_LANGUAGE_HE, ...MOOD_LANGUAGE_EN];
  for (const b of bundles) {
    if (b.fixture.verticalId === 'chocolate') continue;
    const leaks: string[] = [];
    for (const t of b.allTexts) {
      for (const phrase of moodList) {
        if (t.toLowerCase().includes(phrase.toLowerCase())) {
          leaks.push(`  · "${t.slice(0, 60)}..." leaked "${phrase}"`);
        }
      }
    }
    const label = `mood-language-contained · ${b.fixture.verticalId}`;
    if (leaks.length === 0) {
      pass(label, 'no MOOD-specific phrases leaked');
    } else {
      fail(label, `${leaks.length} MOOD leaks:\n${leaks.slice(0, 3).join('\n')}`);
    }
  }

  // Chocolate IS permitted to use MOOD language · just confirm it
  // actually does (otherwise the corpus is broken).
  const chocolate = bundles.find((b) => b.fixture.verticalId === 'chocolate');
  if (chocolate) {
    const allText = chocolate.allTexts.join(' ');
    const hasPresence = allText.includes('נוכחות') || allText.toLowerCase().includes('presence');
    const hasSquare = allText.includes('ריבוע') || allText.toLowerCase().includes('square');
    const label = 'chocolate-allowed-mood-language';
    if (hasPresence && hasSquare) {
      pass(label, 'chocolate output contains its canonical vocabulary');
    } else {
      fail(label, `chocolate missing canon · presence=${hasPresence} square=${hasSquare}`);
    }
  }
}

function checkGenericChocolateTemplatesRejected(bundles: GenerationBundle[]) {
  // The prior stub's tells. These MUST be absent across all non-chocolate
  // verticals.
  const PRIOR_STUB_TELLS = [
    'בלי הצגות. בלי הבטחות',
    'נסה את המוצר',
    'תראה את הערב שאחרי',
    'אחרי שבוע',
    'הניסוי של היום',
    'אנחנו כבר לא משתמשים בשם הגנרי',
  ];
  for (const b of bundles) {
    if (b.fixture.verticalId === 'chocolate') continue;
    const violations: string[] = [];
    for (const t of b.allTexts) {
      for (const tell of PRIOR_STUB_TELLS) {
        if (t.includes(tell)) violations.push(`  · "${t.slice(0, 60)}..." matched stub tell "${tell}"`);
      }
    }
    const label = `generic-stub-templates-rejected · ${b.fixture.verticalId}`;
    if (violations.length === 0) {
      pass(label, 'no prior-stub template phrases survived');
    } else {
      fail(label, `${violations.length} stub-tell violations:\n${violations.slice(0, 3).join('\n')}`);
    }
  }
}

function checkCodeSwitchIncidents(bundles: GenerationBundle[]) {
  // Same definition as in verify-output-quality.ts (a Latin span > 4
  // chars inside a Hebrew-locale text counts).
  const HEBREW_RE = /[֐-׿]/;
  const LATIN_WORD_RE = /[A-Za-z][A-Za-z\s]{4,}/g;
  let totalIncidents = 0;
  const perVertical: Record<string, number> = {};
  for (const b of bundles) {
    let incidents = 0;
    if (b.fixture.locale === 'he') {
      for (const t of b.allTexts) {
        const latinSpans = t.match(LATIN_WORD_RE) ?? [];
        if (latinSpans.length > 0 && HEBREW_RE.test(t)) incidents += 1;
      }
    } else {
      for (const t of b.allTexts) {
        if (HEBREW_RE.test(t)) incidents += 1;
      }
    }
    perVertical[b.fixture.verticalId] = incidents;
    totalIncidents += incidents;
  }
  const label = 'code-switch-incidents-total';
  if (totalIncidents === 0) {
    pass(label, `0 across 10 verticals (perVertical: ${JSON.stringify(perVertical)})`);
  } else {
    fail(label, `${totalIncidents} incidents · perVertical: ${JSON.stringify(perVertical)}`);
  }
}

function checkOutputShape(bundles: GenerationBundle[]) {
  for (const b of bundles) {
    const shape = `${b.output.oneLinerCandidates.length}/${b.output.hooks.length}/${b.output.ugcScripts.length}/${b.output.imageConcepts.length}`;
    const label = `output-shape · ${b.fixture.verticalId}`;
    if (b.output.oneLinerCandidates.length >= 2
        && b.output.hooks.length >= 8       // some smaller verticals may pick fewer; we require ≥ 8
        && b.output.ugcScripts.length >= 3
        && b.output.imageConcepts.length >= 6) {
      pass(label, `shape ${shape} · meets minimum 2/8/3/6`);
    } else {
      fail(label, `shape ${shape} · below minimum 2/8/3/6`);
    }
  }
}

function checkAllVerticalsHaveCorpus() {
  // Sanity: every supported vertical has at least 4 hook templates in
  // each supported locale (otherwise the round-robin selector picks
  // duplicates).
  const ids: VerticalId[] = ['real-estate', 'accountant', 'lawyer', 'fitness', 'restaurant', 'saas', 'hvac', 'jewelry', 'cosmetics', 'chocolate'];
  for (const id of ids) {
    const v = VERTICAL_KNOWLEDGE_BASE[id];
    for (const locale of v.supportedLocales) {
      const hooks = v.hooks.filter((h) => h.locale === locale);
      const label = `corpus-depth · ${id} · ${locale}`;
      if (hooks.length >= 4) {
        pass(label, `${hooks.length} hooks in ${locale}`);
      } else {
        fail(label, `only ${hooks.length} hooks in ${locale} · need ≥ 4`);
      }
    }
  }
}

// ─── main ──────────────────────────────────────────────────────

async function main() {
  console.log('VERIFY · Vertical Intelligence V1\n');

  console.log('─── 0 · Corpus depth ───────────────────────────────');
  checkAllVerticalsHaveCorpus();

  console.log('\n─── 1 · Generating output for all 10 fixtures ────');
  const bundles = await generateAll();
  for (const b of bundles) {
    console.log(`  ${b.fixture.verticalId.padEnd(14)}  detected=${b.output.verticalId.padEnd(14)} confidence=${b.output.detectionConfidence.toFixed(2)} locale=${b.output.resolvedLocale}`);
  }

  console.log('\n─── 2 · Vertical-relevance (60% keyword density) ─');
  checkVerticalRelevance(bundles);

  console.log('\n─── 3 · Locale purity ────────────────────────────');
  checkLocalePurity(bundles);

  console.log('\n─── 4 · Cross-vertical leakage ───────────────────');
  checkCrossVerticalLeakage(bundles);

  console.log('\n─── 5 · MOOD-language containment ────────────────');
  checkMoodLanguageContainment(bundles);

  console.log('\n─── 6 · Prior-stub generic templates rejected ────');
  checkGenericChocolateTemplatesRejected(bundles);

  console.log('\n─── 7 · Code-switch incidents (total) ────────────');
  checkCodeSwitchIncidents(bundles);

  console.log('\n─── 8 · Output shape (2/8/3/6 minimum) ───────────');
  checkOutputShape(bundles);

  console.log('\n──────────────────────────────────────────────────');
  console.log(`PASSED: ${passed}    FAILED: ${failed}`);
  console.log('──────────────────────────────────────────────────');
  if (failed > 0) {
    console.log('\nVERIFY FAILED · vertical intelligence has gaps to close.');
    process.exit(1);
  } else {
    console.log('\nVERIFY PASSED · vertical intelligence V1 meets all behavioural checks.');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('verify-vertical-intelligence FAILED:', e);
  process.exit(1);
});
