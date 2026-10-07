import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {VEST_CHAINS} from '../src/lib/flow-config.js';
const dest=process.argv[2]||'public/data';
// Keep the history already captured, even after it leaves the rolling window.
// Closed season/weekly editions also seed payout records on the first run.
const historical=[];
for(const directory of ['weekly','seasons']){
 for(const name of await readdir(`${dest}/${directory}`).catch(()=>[])){
  if(!name.endsWith('.json'))continue;
  const edition=JSON.parse(await readFile(`${dest}/${directory}/${name}`,'utf8'));
  historical.push(...(edition.transfers||[]).filter(t=>t.firm==='vest'));
 }
}
for(const source of VEST_CHAINS){
 const snapshot=JSON.parse(await readFile(`${dest}/${source.slug}.json`,'utf8'));
 if(!snapshot.complete||snapshot.wallet!==source.wallet||snapshot.chain!==source.chain)throw Error('Invalid ledger source '+source.slug);
 const rows=[...historical.filter(t=>t.chain===source.chain&&t.from===source.wallet),...snapshot.transfers];
 const months=new Map();
 for(const t of rows){const month=t.timestamp.slice(0,7);if(!/^\d{4}-\d{2}$/.test(month))throw Error('Invalid ledger date');if(!months.has(month))months.set(month,[]);months.get(month).push(t);}
 const root=`${dest}/ledger/${source.slug}`;await mkdir(root,{recursive:true});
 for(const [month,rows] of months){
  const path=`${root}/${month}.json`;let prior={transfers:[]};
  try{prior=JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  const transfers=new Map(prior.transfers.map(t=>[`${t.hash}:${t.logIndex}`,t]));
  for(const t of rows)transfers.set(`${t.hash}:${t.logIndex}`,{...t,id:`${t.hash}:${t.logIndex}`});
  await writeFile(path,JSON.stringify({schema:1,wallet:source.wallet,token:source.token,chain:source.chain,month,updatedAt:snapshot.updatedAt,transfers:[...transfers.values()].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp))}));
 }
 console.log(`${source.slug}: retained ${months.size} monthly ledger partitions`);
}
