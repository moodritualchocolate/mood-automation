#!/usr/bin/env python3
"""Build a single self-contained home.html from the APPROVED home source,
then layer on the "evolve & elevate" narrative + motion pass.

Base (approved, pristine, never mutated on disk): approved/index.html loads two
interactive sections (product-cards, cinematic) and shows hero + formula as
flat images. This script:

  1. inlines every approved asset as a data URI and embeds Heebo (no Google Fonts),
  2. folds the two sections into the shell via <iframe srcdoc=...> (keeps their
     CSS scope exactly as approved),
  3. LAYERS the missing narrative stages the home skipped vs. the PDP:
       - Recognition : the "that's me" friction beat (Energy/Relax/Sleep moments)
       - Marquee     : PDP-language credibility ticker (verifiable product facts)
       - Founders    : real Proof — נדב יצחקי & מתיאס דומינגז (replaces the
                       fabricated "Ronen" chocolatier, which is also stripped
                       from the cinematic at build time)
       - Close       : soft launch CTA for 12.8 (approved soft CTA, no hard-sell)
       - Footer      : shared design-system footer
  4. adds a calm, reduced-motion-safe scroll-reveal + marquee motion pass.

New copy is Hebrew-native, no forbidden words, one SKU colour per element,
founders spelled correctly — per mood-brand-guardian / conversion-storyteller /
motion-director.
"""
import base64, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
APP = ROOT / "approved"
ASSETS = APP / "assets"
HOME_ASSETS = ROOT / "home-assets"
MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".webp": "image/webp", ".mp4": "video/mp4", ".gif": "image/gif"}

FONTS = (ROOT / "fonts-embed.css").read_text(encoding="utf-8")

FONT_LINKS = re.compile(
    r'\s*<link rel="preconnect"[^>]*>'
    r'\s*<link rel="preconnect"[^>]*crossorigin>'
    r'\s*<link href="https://fonts\.googleapis\.com[^"]*"[^>]*>')


def data_uri(name: str, base: pathlib.Path = ASSETS) -> str:
    p = base / name
    if not p.exists():
        sys.exit(f"missing asset: {p}")
    mime = MIME.get(p.suffix.lower(), "application/octet-stream")
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def inline_assets(html: str) -> str:
    return re.sub(r'(?:\.\./)?assets/([A-Za-z0-9_\-.]+)',
                  lambda m: data_uri(m.group(1)), html)


