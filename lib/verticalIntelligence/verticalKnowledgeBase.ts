/**
 * VERTICAL INTELLIGENCE · KNOWLEDGE BASE
 *
 * The 10 V1 vertical records. Each record is a fully-formed corpus
 * of pre-written industry-native copy in the vertical's primary
 * locale(s). The generator selects from this corpus rather than
 * substituting operator strings into shared templates — that is the
 * mechanism that fixes the code-switching + template-repetition
 * failures of the prior stub provider.
 *
 * Source: docs/vertical-intelligence-engine.md (sections 3.1-3.10).
 *
 * To add an 11th vertical:
 *   1. encode the record below
 *   2. add the id to VerticalId in types.ts
 *   3. add detection keywords in resolveVerticalContext.ts
 */

import type { VerticalKnowledge, VerticalId } from './types';

// ────────────────────────────────────────────────────────────────
// 1 · REAL ESTATE INVESTMENT
// ────────────────────────────────────────────────────────────────

const REAL_ESTATE: VerticalKnowledge = {
  id: 'real-estate',
  displayName: 'Real Estate Investment',
  supportedLocales: ['he', 'en'],
  audienceArchetypes: [
    { id: 'first-gen-wealthy', label: 'First-Generation Wealthy', demographic: '40-60 · liquid net worth ₪3M+ · 2-3 kids age 10-25', psychographic: 'Saw parents struggle · wants visible assets · legacy over yield' },
    { id: 'near-retirement-planner', label: 'Near-Retirement Planner', demographic: '55-70 · senior professional · downsizing or inheriting', psychographic: 'Wants predictable monthly income · skeptical of brokers' },
    { id: 'second-gen-inheritor', label: 'Second-Generation Inheritor', demographic: '32-48 · just received family wealth', psychographic: 'Wants to protect what their parent built · scared of property management' },
  ],
  customerPains: {
    he: ['פחד מאיבוד הון בגלל מפולת', 'תיק מניות שמתאדה תוך לילה', 'מנהלי נכסים שאי אפשר לסמוך עליהם', 'הפחד שהילדים יירשו נייר ולא משהו אמיתי', 'דאגה ממיסוי על שכירויות לא מדווחות'],
    en: ['Fear of losing wealth in a crash', 'Paper portfolios that evaporate overnight', 'Untrustworthy property managers', 'Heirs inheriting paper assets', 'Tax exposure on undeclared rental income'],
  },
  customerDesires: {
    he: ['הון נראה שאפשר לגעת בו', 'הכנסה חודשית שלא תלויה בשוק', 'להשאיר משהו לדורות הבאים', 'לישון בשקט בלי דאגות מחזורי שוק', 'להיות מי שביסס את המשפחה'],
    en: ['Visible touchable wealth', 'Monthly income independent of the market', 'Something to leave to the next generation', 'Sleeping through market cycles', 'Being the one who built the family base'],
  },
  buyingTriggers: {
    he: ['קבלת ירושה', 'מכירת בית · מזומן בחשבון', 'אקזיט · בונוס · אירוע נזילות', 'בן זוג יוצא לפנסיה', 'ילד מגיע לגיל 18 ומתחיל לשאול על כסף'],
    en: ['Receiving an inheritance', 'House just sold · cash in account', 'Exit · bonus · liquidity event', 'Spouse retired', 'Child turned 18 and started asking about money'],
  },
  purchaseMoments: {
    he: ['יום החתימה על הבניין', 'דוח השכירות הראשון בתיבת הדואר', 'הילד בן 17 רואה את הבניין בפעם הראשונה', 'שיחת ירושה בשולחן שבת', 'פגישת רואה החשבון השנתית'],
    en: ['Signing day on the building', 'The first monthly rent statement arriving', 'A 17-year-old child sees the building for the first time', 'A Shabbat-table inheritance conversation', 'The annual CPA meeting'],
  },
  trustSignals: {
    he: ['22 שנים בנדל"ן ישראלי', 'תיק נכסים פעיל של 240 דירות', '34 משפחות מחזיקות איתנו 5+ שנים', 'דוחות שקופים מדי רבעון', 'אסטרטגיית החזקה ל-30 שנה'],
    en: ['22 years in Israeli real estate', 'Active portfolio of 240 units', '34 families with us for 5+ years', 'Transparent quarterly reports', '30-year hold strategy'],
  },
  proofTypes: ['multi-generational testimonial', 'CPA-attested portfolio report', 'before/after wealth visualization', 'family signing-day documentation'],
  ctaStyles: {
    he: ['בוא נדבר על הבניין הזה.', 'שיחת היכרות · 30 דקות · בלי מחויבות.', 'הזמן שיחה לרבעון הבא.'],
    en: ['Let\'s talk about the building.', 'A 30-minute intro call · no commitment.', 'Book a call for next quarter.'],
  },
  ugcAnglePatterns: ['founder-explainer-loom', 'multi-generational-testimonial', 'paper-vs-real-contrast', 'educational-long-form'],
  bestPerformingAdFormats: ['founder Loom-style explainer 60-180sec', 'multi-generational testimonial', 'before-and-after wealth visualization', 'concrete-vs-paper contrast'],
  vocabulary: {
    required: {
      he: ['נכס', 'דירה', 'בניין', 'נדל"ן', 'שכירות', 'דורות', 'יציבות', 'ירושה', 'תיק נכסים', 'החזקה'],
      en: ['property', 'building', 'real estate', 'rental', 'portfolio', 'generations', 'inheritance', 'long-term'],
    },
    forbidden: {
      he: ['הזדמנות', 'רווח מהיר', 'הכפלת ההון', 'השקעת חלומות', 'הפיכת ההון פי', 'מבצע'],
      en: ['get rich quick', 'opportunity of a lifetime', 'guaranteed returns', 'double your money', 'limited spots'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע שוקולד', 'נוכחות', 'מותר לעצור', 'chocolate', 'cacao', 'presence'],
  },
  emotionalTerritory: {
    he: 'הדבר שעדיין יעמוד פה בעוד 30 שנה.',
    en: 'The thing still standing here in 30 years.',
  },
  oneLiners: [
    { locale: 'he', text: 'בניין אחד עומד יותר מתיק מניות אחד.' },
    { locale: 'he', text: 'הון אמיתי שהילדים שלך יוכלו לגעת בו.' },
    { locale: 'he', text: 'נדל"ן שמדבר בשפה של דורות, לא של רבעונים.' },
    { locale: 'en', text: 'One building outlasts one portfolio.' },
    { locale: 'en', text: 'Real wealth your children can touch.' },
    { locale: 'en', text: 'Property that thinks in generations, not quarters.' },
  ],
  hooks: [
    { family: 'authority', locale: 'he', text: 'אחרי 22 שנים בנדל"ן ישראלי, למדתי דבר אחד על נכסים שמחזיקים.' },
    { family: 'contrast', locale: 'he', text: 'תיק מניות נופל. בניין לא.' },
    { family: 'pain-mirror', locale: 'he', text: 'דאגת לכסף שלך כל החיים. עכשיו אתה דואג שהוא לא יתאדה אחריך.' },
    { family: 'invitation', locale: 'he', text: 'בוא נדבר על הבניין הזה. שיחה אחת · 30 דקות.' },
    { family: 'social-proof', locale: 'he', text: '34 משפחות ישראליות מחזיקות איתנו לפחות 5 שנים.' },
    { family: 'transparency', locale: 'he', text: 'דוחות רבעוניים שקופים. כל שקל. כל דירה. בלי הפתעות.' },
    { family: 'authority', locale: 'he', text: 'אני מנהל תיק של 240 דירות. אני יודע למה אנשים מאבדים נכסים.' },
    { family: 'contrast', locale: 'he', text: 'יש הון שמתאדה ויש הון שעומד. תבחר.' },
    { family: 'curiosity', locale: 'he', text: 'מה הילדים שלך יירשו בעוד 20 שנה — נייר או בניין?' },
    { family: 'permission', locale: 'he', text: 'מותר לא להאמין לבנק. אבל מותר גם לבנות משהו אחר.' },
    { family: 'authority', locale: 'en', text: 'After 22 years in Israeli real estate, I learned one thing about assets that hold.' },
    { family: 'contrast', locale: 'en', text: 'Stock portfolios fall. Buildings don\'t.' },
    { family: 'pain-mirror', locale: 'en', text: 'You worried about your wealth all your life. Now you worry it\'ll evaporate after you.' },
    { family: 'invitation', locale: 'en', text: 'Let\'s talk about the building. One 30-minute call.' },
    { family: 'social-proof', locale: 'en', text: '34 Israeli families have held with us for 5+ years.' },
    { family: 'transparency', locale: 'en', text: 'Quarterly reports. Every shekel. Every unit. No surprises.' },
    { family: 'curiosity', locale: 'en', text: 'What will your children inherit in 20 years — paper or a building?' },
    { family: 'authority', locale: 'en', text: 'I manage a 240-unit portfolio. I know why people lose property.' },
  ],
  ugcScripts: [
    {
      locale: 'he',
      title: 'יום החתימה',
      angle: 'multi-generational-testimonial',
      durationSec: 24,
      script: '[0-5] חתמתי על הבניין השלישי שלי בגיל 51. [5-12] לא נכנסתי לזה בשביל תשואה. נכנסתי בשביל שלילדים שלי יהיה משהו אמיתי. [12-19] עברו 6 שנים. הדירות מושכרות. הדוח מגיע כל חודש. [19-24] זה הסיפור. בלי הבטחות.',
      shotList: ['close on hands holding the deed', 'wide shot of the building exterior', 'documents on a table', 'family-table conversation'],
      cta: 'אם זה מדבר אליך — נדבר.',
    },
    {
      locale: 'he',
      title: 'הירושה האמיתית',
      angle: 'paper-vs-real-contrast',
      durationSec: 22,
      script: '[0-4] אמי הורישה לי תיק מניות. [4-10] תוך שנה הוא הצטמצם בשליש. [10-16] בניתי משם בניין אחד. הוא עדיין שם. [16-22] לילדים שלי אני משאיר את הבניין. לא את הנייר.',
      shotList: ['old family photo', 'paper documents close-up', 'building exterior wide', 'family portrait'],
      cta: 'הזמן שיחת היכרות.',
    },
    {
      locale: 'he',
      title: 'דוח רבעוני',
      angle: 'transparency-process',
      durationSec: 20,
      script: '[0-5] כל רבעון אני שולח דוח. [5-11] כל דירה. כל שכירות. כל הוצאה. [11-16] שום דבר לא מוסתר. אם לא הצלחנו להשכיר, אני אומר את זה. [16-20] ככה בונים אמון לטווח ארוך.',
      shotList: ['monitor showing a quarterly report', 'pen on a printed page', 'handshake', 'phone with a call ending'],
      cta: 'בקש דוגמה לדוח.',
    },
    {
      locale: 'en',
      title: 'The signing day',
      angle: 'multi-generational-testimonial',
      durationSec: 24,
      script: '[0-5] I signed on my third building at 51. [5-12] I didn\'t do this for yield. I did it so my children would inherit something real. [12-19] Six years later, the units are rented. The report arrives every month. [19-24] That\'s the story. No promises.',
      shotList: ['close on hands holding the deed', 'wide exterior of the building', 'documents on a table', 'family conversation'],
      cta: 'If that speaks to you — let\'s talk.',
    },
    {
      locale: 'en',
      title: 'Paper vs real',
      angle: 'paper-vs-real-contrast',
      durationSec: 22,
      script: '[0-4] My mother left me a stock portfolio. [4-10] Within a year, it shrunk by a third. [10-16] I built one building from what was left. It is still standing. [16-22] My children will inherit the building. Not the paper.',
      shotList: ['old family photo', 'paper documents close-up', 'building exterior', 'family portrait'],
      cta: 'Book an intro call.',
    },
  ],
  imageConcepts: [
    { locale: 'he', title: 'יום החתימה', description: 'זוג בני 55 חותמים על מסמך נדל"ן · בניין מאחורי החלון · אור צהריים · הידיים בולטות', renderingNote: 'documentary 50mm · real adults · single window light · no studio backdrop' },
    { locale: 'he', title: 'הבניין בגשם', description: 'בניין מגורים בן 4 קומות · גשם קל · מנורות הדירות דולקות אחת אחר השנייה בערב', renderingNote: 'wide architectural shot · dusk · single warm light source · no people' },
    { locale: 'he', title: 'הדוח על השולחן', description: 'דוח רבעוני מודפס על שולחן עץ · עט · משקפיים מונחים בצד · קפה בכוס זכוכית', renderingNote: 'top-down · single window light · documentary still-life' },
    { locale: 'he', title: 'שיחה עם הילדים', description: 'שולחן שבת · שלושה דורות · הסבא מסביר משהו על נייר · אווירה רגועה', renderingNote: 'documentary 50mm · candlelit · no posed expressions' },
    { locale: 'en', title: 'Signing day', description: 'A couple in their 50s signing real-estate documents · a building visible through the window · midday light · hands prominent', renderingNote: 'documentary 50mm · real adults · single window light · no studio backdrop' },
    { locale: 'en', title: 'Building in rain', description: 'A 4-storey residential building · light rain · apartment lights turning on one by one in the evening', renderingNote: 'wide architectural shot · dusk · warm single light source' },
    { locale: 'en', title: 'Report on the table', description: 'A printed quarterly report on a wood table · pen · glasses set aside · coffee in a glass cup', renderingNote: 'top-down · single window light · documentary still-life' },
  ],
  legalConstraints: ['cannot promise yield', 'cannot use "guaranteed"', 'disclosure requirements per Israeli securities law'],
  regulatorySensitivityWarnings: ['avoid market-timing claims', 'avoid yield-promise language'],
};

// ────────────────────────────────────────────────────────────────
// 2 · ACCOUNTANT
// ────────────────────────────────────────────────────────────────

const ACCOUNTANT: VerticalKnowledge = {
  id: 'accountant',
  displayName: 'Accountant · Small Business',
  supportedLocales: ['he', 'en'],
  audienceArchetypes: [
    { id: 'solo-founder', label: 'Solo founder · pre-team', demographic: '28-45 · revenue ₪200K-1M · עוסק מורשה או חברה בע"מ', psychographic: 'Finance-illiterate but smart · just had their first 6-figure month and panicking' },
    { id: 'scaling-smb', label: 'Scaling SMB', demographic: '32-55 · revenue ₪1M-15M · 3-30 employees', psychographic: 'Has a bookkeeper · realizes they need real strategic CPA · pre-investor or pre-exit' },
  ],
  customerPains: {
    he: ['פחד מביקורת מס הכנסה', 'דדליין מוחמץ וקנס', 'ספרים גרועים בבדיקת נאותות', 'רואה חשבון לא מקצועי שמחמיר את הנזק', 'לא יודע אם המספרים נכונים'],
    en: ['Fear of a tax-authority audit', 'Missed filing deadline and penalty', 'Bad books surfacing in investor due-diligence', 'An incompetent accountant making it worse', 'Not knowing if your numbers are right'],
  },
  customerDesires: {
    he: ['ספרים נקיים שאפשר להראות לכל בנקאי', 'שינה רגועה במרץ', 'להיות עסק רציני, לא תחביב', 'רואה חשבון שמתקשר בנובמבר עם הזדמנויות סוף שנה', 'לשמוע "אתה עושה את זה נכון"'],
    en: ['Clean books any banker can see', 'Sleeping in March', 'Being a real business, not a hobby', 'An accountant who calls you in November', 'Hearing "you\'re doing this right"'],
  },
  buyingTriggers: {
    he: ['מכתב ממס הכנסה', 'רואה החשבון הקודם עזב או היה לא מקצועי', 'מחזור שנתי חצה את הרף החוקי', 'גיוס משקיע · חדר נתונים נדרש', 'אירוע חיים שהפך את המיסוי למורכב'],
    en: ['A letter from the tax authority', 'Previous accountant left or was incompetent', 'Annual revenue crossed a reporting threshold', 'Raising investment · data room needed', 'Life event that complicated tax'],
  },
  purchaseMoments: {
    he: ['פאניקת מרץ · השלמת דוחות שנתיים', 'בדיקת נאותות לקראת משקיע', 'שיחת סוף שנה בנובמבר', 'הקמת עובד ראשון · תלוש משכורת ראשון', 'דיווח רבעוני של מע"מ'],
    en: ['March panic · annual filings', 'Pre-investor due-diligence', 'November year-end review call', 'First-employee setup · first payslip', 'Quarterly VAT filing'],
  },
  trustSignals: {
    he: ['רואה חשבון מוסמך 18 שנה', '400 תיקים פעילים', 'אחוז ביקורת מוצלחת 100%', 'מחיר חודשי שקוף · בלי הפתעות', 'זמינות בוואטסאפ בתוך שעה'],
    en: ['Certified CPA · 18 years', '400 active accounts', '100% successful audit defenses', 'Transparent monthly pricing', 'WhatsApp response within an hour'],
  },
  proofTypes: ['numbers-focused client testimonial', 'audit-defense letter', 'before-after books screenshots', 'CPA certification photo'],
  ctaStyles: {
    he: ['קבע שיחת היכרות · 20 דקות.', 'שלח לי את הספרים שלך · אני אבדוק.', 'הזמן ביקורת חינם של המצב הקיים.'],
    en: ['Book a 20-minute intro call.', 'Send your books · I\'ll review.', 'Book a free situation audit.'],
  },
  ugcAnglePatterns: ['pain-mirror-checklist', 'founder-explainer-loom', 'numbers-saved-testimonial', 'warning-style-hook'],
  bestPerformingAdFormats: ['pain-mirror educational post', 'founder Loom explainer 90-180sec', 'numbers-focused client testimonial', 'checklist content', 'warning-style hook'],
  vocabulary: {
    required: {
      he: ['מס', 'חשבונאות', 'חשבונית', 'דיווח', 'מאזן', 'מס הכנסה', 'מע"מ', 'עוסק מורשה', 'חברה בע"מ', 'דוח שנתי', 'רואה חשבון', 'הוצאות'],
      en: ['tax', 'bookkeeping', 'accounting', 'audit', 'filing', 'CPA', 'invoice', 'deductions', 'P&L', 'balance sheet'],
    },
    forbidden: {
      he: ['קסם', 'מהפכה', 'חיסכון מטורף', 'בלי לעבוד', 'חינם'],
      en: ['tax magic', 'never pay taxes again', 'crazy savings', 'no work required', 'free forever'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור', 'chocolate', 'cacao', 'presence', 'mood'],
  },
  emotionalTerritory: {
    he: 'בלי פחד ממס הכנסה במרץ.',
    en: 'No fear of the tax authority in March.',
  },
  oneLiners: [
    { locale: 'he', text: 'רואה חשבון שמתקשר אליך בנובמבר. לא רק במרץ.' },
    { locale: 'he', text: 'ספרים שקופים שאפשר להראות לכל משקיע.' },
    { locale: 'he', text: 'מס הכנסה כבר לא צריך להפחיד אותך.' },
    { locale: 'en', text: 'A CPA who calls you in November. Not just in March.' },
    { locale: 'en', text: 'Clean books any investor can see.' },
    { locale: 'en', text: 'The tax authority doesn\'t need to scare you anymore.' },
  ],
  hooks: [
    { family: 'warning', locale: 'he', text: 'אם הספרים שלך נראים ככה, יש לך עד יוני לפני שמס הכנסה מתקשר.' },
    { family: 'checklist', locale: 'he', text: '7 הוצאות שעוסקים מורשים שוכחים לדווח כל שנה.' },
    { family: 'pain-mirror', locale: 'he', text: 'אתה לא לבד. רוב היזמים לא יודעים מה לעשות במרץ.' },
    { family: 'authority', locale: 'he', text: 'רואה חשבון 18 שנה. 400 תיקים. הנה מה שאני יודע על דיווח שנתי נכון.' },
    { family: 'transparency', locale: 'he', text: '₪1,800 לחודש. כל המיסים. כל הדיווחים. הכל כלול.' },
    { family: 'warning', locale: 'he', text: 'מע"מ של רבעון שעבר עוד לא הוגש? אתה כבר בקנס.' },
    { family: 'authority', locale: 'he', text: 'אחרי 400 דוחות שנתיים, אני יודע איפה מס הכנסה מסתכל.' },
    { family: 'pain-mirror', locale: 'he', text: 'בכל מרץ אתה אומר "הפעם אטפל בזה מוקדם". בכל מרץ אתה לא.' },
    { family: 'checklist', locale: 'he', text: '5 דברים שצריך לסיים עד 31 בדצמבר. כל שנה.' },
    { family: 'transparency', locale: 'he', text: 'מחיר אחד. בלי "הוספות". בלי הפתעות בחשבונית של דצמבר.' },
    { family: 'warning', locale: 'en', text: 'If your books look like this, you have until June before the audit hits.' },
    { family: 'checklist', locale: 'en', text: '7 deductions solo founders forget every single year.' },
    { family: 'pain-mirror', locale: 'en', text: 'You\'re not alone. Most founders don\'t know what to do in tax season.' },
    { family: 'authority', locale: 'en', text: 'A CPA for 18 years. 400 active books. Here\'s what I know about clean filings.' },
    { family: 'transparency', locale: 'en', text: '$450 a month. All filings. All taxes. No surprises.' },
    { family: 'checklist', locale: 'en', text: '5 things you need to close before December 31. Every year.' },
    { family: 'authority', locale: 'en', text: 'After 400 annual filings, I know where auditors look first.' },
  ],
  ugcScripts: [
    {
      locale: 'he',
      title: 'מכתב ממס הכנסה',
      angle: 'pain-mirror-checklist',
      durationSec: 22,
      script: '[0-4] קיבלתי מכתב ממס הכנסה לפני 8 חודשים. [4-10] הספרים שלי היו עם הבן דוד של אבא שלי. הוא לא רואה חשבון. [10-16] רואה חשבון שלי עכשיו לקח שבועיים לסדר הכל. [16-22] עכשיו אני מקבל דוח כל חודש. ישנה במרץ.',
      shotList: ['envelope from the tax authority', 'messy paperwork close-up', 'screen with a clean accounting report', 'person sleeping calmly'],
      cta: 'אל תחכה למכתב. תקבע פגישה.',
    },
    {
      locale: 'he',
      title: 'דוח שנתי בלי פאניקה',
      angle: 'numbers-saved-testimonial',
      durationSec: 24,
      script: '[0-5] הדוח השנתי שלי מ-2023 לקח לי שלושה חודשים של עצבים. [5-12] השנה רואה החשבון התקשר ב-15 בנובמבר ואמר: "כל הנייר מסודר, נחתום בעוד שבועיים". [12-18] חתמתי על הדוח ב-3 בדצמבר. במרץ הייתי בחו"ל. [18-24] זה ההבדל בין רואה חשבון לבין מישהו שכתוב לו רואה חשבון בכרטיס ביקור.',
      shotList: ['stressed face at a laptop', 'calendar with November date circled', 'beach photo · person relaxed', 'business card on a desk'],
      cta: 'תשלח לי את הספרים שלך · אני אבדוק.',
    },
    {
      locale: 'he',
      title: 'מע"מ ברבעון השלישי',
      angle: 'warning-style-hook',
      durationSec: 18,
      script: '[0-4] רבעון שלישי. דיווח מע"מ. הדדליין הוא 15 לחודש. [4-10] אם אתה לא ידעת — אתה כבר באיחור. [10-15] הקנס מתחיל מ-₪500 ועולה. [15-18] בוא נסדר את זה השבוע.',
      shotList: ['calendar with the 15th circled', 'phone showing a missed deadline notice', 'WhatsApp conversation', 'close on a CPA stamping a document'],
      cta: 'תשלח הודעה. נסיים את הרבעון נקי.',
    },
    {
      locale: 'en',
      title: 'The audit letter',
      angle: 'pain-mirror-checklist',
      durationSec: 22,
      script: '[0-4] I got an audit letter 8 months ago. [4-10] My books were with my dad\'s cousin. He\'s not a CPA. [10-16] My current CPA took two weeks to clean it up. [16-22] Now I get a report every month. I sleep through March.',
      shotList: ['envelope from the tax authority', 'messy paperwork close-up', 'screen with a clean accounting report', 'person sleeping calmly'],
      cta: 'Don\'t wait for the letter. Book a call.',
    },
    {
      locale: 'en',
      title: 'A year-end without panic',
      angle: 'numbers-saved-testimonial',
      durationSec: 24,
      script: '[0-5] My 2023 return took me three months of stress. [5-12] This year my CPA called November 15 and said: "Everything is filed, we\'ll sign in two weeks". [12-18] I signed on December 3. In March I was on vacation. [18-24] That\'s the difference between a CPA and someone whose business card says CPA.',
      shotList: ['stressed face at a laptop', 'calendar with November highlighted', 'beach photo · person relaxed', 'business card on a desk'],
      cta: 'Send your books · I\'ll review.',
    },
  ],
  imageConcepts: [
    { locale: 'he', title: 'הספרים הנקיים', description: 'שולחן עבודה · מסך מחשב מציג גיליון מאזן נקי · תיק חשבונאות פתוח · קפה שחור', renderingNote: 'top-down · single window light · documentary still-life · no studio props' },
    { locale: 'he', title: 'רואה החשבון במשרד', description: 'רואה חשבון בן 45 יושב מול לקוח · מסמכים על השולחן · אווירה רגועה · אור טבעי מהחלון', renderingNote: 'documentary 50mm · real professional · no posed expressions · office daylight' },
    { locale: 'he', title: 'מרץ שקט', description: 'אדם 38 יושב על הספה עם ספר · יומן מרץ פתוח על השולחן · אין מתח · אור צהריים', renderingNote: 'editorial wide · single light source · documentary feel · no theatrics' },
    { locale: 'he', title: 'הדוח החודשי', description: 'דוח חודשי מודפס · עט · משקפי קריאה · יד אוחזת בפינת הדף', renderingNote: 'macro on document · single window light · no clutter' },
    { locale: 'en', title: 'Clean books', description: 'A desk · screen showing a clean balance sheet · open accounting binder · black coffee', renderingNote: 'top-down · single window light · documentary still-life · no studio props' },
    { locale: 'en', title: 'The accountant in the office', description: 'A 45-year-old CPA sits across from a client · documents on the table · calm atmosphere · natural window light', renderingNote: 'documentary 50mm · real professional · no posed expressions' },
    { locale: 'en', title: 'A quiet March', description: 'A 38-year-old on a couch with a book · open March calendar on the table · no stress · midday light', renderingNote: 'editorial wide · single light source · documentary feel' },
  ],
  legalConstraints: ['cannot promise tax savings', 'cannot guarantee audit outcomes', 'must disclose certification status'],
  regulatorySensitivityWarnings: ['avoid "never pay tax" promises', 'avoid offering investment advice'],
};

// ────────────────────────────────────────────────────────────────
// 3 · LAWYER · FAMILY LAW
// ────────────────────────────────────────────────────────────────

const LAWYER: VerticalKnowledge = {
  id: 'lawyer',
  displayName: 'Lawyer · Family Law',
  supportedLocales: ['he', 'en'],
  audienceArchetypes: [
    { id: 'divorcing-mediation', label: 'Divorcing parent · prefers mediation', demographic: '35-55 · married 8-22 years · 1-3 kids', psychographic: 'Wants minimal harm to children · fears financial destruction' },
    { id: 'spouse-served', label: 'Spouse who was served', demographic: '32-58 · partly in shock · partly relieved', psychographic: 'Wants competent representation fast · scared of looking weak' },
    { id: 'prenup', label: 'Pre-marriage pre-nup', demographic: '28-45 · significant assets · wedding within 12 months', psychographic: 'Wants protection without insulting the partner' },
  ],
  customerPains: {
    he: ['פחד לאבד משמורת על הילדים', 'פחד לאבד את הבית', 'פחד מהרס כלכלי', 'פחד מהשפלה פומבית', 'פחד שהאקס יקח עורך דין יותר אגרסיבי', 'פחד שהילדים לא יתאוששו'],
    en: ['Fear of losing custody', 'Fear of losing the home', 'Fear of financial destruction', 'Fear of public humiliation', 'Fear the ex will hire a more aggressive lawyer', 'Fear the children won\'t recover'],
  },
  customerDesires: {
    he: ['לשמור על הילדים שלמים', 'לשמור על הבית או הסכם הוגן', 'לצאת בכבוד', 'להפסיק את הדימום הרגשי והכלכלי', 'להיות הורה טוב גם דרך זה'],
    en: ['Keep the children whole', 'Keep the home or a fair settlement', 'Come out with dignity', 'Stop the emotional + financial bleeding', 'Be a good parent through this'],
  },
  buyingTriggers: {
    he: ['קבלת תביעת גירושין', 'בן זוג חשף בגידה', 'הפגישה השלישית עם המטפלת קרסה', 'חשד שמסתירים נכסים', 'הילד ביקש שיפסיקו לריב', 'אחד מבני הזוג עזב את חדר השינה'],
    en: ['Being served divorce papers', 'Spouse just confessed an affair', 'Third therapy session collapsed', 'Realizing assets are being hidden', 'A child explicitly asked them to make it stop', 'One spouse moved out'],
  },
  purchaseMoments: {
    he: ['פגישה ראשונה · אנונימית · 60 דקות', 'היום שאחרי קבלת המכתב', 'השבוע לפני שמספרים לילדים', 'חתימת הסכם גישור', 'הקריסה של גישור והכניסה לבית הדין', 'שיחת הסכם ממון לפני חתונה'],
    en: ['First consultation · anonymous · 60 minutes', 'The day after the letter arrived', 'The week before telling the children', 'Signing the mediation agreement', 'Mediation collapsed · entering court', 'Pre-nup conversation before a wedding'],
  },
  trustSignals: {
    he: ['14 שנה בייצוג בגישור גירושין', 'יותר מ-300 הסכמים חתומים', 'חברה בלשכת עורכי הדין', 'התמחות במשמורת משותפת', 'ייעוץ ראשון 1:1 · בלי מחויבות'],
    en: ['14 years in divorce mediation', 'Over 300 signed agreements', 'Bar Association member', 'Specialization in shared custody', 'First consult 1:1 · no commitment'],
  },
  proofTypes: ['anonymous audio testimonial', 'process-transparency post', 'long-form educational thread', 'mediation success rate report'],
  ctaStyles: {
    he: ['פגישה ראשונה · 60 דקות · אנונימית.', 'שלח הודעה דיסקרטית. לא חייב להיות מוכן.', 'בוא נדבר על האפשרויות שלך.'],
    en: ['First meeting · 60 minutes · anonymous.', 'Send a discreet message. You don\'t have to be ready.', 'Let\'s talk about your options.'],
  },
  ugcAnglePatterns: ['empathy-first-founder', 'educational-explainer', 'anonymous-testimonial', 'process-transparency'],
  bestPerformingAdFormats: ['empathy-first founder video', 'educational explainer · trust-building', 'anonymous client testimonial', 'long-form thread', 'process-transparency post'],
  vocabulary: {
    required: {
      he: ['גירושין', 'גישור', 'ילדים', 'משמורת', 'הסכם', 'זכויות', 'בית דין', 'רכוש משותף', 'מזונות', 'משפחה', 'עורך דין', 'דין משפחה'],
      en: ['divorce', 'mediation', 'children', 'custody', 'settlement', 'rights', 'family court', 'shared property', 'support', 'family law', 'attorney'],
    },
    forbidden: {
      he: ['קל', 'מהיר', 'כיף', 'זול', 'לבד', 'בלי כאב'],
      en: ['easy divorce', 'quick divorce', 'fun', 'cheap', 'do it yourself', 'pain-free'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור', 'chocolate', 'cacao', 'presence', 'mood', 'wellness', 'healing', 'detox', 'mindfulness'],
  },
  emotionalTerritory: {
    he: 'להגן על מה שעדיין חשוב.',
    en: 'Protect what still matters.',
  },
  oneLiners: [
    { locale: 'he', text: 'גירושין שלא מוחקים את מה שבניתם.' },
    { locale: 'he', text: 'הילדים זוכרים איך זה טופל. לא איך זה התחיל.' },
    { locale: 'he', text: 'ייצוג שמגן בלי להבעיר.' },
    { locale: 'en', text: 'Divorce that doesn\'t erase what you built.' },
    { locale: 'en', text: 'The children will remember how it was handled.' },
    { locale: 'en', text: 'Representation that protects without escalating.' },
  ],
  hooks: [
    { family: 'empathy', locale: 'he', text: 'אם את קוראת את זה, כבר החלטת על גירושין. עכשיו השאלה היא איך.' },
    { family: 'authority', locale: 'he', text: 'אחרי 14 שנה בייצוג בגישור גירושין, למדתי דבר אחד.' },
    { family: 'child-focused', locale: 'he', text: 'הילדים זוכרים איך הגירושין טופלו. זה כל מה שחשוב.' },
    { family: 'permission', locale: 'he', text: 'מותר לך להחליט שהמשפחה הזו צריכה הסכם חדש. גירושין בכבוד אפשרי.' },
    { family: 'transparency', locale: 'he', text: 'הפגישה הראשונה אצלי נמשכת שעה. אני אומרת לך אם אני יכולה לעזור עם הגירושין שלך.' },
    { family: 'empathy', locale: 'he', text: 'את לא צריכה להיות מוכנה. רק לקבוע פגישת ייעוץ על גירושין.' },
    { family: 'child-focused', locale: 'he', text: 'הסכם משמורת שמגן על הילדים מהריב, לא רק מהפרידה.' },
    { family: 'authority', locale: 'he', text: 'יותר מ-300 הסכמי גישור חתומים. אני יודע איפה הסכמים נשברים.' },
    { family: 'transparency', locale: 'he', text: 'המחיר ידוע מהפגישה הראשונה. בלי הפתעות בית דין.' },
    { family: 'permission', locale: 'he', text: 'מותר לך לא לדעת מה לעשות עם הגירושין שלך עכשיו. הפגישה הראשונה לא מחייבת אותך.' },
    { family: 'empathy', locale: 'en', text: 'If you\'re reading this, you\'ve already decided. The question is how.' },
    { family: 'authority', locale: 'en', text: 'After 14 years representing divorcing parents, I learned one thing.' },
    { family: 'child-focused', locale: 'en', text: 'The children will remember how it was handled. That\'s what matters.' },
    { family: 'permission', locale: 'en', text: 'You\'re allowed to decide it\'s over. That doesn\'t make you the villain.' },
    { family: 'transparency', locale: 'en', text: 'My first consult is one hour. I tell you if I can help.' },
    { family: 'authority', locale: 'en', text: 'Over 300 signed mediation agreements. I know where settlements break.' },
    { family: 'child-focused', locale: 'en', text: 'A custody agreement that protects children from the fight, not just the divorce.' },
  ],
  ugcScripts: [
    {
      locale: 'he',
      title: 'הפגישה הראשונה',
      angle: 'empathy-first-founder',
      durationSec: 26,
      script: '[0-5] רוב האנשים שמגיעים אליי לא יודעים אם הם רוצים להתגרש. [5-12] חלקם רק רוצים לדעת מה האפשרויות. [12-18] הפגישה הראשונה אצלי היא לא מכירה. היא 60 דקות שבסופן אני אומר לך אם אני יכול לעזור. [18-26] לפעמים אני אומר "לא". כי לא כל מקרה צריך עורך דין משלי.',
      shotList: ['office wide shot', 'attorney at desk', 'phone with a calendar', 'documents being closed'],
      cta: 'קבעי פגישה. לא חייבת להחליט עכשיו.',
    },
    {
      locale: 'he',
      title: 'איך מספרים לילדים',
      angle: 'educational-explainer',
      durationSec: 28,
      script: '[0-5] לקוחה שלי שאלה אותי איך לספר לילדים. [5-12] אמרתי לה — אני איתך. אבל לא היום. [12-19] עברנו על הניסוח. עברנו על מי נוכח. עברנו על השעה ביום. [19-28] שבוע אחר כך היא חזרה. אמרה שהילדים שאלו, אבל לא בכו. זה הסטנדרט.',
      shotList: ['family photo on a desk', 'attorney and client across a table', 'children silhouettes through a window', 'closing door of an office'],
      cta: 'נדבר על הסיטואציה שלך.',
    },
    {
      locale: 'he',
      title: 'גישור או בית דין',
      angle: 'process-transparency',
      durationSec: 24,
      script: '[0-4] אנשים שואלים אותי — גישור או בית דין? [4-10] אני עונה — תלוי בבן הזוג שלך. [10-16] גישור עובד כאשר שניכם רוצים פתרון. [16-21] בית דין הוא כשהוא חייב להיות שם. [21-24] בשתי הדרכים אני מלווה.',
      shotList: ['attorney at a window', 'two paths drawn on paper', 'gavel close-up', 'handshake on an agreement'],
      cta: 'נדבר על הדרך שלך.',
    },
    {
      locale: 'en',
      title: 'The first consultation',
      angle: 'empathy-first-founder',
      durationSec: 26,
      script: '[0-5] Most people who come to me don\'t know if they want to divorce. [5-12] Some just want to know their options. [12-18] My first consult isn\'t a sales call. It\'s 60 minutes where I tell you if I can help. [18-26] Sometimes I say no. Not every case needs my representation.',
      shotList: ['office wide shot', 'attorney at desk', 'phone with a calendar', 'documents being closed'],
      cta: 'Book a meeting. You don\'t have to decide now.',
    },
    {
      locale: 'en',
      title: 'How to tell the kids',
      angle: 'educational-explainer',
      durationSec: 28,
      script: '[0-5] A client asked me how to tell her children. [5-12] I said — not alone. And not today. [12-19] We worked on the wording. We worked on who was present. We worked on the time of day. [19-28] A week later she came back. The children asked questions. They didn\'t cry. That\'s the standard.',
      shotList: ['family photo on a desk', 'attorney and client across a table', 'children silhouettes through a window', 'closing door of an office'],
      cta: 'Let\'s talk about your situation.',
    },
  ],
  imageConcepts: [
    { locale: 'he', title: 'משרד שקט', description: 'משרד עורך דין · שני כיסאות מול שולחן עץ · ספרי חוק על מדף · אור צהריים מהחלון · אין אנשים בפריים', renderingNote: 'documentary architecture · single window light · no posed shots' },
    { locale: 'he', title: 'הפגישה השקטה', description: 'עורכת דין 42 יושבת מול לקוחה · אווירה מכובדת · ידיים על השולחן · קפה לא נגוע', renderingNote: 'documentary 50mm · real professional · no theatre · office daylight' },
    { locale: 'he', title: 'תיק על השולחן', description: 'תיק עור · מסמך חתום עם חותמת · עט פרקר · מסגרת תמונה משפחתית בפינת השולחן', renderingNote: 'top-down · single warm light · documentary still-life' },
    { locale: 'en', title: 'A quiet office', description: 'A family-law office · two chairs in front of a wood desk · law books on the shelf · midday light through the window · no people in frame', renderingNote: 'documentary architecture · single window light · no posed shots' },
    { locale: 'en', title: 'The quiet meeting', description: 'A 42-year-old attorney across the desk from a client · respectful atmosphere · hands on the table · untouched coffee', renderingNote: 'documentary 50mm · real professional · no theatre' },
    { locale: 'en', title: 'A folder on the table', description: 'A leather folder · a signed and stamped document · a Parker pen · a family photo at the edge of the desk', renderingNote: 'top-down · single warm light · documentary still-life' },
  ],
  legalConstraints: ['cannot guarantee outcomes', 'cannot promise custody', 'must use careful language about ongoing cases', 'advertising regulations per Israeli Bar Association'],
  regulatorySensitivityWarnings: ['never say "easy/quick" divorce', 'never compare adversarial lawyers in copy', 'never disclose client details'],
};

// ────────────────────────────────────────────────────────────────
// 4 · FITNESS · RUNNING (Returning Runners)
// ────────────────────────────────────────────────────────────────

const FITNESS: VerticalKnowledge = {
  id: 'fitness',
  displayName: 'Fitness · Returning Runners',
  supportedLocales: ['en', 'he'],
  audienceArchetypes: [
    { id: 'post-kids-comeback', label: 'Post-kids comeback runner', demographic: '32-45 · 1-3 kids · ran in their 20s/30s · 2-5 year break', psychographic: 'Wants identity back · scared of injury · embarrassed of slowness' },
    { id: 'post-injury-comeback', label: 'Post-injury return', demographic: '28-50 · serious injury 1-3 years ago · cleared by PT', psychographic: 'Wants to run smart · trusts gradual buildup' },
    { id: '40-plus-restart', label: '40+ restart', demographic: '40-55 · never serious but feels they need to be · birthday-triggered', psychographic: 'Conservative on time investment · wants the simplest plan' },
  ],
  customerPains: {
    he: ['פחד מפציעה · במיוחד בברך', 'פחד להיראות איטי בפומבי', 'פחד להיות זקן מדי לזה', 'פחד לאכזב את עצמך שוב', 'פחד שהילדים יראו אותך מוותר'],
    en: ['Fear of injury · especially the knee', 'Fear of being publicly slow', 'Fear of being too old to start', 'Fear of letting yourself down again', 'Fear the kids will see you quit'],
  },
  customerDesires: {
    he: ['להרגיש שוב כמו עצמך', 'לגמור מירוץ', 'לא להיות עייף', 'להיות נוכח בגוף שלך', 'לצאת לרוץ בלי לחשוב'],
    en: ['Feel like yourself again', 'Finish a race', 'Not be tired', 'Be present in your body', 'Lace up without thinking'],
  },
  buyingTriggers: {
    he: ['יום הולדת עם 0 או 5', 'בדיקה רפואית עם חדשות לא טובות', 'חבר רץ מרתון', 'תמונה של עצמך שלא זיהית', 'הילד אמר "פעם היית מהיר"'],
    en: ['A birthday with a 0 or 5', 'A bad medical checkup', 'A friend just ran a marathon', 'A photo of yourself you didn\'t recognize', 'A kid said "you used to be fast"'],
  },
  purchaseMoments: {
    he: ['השרוך הראשון · 06:00 בבוקר', 'הריצה השנייה אחרי שפיספסת אחת', '5 ק"מ ראשון · קו הסיום', 'הריצה הארוכה של שבת בבוקר', 'מקלחת אחרי ריצה · 30 הדקות של זהות'],
    en: ['First lace-up · 06:00', 'Second run after missing one', 'The first 5K · finish line', 'Saturday morning long run', 'Post-run shower · the 30 minutes of identity'],
  },
  trustSignals: {
    he: ['14 מרתונים · אימון מאז 2009', 'מאמן מוסמך · התמחות בריצת שיקום', 'יותר מ-2,000 רצים חזרו לאימון', 'אפליקציה עם תוכנית 12 שבועות', 'ייעוץ ראשון חינם'],
    en: ['14 marathons · coaching since 2009', 'Certified coach · comeback-runner specialty', 'Over 2,000 returning runners trained', 'A 12-week app program', 'Free first consult'],
  },
  proofTypes: ['real-runner UGC', 'identity transformation (before/after)', 'founder running themselves', 'race-day story'],
  ctaStyles: {
    he: ['קבע אימון ראשון · חינם.', 'נסה את התוכנית · שבוע ראשון על הבית.', 'הצטרף לקבוצת הריצה של שבת.'],
    en: ['Lace up tomorrow. We\'ll be here.', 'Try the program · first week on us.', 'Join the Saturday long-run group.'],
  },
  ugcAnglePatterns: ['real-runner-ugc', 'identity-transformation', 'founder-running-raw', 'race-day-story'],
  bestPerformingAdFormats: ['real-runner UGC (35-50yo · honest)', 'identity transformation', 'founder running raw', 'educational form-fix', 'race-day story'],
  vocabulary: {
    required: {
      he: ['ריצה', 'רץ', 'נעל', 'אימון', 'ק"מ', 'חזרה', 'כושר', 'מרתון', 'דופק', 'קצב'],
      en: ['run', 'runner', 'mile', 'kilometer', 'pace', 'comeback', 'lace up', '5K', 'half-marathon', 'recovery', 'long run'],
    },
    forbidden: {
      he: ['תכריע אותו', 'מצב חיה', 'בלי תירוצים', 'שריפת שומן', 'גזור'],
      en: ['crush it', 'beast mode', 'no excuses', 'transformation', 'fat-burning', 'shredded', 'gains'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור', 'chocolate', 'cacao', 'presence', 'mood'],
  },
  emotionalTerritory: {
    he: 'אתה רץ. רק שכחת לרגע.',
    en: 'You\'re a runner. You just forgot for a minute.',
  },
  oneLiners: [
    { locale: 'en', text: 'You\'re a runner. You just forgot for a minute.' },
    { locale: 'en', text: 'The comeback mile is the only mile that counts.' },
    { locale: 'en', text: 'Lace up. The first 200 meters are the hardest.' },
    { locale: 'he', text: 'אתה רץ. רק שכחת לרגע.' },
    { locale: 'he', text: 'הריצה הראשונה היא הקשה. השאר זה כושר.' },
    { locale: 'he', text: 'שרוך את הנעל. הרגליים יזכרו.' },
  ],
  hooks: [
    { family: 'identity', locale: 'en', text: 'You\'re a runner. You just forgot for a minute.' },
    { family: 'permission', locale: 'en', text: 'You\'re not slow. You\'re starting.' },
    { family: 'authority', locale: 'en', text: 'After 14 marathons and one stress fracture, here\'s what I do differently.' },
    { family: 'pain-mirror', locale: 'en', text: 'The first 200 meters are the hardest. Then it gets easier.' },
    { family: 'invitation', locale: 'en', text: 'Lace up tomorrow. We\'ll be here.' },
    { family: 'identity', locale: 'en', text: 'A runner who took a break is still a runner.' },
    { family: 'authority', locale: 'en', text: 'I coach returning runners. Over 2,000 came back. None broke their knees.' },
    { family: 'pain-mirror', locale: 'en', text: 'You missed Tuesday\'s run. The doubt got loud. Run Wednesday anyway.' },
    { family: 'invitation', locale: 'en', text: 'Saturday long run at 06:30. Slow pace welcome.' },
    { family: 'permission', locale: 'en', text: 'You don\'t have to run far. Just run today.' },
    { family: 'identity', locale: 'he', text: 'אתה רץ. רק שכחת לרגע.' },
    { family: 'permission', locale: 'he', text: 'אתה לא איטי. אתה מתחיל.' },
    { family: 'authority', locale: 'he', text: 'אחרי 14 מרתונים ואחד שבר מאמץ, אני מאמן אחרת.' },
    { family: 'pain-mirror', locale: 'he', text: '200 המטרים הראשונים הם הקשים. אחרי זה זה הולך.' },
    { family: 'invitation', locale: 'he', text: 'שרוך את הנעל מחר בבוקר. נחכה לך.' },
    { family: 'authority', locale: 'he', text: 'מאמן ריצה מוסמך · יותר מ-2,000 רצים חזרו לאימון אצלי.' },
  ],
  ugcScripts: [
    {
      locale: 'en',
      title: 'The first lace-up',
      angle: 'real-runner-ugc',
      durationSec: 20,
      script: '[0-4] I haven\'t run in five years. [4-10] I laced up at 5:45 this morning. [10-15] First 200 meters my lungs forgot how. [15-20] By kilometer two I remembered who I used to be.',
      shotList: ['close on running shoes laced up', 'wide shot of street at dawn', 'pavement and feet running', 'silhouette of a runner against sunrise'],
      cta: 'Lace up tomorrow.',
    },
    {
      locale: 'en',
      title: 'Saturday long run',
      angle: 'identity-transformation',
      durationSec: 22,
      script: '[0-5] Saturday 6:30. I show up. [5-11] The group is mostly 40-plus runners. Some faster than me. Most slower. [11-17] We don\'t talk much. We just run. [17-22] At kilometer 12, I remembered I love this.',
      shotList: ['group of runners gathering', 'feet running on a path', 'wide shot of the group', 'one runner pulling ahead'],
      cta: 'Join us this Saturday.',
    },
    {
      locale: 'en',
      title: 'After the injury',
      angle: 'founder-running-raw',
      durationSec: 24,
      script: '[0-5] I broke my foot in 2022. [5-12] The PT said run again. The doctor said maybe. The internet said never. [12-19] I went back to my coach. We made a 12-week plan. [19-24] I finished a 5K in May. Slow. But finished.',
      shotList: ['x-ray on a screen', 'PT session', 'running shoes by a door', 'finish-line photo'],
      cta: 'Talk to me about a comeback plan.',
    },
    {
      locale: 'he',
      title: 'השרוך הראשון',
      angle: 'real-runner-ugc',
      durationSec: 20,
      script: '[0-4] לא רצתי 5 שנים. [4-10] שרכתי את הנעליים ב-5:45 הבוקר. [10-15] 200 המטרים הראשונים הריאות שכחו איך. [15-20] בקילומטר 2 נזכרתי מי הייתי.',
      shotList: ['close on running shoes laced up', 'wide shot of street at dawn', 'pavement and feet running', 'silhouette of a runner against sunrise'],
      cta: 'שרוך את הנעל מחר.',
    },
    {
      locale: 'he',
      title: 'ריצת שבת ארוכה',
      angle: 'identity-transformation',
      durationSec: 22,
      script: '[0-5] שבת 06:30. אני מגיעה. [5-11] הקבוצה רובה רצים 40 פלוס. חלק מהר ממני. רוב יותר איטיים. [11-17] לא מדברים הרבה. רק רצים. [17-22] בקילומטר 12 נזכרתי שאני אוהבת את זה.',
      shotList: ['group of runners gathering', 'feet running on a path', 'wide shot of the group', 'one runner pulling ahead'],
      cta: 'הצטרפי אלינו בשבת.',
    },
  ],
  imageConcepts: [
    { locale: 'en', title: 'First lace-up', description: 'A 42-year-old runner laces a single shoe at the entrance to a building · 5:45 morning light · the other shoe on the floor · keys on a hook', renderingNote: 'documentary 50mm · single early light · no posed athletes' },
    { locale: 'en', title: 'Saturday morning group', description: 'Six runners aged 38-55 gathering at a path entrance · light winter clothes · steam from breath · pre-run conversation', renderingNote: 'wide documentary · real runners not models · dawn light' },
    { locale: 'en', title: 'Finish line at a 5K', description: 'A runner crossing a small-race finish line · arms not raised · just relief on the face · volunteers in the background', renderingNote: 'documentary 35mm · real race · single overcast light' },
    { locale: 'he', title: 'השרוך הראשון', description: 'רצה בת 42 שורכת נעל אחת בכניסה לבניין · אור בוקר 05:45 · הנעל השנייה על הרצפה · מפתחות על קולב', renderingNote: 'documentary 50mm · single early light · no posed athletes' },
    { locale: 'he', title: 'קבוצת שבת', description: 'שישה רצים בגילאי 38-55 מתאספים בכניסה לטיילת · בגדים קלים לחורף · אדים מנשימה · שיחה לפני ריצה', renderingNote: 'wide documentary · real runners not models · dawn light' },
  ],
  legalConstraints: ['cannot promise weight loss', 'cannot promise injury prevention', 'health-claim language is regulated'],
  regulatorySensitivityWarnings: ['avoid "transformation" framing', 'avoid weight-loss promises'],
};

// ────────────────────────────────────────────────────────────────
// 5 · RESTAURANT
// ────────────────────────────────────────────────────────────────

const RESTAURANT: VerticalKnowledge = {
  id: 'restaurant',
  displayName: 'Restaurant · Neighborhood Dinner',
  supportedLocales: ['he', 'en'],
  audienceArchetypes: [
    { id: 'tired-post-work-couple', label: 'Tired post-work couple', demographic: '28-45 · both work full days · 2-4× weekly dine-out budget', psychographic: 'Wants a real meal · doesn\'t want a loud sceney place' },
    { id: 'parents-on-date-night', label: 'Parents on date night', demographic: '32-50 · 1×/month or rarer date night · babysitter constraint', psychographic: 'Wants the night to count · short timeframe' },
    { id: 'corner-table-regulars', label: 'Regulars who want to be known', demographic: '35-65 · live or work locally · go 1-3×/month', psychographic: 'Wants to be recognized · likes the same table · trust the chef' },
  ],
  customerPains: {
    he: ['ארוחה גרועה · מביכה מול אורחים', 'קהל רועש · לא יכולים לדבר', 'שירות איטי · ערב הרוס', 'בן זוג מאוכזב · עלות חברתית', 'אכזבה יקרה · ₪400 בזבוז'],
    en: ['A bad meal · embarrassing in front of guests', 'A loud crowd · cannot talk', 'Slow service · evening ruined', 'A disappointed partner · social cost', 'An expensive disappointment · €100 wasted'],
  },
  customerDesires: {
    he: ['ערב אמיתי · 90 דקות שמרגישות הפסקה', 'שיתייחסו אליך כמו ללקוח קבוע', 'אוכל שמזכיר משהו · סבתא · נסיעה · ילדות', 'לסיים את היום עם משהו שלם, לא רק "אכלתי"', 'מקום שקט מספיק לדבר'],
    en: ['A real evening · 90 minutes that feel like a break', 'To be treated like a regular', 'Food that reminds you of something · grandmother · travel · childhood', 'To end the day with something real, not just "fed"', 'Quiet enough to talk · warm enough to relax'],
  },
  buyingTriggers: {
    he: ['יום נישואין · יום הולדת · אירוע מיוחד', 'סוף שבוע קשה · הזמנה לחמישי או שישי', 'בן זוג צריך עידוד', 'חברים מגיעים מחו"ל · צריך להרשים', 'סגרת עסקה · עונת הסיום', 'גשם וקור · חיפוש מקום נעים'],
    en: ['Anniversary · birthday · special occasion', 'Finished a hard week · Thursday or Friday booking', 'Partner needs cheering', 'Friends visiting · need to impress', 'Closed a deal · season-end', 'Cold rainy night · cozy-restaurant search'],
  },
  purchaseMoments: {
    he: ['הזמנת שולחן לחמישי 19:30', 'ארוחת צהריים יום שישי 13:30', 'יום נישואין בשולחן הפינה', 'יום הולדת של 12 אנשים', 'יום ראשון משפחתי בצהריים', 'דייט ראשון רציני'],
    en: ['Thursday 19:30 booking', 'Friday 13:30 lunch', 'Anniversary at the corner table', 'A birthday for 12 people', 'Sunday family lunch', 'A serious first date'],
  },
  trustSignals: {
    he: ['השף הוא הבעלים · 22 שנה בשירות', 'תפריט עונתי · מתחלף כל חודשיים', 'יין מהיקב ליד · בקבוקים בעמודה', 'לקוחות קבועים · 38% מהמושבים בערב', 'הלחם נאפה במטבח · יוצא ב-19:30'],
    en: ['Chef-owned · 22 years of service', 'Seasonal menu · changes every 2 months', 'Wine from the nearby winery · bottles on the column', 'Regulars · 38% of seats most evenings', 'Bread baked in-house · out of the oven at 19:30'],
  },
  proofTypes: ['food close-up still', 'chef-on-camera plating', 'dining room scene', 'regular\'s testimonial', 'reservation scarcity post'],
  ctaStyles: {
    he: ['הזמן שולחן לחמישי הקרוב.', 'שלח הודעה · נסגור שולחן.', 'שריין מקום ביום שישי בצהריים.'],
    en: ['Book a table for Thursday.', 'Send a message · we\'ll lock in a table.', 'Reserve for Friday lunch.'],
  },
  ugcAnglePatterns: ['food-porn-closeup', 'chef-on-camera', 'dining-room-scene', 'regulars-testimonial', 'reservation-scarcity'],
  bestPerformingAdFormats: ['food close-ups · single plate · steam visible', 'chef-on-camera plating 30sec', 'dining room scene · candlelit', 'regular\'s testimonial', 'reservation page scarcity'],
  vocabulary: {
    required: {
      he: ['שולחן', 'מסעדה', 'שף', 'ארוחה', 'לחם', 'מנה', 'יין', 'הזמנה', 'ערב', 'שירות', 'תפריט', 'ארוחת ערב'],
      en: ['table', 'restaurant', 'chef', 'meal', 'bread', 'dish', 'wine', 'reservation', 'evening', 'service', 'menu', 'dinner'],
    },
    forbidden: {
      he: ['מהיר', 'זול', 'דיל', 'מבצע', 'חבילה משפחתית', 'אקדמיה'],
      en: ['fast food', 'cheap', 'deal', 'special offer', 'family bundle', 'all-you-can-eat'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור', 'chocolate', 'cacao', 'presence', 'mood'],
  },
  emotionalTerritory: {
    he: 'הלחם יוצא מהתנור ב-19:30.',
    en: 'The bread comes out of the oven at 19:30.',
  },
  oneLiners: [
    { locale: 'he', text: 'שולחן אחד. ערב אחד. אוכל אמיתי.' },
    { locale: 'he', text: 'הלחם יוצא ב-19:30. השף ממתין.' },
    { locale: 'he', text: 'מסעדה שבה הופכים ללקוח קבוע אחרי ערב אחד.' },
    { locale: 'en', text: 'One table. One evening. Real food.' },
    { locale: 'en', text: 'The bread comes out at 19:30. The chef is waiting.' },
    { locale: 'en', text: 'A restaurant where you become a regular after one evening.' },
  ],
  hooks: [
    { family: 'sensory', locale: 'he', text: 'הלחם יוצא מהתנור ב-19:30.' },
    { family: 'invitation', locale: 'he', text: 'השולחן בפינה ממתין לך.' },
    { family: 'chef-led', locale: 'he', text: 'השף מבשל את המנה כמו שאמא שלו בישלה. רק עם יותר זמן.' },
    { family: 'scarcity', locale: 'he', text: 'שלושה שולחנות פנויים בערב חמישי. שאר השבוע מלא.' },
    { family: 'regular', locale: 'he', text: 'רחל סועדת ארוחת ערב במסעדה שלנו כל יום ראשון מאז שפתחנו.' },
    { family: 'sensory', locale: 'he', text: 'הריח של רוטב העגבניות עולה ממטבח המסעדה ב-18:00.' },
    { family: 'chef-led', locale: 'he', text: 'התפריט מתחלף עם העונה. ככה השף שלי גדל.' },
    { family: 'invitation', locale: 'he', text: 'ערב חמישי · 19:30 · שני מקומות אחרונים.' },
    { family: 'scarcity', locale: 'he', text: 'יום שישי בצהריים · ארבעה שולחנות · מי שמזמין ראשון יושב ראשון.' },
    { family: 'regular', locale: 'he', text: 'דני וענת חוגגים בשולחן הפינה אצלנו 14 ימי נישואין ברציפות.' },
    { family: 'sensory', locale: 'en', text: 'The bread comes out of the oven at 19:30.' },
    { family: 'invitation', locale: 'en', text: 'The corner table is waiting.' },
    { family: 'chef-led', locale: 'en', text: 'I cook the way my mother cooked. Just with more time.' },
    { family: 'scarcity', locale: 'en', text: 'Three tables open Thursday. The rest of the week is booked.' },
    { family: 'regular', locale: 'en', text: 'Rachel eats with us every Sunday since we opened.' },
    { family: 'sensory', locale: 'en', text: 'The tomato sauce starts at 18:00. You can smell it from the street.' },
    { family: 'chef-led', locale: 'en', text: 'The menu changes with the seasons. That\'s how my chef grew up.' },
  ],
  ugcScripts: [
    {
      locale: 'he',
      title: 'ערב חמישי',
      angle: 'dining-room-scene',
      durationSec: 20,
      script: '[0-4] ערב חמישי. 19:30. הזמנו שולחן לפינה. [4-10] השף יצא לרגע לשלום. הלחם הגיע חם. [10-15] שתי מנות. כוס יין. שיחה אמיתית. [15-20] חזרנו ביום ראשון.',
      shotList: ['hand on a wine glass', 'bread tearing close-up', 'two people at a corner table', 'chef wiping hands in apron'],
      cta: 'הזמן את הפינה שלך.',
    },
    {
      locale: 'he',
      title: 'השף ופרסה הראשונה',
      angle: 'chef-on-camera',
      durationSec: 22,
      script: '[0-4] השף שלי גדל בכפר ליד יפו. [4-11] את רוטב העגבניות הוא ספר לי שאמא שלו עשתה כל יום שישי. [11-17] עכשיו אנחנו עושים אותו כל יום. [17-22] טעם אחד, שמרנו על המקור. השאר זה הזמן.',
      shotList: ['chef stirring a pot', 'tomatoes on a counter', 'chef\'s mother photo on the wall', 'final plate served'],
      cta: 'הזמן שולחן. תטעם.',
    },
    {
      locale: 'en',
      title: 'A Thursday evening',
      angle: 'dining-room-scene',
      durationSec: 20,
      script: '[0-4] Thursday. 19:30. We booked the corner table. [4-10] The chef stepped out to say hi. The bread arrived warm. [10-15] Two dishes. One wine. A real conversation. [15-20] We came back on Sunday.',
      shotList: ['hand on a wine glass', 'bread tearing close-up', 'two people at a corner table', 'chef wiping hands in apron'],
      cta: 'Book your corner table.',
    },
    {
      locale: 'en',
      title: 'The chef and the first sauce',
      angle: 'chef-on-camera',
      durationSec: 22,
      script: '[0-4] My chef grew up in a village near Jaffa. [4-11] He told me his mother made the tomato sauce every Friday. [11-17] Now we make it every day. [17-22] Same taste. The rest is just time.',
      shotList: ['chef stirring a pot', 'tomatoes on a counter', 'chef\'s mother photo on the wall', 'final plate served'],
      cta: 'Book a table. Taste it.',
    },
    {
      locale: 'he',
      title: 'הלקוחה הקבועה',
      angle: 'regulars-testimonial',
      durationSec: 18,
      script: '[0-4] רחל אוכלת אצלנו כל יום ראשון מאז 2017. [4-9] השף יודע שהיא מבקשת פסטה בלי שום. [9-14] הוא מכין לה את זה לפני שהיא מבקשת. [14-18] זה הסטנדרט.',
      shotList: ['regular guest at her usual table', 'chef nodding from the kitchen', 'plate of pasta', 'guest reading a menu without ordering'],
      cta: 'הצטרפי לקבועים.',
    },
  ],
  imageConcepts: [
    { locale: 'he', title: 'הפינה החמה', description: 'שולחן פינתי במסעדה · נר אחד · שני סועדים · יין · לחם פרוס · מנה מהבישול · אווירה רגועה', renderingNote: 'documentary 50mm · candlelit · single warm light source · no posed expressions' },
    { locale: 'he', title: 'השף במטבח', description: 'שף בן 48 מבשל ברוטב על להבה · ידיים סלידות · אדים · מטבח פעיל ברקע · אור חם', renderingNote: 'documentary close · kitchen daylight · no studio lighting · real chef' },
    { locale: 'he', title: 'הלחם של 19:30', description: 'לחם חם יוצא מהתנור · קרום זהוב · אדים · קרש לחם · סכין · ריח כמעט נראה', renderingNote: 'macro · single warm light · documentary still-life' },
    { locale: 'en', title: 'The warm corner', description: 'A corner restaurant table · one candle · two diners · wine · sliced bread · a dish from the kitchen · calm atmosphere', renderingNote: 'documentary 50mm · candlelit · single warm light · no posed expressions' },
    { locale: 'en', title: 'The chef in the kitchen', description: 'A 48-year-old chef tending a sauce over flame · steady hands · steam · busy kitchen background · warm light', renderingNote: 'documentary close · kitchen daylight · no studio lighting · real chef' },
    { locale: 'en', title: 'The 19:30 bread', description: 'Warm bread leaves the oven · golden crust · steam · cutting board · knife · the smell almost visible', renderingNote: 'macro · single warm light · documentary still-life' },
  ],
  legalConstraints: ['allergen labeling required', 'food-safety disclosure'],
  regulatorySensitivityWarnings: ['avoid "fastest" or "all-you-can-eat" framing for sit-down brand'],
};

// ────────────────────────────────────────────────────────────────
// 6 · SAAS · PRODUCTIVITY
// ────────────────────────────────────────────────────────────────

const SAAS: VerticalKnowledge = {
  id: 'saas',
  displayName: 'SaaS · Productivity / Focus',
  supportedLocales: ['en', 'he'],
  audienceArchetypes: [
    { id: 'knowledge-worker-individual', label: 'Individual knowledge worker', demographic: '28-45 · engineer/designer/writer/consultant', psychographic: 'Believes they used to be smarter · attributes decline to distraction' },
    { id: 'creator-pro', label: 'Creator / solo pro', demographic: '25-42 · works from home · monetizes content', psychographic: 'Income depends on focus · willing to pay for tools that work' },
    { id: 'team-lead-small', label: 'Small-team lead', demographic: '32-48 · manages 3-12 people', psychographic: 'Wants team-level focus · needs admin/SSO' },
  ],
  customerPains: {
    he: ['פחד לשלוח פחות מהמתחרים', 'פחד שלא תצליח להתרכז כשזה חשוב', 'פחד שריפה', 'פחד להישאר מאחור', 'פחד להפוך לגרסה תמיד-מחוברת של עצמך'],
    en: ['Shipping less than peers', 'Unable to focus when it matters', 'Burning out', 'Falling behind in your field', 'Becoming the always-on version of yourself'],
  },
  customerDesires: {
    he: ['עבודה עמוקה · בלוקים של שעתיים מדי יום', 'שליחה של עוד דבר', 'ראש צלול · פחות ערפל אחר הצהריים', 'סופי שבוע ללא דליפת עבודה', 'גאוות אומן · עומק בעבודה'],
    en: ['Deep work · 2-hour focus blocks daily', 'Shipping more', 'Clearer head · less afternoon fog', 'Weekends off', 'Craftsman-pride · depth in the work'],
  },
  buyingTriggers: {
    he: ['דדליין שנכשל', 'הערכת ביצועים גרועה', 'ראית את המסך של עמית', 'הפודקאסט המהימן אזכר את המוצר', 'סקרין שוט מטוויטר מיוצר שאתה סומך עליו'],
    en: ['Missed a deadline', 'A bad performance review', 'Saw a colleague\'s screen', 'A trusted podcast mention', 'A Twitter screenshot from a creator you trust'],
  },
  purchaseMoments: {
    he: ['09:00 שני · הצפת סלאק', '14:00 רביעי · ערפל אחרי ארוחת הצהריים', 'ראשון · חרדה · עבודה דולפת לסופ"ש', 'שעת הסיום של היום · מנסה לסיים דבר אחד', '20 דקות לפני פגישה · הכנה עמוקה'],
    en: ['09:00 Monday · Slack overwhelm', '14:00 Wednesday · post-lunch fog', 'Sunday · anxiety · work bleeding into weekend', 'Last hour of the day · trying to ship one thing', '20 minutes before a deep meeting · prep window'],
  },
  trustSignals: {
    he: ['בנוי בידי מפתח אינדי · משוחרר ב-2022', 'משמש 14,000 מפתחים מדי יום', 'ללא הוצאה לחיצוץ · ללא מודעות', 'קוד פתוח · ניתן לביקורת', 'תמיכה ישירה מהמייסד'],
    en: ['Built by an indie dev · shipped in 2022', 'Used daily by 14,000 indie devs', 'No tracking · no ads', 'Open source · auditable', 'Direct support from the founder'],
  },
  proofTypes: ['product demo video 10-30sec', 'before/after Slack screenshot', 'founder using own product', 'creator tweet quote', 'numbers case study'],
  ctaStyles: {
    he: ['התקן בדקה. נסה שבועיים.', 'הורד · בלי כרטיס אשראי.', 'התחל את הבלוק הראשון של שעתיים היום.'],
    en: ['Install in a minute. Try for two weeks.', 'Download · no credit card.', 'Start your first 2-hour block today.'],
  },
  ugcAnglePatterns: ['product-demo-video', 'before-after-slack-screenshot', 'founder-using-own-product', 'creator-tweet-quote', 'numbers-case-study'],
  bestPerformingAdFormats: ['product demo video 10-30sec', 'before/after Slack screenshot', 'founder using own product', 'creator tweet quote', 'case study with numbers'],
  vocabulary: {
    required: {
      he: ['פוקוס', 'עבודה', 'התראות', 'הסחה', 'תוכנה', 'דדליין', 'תפוקה', 'בלוק', 'זרימה', 'אינבוקס'],
      en: ['focus', 'deep work', 'notifications', 'slack', 'inbox', 'shipping', 'block', 'craft', 'flow state', 'interrupts', 'software'],
    },
    forbidden: {
      he: ['פריצת דרך', 'מהפכת פרודוקטיביות', 'פי 10', 'שחרור הפוטנציאל'],
      en: ['productivity hack', '10x productivity', 'crush your day', 'peak performance', 'unlock your potential', 'gamechanger', 'revolutionary'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'chocolate', 'cacao', 'presence', 'mood', 'mindfulness'],
  },
  emotionalTerritory: {
    he: 'השעה שחזרה אליך.',
    en: 'The hour you got back.',
  },
  oneLiners: [
    { locale: 'en', text: 'Software that protects your focus.' },
    { locale: 'en', text: 'The 2-hour block you used to have. Back.' },
    { locale: 'en', text: 'It blocks notifications. That\'s the whole product.' },
    { locale: 'he', text: 'תוכנה שמגנה על הפוקוס שלך.' },
    { locale: 'he', text: 'הבלוק של שעתיים שהיה לך. חוזר.' },
    { locale: 'he', text: 'חוסם התראות. זה כל המוצר.' },
  ],
  hooks: [
    { family: 'pain-mirror', locale: 'en', text: 'You opened Slack 47 times today.' },
    { family: 'roi', locale: 'en', text: 'The 2-hour daily focus block you\'ve been missing.' },
    { family: 'authority', locale: 'en', text: 'I built this because I shipped 2× more after I made it.' },
    { family: 'social-proof', locale: 'en', text: 'Used daily by 14,000 indie devs for deep work blocks.' },
    { family: 'anti-marketing', locale: 'en', text: 'It blocks notifications. That\'s the whole product.' },
    { family: 'pain-mirror', locale: 'en', text: 'Your afternoon fog isn\'t age. It\'s 200 interrupts.' },
    { family: 'roi', locale: 'en', text: '40% more shipping in 30 days. Average across our last 800 focus users.' },
    { family: 'authority', locale: 'en', text: 'Built by an indie dev. No VC. No growth team. One focus feature done right.' },
    { family: 'anti-marketing', locale: 'en', text: 'No AI. No magic. Just focus protection software.' },
    { family: 'social-proof', locale: 'en', text: 'Featured on 14 dev podcasts because the focus software works.' },
    { family: 'pain-mirror', locale: 'he', text: 'פתחת סלאק 47 פעמים היום.' },
    { family: 'roi', locale: 'he', text: 'הבלוק של שעתיים שאתה מפספס מדי יום.' },
    { family: 'authority', locale: 'he', text: 'בניתי את זה כי הצלחתי לשלוח פי 2 אחרי שעשיתי אותו.' },
    { family: 'social-proof', locale: 'he', text: 'משמש 14,000 מפתחים אינדי מדי יום.' },
    { family: 'anti-marketing', locale: 'he', text: 'חוסם התראות. זה כל המוצר.' },
    { family: 'pain-mirror', locale: 'he', text: 'הערפל שלך אחרי הצהריים זה לא גיל. זה 200 הפרעות.' },
  ],
  ugcScripts: [
    {
      locale: 'en',
      title: 'The before/after Slack',
      angle: 'before-after-slack-screenshot',
      durationSec: 18,
      script: '[0-4] Slack at 09:30. 47 unreads. [4-9] Slack at 14:30. Same day. With the block on. [9-14] Three notifications. All decided. [14-18] I shipped at 16:00 today. First time in months.',
      shotList: ['screen full of slack red dots', 'clean slack with 3 notifications', 'macbook on a desk', 'commit log on github'],
      cta: 'Install · two-week trial.',
    },
    {
      locale: 'en',
      title: 'The 2-hour block',
      angle: 'numbers-case-study',
      durationSec: 22,
      script: '[0-5] I run a small SaaS. I have 6 hours a day to actually code. [5-12] Before the block, I was getting 2 hours of real work. [12-18] After the block, 4 hours. Every day. [18-22] That\'s the entire diff.',
      shotList: ['developer at a desk', 'split screen showing before/after', 'graph going up', 'developer closing laptop at 17:00'],
      cta: 'Start your first block today.',
    },
    {
      locale: 'en',
      title: 'Founder uses the product',
      angle: 'founder-using-own-product',
      durationSec: 20,
      script: '[0-4] I built this product. I use it every day. [4-10] At 09:00 I turn the block on. It runs until 11:00. [10-15] No slack. No email. No twitter. [15-20] At 11:01 the world comes back. By then I shipped something.',
      shotList: ['founder at a desk', 'screen shows the block enabled', 'closing tabs animation', 'commit being pushed'],
      cta: 'Try the same setup.',
    },
    {
      locale: 'he',
      title: 'לפני ואחרי בסלאק',
      angle: 'before-after-slack-screenshot',
      durationSec: 18,
      script: '[0-4] סלאק ב-09:30. 47 לא נקראות. [4-9] סלאק ב-14:30. אותו יום. עם הבלוק מופעל. [9-14] שלוש התראות. כולן הוחלטו. [14-18] שלחתי משהו ב-16:00 היום. פעם ראשונה בחודשים.',
      shotList: ['screen full of slack red dots', 'clean slack with 3 notifications', 'macbook on a desk', 'commit log on github'],
      cta: 'התקן · ניסיון שבועיים.',
    },
    {
      locale: 'he',
      title: 'שתי שעות עבודה עמוקה',
      angle: 'numbers-case-study',
      durationSec: 22,
      script: '[0-5] אני מנהל סאס קטן. יש לי 6 שעות ביום באמת לקוד. [5-12] לפני הבלוק קיבלתי 2 שעות עבודה אמיתית. [12-18] אחרי הבלוק, 4 שעות. כל יום. [18-22] זה ההבדל.',
      shotList: ['developer at a desk', 'split screen showing before/after', 'graph going up', 'developer closing laptop at 17:00'],
      cta: 'התחל את הבלוק הראשון שלך.',
    },
  ],
  imageConcepts: [
    { locale: 'en', title: 'Clean Slack', description: 'A laptop screen showing Slack with three unread notifications · a clean desk · midday light · no clutter', renderingNote: 'documentary close · single window light · no studio · no posed hands' },
    { locale: 'en', title: 'Developer at deep work', description: 'A 34-year-old developer at a desk · one monitor · a coffee mug · headphones · early afternoon light · no distractions visible', renderingNote: 'documentary 50mm · real workspace · single light source · no studio' },
    { locale: 'en', title: 'Commit log', description: 'A monitor showing a long git commit log · clean code · timestamp · no faces in frame', renderingNote: 'macro · single screen light · documentary still-life' },
    { locale: 'he', title: 'סלאק נקי', description: 'מסך מחשב שמראה סלאק עם שלוש התראות לא נקראות · שולחן נקי · אור צהריים · ללא בלגן', renderingNote: 'documentary close · single window light · no studio · no posed hands' },
    { locale: 'he', title: 'מפתח בעבודה עמוקה', description: 'מפתח בן 34 ליד שולחן · מסך אחד · כוס קפה · אוזניות · אור אחרי הצהריים · ללא הפרעות נראות', renderingNote: 'documentary 50mm · real workspace · single light source · no studio' },
  ],
  legalConstraints: ['data privacy claims must be substantiated', 'cannot claim "blocks 100% of distractions" without basis'],
  regulatorySensitivityWarnings: ['avoid productivity-hack culture language'],
};

// ────────────────────────────────────────────────────────────────
// 7 · HVAC · LOCAL SERVICE
// ────────────────────────────────────────────────────────────────

const HVAC: VerticalKnowledge = {
  id: 'hvac',
  displayName: 'HVAC · Local AC Service',
  supportedLocales: ['he', 'en'],
  audienceArchetypes: [
    { id: 'homeowner-emergency', label: 'Homeowner · AC just died', demographic: '30-65 · 30°C+ outside · AC broken', psychographic: 'Wants same-day service · scared of being scammed' },
    { id: 'landlord-multi-unit', label: 'Landlord · multiple units', demographic: '35-65 · owns 2-8 rentals', psychographic: 'Needs a reliable on-call HVAC contact' },
    { id: 'pre-summer-prep', label: 'Pre-summer planner', demographic: '35-65 · early May · proactive', psychographic: 'Wants to avoid the summer emergency' },
  ],
  customerPains: {
    he: ['פחד להיות מרומה על ידי טכנאי הזדמנותי', 'הטכנאי לא יבוא בשעה שהבטיח', 'תשלום על תיקון מיותר', 'להישאר בלי מזגן בגל חום', 'מכירה דחופה של מערכת שלמה במקום תיקון'],
    en: ['Fear of being scammed by an opportunist technician', 'Technician not arriving when promised', 'Paying for an unnecessary repair', 'Being stuck without AC in a heatwave', 'Being upsold a full unit when a service would do'],
  },
  customerDesires: {
    he: ['מזגן עובד באוגוסט · היום', 'שירות מהיר · באותו יום אם אפשר', 'תמחור הוגן · בלי הפתעות', 'טכנאי שמסביר מה עשה', 'עבודה שנגמרת מהפעם הראשונה'],
    en: ['A working AC in August · today', 'Same-day service if possible', 'Honest pricing · no surprises', 'A technician who explains what they did', 'Done right the first time'],
  },
  buyingTriggers: {
    he: ['המזגן הפסיק לעבוד', 'תחזית של גל חום · 3 ימים לפני', 'חשבון חשמל קפץ', 'שיפוץ דירה נגמר', 'דייר חדש נכנס', 'המזגן מרעיש או פולט אוויר חלש'],
    en: ['AC just broke', 'Heatwave forecast · 3-day lead time', 'Electric bill spiked', 'Renovation completed', 'New tenant moving in', 'AC making weird noises or weak output'],
  },
  purchaseMoments: {
    he: ['38° מחר · המזגן לא עובד', 'מאי · טיפול לפני הקיץ', 'התקנה אחרי שיפוץ', 'שיחה ממשכיר על תקלה אצל דייר', 'שבת בבוקר · גילוי דליפה', 'יציאה לחו"ל · להשאיר את המזגן מטופל'],
    en: ['38°C tomorrow · AC dead', 'May · pre-summer service', 'Post-renovation install', 'Tenant called landlord · landlord calls technician', 'Saturday morning · slow leak discovery', 'Pre-vacation prep · leave the AC right'],
  },
  trustSignals: {
    he: ['30 שנה בשטח', 'טכנאי מוסמך · עם ביטוח', '147 ביקורות החודש', 'מחיר שקוף · ידוע לפני הביקור', 'בעבודה היום · אפשר וואטסאפ'],
    en: ['30 years in the field', 'Certified · insured technician', '147 reviews this month', 'Transparent pricing · known before the visit', 'Working today · WhatsApp us'],
  },
  proofTypes: ['WhatsApp screenshot testimonial', 'technician-on-the-job', 'before/after temperature reading', 'transparent pricing post', 'review screenshot collage'],
  ctaStyles: {
    he: ['שלח וואטסאפ · אני אצא היום.', 'הזמן טיפול לפני הקיץ · ₪280.', 'התקשר עכשיו · 30 דקות הגעה.'],
    en: ['WhatsApp me · I\'ll come today.', 'Book pre-summer service · €80.', 'Call now · 30-minute arrival.'],
  },
  ugcAnglePatterns: ['whatsapp-screenshot-testimonial', 'technician-on-the-job', 'before-after-temperature', 'transparent-pricing'],
  bestPerformingAdFormats: ['WhatsApp screenshot testimonial', 'technician-on-the-job', 'before/after temperature', 'transparent pricing post', 'review screenshot collage'],
  vocabulary: {
    required: {
      he: ['מזגן', 'טיפול', 'תיקון', 'קיץ', 'חום', 'דירה', 'טכנאי', 'שירות', 'מחיר', 'אחריות', 'אוגוסט', 'מערכת'],
      en: ['AC', 'air conditioner', 'repair', 'service', 'technician', 'summer', 'heat', 'apartment', 'price', 'warranty', 'unit'],
    },
    forbidden: {
      he: ['מהפכה', 'מבצע מטורף', 'חינם', '50% הנחה', 'לחיים'],
      en: ['revolution', 'crazy deal', 'free service', '50% off', 'cheers'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'מותר לעצור', 'chocolate', 'cacao', 'presence', 'mood'],
  },
  emotionalTerritory: {
    he: 'מזגן עובד באוגוסט. היום.',
    en: 'A working AC in August. Today.',
  },
  oneLiners: [
    { locale: 'he', text: 'מזגן עובד באוגוסט. היום.' },
    { locale: 'he', text: 'תדעי את המחיר לפני שאני יוצא.' },
    { locale: 'he', text: 'שלושים שנה בשטח. בודק את המזגן ביום אחד.' },
    { locale: 'en', text: 'A working AC in August. Today.' },
    { locale: 'en', text: 'You\'ll know the price before I leave.' },
    { locale: 'en', text: 'Thirty years in the field. Diagnosed in a day.' },
  ],
  hooks: [
    { family: 'urgency', locale: 'he', text: '38° מחר. אל תחכי.' },
    { family: 'transparency', locale: 'he', text: '₪450 לטיפול סטנדרטי. תדעי את המחיר לפני שאני יוצא לדרך.' },
    { family: 'social-proof', locale: 'he', text: '147 ביקורות החודש. תקראי לפני שאת מזמינה.' },
    { family: 'competence', locale: 'he', text: 'שלושים שנה בשטח. בודק את המזגן ביום אחד.' },
    { family: 'invitation', locale: 'he', text: 'שירות לפני הקיץ · ₪280 בלבד עד 15 ביוני.' },
    { family: 'urgency', locale: 'he', text: 'דירה ב-31°. תיקון היום אחר הצהריים. בלי תוספות.' },
    { family: 'transparency', locale: 'he', text: 'אם המזגן לא צריך תיקון — אני אומר את זה. בלי אבחנה מומצאת.' },
    { family: 'competence', locale: 'he', text: 'הטכנאי שלי עובד בעיר הזו 14 שנה. אותו פנים. אותו מספר טלפון.' },
    { family: 'social-proof', locale: 'he', text: '4.9 כוכבים ב-Google · 392 ביקורות · שכן אחד אחרי השני.' },
    { family: 'urgency', locale: 'en', text: '38° tomorrow. Don\'t wait.' },
    { family: 'transparency', locale: 'en', text: '€120 standard service. You\'ll know the price before I leave the shop.' },
    { family: 'social-proof', locale: 'en', text: '147 reviews this month. Read them before you book.' },
    { family: 'competence', locale: 'en', text: 'Thirty years in the field. Diagnosed in a day.' },
    { family: 'invitation', locale: 'en', text: 'Pre-summer service · €70 until June 15.' },
    { family: 'urgency', locale: 'en', text: 'Your apartment is at 31°. Repair today. No surprises.' },
    { family: 'competence', locale: 'en', text: 'My tech has worked this city 14 years. Same face. Same phone number.' },
  ],
  ugcScripts: [
    {
      locale: 'he',
      title: 'תיקון באוגוסט',
      angle: 'whatsapp-screenshot-testimonial',
      durationSec: 18,
      script: '[0-4] קריר הגיע ב-90 דקות. ₪450. ניסה לתקן לפני להחליף. [4-9] הסביר לי בדיוק מה היה לא בסדר. [9-14] בסוף החליף קבל קטן. לא יחידה שלמה. [14-18] המזגן עובד. חיסכתי ₪3,000.',
      shotList: ['phone screen with whatsapp conversation', 'technician at work close-up', 'AC unit being repaired', 'thermometer at 24°'],
      cta: 'שלח וואטסאפ · אני אצא היום.',
    },
    {
      locale: 'he',
      title: 'לפני הקיץ',
      angle: 'transparent-pricing',
      durationSec: 22,
      script: '[0-5] מאי. ₪280 לטיפול לפני הקיץ. [5-11] הגעתי לדירה של רות. ניקיתי את המסננים. בדקתי את הגז. [11-17] גיליתי שיש דליפה. הזמנתי לחזור עם החלפים. [17-22] טיפול שעולה לי ₪80 יותר. לרות לא · המחיר שיודענו מראש.',
      shotList: ['calendar showing May', 'technician working on an AC', 'filters being cleaned', 'handshake at the door'],
      cta: 'הזמן טיפול לפני שיהיה חם.',
    },
    {
      locale: 'en',
      title: 'August repair',
      angle: 'whatsapp-screenshot-testimonial',
      durationSec: 18,
      script: '[0-4] Krir came in 90 minutes. €120. Tried to repair before replacing. [4-9] Explained what was wrong. [9-14] Replaced one small capacitor. Not the whole unit. [14-18] AC works. Saved me €800.',
      shotList: ['phone screen with whatsapp conversation', 'technician at work close-up', 'AC unit being repaired', 'thermometer at 24°'],
      cta: 'WhatsApp me · I\'ll come today.',
    },
    {
      locale: 'en',
      title: 'Before summer',
      angle: 'transparent-pricing',
      durationSec: 22,
      script: '[0-5] May. €70 pre-summer service. [5-11] I arrived at Ruth\'s apartment. Cleaned the filters. Checked the refrigerant. [11-17] Found a small leak. Booked a return with parts. [17-22] Cost me €20 more in time. For Ruth · the price stayed what we agreed.',
      shotList: ['calendar showing May', 'technician working on an AC', 'filters being cleaned', 'handshake at the door'],
      cta: 'Book service before the heat hits.',
    },
    {
      locale: 'he',
      title: 'הטכנאי הקבוע',
      angle: 'technician-on-the-job',
      durationSec: 20,
      script: '[0-4] ניר עובד בעיר הזו 14 שנה. [4-10] את אותו טכנאי תקבל פעם אחרי פעם. [10-15] אם משהו לא תקין הוא חוזר בחינם. [15-20] ככה עובדים מי שמתכוונים להישאר.',
      shotList: ['technician working on an AC', 'AC remote control close-up', 'business card on a fridge', 'handshake at a door'],
      cta: 'שלח לי הודעה. נקבע ביקור.',
    },
  ],
  imageConcepts: [
    { locale: 'he', title: 'המזגן בעבודה', description: 'טכנאי בן 48 עומד על סולם · מזגן פתוח · כלי עבודה ביד · אור אחר הצהריים · אדים מהמזגן', renderingNote: 'documentary 50mm · real technician · single warm light · no studio' },
    { locale: 'he', title: 'התרמומטר', description: 'תרמומטר ביתי על הקיר · 31° לפני · 24° אחרי · שני מסכים זה לזה', renderingNote: 'split-frame · single light source · documentary still-life' },
    { locale: 'he', title: 'וואטסאפ', description: 'מסך טלפון · שיחת וואטסאפ עם תמונה של המזגן ומענה בתוך 4 דקות · אור חלון', renderingNote: 'phone screen · single window light · realistic UI · no fake notifications' },
    { locale: 'en', title: 'The AC at work', description: 'A 48-year-old technician on a ladder · AC unit open · tools in hand · afternoon light · steam from the unit', renderingNote: 'documentary 50mm · real technician · single warm light · no studio' },
    { locale: 'en', title: 'The thermometer', description: 'A wall thermometer · 31° before · 24° after · two screens side by side', renderingNote: 'split-frame · single light source · documentary still-life' },
    { locale: 'en', title: 'WhatsApp', description: 'A phone screen · WhatsApp conversation with a photo of an AC and a reply in 4 minutes · window light', renderingNote: 'phone screen · single window light · realistic UI · no fake notifications' },
  ],
  legalConstraints: ['must disclose technician certification', 'cannot guarantee repair without diagnosis', 'warranty terms must be clear'],
  regulatorySensitivityWarnings: ['avoid "guaranteed" language', 'avoid emergency-fee-bait pricing'],
};

// ────────────────────────────────────────────────────────────────
// 8 · JEWELRY · FINE / SELF-PURCHASE
// ────────────────────────────────────────────────────────────────

const JEWELRY: VerticalKnowledge = {
  id: 'jewelry',
  displayName: 'Jewelry · Fine / Self-Purchase',
  supportedLocales: ['he', 'en'],
  audienceArchetypes: [
    { id: 'self-purchase-milestone', label: 'Self-purchase milestone', demographic: '32-55 · women · marking a personal milestone', psychographic: 'Doesn\'t need permission · buys when she decides' },
    { id: 'gift-significant-partner', label: 'Significant partner gift', demographic: '35-60 · partner buying for spouse', psychographic: 'Wants the gift to be right · scared of the wrong choice' },
    { id: 'gift-to-daughter-mother', label: 'Gift to daughter / mother', demographic: '40-65 · marking a wedding or milestone', psychographic: 'Wants something to be passed down' },
  ],
  customerPains: {
    he: ['פחד להיראות בולט מדי', 'פחד לשלם הרבה ולא לקבל מספיק', 'מתנה שלא תתקבל טוב', 'להיראות כמי שמנסה להרשים', 'פחד שהחתיכה תישבר או תאבד'],
    en: ['Fear of looking gauche', 'Paying too much for too little', 'A gift not received well', 'Looking like you\'re showing off', 'Fear of the piece breaking or being lost'],
  },
  customerDesires: {
    he: ['לסמן רגע שאחרת לא היה מסומן', 'להישאר בזיכרון של מי שקיבל', 'להרגיש שהמתנה הייתה נכונה', 'להוריש לדור הבא', 'לענוד משהו משמעותי מדי יום'],
    en: ['To mark a moment otherwise unmarked', 'To be remembered (for the giver)', 'Feel like the gift was right', 'Pass something down', 'Wear something meaningful daily'],
  },
  buyingTriggers: {
    he: ['יום נישואין · 10, 15, 20, 25', 'יום הולדת עם 0 או 5', 'לידת ילד', 'קידום או מכירת חברה', 'לפני נסיעה · מזכרת לעצמה', 'הישג · תואר · ספר · מירוץ'],
    en: ['Anniversary · 10, 15, 20, 25', 'Birthday with 0 or 5', 'Birth of a child', 'Promotion or business sale', 'Pre-trip souvenir', 'Achievement · degree · book · race'],
  },
  purchaseMoments: {
    he: ['רכישה עצמית אחרי קידום · הבוקר אחרי, לבד', 'קניית מתנה לבן זוג שבוע לפני יום נישואין', 'לבישה ראשונה באירוע משמעותי', 'העברה מאם לבת באירוס', 'רכישה עצמית אחרי גירושין'],
    en: ['Self-purchase after a promotion · the morning after, alone', 'Gift-shopping for a partner a week before anniversary', 'First wearing at a meaningful event', 'Handing down from mother to daughter at engagement', 'Self-purchase post-divorce'],
  },
  trustSignals: {
    he: ['מעצבת · 16 שנה בעבודה ידנית', 'כל חתיכה חתומה', 'זהב 18 קראט · מסומן · מקור ידוע', 'יומן עיצוב פתוח · השאלה הראשונה היא איזה רגע מסמנים', 'התאמה אישית · אישית לכל חתיכה'],
    en: ['Designer · 16 years of hand-crafting', 'Every piece signed', '18-karat gold · marked · sourced transparently', 'Open design journal · we begin with which moment is being marked', 'Personal fit · custom for every piece'],
  },
  proofTypes: ['founder-as-designer process', 'piece worn at a meaningful moment', 'close-up sensory', 'gift-recipient reaction', 'owner story'],
  ctaStyles: {
    he: ['קביעת פגישה אישית · 60 דקות.', 'שלחי תמונת השראה · אני אחזור.', 'גלי את הקולקציה החדשה.'],
    en: ['Book a personal appointment · 60 minutes.', 'Send a photo · I\'ll respond.', 'Explore the new collection.'],
  },
  ugcAnglePatterns: ['founder-as-designer', 'real-life-context', 'close-up-sensory', 'gift-recipient-reaction', 'owner-story'],
  bestPerformingAdFormats: ['founder-as-designer process · sketches', 'piece in real-life context · not studio', 'close-up sensory · 5-sec slow zoom', 'gift-recipient reaction', 'owner story'],
  vocabulary: {
    required: {
      he: ['תכשיט', 'טבעת', 'שרשרת', 'עגיל', 'זהב', 'כסף', 'יהלום', 'מתנה', 'דור', 'עיצוב', 'יחיד במינה', 'עבודת יד'],
      en: ['jewelry', 'ring', 'necklace', 'earring', 'gold', 'silver', 'diamond', 'gift', 'generation', 'design', 'one-of-a-kind', 'handmade', 'heirloom'],
    },
    forbidden: {
      he: ['בלינג', 'מבריק', 'זוהר', 'מבצע פסח', 'בלעדי', 'וי איי פי'],
      en: ['bling', 'sparkly', 'glittery', 'flash sale', 'exclusive', 'VIP'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'chocolate', 'cacao', 'presence', 'mood'],
  },
  emotionalTerritory: {
    he: 'לסמן את הרגע שאיש אחר לא מסמן בשבילך.',
    en: 'Mark the moment no one else will mark for you.',
  },
  oneLiners: [
    { locale: 'he', text: 'תכשיט אחד. רגע אחד. דור שלם.' },
    { locale: 'he', text: 'היא קנתה אותו לעצמה. לא חכתה.' },
    { locale: 'he', text: 'עבודת יד. 12 שעות. לכל חתיכה.' },
    { locale: 'en', text: 'One piece. One moment. A whole generation.' },
    { locale: 'en', text: 'She bought it for herself. She didn\'t wait.' },
    { locale: 'en', text: 'Handmade. 12 hours. Per piece.' },
  ],
  hooks: [
    { family: 'significance', locale: 'he', text: 'היום היא ענדה את הטבעת לקידום שלה.' },
    { family: 'craft', locale: 'he', text: '12 שעות עבודת יד. כל תכשיט. עם החתימה שלי.' },
    { family: 'permission', locale: 'he', text: 'היא קנתה את הטבעת לעצמה. לא חכתה למישהו אחר.' },
    { family: 'heirloom', locale: 'he', text: 'היא תעבור הלאה. זה מה שבונים תכשיט בשביל.' },
    { family: 'founder-story', locale: 'he', text: 'אני מעצבת כל תכשיט כאילו אני אענוד אותו בעצמי.' },
    { family: 'significance', locale: 'he', text: 'יום נישואין 25. טבעת אחת. סיפור שיגיד את עצמו.' },
    { family: 'craft', locale: 'he', text: 'כל יהלום נקבע ביד. כל זהב נשקל לפני שמתחילים.' },
    { family: 'permission', locale: 'he', text: 'מותר לך לרצות תכשיט בלי להסביר למה.' },
    { family: 'significance', locale: 'en', text: 'Today she wore it to her own promotion.' },
    { family: 'craft', locale: 'en', text: '12 hours of handwork. Every piece. Signed.' },
    { family: 'permission', locale: 'en', text: 'She bought it for herself. She didn\'t wait for someone else.' },
    { family: 'heirloom', locale: 'en', text: 'It will pass down. That\'s what jewelry is built for.' },
    { family: 'founder-story', locale: 'en', text: 'I design every piece as if I would wear it myself.' },
    { family: 'significance', locale: 'en', text: '25 years married. One ring. A story that says itself.' },
    { family: 'craft', locale: 'en', text: 'Every diamond hand-set. Every gold piece weighed before we begin.' },
  ],
  ugcScripts: [
    {
      locale: 'he',
      title: 'הקידום',
      angle: 'owner-story',
      durationSec: 22,
      script: '[0-5] קיבלתי קידום ביום שלישי. [5-11] חיכיתי שמישהו יקנה לי משהו. הוא לא עשה את זה. [11-17] ביום שישי קניתי לעצמי את הטבעת הזו. [17-22] אני עונדת אותה כל יום מאז.',
      shotList: ['close on a ring on a hand at work', 'gift box opening', 'woman in a meeting wearing the ring', 'ring placed on a table at evening'],
      cta: 'אם זה הרגע שלך · בואי נדבר.',
    },
    {
      locale: 'he',
      title: 'הסבתא שהורישה',
      angle: 'real-life-context',
      durationSec: 24,
      script: '[0-5] השרשרת הזו הייתה של סבתא שלי. [5-12] היא הורישה לי אותה לחתונה שלי. [12-19] עכשיו אני מעצבת אחת חדשה לבת שלי, באותה רוח. [19-24] תכשיט אמיתי הוא שיחה בין דורות.',
      shotList: ['old necklace in a velvet box', 'designer sketching at a desk', 'mother and daughter close-up', 'two necklaces side by side'],
      cta: 'בואי נעצב את הסיפור שלכן.',
    },
    {
      locale: 'en',
      title: 'The promotion',
      angle: 'owner-story',
      durationSec: 22,
      script: '[0-5] I got a promotion on Tuesday. [5-11] I waited for someone to buy me something. He didn\'t. [11-17] On Friday I bought myself this ring. [17-22] I wear it every day since.',
      shotList: ['close on a ring on a hand at work', 'gift box opening', 'woman in a meeting wearing the ring', 'ring placed on a table at evening'],
      cta: 'If this is your moment · let\'s talk.',
    },
    {
      locale: 'en',
      title: 'The grandmother\'s heirloom',
      angle: 'real-life-context',
      durationSec: 24,
      script: '[0-5] This necklace was my grandmother\'s. [5-12] She gave it to me for my wedding. [12-19] Now I\'m designing one for my daughter, in the same spirit. [19-24] A real piece is a conversation between generations.',
      shotList: ['old necklace in a velvet box', 'designer sketching at a desk', 'mother and daughter close-up', 'two necklaces side by side'],
      cta: 'Let\'s design your story.',
    },
    {
      locale: 'he',
      title: 'יום נישואין 25',
      angle: 'gift-recipient-reaction',
      durationSec: 20,
      script: '[0-4] 25 שנה נשואים. [4-10] רציתי לתת לה משהו שיגיד הכל. [10-15] עיצבנו טבעת בשני חודשים. בלי לסמס לה. [15-20] היא לבשה אותה לארוחת היום הולדת שלי. אמרה תודה במבט.',
      shotList: ['couple at a restaurant', 'close on the gift opening', 'her wearing the ring at a table', 'two hands intertwined'],
      cta: 'נעצב את שלך.',
    },
  ],
  imageConcepts: [
    { locale: 'he', title: 'יום הקידום', description: 'אישה בת 38 ביד עם טבעת זהב חדשה · מסך מחשב מטושטש ברקע · אור צהריים · יד מנוחה על מקלדת', renderingNote: 'documentary 50mm · single window light · no posed expressions · real workspace' },
    { locale: 'he', title: 'העיצוב על השולחן', description: 'מעצבת תכשיטים · ידיים · סקיצה על נייר · חתיכת זהב גולמי · אור חם של סטודיו', renderingNote: 'documentary close · single warm light · still-life feel · no production polish' },
    { locale: 'he', title: 'השרשרת בקופסה', description: 'שרשרת ישנה בקופסת קטיפה · נפתחת בקצב איטי · אור חלון · ידיים של אישה בת 60', renderingNote: 'macro · single warm light · documentary still-life · no studio' },
    { locale: 'en', title: 'Promotion day', description: 'A 38-year-old woman with a new gold ring · blurred laptop background · midday light · resting hand on the keyboard', renderingNote: 'documentary 50mm · single window light · real workspace · no posed expressions' },
    { locale: 'en', title: 'Design at the bench', description: 'A jewelry designer · hands · a paper sketch · raw gold piece · warm studio light', renderingNote: 'documentary close · single warm light · still-life feel · no production polish' },
    { locale: 'en', title: 'The necklace in the box', description: 'An old necklace in a velvet box · opening slowly · window light · hands of a 60-year-old', renderingNote: 'macro · single warm light · documentary still-life · no studio' },
  ],
  legalConstraints: ['precious-metal labeling', 'gemstone disclosure', 'sourcing claims must be substantiated'],
  regulatorySensitivityWarnings: ['avoid "best gift" claims', 'avoid scarcity-deal language'],
};

// ────────────────────────────────────────────────────────────────
// 9 · COSMETICS · SKINCARE
// ────────────────────────────────────────────────────────────────

const COSMETICS: VerticalKnowledge = {
  id: 'cosmetics',
  displayName: 'Cosmetics · Anti-Overdone Skincare',
  supportedLocales: ['he', 'en'],
  audienceArchetypes: [
    { id: 'tired-of-overdone', label: 'Tired of overdone', demographic: '35-55 · women · had a 7-step routine that didn\'t deliver', psychographic: 'Wants 3 honest products · skeptical of influencer beauty' },
    { id: 'post-pregnancy-reset', label: 'Post-pregnancy reset', demographic: '30-42 · 6-18 months postpartum', psychographic: 'Doesn\'t want her old products · needs different texture · honesty about hormones' },
    { id: 'perimenopause-shift', label: 'Perimenopause shift', demographic: '42-55 · suddenly different products', psychographic: 'Won\'t tolerate anti-aging marketing' },
  ],
  customerPains: {
    he: ['פחד לבזבז כסף על מוצרים שלא עובדים', 'פחד להיראות זקנה (אבל לא מודה)', 'פיצוצים · רגישות', 'להיראות כמי שמשתדלת יותר מדי', 'לא לזהות את עצמך במראה'],
    en: ['Wasting money on stuff that doesn\'t work', 'Looking older (but won\'t admit you care)', 'Breakouts · sensitivity', 'Looking like you\'re trying too hard', 'Not recognizing yourself in the mirror'],
  },
  customerDesires: {
    he: ['עור שנראה כמו עור · לא פילטר', 'עור נקי · או מקובל', 'פשטות · 3 מוצרים · לא 12', 'זמן · 5 דקות שגרה · לא 20', 'להרגיש שאת עצמך'],
    en: ['Skin that looks like skin · not a filter', 'Clear or accepted skin', 'Simplicity · 3 products · not 12', 'Time back · 5-minute routine · not 20', 'Feel like yourself'],
  },
  buyingTriggers: {
    he: ['יום הולדת עם 0 או 5', 'התפרצות פתאומית', 'אחרי לידה · 3-12 חודשים', 'אחרי פרידה', 'חברה המליצה', 'ראית בתמונה משהו', 'שינוי בגיל המעבר'],
    en: ['Birthday with 0 or 5', 'Sudden breakout', 'Post-pregnancy · 3-12 months', 'Post-breakup', 'Friend recommendation', 'Saw it in a photo', 'Perimenopause shift'],
  },
  purchaseMoments: {
    he: ['שגרת בוקר · 06:30-07:30', 'ניקוי ערב · 22:00-23:00', 'הכנה לאירוע · חתונה · ראיון · דייט', 'אחרי מקלחת · חלון לחות 2 דקות', 'אריזה לטיול · בחירת 3 מוצרים', 'בוקר ראשון איטי'],
    en: ['Morning routine · 06:30-07:30', 'Evening cleanse · 22:00-23:00', 'Pre-event prep · wedding · interview · date', 'Post-shower 2-minute moisture window', 'Packing for travel · 3-product carry-on', 'Slow Sunday morning'],
  },
  trustSignals: {
    he: ['רכיבים פעילים מוצהרים · באחוזים', 'ללא ניסויים בבעלי חיים', 'ייצור בארץ · בעלת בית מרקחת מוסמכת', 'מוצרים בלי בשמים סינתטיים', 'דגימה ראשונה לבחינה · ₪0'],
    en: ['Active ingredients disclosed · with percentages', 'No animal testing', 'Locally made · certified pharmacist owner', 'No synthetic fragrances', 'First sample for testing · €0'],
  },
  proofTypes: ['founder skin reveal', 'ingredient explainer', 'before/after careful', 'UGC honest review', 'day-in-routine'],
  ctaStyles: {
    he: ['הזמיני דגימה ראשונה · ₪0.', 'בואי תקראי את הרכיבים.', 'נסי את השגרה של 3 מוצרים.'],
    en: ['Order a first sample · €0.', 'Come read the ingredients.', 'Try the 3-product routine.'],
  },
  ugcAnglePatterns: ['founder-skin-reveal', 'ingredient-explainer', 'before-after-careful', 'ugc-honest-review', 'day-in-routine'],
  bestPerformingAdFormats: ['founder skin reveal · no makeup', 'ingredient explainer 30-90sec', 'before/after careful · 3 weeks', 'UGC honest review', 'day-in-routine demo'],
  vocabulary: {
    required: {
      he: ['עור', 'פנים', 'קרם', 'שמן', 'לחות', 'רכיב', 'שגרה', 'חומרים פעילים', 'טבעי', 'קוסמטיקה', 'סרום', 'נוקה'],
      en: ['skin', 'face', 'cream', 'oil', 'moisture', 'ingredient', 'routine', 'active ingredients', 'natural', 'cosmetics', 'serum', 'cleanser'],
    },
    forbidden: {
      he: ['קסם', 'נס', 'מהפכה', 'חידוש פורץ דרך', 'זוהר ניצחי', 'אנטי-אייג\'ינג'],
      en: ['miracle', 'magic', 'revolution', 'breakthrough', 'eternal glow', 'anti-aging'],
    },
    forbiddenWrongCategory: ['שוקולד', 'קקאו', 'ריבוע', 'נוכחות', 'chocolate', 'cacao', 'presence', 'mood'],
  },
  emotionalTerritory: {
    he: 'להרגיש כמו עצמי · לא כמו פילטר של עצמי.',
    en: 'Feel like myself · not a filter of myself.',
  },
  oneLiners: [
    { locale: 'he', text: '3 מוצרים. לא 12.' },
    { locale: 'he', text: 'עור אמיתי · לא עור בפילטר.' },
    { locale: 'he', text: 'רכיבים שאת יכולה לקרוא. שגרה שאת זוכרת.' },
    { locale: 'en', text: 'Three products. Not twelve.' },
    { locale: 'en', text: 'Real skin · not filtered skin.' },
    { locale: 'en', text: 'Ingredients you can read. A routine you can remember.' },
  ],
  hooks: [
    { family: 'anti-marketing', locale: 'he', text: '47 מוצרים שאת לא צריכה.' },
    { family: 'ingredient-truth', locale: 'he', text: 'מה באמת בקרם הלחות שלך? בואי תקראי איתי.' },
    { family: 'real-photo', locale: 'he', text: 'בלי פילטר. בלי תיקונים. הפנים שלי הבוקר.' },
    { family: 'pain-mirror', locale: 'he', text: 'גם אני שכחתי איך נראה העור שלי בלי איפור.' },
    { family: 'founder-story', locale: 'he', text: 'בניתי את זה כי הפסקתי לסבול את הפנים שלי בעצמי.' },
    { family: 'anti-marketing', locale: 'he', text: 'בלי מודעות עם משפיעניות. בלי בטחות. רק רכיבים פעילים.' },
    { family: 'ingredient-truth', locale: 'he', text: 'ויטמין C 15%. אצידי הילורוני 2%. בלי ניסיון להסתיר.' },
    { family: 'real-photo', locale: 'he', text: 'תמונת שלוש שבועות. אותה תאורה. אותו זווית. בלי עריכה.' },
    { family: 'anti-marketing', locale: 'en', text: '47 products you don\'t need.' },
    { family: 'ingredient-truth', locale: 'en', text: 'What\'s actually in your moisturizer? Read it with me.' },
    { family: 'real-photo', locale: 'en', text: 'No filter. No edits. My face this morning.' },
    { family: 'pain-mirror', locale: 'en', text: 'I forgot what my skin looked like without makeup, too.' },
    { family: 'founder-story', locale: 'en', text: 'I built this because I stopped tolerating my own face.' },
    { family: 'anti-marketing', locale: 'en', text: 'No influencer ads. No promises. Just active ingredients.' },
    { family: 'ingredient-truth', locale: 'en', text: '15% vitamin C. 2% hyaluronic acid. Nothing hidden.' },
    { family: 'real-photo', locale: 'en', text: 'Three-week photos. Same light. Same angle. No edits.' },
  ],
  ugcScripts: [
    {
      locale: 'he',
      title: 'השגרה של 5 דקות',
      angle: 'day-in-routine',
      durationSec: 24,
      script: '[0-5] בוקר. שטיפה עם הנוקה. 30 שניות. [5-12] סרום. שלוש טיפות. שתי דקות לספיגה. [12-19] קרם לחות. דק יותר ממה שאתן רגילות. [19-24] חמש דקות. זה הכל. הולכת.',
      shotList: ['woman at sink washing face', 'serum drops on palm', 'cream being applied', 'woman walking out the door'],
      cta: 'הזמיני דגימה. נסי שבוע.',
    },
    {
      locale: 'he',
      title: 'הרכיבים האמיתיים',
      angle: 'ingredient-explainer',
      durationSec: 28,
      script: '[0-5] לקחתי את הקרם של מותג גדול. [5-12] הקראתי את הרכיבים. ארבעה רכיבים פעילים. כל השאר ממלאים. [12-20] בשלי יש שלושה רכיבים פעילים. אפס ממלאים. [20-28] לא בגלל שאני ממציאה. בגלל שאני לא צריכה לעבוד עם תקציב פרסום של מיליון.',
      shotList: ['two product bottles side by side', 'ingredient label close-up', 'pharmacist marking a list', 'serum on a counter'],
      cta: 'תקראי את הרכיבים אצלי.',
    },
    {
      locale: 'en',
      title: 'The 5-minute routine',
      angle: 'day-in-routine',
      durationSec: 24,
      script: '[0-5] Morning. Cleanser. 30 seconds. [5-12] Serum. Three drops. Two minutes to absorb. [12-19] Moisturizer. Thinner than you\'re used to. [19-24] Five minutes. That\'s it. Out the door.',
      shotList: ['woman at sink washing face', 'serum drops on palm', 'cream being applied', 'woman walking out the door'],
      cta: 'Order a sample. Try for a week.',
    },
    {
      locale: 'en',
      title: 'Real ingredients',
      angle: 'ingredient-explainer',
      durationSec: 28,
      script: '[0-5] I took a big-brand cream. [5-12] I read the ingredients. Four active. Everything else is filler. [12-20] Mine has three actives. Zero fillers. [20-28] Not because I\'m inventing. Because I don\'t have a million-dollar ad budget to pay for.',
      shotList: ['two product bottles side by side', 'ingredient label close-up', 'pharmacist marking a list', 'serum on a counter'],
      cta: 'Read the ingredients with me.',
    },
    {
      locale: 'he',
      title: 'הפנים בבוקר',
      angle: 'founder-skin-reveal',
      durationSec: 20,
      script: '[0-5] בלי פילטר. בלי איפור. הבוקר. [5-11] לפני שלוש שנים העור שלי היה רגיש. אדום. עייף. [11-16] שלושה מוצרים אחר כך, הוא נראה כמו עור של מישהי בת 38. [16-20] בלי הבטחות שיווקיות. בלי שגרה של 12 צעדים. רק רכיבים שעובדים.',
      shotList: ['woman\'s face close-up no filter', 'morning light through a window', 'three products lined up', 'woman walking past a mirror'],
      cta: 'נסי דגימה אצלי.',
    },
  ],
  imageConcepts: [
    { locale: 'he', title: 'בלי פילטר', description: 'אישה בת 42 · פנים נקיים · אור בוקר חלון · ידיים על הלחיים · בלי איפור · בלי עיבוד', renderingNote: 'documentary close · single window light · no filters · no studio · real skin texture' },
    { locale: 'he', title: 'שלושת המוצרים', description: 'שלוש בקבוקי קוסמטיקה על דלפק שיש · מגבת קפלים · מסך לבן ברקע · אור צהריים', renderingNote: 'still-life · single window light · no production polish' },
    { locale: 'he', title: 'הרכיבים על הקיר', description: 'רשימת רכיבים מודפסת · יד עם עט מסמן רכיב · קופסת מוצר פתוחה · אווירה של בית מרקחת', renderingNote: 'macro on document · single warm light · documentary still-life' },
    { locale: 'en', title: 'No filter', description: 'A 42-year-old woman · clean face · morning window light · hands on cheeks · no makeup · no edits', renderingNote: 'documentary close · single window light · no filters · no studio · real skin texture' },
    { locale: 'en', title: 'The three products', description: 'Three skincare bottles on a marble counter · folded towel · white wall background · midday light', renderingNote: 'still-life · single window light · no production polish' },
    { locale: 'en', title: 'Ingredients on the wall', description: 'A printed ingredients list · hand with a pen marking an ingredient · open product box · pharmacy atmosphere', renderingNote: 'macro on document · single warm light · documentary still-life' },
  ],
  legalConstraints: ['cosmetic-claim regulations', 'cannot promise medical results', 'ingredient disclosure required'],
  regulatorySensitivityWarnings: ['avoid "miracle" or "anti-aging" framing', 'avoid health claims unsupported by clinicals'],
};

// ────────────────────────────────────────────────────────────────
// 10 · CHOCOLATE (MOOD canonical · the only vertical where MOOD
//     language is permitted)
// ────────────────────────────────────────────────────────────────

const CHOCOLATE: VerticalKnowledge = {
  id: 'chocolate',
  displayName: 'Chocolate · Presence Tools',
  supportedLocales: ['he', 'en'],
  audienceArchetypes: [
    { id: 'presence-aware-adult', label: 'Presence-Aware Israeli Adult', demographic: '32-50 · urban · works full or hybrid · disposable income', psychographic: 'Presence-aware · had moments worth losing · wants to choose them back' },
  ],
  customerPains: {
    he: ['לאבד את החיים שעה אחת זומבית כל פעם', 'לא להיות נוכח בארוחות משפחתיות', 'הימים שמתחילים להתערבב', 'להרגיש שהמסך גנב את הערב', 'להתעורר ולא לזכור את אתמול'],
    en: ['Losing your life one zoned-out hour at a time', 'Being absent at family meals', 'Days that start to blur', 'The screen took the evening', 'Waking up and not remembering yesterday'],
  },
  customerDesires: {
    he: ['להיות נוכח בכוונה', 'להחזיר את הרגעים', 'לשמור על מה שכמעט אבד', 'לבחור את היום שלך · בלי לחץ', 'לסיים את היום נוכח'],
    en: ['Be present on purpose', 'Reclaim the moments', 'Keep what was almost lost', 'Choose your day · without pressure', 'End the day present'],
  },
  buyingTriggers: {
    he: ['לפני ארוחת שישי', 'לפני שהילדים נרדמים', 'לפני דייט', 'אחרי קפה שזיהית שלא עזר', 'לפני אימון', 'לפני הצגה או מצגת'],
    en: ['Before Friday lunch', 'Before kids sleep', 'Before a date', 'Post-coffee realization', 'Before a workout', 'Before a presentation'],
  },
  purchaseMoments: {
    he: ['בוקר שקט · 06:30 · ריבוע אחד', 'אחרי הילדים · מסדרון · ריבוע ביד', '15:30 משרד · ריבוע במגירה', 'ערב סלון · שני ריבועים · ספה', '13:00 שישי · ריבוע לפני ארוחה'],
    en: ['A quiet morning · 06:30 · one square', 'After the kids · hallway · a square in hand', '15:30 at the office · a square in the drawer', 'Living room evening · two squares · couch', '13:00 Friday · a square before lunch'],
  },
  trustSignals: {
    he: ['קקאו 70%+ · מקור ידוע', 'ללא תוספת חומרים מתעוררים', 'ארוז ידנית · אריזת בית', 'יצירה ישראלית · מעבדה משלנו', 'הריבוע שמופיע במחשבה אחת לפני שהיום מתחיל'],
    en: ['Cacao 70%+ · sourced transparently', 'No added stimulants', 'Hand-packed · home-feel packaging', 'Made in Israel · our own kitchen', 'The square that appears in one thought before the day begins'],
  },
  proofTypes: ['documentary 50mm photography', 'still-life · single light', 'couple-on-couch UGC', 'post-bedtime-hallway shot', 'kitchen-counter UGC'],
  ctaStyles: {
    he: ['נסה ריבוע אחד היום.', 'הזמן חבילה ראשונה.', 'בחר רגע. נחכה.'],
    en: ['Try one square today.', 'Order a first pack.', 'Pick a moment. We\'ll be here.'],
  },
  ugcAnglePatterns: ['kitchen-counter-ritual', 'post-bedtime-hallway', 'couch-evening-shared', 'office-drawer-square'],
  bestPerformingAdFormats: ['documentary 50mm photo', 'still-life with steam', 'couch UGC · candle', 'post-bedtime hallway UGC', 'kitchen-counter ritual'],
  vocabulary: {
    required: {
      he: ['שוקולד', 'קקאו', 'ריבוע', 'רגע', 'נוכחות', 'בית', 'יום', 'שקט', 'מותר', 'טעם'],
      en: ['chocolate', 'cacao', 'square', 'moment', 'presence', 'home', 'day', 'quiet', 'permission', 'taste'],
    },
    forbidden: {
      he: ['מהפכה', 'בלינג', 'ענקי', 'אבקה', 'נוסטרופיק', 'ביוהאקינג'],
      en: ['revolution', 'bling', 'huge', 'powder', 'nootropic', 'biohacking'],
    },
    /** Chocolate is the only vertical that may use its own canon. */
    forbiddenWrongCategory: [],
  },
  emotionalTerritory: {
    he: 'הרגע שכמעט אבד.',
    en: 'The moment you almost lost.',
  },
  oneLiners: [
    { locale: 'he', text: 'ריבוע אחד. רגע אחד. יום שלם.' },
    { locale: 'he', text: 'שוקולד שמחזיר לך נוכחות ברגעים שאחרת היו אובדים.' },
    { locale: 'he', text: 'מותר לבחור רגע אחד נקי היום.' },
    { locale: 'en', text: 'One square. One moment. A whole day.' },
    { locale: 'en', text: 'Chocolate that returns presence to moments that would have been lost.' },
    { locale: 'en', text: 'You\'re allowed to choose one clean moment today.' },
  ],
  hooks: [
    { family: 'truth-mirror', locale: 'he', text: 'אתה לא צריך עוד מוצר. אתה צריך רגע.' },
    { family: 'permission', locale: 'he', text: 'מותר לעצור ולקחת ריבוע.' },
    { family: 'curiosity', locale: 'he', text: 'מה אם הרגע שלך כבר היה כאן · ופספסת אותו?' },
    { family: 'invitation', locale: 'he', text: 'נסה ריבוע אחד מחר בבוקר. תראה את הבוקר שאחרי.' },
    { family: 'sensory', locale: 'he', text: 'קקאו 70% · ריבוע אחד · על השפתיים · ארבע שניות של נוכחות.' },
    { family: 'truth-mirror', locale: 'he', text: 'הילדים לא יזכרו את המסך שלך. הם יזכרו אם היית שם.' },
    { family: 'permission', locale: 'he', text: 'מותר לבחור משהו אחד נקי היום.' },
    { family: 'sensory', locale: 'he', text: 'הריבוע נמס · הריח עולה · הבית נשמע אחרת.' },
    { family: 'truth-mirror', locale: 'en', text: 'You don\'t need another product. You need a moment.' },
    { family: 'permission', locale: 'en', text: 'You\'re allowed to stop and take a square.' },
    { family: 'curiosity', locale: 'en', text: 'What if your moment was already here · and you missed it?' },
    { family: 'invitation', locale: 'en', text: 'Try one square tomorrow morning. See the morning after.' },
    { family: 'sensory', locale: 'en', text: '70% cacao · one square · on the lip · four seconds of presence.' },
    { family: 'truth-mirror', locale: 'en', text: 'The kids won\'t remember the screen. They\'ll remember if you were there.' },
    { family: 'permission', locale: 'en', text: 'You\'re allowed to choose one clean thing today.' },
  ],
  ugcScripts: [
    {
      locale: 'he',
      title: 'הריבוע של 06:30',
      angle: 'kitchen-counter-ritual',
      durationSec: 18,
      script: '[0-4] 06:30. הילדים עוד ישנים. [4-9] ריבוע אחד. כוס מים. [9-14] שלוש דקות לפני שהיום מתחיל. [14-18] זה היום שלי. השאר זה תגובה.',
      shotList: ['kitchen counter at dawn', 'hand opening a wrapper', 'cup of water on the counter', 'window light through curtains'],
      cta: 'נסה את הבוקר שלך.',
    },
    {
      locale: 'he',
      title: 'אחרי הילדים',
      angle: 'post-bedtime-hallway',
      durationSec: 20,
      script: '[0-5] השעה 21:40. דלת חדר הילדים נסגרה. [5-12] אני לוקח ריבוע מהמגירה. הולך לסלון. [12-17] הטלפון על שולחן הקפה. הפנים למטה. [17-20] חמש דקות שקטות. שלי.',
      shotList: ['hallway after bedtime', 'hand reaching for a drawer', 'silent living room', 'phone face-down on a table'],
      cta: 'בחר רגע. נחכה.',
    },
    {
      locale: 'en',
      title: 'The 06:30 square',
      angle: 'kitchen-counter-ritual',
      durationSec: 18,
      script: '[0-4] 06:30. The kids are still sleeping. [4-9] One square. A glass of water. [9-14] Three minutes before the day starts. [14-18] That\'s my day. The rest is reaction.',
      shotList: ['kitchen counter at dawn', 'hand opening a wrapper', 'cup of water on the counter', 'window light through curtains'],
      cta: 'Try your morning.',
    },
    {
      locale: 'en',
      title: 'After the kids',
      angle: 'post-bedtime-hallway',
      durationSec: 20,
      script: '[0-5] 21:40. The kids\' door is closed. [5-12] I take a square from the drawer. I walk to the living room. [12-17] My phone is on the coffee table. Face down. [17-20] Five quiet minutes. Mine.',
      shotList: ['hallway after bedtime', 'hand reaching for a drawer', 'silent living room', 'phone face-down on a table'],
      cta: 'Choose a moment. We\'ll be here.',
    },
    {
      locale: 'he',
      title: 'ערב חמישי',
      angle: 'couch-evening-shared',
      durationSec: 22,
      script: '[0-5] ערב חמישי. שני ריבועים על השולחן. [5-12] שני אנשים על הספה. הטלפונים הפוכים. [12-17] שיחה אחת אמיתית של שעה. [17-22] השוקולד הזה לא עושה דבר חוץ מלסמן רגע. וזה מה שצריך.',
      shotList: ['two squares on a wood table', 'couple on a couch', 'phones face-down', 'window into a quiet street'],
      cta: 'הזמן חבילה ראשונה.',
    },
  ],
  imageConcepts: [
    { locale: 'he', title: 'הריבוע של הבוקר', description: 'דלפק מטבח · 06:30 · ריבוע שוקולד 70% על נייר · כוס מים · אור חלון משמאל · אין אנשים בפריים', renderingNote: 'documentary still-life · single window light · no studio · no posed hands' },
    { locale: 'he', title: 'מסדרון אחרי שינה', description: 'מסדרון בית · דלת חדר ילדים סגורה · יד אוחזת בריבוע · הולכת לסלון · אור חם של מנורה', renderingNote: 'documentary 50mm · single warm light · real adult · no theatre' },
    { locale: 'he', title: 'הספה של החמישי', description: 'סלון · ספה · שני אנשים · שני ריבועים על שולחן הקפה · טלפונים הפוכים · נר · אווירה רגועה', renderingNote: 'documentary 50mm · candlelit · single warm source · no posed expressions' },
    { locale: 'en', title: 'The morning square', description: 'Kitchen counter · 06:30 · 70% chocolate square on a wrapper · glass of water · window light from the left · no people in frame', renderingNote: 'documentary still-life · single window light · no studio · no posed hands' },
    { locale: 'en', title: 'Hallway after bedtime', description: 'Home hallway · kids\' room door closed · hand holding a square · walking to the living room · warm lamp light', renderingNote: 'documentary 50mm · single warm light · real adult · no theatre' },
    { locale: 'en', title: 'Thursday couch', description: 'Living room · couch · two people · two squares on a coffee table · phones face-down · candle · calm atmosphere', renderingNote: 'documentary 50mm · candlelit · single warm source · no posed expressions' },
  ],
  legalConstraints: ['food labeling per Israeli standards', 'cannot promise nootropic effects'],
  regulatorySensitivityWarnings: ['avoid health-claim language', 'avoid biohacking framing'],
};

// ────────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────────

export const VERTICAL_KNOWLEDGE_BASE: Record<VerticalId, VerticalKnowledge> = {
  'real-estate': REAL_ESTATE,
  'accountant': ACCOUNTANT,
  'lawyer': LAWYER,
  'fitness': FITNESS,
  'restaurant': RESTAURANT,
  'saas': SAAS,
  'hvac': HVAC,
  'jewelry': JEWELRY,
  'cosmetics': COSMETICS,
  'chocolate': CHOCOLATE,
};

export const ALL_VERTICAL_IDS: VerticalId[] = [
  'real-estate', 'accountant', 'lawyer', 'fitness', 'restaurant',
  'saas', 'hvac', 'jewelry', 'cosmetics', 'chocolate',
];

export function getVertical(id: VerticalId): VerticalKnowledge {
  const v = VERTICAL_KNOWLEDGE_BASE[id];
  if (!v) throw new Error(`unknown vertical: ${id}`);
  return v;
}
