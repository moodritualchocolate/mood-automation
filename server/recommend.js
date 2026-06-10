// Recommendation engine.
//
// Primary path: extract key frames from the video and ask Claude to analyze the
// actual content, then generate Hebrew recommendations in four brand styles
// (MOOD Brand, Emotional, Funny Israeli, Direct Response) — each with a hook,
// caption, CTA, hashtags, suggested platform and suggested posting time.
//
// Fallback path: when no ANTHROPIC_API_KEY is configured (or the call fails),
// an offline heuristic produces the same structure from templates so the system
// stays usable. The output shape is identical either way, so the UI never has
// to branch on the source.

import { config } from './config.js';
import { extractFrames } from './frames.js';
import { analyzeWithClaude, isConfigured } from './claude.js';

const { brand } = config;

// Hebrew display names for the four styles, in display order.
export const STYLE_ORDER = ['moodBrand', 'emotional', 'funny', 'directResponse'];
export const STYLE_NAMES = {
  moodBrand: 'מותג MOOD',
  emotional: 'רגשי',
  funny: 'הומור ישראלי',
  directResponse: 'מכירה ישירה',
};

// ---- Normalization ---------------------------------------------------------

// Converts Claude's per-style object into the canonical UI shape.
function normalizeStyle(key, s) {
  return {
    key,
    name: STYLE_NAMES[key],
    hook: s.hook || '',
    caption: s.caption || '',
    cta: s.cta || '',
    hashtags: {
      hebrew: Array.isArray(s.hashtagsHebrew) ? s.hashtagsHebrew : [],
      english: Array.isArray(s.hashtagsEnglish) ? s.hashtagsEnglish : [],
    },
    suggestedPlatform: s.suggestedPlatform || 'Instagram Reels',
    suggestedTime: s.suggestedTime || '19:30',
  };
}

function fromClaude({ parsed, model, framesAnalyzed }) {
  const styles = {};
  for (const key of STYLE_ORDER) {
    const s = parsed.styles?.[key] || {};
    styles[key] = normalizeStyle(key, s);
  }
  return {
    generatedAt: new Date().toISOString(),
    source: framesAnalyzed > 0 ? 'claude-vision' : 'claude-text',
    model,
    framesAnalyzed,
    contentAnalysis: parsed.contentAnalysis || '',
    detectedElements: Array.isArray(parsed.detectedElements) ? parsed.detectedElements : [],
    styles,
  };
}

// ---- Heuristic fallback ----------------------------------------------------

// Derives keywords from the filename so even the offline fallback feels a bit
// tailored. e.g. "morning-cacao.mp4" -> ["morning","cacao"]
function keywordsFromName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/[0-9]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 1);
}

function heuristicHashtags(keywords) {
  const hebrew = ['#מוד', '#שוקולד_טקסי', '#קקאו', '#טקס_בוקר', '#רגע_לעצמי'];
  const english = ['#MOOD', '#RitualChocolate', '#Cacao', '#MorningRitual', '#SelfCare'];
  for (const k of keywords) {
    const tag = '#' + k.replace(/[^a-z0-9]/g, '');
    if (tag.length > 2 && !english.includes(tag)) english.push(tag);
  }
  return { hebrew, english: english.slice(0, 8) };
}

function heuristicRecommendations({ filename }) {
  const tags = heuristicHashtags(keywordsFromName(filename));
  const cta = brand.cta;

  const make = (key, hook, caption, platform, time) =>
    normalizeStyle(key, {
      hook,
      caption,
      cta,
      hashtagsHebrew: tags.hebrew,
      hashtagsEnglish: tags.english,
      suggestedPlatform: platform,
      suggestedTime: time,
    });

  return {
    generatedAt: new Date().toISOString(),
    source: 'heuristic-fallback',
    model: null,
    framesAnalyzed: 0,
    contentAnalysis:
      'נוצר ללא ניתוח חזותי (אין חיבור ל-Claude או שלא ניתן לחלץ פריימים). ההמלצות מבוססות על תבניות מותג בלבד — מומלץ לבדוק ולערוך ידנית.',
    detectedElements: [],
    styles: {
      moodBrand: make(
        'moodBrand',
        'רגע של איזון, כוס אחת בכל פעם 🤎',
        'MOOD Ritual Chocolate 🤎\nקקאו טקסי, נקי ואמיתי — בלי תוספות מיותרות.\nרגע של שלווה בתוך היום העמוס.',
        'Instagram Reels',
        '19:30',
      ),
      emotional: make(
        'emotional',
        'יש רגעים שמגיע לנו לעצור 🤎',
        'כוס חמה, ריח של קקאו אמיתי, ונשימה אחת עמוקה.\nהטקס הקטן הזה הוא התזכורת היומית לדאוג לעצמך.',
        'Facebook Reels',
        '20:00',
      ),
      funny: make(
        'funny',
        'אנשים שותים קפה לתפקד. אני? טקס שלם 🍫🧘',
        'מי עוד מכור/ה לטקס של MOOD? 😂\nתייגו את החבר/ה שצריך/ה את זה דחוף.',
        'TikTok',
        '21:00',
      ),
      directResponse: make(
        'directResponse',
        '🔥 חזר למלאי — והפעם בכמות מוגבלת',
        'הטקס שכולם מדברים עליו חזר.\nקקאו פרימיום, מתכון נקי, וטעם שממכר.\nאל תתפספסו.',
        'YouTube Shorts',
        '18:00',
      ),
    },
  };
}

// ---- Public API ------------------------------------------------------------

// Generates recommendations for a video. Tries the Claude vision path first and
// falls back to heuristics on any error. Never throws — always returns a usable
// recommendations object.
export async function generateRecommendations({ filePath, filename, analysis }) {
  if (!isConfigured()) {
    return heuristicRecommendations({ filename });
  }

  try {
    const frames = await extractFrames(filePath, {
      count: config.claude.frameCount,
      durationSec: analysis?.durationSec ?? null,
    });

    const result = await analyzeWithClaude({ frames, meta: analysis, filename });
    return fromClaude(result);
  } catch (err) {
    console.error('[recommend] Claude path failed, using heuristic fallback:', err.message);
    const fallback = heuristicRecommendations({ filename });
    fallback.fallbackReason = err.message;
    return fallback;
  }
}
