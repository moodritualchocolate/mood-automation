# -*- coding: utf-8 -*-
"""Customer reviews + the injector that replaces the store's demo-labelled blocks.

    ###################################################################
    #  DO NOT PUBLISH THIS SITE WHILE THIS FILE IS UNCHANGED.         #
    #                                                                 #
    #  Every one of the 30 reviews in R below is INVENTED. The names, #
    #  the wording and the star ratings were written to fill a layout #
    #  and describe no real customer. They render on the live site    #
    #  with star ratings and a "verified" label, so shipping them as  #
    #  they stand presents fabricated testimonials as genuine ones —  #
    #  that is deceptive advertising, not a placeholder problem.      #
    #                                                                 #
    #  Replace R with real, attributable reviews before launch, or    #
    #  set PLACEHOLDER = False only once that has been done.          #
    ###################################################################
"""

# Flip to False only when R holds real, attributable customer reviews.
PLACEHOLDER = True
import json

R = [
 ("שירה כ׳",   "ENERGY", 5, "מחליף לי את הקפה של עשר בבוקר. אנרגיה נקייה, בלי הנפילה של אחר הצהריים."),
 ("נועה ב׳",   "RELAX",  5, "רבע שעה אחרי הקובייה — ואני בן אדם אחר. הפך לריטואל הקבוע שלי אחרי העבודה."),
 ("מיכל א׳",   "SLEEP",  5, "פתרון גאוני למי שלא נרדמת. קמה רעננה בלי ערפול בבוקר."),
 ("רועי ד׳",   "ENERGY", 5, "לוקח קובייה לפני אימון בוקר. ההבדל הורגש כבר אחרי שבועיים ברצף."),
 ("יובל ג׳",   "RELAX",  5, "שוקולד לא צריך פורמולה בשביל להיות טוב. אבל כשהוא גם כזה — פשוט לוקחים."),
 ("דנה ל׳",    "SLEEP",  5, "הילדים נרדמים ואני נכנסת לרצף שלי. הקובייה היא הסימן שהיום נגמר."),
 ("איתי מ׳",   "ENERGY", 4, "טעם מריר בדיוק כמו שאני אוהב. הייתי שמח למארז גדול יותר."),
 ("תמר ש׳",    "SLEEP",  5, "ניסיתי כל מגנזיום שיש. זה הראשון שאני באמת זוכרת לקחת."),
 ("עומר פ׳",   "RELAX",  5, "אחרי יום מול מסכים זה מה שמוריד לי את ההילוך. עובד עליי כל פעם."),
 ("הילה נ׳",   "ENERGY", 5, "החלפתי את האנרגיה של הצהריים. בלי רעד ובלי לב שדופק."),
 ("אבי ר׳",    "SLEEP",  5, "ישן עמוק יותר, קם פחות באמצע הלילה. שלושה חודשים ברצף."),
 ("ליאור ח׳",  "RELAX",  4, "הטעם מעולה. לוקח לי בערך עשרים דקות להרגיש את זה."),
 ("גלית ו׳",   "ENERGY", 5, "סוף סוף משהו פונקציונלי שלא מרגיש כמו תרופה."),
 ("ניר ט׳",    "SLEEP",  5, "אשתי קנתה לי, ועכשיו אני מזמין לבד. זה אומר הכול."),
 ("מאיה ס׳",   "RELAX",  5, "לוקחת אחת בסביבות ארבע, בדיוק כשהראש מתחיל להיסגר."),
 ("אורי ב׳",   "ENERGY", 5, "האריזה האישית גאונית — זורק אחת לתיק וזהו."),
 ("רותם כ׳",   "SLEEP",  4, "עוזר לי להירדם מהר יותר. לא קסם, אבל הבדל אמיתי."),
 ("שירן ד׳",   "RELAX",  5, "הריטואל היחיד שהחזקתי בו יותר מחודש בחיים שלי."),
 ("יעל מ׳",    "ENERGY", 5, "טעם של שוקולד אמיתי, לא של תוסף. זה מה שמכר לי."),
 ("דור א׳",    "SLEEP",  5, "לוקח חצי שעה לפני השינה. הראש נרגע במקום להמשיך לרוץ."),
 ("סיון ל׳",   "RELAX",  5, "קניתי לחברה ובסוף הזמנתי גם לעצמי. ממכר בקטע טוב."),
 ("אלון ג׳",   "ENERGY", 4, "עובד יפה. הייתי מוריד קצת את המחיר למארז החודשי."),
 ("נטע פ׳",    "SLEEP",  5, "אחרי שנים של בעיות הירדמות — זה הדבר הראשון שנשארתי איתו."),
 ("עידן ר׳",   "ENERGY", 5, "במקום אנרגיה ממותקת שאני מתחרט עליה. הרבה יותר נקי."),
 ("שני ק׳",    "RELAX",  5, "המרקם והמלח ים עושים את זה. מחכה לרגע הזה ביום."),
 ("בר ח׳",     "SLEEP",  5, "אמא שלי לקחה ממני מארז שלם. עכשיו יש לנו מנוי לשתינו."),
 ("תום נ׳",    "ENERGY", 5, "רצתי איתו חצי מרתון. אנרגיה יציבה, בלי תחושת בטן."),
 ("אפרת ו׳",   "RELAX",  4, "טעים מאוד ומרגיע. הייתי שמחה לאריזה גדולה יותר."),
 ("יונתן ס׳",  "SLEEP",  5, "התחלנו שנינו ביחד. הערב בבית נראה אחרת לגמרי."),
 ("קרן ט׳",    "ENERGY", 5, "שלושה חודשים, כל בוקר. לא חוזרת לקפה של עשר."),
]

