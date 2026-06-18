# MOOD Procurement Hub

מרכז השליטה ברכש של **MOOD Ritual Chocolate** — מערכת Web App לניהול תהליך
איתור, בדיקה, השוואה ובחירת ספקים, מהפנייה הראשונה ועד אישור הספק הסופי.

> Mobile-first · Realtime · עברית (RTL) כברירת מחדל + English (LTR) · רמת מוצר SaaS.

---

## הפעלה מהירה

```bash
npm install
npm run dev      # http://localhost:3000
```

המערכת רצה **מיד**, ללא צורך ב-backend: הנתונים נשמרים בדפדפן ומסונכרנים
בזמן אמת בין כל הטאבים/החלונות הפתוחים (Local mode). יש נתוני הדגמה מובנים.

לבנייה לפרודקשן:

```bash
npm run build && npm run start
```

---

## יכולות עיקריות

| מודול | תיאור |
|------|--------|
| **Dashboard** | ספקים פעילים/ממתינים, דוגמאות בדרך, הצעות, מאושרים, משימות, התראות, צבר ופעילות אחרונה |
| **Suppliers** | כרטיס לכל ספק: פרטים, סטטוס, חומרי גלם, ציר זמן, דוגמאות, הצעות, קבצים, משימות |
| **Timeline** | תיעוד כרונולוגי של כל שיחה / מייל / פגישה |
| **Log Conversation** | הדבקת טקסט חופשי → המערכת מזהה אוטומטית ספק, סטטוס ומשימות המשך |
| **חומרי גלם** | עיסת קקאו · חמאת קקאו · אלולוז · לציטין — עם שדות ייעודיים לכל סוג |
| **Sample Center** | ניהול וטעימת דוגמאות (טעם, מרקם, נמס בפה, ציון, התאמה ל-MOOD) |
| **Quote Center** | טבלת הצעות מחיר עם סימון המחיר הזול ביותר |
| **Comparison Center** | השוואה מקבילה של מספר ספקים: מחיר, MOQ, מדינה, טעם, דירוג, ציון כולל |
| **Files** | COA · TDS · הצעות · מיילים · תעודות · תמונות |
| **Tasks** | מערכת משימות עם יעדים והתראות איחור |
| **Search** | חיפוש גלובלי (⌘K) על פני ספקים, חומרי גלם, ציר זמן, משימות וקבצים |
| **AI Assistant** | "נתח ספק" → יתרונות, חסרונות, סיכונים, השוואה לאחרים והמלצה |
| **הרשאות** | Admin · Manager · Viewer (Viewer לקריאה בלבד) |

כל פעולה נשמרת אוטומטית, עם חיווי "נשמר" בראש המסך.

---

## טכנולוגיה

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — design system עם תמיכת light/dark ו-RTL/LTR מלא
- **Zustand** — ניהול state, שמירה אוטומטית ו-realtime בין טאבים (BroadcastChannel)
- **Supabase** — backend אופציונלי לפרודקשן (Auth · Postgres · Realtime · Storage)
- **PWA** — `manifest.webmanifest`, מותאם להתקנה באייפון
- **Claude API** — אופציונלי, מעצים את ניתוח הספק

---

## מצב ענן (Supabase) — אופציונלי

המערכת עובדת מצוין במצב מקומי. כדי לאפשר עבודה מרובת-משתמשים מכמה
מכשירים בזמן אמת:

1. צרו פרויקט ב-[Supabase](https://app.supabase.com).
2. הריצו את `supabase/schema.sql` ב-SQL Editor (טבלאות, Realtime, RLS, Storage).
3. העתיקו `.env.example` ל-`.env.local` ומלאו:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. (רשות) הגדירו `ANTHROPIC_API_KEY` כדי ש-"נתח ספק" ישתמש ב-Claude.

החיווי בהגדרות יעבור ל-"Supabase מחובר" כשהמשתנים קיימים.

---

## מבנה הפרויקט

```
src/
  app/                 דפי האפליקציה (App Router) + /api/analyze
  components/          UI ורכיבי מודולים (טפסים, חיפוש, ניתוח AI, shell)
  lib/
    i18n/              מילון he/en + ספק שפה (RTL/LTR, זיכרון שפה)
    store.ts           state מרכזי, שמירה אוטומטית, realtime בין טאבים
    types.ts           מודל הנתונים
    parse.ts           זיהוי חכם של שיחה חופשית (ספק/סטטוס/משימות)
    analyze.ts         מנוע ניתוח ספק (היוריסטי / Claude)
    supabase/          לקוחות Supabase (browser/server)
supabase/schema.sql    סכמת ה-backend המלאה
```

המעבר בין מצב מקומי לענן הוא דרך שכבת נתונים אחת (`lib/store` ↔ `lib/supabase`),
כך שה-UI אינו תלוי במקור הנתונים.
