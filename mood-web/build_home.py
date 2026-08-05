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
import base64, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
APP = ROOT / "approved"
ASSETS = APP / "assets"
HOME_ASSETS = ROOT / "home-assets"
MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".webp": "image/webp", ".mp4": "video/mp4", ".gif": "image/gif",
        ".woff2": "font/woff2"}

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
/* media reveals get a subtle scale-in (parallax-lite) */
.fl-photo.reveal,.meet-media.reveal,.ts-media.reveal{transform:translateY(26px) scale(.966);transition:opacity .9s cubic-bezier(.22,.8,.28,1),transform .9s cubic-bezier(.22,.8,.28,1)}
.fl-photo.reveal.in,.meet-media.reveal.in,.ts-media.reveal.in{transform:none}

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
.hm{background:#F0C6A0;overflow:hidden;padding:14px 0;direction:ltr;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent)}
.hm-track{display:flex;align-items:center;width:max-content;animation:hmScroll 60s linear infinite;will-change:transform}
.hm:hover .hm-track{animation-play-state:paused}
.hm-item{color:#5a3418;font-size:13.5px;font-weight:800;white-space:nowrap;padding:0 24px}
.hm-item b{color:#9a4611}
.hm-sep{width:4px;height:4px;border-radius:50%;background:rgba(90,52,24,.45);flex:0 0 auto}
@keyframes hmScroll{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}

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
.hc-cta{display:inline-block;margin:34px 0 0;padding:16px 34px;border-radius:999px;background:var(--energy);color:#171714;font-size:15px;font-weight:800;text-decoration:none;transition:transform .28s cubic-bezier(.34,1.56,.64,1),background .2s ease,box-shadow .28s ease}
.hc-cta:hover{transform:translateY(-2px) scale(1.02);background:#f2902e;box-shadow:0 14px 30px -8px var(--energy)}
.hc-cta:active{transform:translateY(0) scale(.98)}
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
  html{scroll-behavior:auto}
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

FOUNDERS = """    <section class="fl" id="founders" aria-label="מכתב מהמייסדים של mood">
      <div class="fl-wrap">
        <div class="fl-eyebrow reveal">מכתב מהמייסדים</div>
        <div class="fl-card reveal">
          <figure class="fl-photo">
            <img src="__FOUNDERS__" alt="נדב ומתיאס — מייסדי mood בסדנת השוקולד">
            <figcaption>נדב ומתיאס · הסדנה</figcaption>
          </figure>
          <div class="fl-body">
            <span class="fl-qm" aria-hidden="true">”</span>
            <p class="fl-lead">היי, אנחנו נדב ומתיאס.</p>
            <p>לפני שלוש שנים ישבנו במטבח קטן עם חלום אחד — ריטואל יומי קטן שבאמת עושה טוב. לקח שנתיים ואינספור נסיונות, ו<strong>סירבנו להתפשר על פרט אחד</strong> — לא על הטעם, לא על הפורמולה, לא על ההרגשה.</p>
            <p>לקחנו רק את הטוב ביותר, עד שכל קובייה יצאה בדיוק כמו שחלמנו. וזה מרגש אותנו לחלוק אותה איתכם.</p>
            <p class="fl-closer">באהבה,</p>
            <div class="fl-signs">
              <div class="fl-sig"><span class="fl-sig-name">נדב יצחקי</span><span class="fl-sig-role">מייסד mood</span></div>
              <div class="fl-sig"><span class="fl-sig-name">מתיאס דומינגז</span><span class="fl-sig-role">מייסד mood</span></div>
            </div>
            <div class="fl-prov">מאז 2023 · תוצרת ישראל</div>
          </div>
        </div>
      </div>
    </section>
"""

CLOSE = """    <section class="rc" id="club" aria-label="מועדון החברים של mood">
      <div class="club reveal">
        <div class="club-media">
          <img class="club-ph club-ph-w" src="__DUOWOMAN__" alt="רגע של רוגע עם mood">
          <img class="club-ph club-ph-m" src="__DUOMAN__" alt="רגע של שמחה עם mood">
          <span class="club-badge">המסלול המשתלם</span>
        </div>
        <div class="club-copy">
          <p class="club-eyebrow">מועדון mood</p>
          <h2 class="club-h">הריטואל שמגיע<br>אליכם כל חודש.</h2>
          <p class="club-sub">חברי המועדון מקבלים את הקופסה החודשית עד הבית — במחיר חבר קבוע, בלי לחשוב על זה.</p>
          <ul class="club-benes">
            <li>מחיר חבר קבוע — חוסכים בכל חודש</li>
            <li>משלוח חינם, כל חודש</li>
            <li>גישה ראשונה למהדורות ולטעמים חדשים</li>
            <li>לדלג, לעצור או לבטל — בקליק</li>
          </ul>
          <a class="club-cta" href="#products">הצטרפו למועדון</a>
          <p class="club-note">בלי התחייבות · מבטלים מתי שרוצים</p>
        </div>
      </div>
    </section>
"""

RC_CSS = """
/* closer — the members club: the best way to keep the ritual going */
.rc{position:relative;background:#efe7d9;padding:clamp(52px,7vw,104px) clamp(20px,5vw,60px);direction:rtl}
.club{max-width:1060px;margin:0 auto;background:#fff;border-radius:clamp(20px,2.6vw,30px);overflow:hidden;box-shadow:0 44px 100px -34px rgba(41,25,10,.42);display:grid;grid-template-columns:1fr 1.12fr;align-items:stretch}
.club-media{position:relative;background:#efe7d9;min-height:100%;overflow:hidden;display:grid;grid-template-columns:1fr 1fr;gap:4px}
.club-media img{width:100%;height:100%;object-fit:cover;display:block}
.club-ph-w{object-position:center 30%}
.club-ph-m{object-position:center 34%}
.club-badge{position:absolute;top:18px;inset-inline-start:18px;background:#2a1a0e;color:#fff;font-size:11px;font-weight:900;letter-spacing:.08em;padding:8px 15px;border-radius:999px;box-shadow:0 10px 22px -8px rgba(0,0,0,.4)}
.club-copy{padding:clamp(34px,4.6vw,64px);text-align:right;display:flex;flex-direction:column;justify-content:center}
.club-eyebrow{font-size:12px;font-weight:900;letter-spacing:.2em;color:#c07f43}
.club-h{font-size:clamp(30px,4.2vw,52px);line-height:1.02;letter-spacing:-.04em;font-weight:900;color:var(--ink);margin:12px 0 0}
.club-sub{margin:14px 0 0;max-width:440px;color:#6a6157;font-size:clamp(15px,1.35vw,17px);line-height:1.6}
.club-benes{list-style:none;margin:22px 0 0;padding:0;display:grid;gap:12px}
.club-benes li{position:relative;padding-inline-start:30px;font-size:14.5px;font-weight:700;color:#3f362d;line-height:1.4}
.club-benes li::before{content:"✓";position:absolute;inset-inline-start:0;top:-2px;width:21px;height:21px;border-radius:50%;background:#eaf0e2;color:#4c7a4a;font-size:12px;font-weight:900;display:grid;place-items:center}
.club-cta{display:inline-block;align-self:flex-start;margin:26px 0 0;padding:17px 42px;border-radius:999px;background:var(--ink);color:#fff;font-size:16px;font-weight:900;text-decoration:none;transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s}
.club-cta:hover{transform:translateY(-2px) scale(1.01);box-shadow:0 16px 34px -12px rgba(41,25,10,.5)}
.club-note{margin:14px 0 0;font-size:12.5px;font-weight:700;color:#9a8f80}
@media(max-width:820px){
  .club{grid-template-columns:1fr}
  .club-media{order:1;min-height:min(64vw,320px);height:min(64vw,320px)}
  .club-copy{order:2;padding:32px 24px 40px;text-align:center;align-items:center}
  .club-benes{text-align:right}
  .club-cta{align-self:center}
}
"""

RITUAL_JS = """  <script>
  (function(){
    var sec=document.getElementById("ritual"); if(!sec)return;
    var days=sec.querySelector("#rcDays");
    if(days){var h="";for(var i=0;i<30;i++){var o=(0.5+((i*7)%6)*0.09).toFixed(2);h+='<span class="rc-day" style="opacity:'+o+'"></span>';}days.innerHTML=h;}
    var T={energy:["#E8A566","#5a3418","#f8f0e4"],relax:["#5C8058","#2f4328","#eef3ea"],sleep:["#5e7ba8","#2b3d57","#edf1f7"]};
    var tabs=sec.querySelectorAll(".rc-pick button");
    function set(sku){var c=T[sku];sec.style.setProperty("--rc",c[0]);sec.style.setProperty("--rc-ink",c[1]);sec.style.setProperty("--rc-tint",c[2]);}
    tabs.forEach(function(b){b.addEventListener("click",function(){tabs.forEach(function(x){x.classList.toggle("on",x===b);});set(b.dataset.sku);});});
    set("energy");
  })();
  </script>
"""

FOOTER = """  <footer class="ft" aria-label="תחתית האתר">
    <img class="ft-watermark" src="__LOGOBLACK__" alt="" aria-hidden="true">
    <div class="ft-inner">
      <div class="ft-brand">
        <img class="ft-logo-img" src="__LOGOBLACK__" alt="mood · ritual chocolate">
        <p class="ft-tag">שוקולד מריר 70% · ריטואל פונקציונלי</p>
        <p class="ft-mini">שלושה רגעים ביום, שלוש פורמולות. ENERGY · RELAX · SLEEP.</p>
        <div class="ft-social">
          <a href="https://www.instagram.com/mood_ritual_chocolate" target="_blank" rel="noopener" aria-label="mood באינסטגרם"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg></a>
          <a href="https://www.tiktok.com/@mood_ritual_chocolate" target="_blank" rel="noopener" aria-label="mood בטיקטוק"><svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M16.5 3c.3 2.1 1.5 3.6 3.5 3.9v2.5c-1.2.1-2.4-.2-3.5-.8v5.7c0 3.3-2.4 5.7-5.5 5.7S6 20.5 6 17.6c0-2.7 2-4.9 4.9-4.9.3 0 .6 0 .9.1v2.7c-.3-.1-.6-.2-.9-.2-1.3 0-2.3 1-2.3 2.3s1 2.3 2.3 2.3 2.4-1 2.4-2.6V3h2.7z"/></svg></a>
        </div>
      </div>
      <nav class="ft-col" aria-label="ניווט באתר">
        <h4>האתר</h4>
        <a href="#products">הרגעים</a>
        <a href="#formulas">הפורמולה</a>
        <a href="#founders">הסיפור שלנו</a>
        <a href="#faq">שאלות ותשובות</a>
        <a href="#club">מועדון החברים</a>
      </nav>
      <nav class="ft-col" aria-label="מידע ושירות">
        <h4>מידע</h4>
        <a href="mailto:hello@mood-chocolate.com">יצירת קשר</a>
        <a href="#faq">משלוחים והחזרות</a>
        <a href="#">תקנון האתר</a>
        <a href="#">מדיניות פרטיות</a>
        <a href="#">הצהרת נגישות</a>
      </nav>
      <div class="ft-col ft-launch">
        <h4>משיקים 12.8</h4>
        <p>שלושה רגעים ביום, פורמולה לכל אחד — הריטואל שמחכה לכם.</p>
        <a class="ft-join" href="#club">מועדון החברים<span aria-hidden="true"> ←</span></a>
      </div>
    </div>
    <div class="ft-bar">
      <span>© mood 2026 · תוצרת ישראל</span>
      <span>כשר פרווה · 0 גרם סוכר · רכיבים טבעיים</span>
    </div>
  </footer>
"""

TRUST = """    <section class="tstrip" aria-label="הבטחות mood">
      <ul class="tstrip-row">
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l2.4 1.7 2.9-.2 1 2.7 2.4 1.6-.7 2.9.7 2.9-2.4 1.6-1 2.7-2.9-.2L12 21l-2.4-1.7-2.9.2-1-2.7L3.3 13.4 4 10.5 3.3 7.6 5.7 6l1-2.7 2.9.2z"/><path d="M9 12l2 2 4-4"/></svg><span>כשר פרווה</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg><span>0 גרם סוכר</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg><span>25 מ״ג קפאין טבעי</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21c5-3 8-6.5 8-11a8 8 0 0 0-16 0c0 4.5 3 8 8 11z" transform="scale(1)"/><path d="M12 21c0-6 0-9 4-13"/></svg><span>רכיבים טבעיים</span></li>
        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg><span>משלוח חינם מעל ₪249</span></li>
      </ul>
    </section>
"""

LAUNCH = """    <section class="lnch" id="launch" aria-label="הרשמה לרשימת ההמתנה להשקה">
      <div class="lnch-card reveal">
        <p class="lnch-eyebrow">בקרוב · 12.8.2026</p>
        <h2 class="lnch-h">היו הראשונים לטעום.</h2>
        <p class="lnch-sub">mood משיק ב-12 באוגוסט. משאירים מייל ומקבלים גישה ראשונה, הטבת השקה וכל העדכונים — בלי ספאם, רק כשיש חדש.</p>
        <div class="lnch-count" id="lnchCount" dir="ltr" role="timer" aria-label="ספירה לאחור להשקה">
          <div class="lc-u"><b data-u="d">--</b><i>ימים</i></div>
          <div class="lc-u"><b data-u="h">--</b><i>שעות</i></div>
          <div class="lc-u"><b data-u="m">--</b><i>דקות</i></div>
          <div class="lc-u"><b data-u="s">--</b><i>שניות</i></div>
        </div>
        <form class="lnch-form" id="lnchForm" novalidate>
          <input type="email" id="lnchEmail" name="email" required autocomplete="email" placeholder="האימייל שלכם" aria-label="כתובת אימייל">
          <button type="submit">עדכנו אותי</button>
        </form>
        <p class="lnch-note" id="lnchNote">נרשמים פעם אחת. אנחנו נדאג לשאר.</p>
      </div>
    </section>
"""

FAQ = """    <section class="faq" id="faq" aria-label="שאלות ותשובות נפוצות">
      <div class="faq-head reveal">
        <p class="faq-eyebrow">שאלות נפוצות</p>
        <h2 class="faq-h">כל מה שרציתם לדעת.</h2>
      </div>
      <div class="faq-list reveal">
        <details class="faq-i"><summary>כמה קפאין יש בקובייה אחת?</summary><div class="faq-a">ב-ENERGY יש כ-25 מ״ג קפאין טבעי מגוארנה ותה ירוק — בערך רבע מכוס קפה. אנרגיה נקייה ויציבה, בלי הקפיצה והנפילה. RELAX ו-SLEEP מכוונים להרגעה, בלי בעיטת קפאין.</div></details>
        <details class="faq-i"><summary>מתי אוכלים כל mood?</summary><div class="faq-a">קובייה אחת ברגע הנכון: ENERGY לבוקר ולצהריים (16:30, במקום עוד קפה), RELAX לערב כשהראש לא נכבה, ו-SLEEP ללילה לפני השינה.</div></details>
        <details class="faq-i"><summary>כמה קוביות ביום?</summary><div class="faq-a">1–2 קוביות לפי הצורך. כל שקית היא 30 קוביות אישיות, ארוזות בנפרד — חודש שלם של ריטואל.</div></details>
        <details class="faq-i"><summary>מה יש בפנים? יש סוכר?</summary><div class="faq-a">שוקולד מריר 70% אמיתי עם מלח ים, ופורמולת רכיבים טבעיים — מאקה, גוארנה, ג'ינסנג, תה ירוק וליקוריץ. 0 גרם סוכר.</div></details>
        <details class="faq-i"><summary>זה כשר? מתאים לטבעונים?</summary><div class="faq-a">כן — כשר פרווה. שוקולד מריר בלי מוצרי חלב, כך שהוא מתאים גם לטבעונים.</div></details>
        <details class="faq-i"><summary>מתי אפשר לקנות, ואיך?</summary><div class="faq-a">משיקים ב-12.8. נרשמים עכשיו לרשימת ההמתנה ומקבלים גישה ראשונה והטבת השקה. משלוח חינם בהזמנה מעל ₪249.</div></details>
        <details class="faq-i"><summary>איך עובד מועדון החברים?</summary><div class="faq-a">הקופסה מגיעה עד הבית כל חודש, במחיר חבר קבוע ובמשלוח חינם. אפשר לדלג, לעצור או לבטל בכל עת — בקליק, בלי התחייבות.</div></details>
      </div>
    </section>
"""

FOOT_CSS = """
/* ---- trust strip ---- */
.tstrip{background:var(--cream);border-block:1px solid #ece4d5;padding:20px clamp(16px,4vw,40px)}
.tstrip-row{list-style:none;max-width:1100px;margin:0 auto;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:14px clamp(20px,4vw,48px)}
.tstrip-row li{display:flex;align-items:center;gap:9px;font-size:13.5px;font-weight:800;color:var(--ink);white-space:nowrap}
.tstrip-row svg{width:20px;height:20px;color:var(--energy);flex:none}
/* ---- launch / waitlist ---- */
.lnch{background:var(--cream);padding:clamp(40px,6vw,80px) clamp(18px,5vw,60px)}
.lnch-card{max-width:820px;margin:0 auto;background:#17100c;color:#f4e9db;border-radius:clamp(20px,3vw,32px);padding:clamp(34px,5vw,62px) clamp(24px,5vw,58px);text-align:center;box-shadow:0 44px 100px -40px rgba(23,16,12,.6);position:relative;overflow:hidden}
.lnch-card::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(80% 60% at 50% 0%,color-mix(in srgb,var(--energy) 26%,transparent),transparent 62%)}
.lnch-card>*{position:relative}
.lnch-eyebrow{font-size:12px;font-weight:900;letter-spacing:.2em;color:var(--energy);margin:0}
.lnch-h{font-size:clamp(30px,5vw,52px);line-height:1.03;letter-spacing:-.04em;font-weight:900;margin:12px 0 0}
.lnch-sub{margin:14px auto 0;max-width:520px;color:#c9bbaa;font-size:clamp(15px,1.4vw,17px);line-height:1.6}
.lnch-count{display:flex;justify-content:center;gap:clamp(10px,2.5vw,22px);margin:26px 0 4px}
.lc-u{min-width:64px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 6px}
.lc-u b{display:block;font-size:clamp(26px,4vw,38px);font-weight:900;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.lc-u i{display:block;margin-top:6px;font-style:normal;font-size:11px;font-weight:700;letter-spacing:.06em;color:#9d8f7e}
.lnch-form{display:flex;gap:10px;max-width:440px;margin:22px auto 0;flex-wrap:wrap}
.lnch-form input{flex:1;min-width:180px;padding:15px 20px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font-size:15px;font-family:inherit;text-align:right}
.lnch-form input::placeholder{color:#9d8f7e}
.lnch-form input:focus{outline:none;border-color:var(--energy);background:rgba(255,255,255,.1)}
.lnch-form button{padding:15px 30px;border:0;border-radius:999px;background:var(--energy);color:#2a1608;font-size:15px;font-weight:900;cursor:pointer;transition:transform .25s cubic-bezier(.34,1.56,.64,1),filter .25s}
.lnch-form button:hover{transform:translateY(-2px) scale(1.02);filter:brightness(1.05)}
.lnch-note{margin:14px 0 0;font-size:12.5px;font-weight:700;color:#8f8170}
.lnch-ok{margin:22px auto 0;max-width:460px;font-size:clamp(16px,1.6vw,19px);font-weight:800;color:#fff}
/* ---- FAQ ---- */
.faq{background:#fff;padding:clamp(48px,6vw,88px) clamp(18px,5vw,60px)}
.faq-head{max-width:760px;margin:0 auto;text-align:center}
.faq-eyebrow{font-size:12px;font-weight:900;letter-spacing:.18em;color:var(--energy);margin:0}
.faq-h{font-size:clamp(28px,4.4vw,46px);line-height:1.03;letter-spacing:-.04em;font-weight:900;color:var(--ink);margin:10px 0 0}
.faq-list{max-width:760px;margin:clamp(24px,3.5vw,42px) auto 0;direction:rtl}
.faq-i{border-bottom:1px solid #ece4d5}
.faq-i summary{list-style:none;cursor:pointer;padding:20px 6px;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:clamp(16px,1.6vw,19px);font-weight:800;color:var(--ink)}
.faq-i summary::-webkit-details-marker{display:none}
.faq-i summary::after{content:"+";font-size:26px;font-weight:400;color:var(--energy);transition:transform .3s;flex:none;line-height:1}
.faq-i[open] summary::after{transform:rotate(45deg)}
.faq-a{padding:0 6px 22px;color:#5a5148;font-size:clamp(14.5px,1.4vw,16.5px);line-height:1.75;max-width:64ch}
/* ---- real footer: warm-white, subtle logo watermark ---- */
.ft{position:relative;overflow:hidden;background:#faf5ec;color:#5a5148;border-top:1px solid #ece4d5;padding:clamp(44px,5vw,70px) clamp(20px,5vw,60px) 0}
.ft-watermark{position:absolute;left:50%;bottom:-6%;transform:translateX(-50%);width:min(1180px,128%);max-width:none;height:auto;opacity:.05;pointer-events:none;user-select:none;z-index:0}
.ft-inner{position:relative;z-index:1;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr 1fr 1.3fr;gap:clamp(26px,4vw,50px);text-align:right}
.ft-logo-img{height:40px;width:auto;display:block}
.ft-tag{margin:16px 0 0;font-size:13px;font-weight:800;color:var(--ink);letter-spacing:.01em}
.ft-mini{margin:8px 0 0;font-size:12.5px;line-height:1.6;color:#8a7f70;max-width:280px}
.ft-social{display:flex;gap:12px;margin:18px 0 0}
.ft-social a{width:38px;height:38px;border-radius:50%;border:1px solid #ddd2c0;display:grid;place-items:center;color:var(--ink);transition:background .25s,color .25s,transform .25s,border-color .25s}
.ft-social a:hover{background:var(--ink);color:#faf5ec;border-color:var(--ink);transform:translateY(-2px)}
.ft-col h4{margin:0 0 14px;font-size:12px;font-weight:900;letter-spacing:.12em;color:var(--ink)}
.ft-col a{display:block;text-decoration:none;color:#7d7264;font-size:13.5px;font-weight:600;padding:5px 0;transition:color .2s}
.ft-col a:hover{color:var(--energy)}
.ft-launch p{margin:0 0 14px;font-size:13px;line-height:1.6;color:#7d7264}
.ft-join{display:inline-block;color:var(--energy)!important;font-weight:900!important;font-size:14.5px!important;padding:0!important}
.ft-bar{position:relative;z-index:1;max-width:1100px;margin:clamp(34px,4vw,50px) auto 0;border-top:1px solid #ece4d5;padding:20px 0 26px;display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between;font-size:11.5px;font-weight:700;letter-spacing:.02em;color:#9a8f80}
@media(max-width:820px){
  .ft-inner{grid-template-columns:1fr 1fr;gap:28px 24px}
  .ft-brand{grid-column:1/-1}
  .ft-bar{justify-content:center;text-align:center}
  .ft-watermark{width:150%;opacity:.045}
}
@media(max-width:640px){
  .tstrip-row{gap:12px 20px}.tstrip-row li{font-size:12.5px}
  .lnch-form button{flex:1}
}
"""

FOOT_JS = """  <script>
  (function(){
    // launch countdown -> 12 Aug 2026, 00:00 Israel time
    var target = new Date('2026-08-12T00:00:00+03:00').getTime();
    var box = document.getElementById('lnchCount');
    function pad(n){return (n<10?'0':'')+n;}
    function tick(){
      if(!box) return;
      var diff = target - Date.now(); if(diff < 0) diff = 0;
      var d = Math.floor(diff/864e5), h = Math.floor(diff%864e5/36e5),
          m = Math.floor(diff%36e5/6e4), s = Math.floor(diff%6e4/1e3);
      var q=function(u){return box.querySelector('[data-u="'+u+'"]');};
      if(q('d'))q('d').textContent=d; if(q('h'))q('h').textContent=pad(h);
      if(q('m'))q('m').textContent=pad(m); if(q('s'))q('s').textContent=pad(s);
    }
    tick(); setInterval(tick, 1000);
    // waitlist form — client-side confirmation; wire to your email provider on launch
    var f = document.getElementById('lnchForm');
    if(f){ f.addEventListener('submit', function(e){
      e.preventDefault();
      var email = document.getElementById('lnchEmail');
      if(!email.value || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email.value)){ email.focus(); email.style.borderColor='#ff8a8a'; return; }
      f.style.display='none';
      var note = document.getElementById('lnchNote');
      if(note){ note.className='lnch-ok'; note.textContent='תודה! שמרנו לכם מקום — נהיה בקשר לפני 12.8.'; }
    }); }
  })();
  </script>
"""

MOTION_JS = """  <script>
  (function(){
    // force-play muted autoplay videos — some mobile/in-app browsers ignore the attribute
    function playVids(){document.querySelectorAll('video[autoplay]').forEach(function(v){v.muted=true;var p=v.play&&v.play();if(p&&p.catch)p.catch(function(){});});}
    playVids(); addEventListener('touchstart',playVids,{once:true,passive:true});
    // auto-fit embedded section iframes to their content -> no blank gap below the cards
    function fitFrames(){document.querySelectorAll('.section-frame').forEach(function(f){try{var h=f.contentDocument&&f.contentDocument.body&&f.contentDocument.body.scrollHeight;if(h)f.style.height=h+'px';}catch(e){}});}
    fitFrames(); addEventListener('load',fitFrames); addEventListener('resize',fitFrames); setTimeout(fitFrames,500); setTimeout(fitFrames,1400);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Apple-style staggered reveal: siblings enter one after another
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .16, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){
      // per-group stagger based on how many .reveal siblings precede this one
      var i=0, s=el;
      while((s=s.previousElementSibling)){ if(s.classList&&s.classList.contains('reveal')) i++; }
      if(i){ el.style.transitionDelay=Math.min(i*80,340)+'ms'; }
      io.observe(el);
    });
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

FORMULAS = """    <section class="fml" id="formulas" aria-label="הפורמולות של mood" style="--accent:#FF6B35">
      <div class="fml-head">
        <div class="fml-eyebrow">לא ערבוב מקרי · בחרו את ה-mood</div>
        <div class="fml-tabs" role="tablist" aria-label="בחירת פורמולה">
          <button class="on" data-sku="energy">ENERGY</button>
          <button data-sku="relax">RELAX</button>
          <button data-sku="sleep">SLEEP</button>
        </div>
      </div>
      <div class="fml-body">
        <div class="fml-media">
          <div class="fml-ghost" id="fmlGhost" aria-hidden="true">ENERGY</div>
          <img class="fml-pouch on" data-sku="energy" src="__ENERGY__" alt="שקית mood Energy">
          <img class="fml-pouch" data-sku="relax" src="__RELAX__" alt="שקית mood Relax">
          <img class="fml-pouch" data-sku="sleep" src="__SLEEP__" alt="שקית mood Sleep">
        </div>
        <div class="fml-copy">
          <h2 class="fml-h">פחות רשימה.<br>יותר כוונה.</h2>
          <p class="fml-sub">פורמולה אחרת לכל mood — בתוך יחידה אישית שקל להפוך לחלק מהיום.</p>
          <div class="fml-bar" id="fmlBar" aria-hidden="true"></div>
          <ul class="fml-list" id="fmlList"></ul>
          <div class="fml-note">30 יחידות אישיות · פורמולה מדויקת בכל ביס</div>
        </div>
      </div>
    </section>
"""

FORMULAS_CSS = """
/* clean formula — tabs on top (clearly buttons), pouch + ingredient list */
.fml{background:#efe7d9;padding:clamp(40px,5vw,72px) clamp(20px,5vw,64px) clamp(30px,3.4vw,48px)}
.fml-head{max-width:1100px;margin:0 auto;text-align:center}
.fml-eyebrow{font-size:12px;font-weight:900;letter-spacing:.14em;color:var(--accent);transition:color .4s}
.fml-tabs{display:inline-flex;gap:6px;margin-top:16px;background:#fff;border:1px solid #e4d7c2;border-radius:999px;padding:6px;box-shadow:0 8px 22px rgba(41,25,10,.08)}
.fml-tabs button{padding:12px 30px;border:0;border-radius:999px;background:transparent;color:#6a6157;font-size:14px;font-weight:900;letter-spacing:.06em;cursor:pointer;transition:.2s}
.fml-tabs button:hover{color:var(--ink)}
.fml-tabs button.on{background:var(--accent);color:var(--accent-ink,#fff);box-shadow:0 6px 16px -4px var(--accent)}
.fml-body{max-width:980px;margin:clamp(16px,2.2vw,28px) auto 0;display:grid;grid-template-columns:.82fr 1.18fr;gap:clamp(18px,3vw,44px);align-items:center}
.fml-media{position:relative;display:grid;place-items:center;min-height:min(34vh,300px)}
.fml-ghost{position:absolute;inset:0;display:grid;place-items:center;font-size:clamp(70px,12vw,150px);font-weight:900;letter-spacing:-.04em;color:var(--accent);opacity:.09;pointer-events:none;transition:color .4s}
.fml-pouch{grid-area:1/1;max-width:min(66%,236px);height:auto;filter:drop-shadow(0 26px 40px rgba(41,25,10,.22));opacity:0;transform:scale(.94);transition:opacity .45s,transform .45s}
.fml-pouch.on{opacity:1;transform:scale(1)}
.fml-copy{direction:rtl;text-align:right}
.fml-h{font-size:clamp(30px,4.4vw,54px);line-height:1;letter-spacing:-.04em;font-weight:900;color:var(--ink);margin:0}
.fml-sub{margin:10px 0 0;max-width:420px;color:var(--muted);font-size:clamp(14px,1.3vw,16.5px);line-height:1.55}
/* the recipe, as one composition bar */
.fml-bar{display:flex;height:clamp(32px,3.6vw,44px);border-radius:999px;overflow:hidden;margin:18px 0 0;max-width:480px;background:#e7ddca;box-shadow:inset 0 0 0 1px rgba(41,25,10,.06),0 12px 26px -16px rgba(41,25,10,.4)}
.fml-seg{position:relative;height:100%;min-width:2px;background:var(--accent);display:flex;align-items:center;justify-content:center;transition:width .6s cubic-bezier(.22,.8,.28,1),opacity .45s}
.fml-seg+.fml-seg{box-shadow:inset 1px 0 0 rgba(255,255,255,.55)}
.fml-seg i{font-style:normal;font-size:11px;font-weight:900;color:var(--accent-ink,#fff);direction:ltr;font-variant-numeric:tabular-nums;letter-spacing:-.02em;white-space:nowrap}
/* legend: color-keyed name · % · what it supports */
.fml-list{list-style:none;margin:16px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:12px 26px;max-width:480px}
.fml-list li{min-width:0;display:grid;grid-template-columns:auto 1fr;column-gap:9px;text-align:right}
.fi-dot{width:11px;height:11px;border-radius:3px;background:var(--accent);margin-top:4px}
.fi-t{display:flex;align-items:baseline;gap:7px;min-width:0}
.fi-t b{font-size:14.5px;font-weight:800;color:var(--ink);white-space:nowrap}
.fi-t i{font-style:normal;direction:ltr;font-size:13px;font-weight:900;color:var(--accent);font-variant-numeric:tabular-nums}
.fml-list em{grid-column:2;display:block;font-style:normal;font-size:12px;font-weight:700;color:#4c4238;line-height:1.3;margin-top:2px}
.fml-note{margin:16px 0 0;font-size:12.5px;font-weight:700;color:#8a7f70}
@media(max-width:820px){
  .fml-body{grid-template-columns:1fr;gap:0}
  .fml-media{min-height:96px;order:1}
  .fml-pouch{max-width:min(24%,96px)}
  .fml-ghost{font-size:clamp(40px,13vw,80px)}
  .fml-copy{order:2;text-align:center}
  .fml-h{font-size:clamp(25px,6.6vw,32px)}
  .fml-sub{max-width:none;margin:8px auto 0;font-size:14px}
  .fml-bar{margin:14px auto 0}
  .fml-list{max-width:none;grid-template-columns:1fr 1fr;column-gap:18px;row-gap:11px;margin-top:14px}
  .fml-list li{justify-items:start}
  .fml-list b{font-size:14px}
  .fml-list i{font-size:13.5px}
  .fml-list em{font-size:11.5px}
  .fml-note{margin-top:12px}
  .fml-tabs button{padding:10px 18px;font-size:13px;letter-spacing:.04em}
}
"""

NAV_JS = """  <script>
  (function(){
    var n=document.querySelector(".xnav"), b=document.getElementById("xBurger"); if(!n||!b)return;
    b.addEventListener("click",function(){var o=n.classList.toggle("open");b.setAttribute("aria-expanded",o?"true":"false");});
    n.querySelectorAll(".xnav-links a").forEach(function(a){a.addEventListener("click",function(){n.classList.remove("open");b.setAttribute("aria-expanded","false");});});
    // ---- Apple-style: condense the nav on scroll + thin scroll-progress bar ----
    var bar=document.createElement("div"); bar.className="xprog"; document.body.appendChild(bar);
    var ticking=false;
    function upd(){
      var y=window.pageYOffset||document.documentElement.scrollTop;
      n.classList.toggle("shrink", y>56);
      var h=document.documentElement.scrollHeight-window.innerHeight;
      bar.style.transform="scaleX("+(h>0?Math.min(1,y/h):0)+")";
      ticking=false;
    }
    addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(upd);}},{passive:true});
    upd();
  })();
  </script>
"""

FORMULAS_JS = """  <script>
  (function(){
    var sec=document.getElementById("formulas"); if(!sec)return;
    var DATA={
      energy:[["מאקה",32,"אנרגיה וחיוניות"],["גוארנה",24,"ערנות ומיקוד"],["תה ירוק",20,"מיקוד יומיומי"],["ג׳ינסנג",16,"חיוניות"],["ליקריץ",8,"איזון התערובת"]],
      relax:[["מליסה",38,"רוגע"],["פסיפלורה",26,"הרפיה"],["מאקה",20,"איזון וחיוניות"],["ולריאן",10,"רגיעה"],["ליקריץ",6,"איזון התערובת"]],
      sleep:[["ולריאן",30,"רגיעה עמוקה"],["פסיפלורה",30,"הרפיה"],["מליסה",32,"רוגע"],["ליקריץ",8,"איזון התערובת"]]
    };
    var HEX={energy:"#E8A566",relax:"#5C8058",sleep:"#5e7ba8"}, INK={energy:"#5a3418",relax:"#fff",sleep:"#fff"}, LABEL={energy:"ENERGY",relax:"RELAX",sleep:"SLEEP"};
    var list=sec.querySelector("#fmlList"), ghost=sec.querySelector("#fmlGhost"), bar=sec.querySelector("#fmlBar");
    var pouches=sec.querySelectorAll(".fml-pouch"), tabs=sec.querySelectorAll(".fml-tabs button");
    function op(i){var v=1-i*0.16; return v<0.36?0.36:v.toFixed(2);}
    function render(sku){
      var rows=DATA[sku];
      if(bar)bar.innerHTML=rows.map(function(r,i){return '<span class="fml-seg" style="width:'+r[1]+'%;opacity:'+op(i)+'">'+(r[1]>=13?'<i>'+r[1]+'%</i>':'')+'</span>';}).join('');
      list.innerHTML=rows.map(function(r,i){return '<li><span class="fi-dot" style="opacity:'+op(i)+'"></span><div class="fi-t"><b>'+r[0]+'</b><i>'+r[1]+'%</i></div><em>'+r[2]+'</em></li>';}).join('');
      pouches.forEach(function(p){p.classList.toggle("on",p.dataset.sku===sku);});
      sec.style.setProperty("--accent",HEX[sku]); sec.style.setProperty("--accent-ink",INK[sku]); if(ghost)ghost.textContent=LABEL[sku];
    }
    tabs.forEach(function(b){ b.addEventListener("click",function(){
      tabs.forEach(function(x){x.classList.toggle("on",x===b);});
      render(b.dataset.sku);
    });});
    render("energy");
  })();
  </script>
"""

VH_CSS = """
/* hero — cinematic product stage: the bitten mood bar in dramatic light, copy over a low scrim */
.rh{position:relative;min-height:min(94vh,900px);overflow:hidden;background:#1a0f08;display:flex;flex-direction:column;justify-content:flex-end}
.rh-bg{position:absolute;inset:0;z-index:0}
.rh-shot{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 40%;animation:rhZoom 20s ease-in-out infinite alternate;will-change:transform}
@keyframes rhZoom{from{transform:scale(1.02)}to{transform:scale(1.09)}}
.rh-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(20,11,6,.97) 0%,rgba(20,11,6,.78) 20%,rgba(20,11,6,.32) 40%,rgba(20,11,6,0) 60%),radial-gradient(120% 80% at 78% 30%,transparent,rgba(20,11,6,.35))}
.rh-prism{position:absolute;top:6%;left:4%;width:min(48%,560px);height:44%;pointer-events:none;mix-blend-mode:screen;filter:blur(16px);opacity:.7;
  background:linear-gradient(118deg,transparent 38%,rgba(255,120,80,.16),rgba(120,205,180,.13),rgba(150,150,235,.14),transparent 64%);animation:rhShimmer 8s ease-in-out infinite alternate}
@keyframes rhShimmer{from{opacity:.45;transform:translateX(0)}to{opacity:.85;transform:translateX(22px)}}
.rh-inner{position:relative;z-index:2;width:100%;max-width:1320px;margin:0 auto;padding:0 clamp(22px,5vw,64px) clamp(44px,7vw,92px)}
.rh-copy{max-width:620px;direction:rtl;text-align:right}
.rh-eyebrow{font-size:clamp(11px,1.1vw,13px);font-weight:800;letter-spacing:.3em;color:#eab488;margin:0 0 16px}
.rh-h{font-size:clamp(44px,6.6vw,92px);line-height:.94;letter-spacing:-.05em;font-weight:900;color:#fbf4ec;margin:0;text-shadow:0 2px 40px rgba(0,0,0,.45)}
.rh-h span{color:#f0a35e}
.rh-sub{margin:20px 0 0;max-width:440px;font-size:clamp(16px,1.45vw,20px);line-height:1.55;color:#e8dccd}
.rh-cta{display:flex;flex-direction:row-reverse;justify-content:flex-end;gap:14px;margin:32px 0 0}
.rh-btn{display:inline-flex;align-items:center;justify-content:center;padding:17px 38px;border-radius:999px;font-size:clamp(15px,1.3vw,17px);font-weight:800;text-decoration:none;white-space:nowrap;transition:transform .28s cubic-bezier(.34,1.56,.64,1),box-shadow .28s ease,background .2s,border-color .2s,color .2s}
.rh-btn-primary{background:#ee9a4d;color:#20130a;box-shadow:0 18px 40px -12px rgba(238,154,77,.7)}
.rh-btn-primary:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 24px 50px -12px rgba(238,154,77,.8)}
.rh-btn-primary:active{transform:translateY(0) scale(.98)}
.rh-btn-ghost{background:rgba(255,255,255,.09);color:#fff;border:1.5px solid rgba(255,255,255,.4);backdrop-filter:blur(6px)}
.rh-btn-ghost:hover{transform:translateY(-2px);border-color:#fff;background:rgba(255,255,255,.16)}
.rh-btn-ghost:active{transform:translateY(0) scale(.98)}
.rh-scroll{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);width:26px;height:42px;border:2px solid rgba(255,255,255,.4);border-radius:14px;z-index:2;display:none}
.rh-scroll span{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:4px;height:8px;border-radius:2px;background:rgba(255,255,255,.8);animation:rhDot 1.8s ease-in-out infinite}
@keyframes rhDot{0%,100%{opacity:0;top:8px}50%{opacity:1;top:18px}}
/* the human moment — the approved prism photo, kept as a cinematic beat */
.rmt{position:relative;min-height:min(70vh,620px);overflow:hidden;background:#efe7d9;display:flex;align-items:flex-end;direction:rtl}
.rmt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 26%}
.rmt::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(28,17,9,.72) 0%,rgba(28,17,9,.15) 34%,transparent 58%)}
.rmt-in{position:relative;z-index:2;width:100%;max-width:1320px;margin:0 auto;padding:0 clamp(22px,5vw,64px) clamp(38px,6vw,72px)}
.rmt-t{font-size:clamp(28px,4.2vw,56px);line-height:1.02;letter-spacing:-.035em;font-weight:900;color:#fff;margin:0;text-shadow:0 2px 30px rgba(0,0,0,.4)}
.rmt-t span{color:#f2b27a}
@media(min-width:861px){.rh-scroll{display:block}}
/* three moods, one chocolate — bright product moment (counterpoint to the dark hero) */
.mds{position:relative;min-height:min(82vh,780px);overflow:hidden;background:#ece3d4;display:flex;flex-direction:column;justify-content:flex-end;direction:rtl}
.mds-shot{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 44%;animation:rhZoom 26s ease-in-out infinite alternate;will-change:transform}
.mds::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(236,227,212,.96) 0%,rgba(236,227,212,.42) 22%,rgba(236,227,212,0) 46%)}
.mds-in{position:relative;z-index:2;width:100%;max-width:1320px;margin:0 auto;padding:0 clamp(22px,5vw,64px) clamp(42px,6vw,76px);text-align:right}
.mds-eyebrow{font-size:clamp(11px,1.1vw,13px);font-weight:900;letter-spacing:.24em;color:#b06a3a;margin:0 0 14px}
.mds-h{font-size:clamp(36px,5.6vw,74px);line-height:1;letter-spacing:-.045em;font-weight:900;color:#1c140d;margin:0}
.mds-h span{color:#e08a3e}
@media(max-width:860px){
  .rh{min-height:92svh}
  .rh-shot{object-position:center 42%}
  .rh-copy{max-width:none;text-align:right}
  .rh-inner{padding-bottom:44px}
  .rmt{min-height:64vh}
  .rmt img{object-position:center 22%}
  .mds{min-height:74svh}
  .mds-shot{object-position:center 46%}
}
"""

MOMENT = """    <section class="rmt" aria-label="הרגע שלך">
      <picture><source media="(max-width:860px)" srcset="__HEROPHOTO_M__"><img src="__HEROPHOTO__" alt="רגע של mood — אור פריזמה על הפנים"></picture>
      <div class="rmt-in"><p class="rmt-t">רגע אחד ביום —<br>שהוא <span>רק שלך</span>.</p></div>
    </section>
"""

MOODS = """    <section class="mds" aria-label="שלושה מצבים, שוקולד אחד">
      <img class="mds-shot reveal" src="__CHOCMOODS__" alt="שוקולד mood ושלושת המצבים — אנרגיה, רוגע, שינה">
      <div class="mds-in reveal">
        <p class="mds-eyebrow">ENERGY · RELAX · SLEEP</p>
        <h2 class="mds-h">שלושה מצבים.<br>שוקולד <span>אחד</span>.</h2>
      </div>
    </section>
"""

STORY = """    <section class="ts" id="story" aria-label="הטעם והשוקולטייר של mood">
      <div class="ts-inner">
        <div class="ts-eyebrow reveal">פותח עם אלוף העולם</div>
        <h2 class="ts-h reveal">קודם כול, שוקולד אמיתי.</h2>
        <p class="ts-p reveal">בלוק מריר 70% שנבנה עם אלוף עולם — הבסיס שכל פורמולה נשענת עליו.</p>
        <ul class="ts-chips reveal"><li>70% מריר</li><li>מלח ים</li><li>פורמולה טבעית</li><li>בלי סוכר</li><li>כשר פרווה</li></ul>
        <div class="ts-media reveal">
          <video class="ts-vid" autoplay muted loop playsinline webkit-playsinline preload="auto" poster="__CHOCBITE__"><source src="__TASTEVID__" type="video/mp4"></video>
          <figure class="ts-badge">
            <img src="__RONEN__" alt="רונן אפללו — שוקולטייר mood">
            <figcaption>
              <strong>רונן אפללו</strong>
              <span>אלוף העולם לשוקולד · 2022</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
"""

TS_CSS = """
/* one strong section: the taste + world-champion chocolatier — stacked, centered */
.ts{position:relative;background:linear-gradient(180deg,#fff 0%,#fbf5ed 68%,#f4ebdd 100%);padding:clamp(52px,7vw,108px) clamp(20px,5vw,64px);text-align:center;direction:rtl;overflow:hidden}
.ts-inner{max-width:1120px;margin:0 auto}
.ts-eyebrow{font-size:12px;font-weight:900;letter-spacing:.18em;color:#FF6B35}
.ts-h{font-size:clamp(34px,5vw,66px);line-height:1;letter-spacing:-.04em;font-weight:900;color:var(--ink);margin:14px 0 0}
.ts-p{margin:16px auto 0;max-width:560px;color:var(--muted);font-size:clamp(15px,1.4vw,17.5px);line-height:1.65}
.ts-chips{list-style:none;display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:24px 0 0;padding:0}
.ts-chips li{border:1px solid #cadcb9;border-radius:999px;padding:9px 16px;font-size:13px;font-weight:800;color:#425a30;background:#e8f0dd}
.ts-media{position:relative;margin:clamp(30px,4vw,50px) auto 0;max-width:940px;height:min(52vh,470px);border-radius:clamp(18px,2.2vw,26px);overflow:hidden;background:#efe7d9;box-shadow:0 2px 5px rgba(41,25,10,.16),0 26px 50px -26px rgba(41,25,10,.55),0 60px 90px -60px rgba(196,110,54,.4)}
.ts-media>img,.ts-media>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.ts-vid{object-position:center 52%}
.ts-media::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:linear-gradient(0deg,rgba(20,12,6,.58),rgba(20,12,6,0) 34%),linear-gradient(180deg,rgba(255,255,255,.12),transparent 12%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)}
/* world-champion badge, inside the video */
.ts-badge{position:absolute;z-index:2;inset-inline-start:clamp(16px,2.4vw,28px);bottom:clamp(16px,2.4vw,26px);margin:0;display:flex;align-items:center;gap:13px;direction:rtl;text-align:right;padding:9px 17px 9px 11px;border-radius:999px;background:rgba(255,255,255,.14);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.3);box-shadow:0 12px 30px rgba(0,0,0,.32)}
.ts-badge img{width:52px;height:52px;border-radius:50%;object-fit:cover;object-position:center 26%;flex:none;border:2px solid rgba(255,255,255,.75)}
.ts-badge figcaption strong{display:block;font-size:14.5px;font-weight:900;color:#fff;letter-spacing:-.01em}
.ts-badge figcaption span{display:block;font-size:11.5px;font-weight:800;color:#ffd9b8;margin-top:2px}
@media(max-width:860px){
  .ts-chips{flex-wrap:nowrap;gap:5px;justify-content:center}
  .ts-chips li{padding:7px 8px;font-size:10px;white-space:nowrap;letter-spacing:-.01em}
  .ts-p{max-width:none}
  .ts-media{height:min(66vw,360px);margin-top:26px}
  .ts-badge{inset-inline-start:12px;bottom:12px;gap:9px;padding:7px 13px 7px 8px}
  .ts-badge img{width:40px;height:40px}
  .ts-badge figcaption strong{font-size:12.5px}
  .ts-badge figcaption span{font-size:10px}
}
"""

FL_CSS = """
/* founders — clean editorial card: portrait + letter, refined type, dual signatures */
.fl{background:#efe7d9;padding:clamp(50px,7vw,104px) clamp(20px,5vw,60px);position:relative}
.fl-wrap{max-width:1060px;margin:0 auto}
.fl-eyebrow{text-align:center;font-size:12px;font-weight:900;letter-spacing:.24em;color:#c07f43;margin-bottom:clamp(22px,3.5vw,40px)}
.fl-card{background:#fff;border-radius:clamp(18px,2.4vw,28px);overflow:hidden;box-shadow:0 44px 100px -34px rgba(41,25,10,.42);display:grid;grid-template-columns:.92fr 1.08fr;align-items:stretch}
.fl-photo{position:relative;margin:0;min-height:100%;background:#e4dccd;overflow:hidden}
.fl-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 32%;filter:saturate(1.04) contrast(1.02)}
.fl-photo::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(0deg,rgba(30,17,7,.42),transparent 34%)}
.fl-photo figcaption{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:26px 20px 16px;text-align:center;font-size:12.5px;font-weight:800;letter-spacing:.02em;color:#f6ece0}
.fl-body{position:relative;overflow:hidden;padding:clamp(34px,4.6vw,68px);direction:rtl;text-align:right;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(180deg,#fffdf9,#fdf6ea)}
.fl-qm{position:absolute;top:clamp(-14px,-.6vw,2px);inset-inline-start:clamp(22px,3.4vw,50px);font-family:'GveretLevin',cursive;font-size:clamp(96px,12vw,164px);line-height:1;color:#c07f43;opacity:.16;pointer-events:none;z-index:0}
.fl-lead,.fl-body p,.fl-signs,.fl-closer,.fl-prov{position:relative;z-index:1}
.fl-body p.fl-lead{font-family:'GveretLevin',cursive;font-size:clamp(28px,3vw,42px);color:#43301f;margin:0 0 16px;line-height:1.2;max-width:none}
.fl-body p{font-family:inherit;color:#544a3f;font-size:clamp(16px,1.35vw,18.5px);line-height:1.8;margin:0 0 16px;max-width:44ch}
.fl-body p strong{font-weight:800;color:#43301f;box-shadow:inset 0 -.4em 0 rgba(192,127,67,.22)}
.fl-body p.fl-closer{font-family:'GveretLevin',cursive;color:#4a3826;font-size:clamp(20px,1.8vw,26px);line-height:1.4;margin:0 0 2px;max-width:none}
.fl-prov{margin-top:16px;font-size:11px;font-weight:800;letter-spacing:.16em;color:#b3a795}
.fl-signs{display:flex;flex-wrap:wrap;gap:14px clamp(30px,4vw,54px);align-items:flex-end;margin:clamp(16px,2.4vw,26px) 0 0;padding-top:clamp(16px,2.2vw,24px);border-top:1px solid #f0e7d8}
.fl-sig{display:flex;flex-direction:column}
.fl-sig-name{font-family:'GveretLevin',cursive;font-size:clamp(28px,3vw,40px);color:#43301f;position:relative;display:inline-block;line-height:1;white-space:nowrap}
.fl-sig-name::after{content:"";position:absolute;left:-4px;right:-9px;bottom:-7px;height:7px;border-bottom:2.5px solid #c07f43;border-radius:50%;transform:rotate(-1deg)}
.fl-sig-role{margin-top:12px;font-size:12px;font-weight:800;letter-spacing:.08em;color:#9a8f80}
@media(max-width:820px){
  .fl{padding:40px 18px 52px}
  .fl-card{grid-template-columns:1fr}
  .fl-photo{min-height:min(86vw,420px);height:min(86vw,420px)}
  .fl-body{padding:32px 26px 34px}
  .fl-body p.fl-lead{font-size:30px;margin-bottom:14px}
  .fl-body p{font-size:16.5px;line-height:1.8;margin-bottom:14px;max-width:none}
  .fl-signs{gap:12px 40px;margin-top:20px}
  .fl-sig-name{font-size:30px}
}
"""

REVIEWS = """    <section class="rv" id="reviews" aria-label="ביקורות לקוחות mood">
      <div class="rv-head reveal">
        <h2 class="rv-h">באו בשביל ההרגשה. <u>נשארו בשביל הטעם.</u></h2>
        <div class="rv-agg"><span class="rv-stars" aria-hidden="true">★★★★★</span><span class="rv-agg-t"><b>4.9</b> · 340+ ביקורות מאומתות</span></div>
      </div>
      <div class="rv-track">
        <article class="rv-card reveal" style="--dot:#FF6B35">
          <div class="rv-media"><img src="__ELIFE__" alt="מיכל עם mood Energy"><button class="rv-play" aria-label="נגן ביקורת וידאו"></button><span class="rv-sku">ENERGY</span></div>
          <div class="rv-body"><span class="rv-cstars" aria-hidden="true">★★★★★</span><p class="rv-quote">החלפתי את הקפה השני של הבוקר. ריכוז בלי הקפיצה — ופשוט טעים.</p><div class="rv-who"><b>מיכל א׳</b><span>לקוחה מאומתת</span></div></div>
        </article>
        <article class="rv-card reveal" style="--dot:#5C8058">
          <div class="rv-media"><img src="__RLIFE__" alt="דנה עם mood Relax"><button class="rv-play" aria-label="נגן ביקורת וידאו"></button><span class="rv-sku">RELAX</span></div>
          <div class="rv-body"><span class="rv-cstars" aria-hidden="true">★★★★★</span><p class="rv-quote">הביס של אחרי הצהריים הפך לרגע הקטן שאני הכי מחכה לו ביום.</p><div class="rv-who"><b>דנה כ׳</b><span>לקוחה מאומתת</span></div></div>
        </article>
        <article class="rv-card reveal" style="--dot:#5e7ba8">
          <div class="rv-media"><img src="__SLIFE__" alt="עדי עם mood Sleep"><button class="rv-play" aria-label="נגן ביקורת וידאו"></button><span class="rv-sku">SLEEP</span></div>
          <div class="rv-body"><span class="rv-cstars" aria-hidden="true">★★★★★</span><p class="rv-quote">טקס הערב שלי. חצי שעה לפני השינה, והראש סוף סוף נרגע.</p><div class="rv-who"><b>עדי ר׳</b><span>לקוחה מאומתת</span></div></div>
        </article>
      </div>
      <div class="rv-hint">מחליקים לעדות הבאה →</div>
    </section>
"""

RV_CSS = """
/* customer testimonials — video thumb + stars + quote + name */
.rv{background:#fff;padding:clamp(48px,6vw,88px) 0 clamp(40px,5vw,64px);text-align:center;overflow:hidden}
.rv-head{padding:0 20px;margin:0 auto;max-width:920px}
.rv-h{font-size:clamp(25px,3.4vw,44px);font-weight:900;letter-spacing:-.03em;color:var(--ink);margin:0;line-height:1.16;direction:rtl}
.rv-h u{text-decoration:none;box-shadow:inset 0 -.14em 0 #9bb488;padding-bottom:.01em}
.rv-agg{display:inline-flex;align-items:center;gap:9px;margin-top:15px;direction:rtl}
.rv-stars{color:#E8A54D;font-size:18px;letter-spacing:2px}
.rv-agg-t{font-size:14px;font-weight:700;color:#6a6157}
.rv-agg-t b{color:var(--ink);font-weight:900}
.rv-track{display:flex;gap:clamp(16px,1.8vw,24px);overflow-x:auto;scroll-snap-type:x mandatory;padding:clamp(26px,3.4vw,42px) clamp(20px,7vw,110px);-webkit-overflow-scrolling:touch;scrollbar-width:none;direction:ltr;align-items:stretch}
.rv-track::-webkit-scrollbar{display:none}
.rv-card{flex:0 0 clamp(262px,26vw,320px);border-radius:22px;overflow:hidden;scroll-snap-align:center;box-shadow:0 24px 54px -20px rgba(41,25,10,.32);background:#fff;border:1px solid #efe7db;display:flex;flex-direction:column;text-align:right;direction:rtl}
.rv-media{position:relative;height:clamp(190px,50vw,214px);background:#e9e1d4}
.rv-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.rv-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:56px;height:56px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.92);cursor:pointer;transition:transform .2s,background .2s;box-shadow:0 6px 18px rgba(0,0,0,.22)}
.rv-play::after{content:"";position:absolute;top:50%;left:54%;transform:translate(-50%,-50%);border-style:solid;border-width:9px 0 9px 15px;border-color:transparent transparent transparent #2a1a0c}
.rv-play:hover{transform:translate(-50%,-50%) scale(1.08);background:#fff}
.rv-sku{position:absolute;right:12px;bottom:12px;color:#fff;font-size:11.5px;font-weight:900;letter-spacing:.08em;display:inline-flex;align-items:center;gap:6px;text-shadow:0 1px 5px rgba(0,0,0,.5)}
.rv-sku::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--dot);box-shadow:0 0 0 2px rgba(255,255,255,.3)}
.rv-body{padding:17px 20px 20px;display:flex;flex-direction:column;gap:9px;flex:1}
.rv-cstars{color:#E8A54D;font-size:15px;letter-spacing:1.5px}
.rv-quote{font-size:15.5px;line-height:1.55;color:var(--ink);font-weight:600;margin:0;flex:1}
.rv-who{display:flex;flex-direction:column;gap:1px;margin-top:2px}
.rv-who b{font-size:14px;font-weight:900;color:var(--ink)}
.rv-who span{font-size:11.5px;font-weight:700;color:#9a8f80}
.rv-hint{font-size:13px;color:#8a7f70;font-weight:700}
@media(max-width:860px){
  .rv-card{flex-basis:min(300px,82vw);border-radius:18px}
  .rv-track{padding:24px 9vw;scroll-padding:0 9vw}
  .rv-h{font-size:26px}
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
/* announcement + full nav */
.xannounce{background:var(--ink);color:#f5eee4;text-align:center;font-size:12px;font-weight:700;letter-spacing:.02em;padding:10px 16px}
.xnav{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px clamp(16px,4vw,34px);background:rgba(255,255,255,.94);backdrop-filter:blur(10px);border-bottom:1px solid transparent;transition:padding .32s cubic-bezier(.22,.8,.28,1),background .32s ease,box-shadow .32s ease,border-color .32s ease}
.xnav.shrink{padding-top:7px;padding-bottom:7px;background:rgba(255,255,255,.82);border-bottom-color:transparent;box-shadow:0 6px 24px rgba(41,25,10,.09)}
.xnav .xlogo-img{transition:height .32s cubic-bezier(.22,.8,.28,1)}
.xnav.shrink .xlogo-img{height:30px}
/* thin scroll-progress bar (Apple-style) */
.xprog{position:fixed;top:0;left:0;right:0;height:2.5px;z-index:80;background:var(--energy);transform:scaleX(0);transform-origin:0 50%;will-change:transform}
html{scroll-behavior:smooth;scroll-padding-top:80px}
.xnav-links{display:flex;align-items:center;gap:24px}
.xnav-links>a,.xnav-top{color:#4c4841;text-decoration:none;font-size:14.5px;font-weight:700;cursor:pointer;background:none;border:0;font-family:inherit;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.xnav-links>a:hover,.xnav-top:hover{color:var(--ink)}
.xnav-drop{position:relative}
.xcar{width:6px;height:6px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin-top:-3px}
.xnav-menu{position:absolute;top:calc(100% + 12px);right:0;min-width:236px;background:#fff;border:1px solid #eee;border-radius:16px;box-shadow:0 20px 44px rgba(41,25,10,.14);padding:8px;opacity:0;visibility:hidden;transform:translateY(6px);transition:.18s;z-index:70}
.xnav-drop:hover .xnav-menu,.xnav-drop:focus-within .xnav-menu{opacity:1;visibility:visible;transform:none}
.xnav-menu a{display:flex;flex-direction:column;padding:11px 14px;border-radius:10px;text-decoration:none;color:var(--ink)}
.xnav-menu a:hover{background:#f6f0e6}
.xnav-menu a b{font-size:14px;font-weight:900;letter-spacing:.04em}
.xnav-menu a span{font-size:12px;color:#8a7f70;margin-top:1px}
.xnav-menu .xnav-all{color:var(--energy);font-weight:800}
.xlogo{display:inline-flex;align-items:center;text-decoration:none;line-height:1}
.xlogo-img{height:38px;width:auto;display:block}
.xnav-actions{display:flex;align-items:center;gap:14px}
.xnav-quiz{color:#4c4841;text-decoration:none;font-size:14px;font-weight:700;white-space:nowrap}
.xnav-quiz:hover{color:var(--ink)}
.xnav-cart{position:relative;display:inline-flex;align-items:center;color:var(--ink);text-decoration:none}
.xnav-cart svg{width:22px;height:22px}
.xnav-cart b{position:absolute;top:-6px;left:-8px;background:var(--energy);color:#fff;font-size:10px;min-width:16px;height:16px;border-radius:999px;display:grid;place-items:center;padding:0 3px;font-weight:900}
.xburger{display:none;flex-direction:column;gap:4px;background:none;border:0;cursor:pointer;padding:6px}
.xburger span{width:22px;height:2px;background:var(--ink);border-radius:2px;transition:.2s}
@media(max-width:900px){
  .xburger{display:flex;order:-1}
  .xnav-quiz{display:none}
  .xnav-links{position:fixed;top:86px;right:0;left:0;flex-direction:column;align-items:stretch;gap:0;background:#fff;border-bottom:0 solid #eee;padding:0 20px;box-shadow:0 20px 40px rgba(41,25,10,.12);max-height:0;overflow:hidden;transition:max-height .28s ease,padding .28s ease;pointer-events:none}
  .xnav.open .xnav-links{max-height:82vh;padding:6px 20px 18px;border-bottom-width:1px;pointer-events:auto}
  .xnav-links>a,.xnav-top{padding:14px 2px;border-bottom:1px solid #f1ece2;width:100%;justify-content:space-between}
  .xnav-menu{position:static;opacity:1;visibility:visible;transform:none;box-shadow:none;border:0;padding:0 0 8px;min-width:0}
  .xnav-menu a{padding:10px 12px}
  .xnav.open .xburger span:nth-child(1){transform:translateY(6px) rotate(45deg)}
  .xnav.open .xburger span:nth-child(2){opacity:0}
  .xnav.open .xburger span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
}
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

XHERO = """    <header class="xtop" id="top">
      <div class="xannounce">משלוח חינם בקנייה מעל ₪249 · מוקד שירות ישראלי</div>
      <nav class="xnav" aria-label="ניווט ראשי">
        <button class="xburger" id="xBurger" aria-label="פתיחת תפריט" aria-expanded="false"><span></span><span></span><span></span></button>
        <div class="xnav-links" id="xLinks">
          <div class="xnav-drop">
            <a href="#products" class="xnav-top">המוצרים<i class="xcar" aria-hidden="true"></i></a>
            <div class="xnav-menu">
              <a href="#products"><b>ENERGY</b><span>בוקר · אנרגיה ומיקוד</span></a>
              <a href="#products"><b>RELAX</b><span>ערב · רוגע</span></a>
              <a href="#products"><b>SLEEP</b><span>לילה · שינה</span></a>
              <a href="#products" class="xnav-all">כל המוצרים ←</a>
            </div>
          </div>
          <a href="#formulas">הפורמולה</a>
          <a href="#story">איך זה עובד</a>
          <a href="#founders">הסיפור שלנו</a>
          <a href="#reviews">ביקורות</a>
          <a href="blog.html">בלוג</a>
        </div>
        <a class="xlogo" href="#top" aria-label="mood — ריטואל שוקולד"><img class="xlogo-img" src="__LOGOBLACK__" alt="mood · ritual chocolate"></a>
        <div class="xnav-actions">
          <a class="xnav-quiz" href="#products">שאלון התאמה</a>
          <a class="xnav-cart" href="#products" aria-label="עגלת קניות"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6.5 8h11l-1 11.5h-9L6.5 8Z"/><path d="M9.2 8a2.8 2.8 0 0 1 5.6 0"/></svg><b>0</b></a>
        </div>
      </nav>
    </header>
    <section class="rh" id="xhero" aria-label="mood — אל תבחרו מוצר, בחרו את הרגע">
      <div class="rh-bg">
        <img class="rh-shot" src="__CHOCFLOAT__" alt="שוקולד mood — ביס אחד משנה הכל">
        <span class="rh-prism" aria-hidden="true"></span>
      </div>
      <div class="rh-inner">
        <div class="rh-copy">
          <p class="rh-eyebrow">ONE BITE · EVERYTHING CHANGES</p>
          <h1 class="rh-h">אל תבחרו מוצר.<br>בחרו את <span>הרגע</span>.</h1>
          <p class="rh-sub">שוקולד מריר 70% לכל רגע ביום. ביס אחד — וההרגשה משתנה.</p>
          <div class="rh-cta">
            <a class="rh-btn rh-btn-primary" href="#products">לבחירת הרגע</a>
            <a class="rh-btn rh-btn-ghost" href="#products">למארז היכרות</a>
          </div>
        </div>
        <a class="rh-scroll" href="#products" aria-label="גללו למטה"><span></span></a>
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
        # drop the leftover "build a bundle" link — that flow was removed
        html = html.replace(
            '<div class="bundle"><strong>רוצים לשלב בין כמה רגעים?</strong><a href="#">עברו לבניית באנדל</a></div>', "")
        # the approved cards are oversized on mobile — tighten without touching
        # the pristine approved source
        html = html.replace("</head>",
            "<style>.section{min-height:0}"  # fit the iframe to the cards — no dead space below
            "@media(max-width:700px){"
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
    hand_font = "@font-face{font-family:'GveretLevin';font-style:normal;font-weight:400;font-display:swap;src:url(" + data_uri("gveret-levin.woff2", HOME_ASSETS) + ") format('woff2');}\n"
    shell = shell.replace("</style>", "\nhtml,body{overflow-x:clip}\n" + hand_font + NEW_CSS + CAP_CSS + XHERO_CSS + FORMULAS_CSS + VH_CSS + TS_CSS + FL_CSS + RV_CSS + RC_CSS + FOOT_CSS + "\n  </style>", 1)
    # inline approved formula strip images (hero now uses lifestyle markers)
    shell = inline_assets(shell)
    # layer the narrative sections in journey order (Curiosity->...->Purchase):
    #   hero · QUIZ · product cards · IMMERSIVE · marquee · cinematic(Ronen) ·
    #   founders · TIMELINE · formula · BUNDLE · close · footer
    # trust/credibility bar sits directly under the hero
    shell = shell.replace('    <section id="products"', MARQUEE + '    <section id="products"')
    # replace the cinematic story with the strong taste + world-champion section
    shell = re.sub(r'    <section id="story"(?! class="fml).*?</section>', STORY, shell, count=1, flags=re.S)
    # the compact formula selector flows directly into the founders letter (one cream band)
    shell = shell.replace('    <section id="formula"', FORMULAS + FOUNDERS + REVIEWS + '    <section id="formula"')
    shell = shell.replace('  </main>', FAQ + CLOSE + '  </main>\n' + TRUST + FOOTER)

    # ---- head: brand-correct title/description + Open Graph + JSON-LD (AI-search) ----
    shell = shell.replace("<title>MOOD — Ritual Chocolate</title>",
                          "<title>mood — ריטואל שוקולד פונקציונלי</title>")
    shell = shell.replace(
        'content="MOOD — שוקולד פונקציונלי לרגעים של אנרגיה, רוגע ושינה"',
        'content="mood — שוקולד מריר 70% פונקציונלי לשלושה רגעים ביום: ENERGY, RELAX, SLEEP. 0 גרם סוכר, קפאין טבעי. משיקים 12.8."')
    _faq_qa = [
        ("כמה קפאין יש בקובייה אחת של mood?", "ב-ENERGY יש כ-25 מ״ג קפאין טבעי מגוארנה ותה ירוק — בערך רבע מכוס קפה, לאנרגיה נקייה ויציבה בלי קפיצה ונפילה. RELAX ו-SLEEP מכוונים להרגעה, בלי קפאין."),
        ("מתי אוכלים כל mood?", "קובייה אחת ברגע הנכון: ENERGY לבוקר ולצהריים, RELAX לערב, ו-SLEEP ללילה לפני השינה."),
        ("כמה קוביות אפשר לאכול ביום?", "1–2 קוביות לפי הצורך. כל שקית היא 30 קוביות אישיות ארוזות בנפרד — חודש שלם."),
        ("מה יש בפנים? יש סוכר?", "שוקולד מריר 70% עם מלח ים ופורמולת רכיבים טבעיים — מאקה, גוארנה, ג'ינסנג, תה ירוק וליקוריץ. 0 גרם סוכר."),
        ("mood כשר? מתאים לטבעונים?", "כן — כשר פרווה. שוקולד מריר בלי מוצרי חלב, מתאים גם לטבעונים."),
        ("מתי אפשר לקנות ואיך?", "משיקים ב-12.8. נרשמים לרשימת ההמתנה ומקבלים גישה ראשונה והטבת השקה. משלוח חינם מעל ₪249."),
        ("איך עובד מועדון החברים?", "הקופסה מגיעה עד הבית כל חודש במחיר חבר קבוע ובמשלוח חינם. אפשר לדלג, לעצור או לבטל בכל עת."),
    ]
    _org_ld = {"@context": "https://schema.org", "@type": "Organization", "name": "mood",
               "description": "שוקולד מריר 70% פונקציונלי — ריטואל יומי לשלושה רגעים: ENERGY, RELAX, SLEEP.",
               "url": "https://mood-chocolate.com", "email": "hello@mood-chocolate.com",
               "foundingDate": "2023",
               "founder": [{"@type": "Person", "name": "נדב יצחקי"}, {"@type": "Person", "name": "מתיאס דומינגז"}],
               "sameAs": ["https://www.instagram.com/mood_ritual_chocolate",
                          "https://www.tiktok.com/@mood_ritual_chocolate"]}
    _faq_ld = {"@context": "https://schema.org", "@type": "FAQPage",
               "mainEntity": [{"@type": "Question", "name": q,
                               "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in _faq_qa]}
    head_extra = (
        '  <meta property="og:type" content="website">\n'
        '  <meta property="og:site_name" content="mood">\n'
        '  <meta property="og:locale" content="he_IL">\n'
        '  <meta property="og:title" content="mood — ריטואל שוקולד פונקציונלי">\n'
        '  <meta property="og:description" content="שוקולד מריר 70% פונקציונלי לשלושה רגעים: ENERGY · RELAX · SLEEP. משיקים 12.8.">\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        '  <script type="application/ld+json">' + json.dumps(_org_ld, ensure_ascii=False) + '</script>\n'
        '  <script type="application/ld+json">' + json.dumps(_faq_ld, ensure_ascii=False) + '</script>\n'
    )
    shell = shell.replace("</head>", head_extra + "</head>", 1)
    # the live FORMULAS (id="formulas") replaces the old static formula image
    shell = re.sub(r'    <section id="formula".*?</section>\n', '', shell, count=1, flags=re.S)
    # motion pass + interactive capability modules (inject BEFORE inlining, so the
    # __ENERGY__/__RELAX__/__SLEEP__ markers inside CAP_JS get replaced too)
    shell = shell.replace('</body>', MOTION_JS + CAP_JS + HERO_JS + FORMULAS_JS + NAV_JS + '</body>')
    # inline the new-layer assets
    shell = shell.replace("__FOUNDERS__", data_uri("founders-workshop.jpg", HOME_ASSETS))
    shell = shell.replace("__LOGOBLACK__", data_uri("logo-black.png", HOME_ASSETS))
    shell = shell.replace("__LOGOWHITE__", data_uri("logo-white.png", HOME_ASSETS))
    shell = shell.replace("__CHOC__", data_uri("choc-dark.jpg", HOME_ASSETS))
    shell = shell.replace("__CHOCBAR__", data_uri("choc-float.jpg", HOME_ASSETS))
    shell = shell.replace("__HEROPHOTO__", data_uri("hero-photo.jpg", HOME_ASSETS))
    shell = shell.replace("__HEROPHOTO_M__", data_uri("hero-mobile.jpg", HOME_ASSETS))
    shell = shell.replace("__CHOCFLOAT__", data_uri("choc-float.jpg", HOME_ASSETS))
    shell = shell.replace("__CHOCBITE__", data_uri("choc-real-bite.jpg", HOME_ASSETS))
    shell = shell.replace("__TASTEVID__", data_uri("taste-vid.mp4", HOME_ASSETS))
    shell = shell.replace("__DUOWOMAN__", data_uri("duo-woman.jpg", HOME_ASSETS))
    shell = shell.replace("__DUOMAN__", data_uri("duo-man.jpg", HOME_ASSETS))
    shell = shell.replace("__CHOCMOODS__", data_uri("choc-moods.jpg", HOME_ASSETS))
    shell = shell.replace("__CHOCSPIN__", data_uri("choc-loop.mp4", HOME_ASSETS))
    shell = shell.replace("__SPINPOSTER__", data_uri("choc-loop-poster.jpg", HOME_ASSETS))
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
    # (formula.html 3D experience moved to the product pages; not embedded on home)

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
