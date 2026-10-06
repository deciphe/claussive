import {fetchFlow} from '../../lib/flow-data.js';
import FlowHeatmap from './FlowHeatmap';
import {useEffect,useState,useRef} from 'react';
import {ArrowUpRight,Copy,Check,ArrowLeft,RefreshCw} from 'lucide-react';
import './flow-hub.css';
import FirmAtmosphere from '../design/FirmAtmosphere';
import '../design/collector-surfaces.css';
import PayoutLeaders from './PayoutLeaders';
import {FLOW_CONFIGS,VEST_CHAINS,NOVA_WALLETS} from '../../lib/flow-config.js';
import {combineFlows} from '../../lib/flow-metrics.js';
import {isPayoutRecipientTransfer} from '../../lib/flow-classification.js';
const firms=[
 {id:'vest',name:'Vest',title:'vest',logo:'/brands/vest-emblem.svg',route:'#vestflow',tag:'03 NETWORKS',description:'One view. Three chains.',detail:'Arbitrum · Base · Ethereum',color:'#b7c89d',points:'16,48 42,48 60,26 91,26 115,61 142,61 163,36 205,36 225,19 260,19'},
 {id:'breakout',name:'Breakout',title:'breakout',logo:'/brands/breakout.ico',route:'#breakoutflow',tag:'ETHEREUM',description:'Follow the wallet activity.',detail:'USDC flow · recipient rankings',color:'#b6b7d0',points:'16,59 40,59 66,38 90,38 113,49 144,49 171,24 203,24 223,36 260,36'},
 {id:'nova',name:'Hypernova',title:'nova',logo:'/brands/hypernova.ico',route:'#novaflow',tag:'RESERVE + SETTLEMENT',description:'Two wallets. A wider picture.',detail:'Reserve split · NovaPulse · pass rates',color:'#bda5d2',points:'16,55 43,55 68,31 99,31 119,47 148,47 175,17 211,17 234,29 260,29'},
 {id:'propr',name:'Propr',title:'propr',logo:'/brands/propr-icon.svg',route:'#proprflow',tag:'FLOW + PROGRAM STATS',description:'From assessment to payout.',detail:'Propr Pulse · outcomes · payout timing',color:'#9ebdb3',points:'16,60 45,60 66,43 96,43 122,24 153,24 175,38 210,38 236,15 260,15'},
];
const sourcesFor=id=>id==='vest'?VEST_CHAINS:id==='nova'?NOVA_WALLETS:[FLOW_CONFIGS[id]];
const dailyCash=n=>new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const cash=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(n);
function glance(snapshots,sources,days){
 if(!snapshots)return null;
 const data=sources.length>1?combineFlows(snapshots,sources):snapshots[0];
 const end=Date.parse(data.windowEnd||data.updatedAt),start=end-days*86400000;
 if(Date.parse(data.periodStart)>start+60000)return {balance:data.balance,updatedAt:data.updatedAt,outgoing:null};
 const outgoing=Number(data.transfers.filter(t=>Date.parse(t.timestamp)>=start&&Date.parse(t.timestamp)<=end&&isPayoutRecipientTransfer(t,sources)).reduce((sum,t)=>sum+BigInt(t.raw),0n))/1e6;
 return {balance:data.balance,outgoing,updatedAt:data.updatedAt};
}
export default function FlowHub(){
 const [days,setDays]=useState(7),[snapshots,setSnapshots]=useState({});
 const [busy,setBusy]=useState(false),[errors,setErrors]=useState({}),[clock,setClock]=useState(Date.now());
 const refreshRef=useRef(()=>{});
 useEffect(()=>{
  const controller=new AbortController();let running=false;const memory={};
  async function fetchSource(source){
   let fallback=null;
   for(const url of [`https://raw.githubusercontent.com/deciphe/thepayoutlab/vestflow-data/${source.slug}.json`,`/data/${source.slug}.json`]){
    try{const response=await fetch(url+'?t='+Date.now(),{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])});if(!response.ok)continue;const d=await response.json();if(d.complete&&d.wallet?.toLowerCase()===source.wallet.toLowerCase()&&d.token?.toLowerCase()===source.token.toLowerCase()&&d.chain===source.chain&&Array.isArray(d.transfers)&&Number.isFinite(d.balance)&&Number.isFinite(Date.parse(d.updatedAt))){fallback=d;break;}}catch{if(controller.signal.aborted)return null;}
   }
   return fallback;
  }
  async function refresh(){
   if(running||controller.signal.aborted)return;running=true;setBusy(true);
   try{await Promise.all(firms.map(async firm=>{
    const sources=sourcesFor(firm.id);
    const ds=memory[firm.id]||await Promise.all(sources.map(fetchSource));
    if(controller.signal.aborted)return;
    const complete=ds.every(Boolean);
    if(complete){memory[firm.id]=ds;setSnapshots(old=>({...old,[firm.id]:ds}));}
    try{
     const fresh=await Promise.all(sources.map((source,i)=>fetchFlow(source,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(55000)]),previous:ds[i]})));
     if(controller.signal.aborted)return;
     memory[firm.id]=fresh;setSnapshots(old=>({...old,[firm.id]:fresh}));setErrors(old=>({...old,[firm.id]:false}));
    }catch{if(!controller.signal.aborted){setErrors(old=>({...old,[firm.id]:true}));if(!complete)setSnapshots(old=>({...old,[firm.id]:old[firm.id]||null}));}}

   }));}finally{running=false;if(!controller.signal.aborted){setBusy(false);setClock(Date.now());}}
  }
  refreshRef.current=refresh;refresh();
  const timer=setInterval(()=>{if(document.visibilityState==='visible')refresh();},60*1000);
  const ticker=setInterval(()=>setClock(Date.now()),60000);
  const visible=()=>{if(document.visibilityState==='visible')refresh();};
  document.addEventListener('visibilitychange',visible);
  return()=>{controller.abort();clearInterval(timer);clearInterval(ticker);document.removeEventListener('visibilitychange',visible);refreshRef.current=()=>{};};
 },[]);
 const [copied,setCopied]=useState(false),[copyError,setCopyError]=useState(false);
 useEffect(()=>{const old=document.title;document.title='Flow · MASSIVE';return()=>{document.title=old;};},[]);
 async function copy(){try{await navigator.clipboard.writeText('https://massiveprop.xyz/#flow');setCopied(true);setCopyError(false);}catch{setCopyError(true);}}
 return <main className="fh"><div className="fh-shell"><header className="fh-nav"><a href="#" className="fh-brand">MASSIVE<span>.</span></a><span>THE FLOW DIRECTORY</span><a href="#leaderboard">Season Top 15 <ArrowUpRight size={12}/></a></header>
 <section className="fh-intro"><span className="fh-ghost-type" aria-hidden="true">04</span><span className="fh-eyebrow">FOUR FIRMS / ONE PLACE</span><h1>Follow the <em>flow.</em></h1><p>Explore the wallets. Follow the transfers.<br/>Go deeper into the numbers behind each firm.</p><div className="fh-share"><button onClick={copy}>{copied?<Check size={13}/>:<Copy size={13}/>} {copied?'Link copied':'massiveprop.xyz/#flow'}</button><span aria-live="polite">{copyError?'Copy this link from your address bar.':'The payout-wallet view. Not total firm reserves.'}</span></div></section>
 <div className="fh-glance-controls"><em>at a glance</em><span>USDC · filtered outflow</span><button className="fh-refresh" onClick={()=>refreshRef.current()} disabled={busy} title="Refresh snapshots · automatically every 60 seconds and when returning to this tab" aria-label="Refresh all firm snapshots"><RefreshCw size={12} className={busy?'fh-spin':''}/>{busy?'Refreshing…':'Refresh'}</button><div role="group" aria-label="Outflow period">{[7,30].map(n=><button key={n} aria-pressed={days===n} onClick={()=>setDays(n)}>{n}D</button>)}</div></div>
 <p className="fh-refresh-note" role="status">{busy?'Checking chain data…':'Auto-refresh every 60 seconds · refreshes when you return to this tab'}</p>
 <section className="fh-grid" aria-label="Choose a firm tracker">{firms.map((f,i)=>{const sources=sourcesFor(f.id),ds=snapshots[f.id],heatData=ds?(sources.length>1?combineFlows(ds,sources):ds[0]):null;const stats=glance(ds,sources,days),daily=glance(ds,sources,1);return <a key={f.id} className="fh-card" href={f.route} style={{'--firm-color':f.color}}><FirmAtmosphere firm={f.id}/><span className="fh-card-serial" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div className="fh-card-top"><span className="fh-logo"><img src={f.logo} alt=""/></span><span>{f.name}</span><small>{String(i+1).padStart(2,'0')}</small><ArrowUpRight size={20}/></div><div className="fh-card-main"><span className="fh-tag">{f.tag}</span><h2>{f.title}<span>flow</span><i>.</i></h2><p>{f.description}</p></div><div className={'fh-daily'+(daily?.outgoing===0?' fh-daily-zero':'')} title="Filtered USDC outflow during the last 24 hours of this snapshot"><div><span>24H PAYOUT FLOW</span><strong>{daily?.outgoing!=null?'+'+dailyCash(daily.outgoing):'—'}<small>USDC</small></strong></div><ArrowUpRight size={25} aria-hidden="true"/></div><div className="fh-glance"><div><em>tracked balance</em><strong>{stats?cash(stats.balance):'—'}</strong></div><div><em>{days}d outflow</em><strong>{stats?.outgoing!=null?cash(stats.outgoing):'—'}</strong></div><small>{errors[f.id]?'Live refresh unavailable · ':stats&&clock-Date.parse(stats.updatedAt)>2*60*1000?'Delayed snapshot · ':''}{stats?`As of ${new Date(stats.updatedAt).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}`:snapshots[f.id]===null?'Snapshot unavailable':'Loading snapshot…'}</small></div><FlowHeatmap compact data={heatData} config={{...FLOW_CONFIGS[f.id],sources}}/><div className="fh-card-foot"><span>{f.detail}</span><b>Explore <ArrowUpRight size={12}/></b></div></a>;})}</section>
 <section aria-label="30-day payout leaderboards"><div className="fh-leaders-heading"><div><h2>Payout Leaders<span>.</span></h2><p>Four firms. Their top ten recipients. Tap a wallet to explore.</p></div><span>ROLLING 30 DAYS</span></div><div className="fh-leaders-grid">{firms.map(f=>{const sources=sourcesFor(f.id),ds=snapshots[f.id],data=ds?(sources.length>1?combineFlows(ds,sources):ds[0]):null;return <PayoutLeaders key={f.id} inline data={data} config={{...FLOW_CONFIGS[f.id],sources}}/>;})}</div></section>
 <footer className="fh-footer"><span>ONCHAIN ACTIVITY. IN CONTEXT.</span><p>Outflow excludes known internal wallets and identified bridges; it is not verified trader payouts. Tracked USDC wallet activity, not a firm’s complete financial position. Program metrics are dated, firm-reported snapshots.</p><a href="#">Independent tracking by MASSIVE ↗</a></footer></div></main>;
}
