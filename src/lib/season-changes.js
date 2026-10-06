import {rankWeekly} from './weekly-leaderboard.js';
const DAY=86400000;
// Compare season-to-date standings at two cutoffs, across every eligible wallet.
export function rankSeasonChanges(board,firm='all'){
 const rows=rankWeekly(board,firm);
 const end=Math.min(Date.parse(board?.asOf),Number(board?.end));
 const priorEnd=end-DAY;
 const complete=Boolean(board?.available)&&Number.isFinite(end)&&Number.isFinite(board.start)&&priorEnd>=board.start;
 const prior=complete?rankWeekly({...board,transfers:board.transfers.filter(t=>Date.parse(t.timestamp)<=priorEnd)},firm):[];
 const old=new Map(prior.map(r=>[r.address,r]));
 return rows.map(r=>{
  const previous=old.get(r.address);
  const raw24h=r.transfers.reduce((sum,t)=>{
   const time=Date.parse(t.timestamp);
   return time>priorEnd&&time<=end?sum+BigInt(t.raw):sum;
  },0n);
  return {...r,received24h:Number(raw24h)/1e6,previousRank:previous?.rank??null,rankChange:complete&&previous?previous.rank-r.rank:null,isNew:complete&&!previous,changeAvailable:complete};
 });
}
