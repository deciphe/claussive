import {renderToStaticMarkup} from 'react-dom/server';
import EmailRankCard from './EmailRankCard';
import {useState} from 'react';
import defaults from '../../data/email-test-profile.json';
import {emailHtml} from '../../lib/leaderboard-email.js';
import {seasonKey,seasonNumber,seasonStart} from '../../lib/season-leaderboard.js';
import './email-test.css';
const fields=[['twitter','X handle','text'],['name','Display name','text'],['tag','Tag','text'],['rank','Sample rank','number'],['total','Sample USDC received','number'],['payouts','Sample payouts','number'],['image','Profile image URL','url']];
function initial(){try{const raw=new URLSearchParams(location.hash.split('?')[1]||'').get('profile')||localStorage.getItem('gp-email-test');return {...defaults,...JSON.parse(raw||'{}')}}catch{return defaults}}
export default function EmailTest(){
 const [profile,setProfile]=useState(initial),[status,setStatus]=useState('');
 const start=seasonStart(),trader={twitter:String(profile.twitter).replace(/^@/,''),name:profile.name,tag:profile.tag,avatar:profile.image,avatarSource:profile.image};
 const row={rank:Number(profile.rank)||20,total:Number(profile.total)||0,count:Number(profile.payouts)||0};
 const html=emailHtml({trader,row,season:seasonKey(start),seasonNumber:seasonNumber(start),test:true,rankCardHtml:renderToStaticMarkup(<EmailRankCard trader={trader} row={row} season={seasonKey(start)}/>)});
 function change(key,value){const next={...profile,[key]:['rank','total','payouts'].includes(key)?Number(value):value};setProfile(next);try{localStorage.setItem('gp-email-test',JSON.stringify(next))}catch{}setStatus('')}
 async function copy(){try{await navigator.clipboard.writeText(JSON.stringify(profile,null,2));setStatus('Copied. In GitHub, run “Test leaderboard email” and paste into Profile JSON.')}catch{setStatus('Copy the profile JSON below.')}}
 return <main className="gp-email-test"><header><a href="#">MASSIVE.</a><span>EMAIL STUDIO / TEST PROFILE</span><a href="#leaderboard">Leaderboard ↗</a></header><div className="gp-email-test-layout"><section><span className="gp-email-kicker">MASSIVE / PRIVATE DRAFT ON THIS DEVICE</span><h1>Your first send.</h1><p>Build your sample profile. Preview the exact email, then send a test to your MASSIVE inbox.</p><form onSubmit={e=>{e.preventDefault();copy()}}>{fields.map(([key,label,type])=><label key={key}>{label}<input type={type} required={key!=='tag'} min={key==='rank'?1:0} max={key==='rank'?999:undefined} step={key==='total'?'0.01':type==='number'?'1':undefined} maxLength={type==='text'?key==='twitter'?16:60:undefined} value={profile[key]} onChange={e=>change(key,e.target.value)}/></label>)}<button type="submit">Copy test profile</button></form><a className="gp-email-run" href="https://github.com/deciphe/massiveprop/actions/workflows/leaderboard-email-test.yml" target="_blank" rel="noreferrer">Run email test in GitHub ↗</a><p className="gp-email-note">Test delivery: gp@gigaprop.xyz. The GitHub workflow needs your RESEND_API_KEY repository secret. Your browser never receives the key.</p><p role="status">{status}</p><details><summary>Profile JSON</summary><pre>{JSON.stringify(profile,null,2)}</pre></details></section><section className="gp-email-preview"><div>SAMPLE DATA · NOT A LIVE LEADERBOARD ENTRY</div><iframe title="Exact leaderboard email preview" srcDoc={html} sandbox=""/></section></div></main>;
}
