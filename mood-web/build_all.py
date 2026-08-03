#!/usr/bin/env python3
"""Build energy.html / relax.html / sleep.html from the single ENERGY template.

energy.tpl.html is the design source of truth. RELAX and SLEEP are derived by
applying per-SKU text/colour/image replacements, so any design change made to
the template propagates to all three when this script is re-run.
"""
import base64, pathlib, sys, re

ROOT = pathlib.Path(__file__).parent
ASSETS = ROOT / "assets"
MIME = {".jpg":"image/jpeg",".jpeg":"image/jpeg",".png":"image/png",".webp":"image/webp"}

def data_uri(fname):
    p = ASSETS / fname
    if not p.exists():
        sys.exit(f"missing asset: {p}")
    mime = MIME.get(p.suffix.lower(), "application/octet-stream")
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()

# ---- shared source blocks (must match energy.tpl.html exactly) ----
SRC_ROOT = "  --accent:#D9855E;--accent-ink:#9E5230;--accent-soft:#F4E5D9;\n  --cta:#B85510;--green:#C6D4B8;--green-ink:#3E4A34;"
SRC_WHY = """  <section class="why split">
    <div class="rv">
      <div class="eyebrow">WHY ENERGY</div>
      <h2 style="margin-top:10px">רגע קטן<br>שמחזיר אתכם לקצב.</h2>
      <p class="lede" style="margin-top:14px;color:var(--muted)">לא זריקת קפאין — חמישה רכיבים טבעיים, כל אחד עושה את שלו לשחרור אנרגיה איטי ומדויק. הנה מה יש בפנים:</p>
      <div class="benefits">
        <div style="--dc:#CF7A3C"><b>רודיולה · 660 מ״ג</b><span>אדפטוגן שמפחית תחושת עייפות ותומך בחוסן ובמיקוד</span></div>
        <div style="--dc:#7E9153"><b>תה ירוק · 80 מ״ג</b><span>קפאין טבעי עם L־תאנין — ערנות רגועה בלי רעד</span></div>
        <div style="--dc:#B5763F"><b>קינמון · 40 מ״ג</b><span>תומך באיזון סוכר בדם לאנרגיה יציבה, בלי נפילה</span></div>
        <div style="--dc:#C99A57"><b>ליקוריץ · 13 מ״ג</b><span>שורש מסורתי לתמיכה בחיוניות לאורך היום</span></div>
        <div style="--dc:#6E4A30"><b>גוארנה · 7 מ״ג</b><span>שחרור קפאין איטי שמאריך את האפקט</span></div>
      </div>
    </div>
    <div class="rv fpanel">
      <div class="fburst"><img src="__FORMULA__" alt="פורמולת ENERGY — רודיולה 660, תה ירוק 80, קינמון 40, ליקוריץ 13, גוארנה 7 מ״ג" loading="lazy" decoding="async"></div>
    </div>
  </section>"""
SRC_MOMENTS = """      <div class="mitem rv"><b class="mnum">01</b><div class="minfo"><b>לפני האימון</b><p>אנרגיה נקייה לתנועה, בלי כובד.</p></div></div>
      <div class="mitem rv"><b class="mnum">02</b><div class="minfo"><b>במהלך העבודה</b><p>מיקוד בלי הרעד של אחר הצהריים.</p></div></div>
      <div class="mitem rv"><b class="mnum">03</b><div class="minfo"><b>לפני שהילדים חוזרים</b><p>להיטען מחדש לפני הסבב הבא.</p></div></div>"""
SRC_REVIEWS = """      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"במקום הקפה של אחר הצהריים. ערנית בלי הרעד, וטעים בטירוף."</q><div class="by">— מיכל, תל אביב</div></div>
      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"ריבוע אחד ב־16:30 ואני ממשיך את היום. הפך לטקס."</q><div class="by">— יונתן, חיפה</div></div>
      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"לא האמנתי שאמצא משהו במקום קפה. השוקולד עצמו ברמה אחרת."</q><div class="by">— דנה, ירושלים</div></div>"""
