// Independent USDC log fallback when the explorer cannot serve transfers.
// Only extends a complete snapshot; never labels a partial backfill complete.
const TRANSFER='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const hex=n=>'0x'+n.toString(16);
async function pooled(items,fn){
 const results=new Array(items.length);let next=0;
 await Promise.all(Array.from({length:Math.min(2,items.length)},async()=>{while(next<items.length){const i=next++;results[i]=await fn(items[i]);}}));
 return results;
}
export async function fetchRpcTransfers(config,{previous,signal,historyDays=32}={}){
 const now=Date.now(),cutoff=now-historyDays*86400000;
 if(!previous?.complete||previous.wallet!==config.wallet||previous.token!==config.token||previous.chain!==config.chain||!Array.isArray(previous.transfers)||Date.parse(previous.periodStart)>cutoff||!Number.isFinite(Date.parse(previous.windowEnd||previous.updatedAt)))throw Error('RPC requires complete matching history');
 const overlap=Math.max(cutoff,Date.parse(previous.windowEnd||previous.updatedAt)-3600000);
 let lastError;
 for(const endpoint of config.transferRpcs||config.balanceRpcs||[]){
  try{
   const rpc=async(method,params)=>{
    for(let attempt=0;attempt<5;attempt++){
    if(endpoint.includes('mainnet.base.org'))await new Promise(resolve=>setTimeout(resolve,250));
    const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.any([signal,AbortSignal.timeout(12000)].filter(Boolean)),cache:'no-store'});
    if(r.status===429&&attempt<4){await new Promise(resolve=>setTimeout(resolve,1000*2**attempt));continue;}
    if(!r.ok)throw Error('RPC HTTP '+r.status);const d=await r.json();if(d.error||d.result==null)throw Error(d.error?.message||'Invalid RPC response');return d.result;
    }
   };
   if(Number(BigInt(await rpc('eth_chainId',[])))!==config.chainId)throw Error('Wrong RPC chain');
   const latest=await rpc('eth_getBlockByNumber',['latest',false]);
   const endBlock=Number(BigInt(latest.number)),endTime=Number(BigInt(latest.timestamp))*1000;
   if(!Number.isFinite(endTime)||now-endTime>180000||endTime>now+60000||endTime<overlap)throw Error('Stale RPC head');
   const known=previous.transfers.filter(t=>Number.isSafeInteger(t.block)&&t.block<=endBlock&&Date.parse(t.timestamp)<=overlap).sort((a,b)=>b.block-a.block)[0];
   if(!known)throw Error('No historical block anchor');
   // The newest known pre-overlap transfer is a safe lower bound. Bisect
   // only when that anchor would require too many log requests.
   let low=known.block,high=endBlock;
   const range=endpoint.includes('mainnet.base.org')?500:50000;
   while(high-low>range*8){
    const middle=Math.floor((low+high)/2),block=await rpc('eth_getBlockByNumber',[hex(middle),false]);
    if(Number(BigInt(block.timestamp))*1000<=overlap)low=middle;else high=middle;
   }
   if(endBlock-low>range*200)throw Error('RPC backfill exceeds request budget');
   const walletTopic='0x'+config.wallet.slice(2).padStart(64,'0'),jobs=[];
   for(let from=low;from<=endBlock;from+=range){
    const filter={address:config.token,fromBlock:hex(from),toBlock:hex(Math.min(endBlock,from+range-1))};
    jobs.push({...filter,topics:[TRANSFER,walletTopic]},{...filter,topics:[TRANSFER,null,walletTopic]});
   }
   const logs=(await pooled(jobs,async filter=>{const rows=await rpc('eth_getLogs',[filter]);if(!Array.isArray(rows))throw Error('Invalid logs');return rows;})).flat();
   const blocks=[...new Set(logs.map(l=>l.blockNumber))];
   const times=new Map(await pooled(blocks,async n=>{const b=await rpc('eth_getBlockByNumber',[n,false]);return [n,{hash:b.hash,timestamp:new Date(Number(BigInt(b.timestamp))*1000).toISOString()}];}));
   const transfers=new Map(previous.transfers.filter(t=>Date.parse(t.timestamp)>=cutoff&&t.block<low).map(t=>[t.id,t]));
   for(const l of logs){
    if(l.removed||l.address?.toLowerCase()!==config.token||l.topics?.[0]!==TRANSFER||l.topics.length!==3||!/^0x[0-9a-fA-F]{64}$/.test(l.data))throw Error('Invalid transfer log');
    const block=times.get(l.blockNumber);if(!block||block.hash!==l.blockHash)throw Error('Chain changed during log scan');
    const from='0x'+l.topics[1].slice(-40).toLowerCase(),to='0x'+l.topics[2].slice(-40).toLowerCase();
    if(from!==config.wallet&&to!==config.wallet)throw Error('Unrelated transfer');
    const raw=BigInt(l.data),direction=from===config.wallet?(to===config.wallet?'self':'out'):'in';
    if(raw<10000n||Date.parse(block.timestamp)<cutoff||(direction==='in'&&raw<BigInt(Math.round((config.minIncomingAmount||0)*1e6))))continue;
    const logIndex=Number(BigInt(l.logIndex)),id=l.transactionHash+':'+logIndex;
    transfers.set(id,{id,hash:l.transactionHash,logIndex,block:Number(BigInt(l.blockNumber)),timestamp:block.timestamp,from,to,raw:String(raw),amount:Number(raw)/1e6,direction});
   }
   return {...previous,updatedAt:new Date().toISOString(),windowEnd:new Date(endTime).toISOString(),periodStart:new Date(cutoff).toISOString(),complete:true,transferRefreshFailed:false,transferSource:'rpc',transfers:[...transfers.values()].sort((a,b)=>b.block-a.block||b.logIndex-a.logIndex)};
  }catch(error){lastError=error;if(signal?.aborted)throw error;}
 }
 throw lastError||Error('No transfer RPC configured');
}
