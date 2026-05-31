/**
 * DESIGN SYSTEM (tokens, pure constants)
 *
 * Pure-data design tokens that the UI layer consumes. The module
 * has no I/O, no side-effects, and emits a deterministic
 * descriptor for the verifier + studio panel.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure
 *   - tokens are operator-facing — allowed phrasing only
 *   - the descriptor never auto-applies a theme
 *   - Human remains final authority
 */

// ─── typography ──────────────────────────────────────────────

export const TYPOGRAPHY = {
  scale: {
    'display-xl': { sizeRem: 3.5,  lineHeight: 1.05, weight: 400, letterSpacing: '-0.02em', family: 'editorial' },
    'display-lg': { sizeRem: 2.75, lineHeight: 1.10, weight: 400, letterSpacing: '-0.02em', family: 'editorial' },
    'display-md': { sizeRem: 2.0,  lineHeight: 1.15, weight: 400, letterSpacing: '-0.02em', family: 'editorial' },
    'headline':   { sizeRem: 1.5,  lineHeight: 1.25, weight: 500, letterSpacing: '-0.01em', family: 'display' },
    'title':      { sizeRem: 1.25, lineHeight: 1.30, weight: 500, letterSpacing: '-0.005em',family: 'display' },
    'body':       { sizeRem: 1.0,  lineHeight: 1.55, weight: 400, letterSpacing: '0',       family: 'display' },
    'body-sm':    { sizeRem: 0.875,lineHeight: 1.55, weight: 400, letterSpacing: '0',       family: 'display' },
    'label':      { sizeRem: 0.75, lineHeight: 1.4,  weight: 500, letterSpacing: '0.04em',  family: 'display' },
    'eyebrow':    { sizeRem: 0.625,lineHeight: 1.4,  weight: 500, letterSpacing: '0.28em',  family: 'display' },
    'mono':       { sizeRem: 0.875,lineHeight: 1.5,  weight: 400, letterSpacing: '0',       family: 'mono' },
  },
  families: {
    editorial: "'EditorialNew', 'Times New Roman', serif",
    display:   "'Helvetica Neue', 'Inter', system-ui, sans-serif",
    hebrew:    "'Heebo', 'Arial Hebrew', 'Arial', sans-serif",
    mono:      "'JetBrains Mono', monospace",
  },
} as const;

// ─── spacing ─────────────────────────────────────────────────
// 4-pt scale; mobile-first defaults
export const SPACING = {
  scale: {
    '0':  '0px',
    '1':  '4px',
    '2':  '8px',
    '3':  '12px',
    '4':  '16px',
    '5':  '20px',
    '6':  '24px',
    '8':  '32px',
    '10': '40px',
    '12': '48px',
    '16': '64px',
    '20': '80px',
  },
  containerPadding: {
    mobile: '16px',
    tablet: '24px',
    desktop: '32px',
  },
  sectionGap: {
    mobile: '32px',
    tablet: '48px',
    desktop: '64px',
  },
} as const;

// ─── colors ──────────────────────────────────────────────────
export const COLORS = {
  ink: { 900: '#0A0A0A', 800: '#111111', 700: '#1A1A1A', 600: '#222222' },
  bone: { 50: '#F7F5F2', 100: '#EFEBE5', 200: '#D8D2C8' },
  signal: { warning: '#FF4D2D', quiet: '#5C5C5C' },
  status: {
    pending:  '#C9A24B',
    approved: '#8AA98A',
    rejected: '#FF4D2D',
    archived: '#6F8196',
    draft:    '#9BB0BD',
    'in-flight': '#8AA98A',
    completed: '#8AA98A',
    failed:    '#FF4D2D',
  },
  background: '#050505',
  surface:    '#0A0A0A',
  surfaceRaised: '#111111',
  hairline:   'rgba(247, 245, 242, 0.12)',
  text:       '#F7F5F2',
  textMuted:  'rgba(247, 245, 242, 0.65)',
  textFaint:  'rgba(247, 245, 242, 0.40)',
} as const;

