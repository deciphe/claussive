import {useEffect,useRef,useState} from 'react';
import {BRAND_ASSETS} from '../../lib/brand-assets.js';
import {ArrowUpRight,ArrowLeft,Download,RefreshCw} from 'lucide-react';
import {VEST_CHAINS} from '../../lib/flow-config.js';
import {fetchFlow} from '../../lib/flow-data.js';
import {combineFlows} from '../../lib/flow-metrics.js';
import {vestMilestone} from '../../lib/vest-milestone.js';
import './million.css';
import MillionJourney from './MillionJourney.jsx';
const money=n=>new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
export default function Million(){
 const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(null);
 const refresh=useRef(()=>{});
 const certificate=useRef(null);
 const [exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();let running=false,previous=[];
  const title=document.title;document.title='One million · Vest × MASSIVE';
  fetch('/data/vest-million.json',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(d=>{if(d?.crossing)setSaved(d.crossing)}).catch(()=>{});
  async function run(){
   if(running||controller.signal.aborted)return;running=true;setBusy(true);
   try{
    if(!previous.length){previous=await Promise.all(VEST_CHAINS.map(async c=>{
     for(const root of ['https://raw.githubusercontent.com/deciphe/thepayoutlab/vestflow-data/','/data/']){
      try{const r=await fetch(root+c.slug+'.json?t='+Date.now(),{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])});if(!r.ok)continue;const d=await r.json();if(d.complete&&d.wallet===c.wallet&&d.chain===c.chain&&d.token===c.token)return d;}catch{}
     }return null;
    }));if(previous.every(Boolean))setData(combineFlows(previous,VEST_CHAINS));}
    const fresh=await Promise.all(VEST_CHAINS.map((c,i)=>fetchFlow(c,{previous:previous[i],signal:AbortSignal.any([controller.signal,AbortSignal.timeout(55000)])})));
    if(!controller.signal.aborted){previous=fresh;setData(combineFlows(fresh,VEST_CHAINS));setError('');}
   }catch{if(!controller.signal.aborted)setError('Live refresh delayed. Showing the last available snapshot.');}
   finally{running=false;if(!controller.signal.aborted)setBusy(false);}
  }
  refresh.current=run;run();const timer=setInterval(()=>{if(document.visibilityState==='visible')run()},60000);
  const visible=()=>{if(document.visibilityState==='visible')run()};document.addEventListener('visibilitychange',visible);
  return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);document.title=title};
 },[]);
 const result=data?vestMilestone(data,VEST_CHAINS):null,crossing=saved||result?.crossing;
 const address=crossing?.to;
 async function download(){
  if(exporting||!certificate.current)return;
  setExporting(true);setExportError('');
  try{
   const {toBlob}=await import('html-to-image');
   await document.fonts.ready;
   const node=certificate.current;
   await Promise.all(Array.from(node.querySelectorAll('img'),img=>img.decode()));
   const blob=await toBlob(node,{
    pixelRatio:Math.max(2,2400/node.getBoundingClientRect().width),
    backgroundColor:'#0c0e0c',
   });
   if(!blob)throw new Error('Empty certificate');
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download=crossing?'vest-one-million-certificate.png':'vest-one-million-preview.png';
   document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch{setExportError('Certificate download failed. Please try again.');}
  finally{setExporting(false);}
 }
 return <main className="mm"><div className="mm-shell">
 <nav className="mm-nav"><a className="mm-brand" href="#">MASSIVE.</a><span>MILESTONES / 001</span><a href="#vestflow"><ArrowLeft size={13}/> Vestflow</a></nav>
 <div className="mm-intro"><span>VESTMARKETS × MASSIVE</span><p>The first million deserves its own moment.</p></div>
 <section className="mm-certificate" ref={certificate}>
 <header><img className="mm-official-logo" src={BRAND_ASSETS.vestOfficial} alt="Vest Markets"/><span className="mm-collab">× <b>MASSIVE.</b></span><small>{crossing?'MILESTONE / 001':'MILESTONE PREVIEW'}</small></header>
 <div className="mm-hero"><span className="mm-kicker">{crossing?'A MILLION PAID. A MILESTONE MADE.':'THE MILLION-DOLLAR MILESTONE'}</span><h1>$1,000,000<span>.</span></h1><p>{crossing?'PAID OUT.':'IN PAYOUTS.'}</p><div className="mm-mini-payout"><div><img src={BRAND_ASSETS.vestOfficial} alt="Vest Markets"/><span>×</span><b>MASSIVE.</b></div><small>{crossing?'THE CROSSING PAYOUT':'PAYOUT'}</small><strong>${money(crossing?.amount||560)}</strong><span>USDC <i>PAID OUT</i></span></div></div>
 <div className="mm-recipient"><span className="mm-kicker">{crossing?'THE WALLET THAT MADE IT A MILLION':'THE WALLET THAT MAKES IT A MILLION'}</span>
 {address?<a className="mm-address" href={crossing.explorer+'/address/'+address} target="_blank" rel="noopener noreferrer">{address}<ArrowUpRight size={16}/></a>:<p className="mm-await">One final payout. One place in the record<span>.</span></p>}
 {crossing?<div className="mm-proof"><strong>+{money(crossing.amount)} USDC</strong><span>{crossing.chain}</span><a href={crossing.explorer+'/tx/'+crossing.hash} target="_blank" rel="noopener noreferrer">View the transaction <ArrowUpRight size={12}/></a></div>:<p className="mm-sub">Recorded here when the tracked total crosses $1 million.</p>}
 </div>
 <footer><b>MASSIVE.</b><span>Independently tracked.<br/><strong>MASSIVE</strong></span><span className="mm-edition">VEST / 001<br/>USDC · 30 DAYS</span></footer>
 </section>
 <div className="mm-live"><div><span>{crossing?'TOTAL AT CROSSING':'TRACKED NOW'}</span><strong>{crossing?'$'+money(crossing.after):result?'$'+money(result.total):'—'}</strong></div><div><span>{crossing?'CROSSING PAYOUT':'TO THE MILESTONE'}</span><strong>{crossing?'$'+money(crossing.amount):result?'$'+money(Math.max(0,1000000-result.total)):'—'}</strong></div><button onClick={()=>refresh.current()} disabled={busy} aria-label="Refresh milestone"><RefreshCw size={16}/></button></div>
 <div className="mm-actions"><button className="mm-download" onClick={download} disabled={exporting}><Download size={15}/>{exporting?'Preparing certificate…':crossing?'Download certificate':'Download preview'} <small>HIGH-RES PNG</small></button><a href="#vestflow">Explore Vestflow <ArrowUpRight size={14}/></a></div>
 <p className="mm-note" role="status">{exportError||error||'Refreshes every 60 seconds while this page is open.'}{data&&' Snapshot: '+new Date(data.updatedAt).toLocaleString()+'.'}</p>
 <p className="mm-note">Rolling 30-day tracked USDC outflow across Vest’s three wallets. Known internal wallets, bridges and dust excluded. Recipient identity is not independently verified. This is payout-wallet activity, not total firm finances or evaluation sales.</p>
 <MillionJourney data={data} crossing={crossing}/>
 </div></main>;
}
