import {isPayoutRecipientTransfer} from './flow-classification.js';
export function millionJourney(data,sources,crossing){
 if(!data)return null;
 const end=Date.parse(crossing?.timestamp||data.windowEnd||data.updatedAt),start=end-30*86400000;
 const rows=data.transfers.filter(t=>{
  const time=Date.parse(t.timestamp);
  return isPayoutRecipientTransfer(t,sources)&&time>=start&&time<=end&&(!crossing||time<end||t.chain!==crossing.chain||t.block<crossing.block||(t.block===crossing.block&&t.logIndex<=crossing.logIndex));
 }).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)||a.chain.localeCompare(b.chain)||a.block-b.block||a.logIndex-b.logIndex);
 let raw=0n;
 const points=rows.map(t=>{raw+=BigInt(t.raw);return {...t,amount:Number(t.raw)/1e6,total:Number(raw)/1e6,time:Date.parse(t.timestamp)};});
 return {points,start,end,total:Number(raw)/1e6,complete:!!data.complete&&Date.parse(data.periodStart)<=start,wallets:new Set(rows.map(t=>t.to.toLowerCase())).size};
}
