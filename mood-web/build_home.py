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
.hc-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:30px auto 0;direction:rtl}
.hc-chips span{font-size:12px;font-weight:700;color:#e5ddd2;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:8px 15px}
.hc-count{display:flex;justify-content:center;gap:12px;margin:30px 0 0;direction:ltr}
.hc-count>div{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:12px 10px;min-width:64px}
.hc-count b{display:block;font-size:30px;font-weight:900;font-variant-numeric:tabular-nums;color:#fff;line-height:1}
.hc-count span{display:block;margin-top:6px;font-size:10px;font-weight:700;color:#c9bfb2;letter-spacing:.06em}
.hc-form{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:28px auto 0;max-width:520px}
.hc-form input{flex:1 1 190px;min-width:0;padding:15px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;font-size:15px;font-family:inherit;text-align:right}
.hc-form input::placeholder{color:#b3a99c}
.hc-form button{flex:1 1 100%;padding:16px;border-radius:999px;border:0;background:var(--energy);color:#171714;font-size:15px;font-weight:800;cursor:pointer;transition:transform .2s}
.hc-form button:hover{transform:translateY(-2px)}
.hc-note{margin:14px 0 0;font-size:12px;color:#9a9082}

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
             "שוקולטייר · אלוף העולם 2022", "כשר פרווה", "30 יחידות · חודש שלם",
             "ביטול בכל עת", "משלוח חינם מעל 249 ₪", "ENERGY · RELAX · SLEEP",
             "ריטואל, לא תוסף"]
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

FOUNDERS = """    <section class="hf" id="founders" aria-label="המייסדים של mood">
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


# ============================================================================
# Interactive capability modules (integrated into the home, not a separate demo)
#   quiz · immersive one-ritual-per-screen · ritual-kit bundle · day timeline
# ============================================================================
CAP_CSS = """
/* ---- interactive capability modules ---- */
:root{--accent:var(--energy)}
.cap{position:relative}
.cap-label{width:min(1080px,100%);margin:clamp(40px,6vw,72px) auto 0;padding:0 22px;
  font-size:12px;font-weight:900;letter-spacing:.16em;color:#b06a3a}
.cap-title{width:min(1080px,100%);margin:10px auto 0;padding:0 22px}
.cap-title h2{font-size:clamp(30px,5vw,52px);line-height:1.02;letter-spacing:-.045em;font-weight:900;margin:0}
.cap-title p{margin:8px 0 0;color:var(--muted);font-size:15px;line-height:1.55;max-width:520px}
/* immersive scroll */
.scroll-wrap{height:260vh;position:relative;margin-top:26px}
.scroll-sticky{position:sticky;top:0;height:100vh;overflow:hidden;background:var(--cream);transition:background-color .9s ease}
.scroll-glow{position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(60% 55% at 50% 42%,color-mix(in srgb,var(--accent) 34%,transparent),transparent 70%);transition:background .9s ease}
.scroll-inner{position:absolute;inset:0;z-index:2}
.scroll-stage{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;text-align:center;padding:0 24px;opacity:0;transition:opacity .6s ease;pointer-events:none}
.scroll-stage.on{opacity:1;pointer-events:auto}
.scroll-stage>*{max-width:min(560px,86vw)}
.scroll-pouch{width:auto;height:min(340px,42vh);margin:0 auto 22px;filter:drop-shadow(0 26px 30px rgba(41,31,18,.22));animation:floatp 6s ease-in-out infinite alternate}
.scroll-kicker{display:inline-block;font-size:12px;font-weight:900;letter-spacing:.14em;color:var(--accent);margin-bottom:10px}
.scroll-h{font-size:clamp(34px,7vw,64px);color:var(--ink);line-height:1.02;letter-spacing:-.04em;font-weight:800;margin:0}
.scroll-sub{margin:14px auto 0;color:#4c4841;font-size:clamp(15px,2vw,19px);max-width:360px;line-height:1.5}
.scroll-dots{position:absolute;z-index:3;bottom:34px;left:0;right:0;display:flex;gap:9px;justify-content:center}
.scroll-dots i{width:8px;height:8px;border-radius:50%;background:#cbbfae;transition:transform .3s,background .3s}
.scroll-dots i.on{background:var(--accent);transform:scale(1.5)}
@keyframes floatp{from{transform:translateY(0)}to{transform:translateY(-16px)}}
/* quiz */
.quiz{width:min(760px,100%);margin:30px auto 0;padding:0 22px}
.quiz-card{background:var(--paper);border:1px solid #e9e2d6;border-radius:28px;padding:clamp(26px,4vw,44px);box-shadow:0 16px 40px rgba(41,32,20,.06);text-align:center}
.quiz-q h3{font-size:clamp(24px,4vw,34px);margin:0;font-weight:800;letter-spacing:-.03em}
.quiz-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:26px}
.quiz-opt{position:relative;overflow:hidden;border:1px solid #e9e2d6;background:var(--cream);border-radius:20px;padding:26px 16px 22px;cursor:pointer;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;transition:transform .2s,border-color .2s,box-shadow .2s}
.quiz-opt::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:var(--sel)}
.quiz-opt:hover{transform:translateY(-4px);border-color:var(--sel);box-shadow:0 16px 32px rgba(41,32,20,.12)}
.qo-disc{width:66px;height:66px;border-radius:50%;object-fit:cover;border:2px solid color-mix(in srgb,var(--sel) 55%,transparent)}
.qo-time{direction:ltr;font-size:21px;font-weight:900;letter-spacing:-.02em;color:var(--sel);margin-top:2px}
.quiz-opt b{font-size:19px;font-weight:800;color:var(--ink)}
.qo-desc{font-size:13.5px;color:var(--muted);font-weight:600;line-height:1.35}
/* meet the chocolate — dark, cinematic, appetising, real product photography */
.meet{background:#17100c;color:#f2e7d9;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:clamp(22px,4vw,56px);padding:clamp(50px,7vw,96px) clamp(24px,5vw,70px);overflow:hidden}
.meet-media{position:relative}
.meet-img{width:100%;height:auto;border-radius:22px;display:block;box-shadow:0 30px 64px rgba(0,0,0,.55);animation:meetZoom 16s ease-in-out infinite alternate}
.meet-tag{position:absolute;bottom:16px;right:16px;background:rgba(23,16,12,.72);backdrop-filter:blur(6px);color:#f2e7d9;font-size:12px;font-weight:800;letter-spacing:.04em;padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14)}
.meet-copy{direction:rtl}
.meet-eyebrow{font-size:12px;font-weight:900;letter-spacing:.24em;color:var(--energy)}
.meet-h{font-size:clamp(34px,4.8vw,64px);line-height:1;letter-spacing:-.045em;font-weight:900;color:#fff;margin:14px 0 0}
.meet-sub{margin:18px 0 0;max-width:440px;color:#cdbfae;font-size:clamp(15px,1.4vw,18px);line-height:1.6}
.meet-moods{display:flex;gap:18px;margin:32px 0 0;flex-wrap:wrap}
.meet-mood{display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center}
.meet-mood img{width:74px;height:74px;border-radius:50%;object-fit:cover;border:2px solid color-mix(in srgb,var(--c) 60%,transparent);box-shadow:0 10px 22px rgba(0,0,0,.45);transition:transform .25s}
.meet-mood:hover img{transform:translateY(-5px) scale(1.06)}
.meet-mood b{font-size:12px;font-weight:900;letter-spacing:.08em;color:var(--c)}
.meet-mood span{font-size:11px;color:#a99a86}
@keyframes meetZoom{from{transform:scale(1)}to{transform:scale(1.04)}}
@media(max-width:820px){.meet{grid-template-columns:1fr;gap:26px;padding:44px 22px}.meet-media{order:1}.meet-copy{order:2}}
@media(prefers-reduced-motion:reduce){.meet-img{animation:none}}
.quiz-result{opacity:0;transform:translateY(14px);transition:opacity .5s,transform .5s}
.quiz-result.on{opacity:1;transform:none}
.quiz-result .rpouch{width:auto;height:210px;margin:0 auto 16px;filter:drop-shadow(0 20px 24px rgba(41,31,18,.2))}
.quiz-result .rkick{font-size:12px;font-weight:900;letter-spacing:.16em;color:var(--accent)}
.quiz-result h3{font-size:34px;margin-top:8px;font-weight:800;letter-spacing:-.03em}
.quiz-result p{max-width:400px;margin:12px auto 0;color:var(--muted);line-height:1.6;font-size:16px}
.qbtn{display:inline-block;margin-top:22px;padding:15px 30px;border-radius:999px;background:var(--accent);color:#fff;font-weight:800;font-size:15px;text-decoration:none;border:0;cursor:pointer;transition:transform .18s,filter .18s}
.qbtn:hover{transform:translateY(-2px);filter:brightness(1.05)}
.qreset{margin-top:14px;display:block;background:none;border:0;color:#9a938a;font-size:13px;font-weight:700;cursor:pointer;width:100%}
/* bundle */
.bundle{width:min(760px,100%);margin:30px auto 0;padding:0 22px}
.brow{display:flex;align-items:center;gap:16px;background:var(--paper);border:1px solid #e9e2d6;border-radius:22px;padding:16px 18px;margin-bottom:12px}
.brow img{width:72px;height:72px;object-fit:contain;flex:0 0 auto}
.brow .bmeta{flex:1;min-width:0}
.brow .bmeta b{display:flex;align-items:center;gap:8px;font-size:17px}
.brow .bmeta b i{width:9px;height:9px;border-radius:50%;background:var(--c)}
.brow .bmeta span{display:block;color:var(--muted);font-size:13px;margin-top:2px}
.stepper{display:flex;align-items:center;gap:12px;flex:0 0 auto}
.stepper button{width:38px;height:38px;border-radius:50%;border:1px solid #e9e2d6;background:var(--cream);font-size:20px;font-weight:800;cursor:pointer;color:var(--ink);line-height:1;transition:background .15s,transform .15s}
.stepper button:hover{background:#efe7da;transform:translateY(-1px)}
.stepper .qv{min-width:26px;text-align:center;font-size:19px;font-weight:900;font-variant-numeric:tabular-nums}
.bbar{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--ink);color:#fff;padding:16px 22px;display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:0 -10px 30px rgba(0,0,0,.18);transform:translateY(130%);transition:transform .4s cubic-bezier(.22,.8,.28,1)}
.bbar.show{transform:none}
.bbar .binfo b{font-size:20px;font-variant-numeric:tabular-nums}
.bbar .binfo .was{color:#a49a8d;text-decoration:line-through;font-size:14px;margin-inline-start:8px}
.bbar .binfo small{display:block;color:#7fbf6b;font-size:12px;font-weight:800;margin-top:2px}
.bbar .badd{background:var(--energy);color:#171714;padding:14px 26px;border-radius:999px;font-weight:800;font-size:15px;border:0;cursor:pointer;white-space:nowrap;transition:transform .15s}
.bbar .badd:hover{transform:translateY(-2px)}
/* day timeline */
.day{width:min(860px,100%);margin:30px auto 0;padding:0 22px}
.day-scene{position:relative;border-radius:28px;overflow:hidden;min-height:360px;background:var(--cream);transition:background-color .6s ease;display:grid;place-items:center;padding:34px 22px;text-align:center}
.day-scene .glow{position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 40%,color-mix(in srgb,var(--accent) 40%,transparent),transparent 72%);transition:background .6s ease}
.day-inner{position:relative;z-index:2}
.day-time{font-size:52px;font-weight:900;letter-spacing:-.03em;font-variant-numeric:tabular-nums;direction:ltr}
.day-pouch{width:auto;height:150px;margin:8px auto 12px;filter:drop-shadow(0 20px 22px rgba(41,31,18,.2))}
.day-kick{font-size:12px;font-weight:900;letter-spacing:.16em;color:var(--accent)}
.day-line{font-size:clamp(22px,4vw,32px);font-weight:800;margin-top:6px;letter-spacing:-.03em}
.day-slider{margin:26px 4px 0}
.day-slider input{width:100%;accent-color:var(--accent);height:6px;cursor:pointer}
.day-ticks{display:flex;justify-content:space-between;margin-top:8px;color:#9a938a;font-size:12px;font-weight:700;direction:ltr}
@media(max-width:700px){.quiz-opts{grid-template-columns:1fr}.brow img{width:56px;height:56px}.day-scene{min-height:320px}}
@media(prefers-reduced-motion:reduce){.scroll-pouch{animation:none}}
"""

QUIZ = """    <section class="cap" id="quiz" aria-label="Mood Finder">
      <div class="cap-label">מצאו את הריטואל</div>
      <div class="cap-title"><h2>שאלה אחת. הריטואל שלך.</h2><p>לא בטוחים איפה להתחיל? ספרו לנו מה מצב הראש — ונתאים לכם רגע.</p></div>
      <div class="quiz">
        <div class="quiz-card">
          <div class="quiz-q" id="quizQ">
            <h3>מה מצב הראש שלך עכשיו?</h3>
            <div class="quiz-opts">
              <button class="quiz-opt" data-sku="energy" style="--sel:var(--energy)"><img class="qo-disc" src="__EDISC__" alt=""><span class="qo-time">16:30</span><b>רץ על ריק</b><span class="qo-desc">צריך דלק להמשך היום</span></button>
              <button class="quiz-opt" data-sku="relax" style="--sel:var(--relax)"><img class="qo-disc" src="__RDISC__" alt=""><span class="qo-time">22:00</span><b>עמוס</b><span class="qo-desc">קשה להוריד הילוך</span></button>
              <button class="quiz-opt" data-sku="sleep" style="--sel:var(--sleep)"><img class="qo-disc" src="__SDISC__" alt=""><span class="qo-time">03:00</span><b>ער בלילה</b><span class="qo-desc">המוח לא נכבה</span></button>
            </div>
          </div>
          <div class="quiz-result" id="quizR" aria-live="polite"></div>
        </div>
      </div>
    </section>
"""

MEET = """    <section class="meet" id="meet" aria-label="הכירו את השוקולד">
      <div class="meet-media reveal">
        <img class="meet-img" src="__CHOCMOODS__" alt="שוקולד mood — בר מריר עם שלוש דיסקיות ובהן סמלי שלושת המצבים">
        <span class="meet-tag">70% מריר · מלח ים</span>
      </div>
      <div class="meet-copy reveal">
        <div class="meet-eyebrow">השוקולד</div>
        <h2 class="meet-h">ביס אחד.<br>וזה כבר ריטואל.</h2>
        <p class="meet-sub">שוקולד מריר 70% עם מלח ים ופורמולה טבעית. אותו שוקולד — שלושה מצבים, חתומים בו עצמו.</p>
        <div class="meet-moods">
          <div class="meet-mood" style="--c:var(--energy)"><img src="__EDISC__" alt=""><b>ENERGY</b><span>בוקר · צהריים</span></div>
          <div class="meet-mood" style="--c:var(--relax)"><img src="__RDISC__" alt=""><b>RELAX</b><span>ערב</span></div>
          <div class="meet-mood" style="--c:var(--sleep)"><img src="__SDISC__" alt=""><b>SLEEP</b><span>לילה</span></div>
        </div>
      </div>
    </section>
"""

FORMULAS = """    <section class="fml-embed" id="formulas" aria-label="הפורמולות של mood">
      <iframe class="fml-frame" src="sections/formula.html" title="MOOD — הפורמולה" loading="lazy"></iframe>
    </section>
"""

FORMULAS_CSS = """
/* embedded self-contained 3D formulas experience (built separately, hosted as-is) */
.fml-embed{background:var(--cream);width:100%;overflow:hidden}
.fml-frame{display:block;width:100%;height:min(940px,90vh);border:0}
@media(max-width:820px){.fml-frame{height:min(760px,88vh)}}
"""

FORMULAS_JS = ""

VH_CSS = """
/* video hero — white, minimal, product film + one sales CTA */
.vh{position:relative;direction:ltr;display:grid;grid-template-columns:1.02fr .98fr;min-height:min(72vh,600px);background:#fff;overflow:hidden}
.vh-media{position:relative;order:1;overflow:hidden;background:#fff}
.vh-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.vh-fade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to left,#fff,rgba(255,255,255,0) 34%)}
.vh-copy{position:relative;order:2;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;text-align:right;direction:rtl;padding:clamp(28px,5vw,86px);z-index:2}
.vh-h{font-size:clamp(42px,6.4vw,86px);line-height:.98;letter-spacing:-.045em;font-weight:900;color:var(--ink);margin:0 0 34px}
.vh-cta{display:inline-flex;align-items:center;gap:10px;background:var(--ink);color:#fff;padding:16px 34px;border-radius:999px;font-size:17px;font-weight:800;text-decoration:none;transition:transform .2s,background .2s}
.vh-cta:hover{transform:translateY(-2px);background:#FF6B35;color:#1a0f06}
@media(max-width:860px){
  .vh{grid-template-columns:1fr;min-height:auto}
  .vh-media{order:1;aspect-ratio:16/11}
  .vh-fade{background:linear-gradient(0deg,#fff,rgba(255,255,255,0) 30%)}
  .vh-copy{order:2;align-items:center;text-align:center;padding:18px 22px 38px}
}
"""

STORY = """    <section class="ts" id="story" aria-label="הטעם והשוקולטייר של mood">
      <div class="ts-media reveal"><img src="__BITE__" alt="בר mood 70% מריר עם ביס — הטעם"></div>
      <div class="ts-copy">
        <div class="ts-eyebrow reveal">פותח עם אלוף העולם</div>
        <h2 class="ts-h reveal">קודם כול,<br>שוקולד אמיתי.</h2>
        <p class="ts-p reveal">70% מריר עם מלח ים ופורמולה טבעית. כל ביס מרגיש קודם כול כמו שוקולד פרימיום — ורק אחר כך כמו ריטואל שעושה טוב. בלי סוכר, בלי פשרות.</p>
        <ul class="ts-chips reveal"><li>70% מריר</li><li>מלח ים</li><li>פורמולה טבעית</li><li>בלי סוכר</li></ul>
        <div class="ts-expert reveal">
          <img src="__RONEN__" alt="רונן אפללו בסדנת השוקולד של mood">
          <div class="ts-expert-t">
            <strong>רונן אפללו · שוקולטייר</strong>
            <span>אלוף השוקולד העולמי 2022</span>
            <p class="ts-quote">\u201cרצינו ליצור שוקולד שתרצו לחזור אליו כל יום.\u201d</p>
          </div>
        </div>
      </div>
    </section>
"""

TS_CSS = """
/* one strong section: the taste + world-champion chocolatier */
.ts{position:relative;display:grid;grid-template-columns:1fr 1.05fr;align-items:stretch;background:#fff;overflow:hidden;direction:ltr}
.ts-media{position:relative;order:1;min-height:min(78vh,640px);background:#1a0f08}
.ts-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.ts-copy{order:2;direction:rtl;text-align:right;display:flex;flex-direction:column;justify-content:center;padding:clamp(40px,5.5vw,88px)}
.ts-eyebrow{font-size:12px;font-weight:900;letter-spacing:.18em;color:#FF6B35}
.ts-h{font-size:clamp(34px,4.8vw,64px);line-height:1;letter-spacing:-.04em;font-weight:900;color:var(--ink);margin:14px 0 0}
.ts-p{margin:18px 0 0;max-width:480px;color:var(--muted);font-size:clamp(15px,1.4vw,17.5px);line-height:1.65}
.ts-chips{list-style:none;display:flex;flex-wrap:wrap;gap:9px;margin:22px 0 0;padding:0}
.ts-chips li{border:1px solid #e6ddcd;border-radius:999px;padding:8px 15px;font-size:13px;font-weight:800;color:#4c4841;background:#faf6ef}
.ts-expert{display:flex;align-items:center;gap:15px;margin:30px 0 0;padding:16px 0 0;border-top:1px solid #eee}
.ts-expert>img{width:66px;height:66px;border-radius:50%;object-fit:cover;object-position:center 26%;flex:none;box-shadow:0 6px 16px rgba(41,25,10,.18)}
.ts-expert-t strong{display:block;font-size:15px;color:var(--ink)}
.ts-expert-t span{display:block;font-size:12.5px;font-weight:800;color:#FF6B35;margin-top:2px}
.ts-quote{margin:8px 0 0;font-size:14px;font-style:italic;color:#6a6157;max-width:360px}
@media(max-width:860px){
  .ts{grid-template-columns:1fr}
  .ts-media{order:1;min-height:auto;aspect-ratio:1/1}
  .ts-copy{order:2;padding:34px 22px 44px}
  .ts-p,.ts-quote{max-width:none}
}
"""

IMMERSIVE = """    <section class="cap" aria-label="שלושת הריטואלים">
      <div class="cap-label">שלושה מצבים · צבע אחד בכל רגע</div>
      <div class="cap-title"><h2>מסך שלובש את הריטואל.</h2><p>גללו — כל המסך עובר בין שלושת המצבים. מוצר אחד, צבע אחד, בכל רגע.</p></div>
      <div class="scroll-wrap" id="scrollWrap">
        <div class="scroll-sticky" id="scrollSticky">
          <div class="scroll-glow"></div>
          <div class="scroll-inner">
            <div class="scroll-stage" data-i="0" style="--accent:var(--energy)">
              <img class="scroll-pouch" src="__ENERGY__" alt="mood Energy">
              <span class="scroll-kicker">ENERGY · בוקר</span>
              <h2 class="scroll-h">להיכנס לקצב.</h2>
              <p class="scroll-sub">16:30. במקום עוד קפה — ריטואל שעולה לאט, בלי הנפילה.</p>
            </div>
            <div class="scroll-stage" data-i="1" style="--accent:var(--relax)">
              <img class="scroll-pouch" src="__RELAX__" alt="mood Relax">
              <span class="scroll-kicker">RELAX · ערב</span>
              <h2 class="scroll-h">להוריד הילוך.</h2>
              <p class="scroll-sub">הרעש נכבה. רגע המעבר שבין היום לזמן שלך.</p>
            </div>
            <div class="scroll-stage" data-i="2" style="--accent:var(--sleep)">
              <img class="scroll-pouch" src="__SLEEP__" alt="mood Sleep">
              <span class="scroll-kicker">SLEEP · לילה</span>
              <h2 class="scroll-h">להאט באמת.</h2>
              <p class="scroll-sub">המוח סוף סוף נרדם. לסגור את היום בקצב אחר.</p>
            </div>
          </div>
          <div class="scroll-dots"><i class="on"></i><i></i><i></i></div>
        </div>
      </div>
    </section>
"""

TIMELINE = """    <section class="cap" aria-label="היום שלך עם mood">
      <div class="cap-label">ריטואל לכל שעה</div>
      <div class="cap-title"><h2>איך זה נכנס ליום שלך.</h2><p>גררו לאורך היום — הסצנה, הצבע והמוצר משתנים לפי הרגע.</p></div>
      <div class="day">
        <div class="day-scene" id="dayScene" style="--accent:var(--energy)">
          <div class="glow"></div>
          <div class="day-inner">
            <div class="day-time" id="dayTime">08:00</div>
            <img class="day-pouch" id="dayPouch" src="__ENERGY__" alt="">
            <div class="day-kick" id="dayKick">ENERGY · בוקר</div>
            <div class="day-line" id="dayLine">רגע להיכנס לקצב.</div>
          </div>
        </div>
        <div class="day-slider">
          <input type="range" min="6" max="23" value="8" step="1" id="daySlider" aria-label="שעה ביום">
          <div class="day-ticks"><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
        </div>
      </div>
    </section>
"""

BUNDLE = """    <section class="cap" aria-label="בונה ריטואל-קיט">
      <div class="cap-label">בונה ריטואל-קיט</div>
      <div class="cap-title"><h2>בונים את היום שלכם.</h2><p>מחיר מתעדכן חי, הנחה עולה עם כל מארז, וה-CTA תמיד איתכם.</p></div>
      <div class="bundle" id="bundle">
        <div class="brow" data-sku="energy" style="--c:var(--energy)">
          <img src="__ENERGY__" alt="Energy">
          <div class="bmeta"><b><i></i>ENERGY</b><span>לרגעים של תנועה ומיקוד</span></div>
          <div class="stepper"><button data-d="-1" aria-label="הפחת">−</button><span class="qv">1</span><button data-d="1" aria-label="הוסף">+</button></div>
        </div>
        <div class="brow" data-sku="relax" style="--c:var(--relax)">
          <img src="__RELAX__" alt="Relax">
          <div class="bmeta"><b><i></i>RELAX</b><span>לרגע להוריד הילוך</span></div>
          <div class="stepper"><button data-d="-1" aria-label="הפחת">−</button><span class="qv">0</span><button data-d="1" aria-label="הוסף">+</button></div>
        </div>
        <div class="brow" data-sku="sleep" style="--c:var(--sleep)">
          <img src="__SLEEP__" alt="Sleep">
          <div class="bmeta"><b><i></i>SLEEP</b><span>לרגע לסגור את היום</span></div>
          <div class="stepper"><button data-d="-1" aria-label="הפחת">−</button><span class="qv">0</span><button data-d="1" aria-label="הוסף">+</button></div>
        </div>
      </div>
      <div class="bbar">
        <div class="binfo"><b id="bTotal">₪170</b><span class="was" id="bWas" hidden></span><small id="bSave" hidden></small></div>
        <button class="badd" id="bAdd">הוסיפו לסל · <span id="bBoxes">מארז 1</span></button>
      </div>
    </section>
"""

CAP_JS = """  <script>
  (function(){
  var POUCH={energy:"__ENERGY__",relax:"__RELAX__",sleep:"__SLEEP__"};
  var ACCENT={energy:"var(--energy)",relax:"var(--relax)",sleep:"var(--sleep)"};
  var HEX={energy:"#e8812c",relax:"#7e9b63",sleep:"#5e7ba8"};
  /* immersive scroll */
  (function(){
    var wrap=document.getElementById("scrollWrap"); if(!wrap)return;
    var sticky=document.getElementById("scrollSticky");
    var stages=[].slice.call(document.querySelectorAll(".scroll-stage"));
    var dots=[].slice.call(document.querySelectorAll(".scroll-dots i"));
    var cur=-1, ticking=false, HK=["energy","relax","sleep"];
    function set(i){ if(i===cur)return; cur=i;
      stages.forEach(function(s,k){s.classList.toggle("on",k===i);});
      dots.forEach(function(d,k){d.classList.toggle("on",k===i);});
      sticky.style.setProperty("--accent",ACCENT[HK[i]]);
      sticky.style.backgroundColor="color-mix(in srgb,"+HEX[HK[i]]+" 8%, var(--cream))";
    }
    function upd(){ ticking=false;
      var r=wrap.getBoundingClientRect(), total=wrap.offsetHeight-window.innerHeight;
      var p=Math.min(1,Math.max(0,(-r.top)/total));
      set(Math.min(2,Math.floor(p*2.999)));
    }
    addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(upd);}},{passive:true});
    addEventListener("resize",upd); set(0); upd();
  })();
  /* quiz */
  (function(){
    var q=document.getElementById("quizQ"), r=document.getElementById("quizR"); if(!q)return;
    var COPY={
      energy:{h:"mood ENERGY",p:"לרגעים שצריך בהם יותר תנועה ומיקוד — אנרגיה שעולה לאט, בלי הרעד והנפילה של הקפה.",k:"הריטואל שלך"},
      relax:{h:"mood RELAX",p:"לרגע המעבר שבין היום לזמן שלך — להוריד הילוך בעדינות, בלי כובד.",k:"הריטואל שלך"},
      sleep:{h:"mood SLEEP",p:"לרגע שמסמן שהיום נגמר — להאט ולהתכונן ללילה, בלי כבדות בבוקר.",k:"הריטואל שלך"}
    };
    q.querySelectorAll(".quiz-opt").forEach(function(b){ b.addEventListener("click",function(){
      var sku=b.dataset.sku, c=COPY[sku];
      r.style.setProperty("--accent",ACCENT[sku]);
      r.innerHTML='<img class="rpouch" src="'+POUCH[sku]+'" alt=""><div class="rkick">'+c.k+'</div><h3>'+c.h+'</h3><p>'+c.p+'</p><button class="qbtn">קחו אותי לריטואל</button><button class="qreset">‹ נסו שוב</button>';
      q.style.display="none"; r.classList.add("on");
      try{r.scrollIntoView({behavior:"smooth",block:"center"});}catch(e){}
      r.querySelector(".qbtn").addEventListener("click",function(){ if(window.moodPrefill)window.moodPrefill(sku); });
      r.querySelector(".qreset").addEventListener("click",function(){r.classList.remove("on");r.innerHTML="";q.style.display="";});
    });});
  })();
  /* bundle */
  (function(){
    var PRICE=170, qs={energy:1,relax:0,sleep:0};
    var bundle=document.getElementById("bundle"); if(!bundle)return;
    var elTotal=document.getElementById("bTotal"), elWas=document.getElementById("bWas"),
      elSave=document.getElementById("bSave"), elBoxes=document.getElementById("bBoxes");
    function render(){
      bundle.querySelectorAll(".brow").forEach(function(row){ row.querySelector(".qv").textContent=qs[row.dataset.sku]; });
      var boxes=qs.energy+qs.relax+qs.sleep, gross=boxes*PRICE;
      var rate=boxes>=3?.10:boxes>=2?.05:0, net=Math.round(gross*(1-rate));
      elTotal.textContent="₪"+net;
      elBoxes.textContent=boxes===0?"בחרו מארז":("מארז"+(boxes>1?"ים ×"+boxes:" 1"));
      if(rate>0){elWas.hidden=false;elWas.textContent="₪"+gross;elSave.hidden=false;elSave.textContent="חסכתם ₪"+(gross-net)+" · "+(rate*100)+"% הנחה";}
      else{elWas.hidden=true;elSave.hidden=true;}
      document.getElementById("bAdd").disabled=boxes===0;
    }
    bundle.addEventListener("click",function(e){
      var btn=e.target.closest("button[data-d]"); if(!btn)return;
      var sku=btn.closest(".brow").dataset.sku;
      qs[sku]=Math.max(0,Math.min(9,qs[sku]+ +btn.dataset.d)); render();
    });
    render();
    // quiz → funnel spine: the quiz result prefills THIS bundle with the
    // recommended SKU and brings the visitor straight here (steal Mayven)
    window.moodPrefill=function(sku){ if(qs[sku]===undefined)return;
      qs={energy:0,relax:0,sleep:0}; qs[sku]=1; render();
      bundle.scrollIntoView({behavior:"smooth",block:"center"}); };
    var bar=document.querySelector(".bbar");
    new IntersectionObserver(function(es){es.forEach(function(e){bar.classList.toggle("show",e.isIntersecting);});},
      {rootMargin:"-30% 0px -20% 0px"}).observe(bundle);
  })();
  /* day timeline */
  (function(){
    var s=document.getElementById("daySlider"), scene=document.getElementById("dayScene"); if(!s)return;
    var elT=document.getElementById("dayTime"), elP=document.getElementById("dayPouch"),
      elK=document.getElementById("dayKick"), elL=document.getElementById("dayLine");
    var DATA={energy:{k:"ENERGY · בוקר",l:"רגע להיכנס לקצב.",kaft:"ENERGY · צהריים"},
      relax:{k:"RELAX · ערב",l:"רגע להוריד הילוך."},sleep:{k:"SLEEP · לילה",l:"רגע להאט ולישון."}};
    function skuFor(h){return h<15?"energy":h<21?"relax":"sleep";}
    function upd(){
      var h=+s.value, sku=skuFor(h);
      elT.textContent=(h<10?"0":"")+h+":00";
      scene.style.setProperty("--accent",ACCENT[sku]);
      scene.style.backgroundColor="color-mix(in srgb,"+HEX[sku]+" 9%, var(--cream))";
      elP.src=POUCH[sku];
      elK.textContent=(sku==="energy"&&h>=11)?DATA.energy.kaft:DATA[sku].k;
      elL.textContent=DATA[sku].l;
    }
    s.addEventListener("input",upd); upd();
  })();
  })();
  </script>
"""


# ============================================================================
# Live, bold hero (replaces the flat baked hero PNG) — real nav + announcement,
# lifestyle photo that swaps per SKU, live Heebo headline, color-reactive accent
# ============================================================================
XHERO_CSS = """
/* announcement + nav */
.xannounce{background:var(--ink);color:#f5eee4;text-align:center;font-size:12px;font-weight:700;letter-spacing:.02em;padding:10px 16px}
.xnav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px clamp(18px,4vw,34px);background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid #eee}
.xnav-links{display:flex;gap:22px}
.xnav-links a{color:#4c4841;text-decoration:none;font-size:14px;font-weight:700}
.xnav-links a:hover{color:var(--ink)}
.xlogo{font-size:26px;font-weight:900;letter-spacing:-.02em;color:var(--ink);text-decoration:none}
.xlogo span{position:relative;color:var(--energy)}
.xlogo span::after{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:7px;height:7px;border-radius:50%;background:#f5eee4}
.xnav-cta{background:var(--ink);color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:800;text-decoration:none;white-space:nowrap}
/* hero */
.xhero{position:relative;display:grid;grid-template-columns:1.05fr 1fr;min-height:min(86vh,780px);background:var(--cream);overflow:hidden}
.xhero-media{position:relative;order:2;overflow:hidden;background:#e7ddcf}
.xh-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 28%;opacity:0;transition:opacity .6s ease}
.xh-photo.on{opacity:1}
.xhero-copy{order:1;display:flex;flex-direction:column;justify-content:center;padding:clamp(30px,5vw,84px);z-index:2}
.xhero-eyebrow{font-size:12px;font-weight:900;letter-spacing:.2em;color:var(--accent);margin-bottom:20px;transition:color .5s}
.xhero-h{font-size:clamp(40px,6vw,78px);line-height:.98;letter-spacing:-.045em;font-weight:900;color:var(--ink);margin:0}
.xhero-h .xh-mood{color:var(--accent);transition:color .5s}
.xhero-sub{max-width:440px;margin:24px 0 0;color:#4c4841;font-size:clamp(15px,1.4vw,18px);line-height:1.6}
.xhero-moods{display:flex;gap:8px;margin:32px 0 0;direction:ltr}
.xhero-moods button{padding:9px 18px;border-radius:999px;border:1px solid #d9cdbb;background:transparent;color:#6a6157;font-size:12px;font-weight:900;letter-spacing:.08em;cursor:pointer;transition:background .22s,color .22s,border-color .22s,transform .22s}
.xhero-moods button:hover{transform:translateY(-2px)}
.xhero-moods button.on{background:var(--accent);border-color:var(--accent);color:#fff}
.xhero-cta{display:flex;gap:12px;margin:30px 0 0;flex-wrap:wrap}
.xh-primary{background:var(--accent);color:#fff;padding:16px 32px;border-radius:999px;font-size:15px;font-weight:800;text-decoration:none;transition:transform .2s,background .5s}
.xh-primary:hover{transform:translateY(-2px)}
.xh-secondary{background:#fff;color:var(--ink);border:1px solid #e2d8c8;padding:16px 26px;border-radius:999px;font-size:15px;font-weight:800;text-decoration:none;transition:transform .2s}
.xh-secondary:hover{transform:translateY(-2px)}
.xhero-claims{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 0;direction:rtl}
.xhero-claims span{font-size:12.5px;font-weight:700;color:#5a5249;background:#fff;border:1px solid #e6dccb;border-radius:999px;padding:7px 13px}
.xhero-claims b{color:var(--accent);font-weight:900;transition:color .5s}
.xhero-guar{margin:18px 0 0;font-size:12.5px;font-weight:700;color:#8a7f70}
.xtrust{background:var(--ink);color:#efe7db;display:flex;flex-wrap:wrap;justify-content:center;gap:10px 26px;padding:13px 20px;font-size:13px;font-weight:700;direction:rtl}
.xtrust span{display:inline-flex;align-items:center;gap:8px}
.xtrust span::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--energy)}
/* discovery box — the founding-member intro offer (steal GOOM) */
.xkit{background:linear-gradient(180deg,#ffffff,#f5eee4);padding:clamp(56px,8vw,104px) 24px}
.xkit-in{width:min(1060px,100%);margin:0 auto;display:grid;grid-template-columns:1.05fr 1fr;gap:clamp(28px,5vw,60px);align-items:center;direction:rtl}
.xkit-media{position:relative;display:grid;place-items:center;min-height:360px}
.xkit-glow{position:absolute;width:80%;height:70%;border-radius:50%;background:radial-gradient(closest-side,rgba(232,129,44,.20),transparent);filter:blur(8px)}
.xkit-pouches{position:relative;display:flex;justify-content:center;align-items:flex-end}
.xkit-pouches img{height:clamp(190px,25vw,300px);width:auto;filter:drop-shadow(0 22px 26px rgba(41,31,18,.22))}
.xkit-pouches img:nth-child(1){transform:rotate(-8deg) translateX(26px);z-index:1}
.xkit-pouches img:nth-child(2){height:clamp(220px,29vw,344px);z-index:3}
.xkit-pouches img:nth-child(3){transform:rotate(8deg) translateX(-26px);z-index:1}
.xkit-badge{position:absolute;top:6px;right:6px;background:var(--ink);color:#fff;font-size:11px;font-weight:900;letter-spacing:.08em;padding:8px 13px;border-radius:999px;z-index:4}
.xkit-eyebrow{font-size:12px;font-weight:900;letter-spacing:.18em;color:#b06a3a}
.xkit-h{font-size:clamp(32px,4.4vw,52px);line-height:1;letter-spacing:-.045em;font-weight:900;color:var(--ink);margin:12px 0 0}
.xkit-sub{margin:16px 0 0;color:#4c4841;font-size:clamp(15px,1.4vw,18px);line-height:1.6;max-width:440px}
.xkit-list{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:9px}
.xkit-list li{position:relative;padding-right:26px;font-size:14.5px;font-weight:600;color:#3a352e}
.xkit-list li::before{content:"✓";position:absolute;right:0;top:0;color:#e8812c;font-weight:900}
.xkit-price{display:flex;align-items:baseline;gap:12px;margin:24px 0 0;direction:rtl}
.xkit-now{font-size:40px;font-weight:900;letter-spacing:-.03em;color:var(--ink)}
.xkit-was{font-size:20px;font-weight:700;color:#a89a86;text-decoration:line-through}
.xkit-save{font-size:12px;font-weight:900;color:#3f7a3a;background:#e6f0e2;border-radius:999px;padding:6px 12px}
.xkit-pay{margin:8px 0 0;font-size:12.5px;font-weight:700;color:#8a7f70}
.xkit-cta{display:inline-block;margin:22px 0 0;background:var(--ink);color:#fff;padding:17px 38px;border-radius:999px;font-size:16px;font-weight:800;text-decoration:none;transition:transform .2s}
.xkit-cta:hover{transform:translateY(-2px)}
.xkit-guar{margin:16px 0 0;font-size:13px;color:#6a6157}
.xkit-guar b{color:var(--ink);font-weight:800}
@media(max-width:820px){
  .xnav-links{display:none}
  .xhero{grid-template-columns:1fr;min-height:0}
  .xhero-media{order:1;aspect-ratio:4/5}
  .xhero-copy{order:2;padding:34px 22px 42px}
  .xhero-h{font-size:clamp(34px,10vw,54px)}
  .xkit-in{grid-template-columns:1fr;gap:18px}
  .xkit-media{min-height:250px;order:1}
  .xkit-copy{order:2}
  .xkit-h{font-size:clamp(30px,9vw,42px)}
}
/* ===== 3D interactive product hero — pouch floats, auto-turns, tilts to pointer ===== */
.hero3d{position:relative;display:grid;grid-template-columns:1.08fr .92fr;min-height:min(88vh,820px);background:var(--cream);overflow:hidden}
.h3-stage{position:relative;order:1;display:grid;place-items:center;perspective:1200px;overflow:hidden;
  background:radial-gradient(58% 56% at 50% 44%, color-mix(in srgb,var(--accent) 26%, #f2e7d6), #ece1cf);transition:background .6s ease}
.h3-shadow{position:absolute;bottom:12%;width:min(46%,300px);height:36px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(41,25,10,.32),transparent);filter:blur(6px);animation:h3sh 7s ease-in-out infinite alternate}
.h3-float{animation:h3float 7s ease-in-out infinite alternate}
.h3-spin{animation:h3spin 9s ease-in-out infinite alternate;transform-style:preserve-3d}
.h3-obj{position:relative;height:clamp(300px,48vh,540px);aspect-ratio:3/4;transform-style:preserve-3d;
  transition:transform .5s cubic-bezier(.22,.8,.28,1);will-change:transform}
.h3-p{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .5s ease;
  filter:drop-shadow(0 34px 40px rgba(41,25,10,.34))}
.h3-p.on{opacity:1}
.h3-glare{position:absolute;inset:-25%;opacity:0;pointer-events:none;transition:opacity .3s ease;mix-blend-mode:soft-light;
  background:linear-gradient(115deg,transparent 43%,rgba(255,255,255,.6) 50%,transparent 57%)}
.h3-hint{position:absolute;bottom:18px;font-size:11px;font-weight:800;letter-spacing:.14em;color:#a89a86}
.h3-copy{order:2;display:flex;flex-direction:column;justify-content:center;padding:clamp(30px,5vw,84px)}
.h3-eyebrow{font-size:12px;font-weight:900;letter-spacing:.2em;color:var(--accent);margin-bottom:18px;transition:color .5s}
.h3-h{font-size:clamp(48px,7.2vw,96px);line-height:.92;letter-spacing:-.05em;font-weight:900;color:var(--ink);margin:0}
.h3-h .xh-mood{color:var(--accent);transition:color .5s}
.h3-moods{display:flex;gap:8px;margin:32px 0 0;direction:ltr}
.h3-moods button{padding:9px 18px;border-radius:999px;border:1px solid #d9cdbb;background:transparent;color:#6a6157;font-size:12px;font-weight:900;letter-spacing:.08em;cursor:pointer;transition:.22s}
.h3-moods button:hover{transform:translateY(-2px)}
.h3-moods button.on{background:var(--accent);border-color:var(--accent);color:#fff}
.h3-cta{align-self:flex-start;margin:26px 0 0;background:var(--ink);color:#fff;padding:16px 34px;border-radius:999px;font-size:15px;font-weight:800;text-decoration:none;transition:transform .2s}
.h3-cta:hover{transform:translateY(-2px)}
@keyframes h3float{from{transform:translateY(-12px)}to{transform:translateY(12px)}}
@keyframes h3spin{from{transform:rotateY(-9deg)}to{transform:rotateY(9deg)}}
@keyframes h3sh{from{transform:scale(.9);opacity:.5}to{transform:scale(1.08);opacity:.85}}
@media(max-width:820px){
  .hero3d{grid-template-columns:1fr;min-height:0}
  .h3-stage{order:1;min-height:54vh;padding:16px 0}
  .h3-copy{order:2;padding:28px 22px 40px}
  .h3-h{font-size:clamp(42px,13vw,66px)}
  .h3-obj{height:min(48vh,400px)}
}
@media(prefers-reduced-motion:reduce){
  .h3-float,.h3-spin,.h3-shadow{animation:none}
  .h3-obj{transition:none}
}
/* ===== brand hero — the real chocolate bar + chocolate particles rotating in 3D ===== */
.hb{position:relative;display:grid;grid-template-columns:.95fr 1.05fr;align-items:center;min-height:min(90vh,860px);overflow:hidden;
  background:radial-gradient(78% 88% at 56% 42%,#5a3d28,#3a2617 64%,#271811)}
.hb-copy{order:1;z-index:3;padding:clamp(30px,5vw,84px);direction:rtl}
.hb-eyebrow{font-size:12px;font-weight:900;letter-spacing:.24em;color:var(--energy)}
.hb-h{font-size:clamp(44px,6.6vw,98px);line-height:.98;letter-spacing:-.045em;font-weight:900;color:#f7efe4;margin:16px 0 0;text-shadow:0 2px 40px rgba(0,0,0,.45)}
.hb-cta{display:inline-block;margin:28px 0 0;background:var(--energy);color:#271811;padding:16px 36px;border-radius:999px;font-size:15px;font-weight:800;text-decoration:none;transition:transform .2s}
.hb-cta:hover{transform:translateY(-2px)}
.hb-stage{order:2;position:relative;display:grid;place-items:center;perspective:1500px;min-height:60vh}
.hb-float{animation:hbFloat 7s ease-in-out infinite alternate;z-index:2}
.hb-spin{animation:hbSpin 13s ease-in-out infinite alternate;transform-style:preserve-3d}
.hb-obj{position:relative;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.22,.8,.28,1);will-change:transform}
.hb-obj img{height:clamp(340px,68vh,700px);width:auto;display:block;
  -webkit-mask-image:radial-gradient(64% 66% at 50% 47%,#000 62%,rgba(0,0,0,0) 90%);
  mask-image:radial-gradient(64% 66% at 50% 47%,#000 62%,rgba(0,0,0,0) 90%);
  filter:drop-shadow(0 44px 54px rgba(0,0,0,.5))}
/* floating chocolate particles orbiting the bar in 3D */
.hb-particles{position:absolute;inset:0;z-index:1;pointer-events:none;transform-style:preserve-3d}
.hb-particles i{position:absolute;top:50%;left:50%;width:var(--s);height:var(--s);border-radius:52% 46% 50% 48%;
  background:radial-gradient(circle at 34% 28%,#7a5638,#2c1b0f 78%);box-shadow:0 5px 10px rgba(0,0,0,.45);opacity:.9;
  transform:translate(-50%,-50%) translate(var(--x),var(--y));animation:hbPart var(--d) ease-in-out var(--dl) infinite alternate}
@keyframes hbFloat{from{transform:translateY(-12px)}to{transform:translateY(12px)}}
@keyframes hbSpin{from{transform:rotateY(-11deg)}to{transform:rotateY(11deg)}}
@keyframes hbPart{from{transform:translate(-50%,-50%) translate(var(--x),var(--y)) translateZ(-30px) rotate(0deg)}
  to{transform:translate(-50%,-50%) translate(calc(var(--x) + 16px),calc(var(--y) - 22px)) translateZ(60px) rotate(50deg)}}
@media(max-width:820px){
  .hb{grid-template-columns:1fr;min-height:0}
  .hb-stage{order:1;min-height:52vh;padding-top:14px}
  .hb-copy{order:2;padding:24px 22px 44px}
  .hb-h{font-size:clamp(38px,11vw,60px)}
  .hb-obj img{height:min(56vh,460px)}
  .hb-particles i{opacity:.7}
}
@media(prefers-reduced-motion:reduce){.hb-float,.hb-spin,.hb-particles i{animation:none}.hb-obj{transition:none}}
"""

XHERO = """    <header class="xtop">
      <div class="xannounce">משלוח חינם בקנייה מעל 249 ₪ · מוקד שירות ישראלי</div>
      <nav class="xnav" aria-label="ניווט ראשי">
        <div class="xnav-links"><a href="#products">המוצרים</a><a href="#story">השוקולד</a><a href="#founders">הסיפור שלנו</a></div>
        <a class="xlogo" href="#top" aria-label="mood">mo<span>o</span>d</a>
        <a class="xnav-cta" href="#products">מה מתאים לי?</a>
      </nav>
    </header>
    <section class="vh" id="xhero" aria-label="mood — שוקולד פונקציונלי">
      <div class="vh-media">
        <video class="vh-vid" autoplay muted loop playsinline preload="metadata" poster="__HEROPOSTER__">
          <source src="__HEROVIDEO__" type="video/mp4">
        </video>
        <div class="vh-fade" aria-hidden="true"></div>
      </div>
      <div class="vh-copy">
        <h1 class="vh-h">שוקולד שמשנה<br>לך את המצב.</h1>
        <a class="vh-cta" href="#products">הזמינו עכשיו</a>
      </div>
    </section>
"""

HERO_JS = """  <script>
  (function(){
    // the real chocolate bar turns toward the pointer/touch in 3D (over the
    // slow auto-spin), and settles back when you leave
    var stage=document.getElementById("hbStage"), obj=document.getElementById("hbObj");
    if(!stage||!obj||matchMedia("(prefers-reduced-motion:reduce)").matches)return;
    var raf=0, tx=0, ty=0;
    function apply(){ raf=0; obj.style.transform="rotateY("+(tx*24)+"deg) rotateX("+(-ty*12)+"deg)"; }
    stage.addEventListener("pointermove",function(e){
      var r=stage.getBoundingClientRect();
      tx=(e.clientX-r.left)/r.width-0.5; ty=(e.clientY-r.top)/r.height-0.5;
      if(!raf)raf=requestAnimationFrame(apply);
    });
    stage.addEventListener("pointerleave",function(){ obj.style.transform=""; });
  })();
  </script>
"""


JOIN_JS = """  <script>
  (function(){
    var el=document.getElementById("hcCount");
    if(el){
      var target=new Date("2026-08-12T00:00:00+03:00").getTime();
      function tick(){
        var d=target-Date.now(); if(d<0)d=0;
        el.querySelector('[data-u=d]').textContent=Math.floor(d/864e5);
        el.querySelector('[data-u=h]').textContent=Math.floor(d/36e5)%24;
        el.querySelector('[data-u=m]').textContent=Math.floor(d/6e4)%60;
        el.querySelector('[data-u=s]').textContent=Math.floor(d/1e3)%60;
      }
      tick(); setInterval(tick,1000);
    }
    var f=document.getElementById("joinForm"), note=document.getElementById("joinNote");
    if(f)f.addEventListener("submit",function(e){
      e.preventDefault();
      if(!f.querySelector('input[type=email]').value) return;
      f.style.display="none";
      note.textContent="נרשמת! נהיה בקשר ב-12.8.";
      note.style.color="#fff";
    });
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
        # --- Ronen Apelo is a REAL master chocolatier (World Chocolate Champion
        # 2022). Keep the approved chocolatier tile; make the credential specific
        # and true — the 2022 title is a genuine credibility asset, not a claim to hide.
        html = html.replace("<span>זוכה פרסים בינלאומיים</span>",
                            "<span>אלוף השוקולד העולמי 2022</span>")
    if filename == "product-cards.html":
        # the approved cards are oversized on mobile — tighten without touching
        # the pristine approved source
        html = html.replace("</head>",
            "<style>@media(max-width:700px){"
            ".section{min-height:0;padding:26px 0 18px}"
            ".card{flex:0 0 80vw}"
            ".visual{height:210px}.unit.main{height:165px}.unit.left,.unit.right{height:118px}"
            ".unit.left{left:22px}.unit.right{right:22px}"
            ".content{padding:0 20px 20px}h2{font-size:22px}"
            ".description{min-height:0;margin-bottom:9px;font-size:13px}"
            ".monthly{padding:8px 0 12px}.button{height:44px}"
            ".intro{margin-bottom:18px}h1{font-size:29px}"
            "}</style></head>")
    return html


def escape_srcdoc(html: str) -> str:
    return html.replace("&", "&amp;").replace('"', "&quot;")


def main():
    shell = (APP / "index.html").read_text(encoding="utf-8")
    # replace the flat baked hero PNG with the live, bold, interactive hero
    shell = re.sub(r'<section class="hero".*?</section>', XHERO, shell, count=1, flags=re.S)
    # tighter product-cards iframe on mobile (cards were oversized)
    shell = shell.replace(".products-frame { height: 844px; }",
                          ".products-frame { height: 620px; }")
    # fonts + new layer CSS into the shell head
    shell = shell.replace("<style>", "<style>\n" + FONTS + "\n", 1)
    shell = shell.replace("</style>", NEW_CSS + CAP_CSS + XHERO_CSS + FORMULAS_CSS + VH_CSS + TS_CSS + "\n  </style>", 1)
    # inline approved formula strip images (hero now uses lifestyle markers)
    shell = inline_assets(shell)
    # layer the narrative sections in journey order (Curiosity->...->Purchase):
    #   hero · QUIZ · product cards · IMMERSIVE · marquee · cinematic(Ronen) ·
    #   founders · TIMELINE · formula · BUNDLE · close · footer
    # trust/credibility bar sits directly under the hero
    shell = shell.replace('    <section id="products"', MARQUEE + '    <section id="products"')
    # 3D formulas experience sits right below the product cards
    shell = shell.replace('    <section id="story"', FORMULAS + '    <section id="story"')
    # replace the cinematic story with the strong taste + world-champion section
    shell = re.sub(r'    <section id="story"(?! class="fml).*?</section>', STORY, shell, count=1, flags=re.S)
    shell = shell.replace('    <section id="formula"', FOUNDERS + TIMELINE + '    <section id="formula"')
    shell = shell.replace('  </main>', BUNDLE + CLOSE + '  </main>\n' + FOOTER)
    # the live FORMULAS (id="formulas") replaces the old static formula image
    shell = re.sub(r'    <section id="formula".*?</section>\n', '', shell, count=1, flags=re.S)
    # motion pass + interactive capability modules (inject BEFORE inlining, so the
    # __ENERGY__/__RELAX__/__SLEEP__ markers inside CAP_JS get replaced too)
    shell = shell.replace('</body>', MOTION_JS + CAP_JS + HERO_JS + FORMULAS_JS + '</body>')
    # inline the new-layer assets
    shell = shell.replace("__FOUNDERS__", data_uri("founders.jpg", HOME_ASSETS))
    shell = shell.replace("__CHOC__", data_uri("choc-dark.jpg", HOME_ASSETS))
    shell = shell.replace("__CHOCBAR__", data_uri("choc-float.jpg", HOME_ASSETS))
    shell = shell.replace("__HEROVIDEO__", data_uri("hero.mp4", HOME_ASSETS))
    shell = shell.replace("__HEROPOSTER__", data_uri("hero-poster.jpg", HOME_ASSETS))
    shell = shell.replace("__BITE__", data_uri("choc-real-bite.jpg", HOME_ASSETS))
    shell = shell.replace("__RONEN__", data_uri("ronen-real.jpg"))
    shell = shell.replace("__EDISC__", data_uri("energy-disc.jpg", HOME_ASSETS))
    shell = shell.replace("__RDISC__", data_uri("relax-disc.jpg", HOME_ASSETS))
    shell = shell.replace("__SDISC__", data_uri("sleep-disc.jpg", HOME_ASSETS))
    for _m, _f in {"__ENERGY__": "energy.webp", "__RELAX__": "relax.webp",
                   "__SLEEP__": "sleep.webp", "__ELIFE__": "energy-lifestyle.jpg",
                   "__RLIFE__": "relax-lifestyle.jpg", "__SLIFE__": "sleep-lifestyle.jpg"}.items():
        shell = shell.replace(_m, data_uri(_f))
    # fold the two interactive sections in as srcdoc
    products = escape_srcdoc(build_section("product-cards.html", False))
    shell = shell.replace('src="sections/product-cards.html"', f'srcdoc="{products}"')
    # the 3D formulas experience is a finished, self-contained file — host as-is
    # (NO build_section: never touch its internals), fold in as srcdoc
    formula_xp = escape_srcdoc((ROOT / "sections" / "formula.html").read_text(encoding="utf-8"))
    shell = shell.replace('src="sections/formula.html"', f'srcdoc="{formula_xp}"')

    # validate only the outer shell — the srcdoc contents are finished,
    # self-contained sub-documents (three.js may legitimately contain __THREE__)
    checkable = re.sub(r'srcdoc="[^"]*"', 'srcdoc=""', shell)
    left = re.findall(r'(?:\.\./)?(?:assets|sections)/[A-Za-z0-9_\-.]+', checkable)
    if left:
        sys.exit(f"unreplaced references remain: {set(left)}")
    leftover = set(re.findall(r'__[A-Z]+__', checkable))
    if leftover:
        sys.exit(f"unreplaced markers: {leftover}")
    out = ROOT / "home.html"
    out.write_text(shell, encoding="utf-8")
    print(f"built home.html ({out.stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
