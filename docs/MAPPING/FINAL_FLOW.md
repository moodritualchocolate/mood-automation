# MOOD · הזרימה הסופית (מקור אמת — GAME V1 NEW BUILD, עם Codex)

מקור: Google Drive · "MOOD — GAME V1 — NEW BUILD" · Core Loop Specification + Game Constitution.
זו שכבת האמת העליונה. כל מסמכי המיפוי האחרים כפופים לה.

## הלולאה הסופית
```
Open Day → Discover → Recognition → Identification → Opportunity → Exit to Life →
Return → Chose Differently / Not Yet → Witness → Living Memory → Tomorrow Path
```
- **Open Day / Discover** — פתיחת היום ובחירת/גילוי רגע (מטא, לוח הבית).
- **Recognition → … → Witness** — גוף הרגע (בדיוק 10 מסכי ההפקה ב-Drive).
- **Living Memory** — הרגע הופך לזיכרון חי (ספרייה/דיוקן).
- **Tomorrow Path** — הדרך למחר (התקדמות, שובך מחר).

## מיפוי הלולאה → 10 מסכי ההפקה
| שלב בלולאה | קובץ הפקה |
|---|---|
| Recognition | `01_recognition` |
| Identification | `02_identification` |
| Opportunity | `03_opportunity` |
| Exit to Life | `04_exit_to_life` |
| Return | `05_return` |
| Chose Differently / Not Yet | `06a_chose_differently` / `06b_not_yet` |
| Witness | `08a_witness_chose_differently` / `08b_witness_not_yet` |
| Continuation → Tomorrow Path | `10_continuation` |
| Open Day · Discover · Living Memory | מסכי מטא (מנוע) — לוח הרגעים (5 קונספטים) + ספרייה |

## חוקי state (מ-Codex)
- Recognition מציג אמת יומיומית; לא מסביר מידה.
- Identification: "זה אני" / "לא ממש" — בלי פרופיל פסיכולוגי.
- Opportunity: פעולה אחת קונקרטית וקטנה.
- Exit to Life: מסיר UI, משחרר את המשתמש אל החיים.
- Return: לעולם לא שואל "הצלחת?".
- שני הענפים מקבלים זמן, אמנות ועומק **שווי ערך**.
- Witness: מראה תוצאה או פתח — לא חוזר על הפעולה.
- Continuation: משאיר את החיים בתנועה.

## חוקי זמן
- אין חובה לסיים ביום קלנדרי אחד. Return יכול לקרות אחרי דקות/שעות/ימים.
- אחרי היעדרות — חוזרים לנקודת אמת בטוחה, **בלי penalty**.
- Reminder רק בהסכמה, בחלון שהמשתמש בחר, בניסוח שאינו מניח כישלון.

## Definition of Done
- כל state נגיש RTL + screen reader.
- Offline/Online אינו מאבד בחירה. אין dead end בשום branch.
- Analytics לא כולל reflection text.
- בדיקת אדם: גם "עוד לא" מסתיים בתקווה אמינה.

## החוקה (עקרונות בלתי ניתנים למיקוח)
החיים לפני זמן מסך · תקווה לפני אשמה · סקרנות לפני שיפוט · בחירה לפני כפייה ·
כנות לפני הישג · עומק לפני עומס · משמעות לפני retention מלאכותי · Privacy+Accessibility מהיום הראשון.
**הגדרת ניצחון:** מחוץ למסך. המוצר יודע רק מה שהמשתמש בחר לספר לעצמו — לא מאמת, מדרג או מאבחן.

## איסורים (קריטי להנדסה)
- אין streaks מענישים / ניקוד מוסרי / XP / leaderboard / FOMO.
- אין הוכחת פעולה / מצלמה / מיקום / דירוג מוסרי.
- אין טיפול / אבחון / הבטחת שינוי / שפה מטיפה.
- אין "עוד לא" חשוך או קצר יותר.
- אין טקסט בתוך נכסי אמנות; אין שינוי זהות דמויות ללא אישור.
- **אין Hardcoded copy ואין Moment-specific conditionals** → המנוע חייב להיות data-driven לחלוטין
  (קורא מהספרייה/רجיסטר; שום טקסט או תנאי ספציפי-לרגע בקוד).

## מבחן ארבע השאלות (לכל החלטה)
האם זה אנושי? · האם זה ברור? · האם זה יפה גם בלי אפקטים? · האם זה עוזר לאדם לחיות אחרת מחוץ למסך?

## השלכות למנוע שאני בונה
1. המנוע קורא הכל מדאטה (רגע → מצבים → נכסים) — בלי copy קשיח. (הגרסה הנוכחית ב-`moment.html` מקודדת רגע לדוגמה; יש להחליף למנוע data-driven מלא.)
2. חייב לתמוך במטא-לולאה: Open Day · Discover · Living Memory · Tomorrow Path — לא רק גוף הרגע.
3. Return א-סינכרוני (דקות/ימים), שמירת בחירה Offline, בלי penalty, reminder בהסכמה בלבד.
4. שני הענפים שווי-ערך; "עוד לא" לעולם לא נחות.
