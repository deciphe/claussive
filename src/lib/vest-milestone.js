import {isPayoutRecipientTransfer} from './flow-classification.js';
export const MILESTONE_START=Date.parse('2026-10-01T02:21:36.090Z');
export function vestMilestone(data,sources){
 const end=Date.parse(data.windowEnd||data.updatedAt),day=86400000,target=1000000000000n;
 const rows=data.transfers.filter(t=>isPayoutRecipientTransfer(t,sources)&&Date.parse(t.timestamp)<=end).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)||a.block-b.block||a.logIndex-b.logIndex);
 const total=rows.filter(t=>Date.parse(t.timestamp)>=end-30*day).reduce((s,t)=>s+BigInt(t.raw),0n);
 let crossing=null;
 if(Date.parse(data.periodStart)<=MILESTONE_START-30*day){
  for(const t of rows){
   const time=Date.parse(t.timestamp);if(time<=MILESTONE_START)continue;
   const same=rows.filter(r=>Date.parse(r.timestamp)===time);
   if(new Set(same.map(r=>r.chain)).size>1)continue;
   const before=rows.filter(r=>Date.parse(r.timestamp)>=time-30*day&&(Date.parse(r.timestamp)<time||(Date.parse(r.timestamp)===time&&(r.block<t.block||(r.block===t.block&&r.logIndex<t.logIndex))))).reduce((s,r)=>s+BigInt(r.raw),0n);
   if(before<target&&before+BigInt(t.raw)>=target){crossing={...t,before:Number(before)/1e6,after:Number(before+BigInt(t.raw))/1e6};break;}
  }
 }
 return {total:Number(total)/1e6,crossing};
}
