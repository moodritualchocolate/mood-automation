/**
 * VERIFY — Real-LLM generator (OpenAI adapter)
 *
 * Two modes:
 *
 *   STUB MODE (no OPENAI_API_KEY)
 *     · proves the corpus fallback path is unchanged by the wiring
 *     · runs 10 verticals through mvpGenerate, asserts shape +
 *       locale purity + 0 code-switch + vertical-keyword density
 *     · exits 0 on success
 *
 *   LIVE MODE (OPENAI_API_KEY present)
 *     · calls the real OpenAI model for every vertical
 *     · gates on the directive's success thresholds:
 *         average net-quality ≥ 40 / 60
 *         no vertical below 30 / 60
 *         code-switch incidents = 0
 *     · prints cost-shape (tokens in/out · model · latency) so the
 *       operator can decide whether to ship it
 *     · skipped automatically when no key is set — never fails the
 *       suite for an absent key
 *
 * Run:
 *   npx tsx scripts/verify-real-llm-generator.ts
 *   OPENAI_API_KEY=… npx tsx scripts/verify-real-llm-generator.ts
 *   OPENAI_MODEL=gpt-4o-mini OPENAI_API_KEY=… npx tsx scripts/verify-real-llm-generator.ts
 */

import { mvpGenerate, activeProvider, type MvpGenerateInput, type MvpGenerateOutput } from '../lib/mvpLlmProvider';
import {
  validateLocalePurity, hasCrossVerticalLeak, verticalKeywordDensity,
  VERTICAL_KNOWLEDGE_BASE, type VerticalId,
} from '../lib/verticalIntelligence';

interface Fixture {
  verticalId: VerticalId;
  brandName: string;
  locale: 'he' | 'en';
  input: MvpGenerateInput;
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
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
  },
  {
    verticalId: 'accountant',
    brandName: 'Tax Studio',
    locale: 'he',
    input: {
      artifact: 'שירות הנהלת חשבונות ומס לעוסקים מורשים וחברות קטנות',
      audience: 'בעלי עסקים קטנים בני 30-55 עם מחזור 500K-5M',
      emotional: 'בלי פחד ממס הכנסה במרץ',
      locale: 'Israel · Hebrew',
    },
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
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור', 'wellness', 'healing'],
  },
  {
    verticalId: 'fitness',
    brandName: 'Mile',
    locale: 'en',
    input: {
      artifact: 'Running shoes designed for the comeback runner',
      audience: '30-50 year-olds who used to run but stopped during career or family',
      emotional: 'Become a runner again, not someone who used to run',
      locale: 'Global · English',
    },
    forbiddenCrossVertical: ['chocolate', 'cacao', 'presence', 'mood', 'square'],
  },
  {
    verticalId: 'restaurant',
    brandName: 'Tov Hayom',
    locale: 'he',
    input: {
      artifact: 'מסעדה שכונתית שמגישה ארוחת ערב אמיתית אחרי העבודה',
      audience: 'ישראלים עירוניים בני 28-45 · רוצים ארוחה אחת טובה',
      emotional: 'ארוחה אמיתית · לא עוד איסוף מהיר',
      locale: 'Israel · Hebrew',
    },
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
    forbiddenCrossVertical: ['chocolate', 'cacao', 'presence', 'mood', 'square'],
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
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
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
    forbiddenCrossVertical: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור'],
  },
  {
    verticalId: 'chocolate',
    brandName: 'MOOD',
    locale: 'he',
    input: {
      artifact: 'שוקולד מריר פרימיום של מותג ישראלי',
      audience: 'בוגרים ישראליים 32-50 · עירוניים · עם תקציב להוצאה איכותית',
      emotional: 'להיות נוכחים ברגעים שאחרת היו אובדים',
      locale: 'Israel · Hebrew',
    },
    forbiddenCrossVertical: [],
  },
];

// ─── score function (same dimensions as verify-output-quality) ──

interface Score {
  clarity: number; specificity: number; commercialValue: number;
  emotionalImpact: number; scrollStop: number; industryRelevance: number;
  genericAIRisk: number; netQuality: number;
}

const HEBREW_RE = /[֐-׿]/;
const LATIN_WORD_RE = /[A-Za-z][A-Za-z\s]{4,}/g;