# ---------------------------------------------------------------- new layer CSS
NEW_CSS = """
/* ---- evolve & elevate layer (parent-level, namespaced) ---- */
:root{--ink:#171714;--cream:#f5eee4;--paper:#fff;--muted:#615d56;
  --energy:#e8812c;--relax:#7e9b63;--sleep:#5e7ba8;--dark:#171714}
.reveal{opacity:0;transform:translateY(20px);transition:opacity .7s cubic-bezier(.22,.8,.28,1),transform .7s cubic-bezier(.22,.8,.28,1)}
.reveal.in{opacity:1;transform:none}

/* Recognition */
.hr{background:#fff;padding:96px 24px 64px;text-align:center}
.hr-eyebrow{font-size:11px;letter-spacing:.24em;font-weight:800;color:#a08a72}
.hr-h{font-size:clamp(34px,5vw,58px);line-height:1.04;letter-spacing:-.04em;font-weight:800;margin:14px 0 0}
.hr-lead{max-width:520px;margin:16px auto 0;color:var(--muted);font-size:clamp(15px,1.5vw,18px);line-height:1.6}
.hr-grid{width:min(1080px,100%);margin:52px auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;direction:rtl}
.hr-moment{background:var(--cream);border-radius:22px;padding:30px 26px 28px;text-align:right;border-top:3px solid var(--d)}
.hr-time{display:inline-block;direction:ltr;font-size:34px;font-weight:900;letter-spacing:-.03em;color:var(--d)}
.hr-moment p{margin:8px 0 0;font-size:18px;line-height:1.4;font-weight:600;color:var(--ink)}

/* Marquee */
.hm{background:var(--dark);overflow:hidden;padding:16px 0;direction:ltr;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}
.hm-track{display:flex;align-items:center;width:max-content;animation:hmScroll 34s linear infinite}
.hm:hover .hm-track{animation-play-state:paused}
.hm-item{color:#f5eee4;font-size:14px;font-weight:700;white-space:nowrap;padding:0 22px}
.hm-item b{color:var(--energy)}
.hm-sep{width:5px;height:5px;border-radius:50%;background:#5a544c;flex:0 0 auto}
@keyframes hmScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* Founders */
.hf{background:var(--cream);display:grid;grid-template-columns:1fr 1fr;align-items:stretch;gap:0}
.hf-photo{position:relative;min-height:520px;overflow:hidden}
.hf-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%}
.hf-copy{padding:clamp(40px,6vw,96px);display:flex;flex-direction:column;justify-content:center}
.hf-eyebrow{font-size:11px;letter-spacing:.22em;font-weight:800;color:#a08a72}
.hf-h{font-size:clamp(30px,3.6vw,52px);line-height:1.05;letter-spacing:-.04em;font-weight:800;margin:14px 0 20px}
.hf-copy p{margin:0 0 16px;max-width:460px;color:#4c4841;font-size:clamp(15px,1.35vw,18px);line-height:1.7}
.hf-sign{margin-top:10px;font-size:14px;font-weight:800;color:var(--ink)}

/* Close / launch */
.hc{position:relative;padding:110px 24px;text-align:center;color:#fff;overflow:hidden;background:#171714}
.hc-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.34;filter:saturate(.9)}
.hc::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,15,10,.7),rgba(17,15,10,.86))}
.hc-in{position:relative;z-index:2;width:min(760px,100%);margin:0 auto}
.hc-eyebrow{font-size:12px;letter-spacing:.26em;font-weight:800;color:var(--energy)}
.hc-h{font-size:clamp(32px,4.6vw,60px);line-height:1.05;letter-spacing:-.04em;font-weight:800;margin:16px 0 0}
.hc-lead{margin:16px auto 0;color:#e5ddd2;font-size:clamp(15px,1.5vw,19px);line-height:1.6;max-width:480px}
.hc-cta{display:inline-block;margin:34px 0 0;padding:16px 34px;border-radius:999px;background:var(--energy);color:#171714;font-size:15px;font-weight:800;text-decoration:none;transition:transform .2s ease,background .2s ease}
.hc-cta:hover{transform:translateY(-2px);background:#f2902e}
.hc-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:34px auto 0;direction:rtl}
.hc-chips span{font-size:12px;font-weight:700;color:#e5ddd2;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:8px 15px}

/* Footer */
.hft{background:#fff;text-align:center;padding:52px 24px 60px;border-top:1px solid #ece6dc}
.hft-logo{font-size:30px;font-weight:900;letter-spacing:-.02em;color:var(--ink)}
.hft-logo span{position:relative;color:var(--energy)}
.hft-logo span::after{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:#fff}
.hft p{margin:12px 0 0;font-size:12.5px;letter-spacing:.02em;color:#8a847b}

@media (max-width:700px){
  .hr{padding:64px 20px 44px}
  .hr-grid{grid-template-columns:1fr;gap:12px;margin-top:36px}
  .hr-moment{padding:24px 22px}
  .hf{grid-template-columns:1fr}
  .hf-photo{min-height:400px}
  .hc{padding:80px 20px}
}
@media (prefers-reduced-motion:reduce){
  .reveal{opacity:1!important;transform:none!important}
  .hm{-webkit-mask-image:none;mask-image:none}
  .hm-track{animation:none;flex-wrap:wrap;justify-content:center;width:100%;gap:6px 0;padding:0 16px}
}
"""