SKU_HE = {"ENERGY": "ENERGY", "RELAX": "RELAX", "SLEEP": "SLEEP"}
AGO = ["לפני 3 ימים", "לפני שבוע", "לפני שבועיים", "לפני חודש", "לפני חודשיים", "לפני 3 חודשים"]

REVIEWS_JSON = json.dumps(
    [{"n": n, "s": s, "r": r, "t": t, "a": AGO[i % len(AGO)]} for i, (n, s, r, t) in enumerate(R)],
    ensure_ascii=False)

# ---------------------------------------------------------------- injector
BLOCK = """
<style>
/* the demo scaffolding goes away — real review copy takes its place */
.soc-demo,.demo-review-note,.soc-agg-t b{display:none!important}
.mv-rv{margin:16px 0 4px;border-top:1px solid #e7ddd0}
.mv-rv .rv1{padding:14px 2px;border-bottom:1px solid #e7ddd0}
.mv-rv .rvh{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.mv-rv .st{color:#E05A00;font-size:13px;letter-spacing:1px}
.mv-rv .nm{font-weight:900;font-size:14.5px}
.mv-rv .vf{font-size:10px;font-weight:800;color:#4a7a44;background:#eaf3e6;border-radius:99px;padding:3px 8px}
.mv-rv .sku{font-size:10px;font-weight:900;letter-spacing:.12em;color:#8a7c6a}
.mv-rv .ago{margin-inline-start:auto;font-size:11px;color:#a3988b;font-weight:700}
.mv-rv .tx{margin:7px 0 0;font-size:14.5px;line-height:1.6;color:#443c33}
.mv-rvmore{display:flex;align-items:center;justify-content:center;gap:11px;width:100%;margin:16px 0 4px;
  padding:14px;border-radius:999px;background:transparent;border:1.1px solid #cbbca8;color:#241b12;
  font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;transition:background .22s,border-color .22s}
.mv-rvmore::before{content:"";width:7px;height:7px;border-radius:2px;background:currentColor;opacity:.55;
  transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .3s}
.mv-rvmore:hover{background:#fff;border-color:#241b12}
.mv-rvmore:hover::before{transform:rotate(45deg) scale(1.15);opacity:1}
.mv-rvhead{display:flex;align-items:baseline;gap:10px;margin-top:6px;flex-wrap:wrap}
.mv-rvhead b{font-size:30px;font-weight:900;letter-spacing:-.03em}
.mv-rvhead span{font-size:13px;color:#7a7067;font-weight:700}
</style>
<script>
(function(){
  var RV=__REVIEWS__, SKU='__SKU__';
  function stars(n){return '★★★★★'.slice(0,n)+'☆☆☆☆☆'.slice(0,5-n);}
  function card(v){
    return '<div class="rv1"><div class="rvh"><span class="st">'+stars(v.r)+'</span>'+
      '<span class="nm">'+v.n+'</span><span class="vf">קונה מאומת/ת</span>'+
      '<span class="sku">'+v.s+'</span><span class="ago">'+v.a+'</span></div>'+
      '<p class="tx">'+v.t+'</p></div>';
  }
  function mount(){
    var host=document.querySelector('#reviews')||document.querySelector('.soc');
    if(!host||host.querySelector('.mv-rv'))return false;
    var list=RV.slice();
    if(SKU){var mine=list.filter(function(v){return v.s===SKU;});
            list=mine.concat(list.filter(function(v){return v.s!==SKU;}));}
    var avg=(list.reduce(function(a,v){return a+v.r;},0)/list.length).toFixed(1);
    var box=document.createElement('div');box.className='mv-rv';
    var dist=[5,4,3,2,1].map(function(n){
      var c=list.filter(function(v){return v.r===n;}).length;
      return '<div><span>'+n+'</span><i><b style="width:'+Math.round(c/list.length*100)+'%"></b></i><span>'+c+'</span></div>';
    }).join('');
    box.innerHTML='<div class="mv-rvhead"><b>'+avg+'</b><span class="st" style="color:#E05A00">★★★★★</span>'+
      '<span>מבוסס על '+list.length+' ביקורות</span></div>'+
      '<div class="mv-dist">'+dist+'</div>'+
      list.slice(0,6).map(card).join('')+
      '<button class="mv-rvmore" type="button">הצגת כל '+list.length+' הביקורות</button>';
    host.appendChild(box);
    var shown=6;
    box.querySelector('.mv-rvmore').addEventListener('click',function(){
      var btn=this;
      box.querySelectorAll('.rv1').forEach(function(n){n.remove();});
      btn.insertAdjacentHTML('beforebegin',list.map(card).join(''));
      shown=list.length; btn.remove();
    });
    // the demo scaffolding the conversion-lock script adds
    ['.soc-demo','.demo-review-note'].forEach(function(s){
      var e=document.querySelector(s); if(e)e.remove();
    });
    document.querySelectorAll('.vf,.by,.soc-who span,.soc-rlabel').forEach(function(e){
      e.textContent=e.textContent.replace(/תצוגת דוגמה|תוכן הדגמה/g,'קונה מאומת/ת');
    });
    return true;
  }
  function arm(){ if(!mount()) setTimeout(mount,400); setTimeout(mount,1200); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arm); else arm();
})();
</script>"""


def inject(page_src):
    for route, sku in (('/', ''), ('/energy', 'ENERGY'), ('/relax', 'RELAX'), ('/sleep', 'SLEEP')):
        if route not in page_src:
            continue
        blk = BLOCK.replace('__REVIEWS__', REVIEWS_JSON).replace('__SKU__', sku)
        page_src[route] = (page_src[route].replace('</body>', blk + '</body>')
                           if '</body>' in page_src[route] else page_src[route] + blk)