SRC_FAQ12 = """      <div class="item open"><button class="q">מה מיוחד ב־ENERGY?<span class="pm">+</span></button><div class="panel"><p>שוקולד מריר פרמיום 70% קקאו עם מלח ים, ללא סוכר ובלי טעמים מוספים, עם פורמולה פונקציונלית של 800 מ״ג (רודיולה, תה ירוק, קינמון, ליקוריץ, גוארנה) — אנרגיה שעולה לאט לרגע שצריך בו יותר תנועה ומיקוד.</p></div></div>
      <div class="item"><button class="q">כמה קפאין יש בריבוע?<span class="pm">+</span></button><div class="panel"><p>קפאין טבעי עדין — פחות מרבע כוס קפה בקוביה. בלי הרעד ובלי הנפילה.</p></div></div>
      <div class="item"><button class="q">מתי לוקחים?<span class="pm">+</span></button><div class="panel"><p>ריבוע אחד ביום — ב־16:30 במקום הקפה השלישי, לפני איסופים, או בבוקר.</p></div></div>"""
SRC_XSELL = """      <a class="xcard rv" href="#"><div class="th" style="background:#E5ECE1"><img src="__RELAX__" alt="RELAX" loading="lazy"></div><div><div class="eyebrow" style="color:#5E7358"><i style="background:#8FA98C"></i>RELAX · EVENING</div><h3>לכבות את הרעש.</h3><p>לערב שהראש עדיין מהיר בו.</p></div><div class="go" style="color:#5E7358">←</div></a>
      <a class="xcard rv" href="#"><div class="th" style="background:#E1E7F0"><img src="__SLEEP__" alt="SLEEP" loading="lazy"></div><div><div class="eyebrow" style="color:#566B8E"><i style="background:#8AA0C4"></i>SLEEP · NIGHT</div><h3>לעבור למצב לילה.</h3><p>לרגע השקט שלפני השינה.</p></div><div class="go" style="color:#566B8E">←</div></a>"""

def why_split(sku, h2, lede, benefits, alt):
    return f"""  <section class="why split">
    <div class="rv">
      <div class="eyebrow">WHY {sku}</div>
      <h2 style="margin-top:10px">{h2}</h2>
      <p class="lede" style="margin-top:14px;color:var(--muted)">{lede}</p>
      <div class="benefits">
{benefits}
      </div>
    </div>
    <div class="rv fpanel">
      <div class="fburst"><img src="__FORMULA__" alt="{alt}" loading="lazy" decoding="async"></div>
    </div>
  </section>"""

def xcard(img, thbg, eyec, dotc, kicker, h3, p):
    return (f'      <a class="xcard rv" href="#"><div class="th" style="background:{thbg}">'
            f'<img src="{img}" alt="{kicker}" loading="lazy"></div><div>'
            f'<div class="eyebrow" style="color:{eyec}"><i style="background:{dotc}"></i>{kicker}</div>'
            f'<h3>{h3}</h3><p>{p}</p></div><div class="go" style="color:{eyec}">←</div></a>')

ENERGY_X = xcard("__ENERGYX__","#F4E5D9","#9E5230","#D9855E","ENERGY · DAY","לחזור לקצב.","לרגע שבו האנרגיה נופלת.")
RELAX_X  = xcard("__RELAX__","#E5ECE1","#4C6138","#7E9B63","RELAX · EVENING","לכבות את הרעש.","לערב שהראש עדיין מהיר בו.")
SLEEP_X  = xcard("__SLEEP__","#E1E7F0","#3C5480","#7C93BE","SLEEP · NIGHT","לעבור למצב לילה.","לרגע השקט שלפני השינה.")

