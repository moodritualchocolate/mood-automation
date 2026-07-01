// Live demo mode. Seeds realistic sample videos (no real files, no Claude
// calls, no network) so the full Social Video Review + YouTube flow can be
// shown end-to-end. Demo videos carry `demo: true` and are never published for
// real — "Test Upload" is simulated.

import { APPROVAL_ITEMS } from './config.js';
import {
  listVideos, getVideo, upsertVideo, updateVideo, removeVideo,
  listCompetitors, upsertCompetitor, removeCompetitor,
  listInspiration, upsertInspiration, removeInspiration,
  goals as goalStore, resetOS,
} from './store.js';
import * as autonomy from './autonomy.js';

const DEMO_IDS = ['demo-new', 'demo-ready', 'demo-published'];

function approvalAll(value) {
  return Object.fromEntries(APPROVAL_ITEMS.map((i) => [i.key, value]));
}

function demoAnalysis(durationSec) {
  return {
    probed: true,
    sizeBytes: Math.round(durationSec * 1.4 * 1024 * 1024),
    durationSec,
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    fps: 30,
    videoCodec: 'h264',
    audioCodec: 'aac',
    hasAudio: true,
    bitrate: 12_000_000,
    ext: '.mp4',
    readiness: { ready: true, notes: [] },
    analyzedAt: new Date().toISOString(),
    demo: true,
  };
}

function demoTranscript(text) {
  return {
    available: true,
    text,
    language: 'he',
    source: 'demo',
    transcribedAt: new Date().toISOString(),
    editedManually: false,
  };
}

function style(key, name, hook, caption, cta, platform, time) {
  return {
    key,
    name,
    hook,
    caption,
    cta,
    hashtags: {
      hebrew: ['#מוד', '#שוקולד_טקסי', '#קקאו', '#טקס_בוקר', '#רגע_לעצמי'],
      english: ['#MOOD', '#RitualChocolate', '#Cacao', '#MorningRitual', '#SelfCare', '#Shorts'],
    },
    suggestedPlatform: platform,
    suggestedTime: time,
  };
}

function demoRecommendations() {
  return {
    generatedAt: new Date().toISOString(),
    source: 'demo',
    model: 'demo',
    framesAnalyzed: 6,
    usedTranscript: true,
    contentAnalysis:
      'בסרטון נראית הכנה של משקה קקאו טקסי: מוזגים מים חמים לכוס עם אבקת קקאו כהה, מערבבים לאט, ועולה אדים. התאורה חמה והאווירה רגועה. בפס הקול נשמע קריינות שקטה על "רגע של עצירה בבוקר".',
    detectedElements: ['כוס קרמיקה', 'אבקת קקאו', 'אדים', 'תאורה חמה', 'ידיים מערבבות', 'אווירה רגועה'],
    styles: {
      moodBrand: style(
        'moodBrand',
        'מותג MOOD',
        'רגע של איזון, כוס אחת בכל פעם 🤎',
        'MOOD Ritual Chocolate 🤎\nקקאו טקסי, נקי ואמיתי — בלי תוספות מיותרות.\nהבוקר מתחיל ברגע אחד של שקט.',
        'הזמינו עכשיו דרך הקישור בביו 🍫',
        'Instagram Reels',
        '19:30',
      ),
      emotional: style(
        'emotional',
        'רגשי',
        'יש בקרים שמגיע לנו לעצור 🤎',
        'ריח של קקאו אמיתי, אדים שעולים לאט, ונשימה אחת עמוקה.\nהטקס הקטן הזה הוא התזכורת לדאוג לעצמך.',
        'תנו לעצמכם את הרגע הזה — קישור בביו',
        'Facebook Reels',
        '20:00',
      ),
      funny: style(
        'funny',
        'הומור ישראלי',
        'כולם רצים על קפה. אני? טקס שלם של קקאו 🍫🧘',
        'בזמן שאתם בלחץ של הבוקר, אני מערבב קקאו כאילו אני שף במאסטר שף 😂\nתייגו את מי שחייב/ת להירגע.',
        'בואו תתמכרו יפה — קישור בביו',
        'TikTok',
        '21:00',
      ),
      directResponse: style(
        'directResponse',
        'מכירה ישירה',
        '🔥 חזר למלאי — וכמות מוגבלת',
        'הטקס שכולם מדברים עליו חזר.\nקקאו פרימיום, מתכון נקי, וטעם שממכר.\nאל תתפספסו.',
        'הזמינו עכשיו לפני שייגמר 🍫',
        'YouTube Shorts',
        '18:00',
      ),
    },
  };
}

function defaultEdits(rec) {
  const s = rec.styles.moodBrand;
  return {
    caption: s.caption,
    hashtags: [...s.hashtags.hebrew, ...s.hashtags.english].join(' '),
    cta: s.cta,
    platforms: ['youtube'],
    publishTime: '',
  };
}

