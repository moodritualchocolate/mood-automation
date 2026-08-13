/* MOOD Ritual Chocolate — theme.js (generated from mayven.html) */

{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"mood","url":"https://moodritualchocolate.github.io/mood-automation/","logo":"https://moodritualchocolate.github.io/mood-automation/home-assets/logo-black.png","sameAs":["https://www.instagram.com/mood_ritual_chocolate","https://www.tiktok.com/@mood_ritual_chocolate"],"founder":[{"@type":"Person","name":"נדב יצחקי"},{"@type":"Person","name":"מתיאס דומינגז"}]},{"@type":"WebSite","url":"https://moodritualchocolate.github.io/mood-automation/","name":"mood — ritual chocolate","inLanguage":"he-IL"}]}

// ─── script block ───

{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "איך בוחרים בין ENERGY, RELAX ו־SLEEP?", "acceptedAnswer": {"@type": "Answer", "text": "מתחילים מהרגע שרוצים לשנות: ENERGY לבוקר, RELAX למעבר מהיום לערב, ו־SLEEP לפני השינה."}}, {"@type": "Question", "name": "כמה קפאין יש בקובייה?", "acceptedAnswer": {"@type": "Answer", "text": "ב-ENERGY כ-25 מ״ג קפאין טבעי — בערך רבע כוס קפה, בלי הרעד. RELAX ו-SLEEP בלי קפאין."}}, {"@type": "Question", "name": "כמה ביסים במארז?", "acceptedAnswer": {"@type": "Answer", "text": "30 יחידות אישיות ומדודות — חודש שלם של ריטואל."}}, {"@type": "Question", "name": "זה שוקולד או תוסף?", "acceptedAnswer": {"@type": "Answer", "text": "שוקולד פונקציונלי: שוקולד פונקציונלי אמיתי עם פורמולה ממוקדת."}}, {"@type": "Question", "name": "כשר? טבעוני?", "acceptedAnswer": {"@type": "Answer", "text": "כן — כשר פרווה, מתאים גם לטבעונים."}}, {"@type": "Question", "name": "איך עובד המועדון?", "acceptedAnswer": {"@type": "Answer", "text": "משלוח קבוע, מחיר טוב יותר. מדלגים או מבטלים בכל רגע."}}]}

// ─── script block ───


(function(){
  // product card lifestyle-swap every 4s (mimics Mayven's carousel toggle)
  var cards = document.querySelectorAll('.pc');
  if (!cards.length) return;
  var timers = new Map();
  function start(c, i){
    if (timers.has(c)) return;
    var flip = function(){
      c.classList.toggle('hover-life');
      var next = c.classList.contains('hover-life') ? 3200 : 4200;
      timers.set(c, setTimeout(flip, next));
    };
    timers.set(c, setTimeout(flip, 1800 + i*700));
  }
  function stop(c){ if (timers.has(c)) { clearTimeout(timers.get(c)); timers.delete(c); } }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){
      var i = [].indexOf.call(cards, e.target);
      if (e.isIntersecting) start(e.target, i); else stop(e.target);
    }); }, {threshold: .35});
    cards.forEach(function(c){ io.observe(c); });
  } else {
    cards.forEach(function(c,i){ start(c,i); });
  }
})();


// ─── script block ───


(function(){
  document.querySelectorAll('.pc').forEach(function(card){
    const cta = card.querySelector('a.pill-cta[href]');
    if (!cta) return;
    if (card.querySelector('.pc-clickable')) return;
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.className = 'pc-clickable';
    a.setAttribute('aria-label', 'לעמוד המוצר');
    card.appendChild(a);
  });
})();


// ─── script block ───


// v52 — sandbox blocks _top; open cross-artifact links in a new tab (allowed by allow-popups)
(function(){
  document.querySelectorAll('a[href*="claude.ai/code/artifact/"]').forEach(function(a){
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
})();


// ─── script block ───


// AUDIT LIFT WAVE 1 — IntersectionObserver stagger for cards/reviews/faq
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.pc, .rvq, .fq').forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.pc, .p2a-formula, .fdb-ritual, .rvq, .fq, .club, .ritual, h2, .section-head, .founder, article').forEach(el => io.observe(el));
})();


