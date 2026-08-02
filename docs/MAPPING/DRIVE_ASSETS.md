# MOOD · מיפוי נכסי ה-Drive → זרימת המשחק → המנוע

מקור: Google Drive של nadav.izhaki89 (משותף, קריאה). סרוק 2026-07-30→07-19.
זהו הגשר: מה בנית, איך זה ממופה לזרימה, ואיך זה מתחבר למנוע (במקום קודקס).

## 1. מה קיים ב-Drive (הפקת המשחק)
**MOOD Human Library V1 — Full Production** (`1kIKfWK9YWR7vMU2QRzojnObFr_708dZh`)
- **03 — GAME BUILD READY — MOMENTS 001–030** (`1Fn6hM6FyvHUJ5cwvNY3Ya-ved-pnlamX`)
  - **00 — START HERE** (`1ijXMMptQV3xQLS2mF57D0b2uwfTBYbe-`) — README, PRODUCTION_MAP, MASTER_ASSET_INDEX, readiness report.
  - **01 — MOMENTS 001–030** (`1xvNTpoMNVbKmU9aM0Yz7J2qRwANMl9MC`) — פרקים → תיקיית רגע → **03 — SCREENS** (מצבי הזרימה).
  - **02 — VISUAL BIBLE MASTER** (`1wni_aq3abwn_pGBZd-C3NroAPeHmrnsN`) — Character/Environment/Prop/Lighting/Color/Composition/Emotional-Progression/Continuity/Review/Production bibles + 00_MASTER_REVIEW (state walls).
  - **03 — REGISTRIES/INDEXES/REPORTS** (`1fONvnXEDAnw2gJz9SSC6DXlIgtLCpKm6`) — `moment_registry.json` (`1zLB7pItpf1X5Fg2Z_mMMlW3BUX35EDlJ`), character/environment/prop/palette registries, production_status.
  - **04 — ARCHIVES** — 22× zip parts (~94MB) של ההפקה המלאה.
- **לוח הרגעים — 5 קונספטים** (`1NLt8QzNdL91gZ3AADrcuVwH5417plJoR`) — 5 קונספטים ללוח הבית: garden / constellation / living-mosaic / five-doors / future-memory.
- **GAME V1 — NEW BUILD** (Docs `1AhhVazWCtMjKDNVFHKFiFucOBX7kzjPl` · MD twin `1p7Ic1tq_t3vfJK9P8xm0hUQUqMipjqFG`) — מסמכי התכנון של קודקס: Game Constitution, Core Loop Spec, Meta Game, Vertical Slice, Architecture, Design System, User Journey D1/7/30/100, Phase-0 bundle.

## 2. זרימת המשחק האמיתית (מקודדת בשמות הקבצים!)
כל רגע מופק כ-**10 מסכי מצב** בשמות קבועים — זו הזרימה הסופית, אין צורך להמציא:
| קובץ | מצב בזרימה |
|---|---|
| `01_recognition.png` | זיהוי הרגע |
| `02_identification.png` | הרגשה / שיום הרגש |
| `03_opportunity.png` | ההזדמנות (נקודת הבחירה) |
| `04_exit_to_life.png` | יציאה אל החיים (עשה את זה במציאות) |
| `05_return.png` | חזרה אחרי הפעולה |
| `06a_chose_differently.png` | תוצאה — **בחרתי אחרת** |
| `06b_not_yet.png` | תוצאה — **עוד לא** |
| `08a_witness_chose_differently.png` | עדות — בחרתי אחרת |
| `08b_witness_not_yet.png` | עדות — עוד לא |
| `10_continuation.png` | המשך → הרגע הבא |
+ לכל רגע: 3 נכסי המשכיות (character/environment/prop_continuity) ו-4 נכסי סקירה (contact_sheet, decision_storyboard, mobile_sequence, silent_story_sheet).
State-walls ב-00_MASTER_REVIEW מקבצים את כל 30 לפי מצב: recognition_wall, opportunity_wall, connected_witness_wall, not_yet_witness_wall, story_state_matrix, library_contact_overview.

## 3. 30 הרגעים (10 קטגוריות × 3) — רשמי
מפורט ב-`content/drive_mirror/moment_registry.json`. הקטגוריות: phone · parents · partner · children · work · friends · road · self · people · conversations.
כל רגע: `screens:10, canvas:1080x1920, approved:false, approval_status:art_review_required` (טרם אישור אנושי סופי).

## 4. איך זה מתחבר למנוע (הצנרת שאני בונה, במקום קודקס)
- **קודקס** הפיק: (א) מסמכי תכנון (GAME V1 NEW BUILD), (ב) העלה גרסה ל-repo שעדיין "לא נראית טוב".
- **התמונות** (Human Library) הן הנכס האמיתי — כבר ממופות למצבי הזרימה.
- **המנוע שלי** (`site/moment.html`) קורא נכס לכל מצב דרך `getAsset({moment,state,branch})`. צריך רק **ליישר שמות** לשמות ההפקה (recognition/identification/opportunity/exit_to_life/return/06a/06b/08a/08b/10_continuation) ולהזין את התמונות.
- **סנכרון תמונות**: הורדה מ-Drive → `site/assets/moments/<moment_id>/` בשמות הנ"ל. (יש לי גישת קריאה + download_file_content; אפשר למשוך אוטומטית לרגע נבחר.)

## 5. פערים / הערות
- כל 30 הרגעים במצב `art_review_required` (approved:false) — טרם אישור אנושי סופי ל"MOOD Illustrated".
- אינוונטר ה-leaf ברמת כל 500 הקבצים לא הושלם (search_files דרש אישור לסוכן; לי הוא עובד — אפשר להשלים ספירה מדויקת לכל רגע לפי דרישה).
- תיקיות ישנות שלא נכנסו לעומק: "Production Review 001-010", "Moment 001 Final Review", "נכסים לאפליקציה", "02 FULL ARCHIVE PARTS".

## 6. סטטוס המיפוי — ✅ הושלם
- [x] זרימת המשחק הסופית — מזוהה ומקודדת (10 מצבים לרגע).
- [x] 30 הרגעים הרשמיים — `content/drive_mirror/moment_registry.json`.
- [x] מבנה ה-Drive + מזהי תיקיות — מסמך זה.
- [x] בנק טקסט הנוכחות (מהספר) — `content/book/presence_moments.json`.
- [x] הצנרת להטמעה — מוגדרת (getAsset ↔ שמות ההפקה ↔ סנכרון מ-Drive).
