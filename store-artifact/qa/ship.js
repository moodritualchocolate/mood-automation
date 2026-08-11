const { chromium } = require('playwright-core');
const F='file:///home/user/mood-automation/store-artifact/deploy/index.html';
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  for(const r of ['/','/energy','/sleep','/club','/journal','/products','/faq']){
    const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    await p.goto(F+(r==='/'?'':'#'+r),{waitUntil:'load',timeout:120000});
    await p.waitForTimeout(5200);
    const x=await p.evaluate(()=>{
      const d=document.querySelector('iframe').contentDocument;
      const t=d.body.innerText.replace(/\s+/g,' ');
      const all=[...t.matchAll(/.{0,34}משלוח חינם.{0,44}/g)].map(m=>m[0].trim());
      const hdr=d.querySelector('header,nav,.xnav,.jh,.topbar');
      return {ship:[...new Set(all)], hdr: hdr?(hdr.tagName+'.'+String(hdr.className).slice(0,18)):'NONE'};
    }).catch(()=>({ship:[],hdr:'?'}));
    console.log('== '+r+'   header: '+x.hdr);
    x.ship.forEach(s=>console.log('    '+s));
    await p.close();
  }
  await b.close();
})();
