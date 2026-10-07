import {fetchRpcTransfers} from './flow-rpc.js';
export async function fetchFlow(config,options={}){
 try{return await fetchExplorerFlow(config,options);}
 catch(error){
  if(options.signal?.aborted||!(config.transferRpcs||config.balanceRpcs)?.length)throw error;
  const snapshot=await fetchRpcTransfers(config,options);
  if(options.includeBalance===false)return snapshot;
  try{return {...snapshot,...await fetchContractBalance(config,options),balanceRefreshFailed:false};}
  catch{return {...snapshot,balanceAsOf:snapshot.balanceAsOf||options.previous?.updatedAt,balanceRefreshFailed:true};}
 }
}
export async function fetchContractBalance(config,{signal}={}){
 for(const endpoint of config.balanceRpcs||[]){
  try{
   const rpc=async(method,params)=>{const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(10000)].filter(Boolean))});if(!r.ok)throw Error('RPC HTTP '+r.status);const d=await r.json();if(d.error||d.result==null)throw Error('RPC response invalid');return d.result;};
   const chain=await rpc('eth_chainId',[]);if(Number(BigInt(chain))!==config.chainId)throw Error('Wrong RPC chain');
   const block=await rpc('eth_getBlockByNumber',['latest',false]);
   const timestamp=Number(BigInt(block.timestamp))*1000;
   if(!Number.isFinite(timestamp)||Date.now()-timestamp>180000||timestamp>Date.now()+60000)throw Error('Stale RPC block');
   const raw=await rpc('eth_call',[{to:config.token,data:'0x70a08231'+config.wallet.slice(2).padStart(64,'0')},block.number]);
   if(!/^0x[0-9a-fA-F]{64}$/.test(raw))throw Error('Invalid balanceOf result');
   return {balance:Number(BigInt(raw))/1e6,balanceSource:'rpc',balanceBlock:Number(BigInt(block.number)),balanceAsOf:new Date(timestamp).toISOString()};
  }catch(e){if(signal?.aborted)throw e;}
 }
 throw Error('Current onchain USDC balance unavailable');
}
async function fetchExplorerFlow(config,{signal,previous,onProgress,includeBalance=true,historyDays=32}={}){
const {wallet:WALLET,token:TOKEN,api:API}=config;
const minIncomingRaw=BigInt(Math.round((config.minIncomingAmount||0)*1e6));
async function get(path){
  for(let attempt=0;attempt<4;attempt++){
    try { const r=await fetch(API+path,{cache:'no-store',headers:{'accept':'application/json'},signal:AbortSignal.any([signal,AbortSignal.timeout(20000)].filter(Boolean))}); if(!r.ok)throw Object.assign(Error(`HTTP ${r.status}`),{status:r.status});return await r.json(); }
    catch(e){if(signal?.aborted||attempt===3||e.status===403)throw e;await new Promise(r=>setTimeout(r,1500*(attempt+1)));}
  }
}
const startedAt=Date.now(),cutoff=startedAt-historyDays*86400000, transfers=new Map();
const reusable=previous?.complete&&previous.wallet===WALLET&&previous.token===TOKEN&&previous.chain===config.chain&&Array.isArray(previous.transfers)&&Date.parse(previous.periodStart)<=cutoff&&Date.parse(previous.updatedAt)>cutoff&&Date.parse(previous.updatedAt)<=Date.now();
// Re-read a recent overlap, then merge the already complete older history.
const overlap=reusable?Math.max(cutoff,Date.parse(previous.windowEnd||previous.updatedAt)-3600000):cutoff;
if(reusable)for(const t of previous.transfers)if(BigInt(t.raw)>=10000n&&(t.direction!=='in'||BigInt(t.raw)>=minIncomingRaw)&&Date.parse(t.timestamp)>=cutoff&&Date.parse(t.timestamp)<overlap)transfers.set(t.id,t);
let params={type:'ERC-20',token:TOKEN}, complete=false;
for(let page=0;page<300;page++){
  onProgress?.(page+1);
  const data=await get(`/addresses/${WALLET}/token-transfers?${new URLSearchParams(params)}`);
  if(!Array.isArray(data.items))throw Error('Invalid transfer response');
  for(const t of data.items){
    if(t.token?.address_hash?.toLowerCase()!==TOKEN)continue;
    const from=t.from.hash.toLowerCase(),to=t.to.hash.toLowerCase();
    if(from!==WALLET&&to!==WALLET)continue;
    const timestamp=Date.parse(t.timestamp);if(!Number.isFinite(timestamp))throw Error('Invalid timestamp');
    if(timestamp<cutoff)continue;
    if(!/^\d+$/.test(t.total?.value)||Number(t.total.decimals)!==6)throw Error('Invalid USDC amount');
    // Ignore zero-value and sub-cent dust transfers.
    if(BigInt(t.total.value)<10000n)continue;
    const row={id:`${t.transaction_hash}:${t.log_index}`,hash:t.transaction_hash,logIndex:t.log_index,block:t.block_number,timestamp:t.timestamp,from,to,raw:t.total.value,amount:Number(t.total.value)/1e6,direction:from===WALLET?(to===WALLET?'self':'out'):'in'};
    if(row.direction==='in'&&BigInt(row.raw)<minIncomingRaw)continue;
    transfers.set(row.id,row);
  }
  if(!data.next_page_params||data.items.some(t=>Date.parse(t.timestamp)<overlap)){complete=true;break;}
  params={type:'ERC-20',token:TOKEN,...data.next_page_params};
}
if(!complete)throw Error('32-day history exceeded page limit; preserving prior snapshot');
let balanceData;
try{
// Rankings need transfers, not the treasury's current balance. A balance RPC
// outage must never discard a complete payout refresh.
if(!includeBalance)balanceData={};
else if(config.balanceRpcs)balanceData=await fetchContractBalance(config,{signal});
else {
const balances=await get(`/addresses/${WALLET}/token-balances`);
if(!Array.isArray(balances))throw Error('Invalid balances');
const balance=balances.find(b=>b.token.address_hash.toLowerCase()===TOKEN);
if(balance&&(!/^\d+$/.test(balance.value)||Number(balance.token.decimals)!==6))throw Error('Invalid USDC balance');
balanceData={balance:Number(balance?.value||0)/1e6,balanceSource:'blockscout'};
}
}catch(error){
 if(!reusable||!Number.isFinite(previous.balance))throw error;
 balanceData={balance:previous.balance,balanceSource:previous.balanceSource,balanceAsOf:previous.balanceAsOf||previous.updatedAt,balanceBlock:previous.balanceBlock,balanceRefreshFailed:true};
}
return {schema:1,wallet:WALLET,token:TOKEN,chain:config.chain,updatedAt:new Date().toISOString(),windowEnd:new Date(startedAt).toISOString(),periodStart:new Date(cutoff).toISOString(),complete,...balanceData,transfers:[...transfers.values()].sort((a,b)=>b.block-a.block||b.logIndex-a.logIndex)};

}