// ─── script block ───


(function(){
  // sticky mobile bar sync
  var tiers = document.querySelectorAll('.tier');
  var smb   = document.querySelector('.smb');
  if (smb && tiers.length){
    var info  = smb.querySelector('.smb-info');
    var cta   = smb.querySelector('a.pill');
    var brand = smb.getAttribute('data-brand') || '';
    function sync(t){
      if (!t) return;
      var name  = t.getAttribute('data-name')  || '';
      var sub   = t.getAttribute('data-sub')   || '';
      var price = t.getAttribute('data-price') || '';
      if (info) info.innerHTML = '<b>' + (brand ? brand + ' · ' : '') + name + '</b><small>' + sub + '</small>';
      if (cta && price) cta.textContent = 'הוסיפי · ₪' + price;
    }
    function selectTier(t){
      if (!t) return;
      tiers.forEach(function(x){
        x.classList.toggle('active', x === t);
        var i = x.querySelector('input[name=tier]');
        if (i) i.checked = (x === t);
      });
      sync(t);
    }
    // Delegate click on the .tiers container so we survive any DOM re-rendering
    var wrap = document.getElementById('tiers') || tiers[0].parentNode;
    if (wrap) wrap.addEventListener('click', function(e){
      var t = e.target && e.target.closest ? e.target.closest('.tier') : null;
      if (!t || !wrap.contains(t)) return;
      selectTier(t);
    });
    // Keep native input change events too, in case JS is disabled or an
    // assistive tech triggers change without a click
    tiers.forEach(function(t){
      var inp = t.querySelector('input[name=tier]');
      if (inp) inp.addEventListener('change', function(){ if (inp.checked) selectTier(t); });
    });
    sync(document.querySelector('.tier.active') || tiers[0]);
  }

  // mobile drawer wire-up (works on all pages that include mMenu + hamburger)
  var btn  = document.querySelector('header .hactions button.ic[aria-label="תפריט"]');
  var menu = document.getElementById('mMenu');
  if (btn && menu){
    var closeBtn = menu.querySelector('.m-menu-close');
    function open(){ menu.classList.add('open'); menu.setAttribute('aria-hidden','false'); document.body.classList.add('m-open'); }
    function close(){ menu.classList.remove('open'); menu.setAttribute('aria-hidden','true'); document.body.classList.remove('m-open'); }
    btn.addEventListener('click', function(e){ e.preventDefault(); open(); });
    menu.addEventListener('click', function(e){ if (e.target === menu) close(); });
    if (closeBtn) closeBtn.addEventListener('click', function(e){ e.preventDefault(); close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && menu.classList.contains('open')) close(); });
    menu.querySelectorAll('a[href]').forEach(function(a){ a.addEventListener('click', close); });
  }
})();


// ─── script block ───


