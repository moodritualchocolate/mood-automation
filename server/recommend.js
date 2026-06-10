// Recommendation engine: turns a video + its analysis into Hebrew caption
// options, hooks, hashtags, suggested platforms and posting times, plus
// platform-specific versions.
//
// This v1 is fully self-contained (template + heuristic based) so it works
// offline. It is intentionally structured so a future version can swap
// `generate()` for a Claude API call without changing the rest of the system.

import { config } from './config.js';

const { brand } = config;

// Derives a few keywords from the filename so suggestions feel less generic.
// e.g. "chocolate-ritual-morning.mp4" -> ["chocolate","ritual","morning"]
function keywordsFromName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/[0-9]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 1);
}

// ---- Hebrew caption styles -------------------------------------------------

function captionOptions() {
  return {
    emotional: [
      'יש רגעים שמגיע לנו לעצור.',
      'כוס חמה, ריח של קקאו אמיתי, ונשימה אחת עמוקה. 🤎',
      'הטקס הקטן הזה הוא התזכורת היומית לדאוג לעצמך.',
      '',
      brand.cta,
    ].join('\n'),

    funny: [
      'אנשים: "אני שותה קפה כדי לתפקד".',
      'אני: 🍫🧘‍♀️ שותה את הטקס של MOOD ומרגישה כמו גורו.',
      'מי עוד מכור/ה? תייגו את החבר/ה שצריך/ה את זה דחוף 😂',
      '',
      brand.cta,
    ].join('\n'),

    brand: [
      'MOOD Ritual Chocolate 🤎',
      'קקאו טקסי, נקי ואמיתי — בלי תוספות מיותרות.',
      'רגע של איזון בתוך היום העמוס.',
      '',
      brand.cta,
    ].join('\n'),

    sales: [
      '🔥 הטקס שכולם מדברים עליו חזר למלאי.',
      'קקאו פרימיום, מתכון נקי, וטעם שממכר.',
      'כמות מוגבלת — אל תתפספסו.',
      '',
      brand.cta,
    ].join('\n'),
  };
}

function hooks() {
  return [
    'תפסיקו לגלול — זה הטקס שישנה לכם את הבוקר 🤎',
    '3 שניות וגיליתי למה כולם מכורים לזה ☕️🍫',
    'הדבר היחיד שאני עושה כל בוקר לפני הכל 👇',
    'אם אתם שותים קפה בבוקר — תקראו את זה.',
  ];
}

// ---- Hashtags --------------------------------------------------------------

function hashtags(keywords) {
  const hebrew = [
    '#מוד',
    '#שוקולד_טקסי',
    '#קקאו',
    '#טקס_בוקר',
    '#בריאות_טבעית',
    '#רגע_לעצמי',
    '#מתכון_נקי',
    '#מתוקים_בריאים',
  ];
  const english = [
    '#MOOD',
    '#RitualChocolate',
    '#Cacao',
    '#MorningRitual',
    '#CleanIngredients',
    '#SelfCare',
    '#Mindfulness',
    '#HealthyTreats',
  ];
  // Fold any meaningful filename keywords into the English set.
  for (const k of keywords) {
    const tag = '#' + k.replace(/[^a-z0-9]/g, '');
    if (tag.length > 2 && !english.includes(tag)) english.push(tag);
  }
  return { hebrew, english: english.slice(0, 12) };
}

// ---- Platform-specific versions -------------------------------------------

// Each platform gets a tailored caption length/tone, a recommended length,
// and a suggested local posting time (Israel audience heuristics).
function platformVersions(captions, tagSet, hook) {
  const igFbTags = [...tagSet.hebrew.slice(0, 5), ...tagSet.english.slice(0, 5)];
  const tiktokTags = [...tagSet.english.slice(0, 4), '#fyp', '#foryou', '#ישראל'];
  const ytTags = [...tagSet.english.slice(0, 6), '#Shorts'];

  return {
    instagram: {
      label: 'Instagram Reels',
      caption: `${hook}\n\n${captions.brand}`,
      hashtags: igFbTags,
      maxDurationSec: 90,
      suggestedTime: '19:30',
      notes: 'הוסיפו עד 5 האשטגים בתגובה הראשונה לחזות נקייה.',
    },
    tiktok: {
      label: 'TikTok',
      caption: `${hook}\n\n${captions.funny}`,
      hashtags: tiktokTags,
      maxDurationSec: 90,
      suggestedTime: '21:00',
      notes: 'טון קליל וישיר עובד הכי טוב. הוק חזק ב-3 השניות הראשונות.',
    },
    facebook: {
      label: 'Facebook Reels',
      caption: `${captions.emotional}`,
      hashtags: igFbTags.slice(0, 5),
      maxDurationSec: 90,
      suggestedTime: '20:00',
      notes: 'קהל פייסבוק מבוגר יותר — טקסט רגשי ומספר האשטגים מצומצם.',
    },
    youtube: {
      label: 'YouTube Shorts',
      caption: `${hook}\n\n${captions.sales}\n\n${ytTags.join(' ')}`,
      hashtags: ytTags,
      maxDurationSec: 60,
      suggestedTime: '18:00',
      notes: 'חובה להישאר מתחת ל-60 שניות. כותרת ברורה בתחילת התיאור.',
    },
  };
}

// Suggests which platforms suit this clip based on its analysis.
function suggestPlatforms(analysis) {
  const all = ['instagram', 'tiktok', 'facebook', 'youtube'];
  const dur = analysis?.durationSec;
  if (dur == null) return all;
  const suggested = [...all];
  // YouTube Shorts requires <= 60s.
  if (dur > 60) {
    const i = suggested.indexOf('youtube');
    if (i >= 0) suggested.splice(i, 1);
  }
  return suggested;
}

// Main entry point.
export function generate({ filename, analysis }) {
  const keywords = keywordsFromName(filename);
  const captions = captionOptions();
  const tagSet = hashtags(keywords);
  const hookList = hooks();
  const hook = hookList[0];

  return {
    generatedAt: new Date().toISOString(),
    source: 'heuristic-v1',
    hook,
    hookOptions: hookList,
    captions,
    hashtags: tagSet,
    platforms: platformVersions(captions, tagSet, hook),
    suggestedPlatforms: suggestPlatforms(analysis),
    suggestedTime: '19:30',
    cta: brand.cta,
  };
}
