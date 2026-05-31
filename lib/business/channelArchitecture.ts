/**
 * CHANNEL ARCHITECTURE (pure, structural)
 *
 * Static specification of supported channels and their structural
 * requirements (asset types · recommended formats · required
 * metadata · approval requirements · measurement categories). The
 * module does NOT integrate with any external API. The operator
 * publishes manually through their own platform credentials.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - no API integrations
 *   - the architecture never auto-publishes, never auto-routes
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { PermissionAction } from '@lib/tenancy/permissionMatrix';
import type {
  AssetTypeRef, ChannelRef, MeasurementCategory,
} from './businessGoalModel';

// ─── format shape ────────────────────────────────────────────

export interface ChannelFormat {
  formatId: string;
  label: string;
  /** Aspect ratio (e.g. "9:16", "1:1", "16:9"). */
  aspectRatio: string;
  /** Duration range for time-based formats. */
  durationSeconds?: { min: number; max: number };
  /** Suggested asset type that fits this format. */
  assetType: AssetTypeRef;
  /** Operator-facing note — allowed phrasing. */
  note: string;
}

// ─── channel shape ───────────────────────────────────────────

export interface ChannelSpec {
  channelId: ChannelRef;
  label: string;
  purpose: string;
  /** Asset types this channel accepts. */
  assetTypes: AssetTypeRef[];
  /** Recommended formats for this channel. */
  recommendedFormats: ChannelFormat[];
  /** Operator-provided metadata required per publication. */
  requiredMetadata: string[];
  /** Approvals expected before publication. */
  approvalRequirements: PermissionAction[];
  /** Measurement categories the operator MAY log against this channel. */
  measurementCategories: MeasurementCategory[];
  /** Observational tags surfaced in the channel picker. */
  observationalTags: string[];
}

// ─── catalog ─────────────────────────────────────────────────

