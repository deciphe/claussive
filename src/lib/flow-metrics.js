export function sortTransfers(rows,sort='newest'){
 return [...rows].sort((a,b)=>{
  if(sort==='largest'||sort==='smallest'){
   const av=BigInt(a.raw),bv=BigInt(b.raw);
   if(av!==bv)return (av>bv?1:-1)*(sort==='largest'?-1:1);
  }
  return ((Date.parse(a.timestamp)-Date.parse(b.timestamp))||a.block-b.block||a.logIndex-b.logIndex)*(sort==='oldest'?1:-1);
 });
}

export function combineFlows(snapshots,sources){
 if(snapshots.length!==sources.length||snapshots.some((s,i)=>!s?.complete||s.wallet!==sources[i].wallet||s.chain!==sources[i].chain))throw Error('Incomplete combined snapshot');
 const transfers=new Map();
 for(const [i,snapshot] of snapshots.entries()){
  const source=sources[i],wallets=new Set(sources.filter(c=>c.chain===source.chain).map(c=>c.wallet.toLowerCase()));
  for(const t of snapshot.transfers){
   const id=source.chain+':'+t.id;
   const internal=wallets.has(t.from?.toLowerCase())&&wallets.has(t.to?.toLowerCase());
   transfers.set(id,{...t,id,direction:internal?'self':t.direction,chain:source.chain,explorer:source.explorer,explorerName:source.explorerName});
  }
 }
 return {complete:true,balanceSource:snapshots.every(s=>s.balanceSource==='rpc')?'rpc':'blockscout',balanceAsOf:snapshots.every(s=>s.balanceAsOf)?new Date(Math.min(...snapshots.map(s=>Date.parse(s.balanceAsOf)))).toISOString():null,walletBalances:snapshots.map((s,i)=>({key:sources[i].chainKey,balance:s.balance,updatedAt:s.updatedAt})),balance:snapshots.reduce((sum,s)=>sum+Math.round(s.balance*1e6),0)/1e6,
 updatedAt:new Date(Math.min(...snapshots.map(s=>Date.parse(s.updatedAt)))).toISOString(),
 windowEnd:new Date(Math.min(...snapshots.map(s=>Date.parse(s.windowEnd||s.updatedAt)))).toISOString(),
 periodStart:new Date(Math.max(...snapshots.map(s=>Date.parse(s.periodStart)))).toISOString(),
 transfers:sortTransfers([...transfers.values()])
 };
}
