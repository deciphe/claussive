import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import './learn-perps.css';

const money=(n,d=0)=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const num=(n,d=2)=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});

const ACCOUNTS=[
  {size:2500,label:'$2.5K'},
  {size:5000,label:'$5K'},
  {size:10000,label:'$10K'},
  {size:25000,label:'$25K'},
];
const DLLS=[
  {value:0,label:'NO DLL'},
  {value:3,label:'3% DLL'},
  {value:4,label:'4% DLL'},
];
const MARKETS={
  NQ:{label:'NQ',name:'Nasdaq 100',price:31351.25,maxLev:50,baseSlip:.12,slipSlope:.059},
  ES:{label:'ES',name:'S&P 500',price:6750,maxLev:75,baseSlip:.06,slipSlope:.004},
};
const FEE_RATE=.000025;

function Metric({label,value,sub,tone=''}){return <div className={'lp-metric '+tone}><span>{label}</span><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>}

function Book({session}){
  const ny=session==='newyork';
  const bids=ny
    ?[{p:'4005.00',q:'lots of buyers',w:'94%'},{p:'4004.75',q:'more buyers',w:'82%'},{p:'4004.50',q:'more buyers',w:'72%'}]
    :[{p:'4005.00',q:'almost empty',w:'18%'},{p:'4002.50',q:'small pocket',w:'30%'},{p:'4000.00',q:'buyers waiting',w:'76%'}];
  return <div className={'lp-book '+(ny?'ny':'asia')}>
    <div className="lp-book-head"><span>{ny?'NEW YORK':'ASIA / OVERNIGHT'}</span><b>{ny?'MORE DEPTH':'LESS DEPTH'}</b></div>
    <div className="lp-book-grid">
      <div className="asks">
        <i style={{width:ny?'82%':'42%'}}/><span>ASKS</span>
        <i style={{width:ny?'94%':'54%'}}/>
        <i style={{width:ny?'74%':'34%'}}/>
      </div>
      <div className="mid"><small>spread</small><strong>{ny?'tighter':'wider'}</strong></div>
      <div className="bids">
        <i style={{width:ny?'88%':'38%'}}/><span>BIDS</span>
        <i style={{width:ny?'96%':'50%'}}/>
        <i style={{width:ny?'78%':'30%'}}/>
      </div>
    </div>

    <div className="lp-fill-demo">
      <div className="lp-fill-want">
        <span>YOU PRESS SELL</span>
        <strong>ES @ 4005</strong>
        <small>Market sell: fill against the buyers already waiting in the bid book.</small>
      </div>
      <div className="lp-mini-ladder">
        {bids.map((b,i)=><div key={b.p} className={'lp-mini-level '+(i===0?'wanted':'')}>
          <b>{b.p}</b><i style={{width:b.w}}/><span>{b.q}</span>
        </div>)}
      </div>
      <div className={'lp-fill-result '+(ny?'clean':'thin')}>
        <span>{ny?'DEEP BOOK':'THIN BOOK'}</span>
        <strong>{ny?'Fill stays near 4005':'Order reaches toward 4000'}</strong>
        <small>{ny?'There are buyers close to the price you wanted.':'There is not enough size near 4005, so a larger market sell can consume lower bids. That distance is slippage.'}</small>
      </div>
    </div>
  </div>
}

