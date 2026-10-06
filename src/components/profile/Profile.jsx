import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,RefreshCw,ArrowUpRight,Share2,Check,Trophy,Flame,Zap,ShieldCheck,LockKeyhole} from 'lucide-react';
import {canonicalTraderWallet,traderWallets} from '../../lib/trader-wallets.js';
import {FEATURED_TRADERS} from '../../lib/trader-profiles.js';
import {VEST_CHAINS,FLOW_SOURCES,FLOW_CONFIGS} from '../../lib/flow-config.js';
import {combineFlows} from '../../lib/flow-metrics.js';
import {isPayoutRecipientTransfer} from '../../lib/flow-classification.js';
import './profile.css';

const ROOT='https://raw.githubusercontent.com/deciphe/thepayoutlab/vestflow-data/';
const PROFILE_API='https://gigaprop-profiles.johnhuska1260335.chatgpt.site/api';
const usd=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
const money=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const short=a=>a?a.slice(0,6)+'…'+a.slice(-4):'';
const fmtDate=s=>s?new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
const fmtGap=ms=>{
  if(!Number.isFinite(ms)||ms<=0)return '—';
  const h=ms/3600000;
  if(h<24)return h.toFixed(h<10?1:0)+'h';
  return (h/24).toFixed(h<48?1:0)+'d';
};
async function read(path,signal){for(const root of [ROOT,'/data/']){try{const r=await fetch(root+path+'?t='+Math.floor(Date.now()/60000),{signal,cache:'no-store'});if(r.ok)return await r.json();}catch{if(signal?.aborted)throw Error('Cancelled')}}throw Error('Snapshot unavailable')}

function RecordTile({label,value,sub,icon:Icon,accent=''}) {
  return <div className={'pf-record-tile '+accent}>
    {Icon&&<Icon size={14}/>}
    <span>{label}</span>
    <strong>{value}</strong>
    {sub&&<small>{sub}</small>}
  </div>
}

