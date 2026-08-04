/**
 * MOBILE EXPERIENCE DESCRIPTOR (pure)
 *
 * Mobile-first UX specification. CreativeOS must function primarily
 * on mobile. The descriptor enumerates the patterns the UI shell
 * implements; it never auto-applies a layout, never auto-collapses
 * content.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - the descriptor never auto-acts
 *   - allowed phrasing only
 *   - Human remains final authority
 */

import type { NavigationSection } from './navigation';

// ─── primary mobile patterns ─────────────────────────────────

export interface MobileBottomNavSpec {
  itemCountMax: 5;
  itemHeightPx: 56;
  iconHeightPx: 22;
  labelStyle: 'eyebrow';
  /** Hide bottom nav while a bottom-sheet modal is open. */
  hideWhileBottomSheetOpen: true;
}

export interface FloatingActionSpec {
  /** Diameter of the FAB. */
  sizePx: 56;
  /** Distance from bottom-nav top edge. */
  bottomOffsetPx: 72;
  /** Distance from screen right edge. */
  rightOffsetPx: 16;
  /** FAB action is operator-supervised; the route layer is the gate. */
  alwaysOperatorSupervised: true;
}

export interface MobileCardSpec {
  paddingPx: 16;
  gapBetweenCardsPx: 12;
  borderRadiusPx: 12;
  /** A card always shows a tap target spanning the full card. */
  fullCardTapTarget: true;
  /** Press-and-hold reveals the entity's secondary actions in a sheet. */
  pressAndHoldActionSheet: true;
}

export interface MobileTableSpec {
  /** Mobile transformation strategy. */
  transformation: 'collapse-to-cards';
  /** Horizontal scroll is allowed only for opt-in dense tables. */
  horizontalScroll: 'opt-in-only';
  /** Sticky header on dense tables. */
  stickyHeader: true;
}

export interface MobileApprovalFlowSpec {
  /** Each approval is one mobile card. */
  oneApprovalPerCard: true;
  /** Approve / reject buttons appear in a sticky bottom action bar. */
  stickyActionBar: true;
  /** Operator MUST type operatorReason before approval becomes tappable. */
  requireOperatorReasonBeforeAction: true;
  /** Show a confirmation bottom-sheet for rejections. */
  rejectConfirmationBottomSheet: true;
}

export interface MobileAssetReviewSpec {
  /** Asset preview is full-bleed at the top of the screen. */
  fullBleedPreview: true;
  /** Pinch-to-zoom is enabled (operator inspection). */
  pinchToZoom: true;
  /** Swipe-left = reject, swipe-right = approve — BUT a confirmation
   *  bottom-sheet still appears; the swipe NEVER auto-applies. */
  swipeGestures: { left: 'reject-with-confirmation'; right: 'approve-with-confirmation' };
  /** Operator MUST type operatorReason before the confirmation sheet
   *  becomes tappable. */
  requireOperatorReasonBeforeAction: true;
}

// ─── descriptor ──────────────────────────────────────────────

export interface MobileExperienceDescriptor {
  bottomNav: MobileBottomNavSpec;
  floatingAction: FloatingActionSpec;
  cards: MobileCardSpec;
  tables: MobileTableSpec;
  approvalFlow: MobileApprovalFlowSpec;
  assetReview: MobileAssetReviewSpec;
  /** Mobile bottom-nav sections (passed in from navigation engine). */
  bottomNavSections: NavigationSection[];
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Mobile experience descriptor is a static UX specification. The descriptor ' +
  'never auto-applies a layout, never auto-collapses content, never auto-acts ' +
  'on a swipe gesture without a confirmation sheet. Operator approval ' +
  'required at every mobile action. Human remains final authority.';

export function describeMobileExperience(
  bottomNavSections: NavigationSection[],
): MobileExperienceDescriptor {
  return {
    bottomNav: {
      itemCountMax: 5, itemHeightPx: 56, iconHeightPx: 22, labelStyle: 'eyebrow',
      hideWhileBottomSheetOpen: true,
    },
    floatingAction: {
      sizePx: 56, bottomOffsetPx: 72, rightOffsetPx: 16,
      alwaysOperatorSupervised: true,
    },
    cards: {
      paddingPx: 16, gapBetweenCardsPx: 12, borderRadiusPx: 12,
      fullCardTapTarget: true, pressAndHoldActionSheet: true,
    },
    tables: {
      transformation: 'collapse-to-cards',
      horizontalScroll: 'opt-in-only',
      stickyHeader: true,
    },
    approvalFlow: {
      oneApprovalPerCard: true,
      stickyActionBar: true,
      requireOperatorReasonBeforeAction: true,
      rejectConfirmationBottomSheet: true,
    },
    assetReview: {
      fullBleedPreview: true,
      pinchToZoom: true,
      swipeGestures: { left: 'reject-with-confirmation', right: 'approve-with-confirmation' },
      requireOperatorReasonBeforeAction: true,
    },
    bottomNavSections,
    notes: [
      `${bottomNavSections.length}/5 mobile bottom-nav slots populated`,
      'swipe gestures always require a confirmation bottom-sheet',
      'minimum touch target 44px (descriptor enforced upstream)',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
