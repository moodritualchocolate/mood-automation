// Every real button on every route: is the system actually one system?
const { chromium } = require('playwright-core');
const F='file://'+(process.env.TARGET||'/home/user/mood-automation/store-artifact/deploy/index.html');
const R=['/','/products','/energy','/relax','/sleep','/ritual','/club','/faq','/policies','/journal'];
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  const all=[];
  for(const r of R){
    const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    await p.goto(F+(r==='/'?'':'#'+r),{waitUntil:'load',timeout:120000});
    await p.waitForTimeout(5200);
    for(const f of p.frames()){
      const x=await f.evaluate(()=>{
        const out=[];
        document.querySelectorAll('a,button,[role=button]').forEach(e=>{
          const s=getComputedStyle(e), b=e.getBoundingClientRect();
          if(b.width<56||b.height<26) return;
          const solid=s.backgroundColor!=='rgba(0, 0, 0, 0)';
          const bordered=parseFloat(s.borderTopWidth)>0.5;
          if(!solid&&!bordered) return;
          const txt=(e.textContent||'').trim().replace(/\s+/g,' ');
          if(!txt||txt.length>34) return;                 // cards and logos carry no label
          if(e.querySelector('img,svg,picture')) return;   // image tiles are not buttons
          out.push([txt.slice(0,22), s.borderRadius, s.backgroundColor, s.borderTopWidth+' '+s.borderTopColor,
                    s.color, s.fontSize, s.fontWeight, Math.round(b.height)].join(' | '));
        });
        return out;
      }).catch(()=>[]);
      x.forEach(v=>all.push(r+' | '+v));
    }
    await p.close();
  }
  await b.close();
  const seen=new Map();
  all.forEach(v=>{const k=v.split(' | ').slice(2).join('|'); if(!seen.has(k))seen.set(k,[]); seen.get(k).push(v.split(' | ')[1]+' ('+v.split(' | ')[0]+')');});
  console.log('distinct button styles:', seen.size, ' — buttons found:', all.length, '\n');
  [...seen.entries()].sort((a,c)=>c[1].length-a[1].length).forEach(([k,v])=>{
    const p=k.split('|');
    console.log(`  radius ${p[0].padEnd(8)} bg ${p[1].padEnd(20)} border ${p[2].padEnd(22)} ${p[4].padEnd(8)} ${p[5].padEnd(4)} h${p[6]}`);
    console.log(`     x${v.length}: ${[...new Set(v)].slice(0,4).join(', ')}`);
  });
})();