/* WAVE18-JS-START — center-on-load for homepage carousels + dot sync */
(function(){
  if (window.matchMedia && !window.matchMedia('(max-width: 899px)').matches) return;

  function centerCard(container, target) {
    if (!container || !target) return;
    var cLeft = container.getBoundingClientRect().left;
    var tRect = target.getBoundingClientRect();
    var targetCenter = tRect.left + tRect.width / 2;
    var containerCenter = cLeft + container.clientWidth / 2;
    var delta = targetCenter - containerCenter;
    container.scrollLeft += delta;
  }

  function initProducts() {
    var wrap = document.querySelector('.pgrid.pgrid-w5');
    if (!wrap) return;
    var cards = wrap.querySelectorAll('.pc');
    if (!cards.length) return;
    // ENERGY is the first card in source order — center it on load.
    // In RTL flex/grid the natural start is the RTL start, so we still
    // need to explicitly center it to be robust across browsers.
    requestAnimationFrame(function(){ centerCard(wrap, cards[0]); });

    var dots = document.querySelectorAll('.pgrid-dots .dot');
    if (!dots.length) return;
    // Click a dot → smooth-center the matching card
    dots.forEach(function(d, i){
      d.addEventListener('click', function(){
        var c = cards[i]; if (!c) return;
        c.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'});
      });
    });
    // Scroll → sync active dot to whichever card is closest to center
    var syncing;
    wrap.addEventListener('scroll', function(){
      clearTimeout(syncing);
      syncing = setTimeout(function(){
        var containerCenter = wrap.getBoundingClientRect().left + wrap.clientWidth / 2;
        var best = 0, bestDist = 1e9;
        cards.forEach(function(c, i){
          var r = c.getBoundingClientRect();
          var d = Math.abs((r.left + r.width/2) - containerCenter);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        dots.forEach(function(d, i){ d.classList.toggle('on', i === best); });
      }, 80);
    }, {passive: true});
  }

  function initMoments() {
    var strip = document.querySelector('.moments-strip');
    if (!strip) return;
    var active = strip.querySelector('.mom-active') || strip.children[Math.floor(strip.children.length/2)];
    requestAnimationFrame(function(){ centerCard(strip, active); });
  }

  function initReviews() {
    var rc = document.querySelector('.moments .rev-cards');
    if (!rc) return;
    var cards = rc.querySelectorAll('.rev-card');
    if (!cards.length) return;
    requestAnimationFrame(function(){ centerCard(rc, cards[0]); });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function(){ initProducts(); initMoments(); initReviews(); }, 0);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      initProducts(); initMoments(); initReviews();
    });
  }
  // On resize between breakpoints, re-center
  var reCenter = function(){ initProducts(); initMoments(); initReviews(); };
  window.addEventListener('orientationchange', reCenter);
})();
/* WAVE18-JS-END */


// ─── script block ───


/* WAVE18-JS-START — center-on-load for homepage carousels + dot sync */
(function(){
  if (window.matchMedia && !window.matchMedia('(max-width: 899px)').matches) return;

  function centerCard(container, target) {
    if (!container || !target) return;
    var cLeft = container.getBoundingClientRect().left;
    var tRect = target.getBoundingClientRect();
    var targetCenter = tRect.left + tRect.width / 2;
    var containerCenter = cLeft + container.clientWidth / 2;
    var delta = targetCenter - containerCenter;
    container.scrollLeft += delta;
  }

  function initProducts() {
    var wrap = document.querySelector('.pgrid.pgrid-w5');
    if (!wrap) return;
    var cards = wrap.querySelectorAll('.pc');
    if (!cards.length) return;
    // ENERGY is the first card in source order — center it on load.
    // In RTL flex/grid the natural start is the RTL start, so we still
    // need to explicitly center it to be robust across browsers.
    requestAnimationFrame(function(){ centerCard(wrap, cards[0]); });

    var dots = document.querySelectorAll('.pgrid-dots .dot');
    if (!dots.length) return;
    // Click a dot → smooth-center the matching card
    dots.forEach(function(d, i){
      d.addEventListener('click', function(){
        var c = cards[i]; if (!c) return;
        c.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'});
      });
    });
    // Scroll → sync active dot to whichever card is closest to center
    var syncing;
    wrap.addEventListener('scroll', function(){
      clearTimeout(syncing);
      syncing = setTimeout(function(){
        var containerCenter = wrap.getBoundingClientRect().left + wrap.clientWidth / 2;
        var best = 0, bestDist = 1e9;
        cards.forEach(function(c, i){
          var r = c.getBoundingClientRect();
          var d = Math.abs((r.left + r.width/2) - containerCenter);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        dots.forEach(function(d, i){ d.classList.toggle('on', i === best); });
      }, 80);
    }, {passive: true});
  }

  function initMoments() {
    var strip = document.querySelector('.moments-strip');
    if (!strip) return;
    var active = strip.querySelector('.mom-active') || strip.children[Math.floor(strip.children.length/2)];
    requestAnimationFrame(function(){ centerCard(strip, active); });
  }

  function initReviews() {
    var rc = document.querySelector('.moments .rev-cards');
    if (!rc) return;
    var cards = rc.querySelectorAll('.rev-card');
    if (!cards.length) return;
    requestAnimationFrame(function(){ centerCard(rc, cards[0]); });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function(){ initProducts(); initMoments(); initReviews(); }, 0);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      initProducts(); initMoments(); initReviews();
    });
  }
  // On resize between breakpoints, re-center
  var reCenter = function(){ initProducts(); initMoments(); initReviews(); };
  window.addEventListener('orientationchange', reCenter);
})();
/* WAVE18-JS-END */