export default function LearnPerps(){
  const [accountSize,setAccountSize]=useState(25000);
  const [dll,setDll]=useState(0);
  const [market,setMarket]=useState('NQ');
  const [leverage,setLeverage]=useState(25);
  const [marginPct,setMarginPct]=useState(25);
  const [targetPts,setTargetPts]=useState(10);
  const [stopPts,setStopPts]=useState(30);
  const [session,setSession]=useState('newyork');

  const m=MARKETS[market];
  const effectiveLev=Math.min(leverage,m.maxLev);
  const margin=accountSize*(marginPct/100);
  const notional=margin*effectiveLev;
  const units=notional/m.price;
  const dollarsPerPoint=units;
  const entryFee=notional*FEE_RATE;
  const exitFee=notional*FEE_RATE;
  const feeTotal=entryFee+exitFee;

  const sessionSlip=session==='newyork'?.72:1.45;
  const estSlipPerSide=(m.baseSlip+Math.sqrt(Math.max(units,0))*m.slipSlope)*sessionSlip;
  const slippage=estSlipPerSide*dollarsPerPoint*2;

  const spreadPct=market==='NQ'
    ?(session==='newyork'?.000012:.000045)
    :(session==='newyork'?.000008:.00003);
  const spreadPts=m.price*spreadPct;
  const spreadCost=spreadPts*dollarsPerPoint;

  const grossTarget=dollarsPerPoint*targetPts;
  const grossStop=dollarsPerPoint*stopPts;
  const executionCost=feeTotal+spreadCost+slippage;
  const netTarget=Math.max(0,grossTarget-executionCost);
  const allInStop=grossStop+executionCost;
  const plannedR=stopPts?targetPts/stopPts:0;
  const trueR=allInStop?netTarget/allInStop:0;
  const costShare=grossTarget?executionCost/grossTarget*100:0;
  const netShare=grossTarget?Math.max(0,netTarget/grossTarget*100):0;

  const maxDD=accountSize*.06;
  const dailyLoss=dll?accountSize*(dll/100):null;
  const feePts=dollarsPerPoint?feeTotal/dollarsPerPoint:0;
  const totalCostPts=dollarsPerPoint?executionCost/dollarsPerPoint:0;
  const keptPct=Math.max(0,Math.min(100,netShare));
  const feePct=grossTarget?Math.min(100,feeTotal/grossTarget*100):0;
  const spreadPctOfTarget=grossTarget?Math.min(100,spreadCost/grossTarget*100):0;
  const slipPct=grossTarget?Math.min(100,slippage/grossTarget*100):0;
  const barFloor=60;
  const barRange=100-barFloor;
  const barKeepPct=Math.max(0,(keptPct-barFloor)/barRange*100);
  const barFeePct=Math.max(0,feePct/barRange*100);
  const barSpreadPct=Math.max(0,spreadPctOfTarget/barRange*100);
  const barSlipPct=Math.max(0,slipPct/barRange*100);
  const barGoalPct=(95-barFloor)/barRange*100;
  const tuneState=keptPct>=95?'BEAUTIFUL!':keptPct>=85?'ALMOST THERE':'KEEP EXPLORING';
  const tuneMood=keptPct>=95?'glow':keptPct>=85?'near':'far';

  function chooseMarket(next){
    setMarket(next);
    setLeverage(v=>Math.min(v,MARKETS[next].maxLev));
  }

  return <main className="learnperps"><div className="learn-shell">
    <nav className="learn-nav"><a href="#" className="gp">GP.</a><span>THE BOOK</span><a href="#leaderboard">Leaderboard <ArrowUpRight size={13}/></a></nav>

    <header className="lp-hero">
      <span>VEST · NQ + ES</span>
      <h1>THE BOOK<br/><em>Execution is part of the trade.</em></h1>
      <p>Learn what actually happens between pressing buy or sell and getting filled — size, spread, slippage, fees and the real dollars left after execution.</p>
      <div className="lp-hero-doodles"><i>+</i><b>↗</b><em>◎</em></div>
    </header>

    <div className="lp-vest-ref-wrap">
      <a className="lp-vest-ref" href="https://next.vestmarkets.com/r/isgigaprop" target="_blank" rel="sponsored noopener noreferrer" aria-label="Open Vest with GIGAPROP referral for 5% off">
        <img src="/brands/vest-symbol.svg" alt=""/>
        <span><strong>Vest</strong><small>GP referral</small></span>
        <b>5% OFF</b>
        <ArrowUpRight size={15}/>
      </a>
      <small>Manual checkout code: GIGA</small>
    </div>

    <section className="lp-config">
      <div className="lp-section-tag">01 · YOUR ACCOUNT</div>
      <div className="lp-config-head"><h2>Match your Vest account.</h2><p>The examples below use this setup.</p></div>
      <div className="lp-config-grid">
        <div className="lp-config-group"><span>ACCOUNT</span><div>{ACCOUNTS.map(a=><button key={a.size} className={accountSize===a.size?'active':''} onClick={()=>setAccountSize(a.size)}>{a.label}</button>)}</div></div>
        <div className="lp-config-group"><span>DAILY LOSS RULE</span><div>{DLLS.map(d=><button key={d.value} className={dll===d.value?'active':''} onClick={()=>setDll(d.value)}>{d.label}</button>)}</div></div>
        <div className="lp-config-group market"><span>MARKET</span><div>{Object.entries(MARKETS).map(([k,v])=><button key={k} className={market===k?'active':''} onClick={()=>chooseMarket(k)}><b>{v.label}</b><small>{v.maxLev}× max</small></button>)}</div></div>
      </div>
      <div className="lp-account-strip">
        <Metric label="ACCOUNT" value={money(accountSize,0)}/>
        <Metric label="MAX DRAWDOWN" value={money(maxDD,0)} sub="6%"/>
        <Metric label="DAILY LOSS" value={dll?money(dailyLoss,0):'NONE'} sub={dll?dll+'%':'no DLL'}/>
        <Metric label={market+' MAX'} value={m.maxLev+'×'} sub="leverage"/>
      </div>
    </section>

    <section className="lp-ticket-section">
      <div className="lp-section-tag">02 · THE ORDER TICKET</div>
      <div className="lp-ticket-copy"><h2>Enter size in the unit that makes sense to you.</h2><p>Vest’s Amount field can be switched from <b>USD</b> to <b>{market}</b>. If you think in dollars per point, switching to {market} makes the relationship easier to see.</p></div>
      <div className="lp-ticket-card">
        <div className="lp-ticket-top"><span>AMOUNT</span><div><b>{num(units,2)}</b><em>{market}⌄</em></div></div>
        <div className="lp-ticket-pills"><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
        <div className="lp-ticket-lines"><p><span>Est. Slippage</span><b>{money(estSlipPerSide*dollarsPerPoint,2)} / side</b></p><p><span>Round-trip fee · entry + exit</span><b>{money(entryFee,2)} + {money(exitFee,2)} = {money(feeTotal,2)} RT</b></p><p><span>Order Value</span><b>{money(notional,0)}</b></p></div>
      </div>
      <div className="lp-ticket-note"><span>YOUR CURRENT SIZE</span><strong>{num(units,2)} {market} = {money(dollarsPerPoint,2)} / point</strong></div>
    </section>

    <section className="lp-costs">
      <div className="lp-section-tag">03 · COST OF DOING BUSINESS</div>
      <div className="lp-costs-copy"><h2>Three normal execution costs.</h2><p>They are not “bad.” They are simply part of turning an order into a fill.</p></div>
      <div className="lp-cost-cards">
        <div className="fee"><span>ROUND-TRIP FEE</span><b>0.0050% RT</b><p>Total fee for entry + exit: 0.0025% each side.</p></div>
        <div className="spread"><span>SPREAD</span><b>{num(spreadPts,2)} pts</b><p>The distance between the best bid and best ask.</p></div>
        <div className="slip"><span>SLIPPAGE</span><b>{num(estSlipPerSide,2)} pts</b><p>An estimate of how far the fill may travel through the book.</p></div>
      </div>
      <div className="lp-cost-equation"><span>ENTRY FEE</span><i>+</i><span>EXIT FEE</span><i>+</i><span>SPREAD</span><i>+</i><span>SLIPPAGE</span><b>= {money(executionCost,2)} estimated round-trip cost</b></div>
    </section>

    <section className="lp-session">
      <div className="lp-section-tag">04 · WHEN YOU TRADE</div>
      <div className="lp-session-copy"><h2>More people in the book usually means cleaner fills.</h2><p>During New York hours, NQ and ES usually have more participation near the current price. More resting bids and asks can mean a tighter spread and less distance for an order to travel. Asian/overnight hours can be thinner, so the same size may cross more price levels.</p></div>
      <div className="lp-session-picker"><button className={session==='newyork'?'active':''} onClick={()=>setSession('newyork')}>NEW YORK</button><button className={session==='asia'?'active':''} onClick={()=>setSession('asia')}>ASIA / OVERNIGHT</button></div>
      <Book session={session}/>
      <div className="lp-book-caption"><b>Think of the book like shelves.</b><span>A market order takes what is already on the shelf. If the shelf near 4005 is thin, the order keeps reaching lower until it finds enough buyers. That is why the same order can fill closer to 4005 in New York and farther away in a thin overnight book.</span></div>
    </section>

    <section className="lp-playground">
      <div className="lp-section-tag">05 · ORDER TUNER</div>
      <div className="lp-play-head"><h2>Make the order cleaner.</h2><p>Move the controls and watch how much of the target is left after normal execution costs.</p></div>

      <div className={"lp-tuner-hero mood-"+tuneMood}>
        <div className="lp-true-r">
          <span>TRUE R</span>
          <strong>{num(trueR,2)}R</strong>
          <small>{num(plannedR,2)}R before estimated execution costs</small>
        </div>

        <div className="lp-kept">
          <div className="lp-tuner-magic" aria-hidden="true">{tuneMood==="far"?<span className="lp-sad-mark">×</span>:<><span className="star s1">✦</span><span className="star s2">✧</span><span className="star s3">✳</span><span className="star s4">✦</span></>}</div>
          <div className="lp-kept-head">
            <div><span>PROFIT KEPT</span><strong>{num(keptPct,0)}%</strong></div>
            <b>{tuneState}</b>
          </div>
          <div className="lp-scale-meta">
            <span>FULL SCALE · 0–100</span>
            <b>FOCUS · 60–100%</b>
          </div>
          <div className="lp-kept-context" aria-hidden="true">
            <div className="lp-kept-context-fill" style={{width:keptPct+'%'}}/>
            <i className="lp-kept-context-goal"/>
            <span className="c0">0</span><span className="c60">60</span><span className="c95">95</span><span className="c100">100</span>
          </div>
          <div className="lp-kept-bar" aria-label="Detailed profit kept view focused on 60 to 100 percent">
            <i className="lp-axis-break" aria-hidden="true">//</i>
            <div className="keep" style={{width:barKeepPct+'%'}} aria-label={'Kept '+num(keptPct,1)+'%'}/>
            <div className="fee" style={{width:barFeePct+'%'}} aria-label={'Round-trip fee '+money(feeTotal,2)}/>
            <div className="spread" style={{width:barSpreadPct+'%'}} aria-label={'Spread '+money(spreadCost,2)}/>
            <div className="slip" style={{width:barSlipPct+'%'}} aria-label={'Slippage '+money(slippage,2)}/>
            <i className="goal" style={{left:barGoalPct+'%'}} title="95% goal"><em>95</em></i>
            <span className="z60">60</span><span className="z80">80</span><span className="z100">100</span>
          </div>
          <div className="lp-cost-legend" aria-label="Execution cost legend">
            <span className="kept"><i/>KEPT <b>{num(keptPct,1)}%</b></span>
            <span className="fee"><i/>FEE · ROUND TRIP <b>{money(feeTotal,2)}</b></span>
            <span className="spread"><i/>SPREAD <b>{money(spreadCost,2)}</b></span>
            <span className="slip"><i/>SLIP · ROUND TRIP <b>{money(slippage,2)}</b></span>
          </div>
          <p>Detailed view expands 60–100% so execution costs stay visible. FEE and SLIP are shown as round-trip totals: entry + exit.</p>
        </div>
      </div>

      <div className="lp-tuner-controls">
        <label>
          <span>LEVERAGE</span><strong>{effectiveLev}×</strong>
          <input type="range" min="1" max={m.maxLev} step="1" value={effectiveLev} onChange={e=>setLeverage(+e.target.value)}/>
          <small>More leverage = bigger position for the same margin.</small>
        </label>
        <label>
          <span>MARGIN USED</span><strong>{marginPct}%</strong>
          <input type="range" min="5" max="100" step="5" value={marginPct} onChange={e=>setMarginPct(+e.target.value)}/>
          <small>More margin = bigger position.</small>
        </label>
        <label>
          <span>TAKE PROFIT</span><strong>{targetPts} pts</strong>
          <input type="range" min="2" max="80" step="1" value={targetPts} onChange={e=>setTargetPts(+e.target.value)}/>
          <small>More target points give the costs more room to spread out.</small>
        </label>
        <label>
          <span>STOP LOSS · {market}</span><div className="lp-edit-stop"><input type="number" aria-label="Stop loss distance in points" min="0.25" max="1000" step="0.25" value={stopPts} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=.25&&v<=1000)setStopPts(v)}}/><strong>pts</strong></div>
          <small>Starts at 30 pts. Enter any stop distance.</small>
        </label>
      </div>

      <div className="lp-tuner-footer">
        <div><span>GROSS TARGET</span><b>{money(grossTarget,2)}</b></div>
        <div><span>EST. COST</span><b>{money(executionCost,2)}</b></div>
        <div><span>EST. NET</span><b>{money(netTarget,2)}</b></div>
      </div>
    </section>

    <section className="lp-finish">
      <span>THAT’S THE MODEL</span>
      <h2>Account → margin → leverage → size → target → execution cost.</h2>
      <p>Use the live Vest order book and the ticket’s estimated slippage before you place the order. Those live numbers matter more than any static example on this page.</p>
    </section>

    <footer><b>GP.</b><span>#thebook</span><small>Educational reference. Vest displays a 0.0025% fee per side. Spread and slippage change with the live book.</small></footer>
  </div></main>
}