export default function Profile(){
  const params=new URLSearchParams(window.location.hash.split('?')[1]||'');
  const [input,setInput]=useState(params.get('wallet')||'');
  const [wallet,setWallet]=useState(params.get('wallet')||'');
  const [transfers,setTransfers]=useState([]);
  const [asOf,setAsOf]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  const [profile,setProfile]=useState(null);
  const [identityChecked,setIdentityChecked]=useState(false);

  useEffect(()=>{if(!wallet)return;const c=new AbortController();setLoading(true);setError('');setIdentityChecked(false);
    const canonical=canonicalTraderWallet(wallet.toLowerCase());
    const linkedWallets=traderWallets(canonical).map(x=>x.toLowerCase());
    const editorial=FEATURED_TRADERS[canonical]||FEATURED_TRADERS[linkedWallets.find(a=>FEATURED_TRADERS[a])];
    setProfile(editorial||null);
    (async()=>{try{
      let remote=null;
      try{
        const r=await fetch(PROFILE_API+'/profiles?addresses='+encodeURIComponent(linkedWallets.join(',')),{signal:c.signal});
        if(r.ok){
          const d=await r.json();
          remote=Array.isArray(d.profiles)&&d.profiles.length?d.profiles[0]:null;
          if(!c.signal.aborted&&remote)setProfile({...remote,...editorial});
        }
      }catch{}
      if(!c.signal.aborted)setIdentityChecked(true);

      const vestSnaps=await Promise.all(VEST_CHAINS.map(s=>read(s.slug+'.json',c.signal)));
      const vestData=combineFlows(vestSnaps,VEST_CHAINS);
      let breakoutSnap=null;
      try{breakoutSnap=await read(FLOW_CONFIGS.breakout.slug+'.json',c.signal)}catch{}
      const linked=new Set(linkedWallets);
      const seen=new Set(),rows=[];
      const collect=(data,sources,firm)=>{
        if(!data)return;
        for(const t of data.transfers||[]){
          const id=`${firm}:${t.chain||sources[0]?.chain||''}:${t.hash}:${t.logIndex??''}`;
          let payout=false;
          try{payout=isPayoutRecipientTransfer(t,sources)}catch{payout=t.direction==='out'&&Number(t.amount||0)>0}
          if(seen.has(id)||!payout)continue;
          if(FLOW_SOURCES.some(s=>s.chain===(t.chain||sources[0]?.chain)&&s.wallet.toLowerCase()===(t.to||'').toLowerCase()))continue;
          if(!linked.has((t.to||'').toLowerCase()))continue;
          const amount=t.raw!=null?Number(BigInt(t.raw))/1e6:Number(t.amount||0);
          if(!Number.isFinite(amount)||amount<=0)continue;
          seen.add(id);rows.push({...t,id,firm,explorer:t.explorer||sources[0]?.explorer||'',amount});
        }
      };
      collect(vestData,VEST_CHAINS,'Vest');
      collect(breakoutSnap,[FLOW_CONFIGS.breakout],'Breakout');
      rows.sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
      const latest=[vestData.windowEnd||vestData.updatedAt,breakoutSnap?.windowEnd||breakoutSnap?.updatedAt].filter(Boolean).sort().at(-1)||'';
      if(!c.signal.aborted){setTransfers(rows);setAsOf(latest)}
    }catch{if(!c.signal.aborted){setIdentityChecked(true);setError('Could not load the current lifetime payout record.')}}finally{if(!c.signal.aborted)setLoading(false)}})();
    return()=>c.abort();
  },[wallet]);

  const stats=useMemo(()=>{
    const total=transfers.reduce((s,t)=>s+t.amount,0),count=transfers.length;
    const chronological=[...transfers].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
    const dayMap=new Map(),dayCount=new Map(),monthMap=new Map();
    transfers.forEach(t=>{
      const day=t.timestamp.slice(0,10),month=t.timestamp.slice(0,7);
      dayMap.set(day,(dayMap.get(day)||0)+t.amount);
      dayCount.set(day,(dayCount.get(day)||0)+1);
      monthMap.set(month,(monthMap.get(month)||0)+t.amount);
    });
    const days=[...dayMap.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
    const bestDay=days.reduce((a,b)=>b[1]>a[1]?b:a,['',0]);
    const bestMonth=[...monthMap.entries()].reduce((a,b)=>b[1]>a[1]?b:a,['',0]);
    const largest=transfers.reduce((m,t)=>Math.max(m,t.amount),0);
    const mostPayoutsDay=[...dayCount.entries()].reduce((a,b)=>b[1]>a[1]?b:a,['',0]);

    let run=0,bestStreak=0,prev=null,currentStreak=0;
    for(const [d] of days){
      const n=Date.parse(d+'T00:00:00Z');
      run=prev!==null&&n-prev===86400000?run+1:1;
      bestStreak=Math.max(bestStreak,run);
      prev=n;
    }
    if(days.length){
      currentStreak=1;
      for(let i=days.length-1;i>0;i--){
        const a=Date.parse(days[i][0]+'T00:00:00Z');
        const b=Date.parse(days[i-1][0]+'T00:00:00Z');
        if(a-b===86400000)currentStreak++;else break;
      }
    }

    let best7=0,best7Start='';
    for(let i=0;i<chronological.length;i++){
      const start=Date.parse(chronological[i].timestamp),end=start+7*86400000;
      let sum=0;
      for(let j=i;j<chronological.length;j++){
        const ts=Date.parse(chronological[j].timestamp);
        if(ts>=end)break;
        sum+=chronological[j].amount;
      }
      if(sum>best7){best7=sum;best7Start=chronological[i].timestamp}
    }

    const gaps=[];
    for(let i=1;i<chronological.length;i++)gaps.push(Date.parse(chronological[i].timestamp)-Date.parse(chronological[i-1].timestamp));
    const fastestGap=gaps.length?Math.min(...gaps):null;
    const avgGap=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:null;

    const byFirm={Vest:{total:0,count:0,largest:0},Breakout:{total:0,count:0,largest:0}};
    transfers.forEach(t=>{
      const f=byFirm[t.firm]||{total:0,count:0,largest:0};
      f.total+=t.amount;f.count+=1;f.largest=Math.max(f.largest,t.amount);byFirm[t.firm]=f;
    });
    const fiveFigure=transfers.filter(t=>t.amount>=10000).length;
    return {
      total,count,avg:count?total/count:0,activeDays:dayMap.size,
      bestDay:bestDay[1],bestDayDate:bestDay[0],
      largest,bestStreak,currentStreak,
      first:chronological[0]?.timestamp,last:chronological.at(-1)?.timestamp,
      bestMonth:bestMonth[1],bestMonthKey:bestMonth[0],
      best7,best7Start,
      mostPayoutsDay:mostPayoutsDay[1],mostPayoutsDayDate:mostPayoutsDay[0],
      fastestGap,avgGap,byFirm,fiveFigure
    };
  },[transfers]);

  const approved=identityChecked&&!!profile;

  function go(e){e?.preventDefault();const w=input.trim().toLowerCase();if(!/^0x[a-f0-9]{40}$/.test(w)){setError('Enter a complete 0x payout wallet.');return}setWallet(w);history.replaceState(null,'','#vip?wallet='+w)}
  async function shareProfile(){
    const url=location.origin+location.pathname+'#vip?wallet='+canonicalTraderWallet(wallet);
    const text='My VIP lifetime payout record on GIGAPROP';
    try{
      if(navigator.share){await navigator.share({title:'VIP · GIGAPROP',text,url});return}
      await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),1800);
    }catch{}
  }

  return <main className="profile-page"><div className="pf-shell">
    {!wallet?
    <section className="pf-entry pf-entry-club">
      <div className="pf-club-sigil"><b>GP.</b><i/></div>
      <div className="pf-club-code">PRIVATE / 01</div>
      <div className="pf-club-ghost">MEMBERS</div>
      <div className="pf-club-copy">
        <span>YOU KNOW WHY YOU'RE HERE.</span>
        <h1>YOU KNOW<br/><em>WHY YOU'RE HERE.</em></h1>
      </div>
      <form onSubmit={go} className="pf-club-door pf-club-door-credential">
        <div className="pf-club-credential-label">MEMBER WALLET</div>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="0x…" autoFocus aria-label="VIP wallet"/>
        <button aria-label="Enter"><ArrowRight size={17}/></button>
      </form>
      <div className="pf-club-whisper"><span>NO SIGNUP</span><i/><span>NO SEARCH</span><i/><span>NO DIRECTORY</span></div>
      {error&&<div className="pf-error pf-club-error">{error}</div>}
    </section>:
    <>
      <nav className="pf-nav"><a href="#" className="pf-brand">GP.</a><span>VIP</span><a href="#leaderboard">Leaderboard <ArrowUpRight size={13}/></a></nav>

      {!identityChecked?
        <section className="pf-vip-check"><RefreshCw size={18}/> Checking member record…</section>
      :!approved?
        <section className="pf-vip-gate">
          <div className="pf-gate-ghost" aria-hidden="true">PRIVATE</div>
          <div className="pf-gate-lock"><LockKeyhole size={26}/></div>
          <span>VIP / VALIDATED RECORD</span>
          <h1>PRIVATE<br/><em>RECORD.</em></h1>
          <p>This wallet is not on the validated member list. VIP lifetime records are reserved for submitted leaderboard traders.</p>
          <div className="pf-gate-rule"><i/><b>ACCESS BLOCKED</b><i/></div>
          <a href="#leaderboard" className="pf-gate-cta">Return to leaderboard <ArrowUpRight size={14}/></a>
        </section>
      :
      <section className="pf-stage pf-poster pf-lifetime">
        {profile?.avatar&&<img className="pf-stage-portrait" src={profile.avatar} alt=""/>}
        <div className="pf-poster-noise"/>

        <div className="pf-poster-topline">
          <span>VIP / LIFETIME RECORD</span><i/>
          <b><ShieldCheck size={11}/> VALIDATED</b>
        </div>

        <button className="pf-stage-share" onClick={shareProfile}>{copied?<Check size={14}/>:<Share2 size={14}/>} {copied?'COPIED':'SHARE'}</button>

        <div className="pf-poster-name">
          <h1>{profile?.displayName||profile?.username||short(canonicalTraderWallet(wallet))}</h1>
          <div className="pf-stage-meta">
            {profile?.username&&<a href={profile.social||('https://x.com/'+profile.username)} target="_blank" rel="noreferrer">@{profile.username}</a>}
            {profile?.tag&&<a className="pf-stage-tag" href={/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(profile.tag)?'https://'+profile.tag:undefined} target={/^[a-z0-9.-]+\.[a-z]{2,}/i.test(profile.tag)?'_blank':undefined} rel="noreferrer">{profile.tag}</a>}
          </div>
        </div>

        <div className="pf-poster-money pf-shrine-total">
          <span>VERIFIED LIFETIME · VEST + BREAKOUT</span>
          <strong>{loading?'—':usd(stats.total)}</strong>
          <small>{stats.first?'TRACKED SINCE '+new Date(stats.first).toLocaleDateString(undefined,{month:'short',year:'numeric'}).toUpperCase():'ALL VERIFIED PAYOUTS'}</small>
        </div>

        <div className="pf-firm-monuments">
          <div className="pf-firm-monument vest">
            <span>VEST · LIFETIME</span>
            <strong>{loading?'—':usd(stats.byFirm?.Vest?.total)}</strong>
            <small>{stats.byFirm?.Vest?.count||0} PAYOUTS · LARGEST {usd(stats.byFirm?.Vest?.largest)}</small>
          </div>
          <div className="pf-firm-monument breakout">
            <span>BREAKOUT · LIFETIME</span>
            <strong>{loading?'—':usd(stats.byFirm?.Breakout?.total)}</strong>
            <small>{stats.byFirm?.Breakout?.count||0} PAYOUTS · LARGEST {usd(stats.byFirm?.Breakout?.largest)}</small>
          </div>
        </div>

        <div className="pf-accolades">
          <div className="pf-accolade hero"><span>LIFETIME STATUS</span><b>{stats.total>=200000?'$200K+ CLUB':stats.total>=100000?'$100K+ CLUB':'VERIFIED'}</b><small>Combined tracked payouts</small></div>
          <div className="pf-accolade"><span>FIVE-FIGURE HITS</span><b>{stats.fiveFigure}</b><small>$10K+ individual payouts</small></div>
          <div className="pf-accolade"><span>FIRMS CLEARED</span><b>{[stats.byFirm?.Vest?.count,stats.byFirm?.Breakout?.count].filter(Boolean).length}</b><small>Vest + Breakout</small></div>
          <div className="pf-accolade"><span>VERIFIED PAYOUTS</span><b>{stats.count}</b><small>onchain records</small></div>
        </div>

        <div className="pf-vip-ribbon">
          <div><span>AVG PAYOUT</span><b>{money(stats.avg)}</b></div>
          <div><span>ACTIVE DAYS</span><b>{stats.activeDays}</b></div>
          <div><span>BEST STREAK</span><b>{stats.bestStreak}D</b></div>
          <div><span>LARGEST</span><b>{usd(stats.largest)}</b></div>
        </div>

        <div className="pf-record-shelf">
          <RecordTile icon={Trophy} accent="gold" label="BEST DAY" value={usd(stats.bestDay)} sub={stats.bestDayDate?fmtDate(stats.bestDayDate+'T00:00:00Z'):''}/>
          <RecordTile icon={Zap} label="BEST 7 DAYS" value={usd(stats.best7)} sub={stats.best7Start?'from '+fmtDate(stats.best7Start):''}/>
          <RecordTile icon={Flame} accent="warm" label="BEST MONTH" value={usd(stats.bestMonth)} sub={stats.bestMonthKey||''}/>
          <RecordTile label="LARGEST PAYOUT" value={usd(stats.largest)} sub="single payout"/>
          <RecordTile label="CURRENT STREAK" value={stats.currentStreak+'D'} sub="consecutive payout days"/>
          <RecordTile label="MOST IN ONE DAY" value={stats.mostPayoutsDay+' payouts'} sub={stats.mostPayoutsDayDate?fmtDate(stats.mostPayoutsDayDate+'T00:00:00Z'):''}/>
          <RecordTile label="FASTEST GAP" value={fmtGap(stats.fastestGap)} sub="payout to payout"/>
          <RecordTile label="AVG GAP" value={fmtGap(stats.avgGap)} sub="between payouts"/>
          <RecordTile label="FIRST PAYOUT" value={fmtDate(stats.first)} sub="record began"/>
          <RecordTile label="LATEST PAYOUT" value={fmtDate(stats.last)} sub="most recent"/>
        </div>

        <div className="pf-payout-wall">
          <div className="pf-wall-head">
            <div><span>LIFETIME ARCHIVE</span><h2>Every payout.</h2></div>
            <small>{stats.count} VERIFIED RECORDS</small>
          </div>
          <div className="pf-wall-grid">
            {transfers.map((t,i)=><a key={t.id} className="pf-payout-chip" href={(t.explorer||'#')+(t.explorer?'/tx/'+t.hash:'')} target="_blank" rel="noreferrer">
              <span>{t.firm?.toUpperCase()||'PAYOUT'} · {String(stats.count-i).padStart(2,'0')}</span>
              <strong>{usd(t.amount)}</strong>
              <small>{fmtDate(t.timestamp)}</small>
            </a>)}
          </div>
        </div>

        <div className="pf-club-proof">
          <span>{traderWallets(canonicalTraderWallet(wallet)).length>1?traderWallets(canonicalTraderWallet(wallet)).length+' LINKED WALLETS · PERSONAL LIFETIME':'PERSONAL LIFETIME RECORD'}</span>
          <small>{asOf?'ONCHAIN · '+new Date(asOf).toLocaleDateString().toUpperCase():''}</small>
        </div>
      </section>}

      <div className="pf-switch-row">
        <form onSubmit={go} className="pf-wallet-switch"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Paste another wallet"/><button><ArrowRight size={14}/></button></form>
      </div>

      {loading&&approved?<div className="pf-loading pf-inline-state"><RefreshCw size={18}/> Reading lifetime record…</div>:error&&approved?<div className="pf-error pf-inline-state">{error}</div>:null}
    </>}
    <footer className="pf-signature"><b>GP.</b><span>VIP / PERSONAL LIFETIME PAYOUT RECORD</span></footer>
  </div></main>
}