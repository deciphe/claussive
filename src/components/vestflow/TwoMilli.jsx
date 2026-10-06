import {useEffect,useMemo,useRef,useState} from 'react';
import {BRAND_ASSETS} from '../../lib/brand-assets.js';
import {ArrowLeft,ArrowUpRight,Download,RefreshCw} from 'lucide-react';
import {VEST_CHAINS} from '../../lib/flow-config.js';
import {combineFlows} from '../../lib/flow-metrics.js';
import {isPayoutRecipientTransfer} from '../../lib/flow-classification.js';
import './two-milli.css';

const ONE={timestamp:'2026-10-01T05:17:41.000Z',local:'OCT 01 · 01:17:41 AM ET',amount:201.825392,before:999812.040628,after:1000013.86602,hash:'0x75f81df1203fbaa5df9943934a45e29837541383bfeff5786160e62c1811e602',explorer:'https://basescan.org'};
const TWO={timestamp:'2026-10-03T08:59:37.000Z',local:'OCT 03 · 04:59:37 AM ET',amount:6825.247676,before:1996588.910645,after:2003414.158321,hash:'0x221cf85405467a45c8dd5b4764d3329823a80f7b910b12abd1ef698a0acbb737',explorer:'https://basescan.org'};
const BETWEEN=1012637.773512;
const elapsed=Date.parse(TWO.timestamp)-Date.parse(ONE.timestamp);
const hours=elapsed/3600000;
const compression=30*24/hours;
const money=(n,d=2)=>new Intl.NumberFormat('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const compact=n=>new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(n);
const split=ms=>{const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')};

export default function TwoMilli(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[exporting,setExporting]=useState(false);
 const hero=useRef(null);

 async function refresh(){
  setBusy(true);setError('');
  try{
   const snapshots=await Promise.all(VEST_CHAINS.map(async source=>{
    for(const root of ['https://raw.githubusercontent.com/deciphe/thepayoutlab/vestflow-data/','/data/']){
     try{
      const r=await fetch(root+source.slug+'.json?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!r.ok)continue;
      const d=await r.json();
      if(d?.complete&&d.wallet===source.wallet&&d.chain===source.chain&&d.token===source.token)return d;
     }catch{}
    }
    throw Error('Snapshot unavailable');
   }));
   setData(combineFlows(snapshots,VEST_CHAINS));
  }catch{setError('Live Vestflow snapshot is delayed. The milestone records below are fixed onchain.');}
  finally{setBusy(false);}
 }

 useEffect(()=>{
  const title=document.title;document.title='Two million · Vest × MASSIVE';
  refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh()},60000);
  return()=>{clearInterval(timer);document.title=title};
 },[]);

 function freezeRenderedStyles(node){
  const rect=node.getBoundingClientRect();
  const nodes=[node,...node.querySelectorAll('*')];
  const saved=nodes.map(el=>({el,style:el.getAttribute('style')}));
  nodes.forEach(el=>{
   const computed=getComputedStyle(el);
   for(const property of computed){
    const value=computed.getPropertyValue(property);
    if(value)el.style.setProperty(property,value,computed.getPropertyPriority(property));
   }
  });
  node.style.setProperty('width',rect.width+'px');
  node.style.setProperty('height',rect.height+'px');
  node.style.setProperty('min-width',rect.width+'px');
  node.style.setProperty('max-width',rect.width+'px');
  node.style.setProperty('min-height',rect.height+'px');
  node.style.setProperty('max-height',rect.height+'px');
  node.style.setProperty('margin','0');
  return {
   width:rect.width,
   height:rect.height,
   restore(){
    saved.forEach(({el,style})=>{
     if(style==null)el.removeAttribute('style');
     else el.setAttribute('style',style);
    });
   }
  };
 }

 function bytesToBase64(buffer){
  const bytes=new Uint8Array(buffer);
  let binary='';
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(binary);
 }

 async function exactExportFontCSS(node,getFontEmbedCSS){
  const fallback=()=>getFontEmbedCSS(node,{preferredFontFormat:'woff2'}).catch(()=>undefined);
  try{
   const cssUrl='https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap';
   const response=await fetch(cssUrl,{mode:'cors',cache:'force-cache'});
   if(!response.ok)return fallback();
   let css=await response.text();
   const urls=[...new Set(Array.from(css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g),m=>m[1]))];
   await Promise.all(urls.map(async url=>{
    const fontResponse=await fetch(url,{mode:'cors',cache:'force-cache'});
    if(!fontResponse.ok)throw Error('font');
    const encoded=bytesToBase64(await fontResponse.arrayBuffer());
    css=css.split(url).join('data:font/woff2;base64,'+encoded);
   }));
   return css;
  }catch{return fallback();}
 }

 const live=useMemo(()=>{
  if(!data)return null;
  const end=Date.parse(data.windowEnd||data.updatedAt),start=end-30*86400000;
  const eligible=t=>isPayoutRecipientTransfer(t,VEST_CHAINS);
  const rows=data.transfers.filter(t=>Date.parse(t.timestamp)>=start&&Date.parse(t.timestamp)<=end&&eligible(t));
  const total=rows.reduce((s,t)=>s+Number(t.raw)/1e6,0);
  const afterTwo=data.transfers.filter(t=>Date.parse(t.timestamp)>Date.parse(TWO.timestamp)&&Date.parse(t.timestamp)<=end&&eligible(t)).reduce((s,t)=>s+Number(t.raw)/1e6,0);
  const chains=VEST_CHAINS.map(source=>({name:source.chain==='Arbitrum One'?'Arbitrum':source.chain,value:rows.filter(t=>t.chain===source.chain).reduce((s,t)=>s+Number(t.raw)/1e6,0)})).sort((a,b)=>b.value-a.value);
  return {total,afterTwo,chains,updatedAt:data.updatedAt};
 },[data]);

 async function download(){
  if(exporting||!hero.current)return;setExporting(true);setError('');
  let frozen=null;
  try{
   const {toBlob,getFontEmbedCSS}=await import('html-to-image');
   const node=hero.current;
   await document.fonts.ready;
   await Promise.all(Array.from(node.querySelectorAll('img'),img=>img.decode().catch(()=>{})));
   frozen=freezeRenderedStyles(node);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const fontEmbedCSS=await exactExportFontCSS(node,getFontEmbedCSS);
   const blob=await toBlob(node,{
    width:frozen.width,
    height:frozen.height,
    pixelRatio:Math.max(2,2400/frozen.width),
    backgroundColor:'#080a09',
    fontEmbedCSS
   });
   if(!blob)throw Error('No image');
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='vest-2-million-massiveprop.png';
   document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch{setError('Share-card export failed. Please try again.');}
  finally{frozen?.restore?.();setExporting(false);}
 }

 return <main className="tm">
  <div className="tm-ambient" aria-hidden="true"/><div className="tm-grid" aria-hidden="true"/>
  <div className="tm-shell">
   <nav className="tm-nav"><a className="tm-brand" href="#">MASSIVE.</a><span>MILESTONES / 002</span><div><a href="#1milli">001</a><a href="#vestflow"><ArrowLeft size={13}/> Vestflow</a></div></nav>

   <section className="tm-hero" ref={hero}>
    <div className="tm-hero-top"><div><img src={BRAND_ASSETS.vestOfficial} alt="Vest Markets"/><span>×</span><b>MASSIVE.</b></div><small>VESTFLOW / MILESTONE 002</small></div>
    <div className="tm-hero-copy"><span className="tm-kicker">THE SECOND MILLION DIDN'T WAIT.</span><h1><span>$</span>2,000,000<i>.</i></h1><p>Tracked 30-day Vest outflow crossed two million USDC.</p></div>
    <div className="tm-split-stamp"><span>1M → 2M</span><strong>{split(elapsed)}</strong><small>HOURS : MINUTES : SECONDS</small></div>
    <div className="tm-race tm-race-hero" aria-label="Milestone velocity comparison">
      <header><span>MILESTONE VELOCITY</span><b>{compression.toFixed(1)}× shorter interval <small>vs 30D window</small></b></header>
      <div className="tm-race-row second"><div className="tm-race-label"><small>SECOND MILLION</small><strong>{split(elapsed)}</strong><span>OCT 01 → OCT 03</span></div><div className="tm-track"><i style={{width:(100/compression)+'%'}}/><b style={{left:'calc('+(100/compression)+'% - 14px)'}}>2M</b></div></div>
      <div className="tm-race-row first"><div className="tm-race-label"><small>FIRST MILLION</small><strong>30D</strong><span>ROLLING WINDOW → OCT 01</span></div><div className="tm-track"><i/><b>1M</b></div></div>
      <div className="tm-race-foot"><span>30 DAYS</span><span>51H 41M 56S</span></div>
    </div>
    <div className="tm-hero-bottom"><span>OCTOBER 03 · 2026</span><span>BASE · USDC</span><span>MASSIVE INDEPENDENT TRACKER</span></div>
   </section>

   <section className="tm-intro">
    <div><span className="tm-index">01 / THE SPLIT</span><h2>The first million took the window.<br/><em>The next took 51 hours.</em></h2></div>
    <p>The $1M mark arrived inside the rolling 30-day measurement window. Then another million-plus of new filtered outflow landed between the two milestone crossings in just {Math.floor(hours)} hours and {Math.floor((hours%1)*60)} minutes.</p>
   </section>

   <section className="tm-tunnel">
    <div className="tm-tunnel-grid" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>
    <span className="tm-index">02 / COMPRESSION</span>
    <div className="tm-tunnel-copy"><small>THE GAP COLLAPSED TO</small><strong>51:41:56</strong><p>From the first $1M crossing to the second.</p></div>
    <div className="tm-tunnel-marks"><span>1,000,000</span><i>→</i><span>2,000,000</span></div>
   </section>

   <section className="tm-crossings">
    <div className="tm-section-head"><span className="tm-index">03 / ONCHAIN PROOF</span><h2>Two marks.<br/>Two transactions.</h2></div>
    {[['001','FIRST MILLION',ONE],['002','SECOND MILLION',TWO]].map(([no,label,m],i)=><article className={'tm-crossing '+(i?'tm-crossing-hot':'')} key={no}>
      <div className="tm-crossing-no">{no}</div>
      <div className="tm-crossing-main"><span>{label}</span><strong>{'$'+money(i?2000000:1000000,0)}</strong><small>{m.local}</small></div>
      <div className="tm-crossing-proof"><span>CROSSING TRANSFER</span><strong>{'+$'+money(m.amount,2)}</strong><small>{money(m.before,2)} → {money(m.after,2)}</small></div>
      <a href={m.explorer+'/tx/'+m.hash} target="_blank" rel="noopener noreferrer">BASESCAN <ArrowUpRight size={13}/></a>
    </article>)}
   </section>

   <section className="tm-stats">
    <article><span>NEW OUTFLOW BETWEEN MARKS</span><strong>{'$'+money(BETWEEN,2)}</strong><small>filtered tracked USDC</small></article>
    <article className="tm-stat-live"><span><i/> LIVE 30D</span><strong>{live?'$'+money(live.total,2):'—'}</strong><small>{live?'as of '+new Date(live.updatedAt).toLocaleString():'reading Vestflow…'}</small></article>
    <article><span>AFTER THE 2M CROSSING</span><strong>{live?'$'+money(live.afterTwo,2):'—'}</strong><small>additional filtered outflow</small></article>
   </section>

   <section className="tm-chains">
    <div className="tm-section-head"><span className="tm-index">04 / THE LOAD</span><h2>Where the current<br/>30D flow sits.</h2></div>
    <div className="tm-chain-stack">{(live?.chains||[{name:'Base',value:0},{name:'Arbitrum',value:0},{name:'Ethereum',value:0}]).map((c,i)=><div className={'tm-chain tm-chain-'+i} style={{'--share':live&&live.total?Math.max(4,c.value/live.total*100)+'%':'4%'}} key={c.name}><span>{String(i+1).padStart(2,'0')} · {c.name}</span><strong>{live?compact(c.value):'—'} <small>USDC</small></strong><i/></div>)}</div>
   </section>

   <section className="tm-final">
    <span>THE FIRST MILLION WAS THE MILESTONE.</span>
    <h2>The second<br/>was the <em>velocity.</em></h2>
    <div><a href="#vestflow">Open live Vestflow <ArrowUpRight size={14}/></a><button onClick={download} disabled={exporting}><Download size={14}/>{exporting?'Rendering…':'Save 2M card'}</button><button className="tm-refresh" onClick={refresh} disabled={busy}><RefreshCw size={14} className={busy?'tm-spin':''}/> Refresh</button></div>
   </section>

   <footer className="tm-footer"><div><b>MASSIVE.</b><span>MASSIVE / VESTFLOW<br/>MILESTONE 002</span></div><p>Rolling 30-day tracked USDC outflow across Vest's three tracked wallets. Known internal wallets, identified bridge routes and dust are excluded. Recipient identity is not independently verified. This is tracked wallet activity—not total company payouts, reserves, revenue or evaluation sales.</p>{error&&<small role="status">{error}</small>}</footer>
  </div>
 </main>;
}