// ─── script block ───


/* WAVE19-JS-START — moments center-tile detection + FAQ progressive disclosure */
(function(){
  // -------- Moments strip: keep .mom-active on the tile closest to center --------
  var strip = document.querySelector('.moments-strip');
  if (strip && window.matchMedia && window.matchMedia('(max-width: 899px)').matches) {
    var tiles = strip.querySelectorAll('.mom-tile');
    if (tiles.length) {
      var syncing = 0;
      function centerActive() {
        var stripRect = strip.getBoundingClientRect();
        var containerCenter = stripRect.left + strip.clientWidth / 2;
        var best = null, bestDist = 1e9;
        tiles.forEach(function(t){
          var r = t.getBoundingClientRect();
          var d = Math.abs((r.left + r.width/2) - containerCenter);
          if (d < bestDist) { bestDist = d; best = t; }
        });
        tiles.forEach(function(t){ t.classList.toggle('mom-active', t === best); });
      }
      strip.addEventListener('scroll', function(){
        clearTimeout(syncing);
        syncing = setTimeout(centerActive, 60);
      }, {passive: true});
      // Also trigger once shortly after load so any auto-centering call finishes first
      setTimeout(centerActive, 120);
      setTimeout(centerActive, 400);
    }
  }

  // -------- FAQ progressive disclosure --------
  var faq = document.querySelector('.faq-w5');
  if (faq) {
    var items = faq.querySelectorAll('.faq-item');
    if (items.length > 4) {
      // Mark items 5+ as "faq-more" so CSS hides them by default
      for (var i = 4; i < items.length; i++) items[i].classList.add('faq-more');
      // Inject a toggle button after item[3]
      var btn = document.createElement('button');
      btn.className = 'faq-more-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      var count = items.length - 4;
      btn.innerHTML = '<span class="label">הציגו שאלות נוספות</span> <span class="arr" aria-hidden="true">↓</span>';
      // Insert after the 4th item
      items[3].parentNode.insertBefore(btn, items[3].nextSibling);
      btn.addEventListener('click', function(){
        var expanded = faq.classList.toggle('faq-expanded');
        btn.setAttribute('aria-expanded', String(expanded));
        btn.querySelector('.label').textContent = expanded ? 'הציגו פחות' : 'הציגו שאלות נוספות';
        // Scroll button back into view if it moved
        if (!expanded) {
          setTimeout(function(){ btn.scrollIntoView({behavior:'smooth', block:'center'}); }, 60);
        }
      });
    }
  }
})();
/* WAVE19-JS-END */


// ─── script block ───


/* WAVE20-JS-START — media Play interaction */
(function(){
  var strip = document.querySelector('.moments-strip');
  if (!strip) return;
  // Only the tile whose img is `mood-hero-three-moments.jpg` gets a real video.
  var videoTile = strip.querySelector('.mom-tile .mom-play');
  if (!videoTile) return;
  var tile = videoTile.closest('.mom-tile');
  if (!tile) return;

  tile.addEventListener('click', function(e){
    // ignore if this is triggered by a swipe (small movement) — we let the
    // native click fire only on genuine taps
    if (tile.classList.contains('mom-playing')) return;
    // Only play if the tile is the currently centered one — avoids
    // accidental plays during horizontal drags
    var isActive = tile.classList.contains('mom-active');
    if (!isActive) return;

    // Inject a <video> that plays inline
    var v = document.createElement('video');
    v.className = 'mom-video';
    v.src = 'home-assets/cx/hero-mobile.mp4';
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.muted = true; // required for autoplay on iOS
    v.controls = true;
    tile.appendChild(v);
    tile.classList.add('mom-playing');
    v.addEventListener('ended', function(){ tile.classList.remove('mom-playing'); v.remove(); });
    e.preventDefault();
  });
})();
/* WAVE20-JS-END */


