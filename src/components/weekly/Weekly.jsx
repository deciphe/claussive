import {canonicalTraderWallet,traderWallets} from '../../lib/trader-wallets.js';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowUpRight,ArrowLeft,Download,ShieldCheck,Wallet,Search,X,RefreshCw,ChevronRight,Copy,Check,Trophy} from 'lucide-react';
import DataFreshness from '../shared/DataFreshness';
import {WEEK,WEEKLY_FIRMS as TRACKED_FIRMS,rankWeekly,validSnapshot,weeklySources,weekStart as calendarWeekStart,weeklyBoard as calendarWeeklyBoard} from '../../lib/weekly-leaderboard.js';
import {SEASON_ONE,seasonDuration,seasonStart as weekStart,seasonKey as weekKey,seasonNumber,validSeasonKey,seasonBoard as weeklyBoard} from '../../lib/season-leaderboard.js';
import {FEATURED_TRADERS} from '../../lib/trader-profiles.js';
import WeeklyPoster,{range} from './WeeklyPoster';
import WeeklyAwards from './WeeklyAwards';
import {validWeeklyKey,validWeeklyEdition,weeklyAwardsUnlocked} from '../../lib/weekly-awards.js';
import MoonField from './MoonField';
import HalftonePortrait,{Moonlet} from './HalftonePortrait';
import VestMark from './VestMark';
import './leaderboard.css';
import {rankSeasonChanges} from '../../lib/season-changes.js';
import {BRAND_ASSETS} from '../../lib/brand-assets.js';

