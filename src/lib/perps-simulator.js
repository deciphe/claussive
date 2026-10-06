// Independent training engine. No exchange connection; all prices and depth are synthetic.
export const FEE = 0.000025;
export const MMR = 0.01;
export const FUNDING = 0.0000057; // fixed hourly training rate, not a live quote
export const START = 30700;
export const LIQUIDITY = {
  regular: {name:'Regular', spread:1.5, step:0.5, depth:150000},
  thin: {name:'Thin', spread:8, step:2, depth:15000},
  stressed: {name:'Stressed', spread:20, step:5, depth:3000},
};
export const roundQty = q => Math.floor((q + 1e-10)*10000)/10000;
function random(seed) { const n=(Math.imul(seed,1664525)+1013904223)>>>0;return [n,n/4294967296]; }
export function makeBook(price,mode='regular',minute=0) {
  const c=LIQUIDITY[mode];
  return Object.fromEntries([['asks',1],['bids',-1]].map(([key,d])=>[key,Array.from({length:8},(_,i)=>{
    const p=Math.round((price+d*(c.spread/2+i*c.step))*100)/100;
    return {price:p,qty:roundQty(c.depth*(1+i*.18)*(1+.12*Math.sin(minute+i*2))/p)};
  })]));
}
export function createSession(seed=123456,capital=10000) {
  let s={seed:seed>>>0,price:START,seconds:0,minute:0,history:[],cash:capital,initial:capital,position:null,fees:0,funding:0,realized:0,log:[],mode:'regular',message:'Choose your size. Your first fill starts here.',liquidated:false};
  // A warm-up tape, with no account activity, so the chart is useful immediately.
  for(let i=0;i<70;i++)s=walk(s);
  return {...s,seconds:0,minute:0,book:makeBook(s.price),history:s.history.map((b,i)=>({...b,minute:i-69}))};
}
export function account(s) {
  const p=s.position, qty=p?.qty||0, unrealized=qty*(s.price-(p?.entry||s.price));
  const notional=Math.abs(qty)*s.price, equity=s.cash+unrealized;
  return {unrealized,notional,equity,margin:p?notional/p.leverage:0,maintenance:notional*MMR,available:Math.max(0,equity-(p?notional/p.leverage:0)),effective:equity>0?notional/equity:0};
}
export function liqPrice(s) {
  const p=s.position;if(!p)return null;
  const price=(s.cash-p.qty*p.entry)/(Math.abs(p.qty)*MMR-p.qty);
  return price>0?price:null;
}
export function quote(s,side,quantity,tif='IOC',tolerance=.001) {
  let left=roundQty(quantity),value=0,filled=0;const fills=[];
  if(!Number.isFinite(left)||left<=0)return {qty:0,price:0,value:0,fee:0,fills:[],remaining:0};
  for(const [index,level] of s.book[side===1?'asks':'bids'].entries()){
    if(side*(level.price-s.price)/s.price>tolerance+1e-12)break;
    const qty=Math.min(left,level.qty);if(qty<=0)continue;
    fills.push({index,qty,price:level.price});filled+=qty;value+=qty*level.price;left=Math.max(0,left-qty);if(left<.00005)break;
  }
  if(tif==='FOK'&&left>=.00005)return {qty:0,price:0,value:0,fee:0,fills:[],remaining:quantity};
  return {qty:filled,price:filled?value/filled:0,value,fee:value*FEE,fills,remaining:left};
}
export function trade(s,{side,quantity,leverage=50,tif='IOC',tolerance=.001,reduceOnly=false,stop=0,take=0,reason='Market'}) {
  const reject=message=>({...s,message});
  if(![1,-1].includes(side)||!Number.isFinite(quantity)||quantity<=0||!Number.isFinite(leverage)||leverage<1||leverage>50)return reject('Enter a valid size and leverage.');
  if(s.cash<=0&&!s.position)return reject('Practice balance exhausted. Reset the session to try again.');
  const old=s.position;
  if(reduceOnly){if(!old||Math.sign(old.qty)===side)return reject('Reduce only needs an existing position in the opposite direction.');quantity=Math.min(quantity,Math.abs(old.qty));}
  const f=quote(s,side,quantity,tif,tolerance);
  if(!f.qty)return reject(tif==='FOK'?'Not filled: the full size is unavailable within your price protection.':'Not filled: no liquidity within your price protection.');
  const signed=f.qty*side,oq=old?.qty||0;
  let qty=oq+signed,entry=f.price,realized=0;
  if(Math.abs(qty)<.00005)qty=0;
  if(oq&&Math.sign(oq)===side)entry=(Math.abs(oq)*old.entry+f.value)/(Math.abs(oq)+f.qty);
  else if(oq){realized=Math.min(Math.abs(oq),f.qty)*(f.price-old.entry)*Math.sign(oq);if(qty&&Math.sign(qty)===Math.sign(oq))entry=old.entry;}
  const increasing=!oq||Math.abs(qty)>Math.abs(oq)||qty*oq<0;
  const position=qty?{qty,entry,leverage:old&&qty*oq>0?old.leverage:leverage,stop:old&&qty*oq>0?old.stop:stop,take:old&&qty*oq>0?old.take:take}:null;
  if(position&&(!Number.isFinite(position.stop)||!Number.isFinite(position.take)||position.stop<0||position.take<0))return reject('Use positive point distances for TP/SL.');
  let next={...s,position,cash:s.cash+realized-f.fee,realized:s.realized+realized,fees:s.fees+f.fee};
  const a=account(next);
  if(increasing&&a.equity+1e-7<a.margin)return reject('Not enough margin after fees and the fill. Reduce your order size.');
  const key=side===1?'asks':'bids';
  next.book={...s.book,[key]:s.book[key].map((l,i)=>({...l,qty:Math.max(0,l.qty-(f.fills.find(x=>x.index===i)?.qty||0))}))};
  const event={id:s.minute+'-'+s.log.length,minute:s.minute,side,qty:f.qty,price:f.price,fee:f.fee,realized,reason,partial:f.remaining>=.00005};
  return {...next,log:[event,...s.log].slice(0,80),message:`${reason}: ${side===1?'bought':'sold'} ${f.qty.toFixed(4)} units at ${f.price.toFixed(2)}.${f.remaining>=.00005?' Partial fill — unfilled size cancelled.':''}`};
}
function walk(s,shock,seconds=60) {
  let seed,u,v;[seed,u]=random(s.seed);[seed,v]=random(seed);
  // Diffusion scales with elapsed time: 1x is one market second per wall second.
  const change=shock??Math.sqrt(-2*Math.log(Math.max(u,1e-9)))*Math.cos(2*Math.PI*v)*16*Math.sqrt(seconds/60);
  const price=Math.max(100,Math.round((s.price+change)*100)/100);
  const elapsed=(s.seconds||0)+seconds,minute=Math.floor(elapsed/60);
  const bucket=Math.ceil(elapsed/60),last=s.history.at(-1);
  const same=last?.minute===bucket;
  const bar={open:same?last.open:s.price,close:price,high:Math.max(same?last.high:s.price,price),low:Math.min(same?last.low:s.price,price),minute:bucket};
  return {...s,seed,price,seconds:elapsed,minute,history:[...(same?s.history.slice(0,-1):s.history),bar].slice(-110)};
}
export function tick(s,shock,seconds=60) {
  let n=walk(s,shock,seconds);n.book=makeBook(n.price,n.mode,n.minute);
  if(!n.position)return n;
  const funding=n.position.qty*n.price*FUNDING*seconds/3600;
  n={...n,cash:n.cash-funding,funding:n.funding+funding};
  const p=n.position,a=account(n);
  if(a.equity<=a.maintenance){
    // Explicit training simplification: full close at synthetic market, not Vest's partial liquidation engine.
    const back={...n,book:makeBook(n.price,'regular',n.minute)};
    const key=p.qty>0?'bids':'asks';back.book[key][0].qty=Math.abs(p.qty);
    n=trade(back,{side:-Math.sign(p.qty),quantity:Math.abs(p.qty),reduceOnly:true,tolerance:1,reason:'Training liquidation'});
    return {...n,liquidated:true,message:'Maintenance threshold hit. Training liquidation closed the position. Vest may partially liquidate instead.'};
  }
  const points=(n.price-p.entry)*Math.sign(p.qty);
  if((p.stop>0&&points<=-p.stop)||(p.take>0&&points>=p.take))return trade(n,{side:-Math.sign(p.qty),quantity:Math.abs(p.qty),reduceOnly:true,tolerance:1,reason:points<0?'Stop loss':'Take profit'});
  return n;
}
export function reducer(s,a) {
  if(a.type==='tick')return tick(s,a.shock,a.seconds??60);
  if(a.type==='trade')return trade(s,a);
  if(a.type==='mode')return {...s,mode:a.mode,book:makeBook(s.price,a.mode,s.minute)};
  if(a.type==='reset')return createSession(a.seed,a.capital);
  return s;
}
