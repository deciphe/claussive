import {canonicalTraderWallet,traderWallets} from './trader-wallets.js';
import {isPayoutRecipientTransfer} from './flow-classification.js';
const DAY=86400000;
const ordered=wallets=>[...wallets.values()].sort((a,b)=>a.raw===b.raw?a.address.localeCompare(b.address):a.raw>b.raw?-1:1);
export function payoutLeaderboard(rows,sources,windowEnd,periodStart){
 const end=Date.parse(windowEnd),priorEnd=end-DAY;
 const historyComplete=Number.isFinite(end)&&Date.parse(periodStart)<=end-31*DAY;
 const wallets=new Map(),prior=new Map();
 for(const t of rows){
  if(!isPayoutRecipientTransfer(t,sources))continue;
  const timestamp=Date.parse(t.timestamp);
  if(!Number.isFinite(timestamp)||timestamp>end)continue;
  const address=canonicalTraderWallet(t.to),raw=BigInt(t.raw);
  if(historyComplete&&timestamp>=end-31*DAY&&timestamp<=priorEnd){
   const old=prior.get(address)||{address,raw:0n};old.raw+=raw;prior.set(address,old);
  }
  if(timestamp<end-30*DAY)continue;
  const item=wallets.get(address)||{address,addresses:traderWallets(address),raw:0n,raw24h:0n,count:0,explorers:new Map()};
  item.raw+=raw;item.count++;
  if(timestamp>priorEnd)item.raw24h+=raw;
  const source=sources.find(s=>s.chain===t.chain)||sources[0];
  item.explorers.set(t.chain||source.chain,t.explorer||source.explorer);
  wallets.set(address,item);
 }
 const previousRanks=new Map(ordered(prior).map((w,i)=>[w.address,i+1]));
 return ordered(wallets).slice(0,10).map((w,i)=>{
  const previousRank=previousRanks.get(w.address)||null;
  return {...w,total:Number(w.raw)/1e6,raw:String(w.raw),received24h:Number(w.raw24h)/1e6,raw24h:String(w.raw24h),explorers:[...w.explorers],previousRank,rankChange:historyComplete&&previousRank!==null?previousRank-(i+1):null,isNew:historyComplete&&previousRank===null};
 });
}
