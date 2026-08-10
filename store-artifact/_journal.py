# -*- coding: utf-8 -*-
"""MOOD Journal (blog) + Club page.

Content comes from articles.json — the 27 Hebrew articles exported from the
team's blog handoff (base + trend + sprint sets), with their original images.
Design follows the store: warm cream, hairline rules, flat pill buttons.
"""
import json
import os
import html as _html

_HERE = os.path.dirname(os.path.abspath(__file__))
ARTICLES = json.load(open(os.path.join(_HERE, 'articles.json'), encoding='utf-8'))

MOOD_HE = {'Sleep': 'שינה', 'Energy': 'אנרגיה', 'Relax': 'רוגע', 'All': 'כללי'}
MOOD_COLOR = {'Sleep': '#6E86B8', 'Energy': '#E05A00', 'Relax': '#7E9153', 'All': '#8a6a45'}
PRODUCT_ROUTE = {'Sleep': '/sleep', 'Energy': '/energy', 'Relax': '/relax'}

CSS = """
*{box-sizing:border-box}
body{margin:0;background:#f7f3ed;color:#171512;font-family:'Heebo','Assistant',Arial,sans-serif;line-height:1.75;-webkit-font-smoothing:antialiased}
img{max-width:100%}
a{color:inherit}
/* ---------- header: the store's bar, same framed logo ---------- */
header.jh{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.97);backdrop-filter:blur(10px);
  border-bottom:1px solid #e7ddd0;padding:10px 5vw;display:flex;justify-content:space-between;align-items:center;gap:12px}
header.jh a{text-decoration:none}
.jlogo{display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border:1.4px solid #241b12;
  border-radius:8px;background:#fff;font-size:20px;font-weight:900;letter-spacing:-1.3px;line-height:1.15;
  direction:ltr;unicode-bidi:isolate}
.jlogo i{font-style:normal;color:#E05A00}
.jback{font-weight:800;font-size:13px;color:#6b5a48;white-space:nowrap}
.jtel{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;
  border:1.4px solid #e2d7c8;background:#fff;color:#c14e00;flex:0 0 auto;transition:background .16s,border-color .16s}
.jtel:hover{background:#fff3e4;border-color:#E05A00}
/* reading progress — the one flourish, store-orange */
.jbar{position:fixed;top:0;left:0;height:3px;width:0;background:#E05A00;z-index:40;transition:width .12s linear}
.wrap{width:min(1120px,calc(100% - 34px));margin:0 auto}
.narrow{width:min(700px,calc(100% - 34px));margin:0 auto}
.eyebrow{font-size:11px;font-weight:900;letter-spacing:.2em;color:#E05A00;text-transform:uppercase}
h1{font-size:clamp(34px,7vw,64px);line-height:1.01;letter-spacing:-.04em;margin:10px 0 0}
h2{font-size:clamp(22px,4.2vw,31px);line-height:1.13;letter-spacing:-.03em;margin:34px 0 10px}
p{margin:0 0 16px;color:#443c33}
.lead{font-size:clamp(16px,3.6vw,19px);color:#5e5449;font-weight:600}
.meta{font-size:12px;color:#948a7e;font-weight:700}

/* ---------- BLOG masthead — the brand's own cut-paper collage ---------- */
.jmast{position:relative;overflow:hidden;background:#241b12}
.jmast>img{width:100%;height:min(64vw,470px);object-fit:cover;display:block}
.jmast-tag{position:absolute;left:0;right:0;bottom:0;z-index:3;margin:0;padding:26px 20px 18px;text-align:center;
  color:#f6ecdd;font-size:clamp(13px,2.5vw,17px);font-weight:800;line-height:1.5;
  background:linear-gradient(0deg,rgba(30,20,12,.86),rgba(30,20,12,.45) 55%,transparent)}
/* editorial band that carries a brand photo mid-page */
.jband{position:relative;margin:30px 0 4px;border-radius:22px;overflow:hidden;background:#241b12}
.jband img{width:100%;height:min(46vw,300px);object-fit:cover;display:block;opacity:.86}
.jband .jb-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:20px;color:#fff}
.jband .jb-in b{font-size:clamp(20px,3.4vw,30px);font-weight:900;letter-spacing:-.03em;line-height:1.15;
  text-shadow:0 3px 18px rgba(0,0,0,.5)}
.jband .jb-in span{margin-top:8px;font-size:13.5px;color:rgba(255,255,255,.9);font-weight:700;
  text-shadow:0 2px 12px rgba(0,0,0,.5)}
/* ---------- index masthead ---------- */
.mast{padding:34px 0 6px}
.mast .rule{height:1px;background:#e2d7c8;margin:22px 0 0}
.chips{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:14px 0 2px}
.chips::-webkit-scrollbar{display:none}
.chip{flex:0 0 auto;font-size:12.5px;font-weight:800;padding:8px 15px;border-radius:999px;background:#fff;
  border:1px solid #e7ddd0;color:#6b5a48;cursor:pointer;font-family:inherit;transition:background .15s,color .15s,border-color .15s}
.chip.on{background:#241b12;color:#fff;border-color:#241b12}
/* ---------- featured: full-bleed image, copy underneath ---------- */
.feat{display:block;text-decoration:none;margin:16px 0 4px}
.feat .fi{position:relative;border-radius:22px;overflow:hidden;background:#efe7db}
.feat img{width:100%;height:min(62vw,420px);object-fit:cover;display:block;transition:transform .6s cubic-bezier(.2,.7,.2,1)}
.feat:hover img{transform:scale(1.03)}
.feat .fb{padding:16px 2px 4px}
.feat .ttl{font-size:clamp(23px,5vw,38px);font-weight:900;letter-spacing:-.035em;line-height:1.08;margin:8px 0 7px}
.feat .ex{color:#6b6259;font-size:15px;margin:0 0 9px;max-width:640px}
/* ---------- rows: hairline list on phones, editorial grid on desktop ---------- */
.rows{margin:22px 0 6px;border-top:1px solid #e2d7c8}
.row{display:grid;grid-template-columns:1fr 108px;gap:15px;align-items:center;padding:16px 2px;
  border-bottom:1px solid #e2d7c8;text-decoration:none}
.row:hover .rt{color:#c14e00}
.row .ri{border-radius:12px;overflow:hidden;background:#efe7db}
.row img{width:108px;height:80px;object-fit:cover;display:block;transition:transform .5s}
.row:hover img{transform:scale(1.05)}
.rk{font-size:10px;font-weight:900;letter-spacing:.15em;color:var(--mc,#E05A00)}
.rt{font-size:17px;font-weight:900;letter-spacing:-.025em;line-height:1.24;margin:5px 0 4px;transition:color .15s}
.rx{font-size:13px;color:#7a7067;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rm{font-size:11.5px;color:#a3988b;font-weight:700;margin-top:6px}
.empty{padding:26px 2px;color:#8a7c6a;font-weight:700}
@media (min-width:901px){
  .rows{display:grid;grid-template-columns:repeat(3,1fr);gap:0 30px;border-top:0;margin-top:26px}
  .row{grid-template-columns:1fr;gap:0;align-items:start;padding:0 0 22px;border-bottom:0}
  .row .ri{margin-bottom:12px}
  .row img{width:100%;height:210px}
  .rt{font-size:19px;margin-top:7px}
  .rx{-webkit-line-clamp:3}
  .empty{grid-column:1/-1}
  .feat{display:grid;grid-template-columns:1.25fr 1fr;gap:34px;align-items:center;margin:22px 0 10px}
  .feat img{height:390px}
  .feat .fb{padding:0}
  .mast{padding:44px 0 4px}
}
/* ---------- article ---------- */
.ahero{position:relative;background:#241b12}
.ahero img{width:100%;height:min(72vw,520px);object-fit:cover;display:block;opacity:.92}
.ahero::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(20,13,8,.9) 0%,rgba(20,13,8,.5) 45%,rgba(20,13,8,.1) 78%)}
.ahead{position:absolute;inset:auto 0 0 0;z-index:2;padding:0 0 clamp(20px,4vw,34px)}
.ahead .in{width:min(700px,calc(100% - 34px));margin:0 auto;color:#fff}
.ahead .eyebrow{color:#f7b27a}
.ahead h1{color:#fff;margin-top:10px;font-size:clamp(28px,5.6vw,50px)}
.ahead .meta{color:rgba(255,255,255,.8);margin-top:10px}
.hook{margin:20px 0 0;font-size:16px;font-weight:800;color:#c14e00}
.tk{background:#fff;border:1px solid #e7ddd0;border-radius:18px;padding:16px 18px;margin:22px 0 4px}
.tk b{display:block;font-size:12px;letter-spacing:.14em;color:#E05A00;margin-bottom:8px}
.tk ul{list-style:none;margin:0;padding:0}
.tk li{position:relative;padding-right:20px;margin-bottom:7px;font-weight:600;font-size:14.5px;color:#443c33}
.tk li:last-child{margin-bottom:0}
.tk li::before{content:"";position:absolute;right:0;top:.62em;width:8px;height:8px;border-radius:2px;background:#E05A00}
article .body{margin-top:24px;font-size:16.5px}
article .body p:first-of-type::first-letter{font-size:2.5em;float:right;line-height:.82;margin:5px 0 0 8px;font-weight:900;color:#E05A00}
blockquote{margin:26px 0;padding:0 0 0 0;border:0;background:none;font-size:clamp(19px,3.4vw,24px);font-weight:900;
  letter-spacing:-.02em;line-height:1.35;color:#241b12}
blockquote::before{content:"";display:block;width:44px;height:3px;background:#E05A00;margin:0 0 14px}
.srcs{margin:28px 0 0;font-size:12.5px;color:#8a7c6a}
.srcs b{display:block;color:#5e5449;margin-bottom:5px;font-size:12px;letter-spacing:.1em}
.srcs div{padding:6px 0;border-top:1px solid #ece3d6}
.note{background:#fff;border:1px solid #e7ddd0;border-radius:18px;padding:15px 17px;margin:24px 0;font-size:13.5px;color:#5e5449}
.note b{color:#171512}
.pcard{display:grid;grid-template-columns:84px 1fr;gap:15px;align-items:center;margin:28px 0 6px;padding:16px;
  background:#fff;border:1px solid #e7ddd0;border-radius:20px}
.pcard img{width:84px;height:100px;object-fit:contain;display:block}
.pcard .pt{font-size:11px;font-weight:900;letter-spacing:.14em;color:#E05A00}
.pcard .pn{font-size:20px;font-weight:900;letter-spacing:-.02em;margin:3px 0 4px;direction:ltr;unicode-bidi:isolate;text-align:right}
.pcard .pd{font-size:13.5px;color:#7a7067;margin:0 0 12px}
.cta-band{margin:32px 0 8px;background:#241b12;border-radius:22px;padding:26px 20px;text-align:center;color:#fff}
.cta-band h3{margin:0 0 6px;font-size:22px;letter-spacing:-.025em}
.cta-band p{margin:0 0 15px;font-size:14px;color:#cdc2b4}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:11px;min-height:50px;padding:14px 30px;
  border-radius:999px;background:#C9551A;color:#fdf6ee;border:1px solid #B44A14;font-weight:700;font-size:15.5px;
  letter-spacing:.005em;text-decoration:none;transition:background .22s ease,border-color .22s ease}
.btn::before{content:"";width:7px;height:7px;border-radius:2px;background:currentColor;opacity:.55;flex:0 0 auto;
  transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .3s}
.btn:hover{background:#A94512;border-color:#A94512}
.btn:hover::before{transform:rotate(45deg) scale(1.15);opacity:1}
.btn:active{transform:translateY(1px)}
.btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.55)}
.btn.ghost:hover{background:rgba(255,255,255,.12);border-color:#fff}
.btn.ghost::before{display:none}
.btn.light{background:transparent;color:#241b12;border-color:#cbbca8}
.btn.light:hover{background:#fff;border-color:#241b12}
footer.jf{margin-top:52px;background:#241b12;color:#cdc2b4;padding:30px 6vw 34px;text-align:center;font-size:13px}
footer.jf a{color:#f0c6a0;text-decoration:none;font-weight:700}
footer.jf .fl{display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin-bottom:11px}
@media (max-width:700px){
  .row{grid-template-columns:1fr 92px;gap:13px}
  .row img{width:92px;height:72px}
  h2{margin-top:28px}
}
"""

