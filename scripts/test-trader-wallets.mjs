import assert from 'node:assert/strict';
import {rankWeekly} from '../src/lib/weekly-leaderboard.js';
import {payoutLeaderboard} from '../src/lib/payout-leaderboard.js';
import {canonicalTraderWallet,traderWallets} from '../src/lib/trader-wallets.js';
import {FLOW_CONFIGS} from '../src/lib/flow-config.js';
const a='0x2f2c91a08aa283359b41850adb9ea3d65b36f3d3',b='0x35ef3c419ec40173f42a64ac65c26d9dbd405bea',c='0x1111111111111111111111111111111111111111';
const end=Date.parse('2026-10-02T22:00:00Z'),day=86400000,s=FLOW_CONFIGS.vest;
const tx=(to,amount,time,id,firm='vest')=>({to,amount,raw:String(amount*1e6),timestamp:new Date(time).toISOString(),id,hash:id,logIndex:0,firm,direction:'out',chain:s.chain,from:s.wallet});
const transfers=[tx(a,100,end-2*day,'1'),tx(b,200,end-1000,'2'),tx(c,250,end-2*day,'3'),tx(b,50,end-1000,'4','breakout')];
const ranked=rankWeekly({transfers});assert.equal(ranked.length,2);assert.equal(ranked[0].address,a);assert.equal(ranked[0].total,350);assert.equal(ranked[0].count,3);assert.deepEqual(ranked[0].addresses,[a,b]);assert.equal(ranked[0].transfers.find(t=>t.id==='2').to,b);assert.equal(rankWeekly({transfers},'vest')[0].total,300);assert.equal(rankWeekly({transfers},'breakout')[0].total,50);assert.equal(ranked.reduce((sum,r)=>sum+r.total,0),600);assert.equal(canonicalTraderWallet(b.toUpperCase()),a);assert.equal(canonicalTraderWallet(c),c);assert.deepEqual(traderWallets(b),[a,b]);
const rolling=payoutLeaderboard(transfers.filter(t=>t.firm==='vest'),[s],new Date(end).toISOString(),new Date(end-32*day).toISOString());assert.equal(rolling.length,2);assert.equal(rolling[0].total,300);assert.equal(rolling[0].received24h,200);assert.equal(rolling[0].count,2);assert.equal(rolling[0].previousRank,2);assert.equal(rolling[0].rankChange,1);assert.equal(rolling[0].isNew,false);console.log('PASS: grouped seasonal and rolling totals, counts, original recipients, filters, alias resolution, 24h gains and rank movement; total USDC conserved.');
const {rankSeasonChanges}=await import('../src/lib/season-changes.js');
const changes=rankSeasonChanges({available:true,start:end-10*day,end,asOf:new Date(end).toISOString(),transfers},'vest');assert.equal(changes[0].received24h,200);assert.equal(changes[0].rankChange,1);assert.equal(changes[0].previousRank,2);assert.equal(changes[0].isNew,false);console.log('PASS: season 24h changes compare the combined identity at both cutoffs.');