// Builds one demo video record at a given stage.
function buildDemoVideo(id, { filename, durationSec, transcript, stage }) {
  const now = new Date().toISOString();
  const analysis = demoAnalysis(durationSec);
  const recommendations = demoRecommendations();
  const video = {
    id,
    filename,
    demo: true,
    path: '', // no real file — preview is a placeholder
    relPath: filename,
    ext: '.mp4',
    sizeBytes: analysis.sizeBytes,
    addedAt: now,
    modifiedAt: now,
    status: 'New',
    analysis,
    transcript: demoTranscript(transcript),
    recommendations,
    edits: defaultEdits(recommendations),
    approval: approvalAll(false),
    publish: {},
    publishHistory: [],
    createdAt: now,
    updatedAt: now,
  };

  if (stage === 'ready') {
    video.status = 'Ready to publish';
    video.approval = approvalAll(true);
  } else if (stage === 'published') {
    video.status = 'Published';
    video.approval = approvalAll(true);
    const vid = 'DEMO_8sQ2k';
    const url = `https://www.youtube.com/shorts/${vid}`;
    const at = now;
    video.publish = {
      youtube: {
        status: 'published',
        videoId: vid,
        url,
        publishedAt: at,
        privacyStatus: 'unlisted',
        title: video.edits.caption.split('\n')[0],
        error: null,
        demo: true,
      },
    };
    video.publishHistory = [
      { platform: 'youtube', status: 'published', at, videoId: vid, url, privacyStatus: 'unlisted', demo: true },
    ];
  }
  return video;
}

// Seeds the three demo videos. Overwrites existing demo records so the showcase
// always starts from a known state. Real (non-demo) videos are untouched.
export function seedDemoVideos() {
  upsertVideo(
    buildDemoVideo('demo-new', {
      filename: 'demo-morning-cacao-ritual.mp4',
      durationSec: 18,
      stage: 'new',
      transcript:
        'בוקר טוב. לפני שכל היום מתחיל, אני עוצרת לרגע אחד. מוזגים מים חמים, מערבבים את הקקאו לאט, ונושמים עמוק. זה כל הסוד — רגע אחד בשבילי.',
    }),
  );
  upsertVideo(
    buildDemoVideo('demo-ready', {
      filename: 'demo-evening-ritual.mp4',
      durationSec: 22,
      stage: 'ready',
      transcript:
        'בערב, כשהבית נרגע, אני מכינה לעצמי כוס קקאו. בלי טלפון, בלי רעש. רק אני והטעם הזה שמרגיע.',
    }),
  );
  upsertVideo(
    buildDemoVideo('demo-published', {
      filename: 'demo-behind-the-scenes.mp4',
      durationSec: 15,
      stage: 'published',
      transcript:
        'רגע מאחורי הקלעים: ככה נראית ההכנה של אצווה חדשה. קקאו טהור, בלי קיצורי דרך.',
    }),
  );
  return listDemoVideos();
}

export function listDemoVideos() {
  return DEMO_IDS.map((id) => getVideo(id)).filter(Boolean);
}

export function hasDemoVideos() {
  return DEMO_IDS.some((id) => !!getVideo(id));
}

export function isDemoVideo(id) {
  return DEMO_IDS.includes(id) || !!getVideo(id)?.demo;
}

// Removes all demo videos (leaves real ones).
export function clearDemoVideos() {
  for (const v of listVideos()) {
    if (v.demo) removeVideo(v.id);
  }
}

// ---- Demo: competitors + inspiration ---------------------------------------

function demoAsset(id, title, channel, views, note) {
  return {
    source: 'youtube',
    videoId: id,
    title,
    url: `https://www.youtube.com/watch?v=${id}`,
    shortsUrl: `https://www.youtube.com/shorts/${id}`,
    thumbnail: null, // demo → UI shows a placeholder
    channelTitle: channel,
    channelId: 'DEMO',
    publishedAt: new Date().toISOString(),
    views,
    likes: Math.round(views * 0.06),
    adaptNote: note,
    demo: true,
  };
}

export function demoCompetitorRecent() {
  return [
    demoAsset('demoA1', 'ASMR הכנת קקאו טהור בבוקר', 'Cacao Daily', 184000, ''),
    demoAsset('demoA2', '3 סיבות להחליף קפה בקקאו', 'Cacao Daily', 92000, ''),
    demoAsset('demoA3', 'טקס בוקר של 60 שניות', 'Cacao Daily', 61000, ''),
  ];
}

export function demoCompetitorInsight() {
  return {
    summary: 'Cacao Daily מצליחים עם קליפים אנכיים קצרים, סאונד ASMR של הכנה, וטקסט גדול על המסך. ההוק תמיד בשנייה הראשונה.',
    whatWorks: ['ASMR של מזיגה/ערבוב', 'הבטחת תועלת מיידית ("במקום קפה")', 'טקסט עברית ברור על המסך'],
    ideasForMood: ['סדרת "טקס בוקר" עם קקאו MOOD', 'קליפ "קפה מול קקאו" בטון ישראלי', 'טיפ/מתכון ב-15 שניות'],
    hooks: ['תפסיקו לגלול — הטקס שישנה לכם את הבוקר', 'החלפתי קפה בזה ל-7 ימים', 'הדבר היחיד שאני עושה כל בוקר'],
  };
}

