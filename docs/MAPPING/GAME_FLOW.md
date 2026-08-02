# MOOD · שיטת המיפוי — זרימת המשחק הסופית + מיפוי תמונות

> ⚠️ **עודכן אחרי סריקת ה-Drive:** מודל המצבים הסמכותי הוא **10 מסכי ההפקה** לכל רגע —
> ראה `DRIVE_ASSETS.md` ו-`content/drive_mirror/moment_registry.json`:
> `01_recognition · 02_identification · 03_opportunity · 04_exit_to_life · 05_return ·
> 06a_chose_differently · 06b_not_yet · 08a_witness_chose_differently · 08b_witness_not_yet · 10_continuation`.
> החלוקה למטה (immediate/short/long) הייתה ההנחה שלי לפני הסריקה — היא הוחלפה במודל ההפקה למעלה.
> העיקרון (זיהוי → הזדמנות → בחירה → תוצאה → עדות → חכמה → המשך, שני מסלולים) זהה.

מסמך זה מגדיר את (1) זרימת המשחק הקבועה, (2) סכמת הנכסים, (3) מטריצת התמונות הנדרשות לכל רגע.

## 1. המבנה הקבוע של המשחק
- **פרק = מידה** (הראשון: נוכחות). כל פרק מכיל **רגעים** (נוכחות: 30, ב־6 קטגוריות).
- כל רגע הוא **סיטואציה מהחיים** שהשחקן מזהה ("הייתי שם") + זרימה קבועה עם **שני מסלולים** (בחרתי אחרת / עוד לא) — לעולם לא הצלחה/כישלון.

## 2. מסך קבוע — 9:16 (1080×1920), 4 אזורים
| אזור | גובה | תוכן |
|---|---|---|
| 1 · Safe עליון | 8% | שלב, חזרה, פּיפּים (בקוד) |
| 2 · סצנה | 52–58% | **האיור** (מה־Drive) — הסיטואציה עצמה |
| 3 · מסר | 15–20% | טקסט (בקוד, עברית) — כותרת/שאלה/חכמה |
| 4 · בחירות | 20–25% | כפתורים (בקוד) — זית=נוכחות · כתום=ביניים · סגול=עוד לא |

חוק: אין עברית בתוך האיור · הכפתורים/טקסט בקוד · האיור מובן גם בלי טקסט.

## 3. זרימת המצבים (state machine) לכל רגע
```
recognition  ──► feel_check ──► opportunity ──► choice
                                                 ├─ B present  (בחרתי אחרת)
                                                 └─ A not_yet  (עוד לא)
 [per branch]:  immediate ──► short_term ──► long_term ──► wisdom ──► witness ──► world ──► continuation
```
- הצורה המלאה (13 מצבים) והמקוצרת (7 מצבים) שתיהן חוקיות; תרשים הזרימה של הרגע קובע אילו מצבים נדרשים.
- **witness** = השינוי השקט הקשור לסצנה (טלפון הפוך, ילד קרוב יותר, שתי כוסות).
- **wisdom** = דף מחברת/פתק, מקום ריק לציטוט (הטקסט+מקור בקוד).
- **world** = העולם המאויר משתנה לפי משמעות הבחירה (אור/שביל/עלה/חלון שנדלק).

## 4. סכמת נכסים (getAsset)
```
getAsset({ moment, state, branch, device })  →  assets/moments/<moment_id>/<file>.png
```
מוסכמת שמות קבצים (מתוך ה־manifest):
```
01_recognition · 02_choice_stay (present) · 02_choice_phone (not_yet)
03_immediate_<branch> · 04_short_<branch> · 05_long_<branch>
06_wisdom · 08_witness_<branch> · world_<branch> · 13_continuation
```
כל רגע כולל `manifest.json` ו־`contact_sheet.png`. המנוע לעולם לא פונה לשם קובץ ידני — רק דרך getAsset.

## 5. מטריצת נכסים לרגע מלא (13 תמונות)
| # | state | branch | קובץ | תמונה קיימת (Drive) |
|---|---|---|---|---|
| 1 | recognition | — | 01_recognition.png | ⬜ |
| 2 | choice | present | 02_choice_stay.png | ⬜ |
| 3 | choice | not_yet | 02_choice_phone.png | ⬜ |
| 4 | immediate | present | 03_immediate_present.png | ⬜ |
| 5 | immediate | not_yet | 03_immediate_notyet.png | ⬜ |
| 6 | short_term | present | 04_short_present.png | ⬜ |
| 7 | short_term | not_yet | 04_short_notyet.png | ⬜ |
| 8 | long_term | present | 05_long_present.png | ⬜ |
| 9 | long_term | not_yet | 05_long_notyet.png | ⬜ |
| 10 | witness | present | 08_witness_present.png | ⬜ |
| 11 | witness | not_yet | 08_witness_notyet.png | ⬜ |
| 12 | wisdom | — | 06_wisdom.png | ⬜ |
| 13 | world | present | world_present.png | ⬜ |
| 14 | world | not_yet | world_notyet.png | ⬜ |
| 15 | continuation | — | 13_continuation.png | ⬜ |

מינימום להרגשה מלאה של רגע: recognition, choice×2, immediate×2, long×2, wisdom, world×2 (≈9).

## 6. חוק שני המסלולים (ויזואלי)
- **present / בחרתי אחרת**: שינוי קטן ושקט — אור חם יותר, קשר עין, פחות חפצים מפרידים. לא חגיגה.
- **not_yet / עוד לא**: לעולם לא חושך/אשמה/אכזבה — הסצנה נשארת פתוחה, אור קטן נשאר, הדרך עדיין כאן.

## 7. סטטוס המיפוי
- [x] זרימת המשחק — הובנה ומקודדת (מסמך זה).
- [x] בנק 30 רגעי הנוכחות כדאטה — `content/book/presence_moments.json`.
- [x] רגע מלא לדוגמה כדאטה + חבילת פרומפטים — `presence_phone_conversation_001`.
- [ ] אינוונטר התמונות מה־Drive — בסריקה (סוכן), יוזן לעמודה "תמונה קיימת".
- [ ] הצלבה סופית תמונה↔מצב + רשימת חוסרים לכל רגע.
