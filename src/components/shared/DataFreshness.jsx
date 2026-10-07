import {useEffect,useState} from 'react';
import {RefreshCw} from 'lucide-react';
import './data-freshness.css';
export default function DataFreshness({asOf,completeThrough,busy=false,onRefresh,compact=false}){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[]);
 const time=Date.parse(asOf),valid=Number.isFinite(time);
 const oldest=Date.parse(completeThrough)||time;
 const delayed=valid&&now-oldest>10*60000;
 const stamp=valid?new Date(time):null;
 return <div className={'massive-freshness'+(compact?' is-compact':'')+(delayed?' is-delayed':'')} role="status" aria-live="polite">
  <span className="massive-freshness-dot" aria-hidden="true"/>
  <div className="massive-freshness-copy"><strong>{valid?<>{delayed?'DATA AS OF':'LIVE AS OF'} <time dateTime={stamp.toISOString()}>{stamp.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}</time></>:'READING THE LEDGER'}</strong><small>{valid?stamp.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'Shared payout snapshot'}<span>·</span>{delayed?'Awaiting the next pulse':'5-minute pulse'}</small>{completeThrough&&time-oldest>120000&&<small>Some chains delayed · complete through {new Date(oldest).toLocaleString()}</small>}</div>
  {onRefresh&&<button type="button" disabled={busy} onClick={onRefresh} aria-label="Read latest shared snapshot" title="Read the saved snapshot. Does not request chain data."><RefreshCw size={14} className={busy?'is-spinning':''}/></button>}
 </div>;
}
