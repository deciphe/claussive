import assert from 'node:assert/strict';
import {createSession,trade,account,tick,quote,makeBook,liqPrice,FEE} from '../src/lib/perps-simulator.js';
const flat=()=>{const s=createSession(12);return {...s,price:30000,book:makeBook(30000)}};
let s=flat(),q=quote(s,1,2);assert.equal(q.qty,2);assert.equal(q.price,30000.75);
s=trade(s,{side:1,quantity:2,leverage:50});assert.equal(s.position.qty,2);assert.equal(s.cash,10000-60001.5*FEE);assert.equal(account(s).unrealized,-1.5);
s=tick(s,50);assert.equal(account(s).unrealized,98.5);assert.ok(s.funding>0);
const before=s;s=trade(s,{side:-1,quantity:1,reduceOnly:true});assert.equal(s.position.qty,1);assert.equal(s.position.entry,before.position.entry);assert.ok(s.realized>0);
s=trade(s,{side:-1,quantity:3});assert.equal(s.position.qty,-2);s=tick(s,-50);assert.ok(account(s).unrealized>0);
const small=trade(flat(),{side:1,quantity:1,leverage:10}),large=trade(flat(),{side:1,quantity:1,leverage:50});assert.equal(account(tick(small,50)).unrealized,account(tick(large,50)).unrealized);assert.equal(account(small).margin/account(large).margin,5);
assert.equal(trade(flat(),{side:1,quantity:50}).position,null);assert.equal(trade(flat(),{side:1,quantity:1,reduceOnly:true}).position,null);
let thin={...flat(),mode:'stressed',book:makeBook(30000,'stressed')};assert.ok(quote(thin,1,10,'IOC').qty<10);assert.equal(quote(thin,1,10,'FOK').qty,0);assert.equal(quote(thin,1,1,'IOC',.0001).qty,0);
let x=trade(flat(),{side:1,quantity:2,stop:40,take:100});x=tick(x,-50);assert.equal(x.position,null);assert.equal(x.log[0].reason,'Stop loss');
x=trade(flat(),{side:-1,quantity:2,take:40});x=tick(x,-50);assert.equal(x.position,null);assert.equal(x.log[0].reason,'Take profit');
x=trade(flat(),{side:1,quantity:16});assert.ok(liqPrice(x)<30000);x=tick(x,-400);assert.equal(x.position,null);assert.equal(x.liquidated,true);
s=trade(flat(),{side:1,quantity:2});const consumed=s.book.asks[0].qty;assert.ok(consumed<flat().book.asks[0].qty);s=trade(s,{side:-1,quantity:20,reduceOnly:true});assert.equal(s.position,null);
assert.deepEqual(tick(createSession(42)),tick(createSession(42)));
assert.equal(trade(flat(),{side:1,quantity:NaN}).position,null);
console.log('PASS: long/short P&L, fees, funding, margin, partial fills, FOK, reduce-only, reversals, stops, liquidation and deterministic tape');

let realtime=createSession(42); const historyLength=realtime.history.length;
for(let i=0;i<60;i++) realtime=tick(realtime,undefined,1);
assert.equal(realtime.seconds,60);assert.equal(realtime.minute,1);assert.equal(realtime.history.length,historyLength+1);
const held=trade(flat(),{side:1,quantity:2});
const second=tick(held,0,1),minute=tick(held,0,60);
assert.ok(Math.abs(second.funding*60-minute.funding)<1e-9);
assert.equal(tick(realtime,undefined,1).history.length,historyLength+2);
console.log('PASS: real-time seconds, one-minute candle aggregation and time-scaled funding');

// Brackets trigger at equality on each market second, both long and short.
for(const side of [1,-1]){
 let p=trade(flat(),{side,quantity:2,stop:10,take:20});
 const stopPrice=p.position.entry-side*10;
 p=tick(p,stopPrice-p.price,1);assert.equal(p.position,null);assert.equal(p.log[0].reason,'Stop loss');
 p=trade(flat(),{side,quantity:2,stop:10,take:20});
 const targetPrice=p.position.entry+side*20;
 p=tick(p,targetPrice-p.price,1);assert.equal(p.position,null);assert.equal(p.log[0].reason,'Take profit');
}
console.log('PASS: long/short TP and SL trigger at exact levels on real-time ticks');