// ─── cards / surfaces ────────────────────────────────────────
export const CARDS = {
  defaultPadding: SPACING.scale[5],
  mobilePadding: SPACING.scale[4],
  borderRadius: '12px',
  hairlineColor: COLORS.hairline,
  background: COLORS.surface,
  raisedBackground: COLORS.surfaceRaised,
  gap: SPACING.scale[4],
  /** Card variants for the operator UI. */
  variants: {
    'entity':   { padding: SPACING.scale[5], purpose: 'list an entity (asset · campaign · brand)' },
    'metric':   { padding: SPACING.scale[4], purpose: 'show a single observed metric' },
    'action':   { padding: SPACING.scale[6], purpose: 'invite an operator action' },
    'empty':    { padding: SPACING.scale[8], purpose: 'empty state message + operator next step' },
    'approval': { padding: SPACING.scale[5], purpose: 'review row for the approvals queue' },
  },
} as const;

// ─── buttons ─────────────────────────────────────────────────
export const BUTTONS = {
  variants: {
    primary:   { background: COLORS.bone[50], color: COLORS.ink[900], borderColor: COLORS.bone[50] },
    secondary: { background: 'transparent',    color: COLORS.bone[50], borderColor: COLORS.hairline },
    ghost:     { background: 'transparent',    color: COLORS.bone[100], borderColor: 'transparent' },
    danger:    { background: COLORS.signal.warning, color: COLORS.bone[50], borderColor: COLORS.signal.warning },
    disabled:  { background: COLORS.ink[700], color: COLORS.textFaint, borderColor: COLORS.hairline },
  },
  sizes: {
    sm: { paddingX: SPACING.scale[3], paddingY: SPACING.scale[1], fontSizeRem: 0.75 },
    md: { paddingX: SPACING.scale[4], paddingY: SPACING.scale[2], fontSizeRem: 0.875 },
    lg: { paddingX: SPACING.scale[6], paddingY: SPACING.scale[3], fontSizeRem: 1.0 },
  },
  minTouchTargetPx: 44,
  borderRadius: '8px',
} as const;

// ─── statuses ────────────────────────────────────────────────
export const STATUSES = {
  asset: ['pending', 'approved', 'rejected', 'archived'] as const,
  campaign: ['draft', 'in-flight', 'completed', 'archived'] as const,
  brief: ['draft', 'approved', 'rejected'] as const,
  agentRun: ['pending', 'approved', 'rejected', 'archived'] as const,
  generationQueue: ['draft', 'approved', 'submitted', 'completed', 'failed', 'archived'] as const,
  publication: ['draft', 'live', 'archived'] as const,
  task: ['open', 'in-progress', 'blocked', 'closed'] as const,
} as const;

// ─── badges ──────────────────────────────────────────────────
export const BADGES = {
  /** Maps a status to a foreground / background color pair. */
  statusToColors: (status: string): { fg: string; bg: string } => {
    const palette: Record<string, { fg: string; bg: string }> = {
      pending:   { fg: '#C9A24B', bg: 'rgba(201,162,75,0.10)' },
      approved:  { fg: '#8AA98A', bg: 'rgba(138,169,138,0.10)' },
      rejected:  { fg: '#FF4D2D', bg: 'rgba(255,77,45,0.10)' },
      archived:  { fg: '#6F8196', bg: 'rgba(111,129,150,0.10)' },
      draft:     { fg: '#9BB0BD', bg: 'rgba(155,176,189,0.10)' },
      'in-flight': { fg: '#8AA98A', bg: 'rgba(138,169,138,0.10)' },
      completed: { fg: '#8AA98A', bg: 'rgba(138,169,138,0.10)' },
      failed:    { fg: '#FF4D2D', bg: 'rgba(255,77,45,0.10)' },
      submitted: { fg: '#9BB0BD', bg: 'rgba(155,176,189,0.10)' },
      live:      { fg: '#8AA98A', bg: 'rgba(138,169,138,0.10)' },
      open:      { fg: '#C9A24B', bg: 'rgba(201,162,75,0.10)' },
      'in-progress': { fg: '#9BB0BD', bg: 'rgba(155,176,189,0.10)' },
      blocked:   { fg: '#FF4D2D', bg: 'rgba(255,77,45,0.10)' },
      closed:    { fg: '#6F8196', bg: 'rgba(111,129,150,0.10)' },
    };
    return palette[status] ?? { fg: COLORS.textMuted, bg: 'rgba(247,245,242,0.06)' };
  },
} as const;

// ─── tables ──────────────────────────────────────────────────
export const TABLES = {
  rowHeightPx: 56,
  rowMinHeightTouchPx: 64,
  headerHeightPx: 40,
  hairlineColor: COLORS.hairline,
  zebra: false,
  mobileTransformation: 'collapse-to-cards' as const,
} as const;

