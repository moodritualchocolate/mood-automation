// Claude API client for content-based social-video recommendations.
//
// Given key frames extracted from a video (plus its technical metadata), this
// asks Claude to actually look at the footage and return Hebrew recommendations
// in four brand styles. Output is constrained to a JSON schema so the result is
// always valid and directly usable by the UI.
//
// If no ANTHROPIC_API_KEY is configured, callers should fall back to the
// offline heuristic engine — this module throws so that path is explicit.

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

const PLATFORMS = ['Instagram Reels', 'TikTok', 'Facebook Reels', 'YouTube Shorts'];

// One style block: hook, caption, CTA, hashtags, platform, time. Hebrew text,
// hashtags may mix Hebrew and English. additionalProperties:false is required
// by structured outputs.
function styleSchema(description) {
  return {
    type: 'object',
    description,
    properties: {
      hook: { type: 'string', description: 'הוק קצר וקולע לשורה הראשונה, בעברית' },
      caption: { type: 'string', description: 'כיתוב מלא לפוסט, בעברית' },
      cta: { type: 'string', description: 'קריאה לפעולה, בעברית' },
      hashtagsHebrew: {
        type: 'array',
        items: { type: 'string' },
        description: 'האשטגים בעברית (כולל #)',
      },
      hashtagsEnglish: {
        type: 'array',
        items: { type: 'string' },
        description: 'האשטגים באנגלית (כולל #)',
      },
      suggestedPlatform: {
        type: 'string',
        enum: PLATFORMS,
        description: 'הפלטפורמה המתאימה ביותר לסגנון זה',
      },
      suggestedTime: {
        type: 'string',
        description: 'שעת פרסום מומלצת בפורמט HH:MM (שעון ישראל)',
      },
    },
    required: [
      'hook',
      'caption',
      'cta',
      'hashtagsHebrew',
      'hashtagsEnglish',
      'suggestedPlatform',
      'suggestedTime',
    ],
    additionalProperties: false,
  };
}

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    contentAnalysis: {
      type: 'string',
      description: 'תיאור בעברית של מה שמופיע בסרטון בפועל (מבוסס על הפריימים)',
    },
    detectedElements: {
      type: 'array',
      items: { type: 'string' },
      description: 'רשימת אלמנטים שזוהו בסרטון (אובייקטים, אווירה, פעולות) בעברית',
    },
    styles: {
      type: 'object',
      properties: {
        moodBrand: styleSchema('סגנון מותג MOOD — נקי, אותנטי וטקסי'),
        emotional: styleSchema('סגנון רגשי — מתחבר לרגש ולתחושה'),
        funny: styleSchema('סגנון הומור ישראלי — קליל, שנון ומקומי'),
        directResponse: styleSchema('סגנון מכירה ישירה — ממוקד המרה ופעולה'),
      },
      required: ['moodBrand', 'emotional', 'funny', 'directResponse'],
      additionalProperties: false,
    },
  },
  required: ['contentAnalysis', 'detectedElements', 'styles'],
  additionalProperties: false,
};

function buildSystemPrompt() {
  const { brand } = config;
  return [
    `אתה אסטרטג תוכן וקופירייטר מומחה לרשתות חברתיות עבור המותג "${brand.name}".`,
    `הקשר המותג: ${brand.description}`,
    'תפקידך: לצפות בפריימים מתוך סרטון קצר, להבין מה קורה בו בפועל, ולכתוב המלצות תוכן.',
    'חוקים חשובים:',
    '- כל הטקסט חייב להיות בעברית תקנית וזורמת. האשטגים יכולים להיות בעברית ובאנגלית.',
    '- ההמלצות חייבות להתבסס על התוכן האמיתי שרואים בפריימים — לא טקסטים גנריים.',
    '- כל סגנון צריך להרגיש שונה ואותנטי: מותג נקי, רגשי, הומור ישראלי, ומכירה ישירה.',
    '- הוקים קצרים וקולעים (שורה אחת), כיתובים באורך מתאים לרשת, וקריאה לפעולה ברורה.',
    '- בחר לכל סגנון את הפלטפורמה ושעת הפרסום שמתאימות לו ביותר עבור קהל ישראלי.',
  ].join('\n');
}

function buildUserContent(frames, meta, filename) {
  const content = [];

  // Lead with the frames so the model anchors on the actual content.
  for (let i = 0; i < frames.length; i++) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: frames[i].mediaType,
        data: frames[i].base64,
      },
    });
  }

  const metaLines = [
    `שם הקובץ: ${filename}`,
    meta?.durationSec != null ? `אורך: ${Math.round(meta.durationSec)} שניות` : null,
    meta?.width && meta?.height ? `רזולוציה: ${meta.width}x${meta.height}` : null,
    meta?.aspectRatio ? `יחס מסך: ${meta.aspectRatio}` : null,
    meta?.hasAudio != null ? `אודיו: ${meta.hasAudio ? 'יש' : 'אין'}` : null,
  ].filter(Boolean);

  const intro = frames.length
    ? `להלן ${frames.length} פריימים מתוך הסרטון (לפי סדר הזמן). נתח אותם וצור המלצות.`
    : 'לא ניתן היה לחלץ פריימים מהסרטון. בסס את ההמלצות על המטא-דאטה בלבד וציין זאת בניתוח.';

  content.push({
    type: 'text',
    text: [
      intro,
      '',
      'מטא-דאטה טכנית:',
      ...metaLines.map((l) => `- ${l}`),
      '',
      'החזר את ההמלצות במבנה המבוקש: ניתוח תוכן, אלמנטים שזוהו, וארבעה סגנונות (מותג MOOD, רגשי, הומור ישראלי, מכירה ישירה), כל אחד עם הוק, כיתוב, קריאה לפעולה, האשטגים, פלטפורמה מומלצת ושעת פרסום.',
    ].join('\n'),
  });

  return content;
}

function extractJson(message) {
  const textBlock = (message.content || []).find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text block in Claude response');
  return JSON.parse(textBlock.text);
}

export function isConfigured() {
  return !!config.claude.apiKey;
}

// Calls Claude with the frames + metadata and returns the parsed structured
// recommendations object (matching OUTPUT_SCHEMA). Throws on failure so the
// caller can fall back to heuristics.
export async function analyzeWithClaude({ frames, meta, filename }) {
  if (!isConfigured()) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey: config.claude.apiKey });

  const message = await client.messages.create({
    model: config.claude.model,
    max_tokens: config.claude.maxTokens,
    thinking: { type: 'adaptive' },
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserContent(frames, meta, filename) }],
    output_config: { format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
  });

  if (message.stop_reason === 'refusal') {
    throw new Error('Claude refused the request');
  }
  if (message.stop_reason === 'max_tokens') {
    throw new Error('Claude response truncated (max_tokens); increase CLAUDE_MAX_TOKENS');
  }

  const parsed = extractJson(message);
  return {
    parsed,
    model: message.model,
    framesAnalyzed: frames.length,
  };
}