function detectCodeSwitch(text: string, locale: 'he' | 'en'): boolean {
  if (locale === 'he') {
    const latinSpans = text.match(LATIN_WORD_RE) ?? [];
    return latinSpans.length > 0 && HEBREW_RE.test(text);
  }
  return HEBREW_RE.test(text);
}

function scoreText(text: string, expectedKeywords: string[], locale: 'he' | 'en'): Score {
  const len = text.length;
  const codeSwitched = detectCodeSwitch(text, locale);

  let clarity = 7;
  if (len < 10) clarity -= 4;
  if (len > 240) clarity -= 2;
  if (codeSwitched) clarity -= 4;
  clarity = Math.max(1, Math.min(10, clarity));

  const keywordHits = expectedKeywords.filter((k) => text.includes(k)).length;
  const specificity = Math.max(1, Math.min(10, 3 + keywordHits * 2));

  let commercialValue = 6;
  if (text.includes('?')) commercialValue += 1;
  if (/[.!]$/.test(text.trim())) commercialValue += 1;
  if (len >= 12 && len <= 80) commercialValue += 1;
  if (codeSwitched) commercialValue -= 3;
  commercialValue = Math.max(1, Math.min(10, commercialValue));

  let emotionalImpact = 4;
  if (/(אתה|את|אתם|אתן|שלך|שלכם|שלי)/.test(text)) emotionalImpact += 2;
  if (/(\byou\b|\byour\b|\byours\b|\bI\b|\bmy\b|\bwe\b)/i.test(text)) emotionalImpact += 2;
  if (/(רגע|נוכחות|שקט|עוצמה|חופש|מותר|תרגיש|להרגיש|להיות|זוכר|זוכרת|איתך|כבוד)/.test(text)) emotionalImpact += 2;
  if (/\b(feel|remember|forgot|matter|protect|return|own|keep|hold|honest|real|quiet)\b/i.test(text)) emotionalImpact += 2;
  emotionalImpact = Math.max(1, Math.min(10, emotionalImpact));

  let scrollStop = 5;
  if (len >= 8 && len <= 50) scrollStop += 3;
  if (len < 8) scrollStop -= 2;
  if (len > 90) scrollStop -= 3;
  if (text.includes('.') && text.length > 30) scrollStop += 1;
  scrollStop = Math.max(1, Math.min(10, scrollStop));

  const industryRelevance = Math.max(1, Math.min(10, 2 + keywordHits * 2));

  let genericAIRisk = 3;
  if (/\$\{|undefined|null/.test(text)) genericAIRisk += 5;
  if (codeSwitched) genericAIRisk += 4;
  if (/(בלי הצגות|תראה את הערב שאחרי)/.test(text)) genericAIRisk += 2;
  genericAIRisk = Math.max(1, Math.min(10, genericAIRisk));

  const netQuality = clarity + specificity + commercialValue + emotionalImpact + scrollStop + industryRelevance - genericAIRisk;
  return { clarity, specificity, commercialValue, emotionalImpact, scrollStop, industryRelevance, genericAIRisk, netQuality };
}

function expectedKeywordsFor(fx: Fixture): string[] {
  const v = VERTICAL_KNOWLEDGE_BASE[fx.verticalId];
  return v.vocabulary.required[fx.locale] ?? [];
}

// ─── per-fixture run ───────────────────────────────────────────

interface FixtureResult {
  fixture: Fixture;
  output: MvpGenerateOutput;
  averageNet: number;
  codeSwitchHits: number;
  artifactCount: number;
  vocabDensity: number;
  durationMs: number;
}

async function runFixture(fx: Fixture): Promise<FixtureResult> {
  const t0 = Date.now();
  const out = await mvpGenerate(fx.input);
  const durationMs = Date.now() - t0;

  const expected = expectedKeywordsFor(fx);
  const oneLinerScores = out.oneLinerCandidates.map((o) => scoreText(o.text, expected, fx.locale));
  const hookScores = out.hooks.map((h) => scoreText(h.text, expected, fx.locale));
  const ugcScores = out.ugcScripts.map((u) => scoreText(u.scriptHebrew, expected, fx.locale));
  const conceptScores = out.imageConcepts.map((c) => scoreText(c.visualDescription, expected, fx.locale));
  const allScores = [...oneLinerScores, ...hookScores, ...ugcScores, ...conceptScores];
  const averageNet = allScores.length > 0
    ? allScores.reduce((s, c) => s + c.netQuality, 0) / allScores.length
    : 0;

  const allTexts = [
    ...out.oneLinerCandidates.map((o) => o.text),
    ...out.hooks.map((h) => h.text),
    ...out.ugcScripts.map((u) => u.scriptHebrew),
    ...out.ugcScripts.map((u) => u.title),
    ...out.ugcScripts.map((u) => u.callToActionHebrew),
    ...out.imageConcepts.map((c) => c.visualDescription),
    ...out.imageConcepts.map((c) => c.title),
  ];

  // Code-switch only on consumer-facing strings (one-liners + hooks + UGC).
  // Image concepts intentionally use English crew terms in Hebrew briefs.
  const consumerTexts = [
    ...out.oneLinerCandidates.map((o) => o.text),
    ...out.hooks.map((h) => h.text),
    ...out.ugcScripts.map((u) => u.scriptHebrew),
    ...out.ugcScripts.map((u) => u.title),
    ...out.ugcScripts.map((u) => u.callToActionHebrew),
  ];
  const codeSwitchHits = consumerTexts.filter((t) => detectCodeSwitch(t, fx.locale)).length;

  const hookTexts = out.hooks.map((h) => h.text);
  const vocabDensity = verticalKeywordDensity(hookTexts, expected);

  return {
    fixture: fx,
    output: out,
    averageNet,
    codeSwitchHits,
    artifactCount: allTexts.length,
    vocabDensity,
    durationMs,
  };
}

// ─── verifier ──────────────────────────────────────────────────

let passed = 0, failed = 0;
function pass(label: string, detail = '') {
  passed += 1;
  console.log(`  PASS  ${label}${detail ? '\n        ' + detail : ''}`);
}
function fail(label: string, detail = '') {
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? '\n        ' + detail : ''}`);
}

async function main() {
  const provider = activeProvider();
  const isLive = provider === 'openai';
  console.log(`VERIFY · Real-LLM Generator`);
  console.log(`Active provider: ${provider}`);
  console.log(`Mode: ${isLive ? 'LIVE (OpenAI)' : 'STUB (corpus fallback)'}`);
  console.log(`Model: ${process.env.OPENAI_MODEL || 'gpt-4.1-mini (default)'}`);
  console.log('────────────────────────────────────────────────────\n');

  const results: FixtureResult[] = [];
  for (const fx of FIXTURES) {
    const r = await runFixture(fx);
    results.push(r);
    const diag = r.output.llmDiagnostics;
    console.log(
      `  ${fx.verticalId.padEnd(14)}  net=${r.averageNet.toFixed(1).padStart(5)}  ` +
      `density=${(r.vocabDensity * 100).toFixed(0).padStart(3)}%  ` +
      `cs=${r.codeSwitchHits}  ` +
      `dur=${r.durationMs}ms` +
      (diag ? `  attempts=${diag.attempts}  tokens=${diag.tokensIn ?? '?'}/${diag.tokensOut ?? '?'}  fallback=${diag.fellBack}` : ''),
    );
    if (diag?.fellBack) {
      console.log(`        ⚠ LLM fell back to corpus: ${diag.fallbackReason}`);
    }
  }

  console.log('');

  // ─── 1 · shape (always enforced) ─────────────────────────────
  console.log('─── 1 · Output shape ───────────────────────────────');
  for (const r of results) {
    const shape = `${r.output.oneLinerCandidates.length}/${r.output.hooks.length}/${r.output.ugcScripts.length}/${r.output.imageConcepts.length}`;
    if (r.output.oneLinerCandidates.length >= 2
        && r.output.hooks.length >= 8
        && r.output.ugcScripts.length >= 3
        && r.output.imageConcepts.length >= 6) {
      pass(`shape · ${r.fixture.verticalId}`, `${shape}`);
    } else {
      fail(`shape · ${r.fixture.verticalId}`, `${shape} below minimum 2/8/3/6`);
    }
  }

  // ─── 2 · locale purity (always enforced) ─────────────────────
  console.log('\n─── 2 · Locale purity ──────────────────────────────');
  for (const r of results) {
    const texts = [
      ...r.output.oneLinerCandidates.map((o) => o.text),
      ...r.output.hooks.map((h) => h.text),
      ...r.output.ugcScripts.map((u) => u.scriptHebrew),
      ...r.output.ugcScripts.map((u) => u.title),
      ...r.output.ugcScripts.map((u) => u.callToActionHebrew),
    ];
    const violations: string[] = [];
    for (const t of texts) {
      const v = validateLocalePurity(t, r.fixture.locale);
      if (!v.ok) violations.push(`"${t.slice(0, 50)}" → ${v.reason}`);
    }
    if (violations.length === 0) {
      pass(`locale-purity · ${r.fixture.verticalId}`, `${texts.length} consumer-facing strings pure-${r.fixture.locale}`);
    } else {
      fail(`locale-purity · ${r.fixture.verticalId}`, `${violations.length} violations · ${violations.slice(0, 2).join(' | ')}`);
    }
  }

  // ─── 3 · cross-vertical leakage (always enforced) ────────────
  console.log('\n─── 3 · Cross-vertical leakage ─────────────────────');
  for (const r of results) {
    const allTexts = [
      ...r.output.oneLinerCandidates.map((o) => o.text),
      ...r.output.hooks.map((h) => h.text),
      ...r.output.ugcScripts.map((u) => u.scriptHebrew),
      ...r.output.imageConcepts.map((c) => c.visualDescription),
    ];
    const leaks: string[] = [];
    for (const t of allTexts) {
      const leak = hasCrossVerticalLeak(t, r.fixture.forbiddenCrossVertical);
      if (leak.found) leaks.push(`"${t.slice(0, 50)}" leaked "${leak.word}"`);
    }
    if (leaks.length === 0) {
      pass(`cross-vertical · ${r.fixture.verticalId}`, `no leakage of ${r.fixture.forbiddenCrossVertical.length} forbidden terms`);
    } else {
      fail(`cross-vertical · ${r.fixture.verticalId}`, `${leaks.length} leaks · ${leaks.slice(0, 2).join(' | ')}`);
    }
  }

  // ─── 4 · code-switch incidents (always enforced) ─────────────
  console.log('\n─── 4 · Code-switch incidents ──────────────────────');
  const totalCodeSwitch = results.reduce((s, r) => s + r.codeSwitchHits, 0);
  if (totalCodeSwitch === 0) {
    pass(`code-switch-total`, '0 across 10 verticals (consumer-facing strings)');
  } else {
    fail(`code-switch-total`, `${totalCodeSwitch} across 10 verticals`);
  }

  // ─── 5 · vertical-keyword density ≥ 60% (always enforced) ────
  console.log('\n─── 5 · Vertical-keyword density (≥ 60%) ───────────');
  for (const r of results) {
    if (r.vocabDensity >= 0.60) {
      pass(`density · ${r.fixture.verticalId}`, `${(r.vocabDensity * 100).toFixed(0)}% of hooks`);
    } else {
      fail(`density · ${r.fixture.verticalId}`, `${(r.vocabDensity * 100).toFixed(0)}% of hooks · need ≥ 60%`);
    }
  }

  // ─── 6 · quality gates (only in LIVE mode) ───────────────────
  console.log('\n─── 6 · Quality gates ──────────────────────────────');
  const overallNet = results.reduce((s, r) => s + r.averageNet, 0) / results.length;
  const minVertical = Math.min(...results.map((r) => r.averageNet));
  const worstVertical = results.reduce((min, r) => (r.averageNet < min.averageNet ? r : min));

  if (isLive) {
    // Live mode · directive thresholds
    if (overallNet >= 40) pass('overall-net-quality ≥ 40', `${overallNet.toFixed(2)} / 60`);
    else                  fail('overall-net-quality ≥ 40', `${overallNet.toFixed(2)} / 60 · need ≥ 40`);

    if (minVertical >= 30) pass('no-vertical-below-30', `min ${minVertical.toFixed(2)} (${worstVertical.fixture.verticalId})`);
    else                   fail('no-vertical-below-30', `${worstVertical.fixture.verticalId} at ${minVertical.toFixed(2)} · need ≥ 30`);
  } else {
    // Stub mode · informational only · the corpus baseline can clear
    // the 30-floor but not the 40-overall (that's what the LLM is for)
    console.log(`  INFO  overall-net-quality        ${overallNet.toFixed(2)} / 60 (informational · LIVE mode is the 40+ gate)`);
    console.log(`  INFO  worst-vertical             ${minVertical.toFixed(2)} (${worstVertical.fixture.verticalId})`);
    if (minVertical >= 30) pass('no-vertical-below-30 · stub mode', `min ${minVertical.toFixed(2)}`);
    else                   fail('no-vertical-below-30 · stub mode', `${worstVertical.fixture.verticalId} at ${minVertical.toFixed(2)}`);
  }

  // ─── 7 · LLM cost-shape (LIVE only) ──────────────────────────
  if (isLive) {
    console.log('\n─── 7 · LLM cost-shape (per generation) ────────────');
    let totalIn = 0, totalOut = 0, totalAttempts = 0, totalLatency = 0, totalFallbacks = 0;
    let observedRuns = 0;
    const fallbackReasons: Record<string, number> = {};
    const perVerticalFailures: Array<{ vertical: string; reason: string }> = [];
    for (const r of results) {
      const d = r.output.llmDiagnostics;
      if (!d) continue;
      observedRuns += 1;
      totalIn += d.tokensIn ?? 0;
      totalOut += d.tokensOut ?? 0;
      totalAttempts += d.attempts;
      totalLatency += d.latencyMs;
      if (d.fellBack) {
        totalFallbacks += 1;
        const reason = d.fallbackReason ?? '(unknown)';
        // Bucket by reason prefix (first 80 chars) for grouping.
        const key = reason.slice(0, 120);
        fallbackReasons[key] = (fallbackReasons[key] ?? 0) + 1;
        perVerticalFailures.push({ vertical: r.fixture.verticalId, reason });
      }
    }

    // Surface fallback reasons FIRST · so they're impossible to miss.
    if (totalFallbacks > 0) {
      console.log('');
      console.log('  ⚠  LLM FALLBACKS DETECTED · the OpenAI path failed and corpus was used.');
      console.log(`  ⚠  ${totalFallbacks} of ${observedRuns} verticals fell back.`);
      console.log('');
      console.log('  Fallback reasons (bucketed by first 120 chars):');
      for (const [reason, count] of Object.entries(fallbackReasons)) {
        console.log(`    [${count}×] ${reason}`);
      }
      console.log('');
      console.log('  Per-vertical detail (first 5):');
      for (const pv of perVerticalFailures.slice(0, 5)) {
        console.log(`    ${pv.vertical.padEnd(14)} · ${pv.reason}`);
      }
      console.log('');
      console.log('  → Run `npx tsx scripts/diagnose-openai.ts` for the exact OpenAI failure reason + suggested fix.');
      console.log('');
    }

    if (observedRuns > 0 && totalFallbacks < observedRuns) {
      const successRuns = observedRuns - totalFallbacks;
      const avgIn = Math.round(totalIn / Math.max(1, successRuns));
      const avgOut = Math.round(totalOut / Math.max(1, successRuns));
      const avgLatency = Math.round(totalLatency / Math.max(1, successRuns));
      const avgAttempts = (totalAttempts / Math.max(1, observedRuns)).toFixed(2);
      const costUsd = (avgIn * 0.40 + avgOut * 1.60) / 1_000_000;
      console.log(`  avg tokens in   : ${avgIn} (across ${successRuns} successful run(s))`);
      console.log(`  avg tokens out  : ${avgOut}`);
      console.log(`  avg latency     : ${avgLatency}ms`);
      console.log(`  avg attempts    : ${avgAttempts}`);
      console.log(`  fallbacks       : ${totalFallbacks} / ${observedRuns}`);
      console.log(`  est. cost/gen   : $${costUsd.toFixed(4)} (gpt-4.1-mini list pricing · adjust per actual model)`);
    } else if (observedRuns === 0) {
      console.log('  no LLM diagnostics observed · all paths fell through to corpus without invoking the adapter');
    } else {
      console.log('  no successful LLM runs · 0/0/0/0 stats are vacuous · diagnose the fallback reasons above');
    }
  }

  console.log('\n──────────────────────────────────────────────────');
  console.log(`PASSED: ${passed}    FAILED: ${failed}`);
  console.log('──────────────────────────────────────────────────');

  if (failed > 0) {
    console.log(isLive
      ? '\nVERIFY FAILED · real-LLM generator missed a gate.'
      : '\nVERIFY FAILED · stub-mode baseline regressed.');
    process.exit(1);
  } else {
    console.log(isLive
      ? '\nVERIFY PASSED · real-LLM generator meets all quality + safety gates.'
      : '\nVERIFY PASSED · stub-mode baseline intact (LIVE mode skipped · set OPENAI_API_KEY to run it).');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('verify-real-llm-generator FAILED:', e);
  process.exit(1);
});
