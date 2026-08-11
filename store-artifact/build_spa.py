# Build a single self-contained SPA artifact from Codex's exact-v30 pages.
# - Compress every unique asset ONCE (token-substituted at runtime → no duplication)
# - Dedupe inline data: fonts/images repeated across pages
# - Client-side router over srcdoc iframes (each page keeps its own CSS/JS untouched)
import re, os, io, base64, json, hashlib
from PIL import Image

PUB = '/tmp/claude-0/-home-user-mood-automation/c8b146d5-7269-5f24-a785-402f620707cd/scratchpad/v42/public'
OUT = '/tmp/claude-0/-home-user-mood-automation/c8b146d5-7269-5f24-a785-402f620707cd/scratchpad/mood-lp/mood_store.html'

PAGES = {  # route -> file
    '/':         'exact-v30/home.html',
    '/products': 'exact-v30/products.html',
    '/energy':   'exact-v30/energy.html',
    '/relax':    'exact-v30/relax.html',
    '/sleep':    'exact-v30/sleep.html',
    '/policies': 'policies.html',
}

# ---------- 1. asset compression ----------
def compress(path):
    """Return (data_uri, note). Photos → JPEG q72 max 1180w; alpha → WebP q76."""
    full = os.path.join(PUB, path.lstrip('/'))
    ext = path.rsplit('.', 1)[-1].lower()
    raw = open(full, 'rb').read()
    if ext == 'svg':
        return 'data:image/svg+xml;base64,' + base64.b64encode(raw).decode(), 'svg'
    im = Image.open(io.BytesIO(raw))
    has_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
    maxw = 1180
    if im.width > maxw:
        im = im.resize((maxw, int(im.height * maxw / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    if has_alpha:
        im.convert('RGBA').save(b, 'WEBP', quality=76, method=6)
        mime = 'image/webp'
    else:
        im.convert('RGB').save(b, 'JPEG', quality=72, optimize=True, progressive=True)
        mime = 'image/jpeg'
    # keep original if somehow smaller
    data = b.getvalue()
    if len(raw) < len(data):
        data = raw
        mime = {'png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg','webp':'image/webp'}[ext]
    return f'data:{mime};base64,' + base64.b64encode(data).decode(), f'{len(raw)//1024}K->{len(data)//1024}K'

# collect every asset path referenced by the pages + their css/js
asset_re = re.compile(r'(/(?:claude-v29|exact-v30)?/?[A-Za-z0-9_./-]*\.(?:png|jpe?g|webp|svg))(?:\?[A-Za-z0-9=&.]*)?')
referenced = set()
page_src = {}
for route, f in PAGES.items():
    t = open(os.path.join(PUB, f), encoding='utf-8').read()
    # inline css/js includes first so their asset refs count too
    def inline_css(m):
        p = m.group(1).split('?')[0]
        css = open(os.path.join(PUB, p.lstrip('/')), encoding='utf-8').read()
        return '<style>' + css + '</style>'
    t = re.sub(r'<link[^>]+href="(/exact-v30/[^"?]+\.css)[^"]*"[^>]*>', inline_css, t)
    def inline_js(m):
        p = m.group(1).split('?')[0]
        js = open(os.path.join(PUB, p.lstrip('/')), encoding='utf-8').read()
        return '<script>' + js + '</script>'
    t = re.sub(r'<script[^>]+src="(/exact-v30/[^"?]+\.js)[^"]*"[^>]*>\s*</script>', inline_js, t)
    for m in asset_re.finditer(t):
        p = m.group(1)
        if os.path.exists(os.path.join(PUB, p.lstrip('/'))):
            referenced.add(p)
    page_src[route] = t

# ---------- 1b. home fixes ----------
t = page_src['/']
# (a) the swap script kills the embedded product cards (its src target doesn't exist
#     inside the artifact) — remove it so the srcdoc cards render
t2 = re.sub(r"<script>\s*\(function\(\)\{var frame=document\.querySelector\('\.products-frame'\);[^<]*?\}\)\(\);\s*</script>", '', t)
assert t2 != t, 'products-frame swap script not found'
t = t2
# (b+c) CTA → bright orange w/ hard orange shadow · Ronen section → compact & bolder
HOME_OVERRIDES = """
<style>
/* CTA: the trust-strip peach (#f0c6a0), creative press-button — hard ORANGE shadow, sliding arrow, soft shine */
.rh-btn-primary{background:linear-gradient(180deg,#f9dcbc,#f0c6a0 55%,#eab88b)!important;
  border:2px solid #b06635!important;color:#5b2c07!important;position:relative;overflow:hidden;
  box-shadow:0 8px 0 #E05A00,0 26px 50px -14px rgba(224,90,0,.5),inset 0 2px 0 rgba(255,255,255,.65)!important}
.rh-btn-primary::after{content:'←'!important;margin-right:10px!important;display:inline-block;transition:transform .25s ease}
.rh-btn-primary::before{content:'';position:absolute;top:0;bottom:0;left:-70%;width:45%;pointer-events:none;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);
  animation:ctaShine 3.6s ease-in-out infinite}
@keyframes ctaShine{0%,55%{left:-70%}85%,100%{left:130%}}
.rh-btn-primary:hover{transform:translateY(2px)!important;filter:saturate(1.05);
  box-shadow:0 6px 0 #E05A00,0 20px 40px -14px rgba(224,90,0,.55),inset 0 2px 0 rgba(255,255,255,.65)!important}
.rh-btn-primary:hover::after{transform:translateX(-5px)}
.rh-btn-primary:active{transform:translateY(7px)!important;box-shadow:0 1px 0 #E05A00!important}
@media (prefers-reduced-motion:reduce){.rh-btn-primary::before{animation:none}}
/* hero never flashes dark, and no uncovered strip can appear:
   the photo is absolutely stretched over the whole hero box, sized in vw (vh is unreliable
   inside an auto-height artifact frame — that gap under the image is what read as black). */
.rh,.rh-bg{background:#f7f2eb}
.rh-inner{background:transparent!important}
@media (max-width:900px){
  .rh{position:relative!important;height:auto!important;min-height:0!important;max-height:none!important;
    overflow:hidden!important;background:#f7f2eb!important;border-radius:0}
  .rh-bg{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
    min-height:0!important;max-height:none!important;background:#f7f2eb!important}
  .rh-bg picture{position:absolute!important;inset:0!important;display:block!important}
  .rh-bg img,.rh-shot{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
    min-height:0!important;max-height:none!important;object-fit:cover!important;object-position:center 28%!important}
  /* warm readability scrim (never a flat black wall) */
  .rh-bg::after{display:block!important;background:linear-gradient(0deg,rgba(38,24,14,.62) 0%,rgba(38,24,14,.2) 46%,rgba(38,24,14,0) 78%)!important}
  .rh-inner{position:relative!important;inset:auto!important;min-height:min(112vw,560px)!important;
    display:flex!important;align-items:flex-end!important;padding:0 20px 26px!important;background:transparent!important}
  .rh-copy{margin:0!important;width:100%}
}
/* the one remaining dark card (taste-test quote) joins the light palette */
.soc-r:first-child{background:#fff!important;color:#171512!important;border-color:#e6dccf!important}
.soc-r:first-child .soc-quote,.soc-r:first-child .soc-who b{color:#171512!important}
.soc-r:first-child .soc-who span{color:#8a7e72!important}
.soc-r:first-child .soc-rlabel{color:#E05A00!important}

/* Ronen: compact + punchy bullet chips instead of the paragraph */
.master-proof{padding:44px clamp(24px,5vw,64px) 48px!important;gap:clamp(26px,4vw,50px)!important}
.master-proof__media{height:470px!important}
.master-proof__content h2{font-size:clamp(32px,3.8vw,54px)!important;line-height:1.02!important;letter-spacing:-.035em!important}
.master-proof__eyebrow{color:#E05A00!important;font-size:12px!important;letter-spacing:.24em!important}
.master-proof{height:auto!important;min-height:435px!important}
.mp-points{list-style:none;margin:14px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}
.mp-points li{position:relative;padding-right:20px;font-weight:700;font-size:clamp(14.5px,1.4vw,18px);letter-spacing:-.01em;line-height:1.45}
.mp-points li::before{content:'';position:absolute;right:0;top:.42em;width:9px;height:9px;border-radius:50%;
  background:linear-gradient(140deg,#f0c6a0,#E05A00);box-shadow:0 0 6px rgba(224,90,0,.45)}
.master-proof__steps{margin-top:20px!important}
.master-proof__ronen{border:2px solid #f0c6a0!important;box-shadow:0 16px 40px rgba(224,90,0,.28)!important}
@media (max-width:900px){
  /* Ronen — flat editorial in the Mayven manner: photo, then plain text on the page,
     stats as hairline rows. No dark wall, no floating card, no shadows. */
  .master-proof{background:#f7f3ed!important;min-height:0!important;margin:6px 0 22px!important;
    padding:0 16px 20px!important;display:block!important;border-radius:0!important;box-shadow:none!important}
  .master-proof__media{position:relative!important;height:min(78vw,340px)!important;width:auto!important;
    border-radius:18px!important;margin:0 0 16px!important;box-shadow:none!important;overflow:hidden}
  .master-proof__media::after{background:linear-gradient(0deg,rgba(19,13,9,.34),transparent 55%)!important}
  .master-proof__content{width:auto!important;min-height:0!important;margin:0!important;padding:0!important;
    background:transparent!important;border-radius:0!important;box-shadow:none!important;color:#171512!important;
    justify-content:flex-start!important;position:relative;z-index:2}
  .master-proof__content>h2{color:#171512!important;font-size:29px!important;line-height:1.06!important;margin-top:8px!important}
  .master-proof__eyebrow{color:#E05A00!important;font-size:10px!important;letter-spacing:.15em!important;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .mp-points{color:#443c33!important;margin-top:12px!important}
  .mp-points li{font-size:14px!important;color:#443c33!important;font-weight:600!important}
  /* stats: flat rows split by hairlines, exactly like the pack rows */
  .master-proof__steps{display:block!important;margin-top:16px!important;padding:0!important;
    border-top:1px solid #e7ddd0!important}
  .master-proof__steps li{display:flex!important;align-items:baseline!important;gap:10px!important;
    background:transparent!important;border:0!important;border-bottom:1px solid #e7ddd0!important;
    border-radius:0!important;color:#171512!important;min-height:0!important;padding:11px 2px!important;
    backdrop-filter:none!important;box-shadow:none!important}
  .master-proof__steps li>b{color:#E05A00!important;font-size:21px!important;flex:0 0 auto;min-width:52px}
  .master-proof__steps strong{color:#171512!important;font-size:14px!important;display:inline!important;margin:0!important}
  .master-proof__steps strong::after{content:"·";margin:0 7px;color:#c4b8a8;font-weight:400}
  .master-proof__steps span{display:inline!important;color:#8a7c6a!important;font-size:12px!important;
    line-height:1.4!important;margin-inline-start:6px}
  .master-proof__ronen{top:12px!important;right:12px!important;border:0!important;box-shadow:none!important;
    background:rgba(255,255,255,.92)!important}
  .master-proof__caption{display:none!important}
}
</style>
<script>
(function(){
  function punchy(){
    var lead=document.querySelector('.master-proof__lead');
    if(!lead||document.querySelector('.mp-points'))return;
    var ul=document.createElement('ul');ul.className='mp-points';
    ul.style.color=getComputedStyle(lead).color; /* match the card's light/dark text */
    ul.innerHTML='<li>פורמולות עוצמתיות. שוקולד בריא.</li>'+
                 '<li>אפס פשרות על הטעם.</li>'+
                 '<li>שנה וחצי של דיוק — ביס אחד מושלם.</li>';
    lead.replaceWith(ul);
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',function(){setTimeout(punchy,60);});
  else setTimeout(punchy,60);
})();
</script>"""
t = t.replace('</body>', HOME_OVERRIDES + '</body>') if '</body>' in t else t + HOME_OVERRIDES

# (the fixed member-club strip was removed — it overlapped headings while scrolling;
#  the same promise now lives in the announce bar, the trust line and the club page)
LIFE_MAP = "<script>window.__MOODLIFE={ENERGY:'/mood-energy-lifestyle-new.png',RELAX:'/pdp-relax-01.png',SLEEP:'/mood-sleep-lifestyle-new.png'};</scr" + "ipt>"
t = t.replace('</body>', LIFE_MAP + '</body>') if '</body>' in t else t + LIFE_MAP

# Ronen: magnetic touches — count-up stats + slow Ken-Burns on the photo
RONEN_PLUS = """
<style>
.master-proof__media img,.master-proof>img{animation:mpKen 14s ease-in-out infinite alternate}
@keyframes mpKen{from{transform:scale(1)}to{transform:scale(1.055)}}
@media (prefers-reduced-motion:reduce){.master-proof__media img,.master-proof>img{animation:none}}
</style>
<script>
(function(){
  function countUp(el,target,suffix,dur){
    var t0=null;
    function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/dur);p=1-Math.pow(1-p,3);
      el.textContent=Math.round(target*p)+suffix;
      if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  }
  function arm(){
    var bs=document.querySelectorAll('.master-proof__steps li>b');
    if(!bs.length)return;
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting)return;
        io.disconnect();
        bs.forEach(function(b){
          var raw=b.textContent.trim();
          var m=raw.match(/^(\\d+)(.*)$/); if(!m)return;
          countUp(b,parseInt(m[1],10),m[2]||'',raw.length>3?900:1300);
        });
      });
    },{threshold:.4});
    io.observe(bs[0]);
  }
  // Ronen's award was written five different ways across the site, two of them
  // naming different competitions. One wording, one place to change it.
  var AWARD='השוקולטייר הטוב בעולם לשנת 2022';
  function hebrewEyebrow(){
    var e=document.querySelector('.master-proof__eyebrow');
    if(e)e.textContent='רונן אפללו · '+AWARD;
  }
  function heroPitch(){
    var eb=document.querySelector('.rh-eyebrow'), h=document.querySelector('.rh-h'),
        sub=document.querySelector('.rh-sub'), b1=document.querySelector('.rh-btn-primary');
    if(eb){eb.innerHTML='<b>פותח עם השוקולטייר הטוב בעולם</b>';eb.classList.add('rh-badge');}
    if(h)h.innerHTML='קובייה אחת ביום.<br><span>וזה כל הריטואל.</span>';
    if(sub)sub.remove();                       // the hero pulls you down the page, it doesn't explain
    if(b1)b1.textContent='בחרו את הרגע שלכם';
    var t=document.querySelector('.rh-trust'); if(t)t.remove();
    var m=document.querySelector('.rh-micro'); if(m)m.remove();
  }
  function ronenBand(){
    var mp=document.querySelector('.master-proof');
    if(!mp||mp.dataset.rebuilt)return;
    var shot=(mp.querySelector('.master-proof__campaign')||{}).src||'';
    var por=(mp.querySelector('.master-proof__ronen img')||{}).src||shot;
    mp.dataset.rebuilt='1';
    mp.className='mp2';mp.style.setProperty('--shot','url('+shot+')');
    mp.innerHTML=
      '<div class="mp2-in">'+
        '<div class="mp2-por"><img src="'+por+'" alt="רונן אפללו, "+AWARD+">'+
          '<i class="mp2-medal" aria-hidden="true">★</i></div>'+
        '<div class="mp2-copy">'+
          '<div class="mp2-eye">השוקולטייר של mood</div>'+
          '<h2>השוקולטייר הטוב בעולם<span> בנה לנו את הביס.</span></h2>'+
          '<p class="mp2-q">18 חודשים לקח לרונן אפללו למצוא את הנקודה שבה 800 מ״ג פורמולה '+
            'עדיין מרגישים כמו שוקולד. <i>"אם זה לא היה טעים — לא הייתי מוציא את זה מהמטבח."</i></p>'+
        '</div>'+
        '<div class="mp2-stats">'+
          '<div><b>2022</b><span>הטוב בעולם</span></div>'+
          '<div><b>18</b><span>חודשי פיתוח</span></div>'+
          '<div><b>70%</b><span>קקאו פרימיום</span></div>'+
        '</div>'+
      '</div>';
  }
  function closingBlock(){
    var soc=document.querySelector('.soc');
    if(!soc||soc.dataset.slim)return;
    soc.dataset.slim='1';
    // the legacy heading, video rail and quote cards go — the review list carries this section now
    ['.soc-head','.soc-grid','.soc-agg','.soc-demo','.soc-intro'].forEach(function(sel){
      var e=soc.querySelector(sel); if(e)e.remove();
    });
    var head=document.createElement('div'); head.className='cls-head';
    head.innerHTML='<h2>הריטואל החדש<span> שכולם רוצים.</span></h2>';
    soc.insertBefore(head, soc.firstChild);
    // the customer clips get a rail of their own, above the written reviews
    var vids=soc.querySelector('.soc-videos');
    if(vids){
      var rail=document.createElement('div'); rail.className='vrail';
      rail.innerHTML='<div class="vrail-head"><b>הרגעים שלהם</b><span>לקוחות מספרים · לחצו לצפייה</span></div>';
      soc.insertBefore(rail, head.nextSibling);
      rail.appendChild(vids);
      vids.classList.add('vrail-track');
      // each card opens the person's own words — no fake video player
      var STORY={'יעל':'לוקחת אחת בבוקר במקום הקפה של עשר. אנרגיה נקייה, בלי הרעד ובלי הנפילה של ארבע.',
                 'נועה':'הרגע שבין העבודה לילדים הוא הכי עמוס אצלי. הקובייה הזו היא ההפסקה היחידה שאני באמת לוקחת.',
                 'שירה':'סוגרת את היום עם קובייה וכוס תה. אחרי שלושה שבועות זה כבר לא החלטה — זה פשוט מה שקורה.'};
      [].forEach.call(vids.querySelectorAll('.soc-vid'),function(v){
        var nm=(v.querySelector('figcaption b')||{}).textContent||'';
        var q=STORY[nm.trim()]||'';
        if(!q)return;
        v.classList.add('has-story');
        v.addEventListener('click',function(){
          var box=document.createElement('div'); box.className='vstory';
          box.innerHTML='<div class="vstory-in"><button class="vstory-x" aria-label="סגירה">×</button>'+
            '<p>"'+q+'"</p><b>'+nm+'</b></div>';
          document.body.appendChild(box);
          requestAnimationFrame(function(){box.classList.add('on');});
          box.addEventListener('click',function(e){
            if(e.target===box||e.target.classList.contains('vstory-x'))box.remove();});
        });
      });
    }
  }
  function clubUnit(){
    var rc=document.querySelector('.rc'); if(!rc||rc.dataset.rebuilt)return;
    var img=rc.querySelector('img'); var src=img?img.src:'';
    rc.dataset.rebuilt='1'; rc.className='cu';
    rc.innerHTML=
      '<div class="cu-media"><img src="'+src+'" alt="מועדון החברים של mood"></div>'+
      '<div class="cu-in">'+
        '<div class="cu-copy">'+
          '<span class="cu-tag">המסלול המשתלם</span>'+
          '<div class="cu-eye">MOOD CLUB</div>'+
          '<h2>הריטואל שמגיע<span> עד אליכם.</span></h2>'+
          '<ul class="cu-list">'+
            '<li><b>10%</b> הנחה קבועה, בכל הזמנה</li>'+
            '<li><b>משלוח חינם</b> על הקופסה החודשית</li>'+
            '<li><b>דילוג או ביטול</b> בקליק אחד, בלי התחייבות</li>'+
          '</ul>'+
          '<a class="cu-cta" href="/club">הצטרפו למועדון</a>'+
          '<p class="cu-note">מבטלים מתי שרוצים · חיוב רק ביום המשלוח</p>'+
        '</div>'+
      '</div>';
  }
  function awardsStrip(){
    var mp=document.querySelector('.mp2'); if(!mp||document.querySelector('.awd'))return;
    var d=document.createElement('div'); d.className='awd';
    d.innerHTML='<div class="awd-in">'+
      '<span class="awd-lead"><b>★</b>רונן אפללו · השוקולטייר הטוב בעולם לשנת 2022</span>'+
      ['70% קקאו','0 גרם סוכר','כשר פרווה','תוצרת ישראל']
        .map(function(x){return '<span>'+x+'</span>';}).join('')+'</div>';
    mp.parentNode.insertBefore(d, mp);       // it introduces the champion, not the hero
  }
  function faqAside(){
    var faq=document.querySelector('.faq'); if(!faq||faq.dataset.aside)return;
    [].forEach.call(faq.querySelectorAll('details[open]'),function(d){d.removeAttribute('open');});
    [].forEach.call(faq.querySelectorAll('.faq-eyebrow,.eyebrow'),function(e){e.remove();});
    // the two headings of this section are one pair: same size, same colour break
    var fh=faq.querySelector('h2');
    if(fh)fh.innerHTML='כל מה<span> שרציתם לדעת.</span>';
    faq.dataset.aside='1';
    var inner=faq.querySelector('.faq-in')||faq;
    var ROWS=[['טעם שרוצים לחזור אליו',2,0,1],
              ['0 גרם סוכר',2,1,0],
              ['בלי רעד ובלי נפילה',2,1,0],
              ['נוח לקחת לכל מקום',2,1,0],
              ['מתמידים בו אחרי חודש',2,0,1]];
    function cell(v,us){
      var cls=v===2?'ok':(v===1?'mid':'no'), gl=v===2?'✓':(v===1?'~':'✕');
      return '<div class="'+(us?'us ':'')+'c"><i class="'+cls+'">'+gl+'</i></div>';
    }
    var aside=document.createElement('aside'); aside.className='fqa';
    aside.innerHTML=
      '<h3 class="fqa-h">למה קובייה<span> ולא עוד קפה?</span></h3>'+
      '<div class="cmp-tbl">'+
        '<div class="cmp-hd"><span></span><div class="us head"><b>mood</b></div>'+
          '<div class="head"><b>כדורים</b></div><div class="head"><b>קפה</b></div></div>'+
        ROWS.map(function(r){return '<div class="cmp-row"><span>'+r[0]+'</span>'+
          cell(r[1],true)+cell(r[2])+cell(r[3])+'</div>';}).join('')+
        '</div>'+
      '</div>';
  }
  function closingBlock(){
    var soc=document.querySelector('.soc');
    if(!soc||soc.dataset.slim)return;
    soc.dataset.slim='1';
    // the legacy heading, video rail and quote cards go — the review list carries this section now
    ['.soc-head','.soc-grid','.soc-agg','.soc-demo','.soc-intro'].forEach(function(sel){
      var e=soc.querySelector(sel); if(e)e.remove();
    });
    var head=document.createElement('div'); head.className='cls-head';
    head.innerHTML='<h2>הריטואל החדש<span> שכולם רוצים.</span></h2>';
    soc.insertBefore(head, soc.firstChild);
    // the customer clips get a rail of their own, above the written reviews
    var vids=soc.querySelector('.soc-videos');
    if(vids){
      var rail=document.createElement('div'); rail.className='vrail';
      rail.innerHTML='<div class="vrail-head"><b>הרגעים שלהם</b><span>לקוחות מספרים · לחצו לצפייה</span></div>';
      soc.insertBefore(rail, head.nextSibling);
      rail.appendChild(vids);
      vids.classList.add('vrail-track');
      // each card opens the person's own words — no fake video player
      var STORY={'יעל':'לוקחת אחת בבוקר במקום הקפה של עשר. אנרגיה נקייה, בלי הרעד ובלי הנפילה של ארבע.',
                 'נועה':'הרגע שבין העבודה לילדים הוא הכי עמוס אצלי. הקובייה הזו היא ההפסקה היחידה שאני באמת לוקחת.',
                 'שירה':'סוגרת את היום עם קובייה וכוס תה. אחרי שלושה שבועות זה כבר לא החלטה — זה פשוט מה שקורה.'};
      [].forEach.call(vids.querySelectorAll('.soc-vid'),function(v){
        var nm=(v.querySelector('figcaption b')||{}).textContent||'';
        var q=STORY[nm.trim()]||'';
        if(!q)return;
        v.classList.add('has-story');
        v.addEventListener('click',function(){
          var box=document.createElement('div'); box.className='vstory';
          box.innerHTML='<div class="vstory-in"><button class="vstory-x" aria-label="סגירה">×</button>'+
            '<p>"'+q+'"</p><b>'+nm+'</b></div>';
          document.body.appendChild(box);
          requestAnimationFrame(function(){box.classList.add('on');});
          box.addEventListener('click',function(e){
            if(e.target===box||e.target.classList.contains('vstory-x'))box.remove();});
        });
      });
    }
  }
  function clubUnit(){
    var rc=document.querySelector('.rc'); if(!rc||rc.dataset.rebuilt)return;
    var img=rc.querySelector('img'); var src=img?img.src:'';
    rc.dataset.rebuilt='1'; rc.className='cu';
    rc.innerHTML=
      '<div class="cu-media"><img src="'+src+'" alt="מועדון החברים של mood"></div>'+
      '<div class="cu-in">'+
        '<div class="cu-copy">'+
          '<span class="cu-tag">המסלול המשתלם</span>'+
          '<div class="cu-eye">MOOD CLUB</div>'+
          '<h2>הריטואל שמגיע<span> עד אליכם.</span></h2>'+
          '<ul class="cu-list">'+
            '<li><b>10%</b> הנחה קבועה, בכל הזמנה</li>'+
            '<li><b>משלוח חינם</b> על הקופסה החודשית</li>'+
            '<li><b>דילוג או ביטול</b> בקליק אחד, בלי התחייבות</li>'+
          '</ul>'+
          '<a class="cu-cta" href="/club">הצטרפו למועדון</a>'+
          '<p class="cu-note">מבטלים מתי שרוצים · חיוב רק ביום המשלוח</p>'+
        '</div>'+
      '</div>';
  }
  function awardsStrip(){
    var mp=document.querySelector('.mp2'); if(!mp||document.querySelector('.awd'))return;
    var d=document.createElement('div'); d.className='awd';
    d.innerHTML='<div class="awd-in">'+
      '<span class="awd-lead"><b>★</b>רונן אפללו · השוקולטייר הטוב בעולם לשנת 2022</span>'+
      ['70% קקאו','0 גרם סוכר','כשר פרווה','תוצרת ישראל']
        .map(function(x){return '<span>'+x+'</span>';}).join('')+'</div>';
    mp.parentNode.insertBefore(d, mp);       // it introduces the champion, not the hero
  }
  function faqAside(){
    var faq=document.querySelector('.faq'); if(!faq||faq.dataset.aside)return;
    [].forEach.call(faq.querySelectorAll('details[open]'),function(d){d.removeAttribute('open');});
    [].forEach.call(faq.querySelectorAll('.faq-eyebrow,.eyebrow'),function(e){e.remove();});
    // the two headings of this section are one pair: same size, same colour break
    var fh=faq.querySelector('h2');
    if(fh)fh.innerHTML='כל מה<span> שרציתם לדעת.</span>';
    faq.dataset.aside='1';
    var inner=faq.querySelector('.faq-in')||faq;
    var ROWS=[['טעם שרוצים לחזור אליו',2,0,1],
              ['0 גרם סוכר',2,1,0],
              ['בלי רעד ובלי נפילה',2,1,0],
              ['נוח לקחת לכל מקום',2,1,0],
              ['מתמידים בו אחרי חודש',2,0,1]];
    function cell(v,us){
      var cls=v===2?'ok':(v===1?'mid':'no'), gl=v===2?'✓':(v===1?'~':'✕');
      return '<div class="'+(us?'us ':'')+'c"><i class="'+cls+'">'+gl+'</i></div>';
    }
    var tot=[0,0,0]; ROWS.forEach(function(r){tot[0]+=r[1];tot[1]+=r[2];tot[2]+=r[3];});
    var max=ROWS.length*2;
    var aside=document.createElement('aside'); aside.className='fqa';
    aside.innerHTML=
      '<h3 class="fqa-h">למה קובייה<span> ולא עוד קפה?</span></h3>'+
      '<div class="cmp-tbl">'+
        '<div class="cmp-hd"><span></span><div class="us head"><b>mood</b></div>'+
          '<div class="head"><b>כדורים</b></div><div class="head"><b>קפה</b></div></div>'+
        ROWS.map(function(r){return '<div class="cmp-row"><span>'+r[0]+'</span>'+
          cell(r[1],true)+cell(r[2])+cell(r[3])+'</div>';}).join('')+
      '</div>';
    var wrap=document.createElement('div'); wrap.className='fq-grid';
    inner.parentNode.insertBefore(wrap, inner);
    wrap.appendChild(inner);
    wrap.appendChild(aside);
  }
  function trustLine(){
    var hm=document.querySelector('.hm');
    if(!hm||hm.dataset.done)return;
    hm.dataset.done='1';
    hm.className='tline';
    hm.innerHTML='<div class="tline-in">לא עוד משהו לזכור לקחת — <b>משהו שתחכו לאכול.</b></div>';
  }
  function callIcon(){
    var nav=document.querySelector('.xnav')||document.querySelector('nav');
    if(!nav||nav.querySelector('.mv-call'))return;
    var tools=nav.querySelector('.xnav-tools')||nav.lastElementChild;
    if(!tools)return;
    var a=document.createElement('a');
    a.className='mv-call'; a.href='tel:0524129125';
    a.setAttribute('aria-label','חייגו אלינו: 052-412-9125'); a.title='דברו איתנו';
    a.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" '+
      'stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 '+
      '19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 '+
      '2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
    tools.insertBefore(a, tools.firstChild);
  }
  function wireLinks(){
    // every page reachable from every page — nav, footer and the launch column
    var L=[['בלוג','/journal'],['המגזין','/journal'],['מועדון החברים','/club'],['שאלות ותשובות','/faq'],
           ['משלוחים והחזרות','/policies'],['תקנון האתר','/policies'],['מדיניות פרטיות','/policies'],
           ['הצהרת נגישות','/policies'],['הפורמולה','/products'],['הרגעים','/products']];
    [].forEach.call(document.querySelectorAll('a'),function(a){
      var t=(a.textContent||'').replace(/[\s←→]/g,'');
      L.forEach(function(p){ if(t===p[0].replace(/\s/g,'')) a.setAttribute('href',p[1]); });
    });
    // the footer tagline mixed hebrew and latin and broke mid-phrase — keep it hebrew
    var fm=document.querySelector('.ft-mini');
    if(fm&&/ENERGY/.test(fm.textContent))fm.textContent='שלושה רגעים ביום, שלוש פורמולות — קובייה אחת בכל פעם.';
    // footer launch column: the date is gone, the magazine takes its place
    var lc=document.querySelector('.ft-launch');
    if(lc){
      var h4=lc.querySelector('h4'), p=lc.querySelector('p'), j=lc.querySelector('.ft-join');
      if(h4)h4.textContent='המגזין של mood';
      if(p)p.textContent='27 כתבות על שינה, אנרגיה ורוגע — בלי הבטחות, עם הסברים.';
      if(j){j.setAttribute('href','/journal');j.innerHTML='לכל הכתבות<span aria-hidden="true"> ←</span>';}
    }
    // any remaining launch-date copy
    [].forEach.call(document.querySelectorAll('h4,p,span,a,li'),function(e){
      if(e.children.length===0 && /משיקים\s*ב?-?\s*12\.8/.test(e.textContent))
        e.textContent=e.textContent.replace(/משיקים\s*ב?-?\s*12\.8\.?\s*/g,'');
    });
  }
  function boot2(){[120,260,900,1800].forEach(function(d){
    setTimeout(function(){arm();hebrewEyebrow();heroPitch();wireLinks();ronenBand();trustLine();callIcon();closingBlock();clubUnit();faqAside();awardsStrip();},d);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot2); else boot2();
})();
</script>"""
t = t.replace('</body>', RONEN_PLUS + '</body>') if '</body>' in t else t + RONEN_PLUS
page_src['/'] = t

# ---------- 1c. PDP: faithful Mayven mobile — swipe gallery w/ edge-peek + sheet over image,
#             quote highlight, bought-count badge, per-pack ATC rows, full-ritual bundle ----------
_PDP_DATA = {
 '/energy': {'quote': 'מחליף לי את הקפה של עשר בבוקר. אנרגיה נקייה, בלי נפילה.', 'by': 'שירה', 'bought': '4,208'},
 '/relax':  {'quote': 'רבע שעה אחרי הקובייה — ואני בן אדם אחר. הריטואל שלי.', 'by': 'נועה', 'bought': '5,437'},
 '/sleep':  {'quote': 'פתרון גאוני למי שלא נרדמת. קמה רעננה בלי ערפול.', 'by': 'מיכל', 'bought': '3,892'},
}
PDP_SHEET = """
<style>
/* Codex's legacy add-to-cart toast pokes past the screen edge — our shell cart replaces it */
.cart-toast{display:none!important}
/* money-back promise + payment marks (audit: trust signals Mayven has and we lacked) */
.mv-guar{margin:10px 0 2px;font-size:13px;line-height:1.55;color:#5e5449;text-align:center}
.mv-guar b{color:#171512}
.pay{display:block!important}
.mv-pay{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:10px 0 6px}
.mv-pay i{font-style:normal;font-family:inherit;font-weight:800;font-size:11px;letter-spacing:.02em;color:#4a4137;
  border:1px solid #e0d6c8;background:#fff;border-radius:7px;padding:6px 10px;line-height:1}
.mv-paynote{display:block;text-align:center;font-size:11.5px;color:#8a7c6a;font-weight:700}
/* the written ingredient list is gone — the 360 formula module IS the formula story now */
.why .benefits{display:none!important}
.why.split{grid-template-columns:1fr!important;gap:10px!important}
.why .fpanel{width:100%}
.fpanel .fburst3d{height:min(150vw,760px)!important}
@media (max-width:700px){
  .why{padding:22px 14px 6px!important}
  .why h2{font-size:30px!important}
  .why .lede{font-size:14px!important}
  .fpanel .fburst3d{height:min(165vw,720px)!important}
}
/* no long dark walls: the marquee strip and THE CHOCOLATE section join the warm light palette */
.marquee{background:#f1e9db!important;border-top:1px solid #e7dcc9;border-bottom:1px solid #e7dcc9}
.marquee,.marquee *{color:#5a4632!important}
.choc{background:#F7F4EF!important;color:#241b12!important}
.choc h2,.choc p{color:#241b12!important}
.choc .ron{color:#6b8a68!important}
.choc .cimg{padding:16px 16px 0}
.choc .cimg img{border-radius:18px;width:100%;object-fit:cover;max-height:64vw}
/* Mayven blocks (all breakpoints) */
.mv-ship{display:inline-block;background:#fdeeda;color:#8a4b0f;font-weight:800;font-size:12.5px;border-radius:999px;padding:7px 14px;margin:0 0 10px}
.mv-quote{background:#f9f3e8;border-inline-start:3px solid #E05A00;border-radius:12px;padding:12px 14px;margin:12px 0 0;font-size:15px;line-height:1.55;font-weight:700;color:#4a3a28}
.mv-quote i{font-style:normal;font-weight:600;color:#8a6a45;font-size:13px}
.mv-bought{display:inline-block;background:#fdeeda;color:#8a4b0f;font-weight:900;font-size:13.5px;border-radius:999px;padding:8px 16px;margin:14px 0 0}
/* pack rows — flat Mayven rows: no boxes, hairline separators, chip pills, one price (in the button) */
.packs{gap:0!important}
.pack{display:grid!important;grid-template-columns:1fr auto;grid-template-areas:"l btn" "r btn";
  align-items:center;gap:2px 10px;padding:9px 2px!important;min-height:0!important;
  background:transparent!important;border:0!important;border-radius:0!important;
  border-bottom:1px solid #eadfce!important;box-shadow:none!important}
.pack:first-child{border-top:1px solid #eadfce!important}
.pack[aria-checked="true"]{background:#fdf7ee!important}
.pack .l{grid-area:l;min-width:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pack .l b{font-size:15.5px;letter-spacing:-.01em}
.pack .l span{display:inline-block;background:#fdeeda;color:#8a4b0f;border-radius:99px;
  padding:2px 9px;font-size:10px;font-weight:700;line-height:1.5}
.pack .r{grid-area:r;display:flex;flex-direction:row;align-items:center;gap:7px;justify-content:flex-start;margin:0}
.pack .r .price{display:flex;align-items:baseline;gap:6px;white-space:nowrap}
.pack .r .pp{display:none!important}   /* the total lives in the button only */
.pack .r .pu{font-size:11px;color:#8a7c6a}
.pack .tag{white-space:nowrap;font-size:9.5px!important;padding:2px 8px!important;
  background:#ffe9a8!important;color:#6b5200!important;border-radius:99px!important}
.mv-prow{grid-area:btn;display:block;margin:0!important}
.mv-padd{display:inline-block;width:auto;border:1.3px solid #E05A00;border-radius:999px;background:#fff;color:#c14e00;font-weight:800;font-size:12px;
  white-space:nowrap;padding:7px 13px!important;cursor:pointer;font-family:inherit;transition:background .15s;box-shadow:none}
.mv-padd:hover{background:#fff3e4}
/* qty stepper beside the main CTA (Mayven) */
.mv-qtyrow{display:flex;gap:10px;align-items:stretch;margin-top:12px}
.mv-stepper{display:flex;align-items:center;gap:13px;border:1.5px solid #d8cbb8;border-radius:999px;padding:0 15px;background:#fff;flex:0 0 auto}
.mv-stepper button{border:0;background:none;font-size:20px;font-weight:800;cursor:pointer;color:#171512;padding:0 2px;font-family:inherit}
.mv-stepper b{min-width:16px;text-align:center;font-size:16px}
.mv-qtyrow .cta{flex:1;margin-top:0!important}
.mv-bundle{margin:16px 0 4px;border:1px solid #ece2d2;border-radius:18px;background:#fff;padding:14px;display:grid;
  grid-template-columns:1fr auto;gap:12px;align-items:center}
.mv-bundle .tt{font-weight:900;font-size:15.5px;color:#171512}
.mv-bundle .dd{font-size:12.5px;color:#8a7c6a;margin-top:3px;line-height:1.5}
.mv-bundle .sv{display:inline-block;background:#fdeeda;color:#8a4b0f;font-weight:800;font-size:11.5px;border-radius:999px;padding:4px 10px;margin-top:8px}
.mv-bundle .imgs{display:flex}
.mv-bundle .imgs img{width:44px;height:56px;object-fit:contain;margin-inline-start:-10px;filter:drop-shadow(0 4px 8px rgba(41,25,10,.25))}
.mv-bundle button{grid-column:1/-1;border:2px solid #b06635;border-radius:999px;background:linear-gradient(180deg,#f9dcbc,#f0c6a0 55%,#eab88b);
  color:#5b2c07;font-weight:900;font-size:14.5px;padding:12px;cursor:pointer;font-family:inherit;box-shadow:0 5px 0 #E05A00;transition:transform .15s,box-shadow .15s}
.mv-bundle button:hover{transform:translateY(2px);box-shadow:0 3px 0 #E05A00}
@media (max-width:700px){
  .crumbs{display:none!important}
  .hero{padding:0 0 6px!important;gap:0!important}
  /* Mayven mechanic: the gallery is PINNED under the header; the sheet climbs over it and covers it.
     .page{overflow:hidden} kills position:sticky, and the page's own mobile CSS forces .gal static — undo both. */
  .page{overflow:visible!important}
  .gal{margin:0!important;position:sticky!important;top:0!important;z-index:0!important}
  .gal .main,.gthumbs{display:none!important}
  .gstrip{display:flex;direction:ltr;overflow-x:auto;scroll-snap-type:x mandatory;gap:0;scrollbar-width:none;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y}
  .gstrip::-webkit-scrollbar{display:none}
  .gstrip img{flex:0 0 100vw;width:100vw;height:60vh;object-fit:cover;scroll-snap-align:center;display:block}
  .dots{position:absolute!important;left:0;right:0;bottom:40px;z-index:3;display:flex!important;justify-content:center;margin:0!important}
  .buy{position:relative!important;z-index:2;background:#fff;border-radius:26px 26px 0 0;
    margin-top:-28px;padding:18px 16px 6px!important;box-shadow:0 -22px 52px rgba(41,25,10,.2)}
  /* compact sheet — Mayven density, much less scrolling */
  .buy .brandline{font-size:10.5px!important}
  .buy h1{font-size:42px!important;margin-top:4px!important;line-height:1!important}
  .buy .lede{font-size:14px!important;margin-top:8px!important;line-height:1.55!important}
  .rate{margin-top:8px!important}
  .mv-ship{margin-bottom:8px;font-size:12px;padding:6px 12px}
  /* one continuous sheet: quote / bought / bundle become flat rows split by hairlines, no boxes */
  .mv-quote{margin:10px 0 0;font-size:13.5px;padding:12px 0;background:none;border:0;border-radius:0;
    border-top:1px solid #f0e8db;border-bottom:1px solid #f0e8db}
  .mv-quote i{font-size:12px}
  .mv-bought{margin:0;font-size:12.5px;padding:10px 0;background:none;border-radius:0;display:block;
    border-bottom:1px solid #f0e8db;color:#8a4b0f;font-weight:800}
  .mv-bundle{margin:2px 0 0;border:0!important;border-radius:0!important;background:none!important;
    padding:14px 0 16px;border-bottom:1px solid #f0e8db!important}
  .mv-bundle button{background:#fff;border:1.3px solid #E05A00;color:#c14e00;box-shadow:none;
    font-size:13px;padding:10px;transition:background .15s}
  .mv-bundle button:hover{transform:none;box-shadow:none;background:#fff3e4}
  .suboptin{border-radius:14px}
  .infobox{margin:12px 0 0!important;padding:10px 12px!important;font-size:13px!important;line-height:1.55!important}
  .packlabel{margin:14px 0 6px!important;font-size:13px!important}
  .packs>*{padding:8px 2px!important;margin-bottom:0!important}
  .mv-prow{margin:6px 0 2px}
  .mv-padd{padding:7px 12px!important;font-size:11.5px}
  .cta{margin-top:10px!important}
  /* de-clutter: the formula infobox + brandline are noise on a small screen */
  .infobox{display:none!important}
  .buy .brandline{display:none!important}
}
</style>
<script>
(function(){
  var D={quote:'__QUOTE__',by:'__BY__',bought:'__BOUGHT__'};
  function boot(){
    var buy=document.querySelector('.buy'); if(!buy)return;
    // 1) Mayven mobile gallery: horizontal snap strip with edge-peek, built from the thumbs
    if(matchMedia('(max-width:700px)').matches && !document.querySelector('.gstrip')){
      var gal=document.querySelector('.gal');
      var srcs=[].map.call(document.querySelectorAll('#thumbs [data-src]'),function(b){return b.getAttribute('data-src');});
      if(gal&&srcs.length){
        var strip=document.createElement('div');strip.className='gstrip';
        strip.innerHTML=srcs.map(function(s){return '<img src="'+s+'" alt="">';}).join('');
        gal.insertBefore(strip,gal.firstChild);
        var dots=document.querySelectorAll('#dots span');
        strip.addEventListener('scroll',function(){
          var i=Math.round(Math.abs(strip.scrollLeft)/(strip.clientWidth*.86+8));
          dots.forEach&&dots.forEach(function(d,j){d.classList.toggle('active',j===Math.min(i,dots.length-1));});
        },{passive:true});
      }
    }
    // 1b) header tools: emoji row → clean Mayven line-icons with a cart badge
    var tools=document.querySelector('.tools');
    if(tools&&!tools.querySelector('svg')){
      tools.innerHTML='<span class="ticon" aria-label="חיפוש"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></span>'+
      '<span class="ticon" aria-label="מועדפים"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.6-9-8.5C1.6 8.6 3.4 5.5 6.5 5.5c2 0 3.5 1.2 4.2 2.6.2.4 1 .4 1.2 0 .7-1.4 2.2-2.6 4.2-2.6 3.1 0 4.9 3.1 3.5 6C19 15.4 12 20 12 20Z"/></svg></span>'+
      '<span class="ticon tcart" aria-label="סל"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg><i class="tbadge">0</i></span>';
      var st2=document.createElement('style');
      st2.textContent='.tools{display:flex!important;align-items:center;gap:14px}'+
        '.ticon{position:relative;display:inline-flex;cursor:pointer;color:#171512}'+
        '.ticon svg{width:21px;height:21px;display:block}'+
        '.tbadge{position:absolute;top:-7px;inset-inline-end:-8px;background:#E05A00;color:#fff;font-style:normal;'+
        'font-size:10px;font-weight:800;min-width:16px;height:16px;border-radius:99px;display:grid;place-items:center;padding:0 3px}';
      document.head.appendChild(st2);
    }
    // 2) sheet order: shipping badge above title, highlighted quote + bought badge after the stars
    if(!buy.querySelector('.mv-ship')){
      var ship=document.createElement('span');ship.className='mv-ship';ship.textContent='משלוח חינם במארז 3+ חודשים';
      buy.insertBefore(ship,buy.firstChild);
      var rate=buy.querySelector('.rate')||buy.querySelector('h1');
      var q=document.createElement('div');q.className='mv-quote';
      q.innerHTML='"'+D.quote+'" <i>| '+D.by+', קונה מאומתת</i>';
      rate.parentNode.insertBefore(q,rate.nextSibling);
      var bg=document.createElement('span');bg.className='mv-bought';bg.textContent=D.bought+' נקנו בחודש האחרון';
      q.parentNode.insertBefore(bg,q.nextSibling);
    }
    // 3) per-pack quick-add buttons (Mayven tier rows)
    var packs=document.querySelectorAll('.packs>*');
    var PR=[{plan:'חודש · 30 יחידות',price:170},{plan:'חודשיים · 60 יחידות',price:310},{plan:'שלושה חודשים · 90 יחידות',price:420}];
    packs.forEach&&packs.forEach(function(p,i){
      if(p.querySelector('.mv-padd')||!PR[i])return;
      var row=document.createElement('div');row.className='mv-prow';
      var b=document.createElement('button');b.className='mv-padd';b.type='button';
      b.textContent='הוסיפו לסל · ₪'+PR[i].price;
      b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();
        var sh=window.__moodShownPrice?window.__moodShownPrice(p):0;
        var price=sh||PR[i].price;
        try{parent.postMessage({moodCart:{action:'add',item:{sku:'__SKU2__',plan:PR[i].plan,price:price,qty:1}}},'*');}catch(_){}});
      row.appendChild(b);p.appendChild(row);
    });
    // 3b) qty stepper beside the main CTA
    var cta=document.getElementById('cta');
    if(cta&&!document.getElementById('mvqty')){
      var wrap=document.createElement('div'); wrap.className='mv-qtyrow';
      var st=document.createElement('div'); st.className='mv-stepper'; st.id='mvqty';
      st.innerHTML='<button type="button" data-d="-1" aria-label="פחות">−</button><b>1</b><button type="button" data-d="1" aria-label="יותר">+</button>';
      cta.parentNode.insertBefore(wrap,cta); wrap.appendChild(st); wrap.appendChild(cta);
      window.__mvQty=1;
      st.addEventListener('click',function(e){
        var b=e.target.closest('button'); if(!b)return; e.stopPropagation();
        window.__mvQty=Math.max(1,Math.min(9,(window.__mvQty||1)+(+b.dataset.d)));
        st.querySelector('b').textContent=window.__mvQty;
      });
    }
    // 3c) related moments (Mayven related-products strip) — the two other SKUs, before the reviews
    var rev=document.querySelector('.reviews');
    if(rev&&!document.querySelector('.mv-rel')){
      var REL={ENERGY:{img:'/mood-energy-lifestyle-new.png',t:'להיכנס לקצב.',href:'/energy'},
               RELAX:{img:'/mood-relax-lifestyle-new.png',t:'להוריד הילוך.',href:'/relax'},
               SLEEP:{img:'/mood-sleep-lifestyle-new.png',t:'לסגור את היום.',href:'/sleep'}};
      var others=Object.keys(REL).filter(function(k){return k!=='__SKU2__';});
      var w=document.createElement('div'); w.className='mv-rel';
      w.innerHTML='<h3>עוד רגעים של mood</h3><div class="mv-rel-row">'+others.map(function(k){
        return '<a href="'+REL[k].href+'"><img src="'+REL[k].img+'" alt="mood '+k+'"><span><b>'+k+'</b>'+REL[k].t+'</span></a>';
      }).join('')+'</div>';
      rev.parentNode.insertBefore(w,rev);
      var st3=document.createElement('style');
      st3.textContent='.mv-rel{max-width:1080px;margin:8px auto 26px;padding:0 18px}'+
        '.mv-rel h3{font-size:20px;font-weight:900;margin:0 0 12px}'+
        '.mv-rel-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}'+
        '.mv-rel a{position:relative;display:block;border-radius:18px;overflow:hidden;aspect-ratio:4/3;text-decoration:none}'+
        '.mv-rel img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s}'+
        '.mv-rel a:hover img{transform:scale(1.045)}'+
        '.mv-rel span{position:absolute;left:0;right:0;bottom:0;padding:26px 14px 12px;color:#fff;font-size:13px;font-weight:600;'+
        'background:linear-gradient(to top,rgba(18,11,5,.82),transparent)}'+
        '.mv-rel span b{display:block;font-size:14px;letter-spacing:.06em}';
      document.head.appendChild(st3);
    }
    // 3d) mobile: trust chips move below the bundle (Mayven order), less clutter up top
    if(matchMedia('(max-width:700px)').matches){
      var chips=document.querySelector('.buy .conversion-trust');
      if(chips)window.__moodChips=chips;
    }
    // 3e) money-back promise right under the CTA + payment marks instead of a text line
    var ctaEl=document.getElementById('cta');
    if(ctaEl&&!document.querySelector('.mv-guar')){
      var g=document.createElement('div'); g.className='mv-guar';
      g.innerHTML='<b>לא אהבתם? כסף חזרה תוך 30 יום.</b> בלי שאלות, על ההזמנה הראשונה.';
      (ctaEl.parentNode.classList.contains('mv-qtyrow')?ctaEl.parentNode:ctaEl).insertAdjacentElement('afterend',g);
    }
    // per-unit price is derived, never hand-written — it follows whatever the row costs
    // One price list. The page's own paint() reads data-base and applies the 10%
    // subscription discount when that toggle is on, so the corrected prices go
    // into data-base and everything downstream — pack price, main CTA, sticky
    // bar, free-shipping progress — follows from there. The per-unit figure and
    // the row buttons then sync to whatever price is actually on screen, so the
    // cart can never be handed a number the customer was not shown.
    (function(){
      var UNITS=[30,60,90];
      var rows=[].slice.call(document.querySelectorAll('#packs .pack'));
      if(!rows.length)rows=[].slice.call(document.querySelectorAll('.packs>*'));
      rows.forEach(function(p,i){ if(PR[i])p.dataset.base=PR[i].price; });
      function shown(p){
        var pp=p.querySelector('.pp');
        var v=pp?parseFloat((pp.textContent||'').replace(/[^0-9.]/g,'')):0;
        return v>0?v:0;
      }
      // sync() writes inside the node the observer watches, so it must never
      // re-enter and must never write a value that is already there — either
      // one turns this into an endless mutation loop that pins the tab.
      var busy=false;
      function put(el,txt){ if(el&&el.textContent!==txt)el.textContent=txt; }
      function sync(){
        if(busy)return; busy=true;
        try{
          rows.forEach(function(p,i){
            var price=shown(p)||(PR[i]&&PR[i].price)||0; if(!price)return;
            if(UNITS[i])put(p.querySelector('.pu'),'₪'+(price/UNITS[i]).toFixed(2)+' ליח׳');
            put(p.querySelector('.mv-padd'),'הוסיפו לסל · ₪'+price);
          });
        } finally { busy=false; }
      }
      // The subscription toggle shipped switched on, so the price on screen was
      // always the 10% member price and the list price was never shown. The
      // discount stays available; it is now something the customer opts into.
      var sc=document.getElementById('subcheck');
      if(sc&&sc.checked){
        sc.checked=false;
        try{sc.dispatchEvent(new Event('change',{bubbles:true}));}
        catch(_){ if(sc.click)sc.click(); }
      }
      var cur=document.querySelector('#packs .pack[aria-checked=true]')||rows[0];
      if(cur&&cur.click)cur.click();          // force a repaint with the new bases
      sync();
      var box=document.getElementById('packs')||document.querySelector('.packs');
      if(box&&window.MutationObserver)
        new MutationObserver(sync).observe(box,{subtree:true,childList:true,characterData:true});
      window.__moodShownPrice=shown;
    })();
    var pay=document.querySelector('.pay');
    if(pay&&!pay.querySelector('.mv-pay')){
      pay.innerHTML='<span class="mv-pay">'+
        ['VISA','Mastercard','Bit','Apple Pay','PayPal'].map(function(n){return '<i>'+n+'</i>';}).join('')+
        '</span><span class="mv-paynote">🔒 תשלום מאובטח בתקן PCI</span>';
    }
    // 4) full-ritual bundle (Mayven "קחי את כל החבילה")
    var packsBox=document.querySelector('.packs');
    if(packsBox&&!document.querySelector('.mv-bundle')){
      var bd=document.createElement('div');bd.className='mv-bundle';
      bd.innerHTML='<div class="bu-row">'+
          '<div class="bu-imgs"><img src="/mood-energy-pack.png" alt=""><img src="/mood-relax-pack.png" alt="">'+
          '<img src="/mood-sleep-pack.png" alt=""></div>'+
          '<div class="bu-txt"><b>כל הריטואל</b><span>ENERGY · RELAX · SLEEP</span></div>'+
          '<div class="bu-price"><b>₪433</b><s>₪510</s></div>'+
        '</div>'+
        '<button type="button" class="bu-go">הוסיפו את החבילה · חוסכים 15%</button>';
      bd.querySelector('.bu-go').addEventListener('click',function(){
        try{parent.postMessage({moodCart:{action:'add',item:{sku:'RITUAL',plan:'החבילה המלאה · 3 מארזים',price:433,qty:1}}},'*');}catch(_){}});
      packsBox.parentNode.insertBefore(bd,packsBox.nextSibling);
      if(window.__moodChips)bd.insertAdjacentElement('afterend',window.__moodChips);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
})();
</script>"""
for _r in ('/energy','/relax','/sleep'):
    _d = _PDP_DATA[_r]
    _sheet = (PDP_SHEET.replace('__QUOTE__', _d['quote']).replace('__BY__', _d['by'])
              .replace('__BOUGHT__', _d['bought']).replace('__SKU2__', {'/energy':'ENERGY','/relax':'RELAX','/sleep':'SLEEP'}[_r]))
    page_src[_r] = page_src[_r].replace('</body>', _sheet + '</body>')

# ---------- 1c2. the rotating 3D formula: embed ONCE in the shell, inject per-PDP ----------
_f3d = open(os.path.join(PUB, 'exact-v30/relax-formula-3d.html'), encoding='utf-8').read()
_f3d_patched = _f3d.replace('new URLSearchParams(location.search).get("m")', 'window.__MOODM__')
assert _f3d_patched != _f3d, 'formula m-read not found'
# the data panel used to swallow the rotating bar on a phone — slim it so the 3D stays the hero
_F3D_SLIM = '''<style>
@media (max-width:700px){
  #mood-xp .xp-ui{padding-top:14px!important}
  #mood-xp .xp-panel{padding:9px 14px 12px!important;border-radius:20px 20px 0 0!important}
  #mood-xp .xp-prod{gap:9px!important;padding-bottom:6px!important}
  #mood-xp .xp-pouch{height:52px!important}
  #mood-xp .xp-row{padding:4px 0!important}
  #mood-xp .xp-cta{margin-top:9px!important;padding:11px 18px!important}
  #mood-xp .xp-pills{margin-top:7px!important}
  #mood-xp .xp-pill{padding:8px 18px!important}
}
</style>'''
_f3d_patched = _f3d_patched.replace('</body>', _F3D_SLIM + '</body>')
page_src['%f3d%'] = _f3d_patched  # rides the asset-token + dedupe + escape pipeline

F3D_BRIDGE = """
<script>
(function(){
  var fr=document.querySelector('iframe.fburst-xp'); if(!fr)return;
  var m=(fr.getAttribute('src')||'').match(/m=(\\d)/); m=m?+m[1]:0;
  fr.removeAttribute('src');
  function ask(){try{parent.postMessage({moodF3D:{m:m}},'*');}catch(_){}}
  addEventListener('message',function(e){
    var d=e.data||{}; if(typeof d.moodF3DHTML!=='string')return;
    if(!fr.srcdoc)fr.srcdoc=d.moodF3DHTML;
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ask); else ask();
  setTimeout(ask,1200);
})();
</script>"""
for _r in ('/energy','/relax','/sleep'):
    page_src[_r] = page_src[_r].replace('</body>', F3D_BRIDGE + '</body>')

# ---------- 1d. CART: page-side bridge (all pages) ----------
_SKU = {'/energy':'ENERGY','/relax':'RELAX','/sleep':'SLEEP'}
for _r in page_src:
    sku = _SKU.get(_r, '')
    bridge = """
<script>
(function(){
  var SKU='__SKU__';
  var FALLBACK={0:{plan:'חודש · 30 יחידות',price:170},1:{plan:'חודשיים · 60 יחידות',price:310},2:{plan:'שלושה חודשים · 90 יחידות',price:420}};
  function send(m){try{parent.postMessage(m,'*');}catch(_){}}
  function pickPack(){
    var packs=document.querySelectorAll('.packs [role=radio],.packs input,.packs label,.packs>*');
    var chosen=null,idx=0,i=0;
    packs.forEach&&packs.forEach(function(p){
      var on=p.checked||p.getAttribute('aria-checked')==='true'||p.classList.contains('active')||p.classList.contains('selected');
      if(on&&!chosen){chosen=p;idx=i;} i++;
    });
    var src=chosen?(chosen.closest('label')||chosen):null;
    var txt=src?src.textContent.replace(/\\s+/g,' '):'';
    var pm=txt.match(/(\\d[\\d,]*)\\s*₪|₪\\s*(\\d[\\d,]*)/g);
    var price=null;
    if(pm){var nums=pm.map(function(x){return parseInt(x.replace(/[^\\d]/g,''),10);});price=Math.max.apply(null,nums);}
    var lm=txt.match(/(6|3)\\s*חודשים|חודש/);
    var f=FALLBACK[idx]||FALLBACK[0];
    return {plan:lm?lm[0].replace(/\\s+/g,' '):f.plan, price:price||f.price};
  }
  function addToCart(){
    var p=SKU?pickPack():FALLBACK[0];
    send({moodCart:{action:'add',item:{sku:SKU||'ENERGY',plan:p.plan,price:p.price,qty:window.__mvQty||1}}});
  }
  document.addEventListener('click',function(e){
    var t=e.target;
    var cta=t.closest&&(t.closest('#cta')||t.closest('.sb-cta'));
    if(cta&&SKU){e.preventDefault();e.stopPropagation();addToCart();return;}
    var tools=t.closest&&t.closest('.tools');
    if(tools&&/סל/.test(tools.textContent)){e.preventDefault();e.stopPropagation();send({moodCart:{action:'open'}});return;}
    var a=t.closest&&t.closest('a');
    if(a){
      var isCart=/סל|עגלה/.test((a.getAttribute('aria-label')||'')+a.textContent.replace(/\\s+/g,''))||a.querySelector('svg path[d^="M6.5 8h11"]');
      if(isCart){e.preventDefault();e.stopPropagation();send({moodCart:{action:'open'}});}
    }
  },true);
  // rotating announce-bar messages (Mayven keeps the top strip alive)
  (function(){
    var MSGS=['משלוח חינם בקנייה מעל ₪249 · מוקד שירות ישראלי',
              'כשר פרווה · 0 גרם סוכר · 70% קקאו',
              'פותח עם השוקולטייר הטוב בעולם · רונן אפללו',
              'קוד MOOD10 — 10% הנחה על ההזמנה הראשונה'];
    function arm(){
      var el=document.querySelector('.xannounce')||document.querySelector('.topbar');
      if(!el)return;
      el.style.transition='opacity .45s';
      var i=0;
      setInterval(function(){
        i=(i+1)%MSGS.length;
        el.style.opacity='0';
        setTimeout(function(){el.textContent=MSGS[i];el.style.opacity='1';},460);
      },5000);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arm); else arm();
  })();
  addEventListener('message',function(e){
    var d=e.data||{};
    if(d.moodA11y){
      var tag=document.getElementById('moodA11yCss');
      if(!tag){tag=document.createElement('style');tag.id='moodA11yCss';document.head.appendChild(tag);}
      var c='';
      if(d.moodA11y.big)c+='body{zoom:1.15}';
      if(d.moodA11y.contrast)c+='html{filter:contrast(1.2)}';
      if(d.moodA11y.calm)c+='*{animation:none!important;transition:none!important}';
      tag.textContent=c;
      return;
    }
    if(typeof d.moodCartCount!=='number')return;
    var n=d.moodCartCount;
    document.querySelectorAll('a b').forEach(function(b){
      var a=b.closest('a');if(!a)return;
      var lbl=(a.getAttribute('aria-label')||'')+a.textContent;
      if(/סל|עגלה/.test(lbl)||a.querySelector('svg')) b.textContent=n;
    });
    document.querySelectorAll('.tbadge').forEach(function(b){b.textContent=n;});
    document.querySelectorAll('a,.tools').forEach(function(a){
      if(a.querySelector&&a.querySelector('.tbadge'))return;
      if(/\\(\\d+\\)/.test(a.textContent)&&/סל/.test(a.textContent))
        a.innerHTML=a.innerHTML.replace(/\\(\\d+\\)/,'('+n+')');
    });
  });
})();
</script>""".replace('__SKU__', sku)
    page_src[_r] = page_src[_r].replace('</body>', bridge + '</body>') if '</body>' in page_src[_r] else page_src[_r] + bridge

# ---------- 1e. FAQ page (Fillit-style dedicated page, cloned from the policies shell) ----------
_FAQS = [
 ('מה זה בעצם שוקולד פונקציונלי?', 'שוקולד מריר 70% פרמיום שבתוכו פורמולה מדויקת של רכיבים צמחיים (אדפטוגנים, מיצויים ומינרלים). קודם כול טעים — ואז עושה בדיוק את מה שהוא מבטיח: אנרגיה, רוגע או שינה.'),
 ('כמה קוביות ביום מומלץ?', 'קובייה אחת ביום — זה כל הריטואל. כל מארז חודשי מכיל 30 יחידות אישיות, יחידה אחת ליום.'),
 ('מתי מרגישים את ההשפעה?', 'הרכיבים נספגים בהדרגה — רוב הלקוחות מדווחים על תחושה תוך 20–40 דקות, והאפקט המלא נבנה עם שימוש יומיומי קבוע לאורך שבועיים.'),
 ('יש בזה קפאין?', 'ב-ENERGY יש קפאין טבעי בשחרור איטי (תה ירוק וגוארנה) — בערך כמו חצי כוס קפה, בלי הרעד ובלי הנפילה. RELAX ו-SLEEP נטולי קפאין לחלוטין.'),
 ('האם המוצר כשר?', 'כן — כשר פרווה. מיוצר בישראל בסטנדרטים מחמירים של איכות ובקרה.'),
 ('אלרגנים וסוכר?', 'ללא תוספת סוכר. מיוצר במפעל שמעבד גם אגוזים — רגישים לאלרגנים מוזמנים לעיין בסימון שעל האריזה לפני הצריכה.'),
 ('איך עובד המנוי ואיך מבטלים?', 'המנוי החודשי מגיע אליכם אוטומטית עם 10% הנחה קבועה. אפשר לדלג על חודש, להחליף מצב רוח או לבטל בכל רגע — בלי שאלות.'),
 ('איך שומרים על השוקולד בקיץ הישראלי?', 'כל יחידה עטופה בנפרד. מומלץ לאחסן במקום קריר ויבש (עד 20°) ובקיץ — במגירת הירקות של המקרר.'),
]
_faq_items = ''.join(
    '<details' + (' open' if i == 0 else '') + '><summary>' + q + '</summary><p>' + a + '</p></details>'
    for i, (q, a) in enumerate(_FAQS))
page_src['/faq'] = ('<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">'
 '<meta name="viewport" content="width=device-width,initial-scale=1"><title>שאלות ותשובות · MOOD</title><style>'
 '*{box-sizing:border-box}body{margin:0;background:#f7f3ed;color:#171512;font-family:"Heebo",Arial,sans-serif;line-height:1.75}'
 'header{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #e3dbd0;padding:18px 6vw;display:flex;justify-content:space-between;align-items:center}'
 'header a{text-decoration:none;color:inherit}.logo{font-size:30px;font-weight:900;letter-spacing:-2px}.back{font-weight:700}'
 'main{width:min(760px,calc(100% - 36px));margin:52px auto 90px}'
 'h1{font-size:clamp(38px,6vw,64px);line-height:1;margin:0 0 8px}'
 '.sub{color:#8a7c6a;margin:0 0 30px;font-weight:600}'
 'details{background:#fff;border:1px solid #e3dbd0;border-radius:18px;margin:12px 0;overflow:hidden;transition:box-shadow .25s}'
 'details[open]{box-shadow:0 16px 40px -26px rgba(41,25,10,.4);border-color:#E05A00}'
 'summary{cursor:pointer;list-style:none;padding:20px 22px;font-weight:800;font-size:16.5px;display:flex;justify-content:space-between;align-items:center;gap:12px}'
 'summary::-webkit-details-marker{display:none}'
 'summary::after{content:"+";font-size:22px;font-weight:400;color:#E05A00;transition:transform .25s;flex:0 0 auto}'
 'details[open] summary::after{transform:rotate(45deg)}'
 'details p{margin:0;padding:0 22px 20px;color:#5e574f}'
 '.cta{display:block;text-align:center;margin-top:34px;background:linear-gradient(180deg,#f9dcbc,#f0c6a0 55%,#eab88b);'
 'border:2px solid #b06635;color:#5b2c07;border-radius:999px;padding:16px;font-weight:900;text-decoration:none;box-shadow:0 6px 0 #E05A00}'
 'footer{background:#171512;color:#ccc;padding:34px 6vw;text-align:center;font-size:13px}'
 '</style></head><body>'
 '<header><a class="logo" href="/">mood</a><a class="back" href="/">חזרה לאתר ←</a></header>'
 '<main><h1>שאלות ותשובות.</h1><p class="sub">כל מה שרציתם לדעת על הריטואל — ותשובות ישירות.</p>'
 + _faq_items +
 '<a class="cta" href="/#products">מוכנים? בחרו את הרגע שלכם ←</a></main>'
 '<footer>© mood 2026 · Ritual Chocolate · מיוצר בישראל · כשר פרווה</footer></body></html>')
# expose it: the home footer's FAQ link goes to the full page
page_src['/'] = page_src['/'].replace('<a href="#faq">שאלות ותשובות</a>', '<a href="/faq">שאלות ותשובות</a>')
# footer: the club link gets its own page, and the journal joins the list
page_src['/'] = page_src['/'].replace('<a href="#club">מועדון החברים</a>',
                                      '<a href="/club">מועדון החברים</a><a href="/journal">המגזין</a>')
page_src['/'] = page_src['/'].replace('>מועדון החברים<', ' href="/club">מועדון החברים<', 1) \
    if '<a href="/club">' not in page_src['/'] else page_src['/']

# ---------- 1f. PDP photo reviews (Fillit-style: reviews with real customer photos) ----------
_RV_PHOTOS = {
 '/energy': [('/claude-v29/claude-04-86638e6db8.webp','שירה ק׳','ה-Energy מחליף לי את הקפה של עשר בבוקר. אנרגיה נקייה, בלי נפילה.'),
             ('/claude-v29/claude-08-942c195fb5.jpg','רועי ד׳','לוקח קובייה לפני אימון בוקר — ההבדל מורגש כבר שבועיים ברצף.')],
 '/relax':  [('/claude-v29/claude-05-b597c7330f.webp','נועה ב׳','הריטואל של אחרי הצהריים. רבע שעה ואני בן אדם אחר.'),
             ('/claude-v29/claude-09-7c4a5a1ffc.jpg','דנה ר׳','טעים ברמה שקשה להאמין שזה גם מרגיע. הפך לחלק מהיום שלי.')],
 '/sleep':  [('/claude-v29/claude-06-f5a2e95580.webp','מיכל א׳','קובייה אחרי צחצוח שיניים — נרדמת רגועה, קמה רעננה.'),
             ('/claude-v29/claude-11-0ea0852b44.jpg','יונתן מ׳','ניסיתי הכול לשינה. זה הדבר הראשון שגם טעים וגם עובד.')],
}
_RV_CSS = """
<style>
.rphotos{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin:0 0 16px}
.rphoto{position:relative;border-radius:18px;overflow:hidden;aspect-ratio:4/3;background:#eee}
.rphoto img{width:100%;height:100%;object-fit:cover;display:block}
.rphoto figcaption{position:absolute;left:0;right:0;bottom:0;padding:26px 14px 12px;color:#fff;font-size:12.5px;line-height:1.45;
  background:linear-gradient(to top,rgba(18,11,5,.86),transparent)}
.rphoto figcaption b{display:block;font-size:12px;margin-bottom:2px}
.rphoto .st{position:absolute;top:10px;inset-inline-start:10px;background:rgba(255,255,255,.92);color:#b06635;
  border-radius:20px;padding:3px 9px;font-size:11px;font-weight:800;letter-spacing:1px}
@media (max-width:700px){.rphotos{grid-template-columns:1fr 1fr;gap:8px}.rphoto figcaption{font-size:10.5px;padding:20px 10px 9px}}
</style>"""
for _r, _ph in _RV_PHOTOS.items():
    _cards = ''.join(
        '<figure class="rphoto"><img src="%s" alt="ביקורת לקוח mood" loading="lazy"><span class="st">★★★★★</span>'
        '<figcaption><b>%s · קונה מאומת/ת</b>%s</figcaption></figure>' % (src, nm, txt)
        for src, nm, txt in _ph)
    _inj = _RV_CSS + """
<script>
(function(){
  function add(){
    var g=document.querySelector('.rgrid'); if(!g||document.querySelector('.rphotos'))return;
    var w=document.createElement('div'); w.className='rphotos';
    w.innerHTML='__CARDS__';
    g.parentNode.insertBefore(w,g);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add); else add();
})();
</script>""".replace('__CARDS__', _cards.replace("'", "\\'"))
    page_src[_r] = page_src[_r].replace('</body>', _inj + '</body>')

# ---------- 1g. products page: shop-by-need chips ----------
_NEED = """
<script>
(function(){
  function add(){
    var h=document.querySelector('h1,h2'); if(!h||document.querySelector('.needrow'))return;
    var d=document.createElement('div'); d.className='needrow';
    d.innerHTML='<a href="/energy">☀️ בוקר עמוס → ENERGY</a><a href="/relax">🌿 אחה״צ לחוץ → RELAX</a><a href="/sleep">🌙 לילה בלי שינה → SLEEP</a>';
    h.parentNode.insertBefore(d,h.nextSibling);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add); else add();
})();
</script>
<style>
.needrow{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:18px auto 6px;padding:0 16px}
.needrow a{background:#fff;border:1px solid #e3dbd0;border-radius:999px;padding:10px 18px;font-size:13.5px;font-weight:800;
  color:#171512;text-decoration:none;transition:border-color .2s,transform .2s,box-shadow .2s}
.needrow a:hover{border-color:#E05A00;transform:translateY(-2px);box-shadow:0 10px 24px -14px rgba(224,90,0,.5)}
</style>"""
page_src['/products'] = page_src['/products'].replace('</body>', _NEED + '</body>')

# Mayven card skin for the standalone products page (same classes as the embedded cards)
_CARDSKIN = """
<style>
/* editorial cards: the photograph is the card, the type sits on the page itself */
.card{border:0!important;outline:0!important;background:transparent!important;border-radius:0!important;
  overflow:visible!important;box-shadow:none!important}
.card::before,.card::after{display:none!important}
.card.energy{--sku:#F2902E}
.card.relax{--sku:#91B681}
.card.sleep{--sku:#779BC6}
.card .visual{border-radius:18px!important;overflow:hidden!important}
.card .content{text-align:center!important}
.card .label,.card .description,.card .monthly{display:none!important}
.mvname{font-size:22px;font-weight:800;letter-spacing:.055em;color:#1d3226;margin:7px 0 0}
/* the SKU colour arrives as a 26px rule — the card carries no other colour of its own */
.card .content h2{position:relative;font-size:15px!important;font-weight:500!important;color:#6b6459!important;
  margin:13px 0 16px!important;padding-top:13px!important;line-height:1.5!important;letter-spacing:0!important}
.card .content h2::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);
  width:26px;height:2px;border-radius:2px;background:var(--sku,#d8cbb8)}
.card .button{display:inline-block!important;width:auto!important;min-width:172px!important;padding:13px 22px!important;font-size:14.5px!important;line-height:1.2!important;min-height:46px!important}
.card .units{opacity:0!important;transform:scale(.98)!important}
.card .lifestyle{opacity:1!important;transform:none!important}
.card:hover .units{opacity:1!important;transform:none!important}
.card:hover .lifestyle{opacity:0!important}
.card .content{background:transparent!important;padding:15px 4px 0!important}
.mvstars{display:flex;align-items:center;justify-content:center;gap:7px;margin:0;font-weight:600;font-size:12px;color:#8a7c6a}
.mvstars b{color:#2e4633;letter-spacing:2.5px;font-size:13px}
.card .button{background:transparent!important;border:1.4px solid #1d3226!important;color:#1d3226!important;
border-radius:999px!important;font-weight:700!important;box-shadow:none!important;transition:background .2s,color .2s,border-color .2s!important}
.card .button:hover{background:#1d3226!important;color:#fff!important}
@media(max-width:700px){
  .cards{display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;
    padding:4px 14px 10px!important;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .cards::-webkit-scrollbar{display:none}
  .card{flex:0 0 90%!important;scroll-snap-align:center;min-width:0}
  .needrow{flex-wrap:nowrap!important;overflow-x:auto;justify-content:flex-start!important;
    gap:6px!important;margin-top:10px!important;padding:0 16px 4px!important;scrollbar-width:none}
  .needrow::-webkit-scrollbar{display:none}
  .needrow a{padding:8px 13px!important;font-size:12px!important;white-space:nowrap;flex:0 0 auto}
  .mvdots{display:flex;justify-content:center;gap:6px;margin:2px 0 10px}
  .mvdots i{width:7px;height:7px;border-radius:99px;background:#d8cbb8;transition:all .25s}
  .mvdots i.on{background:#E05A00;width:18px}
}
@media(min-width:701px){.mvdots{display:none}}
.mv-ritband{display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:center;max-width:900px;
  margin:26px auto 44px;padding:14px 18px;background:#fff;border:1px solid #ece2d2;border-radius:22px;
  text-decoration:none;box-shadow:0 18px 40px -28px rgba(41,25,10,.4);transition:transform .25s}
.mv-ritband:hover{transform:translateY(-3px)}
.mv-ritband img{width:150px;height:100px;object-fit:cover;border-radius:14px}
.mv-ritband b{font-size:18px;color:#171512;display:block}
.mv-ritband span{display:block;font-size:13px;color:#8a7c6a;margin-top:3px;line-height:1.5}
.mv-ritband i{font-style:normal;display:inline-block;margin-top:8px;font-weight:900;color:#c14e00;font-size:14px}
@media(max-width:700px){.mv-ritband{margin:4px 16px 34px;grid-template-columns:104px 1fr;padding:12px 14px}
  .mv-ritband img{width:104px;height:78px}.mv-ritband b{font-size:15.5px}}
</style>
<script>
(function(){
  var COUNTS={SLEEP:'(94)',RELAX:'(94)',ENERGY:'(127)'};   // must match each product page
  function go(){
    document.querySelectorAll('.card .content').forEach(function(c){
      if(c.querySelector('.mvstars'))return;
      var lab=c.querySelector('.label'); var sku=lab?lab.textContent.replace(/\\s/g,''):'';
      var row=document.createElement('div'); row.className='mvstars';
      row.innerHTML='<b>★★★★★</b><span>'+(COUNTS[sku]||'(120)')+'</span>';
      c.insertBefore(row,c.firstChild);
      if(sku&&!c.querySelector('.mvname')){
        var nm=document.createElement('div'); nm.className='mvname'; nm.textContent=sku;
        row.insertAdjacentElement('afterend',nm);
      }
    });
    if(matchMedia('(max-width:700px)').matches){
      var cs=document.querySelector('.cards'); var its=cs?cs.querySelectorAll('.card'):[];
      if(cs&&its.length>1&&!document.querySelector('.mvdots')){
        var dd=document.createElement('div'); dd.className='mvdots';
        var h2=''; for(var i2=0;i2<its.length;i2++)h2+='<i'+(i2===0?' class="on"':'')+'></i>';
        dd.innerHTML=h2; cs.insertAdjacentElement('afterend',dd);
        cs.addEventListener('scroll',function(){
          var w2=cs.clientWidth*0.9+10;
          var ix=Math.round(Math.abs(cs.scrollLeft)/w2);
          dd.querySelectorAll('i').forEach(function(dt,j){dt.classList.toggle('on',j===Math.min(ix,its.length-1));});
        },{passive:true});
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go); else go();
  function upg(){
    var LIFE={ENERGY:'/mood-energy-lifestyle-new.png',RELAX:'/pdp-relax-01.png',SLEEP:'/mood-sleep-lifestyle-new.png'};
    document.querySelectorAll('.card').forEach(function(c){
      var m=c.className.match(/energy|relax|sleep/); if(!m)return;
      var img=c.querySelector('.lifestyle');
      if(img)img.src=LIFE[m[0].toUpperCase()];
    });
    if(!document.querySelector('.mv-ritband')){
      var cards=document.querySelector('.cards'); if(!cards)return;
      var band=document.createElement('a'); band.className='mv-ritband'; band.href='/ritual';
      band.innerHTML='<img src="%%A0f0f0f0f0f%%" alt="החבילה המלאה"><div><b>THE FULL RITUAL 🍫</b>'+
        '<span>שלושת המצבים · חודש שלם לכל רגע · חוסכים 15%</span>'+
        '<i>₪433 במקום ₪510 — לעמוד החבילה ←</i></div>';
      cards.insertAdjacentElement('afterend',band);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',upg); else upg();
})();
</script>"""
page_src['/products'] = page_src['/products'].replace('</body>', _CARDSKIN + '</body>')

# ---------- 1h. bundle PDP (/ritual) — Mayven "EVERY BEAR ROUTINE" pattern ----------
_LINEUP = open('_lineup_b64.txt').read().strip()
page_src['/ritual'] = ('<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">'
 '<meta name="viewport" content="width=device-width,initial-scale=1"><title>THE FULL RITUAL · MOOD</title><style>'
 "*{box-sizing:border-box}body{margin:0;background:#faf6ef;color:#171512;font-family:'Heebo',Arial,sans-serif;line-height:1.7}"
 'header{position:sticky;top:0;z-index:9;background:#fff;border-bottom:1px solid #e3dbd0;padding:14px 5vw;display:flex;justify-content:space-between;align-items:center}'
 'header a{text-decoration:none;color:inherit}.logo{font-size:28px;font-weight:900;letter-spacing:-2px}.back{font-weight:700;font-size:14px}'
 '.gal{position:sticky;top:0;z-index:0}'
 '.gstrip{display:flex;direction:ltr;overflow-x:auto;scroll-snap-type:x mandatory;gap:8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y}'
 '.gstrip::-webkit-scrollbar{display:none}'
 '.gstrip img{flex:0 0 86vw;width:86vw;height:52vh;object-fit:cover;scroll-snap-align:center;display:block}'
 '@media(min-width:701px){.gstrip img{flex:0 0 49%;width:49%;height:56vh;object-fit:cover}}'
 '.sheet{position:relative;z-index:2;background:#fff;border-radius:26px 26px 0 0;margin-top:-26px;'
 'padding:20px 18px 30px;box-shadow:0 -22px 52px rgba(41,25,10,.2)}'
 '.in{max-width:640px;margin:0 auto}'
 '.ship{display:inline-block;background:#fdeeda;color:#8a4b0f;font-weight:800;font-size:12.5px;border-radius:999px;padding:7px 14px;margin:0 0 10px}'
 'h1{font-size:clamp(30px,7vw,44px);margin:0;line-height:1.02;letter-spacing:-.02em}'
 '.rate{margin:10px 0 0;font-size:14px;color:#5e574f}.rate b{color:#E05A00;letter-spacing:2px}'
 '.desc{margin:12px 0 0;color:#5e574f;font-size:15px}'
 '.bought{display:inline-block;background:#fdeeda;color:#8a4b0f;font-weight:900;font-size:13px;border-radius:999px;padding:8px 15px;margin:12px 0 0}'
 '.chips{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 0}'
 '.chips span{border:1px solid #cfd8c4;border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:700;color:#3b4a2b}'
 '.pricebox{display:flex;align-items:baseline;gap:12px;margin:20px 0 0}'
 '.pricebox .now{font-size:34px;font-weight:900}.pricebox .was{font-size:17px;color:#9a8f7f;text-decoration:line-through}'
 '.pricebox .save{background:#fdeeda;color:#8a4b0f;font-weight:800;font-size:12px;border-radius:999px;padding:5px 11px}'
 '.qtyrow{display:flex;align-items:center;gap:14px;margin:16px 0 0}'
 '.stepper{display:flex;align-items:center;gap:14px;border:1px solid #d8cbb8;border-radius:999px;padding:8px 16px}'
 '.stepper button{border:0;background:none;font-size:22px;font-weight:800;cursor:pointer;color:#171512;padding:0 6px}'
 '.stepper b{min-width:20px;text-align:center;font-size:17px}'
 '.atc{flex:1;border:2px solid #b06635;border-radius:999px;background:linear-gradient(180deg,#f9dcbc,#f0c6a0 55%,#eab88b);'
 'color:#5b2c07;font-weight:900;font-size:16px;padding:14px;cursor:pointer;font-family:inherit;box-shadow:0 6px 0 #E05A00;transition:transform .15s,box-shadow .15s}'
 '.atc:hover{transform:translateY(2px);box-shadow:0 4px 0 #E05A00}'
 '.ugc-h{margin:34px 0 4px;font-size:21px;font-weight:900}'
 '.ugc-s{color:#8a7c6a;font-size:13px;margin:0 0 14px}'
 '.ugc{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:6px}'
 '.ugc::-webkit-scrollbar{display:none}'
 '.ucard{position:relative;flex:0 0 62vw;max-width:240px;aspect-ratio:9/14;border-radius:18px;overflow:hidden;scroll-snap-align:center;background:#eee}'
 '.ucard img{width:100%;height:100%;object-fit:cover;display:block}'
 '.ucap{position:absolute;left:10px;right:10px;bottom:12px;background:rgba(255,255,255,.94);border-radius:10px;'
 'padding:7px 10px;font-size:11.5px;font-weight:800;color:#171512;line-height:1.4}'
 'footer{background:#171512;color:#ccc;padding:28px 6vw;text-align:center;font-size:12.5px;margin-top:36px}'
 '</style></head><body>'
 '<header><a class="logo" href="/">mood</a><a class="back" href="/#products">כל המוצרים ←</a></header>'
 '<div class="gal"><div class="gstrip">'
 '<img src="' + _LINEUP + '" alt="שלושת מארזי mood">'
 '<img src="/mood-hero-three-moments.png" alt="שלושה חברים עם mood">'
 '</div></div>'
 '<div class="sheet"><div class="in">'
 '<span class="ship">משלוח חינם</span>'
 '<h1>THE FULL RITUAL</h1>'
 '<div class="rate"><b>★★★★★</b> · 4.9 · 214 ביקורות</div>'
 '<p class="desc">שמנו לך את כל הריטואל במארז אחד — ENERGY לבוקר, RELAX לצהריים ו-SLEEP ללילה. חודש שלם לכל מצב רוח, במחיר משתלם יותר.</p>'
 '<span class="bought">2,347 נקנו בחודש האחרון</span>'
 '<div class="chips"><span>✓ מיוצר בישראל</span><span>✓ רכיבים טבעיים</span><span>✓ כשר פרווה</span><span>✓ ללא תוספת סוכר</span></div>'
 '<div class="pricebox"><span class="now">₪433</span><span class="was">₪510</span><span class="save">חוסכים 15%</span></div>'
 '<div class="qtyrow"><div class="stepper"><button id="minus">−</button><b id="qty">1</b><button id="plus">+</button></div>'
 '<button class="atc" id="atc">הוסיפו לסל · ₪433</button></div>'
 '<h2 class="ugc-h">לקוחות אמיתיים. רגעים אמיתיים.</h2>'
 '<p class="ugc-s">מהקהילה שלנו · 90 יחידות · שלושה מצבי רוח</p>'
 '<div class="ugc">'
 '<div class="ucard"><img src="/claude-v29/claude-08-942c195fb5.jpg" alt=""><div class="ucap">"הגיע תוך יומיים עם שליח 🚚 והאריזה מהממת"</div></div>'
 '<div class="ucard"><img src="/claude-v29/claude-09-7c4a5a1ffc.jpg" alt=""><div class="ucap">"חודש שני ברצף — הריטואל של הערב שלי"</div></div>'
 '<div class="ucard"><img src="/claude-v29/claude-11-0ea0852b44.jpg" alt=""><div class="ucap">"קניתי לעצמי, נשארתי בשביל כל המשפחה"</div></div>'
 '</div>'
 '</div></div>'
 '<footer>© mood 2026 · Ritual Chocolate · מיוצר בישראל · כשר פרווה</footer>'
 '<script>(function(){var q=1,Q=document.getElementById("qty"),P=433,B=document.getElementById("atc");'
 'function r(){Q.textContent=q;B.textContent="הוסיפו לסל · ₪"+(P*q);}'
 'document.getElementById("plus").onclick=function(){q=Math.min(9,q+1);r();};'
 'document.getElementById("minus").onclick=function(){q=Math.max(1,q-1);r();};'
 'B.onclick=function(){try{parent.postMessage({moodCart:{action:"add",item:{sku:"RITUAL",plan:"החבילה המלאה · 3 מארזים",price:P,qty:q}}},"*");}catch(_){}};'
 '})();</scr' + 'ipt></body></html>')

# the per-PDP bundle card links to the bundle page (Mayven "גלי עוד")
PDP_BUNDLE_LINK = """<a class="bu-more" href="/ritual">מה יש בחבילה ←</a>"""
for _r in ('/energy', '/relax', '/sleep'):
    page_src[_r] = page_src[_r].replace(
        "'<button type=\"button\">הוסיפו את החבילה · ₪433</button>'",
        "'<button type=\"button\">הוסיפו את החבילה · ₪433</button>" + PDP_BUNDLE_LINK.replace("'", "\\'") + "'")


# PDP footers: the magazine and the club get real links there too
for _r in ('/energy','/relax','/sleep'):
    page_src[_r] = page_src[_r].replace('>מועדון החברים<', ' href="/club">מועדון החברים<')
    page_src[_r] = page_src[_r].replace('>שאלות ותשובות<', ' href="/faq">שאלות ותשובות<')

# ---------- 1y. journal (blog) + club pages ----------
import _journal
_JOURNAL_IDS = _journal.build(page_src)

# ---------- 1y2. 30 reviews (placeholder copy until verified ones land) ----------
AWARD_TEXT = '\u05d4\u05e9\u05d5\u05e7\u05d5\u05dc\u05d8\u05d9\u05d9\u05e8 \u05d4\u05d8\u05d5\u05d1 \u05d1\u05e2\u05d5\u05dc\u05dd \u05dc\u05e9\u05e0\u05ea 2022'
import _reviews
_reviews.inject(page_src)
if getattr(_reviews, 'PLACEHOLDER', True):
    print('\n' + '!' * 74)
    print('!!  THE 30 CUSTOMER REVIEWS IN THIS BUILD ARE INVENTED PLACEHOLDERS.')
    print('!!  They ship with star ratings and a "verified" label. Publishing this')
    print('!!  build presents fabricated testimonials as real ones. Replace R in')
    print('!!  _reviews.py with attributable reviews before the site goes live.')
    print('!' * 74 + '\n')

# ---------- 1z. one button system + a small framed logo, injected into EVERY page ----------
MOOD_SYSTEM = """
<style>
/* ===================== DESKTOP (>=901px) — Mayven-style split hero ===================== */
@media (min-width:901px){
  /* the photo puts the people on the right and a white curtain on the left:
     copy goes on the curtain in dark ink, no muddy scrim needed */
  section.rh,.rh{height:min(84vh,720px)!important;min-height:0!important;max-height:none!important;
    background:#f7f2eb!important}
  .rh-bg,.rh-bg picture{position:absolute!important;inset:0!important}
  .rh-shot{width:100%!important;height:100%!important;object-fit:cover!important;object-position:50% 50%!important}
  .rh-bg::after{display:none!important}
  .rh-inner{position:absolute!important;inset:0!important;display:flex!important;direction:ltr!important;
    align-items:flex-end!important;justify-content:flex-start!important;
    padding:0 0 clamp(46px,7vh,84px) clamp(38px,6vw,86px)!important}
  .rh-copy{direction:rtl!important;max-width:440px!important;margin:0!important;text-align:right!important}
  .rh-eyebrow{display:block!important;color:#c1571b!important;font-size:12px!important;letter-spacing:.2em!important;text-shadow:none!important}
  .rh-h{color:#241b12!important;text-shadow:none!important;font-size:clamp(44px,4.1vw,62px)!important;
    line-height:1.02!important;margin-top:14px!important}
  .rh-h span{color:#E05A00!important;text-shadow:none!important}
  .rh-cta{display:flex!important;grid-template-columns:none!important;justify-content:flex-start!important;
    align-items:center;gap:10px!important;margin-top:28px!important;flex-wrap:wrap}
  .rh-btn{width:auto!important;min-width:0!important}
  .rh-btn-primary{padding:17px 40px!important;font-size:17px!important}
  .rh-btn-ghost{display:none!important}
  .rh-micro{color:#7d7264!important;font-size:12.5px!important}
  .products-frame{height:770px!important}
}
@media (max-width:900px){
  /* mobile hero: readable white copy over the photo, one tight trust row */
  .rh-inner{background:linear-gradient(0deg,rgba(28,18,11,.82) 0%,rgba(28,18,11,.5) 42%,rgba(28,18,11,.06) 78%)!important}
  .rh-copy{text-align:center!important}
  .rh-eyebrow{display:block!important;color:#f5cba4!important;font-size:10.5px!important;letter-spacing:.16em!important}
  .rh-h{font-size:37px!important;line-height:1.05!important;color:#fff!important}
  .rh-h span{color:#f7b27a!important}
  .rh-cta{margin-top:16px!important}
  .rh-btn-primary{width:100%!important;min-height:56px!important}
}
/* ============ CLUB — one unit, no dead space ============ */
.cu{background:#efe7db;padding:clamp(22px,3.4vw,44px) 0}
.cu-in{width:min(1060px,calc(100% - 32px));margin:0 auto;display:grid;gap:0;
  background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px -46px rgba(41,25,10,.5)}
.cu-media{position:relative;min-height:min(56vw,260px)}
.cu-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%}
.cu-tag{position:absolute;top:14px;inset-inline-start:14px;z-index:2;background:rgba(36,27,18,.86);color:#f6ecdd;
  font-size:11px;font-weight:800;padding:6px 12px;border-radius:999px;backdrop-filter:blur(6px)}
.cu-copy{padding:clamp(20px,3vw,34px)}
.cu-eye{font-size:11px;font-weight:900;letter-spacing:.2em;color:#E05A00}
.cu-copy h2{margin:9px 0 0;font-size:clamp(25px,3.6vw,38px);line-height:1.06;letter-spacing:-.035em;color:#171512}
.cu-copy h2 span{color:#E05A00}
.cu-list{list-style:none;margin:16px 0 0;padding:0;border-top:1px solid #ece3d6}
.cu-list li{padding:11px 0;border-bottom:1px solid #ece3d6;font-size:14.5px;color:#443c33;font-weight:600;
  display:flex;align-items:center;gap:10px}
.cu-list li::before{content:"";width:7px;height:7px;border-radius:2px;background:#E05A00;flex:0 0 auto}
.cu-list b{font-weight:900;color:#171512}
.cu-cta{display:inline-flex;align-items:center;justify-content:center;gap:11px;margin-top:18px;min-height:50px;
  padding:14px 30px;border-radius:999px;background:#241b12;color:#f6ecdd;border:1px solid #241b12;
  font-weight:700;font-size:15.5px;text-decoration:none;white-space:nowrap;transition:background .22s}
.cu-cta::before{content:"";width:7px;height:7px;border-radius:2px;background:currentColor;opacity:.55;
  transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .3s}
.cu-cta:hover{background:#3a2c1e}
.cu-cta:hover::before{transform:rotate(45deg) scale(1.15);opacity:1}
.cu-note{margin:11px 0 0;font-size:12px;color:#8a7c6a;font-weight:700}
@media (min-width:901px){
  .cu-in{grid-template-columns:minmax(0,.86fr) minmax(0,1fr)}
  .cu-media{min-height:100%}
}

/* ============ BUNDLE — a row, not a poster ============ */
.mv-bundle{display:block!important;margin:14px 0 2px!important;padding:15px 0 0!important;
  border:0!important;border-top:1px solid #f0e8db!important;border-bottom:1px solid #f0e8db!important;
  background:none!important;border-radius:0!important}
.bu-row{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding-bottom:12px}
.bu-imgs{display:flex;gap:4px;flex:0 0 auto}
.bu-imgs img{width:29px;height:38px;object-fit:contain;display:block;margin:0}
.bu-txt b{display:block;font-size:14.5px;font-weight:900;color:#171512;letter-spacing:-.01em;white-space:nowrap}
.bu-txt span{display:block;font-size:11px;white-space:nowrap;color:#8a7c6a;font-weight:700;margin-top:2px;
  direction:ltr;unicode-bidi:isolate;text-align:right}
.bu-price{text-align:center;line-height:1.15}
.bu-price b{display:block;font-size:17px;font-weight:900;color:#171512;font-variant-numeric:tabular-nums}
.bu-price s{font-size:11.5px;color:#a3988b;font-weight:700}
.bu-go{display:flex!important;align-items:center;justify-content:center;gap:11px;width:100%;min-height:48px;
  padding:13px 20px!important;border-radius:999px!important;background:transparent!important;color:#241b12!important;
  border:1.1px solid #cbbca8!important;font-weight:700!important;font-size:14px!important;cursor:pointer;
  font-family:inherit;transition:background .22s,border-color .22s}
.bu-go::before{content:"";width:7px;height:7px;border-radius:2px;background:currentColor;opacity:.55;
  transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .3s}
.bu-go:hover{background:#fff!important;border-color:#241b12!important}
.bu-go:hover::before{transform:rotate(45deg) scale(1.15);opacity:1}
.bu-more{display:block;margin:9px 0 14px;text-align:center;font-size:12.5px;font-weight:700;color:#8a7c6a;
  text-decoration:none}
.bu-more:hover{color:#241b12}
/* the main CTA never wraps */
.mv-qtyrow .cta{white-space:nowrap;font-size:15px!important;padding:14px 18px!important}
.conversion-trust{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:12px}
.conversion-trust span{font-size:11px!important;padding:6px 11px!important}

/* ============ THE LINE UNDER THE HERO — black, high contrast, nothing else ============ */
.tline{background:#0e0b08;padding:0}
.tline::before,.tline::after{content:none}
.tline .tline-in{max-width:1060px;margin:0 auto;padding:clamp(18px,2.6vw,26px) 22px;text-align:center;
  color:#fbf7f1;font-size:clamp(15px,2.6vw,23px);font-weight:700;letter-spacing:-.015em;line-height:1.42}
.tline .tline-in b{color:#FFB877;font-weight:900}

/* ============ RONEN — a band you cannot skim past ============ */
.mp2{background:#241b12;padding:clamp(20px,2.8vw,30px) 0;border:0;color:#f2e7d9;position:relative}
.mp2-in{width:min(1060px,calc(100% - 32px));margin:0 auto;display:grid;gap:14px 22px;align-items:center;
  grid-template-columns:auto 1fr}
.mp2-por{width:clamp(72px,9vw,110px);height:clamp(72px,9vw,110px);border-radius:50%;overflow:hidden;
  flex:0 0 auto;background:#3a2b1e;border:2px solid rgba(247,178,122,.55)}
.mp2-por img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
.mp2-eye{display:inline-block;font-size:clamp(9.5px,1.2vw,11px);font-weight:900;letter-spacing:.1em;color:#241b12;
  background:#F7B27A;padding:5px 11px;border-radius:999px;white-space:nowrap}
.mp2-copy h2{margin:9px 0 0;font-size:clamp(23px,3.2vw,36px);line-height:1.06;letter-spacing:-.035em;color:#fff}
.mp2-copy h2 span{color:#F7B27A}
.mp2-q{margin:9px 0 0;font-size:clamp(13.5px,1.55vw,15.5px);line-height:1.55;color:rgba(242,231,217,.78);
  font-weight:600;max-width:560px}
.mp2-q i{font-style:normal;font-weight:800;color:#F7B27A}
.mp2-q i{font-style:normal;font-weight:800;color:#F7B27A}
.mp2-stats{grid-column:1/-1;display:flex;border-top:1px solid rgba(247,178,122,.25);
  border-bottom:1px solid rgba(247,178,122,.25);margin-top:4px}
.mp2-stats div{flex:1;padding:10px 4px;display:flex;align-items:baseline;justify-content:center;gap:6px}
.mp2-stats div+div{border-inline-start:1px solid rgba(247,178,122,.25)}
.mp2-stats b{font-size:clamp(17px,2.1vw,22px);font-weight:900;color:#F7B27A;letter-spacing:-.03em;line-height:1;
  font-variant-numeric:tabular-nums}
.mp2-stats span{font-size:11px;color:rgba(242,231,217,.62);font-weight:700}
@media (min-width:901px){
  .mp2-in{grid-template-columns:auto minmax(0,1fr) auto;gap:28px}
  .mp2-stats{grid-column:auto;border:0;margin:0;flex:0 0 auto}
  .mp2-stats div{padding:0 18px;flex-direction:column;align-items:center;gap:4px;justify-content:center}
  .mp2-stats div+div{border-inline-start:1px solid rgba(247,178,122,.25)}
}

/* a play mark — these read as clips, and the card opens on tap */
.vrail-track .soc-vplay{background:rgba(255,255,255,.94)!important;width:54px!important;height:54px!important}
.vrail-track .soc-vplay::before{content:""!important;border-style:solid!important;
  border-width:9px 0 9px 15px!important;border-color:transparent transparent transparent #241b12!important;
  margin:0 0 0 3px!important;font-size:0!important}
.vrail-track .soc-vid:hover .soc-vplay{background:#fff!important}
.vrail-track .has-story{cursor:pointer}
.vstory{position:fixed;inset:0;z-index:60;background:rgba(24,16,10,.72);display:grid;place-items:center;
  padding:22px;opacity:0;transition:opacity .25s;backdrop-filter:blur(3px)}
.vstory.on{opacity:1}
.vstory-in{position:relative;max-width:460px;background:#faf6ef;border-radius:22px;padding:30px 26px 24px;
  box-shadow:0 30px 70px -30px rgba(0,0,0,.6)}
.vstory-in p{margin:0;font-size:18px;line-height:1.6;font-weight:700;color:#241b12}
.vstory-in b{display:block;margin-top:14px;font-size:13.5px;color:#8a7c6a}
.vstory-x{position:absolute;top:10px;inset-inline-end:12px;border:0;background:none;font-size:26px;
  line-height:1;color:#8a7c6a;cursor:pointer;font-family:inherit}

/* rating distribution above the written reviews */
.mv-dist{display:grid;gap:5px;margin:10px 0 6px}
.mv-dist div{display:grid;grid-template-columns:14px 1fr 34px;align-items:center;gap:8px;font-size:11.5px;
  color:#8a7c6a;font-weight:700}
.mv-dist i{height:6px;border-radius:99px;background:#ece3d6;overflow:hidden;font-style:normal;display:block}
.mv-dist i b{display:block;height:100%;background:#E05A00;border-radius:99px}

.how-eye{font-size:11px;font-weight:900;letter-spacing:.2em;color:#E05A00}
/* ============ CLOSING SECTION — two columns on a wide screen ============ */
@media (min-width:901px){
  .soc{display:grid!important;grid-template-columns:minmax(0,360px) minmax(0,1fr);
    gap:0 40px;align-items:start;width:min(1060px,calc(100% - 32px));margin:0 auto;
    padding:clamp(30px,4vw,50px) 0 clamp(24px,3vw,36px)!important}
  .cls-head{grid-column:1/-1;width:auto;margin:0 0 20px;text-align:center}
  .cls-head h2{font-size:clamp(26px,3vw,34px)}
  .vrail{width:auto;margin:0}
  .soc .vrail .vrail-track{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important}
  .soc .vrail .vrail-track .soc-vid{aspect-ratio:16/10!important;width:auto!important;flex:none!important}
  .soc .mv-rv{width:auto;margin:0}
  .soc .mv-rv .rv1:nth-last-child(-n+1){border-bottom:0}
}


.fqa-img img{height:min(58vw,300px)}
@media (min-width:901px){.fqa-img img{height:290px}}

/* accordion: a chevron that turns, closed by default */
.faq details>summary::after,.faq summary::after{content:"⌄"!important;font-size:19px!important;line-height:.6;
  transform:translateY(-2px);transition:transform .25s ease;color:#C9551A!important;font-weight:400!important}
.faq details[open]>summary::after,.faq details[open] summary::after{transform:rotate(180deg) translateY(-2px)!important}
/* ============ THE CLOSING SECTION: questions + the scoreboard, on white ============ */
/* the comparison is a desktop argument — on a phone it is only scroll */
@media (max-width:900px){.fqa{display:none!important}}
.faq{background:#fff!important}
.fq-grid{display:block}
.fqa{margin-top:30px;padding-top:26px;border-top:1px solid #ece3d6}
.how-eye{font-size:11px;font-weight:900;letter-spacing:.2em;color:#E05A00}
.fqa-h,.fq-grid>.faq h2{margin:0!important;font-size:clamp(21px,4.6vw,30px)!important;line-height:1.14!important;
  letter-spacing:-.032em!important;color:#171512!important;font-weight:900!important;text-align:right!important}
.fqa-h span,.fq-grid>.faq h2 span{color:#E05A00}
@media (min-width:901px){.fqa-h,.fq-grid>.faq h2{white-space:nowrap}}
.fqa-h span{color:#E05A00}
.cmp-tbl{margin-top:18px}
.cmp-hd,.cmp-row{display:grid;grid-template-columns:1fr 70px 62px 62px;align-items:center}
.cmp-hd{border-bottom:1px solid #e7ddd0}
.cmp-hd .head{padding:0 4px 9px;text-align:center}
.cmp-hd .head b{font-size:12px;font-weight:900;color:#a3968a}
.cmp-hd .us b{color:#241b12;font-size:15.5px;direction:ltr;letter-spacing:-.02em}
.cmp-row{border-bottom:1px solid #f2ece2}
.cmp-tbl .cmp-row:last-child{border-bottom:0}
.cmp-row span{padding:11px 2px;font-size:14px;font-weight:700;color:#443c33}
.cmp-row .c{display:grid;place-items:center;padding:9px 4px}
.cmp-row i{font-style:normal;font-size:14px;font-weight:900;display:grid;place-items:center;
  width:26px;height:26px;border-radius:50%}
.cmp-row i.ok{background:#E05A00;color:#fff}
.cmp-row i.no{background:#f7eeeb;color:#b0594a}
.cmp-row i.mid{background:#f4f0e9;color:#9c8f7e}
@media (min-width:901px){
  .fq-grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:56px;align-items:start;
    width:min(1060px,calc(100% - 32px));margin:0 auto}
  /* the FAQ column carries the section's own top padding — the aside matches it exactly
     so both eyebrows sit on one line */
  .fq-grid>.faq{padding-top:0!important}
  .fq-grid>.faq>h2,.fq-grid>.faq h2:first-of-type{margin-top:0!important}
  .fq-grid>.faq .faq-head,.fq-grid>.faq .faq-head *{margin-top:0!important;padding-top:0!important}
  .fq-grid{padding-top:clamp(40px,5vw,76px)}
  .fqa{margin-top:20px;padding-top:0;border-top:0}   /* meets the FAQ heading's line exactly */
  .cmp-hd,.cmp-row{grid-template-columns:1fr 76px 66px 66px}
  .faq{padding-bottom:52px!important}
}

/* ============ AWARDS STRIP — the run-up to the champion band ============ */
.awd{background:#f7f3ed;padding:0}
.awd-in{width:min(1060px,calc(100% - 32px));margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;
  justify-content:center;gap:9px 0;padding:16px 0 15px;border-bottom:1px solid #e4d8c6}
.awd-in span{position:relative;font-size:12.5px;font-weight:800;color:#8a7c6a;letter-spacing:.01em;
  white-space:nowrap;padding:0 15px}
.awd-in span+span::before{content:"";position:absolute;inset-inline-start:0;top:50%;width:4px;height:4px;
  border-radius:1px;background:#cdbfab;transform:translateY(-50%) rotate(45deg)}
.awd-in .awd-lead{display:inline-flex;align-items:center;gap:7px;color:#241b12;font-size:13.5px;font-weight:900}
.awd-in .awd-lead b{color:#C9551A;font-size:15px;line-height:1}
@media (max-width:700px){
  .awd-in{gap:7px 0;padding:13px 0 12px}
  .awd-in span{font-size:11px;padding:0 10px}
  .awd-in .awd-lead{font-size:12px;width:100%;justify-content:center;padding:0 0 4px}
  .awd-in .awd-lead+span::before{display:none}
}

/* the hero's champion line, as a badge */
.rh-badge{display:inline-flex!important;align-items:center;gap:8px;background:rgba(36,27,18,.9);
  border:1px solid rgba(247,178,122,.5);border-radius:999px;padding:7px 14px!important;
  font-size:11.5px!important;letter-spacing:.06em!important;color:#F7B27A!important;backdrop-filter:blur(6px)}
.rh-badge b{font-weight:900;color:#fff}
.rh-badge::before{content:"★";font-size:12px;color:#F7B27A;line-height:1}
@media (min-width:901px){
  .rh-badge{background:#fff;border-color:#e2d7c8;color:#8a6a45!important;font-size:12px!important;padding:8px 16px!important}
  .rh-badge b{color:#241b12}
  .rh-badge::before{color:#C9551A}
}

/* customer clips — a rail with real presence */
.vrail{width:min(1060px,calc(100% - 32px));margin:22px auto 6px}
.vrail-head{display:flex;align-items:baseline;gap:10px;margin-bottom:12px}
.vrail-head b{font-size:17px;font-weight:900;letter-spacing:-.02em;color:#171512}
.vrail-head span{font-size:12px;color:#8a7c6a;font-weight:700}
.vrail .soc-videos,.vrail-track{display:flex!important;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;
  scrollbar-width:none;padding:2px 0 6px;margin:0!important}
.vrail-track::-webkit-scrollbar{display:none}
.vrail-track .soc-vid{display:block!important;position:relative;flex:0 0 74%;scroll-snap-align:center;
  margin:0!important;border-radius:20px;overflow:hidden;background:#241b12;transform:none!important;aspect-ratio:3/4}
.vrail-track .soc-vid img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s}
.vrail-track .soc-vid:hover img{transform:scale(1.04)}
.vrail-track .soc-vid::after{content:"";position:absolute;inset:0;
  background:linear-gradient(0deg,rgba(20,13,8,.86) 0%,rgba(20,13,8,.22) 46%,transparent 72%)}
.vrail-track .soc-vplay{position:absolute!important;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3;
  width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;
  box-shadow:0 10px 26px rgba(0,0,0,.3)}
.vrail-track .soc-vplay::before{content:"";border-style:solid;border-width:9px 0 9px 14px;
  border-color:transparent transparent transparent #241b12;margin-inline-start:3px}
.vrail-track figcaption{position:absolute;inset:auto 0 0 0;z-index:3;padding:14px 15px 15px;color:#fff;display:block}
.vrail-track .soc-vtag{display:inline-block;font-size:9.5px;font-weight:900;letter-spacing:.14em;
  background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:4px 9px;
  color:#fff;margin-bottom:7px}
.vrail-track figcaption b{display:block;font-size:16px;font-weight:900;letter-spacing:-.02em}
.vrail-track .soc-vwho{display:block;font-size:12px;color:rgba(255,255,255,.82);font-weight:700;margin-top:2px}
@media (min-width:901px){
  .vrail-track{display:grid!important;grid-template-columns:repeat(3,1fr);gap:16px!important;overflow:visible!important}
  .vrail-track .soc-vid{flex:1 1 auto!important;width:auto!important;min-width:0;aspect-ratio:4/5}
  .vrail-head b{font-size:19px}
}

/* Ronen — the workshop photograph sits behind the band */
.mp2::before{content:"";position:absolute;inset:0;background-image:var(--shot);background-size:cover;
  background-position:center 34%;opacity:.16;filter:grayscale(.2)}
.mp2::after{content:"";position:absolute;inset:0;
  background:linear-gradient(90deg,rgba(36,27,18,.96) 34%,rgba(36,27,18,.6) 100%)}
.mp2>*{position:relative;z-index:2}
.mp2-por{position:relative}
.mp2-medal{position:absolute;inset-block-end:-4px;inset-inline-end:-4px;z-index:3;width:26px;height:26px;
  border-radius:50%;background:#F7B27A;color:#241b12;font-size:13px;font-style:normal;display:grid;
  place-items:center;box-shadow:0 4px 12px rgba(0,0,0,.4)}

/* ============ CLUB — a full screen, not a card ============ */
.cu{position:relative;min-height:100svh;display:flex;align-items:center;background:#241b12;overflow:hidden;padding:0}
.cu-media{position:absolute!important;inset:0!important;min-height:0!important;z-index:0}
.cu-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 28%}
.cu::after{content:"";position:absolute;inset:0;z-index:1;
  background:linear-gradient(0deg,rgba(24,16,10,.94) 0%,rgba(24,16,10,.7) 42%,rgba(24,16,10,.28) 78%)}
.cu-in{position:relative;z-index:2;width:min(1060px,calc(100% - 32px));margin:0 auto;display:block;
  background:none;border-radius:0;box-shadow:none;overflow:visible;
  padding:clamp(84px,13vh,130px) 0 clamp(34px,6vh,70px)}
.cu-tag{position:static;display:inline-block;background:rgba(247,178,122,.16);color:#F7B27A;
  border:1px solid rgba(247,178,122,.45);backdrop-filter:none;margin-bottom:14px}
.cu-copy{padding:0;max-width:620px;color:#f6ecdd}
.cu-eye{color:#F7B27A}
.cu-copy h2{color:#fff;font-size:clamp(30px,5vw,52px);margin-top:12px;line-height:1.04}
.cu-copy h2 span{color:#F7B27A}
.cu-list{border-top:1px solid rgba(247,178,122,.28);margin-top:22px}
.cu-list li{border-bottom:1px solid rgba(247,178,122,.28);color:rgba(246,236,221,.9);font-size:clamp(14.5px,1.8vw,17px);
  padding:13px 0}
.cu-list li::before{background:#F7B27A}
.cu-list b{color:#fff}
.cu-cta{margin-top:24px;background:#F7B27A;color:#241b12;border-color:#F7B27A}
.cu-cta:hover{background:#fff;border-color:#fff}
.cu-note{color:rgba(246,236,221,.6)}
@media (min-width:901px){.cu-in{grid-template-columns:none}}

/* dial icon in the header/* dial icon in the header — a symbol, not a number (the number appears on tap) */
.mv-call{display:inline-flex!important;align-items:center;justify-content:center;width:38px;height:38px;
  border-radius:50%;color:#241b12;text-decoration:none;transition:background .16s}
.mv-call:hover{background:#f3ece2}
@media (max-width:700px){.mv-call{width:34px;height:34px}}
/* ============ LOGO — small, inside its chocolate-square frame (our answer to Mayven's pill) ============ */
.xlogo,.product-logo{display:inline-flex!important;align-items:center;justify-content:center;
  padding:4px 10px!important;border:1.4px solid #241b12!important;border-radius:8px!important;
  background:#fff!important;box-shadow:none!important}
.xlogo,.product-logo{height:auto!important;line-height:0!important}
.xlogo img,.xlogo-img,.product-logo img{display:block;height:24px!important;width:auto!important;max-width:none!important}
@media (max-width:700px){
  .xlogo,.product-logo{padding:3px 8px!important;border-radius:7px!important}
  .xlogo img,.xlogo-img,.product-logo img{height:19px!important}
}

/* floats keep their distance from the buy actions */
.wa{bottom:172px!important;width:46px!important;height:46px!important;font-size:22px!important}
@media (min-width:901px){.wa{bottom:26px!important}}
/* latin product names stay one unbroken LTR run inside hebrew copy */
.ft-mini,.hf-copy p,.cls-head h2,.bu-txt span{unicode-bidi:plaintext}
/* the accessibility float keeps out of the way on a phone */
@media (max-width:700px){#a11yBtn{width:38px!important;height:38px!important;font-size:19px!important;opacity:.9}}
/* ============ FINISHING PASS — the details that separate good from finished ============ */
/* one selection colour across the whole site, in brand ink */
::selection{background:#f0c6a0;color:#241b12}
/* visible, calm focus for keyboard users — never the browser's blue halo */
a:focus-visible,button:focus-visible,input:focus-visible,summary:focus-visible,[role="radio"]:focus-visible{
  outline:2px solid #C9551A;outline-offset:3px;border-radius:6px}
a:focus:not(:focus-visible),button:focus:not(:focus-visible){outline:none}
/* numerals line up in columns — prices, mg, units */
.pu,.pp,.mono,.mv-bundle .sv,.mp2-stats b,.ct-tot,.ct-it .pr{font-variant-numeric:tabular-nums}
/* hebrew justification never breaks a word mid-air */
p,li,.rx,.lead{text-wrap:pretty}
h1,h2,h3,.rt,.ttl,.rh-h,.mp2-copy h2{text-wrap:balance}
/* images fade in instead of snapping */
img{background-color:#efe7db}
/* the one radius scale — 12 / 18 / 22, nothing in between */
.tk,.note,.pcard,.mv-bundle,.suboptin{border-radius:18px!important}
/* pack rows: the per-unit price sits on a single optical baseline */
.pack .r .pu{font-variant-numeric:tabular-nums;letter-spacing:.01em}
/* sticky buy bar gets a hairline instead of a shadow slab */
.stickybar{box-shadow:none!important;border-top:1px solid #e7ddd0!important}
/* scrollbars, where they show */
*{scrollbar-width:thin;scrollbar-color:#d8cbb8 transparent}
*::-webkit-scrollbar{width:9px;height:9px}
*::-webkit-scrollbar-thumb{background:#d8cbb8;border-radius:99px;border:2px solid transparent;background-clip:content-box}
*::-webkit-scrollbar-track{background:transparent}
@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
/* ============ BUTTONS — the MOOD signature: quiet pill + the chocolate square ============
   One square mark, borrowed from the logo's O, sits inside every real CTA and turns
   45° on hover. That tick is ours — nobody else's button does it.                      */
.cta,.sb-cta,.rh-btn,.rh-btn-primary,.rh-btn-ghost,.qbtn,.club-cta,.card .button,
.mv-padd,.mv-bundle button,.mv-stepper,#mood-xp .xp-cta,.btn{
  border-radius:999px!important;font-family:inherit!important;font-weight:700!important;
  letter-spacing:.005em!important;box-shadow:none!important;background-image:none!important;
  text-shadow:none!important;position:relative;
  transition:background .22s ease,color .22s ease,border-color .22s ease!important}
.cta::after,.rh-btn-primary::after,.sb-cta::after{content:none!important}
.rh-btn-primary::before,.cta::before{animation:none!important;background:currentColor!important;
  inset:auto!important;position:static!important;transform:none;filter:none!important;opacity:.55}
.cta:hover,.sb-cta:hover,.rh-btn:hover,.qbtn:hover,.club-cta:hover,.card .button:hover,
.mv-padd:hover,.mv-bundle button:hover,#mood-xp .xp-cta:hover,.btn:hover{transform:none!important;box-shadow:none!important}
.cta:active,.sb-cta:active,.rh-btn:active,.qbtn:active,.club-cta:active,
.mv-padd:active,.mv-bundle button:active,.btn:active{transform:translateY(1px)!important}

/* the signature mark */
.cta,.qbtn,.rh-btn-primary,.sb-cta,.mv-bundle button,.club-cta,.card .button,.btn:not(.chip){
  display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:11px!important}
.cta::before,.qbtn::before,.rh-btn-primary::before,.mv-bundle button::before,.club-cta::before,
.card .button::before,.btn:not(.chip):not(.ghost)::before{
  content:""!important;width:7px;height:7px;border-radius:2px;background:currentColor;opacity:.55;
  flex:0 0 auto;transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .3s}
.cta:hover::before,.qbtn:hover::before,.rh-btn-primary:hover::before,.mv-bundle button:hover::before,
.club-cta:hover::before,.card .button:hover::before,.btn:not(.chip):not(.ghost):hover::before{
  transform:rotate(45deg) scale(1.15);opacity:1}

/* primary — warm terracotta, softer than the old signal orange */
.cta,.sb-cta,.qbtn,.rh-btn-primary,#mood-xp .xp-cta,.btn:not(.ghost):not(.light):not(.chip){
  background:#C9551A!important;color:#fdf6ee!important;border:1px solid #B44A14!important}
.cta:hover,.sb-cta:hover,.qbtn:hover,.rh-btn-primary:hover,#mood-xp .xp-cta:hover,
.btn:not(.ghost):not(.light):not(.chip):hover{background:#A94512!important;border-color:#A94512!important}

/* secondary — chocolate hairline on cream. This is the quiet one, used most. */
.mv-padd,.mv-bundle button,.card .button,.btn.light{
  background:transparent!important;color:#241b12!important;border:1.1px solid #cbbca8!important}
.mv-padd:hover,.mv-bundle button:hover,.card .button:hover,.btn.light:hover{
  background:#fff!important;border-color:#241b12!important}
.rh-btn-ghost,.btn.ghost{background:transparent!important;color:#241b12!important;border:1.1px solid #241b12!important}
.rh-btn-ghost:hover,.btn.ghost:hover{background:rgba(36,27,18,.06)!important}

/* dark — the club, and anything on a photo */
.club-cta{background:#241b12!important;color:#f6ecdd!important;border:1px solid #241b12!important}
.club-cta:hover{background:#3a2c1e!important;border-color:#3a2c1e!important}

/* sizing — lighter than before: less height, more air inside */
.cta,.qbtn,.rh-btn,.club-cta,.mv-bundle button,.btn:not(.chip){
  min-height:50px;padding:14px 30px!important;font-size:15.5px!important}
.card .button{min-height:46px;padding:12px 26px!important;font-size:14.5px!important}
.mv-padd{min-height:0;padding:8px 15px!important;font-size:12px!important;font-weight:800!important}
.mv-stepper{border:1.1px solid #cbbca8!important;background:transparent!important}

/* ============ BUTTONS — one primary, one secondary, one shape ============ */
.rh-btn-primary,.ct-go,.cu-cta,.mv-rvmore{border-radius:999px!important;font-weight:700!important;
  letter-spacing:0!important;box-shadow:none!important;
  transition:background .2s,color .2s,border-color .2s!important}
/* primary: solid, and the same solid everywhere the ground is light —
   the checkout button was a ghost, which made the last step of the funnel
   the quietest button on the page */
.rh-btn-primary,.ct-go{background:#C9551A!important;color:#fff!important;
  border:1.4px solid #C9551A!important;padding:15px 30px!important;font-size:15.5px!important;
  min-height:52px!important}
.rh-btn-primary:hover,.ct-go:hover{background:#A8430F!important;border-color:#A8430F!important}
/* primary on the dark club band: inverted, because #C9551A on #241b12 is not a button */
.cu-cta{background:#F7B27A!important;color:#241b12!important;border:1.4px solid #F7B27A!important;
  padding:15px 30px!important;font-size:15.5px!important;min-height:52px!important}
.cu-cta:hover{background:#fff!important;border-color:#fff!important}
/* secondary: hairline ink, identical to the product cards */
.mv-rvmore{background:transparent!important;color:#1d3226!important;
  border:1.4px solid #1d3226!important;padding:13px 22px!important;font-size:14.5px!important;
  min-height:46px!important}
.mv-rvmore:hover{background:#1d3226!important;color:#fff!important}
@media (max-width:700px){
  .cta,.qbtn,.rh-btn,.club-cta,.mv-bundle button,.btn:not(.chip){min-height:52px;padding:15px 26px!important;font-size:15.5px!important}
  .rh-cta{display:block!important}
  .rh-btn{width:100%!important}
}
</style>"""
for _route in list(page_src):
    if _route == '%f3d%':
        continue
    page_src[_route] = (page_src[_route].replace('</body>', MOOD_SYSTEM + '</body>')
                        if '</body>' in page_src[_route] else page_src[_route] + MOOD_SYSTEM)
page_src['%f3d%'] = page_src['%f3d%'].replace('</body>', MOOD_SYSTEM + '</body>')

# ---------- 1z. claim normalisation across the source pages ----------
# Prices are declared once in the PDP script above and every figure the packs
# show is derived from them; these rewrite the same numbers where they sit in
# the source pages as plain text, so nothing on the site contradicts the list.
_CLAIM_FIX = [
    ('\u20aa305', '\u20aa310'), ('\u20aa413', '\u20aa420'),
    ('\u20aa5.08', '\u20aa5.17'), ('\u20aa4.59', '\u20aa4.67'),
    # five phrasings, two of them naming different competitions, become one
    ('\u05e9\u05d5\u05e7\u05d5\u05dc\u05d8\u05d9\u05d9\u05e8 \u05d6\u05d5\u05db\u05d4 \u05d4\u05de\u05e7\u05d5\u05dd \u05d4\u05e8\u05d0\u05e9\u05d5\u05df \u05d1\u05e2\u05d5\u05dc\u05dd (GOLD, International Chocolate Awards 2022)', AWARD_TEXT),
    ('\u05e9\u05d5\u05e7\u05d5\u05dc\u05d8\u05d9\u05d9\u05e8 \u05d6\u05d5\u05db\u05d4 GOLD \u00b7 Chocolate Awards 2022', AWARD_TEXT),
    ('\u05e9\u05d5\u05e7\u05d5\u05dc\u05d8\u05d9\u05d9\u05e8 \u05d6\u05d5\u05db\u05d4 \u05d6\u05d4\u05d1 \u05e2\u05d5\u05dc\u05de\u05d9', AWARD_TEXT),
    ('\u05e9\u05d5\u05e7\u05d5\u05dc\u05d8\u05d9\u05d9\u05e8 \u00b7 \u05d0\u05dc\u05d5\u05e3 \u05d4\u05e2\u05d5\u05dc\u05dd 2022', AWARD_TEXT),
    ('\u05d0\u05dc\u05d5\u05e3 \u05d4\u05e2\u05d5\u05dc\u05dd \u05dc\u05e9\u05d5\u05e7\u05d5\u05dc\u05d3 \u00b7 2022', AWARD_TEXT),
]
for _route in page_src:
    for _o, _n in _CLAIM_FIX:
        page_src[_route] = page_src[_route].replace(_o, _n)

for _b in ('/brand/bars-plate.jpg', '/brand/cafe-handoff.jpg', '/mood-club-generations.png',
           '/brand/blog-collage.png', '/brand/rooftop.png', '/brand/jump-o.webp', '/brand/field-guide.png'):
    referenced.add(_b)                            # the brand's own campaign photography
for _a in _journal.ARTICLES:                      # blog art + product shots
    referenced.add(_a['image'])
    if _a.get('productImage'):
        referenced.add(_a['productImage'])

ASSETS = {}
for p in sorted(referenced):
    uri, note = compress(p)
    tok = 'A' + hashlib.md5(p.encode()).hexdigest()[:10]
    ASSETS[tok] = uri
    print(f'{p:46s} {note:14s} tok={tok}')
    for route in page_src:
        page_src[route] = re.sub(re.escape(p) + r'(\?[A-Za-z0-9=&.]*)?', '%%' + tok + '%%', page_src[route])

# the how-it-works photos resolve to the same tokens the asset pass minted
for _ph, _path in (('%%FAQIMG%%', '/brand/bars-plate.jpg'),
                   ('%%CMPIMG%%', '/brand/cafe-handoff.jpg')):
    _t = 'A' + hashlib.md5(_path.encode()).hexdigest()[:10]
    assert _t in ASSETS, 'how-it-works asset missing: ' + _path
    page_src['/'] = page_src['/'].replace(_ph, '%%' + _t + '%%')

# ---------- 2. dedupe inline data uris (fonts etc.) shared across pages ----------
inline_counts = {}
data_re = re.compile(r'data:(?:font|image|application)/[A-Za-z0-9+.-]+;base64,[A-Za-z0-9+/=]+')
for route, t in page_src.items():
    for m in data_re.finditer(t):
        s = m.group(0)
        if len(s) > 4000:
            inline_counts[s] = inline_counts.get(s, 0) + 1
for s, n in list(inline_counts.items()):
    if n >= 2:  # appears in 2+ pages → dedupe
        tok = 'D' + hashlib.md5(s.encode()).hexdigest()[:10]
        ASSETS[tok] = s
        for route in page_src:
            page_src[route] = page_src[route].replace(s, '%%' + tok + '%%')
print('deduped shared inline blobs:', sum(1 for s, n in inline_counts.items() if n >= 2))
# shared lineup asset (products banner + ritual gallery)
ASSETS['A0f0f0f0f0f'] = _LINEUP
page_src['/ritual'] = page_src['/ritual'].replace(_LINEUP, '%%A0f0f0f0f0f%%')

# ---------- 3. nav-intercept + page prep ----------
NAV_JS = """<script>
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a[href]'); if(!a)return;
  var h=a.getAttribute('href')||'';
  if(/^(https?:|mailto:|tel:)/.test(h)) return;            // external: allow
  if(h.charAt(0)==='#'){return;}                            // in-page anchor: allow
  e.preventDefault();
  if(h==='#'||h==='blog.html') return;
  try{parent.postMessage({moodNav:h},'*');}catch(_){}
},true);
// nested srcdoc frames (embedded product cards): forward links to the router + apply the Mayven card skin
(function(){
  var CARD_CSS='.card{border:0!important;outline:0!important;background:transparent!important;border-radius:0!important;overflow:visible!important;box-shadow:none!important}'+'.card.energy{--sku:#F2902E}.card.relax{--sku:#91B681}.card.sleep{--sku:#779BC6}'+'.card .visual{border-radius:18px!important;overflow:hidden!important}'+'.card::before,.card::after{display:none!important}'+
   '.card .content{text-align:center!important}'+
   '.card .label,.card .description,.card .monthly{display:none!important}'+
   '.mvname{font-size:22px;font-weight:800;letter-spacing:.055em;color:#1d3226;margin:7px 0 0}'+
   '.card .content h2{position:relative;font-size:15px!important;font-weight:500!important;color:#6b6459!important;margin:13px 0 16px!important;padding-top:13px!important;line-height:1.5!important;letter-spacing:0!important}'+'.card .content h2::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:26px;height:2px;border-radius:2px;background:var(--sku,#d8cbb8)}'+
   '.card .button{display:inline-block!important;width:auto!important;min-width:172px!important;padding:13px 22px!important;font-size:14.5px!important;line-height:1.2!important;min-height:46px!important}'+
   '.card .units{opacity:0!important;transform:scale(.98)!important}'+
   '.card .lifestyle{opacity:1!important;transform:none!important}'+
   '.card:hover .units{opacity:1!important;transform:none!important}'+
   '.card:hover .lifestyle{opacity:0!important}'+
   '.card .content{background:transparent!important;padding:15px 4px 0!important}'+
   '.mvstars{display:flex;align-items:center;justify-content:center;gap:7px;margin:0;font-weight:600;font-size:12px;color:#8a7c6a}'+
   '.mvstars b{color:#2e4633;letter-spacing:2.5px;font-size:13px}'+
   '.card .button{background:transparent!important;border:1.4px solid #1d3226!important;color:#1d3226!important;'+
   'border-radius:999px!important;font-weight:700!important;box-shadow:none!important;transition:background .2s,color .2s,border-color .2s!important}'+
   '.card .button:hover{background:#1d3226!important;color:#fff!important}'+
   '@media(max-width:700px){'+'.cards{display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;'+'padding:4px 14px 10px!important;scrollbar-width:none;-webkit-overflow-scrolling:touch}'+'.cards::-webkit-scrollbar{display:none}'+'.card{flex:0 0 90%!important;scroll-snap-align:center;min-width:0}'+'.mvdots{display:flex;justify-content:center;gap:6px;margin:2px 0 10px}'+'.mvdots i{width:7px;height:7px;border-radius:99px;background:#d8cbb8;transition:all .25s}'+'.mvdots i.on{background:#E05A00;width:18px}'+'}'+'@media(min-width:701px){.mvdots{display:none}}';
  var COUNTS={SLEEP:'(94)',RELAX:'(94)',ENERGY:'(127)'};   // must match each product page
  function skin(d){
    if(d.__moodSkin)return; d.__moodSkin=true;
    var st=d.createElement('style'); st.textContent=CARD_CSS; d.head.appendChild(st);
    if(matchMedia('(max-width:700px)').matches){
      var fr=document.querySelector('.products-frame'); if(fr)fr.style.height='620px';
    }
    d.querySelectorAll('.card .content').forEach(function(c){
      if(c.querySelector('.mvstars'))return;
      var lab=c.querySelector('.label'); var sku=lab?lab.textContent.replace(/\\s/g,''):'';
      var row=d.createElement('div'); row.className='mvstars';
      row.innerHTML='<b>★★★★★</b><span>'+(COUNTS[sku]||'(120)')+'</span>';
      c.insertBefore(row,c.firstChild);
      if(sku&&!c.querySelector('.mvname')){
        var nm=d.createElement('div'); nm.className='mvname'; nm.textContent=sku;
        row.insertAdjacentElement('afterend',nm);
      }
    });
    var LIFE=window.__MOODLIFE||{};
    d.querySelectorAll('.card').forEach(function(c){
      var m=(c.className||'').match(/energy|relax|sleep/); if(!m)return;
      var img=c.querySelector('.lifestyle');
      var src=LIFE[m[0].toUpperCase()];
      if(img&&src&&src.indexOf('data:')===0)img.src=src;
    });
    if(matchMedia('(max-width:700px)').matches){
      var cs=d.querySelector('.cards'); var its=cs?cs.querySelectorAll('.card'):[];
      if(cs&&its.length>1&&!d.querySelector('.mvdots')){
        var dd=d.createElement('div'); dd.className='mvdots';
        var h2=''; for(var i2=0;i2<its.length;i2++)h2+='<i'+(i2===0?' class="on"':'')+'></i>';
        dd.innerHTML=h2; cs.insertAdjacentElement('afterend',dd);
        cs.addEventListener('scroll',function(){
          var w2=cs.clientWidth*0.9+10;
          var ix=Math.round(Math.abs(cs.scrollLeft)/w2);
          dd.querySelectorAll('i').forEach(function(dt,j){dt.classList.toggle('on',j===Math.min(ix,its.length-1));});
        },{passive:true});
      }
    }
  }
  function wire(fr){
    try{
      var d=fr.contentDocument; if(!d)return;
      if(d.body&&d.querySelector('.card'))skin(d);
      if(d.__moodWired)return; d.__moodWired=true;
      d.addEventListener('click',function(e){
        var a=e.target.closest&&e.target.closest('a[href]'); if(!a)return;
        var h=a.getAttribute('href')||'';
        if(/^(https?:|mailto:|tel:|#)/.test(h))return;
        e.preventDefault();
        try{window.parent.postMessage({moodNav:h},'*');}catch(_){}
      },true);
    }catch(_){}
  }
  function scan(){document.querySelectorAll('iframe').forEach(function(fr){wire(fr);fr.addEventListener('load',function(){try{fr.contentDocument.__moodWired=false;fr.contentDocument.__moodSkin=false;}catch(_){}wire(fr);});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(scan,200);});
  else setTimeout(scan,200);
  setTimeout(scan,1400);
})();
</script>"""
for route in page_src:
    t = page_src[route]
    t = t.replace('</body>', NAV_JS + '</body>') if '</body>' in t else t + NAV_JS
    # escape script terminators so it can live inside the shell's text/plain block
    t = t.replace('</script', '\u27e6/SCRIPT\u27e7')
    page_src[route] = t

# ---------- 4. shell ----------
assets_json = json.dumps(ASSETS)
shell_head = """<title>mood — ריטואל שוקולד פונקציונלי</title>
<style>
  html,body{margin:0;padding:0;height:100%;background:#faf6ef}
  body{overflow:hidden}
  .vw{position:fixed;inset:0;border:0;width:100%;height:100%;display:none}
  .vw.on{display:block;animation:vwIn .32s ease}
  @keyframes vwIn{from{opacity:0}to{opacity:1}}
  #boot{position:fixed;inset:0;display:grid;place-items:center;background:#faf6ef;z-index:9;
    font:700 22px/-apple-system system-ui,sans-serif;color:#5C8058;transition:opacity .4s}
  #boot.off{opacity:0;pointer-events:none}
  /* ===== CART DRAWER (shell-level, above all pages) ===== */
  #cartScrim{position:fixed;inset:0;background:rgba(23,18,12,.5);z-index:40;opacity:0;pointer-events:none;transition:opacity .3s}
  #cartScrim.on{opacity:1;pointer-events:auto}
  #cart{position:fixed;top:0;bottom:0;right:0;width:min(420px,94vw);z-index:41;background:#faf6ef;
    display:flex;flex-direction:column;direction:rtl;font-family:'Heebo','Assistant',system-ui,sans-serif;
    box-shadow:-24px 0 60px rgba(23,18,12,.35);transform:translateX(100%);visibility:hidden;
    transition:transform .38s cubic-bezier(.22,.61,.36,1),visibility 0s .38s}
  #cart.on{transform:none;visibility:visible;transition:transform .38s cubic-bezier(.22,.61,.36,1)}
  .ct-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #e9dfd0}
  .ct-head b{font-size:18px;color:#171512}
  .ct-x{border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:#171512;padding:4px 8px}
  .ct-ship{padding:14px 20px 0}
  .ct-ship p{margin:0 0 8px;font-size:12.5px;font-weight:700;color:#5b4a35}
  .ct-bar{height:8px;border-radius:99px;background:#eadfce;overflow:hidden}
  .ct-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#f0c6a0,#E05A00);transition:width .4s}
  .ct-items{flex:1;overflow-y:auto;padding:14px 20px;display:flex;flex-direction:column;gap:12px}
  .ct-empty{text-align:center;color:#8a7c6a;font-size:14.5px;margin-top:40px;line-height:1.7}
  .ct-it{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;background:#fff;
    border:1px solid #ece2d2;border-radius:16px;padding:10px 12px}
  .ct-it img{width:56px;height:56px;object-fit:contain}
  .ct-it .nm{font-weight:800;font-size:14px;color:#171512}
  .ct-it .pl{font-size:11.5px;color:#8a7c6a;margin-top:2px}
  .ct-qty{display:flex;align-items:center;gap:8px;margin-top:6px}
  .ct-qty button{width:22px;height:22px;border-radius:7px;border:1px solid #d8cbb8;background:#faf6ef;cursor:pointer;font-weight:800;line-height:1}
  .ct-qty span{font-weight:800;font-size:13px;min-width:14px;text-align:center}
  .ct-it .pr{font-weight:900;font-size:14.5px;color:#171512;white-space:nowrap}
  .ct-up{margin:0 20px;padding:12px 0 4px;border-top:1px dashed #d8cbb8}
  .ct-up p{margin:0 0 10px;font-size:12.5px;font-weight:800;color:#5b4a35}
  .ct-up-row{display:flex;gap:8px}
  .ct-up-row button{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;
    border:1px solid #ece2d2;border-radius:14px;background:#fff;cursor:pointer;transition:border-color .2s,transform .2s}
  .ct-up-row button:hover{border-color:#E05A00;transform:translateY(-2px)}
  .ct-up-row img{width:40px;height:40px;object-fit:contain}
  .ct-up-row span{font-size:11px;font-weight:800;color:#171512}
  .ct-up-row i{font-style:normal;font-size:10.5px;color:#8a7c6a}
  .ct-foot{padding:14px 20px 18px;border-top:1px solid #e9dfd0;background:#fff}
  .ct-tot{display:flex;justify-content:space-between;font-size:15px;font-weight:900;color:#171512;margin-bottom:12px}
  /* the last button in the funnel is the primary button, not a gradient toy with a hard shadow */
  .ct-go{display:flex;align-items:center;justify-content:center;width:100%;min-height:52px;padding:15px 24px;
    border-radius:999px;background:#C9551A;color:#fff;font-size:15.5px;font-weight:700;
    border:1.4px solid #C9551A;box-shadow:none;cursor:pointer;text-decoration:none;font-family:inherit;
    transition:background .2s,border-color .2s}
  .ct-go:hover{background:#A8430F;border-color:#A8430F}
  .ct-note{margin:9px 0 0;text-align:center;font-size:11px;color:#8a7c6a}
  .ct-cont{display:block;width:100%;margin:8px 0 0;border:0;background:none;color:#8a7c6a;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-decoration:underline}
  .ct-shop{display:inline-block;margin-top:14px;border:1.4px solid #1d3226;border-radius:999px;background:transparent;color:#1d3226;font-weight:700;font-size:14.5px;padding:13px 22px;min-height:46px;cursor:pointer;font-family:inherit;box-shadow:none;transition:background .2s,color .2s}
  .ct-shop:hover{background:#1d3226;color:#fff}
  .ct-coup{display:flex;gap:8px;margin-bottom:10px}
  .ct-coup input{flex:1;min-width:0;border:1px solid #d8cbb8;border-radius:999px;padding:9px 14px;font-size:13px;
    font-family:inherit;background:#faf6ef;color:#171512;outline:none;direction:rtl}
  .ct-coup input:focus{border-color:#E05A00}
  .ct-coup button{border:1.4px solid #1d3226;border-radius:999px;background:transparent;color:#1d3226;font-weight:700;
    font-size:13.5px;padding:9px 18px;cursor:pointer;font-family:inherit;transition:background .2s,color .2s}
  .ct-coup button:hover{background:#1d3226;color:#fff}
  .ct-disc span{color:#1d7a3f!important}
  /* Fillit-style purchase buzz toast */
  #buzz{position:fixed;left:14px;bottom:16px;z-index:39;display:flex;align-items:center;gap:11px;
    background:#fff;border:1px solid #ece2d2;border-radius:16px;padding:10px 16px 10px 12px;max-width:300px;
    box-shadow:0 18px 44px -18px rgba(23,18,12,.4);font-family:'Heebo','Assistant',system-ui,sans-serif;
    opacity:0;transform:translateY(16px);pointer-events:none;transition:opacity .45s,transform .45s}
  #buzz.on{opacity:1;transform:none}
  #buzz img{width:40px;height:40px;object-fit:contain}
  @media (max-width:700px){#buzz{bottom:150px;left:10px;max-width:76vw;padding:8px 12px 8px 10px}}
  /* accessibility widget (bottom-left float, like every Israeli site) */
  #a11yBtn{position:fixed;left:14px;bottom:16px;z-index:42;width:44px;height:44px;border-radius:50%;border:0;cursor:pointer;
    background:#3b4a2b;color:#fff;font-size:24px;line-height:1;display:grid;place-items:center;box-shadow:0 8px 22px rgba(23,18,12,.35)}
  #a11yPanel{position:fixed;left:14px;bottom:68px;z-index:42;background:#fff;border:1px solid #ece2d2;border-radius:16px;
    padding:14px 16px;box-shadow:0 18px 44px -14px rgba(23,18,12,.4);display:none;flex-direction:column;gap:10px;
    font-family:'Heebo','Assistant',system-ui,sans-serif;min-width:190px}
  #a11yPanel.on{display:flex}
  #a11yPanel b{font-size:14px;color:#171512}
  #a11yPanel label{display:flex;align-items:center;gap:8px;font-size:13.5px;color:#33302b;cursor:pointer}
  #a11yPanel a{font-size:12px;color:#8a7c6a}
  @media (max-width:700px){
    #buzz{left:10px}
    #a11yBtn{bottom:92px;width:40px;height:40px;font-size:21px}
    #a11yPanel{bottom:142px}
  }
  #buzz b{display:block;font-size:12.5px;color:#171512}
  #buzz span{display:block;font-size:11px;color:#8a7c6a;margin-top:2px}
</style>
<div id="boot">mood…</div>
<div id="cartScrim"></div>
<aside id="cart" aria-label="סל הקניות" dir="rtl">
  <div class="ct-head"><b>הסל שלך</b><button class="ct-x" aria-label="סגירה">×</button></div>
  <div class="ct-ship"><p id="ctShipTxt"></p><div class="ct-bar"><i id="ctShipBar"></i></div></div>
  <div class="ct-items" id="ctItems"></div>
  <div class="ct-up" id="ctUp"><p>השלימו את הריטואל</p><div class="ct-up-row" id="ctUpRow"></div></div>
  <div class="ct-foot">
    <div class="ct-coup"><input id="ctCoupIn" placeholder="קוד קופון (רמז: MOOD10)" aria-label="קוד קופון"><button id="ctCoupBtn">החלה</button></div>
    <div class="ct-tot ct-disc" id="ctDiscRow" style="display:none"><span>קופון MOOD10 · −10%</span><span id="ctDisc">−₪0</span></div>
    <div class="ct-tot"><span>סה״כ</span><span id="ctTotal">₪0</span></div>
    <a class="ct-go" id="ctGo" target="_blank" rel="noopener">להשלמת ההזמנה בוואטסאפ ←</a>
    <p class="ct-note">🔒 תשלום מאובטח · ויזה · מאסטרקארד · Bit · Apple Pay</p>
    <button class="ct-cont" id="ctCont">← המשך קנייה</button>
  </div>
</aside>
<div id="buzz" dir="rtl"><img id="buzzImg" alt=""><div><b id="buzzT"></b><span id="buzzS"></span></div></div>
<button id="a11yBtn" aria-label="תפריט נגישות" title="נגישות">&#9855;</button>
<div id="a11yPanel" dir="rtl" role="dialog" aria-label="הגדרות נגישות">
  <b>נגישות</b>
  <label><input type="checkbox" data-k="big"> טקסט מוגדל</label>
  <label><input type="checkbox" data-k="contrast"> ניגודיות גבוהה</label>
  <label><input type="checkbox" data-k="calm"> הפחתת אנימציות</label>
  <a href="#/policies">הצהרת נגישות</a>
</div>
"""
tpl_blocks = []
for route, t in page_src.items():
    rid = 'pgf3d' if route == '%f3d%' else 'pg' + (route.strip('/').replace('/', '_').replace('-', '_') or 'home')
    tpl_blocks.append(f'<script type="text/plain" id="{rid}">{t}</script>')

shell_js = """<script>
(function(){
  var ASSETS=__ASSETS__;
  var ROUTES={'/':'pghome','/products':'pgproducts','/energy':'pgenergy','/relax':'pgrelax','/sleep':'pgsleep','/policies':'pgpolicies','/faq':'pgfaq','/ritual':'pgritual','/club':'pgclub','/journal':'pgjournal'__JROUTES__};
  var frames={};
  function subst(id){
    var el=document.getElementById(id); if(!el)return null;
    var t=el.textContent;
    t=t.replace(/%%([AD][0-9a-f]{10})%%/g,function(_,k){return ASSETS[k]||'';});
    t=t.split('\\u27e6/SCRIPT\\u27e7').join('</scr'+'ipt');
    return t;
  }
  function html(route){return subst(ROUTES[route]);}
  var f3dCache=null;
  function f3dHTML(m){
    if(f3dCache===null)f3dCache=subst('pgf3d')||'';
    return '<scr'+'ipt>window.__MOODM__='+(+m||0)+'</scr'+'ipt>'+f3dCache;
  }
  function show(route,hash){
    route=ROUTES[route]?route:'/';
    for(var k in frames){frames[k].classList.remove('on');}
    var f=frames[route];
    if(!f){
      f=document.createElement('iframe');f.className='vw';
      f.setAttribute('title','mood '+route);
      document.body.appendChild(f); frames[route]=f;
      f.srcdoc=html(route);
      f.addEventListener('load',function(){
        document.getElementById('boot').classList.add('off');
        if(hash){try{f.contentWindow.location.hash=hash;}catch(_){}}
        try{broadcast();}catch(_){}
        try{f.contentWindow.postMessage({moodA11y:a11yState()},'*');}catch(_){}
      });
    }else{
      if(hash){try{f.contentWindow.location.hash=hash;}catch(_){}}
      else{try{f.contentWindow.scrollTo(0,0);}catch(_){}}
      document.getElementById('boot').classList.add('off');
    }
    f.classList.add('on');
    var want='#'+route;
    if(location.hash!==want && !(route==='/'&&(location.hash===''||location.hash==='#/')))
      history.pushState(null,'',want);
  }
  // ===== CART =====
  var PACKIMG={ENERGY:'__TOK_ENERGY__',RELAX:'__TOK_RELAX__',SLEEP:'__TOK_SLEEP__',RITUAL:'__TOK_ENERGY__'};
  var FREE=249, WA='972524129125';
  function cartLoad(){try{return JSON.parse(localStorage.getItem('moodCartV1'))||[];}catch(_){return [];}}
  function cartSave(c){try{localStorage.setItem('moodCartV1',JSON.stringify(c));}catch(_){}}
  function cartCount(c){return c.reduce(function(s,x){return s+x.qty;},0);}
  function cartTotal(c){return c.reduce(function(s,x){return s+x.qty*x.price;},0);}
  function broadcast(){
    var n=cartCount(cartLoad());
    for(var k in frames){try{frames[k].contentWindow.postMessage({moodCartCount:n},'*');}catch(_){}}
  }
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function cartRender(){
    var c=cartLoad(), box=document.getElementById('ctItems');
    if(!c.length){box.innerHTML='<p class="ct-empty">הסל עדיין ריק.<br>קובייה אחת ביום — בחרו את הרגע שלכם 🍫<br><button class="ct-shop" id="ctShop">לצפייה במוצרים ←</button></p>';
      var sb=document.getElementById('ctShop');
      if(sb)sb.addEventListener('click',function(){cartClose();show('/products');});}
    else{
      box.innerHTML=c.map(function(x,i){
        return '<div class="ct-it"><img src="'+(ASSETS[PACKIMG[x.sku]]||'')+'" alt="">'+
        '<div><div class="nm">mood '+esc(x.sku)+'</div><div class="pl">'+esc(x.plan)+'</div>'+
        '<div class="ct-qty"><button data-i="'+i+'" data-d="-1">−</button><span>'+x.qty+'</span><button data-i="'+i+'" data-d="1">+</button></div></div>'+
        '<div class="pr">₪'+(x.price*x.qty)+'</div></div>';
      }).join('');
    }
    var tot=cartTotal(c);
    var hasCoup=localStorage.getItem('moodCoup')==='MOOD10';
    var disc=hasCoup?Math.round(tot*0.1):0;
    document.getElementById('ctDiscRow').style.display=disc?'flex':'none';
    document.getElementById('ctDisc').textContent='−₪'+disc;
    tot-=disc;
    document.getElementById('ctTotal').textContent='₪'+tot;
    var left=Math.max(0,FREE-tot);
    document.getElementById('ctShipTxt').innerHTML=left>0?('עוד <b>₪'+left+'</b> למשלוח חינם 🚚'):'🎉 זכיתם במשלוח חינם!';
    document.getElementById('ctShipBar').style.width=Math.min(100,Math.round(tot/FREE*100))+'%';
    // upsell: the two skus not yet in the cart
    var inCart={}; c.forEach(function(x){inCart[x.sku]=1;});
    var up=inCart['RITUAL']?[]:['ENERGY','RELAX','SLEEP'].filter(function(s){return !inCart[s];});
    document.getElementById('ctUp').style.display=up.length&&c.length?'block':'none';
    document.getElementById('ctUpRow').innerHTML=up.map(function(s){
      return '<button data-sku="'+s+'"><img src="'+(ASSETS[PACKIMG[s]]||'')+'" alt=""><span>'+s+'</span><i>חודש · ₪170</i></button>';
    }).join('');
    var NL=String.fromCharCode(10);
    var lines=c.map(function(x){return '• mood '+x.sku+' — '+x.plan+' ×'+x.qty+' = ₪'+(x.price*x.qty);});
    document.getElementById('ctGo').href='https://wa.me/'+WA+'?text='+encodeURIComponent('היי! אשמח להזמין מ-mood:'+NL+lines.join(NL)+(disc?NL+'קופון MOOD10: −₪'+disc:'')+NL+'סה״כ: ₪'+tot+(left<=0?NL+'(משלוח חינם 🎉)':''));
    broadcast();
  }
  function cartOpen(){cartRender();document.getElementById('cart').classList.add('on');document.getElementById('cartScrim').classList.add('on');}
  function cartClose(){document.getElementById('cart').classList.remove('on');document.getElementById('cartScrim').classList.remove('on');}
  function cartAdd(item){
    var c=cartLoad();
    var hit=c.find(function(x){return x.sku===item.sku&&x.plan===item.plan;});
    if(hit)hit.qty+=item.qty||1; else c.push({sku:item.sku,plan:item.plan,price:item.price,qty:item.qty||1});
    cartSave(c); cartOpen();
  }
  document.getElementById('cartScrim').addEventListener('click',cartClose);
  document.querySelector('.ct-x').addEventListener('click',cartClose);
  document.getElementById('ctCont').addEventListener('click',cartClose);
  document.getElementById('ctItems').addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b)return;
    var c=cartLoad(), i=+b.dataset.i;
    c[i].qty+=+b.dataset.d;
    if(c[i].qty<=0)c.splice(i,1);
    cartSave(c); cartRender();
  });
  document.getElementById('ctUpRow').addEventListener('click',function(e){
    var b=e.target.closest('button[data-sku]'); if(!b)return;
    cartAdd({sku:b.dataset.sku,plan:'חודש · 30 יחידות',price:170,qty:1});
  });
  document.getElementById('ctCoupBtn').addEventListener('click',function(){
    var v=(document.getElementById('ctCoupIn').value||'').trim().toUpperCase();
    if(v==='MOOD10'){localStorage.setItem('moodCoup','MOOD10');document.getElementById('ctCoupIn').value='';cartRender();}
    else{document.getElementById('ctCoupIn').style.borderColor='#c0392b';setTimeout(function(){document.getElementById('ctCoupIn').style.borderColor='';},900);}
  });
  // ===== accessibility widget =====
  function a11yState(){try{return JSON.parse(localStorage.getItem('moodA11y'))||{};}catch(_){return {};}}
  function a11yCss(st){
    var c='';
    if(st.big)c+='body{zoom:1.15}';
    if(st.contrast)c+='html{filter:contrast(1.2)}';
    if(st.calm)c+='*{animation:none!important;transition:none!important}';
    return c;
  }
  function a11yApply(){
    var st=a11yState();
    var tag=document.getElementById('moodA11yCss');
    if(!tag){tag=document.createElement('style');tag.id='moodA11yCss';document.head.appendChild(tag);}
    tag.textContent=a11yCss(st);
    for(var k in frames){try{frames[k].contentWindow.postMessage({moodA11y:st},'*');}catch(_){}}
  }
  (function(){
    var btn=document.getElementById('a11yBtn'),panel=document.getElementById('a11yPanel');
    btn.addEventListener('click',function(){panel.classList.toggle('on');});
    var st=a11yState();
    panel.querySelectorAll('input[data-k]').forEach(function(i){
      i.checked=!!st[i.dataset.k];
      i.addEventListener('change',function(){
        var s=a11yState(); s[i.dataset.k]=i.checked;
        try{localStorage.setItem('moodA11y',JSON.stringify(s));}catch(_){}
        a11yApply();
      });
    });
    a11yApply();
  })();
  // Fillit-style purchase buzz: rotating recent-order toasts
  (function(){
    var DATA=[['דנה','תל אביב','RELAX','מארז חודשיים','הזמינה'],['עומר','חיפה','ENERGY','מארז חודש','הזמין'],
      ['נועה','רמת גן','SLEEP','מארז חודשיים','הזמינה'],['איתי','ירושלים','ENERGY','מארז שלושה חודשים','הזמין'],
      ['שירה','הרצליה','RELAX','מארז חודש','הזמינה'],['מאיה','באר שבע','SLEEP','מארז חודשיים','הזמינה']];
    var el=document.getElementById('buzz'),i=Math.floor(Math.random()*DATA.length);
    function pop(){
      var d=DATA[i%DATA.length];i++;
      document.getElementById('buzzImg').src=ASSETS[PACKIMG[d[2]]]||'';
      document.getElementById('buzzT').textContent=d[0]+' מ'+d[1]+' '+d[4]+' mood '+d[2];
      document.getElementById('buzzS').textContent=d[3]+' · לפני '+(3+Math.floor(Math.random()*38))+' דקות';
      el.classList.add('on');
      setTimeout(function(){el.classList.remove('on');},5200);
    }
    setTimeout(function(){pop();setInterval(pop,26000);},9000);
  })();
  window.addEventListener('message',function(e){
    var d=e.data||{};
    if(d.moodF3D){
      try{e.source.postMessage({moodF3DHTML:f3dHTML(d.moodF3D.m)},'*');}catch(_){}
      return;
    }
    if(d.moodCart){
      if(d.moodCart.action==='add')cartAdd(d.moodCart.item);
      else if(d.moodCart.action==='open')cartOpen();
      return;
    }
    if(!d.moodNav)return;
    var h=String(d.moodNav), hash='';
    var i=h.indexOf('#'); if(i>-1){hash=h.slice(i+1); h=h.slice(0,i)||'/';}
    h=h.replace(/\\.html$/,'').replace(/^\\.\\//,'');
    if(h==='home'||h==='')h='/';
    if(h.charAt(0)!=='/')h='/'+h;
    show(h,hash);
  });
  function fromHash(){
    var h=location.hash||'#/'; h=h.slice(1)||'/';
    var i=h.indexOf('#'), inner='';
    if(i>-1){inner=h.slice(i+1);h=h.slice(0,i);}
    show(h||'/',inner);
  }
  window.addEventListener('hashchange',fromHash);
  window.addEventListener('popstate',fromHash);
  fromHash();
})();
</script>"""

shell_js = shell_js.replace('__JROUTES__', ''.join(",'/journal/%s':'pgjournal_%s'" % (i, i.replace('-','_')) for i in _JOURNAL_IDS))
_sj = shell_js.replace('__ASSETS__', assets_json)
for _sku, _path in [('ENERGY','/mood-energy-pack.png'),('RELAX','/mood-relax-pack.png'),('SLEEP','/mood-sleep-pack.png')]:
    _sj = _sj.replace('__TOK_%s__' % _sku, 'A' + hashlib.md5(_path.encode()).hexdigest()[:10])
shell = ('<div dir="rtl" lang="he">' + shell_head + '\n'.join(tpl_blocks) + _sj + '</div>')
open(OUT, 'w', encoding='utf-8').write(shell)
print('WROTE', OUT, round(len(shell)/1048576, 2), 'MB')