_HEAD_TPL = ('<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">'
             '<meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title>'
             '<style>__CSS__</style></head><body><div class="jbar" id="jbar"></div>'
             '<header class="jh"><a class="jlogo" dir="ltr" href="/">mo<i>o</i>d</a>'
             '<a class="jtel" href="tel:0524129125" aria-label="חייגו אלינו: 052-412-9125" title="דברו איתנו">'
             '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" '
             'stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 '
             '19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 '
             '2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>'
             '<a class="jback" href="{back}">{backtxt}</a></header>')

FOOT = ('<footer class="jf"><div class="fl">'
        '<a href="/journal">המגזין</a><a href="/club">מועדון החברים</a>'
        '<a href="/faq">שאלות ותשובות</a><a href="/policies">מדיניות</a>'
        '<a href="tel:0524129125" dir="ltr">052-412-9125</a>'
        '</div>© mood 2026 · Ritual Chocolate · תוצרת ישראל · כשר פרווה</footer></body></html>')


def head(title, back='/', backtxt='חזרה לאתר ←'):
    return _HEAD_TPL.format(title=_html.escape(title), back=back, backtxt=backtxt).replace('__CSS__', CSS)


def _row(a):
    return ('<a class="row" href="/journal/{id}" data-mood="{mood}" style="--mc:{c}">'
            '<div><div class="rk">{kind} · {moodhe}</div><div class="rt">{title}</div>'
            '<p class="rx">{dek}</p><div class="rm">קריאה {time}</div></div>'
            '<div class="ri"><img src="{img}" alt="{title}" loading="lazy"></div></a>').format(
        id=a['id'], mood=a['mood'], c=MOOD_COLOR.get(a['mood'], '#E05A00'),
        kind=_html.escape(a['kind']), moodhe=MOOD_HE.get(a['mood'], ''),
        title=_html.escape(a['title']), dek=_html.escape(a['dek']),
        time=a['time'], img=a['image'])


