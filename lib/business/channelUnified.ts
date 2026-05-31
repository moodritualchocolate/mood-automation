/**
 * CHANNEL UNIFIED (pure adapter)
 *
 * The platform historically carries two channel taxonomies:
 *   - `ChannelRef` (channelArchitecture):
 *       'instagram' · 'facebook' · 'tiktok' · 'youtube' · 'website' ·
 *       'email' · 'blog'
 *   - `PublicationChannel` (publicationRegistryMemory):
 *       'instagram-feed' · 'instagram-story' · 'instagram-reels' ·
 *       'tiktok' · 'facebook-feed' · 'facebook-reels' ·
 *       'youtube-shorts' · 'pinterest' · 'website-hero' ·
 *       'newsletter' · 'other'
 *
 * The Reality Hardening audit surfaced both `wk-channel-taxonomy-split`
 * (medium) and `ui-channel-vocab-split` (medium). This module provides
 * a single operator-facing unified taxonomy by treating `ChannelRef`
 * as the parent and `PublicationChannel` as a per-parent format. The
 * existing types remain unchanged; this adapter sits above them.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the adapter never auto-acts
 *   - the existing types are preserved (no removal)
 *   - Human remains final authority
 */

import type { ChannelRef } from './businessGoalModel';
import type { PublicationChannel } from '@lib/publicationRegistryMemory';

// ─── unified channel + format records ────────────────────────

export interface UnifiedChannelFormat {
  /** Operator-facing format id (matches PublicationChannel verbatim). */
  formatId: PublicationChannel;
  /** Operator-facing label. */
  label: string;
}

export interface UnifiedChannel {
  /** Parent channel id (matches ChannelRef verbatim). */
  channelId: ChannelRef;
  /** Operator-facing label. */
  label: string;
  /** Sub-formats (PublicationChannel values) the channel publishes. */
  formats: UnifiedChannelFormat[];
}

// ─── canonical mapping ChannelRef → PublicationChannel[] ─────

const MAPPING: UnifiedChannel[] = [
  {
    channelId: 'instagram', label: 'Instagram',
    formats: [
      { formatId: 'instagram-feed',   label: 'Feed' },
      { formatId: 'instagram-story',  label: 'Story' },
      { formatId: 'instagram-reels',  label: 'Reels' },
    ],
  },
  {
    channelId: 'facebook',  label: 'Facebook',
    formats: [
      { formatId: 'facebook-feed',  label: 'Feed' },
      { formatId: 'facebook-reels', label: 'Reels' },
    ],
  },
  {
    channelId: 'tiktok',    label: 'TikTok',
    formats: [
      { formatId: 'tiktok',         label: 'TikTok' },
    ],
  },
  {
    channelId: 'youtube',   label: 'YouTube',
    formats: [
      { formatId: 'youtube-shorts', label: 'Shorts' },
    ],
  },
  {
    channelId: 'website',   label: 'Website',
    formats: [
      { formatId: 'website-hero',   label: 'Hero' },
    ],
  },
  {
    channelId: 'email',     label: 'Email',
    formats: [
      { formatId: 'newsletter',     label: 'Newsletter' },
    ],
  },
  {
    channelId: 'blog',      label: 'Blog',
    formats: [
      // No dedicated PublicationChannel value — operators publish blog
      // posts as `other` for now. This is the only operator-facing gap.
      { formatId: 'other',          label: 'Blog post (other)' },
    ],
  },
];

export const ALL_UNIFIED_CHANNELS: UnifiedChannel[] = MAPPING;

// ─── pure helpers ────────────────────────────────────────────

/** Resolve the parent channel for a given format. */
export function channelForFormat(format: PublicationChannel): ChannelRef | null {
  for (const c of MAPPING) {
    if (c.formats.some((f) => f.formatId === format)) return c.channelId;
  }
  return null;
}

/** Resolve the default format for a parent channel (first listed). */
export function defaultFormatFor(channelId: ChannelRef): PublicationChannel {
  const c = MAPPING.find((x) => x.channelId === channelId);
  if (!c) throw new Error(`unknown channel: ${channelId}`);
  return c.formats[0].formatId;
}

/** Resolve every format known to a parent channel. */
export function formatsFor(channelId: ChannelRef): UnifiedChannelFormat[] {
  const c = MAPPING.find((x) => x.channelId === channelId);
  return c ? c.formats : [];
}

export interface UnifiedChannelCatalog {
  channels: UnifiedChannel[];
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Unified channel taxonomy is a pure adapter. The adapter NEVER auto-publishes, ' +
  'NEVER calls a third-party platform. The existing ChannelRef and ' +
  'PublicationChannel types are preserved; this is the single operator-facing ' +
  'surface that maps between them. Operator approval required. ' +
  'Human remains final authority.';

export function listUnifiedChannels(): UnifiedChannelCatalog {
  return {
    channels: MAPPING,
    notes: [
      `${MAPPING.length} unified channels`,
      `${MAPPING.reduce((acc, c) => acc + c.formats.length, 0)} formats covered`,
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
