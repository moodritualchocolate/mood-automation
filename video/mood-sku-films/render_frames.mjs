import { chromium } from 'playwright-core';
const sku=process.argv[2]||'energy';
const NF=parseInt(process.argv[3]||'390');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch({executablePath:EXE,headless:true,
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox','--disable-dev-shm-usage']});
const page=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
await page.goto('file://'+process.cwd()+`/sku_${sku}.html`,{waitUntil:'load'});
await page.waitForFunction('window.__ready===true');
// warm up the dust trail buffer a bit before capturing
for(let i=0;i<10;i++){ await page.evaluate(()=>window.__render(0)); }
import {mkdirSync,rmSync} from 'fs';
const dir=`frames_${sku}`; try{rmSync(dir,{recursive:true});}catch{}; mkdirSync(dir);
for(let i=0;i<NF;i++){
  await page.evaluate(f=>window.__render(f), i);
  await page.screenshot({path:`${dir}/f_${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:90});
}
await b.close(); console.log('frames rendered:',NF);