def _sections(a):
    out = []
    for s in a['sections']:
        out.append('<h2>%s</h2>' % _html.escape(s['title']))
        for p in s['body']:
            out.append('<p>%s</p>' % _html.escape(p))
    return ''.join(out)


def _sources(a):
    items = []
    for s in a.get('sources', []):
        if isinstance(s, dict):
            items.append('<div><a href="%s" target="_blank" rel="noopener">%s ↗</a></div>'
                         % (s.get('url', '#'), _html.escape(s.get('name', ''))))
        else:
            items.append('<div>%s</div>' % _html.escape(s))
    if not items:
        return ''
    return '<div class="srcs"><b>מקורות</b>%s</div>' % ''.join(items)


def _product(a):
    mood = a.get('product') or a['mood']
    if mood not in PRODUCT_ROUTE:
        return ('<div class="cta-band"><h3>שלושה רגעים. שלוש פורמולות.</h3>'
                '<p>הריטואל שמתאים לרגע שלכם — מתחיל בקובייה אחת.</p>'
                '<a class="btn" href="/products">בחרו את הרגע שלכם ←</a></div>')
    blurb = {'Sleep': 'קובייה אחת בערב, כחלק מסגירת היום.',
             'Energy': 'קובייה אחת בבוקר — במקום הקפה של עשר.',
             'Relax': 'קובייה אחת באמצע היום, כשצריך אוויר.'}[mood]
    return ('<div class="pcard"><img src="{img}" alt="mood {m}">'
            '<div><div class="pt">הרגע של MOOD</div><div class="pn">mood {mu}</div>'
            '<p class="pd">{blurb}</p>'
            '<a class="btn" href="{route}">לעמוד {mu} ←</a></div></div>').format(
        img=a.get('productImage') or '/images/product-%s.png' % mood.lower(),
        m=mood, mu=mood.upper(), blurb=blurb, route=PRODUCT_ROUTE[mood])


