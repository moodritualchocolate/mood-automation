// Competitor research + similar-asset discovery.
//
// Discovery is "inspiration only": it surfaces public reference content
// (links + metadata) plus AI notes on HOW TO ADAPT ideas for MOOD. It never
// downloads or reposts competitors' copyrighted media.
//
// Uses the YouTube Data API v3 (public search — no user OAuth needed) when
// YT_API_KEY is configured; otherwise runs in demo/heuristic mode so the whole
// flow is visible. All network/AI calls degrade gracefully.

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

const YT = 'https://www.googleapis.com/youtube/v3';

export function isYouTubeConfigured() {
  return !!config.research.youtubeApiKey;
}
export function isClaudeConfigured() {
  return !!config.claude.apiKey;
}

// ---- YouTube Data API ------------------------------------------------------

function ytUrl(path, params) {
  const q = new URLSearchParams({ ...params, key: config.research.youtubeApiKey });
  return `${YT}/${path}?${q.toString()}`;
}

async function ytGet(path, params) {
  const res = await fetch(ytUrl(path, params));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`YouTube ${path} ${res.status}: ${data.error?.message || 'error'}`);
  return data;
}

function normalizeSearchItem(item, statsById = {}) {
  const id = item.id?.videoId || item.id;
  const sn = item.snippet || {};
  const st = statsById[id] || {};
  return {
    source: 'youtube',
    videoId: id,
    title: sn.title || '',
    description: (sn.description || '').slice(0, 200),
    url: `https://www.youtube.com/watch?v=${id}`,
    shortsUrl: `https://www.youtube.com/shorts/${id}`,
    thumbnail: sn.thumbnails?.medium?.url || sn.thumbnails?.default?.url || null,
    channelTitle: sn.channelTitle || '',
    channelId: sn.channelId || '',
    publishedAt: sn.publishedAt || null,
    views: st.viewCount ? Number(st.viewCount) : null,
    likes: st.likeCount ? Number(st.likeCount) : null,
  };
}

async function withStats(items) {
  const ids = items.map((i) => i.videoId).filter(Boolean);
  if (!ids.length) return items;
  try {
    const data = await ytGet('videos', { part: 'statistics', id: ids.join(',') });
    const byId = {};
    for (const v of data.items || []) byId[v.id] = v.statistics || {};
    return items.map((i) => ({ ...i, views: byId[i.videoId]?.viewCount ? Number(byId[i.videoId].viewCount) : i.views, likes: byId[i.videoId]?.likeCount ? Number(byId[i.videoId].likeCount) : i.likes }));
  } catch {
    return items;
  }
}

// Public search for short videos matching a query.
export async function searchYouTube(query, max = 8) {
  const data = await ytGet('search', {
    part: 'snippet',
    q: query,
    type: 'video',
    videoDuration: 'short',
    order: 'relevance',
    maxResults: String(Math.min(max, 15)),
    regionCode: config.research.region,
  });
  const items = (data.items || []).map((i) => normalizeSearchItem(i));
  return withStats(items);
}

// Resolve a channel id from a @handle, channel URL, or raw id.
async function resolveChannelId(ref) {
  if (!ref) return null;
  if (/^UC[\w-]{20,}$/.test(ref)) return ref; // already a channel id
  const handle = ref.replace(/^.*@/, '@').startsWith('@') ? ref.replace(/^.*@/, '@') : `@${ref.replace(/^@/, '')}`;
  try {
    const data = await ytGet('channels', { part: 'id', forHandle: handle });
    if (data.items?.[0]?.id) return data.items[0].id;
  } catch { /* fall through */ }
  // Fallback: search for the channel by name.
  try {
    const data = await ytGet('search', { part: 'snippet', q: ref, type: 'channel', maxResults: '1' });
    return data.items?.[0]?.id?.channelId || data.items?.[0]?.snippet?.channelId || null;
  } catch {
    return null;
  }
}

export async function competitorRecent(channelRef, max = 6) {
  const channelId = await resolveChannelId(channelRef);
  if (!channelId) throw new Error('Channel not found');
  const data = await ytGet('search', {
    part: 'snippet',
    channelId,
    type: 'video',
    order: 'date',
    maxResults: String(Math.min(max, 15)),
  });
  const items = (data.items || []).map((i) => normalizeSearchItem(i));
  return withStats(items);
}

// ---- Claude insight helpers (pluggable) ------------------------------------