// ─── script block ───


/* WAVE22-JS-START — video Play attaches to active center tile */
(function(){
  var strip = document.querySelector('.moments-strip');
  if (!strip) return;
  var tiles = strip.querySelectorAll('.mom-tile');
  if (!tiles.length) return;

  // Collect and remove any inline .mom-play markup — we manage one shared node.
  var play = strip.querySelector('.mom-play');
  if (!play) {
    play = document.createElement('span');
    play.className = 'mom-play';
    play.setAttribute('aria-hidden', 'true');
    play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.55.83l10-6.5a1 1 0 0 0 0-1.66l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>';
  } else if (play.parentNode) {
    play.parentNode.removeChild(play);
  }

  function moveToActive() {
    var active = strip.querySelector('.mom-tile.mom-active');
    if (!active) return;
    if (play.parentNode !== active) {
      active.appendChild(play);
    }
  }

  // Move immediately, and again after any active-class change from other JS.
  moveToActive();
  var mo = new MutationObserver(moveToActive);
  tiles.forEach(function(t){ mo.observe(t, {attributes:true, attributeFilter:['class']}); });
  strip.addEventListener('scroll', function(){
    setTimeout(moveToActive, 80);
  }, {passive: true});
  window.addEventListener('load', moveToActive);
})();
/* WAVE22-JS-END */


// ─── script block ───


/* WAVE22-JS-START — video Play attaches to active center tile */
(function(){
  var strip = document.querySelector('.moments-strip');
  if (!strip) return;
  var tiles = strip.querySelectorAll('.mom-tile');
  if (!tiles.length) return;

  // Collect and remove any inline .mom-play markup — we manage one shared node.
  var play = strip.querySelector('.mom-play');
  if (!play) {
    play = document.createElement('span');
    play.className = 'mom-play';
    play.setAttribute('aria-hidden', 'true');
    play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.55.83l10-6.5a1 1 0 0 0 0-1.66l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>';
  } else if (play.parentNode) {
    play.parentNode.removeChild(play);
  }

  function moveToActive() {
    var active = strip.querySelector('.mom-tile.mom-active');
    if (!active) return;
    if (play.parentNode !== active) {
      active.appendChild(play);
    }
  }

  // Move immediately, and again after any active-class change from other JS.
  moveToActive();
  var mo = new MutationObserver(moveToActive);
  tiles.forEach(function(t){ mo.observe(t, {attributes:true, attributeFilter:['class']}); });
  strip.addEventListener('scroll', function(){
    setTimeout(moveToActive, 80);
  }, {passive: true});
  window.addEventListener('load', moveToActive);

  // Delegated tap: only the currently-active tile launches the video.
  strip.addEventListener('click', function(e){
    var tile = e.target && e.target.closest && e.target.closest('.mom-tile');
    if (!tile || !tile.classList.contains('mom-active')) return;
    if (tile.classList.contains('mom-playing')) return;
    if (tile.querySelector('video.mom-video')) return;
    var v = document.createElement('video');
    v.className = 'mom-video';
    v.src = 'home-assets/cx/hero-mobile.mp4';
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.muted = true;
    v.controls = true;
    tile.appendChild(v);
    tile.classList.add('mom-playing');
    v.addEventListener('ended', function(){
      tile.classList.remove('mom-playing');
      v.remove();
    });
    e.preventDefault();
  });
})();
/* WAVE22-JS-END */


// ─── script block ───


/* WAVE25-JS-START — restore .shine trigger on chocolatier strip */
(function(){
  var el = document.querySelector('.tb-title-text');
  if (!el) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) { el.classList.add('shine'); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) {
        // Delay slightly so the shimmer reads once the section is settled.
        setTimeout(function(){ el.classList.add('shine'); }, 260);
        io.disconnect();
      }
    });
  }, { threshold: 0.35 });
  io.observe(el);
})();
/* WAVE25-JS-END */