def build(page_src):
    feat = ARTICLES[0]
    rest = ARTICLES[1:]

    cats = [('all', 'הכל'), ('Sleep', 'שינה'), ('Energy', 'אנרגיה'), ('Relax', 'רוגע'), ('All', 'כללי')]
    chips = ''.join('<button class="chip%s" data-f="%s">%s</button>'
                    % (' on' if k == 'all' else '', k, v) for k, v in cats)

    index = (head('המגזין · MOOD')
             + ('<div class="jmast"><img src="/brand/blog-collage.png" alt="MOOD BLOG">'
                '<p class="jmast-tag">הרגע שבו זה נהיה רלוונטי — שינה, אנרגיה ורוגע. בלי הבטחות, עם הסברים.</p>'
                '</div>')
             + '<main class="wrap" style="padding:30px 0 8px">'
               '<div class="mast"><div class="eyebrow">MOOD JOURNAL</div>'
               '<h1 style="font-size:clamp(26px,4.4vw,38px)">16:00 שנסגר. ראש שלא נכבה.<br>'
               'טרנד שצריך בדיקה.</h1><div class="rule"></div></div>'
             + '<div class="chips">' + chips + '</div>'
             + ('<a class="feat" href="/journal/{id}"><div class="fi"><img src="{img}" alt="{title}"></div>'
                '<div class="fb"><div class="rk" style="--mc:{c}">הכתבה המובילה · {kind}</div>'
                '<div class="ttl">{title}</div><p class="ex">{dek}</p>'
                '<div class="meta">{moodhe} · קריאה {time}</div>'
                '<span class="btn light" style="margin-top:14px">קראו את הכתבה ←</span></div></a>').format(
                   id=feat['id'], img=feat['image'], title=_html.escape(feat['title']),
                   dek=_html.escape(feat['dek']), kind=_html.escape(feat['kind']),
                   moodhe=MOOD_HE.get(feat['mood'], ''), time=feat['time'],
                   c=MOOD_COLOR.get(feat['mood'], '#E05A00'))
             + ('<a class="jband" href="/club">'
                '<img src="/brand/rooftop.png" alt="אותיות mood על הגג">'
                '<div class="jb-in"><b>הריטואל שמגיע עד אליכם.</b>'
                '<span>מועדון החברים · 10% הנחה קבועה ומשלוח חינם ←</span></div></a>')
             + '<div class="rows" id="rows">' + ''.join(_row(a) for a in rest)
             + '<div class="empty" id="empty" style="display:none">אין כתבות בקטגוריה הזו עדיין.</div></div>'
             + ('<a class="jband" href="/products" style="margin-top:26px">'
                '<img src="/brand/jump-o.webp" alt="קפיצה דרך ה־O של mood">'
                '<div class="jb-in"><b>שלושה רגעים. שלוש פורמולות.</b>'
                '<span>בחרו את הרגע שלכם ←</span></div></a>')
             + '</main>'
             + '<script>(function(){var bar=document.getElementById("jbar");'
               'addEventListener("scroll",function(){var h=document.documentElement;'
               'var p=h.scrollTop/Math.max(1,(h.scrollHeight-h.clientHeight));'
               'bar.style.width=(p*100).toFixed(1)+"%";},{passive:true});})();</script>'
             + '<script>(function(){var chips=document.querySelectorAll(".chip"),'
               'rows=document.querySelectorAll(".row"),empty=document.getElementById("empty");'
               'chips.forEach(function(c){c.addEventListener("click",function(){'
               'chips.forEach(function(x){x.classList.remove("on")});c.classList.add("on");'
               'var f=c.dataset.f,n=0;'
               'rows.forEach(function(r){var ok=(f==="all"||r.dataset.mood===f);'
               'r.style.display=ok?"":"none";if(ok)n++;});'
               'empty.style.display=n?"none":"block";});});})();</script>'
             + FOOT)
    page_src['/journal'] = index

    for i, a in enumerate(ARTICLES):
        nxt = ARTICLES[(i + 1) % len(ARTICLES)]
        prv = ARTICLES[i - 1]
        art = (head(a.get('seoTitle') or a['title'], back='/journal', backtxt='← כל הכתבות')
               + ('<div class="ahero"><img src="%s" alt="%s">'
                  '<div class="ahead"><div class="in">'
                  '<div class="eyebrow">%s · %s</div><h1>%s</h1>'
                  '<div class="meta">קריאה %s · mood journal</div>'
                  '</div></div></div>')
                 % (a['image'], _html.escape(a['title']), _html.escape(a['kind']),
                    MOOD_HE.get(a['mood'], ''), _html.escape(a['title']), a['time'])
               + '<main class="narrow" style="padding:26px 0 8px"><article>'
               + ('<p class="hook">%s</p>' % _html.escape(a['hook']) if a.get('hook') else '')
               + '<p class="lead" style="margin-top:14px">%s</p>' % _html.escape(a['dek'])
               + ('<div class="tk"><b>מה חשוב לזכור</b><ul>%s</ul></div>'
                  % ''.join('<li>%s</li>' % _html.escape(t) for t in a.get('takeaways', [])))
               + '<div class="body">' + _sections(a) + '</div>'
               + ('<blockquote>%s</blockquote>' % _html.escape(a['quote']) if a.get('quote') else '')
               + _product(a)
               + '<div class="note">התוכן כאן הוא מידע כללי על רכיבים ואורח חיים, ואינו ייעוץ רפואי '
                 'ואינו תחליף לו. בהיריון, בהנקה, בנטילת תרופות או במצב רפואי — '
                 '<b>התייעצו עם רופא לפני שימוש.</b></div>'
               + _sources(a)
               + '<h2>להמשיך לקרוא</h2><div class="rows">' + _row(nxt) + _row(prv) + '</div>'
               + '</article></main>'
               + '<script>(function(){var bar=document.getElementById("jbar");if(!bar)return;'
                 'addEventListener("scroll",function(){var h=document.documentElement;'
                 'var p=h.scrollTop/Math.max(1,(h.scrollHeight-h.clientHeight));'
                 'bar.style.width=(p*100).toFixed(1)+"%";},{passive:true});})();</script>'
               + FOOT)
        page_src['/journal/' + a['id']] = art

    # ------------------------------------------------------------ club page
    club = (head('מועדון החברים · MOOD')
            + ('<div class="ahero"><img src="/brand/field-guide.png" alt="שלוש הפורמולות של mood">'
               '<div class="ahead"><div class="in"><div class="eyebrow">MOOD CLUB</div>'
               '<h1>הריטואל שמגיע<br>עד אליכם.</h1></div></div></div>')
            + '<main class="narrow" style="padding:26px 0 8px">'
              '<p class="lead" style="margin-top:14px">הקופסה החודשית שלכם, במחיר חבר קבוע, '
              'עם משלוח חינם — ובלי שום התחייבות.</p>'
              '<h2>מה מקבלים</h2>'
              '<div class="tk"><b>הטבות החברים</b><ul>'
              '<li>10% הנחה קבועה על כל הזמנה, כל חודש, בלי קופונים</li>'
              '<li>משלוח חינם — תמיד, גם מתחת ל־249 ₪</li>'
              '<li>מדלגים על חודש, מחליפים פורמולה או מבטלים בקליק</li>'
              '<li>גישה מוקדמת לפורמולות ולמהדורות חדשות</li>'
              '</ul></div>'
              '<h2>איך זה עובד</h2>'
              '<p>בוחרים פורמולה ותדירות — כל חודש, כל חודשיים או כל שלושה. '
              'המארז יוצא אליכם באותו תאריך בכל חודש, עם תזכורת שלושה ימים מראש. '
              'רוצים לדלג? לוחצים "דלג על החודש" בתזכורת. זהו.</p>'
              '<h2>לדלג, לשנות או לבטל</h2>'
              '<p>אין חודשי מינימום ואין קנס ביטול. כל שינוי נעשה בקליק אחד מהמייל החודשי '
              'או מאזור החשבון — כולל החלפה בין ENERGY, RELAX ו־SLEEP.</p>'
              '<div class="note"><b>הבטחת 30 יום.</b> לא הרגשתם שזה בשבילכם? '
              'כתבו לנו תוך 30 יום מההזמנה הראשונה ונחזיר את הכסף — בלי שאלות. '
              'אפשר גם פשוט להתקשר: <a href="tel:0524129125" dir="ltr">052-412-9125</a>.</div>'
              '<h2>שאלות שחוזרות</h2>'
              '<p><b>אפשר להצטרף בלי מנוי?</b> בהחלט — כל המארזים זמינים גם כרכישה חד־פעמית.</p>'
              '<p><b>מתי מחייבים אותי?</b> ביום המשלוח, לא לפני. תמיד נשלחת תזכורת מראש.</p>'
              '<p><b>אפשר לשלב פורמולות?</b> כן — החבילה המלאה כוללת את שלושת הרגעים בהנחה של 15%.</p>'
              '<div class="cta-band"><h3>מוכנים להצטרף?</h3>'
              '<p>בוחרים מארז, מסמנים "מנוי חודשי" — וזה כל התהליך.</p>'
              '<a class="btn" href="/products">בחרו מארז והצטרפו ←</a>'
              '<div style="margin-top:10px"><a class="btn ghost" href="/journal">קראו את המגזין</a></div></div>'
              '</main>' + FOOT)
    page_src['/club'] = club

    return [a['id'] for a in ARTICLES]