const CHANNELS: ChannelSpec[] = [
  {
    channelId: 'instagram',
    label: 'Instagram',
    purpose:
      'Operator publishes feed posts · stories · reels through their own Instagram credentials.',
    assetTypes: ['image', 'video', 'carousel', 'short-form-clip'],
    recommendedFormats: [
      { formatId: 'ig-feed-image', label: 'Feed Image', aspectRatio: '1:1',
        assetType: 'image', note: 'square feed image' },
      { formatId: 'ig-feed-carousel', label: 'Feed Carousel', aspectRatio: '1:1',
        assetType: 'carousel', note: 'multi-card carousel' },
      { formatId: 'ig-reels', label: 'Reels', aspectRatio: '9:16',
        durationSeconds: { min: 5, max: 90 }, assetType: 'short-form-clip',
        note: 'vertical short-form clip' },
      { formatId: 'ig-story', label: 'Story', aspectRatio: '9:16',
        durationSeconds: { min: 1, max: 15 }, assetType: 'short-form-clip',
        note: 'ephemeral vertical clip' },
    ],
    requiredMetadata: ['caption', 'audienceTag', 'campaignLabel'],
    approvalRequirements: ['workspace.asset.approve', 'workspace.publication.register'],
    measurementCategories: ['reach', 'engagement', 'attention-time', 'click-through'],
    observationalTags: ['feed', 'stories', 'reels'],
  },
  {
    channelId: 'facebook',
    label: 'Facebook',
    purpose:
      'Operator publishes feed posts · reels through their own Facebook credentials.',
    assetTypes: ['image', 'video', 'carousel', 'short-form-clip', 'long-form-post'],
    recommendedFormats: [
      { formatId: 'fb-feed-image', label: 'Feed Image', aspectRatio: '4:5',
        assetType: 'image', note: 'mobile-optimized feed image' },
      { formatId: 'fb-feed-video', label: 'Feed Video', aspectRatio: '4:5',
        durationSeconds: { min: 5, max: 240 }, assetType: 'video', note: 'mobile-first feed video' },
      { formatId: 'fb-reels', label: 'Reels', aspectRatio: '9:16',
        durationSeconds: { min: 5, max: 90 }, assetType: 'short-form-clip',
        note: 'vertical short-form clip' },
    ],
    requiredMetadata: ['caption', 'audienceTag', 'campaignLabel'],
    approvalRequirements: ['workspace.asset.approve', 'workspace.publication.register'],
    measurementCategories: ['reach', 'engagement', 'click-through'],
    observationalTags: ['feed', 'reels'],
  },
  {
    channelId: 'tiktok',
    label: 'TikTok',
    purpose:
      'Operator publishes short-form vertical video through their own TikTok credentials.',
    assetTypes: ['video', 'short-form-clip'],
    recommendedFormats: [
      { formatId: 'tt-vertical-short', label: 'Vertical Short', aspectRatio: '9:16',
        durationSeconds: { min: 5, max: 60 }, assetType: 'short-form-clip',
        note: 'vertical short-form clip' },
      { formatId: 'tt-vertical-long', label: 'Vertical Long', aspectRatio: '9:16',
        durationSeconds: { min: 60, max: 600 }, assetType: 'video',
        note: 'longer vertical clip' },
    ],
    requiredMetadata: ['caption', 'audienceTag', 'campaignLabel', 'hashtagSet'],
    approvalRequirements: ['workspace.asset.approve', 'workspace.publication.register'],
    measurementCategories: ['reach', 'engagement', 'attention-time'],
    observationalTags: ['vertical', 'short-form'],
  },
  {
    channelId: 'youtube',
    label: 'YouTube',
    purpose:
      'Operator publishes long-form video and shorts through their own YouTube credentials.',
    assetTypes: ['video', 'short-form-clip'],
    recommendedFormats: [
      { formatId: 'yt-long', label: 'Long-form Video', aspectRatio: '16:9',
        durationSeconds: { min: 60, max: 3600 }, assetType: 'video',
        note: 'horizontal long-form video' },
      { formatId: 'yt-shorts', label: 'Shorts', aspectRatio: '9:16',
        durationSeconds: { min: 5, max: 60 }, assetType: 'short-form-clip',
        note: 'vertical short-form clip' },
    ],
    requiredMetadata: ['title', 'description', 'audienceTag', 'campaignLabel'],
    approvalRequirements: ['workspace.asset.approve', 'workspace.publication.register'],
    measurementCategories: ['reach', 'engagement', 'attention-time', 'click-through'],
    observationalTags: ['long-form', 'shorts'],
  },
  {
    channelId: 'website',
    label: 'Website',
    purpose:
      'Operator publishes landing pages and on-site assets through their own CMS credentials.',
    assetTypes: ['landing', 'image', 'long-form-post'],
    recommendedFormats: [
      { formatId: 'web-landing', label: 'Landing Page', aspectRatio: 'fluid',
        assetType: 'landing', note: 'lead-capture or sales landing page' },
      { formatId: 'web-hero', label: 'Hero Image', aspectRatio: '16:9',
        assetType: 'image', note: 'desktop hero image' },
    ],
    requiredMetadata: ['url', 'campaignLabel', 'audienceTag'],
    approvalRequirements: ['workspace.asset.approve', 'workspace.publication.register'],
    measurementCategories: ['click-through', 'conversion', 'lead-capture', 'retention'],
    observationalTags: ['landing', 'hero', 'cms'],
  },
  {
    channelId: 'email',
    label: 'Email',
    purpose:
      'Operator sends transactional and broadcast email through their own ESP credentials.',
    assetTypes: ['email', 'image'],
    recommendedFormats: [
      { formatId: 'em-broadcast', label: 'Broadcast', aspectRatio: 'fluid',
        assetType: 'email', note: 'segmented broadcast' },
      { formatId: 'em-lifecycle', label: 'Lifecycle', aspectRatio: 'fluid',
        assetType: 'email', note: 'triggered lifecycle message' },
    ],
    requiredMetadata: ['subjectLine', 'segmentLabel', 'campaignLabel'],
    approvalRequirements: ['workspace.asset.approve', 'workspace.publication.register'],
    measurementCategories: ['click-through', 'conversion', 'retention'],
    observationalTags: ['broadcast', 'lifecycle'],
  },
  {
    channelId: 'blog',
    label: 'Blog',
    purpose:
      'Operator publishes long-form posts through their own CMS credentials.',
    assetTypes: ['long-form-post', 'image'],
    recommendedFormats: [
      { formatId: 'blog-post', label: 'Blog Post', aspectRatio: 'fluid',
        assetType: 'long-form-post', note: 'editorial long-form post' },
    ],
    requiredMetadata: ['title', 'slug', 'campaignLabel', 'audienceTag'],
    approvalRequirements: ['workspace.asset.approve', 'workspace.publication.register'],
    measurementCategories: ['reach', 'attention-time', 'click-through'],
    observationalTags: ['long-form', 'editorial'],
  },
];

export const ALL_CHANNEL_SPECS: ChannelSpec[] = CHANNELS;
export const CHANNEL_IDS: ChannelRef[] = CHANNELS.map((c) => c.channelId);

// ─── pure helpers ────────────────────────────────────────────

export function getChannelSpec(id: ChannelRef): ChannelSpec {
  const c = CHANNELS.find((x) => x.channelId === id);
  if (!c) throw new Error(`unknown channel: ${id}`);
  return c;
}

export interface ChannelArchitectureCatalog {
  channels: ChannelSpec[];
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Channel architecture is a pure structural map. The module declares NO ' +
  'API integrations, NEVER auto-publishes, NEVER calls a third-party platform. ' +
  'Publication remains operator-supervised through the operator’s own ' +
  'platform credentials. Operator approval required. Human remains final authority.';

export function listChannelArchitecture(): ChannelArchitectureCatalog {
  return {
    channels: CHANNELS,
    notes: [
      `${CHANNELS.length} channels specified`,
      'each channel lists asset types · formats · metadata · approvals · measurements',
      'no API integrations · operator publishes manually',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
