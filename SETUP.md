# הקמה — קישור חי שנשמר מכל הטלפונים

כדי שתוכל/י לשמור מכמה טלפונים בו-זמנית בזמן אמת, צריך שני שירותים
חינמיים: **Supabase** (מסד הנתונים המשותף) ו-**Vercel** (האחסון שנותן את
הקישור). שניהם בחינם וההקמה לוקחת כ-10 דקות. צריך לבצע פעם אחת בלבד.

---

## שלב 1 — מסד נתונים משותף (Supabase)

1. היכנס/י ל-https://supabase.com והתחבר/י (Sign in with GitHub).
2. **New project** → תן/י שם (למשל `mood`), בחר/י סיסמה ואזור (Frankfurt).
   להמתין ~2 דקות עד שהפרויקט מוכן.
3. בתפריט הצד: **SQL Editor → New query**.
4. העתק/י את **כל** התוכן של הקובץ `supabase/schema.sql` שבפרויקט, הדבק/י
   והרץ/י (**Run**). זה יוצר את הטבלה והסנכרון בזמן אמת.
5. בתפריט הצד: **Project Settings → API**. שמור/י שני ערכים:
   - **Project URL**  (משהו כמו `https://abcd.supabase.co`)
   - **anon public** key  (מחרוזת ארוכה)

---

## שלב 2 — פריסה וקבלת הקישור (Vercel)

1. היכנס/י ל-https://vercel.com והתחבר/י (Sign in with GitHub).
2. **Add New… → Project** ובחר/י את המאגר `moodritualchocolate/mood-automation`.
3. תחת **Production Branch** בחר/י את הענף:
   `claude/mood-procurement-hub-uo3yo8`
   (או שתמזג/י אותו ל-`main` קודם — ראו הערה למטה).
4. תחת **Environment Variables** הוסף/י:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | ה-Project URL מ-Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | מפתח ה-anon public |

   (רשות) `ANTHROPIC_API_KEY` — כדי ש-"נתח ספק" ישתמש ב-Claude.
5. **Deploy**. אחרי דקה תקבל/י קישור כמו `https://mood-xxxx.vercel.app`.

זהו — פותחים את הקישור מכל טלפון/מחשב, וכל שינוי שנשמר מופיע מיד אצל כולם.
אפשר להוסיף את הקישור למסך הבית באייפון (Share → Add to Home Screen) והוא
יתנהג כמו אפליקציה.

---

## הערות

- **בלי backend** האפליקציה עדיין עובדת מצוין, אבל כל מכשיר שומר מקומית
  לעצמו. רק לאחר חיבור Supabase הנתונים משותפים בין מכשירים.
- **גישה:** בברירת המחדל כל מי שיש לו את הקישור יכול לקרוא ולכתוב (ללא
  התחברות), כדי שיהיה נוח לעבוד מכמה טלפונים. שמרו על הקישור בתוך הצוות.
  לנעילה עתידית: להפעיל Supabase Auth ולשנות את ההרשאות ב-`schema.sql`
  מ-`{anon, authenticated}` ל-`{authenticated}` בלבד.
- **קבצים** נשמרים כיום מוטמעים בתוך הרשומה. לקבצים גדולים/הרבה קבצים מומלץ
  לעבור ל-Supabase Storage (ה-bucket מוכן בסכמה הקודמת אם תרצו).