async function claudeJson(system, user, schema) {
  const client = new Anthropic({ apiKey: config.claude.apiKey });
  const msg = await client.messages.create({
    model: config.claude.model,
    max_tokens: config.claude.maxTokens,
    thinking: { type: 'adaptive' },
    system,
    messages: [{ role: 'user', content: user }],
    output_config: { format: { type: 'json_schema', schema } },
  });
  const text = (msg.content || []).find((b) => b.type === 'text')?.text || '{}';
  return JSON.parse(text);
}

const BRAND_SYS = `אתה אסטרטג תוכן למותג "${config.brand.name}" (${config.brand.description}). כתוב בעברית תקנית. המטרה: להפיק תובנות ורעיונות מקוריים בהשראת תוכן של אחרים — לא להעתיק. תמיד הצע התאמה לערכי המותג (נקי, טקסי, אותנטי, קהל ישראלי).`;

// Per-asset "how to adapt for MOOD" notes (Hebrew).
export async function adaptNotes(assets) {
  if (!isClaudeConfigured() || !assets.length) {
    return heuristicAdaptNotes(assets);
  }
  try {
    const schema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { videoId: { type: 'string' }, note: { type: 'string' } },
            required: ['videoId', 'note'],
            additionalProperties: false,
          },
        },
      },
      required: ['items'],
      additionalProperties: false,
    };
    const list = assets
      .map((a) => `- ${a.videoId}: "${a.title}" (${a.channelTitle}${a.views ? `, ${a.views} צפיות` : ''})`)
      .join('\n');
    const out = await claudeJson(
      BRAND_SYS,
      `להלן סרטוני רפרנס. לכל אחד כתוב משפט-שניים בעברית: איך לקחת את הרעיון/הפורמט ולהתאים אותו ל-MOOD (מבלי להעתיק).\n${list}`,
      schema,
    );
    const map = {};
    for (const it of out.items || []) map[it.videoId] = it.note;
    return assets.map((a) => ({ ...a, adaptNote: map[a.videoId] || heuristicNote(a) }));
  } catch (err) {
    console.error('[research] adaptNotes Claude failed:', err.message);
    return heuristicAdaptNotes(assets);
  }
}

// Competitor-level insight (Hebrew): what works + ideas we can adapt.
export async function competitorInsight(name, videos) {
  if (!isClaudeConfigured() || !videos.length) {
    return heuristicInsight(name, videos);
  }
  try {
    const schema = {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        whatWorks: { type: 'array', items: { type: 'string' } },
        ideasForMood: { type: 'array', items: { type: 'string' } },
        hooks: { type: 'array', items: { type: 'string' } },
      },
      required: ['summary', 'whatWorks', 'ideasForMood', 'hooks'],
      additionalProperties: false,
    };
    const list = videos.map((v) => `- "${v.title}"${v.views ? ` (${v.views} צפיות)` : ''}`).join('\n');
    return await claudeJson(
      BRAND_SYS,
      `מתחרה: ${name}. להלן סרטונים אחרונים:\n${list}\nנתח בעברית: מה עובד להם, אילו רעיונות אפשר להתאים ל-MOOD (בלי להעתיק), ו-3 הוקים בהשראה.`,
      schema,
    );
  } catch (err) {
    console.error('[research] competitorInsight Claude failed:', err.message);
    return heuristicInsight(name, videos);
  }
}

// ---- Heuristic fallbacks ---------------------------------------------------

function heuristicNote(a) {
  return `רעיון: קחו את הזווית של "${(a.title || '').slice(0, 40)}" ותתאימו לטקס הקקאו של MOOD — צילום אנכי 9:16, אור חם, וקריינות רגועה בעברית. אל תעתיקו — שנו הוק, מיקום וטקסט.`;
}
function heuristicAdaptNotes(assets) {
  return assets.map((a) => ({ ...a, adaptNote: heuristicNote(a) }));
}
function heuristicInsight(name, videos) {
  return {
    summary: `סקירה ראשונית של ${name}: פורמטים קצרים ואנכיים עם הוק חזק בשנייה הראשונה עובדים הכי טוב בנישה.`,
    whatWorks: ['הוק ויזואלי מהיר', 'ASMR/סאונד של הכנה', 'טקסט על המסך בעברית'],
    ideasForMood: [
      'סדרת "טקס בוקר" קצרה עם קקאו MOOD',
      'לפני/אחרי של רגע לחוץ מול רגע רגוע',
      'שיתוף מתכון/טיפ ב-15 שניות',
    ],
    hooks: ['תפסיקו לגלול — זה הטקס שישנה לכם את הבוקר', '3 שניות והבנתי למה כולם מכורים', 'הדבר היחיד שאני עושה כל בוקר'],
  };
}
