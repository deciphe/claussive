import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chromium} from 'playwright';
export async function renderEmailRankCard(props){
 const server=await createServer({optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true},appType:'custom'});
 let browser;
 try{
  const {default:Card}=await server.ssrLoadModule('/src/components/email/EmailRankCard.jsx');
  const svg=renderToStaticMarkup(React.createElement(Card,props));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1200,height:760},deviceScaleFactor:2});
  await page.setContent(`<!doctype html><html><head><base href="https://gigaprop.xyz/"><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>html,body{margin:0;padding:0;background:#09090b}#card{width:1200px;height:760px}</style></head><body><div id="card">${svg}</div></body></html>`,{waitUntil:'networkidle',timeout:45000});
  await page.evaluate(async()=>{
   await document.fonts.ready;
   if(!document.fonts.check('500 16px Manrope')||!document.fonts.check('400 12px "DM Mono"'))throw Error('Rank-card fonts could not load.');
   // Embed all SVG image resources so the card cannot silently lose its portrait.
   for(const node of document.querySelectorAll('svg image')){
    const url=node.getAttribute('href');
    if(!url)continue;
    const img=new Image();img.src=new URL(url,document.baseURI).href;
    await img.decode();
   }
  });
  return await page.locator('#card').screenshot({type:'jpeg',quality:96});
 }finally{if(browser)await browser.close();await server.close()}
}
