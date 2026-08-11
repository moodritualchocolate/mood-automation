// Visual regression net: every route, both viewports, screenshot + health metrics.
//   MODE=base node vrt.js   -> writes the baseline
//   MODE=cur  node vrt.js   -> writes the current run, then compare with vrtdiff.py
const { chromium } = require('playwright-core');
const fs = require('fs');
const ROOT=process.env.VRT_ROOT||(process.env.TMPDIR||'/tmp')+'/mood-vrt';
const FILE=process.env.VRT_FILE||'file:///home/user/mood-automation/store-artifact/deploy/index.html';
const MODE=process.env.MODE||'cur';
const ONLY=process.env.ONLY?process.env.ONLY.split(','):null;
const VPS=[['m',390,844],['d',1440,1000]];
const slug=r=>r==='/'?'home':r.replace(/^\//,'').replace(/\//g,'-');

(async()=>{
  const routes=(ONLY||JSON.parse(fs.readFileSync(__dirname+'/routes.json','utf8')));
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
  // merge into any existing report: a partial run (ONLY=...) must never
  // wipe the metrics captured for the routes it did not visit
  const RP=`${ROOT}/${MODE}/report.json`;
  let report={};
  try{ report=JSON.parse(fs.readFileSync(RP,'utf8')); }catch(_){}
  for(const [vp,W,H] of VPS){
    const dir=`${ROOT}/${MODE}/${vp}`; fs.mkdirSync(dir,{recursive:true});
    for(const route of routes){
      const p=await b.newPage({viewport:{width:W,height:H},isMobile:vp==='m',hasTouch:vp==='m'});
      const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,110)));
      let m={};
      try{
        await p.goto(FILE+(route==='/'?'':'#'+route),{waitUntil:'load',timeout:120000});
        await p.waitForTimeout(vp==='m'?5000:4500);
        const docH=await p.evaluate(async()=>{
          const f=document.querySelector('iframe'); if(!f)return 0;
          const d=f.contentDocument,w=f.contentWindow;
          for(let y=0;y<d.body.scrollHeight;y+=500){w.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}
          w.scrollTo(0,0); return d.body.scrollHeight;
        });
        m=await p.evaluate(()=>{
          const f=document.querySelector('iframe'); if(!f)return {};
          const d=f.contentDocument;
          let tap=0;
          d.querySelectorAll('a,button,input,[role=button]').forEach(e=>{
            const r=e.getBoundingClientRect(); const cs=getComputedStyle(e);
            if(r.width<2||r.height<2||cs.visibility==='hidden'||cs.display==='none')return;
            if(r.height<44||r.width<44)tap++;
          });
          return {broken:[...d.images].filter(i=>i.complete&&i.naturalWidth===0).length,
                  overflow:d.documentElement.scrollWidth>d.documentElement.clientWidth+1,
                  tapSmall:tap};
        });
        await p.setViewportSize({width:W,height:Math.min(Math.max(docH,H),16000)});
        await p.waitForTimeout(1400);
        await p.screenshot({path:`${dir}/${slug(route)}.png`,timeout:120000});
        m.docH=docH;
      }catch(e){ m.error=String(e).slice(0,120); }
      m.js=errs.length; if(errs.length)m.jsFirst=errs[0];
      report[vp+' '+route]=m;
      await p.close();
      process.stdout.write('.');
    }
  }
  fs.mkdirSync(`${ROOT}/${MODE}`,{recursive:true});
  fs.writeFileSync(RP, JSON.stringify(report,null,1));
  await b.close();
  const bad=Object.entries(report).filter(([k,v])=>v.error||v.js||v.broken||v.overflow);
  console.log(`\n${MODE}: ${Object.keys(report).length} captures`);
  console.log(bad.length?('PROBLEMS:\n'+bad.map(([k,v])=>'  '+k+' '+JSON.stringify(v)).join('\n')):'no errors, no broken images, no overflow');
})();
