/**
 * COMMENT RECOGNITION PARSER (Phase 32 — Audience Reality Feedback / Wave 2)
 *
 * Reads the TEXT of audience comments and separates RECOGNITION
 * ("this is literally me", "why is this so accurate") from
 * PERFORMATIVE reaction ("so aesthetic", "obsessed", "🔥🔥🔥") and
 * trend-driven noise.
 */

import type { BannerEngagement } from './engagementMemory';

export interface CommentRecognitionReading {
  /** 0..10 — how much of the comment field is genuine recognition. */
  recognition_strength: number;
  /** 0..10 — how much is performative reaction. */
  performative_strength: number;
  /** Recognition phrases the audience actually used. */
  recognition_phrases: string[];
  /** True when comments are mostly performative, not recognition. */
  comments_are_performative: boolean;
  /** Comment count parsed. */
  parsed_count: number;
  notes: string[];
}

export interface CommentRecognitionInput {
  engagements: BannerEngagement[];
}

// English + Hebrew recognition markers.
const RECOGNITION_RX = /\b(literally me|this is me|so accurate|why is this so|i felt this|too real|called out|i thought i was the only|this is my life|exactly how|every day)\b|(זה אני|מדויק|הרגשתי|כל יום|בדיוק ככה|חשבתי שאני היחיד)/i;
const PERFORMATIVE_RX = /\b(obsessed|aesthetic|vibes?|iconic|slay|so good|love this|need this|🔥|😍|✨|goals|where to buy)\b|(מושלם|אש|חייבת)/i;

export function readCommentRecognition(input: CommentRecognitionInput): CommentRecognitionReading {
  const { engagements } = input;
  const notes: string[] = [];

  const comments: string[] = [];
  for (const e of engagements) {
    for (const s of e.signals) {
      if (s.kind === 'comment' && typeof s.text === 'string' && s.text.trim().length > 0) {
        comments.push(s.text);
      }
    }
  }

  if (comments.length === 0) {
    return {
      recognition_strength: 0, performative_strength: 0, recognition_phrases: [],
      comments_are_performative: false, parsed_count: 0,
      notes: ['comment recognition: no comment text to parse'],
    };
  }

  let recognitionHits = 0;
  let performativeHits = 0;
  const recognition_phrases: string[] = [];
  for (const c of comments) {
    if (RECOGNITION_RX.test(c)) {
      recognitionHits += 1;
      recognition_phrases.push(c.slice(0, 50));
    }
    if (PERFORMATIVE_RX.test(c)) performativeHits += 1;
  }

  const recognition_strength = round1(Math.min(10, (recognitionHits / comments.length) * 12));
  const performative_strength = round1(Math.min(10, (performativeHits / comments.length) * 12));
  const comments_are_performative = performative_strength > recognition_strength + 2;

  notes.push(`comment recognition: ${recognitionHits}/${comments.length} recognition · ${performativeHits}/${comments.length} performative`);
  if (comments_are_performative) notes.push('comment recognition: the comment field is mostly performative — reaction, not recognition');

  return {
    recognition_strength, performative_strength,
    recognition_phrases: recognition_phrases.slice(0, 5),
    comments_are_performative, parsed_count: comments.length, notes,
  };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