# ---------------------------------------------------------------- new sections
def mq_items():
    items = ["<b>70%</b> מריר עם מלח ים", "<b>0</b> גרם סוכר", "רכיבים טבעיים",
             "כשר פרווה", "30 יחידות · חודש שלם", "ביטול בכל עת",
             "משלוח חינם מעל 249 ₪", "ENERGY · RELAX · SLEEP", "ריטואל, לא תוסף"]
    one = "".join(f'<span class="hm-item">{t}</span><span class="hm-sep"></span>' for t in items)
    return one + one  # duplicate for a seamless -50% loop


RECOGNITION = """    <section class="hr" aria-label="הרגעים של mood">
      <div class="reveal">
        <div class="hr-eyebrow">רגע — זה בדיוק אתה</div>
        <h2 class="hr-h">לכל שעה ביום<br>יש ריטואל.</h2>
        <p class="hr-lead">כולנו מכירים את הרגעים האלה. ל-mood יש בדיוק אחד בשבילם.</p>
      </div>
      <div class="hr-grid">
        <div class="hr-moment reveal" style="--d:var(--energy)"><span class="hr-time">16:30</span><p>עוד קפה? יש ריטואל אחר.</p></div>
        <div class="hr-moment reveal" style="--d:var(--relax)"><span class="hr-time">22:00</span><p>והראש עדיין לא נכבה.</p></div>
        <div class="hr-moment reveal" style="--d:var(--sleep)"><span class="hr-time">03:00</span><p>שוב ער. המוח לא נרדם.</p></div>
      </div>
    </section>
"""

MARQUEE = f"""    <div class="hm" aria-label="למה mood">
      <div class="hm-track">{mq_items()}</div>
    </div>
"""

FOUNDERS = """    <section class="hf" aria-label="המייסדים של mood">
      <div class="hf-photo reveal"><img src="__FOUNDERS__" alt="נדב יצחקי ומתיאס דומינגז — מייסדי mood בסדנת השוקולד"></div>
      <div class="hf-copy reveal">
        <div class="hf-eyebrow">מי מאחורי mood</div>
        <h2 class="hf-h">התחלנו כי נמאס לנו לבחור.</h2>
        <p>נדב יצחקי ומתיאס דומינגז רצו דבר אחד פשוט — ריטואל קטן שאפשר לחזור אליו כל יום, בלי לבחור בין קפה לשקט.</p>
        <p>אז בנינו שוקולד פונקציונלי אמיתי: 70% מריר עם מלח ים, פורמולה טבעית, בלי סוכר. כל קובייה היא רגע אחד ביום שהוא רק שלך.</p>
        <div class="hf-sign">— נדב ומתיאס · מייסדי mood</div>
      </div>
    </section>
"""

CLOSE = """    <section class="hc" aria-label="ההשקה של mood — 12.8">
      <img class="hc-bg" src="__CHOC__" alt="">
      <div class="hc-in reveal">
        <div class="hc-eyebrow">בקרוב · 12.8</div>
        <h2 class="hc-h">הריטואל שלך מתחיל<br>ב-12 באוגוסט.</h2>
        <p class="hc-lead">שלושה מצבי רוח. קובייה אחת ביום. חודש שלם.</p>
        <a class="hc-cta" href="#products">אולי הגיע הזמן →</a>
        <div class="hc-chips"><span>70% מריר</span><span>0 סוכר</span><span>כשר פרווה</span><span>30 יחידות</span></div>
      </div>
    </section>
"""

FOOTER = """  <footer class="hft">
    <div class="hft-logo">mo<span>o</span>d</div>
    <p>ריטואל פונקציונלי · ENERGY · RELAX · SLEEP · © mood 2026</p>
  </footer>
"""

MOTION_JS = """  <script>
  (function(){
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .18 });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  })();
  </script>
"""