const DEMO_COMPETITORS = [
  { id: 'demo-comp-1', name: 'Cacao Daily', youtube: '@cacaodaily', niche: 'קקאו טקסי / בוקר', notes: 'מתחרה ישיר בנישת הקקאו' },
  { id: 'demo-comp-2', name: 'Pure Rituals', youtube: '@purerituals', niche: 'Wellness / self-care', notes: 'אסתטיקה נקייה, קהל בינ״ל' },
  { id: 'demo-comp-3', name: 'שוקולד נקי', youtube: '@cleanchocil', niche: 'שוקולד בריא (IL)', notes: 'קהל ישראלי, טון קליל' },
];

const DEMO_INSPIRATION = [
  demoAsset('insp1', 'רגע של שקט לפני היום', 'Mindful Mornings', 240000,
    'קחו את מבנה "רגע שקט" והמירו לטקס קקאו MOOD — 9:16, אור חם, קריינות בעברית. שנו הוק וטקסט.'),
  demoAsset('insp2', 'ASMR chocolate pour', 'Sweet Sounds', 512000,
    'הפורמט ASMR עובד מצוין. צלמו מזיגת קקאו MOOD בקלוז-אפ, בלי דיבור, עם כיתוב עדין.'),
  demoAsset('insp3', 'Coffee vs Cacao — my honest take', 'The Ritual Guy', 133000,
    'זווית השוואה. עשו גרסה ישראלית "קפה מול קקאו" עם דעה אישית וקריאה לפעולה בסוף.'),
];

export function seedDemoResearch() {
  const now = new Date().toISOString();
  for (const c of DEMO_COMPETITORS) {
    upsertCompetitor({
      ...c,
      platforms: { youtube: c.youtube },
      demo: true,
      addedAt: now,
      recent: c.id === 'demo-comp-1' ? demoCompetitorRecent() : [],
      insight: c.id === 'demo-comp-1' ? demoCompetitorInsight() : null,
      checkedAt: c.id === 'demo-comp-1' ? now : null,
    });
  }
  for (const a of DEMO_INSPIRATION) {
    upsertInspiration({ ...a, id: a.videoId, status: 'saved', savedAt: now });
  }
  return { competitors: listCompetitors(), inspiration: listInspiration() };
}

// Candidate assets returned by "discover" in demo mode (not yet saved).
export function demoDiscover() {
  return [
    demoAsset('disc1', 'Morning cacao ritual that changed my mornings', 'Wellness Wave', 320000,
      'מבנה "לפני/אחרי בוקר". התאימו לטקס MOOD עם קריינות עברית קצרה.'),
    demoAsset('disc2', '15-second healthy hot chocolate', 'Quick Bites', 210000,
      'מתכון מהיר. עשו גרסת MOOD ב-15 שניות עם טקסט מרכיבים על המסך.'),
    demoAsset('disc3', 'Why I quit coffee for cacao', 'Mindful Mia', 176000,
      'זווית מסע אישי. ספרו סיפור אמיתי של לקוח/ה MOOD בטון אותנטי.'),
    demoAsset('disc4', 'קקאו בוקר — הטקס שלי', 'רותם בריא', 88000,
      'קהל ישראלי. הוק בעברית + אסתטיקה נקייה של MOOD.'),
  ];
}

export function clearDemoResearch() {
  for (const c of listCompetitors()) if (c.demo) removeCompetitor(c.id);
  for (const a of listInspiration()) if (a.demo) removeInspiration(a.id);
}

// ---- Demo: Autonomous OS ---------------------------------------------------
// Seeds by actually RUNNING the engine, so the "overnight accomplishments" are
// real outputs of the same code path — including a pending approval decision.

export function seedDemoOS() {
  if (goalStore.list().length) return; // already seeded
  autonomy.setAutonomy('auto');
  autonomy.addGoal({ title: 'הגדלת הכנסות מ-YouTube Shorts', description: 'יותר צפיות והמרות מהערוץ' });
  autonomy.addGoal({ title: 'לחזק נוכחות מול מתחרים בנישת הקקאו', description: 'מחקר, השראה ותוכן' });
  autonomy.addGoal({ title: 'לשפר SEO ונראות בחיפוש', description: 'מילות מפתח ותיאורים' });
  // Advance the org a few cycles → produces done tasks, activity, opportunities,
  // and (from the outward "לפרסם…" task) a pending human decision.
  for (let i = 0; i < 5; i++) autonomy.tick({ force: true });
  return autonomy.snapshot();
}

export function clearDemoOS() {
  resetOS();
}

// The video Run Full Demo should drive through the flow.
export const RUN_TARGET_ID = 'demo-new';

export { updateVideo };
