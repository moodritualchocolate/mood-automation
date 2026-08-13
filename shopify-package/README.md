# MOOD Ritual — Shopify Upload Package

חבילת העלאה מלאה ל-Shopify עבור **mood ritual chocolate**.

## מבנה החבילה

```
shopify-package/
├── README.md               ← המדריך הזה
├── products/
│   └── products.csv        ← ייבוא מוצרים (Products → Import)
├── theme/                  ← ערכת עיצוב Liquid (Themes → Add → Upload zip)
│   ├── layout/theme.liquid
│   ├── templates/          ← index.json, product.json, collection.json, page.json, blog.json, article.json, cart.liquid, 404.liquid, search.json
│   ├── sections/           ← header, footer, announcement-bar, hero-video, credibility-strip, product-grid, faq, purchase-selector, sticky-buy, main-product, rich-text, header-group.json, footer-group.json
│   ├── snippets/           ← product-card, meta-tags
│   ├── config/             ← settings_schema.json, settings_data.json
│   ├── locales/            ← he.default.json, en.json
│   └── assets/             ← theme.css, theme.js, logo, favicons
├── pages/                  ← HTML גולמי לדפי Shopify
│   ├── club.html
│   ├── blog.html
│   └── policies.html
└── assets-media/           ← וידאו, פאוצ׳ים, פוסטרים — להעלאה ל-Content → Files
```

---

## סדר העלאה מומלץ

### 1. ערכת עיצוב (Theme)
1. יוצרים ZIP של תיקיית `theme/` בלבד:
   ```bash
   cd shopify-package && zip -r mood-theme.zip theme/
   ```
2. Shopify Admin → **Online Store → Themes → Add theme → Upload zip file** → מעלים `mood-theme.zip`.
3. אחרי ההעלאה — **Actions → Preview** לוודא שהעיצוב נטען.
4. עדיין לא ללחוץ Publish — קודם מעלים מוצרים ותפריטים.

### 2. Files (מדיה)
1. Shopify Admin → **Content → Files → Upload files** → מעלים את כל התוכן של `assets-media/`:
   - `hero-desktop.mp4`, `hero-mobile.mp4`, `hero-poster-desktop.jpg`, `hero-poster-mobile.jpg`
   - `mood-pouch-energy.jpg`, `mood-pouch-relax.jpg`, `mood-pouch-sleep.jpg`
   - `mood-hero-three-moments.jpg` וכל תמונות ה-lifestyle
2. שופיי ייתן לכל קובץ URL אוטומטי בפורמט `shopify://files/<filename>` — הערכה מפנה אליהם בטמפלטים.

### 3. Products (מוצרים)
1. Shopify Admin → **Products → Import** → מעלים `products/products.csv`.
2. מקבלים 4 מוצרים:
   - `mood-energy` — 3 וריאנטים: 30 / 60 / 90 קוביות
   - `mood-relax` — 3 וריאנטים
   - `mood-sleep` — 3 וריאנטים
   - `mood-full-day` — וריאנט יחיד
3. אם התמונות לא נטענות מה-URL הציבורי (GitHub Pages), ניתן לערוך כל מוצר ולעלות ידנית את התמונה מ-`assets-media/`.
4. מלאי — כרגע `Inventory Qty=0` עם policy=continue (מכירה גם באפס). לעדכן לפי הצורך.

### 4. Collections (קטלוגים)
- ליצור קולקציה `all` (אוטומטי בשופיי).
- אופציונלי: קולקציה `formulas` שמאגדת את שלוש הפורמולות + Full Day. מפנים אליה מהסקשן "Product grid".

### 5. Navigation (תפריטים)
Shopify Admin → **Online Store → Navigation**:
- **Main menu** (`main-menu`):
  - מוצרים → `/collections/all` (או `/collections/formulas`)
  - היום המלא → `/products/mood-full-day` (מוסיפים tag `nav-fd` כדי לקבל את הבולט הזהוב)
  - הסיפור → `/pages/about`
  - מועדון לקוחות → `/pages/club`
  - בלוג → `/blogs/news`
- **Footer menu** (`footer`): קישורים למדיניות, יצירת קשר וכו׳.

### 6. Pages (דפים סטטיים)
Shopify Admin → **Online Store → Pages → Add page**:
- **About / הסיפור** — פותחים page ריק, לוחצים על צלמית `<>` (HTML view), מדביקים את התוכן מ-`pages/club.html` (הסקציות הרלוונטיות).
- **מועדון לקוחות** — page חדש, מדביקים את `pages/club.html`.
- **מדיניות** — page חדש, מדביקים את `pages/policies.html`.

### 7. Blog
Shopify Admin → **Online Store → Blog posts**:
- יוצרים בלוג בשם `news`.
- לכל פוסט: מדביקים את התוכן מ-`pages/blog.html` (חותכים לפי מאמר).

### 8. Publish theme
לאחר שהכל מוכן — Shopify Admin → **Themes → Actions → Publish** על ערכת mood-theme.

---

## התאמות אחרי ההעלאה

### עריכת התוכן במקטע Hero
Themes → Customize → Home page → **Hero video**:
- Desktop video URL: `shopify://files/hero-desktop.mp4`
- Mobile video URL: `shopify://files/hero-mobile.mp4`
- Poster image: העלאה מ-Files
- Headline line 1: `Chocolate`
- Headline line 2: `made to do more`
- CTA text: `SHOP NOW`, CTA link: `#formulas`

### עריכת ה-Credibility strip
Themes → Customize → **Credibility strip**:
- Headline: `השוקולד שלנו פותח עם אלוף העולם בשוקולד 2022`
- Blocks: `70% קקאו`, `0 גרם סוכר`, `פורמולה בוטנית`, `כשר פרווה`, `תוצרת ישראל`

### התאמת צבעים
Themes → Customize → **Theme settings → Brand**:
- Ink: `#171512` (טקסט)
- Paper: `#fdfaf3` (רקע)
- Gold: `#b98d3d` (הדגשות)

---

## הערות חשובות

- **RTL** — כל התבניות בעברית `dir="rtl"`. אם רוצים English store, לשנות ב-`theme.liquid`.
- **CSS** — הקובץ `theme/assets/theme.css` הוא ה-CSS המלא מ-mayven.html (~460KB). אין מינימיזציה — לפני production מומלץ להריץ CSSNano.
- **JS** — `theme/assets/theme.js` (~22KB) כולל את כל האינטראקטיביות (הכרוזלים, ה-FAQ collapse, ה-shimmer, ה-mobile menu וכו׳).
- **הבסיס** — הערכה בנויה על OS 2.0 עם `templates/*.json` + `sections/*.liquid` + `header-group.json` / `footer-group.json`. תואמת לגרסאות Shopify העדכניות ביותר.
- **מוצר סרט** — הסקשן `purchase-selector.liquid` ממפה `id` בטופס `product` של שופיי לוריאנטים אמיתיים — אחרי ייבוא ה-CSV הוא יעבוד ישירות.

---

## תמיכה
בעיה בהעלאה? כתבו ל-hello@mood-chocolate.com עם:
1. השלב שבו נתקעתם
2. הודעת השגיאה המלאה מ-Shopify

**גרסה:** 1.0.0 · תאריך: 2026-08-13