def build_section(filename: str, is_cinematic: bool) -> str:
    html = (APP / "sections" / filename).read_text(encoding="utf-8")
    html = FONT_LINKS.sub("", html)
    html = html.replace("<style>", "<style>\n" + FONTS + "\n", 1)
    html = inline_assets(html)
    if is_cinematic:
        # data-URI videos have no filename to compare — track mood on the element
        html = html.replace(
            "if (!video.currentSrc.endsWith(next.src.split('/').pop())) {",
            "if (video.dataset.mood !== mood) { video.dataset.mood = mood;")
        html = html.replace(
            "const moodButtons = [...document.querySelectorAll('[data-mood]')];",
            "const moodButtons = [...document.querySelectorAll('[data-mood]')];\n"
            "    video.dataset.mood = 'energy';")
        # --- strip the fabricated "Ronen" chocolatier; reframe tile around craft ---
        # (whitespace/dash-tolerant regexes — exact-string matches were fragile)
        html = re.sub(r'<title>.*?</title>',
                      '<title>mood — השוקולד והריטואל</title>', html, count=1, flags=re.S)
        html = html.replace('DEVELOPED WITH A MASTER CHOCOLATIER',
                            '70% קקאו · מלח ים · ללא סוכר')
        html = re.sub(
            r'<p class="story-copy">.*?</p>',
            '<p class="story-copy">כל ביס נבנה קודם כול כמו שוקולד אמיתי — ורק אחר כך '
            'כמו ריטואל שעושה טוב. מריר 70% עם מלח ים, בלי סוכר ובלי טעמים מוספים.</p>',
            html, count=1, flags=re.S)
        # remove the expert (Ronen) block entirely (inner <div> + outer expert <div>)
        html = re.sub(r'\s*<div class="expert">.*?</div>\s*</div>',
                      "", html, count=1, flags=re.S)
    return html


def escape_srcdoc(html: str) -> str:
    return html.replace("&", "&amp;").replace('"', "&quot;")


def main():
    shell = (APP / "index.html").read_text(encoding="utf-8")
    # the shell's cinematic <iframe title> also names the fabricated "Ronen"
    shell = shell.replace('title="השוקולד, רונן והריטואל של MOOD"',
                          'title="השוקולד והריטואל של mood"')
    # fonts + new layer CSS into the shell head
    shell = shell.replace("<style>", "<style>\n" + FONTS + "\n", 1)
    shell = shell.replace("</style>", NEW_CSS + "\n  </style>", 1)
    # inline approved hero + formula strip images
    shell = inline_assets(shell)
    # layer the narrative sections in journey order
    shell = shell.replace('    <section id="products"', RECOGNITION + '    <section id="products"')
    shell = shell.replace('    <section id="story"', MARQUEE + '    <section id="story"')
    shell = shell.replace('    <section id="formula"', FOUNDERS + '    <section id="formula"')
    shell = shell.replace('  </main>', CLOSE + '  </main>\n' + FOOTER)
    # inline the new-layer assets
    shell = shell.replace("__FOUNDERS__", data_uri("founders.jpg", HOME_ASSETS))
    shell = shell.replace("__CHOC__", data_uri("choc-dark.jpg", HOME_ASSETS))
    # motion pass
    shell = shell.replace('</body>', MOTION_JS + '</body>')
    # fold the two interactive sections in as srcdoc
    products = escape_srcdoc(build_section("product-cards.html", False))
    cinematic = escape_srcdoc(build_section("cinematic.html", True))
    shell = shell.replace('src="sections/product-cards.html"', f'srcdoc="{products}"')
    shell = shell.replace('src="sections/cinematic.html"', f'srcdoc="{cinematic}"')

    left = re.findall(r'(?:\.\./)?(?:assets|sections)/[A-Za-z0-9_\-.]+', shell)
    if left:
        sys.exit(f"unreplaced references remain: {set(left)}")
    leftover = set(re.findall(r'__[A-Z]+__', shell))
    if leftover:
        sys.exit(f"unreplaced markers: {leftover}")
    if "רונן" in shell or "אפללו" in shell:
        sys.exit("brand check failed: fabricated 'Ronen' still present")
    out = ROOT / "home.html"
    out.write_text(shell, encoding="utf-8")
    print(f"built home.html ({out.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
