import {useMemo,useState} from 'react';
import {isPayoutRecipientTransfer} from '../../lib/flow-classification.js';
import './flow-heatmap.css';
const BIN=2*60*60*1000;
const cash=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export default function FlowHeatmap({data,config,compact=false}){
 const [picked,setPicked]=useState(null);
 const days=useMemo(()=>{
  if(!data)return [];
  const end=Date.parse(data.windowEnd||data.updatedAt),start=end-72*60*60*1000;
  const bins=Array.from({length:36},(_,i)=>({start:start+i*BIN,raw:0n,count:0,available:start+i*BIN>=Date.parse(data.periodStart)}));
  for(const t of data.transfers){const time=Date.parse(t.timestamp);if(time<start||time>end||!isPayoutRecipientTransfer(t,config.sources||[config]))continue;const i=Math.min(35,Math.floor((time-start)/BIN));if(i>=0&&i<36){bins[i].raw+=BigInt(t.raw);bins[i].count++;}}
  return bins.map(b=>({...b,amount:Number(b.raw)/1e6}));
 },[data,config]);
 const peak=Math.max(0,...days.filter(d=>d.available).map(d=>d.amount));
 const active=picked===null?null:days[picked];
 const date=n=>new Date(n).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'});
 const total=days.reduce((sum,d)=>sum+d.amount,0);
 const label=d=>date(d.start)+'–'+new Date(d.start+BIN).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' UTC · '+(!d.available?'incomplete history':cash(d.amount)+' USDC outflow · '+d.count+' transfers');
 return <section className={'fhm'+(compact?' fhm-compact':'')} aria-label="72-hour filtered outflow activity">
 <div className="fhm-head"><em>flow pulse <b>{data&&days.every(d=>d.available)?cash(total):'—'}</b></em><span>72H · OUTFLOW</span></div>
 <div className="fhm-cells">{(days.length?days:Array.from({length:36},(_,i)=>({start:i,available:false,amount:0}))).map((d,i)=>{const level=!d.available?-1:d.amount===0?0:Math.min(4,Math.max(1,Math.ceil(d.amount/(peak||1)*4)));const props={className:'fhm-cell fhm-level-'+level,title:data?label(d):'Loading snapshot',style:{height:d.available?(d.amount>0?Math.max(4,d.amount/(peak||1)*32):3)+'px':'3px'},key:i};return compact?<span {...props} aria-label={data?label(d):'Loading snapshot'}/>:<button {...props} aria-label={data?label(d):'Loading snapshot'} aria-pressed={picked===i} onClick={()=>setPicked(picked===i?null:i)}/>;})}</div>
 <div className="fhm-legend"><span>72h ago</span><span>2-hour intervals · relative activity</span><span>Latest snapshot</span></div>
 {!compact&&<p className="fhm-detail" aria-live="polite">{active?label(active):'Tap a bar to inspect. Filtered outflow; not individually verified payouts.'}</p>}
 </section>;
}
