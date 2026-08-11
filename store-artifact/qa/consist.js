// Step 24: does every page use the same systems and tell the same story?
const { chromium } = require('playwright-core');
const F='file:///home/user/mood-automation/store-artifact/deploy/index.html';
const PAGES=['/','/products','/energy','/relax','/sleep','/ritual','/club','/faq','/policies','/journal'];
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const rows={};
  for(const r of PAGES){
    const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    await p.goto(F+(r==='/'?'':'#'+r),{waitUntil:'load',timeout:120000});
    await p.waitForTimeout(5200);
    const d=await p.evaluate(()=>{
      const f=document.querySelector('iframe'); if(!f) return null;
      const doc=f.contentDocument, txt=doc.body.innerText.replace(/\s+/g,' ');
      const btn=[...doc.querySelectorAll('a,button')].filter(e=>{
        const s=getComputedStyle(e), r=e.getBoundingClientRect();
        return r.width>60&&r.height>28&&(s.backgroundColor!=='rgba(0, 0, 0, 0)'||parseFloat(s.borderTopWidth)>0.5);});
      const radii=[...new Set(btn.map(e=>getComputedStyle(e).borderRadius))];
      const weights=[...new Set(btn.map(e=>getComputedStyle(e).fontWeight))];
      const fs=[...new Set([...doc.querySelectorAll('p,li,span,b,h1,h2,h3,a')]
        .map(e=>getComputedStyle(e).fontSize))].sort((a,c)=>parseFloat(a)-parseFloat(c));
      const prices=[...new Set([...txt.matchAll(/₪\s?(\d{2,4})|(\d{2,4})\s?₪/g)].map(m=>m[1]||m[2]))];
      return {
        header: !!(doc.querySelector('.xnav')||doc.querySelector('nav')),
        footer: !!(doc.querySelector('.ft-inner')||doc.querySelector('footer')),
        radii, weights, sizes: fs.length,
        prices,
        ship: /משלוח חינם[^.]{0,26}/.exec(txt)?.[0]||'—',
        club: /10%[^.]{0,22}/.exec(txt)?.[0]||'—',
        award: txt.includes('השוקולטייר הטוב בעולם'),
        mg700: txt.includes('700 מ״ג'),
      };
    }).catch(()=>null);
    rows[r]=d; await p.close();
  }
  await b.close();
  const pad=(s,n)=>String(s).padEnd(n);
  console.log(pad('page',12), pad('hdr',4), pad('ftr',4), pad('btn-radii',12), pad('btn-wt',10), pad('sizes',6), 'prices');
  for(const [k,v] of Object.entries(rows)){
    if(!v){console.log(pad(k,12),'— could not read —');continue;}
    console.log(pad(k,12), pad(v.header?'yes':'NO',4), pad(v.footer?'yes':'NO',4),
      pad(v.radii.join(','),12), pad(v.weights.join(','),10), pad(v.sizes,6), v.prices.join(' '));
  }
  console.log('\nlanguage:');
  for(const [k,v] of Object.entries(rows)) if(v) console.log(' ', pad(k,12),'ship:',pad(v.ship,30),'club:',pad(v.club,26),'award:',v.award?'y':'-','700mg:',v.mg700?'y':'-');
})();
