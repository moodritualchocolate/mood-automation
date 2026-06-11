// Live demo mode. Seeds realistic sample videos (no real files, no Claude
// calls, no network) so the full Social Video Review + YouTube flow can be
// shown end-to-end. Demo videos carry `demo: true` and are never published for
// real — "Test Upload" is simulated.

import { APPROVAL_ITEMS } from './config.js';
import { listVideos, getVideo, upsertVideo, updateVideo, removeVideo } from './store.js';

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

// The video Run Full Demo should drive through the flow.
export const RUN_TARGET_ID = 'demo-new';

export { updateVideo };