const WEEKLY_FIRMS=TRACKED_FIRMS.filter(f=>f.id==='vest');
const ROOT='https://raw.githubusercontent.com/deciphe/massiveprop/vestflow-data/';
const API='https://gigaprop-profiles.johnhuska1260335.chatgpt.site/api';
const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const short=a=>a.slice(0,6)+'…'+a.slice(-4);
const weekRange=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+' — '+new Date(s+WEEK-1).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
function initial(){const p=new URLSearchParams(window.location.hash.split('?')[1]||'');const w=p.get('season')||p.get('week');return {week:w&&validSeasonKey(w)?w:weekKey(weekStart()),view:p.get('view')==='weekly'?'weekly':'season',wallet:canonicalTraderWallet(p.get('wallet')),firm:'vest',card:p.get('card')||''};}
async function read(path,signal){for(const root of [ROOT,'./data/']){try{const r=await fetch(root+path+'?t='+Math.floor(Date.now()/300000),{signal:AbortSignal.any([signal,AbortSignal.timeout(8000)].filter(Boolean)),cache:'default'});if(r.ok)return await r.json();}catch{if(signal?.aborted)throw Error('Cancelled');}}throw Error('Snapshot unavailable');}
function Badges({firms}){return <span className="wk-badges">{WEEKLY_FIRMS.filter(f=>firms[f.id]).map(f=><span key={f.id} title={f.name+' · '+usd(firms[f.id])}><img src={f.logo} alt=""/>{f.name}</span>)}</span>}
const tagHref=profile=>profile?.tag&&/^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(profile.tag)?'https://'+profile.tag:null;
function TraderTag({profile,compact=false}){
 const href=tagHref(profile);
 if(!profile?.tag)return null;
 return href
  ?<a className={'wk-trader-tag wk-tag-link'+(compact?' wk-tag-compact':'')} href={href} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} aria-label={'Visit '+profile.tag}><span>{profile.tag}</span><ArrowUpRight size={compact?11:13}/></a>
  :<span className={'wk-trader-tag'+(compact?' wk-tag-compact':'')}><span>{profile.tag}</span></span>;
}
function Spark({row,start,duration}){
 let total=0;
 const data=[...row.transfers].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
 let line='0,46';
 for(const t of data){const x=(Date.parse(t.timestamp)-start)/duration*180;line+=` ${x},${46-total/row.total*40}`;total+=t.amount;line+=` ${x},${46-total/row.total*40}`;}
 return <svg className="wk-spark" viewBox="0 0 180 52" preserveAspectRatio="none" aria-hidden="true"><polyline points={line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/></svg>;
}
function DailyChange({row}){
 const label=!row.changeAvailable?'—':row.isNew?'NEW':row.rankChange>0?'↑'+row.rankChange:row.rankChange<0?'↓'+Math.abs(row.rankChange):'—';
 const tone=row.isNew||row.rankChange>0?'up':row.rankChange<0?'down':'flat';
 const detail=!row.changeAvailable?'A full 24 hours of this season is not available yet':row.isNew?'No eligible season payouts at the previous cutoff':'Rank #'+row.previousRank+' → #'+row.rank+' over 24 hours';
 return <span className="wk-daily">
  <span className={'wk-daily-cash '+(row.received24h===0?'wk-daily-zero':'')} title="Eligible USDC received in the 24 hours ending at the displayed data cutoff"><b>+{usd(row.received24h)}</b><em>usdc · 24h</em></span>
  <span className={'wk-daily-rank wk-daily-'+tone} title={detail} aria-label={detail}><b>{label}</b><em>rank · 24h</em></span>
 </span>;
}
export function PodiumCard({row:r,profiles,view,board,selectedWeekKey,week,start,seasonStart,onSelect,children,editionLabel}){
 const i=r.rank-1,profile=profiles[r.address];
 const place=view==='weekly'?['Week leader','Second place','Third place'][i]:board.closed?['Season no. 1','Second place','Third place'][i]:['Season leader','Second place','Third place'][i];
 const edition=editionLabel||(view==='weekly'?'Weekly / '+selectedWeekKey.slice(5):'Season select / '+week.slice(5));
 const pick=onSelect?()=>onSelect(r.address):undefined;
 return <div role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} className={'wk-podium-card wk-place-'+(i+1)} onClick={pick} onKeyDown={onSelect?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(r.address)}}:undefined}>
  <div className="wk-card-art">
   <div className="wk-podium-top"><span>{i===0?<Trophy size={14}/>:null}{place}</span><b>{String(r.rank).padStart(2,'0')}</b></div>
   {profile?.avatar?<HalftonePortrait className="wk-trader-portrait" src={profile.avatar}/>:<Moonlet className="wk-trader-portrait wk-moonlet" seed={r.address}/>}
   <span className="wk-monument-rank">{String(r.rank).padStart(2,'0')}</span>
   <span className="wk-card-edition">MASSIVE / {edition}</span>
  </div>
  <div className="wk-card-body">
   <div className="wk-card-who">
    <div className="wk-wallet-name">{profile?'@'+profile.username:short(r.address)}{profile?.verifiedAt&&<ShieldCheck size={16}/>}</div>
    <span className="wk-identity">{profile?.verifiedAt?'Wallet verified':profile?.editorial?'Featured trader':'Unclaimed wallet'}</span>
   </div>
   {profile?.tag?<TraderTag profile={profile}/>:<span className={'wk-trader-tag '+(profile?'wk-tag-none':'wk-tag-ghost')} aria-hidden={profile?'true':undefined}><span>{profile?'':'Unclaimed · open to claim'}</span></span>}
   <strong className="wk-podium-amount">{usd(r.total)}</strong>
   {children}
   <div className="wk-podium-foot"><Badges firms={r.firms}/><span>{r.count} {r.count===1?'payout':'payouts'}</span><Spark row={r} start={start} duration={view==='weekly'?WEEK:seasonDuration(seasonStart)}/></div>
  </div>
 </div>;
}
export default function Weekly(){
 const [route]=useState(initial),[week,setWeek]=useState(route.week),[view,setView]=useState(route.view),[firm,setFirm]=useState(route.firm),[snapshots,setSnapshots]=useState(null),[edition,setEdition]=useState(null),[weeks,setWeeks]=useState([]),[busy,setBusy]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[selected,setSelected]=useState(route.wallet),[profiles,setProfiles]=useState(FEATURED_TRADERS),[claim,setClaim]=useState(null),[poster,setPoster]=useState(null),[exporting,setExporting]=useState(false),[copied,setCopied]=useState(false),[history,setHistory]=useState(null);
 const [weeklyChoice,setWeeklyChoice]=useState(()=>{const k=new URLSearchParams(window.location.hash.split('?')[1]||'').get('weekly');return validWeeklyKey(k)?k:''}),[weeklyEditions,setWeeklyEditions]=useState([]),[weeklyArchive,setWeeklyArchive]=useState(null),[archiveOpen,setArchiveOpen]=useState(false),[archiveError,setArchiveError]=useState(''),[clock,setClock]=useState(Date.now()),[rankIntro,setRankIntro]=useState(true);
 const specialRow=route.card==='yush-overall'?{address:'0x701903615450b87e9ced7941abcb9dde54a69531',addresses:['0x701903615450b87e9ced7941abcb9dde54a69531'],raw:'85756732929',count:3,firms:{vest:85756.732929},transfers:[{id:'yush-3',raw:'62961827026',amount:62961.827026,timestamp:'2026-09-29T20:48:27.000Z',firm:'vest',chain:'Base',to:'0x701903615450b87e9ced7941abcb9dde54a69531'},{id:'yush-2',raw:'1138089427',amount:1138.089427,timestamp:'2026-09-28T13:34:35.000Z',firm:'vest',chain:'Base',to:'0x701903615450b87e9ced7941abcb9dde54a69531'},{id:'yush-1',raw:'21656816476',amount:21656.816476,timestamp:'2026-09-26T12:49:21.000Z',firm:'vest',chain:'Base',to:'0x701903615450b87e9ced7941abcb9dde54a69531'}],largest:62961.827026,rank:3,total:85756.732929,changeAvailable:false,received24h:0}:null;
 useEffect(()=>{const sync=()=>{const next=initial();setWeek(next.week);setView(next.view);setSelected(next.wallet);};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[]);
 const posterRef=useRef(null),dialog=useRef(null),refresh=useRef(()=>{});
 const seasonStart=Date.parse(week+'T00:00:00Z'),currentWeekStart=calendarWeekStart(clock),selectedWeekStart=weeklyChoice?Date.parse(weeklyChoice+'T00:00:00Z'):currentWeekStart,selectedWeekKey=new Date(selectedWeekStart).toISOString().slice(0,10),isPastWeek=selectedWeekStart<currentWeekStart,start=view==='weekly'?selectedWeekStart:seasonStart,live=view==='weekly'?!isPastWeek:week===weekKey(weekStart());
 useEffect(()=>{const timer=setTimeout(()=>setRankIntro(false),2500);return()=>clearTimeout(timer)},[]);
 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(timer)},[]);
 
 useEffect(()=>{if(view!=='weekly')return;const c=new AbortController();read('weekly-index.json',c.signal).then(d=>{if(!c.signal.aborted)setWeeklyEditions((d.weeks||[]).filter(w=>validWeeklyKey(w.week)&&w.closed))}).catch(()=>{});return()=>c.abort()},[view,currentWeekStart,snapshots]);
 useEffect(()=>{setWeeklyArchive(null);setArchiveError('');if(view!=='weekly'||!isPastWeek)return;const c=new AbortController();read('weekly/'+selectedWeekKey+'.json',c.signal).then(d=>{if(!validWeeklyEdition(d,selectedWeekKey))throw Error();if(!c.signal.aborted)setWeeklyArchive(d)}).catch(()=>{if(!c.signal.aborted)setArchiveError('This weekly edition is not available yet. Try again after the next payout refresh.')});return()=>c.abort()},[view,selectedWeekKey,isPastWeek,snapshots]);
 useEffect(()=>{const title=document.title;document.title=(view==='weekly'?'Weekly Top 20':'Vest Top 20')+' · MASSIVE Trader Rankings';return()=>{document.title=title}},[firm,view]);
 useEffect(()=>{const c=new AbortController();let running=false,previous={};const sources=weeklySources(firm);
 setSnapshots(null);
 async function run(){if(running)return;running=true;setBusy(true);
 try{
  const cached=await Promise.all(sources.map(async source=>{const old=previous[source.slug];try{const d=await read(source.slug+'.json',c.signal);return validSnapshot(d,source)&&(!old||Date.parse(d.windowEnd||d.updatedAt)>Date.parse(old.windowEnd||old.updatedAt))?d:old||null}catch{return old||null}}));
  if(c.signal.aborted)return;
  previous=Object.fromEntries(sources.map((s,i)=>[s.slug,cached[i]]));
  if(cached.every(Boolean))setSnapshots(previous);
  if(cached.every(Boolean)){setError('');}else if(!c.signal.aborted)setError('Shared snapshot unavailable. Keeping the last complete payout record.');
 }catch{if(!c.signal.aborted)setError('Live refresh unavailable. Showing the last complete payout record.');}
 finally{running=false;if(!c.signal.aborted)setBusy(false);}}
 read('season-index.json',c.signal).then(index=>{if(!c.signal.aborted)setWeeks((index.weeks||[]).filter(w=>validSeasonKey(w.week)))}).catch(()=>{});
 refresh.current=run;run();const onVisible=()=>{if(document.visibilityState==='visible')run()};document.addEventListener('visibilitychange',onVisible);const timer=setInterval(onVisible,300000);return()=>{c.abort();clearInterval(timer);document.removeEventListener('visibilitychange',onVisible)};
 },[firm]);
 useEffect(()=>{setEdition(previous=>previous?.week===week?previous:null);const c=new AbortController();read('seasons/'+week+'.json',AbortSignal.any([c.signal,AbortSignal.timeout(15000)])).then(d=>{if(d.available&&d.week===week&&!c.signal.aborted)setEdition(previous=>previous?.week===week&&Date.parse(previous.asOf)>Date.parse(d.asOf)?previous:d)}).catch(()=>{});return()=>c.abort()},[week,snapshots]);
 const computed=useMemo(()=>{
  if(!snapshots)return null;
  if(view==='weekly')return isPastWeek?null:calendarWeeklyBoard(snapshots,selectedWeekStart,clock,WEEK,firm,{live:true});
  return Number.isFinite(seasonStart)?weeklyBoard(snapshots,seasonStart,Date.now(),edition,firm,{live:true}):null;
 },[snapshots,view,selectedWeekStart,isPastWeek,clock,seasonStart,edition,firm]);
 const board=view==='weekly'?(isPastWeek?(weeklyArchive?.week===selectedWeekKey?weeklyArchive:null):(computed?.available?computed:null)):edition?.closed?edition:computed?.available&&(!edition||Date.parse(computed.asOf)>=Date.parse(edition.asOf))?computed:edition;
 const awardsUnlocked=view==='weekly'&&weeklyAwardsUnlocked(board,clock);
 const ranked=useMemo(()=>rankSeasonChanges(board,firm),[board,firm]);
 const vestFrequency=useMemo(()=>{
  const rows=rankWeekly(board,'vest').sort((a,b)=>b.count-a.count||b.total-a.total||a.address.localeCompare(b.address));
  return rows.length?{winner:rows[0],ties:rows.filter(r=>r.count===rows[0].count).length}:null;
 },[board]);
 const addresses=ranked.map(r=>r.address).join(',');
 useEffect(()=>{if(!addresses)return;const c=new AbortController(),all=addresses.split(','),chunks=[];for(let i=0;i<all.length;i+=100)chunks.push(all.slice(i,i+100));
 (async()=>{try{const found=[];for(let i=0;i<chunks.length;i+=4){const batch=await Promise.all(chunks.slice(i,i+4).map(async chunk=>{const r=await fetch(API+'/profiles?addresses='+encodeURIComponent(chunk.join(',')),{signal:c.signal});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.profiles))throw Error();return d.profiles}));found.push(...batch.flat());}if(!c.signal.aborted){const remote=Object.fromEntries(found.map(x=>{const address=x.address?.toLowerCase();return [address,{...x,address,...FEATURED_TRADERS[address]}]}));setProfiles(p=>({...p,...remote,...FEATURED_TRADERS}))}}catch{/* Remote claimed-profile lookup is optional; keep GitHub editorial profiles on failure. */}})();return()=>c.abort()},[addresses]);
 const limit=20;
 const filtered=query.trim()?ranked.filter(r=>traderWallets(r.address).some(a=>a.includes(query.trim().toLowerCase()))||profiles[r.address]?.username?.toLowerCase().includes(query.trim().replace('@','').toLowerCase())||profiles[r.address]?.displayName?.toLowerCase().includes(query.trim().toLowerCase())).slice(0,limit):ranked.slice(0,limit);
 const person=ranked.find(r=>r.address===selected),total=ranked.reduce((s,r)=>s+r.total,0),count=ranked.reduce((s,r)=>s+r.count,0),stale=board&&Date.now()-Date.parse(board.asOf)>3600000;
 useEffect(()=>{if(route.card==='yush-overall'&&!poster)setPoster(specialRow)},[route.card,poster]);
 useEffect(()=>{if((selected||poster||claim)&&dialog.current&&!dialog.current.open)dialog.current.showModal();else if(dialog.current?.open&&!selected&&!poster&&!claim)dialog.current.close()},[selected,poster,claim]);
 function close(){setSelected(null);setPoster(null);setClaim(null);setError('');}
 function shareOnX(row){
  const board=view==='weekly'?'weekly':'Season '+String(seasonNumber(seasonStart)).padStart(2,'0');
  const text=row?.address?'#'+String(row.rank).padStart(2,'0')+' on the MASSIVE '+board+' leaderboard. '+usd(row.total)+' in onchain Vest payouts.':'The MASSIVE trader leaderboard. Ranked by onchain Vest payouts.';
  return 'https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(linkFor(row?.address));
 }
 function linkFor(wallet){return location.origin+location.pathname+'#leaderboard?season='+week+'&firm='+firm+(view==='weekly'?'&view=weekly&weekly='+selectedWeekKey:'')+(wallet?'&wallet='+wallet:'');}
 async function copy(wallet){try{await navigator.clipboard.writeText(linkFor(wallet));setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setError('Could not copy link. You can copy the wallet address below.')}}
 async function download(){
  if(!posterRef.current)return;
  if(view==='weekly'&&route.card!=='yush-overall'&&(!weeklyAwardsUnlocked(board,Date.now())||(poster?.address&&!ranked.slice(0,3).some(r=>r.address===poster.address)))){setError('Weekly cards unlock after the completed results are confirmed.');return;}
  setExporting(true);setError('');
  try{
   const {toJpeg}=await import('html-to-image');
   await document.fonts.ready.catch(()=>{});
   const capture=view==='weekly'?posterRef.current.querySelector('.wk-award-canvas'):posterRef.current;
   if(!capture)throw Error('Missing card');
   const artwork=view==='weekly'?null:capture.querySelector('svg'),bounds=artwork?.viewBox.baseVal;
   if(view!=='weekly'&&(!bounds?.width||!bounds?.height))throw Error('Missing card dimensions');
   const width=view==='weekly'?capture.scrollWidth:capture.getBoundingClientRect().width,height=view==='weekly'?capture.scrollHeight:width*bounds.height/bounds.width;
   const baseOptions={quality:0.97,width,height,canvasWidth:width,canvasHeight:height,pixelRatio:(view==='season'&&firm==='vest'&&!poster?.address?1800:3600)/width,backgroundColor:'#1f1e1d',cacheBust:true,imagePlaceholder:'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',style:{margin:'0',padding:view==='weekly'&&!poster?.address?'24px':'0',border:'0',width:width+'px',height:height+'px',minHeight:'0',maxHeight:'none',maxWidth:'none',overflow:'hidden',transform:'none',boxSizing:'border-box'}};
   let url;
   // Fonts are self-hosted, so the renderer can embed them straight from the page stylesheet.
   try{url=await toJpeg(capture,baseOptions)}
   catch{url=await toJpeg(capture,{...baseOptions,skipFonts:true})}
   if(!url?.startsWith('data:image/jpeg'))throw Error('JPG render failed');
   const a=document.createElement('a');a.href=url;a.download=route.card==='yush-overall'?'massiveprop-yush-overall-rank-03.jpg':view==='weekly'?`massiveprop-week-${selectedWeekKey}-${firm}-${poster?.address?'rank-'+poster.rank:'top-3'}.jpg`:`massiveprop-season-${week}${poster?.address?'-rank-'+poster.rank:'-top'+limit}.jpg`;document.body.append(a);a.click();a.remove();
  }catch(err){
   console.error('Rank card export failed',err);
   setError('Image download failed. Reload once and try again.');
  }finally{setExporting(false)}
 }
 useEffect(()=>{setHistory(null);if(!selected||view==='weekly')return;const c=new AbortController();const old=weeks.filter(w=>w.closed&&w.week!==week).slice(0,8);Promise.all(old.map(async w=>{try{const b=await read('seasons/'+w.week+'.json',c.signal),r=rankWeekly(b,firm).find(r=>r.address===selected);return {week:w.week,start:w.start,row:r,available:true}}catch{return {week:w.week,start:w.start,available:false}}})).then(d=>{if(!c.signal.aborted)setHistory(d)});return()=>c.abort()},[selected,weeks,week,firm,view]);
 const name=r=>profiles[r.address]?'@'+profiles[r.address].username:short(r.address);
 const options=[...new Set([weekKey(weekStart()),...weeks.map(w=>w.week),week])].sort().reverse();
 const weeklyRange=weekRange(selectedWeekStart);
 const seasonLabel='Season '+String(seasonNumber(seasonStart)).padStart(2,'0');
 const period=view==='weekly'?(isPastWeek?'that week':'this week'):'this season';
 const firmName=WEEKLY_FIRMS.find(f=>f.id===firm)?.name;
 const clockSpan=view==='weekly'?WEEK:seasonDuration(seasonStart),clockNow=Math.min(Math.max(clock,start),start+clockSpan);
 const clockDays=Math.round(clockSpan/86400000),clockDay=Math.min(clockDays,Math.floor((clockNow-start)/86400000)+1);
 const clockPct=Math.round((clockNow-start)/clockSpan*100);
 const clockLabel=(view==='weekly'?'Week':seasonLabel)+' · day '+clockDay+' of '+clockDays;
 return <main className="wk">
 <MoonField/>
 <div className="wk-shell">
 {rankIntro&&<div className="wk-rank-wisp" role="status" aria-live="polite"><img src="./mascot/wisp.png" alt=""/><div className="wk-rank-wisp-copy"><span>The ledger is open</span><strong>Gathering the ranks.</strong></div><div className="wk-rank-wisp-progress" aria-hidden="true"><i/><i/><i/><i/><i/></div></div>}
 <header className="wk-nav">
  <a href="#" className="wk-brand">MASSIVE.</a>
  <a href="#leaderboard" className="wk-nav-title">Trader League</a>
  <a href="#flow" className="wk-flow-link">Flow trackers <ArrowUpRight size={14}/></a>
  <button className="wk-nav-claim" onClick={()=>setClaim({address:''})}><Wallet size={14}/> Claim profile</button>
 </header>
 <section className="wk-hero">
  <div className="wk-eyebrow"><span className="wk-dot"/>{view==='weekly'?(isPastWeek?'Weekly archive':'This week · live'):board?.closed?'Season results locked':'Ranked competition · live'}<i>{view==='weekly'?'Week / '+weeklyRange:seasonLabel+' / '+range(seasonStart)}</i></div>
  <div className="wk-hero-line">
   <div className="wk-hero-copy">
    <h1>The top <em>twenty.</em></h1>
    <p>Names worth <strong>knowing.</strong> <span>{view==='weekly'?'Ranked by eligible onchain payouts received during the selected week.':'Ranked by onchain payouts. Earned every season.'}</span></p>
   </div>
   <div className="wk-hero-side">
    <VestMark className="wk-vest-mark"/>
    <div className="wk-hero-panel">
     <div className="wk-league-seal"><strong>Vest. Three chains.</strong><span>Arbitrum · Base · Ethereum</span></div>
     <div className="wk-season-clock" role="img" aria-label={clockLabel+', '+clockPct+'% complete'}><div><span>{clockLabel}</span><b>{clockPct}%</b></div><i style={{'--wk-progress':clockPct+'%'}}/></div>
     <a className="wk-vest-offer" href="https://next.vestmarkets.com/r/isgigaprop" target="_blank" rel="sponsored noopener noreferrer" aria-label="Get 5% off Vest with the MASSIVE referral link"><span><strong>Your next place on the board.</strong><small>Vest · MASSIVE referral</small></span><b>5% off</b><ArrowUpRight size={16}/></a>
    </div>
   </div>
  </div>
  <div className="wk-overview">
   <div><strong>{board?usd(total):'—'}</strong><span>{view==='weekly'?'Weekly':'Season'} payouts · all profiles</span></div>
   <div><strong>{board?ranked.length.toLocaleString():'—'}</strong><span>payout profiles</span></div>
   <div><strong>{board?count.toLocaleString():'—'}</strong><span>individual payouts</span></div>
   <div className="wk-week">{view==='weekly'?<><label>Week / UTC</label><strong className="wk-week-current">{weeklyRange}</strong></>:<><label htmlFor="wk-week">Season editions / UTC</label><select id="wk-week" value={week} onChange={e=>{setWeek(e.target.value);setSelected(null)}}>{options.map(w=><option key={w} value={w}>{range(Date.parse(w+'T00:00:00Z'))}{w===weekKey(weekStart())?' · Live':''}</option>)}</select></>}</div>
  </div>
 </section>
 <div className="wk-toolbar">
  <div className="wk-view-switch" role="group" aria-label="Leaderboard period"><button className={view==='season'?'active':''} aria-pressed={view==='season'} onClick={()=>{setView('season');setSelected(null);setQuery('')}}>Season</button><button className={view==='weekly'?'active':''} aria-pressed={view==='weekly'} onClick={()=>{setView('weekly');setSelected(null);setQuery('')}}>Weekly <span>Top 20</span></button></div>
  <div className="wk-tabs" role="group" aria-label="Filter by firm">{[...WEEKLY_FIRMS].sort((a,b)=>(b.id==='vest')-(a.id==='vest')).map(f=><button key={f.id} className={firm===f.id?'active':''} aria-pressed={firm===f.id} onClick={()=>{setFirm(f.id);setQuery('')}}><img src={f.logo} alt=""/>{f.name}</button>)}</div>
  <DataFreshness compact asOf={board?.asOf} completeThrough={board?.completeThrough} busy={busy} onRefresh={()=>refresh.current()}/>
  {view==='season'&&<button className="wk-export" disabled={!board||!ranked.length} onClick={()=>setPoster({})}><Download size={14}/> Season image</button>}
 </div>
 {view==='weekly'&&<>
  <div className="wk-weekly-tools"><span>{weeklyRange} · UTC{isPastWeek?' · Past edition':''}</span><button className="wk-archive-toggle" aria-expanded={archiveOpen} aria-controls="wk-week-archive" onClick={()=>setArchiveOpen(v=>!v)}>Past weeks {archiveOpen?'−':'+'}</button></div>
  {archiveOpen&&<div id="wk-week-archive" className="wk-week-archive"><button className={!isPastWeek?'active':''} onClick={()=>{setWeeklyChoice('');setSelected(null);setPoster(null)}}>This week · Live</button>{weeklyEditions.filter(w=>Date.parse(w.week+'T00:00:00Z')<currentWeekStart).map(w=><button key={w.week} className={selectedWeekKey===w.week?'active':''} onClick={()=>{setWeeklyChoice(w.week);setSelected(null);setPoster(null)}}>{weekRange(Date.parse(w.week+'T00:00:00Z'))}</button>)}{!weeklyEditions.length&&<p>Completed weeks will appear here.</p>}</div>}
  {archiveError&&<p className="wk-refresh-note" role="status">{archiveError}</p>}
  <section className="wk-weekly-awards"><div className="wk-weekly-awards-head"><div><span>The weekly select</span><h3>Three places. <em>On the record.</em></h3></div><p>{awardsUnlocked?'Final results. Your weekly podium cards are ready.':isPastWeek?'Waiting for complete, confirmed weekly results.':'Downloads unlock after '+new Date(selectedWeekStart+WEEK).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZone:'UTC'})+' UTC, once final results are confirmed.'}</p></div><div className="wk-weekly-award-actions"><button disabled={!awardsUnlocked||ranked.length<3} onClick={()=>setPoster({})}><Download size={13}/> Top 3 card</button>{[1,2,3].map(rank=><button key={rank} disabled={!awardsUnlocked||!ranked[rank-1]} onClick={()=>setPoster(ranked[rank-1])}><Download size={13}/> #{rank} card</button>)}</div></section>
 </>}
 {board?<>
  <div className="wk-arena-title"><span>The podium</span><h2>{board.closed?(view==='weekly'?<>Weekly <em>finalists.</em></>:<>Season <em>finalists.</em></>):<>The race for <em>number one.</em></>}</h2><b>Top 03</b></div>
  <div className="wk-podium">{ranked.slice(0,3).map(r=><PodiumCard key={r.address} row={r} profiles={profiles} view={view} board={board} selectedWeekKey={selectedWeekKey} week={week} start={start} seasonStart={seasonStart} onSelect={setSelected}><DailyChange row={r}/></PodiumCard>)}</div>
  <div className="wk-table-title"><h2>{view==='weekly'?<>Weekly <em>top 20.</em></>:<>League <em>standings.</em></>} <span>{firmName}</span></h2><label className="wk-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a wallet or claimed name" aria-label="Search payout wallets"/></label></div>
  <div className="wk-table">
   <div className="wk-table-head"><span>Rank</span><span>Payout wallet</span><span>Firms</span><span className="wk-daily-heading">24h momentum</span><span>{view==='weekly'?'Week payouts':'Season payouts'}</span><span/></div>
   {filtered.length?filtered.map(r=><div className={'wk-row'+(r.rank<=3?' wk-row-top':'')} role="button" tabIndex={0} key={r.address} onClick={()=>setSelected(r.address)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(r.address)}}}>
    <span className="wk-rank">{String(r.rank).padStart(2,'0')}</span>
    <span className="wk-row-identity">
     {profiles[r.address]?.avatar?<img className="wk-row-portrait" src={profiles[r.address].avatar} alt="" loading="lazy"/>:<Moonlet className="wk-row-portrait wk-row-moonlet" seed={r.address}/>}
     <span className="wk-row-text"><strong>{name(r)}{profiles[r.address]?.verifiedAt&&<ShieldCheck size={13}/>}</strong><small>{traderWallets(r.address).length>1?traderWallets(r.address).length+' wallets combined':profiles[r.address]?short(r.address):'Claim this profile'} · {r.count} {r.count===1?'payout':'payouts'}</small></span>
     {profiles[r.address]?.tag&&<TraderTag profile={profiles[r.address]} compact/>}
    </span>
    <Badges firms={r.firms}/>
    <DailyChange row={r}/>
    <span className="wk-row-amount"><strong>{usd(r.total)}</strong></span>
    <ChevronRight size={15}/>
   </div>):<div className="wk-empty">{query?'No matching payout wallet in this edition.':'No eligible payouts in this period.'}</div>}
  </div>
 </>:<div className="wk-empty"><RefreshCw size={20}/><h2>{busy?'Reading the payout record…':'This edition is unavailable'}</h2><p>{busy?'Reading the selected firm’s payout history.':computed?.missing?.join(', ')||(view==='weekly'?'A complete snapshot is needed before we can rank this week.':'A complete snapshot is needed before we can rank this season.')}</p><button onClick={()=>refresh.current()}>Refresh</button></div>}
 <div className="wk-band">
  {vestFrequency&&(firm==='all'||firm==='vest')&&<button className="wk-frequent" title={'Most eligible Vest payout transfers '+period+'. Equal counts are ordered by total USDC received, then wallet address.'} onClick={()=>{setFirm('vest');setSelected(vestFrequency.winner.address)}} aria-label={'View '+name(vestFrequency.winner)+', most Vest payouts '+period}>
   <span className="wk-frequent-kicker">Vest / side quest{vestFrequency.ties>1?' / joint lead':''}</span>
   <span className="wk-frequent-copy"><strong>Frequent <em>withdrawer.</em></strong><span className="wk-frequent-joke">The withdraw button knows them by name.</span></span>
   <span className="wk-frequent-count"><b>{vestFrequency.winner.count.toLocaleString()}</b><span>individual payouts</span></span>
   <span className="wk-frequent-person"><b>{name(vestFrequency.winner)}</b><span>{usd(vestFrequency.winner.total)} received · {period}</span><ArrowUpRight size={17}/></span>
  </button>}
  <section className="wk-claim-compact"><span className="wk-frequent-kicker">On the board?</span><strong>Claim your <em>payout profile.</em></strong><p>Put your name on your wallet. Reviewed against your withdrawal confirmation and the onchain record.</p><button onClick={()=>setClaim({address:''})}>Claim profile <ArrowUpRight size={15}/></button></section>
 </div>
 <details className="wk-method"><summary>How the rankings work <span>Transparent rules. Public evidence.</span></summary><div><h3>{view==='weekly'?'Money received this week':'Money received this season'}</h3><p>{view==='weekly'?'Weekly mode ranks eligible USDC received from Monday 00:00 UTC through the current data cutoff, capped at the Top 20. ':''}Ranked by eligible USDC sent from our tracked Vest, Breakout, Hypernova and Propr wallets, in calendar-quarter seasons. The extended launch season runs September 1 through December 31, 2026, ending January 1, 2027 at 00:00 UTC (exclusive). From 2027, seasons run January–March, April–June, July–September and October–December. Each firm refreshes directly from its tracked blockchain sources. Its standings use the oldest complete cutoff among that firm’s sources; other firms do not hold it back. Archived records preserve earlier season history. These are payout-recipient rankings, not trading PnL, ROI or a measure of skill.</p><h3>What is included</h3><p>Known internal firm wallets, identified bridges and transfers below 0.01 USDC are excluded. Refunds, affiliate payments, unidentified treasury transfers and custodial addresses may remain until their purpose is confirmed. Each entry exposes its transaction evidence. Equal totals are ordered by wallet address. The 24h USDC figure counts eligible payouts in the 24 hours ending at the displayed common data cutoff; it is not trading profit. Rank movement compares season-to-date standings with standings 24 hours earlier, within the selected firm filter and across all eligible wallets. NEW means no eligible payouts at the earlier cutoff. Rank movement is unavailable during the first 24 hours of a season. Closed editions show their final 24 hours.</p><h3>Wallets and names</h3><p>Each receiving address is one entry unless MASSIVE explicitly groups multiple wallets under one owner-confirmed profile. Grouped profiles combine eligible payouts, payout counts and 24-hour changes across their listed wallets, supported chains and firms. Original receiving addresses and transactions remain visible. Grouping does not prove wallet control by signature. An address is not necessarily one person; shared or contract addresses can have different controllers. Wallet verified means a signature proved control on the listed chain at the verification time. It does not establish legal identity, firm endorsement or trading-account ownership. Profile submissions are reviewed manually by MASSIVE against withdrawal confirmation and onchain payout records before publication. Submission does not automatically verify wallet control. Requested names and tags are subject to review. Featured names and social avatars are editorial mappings supplied by MASSIVE; they do not receive a wallet-control badge without a signature. Unclaimed wallets remain eligible.</p><h3>Season editions</h3><p>Season records accumulate before source history rolls off. Closed editions preserve the recorded transactions; visible usernames may update as profiles are claimed. Historical editions at launch are reconstructed from available complete history. Rankings cover Vest payout wallets on Arbitrum, Base and Ethereum. No paid placement affects rank.</p><a href="mailto:gp@gigaprop.xyz?subject=Season%20leaderboard%20data%20correction">Report a data correction <ArrowUpRight size={13}/></a></div></details>
 {error&&<p className="wk-refresh-note" role="status">{error}</p>}
 <footer className="wk-footer"><a href="#" className="wk-brand">MASSIVE.</a><span>Public payouts. Independently ranked.</span><a href="#flow">Explore the evidence <ArrowUpRight size={13}/></a></footer>
 <dialog ref={dialog} className="wk-modal" onCancel={close} onClose={close}><button className="wk-close" onClick={close} aria-label="Close"><X size={20}/></button>
 {claim?<ClaimForm initialAddress={claim.address} onDone={close}/>:poster&&(board||route.card==='yush-overall')?<><div ref={posterRef} className="wk-poster"><i className="wk-font-probe" aria-hidden="true">.</i>{route.card==='yush-overall'?<WeeklyAwards board={{available:true,closed:true,start:SEASON_ONE,end:Date.parse('2027-01-01T00:00:00Z'),week:'2026-09-01',asOf:'2026-10-05T20:54:15.478Z',transfers:specialRow.transfers}} rows={[specialRow]} profiles={profiles} firm="vest" person={specialRow} renderCard={r=><PodiumCard row={r} profiles={profiles} view="season" board={{closed:false}} selectedWeekKey="2026-09-01" week="2026-09-01" start={SEASON_ONE} seasonStart={SEASON_ONE} editionLabel="OVERALL / VEST"/>}/>:view==='weekly'?<WeeklyAwards board={board} rows={ranked} profiles={profiles} firm={firm} person={poster.address?poster:null} renderCard={r=><PodiumCard row={r} profiles={profiles} view="weekly" board={board} selectedWeekKey={selectedWeekKey} week={week} start={start} seasonStart={seasonStart}/>}/>:<WeeklyPoster board={board} rows={ranked} profiles={profiles} firm={firm} person={poster.address?poster:null}/>}</div><button className="wk-primary" onClick={download} disabled={exporting||(view==='weekly'&&!awardsUnlocked&&route.card!=='yush-overall')}><Download size={15}/>{exporting?'Preparing JPG…':'Download 3600px JPG'}</button><div className="wk-profile-actions wk-poster-actions"><a href={shareOnX(poster)} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={14}/> Post on X</a><button onClick={()=>copy(poster.address)}>{copied?<Check size={14}/>:<Copy size={14}/>} Copy link</button></div></>:person?<><div className="wk-profile-label">{view==='weekly'?'WEEK RANK / '+selectedWeekKey:'SEASON RANK / '+week}</div>{profiles[person.address]?.avatar&&<img className="wk-profile-portrait" src={profiles[person.address].avatar} alt={profiles[person.address].displayName}/>}<div className="wk-profile-rank">#{String(person.rank).padStart(2,'0')}</div><h2>{name(person)}</h2><TraderTag profile={profiles[person.address]}/>{profiles[person.address]?.social&&<a className="wk-social" href={profiles[person.address].social} target="_blank" rel="noreferrer">View on X <ArrowUpRight size={12}/></a>}<div className="wk-profile-address">{traderWallets(person.address).length>1&&<strong>{traderWallets(person.address).length} wallets · combined payout record</strong>}{traderWallets(person.address).map(address=><div key={address}>{address}</div>)}</div><p className="wk-verification">{profiles[person.address]?.verifiedAt?<><ShieldCheck size={14}/> Wallet control verified · chain {profiles[person.address].chainId} · {new Date(profiles[person.address].verifiedAt).toLocaleDateString()}</>:profiles[person.address]?.editorial?'Featured by MASSIVE · wallet ownership supplied by site owner':'Unclaimed wallet · public payout record'}</p><strong className="wk-profile-total">{usd(person.total)}</strong><DailyChange row={person}/><Badges firms={person.firms}/><div className="wk-profile-actions">{(view==='season'||person.rank<=3)&&<button disabled={view==='weekly'&&!awardsUnlocked} onClick={()=>{setSelected(null);setPoster(person)}}><Download size={14}/>{view==='weekly'?(awardsUnlocked?'Weekly podium card':'Unlocks after week closes'):'Rank card'}</button>}<button onClick={()=>copy(person.address)}>{copied?<Check size={14}/>:<Copy size={14}/>} Copy profile link</button><a href={shareOnX(person)} target="_blank" rel="noopener noreferrer"><ArrowUpRight size={14}/> Post on X</a><button onClick={()=>{setSelected(null);setClaim({address:person.address})}}><Wallet size={14}/>{profiles[person.address]?.verifiedAt?'Manage name':'Claim profile'}</button></div>{view==='season'&&<div className="wk-history"><h3>Previous editions</h3>{history===null?<p>Loading season record…</p>:history.length?history.map(h=><button key={h.week} onClick={()=>setWeek(h.week)}><span>{range(h.start)}</span><b>{!h.available?'Unavailable':h.row?'#'+h.row.rank+' · '+usd(h.row.total):'No eligible payouts'}</b></button>):<p>This is the earliest available edition.</p>}</div>}<h3 className="wk-evidence-title">Payout evidence <span>{person.count} transfers</span></h3><div className="wk-evidence">{person.transfers.map(t=><a key={t.id} href={t.explorer+'/tx/'+t.hash} target="_blank" rel="noopener noreferrer"><span>{WEEKLY_FIRMS.find(f=>f.id===t.firm)?.name}<small>{new Date(t.timestamp).toLocaleString()} · {t.chain}{traderWallets(person.address).length>1?' · to '+short(t.to):''}</small></span><b>{usd(t.amount)}</b><ArrowUpRight size={13}/></a>)}</div></>:selected?<div className="wk-empty">{busy?'Loading wallet…':'This wallet has no eligible payouts in the selected edition or filter.'}</div>:null}{error&&<p className="wk-alert" role="status">{error}</p>}
 </dialog>
 </div></main>;
}
function ClaimForm({initialAddress,onDone}){
 const [wallets,setWallets]=useState(()=>initialAddress?traderWallets(initialAddress):['']),[twitter,setTwitter]=useState(''),[displayName,setDisplayName]=useState(''),[tag,setTag]=useState(''),[email,setEmail]=useState(''),[proof,setProof]=useState(''),[agree,setAgree]=useState(false),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
 const submitted=useRef(false),submissionTimer=useRef(null),waitingRef=useRef(null);
 useEffect(()=>{
  if(!busy)return;
  waitingRef.current?.scrollIntoView({block:'nearest',behavior:'auto'});
  const warnBeforeLeaving=e=>{e.preventDefault();e.returnValue='';};
  window.addEventListener('beforeunload',warnBeforeLeaving);
  return()=>window.removeEventListener('beforeunload',warnBeforeLeaving);
 },[busy]);
 useEffect(()=>()=>{if(submissionTimer.current)clearTimeout(submissionTimer.current)},[]);
 const walletList=wallets.map(w=>w.trim().toLowerCase()).filter(Boolean);
 const primaryWallet=walletList[0]||'';
 function updateWallet(index,value){setWallets(current=>current.map((wallet,i)=>i===index?value.trim():wallet))}
 function addWallet(){setWallets(current=>current.length>=10?current:[...current,''])}
 function removeWallet(index){setWallets(current=>current.length===1?current:current.filter((_,i)=>i!==index))}
 function submittedFrameLoaded(e){
  if(!submitted.current)return;
  try{
   const url=e.currentTarget.contentWindow?.location?.href||'';
   if(!url.startsWith(location.origin+'/claim-received.html'))return;
  }catch{return}
  submitted.current=false;if(submissionTimer.current)clearTimeout(submissionTimer.current);setBusy(false);setSent(true);setStatus('Submitted for review. MASSIVE will check your withdrawal against the onchain record before publishing your profile.');
 }
 async function submit(e){
  e.preventDefault();if(busy||sent)return;if(!agree){setStatus('Check the consent box before submitting.');return;}
  const form=e.currentTarget,input=form.elements.attachment,attachment=input?.files?.[0];
  if(form.elements._honey?.value)return;
  if(!walletList.length){setStatus('Add at least one payout wallet.');return;}
  if(walletList.some(wallet=>!/^0x[a-f0-9]{40}$/.test(wallet))){setStatus('Check each payout wallet. Every address must be a complete 0x address.');return;}
  if(new Set(walletList).size!==walletList.length){setStatus('Remove duplicate wallet addresses before submitting.');return;}
  if(!attachment?.size){setStatus('Attach a screenshot of your Vest withdrawal confirmation email.');return;}
  if(attachment.size>10*1024*1024){setStatus('Please use an image under 10 MB.');return;}
  if(!['image/png','image/jpeg','image/webp'].includes(attachment.type)){setStatus('Use a PNG, JPG or WebP screenshot.');return;}
  setBusy(true);setStatus('Sending your screenshot and profile…');
  const controller=new AbortController();
  if(submissionTimer.current)clearTimeout(submissionTimer.current);
  submissionTimer.current=setTimeout(()=>controller.abort(),45000);
  try{
   const data=new FormData(form);
   data.set('attachment_filename',attachment.name||'withdrawal-proof');
   data.set('attachment_bytes',String(attachment.size));
   data.set('attachment_type',attachment.type||'unknown');
   // FormSubmit's AJAX endpoint gives us a real response instead of relying on
   // a cross-origin iframe redirect that mobile browsers can leave unresolved.
   data.delete('_next');
   const response=await fetch('https://formsubmit.co/ajax/gp@gigaprop.xyz',{method:'POST',body:data,headers:{Accept:'application/json'},signal:controller.signal});
   const result=await response.json().catch(()=>null);
   if(!response.ok||![true,'true'].includes(result?.success))throw Error(result?.message||('FormSubmit returned '+response.status));
   if(submissionTimer.current)clearTimeout(submissionTimer.current);
   submitted.current=false;setBusy(false);setSent(true);setStatus('Submitted for review. MASSIVE will check your withdrawal against the onchain record before publishing your profile.');
  }catch(error){
   if(submissionTimer.current)clearTimeout(submissionTimer.current);
   submitted.current=false;setBusy(false);
   setStatus(error?.name==='AbortError'?'FormSubmit timed out. Nothing was marked received — please try again.':'FormSubmit rejected the submission. Please try again.');
   console.error('MASSIVE profile claim submission failed',error);
  }
 }
 if(sent)return <div className="wk-claim-form wk-submission wk-submission-success" role="status" aria-live="polite"><div className="wk-success-mark"><Check size={32}/></div><span className="wk-profile-label">PROFILE CLAIM / RECEIVED</span><h2>Submission received.</h2><p>Your claim is in. MASSIVE will review the withdrawal confirmation and combine the approved payout wallets into one leaderboard profile.</p><div className="wk-success-wallet wk-success-wallets"><span>{walletList.length===1?'Submitted wallet':walletList.length+' submitted wallets'}</span><div>{walletList.map(wallet=><strong key={wallet}>{short(wallet)}</strong>)}</div></div><p className="wk-claim-note">You do not need to submit again. If anything is missing, MASSIVE will follow up using the contact email you provided.</p><button className="wk-primary wk-success-done" type="button" onClick={onDone}><Check size={16}/> Done</button></div>;
 return <form className="wk-claim-form wk-submission" onSubmit={submit} action="https://formsubmit.co/ajax/gp@gigaprop.xyz" method="POST" encType="multipart/form-data"><ShieldCheck size={30}/><span className="wk-profile-label">VEST / MANUAL PROFILE REVIEW</span><h2>Put your name on it.</h2><p>Submit your Vest withdrawal confirmation and every payout wallet you want under the profile. MASSIVE will cross-reference the receiving addresses onchain before publishing them as one combined identity.</p>
 <input name="_honey" type="text" tabIndex={-1} autoComplete="off" style={{display:'none'}} aria-hidden="true"/>
 <input type="hidden" name="_captcha" value="false"/>
  <input type="hidden" name="_subject" value={'MASSIVE VEST PROFILE REVIEW — @'+twitter.trim().replace(/^@/,'')}/>
 <input type="hidden" name="source" value="massiveprop.xyz/#leaderboard"/>
 <input type="hidden" name="consent" value="I agree to publication of the approved profile details and payout wallet(s)."/>
 <input type="hidden" name="payout_wallet" value={primaryWallet}/>
 <input type="hidden" name="payout_wallets" value={walletList.join('\n')}/>
 <input type="hidden" name="wallet_count" value={walletList.length}/>
 <input type="hidden" name="twitter" value={'@'+twitter.trim().replace(/^@/,'')}/>
 <input type="hidden" name="display_name" value={displayName.trim()}/>
 <input type="hidden" name="tag" value={tag.trim()}/>
 <input type="hidden" name="email" value={email.trim()}/>
 <input type="hidden" name="withdrawal_confirmation" value={proof.trim()}/>
 <div className="wk-wallet-group">
  <div className="wk-wallet-heading"><span>Payout wallet addresses</span><small>{walletList.length>1?walletList.length+' wallets':'Primary first'}</small></div>
  {wallets.map((wallet,index)=><div className="wk-wallet-entry" key={index}><div className="wk-wallet-entry-label"><span>{index===0?'Primary wallet':'Wallet '+(index+1)}</span>{index===0&&<small>canonical profile wallet</small>}</div><div className="wk-wallet-entry-control"><input required pattern="0x[a-fA-F0-9]{40}" maxLength={42} value={wallet} disabled={busy||sent} onChange={e=>updateWallet(index,e.target.value)} placeholder="0x…" autoComplete="off" aria-label={index===0?'Primary payout wallet':'Additional payout wallet '+(index+1)}/>{wallets.length>1&&<button type="button" className="wk-wallet-remove" onClick={()=>removeWallet(index)} disabled={busy||sent} aria-label={'Remove wallet '+(index+1)}><X size={14}/></button>}</div></div>)}
  <button type="button" className="wk-add-wallet" onClick={addWallet} disabled={busy||sent||wallets.length>=10}>+ Add another wallet</button>
  <small className="wk-wallet-help">Add up to 10 addresses. The first wallet is the canonical profile address; approved wallets are combined into one payout total and one leaderboard rank.</small>
 </div>
 <label>Contact email<input required type="email" maxLength={254} value={email} disabled={busy||sent} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
 <label>Twitter / X @<input required pattern="@?[A-Za-z0-9_]{1,15}" maxLength={16} value={twitter} disabled={busy||sent} onChange={e=>setTwitter(e.target.value)} placeholder="@yourhandle" autoComplete="off"/></label>
 <label>Desired display name<input required maxLength={40} value={displayName} disabled={busy||sent} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name on the board"/></label>
 <label>Desired tag <small>optional</small><input maxLength={40} value={tag} disabled={busy||sent} onChange={e=>setTag(e.target.value)} placeholder="#YOURGANG or yourbrand.com"/></label>
 <label>Withdrawal email screenshot<input name="attachment" type="file" required accept="image/png,image/jpeg,image/webp" disabled={sent}/><small>PNG, JPG or WebP · up to 10 MB</small></label>
 <label>Additional payout details (optional)<textarea maxLength={5000} rows={5} value={proof} disabled={busy||sent} onChange={e=>setProof(e.target.value)} placeholder="Include the withdrawal amount, date and receiving address. Add the transaction hash if available."/></label>
 <p className="wk-claim-note">Keep the payout details visible and remove unrelated personal information. If you added multiple wallets, use the details box to explain the connection if helpful. Your confirmation and contact email are sent through FormSubmit to MASSIVE for review, not published on the leaderboard.</p>
 <label className="wk-consent"><input type="checkbox" required checked={agree} disabled={busy||sent} onChange={e=>setAgree(e.target.checked)}/>I agree to my approved name, Twitter @, tag and payout wallet(s) appearing publicly as one combined profile.</label>
 {busy&&<div ref={waitingRef} className="wk-wisp-wait" role="status" aria-live="polite"><div className="wk-wisp-wait-art" aria-hidden="true"><img src="./mascot/wisp.png" alt=""/></div><div className="wk-wisp-wait-copy"><span>WISP’S ON IT<span className="wk-wisp-wait-dots" aria-hidden="true"><i/><i/><i/></span></span><strong>Don’t leave me yet.</strong><p>Keep this window open until you see <b>“Submission received.”</b></p></div></div>}
 <button className="wk-primary" disabled={busy||sent} type="submit">{busy?'Submitting…':'Submit profile for review'}<ArrowUpRight size={15}/></button>
 <p className="wk-claim-note">Your profile goes live after manual approval. No wallet connection or signature needed.</p><p role="status" className="wk-claim-status">{status}</p></form>;
}
