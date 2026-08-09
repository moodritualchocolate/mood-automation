(function(){
  'use strict';
  var q=function(s,r){return (r||document).querySelector(s)};
  var qa=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function dedupeManualGallery(){
    var buttons=qa('#thumbs button'), dots=q('#dots'), main=q('#galmain');
    if(!buttons.length||!dots)return;
    while(dots.children.length>buttons.length)dots.removeChild(dots.lastElementChild);
    while(dots.children.length<buttons.length){var s=document.createElement('span');dots.appendChild(s);}
    qa('span',dots).forEach(function(dot,i){dot.setAttribute('role','button');dot.setAttribute('aria-label','תמונה '+(i+1)+' מתוך '+buttons.length);dot.tabIndex=0;dot.onclick=function(){buttons[i].click()};dot.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();buttons[i].click();}}});
    /* Deliberately manual: the strongest lifestyle image stays in place until
       the shopper swipes or taps a thumbnail. This keeps product context stable. */
  }

  function addTrust(){
    var rate=q('.buy .rate');if(!rate||q('.conversion-trust'))return;
    var row=document.createElement('div');row.className='conversion-trust';
    ['משלוח מהיר בישראל','תשלום מאובטח','כשר פרווה','ביטול מנוי בכל עת'].forEach(function(t){var s=document.createElement('span');s.textContent=t;row.appendChild(s)});
    rate.insertAdjacentElement('afterend',row);
  }

  function markDemoReviews(){
    var reviews=q('#reviews');if(!reviews)return;
    qa('.vf',reviews).forEach(function(el){el.textContent='תצוגת דוגמה'});
    qa('.by',reviews).forEach(function(el){el.textContent=el.textContent.replace(/מאומתת?|verified/ig,'תוכן הדגמה')});
    var rateLink=q('.rate a');if(rateLink)rateLink.textContent='תצוגת ביקורות';
    if(!q('.demo-review-note',reviews)){
      var n=document.createElement('div');n.className='demo-review-note';n.textContent='הביקורות מוצגות להמחשת חוויית העמוד ויוחלפו בביקורות לקוחות מאומתות לפני ההשקה.';
      var anchor=q('.rtop',reviews)||reviews.firstElementChild;anchor.insertAdjacentElement('afterend',n);
    }
  }

  function stickyPurchase(){
    var cta=q('.cta'), bar=q('.stickybar'), sticky=q('.sb-cta');if(!cta||!bar||!sticky)return;
    sticky.addEventListener('click',function(){cta.click()});
    if('IntersectionObserver'in window){new IntersectionObserver(function(e){document.body.classList.toggle('purchase-sticky-on',!e[0].isIntersecting)},{threshold:.55}).observe(cta)}
  }

  function demoCart(){
    var buttons=qa('.cta,.sb-cta');if(!buttons.length)return;
    var toast=document.createElement('div');toast.className='cart-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.textContent='המארז נוסף לסל ההדגמה';document.body.appendChild(toast);
    buttons.forEach(function(btn){btn.addEventListener('click',function(){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'add_to_cart_preview',product:(q('.buy h1')||{}).textContent||'MOOD'});toast.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(function(){toast.classList.remove('on')},2200)})});
    qa('.pack').forEach(function(p){p.addEventListener('click',function(){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'select_pack',pack:p.dataset.name||''})})});
    var sub=q('#subcheck');if(sub)sub.addEventListener('change',function(){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'select_subscription',selected:sub.checked})});
  }

  function policies(){
    qa('footer a').forEach(function(a){var t=(a.textContent||'').trim();if(/משלוחים/.test(t))a.href='/policies.html#shipping';else if(/החזרות/.test(t))a.href='/policies.html#returns';else if(/פרטיות/.test(t))a.href='/policies.html#privacy';else if(/תקנון|תנאים/.test(t))a.href='/policies.html#terms';else if(/נגישות/.test(t))a.href='/policies.html#accessibility';});
  }

  function metadata(){
    var h=(q('.buy h1')||{}).textContent||'MOOD';document.title=h.trim()+' · MOOD Ritual Chocolate';
    var main=q('#mainimg');if(main){main.setAttribute('aria-live','polite');main.decoding='async';}
  }

  function directNavigation(){
    qa('.links a[href="/#formulas"]').forEach(function(a){a.href='#formula'});
  }

  function init(){dedupeManualGallery();addTrust();markDemoReviews();stickyPurchase();demoCart();policies();metadata();directNavigation();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
