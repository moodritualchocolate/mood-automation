(function(){
  document.body.classList.add('journal-article');
  var article = document.querySelector('.jpost');
  var prose = document.querySelector('.jprose');
  if (!article || !prose) return;

  var bar = document.createElement('div');
  bar.className = 'journal-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<span></span>';
  document.body.appendChild(bar);
  var fill = bar.firstElementChild;
  function updateProgress(){
    var rect = article.getBoundingClientRect();
    var total = Math.max(1, article.offsetHeight - window.innerHeight);
    var passed = Math.min(total, Math.max(0, -rect.top));
    fill.style.width = (passed / total * 100) + '%';
  }
  window.addEventListener('scroll', updateProgress, {passive:true});
  window.addEventListener('resize', updateProgress);
  updateProgress();

  var headings = prose.querySelectorAll('h3');
  if (!headings.length) return;
  var nav = document.createElement('nav');
  nav.className = 'journal-toc';
  nav.setAttribute('aria-label', 'תוכן הכתבה');
  var list = document.createElement('ol');
  headings.forEach(function(heading, index){
    if (!heading.id) heading.id = 'section-' + (index + 1);
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = '#' + heading.id;
    link.textContent = heading.textContent;
    item.appendChild(link);
    list.appendChild(item);
  });
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span>מה בכתבה</span><span aria-hidden="true">⌄</span>';
  toggle.addEventListener('click', function(){
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.appendChild(toggle);
  nav.appendChild(list);
  prose.parentNode.insertBefore(nav, prose);
})();