// ─── forms ───────────────────────────────────────────────────
export const FORMS = {
  fieldHeightPx: 44,
  fieldGap: SPACING.scale[4],
  fieldGroupGap: SPACING.scale[6],
  labelStyle: 'eyebrow',
  validation: {
    inlineErrorColor: COLORS.signal.warning,
    successColor: '#8AA98A',
    helperTextColor: COLORS.textMuted,
  },
  inputBackground: 'transparent',
  inputBorder: COLORS.hairline,
  inputBorderActive: COLORS.bone[50],
} as const;

// ─── modals ──────────────────────────────────────────────────
export const MODALS = {
  desktopMaxWidthPx: 560,
  mobileVariant: 'bottom-sheet' as const,
  bottomSheetHandleHeightPx: 4,
  bottomSheetCornerRadiusPx: 24,
  dismissOnBackdrop: true,
  preventDismissOnPendingOperatorReason: true,
  zIndex: 50,
} as const;

// ─── empty states ────────────────────────────────────────────
export const EMPTY_STATES = {
  variants: {
    'no-entities':  { headline: 'Nothing here yet', tone: 'invitational' },
    'no-permission':{ headline: 'Operator MAY NOT view this section', tone: 'observational' },
    'no-results':   { headline: 'No matches for the current filter', tone: 'observational' },
    'no-history':   { headline: 'No historically observed activity', tone: 'observational' },
  },
  iconHeightPx: 32,
  paddingY: SPACING.scale[12],
} as const;

// ─── loading states ──────────────────────────────────────────
export const LOADING_STATES = {
  /** Skeleton heights mirror the typography scale they replace. */
  skeletonHeightFor: (typographyScale: keyof typeof TYPOGRAPHY.scale): string => {
    const px = Math.round(TYPOGRAPHY.scale[typographyScale].sizeRem * 16);
    return `${px}px`;
  },
  /** Pulse uses the existing .pulse animation (1.6s ease-in-out). */
  animationClass: 'pulse',
  /** Show the skeleton if data is missing after this delay (ms). */
  skeletonAppearAfterMs: 200,
} as const;

// ─── error states ────────────────────────────────────────────
export const ERROR_STATES = {
  /** Operator-facing prefix — allowed phrasing only. */
  prefix: 'Operator review required',
  /** Color used for the inline error block. */
  color: COLORS.signal.warning,
  /** Always include a retry action — empty error states are dead ends. */
  alwaysShowRetry: true,
  alwaysShowBackToSafePlace: true,
} as const;

// ─── descriptor ──────────────────────────────────────────────

export interface DesignSystemDescriptor {
  typography: typeof TYPOGRAPHY;
  spacing: typeof SPACING;
  colors: typeof COLORS;
  cards: typeof CARDS;
  buttons: typeof BUTTONS;
  statuses: typeof STATUSES;
  tables: typeof TABLES;
  forms: typeof FORMS;
  modals: typeof MODALS;
  emptyStates: typeof EMPTY_STATES;
  loadingStates: typeof LOADING_STATES;
  errorStates: typeof ERROR_STATES;
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Design system tokens are static descriptors. The module never auto-applies ' +
  'a theme, never overrides the operator’s reduced-motion preference, never ' +
  'auto-selects a color scheme. Mobile-first defaults are observed; the UI ' +
  'may scale upward. Human remains final authority.';

export function describeDesignSystem(): DesignSystemDescriptor {
  return {
    typography: TYPOGRAPHY,
    spacing: SPACING,
    colors: COLORS,
    cards: CARDS,
    buttons: BUTTONS,
    statuses: STATUSES,
    tables: TABLES,
    forms: FORMS,
    modals: MODALS,
    emptyStates: EMPTY_STATES,
    loadingStates: LOADING_STATES,
    errorStates: ERROR_STATES,
    notes: [
      `${Object.keys(TYPOGRAPHY.scale).length} typography scales`,
      `${Object.keys(SPACING.scale).length} spacing steps`,
      `${Object.keys(CARDS.variants).length} card variants`,
      `${Object.keys(BUTTONS.variants).length} button variants`,
      `${Object.keys(EMPTY_STATES.variants).length} empty-state variants`,
      'mobile-first: container padding starts at 16px',
      'minimum touch target 44px',
      'Human remains final authority',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
