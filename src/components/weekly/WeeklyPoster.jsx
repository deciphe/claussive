import {traderWallets} from '../../lib/trader-wallets.js';
import {WEEKLY_FIRMS} from '../../lib/weekly-leaderboard.js';
import {seasonEnd,seasonNumber} from '../../lib/season-leaderboard.js';
const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const short=a=>a.slice(0,6)+'…'+a.slice(-4);
export const range=s=>new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+' — '+new Date(seasonEnd(s)-1).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});

// Shareable season artwork: one trader's rank card, or the full standings.
// Pure SVG so it renders the same on the page, in the JPG export and in email.
const INK='#faf9f5',DIM='#b0aea5',FAINT='#8f8d85',GOLD='#e2cb97',VIOLET='#b3a6d6',BG='#1f1e1d';
const SANS='Archivo,Manrope,system-ui,sans-serif',SERIF="'Instrument Serif',Georgia,serif";
// small tracked capitals for labels; expanded black for display
const mono=(size,fill=DIM)=>({fontSize:size-1.5,fontWeight:600,letterSpacing:1.3,fill,style:{textTransform:'uppercase'}});
const WIDE={fontStretch:'125%'};

export default function WeeklyPoster({board,rows,profiles,firm,person}){
 const list=person?[person]:rows.slice(0,firm==='vest'?100:15),h=person?760:412+list.length*66;
 const label=firm==='all'?'all firms':WEEKLY_FIRMS.find(f=>f.id===firm)?.name.toLowerCase();
 const houses=person?WEEKLY_FIRMS.filter(f=>person.firms[f.id]):[];
 const champion=Boolean(person&&person.rank===1);
 const profile=person?profiles[person.address]:null;
 const season=Number.isFinite(board.start)?'season '+String(seasonNumber(board.start)).padStart(2,'0'):'season';
 const wallets=person?traderWallets(person.address):[];
 const handle=person?(profile?'@'+profile.username:short(person.address)):'';
 return <svg xmlns="http://www.w3.org/2000/svg" width="1200" height={h} viewBox={`0 0 1200 ${h}`} role="img" aria-label="MASSIVE season payout rank card" style={{display:'block',width:'100%',height:'auto',margin:'0 auto',fontFamily:SANS}}>
 <defs>
  <pattern id="wk-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2.3" fill="#fff"/></pattern>
  <radialGradient id="wk-moon-fill" gradientUnits="userSpaceOnUse" cx="1150" cy="1860" r="1700"><stop offset=".76" stopColor="#9a8fbd" stopOpacity=".05"/><stop offset=".9" stopColor="#a99bc6" stopOpacity=".2"/><stop offset=".965" stopColor="#d9cba8" stopOpacity=".55"/><stop offset="1" stopColor="#eee0be" stopOpacity=".95"/></radialGradient>
  <mask id="wk-dot-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height={h}><rect width="1200" height={h} fill="url(#wk-dots)"/></mask>
  <radialGradient id="wk-haze-gold" gradientUnits="userSpaceOnUse" cx="430" cy="330" r="520"><stop stopColor={GOLD} stopOpacity=".2"/><stop offset="1" stopColor={GOLD} stopOpacity="0"/></radialGradient>
  <radialGradient id="wk-haze-violet" gradientUnits="userSpaceOnUse" cx="1160" cy="20" r="560"><stop stopColor={VIOLET} stopOpacity=".24"/><stop offset="1" stopColor={VIOLET} stopOpacity="0"/></radialGradient>
  <linearGradient id="wk-portrait-fade"><stop stopColor="black"/><stop offset=".5" stopColor="white"/><stop offset="1" stopColor="white"/></linearGradient>
  <linearGradient id="wk-portrait-bottom" x2="0" y2="1"><stop stopColor="black"/><stop offset=".18" stopColor="white"/><stop offset=".6" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
  <mask id="wk-portrait-mask" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#wk-portrait-fade)"/></mask>
  <mask id="wk-portrait-foot" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#wk-portrait-bottom)"/></mask>
  <filter id="wk-mono" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values=".34 .56 .14 0 0  .31 .53 .13 0 0  .36 .58 .16 0 .02  0 0 0 1 0"/></filter>
  <clipPath id="wk-round" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath>
  <clipPath id="wk-panel"><rect x="40" y="96" width="1120" height="524" rx="22"/></clipPath>
 </defs>
 <rect width="1200" height={h} fill={BG}/>
 <rect width="1200" height={h} fill="url(#wk-haze-violet)"/>
 <rect width="1200" height={Math.min(h,900)} fill="url(#wk-haze-gold)"/>
 <g mask="url(#wk-dot-mask)"><circle cx="1150" cy="1860" r="1700" fill="url(#wk-moon-fill)"/></g>
 <text x="56" y="68" fontSize="34" fontWeight="900" letterSpacing="-2" fill={INK} style={WIDE}>MASSIVE.</text>
 <text x="1144" y="64" textAnchor="end" {...mono(12)}>{season} · {label} · {board.closed?'closed edition':'live edition'}</text>
 {person?<>
 <rect x="40" y="96" width="1120" height="524" rx="22" fill="#141413" fillOpacity=".74" stroke={champion?GOLD:INK} strokeOpacity={champion?.5:.16}/>
 {profile?.avatar&&<g clipPath="url(#wk-panel)"><g mask="url(#wk-portrait-foot)"><image href={profile.avatar} x="780" y="96" width="380" height="380" preserveAspectRatio="xMidYMid slice" filter="url(#wk-mono)" mask="url(#wk-portrait-mask)"/></g></g>}
 <text x="84" y="152" {...mono(13,champion?GOLD:DIM)}>season rank</text>
 <text x="72" y="474" fontSize={person.rank>99?190:300} fontWeight="900" letterSpacing={person.rank>99?-12:-20} fill={champion?GOLD:INK} style={WIDE}>{String(person.rank).padStart(2,'0')}</text>
 <text x="84" y="572" {...mono(14)}>A place on the record.</text>
 <text x="530" y="300" fontSize={handle.length>16?36:handle.length>11?46:56} fontWeight="800" letterSpacing="-2" fill={INK} style={{fontStretch:'108%'}}>{handle}</text>
 <text x="532" y="332" {...mono(13)}>{profile?.verifiedAt?'wallet control verified':profile?.editorial?'featured by MASSIVE':'unclaimed payout wallet'}</text>
 {profile?.tag&&<text x="532" y="374" fontFamily={SERIF} fontStyle="italic" fontSize="26" fill={GOLD}>{profile.tag}</text>}
 <line x1="532" x2="1120" y1="404" y2="404" stroke={INK} strokeOpacity=".16"/>
 <text x="528" y="498" fontSize="80" fontWeight="800" letterSpacing="-4" fill={INK} style={{fontStretch:'112%'}}>{usd(person.total)}</text>
 <text x="532" y="536" {...mono(13)}>usdc received · {person.count} {person.count===1?'payout':'payouts'}</text>
 {houses.map((f,i)=><g key={f.id} transform={`translate(${532+i*110} 562)`}><image href={f.logo} width="20" height="20" preserveAspectRatio="xMidYMid meet"/><text x="28" y="15" {...mono(13)}>{f.name.toLowerCase()}</text></g>)}
 {wallets.slice(0,wallets.length>2?1:2).map((address,i)=><text key={address} x="56" y={654+i*18} fontSize="12.5" fontWeight="500" letterSpacing=".4" fill={INK}>{address}{wallets.length>1?' / wallet '+(i+1):''}</text>)}
 {wallets.length>2&&<text x="56" y="672" {...mono(12)}>+ {wallets.length-1} more wallets combined</text>}
 <text x="1144" y="654" textAnchor="end" fontSize="15" fontWeight="600" fill={INK}>massiveprop.xyz/#leaderboard</text>
 <text x="1144" y="676" textAnchor="end" {...mono(12)}>{range(board.start)} · utc</text>
 </>:<>
 <text x="52" y="182" fontSize="72" fontWeight="900" letterSpacing="-4" fill={INK} style={{...WIDE,textTransform:'uppercase'}}>The top <tspan fill={GOLD}>{firm==='vest'?'hundred.':'fifteen.'}</tspan></text>
 <text x="58" y="222" {...mono(13)}>{range(board.start)} · utc</text>
 {list.map((r,i)=>{const p=profiles[r.address],y=252+i*66;return <g key={r.address}>
  <rect x="40" y={y} width="1120" height="58" rx="12" fill="#141413" fillOpacity={i<3?.78:.6} stroke={i===0?GOLD:INK} strokeOpacity={i===0?.5:.1}/>
  <text x="62" y={y+38} fontSize="22" fontWeight="900" letterSpacing="-1" fill={i<3?GOLD:FAINT} style={WIDE}>{String(r.rank).padStart(2,'0')}</text>
  {p?.avatar?<image href={p.avatar} x="118" y={y+9} width="40" height="40" preserveAspectRatio="xMidYMid slice" clipPath="url(#wk-round)" filter="url(#wk-mono)"/>:<circle cx="138" cy={y+29} r="19" fill="none" stroke={INK} strokeOpacity=".3" strokeDasharray="1.5 4" strokeLinecap="round" strokeWidth="1.5"/>}
  <text x="174" y={y+37} fontSize={p?.username?.length>14?19:23} fontWeight="600" letterSpacing="-.5" fill={INK}>{p?'@'+p.username:short(r.address)}</text>
  <text x="640" y={y+35} {...mono(12)}>{Object.keys(r.firms).map(id=>WEEKLY_FIRMS.find(f=>f.id===id)?.name.toLowerCase()).join(' · ')} · {r.count} {r.count===1?'payout':'payouts'}</text>
  <text x="1138" y={y+38} textAnchor="end" fontSize="24" fontWeight="800" letterSpacing="-1" fill={INK} style={{fontStretch:'112%'}}>{usd(r.total)}</text>
 </g>})}
 </>}
 <line x1="56" x2="1144" y1={h-58} y2={h-58} stroke={INK} strokeOpacity=".14"/>
 <text x="56" y={h-30} {...mono(11)}>eligible usdc received · recipient ranking, not trading pnl · as of {new Date(board.asOf).toISOString().replace('T',' ').slice(0,16)} utc · known internal wallets, bridges and dust excluded</text>
 {!person&&<text x="1144" y={h-74} textAnchor="end" fontSize="15" fontWeight="600" fill={INK}>massiveprop.xyz/#leaderboard</text>}
 </svg>;
}
