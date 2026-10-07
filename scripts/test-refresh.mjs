import assert from 'node:assert/strict';
import {fetchFlow} from '../src/lib/flow-data.js';
import {FLOW_SOURCES,VEST_CHAINS} from '../src/lib/flow-config.js';
import {weeklyBoard,weeklySources,WEEK,rankWeekly} from '../src/lib/weekly-leaderboard.js';
import {seasonBoard,SEASON_ONE,seasonDuration} from '../src/lib/season-leaderboard.js';
import {weeklyAwardsUnlocked} from '../src/lib/weekly-awards.js';
import {TRADER_WALLET_GROUPS} from '../src/lib/trader-wallets.js';

const start=Date.parse('2026-09-28T00:00:00Z'),end=start+WEEK,day=86400000;
const [primary,alias]=TRADER_WALLET_GROUPS[0];
const snapshots=Object.fromEntries(VEST_CHAINS.map(s=>[s.slug,{complete:true,wallet:s.wallet,token:s.token,chain:s.chain,periodStart:new Date(start-day).toISOString(),windowEnd:new Date(end).toISOString(),updatedAt:new Date(end).toISOString(),balance:0,transfers:[]}]));
function add(source,to,time,raw,id){snapshots[source.slug].transfers.push({id,hash:id,logIndex:0,block:1,timestamp:new Date(time).toISOString(),from:source.wallet,to,raw:String(raw),amount:raw/1e6,direction:'out'});}
add(VEST_CHAINS[0],primary,start+1000,1000000,'old');
add(VEST_CHAINS[1],alias,end-1000,2000000,'new');
snapshots[VEST_CHAINS[2].slug].windowEnd=new Date(end-day).toISOString();
const strict=weeklyBoard(snapshots,start,end,WEEK,'vest');
assert.equal(rankWeekly(strict)[0].total,1);
const live=weeklyBoard(snapshots,start,end,WEEK,'vest',{live:true});
assert.equal(rankWeekly(live)[0].total,3);
assert.equal(rankWeekly(live)[0].count,2);
assert.equal(live.closed,false);
assert.equal(weeklyAwardsUnlocked(live,end),false);
assert.equal(live.completeThrough,new Date(end-day).toISOString());
assert.equal(weeklySources('all').length,FLOW_SOURCES.length);
assert(live.coverage.some(s=>s.source==='vestflow-ethereum'));
const prior={available:true,start:SEASON_ONE,end:start,duration:seasonDuration(SEASON_ONE),transfers:[]};
assert.equal(rankWeekly(seasonBoard(snapshots,SEASON_ONE,end,prior,'vest',{live:true}))[0].total,3);
snapshots[VEST_CHAINS[2].slug].windowEnd=new Date(end).toISOString();
assert(weeklyAwardsUnlocked(weeklyBoard(snapshots,start,end,WEEK,'vest',{live:true}),end));

const config=VEST_CHAINS[0],now=Date.now(),realFetch=globalThis.fetch;
const previous={complete:true,wallet:config.wallet,token:config.token,chain:config.chain,periodStart:new Date(now-33*day).toISOString(),windowEnd:new Date(now-day).toISOString(),updatedAt:new Date(now-day).toISOString(),balance:123,balanceSource:'rpc',balanceAsOf:new Date(now-day).toISOString(),transfers:[]};
let balanceCalls=0;
globalThis.fetch=async url=>{
 if(!String(url).includes('token-transfers')){balanceCalls++;throw Error('Balance provider down');}
 return {ok:true,json:async()=>({items:[{transaction_hash:'new-payment',log_index:0,block_number:100,timestamp:new Date(now-1000).toISOString(),token:{address_hash:config.token},from:{hash:config.wallet},to:{hash:alias},total:{value:'2000000',decimals:6}}],next_page_params:null})};
};
try{
 const payouts=await fetchFlow(config,{previous,includeBalance:false});
 assert.equal(balanceCalls,0);assert.equal(payouts.transfers.length,1);
 const fallback=await fetchFlow(config,{previous});
 assert.equal(fallback.transfers.length,1);assert.equal(fallback.balance,123);
 assert.equal(fallback.balanceRefreshFailed,true);assert.equal(fallback.balanceAsOf,previous.balanceAsOf);
}finally{globalThis.fetch=realFetch;}
console.log('PASS: live payouts survive a stale sibling chain and failed balance RPC; merged totals, coverage and award finality remain correct.');

const {fetchRpcTransfers}=await import('../src/lib/flow-rpc.js');
const tokenTopic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const topic=a=>'0x'+a.slice(2).padStart(64,'0');
const fixture={...previous,transfers:[{id:'old:0',hash:'old',block:99,logIndex:0,timestamp:new Date(now-2*day).toISOString(),from:config.wallet,to:primary,direction:'out',raw:'1000000',amount:1},{id:'anchor:0',hash:'anchor',block:100,logIndex:0,timestamp:new Date(now-2*day).toISOString(),from:config.wallet,to:primary,direction:'out',raw:'1000000',amount:1}]};
let wrongChain=false;
globalThis.fetch=async(_url,options)=>{const {method,params}=JSON.parse(options.body);let result;
 if(method==='eth_chainId')result=wrongChain?'0x1':'0xa4b1';
 else if(method==='eth_getBlockByNumber')result={number:'0xc8',timestamp:'0x'+Math.floor((now-1000)/1000).toString(16),hash:'canonical'};
 else if(method==='eth_getLogs')result=params[0].topics[1]?[{address:config.token,topics:[tokenTopic,topic(config.wallet),topic(alias)],data:'0x'+(2000000).toString(16).padStart(64,'0'),blockNumber:'0xc8',blockHash:'canonical',logIndex:'0x0',transactionHash:'rpc-new',removed:false}]:[];
 else throw Error('Unexpected RPC '+method);
 return {ok:true,json:async()=>({result})};
};
try{
 const recovered=await fetchRpcTransfers(config,{previous:fixture});
 assert.equal(recovered.transferSource,'rpc');assert.equal(recovered.transfers.length,2);
 assert.equal(recovered.transfers.reduce((n,t)=>n+Number(t.raw),0),3000000);
 assert.equal(recovered.transfers[0].to,alias);
 assert.equal(recovered.transferRefreshFailed,false);
 await assert.rejects(fetchRpcTransfers(config,{previous:{...fixture,complete:false}}));
 wrongChain=true;await assert.rejects(fetchRpcTransfers(config,{previous:fixture}),/Wrong RPC chain/);
}finally{globalThis.fetch=realFetch;}
console.log('PASS: RPC log recovery preserves earlier history, replaces rescanned blocks, validates chain identity and decodes exact USDC values.');