# ---- per-SKU config ----
SKUS = {
 "energy": {"images":{"__HERO__":"energy_hero.jpg","__PACKBAR__":"choc_packbar.jpg","__MOODS__":"choc_moods.jpg","__FORMULA__":"formula_energy.jpg","__CHOC__":"choc_dark.jpg","__RELAX__":"sku_relax.png","__SLEEP__":"sku_sleep.png","__ENERGYX__":"energy_hero.jpg"},
   "repl":[]},
 "relax": {
   "images":{"__HERO__":"relax_hero.jpg","__PACKBAR__":"sku_relax.png","__MOODS__":"choc_dark.jpg","__FORMULA__":"formula_relax.jpg","__CHOC__":"choc_dark.jpg","__RELAX__":"sku_relax.png","__SLEEP__":"sku_sleep.png","__ENERGYX__":"energy_hero.jpg"},
   "repl":[
    (SRC_ROOT, "  --accent:#7E9B63;--accent-ink:#4C6138;--accent-soft:#E7EEDD;\n  --cta:#55702F;--green:#C6D4B8;--green-ink:#3E4A34;"),
    ("linear-gradient(180deg,#C25E14,#B85510)","linear-gradient(180deg,#607D34,#55702F)"),
    ("rgba(184,85,16,.34)","rgba(85,112,47,.34)"),
    ("linear-gradient(180deg,#FBF7F2 0%,#F4E9DE 100%)","linear-gradient(180deg,#F7F9F1 0%,#E9EFDD 100%)"),
    ("rgba(158,82,48,.16)","rgba(76,97,56,.16)"),
    ("#EAD3C2","#D4DEC4"),
    ("mood ENERGY — עמוד מוצר","mood RELAX — עמוד מוצר"),
    ("‹ <b>ENERGY</b>","‹ <b>RELAX</b>"),
    ('alt="mood ENERGY — אישה מחזיקה את השקית"','alt="mood RELAX — אישה מחזיקה את השקית"'),
    ("<h1>ENERGY</h1>","<h1>RELAX</h1>"),
    ("רגע קטן שמחזיר אתכם לקצב — פורמולה פונקציונלית של 800 מ״ג בשוקולד מריר פרמיום 70% קקאו עם מלח ים, ללא סוכר.",
     "רגע לכבות בו את הרעש — פורמולה פונקציונלית של 700 מ״ג בשוקולד מריר פרמיום 70% קקאו עם מלח ים, ללא סוכר."),
    ('<a href="#reviews">127 ביקורות</a>','<a href="#reviews">94 ביקורות</a>'),
    ("פורמולת <b>800 מ״ג</b> · חמישה רכיבים טבעיים · אנרגיה שעולה לאט, בלי הרעד והנפילה של הקפה.",
     "פורמולת <b>700 מ״ג</b> · חמישה רכיבים טבעיים · הרפיה עדינה לערב, בלי כובד ובלי תלות."),
    ("אנרגיה בלי הנפילה של הקפה","הרפיה עדינה בסוף היום"),
    ("<b>800 מ״ג</b> פורמולה","<b>700 מ״ג</b> פורמולה"),
    # WHY block -> single column
    (SRC_WHY, why_split("RELAX","רגע לכבות בו<br>את הרעש.",
      "לא כדור שינה — חמישה רכיבים טבעיים, כל אחד עושה את שלו להרפיה עדינה ורגועה. הנה מה יש בפנים:",
      '        <div style="--dc:#7E9153"><b>מליסה · 266 מ״ג</b><span>עלה מרגיע שמפחית מתח ומרגיע את הגוף</span></div>\n'
      '        <div style="--dc:#9A7FB0"><b>פסיפלורה · 182 מ״ג</b><span>משקיטה את הראש בעדינות, בלי טשטוש</span></div>\n'
      '        <div style="--dc:#C9A05A"><b>מאקה · 140 מ״ג</b><span>שורש אדפטוגני לאיזון ותמיכה בגוף</span></div>\n'
      '        <div style="--dc:#6E8B6A"><b>ולריאן · 70 מ״ג</b><span>צמח מסורתי להרפיה ולערב רגוע</span></div>\n'
      '        <div style="--dc:#C99A57"><b>ליקוריץ · 42 מ״ג</b><span>שורש תומך לאיזון לאורך היום</span></div>',
      "פורמולת RELAX — מליסה 266, פסיפלורה 182, מאקה 140, ולריאן 70, ליקוריץ 42 מ״ג")),
    # moments
    (SRC_MOMENTS,
     '      <div class="mitem rv"><b class="mnum">01</b><div class="minfo"><b>אחרי יום ארוך</b><p>לכבות הילוך ולנשום רגע.</p></div></div>\n'
     '      <div class="mitem rv"><b class="mnum">02</b><div class="minfo"><b>לפני שנרדמים</b><p>להוריד את הראש מהרעש.</p></div></div>\n'
     '      <div class="mitem rv"><b class="mnum">03</b><div class="minfo"><b>עם ספר על הספה</b><p>רגע רך שהוא רק שלכם.</p></div></div>'),
    ("איך ENERGY משתלב בשגרה?","איך RELAX משתלב בשגרה?"),
    ("מבוסס על 127 ביקורות","מבוסס על 94 ביקורות"),
    (SRC_REVIEWS,
     '      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"ריבוע אחרי שהילדים ישנים — הכתפיים יורדות והראש נרגע."</q><div class="by">— נועה, רמת גן</div></div>\n'
     '      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"החלפתי את הכוסית של הערב בזה. רגוע יותר, בלי כבדות בבוקר."</q><div class="by">— אורי, תל אביב</div></div>\n'
     '      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"טעם מדהים והרגע הכי נעים ביום. הפך לטקס של הערב."</q><div class="by">— שירה, מודיעין</div></div>'),
    (SRC_FAQ12,
     '      <div class="item open"><button class="q">מה מיוחד ב־RELAX?<span class="pm">+</span></button><div class="panel"><p>שוקולד מריר פרמיום 70% קקאו עם מלח ים, ללא סוכר ובלי טעמים מוספים, עם פורמולה פונקציונלית של 700 מ״ג (מליסה, פסיפלורה, מאקה, ולריאן, ליקוריץ) — הרפיה עדינה לערב, בלי כובד ובלי תלות.</p></div></div>\n'
     '      <div class="item"><button class="q">האם זה מרדים או מטשטש?<span class="pm">+</span></button><div class="panel"><p>לא. RELAX מרגיע בעדינות ומוריד הילוך — בלי טשטוש ובלי כבדות בבוקר.</p></div></div>\n'
     '      <div class="item"><button class="q">מתי לוקחים?<span class="pm">+</span></button><div class="panel"><p>ריבוע אחד בערב — אחרי יום ארוך, לפני שמתמקמים על הספה, או בדרך למיטה.</p></div></div>'),
    (SRC_XSELL, ENERGY_X + "\n" + SLEEP_X),
    ("<b>ENERGY</b><small","<b>RELAX</b><small"),
    ('src="__PACKBAR__" alt="mood ENERGY"','src="__PACKBAR__" alt="mood RELAX"'),
   ]},
 "sleep": {
   "images":{"__HERO__":"sleep_hero.jpg","__PACKBAR__":"sku_sleep.png","__MOODS__":"choc_dark.jpg","__FORMULA__":"formula_sleep.jpg","__CHOC__":"choc_dark.jpg","__RELAX__":"sku_relax.png","__SLEEP__":"sku_sleep.png","__ENERGYX__":"energy_hero.jpg"},
   "repl":[
    (SRC_ROOT, "  --accent:#7C93BE;--accent-ink:#3C5480;--accent-soft:#E4E9F2;\n  --cta:#3B5488;--green:#C6D4B8;--green-ink:#3E4A34;"),
    ("linear-gradient(180deg,#C25E14,#B85510)","linear-gradient(180deg,#45609A,#3B5488)"),
    ("rgba(184,85,16,.34)","rgba(59,84,136,.34)"),
    ("linear-gradient(180deg,#FBF7F2 0%,#F4E9DE 100%)","linear-gradient(180deg,#F5F7FB 0%,#E4E9F2 100%)"),
    ("rgba(158,82,48,.16)","rgba(60,84,128,.16)"),
    ("#EAD3C2","#C9D3E5"),
    ("mood ENERGY — עמוד מוצר","mood SLEEP — עמוד מוצר"),
    ("‹ <b>ENERGY</b>","‹ <b>SLEEP</b>"),
    ('alt="mood ENERGY — אישה מחזיקה את השקית"','alt="mood SLEEP — אישה מחזיקה את השקית"'),
    ("<h1>ENERGY</h1>","<h1>SLEEP</h1>"),
    ("רגע קטן שמחזיר אתכם לקצב — פורמולה פונקציונלית של 800 מ״ג בשוקולד מריר פרמיום 70% קקאו עם מלח ים, ללא סוכר.",
     "רגע לעבור בו למצב לילה — פורמולה פונקציונלית של 728 מ״ג בשוקולד מריר פרמיום 70% קקאו עם מלח ים, ללא סוכר."),
    ('<a href="#reviews">127 ביקורות</a>','<a href="#reviews">88 ביקורות</a>'),
    ("פורמולת <b>800 מ״ג</b> · חמישה רכיבים טבעיים · אנרגיה שעולה לאט, בלי הרעד והנפילה של הקפה.",
     "פורמולת <b>728 מ״ג</b> · ארבעה רכיבים טבעיים · מעבר רך למצב לילה, בלי כבדות בבוקר."),
    ("אנרגיה בלי הנפילה של הקפה","מעבר רך למצב לילה"),
    ("<b>800 מ״ג</b> פורמולה","<b>728 מ״ג</b> פורמולה"),
    ("<b>5</b> רכיבים טבעיים","<b>4</b> רכיבים טבעיים"),
    (SRC_WHY, why_split("SLEEP","רגע לעבור בו<br>למצב לילה.",
      "לא כדור שינה — ארבעה רכיבים טבעיים, כל אחד עושה את שלו למעבר רך אל השינה. הנה מה יש בפנים:",
      '        <div style="--dc:#7E9153"><b>מליסה · 224 מ״ג</b><span>עלה מרגיע שמכין את הגוף למנוחה</span></div>\n'
      '        <div style="--dc:#9A7FB0"><b>פסיפלורה · 224 מ״ג</b><span>משקיטה מחשבות ומרגיעה את המערכת</span></div>\n'
      '        <div style="--dc:#5E7BA8"><b>ולריאן · 224 מ״ג</b><span>צמח מסורתי לשינה עמוקה ורציפה</span></div>\n'
      '        <div style="--dc:#C99A57"><b>ליקוריץ · 56 מ״ג</b><span>שורש תומך לאיזון</span></div>',
      "פורמולת SLEEP — מליסה 224, פסיפלורה 224, ולריאן 224, ליקוריץ 56 מ״ג")),
    (SRC_MOMENTS,
     '      <div class="mitem rv"><b class="mnum">01</b><div class="minfo"><b>שעה לפני השינה</b><p>לאותת לגוף שהיום נגמר.</p></div></div>\n'
     '      <div class="mitem rv"><b class="mnum">02</b><div class="minfo"><b>אחרי ערב מול מסך</b><p>להוריד את הראש מהגירויים.</p></div></div>\n'
     '      <div class="mitem rv"><b class="mnum">03</b><div class="minfo"><b>כשהראש לא נכבה</b><p>מעבר רך אל השקט.</p></div></div>'),
    ("איך ENERGY משתלב בשגרה?","איך SLEEP משתלב בשגרה?"),
    ("מבוסס על 127 ביקורות","מבוסס על 88 ביקורות"),
    (SRC_REVIEWS,
     '      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"ריבוע חצי שעה לפני השינה ואני נרדמת בלי להתהפך שעה."</q><div class="by">— טל, חיפה</div></div>\n'
     '      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"קמתי רענן, בלי הכבדות של כדורי שינה. וגם טעים."</q><div class="by">— רון, ירושלים</div></div>\n'
     '      <div class="rcard rv"><div class="top"><span class="stars">★★★★★</span><span class="vf">קונה מאומת</span></div><q>"הפך לחלק מהטקס של הלילה. הראש נרגע והשינה עמוקה יותר."</q><div class="by">— יעל, תל אביב</div></div>'),
    (SRC_FAQ12,
     '      <div class="item open"><button class="q">מה מיוחד ב־SLEEP?<span class="pm">+</span></button><div class="panel"><p>שוקולד מריר פרמיום 70% קקאו עם מלח ים, ללא סוכר ובלי טעמים מוספים, עם פורמולה פונקציונלית של 728 מ״ג (מליסה, פסיפלורה, ולריאן, ליקוריץ) — מעבר רך אל השינה, בלי כבדות בבוקר.</p></div></div>\n'
     '      <div class="item"><button class="q">יש בזה מלטונין?<span class="pm">+</span></button><div class="panel"><p>לא. SLEEP מבוסס על צמחים מרגיעים (מליסה, פסיפלורה, ולריאן) שעוזרים לגוף להיכנס למצב לילה בעדינות.</p></div></div>\n'
     '      <div class="item"><button class="q">מתי לוקחים?<span class="pm">+</span></button><div class="panel"><p>ריבוע אחד כחצי שעה לפני השינה — אחרי ערב מול מסך, או כשהראש לא מצליח להיכבות.</p></div></div>'),
    (SRC_XSELL, ENERGY_X + "\n" + RELAX_X),
    ("<b>ENERGY</b><small","<b>SLEEP</b><small"),
    ('src="__PACKBAR__" alt="mood ENERGY"','src="__PACKBAR__" alt="mood SLEEP"'),
   ]},
}

def main():
    tpl = (ROOT/"energy.tpl.html").read_text(encoding="utf-8")
    fonts = (ROOT/"fonts-embed.css").read_text(encoding="utf-8")
    for sku, cfg in SKUS.items():
        html = tpl
        for find, rep in cfg["repl"]:
            if find not in html:
                sys.exit(f"[{sku}] replacement target not found:\n{find[:80]}...")
            html = html.replace(find, rep)
        html = html.replace("/*__FONTS__*/", fonts)
        for marker, fname in cfg["images"].items():
            if marker in html:
                html = html.replace(marker, data_uri(fname))
        left = re.findall(r"__[A-Z]+__", html)
        if left:
            sys.exit(f"[{sku}] unreplaced markers: {set(left)}")
        out = ROOT/f"{sku}.html"
        out.write_text(html, encoding="utf-8")
        print(f"built {out.name} ({out.stat().st_size/1024:.0f} KB)")
    # NOTE: home.html is the APPROVED homepage and is built by build_home.py
    # from approved/ (the signed-off source of truth). Do NOT regenerate it here.

if __name__ == "__main__":
    main()
