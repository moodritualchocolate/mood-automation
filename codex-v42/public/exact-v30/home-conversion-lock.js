(function(){
  'use strict';
  function q(selector,root){return (root||document).querySelector(selector)}
  function qa(selector,root){return [].slice.call((root||document).querySelectorAll(selector))}

  function markReviews(){
    var section=q('#reviews');
    if(!section)return;
    var aggregate=q('.soc-agg-t',section);
    if(aggregate)aggregate.innerHTML='<b>תצוגת ביקורות</b> · מבנה להמחשה לפני חיבור ביקורות מאומתות';
    if(!q('.soc-demo',section)){
      var note=document.createElement('div');
      note.className='soc-demo';
      note.textContent='תוכן הדגמה עד לחיבור ביקורות לקוחות מאומתות.';
      section.appendChild(note);
    }
    qa('.soc-who span',section).forEach(function(item){
      item.textContent=item.textContent.replace(/לקוח(?:ה)? מאומת(?:ת)?/g,'תוכן הדגמה');
    });
  }

  function upgradeCards(){
    qa('#products iframe').forEach(function(frame){
      function bind(){
        var frameDocument;
        try{frameDocument=frame.contentDocument}catch(error){return}
        if(!frameDocument)return;
        qa('.card',frameDocument).forEach(function(card){
          card.classList.remove('show-lifestyle');
          card.addEventListener('mouseenter',function(){card.classList.add('show-lifestyle')});
          card.addEventListener('mouseleave',function(){card.classList.remove('show-lifestyle')});
          card.addEventListener('focusin',function(){card.classList.add('show-lifestyle')});
          card.addEventListener('focusout',function(){card.classList.remove('show-lifestyle')});
        });
      }
      frame.addEventListener('load',bind);
      bind();
    });
  }

  function policies(){
    qa('footer a').forEach(function(link){
      var text=(link.textContent||'').trim();
      if(/משלוחים/.test(text))link.href='/policies.html#shipping';
      else if(/החזרות/.test(text))link.href='/policies.html#returns';
      else if(/פרטיות/.test(text))link.href='/policies.html#privacy';
      else if(/תקנון|תנאים/.test(text))link.href='/policies.html#terms';
      else if(/נגישות/.test(text))link.href='/policies.html#accessibility';
    });
  }

  function conversionStory(){
    var heroTitle=q('.rh-h');
    var heroSub=q('.rh-sub');
    var heroEye=q('.rh-eyebrow');
    var heroPrimary=q('.rh-btn-primary');
    if(heroEye)heroEye.textContent='שנה וחצי של פיתוח';
    if(heroTitle)heroTitle.textContent='הביס שמשנה את הרגע.';
    if(heroSub){heroSub.textContent='';heroSub.setAttribute('aria-hidden','true')}
    if(heroPrimary){heroPrimary.textContent='לרכישה עכשיו';heroPrimary.setAttribute('aria-label','לרכישת Energy, Relax או Sleep')}
    var heroSecondary=q('.rh-btn-ghost');
    if(heroSecondary){heroSecondary.hidden=true;heroSecondary.setAttribute('aria-hidden','true')}

    var formula=q('.master-proof__formula');
    if(formula)formula.remove();
    var masterTitle=q('.master-proof__content>h2');
    if(masterTitle)masterTitle.innerHTML='אלוף עולם.<br>משימה בלתי אפשרית.';
    var masterLead=q('.master-proof__lead');
    if(masterLead)masterLead.textContent='רונן אפללו קיבל משימה כמעט בלתי אפשרית: לחבר פורמולות עוצמתיות לשוקולד בריא, בלי להתפשר על הטעם. אחרי שנה וחצי של פיתוח, אלוף העולם בשוקולד יצר עבורנו ביס מדויק שפשוט רוצים לאכול.';
    var masterEye=q('.master-proof__eyebrow');
    if(masterEye)masterEye.textContent='THE IMPOSSIBLE BRIEF · RONEN AFLALO';

    var reviewTitle=q('.soc-h');
    if(reviewTitle)reviewTitle.textContent='ביס שטעים לחזור אליו.';

    var clubEye=q('.club-eyebrow');
    var clubTitle=q('.club-h');
    var clubSub=q('.club-sub');
    var clubBenefits=q('.club-benes');
    var clubCta=q('.club-cta');
    if(clubEye)clubEye.textContent='MOOD CLUB';
    if(clubTitle)clubTitle.textContent='הריטואל שמגיע עד אליכם.';
    if(clubSub)clubSub.textContent='הקופסה החודשית שלכם, במחיר חבר קבוע ובמשלוח חינם.';
    if(clubBenefits)clubBenefits.innerHTML='<li>מחיר חבר קבוע</li><li>משלוח חינם</li><li>מדלגים או מבטלים בקליק</li>';
    if(clubCta)clubCta.textContent='הצטרפו למועדון';

    var menu=qa('.xnav-menu>a');
    ['energy.html','relax.html','sleep.html'].forEach(function(href,index){if(menu[index])menu[index].href=href});
    qa('a[href="#formulas"]').forEach(function(link){link.href='#story'});
  }

  function chocolatierDepth(){
    var card=q('.master-proof');
    if(!card||!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return;
    card.addEventListener('pointermove',function(event){
      var rect=card.getBoundingClientRect();
      var x=(event.clientX-rect.left)/rect.width-.5;
      var y=(event.clientY-rect.top)/rect.height-.5;
      card.style.setProperty('--rx',(-y*4).toFixed(2)+'deg');
      card.style.setProperty('--ry',(x*5).toFixed(2)+'deg');
      card.style.setProperty('--mx',(50+x*8).toFixed(1)+'%');
      card.style.setProperty('--my',(50+y*8).toFixed(1)+'%');
    });
    card.addEventListener('pointerleave',function(){
      card.style.setProperty('--rx','0deg');
      card.style.setProperty('--ry','0deg');
      card.style.setProperty('--mx','50%');
      card.style.setProperty('--my','50%');
    });
  }

  function init(){
    markReviews();
    upgradeCards();
    policies();
    conversionStory();
    chocolatierDepth();
    document.title='MOOD · Ritual Chocolate';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
